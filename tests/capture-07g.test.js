import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createInitialState} from '../src/engine/state.js';
import {resolveSiegePhase} from '../src/engine/phase-resolver.js';
import {effectiveCP} from '../src/lib/combat.js';
const json=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const config={fortress:json('../data/scenarios/hold-until-dawn/fortress.json'),routes:json('../data/scenarios/hold-until-dawn/routes.json'),hostTopology:json('../data/scenarios/hold-until-dawn/host-topology.json'),deployment:json('../data/scenarios/hold-until-dawn/deployment.json'),fireCoverage:json('../data/scenarios/hold-until-dawn/fire-coverage.json'),coalitionTypes:json('../data/units/coalition.json'),hostTypes:json('../data/units/host.json'),combatRules:json('../data/rules/combat.json'),rangedRules:json('../data/rules/ranged-fire.json'),innerSupportClearLanes:{'east-wall':true}};
function fixture(){const s=createInitialState(config);const sw=s.units.find(u=>u.typeId==='swarmer'&&u.faction==='host');sw.locationId='EWOP_3';const maa=s.units.find(u=>u.typeId==='men-at-arms'&&u.faction==='coalition');maa.locationId='EWOP_3';maa.cohesion=25;return {s,sw,maa};}
test('capture commits half effective CP, then changes control only after combat',()=>{
 const {s,sw}=fixture();const normal=resolveSiegePhase(s,[],config);const captured=resolveSiegePhase(s,[{kind:'host-capture',unitId:sw.id,to:'EWOP_3'}],config);
 const n=normal.melee.find(e=>e.clusterId==='east-wall-sector-combat'),c=captured.melee.find(e=>e.clusterId==='east-wall-sector-combat');
 assert.equal(c.hostCP,n.hostCP/2);assert.equal(normal.state.positions.find(p=>p.id==='EWOP_3').controller,'coalition');
 assert.equal(captured.state.positions.find(p=>p.id==='EWOP_3').controller,'host');
 assert.ok(captured.state.events.some(e=>e.kind==='capture-committed'));assert.ok(captured.state.events.some(e=>e.kind==='position-claimed'));
 assert.equal(captured.state.units.find(u=>u.id===sw.id).action,undefined);
});
test('capture requires presence, effective defenders deny it, and no multiple capturers',()=>{
 const {s,sw}=fixture();assert.throws(()=>resolveSiegePhase(s,[{kind:'host-capture',unitId:sw.id,to:'EWOP_2'}],config),/physical presence/);
 const defender=s.units.find(u=>u.typeId==='spearman'&&u.faction==='coalition');defender.locationId='EWOP_3';assert.throws(()=>resolveSiegePhase(s,[{kind:'host-capture',unitId:sw.id,to:'EWOP_3'}],config),/Effective defenders/);
 defender.cohesion=25;const second=s.units.filter(u=>u.typeId==='swarmer'&&u.faction==='host')[1];second.locationId='EWOP_3';assert.throws(()=>resolveSiegePhase(s,[{kind:'host-capture',unitId:sw.id,to:'EWOP_3'},{kind:'host-capture',unitId:second.id,to:'EWOP_3'}],config),/already has a capturing/);
});
test('capture is an exclusive phase action, not a permanent CP penalty',()=>{
 const {s,sw}=fixture();const one=resolveSiegePhase(s,[{kind:'host-capture',unitId:sw.id,to:'EWOP_3'}],config).state;
 const two=resolveSiegePhase(one,[],config);assert.equal(two.discovered.melee.find(e=>e.sectorId==='east-wall').modes[sw.id],undefined);
});
test('capture CP is calculated after cohesion, independent of climbing',()=>{
 const type=config.hostTypes.unitTypes.find(t=>t.id==='swarmer');const unit={id:'test',typeId:'swarmer',cohesion:80};
 assert.equal(effectiveCP(unit,type,{mode:'capture'}),type.baseCP*.8*.5);
 assert.equal(effectiveCP(unit,type,{mode:'climbing'}),type.baseCP*.8*.3);
});
