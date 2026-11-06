import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createInitialState} from '../src/engine/state.js';
import {resolveMovementPhase} from '../src/engine/movement-resolver.js';
import {localPath,positionOccupancy} from '../src/lib/local-network.js';
import {positionState} from '../src/lib/position-state.js';
const j=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const cfg={fortress:j('../data/scenarios/hold-until-dawn/fortress.json'),routes:j('../data/scenarios/hold-until-dawn/routes.json'),hostTopology:j('../data/scenarios/hold-until-dawn/host-topology.json'),deployment:j('../data/scenarios/hold-until-dawn/deployment.json')};
const setup=()=>{const s=createInitialState(cfg);const host=s.units.find(u=>u.faction==='host'&&u.typeId==='swarmer');const coalition=s.units.filter(u=>u.faction==='coalition'&&u.typeId==='men-at-arms');
 host.locationId='EWOP_1';coalition[0].locationId='EWIP_1';coalition[0].cohesion=25;coalition[1].locationId='EWMP';coalition[1].cohesion=100;
 return {s,host,broken:coalition[0],fresh:coalition[1]};};
test('broken defensive node is traversable without changing ownership or granting Host reinforcement control',()=>{
 const {s,host,broken,fresh}=setup();fresh.locationId='DB';
 assert.equal(positionState(s,'EWIP_1').canEnter('host'),true);
 assert.deepEqual(localPath(s,cfg.fortress,host,'EWMP'),['EWOP_1','EWIP_1','EWMP']);
 assert.equal(s.positions.find(p=>p.id==='EWIP_1').controller,'coalition');
 broken.cohesion=26;
 assert.equal(positionState(s,'EWIP_1').canEnter('host'),false);
 assert.throws(()=>localPath(s,cfg.fortress,host,'EWIP_1'),/unblocked/);
});
test('host penetrates a broken outer foothold and establishes new inner frontage without capture',()=>{
 const {s,host}=setup();s.units.find(u=>u.id===host.id).locationId='EWOP_1';
 const moved=resolveMovementPhase(s,[{kind:'local-move',unitId:host.id,to:'EWIP_1'}],cfg);
 assert.equal(moved.units.find(u=>u.id===host.id).locationId,'EWIP_1');
 assert.equal(moved.positions.find(p=>p.id==='EWIP_1').controller,'coalition');
 assert.equal(positionState(moved,'EWIP_1').contested,true);
});
test('rally reinforcement may double park with broken ally and Host contact, without ejecting Host',()=>{
 const {s,host,broken,fresh}=setup();host.locationId='EWIP_1';
 const moved=resolveMovementPhase(s,[{kind:'local-assault',unitId:fresh.id,to:'EWIP_1'}],cfg);
 assert.equal(moved.units.find(u=>u.id===fresh.id).locationId,'EWIP_1');
 assert.equal(moved.units.find(u=>u.id===host.id).locationId,'EWIP_1');
 assert.equal(moved.units.find(u=>u.id===broken.id).locationId,'EWIP_1');
 assert.equal(positionState(moved,'EWIP_1').canEnter('host'),false);
 assert.equal(moved.positions.find(p=>p.id==='EWIP_1').controller,'coalition');
});
test('rally exception is not unlimited stacking or a way into effectively defended enemy positions',()=>{
 const {s,host,broken,fresh}=setup();host.locationId='EWIP_1';
 broken.cohesion=26;
 assert.throws(()=>resolveMovementPhase(s,[{kind:'local-assault',unitId:fresh.id,to:'EWIP_1'}],cfg),/capacity/);
 broken.cohesion=25;
 const another=s.units.find(u=>u.faction==='coalition'&&u.id!==broken.id&&u.id!==fresh.id&&u.typeId==='spearman');
 another.locationId='EWIP_1';
 assert.throws(()=>resolveMovementPhase(s,[{kind:'local-assault',unitId:fresh.id,to:'EWIP_1'}],cfg),/capacity/);
});
test('derived contestation overrides stale persisted contested flag',()=>{
 const {s,host}=setup();host.locationId='EWIP_1';
 s.positions.find(p=>p.id==='EWIP_1').contested=false;
 assert.equal(positionOccupancy(s,'EWIP_1').contested,true);
 assert.equal(positionState(s,'EWIP_1').owner,'coalition');
});
