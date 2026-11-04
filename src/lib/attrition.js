/** Simultaneous ratio-band attrition, with individual resistance. */
import { cpRatio } from './combat.js';
export function baseLosses(hostCP, coalitionCP, ratioBands) {
  const ratio = cpRatio(hostCP, coalitionCP);
  if (ratio === null) return {ratio, coalitionLoss: 0, hostLoss: 0};
  // No opposition: don't invent automatic casualties for an uncontested movement/capture.
  if (hostCP === 0 || coalitionCP === 0) return {ratio, coalitionLoss: 0, hostLoss: 0, unopposed: true};
  const band = ratioBands.find(b => b.maxExclusive == null || ratio < b.maxExclusive);
  if (!band) throw new Error('Missing attrition ratio band');
  return {ratio, coalitionLoss: band.coalitionLoss, hostLoss: band.hostLoss};
}
export function applyAttrition(unit, baseLoss, resistance) {
  if (!(resistance >= 0 && resistance <= 1)) throw new Error(`Unresolved/invalid AR for ${unit.id}`);
  const loss = baseLoss * (1 - resistance);
  return {unitId: unit.id, before: unit.cohesion, loss, after: Math.max(0, unit.cohesion - loss)};
}
