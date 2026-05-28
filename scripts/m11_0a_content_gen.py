#!/usr/bin/env python3
"""
M11.0a content generator.

Читает текущие items/recipes/mobs.json, добавляет всё новое из
docs/redesign/m11/M11.0-weapons.md §3-§7 и §11.2, сохраняет.

Идемпотентно: если ID уже существует — перезаписывает (для re-runs во время доработки).
"""
import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parent.parent
ITEMS = ROOT / "content" / "items.json"
RECIPES = ROOT / "content" / "recipes.json"
MOBS = ROOT / "content" / "mobs.json"


# ════════════════════════════════════════════════════════════════════
# I. MIGRATION MAP (M-1: проверка против реального items.json)
# ════════════════════════════════════════════════════════════════════
# Спека §11.2. Перепроверено против items.json:
# - `flare_gun` исправлено → `flare_pistol` (реальный ID)
# - `kuvalda` НЕ существует, в items.json есть `sledgehammer` → используем `sledgehammer`
# - `ammo`, `microchips`, `painkiller` НЕ существуют в items.json → no-op (оставляем для будущего)

MIGRATION_MAP: dict[str, str] = {
    # Resources (renames)
    "scrap": "scrap_metal",
    "food": "canned_food",
    "oil": "machine_oil",
    "ammo": "ammo_9x18",  # legacy generic ammo, no-op если нет
    # Craft weapons (rename + reclassify)
    "knife": "craft_knife",
    "shiv": "craft_shiv",
    "machete": "craft_machete",
    "sawed_off": "craft_sawed_off",
    "makeshift_pistol": "craft_makeshift_pistol",
    "pipe_rifle": "craft_pipe_rifle",
    "composite_blade": "craft_composite_blade",
    "sledgehammer": "craft_sledge",   # M-1 fix: kuvalda → sledgehammer (реальный ID)
    "crowbar": "craft_crowbar",
    "crossbow": "craft_crossbow",
    "spear": "craft_spear",
    "flare_pistol": "craft_flare_gun",  # M-1 fix: flare_gun → flare_pistol (реальный ID)
    # Drop weapons (rename + reclassify, becomes assembled)
    "hunting_rifle": "rifle_t3_hunting",
}


# ════════════════════════════════════════════════════════════════════
# II. SAMODELI (§2-§3 craft weapons, 8 шт)
# ════════════════════════════════════════════════════════════════════
SAMODELI: list[dict[str, Any]] = [
    {
        "id": "craft_shiv", "tier": 1, "weight": 0.4,
        "name_ru": "Заточка", "name_real_ru": "Заточка", "name_generic_ru": "Заточка",
        "weapon_type": "weapon_melee", "damage_min": 3, "damage_max": 6,
        "durability_max": 8, "caliber": "melee",
        "ingredients": [{"item_id": "scrap_metal", "count": 2}, {"item_id": "cloth", "count": 1}],
        "description_ru": "Полоска заточенной арматуры с обмоткой. Дёшева, ломкая — после 8 ударов отлетает.",
        "flavor_ru": "«Не оружие. Жест отчаяния, который иногда срабатывает.»",
    },
    {
        "id": "craft_makeshift_pistol", "tier": 1, "weight": 1.5,
        "name_ru": "Поджига", "name_real_ru": "Поджига", "name_generic_ru": "Поджига 9×18",
        "weapon_type": "weapon_ranged", "damage_min": 5, "damage_max": 8,
        "durability_max": 6, "caliber": "9x18",
        "ingredients": [
            {"item_id": "scrap_metal", "count": 4}, {"item_id": "wood", "count": 1},
            {"item_id": "gunpowder", "count": 2}
        ],
        "description_ru": "Обрезок трубы, гвоздь-боёк, деревянная рукоять. Бьёт 9×18, после 6 выстрелов сваривается намертво — больше не разрядишь.",
        "flavor_ru": "«Один выстрел — две молитвы. Иногда срабатывает.»",
    },
    {
        "id": "craft_pipe_rifle", "tier": 2, "weight": 3.0,
        "name_ru": "Трубка", "name_real_ru": "Трубка", "name_generic_ru": "Трубка 7.62×39",
        "weapon_type": "weapon_ranged", "damage_min": 9, "damage_max": 14,
        "durability_max": 10, "caliber": "7.62x39",
        "ingredients": [
            {"item_id": "scrap_metal", "count": 6}, {"item_id": "wood", "count": 2},
            {"item_id": "gunpowder", "count": 3}, {"item_id": "rope", "count": 1}
        ],
        "description_ru": "Длинная труба, импровизированный замок, приклад из обрубка. Бьёт 7.62×39 на ~15м. 10 выстрелов до разлёта замка.",
        "flavor_ru": "«Главное — не держать у щеки.»",
    },
    {
        "id": "craft_sawed_off", "tier": 2, "weight": 2.5,
        "name_ru": "Обрез", "name_real_ru": "Обрез", "name_generic_ru": "Обрез 12 калибра",
        "weapon_type": "weapon_ranged", "damage_min": 14, "damage_max": 22,
        "durability_max": 12, "caliber": "12ga",
        "ingredients": [
            {"item_id": "scrap_metal", "count": 5}, {"item_id": "wood", "count": 2},
            {"item_id": "machine_oil", "count": 1}
        ],
        "description_ru": "Самопальный двуствол из обрезанного ИЖ-43. 12 калибр, грохот на весь район, но снайпер с пятиметровки — всухую.",
        "flavor_ru": "«В упор — Бог. На двадцати — мусор.»",
    },
    {
        "id": "craft_spear", "tier": 1, "weight": 1.5,
        "name_ru": "Копьё", "name_real_ru": "Копьё", "name_generic_ru": "Копьё",
        "weapon_type": "weapon_melee", "damage_min": 4, "damage_max": 7,
        "durability_max": 15, "caliber": "melee",
        "ingredients": [{"item_id": "wood", "count": 3}, {"item_id": "scrap_metal", "count": 1}],
        "description_ru": "Длинная палка с привязанным наконечником. Длина = дистанция = шанс.",
        "flavor_ru": "«Когда враг — собака, метр становится километром.»",
    },
    {
        "id": "craft_crossbow", "tier": 2, "weight": 2.0,
        "name_ru": "Арбалет", "name_real_ru": "Арбалет", "name_generic_ru": "Арбалет",
        "weapon_type": "weapon_ranged", "damage_min": 7, "damage_max": 11,
        "durability_max": 60, "caliber": "thrown",
        "ingredients": [
            {"item_id": "wood", "count": 4}, {"item_id": "scrap_metal", "count": 3},
            {"item_id": "rope", "count": 2}
        ],
        "description_ru": "Самодельный арбалет: автомобильная рессора, лыжа от детских санок, тетива из жилы. Тихий, но взводится долго.",
        "flavor_ru": "«Тихо — это не страшно. Страшно — это потом.»",
    },
    {
        "id": "craft_flare_gun", "tier": 1, "weight": 0.6,
        "name_ru": "Хлопушка", "name_real_ru": "Хлопушка", "name_generic_ru": "Сигнальный пистолет",
        "weapon_type": "weapon_ranged", "damage_min": 2, "damage_max": 5,
        "durability_max": 1, "caliber": "thrown",
        "ingredients": [
            {"item_id": "scrap_metal", "count": 2}, {"item_id": "gunpowder", "count": 2}
        ],
        "description_ru": "Сигнальная ракетница, перенастроенная на боевую. Один выстрел — и всё, корпус трескается. Зато ослепляет и поджигает.",
        "flavor_ru": "«Прощальный жест.»",
    },
    {
        "id": "craft_molotov", "tier": 1, "weight": 0.5,
        "name_ru": "Молотов", "name_real_ru": "Молотов", "name_generic_ru": "Бутылка с зажигательной смесью",
        "weapon_type": "consumable", "damage_min": 8, "damage_max": 14,
        "durability_max": 1, "caliber": "thrown",
        "ingredients": [
            {"item_id": "cloth", "count": 1}, {"item_id": "machine_oil", "count": 2},
            {"item_id": "gunpowder", "count": 1}
        ],
        "description_ru": "Бутылка с керосином, тряпка-фитиль. Бросок — лужа огня на 2 хода. Мутанты горят красиво.",
        "flavor_ru": "«Окно — закрытое или открытое — больше не имеет значения.»",
    },
    # Craft weapons that map from existing items (kept for migration continuity)
    {
        "id": "craft_knife", "tier": 1, "weight": 0.5,
        "name_ru": "Нож", "name_real_ru": "Нож", "name_generic_ru": "Нож",
        "weapon_type": "weapon_melee", "damage_min": 4, "damage_max": 7,
        "durability_max": 30, "caliber": "melee",
        "ingredients": [{"item_id": "scrap_metal", "count": 2}, {"item_id": "wood", "count": 1}],
        "description_ru": "Стартовый клинок. Лёгкий, тихий. Мародёра — за 3 удара, мутанта — долго.",
        "flavor_ru": "«Когда не слышно — иногда полезнее, чем когда больно.»",
    },
    {
        "id": "craft_machete", "tier": 2, "weight": 1.2,
        "name_ru": "Мачете", "name_real_ru": "Мачете", "name_generic_ru": "Мачете",
        "weapon_type": "weapon_melee", "damage_min": 6, "damage_max": 11,
        "durability_max": 40, "caliber": "melee",
        "ingredients": [{"item_id": "scrap_metal", "count": 4}, {"item_id": "wood", "count": 1}],
        "description_ru": "Длинный однолезвенный нож. Хорошо для зарослей и хрупких черепов.",
        "flavor_ru": "«Раньше — для тростника. Теперь — для всего, что попадётся.»",
    },
    {
        "id": "craft_composite_blade", "tier": 3, "weight": 1.5,
        "name_ru": "Сборный клинок", "name_real_ru": "Сборный клинок", "name_generic_ru": "Сборный клинок",
        "weapon_type": "weapon_melee", "damage_min": 9, "damage_max": 14,
        "durability_max": 60, "caliber": "melee",
        "ingredients": [
            {"item_id": "scrap_metal", "count": 6}, {"item_id": "wood", "count": 2},
            {"item_id": "machine_oil", "count": 1}
        ],
        "description_ru": "Лезвие сваренное из автомобильной рессоры, рукоять из плотного дерева. Прочнее ножа, тяжелее.",
        "flavor_ru": "«Хорошая сталь помнит руки кузнеца.»",
    },
    {
        "id": "craft_sledge", "tier": 2, "weight": 4.0,
        "name_ru": "Кувалда", "name_real_ru": "Кувалда", "name_generic_ru": "Кувалда",
        "weapon_type": "weapon_melee", "damage_min": 10, "damage_max": 16,
        "durability_max": 50, "caliber": "melee",
        "ingredients": [{"item_id": "scrap_metal", "count": 6}, {"item_id": "wood", "count": 3}],
        "description_ru": "Большая молоток-болванка на длинной рукояти. Замах долгий, но броню гнёт.",
        "flavor_ru": "«Иногда — это всё что нужно.»",
    },
    {
        "id": "craft_crowbar", "tier": 1, "weight": 1.8,
        "name_ru": "Лом", "name_real_ru": "Лом", "name_generic_ru": "Лом",
        "weapon_type": "weapon_melee", "damage_min": 5, "damage_max": 9,
        "durability_max": 80, "caliber": "melee",
        "ingredients": [{"item_id": "scrap_metal", "count": 3}],
        "description_ru": "Гнутая металлическая палка. Открывает двери, ломает рёбра.",
        "flavor_ru": "«Универсальный инструмент. Особенно если ты не сантехник.»",
    },
]


# ════════════════════════════════════════════════════════════════════
# III. DROP WEAPONS (§3, 15 шт с rifle_t3_hunting из B6)
# ════════════════════════════════════════════════════════════════════
# Поля: id, tier, weight, caliber, dmg_min, dmg_max, mod_slots, parts[]
# name_real_ru / name_generic_ru — пары для WEAPON_NAMING_MODE
DROP_WEAPONS: list[dict[str, Any]] = [
    # §3.1 Пистолеты T2
    {"id": "pm",       "tier": 2, "weight": 0.7, "caliber": "9x18",    "dmg_min": 5,  "dmg_max": 9,  "mod_slots": 2, "name_real_ru": "ПМ", "name_generic_ru": "Пистолет 9×18", "type_name": "пистолет", "parts": ["pm_frame", "pm_slide", "pm_magazine"]},
    {"id": "tt",       "tier": 2, "weight": 0.85, "caliber": "7.62x25","dmg_min": 7,  "dmg_max": 11, "mod_slots": 2, "name_real_ru": "ТТ", "name_generic_ru": "Пистолет 7.62×25", "type_name": "пистолет", "parts": ["tt_frame", "tt_slide", "tt_magazine"]},
    {"id": "aps",      "tier": 3, "weight": 1.0, "caliber": "9x18",    "dmg_min": 6,  "dmg_max": 10, "mod_slots": 3, "name_real_ru": "АПС", "name_generic_ru": "Автоматический пистолет 9×18", "type_name": "пистолет", "parts": ["aps_frame", "aps_slide", "aps_magazine", "aps_stock"]},
    # §3.2 ПП и карабины T3
    {"id": "ppsh",     "tier": 3, "weight": 3.5, "caliber": "7.62x25", "dmg_min": 8,  "dmg_max": 13, "mod_slots": 2, "name_real_ru": "ППШ", "name_generic_ru": "ПП 7.62×25", "type_name": "пистолет-пулемёт", "parts": ["ppsh_receiver", "ppsh_barrel", "ppsh_drum", "ppsh_stock"]},
    {"id": "sks",      "tier": 3, "weight": 3.8, "caliber": "7.62x39", "dmg_min": 12, "dmg_max": 17, "mod_slots": 3, "name_real_ru": "СКС", "name_generic_ru": "Карабин 7.62×39", "type_name": "карабин", "parts": ["sks_receiver", "sks_barrel", "sks_bolt", "sks_stock"]},
    {"id": "aks_74u",  "tier": 3, "weight": 2.7, "caliber": "5.45x39", "dmg_min": 11, "dmg_max": 16, "mod_slots": 3, "name_real_ru": "АКС-74У", "name_generic_ru": "Укорочённый автомат 5.45×39", "type_name": "автомат", "parts": ["aks74u_barrel", "aks74u_receiver", "aks74u_bolt", "aks74u_magazine"]},
    # §3.3 Автоматы T3-T4
    {"id": "akm",      "tier": 3, "weight": 3.6, "caliber": "7.62x39", "dmg_min": 13, "dmg_max": 19, "mod_slots": 4, "name_real_ru": "АКМ", "name_generic_ru": "Автомат 7.62×39", "type_name": "автомат", "parts": ["akm_barrel", "akm_receiver", "akm_bolt", "akm_magazine"]},
    {"id": "ak_74",    "tier": 4, "weight": 3.3, "caliber": "5.45x39", "dmg_min": 14, "dmg_max": 20, "mod_slots": 4, "name_real_ru": "АК-74", "name_generic_ru": "Автомат 5.45×39", "type_name": "автомат", "parts": ["ak74_barrel", "ak74_receiver", "ak74_bolt", "ak74_magazine", "ak74_stock"]},
    {"id": "rpk",      "tier": 4, "weight": 4.8, "caliber": "5.45x39", "dmg_min": 15, "dmg_max": 22, "mod_slots": 3, "name_real_ru": "РПК", "name_generic_ru": "Ручной пулемёт 5.45×39", "type_name": "пулемёт", "parts": ["rpk_barrel", "rpk_receiver", "rpk_bolt", "rpk_magazine", "rpk_bipod"]},
    # §3.4 Снайперки T3-T5 (+ rifle_t3_hunting из B6)
    {"id": "rifle_t3_hunting", "tier": 3, "weight": 3.3, "caliber": ".308", "dmg_min": 13, "dmg_max": 19, "mod_slots": 3, "name_real_ru": "Тигр", "name_generic_ru": "Охотничий карабин .308", "type_name": "карабин", "parts": ["hunting_receiver", "hunting_barrel", "hunting_bolt", "hunting_scope"]},
    {"id": "mosin",    "tier": 3, "weight": 4.0, "caliber": "7.62x54R", "dmg_min": 15, "dmg_max": 22, "mod_slots": 2, "name_real_ru": "Мосина", "name_generic_ru": "Винтовка 7.62×54R", "type_name": "винтовка", "parts": ["mosin_receiver", "mosin_barrel", "mosin_bolt", "mosin_stock"]},
    {"id": "svd",      "tier": 5, "weight": 4.3, "caliber": "7.62x54R", "dmg_min": 22, "dmg_max": 32, "mod_slots": 4, "name_real_ru": "СВД", "name_generic_ru": "Снайперская винтовка 7.62×54R", "type_name": "снайперка", "parts": ["svd_barrel", "svd_receiver", "svd_bolt", "svd_magazine", "svd_stock"]},
    # §3.5 Дробовики T3-T4
    {"id": "iz_43",    "tier": 3, "weight": 3.2, "caliber": "12ga",    "dmg_min": 14, "dmg_max": 21, "mod_slots": 1, "name_real_ru": "ИЖ-43", "name_generic_ru": "Двустволка 12 кал.", "type_name": "ружьё", "parts": ["izh43_receiver", "izh43_barrels", "izh43_stock"]},
    {"id": "saiga_12", "tier": 4, "weight": 3.8, "caliber": "12ga",    "dmg_min": 16, "dmg_max": 24, "mod_slots": 3, "name_real_ru": "Сайга-12", "name_generic_ru": "Полуавтомат 12 кал.", "type_name": "дробовик", "parts": ["saiga_barrel", "saiga_receiver", "saiga_bolt", "saiga_magazine"]},
    {"id": "bekas",    "tier": 3, "weight": 3.4, "caliber": "12ga",    "dmg_min": 13, "dmg_max": 19, "mod_slots": 2, "name_real_ru": "Бекас-12М", "name_generic_ru": "Помповое ружьё 12 кал.", "type_name": "помповое ружьё", "parts": ["bekas_receiver", "bekas_barrel", "bekas_pump", "bekas_stock"]},
]


# ════════════════════════════════════════════════════════════════════
# IV. KNIVES & GRENADES (§3.6, §3.7 — whole drops, no parts)
# ════════════════════════════════════════════════════════════════════
KNIVES: list[dict[str, Any]] = [
    {"id": "nr_43",          "tier": 3, "weight": 0.4, "dmg_min": 8,  "dmg_max": 12, "name_real_ru": "НР-43", "name_generic_ru": "Армейский нож", "description_ru": "Армейский разведывательный нож. Стальное лезвие, гарда, ножны. Безотказный."},
    {"id": "combat_machete", "tier": 3, "weight": 1.0, "dmg_min": 9,  "dmg_max": 14, "name_real_ru": "Боевое мачете", "name_generic_ru": "Боевое мачете", "description_ru": "Жёсткий клинок 35 см. Рубит ветки, мутантов и тонкие ребра."},
    {"id": "kukri",          "tier": 4, "weight": 0.8, "dmg_min": 11, "dmg_max": 17, "name_real_ru": "Кукри", "name_generic_ru": "Кукри", "description_ru": "Изогнутое непальское лезвие. Один удар — и противник вспоминает географию."},
]

GRENADES: list[dict[str, Any]] = [
    {"id": "f1",   "tier": 4, "weight": 0.6, "dmg_min": 18, "dmg_max": 28, "name_real_ru": "Ф-1", "name_generic_ru": "Оборонительная граната", "description_ru": "Тяжёлая оборонительная граната. Радиус осколков шире чем бросок — кидать только из-за угла."},
    {"id": "rgd5", "tier": 3, "weight": 0.3, "dmg_min": 12, "dmg_max": 20, "name_real_ru": "РГД-5", "name_generic_ru": "Наступательная граната", "description_ru": "Лёгкая наступательная граната. Меньше осколков — безопаснее для своих."},
    {"id": "rgo",  "tier": 5, "weight": 0.5, "dmg_min": 22, "dmg_max": 32, "name_real_ru": "РГО", "name_generic_ru": "Граната с дистанционным взрывателем", "description_ru": "Граната с двойным взрывателем — рвёт по контакту или через 3 секунды. Армейский эксклюзив."},
]


# ════════════════════════════════════════════════════════════════════
# V. MODS (§5, 8 шт)
# ════════════════════════════════════════════════════════════════════
MODS: list[dict[str, Any]] = [
    {"id": "mod_pbs1",          "tier": 3, "weight": 0.4, "slot": "muzzle", "name_ru": "Глушитель ПБС-1",         "fits": ["akm","aks_74u","ak_74"],            "effect": "-1 dmg, шум loud→quiet", "ingredients": [{"item_id":"scrap_metal","count":3},{"item_id":"cloth","count":2}]},
    {"id": "mod_pbs_universal", "tier": 2, "weight": 0.3, "slot": "muzzle", "name_ru": "Глушитель универсал",      "fits": ["pm","tt","aps","ppsh"],             "effect": "-1 dmg, шум loud→quiet", "ingredients": [{"item_id":"scrap_metal","count":2},{"item_id":"cloth","count":2}]},
    {"id": "mod_pso1",          "tier": 4, "weight": 0.8, "slot": "optic",  "name_ru": "Оптика ПСО-1",             "fits": ["svd","akm","ak_74"],                "effect": "+20% точность на дистанции", "ingredients": [{"item_id":"scrap_metal","count":4},{"item_id":"electronics","count":2},{"item_id":"microchip","count":1}]},
    {"id": "mod_optic_4x",      "tier": 3, "weight": 0.6, "slot": "optic",  "name_ru": "Оптика 4×",                "fits": ["sks","mosin","rifle_t3_hunting"],   "effect": "+15% точность, -1 ёмкость", "ingredients": [{"item_id":"scrap_metal","count":3},{"item_id":"electronics","count":1}]},
    {"id": "mod_ext_mag_9x18",  "tier": 3, "weight": 0.2, "slot": "mag",    "name_ru": "Расширенный магазин 9×18",  "fits": ["pm","aps"],                          "effect": "+50% ёмкость", "ingredients": [{"item_id":"scrap_metal","count":2},{"item_id":"pm_magazine","count":1}]},
    {"id": "mod_ext_mag_545",   "tier": 3, "weight": 0.3, "slot": "mag",    "name_ru": "Расширенный магазин 5.45", "fits": ["aks_74u","ak_74","rpk"],            "effect": "+50% ёмкость", "ingredients": [{"item_id":"scrap_metal","count":3},{"item_id":"ak74_magazine","count":1}]},
    {"id": "mod_tac_grip",      "tier": 3, "weight": 0.2, "slot": "grip",   "name_ru": "Тактическая рукоять",      "fits": ["akm","ak_74","saiga_12","rpk"],     "effect": "+10% точность вблизи", "ingredients": [{"item_id":"scrap_metal","count":2},{"item_id":"rubber","count":1}]},
    {"id": "mod_bayonet",       "tier": 2, "weight": 0.4, "slot": "muzzle", "name_ru": "Штык-нож",                  "fits": ["akm","ak_74","sks","mosin"],        "effect": "+мили-удар когда враг в упор", "ingredients": [{"item_id":"scrap_metal","count":3},{"item_id":"wood","count":1}]},
]


# ════════════════════════════════════════════════════════════════════
# VI. AMMO (§6, 7 калибров без 20ga по B5)
# ════════════════════════════════════════════════════════════════════
AMMO: list[dict[str, Any]] = [
    {"id": "ammo_9x18",    "tier": 1, "weight": 0.01, "caliber": "9x18",    "name_ru": "Патрон 9×18 (ПМ)"},
    {"id": "ammo_762x25",  "tier": 2, "weight": 0.01, "caliber": "7.62x25", "name_ru": "Патрон 7.62×25 (ТТ/ППШ)"},
    {"id": "ammo_545",     "tier": 3, "weight": 0.012,"caliber": "5.45x39", "name_ru": "Патрон 5.45×39 (АК-74)"},
    {"id": "ammo_762x39",  "tier": 3, "weight": 0.015,"caliber": "7.62x39", "name_ru": "Патрон 7.62×39 (СКС/АКМ)"},
    {"id": "ammo_762x54r", "tier": 4, "weight": 0.02, "caliber": "7.62x54R","name_ru": "Патрон 7.62×54R (Мосина/СВД)"},
    {"id": "ammo_12ga",    "tier": 2, "weight": 0.04, "caliber": "12ga",    "name_ru": "Патрон 12 калибра"},
    {"id": "ammo_308",     "tier": 3, "weight": 0.025,"caliber": ".308",    "name_ru": "Патрон .308 Win."},
]


# ════════════════════════════════════════════════════════════════════
# VII. DROP TABLES (§7, 11 mobs)
# ════════════════════════════════════════════════════════════════════
DROP_TABLES: dict[str, list[dict[str, Any]]] = {
    "marauder": [
        {"id": "scrap_metal",  "chance": 0.80, "count": [1, 3]},
        {"id": "cloth",        "chance": 0.40, "count": [1, 2]},
        {"id": "ammo_9x18",    "chance": 0.30, "count": [3, 8]},
        {"id": "pm_magazine",  "chance": 0.08},
        {"id": "craft_shiv",   "chance": 0.10},
        {"id": "ammo_762x25",  "chance": 0.15, "count": [3, 6]},
        # B3: forest variants drop parts for hunting and IZH-43
        {"id": "hunting_receiver", "chance": 0.04},
        {"id": "izh43_receiver", "chance": 0.04},
        {"id": "bekas_pump", "chance": 0.03},
    ],
    "wild_dog": [
        {"id": "leather",      "chance": 0.85, "count": [1, 2]},
        {"id": "raw_meat",     "chance": 0.60, "count": [1, 2]},
        {"id": "bone",         "chance": 0.40, "count": [1, 2]},
    ],
    "mutant": [
        {"id": "raw_meat",     "chance": 0.70, "count": [1, 3]},
        {"id": "mutated_gland","chance": 0.25},
        {"id": "scrap_metal",  "chance": 0.30, "count": [1, 2]},
    ],
    "pack_rat": [
        {"id": "leather",      "chance": 0.90, "count": [1, 2]},
        {"id": "bone",         "chance": 0.60, "count": [1, 3]},
        {"id": "raw_meat",     "chance": 0.40, "count": [1, 2]},
    ],
    "fanatic_berserker": [
        {"id": "scrap_metal",  "chance": 0.70, "count": [2, 4]},
        {"id": "ammo_762x25",  "chance": 0.35, "count": [4, 10]},
        {"id": "tt_magazine",  "chance": 0.12},
        {"id": "tt_slide",     "chance": 0.08},
        {"id": "leather_jacket","chance": 0.05},
        {"id": "ppsh_drum",    "chance": 0.05},
        # B3: parts for АКМ, Сайга, Бекас, ИЖ-43
        {"id": "akm_magazine", "chance": 0.08},
        {"id": "saiga_bolt",   "chance": 0.05},
    ],
    "looter_sniper": [
        {"id": "ammo_762x54r", "chance": 0.70, "count": [3, 8]},
        {"id": "svd_bolt",     "chance": 0.10},
        {"id": "svd_magazine", "chance": 0.15},
        {"id": "mosin_bolt",   "chance": 0.12},
        {"id": "mod_pso1",     "chance": 0.04},
        # B3: more sniper parts
        {"id": "mosin_barrel", "chance": 0.08},
        {"id": "saiga_magazine", "chance": 0.08},
        {"id": "sks_bolt",     "chance": 0.06},
    ],
    "armored_guard": [
        {"id": "ammo_545",     "chance": 0.60, "count": [8, 15]},
        {"id": "ak74_magazine","chance": 0.20},
        {"id": "ak74_stock",   "chance": 0.18},
        {"id": "ak74_bolt",    "chance": 0.15},
        {"id": "aks74u_barrel","chance": 0.10},
        {"id": "armored_vest_part", "chance": 0.10},
        # B3: more AK-family parts
        {"id": "aks74u_receiver", "chance": 0.10},
        {"id": "aks74u_bolt",  "chance": 0.10},
        {"id": "aks74u_magazine", "chance": 0.10},
        {"id": "sks_receiver", "chance": 0.08},
    ],
    "relic_drone": [
        {"id": "electronics",  "chance": 0.70, "count": [1, 2]},
        {"id": "microchip",    "chance": 0.40},
        {"id": "drone_core",   "chance": 0.15},
    ],
    "city_guard_captain": [
        {"id": "ammo_545",       "chance": 0.80, "count": [15, 30]},
        {"id": "ak74_receiver",  "chance": 0.18},
        {"id": "ak74_barrel",    "chance": 0.15},
        {"id": "mod_pbs1",       "chance": 0.05},
        {"id": "nr_43",          "chance": 0.08},
        # B3: more parts (aps, akm, rpk)
        {"id": "aps_frame",      "chance": 0.15},
        {"id": "aps_slide",      "chance": 0.12},
        {"id": "aps_magazine",   "chance": 0.15},
        {"id": "aps_stock",      "chance": 0.10},
        {"id": "akm_receiver",   "chance": 0.10},
        {"id": "akm_bolt",       "chance": 0.10},
        {"id": "akm_barrel",     "chance": 0.08},
        {"id": "rpk_receiver",   "chance": 0.05},
        {"id": "rpk_bolt",       "chance": 0.05},
        {"id": "rpk_magazine",   "chance": 0.06},
        {"id": "rpk_bipod",      "chance": 0.04},
    ],
    "forest_alpha_mutant": [
        {"id": "raw_meat",     "chance": 1.00, "count": [3, 5]},
        {"id": "mutated_gland","chance": 0.80},
        {"id": "leather",      "chance": 0.90, "count": [2, 4]},
        {"id": "alpha_pelt",   "chance": 0.30},
    ],
    "warehouse_drone_prime": [
        # guaranteed
        {"id": "drone_core",   "chance": 1.00},
        {"id": "rpk_barrel",   "chance": 1.00},
        # random
        {"id": "mod_pso1",     "chance": 0.40},
        {"id": "ak74_receiver","chance": 0.50},
        # B3: additional alpha-tier parts
        {"id": "saiga_receiver", "chance": 0.30},
        {"id": "saiga_barrel", "chance": 0.25},
        {"id": "ppsh_barrel",  "chance": 0.20},
        {"id": "ppsh_receiver", "chance": 0.20},
        {"id": "ppsh_stock",   "chance": 0.20},
        {"id": "sks_barrel",   "chance": 0.25},
        {"id": "sks_stock",    "chance": 0.25},
        {"id": "izh43_barrels","chance": 0.20},
        {"id": "izh43_stock",  "chance": 0.20},
        {"id": "mosin_receiver", "chance": 0.20},
        {"id": "mosin_stock",  "chance": 0.20},
        {"id": "hunting_barrel", "chance": 0.20},
        {"id": "hunting_bolt", "chance": 0.20},
        {"id": "hunting_scope","chance": 0.15},
        {"id": "bekas_receiver", "chance": 0.20},
        {"id": "bekas_barrel", "chance": 0.20},
        {"id": "bekas_stock",  "chance": 0.20},
    ],
}


# ════════════════════════════════════════════════════════════════════
# VIII. GENERATORS
# ════════════════════════════════════════════════════════════════════

def make_samodel_item(s: dict[str, Any]) -> dict[str, Any]:
    """Craft weapon item."""
    item: dict[str, Any] = {
        "id": s["id"],
        "name_ru": s["name_ru"],
        "name_real_ru": s["name_real_ru"],
        "name_generic_ru": s["name_generic_ru"],
        "type": s["weapon_type"],
        "tier": s["tier"],
        "item_class": "craft",
        "zone_origin": "universal",
        "weight_kg": s["weight"],
        "caliber": s["caliber"],
        "durability_max": s["durability_max"],
        "description_ru": s["description_ru"],
        "flavor_ru": s["flavor_ru"],
        "recipe_id": f"recipe_{s['id']}",
        "stats": {
            "damage_min": s["damage_min"],
            "damage_max": s["damage_max"],
        },
    }
    return item


def make_drop_weapon_item(w: dict[str, Any]) -> dict[str, Any]:
    """Drop (assembled) weapon item — has parts list and mod_slots."""
    return {
        "id": w["id"],
        "name_ru": w["name_real_ru"],
        "name_real_ru": w["name_real_ru"],
        "name_generic_ru": w["name_generic_ru"],
        "type": "weapon_ranged" if w["caliber"] != "melee" else "weapon_melee",
        "tier": w["tier"],
        "item_class": "drop",
        "zone_origin": "universal",
        "weight_kg": w["weight"],
        "caliber": w["caliber"],
        "mod_slots": w["mod_slots"],
        "parts": w["parts"],
        "description_ru": f"{w['name_real_ru']} ({w['type_name']}, {w['caliber']}). Сборный из деталей или гарантированно с боссов.",
        "flavor_ru": "«Настоящее железо. С прошлой жизни.»",
        "recipe_id": f"recipe_assemble_{w['id']}",
        "stats": {
            "damage_min": w["dmg_min"],
            "damage_max": w["dmg_max"],
        },
    }


def make_knife_item(k: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": k["id"],
        "name_ru": k["name_real_ru"],
        "name_real_ru": k["name_real_ru"],
        "name_generic_ru": k["name_generic_ru"],
        "type": "weapon_melee",
        "tier": k["tier"],
        "item_class": "drop",
        "zone_origin": "universal",
        "weight_kg": k["weight"],
        "caliber": "melee",
        "description_ru": k["description_ru"],
        "flavor_ru": "«Сталь с историей.»",
        "recipe_id": None,
        "stats": {
            "damage_min": k["dmg_min"],
            "damage_max": k["dmg_max"],
        },
    }


def make_grenade_item(g: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": g["id"],
        "name_ru": g["name_real_ru"],
        "name_real_ru": g["name_real_ru"],
        "name_generic_ru": g["name_generic_ru"],
        "type": "consumable",
        "tier": g["tier"],
        "item_class": "drop",
        "zone_origin": "universal",
        "weight_kg": g["weight"],
        "caliber": "thrown",
        "description_ru": g["description_ru"],
        "flavor_ru": "«Один бросок — один шанс.»",
        "recipe_id": None,
        "stats": {
            "damage_min": g["dmg_min"],
            "damage_max": g["dmg_max"],
            "effect_type": "explosive_thrown",
        },
    }


def make_mod_item(m: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": m["id"],
        "name_ru": m["name_ru"],
        "type": "modification",
        "tier": m["tier"],
        "item_class": "modification",
        "zone_origin": "universal",
        "weight_kg": m["weight"],
        "mod_slot": m["slot"],
        "fits_weapons": m["fits"],
        "description_ru": f"Модификация ({m['slot']}). {m['effect']}. Подходит к: {', '.join(m['fits'])}.",
        "flavor_ru": "«Маленькая деталь — большая разница.»",
        "recipe_id": f"recipe_{m['id']}",
        "stats": {"mod_effect": m["effect"]},
    }


def make_ammo_item(a: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": a["id"],
        "name_ru": a["name_ru"],
        "type": "ammo",
        "tier": a["tier"],
        "item_class": "ammo",
        "zone_origin": "universal",
        "weight_kg": a["weight"],
        "caliber": a["caliber"],
        "description_ru": f"Патрон калибра {a['caliber']}. Складируется в инвентаре стеками.",
        "flavor_ru": "«Маленький, но решает многое.»",
        "recipe_id": None,
        "stats": {},
    }


# Parts catalog from spec §4.1 — auto-derived from DROP_WEAPONS.parts
PART_DESCRIPTIONS = {
    # PM
    "pm_frame":      ("Рамка ПМ",      "Рамка пистолета Макарова. Чугун, штамп, тёртая краска."),
    "pm_slide":      ("Затвор ПМ",     "Подвижная часть затвора. Сложно найти целым."),
    "pm_magazine":   ("Магазин ПМ",    "Восьмипатронный магазин 9×18."),
    # TT
    "tt_frame":      ("Рамка ТТ",      "Стальная рамка пистолета Токарева."),
    "tt_slide":      ("Затвор ТТ",     "Подвижная часть затвора ТТ."),
    "tt_magazine":   ("Магазин ТТ",    "Восьмипатронный магазин 7.62×25."),
    # АПС
    "aps_frame":     ("Рамка АПС",     "Рамка автоматического пистолета Стечкина."),
    "aps_slide":     ("Затвор АПС",    "Подвижная часть АПС."),
    "aps_magazine":  ("Магазин АПС",   "Двадцатипатронный магазин."),
    "aps_stock":     ("Кобура-приклад АПС", "Деревянная кобура для стрельбы с упора."),
    # ППШ
    "ppsh_receiver": ("Ствольная коробка ППШ", "Штампованная стальная коробка."),
    "ppsh_barrel":   ("Ствол ППШ",     "Длинный нарезной ствол."),
    "ppsh_drum":     ("Барабан ППШ",   "Дисковый магазин на 71 патрон."),
    "ppsh_stock":    ("Приклад ППШ",   "Деревянный приклад."),
    # СКС
    "sks_receiver":  ("Ствольная коробка СКС", "Фрезерованная коробка."),
    "sks_barrel":    ("Ствол СКС",     "Нарезной ствол под 7.62×39."),
    "sks_bolt":      ("Затвор СКС",    "Газоотводная система."),
    "sks_stock":     ("Приклад СКС",   "Деревянный приклад с шейкой."),
    # АКС-74У
    "aks74u_barrel":   ("Ствол АКС-74У",   "Укороченный ствол."),
    "aks74u_receiver": ("Ствольная коробка АКС-74У", ""),
    "aks74u_bolt":     ("Затворная рама АКС-74У", ""),
    "aks74u_magazine": ("Магазин АКС-74У",  "Тридцатипатронный."),
    # АКМ
    "akm_barrel":    ("Ствол АКМ",     "Нарезной ствол под 7.62×39."),
    "akm_receiver":  ("Ствольная коробка АКМ", "Штампованная стальная коробка."),
    "akm_bolt":      ("Затворная рама АКМ", ""),
    "akm_magazine": ("Магазин АКМ",   "Тридцатипатронный 7.62×39."),
    # АК-74
    "ak74_barrel":   ("Ствол АК-74",   "Чёрный ствол с щелевым ДТК. Редкая деталь."),
    "ak74_receiver": ("Ствольная коробка АК-74", "Фрезерованная стальная коробка."),
    "ak74_bolt":     ("Затворная рама АК-74", "Подвижная группа с затвором."),
    "ak74_magazine": ("Магазин АК-74", "Тридцатипатронный 5.45×39."),
    "ak74_stock":    ("Приклад АК-74", "Складной приклад."),
    # РПК
    "rpk_barrel":    ("Ствол РПК",     "Утяжелённый удлинённый ствол."),
    "rpk_receiver":  ("Ствольная коробка РПК", ""),
    "rpk_bolt":      ("Затворная рама РПК", ""),
    "rpk_magazine":  ("Магазин РПК",   "Сорокапятипатронный или барабан."),
    "rpk_bipod":     ("Сошки РПК",     "Складные сошки для стрельбы с упора."),
    # Hunting
    "hunting_receiver": ("Ствольная коробка Тигра", "Гражданская винтовка на базе СВД."),
    "hunting_barrel":   ("Ствол Тигра",    "Нарезной ствол под .308."),
    "hunting_bolt":     ("Затвор Тигра",   ""),
    "hunting_scope":    ("Прицельная планка Тигра", "Крепление под оптику."),
    # Мосина
    "mosin_receiver": ("Ствольная коробка Мосина", "Старая, но крепкая."),
    "mosin_barrel":   ("Ствол Мосина",    "Длинный нарезной ствол."),
    "mosin_bolt":     ("Затвор Мосина",   "Поворотный затвор."),
    "mosin_stock":    ("Ложе Мосина",    "Тяжёлое деревянное ложе."),
    # СВД
    "svd_barrel":    ("Ствол СВД",     "Длинный точный ствол. Финал-парт."),
    "svd_receiver":  ("Ствольная коробка СВД", "Фрезерованная коробка."),
    "svd_bolt":      ("Затвор СВД",    "Газоотводная система."),
    "svd_magazine":  ("Магазин СВД",   "Десятипатронный 7.62×54R."),
    "svd_stock":     ("Приклад СВД",   "Скелетный приклад с щекой."),
    # ИЖ-43
    "izh43_receiver": ("Замок ИЖ-43",   "Двойной замок с откидыванием."),
    "izh43_barrels":  ("Стволы ИЖ-43",  "Спаренные гладкие стволы."),
    "izh43_stock":    ("Приклад ИЖ-43", "Деревянная ложа."),
    # Сайга
    "saiga_barrel":   ("Ствол Сайги-12", "Гладкий ствол 12 калибра."),
    "saiga_receiver": ("Ствольная коробка Сайги-12", ""),
    "saiga_bolt":     ("Затворная рама Сайги-12", ""),
    "saiga_magazine": ("Магазин Сайги-12", "Восьмипатронный."),
    # Бекас
    "bekas_receiver": ("Ствольная коробка Бекаса", "Помповый затвор."),
    "bekas_barrel":   ("Ствол Бекаса",  "Гладкий ствол 12 калибра."),
    "bekas_pump":     ("Цевьё-помпа Бекаса", "Подвижное цевьё."),
    "bekas_stock":    ("Приклад Бекаса", "Деревянный или резиновый."),
}


def make_part_item(part_id: str) -> dict[str, Any]:
    name, desc = PART_DESCRIPTIONS.get(part_id, (part_id.replace("_", " ").title(), f"Деталь {part_id}."))
    # Tier inferred from prefix → weapon tier
    weapon_tier = 2
    for w in DROP_WEAPONS:
        if part_id in w["parts"]:
            weapon_tier = w["tier"]
            break
    return {
        "id": part_id,
        "name_ru": name,
        "type": "weapon_part",
        "tier": weapon_tier,
        "item_class": "part",
        "zone_origin": "universal",
        "weight_kg": 0.3,
        "description_ru": desc or f"Часть для сборки оружия. {name}.",
        "flavor_ru": "«Половина — не половина. Без неё — ничего.»",
        "recipe_id": None,
        "stats": {},
    }


# ════════════════════════════════════════════════════════════════════
# IX. RECIPES
# ════════════════════════════════════════════════════════════════════
def make_craft_recipe(item: dict[str, Any], ingredients: list) -> dict[str, Any]:
    return {
        "id": f"recipe_{item['id']}",
        "result_id": item["id"],
        "result_count": 1,
        "ingredients": ingredients,
        "tier": item["tier"],
        "unlock_condition": None,
        "craft_time_s": 0,
        "recipe_type": "craft",
        "is_mod": False,
    }


def make_assemble_recipe(weapon: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": f"recipe_assemble_{weapon['id']}",
        "result_id": weapon["id"],
        "result_count": 1,
        "ingredients": [{"item_id": p, "count": 1} for p in weapon["parts"]],
        "tier": weapon["tier"],
        "unlock_condition": None,
        "craft_time_s": 30,
        "recipe_type": "assemble",
        "is_mod": False,
    }


def make_mod_recipe(mod: dict[str, Any]) -> dict[str, Any]:
    return {
        "id": f"recipe_{mod['id']}",
        "result_id": mod["id"],
        "result_count": 1,
        "ingredients": mod["ingredients"],
        "tier": mod["tier"],
        "unlock_condition": None,
        "craft_time_s": 20,
        "recipe_type": "craft",
        "is_mod": True,
    }


# ════════════════════════════════════════════════════════════════════
# X. APPLY MIGRATIONS to existing items
# ════════════════════════════════════════════════════════════════════
def apply_migration(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Renames existing items according to MIGRATION_MAP. Adds item_class.
    Idempotent: items already at new IDs are not touched."""
    out = []
    for item in items:
        new_item = dict(item)
        old_id = new_item["id"]
        new_id = MIGRATION_MAP.get(old_id, old_id)
        if new_id != old_id:
            new_item["id"] = new_id
            new_item["_migrated_from"] = old_id
        # Default item_class if missing
        if "item_class" not in new_item:
            t = new_item.get("type", "")
            if t in ("weapon_melee", "weapon_ranged"):
                # Heuristic: if previously rename-reclassified to craft_*, mark craft
                if new_item["id"].startswith("craft_"):
                    new_item["item_class"] = "craft"
                else:
                    new_item["item_class"] = "drop"
            elif t == "armor":
                new_item["item_class"] = "armor"
            elif t == "consumable":
                new_item["item_class"] = "consumable"
            elif t == "resource":
                new_item["item_class"] = "resource"
            elif t == "ammo":
                new_item["item_class"] = "ammo"
            else:
                new_item["item_class"] = "misc"
        out.append(new_item)
    return out


def migrate_recipes(recipes: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Renames result_id and ingredient.item_id according to MIGRATION_MAP.
    Also renames recipe.id if it references migrated item."""
    out = []
    for r in recipes:
        new_r = dict(r)
        # result_id
        if new_r["result_id"] in MIGRATION_MAP:
            new_r["result_id"] = MIGRATION_MAP[new_r["result_id"]]
        # ingredient item_ids
        new_r["ingredients"] = [
            {**ing, "item_id": MIGRATION_MAP.get(ing["item_id"], ing["item_id"])}
            for ing in new_r["ingredients"]
        ]
        # recipe.id — rename if it follows pattern recipe_<oldid>
        for old_id, new_id in MIGRATION_MAP.items():
            if new_r["id"] == f"recipe_{old_id}":
                new_r["id"] = f"recipe_{new_id}"
                break
        out.append(new_r)
    return out


# ════════════════════════════════════════════════════════════════════
# XI. MAIN
# ════════════════════════════════════════════════════════════════════
def main():
    items = json.loads(ITEMS.read_text(encoding="utf-8"))
    recipes = json.loads(RECIPES.read_text(encoding="utf-8"))
    mobs = json.loads(MOBS.read_text(encoding="utf-8"))

    print(f"BEFORE: items={len(items)} recipes={len(recipes)} mobs={len(mobs)}")

    # 1. Migrate existing items and recipes
    items = apply_migration(items)
    recipes = migrate_recipes(recipes)

    # 2. Build a dict for upsert
    items_by_id = {x["id"]: x for x in items}
    recipes_by_id = {x["id"]: x for x in recipes}

    # 3. Add samodely + their recipes
    for s in SAMODELI:
        item = make_samodel_item(s)
        items_by_id[item["id"]] = item
        recipes_by_id[item["recipe_id"]] = make_craft_recipe(item, s["ingredients"])

    # 4. Add drop weapons + assemble recipes + parts
    parts_seen = set()
    for w in DROP_WEAPONS:
        item = make_drop_weapon_item(w)
        items_by_id[item["id"]] = item
        recipes_by_id[item["recipe_id"]] = make_assemble_recipe(w)
        for p in w["parts"]:
            if p not in parts_seen:
                parts_seen.add(p)
                p_item = make_part_item(p)
                items_by_id[p_item["id"]] = p_item

    # 5. Add knives & grenades
    for k in KNIVES:
        item = make_knife_item(k)
        items_by_id[item["id"]] = item
    for g in GRENADES:
        item = make_grenade_item(g)
        items_by_id[item["id"]] = item

    # 6. Add mods + recipes
    for m in MODS:
        item = make_mod_item(m)
        items_by_id[item["id"]] = item
        recipes_by_id[item["recipe_id"]] = make_mod_recipe(m)

    # 7. Add ammo
    for a in AMMO:
        item = make_ammo_item(a)
        items_by_id[item["id"]] = item

    # 8. Add missing referenced IDs that don't have their own catalog entry
    # Stubs for items referenced in drops but not yet defined
    for stub_id, name in [
        ("microchip", "Микрочип"),
        ("rubber", "Резина"),
        ("drone_core", "Ядро дрона"),
        ("leather_jacket", "Кожаная куртка"),
        ("armored_vest_part", "Часть бронежилета"),
        ("alpha_pelt", "Шкура альфы"),
        ("armored_vest_recipe", "Чертёж: бронежилет"),
        ("rare_meds_recipe", "Чертёж: редкие медикаменты"),
        ("unique_svd_blueprint", "Чертёж: уникальная СВД"),
        ("raw_meat", "Сырое мясо"),
        ("bone", "Кость"),
    ]:
        if stub_id not in items_by_id:
            items_by_id[stub_id] = {
                "id": stub_id, "name_ru": name, "type": "resource", "tier": 3,
                "item_class": "resource", "zone_origin": "universal", "weight_kg": 0.5,
                "description_ru": f"{name}. Появится с дропа боссов или редких мобов.",
                "flavor_ru": "«Из-за чего-то такого люди готовы убивать.»",
                "recipe_id": None, "stats": {},
            }

    # 9. Apply drop tables to mobs
    for mob in mobs:
        if mob["id"] in DROP_TABLES:
            mob["drops"] = DROP_TABLES[mob["id"]]

    # 10. Sort by tier then id for stable output
    items_final = sorted(items_by_id.values(), key=lambda x: (x.get("tier", 1), x["id"]))
    recipes_final = sorted(recipes_by_id.values(), key=lambda x: (x.get("tier", 1), x["id"]))

    # 11. Validate cross-references
    all_ids = {x["id"] for x in items_final}
    errors = []
    for r in recipes_final:
        if r["result_id"] not in all_ids:
            errors.append(f"recipe {r['id']} → result_id {r['result_id']} not in items")
        for ing in r["ingredients"]:
            if ing["item_id"] not in all_ids:
                errors.append(f"recipe {r['id']} → ingredient {ing['item_id']} not in items")
    for mob in mobs:
        for d in mob.get("drops", []):
            if d["id"] not in all_ids:
                errors.append(f"mob {mob['id']} → drop {d['id']} not in items")
    if errors:
        print("\n❌ VALIDATION ERRORS:")
        for e in errors[:30]:
            print(f"  {e}")
        if len(errors) > 30:
            print(f"  ... and {len(errors) - 30} more")
        return 1

    # 12. Write
    ITEMS.write_text(json.dumps(items_final, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    RECIPES.write_text(json.dumps(recipes_final, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    MOBS.write_text(json.dumps(mobs, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    print(f"\nAFTER:  items={len(items_final)} recipes={len(recipes_final)} mobs={len(mobs)}")
    print(f"\n✅ Все ID валидны. Cross-references OK.")
    # Breakdown
    from collections import Counter
    c = Counter(x.get("item_class", "?") for x in items_final)
    print("\nitem_class breakdown:")
    for k, v in sorted(c.items()):
        print(f"  {k}: {v}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
