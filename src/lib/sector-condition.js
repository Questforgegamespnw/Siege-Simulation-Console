/** Derived East/West Wall condition from Coalition-controlled positions. */
export function getEastWestSectorCondition(positions, mapping) {
  if (positions.length !== 8) throw new RangeError('East/West Wall requires exactly 8 positions');
  const held = positions.filter((position) => position.controller === 'coalition').length;
  const condition = mapping[String(held)];
  if (!Number.isInteger(condition)) throw new Error(`Missing condition mapping for ${held} held`);
  return { held, outerHeld: positions.filter((p) => p.zone === 'outer' && p.controller === 'coalition').length,
    innerHeld: positions.filter((p) => p.zone === 'inner' && p.controller === 'coalition').length,
    condition };
}
