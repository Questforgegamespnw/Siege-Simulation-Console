import {resolveSiegePhase} from './phase-resolver.js';
import {ORDER_PLAN_AUTHORIZATION} from './order-plan-authorization.js';
import {resolveMovementPhase} from './movement-resolver.js';
import {coordinateEastWallOrders} from './coordinated-host-dispatch.js';
import {routeCandidates} from './standing-route-planner.js';

// Commands express intent. Only the movement resolver can authorize an action.
const verbs=new Set(['hold-position','assault-east-wall','reinforce','withdraw','rotate']);
const company=(s,id)=>s.units.find(u=>u.id===id);
// Translate authoritative resolver failures into stable, actionable diagnostics.
function movementRejection(error){
  const message=String(error?.message??error);
  if(/Destination at capacity|capacity\/frontage/i.test(message))return 'destination-at-capacity';
  if(/frontage|slots/i.test(message))return 'frontage-full';
  if(/denied|defended|enemy|counterattack/i.test(message))return 'enemy-denial';
  if(/path|reachable|connected|route|adjacen|access/i.test(message))return 'no-local-path';
  if(/contested/i.test(message))return 'contested-position';
  return 'movement-rejected';
}
function detach(next,ids){
  const selected=new Set(ids);
  next.standingOrders=(next.standingOrders??[]).map(o=>({...o,unitIds:o.unitIds.filter(id=>!selected.has(id))})).filter(o=>o.unitIds.length);
  for(const id of ids)delete next.companyOverrides?.[id];
}
/** Newest explicit command wins per company. `replace` remains accepted for older callers. */
export function issueStandingOrder(state,{id,faction,unitIds,verb,targetId,pairs},options={}){
  if(!id||!['host','coalition'].includes(faction)||!verbs.has(verb))throw Error('Invalid standing order');
  if(!Array.isArray(unitIds)||!unitIds.length||new Set(unitIds).size!==unitIds.length)throw Error('Standing order requires unique assigned units');
  const next=structuredClone(state);next.standingOrders??=[];next.companyOverrides??={};
  if(next.standingOrders.some(o=>o.id===id))throw Error('Duplicate order id');
  for(const unitId of unitIds){
    const u=company(next,unitId);
    if(!u||u.faction!==faction)throw Error(`Order company/faction mismatch: ${unitId}`);
    if(verb==='assault-east-wall'&&(faction!=='host'||u.typeId!=='swarmer'))throw Error('East Wall assault executor currently supports Host Swarmers only');
  }
  if(['reinforce','withdraw','rotate'].includes(verb)&&faction!=='coalition')throw Error('Coalition executor required');
  if(['reinforce','withdraw'].includes(verb)&&!next.positions.some(p=>p.id===targetId))throw Error('Target position required');
  if(verb==='rotate'){
    if(!Array.isArray(pairs)||!pairs.length||pairs.some(p=>!Array.isArray(p)||p.length!==2||p[0]===p[1]||p.some(id=>!unitIds.includes(id))))throw Error('Rotate requires assigned company pairs');
    if(new Set(pairs.flat()).size!==pairs.flat().length||new Set(pairs.flat()).size!==unitIds.length)throw Error('Each rotate company must appear in exactly one pair');
  }
  detach(next,unitIds);
  const anchors=Object.fromEntries(unitIds.map(id=>[id,company(next,id).locationId]));
  next.commandSequence=(next.commandSequence??0)+1;
  next.standingOrders.push({id,faction,unitIds:[...unitIds],verb,targetId,pairs:structuredClone(pairs??[]),anchors,routeVisited:{},status:'active',sequence:next.commandSequence});
  return next;
}
export function cancelStandingOrder(state,id){const next=structuredClone(state);next.standingOrders=(next.standingOrders??[]).filter(o=>o.id!==id);return next;}
/** A new individual instruction supersedes the company's previous batch assignment. */
export function setCompanyOverride(state,unitId,order){
  if(!company(state,unitId))throw Error('Unknown company');
  if(order!==null&&(order.unitId!==unitId||!order.kind))throw Error('Invalid company override');
  const next=structuredClone(state);next.companyOverrides??={};
  if(order===null)delete next.companyOverrides[unitId];
  else {detach(next,[unitId]);next.commandSequence=(next.commandSequence??0)+1;next.companyOverrides[unitId]={...structuredClone(order),sequence:next.commandSequence};}
  return next;
}
export function planPersistentOrders(state,config){
  const accepted=[],blocked=[],assigned=new Set();
  let lastRejection=null;
  const validate=order=>{
    if(assigned.has(order.unitId)||(order.withUnitId&&assigned.has(order.withUnitId)))return false;
    try{resolveMovementPhase(state,[...accepted,order],config);return true;}catch(error){lastRejection=movementRejection(error);return false;}
  };
  const accept=order=>{lastRejection=null;if(!validate(order))return false;accepted.push(order);assigned.add(order.unitId);if(order.withUnitId)assigned.add(order.withUnitId);return true;};
  for(const [unitId,order] of Object.entries(state.companyOverrides??{})){
    if(!company(state,unitId)||company(state,unitId).cohesion<=0)continue;
    if(!accept(order))blocked.push({unitId,orderId:`override:${order.sequence??0}`,reason:lastRejection??'override-not-legal'});
  }
  for(const standing of [...(state.standingOrders??[])].sort((a,b)=>(b.sequence??0)-(a.sequence??0))){
    if(standing.status!=='active')continue;
    const eligible=standing.unitIds.filter(id=>!assigned.has(id)&&!(id in (state.companyOverrides??{}))&&company(state,id)?.cohesion>0);
    if(standing.verb==='hold-position'){
      for(const id of eligible)if(company(state,id).locationId!==standing.anchors[id])blocked.push({unitId:id,reason:'hold-anchor-displaced'});
    }else if(standing.verb==='assault-east-wall'){
      // The East Wall fixture dispatcher handles nexus/approach/climb/assault.
      // Companies already in other macro zones route toward East Wall through
      // the shared graph; they never receive an unrelated East Wall host-step.
      const remote=eligible.filter(id=>{
        const u=company(state,id),p=state.positions.find(p=>p.id===u.locationId);
        return p&&p.sectorId!=='east-wall'&&u.locationId!=='HN';
      });
      for(const id of remote){
        const u=company(state,id);
        const candidates=routeCandidates(state,u,'EWIP_1',config,{avoidZones:standing.routeVisited?.[id]??[]});
        if(!candidates.some(accept))blocked.push({unitId:id,reason:lastRejection??'no-route-candidate'});
      }
      const local=eligible.filter(id=>!remote.includes(id));
      const candidates=coordinateEastWallOrders(state,config,{maxSwarmers:30}).orders.filter(o=>local.includes(o.unitId));
      for(const order of candidates)if(!accept(order))blocked.push({unitId:order.unitId,reason:'batch-conflict'});
    }else if(['reinforce','withdraw'].includes(standing.verb)){
      for(const id of eligible){
        const u=company(state,id),destination=state.positions.find(p=>p.id===standing.targetId);
        if(u.locationId===standing.targetId||u.locationId===`EN_ROUTE:${id}`||state.pendingOrders?.some(p=>p.unitId===id))continue;
        const origin=state.positions.find(p=>p.id===u.locationId);
        if(!origin||!destination){blocked.push({unitId:id,reason:'route-not-legal'});continue;}
        const candidates=routeCandidates(state,u,standing.targetId,config,{avoidZones:standing.routeVisited?.[id]??[]});
        if(!candidates.some(accept))blocked.push({unitId:id,reason:lastRejection??'no-route-candidate'});
      }
    }else if(standing.verb==='rotate'){
      for(const [a,b] of standing.pairs){
        if(!eligible.includes(a)||!eligible.includes(b)){if(eligible.includes(a)||eligible.includes(b))blocked.push({unitId:a,withUnitId:b,reason:'rotation-pair-superseded'});continue;}
        if(!accept({kind:'local-swap',unitId:a,withUnitId:b}))blocked.push({unitId:a,withUnitId:b,reason:lastRejection==='movement-rejected'?'rotation-not-legal':(lastRejection??'rotation-not-legal')});
      }
    }
  }
  // Associate each blockage with the instruction that owns the company.
  // Reissuing a new order should produce a fresh diagnostic, even if the
  // physical obstruction and reason remain unchanged.
  for(const item of blocked){
    if(item.orderId)continue;
    const owner=(state.standingOrders??[]).find(o=>o.status==='active'&&o.unitIds.includes(item.unitId));
    if(owner)item.orderId=owner.id;
  }
  return {orders:accepted,blocked};
}
export function resolveOrderedSiegePhase(state,config){
  const plan=planPersistentOrders(state,config);
  const result=resolveSiegePhase(state,plan.orders,config,ORDER_PLAN_AUTHORIZATION);
  result.state.standingOrders??=[];result.state.companyOverrides??={};
  for(const standing of result.state.standingOrders){
    if(standing.status!=='active')continue;
    // A standing order remembers the macro zones already departed during its
    // lifetime. Detours cannot bounce straight back into a blocked shortest hop.
    standing.routeVisited??={};
    for(const event of result.state.events){
      if(event.phase!==result.state.phase||event.kind!=='zone-departure'||!standing.unitIds.includes(event.unitId))continue;
      const visited=standing.routeVisited[event.unitId]??=[];
      if(!visited.includes(event.fromZone))standing.routeVisited[event.unitId]=[...visited,event.fromZone];
    }
    if(standing.unitIds.every(id=>company(result.state,id)?.cohesion<=0)){standing.status='exhausted';continue;}
    if(['reinforce','withdraw'].includes(standing.verb)&&standing.unitIds.every(id=>company(result.state,id)?.cohesion<=0||company(result.state,id)?.locationId===standing.targetId))standing.status='fulfilled';
    if(standing.verb==='rotate'&&standing.pairs.every(([a,b])=>company(result.state,a)?.locationId===standing.anchors[b]&&company(result.state,b)?.locationId===standing.anchors[a]))standing.status='fulfilled';
  }
  // Only emit obstruction transitions; a continuing blockage stays in state but
  // does not flood the event stream. Clearing or changing it emits one event.
  const previous=state.commandBlockages??{};
  const current={};
  for(const item of plan.blocked){
    const key=item.withUnitId?[item.unitId,item.withUnitId].sort().join('|'):item.unitId;
    current[key]={...item};
    if(previous[key]?.reason!==item.reason||previous[key]?.orderId!==item.orderId){
      result.state.events.push({phase:result.state.phase,kind:'standing-order-blocked',...item});
    }
  }
  for(const [key,item] of Object.entries(previous)){
    if(!(key in current))result.state.events.push({phase:result.state.phase,kind:'standing-order-unblocked',...item});
  }
  result.state.commandBlockages=current;
  return {...result,commandPlan:plan};
}
