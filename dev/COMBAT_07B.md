# 0.7B — Engagement discovery and exterior ranged fire

- Existing roster values, melee ratio bands, CP modifiers and Attrition Resistance **unchanged**.
- **New, provisional** ranged loss bands: CP / exposed mass <0.25 → 2%; <0.5 → 5%; <1 → 10%; <2 → 15%; ≥2 → 20% base Cohesion loss.
- Exposed target mass = base CP × remaining Cohesion fraction, **not** climbing melee CP.
- Exterior fire is unilateral; Host approach/climb companies cause no reciprocal attrition.
- Outer wall melee is aggregated by sector, across all outer positions, but only Host physically at an outer position counts as wall melee. Approach/climb are ranged targets, not wall melee.
- Outer archers physically sharing a wall position with Host contribute 60% melee CP; others fire at exterior targets first, or contribute ranged assistance to wall melee if no exterior targets remain. Inner archers support wall melee at 80% CP **only when** `innerSupportClearLanes[sectorId] === true` (explicit provisional line-of-fire permission).
- Shroud Ballista suppression halves eligible Archer ranged and inner-support CP; does not affect Archer melee CP or target mass.
- Supporting archers contribute CP but are immune to automatic *melee* attrition; direct ranged attacks are not yet implemented.
- All results use the same frozen snapshot and apply attrition once per company per phase; no movement, threat, control, or withdrawal is performed.
- The old `resolveCombatPhase` cluster-level `exteriorTargetNodeId` path is a 0.7A legacy API and must **not** be used to resolve 0.7B exterior fire. Use `resolveBattlefieldCombat` instead.
- No automatic suppression inference from Ballista locations; supply `suppressedSectors` explicitly. No invented inner firing-lane geometry. Neither ranged losses nor melee outcomes yet change position ownership.

## Usage
```js
import {resolveBattlefieldCombat} from './src/engine/battlefield-combat.js';
const result = resolveBattlefieldCombat(state, {
  fortress, fireCoverage, coalitionTypes, hostTypes, combatRules, rangedRules,
  suppressedSectors: ['east-wall'],
  innerSupportClearLanes: {'east-wall': true},
});
```
