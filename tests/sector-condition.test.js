import test from 'node:test';
import assert from 'node:assert/strict';
import { getEastWestSectorCondition } from '../src/lib/sector-condition.js';
const mapping = { 8:6,7:5,6:4,5:3,4:2,3:2,2:1,1:1,0:0 };
const fixture = () => [...Array.from({ length: 3 }, (_, i) => ({ id:`o${i}`,zone:'outer',controller:'coalition' })),
  ...Array.from({ length: 5 }, (_, i) => ({ id:`i${i}`,zone:'inner',controller:'coalition' }))];
test('all eight positions held means Secure (6)', () => {
  assert.deepEqual(getEastWestSectorCondition(fixture(),mapping),{held:8,outerHeld:3,innerHeld:5,condition:6});
});
test('five held means Faltering (3), with topology retained', () => {
  const positions=fixture(); for (let i=0;i<3;i++) positions[i].controller='host';
  assert.deepEqual(getEastWestSectorCondition(positions,mapping),{held:5,outerHeld:0,innerHeld:5,condition:3});
});
test('none held means Overrun (0)', () => {
  const positions=fixture().map(p=>({...p,controller:'host'}));
  assert.equal(getEastWestSectorCondition(positions,mapping).condition,0);
});
