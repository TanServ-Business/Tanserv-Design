/* Shared Dunning dataset and typed XLSX helpers. Reports no longer lists this report. */
(function(root, factory) {
  if(typeof module === 'object' && module.exports) module.exports = factory(require('./dunning-report-data.js'));
  else root.IneburaReportsDunning = factory(root.IneburaDunningReport);
})(typeof window !== 'undefined' ? window : globalThis, function(projector) {
  'use strict';
  const id = 'dunning-letters';
  const descriptor = {id, name:'Dunning Letters', parameter:'date', live:true, headers:projector.columns.map(c=>c.label), columns:projector.columns, rows:[]};
  function register(reports) { return reports.filter(report => ![id, 'dunning-letter-tracker'].includes(report.id)); }
  function legacyRoute(api, search) {
    const query = new URLSearchParams(search || '');
    if (![id, 'dunning-letter-tracker'].includes(query.get('report'))) return null;
    let authorized = false;
    try { authorized = !query.has('misUser') && projector.canAccess(api?.getContext()); } catch (_) { /* Fail closed. */ }
    return { authorized, destination: authorized ? 'admin.html?module=module-configuration&view=dunning-letters' : '' };
  }
  const iso = d => d ? `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}` : '';
  function resolve(api, period={}) {
    if(!api) throw new Error('Dunning history could not load. Please reload and try again.');
    const dataset = projector.buildDataset(api.getState(),api.getContext(),{dateFrom:iso(period.start),dateTo:iso(period.end)});
    if(!dataset.authorized) throw new Error('You do not have access to Dunning Letters for this client.');
    return {...descriptor, ...dataset, name:dataset.title};
  }
  function workbook(XLSX, report, rows) {
    // Explicit cell types preserve leading zeroes and formula-like text. Dates use
    // Excel serials calculated in UTC, avoiding timezone shifts at export/readback.
    const sheet = XLSX.utils.aoa_to_sheet([report.headers]);
    rows.forEach((row,r)=>report.columns.forEach((column,c)=>{
      const value=row[c]; if(value==='' || value==null) return;
      let cell={t:'s',v:String(value)};
      if(column.type==='number' && typeof value==='number') cell={t:'n',v:value};
      if(column.type==='date' && /^\d{4}-\d{2}-\d{2}$/.test(value)) cell={t:'n',v:Date.parse(value+'T00:00:00Z')/86400000+25569,z:'yyyy-mm-dd'};
      sheet[XLSX.utils.encode_cell({r:r+1,c})]=cell;
    }));
    sheet['!ref']=XLSX.utils.encode_range({s:{r:0,c:0},e:{r:rows.length,c:report.headers.length-1}});
    sheet['!cols']=report.headers.map(h=>({wch:Math.max(15,Math.min(65,h.length+2))}));
    const book=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(book,sheet,report.name.slice(0,31)); return book;
  }
  return {descriptor,register,legacyRoute,resolve,workbook};
});
