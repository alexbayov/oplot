// M13 PR-3: Zod-схема для content/items.json под новую таксономию билдов.
//
// Описывает целевой контракт M13: discriminatedUnion по полю `kind` с шестью
// ветками (material | component | consumable | weapon | armor | tool). PR-3
// фиксирует контракт; миграция содержимого content/items.json под этот
// контракт — задача PR-4. Поэтому на boot validateItemShapes() обернут в
// мягкий warn: на сегодня items.json целиком на старой схеме, ругань ожидаема
// и говорит, что данные ещё не переехали.
//
// Slot-енумы:
// - weapon: barrel | action | stock | mod — модульные части оружия.
// - armor:  plate | strap | helm — модульные части брони.
// Аффиксы (опционально) — минимальный список {id, value} для PR-3, расширим
// под нужды баланса в PR-4 после миграции.

import { z } from "zod";

const tierSchema = z.union([
  z.literal(1),
  z.literal(2),
  z.literal(3),
  z.literal(4),
  z.literal(5),
]);

const affixSchema = z.object({
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

const componentSchema = z.object({
  kind: z.literal("component"),
  ...commonItemFields,
  fits: z.enum(["weapon", "armor"]),
  stats: z.object({}).strict().optional(),
});

const consumableSchema = z.object({
  kind: z.literal("consumable"),
  ...commonItemFields,
  stats: z.object({
    effect_type: z.string().min(1),
    effect_value: z.number(),
    charges: z.number().int().positive(),
  }),
});

const weaponSchema = z.object({
  kind: z.literal("weapon"),
  ...commonItemFields,
  slot: weaponSlotSchema,
  stats: z
    .object({
      damage_min: z.number().nonnegative().optional(),
      damage_max: z.number().nonnegative().optional(),
    })
    .optional(),
  affixes: z.array(affixSchema).max(3).optional(),
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
  affixes: z.array(affixSchema).max(3).optional(),
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
