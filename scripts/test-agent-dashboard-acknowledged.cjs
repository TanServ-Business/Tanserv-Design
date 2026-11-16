'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const journey = require('./submission-journey-core.js');
const insights = require('./submission-insights-core.js');

// Exercise the dashboard's real event handlers without changing browser data.
class Element {
  constructor(tag = 'div') { this.tagName = tag; this.children = []; this.events = {}; this.style = { setProperty(key, value) { this[key] = value; } }; this.dataset = {}; this.value = ''; this.attributes = {}; this.ownText = ''; }
  set textContent(value) { this.ownText = String(value); this.children = []; }
  get textContent() { return this.ownText + this.children.map(child => child.textContent).join(''); }
  append(...children) { this.children.push(...children); }
  replaceChildren(...children) { this.ownText = ''; this.children = children; }
  setAttribute(key, value) { this.attributes[key] = value; }
  addEventListener(type, listener) { (this.events[type] ||= []).push(listener); }
  dispatch(type, extra = {}) { const event = { preventDefault() { this.prevented = true; }, ...extra }; (this.events[type] || []).forEach(listener => listener(event)); return event; }
  focus() { this.focused = true; }
  getContext() { return {}; }
}
class Storage {
  constructor() { this.values = new Map(); }
  getItem(key) { return this.values.get(key) ?? null; }
  setItem(key, value) { this.values.set(key, value); }
  removeItem(key) { this.values.delete(key); }
}
function setup(modify = () => {}, { aging = false } = {}) {
  const storage = new Storage();
  const state = journey.seed();
  state.invoices = state.invoices.filter(invoice => ['TN200009', 'TN200011', 'TN200012', 'TVS545661'].includes(invoice.invoiceNo));
  state.demoAcknowledgementsAdded = true;
  state.demoStrategyDocumentsAdded = true;
  modify(state);
  storage.setItem(journey.KEY, JSON.stringify(state));
  const ids = ['submissionInsightsScope', 'submissionMixRows', 'submissionAcknowledgedCount', 'submissionAcknowledgedPending',
    'submissionAgingTotal', 'submissionMixTotal', 'submissionAgingPending', 'submissionAgingLargest', 'submissionAgingUnavailable',
    'submissionMixSubmitted', 'submissionMixPending', 'submissionMixPhysical', 'submissionAcknowledgedModal', 'submissionAcknowledgedSearch',
    'submissionAcknowledgedTableBody', 'submissionAcknowledgedSummary', 'submissionAcknowledgedModalMeta', 'submissionAcknowledgedSubtotal',
    'submissionAcknowledgedModeFilter', 'submissionAcknowledgedModeValue', 'submissionAcknowledgedMode-all',
    'submissionAcknowledgedMode-Automated', 'submissionAcknowledgedMode-Manual'];
  if (aging) ids.push('submissionAgingDetailModal', 'submissionAgingDetailSearch', 'submissionAgingDetailTableBody',
    'submissionAgingDetailSummary', 'submissionAgingDetailLegend', 'submissionAgingDetailCanvas', 'submissionAgingDetailMeta');
  const elements = Object.fromEntries(ids.map(id => [id, new Element()]));
  const card = new Element('article'), agingCard = new Element('article'), name = new Element('h1');
  name.textContent = 'Devashish Agent1';
  const window = { SubmissionJourney:journey, SubmissionInsights:insights, events:{}, addEventListener(type, callback) { this.events[type] = callback; } };
  const shown = [];
  const charts = [];
  class Chart {
    constructor(context, config) { this.data = config.data; charts.push(this); }
    update() {}
    destroy() {}
  }
  window.Chart = Chart;
  const bootstrap = { Modal:{ getOrCreateInstance:modal => ({ show:() => shown.push(modal) }) } };
  window.bootstrap = bootstrap;
  const document = {
    getElementById:id => elements[id] || null,
    querySelector:selector => selector === '.heroTitleRow h1' ? name : selector === '.submissionAcknowledgedCard' ? card : selector === '.submissionAgingCard' && aging ? agingCard : null,
    createElement:tag => new Element(tag),
    createTextNode:text => { const node = new Element('#text'); node.textContent = text; return node; }
  };
  vm.runInNewContext(fs.readFileSync(path.join(__dirname, 'agent-dashboard-submission.js'), 'utf8'), {
    window, document, localStorage:storage, bootstrap, Intl, Date, URLSearchParams, Chart
  });
  const rows = () => elements.submissionAcknowledgedTableBody.children;
  return { storage, elements, card, agingCard, charts, shown, rows, window };
}

test('click opens only the counted acknowledged invoices with the nine requested columns', () => {
  const ui = setup();
  const before = ui.storage.getItem(journey.KEY);
  ui.card.dispatch('click');
  assert.equal(ui.shown[0], ui.elements.submissionAcknowledgedModal);
  assert.equal(ui.elements.submissionAcknowledgedCount.textContent, '2');
  assert.equal(ui.rows().length, 2);
  assert.equal(ui.elements.submissionAcknowledgedSubtotal.textContent, '₹2,78,041');
  const text = ui.elements.submissionAcknowledgedTableBody.textContent;
  assert.match(text, /TN200011/); assert.match(text, /TN200012/);
  assert.doesNotMatch(text, /TN200009|TVS545661/);
  assert.match(text, /ALLIANCE MEDICAL SYSTEMS/); assert.match(text, /94060526/);
  assert.match(text, /Automated/); assert.match(text, /29 Sept 2026/);
  assert.doesNotMatch(text, /Email Sent|Attached document|Customer's Acknowledgement|Proof:|Recorded by:/);
  assert.equal(ui.rows()[0].children.length, 9);
  assert.deepEqual(ui.rows()[0].children.slice(6).map(cell => cell.textContent), ['Automated', '01 Oct 2026', 'Online']);
  assert.deepEqual(ui.rows()[1].children.slice(6).map(cell => cell.textContent), ['Automated', '30 Sept 2026', 'Manual']);
  assert.match(ui.rows()[0].children[2].children[0].href, /^submission\.html\?invoice=TN200012$/);
  assert.equal(ui.storage.getItem(journey.KEY), before, 'opening the popup must not change invoices');
});

test('search covers visible invoice, customer and mode values and has a clear no-results state', () => {
  const ui = setup(); ui.card.dispatch('click');
  const search = ui.elements.submissionAcknowledgedSearch;
  search.value = 'manual'; search.dispatch('input');
  assert.equal(ui.rows().length, 1); assert.match(ui.rows()[0].textContent, /TN200011/);
  assert.match(ui.elements.submissionAcknowledgedSummary.textContent, /1 invoice of 2/);
  assert.equal(ui.elements.submissionAcknowledgedSubtotal.textContent, '₹1,45,100');
  search.value = 'ALLIANCE'; search.dispatch('input'); assert.equal(ui.rows().length, 2);
  search.value = 'does not exist'; search.dispatch('input');
  assert.match(ui.rows()[0].textContent, /No acknowledged invoices match/);
  assert.equal(ui.elements.submissionAcknowledgedSubtotal.textContent, '₹0');
  assert.equal(ui.rows()[0].children[0].colSpan, 9);
  ui.card.dispatch('click'); assert.equal(search.value, ''); assert.equal(ui.rows().length, 2);
  assert.equal(ui.elements.submissionAcknowledgedSubtotal.textContent, '₹2,78,041');
});

test('keyboard access opens the popup and closing returns focus to the card', () => {
  const ui = setup();
  for (const key of ['Enter', ' ']) assert.equal(ui.card.dispatch('keydown', { key }).prevented, true);
  assert.equal(ui.shown.length, 2);
  ui.elements.submissionAcknowledgedModal.dispatch('hidden.bs.modal'); assert.equal(ui.card.focused, true);
});

test('popup keeps the agent scope and excludes acknowledgement from an earlier submission', () => {
  const ui = setup(state => {
    state.invoices.forEach(invoice => { invoice.agent = invoice.invoiceNo === 'TN200011' ? 'Devashish Agent1' : 'Another agent'; });
  });
  ui.card.dispatch('click'); assert.equal(ui.rows().length, 1);
  assert.equal(ui.elements.submissionAcknowledgedCount.textContent, '1');
  assert.match(ui.rows()[0].textContent, /TN200011/); assert.doesNotMatch(ui.rows()[0].textContent, /TN200012/);
  assert.match(ui.elements.submissionAcknowledgedModalMeta.textContent, /assigned to Devashish Agent1/);
  assert.equal(ui.elements.submissionAcknowledgedSubtotal.textContent, '₹1,45,100');
  const state = JSON.parse(ui.storage.getItem(journey.KEY));
  state.invoices.find(invoice => invoice.invoiceNo === 'TN200011').lastSubmittedAt = '2026-10-02T07:00:00Z';
  ui.storage.setItem(journey.KEY, JSON.stringify(state)); ui.card.dispatch('click');
  assert.equal(ui.elements.submissionAcknowledgedCount.textContent, '0');
  assert.match(ui.rows()[0].textContent, /No acknowledged invoices in this portfolio/);
});

test('unreadable storage shows a load error instead of stale acknowledged invoices', () => {
  const ui = setup(); ui.card.dispatch('click');
  ui.storage.setItem(journey.KEY, '{invalid'); ui.card.dispatch('click');
  assert.equal(ui.elements.submissionAcknowledgedCount.textContent, '—');
  assert.equal(ui.elements.submissionAcknowledgedSubtotal.textContent, '—');
  assert.match(ui.rows()[0].textContent, /could not be loaded/);
  assert.doesNotMatch(ui.rows()[0].textContent, /TN200011/);
});

test('customer content is rendered as text and links encode the invoice number', () => {
  const ui = setup(state => {
    const invoice = state.invoices.find(invoice => invoice.invoiceNo === 'TN200011');
    invoice.invoiceNo = 'INV & 123'; invoice.name = '<img src=x onerror=alert(1)>';
    state.documents.forEach(document => { if (document.invoiceNo === 'TN200011') document.invoiceNo = invoice.invoiceNo; });
  });
  ui.card.dispatch('click');
  const row = ui.rows().find(row => row.children[1].textContent.startsWith('<img'));
  assert.equal(row.children[1].children.length, 0);
  assert.equal(row.children[1].textContent, '<img src=x onerror=alert(1)>');
  assert.equal(row.children[2].children[0].href, 'submission.html?invoice=INV+%26+123');
});

test('manual and external submissions use Manual mode and an Agent acknowledgement uses its received date', () => {
  const ui = setup(state => {
    const manual = state.invoices.find(invoice => invoice.invoiceNo === 'TN200011');
    manual.submissionMedium = 'Manual'; manual.method = 'Manual';
    manual.acknowledgement = { proof:'Agent reference', on:'2026-10-03', at:'2026-10-04T08:00:00Z', by:'Agent' };
    const external = state.invoices.find(invoice => invoice.invoiceNo === 'TN200012');
    external.submissionMedium = 'External'; external.method = 'External';
  });
  ui.card.dispatch('click');
  const manual = ui.rows().find(row => row.children[2].textContent === 'TN200011');
  assert.deepEqual(manual.children.slice(6).map(cell => cell.textContent), ['Manual', '03 Oct 2026', 'Manual']);
  const external = ui.rows().find(row => row.children[2].textContent === 'TN200012');
  assert.equal(external.children[6].textContent, 'Manual');
  assert.equal(external.children[8].textContent, 'Online');
});

test('submission mode filter updates rows, count and subtotal without changing the card or data', () => {
  const ui = setup(state => {
    state.invoices.find(invoice => invoice.invoiceNo === 'TN200011').submissionMedium = 'Manual';
  });
  const before = ui.storage.getItem(journey.KEY);
  ui.card.dispatch('click');
  ui.elements.submissionAcknowledgedModeFilter.open = true;
  ui.elements['submissionAcknowledgedMode-Manual'].dispatch('click');
  assert.equal(ui.elements.submissionAcknowledgedModeFilter.open, false);
  assert.equal(ui.elements.submissionAcknowledgedModeValue.textContent, 'Manual');
  assert.equal(ui.rows().length, 1);
  assert.match(ui.rows()[0].textContent, /TN200011/);
  assert.equal(ui.elements.submissionAcknowledgedSummary.textContent, '1 invoice of 2');
  assert.equal(ui.elements.submissionAcknowledgedSubtotal.textContent, '₹1,45,100');
  assert.equal(ui.elements.submissionAcknowledgedCount.textContent, '2');
  ui.elements['submissionAcknowledgedMode-Automated'].dispatch('click');
  assert.match(ui.rows()[0].textContent, /TN200012/);
  assert.equal(ui.elements.submissionAcknowledgedSubtotal.textContent, '₹1,32,941');
  assert.equal(ui.storage.getItem(journey.KEY), before);
});

test('mode filter combines with search and resets to All when reopening', () => {
  const ui = setup(state => {
    state.invoices.find(invoice => invoice.invoiceNo === 'TN200011').submissionMedium = 'Manual';
  });
  ui.card.dispatch('click');
  ui.elements['submissionAcknowledgedMode-Manual'].dispatch('click');
  ui.elements.submissionAcknowledgedSearch.value = 'TN200012';
  ui.elements.submissionAcknowledgedSearch.dispatch('input');
  assert.match(ui.rows()[0].textContent, /No acknowledged invoices match/);
  assert.equal(ui.elements.submissionAcknowledgedSubtotal.textContent, '₹0');
  ui.elements['submissionAcknowledgedMode-all'].dispatch('click');
  assert.match(ui.rows()[0].textContent, /TN200012/);
  ui.elements['submissionAcknowledgedMode-Manual'].dispatch('click');
  ui.card.dispatch('click');
  assert.equal(ui.elements.submissionAcknowledgedModeValue.textContent, 'All');
  assert.equal(ui.elements.submissionAcknowledgedSearch.value, '');
  assert.equal(ui.rows().length, 2);
  assert.equal(ui.elements.submissionAcknowledgedSubtotal.textContent, '₹2,78,041');
});

test('externally recorded submission is included in Manual mode rather than Automated', () => {
  const ui = setup(state => {
    const invoice = state.invoices.find(invoice => invoice.invoiceNo === 'TN200011');
    invoice.submissionMedium = 'External';
  });
  ui.card.dispatch('click');
  ui.elements['submissionAcknowledgedMode-Manual'].dispatch('click');
  assert.match(ui.rows()[0].textContent, /TN200011/);
  ui.elements['submissionAcknowledgedMode-Automated'].dispatch('click');
  assert.doesNotMatch(ui.rows()[0].textContent, /TN200011/);
});

function agingSetup(modify = () => {}) {
  return setup(state => {
    state.invoices.forEach(invoice => {
      const alpha = ['TN200011','TN200012'].includes(invoice.invoiceNo);
      invoice.code = alpha ? 'C-001' : 'C-002';
      invoice.name = alpha ? 'Alpha Hospital' : 'Beta Clinic';
      invoice.value = alpha ? (invoice.invoiceNo === 'TN200011' ? 100 : 200) : 1000;
      invoice.invoiceDate = '2026-01-01';
      invoice.submissionStatus = alpha ? 'Submitted' : 'Not Submitted';
      if (alpha) invoice.firstSubmittedAt = '2026-01-02T09:00:00Z';
    });
    modify(state);
  }, { aging:true });
}

test('aging search recalculates buckets and chart for customer names and codes', () => {
  const ui = agingSetup();
  const before = ui.storage.getItem(journey.KEY);
  ui.agingCard.dispatch('click');
  const search = ui.elements.submissionAgingDetailSearch;
  search.value = '  ALPHA hospital  '; search.dispatch('input');
  const rows = ui.elements.submissionAgingDetailTableBody.children;
  const occupied = rows.find(row => row.children[1].textContent === '2');
  assert.equal(occupied.children[0].textContent, '1–2 days');
  assert.deepEqual(occupied.children.slice(1,6).map(cell => cell.textContent), ['2','1','2','0','₹300']);
  assert.equal(ui.charts[0].data.datasets[0].data.reduce((sum, value) => sum + value, 0), 2);
  assert.match(ui.elements.submissionAgingDetailSummary.textContent, /2 invoices matching customers/);
  search.value = ' c-002 '; search.dispatch('input');
  assert.match(ui.elements.submissionAgingDetailTableBody.textContent, /₹2,000/);
  assert.equal(ui.charts[0].data.datasets[0].data.reduce((sum, value) => sum + value, 0), 2);
  assert.equal(ui.storage.getItem(journey.KEY), before);
});

test('aging customer search has zero results for unmatched customers or range names and clears to full totals', () => {
  const ui = agingSetup(); ui.agingCard.dispatch('click');
  const search = ui.elements.submissionAgingDetailSearch;
  search.value = 'days'; search.dispatch('input');
  assert.match(ui.elements.submissionAgingDetailSummary.textContent, /0 invoices matching customers/);
  assert.equal(ui.charts[0].data.datasets[0].data.reduce((sum, value) => sum + value, 0), 0);
  search.value = ''; search.dispatch('input');
  assert.match(ui.elements.submissionAgingDetailSummary.textContent, /4 invoices/);
  assert.equal(ui.charts[0].data.datasets[0].data.reduce((sum, value) => sum + value, 0), 4);
  search.value = 'Alpha'; search.dispatch('input');
  ui.agingCard.dispatch('click');
  assert.equal(search.value, '');
  assert.match(ui.elements.submissionAgingDetailSummary.textContent, /4 invoices/);
});

test('aging customer search preserves agent scope and reports only matching unusable dates', () => {
  const scoped = agingSetup(state => state.invoices.forEach(invoice => {
    invoice.agent = invoice.code === 'C-001' ? 'Another Agent' : 'Devashish Agent1';
  }));
  scoped.agingCard.dispatch('click');
  scoped.elements.submissionAgingDetailSearch.value = 'Alpha';
  scoped.elements.submissionAgingDetailSearch.dispatch('input');
  assert.match(scoped.elements.submissionAgingDetailSummary.textContent, /0 invoices/);
  const invalidDate = agingSetup(state => { state.invoices.find(invoice => invoice.invoiceNo === 'TN200011').invoiceDate = ''; });
  invalidDate.agingCard.dispatch('click');
  invalidDate.elements.submissionAgingDetailSearch.value = 'Alpha';
  invalidDate.elements.submissionAgingDetailSearch.dispatch('input');
  assert.match(invalidDate.elements.submissionAgingDetailSummary.textContent, /1 invoice matching/);
  assert.match(invalidDate.elements.submissionAgingDetailMeta.textContent, /1 invoice without a usable date/);
});
