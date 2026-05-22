(() => {
  const tableBody = document.getElementById("submissionTableBody");
  const selectAll = document.getElementById("selectAll");
  const selectedCount = document.getElementById("selectedCount");
  const submitSelectedBtn = document.getElementById("submitSelectedBtn");
  const clearFormBtn = document.getElementById("clearFormBtn");
  const closeFormBtn = document.getElementById("closeFormBtn");
  const formMessage = document.getElementById("formMessage");
  const clockEl = document.getElementById("submissionClock");
  const cardSubmitted = document.getElementById("cardSubmitted");
  const cardNotSubmitted = document.getElementById("cardNotSubmitted");
  const cardExternallySubmitted = document.getElementById("cardExternallySubmitted");
  const cardPending = document.getElementById("cardPending");
  const quickInfoList = document.getElementById("submissionQuickInfo");
  const bulkSubmitBtn = document.getElementById("bulkSubmitBtn");
  const submissionFormPanel = document.getElementById("submissionFormPanel");
  const invoiceSearch = document.getElementById("invoiceSearch");
  const customerSearch = document.getElementById("customerSearch");
  const customerSuggestions = document.getElementById("customerSuggestions");
  const customerSearchClear = document.getElementById("customerSearchClear");
  const submissionStatusBtn = document.getElementById("submissionStatusBtn");
  const submissionStatusMenu = document.getElementById("submissionStatusMenu");
  const submissionStatusValue = submissionStatusBtn
    ? submissionStatusBtn.querySelector("[data-role='filter-value']")
    : null;
  const submissionDateBtn = document.getElementById("submissionDateBtn");
  const submissionDateBadge = document.getElementById("submissionDateBadge");
  const submissionDatePopup = document.getElementById("submissionDatePopup");
  const submissionDateGrid = document.getElementById("submissionDateGrid");
  const submissionDateMonth = document.getElementById("submissionDateMonth");
  const submissionDatePrev = document.getElementById("submissionDatePrev");
  const submissionDateNext = document.getElementById("submissionDateNext");
  const submissionDateClear = document.getElementById("submissionDateClear");
  const submissionDateHint = document.getElementById("submissionDateHint");
  const submissionDateStart = document.getElementById("submissionDateStart");
  const submissionDateEnd = document.getElementById("submissionDateEnd");
  const submissionDateApply = document.getElementById("submissionDateApply");
  const submissionClearFilters = document.getElementById("submissionClearFilters");

  const activityType = document.getElementById("activityType");
  const submissionStatus = document.getElementById("submissionStatus");
  const submissionSubStatus = document.getElementById("submissionSubStatus");
  const submissionType = document.getElementById("submissionType");
  const invoiceType = document.getElementById("invoiceType");
  const submissionDate = document.getElementById("submissionDate");
  const sentTo = document.getElementById("sentTo");
  const submissionRemarks = document.getElementById("submissionRemarks");
  const submissionAiSuggestions = document.getElementById("submissionAiSuggestions");
  const submissionAiSuggestionList = document.getElementById("submissionAiSuggestionList");
  const submissionEmailDraftModal = document.getElementById("submissionEmailDraftModal");
  const submissionEmailDraftClose = document.getElementById("submissionEmailDraftClose");
  const submissionEmailDraftSend = document.getElementById("submissionEmailDraftSend");
  const submissionEmailTo = document.getElementById("submissionEmailTo");
  const submissionEmailCc = document.getElementById("submissionEmailCc");
  const submissionEmailSubject = document.getElementById("submissionEmailSubject");
  const submissionEmailBody = document.getElementById("submissionEmailBody");
  const submissionEmailAttachments = document.getElementById("submissionEmailAttachments");

  const invoices = [
    { code: "CUST-1001", name: "Apollo Tyres", invoiceNo: "INV-10432", status: "Open", value: 86400 },
    { code: "CUST-1002", name: "BlueWave", invoiceNo: "INV-10421", status: "Pending", value: 32500 },
    { code: "CUST-1003", name: "Crescent Steel", invoiceNo: "INV-10398", status: "Dispute", value: 48900 },
    { code: "CUST-1004", name: "Sundaram Motors", invoiceNo: "INV-10376", status: "Open", value: 92000 },
    { code: "CUST-1005", name: "Nimbus Traders", invoiceNo: "INV-10365", status: "Open", value: 77200 },
    { code: "CUST-1006", name: "Zenix Labs", invoiceNo: "INV-10354", status: "Pending", value: 64100 },
    { code: "CUST-1007", name: "Amber Logistics", invoiceNo: "INV-10342", status: "Open", value: 55800 },
    { code: "CUST-1008", name: "Sunrise Pvt", invoiceNo: "INV-10335", status: "Open", value: 73200 },
    { code: "CUST-1009", name: "Orbit Textiles", invoiceNo: "INV-10320", status: "Dispute", value: 41800 },
    { code: "CUST-1010", name: "Kasturi Foods", invoiceNo: "INV-10311", status: "Open", value: 69000 }
  ].map((row) => ({
    ...row,
    submissionStatus: "Not submitted",
    submissionDate: "-",
    submissionType: ""
  }));

  const selected = new Set();
  let activeInvoiceIds = [];
  let isFormOpen = false;
  let invoiceQuery = "";
  let customerQuery = "";
  let filterStatus = "All";
  let filterFrom = "";
  let filterTo = "";
  let rangeStart = null;
  let rangeEnd = null;
  let appliedStart = null;
  let appliedEnd = null;
  let calendarMonth = new Date();
  calendarMonth.setDate(1);

  const submissionHistory = {
    "CUST-1001": {
      mode: "email",
      label: "Submit via email",
      icon: "bi-envelope",
      activityType: "emailed",
      submissionStatus: "Submitted",
      submissionSubStatus: "Vendor helpdesk",
      submissionType: "Emailed",
      sentTo: "ap.submissions@apollo.example",
      customerEmail: "finance@apollo.example",
      evidence: "Last 3 Apollo Tyres invoices were submitted digitally to ap.submissions@apollo.example."
    },
    "CUST-1002": {
      mode: "portal",
      label: "Submit via portal",
      icon: "bi-cloud-arrow-up",
      activityType: "no activity",
      submissionStatus: "Submitted",
      submissionSubStatus: "Vendor portal",
      submissionType: "Vendor portal",
      sentTo: "BlueWave vendor portal",
      customerEmail: "accounts@bluewave.example",
      evidence: "Previous BlueWave submissions were uploaded through the vendor portal."
    },
    "CUST-1004": {
      mode: "physical",
      label: "Physical handover",
      icon: "bi-person-check",
      activityType: "visited",
      submissionStatus: "Submitted",
      submissionSubStatus: "Submitted to others",
      submissionType: "Physical Submission",
      sentTo: "R. Krishnan - Accounts Desk",
      customerEmail: "accounts@sundarammotors.example",
      evidence: "Past Sundaram Motors invoices were physically handed over to the accounts desk."
    }
  };

  const fallbackSubmissionPattern = {
    mode: "email",
    label: "Submit via email",
    icon: "bi-envelope",
    activityType: "emailed",
    submissionStatus: "Submitted",
    submissionSubStatus: "Vendor helpdesk",
    submissionType: "Emailed",
    sentTo: "customer.accounts@example.com",
    customerEmail: "customer.accounts@example.com",
    evidence: "No customer-specific submission history is available, so email submission is suggested as the safest default."
  };

  const fmtCurrency = (n) => new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(n);

  const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const formatDateLabel = (date) => date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short"
  });

  const renderClock = () => {
    if (!clockEl) return;
    const now = new Date();
    clockEl.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const getFilteredRows = () => {
    let rows = invoices.slice();
    if (invoiceQuery) {
      const q = invoiceQuery.toLowerCase();
      rows = rows.filter((row) => row.invoiceNo.toLowerCase().includes(q));
    }
    if (customerQuery) {
      const q = customerQuery.toLowerCase();
      rows = rows.filter((row) => (
        row.name.toLowerCase().includes(q) || row.code.toLowerCase().includes(q)
      ));
    }
    if (filterStatus && filterStatus !== "All") {
      rows = rows.filter((row) => row.submissionStatus === filterStatus);
    }
    if (filterFrom) {
      rows = rows.filter((row) => row.submissionDate !== "-" && row.submissionDate >= filterFrom);
    }
    if (filterTo) {
      rows = rows.filter((row) => row.submissionDate !== "-" && row.submissionDate <= filterTo);
    }
    return rows;
  };

  const renderTable = () => {
    if (!tableBody) return;
    tableBody.innerHTML = "";
    const baseRows = getFilteredRows();
    const visibleRows = isFormOpen && activeInvoiceIds.length
      ? baseRows.filter((row) => activeInvoiceIds.includes(row.invoiceNo))
      : baseRows;
    visibleRows.forEach((row) => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input class="rowSelect" type="checkbox" data-id="${row.invoiceNo}" ${selected.has(row.invoiceNo) ? "checked" : ""} aria-label="Select ${row.invoiceNo}" /></td>
        <td>${row.code}</td>
        <td>${row.name}</td>
        <td>${row.invoiceNo}</td>
        <td>${row.status}</td>
        <td>${fmtCurrency(row.value)}</td>
        <td>${row.submissionStatus}</td>
        <td>${row.submissionDate}</td>
        <td><button class="rowActionBtn" type="button" data-id="${row.invoiceNo}">Submit</button></td>
      `;
      tableBody.appendChild(tr);
    });
    updateSelectedCount();
    updateCards();
    updateQuickInfo();
    if (submissionFormPanel) {
      submissionFormPanel.classList.toggle("hidden", !isFormOpen);
    }
    renderSubmissionAiSuggestions();
  };

  const updateCards = () => {
    const submitted = invoices.filter((row) => row.submissionStatus === "Submitted").length;
    const notSubmitted = invoices.filter((row) => row.submissionStatus === "Not submitted").length;
    const externally = invoices.filter((row) => row.submissionStatus === "Externally submitted").length;
    const pending = invoices.filter((row) => row.status.toLowerCase() === "pending").length;
    if (cardSubmitted) cardSubmitted.textContent = String(submitted);
    if (cardNotSubmitted) cardNotSubmitted.textContent = String(notSubmitted);
    if (cardExternallySubmitted) cardExternallySubmitted.textContent = String(externally);
    if (cardPending) cardPending.textContent = String(pending);
  };

  const updateQuickInfo = () => {
    if (!quickInfoList) return;
    const channels = ["Physical Submission", "Emailed", "Vendor portal", "Couriered"];
    const counts = channels.map((channel) => ({
      label: channel,
      count: invoices.filter((row) => row.submissionType.toLowerCase() === channel.toLowerCase()).length
    }));
    quickInfoList.innerHTML = counts.map((item) => (
      `<li class="quickInfoItem"><span>${item.label}</span><span class="quickInfoCount">${item.count}</span></li>`
    )).join("\n");
  };

  const updateSelectedCount = () => {
    if (selectedCount) selectedCount.textContent = `${selected.size} selected`;
    if (selectAll) {
      const total = isFormOpen && activeInvoiceIds.length
        ? activeInvoiceIds.length
        : getFilteredRows().length;
      selectAll.checked = selected.size && selected.size === total;
      selectAll.disabled = isFormOpen;
    }
    if (bulkSubmitBtn) {
      bulkSubmitBtn.classList.toggle("hidden", selected.size <= 1 || isFormOpen);
    }
  };

  const updateStatusFilterUi = () => {
    if (submissionStatusValue) {
      submissionStatusValue.textContent = filterStatus || "All";
    }
    if (!submissionStatusMenu) return;
    const items = submissionStatusMenu.querySelectorAll(".dropdown-item");
    items.forEach((item) => {
      const value = item.getAttribute("data-value");
      item.classList.toggle("active", value === filterStatus);
    });
  };

  const updateDateRangeBadge = () => {
    if (!submissionDateBadge) return;
    if (appliedStart && appliedEnd) {
      submissionDateBadge.textContent = `${formatDateLabel(appliedStart)} - ${formatDateLabel(appliedEnd)}`;
    } else if (appliedStart) {
      submissionDateBadge.textContent = formatDateLabel(appliedStart);
    } else {
      submissionDateBadge.textContent = "All";
    }
  };

  const updateDateHint = () => {
    if (!submissionDateHint) return;
    if (!rangeStart) submissionDateHint.textContent = "Select start date";
    else if (!rangeEnd) submissionDateHint.textContent = "Select end date";
    else submissionDateHint.textContent = "Range selected";
  };

  const updateDateSelectionUi = () => {
    if (submissionDateStart) {
      submissionDateStart.textContent = rangeStart ? formatDateLabel(rangeStart) : "--";
    }
    if (submissionDateEnd) {
      submissionDateEnd.textContent = rangeEnd ? formatDateLabel(rangeEnd) : "--";
    }
    if (submissionDateApply) {
      submissionDateApply.disabled = !rangeStart;
    }
  };

  const renderDateGrid = () => {
    if (!submissionDateGrid || !submissionDateMonth) return;
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    submissionDateMonth.textContent = `${monthNames[month]} ${year}`;
    submissionDateGrid.innerHTML = "";
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const todayKey = formatDateKey(new Date());
    const startKey = rangeStart ? formatDateKey(rangeStart) : "";
    const endKey = rangeEnd ? formatDateKey(rangeEnd) : "";
    for (let i = 0; i < firstDay; i += 1) {
      const empty = document.createElement("div");
      empty.className = "dateCell is-empty";
      empty.textContent = ".";
      submissionDateGrid.appendChild(empty);
    }
    for (let day = 1; day <= daysInMonth; day += 1) {
      const cellDate = new Date(year, month, day);
      const cellKey = formatDateKey(cellDate);
      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "dateCell";
      cell.textContent = String(day);
      cell.setAttribute("data-date", cellKey);
      if (cellKey === todayKey) cell.classList.add("is-today");
      if (startKey && cellKey === startKey) cell.classList.add("is-start");
      if (endKey && cellKey === endKey) cell.classList.add("is-end");
      if (startKey && endKey && cellKey > startKey && cellKey < endKey) {
        cell.classList.add("is-in-range");
      }
      submissionDateGrid.appendChild(cell);
    }
  };

  const openDatePicker = () => {
    if (!submissionDatePopup || !submissionDateBtn) return;
    rangeStart = appliedStart ? new Date(appliedStart.getTime()) : null;
    rangeEnd = appliedEnd ? new Date(appliedEnd.getTime()) : null;
    submissionDatePopup.classList.add("open");
    submissionDateBtn.setAttribute("aria-expanded", "true");
    renderDateGrid();
    updateDateHint();
    updateDateSelectionUi();
  };

  const closeDatePicker = () => {
    if (!submissionDatePopup || !submissionDateBtn) return;
    submissionDatePopup.classList.remove("open");
    submissionDateBtn.setAttribute("aria-expanded", "false");
  };

  const escapeHtml = (text) => (
    String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;")
  );

  const getRowsByInvoiceNos = (invoiceNos) => (
    invoices.filter((row) => invoiceNos.includes(row.invoiceNo))
  );

  const getSubmissionPattern = (row) => {
    if (!row) return fallbackSubmissionPattern;
    return submissionHistory[row.code] || {
      ...fallbackSubmissionPattern,
      evidence: `No stored pattern exists for ${row.name}; email submission is suggested as the default.`
    };
  };

  const getActiveSubmissionRows = () => (
    activeInvoiceIds.length ? getRowsByInvoiceNos(activeInvoiceIds) : []
  );

  const getCommonSubmissionPattern = (rows) => {
    if (!rows.length) return null;
    const patterns = rows.map(getSubmissionPattern);
    const firstMode = patterns[0].mode;
    const sameMode = patterns.every((pattern) => pattern.mode === firstMode);
    if (!sameMode) return null;
    return {
      ...patterns[0],
      evidence: rows.length === 1
        ? patterns[0].evidence
        : `Selected invoices share the ${patterns[0].submissionType} submission pattern.`
    };
  };

  const isSubmissionFormUntouched = () => (
    !activityType.value.trim()
    && !submissionStatus.value.trim()
    && !submissionSubStatus.value.trim()
    && !submissionType.value.trim()
    && !sentTo.value.trim()
  );

  const setSelectValue = (select, value) => {
    if (!select || !value) return;
    select.value = value;
  };

  const applySubmissionSuggestion = (pattern, rows) => {
    if (!pattern || !rows.length) return;
    setSelectValue(activityType, pattern.activityType);
    setSelectValue(submissionStatus, pattern.submissionStatus);
    setSelectValue(submissionSubStatus, pattern.submissionSubStatus);
    if (submissionType) submissionType.value = pattern.submissionType || "";
    if (submissionDate && !submissionDate.value) submissionDate.value = formatDateKey(new Date());
    if (sentTo) sentTo.value = pattern.sentTo || "";
    if (invoiceType && !invoiceType.value) invoiceType.value = "Tax";
    if (submissionRemarks) {
      const invoiceText = rows.map((row) => row.invoiceNo).join(", ");
      submissionRemarks.value = `AI suggestion applied from past submission pattern. Invoice(s) ${invoiceText} to be submitted through ${pattern.submissionType}.`;
    }
    if (formMessage) {
      formMessage.textContent = "AI suggestion applied. Review and click Submit to update activity.";
    }
  };

  const currentOrSuggestedSubmissionContext = (rows, pattern) => {
    const values = readFormValues();
    const resolved = pattern || getCommonSubmissionPattern(rows) || getSubmissionPattern(rows[0]);
    return {
      activityType: values.activityType || resolved.activityType,
      submissionStatus: values.submissionStatus || resolved.submissionStatus,
      submissionSubStatus: values.submissionSubStatus || resolved.submissionSubStatus,
      submissionType: values.submissionType || resolved.submissionType,
      submissionDate: values.submissionDate || formatDateKey(new Date()),
      sentTo: values.sentTo || resolved.sentTo,
      remarks: values.remarks,
      customerEmail: resolved.customerEmail,
      pattern: resolved
    };
  };

  const buildSubmissionEmailPayload = (rows, pattern) => {
    const context = currentOrSuggestedSubmissionContext(rows, pattern);
    const invoiceNos = rows.map((row) => row.invoiceNo);
    const firstRow = rows[0] || {};
    const invoiceLabel = invoiceNos.length === 1 ? invoiceNos[0] : invoiceNos.join(", ");
    const medium = context.submissionType || "the selected submission medium";
    const sentLine = context.sentTo ? ` The submission reference/recipient is ${context.sentTo}.` : "";
    return {
      invoiceNo: invoiceNos[0] || "",
      invoiceNos,
      to: context.customerEmail || "",
      cc: "",
      subject: `Invoice submission confirmation - ${invoiceLabel}`,
      body: `Hello,\n\nThis is to confirm that invoice${invoiceNos.length === 1 ? "" : "s"} ${invoiceLabel} ${invoiceNos.length === 1 ? "has" : "have"} been shared through ${medium}.${sentLine}\n\nPlease confirm once received.\n\nRegards,\nCollections Team`,
      attachments: invoiceNos.map((invoiceNo) => `Invoice_${invoiceNo}.pdf`).join(", "),
      customerCode: firstRow.code || "",
      customerName: firstRow.name || "",
      source: "Submission module"
    };
  };

  const closeSubmissionEmailDraftPopup = () => {
    if (!submissionEmailDraftModal) return;
    submissionEmailDraftModal.classList.add("hidden");
    submissionEmailDraftModal.setAttribute("aria-hidden", "true");
  };

  const openSubmissionEmailDraftPopup = (rows, pattern) => {
    if (!rows.length || !submissionEmailDraftModal) return;
    const resolvedPattern = pattern || getCommonSubmissionPattern(rows) || getSubmissionPattern(rows[0]);
    if (isSubmissionFormUntouched() && resolvedPattern) {
      applySubmissionSuggestion(resolvedPattern, rows);
    }
    const payload = buildSubmissionEmailPayload(rows, pattern);
    if (submissionEmailTo) submissionEmailTo.value = payload.to || "";
    if (submissionEmailCc) submissionEmailCc.value = payload.cc || "";
    if (submissionEmailSubject) submissionEmailSubject.value = payload.subject || "";
    if (submissionEmailBody) submissionEmailBody.value = payload.body || "";
    if (submissionEmailAttachments) submissionEmailAttachments.value = payload.attachments || "";
    submissionEmailDraftModal.classList.remove("hidden");
    submissionEmailDraftModal.setAttribute("aria-hidden", "false");
    if (submissionEmailSubject) submissionEmailSubject.focus();
  };

  const createReasonPopover = (reason) => {
    const popover = document.createElement("span");
    popover.className = "aiReasonPopover hidden";
    popover.setAttribute("role", "status");
    popover.textContent = reason;
    return popover;
  };

  const renderSubmissionAiSuggestions = () => {
    if (!submissionAiSuggestions || !submissionAiSuggestionList) return;
    const rows = getActiveSubmissionRows();
    submissionAiSuggestionList.innerHTML = "";
    if (!isFormOpen || !rows.length) {
      submissionAiSuggestions.classList.add("hidden");
      submissionAiSuggestions.setAttribute("aria-hidden", "true");
      return;
    }

    const pattern = getCommonSubmissionPattern(rows);
    const uniqueCustomers = new Set(rows.map((row) => row.code));
    const isSameCustomerSelection = uniqueCustomers.size === 1;
    const suggestions = [];
    if (pattern) {
      suggestions.push({
        label: pattern.label,
        icon: pattern.icon,
        action: () => applySubmissionSuggestion(pattern, rows),
        reason: `Source: Past submission history. ${pattern.evidence} Will do: Prefill submission activity as ${pattern.submissionType}.`
      });
      suggestions.push({
        label: "Send confirmation email",
        icon: "bi-envelope-check",
        action: () => openSubmissionEmailDraftPopup(rows, pattern),
        reason: `Source: Submission workflow. Invoice submission is expected through ${pattern.submissionType}. Will do: Open prefilled confirmation draft with recipients set.`
      });
    } else if (!isSameCustomerSelection) {
      const perRowPatterns = rows.map(getSubmissionPattern);
      const modes = new Set(perRowPatterns.map((entry) => entry.mode));
      if (modes.size === 1) {
        const commonPattern = {
          ...perRowPatterns[0],
          evidence: `Selected invoices share the ${perRowPatterns[0].submissionType} submission pattern.`
        };
        suggestions.push({
          label: "Send confirmation email",
          icon: "bi-envelope-check",
          action: () => openSubmissionEmailDraftPopup(rows, commonPattern),
          reason: `Source: Submission workflow. Selected invoices share ${commonPattern.submissionType}. Will do: Open one confirmation draft for selected invoices.`
        });
      }
    }

    if (!suggestions.length) {
      submissionAiSuggestions.classList.add("hidden");
      submissionAiSuggestions.setAttribute("aria-hidden", "true");
      return;
    }

    suggestions.forEach((suggestion) => {
      const item = document.createElement("span");
      item.className = "aiSuggestionItem";
      const pill = document.createElement("span");
      pill.className = "aiSuggestionPill";
      const actionBtn = document.createElement("button");
      actionBtn.type = "button";
      actionBtn.className = "aiSuggestionAction";
      const icon = document.createElement("i");
      icon.className = `bi ${suggestion.icon}`;
      icon.setAttribute("aria-hidden", "true");
      actionBtn.appendChild(icon);
      actionBtn.appendChild(document.createTextNode(` ${suggestion.label}`));
      actionBtn.addEventListener("click", suggestion.action);
      const reasonBtn = document.createElement("button");
      reasonBtn.type = "button";
      reasonBtn.className = "aiReasonBtn";
      reasonBtn.setAttribute("aria-label", "Why suggested");
      reasonBtn.textContent = "i";
      const popover = createReasonPopover(suggestion.reason);
      reasonBtn.addEventListener("click", (event) => {
        event.stopPropagation();
        submissionAiSuggestionList.querySelectorAll(".aiReasonPopover").forEach((node) => {
          if (node !== popover) node.classList.add("hidden");
        });
        popover.classList.toggle("hidden");
      });
      pill.appendChild(actionBtn);
      pill.appendChild(reasonBtn);
      item.appendChild(pill);
      item.appendChild(popover);
      submissionAiSuggestionList.appendChild(item);
    });
    submissionAiSuggestions.classList.remove("hidden");
    submissionAiSuggestions.setAttribute("aria-hidden", "false");
  };

  const customerIndex = () => {
    const map = new Map();
    invoices.forEach((row) => {
      if (!map.has(row.code)) {
        map.set(row.code, { code: row.code, name: row.name });
      }
    });
    return Array.from(map.values());
  };

  const allCustomers = customerIndex();

  const hideCustomerSuggestions = () => {
    if (!customerSuggestions) return;
    customerSuggestions.style.display = "none";
  };

  const renderCustomerSuggestions = (query) => {
    if (!customerSuggestions) return;
    const q = query.trim().toLowerCase();
    if (!q) {
      customerSuggestions.innerHTML = "";
      hideCustomerSuggestions();
      return;
    }
    const matches = allCustomers.filter((item) => (
      item.name.toLowerCase().includes(q) || item.code.toLowerCase().includes(q)
    )).slice(0, 6);
    if (!matches.length) {
      customerSuggestions.innerHTML = "";
      hideCustomerSuggestions();
      return;
    }
    customerSuggestions.innerHTML = matches.map((item) => (
      `<div class="suggestionItem" data-value="${escapeHtml(item.name)}">
        <span>${escapeHtml(item.name)}</span>
        <span class="suggestionCode">${escapeHtml(item.code)}</span>
      </div>`
    )).join("\n");
    customerSuggestions.style.display = "block";
  };

  const updateCustomerClear = () => {
    if (!customerSearchClear) return;
    customerSearchClear.classList.toggle("visible", Boolean(customerSearch && customerSearch.value));
  };

  const readFormValues = () => ({
    activityType: activityType.value.trim(),
    submissionStatus: submissionStatus.value.trim(),
    submissionSubStatus: submissionSubStatus.value.trim(),
    submissionType: submissionType.value.trim(),
    invoiceType: invoiceType.value.trim(),
    submissionDate: submissionDate.value,
    sentTo: sentTo.value.trim(),
    remarks: submissionRemarks.value.trim()
  });

  const validateForm = () => {
    const values = readFormValues();
    if (!values.activityType || !values.submissionStatus || !values.submissionSubStatus) {
      return "Please fill activity type, submission status, and submission sub status.";
    }
    return "";
  };

  const openForm = (invoiceNos) => {
    isFormOpen = true;
    activeInvoiceIds = invoiceNos.slice();
    selected.clear();
    invoiceNos.forEach((id) => selected.add(id));
    if (formMessage) formMessage.textContent = "";
    renderTable();
    if (submissionFormPanel) {
      submissionFormPanel.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const closeForm = () => {
    closeSubmissionEmailDraftPopup();
    isFormOpen = false;
    activeInvoiceIds = [];
    selected.clear();
    if (formMessage) formMessage.textContent = "";
    if (submissionAiSuggestions) {
      submissionAiSuggestions.classList.add("hidden");
      submissionAiSuggestions.setAttribute("aria-hidden", "true");
    }
    renderTable();
  };

  const applySubmission = (invoiceNos) => {
    const error = validateForm();
    if (error) {
      if (formMessage) formMessage.textContent = error;
      return;
    }
    const values = readFormValues();
    invoices.forEach((row) => {
      if (invoiceNos.includes(row.invoiceNo)) {
        row.submissionStatus = values.submissionStatus || row.submissionStatus;
        row.submissionDate = values.submissionDate || formatDateKey(new Date());
        row.submissionType = values.submissionType || row.submissionType;
      }
    });
    if (formMessage) formMessage.textContent = `Updated ${invoiceNos.length} invoice(s).`;
    closeForm();
  };

  if (selectAll) {
    selectAll.addEventListener("change", (event) => {
      const rows = isFormOpen && activeInvoiceIds.length
        ? getFilteredRows().filter((row) => activeInvoiceIds.includes(row.invoiceNo))
        : getFilteredRows();
      if (event.target.checked) {
        rows.forEach((row) => selected.add(row.invoiceNo));
      } else {
        rows.forEach((row) => selected.delete(row.invoiceNo));
      }
      renderTable();
    });
  }

  if (tableBody) {
    tableBody.addEventListener("change", (event) => {
      const checkbox = event.target.closest(".rowSelect");
      if (!checkbox) return;
      const id = checkbox.getAttribute("data-id");
      if (!id) return;
      if (checkbox.checked) selected.add(id);
      else selected.delete(id);
      updateSelectedCount();
    });

    tableBody.addEventListener("click", (event) => {
      const btn = event.target.closest(".rowActionBtn");
      if (!btn) return;
      const id = btn.getAttribute("data-id");
      if (!id) return;
      openForm([id]);
    });
  }

  if (submitSelectedBtn) {
    submitSelectedBtn.addEventListener("click", () => {
      if (!selected.size) {
        if (formMessage) formMessage.textContent = "Select at least one invoice.";
        return;
      }
      applySubmission(Array.from(selected));
    });
  }

  if (bulkSubmitBtn) {
    bulkSubmitBtn.addEventListener("click", () => {
      if (selected.size <= 1) return;
      openForm(Array.from(selected));
    });
  }

  if (closeFormBtn) {
    closeFormBtn.addEventListener("click", () => {
      closeForm();
    });
  }

  if (submissionEmailDraftClose) {
    submissionEmailDraftClose.addEventListener("click", () => {
      closeSubmissionEmailDraftPopup();
    });
  }

  if (submissionEmailDraftSend) {
    submissionEmailDraftSend.addEventListener("click", () => {
      const invoiceLabel = getActiveSubmissionRows().map((row) => row.invoiceNo).join(", ");
      closeSubmissionEmailDraftPopup();
      if (formMessage) {
        formMessage.textContent = invoiceLabel
          ? `Confirmation email prepared/sent for ${invoiceLabel}.`
          : "Confirmation email prepared/sent.";
      }
    });
  }

  if (clearFormBtn) {
    clearFormBtn.addEventListener("click", () => {
      activityType.value = "";
      submissionStatus.value = "";
      submissionSubStatus.value = "";
      submissionType.value = "";
      invoiceType.value = "";
      submissionDate.value = "";
      sentTo.value = "";
      submissionRemarks.value = "";
      if (formMessage) formMessage.textContent = "";
      renderSubmissionAiSuggestions();
    });
  }

  if (invoiceSearch) {
    invoiceSearch.addEventListener("input", () => {
      invoiceQuery = invoiceSearch.value.trim();
      renderTable();
    });
  }
  if (customerSearch) {
    customerSearch.addEventListener("input", () => {
      customerQuery = customerSearch.value.trim();
      renderCustomerSuggestions(customerQuery);
      updateCustomerClear();
      renderTable();
    });
    customerSearch.addEventListener("focus", () => {
      renderCustomerSuggestions(customerSearch.value.trim());
      updateCustomerClear();
    });
  }
  if (customerSearchClear) {
    customerSearchClear.addEventListener("click", () => {
      if (!customerSearch) return;
      customerSearch.value = "";
      customerQuery = "";
      hideCustomerSuggestions();
      updateCustomerClear();
      renderTable();
      customerSearch.focus();
    });
  }
  if (customerSuggestions) {
    customerSuggestions.addEventListener("click", (event) => {
      const item = event.target.closest(".suggestionItem");
      if (!item || !customerSearch) return;
      const value = item.getAttribute("data-value") || "";
      customerSearch.value = value;
      customerQuery = value;
      hideCustomerSuggestions();
      updateCustomerClear();
      renderTable();
    });
  }
  if (submissionStatusMenu) {
    submissionStatusMenu.addEventListener("click", (event) => {
      const item = event.target.closest(".dropdown-item");
      if (!item) return;
      filterStatus = item.getAttribute("data-value") || "All";
      updateStatusFilterUi();
      renderTable();
    });
  }
  if (submissionDateBtn) {
    submissionDateBtn.addEventListener("click", () => {
      if (!submissionDatePopup) return;
      if (submissionDatePopup.classList.contains("open")) {
        closeDatePicker();
      } else {
        openDatePicker();
      }
    });
  }
  if (submissionDatePrev) {
    submissionDatePrev.addEventListener("click", () => {
      calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
      renderDateGrid();
    });
  }
  if (submissionDateNext) {
    submissionDateNext.addEventListener("click", () => {
      calendarMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
      renderDateGrid();
    });
  }
  if (submissionDateGrid) {
    submissionDateGrid.addEventListener("click", (event) => {
      event.stopPropagation();
      const cell = event.target.closest(".dateCell");
      if (!cell || cell.classList.contains("is-empty")) return;
      const dateValue = cell.getAttribute("data-date");
      if (!dateValue) return;
      const [year, month, day] = dateValue.split("-").map(Number);
      const clickedDate = new Date(year, month - 1, day);
      if (!rangeStart || (rangeStart && rangeEnd)) {
        rangeStart = clickedDate;
        rangeEnd = null;
        updateDateHint();
        updateDateSelectionUi();
        renderDateGrid();
        return;
      }
      if (clickedDate < rangeStart) {
        rangeEnd = rangeStart;
        rangeStart = clickedDate;
      } else {
        rangeEnd = clickedDate;
      }
      updateDateHint();
      updateDateSelectionUi();
      renderDateGrid();
    });
  }
  if (submissionDateClear) {
    submissionDateClear.addEventListener("click", () => {
      rangeStart = null;
      rangeEnd = null;
      filterFrom = "";
      filterTo = "";
      appliedStart = null;
      appliedEnd = null;
      updateDateRangeBadge();
      updateDateHint();
      updateDateSelectionUi();
      renderDateGrid();
      renderTable();
    });
  }
  if (submissionDateApply) {
    submissionDateApply.addEventListener("click", () => {
      if (!rangeStart) return;
      const start = rangeStart;
      const end = rangeEnd || rangeStart;
      appliedStart = new Date(start.getTime());
      appliedEnd = new Date(end.getTime());
      filterFrom = formatDateKey(appliedStart);
      filterTo = formatDateKey(appliedEnd);
      updateDateRangeBadge();
      renderTable();
      closeDatePicker();
    });
  }
  if (submissionClearFilters) {
    submissionClearFilters.addEventListener("click", () => {
      invoiceQuery = "";
      customerQuery = "";
      filterStatus = "All";
      filterFrom = "";
      filterTo = "";
      rangeStart = null;
      rangeEnd = null;
      appliedStart = null;
      appliedEnd = null;
      if (invoiceSearch) invoiceSearch.value = "";
      if (customerSearch) customerSearch.value = "";
      hideCustomerSuggestions();
      updateCustomerClear();
      updateStatusFilterUi();
      updateDateRangeBadge();
      updateDateHint();
      updateDateSelectionUi();
      renderDateGrid();
      closeDatePicker();
      renderTable();
    });
  }

  renderClock();
  setInterval(renderClock, 60000);
  updateStatusFilterUi();
  updateCustomerClear();
  updateDateRangeBadge();
  updateDateHint();
  updateDateSelectionUi();
  renderDateGrid();
  renderTable();

  document.addEventListener("click", (event) => {
    if (!customerSearch || !customerSuggestions) return;
    const wrap = customerSearch.closest(".filterSuggest");
    if (wrap && !wrap.contains(event.target)) {
      hideCustomerSuggestions();
    }
  });

  document.addEventListener("click", (event) => {
    if (!submissionAiSuggestionList) return;
    if (event.target.closest(".aiSuggestionItem")) return;
    submissionAiSuggestionList.querySelectorAll(".aiReasonPopover").forEach((node) => {
      node.classList.add("hidden");
    });
  });

  document.addEventListener("click", (event) => {
    if (!submissionDatePopup || !submissionDateBtn) return;
    const picker = submissionDateBtn.closest(".dateRangePicker");
    if (picker && !picker.contains(event.target)) {
      closeDatePicker();
    }
  });

  if (submissionDatePopup) {
    submissionDatePopup.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  }
})();
