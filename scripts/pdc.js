(() => {
  const tableBody = document.getElementById("pdcTableBody");
  if (!tableBody) return;

  const pdcStorageKey = "ineburaPdcRecords";
  const pdcNotificationKey = "ineburaPdcNotifications";
  const notificationCenterKey = "ineburaNotificationCenter";
  const role = document.body.dataset.pdcRole || "agent";
  const userName = document.body.dataset.userName || localStorage.getItem("activeUserName") || "Agent";

  const rootPath = (() => {
    const raw = String(document.body.dataset.rootPath || "").trim();
    return raw && !raw.endsWith("/") ? `${raw}/` : raw;
  })();

  const resolvePath = (path) => {
    if (!path) return "";
    if (/^(?:[a-z]+:)?\/\//i.test(path) || path.startsWith("/")) return path;
    const cleaned = path.replace(/^\.\//, "");
    return `${rootPath}${cleaned}`;
  };

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
  const pdcStatusLabelMap = {
    "PDC logged": "logged",
    "PDC dispatched": "dispatched",
    "PDC received": "received",
    "PDC details incorrect": "details incorrect",
    "PDC banked": "banked",
    "PDC cleared": "cleared",
    "PDC bounced": "bounced"
  };

  const pdcStatusNotificationMap = {
    "PDC logged": {
      appMessage: "PDC logged. Awaiting dispatch from agent.",
      recipients: "Agent, PDC Mgmt",
      email: {
        from: "ops@inebura.com",
        to: "agent.ops@inebura.com",
        subject: "New PDC logged",
        message: "PDC recorded in system. Please send dispatch instructions once cheque is sent."
      }
    },
    "PDC dispatched": {
      appMessage: "PDC dispatched to customer. Tracking update in handover notes.",
      recipients: "Agent, PDC Mgmt",
      email: {
        from: "ops@inebura.com",
        to: "agent@inebura.com",
        subject: "PDC dispatched",
        message: "Courier/dispatch details shared for the logged PDC cheque."
      }
    },
    "PDC received": {
      appMessage: "PDC received - Email sent to agent.",
      recipients: "Agent, PDC Mgmt",
      email: {
        from: "ops@inebura.com",
        to: "agent@inebura.com",
        subject: "PDC received",
        message: "PDC physically received. Please proceed to confirm bank details."
      },
      remind: true
    },
    "PDC details incorrect": {
      appMessage: "PDC details incorrect. Please update cheque/cheque date details before banking.",
      recipients: "Agent, PDC Mgmt",
      email: {
        from: "ops@inebura.com",
        to: "agent.ops@inebura.com",
        subject: "PDC details incorrect",
        message: "PDC details mismatch found. Please verify and update the record."
      }
    },
    "PDC banked": {
      appMessage: "PDC banked - Email sent to agent and customer.",
      recipients: "Agent, PDC Mgmt",
      email: {
        from: "finance@inebura.com",
        to: "agent@inebura.com, customer@company.com",
        subject: "PDC banked",
        message: "PDC has been banked. Reconcile customer balance and clear the queue."
      }
    },
    "PDC cleared": {
      appMessage: "PDC cleared - Email sent to agent and customer.",
      recipients: "Agent, PDC Mgmt",
      email: {
        from: "finance@inebura.com",
        to: "agent@inebura.com, customer@company.com",
        subject: "PDC cleared",
        message: "Customer PDC adjusted and cleared successfully."
      }
    },
    "PDC bounced": {
      appMessage: "PDC bounced - Email sent to agent and customer.",
      recipients: "Agent, PDC Mgmt",
      email: {
        from: "finance@inebura.com",
        to: "agent@inebura.com, customer@company.com",
        subject: "PDC bounced",
        message: "PDC bounced while banked. Please follow up and reissue replacement."
      }
    }
  };

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

  const getNotificationCenterManager = () => window.IneburaNotificationCenter || null;

  const loadNotificationCenter = () => {
    const manager = getNotificationCenterManager();
    if (manager) return manager.load();
    try {
      const raw = localStorage.getItem(notificationCenterKey);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (err) {
      console.warn("Unable to load notification center", err);
      return [];
    }
  };

  const saveNotificationCenter = (list) => {
    const manager = getNotificationCenterManager();
    if (manager) {
      manager.save(list);
      return;
    }
    try {
      localStorage.setItem(notificationCenterKey, JSON.stringify(list));
    } catch (err) {
      console.warn("Unable to save notification center", err);
    }
  };

  const addNotificationCenterItem = (note) => {
    const manager = getNotificationCenterManager();
    if (manager) {
      manager.upsert({
        ...note,
        audience: Array.isArray(note.audience) ? note.audience : (note.audience ? [note.audience] : ["agent", "ops"])
      });
      return;
    }
    const list = loadNotificationCenter();
    const payload = {
      id: note.id || `note-${Date.now()}`,
      type: note.type || "pdc",
      title: note.title || "PDC update",
      message: note.message || "",
      createdAt: note.createdAt || new Date().toISOString(),
      scheduledFor: note.scheduledFor || "",
      sentAt: note.sentAt || "",
      read: Boolean(note.read),
      audience: Array.isArray(note.audience) ? note.audience : (note.audience ? [note.audience] : ["agent", "ops"]),
      details: Array.isArray(note.details) ? note.details : [],
      ctas: Array.isArray(note.ctas) ? note.ctas : [],
      data: note.data || {}
    };

    const existingIndex = list.findIndex(item => item.id === payload.id);
    if (existingIndex >= 0) {
      list[existingIndex] = { ...list[existingIndex], ...payload };
    } else {
      list.unshift(payload);
    }
    saveNotificationCenter(list);
  };

  const normalizePdcStatus = (status) => {
    const normalized = String(status || "").trim();
    return pdcStatusNotificationMap[normalized] ? normalized : "PDC logged";
  };

  const getPdcStatusMeta = (status) => {
    const normalized = normalizePdcStatus(status);
    return pdcStatusNotificationMap[normalized] || null;
  };

  const buildEmailMeta = (record, status) => {
    const meta = getPdcStatusMeta(status);
    if (!meta?.email) return null;
    const customer = record?.customerName || "Customer";
    const chequeNo = record?.chequeNo || record?.id || "-";
    return {
      ...meta.email,
      subject: `${customer}: ${meta.email.subject} - ${chequeNo}`
    };
  };

  const addStatusEmailDraftToCenter = ({ record, status, noteId, at }) => {
    if (!record || !status) return;
    const normalizedStatus = normalizePdcStatus(status);
    const statusLabel = pdcStatusLabelMap[normalizedStatus] || normalizedStatus || "status";
    const statusKey = String(statusLabel)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const seedEmailId = `seed-email-${record.id || noteId || "pdc-status"}-${statusKey}`;
    const emailMeta = buildEmailMeta(record, normalizedStatus);
    if (!emailMeta) return;
    const center = loadNotificationCenter();
    if (center.some((item) => item.id === seedEmailId)) return;
    addNotificationCenterItem({
      id: seedEmailId,
      type: "email",
      title: `PDC ${statusLabel} update draft`,
      message: emailMeta.message,
      createdAt: at,
      sentAt: at,
      read: false,
      audience: ["agent", "ops"],
      details: [
        { label: "From", value: emailMeta.from || "-" },
        { label: "To", value: emailMeta.to || "-" },
        { label: "Subject", value: emailMeta.subject || "-" },
        { label: "Invoice", value: record.invoiceNo || "-" },
        { label: "Customer", value: record.customerName || "-" },
        { label: "Status", value: normalizedStatus || "-" },
        { label: "Cheque", value: record.chequeNo || record.id || "-" }
      ],
      ctas: [
        { label: "Open email", action: "open-email", invoiceNo: record.invoiceNo || "" }
      ]
    });
  };

  const normalizeNotificationCenter = () => {
    const manager = getNotificationCenterManager();
    if (manager) {
      manager.getVisible({ normalizeDueScheduled: true });
      return manager.load();
    }
    const list = loadNotificationCenter();
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
    if (changed) saveNotificationCenter(updated);
    return updated;
  };

  const getVisibleNotificationCenter = () => {
    const manager = getNotificationCenterManager();
    if (manager) {
      return manager.getVisible({
        audience: role,
        normalizeDueScheduled: true
      });
    }
    return normalizeNotificationCenter().filter((note) => {
      if (note.scheduledFor && !note.sentAt) return false;
      const audiences = Array.isArray(note.audience) ? note.audience : (note.audience ? [note.audience] : []);
      if (audiences.length === 0) return true;
      return audiences.includes("all") || audiences.includes(role);
    });
  };

  const syncLegacyNotificationsToCenter = () => {
    const center = loadNotificationCenter();
    const existingIds = new Set(center.map(note => note.id));
    const additions = [];
    const recordMap = new Map(loadPdcRecords().map(record => [record.id, record]));
    loadNotifications().forEach((note) => {
      if (!note || existingIds.has(note.id)) return;
      const record = note.pdcId ? recordMap.get(note.pdcId) : null;
      const recipients = String(note.recipients || "").toLowerCase();
      const audience = [];
      if (recipients.includes("agent")) audience.push("agent");
      if (recipients.includes("pdc mgmt") || recipients.includes("ops")) audience.push("ops");
      if (audience.length === 0) audience.push("agent", "ops");
      additions.push({
        id: note.id,
        type: note.type === "bank-reminder" ? "pdc-reminder" : "pdc",
        title: note.type === "bank-reminder" ? "PDC banking reminder" : "PDC update",
        message: note.message || "",
        createdAt: note.createdAt,
        scheduledFor: note.scheduledFor || "",
        sentAt: note.sentAt || "",
        read: note.read,
        audience,
        details: [
          { label: "Customer", value: record ? `${record.customerName || "-"} (${record.customerCode || "-"})` : "-" },
          { label: "Invoice", value: record?.invoiceNo || "-" },
          { label: "Cheque", value: record?.chequeNo || note.pdcId || "-" },
          { label: "PDC date", value: record?.pdcDate || "-" },
          { label: "Bank", value: record?.bank || "-" },
          { label: "Amount", value: record?.amount ? `Rs. ${formatINR(record.amount)}` : "-" },
          { label: "Status", value: note.status || record?.status || "-" }
        ],
        ctas: [
          { label: "View PDC", action: "open-pdc" }
        ]
      });
    });
    if (additions.length > 0) {
      saveNotificationCenter(additions.concat(center));
    }
  };

  const addNotification = (note) => {
    const list = loadNotifications();
    const record = note.pdcId ? loadPdcRecords().find(item => item.id === note.pdcId) : null;
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

    const recipients = String(payload.recipients || "").toLowerCase();
    const audience = [];
    if (recipients.includes("agent")) audience.push("agent");
    if (recipients.includes("pdc mgmt") || recipients.includes("ops")) audience.push("ops");
    if (audience.length === 0) audience.push("agent", "ops");

    addNotificationCenterItem({
      id: payload.id,
      type: payload.type === "bank-reminder" ? "pdc-reminder" : "pdc",
      title: payload.type === "bank-reminder" ? "PDC banking reminder" : "PDC update",
      message: payload.message,
      createdAt: payload.createdAt,
      scheduledFor: payload.scheduledFor,
      sentAt: payload.sentAt,
      read: payload.read,
      audience,
      details: [
        { label: "Customer", value: record ? `${record.customerName || "-"} (${record.customerCode || "-"})` : "-" },
        { label: "Invoice", value: record?.invoiceNo || "-" },
        { label: "Cheque", value: record?.chequeNo || payload.pdcId || "-" },
        { label: "PDC date", value: record?.pdcDate || "-" },
        { label: "Bank", value: record?.bank || "-" },
        { label: "Amount", value: record?.amount ? `Rs. ${formatINR(record.amount)}` : "-" },
        { label: "Status", value: payload.status || record?.status || "-" }
      ],
      ctas: [
        { label: "View PDC", action: "open-pdc" }
      ]
    });
  };

  const makeFutureDate = (offsetDays) => {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    return toISODate(date);
  };

  const getSeedNotifications = () => ([
    {
      id: "seed-pdc-record-logged",
      customerCode: "APL-104",
      customerName: "Apollo Diagnostics",
      invoiceNo: "INV-PDC-1001",
      chequeNo: "CHQ-99001",
      pdcDate: makeFutureDate(5),
      bank: "HDFC",
      amount: 280000,
      status: "PDC logged",
      createdBy: userName,
      agentName: userName
    },
    {
      id: "seed-pdc-record-dispatched",
      customerCode: "BLW-212",
      customerName: "BlueWave Distributors",
      invoiceNo: "INV-PDC-1002",
      chequeNo: "CHQ-99002",
      pdcDate: makeFutureDate(2),
      bank: "ICICI",
      amount: 420000,
      status: "PDC dispatched",
      createdBy: userName,
      agentName: userName
    },
    {
      id: "seed-pdc-record-received",
      customerCode: "SRI-311",
      customerName: "Sunrise Retail",
      invoiceNo: "INV-PDC-1003",
      chequeNo: "CHQ-99003",
      pdcDate: makeFutureDate(-1),
      bank: "SBI",
      amount: 160000,
      status: "PDC received",
      createdBy: userName,
      agentName: userName
    },
    {
      id: "seed-pdc-record-incorrect",
      customerCode: "MNO-421",
      customerName: "MonoChem Corp",
      invoiceNo: "INV-PDC-1004",
      chequeNo: "CHQ-99004",
      pdcDate: makeFutureDate(1),
      bank: "Axis",
      amount: 95000,
      status: "PDC details incorrect",
      createdBy: userName,
      agentName: userName
    },
    {
      id: "seed-pdc-record-banked",
      customerCode: "LUM-512",
      customerName: "Lumen Technologies",
      invoiceNo: "INV-PDC-1005",
      chequeNo: "CHQ-99005",
      pdcDate: makeFutureDate(-2),
      bank: "Kotak",
      amount: 360000,
      status: "PDC banked",
      createdBy: userName,
      agentName: userName
    },
    {
      id: "seed-pdc-record-cleared",
      customerCode: "MED-671",
      customerName: "MediTrust Pvt Ltd",
      invoiceNo: "INV-PDC-1006",
      chequeNo: "CHQ-99006",
      pdcDate: makeFutureDate(-3),
      bank: "IDFC",
      amount: 50000,
      status: "PDC cleared",
      createdBy: userName,
      agentName: userName
    },
    {
      id: "seed-pdc-record-bounced",
      customerCode: "GEN-799",
      customerName: "Generix Holdings",
      invoiceNo: "INV-PDC-1007",
      chequeNo: "CHQ-99007",
      pdcDate: makeFutureDate(-4),
      bank: "HDFC",
      amount: 120000,
      status: "PDC bounced",
      createdBy: userName,
      agentName: userName
    }
  ]);

  const seedDummyPdcNotifications = () => {
    const records = loadPdcRecords();
    const existingRecordIds = new Set(records.map((record) => String(record?.id || "")));
    const notifications = loadNotifications();
    const existingNotificationIds = new Set(notifications.map((note) => String(note?.id || "")));
    const center = loadNotificationCenter();
    const existingCenterIds = new Set(center.map((note) => String(note?.id || "")));
    let recordChanged = false;

    const now = Date.now();
    getSeedNotifications().forEach((seed, index) => {
      const status = normalizePdcStatus(seed.status);
      const meta = getPdcStatusMeta(status);
      const at = new Date(now - (index * 3 * 60 * 1000)).toISOString();
      if (!existingRecordIds.has(seed.id)) {
        const history = [
          {
            status: "PDC logged",
            remark: "Seeded dummy trail.",
            updatedAt: at,
            updatedBy: userName
          }
        ];
        if (status && status !== "PDC logged") {
          history.unshift({
            status,
            remark: `Seeded dummy trail. Current status: ${status}.`,
            updatedAt: at,
            updatedBy: userName
          });
        }
        records.unshift({
          ...seed,
          status,
          createdAt: at,
          history,
          remindersScheduled: false
        });
        existingRecordIds.add(seed.id);
        recordChanged = true;
      }

      const noteId = `seed-pdc-note:${seed.id}:${status || "status"}`;
      if (!existingNotificationIds.has(noteId)) {
        const pdcMessage = meta?.appMessage || `PDC status updated to ${status}.`;
        const pdcRecipients = meta?.recipients || "PDC Mgmt";
        addNotification({
          id: noteId,
          pdcId: seed.id,
          status,
          message: pdcMessage,
          recipients: pdcRecipients,
          remark: "Seeded status update",
          sentAt: at,
          read: false
        });
        existingNotificationIds.add(noteId);
      }

      if (meta?.email) {
        const emailStatusKey = String(pdcStatusLabelMap[status] || status || "status")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "");
        const emailId = `seed-pdc-email:${seed.id}:${emailStatusKey}`;
        if (!existingCenterIds.has(emailId)) {
          const emailMeta = buildEmailMeta(seed, status);
          if (emailMeta) {
            addNotificationCenterItem({
              id: emailId,
              type: "email",
              title: `PDC ${pdcStatusLabelMap[status] || status || "status"} email draft`,
              message: emailMeta.message,
              createdAt: at,
              sentAt: at,
              read: false,
              audience: ["agent", "ops"],
              details: [
                { label: "From", value: emailMeta.from || "-" },
                { label: "To", value: emailMeta.to || "-" },
                { label: "Subject", value: emailMeta.subject || "-" },
                { label: "Invoice", value: seed.invoiceNo || "-" },
                { label: "Customer", value: seed.customerName || "-" },
                { label: "Status", value: status || "-" },
                { label: "Cheque", value: seed.chequeNo || seed.id || "-" }
              ],
              ctas: [
                { label: "Open email", action: "open-email", invoiceNo: seed.invoiceNo || "" }
              ]
            });
            existingCenterIds.add(emailId);
          }
        }
      }

      if (meta?.remind && status === "PDC received") {
        const target = records.find((item) => item.id === seed.id);
        if (target && !target.remindersScheduled) {
          schedulePdcReminders(target);
        }
      }
    });

    if (recordChanged) {
      savePdcRecords(records);
    }
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
      const recordId = item.id || "";
      const tr = document.createElement("tr");
      if (recordId) tr.dataset.pdcId = recordId;
      if (recordId && recordId === selectedPdcId) tr.classList.add("is-selected");
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
      tr.addEventListener("click", () => {
        if (!recordId || recordId === selectedPdcId) return;
        selectedPdcId = recordId;
        tableBody.querySelectorAll("tr.is-selected").forEach((row) => row.classList.remove("is-selected"));
        tr.classList.add("is-selected");
        renderActivityTrail(records);
      });
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
    if (!selectedPdcId) {
      trailEl.innerHTML = `<div class="pdcEmptyState">Select a PDC to view activity.</div>`;
      return;
    }
    const notifications = getVisibleNotifications(records).filter(note => note.pdcId === selectedPdcId);
    if (notifications.length === 0) {
      trailEl.innerHTML = `<div class="pdcEmptyState">No activity yet for this PDC.</div>`;
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
  let selectedPdcId = null;

  const ensureSelectedPdcId = (records) => {
    if (!records || records.length === 0) {
      selectedPdcId = null;
      return null;
    }
    if (!selectedPdcId || !records.some(item => item.id === selectedPdcId)) {
      selectedPdcId = records[0]?.id || null;
    }
    return selectedPdcId;
  };

  const updateBellNotificationBadge = () => {
    if (!notificationCount) return;
    const list = getVisibleNotificationCenter().filter(shouldShowInBell);
    const unread = list.filter(note => !note.read).length;
    notificationCount.textContent = String(unread);
    notificationCount.classList.toggle("hidden", unread === 0);
  };

  const renderBellNotifications = () => {
    if (!notificationList) return;
    const list = getVisibleNotificationCenter().filter(shouldShowInBell);
    if (list.length === 0) {
      notificationList.innerHTML = `<div class="notificationEmpty">No notifications yet.</div>`;
      return;
    }

    const notificationManager = getNotificationCenterManager();
    const typeLabelMap = {
      pdc: "PDC",
      "pdc-reminder": "PDC reminder",
      todo: "Todo",
      email: "Email",
      "visit-approval": "Visit approval",
      "commitment-approved": "Commitment"
    };
    const escapeAttr = (value) =>
      String(value || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;");
    const getDetailValue = (details, label) => {
      const key = String(label || "").toLowerCase();
      const match = (details || []).find(item => String(item.label || "").toLowerCase() === key);
      return match ? String(match.value || "") : "";
    };
    const buildNotificationTitle = (note, details) => {
      const type = String(note.type || "").toLowerCase();
      const customer = getDetailValue(details, "Customer");
      const invoice = getDetailValue(details, "Invoice");
      const cheque = getDetailValue(details, "Cheque");
      const subject = getDetailValue(details, "Subject");
      const visitDate = getDetailValue(details, "Visit date");

      if (type === "pdc" || type === "pdc-reminder") {
        const base = type === "pdc-reminder" ? "PDC reminder" : "PDC update";
        if (cheque && customer) return `${base} - ${cheque} - ${customer}`;
        if (cheque) return `${base} - ${cheque}`;
        if (invoice && customer) return `${base} - ${invoice} - ${customer}`;
        if (invoice) return `${base} - ${invoice}`;
        if (customer) return `${base} - ${customer}`;
        return base;
      }
      if (type === "visit-approval") {
        const base = "Visit approval";
        if (customer && visitDate) return `${base} - ${customer} - ${visitDate}`;
        if (customer) return `${base} - ${customer}`;
        if (visitDate) return `${base} - ${visitDate}`;
        return base;
      }
      if (type === "email") {
        const base = "Email";
        if (subject) return `${base} - ${subject}`;
        if (invoice) return `${base} - ${invoice}`;
        if (customer) return `${base} - ${customer}`;
        return base;
      }
      if (type === "todo") {
        const base = "Todo reminder";
        if (customer && invoice) return `${base} - ${customer} - ${invoice}`;
        if (customer) return `${base} - ${customer}`;
        if (invoice) return `${base} - ${invoice}`;
        return base;
      }
      if (type === "commitment-approved") {
        const base = "Commitment approved";
        if (invoice && customer) return `${base} - ${invoice} - ${customer}`;
        if (invoice) return `${base} - ${invoice}`;
        if (customer) return `${base} - ${customer}`;
        return base;
      }
      return String(note.title || "Update");
    };

    notificationList.innerHTML = list.map((note) => {
      const noteId = escapeAttr(note.id || "");
      const message = escapeHtml(note.message || "");
      const time = formatDateTime(note.sentAt || note.createdAt);
      const typeLabel = notificationManager ? notificationManager.getTypeLabel(note.type) : (typeLabelMap[note.type] || "Update");
      const typeClass = `tag-${String(note.type || "update").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
      const details = Array.isArray(note.details) ? note.details : [];
      const title = escapeHtml(notificationManager ? notificationManager.buildTitle({ ...note, details }) : buildNotificationTitle(note, details));
      const defaultRoute = notificationManager ? notificationManager.getDefaultRoute({ ...note, details }) : null;
      const invoiceValue = defaultRoute?.invoiceNo || getDetailValue(details, "Invoice");
      const detailHtml = details.map((detail) => `
        <div class="notificationDetailRow">
          <span>${escapeHtml(detail.label)}</span>
          <strong>${escapeHtml(detail.value)}</strong>
        </div>
      `).join("");
      const ctas = Array.isArray(note.ctas) ? note.ctas : [];
      const defaultCta = ctas[0] || {};
      const defaultAction = defaultRoute?.action || defaultCta.action
        || (note.type === "visit-approval" ? "link"
          : (note.type === "pdc" || note.type === "pdc-reminder") ? "open-pdc"
            : note.type === "todo" ? "open-todo"
              : note.type === "email" ? "open-email"
                : note.type === "commitment-approved" ? "open-invoice"
                  : "");
      const defaultHref = defaultRoute?.href || defaultCta.href
        || (note.type === "visit-approval" ? "pages/visitmoduleReview.html" : "");
      const defaultInv = defaultCta.invoiceNo || invoiceValue || "";
      const ctaHtml = ctas.map((cta) => `
        <button
          class="notificationCta"
          type="button"
          data-action="${escapeAttr(cta.action || "")}"
          data-href="${escapeAttr(cta.href || "")}"
          data-inv="${escapeAttr(cta.invoiceNo || "")}"
          data-note="${noteId}"
        >${escapeHtml(cta.label || "View")}</button>
      `).join("");
      return `
        <div class="notificationCard" data-note-id="${noteId}" data-action="${escapeAttr(defaultAction)}" data-href="${escapeAttr(defaultHref)}" data-inv="${escapeAttr(defaultInv)}">
          <div class="notificationCardHeader">
            <div>
              <div class="notificationTitle">${title}</div>
            </div>
            <div class="notificationMetaRight">
              <div class="notificationTag ${typeClass}">${escapeHtml(typeLabel)}</div>
              <div class="notificationTime">${escapeHtml(time)}</div>
            </div>
          </div>
          <div class="notificationCardBody">${message}</div>
          ${detailHtml ? `<div class="notificationDetails">${detailHtml}</div>` : ""}
          ${ctaHtml ? `<div class="notificationCtas">${ctaHtml}</div>` : ""}
        </div>
      `;
    }).join("");
  };

  const markVisibleNotificationsRead = () => {
    const manager = getNotificationCenterManager();
    if (manager) {
      manager.markVisibleRead({
        audience: role,
        normalizeDueScheduled: true
      });
      updateBellNotificationBadge();
      return;
    }
    const list = loadNotificationCenter();
    const visibleIds = new Set(getVisibleNotificationCenter().filter(shouldShowInBell).map(note => note.id));
    const updated = list.map((note) => {
      if (visibleIds.has(note.id)) {
        return { ...note, read: true };
      }
      return note;
    });
    saveNotificationCenter(updated);
    updateBellNotificationBadge();
  };

  const toggleNotificationPopup = (forceOpen) => {
    if (!notificationPopup) return;
    const shouldOpen = typeof forceOpen === "boolean"
      ? forceOpen
      : notificationPopup.classList.contains("hidden");
    if (shouldOpen) {
      renderBellNotifications();
      notificationPopup.classList.remove("hidden");
      markVisibleNotificationsRead();
    } else {
      notificationPopup.classList.add("hidden");
      notificationPopup.classList.remove("expanded");
      const expandBtn = document.getElementById("notificationExpandBtn");
      const icon = expandBtn ? expandBtn.querySelector("i") : null;
      if (icon) icon.className = "bi bi-arrows-angle-expand";
    }
  };

  const renderAll = () => {
    const records = getVisibleRecords();
    cachedRecords = records;
    ensureSelectedPdcId(records);
    renderCards(records);
    renderTable(records);
    renderActivityTrail(records);
    updateBellNotificationBadge();
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

  const showNotify = (title, message, options = {}) => {
    const iconMap = {
      success: "bi-check-circle-fill",
      warning: "bi-exclamation-circle-fill",
      error: "bi-exclamation-triangle-fill",
      info: "bi-info-circle-fill"
    };
    const style = String(options?.type || "success").trim().toLowerCase();
    const icon = iconMap[style] || iconMap.success;
    if (!notifyDock) return;
    const popup = document.createElement("div");
    popup.className = `notifyPopup ${style} animateUp`;
    popup.innerHTML = `
      <i class="bi ${icon}" aria-hidden="true"></i>
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
    showNotify("Status updated", message, { type: "success" });
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
  const bankSuggestions = [
    "State Bank of India",
    "HDFC Bank",
    "ICICI Bank",
    "Axis Bank",
    "Kotak Mahindra Bank",
    "Punjab National Bank",
    "Bank of Baroda",
    "Canara Bank",
    "Union Bank of India",
    "IDFC First Bank",
    "IndusInd Bank",
    "Yes Bank",
    "IDBI Bank",
    "Federal Bank",
    "RBL Bank",
    "HSBC",
    "Citibank",
    "Standard Chartered"
  ];

  const hideBankSuggestions = (box) => {
    if (!box) return;
    box.style.display = "none";
    box.innerHTML = "";
  };

  const renderBankSuggestions = (input, box, clearBtn) => {
    if (!box || !input) return;
    const trimmed = String(input.value || "").trim().toLowerCase();
    if (!trimmed) {
      hideBankSuggestions(box);
      if (clearBtn) clearBtn.classList.remove("visible");
      return;
    }
    const matches = bankSuggestions.filter((name) =>
      name.toLowerCase().includes(trimmed)
    );
    if (!matches.length) {
      box.innerHTML = `<div style="padding:6px 8px; font-size:12px; color:#94a3b8;">No matches found.</div>`;
      box.style.display = "block";
      if (clearBtn) clearBtn.classList.add("visible");
      return;
    }
    box.innerHTML = matches.map((name) => `
      <div class="suggestionItem" data-name="${escapeHtml(name)}">
        <span>${escapeHtml(name)}</span>
      </div>
    `).join("");
    box.style.display = "block";
    if (clearBtn) clearBtn.classList.add("visible");
  };

  const wireBankSuggestion = (input) => {
    if (!input || input.dataset.bankSuggestBound) return;
    const wrap = input.closest(".bankSuggest");
    const box = wrap ? wrap.querySelector(".suggestionBox") : null;
    const clearBtn = wrap ? wrap.querySelector(".clearBtn") : null;
    if (!box) return;
    input.dataset.bankSuggestBound = "true";

    const show = () => renderBankSuggestions(input, box, clearBtn);
    input.addEventListener("input", show);
    input.addEventListener("focus", show);

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        input.value = "";
        input.focus();
        hideBankSuggestions(box);
        clearBtn.classList.remove("visible");
      });
    }

    box.addEventListener("click", (event) => {
      const item = event.target.closest(".suggestionItem");
      if (!item) return;
      input.value = item.getAttribute("data-name") || "";
      hideBankSuggestions(box);
      if (clearBtn) clearBtn.classList.add("visible");
    });
  };

  document.addEventListener("click", (event) => {
    document.querySelectorAll(".bankSuggest").forEach((wrap) => {
      if (wrap.contains(event.target)) return;
      hideBankSuggestions(wrap.querySelector(".suggestionBox"));
    });
  });

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
          <div class="bankSuggest">
            <div class="inputWithClear">
              <input type="text" class="miscBank" placeholder="Bank name" autocomplete="off" />
              <button class="clearBtn" type="button" aria-label="Clear search">
                <i class="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            </div>
            <div class="suggestionBox"></div>
          </div>
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
    wireBankSuggestion(row.querySelector(".miscBank"));
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

  wireBankSuggestion(collectBank);

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
      const statusMeta = getPdcStatusMeta(nextStatus);
      const statusMessage = statusMeta?.appMessage || `PDC status updated to ${nextStatus}.`;
      const statusRecipients = statusMeta?.recipients || "PDC Mgmt";
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

      if (statusMeta?.remind) {
        schedulePdcReminders(target);
      }

      addStatusEmailDraftToCenter({
        record: target,
        status: nextStatus,
        noteId: `manual-${activePdcId || target.id}`,
        at: new Date().toISOString()
      });

      addNotification({
        pdcId: target.id,
        message: statusMessage,
        recipients: statusRecipients,
        status: nextStatus,
        remark: remarkText
      });
      showStatusSuccess(statusMessage);

      savePdcRecords(records);
      if (statusModal) statusModal.hide();
      renderAll();
    });
  }

  window.addEventListener("storage", (event) => {
    if (event.key === pdcStorageKey || event.key === pdcNotificationKey || event.key === notificationCenterKey) {
      renderAll();
      if (notificationPopup && !notificationPopup.classList.contains("hidden")) {
        renderBellNotifications();
      }
    }
  });

  if (notificationBellBtn) {
    notificationBellBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleNotificationPopup();
    });
  }

  const notificationExpandBtn = document.getElementById("notificationExpandBtn");
  if (notificationExpandBtn) {
    notificationExpandBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      if (!notificationPopup) return;
      const isExpanded = notificationPopup.classList.toggle("expanded");
      const icon = notificationExpandBtn.querySelector("i");
      if (icon) {
        icon.className = isExpanded ? "bi bi-arrows-angle-contract" : "bi bi-arrows-angle-expand";
      }
    });
  }

  document.addEventListener("click", (event) => {
    if (!notificationPopup || notificationPopup.classList.contains("hidden")) return;
    const wrap = document.querySelector(".notificationBellWrap");
    if (wrap && wrap.contains(event.target)) return;
    toggleNotificationPopup(false);
  });

  if (notificationPopup) {
    notificationPopup.addEventListener("click", (event) => {
      const runAction = (action, href, invNo) => {
        if (action === "open-pdc") {
          const target = role === "ops" ? "pages/PDCOps.html" : "pages/PDCagent.html";
          window.location.href = resolvePath(target);
          return true;
        }
        if (action === "open-invoice" || action === "open-email" || action === "open-todo") {
          window.location.href = resolvePath("index.html");
          return true;
        }
        if (href) {
          window.location.href = resolvePath(href);
          return true;
        }
        return false;
      };

      const cta = event.target.closest(".notificationCta");
      if (cta) {
        runAction(cta.getAttribute("data-action"), cta.getAttribute("data-href"), cta.getAttribute("data-inv"));
        return;
      }

      if (notificationPopup.classList.contains("expanded")) return;
      const card = event.target.closest(".notificationCard");
      if (!card) return;
      runAction(card.getAttribute("data-action"), card.getAttribute("data-href"), card.getAttribute("data-inv"));
    });
  }

  wireSideNavEvents();
  seedDummyPdcNotifications();
  syncLegacyNotificationsToCenter();
  renderAll();
})();
