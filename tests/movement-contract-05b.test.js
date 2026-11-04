import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const r=JSON.parse(readFileSync(new URL('../data/rules/movement.json',import.meta.url),'utf8'));
test('Host reinforcements require uncontested continuous control',()=>{assert.equal(r.hostReinforcement.requiresContiguousHostControlledUncontestedPath,true);assert.equal(r.hostReinforcement.contestedDestinationAllowed,false);assert.equal(r.hostReinforcement.stageAtNearestUncontestedRearNode,true);});
test('empty position ownership persists until physical claim',()=>{assert.equal(r.emptyPositionCapture.ownershipPersistsWithoutOccupants,true);assert.equal(r.emptyPositionCapture.unoccupiedPositionDefensiveCP,0);assert.equal(r.emptyPositionCapture.approachOrClimbNeverClaims,true);});
test('ranged contribution cannot duplicate across lanes',()=>{assert.equal(r.rangedCoverage.outerArcherSectorWide,true);assert.equal(r.rangedCoverage.contributionsPerUnitPerPhase,1);});
