/* Invoice-level issued-letter history in Module Configuration → Dunning Letters. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./dunning-report-data.js'), require('./reports-dunning.js'));
  else root.IneburaDunningManagementReport = factory(root.IneburaDunningReport, root.IneburaReportsDunning, root);
})(typeof window !== 'undefined' ? window : globalThis, function (projector, workbookBridge, host) {
  'use strict';
  const esc = value => String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[character]));
  function mount(container, options = {}) {
    if (!container) throw new Error('Choose an invoice report container.');
    const api = options.api || host?.IneburaDunning;
    const notify = typeof options.notify === 'function' ? options.notify : () => {};
    let filters = { dateFrom: '', dateTo: '', customer: '', stage: '' }, page = 1, disposed = false;
    const pageSize = 15;
    function canRead() { try { return projector.canAccess(api?.getContext()); } catch (_) { return false; } }
    function read(mode = 'filtered') {
      if (disposed) throw new Error('This Dunning report is no longer open.');
      const context = api?.getContext();
      if (!projector.canAccess(context)) throw new Error('Only Client Admin can view or download this Dunning report.');
      const all = projector.allRows(api.getState(), context);
      return { all, rows: mode === 'full' ? all : projector.filterRows(all, filters) };
    }
    function deny(error) {
      container.innerHTML = `<div class="dlReportNotice" role="alert">${esc(error.message)}</div>`;
    }
    function exportRows(mode = 'filtered') {
      try {
        const { rows } = read(mode);
        const XLSX = options.XLSX || host?.XLSX;
        if (!XLSX) throw new Error('The Excel export library could not load. Please reload and try again.');
        const report = workbookBridge.descriptor;
        const book = workbookBridge.workbook(XLSX, report, rows.map(row => projector.columns.map(column => row[column.key])));
        XLSX.writeFile(book, `dunning-letters${mode === 'full' ? '' : '_filtered'}.xlsx`);
        notify(`${mode === 'full' ? 'Complete' : 'Filtered'} Dunning invoice report downloaded.`);
        return book;
      } catch (error) { if (!canRead()) deny(error); notify(error.message); return null; }
    }
    function refresh() {
      if (disposed) return;
      let all, rows;
      try { ({ all, rows } = read()); } catch (error) { deny(error); return; }
      const stages = [...new Set(all.map(row => row._stage).filter(stage => stage > 0))].sort((a, b) => a - b);
      // Keep a selected stage even if newly refreshed history no longer contains it.
      if (filters.stage && !stages.includes(Number(filters.stage))) stages.push(Number(filters.stage));
      const summary = projector.summary(rows), pages = Math.max(1, Math.ceil(rows.length / pageSize));
      page = Math.min(page, pages);
      const shown = rows.slice((page - 1) * pageSize, page * pageSize);
      container.innerHTML = `<section class="dlReport" aria-label="Dunning invoice report">
        <div class="dlReportHeader"><div><h3>Invoice report</h3><p>One row per invoice in each issued letter. Values reflect the letter as sent.</p></div><div class="dlReportActions"><button type="button" data-dl-export="full">Download all XLSX</button><button type="button" data-dl-export="filtered">Download filtered XLSX</button></div></div>
        <form class="dlReportFilters" data-dl-filters>
          <label>Issue date from<input type="date" name="dateFrom" value="${esc(filters.dateFrom)}"></label>
          <label>Issue date to<input type="date" name="dateTo" value="${esc(filters.dateTo)}"></label>
          <label>Customer<input type="search" name="customer" placeholder="Name or code" value="${esc(filters.customer)}"></label>
          <label>Dunning letter<select name="stage"><option value="">All letters</option>${stages.map(stage => `<option value="${stage}" ${String(stage) === String(filters.stage) ? 'selected' : ''}>DL${stage}</option>`).join('')}</select></label>
          <button type="submit">Apply filters</button><button type="button" data-dl-clear>Clear</button>
        </form>
        <p class="dlReportSummary" role="status">${rows.length} invoice ${rows.length === 1 ? 'row' : 'rows'} · ${summary.letters} issued ${summary.letters === 1 ? 'letter' : 'letters'} · ${summary.customers} ${summary.customers === 1 ? 'customer' : 'customers'}</p>
        <div class="dlReportTableWrap" tabindex="0" aria-label="Invoice letter history"><table><thead><tr>${projector.columns.map(column => `<th scope="col">${esc(column.label)}</th>`).join('')}</tr></thead><tbody>${shown.length ? shown.map(row => `<tr>${projector.columns.map(column => `<td>${esc(row[column.key])}</td>`).join('')}</tr>`).join('') : '<tr><td colspan="10" class="dlReportEmpty">No issued letters match these filters.</td></tr>'}</tbody></table></div>
        <div class="dlReportPagination"><span>${rows.length ? `Showing ${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, rows.length)} of ${rows.length}` : '0 invoice rows'}</span><div><button type="button" data-dl-page="${page - 1}" ${page === 1 ? 'disabled' : ''} aria-label="Previous invoice report page">Previous</button><span>Page ${page} of ${pages}</span><button type="button" data-dl-page="${page + 1}" ${page === pages ? 'disabled' : ''} aria-label="Next invoice report page">Next</button></div></div>
      </section>`;
      container.querySelector('[data-dl-filters]').addEventListener('submit', event => {
        event.preventDefault();
        const form = event.currentTarget;
        const next = Object.fromEntries(['dateFrom', 'dateTo', 'customer', 'stage'].map(key => [key, form.elements.namedItem(key).value]));
        try { projector.filterRows(read('full').all, next); filters = next; page = 1; refresh(); }
        catch (error) { notify(error.message); }
      });
      container.querySelector('[data-dl-clear]').addEventListener('click', () => { filters = { dateFrom: '', dateTo: '', customer: '', stage: '' }; page = 1; refresh(); });
      container.querySelectorAll('[data-dl-export]').forEach(button => button.addEventListener('click', () => exportRows(button.dataset.dlExport)));
      container.querySelectorAll('[data-dl-page]').forEach(button => button.addEventListener('click', () => { page = Math.max(1, Number(button.dataset.dlPage)); refresh(); }));
    }
    const unsubscribe = typeof api?.subscribe === 'function' ? api.subscribe(refresh) : null;
    const onIdentity = () => refresh();
    host?.addEventListener?.('storage', onIdentity);
    host?.addEventListener?.('focus', onIdentity);
    refresh();
    return { refresh, exportRows, destroy() { disposed = true; unsubscribe?.(); host?.removeEventListener?.('storage', onIdentity); host?.removeEventListener?.('focus', onIdentity); container.innerHTML = ''; } };
  }
  return Object.freeze({ mount });
});
