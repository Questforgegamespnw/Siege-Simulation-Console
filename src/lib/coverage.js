/** Data-driven sector-wide ranged eligibility; not tied to an opposite lane. */
export function exteriorCoverageZone(fireCoverage, targetNodeId) {
  return fireCoverage.zones.find(z => z.targetNodeIds.includes(targetNodeId)) ?? null;
}
export function canFireExterior(unit, zone, {engagedInMelee = false, clearLane = true} = {}) {
  return Boolean(zone && unit.faction === 'coalition' && unit.typeId === 'archer' &&
    zone.firingPositionIds.includes(unit.locationId) && !engagedInMelee &&
    (!zone.requiresClearLane || clearLane));
}
