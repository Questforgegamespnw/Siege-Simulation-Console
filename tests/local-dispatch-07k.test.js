import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createInitialState} from '../src/engine/state.js';
import {resolveSiegePhase} from '../src/engine/phase-resolver.js';
import {dispatchEastWallHostOrders} from '../src/engine/host-route-dispatch.js';
const read=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const config={routes:read('../data/scenarios/hold-until-dawn/routes.json'),fortress:read('../data/scenarios/hold-until-dawn/fortress.json'),hostTopology:read('../data/scenarios/hold-until-dawn/host-topology.json'),deployment:read('../data/scenarios/hold-until-dawn/deployment.json'),fireCoverage:read('../data/scenarios/hold-until-dawn/fire-coverage.json'),coalitionTypes:read('../data/units/coalition.json'),hostTypes:read('../data/units/host.json'),combatRules:read('../data/rules/combat.json'),rangedRules:read('../data/rules/ranged-fire.json'),innerSupportClearLanes:{'east-wall':true}};
test('dispatcher uses local movement from captured outer to inner without passage staging',()=>{
 const s=createInitialState(config),u=s.units.find(u=>u.typeId==='swarmer');u.locationId='EWOP_3';s.positions.find(p=>p.id==='EWOP_3').controller='host';
 const orders=dispatchEastWallHostOrders(s,{fortress:config.fortress,maxSwarmers:1});
 assert.equal(orders.length,1);assert.match(orders[0].kind,/^local-(move|assault)$/);assert.match(orders[0].to,/^EWIP_[123]$/);
 const next=resolveSiegePhase(s,orders,config).state;assert.equal(next.units.find(x=>x.id===u.id).locationId,orders[0].to);
});
test('dispatcher cannot exploit Coalition-controlled uncaptured foothold',()=>{
 const s=createInitialState(config),u=s.units.find(u=>u.typeId==='swarmer');u.locationId='EWOP_3';
 const orders=dispatchEastWallHostOrders(s,{fortress:config.fortress,maxSwarmers:1});
 assert.equal(orders.some(o=>o.kind.startsWith('local-')),false);
});
