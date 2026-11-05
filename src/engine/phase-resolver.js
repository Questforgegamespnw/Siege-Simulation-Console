import {resolveMovementPhase} from './movement-resolver.js';
import {resolveBattlefieldCombat} from './battlefield-combat.js';

/** Provisional integrated movement + combat slice. Does NOT resolve Threat, capture,
 * dawn victory, automatic retreat, or other unimplemented phase steps.
 * All combat sees positions after movement; all attrition is simultaneous.
 */
export function resolveSiegePhase(state, orders, config) {
  if (!state?.units || !state?.positions || !config?.fortress || !config?.hostTopology || !config?.routes || !config?.combatRules || !config?.rangedRules) throw new Error('Integrated phase requires valid state and complete movement/combat configuration');
  const moved = resolveMovementPhase(state, orders, config);
  const combat = resolveBattlefieldCombat(moved, config);
  return {state:combat.state, movementEvents:moved.events.slice((state.events??[]).length), ...{
    discovered:combat.discovered,exterior:combat.exterior,melee:combat.melee
  }};
}
