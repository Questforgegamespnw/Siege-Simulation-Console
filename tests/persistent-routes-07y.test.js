import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createInitialState} from '../src/engine/state.js';
import {issueStandingOrder,planPersistentOrders,resolveOrderedSiegePhase} from '../src/engine/persistent-orders.js';
import {routeCandidates} from '../src/engine/standing-route-planner.js';
const j=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const cfg={fortress:j('../data/scenarios/hold-until-dawn/fortress.json'),routes:j('../data/scenarios/hold-until-dawn/routes.json'),hostTopology:j('../data/scenarios/hold-until-dawn/host-topology.json'),deployment:j('../data/scenarios/hold-until-dawn/deployment.json'),fireCoverage:j('../data/scenarios/hold-until-dawn/fire-coverage.json'),coalitionTypes:j('../data/units/coalition.json'),hostTypes:j('../data/units/host.json'),combatRules:j('../data/rules/combat.json'),rangedRules:j('../data/rules/ranged-fire.json'),engagementReach:'frontage'};
const setup=(faction='coalition')=>{const s=createInitialState(cfg);const u=s.units.find(x=>x.faction===faction&&x.typeId===(faction==='host'?'swarmer':'men-at-arms'));u.locationId='DB';return {s,u};};
test('planner offers longer simple paths after direct East Wall entrances',()=>{
 const {s,u}=setup();const candidates=routeCandidates(s,u,'EWIP_1',cfg);
 assert.ok(candidates.some(c=>c.to==='EWMP'));
 assert.ok(candidates.some(c=>s.positions.find(p=>p.id===c.to)?.sectorId==='residential'));
 assert.equal(candidates[0].to,'EWMP'); // shortest direct tunnel connection
});
test('Coalition detours when every direct destination in target zone is contested',()=>{
 let {s,u}=setup();
 for(const p of s.positions.filter(p=>p.sectorId==='east-wall'&&(p.zone==='inner'||p.zone==='muster')))p.contested=true;
 s=issueStandingOrder(s,{id:'detour',faction:'coalition',unitIds:[u.id],verb:'reinforce',targetId:'EWIP_1'});
 const plan=planPersistentOrders(s,cfg);
 assert.equal(plan.orders.length,1);
 assert.equal(plan.orders[0].kind,'zone-move');
 assert.notEqual(s.positions.find(p=>p.id===plan.orders[0].to)?.sectorId,'east-wall');
 assert.equal(plan.blocked.length,0);
});
test('multiple Coalition companies reserve different legal route entrances under congestion',()=>{
 let {s,u}=setup();const v=s.units.find(x=>x.faction==='coalition'&&x.typeId==='spearman');v.locationId='DB';
 s=issueStandingOrder(s,{id:'traffic',faction:'coalition',unitIds:[u.id,v.id],verb:'reinforce',targetId:'EWIP_1'});
 const plan=planPersistentOrders(s,cfg);
 assert.equal(plan.orders.length,2);
 assert.notEqual(plan.orders[0].unitId,plan.orders[1].unitId);
 // The authoritative movement resolver validates the complete batch.
 assert.equal(resolveOrderedSiegePhase(s,cfg).state.phase,s.phase+1);
});
test('Host Swarmer already in another sector receives macro route rather than nexus assault step',()=>{
 let {s,u}=setup('host');
 s=issueStandingOrder(s,{id:'host-route',faction:'host',unitIds:[u.id],verb:'assault-east-wall'});
 const plan=planPersistentOrders(s,cfg);
 assert.equal(plan.orders.length,1);
 assert.equal(plan.orders[0].kind,'zone-move');
 assert.equal(s.positions.find(p=>p.id===plan.orders[0].to)?.sectorId,'east-wall');
});
test('detour remembers visited zones and never bounces immediately back to its origin',()=>{
 let {s,u}=setup();
 for(const p of s.positions.filter(p=>p.sectorId==='east-wall'&&(p.zone==='inner'||p.zone==='muster')))p.contested=true;
 s=issueStandingOrder(s,{id:'no-bounce',faction:'coalition',unitIds:[u.id],verb:'reinforce',targetId:'EWIP_1'});
 const first=planPersistentOrders(s,cfg).orders[0];
 assert.ok(first);
 s=resolveOrderedSiegePhase(s,cfg).state;
 assert.ok(s.standingOrders[0].routeVisited[u.id].includes('deep-barracks'));
 s=resolveOrderedSiegePhase(s,cfg).state;
 const next=planPersistentOrders(s,cfg).orders.find(o=>o.unitId===u.id);
 assert.ok(!next||s.positions.find(p=>p.id===next.to)?.sectorId!=='deep-barracks');
});
