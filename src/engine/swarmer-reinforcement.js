/** Post-combat, finite Swarmer replacement pools. No combat CP is added.
 * Only rear, uncommitted Swarmers on a contiguous directed Host approach chain
 * can donate. All recipients share one proportional allocation per connected pool.
 */
export function reinforceSwarmers(preCombat, postCombat, discovered, config) {
  if (config.swarmerReinforcement !== true) return [];
  const before = new Map(preCombat.units.map(u => [u.id,u]));
  const after = new Map(postCombat.units.map(u => [u.id,u]));
  const engaged = new Set(discovered.melee.flatMap(e => [...e.host,...e.coalition]));
  const edges = config.hostTopology.edges.filter(e => e.from && e.to);
  const incoming = new Map();
  for (const e of edges) {if (!incoming.has(e.to)) incoming.set(e.to,[]);incoming.get(e.to).push(e.from);}
  const donors = postCombat.units.filter(u => u.faction==='host' && u.typeId==='swarmer' && u.cohesion>0 && !engaged.has(u.id) && !u.action && !postCombat.pendingOrders?.some(o=>o.unitId===u.id));
  const donorsAt = new Map();
  for (const u of donors) {if(!donorsAt.has(u.locationId))donorsAt.set(u.locationId,[]);donorsAt.get(u.locationId).push(u);}
  const recipients = postCombat.units.filter(u=>u.faction==='host' && u.typeId==='swarmer' && engaged.has(u.id) && before.get(u.id)?.cohesion>u.cohesion);
  // Each recipient sees only contiguous, rearward occupied chain nodes.
  const reach = new Map();
  for(const u of recipients) {
    const found=new Map(), visited=new Set([u.locationId]);
    let layer=[u.locationId],depth=0;
    while(layer.length){const next=[];depth++;
      for(const node of layer)for(const parent of incoming.get(node)??[]){
        if(visited.has(parent))continue;
        visited.add(parent);
        if(!(donorsAt.get(parent)?.length))continue; // gap severs chain
        for(const donor of donorsAt.get(parent))found.set(donor.id,depth);
        next.push(parent);
      }
      layer=next;
    }
    reach.set(u.id,found);
  }
  // Connected recipient groups compete for the same donors; no reserve double spending.
  const groups=[];const remaining=new Set(recipients.map(u=>u.id));
  while(remaining.size){const seed=remaining.values().next().value;remaining.delete(seed);const ids=new Set([seed]);const pool=new Set(reach.get(seed).keys());
    let changed=true;while(changed){changed=false;for(const id of [...remaining])if([...reach.get(id).keys()].some(d=>pool.has(d))){remaining.delete(id);ids.add(id);for(const d of reach.get(id).keys())pool.add(d);changed=true;}}
    groups.push({ids,pool});
  }
  const events=[];
  for(const group of groups){
    const fighters=[...group.ids].map(id=>after.get(id));
    const pool=[...group.pool].map(id=>after.get(id));
    // Rearmost first: greatest distance from any connected frontline; stable ID tie-break.
    pool.sort((a,b)=>Math.max(...fighters.map(f=>reach.get(f.id).get(b.id)??-1))-Math.max(...fighters.map(f=>reach.get(f.id).get(a.id)??-1)) || a.id.localeCompare(b.id));
    // Iterative proportional water filling, respecting individual access and donor capacity.
    const needs=new Map(fighters.map(u=>[u.id,Math.min(100-u.cohesion,before.get(u.id).cohesion-u.cohesion)]));
    for(const donor of pool){
      const eligible=fighters.filter(f=>reach.get(f.id).has(donor.id)&&needs.get(f.id)>1e-9);
      const total=eligible.reduce((n,f)=>n+needs.get(f.id),0);
      const spent=Math.min(donor.cohesion,total);
      if(spent<=0)continue;
      donor.cohesion=Math.max(0,donor.cohesion-spent);
      for(const f of eligible){const gained=spent*needs.get(f.id)/total;f.cohesion=Math.min(100,f.cohesion+gained);needs.set(f.id,Math.max(0,needs.get(f.id)-gained));events.push({phase:postCombat.phase,kind:'swarmer-replacement',frontlineId:f.id,donorId:donor.id,amount:gained});}
    }
  }
  postCombat.events.push(...events);
  return events;
}
