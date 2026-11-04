/** Build runtime state from immutable fortress definitions and initial deployment. */
export function createInitialState({ fortress, deployment }) {
  const initialControl = new Map((deployment.initialControl ?? []).map((item) => [item.positionId, item]));
  return {
    phase: 0,
    sectors: structuredClone(fortress.sectors),
    positions: fortress.positions.map((position) => ({
      ...structuredClone(position),
      controller: initialControl.get(position.id)?.controller ?? null,
      positionThreat: initialControl.get(position.id)?.positionThreat ?? 0,
      occupantUnitIds: [],
    })),
    units: structuredClone(deployment.units ?? []),
    routes: structuredClone(deployment.routeStates ?? []),
    pendingOrders: [],
    events: [],
  };
}
