#!/usr/bin/env node
// M13 PR-6a — populate component.stats (contribute_*) для 60 партов + 8 модов.
//
// Источник истины: docs/redesign/M13-OP1-part-contributions.json
// Методология: docs/redesign/M13-OP1-PART-CONTRIBUTIONS.md (Slack #ross
// OP1 table by Alex, 2026-06-14):
//
//   Per-family exact anchor — для каждого из 15 семейств
//   sum(parts.damage_min/max) == catalog.damage_min/max ровно.
//   DMG-парт (*_barrel/slide) ~75% damage, STRUCT (*_receiver/frame)
//   ~25% damage + ~50% durability, aux (mag/bolt/stock/scope/...)
//   0 damage + остаток durability.
//
//   Парирует damage с каталогом, размен идёт через durability: caталог
//   firearm = вечный (`durability_max=undefined`), crafted = -1/encounter.
//
//   Suppressors (mod_pbs_universal/mod_pbs1) = -1/-1 damage (единственный
//   реальный consumer на момент M13 — damage; silent benefit приедет с
//   noise model в M14). Прочие моды = {} (нет consumer-а в sortieResolve).
//
// Запуск (idempotent — повторный run на уже-заполненных партах no-op):
//   node tools/migrations/populate_part_contributions.mjs

import { readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const ITEMS_PATH = resolve(ROOT, "content/items.json");
const CONTRIBUTIONS_PATH = resolve(
  ROOT,
  "docs/redesign/M13-OP1-part-contributions.json",
);

const main = async () => {
  const itemsRaw = await readFile(ITEMS_PATH, "utf8");
  const items = JSON.parse(itemsRaw);
  const contribRaw = await readFile(CONTRIBUTIONS_PATH, "utf8");
  const contributions = JSON.parse(contribRaw);

  let populated = 0;
  let skippedNonComponent = 0;
  let skippedAlreadyPopulated = 0;
  let notFoundInTable = 0;
  const missingComponents = [];

  const next = items.map((item) => {
    if (item.kind !== "component") {
      // Только component-предметы получают stats. Прочие 119 предметов
      // (material/consumable/weapon/armor/tool) не трогаются.
      skippedNonComponent += 1;
      return item;
    }
    const entry = contributions[item.id];
    if (!entry) {
      // Парт не описан в таблице — оставляем stats как был. На момент
      // полного покрытия не должно быть ни одного case-а, но defensively
      // не трём существующий stats.
      notFoundInTable += 1;
      missingComponents.push(item.id);
      return item;
    }
    // Idempotency: если stats уже непуст (повторный запуск), пересобираем
    // целиком из таблицы — это переписывает «вручную подкрученные»
    // значения, но источник истины — таблица, не диск.
    const hadStats = item.stats && Object.keys(item.stats).length > 0;
    if (hadStats) skippedAlreadyPopulated += 1;
    populated += 1;

    // strict schema: только разрешённые ключи, undefined-ы режем.
    const nextStats = {};
    if (typeof entry.damage_min === "number") nextStats.damage_min = entry.damage_min;
    if (typeof entry.damage_max === "number") nextStats.damage_max = entry.damage_max;
    if (typeof entry.durability_max === "number")
      nextStats.durability_max = entry.durability_max;

    return { ...item, stats: nextStats };
  });

  await writeFile(ITEMS_PATH, JSON.stringify(next, null, 2) + "\n", "utf8");

  console.log(`populated ${populated} component-items from contributions table`);
  console.log(`  of which already had stats (overwritten): ${skippedAlreadyPopulated}`);
  console.log(`  skipped non-component items: ${skippedNonComponent}`);
  if (notFoundInTable > 0) {
    console.log(`  component-items NOT in table (left as-is): ${notFoundInTable}`);
    console.log(`    ${missingComponents.join(", ")}`);
  }
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
