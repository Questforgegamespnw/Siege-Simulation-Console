import {defaultRules} from '../config/rules.js';
/** Physical-control checks only; no combat or attrition is resolved here. */
export const isEffectiveDefender = (unit, controlRules) => unit.cohesion > (controlRules && typeof controlRules === 'object' ? controlRules : defaultRules.control).cohesionBreakThresholdPercent;
export function canClaimPosition(state, positionId, claimantFaction, controlRules = defaultRules.control) {
  return !state.units.some(u => u.locationId === positionId && u.faction !== claimantFaction && isEffectiveDefender(u, controlRules));
}
/** Count conventional Host formations committed to a specific climb stage. */
export function assaultFrontageCount(state, climbNodeId) {
  return state.units.filter(u => u.faction === 'host' && u.locationId === climbNodeId && !u.singleEntity).length;
}
