/* Contract checks for the source-faithful Operational Setup renderer. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const scriptPath = path.join(__dirname, 'admin-operational-setup.js');
const cssPath = path.join(__dirname, '..', 'css', 'admin-operational-setup.css');
const source = fs.readFileSync(scriptPath, 'utf8');
const css = fs.readFileSync(cssPath, 'utf8');

function setup(module = 'invoice-preferences', view = 'aging') {
  const listeners = {};
  const mount = { innerHTML: '' };
  const modal = {
    innerHTML: '',
    classList: { add() {}, remove() {} },
    setAttribute() {},
  };
  const toast = {
    textContent: '',
    classList: { add() {}, remove() {} },
  };
  const document = {
    addEventListener(type, listener) { (listeners[type] ||= []).push(listener); },
    getElementById(id) {
      if (id === 'adminPageContent') return mount;
      if (id === 'adminModal') return modal;
      if (id === 'adminToast') return toast;
      return null;
    },
    querySelector() { return null; },
    querySelectorAll() { return []; },
  };
  const context = {
    URLSearchParams,
    Set,
    FormData: class {},
    Blob: class {},
    URL,
    document,
    window: { location: { search: `?module=${module}&view=${view}` }, setTimeout() {} },
  };
  for (const key of ['fetch', 'XMLHttpRequest', 'localStorage', 'sessionStorage']) {
    Object.defineProperty(context, key, { get() { throw new Error(`Operational preview must not access ${key}`); } });
  }
  vm.runInNewContext(source, context);
  return { api: context.window.IneburaOperationalSetup, html: mount.innerHTML, listeners };
}

test('Invoice Setup renders the complete 19-row reference bucket table selected', () => {
  const app = setup();
  assert.equal(app.api.buckets.length, 19);
  assert.equal((app.html.match(/data-op-aging-bucket=/g) || []).length, 19);
  assert.equal((app.html.match(/data-op-aging-bucket="[^"]+" checked/g) || []).length, 19);
  for (const label of ['Not Due', '1-30', '331-365', '1-2 yrs', '5+ yrs']) assert.match(app.html, new RegExp(label.replace('+', '\\+')));
});

test('custom bucket selection is consecutive and enables only adjacent extensions', () => {
  const api = setup().api;
  let selected = new Set([2]);
  assert.deepEqual([...api.selectableBucketIndexes(selected)], [2, 1, 3]);
  selected.add(3);
  selected.add(4);
  assert.equal(api.bucketRangeName(selected), '31-90');
  selected.delete(3);
  selected = api.normalizeBucketSelection(selected, 3);
  assert.deepEqual([...selected], [2]);
  assert.equal(api.bucketRangeName(new Set([0, 1])), 'Not due 1-30');
});

test('custom groups create, update, and delete in memory only', () => {
  const api = setup().api;
  api.saveCustomGroup({ name: '31-60', color: '#118dff', selection: new Set([2, 3]) });
  assert.equal(api.customGroups.length, 1);
  assert.equal(api.customGroups[0].name, '31-60');
  api.saveCustomGroup({ name: '31-90', color: '#118dff', selection: new Set([2, 3, 4]) }, 0);
  assert.deepEqual([...api.customGroups[0].selection], [2, 3, 4]);
  api.removeCustomGroup(0);
  assert.equal(api.customGroups.length, 0);
});

test('activity dispositions include the complete hierarchy and inline three-field editor', () => {
  const app = setup('invoice-preferences', 'dispositions');
  for (const label of ['Work In Progress', 'Red Flag', 'Further Docs Required', 'Collection Done', 'Material Delivery Issues', 'Service Related Issues']) assert.match(app.html, new RegExp(label));
  assert.ok((app.html.match(/Add Sub Status/g) || []).length >= 10);
  assert.match(source, /Display Value\*/);
  assert.match(source, /placeholder="Code\*"/);
  assert.match(source, /type="color" name="color"/);
});

test('purge policy uses a plain readable header and the exact irreversible warning', () => {
  const app = setup('invoice-preferences', 'purge');
  assert.match(app.html, /Data Purge Policy/);
  assert.match(app.html, /This action cannot be undone\./);
  assert.match(css, /\.opPurgeCard > header[\s\S]*?background: #fff !important/);
  assert.match(css, /\.opPurgeCard > header h2[\s\S]*?color: #55257f !important/);
});

test('other operational modules expose their audited reference controls', () => {
  const documentSetup = setup('document-setup', 'documents').html;
  assert.match(documentSetup, /Select from Preset List/);
  assert.match(documentSetup, /Create New/);
  assert.match(source, /class="opFormGrid opSingleColumn"/);

  const roleSetup = setup('role-display', 'display-names').html;
  assert.match(roleSetup, /Organisation Hierarchy/);
  assert.match(roleSetup, /Role Display Names/);
  assert.match(roleSetup, /Select a Role Type first/);

  const userSetup = setup('user-setup', 'create-user').html;
  assert.match(userSetup, /Team Members/);
  assert.match(source, /Send Creds/);
  assert.match(source, /Select Existing Contact Person/);
  assert.match(source, /data-op-action="select-contact"/);

  const notifications = setup('notification-manager', 'preferences').html;
  assert.match(notifications, /Showing 1–10 of 46/);
  assert.match(source, /aria-label="WhatsApp declaration for/);
});

test('Operational Setup stays isolated and does not claim unrelated modules', () => {
  assert.equal(setup('bank-master', '').api, undefined);
});
