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
