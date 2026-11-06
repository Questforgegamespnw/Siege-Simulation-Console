import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createInitialState} from '../src/engine/state.js';
import {issueStandingOrder,setCompanyOverride,planPersistentOrders,resolveOrderedSiegePhase} from '../src/engine/persistent-orders.js';
const j=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const cfg={fortress:j('../data/scenarios/hold-until-dawn/fortress.json'),routes:j('../data/scenarios/hold-until-dawn/routes.json'),hostTopology:j('../data/scenarios/hold-until-dawn/host-topology.json'),deployment:j('../data/scenarios/hold-until-dawn/deployment.json'),fireCoverage:j('../data/scenarios/hold-until-dawn/fire-coverage.json'),coalitionTypes:j('../data/units/coalition.json'),hostTypes:j('../data/units/host.json'),combatRules:j('../data/rules/combat.json'),rangedRules:j('../data/rules/ranged-fire.json'),innerSupportClearLanes:{'east-wall':true},engagementReach:'frontage'};
const setup=()=>{const s=createInitialState(cfg);const a=s.units.find(u=>u.faction==='coalition'&&u.typeId==='men-at-arms');const b=s.units.find(u=>u.faction==='coalition'&&u.typeId==='spearman');a.locationId='EWOP_1';b.locationId='EWIP_1';return {s,a,b};};
test('new rotate supersedes strict hold for both companies, without explicit cancellation',()=>{
 let {s,a,b}=setup();s=issueStandingOrder(s,{id:'hold',faction:'coalition',unitIds:[a.id,b.id],verb:'hold-position'});
 s=issueStandingOrder(s,{id:'rotate',faction:'coalition',unitIds:[a.id,b.id],verb:'rotate',pairs:[[a.id,b.id]]});
 assert.deepEqual(s.standingOrders.map(o=>o.id),['rotate']);
 const p=planPersistentOrders(s,cfg);assert.deepEqual(p.orders.map(o=>o.kind),['local-swap']);
 const r=resolveOrderedSiegePhase(s,cfg);assert.equal(r.state.units.find(u=>u.id===a.id).locationId,'EWIP_1');assert.equal(r.state.units.find(u=>u.id===b.id).locationId,'EWOP_1');assert.equal(r.state.standingOrders[0].status,'fulfilled');
});
test('newest batch replaces an older individual override, while unaffected units retain instructions',()=>{
 let {s,a,b}=setup();s=issueStandingOrder(s,{id:'hold',faction:'coalition',unitIds:[a.id,b.id],verb:'hold-position'});
 s=setCompanyOverride(s,a.id,{kind:'local-move',unitId:a.id,to:'EWIP_2'});
 assert.deepEqual(s.standingOrders[0].unitIds,[b.id]);
 s=issueStandingOrder(s,{id:'withdraw',faction:'coalition',unitIds:[a.id],verb:'withdraw',targetId:'EWIP_2'});
 assert.equal(s.companyOverrides[a.id],undefined);assert.deepEqual(s.standingOrders.find(o=>o.id==='hold').unitIds,[b.id]);
 assert.equal(planPersistentOrders(s,cfg).orders[0].to,'EWIP_2');
});
test('reinforce travels to an open legal local position and completes, without repeat move',()=>{
 let {s,b}=setup();s=issueStandingOrder(s,{id:'reinforce',faction:'coalition',unitIds:[b.id],verb:'reinforce',targetId:'EWIP_2'});
 const r=resolveOrderedSiegePhase(s,cfg);assert.equal(r.state.units.find(u=>u.id===b.id).locationId,'EWIP_2');assert.equal(r.state.standingOrders[0].status,'fulfilled');
 assert.equal(planPersistentOrders(r.state,cfg).orders.length,0);
});
test('blocked rotation persists rather than overriding movement legality',()=>{
 let {s,a,b}=setup();b.locationId='WWIP_1';s=issueStandingOrder(s,{id:'rotate',faction:'coalition',unitIds:[a.id,b.id],verb:'rotate',pairs:[[a.id,b.id]]});
 const p=planPersistentOrders(s,cfg);assert.equal(p.orders.length,0);assert.equal(p.blocked[0].reason,'rotation-not-legal');
 const r=resolveOrderedSiegePhase(s,cfg);assert.equal(r.state.standingOrders[0].status,'active');
});
test('later hold supersedes rotate for one participant, leaving other unable to execute incomplete pair',()=>{
 let {s,a,b}=setup();s=issueStandingOrder(s,{id:'rotate',faction:'coalition',unitIds:[a.id,b.id],verb:'rotate',pairs:[[a.id,b.id]]});
 s=issueStandingOrder(s,{id:'hold',faction:'coalition',unitIds:[a.id],verb:'hold-position'});
 assert.deepEqual(s.standingOrders.find(o=>o.id==='rotate').unitIds,[b.id]);
 assert.equal(planPersistentOrders(s,cfg).orders.length,0);
});
