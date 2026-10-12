/* Execute the real inline UI script with local-only form controls. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');

const html = fs.readFileSync(path.join(__dirname, '../pages/ui-elements.html'), 'utf8');
const scripts = [...html.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
  .map(match => match[1]).filter(source => source.trim());

function setup(omitted = []) {
  const controls = {};
  for (const id of ['formUsername', 'formEmail', 'formPhone', 'formAmount',
    'formDate', 'formRole', 'formStatus', 'formPassword', 'formConfirm',
    'formNotes', 'autoFillBtn', 'passwordToggleBtn', 'confirmToggleBtn', 'formSubmitBtn']) {
    if (omitted.includes(id)) continue;
    const classes = new Set();
    const wrapper = { classList: {
      add: name => classes.add(name), remove: name => classes.delete(name),
      contains: name => classes.has(name),
      toggle(name, active) { if (active) classes.add(name); else classes.delete(name); },
    } };
    controls[id] = {
      value: '', type: id === 'formPassword' || id === 'formConfirm' ? 'password' : 'text',
      listeners: {}, closest: () => wrapper,
      addEventListener(type, callback) { (this.listeners[type] ??= []).push(callback); },
      fire(type) { for (const callback of this.listeners[type] || []) callback(); },
    };
  }
  const context = {
    crypto: webcrypto, setTimeout() {},
    document: {
      querySelectorAll: () => [], getElementById: id => controls[id] || null,
      addEventListener() {},
    },
  };
  for (const name of ['fetch', 'XMLHttpRequest', 'localStorage', 'sessionStorage']) {
    Object.defineProperty(context, name, { get() { throw new Error(`Demo must not access ${name}`); } });
  }
  vm.createContext(context);
  for (const source of scripts) vm.runInContext(source, context);
  return controls;
}

test('demo password and confirmation have no hard-coded literal values', () => {
  assert.ok(scripts.length > 0, 'Must execute at least one actual inline script');
  assert.equal(/form(?:Password|Confirm):\s*["'`]/.test(html), false,
    'Demo credential fields must not embed a reusable literal');
});

test('Auto-fill uses a synthetic identity and preserves the other sample fields', () => {
  const fields = setup();
  fields.autoFillBtn.fire('click');
  assert.ok(fields.formUsername.value === 'demo.user', 'Use a non-personal demo username');
  assert.ok(fields.formEmail.value === 'demo.user@example.com', 'Use a reserved demo email domain');
  assert.equal(fields.formPhone.value.length, 10);
  assert.equal(fields.formAmount.value, '12500');
  assert.match(fields.formDate.value, /^\d{4}-\d{2}-\d{2}$/);
  assert.equal(fields.formRole.value, 'Manager');
  assert.equal(fields.formStatus.value, 'Active');
  assert.equal(fields.formNotes.value, 'Auto-filled sample data for CRM form.');
});

test('each Auto-fill click and page instance gets a fresh matching demo value', () => {
  const fields = setup();
  fields.autoFillBtn.fire('click');
  const first = fields.formPassword.value;
  assert.ok(/^[a-f0-9]{32}$/.test(first), 'Use a runtime-generated demo value');
  assert.ok(first === fields.formConfirm.value, 'Both password fields must match');
  fields.autoFillBtn.fire('click');
  assert.ok(first !== fields.formPassword.value, 'Do not reuse the demo value across clicks');
  assert.ok(fields.formPassword.value === fields.formConfirm.value, 'Confirmation must stay in sync');
  const other = setup();
  other.autoFillBtn.fire('click');
  assert.ok(first !== other.formPassword.value, 'Do not reuse the demo value across pages');
});

test('password visibility, minimum length, and confirmation validation still work', () => {
  const fields = setup();
  fields.autoFillBtn.fire('click');
  for (const [id, toggle] of [['formPassword', 'passwordToggleBtn'], ['formConfirm', 'confirmToggleBtn']]) {
    fields[id].fire('blur');
    assert.equal(fields[id].closest().classList.contains('invalid'), false);
    fields[toggle].fire('click');
    assert.equal(fields[id].type, 'text');
    fields[toggle].fire('click');
    assert.equal(fields[id].type, 'password');
  }
  fields.formPassword.value = 'short';
  fields.formPassword.fire('blur');
  assert.equal(fields.formPassword.closest().classList.contains('invalid'), true);
  fields.autoFillBtn.fire('click');
  fields.formPassword.fire('blur');
  assert.equal(fields.formPassword.closest().classList.contains('invalid'), false);
  fields.formConfirm.value = 'does-not-match';
  fields.formConfirm.fire('blur');
  assert.equal(fields.formConfirm.closest().classList.contains('invalid'), true);
  fields.formConfirm.value = fields.formPassword.value;
  fields.formConfirm.fire('blur');
  assert.equal(fields.formConfirm.closest().classList.contains('invalid'), false);
});

test('Auto-fill tolerates absent controls without storage or network access', () => {
  const fields = setup(['formPassword', 'formConfirm', 'formEmail']);
  assert.doesNotThrow(() => fields.autoFillBtn.fire('click'));
  assert.equal(fields.formRole.value, 'Manager');
});
