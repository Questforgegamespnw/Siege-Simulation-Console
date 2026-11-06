import {macroEdges,zoneAnchors} from '../lib/macro-network.js';
import {positionOccupancy} from '../lib/local-network.js';

/** Pure, deterministic route candidates. Enumerates simple macro paths by increasing
 * total length, so a blocked shortest next hop can fall back to a longer detour.
 * Every proposal is still subject to the authoritative movement resolver.
 */
export function routeCandidates(state,unit,targetId,config,{avoidZones=[]}={}){
  const target=state.positions.find(p=>p.id===targetId);
  const origin=state.positions.find(p=>p.id===unit.locationId);
  if(!target||!origin)return [];
  if(origin.sectorId===target.sectorId){
    if(origin.id===target.id)return [];
    const defended=positionOccupancy(state,targetId).defendedBy.some(f=>f!==unit.faction);
    return [{kind:defended?'local-assault':'local-move',unitId:unit.id,to:targetId}];
  }
  const topology=config.routes?.macroTopology;
  if(!topology)return [];
  const edges=macroEdges(topology);
  const adjacency=new Map();
  for(const edge of edges){
    for(const [from,to] of [[edge.a,edge.b],[edge.b,edge.a]]){
      if(!adjacency.has(from))adjacency.set(from,[]);
      adjacency.get(from).push({to,kind:edge.kind});
    }
  }
  const avoided=new Set(avoidZones);
  const paths=[];
  const walk=(zone,visited,first)=>{
    if(zone===target.sectorId){paths.push({length:visited.size-1,first});return;}
    for(const step of adjacency.get(zone)??[]){
      if(visited.has(step.to)||(avoided.has(step.to)&&step.to!==target.sectorId))continue;
      walk(step.to,new Set([...visited,step.to]),first??step);
    }
  };
  walk(origin.sectorId,new Set([origin.sectorId]),null);
  paths.sort((a,b)=>a.length-b.length||(a.first.kind==='surface'?0:1)-(b.first.kind==='surface'?0:1)||a.first.to.localeCompare(b.first.to));
  const choices=[],seen=new Set();
  for(const path of paths){
    for(const to of [...zoneAnchors(state,path.first.to,path.first.kind)].sort()){
      const key=`${path.first.kind}:${to}`;
      if(seen.has(key))continue;
      seen.add(key);
      const defended=positionOccupancy(state,to).defendedBy.some(f=>f!==unit.faction);
      choices.push({kind:'zone-move',unitId:unit.id,to,route:path.first.kind,assault:defended});
    }
  }
  return choices;
}
