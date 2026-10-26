'use strict';
const assert = require('node:assert/strict');
const reportUi = require('./dunning-management-report.js');
const XLSX = require('./vendor/xlsx.full.min.js');

function node(dataset = {}) {
  return { dataset, listeners: {}, addEventListener(name, handler) { this.listeners[name] = handler; }, fire(name, extra = {}) { return this.listeners[name]?.({ preventDefault() {}, currentTarget: this, ...extra }); } };
}
function fixture(role = 'client-admin') {
  const actor = { role, clientId: 'c1' }, files = [], messages = [];
  const make = (id, stage = 1, date = '2026-10-21', customer = 'Example', client = 'c1') => ({ id, status: 'sent', to: ['first@example.test', 'second@example.test'], letterSnapshot: { date, stageNumber: stage, reference: `REF-${id}`, customer: { id: customer, name: customer, clientId: client, customerCode: '00003' }, clientCode: '00001', invoices: [{ id, invoiceNo: '00002', originalAmount: 1800.25, outstanding: 250, dueDate: '2026-10-01', clientId: client }] } });
  const state = { enabled: false, letterCount: 1, emails: [make('one'), make('two', 5, '2026-10-22', '<script>alert(1)</script>')] };
  let subscriber = null, unsubscribed = false;
  const api = { getContext: () => ({ ...actor }), getState: () => structuredClone(state), subscribe(handler) { subscriber = handler; return () => { unsubscribed = true; }; } };
  const container = { nodes: {}, markup: '', set innerHTML(value) {
    this.markup = value; this.nodes = {};
    if (!value.includes('data-dl-filters')) return;
    this.nodes.form = node();
    this.nodes.form.fields = Object.fromEntries(['dateFrom', 'dateTo', 'customer', 'stage'].map(name => [name, { value: '' }]));
    this.nodes.form.elements = { namedItem: name => this.nodes.form.fields[name] };
    this.nodes.clear = node(); this.nodes.exports = ['full', 'filtered'].map(dlExport => node({ dlExport }));
    this.nodes.pages = ['1', '2'].map(dlPage => node({ dlPage }));
  }, get innerHTML() { return this.markup; }, querySelector(selector) { return ({ '[data-dl-filters]': this.nodes.form, '[data-dl-clear]': this.nodes.clear })[selector]; }, querySelectorAll(selector) { return selector === '[data-dl-export]' ? this.nodes.exports : this.nodes.pages; } };
  const ui = reportUi.mount(container, { api, notify: message => messages.push(message), XLSX: { ...XLSX, writeFile(book, name) { files.push({ book, name }); } } });
  return { actor, state, make, container, ui, files, messages, change: () => subscriber(), unsubscribed: () => unsubscribed };
}

const app = fixture();
assert.match(app.container.innerHTML, /2 invoice rows/);
assert.match(app.container.innerHTML, /value="5"/,'historical DL5 remains available after configured count drops to 1');
assert.match(app.container.innerHTML, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
assert.doesNotMatch(app.container.innerHTML, /<script>/);
assert.equal(app.container.innerHTML.match(/<th scope="col">/g).length, 10);
app.ui.exportRows('full');assert.equal(app.files[0].name,'dunning-letters.xlsx');
let sheet = app.files[0].book.Sheets['Dunning Letters'];
assert.equal(sheet['!ref'],'A1:J3');assert.equal(sheet.A2.t,'s');assert.equal(sheet.A2.v,'00001');assert.equal(sheet.E2.t,'n');
const form = app.container.nodes.form;form.fields.stage.value = '5';form.fields.dateFrom.value='2026-10-22';form.fields.dateTo.value='2026-10-22';form.fire('submit');
assert.match(app.container.innerHTML,/1 invoice row/);
app.ui.exportRows('filtered');sheet=app.files[1].book.Sheets['Dunning Letters'];assert.equal(sheet['!ref'],'A1:J2');assert.equal(sheet.G2.v,'DL5');
app.ui.exportRows('full');assert.equal(app.files[2].book.Sheets['Dunning Letters']['!ref'],'A1:J3','all export ignores active filters');
const reversed = app.container.nodes.form;reversed.fields.dateFrom.value='2026-10-25';reversed.fields.dateTo.value='2026-10-01';reversed.fire('submit');assert.match(app.messages.at(-1),/on or before/);assert.match(app.container.innerHTML,/1 invoice row/,'invalid filter leaves the accepted results intact');
app.container.nodes.clear.fire('click');assert.match(app.container.innerHTML,/2 invoice rows/);
const savedDownload = app.container.nodes.exports[0];
const before = JSON.stringify(app.state), downloads = app.files.length;
app.actor.role='agent';savedDownload.fire('click');assert.equal(app.files.length,downloads,'saved download handler checks current role');assert.match(app.container.innerHTML,/Only Client Admin/);assert.equal(JSON.stringify(app.state),before,'report cannot mutate Dunning state');
app.actor.role='client-admin';app.change();assert.match(app.container.innerHTML,/2 invoice rows/);
app.actor.clientId='elsewhere';app.ui.exportRows('full');assert.equal(app.files.at(-1).book.Sheets['Dunning Letters']['!ref'],'A1:J1','export resolves fresh client scope');
app.actor.clientId='c1';app.state.emails.push(app.make('third',7));app.change();assert.match(app.container.innerHTML,/3 invoice rows/);assert.match(app.container.innerHTML,/value="7"/);
app.ui.destroy();assert.equal(app.unsubscribed(),true);assert.equal(app.container.innerHTML,'');assert.equal(app.ui.exportRows('full'),null,'disposed handlers cannot download');
for(const role of ['agent','supervisor','mis','mis-manager','backend']) {const blocked=fixture(role);assert.match(blocked.container.innerHTML,/Only Client Admin/);assert.equal(blocked.ui.exportRows('full'),null);assert.equal(blocked.files.length,0);}
console.log('Passed: management report mounting, exact columns, immutable history, historical stages, escaped output, filter validation, all/filtered typed XLSX, fresh role/client guard, saved handler denial, no state mutation and disposal.');
