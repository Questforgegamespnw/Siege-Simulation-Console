import test from 'node:test';
import assert from 'node:assert/strict';
import {run} from '../experiments/multi-zone-breakthrough-07m.mjs';
const arrivals=r=>r.rows.flatMap(x=>x.events).filter(e=>['zone-arrival','zone-assault-contact'].includes(e.kind));
test('physical East Wall assault produces legal arrivals in three different macro zones',()=>{
 const r=run();
 const a=arrivals(r);
 for(const target of ['DSP_1','GHIP_1','DB'])assert.ok(a.some(e=>e.to===target),`missing ${target}`);
 for(const e of a){
  const departure=r.rows.flatMap(x=>x.events).find(d=>d.kind==='zone-departure'&&d.unitId===e.unitId&&d.to===e.to);
  assert.ok(departure,`arrival ${e.to} lacks departure`);
  assert.ok(e.phase>departure.phase,`arrival ${e.to} did not take a phase`);
 }
 assert.ok(r.rows.some(x=>x.events.some(e=>e.kind==='position-claimed'&&e.positionId==='EWOP_3')));
});
test('Coalition reinforcement can defend muster and prevent Host tunnel access',()=>{
 const r=run({reinforce:true});
 assert.ok(arrivals(r).some(e=>e.to==='EWMP'));
 assert.ok(!arrivals(r).some(e=>e.to==='DB'));
 assert.ok(arrivals(r).some(e=>e.to==='DSP_1'));
 assert.ok(arrivals(r).some(e=>e.to==='GHIP_1'));
});
