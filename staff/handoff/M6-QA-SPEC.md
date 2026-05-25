# Handoff — QA Spec Review M6

> Подробный брифинг для QA Engineer на этапе **spec-review** вехи M6. Ты проверяешь GD M6 amendment PR против 7 чек-листов и пишешь verdict APPROVE / CHANGES_REQUESTED.

## Preconditions

- GD M6 amendment PR `m6/gd-amendment → m6-integration` Ready (не Draft).
- Ты делаешь PR `qa/m6-spec-review → m6-integration` с одной правкой: `staff/status/QA.md`.

## Контекст файлов

**Читать:**
1. `staff/CONTEXT.md`
2. `staff/LINKS.md`
3. `staff/status/M6.md`
4. `staff/handoff/M6-QA-SPEC.md`
5. `staff/handoff/M6-GD.md`
6. `staff/handoff/M5-SUMMARY.md`
7. `staff/STATE_MACHINE.md`
8. `docs/GDD.md` целиком
9. `docs/balance.md` целиком
10. GD PR diff: `git diff origin/m6-integration..origin/m6/gd-amendment -- docs/ staff/`

## 7 чек-листов

### §1 GDD §10.M6 full radio/trust

- [ ] §10.M6 присутствует (не placeholder).
- [ ] Описаны 3 signal types: `truth`, `trap`, `ambiguous`.
- [ ] `respond` и `ignore` имеют разные consequences.
- [ ] Global `radio_trust` описан: initial 0, clamp -5..+5.
- [ ] Rewards / ambush / trust changes described as one-time resolution.
- [ ] Edge cases listed.

**Verdict §1:** PASS / FAIL + цитата.

### §2 Schema extensions

- [ ] `RadioSignal` schema includes: `type`, `zone_id`, `reward`, `trap_mob_id`, `trust_impact`, `chosen_option`, `resolved`.
- [ ] `RadioReward` and `RadioTrustImpact` shapes exact.
- [ ] M3 `dismissed` migration semantics documented.
- [ ] `GameState.progress.radio_trust` documented.
- [ ] No faction-specific reputation schema.

**Verdict §2:** PASS / FAIL + цитата.

### §3 balance.md §M6 exact numbers

- [ ] §M6 section exists.
- [ ] Trust range and clamp exact.
- [ ] Trust impact table exact.
- [ ] Exactly 6 signal archetypes: 2 truth, 2 trap, 2 ambiguous.
- [ ] Reward item/count exact and sane.
- [ ] Trap mob ids exact and existing regular mobs only.
- [ ] `expires_after_sorties` exact.

**Verdict §3:** PASS / FAIL + цитата.

### §4 Consistency with M3/M5

- [ ] M3 RadioScene stub is extended, not contradicted without migration.
- [ ] M5 systems (boss/daily/gas/T3) not redefined.
- [ ] Rewards use existing item ids from M5.
- [ ] Ambush uses existing mob ids from M5 content.
- [ ] Sortie-based expiry preserved; no real-time timers.

**Verdict §4:** PASS / FAIL + цитата.

### §5 Anti-scope M6

Grep/check:
- [ ] Yandex SDK / Cloud Saves / Leaderboard / IAP only mentioned as M8/out-of-scope.
- [ ] No new zones/mobs/bosses/T4 as M6 features.
- [ ] No module weapons / armor slots / runes as M6 features.
- [ ] No skill tree / active abilities / cooldown abilities.
- [ ] No faction-specific reputation as M6 feature.
- [ ] No real-time/background timers.
- [ ] No new combat mechanics / voice/audio.

**Verdict §5:** PASS / FAIL + цитата.

### §6 Handoff readiness

- [ ] Content has enough exact data to write 6 signals.
- [ ] Engineer has enough exact data to implement state/outcomes/tests.
- [ ] Artist has enough visual brief for 4 assets, or GD explicitly says art remains generic.
- [ ] DoD-precision uses exact counts: 6 signals, 164 tests, 4 assets.

**Verdict §6:** PASS / FAIL + цитата.

### §7 Recovery-safe + PR hygiene

- [ ] PR base = `m6-integration`.
- [ ] Scope only `docs/GDD.md`, `docs/balance.md`, `staff/status/GAME_DESIGNER.md`.
- [ ] Recovery block present.
- [ ] No `src/`, `content/`, `assets/`, чужих `staff/`.
- [ ] Plan was 5–7 points or split.

**Verdict §7:** PASS / FAIL + цитата.

## Final verdict

APPROVE only if all 7 sections PASS. Any cross-spec mismatch is blocker.
