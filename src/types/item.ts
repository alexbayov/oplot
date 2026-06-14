// M13 PR-5: `Item` теперь синоним M13Item (см. systems/itemSchema.ts).
//
// До PR-5 здесь жила legacy-форма с дискриминатором `type`
// (resource | weapon_melee | weapon_ranged | armor | consumable) и
// слоем M11Item поверх через ItemRegistry-адаптер. Оба слоя снесены в
// PR-5: items.json теперь под itemSchema, рантайм-код читает `kind`.
//
// Все типы — re-export из itemSchema, чтобы был один источник истины
// и схема + типы автоматически согласованы (z.infer).

import type { M13Item, M13ItemKind } from "../systems/itemSchema";

export type Item = M13Item;
export type ItemKind = M13ItemKind;
export type ItemTier = 1 | 2 | 3 | 4 | 5;

// Узкие алиасы по kind для мест где удобно разделить дискриминацию
// (InventoryScene tooltip, sortie weapon/armor read).
export type MaterialItem = Extract<Item, { kind: "material" }>;
export type ComponentItem = Extract<Item, { kind: "component" }>;
export type ConsumableItem = Extract<Item, { kind: "consumable" }>;
export type WeaponItem = Extract<Item, { kind: "weapon" }>;
export type ArmorItem = Extract<Item, { kind: "armor" }>;
export type ToolItem = Extract<Item, { kind: "tool" }>;
