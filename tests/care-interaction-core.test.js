import assert from 'node:assert/strict';
import {FURNITURE_CONFIG} from '../assets/js/config/furniture-config.js';
import {CAT_CONFIG} from '../assets/js/config/cat-config.js';
import {SaveAdapter} from '../assets/js/systems/SaveAdapter.js';
import {
  getCareActionDefinition, validateCareAction, calculateCareResult, selectCareReaction,
  createCareSession, prepareCareSession, commitCareSession, cancelCareSession
} from '../assets/js/core/care-interaction-core.js';

assert.equal(globalThis.Phaser, undefined, 'care rules run without Phaser');
const baseState = {
  energy: 3, tasks: {care: 0},
  catStats: {coal: {satiety: 2, mood: 88, clean: 92, bond: 12}}
};
assert.equal(getCareActionDefinition('feed').energyCost, 1);
assert.equal(calculateCareResult(baseState.catStats.coal, 'feed').after.satiety, 16);
assert.equal(calculateCareResult(baseState.catStats.coal, 'groom').after.clean, 100, 'stats clamp to 100');
const play = calculateCareResult(baseState.catStats.coal, 'play');
assert.equal(play.after.mood, 100);
assert.equal(play.after.satiety, 0, 'play never lowers satiety below zero');
assert.equal(validateCareAction({...baseState, energy: 0}, 'coal', 'feed').reason, 'energy-empty');
assert.equal(validateCareAction(baseState, 'missing', 'feed').reason, 'unknown-cat');
assert.equal(validateCareAction(baseState, 'coal', 'missing').reason, 'unknown-mode');
assert.ok(selectCareReaction(CAT_CONFIG.coal, baseState.catStats.coal, 'groom', 0).length > 0);

const created = createCareSession({sessionId: 'care-test', catId: 'coal', mode: 'groom', startedAt: 100});
const prepared = prepareCareSession(created, baseState, CAT_CONFIG.coal, 0);
assert.equal(prepared.validation.valid, true);
assert.equal(prepared.session.phase, 'perform');
const committed = commitCareSession(prepared.session, baseState, 500);
assert.equal(committed.applied, true);
assert.equal(committed.state.energy, 2);
assert.equal(committed.state.catStats.coal.clean, 100);
assert.equal(committed.state.catStats.coal.careCount, 1);
assert.equal(committed.state.tasks.care, 1);
const repeated = commitCareSession(committed.session, committed.state, 700);
assert.equal(repeated.applied, false, 'a session result can only be applied once');
assert.equal(repeated.state.energy, 2, 'repeat completion does not deduct energy');
const cancelled = cancelCareSession(prepared.session, 'test-cancel');
assert.equal(cancelled.phase, 'cancelled');
assert.equal(commitCareSession(cancelled, baseState, 500).applied, false, 'cancelled animation applies no result');

class MemoryStorage {
  constructor(values = {}) { this.values = new Map(Object.entries(values)); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
}
const legacyRaw = JSON.stringify({energy: 4, catStats: {bean: {satiety: 40, mood: 50, clean: 60, bond: 7}}});
const storage = new MemoryStorage({catCafeDecorV049: legacyRaw});
const adapter = new SaveAdapter(FURNITURE_CONFIG, storage);
assert.equal(adapter.state.catStats.bean.satiety, 40);
assert.equal(adapter.state.catStats.bean.lastCareAt, 0);
assert.equal(adapter.state.catStats.bean.careCount, 0);
assert.equal(adapter.state.catStats.bean.lastCareMode, null);
assert.equal(storage.getItem('catCafeDecorV049'), legacyRaw, 'legacy key remains unchanged');

console.log('Care interaction core passed: validation, capped stat changes, cancellation, idempotent commit and legacy defaults.');
