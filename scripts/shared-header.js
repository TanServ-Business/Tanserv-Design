(() => {
  const mount = document.querySelector("[data-shared-header]");
  if (!mount) return;

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

  const headerMarkup = `
<header class="shared-header">
  <div class="headerLeft">
    <div class="headerMenu">
      <button class="iconBtn menuBtn" type="button" id="headerMenuBtn" aria-label="Open menu">
        <i class="bi bi-list" aria-hidden="true"></i>
      </button>
    </div>
    <div class="brand"><a href="${resolvePath("index.html")}">
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
          <button class="notificationExpandBtn" type="button" id="notificationExpandBtn" aria-label="Expand notifications">
            <i class="bi bi-arrows-angle-expand" aria-hidden="true"></i>
          </button>
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
          <a class="submenu-link" href="${resolvePath("index.html")}" data-module="landing">Landing Page</a>
          <a class="submenu-link" href="${resolvePath("pages/LPmanager.html")}" data-module="landing-manager">Landing Page - Manager</a>
          <a class="submenu-link" href="${resolvePath("pages/LPbackend.html")}" data-module="landing-backend">Landing Page - Backend</a>
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
})();
