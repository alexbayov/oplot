# R2 — Combat MVP (точность + прицел)

> Канон боевой системы. Critic сверяет с XCOM 2 + Fallout.

## 1. Поле боя
- Сетка hex **или** square 1m cells (канон R2: **square**, проще mobile UX).
- Размер encounter: 12×12 .. 16×16.
- Тайлы: open, half_cover, full_cover, blocked, elevation_1.
- Инициатива: sorted by `speed` каждый раунд; tie → player first.

## 2. Action Points
`hero.ap_max = 4` (+skill mods). Реген каждый ход.

| Действие | AP | Примечание |
|---|---|---|
| Move (до MOVE_CELLS=4) | 1 | path cost 1/cell; diagonal ok |
| Snap shot | 2 | без выбора части тела (=torс) |
| Aimed shot | 3 | выбор части тела |
| Burst (auto only) | all remaining (≥3) | 3 bullets, each −10% hit cumulative |
| Reload | 1–2 | по оружию |
| Use item | 1 | bandage/medkit |
| Overwatch | remaining | fire on enemy enter cone |
| Hunker | 1 | +full cover until next turn, no shoot |

## 3. Hit chance (всегда показать ДО выстрела)

```
hit% = clamp(5, 95,
  BASE_HIT                    # 60
+ skill_marksmanship * 3      # 0..10 → 0..30
+ weapon.accuracy_mod         # from base + mods
+ elevation_bonus             # +10 if shooter higher
- distance_penalty            # max(0, dist - weapon.opt_range) * 2
- cover_penalty               # half 20 / full 40; flank = 0
- body_part_penalty           # torso 0, legs 10, arms 20, head 30
- suppression_penalty         # 15 if suppressed
- injury_penalty              # arm injury 10
+ stance_bonus                # hunker -15 to enemy hit vs you (defense)
)
```

UI breakdown (XCOM-style, обязателен):
`65% = 60 base +12 skill −20 cover −10 head +23 rifle`

Crit: on hit, `crit% = 5 + weapon.crit_mod + head_auto_crit`. Crit damage ×1.5. Head hit always crits if hit.

## 4. Body parts

| Part | hit penalty | dmg mult | effect on hit (chance) |
|---|---|---|---|
| torso | 0 | ×1.0 | — |
| head | −30 | ×2.5 | stun 1 turn 40% |
| arms | −20 | ×0.7 | weapon_jam / −10 acc 2 turns 50% |
| legs | −10 | ×0.8 | −2 MOVE_CELLS until healed 60% |

## 5. Damage

```
raw = uniform(weapon.dmg_min, weapon.dmg_max) * body_mult * crit_mult
mitigated = max(1, raw - target.armor * (1 - armor_pen))
```

Armor pen from ammo type / barrel mods.

## 6. Cover & flank
- Half cover: −20 enemy hit
- Full cover: −40 enemy hit  
- Flank (no cover edge between shooter and target facing): cover = 0
- Destroyable cover: HP on cover object; explosive/high dmg removes

## 7. Noise
Each shot adds noise. Silencer ×0.5. Knife/crossbow = 0.
If noise ≥ threshold mid-sortie → reinforce roll next encounter.

## 8. Morale (humans only)
Squad HP < 50% or leader dead → flee chance. Player: spare (less loot) or finish.

## 9. AI (MVP 3 archetypes)
1. **Grunt** — closest cover, snap shot
2. **Sniper** — keep distance, aimed head if hit≥40
3. **Rusher** — close, melee or shotgun

## 10. Content hooks
- `content/weapons.json` stats used in formula
- `content/mobs.json` + ai_archetype
- Encounter spawn from zone depth

## 11. Tests (gate)
- Deterministic RNG: fixed seed → fixed hit roll outcomes
- Formula unit tests: 10 fixture cases
- Flank removes cover penalty
- Head shot applies stun flag when RNG says so
- UI not tested in unit; Critic playtest checklist

## 12. Critic checklist
- [ ] Hit% visible before confirm
- [ ] Breakdown numbers match formula
- [ ] Aimed vs snap is meaningful trade-off
- [ ] Cover actually saves lives in playtest
- [ ] No «always spam same button wins»
