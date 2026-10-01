/* Structural contracts for the reference-matched specialized Admin renderer. */
const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const source = fs.readFileSync(path.join(__dirname, "admin-specialized.js"), "utf8");

function render(module, view = "") {
  const listeners = {};
  const mount = { innerHTML: "", addEventListener(type, handler) { listeners[`mount:${type}`] = handler; } };
  const modal = { innerHTML: "", addEventListener(type, handler) { listeners[`modal:${type}`] = handler; }, classList: { add() {}, remove() {} }, setAttribute() {} };
  const context = {
    console,
    window: {
      IneburaAdminPage: { module, view, renderer: "specialized" },
      IneburaAdminModules: { [module]: { title: module, description: `${module} description` } },
      IneburaAdminAuditEntities: ["Activity Rollback", "Bank Details", "Customer", "Invoice"],
      IneburaAdminConfigurations: { render: () => '<div data-preserved-configurations>Configuration landing</div>' },
      IneburaAdminMonthend: () => '<div data-monthend>Month-End configuration</div>',
      IneburaAdminPreviewNotice() {},
    },
    document: {
      getElementById(id) { return id === "adminPageContent" ? mount : id === "adminModal" ? modal : null; },
      addEventListener(type, handler) { listeners[`document:${type}`] = handler; },
      querySelector() { return null; },
    },
    FormData: class {},
  };
  vm.runInNewContext(source, context);
  return { html: mount.innerHTML, modal, listeners, contract: context.window.IneburaAdminSpecializedContract };
}

test("configuration landing remains delegated while all seven tabs stay exposed", () => {
  const result = render("module-configuration", "configurations");
  assert.match(result.html, /data-preserved-configurations/);
  assert.match(result.html, /adminConfigurationsPage/);
  assert.match(result.html, /class="is-active">Configurations<\/a>/);
  assert.deepEqual([...result.contract.tabs], ["configurations", "visit", "monthend", "client-confirmation", "pdc", "escalation", "issue-tracker"]);
});

test("visit and PDC reproduce current state, required markers and user-management surfaces", () => {
  const visit = render("module-configuration", "visit").html;
  assert.match(visit, /Current Start Time/);
  assert.match(visit, /Current End Time/);
  assert.match(visit, /Enable Visit Planning Module\? <em>\*<\/em>/);
  assert.match(visit, /Number of RPC Count Per Day/);
  const pdc = render("module-configuration", "pdc").html;
  assert.match(pdc, /Auto-Clear Days \(PDC Banked to PDC Cleared\)/);
  assert.match(pdc, /Add PDC Ops User/);
  assert.match(pdc, /Rajneesh Backenduser/);
});

test("configuration workflow states include upload gating and dependent process fields", () => {
  const confirmation = render("module-configuration", "client-confirmation").html;
  assert.match(confirmation, /Client Confirmation \(Bulk Processing\)/);
  assert.match(confirmation, /Uploaded Date/);
  assert.match(confirmation, /Original/);
  const escalation = render("module-configuration", "escalation").html;
  assert.match(escalation, /Search processes/);
  assert.match(escalation, /Approval Matrixes/);
  const issue = render("module-configuration", "issue-tracker").html;
  assert.match(issue, /Keep Manager in Approval Hierarchy/);
  assert.match(source, /name: "processSubStatus", disabled: !state\.processPrimary/);
  assert.match(source, /disabled data-confirmation-upload/);
});

test("bulk documents include guidance, exact file types, populated upload and Limbo states", () => {
  const upload = render("bulk-document-upload").html;
  assert.match(upload, /Only the documents selected during the document setup/);
  assert.match(upload, /Accepted: \.pdf, \.jpeg, \.jpg, \.png/);
  assert.match(upload, /TN200008_GRN\.png/);
  const limbo = render("bulk-document-upload", "limbo").html;
  assert.match(limbo, /Show Uploads/);
  assert.match(limbo, /Inebura_All_Documents_50MB_PO\.pdf/);
  assert.match(limbo, /data-special-action="edit-limbo:0"/);
});

test("password, client, retention and audit surfaces match their reference contracts", () => {
  const password = render("change-password").html;
  assert.match(password, /Admin Change Password/);
  assert.match(password, /id="adminPasswordFields" class="adminPasswordFields" hidden/);
  const client = render("client-master").html;
  assert.match(client, /292 Days Left/);
  assert.match(client, /Edit client logo/);
  assert.match(client, /No sub clients yet/);
  const retention = render("audit-retention").html;
  assert.match(retention, /Retention Policy/);
  assert.match(retention, /permanently deletes audit rows/);
  assert.match(retention, /Showing 1–10 of 166/);
  const audit = render("audit-trail").html;
  assert.match(audit, /Select an entity type and search/);
  assert.match(audit, /Export CSV/);
  assert.match(audit, /disabled/);
});

test("specialized renderer does not use network or persistent storage", () => {
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /XMLHttpRequest/);
  assert.doesNotMatch(source, /localStorage|sessionStorage|indexedDB/);
});
