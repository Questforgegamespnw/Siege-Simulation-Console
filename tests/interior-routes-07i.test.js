import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createInitialState} from '../src/engine/state.js';
import {resolveSiegePhase} from '../src/engine/phase-resolver.js';
import {dispatchEastWallHostOrders} from '../src/engine/host-route-dispatch.js';
const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const config={fortress:json('../data/scenarios/hold-until-dawn/fortress.json'),routes:json('../data/scenarios/hold-until-dawn/routes.json'),hostTopology:json('../data/scenarios/hold-until-dawn/host-topology.json'),deployment:json('../data/scenarios/hold-until-dawn/deployment.json'),fireCoverage:json('../data/scenarios/hold-until-dawn/fire-coverage.json'),coalitionTypes:json('../data/units/coalition.json'),hostTypes:json('../data/units/host.json'),combatRules:json('../data/rules/combat.json'),rangedRules:json('../data/rules/ranged-fire.json'),innerSupportClearLanes:{'east-wall':true}};
const sw=s=>s.units.filter(u=>u.faction==='host'&&u.typeId==='swarmer');
test('captured outer wall opens only its physically adjacent inner passage',()=>{
 const s=createInitialState(config);const u=sw(s)[0];u.locationId='EWOP_3';s.positions.find(p=>p.id==='EWOP_3').controller='host';
 assert.throws(()=>resolveSiegePhase(s,[{kind:'host-step',unitId:u.id,to:'EW_PASS_2'}],config),/physical Host access/);
 const next=resolveSiegePhase(s,[{kind:'host-step',unitId:u.id,to:'EW_PASS_3'}],config).state;
 assert.equal(next.units.find(x=>x.id===u.id).locationId,'EW_PASS_3');
 assert.equal(next.positions.find(p=>p.id==='EWIP_3').controller,'coalition');
 assert.throws(()=>resolveSiegePhase(next,[{kind:'host-step',unitId:u.id,to:'EWIP_3'}],config),/Enemy position/);
 const entered=resolveSiegePhase(next,[{kind:'host-assault-inner',unitId:u.id,to:'EWIP_3'}],config).state;
 assert.equal(entered.units.find(x=>x.id===u.id).locationId,'EWIP_3');
 assert.equal(entered.positions.find(p=>p.id==='EWIP_3').controller,'coalition');
});
test('cannot traverse wall exit without capture or from contested captured wall',()=>{
 const s=createInitialState(config);const u=sw(s)[0];u.locationId='EWOP_3';
 assert.throws(()=>resolveSiegePhase(s,[{kind:'host-step',unitId:u.id,to:'EW_PASS_3'}],config),/corridor/);
 s.positions.find(p=>p.id==='EWOP_3').controller='host';s.positions.find(p=>p.id==='EWOP_3').contested=true;
 assert.throws(()=>resolveSiegePhase(s,[{kind:'host-step',unitId:u.id,to:'EW_PASS_3'}],config),/corridor/);
});
test('interior passage capacity and inner assault frontage are enforced',()=>{
 const s=createInitialState(config);const units=sw(s);s.positions.find(p=>p.id==='EWOP_3').controller='host';
 for(let i=0;i<3;i++)units[i].locationId='EW_PASS_3';units[3].locationId='EWOP_3';
 assert.throws(()=>resolveSiegePhase(s,[{kind:'host-step',unitId:units[3].id,to:'EW_PASS_3'}],config),/passage capacity/);
 for(let i=0;i<3;i++)units[i].locationId='EWIP_3';units[3].locationId='EW_PASS_3';
 assert.throws(()=>resolveSiegePhase(s,[{kind:'host-assault-inner',unitId:units[3].id,to:'EWIP_3'}],config),/frontage/);
});
test('dispatcher physically moves through captured wall and frees wall frontage',()=>{
 const s=createInitialState(config);const units=sw(s);s.positions.find(p=>p.id==='EWOP_3').controller='host';
 for(let i=0;i<3;i++)units[i].locationId='EWOP_3';units[3].locationId='EWOP_3_CLM';
 const orders=dispatchEastWallHostOrders(s,{maxSwarmers:4,lanes:[3]});
 assert.equal(orders.filter(o=>o.to==='EW_PASS_3').length,3);
 const moved=resolveSiegePhase(s,orders,config).state;
 assert.equal(units.slice(0,3).filter(u=>moved.units.find(x=>x.id===u.id).locationId==='EW_PASS_3').length,3);
 assert.equal(moved.units.find(x=>x.id===units[3].id).locationId,'EWOP_3');
});
