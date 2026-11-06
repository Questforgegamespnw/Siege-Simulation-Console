import test from 'node:test';
import assert from 'node:assert/strict';
import {defaultRules,canonicalConfig,effectiveRules} from '../src/config/rules.js';
import {effectiveCP} from '../src/lib/combat.js';
import {isBroken} from '../src/lib/control.js';
import {isEffectiveDefender} from '../src/lib/engagement.js';
import {discoverEngagements} from '../src/engine/engagement-discovery.js';
import {issueStandingOrder,planPersistentOrders} from '../src/engine/persistent-orders.js';
import {readFileSync} from 'node:fs';
const j = p => JSON.parse(readFileSync(new URL(p,import.meta.url)));
const cfg={fortress:j('../data/scenarios/hold-until-dawn/fortress.json'),routes:j('../data/scenarios/hold-until-dawn/routes.json'),hostTopology:j('../data/scenarios/hold-until-dawn/host-topology.json'),fireCoverage:j('../data/scenarios/hold-until-dawn/fire-coverage.json'),coalitionTypes:j('../data/units/coalition.json'),hostTypes:j('../data/units/host.json'),combatRules:j('../data/rules/combat.json'),rangedRules:j('../data/rules/ranged-fire.json')};
const unit={id:'x',typeId:'archer',faction:'coalition',cohesion:100};
const type={baseCP:100,tags:['ranged']};
test('canonical frontage default and explicit legacy rejection',()=>{
 assert.equal(canonicalConfig(cfg).engagementReach,'frontage');
 assert.throws(()=>canonicalConfig({...cfg,engagementReach:'legacy-sector'}),/Legacy engagement mode/);
});
test('ruleset rejects inconsistent frontage definitions',()=>{
 const bad=structuredClone(defaultRules);bad.movement.hostAssaultFrontage.conventionalCompaniesPerOuterPosition=4;
 assert.throws(()=>effectiveRules({movementRules:bad.movement}),/Conflicting frontage/);
});
test('changing rules changes CP calculation, without source edits',()=>{
 const rules=structuredClone(defaultRules);rules.combat.climbingHostCPMultiplier=0.47;
 rules.combat.captureHostCPMultiplier=0.31;
 rules.modifiers.archerMeleeCPMultiplier=0.72;
 rules.modifiers.shroudSuppressedArcherRangedCPMultiplier=0.42;
 assert.equal(effectiveCP(unit,type,{mode:'climbing',rules}),47);
 assert.equal(effectiveCP(unit,type,{mode:'capture',rules}),31);
 assert.equal(effectiveCP(unit,type,{mode:'archer-melee',rules}),72);
 assert.equal(effectiveCP(unit,type,{mode:'ranged',suppressed:true,rules}),42);
});
test('broken threshold is data driven, and callback-safe',()=>{
 assert.equal(isBroken({cohesion:30}),false);
 assert.equal(isBroken({cohesion:30},35),true);
 assert.equal([{cohesion:50}].some(isEffectiveDefender),true);
 assert.equal(isEffectiveDefender({cohesion:30},{cohesionBreakThresholdPercent:35}),false);
});
test('direct discovery defaults to frontage and does not count uncontacted companies',()=>{
 const state={units:[{id:'h',faction:'host',typeId:'swarmer',cohesion:100,locationId:'EWOP_1'},
 {id:'c',faction:'coalition',typeId:'men-at-arms',cohesion:100,locationId:'EWOP_2'}]};
 const r=discoverEngagements(state,cfg);
 assert.equal(r.melee.length,0);
});
test('new batch supersedes previous hold for selected companies only',()=>{
 const s={phase:0,units:[{id:'a',faction:'coalition',cohesion:100,locationId:'EWOP_1'}, {id:'b',faction:'coalition',cohesion:100,locationId:'EWOP_2'}, {id:'c',faction:'coalition',cohesion:100,locationId:'EWIP_1'}],positions:[{id:'EWOP_1'},{id:'EWOP_2'},{id:'EWIP_1'}]};
 const held=issueStandingOrder(s,{id:'hold',faction:'coalition',verb:'hold-position',unitIds:['a','b']});
 const rotated=issueStandingOrder(held,{id:'rotate',faction:'coalition',verb:'rotate',unitIds:['a','c'],pairs:[['a','c']]});
 assert.deepEqual(rotated.standingOrders.find(o=>o.id==='hold').unitIds,['b']);
 assert.deepEqual(rotated.standingOrders.find(o=>o.id==='rotate').unitIds,['a','c']);
 assert.equal(rotated.commandSequence,2);
});
