/* Read-only report projection from issued Dunning snapshots; no current balances or contacts. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IneburaDunningReport = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const columns = Object.freeze([
    ['clientCode', 'Client Code'], ['customerCode', 'Customer code'], ['customerName', 'customer name'],
    ['invoiceNumber', 'invoice number'], ['invoiceAmount', 'invoice amount'], ['invoiceDueDate', 'invoice due date'],
    ['dunningLetter', 'Dunning letter'], ['dunningLetterReferenceNo', 'Dunning letter reference no'],
    ['dunningLetterIssueDate', 'Dunning letter issue date'], ['recipients', 'recipients (comma separated)']
  ].map(([key, label]) => Object.freeze({ key, label, type: key === 'invoiceAmount' ? 'number' : ['invoiceDueDate', 'dunningLetterIssueDate'].includes(key) ? 'date' : 'text' })));
  function role(context) { const value = String(context?.role || '').trim().toLowerCase().replace(/[ _]+/g, '-'); return ({ admin: 'client-admin', clientadmin: 'client-admin' })[value] || value; }
  const canAccess = context => role(context) === 'client-admin' && Boolean(context?.clientId);
  function date(value) {
    const str = String(value || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(str) || !Number.isFinite(Date.parse(`${str}T00:00:00Z`)) || new Date(`${str}T00:00:00Z`).toISOString().slice(0, 10) !== str) return '';
    return str;
  }
  function visibleInvoice(invoice, snapshot, context) {
    const customer = snapshot.customer || {};
    const clientId = invoice.clientId || customer.clientId || snapshot.clientId;
    if (!clientId || clientId !== context.clientId) return false;
    return true;
  }
  const text = value => value === null || value === undefined ? '' : String(value);
  function invoiceAmount(invoice) {
    const source = invoice.originalAmount !== undefined && invoice.originalAmount !== null && invoice.originalAmount !== '' ? invoice.originalAmount : invoice.amount;
    return source !== undefined && source !== null && source !== '' && Number.isFinite(Number(source)) ? Number(source) : '';
  }
  function allRows(state, context) {
    if (!canAccess(context)) return [];
    const rows = [];
    for (const email of state.emails || []) {
      if (!['sent', 'partial'].includes(email.status) || !email.letterSnapshot) continue;
      const snapshot = email.letterSnapshot, customer = snapshot.customer || {};
      const issueDate = date(snapshot.date || snapshot.sentAt || email.date);
      const stage = Number(snapshot.stageNumber || email.stage || 0);
      const reference = text(snapshot.reference || email.reference);
      const recipients = Array.isArray(email.to) ? email.to.map(value => text(typeof value === 'object' ? value.email : value)).filter(Boolean).join(', ') : text(email.to);
      for (const invoice of snapshot.invoices || []) {
        if (!visibleInvoice(invoice, snapshot, context)) continue;
        rows.push({
          clientCode: text(snapshot.clientCode || customer.clientCode || invoice.clientCode),
          customerCode: text(snapshot.customerCode || customer.customerCode || customer.code || invoice.customerCode),
          customerName: text(customer.name), invoiceNumber: text(invoice.invoiceNo || invoice.invoiceNumber),
          invoiceAmount: invoiceAmount(invoice), invoiceDueDate: date(invoice.dueDate),
          dunningLetter: stage ? `DL${stage}` : '',
          dunningLetterReferenceNo: reference, dunningLetterIssueDate: issueDate, recipients,
          _stage: stage, _letterId: text(email.id || reference), _customerKey: text(customer.id || `${customer.customerCode || ''}:${customer.name || ''}`)
        });
      }
    }
    return rows.sort((a, b) => b.dunningLetterIssueDate.localeCompare(a.dunningLetterIssueDate) || a.dunningLetterReferenceNo.localeCompare(b.dunningLetterReferenceNo) || a.invoiceNumber.localeCompare(b.invoiceNumber));
  }
  function filterRows(rows, filters = {}) {
    const from = filters.dateFrom ? date(filters.dateFrom) : '', to = filters.dateTo ? date(filters.dateTo) : '';
    if (filters.dateFrom && !from || filters.dateTo && !to) throw new Error('Choose valid issue dates.');
    if (from && to && from > to) throw new Error('The issue date from must be on or before the issue date to.');
    const search = text(filters.customer).trim().toLocaleLowerCase(), stage = Number(filters.stage || 0);
    return rows.filter(row => (!(from || to) || Boolean(row.dunningLetterIssueDate)) && (!from || row.dunningLetterIssueDate >= from) && (!to || row.dunningLetterIssueDate <= to) && (!search || `${row.customerName} ${row.customerCode}`.toLocaleLowerCase().includes(search)) && (!stage || row._stage === stage));
  }
  function projectRows(state, context, filters) { return filterRows(allRows(state, context), filters); }
  function summary(rows) { return { invoices: rows.length, letters: new Set(rows.map(row => row._letterId)).size, customers: new Set(rows.map(row => row._customerKey)).size }; }
  function buildDataset(state, context, filters = {}) {
    const authorized = canAccess(context), projected = authorized ? projectRows(state, context, filters) : [];
    return { key: 'dunning-letters', title: 'Dunning Letters', authorized, columns: columns.map(column => ({ ...column })), headers: columns.map(column => column.label), rows: projected.map(row => columns.map(column => row[column.key])), summary: summary(projected) };
  }
  function csvCell(value) {
    let result = text(value);
    // Quoting alone does not prevent spreadsheet formula execution. Keep genuine numeric
    // amount values numeric; prefix untrusted strings that spreadsheet apps may evaluate.
    if (typeof value !== 'number' && /^[\s\u0000-\u001f\uFEFF]*[=+\-@]/.test(result)) result = `'${result}`;
    return `"${result.replace(/"/g, '""')}"`;
  }
  function toCsv(rows) { return '\uFEFF' + [columns.map(column => csvCell(column.label)).join(','), ...rows.map(row => columns.map(column => csvCell(row[column.key])).join(','))].join('\r\n') + '\r\n'; }
  return Object.freeze({ columns, canAccess, allRows, filterRows, projectRows, summary, buildDataset, toCsv });
});
