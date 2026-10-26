(() => {
  const createNotificationCenterManager = () => {
    const storageKey = "ineburaNotificationCenter";

    const toArray = (value, fallback = []) => (
      Array.isArray(value) ? value : fallback
    );

    const normalizeListField = (value, fallback = []) => (
      Array.isArray(value) ? value : (value ? [value] : fallback)
    );

    const normalizeAudienceUser = (value) => (
      String(value || "")
        .toLowerCase()
        .replace(/<[^>]*>/g, " ")
        .replace(/\([^)]*\)/g, " ")
        .replace(/[^a-z0-9]+/g, " ")
        .trim()
    );

    const normalizeAudienceToken = (value) => String(value || "").trim().toLowerCase();

    const load = () => {
      try {
        const raw = localStorage.getItem(storageKey);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        return toArray(parsed);
      } catch (err) {
        return [];
      }
    };

    const save = (list) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(toArray(list)));
      } catch (_) {
        // Keep notification failures from breaking prototype pages.
      }
    };

    const normalizeNote = (note = {}) => {
      const source = note && typeof note === "object" ? note : {};
      return {
        ...source,
        id: source.id || `note-${Date.now()}`,
        type: source.type || "general",
        title: source.title || "Notification",
        message: source.message || "",
        createdAt: source.createdAt || new Date().toISOString(),
        scheduledFor: source.scheduledFor || "",
        sentAt: source.sentAt || "",
        read: Boolean(source.read),
        audience: normalizeListField(source.audience, ["all"]),
        audienceUsers: normalizeListField(source.audienceUsers, []),
        details: toArray(source.details),
        ctas: toArray(source.ctas),
        data: source.data || {}
      };
    };

    const upsert = (note, options = {}) => {
      const list = load();
      const payload = normalizeNote(note);
      const existingIndex = list.findIndex((item) => String(item?.id || "") === String(payload.id || ""));
      if (existingIndex >= 0) {
        const existing = list[existingIndex] || {};
        list[existingIndex] = {
          ...existing,
          ...payload,
          read: options.preserveRead ? Boolean(existing.read) : payload.read
        };
      } else {
        list.unshift(payload);
      }
      save(list);
      return payload;
    };

    const toDateOnly = (value) => {
      if (!value) return null;
      const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
      if (Number.isNaN(date.getTime())) return null;
      date.setHours(0, 0, 0, 0);
      return date;
    };

    const normalizeDueScheduled = () => {
      const list = load();
      const now = Date.now();
      let changed = false;
      const updated = list.map((note) => {
        if (note?.scheduledFor && !note.sentAt) {
          const scheduledDate = new Date(note.scheduledFor);
          if (!Number.isNaN(scheduledDate.getTime()) && scheduledDate.getTime() <= now) {
            changed = true;
            return { ...note, sentAt: new Date().toISOString() };
          }
        }
        return note;
      });
      if (changed) save(updated);
      return updated;
    };

    const getVisible = (options = {}) => {
      const audience = normalizeAudienceToken(options.audience || "");
      const activeUser = normalizeAudienceUser(options.activeUser || "");
      const shouldCheckUser = Object.prototype.hasOwnProperty.call(options, "activeUser");
      const list = options.normalizeDueScheduled ? normalizeDueScheduled() : load();
      return list.filter((note) => {
        if (note?.scheduledFor && !note.sentAt) return false;
        const audiences = normalizeListField(note?.audience, [])
          .map(normalizeAudienceToken)
          .filter(Boolean);
        const audienceAllowed = !audience
          || audiences.length === 0
          || audiences.includes("all")
          || audiences.includes(audience);
        if (!audienceAllowed) return false;
        const userAudiences = normalizeListField(note?.audienceUsers, [])
          .map(normalizeAudienceUser)
          .filter(Boolean);
        if (!shouldCheckUser || userAudiences.length === 0) return true;
        if (!activeUser) return false;
        return userAudiences.includes("all") || userAudiences.includes(activeUser);
      });
    };

    const markVisibleRead = (options = {}) => {
      const visibleIds = new Set(
        getVisible(options)
          .map((note) => String(note?.id || ""))
          .filter(Boolean)
      );
      const updated = load().map((note) => (
        visibleIds.has(String(note?.id || "")) ? { ...note, read: true } : note
      ));
      save(updated);
      return updated;
    };

    const getById = (id) => {
      const noteId = String(id || "");
      if (!noteId) return null;
      return normalizeDueScheduled().find((note) => String(note?.id || "") === noteId) || null;
    };

    const getDetailValue = (details, label) => {
      const key = String(label || "").toLowerCase();
      const match = toArray(details).find((item) => String(item?.label || "").toLowerCase() === key);
      return match ? String(match.value || "") : "";
    };

    const typeLabelMap = {
      "landing-summary": "Landing",
      "dashboard-alert": "Dashboard",
      "module-update": "Module",
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
      "submission-update": "Submission",
      todo: "Todo",
      "todo-assigned": "Todo",
      "todo-completed-ack": "Todo",
      email: "Email",
      "customer-payment": "Customer payment",
      "backend-upload-exception": "Backend",
      "mis-schedule-failed": "MIS",
      "issue-assigned": "Issue",
      "issue-approval-requested": "Issue",
      "issue-approval-decision": "Issue",
      "issue-created-manager": "Issue",
      "issue-manager-approval-request": "Issue",
      "issue-approver-request": "Issue",
      "issue-correction-required": "Issue",
      "issue-resolution-review-required": "Issue",
      "issue-resolution-rejected": "Issue",
      "issue-resolution-accepted": "Issue",
      "issue-approval-cancelled": "Issue",
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
      "ai-activity": "AI Activity",
      "strategy-master-update": "Strategy",
      "support-ticket-assigned": "Support",
      "support-ticket-update": "Support",
      "support-sla-risk": "Support",
      "task-completed": "Task",
      manager: "Manager"
    };

    const getTypeLabel = (type) => typeLabelMap[String(type || "").toLowerCase()] || "Update";

    const buildTitle = (note = {}) => {
      const type = String(note.type || "").toLowerCase();
      const details = toArray(note.details);
      const customer = getDetailValue(details, "Customer");
      const invoice = getDetailValue(details, "Invoice");
      const cheque = getDetailValue(details, "Cheque");
      const chequeNo = getDetailValue(details, "Cheque no");
      const subject = getDetailValue(details, "Subject");
      const visitDate = getDetailValue(details, "Visit date");
      const assignee = getDetailValue(details, "Assignee");

      if (type === "pdc" || type === "pdc-reminder" || type === "pdc-bounced" || type === "pdc-handoff") {
        if (type === "pdc-bounced") {
          const chequeRef = chequeNo || cheque;
          return chequeRef ? `Cheque ${chequeRef} bounced` : "Cheque bounced";
        }
        if (type === "pdc-handoff") {
          const toStatus = getDetailValue(details, "To status");
          return toStatus ? `PDC moved to ${toStatus}` : "PDC status handoff";
        }
        const base = type === "pdc-reminder" ? "PDC reminder" : "PDC update";
        if (cheque && customer) return `${base} - ${cheque} - ${customer}`;
        if (cheque) return `${base} - ${cheque}`;
        if (invoice && customer) return `${base} - ${invoice} - ${customer}`;
        if (invoice) return `${base} - ${invoice}`;
        if (customer) return `${base} - ${customer}`;
        return base;
      }
      if (type === "visit-approval" || type === "visit-approval-pending" || type === "visit-plan-approved" || type === "visit-replan-required") {
        const base = type === "visit-plan-approved"
          ? "Visit plan approved"
          : (type === "visit-replan-required" ? "Visit plan rejected" : "Visit approval pending");
        return visitDate ? `${base} - ${visitDate}` : base;
      }
      if (type === "email") {
        const base = "Email";
        if (subject) return `${base} - ${subject}`;
        if (invoice) return `${base} - ${invoice}`;
        if (customer) return `${base} - ${customer}`;
        return base;
      }
      if (type === "todo") {
        if (assignee) return `Todo reminder - ${assignee}`;
        return "Todo reminder";
      }
      if (type === "todo-assigned") return "Task assigned";
      if (type === "todo-completed-ack") return "Task completed";
      if (type === "customer-payment") {
        const base = "Customer payment submitted";
        if (invoice && customer) return `${base} - ${invoice} - ${customer}`;
        if (invoice) return `${base} - ${invoice}`;
        if (customer) return `${base} - ${customer}`;
        return base;
      }
      if (type === "commitment") return String(note.title || "Commitment update");
      if (type === "commitment-approved") {
        const base = "Commitment approved";
        if (invoice && customer) return `${base} - ${invoice} - ${customer}`;
        if (invoice) return `${base} - ${invoice}`;
        if (customer) return `${base} - ${customer}`;
        return base;
      }
      if (type === "commitment-submitted") return "Commitment submitted for approval";
      if (type === "commitment-rejected") return "Commitment rejected";
      if (type === "issue-assigned") return "Issue assigned";
      if (type === "issue-approval-requested") return "Issue approval requested";
      if (type === "issue-approval-decision") return "Issue approval decision";
      if (type === "issue-created-manager") return "Issue created";
      if (type === "issue-manager-approval-request") return "Manager approval request";
      if (type === "issue-approver-request") return "Approver request";
      if (type === "issue-correction-required") return "Correction required";
      if (type === "issue-resolution-review-required") return "Resolution review required";
      if (type === "issue-resolution-rejected") return "Resolution rejected";
      if (type === "issue-resolution-accepted") return "Resolution accepted";
      if (type === "issue-approval-cancelled") return "Approval cancelled";
      if (type === "issue-manager-approved") return "Issue manager approval";
      if (type === "issue-approval-forwarded") return "Issue approval forwarded";
      if (type === "issue-approval-rejected") return "Issue approval rejected";
      if (type === "issue-resolution-provided") return "Issue resolution provided";
      if (type === "issue-ticket-closed") return "Issue ticket closed";
      if (type === "issue-assignment-updated") return "Issue assignment updated";
      if (type === "issue-approval-process-saved") return "Issue approval process saved";
      if (type === "issue-remark-added") return "Issue remark added";
      if (type === "issue-reopened") return "Issue reopened";
      if (type === "backend-upload-exception") return "Backend upload exception";
      if (type === "mis-schedule-failed") return "MIS schedule failed";
      if (type === "credit-limit-request") return "Credit limit request submitted";
      if (type === "credit-limit-decision") return "Credit limit decision";
      if (type === "credit-utilization-breach") return "Credit utilization breach";
      if (type === "support-ticket-assigned") return "Support ticket assigned";
      if (type === "support-ticket-update") return "Support ticket updated";
      if (type === "support-sla-risk") return "Support SLA risk";
      if (type === "task-completed") {
        const base = "Task completed";
        if (invoice && customer) return `${base} - ${invoice} - ${customer}`;
        if (invoice) return `${base} - ${invoice}`;
        if (customer) return `${base} - ${customer}`;
        return base;
      }
      if (type === "manager") {
        const base = "Manager update";
        if (invoice) return `${base} - ${invoice}`;
        return base;
      }
      if (note.title) return String(note.title);
      if (invoice && customer) return `Update - ${invoice} - ${customer}`;
      return "Update";
    };

    const getDefaultRoute = (note = {}) => {
      const type = String(note.type || "").toLowerCase();
      const details = toArray(note.details);
      const cta = toArray(note.ctas)[0] || {};
      const invoiceNo = cta.invoiceNo || getDetailValue(details, "Invoice") || note.invoiceNo || "";
      if (cta.action || cta.href || cta.url) {
        return {
          label: cta.label || "View",
          action: cta.action === "open-url" ? "link" : (cta.action || "link"),
          href: cta.href || cta.url || "",
          invoiceNo
        };
      }

      const route = { label: type === "commitment" ? "Open commitment" : "Open", action: "", href: "", invoiceNo };
      if (type === "visit-approval" || type === "visit-approval-pending") return { ...route, action: "link", href: "pages/visitmoduleReview.html" };
      if (type === "visit-plan-approved" || type === "visit-replan-required") return { ...route, action: "link", href: "pages/visitmodule.html" };
      if (type === "pdc" || type === "pdc-reminder" || type === "pdc-bounced" || type === "pdc-handoff") return { ...route, action: "open-pdc" };
      if (type === "todo" || type === "todo-assigned" || type === "todo-completed-ack") return { ...route, action: "open-todo" };
      if (type === "email") return { ...route, action: "open-email" };
      if (type === "customer-payment") return { ...route, action: "open-disposition" };
      if (type === "commitment" || type === "commitment-approved") return { ...route, action: "open-invoice" };
      if (type === "commitment-submitted") return { ...route, action: "link", href: "pages/CommitmentManager.html" };
      if (type === "commitment-rejected") return { ...route, action: "link", href: "pages/commitment.html" };
      if (type === "issue-approval-requested" || type === "issue-approval-forwarded" || type === "issue-approver-request") return { ...route, action: "link", href: "pages/issuetrackerLP.html?view=my-work&role=approver" };
      if (type === "issue-manager-approval-request") return { ...route, action: "link", href: "pages/issuetrackerLP.html?view=my-work&role=manager" };
      if (type.startsWith("issue-")) return { ...route, action: "link", href: "pages/issuetrackerLP.html" };
      if (type === "backend-upload-exception") return { ...route, action: "link", href: "pages/LPbackend.html" };
      if (type === "mis-schedule-failed") return { ...route, action: "link", href: "pages/LPmis.html" };
      if (type === "credit-limit-request" || type === "credit-limit-decision" || type === "credit-utilization-breach") return { ...route, action: "link", href: "pages/credit-limit-dashboard.html" };
      if (type === "support-ticket-assigned" || type === "support-sla-risk") return { ...route, action: "link", href: "pages/support-admin.html" };
      if (type === "support-ticket-update") return { ...route, action: "link", href: "pages/help-support.html" };
      return route;
    };

    return {
      storageKey,
      load,
      save,
      normalizeNote,
      upsert,
      getVisible,
      markVisibleRead,
      getById,
      getTypeLabel,
      buildTitle,
      getDefaultRoute,
      normalizeAudienceUser
    };
  };

  window.IneburaNotificationCenter = window.IneburaNotificationCenter || createNotificationCenterManager();
  const notificationCenter = window.IneburaNotificationCenter;

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
    return role === "customer" ? "pages/LPcustomer.html" : "index.html";
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

  const commitmentContextPath = window.location.pathname.toLowerCase();
  const commitmentContextRole = commitmentContextPath.endsWith("/lpsupervisor.html") ? "supervisor"
    : commitmentContextPath.endsWith("/lpmanager.html") ? "manager"
      : commitmentContextPath.endsWith("/kas.html") ? "kas"
        : (sessionStorage.getItem("ineburaCommitmentViewRole")
          || localStorage.getItem("activeUserRole") || "").trim().toLowerCase();
  const supervisorCommitmentView = new URLSearchParams(window.location.search).get("view") === "supervisor"
    || commitmentContextRole === "supervisor";
  const commitmentReviewLabel = supervisorCommitmentView ? "Commitment - Supervisor"
    : commitmentContextRole === "manager" ? "Commitment - Manager" : "Commitment - Review";
  const commitmentReviewPath = supervisorCommitmentView
    ? "pages/CommitmentManager.html?view=supervisor" : "pages/CommitmentManager.html";

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
    <a class="headerAppSwitch" href="${resolvePath("pages/admin.html?module=dashboard")}">go to admin app</a>
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
          <a class="submenu-link" href="${resolvePath("pages/visitmoduleReview.html")}" data-module="visit-manager-plan">Manager Visit Plan</a>
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
          <a class="submenu-link" href="${resolvePath("index.html")}" data-module="landing-agent">Landing Page - Agent</a>
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
          <a class="submenu-link" href="${resolvePath(commitmentReviewPath)}" data-module="commitment-manager">${commitmentReviewLabel}</a>
        </div>
      </li>
      <li class="menu-item">
        <a class="nav-link" href="${resolvePath("pages/ai-activity-center.html")}" data-module="ai-activity-center">
          <span class="link-content">
            <i class="bi bi-stars" aria-hidden="true"></i>
            <span>AI Activity Center</span>
          </span>
        </a>
      </li>
      <li class="menu-item">
        <a class="nav-link" href="${resolvePath("pages/strategy-master.html")}" data-module="strategy-master">
          <span class="link-content">
            <i class="bi bi-diagram-3" aria-hidden="true"></i>
            <span>Strategy Master</span>
          </span>
        </a>
      </li>
      <li class="menu-item">
        <a class="nav-link" href="${resolvePath("pages/reports.html")}" data-module="reports">
          <span class="link-content">
            <i class="bi bi-bar-chart-line" aria-hidden="true"></i>
            <span>Reports</span>
          </span>
        </a>
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
          <a class="submenu-link" href="${resolvePath("pages/credit-limit-assessment.html")}" data-module="credit-limit-assessment">Assessment Cockpit</a>
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

      const hasDirectoryEmail = (value) => {
        const normalized = String(value || "").trim();
        return normalized !== "" && normalized !== "-";
      };

      const buildEmailBadge = (entry) => {
        if (!hasDirectoryEmail(entry.email)) return null;
        const isActive = entry.useEmailForCommunication === true;
        const label = isActive
          ? "Email communication enabled"
          : "Email available but communication disabled";
        const badge = document.createElement("span");
        badge.className = `directoryEmailBadge ${isActive ? "is-active" : "is-inactive"}`;
        badge.setAttribute("role", "img");
        badge.setAttribute("aria-label", label);
        badge.setAttribute("title", label);
        const icon = document.createElement("i");
        icon.className = "bi bi-envelope-fill";
        icon.setAttribute("aria-hidden", "true");
        badge.appendChild(icon);
        return badge;
      };

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
        const statusStack = document.createElement("div");
        statusStack.className = "directoryStatusStack";
        statusStack.appendChild(tag);
        const emailBadge = buildEmailBadge(entry);
        if (emailBadge) statusStack.appendChild(emailBadge);
        body.appendChild(title);
        body.appendChild(meta);
        row.appendChild(body);
        row.appendChild(statusStack);
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
          const landingDestination = activeRole === "customer" ? "pages/LPcustomer.html" : "index.html";
          const destinations = {
            visit: "pages/visitmodule.html",
            "visit-review": "pages/visitmoduleReview.html",
            "visit-manager-plan": "pages/visitmoduleReview.html",
            landing: landingDestination,
            "landing-agent": "index.html",
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
            "issue-approver": "pages/issuetrackerLP.html?view=my-work&role=manager",
            "issue-approval-request": "pages/issuetrackerLP.html?view=my-work&role=manager",
            "submission-module": "pages/submission.html",
            "pdc-agent": "pages/PDCagent.html",
            "pdc-ops": "pages/PDCOps.html",
            "commitment-agent": "pages/commitment.html",
            "commitment-manager": commitmentReviewPath,
            "ai-activity-center": "pages/ai-activity-center.html",
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

      const notificationCenterKey = notificationCenter.storageKey;
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

      const loadNotifications = () => notificationCenter.load();

      const saveNotifications = (list) => notificationCenter.save(list);

      const readStoredArray = (key) => {
        try {
          const raw = localStorage.getItem(key);
          const parsed = JSON.parse(raw || "[]");
          return Array.isArray(parsed) ? parsed : [];
        } catch (_) {
          return [];
        }
      };

      const normalizeAudienceUser = (value) => notificationCenter.normalizeAudienceUser(value);

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
        return notificationCenter.getVisible({
          audience: getNotificationAudience(),
          activeUser: getActiveNotificationUser(),
          normalizeDueScheduled: false
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

      const buildNotificationTitle = (note, details) => notificationCenter.buildTitle({ ...note, details });

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

      const appendDummyModuleNotifications = () => {
        const loadedNotifications = loadNotifications();
        const notifications = loadedNotifications.filter((note) => {
          const id = String(note?.id || "").toLowerCase();
          return !id.startsWith("dummy-issue-")
            && id !== "dummy-module-issue-approver"
            && id !== "dummy-module-issue-approval-request";
        });
        const existingIds = new Set(
          notifications
            .map((note) => String(note?.id || "").trim())
            .filter(Boolean)
        );
        const now = Date.now();
        const makeIso = (offsetMinutes) => new Date(now - (offsetMinutes * 60 * 1000)).toISOString();
        const details = (...rows) => rows.map(([label, value]) => ({ label, value }));
        const open = (label, href) => [{ label, action: "link", href }];
        const moduleDummyItems = [
          ["visit", "Visit Module", "pages/visitmodule.html", "Visit plan and route actions are ready for review."],
          ["visit-review", "Visit Module Review", "pages/visitmoduleReview.html", "Visit approvals are waiting in the manager review queue."],
          ["visit-manager-plan", "Manager Visit Plan", "pages/visitmoduleReview.html", "Manager visit plan has pending field-route updates."],
          ["landing", "Landing Page", "index.html", "Landing page workbench has refreshed portfolio actions."],
          ["landing-agent", "Landing Page - Agent", "index.html", "Agent landing page has new invoice follow-up actions."],
          ["landing-customer", "Landing Page - Customer", "pages/LPcustomer.html", "Customer landing page has new invoice and response updates."],
          ["landing-manager", "Landing Page - Manager", "pages/LPmanager.html", "Manager landing page has team exceptions to review."],
          ["landing-manager-drilldown", "Landing Page - Manager Drilldown", "pages/dashManager.html", "Manager drilldown has a fresh portfolio variance."],
          ["landing-supervisor", "Landing Page - Supervisor", "pages/LPsupervisor.html", "Supervisor landing page has queue allocation updates."],
          ["landing-kam", "Landing Page - KAM", "pages/KAM.html", "KAM landing page has strategic account alerts."],
          ["landing-kas", "Landing Page - KAS", "pages/KAS.html", "KAS landing page has account support follow-ups."],
          ["landing-backend", "Landing Page - Backend", "pages/LPbackend.html", "Backend landing page has upload exceptions to clear."],
          ["landing-mis", "Landing Page - MIS", "pages/LPmis.html", "MIS landing page has scheduled report actions."],
          ["dashboard-agent", "Dashboard - Agent", "pages/Dashboard_Agent.html", "Agent dashboard metrics have crossed a configured threshold."],
          ["dashboard-customer", "Dashboard - Customer", "pages/Dashboard_Customer.html", "Customer dashboard has a new statement activity update."],
          ["dashboard-manager", "Dashboard - Manager", "pages/dashManager.html", "Manager dashboard has a team-level collection variance."],
          ["dashboard-kam", "Dashboard - KAM", "pages/dashKAM.html", "KAM dashboard has strategic exposure movement."],
          ["dashboard-kas", "Dashboard - KAS", "pages/dashKAS.html", "KAS dashboard has support account activity."],
          ["dashboard-supervisor", "Dashboard - Supervisor", "pages/Dashboard_Supervisor.html", "Supervisor dashboard has allocation and aging updates."],
          ["dashboard-admin", "Dashboard - Admin", "pages/Dashboard_Admin.html", "Admin dashboard has control-panel exceptions."],
          ["issue-tracker", "Issue Tracker", "pages/issuetrackerLP.html", "Issue tracker has newly assigned action-owner work."],
          ["issue-matrix", "Escalation Matrix", "bin/IssueTracker/escalationMatrix.html", "Escalation matrix configuration has a pending review."],
          ["submission-module", "Submission Module", "pages/submission.html", "Submission module has invoice packets awaiting validation."],
          ["pdc-agent", "PDC Module - Agent", "pages/PDCagent.html", "PDC Agent module has cheque follow-up activity."],
          ["pdc-ops", "PDC Module - Ops", "pages/PDCOps.html", "PDC Ops module has handoff and banking updates."],
          ["commitment-agent", "Commitment - Agent", "pages/commitment.html", "Agent commitment module has revised PTP commitments."],
          ["commitment-manager", "Commitment - Manager", "pages/CommitmentManager.html", "Manager commitment module has submissions to approve."],
          ["ai-activity-center", "AI Activity Center", "pages/ai-activity-center.html", "AI Activity Center has generated follow-up suggestions."],
          ["strategy-master", "Strategy Master", "pages/strategy-master.html", "Strategy Master has template and rule changes to validate."],
          ["credit-limit-dashboard", "Credit Limit - Portfolio Overview", "pages/credit-limit-dashboard.html", "Credit portfolio overview has utilization changes."],
          ["credit-limit-assessment", "Credit Limit - Assessment Cockpit", "pages/credit-limit-assessment.html", "Assessment cockpit has a credit request awaiting review."],
          ["credit-limit-detail", "Credit Limit - Manage Credit Limits", "pages/credit-limit-detail.html", "Credit limit detail page has a customer limit action."],
          ["help-support", "Help & Support", "pages/help-support.html", "Help and support has a requester update."],
          ["support-admin", "Support Admin Portal", "pages/support-admin.html", "Support admin portal has SLA-risk tickets."]
        ].map(([key, moduleName, href, message], index) => ({
          id: `dummy-module-${key}`,
          type: "module-update",
          title: `${moduleName} notification`,
          message,
          createdAt: makeIso(43 + index),
          audience: ["all"],
          details: details(
            ["Module", moduleName],
            ["Route", href],
            ["Dummy source", "Shared navigation seed"]
          ),
          ctas: open("Open module", href)
        }));
        const dummyItems = [
          {
            id: "dummy-landing-summary-1",
            type: "landing-summary",
            title: "Landing page queue refreshed",
            message: "Agent landing page has new priority work items ready for review.",
            createdAt: makeIso(1),
            audience: ["all"],
            details: details(
              ["Module", "Landing Page - Agent"],
              ["Queue", "High-priority invoices"],
              ["New items", "12"]
            ),
            ctas: open("Open landing page", "index.html")
          },
          {
            id: "dummy-dashboard-alert-1",
            type: "dashboard-alert",
            title: "Dashboard threshold crossed",
            message: "Collection run-rate is below the daily target threshold for the active portfolio.",
            createdAt: makeIso(2),
            audience: ["all"],
            details: details(
              ["Module", "Dashboard - Agent"],
              ["Metric", "Run-rate gap"],
              ["Gap", "Rs. 4,80,000"]
            ),
            ctas: open("Open dashboard", "pages/Dashboard_Agent.html")
          },
          {
            id: "dummy-visit-approval-1",
            type: "visit-approval",
            title: "Visit approval pending",
            message: "A field visit plan needs manager review before it can be executed.",
            createdAt: makeIso(3),
            audience: ["all"],
            details: details(
              ["Visit date", "15 Apr"],
              ["Agent", "Rohit Malhotra"],
              ["Customer", "Apollo Pharmacy Pvt. Ltd."],
              ["Purpose", "High-value collection follow-up"]
            ),
            ctas: open("Review visit", "pages/visitmoduleReview.html")
          },
          {
            id: "dummy-visit-approval-pending-1",
            type: "visit-approval-pending",
            title: "Visit approval pending",
            message: "Manager approval is pending for tomorrow's visit plan.",
            createdAt: makeIso(4),
            audience: ["all"],
            details: details(
              ["Visit date", "16 Apr"],
              ["Customer", "BlueWave Distributors"],
              ["Route", "West cluster"]
            ),
            ctas: open("Open visit review", "pages/visitmoduleReview.html")
          },
          {
            id: "dummy-visit-plan-approved-1",
            type: "visit-plan-approved",
            title: "Visit plan approved",
            message: "Your visit plan has been approved and is ready for execution.",
            createdAt: makeIso(5),
            audience: ["all"],
            details: details(
              ["Visit date", "17 Apr"],
              ["Approved by", "Meera Iyer"],
              ["Customer", "Sunrise Retail"]
            ),
            ctas: open("Open visit module", "pages/visitmodule.html")
          },
          {
            id: "dummy-visit-replan-required-1",
            type: "visit-replan-required",
            title: "Visit plan rejected",
            message: "Visit plan needs rework because the route sequence conflicts with manager availability.",
            createdAt: makeIso(6),
            audience: ["all"],
            details: details(
              ["Visit date", "18 Apr"],
              ["Rejected by", "Manager"],
              ["Reason", "Route clash"]
            ),
            ctas: open("Replan visit", "pages/visitmodule.html")
          },
          {
            id: "dummy-submission-update-1",
            type: "submission-update",
            title: "Submission module update",
            message: "Three invoice submissions are awaiting validation in the submission module.",
            createdAt: makeIso(7),
            audience: ["all"],
            details: details(
              ["Module", "Submission Module"],
              ["Pending submissions", "3"],
              ["Oldest pending", "2 hours"]
            ),
            ctas: open("Open submission", "pages/submission.html")
          },
          {
            id: "dummy-pdc-1",
            type: "pdc",
            title: "PDC logged",
            message: "PDC logged and awaiting dispatch confirmation from the agent.",
            createdAt: makeIso(8),
            audience: ["all"],
            details: details(
              ["Customer", "Apollo Diagnostics"],
              ["Invoice", "INV-PDC-2001"],
              ["Cheque", "CHQ-77291"],
              ["Amount", "Rs. 2,80,000"],
              ["Status", "PDC logged"]
            ),
            ctas: [{ label: "Open PDC", action: "open-pdc", invoiceNo: "INV-PDC-2001" }]
          },
          {
            id: "dummy-pdc-reminder-1",
            type: "pdc-reminder",
            title: "PDC banking reminder",
            message: "Cheque date is approaching. Confirm banking readiness with PDC Ops.",
            createdAt: makeIso(9),
            audience: ["all"],
            details: details(
              ["Customer", "MediTrust Pvt Ltd"],
              ["Invoice", "INV-PDC-2002"],
              ["PDC date", "19 Apr"],
              ["Bank", "HDFC"]
            ),
            ctas: [{ label: "Open PDC", action: "open-pdc", invoiceNo: "INV-PDC-2002" }]
          },
          {
            id: "dummy-pdc-bounced-1",
            type: "pdc-bounced",
            title: "PDC bounced",
            message: "Banking update marked the PDC as bounced. Follow-up is required.",
            createdAt: makeIso(10),
            audience: ["all"],
            details: details(
              ["Customer", "Generix Holdings"],
              ["Invoice", "INV-PDC-2003"],
              ["Reason", "Insufficient funds"],
              ["Next action", "Request replacement cheque"]
            ),
            ctas: [{ label: "Open PDC", action: "open-pdc", invoiceNo: "INV-PDC-2003" }]
          },
          {
            id: "dummy-pdc-handoff-1",
            type: "pdc-handoff",
            title: "PDC handoff pending",
            message: "PDC record is ready for Ops handoff after dispatch details were updated.",
            createdAt: makeIso(11),
            audience: ["all"],
            details: details(
              ["Customer", "BlueWave Distributors"],
              ["Invoice", "INV-PDC-2004"],
              ["Courier", "BlueDart"],
              ["Tracking", "BD-442900"]
            ),
            ctas: [{ label: "Open PDC", action: "open-pdc", invoiceNo: "INV-PDC-2004" }]
          },
          {
            id: "dummy-commitment-1",
            type: "commitment",
            title: "Commitment update",
            message: "Customer commitment has been updated for the current collection week.",
            createdAt: makeIso(12),
            audience: ["all"],
            details: details(
              ["Customer", "Apollo Pharmacy Pvt. Ltd."],
              ["Invoice", "INV-2026-2201"],
              ["Week", "W16"],
              ["Committed Amount", "Rs. 1,75,000"]
            ),
            ctas: [{ label: "Open commitment", action: "open-invoice", invoiceNo: "INV-2026-2201" }]
          },
          {
            id: "dummy-commitment-approved-1",
            type: "commitment-approved",
            title: "Commitment approved",
            message: "Manager approved the commitment submitted for this invoice.",
            createdAt: makeIso(13),
            audience: ["all"],
            details: details(
              ["Customer", "Sunrise Retail"],
              ["Invoice", "INV-2026-2202"],
              ["Approved by", "Manager"],
              ["Amount", "Rs. 2,10,000"]
            ),
            ctas: [{ label: "Open commitment", action: "open-invoice", invoiceNo: "INV-2026-2202" }]
          },
          {
            id: "dummy-commitment-submitted-1",
            type: "commitment-submitted",
            title: "Commitment submitted",
            message: "A new commitment submission is waiting for manager action.",
            createdAt: makeIso(14),
            audience: ["all"],
            details: details(
              ["Customer", "Lumen Technologies"],
              ["Invoice", "INV-2026-2203"],
              ["Submitted by", "Agent"],
              ["Amount", "Rs. 3,60,000"]
            ),
            ctas: open("Open manager queue", "pages/CommitmentManager.html")
          },
          {
            id: "dummy-commitment-rejected-1",
            type: "commitment-rejected",
            title: "Commitment rejected",
            message: "Commitment was rejected and needs revised payment evidence.",
            createdAt: makeIso(15),
            audience: ["all"],
            details: details(
              ["Customer", "MonoChem Corp"],
              ["Invoice", "INV-2026-2204"],
              ["Rejected by", "Manager"],
              ["Reason", "Insufficient proof"]
            ),
            ctas: open("Open commitment", "pages/commitment.html")
          },
          {
            id: "dummy-todo-1",
            type: "todo",
            title: "Todo reminder",
            message: "Follow up on overdue promise-to-pay confirmation.",
            createdAt: makeIso(16),
            audience: ["all"],
            details: details(
              ["Task", "Call customer finance"],
              ["Due by", "Today 4:00 PM"],
              ["Owner", "Agent"]
            ),
            ctas: [{ label: "Open task", action: "open-todo" }]
          },
          {
            id: "dummy-todo-assigned-1",
            type: "todo-assigned",
            title: "Task assigned",
            message: "A manager assigned a task for invoice document validation.",
            createdAt: makeIso(17),
            audience: ["all"],
            details: details(
              ["Task", "Validate delivery challan"],
              ["Invoice", "INV-2026-2205"],
              ["Assigned by", "Manager"]
            ),
            ctas: [{ label: "Open task", action: "open-todo" }]
          },
          {
            id: "dummy-todo-completed-ack-1",
            type: "todo-completed-ack",
            title: "Task completed",
            message: "Assigned invoice follow-up task was marked complete.",
            createdAt: makeIso(18),
            audience: ["all"],
            details: details(
              ["Task", "Share POD copy"],
              ["Completed by", "Agent"],
              ["Invoice", "INV-2026-2206"]
            ),
            ctas: [{ label: "Open task", action: "open-todo" }]
          },
          {
            id: "dummy-email-1",
            type: "email",
            title: "Email draft ready",
            message: "Reminder email draft is ready for review before sending.",
            createdAt: makeIso(19),
            audience: ["all"],
            details: details(
              ["From", "collections@inebura.com"],
              ["To", "finance@apollopharmacy.com"],
              ["Subject", "Payment reminder for INV-2026-2207"],
              ["Invoice", "INV-2026-2207"]
            ),
            ctas: [{ label: "Open email", action: "open-email", invoiceNo: "INV-2026-2207" }]
          },
          {
            id: "dummy-backend-upload-exception-1",
            type: "backend-upload-exception",
            title: "Backend upload exception",
            message: "Invoice upload batch completed with rejected rows requiring backend review.",
            createdAt: makeIso(20),
            audience: ["all"],
            details: details(
              ["Module", "Landing Page - Backend"],
              ["Batch", "AR-APR-019"],
              ["Rejected rows", "8"]
            ),
            ctas: open("Open backend", "pages/LPbackend.html")
          },
          {
            id: "dummy-mis-schedule-failed-1",
            type: "mis-schedule-failed",
            title: "MIS schedule failed",
            message: "Scheduled MIS report did not complete and needs rerun.",
            createdAt: makeIso(21),
            audience: ["all"],
            details: details(
              ["Module", "Landing Page - MIS"],
              ["Report", "Daily collection pulse"],
              ["Failure", "Source file missing"]
            ),
            ctas: open("Open MIS", "pages/LPmis.html")
          },
          {
            id: "dummy-issue-assigned-1",
            type: "issue-assigned",
            title: "Issue assigned",
            message: "Issue ISS_2026_1001 assigned to you. Action required.",
            createdAt: makeIso(22),
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
            createdAt: makeIso(23),
            audience: ["all"],
            details: [
              { label: "Process", value: "High Value Escalation" },
              { label: "Matrix", value: "Collections Matrix A" },
              { label: "Level", value: "2" },
              { label: "Requested by", value: "Priya Verma" },
              { label: "SLA", value: "24 hours" }
            ],
            ctas: [
              { label: "Open approval request", action: "link", href: "pages/issuetrackerLP.html?view=my-work" }
            ]
          },
          {
            id: "dummy-issue-approval-decision-1",
            type: "issue-approval-decision",
            title: "Issue approval decision",
            message: "Issue ISS_2026_1002 approved. Next action assigned.",
            createdAt: makeIso(24),
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
            createdAt: makeIso(25),
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
            createdAt: makeIso(26),
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
            createdAt: makeIso(27),
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
              { label: "Open approval request", action: "link", href: "pages/issuetrackerLP.html?view=my-work" }
            ]
          },
          {
            id: "dummy-issue-approval-rejected-1",
            type: "issue-approval-rejected",
            title: "Issue approval rejected",
            message: "Approval rejected for issue ISS_2026_1005.",
            createdAt: makeIso(28),
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
            createdAt: makeIso(29),
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
            createdAt: makeIso(30),
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
            createdAt: makeIso(31),
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
            createdAt: makeIso(32),
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
            createdAt: makeIso(33),
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
            createdAt: makeIso(34),
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
          },
          {
            id: "dummy-ai-activity-1",
            type: "ai-activity",
            title: "AI activity ready",
            message: "AI activity center has a fresh suggestion batch for collection follow-ups.",
            createdAt: makeIso(35),
            audience: ["all"],
            details: details(
              ["Module", "AI Activity Center"],
              ["Suggestions", "9"],
              ["Confidence", "High"]
            ),
            ctas: open("Open AI activity", "pages/ai-activity-center.html")
          },
          {
            id: "dummy-strategy-master-update-1",
            type: "strategy-master-update",
            title: "Strategy rule updated",
            message: "A strategy template rule was updated and is ready for validation.",
            createdAt: makeIso(36),
            audience: ["all"],
            details: details(
              ["Module", "Strategy Master"],
              ["Rule", "High-value invoice reminder"],
              ["Channel", "Email"]
            ),
            ctas: open("Open strategy master", "pages/strategy-master.html")
          },
          {
            id: "dummy-credit-limit-request-1",
            type: "credit-limit-request",
            title: "Credit limit request",
            message: "A customer credit limit revision request is awaiting assessment.",
            createdAt: makeIso(37),
            audience: ["all"],
            details: details(
              ["Customer", "Apollo Pharmacy Pvt. Ltd."],
              ["Current limit", "Rs. 50,00,000"],
              ["Requested limit", "Rs. 65,00,000"]
            ),
            ctas: open("Open assessment", "pages/credit-limit-assessment.html")
          },
          {
            id: "dummy-credit-limit-decision-1",
            type: "credit-limit-decision",
            title: "Credit limit decision",
            message: "Credit limit recommendation has been approved for portfolio update.",
            createdAt: makeIso(38),
            audience: ["all"],
            details: details(
              ["Customer", "Sunrise Retail"],
              ["Decision", "Approved"],
              ["Approved limit", "Rs. 28,00,000"]
            ),
            ctas: open("Open credit dashboard", "pages/credit-limit-dashboard.html")
          },
          {
            id: "dummy-credit-utilization-breach-1",
            type: "credit-utilization-breach",
            title: "Credit utilization breach",
            message: "Customer utilization crossed the configured risk threshold.",
            createdAt: makeIso(39),
            audience: ["all"],
            details: details(
              ["Customer", "BlueWave Distributors"],
              ["Utilization", "92%"],
              ["Threshold", "85%"]
            ),
            ctas: open("Open credit detail", "pages/credit-limit-detail.html")
          },
          {
            id: "dummy-support-ticket-assigned-1",
            type: "support-ticket-assigned",
            title: "Support ticket assigned",
            message: "A support ticket has been assigned to the admin queue.",
            createdAt: makeIso(40),
            audience: ["all"],
            details: details(
              ["Ticket", "SUP-2026-1041"],
              ["Category", "Access"],
              ["Priority", "High"]
            ),
            ctas: open("Open support admin", "pages/support-admin.html")
          },
          {
            id: "dummy-support-ticket-update-1",
            type: "support-ticket-update",
            title: "Support ticket updated",
            message: "The requester added new details to an open help ticket.",
            createdAt: makeIso(41),
            audience: ["all"],
            details: details(
              ["Ticket", "SUP-2026-1042"],
              ["Category", "PDC"],
              ["Update", "Screenshot attached"]
            ),
            ctas: open("Open help support", "pages/help-support.html")
          },
          {
            id: "dummy-support-sla-risk-1",
            type: "support-sla-risk",
            title: "Support SLA risk",
            message: "A high-priority support case is nearing SLA breach.",
            createdAt: makeIso(42),
            audience: ["all"],
            details: details(
              ["Ticket", "SUP-2026-1043"],
              ["Remaining SLA", "45 minutes"],
              ["Owner", "Support Admin"]
            ),
            ctas: open("Open support admin", "pages/support-admin.html")
          },
          ...moduleDummyItems
        ];

        let changed = notifications.length !== loadedNotifications.length;
        dummyItems.forEach((item) => {
          const itemId = String(item?.id || "").toLowerCase();
          const itemType = String(item?.type || "").toLowerCase();
          if (itemType.startsWith("issue-") || itemId === "dummy-module-issue-approver" || itemId === "dummy-module-issue-approval-request") return;
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
            workflowStep: issue?.workflowStep || previous.workflowStep || "",
            assignedTo: issue?.assignedTo || previous.assignedTo || "",
            initialVisibilityReleased: Boolean(
              issue?.initialVisibilityReleased
              || issue?.visibilityReleasedAt
              || issue?.skipManagerApproval
              || previous.initialVisibilityReleased
            ),
            actionTrail: Array.isArray(issue?.actionTrail) && issue.actionTrail.length
              ? issue.actionTrail
              : (Array.isArray(previous.actionTrail) ? previous.actionTrail : [])
          });
        });

        issueById.forEach((issue) => {
          const issueId = issue?.id || "";
          const managerRaw = issue?.manager || "";
          const createdAt = issue?.createdAt || issue?.updatedAt || new Date().toISOString();
          const published = Boolean(issue?.initialVisibilityReleased);
          const issueHref = (role, user) => `pages/issuetrackerdetail.html?invoice=${encodeURIComponent(issue?.invoiceNo || "")}&issue=${encodeURIComponent(issueId)}&role=${encodeURIComponent(role)}&user=${encodeURIComponent(user || "")}`;
          if (!published) {
            const allowedRecipients = new Set(uniqueRecipients(issue?.agent || "", managerRaw).map(normalizeAudienceUser));
            byId.forEach((note, noteId) => {
              const noteType = String(note?.type || "").toLowerCase();
              const details = Array.isArray(note?.details) ? note.details : [];
              const referencedIssue = details.find((detail) => ["issue", "issue id"].includes(String(detail?.label || "").toLowerCase()))?.value;
              if (!noteType.startsWith("issue-") || String(referencedIssue || "") !== String(issueId)) return;
              const recipients = uniqueRecipients(note?.audienceUsers || []).map(normalizeAudienceUser);
              if (recipients.some((recipient) => !allowedRecipients.has(recipient))) byId.delete(noteId);
            });
          }

          if (managerRaw && issue?.workflowStep === "manager-review") {
            pushIssueNotification({
              id: `issue-manager-approval-request:${issueId}:${slugToken(managerRaw)}`,
              type: "issue-manager-approval-request",
              title: "Manager approval request",
              message: `${issue?.subStatus || "Issue"} is waiting for your review.`,
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
                { label: "Review issue", action: "link", href: issueHref("manager", managerRaw) }
              ]
            });
          }

          const assigneeRaw = published && issue?.workflowStep === "resolution-work"
            ? (issue?.assignedTo || issue?.actionOwner || "")
            : "";
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
                { label: "Open task", action: "link", href: issueHref("action-owner", assigneeRaw) }
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

            if (published && type === "assignment" && what.includes("assigned to action owner")) {
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

            if (published && type === "assigned" && what.includes("selected approval process")) {
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

            if (published && type === "remark" && (/^updated remark\b/.test(what) || what.includes("shared an update"))) {
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

            if (published && type === "approval" && (what.includes("approved the issue") || what.includes("accepted the new issue")) && !entry?.approvalKey) {
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

            if (published && type === "resolution" && what.includes("provided a resolution")) {
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

            if (published && type === "closure" && what.includes("closed the issue")) {
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

            if (published && type === "reopen") {
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
          const published = Boolean(issueContext?.initialVisibilityReleased);
          const issueDetailHref = `pages/issuetrackerdetail.html?invoice=${encodeURIComponent(issueInvoice)}&issue=${encodeURIComponent(issueId)}&role=approver&user=${encodeURIComponent(ownerTarget)}`;

          if (published && status === "pending" && ownerTarget) {
            pushIssueNotification({
              id: `issue-approval-requested:${reqId}:level-${level}`,
              type: "issue-approver-request",
              title: "Approver request",
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
                { label: "Open issue", action: "link", href: issueDetailHref }
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
              const isManagerApproval = managerNorm && actorNorm && managerNorm === actorNorm;
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
              if (published && nextTarget) {
                const nextIssueHref = `pages/issuetrackerdetail.html?invoice=${encodeURIComponent(issueInvoice)}&issue=${encodeURIComponent(issueId)}&role=approver&user=${encodeURIComponent(nextTarget)}`;
                pushIssueNotification({
                  id: `issue-approval-forwarded:${reqId}:${eventKey}`,
                  type: "issue-approver-request",
                  title: "Approver request",
                  message: `Approval moved to next level for issue ${issueId || "-"}.`,
                  createdAt: entryAt,
                  audienceUsers: [nextTarget],
                  details: [
                    { label: "Issue ID", value: issueId || "-" },
                    { label: "Process", value: req?.processName || req?.processId || "-" },
                    { label: "From level", value: String(entryLevel) },
                    { label: "To level", value: String(entryLevel + 1) },
                    { label: "Approved by", value: actor || "-" },
                    { label: "Next approver", value: nextTarget || "-" }
                  ],
                  ctas: [
                    { label: "Open issue", action: "link", href: nextIssueHref }
                  ]
                });
              }
            }

            if (published && action === "rejected") {
              pushIssueNotification({
                id: `issue-approval-rejected:${reqId}:${eventKey}`,
                type: "issue-correction-required",
                title: "Correction required",
                message: `Approval rejected for issue ${issueId || "-"}.`,
                createdAt: entryAt,
                audienceUsers: [agentUser, managerUser],
                details: [
                  { label: "Issue ID", value: issueId || "-" },
                  { label: "Level", value: String(entryLevel) },
                  { label: "Rejected by", value: actor || "-" },
                  { label: "Reason", value: trailEntry?.remark || "-" },
                  { label: "Next action", value: agentUser || "-" }
                ],
                ctas: [
                  { label: "Open issue", action: "link", href: "pages/issuetrackerLP.html" }
                ]
              });
            }
          });

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

          const type = String(note.type || "").toLowerCase();
          const ctas = Array.isArray(note.ctas) ? note.ctas : [];
          const defaultRoute = notificationCenter.getDefaultRoute({ ...note, details: detailRows });
          const invoiceValue = defaultRoute.invoiceNo || getDetailValue(detailRows, "Invoice") || note.invoiceNo || "";
          const defaultAction = defaultRoute.action || "";
          const defaultHref = defaultRoute.href || "";
          const ctaList = ctas.length
            ? ctas.map((cta) => ({
                ...cta,
                action: cta.action === "open-url" ? "link" : (cta.action || (cta.url ? "link" : "")),
                href: cta.href || cta.url || ""
              }))
            : (defaultAction
              ? [{ label: defaultRoute.label || (type === "commitment" ? "Open commitment" : "Open"), action: defaultAction, href: defaultHref, invoiceNo: invoiceValue }]
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
          const typeLabel = notificationCenter.getTypeLabel(type);
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
          appendDummyModuleNotifications();
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
          saveNotifications(updated);
          updateNotificationBadge();
          renderNotificationPopup();
        });
      }

      if (notificationList) {
        notificationList.addEventListener("click", (event) => {
          const runAction = (action, href) => {
            const role = String(localStorage.getItem("activeUserRole") || "").trim().toLowerCase();
            const landingPath = role === "customer" ? "pages/LPcustomer.html" : "index.html";
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
            saveNotifications(updated);
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
      appendDummyModuleNotifications();
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
          appendDummyModuleNotifications();
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
