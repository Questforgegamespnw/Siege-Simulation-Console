import {canFireExterior} from '../lib/coverage.js';

/**
 * Unified sector combat: one opposed engagement per defensive sector, plus
 * unilateral exterior fire at approach/climb targets. Physical location gates
 * participation; it does not split the sector into per-position CP ratios.
 *
 * Interior Host participation requires actual occupancy of an interior
 * defensive position. This is a combat-only fixture capability, NOT a Host
 * movement/Harpy flight implementation (interior access remains deferred).
 */
export function discoverEngagements(state, {fortress, fireCoverage, innerSupportClearLanes = {}, suppressedSectors = [], engagementReach = 'frontage', blindVolley = false, archerFireAssignments = {}}) {
  const used=new Set();
  const melee=[]; const exterior=[];
  const suppressed=new Set(suppressedSectors);
  const claim=(u,kind)=>{if(used.has(u.id)) throw new Error(`Double-counted ${u.id} in ${kind}`);used.add(u.id);};
  for (const zone of fireCoverage.zones) {
    const sectorId=zone.sectorId;
    const outer=new Set(fortress.positions.filter(p=>p.sectorId===sectorId&&p.zone==='outer').map(p=>p.id));
    const inner=new Set(fortress.positions.filter(p=>p.sectorId===sectorId&&p.zone==='inner').map(p=>p.id));
    const sectorPositions=new Set([...outer,...inner]);
    const hostInSector=state.units.filter(u=>u.cohesion>0&&u.faction==='host'&&sectorPositions.has(u.locationId));
    const outerHost=hostInSector.filter(u=>outer.has(u.locationId));
    const innerHost=hostInSector.filter(u=>inner.has(u.locationId));
    const outerCoalition=state.units.filter(u=>u.cohesion>0&&u.faction==='coalition'&&outer.has(u.locationId));
    const innerCoalition=state.units.filter(u=>u.cohesion>0&&u.faction==='coalition'&&inner.has(u.locationId));
    // Contact is local for determining Archer mode; CP is aggregated sector-wide.
    const engaged=new Set(state.units.filter(u=>u.cohesion>0&&u.faction==='coalition'&&sectorPositions.has(u.locationId)&&hostInSector.some(h=>h.locationId===u.locationId)).map(u=>u.id));
    const exposed=state.units.filter(u=>u.cohesion>0&&u.faction==='host'&&zone.targetNodeIds.includes(u.locationId));
    const innerArchers=state.units.filter(u=>u.cohesion>0&&u.faction==='coalition'&&u.typeId==='archer'&&inner.has(u.locationId));
    const exteriorArchers=state.units.filter(u=>u.cohesion>0&&(
      (archerFireAssignments[u.id] !== 'blind-volley' && canFireExterior(u,zone,{engagedInMelee:engaged.has(u.id),clearLane:true})) ||
      (blindVolley && innerArchers.includes(u) && archerFireAssignments[u.id]==='blind-volley' && !engaged.has(u.id) && innerSupportClearLanes[sectorId]===true)
    ));
    const archerModes=Object.fromEntries(exteriorArchers.filter(u=>inner.has(u.locationId)).map(u=>[u.id,'blind-volley']));
    if (exteriorArchers.length&&exposed.length) {
      exteriorArchers.forEach(u=>claim(u,'exterior'));
      exposed.forEach(u=>claim(u,'exterior'));
      exterior.push({sectorId,archers:exteriorArchers.map(u=>u.id),targets:exposed.map(u=>u.id),suppressed:suppressed.has(sectorId),archerModes});
    }
    // A Host physically in the sector initiates one unified opposed battle.
    // Outer defenders join the shared defense; interior non-archers join only
    // when physically contacted. Inner archers join when contacted OR when
    // valid support lanes are explicitly provided for outer-wall contact.
    if (hostInSector.length) {
      const coalition=[]; const modes={};
      const include=(u,mode)=>{
        if(used.has(u.id))return;
        claim(u,'sector-combat');coalition.push(u.id);
        if(mode)modes[u.id]=mode;
      };
      for (const u of outerCoalition) {
        // Uncontacted outer defenders do not project melee CP across other positions.
        if (engagementReach === 'frontage' && !engaged.has(u.id)) continue;
        include(u,u.typeId==='archer'?'archer-melee':undefined);
      }
      for (const u of innerCoalition) {
        if(engaged.has(u.id)) include(u,u.typeId==='archer'?'archer-melee':undefined);
        else if(u.typeId==='archer'&&(engagementReach !== 'frontage' || outerHost.some(h=>outerCoalition.some(c=>c.locationId===h.locationId)))&&innerSupportClearLanes[sectorId]===true) include(u,'inner-support');
      }
      const contactedPositions=new Set([...outerCoalition,...innerCoalition].filter(u=>engaged.has(u.id)).map(u=>u.locationId));
      const fightingHost=engagementReach === 'frontage' ? hostInSector.filter(u=>contactedPositions.has(u.locationId)) : hostInSector;
      fightingHost.forEach(u=>{
        if (u.action === 'capture') modes[u.id] = 'capture';
        else if (u.action === 'climb') modes[u.id] = 'climbing';
        claim(u,'sector-combat');
      });
      // No opposed attrition without both a frontline attacker and an eligible defender.
      if (engagementReach !== 'frontage' || (fightingHost.length && coalition.length)) melee.push({id:`${sectorId}-sector-combat`,sectorId,coalition,host:fightingHost.map(u=>u.id),modes,
        supportImmune:true,suppressed:suppressed.has(sectorId),
        outerHostIds:outerHost.map(u=>u.id),interiorHostIds:innerHost.map(u=>u.id)});
    }
  }
  // Tunnel musters and Deep Barracks are physical defensive spaces, not safe logistics counters.
  // Fight only companies sharing the actual compartment; do not aggregate across tunnels.
  for(const p of fortress.positions.filter(p=>p.zone==='muster'||p.id==='DB')) {
    const present=state.units.filter(u=>u.cohesion>0&&u.locationId===p.id);
    const host=present.filter(u=>u.faction==='host'&&!used.has(u.id));
    const coalition=present.filter(u=>u.faction==='coalition'&&!used.has(u.id));
    if(!host.length||!coalition.length)continue;
    host.forEach(u=>claim(u,'tunnel-contact'));
    coalition.forEach(u=>claim(u,'tunnel-contact'));
    melee.push({id:`${p.id}-defense`,sectorId:p.sectorId,coalition:coalition.map(u=>u.id),host:host.map(u=>u.id),modes:{}});
  }
  return {melee,exterior};
}
