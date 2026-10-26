/* Run with Node. Exercises actual vendored PDF and DOCX libraries without a browser. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const zlib = require('node:zlib');
global.jspdf = require('./vendor/jspdf.umd.min.js');
global.mammoth = require('./vendor/mammoth.browser.min.js');
require('./dunning-documents.js');
const docs = global.IneburaDunningDocuments;
const core = require('./dunning-core.js').createInstance({ context: { role: 'client-admin' } });
core.setEnabled(true);
const template = {...core.getState().templates[0],sourceType:'upload'};
const snapshot = docs.sampleSnapshot(template, 65);

const dangerous = '<script>alert(1)</script><p onclick="bad()" style="background:url(https://bad.test);text-align:center">Safe &amp; sound <b>bold</b><img src="https://bad.test" onerror="bad()"></p><iframe src="https://bad.test">secret</iframe><svg><script>bad()</script></svg>';
const clean = docs.sanitizeHtml(dangerous);
assert.equal(clean, '<p style="text-align:center">Safe &amp; sound <b>bold</b></p>');
assert.doesNotMatch(clean, /script|onclick|onerror|https:|iframe|svg|bad\(/i);
assert.equal(docs.sanitizeHtml('<p>&lt;img src=x onerror=evil&gt;</p>'), '<p>&lt;img src=x onerror=evil&gt;</p>');
assert.equal(docs.sanitizeHtml('<p>Hello <b>customer</b></p>'), '<p>Hello <b>customer</b></p>');

assert.equal(docs.validateTemplate(template), true);
assert.throws(() => docs.validateTemplate({ ...template, letterHtml: '<p>{{unknown}}</p>' }), /Choose a data field/);
assert.throws(() => docs.validateTemplate({ ...template, calculation: { totalOutstanding: 'eval(window.secret)' } }), /calculation/);
assert.throws(() => docs.validateTemplate({ ...template, letterHtml: '<script>only script</script>', body: '' }), /wording/);
const safeCustomer = { ...snapshot, customer: { name: '<img src=x onerror=alert(1)>' } };
assert.match(docs.renderLetter(safeCustomer), /&lt;img/);
assert.doesNotMatch(docs.renderLetter(safeCustomer), /<img/);
assert.equal(docs.valuesFor(snapshot).totalOutstanding, '32,50,000.00');
assert.equal(docs.valuesFor(snapshot).invoiceCount, '65');
assert.doesNotMatch(docs.renderLetter(snapshot), /\{\{/);

const first = docs.createPdf(snapshot), second = docs.createPdf(JSON.parse(JSON.stringify(snapshot)));
assert.equal(first, second, 'frozen snapshots must generate byte-identical PDFs');
template.letterHtml = '<p>Changed current template</p>';
core.saveTemplate(template);
assert.equal(docs.createPdf(snapshot), first, 'editing the current template cannot alter a sent snapshot');
assert.ok(Buffer.from(first.split(',')[1], 'base64').subarray(0, 5).equals(Buffer.from('%PDF-')));
if (process.env.DUNNING_TEST_PDF) fs.writeFileSync(process.env.DUNNING_TEST_PDF, Buffer.from(first.split(',')[1], 'base64'));

// A later letter must identify its predecessor even when custom wording omits the merge field.
const customLater = { ...docs.sampleSnapshot(template, 1), stageNumber: 4, previousReferences: ['DL-OLDER-001','DL-PREV-002'], previousReference: 'DL-PREV-002', letterHtml: '<p>Custom final reminder without a reference placeholder.</p>' };
const laterBytes = Buffer.from(docs.createPdf(customLater).split(',')[1], 'base64');
const streams = [...laterBytes.toString('latin1').matchAll(/stream\r?\n([\s\S]*?)\r?\nendstream/g)].map(match => {
  try { return zlib.inflateSync(Buffer.from(match[1], 'latin1')).toString('latin1'); }
  catch (_) { return match[1]; }
}).join('\n');
assert.match(streams, /Previous letter: DL-PREV-002/, 'the generated PDF must carry the immediate prior letter reference');

(async () => {
  const bytes = fs.readFileSync(path.join(__dirname, '../assets/dunning/sample-dunning-letter.docx'));
  const file = { name: 'sample-dunning-letter.docx', size: bytes.byteLength, arrayBuffer: async () => bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) };
  const result = await docs.importDocx(file);
  assert.match(result.html, /Payment reminder/);
  assert.match(result.html, /\{\{customerName\}\}/);
  assert.match(result.html, /<strong>\{\{totalOutstanding\}\}<\/strong>/);
  assert.doesNotMatch(result.html, /<script|<img|onerror/);
  // The shipped standard file must import and validate for a single letter or
  // follow-up stage, and preserve literal customer codes when merged.
  const standardBytes = fs.readFileSync(path.join(__dirname, '../assets/dunning/standard-dunning-letter.docx'));
  const standard = await docs.importDocx({ name: 'standard-dunning-letter.docx', size: standardBytes.byteLength, arrayBuffer: async () => standardBytes.buffer.slice(standardBytes.byteOffset, standardBytes.byteOffset + standardBytes.byteLength) });
  assert.doesNotMatch(standard.html, /<table>|\[Invoice no\.\]|\[Description\]/, 'the visible Word scaffold is replaced by the dynamic annexure marker on import');
  assert.equal((standard.html.match(/\{\{invoiceTable\}\}/g) || []).length, 1);
  const adapter = require('./dunning-template-adapter.js');
  for (const stage of [1, 2, 3, 5]) {
    const check = adapter.validateUpload(standard.html, stage);
    assert.equal(check.valid, true, check.errors.join(' '));
  }
  const standardTemplate = { ...template, sourceType:'standard',standardReady:true,body: standard.html, letterHtml: standard.html, mappings: adapter.defaultMappings, fieldMappings: adapter.defaultMappings };
  assert.equal(docs.validateTemplate(standardTemplate), true);
  core.saveTemplate(standardTemplate);
  const standardSnapshot = { ...docs.sampleSnapshot(standardTemplate, 1), customer: { customerCode: '00042<&>', name: 'Example Customer' } };
  assert.match(docs.renderLetter(standardSnapshot), /00042&lt;&amp;&gt;/);
  assert.doesNotMatch(docs.renderLetter(standardSnapshot), /\{\{|Unmapped/);
  assert.doesNotMatch(docs.renderLetter(standardSnapshot), /Total amount due|Invoice annexure|Invoice Amount|Amount Due/,'invoice details and total belong only to page 2');
  assert.equal(docs.valuesFor({ ...standardSnapshot, customer: {} })['customer.code'], '');
  assert.equal(docs.valuesFor({ ...standardSnapshot, customer: { code: '00007' } })['customer.code'], '00007');
  assert.ok(docs.createPdf(standardSnapshot).startsWith('data:application/pdf;'));
  const actualFetch=global.fetch;
  try {
    let fetches=0;
    global.fetch=async url=>{assert.match(url,/standard-dunning-letter\.docx$/);fetches++;return {ok:true,arrayBuffer:async()=>standardBytes.buffer.slice(standardBytes.byteOffset,standardBytes.byteOffset+standardBytes.byteLength)};};
    const shipped=await docs.loadStandardTemplate();assert.equal(shipped.html,standard.html);assert.equal(shipped.standardReady,true);
    await docs.loadStandardTemplate();assert.equal(fetches,1,'successful standard imports are shared between configured stages');
  }finally{global.fetch=actualFetch;}
  const realMammoth = global.mammoth;
  try {
    const importMarkup = async html => {
      global.mammoth = { ...realMammoth, convertToHtml: async () => ({ value: html, messages: [] }) };
      return (await docs.importDocx(file)).html;
    };
    const regular = '<table><tr><td>Payment information</td></tr></table>';
    assert.equal(await importMarkup(regular), regular, 'ordinary custom tables remain intact');
    for (const extra of ['{{unknownValue}}', '{{customerName}}', '{{unfinished', '${unknown}']) {
      const marked = `<table><tr><td>{{invoiceTable}}</td><td>${extra}</td></tr></table>`;
      assert.equal(await importMarkup(marked), marked, 'extra fields must not be hidden from upload validation');
    }
  } finally { global.mammoth = realMammoth; }
  await assert.rejects(docs.importDocx({ ...file, name: 'letter.exe' }), /\.docx/);
  await assert.rejects(docs.importDocx({ ...file, size: 6 * 1024 * 1024 }), /5 MB/);
  console.log('Passed: safe markup, mapping/calculation validation, escaped customer data, 65-invoice PDF, deterministic snapshots and real DOCX import.');
})().catch(error => { console.error(error); process.exitCode = 1; });
