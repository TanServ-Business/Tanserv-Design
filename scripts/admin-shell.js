/* Standalone Admin shell. This deliberately has no dependency on shared-header.js. */
(() => {
  "use strict";

  const root = document.body.dataset.rootPath || "../";
  const here = window.location.pathname;
  const adminPage = new URLSearchParams(window.location.search).get("module") || "dashboard";
  const pageUrl = (module) => `${root}pages/admin.html?module=${encodeURIComponent(module)}`;
  const dashboardUrl = pageUrl("dashboard");

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
      ["portfolio-transfer", "Portfolio Transfer"], ["bulk-document-upload", "Bulk Document Upload"], ["grn-upload", "GRN Upload"], ["cn-advance-upload", "CN/Advance Upload"], ["payment-receipt-upload", "Payment Receipt Upload"], ["customer-portfolio-transfer", "Customer Portfolio Transfer"]
    ] },
    { label: "Customers", icon: "bi-buildings", items: [
      ["group-master", "Group Master"], ["customer-master", "Customer Master"], ["customer-contacts", "Customer Contacts"]
    ] },
    { label: "Email Setup", icon: "bi-envelope", items: [
      ["template-master", "Template Master"], ["smtp-setup", "Email Sender SMTP Setup"], ["sender-account", "Email Sender Account Setup"]
    ] },
    { label: "", icon: "", items: [["strategy-manager", "Strategy Manager"]] },
    { label: "Invoice Master", icon: "bi-receipt", items: [
      ["invoice-master", "Invoice Master"]
    ] },
    { label: "", icon: "", items: [["change-password", "Change Password - Admin"], ["client-master", "Client Master"]] },
    { label: "Audit & Compliance", icon: "bi-shield-check", items: [
      ["audit-retention", "Audit Retention & Purge"], ["audit-trail", "Audit Trail"]
    ] },
    { label: "", icon: "", items: [["help-support", "Help & Support"]] }
  ];

  const navMarkup = groups.map((group, index) => {
    const invoiceAlias = ["invoice-upload", "invoice-reallocation", "invoice-deletion"].includes(adminPage);
    const active = group.items.some(([id]) => id === adminPage || (id === "invoice-master" && invoiceAlias));
    if (!group.label) return group.items.map(([id, label]) => `<li class="menu-item"><a href="${pageUrl(id)}" class="nav-link ${id === adminPage ? "active" : ""}"><span class="link-content">${label}</span></a></li>`).join("");
    return `<li class="menu-item adminNavGroup ${active ? "open" : ""}" data-group="${index}"><button class="nav-link adminNavToggle" type="button" aria-expanded="${active}"><span class="link-content">${group.label === "Audit & Compliance" ? `<i class="bi ${group.icon}"></i>` : ""}${group.label}</span><i class="bi bi-chevron-down chevron"></i></button><div class="submenu">${group.items.map(([id, label]) => `<a href="${pageUrl(id)}" class="submenu-link ${id === adminPage || (id === "invoice-master" && invoiceAlias) ? "active" : ""}">${label}</a>`).join("")}</div></li>`;
  }).join("");

  const shell = `<header class="shared-header adminSharedHeader"><div class="headerLeft"><div class="headerMenu"><button class="iconBtn menuBtn" type="button" id="adminMenuBtn" aria-label="Open menu"><i class="bi bi-list"></i></button></div><div class="brand"><a href="${dashboardUrl}"><img class="logoInebura" src="${root}assets/admin-reference/inebura-logo.png" alt="Inebura logo" /></a></div><div class="divider"></div><div class="relationship"><div class="relLogo"><img src="${root}assets/admin-reference/client-logo.jpg" alt="Client logo" /></div><strong class="adminRelationshipName">TestClient Pvt Ltd</strong></div></div><div class="headerRight"><a class="headerAppSwitch" href="${root}pages/Dashboard_Agent.html">go to user app</a><button class="iconBtn headerIconBtn" data-admin-popup="directory" aria-label="Directory"><i class="bi bi-journal-bookmark-fill"></i></button><button class="iconBtn headerIconBtn notificationBell" data-admin-popup="notifications" aria-label="Notifications"><span class="iconWrap"><i class="bi bi-bell-fill"></i><span class="badgeCount" id="adminNotificationBadge">2</span></span></button><button class="iconBtn headerIconBtn headerUserAvatarBtn" data-admin-popup="profile" aria-label="User"><span class="headerUserAvatar">AT</span></button></div></header><div class="sideNavOverlay" id="adminNavOverlay"><nav class="sideNav" id="adminSidenav" aria-label="Admin navigation"><div class="sideNavHeader"><div class="sideNavBrand"><span class="sideNavBrandIcon">I</span><span class="sideNavBrandName">Inebura</span></div><button class="iconBtn sideNavClose" type="button" id="adminCloseBtn" aria-label="Close menu"><i class="bi bi-x-lg"></i></button></div><ul class="nav-menu" role="menu">${navMarkup}</ul><div class="adminRoleCard"><span class="adminAvatar">U</span><div><strong>User</strong><small>ADMIN</small></div></div></nav></div><div class="adminPopup" id="adminPopup" role="dialog" aria-live="polite"></div><div class="adminModalBackdrop" id="adminModal" aria-hidden="true"></div><div class="adminToast" id="adminToast" role="status"></div>`;
  document.querySelectorAll("[data-admin-shell]").forEach((mount) => mount.insertAdjacentHTML("afterend", shell));


  const overlay = document.getElementById("adminNavOverlay");
  const setOpen = open => {
    overlay.classList.toggle("open", open);
    document.getElementById("adminMenuBtn").setAttribute("aria-expanded", String(open));
    document.getElementById(open ? "adminCloseBtn" : "adminMenuBtn").focus();
  };
  document.addEventListener("click", event => {
    if (event.target.closest("#adminMenuBtn")) setOpen(true);
    if (event.target.closest("#adminCloseBtn") || event.target === overlay) setOpen(false);
    const toggle = event.target.closest(".adminNavToggle");
    if (toggle) toggle.setAttribute("aria-expanded", String(toggle.closest(".adminNavGroup").classList.toggle("open")));
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && overlay.classList.contains("open")) setOpen(false);
  });
})();
