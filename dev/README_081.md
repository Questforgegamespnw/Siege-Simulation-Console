# v0.8.1 — Position authority consolidation (headless)

## Shared rules
- `positionState()` is authoritative for physical mixed-faction occupancy and cohesion-based effective denial. A defender at 25% or below does not deny entry.
- `controlChallenge` is the explicit control-dispute flag. Legacy serialized `position.contested` remains a compatibility alias **only for control challenges**, not for physical occupancy. The state writer maintains both fields for older clients.
- Host secured supply corridors require Host ownership, no physical enemy occupancy, and no outstanding control challenge. Penetrating Coalition-owned positions does not secure reinforcement access.
- Macro arrival may join broken enemy occupants. Its frontage/capacity calculation counts same-faction occupants rather than enemy combatants as allied slots; effective enemy denial still blocks a non-assault arrival.
- Host route fixture uses secured-corridor predicates rather than directly checking `position.contested`.
- Local swaps check actual physical contestation at reserve endpoints.

## Verification
- `npm test`: 152/152 passed (149 existing + 3 authority tests).
- `node experiments/coordinated-standing-orders-081.mjs`: 16 phases, zero exceptions, 23 blocked standing-order attempts, captures at EWOP_3 in phase 12 and EWOP_1 in phase 13.

## Remaining caveats
- Older saved-state `contested` flags are treated as legacy *control challenges*; an explicit migration would be required to reinterpret historic saves with different meanings.
- Coalition contested-rally double parking remains narrowly scoped to broken allied defenders and active enemy presence.
- This is not a proof that every possible Host dispatch and macro-route combination is correct; expand multi-sector contested-arrival scenarios before GUI work.
