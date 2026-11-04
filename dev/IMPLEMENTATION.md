# Implementation roadmap

## Milestone 0 — scaffold (this package)
- [x] Modular repository folders, package metadata, MIT license, .gitignore
- [x] Initial East Wall geometry fixture and provisional rules JSON
- [x] State creation and explicit phase-resolver stub
- [x] Pure East/West sector condition function and 25% break predicate
- [x] Tests for implemented helpers and CLI fixture inspection

## Milestone 1 — playable East Wall headless exchange
- [ ] Validate and process orders, arrivals, and free friendly repositioning
- [ ] Resolve approach/climbing/melee state and firing-lane coverage
- [ ] Calculate effective CP and simultaneous ratio attrition
- [ ] Commit Cohesion losses and evaluate Broken / Position Threat
- [ ] Resolve occupation, recapture and one-phase follow-on movement
- [ ] Emit structured event log and derive condition/narrative
- [ ] Test full 3-outer/5-inner East Wall multi-phase sequence

## Milestone 2 — full Hold Until Dawn scenario
- [ ] Encode complete unit rosters, starting deployment and fortress routes
- [ ] Add Gatehouse, Residential, Dawnstone and Barracks
- [ ] Implement Priest, Brazier, Shroud, Chevron, Wraith, Beast, Dragon effects
- [ ] Add hero actions and automated balancing runs

## Milestone 3 — GM console
- [ ] Build HTML UI on top of the engine without duplicating rules
- [ ] Show positions, units, orders, events, and sector condition narratives
- [ ] Measure GM administrative time per siege phase

## Milestone 0.5A status
Fortress topology and reserve routes are configured and validated. Next: unit instances/deployment and Host access geometry; then movement resolver. Route-compromise attrition magnitude, Gatehouse/Residential/Dawnstone condition mapping and special-unit details remain TBD.
