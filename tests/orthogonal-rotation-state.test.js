import assert from 'node:assert/strict';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {ROOM_CONFIG} from '../assets/js/config/room-config.js';
import {GridSystem} from '../assets/js/systems/GridSystem.js';
import {OccupancySystem} from '../assets/js/systems/OccupancySystem.js';
import {PlacementSystem} from '../assets/js/systems/PlacementSystem.js';
import {
  ROTATION_POLICY,
  createRotationEditSession,
  resolveNextOrthogonalRotation
} from '../assets/js/core/orthogonal-furniture-rotation.js';

const grid = new GridSystem(ROOM_CONFIG, FURNITURE_CONFIG, {mode: 'ortho'});

function snapshotOccupancy(occupancy) {
  return JSON.stringify(
    [...occupancy.items.entries()]
      .map(([id, record]) => [id, record.layer, record.item, record.cells])
      .sort(([left], [right]) => left.localeCompare(right))
  );
}

function nextTableRotation(item) {
  const definition = FURNITURE_CONFIG[item.type];
  const editSession = createRotationEditSession({
    type: item.type,
    definition,
    x: item.x,
    y: item.y,
    rotation: item.r,
    policy: ROTATION_POLICY.AXIS2
  });
  return resolveNextOrthogonalRotation({
    grid,
    type: item.type,
    definition,
    x: item.x,
    y: item.y,
    rotation: item.r,
    policy: ROTATION_POLICY.AXIS2,
    editSession
  });
}

// An invalid rotate is a preview-only transaction: the formal item, serialized
// save payload and occupancy remain byte-for-byte unchanged.
{
  const item = {id: 'table', type: 'pinkTableLong', x: 3, y: 3, r: 0};
  const candidate = nextTableRotation(item);
  const blockerCell = candidate.footprintCells[0];
  const blocker = {
    id: 'blocker',
    type: 'chair',
    x: blockerCell.x,
    y: blockerCell.y,
    r: 0
  };
  const items = [item, blocker];
  const occupancy = new OccupancySystem(grid, FURNITURE_CONFIG);
  occupancy.build(items);
  const placement = new PlacementSystem(grid, occupancy, FURNITURE_CONFIG);
  const beforeItem = JSON.stringify(item);
  const beforeSave = JSON.stringify({items});
  const beforeOccupancy = snapshotOccupancy(occupancy);
  const validation = placement.validatePlacement({
    ...candidate.validityInput,
    movingItemId: item.id
  });

  assert.equal(validation.valid, false);
  assert.equal(validation.blockingReason, 'overlap');
  assert.equal(JSON.stringify(item), beforeItem);
  assert.equal(JSON.stringify({items}), beforeSave);
  assert.equal(snapshotOccupancy(occupancy), beforeOccupancy);
}

// A boundary failure is not silently searched inward.
{
  const item = {id: 'edge-counter', type: 'counter', x: 0, y: 0, r: 1};
  const definition = FURNITURE_CONFIG[item.type];
  const editSession = createRotationEditSession({
    type: item.type,
    definition,
    x: item.x,
    y: item.y,
    rotation: item.r,
    policy: ROTATION_POLICY.CARDINAL4
  });
  const candidate = resolveNextOrthogonalRotation({
    grid,
    type: item.type,
    definition,
    x: item.x,
    y: item.y,
    rotation: item.r,
    policy: ROTATION_POLICY.CARDINAL4,
    editSession
  });
  const occupancy = new OccupancySystem(grid, FURNITURE_CONFIG);
  occupancy.build([item]);
  const validation = new PlacementSystem(
    grid,
    occupancy,
    FURNITURE_CONFIG
  ).validatePlacement({...candidate.validityInput, movingItemId: item.id});

  assert.equal(validation.valid, false);
  assert.equal(validation.blockingReason, 'out-of-bounds');
  assert.ok(candidate.footprintCells.some(cell => cell.x < 0));
  assert.deepEqual(item, {id: 'edge-counter', type: 'counter', x: 0, y: 0, r: 1});
}

// A successful commit uses only the resolver result, updates occupancy once,
// survives a JSON reload, and Cancel can restore the exact edit-session origin.
{
  const original = {id: 'table', type: 'pinkTableLong', x: 3, y: 3, r: 0};
  const item = {...original};
  const occupancy = new OccupancySystem(grid, FURNITURE_CONFIG);
  occupancy.build([item]);
  const placement = new PlacementSystem(grid, occupancy, FURNITURE_CONFIG);
  const candidate = nextTableRotation(item);
  const validation = placement.validatePlacement({
    ...candidate.validityInput,
    movingItemId: item.id
  });

  assert.equal(validation.valid, true);
  occupancy.removeItem(item.id);
  Object.assign(item, {
    x: candidate.resolvedX,
    y: candidate.resolvedY,
    r: candidate.resolvedRotation
  });
  occupancy.addItem(item);
  assert.deepEqual(
    occupancy.items.get(item.id).cells,
    candidate.footprintCells
  );

  const reloaded = JSON.parse(JSON.stringify(item));
  assert.deepEqual(reloaded, item);
  Object.assign(item, original);
  occupancy.updateItem(item);
  assert.deepEqual(item, original);
  assert.deepEqual(occupancy.items.get(item.id).item, original);
}

console.log(
  'Orthogonal rotation state passed: invalid preview safety, no inward search, ' +
  'single-candidate commit, JSON reload and exact Cancel restoration.'
);
