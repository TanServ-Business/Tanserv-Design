(() => {
  const baseRows = [
    {
      id: "DED-6102",
      customer: "Apollo Tyres",
      invoice: "INV-12821",
      type: "Pricing",
      claimed: 18400,
      validated: 0,
      ageDays: 6,
      owner: "Collections",
      status: "Open",
      rootCause: "",
      remarks: ""
    },
    {
      id: "DED-6098",
      customer: "BlueWave Industries",
      invoice: "INV-12267",
      type: "Tax",
      claimed: 7900,
      validated: 7900,
      ageDays: 11,
      owner: "Finance",
      status: "Ready for Approval",
      rootCause: "Tax variance",
      remarks: "GST slab corrected"
    },
    {
      id: "DED-6093",
      customer: "Crescent Steel",
      invoice: "INV-11813",
      type: "Quantity",
      claimed: 25200,
      validated: 8400,
      ageDays: 34,
      owner: "Sales Ops",
      status: "Under Review",
      rootCause: "Quantity short",
      remarks: "Proof of delivery awaited"
    },
    {
      id: "DED-6089",
      customer: "Nimbus Traders",
      invoice: "INV-12670",
      type: "Damage",
      claimed: 5200,
      validated: 0,
      ageDays: 19,
      owner: "Collections",
      status: "Rejected",
      rootCause: "Damaged goods",
      remarks: "No signed damage acknowledgement"
    },
    {
      id: "DED-6083",
      customer: "Sundaram Motors",
      invoice: "INV-12504",
      type: "Delay",
      claimed: 11600,
      validated: 11600,
      ageDays: 4,
      owner: "Finance",
      status: "Approved",
      rootCause: "Late delivery",
      remarks: "Approved by regional finance"
    },
    {
      id: "DED-6076",
      customer: "Orbit Textiles",
      invoice: "INV-12120",
      type: "Pricing",
      claimed: 32400,
      validated: 0,
      ageDays: 41,
      owner: "Collections",
      status: "Open",
      rootCause: "",
      remarks: ""
    }
  ];

  const rows = baseRows.map((item) => ({ ...item }));

  const deductionTableBody = document.getElementById("deductionTableBody");
  const deductionSearch = document.getElementById("deductionSearch");
  const deductionStatus = document.getElementById("deductionStatus");
  const deductionOwner = document.getElementById("deductionOwner");
  const deductionVisibleCount = document.getElementById("deductionVisibleCount");
  const deductionOpenCount = document.getElementById("deductionOpenCount");
  const deductionClaimValue = document.getElementById("deductionClaimValue");
  const deductionReadyCount = document.getElementById("deductionReadyCount");
  const deductionAgedCount = document.getElementById("deductionAgedCount");
  const deductionRiskValue = document.getElementById("deductionRiskValue");
  const deductionHint = document.getElementById("deductionHint");
  const deductionForm = document.getElementById("deductionForm");
  const draftDeductionId = document.getElementById("draftDeductionId");
  const draftInvoice = document.getElementById("draftInvoice");
  const draftClaimed = document.getElementById("draftClaimed");
  const draftRecoverable = document.getElementById("draftRecoverable");
  const draftRootCause = document.getElementById("draftRootCause");
  const draftRemarks = document.getElementById("draftRemarks");
  const deductionMessage = document.getElementById("deductionMessage");
  const saveDraftBtn = document.getElementById("saveDraftBtn");
  const sendApprovalBtn = document.getElementById("sendApprovalBtn");
  const rejectDraftBtn = document.getElementById("rejectDraftBtn");
  const deductionResetBtn = document.getElementById("deductionResetBtn");

  if (!deductionTableBody) return;

  let selectedId = "";

  const formatCurrency = (value) => `Rs. ${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

  const getStatusClass = (status) => {
    if (status === "Approved") return "is-approved";
    if (status === "Rejected") return "is-rejected";
    if (status === "Ready for Approval" || status === "Under Review") return "is-review";
    return "is-open";
  };

  const findRow = () => rows.find((row) => row.id === selectedId) || null;

  const getFilteredRows = () => {
    const query = (deductionSearch?.value || "").trim().toLowerCase();
    const status = deductionStatus?.value || "all";
    const owner = deductionOwner?.value || "all";

    return rows.filter((row) => {
      const matchesQuery = !query
        || row.id.toLowerCase().includes(query)
        || row.customer.toLowerCase().includes(query)
        || row.invoice.toLowerCase().includes(query);
      const matchesStatus = status === "all" || row.status === status;
      const matchesOwner = owner === "all" || row.owner === owner;
      return matchesQuery && matchesStatus && matchesOwner;
    });
  };

  const updateStats = () => {
    const openCount = rows.filter((row) => row.status === "Open" || row.status === "Under Review").length;
    const readyCount = rows.filter((row) => row.status === "Ready for Approval").length;
    const agedCount = rows.filter((row) => row.ageDays >= 30 && row.status !== "Approved").length;
    const claimValue = rows.reduce((sum, row) => sum + row.claimed, 0);
    const riskValue = rows
      .filter((row) => row.status === "Open" || row.status === "Under Review")
      .reduce((sum, row) => sum + (row.claimed - row.validated), 0);

    if (deductionOpenCount) deductionOpenCount.textContent = String(openCount);
    if (deductionReadyCount) deductionReadyCount.textContent = String(readyCount);
    if (deductionAgedCount) deductionAgedCount.textContent = String(agedCount);
    if (deductionClaimValue) deductionClaimValue.textContent = formatCurrency(claimValue);
    if (deductionRiskValue) deductionRiskValue.textContent = formatCurrency(Math.max(riskValue, 0));
  };

  const renderTable = () => {
    const filtered = getFilteredRows();
    deductionTableBody.innerHTML = "";

    if (!filtered.length) {
      deductionTableBody.innerHTML = "<tr><td class=\"emptyRow\" colspan=\"10\">No deduction rows found.</td></tr>";
    }

    filtered.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${row.id}</td>
        <td>${row.customer}</td>
        <td>${row.invoice}</td>
        <td>${row.type}</td>
        <td class="amountCell">${formatCurrency(row.claimed)}</td>
        <td class="amountCell">${formatCurrency(row.validated)}</td>
        <td>${row.ageDays}d</td>
        <td>${row.owner}</td>
        <td><span class="statusBadge ${getStatusClass(row.status)}">${row.status}</span></td>
        <td><button class="rowBtn" type="button" data-deduction-id="${row.id}">Resolve</button></td>
      `;
      deductionTableBody.appendChild(tr);
    });

    if (deductionVisibleCount) {
      deductionVisibleCount.textContent = `${filtered.length} row${filtered.length === 1 ? "" : "s"} visible`;
    }
  };

  const setMessage = (text, tone) => {
    if (!deductionMessage) return;
    deductionMessage.textContent = text;
    deductionMessage.className = "formMessage";
    if (tone) deductionMessage.classList.add(`is-${tone}`);
  };

  const renderSelection = () => {
    const selected = findRow();
    if (!selected) {
      if (deductionHint) deductionHint.classList.remove("hidden");
      if (deductionForm) deductionForm.classList.add("hidden");
      setMessage("", "");
      return;
    }

    if (deductionHint) deductionHint.classList.add("hidden");
    if (deductionForm) deductionForm.classList.remove("hidden");

    if (draftDeductionId) draftDeductionId.value = selected.id;
    if (draftInvoice) draftInvoice.value = selected.invoice;
    if (draftClaimed) draftClaimed.value = formatCurrency(selected.claimed);
    if (draftRecoverable) draftRecoverable.value = String(selected.validated || selected.claimed);
    if (draftRootCause) draftRootCause.value = selected.rootCause || "";
    if (draftRemarks) draftRemarks.value = selected.remarks || "";

    setMessage("", "");
  };

  const persistDraft = (nextStatus, tone, message) => {
    const selected = findRow();
    if (!selected) return;

    const recoverable = Number(draftRecoverable?.value || 0);
    if (!Number.isFinite(recoverable) || recoverable < 0) {
      setMessage("Recoverable amount must be a valid positive value.", "error");
      return;
    }

    selected.validated = Math.min(recoverable, selected.claimed);
    selected.rootCause = (draftRootCause?.value || "").trim();
    selected.remarks = (draftRemarks?.value || "").trim();
    selected.status = nextStatus;

    setMessage(message, tone);
    updateStats();
    renderTable();
    renderSelection();
  };

  const resetFilters = () => {
    if (deductionSearch) deductionSearch.value = "";
    if (deductionStatus) deductionStatus.value = "all";
    if (deductionOwner) deductionOwner.value = "all";
    renderTable();
  };

  deductionTableBody.addEventListener("click", (event) => {
    const trigger = event.target.closest("button[data-deduction-id]");
    if (!trigger) return;
    selectedId = trigger.getAttribute("data-deduction-id") || "";
    renderSelection();
  });

  if (deductionSearch) deductionSearch.addEventListener("input", renderTable);
  if (deductionStatus) deductionStatus.addEventListener("change", renderTable);
  if (deductionOwner) deductionOwner.addEventListener("change", renderTable);
  if (saveDraftBtn) {
    saveDraftBtn.addEventListener("click", () => {
      persistDraft("Under Review", "success", "Draft saved. Case moved to Under Review.");
    });
  }
  if (sendApprovalBtn) {
    sendApprovalBtn.addEventListener("click", () => {
      persistDraft("Ready for Approval", "success", "Case routed for approval.");
    });
  }
  if (rejectDraftBtn) {
    rejectDraftBtn.addEventListener("click", () => {
      persistDraft("Rejected", "warning", "Claim marked as rejected.");
    });
  }
  if (deductionResetBtn) deductionResetBtn.addEventListener("click", resetFilters);

  updateStats();
  renderTable();
  renderSelection();
})();
