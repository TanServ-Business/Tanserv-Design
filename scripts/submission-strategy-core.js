/* Shared rules for the local submission configuration and run preview. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SubmissionStrategy = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const KEY = 'submissionStrategies:review-v1';
  const defaultStrategies = [{ id:'submission-xeon-001', status:'RUNNING', strategyName:'Invoice Submission', strategySubtitle:'Xeon Infraservices Pvt Ltd', applyOn:'COMPANY', strategyType:'Invoice + Docs(In 1 Shot)', agentSelection:true, selectedDocuments:['PAYMENT RECEIPT','PURCHASE ORDER','INVOICE'], productCategory:'', batchInvoicesInOneEmail:false, bulkSendAfterDays:null, recipientList:'' }];
  const names = value => String(value || '').trim().toUpperCase().replace(/\s+/g, ' ');
  const documentName = value => names(value).replace(/^INVOICE COPY$/, 'INVOICE');
  const category = invoice => String(invoice.productCategory || invoice.product || '').trim().toLowerCase();
  function read(storage, fallback = []) {
    try { const rows = JSON.parse(storage.getItem(KEY) || 'null'); if (Array.isArray(rows)) return rows; } catch (_) { /* Use demo configuration. */ }
    return JSON.parse(JSON.stringify(fallback));
  }
  function validate(rows, candidate) {
    const others = rows.filter(row => row.id !== candidate.id);
    if (!['COMPANY','PRODUCT'].includes(candidate.applyOn)) return 'Choose Company or Product.';
    if (candidate.applyOn === 'COMPANY' && others.length) return 'A company-wide strategy must be the only strategy. Remove the product strategies first.';
    if (candidate.applyOn === 'PRODUCT') {
      if (!candidate.productCategory?.trim()) return 'Choose a product category.';
      if (others.some(row => row.applyOn === 'COMPANY')) return 'A company-wide strategy already applies to every invoice.';
      if (others.some(row => row.applyOn === 'PRODUCT' && names(row.productCategory) === names(candidate.productCategory))) return 'This product category already has a strategy.';
    }
    if (candidate.recipientList && String(candidate.recipientList).split(/[,;]+/).some(address => !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address.trim()))) return 'Enter valid customer email addresses, separated by commas.';
    if (candidate.batchInvoicesInOneEmail) {
      if (!Number.isInteger(candidate.bulkSendAfterDays) || candidate.bulkSendAfterDays < 0 || candidate.bulkSendAfterDays > 365) return 'Bulk send after must be a whole number from 0 to 365 days.';
      if (candidate.strategyType === 'Invoice + Docs(Sequentially)') return 'Sequential document sending is unavailable with bulk invoice email.';
    }
    return '';
  }
  function resolve(invoice, strategies) {
    const company = strategies.filter(row => row.applyOn === 'COMPANY');
    if (company.length) return company.length === 1 && !strategies.some(row => row.applyOn === 'PRODUCT') ? company[0] : null;
    const matches = strategies.filter(row => row.applyOn === 'PRODUCT' && String(row.productCategory || '').trim().toLowerCase() === category(invoice));
    return matches.length === 1 ? matches[0] : null;
  }
  function requirements(invoice, strategy) {
    if (!strategy) return invoice.requirements || [];
    const selected = strategy.strategyType === 'Invoice' ? ['INVOICE'] : [...new Set(['INVOICE',...(strategy.selectedDocuments || [])])];
    return [...new Set(selected.map(documentName))].map(name => {
      const existing = (invoice.requirements || []).find(requirement => documentName(requirement.name) === name);
      return existing || { id:`strategy-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`, name, scope:name.includes('(CUSTOMER)') ? 'customer' : 'invoice' };
    });
  }
  const recipients = (invoice, strategy) => [...new Set(String(invoice.submissionRecipients || strategy?.recipientList || 'Default customer recipients').split(/[,;]+/).map(item => item.trim().toLowerCase()).filter(Boolean))].sort();
  function assessment(state, invoice, strategy, core, attachments = [], at = new Date()) {
    if (core.submitted(invoice)) return { ready:false, reason:'Already submitted' };
    if (!state.settings.autoSubmission) return { ready:false, reason:'Automatic submission is off' };
    if (!strategy) return { ready:false, reason:'No matching submission strategy' };
    if (strategy.status !== 'RUNNING') return { ready:false, reason:'Submission strategy is paused' };
    if (invoice.automationSuppressed) return { ready:false, reason:'Completed manually or externally' };
    if (invoice.reason) return { ready:false, reason:invoice.reason };
    if (core.missing(state, invoice, attachments).length) return { ready:false, reason:'Awaiting required documents' };
    if (strategy.batchInvoicesInOneEmail) {
      const added = Date.parse(invoice.createdAt);
      if (!Number.isFinite(added)) return { ready:false, reason:'Date added to Inebura is unavailable' };
      const after = Number(strategy.bulkSendAfterDays);
      if (!Number.isInteger(after) || after < 0) return { ready:false, reason:'Bulk delay needs configuration' };
      if (at.getTime() < added + after * 86400000) return { ready:false, reason:'Waiting for bulk send date', readyAt:new Date(added + after * 86400000).toISOString() };
    }
    return { ready:true, reason:'Scheduled for submission' };
  }
  function plan(state, strategies, core, attachments = [], at = new Date()) {
    const batches = new Map(), decisions = new Map();
    state.invoices.forEach(invoice => {
      const strategy = resolve(invoice, strategies);
      const decision = assessment(state, invoice, strategy, core, attachments, at);
      decisions.set(invoice.invoiceNo, decision);
      if (!decision.ready) return;
      const list = recipients(invoice, strategy);
      const key = JSON.stringify([invoice.code, strategy.id, list]);
      if (!batches.has(key)) batches.set(key, { customerCode:invoice.code, customer:invoice.name, strategyId:strategy.id, strategyName:strategy.strategyName, recipients:list, invoices:[] });
      batches.get(key).invoices.push(invoice.invoiceNo);
    });
    return { batches:[...batches.values()], decisions };
  }
  return { KEY,defaultStrategies,read,validate,resolve,requirements,recipients,assessment,plan };
});
