import {discoverEngagements} from './engagement-discovery.js';
import {resolveExteriorFire} from '../lib/ranged-fire.js';
import {resolveCombatPhase} from './combat-resolver.js';

/** All engagement results use the SAME pre-combat snapshot, then commit together. */
export function resolveBattlefieldCombat(state, config) {
  const discovered=discoverEngagements(state,config);
  const ranged=resolveExteriorFire(state,discovered.exterior,config);
  const melee=resolveCombatPhase(state,discovered.melee,config);
  const next=structuredClone(state);
  const before=new Map(state.units.map(u=>[u.id,u.cohesion]));
  const lossById=new Map();
  for(const result of [...ranged.engagements,...melee.engagements]) for(const change of result.changes) {
    if(lossById.has(change.unitId)) throw new Error(`Duplicate attrition ${change.unitId}`);
    lossById.set(change.unitId,change.loss);
  }
  for(const u of next.units) u.cohesion=Math.max(0,before.get(u.id)-(lossById.get(u.id)??0));
  next.events=[...(state.events??[]),...ranged.state.events.slice((state.events??[]).length),...melee.state.events.slice((state.events??[]).length)];
  return {state:next,discovered,exterior:ranged.engagements,melee:melee.engagements};
}
