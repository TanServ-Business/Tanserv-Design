/* Start the static preview on port 8765, then run with Playwright installed.
 * Uses isolated contexts; never saves forms or sends external requests.
 * PLAYWRIGHT_MODULE, PLAYWRIGHT_BROWSERS_PATH, FORM_CONTROLS_URL and
 * FORM_CONTROLS_ARTIFACTS can be set by the local test runner.
 */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { webkit, chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const root = path.resolve(__dirname, '..');
const base = process.env.FORM_CONTROLS_URL || 'http://127.0.0.1:8765';
const artifacts = process.env.FORM_CONTROLS_ARTIFACTS;
const singleSelect = 'select:not([multiple]):not(.stuckOwnerCardSelect):not([hidden]):is(:not([size]),[size="0"],[size="1"])';

async function sameHeight(page, label, selectors) {
  const rows = await Promise.all(selectors.map(async selector => {
    const locator = page.locator(selector).first();
    assert.equal(await locator.count(), 1, `${label}: missing ${selector}`);
    return { selector, height: await locator.evaluate(el => el.getBoundingClientRect().height) };
  }));
  assert.ok(rows[0].height > 0, `${label}: controls must be rendered`);
  assert.ok(rows.every(row => Math.abs(row.height - rows[0].height) <= 0.5), `${label}: ${JSON.stringify(rows)}`);
  return rows[0].height;
}

async function fixture(page, html) {
  await page.evaluate(html => {
    document.getElementById('controlHeightFixture')?.remove();
    const el = document.createElement('div');
    el.id = 'controlHeightFixture';
    el.style.cssText = 'position:fixed;left:10px;top:100px;z-index:999999;background:white;padding:16px;max-width:700px;';
    el.innerHTML = html;
    document.body.append(el);
  }, html);
}

async function testBrowser(name, engine) {
  const browser = await engine.launch({ headless: true });
  let checks = 0;
  try {
    const context = await browser.newContext({ viewport: { width: 1440, height: 1000 } });
    const page = await context.newPage();
    page.setDefaultTimeout(10000);
    await page.route('**/*', route => {
      const url = new URL(route.request().url());
      if (url.origin === new URL(base).origin) return route.continue();
      const asset = url.pathname.endsWith('/bootstrap.min.css') ? 'bootstrap.min.css'
        : url.pathname.endsWith('/bootstrap.bundle.min.js') ? 'bootstrap.bundle.min.js' : null;
      if (asset) return route.fulfill({
        path: path.join(root, 'assets/admin-reference', asset),
        contentType: asset.endsWith('.css') ? 'text/css' : 'application/javascript'
      });
      return route.abort();
    });
    const visit = async route => {
      const response = await page.goto(`${base}/${route}`, { waitUntil: 'load' });
      assert.ok(response?.ok(), `${route}: preview page must load successfully`);
      await page.waitForFunction(() => Array.from(document.styleSheets).some(sheet => {
        try { return Array.from(sheet.cssRules || []).some(rule => rule.href?.includes('form-controls.css')); }
        catch (_) { return false; } // Cross-origin Bootstrap is deliberately opaque.
      }));
    };
    const pair = async (label, selectors) => { checks++; return sameHeight(page, `${name}: ${label}`, selectors); };

    // Actual strategy dialog from the user's screenshot, including dynamic fields.
    await visit('pages/admin.html?module=module-configuration&view=dunning-letters');
    await page.waitForSelector('[data-dm-section="scheduling"]');
    await page.evaluate(() => IneburaDunning.setEnabled(true, IneburaDunning.getContext()));
    await page.locator('[data-dm-section="scheduling"]').click();
    await page.locator('[data-dm-action="add-strategy"]').click();
    const strategyHeight = await pair('Dunning strategy', ['.dmModal [name="name"]', ...['status','subClient','targetType','targetMode','senderType','template-0','days-0'].map(n => `.dmModal [name="${n}"]`)]);
    assert.equal(strategyHeight, 35);
    const status = page.locator('.dmModal [name="status"]');
    await status.selectOption('paused');
    assert.equal(await status.inputValue(), 'paused');
    await status.focus();
    await page.keyboard.press('Home');
    await page.keyboard.press('ArrowDown');
    assert.equal(await status.evaluate(el => el === document.activeElement), true, 'Native select retains keyboard focus');
    await page.locator('.dmModal [name="targetMode"]').selectOption('selected');
    assert.ok(await page.locator('.dmModal select[multiple]').first().evaluate(el => el.getBoundingClientRect().height) >= 110);
    await page.locator('.dmStage details').first().evaluate(el => { el.open = true; });
    assert.ok(await page.locator('.dmModal [name="statuses-0"]').evaluate(el => el.getBoundingClientRect().height) >= 110);
    assert.equal(await page.locator('.dmModal [name="statuses-0"]').evaluate(el => getComputedStyle(el).backgroundImage), 'none');
    if (artifacts) {
      fs.mkdirSync(artifacts, { recursive: true });
      await page.locator('.dmStage details').first().evaluate(el => { el.open = false; });
      await page.locator('.dmModal [name="targetMode"]').selectOption('all');
      await page.locator('.dmModal').screenshot({ path: path.join(artifacts, `${name}-dunning-strategy.png`) });
    }
    await page.locator('.dmModal [data-dm-action="close-modal"]').first().click();
    await page.locator('[data-dm-section="activity"]').click();
    await pair('Dunning cycle fields', ['.dmRun input[type="date"]', '.dmRun select']);

    // Fixed-density Admin form controls, searchable picker, tag picker and MIS.
    await fixture(page, `<div class="adminRuntimeField"><input id="runtimeText" type="text" value="Example"><select id="runtimeSelect"><option>Example</option></select><div class="adminSearchSelectControl" id="runtimeSearch"><input type="text" value="Example"><button type="button">⌄</button></div><div class="adminTagSelectControl" id="runtimeTags"><input class="adminTagSearch" type="text" placeholder="Select"><button type="button">⌄</button></div></div>`);
    await pair('Admin runtime and custom pickers', ['#runtimeText','#runtimeSelect','#runtimeSearch','#runtimeTags']);
    await fixture(page, `<div class="adminConfigurationField"><input id="configText" type="text"><div class="adminConfigurationSelect"><button id="configSelect" type="button">Example</button></div></div>`);
    await pair('Configuration custom dropdown', ['#configText','#configSelect']);
    await fixture(page, `<div class="opFormGrid"><label><input id="misText" type="text"></label><label><details class="misMultiSelect" id="misSelect"><summary>Example<i>⌄</i></summary><div class="misMultiMenu">Options</div></details></label></div>`);
    await pair('MIS closed multi-picker', ['#misText','#misSelect']);
    await page.locator('#misSelect summary').click();
    assert.equal(await page.locator('#misSelect').getAttribute('open'), '');
    await fixture(page, `<label class="adminTableSearch" id="adminSearch"><input type="search"></label><details class="adminFilterDropdown"><summary id="adminFilter">Status</summary><div>Options</div></details>`);
    await pair('Admin table toolbar', ['#adminSearch','#adminFilter']);
    await fixture(page, `<div class="adminSpecialField"><input id="specialText" type="text"><select id="specialSelect"><option>Example</option></select></div><select id="multiExemption" multiple size="4"><option>One</option><option>Two</option></select><select id="listExemption" size="4"><option>One</option><option>Two</option></select><select id="sizeOne" size="1"><option>One</option></select>`);
    await pair('Specialized Admin', ['#specialText','#specialSelect']);
    assert.equal(await page.locator('#sizeOne').evaluate(el => getComputedStyle(el).appearance), 'none');
    for (const id of ['multiExemption','listExemption']) {
      assert.equal(await page.locator(`#${id}`).evaluate(el => getComputedStyle(el).backgroundImage), 'none');
      assert.ok(await page.locator(`#${id}`).evaluate(el => el.getBoundingClientRect().height) > 40);
    }
    await page.locator('#specialSelect').evaluate(el => { el.disabled = true; });
    await pair('Disabled select', ['#specialText','#specialSelect']);
    assert.equal(await page.locator('#specialSelect').isDisabled(), true);
    assert.match(await page.locator('#specialSelect').evaluate(el => getComputedStyle(el).backgroundImage), /svg/);
    await page.locator('#specialSelect').evaluate(el => { el.dir = 'rtl'; });
    assert.match(await page.locator('#specialSelect').evaluate(el => getComputedStyle(el).backgroundPosition), /^10px/);
    if (name === 'chromium') {
      await page.emulateMedia({ forcedColors: 'active' });
      assert.equal(await page.locator('#specialSelect').evaluate(el => getComputedStyle(el).appearance), 'auto');
      await page.emulateMedia({ forcedColors: 'none' });
    }

    await visit('pages/issuetrackerLP.html');
    await fixture(page, `<label class="searchField" id="issueSearch"><input type="search"></label><details class="filterPanelDropdown"><summary id="issueFilter">Status</summary><div>Options</div></details><div class="inlineField"><input id="issueText" type="text"><select id="issueSelect"><option>Example</option></select></div>`);
    await pair('Issue Tracker toolbar', ['#issueSearch','#issueFilter']);
    await pair('Issue Tracker fields', ['#issueText','#issueSelect']);

    await visit('pages/submission.html');
    await fixture(page, `<div class="sjFilters"><label><input id="submissionText" type="text"></label><label><select id="submissionSelect"><option>Example</option></select></label></div>`);
    await pair('Submission filters', ['#submissionText','#submissionSelect']);
    await fixture(page, `<div class="sjDialog"><div class="sjFormGrid"><label><input id="submissionFormText" type="text"></label><label><select id="submissionFormSelect"><option>Example</option></select></label><label><input id="submissionFormDate" type="date"></label></div></div>`);
    await pair('Submission forms', ['#submissionFormText','#submissionFormSelect','#submissionFormDate']);

    await visit('pages/strategy-master.html');
    for (const cls of ['smField','smTemplateField','smReminderRow']) {
      await fixture(page, `<div class="${cls}"><input id="strategyText" type="text"><select id="strategySelect"><option>Example</option></select></div>`);
      assert.equal(await pair(`Strategy ${cls}`, ['#strategyText','#strategySelect']), 42);
    }

    for (const route of ['index.html','pages/PDCagent.html']) {
      await visit(route);
      await fixture(page, `<div class="disposition"><input id="collectionText" type="text"><input id="collectionNumber" type="number"><input id="collectionDate" type="date"><input id="collectionTime" type="time"><select id="collectionSelect"><option>Example</option></select><input id="collectionCheck" type="checkbox"></div>`);
      assert.equal(await pair(`${route}: activity/collection fields`, ['#collectionText','#collectionNumber','#collectionDate','#collectionTime','#collectionSelect']), 40);
      assert.ok(await page.locator('#collectionCheck').evaluate(el => el.getBoundingClientRect().height) < 25);
    }

    await visit('pages/visitmodule.html');
    await fixture(page, `<div class="planFieldRow"><input id="visitText" type="text"><select id="visitSelect"><option>Example</option></select></div>`);
    await pair('Visit planning fields', ['#visitText','#visitSelect']);

    await visit('pages/Dashboard_Agent.html');
    await fixture(page, `<div class="stuckOwnerSelectWrap"><select id="compactOwner" class="stuckOwnerCardSelect"><option>Agent</option></select></div>`);
    assert.equal(await page.locator('#compactOwner').evaluate(el => getComputedStyle(el).backgroundImage), 'none');
    assert.ok(await page.locator('#compactOwner').evaluate(el => el.getBoundingClientRect().height) <= 22);
    await fixture(page, `<div class="activityTableFilters"><div class="filterRow"><label class="tableFilterSearch" id="compactSearch"><input type="search"></label><details class="filterDropdown"><summary id="compactFilter">Status <span class="filterBadge">All</span></summary><div>Options</div></details></div></div>`);
    await pair('Dashboard compact toolbar', ['#compactSearch','#compactFilter']);

    await visit('pages/LPbackend.html');
    await fixture(page, `<div class="filterRow"><label class="tableFilterSearch" id="backendSearch"><input type="search"></label><details class="filterDropdown"><summary id="backendFilter">Status <span class="filterBadge">All</span></summary></details></div>`);
    await pair('Backend compact toolbar', ['#backendSearch','#backendFilter']);

    await visit('pages/support-admin.html');
    await fixture(page, `<div class="supportAdminPage"><label class="saSearch" id="supportSearch"><input type="search"></label><details class="filterDropdown"><summary id="supportFilter">Status <span class="filterBadge">All</span></summary></details></div>`);
    await pair('Support compact toolbar', ['#supportSearch','#supportFilter']);

    // Every app page containing a native select receives the common reset.
    const pages = fs.readdirSync(path.join(root, 'pages')).filter(file => file.endsWith('.html') && /<select\b/.test(fs.readFileSync(path.join(root, 'pages', file), 'utf8')));
    for (const file of pages) {
      const html = fs.readFileSync(path.join(root, 'pages', file), 'utf8');
      assert.match(html, /(?:styles|shared-header)\.css/, `${file} must load shared form normalization`);
    }
    for (const route of ['index.html','pages/visitmodule.html','pages/reports.html','pages/credit-limit-detail.html','pages/ui-elements.html','pages/commitment.html','pages/CommitmentManager.html','pages/support-admin.html']) {
      await visit(route);
      const failures = await page.locator(singleSelect).evaluateAll(elements => elements.filter(el => getComputedStyle(el).display !== 'none' && getComputedStyle(el).appearance !== 'none').map(el => el.id || el.name || el.className));
      assert.deepEqual(failures, [], `${name}: shared dropdown reset on ${route}`);
      checks++;
    }
    console.log(`${name}: ${checks} geometry/coverage checks passed; native selection, custom opening, listbox and compact exemptions passed.`);
  } finally { await browser.close(); }
}

(async () => {
  for (const [name, engine] of [['webkit', webkit], ['chromium', chromium]]) await testBrowser(name, engine);
})().catch(error => { console.error(error); process.exitCode = 1; });
