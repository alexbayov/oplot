# R3 — Arsenal (реальные стволы + моды)

> Critic сверяет с Tarkov (trade-offs модов) + баланс тиров.

## 1. Классы
- **craft** — самоделы, всегда работают, низкий тир, durability
- **factory** — реальные стволы (лут / сборка из parts)
- **mod** — навесное
- **part** — рама/ствол/затвор для сборки
- **armor / rig / backpack / helmet / mask / boots**

## 2. Калибры (патрон = экономика)
`9x18 | 9x19 | 7.62x25 | 5.45x39 | 7.62x39 | 7.62x54R | 12ga | 5.56x45 | 7.62x51 | .45ACP`

Один калибр кормит несколько стволов. Нашёл 7.62×39 → СКС или АКМ.

## 3. Стартовый ростер factory (минимум 30)

### Пистолеты
| id | name | caliber | dmg | opt_range | mag | weight |
|---|---|---|---|---|---|---|
| pm | ПМ | 9x18 | 12-16 | 3 | 8 | 0.7 |
| pmm | ПММ | 9x18 | 13-17 | 3 | 12 | 0.75 |
| aps | АПС | 9x18 | 12-15 | 4 | 20 | 1.0 |
| tt | ТТ | 7.62x25 | 16-20 | 4 | 8 | 0.85 |
| gsh18 | ГШ-18 | 9x19 | 14-18 | 4 | 18 | 0.6 |
| mp443 | ПЯ Грач | 9x19 | 15-19 | 4 | 18 | 0.95 |
| glock17 | Glock 17 | 9x19 | 14-18 | 4 | 17 | 0.7 |

### ПП
| id | name | caliber | dmg | opt_range | mag |
|---|---|---|---|---|---|
| ppsh41 | ППШ-41 | 7.62x25 | 14-18 | 6 | 71 |
| pp19 | ПП-19 Витязь | 9x19 | 15-19 | 8 | 30 |
| mp5 | MP5 | 9x19 | 14-18 | 8 | 30 |

### Автоматы / винтовки
| id | name | caliber | dmg | opt_range | mag |
|---|---|---|---|---|---|
| aks74u | АКС-74У | 5.45x39 | 18-24 | 8 | 30 |
| ak74 | АК-74 | 5.45x39 | 20-26 | 12 | 30 |
| ak105 | АК-105 | 5.45x39 | 19-25 | 10 | 30 |
| rpk74 | РПК-74 | 5.45x39 | 20-26 | 14 | 45 |
| akm | АКМ | 7.62x39 | 24-32 | 12 | 30 |
| ak103 | АК-103 | 7.62x39 | 24-32 | 12 | 30 |
| sks | СКС | 7.62x39 | 26-34 | 14 | 10 |
| mosin | Мосина | 7.62x54R | 40-55 | 20 | 5 |
| svd | СВД | 7.62x54R | 42-58 | 24 | 10 |
| tigr | Тигр | 7.62x54R | 42-58 | 22 | 5 |
| m4a1 | M4A1 | 5.56x45 | 20-26 | 14 | 30 |
| r700 | Remington 700 | 7.62x51 | 45-60 | 28 | 5 |

### Дробовики
| id | name | caliber | dmg | opt_range | mag |
|---|---|---|---|---|---|
| izh43 | ИЖ-43 | 12ga | 35-50 | 3 | 2 |
| mp153 | МР-153 | 12ga | 32-48 | 4 | 4 |
| saiga12 | Сайга-12 | 12ga | 32-48 | 5 | 8 |
| mossberg500 | Mossberg 500 | 12ga | 34-50 | 4 | 5 |

Числа — стартовый баланс; fine-tune в balance.md после playtest.

## 4. Слоты модов (до 5)
1. **muzzle** — глушитель / ДТК / компенсатор  
2. **optic** — целик / коллиматор / ПСО-1 / 4x  
3. **magazine** — стандарт / +ext / drum  
4. **stock** — складной / тяжёлый (accuracy vs weight)  
5. **grip** — тактическая рукоятка  

### Примеры trade-off (Critic требует trade-off, не чистый бафф)
| mod | bonus | cost |
|---|---|---|
| pbs1_silencer | noise×0.5, +stealth | −5% dmg, +0.4kg |
| pso1 | −50% distance_penalty | +0.6kg, +1 AP aim if not braced |
| ext_mag_ak | mag×1.5 | +0.3kg, +1 reload AP if drum |
| vertical_grip | +5 accuracy | +0.2kg |

## 5. Сборка
`parts[]` per weapon → assemble on верстак.  
Salvage factory gun → 50–70% parts back.  
Recraft: swap one part without full rebuild.

## 6. Шмот
| slot | examples | effect |
|---|---|---|
| helmet | 6B47, SSH-68 | head dmg reduce, head hit% vs you − |
| armor | 6B23, 6B43, plate carrier | armor value, weight |
| rig | smersh, belt_rig | mag quick-swap (−1 reload AP) |
| backpack | raid, hunter | max_weight_kg |
| mask | gas_mask, gp5 | gas immunity |
| boots | combat | +1 MOVE_CELLS |

Durability + repair on верстак (oil + scrap).

## 7. JSON shape (fragment)
```json
{
  "id": "akm",
  "name_ru": "АКМ",
  "class": "factory",
  "caliber": "7.62x39",
  "dmg_min": 24, "dmg_max": 32,
  "opt_range": 12, "max_range": 30,
  "accuracy_mod": 5,
  "mag": 30,
  "reload_ap": 2,
  "fire_modes": ["semi", "auto"],
  "noise": 40,
  "weight_kg": 3.3,
  "durability_max": 100,
  "mod_slots": ["muzzle","optic","magazine","stock","grip"],
  "parts": ["akm_receiver","akm_barrel","akm_bolt","akm_stock","akm_mag"]
}
```

## 8. Critic checklist
- [ ] ≥30 named real guns
- [ ] Every mod has a downside
- [ ] Caliber shared across ≥2 guns where realistic
- [ ] Weight matters (heavy gun + plates = slow)
- [ ] No trademark logos in assets
