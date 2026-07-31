// ARCH-0577M1 §4: the single shared Composition snapshot builder.
//
// Placed entity, drag ghost and rotation preview MUST all build their resolver
// snapshots here — never with their own ad-hoc geometry or profile lookups. It is
// engine-agnostic (uses only the projection-geometry grid facade), reads no DOM /
// browser globals or storage, mutates no Occupancy or Save, and is fully Node-testable.
// Furniture->profile mapping stays entirely in the composition profile config.

import {getFurnitureCompositionProfile} from '../config/furniture-composition-profiles.js?v=0577n';
import {
  orthogonalRotationToCardinal,
  orthogonalRotationToTextureDirection
} from './orthogonal-furniture-rotation.js?v=0577n';
import {resolveFurnitureComposition, resolveCompositionBatch} from './furniture-composition.js?v=0577n';

function polygonBounds(polygon) {
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const p of polygon || []) {
    x0 = Math.min(x0, p.x); y0 = Math.min(y0, p.y);
    x1 = Math.max(x1, p.x); y1 = Math.max(y1, p.y);
  }
  return {x0, y0, x1, y1};
}

// Build one resolver snapshot from logical geometry. cardinal/texture direction may
// be supplied (e.g. from the entity's resolved placement) or derived from rotation.
export function buildCompositionSnapshot({
  grid, id, type, x, y, rotation = 0, cardinalDirection = null, textureDirection = null
}) {
  const profile = getFurnitureCompositionProfile(type);
  if (!profile || !grid) return null;
  const cells = grid.getFootprintCells(type, x, y, rotation);
  const polygon = grid.getFootprintPolygon(type, x, y, rotation);
  return {
    id, type,
    direction: cardinalDirection || orthogonalRotationToCardinal(rotation),
    textureDirection: textureDirection || orthogonalRotationToTextureDirection(rotation),
    cells,
    cellBounds: polygonBounds(polygon),
    profile
  };
}

export function buildCompositionSnapshotSet(grid, items) {
  return items.map(it => buildCompositionSnapshot({grid, ...it})).filter(Boolean);
}

// Resolve composition for the placed furniture set. Returns Map<id, result> for the
// mover roles (seats + service); tables/anchors never move.
export function resolvePlacedComposition(grid, items) {
  const snapshots = buildCompositionSnapshotSet(grid, items);
  const movers = snapshots.filter(s =>
    !s.profile.bandAnchor && (s.profile.role === 'seat' || s.profile.role === 'service'));
  if (!movers.length) return new Map();
  return resolveCompositionBatch(movers, snapshots);
}

// Resolve composition for a single drag/preview candidate against the current
// stationary layout. The candidate's OWN current entity is excluded from the
// neighbour set (by id) so its old footprint never blocks its own connection.
export function resolveCandidateComposition({grid, candidate, stationaryItems}) {
  const subject = buildCompositionSnapshot({grid, ...candidate});
  if (!subject) return null;
  const neighbours = buildCompositionSnapshotSet(
    grid, stationaryItems.filter(it => it.id !== candidate.id)
  );
  return resolveFurnitureComposition({subject, neighbours});
}
