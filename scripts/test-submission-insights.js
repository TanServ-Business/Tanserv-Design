'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const journey = require('./submission-journey-core.js');
const insights = require('./submission-insights-core.js');

class Storage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}

test('default submission aging bands are non-overlapping and cover every day', () => {
  const ranges = insights.bands(insights.DEFAULT_THRESHOLDS);
  assert.deepEqual(ranges.map(range => range.label), [
    '0 days', '1–2 days', '3–5 days', '6–7 days', '8–10 days',
    '11–15 days', '16–30 days', '31–45 days', '46–60 days', '61–90 days', '91+ days'
  ]);
  for (let day = 0; day <= 400; day++) {
    assert.equal(ranges.filter(range => day >= range.start && day <= range.end).length, 1);
  }
});

test('former default buckets upgrade without overwriting customized settings', () => {
  const previous = [1, 2, 5, 7, 10, 15, 30, 45, 60, 90];
  const storage = new Storage();
  storage.setItem(insights.KEY, JSON.stringify(previous));
  assert.deepEqual(insights.readThresholds(storage), insights.DEFAULT_THRESHOLDS);
  assert.deepEqual(JSON.parse(storage.getItem(insights.KEY)), insights.DEFAULT_THRESHOLDS);
  storage.setItem(insights.KEY, JSON.stringify([2, 6, 8, 11, 16, 31, 46, 61, 91]));
  assert.deepEqual(insights.readThresholds(storage), insights.DEFAULT_THRESHOLDS);
  insights.saveThresholds(storage, [2, 6, 12]);
  assert.deepEqual(insights.readThresholds(storage), [2, 6, 12]);
  storage.setItem(insights.KEY, JSON.stringify(previous));
  storage.setItem(insights.GROUP_KEY, JSON.stringify([{ name:'Earlier', color:'#55257f', starts:[0, 1] }]));
  assert.deepEqual(insights.readConfig(storage).thresholds, previous);
});

test('client admin aging settings are saved, sorted and validated', () => {
  const storage = new Storage();
  assert.deepEqual(insights.readThresholds(storage), insights.DEFAULT_THRESHOLDS);
  assert.deepEqual(insights.saveThresholds(storage, [30, 1, 7]), [1, 7, 30]);
  assert.deepEqual(insights.readThresholds(storage), [1, 7, 30]);
  assert.throws(() => insights.saveThresholds(storage, [1, 1]), /different/);
  assert.throws(() => insights.saveThresholds(storage, [0]), /1 to 365/);
  assert.deepEqual(insights.readThresholds(storage), [1, 7, 30]);
});

test('custom groups persist, combine consecutive ranges and keep dashboard totals aligned', () => {
  const storage = new Storage();
  insights.saveThresholds(storage, [1, 2, 5, 7]);
  insights.saveGroups(storage, [{ name:'Early stage', color:'#55257f', starts:[0, 1, 2] }]);
  const config = insights.readConfig(storage);
  assert.deepEqual(insights.bands(config).map(band => [band.label, band.start, band.end]), [
    ['Early stage', 0, 4], ['5–6 days', 5, 6], ['7+ days', 7, Infinity]
  ]);
  const invoices = [
    { code:'A', invoiceDate:'2026-10-12', submissionStatus:'Not Submitted' },
    { code:'B', invoiceDate:'2026-10-08', submissionStatus:'Not Submitted' },
    { code:'C', invoiceDate:'2026-10-01', submissionStatus:'Not Submitted' }
  ];
  const chart = insights.summarize(invoices, config, journey, '2026-10-14');
  const detail = insights.detailRows(invoices, config, journey, '2026-10-14');
  assert.deepEqual(chart.ranges.map(row => row.count), [1, 1, 1]);
  assert.deepEqual(detail.map(row => row.count), chart.ranges.map(row => row.count));
  assert.throws(() => insights.saveGroups(storage, [{ name:'Gap', color:'#55257f', starts:[0, 2] }]), /consecutive/);
  assert.throws(() => insights.saveGroups(storage, [
    { name:'A', color:'#55257f', starts:[0, 1] }, { name:'B', color:'#55257f', starts:[1, 2] }
  ]), /only one/);
  insights.saveThresholds(storage, [3, 10]);
  assert.deepEqual(insights.readConfig(storage).groups, []);
});

test('each requested early submission bucket can be created from the presets', () => {
  const storage = new Storage();
  const requested = [
    { name:'0 days', color:'#55257f', starts:[0] },
    { name:'1–2 days', color:'#6b3b93', starts:[1] },
    { name:'3–5 days', color:'#8055a5', starts:[3] },
    { name:'6–7 days', color:'#956bb7', starts:[6] }
  ];
  insights.saveGroups(storage, requested, insights.DEFAULT_THRESHOLDS);
  const ranges = insights.bands(insights.readConfig(storage));
  assert.deepEqual(ranges.slice(0, 4).map(({ start, end, label }) => [start, end, label]), [
    [0, 0, '0 days'], [1, 2, '1–2 days'], [3, 5, '3–5 days'], [6, 7, '6–7 days']
  ]);
  assert.equal(ranges[4].label, '8–10 days');
});

test('submitted invoices stop aging on submission date and external submissions count as physical', () => {
  const invoices = [
    { invoiceDate:'2026-10-01', submissionStatus:'Submitted', submissionMedium:'Automated', submissionSubStatus:'Email Sent', firstSubmittedAt:'2026-10-03' },
    { invoiceDate:'2026-10-01', submissionStatus:'Submitted', submissionMedium:'External', submissionRecordedAt:'2026-10-08T04:00:00Z' },
    { invoiceDate:'2026-10-01', submissionStatus:'Submitted', submissionMedium:'Manual', submissionSubStatus:'Email Sent', submissionDate:'2026-10-06' },
    { invoiceDate:'2026-10-01', submissionStatus:'Submitted', submissionMedium:'Manual', submissionSubStatus:'Docs Sent', submissionDate:'2026-10-02' },
    { invoiceDate:'2026-10-01', submissionStatus:'Not Submitted' }
  ];
  const summary = insights.summarize(invoices, insights.DEFAULT_THRESHOLDS, journey, '2026-10-14');
  assert.equal(summary.total, 5);
  assert.deepEqual(summary.ranges.filter(range => range.count).map(range => [range.label,range.count]), [
    ['1–2 days', 2], ['3–5 days', 1], ['6–7 days', 1], ['11–15 days', 1]
  ]);
  assert.deepEqual(summary.mix, { Automated:1, Physical:1, Email:1, Courier:1, 'Not submitted':1 });
  assert.equal(summary.unavailableAging, 0);
});

test('missing submission date is reported as unavailable instead of aging through today', () => {
  const summary = insights.summarize([
    { invoiceDate:'2026-10-01', submissionStatus:'Submitted', submissionMedium:'External' }
  ], insights.DEFAULT_THRESHOLDS, journey, '2026-10-14');
  assert.equal(summary.unavailableAging, 1);
  assert.equal(summary.mix.Physical, 1);
});

test('drilldown ranges reconcile with chart counts and preserve customer and invoice values', () => {
  const invoices = [
    { code:'A', invoiceDate:'2026-10-01', value:100, submissionStatus:'Submitted', submissionMedium:'Manual', submissionDate:'2026-10-03' },
    { code:'A', invoiceDate:'2026-10-01', value:200, submissionStatus:'Submitted', submissionMedium:'Manual', submissionDate:'2026-10-04' },
    { code:'B', invoiceDate:'2026-10-01', value:300, submissionStatus:'Not Submitted' },
    { code:'C', invoiceDate:'', value:400, submissionStatus:'Not Submitted' }
  ];
  const rows = insights.detailRows(invoices, insights.DEFAULT_THRESHOLDS, journey, '2026-10-14');
  const chart = insights.summarize(invoices, insights.DEFAULT_THRESHOLDS, journey, '2026-10-14');
  assert.deepEqual(rows.map(row => row.count), chart.ranges.map(row => row.count));
  assert.equal(rows.reduce((total, row) => total + row.count, 0), chart.total - chart.unavailableAging);
  const early = rows.find(row => row.label === '1–2 days');
  assert.deepEqual([early.count, early.customers, early.submitted, early.pending, early.value], [1,1,1,0,100]);
  const next = rows.find(row => row.label === '3–5 days');
  assert.deepEqual([next.count, next.customers, next.submitted, next.pending, next.value], [1,1,1,0,200]);
  const pending = rows.find(row => row.label === '11–15 days');
  assert.deepEqual([pending.count, pending.customers, pending.submitted, pending.pending, pending.value], [1,1,0,1,300]);
  assert.ok(Math.abs(rows.reduce((total, row) => total + row.share, 0) - 100) < 1e-9);
});
