import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {effectiveCP} from '../src/lib/combat.js';
import {baseLosses} from '../src/lib/attrition.js';
import {resolveCombatPhase} from '../src/engine/combat-resolver.js';
const json = p => JSON.parse(readFileSync(new URL(p, import.meta.url)));
const coalitionTypes = json('../data/units/coalition.json');
const hostTypes = json('../data/units/host.json');
const combatRules = json('../data/rules/combat.json');
const fireCoverage = json('../data/scenarios/hold-until-dawn/fire-coverage.json');
const config = {coalitionTypes,hostTypes,combatRules,fireCoverage};
const u = (id, faction, typeId, locationId, cohesion=100) => ({id,faction,typeId,locationId,cohesion});
const a = u('a','coalition','archer','EWOP_1');
const h = u('h','host','swarmer','EWOP_3_APP');
test('CP scales with cohesion; melee and suppression do not stack', () => {
  assert.equal(effectiveCP({...a,cohesion:50}, coalitionTypes.unitTypes[0], {mode:'archer-melee',suppressed:true}),30);
  assert.equal(effectiveCP(a, coalitionTypes.unitTypes[0], {mode:'ranged',suppressed:true}),50);
});
test('ratio bands use strict upper boundaries', () => {
  assert.equal(baseLosses(120,100,combatRules.ratioBands).coalitionLoss,15);
  assert.equal(baseLosses(80,100,combatRules.ratioBands).coalitionLoss,10);
});
test('archer fires across lanes and gets 90% AR while ranged', () => {
  const result = resolveCombatPhase({phase:3,units:[a,h],events:[]}, [{id:'exterior',host:['h'],exteriorTargetNodeId:'EWOP_3_APP'}],config);
  assert.equal(result.engagements[0].coalitionCP,100);
  assert.equal(result.engagements[0].hostCP,45);
  assert.equal(result.state.units[0].cohesion,99.8);
  assert.equal(result.state.units[1].cohesion,85);
});
test('one archer cannot contribute to two clusters in one phase', () => {
  const state={phase:1,units:[a,h,u('h2','host','swarmer','EWOP_2_APP')]};
  assert.throws(()=>resolveCombatPhase(state,[
    {id:'x',host:['h'],exteriorTargetNodeId:'EWOP_3_APP'},
    {id:'y',host:['h2'],exteriorTargetNodeId:'EWOP_2_APP'}
  ],config),/more than one engagement/);
});
test('simultaneous results preserve original input and never retreat broken companies', () => {
  const state={phase:4,units:[u('c','coalition','men-at-arms','EWOP_1',26),u('e','host','swarmer','EWOP_1_CLM')]};
  const result=resolveCombatPhase(state,[{id:'melee',coalition:['c'],host:['e'],modes:{e:'climbing'}}],config);
  assert.equal(state.units[0].cohesion,26);
  assert.equal(result.state.units[0].locationId,'EWOP_1');
  assert.equal(result.state.units[0].cohesion,24.2);
  assert.equal(result.state.units[1].locationId,'EWOP_1_CLM');
  assert.equal(result.state.events.filter(e=>e.kind==='movement').length,0);
});
test('unopposed and zero-CP encounters do not invent attrition',()=>{
  const result=resolveCombatPhase({phase:1,units:[h]},[{id:'empty',host:['h']}],config);
  assert.equal(result.state.units[0].cohesion,100);
});
test('unknown CP and AR fail loudly',()=>{
  const special=u('s','host','shroud-archer','HN');
  assert.throws(()=>resolveCombatPhase({phase:1,units:[special,a]},[{id:'special',host:['s'],coalition:['a']}],config),/Unresolved CP/);
});
