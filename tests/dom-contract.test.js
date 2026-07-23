import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  DomContractError, REQUIRED_DOM_IDS, REQUIRED_NESTED_SELECTORS, resolveDomContract
} from '../assets/js/ui/dom-contract.js?v=0560a';

class FakeElement {
  constructor(id = '') { this.id = id; this.children = new Map(); }
  querySelector(selector) { return this.children.get(selector) || null; }
}

function createRoot({missingId = '', missingNested = ''} = {}) {
  const elements = new Map(REQUIRED_DOM_IDS.map(id => [id, new FakeElement(id)]));
  if (missingId) elements.delete(missingId);
  for (const [parentId, selectors] of Object.entries(REQUIRED_NESTED_SELECTORS)) {
    const parent = elements.get(parentId);
    if (!parent) continue;
    for (const selector of Object.values(selectors)) {
      if (`#${parentId} ${selector}` !== missingNested) parent.children.set(selector, new FakeElement());
    }
  }
  return {
    getElementById: id => elements.get(id) || null,
    querySelectorAll: () => []
  };
}

const complete = resolveDomContract(createRoot());
assert(Object.isFrozen(complete));
for (const id of REQUIRED_DOM_IDS) assert(complete[id], `missing resolved property ${id}`);

assert.throws(
  () => resolveDomContract(createRoot({missingId: 'careBtn'})),
  error => error instanceof DomContractError
    && error.missingIds.includes('careBtn')
    && error.message.includes('#careBtn')
    && !error.message.includes('Cannot read properties of null')
);

assert.throws(
  () => resolveDomContract(createRoot({missingNested: '#carePanel [data-care-content]'})),
  error => error instanceof DomContractError
    && error.missingSelectors.includes('#carePanel [data-care-content]')
);

const emptyRoot = {getElementById: () => null, querySelectorAll: () => []};
assert.throws(
  () => resolveDomContract(emptyRoot),
  error => error.missingIds.length === REQUIRED_DOM_IDS.length
);

const html = readFileSync('index.html', 'utf8');
for (const id of REQUIRED_DOM_IDS) assert.match(html, new RegExp(`id=["']${id}["']`), `index missing #${id}`);
for (const selectors of Object.values(REQUIRED_NESTED_SELECTORS)) {
  for (const selector of Object.values(selectors)) {
    const attribute = selector.slice(1, -1);
    assert(html.includes(attribute), `index missing ${selector}`);
  }
}

const uiBridge = readFileSync('assets/js/ui/UiBridge.js', 'utf8');
assert(!uiBridge.includes('getElementById('), 'UiBridge must use the resolved DOM contract');
assert(uiBridge.includes('AbortController'));
assert(uiBridge.includes('destroy()'));
for (const file of ['assets/js/ui/CarePanel.js', 'assets/js/ui/StorePanel.js', 'assets/js/systems/ToastManager.js']) {
  const source = readFileSync(file, 'utf8');
  assert(source.includes('instanceof Element'), `${file} must validate its Element`);
}

console.log(`DOM contract tests passed: ${REQUIRED_DOM_IDS.length} IDs and 13 nested selectors.`);
