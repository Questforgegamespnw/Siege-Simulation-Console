# Siege Simulation Console

A lightweight HTML-based siege and mass-combat simulator for D&D 5e. **Hold Until Dawn** is the first scenario.

## Current milestone: 0.5A — fortress data foundation

The project is **not yet a working siege simulator**. The CLI reports the starting East Wall condition; the phase resolver deliberately throws until implemented.

```powershell
npm.cmd test
npm.cmd run simulate
```

## Layout

- `data/rules/` — numerical rules and modifiers (some provisional)
- `data/units/` — unit type catalog and special ability definitions
- `data/scenarios/hold-until-dawn/` — fortress geometry, reinforcement routes, initial control, waves, objectives
- `src/lib/` — pure rule calculations (many stubs)
- `src/engine/` — mutable runtime state and phase orchestration
- `src/cli/` — headless demonstration
- `tests/` — automated checks, including fortress topology
- `dev/` — decisions, implementation notes and references

**Data separation:** static fortress positions and routes do not store changing control, occupants, or compromise status. Those are initialized from `deployment.json` and belong to runtime state.

**Known gaps:** unit-instance deployment, Host approach connections, special-unit mechanics, non-wall sector condition thresholds, and route-compromise attrition magnitude are not finalized. No values are invented to fill these gaps.

## Applying this ZIP to an existing repository

Copy the *contents* of this ZIP's top-level `siege-simulation-console-v0.5a` folder into the root of your cloned repository. Remove the obsolete root-level `data/*.json` files if present. Review differences and run tests before committing. Do not copy a `.git` directory; none is included.

MIT licensed. See `LICENSE`.
