(() => {
  const mount = document.querySelector("[data-shared-header]");
  if (!mount) return;

  // Keep native browser right-click menu available across pages.
  document.addEventListener(
    "contextmenu",
    (event) => {
      event.stopPropagation();
    },
    true
  );

  const rawRootPath = (document.body.dataset.rootPath || "").trim();
  const rootPath = rawRootPath && !rawRootPath.endsWith("/") ? `${rawRootPath}/` : rawRootPath;

  const escapeHtml = (value) =>
    String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");

  const resolvePath = (path) => {
    if (!path) return "";
    if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("/")) return path;
    const cleaned = path.replace(/^\.\//, "");
    return `${rootPath}${cleaned}`;
  };

  const relationshipBadge = document.body.dataset.relationshipBadge || "IN";
  const relationshipLogoAlt =
    document.body.dataset.relationshipLogoAlt ||
    (document.body.dataset.relationshipName
      ? `${document.body.dataset.relationshipName} logo`
      : "Relationship logo");
  const relationshipLogoSrc = resolvePath(document.body.dataset.relationshipLogoSrc || "");

  const relationshipLogoMarkup = relationshipLogoSrc
    ? `<img src="${relationshipLogoSrc}" alt="${escapeHtml(relationshipLogoAlt)}" />`
    : escapeHtml(relationshipBadge);

  const getDashboardPath = () => {
    const explicit = (document.body.dataset.dashboardPath || "").trim();
    if (explicit) return explicit;

    const role = (localStorage.getItem("activeUserRole") || "").trim().toLowerCase();
    const roleDashboards = {
      agent: "pages/Dashboard_Agent.html",
      customer: "pages/Dashboard_Customer.html",
      manager: "pages/LPmanager.html",
      supervisor: "pages/Dashboard_Supervisor.html",
      kam: "pages/KAM.html",
      kas: "pages/KAS.html",
      backend: "pages/LPbackend.html",
      mis: "pages/LPmis.html",
      approver: "bin/IssueTracker/approver-dashboard.html"
    };

    return roleDashboards[role] || "pages/Dashboard_Agent.html";
  };
  const dashboardPath = resolvePath(getDashboardPath());

  const hasEmailPanel = Boolean(document.getElementById("emailPanel"));
  const emailActionMarkup = hasEmailPanel
    ? `
          <button class="userPopupAction" type="button" id="userPopupEmailBtn">
            <i class="bi bi-envelope-paper" aria-hidden="true"></i>
            <span>Email Communication</span>
          </button>
        `
    : "";

  const headerMarkup = `
<header class="shared-header">
  <div class="headerLeft">
    <div class="headerMenu">
      <button class="iconBtn menuBtn" type="button" id="headerMenuBtn" aria-label="Open menu">
        <i class="bi bi-list" aria-hidden="true"></i>
      </button>
    </div>
    <div class="brand"><a href="${dashboardPath}">
      <img class="logoInebura" src="${resolvePath("assets/logo.png")}" alt="Inebura logo" /></a>
    </div>

    <div class="divider"></div>

    <div class="relationship">
      <div class="relLogo" id="relationshipLogo">
        ${relationshipLogoMarkup}
      </div>
    </div>
  </div>

  <div class="headerRight">
    <div class="headerPopupWrap" id="clientPickerWrap">
      <button class="iconBtn headerIconBtn" type="button" id="clientPickerBtn" aria-label="Clients" aria-haspopup="dialog" aria-expanded="false">
        <i class="bi bi-building" aria-hidden="true"></i>
      </button>
      <div class="headerPopup hidden" id="clientPickerPopup" role="dialog" aria-label="Clients">
        <div class="headerPopupHeader">Clients</div>
        <div class="headerPopupList" id="clientPickerList"></div>
      </div>
    </div>

    <div class="headerPopupWrap" id="directoryWrap">
      <button class="iconBtn headerIconBtn" type="button" id="directoryBtn" aria-label="Directory" aria-haspopup="dialog" aria-expanded="false">
        <i class="bi bi-journal-bookmark-fill" aria-hidden="true"></i>
      </button>
      <div class="headerPopup directoryPopup hidden" id="directoryPopup" role="dialog" aria-label="Directory">
        <div class="directoryHeaderRow">
          <div class="headerPopupHeader">Directory</div>
          <div class="directoryHeaderActions">
            <button class="directoryAddBtn directoryAddCta" type="button" id="directoryAddContactBtn">Add contact</button>
            <button class="iconBtn directoryCloseBtn" type="button" id="directoryCloseBtn" aria-label="Close directory">
              <i class="bi bi-x-lg" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <div class="directoryListView" id="directoryListView">
          <div class="directorySearchRow">
            <i class="bi bi-search" aria-hidden="true"></i>
            <input type="text" id="directorySearch" placeholder="Search contacts..." aria-label="Search directory" />
          </div>
          <div class="directoryFilters" role="group" aria-label="Directory filters">
            <button class="pill pillFilter pillActive" type="button" data-directory-filter="all" aria-pressed="true">All</button>
            <button class="pill pillFilter" type="button" data-directory-filter="customer" aria-pressed="false">Customer contact</button>
            <button class="pill pillFilter" type="button" data-directory-filter="internal" aria-pressed="false">Internal company contact</button>
          </div>
          <div class="directoryBody">
            <div class="directoryList" id="directoryList"></div>
            <div class="directoryAlphabet" id="directoryAlphabet" aria-label="Directory alphabet"></div>
          </div>
        </div>
        <div class="directoryFormView hidden" id="directoryFormView">
          <div class="directoryFormBackdrop" aria-hidden="true"></div>
          <div class="directoryFormCard" role="dialog" aria-label="Add customer contact">
            <div class="directoryFormTitle">Add customer contact</div>
            <form id="directoryContactForm" class="directoryFormFields">
              <div>
                <label for="directoryContactType" class="form-label">Contact Type</label>
                <select class="form-select" id="directoryContactType">
                  <option value="customer">Customer contact</option>
                  <option value="internal">Internal company contact</option>
                  <option value="self">Self</option>
                </select>
              </div>
              <div class="directoryContactSearchRow hidden" id="directoryContactSearchRow">
                <label for="directoryContactCompanySearch" class="form-label">Search customer/company</label>
                <div class="directorySearchRow">
                  <i class="bi bi-search" aria-hidden="true"></i>
                  <input
                    type="text"
                    id="directoryContactCompanySearch"
                    placeholder="Search customers or companies..."
                    list="directoryContactCompanyList"
                    aria-label="Search customers or companies"
                  />
                </div>
                <datalist id="directoryContactCompanyList"></datalist>
              </div>
              <div>
                <label for="directoryContactFirstName" class="form-label">First Name</label>
                <input type="text" class="form-control" id="directoryContactFirstName" placeholder="First name" required />
              </div>
              <div>
                <label for="directoryContactLastName" class="form-label">Last Name</label>
                <input type="text" class="form-control" id="directoryContactLastName" placeholder="Last name" required />
              </div>
              <div>
                <label for="directoryContactEmail" class="form-label">Email</label>
                <input type="email" class="form-control" id="directoryContactEmail" placeholder="name@company.com" />
              </div>
              <div>
                <label for="directoryContactPhonePrimary" class="form-label">Phone (Primary)</label>
                <input type="text" class="form-control" id="directoryContactPhonePrimary" placeholder="+91 ..." />
              </div>
              <div>
                <label for="directoryContactPhoneSecondary" class="form-label">Phone (Secondary)</label>
                <input type="text" class="form-control" id="directoryContactPhoneSecondary" placeholder="+91 ..." />
              </div>
              <div>
                <label for="directoryContactGender" class="form-label">Gender</label>
                <select class="form-select" id="directoryContactGender">
                  <option value="">Select</option>
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>
              <div>
                <label for="directoryContactDepartment" class="form-label">Department</label>
                <input type="text" class="form-control" id="directoryContactDepartment" placeholder="Department" />
              </div>
              <div class="form-check">
                <input class="form-check-input" type="checkbox" id="directoryContactUseEmail" />
                <label class="form-check-label" for="directoryContactUseEmail">Use Email for Communication</label>
              </div>
            </form>
            <div class="directoryFormActions">
              <button type="button" class="btn btn-outline-secondary" id="directoryFormCancelBtn">Cancel</button>
              <button type="button" class="btn btn-primary" id="directoryFormSaveBtn">Save contact</button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="notificationBellWrap">
      <button class="iconBtn headerIconBtn notificationBell" type="button" id="notificationBellBtn" aria-label="Notifications">
        <span class="iconWrap">
          <i class="bi bi-bell-fill" aria-hidden="true"></i>
          <span class="badgeCount hidden" id="notificationBellCount">0</span>
        </span>
      </button>
      <div class="notificationPopup hidden" id="notificationPopup" role="dialog" aria-label="Notifications">
        <div class="notificationPopupHeader">
          <span>Notifications</span>
          <div class="notificationHeaderActions">
            <button class="notificationHeaderBtn" type="button" id="notificationReadAllBtn">Read all</button>
            <button class="notificationExpandBtn" type="button" id="notificationExpandBtn" aria-label="Expand notifications">
              <i class="bi bi-arrows-angle-expand" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <div class="notificationPopupList" id="notificationPopupList"></div>
      </div>
    </div>
    <div class="headerPopupWrap" id="userPopupWrap">
      <button class="iconBtn headerIconBtn headerUserAvatarBtn" type="button" id="headerUserBtn" aria-label="User" aria-haspopup="dialog" aria-expanded="false">
        <span class="headerUserAvatar" id="headerUserAvatar">US</span>
      </button>
      <div class="headerPopup userPopup hidden" id="userPopup" role="dialog" aria-label="User profile">
        <div class="userPopupHeader">
          <div class="userAvatar" id="userPopupAvatar">US</div>
          <div class="userPopupIdentity">
            <div class="userPopupName" id="userPopupName">User</div>
            <div class="userPopupEmail" id="userPopupEmail">user@example.com</div>
            <div class="userPopupMeta">
              <span id="userPopupLoginId">-</span>
              <span class="userPopupDot">|</span>
              <span id="userPopupRoleValue">Agent</span>
            </div>
          </div>
          <button class="userPopupEdit" type="button" data-user-update aria-label="Update info">
            <i class="bi bi-pencil-square" aria-hidden="true"></i>
          </button>
        </div>
        <div class="userPopupActions">
          <button class="userPopupAction" type="button" data-user-update>
            <i class="bi bi-gear" aria-hidden="true"></i>
            <span>Account Settings</span>
          </button>
          ${emailActionMarkup}
          <button class="userPopupAction" type="button">
            <i class="bi bi-key" aria-hidden="true"></i>
            <span>Change password</span>
          </button>
          <button class="userPopupAction userPopupLogout" type="button">
            <i class="bi bi-box-arrow-right" aria-hidden="true"></i>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</header>

<div class="sideNavOverlay" id="sideNavOverlay" aria-hidden="true">
  <nav class="sideNav" id="sideNav" aria-label="Main">
    <div class="sideNavHeader">
      <div class="sideNavBrand">
        <span class="sideNavBrandIcon">I</span>
        <span class="sideNavBrandName">Inebura</span>
      </div>
      <button class="iconBtn sideNavClose" type="button" id="sideNavClose" aria-label="Close menu">
        <i class="bi bi-x-lg" aria-hidden="true"></i>
      </button>
    </div>
    <ul class="nav-menu" role="menu">
      <li class="menu-item">
        <a class="nav-link" href="#" data-toggle="submenu" aria-expanded="false">
          <span class="link-content">
            <i class="bi bi-geo-alt" aria-hidden="true"></i>
            <span>Visit</span>
          </span>
          <i class="bi bi-chevron-down chevron" aria-hidden="true"></i>
        </a>
        <div class="submenu">
          <a class="submenu-link" href="${resolvePath("pages/visitmodule.html")}" data-module="visit">Visit Module</a>
          <a class="submenu-link" href="${resolvePath("pages/visitmoduleReview.html")}" data-module="visit-review">Visit Module Review</a>
        </div>
      </li>
      <li class="menu-item">
        <a class="nav-link" href="#" data-toggle="submenu" aria-expanded="false">
          <span class="link-content">
            <i class="bi bi-window" aria-hidden="true"></i>
            <span>Landing</span>
          </span>
          <i class="bi bi-chevron-down chevron" aria-hidden="true"></i>
        </a>
        <div class="submenu">
          <a class="submenu-link" href="${resolvePath("LPagent.html")}" data-module="landing">Landing Page</a>
          <a class="submenu-link" href="${resolvePath("LPagent.html")}" data-module="landing-agent">Landing Page - Agent</a>
          <a class="submenu-link" href="${resolvePath("pages/LPmanager.html")}" data-module="landing-manager">Landing Page - Manager</a>
          <a class="submenu-link" href="${resolvePath("pages/dashManager.html")}" data-module="landing-manager-drilldown">Landing Page - Manager Drilldown</a>
          <a class="submenu-link" href="${resolvePath("pages/LPsupervisor.html")}" data-module="landing-supervisor">Landing Page - Supervisor</a>
          <a class="submenu-link" href="${resolvePath("pages/KAM.html")}" data-module="landing-kam">Landing Page - KAM</a>
          <a class="submenu-link" href="${resolvePath("pages/KAS.html")}" data-module="landing-kas">Landing Page - KAS</a>
          <a class="submenu-link" href="${resolvePath("pages/LPbackend.html")}" data-module="landing-backend">Landing Page - Backend</a>
          <a class="submenu-link" href="${resolvePath("pages/LPmis.html")}" data-module="landing-mis">Landing Page - MIS</a>
        </div>
      </li>
      <li class="menu-item">
        <a class="nav-link" href="#" data-toggle="submenu" aria-expanded="false">
          <span class="link-content">
            <i class="bi bi-speedometer2" aria-hidden="true"></i>
            <span>Dashboards</span>
          </span>
          <i class="bi bi-chevron-down chevron" aria-hidden="true"></i>
        </a>
        <div class="submenu">
          <a class="submenu-link" href="${resolvePath("pages/Dashboard_Agent.html")}" data-module="dashboard-agent">Dashboard - Agent</a>
          <a class="submenu-link" href="${resolvePath("pages/Dashboard_Customer.html")}" data-module="dashboard-customer">Dashboard - Customer</a>
          <a class="submenu-link" href="${resolvePath("pages/dashManager.html")}" data-module="dashboard-manager">Dashboard - Manager</a>
          <a class="submenu-link" href="${resolvePath("pages/Dashboard_Supervisor.html")}" data-module="dashboard-supervisor">Dashboard - Supervisor</a>
        </div>
      </li>
      <li class="menu-item">
        <a class="nav-link" href="#" data-toggle="submenu" aria-expanded="false">
          <span class="link-content">
            <i class="bi bi-kanban" aria-hidden="true"></i>
            <span>Issue Tracker</span>
          </span>
          <i class="bi bi-chevron-down chevron" aria-hidden="true"></i>
        </a>
        <div class="submenu">
          <a class="submenu-link" href="${resolvePath("pages/issuetrackerLP.html")}" data-module="issue-tracker">Issue Tracker</a>
          <a class="submenu-link" href="${resolvePath("bin/IssueTracker/escalationMatrix.html")}" data-module="issue-matrix">Escalation Matrix</a>
          <a class="submenu-link" href="${resolvePath("bin/IssueTracker/approver-dashboard.html")}" data-module="issue-approver">Approver Dashboard</a>
          <a class="submenu-link" href="${resolvePath("bin/IssueTracker/approval-request.html")}" data-module="issue-approval-request">Approval Request</a>
        </div>
      </li>
      <li class="menu-item">
        <a class="nav-link" href="#" data-toggle="submenu" aria-expanded="false">
          <span class="link-content">
            <i class="bi bi-cash-stack" aria-hidden="true"></i>
            <span>AR Transactions</span>
          </span>
          <i class="bi bi-chevron-down chevron" aria-hidden="true"></i>
        </a>
        <div class="submenu">
          <a class="submenu-link" href="${resolvePath("pages/submission.html")}" data-module="submission-module">Submission Module</a>
        </div>
      </li>
      <li class="menu-item">
        <a class="nav-link" href="#" data-toggle="submenu" aria-expanded="false">
          <span class="link-content">
            <i class="bi bi-credit-card-2-back" aria-hidden="true"></i>
            <span>PDC</span>
          </span>
          <i class="bi bi-chevron-down chevron" aria-hidden="true"></i>
        </a>
        <div class="submenu">
          <a class="submenu-link" href="${resolvePath("pages/PDCagent.html")}" data-module="pdc-agent">PDC Module - Agent</a>
          <a class="submenu-link" href="${resolvePath("pages/PDCOps.html")}" data-module="pdc-ops">PDC Module - Ops</a>
        </div>
      </li>
      <li class="menu-item">
        <a class="nav-link" href="#" data-toggle="submenu" aria-expanded="false">
          <span class="link-content">
            <i class="bi bi-clipboard-check" aria-hidden="true"></i>
            <span>Commitment</span>
          </span>
          <i class="bi bi-chevron-down chevron" aria-hidden="true"></i>
        </a>
        <div class="submenu">
          <a class="submenu-link" href="${resolvePath("pages/commitment.html")}" data-module="commitment-agent">Commitment - Agent</a>
          <a class="submenu-link" href="${resolvePath("pages/CommitmentManager.html")}" data-module="commitment-manager">Commitment - Manager</a>
        </div>
      </li>
    </ul>
  </nav>
</div>
`;

  const container = document.createElement("div");
  container.innerHTML = headerMarkup.trim();
  const fragment = document.createDocumentFragment();
  while (container.firstChild) {
    fragment.appendChild(container.firstChild);
  }
  mount.replaceWith(fragment);

  const initSharedHeader = () => {
    if (typeof window.wireHeaderPopupEvents === "function") return;

    const hasPdcScript = Array.from(document.scripts).some((script) => (
      /(?:^|\/)pdc\.js(?:\?|$)/i.test(script.src || "")
    ));

    const tenantBrandMap = {
      apollo: { name: "Apollo", badge: "AP", logo: "assets/apollo-tyres-logo.svg" },
      bikanerwala: { name: "Bikanerwala", badge: "BK" },
      global_ar: { name: "Global AR", badge: "GA" }
    };

    const internalContacts = [
      { name: "Rohit Mehra", email: "rohit.mehra@inebura.com", phone: "-" },
      { name: "Mukesh Mishra", email: "mukesh.mishra@inebura.com", phone: "-" },
      { name: "Ops Supervisor", email: "supervisor@inebura.com", phone: "-" },
      { name: "Escalations Desk", email: "escalations@inebura.com", phone: "-" }
    ];

    const getDefaultTenantId = () => {
      const ids = Object.keys(tenantBrandMap);
      return ids.length > 0 ? ids[0] : "";
    };

    const applyTenantBrand = (tenantId) => {
      const relationshipLogo = document.getElementById("relationshipLogo");
      const storedId = localStorage.getItem("activeTenantId");
      const resolvedId = tenantBrandMap[tenantId]
        ? tenantId
        : (tenantBrandMap[storedId] ? storedId : getDefaultTenantId());

      const brand = tenantBrandMap[resolvedId];
      if (!brand) return;

      if (relationshipLogo) {
        relationshipLogo.innerHTML = "";
        if (brand.logo) {
          const img = document.createElement("img");
          img.src = resolvePath(brand.logo);
          img.alt = `${brand.name} logo`;
          relationshipLogo.appendChild(img);
        } else {
          relationshipLogo.textContent = brand.badge;
        }
      }
      localStorage.setItem("activeTenantId", resolvedId);

      const list = document.getElementById("clientPickerList");
      if (list) {
        list.querySelectorAll("[data-client-id]").forEach((item) => {
          const isActive = item.getAttribute("data-client-id") === resolvedId;
          item.classList.toggle("active", isActive);
          item.setAttribute("aria-pressed", isActive ? "true" : "false");
        });
      }
    };

    const renderClientPicker = () => {
      const list = document.getElementById("clientPickerList");
      if (!list) return;
      list.innerHTML = "";
      Object.entries(tenantBrandMap).forEach(([id, brand]) => {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "headerPopupItem";
        button.setAttribute("data-client-id", id);
        button.setAttribute("aria-pressed", "false");

        const name = document.createElement("span");
        name.textContent = brand.name;

        const badge = document.createElement("span");
        badge.className = "clientBadge";
        badge.textContent = brand.badge;

        button.appendChild(name);
        button.appendChild(badge);
        list.appendChild(button);
      });
    };

    const renderDirectoryList = () => {
      const list = document.getElementById("directoryList");
      if (!list) return;
      list.innerHTML = "";
      internalContacts.forEach((entry) => {
        const row = document.createElement("div");
        row.className = "directoryEntry";
        const body = document.createElement("div");
        const title = document.createElement("div");
        title.className = "directoryName";
        title.textContent = entry.name;
        const meta = document.createElement("div");
        meta.className = "directoryMeta";
        meta.textContent = `Email: ${entry.email || "-"} | Phone: ${entry.phone || "-"}`;
        const tag = document.createElement("span");
        tag.className = "directoryTag tagInternal";
        tag.textContent = "Internal";
        body.appendChild(title);
        body.appendChild(meta);
        row.appendChild(body);
        row.appendChild(tag);
        list.appendChild(row);
      });
    };

    const closePopup = (popup, button) => {
      if (!popup) return;
      popup.classList.add("hidden");
      if (button) button.setAttribute("aria-expanded", "false");
    };

    const openPopup = (popup, button) => {
      if (!popup) return;
      popup.classList.remove("hidden");
      if (button) button.setAttribute("aria-expanded", "true");
    };

    const closeHeaderPopups = (exceptPopup) => {
      const clientPopup = document.getElementById("clientPickerPopup");
      const clientBtn = document.getElementById("clientPickerBtn");
      if (clientPopup && clientPopup !== exceptPopup) closePopup(clientPopup, clientBtn);

      const directoryPopup = document.getElementById("directoryPopup");
      const directoryBtn = document.getElementById("directoryBtn");
      if (directoryPopup && directoryPopup !== exceptPopup) closePopup(directoryPopup, directoryBtn);
    };

    const wireHeaderPopups = () => {
      const clientBtn = document.getElementById("clientPickerBtn");
      const clientPopup = document.getElementById("clientPickerPopup");
      const clientWrap = document.getElementById("clientPickerWrap");

      const directoryBtn = document.getElementById("directoryBtn");
      const directoryPopup = document.getElementById("directoryPopup");
      const directoryWrap = document.getElementById("directoryWrap");
      const directoryCloseBtn = document.getElementById("directoryCloseBtn");

      if (clientBtn) {
        clientBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          const shouldOpen = clientPopup && clientPopup.classList.contains("hidden");
          if (shouldOpen) {
            closeHeaderPopups(clientPopup);
            openPopup(clientPopup, clientBtn);
          } else {
            closePopup(clientPopup, clientBtn);
          }
        });
      }

      if (clientPopup) {
        clientPopup.addEventListener("click", (event) => {
          const item = event.target.closest("[data-client-id]");
          if (!item) return;
          applyTenantBrand(item.getAttribute("data-client-id"));
          closePopup(clientPopup, clientBtn);
        });
      }

      if (directoryBtn) {
        directoryBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          closeHeaderPopups(directoryPopup);
          openPopup(directoryPopup, directoryBtn);
        });
      }
      if (directoryCloseBtn) {
        directoryCloseBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          closePopup(directoryPopup, directoryBtn);
        });
      }

      document.addEventListener("click", (event) => {
        if (clientPopup && !clientPopup.classList.contains("hidden")) {
          if (!clientWrap || !clientWrap.contains(event.target)) {
            closePopup(clientPopup, clientBtn);
          }
        }
        if (directoryPopup && !directoryPopup.classList.contains("hidden")) {
          if (!directoryWrap || !directoryWrap.contains(event.target)) {
            closePopup(directoryPopup, directoryBtn);
          }
        }
      });
    };

    const renderUserPopup = () => {
      const stored = localStorage.getItem("userProfile");
      let profile = {};
      if (stored) {
        try {
          profile = JSON.parse(stored);
        } catch (err) {
          profile = {};
        }
      }
      const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "User";
      const initials = fullName.split(/\s+/).map(part => part[0]).join("").slice(0, 2).toUpperCase();

      const avatar = document.getElementById("userPopupAvatar");
      const headerAvatar = document.getElementById("headerUserAvatar");
      const nameEl = document.getElementById("userPopupName");
      const emailEl = document.getElementById("userPopupEmail");
      const loginEl = document.getElementById("userPopupLoginId");
      const roleEl = document.getElementById("userPopupRoleValue");

      if (avatar) avatar.textContent = initials || "US";
      if (headerAvatar) headerAvatar.textContent = initials || "US";
      if (nameEl) nameEl.textContent = fullName;
      if (emailEl) emailEl.textContent = profile.email || "user@example.com";
      if (loginEl) loginEl.textContent = profile.loginId || "-";
      if (roleEl) roleEl.textContent = profile.role || "Agent";
    };

    const wireUserPopup = () => {
      const userBtn = document.getElementById("headerUserBtn");
      const userPopup = document.getElementById("userPopup");
      const userWrap = document.getElementById("userPopupWrap");
      const emailBtn = document.getElementById("userPopupEmailBtn");

      if (userBtn && userPopup) {
        userBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          const shouldOpen = userPopup.classList.contains("hidden");
          if (shouldOpen) {
            renderUserPopup();
            userPopup.classList.remove("hidden");
            userBtn.setAttribute("aria-expanded", "true");
            closeHeaderPopups();
          } else {
            userPopup.classList.add("hidden");
            userBtn.setAttribute("aria-expanded", "false");
          }
        });
      }

      document.addEventListener("click", (event) => {
        if (!userPopup || userPopup.classList.contains("hidden")) return;
        if (userWrap && userWrap.contains(event.target)) return;
        userPopup.classList.add("hidden");
        if (userBtn) userBtn.setAttribute("aria-expanded", "false");
      });

      if (emailBtn) {
        emailBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          if (typeof window.openEmailPanel === "function") {
            window.openEmailPanel("");
          }
          if (userPopup) {
            userPopup.classList.add("hidden");
            if (userBtn) userBtn.setAttribute("aria-expanded", "false");
          }
        });
      }
    };

    const wireSideNav = () => {
      const menuBtn = document.getElementById("headerMenuBtn");
      const overlay = document.getElementById("sideNavOverlay");
      const closeBtn = document.getElementById("sideNavClose");
      const sideNav = document.getElementById("sideNav");

      const openSideNav = () => {
        if (!overlay) return;
        overlay.classList.add("open");
        overlay.setAttribute("aria-hidden", "false");
      };

      const closeSideNav = () => {
        if (!overlay) return;
        overlay.classList.remove("open");
        overlay.setAttribute("aria-hidden", "true");
      };

      if (menuBtn) menuBtn.addEventListener("click", openSideNav);
      if (closeBtn) closeBtn.addEventListener("click", closeSideNav);
      if (overlay) {
        overlay.addEventListener("click", (event) => {
          if (event.target === overlay) closeSideNav();
        });
      }
      if (sideNav) {
        sideNav.addEventListener("click", (event) => {
          const toggle = event.target.closest(".nav-link[data-toggle=\"submenu\"]");
          if (toggle) {
            event.preventDefault();
            const menuItem = toggle.closest(".menu-item");
            if (!menuItem) return;
            const isOpen = menuItem.classList.toggle("open");
            toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
            return;
          }

          const item = event.target.closest(".nav-link[data-module], .submenu-link[data-module]");
          if (!item) return;
          const moduleKey = item.getAttribute("data-module");
          if (!moduleKey) return;
          const destinations = {
            visit: "pages/visitmodule.html",
            "visit-review": "pages/visitmoduleReview.html",
            landing: "LPagent.html",
            "landing-agent": "LPagent.html",
            "landing-manager": "pages/LPmanager.html",
            "landing-manager-drilldown": "pages/dashManager.html",
            "landing-supervisor": "pages/LPsupervisor.html",
            "landing-kam": "pages/KAM.html",
            "landing-kas": "pages/KAS.html",
            "landing-backend": "pages/LPbackend.html",
            "landing-mis": "pages/LPmis.html",
            "dashboard-agent": "pages/Dashboard_Agent.html",
            "dashboard-customer": "pages/Dashboard_Customer.html",
            "dashboard-manager": "pages/dashManager.html",
            "dashboard-supervisor": "pages/Dashboard_Supervisor.html",
            "issue-tracker": "pages/issuetrackerLP.html",
            "issue-matrix": "bin/IssueTracker/escalationMatrix.html",
            "issue-approver": "bin/IssueTracker/approver-dashboard.html",
            "issue-approval-request": "bin/IssueTracker/approval-request.html",
            "submission-module": "pages/submission.html",
            "pdc-agent": "pages/PDCagent.html",
            "pdc-ops": "pages/PDCOps.html",
            "commitment-agent": "pages/commitment.html",
            "commitment-manager": "pages/CommitmentManager.html"
          };
          const target = destinations[moduleKey];
          if (target) {
            event.preventDefault();
            window.location.href = resolvePath(target);
          }
        });
      }
    };

    const initNotifications = () => {
      if (hasPdcScript) return;

      const notificationCenterKey = "ineburaNotificationCenter";
      const notificationBellBtn = document.getElementById("notificationBellBtn");
      const notificationBellCount = document.getElementById("notificationBellCount");
      const notificationPopup = document.getElementById("notificationPopup");
      const notificationList = document.getElementById("notificationPopupList");
      const notificationExpandBtn = document.getElementById("notificationExpandBtn");
      const notificationReadAllBtn = document.getElementById("notificationReadAllBtn");
      const commitmentSubmitKey = "ineburaCommitmentSubmissions";
      const commitmentSeenKey = "ineburaCommitmentStatusSeen";

      const loadNotifications = () => {
        const stored = localStorage.getItem(notificationCenterKey);
        if (!stored) return [];
        try {
          const parsed = JSON.parse(stored);
          return Array.isArray(parsed) ? parsed : [];
        } catch (err) {
          return [];
        }
      };

      const formatCurrency = (value) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return "-";
        return `Rs. ${numeric.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      };

      const buildCommitmentDetails = (note) => {
        const rows = [
          ["Invoice No", note.invoiceNo],
          ["Customer", note.customerName],
          ["Week", note.week],
          ["Committed Amount", formatCurrency(note.targetAmount)]
        ];
        const content = rows.filter(([, value]) => value && value !== "-");
        if (!content.length) return "";
        return `
          <div class="notificationDetails">
            <table class="notificationDetailTable">
              <tbody>
                ${content.map(([label, value]) => (
                  `<tr>
                    <th>${escapeHtml(label)}</th>
                    <td>${escapeHtml(String(value))}</td>
                  </tr>`
                )).join("")}
              </tbody>
            </table>
          </div>
        `;
      };

      const updateCommitmentNotifications = () => {
        const agentName = localStorage.getItem("activeUserName") || "";
        if (!agentName) return;
        let submissions = [];
        try {
          const raw = localStorage.getItem(commitmentSubmitKey);
          submissions = raw ? JSON.parse(raw) : [];
        } catch (err) {
          submissions = [];
        }
        if (!Array.isArray(submissions) || submissions.length === 0) return;

        const items = submissions.flatMap((submission) => submission.items || []);
        const agentItems = items.filter((item) => (item.agentName || "") === agentName);
        if (!agentItems.length) return;

        let seen = {};
        try {
          const rawSeen = localStorage.getItem(commitmentSeenKey);
          seen = rawSeen ? JSON.parse(rawSeen) : {};
        } catch (err) {
          seen = {};
        }
        if (!seen || typeof seen !== "object") seen = {};

        const notifications = loadNotifications();
        let changed = false;
        agentItems.forEach((item) => {
          const status = String(item.approvalStatus || "pending").toLowerCase();
          if (status !== "approved" && status !== "rejected") return;
          if (seen[item.invoiceNo] === status) return;
          const statusLabel = status === "rejected" ? "rejected" : "approved";
          notifications.unshift({
            type: "commitment",
            status,
            title: status === "approved" ? "Commitment Approved" : "Commitment Rejected",
            message: `${item.customerName || "Customer"} commitment ${statusLabel} for ${item.invoiceNo || "-"}.`,
            invoiceNo: item.invoiceNo || "",
            customerName: item.customerName || "",
            week: item.week || "",
            targetAmount: item.targetAmount || 0,
            createdAt: new Date().toLocaleString(),
            read: false
          });
          seen[item.invoiceNo] = status;
          changed = true;
        });
        if (changed) {
          localStorage.setItem(notificationCenterKey, JSON.stringify(notifications));
          localStorage.setItem(commitmentSeenKey, JSON.stringify(seen));
        }
      };

      const updateNotificationBadge = () => {
        if (!notificationBellCount) return;
        const unreadCount = loadNotifications().filter(note => !note.read).length;
        notificationBellCount.textContent = String(unreadCount);
        notificationBellCount.classList.toggle("hidden", unreadCount === 0);
        if (notificationReadAllBtn) notificationReadAllBtn.disabled = unreadCount === 0;
      };

      const renderNotificationPopup = () => {
        if (!notificationList) return;
        const notes = loadNotifications();
        if (notes.length === 0) {
          notificationList.innerHTML = "<div class=\"notificationEmpty\">No notifications yet.</div>";
          return;
        }
        notificationList.innerHTML = notes.map((note, index) => {
          const markButton = note.read
            ? ""
            : `<button class=\"notificationMarkBtn\" type=\"button\" data-note-index=\"${index}\">Mark as read</button>`;
          const isCommitment = note.type === "commitment";
          const status = String(note.status || "").toLowerCase();
          const statusLabel = status === "rejected" ? "rejected" : "approved";
          const commitmentMessage = `${note.customerName || "Customer"} commitment ${statusLabel} for ${note.invoiceNo || "-"}`;
          const cardMessage = isCommitment ? commitmentMessage : (note.message || "-");
          const pill = isCommitment ? `<span class=\"notificationTag tag-commitment\">Commitment</span>` : "";
          const details = isCommitment ? buildCommitmentDetails(note) : "";
          return (
            `<div class=\"notificationCard${note.read ? " isRead" : ""}\">
              <div class=\"notificationCardHeader\">
                <div class=\"notificationTitle\">${escapeHtml(note.title || "Update")}</div>
                <div class=\"notificationMetaRight\">
                  ${pill}
                  <div class=\"notificationTime\">${escapeHtml(note.createdAt || "-")}</div>
                  ${markButton}
                </div>
              </div>
              <div class=\"notificationCardBody\">${escapeHtml(cardMessage)}</div>
              ${details}
            </div>`
          );
        }).join("");
      };

      const toggleNotificationPopup = (forceOpen) => {
        if (!notificationPopup) return;
        const shouldOpen = typeof forceOpen === "boolean"
          ? forceOpen
          : notificationPopup.classList.contains("hidden");
        if (shouldOpen) {
          renderNotificationPopup();
          notificationPopup.classList.remove("hidden");
        } else {
          notificationPopup.classList.add("hidden");
          notificationPopup.classList.remove("expanded");
          const icon = notificationExpandBtn ? notificationExpandBtn.querySelector("i") : null;
          if (icon) icon.className = "bi bi-arrows-angle-expand";
        }
      };

      if (notificationBellBtn) {
        notificationBellBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          toggleNotificationPopup();
        });
      }

      if (notificationExpandBtn) {
        notificationExpandBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          if (!notificationPopup) return;
          const isExpanded = notificationPopup.classList.toggle("expanded");
          const icon = notificationExpandBtn.querySelector("i");
          if (icon) {
            icon.className = isExpanded ? "bi bi-arrows-angle-contract" : "bi bi-arrows-angle-expand";
          }
        });
      }

      if (notificationReadAllBtn) {
        notificationReadAllBtn.addEventListener("click", (event) => {
          event.stopPropagation();
          const notes = loadNotifications();
          if (!notes.length) return;
          const updated = notes.map((note) => ({ ...note, read: true }));
          localStorage.setItem(notificationCenterKey, JSON.stringify(updated));
          updateNotificationBadge();
          renderNotificationPopup();
        });
      }

      if (notificationList) {
        notificationList.addEventListener("click", (event) => {
          const markBtn = event.target.closest(".notificationMarkBtn");
          if (!markBtn) return;
          const index = Number(markBtn.getAttribute("data-note-index"));
          if (!Number.isInteger(index)) return;
          const notes = loadNotifications();
          if (!notes[index] || notes[index].read) return;
          notes[index].read = true;
          localStorage.setItem(notificationCenterKey, JSON.stringify(notes));
          updateNotificationBadge();
          renderNotificationPopup();
        });
      }

      document.addEventListener("click", (event) => {
        if (!notificationPopup || notificationPopup.classList.contains("hidden")) return;
        const wrap = document.querySelector(".notificationBellWrap");
        if (wrap && wrap.contains(event.target)) return;
        toggleNotificationPopup(false);
      });

      updateCommitmentNotifications();
      updateNotificationBadge();
    };

    renderClientPicker();
    applyTenantBrand();
    renderDirectoryList();
    wireHeaderPopups();
    wireUserPopup();
    wireSideNav();
    initNotifications();
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initSharedHeader);
  } else {
    initSharedHeader();
  }
})();
