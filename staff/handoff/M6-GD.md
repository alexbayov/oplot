# Handoff — Game Designer M6 (Радио и доверие)

> Этот документ — подробный брифинг для GD на вехе M6. Это **amendment-сессия**: GDD §1–§9 уже зафиксированы под M1–M5 и НЕ переписываются. Ты расширяешь §10 «Радио и доверие» из M3 UI-stub до full M6 logic, добавляешь schema/state notes, и секцию §M6 в `balance.md`.

## Preconditions

- `m6-integration` создана от `main` HEAD `0af8ad4` (M5 gate-close PR #47 merged).
- PM kickoff PR #48 (`pm/m6-kickoff → m6-integration`) merged — это твой trigger.
- M5 закрыта: 152 vitest, 1.48 MB build, 412 KB assets, M3 RadioScene still UI-stub.

## Контекст файлов

**Читать:**
1. `staff/CONTEXT.md`
2. `staff/LINKS.md`
3. `staff/status/M6.md`
4. `staff/handoff/M5-SUMMARY.md`
5. `staff/handoff/M4-SUMMARY.md`
6. `staff/handoff/M3-SUMMARY.md`
7. `docs/GDD.md`:
   - §10.M3 (RadioSignal stub schema + UI-flow + expiry).
   - §6 schema sections for existing content conventions.
   - §9 M5 bosses/daily/gas/T3 to avoid regressions.
8. `docs/balance.md`:
   - §M3 radio stub notes.
   - §M5 final counts and anti-scope.
9. `docs/content-brief.md` — radio-signal meaningful choice rule.

**Не трогать:** GDD §1–§9 except minimal cross-ref if needed. `balance.md` §M1–§M5. `src/`, `content/`, `assets/`, non-GD staff files.

## Deliverables

### 1. GDD §10.M6 «Радио и доверие» — full logic

Extend existing §10 after §10.M3. Required:

- M6 scope statement: radio choices now have consequences.
- 3 signal types:
  - `truth` — real request/opportunity; respond can grant reward.
  - `trap` — hostile bait; respond can trigger ambush.
  - `ambiguous` — partial truth; mixed reward/trust/ambush risk.
- Exactly 2 option ids for M6 start: `respond` and `ignore`.
- `respond` and `ignore` outcomes differ by signal type.
- Trust is global, not faction-specific.

### 2. Schema extension for `RadioSignal`

Specify exact TypeScript-like schema:

```ts
type RadioSignalType = "truth" | "trap" | "ambiguous";
type RadioSignalOptionId = "respond" | "ignore";

interface RadioReward {
  item_id: string;
  count: number;
}

interface RadioTrustImpact {
  respond: number;
  ignore: number;
}

interface RadioSignal {
  id: string;
  from: string;
  subject: string;
  body_ru: string;
  type: RadioSignalType;
  zone_id: "forest" | "warehouse" | "city";
  options: RadioSignalOption[];
  reward: RadioReward | null;
  trap_mob_id: string | null;
  trust_impact: RadioTrustImpact;
  expires_after_sorties: number;
  chosen_option: RadioSignalOptionId | null;
  resolved: boolean;
}
```

Backward compatibility: M3 `dismissed` may be migrated to `resolved`; Content/Engineer decide exact JSON migration, but GD must state intended semantics.

### 3. Trust flow

Specify:

- `GameState.progress.radio_trust: number`
- initial = `0`
- clamp range = `-5..+5`
- all trust impacts apply once when option is chosen
- resolving already-resolved signal is no-op
- expired unresolved signals become resolved with optional ignore-equivalent trust impact (choose and fix exact rule)

### 4. Outcome rules

Required exact behavior:

- Rewards go to `GameState.baseStash`, not backpack.
- Rewards use existing M5 item ids only.
- Ambush uses existing regular mob id only; no new combat mechanics.
- If a signal has both reward and trap (ambiguous), specify exact order and UI outcome summary.
- If reward item missing or trap mob missing, Engineer must fail-safe and QA must mark content cross-ref blocker.

### 5. balance.md §M6 exact numbers

Add exact tables:

- Trust range and clamp.
- Trust impact matrix by type + option.
- Exactly 6 signal archetypes: 2 truth, 2 trap, 2 ambiguous.
- For each signal archetype: id suggestion, type, zone, reward item/count or null, trap mob id or null, expires_after_sorties, trust respond/ignore.
- Reward counts sane: small M1–M5 existing resources/consumables only.
- Trap mobs sane: existing regular mobs, not bosses.

### 6. Edge cases

Cover:

- Signal expires while visible.
- Player clicks same option twice / scene restarts.
- Trust at clamp boundary.
- Reward item missing from content.
- Ambush mob missing from content.
- Ignore trap signal.
- Respond to ambiguous signal with both reward and ambush.
- Existing M3 dummy signals migration.

### 7. Anti-scope M6

Must explicitly list:

- Yandex SDK / Cloud Saves / Leaderboard / IAP / rewarded ads = M8.
- New zones/mobs/bosses/T4 gear = not M6.
- Modular equipment / armor slots / runes = M5+ separate subsystem.
- Skill tree / active abilities / cooldowns = not M6.
- Faction-specific reputation = M7+ (M6 global trust only).
- Real-time/background timers = not M6 (sortie-based expiry only).
- New combat mechanics = not M6 (ambush uses existing combat).
- Voice/audio/sound = M7 polish.

## Acceptance criteria for GD PR

- Only `docs/GDD.md`, `docs/balance.md`, `staff/status/GAME_DESIGNER.md`.
- GDD §10.M6 and balance §M6 use exact numbers.
- No changes to M1–M5 sections except additive cross-refs.
- Plan is 5–7 points before implementation.
- Draft PR early with Recovery block.
