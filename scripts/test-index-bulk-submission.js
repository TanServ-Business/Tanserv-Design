#!/usr/bin/env node
'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const source = fs.readFileSync(path.join(__dirname, 'index-bulk-submission.js'), 'utf8');
const storageKey = 'ineburaBulkSubmissionRequests:v1';

function fixture({ readyCount = 2, incompleteCount = 3, submittedCount = 22 } = {}) {
  const nodes = new Map();
  const node = (id) => {
    if (!nodes.has(id)) nodes.set(id, {
      textContent: '', disabled: false, hidden: false, handlers: {},
      addEventListener(event, handler) { this.handlers[event] = handler; },
      click() { this.handlers.click?.(); }
    });
    return nodes.get(id);
  };
  const invoices = [
    ...Array.from({ length: readyCount }, (_, index) => ({ invoiceNo: `READY-${index}`, invoiceStatus: 'Not Submitted', attachedDocuments: ['Invoice Copy'] })),
    ...Array.from({ length: incompleteCount }, (_, index) => ({ invoiceNo: `PENDING-${index}`, invoiceStatus: 'Not Submitted', attachedDocuments: [] })),
    ...Array.from({ length: submittedCount }, (_, index) => ({ invoiceNo: `SENT-${index}`, invoiceStatus: 'Submitted' }))
  ];
  const values = new Map();
  const localStorage = {
    getItem(key) { return values.has(key) ? values.get(key) : null; },
    setItem(key, value) { values.set(key, String(value)); }
  };
  const window = {
    bootstrap: { Modal: { getOrCreateInstance: () => ({ show() {} }) } },
    SubmissionStrategy: {
      defaultStrategies: [{}],
      read: () => [{}],
      resolve: () => ({}),
      requirements: () => [{ name: 'Invoice Copy' }]
    }
  };
  vm.runInNewContext(source, {
    document: { getElementById: node }, window, localStorage,
    selectedInvoiceNos: new Set(invoices.map(invoice => invoice.invoiceNo)),
    customersData: [{ name: 'ABC Pvt Ltd', product: 'Healthcare', invoices }]
  }, { filename: 'index-bulk-submission.js' });
  node('bulkSubmitInvoices').click();
  return { node, requests: () => JSON.parse(localStorage.getItem(storageKey) || '[]') };
}

const all = fixture();
assert.equal(all.node('bulkSubmitAll').textContent, 'Submit all 24 invoices');
assert.equal(all.node('bulkSubmitReady').textContent, 'Submit 2 ready invoices');
assert.equal(all.node('bulkSubmitPendingCount').textContent, 3);
all.node('bulkSubmitAll').click();
assert.equal(all.requests().length, 1);
assert.equal(all.requests()[0].invoiceNos.length, 24);
assert.equal(all.requests()[0].resubmissionInvoiceNos.length, 22);
assert.ok(all.requests()[0].invoiceNos.every(invoiceNo => !invoiceNo.startsWith('PENDING-')));
assert.equal(all.node('bulkSubmitAll').disabled, true);
assert.equal(all.node('bulkSubmitReady').disabled, true);

const readyOnly = fixture();
readyOnly.node('bulkSubmitReady').click();
assert.deepEqual(readyOnly.requests()[0].invoiceNos, ['READY-0', 'READY-1']);
assert.deepEqual(readyOnly.requests()[0].resubmissionInvoiceNos, []);

const repeatOnly = fixture({ readyCount: 0, incompleteCount: 3, submittedCount: 22 });
assert.equal(repeatOnly.node('bulkSubmitReady').disabled, true);
assert.equal(repeatOnly.node('bulkSubmitAll').disabled, false);
assert.equal(repeatOnly.node('bulkSubmitAll').textContent, 'Submit all 22 invoices');

console.log('Bulk submission choices include previously submitted invoices only when requested.');
