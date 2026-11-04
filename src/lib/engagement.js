/** Physical-control checks only; no combat or attrition is resolved here. */
export const isEffectiveDefender = unit => unit.cohesion > 25;
export function canClaimPosition(state, positionId, claimantFaction) {
  return !state.units.some(u => u.locationId === positionId && u.faction !== claimantFaction && isEffectiveDefender(u));
}
/** Count conventional Host formations committed to a specific climb stage. */
export function assaultFrontageCount(state, climbNodeId) {
  return state.units.filter(u => u.faction === 'host' && u.locationId === climbNodeId && !u.singleEntity).length;
}
