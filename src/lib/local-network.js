import {positionState} from './position-state.js';

/** Explicit local graph. One muster position has capacity two; it is not two separate nodes. */
export function localNetwork(fortress) {
  const graph = new Map();
  const link=(a,b)=>{if(!graph.has(a))graph.set(a,new Set());if(!graph.has(b))graph.set(b,new Set());graph.get(a).add(b);graph.get(b).add(a);};
  for(const prefix of ['EW','WW']) {
    const sector=prefix==='EW'?'east-wall':'west-wall';
    const ids=new Set(fortress.positions.filter(p=>p.sectorId===sector).map(p=>p.id));
    for(let o=1;o<=3;o++)for(let i=1;i<=3;i++)if(ids.has(`${prefix}OP_${o}`)&&ids.has(`${prefix}IP_${i}`))link(`${prefix}OP_${o}`,`${prefix}IP_${i}`);
    for(let i=1;i<=3;i++)if(ids.has(`${prefix}IP_${i}`)&&ids.has(`${prefix}MP`))link(`${prefix}IP_${i}`,`${prefix}MP`);
  }
  // Other sectors already define explicit inner-to-muster links in the reinforcement data.
  // Only add these known links, not speculative inner-to-inner adjacency.
  for(const [prefix,sector] of [['GH','gatehouse'],['RD','residential'],['DS','dawnstone']]) {
    const ids=new Set(fortress.positions.filter(p=>p.sectorId===sector).map(p=>p.id));
    const mp=`${prefix}MP`;
    for(const id of ids)if(id!==mp&&(id.startsWith(`${prefix}IP_`)||id.startsWith('DSP_'))&&ids.has(mp))link(id,mp);
  }
  return graph;
}
export function positionOccupancy(state,id) {
  const status=positionState(state,id);
  return {occupied:status.occupants.length>0,defendedBy:status.effectiveDenial,contested:status.contested};
}
/** Find a route without traversing effective enemies. Destination can be enemy defended only for an assault order. */
export function localPath(state,fortress,unit,destination,{assault=false}={}) {
  const graph=localNetwork(fortress);
  const positions=new Map(state.positions.map(p=>[p.id,p]));
  const origin=positions.get(unit.locationId),target=positions.get(destination);
  if(!origin||!target||origin.sectorId!==target.sectorId||origin.id===target.id)throw new Error('Local travel requires distinct positions in the same sector');
  if(!graph.has(origin.id)||!graph.has(target.id))throw new Error('No local movement connection');
  // A Host company in a Coalition-controlled wall foothold cannot exploit it until captured.
  if(unit.faction==='host'&&origin.zone==='outer'&&origin.controller!=='host' && !positionState(state,origin.id).canEnter('host'))throw new Error('Effective defenders prevent interior transit');
  const queue=[[origin.id]];const seen=new Set([origin.id]);
  for(let i=0;i<queue.length;i++){
    const path=queue[i];
    for(const id of graph.get(path.at(-1))??[]){
      if(seen.has(id))continue;
      const p=positions.get(id);
      if(!p)continue;
      const status=positionOccupancy(state,id);
      // Contested occupancy alone never blocks traversal: only effective enemy denial does.
      if(status.defendedBy.some(f=>f!==unit.faction)&&!(assault&&id===destination))continue;
      if(id===destination)return [...path,id];
      seen.add(id);queue.push([...path,id]);
    }
  }
  throw new Error('No unblocked local path');
}
