/* Contracts for screenshot-matched Dashboard, Strategy Manager and Help & Support parity. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const composed = fs.readFileSync(path.join(__dirname, "admin-composed-pages.js"), "utf8");
const strategy = fs.readFileSync(path.join(__dirname, "admin-strategy-parity.js"), "utf8");
const dashboardCss = fs.readFileSync(path.join(__dirname, "..", "css", "admin-dashboard.css"), "utf8");
const strategyCss = fs.readFileSync(path.join(__dirname, "..", "css", "strategy-master.css"), "utf8");
const helpCss = fs.readFileSync(path.join(__dirname, "..", "css", "help-support.css"), "utf8");

test("dashboard parity uses one internally consistent four-session sample state", () => {
  assert.match(composed, /4 Total Users/);
  assert.match(composed, /Across all users today/);
  assert.match(composed, /Rajneesh Agent/);
  assert.match(composed, /dashboardSessions\.map\(user => user\.name\)/);
  assert.match(composed, /\[18, 38, 22, 5\]/);
  assert.match(composed, /Array\.from\(\{ length: 24 \}/);
  assert.match(composed, /healthChart\.data\.datasets\[0\]\.data = \[0, 4\]/);
  assert.match(composed, /value\.dataset\.counted = "true"/);
  assert.match(composed, /trendChart\.data\.datasets = trendChart\.data\.datasets\.slice\(0, 2\)/);
  assert.match(composed, /dataset\.fill = false/);
  assert.match(composed, /No activity data available/);
  assert.match(dashboardCss, /\.adminRolePill/);
  assert.match(dashboardCss, /\.adminSortMark/);
});

test("strategy list mirrors running and paused labels, target filters, counts and pagination", () => {
  assert.match(strategy, /options\[1\]\.textContent = "Running"/);
  assert.match(strategy, /options\[2\]\.textContent = "Paused"/);
  assert.match(strategy, /Filter by target/);
  assert.match(strategy, /\$\{rows\.length\} strategies/);
  assert.match(strategy, /Showing \$\{rows\.length/);
  assert.match(strategyCss, /\.adminStrategyPager/);
  assert.match(strategyCss, /\.smTable th:first-child/);
});

test("strategy builder exposes required and selectable reference states", () => {
  assert.match(strategy, /markRequired\(mount, "Reminder Type"\)/);
  assert.match(strategy, /markRequired\(card, "Notification Mode"\)/);
  assert.match(strategy, /placeholder\.textContent = "Select"/);
  assert.match(strategy, /data-parity-aging-all/);
  assert.match(strategy, /data-parity-aging-clear/);
  assert.match(strategy, /Choose a notification mode for every selected template/);
  assert.match(strategy, /Remove template/);
  assert.match(strategy, /Select a template above to continue/);
  assert.match(strategyCss, /\.smChecklistCard\.is-compact[\s\S]*grid-template-columns: repeat\(4, minmax\(72px, 1fr\)\)/);
  assert.match(strategyCss, /\.adminStrategyTemplatePrompt/);
});

test("email sender selection is a local card flow with visible dirty and saved states", () => {
  assert.match(strategy, /Where should reminders be sent from\?/);
  assert.match(strategy, /System email account/);
  assert.match(strategy, /My email sender account/);
  assert.match(strategy, /Save changes/);
  assert.match(strategy, /Sender selection saved for this preview/);
  assert.match(strategyCss, /\.adminSenderChoice\.is-selected/);
  assert.match(strategyCss, /\.adminSenderFooter/);
});

test("help parity restores reference guides and aligns the audited modal state", () => {
  assert.match(composed, /Reference Guides &amp; Tutorials/);
  for (const article of ["kb-001", "kb-014", "kb-050", "kb-047"]) {
    assert.match(composed, new RegExp(`openArticle\\('${article}'\\)`));
  }
  assert.match(composed, /attachment\.hidden = true/);
  assert.match(composed, /of 5 stars/);
  assert.match(helpCss, /\.kbCategoryGrid[\s\S]*repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(helpCss, /#kbArticleModal \.modalHeader/);
  assert.match(helpCss, /backdrop-filter: blur\(5px\)/);
});

test("composed parity does not call the network or browser persistent storage", () => {
  for (const source of [composed, strategy]) {
    assert.doesNotMatch(source, /\bfetch\s*\(/);
    assert.doesNotMatch(source, /XMLHttpRequest|indexedDB/);
    assert.doesNotMatch(source, /window\.(?:localStorage|sessionStorage)/);
  }
});
