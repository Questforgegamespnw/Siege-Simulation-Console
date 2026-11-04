import { validateHostStep, validateCoalitionRoute } from '../lib/movement.js';
import { canClaimPosition, assaultFrontageCount, isEffectiveDefender } from '../lib/engagement.js';

/** Resolve only declared movement; does not resolve siege combat, attacks, or attrition. */
export function resolveMovementPhase(state, orders, { fortress, routes, hostTopology }) {
  const next = structuredClone(state);
  next.events ??= [];
  next.pendingOrders ??= [];
  next.phase += 1;
  const positions = new Map(next.positions.map(p => [p.id, p]));
  const units = new Map(next.units.map(u => [u.id, u]));
  const moved = new Set();
  const occupancy = id => next.units.filter(u => u.locationId === id && u.faction === 'coalition' && u.typeId !== 'brazier-keeper').length;
  const capacity = id => positions.get(id)?.capacity;
  const transfer = (unit, destination) => {
    if (capacity(destination) != null && unit.faction === 'coalition' && occupancy(destination) >= capacity(destination)) throw new Error('Destination at capacity');
    const from = unit.locationId; unit.locationId = destination;
    next.events.push({phase: next.phase, kind: 'movement', unitId: unit.id, from, to: destination});
  };
  // Previous-phase Coalition arrivals resolve before this phase's new orders.
  const pending = next.pendingOrders;
  next.pendingOrders = [];
  for (const item of pending) {
    if (item.arrivalPhase !== next.phase) {next.pendingOrders.push(item); continue;}
    const unit = units.get(item.unitId);
    if (!unit || unit.locationId !== item.from) throw new Error('Pending movement origin mismatch');
    transfer(unit, item.to);
    moved.add(unit.id);
  }
  for (const order of orders) {
    const unit = units.get(order.unitId);
    if (!unit) throw new Error(`Unknown unit ${order.unitId}`);
    if (moved.has(unit.id)) throw new Error(`Duplicate movement for ${unit.id}`);
    if (order.kind === 'coalition-route') {
      const route = validateCoalitionRoute(next, routes, unit, order.to);
      if (route.travelPhases !== 1) throw new Error('Only one-phase routes supported');
      next.pendingOrders.push({unitId: unit.id, from: unit.locationId, to: order.to, arrivalPhase: next.phase + 1});
      next.events.push({phase: next.phase, kind: 'movement-queued', unitId: unit.id, to: order.to});
    } else if (order.kind === 'coalition-local') {
      if (unit.faction !== 'coalition') throw new Error('Wrong faction');
      const valid = routes.localAccess.some(a => a.fromPositionId === unit.locationId && a.toPositionIds.includes(order.to));
      if (!valid) throw new Error('No local muster access');
      if (positions.get(order.to)?.controller !== 'coalition') throw new Error('Not Coalition-controlled');
      transfer(unit, order.to);
    } else if (order.kind === 'host-step') {
      validateHostStep(next, hostTopology, unit, order.to);
      const targetNode = hostTopology.nodes.find(n => n.id === order.to);
      if (targetNode?.kind === 'climbing' && assaultFrontageCount(next, order.to) >= 3) throw new Error('Host assault frontage limit (3)');
      transfer(unit, order.to);
    } else if (order.kind === 'host-claim') {
      if (unit.faction !== 'host') throw new Error('Wrong faction');
      const position = positions.get(order.to);
      if (!position || position.controller !== 'coalition') throw new Error('Not a Coalition-held position');
      if (position.zone !== 'outer') throw new Error('Inner access unresolved');
      const edge = hostTopology.edges.find(e => e.from === unit.locationId && e.to === order.to && e.kind === 'assault-entry');
      if (!edge) throw new Error('Must reach climbing stage before claim');
      if (!canClaimPosition(next, order.to, 'host')) throw new Error('Defenders hold position; combat required');
      position.controller = 'host';
      transfer(unit, order.to);
      next.events.push({phase: next.phase, kind: 'position-claimed', positionId: order.to, faction: 'host'});
    } else if (order.kind === 'coalition-counterattack') {
      if (unit.faction !== 'coalition') throw new Error('Counterattack requires Coalition unit');
      const target = positions.get(order.to);
      if (!target || target.controller !== 'host') throw new Error('Counterattack requires Host-controlled position');
      // Entry must be physically adjacent to a Coalition-controlled position, or an existing contested foothold.
      const from = positions.get(unit.locationId);
      const local = from?.sectorId === target.sectorId && from?.controller === 'coalition';
      if (!local && unit.locationId !== order.to) throw new Error('No physical counterattack access');
      target.contested = true;
      next.events.push({phase: next.phase, kind: 'position-contested', positionId: target.id, faction: 'coalition'});
      // A counterattack is an engagement declaration, not an instant capture.
    } else if (order.kind === 'coalition-reclaim') {
      if (unit.faction !== 'coalition') throw new Error('Reclaim requires Coalition unit');
      const target = positions.get(order.to);
      if (!target || target.controller !== 'host' || !target.contested) throw new Error('Reclaim requires contested Host position');
      if (!canClaimPosition(next, order.to, 'coalition')) throw new Error('Host defenders hold position; combat required');
      const from = positions.get(unit.locationId);
      if (!(from?.sectorId === target.sectorId && from?.controller === 'coalition') && unit.locationId !== order.to) throw new Error('No physical reclaim access');
      transfer(unit, order.to);
      target.controller = 'coalition';
      target.contested = false;
      next.events.push({phase: next.phase, kind: 'position-claimed', positionId: order.to, faction: 'coalition'});
    } else throw new Error(`Unsupported movement order ${order.kind}`);
    moved.add(unit.id);
  }
  return next;
}
