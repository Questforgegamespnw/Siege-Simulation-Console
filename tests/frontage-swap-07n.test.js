import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createInitialState} from '../src/engine/state.js';
import {resolveBattlefieldCombat} from '../src/engine/battlefield-combat.js';
import {resolveMovementPhase} from '../src/engine/movement-resolver.js';
const j=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const cfg={fortress:j('../data/scenarios/hold-until-dawn/fortress.json'),routes:j('../data/scenarios/hold-until-dawn/routes.json'),hostTopology:j('../data/scenarios/hold-until-dawn/host-topology.json'),deployment:j('../data/scenarios/hold-until-dawn/deployment.json'),fireCoverage:j('../data/scenarios/hold-until-dawn/fire-coverage.json'),coalitionTypes:j('../data/units/coalition.json'),hostTypes:j('../data/units/host.json'),combatRules:j('../data/rules/combat.json'),rangedRules:j('../data/rules/ranged-fire.json'),innerSupportClearLanes:{'east-wall':true},engagementReach:'frontage'};
const fresh=()=>createInitialState(cfg);
const units=(s,f,t,n)=>s.units.filter(u=>u.faction===f&&u.typeId===t).slice(0,n);
test('frontage: Host at undefended second wall position cannot contribute to first position melee',()=>{
 const s=fresh(), [d]=units(s,'coalition','men-at-arms',1),[h1,h2]=units(s,'host','swarmer',2);
 d.locationId='EWOP_1';h1.locationId='EWOP_1';h2.locationId='EWOP_2';
 const r=resolveBattlefieldCombat(s,cfg);
 assert.deepEqual(r.discovered.melee[0].host,[h1.id]);
 assert.deepEqual(r.discovered.melee[0].coalition,[d.id]);
 assert.equal(r.melee[0].hostCP,45);
 assert.equal(r.state.units.find(u=>u.id===h2.id).cohesion,100);
});
test('frontage: inner melee reserve contributes no CP; inner archer supports at 80%',()=>{
 const s=fresh(),[d,reserve]=units(s,'coalition','men-at-arms',2),[arch]=units(s,'coalition','archer',1),[h]=units(s,'host','swarmer',1);
 d.locationId='EWOP_1';reserve.locationId='EWIP_1';arch.locationId='EWIP_2';h.locationId='EWOP_1';
 const r=resolveBattlefieldCombat(s,cfg);
 assert.equal(r.melee[0].coalitionCP,230);
 assert.equal(r.discovered.melee[0].coalition.includes(reserve.id),false);
 assert.equal(r.discovered.melee[0].modes[arch.id],'inner-support');
});
test('frontage: uncontacted Host at wall does not cause phantom attrition',()=>{
 const s=fresh(),[h]=units(s,'host','swarmer',1);h.locationId='EWOP_2';
 const r=resolveBattlefieldCombat(s,cfg);
 assert.equal(r.melee.length,0);
 assert.equal(r.state.units.find(u=>u.id===h.id).cohesion,100);
});
test('swap exchanges adjacent local companies atomically, preserving cohesion and control',()=>{
 const s=fresh(),[d,reserve]=units(s,'coalition','men-at-arms',2);
 d.locationId='EWOP_1';d.cohesion=45;reserve.locationId='EWIP_1';reserve.cohesion=100;
 const r=resolveMovementPhase(s,[{kind:'local-swap',unitId:d.id,withUnitId:reserve.id}],cfg);
 assert.equal(r.units.find(u=>u.id===d.id).locationId,'EWIP_1');
 assert.equal(r.units.find(u=>u.id===reserve.id).locationId,'EWOP_1');
 assert.equal(r.units.find(u=>u.id===d.id).cohesion,45);
 assert.equal(r.units.find(u=>u.id===reserve.id).cohesion,100);
 assert.equal(r.positions.find(p=>p.id==='EWOP_1').controller,'coalition');
 assert.equal(r.events.at(-1).kind,'local-swap');
});
test('swap cannot bypass defended enemy compartment or double move a company',()=>{
 const s=fresh(),[d,reserve]=units(s,'coalition','men-at-arms',2),[h]=units(s,'host','swarmer',1);
 d.locationId='EWOP_1';reserve.locationId='EWIP_1';h.locationId='EWIP_1';
 assert.throws(()=>resolveMovementPhase(s,[{kind:'local-swap',unitId:d.id,withUnitId:reserve.id}],cfg),/contested/);
 h.locationId='HN';
 assert.throws(()=>resolveMovementPhase(s,[{kind:'local-swap',unitId:d.id,withUnitId:reserve.id},{kind:'local-move',unitId:d.id,to:'EWOP_2'}],cfg),/Duplicate movement/);
});
