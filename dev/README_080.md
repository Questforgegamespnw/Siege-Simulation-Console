# v0.8.0 — Broken-line penetration and contested rally (headless alpha)

## Implemented
- `src/lib/position-state.js`: shared derived owner, living occupants, mixed-faction contestation, and effective denial at >25% cohesion. Ownership is not inferred from occupancy.
- Local routing now permits traversal through broken and physically contested positions when no effective enemy defender denies entry. An uncaptured broken outer foothold may be penetrated, but it does not become Host-owned or a secured reinforcement corridor.
- New engagements may occur at downstream positions after legal movement. Existing frontage checks remain.
- Narrow Coalition rally exception: a single fresh company may enter an otherwise full Coalition-owned node occupied by a broken Coalition company and Host contact. If the Host still effectively defends the destination, the new movement must be an explicit `local-assault`. No occupants are removed or teleported; additional reinforcements cannot stack indefinitely.
- Local pathfinding and position occupancy use occupancy-derived contestation, not stale `position.contested` flags.
- Five new regression tests; two older tests updated to reflect newly approved penetration semantics.

## Explicit limitations / follow-up
- This is a focused local-position alpha, **not** a complete unification of every legacy controller and `contested` check across the engine. In particular, `src/lib/movement.js`, macro arrivals, and older Host topology routes still consult stored contested flags or Host-controlled corridors. They need a follow-up integration pass before claiming full multi-zone consistency.
- The rally exception is intentionally limited to Coalition-owned, mixed-occupancy positions with a broken Coalition occupant. More general counterattack/capture interactions and recurring standing-order planning for rally actions remain future work.
- Local movement is free within a Siege Phase under existing mechanics; this update does not add new movement actions or change capture timing.
- The tests validate rule predicates and local movement; a long-running coordinated siege rerun remains necessary.

Run: `npm test`.
