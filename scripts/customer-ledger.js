(() => {
  const customerData = {
    "Apollo Tyres": {
      openingBalance: 1254000,
      invoiced: 438200,
      collected: 367900,
      netReceivable: 1324300,
      riskBand: "Moderate",
      dso: 46,
      kpis: [
        ["Collection efficiency", "83.9%"],
        ["Promise-to-pay adherence", "71%"],
        ["Dispute ratio", "6.4%"],
        ["Average ticket size", "Rs. 1.86L"]
      ],
      aging: [
        ["0-30 days", 482000],
        ["31-60 days", 356000],
        ["61-90 days", 281000],
        ["90+ days", 205300]
      ],
      timeline: [
        ["2026-03-01", "Follow-up call", "Commitment for Rs. 4.8L by 05 Mar"],
        ["2026-02-28", "Receipt posted", "UTR-93844121 applied to INV-12807"],
        ["2026-02-25", "Dispute update", "Tax deduction claim under finance review"],
        ["2026-02-22", "Visit completed", "Escalated aged invoices to plant finance"],
        ["2026-02-19", "Reminder email", "Attached statement of account and aging" ]
      ],
      lines: [
        ["INV-12821", "2026-03-10", "0-30", "Open", 212500, "Call: promised 05 Mar"],
        ["INV-12807", "2026-03-06", "0-30", "Partially Paid", 96500, "Receipt posted 28 Feb"],
        ["INV-12730", "2026-02-17", "31-60", "Open", 188000, "Visit escalated"],
        ["INV-12645", "2026-01-26", "31-60", "Disputed", 74500, "Tax mismatch under review"],
        ["INV-12588", "2025-12-22", "61-90", "Open", 232000, "Awaiting AP approval"],
        ["INV-12491", "2025-10-28", "90+", "Open", 205300, "Legal notice draft prepared"]
      ]
    },
    "BlueWave Industries": {
      openingBalance: 742000,
      invoiced: 291400,
      collected: 354900,
      netReceivable: 678500,
      riskBand: "Low",
      dso: 31,
      kpis: [
        ["Collection efficiency", "96.1%"],
        ["Promise-to-pay adherence", "88%"],
        ["Dispute ratio", "2.1%"],
        ["Average ticket size", "Rs. 1.24L"]
      ],
      aging: [
        ["0-30 days", 341500],
        ["31-60 days", 204000],
        ["61-90 days", 92000],
        ["90+ days", 41000]
      ],
      timeline: [
        ["2026-03-02", "Collection received", "NEFT received for INV-12267"],
        ["2026-02-27", "Call follow-up", "Commitment converted in 48 hours"],
        ["2026-02-22", "Statement shared", "Month-end reconciliation sent"],
        ["2026-02-18", "Portal upload", "Supporting docs uploaded"],
        ["2026-02-16", "Ageing review", "No high-risk invoices identified"]
      ],
      lines: [
        ["INV-12391", "2026-03-12", "0-30", "Open", 181200, "Reminder sent"],
        ["INV-12355", "2026-02-25", "0-30", "Partially Paid", 102400, "Pending balance"],
        ["INV-12267", "2026-02-15", "31-60", "Partially Paid", 73400, "Collection received"],
        ["INV-12190", "2026-01-20", "31-60", "Open", 130600, "Email follow-up"],
        ["INV-12074", "2025-12-30", "61-90", "Open", 90200, "Escalation prepared"],
        ["INV-11955", "2025-11-16", "90+", "Disputed", 41000, "Pricing claim pending"]
      ]
    },
    "Sundaram Motors": {
      openingBalance: 1668300,
      invoiced: 502100,
      collected: 248500,
      netReceivable: 1921900,
      riskBand: "High",
      dso: 67,
      kpis: [
        ["Collection efficiency", "61.8%"],
        ["Promise-to-pay adherence", "52%"],
        ["Dispute ratio", "11.2%"],
        ["Average ticket size", "Rs. 2.43L"]
      ],
      aging: [
        ["0-30 days", 508100],
        ["31-60 days", 477200],
        ["61-90 days", 412700],
        ["90+ days", 523900]
      ],
      timeline: [
        ["2026-03-01", "Escalation email", "Finance head looped in for aged bucket"],
        ["2026-02-26", "Payment reminder", "No response from AP"],
        ["2026-02-21", "Site visit", "Collection risk flagged to KAM"],
        ["2026-02-18", "Deduction raised", "Delay penalty claim submitted"],
        ["2026-02-14", "Weekly review", "Aging deterioration observed"]
      ],
      lines: [
        ["INV-12504", "2026-03-08", "0-30", "Open", 286400, "Escalation email"],
        ["INV-12488", "2026-02-24", "31-60", "Partially Paid", 228100, "Received part payment"],
        ["INV-12421", "2026-02-02", "31-60", "Disputed", 249100, "Penalty claim in review"],
        ["INV-12360", "2026-01-09", "61-90", "Open", 412700, "Visit completed"],
        ["INV-12203", "2025-11-28", "90+", "Open", 276500, "No AP response"],
        ["INV-12088", "2025-10-19", "90+", "Open", 247400, "Legal escalation pending"]
      ]
    }
  };

  const ledgerCustomer = document.getElementById("ledgerCustomer");
  const ledgerPeriod = document.getElementById("ledgerPeriod");
  const ledgerOpening = document.getElementById("ledgerOpening");
  const ledgerInvoiced = document.getElementById("ledgerInvoiced");
  const ledgerCollected = document.getElementById("ledgerCollected");
  const ledgerNet = document.getElementById("ledgerNet");
  const ledgerSubHeading = document.getElementById("ledgerSubHeading");
  const ledgerRiskTag = document.getElementById("ledgerRiskTag");
  const ledgerDsoTag = document.getElementById("ledgerDsoTag");
  const ledgerAging = document.getElementById("ledgerAging");
  const ledgerKpis = document.getElementById("ledgerKpis");
  const ledgerTimeline = document.getElementById("ledgerTimeline");
  const ledgerSearch = document.getElementById("ledgerSearch");
  const ledgerStatusFilter = document.getElementById("ledgerStatusFilter");
  const ledgerTableBody = document.getElementById("ledgerTableBody");
  const ledgerRowCount = document.getElementById("ledgerRowCount");

  if (!ledgerCustomer || !ledgerTableBody) return;

  const customers = Object.keys(customerData);
  let activeCustomer = customers[0];

  const formatCurrency = (value) => `Rs. ${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

  const getStatusClass = (status) => {
    if (status === "Disputed") return "is-rejected";
    if (status === "Partially Paid") return "is-review";
    return "is-open";
  };

  const getActiveData = () => customerData[activeCustomer];

  const populateCustomers = () => {
    ledgerCustomer.innerHTML = customers
      .map((name) => `<option value="${name}">${name}</option>`)
      .join("");
    ledgerCustomer.value = activeCustomer;
  };

  const renderSummary = () => {
    const data = getActiveData();
    const periodLabel = ledgerPeriod?.selectedOptions?.[0]?.textContent || "Current month";

    if (ledgerOpening) ledgerOpening.textContent = formatCurrency(data.openingBalance);
    if (ledgerInvoiced) ledgerInvoiced.textContent = formatCurrency(data.invoiced);
    if (ledgerCollected) ledgerCollected.textContent = formatCurrency(data.collected);
    if (ledgerNet) ledgerNet.textContent = formatCurrency(data.netReceivable);
    if (ledgerSubHeading) ledgerSubHeading.textContent = `${activeCustomer} | ${periodLabel}`;
    if (ledgerRiskTag) ledgerRiskTag.textContent = `Risk: ${data.riskBand}`;
    if (ledgerDsoTag) ledgerDsoTag.textContent = `DSO: ${data.dso} days`;
  };

  const renderAging = () => {
    if (!ledgerAging) return;
    const data = getActiveData();
    const maxValue = Math.max(...data.aging.map((item) => item[1]), 1);

    ledgerAging.innerHTML = data.aging
      .map(([bucket, value]) => {
        const width = Math.max(4, Math.round((value / maxValue) * 100));
        return `
          <div class="agingItem">
            <div class="agingHeader">
              <span>${bucket}</span>
              <strong>${formatCurrency(value)}</strong>
            </div>
            <div class="agingBar"><div class="agingFill" style="width:${width}%;"></div></div>
          </div>
        `;
      })
      .join("");
  };

  const renderKpis = () => {
    if (!ledgerKpis) return;
    const data = getActiveData();

    ledgerKpis.innerHTML = data.kpis
      .map(([label, value]) => `<li><span>${label}</span><strong>${value}</strong></li>`)
      .join("");
  };

  const renderTimeline = () => {
    if (!ledgerTimeline) return;
    const data = getActiveData();

    ledgerTimeline.innerHTML = data.timeline
      .map(([date, title, note]) => `
        <li class="timelineItem">
          <small>${new Date(`${date}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })}</small>
          <strong>${title}</strong>
          <span>${note}</span>
        </li>
      `)
      .join("");
  };

  const renderTable = () => {
    const data = getActiveData();
    const query = (ledgerSearch?.value || "").trim().toLowerCase();
    const statusFilter = ledgerStatusFilter?.value || "all";

    const visible = data.lines.filter((line) => {
      const [invoice, , , status, , lastAction] = line;
      const matchesQuery = !query
        || invoice.toLowerCase().includes(query)
        || status.toLowerCase().includes(query)
        || lastAction.toLowerCase().includes(query);
      const matchesStatus = statusFilter === "all" || status === statusFilter;
      return matchesQuery && matchesStatus;
    });

    ledgerTableBody.innerHTML = "";
    if (!visible.length) {
      ledgerTableBody.innerHTML = "<tr><td class=\"emptyRow\" colspan=\"6\">No ledger entries for selected filters.</td></tr>";
    }

    visible.forEach(([invoice, dueDate, bucket, status, outstanding, lastAction]) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${invoice}</td>
        <td>${new Date(`${dueDate}T00:00:00`).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}</td>
        <td>${bucket}</td>
        <td><span class="statusBadge ${getStatusClass(status)}">${status}</span></td>
        <td class="amountCell">${formatCurrency(outstanding)}</td>
        <td>${lastAction}</td>
      `;
      ledgerTableBody.appendChild(tr);
    });

    if (ledgerRowCount) {
      ledgerRowCount.textContent = `${visible.length} entr${visible.length === 1 ? "y" : "ies"}`;
    }
  };

  const rerenderAll = () => {
    renderSummary();
    renderAging();
    renderKpis();
    renderTimeline();
    renderTable();
  };

  populateCustomers();
  rerenderAll();

  ledgerCustomer.addEventListener("change", () => {
    activeCustomer = ledgerCustomer.value;
    rerenderAll();
  });

  if (ledgerPeriod) {
    ledgerPeriod.addEventListener("change", renderSummary);
  }

  if (ledgerSearch) {
    ledgerSearch.addEventListener("input", renderTable);
  }

  if (ledgerStatusFilter) {
    ledgerStatusFilter.addEventListener("change", renderTable);
  }
})();
