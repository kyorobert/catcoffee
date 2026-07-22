export const CAT_STATE = Object.freeze({
  IDLE: 'idle',
  WALKING: 'walking',
  SITTING: 'sitting',
  SLEEPING: 'sleeping',
  SERVING: 'serving',
  PAUSED: 'paused'
});

export function randomDelay(random = Math.random, minimum = 2000, maximum = 6000) {
  return Math.round(minimum + Math.max(0, Math.min(1, random())) * (maximum - minimum));
}

export function createCatBehaviorState(catData, {now = 0, random = Math.random} = {}) {
  return {
    id: catData.id, gridX: Number(catData.gridX), gridY: Number(catData.gridY),
    state: CAT_STATE.IDLE, previousState: CAT_STATE.IDLE,
    targetGridX: null, targetGridY: null, path: [], pathIndex: 0,
    nextDecisionAt: now + randomDelay(random), needsRepath: false, blockedSince: null
  };
}

export function shouldLeaveIdle(state, now) {
  return state.state !== CAT_STATE.PAUSED && state.state !== CAT_STATE.WALKING && now >= state.nextDecisionAt;
}

export function chooseCatTarget({origin, candidates, isWalkable, reservedCells = new Set(), random = Math.random, minDistance = 2, maxDistance = 6}) {
  const valid = candidates.filter(cell => {
    const distance = Math.abs(cell.x - origin.x) + Math.abs(cell.y - origin.y);
    return distance >= minDistance && distance <= maxDistance && isWalkable(cell.x, cell.y) && !reservedCells.has(`${cell.x},${cell.y}`);
  });
  if (!valid.length) return null;
  const index = Math.min(valid.length - 1, Math.floor(Math.max(0, Math.min(0.999999, random())) * valid.length));
  return {...valid[index]};
}

export function beginWalking(state, target, path) {
  return {...state, state: CAT_STATE.WALKING, targetGridX: target.x, targetGridY: target.y, path: path.map(cell => ({...cell})), pathIndex: 1, needsRepath: false, blockedSince: null};
}

export function finishPath(state, now, random = Math.random) {
  const roll = random();
  const nextState = roll < 0.12 ? CAT_STATE.SLEEPING : roll < 0.32 ? CAT_STATE.SITTING : CAT_STATE.IDLE;
  const restMinimum = nextState === CAT_STATE.SLEEPING ? 3500 : 2000;
  const restMaximum = nextState === CAT_STATE.SLEEPING ? 7500 : 6000;
  return {...state, state: nextState, targetGridX: null, targetGridY: null, path: [], pathIndex: 0, nextDecisionAt: now + randomDelay(random, restMinimum, restMaximum), needsRepath: false, blockedSince: null};
}

export function pauseBehavior(state) {
  if (state.state === CAT_STATE.PAUSED) return state;
  return {...state, previousState: state.state, state: CAT_STATE.PAUSED};
}

export function resumeBehavior(state, now, random = Math.random) {
  if (state.state !== CAT_STATE.PAUSED) return state;
  const resumeState = state.previousState === CAT_STATE.WALKING && state.path.length ? CAT_STATE.WALKING : CAT_STATE.IDLE;
  return {...state, state: resumeState, previousState: CAT_STATE.IDLE, nextDecisionAt: resumeState === CAT_STATE.IDLE ? now + randomDelay(random) : state.nextDecisionAt};
}

export function markLayoutChanged(state) {
  return {...state, needsRepath: state.state === CAT_STATE.WALKING || state.previousState === CAT_STATE.WALKING};
}
