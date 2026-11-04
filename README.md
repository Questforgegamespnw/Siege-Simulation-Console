# Siege Simulation Console

A lightweight HTML-oriented siege and mass-combat simulator for D&D 5e, keeping large-scale battles impactful without hundreds of individual dice rolls.

**Status:** repository skeleton / milestone 0. The combat and movement engine is **not yet implemented**. The first scenario is **Hold Until Dawn**.

## Quick start

Requires Node.js 20+.

```bash
npm test
npm run simulate
```

`simulate` currently prints an initial East Wall fixture and derived Sector Condition; it does **not** resolve a siege phase yet.

## Organization

- `data/`: scenario content and provisional rule configuration
- `src/lib/`: reusable pure rule functions (mostly explicit stubs)
- `src/engine/`: state creation and phase orchestration (phase resolver pending)
- `src/cli/`: headless demonstration
- `tests/`: executable checks for implemented behavior and placeholders for future tests
- `dev/`: decisions, implementation steps, changelog, and balance notes

## Core phase sequence

1. Validate orders, movement and reinforcement arrivals.
2. Determine engagements and ranged coverage.
3. Resolve simultaneous attrition from a frozen engagement snapshot.
4. Reassess Cohesion (25% break threshold), position control and Sector Condition.
5. Emit event log and schedule follow-on movement for the next phase.

See `dev/DECISIONS.md` for confirmed vs provisional rules. The scenario configuration is deliberately minimal; it is not a complete deployment roster.

## License

MIT. Replace the generic copyright holder in `LICENSE` with your preferred name/entity if desired.
