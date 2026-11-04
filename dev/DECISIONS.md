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
