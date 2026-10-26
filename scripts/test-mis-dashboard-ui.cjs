'use strict';

// Dependency-free DOM contract harness. Chart rendering itself is checked visually.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const core = require('./mis-access-core.js');
const storeApi = require('./mis-access-store.js');
const model = require('./mis-dashboard-core.js');
const identity = require('./mis-reports-access.js');
const reports = require('./reports-core.js');
const decode = value => String(value).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");

class Node {
  constructor(tag = 'div', attrs = {}) {
    this.tagName = tag.toUpperCase(); this.attrs = { ...attrs }; this.children = []; this.listeners = new Map(); this.dataset = {}; this.hidden = 'hidden' in attrs; this.open = 'open' in attrs; this.checked = 'checked' in attrs; this.disabled = 'disabled' in attrs; this.value = attrs.value || ''; this.type = attrs.type || ''; this.style = {}; this._text = '';
    for (const [name, value] of Object.entries(attrs)) if (name.startsWith('data-')) this.dataset[name.slice(5).replace(/-([a-z])/g, (_, char) => char.toUpperCase())] = value;
    const tokens = () => (this.attrs.class || '').split(/\s+/).filter(Boolean);
    this.classList = { add: (...names) => { this.attrs.class = [...new Set([...tokens(), ...names])].join(' '); }, remove: (...names) => { this.attrs.class = tokens().filter(name => !names.includes(name)).join(' '); }, contains: name => tokens().includes(name), toggle: (name, force) => { const on = force ?? !tokens().includes(name); on ? this.classList.add(name) : this.classList.remove(name); return on; } };
  }
  get id() { return this.attrs.id || ''; }
  get href() { return this.attrs.href || ''; } set href(value) { this.attrs.href = value; }
  get className() { return this.attrs.class || ''; } set className(value) { this.attrs.class = value; }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  getAttribute(name) { return this.attrs[name] ?? null; }
  get textContent() { return this._text + this.children.map(child => child.textContent).join(''); }
  set textContent(value) { this._text = String(value); this.children = []; }
  get innerHTML() { return this._html || ''; }
  set innerHTML(value) {
    this._html = String(value); this._text = ''; this.children = [];
    const stack = [this], voids = new Set(['INPUT', 'BR', 'IMG', 'META', 'LINK', 'HR']);
    for (const match of this._html.matchAll(/<!--[\s\S]*?-->|<\/?[^>]+>|[^<]+/g)) {
      const token = match[0];
      if (token.startsWith('<!--')) continue;
      if (token.startsWith('</')) { if (stack.length > 1) stack.pop(); continue; }
      if (token.startsWith('<')) {
        const tag = token.match(/^<([a-z][\w-]*)/i)?.[1]; if (!tag) continue;
        const attrs = {};
        for (const attr of token.slice(tag.length + 1, -1).matchAll(/([\w-]+)(?:="([^"]*)"|'([^']*)'|=([^\s>]+))?/g)) attrs[attr[1]] = decode(attr[2] ?? attr[3] ?? attr[4] ?? '');
        const node = new Node(tag, attrs); stack.at(-1).append(node);
        if (!voids.has(node.tagName) && !token.endsWith('/>')) stack.push(node);
      } else stack.at(-1)._text += decode(token);
    }
  }
  append(child) { child.remove(); child.parent = this; this.children.push(child); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(child => child !== this); this.parent = null; }
  contains(node) { return node === this || this.children.some(child => child.contains(node)); }
  matches(selector) {
    if (selector.includes(',')) return selector.split(',').some(part => this.matches(part.trim()));
    if (selector.endsWith(':checked')) { if (!this.checked) return false; selector = selector.slice(0, -8); }
    for (const match of selector.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)) if (!(match[1] in this.attrs) || (match[2] !== undefined && this.attrs[match[1]] !== match[2])) return false;
    const plain = selector.replace(/\[[^\]]+\]/g, '');
    const id = plain.match(/#([\w-]+)/)?.[1]; if (id && id !== this.id) return false;
    for (const match of plain.matchAll(/\.([\w-]+)/g)) if (!this.classList.contains(match[1])) return false;
    const tag = plain.match(/^[a-z][\w-]*/i)?.[0]; return !tag || this.tagName === tag.toUpperCase();
  }
  closest(selector) { return this.matches(selector) ? this : this.parent?.closest(selector) || null; }
  querySelectorAll(selector) {
    const parts = selector.trim().split(/\s+/), last = parts.pop();
    return this.children.flatMap(child => [child, ...child.querySelectorAll('*')]).filter(node => {
      if (last !== '*' && !node.matches(last)) return false;
      let ancestor = node.parent;
      for (const part of [...parts].reverse()) { while (ancestor && !ancestor.matches(part)) ancestor = ancestor.parent; if (!ancestor) return false; ancestor = ancestor.parent; }
      return true;
    });
  }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  addEventListener(type, listener) { const list = this.listeners.get(type) || []; list.push(listener); this.listeners.set(type, list); }
  emit(type, event = {}) { event.target ||= this; event.preventDefault ||= () => {}; for (const listener of this.listeners.get(type) || []) listener(event); }
  click() {
    if (this.disabled) return;
    const event = { type: 'click', target: this, defaultPrevented: false, propagationStopped: false, preventDefault() { this.defaultPrevented = true; }, stopPropagation() { this.propagationStopped = true; }, stopImmediatePropagation() { this.propagationStopped = true; } };
    let root = this; while (root.parent) root = root.parent;
    const document = root.ownerDocument;
    for (const entry of document?.listeners.get('click') || []) if (entry.capture && !event.propagationStopped) entry.listener(event);
    for (let node = this; node && !event.propagationStopped; node = node.parent) node.emit('click', event);
    for (const entry of document?.listeners.get('click') || []) if (!entry.capture && !event.propagationStopped) entry.listener(event);
    if (this.tagName === 'A' && !event.defaultPrevented) this.navigate?.(this.href);
  }
  focus() { this.focused = true; }
  setSelectionRange() {}
}

function setup({ search = '?misUser=mis-agent', role = 'Admin', name = 'Admin', state = storeApi.seed() } = {}) {
  const source = fs.readFileSync(`${__dirname}/../pages/LPmis.html`, 'utf8');
  const body = new Node('body');
  body.innerHTML = source.slice(source.indexOf('<main id="misDashboardApp"'), source.indexOf('<!-- Retained legacy markup;'));
  const legacy = new Node('main', { class: 'managerMain', hidden: '' });
  legacy.innerHTML = '<div class="panelCard actionPanel"><div class="panelTitle">Quick Actions</div><button id="reportOverviewBtn">Reports</button><button id="invoiceOverviewBtn">Invoices</button><button id="customerOverviewBtn">Customer</button><button id="scheduleShareBtn">Schedule &amp; Share</button></div><div id="globalCards"></div><tbody id="invoiceTableBody"></tbody>';
  body.append(legacy);
  const header = new Node('div', { 'data-shared-header': '' });
  header.innerHTML = '<nav id="sideNav"><a class="nav-link" data-module="reports" href="http://local.test/pages/reports.html">Reports</a><a class="submenu-link" data-module="landing-mis" href="http://local.test/pages/LPmis.html">MIS</a><a href="http://local.test/pages/admin.html">Admin</a></nav>'; body.append(header);
  const document = { body, readyState: 'complete', listeners: new Map(), getElementById: id => body.querySelector(`#${id}`), querySelector: selector => body.querySelector(selector), querySelectorAll: selector => body.querySelectorAll(selector), createElement: tag => new Node(tag), addEventListener(type, listener, options) { const list = this.listeners.get(type) || []; list.push({ listener, capture: options === true || !!options?.capture }); this.listeners.set(type, list); } };
  body.ownerDocument = document;
  const values = new Map([[storeApi.KEY, JSON.stringify(state)], ['activeUserRole', role], ['activeUserName', name]]);
  let failIdentity = false;
  const storage = { getItem: key => { if (failIdentity && key.startsWith('activeUser')) throw new Error('Identity storage unavailable'); return values.get(key) ?? null; }, setItem: (key, value) => values.set(key, String(value)) };
  const listeners = new Map(), downloads = [], blobs = new Map(), chartInstances = [];
  const location = { search, href: `http://local.test/pages/LPmis.html${search}`, origin: 'http://local.test', assign(href) { this.href = href; } };
  class TestURL extends URL { static createObjectURL(blob) { const url = `blob:test-${blobs.size}`; blobs.set(url, blob); return url; } static revokeObjectURL() {} }
  class Blob { constructor(parts, options) { this.parts = parts; this.type = options.type; } }
  const originalCreateElement = document.createElement;
  document.createElement = tag => { const node = originalCreateElement(tag); if (tag === 'a') node.click = () => downloads.push({ name: node.download, csv: blobs.get(node.href)?.parts.join('') }); return node; };
  const window = { IneburaMisCore: core, IneburaMisDashboard: model, IneburaMisReports: identity, IneburaReportsCore: reports, Chart: class { constructor(canvas, options) { this.canvas = canvas; this.options = options; chartInstances.push(this); } destroy() { this.destroyed = true; } }, addEventListener(type, listener) { const list = listeners.get(type) || []; list.push(listener); listeners.set(type, list); }, dispatchEvent(event) { for (const listener of listeners.get(event.type) || []) listener(event); } };
  window.IneburaMisStore = storeApi.createStore(storage, () => window.dispatchEvent({ type: 'inebura:mis-change' }));
  const sandbox = { window, document, location, localStorage: storage, URL: TestURL, URLSearchParams, Blob, Intl, Date, setTimeout: () => 1, clearTimeout() {} };
  window.location = location;
  for (const link of header.querySelectorAll('a[href]')) link.navigate = href => { location.href = href; };
  const sharedHeader = fs.readFileSync(`${__dirname}/shared-header.js`, 'utf8');
  const navSource = sharedHeader.slice(sharedHeader.indexOf('const wireSideNav = () => {'), sharedHeader.indexOf('const initNotifications = () => {'));
  const commitmentReviewPath = sharedHeader.match(/const commitmentReviewPath = ([\s\S]*?);/)?.[0];
  vm.runInNewContext(`${commitmentReviewPath || ''}\n${navSource}\nwireSideNav();`, { ...sandbox, supervisorCommitmentView:false, resolvePath: path => new URL(path, 'http://local.test/').href });
  vm.runInNewContext(fs.readFileSync(`${__dirname}/mis-dashboard.js`, 'utf8'), sandbox);
  const node = id => document.getElementById(id);
  const directDownload = card => node('misDashboardApp').emit('click', { target: new Node('button', { 'data-mis-download': card }) });
  const mutate = change => { const current = window.IneburaMisStore.getState(); change(current); storage.setItem(storeApi.KEY, JSON.stringify(current)); };
  const fire = (type, event = {}) => { for (const listener of listeners.get(type) || []) listener(event); };
  const select = ids => { const inputs = node('misScopeOptions').querySelectorAll('[data-mis-scope]'); for (const input of inputs) input.checked = ids.includes(input.dataset.misScope); node('misScopeOptions').emit('change', { target: inputs[0] }); };
  return { body, document, sandbox, source, legacy, header, location, storage, downloads, chartInstances, window, node, directDownload, mutate, fire, select, failIdentity: value => { failIdentity = value; } };
}

test('legacy initializer is bypassed and all four existing Quick Actions are retained', () => {
  const h = setup();
  const inline = [...h.source.matchAll(/<script>([\s\S]*?)<\/script>/g)][0][1];
  vm.runInNewContext(inline, h.sandbox);
  assert.equal(h.legacy.hidden, true); assert.equal(h.node('globalCards').children.length, 0); assert.equal(h.node('invoiceTableBody').children.length, 0);
  assert.deepEqual(h.node('misQuickActions').querySelectorAll('button').map(button => button.textContent), ['Reports', 'Invoices', 'Customer', 'Schedule & Share']);
  for (const [id, text] of [['invoiceOverviewBtn', 'Invoice Overview'], ['customerOverviewBtn', 'Customer Overview'], ['scheduleShareBtn', 'Schedule & Share'], ['reportOverviewBtn', 'MIS Dashboard']]) { h.node(id).click(); assert.equal(h.node('misDashboardTitle').textContent, text); }
  h.node('scheduleShareBtn').click(); assert.match(h.node('misDashboardDetail').textContent, /awaiting team clarification/);
  assert.equal(h.node('misDashboardDetail').querySelectorAll('input,form').length, 0);
  assert.deepEqual(h.node('misDashboardDetail').querySelectorAll('button').map(button => button.textContent), ['Back to reports']);
});

test('download handlers resolve current grants even when invoked directly after silent changes', () => {
  const h = setup();
  h.mutate(state => { state.users.find(user => user.id === 'mis-agent').access.assigneeIds = ['agent-b']; });
  h.directDownload('odm');
  assert.equal(h.downloads.length, 1);
  assert.match(h.downloads[0].csv, /MIS-TC-003/); assert.match(h.downloads[0].csv, /MIS-AP-006/); assert.doesNotMatch(h.downloads[0].csv, /MIS-TC-001|MIS-TC-002|MIS-TC-004|MIS-AP-005|MIS-AP-007/);
  assert.ok(h.downloads[0].csv.startsWith('\uFEFF"Invoice Number"'), 'CSV has exactly one BOM before the first header');
  h.mutate(state => { state.users.find(user => user.id === 'mis-agent').status = 'Suspended'; }); h.directDownload('odm');
  assert.equal(h.downloads.length, 1); assert.match(h.node('misReportGrid').textContent, /MIS access unavailable/);
});

test('clear selection means none and direct invocation cannot export disabled cards', () => {
  const h = setup(); h.node('misScopeClear').click();
  assert.match(h.node('misScopeValue').textContent, /^0 of 2 agents selected$/);
  assert.equal(h.node('misSelectAll').checked, false);
  h.directDownload('odm'); assert.equal(h.downloads.length, 0);
  h.node('misSelectAll').checked = true; h.node('misSelectAll').emit('change'); h.directDownload('odm');
  assert.equal(h.downloads.length, 1); assert.match(h.node('misScopeValue').textContent, /All tagged agents/);
});

test('12+ options stay in one searchable count dropdown and search never narrows downloads', () => {
  const state = storeApi.seed(), selected = state.users.find(user => user.id === 'mis-agent');
  for (let index = 1; index <= 12; index++) { const id = `extra-${index}`; state.users.push({ id, name: `Extra Agent ${index}`, role: 'AGENT', status: 'Active' }); selected.access.assigneeIds.push(id); }
  const h = setup({ state });
  assert.equal(h.node('misScopeOptions').querySelectorAll('.misScopeOption').length, 14);
  assert.equal(h.node('misScopeValue').textContent, 'All tagged agents (14)'); assert.equal(h.node('misScopeValue').children.length, 0);
  h.node('misScopeSearch').value = 'Extra Agent 12'; h.node('misScopeSearch').emit('input');
  assert.equal(h.node('misScopeOptions').querySelectorAll('.misScopeOption').filter(option => !option.hidden).length, 1);
  h.directDownload('odm'); assert.equal(h.downloads.length, 1); assert.equal(h.downloads[0].csv.split('\r\n').length, 6);
  h.node('misScopeSearch').value = 'No matching agent'; h.node('misScopeSearch').emit('input'); assert.equal(h.node('misScopeNoResults').hidden, false);
});

test('an All selection cannot silently become All in a new mapping kind', () => {
  const h = setup();
  h.mutate(state => { state.users.find(user => user.id === 'mis-agent').access = { mode: 'subclients', subclientIds: ['tc-north'] }; });
  h.fire('storage', { key: storeApi.KEY });
  assert.match(h.node('misScopeValue').textContent, /^0 of 1 subclients selected$/);
  h.fire('focus'); h.directDownload('odm'); assert.equal(h.downloads.length, 0);
  h.node('misSelectAll').checked = true; h.node('misSelectAll').emit('change'); h.directDownload('odm');
  assert.equal(h.downloads.length, 1); assert.match(h.downloads[0].csv, /MIS-TC-001/); assert.match(h.downloads[0].csv, /MIS-TC-003/);
});

test('removed options are pruned without widening selection and current hooks refresh visible data', () => {
  const h = setup(); h.select(['agent-a']);
  h.window.IneburaMisStore.transitionUser('agent-a', 'suspend', 'agent-b', { id: 'admin', role: 'ADMIN', status: 'Active' });
  assert.match(h.node('misScopeValue').textContent, /^0 of 2 agents selected$/);
  h.directDownload('odm'); assert.equal(h.downloads.length, 0);
  h.node('misSelectAll').checked = true; h.node('misSelectAll').emit('change');
  h.mutate(state => { state.users.find(user => user.id === 'mis-agent').status = 'Suspended'; }); h.fire('pageshow');
  assert.match(h.node('misReportGrid').textContent, /MIS access unavailable/);
});

test('inactive, unknown and unreadable session identities deny direct downloads', () => {
  for (const search of ['?misUser=missing', '?misUser=agent-a', '?misUser=']) { const h = setup({ search }); h.directDownload('odm'); assert.equal(h.downloads.length, 0); assert.match(h.node('misReportGrid').textContent, /MIS access unavailable/); }
  const h = setup({ search: '', role: 'MIS', name: 'MIS Portfolio' });
  h.storage.setItem('activeUserName', 'Unknown MIS'); h.fire('storage', { key: 'activeUserName' }); h.directDownload('odm'); assert.equal(h.downloads.length, 0);
  h.storage.setItem('activeUserName', 'MIS Portfolio'); h.fire('focus'); h.failIdentity(true); h.directDownload('odm'); assert.equal(h.downloads.length, 0);
});

test('scoped navigation retains explicit identity and date errors do not replace a valid period', () => {
  const h = setup(); const links = h.header.querySelectorAll('a[href]');
  assert.equal(new URL(links[0].href).searchParams.get('misUser'), 'mis-agent'); assert.equal(new URL(links[1].href).searchParams.get('misUser'), 'mis-agent'); assert.equal(new URL(links[2].href).searchParams.has('misUser'), false);
  h.node('misPeriodStart').value = '2026-10-07'; h.node('misPeriodEnd').value = '2026-10-01'; h.node('misPeriodForm').emit('submit');
  assert.equal(h.node('misPeriodError').hidden, false); h.directDownload('odm'); assert.equal(h.downloads[0].csv.split('\r\n').length, 6);
  h.node('misPeriodStart').value = '2026-10-04'; h.node('misPeriodEnd').value = '2026-10-04'; h.node('misPeriodForm').emit('submit'); h.directDownload('odm');
  assert.equal(h.downloads[1].csv.split('\r\n').length, 2); assert.match(h.downloads[1].csv, /MIS-TC-004/);
});

test('shared side-navigation clicks preserve the scoped MIS href rather than its generic destination', () => {
  const h = setup({ search: '?misUser=mgr-west' });
  const links = h.header.querySelectorAll('a[href]');
  links[1].click(); assert.equal(new URL(h.location.href).searchParams.get('misUser'), 'mgr-west');
  links[0].click(); assert.equal(new URL(h.location.href).searchParams.get('misUser'), 'mgr-west');
  const before = h.location.href;
  h.mutate(state => { state.users.find(user => user.id === 'mgr-west').status = 'Suspended'; });
  links[1].click(); assert.equal(h.location.href, before, 'the saved header link must not navigate with a revoked identity');
  assert.match(h.node('misReportGrid').textContent, /MIS access unavailable/);
});
