import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createInitialState } from '../src/engine/state.js';
const load = (name) => JSON.parse(readFileSync(new URL(`../data/scenarios/hold-until-dawn/${name}.json`, import.meta.url), 'utf8'));
const fortress = load('fortress');
const routing = load('routes');
const deployment = load('deployment');
test('fortress has 34 defensive positions, ten muster spaces and 50 barracks spaces', () => {
  assert.equal(fortress.positions.filter(p=>p.countsForSectorCondition).length, 34);
  assert.equal(fortress.positions.filter(p=>p.zone==='muster').reduce((s,p)=>s+p.capacity,0),10);
  assert.equal(fortress.positions.find(p=>p.id==='DB').capacity,50);
});
test('all identifiers and route endpoints are valid', () => {
  const ids = fortress.positions.map(p=>p.id);
  assert.equal(new Set(ids).size, ids.length);
  for (const route of routing.routes) {
    assert.ok(ids.includes(route.fromPositionId));
    assert.ok(ids.includes(route.toPositionId));
    assert.equal(route.travelPhases,1);
  }
  for (const local of routing.localAccess) {
    assert.ok(ids.includes(local.fromPositionId));
    for (const id of local.toPositionIds) assert.ok(ids.includes(id));
  }
});
test('runtime control comes from deployment, not fortress geometry', () => {
  assert.ok(fortress.positions.every(p=>!Object.hasOwn(p,'controller')));
  const state=createInitialState({fortress,deployment});
  assert.equal(state.positions.filter(p=>p.countsForSectorCondition&&p.controller==='coalition').length,34);
  assert.equal(state.routes.length,5);
  assert.ok(state.routes.every(r=>r.compromised===false));
});
