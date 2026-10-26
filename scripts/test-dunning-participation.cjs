'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const management = require('./dunning-management.js');
const { createInstance } = require('./dunning-core.js');

const admin = { role: 'client-admin', clientId: 'participation-client', userId: 'participation-admin' };
const clone = value => JSON.parse(JSON.stringify(value));
function fixture() {
  return {
    enabled: true, letterCount: 3, templates: [], documentTypes: [],
    customers: [
      { id: 'customer-one', clientId: admin.clientId, name: 'Aurora Manufacturing' },
      { id: 'customer-two', clientId: admin.clientId, name: 'Boreal Stores' },
      { id: 'customer-foreign', clientId: 'other-client', name: 'Foreign Customer' }
    ],
    invoices: [
      { id: 'invoice-one', invoiceNo: 'INV-001', customerId: 'customer-one', clientId: admin.clientId, originalAmount: 1000, outstandingAmount: 600, dueDate: '2026-10-01' },
      { id: 'invoice-two', invoiceNo: 'INV-002', customerId: 'customer-one', clientId: admin.clientId, originalAmount: 1200, outstandingAmount: 1200, dueDate: '2026-10-02' },
      { id: 'invoice-three', invoiceNo: 'INV-003', customerId: 'customer-two', clientId: admin.clientId, originalAmount: 900, outstandingAmount: 900, dueDate: '2026-10-03' },
      { id: 'invoice-foreign', invoiceNo: 'FOREIGN-001', customerId: 'customer-foreign', clientId: 'other-client', originalAmount: 500, outstandingAmount: 500, dueDate: '2026-10-01' }
    ],
    strategies: [], batches: [], conflicts: [], exclusions: [], emails: []
  };
}
function issue(stage, invoiceIds, options = {}) {
  const date = options.date || '2026-10-21';
  return {
    id: options.id || `issue-${stage}-${date}`, stage, date, reference: options.reference || `DL-REF-${stage}-${date}`,
    status: options.status || 'sent', customerId: options.customerId || 'customer-one',
    letterSnapshot: {
      customer: { id: options.customerId || 'customer-one', clientId: options.clientId || admin.clientId, name: 'Aurora Manufacturing' },
      invoices: invoiceIds.map(id => ({ id, invoiceNo: 'Captured invoice number' })),
      ...(options.sentAt ? { sentAt: options.sentAt } : {})
    }
  };
}
const view = (state, filters = {}) => management.participationView(state, admin, filters);
const byId = result => Object.fromEntries(result.rows.map(row => [row.invoice.id, row]));
const ids = result => result.rows.map(row => row.invoice.id);

test('unissued current-client invoices have no last letter and options follow configured count', () => {
  const state = fixture();
  assert.deepEqual(ids(view(state)), ['invoice-one', 'invoice-two', 'invoice-three']);
  assert.deepEqual(view(state).stages, [1, 2, 3]);
  for (const row of view(state).rows) {
    assert.equal(row.lastSentStage, null);
    assert.equal(row.lastSentDate, '');
    assert.equal(row.lastSentReference, '');
    assert.equal(row.customer.id, row.invoice.customerId);
  }
  state.letterCount = 1;
  assert.deepEqual(view(state).stages, [1]);
  state.letterCount = 5;
  assert.deepEqual(view(state).stages, [1, 2, 3, 4, 5]);
});

test('latest sent and partial-success letters count, while failed attempts never advance the filter', () => {
  const state = fixture();
  state.emails = [
    issue(1, ['invoice-one', 'invoice-two'], { date: '2026-10-20' }),
    issue(2, ['invoice-one'], { date: '2026-10-21', status: 'partial' }),
    issue(3, ['invoice-one'], { date: '2026-10-22', status: 'failed' })
  ];
  const rows = byId(view(state));
  assert.equal(rows['invoice-one'].lastSentStage, 2);
  assert.equal(rows['invoice-one'].lastSentDate, '2026-10-21');
  assert.equal(rows['invoice-one'].lastSentReference, 'DL-REF-2-2026-10-21');
  assert.equal(rows['invoice-two'].lastSentStage, 1);
  assert.deepEqual(ids(view(state, { stage: '2' })), ['invoice-one']);
  assert.deepEqual(ids(view(state, { stage: '3' })), []);
});

test('same-customer daily batches use exact snapshot invoice IDs and never inherit another invoice letter', () => {
  const state = fixture();
  state.emails = [issue(2, ['invoice-one']), issue(1, ['invoice-two'])];
  // A copied invoice number or missing ID cannot establish invoice participation.
  const unrelated = issue(3, [], { date: '2026-10-22' });
  unrelated.letterSnapshot.invoices = [{ invoiceNo: 'INV-001' }, { id: 'another-id', invoiceNo: 'INV-002' }];
  state.emails.push(unrelated);
  assert.deepEqual(ids(view(state, { stage: '2' })), ['invoice-one']);
  assert.deepEqual(ids(view(state, { stage: '1' })), ['invoice-two']);
  assert.equal(byId(view(state))['invoice-three'].lastSentStage, null);
});

test('a newer lower-stage issue wins over the highest historical stage and array order', () => {
  const state = fixture();
  state.emails = [
    issue(1, ['invoice-one'], { date: '2026-10-24', reference: 'RESTARTED-DL1' }),
    issue(3, ['invoice-one'], { date: '2026-10-21', reference: 'OLDER-DL3' })
  ];
  const row = byId(view(state))['invoice-one'];
  assert.equal(row.lastSentStage, 1);
  assert.equal(row.lastSentReference, 'RESTARTED-DL1');
  assert.deepEqual(ids(view(state, { stage: '3' })), []);
});

test('snapshot send timestamps choose the latest same-date issue and original position breaks exact ties', () => {
  const state = fixture();
  state.emails = [
    issue(2, ['invoice-one'], { sentAt: '2026-10-21T11:00:00+05:30', reference: 'NEWER-TIME' }),
    issue(3, ['invoice-one'], { sentAt: '2026-10-21T09:00:00+05:30', reference: 'OLDER-TIME' }),
    issue(1, ['invoice-two'], { sentAt: '2026-10-21T10:00:00+05:30', reference: 'FIRST-TIE' }),
    issue(2, ['invoice-two'], { sentAt: '2026-10-21T10:00:00+05:30', reference: 'LAST-TIE' })
  ];
  const rows = byId(view(state));
  assert.equal(rows['invoice-one'].lastSentReference, 'NEWER-TIME');
  assert.equal(rows['invoice-two'].lastSentReference, 'LAST-TIE');
  assert.equal(rows['invoice-two'].lastSentStage, 2);
});

test('issue date is a deterministic fallback when captured send timestamps are unavailable', () => {
  const state = fixture();
  state.emails = [
    issue(2, ['invoice-one'], { date: '2026-10-23', reference: 'LATEST-DATE' }),
    issue(3, ['invoice-one'], { date: '2026-10-22', reference: 'OLDER-DATE' })
  ];
  assert.equal(byId(view(state))['invoice-one'].lastSentReference, 'LATEST-DATE');
});

test('historical successful stages above a reduced count remain available, while failed-only or foreign stages do not', () => {
  const state = fixture();
  state.letterCount = 1;
  state.emails = [
    issue(7, ['invoice-one']),
    issue(5, ['invoice-two'], { status: 'partial' }),
    issue(8, ['invoice-three'], { status: 'failed' }),
    issue(9, ['invoice-foreign'], { clientId: 'other-client', customerId: 'customer-foreign' }),
    issue(10, ['missing-current-invoice'])
  ];
  assert.deepEqual(view(state).stages, [1, 5, 7]);
  assert.deepEqual(ids(view(state, { stage: '7' })), ['invoice-one']);
  assert.deepEqual(ids(view(state, { stage: '5' })), ['invoice-two']);
});

test('paid and manually excluded invoices retain their latest issued letter', () => {
  const state = fixture();
  state.invoices[0].outstandingAmount = 0;
  state.exclusions = [{ invoiceId: 'invoice-two', active: true }, { invoiceId: 'invoice-three', active: false }];
  state.emails = [issue(2, ['invoice-one', 'invoice-two'])];
  const rows = byId(view(state));
  assert.equal(rows['invoice-one'].paid, true);
  assert.equal(rows['invoice-one'].lastSentStage, 2);
  assert.equal(rows['invoice-two'].excluded, true);
  assert.equal(rows['invoice-two'].lastSentStage, 2);
  assert.equal(rows['invoice-three'].excluded, false);
  assert.deepEqual(ids(view(state, { stage: '2' })), ['invoice-one', 'invoice-two']);
});

test('not-sent includes only invoices absent from successful issues, including failed-only invoices', () => {
  const state = fixture();
  state.emails = [issue(1, ['invoice-one']), issue(1, ['invoice-two'], { status: 'failed' })];
  assert.deepEqual(ids(view(state, { stage: 'not-sent' })), ['invoice-two', 'invoice-three']);
});

test('customer or invoice search is trimmed, case insensitive, and intersects the selected stage', () => {
  const state = fixture();
  state.emails = [issue(2, ['invoice-one']), issue(1, ['invoice-two']), issue(2, ['invoice-three'], { customerId: 'customer-two' })];
  assert.deepEqual(ids(view(state, { search: '  aURorA  ', stage: '2' })), ['invoice-one']);
  assert.deepEqual(ids(view(state, { search: 'inv-002', stage: '1' })), ['invoice-two']);
  assert.deepEqual(ids(view(state, { search: 'inv-002', stage: '2' })), []);
  assert.deepEqual(view(state, { search: 'No match', stage: '2' }).stages, [1, 2, 3], 'search does not remove available stage options');
});

test('client scope excludes foreign invoices and foreign captured emails, even when an invoice ID is reused in a foreign snapshot', () => {
  const state = fixture();
  state.emails = [
    issue(1, ['invoice-one']),
    issue(3, ['invoice-one', 'invoice-foreign'], { clientId: 'other-client', customerId: 'customer-foreign', date: '2026-10-22' })
  ];
  const rows = byId(view(state));
  assert.equal(rows['invoice-one'].lastSentStage, 1);
  assert.equal(rows['invoice-foreign'], undefined);
  assert.deepEqual(ids(view(state, { search: 'Foreign' })), []);
});

test('participation projection is read-only and unauthorized roles fail before any state access', () => {
  const state = fixture();
  state.emails = [issue(2, ['invoice-one'])];
  const before = JSON.stringify(state);
  view(state, { search: 'Aurora', stage: '2' });
  assert.equal(JSON.stringify(state), before);
  for (const role of ['agent', 'supervisor', 'mis', 'mis-manager', 'backend', '', undefined]) {
    const trapped = new Proxy({}, { get() { throw new Error('State was read before permission check'); } });
    assert.throws(() => management.participationView(trapped, { ...admin, role }), /Client Admin only/);
  }
  assert.throws(() => management.participationView({}, { role: 'client-admin' }), /Client Admin only/);
});

test('mounted stage changes combine with search, persist across refresh and tab changes, and never write engine state', async () => {
  const state = fixture();
  state.emails = [issue(2, ['invoice-one']), issue(1, ['invoice-two'])];
  const before = JSON.stringify(state), listeners = {}, nodes = new Map();
  let focused = 0;
  const element = () => ({
    innerHTML: '', hidden: false, textContent: '', dataset: {},
    classList: { toggle() {}, remove() {}, add() {} },
    setAttribute() {}, addEventListener() {}, removeEventListener() {},
    focus() { focused += 1; }, setSelectionRange() {}
  });
  const container = {
    innerHTML: '',
    querySelector(selector) { if (!nodes.has(selector)) nodes.set(selector, element()); return nodes.get(selector); },
    querySelectorAll: () => [],
    addEventListener(type, handler) { listeners[type] = handler; }, removeEventListener() {}
  };
  const modal = element(); modal.querySelector = () => null;
  const actor = { ...admin };
  const api = { getContext: () => ({ ...actor }), getState: () => clone(state), subscribe: () => () => {} };
  const host = {
    document: { getElementById: id => id === 'adminModal' ? modal : null }, location: { search: '', hash: '' },
    IneburaDunningManagementTemplates: { mount: () => ({ ready: Promise.resolve(), destroy() {} }) },
    IneburaDunningManagementReport: { mount: () => ({ refresh() {}, destroy() {} }) }
  };
  vm.runInNewContext(fs.readFileSync(__dirname + '/dunning-management.js', 'utf8'), { window: host, URLSearchParams, Intl, Date, setTimeout, clearTimeout });
  const mounted = host.IneburaDunningManagement.mount(container, { api });
  const html = () => nodes.get('[data-dm-invoices]').innerHTML;
  assert.match(html(), /Last letter sent/);
  assert.match(html(), /INV-001/); assert.match(html(), /INV-002/);
  listeners.change({ target: { value: '2', matches: selector => selector === '[data-dm-invoice-stage]' } });
  assert.match(html(), /INV-001/); assert.doesNotMatch(html(), /INV-002/);
  assert.match(html(), /value="2" selected/);
  assert.ok(focused > 0, 're-rendered stage control regains focus');
  listeners.input({ target: { value: 'INV-002', selectionStart: 7, dataset: { dmSearch: 'invoices' }, matches: selector => selector === '[data-dm-search]' } });
  assert.match(html(), /No invoices match these filters/);
  listeners.input({ target: { value: '', selectionStart: 0, dataset: { dmSearch: 'invoices' }, matches: selector => selector === '[data-dm-search]' } });
  const navigate = async section => listeners.click({ target: { closest: selector => selector === '[data-dm-section]' ? { dataset: { dmSection: section } } : null } });
  await navigate('activity'); await navigate('invoices'); mounted.refresh();
  assert.match(html(), /value="2" selected/);
  assert.match(html(), /INV-001/); assert.doesNotMatch(html(), /INV-002/);
  listeners.change({ target: { value: 'not-sent', matches: selector => selector === '[data-dm-invoice-stage]' } });
  assert.match(html(), /INV-003/); assert.doesNotMatch(html(), /INV-001/);
  const authorizedHtml = html();
  actor.role = 'agent';
  listeners.change({ target: { value: '1', matches: selector => selector === '[data-dm-invoice-stage]' } });
  assert.match(container.innerHTML, /Access restricted/);
  assert.equal(html(), authorizedHtml, 'unauthorized handler does not render filtered invoice data');
  assert.equal(JSON.stringify(state), before);
  mounted.destroy();
});

test('actual daily sending keeps last-sent filters independent from next batch stage, failed retries and same-customer batches', () => {
  const core = createInstance({ context: () => admin });
  core.setEnabled(true, admin);
  core.getState().templates.forEach(template => core.saveTemplate({ ...template, standardReady: true }, admin));
  core.syncInvoices([{
    id: 'live-customer', name: 'Live Customer', contacts: ['one@example.test', 'two@example.test'],
    invoices: [
      { id: 'live-early', invoiceNo: 'LIVE-EARLY', amount: 1000, dueDate: '2026-10-01' },
      { id: 'live-later', invoiceNo: 'LIVE-LATER', amount: 1200, dueDate: '2026-10-08' }
    ]
  }], admin);
  core.saveStrategy({
    name: 'Participation daily cycle', status: 'active', firstStageDays: 15,
    filters: { invoiceIds: ['live-early', 'live-later'] },
    stages: [{ templateId: 'dunning-template-1', intervalDays: 0 }, { templateId: 'dunning-template-2', intervalDays: 7 }, { templateId: 'dunning-template-3', intervalDays: 7 }]
  }, admin);
  core.runDaily('2026-10-16', { actor: admin, outcome: 'partial' });
  let rows = byId(view(core.getState(), { search: 'LIVE-' }));
  assert.equal(rows['live-early'].lastSentStage, 1);
  assert.equal(rows['live-later'].lastSentStage, null);
  assert.equal(core.getState().batches.find(batch => batch.invoiceIds.includes('live-early')).stage, 2);
  core.runDaily('2026-10-23', { actor: admin, outcome: 'failure' });
  rows = byId(view(core.getState(), { search: 'LIVE-' }));
  assert.equal(rows['live-early'].lastSentStage, 1);
  assert.equal(rows['live-later'].lastSentStage, null);
  core.runDaily('2026-10-24', { actor: admin, outcome: 'success' });
  rows = byId(view(core.getState(), { search: 'LIVE-' }));
  assert.equal(rows['live-early'].lastSentStage, 2);
  assert.equal(rows['live-later'].lastSentStage, 1);
  assert.deepEqual(ids(view(core.getState(), { search: 'LIVE-', stage: '1' })), ['live-later']);
  const before = clone(core.getState());
  view(core.getState(), { stage: '2' });
  assert.deepEqual(core.getState(), before);
});
