/* Admin-only implementation of the Tanserv shared-header popup behaviours. */
(() => {
  "use strict";

  const popup = document.getElementById("adminPopup");
  const dialog = document.getElementById("adminModal");
  if (!popup || !dialog) return;

  const CONTACT_KEY = "ineburaAdminDirectory:v1";
  const NOTIFICATION_KEY = "ineburaAdminNotifications:v1";
  const defaultContacts = [
    { id: "c1", initials: "DM", name: "Devashish Manager", role: "Internal company contact", customer: "TestClient Pvt Ltd", phone: "+91 98765 43210", email: "devashish.manager@testclient.example" },
    { id: "c2", initials: "RA", name: "Rajneesh Agent", role: "Internal company contact", customer: "TestClient Pvt Ltd", phone: "+91 98765 43211", email: "rajneesh.agent@testclient.example" },
    { id: "c3", initials: "AP", name: "Anisha Pandey", role: "Customer contact", customer: "Apex Retail Ltd", phone: "+91 98765 43212", email: "anisha.pandey@testclient.example" },
    { id: "c4", initials: "AT", name: "admin TestClient", role: "Self", customer: "TestClient Pvt Ltd", phone: "+91 98765 43213", email: "admin@testclient.example" }
  ];
  const defaultNotifications = [
    { id: "n1", title: "Notification", text: "Client Confirmation sample upload applied nothing — the sample row was rejected. The cycle remains unconfirmed.", time: "9/4/2026, 5:40:03 PM", read: false },
    { id: "n2", title: "Notification", text: "Client Confirmation sample upload applied nothing — two sample rows were rejected. The cycle remains unconfirmed.", time: "8/18/2026, 2:29:21 PM", read: false }
  ];

  const read = (key, fallback) => {
    try {
      const value = JSON.parse(window.IneburaAdminPreviewStorage?.getItem(key) || "null");
      return Array.isArray(value) ? value : fallback;
    } catch (_) {
      return fallback;
    }
  };
  let contacts = read(CONTACT_KEY, defaultContacts);
  let notifications = read(NOTIFICATION_KEY, defaultNotifications);
  let activePopup = "";

  const save = (key, value) => window.IneburaAdminPreviewStorage?.setItem(key, JSON.stringify(value));
  const escapeHtml = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
  const notify = (message) => {
    const toast = document.getElementById("adminToast");
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 2200);
  };

  const renderContacts = (query = "", filter = "all") => {
    const list = dialog.querySelector("#adminHeaderDirectoryList");
    if (!list) return;
    const normalized = query.toLowerCase();
    const visible = contacts.filter((contact) => {
      const matchesQuery = !normalized || `${contact.name} ${contact.role} ${contact.customer} ${contact.phone} ${contact.email}`.toLowerCase().includes(normalized);
      const matchesFilter = filter === "all" || contact.role.toLowerCase().startsWith(filter);
      return matchesQuery && matchesFilter;
    });
    list.innerHTML = visible.length ? visible.map((contact) => `<article class="adminDirectoryContact"><span>${escapeHtml(contact.initials)}</span><div><strong>${escapeHtml(contact.name)}</strong><small>${escapeHtml(contact.role)} · ${escapeHtml(contact.customer || "TestClient Pvt Ltd")}</small><span><i class="bi bi-telephone"></i>${escapeHtml(contact.phone || "—")}</span><a href="mailto:${escapeHtml(contact.email)}"><i class="bi bi-envelope"></i>${escapeHtml(contact.email)}</a></div></article>`).join("") : `<div class="adminDirectoryEmpty">No contacts match this view.</div>`;
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
    closePopup();
    activePopup = "directory";
    dialog.innerHTML = `<section class="adminModalCard adminDirectoryDialog" role="dialog" aria-modal="true" aria-labelledby="adminDirectoryTitle"><header><div><h2 id="adminDirectoryTitle">Directory</h2><small>TestClient contacts</small></div><div><button class="adminSecondary" data-header-action="add-contact"><i class="bi bi-plus"></i>Add Contact</button><button class="adminModalClose" data-header-action="close-dialog" aria-label="Close Directory"><i class="bi bi-x-lg"></i></button></div></header><div class="adminDirectoryBody"><nav class="adminDirectoryAlphabet" aria-label="Filter directory alphabet"><button class="is-active" data-directory-letter="">ALL</button>${"ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(letter=>`<button data-directory-letter="${letter}">${letter}</button>`).join("")}</nav><div class="adminDirectoryContent"><div class="adminDirectorySearch"><i class="bi bi-search"></i><input id="adminHeaderDirectorySearch" placeholder="Search contacts..." aria-label="Search contacts" /></div><div class="adminDirectoryFilters"><button class="is-active" data-header-filter="all">All</button><button data-header-filter="customer">Customer</button><button data-header-filter="internal">Internal</button><button data-header-filter="others">Others</button></div><div id="adminHeaderDirectoryList" class="adminDirectoryList"></div></div></div></section>`;
    dialog.classList.add("is-open");
    dialog.setAttribute("aria-hidden", "false");
    renderContacts();
  };

  const openNotifications = () => {
    popup.className = "adminPopup adminHeaderPopup adminNotificationPanel is-open";
    popup.innerHTML = `<header><strong>Notifications</strong></header><div class="adminHeaderNotificationList">${notifications.length ? notifications.map(item=>`<button class="${item.read?'is-read':''}" data-header-action="read-notification" data-id="${escapeHtml(item.id)}"><i class="bi bi-bell-fill"></i><span><strong>${escapeHtml(item.title)}</strong><em>${escapeHtml(item.time)}</em><small>${escapeHtml(item.text)}</small></span></button>`).join(""):'<div class="adminDirectoryEmpty">No notifications yet</div>'}</div>`;
  };

  const openProfile = () => {
    popup.className = "adminPopup adminHeaderPopup adminProfilePanel is-open";
    popup.innerHTML = `<div class="adminProfileIdentity"><span>AT</span><div><strong>admin TestClient</strong><small>admin@testclient.example</small><em>ADMIN · TestClient Pvt Ltd</em></div></div><div class="adminProfileActions"><button data-header-action="account"><i class="bi bi-gear"></i>Account Settings</button><a href="admin.html?module=change-password&view=self"><i class="bi bi-key"></i>Change password</a><button class="is-danger" data-header-action="logout"><i class="bi bi-box-arrow-right"></i>Logout</button></div>`;
  };

  const closePopup = () => {
    popup.className = "adminPopup";
    popup.innerHTML = "";
    activePopup = "";
  };

  const openContactForm = () => {
    const input=(name,label,type="text",required=false,placeholder="")=>`<label class="adminRuntimeField"><span>${label}${required?' *':''}</span><input name="${name}" type="${type}" placeholder="${placeholder}" ${required?'required':''}></label>`;
    const departments=window.IneburaAdminModules["internal-contacts"].create.fields.find(f=>f.key==="department")?.options||[];
    dialog.innerHTML=`<section class="adminModalCard adminRuntimeModal" role="dialog" aria-modal="true"><header><h2>Add Contact</h2><button class="adminModalClose" data-header-action="close-dialog" aria-label="Close modal"><i class="bi bi-x-lg"></i></button></header><form id="adminHeaderContactForm" class="adminRecordForm"><label class="adminRuntimeField"><span>Contact Type</span><select name="role"><option>Customer</option><option>Internal</option><option>Others</option></select></label><label class="adminRuntimeField" id="directoryCustomerField"><span>Select Customer *</span><select name="customer" required><option value="">Select Customer</option><option>Apex Retail Ltd</option><option>Bluebird Manufacturing</option></select></label>${input('firstName','First Name','text',true)}${input('lastName','Last Name','text',true)}<label class="adminRuntimeField"><span>Full Name</span><input name="fullName" disabled></label>${input('email','Email','email',true)}${input('phone','Phone (Primary)','tel',true)}${input('secondaryPhone','Phone (Secondary)','tel')}<label class="adminRuntimeField"><span>Gender</span><select name="gender"><option value="">Select</option><option>Male</option><option>Female</option><option>Others</option></select></label><label class="adminRuntimeField"><span>Department</span><select name="department"><option value="">Select</option>${departments.map(d=>`<option>${escapeHtml(typeof d==="object"?d.label:d)}</option>`).join('')}</select></label><label class="adminCheckField"><input type="checkbox" name="communication" checked><span>Use Email for Communication</span></label></form><footer><button class="adminSecondary" data-header-action="close-dialog">Cancel</button><button class="adminPrimary" type="submit" form="adminHeaderContactForm">Save Contact</button></footer></section>`;
    dialog.classList.add("is-open");
    dialog.setAttribute("aria-hidden", "false");
  };

  const closeDialog = () => {
    dialog.classList.remove("is-open");
    dialog.setAttribute("aria-hidden", "true");
    dialog.innerHTML = "";
    if (activePopup === "directory") activePopup = "";
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
      if (action === "logout") notify("Dummy logout acknowledged; this static prototype stays open");
      if (action === "select-client") notify("TestClient Admin workspace selected");
      return;
    }

    const filterTrigger = event.target.closest("[data-header-filter]");
    if (filterTrigger) {
      dialog.querySelectorAll("[data-header-filter]").forEach((button) => button.classList.remove("is-active"));
      filterTrigger.classList.add("is-active");
      renderContacts(dialog.querySelector("#adminHeaderDirectorySearch")?.value || "", filterTrigger.dataset.headerFilter);
      return;
    }

    const letterTrigger = event.target.closest("[data-directory-letter]");
    if (letterTrigger) {
      dialog.querySelectorAll("[data-directory-letter]").forEach((button) => button.classList.toggle("is-active", button === letterTrigger));
      const input = dialog.querySelector("#adminHeaderDirectorySearch");
      if (input) input.value = letterTrigger.dataset.directoryLetter || "";
      renderContacts(input?.value || "", dialog.querySelector("[data-header-filter].is-active")?.dataset.headerFilter || "all");
      return;
    }

    if (activePopup && !event.target.closest("#adminPopup")) closePopup();
  });

  document.addEventListener("change", event=>{if(event.target.form?.id==="adminHeaderContactForm"&&event.target.name==="role"){const field=document.getElementById("directoryCustomerField");field.hidden=event.target.value!=="Customer";field.querySelector("select").required=!field.hidden;}});
  document.addEventListener("input", (event) => {
    if(event.target.form?.id==="adminHeaderContactForm"){const form=event.target.form;form.elements.fullName.value=`${form.elements.firstName.value} ${form.elements.lastName.value}`.trim();}
    if (event.target.id === "adminHeaderDirectorySearch") {
      renderContacts(event.target.value, dialog.querySelector("[data-header-filter].is-active")?.dataset.headerFilter || "all");
    }
  });

  document.addEventListener("submit", (event) => {
    if (event.target.id !== "adminHeaderContactForm") return;
    event.preventDefault();
    const form = new FormData(event.target);
    const name = `${form.get("firstName")} ${form.get("lastName")}`.trim();
    contacts.push({ id: `contact-${Date.now()}`, initials: name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase(), name, role: form.get("role"), customer: form.get("customer") || "TestClient Pvt Ltd", phone: form.get("phone") || "—", email: form.get("email") || "no-email@testclient.example" });
    save(CONTACT_KEY, contacts);
    closeDialog();
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
