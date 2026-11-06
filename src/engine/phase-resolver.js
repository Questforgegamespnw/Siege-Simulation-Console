import {canonicalConfig} from '../config/rules.js';
import {ORDER_PLAN_AUTHORIZATION} from './order-plan-authorization.js';
import {resolveMovementPhase} from './movement-resolver.js';
import {resolveBattlefieldCombat} from './battlefield-combat.js';
import {canClaimPosition} from '../lib/engagement.js';

/** Provisional integrated movement + combat slice. Does NOT resolve Threat, capture,
 * dawn victory, automatic retreat, or other unimplemented phase steps.
 * All combat sees positions after movement; all attrition is simultaneous.
 */
export function resolveSiegePhase(state, orders, config, authorization) {
  // Direct phase calls cannot bypass active commander instructions.
  // The order-aware resolver passes an internal authorization after arbitration.
  const activeOrders=(state.standingOrders??[]).some(o=>o.status==='active'&&o.unitIds?.length);
  const activeOverrides=Object.keys(state.companyOverrides??{}).length>0;
  if((activeOrders||activeOverrides)&&authorization!==ORDER_PLAN_AUTHORIZATION)
    throw new Error('Active persistent commands require resolveOrderedSiegePhase');
  if (!state?.units || !state?.positions || !config?.fortress || !config?.hostTopology || !config?.routes || !config?.combatRules || !config?.rangedRules) throw new Error('Integrated phase requires valid state and complete movement/combat configuration');
  config = canonicalConfig(config);
  const moved = resolveMovementPhase(state, orders, config);
  const combat = resolveBattlefieldCombat(moved, config);
  const next = combat.state;
  // Ownership changes only after simultaneous attrition, never on declaration.
  for (const unit of next.units) {
    if (unit.action !== 'capture') continue;
    const position = next.positions.find(p => p.id === unit.locationId);
    const success = unit.cohesion > 0 && position?.controller === 'coalition' && canClaimPosition(next,unit.locationId,'host');
    if (success) {
      position.controller = 'host';
      position.controlChallenge = false;
      position.contested = false;
      next.events.push({phase:next.phase,kind:'position-claimed',positionId:position.id,unitId:unit.id,faction:'host'});
    } else next.events.push({phase:next.phase,kind:'capture-failed',positionId:unit.locationId,unitId:unit.id});
    delete unit.action;
  }
  return {state:next, movementEvents:moved.events.slice((state.events??[]).length), ...{
    discovered:combat.discovered,exterior:combat.exterior,melee:combat.melee
  }};
}
