'use strict';

// Event-driven VM harness for the two-step Admin wizard; no browser dependency.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const crypto = require('node:crypto');
const core = require('./mis-access-core.js');
const { KEY, seed, createStore } = require('./mis-access-store.js');

const admin = { id: 'admin', role: 'ADMIN', status: 'Active' };
function harness(configure) {
  const nodes = new Map(), listeners = new Map(), windowListeners = new Map();
  const initialState = seed();
  if (configure) configure(initialState);
  const values = new Map([[KEY, JSON.stringify(initialState)]]);
  let currentActor = admin, storageFailure = false;
  const storage = { getItem: key => values.get(key) ?? null, setItem: (key, value) => { if (storageFailure) throw new Error('quota'); values.set(key, value); } };
  const store = createStore(storage);
  const attrs = text => Object.fromEntries([...text.matchAll(/([^\s=]+)(?:="([^"]*)")?/g)].map(match => [match[1], match[2] ?? true]));
  const element = () => {
    const classes = new Set();
    return { textContent: '', hidden: false, dataset: {}, classList: { add: name => classes.add(name), remove: name => classes.delete(name), contains: name => classes.has(name), toggle(name, force) { const include = force ?? !classes.has(name); if (include) classes.add(name); else classes.delete(name); return include; } }, setAttribute() {}, removeAttribute() {}, focus() {}, querySelector: () => null, querySelectorAll: () => [] };
  };
  const dataset = attributes => Object.fromEntries(Object.entries(attributes).filter(([name]) => name.startsWith('data-')).map(([name, value]) => [name.slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase()), value]));
  const matchesAttributes = (attributes, selector, field) => {
    if (selector.includes(':checked') && !field?.checked) return false;
    const selectors = [...selector.matchAll(/\[([^\]=]+)(?:="([^"]*)")?\]/g)];
    if (!selectors.length) return false;
    return selectors.every(([, name, value]) => Object.hasOwn(attributes, name) && (value === undefined || String(attributes[name]) === value));
  };
  function form(html) {
    const result = element();
    result.fields = [];
    result.html = html;
    for (const match of html.matchAll(/<input\b([^>]*)>|<select\b([^>]*)>([\s\S]*?)<\/select>/g)) {
      const attributes = attrs(match[1] ?? match[2]);
      const type = match[2] ? 'select' : attributes.type || 'text';
      const field = { ...element(), name: attributes.name, type, value: attributes.value ?? (type === 'checkbox' ? 'on' : ''), disabled: !!attributes.disabled, required: !!attributes.required, checked: !!attributes.checked, dataset: dataset(attributes), position: match.index, attributes };
      if (match[2]) {
        const options = [...match[3].matchAll(/<option\b([^>]*)>/g)].map(option => attrs(option[1]));
        field.value = (options.find(option => option.selected) || options[0])?.value ?? '';
        field.options = options.map(option => option.value ?? '');
      }
      field.matches = selector => selector === 'input' ? type !== 'select' : matchesAttributes(attributes, selector, field);
      const following = html.slice(match.index + match[0].length).split('</label>')[0];
      const labelText = following.match(/<span\b[^>]*>([\s\S]*?)(?:<small\b[^>]*>|<\/span>)/)?.[1]?.replace(/<[^>]*>/g, '') || '';
      field.nextElementSibling = { firstChild: { textContent: labelText } };
      result.fields.push(field);
    }
    result.reportValidity = () => result.fields.every(field => field.disabled || !field.required || (field.type === 'checkbox' ? field.checked : !!field.value));
    result.dropdowns = [];
    for (const details of html.matchAll(/<details\b([^>]*)>([\s\S]*?)<\/details>/g)) {
      const attributes = attrs(details[1]);
      const fields = result.fields.filter(field => field.position >= details.index && field.position < details.index + details[0].length);
      const summary = element(), empty = element(); empty.hidden = true;
      summary.textContent = details[2].match(/<summary\b[^>]*>\s*<span\b[^>]*>([\s\S]*?)<\/span>/)?.[1] || '';
      const options = fields.filter(field => 'misMap' in field.dataset).map(field => {
        const status = element();
        return { ...element(), field, dataset: { misOption: true, misOptionId: field.value }, status, textContent: field.nextElementSibling.firstChild.textContent,
          querySelector: selector => selector === '.misOptionStatus' ? status : field.matches(selector) ? field : null,
          querySelectorAll: selector => field.matches(selector) ? [field] : [] };
      });
      const dropdown = { ...element(), dataset: dataset(attributes), open: !!attributes.open, summary, empty, options, fields,
        querySelector: selector => selector === 'summary' || selector === 'summary > span' ? summary : selector === '.misMultiEmpty' ? empty : fields.find(field => field.matches(selector)) || null,
        querySelectorAll: selector => selector === '[data-mis-option]' ? options : fields.filter(field => field.matches(selector)) };
      for (const field of fields) field.closest = selector => selector === '.misMultiSelect' || selector === 'details' ? dropdown : selector === 'form' ? result : null;
      result.dropdowns.push(dropdown);
      if (attributes.id) nodes.set(attributes.id, dropdown);
    }
    result.dropdown = result.dropdowns.find(dropdown => dropdown.dataset.misMapLevel === 'primary') || result.dropdowns[0];
    result.querySelectorAll = selector => selector === '.misMultiSelect' ? result.dropdowns : result.fields.filter(field => field.matches(selector));
    result.querySelector = selector => result.fields.find(field => field.matches(selector)) || result.dropdowns.find(dropdown => matchesAttributes(Object.fromEntries(Object.entries(dropdown.dataset).map(([key, value]) => [`data-${key.replace(/[A-Z]/g, char => `-${char.toLowerCase()}`)}`, value])), selector)) || null;
    return result;
  }
  function container() {
    const target = element(); let html = '';
    Object.defineProperty(target, 'innerHTML', { get: () => html, set(value) {
      html = value;
      if (target === nodes.get('adminModal')) for (const id of ['misUserForm', 'misLifecycleForm', 'misFormError', 'misReplacementImpact']) nodes.delete(id);
      for (const match of value.matchAll(/\bid="([^"]+)"/g)) if (!nodes.has(match[1])) nodes.set(match[1], element());
      for (const match of value.matchAll(/<form\b[^>]*id="([^"]+)"[^>]*>([\s\S]*?)<\/form>/g)) nodes.set(match[1], form(match[2]));
    } });
    return target;
  }
  nodes.set('adminPageContent', container()); nodes.set('adminModal', container()); nodes.set('adminToast', element());
  const document = { getElementById: id => nodes.get(id) || null, addEventListener: (type, listener) => listeners.set(type, listener) };
  class FormData {
    constructor(target) { this.entries = target.fields.filter(field => field.name && !field.disabled && (field.type !== 'checkbox' || field.checked)).map(field => [field.name, field.value]); }
    forEach(callback) { for (const [name, value] of this.entries) callback(value, name); }
    get(name) { return this.entries.find(entry => entry[0] === name)?.[1] ?? null; }
  }
  const window = { IneburaMisCore: core, IneburaMisStore: { ...store, actor: () => currentActor }, addEventListener: (type, listener) => windowListeners.set(type, listener) };
  const sandbox = { window, document, location: { search: '?module=user-setup&view=create-user' }, URLSearchParams, FormData, crypto, requestAnimationFrame: callback => callback(), setTimeout() {} };
  vm.runInNewContext(fs.readFileSync(`${__dirname}/admin-mis-users.js`, 'utf8'), sandbox);
  const click = (action, id, extra = {}) => listeners.get('click')({ preventDefault() {}, target: { closest: () => ({ dataset: { misAction: action, id, ...extra } }) } });
  const field = name => nodes.get('misUserForm').fields.find(item => item.name === name);
  const dropdown = kind => nodes.get('misUserForm').dropdowns.find(item => item.dataset.misMapKind === kind);
  const primaryKind = () => nodes.get('misUserForm').dropdown?.dataset.misMapKind;
  const checked = kind => nodes.get('misUserForm').fields.filter(item => item.dataset.misMap && (!kind || item.dataset.misMap === kind) && item.checked).map(item => item.value).sort();
  const selectMaps = (ids, kind = primaryKind()) => { for (const item of nodes.get('misUserForm').fields.filter(item => item.dataset.misMap && (!kind || item.dataset.misMap === kind))) item.checked = ids.includes(item.value); };
  const change = (name, value) => { const target = field(name); target.value = value; listeners.get('change')({ target }); };
  const toggleMap = (id, checked, kind) => { const target = nodes.get('misUserForm').fields.find(item => item.dataset.misMap && (!kind || item.dataset.misMap === kind) && item.value === id); assert.ok(target, `Mapping option ${kind || ''} ${id} must exist`); target.checked = checked; listeners.get('change')({ target }); };
  const searchMaps = (value, kind = primaryKind()) => { const target = dropdown(kind)?.fields.find(item => 'misMapSearch' in item.dataset) || nodes.get('misUserForm').fields.find(item => 'misMapSearch' in item.dataset); target.value = value; listeners.get('input')({ target }); };
  const allControl = kind => nodes.get('misUserForm').fields.find(item => item.dataset.misMapAll === kind);
  const chooseAll = kind => { const target = allControl(kind); assert.ok(target, `Explicit All control for ${kind} must exist`); target.checked = true; listeners.get('change')({ target }); };
  return { store, values, click, field, checked, selectMaps, change, toggleMap, searchMaps, dropdown, allControl, chooseAll, node: id => nodes.get(id), saved: () => store.getState(), externalChange: () => windowListeners.get('storage')({ key: KEY }), actor: value => { currentActor = value; }, failStorage: value => { storageFailure = value; } };
}

const tests = [];
const test = (name, run) => tests.push({ name, run });
const assertAccess = (actual, expected) => {
  assert.equal(actual.mode, expected.mode);
  assert.deepEqual([...(actual.assigneeIds || [])].sort(), [...(expected.assigneeIds || [])].sort());
  assert.deepEqual([...(actual.subclientIds || [])].sort(), [...(expected.subclientIds || [])].sort());
  assert.equal(actual.clientId, expected.clientId, 'only complete-client mode retains a client mapping');
};

test('editing existing subclient and assignee users preserves mappings through Step 1', () => {
  for (const [id, expected] of [['mis-sub', ['tc-north']], ['mis-agent', ['acm-c', 'agent-a']]]) {
    const h = harness(); h.click('edit', id); h.click('next');
    assert.deepEqual(h.checked(), expected);
    assert.equal(h.field('role').disabled, true);
    h.click('save');
    const access = h.saved().users.find(user => user.id === id).access;
    assert.deepEqual((access.mode === 'subclients' ? access.subclientIds : access.assigneeIds).sort(), expected);
  }
});

test('Step 2 → Previous → Next preserves selected mappings and reporting manager', () => {
  const h = harness(); h.click('edit', 'mis-agent'); h.click('next');
  h.selectMaps(['agent-b']); h.field('managerId').value = 'mgr-north';
  h.click('previous'); h.field('firstName').value = 'Updated'; h.click('next');
  assert.deepEqual(h.checked(), ['agent-b']);
  assert.equal(h.field('managerId').value, 'mgr-north');
  h.click('save');
  const saved = h.saved().users.find(user => user.id === 'mis-agent');
  assert.equal(saved.firstName, 'Updated'); assert.equal(saved.managerId, 'mgr-north');
  assertAccess(saved.access, { mode: 'assignees', assigneeIds: ['agent-b'] });
});

test('contact-picker return and contact selection preserve existing MIS mappings', () => {
  for (const choose of [false, true]) {
    const h = harness(); h.click('edit', 'mis-sub'); h.click('contact-picker');
    if (choose) h.click('choose-contact', undefined, { name: 'Contact Example', email: 'contact@example.test' });
    else h.click('return-wizard');
    h.click('next');
    assert.deepEqual(h.checked(), ['tc-north']);
    h.click('save');
    const saved = h.saved().users.find(user => user.id === 'mis-sub');
    assertAccess(saved.access, { mode: 'subclients', subclientIds: ['tc-north'] });
    if (choose) assert.equal(saved.email, 'contact@example.test');
  }
});

test('mode change clears old mappings but preserves later choices through the wizard', () => {
  const h = harness(); h.click('edit', 'mis-agent'); h.click('next');
  h.change('mode', 'subclients');
  assert.deepEqual(h.checked(), []);
  h.selectMaps(['tc-west', 'apollo-north']); h.click('previous'); h.click('next');
  assert.deepEqual(h.checked(), ['apollo-north', 'tc-west']);
  h.click('save');
  assertAccess(h.saved().users.find(user => user.id === 'mis-agent').access, { mode: 'subclients', subclientIds: ['tc-west', 'apollo-north'] });
});

test('stale open wizard cannot overwrite newer fallback or assignment state', () => {
  const h = harness(); h.click('edit', 'mis-agent'); h.click('next');
  h.store.transitionUser('agent-a', 'suspend', 'agent-b', admin, 0); h.externalChange();
  const before = h.values.get(KEY); h.click('save');
  assert.match(h.node('misFormError').textContent, /changed in another view/);
  assert.equal(h.values.get(KEY), before);
  assert.deepEqual(h.saved().users.find(user => user.id === 'mis-agent').access.assigneeIds, ['agent-b', 'acm-c']);
});

test('failed storage write keeps the wizard and draft available for retry', () => {
  const h = harness(); h.click('edit', 'mis-sub'); h.click('next'); h.selectMaps(['tc-west']);
  const before = h.values.get(KEY); h.failStorage(true); h.click('save');
  assert.equal(h.values.get(KEY), before); assert.match(h.node('misFormError').textContent, /quota/);
  assert.equal(h.node('adminModal').classList.contains('is-open'), true);
  assert.deepEqual(h.checked(), ['tc-west']);
  h.failStorage(false); h.click('save');
  assert.deepEqual(h.saved().users.find(user => user.id === 'mis-sub').access.subclientIds, ['tc-west']);
});

test('losing Admin capability while a wizard is open blocks Save without mutation', () => {
  const h = harness(); h.click('edit', 'mis-sub'); h.click('next');
  const before = h.values.get(KEY); h.actor({ id: 'mis-sub', role: 'MIS', status: 'Active' }); h.click('save');
  assert.match(h.node('misFormError').textContent, /Only Admin/); assert.equal(h.values.get(KEY), before);
});

function newMis(h, mode = 'assignees') {
  h.click('create');
  for (const [name, value] of Object.entries({ firstName: 'New', lastName: 'Reviewer', email: 'new.reviewer@example.test', phone1: '9876543210', username: 'new.reviewer' })) h.field(name).value = value;
  h.click('next'); h.change('roleType', 'Support Role'); h.change('role', 'MIS');
  h.field('branch').value = 'Noida'; h.field('managerId').value = 'mgr-north'; h.change('mode', mode);
}

test('new roles depend on Role Type and MIS mapping controls depend on access mode', () => {
  const h = harness(); h.click('create');
  for (const [name, value] of Object.entries({ firstName: 'New', email: 'new@example.test', phone1: '9876543210', username: 'new' })) h.field(name).value = value;
  h.click('next');
  assert.equal(h.field('role').disabled, true); assert.deepEqual(h.field('role').options, ['']);
  assert.equal(h.field('mode'), undefined); assert.equal(h.field('managerId'), undefined);
  h.change('roleType', 'Support Role');
  assert.equal(h.field('role').disabled, false); assert.ok(h.field('role').options.includes('MIS MANAGER'));
  assert.ok(!h.field('role').options.includes('AGENT'));
  h.change('role', 'MIS');
  assert.ok(h.field('managerId')); assert.equal(h.node('misUserForm').dropdown, undefined);
  h.change('mode', 'client'); assert.ok(h.field('clientId')); assert.equal(h.node('misUserForm').dropdown, undefined);
  h.change('mode', 'subclients'); assert.equal(h.field('clientId'), undefined); assert.ok(h.node('misUserForm').dropdown);
  h.change('mode', 'assignees'); assert.deepEqual(h.dropdown('assignees').fields.filter(field => field.dataset.misMap).map(field => field.value).sort(), ['acm-c', 'agent-a', 'agent-b']);
});

test('Send Login Details persists as a boolean through steps and the contact picker', () => {
  const h = harness(); h.click('edit', 'mis-agent'); h.field('sendLoginDetails').checked = true;
  h.click('contact-picker'); h.click('return-wizard');
  assert.equal(h.field('sendLoginDetails').checked, true);
  h.click('next'); h.click('previous'); assert.equal(h.field('sendLoginDetails').checked, true);
  h.click('next'); h.click('save');
  assert.equal(h.saved().users.find(user => user.id === 'mis-agent').sendLoginDetails, true);
  h.click('edit', 'mis-agent'); h.field('sendLoginDetails').checked = false; h.click('next'); h.click('save');
  assert.equal(h.saved().users.find(user => user.id === 'mis-agent').sendLoginDetails, false, 'unchecked checkbox must clear the existing true setting');
});

test('searching a multi-select preserves hidden choices and updates its selected count', () => {
  const h = harness(); newMis(h, 'subclients');
  h.toggleMap('tc-north', true);
  const dropdown = h.dropdown('subclients');
  assert.match(dropdown.summary.textContent, /TestClient Pvt Ltd \/ North/);
  h.searchMaps('Apollo');
  assert.equal(dropdown.options.find(option => option.field.value === 'tc-north').hidden, true);
  assert.equal(dropdown.options.find(option => option.field.value === 'apollo-north').hidden, false);
  h.toggleMap('apollo-north', true); assert.equal(dropdown.summary.textContent, '2 selected');
  h.searchMaps('No such subclient'); assert.equal(dropdown.empty.hidden, false);
  h.searchMaps(''); assert.equal(dropdown.empty.hidden, true);
  h.click('save');
  const saved = h.saved().users.find(user => user.email === 'new.reviewer@example.test');
  assert.deepEqual(saved.access.subclientIds, ['tc-north', 'apollo-north']);
  assert.equal(saved.branch, 'Noida');
});

test('changing Role Type or Role removes prior MIS reporting and access selections', () => {
  const h = harness(); newMis(h); h.toggleMap('agent-a', true); h.toggleMap('tc-north', true, 'subclients');
  h.change('roleType', 'Operational Role');
  assert.equal(h.field('role').value, ''); assert.equal(h.field('managerId'), undefined); assert.equal(h.field('mode'), undefined);
  assert.ok(h.field('role').options.includes('AGENT')); assert.ok(!h.field('role').options.includes('MIS'));
  h.change('roleType', 'Support Role'); h.change('role', 'MIS');
  assert.equal(h.field('managerId').value, ''); assert.equal(h.field('mode').value, '');
  h.field('managerId').value = 'mgr-west'; h.change('mode', 'assignees'); assert.deepEqual(h.checked(), []);
  h.toggleMap('agent-b', true); h.toggleMap('apollo-south', true, 'subclients'); h.change('role', 'MIS MANAGER');
  assert.equal(h.field('managerId'), undefined); assert.equal(h.field('mode'), undefined);
  h.click('save');
  const saved = h.saved().users.find(user => user.email === 'new.reviewer@example.test');
  assert.equal(saved.role, 'MIS MANAGER'); assert.equal(saved.managerId, undefined); assert.equal(saved.access, undefined);
});

test('new MIS Manager does not retain hidden operational reporting after Role reset', () => {
  const h = harness(); newMis(h);
  h.change('roleType', 'Operational Role'); h.change('role', 'AGENT'); h.field('reportingTo').value = 'Unrelated Field Manager';
  h.change('roleType', 'Support Role'); h.change('role', 'MIS MANAGER'); h.click('save');
  const saved = h.saved().users.find(user => user.email === 'new.reviewer@example.test');
  assert.ok(!saved.reportingTo, 'hidden operational Reporting To must not be saved for the MIS Manager');
});

const scopeCases = [
  { mode: 'assignees', id: 'mis-agent', primary: 'assignees', secondary: 'subclients', primaryIds: ['agent-a'], secondaryIds: ['tc-north'], primaryCount: 3, access: { mode: 'assignees', assigneeIds: ['agent-a'], subclientIds: ['tc-north'] } },
  { mode: 'subclients', id: 'mis-sub', primary: 'subclients', secondary: 'assignees', primaryIds: ['tc-north'], secondaryIds: ['agent-a'], primaryCount: 2, access: { mode: 'subclients', subclientIds: ['tc-north'], assigneeIds: ['agent-a'] } },
];
const setBothLevels = (h, fixture) => {
  for (const id of fixture.primaryIds) h.toggleMap(id, true, fixture.primary);
  for (const id of fixture.secondaryIds) h.toggleMap(id, true, fixture.secondary);
};

test('each two-level mode exposes a dependent secondary selector and visible All choice', () => {
  for (const fixture of scopeCases) {
    const h = harness(); newMis(h, fixture.mode);
    assert.equal(h.dropdown(fixture.primary).dataset.misMapLevel, 'primary');
    assert.equal(h.dropdown(fixture.secondary).dataset.misMapLevel, 'secondary');
    assert.ok(h.allControl(fixture.secondary), 'secondary choice must have an explicit All control');
    assert.equal(h.allControl(fixture.secondary).disabled, true, 'secondary choices wait for a primary selection');
    for (const id of fixture.primaryIds) h.toggleMap(id, true, fixture.primary);
    assert.equal(h.allControl(fixture.secondary).disabled, false);
    assert.equal(h.allControl(fixture.secondary).checked, true, 'primary-only scope must visibly use All');
    assert.match(h.dropdown(fixture.secondary).summary.textContent, /All/i);
    assert.equal(h.node('misAccessPreviewCount').textContent, `${fixture.primaryCount} matching sample invoices`);
    h.click('save');
    const saved = h.saved().users.find(user => user.email === 'new.reviewer@example.test');
    assertAccess(saved.access, { mode: fixture.mode, [fixture.primary === 'assignees' ? 'assigneeIds' : 'subclientIds']: fixture.primaryIds });
  }
});

test('both mapping levels survive Previous Next and save in either ordering', () => {
  for (const fixture of scopeCases) {
    const h = harness(); newMis(h, fixture.mode); setBothLevels(h, fixture);
    assert.equal(h.allControl(fixture.secondary).checked, false);
    h.click('previous'); h.field('firstName').value = 'Two level'; h.click('next');
    assert.deepEqual(h.checked(fixture.primary), fixture.primaryIds);
    assert.deepEqual(h.checked(fixture.secondary), fixture.secondaryIds);
    assert.equal(h.allControl(fixture.secondary).checked, false);
    h.click('save');
    const saved = h.saved().users.find(user => user.email === 'new.reviewer@example.test');
    assert.equal(saved.firstName, 'Two level');
    assertAccess(saved.access, fixture.access);
  }
});

test('editing and contact-picker navigation preserve primary and secondary saved mappings', () => {
  for (const fixture of scopeCases) for (const chooseContact of [false, true]) {
    const h = harness(state => { state.users.find(user => user.id === fixture.id).access = structuredClone(fixture.access); });
    h.click('edit', fixture.id); h.click('contact-picker');
    if (chooseContact) h.click('choose-contact', undefined, { name: 'Scoped Contact', email: 'scoped.contact@example.test' });
    else h.click('return-wizard');
    h.click('next');
    assert.deepEqual(h.checked(fixture.primary), fixture.primaryIds);
    assert.deepEqual(h.checked(fixture.secondary), fixture.secondaryIds);
    assert.equal(h.allControl(fixture.secondary).checked, false);
    h.click('save');
    const saved = h.saved().users.find(user => user.id === fixture.id);
    assertAccess(saved.access, fixture.access);
    if (chooseContact) assert.equal(saved.email, 'scoped.contact@example.test');
  }
});

test('explicit All clears only the optional secondary restriction in both modes', () => {
  for (const fixture of scopeCases) {
    const h = harness(); newMis(h, fixture.mode); setBothLevels(h, fixture);
    assert.equal(h.node('misAccessPreviewCount').textContent, '1 matching sample invoice', 'the two-level preview must show the intersection');
    h.chooseAll(fixture.secondary);
    assert.deepEqual(h.checked(fixture.primary), fixture.primaryIds);
    assert.deepEqual(h.checked(fixture.secondary), []);
    assert.equal(h.allControl(fixture.secondary).checked, true);
    assert.match(h.dropdown(fixture.secondary).summary.textContent, /All/i);
    assert.equal(h.node('misAccessPreviewCount').textContent, `${fixture.primaryCount} matching sample invoices`, 'All restores only the primary scope');
    h.click('save');
    assertAccess(h.saved().users.find(user => user.email === 'new.reviewer@example.test').access,
      { mode: fixture.mode, [fixture.primary === 'assignees' ? 'assigneeIds' : 'subclientIds']: fixture.primaryIds });
  }
});

test('unchecking the last restricted option requires explicit All before widening access', () => {
  for (const fixture of scopeCases) {
    const h = harness(); newMis(h, fixture.mode); setBothLevels(h, fixture);
    for (const id of fixture.secondaryIds) h.toggleMap(id, false, fixture.secondary);
    assert.deepEqual(h.checked(fixture.secondary), []);
    assert.equal(h.allControl(fixture.secondary).checked, false, 'empty restricted selection must not silently become All');
    h.click('previous'); h.click('next');
    assert.equal(h.allControl(fixture.secondary).checked, false, 'restricted-empty intent survives step navigation');
    const before = h.values.get(KEY); h.click('save');
    assert.equal(h.values.get(KEY), before, 'incomplete restricted choice must not mutate storage');
    assert.match(h.node('misFormError').textContent, /All|secondary|restriction|at least one/i);
    h.chooseAll(fixture.secondary); h.click('save');
    assertAccess(h.saved().users.find(user => user.email === 'new.reviewer@example.test').access,
      { mode: fixture.mode, [fixture.primary === 'assignees' ? 'assigneeIds' : 'subclientIds']: fixture.primaryIds });
  }
});

test('changing primary selections retains valid zero-match secondary restrictions', () => {
  const cases = [
    { mode: 'assignees', primary: 'assignees', secondary: 'subclients', before: 'agent-a', after: 'agent-b', restriction: 'apollo-north', access: { mode: 'assignees', assigneeIds: ['agent-b'], subclientIds: ['apollo-north'] } },
    { mode: 'subclients', primary: 'subclients', secondary: 'assignees', before: 'tc-west', after: 'tc-north', restriction: 'acm-c', access: { mode: 'subclients', subclientIds: ['tc-north'], assigneeIds: ['acm-c'] } },
  ];
  for (const fixture of cases) {
    const h = harness(); newMis(h, fixture.mode);
    h.toggleMap(fixture.before, true, fixture.primary); h.toggleMap(fixture.restriction, true, fixture.secondary);
    h.toggleMap(fixture.before, false, fixture.primary); h.toggleMap(fixture.after, true, fixture.primary);
    assert.deepEqual(h.checked(fixture.primary), [fixture.after]);
    assert.deepEqual(h.checked(fixture.secondary), [fixture.restriction]);
    assert.equal(h.allControl(fixture.secondary).checked, false);
    const retained = h.dropdown(fixture.secondary).options.find(option => option.field.value === fixture.restriction);
    assert.equal(retained.hidden, false, 'saved valid zero-match restriction remains available for review');
    assert.equal(retained.field.disabled, false);
    assert.equal(h.node('misAccessPreviewCount').textContent, '0 matching sample invoices');
    h.click('save');
    assertAccess(h.saved().users.find(user => user.email === 'new.reviewer@example.test').access, fixture.access);
  }
});

test('saved zero-match restricted scopes reopen and save without becoming unrestricted', () => {
  for (const fixture of [
    { id: 'mis-agent', primary: 'assignees', secondary: 'subclients', access: { mode: 'assignees', assigneeIds: ['agent-b'], subclientIds: ['apollo-north'] } },
    { id: 'mis-sub', primary: 'subclients', secondary: 'assignees', access: { mode: 'subclients', subclientIds: ['tc-north'], assigneeIds: ['acm-c'] } },
  ]) {
    const h = harness(state => { state.users.find(user => user.id === fixture.id).access = structuredClone(fixture.access); });
    h.click('edit', fixture.id); h.click('next');
    const selected = fixture.access[fixture.secondary === 'assignees' ? 'assigneeIds' : 'subclientIds'];
    assert.deepEqual(h.checked(fixture.secondary), selected);
    assert.equal(h.allControl(fixture.secondary).checked, false);
    assert.equal(h.dropdown(fixture.secondary).options.find(option => option.field.value === selected[0]).hidden, false);
    assert.equal(h.node('misAccessPreviewCount').textContent, '0 matching sample invoices');
    h.click('save');
    assertAccess(h.saved().users.find(user => user.id === fixture.id).access, fixture.access);
  }
});

test('primary and secondary searches and summary counts are independent', () => {
  const h = harness(); newMis(h, 'subclients');
  h.toggleMap('tc-north', true, 'subclients'); h.toggleMap('tc-west', true, 'subclients');
  h.toggleMap('agent-a', true, 'assignees'); h.toggleMap('acm-c', true, 'assignees');
  const primary = h.dropdown('subclients'), secondary = h.dropdown('assignees');
  primary.open = true; secondary.open = true;
  assert.equal(primary.summary.textContent, '2 selected'); assert.equal(secondary.summary.textContent, '2 selected');
  h.searchMaps('Apollo', 'subclients');
  const primaryHidden = primary.options.map(option => option.hidden);
  assert.ok(primaryHidden.some(Boolean));
  h.searchMaps('No matching agent', 'assignees');
  assert.deepEqual(primary.options.map(option => option.hidden), primaryHidden, 'secondary search must not filter the primary list');
  assert.equal(secondary.empty.hidden, false);
  h.searchMaps('', 'subclients');
  assert.equal(secondary.empty.hidden, false, 'clearing primary search must not clear secondary search');
  assert.equal(secondary.fields.find(field => 'misMapSearch' in field.dataset).value, 'No matching agent');
  assert.equal(primary.summary.textContent, '2 selected'); assert.equal(secondary.summary.textContent, '2 selected');
  assert.deepEqual(h.checked('subclients'), ['tc-north', 'tc-west']); assert.deepEqual(h.checked('assignees'), ['acm-c', 'agent-a']);
  assert.equal(primary.open, true); assert.equal(secondary.open, true);
  h.searchMaps('', 'assignees'); h.click('save');
  assertAccess(h.saved().users.find(user => user.email === 'new.reviewer@example.test').access,
    { mode: 'subclients', subclientIds: ['tc-north', 'tc-west'], assigneeIds: ['agent-a', 'acm-c'] });
});

test('dependent secondary options follow invoice relationships in both orderings', () => {
  for (const fixture of [
    { mode: 'assignees', primary: 'assignees', secondary: 'subclients', primaryId: 'agent-a', expected: ['apollo-north', 'tc-north', 'tc-west'] },
    { mode: 'subclients', primary: 'subclients', secondary: 'assignees', primaryId: 'tc-north', expected: ['agent-a', 'agent-b'] },
  ]) {
    const h = harness(); newMis(h, fixture.mode);
    assert.ok(h.dropdown(fixture.secondary).fields.every(field => field.disabled), 'every secondary input starts disabled');
    h.toggleMap(fixture.primaryId, true, fixture.primary);
    assert.deepEqual(h.dropdown(fixture.secondary).options.filter(option => !option.hidden).map(option => option.field.value).sort(), fixture.expected);
    assert.ok(h.dropdown(fixture.secondary).fields.every(field => !field.disabled), 'primary selection enables the dependent controls');
  }
});

test('primary checkbox changes preserve both search terms dropdown state and restrictions', () => {
  const h = harness(); newMis(h, 'subclients');
  h.toggleMap('tc-north', true, 'subclients'); h.toggleMap('agent-a', true, 'assignees');
  const primary = h.dropdown('subclients'), secondary = h.dropdown('assignees');
  primary.open = true; secondary.open = true;
  h.searchMaps('TestClient', 'subclients'); h.searchMaps('No matching agent', 'assignees');
  h.toggleMap('tc-west', true, 'subclients');
  assert.strictEqual(h.dropdown('subclients'), primary, 'the primary dropdown must not be replaced');
  assert.strictEqual(h.dropdown('assignees'), secondary, 'the secondary dropdown must not be replaced');
  assert.equal(primary.fields.find(field => 'misMapSearch' in field.dataset).value, 'TestClient');
  assert.equal(secondary.fields.find(field => 'misMapSearch' in field.dataset).value, 'No matching agent');
  assert.equal(primary.open, true); assert.equal(secondary.open, true);
  assert.deepEqual(primary.options.filter(option => !option.hidden).map(option => option.field.value).sort(), ['tc-north', 'tc-west']);
  assert.equal(secondary.empty.hidden, false);
  assert.deepEqual(h.checked('assignees'), ['agent-a']);
  assert.equal(h.allControl('assignees').checked, false);
  assert.equal(h.node('misAccessPreviewCount').textContent, '2 matching sample invoices');
  h.searchMaps('', 'assignees');
  assert.equal(secondary.options.find(option => option.field.value === 'acm-c').hidden, false, 'adding West makes its assignee available without dropping the existing restriction');
});

test('switching a restricted scope to complete client saves no leftover mapping level', () => {
  const fixture = scopeCases[0];
  const h = harness(state => { state.users.find(user => user.id === fixture.id).access = structuredClone(fixture.access); });
  h.click('edit', fixture.id); h.click('next');
  const before = h.values.get(KEY); h.change('mode', 'client');
  assert.equal(h.values.get(KEY), before);
  assert.equal(h.node('misUserForm').dropdowns.length, 0);
  h.change('clientId', 'client-tc'); h.click('save');
  assertAccess(h.saved().users.find(user => user.id === fixture.id).access, { mode: 'client', clientId: 'client-tc' });
});

test('mode switch clears primary and secondary mappings only in the draft until Save', () => {
  const fixture = scopeCases[0];
  const h = harness(state => { state.users.find(user => user.id === fixture.id).access = structuredClone(fixture.access); });
  h.click('edit', fixture.id); h.click('next');
  const before = h.values.get(KEY); h.change('mode', 'subclients');
  assert.deepEqual(h.checked('assignees'), []); assert.deepEqual(h.checked('subclients'), []);
  assert.equal(h.values.get(KEY), before, 'mode change must not alter saved access before Save');
  h.toggleMap('apollo-south', true, 'subclients'); h.toggleMap('agent-b', true, 'assignees');
  h.click('save');
  assertAccess(h.saved().users.find(user => user.id === fixture.id).access,
    { mode: 'subclients', subclientIds: ['apollo-south'], assigneeIds: ['agent-b'] });
});

test('a malformed saved secondary cannot silently reopen as unrestricted access', () => {
  for (const fixture of scopeCases) for (const invalid of [null, 'invalid', { id: 'invalid' }]) {
    const secondaryKey = fixture.secondary === 'assignees' ? 'assigneeIds' : 'subclientIds';
    const h = harness(state => { state.users.find(user => user.id === fixture.id).access = { ...fixture.access, [secondaryKey]: invalid }; });
    h.click('edit', fixture.id); h.click('next');
    assert.equal(h.allControl(fixture.secondary).checked, false);
    const before = h.values.get(KEY); h.click('save');
    assert.equal(h.values.get(KEY), before);
    assert.match(h.node('misFormError').textContent, /restriction|All/i);
    h.chooseAll(fixture.secondary);
    assert.equal(h.node('misFormError').hidden, true, 'explicit recovery clears the stale selection error');
    h.click('save');
    assertAccess(h.saved().users.find(user => user.id === fixture.id).access,
      { mode: fixture.mode, [fixture.primary === 'assignees' ? 'assigneeIds' : 'subclientIds']: fixture.primaryIds });
  }
});

let failed = 0;
for (const { name, run } of tests) {
  try { run(); console.log(`PASS ${name}`); }
  catch (error) { failed++; console.error(`FAIL ${name}\n${error.stack}`); }
}
if (failed) { console.error(`${failed} of ${tests.length} Admin MIS wizard checks failed.`); process.exitCode = 1; }
else console.log(`Passed ${tests.length} Admin MIS wizard checks: two-level dependent scopes, explicit All, isolated search, zero-match restrictions, draft preservation and failure recovery.`);
