# 0.7D — Unified sector combat and mixed-force tests

## Design contract

- **Sector is the opposed-combat aggregation unit**, not an individual defensive position. All physically participating Host companies at inner or outer defensive positions contribute to one Host CP total for the sector. Outer-wall Coalition defenders and contacted inner Coalition defenders contribute to the same Coalition CP total.
- **Archer mode depends on physical contact.** A personally contacted Archer contributes 60% melee CP; a non-contacted inner Archer with an explicitly clear support lane contributes 80% CP when Host reaches outer wall; an outer Archer may provide exterior fire if not personally engaged.
- **Exterior fire remains unilateral** against Host in approach/climbing nodes. Host exposed target mass is based on base CP × Cohesion and does not apply the climbing melee multiplier. Shroud suppression halves effective exterior ranged CP.
- **One contribution per company per phase.** Exterior and sector engagements are disjoint and use a frozen pre-combat Cohesion snapshot. Supporting ranged companies are not automatically exposed to melee attrition.
- No retreat, breach, capture, Host interior traversal, flight, gatehouse special abilities, or victory rules are introduced here.

## Controlled regression results (full Cohesion, 3 Swarmers)

| Fixture | Coalition CP | Host CP | Ratio | Notes |
|---|---:|---:|---:|---|
| 1 MAA + 1 spear + 2 inner Archers | 420 | 135 | 0.321 | Both inner Archers support at 80% |
| Same, with Harpy contacting first inner Archer | 400 | 150 | 0.375 | First Archer 60% melee, second 80% support; Harpy adds 15 CP |
| First Archer on outer wall, contacted by Swarmer | 400 | 135 | 0.338 | First Archer 60% melee, second 80% support |

**These are deliberately small component fixtures, not siege balance outcomes.** They do not model how Harpies reached the interior or whether the fortress holds. There is no numerical balancing change.

## Next milestone: East Wall pressure test

Run multiple full-roster force arrivals with valid exterior movement and a clearly declared Harpy interior-contact fixture. Record exterior attrition, arrival-to-contact timing, sector CP ratio, Coalition/Host Cohesion and available reserves. Only then evaluate Swarmer CP 45/60/80 as isolated test overrides, without changing canonical unit data. Gatehouse/Siege Beast values remain placeholders until that sector is designed and tested.

## Commands

`npm.cmd test`

PowerShell:

`$env:PRINT_SIEGE_SCENARIOS="1"; node --test tests/unified-sector-07d.test.js`
