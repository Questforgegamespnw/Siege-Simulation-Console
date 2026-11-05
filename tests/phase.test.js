import test from 'node:test';
import assert from 'node:assert/strict';
import {resolveSiegePhase} from '../src/engine/phase-resolver.js';
test('integrated phase rejects incomplete state or rules rather than silently simulating',()=>{
 assert.throws(()=>resolveSiegePhase({},[],{}),/requires valid state/);
});
