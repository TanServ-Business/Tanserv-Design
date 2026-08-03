/* Standalone Admin shell. This deliberately has no dependency on shared-header.js. */
(() => {
  "use strict";

  const root = document.body.dataset.rootPath || "../";
  const here = window.location.pathname;
  const adminPage = new URLSearchParams(window.location.search).get("module") || "branch-master";
  const pageUrl = (module) => `${root}pages/admin.html?module=${encodeURIComponent(module)}`;
  const dashboardUrl = `${root}pages/Dashboard_Admin.html`;

  const groups = [
    { label: "Master Setup", icon: "bi-sliders", items: [
      ["branch-master", "Branch Master"], ["holiday-master", "Holiday Master"], ["bank-master", "Bank Master"], ["internal-contacts", "Internal Company Contact"]
    ] },
    { label: "Operational Setup", icon: "bi-gear", items: [
      ["invoice-preferences", "Invoice Preferences"], ["document-setup", "Document Setup"], ["role-display", "Role and Display Name Setup"], ["user-setup", "User Setup"], ["notification-manager", "Notification Manager"]
    ] },
    { label: "Configuration", icon: "bi-toggles", items: [
      ["submission-process", "Invoice Submission process"], ["module-configuration", "Module Configuration"]
    ] },
    { label: "Bulk Upload", icon: "bi-cloud-arrow-up", items: [
      ["portfolio-transfer", "Portfolio Transfer"], ["bulk-document-upload", "Bulk Document Upload"], ["grn-upload", "GRN Upload"], ["cn-advance-upload", "CN/Advance Upload"], ["payment-receipt-upload", "Payment Receipt Upload"]
    ] },
    { label: "Customers", icon: "bi-buildings", items: [
      ["group-master", "Group Master"], ["customer-master", "Customer Master"], ["customer-contacts", "Customer Contacts"]
    ] },
    { label: "Email Setup", icon: "bi-envelope", items: [
      ["template-master", "Template Master"], ["smtp-setup", "Email Sender SMTP Setup"], ["sender-account", "Email Sender Account Setup"]
    ] },
    { label: "", icon: "", items: [["strategy-manager", "Strategy Manager"]] },
    { label: "Invoice Master", icon: "bi-receipt", items: [
      ["invoice-upload", "Invoice Upload"], ["invoice-reallocation", "Invoice reallocation"], ["invoice-deletion", "Invoice Deletion"]
    ] },
    { label: "", icon: "", items: [["change-password", "Change Password - Admin"], ["client-master", "Client Master"]] },
    { label: "Audit & Compliance", icon: "bi-shield-check", items: [
      ["audit-retention", "Audit Retention & Purge"], ["audit-trail", "Audit Trail"]
    ] },
    { label: "", icon: "", items: [["help-support", "Help & Support"]] }
  ];

  const specs = {
    "branch-master": ["Office Setup", "Manage your branch locations, holidays, bank details, and contacts.", "Branch Setup", ["Branch Code", "Branch Name", "Address", "Pincode", "City", "State", "Country", "Region"]],
    "holiday-master": ["Office Setup", "Manage your branch locations, holidays, bank details, and contacts.", "Holiday Master", ["Holiday Name", "State", "Holiday Date", "Actions"]],
    "bank-master": ["Office Setup", "Manage your branch locations, holidays, bank details, and contacts.", "Bank Master", ["Bank Name", "Created On", "Last Updated", "Actions"]],
    "internal-contacts": ["Office Setup", "Manage your branch locations, holidays, bank details, and contacts.", "Internal Company Contacts", ["Name", "Email", "Department", "Mobile No.", "Actions"]],
    "invoice-preferences": ["Invoice Setup", "Configure ageing buckets, activity dispositions, and data purge policies.", "Aging Bucket", ["Bucket Name", "From", "To", "Status", "Actions"], "settings"],
    "document-setup": ["Document Setup", "Manage your document checklist and templates.", "Documents List", ["Document Code", "Document Name", "Category", "Description", "Actions"]],
    "role-display": ["Role and Display Name Setup", "Configure organization hierarchy and role names.", "Organisation Hierarchy", ["Operational Role", "Display Name", "Reports To", "Status", "Actions"], "settings"],
    "user-setup": ["User Setup", "Manage user accounts and bulk creation.", "Team Members", ["Name", "Email", "Role", "Branch", "Reporting To", "Actions"], "tabs"],
    "notification-manager": ["Notification Manager", "Configure and manage your notification settings and user preferences.", "User Preferences", ["Name", "Phone Number", "Email ID", "WhatsApp Declaration", "Status"], "settings"],
    "submission-process": ["Invoice Submission Process", "Configure how documents (invoices, reports) are shared with customers.", "Invoice Submission Processes", ["Status", "Strategy Name", "Apply On", "Strategy Type", "Selected Documents", "Actions"], "tabs"],
    "module-configuration": ["Module Configuration", "Configure your modules below.", "Configurations", ["Module", "Configuration", "Updated By", "Last Updated", "Actions"], "settings"],
    "portfolio-transfer": ["Bulk Uploads (AR Transactions)", "Upload monthend confirmations, GRNs, payments, and other documents.", "Portfolio Transfer", ["Company", "Status", "Upload Date", "Total", "Success", "Rejected", "Progress", "Actions"], "upload"],
    "bulk-document-upload": ["Bulk Uploads (AR Transactions)", "Upload monthend confirmations, GRNs, payments, and other documents.", "Bulk Document Upload", ["Company", "Status", "Upload Date", "Total", "Success", "Rejected", "Progress", "Actions"], "upload"],
    "grn-upload": ["Bulk Uploads (AR Transactions)", "Upload monthend confirmations, GRNs, payments, and other documents.", "GRN Upload", ["Company", "Status", "Upload Date", "Total", "Success", "Rejected", "Progress", "Actions"], "upload"],
    "cn-advance-upload": ["Bulk Uploads (AR Transactions)", "Upload monthend confirmations, GRNs, payments, and other documents.", "CN/Advance Upload", ["Company", "Status", "Upload Date", "Total", "Success", "Rejected", "Progress", "Actions"], "upload"],
    "payment-receipt-upload": ["Bulk Uploads (AR Transactions)", "Upload monthend confirmations, GRNs, payments, and other documents.", "Payment Receipt Upload", ["Company", "Status", "Upload Date", "Total", "Success", "Rejected", "Progress", "Actions"], "upload"],
    "group-master": ["Customer Onboarding", "Manage customer master, contacts and groups.", "Group Master", ["Group Name", "Customer Count", "Created On", "Actions"]],
    "customer-master": ["Customer Onboarding", "Manage customer master, contacts and groups.", "Customer Master", ["Customer Code", "Customer Name", "Customer PAN", "Agent", "Manager", "KAM", "KAS", "Actions"], "tabs"],
    "customer-contacts": ["Customer Onboarding", "Manage customer master, contacts and groups.", "Customer Contacts", ["Name", "Email", "Phone", "Customer", "Actions"]],
    "template-master": ["Communication Setup", "Configure SMTP, email accounts, and templates.", "Template Master", ["Event Type", "Recipient Role", "Comm. Mode", "Code", "Subject", "Schedule", "Actions"], "tabs"],
    "smtp-setup": ["Communication Setup", "Configure SMTP, email accounts, and templates.", "Email Sender SMTP Setup", ["SMTP Name", "Host", "Port", "Username", "Status", "Actions"], "settings"],
    "sender-account": ["Communication Setup", "Configure SMTP, email accounts, and templates.", "Email Sender Account Setup", ["Account Name", "Account Type", "Sender Email", "SMTP", "Status", "Actions"], "settings"],
    "strategy-manager": ["Manage collection strategies", "Configure strategy-level targets first, then attach template-driven reminder logic.", "Strategies", ["Strategy Name", "Status", "Target", "Selected Records", "Templates", "Created By", "Actions"], "tabs"],
    "invoice-upload": ["Invoice Master", "Upload, reallocate, and manage invoices.", "Invoice Upload", ["Company", "Status", "Upload Date", "Total", "Success", "Rejected", "Progress", "Actions"], "upload"],
    "invoice-reallocation": ["Invoice Master", "Upload, reallocate, and manage invoices.", "Invoice Reallocation", ["Customer Code", "Customer Name", "Invoice No", "Invoice Value", "Outstanding", "Assignee", "Manager", "Actions"]],
    "invoice-deletion": ["Invoice Master", "Upload, reallocate, and manage invoices.", "Invoice Deletion", ["Invoice No", "Customer", "Invoice Date", "Invoice Value", "Reason", "Actions"]],
    "change-password": ["Admin Change Password", "Reset or update user passwords administratively.", "Update User Password", ["User", "Role", "Branch", "Last Updated", "Actions"], "settings"],
    "client-master": ["Client Master", "Manage client accounts, text setups, and subscriptions.", "Client Accounts", ["Client", "Subscription", "Admin", "Created On", "Status", "Actions"]],
    "audit-retention": ["Audit Retention & Purge", "Set the duration for retaining immutable audit records.", "Retention Policy", ["Entity Type", "Retention Period", "Last Updated", "Updated By", "Actions"], "settings"],
    "audit-trail": ["Audit Trail", "Immutable record of who changed what, when, and from where — across all audited entities.", "Audit Events", ["Timestamp", "Action", "Record Id", "Changed By", "Source IP", "Revision"]],
    "help-support": ["Help Center", "How can we help you?", "Frequently Asked", ["Topic", "Category", "Read Time", "Status"]]
  };

  const navMarkup = groups.map((group, index) => {
    const active = group.items.some(([id]) => id === adminPage);
    if (!group.label) return group.items.map(([id, label]) => `<li class="menu-item"><a href="${pageUrl(id)}" class="nav-link ${id === adminPage ? "active" : ""}"><span class="link-content"><i class="bi bi-dot"></i>${label}</span></a></li>`).join("");
    return `<li class="menu-item adminNavGroup ${active ? "open" : ""}" data-group="${index}"><button class="nav-link adminNavToggle" type="button" aria-expanded="${active}"><span class="link-content"><i class="bi ${group.icon}"></i>${group.label}</span><i class="bi bi-chevron-down chevron"></i></button><div class="submenu">${group.items.map(([id, label]) => `<a href="${pageUrl(id)}" class="submenu-link ${id === adminPage ? "active" : ""}">${label}</a>`).join("")}</div></li>`;
  }).join("");

  const shell = `<header class="shared-header adminSharedHeader"><div class="headerLeft"><div class="headerMenu"><button class="iconBtn menuBtn" type="button" id="adminMenuBtn" aria-label="Open menu"><i class="bi bi-list"></i></button></div><div class="brand"><a href="${dashboardUrl}"><img class="logoInebura" src="${root}assets/logo.png" alt="Inebura logo" /></a></div><div class="divider"></div><div class="relationship"><div class="relLogo">TC</div><strong class="adminRelationshipName">TestClient Pvt Ltd</strong></div></div><div class="headerRight"><button class="iconBtn headerIconBtn" data-admin-popup="clients" aria-label="Clients"><i class="bi bi-buildings-fill"></i></button><button class="iconBtn headerIconBtn" data-admin-popup="directory" aria-label="Directory"><i class="bi bi-journal-bookmark-fill"></i></button><button class="iconBtn headerIconBtn notificationBell" data-admin-popup="notifications" aria-label="Notifications"><span class="iconWrap"><i class="bi bi-bell-fill"></i><span class="badgeCount" id="adminNotificationBadge">3</span></span></button><button class="iconBtn headerIconBtn headerUserAvatarBtn" data-admin-popup="profile" aria-label="User"><span class="headerUserAvatar">AT</span></button></div></header><div class="sideNavOverlay" id="adminNavOverlay"><nav class="sideNav" id="adminSidenav" aria-label="Admin navigation"><div class="sideNavHeader"><div class="sideNavBrand"><span class="sideNavBrandIcon">I</span><span class="sideNavBrandName">Inebura</span></div><button class="iconBtn sideNavClose" type="button" id="adminCloseBtn" aria-label="Close menu"><i class="bi bi-x-lg"></i></button></div><ul class="nav-menu" role="menu"><li class="menu-item"><a href="${dashboardUrl}" class="nav-link ${here.endsWith("Dashboard_Admin.html") ? "active" : ""}"><span class="link-content"><i class="bi bi-speedometer2"></i>Dashboard</span></a></li>${navMarkup}</ul><div class="adminRoleCard"><span class="adminAvatar">AT</span><div><strong>admin TestClient</strong><small>ADMIN</small></div></div></nav></div><div class="adminPopup" id="adminPopup" role="dialog" aria-live="polite"></div><div class="adminModalBackdrop" id="adminModal" aria-hidden="true"></div><div class="adminToast" id="adminToast" role="status"></div>`;
  document.querySelectorAll("[data-admin-shell]").forEach((mount) => mount.insertAdjacentHTML("afterend", shell));

  const sampleRows = (columns) => ["TestClient Pvt Ltd", "North Region", "Active", "admin TestClient", "30 Jul 2026", "Configured"].map((fallback, rowIndex) => {
    const cells = columns.map((column, colIndex) => {
      if (column === "Actions") return `<button class="adminTableAction" data-admin-action="edit" aria-label="Edit ${fallback}"><i class="bi bi-pencil-square"></i> Edit</button>`;
      if (column === "Status") return `<span class="adminStatus ${rowIndex % 2 ? "muted" : ""}">${rowIndex % 2 ? "Draft" : "Active"}</span>`;
      if (column === "Progress") return `<span class="adminProgress"><i style="width:${80 - rowIndex * 9}%"></i></span>`;
      return [fallback, "Gurugram", "Active", "admin TestClient", "29 Jul 2026", "Ready"][Math.min(colIndex, 5)];
    });
    return `<tr>${cells.map(cell => `<td>${cell}</td>`).join("")}</tr>`;
  }).join("");

  const modalFieldsFor = (module, columns) => {
    if (module === "branch-master") return [["GST Number", "Enter GST Number"], ["Branch Code", "Enter Branch Code"], ["Branch Name", "Enter Branch Name"], ["Address Line 1", "Address Line 1"], ["Address Line 2", "Address Line 2"], ["Address Line 3", "Address Line 3"], ["Pincode", "Enter Pincode"], ["City", "City"], ["State", "State"], ["Country", "Country"], ["Region", "Region"]];
    if (module === "change-password") return [["Select User", "Choose a dummy user"], ["New Password", "Enter new password"], ["Confirm Password", "Confirm new password"]];
    if (module === "audit-retention") return [["Entity Type", "Select entity type"], ["Retention Period (months)", "Enter retention period"]];
    return columns.filter(column => !["Actions", "Status", "Progress", "Created On", "Last Updated"].includes(column)).slice(0, 6).map(column => [column, `Enter ${column}`]);
  };

  const renderPage = () => {
    const target = document.getElementById("adminPageContent");
    if (!target) return;
    const [title, description, tableTitle, columns, mode = "list"] = specs[adminPage] || specs["branch-master"];
    const tabs = mode === "tabs" ? `<div class="adminTabs" role="tablist"><button class="is-active" data-admin-tab="${tableTitle}">${tableTitle}</button><button data-admin-tab="Setup">Setup</button><button data-admin-tab="History">History</button></div>` : "";
    const upload = mode === "upload" ? `<section class="adminUploadCard"><button class="adminUploadZone" type="button" data-admin-action="browse"><i class="bi bi-cloud-arrow-up"></i><strong>Drop your file here or browse</strong><span id="adminUploadHint">Excel / CSV template · Dummy interaction only</span></button><input id="adminFileInput" type="file" accept=".csv,.xlsx,.xls" hidden /><div class="adminUploadActions"><button class="adminSecondary" data-toast="Dummy import template prepared"><i class="bi bi-download"></i> Download Template</button><button class="adminSecondary" data-toast="Upload history opened"><i class="bi bi-clock-history"></i> Upload History</button></div></section>` : "";
    const settings = mode === "settings" ? `<section class="adminSettings"><div><label>Default setting</label><select><option>Enabled</option><option>Disabled</option></select></div><div><label>Configuration value</label><input placeholder="Enter a value" /></div><button class="adminPrimary" data-toast="Saved to the visual shell only">Save changes</button></section>` : "";
    const auditFilters = adminPage === "audit-trail" ? `<div class="adminFilters"><select><option>Entity Type</option><option>Invoice</option><option>Customer</option></select><input placeholder="Record Id" /><input placeholder="Changed by" /><button class="adminSecondary" data-toast="Dummy audit filter applied">Search</button><button class="adminSecondary" data-toast="CSV export is represented only">Export CSV</button></div>` : "";
    const help = adminPage === "help-support" ? `<div class="adminHelp"><input placeholder="Search Invoice upload, User access, Documents in limbo" /><button class="adminPrimary" data-toast="Ticket form opened">Create Ticket</button><div class="adminFaq"><article><b>How to upload a new invoice</b><span>Invoice & Billing · 4 min read</span></article><article><b>What happens when an invoice enters Limbo?</b><span>Issue Tracker · 2 min read</span></article><article><b>How to reset a user password</b><span>User Setup · 2 min read</span></article></div></div>` : "";
    target.innerHTML = `<main class="adminPage" data-admin-module="${adminPage}"><section class="adminPageHero"><div><p>${title}</p><h1>${title}</h1><span>${description}</span></div><button class="adminPrimary" data-admin-action="create"><i class="bi bi-plus-lg"></i> Create New</button></section>${tabs}${upload}${settings}${auditFilters}${help}<section class="adminPanel"><div class="adminPanelHeader"><div><h2>${tableTitle}</h2><span>Representative data for the Admin design shell</span></div><div><input class="adminSearch" placeholder="Search" /><button class="adminSecondary" data-admin-action="filter"><i class="bi bi-funnel"></i> Filter</button></div></div><div class="adminTableWrap"><table class="adminTable"><thead><tr>${columns.map(c => `<th data-admin-action="sort">${c}<i class="bi bi-arrow-down-up"></i></th>`).join("")}</tr></thead><tbody>${sampleRows(columns)}</tbody></table></div><footer class="adminPager"><span>Showing 1–6 of 24</span><div><button disabled>Previous</button><button class="is-current" data-admin-action="page">1</button><button data-admin-action="page">2</button><button data-admin-action="page">Next</button></div></footer></section></main>`;
  };

  renderPage();

  const navOverlay = document.getElementById("adminNavOverlay");
  const toast = document.getElementById("adminToast");
  const showToast = (message) => { toast.textContent = message; toast.classList.add("is-visible"); window.setTimeout(() => toast.classList.remove("is-visible"), 2400); };
  const openForm = (mode) => {
    const modal = document.getElementById("adminModal");
    const [, , tableTitle, columns] = specs[adminPage] || specs["branch-master"];
    const fields = modalFieldsFor(adminPage, columns);
    const isEdit = mode === "edit";
    modal.innerHTML = `<section class="adminModalCard" role="dialog" aria-modal="true" aria-label="${isEdit ? "Edit" : "Create"} ${tableTitle}"><header><div><p>${isEdit ? "Update record" : "New record"}</p><h2>${isEdit ? "Edit" : "Create"} ${tableTitle}</h2></div><button type="button" class="adminModalClose" data-admin-action="close-modal" aria-label="Close modal"><i class="bi bi-x-lg"></i></button></header><form id="adminRecordForm" class="adminRecordForm">${fields.map(([label, placeholder], index) => `<label>${label}${index < 2 ? " *" : ""}<input ${index < 2 ? "required" : ""} placeholder="${placeholder}" value="${isEdit && index === 0 ? "TestClient " + label : ""}" /></label>`).join("")}</form><footer><button type="button" class="adminSecondary" data-admin-action="close-modal">Cancel</button><button type="submit" form="adminRecordForm" class="adminPrimary">${isEdit ? "Update" : "Save"}</button></footer></section>`;
    modal.classList.add("is-open"); modal.setAttribute("aria-hidden", "false");
  };
  const closeForm = () => { const modal = document.getElementById("adminModal"); modal.classList.remove("is-open"); modal.setAttribute("aria-hidden", "true"); modal.innerHTML = ""; };
  const addDummyRecord = () => {
    const tbody = document.querySelector(".adminTable tbody");
    const cells = document.querySelectorAll(".adminTable th");
    if (!tbody || !cells.length) return;
    const values = Array.from(cells).map((header, index) => header.textContent.replace(/\s+/g, " ").trim().replace("arrow-down-up", "") === "Actions" ? `<button class="adminTableAction" data-admin-action="edit"><i class="bi bi-pencil-square"></i> Edit</button>` : index === 0 ? "New TestClient Record" : index === 1 ? "Configured today" : "Active");
    tbody.insertAdjacentHTML("afterbegin", `<tr>${values.map(value => `<td>${value}</td>`).join("")}</tr>`);
  };
  document.addEventListener("click", (event) => {
    const toggle = event.target.closest(".adminNavToggle");
    if (toggle) { const group = toggle.closest(".adminNavGroup"); group.classList.toggle("open"); toggle.setAttribute("aria-expanded", group.classList.contains("open")); }
    if (event.target.closest("#adminMenuBtn")) navOverlay.classList.add("open");
    if (event.target.closest("#adminCloseBtn") || event.target === navOverlay) navOverlay.classList.remove("open");
    const adminAction = event.target.closest("[data-admin-action]");
    if (adminAction) {
      const action = adminAction.dataset.adminAction;
      if (action === "create" || action === "edit") openForm(action);
      if (action === "close-modal") closeForm();
      if (action === "browse") document.getElementById("adminFileInput")?.click();
      if (action === "filter") showToast("Filter controls are ready for this dummy Admin table");
      if (action === "sort") showToast("Sorted in the Admin shell");
      if (action === "page") { document.querySelectorAll(".adminPager button").forEach(button => button.classList.remove("is-current")); adminAction.classList.add("is-current"); showToast("Dummy page changed"); }
    }
    const tab = event.target.closest("[data-admin-tab]");
    if (tab) { document.querySelectorAll("[data-admin-tab]").forEach(button => button.classList.remove("is-active")); tab.classList.add("is-active"); showToast(`${tab.dataset.adminTab} selected`); }
    const trigger = event.target.closest("[data-toast]"); if (trigger) showToast(trigger.dataset.toast);
    const popupTrigger = event.target.closest("[data-admin-popup]");
    if (popupTrigger) { const popup = document.getElementById("adminPopup"); const type = popupTrigger.dataset.adminPopup; popup.innerHTML = type === "notifications" ? `<strong>Notifications</strong><p>3 admin workflow updates need attention.</p><button data-toast="All notifications marked as read">Mark all as read</button>` : type === "directory" ? `<strong>Directory</strong><p>Search and contact internal users from this Admin shell.</p><input placeholder="Search directory" />` : `<strong>admin TestClient</strong><p>ADMIN · TestClient Pvt Ltd</p><button data-toast="Profile shell opened">View profile</button>`; popup.classList.toggle("is-open"); }
  });
  document.addEventListener("submit", (event) => {
    if (event.target.id !== "adminRecordForm") return;
    event.preventDefault(); addDummyRecord(); closeForm(); showToast("Saved to this dummy Admin workspace");
  });
  document.addEventListener("change", (event) => {
    if (event.target.id !== "adminFileInput") return;
    const file = event.target.files?.[0];
    if (!file) return;
    const hint = document.getElementById("adminUploadHint");
    if (hint) hint.textContent = `${file.name} selected · 24 dummy records ready to import`;
    showToast("Dummy upload accepted — no file left your device");
  });
})();
