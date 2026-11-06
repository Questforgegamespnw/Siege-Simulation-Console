# Coordinated siege rerun — v0.7Z

Executed with Node.js against a copy of `/mnt/data/work_07z` using `node experiments/coordinated-standing-orders-07z.mjs` and `npm test`.

- Regression tests: **144 passed / 0 failed**.
- Scenario: **16 phases / 0 exceptions**.
- Host captures: **EWOP_3 phase 12; EWOP_1 phase 13**.
- Coalition rotation: **one successful atomic swap (phase 4)**.
- Coalition reinforcement: **one macro departure and arrival**, but final EWIP_2 destination remained inaccessible.
- Coalition withdrawal: **not completed**; EWIP_1 inaccessible.
- Blocked attempts: **23** (same count as v0.7Y).
- `standing-order-blocked` events: **4**, down from 23 in v0.7Y.
- Reasons by attempt: **17 `destination-at-capacity`**, **6 `no-local-path`**.
- New blockage notifications: phase 3 reinforcement capacity; phase 8 withdrawal capacity; phase 14 both orders transition to no-local-path. Identical repeat attempts did not generate additional blocked events.

## Interpretation

The diagnostic and event deduplication improvements work. Neither movement objective became legally achievable. The phase-14 change to `no-local-path` is worth inspecting: it follows the Host's phase-12/13 captures and may represent a newly contested local route, but the present output does not establish the exact topology predicate. No combat or routing legality changes were made in this rerun.

## Reproduction

Run `node experiments/coordinated-standing-orders-07z.mjs` from the v0.7Z repository root. The script writes `experiments/coordinated-standing-orders-results-07z.json`.
