(() => {
  const receipts = [
    {
      id: "UTR-93844121",
      date: "2026-03-02",
      customer: "Apollo Tyres",
      amount: 126500,
      openAmount: 126500,
      suggestions: ["INV-12821", "INV-12807", "INV-12788"],
      confidence: 92,
      status: "Unmatched",
      remarks: ""
    },
    {
      id: "UTR-93844074",
      date: "2026-03-02",
      customer: "Crescent Steel",
      amount: 87500,
      openAmount: 32500,
      suggestions: ["INV-11813", "INV-11790"],
      confidence: 78,
      status: "Partially Matched",
      remarks: "Initial match done against INV-11813"
    },
    {
      id: "UTR-93843912",
      date: "2026-03-01",
      customer: "BlueWave Industries",
      amount: 44400,
      openAmount: 44400,
      suggestions: ["INV-12267", "INV-12241"],
      confidence: 58,
      status: "Manual Review",
      remarks: "Customer mismatch in narration"
    },
    {
      id: "UTR-93843698",
      date: "2026-03-01",
      customer: "Nimbus Traders",
      amount: 76300,
      openAmount: 0,
      suggestions: ["INV-12670"],
      confidence: 95,
      status: "Matched",
      remarks: "Auto match confirmed"
    },
    {
      id: "UTR-93843422",
      date: "2026-02-28",
      customer: "Orbit Textiles",
      amount: 65220,
      openAmount: 65220,
      suggestions: ["INV-12120", "INV-12111"],
      confidence: 67,
      status: "Unmatched",
      remarks: ""
    },
    {
      id: "UTR-93843117",
      date: "2026-02-28",
      customer: "Sundaram Motors",
      amount: 112900,
      openAmount: 112900,
      suggestions: ["INV-12504", "INV-12488", "INV-12475"],
      confidence: 84,
      status: "Unmatched",
      remarks: ""
    },
    {
      id: "UTR-93843053",
      date: "2026-02-27",
      customer: "Amber Logistics",
      amount: 39400,
      openAmount: 39400,
      suggestions: ["INV-12018", "INV-12005"],
      confidence: 73,
      status: "Unmatched",
      remarks: ""
    }
  ];

  const reconTableBody = document.getElementById("reconTableBody");
  const reconSearch = document.getElementById("reconSearch");
  const reconConfidence = document.getElementById("reconConfidence");
  const reconStatus = document.getElementById("reconStatus");
  const reconVisibleCount = document.getElementById("reconVisibleCount");
  const statUnmatched = document.getElementById("statUnmatched");
  const statReview = document.getElementById("statReview");
  const statMatched = document.getElementById("statMatched");
  const statPendingValue = document.getElementById("statPendingValue");
  const reconEmptyState = document.getElementById("reconEmptyState");
  const reconMatchForm = document.getElementById("reconMatchForm");
  const reconRef = document.getElementById("reconRef");
  const reconCustomer = document.getElementById("reconCustomer");
  const reconAmount = document.getElementById("reconAmount");
  const reconSettleAmount = document.getElementById("reconSettleAmount");
  const reconInvoiceSelect = document.getElementById("reconInvoiceSelect");
  const reconRemarks = document.getElementById("reconRemarks");
  const reconMessage = document.getElementById("reconMessage");
  const markMatchedBtn = document.getElementById("markMatchedBtn");
  const markManualBtn = document.getElementById("markManualBtn");
  const reconClock = document.getElementById("reconClock");
  const reconRefreshBtn = document.getElementById("reconRefreshBtn");

  if (!reconTableBody) return;

  let selectedId = "";

  const formatCurrency = (value) => `Rs. ${Number(value).toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;

  const formatDate = (isoDate) => {
    const parsed = new Date(`${isoDate}T00:00:00`);
    return parsed.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short"
    });
  };

  const getConfidenceType = (score) => {
    if (score >= 85) return "high";
    if (score >= 60) return "medium";
    return "low";
  };

  const getStatusClass = (status) => {
    if (status === "Matched") return "is-matched";
    if (status === "Manual Review" || status === "Partially Matched") return "is-review";
    return "is-unmatched";
  };

  const getFilteredRows = () => {
    const query = (reconSearch?.value || "").trim().toLowerCase();
    const confidence = reconConfidence?.value || "all";
    const status = reconStatus?.value || "all";

    return receipts.filter((row) => {
      const matchesQuery = !query
        || row.id.toLowerCase().includes(query)
        || row.customer.toLowerCase().includes(query)
        || row.suggestions.some((invoice) => invoice.toLowerCase().includes(query));

      const bucket = getConfidenceType(row.confidence);
      const matchesConfidence = confidence === "all" || bucket === confidence;
      const matchesStatus = status === "all" || row.status === status;

      return matchesQuery && matchesConfidence && matchesStatus;
    });
  };

  const updateStats = () => {
    const unmatched = receipts.filter((row) => row.status === "Unmatched").length;
    const review = receipts.filter((row) => row.status === "Manual Review" || row.status === "Partially Matched").length;
    const matched = receipts.filter((row) => row.status === "Matched").length;
    const pendingValue = receipts
      .filter((row) => row.status !== "Matched")
      .reduce((sum, row) => sum + row.openAmount, 0);

    if (statUnmatched) statUnmatched.textContent = String(unmatched);
    if (statReview) statReview.textContent = String(review);
    if (statMatched) statMatched.textContent = String(matched);
    if (statPendingValue) statPendingValue.textContent = formatCurrency(pendingValue);
  };

  const renderTable = () => {
    const filtered = getFilteredRows();

    reconTableBody.innerHTML = "";
    if (!filtered.length) {
      reconTableBody.innerHTML = "<tr><td class=\"emptyRow\" colspan=\"9\">No receipts found for current filters.</td></tr>";
    }

    filtered.forEach((row) => {
      const confidenceType = getConfidenceType(row.confidence);
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${formatDate(row.date)}</td>
        <td>${row.id}</td>
        <td>${row.customer}</td>
        <td class="amountCell">${formatCurrency(row.amount)}</td>
        <td class="amountCell">${formatCurrency(row.openAmount)}</td>
        <td>${row.suggestions[0] || "-"}</td>
        <td><span class="confidencePill is-${confidenceType}">${row.confidence}%</span></td>
        <td><span class="statusBadge ${getStatusClass(row.status)}">${row.status}</span></td>
        <td><button class="rowBtn" type="button" data-review-id="${row.id}">Review</button></td>
      `;
      reconTableBody.appendChild(tr);
    });

    if (reconVisibleCount) {
      reconVisibleCount.textContent = `${filtered.length} receipt${filtered.length === 1 ? "" : "s"} visible`;
    }
  };

  const setMessage = (text, tone) => {
    if (!reconMessage) return;
    reconMessage.textContent = text;
    reconMessage.className = "formMessage";
    if (tone) reconMessage.classList.add(`is-${tone}`);
  };

  const getSelectedRow = () => receipts.find((row) => row.id === selectedId) || null;

  const renderSelection = () => {
    const selected = getSelectedRow();

    if (!selected) {
      if (reconEmptyState) reconEmptyState.classList.remove("hidden");
      if (reconMatchForm) reconMatchForm.classList.add("hidden");
      setMessage("", "");
      return;
    }

    if (reconEmptyState) reconEmptyState.classList.add("hidden");
    if (reconMatchForm) reconMatchForm.classList.remove("hidden");

    if (reconRef) reconRef.value = selected.id;
    if (reconCustomer) reconCustomer.value = selected.customer;
    if (reconAmount) reconAmount.value = formatCurrency(selected.amount);
    if (reconSettleAmount) reconSettleAmount.value = String(selected.openAmount);

    if (reconInvoiceSelect) {
      reconInvoiceSelect.innerHTML = selected.suggestions
        .map((invoice) => `<option value="${invoice}">${invoice}</option>`)
        .join("");
    }

    if (reconRemarks) reconRemarks.value = selected.remarks || "";
    setMessage("", "");
  };

  const markAsMatched = () => {
    const selected = getSelectedRow();
    if (!selected || !reconSettleAmount) return;

    const requested = Number(reconSettleAmount.value);
    if (!Number.isFinite(requested) || requested <= 0) {
      setMessage("Enter a valid settle amount before proceeding.", "error");
      return;
    }

    const settleAmount = Math.min(requested, selected.openAmount);
    selected.openAmount = Number((selected.openAmount - settleAmount).toFixed(2));
    selected.status = selected.openAmount <= 0 ? "Matched" : "Partially Matched";
    selected.confidence = Math.max(selected.confidence, 86);
    selected.remarks = (reconRemarks?.value || "").trim();

    setMessage(
      `${formatCurrency(settleAmount)} allocated to ${reconInvoiceSelect?.value || "selected invoice"}.`,
      "success"
    );

    renderTable();
    updateStats();
    renderSelection();
  };

  const markForManualReview = () => {
    const selected = getSelectedRow();
    if (!selected) return;

    selected.status = "Manual Review";
    selected.remarks = (reconRemarks?.value || "").trim();
    selected.confidence = Math.min(selected.confidence, 59);

    setMessage("Receipt moved to manual review queue.", "warning");
    renderTable();
    updateStats();
    renderSelection();
  };

  const tickClock = () => {
    if (!reconClock) return;
    const now = new Date();
    reconClock.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const refreshQueue = () => {
    receipts.forEach((row) => {
      if (row.status === "Matched") return;
      const drift = Math.floor(Math.random() * 7) - 3;
      row.confidence = Math.max(30, Math.min(97, row.confidence + drift));
    });
    renderTable();
    updateStats();
    if (selectedId) renderSelection();
    setMessage("Queue refreshed with latest bank narration scores.", "success");
  };

  reconTableBody.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-review-id]");
    if (!button) return;

    selectedId = button.getAttribute("data-review-id") || "";
    renderSelection();
  });

  if (reconSearch) reconSearch.addEventListener("input", renderTable);
  if (reconConfidence) reconConfidence.addEventListener("change", renderTable);
  if (reconStatus) reconStatus.addEventListener("change", renderTable);
  if (markMatchedBtn) markMatchedBtn.addEventListener("click", markAsMatched);
  if (markManualBtn) markManualBtn.addEventListener("click", markForManualReview);
  if (reconRefreshBtn) reconRefreshBtn.addEventListener("click", refreshQueue);

  tickClock();
  updateStats();
  renderTable();
  renderSelection();
  window.setInterval(tickClock, 60000);
})();
