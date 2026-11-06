# Siege Simulation Console — Hold Until Dawn

Headless siege simulation and deterministic test harness for the Hold Until Dawn D&D 5e battlefield. The working engine includes local and macro movement, contact-based engagement eligibility, unified sector combat, position control/capture, and persistent standing orders. **No GUI or autonomous strategic AI is included.**

## Run

From the repository root, with Node.js installed:

```powershell
npm test
```

The public engine entry point is `src/engine/siege-engine.js`. For a state with active standing orders, use `resolveOrderedSiegePhase`; the direct integrated phase resolver rejects bypassing command arbitration.

## Documentation
- `dev/` — detailed technical decisions and individual experiments.

## Core engine principles

- One sector-wide opposed CP comparison aggregates **eligible** engaged companies; engagement reach and frontage are determined by actual positions.
- Cohesion at or below 25% removes effective defensive denial without automatically changing ownership.
- Host penetration can create new contacts beyond a broken line without securing a Host reinforcement corridor.
- Qualifying Coalition contested rallies may temporarily exceed ordinary allied capacity; already-advanced Host companies are not displaced.
- Secured Host reinforcement corridors require actual Host control and must not be physically occupied by enemies or subject to a control challenge.
- Orders remain active when blocked; legal movement and phase resolution remain authoritative.

## Project layout

- `data/rules/` — canonical tunable combat, movement, and control rules.
- `data/scenarios/hold-until-dawn/` — fortress, deployment, and topology.
- `src/config/` — rules loading and validation.
- `src/lib/` — rule predicates and calculations.
- `src/engine/` — movement, command orchestration, combat, and phase state changes.
- `tests/` — regression tests.
- `experiments/` — deterministic scenario diagnostics.
- `dev/` — technical design notes.

## Known scope limits

This is a headless alpha. It is not a complete dawn/victory lifecycle, general autonomous commander, finished special-unit implementation, or verified full-siege balance model. Optional experimental mechanics and historical scenario fixtures should not be mistaken for universally enabled defaults. Consult the latest milestone notes for specific caveats.

MIT licensed; see `LICENSE`.
