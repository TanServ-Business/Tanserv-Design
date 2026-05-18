(() => {
  const actionTypeMeta = {
    status: { label: "Invoice update", icon: "bi-arrow-repeat" },
    reply: { label: "Email reply", icon: "bi-reply" },
    reminder: { label: "Reminder email", icon: "bi-bell" }
  };

  const actions = [
    {
      id: "ai-10291-status",
      invoiceNo: "INV-10291",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      kam: "Neha Kapoor",
      kas: "Arjun Rao",
      invoiceAmount: 124000,
      netDue: 98000,
      invoiceDate: "12 Oct 2025",
      dueDate: "05 Nov 2025",
      aging: "0-30",
      overdueText: "7 days overdue",
      currentStatus: "Submitted and tracking",
      primaryStatus: "No Due",
      subStatus: "Within Credit Period/Days",
      previousStatus: "PTP",
      recommendedStatus: "PTP follow-up required",
      type: "status",
      confidence: 92,
      risk: "High",
      recommendation: "Move invoice to PTP follow-up required and create a same-day call task.",
      summary: "The customer missed the promised payment date and asked for a revised timeline without payment proof.",
      expectedOutcome: "The invoice trail reflects the missed commitment and the agent gets a concrete follow-up action.",
      actionDetail: "Update invoice status to PTP follow-up required. Add activity note: customer missed payment commitment and requested revised date.",
      email: null,
      timeline: [
        ["12 Nov 2025, 09:42 AM", "Email received", "Customer asked for revised payment date."],
        ["11 Nov 2025, 04:30 PM", "Reminder sent", "PTP reminder shared with invoice copy."],
        ["07 Nov 2025, 11:32 AM", "Manager remark", "Confirm receipt of updated invoice copy."]
      ]
    },
    {
      id: "ai-10211-reply",
      invoiceNo: "INV-10211",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      kam: "Neha Kapoor",
      kas: "Arjun Rao",
      invoiceAmount: 210000,
      netDue: 210000,
      invoiceDate: "22 Sep 2025",
      dueDate: "06 Oct 2025",
      aging: "31-60",
      overdueText: "37 days overdue",
      currentStatus: "Not submitted and untouched",
      primaryStatus: "Further Docs Required",
      subStatus: "Invoice Copy Required",
      previousStatus: "Customer requested invoice copy",
      recommendedStatus: "Docs shared - awaiting confirmation",
      type: "reply",
      confidence: 88,
      risk: "Medium",
      recommendation: "Reply to the customer with invoice copy and ask for confirmation of receipt.",
      summary: "The inbound email explicitly asks for the invoice PDF before payment processing can continue.",
      expectedOutcome: "Customer receives the missing document and the invoice can move out of further-docs-required status.",
      actionDetail: "Send the prepared email reply and attach Invoice_INV-10211.pdf.",
      email: {
        from: "Aditi Sharma <aditi@inebura.com>",
        to: "Anita Nair <finance@apollopharmacy.com>",
        cc: "Rohit Mehra <rohit.mehra@inebura.com>",
        subject: "Invoice copy for INV-10211",
        attachments: "Invoice_INV-10211.pdf",
        body: "Dear Anita,\n\nPlease find attached the invoice copy for INV-10211 as requested.\n\nKindly confirm receipt and share the expected payment processing date so we can update the invoice record.\n\nRegards,\nAditi Sharma"
      },
      timeline: [
        ["12 Nov 2025, 10:15 AM", "Email received", "Customer requested invoice copy."],
        ["08 Nov 2025, 03:28 PM", "Invoice trail", "Invoice still marked as not submitted."],
        ["06 Oct 2025", "Due date passed", "Invoice entered overdue bucket."]
      ]
    },
    {
      id: "ai-10433-reminder",
      invoiceNo: "INV-10433",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      kam: "Neha Kapoor",
      kas: "Arjun Rao",
      invoiceAmount: 98000,
      netDue: 45000,
      invoiceDate: "25 Oct 2025",
      dueDate: "08 Nov 2025",
      aging: "0-30",
      overdueText: "4 days overdue",
      currentStatus: "Submitted and tracking",
      primaryStatus: "Guidance",
      subStatus: "Recommended For Legal",
      previousStatus: "Reminder sent",
      recommendedStatus: "Escalation reminder pending approval",
      type: "reminder",
      confidence: 79,
      risk: "High",
      recommendation: "Send escalation reminder with invoice copy and request payment proof or dispute reason.",
      summary: "The invoice is overdue, legal guidance has been recommended, and the last reminder has no response.",
      expectedOutcome: "Creates a documented final follow-up before legal escalation.",
      actionDetail: "Send an escalation reminder and keep the invoice in review until the customer replies.",
      email: {
        from: "Aditi Sharma <aditi@inebura.com>",
        to: "finance@apollopharmacy.com",
        cc: "Rohit Mehra <rohit.mehra@inebura.com>",
        subject: "Urgent payment follow-up for INV-10433",
        attachments: "Invoice_INV-10433.pdf",
        body: "Dear Team,\n\nThis is an urgent follow-up for INV-10433. The invoice is overdue and we have not received payment confirmation after the previous reminder.\n\nPlease share payment proof or a clear dispute reason by end of day so we can update the invoice status accordingly.\n\nRegards,\nAditi Sharma"
      },
      timeline: [
        ["10 Nov 2025, 11:06 AM", "Reminder sent", "Payment reminder shared."],
        ["08 Nov 2025", "Due date passed", "No payment received."],
        ["07 Nov 2025, 07:10 PM", "Issue tracker", "Escalation note created."]
      ]
    },
    {
      id: "ai-10270-reminder",
      invoiceNo: "INV-10270",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      kam: "Neha Kapoor",
      kas: "Arjun Rao",
      invoiceAmount: 86400,
      netDue: 86400,
      invoiceDate: "01 Nov 2025",
      dueDate: "16 Nov 2025",
      aging: "Not due",
      overdueText: "4 days to due",
      currentStatus: "Submitted and tracking",
      primaryStatus: "Part Collected",
      subStatus: "Part Payment Made",
      previousStatus: "Part payment recorded",
      recommendedStatus: "Pre-due reminder scheduled",
      type: "reminder",
      confidence: 84,
      risk: "Low",
      recommendation: "Send a polite pre-due reminder for the remaining balance.",
      summary: "Partial payment is recorded and the due date is approaching within the reminder window.",
      expectedOutcome: "Improves on-time collection probability without using an escalation tone.",
      actionDetail: "Send a pre-due reminder with the invoice copy attached.",
      email: {
        from: "Aditi Sharma <aditi@inebura.com>",
        to: "finance@apollopharmacy.com",
        cc: "-",
        subject: "Payment reminder for INV-10270",
        attachments: "Invoice_INV-10270.pdf",
        body: "Dear Team,\n\nThis is a gentle reminder that Rs. 86,400 remains due for INV-10270 by 16 Nov 2025.\n\nPlease confirm the payment schedule or share payment proof once processed.\n\nRegards,\nAditi Sharma"
      },
      timeline: [
        ["09 Nov 2025, 11:06 AM", "Email sent", "Prior payment reminder shared."],
        ["06 Nov 2025", "Payment update", "Part payment recorded."],
        ["01 Nov 2025", "Invoice created", "Invoice submitted for tracking."]
      ]
    },
    {
      id: "ai-20518-status",
      invoiceNo: "INV-20518",
      customer: "Blue Star Limited",
      agent: "Manish Kumar",
      manager: "Rohit Mehra",
      kam: "Mukesh Mishra",
      kas: "Riya Sen",
      invoiceAmount: 342000,
      netDue: 342000,
      invoiceDate: "19 Sep 2025",
      dueDate: "19 Oct 2025",
      aging: "0-30",
      overdueText: "24 days overdue",
      currentStatus: "Collection In Progress",
      primaryStatus: "Collection In Progress",
      subStatus: "Call Back",
      previousStatus: "Call Back",
      recommendedStatus: "Escalate to manager review",
      type: "status",
      confidence: 81,
      risk: "Medium",
      recommendation: "Escalate invoice for manager review because callback attempts have not produced a payment date.",
      summary: "Three callback attempts are logged and no PTP or dispute reason has been captured.",
      expectedOutcome: "Manager can decide whether to apply a stronger reminder or field visit.",
      actionDetail: "Add manager review flag and status note after repeated unsuccessful callbacks.",
      email: null,
      timeline: [
        ["12 Nov 2025, 01:20 PM", "Call back", "No answer from finance contact."],
        ["10 Nov 2025, 05:05 PM", "Call back", "Customer asked to call later."],
        ["07 Nov 2025, 02:15 PM", "Call back", "No PTP captured."]
      ]
    },
    {
      id: "ai-30402-reply",
      invoiceNo: "INV-30402",
      customer: "Varun Beverages",
      agent: "Palak Choudhary",
      manager: "Mukesh Mishra",
      kam: "Neha Kapoor",
      kas: "Arjun Rao",
      invoiceAmount: 152000,
      netDue: 152000,
      invoiceDate: "18 Nov 2025",
      dueDate: "02 Dec 2025",
      aging: "Not due",
      overdueText: "20 days to due",
      currentStatus: "Submitted and tracking",
      primaryStatus: "Collection In Progress",
      subStatus: "PDC Given",
      previousStatus: "PDC Given",
      recommendedStatus: "PDC confirmation awaited",
      type: "reply",
      confidence: 76,
      risk: "Low",
      recommendation: "Reply with PDC receipt confirmation request and ask for courier details.",
      summary: "Customer says PDC has been dispatched but did not include courier reference.",
      expectedOutcome: "PDC tracking details are captured before due date.",
      actionDetail: "Send reply asking for courier partner and tracking number.",
      email: {
        from: "Palak Choudhary <palak@inebura.com>",
        to: "collections@varunbeverages.com",
        cc: "-",
        subject: "PDC tracking details for INV-30402",
        attachments: "No attachment",
        body: "Dear Team,\n\nThank you for confirming PDC dispatch for INV-30402.\n\nPlease share the courier partner and tracking number so we can update the invoice record and monitor receipt.\n\nRegards,\nPalak Choudhary"
      },
      timeline: [
        ["12 Nov 2025, 12:01 PM", "Email received", "Customer confirmed PDC dispatch."],
        ["10 Nov 2025, 09:35 AM", "Status update", "PDC given marked by agent."],
        ["08 Nov 2025, 04:10 PM", "Reminder sent", "Requested PDC confirmation."]
      ]
    }
  ];

  const state = {
    role: "agent",
    activeAgent: "Aditi Sharma",
    expandedId: "",
    drawerId: "",
    drawerView: "email",
    search: "",
    actionType: "all",
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
      .replace(/"/g, "&quot;");
  }

  function formatINR(value) {
    return Number(value || 0).toLocaleString("en-IN");
  }

  function getDecision(action) {
    return state.decisions[action.id] || { state: "pending", reason: "", reviewer: "", decidedAt: "" };
  }

  function getScopedActions() {
    return actions.filter((action) => {
      if (state.role === "agent") return action.agent === state.activeAgent;
      return state.activeAgent === "all" || action.agent === state.activeAgent;
    });
  }

  function getVisibleActions() {
    const query = state.search.trim().toLowerCase();
    const base = getScopedActions();

    return base.filter((action) => {
      if (state.actionType !== "all" && action.type !== state.actionType) return false;
      if (!query) return true;
      return [
        action.invoiceNo,
        action.customer,
        action.agent,
        action.currentStatus,
        action.primaryStatus,
        action.subStatus,
        action.recommendation
      ].some((value) => String(value).toLowerCase().includes(query));
    });
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
    const pending = scoped.filter((action) => getDecision(action).state === "pending").length;
    const high = scoped.filter((action) => action.risk === "High").length;
    const replies = scoped.filter((action) => action.type === "reply").length;
    const reminders = scoped.filter((action) => action.type === "reminder").length;
    strip.innerHTML = [
      ["Pending", pending],
      ["High Risk", high],
      ["Email Replies", replies],
      ["Reminders", reminders]
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

    const visible = getVisibleActions();
    const scopeLabel = state.role === "manager"
      ? (state.activeAgent === "all" ? "all agents" : state.activeAgent)
      : state.activeAgent;

    if (subtitle) {
      subtitle.textContent = `${visible.length} AI actionable invoices for ${scopeLabel}`;
    }

    if (!visible.length) {
      tbody.innerHTML = `<tr><td class="aiEmptyRow" colspan="16">No invoices match the current view.</td></tr>`;
      return;
    }

    tbody.innerHTML = visible.map((action) => tableRow(action)).join("");
  }

  function tableRow(action) {
    const decision = getDecision(action);
    const meta = actionTypeMeta[action.type];
    const selected = action.id === state.expandedId ? "is-selected" : "";
    return `
      <tr class="${selected}" data-action-id="${escapeHtml(action.id)}" tabindex="0">
        <td><span class="aiCellStrong">${escapeHtml(action.invoiceNo)}</span></td>
        <td>${escapeHtml(action.customer)}</td>
        <td>${escapeHtml(action.agent)}</td>
        <td class="numericCell">Rs. ${formatINR(action.invoiceAmount)}</td>
        <td class="numericCell">Rs. ${formatINR(action.netDue)}</td>
        <td>${escapeHtml(action.invoiceDate)}</td>
        <td>${escapeHtml(action.dueDate)}</td>
        <td>${escapeHtml(action.overdueText)}</td>
        <td>${escapeHtml(action.currentStatus)}</td>
        <td>${escapeHtml(action.primaryStatus)}</td>
        <td>${escapeHtml(action.subStatus)}</td>
        <td>${escapeHtml(action.previousStatus)}</td>
        <td><span class="aiPill ${escapeHtml(action.type)}"><i class="bi ${meta.icon}" aria-hidden="true"></i>${escapeHtml(meta.label)}</span></td>
        <td>${action.confidence}%</td>
        <td><span class="aiPill ${escapeHtml(action.risk.toLowerCase())}">${escapeHtml(action.risk)}</span></td>
        <td>
          <button type="button" class="aiReviewBtn" data-review-id="${escapeHtml(action.id)}">
            Review
          </button>
          <span class="aiPill ${escapeHtml(decision.state)}">${decision.state === "approved" ? "Allowed" : escapeHtml(decision.state)}</span>
        </td>
      </tr>
      ${action.id === state.expandedId ? expandedRow(action) : ""}
    `;
  }

  function expandedRow(action) {
    const decision = getDecision(action);
    return `
      <tr class="aiExpandedRow">
        <td colspan="16">
          <div class="aiExpandedPanel">
            <div class="aiExpandedGrid">
              <div class="aiExpandedBox">
                <h3>AI summary</h3>
                <p><strong>Found:</strong> ${escapeHtml(action.summary)}</p>
                <p><strong>Expected outcome:</strong> ${escapeHtml(action.expectedOutcome)}</p>
              </div>
              <div class="aiExpandedBox">
                <h3>AI action</h3>
                <p>${escapeHtml(action.recommendation)}</p>
                ${compactEmail(action)}
              </div>
            </div>
            <div class="aiExpandedActions">
              <button type="button" class="aiGhostBtn" data-drawer="evidence" data-id="${escapeHtml(action.id)}">
                <i class="bi bi-clipboard-data" aria-hidden="true"></i>
                View evidence
              </button>
              <button type="button" class="aiGhostBtn" data-drawer="history" data-id="${escapeHtml(action.id)}">
                <i class="bi bi-clock-history" aria-hidden="true"></i>
                Activity trail
              </button>
              ${action.email ? `
                <button type="button" class="aiGhostBtn" data-drawer="email" data-id="${escapeHtml(action.id)}">
                  <i class="bi bi-envelope-paper" aria-hidden="true"></i>
                  View full email
                </button>
              ` : ""}
              <span class="aiExpandedSpacer"></span>
              <button type="button" class="aiDecisionBtn approve" data-decision="approved" data-id="${escapeHtml(action.id)}">
                <i class="bi bi-check2" aria-hidden="true"></i>
                Allow
              </button>
              <button type="button" class="aiDecisionBtn reject" data-open-reject="${escapeHtml(action.id)}">
                <i class="bi bi-x-lg" aria-hidden="true"></i>
                Reject
              </button>
              <button type="button" class="aiDecisionBtn later" data-decision="later" data-id="${escapeHtml(action.id)}">
                <i class="bi bi-bookmark" aria-hidden="true"></i>
                Review later
              </button>
            </div>
            <div class="aiRejectBox" id="aiRejectBox-${escapeHtml(action.id)}">
              <textarea data-reject-reason="${escapeHtml(action.id)}" placeholder="Add rejection reason...">${escapeHtml(decision.reason || "")}</textarea>
              <button type="button" class="aiDecisionBtn reject" data-decision="rejected" data-id="${escapeHtml(action.id)}">Confirm rejection</button>
            </div>
          </div>
        </td>
      </tr>
    `;
  }

  function compactEmail(action) {
    if (!action.email) {
      return `<p><strong>Email:</strong> No customer email will be sent.</p>`;
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

  function renderDecisionHistory(action, decision) {
    if (!decision.decidedAt) {
      return `
        <div class="aiTimelineItem">
          <strong>AI recommendation generated</strong>
          <span>Pending human review | ${escapeHtml(action.recommendation)}</span>
        </div>
      `;
    }
    return `
      <div class="aiTimelineItem">
        <strong>${decision.state === "approved" ? "Action allowed" : decision.state === "rejected" ? "Action rejected" : "Marked review later"}</strong>
        <span>${escapeHtml(decision.decidedAt)} | ${escapeHtml(decision.reviewer || "Reviewer")}${decision.reason ? ` | Reason: ${escapeHtml(decision.reason)}` : ""}</span>
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
        state.expandedId = "";
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

    if (search) search.addEventListener("input", () => { state.search = search.value; renderTable(); });
    if (actionFilter) actionFilter.addEventListener("change", () => { state.actionType = actionFilter.value; state.expandedId = ""; renderTable(); });

    document.addEventListener("click", (event) => {
      const agentChip = event.target.closest("[data-agent]");
      if (agentChip) {
        state.activeAgent = agentChip.dataset.agent || "all";
        state.expandedId = "";
        closeDrawer();
        renderAll();
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
        const reason = nextState === "rejected"
          ? (document.querySelector(`[data-reject-reason="${CSS.escape(id)}"]`)?.value || "Rejected by reviewer")
          : "";
        setDecision(id, nextState, reason);
        return;
      }

      const row = event.target.closest("[data-action-id]");
      if (row) {
        const reviewButton = event.target.closest("[data-review-id]");
        const nextId = reviewButton?.dataset.reviewId || row.dataset.actionId || "";
        state.expandedId = state.expandedId === nextId ? "" : nextId;
        renderTable();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      const row = event.target.closest("[data-action-id]");
      if (!row) return;
      state.expandedId = row.dataset.actionId || "";
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
          <div class="aiEyebrow">${drawerTitle()}</div>
          <h2>${escapeHtml(action.invoiceNo)}</h2>
          <p>${escapeHtml(action.customer)} | ${escapeHtml(action.agent)}</p>
        </div>
        <button type="button" class="aiIconBtn" data-drawer-close aria-label="Close details">
          <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>
      </div>
      ${drawerBody(action)}
    `;
  }

  function drawerTitle() {
    if (state.drawerView === "history") return "Activity Trail";
    if (state.drawerView === "evidence") return "AI Evidence";
    return "Email Preview";
  }

  function drawerBody(action) {
    if (state.drawerView === "history") {
      return `
        <div class="aiTimeline">
          ${renderDecisionHistory(action, getDecision(action))}
          ${action.timeline.map(([time, title, body]) => `
            <div class="aiTimelineItem">
              <strong>${escapeHtml(title)}</strong>
              <span>${escapeHtml(time)} | ${escapeHtml(body)}</span>
            </div>
          `).join("")}
        </div>
      `;
    }

    if (state.drawerView === "evidence") {
      return `
        <div class="aiDetailGrid is-drawer">
          ${kv("Invoice amount", `Rs. ${formatINR(action.invoiceAmount)}`)}
          ${kv("Net due", `Rs. ${formatINR(action.netDue)}`)}
          ${kv("Invoice date", action.invoiceDate)}
          ${kv("Due date", action.dueDate)}
          ${kv("Current status", action.currentStatus)}
          ${kv("Previous status", action.previousStatus)}
          ${kv("Recommended status", action.recommendedStatus)}
          ${kv("Confidence / Risk", `${action.confidence}% / ${action.risk}`)}
        </div>
        <div class="aiReviewBox">
          <h3>AI reasoning</h3>
          <p><strong>Found:</strong> ${escapeHtml(action.summary)}</p>
          <p><strong>Action:</strong> ${escapeHtml(action.actionDetail)}</p>
          <p><strong>Expected outcome:</strong> ${escapeHtml(action.expectedOutcome)}</p>
        </div>
      `;
    }

    return action.email ? renderFullEmail(action) : `
      <div class="aiReviewBox">
        <h3>No email for this action</h3>
        <p>This AI recommendation updates invoice workflow only. No customer email will be sent.</p>
      </div>
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
