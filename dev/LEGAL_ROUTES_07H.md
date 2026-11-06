# v0.7H — Movement-validated East Wall dispatch

## Implemented
- Added `dispatchEastWallHostOrders` as an **optional deterministic test dispatcher**. It issues ordinary `host-step`, `host-assault-contact`, and `host-capture` orders; the authoritative movement resolver validates every step.
- Test policy dispatches at most three fresh Swarmer companies from HN per phase, distributes them among the three East Wall approaches, traverses HN → APP → CLM → outer position over separate phases, and commits Capture after arrival where defenders cannot deny occupation.
- Fixed `host-step` to enforce the existing three-company outer-wall contact limit **even on Host-controlled positions**. Previously the contact limit only applied to `host-assault-contact`.
- Three regression tests validate one-edge movement, delayed capture, and frontage/no-teleport restrictions. `npm test`: 65 passed, zero failed.
- The experiment runs nine phases with 100 CP Swarmers (in-memory test override), unchanged 40% attrition band, and no scripted Host placement during phases.

## Critical result
- By P5, nine conventional Swarmer companies occupy the three wall positions; the remaining two wait at climbing nodes. **The earlier scripted 11-at-wall scenario violated the 3-per-position limit**. The current topology has no modeled onward exit from a Host-controlled wall position to inner positions; hence captured ownership does not yet increase wall-contact capacity or enable the two waiting companies to pass through.
- Open flank: EWOP_3 captured at P4; 1 of 5 Coalition companies broken by P9.
- Fully defended: first EWOP_3 capture at P8; 2 of 5 Coalition companies broken by P9. Other positions may be captured as defenders break.
- These results are **not directly comparable** to prior nine-phase fixtures: they use genuine multi-phase approach/climb/contact timing and omit scripted Harpy arrival. This is a movement-validity test, not a new calibrated endurance result.

## Remaining engineering blocker
- Specify and implement Host **interior transition edges** from captured outer positions, plus legal occupancy/frontage for those interior routes. `host-topology.json` currently labels inner access as candidates rather than executable edges. Do not invent an exit or treat capture as an automatic extra CP/frontage bonus.
- After interior routes exist, test reinforcement flow from HN through captured wall into inner positions and compare open/defended with equivalent Host dispatch and Harpy schedules.
- No new generic Host AI, no Black Knight anchor-climb, no Gatehouse beast mechanics, no Dawnstone victory clock in this slice.
