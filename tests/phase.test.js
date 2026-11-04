import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveSiegePhase } from '../src/engine/phase-resolver.js';
test('unimplemented resolver fails loudly instead of pretending to simulate', () => {
  assert.throws(()=>resolveSiegePhase({},[],{}),/Not implemented/);
});
