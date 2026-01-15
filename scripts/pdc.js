(() => {
  const tableBody = document.getElementById("pdcTableBody");
  if (!tableBody) return;

  const pdcStorageKey = "ineburaPdcRecords";
  const pdcNotificationKey = "ineburaPdcNotifications";
  const role = document.body.dataset.pdcRole || "agent";
  const userName = document.body.dataset.userName || localStorage.getItem("activeUserName") || "Agent";

  const statusClassMap = {
    "PDC logged": "logged",
    "PDC dispatched": "dispatched",
    "PDC received": "received",
    "PDC details incorrect": "incorrect",
    "PDC banked": "banked",
    "PDC cleared": "cleared",
    "PDC bounced": "bounced"
  };

  const closedStatuses = new Set(["PDC cleared", "PDC bounced"]);
  const bankableStatuses = new Set(["PDC logged", "PDC dispatched", "PDC received"]);

  const formatINR = (value) => {
    try {
      return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(value || 0));
    } catch (err) {
      return String(value || 0);
    }
  };

  const escapeHtml = (value) =>
    String(value || "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/\"/g, "&quot;");

  const parseDateValue = (value) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
  };

  const formatDateLabel = (value) => {
    const date = parseDateValue(value);
    if (!date) return "-";
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });
  };

  const formatDateTime = (value) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const toISODate = (date) => {
    if (!date) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  const loadPdcRecords = () => {
    try {
      const raw = localStorage.getItem(pdcStorageKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn("Unable to load PDC records", err);
      return [];
    }
  };

  const savePdcRecords = (list) => {
    try {
      localStorage.setItem(pdcStorageKey, JSON.stringify(list));
    } catch (err) {
      console.warn("Unable to save PDC records", err);
    }
  };

  const loadNotifications = () => {
    try {
      const raw = localStorage.getItem(pdcNotificationKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn("Unable to load PDC notifications", err);
      return [];
    }
  };

  const saveNotifications = (list) => {
    try {
      localStorage.setItem(pdcNotificationKey, JSON.stringify(list));
    } catch (err) {
      console.warn("Unable to save PDC notifications", err);
    }
  };

  const addNotification = (note) => {
    const list = loadNotifications();
    const payload = {
      id: note.id || `PDC-NOTE-${Date.now()}`,
      message: note.message || "PDC update",
      createdAt: note.createdAt || new Date().toISOString(),
      scheduledFor: note.scheduledFor || "",
      recipients: note.recipients || "",
      pdcId: note.pdcId || "",
      type: note.type || "status",
      status: note.status || "",
      remark: note.remark || "",
      read: Boolean(note.read)
    };
    list.unshift(payload);
    saveNotifications(list);
  };

  const normalizeNotifications = () => {
    const list = loadNotifications();
    const today = parseDateValue(new Date());
    let changed = false;
    const updated = list.map((note) => {
      if (note.scheduledFor && !note.sentAt) {
        const scheduledDate = parseDateValue(note.scheduledFor);
        if (scheduledDate && today && scheduledDate.getTime() <= today.getTime()) {
          note.sentAt = new Date().toISOString();
          changed = true;
        }
      }
      return note;
    });
    if (changed) saveNotifications(updated);
    return updated;
  };

  const schedulePdcReminders = (pdc) => {
    if (!pdc || !pdc.pdcDate) return;
    const pdcDate = parseDateValue(pdc.pdcDate);
    if (!pdcDate) return;
    const reminders = [3, 1].map((offset) => {
      const reminder = new Date(pdcDate);
      reminder.setDate(reminder.getDate() - offset);
      return toISODate(reminder);
    });
    const existing = loadNotifications();
    reminders.forEach((dateValue) => {
      const already = existing.some(
        (note) => note.pdcId === pdc.id && note.scheduledFor === dateValue && note.type === "bank-reminder"
      );
      if (already) return;
      addNotification({
        type: "bank-reminder",
        pdcId: pdc.id,
        scheduledFor: dateValue,
        message: `PDC banking reminder: cheque ${pdc.chequeNo || "-"} will be banked on ${formatDateLabel(pdc.pdcDate)}.`,
        recipients: "Agent, PDC Mgmt, Customer"
      });
    });
    const records = loadPdcRecords();
    const target = records.find(item => item.id === pdc.id);
    if (target && !target.remindersScheduled) {
      target.remindersScheduled = true;
      savePdcRecords(records);
    }
  };

  const getVisibleRecords = () => {
    const records = loadPdcRecords();
    if (role === "ops") return records;
    return records.filter((item) => item.createdBy === userName || item.agentName === userName);
  };

  const sumAmount = (list) => list.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  const updateCard = (countId, amountId, list) => {
    const countEl = document.getElementById(countId);
    const amountEl = document.getElementById(amountId);
    if (countEl) countEl.textContent = String(list.length);
    if (amountEl) amountEl.textContent = `Rs. ${formatINR(sumAmount(list))}`;
  };

  const renderCards = (records) => {
    const today = parseDateValue(new Date());
    const bankToday = records.filter((item) => {
      const date = parseDateValue(item.pdcDate);
      if (!date || !today) return false;
      return date.getTime() === today.getTime() && bankableStatuses.has(item.status);
    });
    const received = records.filter(item => item.status === "PDC received");
    const banked = records.filter(item => item.status === "PDC banked");
    const bounced = records.filter(item => item.status === "PDC bounced");
    const overdue = records.filter((item) => {
      const date = parseDateValue(item.pdcDate);
      if (!date || !today) return false;
      return date.getTime() < today.getTime() && !closedStatuses.has(item.status) && item.status !== "PDC banked";
    });

    updateCard("pdcBankTodayCount", "pdcBankTodayAmount", bankToday);
    updateCard("pdcTotalCount", "pdcTotalAmount", records);
    updateCard("pdcReceivedCount", "pdcReceivedAmount", received);
    updateCard("pdcBankedCount", "pdcBankedAmount", banked);
    updateCard("pdcBouncedCount", "pdcBouncedAmount", bounced);
    updateCard("pdcOverdueCount", "pdcOverdueAmount", overdue);
  };

  const renderTable = (records) => {
    if (!tableBody) return;
    tableBody.innerHTML = "";

    if (!records || records.length === 0) {
      tableBody.innerHTML = `<tr><td colspan="9"><div class="pdcEmptyState">No PDC records available.</div></td></tr>`;
      return;
    }

    records.forEach((item) => {
      const statusClass = statusClassMap[item.status] || "logged";
      const hasImage = Boolean(item.imageData);
      const canCollect = role !== "ops" && item.status === "PDC cleared";
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${item.customerCode || "-"}</td>
        <td>${item.customerName || "-"}</td>
        <td>${item.chequeNo || "-"}</td>
        <td>${formatDateLabel(item.pdcDate)}</td>
        <td>${item.bank || "-"}</td>
        <td>Rs. ${formatINR(item.amount)}</td>
        <td>
          ${hasImage
            ? `<button class="pdcActionBtn" type="button" data-pdc-action="preview" data-pdc-id="${item.id}">Preview</button>`
            : `<span class="text-muted">-</span>`}
        </td>
        <td><span class="pdcStatus ${statusClass}">${item.status || "-"}</span></td>
        <td>
          ${role === "ops"
            ? `<button class="pdcActionBtn" type="button" data-pdc-action="update" data-pdc-id="${item.id}">Update status</button>`
            : (canCollect
              ? `<button class="pdcActionBtn" type="button" data-pdc-action="collect" data-pdc-id="${item.id}">Collect</button>`
              : `<span class="text-muted">-</span>`)}
        </td>
      `;
      tableBody.appendChild(tr);
    });
  };

  const getVisibleNotifications = (records) => {
    const notifications = normalizeNotifications();
    if (role === "ops") return notifications;
    const map = new Map((records || []).map(record => [record.id, record]));
    return notifications.filter((note) => {
      const record = map.get(note.pdcId);
      return record && (record.createdBy === userName || record.agentName === userName);
    });
  };

  const shouldShowInBell = (note) => !note.scheduledFor || note.sentAt;

  const renderActivityTrail = (records) => {
    const trailEl = document.getElementById("pdcActivityTrail");
    if (!trailEl) return;
    const notifications = getVisibleNotifications(records);
    if (notifications.length === 0) {
      trailEl.innerHTML = `<div class="pdcEmptyState">No activity yet.</div>`;
      return;
    }

    const visible = notifications.slice(0, 8);
    trailEl.innerHTML = visible.map((note) => {
      const schedule = note.scheduledFor
        ? `Scheduled for ${formatDateLabel(note.scheduledFor)}`
        : formatDateTime(note.sentAt || note.createdAt);
      const eventClass = note.type === "bank-reminder" ? "event-pdc-reminder" : "event-pdc-update";
      const badge = note.type === "bank-reminder" ? "Reminder" : (note.status || "Update");
      const meta = note.status ? `Status: ${note.status}` : schedule;
      const detailItems = [
        { label: "Message", value: escapeHtml(note.message) },
        { label: "Recipients", value: escapeHtml(note.recipients || "-") },
        { label: "Remark", value: escapeHtml(note.remark || "-") },
        { label: "When", value: escapeHtml(schedule) }
      ];
      return `
        <details class="activityEvent ${eventClass}">
          <summary>
            <div>
              <div class="eventTitle">${note.type === "bank-reminder" ? "PDC reminder" : "PDC update"}</div>
              <div class="eventMeta">${escapeHtml(meta)}</div>
            </div>
            <span class="eventBadge">${badge}</span>
          </summary>
          <div class="eventBody">
            ${detailItems.map(item => `
              <div class="activityDetailLine">
                <span class="activityLabel">${item.label}</span>
                <span class="activityValue">${item.value}</span>
              </div>
            `).join("")}
          </div>
        </details>
      `;
    }).join("");
  };

  const notificationBellBtn = document.getElementById("notificationBellBtn");
  const notificationPopup = document.getElementById("notificationPopup");
  const notificationList = document.getElementById("notificationPopupList");
  const notificationCount = document.getElementById("notificationBellCount");
  let cachedRecords = [];

  const updateBellNotificationBadge = (records) => {
    if (!notificationCount) return;
    const list = getVisibleNotifications(records).filter(shouldShowInBell);
    const unread = list.filter(note => !note.read).length;
    notificationCount.textContent = String(unread);
    notificationCount.classList.toggle("hidden", unread === 0);
  };

  const renderBellNotifications = (records) => {
    if (!notificationList) return;
    const recordMap = new Map((records || []).map(record => [record.id, record]));
    const list = getVisibleNotifications(records).filter(shouldShowInBell);
    if (list.length === 0) {
      notificationList.innerHTML = `<div class="notificationEmpty">No notifications yet.</div>`;
      return;
    }
    notificationList.innerHTML = list.map((note) => {
      const record = recordMap.get(note.pdcId);
      const label = record
        ? `PDC ${record.chequeNo || record.id}`
        : (note.pdcId ? `PDC ${note.pdcId}` : "-");
      const time = formatDateTime(note.sentAt || note.createdAt);
      return `
        <div class="notificationItem" data-pdc="${note.pdcId || ""}">
          <div>${escapeHtml(note.message)}</div>
          <div class="notificationMeta">
            <span>${escapeHtml(label)}</span>
            <span>${escapeHtml(time)}</span>
          </div>
        </div>
      `;
    }).join("");
  };

  const markVisibleNotificationsRead = (records) => {
    const list = loadNotifications();
    const visibleIds = new Set(getVisibleNotifications(records).filter(shouldShowInBell).map(note => note.id));
    const updated = list.map((note) => {
      if (visibleIds.has(note.id)) {
        return { ...note, read: true };
      }
      return note;
    });
    saveNotifications(updated);
    updateBellNotificationBadge(records);
  };

  const toggleNotificationPopup = (forceOpen) => {
    if (!notificationPopup) return;
    const shouldOpen = typeof forceOpen === "boolean"
      ? forceOpen
      : notificationPopup.classList.contains("hidden");
    if (shouldOpen) {
      renderBellNotifications(cachedRecords);
      notificationPopup.classList.remove("hidden");
      markVisibleNotificationsRead(cachedRecords);
    } else {
      notificationPopup.classList.add("hidden");
    }
  };

  const renderAll = () => {
    const records = getVisibleRecords();
    cachedRecords = records;
    renderCards(records);
    renderTable(records);
    renderActivityTrail(records);
    updateBellNotificationBadge(records);
    renderCollectInvoiceList(records);
    const metaEl = document.getElementById("pdcListMeta");
    if (metaEl) metaEl.textContent = `${records.length} entries`;
  };

  const wireSideNavEvents = () => {
    const menuBtn = document.getElementById("headerMenuBtn");
    const overlay = document.getElementById("sideNavOverlay");
    const closeBtn = document.getElementById("sideNavClose");
    const sideNav = document.getElementById("sideNav");

    const openSideNav = () => {
      if (!overlay) return;
      overlay.classList.add("open");
      overlay.setAttribute("aria-hidden", "false");
    };

    const closeSideNav = () => {
      if (!overlay) return;
      overlay.classList.remove("open");
      overlay.setAttribute("aria-hidden", "true");
    };

    if (menuBtn) menuBtn.addEventListener("click", openSideNav);
    if (closeBtn) closeBtn.addEventListener("click", closeSideNav);
    if (overlay) {
      overlay.addEventListener("click", (event) => {
        if (event.target === overlay) closeSideNav();
      });
    }
    if (sideNav) {
      sideNav.addEventListener("click", (event) => {
        const toggle = event.target.closest(".nav-link[data-toggle=\"submenu\"]");
        if (toggle) {
          event.preventDefault();
          const menuItem = toggle.closest(".menu-item");
          if (!menuItem) return;
          const isOpen = menuItem.classList.toggle("open");
          toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
          return;
        }
      });
    }
  };

  const statusModalEl = document.getElementById("pdcStatusModal");
  const statusSelect = document.getElementById("pdcStatusSelect");
  const statusRemark = document.getElementById("pdcStatusRemark");
  const statusError = document.getElementById("pdcStatusError");
  const statusSaveBtn = document.getElementById("pdcStatusSaveBtn");
  const notifyDock = document.getElementById("notifyDock");
  const imageModalEl = document.getElementById("pdcImageModal");
  const imagePreview = document.getElementById("pdcImagePreview");
  const imageCaption = document.getElementById("pdcImageCaption");
  const collectModalEl = document.getElementById("pdcCollectModal");
  const collectSummary = document.getElementById("pdcCollectSummary");
  const collectInstrumentMode = document.getElementById("pdcCollectInstrumentMode");
  const collectInstrumentRef = document.getElementById("pdcCollectInstrumentRef");
  const collectBank = document.getElementById("pdcCollectBank");
  const collectTransferDate = document.getElementById("pdcCollectTransferDate");
  const collectAmount = document.getElementById("pdcCollectAmount");
  const collectTds = document.getElementById("pdcCollectTds");
  const collectLd = document.getElementById("pdcCollectLd");
  const collectSubmitBtn = document.getElementById("pdcCollectSubmit");
  const collectInvoiceSearch = document.getElementById("pdcCollectInvoiceSearch");
  const collectInvoiceList = document.getElementById("pdcCollectInvoiceList");
  const collectInvoiceTags = document.getElementById("pdcCollectInvoiceTags");
  const collectOutstanding = document.getElementById("pdcCollectOutstanding");
  const collectTotal = document.getElementById("pdcCollectTotal");
  const collectError = document.getElementById("pdcCollectError");
  const collectMiscFields = document.getElementById("pdcCollectMiscFields");
  const collectMiscList = document.getElementById("pdcCollectMiscList");
  const collectAddModeBtn = document.getElementById("pdcCollectAddModeBtn");
  const collectActivityType = document.getElementById("pdcCollectActivityType");
  const collectBroadStatus = document.getElementById("pdcCollectBroadStatus");
  const collectPrimaryStatus = document.getElementById("pdcCollectPrimaryStatus");
  const collectSubStatus = document.getElementById("pdcCollectSubStatus");
  const collectRemarks = document.getElementById("pdcCollectRemarks");
  const statusModal = statusModalEl && window.bootstrap
    ? window.bootstrap.Modal.getOrCreateInstance(statusModalEl)
    : null;
  const imageModal = imageModalEl && window.bootstrap
    ? window.bootstrap.Modal.getOrCreateInstance(imageModalEl)
    : null;
  const collectModal = collectModalEl && window.bootstrap
    ? window.bootstrap.Modal.getOrCreateInstance(collectModalEl)
    : null;

  let activePdcId = null;

  const showNotify = (title, message) => {
    if (!notifyDock) return;
    const popup = document.createElement("div");
    popup.className = "notifyPopup success animateUp";
    popup.innerHTML = `
      <div>
        <strong>${escapeHtml(title)}</strong>
        <span>${escapeHtml(message)}</span>
      </div>
      <button class="notifyClose" type="button" aria-label="Dismiss">
        <i class="bi bi-x-lg" aria-hidden="true"></i>
      </button>
    `;
    const closeBtn = popup.querySelector(".notifyClose");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => popup.remove());
    }
    notifyDock.prepend(popup);
    setTimeout(() => {
      if (popup.isConnected) popup.remove();
    }, 4000);
  };

  const showStatusSuccess = (message) => {
    showNotify("Status updated", message);
  };

  const openStatusModal = (pdcId) => {
    if (!statusModal || !statusSelect) return;
    const records = loadPdcRecords();
    const target = records.find(item => item.id === pdcId);
    if (!target) return;
    activePdcId = pdcId;
    statusSelect.value = target.status || "PDC logged";
    if (statusRemark) statusRemark.value = "";
    if (statusError) statusError.classList.add("hidden");
    statusModal.show();
  };

  const openImageModal = (pdcId) => {
    if (!imageModal || !imagePreview) return;
    const records = loadPdcRecords();
    const target = records.find(item => item.id === pdcId);
    if (!target || !target.imageData) return;
    imagePreview.src = target.imageData;
    if (imageCaption) {
      const label = target.imageName || target.chequeNo || target.id || "Cheque image";
      imageCaption.textContent = label;
    }
    imageModal.show();
  };

  const collectSingleFields = collectModalEl
    ? collectModalEl.querySelectorAll(".collectionSingleFields")
    : [];
  const miscModes = ["NEFT", "RTGS", "Cheque", "Demand Draft", "PDC", "CN", "Adv"];
  const miscAdjustmentModes = new Set(["PDC"]);

  const getActivePdcRecord = () => {
    const records = loadPdcRecords();
    return records.find(item => item.id === activePdcId) || null;
  };

  const getClearedPdcOptions = () => {
    const records = getVisibleRecords().filter(item => item.status === "PDC cleared");
    return records.map((item) => ({
      value: item.id,
      label: `${item.chequeNo || item.id} | Rs.${formatINR(item.amount || 0)}`,
      record: item
    }));
  };

  const showCollectError = (message) => {
    if (!collectError) return;
    collectError.textContent = message;
    collectError.classList.remove("hidden");
  };

  const clearCollectError = () => {
    if (!collectError) return;
    collectError.textContent = "";
    collectError.classList.add("hidden");
  };

  const updateCollectTotals = () => {
    const record = getActivePdcRecord();
    const outstanding = record ? Number(record.amount || 0) : 0;
    if (collectOutstanding) collectOutstanding.textContent = `Rs. ${formatINR(outstanding)}`;

    let total = 0;
    const isMisc = collectInstrumentMode?.value === "Miscellenious";
    if (isMisc && collectMiscList) {
      const rows = collectMiscList.querySelectorAll(".collectionMiscRow");
      rows.forEach((row) => {
        const amount = Number(row.querySelector(".miscAmount")?.value || 0);
        const tds = Number(row.querySelector(".miscTds")?.value || 0);
        const ld = Number(row.querySelector(".miscLd")?.value || 0);
        total += amount + tds + ld;
      });
    } else {
      const amount = Number(collectAmount?.value || 0);
      const tds = Number(collectTds?.value || 0);
      const ld = Number(collectLd?.value || 0);
      total = amount + tds + ld;
    }

    if (collectTotal) collectTotal.textContent = `Rs. ${formatINR(total)}`;
  };

  const validateCollect = (showErrors) => {
    const record = getActivePdcRecord();
    const outstanding = record ? Number(record.amount || 0) : 0;
    const isMisc = collectInstrumentMode?.value === "Miscellenious";
    const miscRows = isMisc ? getCollectMiscRowsData() : [];

    let totalCollected = 0;
    if (isMisc) {
      miscRows.forEach((row) => {
        totalCollected += Number(row.amount || 0) + Number(row.tds || 0) + Number(row.ld || 0);
      });
    } else {
      totalCollected = Number(collectAmount?.value || 0)
        + Number(collectTds?.value || 0)
        + Number(collectLd?.value || 0);
    }

    if (totalCollected > outstanding) {
      if (showErrors) showCollectError("Total collected cannot be more than total outstanding.");
      return false;
    }

    if (isMisc && collectMiscList) {
      const optionMap = new Map(getClearedPdcOptions().map(opt => [opt.value, opt.record]));
      const rowEls = Array.from(collectMiscList.querySelectorAll(".collectionMiscRow"));
      let hasError = false;
      rowEls.forEach((rowEl, idx) => {
        const row = miscRows[idx];
        if (!row || row.mode !== "PDC") return;
        const recordRef = optionMap.get(row.adjustmentId);
        if (!recordRef) return;
        const amount = Number(row.amount || 0);
        const remaining = Number(recordRef.amount || 0);
        const err = rowEl.querySelector(".miscRowError");
        if (amount > remaining) {
          if (err && showErrors) {
            err.textContent = `PDC amount exceeds remaining for ${recordRef.chequeNo || recordRef.id}.`;
            err.classList.remove("hidden");
          }
          hasError = true;
        } else if (err && showErrors) {
          err.textContent = "";
          err.classList.add("hidden");
        }
      });
      if (hasError) return false;
    }

    if (showErrors) clearCollectError();
    return true;
  };

  const updateAdjustmentField = (row, mode) => {
    const field = row.querySelector(".miscAdjustmentField");
    const select = row.querySelector(".miscAdjustmentSelect");
    if (!field || !select) return;

    if (miscAdjustmentModes.has(mode)) {
      const options = getClearedPdcOptions();
      select.innerHTML = options.length
        ? `<option value="">Select ${mode}</option>` + options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join("")
        : `<option value="">No ${mode} available</option>`;
      field.classList.remove("hidden");
    } else {
      field.classList.add("hidden");
      select.innerHTML = "";
    }
  };

  const createCollectMiscRow = (initialMode, prefill) => {
    if (!collectMiscList) return;
    const row = document.createElement("div");
    row.className = "collectionMiscRow";
    row.innerHTML = `
      <div class="collectionMiscRowHeader">
        <div>
          <label>Mode</label>
          <select class="miscModeSelect">
            ${miscModes.map(mode => `<option ${mode === initialMode ? "selected" : ""}>${mode}</option>`).join("")}
          </select>
        </div>
        <button type="button" class="miscRemoveBtn">Remove</button>
      </div>
      <div class="collectionMiscGrid">
        <div class="miscAdjustmentField hidden">
          <label>Adjustment</label>
          <select class="miscAdjustmentSelect"></select>
        </div>
        <div>
          <label>Instrument ref no</label>
          <input type="text" class="miscInstrumentRef" placeholder="Reference number" />
        </div>
        <div>
          <label>Bank</label>
          <input type="text" class="miscBank" placeholder="Bank name" list="bankSuggestions" />
        </div>
        <div>
          <label>Transfer date</label>
          <input type="date" class="miscTransferDate" />
        </div>
        <div>
          <label>Amount</label>
          <input type="number" class="miscAmount" min="0" step="0.01" placeholder="0" />
        </div>
        <div>
          <label>TDS</label>
          <input type="number" class="miscTds" min="0" step="0.01" placeholder="0" />
        </div>
        <div>
          <label>LD</label>
          <input type="number" class="miscLd" min="0" step="0.01" placeholder="0" />
        </div>
      </div>
      <div class="miscRowError hidden"></div>
    `;

    const modeSelect = row.querySelector(".miscModeSelect");
    const removeBtn = row.querySelector(".miscRemoveBtn");
    const adjustSelect = row.querySelector(".miscAdjustmentSelect");

    if (modeSelect) {
      updateAdjustmentField(row, modeSelect.value);
      modeSelect.addEventListener("change", () => {
        updateAdjustmentField(row, modeSelect.value);
        clearCollectError();
      });
    }

    if (prefill) {
      if (adjustSelect && prefill.adjustmentId) adjustSelect.value = prefill.adjustmentId;
      row.querySelector(".miscInstrumentRef").value = prefill.instrumentRef || "";
      row.querySelector(".miscBank").value = prefill.bank || "";
      row.querySelector(".miscTransferDate").value = prefill.transferDate || "";
      row.querySelector(".miscAmount").value = prefill.amount || "";
    }

    row.querySelectorAll(".miscAmount, .miscTds, .miscLd").forEach((input) => {
      input.addEventListener("input", () => {
        const err = row.querySelector(".miscRowError");
        if (err) {
          err.textContent = "";
          err.classList.add("hidden");
        }
        clearCollectError();
        updateCollectTotals();
        validateCollect(true);
      });
    });

    row.querySelectorAll(".miscInstrumentRef, .miscBank, .miscTransferDate, .miscModeSelect, .miscAdjustmentSelect")
      .forEach((input) => {
        input.addEventListener("change", () => {
          const err = row.querySelector(".miscRowError");
          if (err) {
            err.textContent = "";
            err.classList.add("hidden");
          }
          clearCollectError();
          validateCollect(true);
        });
      });

    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        row.remove();
        updateCollectTotals();
      });
    }

    collectMiscList.appendChild(row);
  };

  const getCollectMiscRowsData = () => {
    if (!collectMiscList) return [];
    return Array.from(collectMiscList.querySelectorAll(".collectionMiscRow")).map((row) => ({
      mode: row.querySelector(".miscModeSelect")?.value || "",
      instrumentRef: row.querySelector(".miscInstrumentRef")?.value || "",
      bank: row.querySelector(".miscBank")?.value || "",
      transferDate: row.querySelector(".miscTransferDate")?.value || "",
      amount: row.querySelector(".miscAmount")?.value || "",
      tds: row.querySelector(".miscTds")?.value || "",
      ld: row.querySelector(".miscLd")?.value || "",
      adjustmentId: row.querySelector(".miscAdjustmentSelect")?.value || ""
    }));
  };

  const toggleCollectModeFields = () => {
    const isMisc = collectInstrumentMode?.value === "Miscellenious";
    collectSingleFields.forEach(el => el.classList.toggle("hidden", isMisc));
    if (collectMiscFields) collectMiscFields.classList.toggle("hidden", !isMisc);
    if (isMisc && collectMiscList && collectMiscList.children.length === 0) {
      const record = getActivePdcRecord();
      if (record) {
        createCollectMiscRow("PDC", {
          adjustmentId: record.id,
          instrumentRef: record.chequeNo || "",
          bank: record.bank || "",
          transferDate: record.pdcDate || "",
          amount: record.amount ? String(record.amount) : ""
        });
      } else {
        createCollectMiscRow("PDC");
      }
    }
    updateCollectTotals();
  };

  const renderCollectInvoiceList = (records) => {
    if (!collectInvoiceList) return;
    const cleared = (records || []).filter(item => item.status === "PDC cleared");
    const invoiceNos = Array.from(new Set(cleared.map(item => item.invoiceNo).filter(Boolean)));
    collectInvoiceList.innerHTML = invoiceNos.map(inv => `<option value="${escapeHtml(inv)}"></option>`).join("");
  };

  const renderCollectInvoiceTags = (invoiceNo) => {
    if (!collectInvoiceTags) return;
    if (!invoiceNo) {
      collectInvoiceTags.innerHTML = "";
      return;
    }
    collectInvoiceTags.innerHTML = `<span class="invoiceTag">${escapeHtml(invoiceNo)}</span>`;
  };

  const selectPdcByInvoice = (invoiceNo) => {
    if (!invoiceNo) return null;
    const records = getVisibleRecords().filter(item => item.status === "PDC cleared");
    return records.find(item => item.invoiceNo === invoiceNo) || null;
  };

  const prefillCollectForm = (target, options = {}) => {
    if (!target) return;
    const showInvoice = options.showInvoice !== false;
    const invoiceNo = showInvoice ? target.invoiceNo : "";
    if (collectSummary) {
      const amountLabel = `Rs. ${formatINR(target.amount)}`;
      const invoiceLabel = invoiceNo ? `Invoice ${invoiceNo}` : "Invoice -";
      collectSummary.textContent = `${invoiceLabel} | ${target.customerName || "Customer"} | Cheque ${target.chequeNo || "-"} | ${amountLabel}`;
    }
    if (collectInstrumentMode) collectInstrumentMode.value = "Miscellenious";
    if (collectInstrumentRef) collectInstrumentRef.value = target.chequeNo || "";
    if (collectBank) collectBank.value = target.bank || "";
    if (collectTransferDate) collectTransferDate.value = target.pdcDate || "";
    if (collectAmount) collectAmount.value = target.amount ? String(target.amount) : "";
    if (collectTds) collectTds.value = "";
    if (collectLd) collectLd.value = "";
    if (collectMiscList) collectMiscList.innerHTML = "";
    if (collectSubStatus) collectSubStatus.value = "Collection";
    toggleCollectModeFields();
    updateCollectTotals();
  };

  const openCollectModal = (pdcId) => {
    if (!collectModal) return;
    const records = loadPdcRecords();
    const target = records.find(item => item.id === pdcId);
    if (!target) return;
    activePdcId = pdcId;
    if (collectInvoiceSearch) collectInvoiceSearch.value = "";
    renderCollectInvoiceTags("");
    prefillCollectForm(target, { showInvoice: false });
    collectModal.show();
  };

  const resetCollectForm = () => {
    if (collectInvoiceSearch) collectInvoiceSearch.value = "";
    renderCollectInvoiceTags("");
    if (collectSummary) collectSummary.textContent = "-";
    if (collectInstrumentMode) collectInstrumentMode.value = "NEFT";
    if (collectInstrumentRef) collectInstrumentRef.value = "";
    if (collectBank) collectBank.value = "";
    if (collectTransferDate) collectTransferDate.value = "";
    if (collectAmount) collectAmount.value = "";
    if (collectTds) collectTds.value = "";
    if (collectLd) collectLd.value = "";
    if (collectRemarks) collectRemarks.value = "";
    if (collectMiscList) collectMiscList.innerHTML = "";
    if (collectSubStatus) collectSubStatus.value = "Collection";
    updateCollectTotals();
    clearCollectError();
  };

  document.addEventListener("click", (event) => {
    const previewBtn = event.target.closest("[data-pdc-action='preview']");
    if (previewBtn) {
      const pdcId = previewBtn.getAttribute("data-pdc-id");
      if (pdcId) openImageModal(pdcId);
      return;
    }
    const collectBtn = event.target.closest("[data-pdc-action='collect']");
    if (collectBtn) {
      const pdcId = collectBtn.getAttribute("data-pdc-id");
      if (pdcId) openCollectModal(pdcId);
      return;
    }
    if (role !== "ops") return;
    const btn = event.target.closest("[data-pdc-action='update']");
    if (!btn) return;
    const pdcId = btn.getAttribute("data-pdc-id");
    if (pdcId) openStatusModal(pdcId);
  });

  if (collectInstrumentMode) {
    collectInstrumentMode.addEventListener("change", toggleCollectModeFields);
  }

  if (collectAddModeBtn) {
    collectAddModeBtn.addEventListener("click", () => createCollectMiscRow("NEFT"));
  }

  [collectAmount, collectTds, collectLd].forEach((el) => {
    if (!el) return;
    el.addEventListener("input", () => {
      clearCollectError();
      updateCollectTotals();
      validateCollect(true);
    });
  });

  if (collectInvoiceSearch) {
    collectInvoiceSearch.addEventListener("change", () => {
      const value = String(collectInvoiceSearch.value || "").trim();
      const record = selectPdcByInvoice(value);
      if (record) {
        activePdcId = record.id;
        renderCollectInvoiceTags(record.invoiceNo || "");
        prefillCollectForm(record);
      }
    });
  }

  if (collectSubmitBtn) {
    collectSubmitBtn.addEventListener("click", () => {
      if (!collectModal) return;
      const records = loadPdcRecords();
      const target = records.find(item => item.id === activePdcId);
      if (!target) {
        showCollectError("Select a valid invoice with a cleared PDC.");
        return;
      }
      clearCollectError();
      if (!validateCollect(true)) return;
      const instrumentMode = collectInstrumentMode?.value || "";
      const isMisc = instrumentMode === "Miscellenious";
      const miscRows = isMisc ? getCollectMiscRowsData() : [];
      const amount = collectAmount?.value || "";
      const tds = collectTds?.value || "";
      const ld = collectLd?.value || "";
      const totalCollected = isMisc
        ? miscRows.reduce((sum, row) => sum + Number(row.amount || 0) + Number(row.tds || 0) + Number(row.ld || 0), 0)
        : Number(amount || 0) + Number(tds || 0) + Number(ld || 0);
      target.collection = {
        activityType: collectActivityType?.value || "",
        broadStatus: collectBroadStatus?.value || "",
        primaryStatus: collectPrimaryStatus?.value || "",
        subStatus: collectSubStatus?.value || "Collection",
        remarks: collectRemarks?.value || "",
        instrumentMode,
        instrumentRef: collectInstrumentRef?.value || "",
        bank: collectBank?.value || "",
        transferDate: collectTransferDate?.value || "",
        amount,
        tds,
        ld,
        miscRows,
        totalCollected,
        outstanding: target.amount || 0,
        collectedAt: new Date().toISOString()
      };
      savePdcRecords(records);
      collectModal.hide();
      resetCollectForm();
      showNotify(
        "Collection saved",
        `Collection logged for cheque ${target.chequeNo || target.id}.`
      );
    });
  }

  if (statusSaveBtn && role === "ops") {
    statusSaveBtn.addEventListener("click", () => {
      const remarkText = String(statusRemark?.value || "").trim();
      if (!remarkText) {
        if (statusError) statusError.classList.remove("hidden");
        return;
      }
      if (statusError) statusError.classList.add("hidden");
      const nextStatus = statusSelect?.value || "PDC logged";
      const records = loadPdcRecords();
      const target = records.find(item => item.id === activePdcId);
      if (!target) return;

      target.status = nextStatus;
      target.history = Array.isArray(target.history) ? target.history : [];
      target.history.unshift({
        status: nextStatus,
        remark: remarkText,
        updatedAt: new Date().toISOString(),
        updatedBy: localStorage.getItem("activeUserName") || "PDC Mgmt"
      });

      let notificationMessage = `PDC status updated to ${nextStatus}.`;
      let notificationRecipients = "PDC Mgmt";

      if (nextStatus === "PDC received") {
        notificationMessage = "PDC received - Email sent to agent.";
        notificationRecipients = "Agent";
        schedulePdcReminders(target);
        showStatusSuccess(notificationMessage);
      }

      if (nextStatus === "PDC banked") {
        notificationMessage = "PDC banked - Email sent to agent and customer.";
        notificationRecipients = "Agent, Customer";
        showStatusSuccess(notificationMessage);
      }

      if (nextStatus === "PDC cleared") {
        notificationMessage = "PDC cleared - Email sent to agent and customer.";
        notificationRecipients = "Agent, Customer";
        showStatusSuccess(notificationMessage);
      }

      if (nextStatus === "PDC bounced") {
        notificationMessage = "PDC bounced - Email sent to agent and customer.";
        notificationRecipients = "Agent, Customer";
        showStatusSuccess(notificationMessage);
      }

      addNotification({
        pdcId: target.id,
        message: notificationMessage,
        recipients: notificationRecipients,
        status: nextStatus,
        remark: remarkText
      });

      savePdcRecords(records);
      if (statusModal) statusModal.hide();
      renderAll();
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key === pdcStorageKey || event.key === pdcNotificationKey) {
      renderAll();
      if (notificationPopup && !notificationPopup.classList.contains("hidden")) {
        renderBellNotifications(cachedRecords);
      }
    }
  });

  if (notificationBellBtn) {
    notificationBellBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleNotificationPopup();
    });
  }

  document.addEventListener("click", (event) => {
    if (!notificationPopup || notificationPopup.classList.contains("hidden")) return;
    const wrap = document.querySelector(".notificationBellWrap");
    if (wrap && wrap.contains(event.target)) return;
    notificationPopup.classList.add("hidden");
  });

  wireSideNavEvents();
  renderAll();
})();
