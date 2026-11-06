import {defaultRules} from '../config/rules.js';
import {validateZoneDeparture,zoneOf} from '../lib/macro-network.js';
import { validateHostStep, validateCoalitionRoute, reachableHostNodes } from '../lib/movement.js';
import { canClaimPosition, assaultFrontageCount, isEffectiveDefender } from '../lib/engagement.js';
import {localPath,positionOccupancy} from '../lib/local-network.js';
import {positionState} from '../lib/position-state.js';

const reachableInteriorEntry = (state, topology, from) => reachableHostNodes(state,topology).has(from);

/** Resolve only declared movement; does not resolve siege combat, attacks, or attrition. */
export function resolveMovementPhase(state, orders, { fortress, routes, hostTopology, combatRules = defaultRules.combat }) {
  const frontage = combatRules.conventionalAssaultSlotsPerOccupiedCoalitionPosition;
  const next = structuredClone(state);
  next.events ??= [];
  next.pendingOrders ??= [];
  next.phase += 1;
  const positions = new Map(next.positions.map(p => [p.id, p]));
  const units = new Map(next.units.map(u => [u.id, u]));
  const moved = new Set();
  // Capture commitment is phase-scoped; it never carries into the next phase.
  for (const unit of next.units) if (unit.action === 'capture') delete unit.action;
  const occupancy = id => next.units.filter(u => u.locationId === id && u.faction === 'coalition' && u.typeId !== 'brazier-keeper').length;
  const capacity = id => positions.get(id)?.capacity;
  // Narrow rally exception: one fresh defender can enter an over-capacity
  // position containing broken allies AND active enemy occupants. Never displace
  // units already there; further reinforcements require ordinary free capacity.
  const rallyEntryAllowed=(unit,id)=>{
    const p=positions.get(id), status=positionState(next,id);
    if(!p||p.controller!==unit.faction||!status.contested)return false;
    if(status.effectiveDenial.includes(unit.faction))return false;
    if(!status.brokenDefenders.some(u=>u.faction===unit.faction))return false;
    return occupancy(id)===p.capacity;
  };
  const transfer = (unit, destination) => {
    if (capacity(destination) != null && unit.faction === 'coalition' && occupancy(destination) >= capacity(destination) && !rallyEntryAllowed(unit,destination)) throw new Error('Destination at capacity');
    const from = unit.locationId; unit.locationId = destination;
    next.events.push({phase: next.phase, kind: 'movement', unitId: unit.id, from, to: destination});
  };
  // Previous-phase Coalition arrivals resolve before this phase's new orders.
  const pending = next.pendingOrders;
  next.pendingOrders = [];
  for (const item of pending) {
    if (item.arrivalPhase !== next.phase) {next.pendingOrders.push(item); continue;}
    const unit = units.get(item.unitId);
    if (!unit || unit.locationId !== (item.kind==='zone' ? `EN_ROUTE:${unit.id}` : item.from)) throw new Error('Pending movement origin mismatch');
    if(item.kind==='zone') {
      const target=positions.get(item.to);
      const status=positionOccupancy(next,item.to);
      const defended=status.defendedBy.some(f=>f!==unit.faction);
      // Capacity/frontage applies to arriving faction, not the sum of opposing combatants.
      const count=next.units.filter(u=>u.locationId===item.to&&u.faction===unit.faction&&!u.singleEntity&&u.cohesion>0).length;
      const cap=target.zone==='muster'||target.id==='DB'?target.capacity:(unit.faction==='host'?frontage:target.capacity);
      if((defended&&!item.assault)||(item.assault&&!defended)||(cap!=null&&count>=cap&&!rallyEntryAllowed(unit,item.to))) {
        next.pendingOrders.push({...item,arrivalPhase:next.phase+1});
        next.events.push({phase:next.phase,kind:'zone-arrival-blocked',unitId:unit.id,to:item.to});
        continue;
      }
      // Assault contact is not capture. Occupied enemy arrivals participate in ordinary combat.
      unit.locationId=item.to;
      next.events.push({phase:next.phase,kind:item.assault?'zone-assault-contact':'zone-arrival',unitId:unit.id,from:item.from,to:item.to,route:item.route});
    } else transfer(unit,item.to);
    moved.add(unit.id);
  }
  // Atomic local swaps: no transient vacancy, capacity overflow, or cohesion change.
  // A swap is resolved before combat and consumes both companies' movement for the phase.
  const swappedOrders = new Set();
  for (const [index,order] of orders.entries()) {
    if(order.kind !== 'local-swap') continue;
    const a=units.get(order.unitId), b=units.get(order.withUnitId);
    if(!a||!b||a.id===b.id)throw new Error('Swap requires two distinct existing companies');
    if(moved.has(a.id)||moved.has(b.id))throw new Error('Swap company already moved');
    if(a.faction!==b.faction)throw new Error('Swap requires allied companies');
    if(a.singleEntity||b.singleEntity||a.typeId==='brazier-keeper'||b.typeId==='brazier-keeper')throw new Error('Swap requires regular companies');
    if(a.cohesion<=0||b.cohesion<=0)throw new Error('Swap requires surviving companies');
    const pa=positions.get(a.locationId),pb=positions.get(b.locationId);
    if(!pa||!pb||pa.id===pb.id||pa.sectorId!==pb.sectorId)throw new Error('Swap requires distinct positions in same sector');
    if(positionOccupancy(next,pb.id).contested)throw new Error('Cannot swap into a contested reserve position');
    // The frontline may be actively contested: rotation must remain possible
    // under pressure. Ignore enemy contact at the two endpoints ONLY for path
    // validation; intervening compartments remain fully blocked.
    const pathState={...next,units:next.units.filter(u=>u.faction===a.faction||![pa.id,pb.id].includes(u.locationId)),positions:next.positions};
    const pathA=localPath(pathState,fortress,a,pb.id);
    const pathB=localPath(pathState,fortress,b,pa.id);
    const fromA=a.locationId,fromB=b.locationId;
    a.locationId=fromB;b.locationId=fromA;
    moved.add(a.id);moved.add(b.id);swappedOrders.add(index);
    next.events.push({phase:next.phase,kind:'local-swap',unitIds:[a.id,b.id],from:[fromA,fromB],to:[fromB,fromA],paths:[pathA,pathB]});
  }
  for (const [orderIndex,order] of orders.entries()) {
    if(swappedOrders.has(orderIndex))continue;
    const unit = units.get(order.unitId);
    if (!unit) throw new Error(`Unknown unit ${order.unitId}`);
    if (moved.has(unit.id)) throw new Error(`Duplicate movement for ${unit.id}`);
    if (order.kind === 'host-capture') {
      if (unit.faction !== 'host') throw new Error('Capture requires Host unit');
      const position = positions.get(order.to);
      if (!position || !['outer','inner'].includes(position.zone) || position.controller !== 'coalition') throw new Error('Capture requires a Coalition-controlled outer position');
      if (unit.locationId !== order.to) throw new Error('Capture requires physical presence at position');
      if (!canClaimPosition(next, order.to, 'host')) throw new Error('Effective defenders deny capture');
      if (next.units.some(other => other.id !== unit.id && other.action === 'capture' && other.locationId === order.to)) throw new Error('Position already has a capturing company');
      unit.action = 'capture';
      next.events.push({phase:next.phase,kind:'capture-committed',unitId:unit.id,positionId:order.to});
    } else if (order.kind === 'local-move' || order.kind === 'local-assault') {
      const assault=order.kind==='local-assault';
      const path=localPath(next,fortress,unit,order.to,{assault});
      const target=positions.get(order.to);
      const status=positionOccupancy(next,order.to);
      const defended=status.defendedBy.some(f=>f!==unit.faction);
      if(assault && !defended) throw new Error('Local assault requires an effective enemy defender');
      if(!assault && defended) throw new Error('Defended destination requires assault');
      if(unit.faction==='coalition' && !assault && target.controller==='host') throw new Error('Host-controlled destination requires counterattack');
      if(unit.faction==='host'&&!unit.singleEntity&&next.units.filter(u=>u.faction==='host'&&!u.singleEntity&&u.locationId===order.to).length>= (target.zone==='muster'?target.capacity:frontage)) throw new Error('Host local destination capacity/frontage');
      if(unit.faction==='coalition'&&occupancy(order.to)>=target.capacity&&!rallyEntryAllowed(unit,order.to))throw new Error('Destination at capacity');
      transfer(unit,order.to);
      next.events.push({phase:next.phase,kind:assault?'local-assault-contact':'local-reposition',unitId:unit.id,path});
    } else if (order.kind === 'zone-move') {
      if(!hostTopology && !fortress)throw new Error('Missing movement configuration');
      const topology=routes.macroTopology;
      if(!topology)throw new Error('Macro topology required for zone movement');
      const {fromZone,toZone}=validateZoneDeparture(next,fortress,topology,unit,order);
      const from=unit.locationId;
      unit.locationId=`EN_ROUTE:${unit.id}`;
      next.pendingOrders.push({kind:'zone',unitId:unit.id,from,to:order.to,route:order.route,assault:!!order.assault,arrivalPhase:next.phase+1});
      next.events.push({phase:next.phase,kind:'zone-departure',unitId:unit.id,from,to:order.to,fromZone,toZone,route:order.route});
    } else if (order.kind === 'coalition-route') {
      const route = validateCoalitionRoute(next, routes, unit, order.to);
      if (route.travelPhases !== 1) throw new Error('Only one-phase routes supported');
      next.pendingOrders.push({unitId: unit.id, from: unit.locationId, to: order.to, arrivalPhase: next.phase + 1});
      next.events.push({phase: next.phase, kind: 'movement-queued', unitId: unit.id, to: order.to});
    } else if (order.kind === 'coalition-local') {
      if (unit.faction !== 'coalition') throw new Error('Wrong faction');
      const valid = routes.localAccess.some(a => a.fromPositionId === unit.locationId && a.toPositionIds.includes(order.to));
      if (!valid) throw new Error('No local muster access');
      if (positions.get(order.to)?.controller !== 'coalition') throw new Error('Not Coalition-controlled');
      transfer(unit, order.to);
    } else if (order.kind === 'host-step') {
      validateHostStep(next, hostTopology, unit, order.to);
      const hostDestination = positions.get(order.to);
      if (['outer','inner'].includes(hostDestination?.zone) && !unit.singleEntity && next.units.filter(u => u.faction === 'host' && !u.singleEntity && u.locationId === order.to).length >= frontage) throw new Error(`Host wall-contact frontage limit (${frontage})`);
      const targetNode = hostTopology.nodes.find(n => n.id === order.to);
      if (targetNode?.capacity != null && next.units.filter(u => u.faction === 'host' && !u.singleEntity && u.locationId === order.to).length >= targetNode.capacity) throw new Error('Host passage capacity limit');
      if (targetNode?.kind === 'climbing' && assaultFrontageCount(next, order.to) >= frontage) throw new Error(`Host assault frontage limit (${frontage})`);
      transfer(unit, order.to);
    } else if (order.kind === 'host-assault-contact') {
      // Physical melee contact is NOT capture. A Host unit enters a wall position
      // from its matching climb node; ownership remains unchanged until claimed.
      if (unit.faction !== 'host') throw new Error('Assault contact requires Host unit');
      const position = positions.get(order.to);
      if (!position || position.zone !== 'outer' || position.controller !== 'coalition') throw new Error('Assault contact requires Coalition outer wall');
      const edge = hostTopology.edges.find(e => e.from === unit.locationId && e.to === order.to && e.kind === 'assault-entry');
      if (!edge) throw new Error('Assault contact requires matching climb access');
      if (!unit.singleEntity && next.units.filter(u => u.faction === 'host' && u.locationId === order.to && !u.singleEntity).length >= frontage) throw new Error(`Host wall-contact frontage limit (${frontage})`);
      transfer(unit, order.to);
      next.events.push({phase:next.phase,kind:'assault-contact',unitId:unit.id,positionId:order.to});
    } else if (order.kind === 'host-assault-inner') {
      if (unit.faction !== 'host') throw new Error('Inner assault requires Host unit');
      const position = positions.get(order.to);
      if (!position || position.zone !== 'inner' || position.controller !== 'coalition') throw new Error('Inner assault requires Coalition inner position');
      if (!hostTopology.edges.some(e => e.from === unit.locationId && e.to === order.to && e.kind === 'interior-assault-entry')) throw new Error('Inner assault requires physical passage');
      if (!reachableInteriorEntry(next, hostTopology, unit.locationId)) throw new Error('Inner assault requires captured, uncontested corridor');
      if (!unit.singleEntity && next.units.filter(u => u.faction === 'host' && !u.singleEntity && u.locationId === order.to).length >= frontage) throw new Error(`Host inner-contact frontage limit (${frontage})`);
      transfer(unit, order.to);
      next.events.push({phase:next.phase,kind:'interior-assault-contact',unitId:unit.id,positionId:order.to});
    } else if (order.kind === 'host-claim') {
      if (unit.faction !== 'host') throw new Error('Wrong faction');
      const position = positions.get(order.to);
      if (!position || position.controller !== 'coalition') throw new Error('Not a Coalition-held position');
      if (position.zone !== 'outer') throw new Error('Inner access unresolved');
      const edge = hostTopology.edges.find(e => e.from === unit.locationId && e.to === order.to && e.kind === 'assault-entry');
      if (!edge) throw new Error('Must reach climbing stage before claim');
      if (!canClaimPosition(next, order.to, 'host')) throw new Error('Defenders hold position; combat required');
      position.controller = 'host';
      transfer(unit, order.to);
      next.events.push({phase: next.phase, kind: 'position-claimed', positionId: order.to, faction: 'host'});
    } else if (order.kind === 'coalition-counterattack') {
      if (unit.faction !== 'coalition') throw new Error('Counterattack requires Coalition unit');
      const target = positions.get(order.to);
      if (!target || target.controller !== 'host') throw new Error('Counterattack requires Host-controlled position');
      // Entry must be physically adjacent to a Coalition-controlled position, or an existing contested foothold.
      const from = positions.get(unit.locationId);
      const local = from?.sectorId === target.sectorId && from?.controller === 'coalition';
      if (!local && unit.locationId !== order.to) throw new Error('No physical counterattack access');
      target.controlChallenge = true;
      target.contested = true; // legacy challenge alias for saved states
      next.events.push({phase: next.phase, kind: 'position-contested', positionId: target.id, faction: 'coalition'});
      // A counterattack is an engagement declaration, not an instant capture.
    } else if (order.kind === 'coalition-reclaim') {
      if (unit.faction !== 'coalition') throw new Error('Reclaim requires Coalition unit');
      const target = positions.get(order.to);
      if (!target || target.controller !== 'host' || !positionState(next,order.to).controlChallenge) throw new Error('Reclaim requires contested Host position');
      if (!canClaimPosition(next, order.to, 'coalition')) throw new Error('Host defenders hold position; combat required');
      const from = positions.get(unit.locationId);
      if (!(from?.sectorId === target.sectorId && from?.controller === 'coalition') && unit.locationId !== order.to) throw new Error('No physical reclaim access');
      transfer(unit, order.to);
      target.controller = 'coalition';
      target.controlChallenge = false;
      target.contested = false;
      next.events.push({phase: next.phase, kind: 'position-claimed', positionId: order.to, faction: 'coalition'});
    } else throw new Error(`Unsupported movement order ${order.kind}`);
    moved.add(unit.id);
  }
  return next;
}
