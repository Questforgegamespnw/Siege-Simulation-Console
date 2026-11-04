/** Runtime state is separate from immutable topology and deployment definitions. */
export function createInitialState({ fortress, deployment, hostTopology }) {
  const initialControl = new Map((deployment.initialControl ?? []).map(item => [item.positionId, item]));
  return {
    phase: 0,
    sectors: structuredClone(fortress.sectors),
    positions: fortress.positions.map(position => ({
      ...structuredClone(position),
      controller: initialControl.get(position.id)?.controller ?? null,
      positionThreat: initialControl.get(position.id)?.positionThreat ?? 0,
      contested: false,
      occupantUnitIds: [],
    })),
    units: structuredClone(deployment.units ?? []),
    hostNodes: structuredClone(hostTopology?.nodes ?? []),
    hostNodeContested: [],
    routes: structuredClone(deployment.routeStates ?? []),
    pendingOrders: [],
    events: [],
  };
}
