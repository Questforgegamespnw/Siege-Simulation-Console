# Design decisions — source of truth for implementation

## Confirmed
- Project: Siege Simulation Console; initial scenario: Hold Until Dawn.
- East and West walls: three outer positions plus five inner positions.
- Positions have independent controller, occupant list and Position Threat.
- At Cohesion <=25%, a company cannot deny occupation; it still contributes remaining CP and does not automatically retreat.
- Retreat requires an order. Position Threat can separately cause positional loss.
- Friendly same-battlement repositioning is free if access permits; capturing or reclaiming opposing positions is contested.
- Cross-sector reinforcement typically takes one siege phase; Host follow-on movement into newly accessible positions takes another phase.
- `ranged` is a permanent capability; `engagedInMelee` is derived.
- Ranged fire cannot control ground. Inner-wall Archers cannot fire on approaching/climbing enemies outside the wall.
- Resolve orders/movement, engagements, simultaneous attrition, Cohesion/control, then end-of-phase events.
- Sector Condition for East/West Walls is derived from Coalition-controlled positions, not separately decremented.

## Provisional / requires testing
- Inner-to-outer melee support: 80% ranged CP.
- Non-melee ranged-support attrition resistance: 90%.
- 3–4 positions held => Condition 2; 1–2 held => Condition 1.
- Interaction of Shroud suppression and the 80% supporting-fire modifier.
- Exact timing for claiming a newly broken position, positional threat transitions and contested recapture.
- Other sector condition mappings, gate demolition, special units, hero actions, and full deployment.

See `data/rules.json` for current Alpha numbers. Don't treat placeholders as tested balance.

## Confirmed topology (0.5A)
- East/West: 3 outer, 5 inner; Gatehouse: 4 outer, 4 inner; Residential: 2 outer, 3 inner; Dawnstone: 5 single-line defensive positions.
- Every defensive position holds one company; each sector muster holds two; Deep Barracks capacity is 50.
- Routes are Deep Barracks to each muster point; one phase travel; compromised is a boolean and causes AR-mitigated travel attrition (magnitude TBD), not automatic blockade.
- Sector Condition excludes muster and barracks. East/West map 8→6, 7→5, 6→4, 5→3, 3–4→2, 1–2→1, 0→0. Other sectors TBD.
- Physical occupancy, position control, and remaining combat contribution are distinct. At ≤25% Cohesion a company still fights but cannot deny capture; retreat requires an order.
