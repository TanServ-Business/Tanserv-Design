// ===============================
// Tenant - Relationship branding (prototype wiring)
// ===============================
const tenantBrandMap = {
  apollo: { name: "Philips", badge: "PH" },
  bikanerwala: { name: "Philips", badge: "PH" },
  global_ar: { name: "Philips", badge: "PH" }
};

const urlParams = new URLSearchParams(window.location.search);
const isManagerView = urlParams.get("role") === "manager";
const todoStorageKey = "ineburaTodoTasks";
const remarksStorageKey = "ineburaRemarksByInvoice";
const managerNotificationsKey = "ineburaManagerNotifications";

// ===============================
// Dummy data: customers + invoices
// ===============================
const customersData = [
  {
    id: "c1",
    name: "Apollo Pharmachy Pvt. Ltd.",
    code: "CUST-001",
    city: "Mumbai",
    region: "West",
    contacts: [
      {
        firstName: "Ravi",
        lastName: "Sharma",
        email: "finance@apollopharmacy.com",
        phonePrimary: "+91 98xxxxxx21",
        phoneSecondary: "+91 98xxxxxx22",
        gender: "Male",
        department: "Finance",
        useEmailForCommunication: true
      },
      {
        firstName: "Anita",
        lastName: "Nair",
        email: "collections@apollopharmacy.com",
        phonePrimary: "+91 98xxxxxx23",
        phoneSecondary: "",
        gender: "Female",
        department: "Collections",
        useEmailForCommunication: false
      }
    ],
    billToAddress: "1st Floor, APOLLO PHARMACY Towers, Andheri East",
    shipToAddress: "Warehouse 3, MIDC Andheri East",
    pincode: "400069",
    state: "Maharashtra",
    creditPeriod: "30 Days",
    agentName: "Aditi Sharma",
    managerName: "Rohit Mehra",
    kamName: "Neha Kapoor",
    kasName: "Arjun Rao",
    businessUnit: "Diagnostics",
    industry: "Healthcare",
    product: "Imaging Systems",
    grnDate: "14 Nov 2025",
    grnNumber: "GRN-10291",
    documents: [
      { name: "Invoice", type: "invoice", updated: "12 Nov 2025" },
      { name: "Delivery Challan", type: "invoice", updated: "12 Nov 2025" },
      { name: "Payment Receipt", type: "invoice", updated: "13 Nov 2025" },
      { name: "Purchase Order", type: "client", updated: "01 Oct 2025" },
      { name: "Agreement", type: "client", updated: "15 Sep 2025" },
      { name: "Contract", type: "client", updated: "20 Sep 2025" }
    ],
    totalInvoiceAmount: 1565400,
    netDueAmount: 780000,
    mtdCollection: 310000,
    committedCollection: 20000,
    nonCommittedCollection: 290000,
    targetTotal: 496000,
    cnAdvPdcAmount: 45000,
    invoices: [
      {
        invoiceNo: "INV-10291",
        invoiceAmount: 124000,
        invoiceStatus: "Submitted and tracking",
        invoiceDate: "12 Oct 2025",
        amountForMonth: 124000,
        netDueAmount: 98000,
        dueDate: "05 Nov 2025",
        primaryStatus: "Follow-up",
        status: "Overdue",
        targetForMonth: 85000,
        unreadEmailCount: 3
      },
      {
        invoiceNo: "INV-10270",
        invoiceAmount: 86400,
        invoiceStatus: "Submitted and tracking",
        invoiceDate: "01 Nov 2025",
        amountForMonth: 50000,
        netDueAmount: 86400,
        dueDate: "16 Nov 2025",
        primaryStatus: "Reminder",
        status: "Pre-Due",
        targetForMonth: 50000,
        unreadEmailCount: 0
      },
      {
        invoiceNo: "INV-10211",
        invoiceAmount: 210000,
        invoiceStatus: "Not submitted and untouched",
        invoiceDate: "22 Sep 2025",
        amountForMonth: 0,
        netDueAmount: 210000,
        dueDate: "06 Oct 2025",
        primaryStatus: "Dispute",
        status: "Dispute",
        targetForMonth: 0,
        unreadEmailCount: 2
      },
      {
        invoiceNo: "INV-10308",
        invoiceAmount: 95000,
        invoiceStatus: "Externally Submitted and tracking",
        invoiceDate: "04 Nov 2025",
        amountForMonth: 95000,
        netDueAmount: 42000,
        dueDate: "12 Nov 2025",
        primaryStatus: "PTP",
        status: "PTP",
        targetForMonth: 42000,
        unreadEmailCount: 1
      },
      {
        invoiceNo: "INV-10188",
        invoiceAmount: 76000,
        invoiceStatus: "Submitted and tracking",
        invoiceDate: "10 Nov 2025",
        amountForMonth: 30000,
        netDueAmount: 76000,
        dueDate: "18 Nov 2025",
        primaryStatus: "Reminder",
        status: "Pre-Due",
        targetForMonth: 30000,
        unreadEmailCount: 0
      },
      {
        invoiceNo: "INV-10402",
        invoiceAmount: 152000,
        invoiceStatus: "Submitted and tracking",
        invoiceDate: "18 Nov 2025",
        amountForMonth: 152000,
        netDueAmount: 152000,
        dueDate: "02 Dec 2025",
        primaryStatus: "Reminder",
        status: "Pre-Due",
        targetForMonth: 70000,
        unreadEmailCount: 0
      },
      {
        invoiceNo: "INV-10418",
        invoiceAmount: 56000,
        invoiceStatus: "Not submitted and untouched",
        invoiceDate: "07 Oct 2025",
        amountForMonth: 0,
        netDueAmount: 56000,
        dueDate: "22 Oct 2025",
        primaryStatus: "Dispute",
        status: "Dispute",
        targetForMonth: 0,
        unreadEmailCount: 1
      },
      {
        invoiceNo: "INV-10433",
        invoiceAmount: 98000,
        invoiceStatus: "Submitted and tracking",
        invoiceDate: "25 Oct 2025",
        amountForMonth: 98000,
        netDueAmount: 45000,
        dueDate: "08 Nov 2025",
        primaryStatus: "Follow-up",
        status: "Overdue",
        targetForMonth: 45000,
        unreadEmailCount: 2
      },
      {
        invoiceNo: "INV-10457",
        invoiceAmount: 34000,
        invoiceStatus: "Submitted and tracking",
        invoiceDate: "28 Nov 2025",
        amountForMonth: 34000,
        netDueAmount: 34000,
        dueDate: "12 Dec 2025",
        primaryStatus: "PTP",
        status: "PTP",
        targetForMonth: 34000,
        unreadEmailCount: 0
      },
      {
        invoiceNo: "INV-10471",
        invoiceAmount: 215000,
        invoiceStatus: "Submitted and tracking",
        invoiceDate: "03 Nov 2025",
        amountForMonth: 215000,
        netDueAmount: 215000,
        dueDate: "17 Nov 2025",
        primaryStatus: "Escalation",
        status: "Overdue",
        targetForMonth: 120000,
        unreadEmailCount: 4
      },
      {
        invoiceNo: "INV-10489",
        invoiceAmount: 76000,
        invoiceStatus: "Submitted and closed",
        invoiceDate: "14 Oct 2025",
        amountForMonth: 76000,
        netDueAmount: 20000,
        dueDate: "28 Oct 2025",
        primaryStatus: "Reminder",
        status: "Pre-Due",
        targetForMonth: 20000,
        unreadEmailCount: 0
      }
    ]
  },
  {
    id: "c2",
    name: "BlueWave",
    code: "CUST-014",
    city: "Delhi",
    region: "North",
    contacts: [
      {
        firstName: "Asha",
        lastName: "Kapoor",
        email: "accounts@bluewave.in",
        phonePrimary: "+91 97xxxxxx54",
        phoneSecondary: "",
        gender: "Female",
        department: "Accounts",
        useEmailForCommunication: true
      },
      {
        firstName: "Nikhil",
        lastName: "Verma",
        email: "ops@bluewave.in",
        phonePrimary: "+91 97xxxxxx55",
        phoneSecondary: "+91 97xxxxxx56",
        gender: "Male",
        department: "Operations",
        useEmailForCommunication: false
      }
    ],
    billToAddress: "BlueWave House, Connaught Place",
    shipToAddress: "BlueWave DC, Okhla Phase 2",
    pincode: "110001",
    state: "Delhi",
    creditPeriod: "45 Days",
    agentName: "Karan Singh",
    managerName: "Isha Verma",
    kamName: "Riya Malhotra",
    kasName: "Vikram Iyer",
    businessUnit: "Consumer Health",
    industry: "Retail",
    product: "Cold Chain Units",
    grnDate: "20 Nov 2025",
    grnNumber: "GRN-22011",
    documents: [
      { name: "Invoice", type: "invoice", updated: "18 Nov 2025" },
      { name: "Delivery Challan", type: "invoice", updated: "18 Nov 2025" },
      { name: "Payment Receipt", type: "invoice", updated: "19 Nov 2025" },
      { name: "Purchase Order", type: "client", updated: "05 Oct 2025" },
      { name: "Agreement", type: "client", updated: "11 Sep 2025" },
      { name: "Contract", type: "client", updated: "22 Sep 2025" }
    ],
    totalInvoiceAmount: 802500,
    netDueAmount: 620000,
    mtdCollection: 110000,
    cnAdvPdcAmount: 28000,
    invoices: [
      {
        invoiceNo: "INV-22011",
        invoiceAmount: 54000,
        invoiceStatus: "Submitted and tracking",
        invoiceDate: "20 Oct 2025",
        amountForMonth: 54000,
        netDueAmount: 54000,
        dueDate: "08 Nov 2025",
        primaryStatus: "Follow-up",
        status: "Overdue",
        targetForMonth: 30000,
        unreadEmailCount: 0
      },
      {
        invoiceNo: "INV-22018",
        invoiceAmount: 88000,
        invoiceStatus: "Submitted and tracking",
        invoiceDate: "30 Oct 2025",
        amountForMonth: 50000,
        netDueAmount: 66000,
        dueDate: "14 Nov 2025",
        primaryStatus: "PTP",
        status: "PTP",
        targetForMonth: 66000,
        unreadEmailCount: 5
      },
      {
        invoiceNo: "INV-22027",
        invoiceAmount: 123000,
        invoiceStatus: "Submitted and tracking",
        invoiceDate: "05 Nov 2025",
        amountForMonth: 123000,
        netDueAmount: 123000,
        dueDate: "19 Nov 2025",
        primaryStatus: "Reminder",
        status: "Pre-Due",
        targetForMonth: 90000,
        unreadEmailCount: 0
      },
      {
        invoiceNo: "INV-22045",
        invoiceAmount: 67000,
        invoiceStatus: "Submitted and tracking",
        invoiceDate: "12 Nov 2025",
        amountForMonth: 67000,
        netDueAmount: 67000,
        dueDate: "27 Nov 2025",
        primaryStatus: "Follow-up",
        status: "Pre-Due",
        targetForMonth: 40000,
        unreadEmailCount: 1
      },
      {
        invoiceNo: "INV-22059",
        invoiceAmount: 94000,
        invoiceStatus: "Not submitted and untouched",
        invoiceDate: "18 Sep 2025",
        amountForMonth: 0,
        netDueAmount: 94000,
        dueDate: "03 Oct 2025",
        primaryStatus: "Dispute",
        status: "Dispute",
        targetForMonth: 0,
        unreadEmailCount: 0
      },
      {
        invoiceNo: "INV-22063",
        invoiceAmount: 120000,
        invoiceStatus: "Submitted and tracking",
        invoiceDate: "22 Oct 2025",
        amountForMonth: 120000,
        netDueAmount: 120000,
        dueDate: "06 Nov 2025",
        primaryStatus: "Reminder",
        status: "Overdue",
        targetForMonth: 60000,
        unreadEmailCount: 3
      },
      {
        invoiceNo: "INV-22075",
        invoiceAmount: 51000,
        invoiceStatus: "Submitted and tracking",
        invoiceDate: "02 Nov 2025",
        amountForMonth: 51000,
        netDueAmount: 31000,
        dueDate: "17 Nov 2025",
        primaryStatus: "PTP",
        status: "PTP",
        targetForMonth: 31000,
        unreadEmailCount: 0
      },
      {
        invoiceNo: "INV-22088",
        invoiceAmount: 86000,
        invoiceStatus: "Submitted and closed",
        invoiceDate: "06 Oct 2025",
        amountForMonth: 86000,
        netDueAmount: 86000,
        dueDate: "21 Oct 2025",
        primaryStatus: "Follow-up",
        status: "Overdue",
        targetForMonth: 50000,
        unreadEmailCount: 2
      }
    ]
  },
  {
    id: "c3",
    name: "Sunrise Pvt",
    code: "CUST-033",
    city: "Bengaluru",
    region: "South",
    contacts: [
      {
        firstName: "Sujata",
        lastName: "Rao",
        email: "finance@sunrisepvt.com",
        phonePrimary: "+91 96xxxxxx87",
        phoneSecondary: "",
        gender: "Female",
        department: "Finance",
        useEmailForCommunication: true
      },
      {
        firstName: "Prakash",
        lastName: "Das",
        email: "collections@sunrisepvt.com",
        phonePrimary: "+91 96xxxxxx88",
        phoneSecondary: "+91 96xxxxxx89",
        gender: "Male",
        department: "Collections",
        useEmailForCommunication: false
      }
    ],
    billToAddress: "Sunrise Plaza, MG Road",
    shipToAddress: "Sunrise Warehouse, Whitefield",
    pincode: "560001",
    state: "Karnataka",
    creditPeriod: "60 Days",
    agentName: "Sahil Joshi",
    managerName: "Meera Nair",
    kamName: "Anil Thomas",
    kasName: "Dev Patel",
    businessUnit: "Industrial",
    industry: "Manufacturing",
    product: "Process Control",
    grnDate: "18 Nov 2025",
    grnNumber: "GRN-77102",
    documents: [
      { name: "Invoice", type: "invoice", updated: "10 Nov 2025" },
      { name: "Delivery Challan", type: "invoice", updated: "10 Nov 2025" },
      { name: "Payment Receipt", type: "invoice", updated: "11 Nov 2025" },
      { name: "Purchase Order", type: "client", updated: "28 Sep 2025" },
      { name: "Agreement", type: "client", updated: "14 Sep 2025" },
      { name: "Contract", type: "client", updated: "20 Sep 2025" }
    ],
    totalInvoiceAmount: 2412000,
    netDueAmount: 1840000,
    mtdCollection: 60000,
    cnAdvPdcAmount: 52000,
    invoices: [
      {
        invoiceNo: "INV-77102",
        invoiceAmount: 310000,
        invoiceStatus: "Submitted and tracking",
        invoiceDate: "01 Sep 2025",
        amountForMonth: 0,
        netDueAmount: 310000,
        dueDate: "19 Sep 2025",
        primaryStatus: "Escalation",
        status: "Overdue",
        targetForMonth: 120000,
        unreadEmailCount: 1
      },
      {
        invoiceNo: "INV-77118",
        invoiceAmount: 205000,
        invoiceStatus: "Not submitted and untouched",
        invoiceDate: "10 Sep 2025",
        amountForMonth: 0,
        netDueAmount: 205000,
        dueDate: "11 Oct 2025",
        primaryStatus: "Dispute",
        status: "Dispute",
        targetForMonth: 0,
        unreadEmailCount: 0
      },
      {
        invoiceNo: "INV-77133",
        invoiceAmount: 98000,
        invoiceStatus: "Submitted and tracking",
        invoiceDate: "15 Oct 2025",
        amountForMonth: 98000,
        netDueAmount: 98000,
        dueDate: "02 Nov 2025",
        primaryStatus: "Follow-up",
        status: "Overdue",
        targetForMonth: 50000,
        unreadEmailCount: 0
      },
      {
        invoiceNo: "INV-77150",
        invoiceAmount: 144000,
        invoiceStatus: "Submitted and tracking",
        invoiceDate: "20 Oct 2025",
        amountForMonth: 144000,
        netDueAmount: 144000,
        dueDate: "04 Nov 2025",
        primaryStatus: "Reminder",
        status: "Pre-Due",
        targetForMonth: 70000,
        unreadEmailCount: 0
      },
      {
        invoiceNo: "INV-77166",
        invoiceAmount: 67000,
        invoiceStatus: "Submitted and tracking",
        invoiceDate: "28 Nov 2025",
        amountForMonth: 67000,
        netDueAmount: 67000,
        dueDate: "12 Dec 2025",
        primaryStatus: "PTP",
        status: "PTP",
        targetForMonth: 67000,
        unreadEmailCount: 0
      },
      {
        invoiceNo: "INV-77179",
        invoiceAmount: 198000,
        invoiceStatus: "Submitted and tracking",
        invoiceDate: "11 Sep 2025",
        amountForMonth: 0,
        netDueAmount: 198000,
        dueDate: "26 Sep 2025",
        primaryStatus: "Escalation",
        status: "Overdue",
        targetForMonth: 90000,
        unreadEmailCount: 2
      },
      {
        invoiceNo: "INV-77195",
        invoiceAmount: 52000,
        invoiceStatus: "Not submitted and untouched",
        invoiceDate: "05 Oct 2025",
        amountForMonth: 0,
        netDueAmount: 52000,
        dueDate: "20 Oct 2025",
        primaryStatus: "Dispute",
        status: "Dispute",
        targetForMonth: 0,
        unreadEmailCount: 0
      },
      {
        invoiceNo: "INV-77208",
        invoiceAmount: 87000,
        invoiceStatus: "Submitted and closed",
        invoiceDate: "14 Nov 2025",
        amountForMonth: 87000,
        netDueAmount: 87000,
        dueDate: "29 Nov 2025",
        primaryStatus: "Follow-up",
        status: "Pre-Due",
        targetForMonth: 50000,
        unreadEmailCount: 1
      }
    ]
  }
];

customersData.forEach(customer => {
  const defaultCreditPeriod = customer.creditPeriod;
  (customer.invoices || []).forEach(invoice => {
    if (!invoice.creditPeriod) invoice.creditPeriod = defaultCreditPeriod;
  });
});

const cnAdvPdcFallbackAdjustments = [
  {
    adjustmentId: "CN-4582",
    adjustmentType: "Credit Note",
    originalAmount: 45000,
    remainingAmount: 15000,
    createdDate: "05 Sep 2025",
    lastUsedDate: "20 Oct 2025"
  },
  {
    adjustmentId: "ADV-3101",
    adjustmentType: "Advance",
    originalAmount: 30000,
    remainingAmount: 12000,
    createdDate: "18 Aug 2025",
    lastUsedDate: "02 Nov 2025"
  },
  {
    adjustmentId: "PDC-7710",
    adjustmentType: "PDC",
    originalAmount: 25000,
    remainingAmount: 25000,
    createdDate: "22 Oct 2025",
    lastUsedDate: "-"
  }
];

const cnAdvPdcAdjustmentsByCustomer = {
  c1: [
    {
      adjustmentId: "CN-1029",
      adjustmentType: "Credit Note",
      originalAmount: 60000,
      remainingAmount: 20000,
      createdDate: "14 Aug 2025",
      lastUsedDate: "12 Nov 2025"
    },
    {
      adjustmentId: "ADV-3381",
      adjustmentType: "Advance",
      originalAmount: 40000,
      remainingAmount: 15000,
      createdDate: "01 Sep 2025",
      lastUsedDate: "28 Oct 2025"
    },
    {
      adjustmentId: "PDC-2205",
      adjustmentType: "PDC",
      originalAmount: 35000,
      remainingAmount: 35000,
      createdDate: "09 Nov 2025",
      lastUsedDate: "-"
    }
  ],
  c2: [
    {
      adjustmentId: "CN-7711",
      adjustmentType: "Credit Note",
      originalAmount: 25000,
      remainingAmount: 8000,
      createdDate: "20 Jul 2025",
      lastUsedDate: "30 Sep 2025"
    },
    {
      adjustmentId: "ADV-4090",
      adjustmentType: "Advance",
      originalAmount: 18000,
      remainingAmount: 12000,
      createdDate: "04 Sep 2025",
      lastUsedDate: "18 Oct 2025"
    }
  ]
};

// ===============================
// Helpers
// ===============================
function formatINR(num) {
  try {
    return new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 }).format(Number(num || 0));
  } catch (e) {
    return String(num);
  }
}

function statusPillClass(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("overdue") || s.includes("post")) return "overdue";
  if (s.includes("pre")) return "predue";
  if (s.includes("dispute")) return "dispute";
  if (s.includes("ptp")) return "ptp";
  if (s.includes("collect")) return "collected";
  return "predue";
}

function sumInvoiceTargets(invoices) {
  return (invoices || []).reduce((acc, inv) => acc + Number(inv.targetForMonth || 0), 0);
}

function getCustomerNetDue(customer) {
  if (!customer) return 0;
  const netDueOverride = Number(customer.netDueAmount);
  if (Number.isFinite(netDueOverride)) return netDueOverride;
  const amountForMonth = (customer.invoices || [])
    .reduce((sum, inv) => sum + Number(inv.amountForMonth || 0), 0);
  const mtdCollection = Number(customer.mtdCollection || 0);
  const cnAdvPdc = Number(customer.cnAdvPdcAmount || 0);
  return amountForMonth - mtdCollection - cnAdvPdc;
}

// ===============================
// Target summary modal
// ===============================
function updateTargetSummaryModal(customer) {
  if (!customer) return;
  const targetOverride = Number(customer.targetTotal);
  const committedTarget = Number.isFinite(targetOverride)
    ? targetOverride
    : sumInvoiceTargets(customer.invoices || []);

  const committedInput = Number(customer.committedCollection);
  const nonCommittedInput = Number(customer.nonCommittedCollection);
  const hasCommittedInput = Number.isFinite(committedInput);
  const hasNonCommittedInput = Number.isFinite(nonCommittedInput);

  let committedCollected = hasCommittedInput ? committedInput : 0;
  let nonCommittedCollected = hasNonCommittedInput ? nonCommittedInput : 0;
  const mtdFallback = Number(customer.mtdCollection || 0);

  if (!hasCommittedInput || !hasNonCommittedInput) {
    const mtdCollection = mtdFallback;
    if (!hasCommittedInput) {
      committedCollected = Math.min(committedTarget, mtdCollection);
    }
    if (!hasNonCommittedInput) {
      nonCommittedCollected = Math.max(mtdCollection - committedTarget, 0);
    }
  }

  const totalCollected = committedCollected + nonCommittedCollected;
  const mtdCollection = (hasCommittedInput || hasNonCommittedInput)
    ? totalCollected
    : mtdFallback;
  const pendingCollection = Math.max(committedTarget - totalCollected, 0);
  const totalForChart = totalCollected + pendingCollection;
  const collectedPct = totalForChart > 0
    ? Math.round((totalCollected / totalForChart) * 100)
    : 0;
  const committedAngle = totalForChart > 0
    ? Math.round((committedCollected / totalForChart) * 360)
    : 0;
  const nonCommittedAngle = totalForChart > 0
    ? Math.round(((committedCollected + nonCommittedCollected) / totalForChart) * 360)
    : 0;

  const committedTargetEl = document.getElementById("targetSummaryCommitted");
  const mtdEl = document.getElementById("targetSummaryMtd");
  const committedCollectedEl = document.getElementById("targetSummaryCommittedCollected");
  const nonCommittedCollectedEl = document.getElementById("targetSummaryNonCommittedCollected");
  const pendingEl = document.getElementById("targetSummaryPendingCollected");
  const pctEl = document.getElementById("targetSplitPct");
  const labelEl = document.getElementById("targetSplitLabel");
  const chartEl = document.getElementById("targetSplitChart");

  if (committedTargetEl) committedTargetEl.textContent = `Rs.${formatINR(committedTarget)}`;
  if (mtdEl) mtdEl.textContent = `Rs.${formatINR(mtdCollection)}`;
  if (committedCollectedEl) committedCollectedEl.textContent = `Rs.${formatINR(committedCollected)}`;
  if (nonCommittedCollectedEl) nonCommittedCollectedEl.textContent = `Rs.${formatINR(nonCommittedCollected)}`;
  if (pendingEl) pendingEl.textContent = `Rs.${formatINR(pendingCollection)}`;
  if (pctEl) pctEl.textContent = `${collectedPct}%`;
  if (labelEl) labelEl.textContent = totalForChart > 0 ? "Collected share" : "No collection data";

  if (chartEl) {
    chartEl.style.setProperty("--target-commit-angle", `${committedAngle}deg`);
    chartEl.style.setProperty("--target-noncommit-angle", `${nonCommittedAngle}deg`);
    chartEl.classList.toggle("is-empty", totalForChart === 0);
    const ariaLabel = totalForChart > 0
      ? `Collected amount split: committed Rs.${formatINR(committedCollected)}, non committed Rs.${formatINR(nonCommittedCollected)}, pending Rs.${formatINR(pendingCollection)}`
      : "No collection data available for the selected customer";
    chartEl.setAttribute("aria-label", ariaLabel);
  }
}

function openTargetSummaryModal() {
  const customer = customersData.find(c => c.id === selectedCustomerId);
  if (!customer) return;
  updateTargetSummaryModal(customer);

  const modalEl = document.getElementById("targetSummaryModal");
  if (modalEl && typeof bootstrap !== "undefined") {
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
}

function loadTodoTasksFromStorage() {
  try {
    const raw = localStorage.getItem(todoStorageKey);
    if (!raw) return;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return;
    todoTasks = parsed.map((task) => ({
      ...task,
      completed: Boolean(task.completed),
      completedAt: task.completedAt || ""
    }));
    todoTaskCounter = parsed.reduce((maxId, task) => {
      const idNum = Number(String(task.id || "").replace("task-", ""));
      return Number.isFinite(idNum) ? Math.max(maxId, idNum) : maxId;
    }, 0);
  } catch (err) {
    console.warn("Unable to load todo tasks", err);
  }
}

function saveTodoTasksToStorage() {
  try {
    localStorage.setItem(todoStorageKey, JSON.stringify(todoTasks));
  } catch (err) {
    console.warn("Unable to save todo tasks", err);
  }
}

function loadRemarksMap() {
  try {
    const raw = localStorage.getItem(remarksStorageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    console.warn("Unable to load remarks", err);
    return {};
  }
}

function saveRemarksMap(map) {
  try {
    localStorage.setItem(remarksStorageKey, JSON.stringify(map));
  } catch (err) {
    console.warn("Unable to save remarks", err);
  }
}

function addStoredRemark(invoiceNo, remark) {
  if (!invoiceNo) return;
  const map = loadRemarksMap();
  if (!Array.isArray(map[invoiceNo])) map[invoiceNo] = [];
  map[invoiceNo].unshift(remark);
  saveRemarksMap(map);
}

function renderStoredRemarks(invoiceNo) {
  const list = document.querySelector(".remarksList");
  if (!list) return;
  if (!invoiceNo) {
    list.innerHTML = `<div class="remarkItem"><div class="remarkText">No remarks yet.</div></div>`;
    return;
  }

  const map = loadRemarksMap();
  const remarks = Array.isArray(map[invoiceNo]) ? map[invoiceNo] : [];

  if (remarks.length === 0) {
    list.innerHTML = `<div class="remarkItem"><div class="remarkText">No remarks yet.</div></div>`;
    return;
  }

  list.innerHTML = remarks.map((item) => {
    const role = item.authorRole === "manager" ? "remark-manager" : "remark-client";
    return `
      <div class="remarkItem ${role}">
        <div class="remarkText">${safeText(item.text)}</div>
        <div class="remarkMeta">${safeText(item.authorLabel)} - ${safeText(item.timestamp)}</div>
      </div>
    `;
  }).join("");
}

function loadManagerNotifications() {
  try {
    const raw = localStorage.getItem(managerNotificationsKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Unable to load notifications", err);
    return [];
  }
}

function saveManagerNotifications(list) {
  try {
    localStorage.setItem(managerNotificationsKey, JSON.stringify(list));
  } catch (err) {
    console.warn("Unable to save notifications", err);
  }
}

function addManagerNotification(notification) {
  const list = loadManagerNotifications();
  list.unshift(notification);
  saveManagerNotifications(list);
}

function updateManagerNotificationBadge() {
  if (!isManagerView) return;
  const countEl = document.getElementById("notificationBellCount");
  if (!countEl) return;
  const unreadCount = loadManagerNotifications().filter(item => !item.read).length;
  countEl.textContent = String(unreadCount);
  countEl.classList.toggle("hidden", unreadCount === 0);
}

function markManagerNotificationsRead() {
  const list = loadManagerNotifications();
  const updated = list.map((item) => ({ ...item, read: true }));
  saveManagerNotifications(updated);
  updateManagerNotificationBadge();
}

function formatNotificationTime(timestamp) {
  if (!timestamp) return "-";
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function renderNotificationPopup() {
  const listEl = document.getElementById("notificationPopupList");
  if (!listEl) return;
  const notifications = loadManagerNotifications();
  if (notifications.length === 0) {
    listEl.innerHTML = `<div class="notificationEmpty">No notifications yet.</div>`;
    return;
  }

  listEl.innerHTML = notifications.map((note) => {
    const message = safeText(note.message || "Notification");
    const time = formatNotificationTime(note.createdAt);
    const inv = note.invoiceNo ? `Invoice ${safeText(note.invoiceNo)}` : "-";
    return `
      <div class="notificationItem" data-inv="${safeText(note.invoiceNo || "")}">
        <div>${message}</div>
        <div class="notificationMeta">
          <span>${inv}</span>
          <span>${time}</span>
        </div>
      </div>
    `;
  }).join("");
}

function toggleNotificationPopup(forceOpen) {
  const popup = document.getElementById("notificationPopup");
  if (!popup) return;
  const shouldOpen = typeof forceOpen === "boolean"
    ? forceOpen
    : popup.classList.contains("hidden");
  if (shouldOpen) {
    renderNotificationPopup();
    popup.classList.remove("hidden");
    if (isManagerView) markManagerNotificationsRead();
  } else {
    popup.classList.add("hidden");
  }
}

// ===============================
// Todo: task module
// ===============================
let todoTasks = [];
let todoTaskCounter = 0;
let todoShowCompleted = false;

function renderTodoInvoiceOptions() {
  const select = document.getElementById("todoInvoiceSelect");
  if (!select) return;
  const customer = customersData.find(c => c.id === selectedCustomerId);
  select.innerHTML = `<option value="">No invoice</option>`;
  (customer?.invoices || []).forEach((inv) => {
    const option = document.createElement("option");
    option.value = inv.invoiceNo;
    option.textContent = `${inv.invoiceNo} - Rs.${formatINR(inv.netDueAmount || 0)}`;
    select.appendChild(option);
  });
}

function buildInvoiceMeta(invoice) {
  if (!invoice) return null;
  return {
    invoiceNo: invoice.invoiceNo,
    invoiceAmount: invoice.invoiceAmount,
    netDueAmount: invoice.netDueAmount,
    dueDate: invoice.dueDate,
    status: invoice.status
  };
}

function addTodoTask({ text, dueDate, dueTime, customer, invoice, source }) {
  if (!text) return;
  todoTaskCounter += 1;
  todoTasks.unshift({
    id: `task-${todoTaskCounter}`,
    text,
    dueDate: dueDate || "",
    dueTime: dueTime || "",
    customerName: customer?.name || "-",
    customerCode: customer?.code || "-",
    invoice: buildInvoiceMeta(invoice),
    source: source || "manual",
    createdAt: new Date().toISOString(),
    completed: false,
    completedAt: ""
  });
  saveTodoTasksToStorage();
  renderTodoList();
  updateTodoBadge();
}

function formatTodoDue(task) {
  if (!task.dueDate && !task.dueTime) return "No due time";
  const datePart = task.dueDate || "-";
  const timePart = task.dueTime || "";
  return timePart ? `${datePart} ${timePart}` : datePart;
}

function getVisibleTodoTasks() {
  return todoTasks;
}

function getCompletedTodoCount() {
  return getVisibleTodoTasks().filter(task => task.completed).length;
}

function renderTodoList() {
  const list = document.getElementById("todoList");
  if (!list) return;
  const visibleTasks = getVisibleTodoTasks();
  if (visibleTasks.length === 0) {
    list.innerHTML = `<div class="todoEmpty">No tasks yet.</div>`;
    return;
  }

  const buildTaskRow = (task) => {
    const dueLine = `Due ${formatTodoDue(task)}`;
    const customerLine = `Customer ${safeText(task.customerName)} (${safeText(task.customerCode)})`;
    let invoiceLine = "Invoice: -";
    if (task.invoice) {
      const invoiceNo = safeText(task.invoice.invoiceNo);
      invoiceLine = `
        <button class="todoInvoiceLink" type="button" data-action="open-invoice" data-inv="${invoiceNo}">
          <i class="bi bi-link-45deg" aria-hidden="true"></i>
          ${invoiceNo}
        </button>
        | Net due Rs.${formatINR(task.invoice.netDueAmount || 0)} | Due ${safeText(task.invoice.dueDate)}
      `;
    }
    const isComplete = Boolean(task.completed);
    const checkedAttr = isComplete ? "checked" : "";
    const itemClass = isComplete ? "todoItem is-complete" : "todoItem";
    const label = isComplete ? "Mark task pending" : "Mark task done";
    return `
      <div class="${itemClass}" data-task-id="${task.id}">
        <input class="todoCheck" type="checkbox" data-action="complete" aria-label="${label}" ${checkedAttr} />
        <div>
          <div class="todoTitle">${safeText(task.text)}</div>
          <div class="todoMeta">${dueLine}</div>
          <div class="todoMeta">${customerLine}</div>
          <div class="todoMeta">${invoiceLine}</div>
        </div>
        <div class="todoActions"></div>
      </div>
    `;
  };

  const pendingTasks = visibleTasks.filter(task => !task.completed);
  const completedTasks = visibleTasks.filter(task => task.completed);

  const renderSection = (title, tasks, emptyText) => {
    const body = tasks.length
      ? tasks.map(buildTaskRow).join("")
      : `<div class="todoEmpty">${emptyText}</div>`;
    return `
      <div class="todoSection">
        <div class="todoSectionHeader">${title}</div>
        <div class="todoSectionList">${body}</div>
      </div>
    `;
  };

  list.innerHTML = `
    ${renderSection("Pending", pendingTasks, "No pending tasks.")}
    ${todoShowCompleted ? renderSection("Completed", completedTasks, "No completed tasks yet.") : ""}
  `;
}

function updateTodoCompletedToggle() {
  const toggle = document.getElementById("todoCompletedToggle");
  if (!toggle) return;
  const count = getCompletedTodoCount();
  toggle.textContent = count === 1 ? "1 completed task" : `${count} completed tasks`;
  toggle.classList.toggle("is-open", todoShowCompleted);
}

function updateTodoBadge() {
  const count = getVisibleTodoTasks().filter(task => !task.completed).length;
  const headerCount = document.getElementById("todoHeaderCount");
  const tabCount = document.getElementById("todoTabCount");
  const panelCount = document.getElementById("todoCountPill");
  if (headerCount) headerCount.textContent = String(count);
  if (tabCount) tabCount.textContent = String(count);
  if (panelCount) panelCount.textContent = String(count);
  updateTodoCompletedToggle();
}

function getInvoiceSubmissionStatus(invoice) {
  const raw = String(invoice?.invoiceStatus || "").toLowerCase();
  if (raw.includes("external")) return { label: "Externally Submitted", className: "is-external" };
  if (raw.includes("not submitted") || raw.includes("unsubmitted") || raw.includes("not submitted")) {
    return { label: "Not Submitted", className: "is-not-submitted" };
  }
  if (raw.includes("submitted")) return { label: "Submitted", className: "is-submitted" };
  return { label: "-", className: "is-neutral" };
}

function getNotificationDetails(customer) {
  const primaryContact = (customer?.contacts || []).find(c => c.useEmailForCommunication) || customer?.contacts?.[0];
  const secondaryContact = (customer?.contacts || []).find(c => c !== primaryContact && c.email);
  const invNo = currentInvoiceNoForDocs || customer?.invoices?.[0]?.invoiceNo || "-";
  const clientName = customer?.name || "Customer";
  const sendTo = primaryContact?.email
    ? `${formatContactName(primaryContact)} <${primaryContact.email}>`
    : "-";
  const cc = secondaryContact?.email
    ? `${formatContactName(secondaryContact)} <${secondaryContact.email}>`
    : "-";
  const subject = `PTP missed for ${clientName}`;
  const body = `Hello ${clientName},\n\nOur records show the Promise to Pay for invoice ${invNo} was missed. Please confirm the revised payment date or share an update.\n\nRegards,\nCollections Team`;
  const attachments = invNo === "-" ? ["PTP_Reminder.pdf"] : [`Invoice_${invNo}.pdf`, "PTP_Reminder.pdf"];

  return {
    sendTo,
    cc,
    from: "ops@inebura.com",
    subject,
    body,
    attachments
  };
}

function getCnAdvPdcAdjustments(customer) {
  if (!customer) return cnAdvPdcFallbackAdjustments;
  const list = cnAdvPdcAdjustmentsByCustomer[customer.id];
  if (Array.isArray(list) && list.length > 0) return list;
  return cnAdvPdcFallbackAdjustments;
}

const cnAdvPdcSortConfig = {
  adjustmentId: "text",
  adjustmentType: "text",
  originalAmount: "number",
  remainingAmount: "number",
  createdDate: "date",
  lastUsedDate: "date"
};

function sortCnAdvPdcRows(rows, key, dir) {
  const type = cnAdvPdcSortConfig[key] || "text";
  const factor = dir === "asc" ? 1 : -1;
  return [...(rows || [])].sort((a, b) => {
    if (type === "number") {
      const av = Number(a[key] || 0);
      const bv = Number(b[key] || 0);
      return (av - bv) * factor;
    }
    if (type === "date") {
      const av = Date.parse(a[key]) || 0;
      const bv = Date.parse(b[key]) || 0;
      return (av - bv) * factor;
    }
    const av = String(a[key] || "").toLowerCase();
    const bv = String(b[key] || "").toLowerCase();
    return av.localeCompare(bv) * factor;
  });
}

function renderCnAdvPdcTable(rows) {
  const body = document.getElementById("cnAdvPdcTableBody");
  if (!body) return;

  if (!rows || rows.length === 0) {
    body.innerHTML = `<tr><td colspan="6" class="text-muted">No adjustments available</td></tr>`;
    return;
  }

  const formatAmount = (value) => {
    if (value === "-" || value === undefined || value === null) return "-";
    return `Rs.${formatINR(value)}`;
  };

  body.innerHTML = rows.map(row => `
    <tr>
      <td>${safeText(row.adjustmentId)}</td>
      <td>${safeText(row.adjustmentType)}</td>
      <td>${formatAmount(row.originalAmount)}</td>
      <td>${formatAmount(row.remainingAmount)}</td>
      <td>${safeText(row.createdDate)}</td>
      <td>${safeText(row.lastUsedDate)}</td>
    </tr>
  `).join("");
}

function buildStatusUpdateEntry(data) {
  const details = document.createElement("details");
  details.className = "activityEvent event-invoice-update";

  const subStatusLabel = safeText(data.subStatus);
  const summaryMeta = `Sub Status: ${subStatusLabel}`;

  const detailItems = [
    { label: "Activity type", value: safeText(data.activityType) },
    { label: "Broad Status", value: safeText(data.broadStatus) },
    { label: "Primary status", value: safeText(data.primaryStatus) },
    { label: "Sub Status", value: subStatusLabel }
  ];

  if (data.invoices && data.invoices.length > 0) {
    detailItems.unshift({ label: "Invoices", value: data.invoices.join(", ") });
  }

  if (data.subStatus === "Collection") {
    detailItems.push({ label: "Instrument mode", value: safeText(data.instrumentMode) });
    if (data.instrumentMode === "Miscellenious") {
      const detailsPayload = encodeURIComponent(JSON.stringify({
        rows: Array.isArray(data.miscRows) ? data.miscRows : [],
        totalCollected: data.totalCollected || 0
      }));
      detailItems.push({
        label: "Collection details",
        value: `
          <button class="miscReadMore" type="button" data-details="${detailsPayload}">Read more</button>
        `
      });
    } else {
      detailItems.push({ label: "Instrument ref no", value: safeText(data.instrumentRef) });
      detailItems.push({ label: "Bank", value: safeText(data.bank) });
      detailItems.push({ label: "Transfer date", value: safeText(data.transferDate) });
      detailItems.push({ label: "Amount", value: safeText(data.amount) });
      detailItems.push({ label: "TDS", value: safeText(data.tds) });
      detailItems.push({ label: "LD", value: safeText(data.ld) });
    }
  }

  detailItems.push({ label: "Remarks", value: safeText(data.remarks) });

  details.innerHTML = `
    <summary>
      <div>
        <div class="eventTitle">Invoice update</div>
        <div class="eventMeta">${summaryMeta}</div>
      </div>
      <span class="eventBadge">Status update</span>
    </summary>
    <div class="eventBody">
      ${detailItems.map(item => `
        <div class="activityDetailLine">
          <span class="activityLabel">${item.label}</span>
          <span class="activityValue">${item.value}</span>
        </div>
      `).join("")}
    </div>
  `;

  return details;
}

function openMiscDetailsModal(payload) {
  if (!payload) return;
  let parsed;
  try {
    parsed = JSON.parse(decodeURIComponent(payload));
  } catch (err) {
    return;
  }

  const modalEl = document.getElementById("miscCollectionModal");
  const bodyEl = document.getElementById("miscCollectionBody");
  if (!modalEl || !bodyEl || !parsed) return;

  const rows = Array.isArray(parsed.rows) ? parsed.rows : [];
  const totalCollected = parsed.totalCollected || 0;

  const formatAmount = (value) => {
    if (value === "" || value === null || value === undefined) return "-";
    return `Rs.${formatINR(value)}`;
  };

  bodyEl.innerHTML = `
    <div class="miscDetails">
      ${rows.map(row => {
        const adjustmentLabel = row.adjustmentId ? ` (${safeText(row.adjustmentId)})` : "";
        return `
          <div class="miscDetailsModalItem">
            <div class="miscDetailsModalTitle">${safeText(row.mode)}${adjustmentLabel}</div>
            <div class="miscDetailRow">
              <strong>Instrument</strong>
              <span>${safeText(row.instrumentRef)} | ${safeText(row.bank)} | ${safeText(row.transferDate)}</span>
            </div>
            <div class="miscDetailRow">
              <strong>Amounts</strong>
              <span>Amt ${formatAmount(row.amount)} | TDS ${formatAmount(row.tds)} | LD ${formatAmount(row.ld)}</span>
            </div>
          </div>
        `;
      }).join("")}
      <div class="miscDetailRow">
        <strong>Total collected</strong>
        <span>Rs.${formatINR(totalCollected)}</span>
      </div>
    </div>
  `;

  if (typeof bootstrap !== "undefined") {
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
}

function uniqSorted(values) {
  return Array.from(new Set(values.filter(v => String(v || "").trim() !== "")))
    .sort((a, b) => String(a).localeCompare(String(b)));
}

function safeText(value) {
  if (value === undefined || value === null || value === "") return "-";
  return String(value);
}

function formatContactName(contact) {
  if (!contact) return "Unnamed Contact";
  const first = String(contact.firstName || "").trim();
  const last = String(contact.lastName || "").trim();
  const fullName = [first, last].filter(Boolean).join(" ");
  return fullName || "Unnamed Contact";
}

function setDetailValue(id, value) {
  const el = document.getElementById(id);
  if (!el) return;
  el.textContent = safeText(value);
}

function getInvoicePoNumber(invoice) {
  if (!invoice) return "-";
  return invoice.poNumber ? String(invoice.poNumber) : `PO-${invoice.invoiceNo}`;
}

function getInvoiceSalesOrder(invoice) {
  if (!invoice) return "-";
  return invoice.salesOrder ? String(invoice.salesOrder) : `SO-${invoice.invoiceNo}`;
}

function getBaseFilteredInvoices() {
  const unreadChk = document.getElementById("filterUnreadEmail");

  filterState.unreadOnly = unreadChk ? unreadChk.checked : false;

  const fInvStatus = filterState.invoiceStatus;
  const fPrimary = filterState.primaryStatus;
  const fStatus = filterState.status;
  const fUnreadOnly = filterState.unreadOnly;

  return (currentInvoicesAll || []).filter(inv => {
    if (fInvStatus !== "__ALL__" && String(inv.invoiceStatus) !== fInvStatus) return false;
    if (fPrimary !== "__ALL__" && String(inv.primaryStatus) !== fPrimary) return false;
    if (fStatus !== "__ALL__" && String(inv.status) !== fStatus) return false;
    if (fUnreadOnly && Number(inv.unreadEmailCount || 0) <= 0) return false;
    return true;
  });
}

function setDispositionVisible(show) {
  const panel = document.getElementById("dispositionPanel");
  if (!panel) return;
  panel.classList.toggle("hidden", !show);

  if (show) {
    const emailPanel = document.getElementById("emailPanel");
    if (emailPanel) emailPanel.classList.add("hidden");
    emailInvoiceFilter = null;
  }
}

function setEmailPanelVisible(show) {
  const panel = document.getElementById("emailPanel");
  if (!panel) return;
  panel.classList.toggle("hidden", !show);

  if (show) {
    const disposition = document.getElementById("dispositionPanel");
    if (disposition) disposition.classList.add("hidden");
  }
}

function renderDispositionInvoiceList() {
  const wrap = document.getElementById("dispositionInvoiceWrap");
  const listEl = document.getElementById("dispositionInvoiceList");
  if (!wrap || !listEl) return;

  if (!dispositionInvoiceList || dispositionInvoiceList.length === 0) {
    listEl.innerHTML = "";
    wrap.classList.add("hidden");
    return;
  }

  wrap.classList.remove("hidden");
  listEl.innerHTML = dispositionInvoiceList
    .map(invNo => `<span class="invoiceTag">${safeText(invNo)}</span>`)
    .join("");
}

function openDispositionForSingleInvoice(invNo) {
  dispositionInvoiceFilter = invNo ? [invNo] : null;
  dispositionInvoiceList = invNo ? [invNo] : [];
  setDispositionVisible(true);
  setDispositionReadOnly(isManagerView);
  renderDispositionInvoiceList();
  refreshCollectionTotals();
  applyFiltersAndRender();
}

function openDispositionForBulkInvoices(invoiceNos) {
  dispositionInvoiceFilter = null;
  dispositionInvoiceList = Array.isArray(invoiceNos) ? invoiceNos : [];
  setDispositionVisible(true);
  setDispositionReadOnly(isManagerView);
  renderDispositionInvoiceList();
  refreshCollectionTotals();
  applyFiltersAndRender();
}

function refreshCollectionTotals() {
  const subStatusSelect = document.getElementById("subStatusSelect");
  if (!subStatusSelect) return;
  subStatusSelect.dispatchEvent(new Event("change", { bubbles: true }));
}

function openEmailPanel(invNo) {
  if (invNo) currentInvoiceNoForDocs = invNo;
  emailInvoiceFilter = invNo ? [invNo] : null;
  dispositionInvoiceFilter = null;
  dispositionInvoiceList = [];
  setEmailPanelVisible(true);
  applyFiltersAndRender();
  const panel = document.getElementById("emailPanel");
  if (panel) {
    const composePanel = panel.querySelector("#emailComposePanel");
    if (composePanel) composePanel.classList.add("hidden");
    const firstItem = panel.querySelector(".emailTabPane.active .emailItem");
    if (firstItem) firstItem.click();
  }
}

function closeEmailPanel() {
  emailInvoiceFilter = null;
  setEmailPanelVisible(false);
  applyFiltersAndRender();
}

function resetDispositionState() {
  dispositionInvoiceFilter = null;
  dispositionInvoiceList = [];
  setDispositionVisible(false);
  renderDispositionInvoiceList();
}

function closeDispositionPanel() {
  resetDispositionState();
  applyFiltersAndRender();
}

function renderCustomerDetails(customer) {
  if (!customer) return;

  renderCustomerContacts(customer);
  setDetailValue("customerBillToAddress", customer.billToAddress);
  setDetailValue("customerShipToAddress", customer.shipToAddress);
  setDetailValue("customerCity", customer.city);
  setDetailValue("customerPincode", customer.pincode);
  setDetailValue("customerState", customer.state);
  setDetailValue("customerRegion", customer.region);

  const amountForMonth = (customer.invoices || [])
    .reduce((sum, inv) => sum + Number(inv.amountForMonth || 0), 0);
  const mtdCollection = Number(customer.mtdCollection || 0);
  const cnAdvPdc = Number(customer.cnAdvPdcAmount || 0);
  const netDueComputed = getCustomerNetDue(customer);

  setDetailValue("customerAmountForMonth", `Rs. ${formatINR(amountForMonth)}`);
  setDetailValue("customerMtdCollection", `Rs. ${formatINR(mtdCollection)}`);
  setDetailValue("customerCnAdvPdc", `Rs. ${formatINR(cnAdvPdc)}`);
  setDetailValue("customerNetDueAmount", `Rs. ${formatINR(netDueComputed)}`);
}

function renderCustomerContacts(customer) {
  const wrap = document.getElementById("customerContacts");
  if (!wrap || !customer) return;

  const contacts = Array.isArray(customer.contacts) ? customer.contacts : [];
  if (contacts.length === 0) {
    wrap.innerHTML = `<div class="kv"><span>No contacts</span><strong>-</strong></div>`;
    return;
  }

  wrap.innerHTML = contacts.map((contact, idx) => {
    const headingId = `contactHeading-${customer.id}-${idx}`;
    const collapseId = `contactCollapse-${customer.id}-${idx}`;
    const isActive = false;

    return `
      <div class="accordion-item">
        <h2 class="accordion-header" id="${headingId}">
          <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#${collapseId}" aria-expanded="false" aria-controls="${collapseId}">
            ${formatContactName(contact)}
          </button>
        </h2>
        <div id="${collapseId}" class="accordion-collapse collapse" aria-labelledby="${headingId}" data-bs-parent="#customerContacts">
          <div class="accordion-body">
            <div class="kv"><span>First Name</span><strong>${safeText(contact.firstName)}</strong></div>
            <div class="kv"><span>Last Name</span><strong>${safeText(contact.lastName)}</strong></div>
            <div class="kv"><span>Email</span><strong>${safeText(contact.email)}</strong></div>
            <div class="kv"><span>Phone (Primary)</span><strong>${safeText(contact.phonePrimary)}</strong></div>
            <div class="kv"><span>Phone (Secondary)</span><strong>${safeText(contact.phoneSecondary)}</strong></div>
            <div class="kv"><span>Gender</span><strong>${safeText(contact.gender)}</strong></div>
            <div class="kv"><span>Department</span><strong>${safeText(contact.department)}</strong></div>
            <div class="kv contactCheckboxRow">
              <span>Use Email for Communication</span>
              <input class="form-check-input" type="checkbox" ${contact.useEmailForCommunication ? "checked" : ""} disabled />
            </div>
          </div>
        </div>
      </div>
    `;
  }).join("");
}

function renderInvoiceDetails(invoice) {
  const customer = customersData.find(c => c.id === selectedCustomerId);
  const submissionEl = document.getElementById("invoiceSubmissionStatus");
  const pushSubjectEl = document.getElementById("pushNotificationSubject");

  if (!invoice) {
    if (submissionEl) {
      submissionEl.textContent = "-";
      submissionEl.className = "invoiceStatusPill is-neutral";
    }
    if (pushSubjectEl) pushSubjectEl.textContent = "Subject: PTP missed for -";
    setDetailValue("invoiceAgent", "-");
    setDetailValue("invoiceManager", "-");
    setDetailValue("invoiceKam", "-");
    setDetailValue("invoiceKas", "-");
    setDetailValue("invoiceAddress", "-");
    setDetailValue("invoiceCity", "-");
    setDetailValue("invoicePincode", "-");
    setDetailValue("invoiceState", "-");
    setDetailValue("invoiceCreditPeriod", "-");
    setDetailValue("invoiceGrnDate", "-");
    setDetailValue("invoiceGrnNumber", "-");
    setDetailValue("invoiceProduct", "-");
    setDetailValue("invoicePoNumber", "-");
    setDetailValue("invoiceSalesOrderNumber", "-");
    setDetailValue("invoiceBusinessUnit", "-");
    setDetailValue("invoiceIndustry", "-");
    renderStoredRemarks(null);
    return;
  }

  setDetailValue("invoiceAgent", customer?.agentName);
  setDetailValue("invoiceManager", customer?.managerName);
  setDetailValue("invoiceKam", customer?.kamName);
  setDetailValue("invoiceKas", customer?.kasName);
  setDetailValue("invoiceAddress", customer?.billToAddress);
  setDetailValue("invoiceCity", customer?.city);
  setDetailValue("invoicePincode", customer?.pincode);
  setDetailValue("invoiceState", customer?.state);
  setDetailValue("invoiceCreditPeriod", invoice.creditPeriod || customer?.creditPeriod);
  setDetailValue("invoiceGrnDate", customer?.grnDate);
  setDetailValue("invoiceGrnNumber", customer?.grnNumber);
  setDetailValue("invoiceProduct", customer?.product);
  setDetailValue("invoicePoNumber", getInvoicePoNumber(invoice));
  setDetailValue("invoiceSalesOrderNumber", getInvoiceSalesOrder(invoice));
  setDetailValue("invoiceBusinessUnit", customer?.businessUnit);
  setDetailValue("invoiceIndustry", customer?.industry);

  if (submissionEl) {
    const status = getInvoiceSubmissionStatus(invoice);
    submissionEl.textContent = status.label;
    submissionEl.className = `invoiceStatusPill ${status.className}`;
  }

  if (pushSubjectEl) {
    const clientName = customer?.name || "-";
    pushSubjectEl.textContent = `Subject: PTP missed for ${clientName}`;
  }
}

function highlightInvoiceRow(invNo) {
  if (!invNo) return;
  const tbody = document.getElementById("invoiceTableBody");
  if (!tbody) return;
  const targetRow = tbody.querySelector(`.invChk[data-inv="${invNo}"]`)?.closest("tr");
  if (!targetRow) return;
  const activeRow = tbody.querySelector("tr.rowActive");
  if (activeRow && activeRow !== targetRow) activeRow.classList.remove("rowActive");
  targetRow.classList.add("rowActive");
}

function selectInvoiceByNo(invNo) {
  if (!invNo) return false;
  const invoice = currentInvoicesAll.find(inv => inv.invoiceNo === invNo);
  if (!invoice) return false;
  renderInvoiceDetails(invoice);
  currentInvoiceNoForDocs = invNo;
  renderStoredRemarks(invNo);
  const customer = customersData.find(c => c.id === selectedCustomerId);
  if (customer) renderDocsList(customer);
  highlightInvoiceRow(invNo);
  return true;
}

function ensureFirstInvoiceSelected() {
  const tbody = document.getElementById("invoiceTableBody");
  if (currentInvoiceNoForDocs) return;
  if (tbody && tbody.querySelector("tr.rowActive")) return;
  if (!Array.isArray(currentInvoicesFiltered) || currentInvoicesFiltered.length === 0) return;
  selectInvoiceByNo(currentInvoicesFiltered[0].invoiceNo);
}

function renderDocsList(customer) {
  const wrap = document.getElementById("docsList");
  if (!wrap || !customer) return;

  const docs = Array.isArray(customer.documents) ? customer.documents : [];
  const filtered = currentDocsScope === "invoice"
    ? docs.filter(doc => doc.type === "invoice")
    : docs.filter(doc => doc.type === "client");

  if (filtered.length === 0) {
    wrap.innerHTML = `<div class="kv"><span>No documents</span><strong>-</strong></div>`;
    return;
  }

  wrap.innerHTML = filtered.map(doc => {
    const levelLabel = doc.type === "invoice" ? "Invoice level document" : "Customer level document";
    const subline = levelLabel;

    return `
      <div class="docItem">
        <div class="docMeta">
          <div class="docName">${safeText(doc.name)}</div>
          <div class="docSub">${safeText(subline)}</div>
        </div>
        <div class="docActions">
          <button class="btn btn-light btn-sm" type="button" title="Upload">
            <i class="bi bi-upload" aria-hidden="true"></i>
          </button>
          <button class="btn btn-light btn-sm" type="button" title="Preview">
            <i class="bi bi-eye" aria-hidden="true"></i>
          </button>
        </div>
      </div>
    `;
  }).join("");
}

function getDocKey(doc) {
  return `${doc.type || "doc"}::${doc.name || "Unknown"}`;
}

function isDocSelected(customerId, doc) {
  if (!customerId || !doc) return false;
  if (!docsSelectionState[customerId]) docsSelectionState[customerId] = {};
  const key = getDocKey(doc);
  if (docsSelectionState[customerId][key] === undefined) {
    docsSelectionState[customerId][key] = doc.selected ?? (doc.type === "invoice");
  }
  return docsSelectionState[customerId][key];
}

function isDocLocked(customerId, doc) {
  if (!customerId || !doc) return false;
  if (!docsLockedState[customerId]) docsLockedState[customerId] = {};
  const key = getDocKey(doc);
  if (docsLockedState[customerId][key] === undefined) {
    docsLockedState[customerId][key] = doc.selected ?? (doc.type === "invoice");
  }
  return docsLockedState[customerId][key];
}

function setDocSelected(customerId, docKey, selected) {
  if (!customerId || !docKey) return;
  if (!docsSelectionState[customerId]) docsSelectionState[customerId] = {};
  docsSelectionState[customerId][docKey] = selected;
}

function renderDocsInvoiceSelect(customer) {
  const select = document.getElementById("docsInvoiceSelect");
  if (!select || !customer) return;

  const current = currentDocsScope || "customer";

  select.innerHTML = `
    <option value="customer">Customer level documents</option>
    <option value="invoice">Invoice level documents</option>
  `;

  select.value = current;
}

function renderDocsPicker(customer) {
  const list = document.getElementById("docsPickerList");
  if (!list || !customer) return;

  const docs = Array.isArray(customer.documents) ? customer.documents : [];
  if (docs.length === 0) {
    list.innerHTML = `<div class="kv"><span>No documents</span><strong>-</strong></div>`;
    return;
  }

  list.innerHTML = docs.map(doc => {
    const key = getDocKey(doc);
    const checked = isDocSelected(customer.id, doc);
    const disabled = isDocLocked(customer.id, doc);
    const levelLabel = doc.type === "invoice" ? "Invoice level document" : "Customer level document";
    const subline = levelLabel;

    return `
      <div class="docsPickerItem ${disabled ? "is-locked" : ""}">
        <input type="checkbox" class="docPickChk" data-doc-key="${key}" ${checked ? "checked" : ""} ${disabled ? "disabled" : ""} />
        <div class="docsPickerMeta">
          <div class="docsPickerName">${safeText(doc.name)}</div>
          <div class="docsPickerSub">${safeText(subline)}</div>
        </div>
      </div>
    `;
  }).join("");
}

function setActiveTab(tabKey) {
  const tabs = document.querySelectorAll(".tabsRow .tabBtn[data-tab]");
  const panes = document.querySelectorAll(".tabPanel");

  tabs.forEach(btn => {
    const isActive = btn.getAttribute("data-tab") === tabKey;
    btn.classList.toggle("active", isActive);
  });

  panes.forEach(pane => {
    const isActive = pane.getAttribute("data-tab") === tabKey;
    pane.classList.toggle("active", isActive);
  });

  if (tabKey === "docs") {
    const customer = customersData.find(c => c.id === selectedCustomerId);
    if (!customer) return;
    currentDocsScope = currentInvoiceNoForDocs ? "invoice" : "customer";
    renderDocsInvoiceSelect(customer);
    renderDocsList(customer);
    renderDocsPicker(customer);
    const picker = document.getElementById("docsPicker");
    if (picker) picker.classList.add("hidden");
  }
}

// ===============================
// Global state for table filtering + selection
// ===============================
let selectedCustomerId = customersData[0]?.id || null;
let currentInvoicesAll = [];
let currentInvoicesFiltered = [];
let currentInvoicesBaseFiltered = [];
let selectedInvoiceNos = new Set();
let currentPage = 1;
const pageSize = 5;
let currentInvoiceNoForDocs = null;
let currentDocsScope = "customer";
let dispositionInvoiceFilter = null;
let dispositionInvoiceList = [];
let emailInvoiceFilter = null;
const docsSelectionState = {};
const docsLockedState = {};
let currentCnAdvPdcRows = [];
let cnAdvPdcSortState = { key: null, dir: null };

const filterState = {
  invoiceStatus: "__ALL__",
  primaryStatus: "__ALL__",
  status: "__ALL__",
  unreadOnly: false
};

const filterOptions = {
  invoiceStatus: [],
  primaryStatus: [],
  status: []
};

const filterConfig = {
  invoiceStatus: {
    label: "Invoice Status",
    buttonId: "filterInvoiceStatusBtn",
    menuId: "filterInvoiceStatusMenu"
  },
  primaryStatus: {
    label: "Primary Status",
    buttonId: "filterPrimaryStatusBtn",
    menuId: "filterPrimaryStatusMenu"
  },
  status: {
    label: "Status",
    buttonId: "filterStatusBtn",
    menuId: "filterStatusMenu"
  }
};

const customerSortMap = {
  totalInvoice: (a, b) => Number(a.totalInvoiceAmount || 0) - Number(b.totalInvoiceAmount || 0),
  mtdCollection: (a, b) => Number(a.mtdCollection || 0) - Number(b.mtdCollection || 0),
  netDue: (a, b) => getCustomerNetDue(a) - getCustomerNetDue(b)
};

// Floating menu state
let floatingMenuInvNo = null;

// ===============================
// Rendering: Customers list (FROZEN behavior)
// ===============================
function renderCustomers(customers, selectedId) {
  const wrap = document.getElementById("customerCards");
  if (!wrap) return;

  wrap.innerHTML = "";

  customers.forEach(c => {
    const card = document.createElement("div");
    card.className = `customerCard ${c.id === selectedId ? "active" : ""}`;
    card.setAttribute("data-id", c.id);

    card.innerHTML = `
      <div class="custHeaderRow">
        <div class="custName">${c.name}</div>
        <div class="custCode">${c.code}</div>
      </div>

      <div class="custMetricsRow">
        <div class="metricInline">
          <span>Total Invoice</span>
          <strong>Rs.${formatINR(c.totalInvoiceAmount)}</strong>
        </div>
        <div class="metricInline">
          <span>Total Net Due</span>
          <strong>Rs.${formatINR(getCustomerNetDue(c))}</strong>
        </div>
        <div class="metricInline">
          <span>MTD Collection</span>
          <strong>Rs.${formatINR(c.mtdCollection)}</strong>
        </div>
      </div>
    `;

    card.addEventListener("click", () => selectCustomer(c.id));
    wrap.appendChild(card);
  });

  if (customers.length === 0) {
    wrap.innerHTML = `<div style="padding:10px; color:#667085; font-size:13px;">No customers match your search.</div>`;
  }
}

// ===============================
// Filters: populate dropdown values
// ===============================
function updateFilterButton(key) {
  const config = filterConfig[key];
  const btn = config ? document.getElementById(config.buttonId) : null;
  if (!btn) return;

  const valueText = filterState[key] === "__ALL__" ? "All" : String(filterState[key]);
  const valueEl = btn.querySelector("[data-role='filter-value']");
  if (valueEl) valueEl.textContent = valueText;
}

function updateMenuActive(key) {
  const config = filterConfig[key];
  const menu = config ? document.getElementById(config.menuId) : null;
  if (!menu) return;

  const items = menu.querySelectorAll("[data-value]");
  items.forEach(item => {
    const itemValue = item.getAttribute("data-value") || "";
    const isActive = itemValue === String(filterState[key]);
    item.classList.toggle("active", isActive);
  });
}

function renderFilterMenu(key) {
  const config = filterConfig[key];
  const menu = config ? document.getElementById(config.menuId) : null;
  if (!menu) return;

  menu.innerHTML = "";

  const allItem = { label: "All", value: "__ALL__" };
  const items = [allItem].concat((filterOptions[key] || []).map(v => ({ label: String(v), value: String(v) })));

  items.forEach(item => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "dropdown-item";
    btn.textContent = item.label;
    btn.setAttribute("data-value", item.value);
    if (item.value === filterState[key]) btn.classList.add("active");
    li.appendChild(btn);
    menu.appendChild(li);
  });
}

function populateFilters(invoices) {
  const invoiceStatuses = uniqSorted(invoices.map(i => i.invoiceStatus));
  const primaryStatuses = uniqSorted(invoices.map(i => i.primaryStatus));
  const statuses = uniqSorted(invoices.map(i => i.status));

  filterOptions.invoiceStatus = invoiceStatuses;
  filterOptions.primaryStatus = primaryStatuses;
  filterOptions.status = statuses;

  if (!invoiceStatuses.includes(filterState.invoiceStatus)) filterState.invoiceStatus = "__ALL__";
  if (!primaryStatuses.includes(filterState.primaryStatus)) filterState.primaryStatus = "__ALL__";
  if (!statuses.includes(filterState.status)) filterState.status = "__ALL__";

  renderFilterMenu("invoiceStatus");
  renderFilterMenu("primaryStatus");
  renderFilterMenu("status");

  updateFilterButton("invoiceStatus");
  updateFilterButton("primaryStatus");
  updateFilterButton("status");
}

// ===============================
// Pagination
// ===============================
function getPaginationMeta(totalItems) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const page = Math.min(Math.max(currentPage, 1), totalPages);
  const startIndex = totalItems === 0 ? 0 : (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return { totalPages, page, startIndex, endIndex };
}

function renderPagination(totalItems, meta) {
  const wrap = document.getElementById("invoicePagination");
  if (!wrap) return;

  if (totalItems === 0) {
    wrap.innerHTML = "";
    wrap.classList.add("hidden");
    return;
  }

  wrap.classList.remove("hidden");

  const prevDisabled = meta.page <= 1;
  const nextDisabled = meta.page >= meta.totalPages;
  const infoText = `Showing ${meta.startIndex + 1}-${meta.endIndex} of ${totalItems}`;

  const pages = Array.from({ length: meta.totalPages }, (_, idx) => {
    const pageNum = idx + 1;
    const isActive = pageNum === meta.page ? "active" : "";
    return `<li class="page-item ${isActive}">
      <button class="page-link" type="button" data-page="${pageNum}">${pageNum}</button>
    </li>`;
  }).join("");

  wrap.innerHTML = `
    <div class="paginationInfo">${infoText}</div>
    <ul class="pagination pagination-sm mb-0">
      <li class="page-item ${prevDisabled ? "disabled" : ""}">
        <button class="page-link" type="button" data-page="prev">Prev</button>
      </li>
      ${pages}
      <li class="page-item ${nextDisabled ? "disabled" : ""}">
        <button class="page-link" type="button" data-page="next">Next</button>
      </li>
    </ul>
  `;
}

// ===============================
// Apply filters to currentInvoicesAll
// ===============================
function applyFiltersAndRender() {
  const baseFiltered = getBaseFilteredInvoices();
  currentInvoicesBaseFiltered = baseFiltered;

  if (dispositionInvoiceFilter && dispositionInvoiceFilter.length > 0) {
    const filterSet = new Set(dispositionInvoiceFilter);
    currentInvoicesFiltered = baseFiltered.filter(inv => filterSet.has(inv.invoiceNo));
  } else if (emailInvoiceFilter && emailInvoiceFilter.length > 0) {
    const filterSet = new Set(emailInvoiceFilter);
    currentInvoicesFiltered = baseFiltered.filter(inv => filterSet.has(inv.invoiceNo));
  } else {
    currentInvoicesFiltered = baseFiltered;
  }

  renderInvoiceTable(currentInvoicesFiltered);
  const pager = document.getElementById("invoicePagination");
  if (pager) {
    pager.innerHTML = "";
    pager.classList.add("hidden");
  }
  syncSelectAllCheckbox();
  updateBulkBar();
}

// ===============================
// Floating menu: open/close + positioning
// ===============================
function closeFloatingMenu() {
  const menu = document.getElementById("rowActionMenu");
  if (!menu) return;
  menu.classList.add("hidden");
  floatingMenuInvNo = null;
}

function openFloatingMenu(invNo, anchorEl) {
  const menu = document.getElementById("rowActionMenu");
  if (!menu || !anchorEl) return;

  if (!menu.classList.contains("hidden") && floatingMenuInvNo === invNo) {
    closeFloatingMenu();
    return;
  }

  floatingMenuInvNo = invNo;

  const rect = anchorEl.getBoundingClientRect();
  const menuWidth = 210;
  const menuHeight = 120;
  const pad = 8;

  let left = rect.left;
  let top = rect.bottom + 6;

  if (left + menuWidth > window.innerWidth - pad) left = window.innerWidth - menuWidth - pad;
  if (top + menuHeight > window.innerHeight - pad) top = rect.top - menuHeight - 6;

  menu.style.left = `${Math.max(pad, left)}px`;
  menu.style.top = `${Math.max(pad, top)}px`;
  menu.classList.remove("hidden");
}

// ===============================
// Rendering: Invoice table
// ===============================
function renderInvoiceTable(invoices) {
  const tbody = document.getElementById("invoiceTableBody");
  if (!tbody) return;

  tbody.innerHTML = "";
  const actionLabel = isManagerView ? "Add remarks" : "New activity";

  (invoices || []).forEach((inv) => {
    const isChecked = selectedInvoiceNos.has(inv.invoiceNo);
    const tr = document.createElement("tr");

    const targetTitle = `Target: Rs.${formatINR(inv.targetForMonth)} (≤ Invoice)`;

    const hasTarget = Number(inv.targetForMonth || 0) > 0;
    const emailTitle = Number(inv.unreadEmailCount || 0) > 0
      ? `Unread emails: ${inv.unreadEmailCount}`
      : "Email panel";

    tr.innerHTML = `
      <td class="colChk cellCenter">
        <input type="checkbox" class="invChk" data-inv="${inv.invoiceNo}" ${isChecked ? "checked" : ""} />
      </td>

      <td class="colIcon cellCenter">
        <span class="iconWrap">
          <span class="iconFlat" role="button" tabindex="0" title="${emailTitle}" data-action="email" data-inv="${inv.invoiceNo}">
            <i class="bi bi-envelope-fill" aria-hidden="true"></i>
          </span>
          ${Number(inv.unreadEmailCount || 0) > 0 ? `<span class="badgeCount">${inv.unreadEmailCount}</span>` : ``}
        </span>
      </td>

      <td class="colIcon cellCenter">
        <span class="iconFlat" role="button" tabindex="0" title="${targetTitle}" data-action="target" data-inv="${inv.invoiceNo}" style="${hasTarget ? "color: #16a34a;" : ""}">
          <i class="bi bi-bullseye" aria-hidden="true"></i>
        </span>
      </td>

      <td class="colInv" title="${inv.invoiceNo}">${inv.invoiceNo}</td>
      <td class="colAmtRight" title="Rs.${formatINR(inv.invoiceAmount)}">Rs.${formatINR(inv.invoiceAmount)}</td>
      <td class="colDate" title="${inv.invoiceDate}">${inv.invoiceDate}</td>
      <td class="colAmtRight" title="Rs.${formatINR(inv.amountForMonth)}">Rs.${formatINR(inv.amountForMonth)}</td>
      <td class="colAmtRight" title="Rs.${formatINR(inv.netDueAmount)}">Rs.${formatINR(inv.netDueAmount)}</td>
      <td class="colDate" title="${inv.dueDate}">${inv.dueDate}</td>
      <td class="colShort" title="${inv.primaryStatus}">${inv.primaryStatus}</td>
      <td class="colStatus" title="${inv.status}">
        <span class="pill ${statusPillClass(inv.status)}">${inv.status}</span>
      </td>

      <td class="colActions cellCenter">
        <div class="actionCell">
          <button class="btnNewActivity" type="button" data-action="new-activity" data-inv="${inv.invoiceNo}">${actionLabel}</button>
          <button class="kebab" type="button" aria-label="More actions" data-action="open-menu" data-inv="${inv.invoiceNo}">
            <i class="bi bi-three-dots-vertical" aria-hidden="true"></i>
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  });

  if (!invoices || invoices.length === 0) {
    tbody.innerHTML = `<tr><td colspan="12" style="padding:14px; color:#667085;">No invoices match the selected filters.</td></tr>`;
  }
}

// ===============================
// Rendering: Center panel
// ===============================
function renderCenter(customer) {
  const nameEl = document.getElementById("centerCustomerName");
  const codeEl = document.getElementById("centerCustomerCode");
  const openEl = document.getElementById("centerOpenInvoices");
  const outstandingEl = document.getElementById("centerTotalOutstanding");
  const cityEl = document.getElementById("centerCustomerCity");
  const targetEl = document.getElementById("centerCustomerTarget");
  const cnAdvEl = document.getElementById("centerCustomerCnAdvPdc");
  const issueEl = document.getElementById("centerIssueCount");
  const dispositionTagEl = document.getElementById("dispositionCustomerTag");

  if (!customer) return;

  if (nameEl) nameEl.firstChild.nodeValue = `${customer.name} `;
  if (codeEl) codeEl.textContent = customer.code;

  if (openEl) openEl.textContent = String((customer.invoices || []).length);
  if (outstandingEl) outstandingEl.textContent = `Rs.${formatINR(getCustomerNetDue(customer))}`;

  if (cityEl) cityEl.textContent = customer.city || "-";

  const targetOverride = Number(customer.targetTotal);
  const targetSum = Number.isFinite(targetOverride)
    ? targetOverride
    : sumInvoiceTargets(customer.invoices || []);
  if (targetEl) targetEl.textContent = `Rs.${formatINR(targetSum)}`;
  if (cnAdvEl) cnAdvEl.textContent = `Rs.${formatINR(customer.cnAdvPdcAmount || 0)}`;

  const issueCount = (customer.invoices || []).filter(inv => {
    const status = String(inv.status || "").toLowerCase();
    const primary = String(inv.primaryStatus || "").toLowerCase();
    return status === "dispute" || primary === "dispute";
  }).length;
  if (issueEl) issueEl.textContent = String(issueCount);

  if (dispositionTagEl) dispositionTagEl.textContent = customer.name;
}

function openCnAdvPdcModal() {
  const customer = customersData.find(c => c.id === selectedCustomerId);
  currentCnAdvPdcRows = getCnAdvPdcAdjustments(customer);
  cnAdvPdcSortState = { key: null, dir: null };
  renderCnAdvPdcTable(currentCnAdvPdcRows);

  const modalEl = document.getElementById("cnAdvPdcModal");
  if (modalEl && typeof bootstrap !== "undefined") {
    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  }
}

// ===============================
// Selection + Bulk
// ===============================
function syncSelectAllCheckbox() {
  const selectAll = document.getElementById("selectAllInvoices");
  if (!selectAll) return;

  const total = currentInvoicesBaseFiltered.length;
  if (total === 0) {
    selectAll.checked = false;
    selectAll.indeterminate = false;
    return;
  }

  let selectedCount = 0;
  currentInvoicesBaseFiltered.forEach(inv => {
    if (selectedInvoiceNos.has(inv.invoiceNo)) selectedCount += 1;
  });

  selectAll.checked = selectedCount === total;
  selectAll.indeterminate = selectedCount > 0 && selectedCount < total;
}

function updateBulkBar() {
  const bulkBar = document.getElementById("bulkBar");
  const bulkCount = document.getElementById("bulkCount");
  if (!bulkBar || !bulkCount) return;

  const count = selectedInvoiceNos.size;
  bulkCount.textContent = String(count);

  if (count > 1) bulkBar.classList.remove("hidden");
  else bulkBar.classList.add("hidden");
}

// ===============================
// State + actions
// ===============================
function selectCustomer(customerId) {
  selectedCustomerId = customerId;

  selectedInvoiceNos = new Set();
  emailInvoiceFilter = null;
  currentDocsScope = "customer";
  updateBulkBar();
  closeFloatingMenu();

  const selected = customersData.find(c => c.id === selectedCustomerId);
  renderCustomers(getFilteredCustomers(), selectedCustomerId);

  if (selected) {
    renderCenter(selected);

    currentInvoicesAll = selected.invoices || [];
    currentPage = 1;
    filterState.invoiceStatus = "__ALL__";
    filterState.primaryStatus = "__ALL__";
    filterState.status = "__ALL__";
    populateFilters(currentInvoicesAll);

    renderCustomerDetails(selected);
    renderInvoiceDetails(null);
    setActiveTab("customer");
    currentInvoiceNoForDocs = null;
    renderDocsInvoiceSelect(selected);
    renderDocsList(selected);
    renderDocsPicker(selected);
    resetDispositionState();
    renderTodoInvoiceOptions();

    const unreadChk = document.getElementById("filterUnreadEmail");

    if (unreadChk) unreadChk.checked = false;

    applyFiltersAndRender();
  }
}

function getFilteredCustomers() {
  const q = (document.getElementById("customerSearch")?.value || "").trim().toLowerCase();
  const sortValue = document.getElementById("customerSortSelect")?.value || "";

  let filtered = customersData;
  if (q) {
    filtered = customersData.filter(c => {
      const n = String(c.name || "").toLowerCase();
      const code = String(c.code || "").toLowerCase();
      return n.includes(q) || code.includes(q);
    });
  }

  if (sortValue) {
    const [field, dir] = sortValue.split("_");
    const sorter = customerSortMap[field];
    if (sorter) {
      filtered = [...filtered].sort((a, b) => {
        const result = sorter(a, b);
        return dir === "desc" ? -result : result;
      });
    }
  }

  return filtered;
}

// ===============================
// Wire events
// ===============================
function wireFilterEvents() {
  const unreadChk = document.getElementById("filterUnreadEmail");
  const clearBtn = document.getElementById("filterClearBtn");

  Object.keys(filterConfig).forEach(key => {
    const menu = document.getElementById(filterConfig[key].menuId);
    if (!menu) return;

    menu.addEventListener("click", (e) => {
      const item = e.target.closest("[data-value]");
      if (!item) return;

      const value = item.getAttribute("data-value") || "__ALL__";
      filterState[key] = value;
      currentPage = 1;
      updateFilterButton(key);
      updateMenuActive(key);
      closeFloatingMenu();
      applyFiltersAndRender();
    });
  });

  if (unreadChk) {
    unreadChk.addEventListener("change", () => {
      currentPage = 1;
      closeFloatingMenu();
      applyFiltersAndRender();
    });
  }

  if (clearBtn) {
    clearBtn.addEventListener("click", () => {
      filterState.invoiceStatus = "__ALL__";
      filterState.primaryStatus = "__ALL__";
      filterState.status = "__ALL__";
      currentPage = 1;

      if (unreadChk) unreadChk.checked = false;

      updateFilterButton("invoiceStatus");
      updateFilterButton("primaryStatus");
      updateFilterButton("status");
      updateMenuActive("invoiceStatus");
      updateMenuActive("primaryStatus");
      updateMenuActive("status");

      closeFloatingMenu();
      applyFiltersAndRender();
    });
  }
}

function wireTabEvents() {
  const tabs = document.querySelectorAll(".tabsRow .tabBtn[data-tab]");
  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      const tabKey = btn.getAttribute("data-tab");
      if (!tabKey) return;
      if (tabKey === "invoice" || tabKey === "docs") {
        ensureFirstInvoiceSelected();
      }
      setActiveTab(tabKey);
    });
  });
}

function wireContactEvents() {
  const addBtn = document.getElementById("addCustomerContactBtn");
  if (!addBtn) return;

  addBtn.addEventListener("click", () => {
    const customer = customersData.find(c => c.id === selectedCustomerId);
    if (!customer) return;

    if (!Array.isArray(customer.contacts)) customer.contacts = [];

    const newIndex = customer.contacts.length + 1;
    customer.contacts.push({
      firstName: "New",
      lastName: `Contact ${newIndex}`,
      email: "",
      phonePrimary: "",
      phoneSecondary: "",
      gender: "",
      department: "",
      useEmailForCommunication: false
    });

    renderCustomerDetails(customer);
    setActiveTab("customer");
  });
}

function wireDispositionEvents() {
  const closeBtn = document.getElementById("dispositionCloseBtn");
  if (!closeBtn) return;

  closeBtn.addEventListener("click", () => {
    closeDispositionPanel();
  });
}

function wireEmailPanelEvents() {
  const closeBtn = document.getElementById("emailPanelCloseBtn");
  if (closeBtn) {
    closeBtn.addEventListener("click", closeEmailPanel);
  }

  const tabs = document.querySelectorAll(".emailMailboxList button[data-email-tab]");
  const panes = document.querySelectorAll(".emailTabPane[data-email-tab]");
  const detailEmpty = document.getElementById("emailDetailEmpty");
  const detailContent = document.getElementById("emailDetailContent");
  const composePanel = document.getElementById("emailComposePanel");
  const composeTo = document.getElementById("emailComposeTo");
  const composeCc = document.getElementById("emailComposeCc");
  const composeFrom = document.getElementById("emailComposeFrom");
  const composeSubject = document.getElementById("emailComposeSubject");
  const composeBody = document.getElementById("emailComposeBody");
  const composeAttachments = document.getElementById("emailComposeAttachments");
  const newBtn = document.getElementById("emailNewBtn");
  const sendBtn = document.getElementById("emailSendBtn");
  const toSuggestions = document.getElementById("emailToSuggestions");
  const ccSuggestions = document.getElementById("emailCcSuggestions");

  const normalizeBody = (value) => String(value || "").replace(/\\\\n/g, "\n").replace(/\\n/g, "\n");

  const resetDetail = () => {
    if (detailEmpty) detailEmpty.classList.remove("hidden");
    if (detailContent) detailContent.classList.add("hidden");
    document.querySelectorAll(".emailItem.active").forEach(item => item.classList.remove("active"));
    setDetailValue("emailDetailFrom", "-");
    setDetailValue("emailDetailTo", "-");
    setDetailValue("emailDetailCc", "-");
    setDetailValue("emailDetailSubject", "-");
    const bodyEl = document.getElementById("emailDetailBody");
    if (bodyEl) bodyEl.textContent = "-";
    const attachmentsEl = document.getElementById("emailDetailAttachments");
    if (attachmentsEl) attachmentsEl.textContent = "-";
  };

  const selectFirstEmail = () => {
    const panel = document.getElementById("emailPanel");
    if (!panel) return;
    const activePane = panel.querySelector(".emailTabPane.active");
    const firstItem = activePane ? activePane.querySelector(".emailItem") : null;
    if (firstItem) {
      firstItem.click();
    }
  };

  const showCompose = () => {
    if (composePanel) composePanel.classList.remove("hidden");
    if (detailEmpty) detailEmpty.classList.add("hidden");
    if (detailContent) detailContent.classList.add("hidden");
    document.querySelectorAll(".emailItem.active").forEach(item => item.classList.remove("active"));
  };

  const hideCompose = () => {
    if (composePanel) composePanel.classList.add("hidden");
    document.querySelectorAll(".emailTemplatePill.active").forEach(pill => pill.classList.remove("active"));
  };

  const resetCompose = () => {
    if (composeTo) composeTo.value = "";
    if (composeCc) composeCc.value = "";
    if (composeSubject) composeSubject.value = "";
    if (composeBody) composeBody.value = "";
    if (composeAttachments) composeAttachments.value = "";
  };

  const getContactSuggestions = () => {
    const customer = customersData.find(c => c.id === selectedCustomerId);
    const contacts = Array.isArray(customer?.contacts) ? customer.contacts : [];
    return contacts
      .filter(contact => String(contact.email || "").trim() !== "")
      .map(contact => ({
        name: formatContactName(contact),
        email: String(contact.email || "").trim()
      }));
  };

  const getActiveToken = (value) => {
    const parts = String(value || "").split(",");
    return String(parts[parts.length - 1] || "").trim();
  };

  const replaceActiveToken = (value, email) => {
    const parts = String(value || "").split(",");
    const prefix = parts.slice(0, -1).map(part => part.trim()).filter(Boolean);
    prefix.push(email);
    return prefix.join(", ");
  };

  const renderSuggestions = (box, query) => {
    if (!box) return;
    box.innerHTML = "";

    const suggestions = getContactSuggestions();
    const token = getActiveToken(query);
    const q = token.toLowerCase();
    const filtered = suggestions.filter(item => {
      if (!q) return true;
      return item.email.toLowerCase().includes(q) || item.name.toLowerCase().includes(q);
    });

    if (filtered.length === 0) {
      const empty = document.createElement("div");
      empty.className = "emailSuggestionEmpty";
      empty.textContent = suggestions.length === 0 ? "No contacts available" : "No matching contacts";
      box.appendChild(empty);
    } else {
      filtered.forEach(item => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "emailSuggestionItem";
        btn.dataset.email = item.email;
        const nameEl = document.createElement("span");
        nameEl.className = "emailSuggestionName";
        nameEl.textContent = item.name;
        const emailEl = document.createElement("span");
        emailEl.className = "emailSuggestionEmail";
        emailEl.textContent = item.email;
        btn.appendChild(nameEl);
        btn.appendChild(emailEl);
        box.appendChild(btn);
      });
    }

    box.classList.remove("hidden");
  };

  const wireSuggestionInput = (input, box) => {
    if (!input || !box) return;
    const show = () => renderSuggestions(box, input.value);
    input.addEventListener("focus", show);
    input.addEventListener("click", show);
    input.addEventListener("input", show);
    input.addEventListener("blur", () => {
      setTimeout(() => {
        box.classList.add("hidden");
      }, 150);
    });
  };

  tabs.forEach(btn => {
    btn.addEventListener("click", () => {
      const key = btn.getAttribute("data-email-tab");
      tabs.forEach(b => b.classList.toggle("active", b === btn));
      panes.forEach(pane => pane.classList.toggle("active", pane.getAttribute("data-email-tab") === key));
      hideCompose();
      resetDetail();
      selectFirstEmail();
    });
  });

  document.addEventListener("click", (e) => {
    const suggestionItem = e.target.closest(".emailSuggestionItem");
    if (suggestionItem) {
      const box = suggestionItem.closest(".emailSuggestionBox");
      const targetId = box ? box.getAttribute("data-target") : null;
      const input = targetId ? document.getElementById(targetId) : null;
      if (input) {
        const email = suggestionItem.getAttribute("data-email") || "";
        input.value = replaceActiveToken(input.value, email);
      }
      if (box) box.classList.add("hidden");
      return;
    }

    const template = e.target.closest(".emailTemplatePill");
    if (template) {
      const panel = template.closest("#emailPanel");
      if (!panel) return;
      panel.querySelectorAll(".emailTemplatePill").forEach(pill => pill.classList.remove("active"));
      template.classList.add("active");
      if (composeBody) {
        composeBody.value = normalizeBody(template.getAttribute("data-template-body"));
      }
      const templateSubject = template.getAttribute("data-template-subject");
      if (composeSubject && templateSubject) {
        composeSubject.value = templateSubject;
      }
      return;
    }

    const item = e.target.closest(".emailItem");
    if (!item) return;
    const panel = item.closest("#emailPanel");
    if (!panel) return;
    hideCompose();

    panel.querySelectorAll(".emailItem").forEach(el => el.classList.remove("active"));
    item.classList.add("active");

    setDetailValue("emailDetailFrom", item.getAttribute("data-from"));
    setDetailValue("emailDetailTo", item.getAttribute("data-to"));
    setDetailValue("emailDetailCc", item.getAttribute("data-cc"));
    setDetailValue("emailDetailSubject", item.getAttribute("data-subject"));

    const bodyEl = document.getElementById("emailDetailBody");
    const rawBody = item.getAttribute("data-body") || "-";
    if (bodyEl) bodyEl.textContent = normalizeBody(rawBody);

    const attachmentsEl = document.getElementById("emailDetailAttachments");
    const rawAttachments = item.getAttribute("data-attachments") || "-";
    if (attachmentsEl) {
      const formatted = rawAttachments === "-" ? "-" : rawAttachments.split("|").join(", ");
      attachmentsEl.textContent = formatted;
    }

    if (detailEmpty) detailEmpty.classList.add("hidden");
    if (detailContent) detailContent.classList.remove("hidden");
  });

  if (newBtn) {
    newBtn.addEventListener("click", () => {
      resetCompose();
      showCompose();
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", () => {
      resetCompose();
    });
  }

  wireSuggestionInput(composeTo, toSuggestions);
  wireSuggestionInput(composeCc, ccSuggestions);

  selectFirstEmail();
}

function wireDispositionActivityEvents() {
  const subStatusSelect = document.getElementById("subStatusSelect");
  const collectionFields = document.getElementById("collectionFields");
  const submitBtn = document.getElementById("submitActivityBtn");
  const trail = document.getElementById("activityTrailList");
  const activityCollapse = document.getElementById("invoiceActivityCollapse");
  const remarksList = document.querySelector(".remarksList");
  const remarksAccordion = document.getElementById("invoiceRemarksCollapse");
  const outstandingEl = document.getElementById("collectionOutstandingAmount");
  const totalEl = document.getElementById("collectionTotalAmount");
  const amountEl = document.getElementById("collectionAmount");
  const tdsEl = document.getElementById("collectionTds");
  const ldEl = document.getElementById("collectionLd");
  const instrumentModeSelect = document.getElementById("collectionInstrumentMode");
  const miscFields = document.getElementById("collectionMiscFields");
  const miscList = document.getElementById("collectionMiscList");
  const addMiscBtn = document.getElementById("addMiscModeBtn");
  const singleFields = document.querySelectorAll(".collectionSingleFields");
  const errorEl = document.getElementById("collectionError");

  const miscModes = ["NEFT", "RTGS", "Cheque", "Demand Draft", "PDC", "CN", "Adv"];
  const miscAdjustmentModes = new Set(["PDC", "CN", "Adv"]);
  const adjustmentTypeMap = { PDC: "PDC", CN: "Credit Note", Adv: "Advance" };

  const showError = (message) => {
    if (!errorEl) return;
    errorEl.textContent = message;
    errorEl.classList.remove("hidden");
  };

  const clearError = () => {
    if (!errorEl) return;
    errorEl.textContent = "";
    errorEl.classList.add("hidden");
  };

  const updateCollectionTotals = () => {
    const invNo = dispositionInvoiceList && dispositionInvoiceList.length > 0
      ? dispositionInvoiceList[0]
      : currentInvoiceNoForDocs;
    const invoice = invNo ? currentInvoicesAll.find(inv => inv.invoiceNo === invNo) : null;
    const outstanding = invoice ? Number(invoice.netDueAmount || 0) : 0;

    if (outstandingEl) {
      outstandingEl.textContent = `Rs. ${formatINR(outstanding)}`;
    }

    let total = 0;
    const isMisc = instrumentModeSelect?.value === "Miscellenious";
    if (isMisc && miscList) {
      const rows = miscList.querySelectorAll(".collectionMiscRow");
      rows.forEach((row) => {
        const amount = Number(row.querySelector(".miscAmount")?.value || 0);
        const tds = Number(row.querySelector(".miscTds")?.value || 0);
        const ld = Number(row.querySelector(".miscLd")?.value || 0);
        total += amount + tds + ld;
      });
    } else {
      const amount = Number(amountEl?.value || 0);
      const tds = Number(tdsEl?.value || 0);
      const ld = Number(ldEl?.value || 0);
      total = amount + tds + ld;
    }

    if (totalEl) {
      totalEl.textContent = `Rs. ${formatINR(total)}`;
    }
  };

  const validateCollection = (showErrors) => {
    const isCollection = subStatusSelect?.value === "Collection";
    if (!isCollection) return true;

    const instrumentMode = instrumentModeSelect?.value || "";
    const isMisc = instrumentMode === "Miscellenious";
    const outstanding = getOutstandingAmount();
    const miscRows = isMisc ? getMiscRowsData() : [];

    let totalCollected = 0;
    if (isMisc) {
      miscRows.forEach((row) => {
        totalCollected += Number(row.amount || 0) + Number(row.tds || 0) + Number(row.ld || 0);
      });
    } else {
      totalCollected = Number(amountEl?.value || 0)
        + Number(tdsEl?.value || 0)
        + Number(ldEl?.value || 0);
    }

    let hasError = false;

    if (totalCollected > outstanding) {
      if (showErrors) showError("Total collected cannot be more than total outstanding.");
      hasError = true;
    } else if (showErrors) {
      clearError();
    }

    if (isMisc) {
      const customer = customersData.find(c => c.id === selectedCustomerId);
      const adjustments = getCnAdvPdcAdjustments(customer);
      const rows = miscList ? Array.from(miscList.querySelectorAll(".collectionMiscRow")) : [];

      rows.forEach((rowEl, idx) => {
        const row = miscRows[idx];
        if (!row || !miscAdjustmentModes.has(row.mode)) return;
        const selected = adjustments.find(item => item.adjustmentId === row.adjustmentId);
        if (!selected) return;
        const amount = Number(row.amount || 0);
        const remaining = Number(selected.remainingAmount || 0);
        const err = rowEl.querySelector(".miscRowError");
        if (amount > remaining) {
          if (err && showErrors) {
            err.textContent = `${row.mode} amount exceeds remaining for ${selected.adjustmentId}.`;
            err.classList.remove("hidden");
          }
          hasError = true;
        } else if (err && showErrors) {
          err.textContent = "";
          err.classList.add("hidden");
        }
      });
    }

    return !hasError;
  };

  const getAdjustmentOptions = (mode) => {
    const customer = customersData.find(c => c.id === selectedCustomerId);
    const list = getCnAdvPdcAdjustments(customer);
    const type = adjustmentTypeMap[mode];
    const filtered = type ? list.filter(item => item.adjustmentType === type) : [];
    return filtered.map(item => ({
      value: item.adjustmentId,
      label: `${item.adjustmentId} | Rs.${formatINR(item.remainingAmount || 0)}`
    }));
  };

  const updateAdjustmentField = (row, mode) => {
    const field = row.querySelector(".miscAdjustmentField");
    const select = row.querySelector(".miscAdjustmentSelect");
    if (!field || !select) return;

    if (miscAdjustmentModes.has(mode)) {
      const options = getAdjustmentOptions(mode);
      select.innerHTML = options.length
        ? `<option value="">Select ${mode}</option>` + options.map(opt => `<option value="${opt.value}">${opt.label}</option>`).join("")
        : `<option value="">No ${mode} available</option>`;
      field.classList.remove("hidden");
    } else {
      field.classList.add("hidden");
      select.innerHTML = "";
    }
  };

  const createMiscRow = (initialMode) => {
    if (!miscList) return;
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
          <input type="text" class="miscBank" placeholder="Bank name" />
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

    if (modeSelect) {
      updateAdjustmentField(row, modeSelect.value);
      modeSelect.addEventListener("change", () => {
        updateAdjustmentField(row, modeSelect.value);
      });
    }

    row.querySelectorAll(".miscAmount, .miscTds, .miscLd").forEach((input) => {
      input.addEventListener("input", () => {
        const err = row.querySelector(".miscRowError");
        if (err) {
          err.textContent = "";
          err.classList.add("hidden");
        }
        clearError();
        updateCollectionTotals();
        validateCollection(true);
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
          clearError();
          validateCollection(true);
        });
      });

    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        row.remove();
        updateCollectionTotals();
      });
    }

    miscList.appendChild(row);
  };

  const getMiscRowsData = () => {
    if (!miscList) return [];
    return Array.from(miscList.querySelectorAll(".collectionMiscRow")).map((row) => ({
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

  const getOutstandingAmount = () => {
    const invNo = dispositionInvoiceList && dispositionInvoiceList.length > 0
      ? dispositionInvoiceList[0]
      : currentInvoiceNoForDocs;
    const invoice = invNo ? currentInvoicesAll.find(inv => inv.invoiceNo === invNo) : null;
    return invoice ? Number(invoice.netDueAmount || 0) : 0;
  };

  const toggleCollectionModeFields = () => {
    const isMisc = instrumentModeSelect?.value === "Miscellenious";
    singleFields.forEach(el => el.classList.toggle("hidden", isMisc));
    if (miscFields) miscFields.classList.toggle("hidden", !isMisc);
    if (isMisc && miscList && miscList.children.length === 0) {
      createMiscRow("NEFT");
    }
    updateCollectionTotals();
  };

  const toggleCollectionFields = () => {
    if (!subStatusSelect || !collectionFields) return;
    const isCollection = subStatusSelect.value === "Collection";
    collectionFields.classList.toggle("hidden", !isCollection);
    if (isCollection) updateCollectionTotals();
  };

  if (subStatusSelect) {
    subStatusSelect.addEventListener("change", toggleCollectionFields);
    toggleCollectionFields();
  }

  if (instrumentModeSelect) {
    instrumentModeSelect.addEventListener("change", toggleCollectionModeFields);
    toggleCollectionModeFields();
  }

  if (addMiscBtn) {
    addMiscBtn.addEventListener("click", () => createMiscRow("NEFT"));
  }

  [amountEl, tdsEl, ldEl].forEach((el) => {
    if (!el) return;
    el.addEventListener("input", () => {
      clearError();
      updateCollectionTotals();
      validateCollection(true);
    });
  });

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".miscReadMore");
    if (!btn) return;
    openMiscDetailsModal(btn.getAttribute("data-details"));
  });

  if (!submitBtn) return;

  submitBtn.addEventListener("click", () => {
    const getValue = (id) => {
      const el = document.getElementById(id);
      return el ? String(el.value || "").trim() : "";
    };

    const invoices = dispositionInvoiceList && dispositionInvoiceList.length > 0
      ? dispositionInvoiceList
      : (currentInvoiceNoForDocs ? [currentInvoiceNoForDocs] : []);

    const remarkText = String(getValue("activityRemarks") || "").trim();
    const timestamp = new Date().toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });

    if (isManagerView) {
      if (remarkText) {
        const remarkPayload = {
          text: remarkText,
          authorRole: "manager",
          authorLabel: "Manager",
          timestamp,
          createdAt: new Date().toISOString()
        };
        (invoices.length > 0 ? invoices : []).forEach((invNo) => {
          addStoredRemark(invNo, remarkPayload);
        });
        const activeInv = invoices[0] || currentInvoiceNoForDocs;
        renderStoredRemarks(activeInv);
        if (remarksAccordion && window.bootstrap && window.bootstrap.Collapse) {
          const collapse = window.bootstrap.Collapse.getOrCreateInstance(remarksAccordion, { toggle: false });
          collapse.show();
        } else if (remarksAccordion) {
          remarksAccordion.classList.add("show");
        }
      }

      if (/@task\b/i.test(remarkText)) {
        const customer = customersData.find(c => c.id === selectedCustomerId);
        const invNo = invoices[0] || currentInvoiceNoForDocs;
        const invoice = invNo ? currentInvoicesAll.find(inv => inv.invoiceNo === invNo) : null;
        const cleanedText = remarkText.replace(/@task\b/gi, "").trim() || "Follow-up task";
        addTodoTask({
          text: cleanedText,
          dueDate: "",
          dueTime: "",
          customer,
          invoice,
          source: "remark"
        });
      }

      const remarkEl = document.getElementById("activityRemarks");
      if (remarkEl) remarkEl.value = "";
      setActiveTab("invoice");
      return;
    }

    if (!trail) return;
    clearError();
    const isCollection = getValue("subStatusSelect") === "Collection";
    const instrumentMode = getValue("collectionInstrumentMode");
    const isMisc = instrumentMode === "Miscellenious";
    const outstanding = getOutstandingAmount();
    const miscRows = isMisc ? getMiscRowsData() : [];

    let totalCollected = 0;
    if (isCollection) {
      if (isMisc) {
        miscRows.forEach((row) => {
          totalCollected += Number(row.amount || 0) + Number(row.tds || 0) + Number(row.ld || 0);
        });
      } else {
        totalCollected = Number(getValue("collectionAmount") || 0)
          + Number(getValue("collectionTds") || 0)
          + Number(getValue("collectionLd") || 0);
      }
    }

    if (!validateCollection(true)) return;

    const data = {
      activityType: getValue("activityTypeSelect"),
      broadStatus: getValue("broadStatusSelect"),
      primaryStatus: getValue("primaryStatusSelect"),
      subStatus: getValue("subStatusSelect"),
      remarks: remarkText,
      invoices,
      instrumentMode,
      instrumentRef: getValue("collectionInstrumentRef"),
      bank: getValue("collectionBank"),
      transferDate: getValue("collectionTransferDate"),
      amount: getValue("collectionAmount"),
      tds: getValue("collectionTds"),
      ld: getValue("collectionLd"),
      miscRows,
      totalCollected,
      outstanding
    };

    if (remarkText) {
      const remarkPayload = {
        text: remarkText,
        authorRole: "agent",
        authorLabel: "Agent",
        timestamp,
        createdAt: new Date().toISOString()
      };
      invoices.forEach((invNo) => {
        addStoredRemark(invNo, remarkPayload);
      });
      renderStoredRemarks(invoices[0] || currentInvoiceNoForDocs);
      if (remarksAccordion && window.bootstrap && window.bootstrap.Collapse) {
        const collapse = window.bootstrap.Collapse.getOrCreateInstance(remarksAccordion, { toggle: false });
        collapse.show();
      } else if (remarksAccordion) {
        remarksAccordion.classList.add("show");
      }
    }

    if (/@task\b/i.test(remarkText)) {
      const customer = customersData.find(c => c.id === selectedCustomerId);
      const invNo = dispositionInvoiceList && dispositionInvoiceList.length > 0
        ? dispositionInvoiceList[0]
        : currentInvoiceNoForDocs;
      const invoice = invNo ? currentInvoicesAll.find(inv => inv.invoiceNo === invNo) : null;
      const cleanedText = remarkText.replace(/@task\b/gi, "").trim() || "Follow-up task";
      addTodoTask({
        text: cleanedText,
        dueDate: "",
        dueTime: "",
        customer,
        invoice,
        source: "remark"
      });
    }

    const entry = buildStatusUpdateEntry(data);
    trail.prepend(entry);

    if (activityCollapse && window.bootstrap && window.bootstrap.Collapse) {
      const collapse = window.bootstrap.Collapse.getOrCreateInstance(activityCollapse, { toggle: false });
      collapse.show();
    } else if (activityCollapse) {
      activityCollapse.classList.add("show");
    }

    setActiveTab("invoice");

    const resetSelect = (id, value) => {
      const el = document.getElementById(id);
      if (!el) return;
      if (value !== undefined) el.value = value;
      else el.selectedIndex = 0;
    };

    resetSelect("activityTypeSelect");
    resetSelect("broadStatusSelect");
    resetSelect("primaryStatusSelect");
    resetSelect("subStatusSelect");

    ["activityRemarks", "collectionInstrumentRef", "collectionBank", "collectionTransferDate", "collectionAmount", "collectionTds", "collectionLd"]
      .forEach((id) => {
        const el = document.getElementById(id);
        if (el) el.value = "";
      });

    if (instrumentModeSelect) {
      instrumentModeSelect.value = "NEFT";
    }
    if (miscList) {
      miscList.innerHTML = "";
    }

    toggleCollectionModeFields();
    toggleCollectionFields();
  });
}

function wireDocsEvents() {
  const select = document.getElementById("docsInvoiceSelect");
  const clipBtn = document.getElementById("docsClipBtn");
  const picker = document.getElementById("docsPicker");

  if (select) {
    select.addEventListener("change", () => {
      currentDocsScope = select.value === "invoice" ? "invoice" : "customer";
      const customer = customersData.find(c => c.id === selectedCustomerId);
      if (customer) renderDocsList(customer);
    });
  }

  if (clipBtn && picker) {
    clipBtn.addEventListener("click", () => {
      const customer = customersData.find(c => c.id === selectedCustomerId);
      if (customer) renderDocsPicker(customer);
      picker.classList.toggle("hidden");
    });
  }

  document.addEventListener("change", (e) => {
    const chk = e.target.closest(".docPickChk");
    if (!chk) return;
    const customer = customersData.find(c => c.id === selectedCustomerId);
    if (!customer) return;
    const key = chk.getAttribute("data-doc-key");
    setDocSelected(customer.id, key, chk.checked);
  });

  document.addEventListener("click", (e) => {
    if (!picker || picker.classList.contains("hidden")) return;
    const clickedPicker = e.target.closest("#docsPicker");
    const clickedBtn = e.target.closest("#docsClipBtn");
    if (!clickedPicker && !clickedBtn) picker.classList.add("hidden");
  });
}

function wirePaginationEvents() {
  const wrap = document.getElementById("invoicePagination");
  if (!wrap) return;

  wrap.addEventListener("click", (e) => {
    const btn = e.target.closest("button[data-page]");
    if (!btn) return;
    if (btn.closest(".disabled")) return;

    const pageValue = btn.getAttribute("data-page") || "";
    if (pageValue === "prev") {
      if (currentPage > 1) currentPage -= 1;
    } else if (pageValue === "next") {
      const totalPages = Math.max(1, Math.ceil(currentInvoicesFiltered.length / pageSize));
      if (currentPage < totalPages) currentPage += 1;
    } else {
      const pageNum = Number(pageValue);
      if (!Number.isNaN(pageNum)) currentPage = pageNum;
    }

    closeFloatingMenu();
    applyFiltersAndRender();
  });
}

function wireInvoiceTableEvents() {
  const selectAll = document.getElementById("selectAllInvoices");
  const tbody = document.getElementById("invoiceTableBody");
  if (!selectAll || !tbody) return;

  selectAll.addEventListener("change", () => {
    const filterIds = currentInvoicesBaseFiltered.map(inv => inv.invoiceNo);
    if (selectAll.checked) {
      filterIds.forEach(invNo => selectedInvoiceNos.add(invNo));
    } else {
      filterIds.forEach(invNo => selectedInvoiceNos.delete(invNo));
    }

    applyFiltersAndRender();
  });

  tbody.addEventListener("change", (e) => {
    const t = e.target;
    if (t && t.classList && t.classList.contains("invChk")) {
      const invNo = t.getAttribute("data-inv");
      if (invNo) {
        if (t.checked) selectedInvoiceNos.add(invNo);
        else selectedInvoiceNos.delete(invNo);
      }
      applyFiltersAndRender();
    }
  });

  tbody.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    const iconFlat = e.target.closest(".iconFlat");
    const iconWrap = e.target.closest(".iconWrap");
    const chk = e.target.closest(".invChk");
    const row = e.target.closest("tr");

    if (row && !btn && !iconFlat && !iconWrap && !chk) {
      const activeRow = tbody.querySelector("tr.rowActive");
      if (activeRow && activeRow !== row) activeRow.classList.remove("rowActive");
      row.classList.add("rowActive");
      const invNo = row.querySelector(".invChk")?.getAttribute("data-inv");
      const invoice = currentInvoicesAll.find(inv => inv.invoiceNo === invNo);
      if (invoice) {
        renderInvoiceDetails(invoice);
        setActiveTab("invoice");
        currentInvoiceNoForDocs = invoice.invoiceNo;
        const customer = customersData.find(c => c.id === selectedCustomerId);
        if (customer) renderDocsList(customer);
      }
      closeFloatingMenu();
      return;
    }

  if (iconFlat) {
    const action = iconFlat.getAttribute("data-action");
    const invFromIcon = iconFlat.getAttribute("data-inv") || "";
    if (action === "email") {
      openEmailPanel(invFromIcon);
      return;
    }
    if (action === "target") {
      const modalEl = document.getElementById("targetCommitmentsModal");
      if (modalEl && typeof bootstrap !== "undefined") {
        const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
        modal.show();
      }
      return;
    }
  }

    if (!btn) return;

    const action = btn.getAttribute("data-action");
    const inv = btn.getAttribute("data-inv") || "";

    if (action === "new-activity") {
      openDispositionForSingleInvoice(inv);
      closeFloatingMenu();
      return; // stub
    }

    if (action === "open-menu") {
      openFloatingMenu(inv, btn);
      return;
    }
  });

  window.addEventListener("scroll", closeFloatingMenu, true);
  window.addEventListener("resize", closeFloatingMenu);
}

function wireBulkEvents() {
  const bulkNew = document.getElementById("bulkNewActivity");
  const bulkEmail = document.getElementById("bulkSendEmail");

  if (bulkNew) bulkNew.addEventListener("click", () => {
    openDispositionForBulkInvoices(Array.from(selectedInvoiceNos));
    return;
  });   // stub
  if (bulkEmail) bulkEmail.addEventListener("click", () => { return; }); // stub
}

function wireFloatingMenuEvents() {
  const menu = document.getElementById("rowActionMenu");
  if (!menu) return;

  menu.addEventListener("click", (e) => {
    const btn = e.target.closest("button");
    if (!btn) return;

    const action = btn.getAttribute("data-menu-action");
    if (action === "remarks" || action === "trail") {
      closeFloatingMenu();
      return; // stub
    }
  });

  document.addEventListener("click", (e) => {
    const clickedMenu = e.target.closest("#rowActionMenu");
    const clickedKebab = e.target.closest(".kebab");
    if (!clickedMenu && !clickedKebab) closeFloatingMenu();
  });
}

function wireTargetSummaryEvents() {
  const targetBtn = document.getElementById("centerTargetSummaryBtn");
  if (!targetBtn) return;

  targetBtn.addEventListener("click", openTargetSummaryModal);
  targetBtn.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openTargetSummaryModal();
    }
  });
}

function wireTodoEvents() {
  const todoHeaderBtn = document.getElementById("todoHeaderBtn");
  if (todoHeaderBtn) {
    todoHeaderBtn.addEventListener("click", () => setActiveTab("todo"));
  }

  const todoPanel = document.getElementById("todoPanel");
  const todoExtras = document.getElementById("todoExtras");
  const todoInput = document.getElementById("todoInput");
  const todoDueDate = document.getElementById("todoDueDate");
  const todoDueTime = document.getElementById("todoDueTime");
  const todoInvoiceSelect = document.getElementById("todoInvoiceSelect");
  const todoAddBtn = document.getElementById("todoAddBtn");
  const todoList = document.getElementById("todoList");
  const todoCompletedToggle = document.getElementById("todoCompletedToggle");

  const showExtras = (focusId) => {
    if (!todoExtras) return;
    if (todoExtras.classList.contains("hidden")) {
      todoExtras.classList.remove("hidden");
    }
    if (focusId) {
      const el = document.getElementById(focusId);
      if (el) el.focus();
    }
  };

  if (todoPanel) {
    todoPanel.addEventListener("click", (e) => {
      const btn = e.target.closest("button[data-action]");
      if (!btn) return;
      const action = btn.getAttribute("data-action");
      if (action === "toggle-extras") {
        if (todoExtras) {
          const willShow = todoExtras.classList.contains("hidden");
          todoExtras.classList.toggle("hidden", !willShow);
          if (willShow) {
            const el = document.getElementById("todoDueDate");
            if (el) el.focus();
          }
        }
      }
    });
  }

  if (todoCompletedToggle) {
    todoCompletedToggle.addEventListener("click", () => {
      todoShowCompleted = !todoShowCompleted;
      renderTodoList();
      updateTodoCompletedToggle();
    });
  }

  if (todoAddBtn) {
    todoAddBtn.addEventListener("click", () => {
      const text = todoInput ? todoInput.value.trim() : "";
      if (!text) return;
      const customer = customersData.find(c => c.id === selectedCustomerId);
      const invoiceNo = todoInvoiceSelect ? todoInvoiceSelect.value : "";
      const invoice = invoiceNo ? currentInvoicesAll.find(inv => inv.invoiceNo === invoiceNo) : null;

      addTodoTask({
        text,
        dueDate: todoDueDate ? todoDueDate.value : "",
        dueTime: todoDueTime ? todoDueTime.value : "",
        customer,
        invoice,
        source: "manual"
      });

      if (todoInput) todoInput.value = "";
      if (todoDueDate) todoDueDate.value = "";
      if (todoDueTime) todoDueTime.value = "";
      if (todoInvoiceSelect) todoInvoiceSelect.value = "";
    });
  }

  if (todoList) {
    todoList.addEventListener("change", (e) => {
      const chk = e.target.closest("input[data-action='complete']");
      if (!chk) return;
      const item = chk.closest(".todoItem");
      const taskId = item ? item.getAttribute("data-task-id") : "";
      if (!taskId) return;
      const task = todoTasks.find(entry => entry.id === taskId);
      if (task) {
        const wasCompleted = task.completed;
        task.completed = chk.checked;
        task.completedAt = task.completed ? new Date().toISOString() : "";
        if (!isManagerView && task.completed && !wasCompleted) {
          const customerLabel = task.customerName ? ` (${task.customerName})` : "";
          addManagerNotification({
            id: `notify-${Date.now()}`,
            type: "task-completed",
            message: `Task completed: ${task.text}${customerLabel}`,
            invoiceNo: task.invoice?.invoiceNo || "",
            createdAt: new Date().toISOString(),
            read: false
          });
        }
      }
      saveTodoTasksToStorage();
      renderTodoList();
      updateTodoBadge();
      updateManagerNotificationBadge();
    });

    todoList.addEventListener("click", (e) => {
      const link = e.target.closest("button[data-action='open-invoice']");
      if (!link) return;
      const invNo = link.getAttribute("data-inv");
      if (!invNo) return;
      if (selectInvoiceByNo(invNo)) {
        setActiveTab("invoice");
      }
    });
  }
}

function setDispositionReadOnly(readOnly) {
  const panel = document.getElementById("dispositionPanel");
  if (!panel) return;
  const controls = panel.querySelectorAll("select, input, textarea, button");
  controls.forEach((control) => {
    const id = control.id;
    if (id === "activityRemarks" || id === "submitActivityBtn" || id === "dispositionCloseBtn") {
      control.disabled = false;
      return;
    }
    control.disabled = readOnly;
  });
  panel.classList.toggle("is-readonly", readOnly);

  const title = panel.querySelector(".dispositionTitle");
  if (title) title.textContent = readOnly ? "Add remarks" : "Update Disposition";
  const submitBtn = document.getElementById("submitActivityBtn");
  if (submitBtn) submitBtn.textContent = readOnly ? "Add remarks" : "Submit activity";
}

function wireCnAdvPdcEvents() {
  const stat = document.getElementById("centerCnAdvPdcStat");
  if (stat) {
    stat.addEventListener("click", openCnAdvPdcModal);
    stat.addEventListener("keydown", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        openCnAdvPdcModal();
      }
    });
  }

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".cnAdvSort");
    if (!btn) return;
    const key = btn.getAttribute("data-sort-key");
    if (!key) return;

    const type = cnAdvPdcSortConfig[key] || "text";
    let dir = "asc";
    if (cnAdvPdcSortState.key === key) {
      dir = cnAdvPdcSortState.dir === "asc" ? "desc" : "asc";
    } else {
      dir = type === "text" ? "asc" : "desc";
    }

    cnAdvPdcSortState = { key, dir };
    const sorted = sortCnAdvPdcRows(currentCnAdvPdcRows, key, dir);
    renderCnAdvPdcTable(sorted);
  });
}

function wireNotificationEvents() {
  const modalEl = document.getElementById("notificationModal");
  if (!modalEl) return;

  document.addEventListener("click", (e) => {
    const btn = e.target.closest(".notificationReadMore");
    if (!btn) return;

    const customer = customersData.find(c => c.id === selectedCustomerId);
    const details = getNotificationDetails(customer);

    setDetailValue("notificationSendTo", details.sendTo);
    setDetailValue("notificationCc", details.cc);
    setDetailValue("notificationFrom", details.from);
    setDetailValue("notificationSubject", details.subject);

    const bodyEl = document.getElementById("notificationBody");
    if (bodyEl) bodyEl.textContent = details.body;

    const attachEl = document.getElementById("notificationAttachments");
    if (attachEl) attachEl.textContent = details.attachments.join(", ");

    const modal = bootstrap.Modal.getOrCreateInstance(modalEl);
    modal.show();
  });
}

// ===============================
// Init
// ===============================
function applyTenantBrand() {
  const tenantSelect = document.getElementById("tenantSelect");
  const relationshipName = document.getElementById("relationshipName");
  const relationshipLogo = document.getElementById("relationshipLogo");

  if (!tenantSelect) return;

  const brand = tenantBrandMap[tenantSelect.value];
  if (!brand) return;

  if (relationshipName) relationshipName.textContent = brand.name;
  if (relationshipLogo) relationshipLogo.textContent = brand.badge;
}

function initUserSelect() {
  const userSelect = document.getElementById("userSelect");
  if (!userSelect) return;

  const headerUserDirectory = {
    agents: [
      "Aditi Sharma",
      "Manish Kumar",
      "Palak Choudhary",
      "Abhishek Sharma",
      "Sakshi Sharma"
    ],
    managers: ["Mukesh Mishra"]
  };

  userSelect.innerHTML = "";

  const addGroup = (label, users) => {
    const group = document.createElement("optgroup");
    group.label = label;
    users.forEach((name) => {
      const option = document.createElement("option");
      option.value = name;
      option.textContent = name;
      group.appendChild(option);
    });
    userSelect.appendChild(group);
  };

  addGroup("Agents", headerUserDirectory.agents);
  addGroup("Managers", headerUserDirectory.managers);

  const allUsers = [...headerUserDirectory.agents, ...headerUserDirectory.managers];
  const storedName = localStorage.getItem("activeUserName");
  const fallbackName = headerUserDirectory.agents[0];
  const selectedName = allUsers.includes(storedName) ? storedName : fallbackName;

  userSelect.value = selectedName;
  const role = headerUserDirectory.managers.includes(selectedName) ? "manager" : "agent";
  localStorage.setItem("activeUserName", selectedName);
  localStorage.setItem("activeUserRole", role);

  userSelect.addEventListener("change", () => {
    const name = userSelect.value;
    const nextRole = headerUserDirectory.managers.includes(name) ? "manager" : "agent";
    localStorage.setItem("activeUserName", name);
    localStorage.setItem("activeUserRole", nextRole);
  });
}

function wireSideNavEvents() {
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
      const item = event.target.closest(".sideNavItem[data-module]");
      if (!item) return;
      const moduleKey = item.getAttribute("data-module");
      const destinations = {
        "visit": "visitmodule.html",
        "visit-review": "visitmoduleReview.html",
        "landing": "index.html",
        "landing-manager": "LPmanager.html"
      };
      const target = destinations[moduleKey];
      if (target) window.location.href = target;
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const tenantSelect = document.getElementById("tenantSelect");
  if (tenantSelect) tenantSelect.addEventListener("change", applyTenantBrand);
  applyTenantBrand();
  initUserSelect();
  wireSideNavEvents();

  const search = document.getElementById("customerSearch");
  if (search) {
    search.addEventListener("input", () => {
      renderCustomers(getFilteredCustomers(), selectedCustomerId);
    });
  }

  const customerSortSelect = document.getElementById("customerSortSelect");
  if (customerSortSelect) {
    customerSortSelect.addEventListener("change", () => {
      renderCustomers(getFilteredCustomers(), selectedCustomerId);
    });
  }

  wireTabEvents();
  wireContactEvents();
  wireDispositionEvents();
  wireDispositionActivityEvents();
  wireEmailPanelEvents();
  wireDocsEvents();
  wireFilterEvents();
  wirePaginationEvents();
  wireInvoiceTableEvents();
  wireBulkEvents();
  wireFloatingMenuEvents();
  wireNotificationEvents();
  wireTargetSummaryEvents();
  wireTodoEvents();
  wireCnAdvPdcEvents();

  loadTodoTasksFromStorage();
  updateManagerNotificationBadge();

  const notificationBellBtn = document.getElementById("notificationBellBtn");
  if (notificationBellBtn) {
    notificationBellBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleNotificationPopup();
    });
  }

  const notificationPopup = document.getElementById("notificationPopup");
  if (notificationPopup) {
    notificationPopup.addEventListener("click", (event) => {
      const item = event.target.closest(".notificationItem");
      if (!item) return;
      const invNo = item.getAttribute("data-inv");
      if (invNo && selectInvoiceByNo(invNo)) {
        setActiveTab("invoice");
      }
    });
  }

  document.addEventListener("click", (event) => {
    const popup = document.getElementById("notificationPopup");
    const wrap = document.querySelector(".notificationBellWrap");
    if (!popup || popup.classList.contains("hidden")) return;
    if (wrap && wrap.contains(event.target)) return;
    popup.classList.add("hidden");
  });

  window.addEventListener("storage", (event) => {
    if (event.key === managerNotificationsKey) {
      updateManagerNotificationBadge();
      const popup = document.getElementById("notificationPopup");
      if (popup && !popup.classList.contains("hidden")) {
        renderNotificationPopup();
      }
    }
    if (event.key === todoStorageKey) {
      loadTodoTasksFromStorage();
      renderTodoList();
      updateTodoBadge();
    }
    if (event.key === remarksStorageKey) {
      renderStoredRemarks(currentInvoiceNoForDocs);
    }
  });

  const bulkNew = document.getElementById("bulkNewActivity");
  if (bulkNew && isManagerView) {
    bulkNew.textContent = "Add remarks";
  }

  renderCustomers(getFilteredCustomers(), selectedCustomerId);
  const first = customersData.find(c => c.id === selectedCustomerId) || customersData[0];
  if (first) {
    renderCenter(first);
    currentInvoicesAll = first.invoices || [];
    populateFilters(currentInvoicesAll);
    renderCustomerDetails(first);
    renderInvoiceDetails(null);
    setActiveTab("customer");
    renderDocsInvoiceSelect(first);
    renderDocsList(first);
    renderDocsPicker(first);
    resetDispositionState();
    renderTodoInvoiceOptions();
    renderTodoList();
    updateTodoBadge();
    applyFiltersAndRender();
  }
});




