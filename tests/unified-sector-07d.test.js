import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createInitialState} from '../src/engine/state.js';
import {resolveBattlefieldCombat} from '../src/engine/battlefield-combat.js';
const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const config={
 fortress:json('../data/scenarios/hold-until-dawn/fortress.json'),
 hostTopology:json('../data/scenarios/hold-until-dawn/host-topology.json'),
 deployment:json('../data/scenarios/hold-until-dawn/deployment.json'),
 fireCoverage:json('../data/scenarios/hold-until-dawn/fire-coverage.json'),
 coalitionTypes:json('../data/units/coalition.json'),
 hostTypes:json('../data/units/host.json'),
 combatRules:json('../data/rules/combat.json'),
 rangedRules:json('../data/rules/ranged-fire.json'),
 innerSupportClearLanes:{'east-wall':true},engagementReach:'legacy-sector'
};
const pick=(s,type,faction,n)=>s.units.filter(u=>u.typeId===type&&u.faction===faction).slice(0,n);
function setup({harpy=false,outerArcher=false,approach=false}={}){
 const s=createInitialState(config);
 const maa=pick(s,'men-at-arms','coalition',1)[0],spear=pick(s,'spearman','coalition',1)[0],arch=pick(s,'archer','coalition',2);
 maa.locationId='EWOP_1';spear.locationId='EWOP_2';
 arch[0].locationId=outerArcher?'EWOP_3':'EWIP_1';arch[1].locationId='EWIP_2';
 const sw=pick(s,'swarmer','host',3);sw.forEach((u,i)=>u.locationId=`EWOP_${i+1}`);
 const h=pick(s,'harpy','host',1)[0];if(harpy)h.locationId='EWIP_1';
 const extra=pick(s,'swarmer','host',4)[3];if(approach)extra.locationId='EWOP_2_APP';
 return {s,maa,spear,arch,sw,h,extra};
}
test('one sector engagement aggregates outer wall melee and inner Archer support',()=>{
 const {s,arch}=setup();const r=resolveBattlefieldCombat(s,config);
 assert.equal(r.melee.length,1);assert.equal(r.melee[0].coalitionCP,420);assert.equal(r.melee[0].hostCP,135);
 assert.equal(r.discovered.melee[0].modes[arch[0].id],'inner-support');
 assert.equal(r.state.units.find(u=>u.id===arch[0].id).cohesion,100,'support avoids incidental melee losses');
});
test('interior Harpy contact changes Archer to melee and adds Host CP in same sector ratio',()=>{
 const {s,arch,h}=setup({harpy:true});const r=resolveBattlefieldCombat(s,config);
 assert.equal(r.melee.length,1,'Harpy does not create a separate mini-battle');
 assert.equal(r.melee[0].hostCP,150,'three Swarmers plus one Harpy');
 assert.equal(r.melee[0].coalitionCP,400,'150 MAA + 110 spear + 60 engaged Archer + 80 supporting Archer');
 assert.equal(r.discovered.melee[0].modes[arch[0].id],'archer-melee');
 assert.equal(r.discovered.melee[0].modes[arch[1].id],'inner-support');
 assert.ok(r.state.units.find(u=>u.id===arch[0].id).cohesion<100);
 assert.equal(r.state.units.find(u=>u.id===arch[1].id).cohesion,100);
 assert.ok(r.melee[0].changes.some(c=>c.unitId===h.id));
});
test('outer Archer engaged in wall melee is not counted as exterior ranged fire',()=>{
 const {s,arch,extra}=setup({outerArcher:true,approach:true});
 const r=resolveBattlefieldCombat(s,config);
 assert.equal(r.exterior.length,0,'outer Archer shares position with Swarmer and is engaged');
 assert.equal(r.melee[0].coalitionCP,400,'150+110+60+80');
 assert.equal(r.state.units.find(u=>u.id===extra.id).cohesion,100);
});
test('approach fire and unified sector melee resolve simultaneously with disjoint units',()=>{
 const {s,arch,extra}=setup({outerArcher:true,approach:true});
 // Move the outer Archer to an unoccupied outer position, leaving contact at positions 1 and 2.
 s.units.filter(u=>u.faction==='host'&&u.locationId==='EWOP_3').forEach(u=>u.locationId='HN');
 const r=resolveBattlefieldCombat(s,config);
 assert.equal(r.exterior.length,1);assert.equal(r.melee.length,1);
 assert.deepEqual(r.exterior[0].archerIds,[arch[0].id]);
 assert.ok(r.state.units.find(u=>u.id===extra.id).cohesion<100);
 assert.equal(r.melee[0].coalitionCP,340,'150+110+80, outer Archer committed to exterior');
});
test('no valid inner support lane means inner Archer contributes only if contacted',()=>{
 const {s,arch}=setup({harpy:true});const r=resolveBattlefieldCombat(s,{...config,innerSupportClearLanes:{}});
 assert.equal(r.melee[0].coalitionCP,320,'150+110+60, second Archer is not eligible');
 assert.equal(r.state.units.find(u=>u.id===arch[1].id).cohesion,100);
});
if(process.env.PRINT_SIEGE_SCENARIOS==='1'){
 for(const [label,opts] of [['Outer wall only',{}],['Harpy contact',{harpy:true}],['Outer Archer in melee',{outerArcher:true}]]){
  const {s}=setup(opts),r=resolveBattlefieldCombat(s,config),e=r.melee[0];
  console.log(`${label}: Coalition=${e.coalitionCP}, Host=${e.hostCP}, ratio=${e.ratio.toFixed(3)}, base losses Coalition=${e.baseCoalitionLoss}% Host=${e.baseHostLoss}%`);
 }
}
