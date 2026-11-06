import {resolveMovementPhase} from './movement-resolver.js';
import {dispatchEastWallHostOrders} from './host-route-dispatch.js';

/** Deterministic test coordinator. Every accepted order is validated against the
 * entire provisional order batch. Rejected candidates are retried at alternate
 * legal destinations instead of being sent to the phase resolver.
 * No state mutation or combat shortcuts; this is not a strategic Host AI.
 */
export function coordinateEastWallOrders(state, config, {maxSwarmers=18, openingOrders=[]}={}) {
  const accepted=[]; const deferred=[]; const assigned=new Set();
  const validate=order=>{
    if(assigned.has(order.unitId) || (order.withUnitId && assigned.has(order.withUnitId)))return false;
    try {resolveMovementPhase(state,[...accepted,order],config);return true;}
    catch{return false;}
  };
  const accept=order=>{accepted.push(order);assigned.add(order.unitId);if(order.withUnitId)assigned.add(order.withUnitId);};
  for(const order of openingOrders){if(!validate(order))throw new Error(`Invalid preplanned order ${JSON.stringify(order)}`);accept(order);}
  const proposed=dispatchEastWallHostOrders(state,{fortress:config.fortress,maxSwarmers});
  for(const order of proposed){if(assigned.has(order.unitId))continue;
    if(validate(order)){accept(order);continue;}
    // Try alternate legal wall lanes and interior positions; do not bypass the resolver.
    const alternatives=[];
    const from=state.units.find(u=>u.id===order.unitId)?.locationId;
    if(from==='HN')for(const n of [1,2,3])alternatives.push({kind:'host-step',unitId:order.unitId,to:`EWOP_${n}_APP`});
    if(/^EWOP_[123]$/.test(from))for(const n of [1,2,3])for(const kind of ['local-assault','local-move'])alternatives.push({kind,unitId:order.unitId,to:`EWIP_${n}`});
    if(/^EWIP_[123]$/.test(from))for(const kind of ['local-assault','local-move'])alternatives.push({kind,unitId:order.unitId,to:'EWMP'});
    const fallback=alternatives.find(validate);
    if(fallback)accept(fallback);else deferred.push({unitId:order.unitId,proposed:order.kind,from});
  }
  // A final batch validation is intentionally redundant: detects order interactions.
  resolveMovementPhase(state,accepted,config);
  return {orders:accepted,deferred};
}
