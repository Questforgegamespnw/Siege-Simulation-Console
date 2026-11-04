/** A Broken company retains its remaining CP and presence, but cannot deny occupation. */
export function isBroken(unit, threshold = 25) {
  if (typeof unit.cohesion !== 'number') throw new TypeError('Unit cohesion must be numeric (0–100)');
  return unit.cohesion <= threshold;
}
// TODO: resolve physical access, contested advances, Position Threat, and controllers.
