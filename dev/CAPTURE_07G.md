# v0.7G — Host Capture commitment (first integrated slice)

- New `host-capture` order for a Host company **already physically present** in a Coalition-controlled outer position without effective Coalition defenders (cohesion >25%). No capture teleportation.
- The capturing company contributes 50% of its otherwise effective, cohesion-scaled CP to unified sector combat for that phase; it remains subject to normal combat attrition.
- Capture resolves **after** simultaneous combat. It succeeds only if the company survives and no effective defender denies the position. Control changes then; future Host path validation can traverse the Host-controlled position. Only one capturer per position.
- Commitment is exclusive to the phase and does not stack with Climb (30%). A company may not Capture and move in the same phase.
- `host-claim` is retained as a legacy immediate-claim movement order for backwards compatibility. **New scenarios should use `host-capture`**; retiring the legacy order is a follow-up migration.
- Four new tests; 62 total passing.

## Nine-phase controlled fixture

See `experiments/east-wall-capture.mjs` and `capture-results.json`. This fixture scripts Host arrivals and Harpy locations and **is not a fully movement-validated reinforcement scenario**. It uses 100 CP Swarmers in memory and retains the existing 40% high-ratio attrition band. It adds a phase-3 capture commitment on EWOP_3 to the open-flank 3/7/11 schedule.

At P3, Host effective CP changes from 300 to 250; ratio 0.60 to 0.50. Both ratios fall in the same 5% Coalition loss band, so the defender Cohesion trajectories remain identical through P9 in this controlled fixture. EWOP_3 becomes Host-controlled after P3 combat. **This does not mean Capture is inconsequential generally**: a ratio near a band boundary, different deployment, or interrupted claim could alter outcomes.

## Not implemented in v0.7G

Automated reinforcement dispatch/reallocation, interior traversal and capture, special Black Knight anchor-climb routes, capture interruption by tactical encounters, and fully autonomous occupation decision-making. The fixture's scripted company placements should not be interpreted as proof that all 11 Swarmers can legally occupy those positions under frontage constraints.
