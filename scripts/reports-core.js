(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.IneburaReportsCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const text = value => String(value ?? '');
  const blank = value => value === '' || value == null || value === '—';
  function numeric(value) {
    if (blank(value)) return null;
    const cleaned = text(value).replace(/[₹,%\s,]/g, '');
    return /^-?\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : null;
  }
  function date(value) {
    const m = text(value).match(/^(\d{2})[-/](\d{2})[-/](\d{4})(?:\s|$)/);
    if (!m) return null;
    const d = new Date(Number(m[3]), Number(m[2]) - 1, Number(m[1]));
    return d.getFullYear() === +m[3] && d.getMonth() === +m[2]-1 && d.getDate() === +m[1] ? d : null;
  }
  function filterRows(rows, filters) {
    return rows.filter(row => Object.entries(filters).every(([column, value]) => text(row[column]) === value));
  }
  function sortRows(rows, column, direction) {
    if (column == null) return rows.slice();
    return rows.map((row, index) => ({row,index})).sort((a,b) => {
      const av=a.row[column], bv=b.row[column];
      if (blank(av) || blank(bv)) return blank(av) === blank(bv) ? a.index-b.index : blank(av) ? 1 : -1;
      const an=numeric(av),bn=numeric(bv),ad=date(av),bd=date(bv);
      const result=an!=null && bn!=null ? an-bn : ad && bd ? ad-bd : text(av).localeCompare(text(bv),undefined,{numeric:true,sensitivity:'base'});
      return result ? result * direction : a.index-b.index;
    }).map(x=>x.row);
  }
  function csv(headers,rows) {
    const cell=v=>{const s=text(v);const unsafe=/^[=+@\t\r]/.test(s)||(/^\-/.test(s)&&numeric(s)==null);return '"'+(unsafe?"'"+s:s).replaceAll('"','""')+'"';};
    const data=rows.map(row=>row.map(v=>blank(v)?'':/^₹[\d,.-]+$/.test(text(v))?numeric(v):v));
    return '\uFEFF'+[headers,...data].map(row=>row.map(cell).join(',')).join('\r\n');
  }
  function dateColumn(report) {
    const preferred = {
      'Activity Report Full':'Activity Created Date',
      'Invoice Submission Tracker Full':'Activity Date',
      'Visit Plan':'Plan For Date','Visit Details':'Plan For Date'
    }[report.name];
    const index=report.headers.indexOf(preferred);
    return index>=0?index:report.headers.findIndex(h=>/used date|transaction date|date of upload/i.test(h));
  }
  function parameterRows(report, period) {
    if (report.parameter==='month') {
      if (!period.months.length) return report.rows.slice();
      return report.rows.filter(row=>period.months.some(m=>text(row[3])===m.label));
    }
    const index=dateColumn(report);
    if (report.parameter!=='date'||index<0||!period.start||!period.end) return report.rows.slice();
    return report.rows.filter(row=>{const d=date(row[index]);return d && d>=period.start && d<=period.end;});
  }
  return {text,blank,numeric,date,filterRows,sortRows,csv,parameterRows};
});
