import {positionState,securedHostPosition} from './position-state.js';
/** Pure, deterministic movement checks. No combat or attrition is resolved here. */
export function adjacency(edges) {
  const graph = new Map();
  for (const {from, to, bidirectional} of edges) {
    if (!graph.has(from)) graph.set(from, new Set());
    graph.get(from).add(to);
    if (bidirectional) {
      if (!graph.has(to)) graph.set(to, new Set());
      graph.get(to).add(from);
    }
  }
  return graph;
}

/** Host-controlled, uncontested chain from nexus. Exterior stages are Host-controlled by default. */
export function reachableHostNodes(state, topology) {
  const graph = adjacency(topology.edges);
  const positions = new Map(state.positions.map(p => [p.id, p]));
  const exterior = new Set(topology.nodes.map(n => n.id));
  const traversable = id => {
    const p = positions.get(id);
    return p ? securedHostPosition(state,id) : exterior.has(id) && !state.hostNodeContested?.includes(id);
  };
  const visited = new Set([topology.nexusId]);
  const queue = [topology.nexusId];
  for (let i = 0; i < queue.length; i++) {
    for (const next of graph.get(queue[i]) ?? []) {
      if (!visited.has(next) && traversable(next)) { visited.add(next); queue.push(next); }
    }
  }
  return visited;
}

export function validateHostStep(state, topology, unit, destinationId) {
  if (unit.faction !== 'host') throw new Error('Host step requires Host unit');
  const graph = adjacency(topology.edges);
  if (!graph.get(unit.locationId)?.has(destinationId)) throw new Error('No physical Host access edge');
  const target = state.positions.find(p => p.id === destinationId);
  if (target && target.controller !== 'host') throw new Error('Enemy position requires explicit assault/claim');
  if ((target && (positionState(state,destinationId).contested || positionState(state,destinationId).controlChallenge)) || state.hostNodeContested?.includes(destinationId)) throw new Error('Destination contested');
  if (!reachableHostNodes(state, topology).has(destinationId)) throw new Error('No uncontested Host corridor from nexus');
}

export function validateCoalitionRoute(state, routes, unit, destinationId) {
  if (unit.faction !== 'coalition') throw new Error('Coalition route requires Coalition unit');
  const route = routes.routes.find(r => (r.fromPositionId === unit.locationId && r.toPositionId === destinationId) || (r.bidirectional && r.toPositionId === unit.locationId && r.fromPositionId === destinationId));
  if (!route) throw new Error('No Coalition reinforcement route');
  if (state.routes.find(r => r.routeId === route.id)?.compromised) throw new Error('Compromised route attrition not calibrated; movement not resolved');
  return route;
}
