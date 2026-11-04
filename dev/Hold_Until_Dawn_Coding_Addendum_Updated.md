# Hold Until Dawn — Position Occupancy, Fire Coverage & Breach Flow
**Coding addendum v0.1 — 4 November 2026**
**Status:** Alpha design / implementation handoff. Supersedes older fixed-only-slot assumptions where explicitly noted. Do not silently treat provisional values as fully balanced.

## Core intent
Represent a siege as **physical spaces that can change control**, while preserving company-level abstraction. Do not assign individual Swarmer-to-Archer matchups. Ranged participation is not physical control. Code derives eligibility, effective CP, and exposure from persistent capabilities, deployment location, hostile approach state, and engagement status. GM input should remain minimal.

## Working geometry
For **each East and West Wall**:
- `outside_wall`: Host approach / climb staging; attackers progress `approaching -> climbing -> melee` (cresting outer wall).
- `outer_wall`: **3 occupiable positions**, initially held by Coalition companies in the established starting deployment.
- `inner_defense`: **5 occupiable positions proposed** (expansion from prior 3; validate against available companies and fortress geography). A secondary defense line, not automatically in melee when outer wall is attacked.
- `muster`: reinforcement staging, no automatic direct combat contribution.
For **Gatehouse**, retain **4 outer positions**; inner capacity **4 currently**, with **4–5** a possible common defensive standard to evaluate. Do not silently change Gatehouse inner capacity until confirmed. Other sectors retain current working capacities.

## Unit and engagement state
Permanent unit capability: `tags: ["ranged"]` where applicable.
Unit deployment: `sector`, `zone`, `position_id`, `cohesion`, `base_cp`, `base_ar`, plus transit status.
Host force: `approach_state` (`approaching`, `climbing`, `melee`, `repositioning`) and reachable target/assault lane.
Computed per-engagement properties: `can_contribute`, `melee_engaged`, `effective_cp`, `effective_ar`, `can_physically_hold`.
Avoid requiring the GM to toggle ranged suppression, melee CP reduction, or ranged-support AR manually.

## Fire coverage: East/West Wall default
| Target state/location | Outer-wall ranged company | Inner-defense ranged company |
|---|---|---|
| Outside wall, approaching | Eligible at ranged CP (subject to active Shroud) | No shot |
| Outside wall, climbing | Eligible at ranged CP (subject to active Shroud) | No shot |
| Host cresting / melee at outer wall | If directly engaged: Archer 60% melee CP; if not engaged: valid ranged fire | Eligible at **80% ranged CP**, if not personally in melee |
| Host in inner defense | Only with credible firing lane | If directly engaged: Archer 60% melee CP; otherwise valid ranged fire as geometry allows |
| Muster point | Only with credible firing lane | Only with credible firing lane |

Archer baseline: 100 CP at full cohesion, 60% in melee, 50% when ranged and subject to effective Shroud Ballista suppression. **Do not stack melee and ranged Shroud penalties**. The 80% inner-to-outer supporting-fire factor represents friendly-fire caution and difficult shot angles; whether it stacks with Shroud suppression is a calibration/implementation question to resolve explicitly, not assume silently.

## Exposure / attrition
- Ranged-tagged companies **contributing to a cluster without being directly melee-engaged** have provisional **90% effective Attrition Resistance** against incidental engagement attrition, regardless of their ordinary base AR.
- Once directly engaged in melee, use base AR and melee CP rules.
- Nonparticipating units receive no ordinary engagement attrition.
- Direct special attacks or dedicated targeting can form their own engagement; 90% support protection is not blanket invulnerability.
- Ranged support adds CP to a reachable engagement but **does not physically occupy, hold, or retake the threatened position**.

## Physical position occupancy and control
- A defensive position is a **neutral spatial slot** with a current occupant/controller; not a permanently Coalition-owned slot.
- Coalition company at **25% Cohesion or less** is **Broken for holding purposes**: it no longer contests physical control of that position. Survivors remain a recoverable company and can retreat/rally. Threshold proposed for Alpha, to be tested.
- A position may also be **Lost** through the existing Position Threat track (0 Stable, 1 Contested, 2 Compromised, 3 Untenable, 4 Lost), even when the defender has more than 25% Cohesion. Distinguish position control from company Cohesion.
- Losing control does **not teleport Host units into the slot**. An eligible Host force must physically crest/enter to occupy it; movement and access still matter.
- Once Host forces occupy captured outer positions, these positions become **Host bridgeheads**, allowing subsequent assaulting companies to crest and fill newly available frontage, subject to physical movement and capacity rules.
- Avoid assuming an instantaneous unlimited flood: occupancy transfer, the phase of Host entry, and whether the newly arrived force fights immediately are **open timing decisions**.
- The existing cap of **3 conventional Host attacking companies per occupied Coalition defensive position** applies to direct assaults on still-defended positions. SEUs, including the Chevron, do not consume conventional assault slots but require credible access. Captured positions create occupancy/bridgehead space; avoid interpreting the cap as a permanent cap on all Host troops on the wall.
- A company forced from the outer wall can fall back to an available inner slot, respecting capacity and any interception/retreat rules still to be finalized. No automatic annihilation.

## Chevron exception
Unique asset `The Chevron`: five Black Knight SEUs (5 × 50 CP) and provisional commander (100 CP) when physically assembled; **350 CP combined**. Crushing Assault at >=3.0x advantage produces **+3 total Position Threat** rather than ordinary +1, only in the targeted cluster, not across the sector. The Chevron does not consume conventional assault slots. Gatehouse interior access requires gate breached/opened or credible climb/entry; one phase to reposition into courtyard once traversable. Commander/Knights separated cannot automatically project full combined CP.

## Implementation suggestion
Represent each `position` with `{id, zone, capacity:1, occupant_unit_id, controller, threat}` and each `assault_lane` with `{target_position_id, approaching_ids, climbing_ids, engaged_ids}`. Track additional Host bridgehead occupancy after a Coalition position falls. Compute line-of-fire and melee exposure via small coverage tables per sector type, not ad hoc arithmetic or per-unit target lists.

## Pending decisions / tests
1. Confirm East/West inner **5** slots vs **4**, and whether Gatehouse inner remains **4** or expands to **5**.
2. Confirm precise transfer timing from Broken/Lost position to Host occupation and next-wave climb; prevent a breach from granting instant multi-wave attacks in one phase.
3. Define retreat/rally handling for <=25% Cohesion companies and for positions Lost at higher Cohesion.
4. Clarify whether 80% friendly-fire supporting-fire modifier stacks with Ballista Shroud ranged suppression, and how multiple ranged support units distribute among clusters without double counting.
5. Test 90% ranged-support AR, especially whether Host archers and Coalition archers are too durable.
6. Ensure Sector Condition remains independent from unit Cohesion, Position Threat, and physical gate integrity; determine when bridgehead loss alters sector condition.
7. Maintain low-GM-administration console workflow and distinguish committed inputs from advancing siege phases.

## Alpha decisions confirmed — follow-up (2026-11-04)
- **East and West Wall inner defense capacity is now confirmed at 5 positions each**, not merely proposed. Outer Wall remains 3 positions each. Gatehouse remains 4 outer / 4 inner until separately revised.
- **Broken threshold: Cohesion <=25%.** Broken companies retain their remaining cohesion-scaled CP and remain in their current engagement until moved or otherwise displaced, but **no longer block Host physical occupation** of their slot. Broken is not destroyed and does not automatically retreat.
- **Retreat requires an explicit Coalition order** if a Broken company has not otherwise been forced out. Remaining exposed may be dangerous; do not introduce a new damage multiplier without testing.
- **Host follow-on wave movement takes one siege phase** to catch up and fill newly available battlement positions after initial attackers secure a bridgehead. No instantaneous chain-flood of all approaching companies.
- **Five inner slots are intentionally flexible capacity, not five free reinforcements.** Coalition reserves are finite. This permits a credible heavily reinforced inner line and potentially a 6 Host versus 5 Coalition confrontation, provided Host forces have actually reached the inner-defense zone and all companies are legally deployed. Existing three-company-per-defended-position assault frontage still applies where relevant; do not assume 6-v-5 implies arbitrary stacking or automatic full participation.
- Ranged support still contributes CP without physical control; engagement/exposure and 90% support AR rules remain as previously specified.

### Implementation edge case to resolve
If a Broken company physically remains in a slot that Host forces claim, model `controller` independently from `occupant_unit_ids` / `contesting_units` rather than enforcing one exclusive occupant per position. Do not let two opposed companies both count as controlling the same position. Define when the Host's entering force is eligible to contribute CP versus merely occupying it, and what happens if an ordered withdrawal is interdicted.
