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
export function discoverEngagements(state, {fortress, fireCoverage, innerSupportClearLanes = {}, suppressedSectors = []}) {
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
    const exteriorArchers=state.units.filter(u=>u.cohesion>0&&canFireExterior(u,zone,{engagedInMelee:engaged.has(u.id),clearLane:true}));
    if (exteriorArchers.length&&exposed.length) {
      exteriorArchers.forEach(u=>claim(u,'exterior'));
      exposed.forEach(u=>claim(u,'exterior'));
      exterior.push({sectorId,archers:exteriorArchers.map(u=>u.id),targets:exposed.map(u=>u.id),suppressed:suppressed.has(sectorId)});
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
      for (const u of outerCoalition) include(u,u.typeId==='archer'?(engaged.has(u.id)?'archer-melee':'ranged'):undefined);
      for (const u of innerCoalition) {
        if(engaged.has(u.id)) include(u,u.typeId==='archer'?'archer-melee':undefined);
        else if(u.typeId==='archer'&&outerHost.length&&innerSupportClearLanes[sectorId]===true) include(u,'inner-support');
      }
      hostInSector.forEach(u=>claim(u,'sector-combat'));
      melee.push({id:`${sectorId}-sector-combat`,sectorId,coalition,host:hostInSector.map(u=>u.id),modes,
        supportImmune:true,suppressed:suppressed.has(sectorId),
        outerHostIds:outerHost.map(u=>u.id),interiorHostIds:innerHost.map(u=>u.id)});
    }
  }
  return {melee,exterior};
}
