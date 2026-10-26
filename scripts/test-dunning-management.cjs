'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const management = require('./dunning-management.js');
const { createInstance } = require('./dunning-core.js');
const admin = { role: 'client-admin', clientId: 'demo-client', userId: 'admin' };
const copy = value => JSON.parse(JSON.stringify(value));
const input = overrides => ({ name: 'Recovery schedule', status: 'draft', firstStageDays: 15, subClientId: '', coverage: { targetType: 'customer', targetMode: 'all' }, selectedIds: [], stages: [{ templateId: 'dunning-template-1', intervalDays: 0 }], ...overrides });
function fixture() {
  const core = createInstance({ context: () => admin });
  core.setEnabled(true, admin);
  core.getState().templates.forEach(template => core.saveTemplate({ ...template, standardReady: true }, admin));
  core.syncInvoices([{ id: 'customer-one', customerCode: '001', name: 'One', contacts: ['one@example.test'], invoices: [{ id: 'invoice-one', invoiceNo: 'INV-001', amount: 1000, outstanding: 600, dueDate: '2026-10-01' }, { id: 'invoice-two', invoiceNo: 'INV-002', amount: 1200, outstanding: 1200, dueDate: '2026-10-01' }] }], admin);
  return core;
}

test('management permission requires Client Admin with scope before builders or scope reads', () => {
  const state = fixture().getState();
  for (const role of ['agent', 'supervisor', 'mis', 'mis-manager', 'backend', '', undefined]) {
    const context = { ...admin, role };
    assert.equal(management.canManage(context), false);
    assert.throws(() => management.scoped(state, context), /Client Admin only/);
    assert.throws(() => management.buildStrategy(input(), null, state, context), /Client Admin only/);
  }
  assert.equal(management.canManage({ role: 'client-admin' }), false);
  assert.equal(management.canManage(admin), true);
});

test('one-letter strategy builds without auto-adding stages, survives engine validation and sends one letter', () => {
  const core = fixture(); core.setLetterCount(1, admin);
  const before = JSON.stringify(core.getState());
  const payload = management.buildStrategy(input({ status: 'active', coverage: { targetType: 'customer', targetMode: 'selected' }, selectedIds: ['customer-one'] }), null, core.getState(), admin);
  assert.equal(payload.stages.length, 1); assert.equal(payload.clientId, admin.clientId);
  assert.equal(JSON.stringify(core.getState()), before, 'building a strategy is pure');
  const saved = core.saveStrategy(payload, admin);
  const result = core.runDaily('2026-10-21', { actor: admin, outcome: 'success' });
  assert.equal(result.emailsCreated, 1); assert.equal(result.failures, 0);
  assert.equal(core.getState().emails[0].status, 'sent');
  assert.equal(core.getState().batches.find(batch => batch.strategyId === saved.id).status, 'completed');
});

test('timing and template validation rejects invalid sequences without mutating inputs', () => {
  const state = fixture().getState(), untouched = JSON.stringify(state);
  const variants = [
    [{ name: '  ' }, /strategy name/],
    [{ firstStageDays: 0.5 }, /whole days/],
    [{ firstStageDays: -1 }, /whole days/],
    [{ firstStageDays: 3651 }, /whole days/],
    [{ stages: [] }, /between 1 and/],
    [{ stages: [{ templateId: 'dunning-template-2', intervalDays: 0 }] }, /template for DL1/],
    [{ stages: [{ templateId: 'dunning-template-1', intervalDays: 0 }, { templateId: 'dunning-template-2', intervalDays: 0 }] }, /between later letters/]
  ];
  for (const [changes, error] of variants) assert.throws(() => management.buildStrategy(input(changes), null, state, admin), error);
  assert.equal(JSON.stringify(state), untouched);
  const one = { ...state, letterCount: 1 };
  assert.throws(() => management.buildStrategy(input({ stages: [{ templateId: 'dunning-template-1', intervalDays: 0 }, { templateId: 'dunning-template-2', intervalDays: 7 }] }), null, one, admin), /between 1 and 1/);
});

test('ordinary edits preserve migrated Strategy Master selections, exclusions, stage filters and identity', () => {
  const state = fixture().getState();
  const legacy = { id: 'legacy-strategy', clientId: admin.clientId, name: 'Legacy', status: 'draft', firstStageDays: 7, subClientId: 'sub-a', strategyMasterPayload: { templates: [{ templateId: 'regular-email' }] }, filters: { minOutstanding: 100, strategyMaster: { targetType: 'invoice', targetMode: 'selected', selectedTargetIds: ['INV-001'], excludedTargetIds: ['INV-002'], selectedInvoiceIds: ['invoice-one'] }, customGuard: ['retained'] }, stages: [{ templateId: 'dunning-template-1', intervalDays: 0, filters: { invoiceStatuses: ['Funds Issue'], agingBuckets: ['1-30'], keyAccountFilter: 'no' } }] };
  const before = JSON.stringify(legacy);
  const updated = management.buildStrategy(input({ name: ' Renamed ', firstStageDays: 20, subClientId: 'sub-a', coverageChanged: false, selectedIds: [], stages: copy(legacy.stages) }), legacy, state, admin);
  assert.equal(updated.id, legacy.id); assert.equal(updated.name, 'Renamed'); assert.equal(updated.subClientId, 'sub-a');
  assert.deepEqual(updated.filters.strategyMaster, legacy.filters.strategyMaster);
  assert.deepEqual(updated.filters.customGuard, ['retained']); assert.equal(updated.filters.minOutstanding, undefined);
  assert.deepEqual(updated.strategyMasterPayload, legacy.strategyMasterPayload); assert.deepEqual(updated.stages, legacy.stages);
  assert.equal(JSON.stringify(legacy), before);
  updated.filters.strategyMaster.selectedTargetIds.push('new'); assert.equal(JSON.stringify(legacy), before, 'result does not share nested targets with the input');
});

test('explicit coverage changes replace legacy target rules and validate local selected records', () => {
  const state = fixture().getState();
  const legacy = { id: 'legacy', clientId: admin.clientId, filters: { strategyMaster: { targetType: 'invoice', targetMode: 'all', excludedTargetIds: ['INV-002'] }, customerIds: ['old'], invoiceIds: ['old'], retainedFilter: true } };
  const selected = management.buildStrategy(input({ coverageChanged: true, coverage: { targetType: 'invoice', targetMode: 'selected' }, selectedIds: ['invoice-one', 'invoice-one'] }), legacy, state, admin);
  assert.deepEqual(selected.filters.invoiceIds, ['invoice-one']); assert.equal(selected.filters.customerIds, undefined); assert.equal(selected.filters.strategyMaster, undefined); assert.equal(selected.filters.retainedFilter, true);
  const all = management.buildStrategy(input({ coverageChanged: true }), selected, state, admin);
  assert.equal(all.filters.invoiceIds, undefined); assert.equal(all.filters.customerIds, undefined);
  assert.deepEqual(all.filters.coverage, { targetType: 'customer', targetMode: 'all' });
  assert.throws(() => management.buildStrategy(input({ coverage: { targetType: 'invoice', targetMode: 'selected' } }), null, state, admin), /Select at least one/);
  assert.throws(() => management.buildStrategy(input({ coverage: { targetType: 'invoice', targetMode: 'selected' }, selectedIds: ['foreign'] }), null, state, admin), /outside your client scope/);
  assert.throws(() => management.buildStrategy(input(), { ...legacy, clientId: 'foreign' }, state, admin), /outside your client scope/);
});

test('selected targets that disappear remain restrictive until coverage is explicitly changed', () => {
  const core = fixture(), state = core.getState();
  const legacy = { id: 'missing-selection', clientId: admin.clientId, filters: { strategyMaster: { targetType: 'invoice', targetMode: 'selected', selectedTargetIds: ['REMOVED-INVOICE'] } } };
  const payload = management.buildStrategy(input({ status: 'active', coverageChanged: false }), legacy, state, admin);
  core.saveStrategy(payload, admin);
  assert.deepEqual(payload.filters.strategyMaster.selectedTargetIds, ['REMOVED-INVOICE']);
  assert.equal(core.runDaily('2026-10-21', { actor: admin, outcome: 'success' }).emailsCreated, 0, 'a dead selection does not broaden to all invoices');
});

test('scoped projection isolates customers, invoices, strategies, batches, conflicts and issued history', () => {
  const state = { enabled: true, letterCount: 1, templates: [], documentTypes: [], customers: [{ id: 'c1', clientId: 'one' }, { id: 'c2', clientId: 'two' }], invoices: [{ id: 'i1', clientId: 'one' }, { id: 'i2', clientId: 'two' }], strategies: [{ id: 's1', clientId: 'one' }, { id: 's2', clientId: 'two' }], batches: [{ id: 'b1', strategyId: 's1' }, { id: 'b2', strategyId: 's2' }], conflicts: [{ invoiceId: 'i1' }, { invoiceId: 'i2' }], exclusions: [{ invoiceId: 'i1', active: true }, { invoiceId: 'i2', active: true }], emails: [{ id: 'e1', letterSnapshot: { customer: { clientId: 'one' } } }, { id: 'e2', letterSnapshot: { customer: { clientId: 'two' } } }, { id: 'legacy', letterSnapshot: { clientId: 'one' } }, { id: 'unknown', letterSnapshot: {} }] };
  const scoped = management.scoped(state, { ...admin, clientId: 'one' });
  assert.deepEqual(scoped.customers.map(row => row.id), ['c1']); assert.deepEqual(scoped.invoices.map(row => row.id), ['i1']); assert.deepEqual(scoped.strategies.map(row => row.id), ['s1']);
  assert.deepEqual(scoped.batches.map(row => row.id), ['b1']); assert.deepEqual(scoped.conflicts.map(row => row.invoiceId), ['i1']);
  assert.deepEqual(scoped.emails.map(row => row.id), ['e1', 'legacy']);
  assert.deepEqual(scoped.exclusions.map(row => row.invoiceId), ['i1']);
});

test('mount denies unauthorized roles before registering handlers or reading state', () => {
  for (const role of ['agent', 'supervisor', 'mis', 'mis-manager', 'backend']) {
    const container = { innerHTML: '', addEventListener() { throw new Error('Unauthorized mount cannot register actions'); } };
    const api = { getContext: () => ({ ...admin, role }), getState() { throw new Error('Unauthorized mount cannot read state'); } };
    const mounted = management.mount(container, { api });
    assert.match(container.innerHTML, /Access restricted/); mounted.refresh(); mounted.destroy();
  }
});

test('daily cycle handler passes the explicit current actor and reports issued/failed totals', async () => {
  const state = { enabled: true, letterCount: 1, lastRunDate: '2026-10-21', customers: [], invoices: [], templates: [], strategies: [{ id: 's1', name: 'Active', clientId: admin.clientId, firstStageDays: 0, status: 'active', stages: [{ templateId: 't1', intervalDays: 0 }] }], emails: [], batches: [], conflicts: [], exclusions: [] };
  const listeners = {}, calls = [], notices = [], nodes = new Map();
  const element = () => ({ innerHTML: '', hidden: false, textContent: '', classList: { toggle() {}, remove() {}, add() {} }, setAttribute() {}, addEventListener() {}, removeEventListener() {} });
  const container = { innerHTML: '', querySelector(selector) { if (!nodes.has(selector)) nodes.set(selector, element()); return nodes.get(selector); }, addEventListener(type, listener) { listeners[type] = listener; }, removeEventListener() {} };
  const modal = element(); modal.querySelector = () => null;
  const actor = { ...admin, userId: 'CURRENT-ADMIN' };
  const api = { getContext: () => ({ ...actor }), getState: () => copy(state), subscribe: () => () => {}, runDaily(...args) { calls.push(args); return { emailsCreated: 3, failures: 1, conflicts: 2 }; } };
  const host = { document: { getElementById: id => id === 'adminModal' ? modal : null }, location: { search: '', hash: '' }, IneburaDunningManagementTemplates: { mount: () => ({ ready: Promise.resolve(), destroy() {} }) }, IneburaDunningManagementReport: { mount: () => ({ refresh() {}, destroy() {} }) } };
  vm.runInNewContext(fs.readFileSync(__dirname + '/dunning-management.js', 'utf8'), { window: host, URLSearchParams, Intl, Date, setTimeout, clearTimeout });
  const mounted = host.IneburaDunningManagement.mount(container, { api, notify: message => notices.push(message) });
  const form = { elements: { date: { value: '2026-10-21' }, outcome: { value: 'partial' } }, matches(selector) { return selector.split(',').includes('[data-dm-run]'); }, querySelector: () => null };
  await listeners.submit({ target: form, preventDefault() {} });
  assert.equal(calls.length, 1); assert.equal(calls[0].length, 2, 'actor is in the options object rather than an ignored third argument');
  assert.deepEqual(JSON.parse(JSON.stringify(calls[0][1])), { actor, outcome: 'partial' });
  assert.match(notices.at(-1), /2 letters sent, 1 failed, 2 conflicts/);
  const pending = listeners.submit({ target: form, preventDefault() {} });
  actor.clientId = 'changed-during-template-await'; await pending;
  assert.equal(calls.length, 1, 'client authorization is checked again after awaiting template readiness');
  actor.clientId = admin.clientId;
  const before = calls.length; actor.role = 'agent'; await listeners.submit({ target: form, preventDefault() {} }); assert.equal(calls.length, before, 'saved submit checks current role');
  actor.role = 'client-admin'; actor.clientId = 'other-client';
  await listeners.submit({ target: form, preventDefault() {} });
  assert.equal(calls.length, before, 'saved submit cannot act after the bound client scope changes');
  mounted.destroy();
});

test('editing only selected target values in the modal persists the new IDs', async () => {
  const core = fixture();
  const existing = core.saveStrategy(management.buildStrategy(input({ coverage: { targetType: 'invoice', targetMode: 'selected' }, selectedIds: ['invoice-one'] }), null, core.getState(), admin), admin);
  const listeners = {}, modalListeners = {}, nodes = new Map();
  const element = () => ({ innerHTML: '', hidden: false, textContent: '', classList: { toggle() {}, remove() {}, add() {} }, setAttribute() {}, addEventListener() {}, removeEventListener() {} });
  const container = { innerHTML: '', querySelector(selector) { if (!nodes.has(selector)) nodes.set(selector, element()); return nodes.get(selector); }, addEventListener(type, listener) { listeners[type] = listener; }, removeEventListener() {} };
  const fields = { name: { value: existing.name }, status: { value: 'draft' }, subClient: { value: '' }, targetType: { value: 'invoice' }, targetMode: { value: 'selected' }, selectedTargets: { name: 'selectedTargets', selectedOptions: [{ value: 'invoice-two' }], matches: () => false }, 'days-0': { value: '15' }, 'template-0': { value: 'dunning-template-1' }, 'key-0': { value: 'all' }, 'all-statuses-0': { checked: true }, 'all-aging-0': { checked: true } };
  const form = { elements: fields, matches(selector) { return selector.split(',').includes('[data-dm-strategy]'); }, querySelector: () => null };
  const targets = element();
  const modal = { ...element(), addEventListener(type, listener) { modalListeners[type] = listener; }, querySelector(selector) { if (selector === '[data-dm-strategy]') return form; if (selector === '[data-dm-targets]') return targets; return null; } };
  const host = { document: { getElementById: id => id === 'adminModal' ? modal : null }, location: { search: '', hash: '' }, requestAnimationFrame: callback => callback(), IneburaDunningManagementTemplates: { mount: () => ({ ready: Promise.resolve(), destroy() {} }) }, IneburaDunningManagementReport: { mount: () => ({ refresh() {}, destroy() {} }) } };
  vm.runInNewContext(fs.readFileSync(__dirname + '/dunning-management.js', 'utf8'), { window: host, URLSearchParams, Intl, Date, setTimeout, clearTimeout });
  const mounted = host.IneburaDunningManagement.mount(container, { api: core });
  const edit = { dataset: { dmAction: 'edit-strategy', id: existing.id }, disabled: false };
  await listeners.click({ target: { closest: selector => selector === '[data-dm-action]' ? edit : null } });
  assert.match(targets.innerHTML, /invoice-one/);
  modalListeners.change({ target: fields.selectedTargets });
  await modalListeners.submit({ target: form, preventDefault() {} });
  assert.deepEqual(core.getState().strategies.find(strategy => strategy.id === existing.id).filters.invoiceIds, ['invoice-two']);
  mounted.destroy();
});
