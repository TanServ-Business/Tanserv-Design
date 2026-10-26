/* Run with Node. Covers source round trips, sample rendering and Admin exclusion guards. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const load = name => fs.readFileSync(path.join(__dirname, name), 'utf8');
const context = { window: {}, URL, location: { href: 'http://127.0.0.1:8766/pages/admin.html?module=template-master', protocol: 'http:', origin: 'http://127.0.0.1:8766', search: '?module=template-master' } };
vm.createContext(context);
vm.runInContext(load('template-master-data.js'), context);
vm.runInContext(load('template-master-editor.js'), context);
const source = context.window.IneburaTemplateMasterSource;
const editor = context.window.IneburaTemplateEditor;
const hidden = JSON.parse(fs.readFileSync(path.join(root, 'artifacts/template-master/2026-10-19/admin-hidden-templates.json'))).templates;
const hiddenCodes = new Set(hidden.map(row => row.code));
const retained = source.templates.filter(row => !hiddenCodes.has(row.code));
assert.equal(source.templates.length, 110);
assert.equal(hidden.length, 26);
assert.equal(retained.length, 84);
assert.equal(retained.filter(row => row.communicationMode === 'Email').length, 52);

const tokens = text => [...text.matchAll(/\$\{[^}]+\}|\{\{[^}]+\}\}|<\/?#[\s\S]*?>/g)].map(match => match[0]);
for (const row of source.templates) {
  for (const [field, plain] of [['body', false], ['subject', true]]) {
    const model = editor.project(row[field], { editable: true, plain });
    assert.equal(editor.rebuild(model, new Map()), row[field], row.code + ' unchanged round trip');
    if (model.parts.length) {
      const changed = editor.rebuild(model, new Map([[0, 'Edited message copy']]));
      assert.deepEqual(tokens(changed), tokens(row[field]), row.code + ' preserves expressions when copy changes');
    }
    if (!hiddenCodes.has(row.code)) {
      const preview = editor.project(row[field], { plain }).markup;
      assert.doesNotMatch(preview, /\$\{|\{\{|<\/?#|\bNULL\b/, row.code + ' sample preview');
    }
  }
}
const original = '<html><body><p>Hello ${recipientName},</p><#list invoices as invoice><p>${invoice.invoiceNo}</p></#list></body></html>';
const model = editor.project(original, { editable: true });
const changed = editor.rebuild(model, new Map([[0, '<script>alert(1)</script>\nUpdated greeting ']]));
assert.ok(changed.includes('&lt;script&gt;alert(1)&lt;/script&gt;<br>Updated greeting ${recipientName}'));
assert.ok(changed.includes('<#list invoices as invoice>'));
assert.equal(editor.sample('${(totalCount == 1)?string(\'y\',\'ies\')}'), 'ies');
assert.equal(editor.sample('NULL', 'PDC Banking Today - Cheque '), '102345');
assert.equal(editor.sample('NULL', '<strong>Amount:</strong> '), 'INR 1,25,000.00');
const plain = editor.project('Hi ${fprName},\nPlease follow up.', { editable: true });
const plainChanged = editor.rebuild(plain, new Map([[0, 'Hello ']]));
assert.equal(plainChanged, 'Hello ${fprName},\nPlease follow up.');
const safe = editor.frameDocument('<script>alert(1)</script><iframe src="https://example.com"></iframe><p onclick="alert(1)">Hello</p>');
assert.doesNotMatch(safe, /<script|<iframe|onclick/i);
assert.match(safe, /default-src 'none'/);

// Minimal app harness: retained rows are paginated, red IDs cannot open an editor, and saving
// a global setting keeps all captured records/settings (including hidden rows) intact.
const element = () => ({ innerHTML: '', textContent: '', listeners: {}, classList: { add() {}, remove() {} }, addEventListener(type, callback) { this.listeners[type] = callback; }, setAttribute() {} });
const nodes = new Map(['adminPageContent', 'adminModal', 'tmRows', 'tmSummary', 'tmPages', 'tmFailoverLabel', 'adminToast'].map(id => [id, element()]));
let persisted;
const saved = { templates: [{ ...source.templates.find(row => hiddenCodes.has(row.code)), code: 'Previously renamed hidden template' }], failoverEnabled: true };
context.window.localStorage = { getItem() { return JSON.stringify(saved); }, setItem(key, value) { persisted = JSON.parse(value); } };
context.URLSearchParams = URLSearchParams;
context.setTimeout = () => {};
context.document = { body: { classList: { add() {} } }, getElementById: id => nodes.get(id), querySelector: () => null, querySelectorAll: () => [], addEventListener() {} };
vm.runInContext(load('admin-template-master.js'), context);
assert.equal(nodes.get('tmSummary').textContent, 'Showing 1–10 of 80');
const allIds = [];
for (let page = 1; page <= 9; page++) {
  nodes.get('adminPageContent').listeners.click({ target: { closest: selector => selector === '[data-tm-page]' ? { dataset: { tmPage: String(page) }, disabled: false } : null } });
  allIds.push(...[...nodes.get('tmRows').innerHTML.matchAll(/data-tm-edit="([^"]+)"/g)].map(match => match[1]));
}
assert.equal(new Set(allIds).size, 80);
for (const row of source.templates.filter(row => hiddenCodes.has(row.code) || row.id === 'xeon-template-10' || /^DunningLetter(?:One|Two|Three)Email$/.test(row.code))) {
  assert.ok(!allIds.includes(row.id));
  nodes.get('adminPageContent').listeners.click({ target: { closest: selector => selector === '[data-tm-edit]' ? { dataset: { tmEdit: row.id } } : null } });
  assert.equal(nodes.get('adminModal').innerHTML, '', row.code + ' cannot open directly');
}
nodes.get('adminPageContent').listeners.change({ target: { id: 'tmFailover', checked: false } });
assert.equal(persisted.templates.length, 110);
assert.equal(persisted.templates[0].disabled, source.templates[0].disabled);
assert.equal(persisted.templates[0].body, source.templates[0].body);
assert.equal(persisted.templates[0].recipientRole, source.templates[0].recipientRole);
console.log('Passed: 110 source round trips; 84 populated previews; 80 generic Admin rows; 26 exclusions and 4 Dunning direct-open guards; original tokens/settings preserved.');
