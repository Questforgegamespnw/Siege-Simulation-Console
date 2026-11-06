import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createInitialState} from '../src/engine/state.js';
import {resolveMovementPhase} from '../src/engine/movement-resolver.js';
import {resolveSiegePhase} from '../src/engine/phase-resolver.js';
import {macroEdges,macroEdge} from '../src/lib/macro-network.js';
const j=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const cfg={fortress:j('../data/scenarios/hold-until-dawn/fortress.json'),routes:j('../data/scenarios/hold-until-dawn/routes.json'),hostTopology:j('../data/scenarios/hold-until-dawn/host-topology.json'),deployment:j('../data/scenarios/hold-until-dawn/deployment.json'),fireCoverage:j('../data/scenarios/hold-until-dawn/fire-coverage.json'),coalitionTypes:j('../data/units/coalition.json'),hostTypes:j('../data/units/host.json'),combatRules:j('../data/rules/combat.json'),rangedRules:j('../data/rules/ranged-fire.json')};
const state=()=>createInitialState(cfg);
const unit=(s,f)=>s.units.find(u=>u.faction===f&&u.typeId!=='brazier-keeper');
const move=(s,u,to,route='surface',assault=false)=>resolveMovementPhase(s,[{kind:'zone-move',unitId:u.id,to,route,assault}],cfg);
test('six-zone topology has seven surface and five tunnel edges',()=>{
 const edges=macroEdges(cfg.routes.macroTopology);
 assert.equal(edges.length,12);
 assert.equal(edges.filter(e=>e.kind==='surface').length,7);
 for(const z of ['west-wall','gatehouse','east-wall','residential','dawnstone'])assert.ok(macroEdge(cfg.routes.macroTopology,z,'deep-barracks','tunnel'));
 assert.ok(macroEdge(cfg.routes.macroTopology,'east-wall','dawnstone','surface'));
});
test('Host interior breakthrough can reach Dawnstone surface entrance without muster',()=>{
 let s=state(),u=unit(s,'host');u.locationId='EWIP_1';
 s=move(s,u,'DSP_1');
 assert.equal(s.units.find(x=>x.id===u.id).locationId,`EN_ROUTE:${u.id}`);
 assert.equal(s.pendingOrders[0].arrivalPhase,s.phase+1);
 s=resolveMovementPhase(s,[],cfg);
 assert.equal(s.units.find(x=>x.id===u.id).locationId,'DSP_1');
 assert.equal(s.positions.find(p=>p.id==='DSP_1').controller,'coalition');
});
test('outer wall cannot depart; nonadjacent surface jump cannot occur',()=>{
 const s=state(),u=unit(s,'host');u.locationId='EWOP_1';
 assert.throws(()=>move(s,u,'DSP_1'),/penetrate interior|departure entrance/);
 u.locationId='EWIP_1';
 assert.throws(()=>move(s,u,'WWIP_1'),/macro connection/);
});
test('Host tunnel route must pass muster defender; surface route remains available',()=>{
 const s=state(),h=unit(s,'host'),c=unit(s,'coalition');h.locationId='EWIP_1';c.locationId='EWMP';c.cohesion=100;
 assert.throws(()=>move(s,h,'DB','tunnel'),/departure entrance/);
 assert.doesNotThrow(()=>move(s,h,'DSP_1','surface'));
 c.cohesion=25;
 assert.doesNotThrow(()=>move(s,h,'DB','tunnel',true));
});
test('Coalition Deep Barracks deployment uses same tunnel order; Host may attack DB',()=>{
 let s=state(),c=unit(s,'coalition');c.locationId='DB';
 s=move(s,c,'EWMP','tunnel');
 assert.equal(s.units.find(x=>x.id===c.id).locationId,`EN_ROUTE:${c.id}`);
 s=resolveMovementPhase(s,[],cfg);
 assert.equal(s.units.find(x=>x.id===c.id).locationId,'EWMP');
 let t=state(),h=unit(t,'host');h.locationId='EWMP';
 const defenders=t.units.filter(u=>u.locationId==='DB'&&u.faction==='coalition');
 assert.ok(defenders.length>0);
 assert.throws(()=>move(t,h,'DB','tunnel'),/assault required/);
 t=move(t,h,'DB','tunnel',true);
 t=resolveMovementPhase(t,[],cfg);
 assert.equal(t.units.find(x=>x.id===h.id).locationId,'DB');
 const combat=resolveSiegePhase(t,[],cfg);
 assert.ok(combat.melee.some(e=>e.clusterId==='DB-defense'&&e.coalitionCP>0&&e.hostCP>0));
});
test('blocked arrival remains in transit rather than bypassing a newly posted defender',()=>{
 let s=state(),h=unit(s,'host'),c=unit(s,'coalition');h.locationId='EWIP_1';c.locationId='DB';
 s=move(s,h,'DSP_1');
 s.units.find(x=>x.id===c.id).locationId='DSP_1';
 s=resolveMovementPhase(s,[],cfg);
 assert.equal(s.units.find(x=>x.id===h.id).locationId,`EN_ROUTE:${h.id}`);
 assert.ok(s.events.some(e=>e.kind==='zone-arrival-blocked'));
});
