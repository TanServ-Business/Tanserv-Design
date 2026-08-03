/* Admin-only implementation of the Tanserv shared-header popup behaviours. */
(() => {
  "use strict";

  const popup = document.getElementById("adminPopup");
  const dialog = document.getElementById("adminModal");
  if (!popup || !dialog) return;

  const CONTACT_KEY = "ineburaAdminDirectory:v1";
  const NOTIFICATION_KEY = "ineburaAdminNotifications:v1";
  const defaultContacts = [
    { id: "c1", initials: "DM", name: "Devashish Manager", role: "Internal company contact", email: "devashish.manager@testclient.example" },
    { id: "c2", initials: "RA", name: "Rajneesh Agent", role: "Internal company contact", email: "rajneesh.agent@testclient.example" },
    { id: "c3", initials: "AP", name: "Anisha Pandey", role: "Customer contact", email: "anisha.pandey@testclient.example" },
    { id: "c4", initials: "AT", name: "admin TestClient", role: "Self", email: "admin@testclient.example" }
  ];
  const defaultNotifications = [
    { id: "n1", title: "Invoice upload completed", text: "22 of 24 dummy invoices were accepted.", time: "10 min ago", read: false },
    { id: "n2", title: "User setup updated", text: "A role-display configuration was changed.", time: "45 min ago", read: false },
    { id: "n3", title: "Documents in limbo", text: "3 dummy documents require a strategy.", time: "2 hr ago", read: false }
  ];

  const read = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || "null");
      return Array.isArray(value) ? value : fallback;
    } catch (_) {
      return fallback;
    }
  };
  let contacts = read(CONTACT_KEY, defaultContacts);
  let notifications = read(NOTIFICATION_KEY, defaultNotifications);
  let activePopup = "";

  const save = (key, value) => localStorage.setItem(key, JSON.stringify(value));
  const escapeHtml = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const notify = (message) => {
    const toast = document.getElementById("adminToast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  };

  const renderContacts = (query = "", filter = "all") => {
    const list = popup.querySelector("#adminHeaderDirectoryList");
    if (!list) return;
    const normalized = query.toLowerCase();
    const visible = contacts.filter((contact) => {
      const matchesQuery = !normalized || `${contact.name} ${contact.role} ${contact.email}`.toLowerCase().includes(normalized);
      const matchesFilter = filter === "all" || contact.role.toLowerCase().startsWith(filter);
      return matchesQuery && matchesFilter;
    });
    list.innerHTML = visible.length ? visible.map((contact) => `<article class="adminDirectoryContact"><span>${escapeHtml(contact.initials)}</span><div><strong>${escapeHtml(contact.name)}</strong><small>${escapeHtml(contact.role)}</small><a href="mailto:${escapeHtml(contact.email)}">${escapeHtml(contact.email)}</a></div></article>`).join("") : `<div class="adminDirectoryEmpty">No contacts match this view.</div>`;
  };

  const updateNotificationBadge = () => {
    const badge = document.getElementById("adminNotificationBadge");
    if (!badge) return;
    const unread = notifications.filter((item) => !item.read).length;
    badge.textContent = unread;
    badge.hidden = unread === 0;
  };

  const openClients = () => {
    popup.className = "adminPopup adminHeaderPopup adminClientPanel is-open";
    popup.innerHTML = `<header><div><strong>Clients</strong><small>1 client available</small></div></header><button class="adminHeaderClient is-active" data-header-action="select-client"><span>TC</span><div><strong>TestClient Pvt Ltd</strong><small>ADMIN workspace · Active</small></div><i class="bi bi-check-circle-fill"></i></button>`;
  };

  const openDirectory = () => {
    popup.className = "adminPopup adminHeaderPopup adminDirectoryPanel is-open";
    popup.innerHTML = `<header><div><strong>Directory</strong><small>TestClient contacts</small></div><button data-header-action="add-contact">Add contact</button></header><div class="adminDirectorySearch"><i class="bi bi-search"></i><input id="adminHeaderDirectorySearch" placeholder="Search contacts…" /></div><div class="adminDirectoryFilters"><button class="is-active" data-header-filter="all">All</button><button data-header-filter="customer">Customer contact</button><button data-header-filter="internal">Internal company contact</button></div><div id="adminHeaderDirectoryList" class="adminDirectoryList"></div>`;
    renderContacts();
  };

  const openNotifications = () => {
    popup.className = "adminPopup adminHeaderPopup adminNotificationPanel is-open";
    popup.innerHTML = `<header><div><strong>Notifications</strong><small>${notifications.filter((item) => !item.read).length} unread</small></div><button data-header-action="read-all">Read all</button></header><div class="adminHeaderNotificationList">${notifications.map((item) => `<button class="${item.read ? "is-read" : ""}" data-header-action="read-notification" data-id="${item.id}"><i class="bi bi-bell"></i><span><strong>${escapeHtml(item.title)}</strong><small>${escapeHtml(item.text)}</small><em>${escapeHtml(item.time)}</em></span></button>`).join("")}</div>`;
  };

  const openProfile = () => {
    popup.className = "adminPopup adminHeaderPopup adminProfilePanel is-open";
    popup.innerHTML = `<div class="adminProfileIdentity"><span>AT</span><div><strong>admin TestClient</strong><small>admin@testclient.example</small><em>ADMIN · TestClient Pvt Ltd</em></div></div><div class="adminProfileActions"><button data-header-action="account"><i class="bi bi-gear"></i>Account Settings</button><button data-header-action="tutorials"><i class="bi bi-mortarboard"></i>Tutorials</button><a href="admin.html?module=change-password"><i class="bi bi-key"></i>Change password</a><button class="is-danger" data-header-action="logout"><i class="bi bi-box-arrow-right"></i>Logout</button></div>`;
  };

  const closePopup = () => {
    popup.className = "adminPopup";
    popup.innerHTML = "";
    activePopup = "";
  };

  const openContactForm = () => {
    dialog.innerHTML = `<section class="adminModalCard adminRuntimeModal" role="dialog" aria-modal="true"><header><div><p>Directory</p><h2>Add customer contact</h2></div><button class="adminModalClose" data-header-action="close-dialog"><i class="bi bi-x-lg"></i></button></header><form id="adminHeaderContactForm" class="adminRecordForm"><label class="adminRuntimeField"><span>Contact Type *</span><select name="role" required><option>Customer contact</option><option>Internal company contact</option><option>Self</option></select></label><label class="adminRuntimeField"><span>First Name *</span><input name="firstName" required /></label><label class="adminRuntimeField"><span>Last Name *</span><input name="lastName" required /></label><label class="adminRuntimeField"><span>Email</span><input name="email" type="email" /></label><label class="adminRuntimeField"><span>Phone (Primary)</span><input name="phone" type="tel" /></label><label class="adminRuntimeField"><span>Department</span><input name="department" /></label></form><footer><button class="adminSecondary" data-header-action="close-dialog">Cancel</button><button class="adminPrimary" type="submit" form="adminHeaderContactForm">Save contact</button></footer></section>`;
    dialog.classList.add("is-open");
    dialog.setAttribute("aria-hidden", "false");
  };

  const closeDialog = () => {
    dialog.classList.remove("is-open");
    dialog.setAttribute("aria-hidden", "true");
    dialog.innerHTML = "";
  };

  document.addEventListener("click", (event) => {
    const popupTrigger = event.target.closest("[data-admin-popup]");
    if (popupTrigger) {
      const type = popupTrigger.dataset.adminPopup;
      if (activePopup === type && popup.classList.contains("is-open")) {
        closePopup();
        return;
      }
      activePopup = type;
      if (type === "directory") openDirectory();
      if (type === "notifications") openNotifications();
      if (type === "profile") openProfile();
      if (type === "clients") openClients();
      return;
    }

    const actionTrigger = event.target.closest("[data-header-action]");
    if (actionTrigger) {
      const action = actionTrigger.dataset.headerAction;
      if (action === "add-contact") openContactForm();
      if (action === "close-dialog") closeDialog();
      if (action === "read-all") {
        notifications = notifications.map((item) => ({ ...item, read: true }));
        save(NOTIFICATION_KEY, notifications);
        updateNotificationBadge();
        openNotifications();
        notify("All Admin notifications marked as read");
      }
      if (action === "read-notification") {
        notifications = notifications.map((item) => item.id === actionTrigger.dataset.id ? { ...item, read: true } : item);
        save(NOTIFICATION_KEY, notifications);
        updateNotificationBadge();
        openNotifications();
      }
      if (action === "account") notify("Admin account settings opened");
      if (action === "tutorials") notify("Admin tutorials opened");
      if (action === "logout") notify("Dummy logout acknowledged; this static prototype stays open");
      if (action === "select-client") notify("TestClient Admin workspace selected");
      return;
    }

    const filterTrigger = event.target.closest("[data-header-filter]");
    if (filterTrigger) {
      popup.querySelectorAll("[data-header-filter]").forEach((button) => button.classList.remove("is-active"));
      filterTrigger.classList.add("is-active");
      renderContacts(popup.querySelector("#adminHeaderDirectorySearch")?.value || "", filterTrigger.dataset.headerFilter);
      return;
    }

    if (activePopup && !event.target.closest("#adminPopup")) closePopup();
  });

  document.addEventListener("input", (event) => {
    if (event.target.id === "adminHeaderDirectorySearch") {
      renderContacts(event.target.value, popup.querySelector("[data-header-filter].is-active")?.dataset.headerFilter || "all");
    }
  });

  document.addEventListener("submit", (event) => {
    if (event.target.id !== "adminHeaderContactForm") return;
    event.preventDefault();
    const form = new FormData(event.target);
    const name = `${form.get("firstName")} ${form.get("lastName")}`.trim();
    contacts.push({ id: `contact-${Date.now()}`, initials: name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(), name, role: form.get("role"), email: form.get("email") || "no-email@testclient.example" });
    save(CONTACT_KEY, contacts);
    closeDialog();
    activePopup = "directory";
    openDirectory();
    notify("Dummy directory contact added");
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      closePopup();
      closeDialog();
    }
  });

  updateNotificationBadge();
})();
