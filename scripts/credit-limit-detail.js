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
  const CL_KEY = "ineburaCreditLimits";

  const BASE_CUSTOMERS = [
    { id:"c1", name:"Apollo Pharmacy Pvt. Ltd.", code:"CUST-001", city:"Mumbai", region:"West", industry:"Healthcare", agentName:"Aditi Sharma", creditPeriod:"30 Days", creditLimit:2000000, outstanding:1280000, tenure:36, avgDaysOverdue:12, overdueAmount:358000, brokenPTP:1, disputes:2, agingVelocity:8, pastDueTrend:"stable", onTimeRatio:72, orderVolume:1565400 },
    { id:"c2", name:"BlueWave", code:"CUST-014", city:"Delhi", region:"North", industry:"Retail", agentName:"Karan Singh", creditPeriod:"45 Days", creditLimit:700000, outstanding:620000, tenure:18, avgDaysOverdue:22, overdueAmount:327000, brokenPTP:3, disputes:4, agingVelocity:14, pastDueTrend:"worsening", onTimeRatio:48, orderVolume:802500 },
    { id:"c3", name:"Sunrise Pvt Ltd", code:"CUST-033", city:"Bengaluru", region:"South", industry:"Manufacturing", agentName:"Sahil Joshi", creditPeriod:"60 Days", creditLimit:1500000, outstanding:1840000, tenure:48, avgDaysOverdue:35, overdueAmount:860000, brokenPTP:5, disputes:6, agingVelocity:18, pastDueTrend:"worsening", onTimeRatio:31, orderVolume:2412000 },
    { id:"c4", name:"GreenTech Solutions", code:"CUST-045", city:"Pune", region:"West", industry:"Technology", agentName:"Priya Menon", creditPeriod:"30 Days", creditLimit:1200000, outstanding:430000, tenure:24, avgDaysOverdue:4, overdueAmount:40000, brokenPTP:0, disputes:1, agingVelocity:3, pastDueTrend:"improving", onTimeRatio:91, orderVolume:980000 },
    { id:"c5", name:"NovaChem India", code:"CUST-062", city:"Chennai", region:"South", industry:"Chemicals", agentName:"Deepak Nair", creditPeriod:"45 Days", creditLimit:900000, outstanding:965000, tenure:12, avgDaysOverdue:28, overdueAmount:420000, brokenPTP:4, disputes:3, agingVelocity:16, pastDueTrend:"worsening", onTimeRatio:42, orderVolume:1120000 },
    { id:"c6", name:"SkyMart Retail", code:"CUST-078", city:"Hyderabad", region:"South", industry:"Retail", agentName:"Pooja Rao", creditPeriod:"30 Days", creditLimit:3000000, outstanding:1050000, tenure:60, avgDaysOverdue:6, overdueAmount:85000, brokenPTP:0, disputes:0, agingVelocity:2, pastDueTrend:"improving", onTimeRatio:95, orderVolume:3640000 },
    { id:"c7", name:"Meridian Pharma", code:"CUST-091", city:"Kolkata", region:"East", industry:"Healthcare", agentName:"Sanjay Das", creditPeriod:"45 Days", creditLimit:800000, outstanding:695000, tenure:30, avgDaysOverdue:18, overdueAmount:215000, brokenPTP:2, disputes:2, agingVelocity:10, pastDueTrend:"stable", onTimeRatio:63, orderVolume:1045000 },
    { id:"c8", name:"Apex Distributors", code:"CUST-104", city:"Ahmedabad", region:"West", industry:"Distribution", agentName:"Harsha Patel", creditPeriod:"30 Days", creditLimit:500000, outstanding:185000, tenure:9, avgDaysOverdue:8, overdueAmount:32000, brokenPTP:1, disputes:0, agingVelocity:5, pastDueTrend:"stable", onTimeRatio:80, orderVolume:420000 },
  ];

  const loadOverrides = () => {
    try { return JSON.parse(localStorage.getItem(CL_KEY) || "[]"); } catch { return []; }
  };
  const saveOverrides = (arr) => {
    try { localStorage.setItem(CL_KEY, JSON.stringify(arr)); } catch { /* */ }
  };
  const getCustomer = (id) => {
    const base = BASE_CUSTOMERS.find((c) => c.id === id);
    if (!base) return null;
    const ov = loadOverrides().find((o) => o.id === id);
    return ov ? { ...base, ...ov } : { ...base };
  };

  // ── parameter config ──────────────────────────────────────────
  // direction: "lower_better" → data > upper = High Risk; "higher_better" → data < lower = Under-performing
  const PARAMS = [
    { key:"paymentHistory",  label:"Payment History",         sub:"Avg days overdue",                direction:"lower_better",  unit:" days", dataFn:(c)=>c.avgDaysOverdue,                                                         sliderMin:0, sliderMax:60,  defaultLower:0,  defaultUpper:20, defaultWeight:9  },
    { key:"utilisation",     label:"Utilisation Level",       sub:"Credit utilisation %",            direction:"lower_better",  unit:"%",     dataFn:(c)=>Math.round(c.outstanding/c.creditLimit*100),                              sliderMin:0, sliderMax:150, defaultLower:0,  defaultUpper:85, defaultWeight:7  },
    { key:"orderVolume",     label:"Order Volume",            sub:"Total order value (Rs. L)",       direction:"higher_better", unit:" L",    dataFn:(c)=>Math.round(c.orderVolume/100000),                                         sliderMin:0, sliderMax:100, defaultLower:5,  defaultUpper:50, defaultWeight:5  },
    { key:"overdueRatio",    label:"Overdue Ratio",           sub:"Overdue as % of outstanding",     direction:"lower_better",  unit:"%",     dataFn:(c)=>c.outstanding?Math.round(c.overdueAmount/c.outstanding*100):0,            sliderMin:0, sliderMax:100, defaultLower:0,  defaultUpper:30, defaultWeight:8  },
    { key:"tenure",          label:"Customer Tenure",         sub:"Months as customer",              direction:"higher_better", unit:" mo",   dataFn:(c)=>c.tenure,                                                                 sliderMin:0, sliderMax:120, defaultLower:12, defaultUpper:60, defaultWeight:4  },
    { key:"brokenPTP",       label:"Broken PTPs",             sub:"Broken promise-to-pay count",     direction:"lower_better",  unit:"",      dataFn:(c)=>c.brokenPTP,                                                              sliderMin:0, sliderMax:10,  defaultLower:0,  defaultUpper:3,  defaultWeight:8  },
    { key:"disputes",        label:"Number of Disputes",      sub:"Open / historical disputes",      direction:"lower_better",  unit:"",      dataFn:(c)=>c.disputes,                                                               sliderMin:0, sliderMax:15,  defaultLower:0,  defaultUpper:4,  defaultWeight:7  },
    { key:"agingVelocity",   label:"Aging Velocity",          sub:"Days/month outstanding increase", direction:"lower_better",  unit:" d/mo", dataFn:(c)=>c.agingVelocity,                                                          sliderMin:0, sliderMax:30,  defaultLower:0,  defaultUpper:12, defaultWeight:6  },
    { key:"pastDueTrend",    label:"Past Due Date Trend",     sub:"Improving=90 / Stable=50 / Worsening=10", direction:"higher_better", unit:"", dataFn:(c)=>c.pastDueTrend==="improving"?90:c.pastDueTrend==="stable"?50:10, displayFn:(c)=>c.pastDueTrend.charAt(0).toUpperCase()+c.pastDueTrend.slice(1), sliderMin:0, sliderMax:100, defaultLower:40, defaultUpper:80, defaultWeight:7 },
    { key:"onTimeRatio",     label:"On-time Payment Ratio",   sub:"% invoices paid on time",         direction:"higher_better", unit:"%",     dataFn:(c)=>c.onTimeRatio,                                                            sliderMin:0, sliderMax:100, defaultLower:60, defaultUpper:85, defaultWeight:9  },
  ];

  // mutable state
  const weights = {};
  const ranges  = {};
  PARAMS.forEach((p) => {
    weights[p.key] = p.defaultWeight;
    ranges[p.key]  = { lower: p.defaultLower, upper: p.defaultUpper };
  });

  // ── score per param (0–100, higher = better) ──────────────────
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
      default: return 50;
    }
  };

  // ── range status ──────────────────────────────────────────────
  const getParamStatus = (param, dataVal) => {
    const r = ranges[param.key];
    if (param.direction === "lower_better") {
      if (dataVal > r.upper) return { label:"High Risk",       cls:"chipRed",   row:"rowRisk"  };
      if (dataVal < r.lower) return { label:"Unusually Low",   cls:"chipBlue",  row:"rowUnder" };
      return                        { label:"Normal",          cls:"chipGreen", row:""         };
    } else {
      if (dataVal < r.lower) return { label:"Under-performing",cls:"chipRed",   row:"rowRisk"  };
      if (dataVal > r.upper) return { label:"Exceeding",       cls:"chipGreen", row:""         };
      return                        { label:"Normal",          cls:"chipSlate", row:""         };
    }
  };

  // ── composite score + suggested limit ─────────────────────────
  const calcSuggested = (c) => {
    let wSum = 0, wTotal = 0;
    PARAMS.forEach((p) => {
      wSum   += scoreParam(p.key, c) * weights[p.key];
      wTotal += weights[p.key];
    });
    const score     = wTotal ? Math.round(wSum / wTotal) : 0;
    const mult      = 0.6 + (score / 100) * 1.6;
    const suggested = Math.round(c.outstanding * mult / 50000) * 50000;
    return { score, suggested };
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
        const id = item.dataset.id;
        window.location.href = "credit-limit-detail.html?id=" + id;
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

  // ── read URL ──────────────────────────────────────────────────
  const urlParams      = new URLSearchParams(window.location.search);
  const currentCustId  = urlParams.get("id") || null;
  const cust           = currentCustId ? getCustomer(currentCustId) : null;

  // populate search input label if customer found
  if (cust) {
    $("custSearchInput").value = cust.name + "  (" + cust.code + ")";
  }

  // show/hide sections
  if (!cust) {
    $("clNoCustomer").style.display  = "";
    $("clCustomerDetail").style.display = "none";
    document.body.classList.remove("motion-preload");

    // immediately open dropdown so user can pick
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

  $("clDetailLimit").textContent      = "Rs. " + fmt(cust.creditLimit);
  $("clDetailPeriod").textContent     = "Credit Period: " + cust.creditPeriod;
  $("clDetailOutstanding").textContent = "Rs. " + fmt(cust.outstanding);
  $("clDetailOverdue").textContent    = "Overdue: Rs. " + fmt(cust.overdueAmount);
  $("clDetailPct").textContent        = utilPct + "%";

  const fillEl = $("clUtilFill");
  fillEl.style.width = Math.min(utilPct, 100) + "%";
  fillEl.className   = "clUtilBarLargeFill " + bc;

  // ── customer profile panel ────────────────────────────────────
  const infoRows = [
    ["Agent",           cust.agentName],
    ["Region",          cust.region],
    ["City",            cust.city],
    ["Industry",        cust.industry],
    ["Customer Tenure", cust.tenure + " months"],
    ["Credit Period",   cust.creditPeriod],
    ["Order Volume",    "Rs. " + fmt(cust.orderVolume)],
  ];
  $("clInfoList").innerHTML = infoRows.map(([k, v]) =>
    `<div class="clInfoRow"><span class="clInfoKey">${esc(k)}</span><span class="clInfoVal">${esc(String(v))}</span></div>`
  ).join("");

  // ── risk banner ───────────────────────────────────────────────
  const renderRiskBanner = () => {
    const el = $("clRiskBanner");
    if (utilPct > 100)
      el.innerHTML = `<div class="riskBanner riskBannerRed"><i class="bi bi-exclamation-triangle-fill"></i><span>Over-utilising credit limit by <strong>Rs. ${fmt(cust.outstanding - cust.creditLimit)}</strong>. Immediate review recommended.</span></div>`;
    else if (utilPct >= 80)
      el.innerHTML = `<div class="riskBanner riskBannerAmber"><i class="bi bi-exclamation-circle-fill"></i><span>Approaching credit limit — ${utilPct}% utilised.</span></div>`;
    else
      el.innerHTML = `<div class="riskBanner riskBannerGreen"><i class="bi bi-check-circle-fill"></i><span>Credit utilisation within acceptable range (${utilPct}%).</span></div>`;
  };

  // ── risk indicator list (left panel) ─────────────────────────
  const riskDot = (s) => s >= 70 ? `<span class="riskDotGreen"></span>` : s >= 40 ? `<span class="riskDotAmber"></span>` : `<span class="riskDotRed"></span>`;

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
      default: return "—";
    }
  };

  const scoreCls = (s) => s >= 70 ? "scoreHigh" : s >= 40 ? "scoreMid" : "scoreLow";

  const renderRiskList = () => {
    $("clRiskList").innerHTML = PARAMS.map((p) => {
      const s = scoreParam(p.key, cust);
      return `
        <div class="riskIndicatorRow">
          <span class="riskIndicatorName">${riskDot(s)}${esc(p.label)}</span>
          <span class="riskIndicatorValue ${scoreCls(s)}">${esc(riskValueLabel(p.key))}</span>
        </div>`;
    }).join("");
  };

  // ── parameter table ───────────────────────────────────────────
  const renderParamTable = () => {
    const tbody = $("clParamTableBody");
    tbody.innerHTML = PARAMS.map((p) => {
      const dataVal = p.dataFn(cust);
      const display = p.displayFn ? p.displayFn(cust) : (dataVal + p.unit);
      const status  = getParamStatus(p, dataVal);
      const r       = ranges[p.key];
      const w       = weights[p.key];

      return `
        <tr class="${status.row}" data-param-row="${esc(p.key)}">
          <td class="clParamTdName">
            <div class="clParamName">${esc(p.label)}</div>
            <div class="clParamSub">${esc(p.sub)}</div>
          </td>
          <td>
            <div class="clWeightCell">
              <input type="range" class="clParamSlider" data-param="${esc(p.key)}"
                min="0" max="10" value="${w}"
                aria-label="Weight for ${esc(p.label)}"
                style="-webkit-appearance:none;appearance:none;width:80px;height:4px;border-radius:999px;background:#e2e8f4;outline:none;cursor:pointer;"
              />
              <span class="clParamWeight" id="pw-${esc(p.key)}">${w}</span>
            </div>
          </td>
          <td>
            <div class="clRangeCell">
              <div class="clRangeLine">
                <span class="clRangeLbl">Min</span>
                <input type="range" class="clMiniSlider" data-param="${esc(p.key)}" data-bound="lower"
                  min="${p.sliderMin}" max="${p.sliderMax}" value="${r.lower}"
                  aria-label="Min range for ${esc(p.label)}"
                />
                <span class="clRangeVal" id="rl-${esc(p.key)}">${r.lower}${esc(p.unit)}</span>
              </div>
              <div class="clRangeLine">
                <span class="clRangeLbl">Max</span>
                <input type="range" class="clMiniSlider" data-param="${esc(p.key)}" data-bound="upper"
                  min="${p.sliderMin}" max="${p.sliderMax}" value="${r.upper}"
                  aria-label="Max range for ${esc(p.label)}"
                />
                <span class="clRangeVal" id="ru-${esc(p.key)}">${r.upper}${esc(p.unit)}</span>
              </div>
            </div>
          </td>
          <td class="clDataCell">${esc(String(display))}</td>
          <td><span class="statusChip ${status.cls}">${esc(status.label)}</span></td>
        </tr>`;
    }).join("");

    // style the weight sliders (inline since they're generated HTML)
    tbody.querySelectorAll(".clParamSlider").forEach((slider) => {
      slider.style.cssText = "-webkit-appearance:none;appearance:none;width:80px;height:4px;border-radius:999px;background:#e2e8f4;outline:none;cursor:pointer;";
      // thumb style via dataset flag (actual styling via clParamSlider class in CSS)
      slider.addEventListener("input", (e) => {
        const key = e.target.dataset.param;
        weights[key] = Number(e.target.value);
        $("pw-" + key).textContent = weights[key];
        updateSuggested();
      });
    });

    tbody.querySelectorAll(".clMiniSlider").forEach((slider) => {
      slider.addEventListener("input", (e) => {
        const key   = e.target.dataset.param;
        const bound = e.target.dataset.bound;
        let val     = Number(e.target.value);
        const r     = ranges[key];

        if (bound === "lower") {
          val = Math.min(val, r.upper - 1);
          e.target.value = val;
          r.lower = val;
          $("rl-" + key).textContent = val + (PARAMS.find((p) => p.key === key)?.unit || "");
        } else {
          val = Math.max(val, r.lower + 1);
          e.target.value = val;
          r.upper = val;
          $("ru-" + key).textContent = val + (PARAMS.find((p) => p.key === key)?.unit || "");
        }

        // update status & row class live
        const param   = PARAMS.find((p) => p.key === key);
        const dataVal = param.dataFn(cust);
        const status  = getParamStatus(param, dataVal);
        const row     = document.querySelector(`tr[data-param-row="${key}"]`);
        if (row) {
          row.className = status.row;
          const chip = row.querySelector(".statusChip");
          if (chip) {
            chip.className   = "statusChip " + status.cls;
            chip.textContent = status.label;
          }
        }

        updateSuggested();
      });
    });
  };

  // ── suggested limit + score ───────────────────────────────────
  const updateSuggested = () => {
    const { score, suggested } = calcSuggested(cust);

    $("clSuggestedValue").textContent = fmtCr(suggested);
    $("clSuggestedMeta").textContent  =
      `Composite score ${score}/100 — ${
        score >= 70 ? "Strong creditworthiness" :
        score >= 40 ? "Moderate risk profile" :
        "High-risk — recommend conservative limit"
      }`;

    const circle    = $("clScoreCircle");
    circle.textContent = score;
    circle.className   = "scoreCircle " + scoreCircleClass(score);

    const input = $("clNewLimit");
    if (input && !input.dataset.manuallySet) input.value = suggested;
  };

  $("clNewLimit")?.addEventListener("input", (e) => { e.target.dataset.manuallySet = "true"; });

  // ── save handler ──────────────────────────────────────────────
  $("clSaveBtn")?.addEventListener("click", () => {
    const newLimit = Number($("clNewLimit")?.value);
    if (!newLimit || newLimit <= 0) { $("clNewLimit")?.focus(); return; }

    const reason    = $("clChangeReason")?.value || "";
    const overrides = loadOverrides().filter((o) => o.id !== cust.id);
    overrides.push({ id: cust.id, creditLimit: newLimit, changeReason: reason, changedAt: new Date().toISOString() });
    saveOverrides(overrides);

    cust.creditLimit = newLimit;
    $("clDetailLimit").textContent = "Rs. " + fmt(newLimit);

    const newPct = Math.round(cust.outstanding / newLimit * 100);
    $("clDetailPct").textContent = newPct + "%";
    const f = $("clUtilFill");
    f.style.width = Math.min(newPct, 100) + "%";
    f.className   = "clUtilBarLargeFill " + barClass(newPct);

    const fb = $("clSaveFeedback");
    fb.classList.add("is-visible");
    setTimeout(() => fb.classList.remove("is-visible"), 2500);
  });

  // ── back ──────────────────────────────────────────────────────
  $("clBackBtn")?.addEventListener("click", () => {
    window.location.href = "credit-limit-dashboard.html";
  });

  // ── init ──────────────────────────────────────────────────────
  renderRiskBanner();
  renderRiskList();
  renderParamTable();
  updateSuggested();

  const input = $("clNewLimit");
  if (input) input.value = cust.creditLimit;

  requestAnimationFrame(() => { document.body.classList.remove("motion-preload"); });
})();
