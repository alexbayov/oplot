# M12.5 to M14 Gameplay Roadmap

This document outlines the concrete developmental roadmap, system statuses, critical invariants, and next engineering steps as we transition from M12.5 to M13 and M14 milestones.

---

## 1. Current State Snapshot

The following systems and mechanics are currently implemented and verified:
* **AP Preview:** Action Points are displayed as pips, and actions show a preview of their AP cost.
* **Enemy Intents:** Enemy actions are dynamically telegraphed to the player.
* **Combat Adapter/Snapshot:** A safety-harness layer adapting sortie/mob runtime data for the combat scene.
* **Ammo/Reload/Magazine/Refund:** Complete magazine-to-backpack lifecycle with safety refunds on defeat, victory, and retreat.
* **Distance Chip:** Medium range initialized and rendered on the combat HUD.
* **Movement Preview:** Distance buttons (`БЛИЖЕ` / `ДАЛЬШЕ`) are active but operate in preview mode (does not consume AP or change distance).
* **Cover Chip:** The `Укрытие` chip displays dynamically on the player's HUD when their sortie cover state is active.
* **Noise Chip & Local Mutation:** A local noise counter increments by `+2` for every valid firearm shot. HUD labels display appropriate levels (`тихо`, `слышно`, `опасно`, `Шум критический`).
* **QA Checklist:** Runbook established (`M12-5-FIRST-10-MINUTES-COMBAT-QA.md`) to verify visual layouts and interaction flows.

---

## 2. System Status: Real vs. Preview-Only

| System | Current Status | Real Gameplay Effect? | Notes |
|---|---|---|---|
| **AP System** | Active (3 AP max) | **Yes** | Actions consume AP; turns resolve when AP is spent. |
| **Reload Action** | Active (0 AP cost) | **Yes** | Decrements reserve calibers and refills weapon magazine. |
| **Magazine Attack**| Active | **Yes** | Ranged weapon fires only if magazine > 0; decrements magazine. |
| **Ammo Refund** | Active | **Yes** | Returns loaded chambered rounds back to reserve on exit. |
| **Enemy Intent** | Active | **Yes** | Mob intents are generated and telegraphed before player action. |
| **Distance Band** | Active (starts Medium) | **Yes** (visual only) | Currently initialized to Medium; has no mechanical modifiers yet. |
| **Movement Buttons**| Active | **No** (Preview-only) | Pressing buttons logs a preview message without spending AP or changing bands. |
| **Cover Chip** | Active | **Yes** | Shows when `currentSortie.cover_active` is true. |
| **Noise Chip** | Active | **Yes** (visual representation) | Represents noise state on the HUD. |
| **Noise Mutation** | Active (Scene-local) | **Yes** | Firing valid firearm shots increments `currentNoise` by `+2`. |
| **Suppression** | Inactive | **No** | Not yet implemented. |
| **Status Effects** | Inactive | **No** | Not yet implemented. |
| **CombatEngine** | Model-only | **No** | The `CombatScene` remains the runtime authority; engine is not active. |

---

## 3. Critical Invariants

Every future PR must preserve these rules to ensure combat integrity:
1. **Magazine Authority:** Firing a ranged firearm MUST consume magazine ammo first, never backpack reserve ammo directly.
2. **Reload Caliber Matching:** Reloading MUST consume matching calibers from the backpack and place them into the localized magazine.
3. **No Ammo Leaks:** All unspent loaded magazine ammo MUST be fully refunded back to the backpack reserve on exit (retreat, victory, defeat).
4. **Preview Isolation:** No action preview refresh or display update is allowed to mutate player resources, ammo, AP, or HP.
5. **Gated Noise Mutation:** Local noise (`currentNoise`) must only mutate after a valid loaded firearm shot is successfully committed.
6. **Preview Movement Constraints:** Distance band movement remains preview-only until the AP-cost and modifier rules are explicitly designed and tested.
7. **Cover Chip Binding:** The player’s cover chip must directly read from the sortie cover flag, and must never display hero cover due to enemy mob cover states.
8. **CombatScene Runtime Authority:** `CombatScene` remains the sole authority for combat state and scene transitions. The `CombatEngine` must not be wired as the active runtime authority without parity testing.
9. **No Save Schema Drift:** No save game database changes or schema migrations are allowed unless explicitly authorized and isolated.

---

## 4. Recommended Next Blocks (Milestone Roadmaps)

```mermaid
gantt
    title M12.5 to M14 Roadmap
    dateFormat  YYYY-MM-DD
    section Phase B (M13)
    PR8: Status Effects Preflight & Display    :active, pr8, 2026-06-05, 5d
    PR9: Real Tactical Movement (AP cost)     : pr9, after pr8, 7d
    PR10: Suppression & Exposed States        : pr10, after pr9, 6d
    PR11: Enemy AI Archetype Variety          : pr11, after pr10, 8d
    section Phase C (M14)
    PR12: Local Noise to Sortie Risk Hook    : pr12, after pr11, 7d
    PR13: CombatEngine Authority Migration    : pr13, after pr12, 10d
    PR14: Loot & Balance Tuning Pass          : pr14, after pr13, 7d
```

### Block PR8 — Status Effects Preflight / Display
* **Step 1:** Create `M12-5-PR8-STATUS-EFFECTS-PREFLIGHT.md` specifying status rules.
* **Step 2:** Write pure status helper logic to represent active statuses.
* **Step 3:** Implement display-only status chips on mob and player cards.
* **Step 4:** Do not apply active damage-over-time (DoT) or modifiers until previews are stable.
* **Scope:** Bleed (`bleed`), Stun (`stun`), Suppressed (`suppressed`), Exposed (`exposed`), Burning (`burning`).

### Block PR9 — Real Movement / Distance Bands
* **Step 1:** Preflight document defining movement consequences.
* **Step 2:** Assign a 1 AP cost to movement actions.
* **Step 3:** Moving closer or further changes the distance band by one step (Close $\leftrightarrow$ Medium $\leftrightarrow$ Far).
* **Step 4:** Disable the `БЛИЖЕ` button at Close, and the `ДАЛЬШЕ` button at Far.
* **Step 5:** Add unit and integration tests confirming AP cost, band mutation, and weapon damage modifiers by band.

### Block PR10 — Suppression / Exposed / Guard
* **Step 1:** Preflight document detailing tactical defense modifiers.
* **Step 2:** Ensure suppression is treated as a distinct status separate from noise.
* **Step 3:** Enemy intent generation must dynamically adapt when a mob is suppressed (e.g. cannot "Rush" or "Aim").
* **Step 4:** Implement HUD display chips before adding active combat state modifiers.

### Block PR11 — Enemy Variety / Mob Behavior Cleanup
* **Step 1:** Establish clear content contracts for mob behaviors.
* **Step 2:** Refactor the legacy `mobAI` behavior mapping to route cleanly through telegraphed intent generators.
* **Step 3:** Introduce configured behaviors one at a time (e.g., wild dogs only rush/melee, snipers aim/reload/shoot).
* **Step 4:** Add contract validation tests preventing mobs from selecting actions they don't have metadata for.

### Block PR12 — Sortie Risk Hook from Noise
* **Step 1:** Connect local noise level to global sortie danger.
* **Step 2:** Design a visible risk meter that warns the player of potential consequences.
* **Step 3:** Hook noise levels to subsequent battle generation (e.g., higher noise leads to an increased chance of encountering reinforcements or tougher mob modifiers).
* **Step 4:** Keep the implementation transparent; no hidden reinforcement spawns mid-fight.

### Block PR13 — CombatEngine Authority Decision
* **Step 1:** Decide if the `CombatEngine` should take over as the active runtime source of truth.
* **Step 2:** Write a detailed migration plan to safely transition state authority from `CombatScene` without regressing UI updates.
* **Step 3:** Add engine-to-scene parity test blocks verifying identical combat resolution outcomes.

### Block PR14 — Balance / Content Pass
* **Step 1:** Perform balance tuning only after all mechanics are fully stabilized and manual QA checks are clean.
* **Step 2:** Tune firearm damage, armor defense values, reload costs, ammo drop rates, and mob HP.
* **Step 3:** Do not perform broad database renames; keep naming generic and clear.

---

## 5. What NOT to Do Next

To prevent milestone regression and scope creep, do NOT attempt any of the following tasks yet:
* **No Reinforcements:** Do not add reinforcements or mid-combat spawns.
* **No Sortie Danger Mutations:** Keep noise strictly scene-local for now; do not link noise to global sortie risk until Phase C.
* **No CombatEngine Activation:** Do not route runtime states through the `CombatEngine` yet.
* **No Save File Overhauls:** Do not introduce save game schema changes or persistence alterations.
* **No Batch Status Effects:** Do not code multiple gameplay status logic loops simultaneously. Focus on preflights and visual chips first.
* **No Free Movement:** Do not enable real movement without wiring up proper AP checks.
* **No Content Mass Edits:** Do not modify items or mobs data before resolving HUD layout issues.

---

## 6. Immediate Next Step

We recommend proceeding with **PR8 Preflight — Status Effects / Conditions**.
* **Preflight Target:** Define the data structure, display logic, and preview rules for `bleed`, `stun`, `suppressed`, and `exposed` statuses.
* **QA Dependency:** Before coding the runtime implementation of PR8, run the full manual browser QA checklist (`M12-5-FIRST-10-MINUTES-COMBAT-QA.md`) and resolve any existing visual or interaction bugs.

---

## 7. Implementation Style (Codex Rules)

All development cycles must follow this pipeline:
```text
Preflight Doc -> Pure Helper -> Display-Only -> Runtime Mutation -> Hardening Tests -> Closeout Doc
```
1. **Isolated PRs:** One small pull request per development slice.
2. **Mutation Disclosures:** Every runtime PR description must list the exact lines and functions where states are mutated.
3. **Explicit Anti-Scope:** Clearly outline what is NOT being changed in the PR description.
4. **Build Verification:** Run typecheck, lint, unit tests, and production build checks prior to opening the PR.

---

## 8. Open Questions

The design and engineering teams must address these questions before Phase B completion:
1. *Should movement become real before status effects?* (Movement is simpler but has direct AP balancing consequences).
2. *Should reload ever cost Action Points?* (Currently it is 0 AP; making it cost 1 AP will drastically increase ammo scarcity tension).
3. *How visible should sortie risk be when noise increases?* (Should there be an explicit percentage indicator or a general danger warning?)
4. *Should status effects be symmetrical (affecting player and enemy identical) or specialized?*
5. *Should CombatEngine become the sole runtime authority, or remain a model layer?*
6. *What is the minimum viable "fun" combat loop we need to lock in before adding more mechanics?*

---

## 9. Suggested Product Definition of "M12.5 Accepted"

The M12.5 milestone should be marked accepted only when:
* **QA Evidence is Logged:** A successful run of `M12-5-FIRST-10-MINUTES-COMBAT-QA.md` is complete with screenshots of reload, cover, and firearm preview text.
* **Zero Console Blockers:** No `console.error` logs appear during standard combat flow.
* **Readability Guaranteed:** All HUD elements fit on a 1280×720 viewport without overlaps.
* **Safe Loops:** Smoke tests confirm quick shot, reload, retreat, victory, and defeat transitions work perfectly without softlocks or ammo loss/duplication.
* **Manual Verification:** A manual review notes that combat decisions are readable, telegraphed, and understandable.

---

## 10. Summary for Non-Engineering Reader

We have successfully completed the core tactical combat foundation. The game now tracks ammunition magazines, telegraphed enemy moves, cover states, and noise foot-printing. 

Our immediate goal is not to rush new mechanics into the code, but to run QA checks to ensure the interface is perfectly readable and stable. Once verified, we will carefully introduce status conditions (like bleeding and suppression) and tactical movement, ensuring at each step that the player is never punished by hidden rules and always has the tools to make survival decisions.
