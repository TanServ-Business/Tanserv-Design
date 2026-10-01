/* Focused contract checks; visual and keyboard evidence lives in design-qa.md. */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.join(__dirname, 'admin-configurations.js'), 'utf8');

function setup(view = '', module = 'module-configuration') {
  const listeners = { mount: {}, modal: {}, document: {} };
  const controls = ['auto', 'tds', 'cn', 'grn', 'tds', 'grn'].map(key => ({
    disabled: true, dataset: { configEditable: key }, closest: () => null,
  }));
  const modal = {
    innerHTML: '', chosen: [], classList: { add() {}, remove() {} }, setAttribute() {},
    addEventListener: (type, handler) => { listeners.modal[type] = handler; },
    querySelectorAll: () => modal.chosen.map(value => ({ value })),
  };
  const mount = {
    addEventListener: (type, handler) => { listeners.mount[type] = handler; },
    querySelectorAll: () => controls,
  };
  let notices = 0;
  const context = {
    window: { IneburaAdminPage: { module, view }, IneburaAdminPreviewNotice: () => { notices++; } },
    document: {
      getElementById: id => id === 'adminModal' ? modal : id === 'adminPageContent' ? mount : null,
      addEventListener: (type, handler) => { listeners.document[type] = handler; },
    },
  };
  for (const key of ['fetch', 'XMLHttpRequest', 'localStorage', 'sessionStorage']) {
    Object.defineProperty(context, key, { get() { throw new Error(`Preview must not access ${key}`); } });
  }
  vm.runInNewContext(source, context);
  function click(surface, action) {
    listeners[surface].click({ target: { closest: selector => selector === '[data-config-action]' ? { dataset: { configAction: action } } : null } });
  }
  return { api: context.window.IneburaAdminConfigurations, controls, modal, click, notices: () => notices };
}

test('configuration renderer is isolated from other modules and tabs', () => {
  assert.equal(setup('pdc').api, undefined);
  assert.equal(setup('visit').api, undefined);
  assert.equal(setup('', 'bank-master').api, undefined);
  assert.equal(typeof setup('configurations').api.render, 'function');
});

test('initial design has four read-only modules and exact field choices', () => {
  const html = setup().api.render();
  assert.equal((html.match(/data-config-toggle=/g) || []).length, 4);
  assert.equal((html.match(/ disabled/g) || []).length, 6);
  assert.match(html, /placeholder="Enter TDS %" value="2"/);
  assert.match(html, /Invoice due date does not change\./);
  assert.match(html, /Invoice due date changes as per GRN date\./);
  assert.match(html, /Select fields|Edit Configuration/);
});

test('Apply enables only the selected module controls; empty Apply locks all', () => {
  const app = setup();
  app.modal.chosen = ['tds', 'grn'];
  app.click('modal', 'apply');
  assert.deepEqual(app.controls.map(control => control.disabled), [true, false, true, false, false, false]);
  app.modal.chosen = [];
  app.click('modal', 'apply');
  assert.ok(app.controls.every(control => control.disabled));
});

test('edit picker starts empty and Cancel does not enable controls', () => {
  const app = setup();
  app.click('mount', 'edit');
  assert.equal((app.modal.innerHTML.match(/data-config-choice/g) || []).length, 4);
  assert.doesNotMatch(app.modal.innerHTML, /checked/);
  app.modal.chosen = ['auto'];
  app.click('modal', 'cancel');
  assert.ok(app.controls.every(control => control.disabled));
});

test('Save is a notice only and fresh documents start read-only', () => {
  const app = setup();
  app.click('mount', 'save');
  assert.equal(app.notices(), 1);
  assert.ok(setup().controls.every(control => control.disabled));
});
