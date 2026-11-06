# Siege Simulation Console — v0.7 Development Record

This document consolidates the milestone README notes from the v0.7 development series into one historical reference. It records what was implemented *at each milestone*, not a claim that every limitation still applies to v0.8.1. For current behavior, see `README.md`, `README_080.md`, and `README_081.md`.

## Development arc

| Milestone | Focus | Key result |
| --- | --- | --- |
| 0.7A–D | Combat and integrated contact | Frozen-snapshot attrition; unified sector-wide opposed CP, with physical engagement eligibility |
| 0.7G–K | Capture and routes | Capture commitment; legal East Wall interior and local route experiments |
| 0.7N | Frontage and rotation | Contact-specific eligibility and atomic allied local swaps |
| 0.7O | Swarmer replenishment | Opt-in contiguous rear-chain transfer of cohesion, conserving strength |
| 0.7Q | Archer blind volley | Optional 50% blind exterior fire, mutually exclusive with inner support |
| 0.7R–S | Route-driven balance and coordination | 32-configuration East Wall experiments and validated coordinated order batches |
| 0.7T–U | Persistent commands | Strict Hold, Host Assault, Coalition Reinforce/Withdraw/Rotate, latest-command precedence |
| 0.7V–W | Architecture and arbitration | Canonical rule data, physical frontage enforcement, order-aware integrated phase boundary |
| 0.7X–Y | Cross-sector routes | Macro-zone next-hop planning, detours, Host Swarmer macro routing |
| 0.7Z | Blockage diagnostics | Classified, deduplicated standing-order blockage reporting |

## Governing distinctions retained through the series

- **Combat**: one opposed sector-wide CP comparison for eligible physical engagements; not a separate combat roll for each wall position.
- **Movement authority**: dispatcher and standing-order planners propose actions; the movement resolver accepts or rejects them.
- **Control**: physical presence, effective defensive denial, and ownership are distinct. Capture is a committed action, not an automatic consequence of entry.
- **Strength**: replenishment moves existing cohesion from eligible reserves and never creates bodies or additional frontage.
- **Commands**: newest explicit orders supersede older commands per affected company; blocked standing orders persist.
- **Status**: historical experiment outcomes are not proof of full-siege balance, autonomous tactical intelligence, or completed victory/dawn lifecycle.

## Historical milestone notes (preserved)

The sections below retain the original milestone notes, including their then-current test counts, experimental defaults, limitations, and commands. Some statements were superseded in later versions.

---

## Historical source: `README_07H.md`

# Siege Simulation Console v0.7H — Legal Host Routes

Run `npm test` (65 passing) and `node experiments/east-wall-legal-routes.mjs`.

See `dev/LEGAL_ROUTES_07H.md` for findings and limitations. The deterministic East Wall dispatcher is a test policy, not autonomous strategic AI. This package preserves the canonical Swarmer data and existing attrition thresholds.

---

## Historical source: `README_07N.md`

# v0.7N — Frontage-aware engagement validation (experimental)

## Changes
- `engagementReach: 'frontage'` opt-in config for engagement discovery. The default remains `legacy-sector` to preserve older experiments and tests.
- In frontage mode, only Host and Coalition units in actual co-located contact positions enter the sector's opposed melee calculation. Uncontacted outer melee defenders and Host units do not project CP into unrelated fights. Inner melee reserves do not support outer combat. Inner Archers retain 80% support only with an explicitly clear lane and active outer contact.
- `local-swap` order: `{kind:'local-swap',unitId:'...',withUnitId:'...'}`. Atomic same-sector, allied company exchange via legal local routes. Contested *frontline* permitted, but contested reserve destinations and blocked intermediate corridors forbidden. Neither company loses/gains cohesion, and both use their movement for the phase. Resolve before combat.
- New `tests/frontage-swap-07n.test.js` checks contact, uncontacted units, ranged support, swap and route safety.
- `experiments/frontage-balance-07n.mjs`: deliberately constrained 8-phase 45/70/100 CP comparison with three active Swarmers, three waiting in approach, one frontline Men-at-Arms, one inner reserve, one supporting Archer; swap on phase 4 in the rotation condition.

## Known gaps — do not use as full-siege balance verdict
- The frontend scenario dispatcher and default engine config have NOT been migrated to `engagementReach:'frontage'`; pass this option to opt in.
- Flying Harpies, takeoff/landing, 70% grounded Harpy CP and ground-only Capture are not implemented in this slice.
- The eight-phase balance fixture holds the frontline static; it does not include replenishment, climbing, positional capture, routing, hero actions or the entire Host army. It is only a CP/attrition and rotation diagnostic.
- One sector-wide opposed ratio is still used for all eligible contacted positions. A later test should verify whether pooling independent position fights produces unintuitive casualty sharing.
- Swap currently uses a phase movement step but no separate phase commitment; once per company per phase, before combat.

## Run
`npm test`
`node experiments/frontage-balance-07n.mjs`

---

## Historical source: `README_07O.md`

# v0.7O — Continuous Swarmer reinforcement (opt-in)

## Locked behavior implemented
- `swarmerReinforcement: true` enables post-combat replacement; default remains off for older regression experiments.
- Only Host `swarmer` companies actively engaged in melee can receive replacement cohesion. Active combatants cannot donate to each other, and all combat CP/attrition is calculated from a pre-replacement snapshot.
- Donors must be uncommitted Swarmers on a **contiguous occupied rearward Host approach chain** in `host-topology.json`. Each intervening node must have at least one eligible donor. No teleporting replacement strength across gaps.
- Deplete donors farthest from the frontline first; when donors share multiple recipients, allocate their available strength proportionally to outstanding losses, without double spending.
- No extra frontage, extra combat CP, or created cohesion. Combat attrition and reserve replacement are separate event records (`swarmer-replacement`).
- Donors currently committed to combat, exterior ranged engagements, actions, or pending travel cannot donate.

## Test and diagnostic
- `npm test` — 96 passing tests, including six new reinforcement checks.
- `node experiments/swarmer-reinforcement-balance-07o.mjs` — static 12-phase diagnostic for 45/60/80/100 CP, reinforcement off/on.
- Canonical Swarmer CP stays 45. 60/80/100 are **test candidates only**.

## Deliberate limitations
- This is a static contact balance fixture, NOT a full siege, dynamic dispatcher, capture, flying Harpy, or Dawnstone forecast. It holds the 3 active Swarmer frontage fixed and does not rotate or replace entire companies.
- The diagnostic's active Swarmer companies are already standing at the outer position, so **the 30% climbing CP modifier is not applied**. Do not interpret its raw CP numbers as a climbing assault.
- Host route edges are treated directionally toward the frontline for reinforcement, even where movement itself is bidirectional. An uninterrupted occupied chain is required; no special path for interior penetration has been added beyond the topology.
- The diagnostic's defenders stay in place and no new defensive company rotates forward; once the defender reaches zero, opposed combat stops. Therefore later hostCP=0 may indicate no opposing defender, not exhausted Host.
- Replenishment models loss of bodies/cohesion, not actual movement capacity. For now, uncommitted donor companies are eligible only from their current location, with no extra automatic movement.
- Future: integration with full dispatcher, line-of-sight and local network routing, contested corridors, multi-front fights and ground/flight-state rules.

---

## Historical source: `README_07Q.md`

# v0.7Q — Inner Archer blind volley and ranged-exposed Swarmer donors

- Optional `blindVolley: true` and `archerFireAssignments: { [archerId]: 'blind-volley' }` select inner Archer exterior volley at 50% CP, provided `innerSupportClearLanes[sectorId] === true` and the Archer is not in direct melee.
- Each Archer has one assignment per phase: blind volley replaces, rather than stacks with, 80% inner-wall support. Existing default behavior remains unchanged.
- Shroud suppression halves blind volley CP as it does other ranged fire.
- Swarmer reserve donors remain eligible to supply post-combat replacements after independent exterior ranged casualties. Ranged losses resolve first; replacements draw from survivors. Direct melee participants still cannot donate.
- Tests include assignment exclusivity, default 80% support, clear-lane gating, and conservation of losses under simultaneous volley and reinforcement.

This version does not yet implement flight-state transitions or full route-driven approach-to-capture balance experiments. Climbing for 12 phases is not a valid full siege test. No CP tier is promoted to canonical based on these changes.

---

## Historical source: `README_07R.md`

# v0.7R — Route-driven East Wall approach-to-breakthrough experiment

Run: `node experiments/approach-breakthrough-07r.mjs` and `npm test`.

32 deterministic 16-phase runs: Swarmer base CP 45/60/80/100 × reinforcement off/on × Coalition swap off/on × third outer wall position defended/open. Initial attackers start at HN. Legal orders use the existing East Wall dispatcher and are screened sequentially against the authoritative movement resolver; rejected conflicting orders are logged, not silently executed. 18 Swarmer companies participate. No Harpy, dragon, PCs, Dawnstone, sector-breakout gate, or full fortress progression is modeled here.

Coalition setup: Men-at-Arms at EWOP_1, Spearmen at EWOP_2, one optional Archer at EWOP_3, Men-at-Arms reserve at EWIP_1, Archers at EWIP_2/EWIP_3. Swap is attempted at Phase 5 if the original defender and reserve remain eligible. Engagement reach is `frontage`; inner support lanes are clear; inner Archer blind volley is not selected by default. Continuous reinforcement is enabled only in corresponding cases.

Results: `experiments/approach-breakthrough-results-07r.json` and console summary `experiments/approach-breakthrough-summary-07r.txt`.

**Important limitations:** This is a controlled route-driven fixture, not a complete autonomous siege. The dispatcher can propose mutually incompatible local assaults; the screening policy drops invalid orders and logs them under `rejected`, which affects progression and may favor particular configurations. Swap occurs in some, but not all, enabled scenarios. Frontline melee is still resolved as one sector-wide CP comparison, not separate independent position battles. The 16-phase horizon is a test interval, not a real-world time assignment. No CP tier is promoted to canonical from this experiment alone.

---

## Historical source: `README_07S.md`

# v0.7S — Coordinated dispatch and simultaneous-front audit

Run `npm test` and `node experiments/approach-breakthrough-07s.mjs`.

Changes:
- `src/engine/coordinated-host-dispatch.js` validates a batch of Host orders against the authoritative movement resolver and tries legal alternate approach lanes / inner positions where a proposed order conflicts with the batch. No illegal orders are sent to phase resolution. The coordinator is a deterministic East Wall fixture, not a general tactical AI.
- `tests/coordinated-fronts-07s.test.js` verifies two simultaneous outer contacts aggregate only actually contacted Host and Coalition frontline CP; inner melee reserve excluded; eligible Archer inner support included; untouched Host at other positions receives no opposed-melee attrition; coordinator preserves source state, emits valid batches, and can include a Coalition swap.
- `experiments/approach-breakthrough-07s.mjs` repeats the 32 configurations (45/60/80/100 CP × reinforcement × rotation × defended/open flank), 16 phases each, with the coordinated dispatcher.

Observed: 113/113 tests pass. Previous v0.7R run had 31 rejected movement orders; v0.7S has zero rejected orders, with 27 deferred orders across 512 phase executions. The first outer capture, first inner arrival and first inner capture timing results were identical between v0.7R and v0.7S in all 32 configurations. That is evidence the previously rejected orders did not distort these specific milestones, **not** proof the dispatch policy is optimal.

The unified sector-wide opposed CP ratio remains intentional; distinct contacts are not separately rolled. The audit verifies engagement eligibility and non-double-counting, but it does not establish that a single ratio produces ideal casualty distribution across asymmetrical positions. Rear Swarmer replacements and Archer exterior fire are still governed by existing rules. CP 45 remains canonical; the other tiers remain experimental.

Artifacts: `experiments/approach-breakthrough-results-07s.json`, `experiments/approach-breakthrough-summary-07s.txt`, `test-output-07s.txt`.

---

## Historical source: `README_07T.md`

# v0.7T — Persistent orders vertical slice

Adds `src/engine/persistent-orders.js` with `issueStandingOrder`, `cancelStandingOrder`, `setCompanyOverride`, `planPersistentOrders`, `resolveOrderedSiegePhase`.

Implemented: strict Hold Position (no automated movement/retreat at low cohesion), assigned Host Swarmer Assault East Wall using existing deterministic dispatcher, individual overrides (including blocked overrides that remain active), explicit replacement/cancel, and blocked-order event reporting. Orders survive phase resolution. Every proposed action is validated by the authoritative movement resolver; the normal phase resolver performs combat.

**Scope limits:** This is a first vertical slice, NOT the complete shared order system. Coalition Reinforce/Withdraw/Rotate and general Assault/Hold Sector executors are not implemented. Coalition counterattack/reclaim behavior in the underlying resolver is not yet a complete symmetric capture process. Hold Position prevents automated movement by this command layer, but does not add a separate immobility constraint to direct calls of the movement resolver. East Wall assault currently supports assigned Host Swarmers only and uses the existing East Wall test dispatcher, which is not a general pathfinder. Completion detection for sector assault is not yet implemented; its standing order remains active until canceled or all assigned units reach zero cohesion. Individual overrides are explicit low-level legal actions and persist until cleared, so repeating a one-shot movement override may become blocked on subsequent phases.

Run `npm test`. Verified 117/117 tests pass, including four new persistent-order tests.

---

## Historical source: `README_07U.md`

# v0.7U — Shared order precedence + Coalition local batch executors

Headless engine only. Implements latest-command-wins for both faction batch orders and individual overrides. Reassigning any subset of a batch preserves the unaffected assignments; new orders clear prior overrides. Clearing an override does NOT restore the superseded batch. Strict Hold Position remains in place until superseded or cohesion reaches zero.

New Coalition verbs:
- `reinforce` and `withdraw` with `targetId` (position ID): attempt legal **same-sector** local movement, persist when blocked, fulfill when all surviving assigned companies reach target.
- `rotate` with `pairs:[[companyA,companyB],...]`: execute legal atomic local swaps; mark fulfilled when all pairs exchanged their original positions; blocked pairs remain active, including if a later order supersedes one participant.

`assault-east-wall` remains Host Swarmer-only. `hold-position` remains strict. No UI and no autonomous strategic decision-making.

**Important limitations:** Cross-sector Reinforce/Withdraw currently report blocked (`route-not-legal`) rather than guessing a macro route or bypassing travel phases. Rotations are one-shot objective pairs, not recurring automatic cohesion-based rotation. General Coalition counterattack/reclaim and strategic objective pathfinding are not implemented. One-shot low-level individual overrides still persist until cleared. The underlying engine's preexisting combat/capture scope limits remain.

Run `npm test`. Tests cover newest-command-wins, partial batch reassignment, swap legality, local reinforce completion, blocked orders, and superseded rotation pairs.

---

## Historical source: `README_07V.md`

# v0.7V — Architecture hardening (headless)

## Module ownership

- `data/rules/*.json`: canonical tunable numbers and policy declarations. `src/config/rules.js` loads, validates, and normalizes them. A scenario can supply explicit validated overrides for experiments.
- `src/lib/*.js`: pure combat, control, topology and movement predicates; no state mutation. Combat calculators accept `rules` and default to canonical JSON values.
- `src/engine/*.js`: orchestration and state transitions. `siege-engine.js` is the public engine barrel. `persistent-orders.js` handles command precedence, and the movement resolver remains the legal authority.
- `data/scenarios`: physical layout, deployments, routes and coverage; never hardcode a scenario into generic rules.
- `tests`: modern frontage tests plus historical legacy fixtures explicitly opting into legacy discovery. The integrated phase prohibits legacy mode.

## Integrated phase lifecycle (current, not aspirational)

1. Validate required state and config; canonicalize rules and enforce `engagementReach='frontage'`.
2. Resolve declared movement and pending arrivals; apply committed climbing/capture actions.
3. Discover eligible contact and exterior ranged-fire engagements from post-movement positions.
4. Calculate exterior and opposed combat losses from a frozen snapshot, then commit simultaneously.
5. Transfer eligible Swarmer reserve cohesion when `swarmerReinforcement:true` is explicitly configured; donor totals are conserved.
6. Resolve Host capture commitments after attrition and emit position-control events.
7. If called through `resolveOrderedSiegePhase`, emit blocked-order events and update order statuses.

**Not integrated:** complete Threat lifecycle, dawn/victory end-state, all retreat rules, general Host/Coalition macro-route order planning, Harpy flight and dragon specifics. Do not treat a completed phase as a completed siege.

## Hardening changes

- Canonical integrated phases now default to physical frontage eligibility and reject explicit `legacy-sector` configuration.
- Combat CP multipliers, Archer ranged support AR, broken threshold and wall-contact frontage are drawn from canonical JSON instead of scattered JS literals. Added capture and blind-volley multipliers to `combat.json`.
- Ruleset validation rejects missing/negative numeric values and conflicting frontage declarations.
- Historical legacy fixtures explicitly request legacy discovery rather than relying on a dangerous default. Capture fixture now includes a broken defender physically present, so combat remains a real contact.
- Added configuration-mutation and precedence tests. No new UI or AI introduced.

## Still to address

- The `swarmerReinforcement` and `blindVolley` switches remain explicit experiment/scenario opt-ins; choose and lock their canonical defaults before claiming full ruleset consistency.
- Some low-level callers can bypass `resolveOrderedSiegePhase`; callers must use the order-aware entry point when standing orders are in effect. A strict command arbiter at the engine boundary remains a future task.
- `src/lib/modifiers.js` remains a placeholder; not all modifier classes are implemented.
- Several historical docs and per-file implementation-status notes still describe earlier milestones. The new README entry point supersedes them but they remain for traceability.

## Test command

`npm test` (Node 20+). Package releases exclude `.git` and historical test-output logs.

---

## Historical source: `README_07W.md`

# v0.7W — Command arbitration and configuration consistency

Headless architecture-hardening follow-up to v0.7V. No UI or macro-route automation added.

## Engine boundary

`resolveSiegePhase` now rejects a state containing active standing orders or individual overrides. Call `resolveOrderedSiegePhase` to arbitrate orders before running movement/combat. The authorization capability is passed internally from the persistent-order resolver. Command-free smoke tests and states with only inactive orders still use the direct phase resolver.

New orders continue to supersede previous orders per company, including a new Rotate replacing an old Hold Position. No automatic withdrawal is introduced. Legal movement remains exclusively enforced by the movement resolver.

## Configuration policy

`canonicalConfig` now normalizes the optional `swarmerReinforcement` and `blindVolley` switches to `false` unless explicitly enabled, and rejects nonboolean values. These are **experimental opt-ins**, not a declaration that their gameplay rules are discarded or permanently disabled. Existing explicit scenario overrides remain effective. Other numerical rules still come from `data/rules` through `src/config/rules.js`.

## Architecture boundaries

- `data/rules`: numeric rules and policy declarations.
- `src/config`: validation and canonical scenario normalization.
- `src/lib`: pure legality, combat and topology functions.
- `src/engine/persistent-orders.js`: commander intent, precedence, planning and status.
- `src/engine/phase-resolver.js`: authoritative integrated phase boundary.
- `src/engine/movement-resolver.js`: movement legality and state changes.

## Validation

`npm test`: 133/133 passing (five new focused tests). Tests include direct bypass rejection, individual override guard, inactive-order compatibility, switch normalization and newer-command precedence.

## Remaining risks / follow-ups

- Direct lower-level APIs (`resolveMovementPhase`, individual combat resolvers) are intentionally still available for isolated tests and tooling; they must not be presented as command-aware integrated siege entry points.
- Internal authorization is a JavaScript module export, not a security boundary against malicious code. It prevents accidental bypass in ordinary integration.
- The experimental mechanic defaults are explicit but still need a future gameplay decision about canonical scenario enablement.
- Some old documentation and `implementationStatus` notes remain historical. No mass rewriting of archived milestones was attempted.
- Cross-sector persistent order planning and full-siege lifecycle remain future work.

---

## Historical source: `README_07X.md`

# v0.7X — Cross-sector persistent orders (headless)

## Scope
- Adds `src/engine/standing-route-planner.js`, a pure candidate planner over the existing 12-edge macro graph.
- Coalition `reinforce` and `withdraw` standing orders now attempt a shortest-zone legal next step (surface preferred to tunnel on equal distance), using the existing `zone-move` movement resolver. Local destination movement still uses `local-move` or `local-assault` as determined by effective defenders.
- Pending macro arrivals remain in transit until the existing resolver accepts them; persistent commands do not issue additional movement while in transit.
- The authoritative resolver validates every candidate. An unavailable candidate is deferred and the standing order remains active.
- Command precedence remains newest explicit command wins per company.

## Tests
`npm test`: 136/136 passing, including three new cross-sector command tests.

## Known limitations
- The planner only explores shortest zone paths. A longer detour is not yet attempted when all shortest choices are blocked.
- This milestone does not extend `assault-east-wall` to arbitrary Host sector targets.
- This is headless only. No UI or autonomous strategy selection.
- A new hold order issued while already in transit cannot reverse a previously committed departure. On arrival, its original EN_ROUTE anchor is displaced and the executor reports the exception; future design may normalize hold anchors to pending destinations.
- This does not claim complete full-siege automation or balance validation.

---

## Historical source: `README_07Y.md`

# v0.7Y — Deterministic detours and Host macro routing (headless)

## Implemented
- `standing-route-planner.js` enumerates simple macro-zone paths ordered by total hop count and stable tie-breaks. It offers alternate first-hop entrances and longer detours after the integrated movement resolver rejects blocked direct choices.
- Each persistent order tracks zones already departed per company. This prevents route oscillation back into the same origin after a detour. If all remaining routes require revisiting a zone, the order blocks rather than looping; explicit retasking resets route history.
- Multi-company order plans are validated as an accumulating batch, preventing conflicting accepted movements.
- Host Swarmer `assault-east-wall` companies already inside another macro zone use the same route planner to approach East Wall. Nexus/approach/climb/capture still use the existing specialized East Wall dispatcher.
- All proposed movements still pass the authoritative movement resolver; no direct state teleportation or combat bypass.

## Verification
`npm test`: 141/141 passing (five additional tests over v0.7X).

## Limitations
- Route history prevents loops but is not full dynamic replanning: an order that needs to backtrack may block until explicitly reissued.
- A company can still become blocked at its pending arrival. The current movement resolver preserves the pending transit; it does not reverse it or dynamically reroute in mid-transit.
- Host assault is still specifically `assault-east-wall` and restricted to Swarmer companies; generalized Host target objectives and objective completion logic are future work.
- The route planner makes proposals, not tactical decisions, and no UI is included.

---

## Historical source: `README_07Z.md`

# v0.7Z — Persistent order blockage diagnostics

- The persistent-order planner retains the movement resolver's specific rejection category (`destination-at-capacity`, `enemy-denial`, `frontage-full`, `no-local-path`, `contested-position`, or fallback `movement-rejected`) instead of collapsing every failure to `route-not-legal`.
- Active blockages are tracked in `state.commandBlockages`. `standing-order-blocked` is emitted on a new blockage or a change in reason/order, not every phase. `standing-order-unblocked` is emitted when the obstruction disappears (including an order supersession). No blocked instruction is automatically canceled.
- Explicit target positions are preserved; no alternate final destination, allied displacement, or illegal capacity overflow is introduced.
- Tests include capacity rejection, suppression of repeated reports, clearance transitions, and all prior regression tests.
- Note: `zone-arrival-blocked` remains a separate low-level transit event; this patch specifically deduplicates persistent-order planner reports. Reasons are classified from resolver error text and should eventually become structured error codes.

Run: `npm test`.
