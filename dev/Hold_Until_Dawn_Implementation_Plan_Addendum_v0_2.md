# Hold Until Dawn — Siege Engine Implementation Plan Addendum
**Version:** v0.2 · **Date:** 2026-11-04  
**Status:** Implementation planning; confirmed mechanics distinguished from provisional mappings.

## Purpose
Implement a deterministic, headless JavaScript siege simulation with modular scenario data, reusable rules, phase orchestration, tests, and development notes. Preserve physical battlefield causality with minimal GM administration. This addendum supplements the existing occupancy and fire-coverage coding addendum.

## 1. Confirmed core mechanics
- Companies occupy spatial positions; **physical presence**, **ability to deny capture**, and **position controller** are separate concepts.
- East and West Walls each have **3 outer-wall positions and 5 inner-defense positions** (8 total). Gatehouse remains 4 outer / 4 inner pending separate revision.
- Company Cohesion scales effective Combat Power (CP). Participating formations take simultaneous ratio-based attrition reduced by Attrition Resistance (AR).
- At **25% Cohesion or less**, a company is **Broken for positional control**: it retains remaining CP and physical presence but no longer prevents an eligible enemy from claiming the position. It is not automatically killed or withdrawn. Withdrawal requires an order or another explicitly resolved event.
- Position Threat can separately cause a position to become Lost even when its defender has more than 25% Cohesion.
- Normal cross-sector movement and reinforcement travel take **one siege phase**. Repositioning within accessible friendly-controlled battlement positions is free. Claiming or reclaiming enemy-controlled positions is **not** a free reposition; physical advance/contest is required.
- Host follow-on formations need **one additional phase** to move into newly available bridgehead positions. No instantaneous multi-wave flooding on a breakthrough.
- Permanent `ranged` capability tag; melee engagement is derived per engagement. Valid fire-coverage zones determine contribution without assigning individual targets. Outer-wall Archers can shoot approaching/climbing Host; inner-defense Archers cannot until Host reaches outer-wall melee, at which point their support is provisionally **80% ranged CP**. A contributing ranged company not directly melee-engaged has provisional **90% AR** against incidental exchange attrition. Ranged fire does not establish physical control.
- Shroud Ballista ranged suppression (Archer ranged CP 50%) and Archer melee CP (60%) are alternative combat modes, not stacked. Specific interaction with 80% inner-support modifier remains to test.

## 2. Phase-resolution contract
1. **Orders, movement, and reinforcement:** validate routes, process queued arrivals, friendly repositioning, ordered withdrawals, and contested-advance eligibility. Preserve movement commitments and transit state.
2. **Determine engagements:** identify physically engaged formations and ranged contributors using zone coverage and current positions; derive modifiers and effective CP. No unit participates twice in the same exchange.
3. **Resolve simultaneous attrition:** calculate engagement ratios from a frozen engagement snapshot, apply existing ratio table and per-company AR, then commit Cohesion changes together.
4. **Reassess Cohesion and control:** evaluate <=25% Broken threshold, Position Threat, physical access, and position controllers. A company may continue contributing CP while unable to deny enemy occupation.
5. **End phase:** record new bridgeheads, schedule follow-on moves for the next phase, derive Sector Condition and narrative, emit structured event log and updated state.

**Timing invariant:** a breach caused by this phase's attrition cannot retroactively add attacking CP or trigger a second full combat exchange in the same phase. Occupation may be recorded after the control check when an eligible Host force is already physically at the position; additional companies still require the following phase. Exact contested-entry implementation is an Alpha test target.

## 3. Derived six-step Sector Condition for East/West Walls
Sector Condition is computed from **Coalition-controlled positions**, not a separate damage counter. There are 8 positions total.

| Coalition-held positions | Condition | Label | Default narrative |
|---:|---:|---|---|
| 8 | 6 | Secure | All defensive positions remain in Coalition hands. |
| 7 | 5 | Holding | The Host has established its first foothold. |
| 6 | 4 | Strained | The Host is gaining ground across the wall sector. |
| 5 | 3 | Faltering | A major section has fallen; the outer wall may be entirely lost. |
| 3–4 | 2 | Breached | Host occupation threatens the inner defensive line. |
| 1–2 | 1 | Last Stand | Only isolated Coalition positions remain. |
| 0 | 0 | Overrun | No positions in the wall sector remain Coalition-controlled. |

**Mapping status:** the 8→6, 7→5, 6→4, 5→3, 0→0 anchors follow the design discussion. The grouping **3–4→2 and 1–2→1** is a proposed Alpha interpolation, to verify through simulation. The labels reuse the existing 6-to-0 Sector Condition vocabulary.

**Critical distinction:** held-position count controls the numerical condition; actual topology controls the text description. Five held positions do **not** prove the three outer positions are all lost. Describe `outerHeld`, `innerHeld`, Host bridgeheads, and access routes independently. A Broken Coalition company still present in a Host-controlled or uncontrolled position does **not** count as holding it. A vacated position with no eligible occupier must not be silently credited to the Host; use explicit controller state (`coalition`, `host`, `contested`, `none`) and a defined counting rule. For the Alpha mapping, only `coalition` counts as Coalition-held.

**Other sectors:** do not apply the 8-position mapping blindly to Gatehouse, Residential, or Dawnstone. Define sector-specific capacity and condition mappings when their geometry and control semantics are confirmed.

## 4. Suggested repository organization
```text
hold-until-dawn/
├── data/
│   ├── fortress.json
│   ├── coalition.json
│   ├── host.json
│   ├── deployment.json
│   └── rules.json                 # configurable thresholds / ratio bands
├── src/
│   ├── lib/
│   │   ├── movement.js
│   │   ├── coverage.js
│   │   ├── combat.js
│   │   ├── attrition.js
│   │   ├── control.js
│   │   ├── sector-condition.js
│   │   └── modifiers.js
│   ├── engine/
│   │   ├── state.js
│   │   ├── phase-resolver.js
│   │   └── siege-engine.js
│   └── cli/
│       └── simulate.js
├── tests/
│   ├── movement.test.js
│   ├── coverage.test.js
│   ├── combat.test.js
│   ├── control.test.js
│   ├── sector-condition.test.js
│   └── phase.test.js
├── dev/
│   ├── CHANGELOG.md
│   ├── IMPLEMENTATION.md
│   ├── DECISIONS.md
│   └── BALANCE_NOTES.md
├── package.json
├── .gitignore
└── README.md
```

Use native Node.js ES modules and Node's built-in test runner for the initial headless prototype. `data/` contains scenario facts and tunable thresholds; `src/lib/` contains pure rules; `src/engine/` coordinates resolution and owns state changes. `dev/DECISIONS.md` distinguishes confirmed rules from Alpha proposals.

## 5. State and engine interface
- `position`: `id`, `sectorId`, `zone`, `controller`, `occupantUnitIds`, `positionThreat`, `accessLinks`.
- `unit`: `id`, `side`, `baseCP`, `baseAR`, `cohesion`, `tags`, `positionId` or `transit`, and engagement-derived status.
- `sector`: `id`, `positionIds`, `conditionMapping`, computed `coalitionHeld`, `outerHeld`, `innerHeld`, `condition`.
- `orders`: movement, reinforcement, withdrawal, contested advance, and special action intentions.
- `resolveSiegePhase(state, orders) -> { state, events, summary }`; identical inputs produce identical results.
- Maintain structured logs: orders accepted/rejected, moves, engagements, CP ratios, attrition, break events, controller changes, condition changes, and follow-on availability.

## 6. First implementation and acceptance tests
1. Scaffold repository, JSON configuration, pure-function library, deterministic state, CLI.
2. Load a single East Wall test fixture with 3 outer / 5 inner positions.
3. Verify free friendly reposition versus paid/contested enemy reclamation and one-phase reinforcement delay.
4. Verify `ranged` coverage: outer Archers fire on approach/climb, inner Archers cannot; inner support begins at outer-wall melee; direct melee changes CP/AR automatically.
5. Verify simultaneous attrition and Cohesion-scaled CP; exactly 25% Cohesion is Broken, retains CP, does not deny occupation, and does not auto-retreat.
6. Verify first-wave occupation and next-phase follow-on; no same-phase cascade.
7. Verify all Sector Condition boundaries (8,7,6,5,4,3,2,1,0) and topology-specific narrative. A Broken-but-present company must not count as controlling a position.
8. Simulate outer-wall loss and a five-company inner defense versus six physically eligible Host companies, respecting assault frontage and actual reinforcement availability.
9. Add other sectors, special units, Gate Integrity, and GM console only after baseline tests pass.

## 7. Open calibration and design questions
- Confirm proposed 3–4→Condition 2 and 1–2→Condition 1 grouping.
- Define exact control/occupation transition when defenders break but no Host company is yet physically able to enter; decide whether `contested` or `none` is appropriate.
- Resolve the interaction of the 80% inner-support modifier with 50% Shroud suppression.
- Confirm Position Threat recovery and effects of lost positions, including retaking a position while defenders remain physically present.
- Define separate condition mappings for non-wall sectors and their geometry.
- Calibrate siege clock, Gate Integrity, Priests, Siege Beasts, Dragon, and Chevron special actions through tests rather than embedding guessed values into the core engine.

**Design priority:** preserve the abstract physical battle, realistic movement and capture, and ~60–120 seconds of GM administration per phase. Avoid per-company target assignments and extra manual flags when they can be derived from position, tag, and engagement state.
