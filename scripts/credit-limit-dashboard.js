(() => {
  // ── mount guard ──────────────────────────────────────────────
  const mount = document.getElementById("clTableBody");
  if (!mount) return;

  // ── helpers ──────────────────────────────────────────────────
  const fmt = (n) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(n || 0));

  const fmtCr = (n) => {
    const v = Number(n || 0);
    if (v >= 1e7) return "Rs. " + (v / 1e7).toFixed(2) + " Cr";
    if (v >= 1e5) return "Rs. " + (v / 1e5).toFixed(2) + " L";
    return "Rs. " + fmt(v);
  };

  const escHtml = (s) =>
    String(s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  // ── approval data ─────────────────────────────────────────────
  const APPROVALS_KEY = "ineburaCLApprovals";

  const loadApprovals = () => {
    try { return JSON.parse(localStorage.getItem(APPROVALS_KEY) || "[]"); } catch { return []; }
  };
  const saveApprovals = (arr) => {
    try { localStorage.setItem(APPROVALS_KEY, JSON.stringify(arr)); } catch { /* */ }
  };

  const fmtDate = (iso) => new Date(iso).toLocaleString("en-IN", {
    day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
  });

  // ── mock credit limit data ────────────────────────────────────
  const CL_KEY = "ineburaCreditLimits";

  const defaultData = [
    {
      id: "c1",
      name: "Apollo Pharmacy Pvt. Ltd.",
      code: "CUST-001",
      city: "Mumbai", region: "West", industry: "Healthcare",
      agentName: "Aditi Sharma", creditPeriod: "30 Days",
      creditLimit: 2000000,
      outstanding: 1280000,
      tenure: 36,
      avgDaysOverdue: 12,
      overdueAmount: 358000,
      brokenPTP: 1,
      disputes: 2,
      agingVelocity: 8,
      pastDueTrend: "stable",
      onTimeRatio: 72,
      orderVolume: 1565400,
    },
    {
      id: "c2",
      name: "BlueWave",
      code: "CUST-014",
      city: "Delhi", region: "North", industry: "Retail",
      agentName: "Karan Singh", creditPeriod: "45 Days",
      creditLimit: 700000,
      outstanding: 620000,
      tenure: 18,
      avgDaysOverdue: 22,
      overdueAmount: 327000,
      brokenPTP: 3,
      disputes: 4,
      agingVelocity: 14,
      pastDueTrend: "worsening",
      onTimeRatio: 48,
      orderVolume: 802500,
    },
    {
      id: "c3",
      name: "Sunrise Pvt Ltd",
      code: "CUST-033",
      city: "Bengaluru", region: "South", industry: "Manufacturing",
      agentName: "Sahil Joshi", creditPeriod: "60 Days",
      creditLimit: 1500000,
      outstanding: 1840000,
      tenure: 48,
      avgDaysOverdue: 35,
      overdueAmount: 860000,
      brokenPTP: 5,
      disputes: 6,
      agingVelocity: 18,
      pastDueTrend: "worsening",
      onTimeRatio: 31,
      orderVolume: 2412000,
    },
    {
      id: "c4",
      name: "GreenTech Solutions",
      code: "CUST-045",
      city: "Pune", region: "West", industry: "Technology",
      agentName: "Priya Menon", creditPeriod: "30 Days",
      creditLimit: 1200000,
      outstanding: 430000,
      tenure: 24,
      avgDaysOverdue: 4,
      overdueAmount: 40000,
      brokenPTP: 0,
      disputes: 1,
      agingVelocity: 3,
      pastDueTrend: "improving",
      onTimeRatio: 91,
      orderVolume: 980000,
    },
    {
      id: "c5",
      name: "NovaChem India",
      code: "CUST-062",
      city: "Chennai", region: "South", industry: "Chemicals",
      agentName: "Deepak Nair", creditPeriod: "45 Days",
      creditLimit: 900000,
      outstanding: 965000,
      tenure: 12,
      avgDaysOverdue: 28,
      overdueAmount: 420000,
      brokenPTP: 4,
      disputes: 3,
      agingVelocity: 16,
      pastDueTrend: "worsening",
      onTimeRatio: 42,
      orderVolume: 1120000,
    },
    {
      id: "c6",
      name: "SkyMart Retail",
      code: "CUST-078",
      city: "Hyderabad", region: "South", industry: "Retail",
      agentName: "Pooja Rao", creditPeriod: "30 Days",
      creditLimit: 3000000,
      outstanding: 1050000,
      tenure: 60,
      avgDaysOverdue: 6,
      overdueAmount: 85000,
      brokenPTP: 0,
      disputes: 0,
      agingVelocity: 2,
      pastDueTrend: "improving",
      onTimeRatio: 95,
      orderVolume: 3640000,
    },
    {
      id: "c7",
      name: "Meridian Pharma",
      code: "CUST-091",
      city: "Kolkata", region: "East", industry: "Healthcare",
      agentName: "Sanjay Das", creditPeriod: "45 Days",
      creditLimit: 800000,
      outstanding: 695000,
      tenure: 30,
      avgDaysOverdue: 18,
      overdueAmount: 215000,
      brokenPTP: 2,
      disputes: 2,
      agingVelocity: 10,
      pastDueTrend: "stable",
      onTimeRatio: 63,
      orderVolume: 1045000,
    },
    {
      id: "c8",
      name: "Apex Distributors",
      code: "CUST-104",
      city: "Ahmedabad", region: "West", industry: "Distribution",
      agentName: "Harsha Patel", creditPeriod: "30 Days",
      creditLimit: 500000,
      outstanding: 185000,
      tenure: 9,
      avgDaysOverdue: 8,
      overdueAmount: 32000,
      brokenPTP: 1,
      disputes: 0,
      agingVelocity: 5,
      pastDueTrend: "stable",
      onTimeRatio: 80,
      orderVolume: 420000,
    },
  ];

  // load overrides from localStorage (saves from detail page)
  const loadData = () => {
    try {
      const raw = localStorage.getItem(CL_KEY);
      if (!raw) return defaultData;
      const overrides = JSON.parse(raw);
      return defaultData.map((d) => {
        const ov = overrides.find((o) => o.id === d.id);
        return ov ? { ...d, ...ov } : d;
      });
    } catch {
      return defaultData;
    }
  };

  // ── util status ───────────────────────────────────────────────
  const getStatus = (pct) => {
    if (pct > 100) return { label: "Over-Utilising", chip: "chipRed",   filter: "over"       };
    if (pct >= 80)  return { label: "Approaching",   chip: "chipAmber", filter: "approaching" };
    if (pct < 50)   return { label: "Under-Utilising", chip: "chipBlue", filter: "under"      };
    return             { label: "Healthy",           chip: "chipGreen", filter: "healthy"    };
  };

  const getBarClass = (pct) => {
    if (pct > 100) return "uRed";
    if (pct >= 80)  return "uAmber";
    return "uGreen";
  };

  // ── state ─────────────────────────────────────────────────────
  let activeFilter = "all";
  let searchQuery  = "";

  // ── render KPIs ───────────────────────────────────────────────
  const renderKPIs = (data) => {
    const totalLimit    = data.reduce((s, d) => s + d.creditLimit,  0);
    const totalUtil     = data.reduce((s, d) => s + d.outstanding,  0);
    const overallPct    = totalLimit ? Math.round(totalUtil / totalLimit * 100) : 0;

    const healthy    = data.filter((d) => { const p = d.outstanding / d.creditLimit * 100; return p < 80; });
    const approaching= data.filter((d) => { const p = d.outstanding / d.creditLimit * 100; return p >= 80 && p <= 100; });
    const over       = data.filter((d) => d.outstanding > d.creditLimit);
    const under      = data.filter((d) => d.outstanding / d.creditLimit * 100 < 50);

    document.getElementById("kpiTotalLimitVal").textContent  = fmtCr(totalLimit);
    document.getElementById("kpiTotalLimitSub").textContent  = `${data.length} customers`;
    document.getElementById("kpiUtilisedVal").textContent    = fmtCr(totalUtil);
    document.getElementById("kpiUtilisedSub").textContent    = `Overall utilisation: ${overallPct}%`;
    document.getElementById("kpiHealthyVal").textContent     = healthy.length;
    document.getElementById("kpiHealthyCount").textContent   = healthy.length;
    document.getElementById("kpiApproachingVal").textContent = approaching.length;
    document.getElementById("kpiApproachingCount").textContent = approaching.length;
    document.getElementById("kpiOverVal").textContent        = over.length;
    document.getElementById("kpiOverCount").textContent      = over.length;
    document.getElementById("kpiUnderVal").textContent       = under.length;
    document.getElementById("kpiUnderCount").textContent     = under.length;

  };

  // ── render table ──────────────────────────────────────────────
  const filterTitles = {
    all:         ["All Customers",        "Showing all customers across the portfolio"],
    healthy:     ["Healthy Customers",    "Utilisation below 80%"],
    approaching: ["Approaching Limit",    "Utilisation between 80% and 100%"],
    over:        ["Over-Utilising",       "Outstanding exceeds sanctioned credit limit"],
    under:       ["Under-Utilising",      "Utilisation below 50% — potential limit optimisation"],
  };

  const renderTable = (data) => {
    const [title, subtitle] = filterTitles[activeFilter] || filterTitles.all;
    document.getElementById("clTableTitle").textContent    = title;
    document.getElementById("clTableSubtitle").textContent = subtitle;

    let rows = data;
    if (activeFilter !== "all") {
      rows = data.filter((d) => {
        const pct = d.outstanding / d.creditLimit * 100;
        const st  = getStatus(pct);
        return st.filter === activeFilter;
      });
    }
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      rows = rows.filter((d) =>
        d.name.toLowerCase().includes(q) ||
        d.code.toLowerCase().includes(q) ||
        d.region.toLowerCase().includes(q) ||
        d.industry.toLowerCase().includes(q)
      );
    }

    const tbody = document.getElementById("clTableBody");
    const empty = document.getElementById("clEmptyState");

    if (!rows.length) {
      tbody.innerHTML = "";
      empty.style.display = "";
      return;
    }
    empty.style.display = "none";

    tbody.innerHTML = rows.map((d) => {
      const pct    = Math.round(d.outstanding / d.creditLimit * 100);
      const status = getStatus(pct);
      const bar    = getBarClass(pct);
      const fillW  = Math.min(pct, 100);
      return `
        <tr>
          <td>
            <div class="clCustName">${escHtml(d.name)}</div>
            <div class="clCustCode">${escHtml(d.code)}</div>
          </td>
          <td>${escHtml(d.region)}</td>
          <td>${escHtml(d.industry)}</td>
          <td class="numericCell">Rs. ${fmt(d.creditLimit)}</td>
          <td class="numericCell">Rs. ${fmt(d.outstanding)}</td>
          <td>
            <span class="utilBar"><span class="utilBarFill ${bar}" style="width:${fillW}%"></span></span>
            <span class="utilPct ${bar}">${pct}%</span>
          </td>
          <td>
            <span class="statusChip ${status.chip}">${escHtml(status.label)}</span>
          </td>
          <td>
            <a href="credit-limit-detail.html?id=${escHtml(d.id)}" class="clActionLink">
              <i class="bi bi-pencil-square" aria-hidden="true"></i> Manage
            </a>
          </td>
        </tr>`;
    }).join("");
  };

  // ── approval queue ────────────────────────────────────────────
  const renderApprovalQueue = () => {
    const pending   = loadApprovals().filter((a) => a.status === "pending");
    const section   = document.getElementById("clApprovalsSection");
    const tbody     = document.getElementById("clApprovalQueueBody");
    const emptyEl   = document.getElementById("clApprovalEmpty");

    if (!section || !tbody) return;

    section.style.display = pending.length ? "" : "none";

    if (!pending.length) {
      tbody.innerHTML = "";
      if (emptyEl) emptyEl.style.display = "";
      return;
    }
    if (emptyEl) emptyEl.style.display = "none";

    const changePct = (curr, next) => Math.round((next - curr) / Math.abs(curr) * 100);

    tbody.innerHTML = pending.map((a) => {
      const pct     = changePct(a.currentLimit, a.proposedLimit);
      const isUp    = pct > 0;
      const color   = isUp ? "color:#15803d" : "color:#b91c1c";
      const sign    = isUp ? "+" : "";
      return `
        <tr>
          <td>
            <div style="font-weight:600;color:#0f172a;font-size:13px;">${escHtml(a.custName)}</div>
            <div style="font-size:11px;color:#94a3b8;">${escHtml(a.custCode)}</div>
          </td>
          <td style="font-variant-numeric:tabular-nums;">Rs. ${fmt(a.currentLimit)}</td>
          <td style="font-weight:700;color:#5c258d;font-variant-numeric:tabular-nums;">Rs. ${fmt(a.proposedLimit)}</td>
          <td>
            <div class="approvalLimitChange">
              <span style="font-size:12px;font-weight:700;${color}">${sign}${pct}%</span>
            </div>
          </td>
          <td style="font-size:12px;color:#64748b;">${escHtml(a.changeReason || "—")}</td>
          <td style="font-size:11.5px;color:#64748b;white-space:nowrap;">${fmtDate(a.submittedAt)}</td>
          <td>
            <div class="approvalActionBtns">
              <button class="btnApprove" data-id="${escHtml(a.approvalId)}" type="button">
                <i class="bi bi-check-lg" aria-hidden="true"></i> Approve
              </button>
              <button class="btnReject" data-id="${escHtml(a.approvalId)}" type="button">
                <i class="bi bi-x-lg" aria-hidden="true"></i> Reject
              </button>
            </div>
          </td>
        </tr>`;
    }).join("");

    // bind approve/reject buttons
    tbody.querySelectorAll(".btnApprove").forEach((btn) => {
      btn.addEventListener("click", () => openReviewModal(btn.dataset.id, "approve"));
    });
    tbody.querySelectorAll(".btnReject").forEach((btn) => {
      btn.addEventListener("click", () => openReviewModal(btn.dataset.id, "reject"));
    });
  };

  // ── review modal ──────────────────────────────────────────────
  let modalApprovalId  = null;
  let modalAction      = null; // "approve" | "reject"

  const openReviewModal = (approvalId, action) => {
    const approval = loadApprovals().find((a) => a.approvalId === approvalId);
    if (!approval) return;

    modalApprovalId = approvalId;
    modalAction     = action;

    const modal     = document.getElementById("clReviewModal");
    const titleEl   = document.getElementById("clModalTitleText");
    const subtitleEl= document.getElementById("clModalSubtitleText");
    const summaryEl = document.getElementById("clModalSummary");
    const confirmBtn= document.getElementById("clModalConfirmBtn");
    const commentEl = document.getElementById("clModalComment");

    if (action === "approve") {
      titleEl.textContent    = "Approve Credit Limit Change";
      subtitleEl.textContent = "The new credit limit will be applied immediately.";
      confirmBtn.className   = "clModalConfirmBtn approve";
      confirmBtn.textContent = "Approve";
    } else {
      titleEl.textContent    = "Reject Credit Limit Change";
      subtitleEl.textContent = "The proposed limit will not be applied.";
      confirmBtn.className   = "clModalConfirmBtn reject";
      confirmBtn.textContent = "Reject";
    }

    summaryEl.innerHTML = `
      <div class="smRow"><span class="smKey">Customer</span><span class="smVal">${escHtml(approval.custName)} (${escHtml(approval.custCode)})</span></div>
      <div class="smRow"><span class="smKey">Current Limit</span><span class="smVal">Rs. ${fmt(approval.currentLimit)}</span></div>
      <div class="smRow"><span class="smKey">Proposed Limit</span><span class="smVal">Rs. ${fmt(approval.proposedLimit)}</span></div>
      ${approval.changeReason ? `<div class="smRow"><span class="smKey">Reason</span><span class="smVal">${escHtml(approval.changeReason)}</span></div>` : ""}
      <div class="smRow"><span class="smKey">Submitted</span><span class="smVal">${fmtDate(approval.submittedAt)}</span></div>`;

    commentEl.value = "";
    modal.style.display = "flex";
    setTimeout(() => commentEl.focus(), 80);
  };

  const closeReviewModal = () => {
    document.getElementById("clReviewModal").style.display = "none";
    modalApprovalId = null;
    modalAction     = null;
  };

  document.getElementById("clModalCancelBtn")?.addEventListener("click", closeReviewModal);
  document.getElementById("clModalBackdrop")?.addEventListener("click", closeReviewModal);
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && document.getElementById("clReviewModal")?.style.display !== "none") {
      closeReviewModal();
    }
  });

  document.getElementById("clModalConfirmBtn")?.addEventListener("click", () => {
    if (!modalApprovalId || !modalAction) return;

    const comment  = document.getElementById("clModalComment")?.value.trim() || "";
    const approvals = loadApprovals();
    const idx      = approvals.findIndex((a) => a.approvalId === modalApprovalId);
    if (idx === -1) { closeReviewModal(); return; }

    approvals[idx].status        = modalAction === "approve" ? "approved" : "rejected";
    approvals[idx].reviewComment = comment;
    approvals[idx].reviewedAt    = new Date().toISOString();
    saveApprovals(approvals);

    // if approved: apply the new credit limit in overrides
    if (modalAction === "approve") {
      const approval  = approvals[idx];
      const overrides = (() => { try { return JSON.parse(localStorage.getItem(CL_KEY) || "[]"); } catch { return []; } })();
      const existing  = overrides.find((o) => o.id === approval.custId);
      const prevLimit = existing ? (existing.creditLimit || approval.currentLimit) : approval.currentLimit;
      const newOverrides = overrides.filter((o) => o.id !== approval.custId);
      newOverrides.push({
        id:                  approval.custId,
        creditLimit:         approval.proposedLimit,
        previousCreditLimit: prevLimit,
        changeReason:        approval.changeReason,
        changedAt:           new Date().toISOString(),
      });
      try { localStorage.setItem(CL_KEY, JSON.stringify(newOverrides)); } catch { /* */ }
    }

    closeReviewModal();
    const data = loadData();
    renderKPIs(data);
    renderTable(data);
    renderApprovalQueue();
  });

  // ── card filter interaction ───────────────────────────────────
  const cards = document.querySelectorAll("[data-filter]");
  cards.forEach((card) => {
    card.addEventListener("click", () => {
      activeFilter = card.dataset.filter;
      cards.forEach((c) => c.classList.remove("is-active"));
      card.classList.add("is-active");
      renderTable(loadData());
    });
    card.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); card.click(); }
    });
  });

  // default active
  document.getElementById("kpiTotalLimit")?.classList.add("is-active");

  // ── search ────────────────────────────────────────────────────
  document.getElementById("clSearch")?.addEventListener("input", (e) => {
    searchQuery = e.target.value.trim();
    renderTable(loadData());
  });

  // ── as-of date ────────────────────────────────────────────────
  const asOf = document.getElementById("clAsOf");
  if (asOf) {
    asOf.textContent = "As of " + new Date().toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric"
    });
  }

  // ── init ──────────────────────────────────────────────────────
  const data = loadData();
  renderKPIs(data);
  renderTable(data);
  renderApprovalQueue();

  // fade-in cards
  requestAnimationFrame(() => {
    document.querySelectorAll(".dashboardCard").forEach((el, i) => {
      setTimeout(() => { el.style.opacity = "1"; el.style.transition = "opacity 0.35s ease"; }, i * 60);
    });
    document.body.classList.remove("motion-preload");
  });
})();
