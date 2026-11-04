import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createInitialState } from '../src/engine/state.js';
import { resolveMovementPhase } from '../src/engine/movement-resolver.js';
import { reachableHostNodes } from '../src/lib/movement.js';
const read = p => JSON.parse(readFileSync(new URL('../data/scenarios/hold-until-dawn/' + p, import.meta.url)));
const fortress = read('fortress.json'), deployment = read('deployment.json'), routes = read('routes.json'), hostTopology = read('host-topology.json');
const start = () => createInitialState({fortress, deployment, hostTopology});
const run = (s, orders) => resolveMovementPhase(s, orders, {fortress, routes, hostTopology});
test('both armies begin in reserves; empty Coalition walls retain control', () => {
 const s=start(); assert.ok(s.units.every(u=>u.locationId === (u.faction==='host'?'HN':'DB')));
 assert.equal(s.positions.find(p=>p.id==='EWOP_1').controller,'coalition');
});
test('Host advances one physical stage per phase and cannot claim from approach', () => {
 let s=start(); s=run(s,[{kind:'host-step',unitId:'HO_SWM_01',to:'EWOP_1_APP'}]);
 assert.equal(s.positions.find(p=>p.id==='EWOP_1').controller,'coalition');
 assert.throws(()=>run(s,[{kind:'host-claim',unitId:'HO_SWM_01',to:'EWOP_1'}]),/climbing/);
 s=run(s,[{kind:'host-step',unitId:'HO_SWM_01',to:'EWOP_1_CLM'}]);
 s=run(s,[{kind:'host-claim',unitId:'HO_SWM_01',to:'EWOP_1'}]);
 assert.equal(s.positions.find(p=>p.id==='EWOP_1').controller,'host');
});
test('Host cannot claim a defended position without combat', () => {
 const s=start();s.units.find(u=>u.id==='HO_SWM_01').locationId='EWOP_1_CLM';s.units.find(u=>u.id==='CO_ARC_01').locationId='EWOP_1';
 assert.throws(()=>run(s,[{kind:'host-claim',unitId:'HO_SWM_01',to:'EWOP_1'}]),/combat required/);
});
test('Host-controlled contested node cuts corridor and blocks reinforcements', () => {
 const s=start();s.positions.find(p=>p.id==='EWOP_1').controller='host';
 assert.ok(reachableHostNodes(s,hostTopology).has('EWOP_1'));
 s.positions.find(p=>p.id==='EWOP_1').contested=true;
 assert.ok(!reachableHostNodes(s,hostTopology).has('EWOP_1'));
});
test('Coalition route queues one-phase arrival and local deployment', () => {
 let s=start();s=run(s,[{kind:'coalition-route',unitId:'CO_ARC_01',to:'EWMP'}]);
 assert.equal(s.units.find(u=>u.id==='CO_ARC_01').locationId,'DB');
 s=run(s,[]);assert.equal(s.units.find(u=>u.id==='CO_ARC_01').locationId,'EWMP');
 s=run(s,[{kind:'coalition-local',unitId:'CO_ARC_01',to:'EWIP_1'}]);
 assert.equal(s.units.find(u=>u.id==='CO_ARC_01').locationId,'EWIP_1');
});
test('Unknown order rejected without mutating input', () => {
 const s=start();assert.throws(()=>run(s,[{kind:'teleport',unitId:'HO_SWM_01',to:'EWOP_1'}]),/Unsupported/);
 assert.equal(s.phase,0);
});
