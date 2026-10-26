'use strict';

// Run with Node. These fixtures deliberately span clients, similarly named subclients,
// personal/team assignments and overlapping MIS scopes.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const core = require('./mis-access-core.js');
const { KEY, seed, createStore } = require('./mis-access-store.js');

const admin = { id: 'admin', role: 'ADMIN', status: 'Active' };
const copy = value => JSON.parse(JSON.stringify(value));
const ids = rows => rows.map(row => row.id).sort();
const visible = (state, userId) => ids(core.visibleInvoices(state, userId));
const user = (state, userId) => state.users.find(row => row.id === userId);
function fixture() {
  const person = (id, role, extra = {}) => ({ id, name: id, email: `${id}@example.test`, role, status: 'Active', ...extra });
  return {
    version: 1,
    revision: 0,
    clients: [{ id: 'c1', name: 'First Client' }, { id: 'c2', name: 'Second Client' }],
    subclients: [
      { id: 's1', name: 'North', clientId: 'c1' }, { id: 's2', name: 'West', clientId: 'c1' },
      { id: 's3', name: 'North', clientId: 'c2' }, { id: 's4', name: 'South', clientId: 'c2' },
    ],
    users: [
      person('a', 'AGENT'), person('b', 'AGENT', { reportingTo: 'acm' }), person('c', 'AGENT'),
      person('acm', 'AGENTCUMMANAGER'), person('off', 'AGENT', { status: 'Suspended' }),
      person('m1', 'MIS MANAGER'), person('m2', 'MIS MANAGER'), person('m-off', 'MIS MANAGER', { status: 'Suspended' }),
      person('u-client', 'MIS', { managerId: 'm1', access: { mode: 'client', clientId: 'c1' } }),
      person('u-sub', 'MIS', { managerId: 'm1', access: { mode: 'subclients', subclientIds: ['s1'] } }),
      person('u-agent', 'MIS', { managerId: 'm2', access: { mode: 'assignees', assigneeIds: ['a', 'acm'] } }),
      person('u-overlap', 'MIS', { managerId: 'm2', access: { mode: 'assignees', assigneeIds: ['a'] } }),
      person('u-off', 'MIS', { managerId: 'm1', status: 'Suspended', access: { mode: 'client', clientId: 'c2' } }),
    ],
    invoices: [
      ['i1', 'c1', 's1', 'a'], ['i2', 'c1', 's2', 'a'], ['i3', 'c1', 's1', 'b'],
      ['i4', 'c1', 's2', 'acm'], ['i5', 'c2', 's3', 'a'], ['i6', 'c2', 's4', 'b'],
      ['i7', 'c2', 's4', 'acm'], ['i8', 'c2', 's3', 'c'], ['i9', 'c1', 's1', ''],
    ].map(([id, clientId, subclientId, assigneeId], index) => ({ id, invoiceNo: `INV-${index + 1}`, clientId, subclientId, assigneeId, outstanding: (index + 1) * 100 })),
    audit: [],
  };
}
function unchangedFailure(state, operation, pattern) {
  const before = JSON.stringify(state);
  assert.throws(operation, pattern);
  assert.equal(JSON.stringify(state), before, 'rejected action must not mutate input state');
}
function pureChange(state, operation) {
  const before = JSON.stringify(state);
  const result = operation();
  assert.notEqual(result, state);
  assert.equal(JSON.stringify(state), before, 'successful action must leave input state unchanged');
  assert.equal(result.revision, state.revision + 1);
  assert.equal(result.audit.length, state.audit.length + 1);
  return result;
}
function storageFixture(state = fixture()) {
  const values = new Map([[KEY, JSON.stringify(state)]]);
  let writes = 0, dispatches = 0;
  const storage = {
    getItem: key => values.has(key) ? values.get(key) : null,
    setItem: (key, value) => { writes++; values.set(key, value); },
  };
  const api = createStore(storage, () => { dispatches++; });
  return { api, values, storage, writes: () => writes, dispatches: () => dispatches };
}

const tests = [];
const test = (name, run) => tests.push({ name, run });

test('primary-only client, subclient and assignee modes retain their original data boundaries', () => {
  const state = fixture();
  assert.deepEqual(visible(state, 'u-client'), ['i1', 'i2', 'i3', 'i4', 'i9']);
  assert.deepEqual(visible(state, 'u-sub'), ['i1', 'i3', 'i9']);
  assert.deepEqual(visible(state, 'u-agent'), ['i1', 'i2', 'i4', 'i5', 'i7']);
  assert.ok(!visible(state, 'u-sub').includes('i5'), 'same-named North subclient under another client is excluded');
  assert.ok(!visible(state, 'u-agent').includes('i3'), 'Agent cum Manager does not grant their team member’s invoice');
});

test('primary-only multi-subclient access includes all assignees within selected subclient IDs', () => {
  const state = fixture();
  user(state, 'u-sub').access.subclientIds = ['s1', 's3', 's1'];
  assert.deepEqual(visible(state, 'u-sub'), ['i1', 'i3', 'i5', 'i8', 'i9']);
});

test('manager union excludes inactive reports and counts overlapping invoices once', () => {
  const state = fixture();
  assert.deepEqual(visible(state, 'm1'), ['i1', 'i2', 'i3', 'i4', 'i9']);
  assert.deepEqual(visible(state, 'm2'), ['i1', 'i2', 'i4', 'i5', 'i7']);
  state.invoices.push(copy(state.invoices[0]));
  assert.equal(core.visibleInvoices(state, 'm2').length, 5);
  assert.match(core.scopeSummary(state, 'm2'), /2 reporting MIS users/);
});

test('unknown identities, inactive roles and invalid mappings never widen visibility', () => {
  const state = fixture();
  for (const id of ['missing', 'u-off', 'm-off', 'a', 'b']) assert.deepEqual(visible(state, id), [], id);
  for (const access of [null, { mode: 'all' }, { mode: 'client', clientId: 'missing' }, { mode: 'subclients', subclientIds: [] }, { mode: 'subclients', subclientIds: ['missing'] }, { mode: 'assignees', assigneeIds: ['off'] }, { mode: 'assignees', assigneeIds: ['m1'] }, { mode: 'assignees', assigneeIds: ['a', 'missing'] }]) {
    user(state, 'u-client').access = access;
    assert.deepEqual(visible(state, 'u-client'), [], JSON.stringify(access));
  }
});

test('returned invoice rows are detached from persisted state', () => {
  const state = fixture();
  const rows = core.visibleInvoices(state, 'u-agent');
  rows[0].assigneeId = 'c'; rows[0].outstanding = 0;
  assert.equal(state.invoices[0].assigneeId, 'a');
  assert.equal(state.invoices[0].outstanding, 100);
});

test('canonical access deduplicates both levels while complete-client mode discards other fields', () => {
  const state = fixture();
  const updated = pureChange(state, () => core.saveUser(state, { ...user(state, 'u-agent'), access: { mode: 'subclients', subclientIds: ['s2', 's2'], clientId: 'c2', assigneeIds: ['a', 'acm'] } }, admin));
  assert.deepEqual(user(updated, 'u-agent').access, { mode: 'subclients', subclientIds: ['s2'], assigneeIds: ['a', 'acm'] });
  assert.deepEqual(visible(updated, 'u-agent'), ['i2', 'i4']);
  const client = core.saveUser(updated, { ...user(updated, 'u-agent'), access: { mode: 'client', clientId: 'c2', subclientIds: ['s1'], assigneeIds: ['a'] } }, admin);
  assert.deepEqual(user(client, 'u-agent').access, { mode: 'client', clientId: 'c2' });
  assert.deepEqual(visible(client, 'u-agent'), ['i5', 'i6', 'i7', 'i8']);
});

test('both filter orders intersect identical sets and include only personally assigned ACM invoices', () => {
  const state = fixture();
  user(state, 'u-agent').access = { mode: 'assignees', assigneeIds: ['a', 'acm'], subclientIds: ['s1', 's4'] };
  user(state, 'u-sub').access = { mode: 'subclients', subclientIds: ['s1', 's4'], assigneeIds: ['a', 'acm'] };
  assert.deepEqual(visible(state, 'u-agent'), ['i1', 'i7']);
  assert.deepEqual(visible(state, 'u-sub'), ['i1', 'i7']);
  assert.ok(!visible(state, 'u-agent').includes('i3'), 'ACM team member’s invoice remains outside the selected users');
  assert.ok(!visible(state, 'u-agent').includes('i5'), 'the selected agent’s other subclients remain outside the intersection');
  assert.ok(!visible(state, 'u-sub').includes('i6'), 'other agents in a selected subclient remain excluded');
  user(state, 'u-agent').access = { mode: 'assignees', assigneeIds: ['acm'], subclientIds: ['s1', 's2'] };
  user(state, 'u-sub').access = { mode: 'subclients', subclientIds: ['s1', 's2'], assigneeIds: ['acm'] };
  assert.deepEqual(visible(state, 'u-agent'), ['i4']);
  assert.deepEqual(visible(state, 'u-sub'), ['i4']);
});

test('primary-only legacy scopes and empty optional filters retain their original boundaries', () => {
  const state = fixture();
  for (const secondary of [undefined, []]) {
    const assignees = { mode: 'assignees', assigneeIds: ['a'] };
    const subclients = { mode: 'subclients', subclientIds: ['s1'] };
    if (secondary !== undefined) { assignees.subclientIds = secondary; subclients.assigneeIds = secondary; }
    user(state, 'u-agent').access = assignees; user(state, 'u-sub').access = subclients;
    assert.deepEqual(visible(state, 'u-agent'), ['i1', 'i2', 'i5']);
    assert.deepEqual(visible(state, 'u-sub'), ['i1', 'i3', 'i9']);
    assert.deepEqual(core.cleanAccess(assignees), { mode: 'assignees', assigneeIds: ['a'] });
    assert.deepEqual(core.cleanAccess(subclients), { mode: 'subclients', subclientIds: ['s1'] });
  }
  const complete = { mode: 'client', clientId: 'c1', assigneeIds: 'malformed-ignored-field', subclientIds: null };
  user(state, 'u-client').access = complete;
  assert.deepEqual(core.cleanAccess(complete), { mode: 'client', clientId: 'c1' });
  assert.deepEqual(visible(state, 'u-client'), ['i1', 'i2', 'i3', 'i4', 'i9']);
  assert.match(core.scopeSummary(state, 'u-agent'), /All subclients across clients/);
  assert.match(core.scopeSummary(state, 'u-sub'), /All assignees within selected subclients/);
});

test('valid zero-match restrictions survive saving and ordinary invoice movement in either order', () => {
  for (const access of [
    { mode: 'assignees', assigneeIds: ['a'], subclientIds: ['s4'] },
    { mode: 'subclients', subclientIds: ['s4'], assigneeIds: ['a'] },
  ]) {
    const state = fixture();
    const saved = pureChange(state, () => core.saveUser(state, { ...user(state, 'u-agent'), access }, admin));
    assert.deepEqual(user(saved, 'u-agent').access, access);
    assert.deepEqual(visible(saved, 'u-agent'), [], 'a valid intersection with no current invoices stays empty');
    assert.match(core.scopeSummary(saved, 'u-agent'), /Second Client \/ South/);
    assert.match(core.scopeSummary(saved, 'u-agent'), /Selected users: a/);
    assert.doesNotMatch(core.scopeSummary(saved, 'u-agent'), /All subclients|All assignees/);
    const assigned = core.reassignInvoice(saved, 'i6', 'a', admin);
    assert.deepEqual(visible(assigned, 'u-agent'), ['i6']);
    const removed = core.reassignInvoice(assigned, 'i6', 'b', admin);
    assert.deepEqual(visible(removed, 'u-agent'), []);
    assert.deepEqual(user(removed, 'u-agent').access, access);
  }
});

test('malformed secondary selections fail closed instead of becoming unrestricted filters', () => {
  for (const mode of ['assignees', 'subclients']) {
    const secondary = mode === 'assignees' ? 'subclientIds' : 'assigneeIds';
    for (const malformed of [null, 's1', 'a', {}, 1, false]) {
      const state = fixture(), access = mode === 'assignees' ? { mode, assigneeIds: ['a'], [secondary]: malformed } : { mode, subclientIds: ['s1'], [secondary]: malformed };
      user(state, 'u-agent').access = access;
      assert.equal(core.cleanAccess(access), null);
      assert.throws(() => core.validateAccess(state, access), /secondary filter|Select/);
      assert.deepEqual(visible(state, 'u-agent'), []);
      assert.equal(core.scopeSummary(state, 'u-agent'), 'Access mapping incomplete');
      unchangedFailure(state, () => core.saveUser(state, user(state, 'u-agent'), admin), /Select/);
    }
  }
});

test('secondary filters require existing subclients and active assignable users without invoice-overlap validation', () => {
  const state = fixture();
  for (const access of [
    { mode: 'assignees', assigneeIds: ['a'], subclientIds: ['missing'] },
    { mode: 'subclients', subclientIds: ['s1'], assigneeIds: ['missing'] },
    { mode: 'subclients', subclientIds: ['s1'], assigneeIds: ['off'] },
    { mode: 'subclients', subclientIds: ['s1'], assigneeIds: ['m1'] },
    { mode: 'subclients', subclientIds: ['s1'], assigneeIds: ['a', 'off'] },
  ]) {
    unchangedFailure(state, () => core.saveUser(state, { ...user(state, 'u-agent'), access }, admin), /Select/);
    user(state, 'u-agent').access = access;
    assert.deepEqual(visible(state, 'u-agent'), []);
  }
  const empty = core.saveUser(state, { ...user(state, 'u-agent'), access: { mode: 'subclients', subclientIds: ['s1'], assigneeIds: ['c'] } }, admin);
  assert.deepEqual(visible(empty, 'u-agent'), []);
  assert.deepEqual(user(empty, 'u-agent').access.assigneeIds, ['c']);
});

test('manager union combines reporting-user intersections without forming a Cartesian product', () => {
  const state = fixture();
  user(state, 'u-agent').access = { mode: 'assignees', assigneeIds: ['a'], subclientIds: ['s1'] };
  user(state, 'u-overlap').access = { mode: 'subclients', subclientIds: ['s4'], assigneeIds: ['acm'] };
  user(state, 'u-sub').managerId = 'm2';
  user(state, 'u-sub').access = { mode: 'subclients', subclientIds: ['s1'], assigneeIds: ['a'] };
  assert.deepEqual(visible(state, 'm2'), ['i1', 'i7']);
  assert.equal(core.visibleInvoices(state, 'm2').length, 2, 'overlapping intersections count each invoice once');
  assert.ok(!visible(state, 'm2').includes('i3'), 'the union does not grant another agent inside a selected subclient');
  const moved = core.saveUser(state, { ...user(state, 'u-overlap'), managerId: 'm1' }, admin);
  assert.deepEqual(visible(moved, 'm2'), ['i1']);
  user(moved, 'u-sub').status = 'Suspended';
  assert.deepEqual(visible(moved, 'm2'), ['i1'], 'another active report preserves the independent overlap');
  user(moved, 'u-agent').status = 'Suspended';
  assert.deepEqual(visible(moved, 'm2'), []);
});

test('fallback retags either filter order while retaining selected subclients and manager/report boundaries', () => {
  const reportAccess = require('./mis-reports-access.js');
  const state = fixture();
  user(state, 'u-agent').access = { mode: 'assignees', assigneeIds: ['a'], subclientIds: ['s1'] };
  user(state, 'u-overlap').access = { mode: 'subclients', subclientIds: ['s1'], assigneeIds: ['a'] };
  assert.deepEqual(visible(state, 'm2'), ['i1']);
  const next = pureChange(state, () => core.transitionUser(state, 'a', 'suspend', 'b', admin));
  assert.deepEqual(user(next, 'u-agent').access, { mode: 'assignees', assigneeIds: ['b'], subclientIds: ['s1'] });
  assert.deepEqual(user(next, 'u-overlap').access, { mode: 'subclients', subclientIds: ['s1'], assigneeIds: ['b'] });
  assert.deepEqual(visible(next, 'u-agent'), ['i1', 'i3']);
  assert.deepEqual(visible(next, 'u-overlap'), ['i1', 'i3']);
  assert.deepEqual(visible(next, 'm2'), ['i1', 'i3']);
  for (const id of ['u-agent', 'u-overlap', 'm2']) {
    const context = reportAccess.context({ state: next, search: `?misUser=${id}` }, core);
    assert.deepEqual(ids(reportAccess.resolve(core, next, context).rowMetadata.map(row => ({ id: row.invoiceId }))), ['i1', 'i3']);
  }
  assert.ok(!visible(next, 'm2').includes('i6'), 'fallback does not add B’s portfolio outside selected subclients');
  const reactivated = core.transitionUser(next, 'a', 'reactivate', '', admin);
  assert.deepEqual(user(reactivated, 'u-overlap').access.assigneeIds, ['b']);
  assert.deepEqual(user(reactivated, 'u-overlap').access.subclientIds, ['s1']);
  const moved = core.reassignInvoice(reactivated, 'i3', 'c', admin);
  assert.deepEqual(visible(moved, 'm2'), ['i1']);
});

test('repeated fallback deduplicates secondary and primary assignees without dropping zero-match constraints', () => {
  const state = fixture();
  user(state, 'u-agent').access = { mode: 'assignees', assigneeIds: ['a', 'b'], subclientIds: ['s2'] };
  user(state, 'u-overlap').access = { mode: 'subclients', subclientIds: ['s2'], assigneeIds: ['a', 'b'] };
  const first = core.transitionUser(state, 'a', 'suspend', 'b', admin);
  for (const id of ['u-agent', 'u-overlap']) {
    assert.deepEqual(user(first, id).access.assigneeIds, ['b']);
    assert.deepEqual(user(first, id).access.subclientIds, ['s2']);
    assert.deepEqual(visible(first, id), ['i2']);
  }
  const second = core.transitionUser(first, 'b', 'delete', 'c', admin);
  for (const id of ['u-agent', 'u-overlap']) {
    assert.deepEqual(user(second, id).access.assigneeIds, ['c']);
    assert.deepEqual(user(second, id).access.subclientIds, ['s2']);
    assert.deepEqual(visible(second, id), ['i2']);
  }
  const zero = core.reassignInvoice(second, 'i2', 'acm', admin);
  assert.deepEqual(visible(zero, 'u-overlap'), []);
  assert.deepEqual(user(zero, 'u-overlap').access, { mode: 'subclients', subclientIds: ['s2'], assigneeIds: ['c'] });
});

test('fallback never converts malformed secondary restrictions into an unrestricted portfolio', () => {
  const state = fixture();
  user(state, 'u-agent').access = { mode: 'assignees', assigneeIds: ['a'], subclientIds: 's1' };
  user(state, 'u-overlap').access = { mode: 'subclients', subclientIds: ['s1'], assigneeIds: 'a' };
  const next = core.transitionUser(state, 'a', 'suspend', 'b', admin);
  assert.deepEqual(user(next, 'u-agent').access, { mode: 'assignees', assigneeIds: ['b'], subclientIds: 's1' });
  assert.deepEqual(visible(next, 'u-agent'), []);
  assert.deepEqual(visible(next, 'u-overlap'), []);
  assert.deepEqual(visible(next, 'm2'), []);
});

test('fallback preserves a valid restriction even when the replacement has no matching invoices', () => {
  for (const mode of ['assignees', 'subclients']) {
    const state = fixture(), access = mode === 'assignees'
      ? { mode, assigneeIds: ['a'], subclientIds: ['s4'] }
      : { mode, subclientIds: ['s4'], assigneeIds: ['a'] };
    user(state, 'u-agent').access = access;
    const next = core.transitionUser(state, 'a', 'delete', 'c', admin);
    assert.deepEqual(user(next, 'u-agent').access.subclientIds, ['s4']);
    assert.deepEqual(user(next, 'u-agent').access.assigneeIds, ['c']);
    assert.deepEqual(visible(next, 'u-agent'), []);
    const later = core.reassignInvoice(next, 'i6', 'c', admin);
    assert.deepEqual(visible(later, 'u-agent'), ['i6']);
  }
});

test('MIS users require exactly one active MIS Manager and valid explicit access', () => {
  const state = fixture();
  for (const managerId of ['', 'missing', 'm-off', 'a', ['m1', 'm2']]) unchangedFailure(state, () => core.saveUser(state, { ...user(state, 'u-sub'), managerId }, admin), /one active MIS Manager/);
  for (const access of [null, { mode: 'client', clientId: '' }, { mode: 'subclients', subclientIds: [] }, { mode: 'assignees', assigneeIds: ['off'] }, { mode: 'assignees', assigneeIds: ['m1'] }]) unchangedFailure(state, () => core.saveUser(state, { ...user(state, 'u-sub'), access }, admin), /Select/);
});

test('unknown roles, duplicate emails, role changes and lifecycle bypasses reject atomically', () => {
  const state = fixture();
  unchangedFailure(state, () => core.saveUser(state, { id: 'unrecognised', name: 'Unknown', email: 'unknown@example.test', role: 'SUPERUSER', status: 'Active' }, admin), /role/i);
  unchangedFailure(state, () => core.saveUser(state, { ...user(state, 'u-sub'), email: 'U-CLIENT@example.test' }, admin), /email/);
  unchangedFailure(state, () => core.saveUser(state, { ...user(state, 'u-sub'), role: 'MIS MANAGER' }, admin), /Role changes/);
  unchangedFailure(state, () => core.saveUser(state, { ...user(state, 'u-sub'), status: 'Suspended' }, admin), /Suspend, Delete or Reactivate/);
  for (const action of ['suspend', 'delete', 'reactivate']) unchangedFailure(state, () => core.transitionUser(state, 'u-sub', action, 'm2', admin), /pending team clarification/);
});

test('only an active Admin can directly invoke all mutation handlers', () => {
  const state = fixture();
  for (const actor of [null, { id: 'admin', role: 'ADMIN' }, { id: 'm1', role: 'MIS MANAGER', status: 'Active' }, { id: 'u-sub', role: 'MIS', status: 'Active' }, { id: 'a', role: 'AGENT', status: 'Active' }, { ...admin, status: 'Suspended' }, { ...admin, status: 'Deleted' }]) {
    for (const operation of [() => core.saveUser(state, user(state, 'u-sub'), actor), () => core.transitionUser(state, 'a', 'suspend', 'b', actor), () => core.reassignInvoice(state, 'i1', 'b', actor)]) unchangedFailure(state, operation, /Only Admin/);
  }
});

test('ordinary reassignment removes agent scope immediately but preserves client/subclient access', () => {
  const state = fixture();
  const next = pureChange(state, () => core.reassignInvoice(state, 'i1', 'b', admin));
  assert.deepEqual(visible(next, 'u-agent'), ['i2', 'i4', 'i5', 'i7']);
  assert.deepEqual(visible(next, 'u-overlap'), ['i2', 'i5']);
  assert.deepEqual(visible(next, 'm2'), ['i2', 'i4', 'i5', 'i7']);
  assert.deepEqual(visible(next, 'u-sub'), ['i1', 'i3', 'i9']);
  assert.deepEqual(visible(next, 'u-client'), ['i1', 'i2', 'i3', 'i4', 'i9']);
  assert.equal(next.audit.at(-1).previousAssigneeId, 'a');
  unchangedFailure(state, () => core.reassignInvoice(state, 'missing', 'b', admin), /Invoice/);
  for (const assigneeId of ['missing', 'off', 'm1']) unchangedFailure(state, () => core.reassignInvoice(state, 'i1', assigneeId, admin), /active Agent/);
});

test('mapped destination retains invoices after ordinary reassignment', () => {
  const state = fixture();
  user(state, 'u-agent').access.assigneeIds.push('b');
  const next = core.reassignInvoice(state, 'i1', 'b', admin);
  assert.deepEqual(visible(next, 'u-agent'), ['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7']);
});

test('unrestricted assignee fallback transfers invoices/tags and exposes fallback’s existing personal portfolio', () => {
  const state = fixture();
  const next = pureChange(state, () => core.transitionUser(state, 'a', 'suspend', 'b', admin));
  assert.equal(user(next, 'a').status, 'Suspended');
  assert.deepEqual(user(next, 'u-agent').access.assigneeIds, ['b', 'acm']);
  assert.deepEqual(user(next, 'u-overlap').access.assigneeIds, ['b']);
  assert.equal(next.invoices.filter(row => row.assigneeId === 'a').length, 0);
  assert.deepEqual(visible(next, 'u-overlap'), ['i1', 'i2', 'i3', 'i5', 'i6']);
  assert.deepEqual(visible(next, 'u-agent'), ['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7']);
  assert.deepEqual(visible(next, 'm2'), ['i1', 'i2', 'i3', 'i4', 'i5', 'i6', 'i7']);
  assert.deepEqual(visible(next, 'u-sub'), visible(state, 'u-sub'));
  assert.deepEqual(visible(next, 'u-client'), visible(state, 'u-client'));
});

test('fallback rejects missing, self, inactive and wrong-role replacements without mutation', () => {
  const state = fixture();
  for (const action of ['delete', 'suspend']) {
    for (const replacement of ['', 'a', 'missing', 'off', 'm1']) unchangedFailure(state, () => core.transitionUser(state, 'a', action, replacement, admin), /active fallback/);
    for (const replacement of ['', 'm1', 'missing', 'm-off', 'a']) unchangedFailure(state, () => core.transitionUser(state, 'm1', action, replacement, admin), /active replacement MIS Manager/);
  }
});

test('repeated fallback follows the latest assignee and deduplicates existing mappings', () => {
  const state = fixture();
  user(state, 'u-overlap').access.assigneeIds.push('b', 'c');
  const first = core.transitionUser(state, 'a', 'suspend', 'b', admin);
  assert.deepEqual(user(first, 'u-overlap').access.assigneeIds, ['b', 'c']);
  const second = core.transitionUser(first, 'b', 'delete', 'c', admin);
  assert.deepEqual(user(second, 'u-overlap').access.assigneeIds, ['c']);
  assert.deepEqual(user(second, 'u-agent').access.assigneeIds, ['c', 'acm']);
  assert.deepEqual(visible(second, 'u-overlap'), ['i1', 'i2', 'i3', 'i5', 'i6', 'i8']);
  assert.equal(user(second, 'b').status, 'Deleted');
  assert.equal(second.invoices.filter(row => ['a', 'b'].includes(row.assigneeId)).length, 0);
});

test('reactivation never restores a former agent mapping or transferred invoices', () => {
  const state = core.transitionUser(fixture(), 'a', 'suspend', 'b', admin);
  const next = pureChange(state, () => core.transitionUser(state, 'a', 'reactivate', '', admin));
  assert.equal(user(next, 'a').status, 'Active');
  assert.deepEqual(user(next, 'u-overlap').access.assigneeIds, ['b']);
  assert.deepEqual(visible(next, 'u-overlap'), ['i1', 'i2', 'i3', 'i5', 'i6']);
  assert.equal(next.invoices.filter(row => row.assigneeId === 'a').length, 0);
  const moved = core.reassignInvoice(next, 'i1', 'c', admin);
  assert.ok(!visible(moved, 'u-overlap').includes('i1'), 'later reassignment to an untagged agent removes access');
});

test('Agent cum Manager fallback transfers only personal invoices and leaves team assignments intact', () => {
  const state = fixture();
  const next = core.transitionUser(state, 'acm', 'delete', 'c', admin);
  assert.equal(next.invoices.find(row => row.id === 'i3').assigneeId, 'b');
  assert.equal(next.invoices.find(row => row.id === 'i4').assigneeId, 'c');
  assert.equal(next.invoices.find(row => row.id === 'i7').assigneeId, 'c');
  assert.ok(!visible(next, 'u-agent').includes('i3'));
  assert.ok(visible(next, 'u-agent').includes('i8'), 'new fallback portfolio becomes visible');
});

test('moving an MIS User updates managers immediately and preserves independent overlaps', () => {
  const state = fixture();
  const next = pureChange(state, () => core.saveUser(state, { ...user(state, 'u-agent'), managerId: 'm1' }, admin));
  assert.deepEqual(visible(next, 'm2'), ['i1', 'i2', 'i5']);
  assert.deepEqual(visible(next, 'm1'), ['i1', 'i2', 'i3', 'i4', 'i5', 'i7', 'i9']);
  assert.equal(user(next, 'u-agent').managerId, 'm1');
});

test('manager suspension and deletion transfer reporting MIS users to one active replacement', () => {
  for (const action of ['suspend', 'delete']) {
    const state = fixture();
    const next = pureChange(state, () => core.transitionUser(state, 'm1', action, 'm2', admin));
    assert.deepEqual(next.users.filter(row => row.managerId === 'm1'), []);
    assert.equal(user(next, 'u-client').managerId, 'm2');
    assert.equal(user(next, 'u-sub').managerId, 'm2');
    assert.equal(user(next, 'u-off').managerId, 'm2');
    assert.deepEqual(visible(next, 'm1'), []);
    assert.deepEqual(visible(next, 'm2'), ['i1', 'i2', 'i3', 'i4', 'i5', 'i7', 'i9']);
  }
});

test('store persists current grants and fresh instances observe assignment changes', () => {
  const { api, storage, writes, dispatches } = storageFixture();
  api.reassignInvoice('i1', 'b', admin, 0);
  assert.equal(writes(), 1); assert.equal(dispatches(), 1);
  const reopened = createStore(storage);
  assert.deepEqual(visible(reopened.getState(), 'u-agent'), ['i2', 'i4', 'i5', 'i7']);
  const detached = reopened.getState(); detached.users[0].name = 'Changed outside store';
  assert.notEqual(reopened.getState().users[0].name, 'Changed outside store');
});

test('stale revision and denied store actions leave storage and dispatch untouched', () => {
  const { api, values, writes, dispatches } = storageFixture();
  api.reassignInvoice('i1', 'b', admin, 0);
  const before = values.get(KEY), beforeWrites = writes(), beforeDispatches = dispatches();
  assert.throws(() => api.transitionUser('a', 'suspend', 'b', admin, 0), /changed in another view/);
  assert.throws(() => api.saveUser(user(api.getState(), 'u-sub'), { role: 'MIS', status: 'Active' }, 1), /Only Admin/);
  assert.equal(values.get(KEY), before); assert.equal(writes(), beforeWrites); assert.equal(dispatches(), beforeDispatches);
});

test('corrupt or incompatible stored data is not replaced with permissive defaults', () => {
  for (const raw of ['{broken', JSON.stringify({ version: 2, revision: 0, users: [], clients: [], subclients: [], invoices: [] }), JSON.stringify({ version: 1, revision: '0', users: [], clients: [], subclients: [], invoices: [] })]) {
    let writes = 0;
    const api = createStore({ getItem: () => raw, setItem: () => { writes++; } });
    assert.throws(() => api.getState(), /could not be read|incompatible/);
    assert.throws(() => api.reassignInvoice('i1', 'b', admin), /could not be read|incompatible/);
    assert.equal(writes, 0);
  }
});

test('storage failures do not dispatch or partially update saved state', () => {
  const initial = JSON.stringify(fixture()); let dispatches = 0;
  const api = createStore({ getItem: () => initial, setItem: () => { throw new Error('quota'); } }, () => dispatches++);
  assert.throws(() => api.reassignInvoice('i1', 'b', admin), /quota/);
  assert.equal(dispatches, 0);
  assert.deepEqual(visible(api.getState(), 'u-agent'), ['i1', 'i2', 'i4', 'i5', 'i7']);
});

test('synthetic store seed is isolated, deterministic and provides every agreed access mode', () => {
  const first = seed(), second = seed();
  assert.deepEqual(first, second);
  first.users[0].status = 'Deleted';
  assert.equal(second.users[0].status, 'Active');
  assert.deepEqual([...new Set(second.users.filter(row => row.access).map(row => row.access.mode))].sort(), ['assignees', 'client', 'subclients']);
});

test('browser preview actor uses the selected identity and unknown actors cannot invoke Admin actions', () => {
  function browserStore(search, role) {
    const values = new Map([[KEY, JSON.stringify(fixture())]]);
    const window = {
      location: { search }, document: { body: { dataset: { adminRole: role } } }, dispatchEvent() {},
      localStorage: { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) },
    };
    const sandbox = { window, URLSearchParams, CustomEvent: class { constructor(type) { this.type = type; } } };
    for (const filename of ['mis-access-core.js', 'mis-access-store.js']) vm.runInNewContext(fs.readFileSync(`${__dirname}/${filename}`, 'utf8'), sandbox);
    return { api: window.IneburaMisStore, values };
  }
  const adminView = browserStore('', 'ADMIN');
  assert.equal(adminView.api.actor().role, 'ADMIN');
  for (const selected of ['m1', 'u-agent', 'missing']) {
    const { api, values } = browserStore(`?previewActor=${selected}`, 'ADMIN');
    assert.equal(api.actor().id, selected);
    const before = values.get(KEY);
    assert.throws(() => api.reassignInvoice('i1', 'b', api.actor()), /Only Admin/);
    assert.equal(values.get(KEY), before);
  }
});

let failed = 0;
for (const { name, run } of tests) {
  try { run(); console.log(`PASS ${name}`); }
  catch (error) { failed++; console.error(`FAIL ${name}\n${error.stack}`); }
}
if (failed) {
  console.error(`${failed} of ${tests.length} MIS access checks failed.`);
  process.exitCode = 1;
} else console.log(`Passed ${tests.length} MIS access checks: scope isolation, lifecycle transfers, current grants, Admin guards, immutable failures and persistence.`);
