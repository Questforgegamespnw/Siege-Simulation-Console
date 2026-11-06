import {positionOccupancy,localPath} from './local-network.js';
import {positionState} from './position-state.js';

/** One shared graph. Edge type selects its physical entrance, not a faction-specific movement mode. */
export function macroEdges(topology) {
  return [...topology.surfaceEdges.map(([a,b])=>({a,b,kind:'surface'})),...topology.tunnelSpokes.map(z=>({a:topology.tunnelHub,b:z,kind:'tunnel'}))];
}
export function macroEdge(topology,a,b,kind) {
  return macroEdges(topology).find(e=>e.kind===kind&&((e.a===a&&e.b===b)||(e.a===b&&e.b===a)));
}
export function zoneOf(state,id) {return state.positions.find(p=>p.id===id)?.sectorId;}
export function zoneAnchors(state,zone,kind) {
  if(kind==='tunnel')return state.positions.filter(p=>p.sectorId===zone&&(p.zone==='muster'||p.id==='DB')).map(p=>p.id);
  return state.positions.filter(p=>p.sectorId===zone&&(p.zone==='inner'||(zone==='dawnstone'&&p.zone!=='muster'))).map(p=>p.id);
}
export function validateZoneDeparture(state,fortress,topology,unit,order) {
  const fromZone=zoneOf(state,unit.locationId),toZone=zoneOf(state,order.to);
  if(!fromZone||!toZone||!macroEdge(topology,fromZone,toZone,order.route))throw new Error('No matching macro connection');
  const origins=zoneAnchors(state,fromZone,order.route),destinations=zoneAnchors(state,toZone,order.route);
  if(!destinations.includes(order.to))throw new Error('Destination is not a route entrance');
  if(!origins.includes(unit.locationId)) {
    // Local access to an entrance must be demonstrated; do not assume the whole zone is open.
    if(order.route==='tunnel'&&unit.locationId==='DB'){} else {
      const possible=origins.some(id=>{try{localPath(state,fortress,unit,id);return true;}catch{return false;}});
      if(!possible)throw new Error('Cannot reach departure entrance');
    }
  }
  const dest=state.positions.find(p=>p.id===order.to);
  const status=positionOccupancy(state,order.to);
  // Physical contestation alone does not deny a legal arrival; effective defenders do.
  // An explicit unresolved control challenge still blocks a secured macro arrival.
  if(positionState(state,order.to).controlChallenge)throw new Error('Arrival contested');
  if(status.defendedBy.some(f=>f!==unit.faction)&&!order.assault)throw new Error('Effective defenders deny arrival; assault required');
  if(order.assault&&!status.defendedBy.some(f=>f!==unit.faction))throw new Error('Assault requires defenders');
  if(unit.faction==='host'&&fromZone!=='deep-barracks') {
    const origin=state.positions.find(p=>p.id===unit.locationId);
    if(origin?.zone==='outer')throw new Error('Host must penetrate interior before zone travel');
  }
  return {fromZone,toZone};
}
