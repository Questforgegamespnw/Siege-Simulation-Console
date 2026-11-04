import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createInitialState} from '../src/engine/state.js';
import {resolveMovementPhase} from '../src/engine/movement-resolver.js';
import {reachableHostNodes} from '../src/lib/movement.js';
const read = p => JSON.parse(readFileSync(new URL('../data/scenarios/hold-until-dawn/' + p, import.meta.url)));
const fortress=read('fortress.json'), deployment=read('deployment.json'), routes=read('routes.json'), hostTopology=read('host-topology.json');
const start=()=>createInitialState({fortress,deployment,hostTopology});
const run=(s,orders)=>resolveMovementPhase(s,orders,{fortress,routes,hostTopology});
const pos=(s,id)=>s.positions.find(p=>p.id===id);
test('Host claims empty outer wall after physical climb, not from approach',()=>{
 let s=start(); const u=s.units.find(u=>u.id==='HO_SWM_01');u.locationId='EWOP_1_CLM';
 s=run(s,[{kind:'host-claim',unitId:u.id,to:'EWOP_1'}]);assert.equal(pos(s,'EWOP_1').controller,'host');
});
test('25% broken defenders remain physically present but cannot deny capture',()=>{
 let s=start();s.units.find(u=>u.id==='HO_SWM_01').locationId='EWOP_1_CLM';
 const defender=s.units.find(u=>u.id==='CO_SPR_01');defender.locationId='EWOP_1';defender.cohesion=25;
 s=run(s,[{kind:'host-claim',unitId:'HO_SWM_01',to:'EWOP_1'}]);
 assert.equal(pos(s,'EWOP_1').controller,'host');assert.equal(defender.locationId,'EWOP_1');
});
test('25.01% defenders block claim pending combat',()=>{
 const s=start();s.units.find(u=>u.id==='HO_SWM_01').locationId='EWOP_1_CLM';
 const defender=s.units.find(u=>u.id==='CO_SPR_01');defender.locationId='EWOP_1';defender.cohesion=25.01;
 assert.throws(()=>run(s,[{kind:'host-claim',unitId:'HO_SWM_01',to:'EWOP_1'}]),/combat required/);
});
test('three conventional Host companies can climb one position; fourth is rejected',()=>{
 let s=start();for(let i=1;i<=3;i++)s.units.find(u=>u.id===`HO_SWM_${String(i).padStart(2,'0')}`).locationId='EWOP_1_CLM';
 s.units.find(u=>u.id==='HO_SWM_04').locationId='EWOP_1_APP';
 assert.throws(()=>run(s,[{kind:'host-step',unitId:'HO_SWM_04',to:'EWOP_1_CLM'}]),/frontage/);
});
test('Coalition counterattack contests Host position and cuts Host reinforcement corridor',()=>{
 let s=start();pos(s,'EWOP_1').controller='host';s.units.find(u=>u.id==='CO_MAA_01').locationId='EWIP_1';
 assert.ok(reachableHostNodes(s,hostTopology).has('EWOP_1'));
 s=run(s,[{kind:'coalition-counterattack',unitId:'CO_MAA_01',to:'EWOP_1'}]);
 assert.equal(pos(s,'EWOP_1').controller,'host');assert.equal(pos(s,'EWOP_1').contested,true);
 assert.ok(!reachableHostNodes(s,hostTopology).has('EWOP_1'));
});
test('Coalition reclaim requires no effective Host defenders and a contested position',()=>{
 let s=start();pos(s,'EWOP_1').controller='host';pos(s,'EWOP_1').contested=true;
 s.units.find(u=>u.id==='CO_MAA_01').locationId='EWIP_1';
 const host=s.units.find(u=>u.id==='HO_SWM_01');host.locationId='EWOP_1';
 assert.throws(()=>run(s,[{kind:'coalition-reclaim',unitId:'CO_MAA_01',to:'EWOP_1'}]),/combat required/);
 host.cohesion=25;
 s=run(s,[{kind:'coalition-reclaim',unitId:'CO_MAA_01',to:'EWOP_1'}]);
 assert.equal(pos(s,'EWOP_1').controller,'coalition');assert.equal(pos(s,'EWOP_1').contested,false);
});
