#!/usr/bin/env node
'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const strategyCore = require('./submission-strategy-core.js');
const source = fs.readFileSync(path.join(__dirname, 'index-bulk-submission.js'), 'utf8');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const storageKey = 'ineburaBulkSubmissionRequests:v1';
const strategy = (product, sequential = false) => ({ id:product, applyOn:'PRODUCT', productCategory:product, status:'RUNNING', strategyType:sequential ? 'Invoice + Docs(Sequentially)' : 'Invoice + Docs(In 1 Shot)', selectedDocuments:['PURCHASE ORDER'] });
function fixture({ readyCount = 2, incompleteCount = 3, submittedCount = 22, documentsCount = 0, sequentialCount = 0, noProcessCount = 0, empty = false } = {}) {
  const nodes = new Map([...html.matchAll(/\bid="([^"]+)"/g)].map(match => [match[1], {
    _text:'', get textContent() { return this._text; }, set textContent(value) { this._text = String(value); },
    disabled:false, hidden:false, value:'', handlers:{}, attributes:{},
    addEventListener(event, handler) { this.handlers[event] = handler; },
    setAttribute(name, value) { this.attributes[name] = value; },
    focus() {},
    click() { if (!this.disabled) this.handlers.click?.(); }
  }]));
  const node = id => { assert.ok(nodes.has(id), `Missing real DOM element ${id}`); return nodes.get(id); };
  node('bulkSubmitAction').options = [...html.match(/<select id="bulkSubmitAction"[\s\S]*?<\/select>/)[0].matchAll(/<option value="([^"]*)"/g)].map(match => ({ value:match[1] }));
  const invoice = (prefix, index, product, attachedDocuments, invoiceStatus = 'Not Submitted') => ({ invoiceNo:`${prefix}-${index}`, productCategory:product, attachedDocuments, invoiceStatus });
  const invoices = empty ? [] : [
    ...Array.from({ length:readyCount }, (_, i) => invoice('READY', i, 'One shot', ['Invoice Copy', 'PURCHASE ORDER'])),
    ...Array.from({ length:incompleteCount }, (_, i) => invoice('PENDING', i, 'One shot', [])),
    ...Array.from({ length:submittedCount }, (_, i) => invoice('SENT', i, 'Sequential', ['Invoice', 'PURCHASE ORDER'], 'Submitted')),
    ...Array.from({ length:documentsCount }, (_, i) => invoice('DOCS', i, 'Sequential', ['PURCHASE ORDER'])),
    ...Array.from({ length:sequentialCount }, (_, i) => invoice('SEQ', i, 'Sequential', ['Invoice'])),
    ...Array.from({ length:noProcessCount }, (_, i) => invoice('NO-PROCESS', i, 'Unconfigured', ['Invoice']))
  ];
  const values = new Map([[strategyCore.KEY, JSON.stringify([strategy('One shot'), strategy('Sequential', true)])]]);
  const localStorage = {
    fail:false,
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { if (this.fail) throw new Error('Quota'); values.set(key, String(value)); }
  };
  const selection = new Set(invoices.map(row => row.invoiceNo));
  const modal = { visible:false, show() { this.visible = true; }, hide() { this.visible = false; } };
  const notifications = [];
  const window = { bootstrap:{ Modal:{ getOrCreateInstance:() => modal } }, SubmissionStrategy:strategyCore };
  vm.runInNewContext(source, { document:{ getElementById:id => nodes.get(id) }, window, localStorage, selectedInvoiceNos:selection, customersData:[{ name:'ABC Pvt Ltd', invoices }], showTransientNotification:(title,message,tone) => notifications.push({title,message,tone}) });
  const open = () => node('bulkSubmitInvoices').click();
  const choose = value => { node('bulkSubmitAction').value = value; node('bulkSubmitAction').handlers.change(); };
  open();
  return { node, invoices, localStorage, selection, modal, notifications, open, choose, confirm:() => node('bulkSubmitConfirm').click(), requests:() => JSON.parse(localStorage.getItem(storageKey) || '[]') };
}
test('three overview cards reconcile all six dispositions', () => {
  const f = fixture({ readyCount:12, incompleteCount:2, submittedCount:10, documentsCount:3, sequentialCount:2, noProcessCount:1 });
  assert.equal(f.node('bulkSubmitSummary').textContent, '30 invoices selected');
  assert.equal(f.node('bulkSubmitProcessCount').textContent, '17');
  assert.equal(f.node('bulkSubmitSubmittedCount').textContent, '10');
  assert.equal(f.node('bulkSubmitAttentionCount').textContent, '3');
  assert.equal(f.node('bulkSubmitDocumentsCount').textContent, '3');
  assert.equal(f.node('bulkSubmitSequentialCount').textContent, '2');
  assert.equal(f.node('bulkSubmitNoProcessCount').textContent, '1');
});
test('ready action excludes previously submitted and incomplete invoices', () => {
  const f = fixture(); f.confirm();
  assert.deepEqual(f.requests()[0].invoiceNos, ['READY-0', 'READY-1']);
  assert.deepEqual(f.requests()[0].resubmissionInvoiceNos, []);
  assert.equal(f.requests()[0].action, 'submit');
});
test('combined operation is removed from the UI and cannot be requested', () => {
  const f = fixture();
  assert.deepEqual(f.node('bulkSubmitAction').options.map(option => option.value), ['', 'submit', 'resend', 'documents', 'sequential']);
  assert.doesNotMatch(html, /bulkSubmitOption-all/);
  f.choose('all'); f.confirm();
  assert.deepEqual(f.requests(), []);
});
test('resend is separate and does not include new or incomplete invoices', () => {
  const f = fixture(); f.choose('resend'); f.confirm();
  assert.equal(f.requests()[0].invoiceNos.length, 22);
  assert.ok(f.requests()[0].invoiceNos.every(number => number.startsWith('SENT-')));
  assert.match(f.notifications[0].message, /status stays unchanged/);
});
test('sequential documents-only requests include only pending invoices and keep status', () => {
  const f = fixture({ documentsCount:3, sequentialCount:2 }); f.choose('documents'); f.confirm();
  assert.deepEqual(f.requests()[0].invoiceNos, ['DOCS-0', 'DOCS-1', 'DOCS-2']);
  assert.equal(f.requests()[0].documentOnly, true);
  assert.deepEqual(f.requests()[0].resubmissionInvoiceNos, []);
  assert.deepEqual(f.requests()[0].documentsByInvoice['DOCS-0'], ['PURCHASE ORDER']);
  assert.ok(f.invoices.filter(row => row.invoiceNo.startsWith('DOCS-')).every(row => row.invoiceStatus === 'Not Submitted'));
});
test('sequential submission can send the invoice before its other requirements arrive', () => {
  const f = fixture({ sequentialCount:2 }); f.choose('sequential'); f.confirm();
  assert.deepEqual(f.requests()[0].invoiceNos, ['SEQ-0', 'SEQ-1']);
  assert.equal(f.requests()[0].documentOnly, false);
  assert.deepEqual(f.requests()[0].documentsByInvoice['SEQ-0'], ['INVOICE']);
  assert.match(f.notifications[0].message, /when Outlook accepts/);
});
test('zero-count operations stay disabled and a submitted-only selection offers resending', () => {
  const f = fixture({ readyCount:0 });
  assert.equal(f.node('bulkSubmitAction').value, 'resend');
  assert.equal(f.node('bulkSubmitConfirm').textContent, 'Resend 22 invoices');
  assert.equal(f.node('bulkSubmitAction').options.find(row => row.value === 'submit').disabled, true);
});
test('missing documents and unmatched strategies remain separate and cannot be sent', () => {
  const f = fixture({ readyCount:0, submittedCount:0, noProcessCount:2 });
  assert.equal(f.node('bulkSubmitAttentionCount').textContent, '5');
  assert.equal(f.node('bulkSubmitPendingCount').textContent, '3');
  assert.equal(f.node('bulkSubmitNoProcessCount').textContent, '2');
  assert.equal(f.node('bulkSubmitConfirm').disabled, true);
  f.choose('all'); f.confirm(); assert.deepEqual(f.requests(), []);
});
test('empty selection has no enabled action or request', () => {
  const f = fixture({ empty:true });
  assert.equal(f.node('bulkSubmitSummary').textContent, '0 invoices selected');
  assert.equal(f.node('bulkSubmitConfirm').disabled, true);
  f.confirm(); assert.deepEqual(f.requests(), []);
});
test('a recorded request cannot be submitted twice from the same dialog', () => {
  const f = fixture(); f.confirm(); f.confirm();
  assert.equal(f.requests().length, 1);
  assert.equal(f.node('bulkSubmitConfirm').disabled, true);
  assert.equal(f.node('bulkSubmitAction').disabled, true);
});
test('readiness changes require a fresh review before confirming', () => {
  const f = fixture(); f.invoices[0].attachedDocuments = [];
  f.confirm(); assert.deepEqual(f.requests(), []);
  assert.equal(f.node('bulkSubmitReadyCount').textContent, '1');
  assert.match(f.node('bulkSubmitActionHint').textContent, /changed/);
  f.confirm(); assert.deepEqual(f.requests()[0].invoiceNos, ['READY-1']);
});
test('already sent sequential documents are not resent by the documents-only action', () => {
  const f = fixture({ documentsCount:1 });
  f.invoices.find(row => row.invoiceNo === 'DOCS-0').sequentialSentDocuments = ['PURCHASE ORDER'];
  f.open();
  assert.equal(f.node('bulkSubmitDocumentsCount').textContent, '0');
  assert.equal(f.node('bulkSubmitPendingCount').textContent, '4');
});
test('storage failure leaves the dialog retryable and does not claim success', () => {
  const f = fixture(); f.localStorage.fail = true; f.confirm();
  assert.deepEqual(f.requests(), []);
  assert.equal(f.node('bulkSubmitConfirm').disabled, false);
  assert.match(f.node('bulkSubmitResult').textContent, /could not be saved/);
  assert.equal(f.modal.visible, true);
  assert.equal(f.notifications.length, 0);
  f.localStorage.fail = false; f.confirm(); assert.equal(f.requests().length, 1);
});
test('invalid request history is preserved rather than overwritten', () => {
  const f = fixture(); f.localStorage.setItem(storageKey, 'invalid'); f.confirm();
  assert.equal(f.localStorage.getItem(storageKey), 'invalid');
  assert.equal(f.node('bulkSubmitResult').attributes['data-state'], 'error');
});
test('library menu choices change the action and close after one selection', () => {
  const f = fixture();
  f.node('bulkSubmitActionDropdown').open = true;
  f.node('bulkSubmitOption-resend').click();
  assert.equal(f.node('bulkSubmitAction').value, 'resend');
  assert.equal(f.node('bulkSubmitActionDropdown').open, false);
  assert.equal(f.node('bulkSubmitOption-resend').attributes['aria-selected'], 'true');
  assert.equal(f.node('bulkSubmitConfirm').textContent, 'Resend 22 invoices');
});
test('library menu preserves unavailable and post-request disabled choices', () => {
  const f = fixture();
  assert.equal(f.node('bulkSubmitOption-documents').disabled, true);
  f.node('bulkSubmitOption-documents').click();
  assert.equal(f.node('bulkSubmitAction').value, 'submit');
  f.confirm();
  assert.equal(f.node('bulkSubmitActionTrigger').attributes['aria-disabled'], 'true');
  assert.equal(f.node('bulkSubmitOption-resend').disabled, true);
});
test('successful actions close the popup and use the shared success notification', () => {
  for (const action of ['submit','resend','documents','sequential']) {
    const f = fixture({ documentsCount:1, sequentialCount:1 });
    assert.equal(f.modal.visible, true);
    f.choose(action); f.confirm();
    assert.equal(f.modal.visible, false);
    assert.equal(f.node('bulkSubmitResult').hidden, true);
    assert.equal(f.notifications.length, 1);
    assert.equal(f.notifications[0].tone, 'success');
    f.confirm();
    assert.equal(f.notifications.length, 1);
  }
});
