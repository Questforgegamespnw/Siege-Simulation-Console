import { readFileSync } from 'node:fs';
import { createInitialState } from '../engine/siege-engine.js';
import { getEastWestSectorCondition } from '../lib/sector-condition.js';
const load = (name) => JSON.parse(readFileSync(new URL(`../../data/${name}.json`, import.meta.url), 'utf8'));
const rules = load('rules');
const state = createInitialState({ fortress: load('fortress'), deployment: load('deployment') });
const eastWall = state.positions.filter((p) => p.sectorId === 'east-wall');
console.log('Siege Simulation Console — milestone 0 fixture (no phase resolved)');
console.log(JSON.stringify(getEastWestSectorCondition(eastWall, rules.eastWestSectorConditionByHeld), null, 2));
