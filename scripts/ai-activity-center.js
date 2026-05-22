(() => {
  const actionTypeMeta = {
    activity: { label: "Activity", icon: "bi-check2-circle" },
    email: { label: "Email", icon: "bi-envelope" },
    reminder: { label: "Reminder", icon: "bi-bell" },
    visit: { label: "Visit", icon: "bi-geo-alt" }
  };

  const actions = [
    {
      id: "ai-10291-activity-ptp",
      invoiceNo: "INV-10291",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 124000,
      netDue: 98000,
      invoiceDate: "12 Oct 2025",
      dueDate: "05 Nov 2025",
      primaryStatus: "PTP",
      subStatus: "PTP",
      previousStatus: "Within Credit Period/Days",
      type: "activity",
      label: "Call Back/Email Follow up",
      source: "Activity - PTP",
      evidence: "PTP date was recorded for 28 May 2026 and the invoice is still open.",
      actionDetail: "Create a follow-up activity on the invoice and keep the status mapped to the disposition sheet.",
      scheduledAt: "28 May 2026, 10:00 AM",
      confidence: 92,
      risk: "Medium",
      email: null,
      timeline: [
        ["12 Nov 2025, 09:42 AM", "Email received", "Customer asked for revised payment date."],
        ["11 Nov 2025, 04:30 PM", "Reminder sent", "PTP reminder shared with invoice copy."],
        ["07 Nov 2025, 11:32 AM", "Activity", "PTP captured by agent."]
      ]
    },
    {
      id: "ai-10291-email-draft",
      invoiceNo: "INV-10291",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 124000,
      netDue: 98000,
      invoiceDate: "12 Oct 2025",
      dueDate: "05 Nov 2025",
      primaryStatus: "PTP",
      subStatus: "PTP",
      previousStatus: "PTP",
      type: "email",
      label: "Draft response",
      source: "Email",
      evidence: "Customer asked for a revised payment timeline without payment proof.",
      actionDetail: "Open an AI drafted reply asking for confirmed payment date and payment proof once processed.",
      scheduledAt: "28 May 2026, 10:05 AM",
      confidence: 86,
      risk: "Low",
      email: {
        from: "Aditi Sharma <aditi@inebura.com>",
        to: "finance@apollopharmacy.com",
        cc: "Rohit Mehra <rohit.mehra@inebura.com>",
        subject: "Payment timeline confirmation for INV-10291",
        attachments: "Invoice_INV-10291.pdf",
        body: "Dear Team,\n\nPlease confirm the revised payment date for INV-10291 and share payment proof once processed.\n\nRegards,\nAditi Sharma"
      },
      timeline: [
        ["12 Nov 2025, 09:42 AM", "Email received", "Customer asked for revised payment date."],
        ["11 Nov 2025, 04:30 PM", "Reminder sent", "PTP reminder shared."]
      ]
    },
    {
      id: "ai-10211-activity-dc",
      invoiceNo: "INV-10211",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 210000,
      netDue: 210000,
      invoiceDate: "22 Sep 2025",
      dueDate: "06 Oct 2025",
      primaryStatus: "Further Docs Required",
      subStatus: "Delivery Challan Required",
      previousStatus: "Invoice Copy Required",
      type: "activity",
      label: "Delivery Challan Required",
      source: "Email",
      evidence: "Customer wrote that INV-10211 cannot be processed because the delivery challan is missing.",
      actionDetail: "Prefill activity as Delivery Challan Required and create the document support workflow.",
      scheduledAt: "Today, 02:00 PM",
      confidence: 91,
      risk: "Medium",
      email: null,
      timeline: [
        ["10 Nov 2025, 03:26 PM", "Email received", "Customer requested delivery challan copy."],
        ["08 Nov 2025, 03:28 PM", "Invoice trail", "Invoice still marked as document required."]
      ]
    },
    {
      id: "ai-10211-email-draft",
      invoiceNo: "INV-10211",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 210000,
      netDue: 210000,
      invoiceDate: "22 Sep 2025",
      dueDate: "06 Oct 2025",
      primaryStatus: "Further Docs Required",
      subStatus: "Delivery Challan Required",
      previousStatus: "Invoice Copy Required",
      type: "email",
      label: "Draft response",
      source: "Email",
      evidence: "Inbound email asks for delivery challan before invoice processing.",
      actionDetail: "Open a drafted reply acknowledging the request and confirming that the challan copy will be shared.",
      scheduledAt: "Today, 02:05 PM",
      confidence: 88,
      risk: "Low",
      email: {
        from: "Aditi Sharma <aditi@inebura.com>",
        to: "Anita Nair <finance@apollopharmacy.com>",
        cc: "Rohit Mehra <rohit.mehra@inebura.com>",
        subject: "Delivery challan for INV-10211",
        attachments: "Delivery_Challan_INV-10211.pdf",
        body: "Dear Anita,\n\nWe have noted the delivery challan requirement for INV-10211. We will share the challan copy and confirm dispatch details shortly.\n\nRegards,\nAditi Sharma"
      },
      timeline: [
        ["10 Nov 2025, 03:26 PM", "Email received", "Delivery challan requested."],
        ["06 Oct 2025", "Due date passed", "Invoice entered overdue bucket."]
      ]
    },
    {
      id: "ai-10211-visit-dc",
      invoiceNo: "INV-10211",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 210000,
      netDue: 210000,
      invoiceDate: "22 Sep 2025",
      dueDate: "06 Oct 2025",
      primaryStatus: "Further Docs Required",
      subStatus: "Delivery Challan Required",
      previousStatus: "Invoice Copy Required",
      type: "visit",
      label: "Invoice Submission",
      source: "Email",
      evidence: "Customer requested delivery challan support; a visit can close the document gap.",
      actionDetail: "Suggest customer in visit planner with reason Invoice Submission.",
      scheduledAt: "Next plan date",
      confidence: 80,
      risk: "Low",
      email: null,
      timeline: [
        ["10 Nov 2025, 03:26 PM", "Email received", "Delivery challan missing."],
        ["Visit module", "AI suggestion", "Submit Delivery Challan as requested."]
      ]
    },
    {
      id: "ai-10308-activity-collected",
      invoiceNo: "INV-10308",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 95000,
      netDue: 42000,
      invoiceDate: "04 Nov 2025",
      dueDate: "12 Nov 2025",
      primaryStatus: "PTP",
      subStatus: "PTP",
      previousStatus: "Call Back",
      type: "activity",
      label: "Collected",
      source: "Activity - PTP",
      evidence: "Future PTP date exists for this invoice and collection closure is the next possible disposition when payment is confirmed.",
      actionDetail: "Open activity panel prefilled as Collection Done / Collected / Collected.",
      scheduledAt: "28 May 2026, 05:00 PM",
      confidence: 84,
      risk: "Low",
      email: null,
      timeline: [
        ["Activity", "PTP", "PTP date is 28 May 2026."],
        ["AI suggestion", "Activity panel", "Collected pill shown for PTP follow-up."]
      ]
    },
    {
      id: "ai-10308-reminder",
      invoiceNo: "INV-10308",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 95000,
      netDue: 42000,
      invoiceDate: "04 Nov 2025",
      dueDate: "12 Nov 2025",
      primaryStatus: "PTP",
      subStatus: "PTP",
      previousStatus: "Call Back",
      type: "reminder",
      label: "Send reminder",
      source: "Activity - PTP",
      evidence: "PTP date is 28 May 2026 and invoice is still open.",
      actionDetail: "Send scheduled reminder email asking customer to confirm once payment is processed.",
      scheduledAt: "28 May 2026, 09:00 AM",
      confidence: 87,
      risk: "Low",
      email: {
        from: "Aditi Sharma <aditi@inebura.com>",
        to: "finance@apollopharmacy.com",
        cc: "-",
        subject: "Payment reminder for INV-10308",
        attachments: "Invoice_INV-10308.pdf",
        body: "Dear Team,\n\nThis is a reminder for the payment committed for INV-10308 on 28 May 2026. Please confirm once processed.\n\nRegards,\nAditi Sharma"
      },
      timeline: [
        ["Activity", "PTP", "Payment commitment date recorded."],
        ["Reminder", "Scheduled", "Reminder will run unless revoked."]
      ]
    },
    {
      id: "ai-30402-visit-cheque",
      invoiceNo: "INV-30402",
      customer: "Varun Beverages",
      agent: "Palak Choudhary",
      manager: "Mukesh Mishra",
      invoiceAmount: 152000,
      netDue: 152000,
      invoiceDate: "18 Nov 2025",
      dueDate: "02 Dec 2025",
      primaryStatus: "Collection In Progress",
      subStatus: "PDC Given",
      previousStatus: "PDC Given",
      type: "visit",
      label: "Collection follow up",
      source: "Email",
      evidence: "Customer asked the agent to collect cheques and share receipt confirmation.",
      actionDetail: "Suggest customer in visit planner with reason Collection follow up.",
      scheduledAt: "Next plan date",
      confidence: 82,
      risk: "Low",
      email: null,
      timeline: [
        ["12 Nov 2025, 12:01 PM", "Email received", "Customer confirmed cheque/PDC collection request."],
        ["Visit module", "AI suggestion", "Customer asked to collect cheques."]
      ]
    }
  ];

  const state = {
    role: "agent",
    activeAgent: "Aditi Sharma",
    expandedInvoice: "",
    activeActionByInvoice: {},
    drawerId: "",
    drawerView: "email",
    search: "",
    actionType: "all",
    scheduleState: "all",
    decisions: loadDecisions()
  };

  function loadDecisions() {
    try {
      return JSON.parse(localStorage.getItem("ineburaAiActivityDecisions") || "{}") || {};
    } catch (_) {
      return {};
    }
  }

  function saveDecisions() {
    try {
      localStorage.setItem("ineburaAiActivityDecisions", JSON.stringify(state.decisions));
    } catch (_) {}
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatINR(value) {
    return Number(value || 0).toLocaleString("en-IN");
  }

  function getDecision(action) {
    const decision = state.decisions[action.id] || { state: "scheduled", reason: "", reviewer: "", decidedAt: "" };
    if (decision.state === "approved") return { ...decision, state: "scheduled" };
    if (decision.state === "rejected") return { ...decision, state: "revoked" };
    if (!["scheduled", "revoked", "later"].includes(decision.state)) return { ...decision, state: "scheduled" };
    return decision;
  }

  function getScheduleLabel(action) {
    const decision = getDecision(action);
    if (decision.state === "revoked") return "Revoked";
    if (decision.state === "later") return "Review later";
    return "Scheduled";
  }

  function isActionVisibleBySchedule(action) {
    if (state.scheduleState === "all") return true;
    return getDecision(action).state === state.scheduleState;
  }

  function getScopedActions() {
    return actions.filter((action) => {
      if (state.role === "agent") return action.agent === state.activeAgent;
      return state.activeAgent === "all" || action.agent === state.activeAgent;
    });
  }

  function getVisibleActions() {
    const query = state.search.trim().toLowerCase();
    return getScopedActions().filter((action) => {
      if (state.actionType !== "all" && action.type !== state.actionType) return false;
      if (!isActionVisibleBySchedule(action)) return false;
      if (!query) return true;
      return [
        action.invoiceNo,
        action.customer,
        action.agent,
        action.primaryStatus,
        action.subStatus,
        action.previousStatus,
        action.label,
        action.source,
        action.evidence,
        action.actionDetail
      ].some((value) => String(value).toLowerCase().includes(query));
    });
  }

  function groupByInvoice(list) {
    const map = new Map();
    list.forEach((action) => {
      if (!map.has(action.invoiceNo)) {
        map.set(action.invoiceNo, {
          invoiceNo: action.invoiceNo,
          customer: action.customer,
          agent: action.agent,
          manager: action.manager,
          invoiceAmount: action.invoiceAmount,
          netDue: action.netDue,
          invoiceDate: action.invoiceDate,
          dueDate: action.dueDate,
          primaryStatus: action.primaryStatus,
          subStatus: action.subStatus,
          previousStatus: action.previousStatus,
          actions: []
        });
      }
      map.get(action.invoiceNo).actions.push(action);
    });
    return Array.from(map.values());
  }

  function getVisibleInvoices() {
    return groupByInvoice(getVisibleActions());
  }

  function renderAgentStrip() {
    const strip = document.getElementById("aiManagerStrip");
    const chips = document.getElementById("aiAgentChips");
    if (!strip || !chips) return;
    strip.classList.toggle("hidden", state.role !== "manager");
    if (state.role !== "manager") return;

    const agents = Array.from(new Set(actions.map((action) => action.agent)));
    chips.innerHTML = [
      agentChip("all", `All agents (${actions.length})`),
      ...agents.map((agent) => {
        const count = actions.filter((action) => action.agent === agent).length;
        return agentChip(agent, `${agent} (${count})`);
      })
    ].join("");
  }

  function agentChip(agent, label) {
    return `<button type="button" class="aiAgentChip ${state.activeAgent === agent ? "is-active" : ""}" data-agent="${escapeHtml(agent)}">${escapeHtml(label)}</button>`;
  }

  function renderMetrics() {
    const strip = document.getElementById("aiMetricStrip");
    if (!strip) return;
    const scoped = getScopedActions();
    const scheduled = scoped.filter((action) => getDecision(action).state === "scheduled").length;
    const revoked = scoped.filter((action) => getDecision(action).state === "revoked").length;
    const email = scoped.filter((action) => action.type === "email" || action.type === "reminder").length;
    const visits = scoped.filter((action) => action.type === "visit").length;
    strip.innerHTML = [
      ["Scheduled", scheduled],
      ["Revoked", revoked],
      ["Email actions", email],
      ["Visit suggestions", visits]
    ].map(([label, value]) => `
      <span class="aiMetricChip">
        <strong>${value}</strong>
        ${escapeHtml(label)}
      </span>
    `).join("");
  }

  function renderTable() {
    const tbody = document.getElementById("aiInvoiceTableBody");
    const subtitle = document.getElementById("aiTableSubtitle");
    if (!tbody) return;

    const visibleInvoices = getVisibleInvoices();
    const visibleActions = getVisibleActions();
    const scopeLabel = state.role === "manager"
      ? (state.activeAgent === "all" ? "all agents" : state.activeAgent)
      : state.activeAgent;

    if (subtitle) {
      subtitle.textContent = `${visibleInvoices.length} invoices, ${visibleActions.length} AI actions for ${scopeLabel}`;
    }

    if (!visibleInvoices.length) {
      tbody.innerHTML = `<tr><td class="aiEmptyRow" colspan="12">No invoices match the current view.</td></tr>`;
      return;
    }

    tbody.innerHTML = visibleInvoices.map((invoice) => tableRow(invoice)).join("");
  }

  function tableRow(invoice) {
    const selected = invoice.invoiceNo === state.expandedInvoice ? "is-selected" : "";
    return `
      <tr class="${selected}" data-invoice-no="${escapeHtml(invoice.invoiceNo)}" tabindex="0">
        <td><span class="aiCellStrong">${escapeHtml(invoice.invoiceNo)}</span></td>
        <td>${escapeHtml(invoice.customer)}</td>
        <td class="numericCell">Rs. ${formatINR(invoice.invoiceAmount)}</td>
        <td class="numericCell">Rs. ${formatINR(invoice.netDue)}</td>
        <td>${escapeHtml(invoice.invoiceDate)}</td>
        <td>${escapeHtml(invoice.dueDate)}</td>
        <td>${escapeHtml(invoice.primaryStatus)}</td>
        <td>${escapeHtml(invoice.subStatus)}</td>
        <td>${escapeHtml(invoice.previousStatus)}</td>
        <td>${renderActionSummary(invoice.actions)}</td>
        <td>${renderScheduleSummary(invoice.actions)}</td>
        <td>
          <button type="button" class="aiReviewBtn" data-review-invoice="${escapeHtml(invoice.invoiceNo)}">
            Review
          </button>
        </td>
      </tr>
      ${invoice.invoiceNo === state.expandedInvoice ? expandedRow(invoice) : ""}
    `;
  }

  function renderActionSummary(invoiceActions) {
    const counts = invoiceActions.reduce((acc, action) => {
      acc[action.type] = (acc[action.type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([type, count]) => {
      const meta = actionTypeMeta[type] || actionTypeMeta.activity;
      return `<span class="aiPill ${escapeHtml(type)}"><i class="bi ${meta.icon}" aria-hidden="true"></i>${escapeHtml(meta.label)}${count > 1 ? ` ${count}` : ""}</span>`;
    }).join(" ");
  }

  function renderScheduleSummary(invoiceActions) {
    const scheduled = invoiceActions.filter((action) => getDecision(action).state === "scheduled").length;
    const revoked = invoiceActions.filter((action) => getDecision(action).state === "revoked").length;
    const later = invoiceActions.filter((action) => getDecision(action).state === "later").length;
    return `
      <span class="aiPill scheduled">${scheduled} scheduled</span>
      ${revoked ? `<span class="aiPill revoked">${revoked} revoked</span>` : ""}
      ${later ? `<span class="aiPill later">${later} later</span>` : ""}
    `;
  }

  function expandedRow(invoice) {
    const activeAction = getActiveAction(invoice);
    return `
      <tr class="aiExpandedRow">
        <td colspan="12">
          <div class="aiExpandedPanel">
            <div class="aiSuggestionReview">
              <div>
                <h3>AI suggested actions</h3>
                <p>These actions are scheduled and will run unless revoked.</p>
              </div>
              <div class="aiSuggestionPillRow">
                ${invoice.actions.map((action) => actionPill(action, activeAction)).join("")}
              </div>
            </div>
            ${activeAction ? actionDetailPanel(activeAction) : ""}
          </div>
        </td>
      </tr>
    `;
  }

  function getActiveAction(invoice) {
    const activeId = state.activeActionByInvoice[invoice.invoiceNo];
    return invoice.actions.find((action) => action.id === activeId) || invoice.actions[0] || null;
  }

  function actionPill(action, activeAction) {
    const meta = actionTypeMeta[action.type] || actionTypeMeta.activity;
    const isActive = activeAction?.id === action.id ? "is-active" : "";
    const stateLabel = getScheduleLabel(action);
    return `
      <button type="button" class="aiActionPill ${isActive}" data-action-pill="${escapeHtml(action.id)}">
        <i class="bi ${meta.icon}" aria-hidden="true"></i>
        <span>${escapeHtml(action.label)}</span>
        <em>${escapeHtml(stateLabel)}</em>
      </button>
    `;
  }

  function actionDetailPanel(action) {
    const decision = getDecision(action);
    const meta = actionTypeMeta[action.type] || actionTypeMeta.activity;
    return `
      <div class="aiActionDetailPanel">
        <div class="aiActionDetailHead">
          <div>
            <span class="aiPill ${escapeHtml(action.type)}"><i class="bi ${meta.icon}" aria-hidden="true"></i>${escapeHtml(meta.label)}</span>
            <h3>${escapeHtml(action.label)}</h3>
            <p>${escapeHtml(getScheduleLabel(action))} for ${escapeHtml(action.scheduledAt || "next available slot")}</p>
          </div>
          <span class="aiPill ${escapeHtml(decision.state)}">${escapeHtml(getScheduleLabel(action))}</span>
        </div>
        <div class="aiDetailGrid">
          ${kv("Source", action.source)}
          ${kv("Evidence", action.evidence)}
          ${kv("Action that will happen", action.actionDetail)}
          ${kv("Confidence / Risk", `${action.confidence}% / ${action.risk}`)}
        </div>
        ${compactEmail(action)}
        <div class="aiTimeline compact">
          ${action.timeline.map(([time, title, body]) => `
            <div class="aiTimelineItem">
              <strong>${escapeHtml(title)}</strong>
              <span>${escapeHtml(time)} | ${escapeHtml(body)}</span>
            </div>
          `).join("")}
        </div>
        <div class="aiExpandedActions">
          <button type="button" class="aiDecisionBtn approve" data-decision="scheduled" data-id="${escapeHtml(action.id)}">
            <i class="bi bi-check2" aria-hidden="true"></i>
            Keep scheduled
          </button>
          ${action.email ? `
            <button type="button" class="aiGhostBtn" data-drawer="email" data-id="${escapeHtml(action.id)}">
              <i class="bi bi-envelope-paper" aria-hidden="true"></i>
              View email
            </button>
          ` : ""}
          <button type="button" class="aiDecisionBtn later" data-decision="later" data-id="${escapeHtml(action.id)}">
            <i class="bi bi-bookmark" aria-hidden="true"></i>
            Review later
          </button>
          <button type="button" class="aiDecisionBtn reject" data-open-reject="${escapeHtml(action.id)}">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
            Revoke
          </button>
        </div>
        <div class="aiRejectBox" id="aiRejectBox-${escapeHtml(action.id)}">
          <textarea data-reject-reason="${escapeHtml(action.id)}" placeholder="Reason for revoking this scheduled action...">${escapeHtml(decision.reason || "")}</textarea>
          <button type="button" class="aiDecisionBtn reject" data-decision="revoked" data-id="${escapeHtml(action.id)}">Confirm revoke</button>
        </div>
      </div>
    `;
  }

  function compactEmail(action) {
    if (!action.email) {
      return `<div class="aiCompactEmail"><strong>Email:</strong> No customer email will be sent for this action.</div>`;
    }

    return `
      <div class="aiCompactEmail">
        <div><strong>To:</strong> ${escapeHtml(action.email.to)}</div>
        <div><strong>Subject:</strong> ${escapeHtml(action.email.subject)}</div>
        <p>${escapeHtml(firstEmailLine(action.email.body))}</p>
      </div>
    `;
  }

  function firstEmailLine(body) {
    return String(body || "").split("\n").find((line) => line.trim()) || "";
  }

  function kv(label, value) {
    return `
      <div class="aiKv">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `;
  }

  function setDecision(id, nextState, reason = "") {
    state.decisions[id] = {
      state: nextState,
      reason,
      reviewer: state.role === "manager" ? "Manager reviewer" : state.activeAgent,
      decidedAt: new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    };
    saveDecisions();
    renderMetrics();
    renderTable();
    if (state.drawerId === id) renderDrawer();
  }

  function renderAll() {
    renderMetrics();
    renderAgentStrip();
    renderTable();
  }

  function wireEvents() {
    document.querySelectorAll("[data-role]").forEach((button) => {
      button.addEventListener("click", () => {
        state.role = button.dataset.role || "agent";
        state.activeAgent = state.role === "manager" ? "all" : "Aditi Sharma";
        state.expandedInvoice = "";
        closeDrawer();
        document.querySelectorAll("[data-role]").forEach((item) => {
          const active = item.dataset.role === state.role;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", active ? "true" : "false");
        });
        renderAll();
      });
    });

    const search = document.getElementById("aiSearchInput");
    const actionFilter = document.getElementById("aiActionFilter");
    const scheduleFilter = document.getElementById("aiScheduleFilter");

    if (search) search.addEventListener("input", () => { state.search = search.value; renderTable(); });
    if (actionFilter) actionFilter.addEventListener("change", () => {
      state.actionType = actionFilter.value;
      state.expandedInvoice = "";
      renderTable();
    });
    if (scheduleFilter) scheduleFilter.addEventListener("change", () => {
      state.scheduleState = scheduleFilter.value;
      state.expandedInvoice = "";
      renderTable();
    });

    document.addEventListener("click", (event) => {
      const agentChip = event.target.closest("[data-agent]");
      if (agentChip) {
        state.activeAgent = agentChip.dataset.agent || "all";
        state.expandedInvoice = "";
        closeDrawer();
        renderAll();
        return;
      }

      const actionPill = event.target.closest("[data-action-pill]");
      if (actionPill) {
        const action = actions.find((item) => item.id === actionPill.dataset.actionPill);
        if (action) {
          state.activeActionByInvoice[action.invoiceNo] = action.id;
          renderTable();
        }
        return;
      }

      const drawerButton = event.target.closest("[data-drawer]");
      if (drawerButton) {
        event.stopPropagation();
        state.drawerId = drawerButton.dataset.id || "";
        state.drawerView = drawerButton.dataset.drawer || "email";
        renderDrawer();
        return;
      }

      if (event.target.closest("[data-drawer-close]") || event.target.id === "aiDrawerOverlay") {
        closeDrawer();
        return;
      }

      const openReject = event.target.closest("[data-open-reject]");
      if (openReject) {
        const id = openReject.dataset.openReject;
        const box = document.getElementById(`aiRejectBox-${id}`);
        if (box) box.classList.add("is-open");
        return;
      }

      const decisionButton = event.target.closest("[data-decision]");
      if (decisionButton) {
        event.stopPropagation();
        const id = decisionButton.dataset.id;
        const nextState = decisionButton.dataset.decision;
        const reason = nextState === "revoked"
          ? (document.querySelector(`[data-reject-reason="${CSS.escape(id)}"]`)?.value || "Revoked by reviewer")
          : "";
        setDecision(id, nextState, reason);
        return;
      }

      const reviewButton = event.target.closest("[data-review-invoice]");
      if (reviewButton) {
        const nextInvoice = reviewButton.dataset.reviewInvoice || "";
        state.expandedInvoice = state.expandedInvoice === nextInvoice ? "" : nextInvoice;
        renderTable();
        return;
      }

      const row = event.target.closest("[data-invoice-no]");
      if (row) {
        state.expandedInvoice = state.expandedInvoice === row.dataset.invoiceNo ? "" : row.dataset.invoiceNo || "";
        renderTable();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      const row = event.target.closest("[data-invoice-no]");
      if (!row) return;
      state.expandedInvoice = row.dataset.invoiceNo || "";
      renderTable();
    });
  }

  function renderDrawer() {
    const overlay = document.getElementById("aiDrawerOverlay");
    const drawer = document.getElementById("aiDrawer");
    const action = actions.find((item) => item.id === state.drawerId);
    if (!overlay || !drawer || !action) return;

    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
    drawer.innerHTML = `
      <div class="aiDrawerHeader">
        <div>
          <div class="aiEyebrow">Email Preview</div>
          <h2>${escapeHtml(action.invoiceNo)}</h2>
          <p>${escapeHtml(action.customer)} | ${escapeHtml(action.label)}</p>
        </div>
        <button type="button" class="aiIconBtn" data-drawer-close aria-label="Close details">
          <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>
      </div>
      ${action.email ? renderFullEmail(action) : `
        <div class="aiReviewBox">
          <h3>No email for this action</h3>
          <p>This recommendation updates workflow only. No customer email will be sent.</p>
        </div>
      `}
    `;
  }

  function renderFullEmail(action) {
    return `
      <div class="aiEmailPreview">
        <div class="aiEmailMeta">
          <div><strong>From:</strong> ${escapeHtml(action.email.from)}</div>
          <div><strong>To:</strong> ${escapeHtml(action.email.to)}</div>
          <div><strong>CC:</strong> ${escapeHtml(action.email.cc)}</div>
          <div><strong>Subject:</strong> ${escapeHtml(action.email.subject)}</div>
          <div><strong>Attachments:</strong> ${escapeHtml(action.email.attachments)}</div>
        </div>
        <div class="aiEmailBody">${escapeHtml(action.email.body)}</div>
      </div>
    `;
  }

  function closeDrawer() {
    state.drawerId = "";
    const overlay = document.getElementById("aiDrawerOverlay");
    const drawer = document.getElementById("aiDrawer");
    if (overlay) {
      overlay.classList.add("hidden");
      overlay.setAttribute("aria-hidden", "true");
    }
    if (drawer) drawer.innerHTML = "";
  }

  wireEvents();
  renderAll();
})();
