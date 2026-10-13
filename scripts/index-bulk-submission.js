/* Bulk submission confirmation for the AR landing page demo. */
(() => {
  'use strict';
  const trigger = document.getElementById('bulkSubmitInvoices');
  const element = document.getElementById('bulkSubmitInvoicesModal');
  if (!trigger || !element) return;
  const $ = id => document.getElementById(id);
  const modal = window.bootstrap?.Modal.getOrCreateInstance(element);
  let ready = [], incomplete = [];
  const names = values => new Set(values.map(value => String(value || '').trim().toUpperCase()));
  function reviewSelection() {
    ready = []; incomplete = [];
    let alreadySubmitted = 0;
    const strategies = window.SubmissionStrategy?.read(localStorage, window.SubmissionStrategy.defaultStrategies) || [];
    for (const invoiceNo of selectedInvoiceNos) {
      const customer = customersData.find(row => (row.invoices || []).some(invoice => invoice.invoiceNo === invoiceNo));
      const invoice = customer?.invoices.find(row => row.invoiceNo === invoiceNo);
      if (!invoice) continue;
      if (/submitted/i.test(invoice.invoiceStatus || '') && !/not submitted/i.test(invoice.invoiceStatus || '')) { alreadySubmitted++; continue; }
      const context = { ...invoice, productCategory: invoice.productCategory || customer.product };
      const strategy = window.SubmissionStrategy?.resolve(context, strategies);
      const required = strategy ? window.SubmissionStrategy.requirements(context, strategy).map(item => item.name) : [];
      const available = names((invoice.attachedDocuments || customer.documents || []).map(item => typeof item === 'string' ? item : item.name));
      const missing = required.filter(name => !available.has(name.toUpperCase()));
      if (!strategy) missing.push('Matching submission strategy');
      if (/docs?\s*(pending|required)|further docs|invoice copy required/i.test(`${invoice.primaryStatus || ''} ${invoice.status || ''}`) && !missing.length) missing.push('Supporting document flagged as missing');
      (missing.length ? incomplete : ready).push({ invoiceNo, customer:customer.name, missing });
    }
    $('bulkSubmitSummary').textContent = `${selectedInvoiceNos.size} selected · ${alreadySubmitted} already submitted · ${ready.length} ready to submit.`;
    $('bulkSubmitMissing').textContent = `${incomplete.length} invoice${incomplete.length === 1 ? '' : 's'} do not have every required document attached and will remain pending.`;
    $('bulkSubmitReady').disabled = ready.length === 0;
    $('bulkSubmitResult').hidden = true;
  }
  trigger.addEventListener('click', () => { reviewSelection(); modal?.show(); });
  $('bulkSubmitReady').addEventListener('click', () => {
    if (!ready.length) return;
    const requests = JSON.parse(localStorage.getItem('ineburaBulkSubmissionRequests:v1') || '[]');
    requests.push({ id:`SUB-${Date.now()}`, createdAt:new Date().toISOString(), invoiceNos:ready.map(row => row.invoiceNo), status:'Awaiting Outlook delivery' });
    localStorage.setItem('ineburaBulkSubmissionRequests:v1', JSON.stringify(requests));
    $('bulkSubmitResult').textContent = `${ready.length} document-complete invoice${ready.length === 1 ? '' : 's'} added to this demo submission request. The ${incomplete.length} incomplete invoice${incomplete.length === 1 ? '' : 's'} remain pending. Submitted status requires Outlook to accept the corresponding email part.`;
    $('bulkSubmitResult').hidden = false;
    $('bulkSubmitReady').disabled = true;
  });
})();
