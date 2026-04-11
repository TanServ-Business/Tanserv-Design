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

  const getDashboardPath = () => "pages/Dashboard_Agent.html";
  const dashboardPath = resolvePath(getDashboardPath());
  const getLandingPath = () => {
    const role = (localStorage.getItem("activeUserRole") || "").trim().toLowerCase();
    return role === "customer" ? "pages/LPcustomer.html" : "LPagent.html";
  };
  const landingPath = resolvePath(getLandingPath());

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
          <a class="submenu-link" href="${landingPath}" data-module="landing">Landing Page</a>
          <a class="submenu-link" href="${resolvePath("LPagent.html")}" data-module="landing-agent">Landing Page - Agent</a>
          <a class="submenu-link" href="${resolvePath("pages/LPcustomer.html")}" data-module="landing-customer">Landing Page - Customer</a>
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
          <a class="submenu-link" href="${resolvePath("pages/dashKAM.html")}" data-module="dashboard-kam">Dashboard - KAM</a>
          <a class="submenu-link" href="${resolvePath("pages/dashKAS.html")}" data-module="dashboard-kas">Dashboard - KAS</a>
          <a class="submenu-link" href="${resolvePath("pages/Dashboard_Supervisor.html")}" data-module="dashboard-supervisor">Dashboard - Supervisor</a>
          <a class="submenu-link" href="${resolvePath("pages/Dashboard_Admin.html")}" data-module="dashboard-admin">Dashboard - Admin</a>
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
      <li class="menu-item">
        <a class="nav-link" href="#" data-toggle="submenu" aria-expanded="false">
          <span class="link-content">
            <i class="bi bi-shield-lock" aria-hidden="true"></i>
            <span>Credit Limit</span>
          </span>
          <i class="bi bi-chevron-down chevron" aria-hidden="true"></i>
        </a>
        <div class="submenu">
          <a class="submenu-link" href="${resolvePath("pages/credit-limit-dashboard.html")}" data-module="credit-limit-dashboard">Portfolio Overview</a>
          <a class="submenu-link" href="${resolvePath("pages/credit-limit-detail.html")}" data-module="credit-limit-detail">Manage Credit Limits</a>
        </div>
      </li>
      <li class="menu-item">
        <a class="nav-link" href="#" data-toggle="submenu" aria-expanded="false">
          <span class="link-content">
            <i class="bi bi-question-circle" aria-hidden="true"></i>
            <span>Help &amp; Support</span>
          </span>
          <i class="bi bi-chevron-down chevron" aria-hidden="true"></i>
        </a>
        <div class="submenu">
          <a class="submenu-link" href="${resolvePath("pages/help-support.html")}" data-module="help-support">Help &amp; Support</a>
          <a class="submenu-link" href="${resolvePath("pages/support-admin.html")}" data-module="support-admin">Support Admin Portal</a>
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
      apollo: { name: "Apollo", badge: "AP", logo: "assets/apollo-sharkfin-logo.jpeg" },
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
          const activeRole = (localStorage.getItem("activeUserRole") || "").trim().toLowerCase();
          const landingDestination = activeRole === "customer" ? "pages/LPcustomer.html" : "LPagent.html";
          const destinations = {
            visit: "pages/visitmodule.html",
            "visit-review": "pages/visitmoduleReview.html",
            landing: landingDestination,
            "landing-agent": "LPagent.html",
            "landing-customer": "pages/LPcustomer.html",
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
            "dashboard-kam": "pages/dashKAM.html",
            "dashboard-kas": "pages/dashKAS.html",
            "dashboard-supervisor": "pages/Dashboard_Supervisor.html",
            "dashboard-admin": "pages/Dashboard_Admin.html",
            "issue-tracker": "pages/issuetrackerLP.html",
            "issue-matrix": "bin/IssueTracker/escalationMatrix.html",
            "issue-approver": "bin/IssueTracker/approver-dashboard.html",
            "issue-approval-request": "bin/IssueTracker/approval-request.html",
            "submission-module": "pages/submission.html",
            "pdc-agent": "pages/PDCagent.html",
            "pdc-ops": "pages/PDCOps.html",
            "commitment-agent": "pages/commitment.html",
            "commitment-manager": "pages/CommitmentManager.html",
            "help-support": "pages/help-support.html",
            "support-admin": "pages/support-admin.html"
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
      const issueTrackerBaseKey = "issueTrackerBaseData";
      const issueTrackerCustomKey = "customIssues";
      const issueApprovalRequestKey = "approval_requests";

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

      const saveNotifications = (list) => {
        try {
          localStorage.setItem(notificationCenterKey, JSON.stringify(Array.isArray(list) ? list : []));
        } catch (_) {
          // ignore storage errors
        }
      };

      const readStoredArray = (key) => {
        try {
          const raw = localStorage.getItem(key);
          const parsed = JSON.parse(raw || "[]");
          return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
          return [];
        }
      };

      const normalizeAudienceUser = (value) => (
        String(value || "")
          .toLowerCase()
          .replace(/<[^>]*>/g, " ")
          .replace(/\([^)]*\)/g, " ")
          .replace(/[^a-z0-9]+/g, " ")
          .trim()
      );

      const getActiveNotificationUser = () => String(localStorage.getItem("activeUserName") || "").trim();

      const getNotificationAudience = () => {
        const role = String(localStorage.getItem("activeUserRole") || "").trim().toLowerCase();
        const roleAlias = {
          manager: "manager",
          customer: "customer",
          agent: "agent",
          supervisor: "supervisor",
          kam: "kam",
          kas: "kas",
          admin: "admin",
          ops: "ops",
          "pdc-ops": "ops",
          backend: "backend",
          mis: "mis",
          "support-admin": "support-admin",
          "support-admin-lead": "support-admin-lead",
          "client-admin": "client-admin"
        };
        return roleAlias[role] || "agent";
      };

      const getVisibleNotifications = () => {
        const audience = getNotificationAudience();
        const activeUser = normalizeAudienceUser(getActiveNotificationUser());
        return loadNotifications().filter((note) => {
          if (note.scheduledFor && !note.sentAt) return false;
          const audiences = Array.isArray(note.audience)
            ? note.audience
            : (note.audience ? [note.audience] : []);
          const audienceAllowed = audiences.length === 0 || audiences.includes("all") || audiences.includes(audience);
          if (!audienceAllowed) return false;
          const userAudiences = Array.isArray(note.audienceUsers)
            ? note.audienceUsers.map(normalizeAudienceUser).filter(Boolean)
            : [];
          if (!userAudiences.length) return true;
          if (!activeUser) return false;
          return userAudiences.includes("all") || userAudiences.includes(activeUser);
        });
      };

      const formatCurrency = (value) => {
        const numeric = Number(value);
        if (!Number.isFinite(numeric)) return "-";
        return `Rs. ${numeric.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      };

      const getDetailValue = (details, label) => {
        const key = String(label || "").toLowerCase();
        const match = (details || []).find((item) => String(item?.label || "").toLowerCase() === key);
        return match ? String(match.value || "") : "";
      };

      const formatNotificationTime = (timestamp) => {
        if (!timestamp) return "-";
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return String(timestamp);
        return date.toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit"
        });
      };

      const buildNotificationTitle = (note, details) => {
        const type = String(note.type || "").toLowerCase();
        const customer = getDetailValue(details, "Customer");
        const invoice = getDetailValue(details, "Invoice");
        const visitDate = getDetailValue(details, "Visit date");

        if (type === "visit-approval" || type === "visit-approval-pending" || type === "visit-plan-approved" || type === "visit-replan-required") {
          const base = type === "visit-plan-approved"
            ? "Visit plan approved"
            : (type === "visit-replan-required" ? "Visit plan rejected" : "Visit approval pending");
          return visitDate ? `${base} - ${visitDate}` : base;
        }
        if (type === "todo") return "Todo reminder";
        if (type === "todo-assigned") return "Task assigned";
        if (type === "todo-completed-ack") return "Task completed";
        if (type === "commitment") {
          return String(note.title || "Commitment update");
        }
        if (type === "credit-utilization-breach") return "Credit utilization breach";
        if (type === "support-ticket-assigned") return "Support ticket assigned";
        if (type === "support-ticket-update") return "Support ticket updated";
        if (type === "support-sla-risk") return "Support SLA risk";
        if (type === "issue-created-manager") return "Issue created";
        if (type === "issue-manager-approved") return "Issue manager approval";
        if (type === "issue-approval-forwarded") return "Issue approval forwarded";
        if (type === "issue-approval-rejected") return "Issue approval rejected";
        if (type === "issue-resolution-provided") return "Issue resolution provided";
        if (type === "issue-ticket-closed") return "Issue ticket closed";
        if (type === "issue-assignment-updated") return "Issue assignment updated";
        if (type === "issue-approval-process-saved") return "Issue approval process saved";
        if (type === "issue-remark-added") return "Issue remark added";
        if (type === "issue-reopened") return "Issue reopened";
        if (note.title) return String(note.title);
        if (invoice && customer) return `Update - ${invoice} - ${customer}`;
        return "Update";
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
            id: `commitment-status:${item.invoiceNo || "unknown"}:${status}`,
            type: "commitment",
            status,
            title: status === "approved" ? "Commitment Approved" : "Commitment Rejected",
            message: `${item.customerName || "Customer"} commitment ${statusLabel} for ${item.invoiceNo || "-"}.`,
            invoiceNo: item.invoiceNo || "",
            customerName: item.customerName || "",
            week: item.week || "",
            targetAmount: item.targetAmount || 0,
            createdAt: new Date().toISOString(),
            read: false
          });
          seen[item.invoiceNo] = status;
          changed = true;
        });
        if (changed) {
          saveNotifications(notifications);
          localStorage.setItem(commitmentSeenKey, JSON.stringify(seen));
        }
      };

      const appendDummyIssueNotifications = () => {
        const notifications = loadNotifications();
        const existingIds = new Set(
          notifications
            .map((note) => String(note?.id || "").trim())
            .filter(Boolean)
        );
        const now = Date.now();
        const makeIso = (offsetMinutes) => new Date(now - (offsetMinutes * 60 * 1000)).toISOString();
        const dummyItems = [
          {
            id: "dummy-issue-assigned-1",
            type: "issue-assigned",
            title: "Issue assigned",
            message: "Issue ISS_2026_1001 assigned to you. Action required.",
            createdAt: makeIso(2),
            audience: ["all"],
            details: [
              { label: "Issue ID", value: "ISS_2026_1001" },
              { label: "Customer", value: "Apollo Pharmacy Pvt. Ltd." },
              { label: "Invoice", value: "INV_2026_1001" },
              { label: "Action owner", value: "Rohit Malhotra" },
              { label: "Due by", value: "15 Apr 2026" }
            ],
            ctas: [
              { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
            ]
          },
          {
            id: "dummy-issue-approval-requested-1",
            type: "issue-approval-requested",
            title: "Issue approval requested",
            message: "Approval required for issue ISS_2026_1002. Please review at your level.",
            createdAt: makeIso(4),
            audience: ["all"],
            details: [
              { label: "Process", value: "High Value Escalation" },
              { label: "Matrix", value: "Collections Matrix A" },
              { label: "Level", value: "2" },
              { label: "Requested by", value: "Priya Verma" },
              { label: "SLA", value: "24 hours" }
            ],
            ctas: [
              { label: "Open approval request", action: "link", href: "bin/IssueTracker/approver-dashboard.html" }
            ]
          },
          {
            id: "dummy-issue-approval-decision-1",
            type: "issue-approval-decision",
            title: "Issue approval decision",
            message: "Issue ISS_2026_1002 approved. Next action assigned.",
            createdAt: makeIso(6),
            audience: ["all"],
            details: [
              { label: "Decision", value: "Approved" },
              { label: "By", value: "Sanjay Rao" },
              { label: "Remarks", value: "Proceed with next level action." },
              { label: "Next owner", value: "Anoop Sharma" },
              { label: "Customer", value: "Sunrise Pvt Ltd" },
              { label: "Invoice", value: "INV_2026_1002" }
            ],
            ctas: [
              { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
            ]
          },
          {
            id: "dummy-issue-created-manager-1",
            type: "issue-created-manager",
            title: "Issue created",
            message: "Issue ISS_2026_1003 created and awaiting manager review.",
            createdAt: makeIso(8),
            audience: ["all"],
            details: [
              { label: "Issue ID", value: "ISS_2026_1003" },
              { label: "Customer", value: "BlueWave Distributors" },
              { label: "Invoice", value: "INV_2026_1003" },
              { label: "Created by", value: "Agent" },
              { label: "Sub-status", value: "Dispute Raised" },
              { label: "Due by", value: "18 Apr 2026" }
            ],
            ctas: [
              { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
            ]
          },
          {
            id: "dummy-issue-manager-approved-1",
            type: "issue-manager-approved",
            title: "Issue manager approval",
            message: "Issue ISS_2026_1004 approved by manager.",
            createdAt: makeIso(10),
            audience: ["all"],
            details: [
              { label: "Issue ID", value: "ISS_2026_1004" },
              { label: "Approved by", value: "Meera Iyer" },
              { label: "Approved at", value: "11 Apr 2026, 10:40 AM" },
              { label: "Next owner", value: "Karthik Iyer" },
              { label: "Remarks", value: "Approved for escalation workflow." }
            ],
            ctas: [
              { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
            ]
          },
          {
            id: "dummy-issue-approval-forwarded-1",
            type: "issue-approval-forwarded",
            title: "Issue approval forwarded",
            message: "Approval moved to next level for issue ISS_2026_1004.",
            createdAt: makeIso(12),
            audience: ["all"],
            details: [
              { label: "Issue ID", value: "ISS_2026_1004" },
              { label: "Process", value: "High Value Escalation" },
              { label: "From level", value: "2" },
              { label: "To level", value: "3" },
              { label: "Approved by", value: "Manager" },
              { label: "Next approver", value: "CFO Approver" }
            ],
            ctas: [
              { label: "Open approval request", action: "link", href: "bin/IssueTracker/approver-dashboard.html" }
            ]
          },
          {
            id: "dummy-issue-approval-rejected-1",
            type: "issue-approval-rejected",
            title: "Issue approval rejected",
            message: "Approval rejected for issue ISS_2026_1005.",
            createdAt: makeIso(14),
            audience: ["all"],
            details: [
              { label: "Issue ID", value: "ISS_2026_1005" },
              { label: "Level", value: "2" },
              { label: "Rejected by", value: "Approver L2" },
              { label: "Reason", value: "Insufficient supporting documents." },
              { label: "Next action", value: "Agent rework" }
            ],
            ctas: [
              { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
            ]
          },
          {
            id: "dummy-issue-resolution-provided-1",
            type: "issue-resolution-provided",
            title: "Issue resolution provided",
            message: "Resolution provided for issue ISS_2026_1006.",
            createdAt: makeIso(16),
            audience: ["all"],
            details: [
              { label: "Issue ID", value: "ISS_2026_1006" },
              { label: "Resolution by", value: "Action Owner" },
              { label: "Resolution summary", value: "Adjusted invoice and shared POD." },
              { label: "Submitted at", value: "11 Apr 2026, 09:20 AM" }
            ],
            ctas: [
              { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
            ]
          },
          {
            id: "dummy-issue-ticket-closed-1",
            type: "issue-ticket-closed",
            title: "Issue ticket closed",
            message: "Issue ISS_2026_1007 has been closed.",
            createdAt: makeIso(18),
            audience: ["all"],
            details: [
              { label: "Issue ID", value: "ISS_2026_1007" },
              { label: "Closed by", value: "Manager" },
              { label: "Closed at", value: "11 Apr 2026, 08:35 AM" },
              { label: "Closure remark", value: "Resolved with customer confirmation." }
            ],
            ctas: [
              { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
            ]
          },
          {
            id: "dummy-issue-assignment-updated-1",
            type: "issue-assignment-updated",
            title: "Issue assignment updated",
            message: "Issue ISS_2026_1008 assigned to new action owner.",
            createdAt: makeIso(20),
            audience: ["all"],
            details: [
              { label: "Issue ID", value: "ISS_2026_1008" },
              { label: "Customer", value: "Apollo Pharmacy Pvt. Ltd." },
              { label: "Invoice", value: "INV_2026_1008" },
              { label: "Assigned by", value: "Manager" },
              { label: "New action owner", value: "Neha Gupta" },
              { label: "Remark", value: "Reassigned for faster closure." }
            ],
            ctas: [
              { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
            ]
          },
          {
            id: "dummy-issue-approval-process-saved-1",
            type: "issue-approval-process-saved",
            title: "Issue approval process saved",
            message: "Approval process updated for issue ISS_2026_1009.",
            createdAt: makeIso(22),
            audience: ["all"],
            details: [
              { label: "Issue ID", value: "ISS_2026_1009" },
              { label: "Process", value: "Legal Escalation" },
              { label: "Updated by", value: "Manager" },
              { label: "Remark", value: "Process selected for compliance review." }
            ],
            ctas: [
              { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
            ]
          },
          {
            id: "dummy-issue-remark-added-1",
            type: "issue-remark-added",
            title: "Issue remark added",
            message: "New remark added on issue ISS_2026_1010.",
            createdAt: makeIso(24),
            audience: ["all"],
            details: [
              { label: "Issue ID", value: "ISS_2026_1010" },
              { label: "Added by", value: "Agent" },
              { label: "Remark", value: "Customer requested revised due date." }
            ],
            ctas: [
              { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
            ]
          },
          {
            id: "dummy-issue-reopened-1",
            type: "issue-reopened",
            title: "Issue reopened",
            message: "Issue ISS_2026_1011 has been reopened.",
            createdAt: makeIso(26),
            audience: ["all"],
            details: [
              { label: "Issue ID", value: "ISS_2026_1011" },
              { label: "Reopened by", value: "Manager" },
              { label: "Reopened at", value: "11 Apr 2026, 07:10 AM" },
              { label: "Remark", value: "Pending final customer confirmation." }
            ],
            ctas: [
              { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
            ]
          }
        ];

        let changed = false;
        dummyItems.forEach((item) => {
          if (existingIds.has(item.id)) return;
          notifications.push({
            ...item,
            read: false
          });
          existingIds.add(item.id);
          changed = true;
        });

        if (changed) saveNotifications(notifications);
      };

      const syncIssueNotificationsToCenter = () => {
        const existing = loadNotifications();
        const byId = new Map(existing.map((note) => [String(note?.id || ""), note]));
        const upsert = (payload) => {
          const id = String(payload?.id || "").trim();
          if (!id) return;
          const previous = byId.get(id) || {};
          byId.set(id, {
            ...previous,
            ...payload,
            id,
            read: Boolean(previous.read)
          });
        };
        const slugToken = (value) => (
          String(value || "")
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .replace(/^-+|-+$/g, "")
            .slice(0, 80)
            || "na"
        );
        const uniqueRecipients = (...values) => {
          const seen = new Set();
          const recipients = [];
          values.flat().forEach((value) => {
            const raw = String(value || "").trim();
            if (!raw) return;
            const normalized = normalizeAudienceUser(raw);
            if (!normalized || seen.has(normalized)) return;
            seen.add(normalized);
            recipients.push(raw);
          });
          return recipients;
        };
        const parseBracketValue = (text, fallback) => {
          const match = String(text || "").match(/\(([^)]+)\)/);
          return (match?.[1] || fallback || "").trim();
        };
        const parseResolutionSummary = (text) => {
          const source = String(text || "");
          const resolutionMatch = source.match(/Resolution:\s*([^\n]+)/i);
          if (resolutionMatch?.[1]) return resolutionMatch[1].trim();
          return source.split("\n")[0].trim() || "-";
        };
        const buildTrailEventKey = (entry, index) => {
          if (entry?.trailId) return String(entry.trailId);
          if (entry?.approvalKey) return slugToken(entry.approvalKey);
          return [
            slugToken(entry?.type),
            slugToken(entry?.when),
            slugToken(entry?.who),
            slugToken(entry?.what),
            String(index)
          ].join(":");
        };
        const pushIssueNotification = (payload) => {
          const id = String(payload?.id || "").trim();
          const recipients = uniqueRecipients(payload?.audienceUsers || []);
          if (!id || !payload?.type || !recipients.length) return;
          upsert({
            ...payload,
            id,
            audience: ["all"],
            audienceUsers: recipients
          });
        };

        const baseInvoices = readStoredArray(issueTrackerBaseKey);
        const invoiceById = new Map();
        baseInvoices.forEach((invoiceEntry) => {
          const invoiceId = String(invoiceEntry?.id || invoiceEntry?.invoiceNo || "").trim();
          if (!invoiceId) return;
          invoiceById.set(invoiceId, invoiceEntry || {});
        });

        const baseIssues = baseInvoices.flatMap((invoiceEntry) => (
          Array.isArray(invoiceEntry?.issues)
            ? invoiceEntry.issues.map((issue) => ({
                ...issue,
                invoiceNo: issue?.invoiceNo || invoiceEntry?.invoiceNo || invoiceEntry?.id || "",
                customerName: issue?.customerName || invoiceEntry?.customerName || invoiceEntry?.customer || "",
                kam: issue?.kam || invoiceEntry?.kam || "",
                manager: issue?.manager || invoiceEntry?.manager || "",
                agent: issue?.agent || ""
              }))
            : []
        ));
        const customIssues = readStoredArray(issueTrackerCustomKey);
        const issueList = [...baseIssues, ...customIssues].map((issue) => {
          const invoiceNo = String(issue?.invoiceNo || issue?.invoiceId || "").trim();
          const invoiceEntry = invoiceNo ? invoiceById.get(invoiceNo) : null;
          return {
            ...issue,
            invoiceNo: invoiceNo || issue?.invoiceNo || "",
            customerName: issue?.customerName || invoiceEntry?.customerName || invoiceEntry?.customer || "",
            kam: issue?.kam || invoiceEntry?.kam || "",
            manager: issue?.manager || invoiceEntry?.manager || "",
            agent: issue?.agent || "",
            actionTrail: Array.isArray(issue?.actionTrail) ? issue.actionTrail : []
          };
        });
        const issueById = new Map();

        issueList.forEach((issue) => {
          const issueId = String(issue?.id || "").trim();
          if (!issueId) return;
          const previous = issueById.get(issueId) || {};
          issueById.set(issueId, {
            id: issueId,
            invoiceNo: issue?.invoiceNo || previous.invoiceNo || "",
            customerName: issue?.customerName || previous.customerName || "",
            subStatus: issue?.subStatus || previous.subStatus || "",
            dueBy: issue?.invoiceDueDate || issue?.dueBy || previous.dueBy || "",
            actionOwner: issue?.actionOwner || previous.actionOwner || "",
            manager: issue?.manager || previous.manager || "",
            agent: issue?.agent || previous.agent || "",
            kam: issue?.kam || previous.kam || "",
            createdAt: issue?.createdAt || issue?.created || previous.createdAt || "",
            updatedAt: issue?.updatedAt || previous.updatedAt || "",
            approvalProcessName: issue?.approvalProcessName || previous.approvalProcessName || "",
            actionTrail: Array.isArray(issue?.actionTrail) && issue.actionTrail.length
              ? issue.actionTrail
              : (Array.isArray(previous.actionTrail) ? previous.actionTrail : [])
          });
        });

        issueById.forEach((issue) => {
          const issueId = issue?.id || "";
          const managerRaw = issue?.manager || "";
          const createdAt = issue?.createdAt || issue?.updatedAt || new Date().toISOString();

          if (managerRaw) {
            pushIssueNotification({
              id: `issue-created-manager:${issueId}:${slugToken(managerRaw)}`,
              type: "issue-created-manager",
              title: "Issue created",
              message: `Issue ${issueId} created and awaiting manager review.`,
              createdAt,
              audienceUsers: [managerRaw],
              details: [
                { label: "Issue ID", value: issueId },
                { label: "Customer", value: issue?.customerName || "-" },
                { label: "Invoice", value: issue?.invoiceNo || "-" },
                { label: "Created by", value: issue?.agent || "-" },
                { label: "Sub-status", value: issue?.subStatus || "-" },
                { label: "Due by", value: issue?.dueBy || "-" }
              ],
              ctas: [
                { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
              ]
            });
          }

          const assigneeRaw = issue?.actionOwner || "";
          const assignee = normalizeAudienceUser(assigneeRaw);
          if (issueId && assignee) {
            pushIssueNotification({
              id: `issue-assigned:${issueId}:${assignee}`,
              type: "issue-assigned",
              title: "Issue assigned",
              message: `Issue ${issueId} assigned to you. ${issue?.subStatus || "Action required"}.`,
              createdAt,
              audienceUsers: [assigneeRaw],
              details: [
                { label: "Issue ID", value: issueId },
                { label: "Customer", value: issue?.customerName || "-" },
                { label: "Invoice", value: issue?.invoiceNo || "-" },
                { label: "Action owner", value: assigneeRaw || "-" },
                { label: "Due by", value: issue?.dueBy || "-" }
              ],
              ctas: [
                { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
              ]
            });
          }

          const trail = Array.isArray(issue?.actionTrail) ? issue.actionTrail : [];
          trail.forEach((entry, index) => {
            const type = String(entry?.type || "").toLowerCase();
            const whatText = String(entry?.what || "");
            const what = whatText.toLowerCase();
            const actor = String(entry?.who || "").trim() || "User";
            const at = entry?.when || issue?.updatedAt || issue?.createdAt || new Date().toISOString();
            const trailKey = buildTrailEventKey(entry, index);

            if (type === "assignment" && what.includes("assigned to action owner")) {
              const newOwner = parseBracketValue(whatText, issue?.actionOwner || "");
              pushIssueNotification({
                id: `issue-assignment-updated:${issueId}:${trailKey}`,
                type: "issue-assignment-updated",
                title: "Issue assignment updated",
                message: `Issue ${issueId} assigned to ${newOwner || "action owner"}.`,
                createdAt: at,
                audienceUsers: [issue?.agent || "", issue?.manager || "", issue?.kam || "", newOwner],
                details: [
                  { label: "Issue ID", value: issueId },
                  { label: "Customer", value: issue?.customerName || "-" },
                  { label: "Invoice", value: issue?.invoiceNo || "-" },
                  { label: "Assigned by", value: actor || "-" },
                  { label: "New action owner", value: newOwner || issue?.actionOwner || "-" },
                  { label: "Remark", value: entry?.remark || "-" }
                ],
                ctas: [
                  { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
                ]
              });
            }

            if (type === "assigned" && what.includes("selected approval process")) {
              const processName = parseBracketValue(whatText, issue?.approvalProcessName || "");
              pushIssueNotification({
                id: `issue-approval-process-saved:${issueId}:${trailKey}`,
                type: "issue-approval-process-saved",
                title: "Issue approval process saved",
                message: `Approval process updated for issue ${issueId}.`,
                createdAt: at,
                audienceUsers: [issue?.manager || "", issue?.agent || "", issue?.kam || ""],
                details: [
                  { label: "Issue ID", value: issueId },
                  { label: "Process", value: processName || issue?.approvalProcessName || "-" },
                  { label: "Updated by", value: actor || "-" },
                  { label: "Remark", value: entry?.remark || "-" }
                ],
                ctas: [
                  { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
                ]
              });
            }

            if (type === "remark" && /^updated remark\b/.test(what)) {
              pushIssueNotification({
                id: `issue-remark-added:${issueId}:${trailKey}`,
                type: "issue-remark-added",
                title: "Issue remark added",
                message: `New remark added on issue ${issueId}.`,
                createdAt: at,
                audienceUsers: [issue?.actionOwner || ""],
                details: [
                  { label: "Issue ID", value: issueId },
                  { label: "Added by", value: actor || "-" },
                  { label: "Remark", value: entry?.remark || "-" }
                ],
                ctas: [
                  { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
                ]
              });
            }

            if (type === "approval" && what.includes("approved the issue") && !entry?.approvalKey) {
              pushIssueNotification({
                id: `issue-manager-approved:${issueId}:${trailKey}`,
                type: "issue-manager-approved",
                title: "Issue manager approval",
                message: `Issue ${issueId} approved by manager.`,
                createdAt: at,
                audienceUsers: [issue?.kam || "", issue?.agent || "", issue?.actionOwner || ""],
                details: [
                  { label: "Issue ID", value: issueId },
                  { label: "Approved by", value: actor || "-" },
                  { label: "Customer", value: issue?.customerName || "-" },
                  { label: "Invoice", value: issue?.invoiceNo || "-" },
                  { label: "Remark", value: entry?.remark || "-" }
                ],
                ctas: [
                  { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
                ]
              });
            }

            if (type === "resolution") {
              pushIssueNotification({
                id: `issue-resolution-provided:${issueId}:${trailKey}`,
                type: "issue-resolution-provided",
                title: "Issue resolution provided",
                message: `Resolution provided for issue ${issueId}.`,
                createdAt: at,
                audienceUsers: [issue?.agent || "", issue?.manager || ""],
                details: [
                  { label: "Issue ID", value: issueId },
                  { label: "Resolution by", value: actor || "-" },
                  { label: "Resolution summary", value: parseResolutionSummary(entry?.remark || "") },
                  { label: "Submitted at", value: at || "-" }
                ],
                ctas: [
                  { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
                ]
              });
            }

            if (type === "closure" && what.includes("closed the issue")) {
              pushIssueNotification({
                id: `issue-ticket-closed:${issueId}:${trailKey}`,
                type: "issue-ticket-closed",
                title: "Issue ticket closed",
                message: `Issue ${issueId} has been closed.`,
                createdAt: at,
                audienceUsers: [issue?.kam || "", issue?.actionOwner || ""],
                details: [
                  { label: "Issue ID", value: issueId },
                  { label: "Closed by", value: actor || "-" },
                  { label: "Closed at", value: at || "-" },
                  { label: "Closure remark", value: entry?.remark || "-" }
                ],
                ctas: [
                  { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
                ]
              });
            }

            if (type === "reopen") {
              pushIssueNotification({
                id: `issue-reopened:${issueId}:${trailKey}`,
                type: "issue-reopened",
                title: "Issue reopened",
                message: `Issue ${issueId} has been reopened.`,
                createdAt: at,
                audienceUsers: [issue?.agent || "", issue?.manager || "", issue?.kam || "", issue?.actionOwner || ""],
                details: [
                  { label: "Issue ID", value: issueId },
                  { label: "Reopened by", value: actor || "-" },
                  { label: "Reopened at", value: at || "-" },
                  { label: "Remark", value: entry?.remark || "-" }
                ],
                ctas: [
                  { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
                ]
              });
            }
          });
        });

        const requests = readStoredArray(issueApprovalRequestKey);
        requests.forEach((req) => {
          const reqId = String(req?.id || "").trim();
          if (!reqId) return;
          const status = String(req?.status || "pending").toLowerCase();
          const level = Number(req?.currentLevel || 1);
          const levels = Array.isArray(req?.levels) ? req.levels : [];
          const levelOwner = levels[level - 1] || {};
          const ownerTarget = levelOwner.ownerName || levelOwner.ownerEmail || "";
          const issueId = String(req?.issue?.id || "").trim();
          const issueContext = issueById.get(issueId) || {};
          const invoiceContext = (
            String(req?.invoice?.id || "").trim()
              ? (invoiceById.get(String(req?.invoice?.id || "").trim()) || {})
              : {}
          );
          const managerUser = issueContext?.manager || req?.issue?.manager || invoiceContext?.manager || "";
          const agentUser = issueContext?.agent || req?.issue?.agent || "";
          const kamUser = issueContext?.kam || req?.issue?.kam || invoiceContext?.kam || "";
          const actionOwnerUser = req?.issue?.actionOwner || issueContext?.actionOwner || "";
          const issueCustomer = req?.invoice?.customer || issueContext?.customerName || "-";
          const issueInvoice = req?.invoice?.id || issueContext?.invoiceNo || "-";
          const submittedEntry = (Array.isArray(req?.trail) ? req.trail : []).find((entry) => (
            String(entry?.action || "").toLowerCase() === "submitted"
          ));
          const decisionEntry = (Array.isArray(req?.trail) ? req.trail : [])
            .slice()
            .reverse()
            .find((entry) => ["approved", "rejected"].includes(String(entry?.action || "").toLowerCase()));
          const reqTrail = Array.isArray(req?.trail) ? req.trail : [];

          if (status === "pending" && ownerTarget) {
            const ownerEmail = levelOwner.ownerEmail || "";
            const ownerHint = ownerEmail || ownerTarget;
            pushIssueNotification({
              id: `issue-approval-requested:${reqId}:level-${level}`,
              type: "issue-approval-requested",
              title: "Issue approval requested",
              message: `Approval required for issue ${issueId || "-"}. Please review at your level.`,
              createdAt: req?.updatedAt || req?.createdAt || new Date().toISOString(),
              audienceUsers: [ownerTarget],
              details: [
                { label: "Process", value: req?.processName || req?.processId || "-" },
                { label: "Matrix", value: req?.matrixName || "-" },
                { label: "Level", value: String(level) },
                { label: "Requested by", value: submittedEntry?.by || "-" },
                { label: "SLA", value: req?.slaHours ? `${req.slaHours} hours` : "-" }
              ],
              ctas: [
                { label: "Open approval request", action: "link", href: `bin/IssueTracker/approval-request.html?id=${encodeURIComponent(reqId)}&user=${encodeURIComponent(ownerHint)}` }
              ]
            });
          }

          reqTrail.forEach((trailEntry, trailIndex) => {
            const action = String(trailEntry?.action || "").toLowerCase();
            if (action !== "approved" && action !== "rejected") return;
            const entryLevel = Number(trailEntry?.level || 1);
            const entryAt = trailEntry?.at || req?.updatedAt || req?.createdAt || new Date().toISOString();
            const actor = String(trailEntry?.by || "").trim() || "Approver";
            const eventKey = buildTrailEventKey({
              trailId: trailEntry?.trailId,
              approvalKey: `${reqId}:${entryLevel}:${entryAt}:${action}`,
              type: action,
              who: actor,
              when: entryAt
            }, trailIndex);

            if (action === "approved") {
              const managerNorm = normalizeAudienceUser(managerUser);
              const actorNorm = normalizeAudienceUser(actor);
              const isManagerApproval = (managerNorm && actorNorm && managerNorm === actorNorm) || entryLevel === 1;
              if (isManagerApproval) {
                pushIssueNotification({
                  id: `issue-manager-approved:${reqId}:${eventKey}`,
                  type: "issue-manager-approved",
                  title: "Issue manager approval",
                  message: `Issue ${issueId || "-"} approved by manager.`,
                  createdAt: entryAt,
                  audienceUsers: [kamUser, agentUser, actionOwnerUser],
                  details: [
                    { label: "Issue ID", value: issueId || "-" },
                    { label: "Approved by", value: actor || "-" },
                    { label: "Approved at", value: entryAt || "-" },
                    { label: "Next owner", value: actionOwnerUser || "-" },
                    { label: "Remarks", value: trailEntry?.remark || "-" }
                  ],
                  ctas: [
                    { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
                  ]
                });
              }

              const nextLevelOwner = levels[entryLevel] || {};
              const nextTarget = nextLevelOwner.ownerName || nextLevelOwner.ownerEmail || "";
              if (nextTarget) {
                const nextHint = nextLevelOwner.ownerEmail || nextTarget;
                pushIssueNotification({
                  id: `issue-approval-forwarded:${reqId}:${eventKey}`,
                  type: "issue-approval-forwarded",
                  title: "Issue approval forwarded",
                  message: `Approval moved to next level for issue ${issueId || "-"}.`,
                  createdAt: entryAt,
                  audienceUsers: [nextTarget, kamUser, agentUser, actionOwnerUser],
                  details: [
                    { label: "Issue ID", value: issueId || "-" },
                    { label: "Process", value: req?.processName || req?.processId || "-" },
                    { label: "From level", value: String(entryLevel) },
                    { label: "To level", value: String(entryLevel + 1) },
                    { label: "Approved by", value: actor || "-" },
                    { label: "Next approver", value: nextTarget || "-" }
                  ],
                  ctas: [
                    { label: "Open approval request", action: "link", href: `bin/IssueTracker/approval-request.html?id=${encodeURIComponent(reqId)}&user=${encodeURIComponent(nextHint)}` }
                  ]
                });
              }
            }

            if (action === "rejected") {
              pushIssueNotification({
                id: `issue-approval-rejected:${reqId}:${eventKey}`,
                type: "issue-approval-rejected",
                title: "Issue approval rejected",
                message: `Approval rejected for issue ${issueId || "-"}.`,
                createdAt: entryAt,
                audienceUsers: [kamUser, agentUser, actionOwnerUser],
                details: [
                  { label: "Issue ID", value: issueId || "-" },
                  { label: "Level", value: String(entryLevel) },
                  { label: "Rejected by", value: actor || "-" },
                  { label: "Reason", value: trailEntry?.remark || "-" },
                  { label: "Next action", value: actionOwnerUser || "-" }
                ],
                ctas: [
                  { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
                ]
              });
            }
          });

          if (status === "approved" || status === "rejected") {
            const decisionAt = req?.updatedAt || req?.reviewedAt || decisionEntry?.at || req?.createdAt || "";
            pushIssueNotification({
              id: `issue-approval-decision:${reqId}:${status}:${decisionAt || "latest"}`,
              type: "issue-approval-decision",
              title: "Issue approval decision",
              message: `Issue ${issueId || "-"} ${status}. Next action assigned.`,
              createdAt: decisionAt || new Date().toISOString(),
              audienceUsers: [kamUser, agentUser, actionOwnerUser],
              details: [
                { label: "Decision", value: status === "approved" ? "Approved" : "Rejected" },
                { label: "By", value: decisionEntry?.by || "-" },
                { label: "Remarks", value: decisionEntry?.remark || "-" },
                { label: "Next owner", value: actionOwnerUser || "-" },
                { label: "Customer", value: issueCustomer || "-" },
                { label: "Invoice", value: issueInvoice || "-" }
              ],
              ctas: [
                { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
              ]
            });
          }
        });

        const next = Array.from(byId.values())
          .filter((note) => note && String(note.id || "").trim())
          .sort((a, b) => {
            const at = new Date(a?.sentAt || a?.createdAt || 0).getTime();
            const bt = new Date(b?.sentAt || b?.createdAt || 0).getTime();
            return bt - at;
          });
        saveNotifications(next);
      };

      const updateNotificationBadge = () => {
        if (!notificationBellCount) return;
        const unreadCount = getVisibleNotifications().filter(note => !note.read).length;
        notificationBellCount.textContent = String(unreadCount);
        notificationBellCount.classList.toggle("hidden", unreadCount === 0);
        if (notificationReadAllBtn) notificationReadAllBtn.disabled = unreadCount === 0;
      };

      const renderNotificationPopup = () => {
        if (!notificationList) return;
        const notes = getVisibleNotifications();
        if (notes.length === 0) {
          notificationList.innerHTML = "<div class=\"notificationEmpty\">No notifications yet.</div>";
          return;
        }
        const typeLabelMap = {
          pdc: "PDC",
          "pdc-reminder": "PDC reminder",
          "pdc-bounced": "PDC",
          "pdc-handoff": "PDC",
          commitment: "Commitment",
          "commitment-approved": "Commitment",
          "commitment-submitted": "Commitment",
          "commitment-rejected": "Commitment",
          "visit-approval": "Visit approval",
          "visit-approval-pending": "Visit approval",
          "visit-plan-approved": "Visit approval",
          "visit-replan-required": "Visit approval",
          todo: "Todo",
          "todo-assigned": "Todo",
          "todo-completed-ack": "Todo",
          email: "Email",
          "backend-upload-exception": "Backend",
          "mis-schedule-failed": "MIS",
          "issue-assigned": "Issue",
          "issue-approval-requested": "Issue",
          "issue-approval-decision": "Issue",
          "issue-created-manager": "Issue",
          "issue-manager-approved": "Issue",
          "issue-approval-forwarded": "Issue",
          "issue-approval-rejected": "Issue",
          "issue-resolution-provided": "Issue",
          "issue-ticket-closed": "Issue",
          "issue-assignment-updated": "Issue",
          "issue-approval-process-saved": "Issue",
          "issue-remark-added": "Issue",
          "issue-reopened": "Issue",
          "credit-limit-request": "Credit Limit",
          "credit-limit-decision": "Credit Limit",
          "credit-utilization-breach": "Credit Limit",
          "support-ticket-assigned": "Support",
          "support-ticket-update": "Support",
          "support-sla-risk": "Support"
        };

        notificationList.innerHTML = notes.map((note, index) => {
          const noteId = String(note.id || `note-${index}`);
          const details = Array.isArray(note.details) ? note.details : [];
          const legacyCommitmentDetails = String(note.type || "").toLowerCase() === "commitment" && details.length === 0
            ? [
                { label: "Invoice", value: note.invoiceNo || "-" },
                { label: "Customer", value: note.customerName || "-" },
                { label: "Week", value: note.week || "-" },
                { label: "Committed Amount", value: formatCurrency(note.targetAmount) }
              ]
            : [];
          const detailRows = details.length ? details : legacyCommitmentDetails;
          const detailHtml = detailRows.map((detail) => `
            <div class="notificationDetailRow">
              <span>${escapeHtml(detail.label || "-")}</span>
              <strong>${escapeHtml(detail.value || "-")}</strong>
            </div>
          `).join("");

          const ctas = Array.isArray(note.ctas) ? note.ctas : [];
          const type = String(note.type || "").toLowerCase();
          const invoiceValue = getDetailValue(detailRows, "Invoice") || note.invoiceNo || "";
          const defaultAction = ctas[0]?.action
            || ((type === "visit-approval" || type === "visit-approval-pending" || type === "visit-plan-approved" || type === "visit-replan-required") ? "link"
              : (type === "pdc" || type === "pdc-reminder" || type === "pdc-bounced" || type === "pdc-handoff") ? "open-pdc"
                : (type === "todo" || type === "todo-assigned" || type === "todo-completed-ack") ? "open-todo"
                  : type === "email" ? "open-email"
                    : (type === "commitment" || type === "commitment-approved") ? "open-invoice"
                      : (type === "commitment-submitted" || type === "commitment-rejected" || type.startsWith("issue-") || type.startsWith("backend-") || type.startsWith("mis-") || type.startsWith("credit-") || type.startsWith("support-")) ? "link"
                        : "");
          const defaultHref = ctas[0]?.href
            || ((type === "visit-approval" || type === "visit-approval-pending") ? "pages/visitmoduleReview.html"
              : type === "visit-plan-approved" ? "pages/visitmodule.html"
                : type === "visit-replan-required" ? "pages/visitmodule.html"
                  : type === "commitment-submitted" ? "pages/CommitmentManager.html"
                    : (type === "commitment-rejected" || type === "commitment") ? "pages/commitment.html"
                      : type === "issue-approval-requested" ? "bin/IssueTracker/approver-dashboard.html"
                        : type === "issue-approval-forwarded" ? "bin/IssueTracker/approver-dashboard.html"
                          : type.startsWith("issue-") ? "pages/issuetrackerLP.html"
                            : type === "backend-upload-exception" ? "pages/LPbackend.html"
                              : type === "mis-schedule-failed" ? "pages/LPmis.html"
                                : (type === "credit-limit-request" || type === "credit-limit-decision" || type === "credit-utilization-breach") ? "pages/credit-limit-dashboard.html"
                                  : type === "support-ticket-assigned" ? "pages/support-admin.html"
                                    : type === "support-ticket-update" ? "pages/help-support.html"
                                      : type === "support-sla-risk" ? "pages/support-admin.html"
                                        : "");
          const ctaList = ctas.length
            ? ctas
            : (defaultAction
              ? [{ label: type === "commitment" ? "Open commitment" : "Open", action: defaultAction, href: defaultHref, invoiceNo: invoiceValue }]
              : []);
          const ctaHtml = ctaList.map((cta) => `
            <button
              class="notificationCta"
              type="button"
              data-action="${escapeHtml(cta.action || "")}"
              data-href="${escapeHtml(cta.href || "")}"
              data-inv="${escapeHtml(cta.invoiceNo || "")}"
              data-note="${escapeHtml(noteId)}"
            >${escapeHtml(cta.label || "View")}</button>
          `).join("");

          const markButton = note.read
            ? ""
            : `<button class=\"notificationMarkBtn\" type=\"button\" data-note-id=\"${escapeHtml(noteId)}\" data-note-index=\"${index}\">Mark as read</button>`;
          const typeLabel = typeLabelMap[type] || "Update";
          const typeClass = `tag-${type.replace(/[^a-z0-9]+/g, "-") || "update"}`;
          const title = buildNotificationTitle(note, detailRows);
          const cardMessage = String(note.message || "-");

          return (
            `<div class=\"notificationCard${note.read ? " isRead" : ""}\" data-note-id=\"${escapeHtml(noteId)}\" data-action=\"${escapeHtml(defaultAction)}\" data-href=\"${escapeHtml(defaultHref)}\" data-inv=\"${escapeHtml(invoiceValue)}\">
              <div class=\"notificationCardHeader\">
                <div class=\"notificationTitle\">${escapeHtml(title)}</div>
                <div class=\"notificationMetaRight\">
                  <div class=\"notificationTag ${typeClass}\">${escapeHtml(typeLabel)}</div>
                  <div class=\"notificationTime\">${escapeHtml(formatNotificationTime(note.sentAt || note.createdAt || ""))}</div>
                  ${markButton}
                </div>
              </div>
              <div class=\"notificationCardBody\">${escapeHtml(cardMessage)}</div>
              ${detailHtml ? `<div class=\"notificationDetails\">${detailHtml}</div>` : ""}
              ${ctaHtml ? `<div class=\"notificationCtas\">${ctaHtml}</div>` : ""}
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
          syncIssueNotificationsToCenter();
          updateCommitmentNotifications();
          appendDummyIssueNotifications();
          updateNotificationBadge();
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
          const runAction = (action, href) => {
            const role = String(localStorage.getItem("activeUserRole") || "").trim().toLowerCase();
            const landingPath = role === "customer" ? "pages/LPcustomer.html" : "LPagent.html";
            if (action === "open-pdc") {
              const target = role === "ops" || role === "pdc-ops" ? "pages/PDCOps.html" : "pages/PDCagent.html";
              window.location.href = resolvePath(target);
              return;
            }
            if (action === "open-todo" || action === "open-email" || action === "open-invoice" || action === "open-disposition") {
              window.location.href = resolvePath(landingPath);
              return;
            }
            if (href) {
              window.location.href = resolvePath(href);
            }
          };

          const markBtn = event.target.closest(".notificationMarkBtn");
          if (markBtn) {
            const index = Number(markBtn.getAttribute("data-note-index"));
            const noteId = String(markBtn.getAttribute("data-note-id") || "").trim();
            const notes = loadNotifications();
            const updated = notes.map((note, idx) => {
              const matchById = noteId && String(note.id || "").trim() === noteId;
              const matchByIndex = !noteId && Number.isInteger(index) && idx === index;
              return (matchById || matchByIndex) ? { ...note, read: true } : note;
            });
            localStorage.setItem(notificationCenterKey, JSON.stringify(updated));
            updateNotificationBadge();
            renderNotificationPopup();
            return;
          }

          const cta = event.target.closest(".notificationCta");
          if (cta) {
            runAction(cta.getAttribute("data-action"), cta.getAttribute("data-href"));
            return;
          }

          if (notificationPopup && notificationPopup.classList.contains("expanded")) return;
          const card = event.target.closest(".notificationCard");
          if (!card) return;
          runAction(card.getAttribute("data-action"), card.getAttribute("data-href"));
        });
      }

      document.addEventListener("click", (event) => {
        if (!notificationPopup || notificationPopup.classList.contains("hidden")) return;
        const wrap = document.querySelector(".notificationBellWrap");
        if (wrap && wrap.contains(event.target)) return;
        toggleNotificationPopup(false);
      });

      syncIssueNotificationsToCenter();
      updateCommitmentNotifications();
      appendDummyIssueNotifications();
      updateNotificationBadge();

      window.addEventListener("storage", (event) => {
        if (!event.key) return;
        if (
          event.key === notificationCenterKey
          || event.key === issueTrackerBaseKey
          || event.key === issueTrackerCustomKey
          || event.key === issueApprovalRequestKey
          || event.key === commitmentSubmitKey
        ) {
          syncIssueNotificationsToCenter();
          updateCommitmentNotifications();
          appendDummyIssueNotifications();
          updateNotificationBadge();
          if (notificationPopup && !notificationPopup.classList.contains("hidden")) {
            renderNotificationPopup();
          }
        }
      });
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
