# M12.5 Combat Reformat — Tactical Survival Combat

> Status: design spec only. No runtime behavior is changed by this document.
>
> Goal: make combat the main player-facing hook before release/GO by reframing fights as tactical survival decisions under scarcity: AP, ammo, cover, noise, wounds, distance, and retreat risk.

## 0. Scope constraints

M12.5 is a combat reformat, not a platform/release-system rewrite.

### In scope

- Mobile/landscape **1280×720** target.
- Phaser UI and the existing scene stack.
- Turn-based combat.
- Combat decisions around AP, enemy intent, ammo, cover, noise, wounds, distance bands, and retreat risk.
- Incremental migration from current `CombatScene` behavior toward `CombatEngine` becoming the runtime source of truth.
- Generic weapon archetypes and player-facing generic names.

### Out of scope

- Full grid tactics.
- Real-time combat.
- Party/squad management.
- Deckbuilder mechanics.
- Boss overhaul.
- Large new systems outside combat.
- Cloud save, Yandex SDK, IAP/ads, and monetization changes.
- Loot/return lifecycle rewrite.
- Mass content rename.
- Real weapon trademarks as player-facing default.

## 1. Core fantasy

The player should feel:

> “I am surviving a dangerous sortie, not just trading hits.”

Every combat round should ask a practical survival question:

- Can I stop the enemy before their intent resolves?
- Do I spend ammo now or save it for a worse fight?
- Do I take cover, reposition, reload, suppress, heal, or retreat?
- Is the noise I create worth the immediate advantage?
- Can I leave with loot before the situation collapses?

The fantasy is not heroic power escalation. It is controlled panic: the player has tools, but each tool consumes scarce resources or increases future risk.

## 2. Combat loop

M12.5 loop:

1. **Enemy intents are shown** before the player commits actions.
2. **Player reads risks and previews consequences**: likely damage, ammo cost, AP cost, noise gain, status risk, retreat risk.
3. **Player spends AP** across one or more actions.
4. **Actions resolve** in deterministic order for the turn.
5. **State updates**: HP, ammo, magazine, durability, statuses, cover, distance, noise, enemy intent, and combat log.
6. **Next turn begins** with refreshed AP and newly shown enemy intents.

The player-facing hook is the intent/read/answer loop. Damage numbers matter, but the key emotion is “I understood what was coming and chose how to answer.”

## 3. Enemy intents

Enemy intents must be visible before the player acts. Each living enemy card shows one intent icon, short verb, target if relevant, and a compact consequence preview.

| Intent | What player sees | Player answers | If ignored |
|---|---|---|---|
| `attack` | Enemy card shows “Attack”, damage range, target, and distance requirement. | Take cover, guard, kill/stun enemy, move distance, suppress. | Enemy attacks this turn and applies damage/status. |
| `aim` | Enemy card shows “Aiming”, higher next-shot danger, and target marker. | Break line with cover, suppress, stun, rush close, kill before next turn. | Next attack gains accuracy/crit/armor-pierce or ignores guard. |
| `rush` | Enemy card shows “Rush”, arrow toward close distance, possible melee hit. | Suppress, move away, quick shot, guard, kill. | Enemy closes distance and may attack or set up close-range threat. |
| `guard/cover` | Enemy card shows shield/cover icon and defense preview. | Use aimed shot, expose, suppress, wait/reload, move for better range. | Enemy becomes harder to damage and may punish reckless shots. |
| `reload` | Enemy card shows magazine/reload icon and reduced immediate threat. | Attack, rush, reposition, reload yourself, retreat. | Enemy restores ammo/magazine and returns to full ranged threat. |
| `suppress` | Enemy card shows cone/burst icon and AP/status risk. | Take cover, suppress back, move, stun, kill. | Player may become `suppressed`, reducing AP/options next turn. |
| `special` | Enemy card shows named special, short warning text, and effect icon. | Counter depends on special: cover, move, stun, suppress, focus-fire. | Special resolves: status, high damage, summon/phase hook, or sortie risk. |
| `flee` | Enemy card shows flee icon and loot/progress consequence. | Finish enemy, let them go, suppress/stun if worth it. | Enemy leaves; combat may end sooner but drops/XP may be reduced. |

Intent rules:

- Intent must be explainable in one short UI phrase.
- Intent should be predictable from enemy archetype.
- Intent can be probabilistic, but once shown it must be reliable unless the player changes conditions.
- Boss/miniboss special intents may exist later, but M12.5 does not redesign bosses.

## 4. Player AP economy

Baseline: **3 AP per player turn**.

AP should create small tactical bundles, e.g. “take cover + quick shot + reload one shell” or “aimed shot + move”.

| Action | AP | Purpose | Notes |
|---|---:|---|---|
| Quick shot | 1 | Low-cost attack. | Lower accuracy/damage floor; good to finish enemies or interrupt fragile targets. |
| Aimed shot | 2 | More reliable attack. | Better accuracy/crit/armor handling; strong against cover/aiming enemies. |
| Suppress | 2 | Reduce enemy options. | Uses ammo/noise; can apply `suppressed` or cancel `aim/rush`. |
| Guard / take cover | 1 | Defensive survival. | Applies `guarded` or `in cover` depending on available cover state. |
| Move distance | 1 | Change distance band. | Close ↔ medium ↔ far; one band per AP. |
| Reload | 1–2 | Restore magazine. | 1 AP for simple reload/partial, 2 AP for slow/heavy reload. Consumes backpack ammo by caliber. |
| Item | 1 | Heal or utility. | Consumes item; should show effect preview. |
| Retreat | 2 + risk | Leave combat. | Risk depends on enemy intent, distance, suppressed/guarded state, and noise. |

AP principles:

- The default turn should offer 2–3 meaningful combinations, not 12 micro-actions.
- If the player cannot attack, the UI must clearly explain why: no AP, empty magazine, no ammo, jammed, stunned, wrong distance.
- Enemy suppression/stun can reduce available AP, but should not frequently skip the entire turn without warning.

## 5. Distance bands

No grid. Combat uses exactly three distance bands:

- **Close** — melee/rush danger.
- **Medium** — default firearm and most enemy interactions.
- **Far** — rifles/snipers stronger; melee weak; retreat often safer but not free.

Distance is global per enemy or per engagement lane, not a tile map. UI should show distance as chips on enemy cards and a small center indicator.

| Weapon / actor | Close | Medium | Far |
|---|---|---|---|
| Knife / melee | Best. Can punish rushed/rushing enemies. | Weak or requires move. | Cannot attack unless special reach/throw. |
| Pistol | Usable. Good quick shot. | Best general-purpose. | Lower reliability. |
| Shotgun | Strong burst. | Good but less reliable. | Poor. |
| Rifle | Awkward if rushed. | Good. | Best. |
| Automatic / SMG | Good suppress at close/medium. | Best suppress/control. | High ammo waste, low reliability. |
| Improvised weapon | Strong tradeoff by item; usually cheap but fragile/noisy/inaccurate. | Mixed. | Usually poor unless explicitly ranged. |
| Enemy rush | Attempts to move toward close and create immediate danger. | Can be answered with suppress/guard/quick shot. | Gives player one clear warning turn. |
| Sniper/ranged mob | Wants far/medium and may `aim`. | Dangerous. | Most dangerous if ignored. |

## 6. Cover / guard / suppression

No geometry simulation. Use simple named states.

| State | Meaning | Effect | Clears when |
|---|---|---|---|
| `guarded` | Actor is braced but not necessarily behind cover. | Reduces next incoming damage or status chance. | After absorbing attack or at next turn start. |
| `in cover` | Actor uses available cover. | Stronger defense vs ranged; may be bypassed by rush/flank/special. | Moving, being exposed, cover-breaking attack, or turn rule. |
| `exposed` | Actor is vulnerable. | Takes increased damage or loses cover/guard benefit. | Duration expires or actor takes cover. |
| `suppressed` | Actor is pinned by fire/noise. | Loses AP/options, worse aim, cannot rush/aim safely. | Duration expires, actor takes cover, or special clears it. |

Design principle: cover and suppression are binary/short-duration states, not a geometry system.

## 7. Noise meter

Noise turns combat decisions into sortie-level risk without rewriting the loot/return lifecycle.

### Noise sources

- Firearm attacks: +noise by weapon archetype and modifiers.
- Suppress: higher noise than single shot.
- Explosive/special actions if later added: high noise.
- Certain enemy actions: suppress/special/rush may add noise.
- Melee/guard/move/item: low or zero noise.
- Suppressors/mods can reduce noise, but should trade off damage/durability/reliability.

### Noise effects

Noise should not spawn a new external system in M12.5. It should alter existing combat/sortie risk through simple hooks:

- Higher chance of enemy reinforcements in later turns or next fight.
- Higher chance of worse next encounter modifier.
- Increased retreat risk if noise is high.
- Reduced post-combat safety if noise crosses thresholds.

### UI signals

- A visible noise meter with labels: Quiet → Heard → Dangerous → Overrun.
- Action preview shows “Noise +N”.
- Threshold warnings appear before crossing danger levels.
- Combat log records meaningful threshold changes.

## 8. Ammo / reload / durability — future canonical rule

M12.5 canonical rule:

- Ranged weapons use a **magazine**.
- Backpack stores **ammo by caliber**.
- Firing consumes magazine ammo.
- Reload consumes compatible backpack ammo by caliber and fills the magazine up to capacity.
- Reload AP cost depends on archetype: simple magazine reload = 1 AP; slow/heavy reload = 2 AP or partial reload.
- Empty magazine blocks ranged attacks or forces a clearly labeled weak fallback, e.g. butt strike / desperate melee.
- UI must show magazine, reserve ammo, caliber, reload AP cost, and whether reload is possible.
- Durability loss must be visible in combat UI and post-combat inventory.
- Breakage consequences should route through `durability.ts` in implementation, not through ad-hoc inline nulling.

No new save migration should be introduced unless absolutely required. If unique weapon instances require persistence changes, that must be a separate explicitly scoped PR.

## 9. Status effects

Minimum M12.5 set:

| Status | Effect | Duration | Player-facing display | Test expectation |
|---|---|---|---|---|
| `bleed` | Takes small HP loss at turn start/end. | 2–3 turns. | Red droplet icon + “Bleed −N/turn”. | Ticks damage, decrements, expires. |
| `stun` | Loses one action or AP chunk; should rarely skip full agency. | 1 turn. | Lightning icon + “Stunned: −AP”. | Reduces AP/actions exactly once, then clears. |
| `exposed` | Loses cover/guard benefit and takes increased incoming damage. | 1–2 turns. | Broken shield icon. | Damage/defense preview reflects exposure. |
| `suppressed` | Cannot aim/rush; may lose AP or accuracy. | 1 turn. | Down-arrow/burst icon. | Blocks listed actions and clears predictably. |
| `guarded` | Reduces next incoming damage/status chance. | Until next hit or turn start. | Shield icon near actor. | First incoming hit consumes/reduces effect. |
| `wounded` | Persistent combat injury: lower max AP or worse accuracy until combat ends/healed. | Combat-long unless item clears. | Bandage/wound icon + clear penalty text. | Applies persistent modifier and survives turn advance. |
| `jammed` | Weapon cannot fire until cleared/reloaded. | Until clear action. | Jam icon on weapon/ammo UI. | Blocks ranged attack and allows clear/reload action. |

All statuses must be visible, previewable, and testable. Hidden modifiers are not acceptable for first release of the reformat.

## 10. Skills integration

M12.5 must integrate with the existing skill tree, not redesign it.

Principles:

- Existing passive modifiers may affect AP, damage, defense, crit, reload, status resistance, or noise only through explicit adapter functions.
- Skill effects must appear in previews: “Skill: +10% accuracy”, “Perk: free reload used”, etc.
- Do not add a new skill tree branch or rewrite progression in this milestone.
- If an existing skill cannot be expressed safely, leave it as legacy passive until a later progression PR.

Example tactical perk:

- **Steady Hands:** first aimed shot each combat costs 1 AP less or gains extra accuracy.
- It must be shown in the action preview and have a unit test proving it triggers once per combat.

## 11. Weapon archetypes

Use generic archetypes in player-facing text. Do not rely on real weapon names.

| Archetype | Role | AP feel | Distance preference | Ammo / durability / noise tradeoff |
|---|---|---|---|---|
| Knife / melee | Silent fallback, close-range finisher. | Cheap but requires close distance. | Close. | No ammo, low/no noise, risky vs ranged/rushers, durability low/medium. |
| Pistol | Flexible sidearm. | Quick shot friendly. | Medium; usable close. | Moderate ammo, moderate noise, reliable reload. |
| Shotgun | Burst/control. | Strong 1-shot or 2 AP impact. | Close/medium. | High noise, low magazine, high stopping power. |
| Rifle | Precision and anti-armored threats. | Rewards aimed shot. | Medium/far. | Slower AP rhythm, louder, stronger at far. |
| Automatic / SMG | Suppression and crowd control if supported by content. | 2 AP suppress/burst focus. | Close/medium. | High ammo spend, high noise, durability pressure. |
| Improvised weapon | Scarcity tool. | Uneven; often cheap but unreliable. | Depends on item. | Fragile, noisy or inaccurate, but craftable/available. |

## 12. Enemy archetypes

M12.5 should tune 5–8 archetypes. Boss/miniboss support should remain future-compatible, not a boss overhaul.

| Archetype | Typical intents | Hook | Player lesson |
|---|---|---|---|
| Weak marauder | attack, flee, reload | Low HP, may run. | Finish or let flee; not every target is worth ammo. |
| Wild dog / rusher | rush, attack | Closes distance quickly. | Distance and guard matter. |
| Armored guard | guard/cover, attack | High defense, cover rhythm. | Read cover windows; use aimed/expose/suppress. |
| Sniper / ranged | aim, attack, reload | Telegraphs high danger. | Break aim or take cover. |
| Mutant / brute | rush, special, attack | High HP pressure. | Control and retreat are valid. |
| Suppressor | suppress, reload, attack | Limits AP/options. | Cover/suppress duel and ammo economy. |
| Boss/miniboss future-compatible | special, phase-flavored intents | Named threat. | Do not overhaul in M12.5; only ensure intent UI can display future specials. |

## 13. Combat UI layout — landscape 1280×720

Suggested layout:

- **Top row:** enemy cards with HP, distance, cover/status chips, and intent icon/text.
- **Center lane:** hero sprite/portrait left, enemy focus area right, distance band indicator in the middle.
- **Bottom left:** player HP, wounds/statuses, armor/guard state.
- **Bottom center:** AP pips and action bar.
- **Bottom right:** weapon panel: archetype name, magazine/reserve ammo by caliber, durability, jam/break warning.
- **Right side or lower-right panel:** action preview with AP cost, expected damage, ammo cost, noise gain, status chance, and intent counter note.
- **Lower log strip:** last 3–5 combat events, not a full wall of text.
- **Noise meter:** always visible near top/side, with threshold labels and action preview deltas.
- **Distance/cover indicators:** chips on enemy cards plus one central band indicator.

UI requirements:

- Touch targets must be usable on mobile landscape.
- Intent and AP state must be readable without opening tooltips.
- Preview panel must update before action confirmation.
- No critical combat action may depend only on color.

## 14. First 10 minutes target experience

In the first 1–3 fights, the player should understand:

1. “I saw what the enemy was about to do.”
2. “I could have played that turn better.”
3. “Patrons/ammo matter; shooting is strong but not free.”
4. “Cover matters and can save HP.”
5. “Noise is dangerous beyond the current enemy.”
6. “Retreat is sometimes the smart survival choice.”

First fights should introduce one idea at a time:

- Fight 1: intent + AP + quick/guard.
- Fight 2: ammo/reload + cover.
- Fight 3: noise + retreat/suppression or rusher distance.

## 15. Balance principles

- Ordinary fights should be short: target 3–6 player turns unless the player is under-equipped.
- Normal fights should use 1–3 enemies; 4 is the upper bound for regular combat.
- Decision density is more important than raw complexity.
- Every fail state must be explainable: “I ignored aim”, “I fired too loudly”, “I forgot to reload”, “I stayed close to a rusher”.
- Randomness must be explainable and previewed as ranges/chances.
- The player should usually lose because of readable risk accumulation, not surprise one-shots.
- Scarcity should pressure decisions, not soft-lock the player.

## 16. Telemetry / events

Telemetry already exists in the project; M12.5 should add or align combat events without blocking gameplay if telemetry is unavailable.

Suggested events:

- `combat_start`
  - zone, depth, enemy_archetypes, player_hp_pct, weapon_archetype.
- `combat_intent_shown`
  - enemy_id/archetype, intent, target, turn.
- `combat_action_selected`
  - action, ap_cost, target, weapon_archetype, ammo_before, noise_delta.
- `combat_damage_taken`
  - source_archetype, amount, status_applied, player_hp_pct.
- `combat_noise_changed`
  - old_level, new_level, delta, source_action.
- `combat_retreat`
  - success/fail, risk_pct, distance, noise_level.
- `combat_victory`
  - turns, hp_pct, ammo_spent, noise_peak, statuses_taken.
- `combat_defeat`
  - turns, cause_hint, noise_peak, enemy_archetype.

Telemetry must not introduce console noise or release blockers if unavailable.

## 17. Test plan

### Unit tests

- AP cost validation for each action.
- Distance band modifiers by weapon archetype.
- Cover/guard/exposed/suppressed state transitions.
- Noise delta and threshold transitions.
- Ammo reload by caliber and empty magazine behavior.
- Durability loss and break routing contract.
- Status duration/effects for bleed, stun, exposed, suppressed, guarded, wounded, jammed.

### Engine tests

- `CombatEngine` turn loop with AP budget.
- Intent generation and stable display before player action.
- Action preview matches actual resolution.
- Enemy intent counters: suppress cancels aim/rush, cover reduces attack, movement changes distance.
- Victory/defeat outcome remains stable.
- Legacy mobAI behaviors still map to archetype intents.

### Scene smoke tests

- Boot into seeded combat scene at 1280×720.
- Render enemy cards + intent + AP + action bar + preview + noise meter.
- Execute quick shot, guard, reload, retreat flows without console errors.
- Victory transitions to existing loot flow.
- Defeat/second chance still uses existing flow without platform changes.

### Content contract tests

- Every combat mob has a valid archetype/intent mapping.
- Every weapon-like item maps to one generic archetype.
- Every ranged weapon has caliber/magazine/reload metadata or safe fallback.
- Every status referenced by content is supported by engine/UI.
- No player-facing real weapon trademarks in default naming mode.

### First 10 minutes QA

- Manual smoke with clean profile.
- Record first 1–3 fights.
- Verify player sees intent, AP, ammo/reload, cover, noise, and retreat affordance.
- Verify no `console.error`.
- Verify no blocker UX on mobile landscape.

## 18. Acceptance criteria

M12.5 Combat Reformat is ready only when all are true:

- Player sees enemy intent before choosing actions.
- AP economy works and is visible.
- Ammo/reload behavior is understandable and tested.
- Cover and suppression work and are visible.
- Noise affects sortie/combat risk and is previewed.
- 5–8 enemy archetypes are configured and tested.
- Combat scene smoke tests pass.
- First 10 minutes have no blocker UX issue.
- No `console.error` in normal smoke.
- `npm run typecheck`, `npm run lint`, `npm run test`, and `npm run build` are green.
- Existing loot/return lifecycle, Yandex platform flows, IAP/ads, and cloud save are not rewritten in this milestone.

## 19. Anti-scope

Explicitly forbidden for M12.5:

- Full grid tactics.
- Real-time combat.
- Party/squad management.
- Deckbuilder mechanics.
- Boss overhaul.
- New save migration unless absolutely required and approved as its own risk.
- Yandex SDK changes.
- IAP/ads changes.
- Cloud save changes.
- Loot/return lifecycle rewrite.
- Mass content rename.
- Real weapon trademarks as player-facing default.
- Large new systems outside combat.

## Recommended PR sequence

1. **PR 1 — Combat safety harness**
   - Add scene smoke tests and content contract tests around current combat.
   - No gameplay changes.

2. **PR 2 — Combat state adapter**
   - Add adapter from current `GameState.currentSortie` + `MobRuntimeState` into `CombatState`.
   - Keep `CombatScene` UI and end lifecycle unchanged.

3. **PR 3 — AP model + action preview**
   - Add AP budget and preview-only UI shell.
   - Keep old actions mapped conservatively until tests pass.

4. **PR 4 — Enemy intent display**
   - Map existing mobAI behaviors to visible intents.
   - Show enemy cards/intents in scene without changing loot/return lifecycle.

5. **PR 5 — Ammo/reload canonicalization**
   - Implement magazine + backpack ammo by caliber + reload AP.
   - Add explicit empty-magazine fallback/blocking rules.

6. **PR 6 — Cover/suppression/distance bands**
   - Add close/medium/far and simple cover states.
   - Implement suppress/guard/exposed interactions.

7. **PR 7 — Noise meter and sortie-risk hook**
   - Add noise UI and minimal risk hook.
   - Avoid new large encounter systems.

8. **PR 8 — Status effects + skill integration pass**
   - Add minimal statuses and passive skill adapter.
   - No skill tree overhaul.

9. **PR 9 — First 10 minutes polish + QA gate**
   - Tune first fights, mobile layout, readable previews.
   - Close acceptance only with manual QA evidence.

## Risk register

| Risk | Why it matters | Mitigation |
|---|---|---|
| `CombatScene` god-object regression | Scene owns UI, turn loop, damage, XP, loot, ads, cloud save, transitions. | Add smoke tests first; do not rewrite end lifecycle in M12.5. |
| `CombatEngine` is not runtime truth yet | Tests may pass while player-facing scene still uses old logic. | Migrate one action path at a time and keep parity tests. |
| Ammo model mismatch | Scene uses backpack ammo; engine uses magazine. | Define canonical rule before implementation; add caliber/reload tests. |
| Durability inconsistency | Engine inline nulls broken weapon; helper has inventory consequences. | Route breakage through `durability.ts` in dedicated PR. |
| Status complexity creep | Too many hidden modifiers can confuse players. | Only implement visible statuses with preview/test expectations. |
| Noise becomes a new system | Scope can expand into encounter/AI rewrite. | Use simple thresholds and minimal sortie-risk hooks. |
| Mobile UI overload | AP, intent, ammo, noise, statuses can crowd 1280×720. | Use cards/chips/previews; test first 10 minutes on mobile landscape. |
| Save migration pressure | Unique weapon instances/status persistence could require save changes. | Avoid persistence changes unless absolutely required and split into separate PR. |
| Boss overhaul temptation | Bosses can consume the whole milestone. | Keep boss/miniboss future-compatible only; no boss redesign in M12.5. |

## Rollback strategy

- Keep current `CombatScene` end lifecycle as the fallback path until the reformat passes smoke tests.
- Gate new combat behavior behind an internal config flag during implementation PRs if needed.
- Land changes in small PRs with tests; revert the latest PR without reverting docs or unrelated systems.
- Preserve old low-level `combat.ts` formulas until replacement formulas are explicitly accepted.
- Do not change cloud save/IAP/ads/loot-return flows, so rollback does not require platform or save recovery work.
- If first 10 minutes QA fails, revert UI/action wiring to the previous simple action bar while keeping test harness and design docs.
