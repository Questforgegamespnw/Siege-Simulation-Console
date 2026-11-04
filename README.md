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

## Milestone 0.5B additions
All known Coalition and Host unit instances are listed in `data/scenarios/hold-until-dawn/deployment.json`, initially at DB or HN. `host-topology.json` defines exterior physical approach/climb spaces, while `fire-coverage.json` defines sector-wide exterior firing lanes. The `waves.json` file was removed: units never spawn by wave. Unknown-quantity special units remain archetypes only. Inner-wall assault connectivity and Dawnstone access are explicitly unresolved; no runtime phase resolver is claimed.

Run `npm.cmd test` and `npm.cmd run simulate` in PowerShell.


## Milestone 0.6A — Movement-only vertical slice

`resolveMovementPhase(state, orders, { fortress, routes, hostTopology })` now handles
Host stepwise exterior advance, empty outer-wall claims, Coalition DB-to-muster
queued travel, and muster-to-inner deployment. The full `resolveSiegePhase`
**still deliberately throws**: combat, attrition, contested assaults, inner access,
route-compromise losses, and battle timing are not implemented.

Movement orders: `{kind: "host-step"|"host-claim"|"coalition-route"|"coalition-local", unitId, to}`.
A Coalition route order issued in phase N arrives in phase N+1. An arriving
company cannot also receive a new order that same phase in this initial slice.
Host exterior stages are treated as controlled by Host unless marked contested.
No speculative inner-wall edges or siege victory logic are implemented.

## Milestone 0.6B — Physical control slice

- Added `src/lib/engagement.js` for cohesion-based physical-control eligibility and conventional climb-stage frontage.
- Host outer-wall claims respect the 25% broken threshold without removing broken companies.
- Added `coalition-counterattack` (marks a Host-held position contested) and `coalition-reclaim` (requires contested position, physical access and no effective Host defender).
- Host reinforcement corridors cannot traverse contested Host positions.
- **Not yet implemented:** combat, attrition, multi-company simultaneous assault resolution, automatic fallback staging, inner-wall access, full phase orchestration. The same-sector adjacency used for Coalition counterattacks is provisional and intentionally coarse.

## Milestone 0.7A: explicit combat slice

`src/engine/combat-resolver.js` resolves supplied engagement clusters with frozen-snapshot CP and simultaneous Cohesion losses. Exterior Archer coverage is sector-wide and each unit may participate once per phase. No automatic withdrawal, capture, or position movement occurs. This is **not** the full siege-phase resolver. See `dev/COMBAT_07A.md`.
