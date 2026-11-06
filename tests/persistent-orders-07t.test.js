import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createInitialState} from '../src/engine/state.js';
import {issueStandingOrder,setCompanyOverride,planPersistentOrders,resolveOrderedSiegePhase,cancelStandingOrder} from '../src/engine/persistent-orders.js';
const j=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const cfg={fortress:j('../data/scenarios/hold-until-dawn/fortress.json'),routes:j('../data/scenarios/hold-until-dawn/routes.json'),hostTopology:j('../data/scenarios/hold-until-dawn/host-topology.json'),deployment:j('../data/scenarios/hold-until-dawn/deployment.json'),fireCoverage:j('../data/scenarios/hold-until-dawn/fire-coverage.json'),coalitionTypes:j('../data/units/coalition.json'),hostTypes:j('../data/units/host.json'),combatRules:j('../data/rules/combat.json'),rangedRules:j('../data/rules/ranged-fire.json'),innerSupportClearLanes:{'east-wall':true},engagementReach:'frontage'};
const units=(s,f,t,n)=>s.units.filter(u=>u.faction===f&&u.typeId===t).slice(0,n);
test('strict Coalition hold persists at critical cohesion and issues no retreat',()=>{
 let s=createInitialState(cfg);const [u]=units(s,'coalition','men-at-arms',1);u.locationId='EWOP_1';u.cohesion=15;
 s=issueStandingOrder(s,{id:'hold',faction:'coalition',unitIds:[u.id],verb:'hold-position'});
 const r=resolveOrderedSiegePhase(s,cfg);
 assert.equal(r.state.units.find(x=>x.id===u.id).locationId,'EWOP_1');
 assert.equal(r.state.standingOrders[0].status,'active');
 assert.equal(r.commandPlan.orders.length,0);
});
test('Host assault remains persistent across multiple phases and respects legal resolver',()=>{
 let s=createInitialState(cfg);const hs=units(s,'host','swarmer',6);
 s=issueStandingOrder(s,{id:'assault',faction:'host',unitIds:hs.map(x=>x.id),verb:'assault-east-wall'});
 const p=planPersistentOrders(s,cfg);assert.ok(p.orders.length>0);
 const r=resolveOrderedSiegePhase(s,cfg);
 assert.equal(r.state.standingOrders[0].status,'active');assert.equal(r.state.phase,s.phase+1);
 assert.ok(r.commandPlan.orders.every(o=>hs.some(u=>u.id===o.unitId)));
});
test('individual override takes precedence and remains in force if blocked',()=>{
 let s=createInitialState(cfg);const [u]=units(s,'host','swarmer',1);
 s=issueStandingOrder(s,{id:'assault',faction:'host',unitIds:[u.id],verb:'assault-east-wall'});
 s=setCompanyOverride(s,u.id,{kind:'host-step',unitId:u.id,to:'INVALID_NODE'});
 const p=planPersistentOrders(s,cfg);
 assert.equal(p.orders.length,0);assert.equal(p.blocked[0].unitId,u.id);assert.equal(p.blocked[0].reason,'no-local-path');
 s=resolveOrderedSiegePhase(s,cfg).state;
 assert.equal(s.companyOverrides[u.id].to,'INVALID_NODE');
 s=setCompanyOverride(s,u.id,null);
 assert.equal(planPersistentOrders(s,cfg).orders.length,0); // Superseded batch does not silently resume.
});
test('batch replacement and cancellation preserve other assignments',()=>{
 let s=createInitialState(cfg);const [a,b]=units(s,'coalition','spearman',2);
 s=issueStandingOrder(s,{id:'one',faction:'coalition',unitIds:[a.id,b.id],verb:'hold-position'});
 s=issueStandingOrder(s,{id:'two',faction:'coalition',unitIds:[a.id],verb:'hold-position'},{replace:true});
 assert.deepEqual(s.standingOrders.find(o=>o.id==='one').unitIds,[b.id]);
 assert.deepEqual(cancelStandingOrder(s,'two').standingOrders.map(o=>o.id),['one']);
});
