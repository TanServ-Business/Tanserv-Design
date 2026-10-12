#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const ROOT = path.resolve(__dirname, '../../..');
const CONFIG_PATH = path.join(ROOT, 'bin/IssueTracker/js/issue-tracker-config.js');
const TRACKER_PATH = path.join(ROOT, 'bin/IssueTracker/js/issue-tracker-unified.js');
const APP_PATH = path.join(ROOT, 'scripts/app.js');

const readSource = (filePath) => fs.readFileSync(filePath, 'utf8');
const configSource = readSource(CONFIG_PATH);
const trackerSource = readSource(TRACKER_PATH);
const appSource = readSource(APP_PATH);

class LocalStorageFixture {
  constructor(seed = {}) {
    this.values = new Map(Object.entries(seed).map(([key, value]) => [key, String(value)]));
  }

  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; }
  setItem(key, value) { this.values.set(key, String(value)); }
  removeItem(key) { this.values.delete(key); }
  clear() { this.values.clear(); }
}

const json = (value) => JSON.stringify(value);
const parse = (storage, key) => JSON.parse(storage.getItem(key));

const tests = [];
const test = (name, run) => tests.push({ name, run });

function loadConfig(storage) {
  const window = {};
  vm.runInNewContext(configSource, {
    window,
    localStorage: storage,
    console
  }, { filename: CONFIG_PATH });
  return window.IssueTrackerConfig;
}

function section(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker);
  assert.notEqual(start, -1, `Missing source marker: ${startMarker}`);
  const end = endMarker ? source.indexOf(endMarker, start + startMarker.length) : source.length;
  assert.notEqual(end, -1, `Missing source marker: ${endMarker}`);
  return source.slice(start, end);
}

test('clean slate removes issues but preserves invoice containers and unrelated app data', () => {
  const invoices = [
    { id: 'INV_KEEP_1', customer: 'Acme', total: 1200, issues: [{ id: 'ISS_REMOVE_1' }] },
    { id: 'INV_KEEP_2', customer: 'Globex', region: 'North', issues: [{ id: 'ISS_REMOVE_2' }] }
  ];
  const preserved = {
    approval_processes: [{ id: 'PROC_KEEP' }],
    approval_matrices: [{ id: 'MATRIX_KEEP' }],
    approval_requests: [{ id: 'REQUEST_KEEP' }],
    ineburaNotificationCenter: [{ id: 'notification-keep' }],
    ineburaActivityTrailByInvoice: { INV_KEEP_1: [{ type: 'visit' }] },
    customersData: [{ id: 'CUSTOMER_KEEP' }],
    arbitraryAppPreference: { density: 'compact' }
  };
  const seed = {
    issueTrackerBaseData: json(invoices),
    customIssues: json([{ id: 'ISS_REMOVE_CUSTOM' }]),
    issueTrackerTotalIssues: json(3),
    ...Object.fromEntries(Object.entries(preserved).map(([key, value]) => [key, json(value)]))
  };
  const storage = new LocalStorageFixture(seed);
  const config = loadConfig(storage);

  assert.equal(config.ensureCleanSlate(), true);
  const cleanedInvoices = parse(storage, 'issueTrackerBaseData');
  assert.deepEqual(
    cleanedInvoices,
    invoices.map((invoice) => ({ ...invoice, issues: [] })),
    'invoice records and invoice metadata must survive the issue reset'
  );
  assert.deepEqual(parse(storage, 'customIssues'), []);
  assert.equal(parse(storage, 'issueTrackerTotalIssues'), 0);
  for (const [key, expected] of Object.entries(preserved)) {
    assert.deepEqual(parse(storage, key), expected, `${key} must not be reset with issue data`);
  }

  const snapshot = [...storage.values.entries()];
  assert.equal(config.ensureCleanSlate(), false, 'clean-slate migration must only run once per version');
  assert.deepEqual([...storage.values.entries()], snapshot, 'repeat initialization must be idempotent');
});

test('role directory assigns exactly one role per user and derives each role list', () => {
  const config = loadConfig(new LocalStorageFixture());
  const validRoles = ['agent', 'manager', 'approver', 'action-owner'];
  const names = config.users.map((user) => user.name.trim().toLowerCase());
  const ids = config.users.map((user) => user.id);

  assert.equal(new Set(names).size, names.length, 'a person cannot appear under multiple roles');
  assert.equal(new Set(ids).size, ids.length, 'role directory IDs must be unique');
  config.users.forEach((user) => assert.ok(validRoles.includes(user.role), `invalid role for ${user.name}`));

  validRoles.forEach((role) => {
    const expected = config.users.filter((user) => user.role === role).map((user) => user.name);
    const derived = config.usersForRole(role).map((user) => user.name);
    assert.deepEqual(derived, expected, `${role} preview users must be derived from the shared directory`);
    assert.ok(derived.includes(config.defaultUser(role)), `${role} default user must belong to that role`);
    derived.forEach((name) => assert.equal(config.roleOf(name), role));
  });
});

test('issue tracker has no fallback issue seed path', () => {
  assert.doesNotMatch(trackerSource, /\bfunction\s+fallbackData\b/);
  assert.doesNotMatch(trackerSource, /\bfallbackData\s*\(/);
  assert.doesNotMatch(trackerSource, /\bISS_000\d/i, 'demo issue IDs must not be seeded by the tracker runtime');

  const loadData = section(trackerSource, 'function loadData()', 'function normalizeIssue');
  assert.match(loadData, /read\(KEYS\.base,\s*\[\]\)/);
  assert.doesNotMatch(loadData, /\.length\s*\?[^:]+:\s*\w+Data/, 'an empty issue store must stay empty');
});

test('every External dependency can create an issue using the exact selected substatus', () => {
  assert.match(appSource, /normalizeDispositionKey\(dispositionRow\?\.broadStatus\)\s*===\s*["']external dependency["']/);
  assert.match(appSource, /shouldCreateIssue\s*=\s*isExternalDependency\s*&&\s*Boolean\(issueTrackerCheck\?\.checked\)/);

  const creation = section(appSource, 'if (shouldAddIssue) {', '\n      if (isPdcGiven) {');
  assert.match(creation, /title:\s*data\.subStatus\s*,/);
  assert.match(creation, /subStatus:\s*data\.subStatus\s*,/);
  assert.match(creation, /primaryStatus:\s*data\.primaryStatus/);
  assert.match(creation, /broadStatus:\s*data\.broadStatus/);
  assert.doesNotMatch(creation, /title:\s*["']Delivery Challan Required["']/);
  assert.doesNotMatch(creation, /subStatus:\s*["']Delivery Challan Required["']/);
});

test('initial visibility gate does not notify or expose the Action Owner early', () => {
  const creation = section(appSource, 'if (shouldAddIssue) {', '\n      if (isPdcGiven) {');
  assert.match(creation, /workflowStep:\s*skipManagerApproval\s*\?[^\n]+:\s*["']manager-review["']/);
  assert.match(creation, /assignedTo:\s*skipManagerApproval\s*\?[^\n]+:\s*manager/);
  assert.match(creation, /initialVisibilityReleased:\s*skipManagerApproval/);
  assert.doesNotMatch(creation, /addIssueNotification\s*\([^)]*actionOwner/s);

  const notificationSync = section(appSource, 'function syncIssueNotificationsToCenter()', '\nfunction ');
  assert.match(notificationSync, /initialVisibilityReleased/);
  assert.match(
    notificationSync,
    /assigneeRaw\s*=\s*issue\?\.initialVisibilityReleased\s*&&\s*issue\?\.workflowStep\s*===\s*["']resolution-work["']/,
    'Action Owner assignment notification must be gated by initial manager publication'
  );
});

test('approved workflow states and primary actions remain represented', () => {
  [
    'manager-review',
    'agent-correction',
    'approver-l1',
    'resolution-work',
    'resolution-review',
    'resolution-accepted',
    'closed'
  ].forEach((state) => assert.ok(trackerSource.includes(`'${state}'`) || trackerSource.includes(`"${state}"`), `missing workflow state: ${state}`));

  [
    'Provide resolution',
    'Accept and close',
    'Accept resolution',
    'Reject resolution',
    'Reassign action owner',
    'Close issue',
    'Reopen issue'
  ].forEach((label) => assert.ok(trackerSource.includes(label), `missing workflow action: ${label}`));

  assert.match(
    trackerSource,
    /You are \$\{approverLevel[^}]+\} for this issue\. Your approval is required to provide the resolution for this issue\./,
    'approvers must see their level and why their approval is required'
  );
  assert.match(trackerSource, /data-quick-decision="approve"[^>]*>[^<]*<i[^>]*><\/i> Approve<\/button>/, 'manager and approver decisions must use Approve');
  const approvalAction = section(trackerSource, "if (action === 'approve' || action === 'reject')", "if (['accept-close', 'accept-resolution', 'reject-resolution'].includes(action))");
  assert.doesNotMatch(approvalAction, /requireRemark\(\)/, 'approval and rejection decisions must not require a dedicated remark');
});

test('one approval click renders one trail event while preserving the request audit', () => {
  const helperSource = section(trackerSource, 'function sameApprovalMoment', 'function renderActivity');
  const sandbox = {};
  vm.runInNewContext(`
    const cleanName = (value) => String(value || '').replace(/\\s*<[^>]+>\\s*/g, '').trim();
    function samePerson(left, right) { return cleanName(left).toLowerCase() === cleanName(right).toLowerCase(); }
    ${helperSource}
    this.activityHelpers = { mergedActivity, collapseLegacyApprovalDuplicates };
  `, sandbox);

  const at = '2026-08-05T11:21:43.000Z';
  const issue = {
    actionTrail: [{
      who: 'Kavita Nair',
      what: 'accepted approval level 1 and sent to Vikram Singh',
      type: 'approval',
      when: at,
      remark: 'Approved.'
    }]
  };
  const request = {
    currentLevel: 2,
    trail: [{ action: 'approved', by: 'Kavita Nair', level: 1, at, remark: 'Approved.' }]
  };
  assert.equal(sandbox.activityHelpers.mergedActivity(issue, request).length, 1, 'the request audit copy must not render as a second row');
  assert.equal(request.trail.length, 1, 'the request-level audit record must remain stored');

  const legacyManagerTrail = [
    { who: 'Rohit Mehra', what: 'accepted the new issue for processing', type: 'approval', when: at, remark: 'Approved.' },
    { who: 'Rohit Mehra', what: 'sent the issue to Approver 1 (Kavita Nair)', type: 'approval', when: '2026-08-05T11:21:43.500Z', remark: 'Approved.' }
  ];
  const collapsed = sandbox.activityHelpers.collapseLegacyApprovalDuplicates(legacyManagerTrail);
  assert.equal(collapsed.length, 1, 'legacy manager decision and handoff rows must collapse');
  assert.match(collapsed[0].what, /sent the issue to Approver 1/);

  const separateDecision = sandbox.activityHelpers.mergedActivity(issue, {
    currentLevel: 2,
    trail: [{ action: 'approved', by: 'Vikram Singh', level: 2, at: '2026-08-05T11:25:00.000Z', remark: 'Approved.' }]
  });
  assert.equal(separateDecision.length, 2, 'a different approver decision must remain visible');

  const managerApproval = section(trackerSource, 'function decideManagerApproval', 'function decideApproval');
  assert.match(managerApproval, /startMatrixApproval\(invoice, issue, remark, files, by, approvalDescription\)/, 'manager decision and matrix handoff must be recorded as one combined event');
});

function loadProcessChangeFixture(role, user) {
  const issue = {
    id: 'ISS_PROCESS', invoiceNo: 'INV_PROCESS', isCustom: true, title: 'PO Copy Required', subStatus: 'PO Copy Required',
    status: 'Open', agent: 'Aditi Sharma', manager: 'Mukesh Mishra', actionOwner: 'Neha Gupta',
    approvalProcessId: 'PROC_OLD', approvalMatrixId: 'MATRIX_OLD', managerApprovalStatus: 'Approved',
    matrixApprovalStatus: 'pending', workflowStep: 'approver-l2', assignedTo: 'Priya Verma', assignmentRole: 'approver',
    initialVisibilityReleased: true, actionTrail: [], documents: []
  };
  const matrices = [
    { id: 'MATRIX_OLD', name: 'Old route', levels: [{ ownerName: 'Anoop Sharma' }, { ownerName: 'Priya Verma' }] },
    { id: 'MATRIX_NEW', name: 'New route', levels: [{ ownerName: 'Kavita Nair' }, { ownerName: 'Vikram Singh' }] }
  ];
  const storage = new LocalStorageFixture({
    customIssues: json([issue]),
    approval_processes: json([
      { id: 'PROC_OLD', process: 'Old process', matrixId: 'MATRIX_OLD' },
      { id: 'PROC_NEW', process: 'New process', matrixId: 'MATRIX_NEW' }
    ]),
    approval_matrices: json(matrices),
    approval_requests: json([{
      id: 'APR_OLD', issue: { id: issue.id }, status: 'pending', currentLevel: 2,
      levels: matrices[0].levels.map((level, index) => ({ ...level, level: index + 1, status: index ? 'pending' : 'approved' })),
      createdAt: '2026-01-01T00:00:00.000Z', trail: [{ action: 'approved', by: 'Anoop Sharma', level: 1, at: '2026-01-01T00:01:00.000Z' }]
    }])
  });
  const config = loadConfig(storage);
  storage.setItem(config.KEYS.version, config.VERSION);
  const fields = {
    'work-remark': { value: 'Use the revised approval route.', focus() {} },
    'quick-process': { value: 'PROC_NEW' },
    'work-form-error': { textContent: '' },
    'current-action': { innerHTML: '' },
    'quick-action-panel': { innerHTML: '', dataset: {}, classList: { add() {}, remove() {} }, querySelector() { return null; } }
  };
  const location = { search: `?${new URLSearchParams({ role, user })}` };
  const window = { IssueTrackerConfig: config };
  const marker = "  const landing = document.getElementById('issue-tracker-landing');";
  assert.ok(trackerSource.includes(marker));
  // Expose the real runtime functions inside this VM only; production has no test API.
  const source = trackerSource.replace(marker, `
    window.workflowTest = { renderMoreActions, performQuickAction, findRecord, latestRequest, actionState, renderCurrentAction, openQuickActionPanel, decideResolution };
    ${marker}`);
  vm.runInNewContext(source, {
    window, localStorage: storage, location, URLSearchParams, console,
    document: { getElementById: (id) => fields[id] || null, querySelectorAll: () => [] }
  }, { filename: TRACKER_PATH });
  return {
    storage, fields, api: window.workflowTest,
    record: () => window.workflowTest.findRecord('INV_PROCESS', issue.id),
    login(nextRole, nextUser) { location.search = `?${new URLSearchParams({ role: nextRole, user: nextUser })}`; }
  };
}

test('Change process is enabled only for the issue Agent and Manager on open issues', () => {
  const cases = [
    ['agent', 'Aditi Sharma', true], ['manager', 'Mukesh Mishra', true],
    ['agent', 'Rahul Jain', false], ['manager', 'Meera Iyer', false],
    ['approver', 'Priya Verma', false], ['action-owner', 'Neha Gupta', false],
    ['action-owner', 'Aditi Sharma', false]
  ];
  for (const [role, user, allowed] of cases) {
    const fixture = loadProcessChangeFixture(role, user);
    const { invoice, issue } = fixture.record();
    const button = fixture.api.renderMoreActions(issue).match(/<button\b[^>]*data-issue-action="process"[^>]*>/)?.[0];
    assert.ok(button, 'the process action must remain represented in the action menu');
    assert.equal(button.includes('aria-disabled="false"'), allowed, `${role}/${user} action availability`);
    if (!allowed) {
      const before = json(issue);
      const storedBefore = [...fixture.storage.values.entries()];
      assert.equal(fixture.api.performQuickAction('process', invoice, issue, fixture.api.latestRequest(issue.id), []), false);
      assert.equal(json(issue), before, 'blocked handler must not change the issue');
      assert.deepEqual([...fixture.storage.values.entries()], storedBefore, 'blocked handler must not change storage');
    }
    issue.status = 'Closed';
    const closedButton = fixture.api.renderMoreActions(issue).match(/<button\b[^>]*data-issue-action="process"[^>]*>/)?.[0];
    assert.ok(closedButton.includes('aria-disabled="true"'));
    assert.equal(fixture.api.performQuickAction('process', invoice, issue, null, []), false, 'closed issues cannot change process');
  }
});

test('Agent and Manager process changes route through Manager review and preserve approval history', () => {
  for (const [role, user] of [['agent', 'Aditi Sharma'], ['manager', 'Mukesh Mishra']]) {
    for (const decision of ['approve', 'reject']) {
      const fixture = loadProcessChangeFixture(role, user);
      let { invoice, issue } = fixture.record();
      fixture.fields['work-remark'].value = '';
      assert.equal(fixture.api.performQuickAction('process', invoice, issue, fixture.api.latestRequest(issue.id), []), false, 'a process change requires a remark');
      assert.equal(parse(fixture.storage, 'approval_requests')[0].status, 'pending');
      fixture.fields['work-remark'].value = 'Use the revised approval route.';
      fixture.fields['quick-process'].value = 'MISSING_PROCESS';
      assert.equal(fixture.api.performQuickAction('process', invoice, issue, fixture.api.latestRequest(issue.id), []), false, 'invalid processes must not cancel approvals');
      assert.equal(parse(fixture.storage, 'approval_requests')[0].status, 'pending');
      fixture.fields['quick-process'].value = 'PROC_NEW';
      const files = [{ name: 'route-context.pdf', requirement: 'Supporting document' }];
      assert.equal(fixture.api.performQuickAction('process', invoice, issue, fixture.api.latestRequest(issue.id), files), true);
      ({ invoice, issue } = fixture.record());
      assert.equal(issue.pendingProcessId, 'PROC_NEW');
      assert.equal(issue.approvalProcessId, 'PROC_OLD', 'the selected process waits for Manager approval');
      assert.equal(issue.workflowStep, 'manager-review');
      assert.equal(issue.managerApprovalStatus, 'Pending');
      assert.equal(issue.assignedTo, 'Mukesh Mishra');
      assert.equal(issue.assignmentRole, 'manager');
      assert.equal(issue.initialVisibilityReleased, true);
      assert.equal(issue.documents[0].uploadedBy, user);
      const change = issue.actionTrail.at(-1);
      assert.equal(change.type, 'process');
      assert.equal(change.who, user);
      assert.match(change.what, /requested approval process change \(New process\)/);
      assert.equal(change.remark, 'Use the revised approval route.');
      assert.equal(change.files[0].name, 'route-context.pdf');
      let requests = parse(fixture.storage, 'approval_requests');
      assert.equal(requests[0].status, 'superseded');
      assert.equal(requests[0].trail[0].action, 'approved', 'the earlier L1 decision remains in the audit');
      assert.equal(requests[0].trail.at(-1).action, 'superseded');

      fixture.login('manager', 'Mukesh Mishra');
      assert.equal(fixture.api.performQuickAction(decision, invoice, issue, fixture.api.latestRequest(issue.id), []), true);
      ({ issue } = fixture.record());
      requests = parse(fixture.storage, 'approval_requests');
      assert.equal(issue.pendingProcessId, '');
      assert.equal(requests[0].status, 'superseded');
      if (decision === 'approve') {
        assert.equal(issue.approvalProcessId, 'PROC_NEW');
        assert.equal(issue.approvalMatrixId, 'MATRIX_NEW');
        assert.equal(issue.workflowStep, 'approver-l1');
        assert.equal(issue.assignedTo, 'Kavita Nair');
        assert.equal(issue.assignmentRole, 'approver');
        assert.equal(requests.length, 2);
        assert.equal(requests[1].currentLevel, 1);
        assert.equal(requests[1].levels[0].status, 'pending');
        assert.equal(requests[1].levels[1].status, 'waiting');
        assert.match(issue.actionTrail.at(-1).what, /approved the changed approval process.*Approver 1/);
      } else {
        assert.equal(issue.approvalProcessId, 'PROC_OLD');
        assert.equal(issue.approvalMatrixId, 'MATRIX_OLD');
        assert.equal(issue.workflowStep, 'agent-correction');
        assert.equal(issue.assignedTo, 'Aditi Sharma');
        assert.equal(requests.length, 1);
        assert.match(issue.actionTrail.at(-1).what, /rejected the approval process change/);
      }
      assert.equal(issue.actionTrail.at(-1).who, 'Mukesh Mishra');
    }
  }
});

function loadResolutionReviewFixture(role, user) {
  const fixture = loadProcessChangeFixture('action-owner', 'Neha Gupta');
  const { invoice, issue } = fixture.record();
  fixture.fields['work-remark'].value = 'The requested PO copy is attached.';
  assert.equal(fixture.api.performQuickAction('resolution', invoice, issue, fixture.api.latestRequest(issue.id), [{ name: 'po.pdf', requirement: 'PO Copy Required' }]), true);
  fixture.login(role, user);
  return fixture;
}

test('resolution submission assigns and notifies only the issue Agent for review', () => {
  const fixture = loadResolutionReviewFixture('agent', 'Aditi Sharma');
  const { issue } = fixture.record();
  assert.equal(issue.workflowStep, 'resolution-review');
  assert.equal(issue.assignedTo, 'Aditi Sharma');
  assert.equal(issue.assignmentRole, 'agent');
  assert.equal(issue.resolutionVersion, 1);
  assert.equal(parse(fixture.storage, 'approval_requests')[0].status, 'superseded');
  const notifications = parse(fixture.storage, 'ineburaNotificationCenter');
  const review = notifications.filter(note => note.type === 'issue-resolution-review-required');
  assert.equal(review.length, 1);
  assert.deepEqual(review[0].audienceUsers, ['Aditi Sharma']);
  assert.equal(issue.actionTrail.at(-1).who, 'Neha Gupta');
  assert.match(issue.actionTrail.at(-1).what, /assigned the issue to Aditi Sharma for review/);
});

test('only the issue Agent sees resolution review controls or can invoke resolution decisions', () => {
  const cases = [
    ['agent', 'Aditi Sharma', true], ['agent', 'Rahul Jain', false],
    ['manager', 'Mukesh Mishra', false], ['approver', 'Priya Verma', false],
    ['action-owner', 'Neha Gupta', false], ['manager', 'Aditi Sharma', false]
  ];
  for (const [role, user, allowed] of cases) {
    const fixture = loadResolutionReviewFixture(role, user);
    const { invoice, issue } = fixture.record();
    const request = fixture.api.latestRequest(issue.id);
    const state = fixture.api.actionState(issue, role);
    assert.equal(state.key, allowed ? 'resolution-review' : 'waiting', `${role}/${user} review visibility`);
    fixture.api.renderCurrentAction(invoice, issue, state, request);
    assert.equal(fixture.fields['current-action'].innerHTML.includes('data-issue-action="resolution-review"'), allowed);
    fixture.api.openQuickActionPanel('resolution-review', issue, request);
    const panel = fixture.fields['quick-action-panel'].innerHTML;
    for (const decision of ['accept-close', 'accept-resolution', 'reject-resolution']) {
      assert.equal(panel.includes(`data-quick-decision="${decision}"`), allowed);
      if (allowed) continue;
      const before = json(issue);
      const storedBefore = [...fixture.storage.values.entries()];
      const files = [{ name: 'unauthorized.pdf', requirement: 'Supporting document' }];
      assert.equal(fixture.api.performQuickAction(decision, invoice, issue, request, files), false);
      assert.equal(fixture.api.decideResolution(invoice, issue, decision, 'Attempted decision', files), false);
      assert.equal(json(issue), before, 'blocked decisions cannot mutate resolution, documents or trail');
      assert.deepEqual([...fixture.storage.values.entries()], storedBefore, 'blocked decisions cannot persist changes or notifications');
    }
  }
});

test('Agent resolution decisions keep their routing, trail, notifications and one-decision version lock', () => {
  for (const decision of ['accept-close', 'accept-resolution', 'reject-resolution']) {
    const fixture = loadResolutionReviewFixture('agent', 'Aditi Sharma');
    let { invoice, issue } = fixture.record();
    fixture.fields['work-remark'].value = '';
    assert.equal(fixture.api.performQuickAction(decision, invoice, issue, fixture.api.latestRequest(issue.id), []), false, 'resolution decisions still require a remark');
    fixture.fields['work-remark'].value = 'Agent reviewed the submitted resolution.';
    assert.equal(fixture.api.performQuickAction(decision, invoice, issue, fixture.api.latestRequest(issue.id), []), true);
    ({ invoice, issue } = fixture.record());
    assert.equal(issue.resolutionDecisionVersion, issue.resolutionVersion);
    assert.equal(issue.actionTrail.at(-1).who, 'Aditi Sharma');
    assert.equal(issue.actionTrail.at(-1).type, 'resolution');
    assert.equal(issue.actionTrail.at(-1).remark, 'Agent reviewed the submitted resolution.');
    assert.equal(issue.status, decision === 'accept-close' ? 'Closed' : 'Open');
    assert.equal(issue.workflowStep, decision === 'accept-close' ? 'closed' : (decision === 'accept-resolution' ? 'resolution-accepted' : 'resolution-work'));
    assert.equal(issue.assignedTo, decision === 'accept-close' ? '' : (decision === 'accept-resolution' ? 'Aditi Sharma' : 'Neha Gupta'));
    assert.equal(issue.resolutionStatus, decision === 'reject-resolution' ? 'rejected' : 'accepted');
    const note = parse(fixture.storage, 'ineburaNotificationCenter').find(item => item.type === (decision === 'reject-resolution' ? 'issue-resolution-rejected' : 'issue-resolution-accepted'));
    assert.deepEqual(note.audienceUsers, ['Neha Gupta']);
    const storedBefore = [...fixture.storage.values.entries()];
    assert.equal(fixture.api.performQuickAction(decision, invoice, issue, fixture.api.latestRequest(issue.id), []), false, 'a completed version cannot be decided twice');
    assert.deepEqual([...fixture.storage.values.entries()], storedBefore);
    if (decision === 'reject-resolution') {
      fixture.login('action-owner', 'Neha Gupta');
      assert.equal(fixture.api.performQuickAction('resolution', invoice, issue, fixture.api.latestRequest(issue.id), []), true);
      fixture.login('agent', 'Aditi Sharma');
      ({ invoice, issue } = fixture.record());
      assert.equal(issue.resolutionVersion, 2);
      assert.equal(fixture.api.actionState(issue, 'agent').key, 'resolution-review');
      assert.equal(fixture.api.performQuickAction('accept-resolution', invoice, issue, fixture.api.latestRequest(issue.id), []), true);
      assert.equal(fixture.record().issue.resolutionDecisionVersion, 2);
    }
  }
});

test('Manager retains independent Close issue and initial approval without deciding a resolution', () => {
  const fixture = loadResolutionReviewFixture('manager', 'Mukesh Mishra');
  let { invoice, issue } = fixture.record();
  const close = fixture.api.renderMoreActions(issue).match(/<button\b[^>]*data-issue-action="close"[^>]*>/)?.[0];
  assert.ok(close.includes('aria-disabled="false"'));
  assert.equal(fixture.api.performQuickAction('close', invoice, issue, fixture.api.latestRequest(issue.id), []), true);
  ({ issue } = fixture.record());
  assert.equal(issue.status, 'Closed');
  assert.equal(issue.resolutionStatus, 'pending-review', 'independent closure must not accept or reject the resolution');
  assert.notEqual(issue.resolutionDecisionVersion, issue.resolutionVersion);
  assert.equal(issue.actionTrail.at(-1).type, 'closure');
  assert.equal(issue.actionTrail.at(-1).who, 'Mukesh Mishra');

  const initial = loadProcessChangeFixture('manager', 'Mukesh Mishra');
  ({ invoice, issue } = initial.record());
  Object.assign(issue, { workflowStep: 'manager-review', managerApprovalStatus: 'Pending', assignedTo: 'Mukesh Mishra', assignmentRole: 'manager', initialVisibilityReleased: false });
  assert.equal(initial.api.actionState(issue, 'manager').key, 'approval');
  assert.equal(initial.api.performQuickAction('approve', invoice, issue, initial.api.latestRequest(issue.id), []), true);
  assert.equal(initial.record().issue.managerApprovalStatus, 'Approved');
  assert.equal(initial.record().issue.workflowStep, 'approver-l1');
});

let failures = 0;
for (const { name, run } of tests) {
  try {
    run();
    console.log(`\u2713 ${name}`);
  } catch (error) {
    failures += 1;
    console.error(`\u2717 ${name}`);
    console.error(`  ${error.message}`);
  }
}

if (failures) {
  console.error(`\n${failures} workflow contract test${failures === 1 ? '' : 's'} failed.`);
  process.exitCode = 1;
} else {
  console.log(`\n${tests.length} workflow contract tests passed.`);
}
