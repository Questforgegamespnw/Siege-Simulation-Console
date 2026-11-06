# v0.7M: multi-zone breakthrough integration experiment

- Starts with 11 Swarmers at Host Nexus; uses the v0.7K deterministic East Wall dispatcher for approach, climb, contact and capture.
- Swarmer base CP=100 is an EXPERIMENT OVERRIDE ONLY; canonical remains 45.
- Three companies that physically reach the East Wall inner defenses receive legal zone orders toward Dawnstone (surface), Gatehouse (surface), and Deep Barracks (tunnel, via EWMP).
- All zone movement uses `zone-move` and the authoritative movement resolver. No forced placement or fabricated arrivals. Arrivals occur in the next phase.
- Second scenario sends a Coalition company from Deep Barracks to East Wall muster in phase 5, arriving phase 6. Its effective defense prevents the tunnel approach while surface movements remain legal.
- Experiment output: `experiments/multi-zone-results-07m.json`; tests: `tests/multi-zone-breakthrough-07m.test.js`.

## Interpretation and limitations
This is an integration test of routes, not a calibrated full-fortress endurance forecast. It uses deterministic order selection, provisional macro entry anchors, no tactical PC intervention, and no detailed tunnel compartments. It does not prove every possible zone arrival path is valid. The reinforced-muster scenario stops at phase 9 because the existing deterministic East Wall dispatcher can emit conflicting simultaneous local assaults after that point; this policy issue should be addressed before claiming a longer full-fortress run. Deep Barracks defense uses the existing combat system when Host reaches DB, but the test does not calibrate barracks survival.
