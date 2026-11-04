/** Pure, explicit combat-power calculations. No movement or ownership changes. */
export function effectiveCP(unit, archetype, {mode = 'normal', suppressed = false, supportMultiplier = 0.8} = {}) {
  if (archetype?.baseCP == null) throw new Error(`Unresolved CP for ${unit.typeId}`);
  if (!(unit.cohesion >= 0 && unit.cohesion <= 100)) throw new Error(`Invalid cohesion for ${unit.id}`);
  let multiplier = 1;
  if (mode === 'climbing') multiplier = 0.3;
  else if (mode === 'archer-melee') {
    if (unit.typeId !== 'archer') throw new Error('Archer melee mode requires an archer');
    multiplier = 0.6;
  } else if (mode === 'ranged') {
    if (!archetype.tags?.includes('ranged')) throw new Error('Ranged mode requires ranged tag');
    multiplier = suppressed ? 0.5 : 1;
  } else if (mode === 'inner-support') {
    if (!archetype.tags?.includes('ranged')) throw new Error('Support requires ranged tag');
    multiplier = supportMultiplier * (suppressed ? 0.5 : 1);
  } else if (mode !== 'normal') throw new Error(`Unsupported combat mode: ${mode}`);
  return archetype.baseCP * unit.cohesion / 100 * multiplier;
}
export function cpRatio(hostCP, coalitionCP) {
  if (hostCP < 0 || coalitionCP < 0) throw new Error('CP cannot be negative');
  if (coalitionCP === 0) return hostCP > 0 ? Infinity : null;
  return hostCP / coalitionCP;
}
