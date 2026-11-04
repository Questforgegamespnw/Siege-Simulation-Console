/** Create a fresh mutable runtime snapshot from scenario configuration. */
export function createInitialState({ fortress, deployment }) {
  return { phase: 0, sectors: structuredClone(fortress.sectors),
    positions: structuredClone(fortress.positions), units: structuredClone(deployment.units),
    pendingOrders: [], events: [] };
}
