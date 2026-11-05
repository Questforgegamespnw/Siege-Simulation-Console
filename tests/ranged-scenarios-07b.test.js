import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveBattlefieldCombat} from '../src/engine/battlefield-combat.js';
const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const config={
 fortress:json('../data/scenarios/hold-until-dawn/fortress.json'),
 fireCoverage:json('../data/scenarios/hold-until-dawn/fire-coverage.json'),
 coalitionTypes:json('../data/units/coalition.json'),
 hostTypes:json('../data/units/host.json'),
 combatRules:json('../data/rules/combat.json'),
 rangedRules:json('../data/rules/ranged-fire.json')
};
const u=(id,faction,typeId,locationId)=>({id,faction,typeId,locationId,cohesion:100});
function simulate({suppressed=false,archersInMelee=0}={}){
 let s={phase:1,events:[],units:[
  u('m','coalition','men-at-arms','EWOP_3'),
  ...Array.from({length:3},(_,i)=>u('a'+i,'coalition','archer',`EWOP_${i+1}`)),
  ...Array.from({length:9},(_,i)=>u('h'+i,'host','swarmer',`EWOP_${i%3+1}_APP`))
 ]};
 const timeline=[];
 // Fixed placement schedule: NOT movement simulation, only snapshots for combat balancing.
 for(let phase=1;phase<=6;phase++){
  s.phase=phase;
  if(phase===3) for(let i=0;i<3;i++)s.units.find(u=>u.id==='h'+i).locationId=archersInMelee>0?`EWOP_${i+1}`:'EWOP_3';
  if(phase===4) for(let i=3;i<6;i++)s.units.find(u=>u.id==='h'+i).locationId='EWOP_2';
  if(phase===6) for(let i=6;i<9;i++)s.units.find(u=>u.id==='h'+i).locationId='EWOP_1';
  const r=resolveBattlefieldCombat(s,{...config,suppressedSectors:suppressed?['east-wall']:[]});
  s=r.state;
  const host=s.units.filter(u=>u.faction==='host');
  timeline.push({phase,exteriorCP:r.exterior[0]?.rangedCP??0,exteriorLoss:r.exterior[0]?.baseHostLoss??0,meleeHostCP:r.melee[0]?.hostCP??0,meleeCoalitionCP:r.melee[0]?.coalitionCP??0,meanHostCohesion:host.reduce((a,u)=>a+u.cohesion,0)/host.length,coalition:s.units.filter(u=>u.faction==='coalition').map(u=>({id:u.id,cohesion:u.cohesion}))});
 }
 return timeline;
}
test('fixed-schedule pressure test: suppressed Host preserves more cohesion before wall melee',()=>{
 const normal=simulate(),masked=simulate({suppressed:true});
 assert.ok(masked[1].meanHostCohesion>normal[1].meanHostCohesion);
 assert.ok(normal[2].meleeHostCP>0);
 assert.ok(normal[5].meleeHostCP>normal[2].meleeHostCP);
});
test('forcing archers into melee lowers available exterior fire',()=>{
 const normal=simulate(),engaged=simulate({archersInMelee:2});
 assert.ok(engaged[2].exteriorCP<normal[2].exteriorCP);
});
if(process.env.PRINT_SIEGE_SCENARIOS==='1'){
 for(const [name,options] of [['normal',{}],['suppressed',{suppressed:true}],['archers-in-melee',{archersInMelee:2}]]){
  const rows=simulate(options);
  console.log('SCENARIO '+name);
  for(const r of rows)console.log(`P${r.phase}: exteriorCP=${r.exteriorCP} exteriorLoss=${r.exteriorLoss}% meleeHostCP=${r.meleeHostCP.toFixed(1)} meleeCoalitionCP=${r.meleeCoalitionCP.toFixed(1)} meanHostCohesion=${r.meanHostCohesion.toFixed(1)}%`);
 }
}
