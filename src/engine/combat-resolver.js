import { effectiveCP } from '../lib/combat.js';
import { baseLosses, applyAttrition } from '../lib/attrition.js';
import { exteriorCoverageZone, canFireExterior } from '../lib/coverage.js';

/**
 * Resolve explicitly declared engagement clusters against one frozen state snapshot.
 * Each cluster: {id, coalition:[unitId], host:[unitId], modes?:{[id]: mode},
 *                 exteriorTargetNodeId?, suppressed?:boolean, clearLane?:boolean}.
 * Exterior target automatically recruits eligible archers in that sector, once per phase.
 * Engagement discovery and physical-control updates belong to later orchestration.
 */
export function resolveCombatPhase(state, clusters, {coalitionTypes, hostTypes, combatRules, fireCoverage}) {
  const next = structuredClone(state);
  next.events ??= [];
  const units = new Map(next.units.map(u => [u.id, u]));
  const definitions = new Map([...coalitionTypes.unitTypes, ...hostTypes.unitTypes].map(t => [t.id, t]));
  const committed = new Set();
  const results = [];
  for (const cluster of clusters) {
    const zone = cluster.exteriorTargetNodeId ? exteriorCoverageZone(fireCoverage, cluster.exteriorTargetNodeId) : null;
    if (cluster.exteriorTargetNodeId && !zone) throw new Error(`No exterior coverage zone for ${cluster.exteriorTargetNodeId}`);
    const coal = [...(cluster.coalition ?? [])];
    const host = [...(cluster.host ?? [])];
    if (zone) {
      for (const u of next.units) if (canFireExterior(u, zone, {
        engagedInMelee: cluster.engagedUnitIds?.includes(u.id), clearLane: cluster.clearLane !== false
      }) && !coal.includes(u.id)) coal.push(u.id);
    }
    const participants = [...coal, ...host];
    if (new Set(participants).size !== participants.length) throw new Error('Duplicate unit in cluster');
    for (const id of participants) {
      if (!units.has(id)) throw new Error(`Unknown combat unit ${id}`);
      if (committed.has(id)) throw new Error(`Unit ${id} committed to more than one engagement this phase`);
      committed.add(id);
    }
    for (const id of coal) if (units.get(id).faction !== 'coalition') throw new Error('Coalition list contains non-Coalition unit');
    for (const id of host) if (units.get(id).faction !== 'host') throw new Error('Host list contains non-Host unit');
    const modeFor = id => cluster.modes?.[id] ?? (zone && canFireExterior(units.get(id), zone, {
      engagedInMelee: cluster.engagedUnitIds?.includes(id), clearLane: cluster.clearLane !== false
    }) ? 'ranged' : 'normal');
    const cp = id => effectiveCP(units.get(id), definitions.get(units.get(id).typeId), {
      mode: modeFor(id), suppressed: Boolean(cluster.suppressed)
    });
    const coalitionCP = coal.reduce((sum,id) => sum + cp(id), 0);
    const hostCP = host.reduce((sum,id) => sum + cp(id), 0);
    const band = baseLosses(hostCP, coalitionCP, combatRules.ratioBands);
    const changes = [];
    for (const [ids, base] of [[coal, band.coalitionLoss], [host, band.hostLoss]]) {
      for (const id of ids) {
        const u = units.get(id);
        const def = definitions.get(u.typeId);
        const mode = modeFor(id);
        // Supporting ranged archers use 90% AR only when not in melee.
        const ar = (u.typeId === 'archer' && ['ranged','inner-support'].includes(mode)) ? 0.9 : def.baseAR;
        const change = applyAttrition(u, base, ar);
        changes.push(change);
      }
    }
    results.push({clusterId: cluster.id, coalitionCP, hostCP, ratio: band.ratio, baseCoalitionLoss: band.coalitionLoss, baseHostLoss: band.hostLoss, changes});
  }
  // Commit only after all clusters calculate from unchanged Cohesion.
  for (const result of results) for (const change of result.changes) units.get(change.unitId).cohesion = change.after;
  for (const result of results) next.events.push({phase: next.phase, kind:'combat-resolved', ...result});
  return {state: next, engagements: results};
}
