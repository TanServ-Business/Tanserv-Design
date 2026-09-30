/* Reference-matched Admin specialty screens. All mutations are document-memory only. */
(() => {
  "use strict";
  const page = window.IneburaAdminPage;
  if (page?.renderer !== "specialized") return;

  const mount = document.getElementById("adminPageContent");
  const modal = document.getElementById("adminModal");
  const definition = window.IneburaAdminModules[page.module];
  const entities = window.IneburaAdminAuditEntities || [];
  const state = {
    configView: page.view || "configurations",
    visitEditable: false,
    pdcEditable: false,
    pdcUsers: [{ name: "Rajneesh Backenduser", login: "rajneesh.backenduser", role: "PDC Ops" }],
    clientConfirmationUploads: [
      { date: "2026-09-04", total: 1, success: 1, reject: 0, status: "COMPLETED" },
      { date: "2026-09-04", total: 1, success: 1, reject: 0, status: "COMPLETED" },
      { date: "2026-09-04", total: 1, success: 0, reject: 1, status: "COMPLETED WITH VALIDATION" },
    ],
    limbo: page.view === "limbo", documentType: "", documentFiles: [], subClients: [], showDeleted: false,
    auditEntity: "", auditSearched: false, processStep: 0, processPrimary: "", matrixLevels: 0,
  };

  const esc = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const iconButton = (label, action, icon = "") => `<button type="button" class="adminSpecialIconButton" data-special-action="${action}" aria-label="${esc(label)}">${icon ? `<i class="bi ${icon}" aria-hidden="true"></i>` : esc(label)}</button>`;
  const button = (label, action = "notice", tone = "secondary", attrs = "") => `<button type="button" class="adminSpecialButton is-${tone}" data-special-action="${action}" ${attrs}>${label}</button>`;
  const submit = (label, tone = "primary", attrs = "") => `<button type="submit" class="adminSpecialButton is-${tone}" ${attrs}>${label}</button>`;
  const field = (label, options = {}) => {
    const required = options.required ? " <em>*</em>" : "";
    const helper = options.helper ? `<small>${esc(options.helper)}</small>` : "";
    const attrs = `${options.required ? "required" : ""} ${options.disabled ? "disabled" : ""} ${options.id ? `id="${options.id}"` : ""} ${options.name ? `name="${options.name}"` : ""}`;
    let control;
    if (options.options) control = `<select ${attrs}>${options.options.map(item => `<option value="${esc(item.value ?? item)}" ${item.selected || options.value === (item.value ?? item) ? "selected" : ""} ${item.disabled ? "disabled" : ""}>${esc(item.label ?? item)}</option>`).join("")}</select>`;
    else control = `<input type="${options.type || "text"}" placeholder="${esc(options.placeholder || "")}" value="${esc(options.value || "")}" ${attrs}>`;
    return `<label class="adminSpecialField"><span>${esc(label)}${required}</span>${control}${helper}</label>`;
  };
  const toggle = (label, description, checked, disabled, name) => `<label class="adminSpecialToggleCard"><span><strong>${esc(label)}</strong><small>${esc(description)}</small></span><input type="checkbox" name="${name}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""}><i aria-hidden="true"></i></label>`;
  const pager = ({ from = 1, to = 1, total = 1, pages = 1 } = {}) => `<footer class="adminSpecialPager"><strong>Showing ${from}–${to} of ${total}</strong><nav aria-label="Pagination"><button disabled aria-label="Previous page">‹</button><button class="is-current" aria-current="page">1</button>${pages > 1 ? '<button>2</button><button>3</button><button>4</button><button>5</button><span>…</span><button>17</button>' : ""}<button ${pages === 1 ? "disabled" : ""} aria-label="Next page">›</button></nav></footer>`;
  const table = (headers, rows, options = {}) => `<div class="adminSpecialTableWrap"><table class="adminSpecialTable"><thead><tr>${headers.map(header => `<th>${esc(header)}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.map(row => `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`).join("") : `<tr><td colspan="${headers.length}" class="adminSpecialEmpty">${esc(options.empty || "No records found.")}</td></tr>`}</tbody></table></div>${options.pager ? pager(options.pager) : ""}`;
  const card = (title, body, options = {}) => `<section class="adminSpecialCard ${options.className || ""}">${title ? `<header><div><h2>${esc(title)}</h2>${options.subtitle ? `<p>${esc(options.subtitle)}</p>` : ""}</div>${options.action || ""}</header>` : ""}${body}</section>`;
  const closeModal = () => { modal.classList.remove("is-open"); modal.setAttribute("aria-hidden", "true"); modal.innerHTML = ""; };
  const openModal = (title, body, options = {}) => {
    modal.innerHTML = `<section class="adminModalCard adminSpecialModal ${options.wide ? "is-wide" : ""} ${options.tall ? "is-tall" : ""}" role="dialog" aria-modal="true" aria-labelledby="special-modal-title"><header><h2 id="special-modal-title">${esc(title)}</h2>${iconButton("Close modal", "close", "bi-x-lg")}</header><div class="adminSpecialModalBody">${body}</div>${options.footer || ""}</section>`;
    modal.classList.add("is-open"); modal.setAttribute("aria-hidden", "false");
  };
  const tabs = [["configurations", "Configurations"], ["visit", "Visit Module *"], ["monthend", "Monthend Activity *"], ["client-confirmation", "Client Confirmation"], ["pdc", "PDC Configuration"], ["escalation", "Escalation Matrix"], ["issue-tracker", "Issue Tracker Configuration"]];
  const aliases = { "visit-module": "visit", "monthend-activity": "monthend", "pdc-configuration": "pdc", "escalation-matrix": "escalation", "issue-tracker-configuration": "issue-tracker" };
  state.configView = aliases[state.configView] || state.configView;
  const frame = (body, options = {}) => {
    const nav = page.module === "module-configuration" ? tabs.map(([key, label]) => `<a href="?module=module-configuration&view=${key}" class="${state.configView === key ? "is-active" : ""}">${esc(label)}</a>`).join("") : "";
    mount.innerHTML = `<main class="adminPage adminRuntimePage adminSpecialPage ${options.className || ""}" data-admin-module="${page.module}"><section class="adminPageHero"><div><h1>${esc(options.title || definition.title)}</h1><span>${esc(options.description || (page.module === "module-configuration" ? "Configure your modules below." : definition.description))}</span></div>${options.heroAction || ""}</section>${nav ? `<section class="adminSourceWorkspace adminConfigurationWorkspace"><header class="adminWorkspaceHeader"><div class="adminWorkspaceTabs"><nav class="adminRuntimeTabs">${nav}</nav></div></header><div class="adminWorkspaceBody">${body}</div></section>` : body}</main>`;
  };

  function renderVisit() {
    const disabled = state.visitEditable ? "" : "disabled";
    return `<div class="adminVisitPanel"><div class="adminCurrentTimes"><section><span>Current Start Time</span><strong>10 : 00 <small>AM</small></strong></section><section><span>Current End Time</span><strong>5 : 30 <small>PM</small></strong></section></div><form data-special-form="visit"><fieldset class="adminSpecialRadioGroup"><legend>Enable Visit Planning Module? <em>*</em></legend><label><input type="radio" name="visitEnabled" value="yes" checked ${disabled}> Yes</label><label><input type="radio" name="visitEnabled" value="no" ${disabled}> No</label></fieldset><div class="adminSpecialStack">${field("Number of Visits Per Day", { required: true, type: "number", value: "5", disabled: !state.visitEditable })}${field("Number of RPC Count Per Day", { type: "number", value: "5", disabled: !state.visitEditable })}${field("Start Time Window", { required: true, options: ["10 AM", "9 AM", "9:30 AM", "10:30 AM"], disabled: !state.visitEditable })}${field("End Time Window", { options: ["5:30 PM", "5 PM", "6 PM", "6:30 PM"], disabled: !state.visitEditable })}</div>${state.visitEditable ? `<div class="adminSpecialActions">${button("Cancel", "cancel-visit")}${submit("Save Changes")}</div>` : ""}</form></div>`;
  }
  function renderClientConfirmation() {
    const rows = state.clientConfirmationUploads.map(row => [`<strong>TestClient Pvt Ltd</strong>`, `<span class="adminStatus is-warning">${esc(row.status)}</span>`, esc(row.date), row.total, `<span class="adminTextSuccess">${row.success}</span>`, `<span class="adminTextDanger">${row.reject}</span>`, "SYSTEM", button("Original", "notice", "link") + (row.reject ? button("Failed", "notice", "link") : "")]);
    return `<section class="adminSpecialSectionHeader"><h2>Client Confirmation (Bulk Processing)</h2>${button('<i class="bi bi-upload"></i> Upload Client Confirmation', "upload-confirmation", "primary")}</section>${table(["Company", "Status", "Uploaded Date", "Total", "Success", "Reject", "Maker", "Actions"], rows, { pager: { from: 1, to: 3, total: 3 } })}`;
  }
  function renderPdc() {
    const userRows = state.pdcUsers.map((user, index) => [`<strong>${esc(user.name)}</strong>`, esc(user.login), esc(user.role), '<span class="adminStatus is-success">Active</span>', iconButton("Remove PDC Ops user", `remove-pdc:${index}`, "bi-trash")]);
    return `<div class="adminSpecialIntro"><p>Configure PDC module settings and assign PDC Ops users.</p>${button(state.pdcEditable ? "Cancel" : "Edit Configuration", "edit-pdc")}</div><form data-special-form="pdc">${toggle("PDC Module", "Enable or disable the PDC management module for your organisation.", true, !state.pdcEditable, "pdcEnabled")}${field("Auto-Clear Days (PDC Banked to PDC Cleared)", { type: "number", value: "1", disabled: !state.pdcEditable, helper: "Number of days after which a banked PDC is automatically marked as cleared. Leave empty to disable auto-clearing." })}${state.pdcEditable ? `<div class="adminSpecialActions">${submit("Save Changes")}</div>` : ""}</form><section class="adminPdcUsers"><header><div><h2>PDC Ops Users</h2><p>Assign PDC Ops role to users. PDC Ops can edit and update PDC status in the PDC Management module.</p></div>${button('<i class="bi bi-plus"></i> Add PDC Ops User', "pdc-picker", "primary")}</header><div class="adminPdcPicker" id="pdcPicker" hidden><input type="search" placeholder="Search support users by name..." aria-label="Search support users"><button type="button" data-special-action="add-pdc-user"><strong>Vinit Misteam</strong><small>vinit.misteam</small></button><span>No more users</span><button type="button" data-special-action="close-pdc-picker">Close</button></div>${table(["Name", "Email / Login ID", "Primary Role", "Status", "Actions"], userRows)}<p class="adminSpecialHelper"><i class="bi bi-info-circle"></i> PDC Ops role can also be assigned from User Setup. There is no limit on the number of PDC Ops users.</p></section>`;
  }
  function renderEscalation() {
    const actions = action => button("View", `view-${action}`) + button("Edit", action) + button("Delete", `delete-${action}`, "danger");
    return `<section class="adminEscalationBlock"><h2>Processes</h2><div class="adminEscalationToolbar"><label><i class="bi bi-search"></i><input type="search" placeholder="Search processes..." data-special-filter="process"></label>${button("+ Create", "process", "primary")}</div>${table(["Process", "Active Issues", "Actions"], [["Wrong Billing", "95", actions("process")], ["test process", "1", actions("process")]])}<p>Saved approval processes will show up here. Use the search to quickly find a process.</p></section><section class="adminEscalationBlock"><h2>Approval Matrixes</h2><div class="adminEscalationToolbar"><label><i class="bi bi-search"></i><input type="search" placeholder="Search matrixes..." data-special-filter="matrix"></label>${button("+ New", "matrix", "primary")}</div>${table(["Name", "Levels", "Actions"], [["test matrix", "2", actions("matrix")], ["Wrong Billing", "4", actions("matrix")]])}<p>Create matrixes once and reuse them across multiple processes.</p></section>`;
  }
  function renderIssueTracker() {
    return `<p class="adminSpecialLead">Your existing setup is as shown below.</p><form data-special-form="issue-tracker">${toggle("Keep Manager in Approval Hierarchy", "If enabled, the reporting manager is added as an approval step before the approval matrix levels.", true, false, "keepManager")}<div class="adminSpecialActions is-left">${submit("Save Changes")}</div></form>`;
  }
  function renderConfig() {
    let body = "";
    if (state.configView === "configurations") body = window.IneburaAdminConfigurations.render();
    if (state.configView === "visit") body = `<div class="adminConfigEditBar">${button(state.visitEditable ? "Cancel" : "Edit Configuration", "edit-visit")}</div>${renderVisit()}`;
    if (state.configView === "monthend") body = window.IneburaAdminMonthend();
    if (state.configView === "client-confirmation") body = renderClientConfirmation();
    if (state.configView === "pdc") body = renderPdc();
    if (state.configView === "escalation") body = renderEscalation();
    if (state.configView === "issue-tracker") body = renderIssueTracker();
    frame(body, { className: `adminModuleConfiguration ${state.configView === "configurations" ? "adminConfigurationsPage" : ""}` });
  }

  const documentTypes = ["Select Document Type", "Invoice", "GRN Number", "Payment Receipt", "Delivery Challan", "Purchase Order"];
  const uploadedDocs = [["TestClient Pvt Ltd", "TN200008_GRN.png", "GR Number", "03-09-2026"], ["TestClient Pvt Ltd", "TA0412556_PR.png", "Payment Receipt", "03-09-2026"], ["TestClient Pvt Ltd", "TA0412556_DC.png", "Delivery Challan", "03-09-2026"], ["TestClient Pvt Ltd", "TA0412548_GRN.png", "GR Number", "03-09-2026"], ["TestClient Pvt Ltd", "TA0412548_PR.png", "Payment Receipt", "03-09-2026"], ["TestClient Pvt Ltd", "TA0412548_DC.png", "Delivery Challan", "03-09-2026"], ["TestClient Pvt Ltd", "TN200284_INV.png", "Invoice", "02-09-2026"], ["TestClient Pvt Ltd", "TN200231_DC.jpg", "Delivery Challan", "01-09-2026"]];
  const limboDocs = ["image (50)_BG.png", "image (56)_Contract.png", "TO123676_INV.png", "Inebura_All_Documents_50MB_PO.pdf", "Inebura_All_Documents_50MB_INV.pdf"];
  function renderBulk() {
    const limboRows = limboDocs.map((name, index) => ["<strong>TestClient Pvt Ltd</strong>", esc(name), "—", button('<i class="bi bi-pencil"></i> Edit', `edit-limbo:${index}`, "soft")]);
    frame(`<section class="adminBulkGuidance"><p>Only the documents selected during the document setup will be uploaded.</p><p>When uploading a document, ensure the file name includes the related <strong>Invoice Number</strong> or <strong>Customer Code</strong> to allow correct linking to the respective Invoice or Customer.</p></section><form class="adminBulkDocumentForm" data-special-form="bulk-document"><div class="adminSpecialStack">${field("Select Document Type", { options: documentTypes, name: "documentType", value: state.documentType })}<label class="adminSpecialField"><span>Choose Files (Accepted: .pdf, .jpeg, .jpg, .png)</span><span class="adminFileControl"><button type="button" data-special-action="choose-documents" ${state.documentType ? "" : "disabled"}><i class="bi bi-folder2-open"></i> Browse</button><em id="documentFileNames">${state.documentFiles.length ? `${state.documentFiles.length} file(s) chosen` : "No file chosen"}</em><input id="documentFiles" type="file" accept=".pdf,.jpeg,.jpg,.png" multiple hidden ${state.documentType ? "" : "disabled"}></span></label></div><div class="adminBulkActions">${submit('<i class="bi bi-cloud-arrow-up"></i> Upload', "primary", state.documentFiles.length ? "" : "disabled")}${button("Clear", "clear-documents")}${button(state.limbo ? '<i class="bi bi-table"></i> Show Uploads' : '<i class="bi bi-exclamation-triangle"></i> Show Limbo Documents', "toggle-limbo", "primary")}</div></form>${state.limbo ? table(["Client", "File Name", "Document Type", "Actions"], limboRows, { pager: { from: 1, to: 5, total: 5 } }) : table(["Client", "Upload File Name", "Document Type", "Uploaded Date"], uploadedDocs.map(row => row.map((cell, index) => index === 0 ? `<strong>${esc(cell)}</strong>` : esc(cell))), { pager: { from: 1, to: 8, total: 8 } })}`, { title: "Bulk Uploads (AR Transactions)", description: "Upload monthend confirmations, GRNs, payments, and other documents.", className: "adminBulkDocumentPage" });
  }
  function renderPassword() {
    if (page.view === "self") {
      frame(card("Change Password", `<form data-special-form="self-password" class="adminSpecialStack">${field("Old Password", { required: true, type: "password", placeholder: "Enter old password", name: "oldPassword" })}${field("New Password", { required: true, type: "password", placeholder: "Enter new password", name: "newPassword", helper: "Min 8 chars, uppercase, lowercase, digit, special character, no spaces" })}${field("Confirm New Password", { required: true, type: "password", placeholder: "Re-enter new password", name: "confirmPassword" })}<div class="adminSpecialActions">${submit("Change Password", "primary", "disabled")}</div></form>`), { title: "Change Password", description: "Update your account password." }); return;
    }
    frame(`<section class="adminPasswordCard"><header><h2>Update User Password</h2><p>Search for a user and set a new password for them.</p></header><form data-special-form="admin-password">${field("Select User", { required: true, options: ["Select user", "Dev Agent", "Sample Manager", "Sample Administrator"], name: "passwordUser", value: state.passwordUser || "Select user" })}<div id="adminPasswordFields" class="adminPasswordFields" ${state.passwordUser ? "" : "hidden"}>${field("New Password", { required: true, type: "password", name: "newPassword" })}${field("Confirm Password", { required: true, type: "password", name: "confirmPassword" })}<footer>${button("Cancel", "password-cancel")}${submit("Update Password")}</footer></div></form></section>`, { title: "Admin Change Password", description: "Reset or update user passwords administratively.", className: "adminPasswordPage" });
  }
  function renderClient() {
    const rows = state.subClients.map((client, index) => [esc(client.code), `<strong>${esc(client.name)}</strong>`, esc(client.pan), "07 Sep 2026", "07 Sep 2027", "0 / 5 GB", "0 / 5", '<span class="adminStatus is-success">Active</span>', button("Edit", `edit-client:${index}`, "link")]);
    frame(`<div class="adminClientActions">${button('<i class="bi bi-plus-circle"></i> Create Sub Client', "create-client", "primary")}${button('<i class="bi bi-toggle-off"></i> Show Deleted', "show-deleted", "danger")}</div><section class="adminClientIdentity"><div class="adminClientLogo"><img src="../assets/admin-reference/client-logo.jpg" alt="TestClient logo">${iconButton("Edit client logo", "edit-logo", "bi-pencil-fill")}</div><dl><dt>Client Code:</dt><dd><strong>cust_000079</strong></dd><dt>Client Name:</dt><dd><strong>TestClient Pvt Ltd</strong></dd><dt>Date Created:</dt><dd>26 Jun 2026</dd><dt>Renewal Date:</dt><dd>26 Jun 2027</dd><dt>PAN:</dt><dd>ABCGD2398H</dd><dt>Storage:</dt><dd>0 / 25 GB</dd><dt>Users:</dt><dd>50 / 50</dd></dl><div class="adminClientBadges"><span>292 Days Left</span><span>Active</span></div></section><h2 class="adminSectionTitle">${state.showDeleted ? "Deleted Sub Clients" : "Sub Clients"}</h2>${table(["Code", "Name", "PAN", "Created", "Renewal", "Storage", "Users", "Status", "Actions"], rows, { empty: state.showDeleted ? "No deleted sub clients." : 'No sub clients yet. Click "Create Sub Client" to add one.', pager: { from: 1, to: Math.max(rows.length, 1), total: Math.max(rows.length, 1) } })}`, { title: "Client Master", description: "Manage client accounts, text setups, and subscriptions.", className: "adminClientMasterPage" });
  }
  const purgeHistory = Array.from({ length: 10 }, (_, index) => [`9/${7 - Math.floor(index / 2)}/2026, 2:00:01 AM`, "SCHEDULED", "Purge", '<span class="adminStatus is-warning">SKIPPED</span>', "0", "—", "SYSTEM"]);
  function renderRetention() {
    frame(`<form data-special-form="retention">${card("Retention Policy", `<div class="adminRetentionFields">${field("Retention Period (days)", { required: true, type: "number", value: "365", helper: "Audit rows older than this become eligible for purge." })}${field("Minimum Retention Floor (days)", { required: true, type: "number", value: "90", helper: "Retention can never be set below this. System floor is 30 days." })}</div><label class="adminSpecialCheck"><input type="checkbox"> Enable <strong>scheduled automatic purge</strong> — the daily job purges this tenant when enabled.</label><label class="adminSpecialCheck"><input type="checkbox" checked> Notify before purge <span>days before:</span><input type="number" value="7" aria-label="Days before purge"></label><p>Last purge: 9/7/2026, 2:00:01 AM — SKIPPED (Purge disabled for tenant.)</p><div class="adminSpecialActions is-left">${submit("Save Settings")}</div>`)}</form>${card("Per-Entity Overrides", `<p>Optionally keep specific entity types longer than the tenant default (e.g. financial records).</p><form data-special-form="retention-override" class="adminOverrideFields">${field("Entity type", { options: ["Select entity…", ...entities] })}${field("Retention (days)", { type: "number" })}${submit("Add Override", "secondary")}</form>`)}${card("Run Purge Now", `<p>Preview shows how many rows would be deleted without removing anything. Running the purge permanently deletes audit rows older than the retention period for this tenant.</p><div class="adminSpecialActions is-left">${button("Preview (dry-run)", "purge-preview")}${button("Run Purge Now", "purge-confirm", "danger")}</div>`)}${card("Purge History", table(["Run At", "Type", "Mode", "Status", "Rows", "Retention", "Triggered By"], purgeHistory, { pager: { from: 1, to: 10, total: 166, pages: 17 } }))}`, { title: "Audit Retention & Purge", description: "Control how long audit history is retained for this tenant, and when it is purged.", className: "adminRetentionPage" });
  }
  const auditRows = [{ action: "CREATED", tone: "success", id: "10290", rev: "10087", time: "9/5/2026, 11:35:34 AM", fields: [["id", "—", "10290"], ["bankName", "—", "Dena Uttar Pradesh Bank"], ["isDeleted", "—", "false"], ["disabled", "—", "false"]] }, { action: "UPDATED", tone: "info", id: "10016", rev: "10086", time: "9/5/2026, 11:34:56 AM", fields: [["bankName", "Old Bank Name", "Updated Bank Name"]] }];
  function entityPicker() {
    return `<div class="adminSpecialField adminAuditEntity"><span>Entity Type <em>*</em></span><div class="adminEntityPicker"><button type="button" class="adminEntityControl" data-special-action="toggle-entity" aria-haspopup="listbox" aria-expanded="false"><span>${esc(state.auditEntity || "Select entity…")}</span><i class="bi bi-chevron-down"></i></button><div class="adminEntityMenu" hidden><input type="search" placeholder="Search..." data-entity-search aria-label="Search entity types"><div role="listbox">${entities.map(name => `<button type="button" role="option" data-entity-option="${esc(name)}">${esc(name)}</button>`).join("")}</div></div></div></div>`;
  }
  function auditTable() {
    if (!state.auditSearched) return table(["Timestamp", "Action", "Record Id", "Changed By", "Source IP", "Rev"], [], { empty: "Select an entity type and search." });
    return table(["Timestamp", "Action", "Record Id", "Changed By", "Source IP", "Rev", ""], auditRows.map((row, index) => [row.time, `<span class="adminStatus is-${row.tone}">${row.action}</span>`, row.id, "SYSTEM", "—", row.rev, button("View changes", `audit-history:${index}`, "dashed")]), { pager: { from: 1, to: 2, total: 2 } });
  }
  function renderAudit() {
    frame(`<section class="adminAuditCard"><form data-special-form="audit-search"><div class="adminAuditFields">${entityPicker()}${field("Record Id", { placeholder: "e.g. 4521", name: "recordId" })}${field("Action", { options: ["All", "Created", "Updated", "Deleted"], name: "action" })}${field("Changed By", { placeholder: "username", name: "changedBy" })}${field("From", { type: "date", name: "from" })}${field("To", { type: "date", name: "to" })}<div class="adminAuditButtons">${submit('<i class="bi bi-search"></i> Search')}${button('<i class="bi bi-download"></i> Export CSV', "notice", "secondary", state.auditSearched ? "" : "disabled")}</div></div></form><div id="auditResults">${auditTable()}</div></section>`, { title: "Audit Trail", description: "Immutable record of who changed what, when, and from where — across all audited entities.", className: "adminAuditPage" });
  }
  function openUploadConfirmation() {
    openModal("Bulk client Confirmation Upload", `<form data-special-form="client-confirmation-upload"><label class="adminDropzone"><i class="bi bi-cloud-arrow-up"></i><strong>Drag your file here</strong><span>Supports Excel files up to 10MB</span><em>Click to browse files</em><input type="file" accept=".xlsx,.xls" hidden data-confirmation-file></label><button type="button" class="adminDownloadTemplate" data-special-action="notice"><i class="bi bi-download"></i> Download Excel Template</button></form>`, { wide: true, footer: `<footer>${button("Cancel", "close")}${submit("Start Upload", "primary", "disabled data-confirmation-upload")}</footer>` });
  }
  function openProcess() {
    const content = state.processStep === 0 ? `<p>You are about to create a new process and attach an approval matrix.</p><ul><li>Step 1: Start the creation</li><li>Step 2: Provide a name for the process</li><li>Step 3: Select Primary Status and Sub Status</li><li>Step 4: Select an approval matrix to use for this process</li></ul>` : state.processStep === 1 ? `${field("Process Name", { name: "processName" })}<p class="adminSpecialHelper">Give your process a clear, descriptive name.</p>` : state.processStep === 2 ? `<p>Adding Primary Status and Sub Status will suggest the approval process to agents while performing the activities on invoice.</p><p class="adminInfoBar">These fields are non mandatory.</p>${field("Primary Status", { options: ["Select Primary Status", "Work In Progress", "Red Flag", "External Dependency"], name: "processPrimary", value: state.processPrimary })}${field("Sub Status", { options: ["Select Sub Status", "Pending Documents", "Under Review"], name: "processSubStatus", disabled: !state.processPrimary })}` : `${field("Select Approval Matrix", { options: ["Select a matrix", "test matrix", "Wrong Billing"] })}<p class="adminSpecialHelper">Select a reusable approval matrix. You can create and reuse matrices across multiple processes.</p>${button("Create new matrix", "matrix", "dashed")}`;
    openModal("Create New Process", `<form data-special-form="process">${content}</form>`, { wide: true, footer: `<footer>${state.processStep ? button("Back", "process-back") : ""}${state.processStep < 3 ? button("Next", "process-next", "primary") : submit("Create Process")}</footer>` });
  }
  function openMatrix() {
    const levels = Array.from({ length: state.matrixLevels }, (_, index) => `<section class="adminMatrixLevel"><header><strong>Level ${index + 1} <i class="bi bi-info-circle"></i></strong>${iconButton(`Remove level ${index + 1}`, `remove-level:${index}`, "bi-x-lg")}</header>${field("Approver", { options: ["Select Approver", "Manager", "Controller", "Client HO"] })}</section>`).join("");
    openModal("New Approval Matrix", `<form data-special-form="matrix">${field("Matrix Name", { placeholder: "e.g. Standard 3-Level Approval", name: "matrixName" })}<h3>Levels</h3>${levels || "<p>No levels yet. Click “+ Add Level” to add the first approver.</p>"}${button("+ Add Level", "add-level", "dashed")}<p class="adminSpecialHelper">Create a matrix once and reuse it for multiple processes.</p></form>`, { wide: true, tall: true, footer: `<footer>${button("Cancel", "close")}${submit("Save Matrix")}</footer>` });
  }
  function openClient(client = null) {
    openModal(client ? "Edit Client" : "Create Client", `<form data-special-form="client">${field("Company Name", { required: true, placeholder: "Enter company name", name: "companyName", value: client?.name })}${field("Client Code", { required: true, placeholder: "Enter client code", name: "clientCode", value: client?.code })}${field("PAN", { required: true, placeholder: "ABCDE1234F", name: "pan", value: client?.pan })}</form>`, { wide: true, footer: `<footer>${button("Cancel", "close")}${submit("Save")}</footer>` });
  }
  function handle(action) {
    if (!action) return;
    if (action === "close") closeModal();
    if (action === "notice") window.IneburaAdminPreviewNotice();
    if (action === "edit-visit") { state.visitEditable = !state.visitEditable; renderConfig(); }
    if (action === "cancel-visit") { state.visitEditable = false; renderConfig(); }
    if (action === "edit-pdc") { state.pdcEditable = !state.pdcEditable; renderConfig(); }
    if (action === "pdc-picker") document.getElementById("pdcPicker").hidden = false;
    if (action === "close-pdc-picker") document.getElementById("pdcPicker").hidden = true;
    if (action === "add-pdc-user") { state.pdcUsers.push({ name: "Vinit Misteam", login: "vinit.misteam", role: "PDC Ops" }); renderConfig(); }
    if (action.startsWith("remove-pdc:")) { state.pdcUsers.splice(Number(action.split(":")[1]), 1); renderConfig(); }
    if (action === "upload-confirmation") openUploadConfirmation();
    if (action === "toggle-limbo") { state.limbo = !state.limbo; renderBulk(); }
    if (action === "choose-documents") document.getElementById("documentFiles")?.click();
    if (action === "clear-documents") { state.documentFiles = []; renderBulk(); }
    if (action.startsWith("edit-limbo:")) openModal("Edit Limbo Document", `<form data-special-form="limbo">${field("File Name", { value: limboDocs[Number(action.split(":")[1])], disabled: true })}${field("Document Type", { options: documentTypes, required: true })}</form>`, { wide: true, footer: `<footer>${button("Cancel", "close")}${submit("Save")}</footer>` });
    if (action === "create-client") openClient();
    if (action.startsWith("edit-client:")) openClient(state.subClients[Number(action.split(":")[1])]);
    if (action === "show-deleted") { state.showDeleted = !state.showDeleted; renderClient(); }
    if (action === "password-cancel") { state.passwordUser = ""; renderPassword(); }
    if (action === "purge-preview") openModal("Purge Preview", `<p>This preview does not remove anything.</p>${table(["Entity Type", "Eligible Rows", "Retention Cut-off"], [["Invoice", "0", "—"], ["Customer", "0", "—"]])}`, { wide: true, footer: `<footer>${button("Close", "close")}</footer>` });
    if (action === "purge-confirm") openModal("Run Purge Now", `<div class="adminDangerNotice"><strong><i class="bi bi-exclamation-triangle"></i> Permanent deletion</strong><p>This action permanently deletes eligible audit rows and cannot be undone. This preview does not perform a real purge.</p></div><form data-special-form="purge"><label class="adminSpecialCheck"><input type="checkbox" required> I understand that this action cannot be undone.</label></form>`, { wide: true, footer: `<footer>${button("Cancel", "close")}${submit("Run Purge Now", "danger")}</footer>` });
    if (action === "process") { state.processStep = 0; state.processPrimary = ""; openProcess(); }
    if (action === "process-next") { state.processStep = Math.min(3, state.processStep + 1); openProcess(); }
    if (action === "process-back") { state.processStep = Math.max(0, state.processStep - 1); openProcess(); }
    if (action === "matrix") { state.matrixLevels = 0; openMatrix(); }
    if (action === "add-level") { state.matrixLevels += 1; openMatrix(); }
    if (action.startsWith("remove-level:")) { state.matrixLevels = Math.max(0, state.matrixLevels - 1); openMatrix(); }
    if (action.startsWith("delete-")) openModal("Confirm Delete", `<p>This removes only the selected sample item from this page.</p>`, { footer: `<footer>${button("Cancel", "close")}${submit("Delete", "danger")}</footer>` });
    if (action === "toggle-entity") { const menu = document.querySelector(".adminEntityMenu"); const control = document.querySelector(".adminEntityControl"); menu.hidden = !menu.hidden; control.setAttribute("aria-expanded", String(!menu.hidden)); if (!menu.hidden) menu.querySelector("input")?.focus(); }
    if (action.startsWith("audit-history:")) { const row = auditRows[Number(action.split(":")[1])]; openModal(`${state.auditEntity.replaceAll(" ", "")} #${row.id} — Change History`, `<section class="adminAuditRevision"><header><span class="adminStatus is-${row.tone}">${row.action}</span><strong>SYSTEM</strong><time>${row.time}</time><small>rev ${row.rev}</small></header>${table(["Field", "Old", "New"], row.fields.map(([name, oldValue, newValue]) => [`<strong>${esc(name)}</strong>`, `<span class="adminOldValue">${esc(oldValue)}</span>`, `<span class="adminNewValue">${esc(newValue)}</span>`]))}</section>`, { wide: true, footer: `<footer>${button("Close", "close")}</footer>` }); }
  }
  mount.addEventListener("click", event => { const entity = event.target.closest("[data-entity-option]"); if (entity) { state.auditEntity = entity.dataset.entityOption; renderAudit(); return; } handle(event.target.closest("[data-special-action]")?.dataset.specialAction); });
  modal.addEventListener("click", event => handle(event.target.closest("[data-special-action]")?.dataset.specialAction));
  document.addEventListener("change", event => {
    if (event.target.name === "documentType") { state.documentType = event.target.value === "Select Document Type" ? "" : event.target.value; state.documentFiles = []; renderBulk(); }
    if (event.target.id === "documentFiles") { state.documentFiles = [...event.target.files]; renderBulk(); }
    if (event.target.matches("[data-confirmation-file]")) modal.querySelector("[data-confirmation-upload]").disabled = !event.target.files.length;
    if (event.target.name === "passwordUser") { state.passwordUser = event.target.value === "Select user" ? "" : event.target.value; renderPassword(); }
    if (event.target.name === "processPrimary") { state.processPrimary = event.target.value === "Select Primary Status" ? "" : event.target.value; openProcess(); }
  });
  document.addEventListener("input", event => {
    if (event.target.matches("[data-entity-search]")) event.target.closest(".adminEntityMenu").querySelectorAll("[data-entity-option]").forEach(option => option.hidden = !option.textContent.toLowerCase().includes(event.target.value.toLowerCase()));
    if (event.target.matches("[data-special-filter]")) event.target.closest(".adminEscalationBlock").querySelectorAll("tbody tr").forEach(row => row.hidden = !row.textContent.toLowerCase().includes(event.target.value.toLowerCase()));
    if (event.target.closest('[data-special-form="self-password"]')) { const form = event.target.form, oldPassword = form.elements.oldPassword.value, password = form.elements.newPassword.value, confirm = form.elements.confirmPassword.value; form.querySelector('[type="submit"]').disabled = !(oldPassword && password.length >= 8 && /[A-Z]/.test(password) && /[a-z]/.test(password) && /\d/.test(password) && /[^\w\s]/.test(password) && !/\s/.test(password) && password === confirm); }
  });
  document.addEventListener("submit", event => {
    const form = event.target.closest("[data-special-form]"); if (!form) return; event.preventDefault(); if (!form.reportValidity()) return;
    const kind = form.dataset.specialForm;
    if (kind === "client") { const data = new FormData(form); state.subClients.push({ name: data.get("companyName"), code: data.get("clientCode"), pan: data.get("pan") }); closeModal(); renderClient(); }
    if (kind === "audit-search") { if (!state.auditEntity) return; state.auditSearched = true; renderAudit(); }
    if (["visit", "pdc"].includes(kind)) { state.visitEditable = false; state.pdcEditable = false; renderConfig(); }
    if (["admin-password", "self-password", "bulk-document", "client-confirmation-upload", "retention", "retention-override", "purge", "process", "matrix", "limbo", "issue-tracker"].includes(kind)) window.IneburaAdminPreviewNotice();
  });
  ({ "module-configuration": renderConfig, "bulk-document-upload": renderBulk, "change-password": renderPassword, "client-master": renderClient, "audit-retention": renderRetention, "audit-trail": renderAudit })[page.module]();
  window.IneburaAdminSpecializedContract = Object.freeze({ tabs: tabs.map(item => item[0]), documentTypes: documentTypes.slice(1), entities: [...entities] });
})();
