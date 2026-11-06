import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createInitialState} from '../src/engine/state.js';
import {issueStandingOrder,planPersistentOrders,resolveOrderedSiegePhase} from '../src/engine/persistent-orders.js';
const j=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const cfg={fortress:j('../data/scenarios/hold-until-dawn/fortress.json'),routes:j('../data/scenarios/hold-until-dawn/routes.json'),hostTopology:j('../data/scenarios/hold-until-dawn/host-topology.json'),deployment:j('../data/scenarios/hold-until-dawn/deployment.json'),fireCoverage:j('../data/scenarios/hold-until-dawn/fire-coverage.json'),coalitionTypes:j('../data/units/coalition.json'),hostTypes:j('../data/units/host.json'),combatRules:j('../data/rules/combat.json'),rangedRules:j('../data/rules/ranged-fire.json'),engagementReach:'frontage'};
const setup=()=>{const s=createInitialState(cfg);const u=s.units.find(x=>x.faction==='coalition'&&x.typeId==='men-at-arms');u.locationId='DB';return {s,u};};
test('reinforce crosses one legal macro edge, waits in transit, then completes local leg',()=>{
 let {s,u}=setup();s=issueStandingOrder(s,{id:'route',faction:'coalition',unitIds:[u.id],verb:'reinforce',targetId:'EWIP_1'});
 const plan=planPersistentOrders(s,cfg);assert.equal(plan.orders[0].kind,'zone-move');assert.equal(plan.orders[0].route,'tunnel');assert.equal(plan.orders[0].to,'EWMP');
 s=resolveOrderedSiegePhase(s,cfg).state;assert.equal(s.units.find(x=>x.id===u.id).locationId,`EN_ROUTE:${u.id}`);
 assert.equal(planPersistentOrders(s,cfg).orders.length,0);
 s=resolveOrderedSiegePhase(s,cfg).state;assert.equal(s.units.find(x=>x.id===u.id).locationId,'EWMP');
 assert.equal(planPersistentOrders(s,cfg).orders[0]?.kind,'local-move');
 s=resolveOrderedSiegePhase(s,cfg).state;assert.equal(s.units.find(x=>x.id===u.id).locationId,'EWIP_1');assert.equal(s.standingOrders[0].status,'fulfilled');
});
test('new hold supersedes a pending multi-zone reinforce without teleporting or canceling transit',()=>{
 let {s,u}=setup();s=issueStandingOrder(s,{id:'route',faction:'coalition',unitIds:[u.id],verb:'reinforce',targetId:'EWIP_1'});
 s=resolveOrderedSiegePhase(s,cfg).state;
 s=issueStandingOrder(s,{id:'hold',faction:'coalition',unitIds:[u.id],verb:'hold-position'});
 assert.deepEqual(s.standingOrders.map(x=>x.id),['hold']);
 assert.equal(planPersistentOrders(s,cfg).orders.length,0);
 s=resolveOrderedSiegePhase(s,cfg).state;
 assert.equal(s.units.find(x=>x.id===u.id).locationId,'EWMP');
 s=resolveOrderedSiegePhase(s,cfg).state;
 assert.ok(s.events.some(e=>e.kind==='standing-order-blocked'&&e.reason==='hold-anchor-displaced'));
});
test('invalid macro arrival remains blocked, not bypassed by persistent command',()=>{
 let {s,u}=setup();s=issueStandingOrder(s,{id:'route',faction:'coalition',unitIds:[u.id],verb:'reinforce',targetId:'EWIP_1'});
 s=resolveOrderedSiegePhase(s,cfg).state;
 // Host occupies arrival entrance before the queued transit resolves.
 const host=s.units.find(x=>x.faction==='host'&&x.typeId==='swarmer');host.locationId='EWMP';host.cohesion=100;
 s=resolveOrderedSiegePhase(s,cfg).state;
 assert.equal(s.units.find(x=>x.id===u.id).locationId,`EN_ROUTE:${u.id}`);
 assert.equal(s.standingOrders[0].status,'active');
 assert.ok(s.events.some(e=>e.kind==='zone-arrival-blocked'));
});
