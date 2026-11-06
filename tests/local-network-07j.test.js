import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createInitialState} from '../src/engine/state.js';
import {resolveMovementPhase} from '../src/engine/movement-resolver.js';
import {localNetwork,localPath,positionOccupancy} from '../src/lib/local-network.js';
const j=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const cfg={fortress:j('../data/scenarios/hold-until-dawn/fortress.json'),routes:j('../data/scenarios/hold-until-dawn/routes.json'),hostTopology:j('../data/scenarios/hold-until-dawn/host-topology.json'),deployment:j('../data/scenarios/hold-until-dawn/deployment.json')};
const setup=()=>createInitialState(cfg);
const host=s=>s.units.find(u=>u.faction==='host'&&u.typeId==='swarmer');
const place=(s,id,controller='host')=>{s.positions.find(p=>p.id===id).controller=controller;};
test('east and west each have nine outer-inner links and three inner-muster links',()=>{
 const g=localNetwork(cfg.fortress);
 for(const pre of ['EW','WW']){
  for(let o=1;o<=3;o++)for(let i=1;i<=3;i++)assert.ok(g.get(`${pre}OP_${o}`).has(`${pre}IP_${i}`));
  for(let i=1;i<=3;i++)assert.ok(g.get(`${pre}IP_${i}`).has(`${pre}MP`));
  assert.equal(cfg.fortress.positions.find(p=>p.id===`${pre}MP`).capacity,2);
 }
});
test('host uses any outer to any inner without extra phase; control not auto-flipped',()=>{
 const s=setup(),u=host(s);u.locationId='EWOP_3';place(s,'EWOP_3');
 const result=resolveMovementPhase(s,[{kind:'local-move',unitId:u.id,to:'EWIP_1'}],cfg);
 assert.equal(result.units.find(x=>x.id===u.id).locationId,'EWIP_1');
 assert.equal(result.positions.find(p=>p.id==='EWIP_1').controller,'coalition');
 assert.deepEqual(result.events.at(-1).path,['EWOP_3','EWIP_1']);
});
test('effective defenders deny passage but broken defenders do not',()=>{
 const s=setup(),u=host(s);u.locationId='EWOP_3';place(s,'EWOP_3');
 const defender=s.units.find(x=>x.faction==='coalition'&&x.typeId!=='brazier-keeper');defender.locationId='EWIP_1';defender.cohesion=100;
 const defenders=[defender];
 // Deny an otherwise direct inner destination, and test alternate inner route to muster.
 assert.throws(()=>localPath(s,cfg.fortress,u,'EWIP_1'),/unblocked/);
 assert.ok(localPath(s,cfg.fortress,u,'EWMP').includes('EWIP_2'));
 for(const d of defenders)d.cohesion=25;
 assert.equal(positionOccupancy(s,'EWIP_1').occupied,true);
 assert.deepEqual(positionOccupancy(s,'EWIP_1').defendedBy,[]);
 assert.deepEqual(localPath(s,cfg.fortress,u,'EWIP_1'),['EWOP_3','EWIP_1']);
});
test('broken uncaptured foothold permits penetration; no cross-sector shortcut',()=>{
 const s=setup(),u=host(s);u.locationId='EWOP_2';
 assert.deepEqual(localPath(s,cfg.fortress,u,'EWIP_3'),['EWOP_2','EWIP_3']);
 place(s,'EWOP_2');
 assert.throws(()=>localPath(s,cfg.fortress,u,'WWIP_3'),/same sector/);
});
test('assault permits defended destination but does not capture; cannot bypass defenders on intermediate nodes',()=>{
 const s=setup(),u=host(s);u.locationId='EWOP_2';place(s,'EWOP_2');
 const defender=s.units.find(x=>x.faction==='coalition'&&x.typeId!=='brazier-keeper');defender.locationId='EWIP_1';defender.cohesion=100;
 const result=resolveMovementPhase(s,[{kind:'local-assault',unitId:u.id,to:'EWIP_1'}],cfg);
 assert.equal(result.units.find(x=>x.id===u.id).locationId,'EWIP_1');
 assert.equal(result.positions.find(p=>p.id==='EWIP_1').controller,'coalition');
 const defenders=s.units.filter(x=>x.faction==='coalition'&&x.typeId!=='brazier-keeper').slice(0,3);
 for(let i=0;i<3;i++){defenders[i].locationId=`EWIP_${i+1}`;defenders[i].cohesion=100;}
 assert.throws(()=>localPath(s,cfg.fortress,u,'EWMP'),/unblocked/);
});
test('muster capacity limits local Host entry',()=>{
 const s=setup(),units=s.units.filter(x=>x.faction==='host'&&x.typeId==='swarmer');
 place(s,'EWOP_1');units[0].locationId='EWOP_1';units[1].locationId='EWMP';units[2].locationId='EWMP';
 assert.throws(()=>resolveMovementPhase(s,[{kind:'local-move',unitId:units[0].id,to:'EWMP'}],cfg),/capacity/);
});
