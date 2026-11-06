import {readFileSync} from 'node:fs';
const root = new URL('../../data/rules/', import.meta.url);
const read = name => JSON.parse(readFileSync(new URL(name, root), 'utf8'));
export const defaultRules = Object.freeze({combat:read('combat.json'), modifiers:read('modifiers.json'), control:read('control.json'), movement:read('movement.json')});
const positive = (n,label) => {if(typeof n!=='number'||!Number.isFinite(n)||n<0)throw new Error(`Invalid rule ${label}`);};
export function validateRules(rules) {
  if(!rules?.combat||!rules?.modifiers||!rules?.control||!rules?.movement)throw new Error('Incomplete ruleset');
  for(const key of ['climbingHostCPMultiplier','captureHostCPMultiplier','blindVolleyCPMultiplier','conventionalAssaultSlotsPerOccupiedCoalitionPosition'])positive(rules.combat[key],`combat.${key}`);
  for(const key of ['archerMeleeCPMultiplier','shroudSuppressedArcherRangedCPMultiplier','innerToOuterMeleeRangedCPMultiplier','rangedSupportAR'])positive(rules.modifiers[key],`modifiers.${key}`);
  positive(rules.control.cohesionBreakThresholdPercent,'control.cohesionBreakThresholdPercent');
  if(rules.control.cohesionBreakThresholdPercent>100||rules.modifiers.rangedSupportAR>1)throw new Error('Invalid ruleset range');
  if(rules.movement.hostAssaultFrontage.conventionalCompaniesPerOuterPosition!==rules.combat.conventionalAssaultSlotsPerOccupiedCoalitionPosition)throw new Error('Conflicting frontage rules');
  return rules;
}
export function effectiveRules(config={}) {
  const rules={combat:config.combatRules??defaultRules.combat,modifiers:config.modifierRules??defaultRules.modifiers,control:config.controlRules??defaultRules.control,movement:config.movementRules??defaultRules.movement};
  return validateRules(rules);
}
// Optional mechanics remain OFF by default until explicitly enabled in a scenario.
// Both switches are normalized here so integrated phase callers share one policy.
export const defaultMechanics = Object.freeze({swarmerReinforcement:false,blindVolley:false});
export function canonicalConfig(config={}) {
  for(const name of Object.keys(defaultMechanics))
    if(config[name]!==undefined && typeof config[name]!=='boolean')throw new Error(`Invalid mechanic switch ${name}`);
  if(config.engagementReach!=null&&config.engagementReach!=='frontage')throw new Error('Legacy engagement mode prohibited in canonical siege phase');
  const rules=effectiveRules(config);
  return {...defaultMechanics,...config,engagementReach:'frontage',combatRules:rules.combat,modifierRules:rules.modifiers,controlRules:rules.control,movementRules:rules.movement};
}
