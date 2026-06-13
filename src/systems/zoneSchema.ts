// M13 PR-2: Zod-схема для content/zones.json.
//
// Валидирует структуру зоны, в том числе loot_profile.base_weights — что веса
// не отрицательные и в категории попадают только допустимые ключи. Применяется
// в тестах (см. src/systems/__tests__/zonesContent.test.ts) и на boot — boot
// падает мягко, с понятной ошибкой, если в `content/zones.json` что-то поехало.

import { z } from "zod";

const baseCategorySchema = z.enum(["water", "fuel", "metal", "food", "other"]);

const lootProfileSchema = z.object({
  base_weights: z
    .record(baseCategorySchema, z.number().nonnegative())
    .refine((w) => Object.values(w).some((v) => (v ?? 0) > 0), {
      message: "loot_profile.base_weights должен содержать хотя бы один ненулевой вес",
    }),
});

const zoneLevelSchema = z.object({
  depth: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  enemies: z.array(z.string()),
  enemy_count: z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]),
  resources: z.array(z.string()),
  resource_count: z.tuple([z.number().int().nonnegative(), z.number().int().nonnegative()]),
  min_player_level: z.number().int().nonnegative(),
  is_gas: z.boolean().optional(),
});

export const zoneSchema = z.object({
  id: z.string().min(1),
  name_ru: z.string().min(1),
  level: z.number().int().positive(),
  description_ru: z.string(),
  resources: z.array(z.string()),
  mobs: z.array(z.string()),
  boss_id: z.string().nullable(),
  unique_resources: z.array(z.string()),
  levels: z.array(zoneLevelSchema).min(1),
  unlock_condition: z.string().min(1),
  return_time_multiplier: z.number().positive().optional(),
  daily_reset_hours: z.number().positive().optional(),
  gas_damage_per_turn: z.number().nonnegative().optional(),
  is_gas: z.boolean().optional(),
  zone_tier_range: z.tuple([z.number().int().positive(), z.number().int().positive()]).optional(),
  loot_profile: lootProfileSchema.optional(),
});

export const zonesFileSchema = z.array(zoneSchema).min(1);

export type ZoneShape = z.infer<typeof zoneSchema>;
