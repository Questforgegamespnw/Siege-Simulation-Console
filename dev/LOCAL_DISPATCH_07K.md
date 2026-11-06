# v0.7K — Dispatcher integration

The deterministic East Wall test dispatcher accepts `fortress` in its options and uses the shared `localPath` validator to select `local-move` or `local-assault` from captured outer wall positions to any of EWIP_1–3. Host movement no longer stages through EW_PASS_1–3 in this revised experiment. Once an inner position is Host controlled, it may dispatch to the capacity-two EWMP via local movement. Capture remains a separate committed action. Host route approach/climb/outer assault still consume their existing phases.

The legacy v0.7I dispatcher policy remains available **only when no `fortress` option is supplied**, preserving older regression tests; it must not be used to interpret the new simulation. `experiments/east-wall-local-07k.mjs` explicitly supplies fortress. This is a test fixture, not an autonomous Host tactical planner.

At 100 CP Swarmer override and 11 dispatched Swarmers, 12-phase outcomes: defended outer-3 capture P8, first inner P9, 3 inner at P9, 8 at P12, 2 Coalition broken P9; open outer-3 capture P4, first inner P5, 6 inner at P9, 9 at P12, 5 Coalition broken P9. These are fixture-specific results, not calibrated endurance or canonical CP.

Known limitations: fixed deterministic dispatch selection, no scripted Harpy reinforcements, no zone-to-zone Dawnstone continuation, no finalized inner-4/5 links. Local path validation relies on current state and executes sequentially; advanced simultaneous order planning and contested position modeling remain future work. The two-space muster is one node with capacity two.
