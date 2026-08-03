/* Source-faithful Operational Setup screens. All data and changes stay local. */
(() => {
  "use strict";

  const params = new URLSearchParams(window.location.search);
  const moduleId = params.get("module") || "";
  const operationalModules = new Set([
    "invoice-preferences",
    "document-setup",
    "role-display",
    "user-setup",
    "notification-manager",
  ]);
  if (!operationalModules.has(moduleId)) return;

  const mount = document.getElementById("adminPageContent");
  const modal = document.getElementById("adminModal");
  const toast = document.getElementById("adminToast");
  if (!mount || !modal || !toast) return;

  const view = params.get("view") || {
    "invoice-preferences": "aging",
    "document-setup": "documents",
    "role-display": "hierarchy",
    "user-setup": "create-user",
    "notification-manager": "preferences",
  }[moduleId];

  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const route = (targetView) => `admin.html?module=${encodeURIComponent(moduleId)}&view=${encodeURIComponent(targetView)}`;
  const showToast = (message) => {
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 2300);
  };
  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = "";
  };
  const openModal = ({ title, body, footer, className = "" }) => {
    modal.innerHTML = `<section class="adminModalCard opModal ${className}" role="dialog" aria-modal="true">
      <header><h2>${escapeHtml(title)}</h2><button class="adminModalClose" type="button" data-op-action="close-modal" aria-label="Close modal"><i class="bi bi-x-lg"></i></button></header>
      <div class="opModalBody">${body}</div>
      ${footer ? `<footer>${footer}</footer>` : ""}
    </section>`;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  };
  const pageFrame = ({ title, description, tabs = "", actions = "", content, workspaceClass = "" }) => {
    const header = tabs || actions ? `<header class="adminWorkspaceHeader opWorkspaceHeader"><div class="adminWorkspaceTabs">${tabs}</div><div class="adminWorkspaceActions">${actions}</div></header>` : "";
    return `<main class="adminPage adminRuntimePage opPage" data-admin-module="${escapeHtml(moduleId)}">
      <section class="adminPageHero"><div><h1>${escapeHtml(title)}</h1><span>${escapeHtml(description)}</span></div></section>
      <section class="adminSourceWorkspace opWorkspace ${workspaceClass}">${header}<div class="adminWorkspaceBody opWorkspaceBody">${content}</div></section>
    </main>`;
  };
  const tabs = (items) => `<nav class="adminRuntimeTabs opTabs" aria-label="Page sections">${items.map((item) =>
    `<a class="${view === item.view ? "is-active" : ""}" href="${route(item.view)}">${escapeHtml(item.label)}</a>`).join("")}</nav>`;
  const sortButton = (label) => `<button type="button" data-op-action="sort">${escapeHtml(label)} <i class="bi bi-caret-up-fill"></i><i class="bi bi-caret-down-fill"></i></button>`;
  const pager = (from, to, total, pages = 1) => `<footer class="adminPager opPager"><span>Showing ${from}–${to} of ${total}</span><div><button disabled aria-label="Previous page"><i class="bi bi-chevron-left"></i></button>${Array.from({ length: pages }, (_, i) => `<button class="${i === 0 ? "is-current" : ""}" data-op-action="page" data-page="${i + 1}">${i + 1}</button>`).join("")}<button ${pages === 1 ? "disabled" : ""} aria-label="Next page"><i class="bi bi-chevron-right"></i></button></div></footer>`;

  const buckets = [
    ["Not Due", -9999, 0], ["1-30", 1, 30], ["31-45", 31, 45], ["46-60", 46, 60],
    ["61-90", 61, 90], ["91-120", 91, 120], ["121-150", 121, 150], ["151-180", 151, 180],
    ["181-210", 181, 210], ["211-240", 211, 240], ["241-270", 241, 270], ["271-300", 271, 300],
    ["301-330", 301, 330], ["331-365", 331, 365], ["1-2 yrs", 366, 730], ["2-3 yrs", 731, 1095],
    ["3-4 yrs", 1096, 1460], ["4-5 yrs", 1461, 1825], ["5+ yrs", 1826, 9999],
  ];
  const selectedBuckets = new Set(["31-45", "46-60", "121-150", "151-180"]);
  const dispositions = [
    ["Work In Progress", "No Due", "Within Credit Period", "#edbd84"],
    ["", "", "LC Payment", "#dea46b"], ["", "", "As Per Payment Terms", "#c9834c"],
    ["", "", "Retention Amount", "#ad6439"], ["", "", "SD Amount", "#9b4e24"],
    ["", "Part Collected", "Part Payment through LC done", "#64a8df"],
    ["", "", "Part Payment Made", "#2f6ba2"], ["", "Future Commitment", "Promise to Pay", "#f4ce70"],
    ["", "Collection In Progress", "Funds Issue", "#cd74ad"], ["", "", "PDC Given", "#9b5792"],
    ["Further Docs Required", "Documents Required", "Invoice Copy Required", "#46a08f"],
    ["", "", "PO Copy Required", "#337a70"], ["Collection Done", "Collected", "Collected", "#58a46d"],
  ];

  const dispositionRowSpan = (startIndex, columnIndex) => {
    let span = 1;
    for (let index = startIndex + 1; index < dispositions.length; index += 1) {
      if (dispositions[index][columnIndex]) break;
      span += 1;
    }
    return span;
  };

  const renderAgingTable = () => `<div class="opSubTabs">
      <button class="is-active" data-op-action="aging-mode" data-mode="existing">Select from Existing</button>
      <button data-op-action="aging-mode" data-mode="custom">Create Custom Groups</button>
    </div>
    <div class="opAgingExisting">
      <div class="adminTableWrap"><table class="adminTable opAgingTable"><thead><tr><th>Select</th><th>Bucket Name</th><th>From</th><th>To</th></tr></thead>
      <tbody>${buckets.map(([name, from, to]) => `<tr><td><input type="checkbox" ${selectedBuckets.has(name) ? "checked" : ""} aria-label="Select ${escapeHtml(name)}" /></td><td><strong>${escapeHtml(name)}</strong></td><td>${from}</td><td>${to}</td></tr>`).join("")}</tbody></table></div>
      <div class="opEndAction"><button class="adminPrimary" data-op-action="save-buckets">Submit Selected</button></div>
    </div>
    <div class="opAgingCustom" hidden>
      <div class="opSubAction"><button class="adminPrimary" data-op-action="create-bucket"><i class="bi bi-plus-circle"></i>Create Bucket</button></div>
      <div class="opBucketCards">
        <article><header><strong>Not due 1-30</strong></header><div><b>Buckets:</b><p>Not due</p><footer><button class="adminSecondary" data-op-action="edit-bucket"><i class="bi bi-pencil"></i>Edit</button><button class="opDangerButton" data-op-action="delete-bucket"><i class="bi bi-trash3"></i>Delete</button></footer></div></article>
        <article><header><strong>61-120</strong></header><div><b>Buckets:</b><p>61-90 , 91-120</p><footer><button class="adminSecondary" data-op-action="edit-bucket"><i class="bi bi-pencil"></i>Edit</button><button class="opDangerButton" data-op-action="delete-bucket"><i class="bi bi-trash3"></i>Delete</button></footer></div></article>
      </div>
    </div>`;

  const renderDispositions = () => `<div class="adminTableWrap"><table class="adminTable opDispositionTable"><thead><tr><th>Broad Status</th><th>Primary Status</th><th>Sub Status</th><th>Color</th><th>Actions</th></tr></thead><tbody>
    ${dispositions.map((row, index) => `<tr>
      ${row[0] ? `<td class="opBroadStatus" rowspan="${dispositionRowSpan(index, 0)}" scope="rowgroup">${escapeHtml(row[0])}</td>` : ""}
      ${row[1] ? `<td class="opPrimaryStatus" rowspan="${dispositionRowSpan(index, 1)}" scope="rowgroup"><span>${escapeHtml(row[1])}</span><button class="opAddSub" data-op-action="add-sub-status">Add Sub Status</button></td>` : ""}
      <td>${escapeHtml(row[2])}</td><td><i class="opColorChip" style="background:${row[3]}"></i></td><td><button class="opIconDanger" data-op-action="remove-sub-status" aria-label="Delete sub status"><i class="bi bi-trash3"></i></button></td>
    </tr>`).join("")}
    </tbody></table></div>`;

  const renderPurge = () => `<article class="opPurgeCard"><header><h2>Data Purge Policy</h2><button class="adminSecondary" data-op-action="edit-purge"><i class="bi bi-pencil"></i>Edit</button></header>
    <label><span>PURGE COUNT (DAYS)</span><select id="opPurgeDays" disabled><option>30 Days</option><option>60 Days</option><option>90 Days</option><option>180 Days</option></select></label>
    <p>Data older than this many days will be automatically purged from the system</p>
    <div class="opWarning"><i class="bi bi-exclamation-triangle"></i><strong>Warning:</strong> This will permanently delete data older than the specified number of days. This action cannot be undone.</div>
    <div class="opPurgeActions" hidden><button class="adminSecondary" data-op-action="cancel-purge">Cancel</button><button class="adminPrimary" data-op-action="save-purge">Save</button></div>
  </article>`;

  const renderInvoicePreferences = () => {
    const invoiceTabs = tabs([
      { label: "Aging Bucket", view: "aging" },
      { label: "Customization of Activity Dispositions", view: "dispositions" },
      { label: "Purge Policy", view: "purge" },
    ]);
    const content = view === "dispositions" ? renderDispositions() : view === "purge" ? renderPurge() : renderAgingTable();
    mount.innerHTML = pageFrame({
      title: "Invoice Setup",
      description: "Configure ageing buckets, activity dispositions, and data purge policies.",
      tabs: invoiceTabs,
      content,
      workspaceClass: "opInvoiceWorkspace",
    });
  };

  const documents = [
    ["Email-C", "Email Communication (Customer)", "CUSTOMER LEVEL", "-"],
    ["Email-I", "Email Communication (Invoice)", "INVOICE LEVEL", "-"],
    ["GRN", "GR Number", "INVOICE LEVEL", "-"], ["INVACK", "Invoice Acknowledgement", "INVOICE LEVEL", "-"],
    ["WO", "Work Order", "CUSTOMER LEVEL", "-"], ["PM", "Preventive Maintenance Report", "CUSTOMER LEVEL", "-"],
    ["IB", "Indemnity Bond", "CUSTOMER LEVEL", "-"], ["DC", "Delivery Challan", "INVOICE LEVEL", "-"],
    ["PBG", "Performance Bank Guarantee", "CUSTOMER LEVEL", "-"], ["BG", "Bank Guarantee", "CUSTOMER LEVEL", "-"],
    ["Contract", "Contract", "CUSTOMER LEVEL", "-"], ["Agmt", "Agreement", "CUSTOMER LEVEL", "-"],
    ["PR", "Payment Receipt", "INVOICE LEVEL", "-"], ["PO", "Purchase Order", "CUSTOMER LEVEL", "-"],
    ["INV", "Invoice", "INVOICE LEVEL", "-"],
  ];
  const renderDocumentTable = () => `<div class="adminTableWrap"><table class="adminTable opDocumentTable"><thead><tr><th>${sortButton("Document Code")}</th><th>${sortButton("Document Name")}</th><th>${sortButton("Category")}</th><th>${sortButton("Description")}</th><th>Actions</th></tr></thead><tbody>
    ${documents.slice(0, 10).map((row, index) => `<tr><td><code>${escapeHtml(row[0])}</code></td><td>${escapeHtml(row[1])}</td><td><span class="opCategory ${row[2].startsWith("CUSTOMER") ? "is-customer" : "is-invoice"}">${escapeHtml(row[2])}</span></td><td>${escapeHtml(row[3])}</td><td><div class="opRowActions"><button class="adminSecondary" data-op-action="edit-document" data-index="${index}"><i class="bi bi-pencil"></i>Edit</button><button class="opDangerButton" data-op-action="delete-document" data-index="${index}"><i class="bi bi-trash3"></i>Delete</button></div></td></tr>`).join("")}
    </tbody></table></div>${pager(1, 10, 15, 2)}`;

  const renderDocumentSetup = () => {
    const docTabs = `<nav class="adminRuntimeTabs opTabs"><a class="is-active" href="${route("documents")}">Documents List</a></nav>`;
    const actions = `<button class="adminGhostButton opPresetButton" data-op-action="preset-documents"><i class="bi bi-list-check"></i>Select from Preset List</button><button class="adminPrimary" data-op-action="create-document"><i class="bi bi-plus-circle"></i>Create New</button>`;
    mount.innerHTML = pageFrame({
      title: "Document Setup",
      description: "Manage your document checklist and templates.",
      tabs: docTabs,
      actions,
      content: renderDocumentTable(),
      workspaceClass: "opDocumentWorkspace",
    });
  };

  const hierarchyColumn = (label, tone, nodes) => `<section class="opHierarchyLane"><h3 class="${tone}">${escapeHtml(label)}</h3>${nodes.map((node) =>
    `<article class="${node.required ? "is-required" : ""}"><small>${escapeHtml(node.role)}</small><strong>${escapeHtml(node.name)}</strong></article>`).join("")}</section>`;
  const hierarchyNode = (role, name, required = false) => `<article class="${required ? "is-required" : ""}"><small>${escapeHtml(role)}</small><strong>${escapeHtml(name)}</strong></article>`;
  const renderHierarchy = () => `<p class="opIntro">Organisation hierarchy is defined here. Mandatory fields are highlighted for your reference.</p>
    <div class="opHierarchyCanvas">
      <section class="opHierarchyLane opOperationalLane"><h3 class="is-blue">Operational Roles</h3><div class="opOperationalTree">
        <div class="opTreeRoot">${hierarchyNode("SUPERVISOR", "Supervisor 1", true)}</div>
        <div class="opTreeChildren">
          <div class="opTreeBranch opManagerBranch">
            ${hierarchyNode("MANAGER", "Manager 1", true)}
            <div class="opTreeLeaves">${hierarchyNode("AGENT", "Agent 1", true)}${hierarchyNode("TELECALLER", "Telecaller 1")}</div>
          </div>
          <div class="opTreeBranch opAgentManagerBranch">
            ${hierarchyNode("AGENTCUMMANAGER", "Manager 3")}
            <div class="opTreeLeaves is-single">${hierarchyNode("AGENT", "Agent 6")}</div>
          </div>
        </div>
      </div></section>
      ${hierarchyColumn("Support Roles", "is-green", [
        { role: "MIS", name: "MIS User" }, { role: "BACKEND", name: "Backend User" },
        { role: "PDC OPS", name: "PDC Ops" }, { role: "PDC AGENT", name: "PDC Agent" },
      ])}
      ${hierarchyColumn("View Roles", "is-cyan", [
        { role: "CLIENT HO", name: "Client HO 1" }, { role: "CLIENT CONTROLLER", name: "Client Controller 1" },
        { role: "KAS", name: "KAS 1", required: true }, { role: "KAM", name: "KAM 1", required: true },
        { role: "ACTION OWNER", name: "Action Owner" },
      ])}
      ${hierarchyColumn("Customer Roles", "is-purple", [
        { role: "CUSTOMER", name: "Customer" },
      ])}
    </div>`;
  const renderRoleForm = () => `<p class="opIntro">Role names can be customized as per your requirements.</p>
    <form class="opRoleForm" id="opRoleForm">
      <label><span>SELECT ROLE TYPE</span><select id="opRoleType" required><option value="">Select Role Type</option><option>Admin</option><option>Support Role</option><option>Customer Role</option><option>View Role</option><option>Operational Role</option></select></label>
      <label><span>SELECT ROLE</span><select id="opRoleName" disabled required><option>Select a Role Type first</option></select></label>
      <label class="is-wide"><span>DISPLAY VALUE *</span><input id="opDisplayValue" placeholder="Enter custom display name" disabled required /><small>This is the name that will be displayed throughout the application for this role</small></label>
      <footer class="is-wide"><button type="reset" class="adminSecondary" data-op-action="reset-role">Reset</button><button class="adminPrimary" disabled id="opRoleSubmit">Submit</button></footer>
    </form>`;
  const renderRoleDisplay = () => {
    const roleTabs = tabs([
      { label: "Organisation Hierarchy", view: "hierarchy" },
      { label: "Role Display Names", view: "display-names" },
    ]);
    mount.innerHTML = pageFrame({
      title: "Role and Display Name Setup",
      description: "Configure organization hierarchy and role names.",
      tabs: roleTabs,
      content: view === "display-names" ? renderRoleForm() : renderHierarchy(),
      workspaceClass: "opRoleWorkspace",
    });
  };

  const users = [
    ["Anisha Pandey", "anisha.pandey+agent@tanserv.com", "AGENT", "Gurugram", "Rajneesh ACM"],
    ["Anisha Pandey", "anisha.pandey+customer@tanserv.com", "CUSTOMER", "Gurugram", "-"],
    ["Customer Sahrudaya", "rajneesh.pandey+Sahrudaya@tanserv.com", "CUSTOMER", "Gurugram", "-"],
    ["Customer POSTGRADUATE", "rajneesh.pandey+POSTGRADUATE@tanserv.com", "CUSTOMER", "Gurugram", "-"],
    ["Customer two", "balram.singh+customer@tanserv.com", "CUSTOMER", "Gurugram", "-"],
    ["kam six", "rajneesh.pandey+kamsix@tanserv.com", "KAM", "Gurugram", "KAS One"],
    ["anisha pandey", "anisha.pandey+xeonuser@tanserv.com", "AGENT", "Gurugram", "Rajneesh Manager"],
    ["kam Two", "rajneesh.pandey+kamtwo@tanserv.com", "KAM", "Gurugram", "KAS One"],
    ["Agent Two", "devashish.rattan+agenttwo@tanserv.com", "AGENT", "Gurugram", "Devashish Manager"],
    ["Agent One", "rajneesh.pandey+agentone@tanserv.com", "AGENT", "Gurugram", "Devashish Manager"],
  ];
  const uploadHistory = [
    ["15/07/2026", "User_Upload_Template (5).xlsx", 1, 1, 0, "COMPLETE"],
    ["15/07/2026", "User_Upload_Template (5).xlsx", 1, 0, 1, "PARTIAL"],
    ["15/07/2026", "Single Tenant user (1).xlsx", 2, 2, 0, "COMPLETE"],
    ["26/06/2026", "Single Tenant user.xlsx", 26, 26, 0, "COMPLETE"],
    ["-", "-", 0, 0, 0, "COMPLETE"],
  ];
  let userQuery = "";
  let userRole = "ALL";

  const renderUserRows = () => {
    const tbody = document.getElementById("opUserRows");
    if (!tbody) return;
    const filtered = users.filter((row) => (userRole === "ALL" || row[2] === userRole) && (!userQuery || row.join(" ").toLowerCase().includes(userQuery.toLowerCase())));
    tbody.innerHTML = filtered.map((row, index) => `<tr><td><strong>${escapeHtml(row[0])}</strong></td><td title="${escapeHtml(row[1])}">${escapeHtml(row[1])}</td><td><span class="opRolePill">${escapeHtml(row[2])}</span></td><td>${escapeHtml(row[3])}</td><td>${escapeHtml(row[4])}</td><td><div class="opRowActions opUserActions"><button class="adminSecondary" data-op-action="edit-user" data-index="${index}"><i class="bi bi-pencil"></i>Edit</button><button class="opPasswordButton" data-op-action="password-user" data-index="${index}"><i class="bi bi-key"></i>Pwd</button><button class="adminSecondary" data-op-action="suspend-user" data-index="${index}"><i class="bi bi-pause-circle"></i>Suspend</button><button class="opDangerButton" data-op-action="delete-user" data-index="${index}"><i class="bi bi-trash3"></i>Delete</button></div></td></tr>`).join("") || `<tr><td colspan="6"><div class="adminRuntimeEmpty"><strong>No team members found.</strong></div></td></tr>`;
  };
  const renderUserCreation = () => `<div class="opUserToolbar"><h2>Team Members</h2><label class="opRoleFilter"><span>Role</span><select id="opUserRole"><option>ALL</option><option>AGENT</option><option>CUSTOMER</option><option>KAM</option></select></label><label class="opSearch"><i class="bi bi-search"></i><input id="opUserSearch" placeholder="Search by name, email..." /></label><button class="adminPrimary" data-op-action="create-user"><i class="bi bi-plus-circle"></i>Create New</button></div>
    <div class="adminTableWrap"><table class="adminTable opUserTable"><thead><tr><th>${sortButton("Name")}</th><th>${sortButton("Email")}</th><th>Role</th><th>Branch</th><th>Reporting To</th><th>Actions</th></tr></thead><tbody id="opUserRows"></tbody></table></div>${pager(1, 10, 40, 4)}`;
  const renderUserBulk = () => `<div class="opUserToolbar opBulkToolbar"><h2>User Bulk Creation History</h2><button class="adminPrimary" data-op-action="bulk-users"><i class="bi bi-person-plus-fill"></i>Bulk Upload Users</button></div>
    <div class="adminTableWrap"><table class="adminTable opBulkTable"><thead><tr><th>${sortButton("Upload Date")}</th><th>${sortButton("File Name")}</th><th>${sortButton("Total")}</th><th>${sortButton("Success")}</th><th>${sortButton("Failed")}</th><th>${sortButton("Status")}</th><th>Actions</th></tr></thead><tbody>
    ${uploadHistory.map((row) => `<tr><td>${row[0]}</td><td><strong>${escapeHtml(row[1])}</strong></td><td>${row[2]}</td><td><span class="opMetric is-success">${row[3]}</span></td><td><span class="opMetric ${row[4] ? "is-failed" : ""}">${row[4]}</span></td><td><span class="opUploadStatus ${row[5] === "PARTIAL" ? "is-partial" : ""}">${row[5]}</span></td><td><button class="opDownloadIcon" data-op-action="download-results" aria-label="Download results"><i class="bi bi-cloud-arrow-down"></i></button>${row[4] ? `<button class="opDownloadIcon is-error" data-op-action="download-errors" aria-label="Download errors"><i class="bi bi-cloud-arrow-down"></i></button>` : ""}</td></tr>`).join("")}
    </tbody></table></div>${pager(1, 5, 5, 1)}`;
  const renderUserSetup = () => {
    const userTabs = tabs([{ label: "User Creation", view: "create-user" }, { label: "User Bulk Creation", view: "bulk-user" }]);
    mount.innerHTML = pageFrame({
      title: "User Setup",
      description: "Manage user accounts and bulk creation.",
      tabs: userTabs,
      content: view === "bulk-user" ? renderUserBulk() : renderUserCreation(),
      workspaceClass: "opUserWorkspace",
    });
    renderUserRows();
  };

  const preferences = [
    ["admin TestClient", "7459996796", "rajneesh.pandey@tanserv.com", true],
    ["Agent One", "7459996796", "rajneesh.pandey+agentone@tanserv.com", true],
    ["Agent Two", "7890189010", "devashish.rattan+agenttwo@tanserv.com", true],
    ["Anisha Pandey", "6294567894", "anisha.pandey+agent@tanserv.com", true],
    ["anisha pandey", "8657065356", "anisha.pandey+xeonuser@tanserv.com", true],
    ["Anisha Pandey", "9987754568", "anisha.pandey+customer@tanserv.com", true],
    ["Controller One", "7459996796", "rajneesh.pandey+cc1@tanserv.com", true],
    ["Controller Three", "7459996796", "rajneesh.pandey+cc3@tanserv.com", true],
    ["Controller Two", "7459996796", "rajneesh.pandey+cc2@tanserv.com", true],
    ["Customer POSTGRADUATE", "9876543256", "rajneesh.pandey+POSTGRADUATE@tanserv.com", true],
  ];
  let notificationQuery = "";
  const renderPreferenceRows = () => {
    const tbody = document.getElementById("opPreferenceRows");
    if (!tbody) return;
    tbody.innerHTML = preferences.filter((row) => !notificationQuery || row.join(" ").toLowerCase().includes(notificationQuery.toLowerCase())).map((row, index) => `<tr><td>${escapeHtml(row[0])}</td><td>${escapeHtml(row[1])}</td><td>${escapeHtml(row[2])}</td><td><label class="opSwitch"><input type="checkbox" data-op-pref-index="${index}" ${row[3] ? "checked" : ""} /><span></span></label><strong class="opWhatsAppState">${row[3] ? "WhatsApp: On" : "WhatsApp: Off"}</strong></td></tr>`).join("");
  };
  const renderNotificationManager = () => {
    const content = `<label class="opSearch opNotificationSearch"><i class="bi bi-search"></i><input id="opNotificationSearch" placeholder="Search by name, email..." /></label>
      <div class="adminTableWrap"><table class="adminTable opNotificationTable"><thead><tr><th>${sortButton("Name")}</th><th>${sortButton("Phone Number")}</th><th>${sortButton("Email ID")}</th><th>${sortButton("WhatsApp Declaration")}</th></tr></thead><tbody id="opPreferenceRows"></tbody></table></div>${pager(1, 10, 40, 4)}`;
    mount.innerHTML = pageFrame({
      title: "Notification Manager",
      description: "Configure and manage your notification settings and user preferences.",
      content,
      workspaceClass: "opNotificationWorkspace",
    });
    renderPreferenceRows();
  };

  const input = (label, name, type = "text", required = false, placeholder = "", value = "") => `<label><span>${escapeHtml(label)}${required ? " *" : ""}</span><input name="${escapeHtml(name)}" type="${escapeHtml(type)}" ${required ? "required" : ""} placeholder="${escapeHtml(placeholder)}" value="${escapeHtml(value)}" /></label>`;
  const userRoleOptions = {
    Admin: ["ADMIN"],
    "Support Role": ["MIS", "BACKEND", "PDC OPS", "PDC AGENT"],
    "Customer Role": ["CUSTOMER"],
    "View Role": ["CLIENT HO", "CLIENT CONTROLLER", "KAS", "KAM", "ACTION OWNER"],
    "Operational Role": ["SUPERVISOR", "MANAGER", "AGENTCUMMANAGER", "AGENT", "TELECALLER"],
  };
  const userSelectOptions = (options, selectedValue = "") => options.map((option) =>
    `<option value="${escapeHtml(option)}" ${option === selectedValue ? "selected" : ""}>${escapeHtml(option)}</option>`).join("");
  let userWizardStep = 1;
  const userDraft = {};
  let editingUserIndex = null;
  const renderUserWizard = (editing = false) => {
    const title = `${editing ? "Edit" : "Create"} User - Step ${userWizardStep} of 2`;
    const stepOne = `<div class="opInfo"><i class="bi bi-info-circle-fill"></i><p><strong>Note:</strong> To maintain a proper reporting structure, please create senior hierarchy users first before creating lower hierarchy users. This ensures the Reporting To field can be correctly mapped.</p></div>
      <label class="opExistingContact"><input type="checkbox" />Use Existing Contact Person</label>
      <form id="opUserWizardForm" class="opFormGrid">${input("FIRST NAME", "firstName", "text", true, "", userDraft.firstName)}${input("LAST NAME", "lastName", "text", false, "", userDraft.lastName)}${input("EMAIL", "email", "email", true, "", userDraft.email)}${input("PHONE 1", "phone1", "tel", true, "", userDraft.phone1)}${input("PHONE 2", "phone2", "tel", false, "", userDraft.phone2)}${input("USER NAME", "username", "text", true, "", userDraft.username)}</form>`;
    const availableRoles = userRoleOptions[userDraft.roleType] || [];
    const stepTwo = `<form id="opUserWizardForm" class="opFormGrid">
      <label><span>ROLE TYPE *</span><select id="opWizardRoleType" name="roleType" required><option value="">Select Role Type</option>${userSelectOptions(Object.keys(userRoleOptions), userDraft.roleType)}</select></label>
      <label><span>ROLE *</span><select id="opWizardRole" name="role" required ${availableRoles.length ? "" : "disabled"}><option value="">${availableRoles.length ? "Select Role" : "Select a Role Type first"}</option>${userSelectOptions(availableRoles, userDraft.role)}</select></label>
      <label><span>BRANCH *</span><select id="opWizardBranch" name="branch" required><option value="">Select Branch</option>${userSelectOptions(["Gurugram"], userDraft.branch)}</select></label>
      <label class="is-wide"><span>REPORTING TO</span><div class="opReportingEmpty"><i class="bi bi-people"></i><strong>${escapeHtml(userDraft.reportingTo || "No users available")}</strong></div></label>
    </form>`;
    openModal({
      title,
      body: userWizardStep === 1 ? stepOne : stepTwo,
      footer: userWizardStep === 1
        ? `<button class="adminSecondary" data-op-action="close-modal">Cancel</button><button class="adminPrimary" data-op-action="user-next">Next</button>`
        : `<button class="adminSecondary opPrevious" data-op-action="user-previous">Previous</button><button class="adminSecondary" data-op-action="close-modal">Cancel</button><button class="adminPrimary" data-op-action="save-user">Save</button>`,
      className: "opUserModal",
    });
  };

  const openDocumentForm = (index = null) => {
    const row = index == null ? null : documents[index];
    openModal({
      title: row ? "Edit Document" : "Create Document",
      body: `<form id="opDocumentForm" class="opFormGrid" data-document-index="${index == null ? "" : index}">
        <label><span>DOCUMENT CODE *</span><input required name="code" value="${escapeHtml(row?.[0] || "")}" placeholder="e.g., INV, PO" /></label>
        <label><span>DOCUMENT NAME *</span><input required name="name" value="${escapeHtml(row?.[1] || "")}" placeholder="e.g., Invoice" /></label>
        <label class="is-wide"><span>DOCUMENT CATEGORY *</span><select name="category" required><option value="">Select Category</option><option ${row?.[2] === "INVOICE LEVEL" ? "selected" : ""}>INVOICE LEVEL</option><option ${row?.[2] === "CUSTOMER LEVEL" ? "selected" : ""}>CUSTOMER LEVEL</option></select></label>
        <label class="is-wide"><span>DESCRIPTION</span><textarea name="description" placeholder="Optional description...">${escapeHtml(row?.[3] === "-" ? "" : row?.[3] || "")}</textarea></label>
      </form>`,
      footer: `<button class="adminSecondary" data-op-action="close-modal">Cancel</button><button class="adminPrimary" type="submit" form="opDocumentForm">${row ? "Update" : "Save"}</button>`,
      className: "opDocumentModal",
    });
  };

  const openPresetDocuments = () => openModal({
    title: "Select Preset Documents",
    body: `<div class="adminTableWrap"><table class="adminTable opPresetTable"><thead><tr><th><label class="opSwitch opSmallSwitch"><input type="checkbox" /><span></span></label></th><th>Document Name</th><th>Code</th><th>Category</th><th>Status</th></tr></thead><tbody>
      ${documents.slice().reverse().map((row) => `<tr><td><label class="opSwitch opSmallSwitch"><input type="checkbox" disabled /><span></span></label></td><td>${escapeHtml(row[1])}</td><td><code>${escapeHtml(row[0])}</code></td><td><span class="opCategory ${row[2].startsWith("CUSTOMER") ? "is-customer" : "is-invoice"}">${escapeHtml(row[2])}</span></td><td><span class="opAlreadyAdded">ALREADY ADDED</span></td></tr>`).join("")}</tbody></table></div><p class="opPresetHint">Select documents to add</p>`,
    footer: `<button class="adminSecondary" data-op-action="close-modal">Cancel</button><button class="adminPrimary" disabled>Add Selected</button>`,
    className: "opPresetModal",
  });

  const openBulkUserModal = () => openModal({
    title: "User Bulk Upload",
    body: `<button class="opUploadDropzone" data-op-action="choose-user-file"><i class="bi bi-cloud-arrow-up"></i><strong>Drag your file here</strong><span>Supports Excel files up to 5MB</span><em>Click to browse files</em></button><input id="opUserFile" type="file" accept=".xlsx,.xls" hidden /><div id="opSelectedFile" class="opSelectedFile" hidden></div><button class="opTemplateButton" data-op-action="download-template"><i class="bi bi-download"></i>Download Template</button>`,
    footer: `<button class="adminSecondary" data-op-action="close-modal">Close</button><button class="adminPrimary" id="opStartImport" data-op-action="start-import" disabled>Start Import</button>`,
    className: "opBulkUserModal",
  });

  const openSimpleConfirm = (title, body, confirmLabel, action) => openModal({
    title,
    body: `<div class="opConfirm"><i class="bi bi-exclamation-triangle"></i><p>${escapeHtml(body)}</p></div>`,
    footer: `<button class="adminSecondary" data-op-action="close-modal">Cancel</button><button class="opDangerButton" data-op-action="${escapeHtml(action)}">${escapeHtml(confirmLabel)}</button>`,
    className: "opConfirmModal",
  });

  const render = () => {
    if (moduleId === "invoice-preferences") renderInvoicePreferences();
    if (moduleId === "document-setup") renderDocumentSetup();
    if (moduleId === "role-display") renderRoleDisplay();
    if (moduleId === "user-setup") renderUserSetup();
    if (moduleId === "notification-manager") renderNotificationManager();
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-op-action]");
    if (!trigger) return;
    const action = trigger.dataset.opAction;
    if (action === "close-modal") closeModal();
    if (action === "aging-mode") {
      document.querySelectorAll(".opSubTabs button").forEach((button) => button.classList.toggle("is-active", button === trigger));
      document.querySelector(".opAgingExisting").hidden = trigger.dataset.mode !== "existing";
      document.querySelector(".opAgingCustom").hidden = trigger.dataset.mode !== "custom";
    }
    if (action === "save-buckets") showToast("Selected ageing buckets saved in the dummy workspace");
    if (action === "create-bucket" || action === "edit-bucket") openModal({
      title: action === "create-bucket" ? "Create Bucket" : "Edit Bucket",
      body: `<form id="opBucketForm" class="opFormGrid">${input("GROUP NAME", "groupName", "text", true, "Enter group name")}<label><span>BUCKETS *</span><select multiple required>${buckets.slice(0, 8).map(([name]) => `<option>${escapeHtml(name)}</option>`).join("")}</select></label></form>`,
      footer: `<button class="adminSecondary" data-op-action="close-modal">Cancel</button><button class="adminPrimary" type="submit" form="opBucketForm">Save</button>`,
    });
    if (action === "delete-bucket") openSimpleConfirm("Delete Bucket", "Remove this custom ageing group from the dummy setup?", "Delete", "confirm-delete-bucket");
    if (action === "confirm-delete-bucket") { closeModal(); showToast("Custom bucket removed from the dummy workspace"); }
    if (action === "add-sub-status") openModal({
      title: "Add Sub Status",
      body: `<form id="opSubStatusForm" class="opFormGrid">${input("SUB STATUS", "subStatus", "text", true, "Enter sub status")}<label><span>COLOR *</span><input type="color" name="color" value="#5c258d" /></label></form>`,
      footer: `<button class="adminSecondary" data-op-action="close-modal">Cancel</button><button class="adminPrimary" type="submit" form="opSubStatusForm">Save</button>`,
    });
    if (action === "remove-sub-status") openSimpleConfirm("Delete Sub Status", "This removes the selected activity sub status from the dummy configuration.", "Delete", "confirm-remove-sub");
    if (action === "confirm-remove-sub") { closeModal(); showToast("Sub status removed from the dummy workspace"); }
    if (action === "edit-purge") {
      const select = document.getElementById("opPurgeDays");
      select.disabled = false;
      document.querySelector(".opPurgeActions").hidden = false;
      trigger.hidden = true;
    }
    if (action === "cancel-purge") renderPurgeIntoPage();
    if (action === "save-purge") { showToast("Purge policy saved in the dummy workspace"); renderPurgeIntoPage(); }
    if (action === "create-document") openDocumentForm();
    if (action === "edit-document") openDocumentForm(Number(trigger.dataset.index));
    if (action === "preset-documents") openPresetDocuments();
    if (action === "delete-document") openSimpleConfirm("Delete Document", "The document will be removed from this dummy checklist.", "Delete", "confirm-delete-document");
    if (action === "confirm-delete-document") { closeModal(); showToast("Document removed from the dummy workspace"); }
    if (action === "sort") showToast("Table sorted in the dummy workspace");
    if (action === "page") {
      trigger.closest("div").querySelectorAll("button").forEach((button) => button.classList.remove("is-current"));
      trigger.classList.add("is-current");
      showToast(`Page ${trigger.dataset.page} selected`);
    }
    if (action === "reset-role") window.setTimeout(updateRoleForm, 0);
    if (action === "create-user" || action === "edit-user") {
      userWizardStep = 1;
      Object.keys(userDraft).forEach((key) => delete userDraft[key]);
      editingUserIndex = action === "edit-user" ? Number(trigger.dataset.index) : null;
      if (editingUserIndex != null) {
        const row = users[editingUserIndex];
        const names = row[0].split(" ");
        Object.assign(userDraft, {
          firstName: names.shift() || "",
          lastName: names.join(" "),
          email: row[1],
          phone1: "9876543210",
          username: row[1].split("@")[0],
          roleType: row[2] === "CUSTOMER" ? "Customer Role" : row[2] === "KAM" ? "View Role" : "Operational Role",
          role: row[2],
          branch: row[3],
          reportingTo: row[4],
        });
      }
      renderUserWizard(editingUserIndex != null);
    }
    if (action === "user-next") {
      const form = document.getElementById("opUserWizardForm");
      if (!form.reportValidity()) return;
      new FormData(form).forEach((value, key) => { userDraft[key] = value; });
      userWizardStep = 2;
      renderUserWizard(editingUserIndex != null);
    }
    if (action === "user-previous") { userWizardStep = 1; renderUserWizard(editingUserIndex != null); }
    if (action === "save-user") {
      const form = document.getElementById("opUserWizardForm");
      if (!form.reportValidity()) return;
      new FormData(form).forEach((value, key) => { userDraft[key] = value; });
      const nextRow = [
        `${userDraft.firstName || "New"} ${userDraft.lastName || "User"}`.trim(),
        userDraft.email || "new.user@testclient.example",
        userDraft.role || "AGENT",
        userDraft.branch || "Gurugram",
        userDraft.reportingTo || "-",
      ];
      if (editingUserIndex == null) users.unshift(nextRow);
      else users[editingUserIndex] = nextRow;
      closeModal();
      if (view === "create-user") {
        renderUserSetup();
        showToast(editingUserIndex == null ? "User created in the dummy workspace" : "User updated in the dummy workspace");
      }
    }
    if (action === "password-user") openModal({
      title: "Reset User Password",
      body: `<form id="opPasswordForm" class="opFormGrid">${input("NEW PASSWORD", "password", "password", true, "Enter new password")}${input("CONFIRM PASSWORD", "confirmPassword", "password", true, "Confirm new password")}</form>`,
      footer: `<button class="adminSecondary" data-op-action="close-modal">Cancel</button><button class="adminPrimary" type="submit" form="opPasswordForm">Update Password</button>`,
    });
    if (action === "suspend-user") openSimpleConfirm("Suspend User", "Suspend access for this user in the dummy workspace?", "Suspend", "confirm-suspend-user");
    if (action === "confirm-suspend-user") { closeModal(); showToast("User suspended in the dummy workspace"); }
    if (action === "delete-user") openSimpleConfirm("Delete User", "Remove this user from the dummy workspace?", "Delete", "confirm-delete-user");
    if (action === "confirm-delete-user") { closeModal(); showToast("User removed from the dummy workspace"); }
    if (action === "bulk-users") openBulkUserModal();
    if (action === "choose-user-file") document.getElementById("opUserFile")?.click();
    if (action === "start-import") { closeModal(); showToast("Dummy user import completed"); }
    if (action === "download-template" || action === "download-results" || action === "download-errors") downloadDummyFile(action);
  });

  const renderPurgeIntoPage = () => {
    const body = document.querySelector(".opWorkspaceBody");
    if (body) body.innerHTML = renderPurge();
  };
  const updateRoleForm = () => {
    const type = document.getElementById("opRoleType");
    const role = document.getElementById("opRoleName");
    const display = document.getElementById("opDisplayValue");
    const submit = document.getElementById("opRoleSubmit");
    if (!type || !role || !display || !submit) return;
    const roleOptions = {
      Admin: ["ADMIN"], "Support Role": ["MIS", "BACKEND", "PDC OPS", "PDC AGENT"],
      "Customer Role": ["CUSTOMER"], "View Role": ["CLIENT HO", "CLIENT CONTROLLER", "KAS", "KAM", "ACTION OWNER"],
      "Operational Role": ["SUPERVISOR", "MANAGER", "AGENT", "TELECALLER", "AGENTCUMMANAGER"],
    };
    const options = roleOptions[type.value] || [];
    role.disabled = !options.length;
    role.innerHTML = options.length ? `<option value="">Select Role</option>${options.map((option) => `<option>${escapeHtml(option)}</option>`).join("")}` : "<option>Select a Role Type first</option>";
    display.disabled = !options.length;
    if (!options.length) display.value = "";
    submit.disabled = !options.length || !display.value.trim();
  };
  const downloadDummyFile = (kind) => {
    const blob = new Blob([kind === "download-template" ? "First Name,Last Name,Email,Phone,Role,Branch\n" : "Status,Message\nComplete,Dummy download\n"], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = kind === "download-template" ? "User_Upload_Template.csv" : "user-upload-results.csv";
    link.click();
    URL.revokeObjectURL(link.href);
    showToast("Dummy file downloaded");
  };

  document.addEventListener("input", (event) => {
    if (event.target.id === "opUserSearch") { userQuery = event.target.value; renderUserRows(); }
    if (event.target.id === "opNotificationSearch") { notificationQuery = event.target.value; renderPreferenceRows(); }
    if (event.target.id === "opDisplayValue") updateRoleForm();
  });
  document.addEventListener("change", (event) => {
    if (event.target.id === "opUserRole") { userRole = event.target.value; renderUserRows(); }
    if (event.target.id === "opRoleType") updateRoleForm();
    if (event.target.id === "opWizardRoleType") {
      const role = document.getElementById("opWizardRole");
      const options = userRoleOptions[event.target.value] || [];
      userDraft.roleType = event.target.value;
      userDraft.role = "";
      if (role) {
        role.disabled = !options.length;
        role.innerHTML = `<option value="">${options.length ? "Select Role" : "Select a Role Type first"}</option>${userSelectOptions(options)}`;
      }
    }
    if (event.target.id === "opWizardRole") userDraft.role = event.target.value;
    if (event.target.id === "opWizardBranch") userDraft.branch = event.target.value;
    if (event.target.matches("[data-op-pref-index]")) {
      const row = event.target.closest("td");
      const state = row?.querySelector(".opWhatsAppState");
      if (state) state.textContent = event.target.checked ? "WhatsApp: On" : "WhatsApp: Off";
      showToast(`WhatsApp notifications ${event.target.checked ? "enabled" : "disabled"} in the dummy workspace`);
    }
    if (event.target.id === "opUserFile") {
      const file = event.target.files?.[0];
      const selected = document.getElementById("opSelectedFile");
      const start = document.getElementById("opStartImport");
      if (selected) {
        selected.hidden = !file;
        selected.innerHTML = file ? `<i class="bi bi-file-earmark-excel"></i><strong>${escapeHtml(file.name)}</strong><span>${Math.max(1, Math.round(file.size / 1024))} KB</span>` : "";
      }
      if (start) start.disabled = !file;
    }
  });
  document.addEventListener("submit", (event) => {
    if (!["opDocumentForm", "opBucketForm", "opSubStatusForm", "opPasswordForm", "opRoleForm"].includes(event.target.id)) return;
    event.preventDefault();
    if (event.target.id === "opDocumentForm") {
      const values = Object.fromEntries(new FormData(event.target));
      const row = [values.code, values.name, values.category, values.description || "-"];
      const index = event.target.dataset.documentIndex;
      if (index === "") documents.unshift(row);
      else documents[Number(index)] = row;
      closeModal();
      renderDocumentSetup();
      showToast(index === "" ? "Document created in the dummy workspace" : "Document updated in the dummy workspace");
      return;
    }
    closeModal();
    showToast(event.target.id === "opRoleForm" ? "Role display name saved" : "Changes saved in the dummy workspace");
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  render();
})();
