# v0.7L — unified macro routes and physical defensive entrances

## Implemented
- `macro-topology.json`: 6 zones, 7 surface links, 5 Deep Barracks tunnel links.
- `zone-move` order works for either faction, one macro edge at a time. Departure enters `EN_ROUTE:<unitId>`; arrival resolves in the following Siege Phase. Units in transit cannot contribute combat CP.
- Surface departure and arrival are anchored to inner compartments (Dawnstone uses its DSP positions); tunnels use muster compartments and DB. An attacker cannot move from an exterior/outer foothold directly onto a macro route.
- Departure checks local reachability to a legal entrance. Effective enemy defenders (>25% cohesion) deny transit through their compartment; enemy-defended destination requires explicit assault contact.
- Arrivals recheck defender presence and capacity; blocked arrivals remain in transit, with `zone-arrival-blocked` event, instead of teleporting past defenders.
- Muster and DB contacts now generate opposed combat using physically present company CP. Existing sector combat remains unchanged.
- GH/RD/DS inner-to-muster local links use existing defined positions; no speculative inner-to-inner edges added.
- Legacy `coalition-route` retained for compatibility, but new tests use unified `zone-move`.

## Explicit limitations / follow-up
- The zone graph is canonical at macro level; actual surface zone exit and arrival compartment mapping is provisional. Currently any valid inner destination in the connected zone may be specified. This does NOT claim all subcompartment routes are finalized.
- No tunnel compartment nodes or throughput/congestion model yet; muster and DB capacity are enforced at arrivals.
- The earlier East Wall dispatcher is not yet a whole-fortress Host strategist and does not issue `zone-move` orders. Macro route tests are direct deterministic orders, not a full-night simulation.
- Blocked arrivals wait in transit until the destination becomes available; withdrawal, alternate destination, siege-route interception and transit fighting are deferred.
- No automatic capture of hostile position or victory condition on arrival. `zone-assault` is represented by `zone-move` with `assault:true`.
- Deep Barracks is included as a combat compartment, but control/capture handling and reinforcement spawning are not expanded in this slice.

## Validation
`npm.cmd test` (Windows) or `npm test` (other platforms). 83 passing tests at packaging.
