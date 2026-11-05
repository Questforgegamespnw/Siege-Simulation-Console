import {effectiveCP} from './combat.js';
import {applyAttrition} from './attrition.js';

/** Exposed target mass is formation CP after cohesion, WITHOUT climbing modifiers. */
export function targetMass(unit, definition) {
  return effectiveCP(unit, definition, {mode:'normal'});
}
export function rangedBaseLoss(rangedCP, exposedMass, bands) {
  if (rangedCP < 0 || exposedMass < 0) throw new Error('Negative ranged CP or target mass');
  if (rangedCP === 0 || exposedMass === 0) return {ratio:null, hostLoss:0};
  const ratio = rangedCP / exposedMass;
  const band = bands.find(b => ratio >= b.min && (b.maxExclusive == null || ratio < b.maxExclusive));
  if (!band) throw new Error('Missing ranged attrition band');
  return {ratio, hostLoss:band.hostLoss};
}
export function resolveExteriorFire(state, engagements, {coalitionTypes, hostTypes, rangedRules}) {
  const next = structuredClone(state);
  next.events ??= [];
  const byId = new Map(next.units.map(u=>[u.id,u]));
  const types = new Map([...coalitionTypes.unitTypes,...hostTypes.unitTypes].map(t=>[t.id,t]));
  const committed = new Set();
  const results=[];
  for (const e of engagements) {
    const archers=(e.archers??[]).map(id=>byId.get(id));
    const targets=(e.targets??[]).map(id=>byId.get(id));
    for (const [list,faction] of [[archers,'coalition'],[targets,'host']]) for (const u of list) {
      if (!u || u.faction!==faction) throw new Error('Invalid exterior participant');
      if (committed.has(u.id)) throw new Error(`Duplicate exterior participant ${u.id}`);
      committed.add(u.id);
    }
    if (archers.some(u=>u.typeId!=='archer')) throw new Error('Exterior firing unit must be an archer');
    const rangedCP=archers.reduce((sum,u)=>sum+effectiveCP(u,types.get(u.typeId),{mode:'ranged',suppressed:Boolean(e.suppressed)}),0);
    const exposedMass=targets.reduce((sum,u)=>sum+targetMass(u,types.get(u.typeId)),0);
    const band=rangedBaseLoss(rangedCP,exposedMass,rangedRules.bands);
    const changes=targets.map(u=>applyAttrition(u,band.hostLoss,types.get(u.typeId).baseAR));
    results.push({sectorId:e.sectorId,kind:'exterior-fire',archerIds:archers.map(u=>u.id),targetIds:targets.map(u=>u.id),rangedCP,exposedMass,ratio:band.ratio,baseHostLoss:band.hostLoss,changes});
  }
  for (const result of results) for (const c of result.changes) byId.get(c.unitId).cohesion=c.after;
  for (const result of results) next.events.push({phase:next.phase,...result});
  return {state:next,engagements:results};
}
