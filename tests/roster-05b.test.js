import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const load = (name) => JSON.parse(readFileSync(new URL(`../data/scenarios/hold-until-dawn/${name}.json`, import.meta.url), 'utf8'));
const d=load('deployment'), f=load('fortress'), h=load('host-topology'), c=load('fire-coverage');
const co=JSON.parse(readFileSync(new URL('../data/units/coalition.json',import.meta.url),'utf8'));
const ho=JSON.parse(readFileSync(new URL('../data/units/host.json',import.meta.url),'utf8'));
const count=(prefix)=>d.units.filter(u=>u.id.startsWith(prefix+'_')).length;
test('known roster counts and identifiers are unique',()=>{
 assert.equal(d.units.length,154);
 assert.equal(new Set(d.units.map(u=>u.id)).size,d.units.length);
 for(const [prefix,n] of Object.entries({CO_ARC:9,CO_MAA:6,CO_SPR:5,CO_BRZ:10,HO_SWM:30,HO_HAR:56,HO_WRA:30,HO_BKN:5,HO_CHV:1,HO_DRG:1,HO_SHA:1})) assert.equal(count(prefix),n,prefix);
 const types=new Set([...co.unitTypes,...ho.unitTypes].map(t=>t.id));
 for(const u of d.units){assert.ok(types.has(u.typeId),u.id);assert.equal(u.locationId,u.faction==='host'?'HN':'DB');}
});
test('all defensive positions begin Coalition-owned and empty',()=>{
 const defs=f.positions.filter(p=>p.countsForSectorCondition);
 assert.equal(defs.length,34);
 assert.deepEqual(new Set(d.initialControl.map(p=>p.positionId)),new Set(defs.map(p=>p.id)));
 assert.ok(d.initialControl.every(p=>p.controller==='coalition'));
 assert.ok(d.units.every(u=>!defs.some(p=>p.id===u.locationId)));
});
test('Host Nexus and approach/climb graph are well formed',()=>{
 assert.equal(f.positions.find(p=>p.id==='HN').zone,'host-reserve');
 const outer=f.positions.filter(p=>p.zone==='outer');assert.equal(outer.length,12);
 assert.equal(h.nodes.length,25);assert.equal(h.edges.length,36);
 const ids=new Set([...f.positions.map(p=>p.id),...h.nodes.map(n=>n.id)]);
 for(const e of h.edges){assert.ok(ids.has(e.from),e.from);assert.ok(ids.has(e.to),e.to);}
 for(const p of outer){assert.ok(h.edges.some(e=>e.from==='HN'&&e.to===p.id+'_APP'));assert.ok(h.edges.some(e=>e.from===p.id+'_APP'&&e.to===p.id+'_CLM'));assert.ok(h.edges.some(e=>e.from===p.id+'_CLM'&&e.to===p.id));}
});
test('shared exterior coverage includes all lanes once per sector',()=>{
 assert.equal(c.zones.length,4);
 for(const z of c.zones){assert.equal(z.targetNodeIds.length,2*z.firingPositionIds.length);assert.equal(z.contributionLimitPerUnitPerPhase,1);for(const id of z.targetNodeIds)assert.ok(h.nodes.some(n=>n.id===id));}
});
test('no scripted wave spawning remains',()=>{assert.ok(d.units.every(u=>u.locationId==='DB'||u.locationId==='HN'));});
