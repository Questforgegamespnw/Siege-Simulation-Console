import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolveSiegePhase} from '../src/engine/phase-resolver.js';
import {createInitialState} from '../src/engine/state.js';
const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const config={
 fortress:json('../data/scenarios/hold-until-dawn/fortress.json'),
 routes:json('../data/scenarios/hold-until-dawn/routes.json'),
 hostTopology:json('../data/scenarios/hold-until-dawn/host-topology.json'),
 deployment:json('../data/scenarios/hold-until-dawn/deployment.json'),
 fireCoverage:json('../data/scenarios/hold-until-dawn/fire-coverage.json'),
 coalitionTypes:json('../data/units/coalition.json'),
 hostTypes:json('../data/units/host.json'),
 combatRules:json('../data/rules/combat.json'),
 rangedRules:json('../data/rules/ranged-fire.json')
};
function scenario({suppressed=false}={}){
 let state=createInitialState(config);
 // Explicit test fixture deployment: avoids pretending that reserve deployment
 // or Host travel through nexus has already been implemented as one command.
 const coal=state.units.filter(u=>u.faction==='coalition'&&u.typeId==='archer').slice(0,3);
 const host=state.units.filter(u=>u.faction==='host'&&u.typeId==='swarmer').slice(0,9);
 for(let i=0;i<3;i++)coal[i].locationId=`EWOP_${i+1}`;
 for(const u of host)u.locationId='HN';
 const trace=[];
 const advance=(orders)=>{
  const r=resolveSiegePhase(state,orders,{...config,suppressedSectors:suppressed?['east-wall']:[]});
  state=r.state;
  trace.push({phase:state.phase,exteriorCP:r.exterior[0]?.rangedCP??0,meleeHostCP:r.melee[0]?.hostCP??0,
   hostCohesion:host.map(h=>state.units.find(u=>u.id===h.id).cohesion),
   archerModes:r.discovered.melee[0]?.modes??{},
   wallControl:state.positions.filter(p=>p.id.startsWith('EWOP_')).map(p=>p.controller),
   contactCount:state.units.filter(u=>u.faction==='host'&&u.locationId.startsWith('EWOP_')&&!u.locationId.endsWith('_APP')&&!u.locationId.endsWith('_CLM')).length});
 };
 const step=(indices,suffix,kind='host-step')=>indices.map(i=>({kind,unitId:host[i].id,to:`EWOP_${i%3+1}${suffix}`}));
 advance(step([0,1,2,3,4,5,6,7,8],'_APP'));
 advance(step([0,1,2],'_CLM'));
 advance(step([0,1,2],'','host-assault-contact').concat(step([3,4,5],'_CLM')));
 advance(step([3,4,5],'','host-assault-contact').concat(step([6,7,8],'_CLM')));
 advance([]);
 advance(step([6,7,8],'','host-assault-contact'));
 return {trace,state,coal,host};
}
test('real movement orders create two exterior phases then progressively more wall contact',()=>{
 const {trace}=scenario();
 assert.equal(trace[0].meleeHostCP,0);assert.equal(trace[1].meleeHostCP,0);
 assert.ok(trace[2].meleeHostCP>0);assert.ok(trace[3].meleeHostCP>trace[2].meleeHostCP);
 assert.ok(trace[5].contactCount===9);
 assert.ok(trace[2].exteriorCP<trace[1].exteriorCP);
 assert.ok(trace.every(t=>t.wallControl.every(c=>c==='coalition')),'contact never automatically captures wall');
});
test('ballista suppression improves survival before wall contact without Host retaliation',()=>{
 const plain=scenario(),masked=scenario({suppressed:true});
 assert.ok(masked.trace[1].hostCohesion[0]>plain.trace[1].hostCohesion[0]);
 assert.ok(masked.trace[1].exteriorCP<plain.trace[1].exteriorCP);
 assert.ok(plain.trace[1].hostCohesion[0]<100);
 assert.ok(plain.trace[1].wallControl.every(c=>c==='coalition'));
});
test('wall-contact order cannot teleport or exceed three conventional companies per position',()=>{
 const s=createInitialState(config);
 const h=s.units.find(u=>u.faction==='host'&&u.typeId==='swarmer');
 assert.throws(()=>resolveSiegePhase(s,[{kind:'host-assault-contact',unitId:h.id,to:'EWOP_1'}],config),/matching climb access/);
 const swarm=s.units.filter(u=>u.faction==='host'&&u.typeId==='swarmer').slice(0,4);
 swarm.forEach(u=>u.locationId='EWOP_1_CLM');
 let current=s;
 for(let i=0;i<3;i++)current=resolveSiegePhase(current,[{kind:'host-assault-contact',unitId:swarm[i].id,to:'EWOP_1'}],config).state;
 assert.throws(()=>resolveSiegePhase(current,[{kind:'host-assault-contact',unitId:swarm[3].id,to:'EWOP_1'}],config),/frontage limit/);
});
if(process.env.PRINT_SIEGE_SCENARIOS==='1')for(const [label,opts] of [['normal',{}],['suppressed',{suppressed:true}]]){
 console.log('INTEGRATED '+label);
 for(const t of scenario(opts).trace)console.log(`P${t.phase}: exteriorCP=${t.exteriorCP.toFixed(1)} meleeHostCP=${t.meleeHostCP.toFixed(1)} contact=${t.contactCount} HostCohesion=${(t.hostCohesion.reduce((a,b)=>a+b,0)/9).toFixed(1)}%`);
}
