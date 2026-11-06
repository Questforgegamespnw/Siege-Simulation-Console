import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createInitialState} from '../src/engine/state.js';
import {positionState,securedHostPosition} from '../src/lib/position-state.js';
import {reachableHostNodes} from '../src/lib/movement.js';
import {resolveMovementPhase} from '../src/engine/movement-resolver.js';
const j=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const cfg={fortress:j('../data/scenarios/hold-until-dawn/fortress.json'),routes:j('../data/scenarios/hold-until-dawn/routes.json'),hostTopology:j('../data/scenarios/hold-until-dawn/host-topology.json'),deployment:j('../data/scenarios/hold-until-dawn/deployment.json')};
const start=()=>createInitialState(cfg);
test('physical contact, denial, ownership and control challenge are independent facts',()=>{
 const s=start(),p=s.positions.find(p=>p.id==='EWOP_1');p.controller='host';
 const h=s.units.find(u=>u.faction==='host'&&u.typeId==='swarmer');h.locationId=p.id;
 const c=s.units.find(u=>u.faction==='coalition'&&u.typeId==='men-at-arms');c.locationId=p.id;c.cohesion=25;
 assert.equal(positionState(s,p.id).contested,true);
 assert.equal(positionState(s,p.id).canEnter('host'),true);
 assert.equal(securedHostPosition(s,p.id),false);
 assert.equal(p.controller,'host');
 c.locationId='DB';assert.equal(securedHostPosition(s,p.id),true);
 p.controlChallenge=true;assert.equal(positionState(s,p.id).contested,false);
 assert.equal(securedHostPosition(s,p.id),false);
});
test('stored challenge interrupts Host supply without inventing enemy physical occupancy',()=>{
 const s=start(),p=s.positions.find(p=>p.id==='EWOP_1');p.controller='host';p.controlChallenge=true;
 assert.equal(positionState(s,p.id).contested,false);
 assert.equal(reachableHostNodes(s,cfg.hostTopology).has(p.id),false);
});
test('macro arrival can join broken opposing occupants without treating them as allied capacity',()=>{
 let s=start(),h=s.units.find(u=>u.faction==='host'&&u.typeId==='swarmer');h.locationId='EWIP_1';
 const c=s.units.find(u=>u.faction==='coalition'&&u.typeId==='men-at-arms');c.locationId='DSP_1';c.cohesion=25;
 s=resolveMovementPhase(s,[{kind:'zone-move',unitId:h.id,to:'DSP_1',route:'surface'}],cfg);
 s=resolveMovementPhase(s,[],cfg);
 assert.equal(s.units.find(u=>u.id===h.id).locationId,'DSP_1');
 assert.equal(s.positions.find(p=>p.id==='DSP_1').controller,'coalition');
 assert.equal(positionState(s,'DSP_1').contested,true);
});
