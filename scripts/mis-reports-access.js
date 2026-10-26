/* MIS report preview: scope is resolved from current assignment metadata, never
   inferred from the captured reference reports or their display values. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IneburaMisReports = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const id = 'mis-portfolio-preview';
  const descriptor = Object.freeze({
    id, name: 'MIS Portfolio Preview', mis: true, parameter: 'date',
    headers: ['Invoice Number', 'Client', 'Subclient', 'Assigned To', 'Customer', 'Invoice Date', 'Outstanding Amount'],
    rows: [], rowMetadata: []
  });
  const text = value => String(value ?? '');
  const normalized = value => text(value).trim().toLowerCase();
  function role(value, core) {
    if (core?.userRole) return core.userRole(value);
    const key = normalized(value).replace(/[^a-z]/g, '');
    return key === 'mis' || key === 'misuser' ? 'mis' : key === 'mismanager' ? 'mis-manager' : key;
  }
  function context(options = {}, core) {
    const query = new URLSearchParams(options.search || '');
    const explicit = query.has('misUser');
    const activeRole = role(options.activeRole, core);
    const requested = explicit || activeRole === 'mis' || activeRole === 'mis-manager' || !!options.identityError;
    if (!requested) return {requested: false, authorized: false, user: null, userId: '', explicit: false};
    const users = Array.isArray(options.state?.users) ? options.state.users : [];
    const matches = explicit
      ? users.filter(user => text(user.id) === query.get('misUser'))
      : users.filter(user => normalized(user.name) === normalized(options.activeName) && normalized(options.activeName) && role(user.role, core) === activeRole);
    const user = matches.length === 1 ? matches[0] : null;
    const userRole = role(user?.role, core);
    const authorized = !!(core?.visibleInvoices && core?.scopeSummary && core?.isActive && options.state && !options.error && !options.identityError && user && (userRole === 'mis' || userRole === 'mis-manager') && core.isActive(user));
    return {
      requested: true, authorized, explicit, user: authorized ? user : null,
      userId: authorized ? text(user.id) : '', userRole: authorized ? userRole : '',
      reason: authorized ? '' : options.error ? 'MIS access could not be loaded. Ask Admin to review User Setup.' : 'No active MIS user matches this session. Ask Admin to review User Setup.'
    };
  }
  function fingerprint(options, resolved) {
    // Revisions plus complete scoped state also detect direct local-state edits
    // that did not increment the store revision. Non-MIS reports stay independent.
    return JSON.stringify([
      text(options.search), text(options.activeRole), text(options.activeName),
      resolved.requested ? options.state : null,
      resolved.requested ? text(options.error) : '', resolved.authorized, resolved.userId
    ]);
  }
  function catalog(reports, resolved) {
    return resolved.requested ? [descriptor] : reports.filter(report => report.id !== id);
  }
  function isoDay(value) {
    const match = text(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return '';
    const day = new Date(Date.UTC(+match[1], +match[2] - 1, +match[3]));
    return day.getUTCFullYear() === +match[1] && day.getUTCMonth() === +match[2] - 1 && day.getUTCDate() === +match[3] ? match[0] : '';
  }
  const periodDay = date => date ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}` : '';
  const displayDay = value => { const day = isoDay(value); return day ? `${day.slice(8)}-${day.slice(5, 7)}-${day.slice(0, 4)}` : ''; };
  function resolve(core, state, resolved, period = {}) {
    if (!resolved.requested || !resolved.authorized || !core?.visibleInvoices) throw new Error(resolved.reason || 'MIS report access is unavailable.');
    const currentUser = state.users?.find(user => text(user.id) === resolved.userId);
    if (!currentUser || !core.isActive(currentUser) || !['mis', 'mis-manager'].includes(role(currentUser.role, core))) throw new Error('MIS report access has changed. Generate the report again.');
    const start = periodDay(period.start), end = periodDay(period.end);
    if (start && end && start > end) throw new Error('Start date must be on or before the end date.');
    const lookup = (rows, key) => new Map((rows || []).map(item => [text(item.id), text(item[key] || item.name || item.id)]));
    const clients = lookup(state.clients, 'name'), subclients = lookup(state.subclients, 'name'), users = lookup(state.users, 'name');
    const seen = new Set();
    const invoices = core.visibleInvoices(state, resolved.userId).filter(invoice => {
      const invoiceId = text(invoice.id);
      if (!invoiceId || seen.has(invoiceId)) return false;
      seen.add(invoiceId);
      const day = isoDay(invoice.invoiceDate);
      return (!start && !end) || !!(day && (!start || day >= start) && (!end || day <= end));
    });
    return {
      ...descriptor,
      scopeSummary: core.scopeSummary(state, resolved.userId),
      rows: invoices.map(invoice => [
        text(invoice.invoiceNo), clients.get(text(invoice.clientId)) || text(invoice.clientId),
        subclients.get(text(invoice.subclientId)) || text(invoice.subclientId),
        users.get(text(invoice.assigneeId)) || text(invoice.assigneeId), text(invoice.customerName),
        displayDay(invoice.invoiceDate), Number.isFinite(Number(invoice.outstanding)) ? Number(invoice.outstanding) : ''
      ]),
      rowMetadata: invoices.map(invoice => ({invoiceId: text(invoice.id), clientId: text(invoice.clientId), subclientId: text(invoice.subclientId), assigneeId: text(invoice.assigneeId)}))
    };
  }
  function approvedRows(previousReport, requestedRows, currentReport) {
    if (previousReport?.id !== id || currentReport?.id !== id) throw new Error('This report is unavailable in MIS access.');
    const knownRows = new Map(previousReport.rows.map((row, index) => [row, previousReport.rowMetadata[index]?.invoiceId]));
    const freshRows = new Map(currentReport.rowMetadata.map((meta, index) => [meta.invoiceId, currentReport.rows[index]]));
    const seen = new Set();
    return requestedRows.flatMap(row => {
      const invoiceId = knownRows.get(row);
      // Match stable invoice IDs, not invoice numbers or mutable cell text.
      if (!invoiceId || !freshRows.has(invoiceId) || seen.has(invoiceId)) return [];
      seen.add(invoiceId);
      return [freshRows.get(invoiceId)];
    });
  }
  return {id, descriptor, context, fingerprint, catalog, resolve, approvedRows};
});
