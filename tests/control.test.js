import test from 'node:test';
import assert from 'node:assert/strict';
import { isBroken } from '../src/lib/control.js';
test('25% is broken but 25.01% is not', () => {
  assert.equal(isBroken({cohesion:25}),true);
  assert.equal(isBroken({cohesion:25.01}),false);
  assert.equal(isBroken({cohesion:0}),true);
});
