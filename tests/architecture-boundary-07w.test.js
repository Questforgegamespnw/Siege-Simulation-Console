import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createInitialState} from '../src/engine/state.js';
import {resolveSiegePhase} from '../src/engine/phase-resolver.js';
import {issueStandingOrder,setCompanyOverride,resolveOrderedSiegePhase} from '../src/engine/persistent-orders.js';
import {canonicalConfig,defaultMechanics} from '../src/config/rules.js';
const j=p=>JSON.parse(readFileSync(new URL(p,import.meta.url)));
const cfg={fortress:j('../data/scenarios/hold-until-dawn/fortress.json'),routes:j('../data/scenarios/hold-until-dawn/routes.json'),hostTopology:j('../data/scenarios/hold-until-dawn/host-topology.json'),deployment:j('../data/scenarios/hold-until-dawn/deployment.json'),fireCoverage:j('../data/scenarios/hold-until-dawn/fire-coverage.json'),coalitionTypes:j('../data/units/coalition.json'),hostTypes:j('../data/units/host.json'),combatRules:j('../data/rules/combat.json'),rangedRules:j('../data/rules/ranged-fire.json')};
const setup=()=>{const s=createInitialState(cfg);const u=s.units.find(u=>u.faction==='coalition'&&u.typeId==='men-at-arms');return {s,u};};
test('direct integrated phase cannot bypass active standing orders, even with no explicit moves',()=>{
 let {s,u}=setup();s=issueStandingOrder(s,{id:'hold',faction:'coalition',unitIds:[u.id],verb:'hold-position'});
 assert.throws(()=>resolveSiegePhase(s,[],cfg),/resolveOrderedSiegePhase/);
 assert.equal(resolveOrderedSiegePhase(s,cfg).state.phase,s.phase+1);
});
test('individual overrides are equally protected at the phase boundary',()=>{
 let {s,u}=setup();s=setCompanyOverride(s,u.id,{kind:'local-move',unitId:u.id,to:'EWIP_2'});
 assert.throws(()=>resolveSiegePhase(s,[],cfg),/resolveOrderedSiegePhase/);
});
test('inactive orders do not prohibit direct smoke-test phases',()=>{
 let {s,u}=setup();s=issueStandingOrder(s,{id:'hold',faction:'coalition',unitIds:[u.id],verb:'hold-position'});
 s.standingOrders[0].status='fulfilled';
 assert.equal(resolveSiegePhase(s,[],cfg).state.phase,s.phase+1);
});
test('experimental switches are normalized and require explicit booleans',()=>{
 assert.deepEqual(defaultMechanics,{swarmerReinforcement:false,blindVolley:false});
 const normalized=canonicalConfig(cfg);
 assert.equal(normalized.swarmerReinforcement,false);assert.equal(normalized.blindVolley,false);
 assert.equal(canonicalConfig({...cfg,swarmerReinforcement:true,blindVolley:true}).blindVolley,true);
 assert.throws(()=>canonicalConfig({...cfg,swarmerReinforcement:'true'}),/Invalid mechanic switch/);
 assert.throws(()=>canonicalConfig({...cfg,blindVolley:1}),/Invalid mechanic switch/);
});
test('newer batch supersedes older hold while direct resolver remains guarded',()=>{
 let {s,u}=setup();s=issueStandingOrder(s,{id:'hold',faction:'coalition',unitIds:[u.id],verb:'hold-position'});
 s=issueStandingOrder(s,{id:'withdraw',faction:'coalition',unitIds:[u.id],verb:'withdraw',targetId:'EWIP_2'});
 assert.equal(s.standingOrders.length,1);assert.equal(s.standingOrders[0].id,'withdraw');
 assert.throws(()=>resolveSiegePhase(s,[],cfg),/resolveOrderedSiegePhase/);
});
