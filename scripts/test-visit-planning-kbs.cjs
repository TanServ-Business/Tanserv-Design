const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
function articles(source) {
  const start = source.indexOf('  const issueGuide = ');
  const end = source.indexOf('  function refreshCategoryCounts()', start);
  assert.ok(start >= 0 && end > start);
  return JSON.parse(vm.runInNewContext(source.slice(start, end) + '\nJSON.stringify(kbArticles);'));
}
const source = read('pages/help-support.html');
const all = articles(source);
const visit = all.filter(article => article.cat === 'visit-module');
const byId = id => visit.find(article => article.id === id);
const plain = article => article.body.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');

test('Visit guides have unique identifiers and remain identical in the Admin copy', () => {
  assert.equal(new Set(all.map(article => article.id)).size, all.length);
  assert.equal(visit.length, 12);
  const adminSource = source.replace(/\bwindow\.localStorage\b|(?<![\w.])localStorage\b/g, 'window.IneburaAdminPreviewStorage');
  assert.deepEqual(articles(read('scripts/admin-composed-generated.js')), articles(adminSource));
  assert.ok(!all.some(article => ['kb-099', 'kb-100'].includes(article.id)));
});

test('role labels distinguish planning, suggestions and Manager decisions', () => {
  for (const id of ['kb-031', 'kb-032', 'kb-050', 'kb-051', 'kb-064', 'kb-066', 'kb-156', 'kb-157']) {
    assert.deepEqual(byId(id).roles, ['Agent']);
  }
  assert.deepEqual(byId('kb-065').roles, ['Manager']);
  assert.deepEqual(byId('kb-159').roles, ['Manager', 'Supervisor', 'KAS']);
  assert.deepEqual(byId('kb-158').roles, ['Agent', 'Manager', 'Supervisor', 'KAS']);
});

test('every guide uses the established template without fixed client times or quotas', () => {
  for (const article of visit) {
    for (const heading of ['Purpose', 'Prerequisites', 'Steps', 'Validation', 'Common issues']) {
      assert.ok(article.body.includes(`<h4>${heading}</h4>`), `${article.id}: ${heading}`);
    }
    assert.match(article.body, /class="kbArticleNote" role="note"/);
    assert.doesNotMatch(plain(article), /\b\d{1,2}:\d{2}\s*(?:AM|PM)|\b\d+\s*(?:visits|RPCs|hours)\b|hr@tanserv\.com/i);
  }
});

test('confirmed cut-off, resubmission, exemptions and earlier-day rules are retained', () => {
  assert.match(plain(byId('kb-050')), /morning cut-off and final window-closing limit are separate/);
  assert.match(plain(byId('kb-050')), /Once the submission window closes.*only the next day/);
  assert.match(plain(byId('kb-051')), /one combined reason/i);
  assert.match(plain(byId('kb-064')), /Manager must submit a fresh decision/);
  assert.match(plain(byId('kb-066')), /targets do not apply to Leave or Office Work/);
  assert.match(plain(byId('kb-066')), /Submit.*Manager review/);
  assert.match(plain(byId('kb-157')), /any planned visit.*previous working day.*incomplete/);
  assert.match(plain(byId('kb-157')), /One reason is sufficient/);
});

test('activity and monthly metric definitions preserve the confirmed counting units', () => {
  const summary = plain(byId('kb-158'));
  assert.match(summary, /on-time daily plans divided by total submitted daily plans, multiplied by 100/);
  assert.match(summary, /daily plan counts once/);
  assert.match(summary, /highest number of completed visits during the selected month/);
  assert.match(summary, /Keep Visited and Unplanned separate/);
  assert.match(summary, /Visited.*completed visit/);
  assert.match(summary, /Called.*RPC count/);
});
