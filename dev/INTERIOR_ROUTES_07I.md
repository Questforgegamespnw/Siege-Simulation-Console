# v0.7I — Provisional East Wall interior traversal

## What changed
- Added explicit, provisional one-to-one route chains `EWOP_1..3 -> EW_PASS_1..3 -> EWIP_1..3`. They are not finalized map geography; inner positions 4/5, other sectors, and Dawnstone access remain unresolved.
- `host-step` may leave a Host-controlled uncontested outer position for its matching interior passage, one edge per Siege Phase. The corridor must remain connected to Host Nexus; the passage has a three-company occupancy limit.
- Added `host-assault-inner` to physically enter a Coalition-controlled inner defensive position from its matching passage, without changing control. The three-company inner-contact limit applies. Existing `host-capture` now also accepts vulnerable inner positions and retains its 50% CP commitment; capture ownership changes after combat, not upon entry.
- Optional deterministic East Wall dispatcher advances units from captured walls through passages into inner contact before dispatching further climbers. It accounts for planned departures so a vacated wall slot can be reused in the same movement phase (subject to ordered validation).
- Four new regression tests cover adjacency, no free entry, corridor denial, passage capacity, inner frontage, and freed wall frontage. Existing node-count assertion updated for three new test nodes.

## 12-phase controlled test (100 CP Swarmer override; unchanged 40% attrition band)
| Observation | Fully defended third wall position | Open third wall position |
|---|---|---|
| First capture of EWOP_3 | P8 | P4 |
| First Host company in interior passage | P9 | P5 |
| First Host company at inner defensive position | P10 | P6 |
| Host at inner positions by P9 | 0 | 3 |
| Host at inner positions by P12 | 6 | 6 |
| Coalition companies broken by P9 | 2 | 2 |
| Coalition companies broken by P12 | 3 | 4 |

**Interpretation:** The open flank now creates earlier legal interior penetration without scripted arrivals. The defenders remain able to fight at the inner positions; no Dawnstone breach or victory is simulated. The dispatcher and geography are deliberately provisional, so these results are movement-validation data, not final balance.

## Known limitations
- Provisional 1:1 East Wall adjacency is for test validation, not final map placement.
- The fixture dispatches 11 Swarmers with a fixed three-per-phase nexus release; no general Host AI or tactical engagement scheduling.
- The `EW_PASS_*` transit nodes do not contribute to opposed sector combat while units are moving through them; units on inner positions do. This staging abstraction needs scrutiny once inner-route combat and interception are designed.
- Host-controlled inner positions are currently end-of-route in this fixture. No cross-sector route, retreat logic, Dawnstone approach, or additional Host types implemented.
- The legacy `host-claim` order remains for compatibility; new test uses `host-capture`.

Run: `npm test` and `node experiments/east-wall-interior-07i.mjs`.
