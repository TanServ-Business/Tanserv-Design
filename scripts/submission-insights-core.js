/* Shared submission aging settings and dashboard calculations for the local prototype. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SubmissionInsights = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const KEY = 'ineburaSubmissionAgingBands:v1';
  const GROUP_KEY = 'ineburaSubmissionAgingGroups:v1';
  const PREVIOUS_DEFAULT_THRESHOLDS = [
    [1, 2, 5, 7, 10, 15, 30, 45, 60, 90],
    [2, 6, 8, 11, 16, 31, 46, 61, 91]
  ];
  const DEFAULT_THRESHOLDS = [1, 3, 6, 8, 11, 16, 31, 46, 61, 91];
  const MIX_LABELS = ['Automated', 'Physical', 'Email', 'Courier', 'Not submitted'];

  function validateThresholds(value) {
    if (!Array.isArray(value) || !value.length || value.length > 20) throw new Error('Keep between 1 and 20 aging thresholds.');
    const numbers = value.map(item => Number(item));
    if (numbers.some(item => !Number.isInteger(item) || item < 1 || item > 365)) throw new Error('Enter whole-day thresholds from 1 to 365.');
    if (new Set(numbers).size !== numbers.length) throw new Error('Each aging threshold must be different.');
    return numbers.sort((a, b) => a - b);
  }
  function readThresholds(storage) {
    try {
      const saved = JSON.parse(storage.getItem(KEY) || 'null');
      if (saved === null) return [...DEFAULT_THRESHOLDS];
      const thresholds = validateThresholds(saved);
      // Upgrade only untouched former defaults; preserve intentionally customized ranges and groups.
      if (PREVIOUS_DEFAULT_THRESHOLDS.some(previous => JSON.stringify(thresholds) === JSON.stringify(previous)) && !storage.getItem(GROUP_KEY)) {
        storage.setItem(KEY, JSON.stringify(DEFAULT_THRESHOLDS));
        return [...DEFAULT_THRESHOLDS];
      }
      return thresholds;
    } catch (_) { return [...DEFAULT_THRESHOLDS]; }
  }
  function saveThresholds(storage, value) {
    const thresholds = validateThresholds(value);
    storage.setItem(KEY, JSON.stringify(thresholds));
    storage.removeItem(GROUP_KEY);
    return thresholds;
  }
  function baseBands(thresholds) {
    const starts = [0, ...validateThresholds(thresholds)];
    return starts.map((start, index) => {
      const next = starts[index + 1];
      const end = next === undefined ? Infinity : next - 1;
      const label = end === Infinity ? `${start}+ days` : end === start ? `${start} ${start === 1 ? 'day' : 'days'}` : `${start}–${end} days`;
      return { start, end, label };
    });
  }
  function validateGroups(groups, thresholds) {
    if (!Array.isArray(groups)) throw new Error('Custom groups must be a list.');
    const starts = baseBands(thresholds).map(band => band.start);
    const claimed = new Set();
    return groups.map(group => {
      const name = String(group.name || '').trim();
      const color = String(group.color || '');
      const selection = group.starts;
      if (!name || name.length > 60) throw new Error('Enter a group name of up to 60 characters.');
      if (!/^#[0-9a-f]{6}$/i.test(color)) throw new Error('Choose a valid group color.');
      if (!Array.isArray(selection) || !selection.length) throw new Error('Select at least one bucket for each group.');
      const indexes = selection.map(start => starts.indexOf(Number(start))).sort((a, b) => a - b);
      if (indexes.some(index => index < 0) || new Set(indexes).size !== indexes.length || indexes.some((index, i) => i && index !== indexes[i - 1] + 1))
        throw new Error('A custom group must contain consecutive existing buckets.');
      indexes.forEach(index => {
        if (claimed.has(index)) throw new Error('A bucket can belong to only one custom group.');
        claimed.add(index);
      });
      return { name, color, starts:indexes.map(index => starts[index]) };
    });
  }
  function readConfig(storage) {
    const thresholds = readThresholds(storage);
    try {
      const groups = JSON.parse(storage.getItem(GROUP_KEY) || '[]');
      return { thresholds, groups:validateGroups(groups, thresholds) };
    } catch (_) { return { thresholds, groups:[] }; }
  }
  function saveGroups(storage, groups, thresholds = readThresholds(storage)) {
    const checked = validateGroups(groups, thresholds);
    storage.setItem(GROUP_KEY, JSON.stringify(checked));
    return checked;
  }
  function bands(config) {
    const thresholds = Array.isArray(config) ? config : config.thresholds;
    const ranges = baseBands(thresholds);
    if (Array.isArray(config) || !config.groups?.length) return ranges;
    const groups = validateGroups(config.groups, thresholds);
    const byStart = new Map(groups.flatMap(group => group.starts.map(start => [start, group])));
    return ranges.flatMap(range => {
      const group = byStart.get(range.start);
      if (!group) return [range];
      if (group.starts[0] !== range.start) return [];
      const last = ranges.find(item => item.start === group.starts.at(-1));
      return [{ start:range.start, end:last.end, label:group.name, color:group.color }];
    });
  }
  function mixCategory(invoice, journey) {
    if (!journey.submitted(invoice)) return 'Not submitted';
    const medium = String(invoice.submissionMedium || invoice.method || '').toLowerCase();
    const status = String(invoice.submissionSubStatus || invoice.submissionStatus || '').toLowerCase();
    const activity = String(invoice.activityType || '').toLowerCase();
    if (medium === 'automated') return 'Automated';
    if (medium === 'external' || invoice.submissionStatus === 'External Submission' || status === 'on premises' || activity === 'visited') return 'Physical';
    if (status === 'email sent' || activity === 'emailed') return 'Email';
    if (status === 'docs sent' || activity === 'couriered') return 'Courier';
    return 'Unclassified submitted';
  }
  function ageInDays(invoice, journey, today) {
    const ageThrough = journey.submitted(invoice)
      ? invoice.firstSubmittedAt || invoice.submissionDate || invoice.lastSubmittedAt || invoice.submissionRecordedAt
      : today;
    return ageThrough ? journey.days(invoice.invoiceDate, ageThrough) : null;
  }
  function detailRows(invoices, thresholds, journey, today = journey.today()) {
    const rows = bands(thresholds).map(band => ({ ...band, count:0, customers:0, submitted:0, pending:0, value:0, valuedInvoices:0, share:0 }));
    const customerSets = rows.map(() => new Set());
    invoices.forEach(invoice => {
      const age = ageInDays(invoice, journey, today);
      const index = age === null ? -1 : rows.findIndex(row => age >= row.start && age <= row.end);
      if (index < 0) return;
      const row = rows[index];
      row.count += 1;
      if (journey.submitted(invoice)) row.submitted += 1;
      else row.pending += 1;
      const customer = String(invoice.code || invoice.customerCode || invoice.name || invoice.customerName || '').trim();
      if (customer) customerSets[index].add(customer);
      const value = Number(invoice.value ?? invoice.invoiceValue);
      if (Number.isFinite(value) && value >= 0) { row.value += value; row.valuedInvoices += 1; }
    });
    const represented = rows.reduce((sum, row) => sum + row.count, 0);
    const rawShareUnits = rows.map(row => represented ? row.count / represented * 1000 : 0);
    const shareUnits = rawShareUnits.map(Math.floor);
    let remainingUnits = represented ? 1000 - shareUnits.reduce((sum, units) => sum + units, 0) : 0;
    rawShareUnits.map((units, index) => ({ index, fraction:units - shareUnits[index] }))
      .sort((a, b) => b.fraction - a.fraction)
      .forEach(({ index }) => { if (remainingUnits > 0) { shareUnits[index] += 1; remainingUnits -= 1; } });
    rows.forEach((row, index) => {
      row.customers = customerSets[index].size;
      row.share = shareUnits[index] / 10;
    });
    return rows;
  }
  function summarize(invoices, thresholds, journey, today = journey.today()) {
    const ranges = bands(thresholds).map(band => ({ ...band, count:0 }));
    const mix = Object.fromEntries(MIX_LABELS.map(label => [label, 0]));
    let unavailableAging = 0;
    invoices.forEach(invoice => {
      const age = ageInDays(invoice, journey, today);
      const band = age === null ? null : ranges.find(item => age >= item.start && age <= item.end);
      if (band) band.count += 1;
      else unavailableAging += 1;
      const category = mixCategory(invoice, journey);
      mix[category] = (mix[category] || 0) + 1;
    });
    return { total:invoices.length, ranges, mix, unavailableAging };
  }
  return { KEY, GROUP_KEY, DEFAULT_THRESHOLDS, MIX_LABELS, validateThresholds, validateGroups, readThresholds, saveThresholds, readConfig, saveGroups, bands, mixCategory, ageInDays, detailRows, summarize };
});
