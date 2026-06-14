#!/usr/bin/env node
// M13 PR-5: миграция content/items.json под itemSchema (kind-таксономия).
//
// Маппинг из замороженной таблицы (Slack #ross 2026-06-14):
//
//   legacy type (n)   → kind        slot/fits           stats M13
//   ──────────────────────────────────────────────────────────────
//   resource (38)     → material    —                   {}
//   ammo (7)          → material    —                   {}            caliber→drop
//   weapon_part (60)  → component   fits:weapon         {}            contribute_*→PR-6
//   modification (8)  → component   fits:weapon         {}            mod→PR-6
//   armor (15)        → armor       slot helm/plate/strap {armor_value}  defense→armor_value
//   weapon_ranged (21)→ weapon      slot=action         {damage_min,damage_max}
//   weapon_melee (11) → weapon      slot=action         {damage_min,damage_max}
//   consumable·use(23)→ consumable  —                   {effect_type,effect_value,charges}
//   consumable·throw(4)→consumable  —                   {effect_type,damage_min,damage_max}
//
// Полная диспозиция полей и обоснование стрипа — Slack memo
// "M13-PR5-ITEMS-MIGRATION-MAPPING.md" + комментарий к PR-5.
//
// Запуск (idempotent — повторный запуск на уже-мигрированных данных no-op):
//   node tools/migrations/migrate_items_to_m13.mjs

import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const ITEMS_PATH = resolve(ROOT, "content/items.json");

// D-armor (Slack #ross 2026-06-14): slot per id. helm = маски/шлемы;
// plate = жилеты/куртки/штаны корпусной защиты; strap = перчатки/щиты/штаны
// акcессорной защиты. default plate если правило не сработает (catch-all).
const ARMOR_SLOT_BY_ID = {
  cloth_jacket: "plate",
  leather_vest: "plate",
  ballistic_vest: "plate",
  gas_mask: "helm",
  helmet: "helm",
  insulated_vest: "plate",
  medical_gown: "plate",
  metal_helm: "helm",
  padded_coat: "plate",
  reinforced_gloves: "strap",
  riot_shield: "strap",
  scout_mask: "helm",
  tactical_pants: "strap",
  tactical_vest: "plate",
  captain_armor: "plate",
};

// Общие поля сохраняются on-by-on (не spread исходника — иначе legacy-ключи
// просочатся через `.strict()` тихим стрипом и схема молча уберёт их).
const pickCommon = (item) => {
  const out = {
    id: item.id,
    name_ru: item.name_ru,
    tier: item.tier,
    weight_kg: item.weight_kg,
    zone_origin: item.zone_origin,
    description_ru: item.description_ru,
    recipe_id: item.recipe_id ?? null,
  };
  if (typeof item.flavor_ru === "string") out.flavor_ru = item.flavor_ru;
  if (typeof item.durability_max === "number")
    out.durability_max = item.durability_max;
  return out;
};

const toMaterial = (item) => ({
  kind: "material",
  ...pickCommon(item),
  stats: {},
});

const toComponent = (item) => ({
  kind: "component",
  ...pickCommon(item),
  fits: "weapon",
  stats: {},
});

const toArmor = (item) => {
  const slot = ARMOR_SLOT_BY_ID[item.id] ?? "plate";
  const defense = item.stats?.defense;
  const armorValue =
    typeof item.stats?.armor_value === "number"
      ? item.stats.armor_value
      : typeof defense === "number"
        ? defense
        : undefined;
  const stats = typeof armorValue === "number" ? { armor_value: armorValue } : {};
  return {
    kind: "armor",
    ...pickCommon(item),
    slot,
    stats,
  };
};

const toWeapon = (item) => {
  const damageMin = item.stats?.damage_min;
  const damageMax = item.stats?.damage_max;
  const stats = {};
  if (typeof damageMin === "number") stats.damage_min = damageMin;
  if (typeof damageMax === "number") stats.damage_max = damageMax;
  return {
    kind: "weapon",
    ...pickCommon(item),
    slot: "action",
    stats,
  };
};

const toConsumable = (item) => {
  const s = item.stats ?? {};
  let effectType = s.effect_type;
  // craft_molotov не несёт effect_type в legacy-данных. Per D1
  // (Slack memo) ему приписывается incendiary_thrown.
  if (!effectType && item.id === "craft_molotov") {
    effectType = "incendiary_thrown";
  }
  const isThrowable =
    effectType === "explosive_thrown" || effectType === "incendiary_thrown";

  if (isThrowable) {
    return {
      kind: "consumable",
      ...pickCommon(item),
      stats: {
        effect_type: effectType,
        damage_min: s.damage_min ?? 0,
        damage_max: s.damage_max ?? 0,
      },
    };
  }

  return {
    kind: "consumable",
    ...pickCommon(item),
    stats: {
      effect_type: effectType,
      effect_value: typeof s.effect_value === "number" ? s.effect_value : 0,
      charges: typeof s.charges === "number" ? s.charges : 1,
    },
  };
};

const migrateOne = (item) => {
  // Idempotency: уже-мигрированные предметы несут `kind`. Пропускаем без
  // изменений. Позволяет запускать скрипт повторно без потери ручных правок.
  if (typeof item.kind === "string") return item;

  switch (item.type) {
    case "resource":
    case "ammo":
      return toMaterial(item);
    case "weapon_part":
    case "modification":
      return toComponent(item);
    case "armor":
      return toArmor(item);
    case "weapon_ranged":
    case "weapon_melee":
      return toWeapon(item);
    case "consumable":
      return toConsumable(item);
    default:
      throw new Error(`unknown legacy type for ${item.id}: ${item.type}`);
  }
};

const main = async () => {
  const raw = await readFile(ITEMS_PATH, "utf8");
  const items = JSON.parse(raw);
  const migrated = items.map(migrateOne);

  // Counts по kind для PR-описания.
  const byKind = migrated.reduce((acc, it) => {
    acc[it.kind] = (acc[it.kind] ?? 0) + 1;
    return acc;
  }, {});

  await writeFile(ITEMS_PATH, JSON.stringify(migrated, null, 2) + "\n", "utf8");

  console.log(`migrated ${migrated.length} items`);
  for (const [k, n] of Object.entries(byKind).sort()) {
    console.log(`  ${k.padEnd(11)} ${n}`);
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
