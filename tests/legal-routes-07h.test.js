import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createInitialState} from '../src/engine/state.js';
import {resolveSiegePhase} from '../src/engine/phase-resolver.js';
import {dispatchEastWallHostOrders} from '../src/engine/host-route-dispatch.js';
const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const config={fortress:json('../data/scenarios/hold-until-dawn/fortress.json'),routes:json('../data/scenarios/hold-until-dawn/routes.json'),hostTopology:json('../data/scenarios/hold-until-dawn/host-topology.json'),deployment:json('../data/scenarios/hold-until-dawn/deployment.json'),fireCoverage:json('../data/scenarios/hold-until-dawn/fire-coverage.json'),coalitionTypes:json('../data/units/coalition.json'),hostTypes:json('../data/units/host.json'),combatRules:json('../data/rules/combat.json'),rangedRules:json('../data/rules/ranged-fire.json'),innerSupportClearLanes:{'east-wall':true}};
function setup(open=true){let state=createInitialState(config);const pick=(type,n)=>state.units.filter(u=>u.faction==='coalition'&&u.typeId===type).slice(0,n);pick('men-at-arms',1)[0].locationId='EWOP_1';pick('spearman',1)[0].locationId='EWOP_2';const arch=pick('archer',3);arch[0].locationId=open?'EWIP_3':'EWOP_3';arch[1].locationId='EWIP_1';arch[2].locationId='EWIP_2';return state;}
test('Host orders traverse one legal edge per phase; capture only after physical arrival',()=>{
 let s=setup();const ids=s.units.filter(u=>u.faction==='host'&&u.typeId==='swarmer').slice(0,11).map(u=>u.id);
 for(let phase=1;phase<=9;phase++){
  const previous=new Map(s.units.map(u=>[u.id,u.locationId]));
  const orders=dispatchEastWallHostOrders(s);assert.ok(orders.filter(o=>previous.get(o.unitId)==='HN').length<=3);
  s=resolveSiegePhase(s,orders,config).state;
  for(const u of s.units.filter(u=>ids.includes(u.id))){
   if(previous.get(u.id)===u.locationId)continue;
   assert.ok(config.hostTopology.edges.some(e=>e.from===previous.get(u.id)&&e.to===u.locationId),`${u.id} skipped a route edge`);
  }
  for(let n=1;n<=3;n++)assert.ok(s.units.filter(u=>ids.includes(u.id)&&u.locationId===`EWOP_${n}`).length<=3);
  if(phase<4)assert.equal(s.positions.find(p=>p.id==='EWOP_3').controller,'coalition');
 }
 assert.equal(s.positions.find(p=>p.id==='EWOP_3').controller,'host');
 assert.ok(s.events.some(e=>e.kind==='capture-committed'&&e.positionId==='EWOP_3'));
});
test('Host cannot bypass climbing or place fourth company on Host-controlled battlement',()=>{
 const s=setup();const swarm=s.units.filter(u=>u.faction==='host'&&u.typeId==='swarmer');
 s.positions.find(p=>p.id==='EWOP_3').controller='host';
 for(let i=0;i<3;i++)swarm[i].locationId='EWOP_3';
 swarm[3].locationId='EWOP_3_CLM';
 assert.throws(()=>resolveSiegePhase(s,[{kind:'host-step',unitId:swarm[3].id,to:'EWOP_3'}],config),/frontage/);
 swarm[3].locationId='HN';
 assert.throws(()=>resolveSiegePhase(s,[{kind:'host-step',unitId:swarm[3].id,to:'EWOP_3'}],config),/physical Host access/);
});
test('Host cannot move through Coalition-controlled wall as an uncontested corridor',()=>{
 const s=setup();const sw=s.units.find(u=>u.faction==='host'&&u.typeId==='swarmer');sw.locationId='EWOP_3_CLM';
 assert.throws(()=>resolveSiegePhase(s,[{kind:'host-step',unitId:sw.id,to:'EWOP_3'}],config),/Enemy position/);
});
