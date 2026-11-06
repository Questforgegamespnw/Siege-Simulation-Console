import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createInitialState} from '../src/engine/state.js';
import {resolveBattlefieldCombat} from '../src/engine/battlefield-combat.js';
import {resolveMovementPhase} from '../src/engine/movement-resolver.js';
import {coordinateEastWallOrders} from '../src/engine/coordinated-host-dispatch.js';
const j=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const cfg={fortress:j('../data/scenarios/hold-until-dawn/fortress.json'),routes:j('../data/scenarios/hold-until-dawn/routes.json'),hostTopology:j('../data/scenarios/hold-until-dawn/host-topology.json'),deployment:j('../data/scenarios/hold-until-dawn/deployment.json'),fireCoverage:j('../data/scenarios/hold-until-dawn/fire-coverage.json'),coalitionTypes:j('../data/units/coalition.json'),hostTypes:j('../data/units/host.json'),combatRules:j('../data/rules/combat.json'),rangedRules:j('../data/rules/ranged-fire.json'),innerSupportClearLanes:{'east-wall':true},engagementReach:'frontage'};
const select=(s,f,t,n)=>s.units.filter(u=>u.faction===f&&u.typeId===t).slice(0,n);
test('simultaneous two-position contact aggregates only actual frontline CP once',()=>{
 const s=createInitialState(cfg),[m]=select(s,'coalition','men-at-arms',1),[sp]=select(s,'coalition','spearman',1),[reserve]=select(s,'coalition','men-at-arms',2).slice(1),[arch]=select(s,'coalition','archer',1),hs=select(s,'host','swarmer',5);
 m.locationId='EWOP_1';sp.locationId='EWOP_2';reserve.locationId='EWIP_1';arch.locationId='EWIP_2';
 hs[0].locationId='EWOP_1';hs[1].locationId='EWOP_1';hs[2].locationId='EWOP_2';hs[3].locationId='EWOP_3';hs[4].locationId='EWOP_1_APP';
 const r=resolveBattlefieldCombat(s,cfg),e=r.discovered.melee.find(x=>x.sectorId==='east-wall');
 assert.deepEqual(new Set(e.host),new Set(hs.slice(0,3).map(u=>u.id)));
 assert.equal(r.melee.find(x=>x.clusterId==='east-wall-sector-combat').hostCP,135);
 assert.equal(r.melee.find(x=>x.clusterId==='east-wall-sector-combat').coalitionCP,150+110+80);
 assert.equal(e.coalition.includes(reserve.id),false);
 assert.equal(r.state.units.find(u=>u.id===hs[3].id).cohesion,100);
 assert.equal(r.state.units.find(u=>u.id===hs[4].id).cohesion,100);
 assert.equal(r.melee.filter(x=>x.clusterId==='east-wall-sector-combat').length,1);
});
test('coordinator emits fully legal simultaneous orders without modifying source state',()=>{
 const s=createInitialState(cfg);const original=structuredClone(s);
 const {orders}=coordinateEastWallOrders(s,cfg,{maxSwarmers:18});
 assert.ok(orders.length>0);
 assert.equal(new Set(orders.map(o=>o.unitId)).size,orders.length);
 assert.doesNotThrow(()=>resolveMovementPhase(s,orders,cfg));
 assert.deepEqual(s,original);
});
test('coordinator validates swap with Host orders in one batch',()=>{
 const s=createInitialState(cfg),[a,b]=select(s,'coalition','men-at-arms',2);
 a.locationId='EWOP_1';b.locationId='EWIP_1';
 const {orders}=coordinateEastWallOrders(s,cfg,{maxSwarmers:18,openingOrders:[{kind:'local-swap',unitId:a.id,withUnitId:b.id}]});
 assert.equal(orders[0].kind,'local-swap');
 assert.doesNotThrow(()=>resolveMovementPhase(s,orders,cfg));
});
