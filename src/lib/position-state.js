import {defaultRules} from '../config/rules.js';

/** Derived battlefield facts. Ownership is deliberately independent of physical contact. */
export function positionState(state, positionId, controlRules=defaultRules.control) {
  const occupants=state.units.filter(u=>u.locationId===positionId&&u.cohesion>0);
  const factions=[...new Set(occupants.map(u=>u.faction))];
  const effectiveDenial=[...new Set(occupants.filter(u=>u.cohesion>controlRules.cohesionBreakThresholdPercent).map(u=>u.faction))];
  const position=state.positions.find(p=>p.id===positionId);
  return {owner:position?.controller??null,occupants,contested:factions.length>1,
    controlChallenge:!!(position?.controlChallenge || position?.contested),
    effectiveDenial,brokenDefenders:occupants.filter(u=>u.cohesion<=controlRules.cohesionBreakThresholdPercent),
    canEnter(faction){return !effectiveDenial.some(f=>f!==faction);},
    canCapture(faction){return !effectiveDenial.some(f=>f!==faction);}};
}

/** Secured Host corridors require ownership and no active physical opposition.
 * A pending counterattack is a command, not a physical occupation. */
export function securedHostPosition(state,id) {
  const status=positionState(state,id);
  return status.owner==='host' && !status.contested && !status.controlChallenge;
}
