import {securedHostPosition} from '../lib/position-state.js';
import {localPath,positionOccupancy} from '../lib/local-network.js';
/** Deterministic, optional East Wall test policy. Produces orders, never moves units.
 * Every arrival must be accepted by the authoritative movement resolver.
 * This is a fixture dispatcher, not a general Host AI.
 */
export function dispatchEastWallHostOrders(state, {maxSwarmers=11, lanes=[1,2,3], fortress=null}={}) {
  const units=state.units.filter(u=>u.faction==='host'&&u.typeId==='swarmer').slice(0,maxSwarmers);
  const orders=[];
  const planned=new Map();
  const occupancy=id=>state.units.filter(u=>u.faction==='host'&&!u.singleEntity&&u.locationId===id).length+(planned.get(id)??0);
  const reserve=(id,from)=>{planned.set(id,(planned.get(id)??0)+1);if(from)planned.set(from,(planned.get(from)??0)-1);};
  // A company already on an undefended Coalition-owned position must commit
  // a whole phase to Capture before the corridor can be used next phase.
  for(const u of units) {
    const p=state.positions.find(p=>p.id===u.locationId);
    if(['outer','inner'].includes(p?.zone)&&p.controller==='coalition'&&!state.units.some(d=>d.faction==='coalition'&&d.locationId===p.id&&d.cohesion>25)) {
      if(!orders.some(o=>o.to===p.id&&o.kind==='host-capture'))orders.push({kind:'host-capture',unitId:u.id,to:p.id});
    }
  }
  const committed=new Set(orders.map(o=>o.unitId));
  let dispatchedFromNexus=0;
  if(!fortress) {
  // Advance from captured wall to a mapped passage, then contact inner defenses.
  // Passage movement is physical and consumes a phase; no teleport or free inner capture.
  for(const u of units) {
    if(committed.has(u.id)||u.cohesion<=0)continue;
    const matchWall=/^EWOP_([123])$/.exec(u.locationId);
    const matchPass=/^EW_PASS_([123])$/.exec(u.locationId);
    if(matchWall){
      const n=Number(matchWall[1]);const wall=state.positions.find(p=>p.id===u.locationId);
      const to=`EW_PASS_${n}`;
      if(wall?.controller==='host'&&securedHostPosition(state,wall.id)&&occupancy(to)<3){orders.push({kind:'host-step',unitId:u.id,to});reserve(to,u.locationId);committed.add(u.id);}
    }else if(matchPass){
      const n=Number(matchPass[1]);const to=`EWIP_${n}`;
      if(occupancy(to)<3){const inner=state.positions.find(p=>p.id===to);
        const kind=inner?.controller==='host'&&securedHostPosition(state,inner.id)?'host-step':'host-assault-inner';
        orders.push({kind,unitId:u.id,to});reserve(to,u.locationId);committed.add(u.id);}
    }
  }
  } else {
  // Local routes are free within the phase: never force wall -> passage -> inner.
  // Choose a legal destination from the current battlefield state, and let the
  // authoritative resolver validate it again on execution.
  for(const u of units) {
    if(committed.has(u.id)||u.cohesion<=0)continue;
    const from=state.positions.find(p=>p.id===u.locationId);
    if(!fortress)continue;
    if(from?.sectorId!=='east-wall')continue;
    if(from.zone==='outer' && from.controller!=='host' && positionOccupancy(state,from.id).defendedBy.includes('coalition'))continue;
    const destinations=from.zone==='outer'
      ? ['EWIP_1','EWIP_2','EWIP_3']
      : from.zone==='inner' && from.controller==='host' ? ['EWMP'] : [];
    for(const to of destinations.sort((a,b)=>occupancy(a)-occupancy(b))) {
      const target=state.positions.find(p=>p.id===to);
      if(!target || occupancy(to)>=(target.zone==='muster'?target.capacity:3))continue;
      const defended=positionOccupancy(state,to).defendedBy.includes('coalition');
      const kind=defended?'local-assault':'local-move';
      try { localPath(state, fortress, u, to, {assault:defended}); }
      catch {continue;}
      orders.push({kind,unitId:u.id,to});reserve(to,u.locationId);committed.add(u.id);
      break;
    }
  }
  }
  for(const u of units) {
    if(committed.has(u.id)||u.cohesion<=0)continue;
    if(u.locationId==='HN') {
      const lane=dispatchedFromNexus<3 ? [...lanes].sort((a,b)=>occupancy(`EWOP_${a}_APP`)-occupancy(`EWOP_${b}_APP`))[0] : null;
      if(lane){dispatchedFromNexus++;const to=`EWOP_${lane}_APP`;orders.push({kind:'host-step',unitId:u.id,to});reserve(to,u.locationId);}
    } else if(lanes.some(n=>u.locationId===`EWOP_${n}_APP`)) {
      const n=Number(u.locationId.match(/EWOP_(\d+)_APP/)[1]);const to=`EWOP_${n}_CLM`;
      if(occupancy(to)<3){orders.push({kind:'host-step',unitId:u.id,to});reserve(to,u.locationId);}
    } else if(lanes.some(n=>u.locationId===`EWOP_${n}_CLM`)) {
      const n=Number(u.locationId.match(/EWOP_(\d+)_CLM/)[1]);const to=`EWOP_${n}`;
      if(occupancy(to)>=3)continue;
      const p=state.positions.find(p=>p.id===to);
      const kind=p.controller==='host'&&securedHostPosition(state,p.id)?'host-step':'host-assault-contact';
      orders.push({kind,unitId:u.id,to});reserve(to,u.locationId);
    }
  }
  return orders;
}
