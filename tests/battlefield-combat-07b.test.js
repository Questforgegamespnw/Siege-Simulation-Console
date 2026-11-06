import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {discoverEngagements} from '../src/engine/engagement-discovery.js';
import {resolveBattlefieldCombat} from '../src/engine/battlefield-combat.js';
import {targetMass,rangedBaseLoss} from '../src/lib/ranged-fire.js';
const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const fortress=json('../data/scenarios/hold-until-dawn/fortress.json');
const fireCoverage=json('../data/scenarios/hold-until-dawn/fire-coverage.json');
const coalitionTypes=json('../data/units/coalition.json');
const hostTypes=json('../data/units/host.json');
const combatRules=json('../data/rules/combat.json');
const rangedRules=json('../data/rules/ranged-fire.json');
const config={fortress,fireCoverage,coalitionTypes,hostTypes,combatRules,rangedRules,engagementReach:'legacy-sector'};
const u=(id,faction,typeId,locationId,cohesion=100)=>({id,faction,typeId,locationId,cohesion});
const state=(...units)=>({phase:6,units,events:[]});
const result=(s,extra={})=>resolveBattlefieldCombat(s,{...config,...extra});
const coh=(r,id)=>r.state.units.find(u=>u.id===id).cohesion;
test('climbing melee modifier never shrinks exposed target mass',()=>{
 const sw=u('s','host','swarmer','EWOP_1_CLM',60);
 assert.equal(targetMass(sw,hostTypes.unitTypes.find(t=>t.id==='swarmer')),27);
});
test('exterior fire cannot retaliate, even when Host greatly outnumbers archers',()=>{
 const s=state(u('a','coalition','archer','EWOP_1'),...Array.from({length:9},(_,i)=>u('s'+i,'host','swarmer',`EWOP_${i%3+1}_APP`)));
 const r=result(s);
 assert.equal(r.melee.length,0);assert.equal(r.exterior.length,1);
 assert.equal(r.exterior[0].rangedCP,100);assert.equal(r.exterior[0].exposedMass,405);
 assert.equal(r.exterior[0].baseHostLoss,2);assert.equal(coh(r,'a'),100);
 assert.equal(coh(r,'s0'),98);assert.equal(s.units[1].cohesion,100);
});
test('suppression halves ranged CP and changes provisional loss band',()=>{
 const s=state(u('a','coalition','archer','EWOP_1'),u('b','coalition','archer','EWOP_2'),...Array.from({length:6},(_,i)=>u('s'+i,'host','swarmer',`EWOP_${i%3+1}_CLM`)));
 const normal=result(s),masked=result(s,{suppressedSectors:['east-wall']});
 assert.equal(normal.exterior[0].rangedCP,200);assert.equal(normal.exterior[0].baseHostLoss,10);
 assert.equal(masked.exterior[0].rangedCP,100);assert.equal(masked.exterior[0].baseHostLoss,5);
 assert.equal(coh(normal,'a'),100);assert.equal(coh(masked,'a'),100);
});
test('sector melee grows only when Swarmers physically reach wall',()=>{
 const c=[u('m','coalition','men-at-arms','EWOP_1'),u('p','coalition','spearman','EWOP_2')];
 const h=Array.from({length:9},(_,i)=>u('h'+i,'host','swarmer',i<3?'EWOP_1':i<6?'EWOP_2_CLM':'EWOP_3_APP'));
 const first=result(state(...c,...h));
 assert.equal(first.melee.length,1);assert.equal(first.melee[0].hostCP,135);
 assert.equal(first.discovered.exterior.length,0); // No archers present to shoot the exposed Host
 const all=result(state(...c,...h.map((u,i)=>({...u,locationId:`EWOP_${Math.floor(i/3)+1}`}))));
 assert.equal(all.melee[0].hostCP,405);assert.equal(all.exterior.length,0);
});
test('inner archer support is explicit, at 80%, and not exposed to melee attrition',()=>{
 const s=state(u('m','coalition','men-at-arms','EWOP_1'),u('a','coalition','archer','EWIP_1'),u('h','host','swarmer','EWOP_1'));
 const no=result(s),yes=result(s,{innerSupportClearLanes:{'east-wall':true}});
 assert.equal(no.melee[0].coalitionCP,150);assert.equal(yes.melee[0].coalitionCP,230);
 assert.equal(coh(yes,'a'),100);
});
test('personally engaged archer fights at 60% and cannot fire exterior',()=>{
 const s=state(u('a','coalition','archer','EWOP_1'),u('h','host','swarmer','EWOP_1'),u('e','host','swarmer','EWOP_2_APP'));
 const r=result(s,{suppressedSectors:['east-wall']});
 assert.equal(r.melee[0].coalitionCP,60);assert.equal(r.exterior.length,0);
 assert.ok(coh(r,'a')<100);assert.equal(coh(r,'e'),100);
});
test('archer fires exterior only once across multiple lanes and sectors stay independent',()=>{
 const s=state(u('a','coalition','archer','EWOP_1'),u('b','coalition','archer','WWOP_1'),u('x','host','swarmer','EWOP_1_APP'),u('y','host','swarmer','EWOP_2_CLM'),u('z','host','swarmer','WWOP_1_APP'));
 const r=result(s);assert.equal(r.exterior.length,2);
 assert.equal(r.exterior.find(e=>e.sectorId==='east-wall').rangedCP,100);
 assert.equal(r.exterior.find(e=>e.sectorId==='east-wall').exposedMass,90);
 assert.equal(r.exterior.find(e=>e.sectorId==='west-wall').exposedMass,45);
});
test('frozen state and no withdrawal, ownership or position threat mutations',()=>{
 const s=state(u('m','coalition','men-at-arms','EWOP_1',26),u('h','host','swarmer','EWOP_1'));
 s.positions=[{id:'EWOP_1',controller:'coalition',positionThreat:0}];
 const r=result(s);assert.equal(s.units[0].cohesion,26);
 assert.equal(coh(r,'m'),17);assert.equal(r.state.units[0].locationId,'EWOP_1');
 assert.deepEqual(r.state.positions,s.positions);
});
test('zero ranged CP, no target, and band thresholds are well-defined',()=>{
 assert.equal(rangedBaseLoss(0,100,rangedRules.bands).hostLoss,0);
 assert.equal(rangedBaseLoss(100,0,rangedRules.bands).hostLoss,0);
 assert.equal(rangedBaseLoss(25,100,rangedRules.bands).hostLoss,5);
 assert.equal(rangedBaseLoss(50,100,rangedRules.bands).hostLoss,10);
 assert.equal(rangedBaseLoss(100,100,rangedRules.bands).hostLoss,15);
 assert.equal(rangedBaseLoss(200,100,rangedRules.bands).hostLoss,20);
});
