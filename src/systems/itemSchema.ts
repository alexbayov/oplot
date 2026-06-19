// M13 PR-3: Zod-схема для content/items.json под новую таксономию билдов.
//
// Описывает целевой контракт M13: discriminatedUnion по полю `kind` с шестью
// ветками (material | component | consumable | weapon | armor | tool). PR-3
// фиксирует контракт; миграция содержимого content/items.json под этот
// контракт — задача PR-4, тогда же validateItemShapes() вайрится в BootScene
// soft-warn-ом (в PR-3 на boot не дёргаем: валидатор всегда падал бы на 187
// предметах старой схемы, и реальная новая ошибка спряталась бы среди
// ожидаемых).
//
// Slot-енумы:
// - weapon: barrel | action | stock | mod — модульные части оружия.
// - armor:  plate | strap | helm — модульные части брони.
//
// Слой аффиксов — два разных понятия, не путать:
// - intrinsic_affixes (здесь, на шаблоне) — авторские, детерминированные,
//   для уникальных частей: scout_vest всегда +carry_kg, headlamp всегда
//   +scavenge_chance. Это контентная фича шаблона, попадает в items.json,
//   валидируется этой схемой. Потолок .max(3) — это ceiling, не roll-count.
// - random affixes (в PR-4/5, на инстансе) — 0-2 ролла по тиру верстака
//   (30/60/90%), один раз в момент крафта на СОБРАННОЕ оружие/комплект, не
//   по каждой части. Живут в сейве крафченого инстанса, в шаблон не пишутся
//   и схемой шаблонов не валидируются. Контракт ролла приземлится вместе с
//   крафт-логикой и сейв-моделью в PR-4/5.
//
// component.stats: namerennoe `z.object({}).strict().optional()` — форма
// детерминированного стат-блока компонентов осознанно отложена до PR-4
// (там появятся первые реальные компоненты и станет видно, какие поля
// нужны). Добавление полей в опциональный stats-объект — аддитивная
// backward-compat правка, та же логика что для слот-енумов.

import { z } from "zod";

const tierSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

const intrinsicAffixSchema = z.object({
  id: z.string().min(1),
  value: z.number(),
});

const commonItemFields = {
  id: z.string().min(1),
  name_ru: z.string().min(1),
  tier: tierSchema,
  weight_kg: z.number().nonnegative(),
  zone_origin: z.string().min(1),
  description_ru: z.string(),
  flavor_ru: z.string().optional(),
  recipe_id: z.string().nullable(),
  // D3 (PR-5): durability_max несётся optional на каждом предмете.
  // Система durability будет приварена в PR-6 вместе с крафт-UI; пока
  // поле гарантирует что авторские значения (13 предметов в каталоге
  // на момент миграции) не теряются при первом проходе.
  durability_max: z.number().int().positive().optional(),
} as const;

export const WEAPON_SLOTS = ["barrel", "action", "stock", "mod"] as const;
export const ARMOR_SLOTS = ["plate", "strap", "helm"] as const;

const weaponSlotSchema = z.enum(WEAPON_SLOTS);
const armorSlotSchema = z.enum(ARMOR_SLOTS);

const materialSchema = z.object({
  kind: z.literal("material"),
  ...commonItemFields,
  stats: z.object({}).strict().optional(),
});

// M13 PR-6a: component.stats — additive scalar contribution на ключи
// целевого kind. Ассемблер суммирует по ключам, потом применяет floor
// (damage_min ≥ 0, итог clamp). Multiplier и roll-range-per-part
// отклонены: первый порядко-зависим без базы, второй — rng-внутри-rng
// без потребителя (формула sortieResolve читает только damage_avg).
//
// weight_kg ОТСУТСТВУЕТ в contribute — собранное оружие весит ровно
// sum(part.weight_kg) из commonItemFields. Одно «вес» на одно поле,
// без семантического пересечения.
//
// M16 PR-1: `accuracy` добавлен — additive scalar, как damage. Ассемблер
// суммирует `part.stats.accuracy` в `WeaponInstance.stats.accuracy`,
// который входит в `computeHeroPower` через `accuracyToPowerFactor`
// (sortieResolve). Процентный мод по-прежнему отклонён в пользу additive
// (порядко-независимость); процент живёт в combat-формуле, не на части.
//
// weight_kg ОСТАЁТСЯ вне contribute — combat-вес собранного оружия =
// sum(part.weight_kg) из commonItemFields (см. assembleWeapon), без
// семантического пересечения.
const componentSchema = z.object({
  kind: z.literal("component"),
  ...commonItemFields,
  fits: z.enum(["weapon", "armor"]),
  stats: z
    .object({
      damage_min: z.number().int().optional(),
      damage_max: z.number().int().optional(),
      accuracy: z.number().int().optional(),
      durability_max: z.number().int().nonnegative().optional(),
    })
    .strict()
    .optional(),
});

// D1 (PR-5): consumable.stats несёт ЛИБО {effect_value, charges} для
// «использовать» (бинты, аптечки, патроны, адреналин), ЛИБО
// {damage_min, damage_max} для бросаемых (гранаты, молотов). 4 бросаемых
// в каталоге на момент миграции: rgd5/f1/rgo/craft_molotov.
//
// `effect_type` — z.enum, не свободный string. Без enum опечатки в
// эффекте проходят молча и баг ищется через QA, а не падает на boot.
// Расширять enum по мере добавления новых эффектов — backward-compat.
//
// Если у бросаемых появятся фьюз/радиус/AoE — выделить в kind
// `throwable`. Сейчас refine это временный мост чтобы не плодить kind
// ради 4 предметов (2% каталога) без активных потребителей формы.
const CONSUMABLE_EFFECT_TYPES = [
  "heal",
  "ammo_refill",
  "initiative_boost",
  "cover_boost",
  "mech_disable",
  "explosive_thrown",
  "incendiary_thrown",
] as const;

const consumableStatsSchema = z
  .object({
    effect_type: z.enum(CONSUMABLE_EFFECT_TYPES),
    effect_value: z.number().optional(),
    charges: z.number().int().positive().optional(),
    damage_min: z.number().nonnegative().optional(),
    damage_max: z.number().nonnegative().optional(),
  })
  .refine(
    (s) => {
      const isThrowable =
        s.effect_type === "explosive_thrown" ||
        s.effect_type === "incendiary_thrown";
      if (isThrowable) {
        return (
          typeof s.damage_min === "number" && typeof s.damage_max === "number"
        );
      }
      return (
        typeof s.effect_value === "number" && typeof s.charges === "number"
      );
    },
    {
      message:
        "consumable: throwable требует {damage_min, damage_max}; иначе {effect_value, charges}",
    },
  );

const consumableSchema = z.object({
  kind: z.literal("consumable"),
  ...commonItemFields,
  stats: consumableStatsSchema,
});

const weaponSchema = z.object({
  kind: z.literal("weapon"),
  ...commonItemFields,
  slot: weaponSlotSchema,
  // M16 PR-1: `accuracy` optional на каталог-оружии под будущее (M17+),
  // НЕ заполняется в M16 (craft depth = crafted-only). Отсутствует →
  // резолвер подставит ACCURACY_BASELINE ⇒ factor 1.0 ⇒ zero regression.
  // Schema-поле заведено сейчас, чтобы авторская accuracy на found-стволах
  // не требовала второго bump'а.
  stats: z
    .object({
      damage_min: z.number().nonnegative().optional(),
      damage_max: z.number().nonnegative().optional(),
      accuracy: z.number().int().optional(),
    })
    .optional(),
  intrinsic_affixes: z.array(intrinsicAffixSchema).max(3).optional(),
});

const armorSchema = z.object({
  kind: z.literal("armor"),
  ...commonItemFields,
  slot: armorSlotSchema,
  stats: z
    .object({
      armor_value: z.number().nonnegative().optional(),
    })
    .optional(),
  intrinsic_affixes: z.array(intrinsicAffixSchema).max(3).optional(),
});

const toolSchema = z.object({
  kind: z.literal("tool"),
  ...commonItemFields,
  stats: z
    .object({
      tool_type: z.string().min(1),
      uses: z.number().int().positive().optional(),
    })
    .optional(),
});

export const itemSchema = z.discriminatedUnion("kind", [
  materialSchema,
  componentSchema,
  consumableSchema,
  weaponSchema,
  armorSchema,
  toolSchema,
]);

export const itemsFileSchema = z.array(itemSchema);

export type M13Item = z.infer<typeof itemSchema>;
export type M13ItemKind = M13Item["kind"];
