// Pure care rules. No engine, browser UI, global runtime or storage APIs belong here.
export const CARE_ACTIONS = Object.freeze({
  feed: Object.freeze({
    id: 'feed', name: '餵食', energyCost: 1, duration: 2100,
    changes: Object.freeze({satiety: 14, mood: 3, bond: 2}),
    animation: 'serve', primaryStat: 'satiety', icon: 'bowl'
  }),
  groom: Object.freeze({
    id: 'groom', name: '梳毛', energyCost: 1, duration: 2000,
    changes: Object.freeze({clean: 14, mood: 4, bond: 2}),
    animation: 'happy', primaryStat: 'clean', icon: 'brush'
  }),
  play: Object.freeze({
    id: 'play', name: '玩耍', energyCost: 1, duration: 2500,
    changes: Object.freeze({mood: 14, satiety: -2, bond: 3}),
    animation: 'happy', primaryStat: 'mood', icon: 'toy'
  })
});

const STAT_KEYS = Object.freeze(['satiety', 'mood', 'clean', 'bond']);
const clamp = (value, minimum = 0, maximum = 100) => Math.max(minimum, Math.min(maximum, Number(value) || 0));
const cloneStats = stats => Object.fromEntries(STAT_KEYS.map(key => [key, clamp(stats?.[key])]));

export function getCareActionDefinition(mode) {
  return CARE_ACTIONS[mode] || null;
}

export function validateCareAction(state, catId, mode) {
  const action = getCareActionDefinition(mode);
  if (!action) return {valid: false, reason: 'unknown-mode', message: '找不到這個照顧方式'};
  if (!catId || !state?.catStats?.[catId]) return {valid: false, reason: 'unknown-cat', message: '找不到這隻貓咪'};
  if ((Number(state.energy) || 0) < action.energyCost) return {valid: false, reason: 'energy-empty', message: '體力不足，先休息一下吧'};
  return {valid: true, reason: null, message: null, action};
}

export function calculateCareResult(stats, mode) {
  const action = getCareActionDefinition(mode);
  if (!action) throw new Error(`Unknown care mode: ${mode}`);
  const before = cloneStats(stats);
  const after = {...before};
  for (const [key, amount] of Object.entries(action.changes)) after[key] = clamp(before[key] + amount);
  const changes = Object.fromEntries(STAT_KEYS.map(key => [key, after[key] - before[key]]));
  return {before, after, changes};
}

const REACTIONS = Object.freeze({
  feed: Object.freeze(['好香！', '吃飽最幸福！', '今天也很好吃！']),
  groom: Object.freeze(['呼嚕呼嚕……', '毛毛變柔順了！', '再梳一下嘛。']),
  play: Object.freeze(['再一次！', '抓到你了！', '還想再玩！'])
});

export function selectCareReaction(catProfile, stats, mode, randomValue = 0.5) {
  const lines = catProfile?.careReactions?.[mode] || REACTIONS[mode] || ['好開心！'];
  const index = Math.min(lines.length - 1, Math.floor(clamp(randomValue, 0, 0.999999) * lines.length));
  return lines[index];
}

export function createCareSession({sessionId, catId, mode, startedAt = 0}) {
  return {active: true, sessionId, catId, mode, phase: 'prepare', startedAt, result: null, committed: false};
}

export function prepareCareSession(session, state, catProfile, randomValue = 0.5) {
  const validation = validateCareAction(state, session.catId, session.mode);
  if (!validation.valid) return {session, validation};
  const calculation = calculateCareResult(state.catStats[session.catId], session.mode);
  const result = {
    action: validation.action,
    ...calculation,
    energyBefore: Number(state.energy) || 0,
    energyAfter: Math.max(0, (Number(state.energy) || 0) - validation.action.energyCost),
    reaction: selectCareReaction(catProfile, calculation.before, session.mode, randomValue)
  };
  return {session: {...session, phase: 'perform', result}, validation};
}

export function commitCareSession(session, state, completedAt = 0) {
  if (!session?.active || session.phase !== 'perform' || session.committed || !session.result) {
    return {session, state, applied: false};
  }
  const previousStats = state.catStats?.[session.catId];
  if (!previousStats) return {session, state, applied: false};
  const careMeta = {
    lastCareAt: completedAt,
    lastCareMode: session.mode,
    careCount: (Number(previousStats.careCount) || 0) + 1
  };
  const nextStats = {...previousStats, ...session.result.after, ...careMeta};
  const nextState = {
    ...state,
    energy: session.result.energyAfter,
    catStats: {...state.catStats, [session.catId]: nextStats},
    tasks: {...state.tasks, care: (Number(state.tasks?.care) || 0) + 1}
  };
  return {
    session: {...session, phase: 'result', committed: true, completedAt},
    state: nextState,
    applied: true
  };
}

export function cancelCareSession(session, reason = 'cancelled') {
  if (!session || session.committed) return session;
  return {...session, active: false, phase: 'cancelled', cancelReason: reason};
}
