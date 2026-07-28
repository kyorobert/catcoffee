import assert from 'node:assert/strict';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {ROOM_CONFIG} from '../assets/js/config/room-config.js';
import {GridSystem} from '../assets/js/systems/GridSystem.js';
import {
  ROTATION_POLICY,
  ROTATION_TIE_BREAK,
  ORTHOGONAL_ROTATION_POLICY_BY_TYPE,
  ORTHOGONAL_CARDINAL_DIRECTION_MAP,
  CARDINAL_TO_TEXTURE_DIRECTION,
  getOrthogonalRotationPolicy,
  effectiveRotationForPolicy,
  nextRotationForPolicy,
  orthogonalRotationToCardinal,
  orthogonalRotationToTextureDirection,
  clockwiseEnvelopeOffset,
  minimumDisplacementCandidates,
  createRotationEditSession,
  advanceRotationEditSession,
  resolveOrthogonalRotationPlacement,
  resolveNextOrthogonalRotation
} from '../assets/js/core/orthogonal-furniture-rotation.js';

const grid = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG, {mode: 'ortho'});

assert.deepEqual(ORTHOGONAL_CARDINAL_DIRECTION_MAP,
  {0:'south',1:'west',2:'north',3:'east'});
assert.deepEqual(CARDINAL_TO_TEXTURE_DIRECTION,
  {south:'down-right',west:'down-left',north:'up-left',east:'up-right'});
assert.deepEqual([0,1,2,3].map(orthogonalRotationToCardinal),
  ['south','west','north','east']);
assert.deepEqual([0,1,2,3].map(orthogonalRotationToTextureDirection),
  ['down-right','down-left','up-left','up-right']);

const FIRST_BATCH_POLICIES = {
  counter:'cardinal4',
  coffeeMachine:'cardinal4',
  oven:'cardinal4',
  washStation:'cardinal4',
  dessert:'cardinal4',
  smartOrder:'cardinal4',
  pinkTableLong:'axis2',
  roundTable:'fixed',
  chair:'cardinal4',
  creamSofa:'cardinal4',
  doubleCatTree:'cardinal4',
  scratchPost:'fixed'
};
for (const [type,policy] of Object.entries(FIRST_BATCH_POLICIES)) {
  assert.equal(ORTHOGONAL_ROTATION_POLICY_BY_TYPE[type],policy,`${type} policy`);
  assert.equal(getOrthogonalRotationPolicy(type,FURNITURE_CONFIG[type]),policy);
}
assert.equal(nextRotationForPolicy(0,ROTATION_POLICY.FIXED),0);
assert.equal(nextRotationForPolicy(0,ROTATION_POLICY.AXIS2),1);
assert.equal(nextRotationForPolicy(1,ROTATION_POLICY.AXIS2),0);
assert.equal(effectiveRotationForPolicy(2,ROTATION_POLICY.AXIS2),0);
assert.equal(effectiveRotationForPolicy(3,ROTATION_POLICY.AXIS2),1);

function turn(type, start, count) {
  const definition=FURNITURE_CONFIG[type];
  const policy=getOrthogonalRotationPolicy(type,definition);
  let session=createRotationEditSession({
    type,definition,x:start.x,y:start.y,rotation:start.r,policy
  });
  let current={...start};
  const results=[];
  for(let index=0;index<count;index++){
    const resolved=resolveNextOrthogonalRotation({
      grid,type,definition,x:current.x,y:current.y,
      rotation:current.r,policy,editSession:session
    });
    results.push(resolved);
    current={
      x:resolved.resolvedX,
      y:resolved.resolvedY,
      r:resolved.resolvedRotation
    };
    session=advanceRotationEditSession(session,resolved);
  }
  return {current,results,session};
}

// fixed / axis2 / cardinal4 exact round-trips.
assert.deepEqual(turn('roundTable',{x:3,y:3,r:0},1).current,{x:3,y:3,r:0});
const tableCycle=turn('pinkTableLong',{x:3,y:3,r:0},2);
assert.deepEqual(tableCycle.current,{x:3,y:3,r:0});
assert.deepEqual(tableCycle.results.map(result=>result.movementDelta),
  [{x:1,y:0},{x:-1,y:0}]);
const chairCycle=turn('chair',{x:3,y:3,r:0},4);
assert.deepEqual(chairCycle.current,{x:3,y:3,r:0});
const counterCycle=turn('counter',{x:3,y:3,r:0},4);
assert.deepEqual(counterCycle.current,{x:3,y:3,r:0});
assert.deepEqual(turn('dessert',{x:3,y:3,r:0},4).current,{x:3,y:3,r:0});

// Every real non-square footprint receives a deterministic reversible cycle.
const nonSquare=Object.entries(FURNITURE_CONFIG)
  .filter(([,definition])=>definition.foot[0]!==definition.foot[1]);
assert.ok(nonSquare.length>0);
for(const [type,definition] of nonSquare){
  const policy=getOrthogonalRotationPolicy(type,definition);
  const steps=policy===ROTATION_POLICY.AXIS2?2:4;
  const cycle=turn(type,{x:3,y:3,r:0},steps);
  assert.deepEqual(cycle.current,{x:3,y:3,r:0},`${type} exact round-trip`);
  assert.ok(cycle.results.every(result=>Number.isInteger(result.resolvedX)
    &&Number.isInteger(result.resolvedY)),`${type} integer placement`);
  assert.ok(cycle.results.every(result=>result.footprintCells.length
    ===definition.foot[0]*definition.foot[1]),`${type} footprint area`);
}

// 1x1 / 2x1 / 1x2 / 2x2 / 3x2 coverage and shared candidate fields.
for(const type of ['chair','counter','doubleCatTree','catCastle','creamPlaidRug']){
  const definition=FURNITURE_CONFIG[type];
  const policy=getOrthogonalRotationPolicy(type,definition);
  const session=createRotationEditSession({
    type,definition,x:3,y:3,rotation:0,policy
  });
  const resolved=resolveNextOrthogonalRotation({
    grid,type,definition,x:3,y:3,rotation:0,policy,editSession:session
  });
  assert.deepEqual(resolved.footprintCells,
    grid.getFootprintCells(type,resolved.resolvedX,resolved.resolvedY,
      resolved.effectiveRotation));
  assert.deepEqual(resolved.footprintPolygon,
    grid.getFootprintPolygon(type,resolved.resolvedX,resolved.resolvedY,
      resolved.effectiveRotation));
  assert.deepEqual(resolved.visualPosition,
    grid.getAnchor(type,resolved.resolvedX,resolved.resolvedY,
      resolved.effectiveRotation));
  assert.deepEqual(resolved.visualPivot,resolved.visualPosition);
  assert.equal(resolved.validityInput.x,resolved.resolvedX);
  assert.equal(resolved.validityInput.y,resolved.resolvedY);
  assert.equal(resolved.validityInput.rotation,resolved.effectiveRotation);
  assert.equal(resolved.tieBreak,ROTATION_TIE_BREAK);
  assert.ok(resolved.signature.includes(policy));
}

// Nearest-distance enumeration + deterministic clockwise tie-break is independent
// of room position. A 2x1->1x2 turn has two equal nearest integer candidates;
// clockwise rotation chooses the right column of the 2x2 envelope.
for(const origin of [{x:0,y:0},{x:3,y:4},{x:8,y:6}]){
  const definition=FURNITURE_CONFIG.pinkTableLong;
  const session=createRotationEditSession({
    type:'pinkTableLong',definition,x:origin.x,y:origin.y,rotation:0,
    policy:ROTATION_POLICY.AXIS2
  });
  const candidates=minimumDisplacementCandidates({
    envelope:session.envelope,definition,rotation:1
  });
  assert.equal(candidates[0].distanceSquared,.25);
  assert.equal(candidates.filter(candidate=>candidate.distanceSquared===.25).length,2);
  assert.deepEqual(
    {x:candidates[0].x-origin.x,y:candidates[0].y-origin.y},
    {x:1,y:0}
  );
  assert.equal(candidates[0].preferred,true);
  assert.deepEqual(clockwiseEnvelopeOffset(definition,1),{x:1,y:0});
}

// Long-run no drift.
for(const type of ['pinkTableLong','counter','chair','dessert','doubleCatTree','creamPlaidRug']){
  const policy=getOrthogonalRotationPolicy(type,FURNITURE_CONFIG[type]);
  const cycleSize=policy===ROTATION_POLICY.AXIS2?2:4;
  const result=turn(type,{x:3,y:3,r:0},cycleSize*25);
  assert.deepEqual(result.current,{x:3,y:3,r:0},`${type} 25 cycles no drift`);
}

// Boundary output remains the formal minimum candidate; the resolver never
// searches inward for a farther valid cell.
const edgeSession=createRotationEditSession({
  type:'counter',definition:FURNITURE_CONFIG.counter,
  x:0,y:0,rotation:1,policy:ROTATION_POLICY.CARDINAL4
});
const edge=resolveNextOrthogonalRotation({
  grid,type:'counter',definition:FURNITURE_CONFIG.counter,
  x:0,y:0,rotation:1,policy:ROTATION_POLICY.CARDINAL4,
  editSession:edgeSession
});
assert.ok(edge.footprintCells.some(cell=>cell.x<0),
  'minimum envelope candidate remains out-of-bounds instead of auto-searching');

// Legacy axis2 r2/r3 load equivalence is display-only; source objects stay intact.
for(const legacyRotation of [2,3]){
  const saved={id:'legacy-axis',type:'pinkTableLong',x:4,y:4,r:legacyRotation};
  const before=JSON.stringify(saved);
  const formal=resolveOrthogonalRotationPlacement({
    grid,type:saved.type,definition:FURNITURE_CONFIG[saved.type],
    x:saved.x,y:saved.y,rotation:saved.r,policy:ROTATION_POLICY.AXIS2
  });
  assert.equal(formal.effectiveRotation,legacyRotation%2);
  assert.equal(JSON.stringify(saved),before,'legacy save object was not rewritten');
  const next=turn(saved.type,{x:saved.x,y:saved.y,r:saved.r},1).current;
  assert.ok([0,1].includes(next.r),'next successful rotate writes canonical axis direction');
}

console.log(
  `Orthogonal rotation envelope passed: fixed/axis2/cardinal4 policies, `+
  `${nonSquare.length} non-square footprints, deterministic minimum displacement, `+
  `legacy axis equivalence and drift-free round-trips.`
);
