# 0.7B first controlled combat tests

`npm test`: **50 passed, 0 failed**. No existing unit CP, AR, climbing, suppression, or melee ratio values changed.

The 6-phase scenarios below use **fixed scripted position snapshots**, not the complete movement/phase engine. Three Coalition Archer companies and one Men-at-Arms company face nine Swarmer companies at the East Wall. Three Host companies reach the wall in phase 3, three more in phase 4, and the last three in phase 6. Cohesion persists between phases. The Archer-in-melee scenario changes which positions the first three Host companies contact so that two Archers are directly engaged. This is a **component-level balancing probe**, not a claim that the current movement rules produce these timings or that these positions are physically capturable.

| Scenario | P2 mean Host Cohesion | P6 mean Host Cohesion | P6 Host melee CP | P6 Coalition melee CP |
|---|---:|---:|---:|---:|
| No suppression | 80.0% | 36.7% | 189.0 | 294.8 |
| Shroud Ballista suppression | 90.0% | 56.7% | 270.0 | 269.3 |
| Two Archers engaged directly in melee | 80.0% | 51.7% | 249.8 | 292.2 |

## Interpretation and limitations

- Suppression materially improves Host Cohesion survival and increases eventual Host melee strength, as intended.
- Archers forced into melee no longer provide exterior fire, leaving additional Host Cohesion intact.
- These scenarios **do not establish that the wall falls**; position threat and capture are not part of 0.7B.
- The current sample starts with only three Archers and one Men-at-Arms at the East Wall, not the full nine-Archer army or complete siege deployment.
- Existing 0.7A cluster-based exterior combat is retained for backwards compatibility but is superseded by `resolveBattlefieldCombat` for exterior fire.
- Host ranged attacks, lane-specific line-of-fire, exact support lanes, automated Ballista coverage, and full turn orchestration are deferred.
- Next: integrate movement and position threat into full phases; run larger multi-sector, full-roster simulations before tuning the provisional ranged table.

Reproduce detailed logs:

```bash
PRINT_SIEGE_SCENARIOS=1 node --test tests/ranged-scenarios-07b.test.js
```
