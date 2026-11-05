# Changelog

## 0.1.0 — 2026-11-04
- Initial modular repository skeleton for Siege Simulation Console.
- Added East Wall fixture, configuration, two implemented helper functions and baseline tests.
- Phase resolution intentionally left as an explicit not-implemented stub.

## 0.5A — Fortress topology data pass
- Organized scenario, unit and rule data into dedicated subfolders.
- Defined 34 defensive positions, five two-company muster points, and 50-capacity Deep Barracks.
- Defined five one-phase Barracks-to-muster routes with runtime compromised booleans.
- Moved initial control out of immutable fortress definitions.
- Added topology tests; kept phase resolution unimplemented.

## 0.5B — Reserve-based armies and Host exterior topology
- Added finite identified rosters, two reserve locations, approach/climb graph, sector-wide fire coverage and data-contract tests.
- Removed wave-spawning scenario file; movement and combat resolution remain unimplemented.


### 0.6A — Movement-only vertical slice
- Implemented deterministic Host exterior step and empty outer-wall physical claim.
- Implemented Coalition queued reserve routes and local muster deployment.
- Implemented Host corridor reachability with contested cutoffs.
- Full siege phase remains deliberately unimplemented; unresolved mechanics reject rather than silently resolve.

## 0.6B
- Physical capture eligibility for broken units; conventional climb-stage frontage; counterattack contest and reclaim orders; six regression tests.
- Full combat and siege-phase resolver still pending.

### 0.7A — Combat and attrition calculation
- Added pure CP, ratio bands, individual AR, and explicit-cluster combat resolver.
- Sector-wide Archer fire coverage; no double-counting; frozen snapshot and no automatic retreat.
- Added combat regression tests and documented deferred mechanics.

## 0.7B
- Sector-wide outer-wall engagement discovery, unilateral exterior fire, provisional ranged bands, shared frozen-snapshot resolver, regression tests. No existing unit or melee balance values changed.

## 0.7D — Unified sector combat
- Unified physically present Host formations (outer and inner positions) into one opposed sector-wide CP comparison; no per-position attrition bands.
- Contacted inner defenders participate in the sector battle; inner Archers personally contacted by Host switch from 80% support to 60% melee CP.
- Uncontacted inner Archers support only when explicit clear-lane authorization exists and Host reaches outer wall.
- Exterior approach/climb fire remains a separate unilateral engagement; no company contributes to two engagements in one phase.
- Added five mixed-force regression tests. No unit values or existing attrition bands changed.
- Interior Host occupancy is a test-fixture input; Harpy flight and interior access movement are NOT implemented.
