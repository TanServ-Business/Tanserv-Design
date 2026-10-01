(() => {
  const $ = (id) => document.getElementById(id);
  const CL_KEY = "ineburaCreditLimits";

  const esc = (value) => String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

  const fmt = (value) => new Intl.NumberFormat("en-IN", {
    maximumFractionDigits: 0
  }).format(Number(value || 0));

  const fmtCr = (value) => {
    const n = Number(value || 0);
    if (n >= 1e7) return `Rs. ${(n / 1e7).toFixed(2)} Cr`;
    if (n >= 1e5) return `Rs. ${(n / 1e5).toFixed(2)} L`;
    return `Rs. ${fmt(n)}`;
  };

  const baseCustomers = [
    {
      id: "c1", code: "CUST-001", name: "Apollo Pharmacy Pvt. Ltd.", city: "Mumbai", region: "West", industry: "Healthcare",
      agentName: "Aditi Sharma", creditPeriod: "30 Days", creditLimit: 2000000, outstanding: 1280000,
      overdueAmount: 358000, avgDaysOverdue: 12, brokenPTP: 1, disputes: 2, onTimeRatio: 72,
      mtdCollected: 420000, projectedCollection: 760000, cnRequested: 115000, advanceRequested: 85000, pdcAmount: 120000
    },
    {
      id: "c2", code: "CUST-014", name: "BlueWave", city: "Delhi", region: "North", industry: "Retail",
      agentName: "Karan Singh", creditPeriod: "45 Days", creditLimit: 700000, outstanding: 620000,
      overdueAmount: 327000, avgDaysOverdue: 22, brokenPTP: 3, disputes: 4, onTimeRatio: 48,
      mtdCollected: 130000, projectedCollection: 240000, cnRequested: 90000, advanceRequested: 35000, pdcAmount: 45000
    },
    {
      id: "c3", code: "CUST-033", name: "Sunrise Pvt Ltd", city: "Bengaluru", region: "South", industry: "Manufacturing",
      agentName: "Sahil Joshi", creditPeriod: "60 Days", creditLimit: 1500000, outstanding: 1840000,
      overdueAmount: 860000, avgDaysOverdue: 35, brokenPTP: 5, disputes: 6, onTimeRatio: 31,
      mtdCollected: 260000, projectedCollection: 470000, cnRequested: 210000, advanceRequested: 120000, pdcAmount: 160000
    },
    {
      id: "c4", code: "CUST-045", name: "GreenTech Solutions", city: "Pune", region: "West", industry: "Technology",
      agentName: "Priya Menon", creditPeriod: "30 Days", creditLimit: 1200000, outstanding: 430000,
      overdueAmount: 40000, avgDaysOverdue: 4, brokenPTP: 0, disputes: 1, onTimeRatio: 91,
      mtdCollected: 310000, projectedCollection: 590000, cnRequested: 25000, advanceRequested: 15000, pdcAmount: 30000
    },
    {
      id: "c5", code: "CUST-062", name: "NovaChem India", city: "Chennai", region: "South", industry: "Chemicals",
      agentName: "Deepak Nair", creditPeriod: "45 Days", creditLimit: 900000, outstanding: 965000,
      overdueAmount: 420000, avgDaysOverdue: 28, brokenPTP: 4, disputes: 3, onTimeRatio: 42,
      mtdCollected: 175000, projectedCollection: 315000, cnRequested: 125000, advanceRequested: 70000, pdcAmount: 90000
    },
    {
      id: "c6", code: "CUST-078", name: "SkyMart Retail", city: "Hyderabad", region: "South", industry: "Retail",
      agentName: "Pooja Rao", creditPeriod: "30 Days", creditLimit: 3000000, outstanding: 1050000,
      overdueAmount: 85000, avgDaysOverdue: 6, brokenPTP: 0, disputes: 0, onTimeRatio: 95,
      mtdCollected: 780000, projectedCollection: 1340000, cnRequested: 45000, advanceRequested: 35000, pdcAmount: 80000
    },
    {
      id: "c7", code: "CUST-091", name: "Meridian Pharma", city: "Kolkata", region: "East", industry: "Healthcare",
      agentName: "Sanjay Das", creditPeriod: "45 Days", creditLimit: 800000, outstanding: 695000,
      overdueAmount: 215000, avgDaysOverdue: 18, brokenPTP: 2, disputes: 2, onTimeRatio: 63,
      mtdCollected: 210000, projectedCollection: 390000, cnRequested: 70000, advanceRequested: 42000, pdcAmount: 58000
    },
    {
      id: "c8", code: "CUST-104", name: "Apex Distributors", city: "Ahmedabad", region: "West", industry: "Distribution",
      agentName: "Harsha Patel", creditPeriod: "30 Days", creditLimit: 500000, outstanding: 185000,
      overdueAmount: 32000, avgDaysOverdue: 8, brokenPTP: 1, disputes: 0, onTimeRatio: 80,
      mtdCollected: 90000, projectedCollection: 175000, cnRequested: 18000, advanceRequested: 12000, pdcAmount: 15000
    }
  ];

  const readOverrides = () => {
    try {
      return JSON.parse(localStorage.getItem(CL_KEY) || "[]");
    } catch {
      return [];
    }
  };

  const customers = baseCustomers.map((customer) => {
    const override = readOverrides().find((row) => row.id === customer.id);
    return override ? { ...customer, ...override } : customer;
  });

  let selectedCustomerId = new URLSearchParams(window.location.search).get("id") || "";
  let searchQuery = "";
  let dropdownOpen = false;

  const getUtilPct = (customer) => {
    const limit = Number(customer.creditLimit || 0);
    return limit > 0 ? Math.round((Number(customer.outstanding || 0) / limit) * 100) : 0;
  };

  const getAdjustments = (customer) => (
    Number(customer.cnRequested || 0) + Number(customer.advanceRequested || 0) + Number(customer.pdcAmount || 0)
  );

  const getNetExposure = (customer) => Math.max(
    0,
    Number(customer.outstanding || 0) - Number(customer.projectedCollection || 0) - getAdjustments(customer)
  );

  const getRecommendation = (customer) => {
    const utilPct = getUtilPct(customer);
    const projectedCoverage = customer.outstanding > 0
      ? (Number(customer.projectedCollection || 0) / Number(customer.outstanding || 0)) * 100
      : 0;
    const adjustmentShare = customer.outstanding > 0
      ? (getAdjustments(customer) / Number(customer.outstanding || 0)) * 100
      : 0;

    if (adjustmentShare >= 25) {
      return {
        label: "Resolve Adjustments First",
        badge: "chipAmber",
        tone: "amber",
        detail: "CN/Advance/PDC exposure is high enough to distort the limit decision. Clear adjustment status before changing limit."
      };
    }
    if (utilPct > 100 && projectedCoverage < 45) {
      return {
        label: "Escalate / Review Limit",
        badge: "chipRed",
        tone: "red",
        detail: "Customer is over-utilising the limit and projected collection does not sufficiently reduce exposure."
      };
    }
    if (utilPct < 50 && Number(customer.onTimeRatio || 0) >= 80) {
      return {
        label: "Limit Optimisation",
        badge: "chipBlue",
        tone: "blue",
        detail: "Limit is materially under-used while payment behaviour is stable. Review whether the sanctioned limit is oversized."
      };
    }
    if (utilPct >= 80 && utilPct <= 100 && projectedCoverage >= 50) {
      return {
        label: "Monitor",
        badge: "chipGreen",
        tone: "green",
        detail: "Utilisation is high but run-rate collection is expected to reduce near-term exposure."
      };
    }
    if (utilPct > 100) {
      return {
        label: "Reduce limit",
        badge: "chipRed",
        tone: "red",
        detail: "Exposure is above sanctioned limit. Keep the account under active review before extending further credit."
      };
    }
    return {
      label: "Hold limit",
      badge: "chipSlate",
      tone: "slate",
      detail: "Current utilisation and collection movement do not require immediate limit change."
    };
  };

  const getActionBadge = (recommendation) => {
    if (recommendation.label === "Escalate / Review Limit" || recommendation.label === "Reduce limit") {
      return { label: "Review Required", badge: "chipRed" };
    }
    if (recommendation.label === "Monitor" || recommendation.label === "Resolve Adjustments First") {
      return { label: "Monitor", badge: "chipAmber" };
    }
    if (recommendation.label === "Limit Optimisation") {
      return { label: "Limit Optimisation", badge: "chipBlue" };
    }
    return { label: "Healthy", badge: "chipGreen" };
  };

  const filteredCustomers = () => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((customer) => (
      customer.name.toLowerCase().includes(q)
      || customer.code.toLowerCase().includes(q)
      || customer.region.toLowerCase().includes(q)
      || customer.industry.toLowerCase().includes(q)
    ));
  };

  const selectCustomer = (customerId, updateUrl = true) => {
    selectedCustomerId = customerId || "";
    searchQuery = "";
    const selected = customers.find((customer) => customer.id === selectedCustomerId);
    if ($("assessmentCustomerSearch")) {
      $("assessmentCustomerSearch").value = selected ? `${selected.name} (${selected.code})` : "";
    }
    if (updateUrl) {
      const target = selected ? `credit-limit-assessment.html?id=${encodeURIComponent(selected.id)}` : "credit-limit-assessment.html";
      window.history.replaceState({}, "", target);
    }
    closeDropdown();
    render();
  };

  const getTrendRows = (customer) => {
    const months = ["Sep", "Oct", "Nov", "Dec", "Jan", "Feb"];
    const utilPct = getUtilPct(customer);
    const bias = Number(customer.brokenPTP || 0) * 2 - Math.round(Number(customer.onTimeRatio || 0) / 20);
    return months.map((month, index) => {
      const swing = ((index - 2) * 3) + bias + ((customer.id.charCodeAt(1) + index) % 5);
      return {
        month,
        pct: Math.max(15, Math.min(145, utilPct + swing - 7))
      };
    });
  };

  const renderDropdown = () => {
    const dropdown = $("assessmentCustomerDropdown");
    if (!dropdown) return;
    const list = filteredCustomers();
    if (!list.length) {
      dropdown.innerHTML = `<div class="clAssessmentDropdownEmpty">No customers found</div>`;
      return;
    }
    dropdown.innerHTML = list.map((customer) => {
      const pct = getUtilPct(customer);
      const recommendation = getRecommendation(customer);
      return `
        <div class="clCustSearchItem ${customer.id === selectedCustomerId ? "is-selected" : ""}" data-id="${esc(customer.id)}" role="option" aria-selected="${customer.id === selectedCustomerId}">
          <div class="clCustSearchItemLeft">
            <span class="clCustSearchItemName">${esc(customer.name)}</span>
            <span class="clCustSearchItemCode">${esc(customer.code)} - ${esc(customer.region)} - ${esc(customer.industry)}</span>
          </div>
          <div class="clCustSearchItemRight">
            <span class="clCustSearchItemUtil">${pct}%</span>
            <span class="statusChip ${recommendation.badge}">${esc(recommendation.label)}</span>
          </div>
        </div>
      `;
    }).join("");
    dropdown.querySelectorAll(".clCustSearchItem").forEach((item) => {
      item.addEventListener("click", () => selectCustomer(item.dataset.id));
    });
  };

  const openDropdown = () => {
    dropdownOpen = true;
    $("assessmentCustomerDropdown")?.classList.remove("hidden");
    $("assessmentCustomerSearch")?.setAttribute("aria-expanded", "true");
    renderDropdown();
  };

  const closeDropdown = () => {
    dropdownOpen = false;
    $("assessmentCustomerDropdown")?.classList.add("hidden");
    $("assessmentCustomerSearch")?.setAttribute("aria-expanded", "false");
  };

  const metricRow = (label, value, note = "") => `
    <div class="clAssessmentMetricRow">
      <span>${esc(label)}</span>
      <strong>${esc(value)}</strong>
      ${note ? `<em>${esc(note)}</em>` : ""}
    </div>
  `;

  const renderEmptyState = () => {
    $("assessmentCustomerName").textContent = "Select a customer";
    $("assessmentCustomerPills").innerHTML = `
      <span class="heroTag">Supervisor View</span>
      <span class="heroTag">Run-rate prototype</span>
    `;
    $("assessmentActionBadge").className = "statusChip chipSlate";
    $("assessmentActionBadge").textContent = "Assessment pending";
    $("assessmentKpiGrid").innerHTML = `
      <article class="clAssessmentKpiCard">
        <span>Customer assessment</span>
        <strong>Select customer</strong>
        <em>Use search or table row</em>
      </article>
    `;
    $("assessmentTrendChart").innerHTML = `<div class="clAssessmentEmptyPanel">Select a customer to view utilisation trend.</div>`;
    $("assessmentCollectionList").innerHTML = metricRow("Run-rate projection", "-", "Select customer");
    $("assessmentAdjustmentList").innerHTML = metricRow("CN/Adv/PDC pending", "-", "Select customer");
    $("assessmentRiskSignals").innerHTML = `<div class="clAssessmentEmptyPanel">Risk signals appear after customer selection.</div>`;
    $("assessmentRecommendationBody").innerHTML = `<div class="clAssessmentEmptyPanel">Recommendation appears after customer selection.</div>`;
  };

  const renderKpis = (customer) => {
    const utilPct = getUtilPct(customer);
    const adjustments = getAdjustments(customer);
    const netExposure = getNetExposure(customer);
    const kpis = [
      ["Current Credit Limit", fmtCr(customer.creditLimit), customer.creditPeriod],
      ["Credit Utilised", fmtCr(customer.outstanding), "Outstanding exposure"],
      ["Utilisation", `${utilPct}%`, utilPct > 100 ? "Above sanctioned limit" : "Against sanctioned limit"],
      ["Predicted Collection", fmtCr(customer.projectedCollection), "Run-rate projection"],
      ["CN Requested", fmtCr(customer.cnRequested), "Client confirmation pending"],
      ["Advance Requested", fmtCr(customer.advanceRequested), "Adjustment requested"],
      ["PDC / Other", fmtCr(customer.pdcAmount), "Instrument or offset pending"],
      ["Net Exposure", fmtCr(netExposure), "After collection + adjustments"]
    ];
    $("assessmentKpiGrid").innerHTML = kpis.map(([label, value, note]) => `
      <article class="clAssessmentKpiCard">
        <span>${esc(label)}</span>
        <strong>${esc(value)}</strong>
        <em>${esc(note)}</em>
      </article>
    `).join("");
  };

  const renderTrend = (customer) => {
    const rows = getTrendRows(customer);
    const width = 640;
    const height = 190;
    const left = 42;
    const right = 18;
    const top = 18;
    const bottom = 34;
    const maxPct = Math.max(120, ...rows.map((row) => row.pct));
    const x = (index) => left + (index * ((width - left - right) / Math.max(1, rows.length - 1)));
    const y = (pct) => top + ((maxPct - pct) / maxPct) * (height - top - bottom);
    const points = rows.map((row, index) => `${x(index)},${y(row.pct)}`).join(" ");
    const limitY = y(100);
    $("assessmentTrendChart").innerHTML = `
      <svg class="clAssessmentTrendSvg" viewBox="0 0 ${width} ${height}" role="img" aria-label="Six month credit utilisation trend">
        <line x1="${left}" y1="${limitY}" x2="${width - right}" y2="${limitY}" class="clAssessmentTrendLimit"></line>
        <text x="${left}" y="${limitY - 7}" class="clAssessmentTrendLimitText">100% limit</text>
        ${rows.map((row, index) => `<line x1="${x(index)}" y1="${top}" x2="${x(index)}" y2="${height - bottom}" class="clAssessmentTrendGrid"></line>`).join("")}
        <polyline points="${points}" class="clAssessmentTrendLine"></polyline>
        ${rows.map((row, index) => `
          <circle cx="${x(index)}" cy="${y(row.pct)}" r="4" class="clAssessmentTrendDot"></circle>
          <text x="${x(index)}" y="${height - 12}" class="clAssessmentTrendLabel">${esc(row.month)}</text>
          <text x="${x(index)}" y="${Math.max(12, y(row.pct) - 10)}" class="clAssessmentTrendValue">${row.pct}%</text>
        `).join("")}
      </svg>
    `;
  };

  const renderAssessment = (customer) => {
    const recommendation = getRecommendation(customer);
    const actionBadge = getActionBadge(recommendation);
    const utilPct = getUtilPct(customer);
    const adjustments = getAdjustments(customer);
    const netExposure = getNetExposure(customer);
    const shortfall = Math.max(0, Number(customer.outstanding || 0) - Number(customer.projectedCollection || 0));

    $("assessmentCustomerName").textContent = customer.name;
    $("assessmentActionBadge").className = `statusChip ${actionBadge.badge}`;
    $("assessmentActionBadge").textContent = actionBadge.label;
    $("assessmentCustomerPills").innerHTML = `
      <span class="heroTag">${esc(customer.code)}</span>
      <span class="heroTag">${esc(customer.region)} - ${esc(customer.city)}</span>
      <span class="heroTag">${esc(customer.industry)}</span>
      <span class="heroTag">Agent: ${esc(customer.agentName)}</span>
      <span class="heroTag">${esc(customer.creditPeriod)}</span>
    `;

    renderKpis(customer);
    renderTrend(customer);

    $("assessmentCollectionList").innerHTML = [
      metricRow("MTD collected", fmtCr(customer.mtdCollected), "Current month"),
      metricRow("Projected month-end", fmtCr(customer.projectedCollection), "Run-rate projection"),
      metricRow("Expected shortfall", fmtCr(shortfall), "Before CN/Adv/PDC"),
      metricRow("Net exposure after offsets", fmtCr(netExposure), "Collection + adjustments")
    ].join("");

    $("assessmentAdjustmentList").innerHTML = [
      metricRow("CN requested", fmtCr(customer.cnRequested), "Pending from client"),
      metricRow("Advance requested", fmtCr(customer.advanceRequested), "Pending adjustment"),
      metricRow("PDC / other", fmtCr(customer.pdcAmount), "Instrument or offset"),
      metricRow("Total adjustment exposure", fmtCr(adjustments), "CN + Advance + PDC")
    ].join("");

    $("assessmentRiskSignals").innerHTML = [
      ["Overdue Amount", fmtCr(customer.overdueAmount)],
      ["Avg Days Overdue", `${customer.avgDaysOverdue} days`],
      ["Broken PTP", customer.brokenPTP],
      ["Disputes", customer.disputes],
      ["On-time Ratio", `${customer.onTimeRatio}%`],
      ["Utilisation", `${utilPct}%`]
    ].map(([label, value]) => `
      <div class="clAssessmentSignal">
        <span>${esc(label)}</span>
        <strong>${esc(value)}</strong>
      </div>
    `).join("");

    $("assessmentRecommendationBody").innerHTML = `
      <div class="clAssessmentRecommendationBox is-${esc(recommendation.tone)}">
        <span class="statusChip ${recommendation.badge}">${esc(recommendation.label)}</span>
        <strong>${esc(recommendation.label)}</strong>
        <p>${esc(recommendation.detail)}</p>
      </div>
    `;
  };

  const renderTable = () => {
    const tbody = $("assessmentTableBody");
    if (!tbody) return;
    tbody.innerHTML = customers.map((customer) => {
      const utilPct = getUtilPct(customer);
      const fill = Math.min(100, Math.max(0, utilPct));
      const recommendation = getRecommendation(customer);
      const selected = customer.id === selectedCustomerId;
      return `
        <tr class="${selected ? "is-selected" : ""}" data-id="${esc(customer.id)}" tabindex="0">
          <td>${esc(customer.code)}</td>
          <td>
            <div class="clCustName">${esc(customer.name)}</div>
            <div class="clCustCode">${esc(customer.region)} - ${esc(customer.industry)}</div>
          </td>
          <td class="numericCell">${esc(fmtCr(customer.creditLimit))}</td>
          <td class="numericCell">${esc(fmtCr(customer.outstanding))}</td>
          <td>
            <span class="utilBar"><span class="utilBarFill ${utilPct > 100 ? "uRed" : utilPct >= 80 ? "uAmber" : "uGreen"}" style="width:${fill}%"></span></span>
            <span class="utilPct ${utilPct > 100 ? "uRed" : utilPct >= 80 ? "uAmber" : "uGreen"}">${utilPct}%</span>
          </td>
          <td class="numericCell">${esc(fmtCr(customer.projectedCollection))}</td>
          <td class="numericCell">${esc(fmtCr(getAdjustments(customer)))}</td>
          <td class="numericCell">${esc(fmtCr(getNetExposure(customer)))}</td>
          <td><span class="statusChip ${recommendation.badge}">${esc(recommendation.label)}</span></td>
        </tr>
      `;
    }).join("");

    tbody.querySelectorAll("tr[data-id]").forEach((row) => {
      const activate = () => selectCustomer(row.dataset.id);
      row.addEventListener("click", activate);
      row.addEventListener("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          activate();
        }
      });
    });
  };

  const render = () => {
    const selected = customers.find((customer) => customer.id === selectedCustomerId);
    if (selected) {
      renderAssessment(selected);
    } else {
      renderEmptyState();
    }
    renderTable();
    $("assessmentAsOf").textContent = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  $("assessmentCustomerSearch")?.addEventListener("focus", openDropdown);
  $("assessmentCustomerSearch")?.addEventListener("input", (event) => {
    searchQuery = event.target.value || "";
    if (!dropdownOpen) openDropdown();
    renderDropdown();
  });

  document.addEventListener("click", (event) => {
    if (!event.target.closest(".clCustSearchWrap")) closeDropdown();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeDropdown();
  });

  $("assessmentBackBtn")?.addEventListener("click", () => {
    window.location.href = "credit-limit-dashboard.html";
  });

  const initial = customers.find((customer) => customer.id === selectedCustomerId);
  if (initial && $("assessmentCustomerSearch")) {
    $("assessmentCustomerSearch").value = `${initial.name} (${initial.code})`;
  }

  render();
  requestAnimationFrame(() => document.body.classList.remove("motion-preload"));
})();
