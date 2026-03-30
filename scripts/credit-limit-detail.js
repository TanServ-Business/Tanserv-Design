(() => {
  const $ = (id) => document.getElementById(id);

  // ── helpers ──────────────────────────────────────────────────
  const fmt = (n) =>
    new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(n || 0));

  const fmtCr = (n) => {
    const v = Number(n || 0);
    if (v >= 1e7) return "Rs. " + (v / 1e7).toFixed(2) + " Cr";
    if (v >= 1e5) return "Rs. " + (v / 1e5).toFixed(2) + " L";
    return "Rs. " + fmt(v);
  };

  const esc = (s) =>
    String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

  // ── customer data ─────────────────────────────────────────────
  const CL_KEY        = "ineburaCreditLimits";
  const APPROVALS_KEY = "ineburaCLApprovals";

  // Mock supervisor (pseudo — would come from session in a real app)
  const SUPERVISOR = { name: "Rajesh Kumar", username: "rajesh.kumar", email: "rajesh.kumar@inebura.com" };

  const BASE_CUSTOMERS = [
    {
      id:"c1", name:"Apollo Pharmacy Pvt. Ltd.", code:"CUST-001", city:"Mumbai", region:"West", industry:"Healthcare",
      agentName:"Aditi Sharma", creditPeriod:"30 Days", creditLimit:2000000,
      outstanding:1280000, tenure:36, avgDaysOverdue:12, overdueAmount:358000, brokenPTP:1, disputes:2,
      agingVelocity:8, pastDueTrend:"stable", onTimeRatio:72, orderVolume:1565400,
      avgPaymentDays:18, probDelay:35, probWriteoff:8, dsoChange:12, payThreshold6M:82,
      creditLimitHistory: [
        { limit:600000,  changedAt:"2021-04-01T00:00:00Z", reason:"Initial Credit" },
        { limit:900000,  changedAt:"2022-01-15T00:00:00Z", reason:"Annual Review" },
        { limit:1200000, changedAt:"2022-09-10T00:00:00Z", reason:"Business Growth" },
        { limit:1500000, changedAt:"2023-04-05T00:00:00Z", reason:"Business Growth" },
        { limit:1700000, changedAt:"2024-01-20T00:00:00Z", reason:"Annual Review" },
        { limit:1900000, changedAt:"2024-09-15T00:00:00Z", reason:"Management Decision" },
      ],
    },
    {
      id:"c2", name:"BlueWave", code:"CUST-014", city:"Delhi", region:"North", industry:"Retail",
      agentName:"Karan Singh", creditPeriod:"45 Days", creditLimit:700000,
      outstanding:620000, tenure:18, avgDaysOverdue:22, overdueAmount:327000, brokenPTP:3, disputes:4,
      agingVelocity:14, pastDueTrend:"worsening", onTimeRatio:48, orderVolume:802500,
      avgPaymentDays:42, probDelay:68, probWriteoff:22, dsoChange:28, payThreshold6M:55,
      creditLimitHistory: [
        { limit:300000, changedAt:"2023-03-01T00:00:00Z", reason:"Initial Credit" },
        { limit:500000, changedAt:"2023-10-20T00:00:00Z", reason:"Annual Review" },
        { limit:600000, changedAt:"2024-06-05T00:00:00Z", reason:"Business Growth" },
      ],
    },
    {
      id:"c3", name:"Sunrise Pvt Ltd", code:"CUST-033", city:"Bengaluru", region:"South", industry:"Manufacturing",
      agentName:"Sahil Joshi", creditPeriod:"60 Days", creditLimit:1500000,
      outstanding:1840000, tenure:48, avgDaysOverdue:35, overdueAmount:860000, brokenPTP:5, disputes:6,
      agingVelocity:18, pastDueTrend:"worsening", onTimeRatio:31, orderVolume:2412000,
      avgPaymentDays:58, probDelay:75, probWriteoff:28, dsoChange:35, payThreshold6M:48,
      creditLimitHistory: [
        { limit:500000,  changedAt:"2021-01-10T00:00:00Z", reason:"Initial Credit" },
        { limit:800000,  changedAt:"2021-09-01T00:00:00Z", reason:"Business Growth" },
        { limit:1200000, changedAt:"2022-06-15T00:00:00Z", reason:"Business Growth" },
        { limit:1800000, changedAt:"2023-03-10T00:00:00Z", reason:"Annual Review" },
        { limit:2000000, changedAt:"2024-01-05T00:00:00Z", reason:"Management Decision" },
      ],
    },
    {
      id:"c4", name:"GreenTech Solutions", code:"CUST-045", city:"Pune", region:"West", industry:"Technology",
      agentName:"Priya Menon", creditPeriod:"30 Days", creditLimit:1200000,
      outstanding:430000, tenure:24, avgDaysOverdue:4, overdueAmount:40000, brokenPTP:0, disputes:1,
      agingVelocity:3, pastDueTrend:"improving", onTimeRatio:91, orderVolume:980000,
      avgPaymentDays:12, probDelay:8, probWriteoff:2, dsoChange:-5, payThreshold6M:97,
      creditLimitHistory: [
        { limit:400000,  changedAt:"2022-10-01T00:00:00Z", reason:"Initial Credit" },
        { limit:600000,  changedAt:"2023-04-15T00:00:00Z", reason:"Annual Review" },
        { limit:800000,  changedAt:"2023-10-20T00:00:00Z", reason:"Improved Payment History" },
        { limit:1000000, changedAt:"2024-05-10T00:00:00Z", reason:"Business Growth" },
      ],
    },
    {
      id:"c5", name:"NovaChem India", code:"CUST-062", city:"Chennai", region:"South", industry:"Chemicals",
      agentName:"Deepak Nair", creditPeriod:"45 Days", creditLimit:900000,
      outstanding:965000, tenure:12, avgDaysOverdue:28, overdueAmount:420000, brokenPTP:4, disputes:3,
      agingVelocity:16, pastDueTrend:"worsening", onTimeRatio:42, orderVolume:1120000,
      avgPaymentDays:48, probDelay:70, probWriteoff:25, dsoChange:22, payThreshold6M:52,
      creditLimitHistory: [
        { limit:300000, changedAt:"2023-09-01T00:00:00Z", reason:"Initial Credit" },
        { limit:500000, changedAt:"2024-03-20T00:00:00Z", reason:"Annual Review" },
        { limit:700000, changedAt:"2024-10-05T00:00:00Z", reason:"Business Growth" },
      ],
    },
    {
      id:"c6", name:"SkyMart Retail", code:"CUST-078", city:"Hyderabad", region:"South", industry:"Retail",
      agentName:"Pooja Rao", creditPeriod:"30 Days", creditLimit:3000000,
      outstanding:1050000, tenure:60, avgDaysOverdue:6, overdueAmount:85000, brokenPTP:0, disputes:0,
      agingVelocity:2, pastDueTrend:"improving", onTimeRatio:95, orderVolume:3640000,
      avgPaymentDays:10, probDelay:6, probWriteoff:1, dsoChange:-8, payThreshold6M:99,
      creditLimitHistory: [
        { limit:500000,  changedAt:"2020-01-15T00:00:00Z", reason:"Initial Credit" },
        { limit:800000,  changedAt:"2020-09-01T00:00:00Z", reason:"Annual Review" },
        { limit:1200000, changedAt:"2021-06-10T00:00:00Z", reason:"Business Growth" },
        { limit:1600000, changedAt:"2022-02-20T00:00:00Z", reason:"Business Growth" },
        { limit:2000000, changedAt:"2022-11-05T00:00:00Z", reason:"Annual Review" },
        { limit:2500000, changedAt:"2023-08-15T00:00:00Z", reason:"Business Growth" },
        { limit:2800000, changedAt:"2024-04-01T00:00:00Z", reason:"Management Decision" },
      ],
    },
    {
      id:"c7", name:"Meridian Pharma", code:"CUST-091", city:"Kolkata", region:"East", industry:"Healthcare",
      agentName:"Sanjay Das", creditPeriod:"45 Days", creditLimit:800000,
      outstanding:695000, tenure:30, avgDaysOverdue:18, overdueAmount:215000, brokenPTP:2, disputes:2,
      agingVelocity:10, pastDueTrend:"stable", onTimeRatio:63, orderVolume:1045000,
      avgPaymentDays:30, probDelay:45, probWriteoff:12, dsoChange:15, payThreshold6M:72,
      creditLimitHistory: [
        { limit:300000,  changedAt:"2022-06-01T00:00:00Z", reason:"Initial Credit" },
        { limit:600000,  changedAt:"2023-01-10T00:00:00Z", reason:"Annual Review" },
        { limit:900000,  changedAt:"2023-09-20T00:00:00Z", reason:"Business Growth" },
        { limit:1000000, changedAt:"2024-03-15T00:00:00Z", reason:"Annual Review" },
      ],
    },
    {
      id:"c8", name:"Apex Distributors", code:"CUST-104", city:"Ahmedabad", region:"West", industry:"Distribution",
      agentName:"Harsha Patel", creditPeriod:"30 Days", creditLimit:500000,
      outstanding:185000, tenure:9, avgDaysOverdue:8, overdueAmount:32000, brokenPTP:1, disputes:0,
      agingVelocity:5, pastDueTrend:"stable", onTimeRatio:80, orderVolume:420000,
      avgPaymentDays:20, probDelay:28, probWriteoff:6, dsoChange:5, payThreshold6M:88,
      creditLimitHistory: [
        { limit:200000, changedAt:"2024-03-01T00:00:00Z", reason:"Initial Credit" },
        { limit:350000, changedAt:"2024-10-15T00:00:00Z", reason:"Annual Review" },
      ],
    },
  ];

  const loadOverrides = () => {
    try { return JSON.parse(localStorage.getItem(CL_KEY) || "[]"); } catch { return []; }
  };
  const saveOverrides = (arr) => {
    try { localStorage.setItem(CL_KEY, JSON.stringify(arr)); } catch { /* */ }
  };

  // ── approval helpers ──────────────────────────────────────────
  const loadApprovals = () => {
    try { return JSON.parse(localStorage.getItem(APPROVALS_KEY) || "[]"); } catch { return []; }
  };
  const saveApprovals = (arr) => {
    try { localStorage.setItem(APPROVALS_KEY, JSON.stringify(arr)); } catch { /* */ }
  };
  const getActiveApproval = (custId) => {
    // Returns the most recent non-superseded approval for this customer
    const all = loadApprovals().filter((a) => a.custId === custId);
    return all.length ? all[all.length - 1] : null;
  };

  const getCustomer = (id) => {
    const base = BASE_CUSTOMERS.find((c) => c.id === id);
    if (!base) return null;
    const ov = loadOverrides().find((o) => o.id === id);
    return ov ? { ...base, ...ov } : { ...base };
  };

  // ── parameter config (simplified — no slider fields) ──────────
  const PARAMS = [
    { key:"paymentHistory", label:"Payment History",       sub:"Avg days overdue",               direction:"lower_better",  unit:" days", defaultWeight:9,  dataFn:(c)=>c.avgDaysOverdue },
    { key:"utilisation",    label:"Utilisation Level",     sub:"Credit utilisation %",           direction:"lower_better",  unit:"%",     defaultWeight:7,  dataFn:(c)=>Math.round(c.outstanding/c.creditLimit*100) },
    { key:"orderVolume",    label:"Order Volume",          sub:"Order value (Rs. L)",            direction:"higher_better", unit:" L",    defaultWeight:5,  dataFn:(c)=>Math.round(c.orderVolume/100000) },
    { key:"overdueRatio",   label:"Overdue Ratio",         sub:"Overdue as % of outstanding",    direction:"lower_better",  unit:"%",     defaultWeight:8,  dataFn:(c)=>c.outstanding?Math.round(c.overdueAmount/c.outstanding*100):0 },
    { key:"tenure",         label:"Customer Tenure",       sub:"Months as customer",             direction:"higher_better", unit:" mo",   defaultWeight:4,  dataFn:(c)=>c.tenure },
    { key:"brokenPTP",      label:"Broken PTPs",           sub:"Broken promise-to-pay",          direction:"lower_better",  unit:"",      defaultWeight:8,  dataFn:(c)=>c.brokenPTP },
    { key:"disputes",       label:"Number of Disputes",    sub:"Open / historical",              direction:"lower_better",  unit:"",      defaultWeight:7,  dataFn:(c)=>c.disputes },
    { key:"agingVelocity",  label:"Aging Velocity",        sub:"Days/month increase",            direction:"lower_better",  unit:" d/mo", defaultWeight:6,  dataFn:(c)=>c.agingVelocity },
    { key:"pastDueTrend",   label:"Past Due Trend",        sub:"Improving / Stable / Worsening", direction:"higher_better", unit:"",      defaultWeight:7,  dataFn:(c)=>c.pastDueTrend==="improving"?90:c.pastDueTrend==="stable"?50:10, displayFn:(c)=>c.pastDueTrend.charAt(0).toUpperCase()+c.pastDueTrend.slice(1) },
    { key:"onTimeRatio",    label:"On-time Payment Ratio", sub:"% invoices paid on time",        direction:"higher_better", unit:"%",     defaultWeight:9,  dataFn:(c)=>c.onTimeRatio },
    { key:"avgPaymentDays", label:"Avg Payment Days",      sub:"Avg days to clear invoice",      direction:"lower_better",  unit:" days", defaultWeight:8,  dataFn:(c)=>c.avgPaymentDays },
    { key:"probDelay",      label:"Prob. Delay in Payment",sub:"Likelihood of payment delay",    direction:"lower_better",  unit:"%",     defaultWeight:9,  dataFn:(c)=>c.probDelay },
    { key:"probWriteoff",   label:"Prob. of Write-off",    sub:"Likelihood of bad debt",         direction:"lower_better",  unit:"%",     defaultWeight:10, dataFn:(c)=>c.probWriteoff },
    { key:"dsoChange",      label:"Change in DSO %",       sub:"Δ Days Sales Outstanding",       direction:"lower_better",  unit:"%",     defaultWeight:7,  dataFn:(c)=>c.dsoChange },
    { key:"exposureVsOld",  label:"% Exposure vs Old Limit",sub:"Outstanding vs prev credit limit",direction:"lower_better", unit:"%",    defaultWeight:8,  dataFn:(c)=>{ const h=c.creditLimitHistory||[]; const ol=h.length>=2?h[h.length-2].limit:c.creditLimit; return Math.round(c.outstanding/ol*100); } },
    { key:"payThreshold6M", label:"6M Payment Threshold",  sub:"% invoices cleared in 6 months",direction:"higher_better", unit:"%",     defaultWeight:8,  dataFn:(c)=>c.payThreshold6M },
  ];

  // lower_better keys (for change direction logic)
  const LOWER_BETTER = new Set(["paymentHistory","utilisation","overdueRatio","brokenPTP","disputes","agingVelocity","avgPaymentDays","probDelay","probWriteoff","dsoChange","exposureVsOld"]);

  // ── score functions ───────────────────────────────────────────
  const scoreParam = (key, c) => {
    switch (key) {
      case "paymentHistory": return Math.max(0, Math.round(100 - c.avgDaysOverdue * 2));
      case "utilisation":    return Math.max(0, Math.round(100 - (c.outstanding / c.creditLimit) * 100));
      case "orderVolume":    return Math.min(100, Math.round(c.orderVolume / 40000));
      case "overdueRatio":   return c.outstanding ? Math.max(0, Math.round(100 - (c.overdueAmount / c.outstanding) * 100)) : 100;
      case "tenure":         return Math.min(100, Math.round(c.tenure * 2));
      case "brokenPTP":      return Math.max(0, Math.round(100 - c.brokenPTP * 14));
      case "disputes":       return Math.max(0, Math.round(100 - c.disputes * 12));
      case "agingVelocity":  return Math.max(0, Math.round(100 - c.agingVelocity * 5));
      case "pastDueTrend":   return c.pastDueTrend === "improving" ? 100 : c.pastDueTrend === "stable" ? 60 : 20;
      case "onTimeRatio":    return Math.min(100, Math.max(0, c.onTimeRatio));
      case "avgPaymentDays": return Math.max(0, Math.round(100 - c.avgPaymentDays * 1.5));
      case "probDelay":      return Math.max(0, Math.round(100 - c.probDelay));
      case "probWriteoff":   return Math.max(0, Math.round(100 - c.probWriteoff * 3));
      case "dsoChange":      return Math.max(0, Math.min(100, Math.round(80 - c.dsoChange * 2)));
      case "exposureVsOld": {
        const h = c.creditLimitHistory || [];
        const ol = h.length >= 2 ? h[h.length - 2].limit : c.creditLimit;
        const pct = Math.round(c.outstanding / ol * 100);
        return Math.max(0, 100 - pct);
      }
      case "payThreshold6M": return Math.min(100, Math.max(0, c.payThreshold6M));
      default: return 50;
    }
  };

  // composite credit score at a given creditLimit
  const calcScore = (creditLimit) => {
    const c = { ...cust, creditLimit };
    let wSum = 0, wTotal = 0;
    PARAMS.forEach((p) => {
      wSum   += scoreParam(p.key, c) * p.defaultWeight;
      wTotal += p.defaultWeight;
    });
    return wTotal ? Math.round(wSum / wTotal) : 0;
  };

  // ── param value at a given credit limit ───────────────────────
  // Only "utilisation" changes with credit limit; all others use current cust data
  const getValAtLimit = (param, creditLimit) => {
    if (param.key === "utilisation") return Math.round(cust.outstanding / creditLimit * 100);
    return param.dataFn(cust);
  };

  const getDisplayAtLimit = (param, creditLimit) => {
    const val = getValAtLimit(param, creditLimit);
    if (param.displayFn) return param.displayFn(cust); // categorical — doesn't change
    return String(val) + param.unit;
  };

  // ── % change helpers ──────────────────────────────────────────
  const pctChange = (curr, next) => {
    if (curr === 0) return next === 0 ? 0 : 100;
    return Math.round((next - curr) / Math.abs(curr) * 100);
  };

  // Is this change beneficial for this key?
  const changeIsGood = (key, pct) => {
    if (key === "_score") return pct > 0;
    return LOWER_BETTER.has(key) ? pct < 0 : pct > 0;
  };

  const changeBadgeHtml = (key, pct) => {
    if (pct === 0) return `<span class="changeBadge changeBadgeGray">No Change</span>`;
    const good = changeIsGood(key, pct);
    const cls  = good ? "changeBadgeGreen" : "changeBadgeRed";
    const icon = pct > 0 ? "↑" : "↓";
    return `<span class="changeBadge ${cls}">${icon} ${Math.abs(pct)}%</span>`;
  };

  // ── colour helpers ────────────────────────────────────────────
  const scoreCircleClass = (s) => s >= 70 ? "scoreCircleGreen" : s >= 40 ? "scoreCircleAmber" : "scoreCircleRed";
  const barClass         = (p) => p > 100 ? "uRed" : p >= 80 ? "uAmber" : "uGreen";

  const statusChipHtml = (pct) => {
    if (pct > 100) return `<span class="statusChip chipRed">Over-Utilising</span>`;
    if (pct >= 80)  return `<span class="statusChip chipAmber">Approaching Limit</span>`;
    if (pct < 50)   return `<span class="statusChip chipBlue">Under-Utilising</span>`;
    return               `<span class="statusChip chipGreen">Healthy</span>`;
  };

  // ── customer search / selector ────────────────────────────────
  let searchQuery  = "";
  let dropdownOpen = false;

  const getFilteredCustomers = () => {
    if (!searchQuery) return BASE_CUSTOMERS;
    const q = searchQuery.toLowerCase();
    return BASE_CUSTOMERS.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      c.region.toLowerCase().includes(q) ||
      c.industry.toLowerCase().includes(q)
    );
  };

  const renderDropdown = (activeCustId) => {
    const dropdown = $("custSearchDropdown");
    const list     = getFilteredCustomers();
    if (!list.length) {
      dropdown.innerHTML = `<div style="padding:12px 14px; color:#94a3b8; font-size:13px;">No customers found</div>`;
    } else {
      dropdown.innerHTML = list.map((c) => {
        const pct    = Math.round(c.outstanding / c.creditLimit * 100);
        const pctCls = pct > 100 ? "color:#b91c1c" : pct >= 80 ? "color:#a16207" : "color:#15803d";
        return `
          <div class="clCustSearchItem ${c.id === activeCustId ? "is-selected" : ""}"
            data-id="${esc(c.id)}" role="option" aria-selected="${c.id === activeCustId}">
            <div class="clCustSearchItemLeft">
              <span class="clCustSearchItemName">${esc(c.name)}</span>
              <span class="clCustSearchItemCode">${esc(c.code)} · ${esc(c.region)} · ${esc(c.industry)}</span>
            </div>
            <div class="clCustSearchItemRight">
              <span class="clCustSearchItemUtil" style="${pctCls}">${pct}%</span>
              <span class="statusChip ${pct > 100 ? "chipRed" : pct >= 80 ? "chipAmber" : pct < 50 ? "chipBlue" : "chipGreen"}" style="font-size:10px;">${pct > 100 ? "Over" : pct >= 80 ? "Near" : pct < 50 ? "Low" : "OK"}</span>
            </div>
          </div>`;
      }).join("");
    }
    dropdown.querySelectorAll(".clCustSearchItem").forEach((item) => {
      item.addEventListener("click", () => {
        window.location.href = "credit-limit-detail.html?id=" + item.dataset.id;
      });
    });
  };

  const openDropdown = (activeCustId) => {
    dropdownOpen = true;
    $("custSearchDropdown").classList.remove("hidden");
    $("custSearchInput").setAttribute("aria-expanded", "true");
    renderDropdown(activeCustId);
  };

  const closeDropdown = () => {
    dropdownOpen = false;
    $("custSearchDropdown").classList.add("hidden");
    $("custSearchInput").setAttribute("aria-expanded", "false");
  };

  $("custSearchInput").addEventListener("focus", () => openDropdown(currentCustId));
  $("custSearchInput").addEventListener("input", (e) => {
    searchQuery = e.target.value.trim();
    renderDropdown(currentCustId);
    if (!dropdownOpen) openDropdown(currentCustId);
  });

  document.addEventListener("click", (e) => {
    if (!e.target.closest(".clCustSearchWrap")) closeDropdown();
  });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeDropdown();
  });

  // ── URL param ─────────────────────────────────────────────────
  const urlParams     = new URLSearchParams(window.location.search);
  const currentCustId = urlParams.get("id") || null;
  const cust          = currentCustId ? getCustomer(currentCustId) : null;

  if (cust) $("custSearchInput").value = cust.name + "  (" + cust.code + ")";

  if (!cust) {
    $("clNoCustomer").style.display     = "";
    $("clCustomerDetail").style.display = "none";
    document.body.classList.remove("motion-preload");
    setTimeout(() => { openDropdown(null); $("custSearchInput").focus(); }, 100);
    return;
  }

  $("clNoCustomer").style.display     = "none";
  $("clCustomerDetail").style.display = "";

  // ── render header ─────────────────────────────────────────────
  const utilPct = Math.round(cust.outstanding / cust.creditLimit * 100);
  const bc      = barClass(utilPct);

  $("clDetailName").textContent = cust.name;
  $("clDetailPills").innerHTML =
    `<span class="heroTag" style="font-size:11px;">${esc(cust.code)}</span>` +
    `<span class="heroTag" style="font-size:11px;">${esc(cust.region)} · ${esc(cust.city)}</span>` +
    `<span class="heroTag" style="font-size:11px;">${esc(cust.industry)}</span>` +
    statusChipHtml(utilPct);

  $("clDetailLimit").textContent       = "Rs. " + fmt(cust.creditLimit);
  $("clDetailPeriod").textContent      = "Credit Period: " + cust.creditPeriod;
  $("clDetailOutstanding").textContent = "Rs. " + fmt(cust.outstanding);
  $("clDetailOverdue").textContent     = "Overdue: Rs. " + fmt(cust.overdueAmount);
  $("clDetailPct").textContent         = utilPct + "%";

  const fillEl = $("clUtilFill");
  fillEl.style.width = Math.min(utilPct, 100) + "%";
  fillEl.className   = "clUtilBarLargeFill " + bc;

  // credit score (based on current limit)
  const currentScore = calcScore(cust.creditLimit);
  const circle = $("clScoreCircle");
  circle.textContent = currentScore;
  circle.className   = "scoreCircle " + scoreCircleClass(currentScore);

  // ── customer profile ──────────────────────────────────────────
  $("clInfoList").innerHTML = [
    ["Agent",           cust.agentName],
    ["Region",          cust.region],
    ["City",            cust.city],
    ["Industry",        cust.industry],
    ["Customer Tenure", cust.tenure + " months"],
    ["Credit Period",   cust.creditPeriod],
    ["Order Volume",    "Rs. " + fmt(cust.orderVolume)],
  ].map(([k, v]) =>
    `<div class="clInfoRow"><span class="clInfoKey">${esc(k)}</span><span class="clInfoVal">${esc(String(v))}</span></div>`
  ).join("");

  // ── risk panel ────────────────────────────────────────────────
  const renderRiskBanner = () => {
    const el = $("clRiskBanner");
    if (utilPct > 100)
      el.innerHTML = `<div class="riskBanner riskBannerRed"><i class="bi bi-exclamation-triangle-fill"></i><span>Over-utilising by <strong>Rs. ${fmt(cust.outstanding - cust.creditLimit)}</strong>. Immediate review recommended.</span></div>`;
    else if (utilPct >= 80)
      el.innerHTML = `<div class="riskBanner riskBannerAmber"><i class="bi bi-exclamation-circle-fill"></i><span>Approaching credit limit — ${utilPct}% utilised.</span></div>`;
    else
      el.innerHTML = `<div class="riskBanner riskBannerGreen"><i class="bi bi-check-circle-fill"></i><span>Credit utilisation within acceptable range (${utilPct}%).</span></div>`;
  };

  const riskDot = (s) => s >= 70 ? `<span class="riskDotGreen"></span>` : s >= 40 ? `<span class="riskDotAmber"></span>` : `<span class="riskDotRed"></span>`;
  const scoreCls = (s) => s >= 70 ? "scoreHigh" : s >= 40 ? "scoreMid" : "scoreLow";

  const riskValueLabel = (key) => {
    switch (key) {
      case "paymentHistory": return cust.avgDaysOverdue + " days avg overdue";
      case "utilisation":    return utilPct + "% utilised";
      case "orderVolume":    return "Rs. " + fmt(cust.orderVolume);
      case "overdueRatio":   return (cust.outstanding ? Math.round(cust.overdueAmount / cust.outstanding * 100) : 0) + "% overdue";
      case "tenure":         return cust.tenure + " months";
      case "brokenPTP":      return cust.brokenPTP + " broken PTPs";
      case "disputes":       return cust.disputes + " disputes";
      case "agingVelocity":  return "+" + cust.agingVelocity + " days/month";
      case "pastDueTrend":   return cust.pastDueTrend.charAt(0).toUpperCase() + cust.pastDueTrend.slice(1);
      case "onTimeRatio":    return cust.onTimeRatio + "% on time";
      case "avgPaymentDays": return cust.avgPaymentDays + " days avg";
      case "probDelay":      return cust.probDelay + "% probability";
      case "probWriteoff":   return cust.probWriteoff + "% probability";
      case "dsoChange": {
        const v = cust.dsoChange;
        return (v >= 0 ? "+" : "") + v + "% change";
      }
      case "exposureVsOld": {
        const h = cust.creditLimitHistory || [];
        const ol = h.length >= 2 ? h[h.length - 2].limit : cust.creditLimit;
        return Math.round(cust.outstanding / ol * 100) + "% of old limit";
      }
      case "payThreshold6M": return cust.payThreshold6M + "% cleared";
      default: return "—";
    }
  };

  const renderRiskCards = () => {
    // Find the previous credit limit from history to compute score deltas
    const history    = getHistory();
    const prevEntry  = history.length >= 2 ? history[history.length - 2] : null;
    const prevLimit  = prevEntry ? prevEntry.limit : null;
    const prevCust   = prevLimit ? { ...cust, creditLimit: prevLimit } : null;

    $("clRiskList").innerHTML = `<div class="riskCardsGrid">${PARAMS.map((p) => {
      const s       = scoreParam(p.key, cust);
      const cls     = scoreCls(s);
      const barCls  = s >= 70 ? "riskBarGreen" : s >= 40 ? "riskBarAmber" : "riskBarRed";
      const dotHtml = riskDot(s);

      // % change pill vs previous credit limit period
      let changePill = "";
      if (prevCust) {
        const sPrev = scoreParam(p.key, prevCust);
        const pct   = pctChange(sPrev, s);
        changePill  = changeBadgeHtml(p.key, pct);
      }

      return `
        <div class="riskCard">
          <div class="riskCardHeader">
            ${dotHtml}
            <span class="riskCardLabel">${esc(p.label)}</span>
          </div>
          <div class="riskCardSub">${esc(p.sub)}</div>
          <div class="riskCardValue ${cls}">${esc(riskValueLabel(p.key))}</div>
          <div class="riskCardBar">
            <div class="riskCardBarFill ${barCls}" style="width:${s}%"></div>
          </div>
          <div class="riskCardScore">Score: <strong>${s}</strong>/100${changePill ? " &nbsp;" + changePill : ""}</div>
        </div>`;
    }).join("")}</div>`;
  };

  // ── impact view rendering ─────────────────────────────────────
  const renderImpactView = (newLimit) => {
    const newScore  = calcScore(newLimit);
    const scorePct  = pctChange(currentScore, newScore);

    const scoreRowHtml = `
      <div class="impactScoreRow">
        <div class="impactScoreRowLeft">
          <div class="impactScoreStat">
            <div class="impactScoreStatLabel">Credit Score — Current</div>
            <div class="impactScoreStatVal" style="color:#94a3b8;">${currentScore}</div>
          </div>
          <div class="impactScoreArrow"><i class="bi bi-arrow-right" aria-hidden="true"></i></div>
          <div class="impactScoreStat">
            <div class="impactScoreStatLabel">Credit Score — Proposed</div>
            <div class="impactScoreStatVal ${scoreCircleClass(newScore).replace("Circle","").toLowerCase()}">${newScore}</div>
          </div>
        </div>
        <div>${changeBadgeHtml("_score", scorePct)}</div>
      </div>`;

    const cardsHtml = PARAMS.map((p) => {
      const curVal  = getValAtLimit(p, cust.creditLimit);
      const newVal  = getValAtLimit(p, newLimit);
      const curDisp = getDisplayAtLimit(p, cust.creditLimit);
      const newDisp = getDisplayAtLimit(p, newLimit);
      const pct     = pctChange(curVal, newVal);
      const changed = pct !== 0;

      return `
        <div class="impactCard ${changed ? "hasChange" : ""}">
          <div class="impactCardLabel">${esc(p.label)}</div>
          <div class="impactCardSub">${esc(p.sub)}</div>
          <div class="impactCardValues">
            <span class="impactCardCurr">${esc(curDisp)}</span>
            <span class="impactCardArrow"><i class="bi bi-arrow-right" aria-hidden="true"></i></span>
            <span class="impactCardNew">${esc(newDisp)}</span>
          </div>
          ${changeBadgeHtml(p.key, pct)}
        </div>`;
    }).join("");

    $("clImpactViewContent").innerHTML = scoreRowHtml + `<div class="impactCardsGrid">${cardsHtml}</div>`;
  };

  // ── compare view rendering ────────────────────────────────────

  // Get full credit limit history for current customer (base + any saved changes)
  const getHistory = () => {
    const baseCust  = BASE_CUSTOMERS.find((c) => c.id === cust.id);
    const history   = [...(baseCust?.creditLimitHistory || [])];
    // Merge any additionally saved changes from localStorage overrides
    const override  = loadOverrides().find((o) => o.id === cust.id);
    if (override?.creditLimitHistory) {
      override.creditLimitHistory.forEach((h) => {
        if (!history.find((bh) => bh.changedAt === h.changedAt)) history.push(h);
      });
    }
    return history; // chronological order, oldest first
  };

  // Compact formatter for chips: "6.0L" / "2.5Cr" / "3,50,000"
  const fmtCompact = (n) => {
    const v = Number(n || 0);
    if (v >= 1e7) return (v / 1e7).toFixed(1) + "Cr";
    if (v >= 1e5) return (v / 1e5).toFixed(1) + "L";
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(v);
  };

  const renderCompareView = (newLimit) => {
    const history      = getHistory();
    const total        = history.length;
    const showProposed = newLimit !== null && newLimit !== undefined;

    // Update subtitle
    const subtitle = $("clImpactSubtitle");
    if (subtitle) subtitle.textContent = showProposed
      ? "Last changes vs proposed: " + fmtCr(newLimit)
      : "Last " + Math.min(total || 0, 4) + " credit limit changes";

    if (total === 0) {
      const proposedTh = showProposed ? `<th class="colProposed">Proposed<br><small style="font-size:10px;font-weight:500;">Rs. ${fmt(newLimit)}</small></th>` : "";
      const noBanner   = `<div class="clNoPriorBanner"><i class="bi bi-info-circle" aria-hidden="true"></i>No previous credit limit change on record.</div>`;
      $("clCompareViewContent").innerHTML = `${noBanner}
        <div class="clCompareWrap"><table class="clCompareTable">
          <thead><tr>
            <th style="text-align:left;">Parameter</th>
            <th>Current<br><small style="font-size:10px;font-weight:500;">Rs. ${fmt(cust.creditLimit)}</small></th>
            ${proposedTh}
          </tr></thead>
          <tbody>
            <tr><td><div class="clCompareParamName">Credit Score</div><div class="clCompareParamSub">Composite risk score</div></td>
              <td>${currentScore}</td>
              ${showProposed ? `<td class="colProposed">${calcScore(newLimit)}&nbsp;${changeBadgeHtml("_score", pctChange(currentScore, calcScore(newLimit)))}</td>` : ""}
            </tr>
            ${PARAMS.map((p) => {
              const curDisp = getDisplayAtLimit(p, cust.creditLimit);
              const pct     = showProposed ? pctChange(getValAtLimit(p, cust.creditLimit), getValAtLimit(p, newLimit)) : 0;
              const badge   = showProposed && pct !== 0 ? "&nbsp;" + changeBadgeHtml(p.key, pct) : "";
              const propTd  = showProposed ? `<td class="colProposed">${esc(getDisplayAtLimit(p, newLimit))}${badge}</td>` : "";
              return `<tr><td><div class="clCompareParamName">${esc(p.label)}</div><div class="clCompareParamSub">${esc(p.sub)}</div></td>
                <td>${esc(curDisp)}</td>${propTd}</tr>`;
            }).join("")}
          </tbody>
        </table></div>`;
      return;
    }

    // ── default selection: last 4 ──────────────────────────────
    if (compareSelectedIndices === null) {
      const end   = total;
      const start = Math.max(0, end - 4);
      compareSelectedIndices = Array.from({ length: end - start }, (_, i) => start + i);
    }

    // ensure valid indices after potential history change
    compareSelectedIndices = compareSelectedIndices.filter((i) => i < total);
    if (compareSelectedIndices.length === 0) compareSelectedIndices = [total - 1];

    const selectedHistory = [...compareSelectedIndices]
      .sort((a, b) => a - b)
      .map((i) => ({ ...history[i], _idx: i }));

    // ── multiselect chips (only when total > 4) ────────────────
    let chipsHtml = "";
    if (total > 4) {
      const chipItems = history.map((h, i) => {
        const isSelected = compareSelectedIndices.includes(i);
        const dateStr    = new Date(h.changedAt).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        return `<div class="clHistoryChip ${isSelected ? "is-selected" : ""}" data-hidx="${i}" role="checkbox" aria-checked="${isSelected}" tabindex="0">
          ${isSelected ? '<span class="clChipDot"></span>' : ""}
          ${esc(dateStr)} · Rs. ${fmtCompact(h.limit)}
        </div>`;
      }).join("");

      chipsHtml = `
        <div class="clHistorySelect">
          <div class="clHistorySelectLabel">Select changes to compare</div>
          ${chipItems}
        </div>`;
    }

    // ── table ──────────────────────────────────────────────────
    const histColHeaders = selectedHistory.map((h) => {
      const dateStr = new Date(h.changedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" });
      return `<th>${esc(dateStr)}<br><small style="font-weight:500;font-size:10px;">Rs. ${fmt(h.limit)}</small></th>`;
    }).join("");

    const proposedTh = showProposed
      ? `<th class="colProposed">Proposed<br><small style="font-weight:500;font-size:10px;">Rs. ${fmt(newLimit)}</small></th>`
      : "";

    const theadHtml = `<tr>
      <th style="text-align:left;">Parameter</th>
      ${histColHeaders}
      <th>Current<br><small style="font-weight:500;font-size:10px;">Rs. ${fmt(cust.creditLimit)}</small></th>
      ${proposedTh}
    </tr>`;

    const newScore = showProposed ? calcScore(newLimit) : null;

    // Score row — each cell shows badge vs its left neighbour
    const scoreHistCells = selectedHistory.map((h, i) => {
      const s    = calcScore(h.limit);
      const prev = i > 0 ? calcScore(selectedHistory[i - 1].limit) : null;
      const badge = prev !== null ? "&nbsp;" + changeBadgeHtml("_score", pctChange(prev, s)) : "";
      return `<td>${s}${badge}</td>`;
    }).join("");

    const lastHistScore   = selectedHistory.length > 0 ? calcScore(selectedHistory[selectedHistory.length - 1].limit) : null;
    const curScoreBadge   = lastHistScore !== null ? "&nbsp;" + changeBadgeHtml("_score", pctChange(lastHistScore, currentScore)) : "";
    const proposedScoreBadge = showProposed ? changeBadgeHtml("_score", pctChange(currentScore, newScore)) : "";
    const proposedScoreTd = showProposed ? `<td class="colProposed">${newScore}&nbsp;${proposedScoreBadge}</td>` : "";

    const scoreChanged = (showProposed && currentScore !== newScore) || selectedHistory.some((h) => calcScore(h.limit) !== currentScore);
    const scoreRowHtml = `
      <tr class="${scoreChanged ? "compareRowChanged" : ""}">
        <td><div class="clCompareParamName">Credit Score</div><div class="clCompareParamSub">Composite risk score</div></td>
        ${scoreHistCells}
        <td>${currentScore}${curScoreBadge}</td>
        ${proposedScoreTd}
      </tr>`;

    // Param rows — each cell shows badge vs its left neighbour
    const paramRowsHtml = PARAMS.map((p) => {
      const histCells = selectedHistory.map((h, i) => {
        const disp    = esc(getDisplayAtLimit(p, h.limit));
        const prevVal = i > 0 ? getValAtLimit(p, selectedHistory[i - 1].limit) : null;
        const pct     = prevVal !== null ? pctChange(prevVal, getValAtLimit(p, h.limit)) : 0;
        const badge   = prevVal !== null && pct !== 0 ? "&nbsp;" + changeBadgeHtml(p.key, pct) : "";
        return `<td>${disp}${badge}</td>`;
      }).join("");

      const curVal  = getValAtLimit(p, cust.creditLimit);
      const curDisp = getDisplayAtLimit(p, cust.creditLimit);

      const lastHistVal  = selectedHistory.length > 0 ? getValAtLimit(p, selectedHistory[selectedHistory.length - 1].limit) : null;
      const curPct       = lastHistVal !== null ? pctChange(lastHistVal, curVal) : 0;
      const curBadge     = lastHistVal !== null && curPct !== 0 ? "&nbsp;" + changeBadgeHtml(p.key, curPct) : "";

      const propPct  = showProposed ? pctChange(curVal, getValAtLimit(p, newLimit)) : 0;
      const propBadge = showProposed && propPct !== 0 ? "&nbsp;" + changeBadgeHtml(p.key, propPct) : "";
      const propTd   = showProposed ? `<td class="colProposed">${esc(getDisplayAtLimit(p, newLimit))}${propBadge}</td>` : "";

      const changed  = (showProposed && propPct !== 0) || selectedHistory.some((h) => getValAtLimit(p, h.limit) !== curVal);
      return `
        <tr class="${changed ? "compareRowChanged" : ""}">
          <td><div class="clCompareParamName">${esc(p.label)}</div><div class="clCompareParamSub">${esc(p.sub)}</div></td>
          ${histCells}
          <td>${esc(curDisp)}${curBadge}</td>
          ${propTd}
        </tr>`;
    }).join("");

    $("clCompareViewContent").innerHTML = `
      ${chipsHtml}
      <div class="clCompareWrap">
        <table class="clCompareTable">
          <thead>${theadHtml}</thead>
          <tbody>${scoreRowHtml}${paramRowsHtml}</tbody>
        </table>
      </div>`;

    // ── bind chip click/keyboard events ───────────────────────
    if (total > 4) {
      $("clCompareViewContent").querySelectorAll(".clHistoryChip").forEach((chip) => {
        const toggle = () => {
          const idx = Number(chip.dataset.hidx);
          if (compareSelectedIndices.includes(idx)) {
            if (compareSelectedIndices.length <= 1) return;
            compareSelectedIndices = compareSelectedIndices.filter((i) => i !== idx);
          } else {
            compareSelectedIndices = [...compareSelectedIndices, idx];
          }
          renderCompareView(impactShown ? lastRenderedLimit : null);
        };
        chip.addEventListener("click", toggle);
        chip.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); toggle(); } });
      });
    }
  };

  // ── panel state ───────────────────────────────────────────────
  let activeView             = "default"; // "default" | "compare"
  let impactShown            = false;
  let lastRenderedLimit      = null;
  let compareSelectedIndices = null; // null = use default (last 4)

  // helpers to switch content areas
  const showContent = (show) => {
    $("clRiskContent").style.display        = show === "risk"    ? "" : "none";
    $("clImpactViewContent").style.display  = show === "impact"  ? "" : "none";
    $("clCompareViewContent").style.display = show === "compare" ? "" : "none";
  };

  const showImpactPanel = (newLimit) => {
    impactShown       = true;
    lastRenderedLimit = newLimit;
    activeView        = "default";

    // Update panel title → Impact Analysis
    const titleText = $("clMainPanelTitleText");
    const icon      = $("clMainPanelIcon");
    const defBtn    = $("btnDefaultView");
    if (titleText) titleText.textContent = "Impact Analysis";
    if (icon)      { icon.className = "bi bi-bar-chart-line"; icon.style.color = ""; }
    if (defBtn)    defBtn.textContent = "Impact View";
    $("btnDefaultView").classList.add("is-active");
    $("btnCompareView").classList.remove("is-active");

    $("clImpactSubtitle").textContent = "Proposed: " + fmtCr(newLimit);
    const saveRow = $("clImpactSaveRow");
    if (saveRow) saveRow.style.display = "flex";

    renderImpactView(newLimit);
    showContent("impact");
  };

  // ── Change Credit Limit CTA ───────────────────────────────────
  $("clChangeLimitBtn")?.addEventListener("click", () => {
    const panel = $("clSetLimitPanel");
    const btn   = $("clChangeLimitBtn");
    const isOpen = panel.style.display !== "none";
    panel.style.display = isOpen ? "none" : "";
    btn.classList.toggle("is-active", !isOpen);
  });

  $("clSetLimitCloseBtn")?.addEventListener("click", () => {
    $("clSetLimitPanel").style.display = "none";
    $("clChangeLimitBtn")?.classList.remove("is-active");
  });

  // ── Default / Risk tab ────────────────────────────────────────
  $("btnDefaultView").addEventListener("click", () => {
    activeView = "default";
    $("btnDefaultView").classList.add("is-active");
    $("btnCompareView").classList.remove("is-active");
    if (impactShown && lastRenderedLimit) {
      renderImpactView(lastRenderedLimit);
      showContent("impact");
    } else {
      showContent("risk");
    }
  });

  // ── Compare View tab ──────────────────────────────────────────
  $("btnCompareView").addEventListener("click", () => {
    activeView = "compare";
    $("btnCompareView").classList.add("is-active");
    $("btnDefaultView").classList.remove("is-active");
    // Always render compare — proposed column only if impact has been viewed
    renderCompareView(impactShown ? lastRenderedLimit : null);
    showContent("compare");
  });

  // live update as user types (only after first View Impact)
  $("clNewLimit")?.addEventListener("input", () => {
    if (!impactShown) return;
    const v = Number($("clNewLimit").value);
    if (v > 0) showImpactPanel(v);
  });

  // ── Approval status banner ────────────────────────────────────
  const renderApprovalStatus = () => {
    const approval = getActiveApproval(cust.id);
    const wrap     = $("clApprovalStatusWrap");
    const submitBtn = $("clSubmitApprovalBtn");
    if (!wrap) return;

    if (!approval) {
      wrap.innerHTML = "";
      return;
    }

    const fmtDate = (iso) => new Date(iso).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit"
    });

    if (approval.status === "pending") {
      wrap.innerHTML = `
        <div class="clApprovalBanner pending">
          <i class="bi bi-hourglass-split"></i>
          <div class="clApprovalBannerBody">
            <div class="clApprovalBannerTitle">Pending Approval</div>
            <div class="clApprovalBannerMeta">
              Proposed limit: <strong>Rs. ${fmt(approval.proposedLimit)}</strong>
              ${approval.changeReason ? " · " + esc(approval.changeReason) : ""}
              <br>Submitted: ${fmtDate(approval.submittedAt)}
            </div>
          </div>
          <button class="clApprovalCancelBtn" id="clCancelApprovalBtn" type="button">Cancel</button>
        </div>`;
      // disable form fields and show set-limit panel so banner is visible
      if ($("clNewLimit"))      $("clNewLimit").disabled      = true;
      if ($("clRemarks"))       $("clRemarks").disabled       = true;
      if ($("clViewImpactBtn")) $("clViewImpactBtn").disabled = true;
      const saveRow = $("clImpactSaveRow");
      if (saveRow) saveRow.style.display = "none";
      $("clSetLimitPanel").style.display = "";
      $("clChangeLimitBtn")?.classList.add("is-active");

      $("clCancelApprovalBtn")?.addEventListener("click", () => {
        const all = loadApprovals().filter((a) => a.approvalId !== approval.approvalId);
        saveApprovals(all);
        if ($("clNewLimit"))      $("clNewLimit").disabled      = false;
        if ($("clRemarks"))       $("clRemarks").disabled       = false;
        if ($("clViewImpactBtn")) $("clViewImpactBtn").disabled = false;
        renderApprovalStatus();
      });

    } else if (approval.status === "approved") {
      wrap.innerHTML = `
        <div class="clApprovalBanner approved">
          <i class="bi bi-check-circle-fill"></i>
          <div class="clApprovalBannerBody">
            <div class="clApprovalBannerTitle">Approved — New limit applied</div>
            <div class="clApprovalBannerMeta">
              New credit limit: <strong>Rs. ${fmt(approval.proposedLimit)}</strong>
              ${approval.reviewComment ? " · <em>" + esc(approval.reviewComment) + "</em>" : ""}
              <br>Reviewed: ${fmtDate(approval.reviewedAt)}
            </div>
          </div>
        </div>`;

    } else if (approval.status === "rejected") {
      wrap.innerHTML = `
        <div class="clApprovalBanner rejected">
          <i class="bi bi-x-circle-fill"></i>
          <div class="clApprovalBannerBody">
            <div class="clApprovalBannerTitle">Rejected</div>
            <div class="clApprovalBannerMeta">
              Proposed limit Rs. ${fmt(approval.proposedLimit)} was rejected.
              ${approval.reviewComment ? "<br>Reason: <em>" + esc(approval.reviewComment) + "</em>" : ""}
              <br>Reviewed: ${fmtDate(approval.reviewedAt)}
            </div>
          </div>
        </div>`;
    }
  };

  // ── Email toast ───────────────────────────────────────────────
  let toastTimer = null;
  const showEmailToast = (subText) => {
    const toast = $("clEmailToast");
    const sub   = $("clEmailToastSub");
    if (!toast) return;
    if (sub) sub.textContent = subText;
    toast.style.display = "flex";
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { toast.style.display = "none"; }, 5000);
  };

  $("clEmailToastClose")?.addEventListener("click", () => {
    $("clEmailToast").style.display = "none";
    clearTimeout(toastTimer);
  });

  // ── View Impact button ────────────────────────────────────────
  $("clViewImpactBtn")?.addEventListener("click", () => {
    const newLimit = Number($("clNewLimit")?.value);
    if (!newLimit || newLimit <= 0) { $("clNewLimit")?.focus(); return; }
    showImpactPanel(newLimit);
    $("clMainPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  });

  // ── Save Changes button (direct save, no approval) ───────────
  $("clSaveDirectBtn")?.addEventListener("click", () => {
    const newLimit = Number($("clNewLimit")?.value) || lastRenderedLimit;
    if (!newLimit || newLimit <= 0) return;

    const remarks = $("clRemarks")?.value.trim() || "Manual update";

    // Build merged history: base history + new entry
    const mergedHistory = getHistory();
    mergedHistory.push({ limit: newLimit, changedAt: new Date().toISOString(), reason: remarks });

    // Persist override (creditLimit + history)
    const overrides = loadOverrides().filter((o) => o.id !== cust.id);
    overrides.push({
      id:                  cust.id,
      creditLimit:         newLimit,
      previousCreditLimit: cust.creditLimit,
      creditLimitHistory:  mergedHistory,
    });
    saveOverrides(overrides);

    // Reload page so all hero values, score, risk cards refresh from new data
    window.location.reload();
  });

  // ── Submit for Approval button (inside Impact Analysis panel) ─
  $("clSubmitApprovalBtn")?.addEventListener("click", () => {
    const newLimit = Number($("clNewLimit")?.value) || lastRenderedLimit;
    if (!newLimit || newLimit <= 0) return;

    const remarks    = $("clRemarks")?.value.trim() || "";
    const approvalId = "apr-" + Date.now();

    const approvals = loadApprovals().filter((a) => a.custId !== cust.id || a.status !== "pending");
    approvals.push({
      approvalId,
      custId:        cust.id,
      custName:      cust.name,
      custCode:      cust.code,
      currentLimit:  cust.creditLimit,
      proposedLimit: newLimit,
      changeReason:  remarks,
      submittedAt:   new Date().toISOString(),
      status:        "pending",
      reviewComment: "",
      reviewedAt:    null,
    });
    saveApprovals(approvals);

    // show email toast
    showEmailToast(`Sent to ${SUPERVISOR.username} (${SUPERVISOR.email}) for approval`);

    // hide save row + close set-limit panel
    const saveRow = $("clImpactSaveRow");
    if (saveRow) saveRow.style.display = "none";
    renderApprovalStatus(); // will re-open set-limit panel as pending state
  });

  // ── back ──────────────────────────────────────────────────────
  $("clBackBtn")?.addEventListener("click", () => {
    window.location.href = "credit-limit-dashboard.html";
  });

  // ── init ──────────────────────────────────────────────────────
  renderRiskBanner();
  renderRiskCards();
  renderApprovalStatus();

  const input = $("clNewLimit");
  if (input) {
    // Default to 25% increase rounded to nearest 50k, so View Impact immediately shows change
    const suggested = Math.round(cust.creditLimit * 1.25 / 50000) * 50000;
    input.value = suggested;
  }

  requestAnimationFrame(() => { document.body.classList.remove("motion-preload"); });
})();
