# M12.5 Combat Reformat — Tactical Survival Combat

> Status: design spec only. No runtime behavior is changed by this document.
>
> Goal: make combat the main player-facing hook before release/GO by reframing fights as tactical survival decisions under scarcity: AP, ammo, cover, noise, wounds, distance, and retreat risk.

## 0. Scope constraints

M12.5 is a combat reformat, not a platform/release-system rewrite.

In scope:
- mobile/landscape 1280×720;
- Phaser UI and existing scene stack;
- turn-based combat;
- AP, enemy intent, ammo, cover, noise, wounds, distance bands, and retreat risk;
- incremental migration from current `CombatScene` toward `CombatEngine` becoming runtime source of truth;
- generic weapon archetypes and player-facing generic names.

Out of scope:
- full grid tactics;
- real-time combat;
- party/squad management;
- deckbuilder mechanics;
- boss overhaul;
- large systems outside combat;
- cloud save, Yandex SDK, IAP/ads, monetization;
- loot/return lifecycle rewrite;
- mass content rename;
- real weapon trademarks as player-facing default.

## 1. Core fantasy

The player should feel: “I am surviving a dangerous sortie, not just trading hits.”

Every combat round should ask a practical survival question:
- Can I stop the enemy before their intent resolves?
- Do I spend ammo now or save it for a worse fight?
- Do I take cover, reposition, reload, suppress, heal, or retreat?
- Is the noise I create worth the immediate advantage?
- Can I leave with loot before the situation collapses?

The fantasy is controlled panic: the player has tools, but each tool consumes scarce resources or increases future risk.

## 2. Combat loop

M12.5 loop:
1. Enemy intents are shown before the player commits actions.
2. Player previews consequences: damage, ammo cost, AP cost, noise gain, status risk, retreat risk.
3. Player spends AP across one or more actions.
4. Actions resolve in deterministic order for the turn.
5. State updates: HP, ammo, magazine, durability, statuses, cover, distance, noise, enemy intent, combat log.
6. Next turn begins with refreshed AP and newly shown intents.

The hook is the intent/read/answer loop. Damage numbers matter, but the key emotion is “I understood what was coming and chose how to answer.”

## 3. Enemy intents

Enemy intents must be visible before the player acts. Each living enemy card should show one intent icon, short verb, target if relevant, and compact consequence preview.

| Intent | What player sees | Player answers | If ignored |
|---|---|---|---|
| `attack` | Damage range, target, distance requirement. | Cover, guard, kill/stun, move, suppress. | Enemy attacks and applies damage/status. |
| `aim` | Higher next-shot danger. | Cover, suppress, stun, rush close, kill. | Next attack gains accuracy/crit/armor-pierce or ignores guard. |
| `rush` | Enemy closing distance. | Suppress, move away, quick shot, guard, kill. | Enemy reaches close range and creates melee threat. |
| `guard/cover` | Defense/cover preview. | Aimed shot, expose, suppress, reload, reposition. | Enemy becomes harder to damage. |
| `reload` | Reduced immediate threat, future ranged threat. | Attack, rush, reposition, reload, retreat. | Enemy restores ammo/magazine. |
| `suppress` | AP/status risk. | Take cover, suppress back, move, stun, kill. | Player may become suppressed. |
| `special` | Named special warning. | Counter depends on special. | Status, high damage, phase hook, or sortie risk. |
| `flee` | Flee consequence. | Finish, let go, suppress/stun. | Enemy leaves; drops/XP may be reduced. |

Intent rules:
- one short UI phrase;
- predictable from enemy archetype;
- reliable once shown unless the player changes conditions;
- boss/miniboss specials remain future-compatible, not a boss overhaul.

## 4. Player AP economy

Baseline: 3 AP per player turn.

| Action | AP | Purpose |
|---|---:|---|
| Quick shot | 1 | Low-cost attack / finisher. |
| Aimed shot | 2 | More reliable attack. |
| Suppress | 2 | Reduce enemy options; uses ammo/noise. |
| Guard / take cover | 1 | Defensive survival. |
| Move distance | 1 | Change close/medium/far by one band. |
| Reload | 1–2 | Restore magazine from backpack ammo by caliber. |
| Item | 1 | Heal or utility. |
| Retreat | 2 + risk | Leave combat with risk. |

AP should create 2–3 meaningful combinations per turn, not 12 micro-actions. If an action is unavailable, the UI must explain why: no AP, empty magazine, no reserve ammo, jammed, stunned, wrong distance.

## 5. Distance bands

No grid. Exactly three distance bands:
- close — melee/rush danger;
- medium — default firearm range;
- far — rifles/snipers stronger, melee weak, retreat safer but not free.

Weapon roles:
- knife/melee: best close, silent, risky;
- pistol: flexible, medium/close;
- shotgun: strong close/medium, high noise;
- rifle: medium/far, awkward close;
- automatic/SMG if supported: suppression/control, high ammo/noise;
- improvised: fragile/scarcity tool.

## 6. Cover / guard / suppression

No geometry simulation. Use simple states:
- `guarded` — next hit/status reduced;
- `in cover` — stronger vs ranged;
- `exposed` — loses cover/guard and takes more damage;
- `suppressed` — reduced AP/options/accuracy, cannot aim/rush safely.

These must be visible, short-duration, and testable.

## 7. Noise meter

Noise connects combat decisions to sortie risk without rewriting loot/return lifecycle.

Noise sources:
- firearm attacks;
- suppress/burst;
- explosive/special actions if later added;
- some enemy suppress/rush/special actions;
- melee/guard/move/item are low or zero noise.

Noise effects should be simple:
- higher chance of later reinforcements or worse next encounter modifier;
- increased retreat risk;
- reduced post-combat safety at thresholds.

UI:
- visible meter: Quiet → Heard → Dangerous → Overrun;
- action preview shows Noise +N;
- threshold warnings before crossing danger levels.

## 8. Ammo / reload / durability canonical rule

Future canonical rule:
- ranged weapons use a magazine;
- backpack stores ammo by caliber;
- firing consumes magazine ammo;
- reload consumes compatible backpack ammo and fills the magazine;
- reload cost depends on archetype;
- empty magazine blocks ranged attacks or offers clearly labeled weak fallback;
- UI shows magazine, reserve ammo, caliber, reload AP cost, and reload availability;
- durability loss is visible;
- breakage consequences should route through `durability.ts`, not ad-hoc inline nulling.

No save migration should be introduced unless absolutely required and split into a separate risk-approved PR.

## 9. Status effects

Minimum visible set:
- `bleed` — HP loss over 2–3 turns;
- `stun` — loses AP/action chunk once;
- `exposed` — worse defense / more damage taken;
- `suppressed` — cannot aim/rush, worse options;
- `guarded` — reduces next incoming hit/status;
- `wounded` — combat-long penalty unless healed;
- `jammed` — weapon cannot fire until cleared/reloaded.

All statuses must be visible, previewable, and covered by tests. Hidden combat modifiers are out of scope.

## 10. Skills integration

M12.5 integrates with the existing skill tree; it does not redesign progression.

Principles:
- passive modifiers flow through explicit adapter functions;
- effects appear in previews;
- no new skill tree branch;
- unsafe skills remain legacy passive until a later progression PR.

Example: `Steady Hands` makes the first aimed shot cheaper or more accurate once per combat, with preview and unit test.

## 11. Enemy archetypes

Tune 5–8 archetypes:
- weak marauder — attack/flee/reload; teaches ammo value;
- wild dog/rusher — rush/attack; teaches distance and guard;
- armored guard — guard/cover/attack; teaches aim/expose/suppress;
- sniper/ranged — aim/attack/reload; teaches interrupt/cover;
- mutant/brute — rush/special/attack; teaches control/retreat;
- suppressor — suppress/reload/attack; teaches cover/suppression duel;
- boss/miniboss future-compatible — special/phase-flavored intents only, no overhaul.

## 12. Combat UI layout — 1280×720 landscape

Suggested layout:
- top row: enemy cards with HP, distance, cover/status chips, intent;
- center: hero left, enemy focus right, distance indicator;
- bottom left: player HP/status/armor/guard;
- bottom center: AP pips and action bar;
- bottom right: weapon panel with archetype, magazine/reserve ammo, durability, jam/break warning;
- side/lower-right: action preview;
- lower strip: last 3–5 combat log events;
- visible noise meter.

Requirements:
- mobile touch targets;
- intent/AP readable without tooltips;
- preview before confirmation;
- no critical action depends only on color.

## 13. First 10 minutes target experience

In the first 1–3 fights, the player should understand:
1. I saw enemy intent.
2. I could have played better.
3. Ammo matters.
4. Cover matters.
5. Noise is dangerous.
6. Retreat can be smart.

Suggested onboarding:
- fight 1: intent + AP + quick/guard;
- fight 2: ammo/reload + cover;
- fight 3: noise + retreat/suppression or rusher distance.

## 14. Balance principles

- Ordinary fights target 3–6 player turns.
- Regular fights use 1–3 enemies; 4 is upper bound.
- Decision density beats raw complexity.
- Fail states must be explainable.
- Randomness must be previewed as ranges/chances.
- Player should lose through readable risk accumulation, not surprise one-shots.
- Scarcity should pressure decisions, not soft-lock the player.

## 15. Telemetry/events

If telemetry is available, align these events without blocking gameplay:
- `combat_start`;
- `combat_intent_shown`;
- `combat_action_selected`;
- `combat_damage_taken`;
- `combat_noise_changed`;
- `combat_retreat`;
- `combat_victory`;
- `combat_defeat`.

Telemetry must fail soft and never create release blockers if unavailable.

## 16. Test plan

Unit tests:
- AP costs;
- distance modifiers;
- cover/guard/exposed/suppressed transitions;
- noise thresholds;
- ammo reload by caliber;
- durability routing contract;
- status durations/effects.

Engine tests:
- CombatEngine turn loop with AP;
- intent generation stable before action;
- preview matches resolution;
- intent counters;
- victory/defeat stable;
- legacy mobAI maps to intents.

Scene smoke tests:
- seeded CombatScene at 1280×720;
- enemy cards + intent + AP + action bar + preview + noise meter render;
- quick shot, guard, reload, retreat flows;
- victory goes to existing loot flow;
- defeat/second chance remains existing platform flow.

Content contract tests:
- every combat mob has archetype/intent mapping;
- every weapon-like item maps to generic archetype;
- every ranged weapon has caliber/magazine/reload metadata or fallback;
- every referenced status is supported;
- no player-facing real weapon trademarks in default naming mode.

Manual QA:
- first 1–3 fights recorded;
- intent/AP/ammo/cover/noise/retreat visible;
- no console.error;
- no blocker UX on mobile landscape.

## 17. Acceptance criteria

M12.5 is ready only when:
- player sees enemy intent before action;
- AP is visible and works;
- ammo/reload are understandable and tested;
- cover/suppression work and are visible;
- noise affects risk and is previewed;
- 5–8 enemy archetypes are configured and tested;
- CombatScene smoke tests pass;
- first 10 minutes have no blocker UX;
- no console.error in normal smoke;
- typecheck/lint/test/build are green;
- loot/return lifecycle, Yandex platform flows, IAP/ads, and cloud save are not rewritten.

## 18. Anti-scope

Forbidden:
- grid tactics;
- real-time;
- party/squad;
- deckbuilder;
- boss overhaul;
- save migration unless separate risk-approved PR;
- Yandex SDK/IAP/ads/cloud changes;
- loot/return rewrite;
- mass content rename;
- real weapon trademarks as player-facing default;
- large new systems outside combat.

## Recommended PR sequence

1. Combat safety harness — scene smoke tests and content contract tests around current combat; no gameplay changes.
2. Combat state adapter — adapt `GameState.currentSortie` + `MobRuntimeState` into `CombatState`; keep CombatScene UI/end lifecycle.
3. AP model + action preview — add AP budget and preview-only UI shell; conservative old-action mapping.
4. Enemy intent display — map existing mobAI behaviors to visible intents and show cards.
5. Ammo/reload canonicalization — magazine + backpack ammo by caliber + reload AP.
6. Cover/suppression/distance bands — close/medium/far and simple cover states.
7. Noise meter and sortie-risk hook — minimal thresholds/risk hook.
8. Status effects + skill adapter — minimal statuses and passive skill integration.
9. First 10 minutes polish + QA gate — tune first fights/mobile layout and close only with evidence.

## Risk register

| Risk | Why it matters | Mitigation |
|---|---|---|
| `CombatScene` god-object regression | Owns UI, turn loop, damage, XP, loot, ads, cloud save, transitions. | Add smoke tests first; do not rewrite end lifecycle. |
| `CombatEngine` not runtime truth | Tests may pass while player scene uses old logic. | Migrate one action path at a time with parity tests. |
| Ammo mismatch | Scene uses backpack ammo; engine uses magazine. | Define canonical rule and add tests first. |
| Durability inconsistency | Engine inline nulls broken weapon; helper has inventory consequences. | Route through `durability.ts`. |
| Status creep | Hidden modifiers confuse players. | Only visible statuses with previews/tests. |
| Noise scope creep | Can become encounter/AI rewrite. | Simple thresholds and minimal sortie hooks. |
| Mobile UI overload | AP/intent/ammo/noise/statuses can crowd 1280×720. | Cards/chips/previews and mobile smoke. |
| Save migration pressure | Unique instances/status persistence may require save changes. | Avoid or split into separate PR. |
| Boss overhaul temptation | Can consume the milestone. | Future-compatible display only. |

## Rollback strategy

- Keep current CombatScene end lifecycle as fallback until smoke tests pass.
- Gate new behavior behind internal config if needed.
- Land small PRs; revert latest PR without reverting docs or unrelated systems.
- Preserve old low-level `combat.ts` formulas until replacements are accepted.
- Do not touch cloud save/IAP/ads/loot-return flows.
- If first 10 minutes QA fails, revert UI/action wiring while keeping tests and design docs.
