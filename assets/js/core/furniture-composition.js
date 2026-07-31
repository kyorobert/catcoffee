// ARCH-0577M1: pure Furniture Composition resolver.
//
// Third layer, strictly separate from logical placement and visual placement.
// It decides whether a subject furniture visually connects to a logically
// adjacent, direction-compatible neighbour, and by how much its SPRITE should be
// pulled (never its logical cell). It reads only the snapshots the caller passes
// in — no engine, DOM, browser-global, Camera, Occupancy singleton, Save, or per-frame
// object. Same input → same output. It never mutates inputs and never writes x/y/r.

const SIDES = Object.freeze(['north', 'east', 'south', 'west']); // fixed tie-break order
const OPPOSITE = Object.freeze({north: 'south', south: 'north', west: 'east', east: 'west'});
const NORMAL = Object.freeze({
  north: {x: 0, y: -1}, south: {x: 0, y: 1}, west: {x: -1, y: 0}, east: {x: 1, y: 0}
});
// Which contactInset edge faces a neighbour located on the given side.
const INSET_FOR_SIDE = Object.freeze({north: 'top', south: 'bottom', west: 'left', east: 'right'});

const ZERO = Object.freeze({
  isConnected: false, connectionSide: null, matchedSocket: null, targetItemId: null,
  visualOffsetX: 0, visualOffsetY: 0, overlapX: 0, overlapY: 0, depthBias: 0,
  requestedPull: 0, appliedPull: 0, maxAllowedPull: 0,
  isExcessivePull: false, requiresAssetReauthoring: false, finalVisualGap: 0,
  signature: 'none', rejectionReason: 'no-connection'
});

function zero(reason) {
  return {...ZERO, rejectionReason: reason};
}

function num(value, fallback = 0) {
  return Number.isFinite(Number(value)) ? Number(value) : fallback;
}

function insetsFor(snapshot) {
  const insets = snapshot?.profile?.contactInsets;
  // Seat `direction` is a cardinal facing; table insets are keyed by texture
  // direction. Prefer an explicit textureDirection, then cardinal, then the
  // authored default view.
  const byDir = insets?.[snapshot?.textureDirection]
    || insets?.[snapshot?.direction]
    || insets?.['down-right']
    || {};
  return {
    left: num(byDir.left), right: num(byDir.right), top: num(byDir.top), bottom: num(byDir.bottom)
  };
}

// world contact edge of a snapshot on one side (cell bounds + inset + any applied
// composition offset already granted to a stationary neighbour).
function contactEdge(snapshot, side) {
  const b = snapshot.cellBounds;
  const inset = insetsFor(snapshot)[INSET_FOR_SIDE[side]];
  const off = snapshot.appliedOffset || {x: 0, y: 0};
  switch (side) {
    case 'north': return b.y0 + inset + num(off.y);
    case 'south': return b.y1 - inset + num(off.y);
    case 'west': return b.x0 + inset + num(off.x);
    case 'east': return b.x1 - inset + num(off.x);
    default: return 0;
  }
}

// true logical edge-adjacency: some subject cell has a neighbour cell directly on `side`.
function logicallyAdjacent(subject, neighbour, side) {
  const set = new Set(neighbour.cells.map(c => `${c.x},${c.y}`));
  const d = NORMAL[side];
  return subject.cells.some(c => set.has(`${c.x + d.x},${c.y + d.y}`));
}

function compatible(subjectProfile, neighbourProfile, side) {
  const socket = subjectProfile?.sockets?.[side];
  if (!socket) return false;
  const allowed = socket.allowedRoles || subjectProfile.compatibleRoles || [];
  return allowed.includes(neighbourProfile?.role);
}

// Seats connect on the side they FACE (cardinal direction). Service units connect
// toward their approved band predecessor on whichever side it is adjacent.
function preferredSides(subject) {
  const role = subject.profile?.role;
  if (role === 'seat') return subject.direction && SIDES.includes(subject.direction)
    ? [subject.direction] : [];
  if (role === 'service') return subject.profile.bandPredecessor ? [...SIDES] : [];
  return [];
}

// A service unit may ONLY bind its approved predecessor (counter<-coffee<-wash<-
// dessert), never skip a removed middle unit, never bind an arbitrary nearest
// service. Seats accept any role-compatible table on the faced side.
function acceptsNeighbour(subject, neighbour, side) {
  if (!compatible(subject.profile, neighbour.profile, side)) return false;
  if (subject.profile.role === 'service') {
    return neighbour.type === subject.profile.bandPredecessor;
  }
  return true;
}

export function resolveFurnitureComposition({subject, neighbours = []} = {}) {
  if (!subject || !subject.profile || subject.profile.role === 'none') return zero('no-profile');
  if (!Array.isArray(subject.cells) || !subject.cellBounds) return zero('no-geometry');
  if (subject.profile.bandAnchor) return zero('band-anchor-stationary');

  const sides = preferredSides(subject);
  const candidates = [];
  for (const side of sides) {
    for (const nb of neighbours) {
      if (!nb?.profile || nb.id === subject.id) continue;
      if (!acceptsNeighbour(subject, nb, side)) continue;
      if (!logicallyAdjacent(subject, nb, side)) continue;
      const insetSide = INSET_FOR_SIDE[side];
      const gap = insetsFor(subject)[insetSide] + insetsFor(nb)[INSET_FOR_SIDE[OPPOSITE[side]]]
        - directionalOffsetDelta(subject, nb, side);
      candidates.push({side, nb, gap});
    }
  }
  if (!candidates.length) return zero('no-adjacent-compatible-neighbour');

  // tie-break: smallest gap, then fixed side order, then neighbour id.
  candidates.sort((a, b) =>
    a.gap - b.gap
    || SIDES.indexOf(a.side) - SIDES.indexOf(b.side)
    || String(a.nb.id).localeCompare(String(b.nb.id)));
  const {side, nb, gap} = candidates[0];

  const socket = subject.profile.sockets[side];
  const targetGap = num(socket?.targetGap, num(subject.profile.visualPull?.preferred, 0));
  const maxOverlap = num(socket?.maxOverlap, num(subject.profile.overlap?.max, 0));
  const maxAllowedPull = num(subject.profile.visualPull?.max, Infinity);
  // ARCH-0577M1 §7: the pull needed to reach targetGap. If it exceeds the profile
  // production cap (e.g. an under-drawn vertical table needing ~117px), we apply
  // ONLY the safe cap and flag requiresAssetReauthoring — never a near-full-cell
  // displacement dressed up as a fix. That case belongs to ART-0577M2.
  const requestedPull = Math.max(0, gap - targetGap);
  const isExcessivePull = requestedPull > maxAllowedPull;
  const appliedPull = Math.max(0, Math.min(requestedPull, gap + maxOverlap, maxAllowedPull));
  const requiresAssetReauthoring = isExcessivePull;
  const n = NORMAL[side];
  const visualOffsetX = Math.round(n.x * appliedPull * 100) / 100;
  const visualOffsetY = Math.round(n.y * appliedPull * 100) / 100;

  // depthBias: a seat is placed behind/in front of the table by the table's side.
  const tableSide = OPPOSITE[side]; // which side of the neighbour the subject sits on
  const depthBias = subject.profile.role === 'seat'
    ? num(nb.profile.depthBiasBySide?.[tableSide])
    : num(subject.profile.depthBiasBySide?.[side]);

  const finalGap = gap - appliedPull;
  const overlap = finalGap < 0 ? -finalGap : 0;
  return {
    isConnected: true,
    connectionSide: side,
    matchedSocket: side,
    targetItemId: nb.id,
    visualOffsetX, visualOffsetY,
    overlapX: n.x !== 0 ? Math.round(overlap * 100) / 100 : 0,
    overlapY: n.y !== 0 ? Math.round(overlap * 100) / 100 : 0,
    depthBias,
    requestedPull: Math.round(requestedPull * 100) / 100,
    appliedPull: Math.round(appliedPull * 100) / 100,
    maxAllowedPull,
    isExcessivePull,
    requiresAssetReauthoring,
    finalVisualGap: Math.round(finalGap * 100) / 100,
    signature: `${subject.type}:${subject.direction}:${side}:${nb.id}:${visualOffsetX}:${visualOffsetY}:${depthBias}`,
    rejectionReason: null
  };
}

// If a stationary neighbour already received a composition offset (e.g. an earlier
// service unit in the band), fold that into the measured gap so a chain converges.
function directionalOffsetDelta(subject, neighbour, side) {
  const off = neighbour.appliedOffset || {x: 0, y: 0};
  const n = NORMAL[side];
  // neighbour moving toward the subject (opposite of subject's pull normal) reduces the gap.
  return -(n.x * num(off.x) + n.y * num(off.y));
}

// Batch helper: resolve a set of movers against a stationary snapshot list,
// processing in a deterministic order so band chains fold prior offsets in.
export function resolveCompositionBatch(subjects, allSnapshots) {
  const applied = new Map();
  const ordered = [...subjects].sort((a, b) => String(a.id).localeCompare(String(b.id)));
  const results = new Map();
  for (const subject of ordered) {
    const neighbours = allSnapshots
      .filter(s => s.id !== subject.id)
      .map(s => ({...s, appliedOffset: applied.get(s.id) || {x: 0, y: 0}}));
    const result = resolveFurnitureComposition({subject, neighbours});
    results.set(subject.id, result);
    if (result.isConnected) applied.set(subject.id, {x: result.visualOffsetX, y: result.visualOffsetY});
  }
  return results;
}
