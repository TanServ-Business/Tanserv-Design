// ===============================
// Tenant - Relationship branding (prototype wiring)
// ===============================
const tenantBrandMap = {
  apollo: { name: "Apollo", badge: "AP", logo: "assets/apollo-tyres-logo.svg" },
  bikanerwala: { name: "Bikanerwala", badge: "BK" },
  global_ar: { name: "Global AR", badge: "GA" }
};

const headerDirectoryContacts = {
  internal: [
    { name: "Rohit Mehra", email: "rohit.mehra@inebura.com", phone: "-" },
    { name: "Mukesh Mishra", email: "mukesh.mishra@inebura.com", phone: "-" },
    { name: "Ops Supervisor", email: "supervisor@inebura.com", phone: "-" },
    { name: "Escalations Desk", email: "escalations@inebura.com", phone: "-" }
  ]
};

const userRoleLabels = {
  agent: "Agent",
  customer: "Customer",
  manager: "Manager",
  agent_manager: "Agent cum manager",
  supervisor: "Supervisor"
};

const userAvatarOptions = [
  "assets/avatar/avatar_02_50x50.png",
  "assets/avatar/avatar_03_50x50.png",
  "assets/avatar/avatar_04_50x50.png",
  "assets/avatar/avatar_05_50x50.png",
  "assets/avatar/avatar_06_50x50.png",
  "assets/avatar/avatar_07_50x50.png",
  "assets/avatar/avatar_08_50x50.png",
  "assets/avatar/avatar_11_50x50.png",
  "assets/avatar/avatar_12_50x50.png",
  "assets/avatar/avatar_13_50x50.png",
  "assets/avatar/avatar_14_50x50.png",
  "assets/avatar/avatar_15_50x50.png",
  "assets/avatar/avatar_16_50x50.png",
  "assets/avatar/avatar_17_50x50.png",
  "assets/avatar/avatar_18_50x50.png",
  "assets/avatar/avatar_19_50x50.png",
  "assets/avatar/avatar_20_50x50.png",
  "assets/avatar/avatar_21_50x50.png",
  "assets/avatar/avatar_22_50x50.png",
  "assets/avatar/avatar_23_50x50.png",
  "assets/avatar/avatar_24_50x50.png",
  "assets/avatar/avatar_25_50x50.png",
  "assets/avatar/avatar_26_50x50.png",
  "assets/avatar/avatar_27_50x50.png",
  "assets/avatar/avatar_28_50x50.png",
  "assets/avatar/avatar_29_50x50.png",
  "assets/avatar/avatar_30_50x50.png",
  "assets/avatar/avatar_31_50x50.png",
  "assets/avatar/avatar_32_50x50.png",
  "assets/avatar/avatar_33_50x50.png",
  "assets/avatar/avatar_34_50x50.png",
  "assets/avatar/avatar_35_50x50.png",
  "assets/avatar/avatar_37_50x50.png",
  "assets/avatar/avatar_38_50x50.png",
  "assets/avatar/avatar_39_50x50.png",
  "assets/avatar/avatar_40_50x50.png",
  "assets/avatar/avatar_41_50x50.png",
  "assets/avatar/avatar_42_50x50.png",
  "assets/avatar/avatar_43_50x50.png",
  "assets/avatar/avatar_44_50x50.png",
  "assets/avatar/avatar_45_50x50.png",
  "assets/avatar/avatar_46_50x50.png",
  "assets/avatar/avatar_47_50x50.png",
  "assets/avatar/avatar_48_50x50.png",
  "assets/avatar/avatar_49_50x50.png",
  "assets/avatar/avatar_50_50x50.png"
];

let activeDirectoryFilter = "all";
let directorySearchQuery = "";

const urlParams = new URLSearchParams(window.location.search);
const isManagerView = urlParams.get("role") === "manager";
const lpMode = String(document.body.dataset.lpMode || "").trim().toLowerCase();
const isCustomerLandingView = lpMode === "customer";
const managerAgentData = [
  { name: "Aditi Sharma", portfolio: 15250000, target: 650000 },
  { name: "Manish Kumar", portfolio: 13500000, target: 600000 },
  { name: "Palak Choudhary", portfolio: 12850000, target: 550000 },
  { name: "Abhishek Sharma", portfolio: 14200000, target: 620000 },
  { name: "Sakshi Sharma", portfolio: 11950000, target: 520000 }
];
const initialAgentParam = urlParams.get("agent");
const todoStorageKey = "ineburaTodoTasks";
const remarksStorageKey = "ineburaRemarksByInvoice";
const activityTrailStorageKey = "ineburaActivityTrailByInvoice";
const managerNotificationsKey = "ineburaManagerNotifications";
const pdcNotificationKey = "ineburaPdcNotifications";
const pdcStorageKey = "ineburaPdcRecords";
const notificationCenterKey = "ineburaNotificationCenter";
const invoiceStatusOverridesKey = "ineburaInvoiceStatusOverrides";
const issueTrackerTotalKey = "issueTrackerTotalIssues";
const issueTrackerBaseKey = "issueTrackerBaseData";
const issueTrackerCustomKey = "customIssues";
const issueTrackerProcessKey = "approval_processes";
const issueTrackerMatrixKey = "approval_matrices";
const issueTrackerClearedKey = "issueTrackerDataCleared";

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

const readStoredArray = (key) => {
  try {
    const raw = localStorage.getItem(key);
    const parsed = JSON.parse(raw || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch (_) {
    return [];
  }
};

const countIssueTrackerBaseIssues = () => {
  const base = readStoredArray(issueTrackerBaseKey);
  if (!base.length) return 0;
  return base.reduce((sum, inv) => sum + (Array.isArray(inv?.issues) ? inv.issues.length : 0), 0);
};

const computeIssueTrackerTotal = () => {
  if (localStorage.getItem(issueTrackerClearedKey) === "1") return 0;
  const baseCount = countIssueTrackerBaseIssues();
  const customCount = readStoredArray(issueTrackerCustomKey).length;
  return baseCount + customCount;
};

const getIssueTrackerTotal = () => {
  if (localStorage.getItem(issueTrackerClearedKey) === "1") return 0;
  const raw = localStorage.getItem(issueTrackerTotalKey);
  const parsed = Number(raw);
  if (Number.isFinite(parsed)) return Math.max(0, Math.floor(parsed));
  const base = readStoredArray(issueTrackerBaseKey);
  const custom = readStoredArray(issueTrackerCustomKey);
  if (!base.length && !custom.length) return null;
  return countIssueTrackerBaseIssues() + custom.length;
};

const syncIssueTrackerTotal = () => {
  const total = computeIssueTrackerTotal();
  try { localStorage.setItem(issueTrackerTotalKey, String(total)); } catch (_) {}
  return total;
};

const findApprovalProcessId = (processName) => {
  if (!processName) return "";
  const processes = readStoredArray(issueTrackerProcessKey);
  const match = processes.find((proc) => String(proc?.process || "").trim() === processName);
  return match?.id || "";
};

const findApprovalMatrixForProcess = (processName) => {
  if (!processName) return { id: "", name: "" };
  const processes = readStoredArray(issueTrackerProcessKey);
  const matrices = readStoredArray(issueTrackerMatrixKey);
  const match = processes.find((proc) => String(proc?.process || "").trim() === processName);
  const matrixId = match?.matrixId || "";
  const matrix = matrices.find((mat) => mat?.id === matrixId);
  return { id: matrixId || "", name: matrix?.name || "" };
};

const findApprovalProcessByName = (processName) => {
  if (!processName) return null;
  const processes = readStoredArray(issueTrackerProcessKey);
  return processes.find((proc) => String(proc?.process || "").trim() === processName) || null;
};

const findApprovalMatrixById = (matrixId) => {
  if (!matrixId) return null;
  const matrices = readStoredArray(issueTrackerMatrixKey);
  return matrices.find((mat) => mat?.id === matrixId) || null;
};

const parseAmount = (value) => {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;
  if (value == null) return 0;
  const cleaned = String(value).replace(/[^0-9.-]/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

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
        primaryStatus: "No Due",
        status: "Within Credit Period/Days",
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
        primaryStatus: "Part Collected",
        status: "Part Payment Made",
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
        primaryStatus: "Further Docs Required",
        status: "Invoice Copy Required",
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
        primaryStatus: "Collection In Progress",
        status: "Call Back",
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
        primaryStatus: "Collection In Progress",
        status: "PDC Given",
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
        primaryStatus: "Invoice Assignment",
        status: "Assign the Invoice to Others",
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
        primaryStatus: "Guidance",
        status: "Recommended For Legal",
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
        primaryStatus: "Further Action Required",
        status: "Credit Note To Be Issued",
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
        primaryStatus: "Material Delivery Issues",
        status: "Material Not Received",
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
        primaryStatus: "Collected",
        status: "Collected",
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
        primaryStatus: "No Due",
        status: "As Per Payment Terms",
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
        primaryStatus: "Part Collected",
        status: "Part Payment through LC done",
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
        primaryStatus: "Collection In Progress",
        status: "Funds Issue",
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
        primaryStatus: "Collection In Progress",
        status: "Call Back/Email Follow up",
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
        primaryStatus: "Further Docs Required",
        status: "PO (Purchase Order) Copy Required",
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
        primaryStatus: "Further Action Required",
        status: "Wrong/Incorrect Billing",
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
        primaryStatus: "Service Related Issues",
        status: "Equipment Not Working",
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
        primaryStatus: "Guidance",
        status: "Shifted - Address Not Found",
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
        primaryStatus: "No Due",
        status: "Retention Amount",
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
        primaryStatus: "Further Docs Required",
        status: "Delivery Challan Required",
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
        primaryStatus: "Further Action Required",
        status: "Tax Issue On The Invoice",
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
        primaryStatus: "Material Delivery Issues",
        status: "Late Shipment",
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
        primaryStatus: "Service Related Issues",
        status: "Installation Pending",
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
        primaryStatus: "Guidance",
        status: "Send Pre-Legal Letter",
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
        primaryStatus: "Collection In Progress",
        status: "Recon Required",
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
        primaryStatus: "Part Collected",
        status: "Part Payment Made",
        targetForMonth: 50000,
        unreadEmailCount: 1
      }
    ]
  }
];

function loadInvoiceStatusOverrides() {
  try {
    const raw = localStorage.getItem(invoiceStatusOverridesKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (_) {
    return {};
  }
}

function saveInvoiceStatusOverrides(map) {
  try {
    localStorage.setItem(invoiceStatusOverridesKey, JSON.stringify(map || {}));
  } catch (_) {}
}

function upsertInvoiceStatusOverride(invoiceNo, payload) {
  if (!invoiceNo || !payload || typeof payload !== "object") return;
  const map = loadInvoiceStatusOverrides();
  const existing = map[invoiceNo] && typeof map[invoiceNo] === "object" ? map[invoiceNo] : {};
  const next = {
    broadStatus: payload.broadStatus || existing.broadStatus || "",
    primaryStatus: payload.primaryStatus || existing.primaryStatus || "",
    subStatus: payload.subStatus || existing.subStatus || "",
    status: payload.status || payload.subStatus || existing.status || "",
    updatedAt: payload.updatedAt || new Date().toISOString(),
    updatedBy: payload.updatedBy || existing.updatedBy || ""
  };
  map[invoiceNo] = next;
  saveInvoiceStatusOverrides(map);
}

function applyInvoiceStatusOverrides(records) {
  if (!Array.isArray(records) || records.length === 0) return;
  const map = loadInvoiceStatusOverrides();
  if (!map || typeof map !== "object") return;
  records.forEach((customer) => {
    (customer?.invoices || []).forEach((invoice) => {
      const override = map[invoice?.invoiceNo];
      if (!override || typeof override !== "object") return;
      if (override.broadStatus) invoice.broadStatus = override.broadStatus;
      if (override.primaryStatus) invoice.primaryStatus = override.primaryStatus;
      if (override.subStatus) invoice.subStatus = override.subStatus;
      if (override.status || override.subStatus) {
        invoice.status = override.status || override.subStatus;
      }
    });
  });
}

const normalizeLpCustomerCode = (value) => String(value || "").trim().toUpperCase();

const resolveLandingCustomerCode = () => {
  if (!isCustomerLandingView) return "";
  const queryCode = normalizeLpCustomerCode(urlParams.get("customerCode"));
  if (queryCode) return queryCode;
  const storedCode = normalizeLpCustomerCode(localStorage.getItem("activeCustomerCode"));
  if (storedCode) return storedCode;
  return "";
};

if (isCustomerLandingView) {
  const requestedCode = resolveLandingCustomerCode();
  const activeCustomer = customersData.find((customer) => (
    normalizeLpCustomerCode(customer.code) === requestedCode
  )) || customersData[0] || null;

  if (activeCustomer) {
    customersData.splice(0, customersData.length, activeCustomer);
    const activeCode = normalizeLpCustomerCode(activeCustomer.code);
    try {
      localStorage.setItem("activeCustomerCode", activeCustomer.code || "");
      localStorage.setItem("activeCustomerName", activeCustomer.name || "");
      localStorage.setItem("activeUserRole", "customer");
    } catch (_) {}

    const currentQueryCode = normalizeLpCustomerCode(urlParams.get("customerCode"));
    if (activeCode && activeCode !== currentQueryCode) {
      const nextUrl = new URL(window.location.href);
      nextUrl.searchParams.set("customerCode", activeCode);
      window.history.replaceState({}, "", nextUrl.toString());
    }
  }
}

applyInvoiceStatusOverrides(customersData);

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

const workInProgressPrimaries = new Set([
  "no due",
  "part collected",
  "collection in progress",
  "invoice assignment"
]);

const externalDependencyPrimaries = new Set([
  "further docs required",
  "further action required",
  "material delivery issues",
  "service related issues"
]);

function statusPillClassByLabel(status) {
  const s = String(status || "").toLowerCase();
  if (s.includes("overdue") || s.includes("post")) return "overdue";
  if (s.includes("pre")) return "predue";
  if (s.includes("dispute")) return "dispute";
  if (s.includes("ptp")) return "ptp";
  if (s.includes("pdc")) return "pdc";
  if (s.includes("collect")) return "collected";
  return "predue";
}

function statusPillClass(status, primaryStatus) {
  const primary = String(primaryStatus || "").toLowerCase();
  if (primary === "guidance") return "guidance";
  if (primary === "ptp") return "ptp-primary";
  if (externalDependencyPrimaries.has(primary)) return "external-dependency";
  if (workInProgressPrimaries.has(primary)) return "work-in-progress";
  return statusPillClassByLabel(status);
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

function loadActivityTrailMap() {
  try {
    const raw = localStorage.getItem(activityTrailStorageKey);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch (err) {
    console.warn("Unable to load activity trail", err);
    return {};
  }
}

function saveActivityTrailMap(map) {
  try {
    localStorage.setItem(activityTrailStorageKey, JSON.stringify(map));
  } catch (err) {
    console.warn("Unable to save activity trail", err);
  }
}

function addActivityTrailEntry(invoiceNo, payload) {
  if (!invoiceNo || !payload) return;
  const map = loadActivityTrailMap();
  if (!Array.isArray(map[invoiceNo])) map[invoiceNo] = [];
  if (payload.id) {
    const exists = map[invoiceNo].some((item) => item && item.id === payload.id);
    if (exists) return;
  }
  map[invoiceNo].unshift(payload);
  saveActivityTrailMap(map);
}

function buildActivityTrailNode(payload) {
  if (!payload || !payload.type) return null;
  if (payload.type === "status") return buildStatusUpdateEntry(payload.data || {});
  if (payload.type === "issue") {
    const event = payload.event || {};
    return buildIssueTrailEntry({
      ...event,
      title: "Issue tracker update",
      badge: "Issue tracker update",
      eventClass: "event-issue"
    });
  }
  if (payload.type === "email") return buildEmailTrailEntry(payload.data || {});
  return null;
}

function renderStoredActivityTrail(invoiceNo) {
  const list = document.getElementById("activityTrailList");
  if (!list) return;
  if (!invoiceNo) {
    list.innerHTML = `<div class="eventMeta">Select an invoice to view activity.</div>`;
    return;
  }
  syncIssueTrackerTrailForInvoice(invoiceNo);
  const map = loadActivityTrailMap();
  const entries = Array.isArray(map[invoiceNo]) ? map[invoiceNo] : [];
  if (entries.length === 0) {
    list.innerHTML = `<div class="eventMeta">No activity yet.</div>`;
    return;
  }
  list.innerHTML = "";
  const sorted = entries.slice().sort((a, b) => {
    const aTime = Date.parse(a?.at || a?.when || "") || 0;
    const bTime = Date.parse(b?.at || b?.when || "") || 0;
    if (aTime !== bTime) return bTime - aTime;
    const aSeq = Number.isFinite(a?.sequence) ? a.sequence : null;
    const bSeq = Number.isFinite(b?.sequence) ? b.sequence : null;
    if (aSeq != null || bSeq != null) {
      if (aSeq == null) return 1;
      if (bSeq == null) return -1;
      if (aSeq !== bSeq) return aSeq - bSeq;
    }
    return 0;
  });
  sorted.forEach((payload) => {
    const node = buildActivityTrailNode(payload);
    if (node) list.appendChild(node);
  });

  if (!list.dataset.emailTrailBound) {
    list.dataset.emailTrailBound = "true";
    list.addEventListener("click", (event) => {
      const btn = event.target.closest(".emailTrailReadMore");
      if (!btn) return;
      const raw = btn.getAttribute("data-email") || "";
      let payload;
      try {
        payload = JSON.parse(decodeURIComponent(raw));
      } catch (_) {
        return;
      }
      const invoices = Array.isArray(payload.invoices) ? payload.invoices : [];
      const invNo = invoices[0] || currentInvoiceNoForDocs || "";
      openEmailPanel(invNo);
      setActiveTab("invoice");

      const detailEmpty = document.getElementById("emailDetailEmpty");
      const detailContent = document.getElementById("emailDetailContent");
      if (detailEmpty) detailEmpty.classList.add("hidden");
      if (detailContent) detailContent.classList.remove("hidden");
      setDetailValue("emailDetailFrom", payload.from || "-");
      setDetailValue("emailDetailTo", payload.to || "-");
      setDetailValue("emailDetailCc", payload.cc || "-");
      setDetailValue("emailDetailSubject", payload.subject || "-");
      renderEmailConversation("emailDetailBody", [{
        from: payload.from || "-",
        to: payload.to || "-",
        cc: payload.cc || "-",
        mailbox: "Email",
        date: payload.at || "-",
        time: "-",
        subject: payload.subject || "-",
        attachments: Array.isArray(payload.attachments) && payload.attachments.length
          ? payload.attachments.join(", ")
          : "-",
        body: payload.body || "-"
      }]);
    });
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
  addNotificationCenterItem({
    id: notification.id,
    type: notification.type || "manager",
    title: "Manager update",
    message: notification.message || "",
    createdAt: notification.createdAt,
    read: notification.read,
    audience: ["manager"],
    details: [
      { label: "Invoice", value: notification.invoiceNo || "-" }
    ]
  });
}

function loadNotificationCenter() {
  try {
    const raw = localStorage.getItem(notificationCenterKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Unable to load notification center", err);
    return [];
  }
}

function saveNotificationCenter(list) {
  try {
    localStorage.setItem(notificationCenterKey, JSON.stringify(list));
  } catch (err) {
    console.warn("Unable to save notification center", err);
  }
}

function addNotificationCenterItem(note) {
  const list = loadNotificationCenter();
  const payload = {
    id: note.id || `note-${Date.now()}`,
    type: note.type || "general",
    title: note.title || "Notification",
    message: note.message || "",
    createdAt: note.createdAt || new Date().toISOString(),
    scheduledFor: note.scheduledFor || "",
    sentAt: note.sentAt || "",
    read: Boolean(note.read),
    audience: Array.isArray(note.audience) ? note.audience : (note.audience ? [note.audience] : ["all"]),
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
  return payload;
}

function normalizeNotificationCenter() {
  const list = loadNotificationCenter();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let changed = false;
  const updated = list.map((note) => {
    if (note.scheduledFor && !note.sentAt) {
      const scheduledDate = new Date(note.scheduledFor);
      if (!Number.isNaN(scheduledDate.getTime())) {
        scheduledDate.setHours(0, 0, 0, 0);
        if (scheduledDate.getTime() <= today.getTime()) {
          note.sentAt = new Date().toISOString();
          changed = true;
        }
      }
    }
    return note;
  });
  if (changed) saveNotificationCenter(updated);
  return updated;
}

function getNotificationAudience() {
  if (isCustomerLandingView) return "customer";
  if (isManagerView) return "manager";
  const role = String(localStorage.getItem("activeUserRole") || "").trim().toLowerCase();
  if (role === "manager") return "manager";
  if (role === "customer") return "customer";
  return "agent";
}

function getVisibleNotificationCenter() {
  const audience = getNotificationAudience();
  return normalizeNotificationCenter().filter((note) => {
    if (note.scheduledFor && !note.sentAt) return false;
    const audiences = Array.isArray(note.audience) ? note.audience : (note.audience ? [note.audience] : []);
    if (audiences.length === 0) return true;
    return audiences.includes("all") || audiences.includes(audience);
  });
}

function getNotificationCenterItemById(noteId) {
  if (!noteId) return null;
  return normalizeNotificationCenter().find((note) => note.id === noteId) || null;
}

function markNotificationCenterRead() {
  const list = loadNotificationCenter();
  const visibleIds = new Set(getVisibleNotificationCenter().map(note => note.id));
  const updated = list.map((note) => {
    if (visibleIds.has(note.id)) return { ...note, read: true };
    return note;
  });
  saveNotificationCenter(updated);
}

function syncLegacyNotificationsToCenter() {
  const center = loadNotificationCenter();
  const existingIds = new Set(center.map(note => note.id));
  const additions = [];

  loadManagerNotifications().forEach((note) => {
    if (!note || existingIds.has(note.id)) return;
    additions.push({
      id: note.id,
      type: note.type || "manager",
      title: "Manager update",
      message: note.message || "",
      createdAt: note.createdAt,
      read: note.read,
      audience: ["manager"],
      details: [
        { label: "Invoice", value: note.invoiceNo || "-" }
      ]
    });
  });

  const pdcRecords = new Map(loadPdcRecords().map(record => [record.id, record]));
  loadPdcNotifications().forEach((note) => {
    if (!note || existingIds.has(note.id)) return;
    const record = note.pdcId ? pdcRecords.get(note.pdcId) : null;
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

  try {
    const rawTodos = localStorage.getItem(todoStorageKey);
    const todoList = rawTodos ? JSON.parse(rawTodos) : [];
    if (Array.isArray(todoList)) {
      todoList.forEach((task) => {
        const todoId = `todo-${task.id}`;
        if (existingIds.has(todoId)) return;
        additions.push({
          id: todoId,
          type: "todo",
          title: "Todo reminder",
          message: task.text || "Todo update",
          createdAt: task.createdAt || new Date().toISOString(),
          read: Boolean(task.completed),
          audience: ["agent", "manager"],
          details: [
            { label: "Due", value: formatTodoDue(task) },
            { label: "Customer", value: `${task.customerName || "-"} (${task.customerCode || "-"})` },
            { label: "Invoice", value: task.invoice?.invoiceNo || "-" }
          ],
          ctas: [
            { label: "Open todo", action: "open-todo" }
          ]
        });
      });
    }
  } catch (err) {
    console.warn("Unable to sync todo notifications", err);
  }

  if (additions.length > 0) {
    saveNotificationCenter(additions.concat(center));
  }
}

function seedNotificationCenter() {
  const list = loadNotificationCenter();
  const existingIds = new Set(list.map(item => item.id));
  const customer = customersData[0];
  const customerTwo = customersData[1];
  const invoice = customer?.invoices?.[0];
  const invoiceTwo = customerTwo?.invoices?.[1];
  const now = new Date().toISOString();
  const seeds = [
    {
      id: "seed-visit-approval",
      type: "visit-approval",
      title: "Visit approval pending",
      message: "Visit request awaiting approval from manager.",
      createdAt: now,
      audience: ["manager"],
      details: [
        { label: "Customer", value: customer ? `${customer.name} (${customer.code})` : "-" },
        { label: "Visit date", value: customer?.grnDate || "-" },
        { label: "Location", value: customer?.city || "-" },
        { label: "Requested by", value: customer?.agentName || "-" }
      ],
      ctas: [
        { label: "Review visit", action: "link", href: "pages/visitmoduleReview.html" }
      ]
    },
    {
      id: "seed-visit-followup",
      type: "visit-approval",
      title: "Visit follow-up",
      message: "Visit report is ready for review.",
      createdAt: now,
      audience: ["manager", "agent"],
      details: [
        { label: "Customer", value: customerTwo ? `${customerTwo.name} (${customerTwo.code})` : "-" },
        { label: "Visit date", value: customerTwo?.grnDate || "-" },
        { label: "Location", value: customerTwo?.city || "-" },
        { label: "Requested by", value: customerTwo?.agentName || "-" }
      ],
      ctas: [
        { label: "Open visit", action: "link", href: "pages/visitmodule.html" }
      ]
    },
    {
      id: "seed-email",
      type: "email",
      title: "New email received",
      message: `Reply from ${customer?.name || "customer"} about ${invoice?.invoiceNo || "invoice"}.`,
      createdAt: now,
      audience: ["agent", "manager"],
      details: [
        { label: "From", value: customer?.contacts?.[0]?.email || "-" },
        { label: "To", value: "ops@inebura.com" },
        { label: "Subject", value: `Re: ${invoice?.invoiceNo || "-"}` }
      ],
      ctas: [
        { label: "View email", action: "open-email", invoiceNo: invoice?.invoiceNo || "" }
      ]
    },
    {
      id: "seed-email-reminder",
      type: "email",
      title: "Email reminder",
      message: `Payment reminder sent to ${customerTwo?.name || "customer"}.`,
      createdAt: now,
      audience: ["agent", "manager"],
      details: [
        { label: "From", value: "ops@inebura.com" },
        { label: "To", value: customerTwo?.contacts?.[0]?.email || "-" },
        { label: "Subject", value: `Payment reminder for ${invoiceTwo?.invoiceNo || "-"}` }
      ],
      ctas: [
        { label: "View email", action: "open-email", invoiceNo: invoiceTwo?.invoiceNo || "" }
      ]
    },
    {
      id: "seed-commitment-approved",
      type: "commitment-approved",
      title: "Commitment approved",
      message: "Commitment approved by finance team.",
      createdAt: now,
      audience: ["manager", "agent"],
      details: [
        { label: "Customer", value: customer ? `${customer.name} (${customer.code})` : "-" },
        { label: "Invoice", value: invoice?.invoiceNo || "-" },
        { label: "Amount", value: invoice?.netDueAmount ? `Rs. ${formatINR(invoice.netDueAmount)}` : "-" },
        { label: "Commitment date", value: invoice?.dueDate || "-" }
      ],
      ctas: [
        { label: "Open invoice", action: "open-invoice", invoiceNo: invoice?.invoiceNo || "" }
      ]
    },
    {
      id: "seed-todo",
      type: "todo",
      title: "Todo reminder",
      message: "Follow up on pending documents.",
      createdAt: now,
      audience: ["agent", "manager"],
      details: [
        { label: "Due", value: invoice?.dueDate || "-" },
        { label: "Customer", value: customer ? `${customer.name} (${customer.code})` : "-" },
        { label: "Invoice", value: invoice?.invoiceNo || "-" }
      ],
      ctas: [
        { label: "Open todo", action: "open-todo" }
      ]
    }
  ];

  const additions = seeds.filter(item => !existingIds.has(item.id));
  if (additions.length > 0) {
    saveNotificationCenter(additions.concat(list));
  }
}

function loadPdcNotifications() {
  try {
    const raw = localStorage.getItem(pdcNotificationKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Unable to load PDC notifications", err);
    return [];
  }
}

function savePdcNotifications(list) {
  try {
    localStorage.setItem(pdcNotificationKey, JSON.stringify(list));
  } catch (err) {
    console.warn("Unable to save PDC notifications", err);
  }
}

function normalizePdcNotifications() {
  const list = loadPdcNotifications();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let changed = false;
  const updated = list.map((note) => {
    if (note.scheduledFor && !note.sentAt) {
      const scheduledDate = new Date(note.scheduledFor);
      if (!Number.isNaN(scheduledDate.getTime())) {
        scheduledDate.setHours(0, 0, 0, 0);
        if (scheduledDate.getTime() <= today.getTime()) {
          note.sentAt = new Date().toISOString();
          changed = true;
        }
      }
    }
    return note;
  });
  if (changed) savePdcNotifications(updated);
  return updated;
}

function loadPdcRecords() {
  try {
    const raw = localStorage.getItem(pdcStorageKey);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.warn("Unable to load PDC records", err);
    return [];
  }
}

function savePdcRecords(list) {
  try {
    localStorage.setItem(pdcStorageKey, JSON.stringify(list));
  } catch (err) {
    console.warn("Unable to save PDC records", err);
  }
}

function addPdcRecords(records) {
  if (!Array.isArray(records) || records.length === 0) return;
  const list = loadPdcRecords();
  list.unshift(...records);
  savePdcRecords(list);
}

function createPdcRecordId() {
  const seed = Date.now().toString(36).toUpperCase();
  return `PDC-${seed.slice(-6)}`;
}

function getClearedPdcAdjustments(customer) {
  if (!customer) return [];
  const list = loadPdcRecords();
  return list
    .filter((pdc) => pdc.customerId === customer.id && pdc.status === "PDC cleared")
    .map((pdc) => ({
      adjustmentId: pdc.adjustmentId || pdc.id || pdc.chequeNo || "PDC",
      adjustmentType: "PDC",
      originalAmount: Number(pdc.amount || 0),
      remainingAmount: Number(pdc.amount || 0),
      createdDate: pdc.pdcDate || "-",
      lastUsedDate: "-"
    }));
}

function getAgentPdcNotifications() {
  const userName = localStorage.getItem("activeUserName") || "";
  const records = loadPdcRecords();
  const recordMap = new Map(records.map(record => [record.id, record]));
  return normalizePdcNotifications().filter((note) => {
    const record = recordMap.get(note.pdcId);
    if (!record) return false;
    return record.createdBy === userName || record.agentName === userName;
  });
}

function getActiveBellNotifications() {
  return getVisibleNotificationCenter();
}

function updateManagerNotificationBadge() {
  const countEl = document.getElementById("notificationBellCount");
  if (!countEl) return;
  const unreadCount = getActiveBellNotifications().filter(item => !item.read).length;
  countEl.textContent = String(unreadCount);
  countEl.classList.toggle("hidden", unreadCount === 0);
}

function markManagerNotificationsRead() {
  markNotificationCenterRead();
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
  const notifications = getActiveBellNotifications();
  if (notifications.length === 0) {
    listEl.innerHTML = `<div class="notificationEmpty">No notifications yet.</div>`;
    return;
  }
  const typeLabelMap = {
    pdc: "PDC",
    "pdc-reminder": "PDC reminder",
    "visit-approval": "Visit approval",
    todo: "Todo",
    email: "Email",
    "customer-payment": "Customer payment",
    "commitment-approved": "Commitment",
    "task-completed": "Task",
    manager: "Manager"
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
    if (type === "customer-payment") {
      const base = "Customer payment submitted";
      if (invoice && customer) return `${base} - ${invoice} - ${customer}`;
      if (invoice) return `${base} - ${invoice}`;
      if (customer) return `${base} - ${customer}`;
      return base;
    }
    if (type === "commitment-approved") {
      const base = "Commitment approved";
      if (invoice && customer) return `${base} - ${invoice} - ${customer}`;
      if (invoice) return `${base} - ${invoice}`;
      if (customer) return `${base} - ${customer}`;
      return base;
    }
    if (type === "task-completed") {
      const base = "Task completed";
      if (invoice && customer) return `${base} - ${invoice} - ${customer}`;
      if (invoice) return `${base} - ${invoice}`;
      if (customer) return `${base} - ${customer}`;
      return base;
    }
    if (type === "manager") {
      const base = "Manager update";
      if (invoice) return `${base} - ${invoice}`;
      return base;
    }
    return String(note.title || "Update");
  };

  listEl.innerHTML = notifications.map((note) => {
    const noteId = escapeAttr(note.id || "");
    const message = safeText(note.message || "");
    const time = formatNotificationTime(note.sentAt || note.createdAt);
    const typeLabel = typeLabelMap[note.type] || "Update";
    const typeClass = `tag-${String(note.type || "update").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
    const details = Array.isArray(note.details) ? note.details : [];
    const title = safeText(buildNotificationTitle(note, details));
    const invoiceValue = getDetailValue(details, "Invoice");
    const detailHtml = details.map((detail) => `
      <div class="notificationDetailRow">
        <span>${safeText(detail.label)}</span>
        <strong>${safeText(detail.value)}</strong>
      </div>
    `).join("");
    const ctas = Array.isArray(note.ctas) ? note.ctas : [];
    const defaultCta = ctas[0] || {};
    const defaultAction = defaultCta.action
      || (note.type === "visit-approval" ? "link"
        : (note.type === "pdc" || note.type === "pdc-reminder") ? "open-pdc"
          : note.type === "todo" ? "open-todo"
            : note.type === "email" ? "open-email"
              : note.type === "customer-payment" ? "open-disposition"
              : note.type === "commitment-approved" ? "open-invoice"
                : "");
    const defaultHref = defaultCta.href
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
      >${safeText(cta.label || "View")}</button>
    `).join("");

    return `
      <div class="notificationCard" data-note-id="${noteId}" data-action="${escapeAttr(defaultAction)}" data-href="${escapeAttr(defaultHref)}" data-inv="${escapeAttr(defaultInv)}">
        <div class="notificationCardHeader">
          <div>
            <div class="notificationTitle">${title}</div>
          </div>
          <div class="notificationMetaRight">
            <div class="notificationTag ${typeClass}">${safeText(typeLabel)}</div>
            <div class="notificationTime">${time}</div>
          </div>
        </div>
        <div class="notificationCardBody">${message}</div>
        ${detailHtml ? `<div class="notificationDetails">${detailHtml}</div>` : ""}
        ${ctaHtml ? `<div class="notificationCtas">${ctaHtml}</div>` : ""}
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
    markManagerNotificationsRead();
  } else {
    popup.classList.add("hidden");
    popup.classList.remove("expanded");
    const expandBtn = document.getElementById("notificationExpandBtn");
    const icon = expandBtn ? expandBtn.querySelector("i") : null;
    if (icon) icon.className = "bi bi-arrows-angle-expand";
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

  const task = todoTasks[0];
  addNotificationCenterItem({
    id: `todo-${task.id}`,
    type: "todo",
    title: "New todo",
    message: task.text,
    createdAt: task.createdAt,
    audience: ["agent", "manager"],
    details: [
      { label: "Due", value: formatTodoDue(task) },
      { label: "Customer", value: `${task.customerName} (${task.customerCode})` },
      { label: "Invoice", value: task.invoice?.invoiceNo || "-" }
    ],
    ctas: [
      { label: "Open todo", action: "open-todo" }
    ]
  });
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
  const baseList = Array.isArray(list) && list.length > 0 ? list : cnAdvPdcFallbackAdjustments;
  const pdcAdjustments = getClearedPdcAdjustments(customer);
  return baseList.concat(pdcAdjustments);
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

  const isCollectionTrailEvent = (
    ["Collection", "Paid by customer", "Collected"].includes(String(data.subStatus || "").trim())
    || String(data.activityType || "").trim() === "Collection"
  );

  if (isCollectionTrailEvent) {
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

  if (data.subStatus === "PDC given") {
    const pdcRows = Array.isArray(data.pdcRows) ? data.pdcRows : [];
    const dispatch = data.dispatchDetails || {};
    const dispatchParts = [
      dispatch.courierName,
      dispatch.dispatchMode,
      dispatch.trackingNo,
      dispatch.dispatchDate
    ].filter(Boolean);
    const dispatchText = dispatchParts.length > 0
      ? dispatchParts.join(" / ")
      : "-";

    if (pdcRows.length > 0) {
      detailItems.push({ label: "PDC count", value: String(pdcRows.length) });
      detailItems.push({ label: "PDC Ops user", value: safeText(data.pdcOpsUser || "-") });
      detailItems.push({ label: "Dispatch details", value: safeText(dispatchText) });
      pdcRows.forEach((row, idx) => {
        const base = [
          row.chequeNo ? `Cheque ${row.chequeNo}` : "Cheque -",
          row.pdcDate || "-",
          row.bank || "-",
          row.amount ? `Rs.${formatINR(row.amount)}` : "Rs.0"
        ].join(" | ");
        const imageText = row.imageName ? `Image: ${row.imageName}` : "Image: -";
        detailItems.push({
          label: `PDC ${idx + 1}`,
          value: safeText(`${base} | ${imageText}`)
        });
      });
    }
  }

  detailItems.push({ label: "Remarks", value: safeText(data.remarks) });

  details.innerHTML = `
    <summary>
      <div>
        <div class="eventTitle">Invoice update</div>
        <div class="eventMeta">${summaryMeta}</div>
      </div>
      <span class="eventBadge">Status</span>
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

function buildIssueTrailEntry({ title, meta, badge, lines, eventClass }) {
  const details = document.createElement("details");
  details.className = `activityEvent ${eventClass || "event-issue"}`;
  const safeLines = Array.isArray(lines) ? lines : [];
  details.innerHTML = `
    <summary>
      <div>
        <div class="eventTitle">${safeText(title)}</div>
        <div class="eventMeta">${safeText(meta)}</div>
      </div>
      <span class="eventBadge">${safeText(badge)}</span>
    </summary>
    <div class="eventBody">
      ${safeLines.map(item => `
        <div class="activityDetailLine">
          <span class="activityLabel">${safeText(item.label)}</span>
          <span class="activityValue">${safeText(item.value)}</span>
        </div>
      `).join("")}
    </div>
  `;
  return details;
}

function formatApprovalTrailText(action, processLabel, level) {
  const actionLower = String(action || "").toLowerCase();
  const process = processLabel ? ` (${processLabel})` : "";
  if (actionLower === "submitted") return `submitted for approval${process}`;
  if (actionLower === "approved") {
    const lvl = level ? `Level ${level}` : "approval";
    return `approved at ${lvl}${process}`;
  }
  if (actionLower === "rejected") {
    const lvl = level ? `Level ${level}` : "approval";
    return `rejected at ${lvl}${process}`;
  }
  if (actionLower) return `${actionLower}${process}`;
  return `approval update${process}`;
}

function buildIssueTrackerEvent(issue, entry, extra) {
  const actionText = entry?.what || entry?.actionText || entry?.type || "update";
  const meta = `${issue?.id || "Issue"} - ${actionText}`;
  const files = Array.isArray(entry?.files) ? entry.files : [];
  const fileNames = files.map((file) => {
    if (!file) return "";
    if (typeof file === "string") return file;
    return file.name || "";
  }).filter(Boolean);
  const lines = [
    { label: "Action", value: actionText },
    { label: "By", value: entry?.who || entry?.by || "-" },
    { label: "Status", value: entry?.type || entry?.status || "-" },
    { label: "Remark", value: entry?.remark || "-" }
  ];
  if (fileNames.length) {
    lines.push({ label: "Documents", value: fileNames.join(", ") });
  }
  if (extra?.process) lines.push({ label: "Process", value: extra.process });
  if (extra?.matrix) lines.push({ label: "Matrix", value: extra.matrix });
  if (extra?.level != null && extra?.level !== "") lines.push({ label: "Level", value: String(extra.level) });
  return {
    title: "Issue tracker update",
    meta,
    badge: "Issue tracker update",
    lines,
    eventClass: "event-issue"
  };
}

function buildEmailTrailEntry(data) {
  const to = safeText(data.to);
  const subject = safeText(data.subject);
  const meta = subject !== "-" ? subject : (to !== "-" ? `To: ${to}` : "Email sent");
  const payload = encodeURIComponent(JSON.stringify({
    to: data.to || "",
    cc: data.cc || "",
    from: data.from || "",
    subject: data.subject || "",
    body: data.body || "",
    attachments: Array.isArray(data.attachments) ? data.attachments : [],
    invoices: Array.isArray(data.invoices) ? data.invoices : []
  }));
  const details = document.createElement("details");
  details.className = "activityEvent event-push";
  details.innerHTML = `
    <summary>
      <div>
        <div class="eventTitle">Email sent</div>
        <div class="eventMeta">${safeText(meta)}</div>
      </div>
      <span class="eventBadge">Email</span>
    </summary>
    <div class="eventBody">
      <div class="activityDetailLine">
        <span class="activityLabel">From</span>
        <span class="activityValue">${safeText(data.from)}</span>
      </div>
      <div class="activityDetailLine">
        <span class="activityLabel">To</span>
        <span class="activityValue">${to}</span>
      </div>
      <div class="activityDetailLine">
        <span class="activityLabel">CC</span>
        <span class="activityValue">${safeText(data.cc)}</span>
      </div>
      <div class="activityDetailLine">
        <span class="activityLabel">Subject</span>
        <span class="activityValue">${subject}</span>
      </div>
      <button class="readMoreBtn emailTrailReadMore" type="button" data-email="${payload}">Read more</button>
    </div>
  `;
  return details;
}

function buildStatusTrailPayload(data, timestamp) {
  const nowIso = timestamp || new Date().toISOString();
  return {
    id: `status:${nowIso}`,
    at: nowIso,
    type: "status",
    data: {
      activityType: data.activityType,
      broadStatus: data.broadStatus,
      primaryStatus: data.primaryStatus,
      subStatus: data.subStatus,
      remarks: data.remarks,
      invoices: data.invoices,
      instrumentMode: data.instrumentMode,
      instrumentRef: data.instrumentRef,
      bank: data.bank,
      transferDate: data.transferDate,
      amount: data.amount,
      tds: data.tds,
      ld: data.ld,
      miscRows: data.miscRows,
      pdcRows: data.pdcRows,
      pdcOpsUser: data.pdcOpsUser,
      dispatchDetails: data.dispatchDetails,
      totalCollected: data.totalCollected
    }
  };
}

function syncIssueTrackerTrailForInvoice(invoiceNo) {
  if (!invoiceNo) return;
  const customIssues = readStoredArray(issueTrackerCustomKey);
  const relevant = customIssues.filter((issue) => issue && issue.invoiceNo === invoiceNo);
  if (relevant.length === 0) return;
  const map = loadActivityTrailMap();
  if (!Array.isArray(map[invoiceNo])) map[invoiceNo] = [];
  const existing = new Set(map[invoiceNo].map((item) => item?.id).filter(Boolean));
  const approvalRequests = readStoredArray("approval_requests");

  relevant.forEach((issue) => {
    const trail = Array.isArray(issue.actionTrail) ? issue.actionTrail : [];
    const approvalMatches = approvalRequests.filter((req) => req?.issue?.id === issue.id);
    const approvalEntries = [];
    approvalMatches.forEach((req) => {
      const processLabel = req?.processName || req?.processId || "";
      const matrixLabel = req?.matrixName || "";
      const reqTrail = Array.isArray(req?.trail) ? req.trail : [];
      reqTrail.forEach((entry) => {
        const when = entry?.at || req?.updatedAt || req?.createdAt || "";
        const actionText = formatApprovalTrailText(entry?.action, processLabel, entry?.level);
        approvalEntries.push({
          approvalKey: `approval:${req.id}:${when}:${entry?.action || "update"}`,
          when,
          actionText,
          who: entry?.by || "Approver",
          type: entry?.action || "approval",
          remark: entry?.remark || "",
          files: Array.isArray(entry?.files) ? entry.files : [],
          process: processLabel,
          matrix: matrixLabel,
          level: entry?.level
        });
      });
    });

    const combinedMap = new Map();
    trail.forEach((entry) => {
      const key = entry?.approvalKey || entry?.trailId || `issue:${issue.id}:${entry?.when || ""}:${entry?.what || entry?.type || "update"}`;
      if (!key) return;
      combinedMap.set(key, {
        when: entry?.when || "",
        key,
        entry,
        extra: {
          process: entry?.approvalProcessName || "",
          matrix: entry?.approvalMatrixName || "",
          level: entry?.level
        }
      });
    });
    approvalEntries.forEach((entry) => {
      const key = entry?.approvalKey || `issue:${issue.id}:${entry?.when || ""}:${entry?.actionText || "approval"}`;
      if (!key) return;
      combinedMap.set(key, {
        when: entry?.when || "",
        key,
        entry,
        extra: {
          process: entry?.process || "",
          matrix: entry?.matrix || "",
          level: entry?.level
        }
      });
    });

    Array.from(combinedMap.values()).forEach((item) => {
      const when = item.when || "";
      const key = item.key;
      if (!key || existing.has(key)) return;
      const sourceEntry = item.entry || {};
      const normalizedEntry = sourceEntry.actionText
        ? {
            what: sourceEntry.actionText,
            who: sourceEntry.who,
            type: sourceEntry.type,
            remark: sourceEntry.remark,
            files: Array.isArray(sourceEntry.files) ? sourceEntry.files : []
          }
        : sourceEntry;
      const event = buildIssueTrackerEvent(issue, normalizedEntry, item.extra);
      map[invoiceNo].unshift({
        id: key,
        type: "issue",
        at: when,
        sequence: sourceEntry?.sequence,
        event
      });
      existing.add(key);
    });
  });

  saveActivityTrailMap(map);
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

function showTransientNotification(title, message, tone = "success") {
  const notifyDock = document.getElementById("notifyDock");
  if (!notifyDock) return;
  const popup = document.createElement("div");
  const iconClass = tone === "error" ? "bi bi-x-circle-fill" : "bi bi-check-circle-fill";
  popup.className = `notifyPopup ${tone === "error" ? "warn" : "success"} animateUp`;
  popup.innerHTML = `
    <i class="${iconClass}" aria-hidden="true"></i>
    <div>
      <strong>${safeText(title)}</strong>
      <span>${safeText(message)}</span>
    </div>
    <button class="notifyClose" type="button" aria-label="Dismiss">
      <i class="bi bi-x-lg" aria-hidden="true"></i>
    </button>
  `;
  const closeBtn = popup.querySelector(".notifyClose");
  if (closeBtn) closeBtn.addEventListener("click", () => popup.remove());
  notifyDock.prepend(popup);
  setTimeout(() => {
    if (popup.isConnected) popup.remove();
  }, 4500);
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
  const text = safeText(value);
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.value = text;
    return;
  }
  el.textContent = text;
}

function normalizeEmailText(value) {
  return String(value || "").replace(/\\\\n/g, "\n").replace(/\\n/g, "\n");
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatEmailConversationHtml(entries) {
  const list = Array.isArray(entries) ? entries.filter(Boolean) : [];
  if (list.length === 0) return "-";

  const parseAttachmentNames = (value) => {
    if (Array.isArray(value)) {
      return value.map(item => String(item || "").trim()).filter(item => item && item !== "-");
    }
    return String(value || "")
      .split(/[|,;]+/)
      .map(item => item.trim())
      .filter(item => item && item !== "-");
  };

  const buildDateTimeLine = (dateValue, timeValue) => {
    const date = safeText(dateValue || "-");
    const time = safeText(timeValue || "-");
    if (date === "-" && time === "-") return "-";
    if (date === "-") return time;
    if (time === "-") return date;
    return `${date} ${time}`;
  };

  const buildAttachmentPills = (attachments) => {
    const names = parseAttachmentNames(attachments);
    if (names.length === 0) return "";
    const pills = names.map((name) => {
      const fileName = name.replace(/\s+/g, "_");
      const content = `Placeholder file for ${name}`;
      const href = `data:application/octet-stream;charset=utf-8,${encodeURIComponent(content)}`;
      return `<a class="emailConversationAttachmentPill" href="${href}" download="${escapeHtml(fileName)}">${escapeHtml(name)}</a>`;
    }).join("");

    return `
      <div class="emailConversationAttachmentRow">
        <strong>Attachments:</strong>
        <div class="emailConversationAttachmentList">${pills}</div>
      </div>
    `.trim();
  };

  return list.map((entry) => {
    const attachmentLine = buildAttachmentPills(entry.attachments);
    const dateTimeLine = buildDateTimeLine(entry.date, entry.time);

    return `
      <div class="emailConversationEntry">
        <div class="emailConversationLine"><strong>From:</strong> ${escapeHtml(safeText(entry.from || "-"))}</div>
        <div class="emailConversationLine"><strong>To:</strong> ${escapeHtml(safeText(entry.to || "-"))}</div>
        <div class="emailConversationLine"><strong>CC:</strong> ${escapeHtml(safeText(entry.cc || "-"))}</div>
        <div class="emailConversationLine"><strong>Date &amp; Time:</strong> ${escapeHtml(dateTimeLine)}</div>
        <div class="emailConversationLine"><strong>Subject:</strong> ${escapeHtml(safeText(entry.subject || "-"))}</div>
        <div class="emailConversationMessage">${escapeHtml(normalizeEmailText(entry.body || "-")).replace(/\n/g, "<br>")}</div>
        ${attachmentLine}
      </div>
    `.trim();
  }).join('<hr class="emailConversationDivider" />');
}

function renderEmailConversation(id, entries) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = formatEmailConversationHtml(entries);
}

function getInvoicePoNumber(invoice) {
  if (!invoice) return "-";
  return invoice.poNumber ? String(invoice.poNumber) : `PO-${invoice.invoiceNo}`;
}

function getInvoiceSalesOrder(invoice) {
  if (!invoice) return "-";
  return invoice.salesOrder ? String(invoice.salesOrder) : `SO-${invoice.invoiceNo}`;
}

function isUnreadFilterActive() {
  const el = document.getElementById("filterUnreadEmail");
  if (!el) return false;
  if ("checked" in el) return !!el.checked;
  return el.getAttribute("aria-pressed") === "true";
}

function setUnreadFilterActive(isActive) {
  const el = document.getElementById("filterUnreadEmail");
  if (!el) return;
  if ("checked" in el) {
    el.checked = isActive;
    return;
  }
  el.setAttribute("aria-pressed", isActive ? "true" : "false");
}

function updateUnreadEmailToggleCount() {
  const countEl = document.getElementById("unreadEmailCount");
  if (!countEl) return;
  const total = (currentInvoicesAll || []).reduce((sum, inv) => {
    return sum + Number(inv.unreadEmailCount || 0);
  }, 0);
  countEl.textContent = String(total);
}

function parseInvoiceDateValue(value) {
  if (!value) return null;
  if (value instanceof Date) return value;
  const raw = String(value).trim();
  if (!raw) return null;
  const parsed = Date.parse(raw);
  if (!Number.isNaN(parsed)) return new Date(parsed);

  const parts = raw.split(/\s+/);
  if (parts.length !== 3) return null;
  const day = Number(parts[0]);
  const monthKey = parts[1].slice(0, 3).toLowerCase();
  const year = Number(parts[2]);
  const monthMap = {
    jan: 0,
    feb: 1,
    mar: 2,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 6,
    aug: 7,
    sep: 8,
    sept: 8,
    oct: 9,
    nov: 10,
    dec: 11
  };
  const month = monthMap[monthKey];
  if (!Number.isFinite(day) || month == null || !Number.isFinite(year)) return null;
  return new Date(year, month, day);
}

function getBaseFilteredInvoices() {
  filterState.unreadOnly = isUnreadFilterActive();

  const fInvStatus = filterState.invoiceStatus;
  const fPrimary = filterState.primaryStatus;
  const fStatus = filterState.status;
  const fNetDue = filterState.netDue;
  const fUnreadOnly = filterState.unreadOnly;
  const invoiceSearch = (document.getElementById("invoiceSearch")?.value || "").trim().toLowerCase();
  const selectedCustomer = customersData.find(c => c.id === selectedCustomerId);
  const selectedCustomerName = String(selectedCustomer?.name || "").toLowerCase();
  const selectedCustomerCode = String(selectedCustomer?.code || "").toLowerCase();

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const nextMonth = new Date(today.getFullYear(), today.getMonth() + 1, 1);

  return (currentInvoicesAll || []).filter(inv => {
    if (fInvStatus !== "__ALL__" && String(inv.invoiceStatus) !== fInvStatus) return false;
    if (fPrimary !== "__ALL__" && String(inv.primaryStatus) !== fPrimary) return false;
    const subStatus = inv.subStatus ?? inv.status;
    if (fStatus !== "__ALL__" && String(subStatus) !== fStatus) return false;
    if (fNetDue !== "__ALL__") {
      const dueDate = parseInvoiceDateValue(inv.dueDate);
      if (!dueDate) return false;
      const due = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());

      if (fNetDue === "Not Due" && due <= today) return false;
      if (fNetDue === "Due this month") {
        if (due.getFullYear() !== today.getFullYear() || due.getMonth() !== today.getMonth()) return false;
      }
      if (fNetDue === "Due next month") {
        if (due.getFullYear() !== nextMonth.getFullYear() || due.getMonth() !== nextMonth.getMonth()) return false;
      }
      if (fNetDue === "All due invoices" && due > today) return false;
    }
    if (fUnreadOnly && Number(inv.unreadEmailCount || 0) <= 0) return false;
    if (invoiceSearch) {
      const subStatus = String(inv.subStatus ?? inv.status ?? "").toLowerCase();
      const invoiceMatches = String(inv.invoiceNo || "").toLowerCase().includes(invoiceSearch)
        || String(inv.invoiceStatus || "").toLowerCase().includes(invoiceSearch)
        || String(inv.primaryStatus || "").toLowerCase().includes(invoiceSearch)
        || subStatus.includes(invoiceSearch);
      const customerMatches = selectedCustomerName.includes(invoiceSearch) || selectedCustomerCode.includes(invoiceSearch);
      if (!invoiceMatches && !customerMatches) return false;
    }
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

function applyDispositionPrefill(prefill) {
  if (!prefill || typeof prefill !== "object") return;
  const activityTypeSelect = document.getElementById("activityTypeSelect");
  const broadStatusSelect = document.getElementById("broadStatusSelect");
  const primaryStatusSelect = document.getElementById("primaryStatusSelect");
  const subStatusSelect = document.getElementById("subStatusSelect");
  const instrumentModeSelect = document.getElementById("collectionInstrumentMode");
  const instrumentRefInput = document.getElementById("collectionInstrumentRef");
  const bankInput = document.getElementById("collectionBank");
  const transferDateInput = document.getElementById("collectionTransferDate");
  const amountInput = document.getElementById("collectionAmount");
  const tdsInput = document.getElementById("collectionTds");
  const ldInput = document.getElementById("collectionLd");
  const miscList = document.getElementById("collectionMiscList");
  const addMiscBtn = document.getElementById("addMiscModeBtn");
  const remarksInput = document.getElementById("activityRemarks");

  const setSelectValue = (selectEl, value) => {
    if (!selectEl || value === undefined || value === null || value === "") return;
    const option = Array.from(selectEl.options).find((item) => item.value === value || item.text === value);
    if (option) selectEl.value = option.value;
  };
  const setInputValue = (inputEl, value, eventName = "input") => {
    if (!inputEl) return;
    inputEl.value = value === undefined || value === null ? "" : String(value);
    inputEl.dispatchEvent(new Event(eventName, { bubbles: true }));
  };

  setSelectValue(activityTypeSelect, prefill.activityType);
  setSelectValue(broadStatusSelect, prefill.broadStatus);
  setSelectValue(primaryStatusSelect, prefill.primaryStatus);
  setSelectValue(subStatusSelect, prefill.subStatus);
  setSelectValue(instrumentModeSelect, prefill.instrumentMode);

  if (instrumentModeSelect) {
    instrumentModeSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }

  const isMiscMode = String(instrumentModeSelect?.value || "").trim() === "Miscellenious";
  if (isMiscMode) {
    const rows = Array.isArray(prefill.miscRows) ? prefill.miscRows : [];
    if (miscList && rows.length > 0) {
      miscList.innerHTML = "";
      rows.forEach(() => {
        if (addMiscBtn) addMiscBtn.click();
      });
      const rowEls = Array.from(miscList.querySelectorAll(".collectionMiscRow"));
      rows.forEach((row, idx) => {
        const rowEl = rowEls[idx];
        if (!rowEl) return;
        const modeSelect = rowEl.querySelector(".miscModeSelect");
        const adjustmentSelect = rowEl.querySelector(".miscAdjustmentSelect");
        setSelectValue(modeSelect, row.mode);
        if (modeSelect) {
          modeSelect.dispatchEvent(new Event("change", { bubbles: true }));
        }
        setInputValue(rowEl.querySelector(".miscInstrumentRef"), row.instrumentRef, "change");
        setInputValue(rowEl.querySelector(".miscBank"), row.bank, "change");
        setInputValue(rowEl.querySelector(".miscTransferDate"), row.transferDate, "change");
        setInputValue(rowEl.querySelector(".miscAmount"), row.amount);
        setInputValue(rowEl.querySelector(".miscTds"), row.tds);
        setInputValue(rowEl.querySelector(".miscLd"), row.ld);
        if (adjustmentSelect) {
          setSelectValue(adjustmentSelect, row.adjustmentId);
          adjustmentSelect.dispatchEvent(new Event("change", { bubbles: true }));
        }
      });
    }
  } else {
    setInputValue(instrumentRefInput, prefill.instrumentRef, "change");
    setInputValue(bankInput, prefill.bank, "change");
    setInputValue(transferDateInput, prefill.transferDate, "change");
    setInputValue(amountInput, prefill.amount);
    setInputValue(tdsInput, prefill.tds);
    setInputValue(ldInput, prefill.ld);
  }

  if (remarksInput && String(prefill.remarks || "").trim()) {
    setInputValue(remarksInput, prefill.remarks);
  }

  if (activityTypeSelect) {
    activityTypeSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }
  if (subStatusSelect) {
    subStatusSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }
}

function getLatestCustomerPaymentPrefill(invoiceNo) {
  if (!invoiceNo) return null;
  const trailMap = loadActivityTrailMap();
  const entries = Array.isArray(trailMap[invoiceNo]) ? trailMap[invoiceNo] : [];
  const latest = entries.find((entry) => {
    if (!entry || entry.type !== "status" || !entry.data) return false;
    return String(entry.data.subStatus || "").trim() === "Paid by customer";
  });
  if (!latest || !latest.data) return null;

  const data = latest.data;
  return {
    activityType: "Collection",
    broadStatus: data.broadStatus || "Work in Progress",
    primaryStatus: data.primaryStatus || "Collection In Progress",
    subStatus: data.subStatus || "Paid by customer",
    remarks: data.remarks || "",
    instrumentMode: data.instrumentMode || "NEFT",
    instrumentRef: data.instrumentRef || "",
    bank: data.bank || "",
    transferDate: data.transferDate || "",
    amount: data.amount ?? "",
    tds: data.tds ?? "",
    ld: data.ld ?? "",
    miscRows: Array.isArray(data.miscRows) ? data.miscRows : []
  };
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

function openDispositionForSingleInvoice(invNo, prefill = null) {
  dispositionInvoiceFilter = invNo ? [invNo] : null;
  dispositionInvoiceList = invNo ? [invNo] : [];
  setDispositionVisible(true);
  setDispositionReadOnly(isManagerView);
  renderDispositionInvoiceList();
  applyDispositionPrefill(prefill || getLatestCustomerPaymentPrefill(invNo));
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
    renderStoredActivityTrail(null);
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

  renderStoredRemarks(invoice.invoiceNo);
  renderStoredActivityTrail(invoice.invoiceNo);
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
  renderStoredActivityTrail(invNo);
  const customer = customersData.find(c => c.id === selectedCustomerId);
  if (customer) renderDocsList(customer);
  highlightInvoiceRow(invNo);
  return true;
}

function findInvoiceContext(invNo) {
  if (!invNo) return null;
  for (const customer of customersData) {
    const invoice = (customer.invoices || []).find((item) => item.invoiceNo === invNo);
    if (invoice) {
      return { customer, invoice };
    }
  }
  return null;
}

function openInvoiceContext(invNo) {
  const context = findInvoiceContext(invNo);
  if (!context) return false;
  if (selectedCustomerId !== context.customer.id) {
    selectCustomer(context.customer.id);
  }
  return selectInvoiceByNo(invNo);
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
  const btn = document.getElementById("docsFilterBtn");
  const menu = document.getElementById("docsFilterMenu");
  if (!btn || !menu || !customer) return;

  const current = currentDocsScope || "customer";
  const valueLabel = current === "invoice" ? "Invoice level" : "Customer level";
  const badge = btn.querySelector("[data-role='filter-value']");
  if (badge) badge.textContent = valueLabel;

  menu.querySelectorAll("[data-value]").forEach((item) => {
    const itemValue = item.getAttribute("data-value") || "";
    item.classList.toggle("active", itemValue === current);
  });
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
let activeLeftTab = "customers";
let activeAgentName = initialAgentParam || null;
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
let openCustomerPayModal = null;
let openCustomerRemarkModal = null;

const filterState = {
  invoiceStatus: "__ALL__",
  primaryStatus: "__ALL__",
  status: "__ALL__",
  netDue: "__ALL__",
  unreadOnly: false
};

const filterOptions = {
  invoiceStatus: [],
  primaryStatus: [],
  status: [],
  netDue: []
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
    label: "Sub Status",
    buttonId: "filterStatusBtn",
    menuId: "filterStatusMenu"
  },
  netDue: {
    label: "Net Due",
    buttonId: "filterNetDueBtn",
    menuId: "filterNetDueMenu"
  }
};

const filterToneClassNames = [
  "filterTone-neutral",
  "filterTone-green",
  "filterTone-blue",
  "filterTone-yellow",
  "filterTone-orange",
  "filterTone-red"
];

function applyFilterToneClass(element, tone) {
  if (!element) return;
  filterToneClassNames.forEach((cls) => element.classList.remove(cls));
  if (!tone || tone === "neutral") return;
  element.classList.add(`filterTone-${tone}`);
}

function getFilterTone(key, value) {
  if (value === "__ALL__" || value == null) return "neutral";
  const normalized = String(value).trim().toLowerCase();

  if (key === "invoiceStatus") {
    if (normalized.includes("not submitted")) return "red";
    if (normalized.includes("externally submitted")) return "blue";
    if (normalized.includes("submitted")) return "green";
    return "neutral";
  }

  if (key === "primaryStatus") {
    if (normalized === "collected") return "green";
    if (["collection in progress", "part collected", "ptp", "no due"].includes(normalized)) return "blue";
    if ([
      "further action required",
      "further docs required",
      "material delivery issues",
      "invoice assignment"
    ].includes(normalized)) return "orange";
    if (normalized === "guidance") return "red";
    return "neutral";
  }

  if (key === "status") {
    return "neutral";
  }

  if (key === "netDue") {
    if (normalized === "not due") return "green";
    if (normalized === "due this month") return "yellow";
    if (normalized === "due next month") return "orange";
    if (normalized === "all due invoices") return "red";
    return "neutral";
  }

  return "neutral";
}

const netDueFilterOptions = [
  "Not Due",
  "Due this month",
  "Due next month",
  "All due invoices"
];

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

function renderAgents(agents, selectedName) {
  const wrap = document.getElementById("agentCards");
  if (!wrap) return;

  wrap.innerHTML = "";

  agents.forEach(agent => {
    const card = document.createElement("div");
    card.className = `agentCard ${agent.name === selectedName ? "active" : ""}`;
    card.setAttribute("data-agent", agent.name);

    card.innerHTML = `
      <div class="agentCardHeader">
        <div class="agentCardName">${agent.name}</div>
        <div class="agentCardValue">Target Rs.${formatINR(agent.target)}</div>
      </div>
      <div class="agentCardMeta">Portfolio Rs.${formatINR(agent.portfolio)}</div>
    `;

    card.addEventListener("click", () => selectAgent(agent.name));
    wrap.appendChild(card);
  });

  if (agents.length === 0) {
    wrap.innerHTML = `<div style="padding:10px; color:#667085; font-size:13px;">No agents available.</div>`;
  }
}

function selectAgent(agentName) {
  activeAgentName = agentName;
  renderAgents(managerAgentData, activeAgentName);

  const agentCustomers = customersData.filter(c => c.agentName === agentName);
  if (agentCustomers.length === 0) return;
  selectCustomer(agentCustomers[0].id);
}

function setLeftPanelTab(tabKey) {
  activeLeftTab = tabKey;
  const title = document.getElementById("leftPanelTitle");
  const tabsWrap = document.getElementById("leftPanelTabs");
  const sortWrap = document.getElementById("customerSortWrap");
  const search = document.getElementById("customerSearch");
  const customerCards = document.getElementById("customerCards");
  const agentCards = document.getElementById("agentCards");

  if (title) title.textContent = tabKey === "agents" ? "Agents" : "Customers";
  if (sortWrap) sortWrap.classList.toggle("hidden", tabKey === "agents");
  if (search) search.classList.toggle("hidden", tabKey === "agents");
  if (customerCards) customerCards.classList.toggle("hidden", tabKey === "agents");
  if (agentCards) agentCards.classList.toggle("hidden", tabKey !== "agents");

  if (tabsWrap) {
    tabsWrap.querySelectorAll(".leftTabBtn").forEach((btn) => {
      const key = btn.getAttribute("data-left-tab");
      btn.classList.toggle("active", key === tabKey);
    });
  }

  if (tabKey === "agents") {
    renderAgents(managerAgentData, activeAgentName);
  }
}

function wireLeftPanelTabs() {
  const tabsWrap = document.getElementById("leftPanelTabs");
  if (!tabsWrap || !isManagerView) return;

  tabsWrap.classList.remove("hidden");

  tabsWrap.addEventListener("click", (event) => {
    const btn = event.target.closest(".leftTabBtn[data-left-tab]");
    if (!btn) return;
    setLeftPanelTab(btn.getAttribute("data-left-tab"));
  });

  if (initialAgentParam) {
    const match = managerAgentData.find(agent => agent.name === initialAgentParam);
    if (match) activeAgentName = match.name;
  }

  setLeftPanelTab("customers");
}

// ===============================
// Filters: populate dropdown values
// ===============================
function updateFilterButton(key) {
  const config = filterConfig[key];
  const btn = config ? document.getElementById(config.buttonId) : null;
  if (!btn) return;

  const currentValue = filterState[key];
  const valueText = currentValue === "__ALL__" ? "All" : String(currentValue);
  const tone = getFilterTone(key, currentValue);
  const valueEl = btn.querySelector("[data-role='filter-value']");
  if (valueEl) {
    valueEl.textContent = valueText;
    applyFilterToneClass(valueEl, tone);
  }
  applyFilterToneClass(btn, tone);
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

function getActiveFilterChipData() {
  const chips = [];
  Object.keys(filterConfig).forEach((key) => {
    const value = filterState[key];
    if (value === "__ALL__") return;
    chips.push({
      key,
      label: filterConfig[key]?.label || key,
      value: String(value)
    });
  });
  return chips;
}

function renderFilterChips() {
  const chipBar = document.getElementById("filterChipBar");
  if (!chipBar) return;

  const chips = getActiveFilterChipData();
  chipBar.classList.toggle("hidden", chips.length === 0);

  if (chips.length === 0) {
    chipBar.innerHTML = "";
    return;
  }

  chipBar.innerHTML = chips.map((chip) => `
    <span class="filterChip filterTone-${getFilterTone(chip.key, chip.value)}">
      <span>${chip.label}: ${chip.value}</span>
      <button type="button" class="filterChipClear" data-chip-key="${chip.key}" aria-label="Clear ${chip.label}">
        <i class="bi bi-x" aria-hidden="true"></i>
      </button>
    </span>
  `).join("");
}

function positionFilterPopover() {
  const filterPopover = document.getElementById("filterPopover");
  const toggleBtn = document.getElementById("filterCollapseBtn");
  if (!filterPopover || !toggleBtn || filterPopover.classList.contains("hidden")) return;

  const viewportPad = 12;
  const anchorGap = 8;
  const btnRect = toggleBtn.getBoundingClientRect();
  const popRect = filterPopover.getBoundingClientRect();
  const isMobile = window.innerWidth <= 640;

  let left;
  let top;

  if (isMobile) {
    left = Math.max(viewportPad, (window.innerWidth - popRect.width) / 2);
    top = btnRect.bottom + anchorGap;
  } else {
    // Place popover on the left side of the filter button.
    left = btnRect.left - popRect.width - anchorGap;
    top = btnRect.top;

    // If there is no room on the left, fall back to the right side.
    if (left < viewportPad) left = btnRect.right + anchorGap;
  }

  if (left + popRect.width > window.innerWidth - viewportPad) {
    left = window.innerWidth - popRect.width - viewportPad;
  }
  if (top + popRect.height > window.innerHeight - viewportPad) {
    top = window.innerHeight - popRect.height - viewportPad;
  }

  left = Math.max(viewportPad, left);
  top = Math.max(viewportPad, top);

  filterPopover.style.left = `${Math.round(left)}px`;
  filterPopover.style.top = `${Math.round(top)}px`;
}

function setFilterPopoverOpen(isOpen) {
  const filterPopover = document.getElementById("filterPopover");
  const filterBackdrop = document.getElementById("filterPopoverBackdrop");
  const toggleBtn = document.getElementById("filterCollapseBtn");
  if (!filterPopover || !filterBackdrop || !toggleBtn) return;

  filterPopover.classList.toggle("hidden", !isOpen);
  filterBackdrop.classList.toggle("hidden", !isOpen);
  toggleBtn.setAttribute("aria-expanded", isOpen ? "true" : "false");
  toggleBtn.title = isOpen ? "Hide filters" : "Show filters";

  if (isOpen) {
    positionFilterPopover();
    requestAnimationFrame(positionFilterPopover);
  }
}

function closeFilterDropdown(key) {
  const config = filterConfig[key];
  if (!config) return;

  const toggleBtn = document.getElementById(config.buttonId);
  const menu = document.getElementById(config.menuId);
  if (!toggleBtn) return;

  if (typeof bootstrap !== "undefined" && bootstrap.Dropdown) {
    bootstrap.Dropdown.getOrCreateInstance(toggleBtn).hide();
    return;
  }

  toggleBtn.classList.remove("show");
  toggleBtn.setAttribute("aria-expanded", "false");
  if (menu) menu.classList.remove("show");
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
    const tone = getFilterTone(key, item.value);
    btn.type = "button";
    btn.className = tone === "neutral" ? "dropdown-item" : `dropdown-item filterTone-${tone}`;
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
  const statuses = uniqSorted(invoices.map(i => i.subStatus ?? i.status));

  filterOptions.invoiceStatus = invoiceStatuses;
  filterOptions.primaryStatus = primaryStatuses;
  filterOptions.status = statuses;
  filterOptions.netDue = netDueFilterOptions;

  if (!invoiceStatuses.includes(filterState.invoiceStatus)) filterState.invoiceStatus = "__ALL__";
  if (!primaryStatuses.includes(filterState.primaryStatus)) filterState.primaryStatus = "__ALL__";
  if (!statuses.includes(filterState.status)) filterState.status = "__ALL__";
  if (!netDueFilterOptions.includes(filterState.netDue)) filterState.netDue = "__ALL__";

  renderFilterMenu("invoiceStatus");
  renderFilterMenu("primaryStatus");
  renderFilterMenu("status");
  renderFilterMenu("netDue");

  updateFilterButton("invoiceStatus");
  updateFilterButton("primaryStatus");
  updateFilterButton("status");
  updateFilterButton("netDue");
  updateMenuActive("invoiceStatus");
  updateMenuActive("primaryStatus");
  updateMenuActive("status");
  updateMenuActive("netDue");
  renderFilterChips();
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
  updateUnreadEmailToggleCount();
  renderFilterChips();
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
  const showAgentIconColumns = !isCustomerLandingView;
  const showStatusColumns = !isCustomerLandingView;
  const emptyColSpan = showAgentIconColumns && showStatusColumns ? 12 : 8;

  (invoices || []).forEach((inv) => {
    const isChecked = selectedInvoiceNos.has(inv.invoiceNo);
    const tr = document.createElement("tr");
    const subStatus = inv.subStatus ?? inv.status ?? "-";

    const targetTitle = `Target: Rs.${formatINR(inv.targetForMonth)} (≤ Invoice)`;

    const hasTarget = Number(inv.targetForMonth || 0) > 0;
    const emailTitle = Number(inv.unreadEmailCount || 0) > 0
      ? `Unread emails: ${inv.unreadEmailCount}`
      : "Email panel";
    const actionMarkup = isCustomerLandingView
      ? `
        <div class="invoiceActionGroup">
          <button class="payActionBtn" type="button" data-action="pay" data-inv="${inv.invoiceNo}">Pay</button>
          <button class="remarkActionBtn" type="button" data-action="add-remark" data-inv="${inv.invoiceNo}">Add Remark</button>
        </div>
      `
      : `
        <div class="actionCell">
          <button class="btnNewActivity" type="button" data-action="new-activity" data-inv="${inv.invoiceNo}">${actionLabel}</button>
        </div>
      `;

    tr.innerHTML = `
      <td class="colChk cellCenter">
        <input type="checkbox" class="invChk" data-inv="${inv.invoiceNo}" ${isChecked ? "checked" : ""} />
      </td>

      ${showAgentIconColumns ? `
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
      </td>` : ""}

      <td class="colInv" title="${inv.invoiceNo}">${inv.invoiceNo}</td>
      <td class="colAmtRight" title="Rs.${formatINR(inv.invoiceAmount)}">Rs.${formatINR(inv.invoiceAmount)}</td>
      <td class="colAmtRight" title="Rs.${formatINR(inv.amountForMonth)}">Rs.${formatINR(inv.amountForMonth)}</td>
      <td class="colAmtRight" title="Rs.${formatINR(inv.netDueAmount)}">Rs.${formatINR(inv.netDueAmount)}</td>
      <td class="colDate" title="${inv.invoiceDate}">${inv.invoiceDate}</td>
      <td class="colDate" title="${inv.dueDate}">${inv.dueDate}</td>
      ${showStatusColumns ? `
      <td class="colShort" title="${inv.primaryStatus}">${inv.primaryStatus}</td>
      <td class="colStatus" title="${subStatus}">
        <span class="pill ${statusPillClass(subStatus, inv.primaryStatus)}" title="${subStatus}">${subStatus}</span>
      </td>` : ""}

      <td class="colActions cellCenter">
        ${actionMarkup}
      </td>
    `;

    tbody.appendChild(tr);
  });

  if (!invoices || invoices.length === 0) {
    tbody.innerHTML = `<tr><td colspan="${emptyColSpan}" style="padding:14px; color:#667085;">No invoices match the selected filters.</td></tr>`;
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
  updateCenterIssueCountDisplay(issueCount);

  if (dispositionTagEl) dispositionTagEl.textContent = customer.name;
}

function updateCenterIssueCountDisplay(fallbackCount) {
  const issueEl = document.getElementById("centerIssueCount");
  if (!issueEl) return;
  const trackerTotal = getIssueTrackerTotal();
  if (trackerTotal != null) {
    issueEl.textContent = String(trackerTotal);
    return;
  }
  if (fallbackCount != null) {
    issueEl.textContent = String(fallbackCount);
  }
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

function wireIssueCountNavigation() {
  const issueBtn = document.getElementById("centerIssueCountBtn");
  if (!issueBtn) return;

  const goToIssueTracker = () => {
    window.location.href = "pages/issuetrackerLP.html";
  };

  issueBtn.addEventListener("click", goToIssueTracker);
  issueBtn.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      goToIssueTracker();
    }
  });
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

  if (isCustomerLandingView) {
    bulkBar.classList.add("hidden");
    bulkCount.textContent = "0";
    return;
  }

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
    filterState.netDue = "__ALL__";
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

    setUnreadFilterActive(false);
    updateUnreadEmailToggleCount();

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
      const invoiceMatch = (c.invoices || []).some((inv) => String(inv.invoiceNo || "").toLowerCase().includes(q));
      return n.includes(q) || code.includes(q) || invoiceMatch;
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
  const unreadToggle = document.getElementById("filterUnreadEmail");
  const filterToggle = document.getElementById("filterCollapseBtn");
  const filterPopover = document.getElementById("filterPopover");
  const filterBackdrop = document.getElementById("filterPopoverBackdrop");
  const filterClose = document.getElementById("filterPopoverCloseBtn");
  const chipBar = document.getElementById("filterChipBar");

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
      closeFilterDropdown(key);
      closeFloatingMenu();
      applyFiltersAndRender();
    });
  });

  if (chipBar) {
    chipBar.addEventListener("click", (event) => {
      const btn = event.target.closest("[data-chip-key]");
      if (!btn) return;
      const key = btn.getAttribute("data-chip-key");
      if (!key || !Object.prototype.hasOwnProperty.call(filterState, key)) return;
      filterState[key] = "__ALL__";
      currentPage = 1;
      updateFilterButton(key);
      updateMenuActive(key);
      applyFiltersAndRender();
    });
  }

  if (filterToggle) {
    filterToggle.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      const shouldOpen = filterPopover ? filterPopover.classList.contains("hidden") : false;
      setFilterPopoverOpen(shouldOpen);
    });
  }

  if (filterClose) {
    filterClose.addEventListener("click", () => {
      setFilterPopoverOpen(false);
    });
  }

  if (filterBackdrop) {
    filterBackdrop.addEventListener("click", () => {
      setFilterPopoverOpen(false);
    });
  }

  if (filterPopover) {
    filterPopover.addEventListener("click", (event) => {
      event.stopPropagation();
    });
  }

  window.addEventListener("resize", () => {
    positionFilterPopover();
  });
  window.addEventListener("scroll", () => {
    positionFilterPopover();
  }, true);

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (!filterPopover || filterPopover.classList.contains("hidden")) return;
    setFilterPopoverOpen(false);
  });

  if (unreadToggle) {
    unreadToggle.addEventListener("click", () => {
      const nextState = !isUnreadFilterActive();
      setUnreadFilterActive(nextState);
      currentPage = 1;
      closeFloatingMenu();
      applyFiltersAndRender();
    });
  }

  setFilterPopoverOpen(false);
  renderFilterChips();
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
  const saveBtn = document.getElementById("directoryFormSaveBtn");
  const cancelBtn = document.getElementById("directoryFormCancelBtn");

  const openAddContactForm = () => {
    openDirectoryPopup();
    showDirectoryForm();
  };

  if (addBtn) {
    addBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      openAddContactForm();
    });
  }

  if (cancelBtn) {
    cancelBtn.addEventListener("click", () => {
      showDirectoryListView();
    });
  }

  if (!saveBtn) return;

  saveBtn.addEventListener("click", () => {
    const contactType = (document.getElementById("directoryContactType") || {}).value || "customer";
    const customerQuery = (document.getElementById("directoryContactCompanySearch") || {}).value || "";
    const normalizedQuery = customerQuery.trim().toLowerCase();
    const targetCustomer = normalizedQuery
      ? customersData.find((customer) => customer.name.toLowerCase() === normalizedQuery)
      : customersData.find(c => c.id === selectedCustomerId);

    const contactPayload = {
      firstName: (document.getElementById("directoryContactFirstName") || {}).value || "",
      lastName: (document.getElementById("directoryContactLastName") || {}).value || "",
      email: (document.getElementById("directoryContactEmail") || {}).value || "",
      phonePrimary: (document.getElementById("directoryContactPhonePrimary") || {}).value || "",
      phoneSecondary: (document.getElementById("directoryContactPhoneSecondary") || {}).value || "",
      gender: (document.getElementById("directoryContactGender") || {}).value || "",
      department: (document.getElementById("directoryContactDepartment") || {}).value || "",
      useEmailForCommunication: (document.getElementById("directoryContactUseEmail") || {}).checked || false
    };

    if (contactType === "internal" || contactType === "self") {
      headerDirectoryContacts.internal.push({
        name: [contactPayload.firstName, contactPayload.lastName].filter(Boolean).join(" ") || "New contact",
        email: contactPayload.email || "-",
        phone: contactPayload.phonePrimary || contactPayload.phoneSecondary || "-"
      });
    } else if (targetCustomer) {
      if (!Array.isArray(targetCustomer.contacts)) targetCustomer.contacts = [];
      targetCustomer.contacts.push(contactPayload);
      renderCustomerDetails(targetCustomer);
      setActiveTab("customer");
    }

    renderDirectoryList();
    renderDirectoryAlphabet();
    applyDirectoryFilters();
    showDirectoryListView();
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
  const panelEl = document.getElementById("emailPanel");
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
  const attachmentPicker = document.getElementById("emailAttachmentPicker");
  const attachmentUploadBtn = document.getElementById("emailAttachmentUploadBtn");
  const attachmentUploadInput = document.getElementById("emailAttachmentUploadInput");
  const notifyDock = document.getElementById("notifyDock");
  const newBtn = document.getElementById("emailNewBtn");
  const sendBtn = document.getElementById("emailSendBtn");
  const toSuggestions = document.getElementById("emailToSuggestions");
  const ccSuggestions = document.getElementById("emailCcSuggestions");

  const normalizeBody = normalizeEmailText;

  const showNotify = (title, message) => {
    if (!notifyDock) return;
    const popup = document.createElement("div");
    popup.className = "notifyPopup success animateUp";
    popup.innerHTML = `
      <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
      <div>
        <strong>${safeText(title)}</strong>
        <span>${safeText(message)}</span>
      </div>
      <button class="notifyClose" type="button" aria-label="Dismiss">
        <i class="bi bi-x-lg" aria-hidden="true"></i>
      </button>
    `;
    const closeBtn = popup.querySelector(".notifyClose");
    if (closeBtn) {
      closeBtn.addEventListener("click", () => {
        popup.remove();
      });
    }
    notifyDock.prepend(popup);
    setTimeout(() => {
      if (!popup.isConnected) return;
      popup.remove();
    }, 4000);
  };

  const parseAttachmentList = (value) => (
    String(value || "")
      .split(/[,;]+/)
      .map(item => item.trim())
      .filter(Boolean)
  );

  const updateAttachmentValue = (names) => {
    if (!composeAttachments) return;
    const existing = parseAttachmentList(composeAttachments.value);
    names.forEach(name => {
      if (name && !existing.includes(name)) existing.push(name);
    });
    composeAttachments.value = existing.join(", ");
  };

  const getAttachmentDocs = () => {
    const customer = customersData.find(c => c.id === selectedCustomerId);
    const docs = Array.isArray(customer?.documents) ? customer.documents : [];
    const scope = currentDocsScope || (currentInvoiceNoForDocs ? "invoice" : "customer");
    if (scope === "invoice") return docs.filter(doc => doc.type === "invoice");
    return docs.filter(doc => doc.type === "client");
  };

  const renderAttachmentPicker = () => {
    if (!attachmentPicker) return;
    const docs = getAttachmentDocs();
    const selected = new Set(parseAttachmentList(composeAttachments?.value || ""));
    if (!docs.length) {
      attachmentPicker.innerHTML = `
        <div class="emailAttachmentItem">
          <span>No documents available</span>
        </div>
      `;
      return;
    }
    attachmentPicker.innerHTML = docs.map(doc => {
      const meta = doc.type === "invoice" ? "Invoice level document" : "Customer level document";
      const checked = selected.has(doc.name);
      return `
        <div class="emailAttachmentItem" data-doc-name="${safeText(doc.name)}">
          <label class="emailAttachmentLabel">
            <input type="checkbox" class="emailAttachmentChk" data-doc-name="${safeText(doc.name)}" ${checked ? "checked" : ""} />
            <span>${safeText(doc.name)}</span>
          </label>
          <span class="emailAttachmentMeta">${safeText(meta)}</span>
        </div>
      `;
    }).join("");
  };

  const showAttachmentPicker = () => {
    if (!attachmentPicker) return;
    renderAttachmentPicker();
    attachmentPicker.classList.remove("hidden");
  };

  const hideAttachmentPicker = () => {
    if (attachmentPicker) attachmentPicker.classList.add("hidden");
  };

  const getThreadItems = (item) => {
    const thread = item?.closest(".emailThread");
    if (!thread) return [];
    return Array.from(thread.querySelectorAll(".emailItem"));
  };

  const getActiveEmailItem = () => panelEl ? panelEl.querySelector(".emailItem.active") : null;

  const buildConversationTrail = (item) => {
    const items = getThreadItems(item);
    return items.map((threadItem) => ({
      from: threadItem.getAttribute("data-from") || "-",
      to: threadItem.getAttribute("data-to") || "-",
      cc: threadItem.getAttribute("data-cc") || "-",
      mailbox: threadItem.getAttribute("data-mailbox") || "-",
      date: threadItem.getAttribute("data-date") || "-",
      time: threadItem.getAttribute("data-time") || "-",
      subject: threadItem.getAttribute("data-subject") || "-",
      attachments: (() => {
        const rawAttachments = threadItem.getAttribute("data-attachments") || "-";
        return rawAttachments === "-" ? "-" : rawAttachments.split("|").join(", ");
      })(),
      body: threadItem.getAttribute("data-body") || "-"
    }));
  };

  const openThreadForItem = (item) => {
    const thread = item?.closest(".emailThread");
    if (thread) thread.open = true;
  };

  const resetDetail = () => {
    if (detailEmpty) detailEmpty.classList.remove("hidden");
    if (detailContent) detailContent.classList.add("hidden");
    document.querySelectorAll(".emailItem.active").forEach(item => item.classList.remove("active"));
    setDetailValue("emailDetailFrom", "-");
    setDetailValue("emailDetailTo", "-");
    setDetailValue("emailDetailCc", "-");
    setDetailValue("emailDetailSubject", "-");
    setDetailValue("emailDetailMailbox", "-");
    setDetailValue("emailDetailThread", "-");
    setDetailValue("emailDetailDate", "-");
    setDetailValue("emailDetailTime", "-");
    renderEmailConversation("emailDetailBody", []);
  };

  const showEmailDetail = (item) => {
    if (!item) return;
    const itemPanel = item.closest("#emailPanel");
    if (!itemPanel) return;
    hideCompose();
    openThreadForItem(item);

    itemPanel.querySelectorAll(".emailItem").forEach(el => el.classList.remove("active"));
    item.classList.add("active");

    setDetailValue("emailDetailFrom", item.getAttribute("data-from"));
    setDetailValue("emailDetailTo", item.getAttribute("data-to"));
    setDetailValue("emailDetailCc", item.getAttribute("data-cc"));
    setDetailValue("emailDetailSubject", item.getAttribute("data-subject"));
    setDetailValue("emailDetailMailbox", item.getAttribute("data-mailbox") || "-");
    setDetailValue("emailDetailThread", item.getAttribute("data-thread") || "-");
    setDetailValue("emailDetailDate", item.getAttribute("data-date") || "-");
    setDetailValue("emailDetailTime", item.getAttribute("data-time") || "-");

    renderEmailConversation("emailDetailBody", buildConversationTrail(item));

    if (detailEmpty) detailEmpty.classList.add("hidden");
    if (detailContent) detailContent.classList.remove("hidden");
  };

  const selectFirstEmail = () => {
    if (!panelEl) return;
    const activePane = panelEl.querySelector(".emailTabPane.active");
    const firstItem = activePane ? activePane.querySelector(".emailItem") : null;
    if (firstItem) {
      showEmailDetail(firstItem);
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
    document.querySelectorAll(".emailFormatBtn.is-active").forEach(btn => btn.classList.remove("is-active"));
  };

  const resetCompose = () => {
    if (composeTo) composeTo.value = "";
    if (composeCc) composeCc.value = "";
    if (composeSubject) composeSubject.value = "";
    if (composeBody) composeBody.value = "";
    if (composeAttachments) composeAttachments.value = "";
    document.querySelectorAll(".emailFormatBtn.is-active").forEach(btn => btn.classList.remove("is-active"));
  };

  const getDetailText = (id) => {
    const el = document.getElementById(id);
    if (!el) return "";
    const rawValue = el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement
      ? el.value
      : el.textContent;
    const value = String(rawValue || "").trim();
    return value === "-" ? "" : value;
  };

  const openReplyAll = () => {
    if (!composePanel) return;
    const activeItem = getActiveEmailItem();
    const from = activeItem ? (activeItem.getAttribute("data-from") || "") : getDetailText("emailDetailFrom");
    const to = activeItem ? (activeItem.getAttribute("data-to") || "") : getDetailText("emailDetailTo");
    const cc = activeItem ? (activeItem.getAttribute("data-cc") || "") : getDetailText("emailDetailCc");
    const subject = activeItem ? (activeItem.getAttribute("data-subject") || "") : getDetailText("emailDetailSubject");
    const body = activeItem ? normalizeBody(activeItem.getAttribute("data-body") || "") : getDetailText("emailDetailBody");

    resetCompose();
    showCompose();

    if (composeTo) composeTo.value = from || to;
    if (composeCc) {
      const ccValues = [to, cc].filter(Boolean);
      composeCc.value = ccValues.join(", ");
    }
    if (composeSubject) {
      composeSubject.value = subject ? (subject.startsWith("Re:") ? subject : `Re: ${subject}`) : "";
    }
    if (composeBody && body) {
      composeBody.value = `\n\n--- Original message ---\n${body}`;
    }
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
    const replyAll = e.target.closest(".emailActionIcon[data-email-action='reply-all']");
    if (replyAll) {
      openReplyAll();
      return;
    }

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

    const formatBtn = e.target.closest(".emailFormatBtn");
    if (formatBtn) {
      formatBtn.classList.toggle("is-active");
      return;
    }

    const item = e.target.closest(".emailItem");
    if (!item) return;
    showEmailDetail(item);
  });

  if (newBtn) {
    newBtn.addEventListener("click", () => {
      resetCompose();
      showCompose();
    });
  }

  if (sendBtn) {
    sendBtn.addEventListener("click", () => {
      const nowIso = new Date().toISOString();
      const attachmentsRaw = String(composeAttachments?.value || "").trim();
      const attachments = attachmentsRaw
        ? attachmentsRaw.split(/[,;]+/).map(item => item.trim()).filter(Boolean)
        : [];
      const invoiceTargets = emailInvoiceFilter && emailInvoiceFilter.length
        ? emailInvoiceFilter.slice()
        : (currentInvoiceNoForDocs ? [currentInvoiceNoForDocs] : []);
      if (invoiceTargets.length) {
        const payload = {
          id: `email:${nowIso}:${composeSubject?.value || composeTo?.value || "message"}`,
          at: nowIso,
          type: "email",
          data: {
            to: composeTo?.value || "",
            cc: composeCc?.value || "",
            from: composeFrom?.value || "",
            subject: composeSubject?.value || "",
            body: composeBody?.value || "",
            attachments,
            invoices: invoiceTargets
          }
        };
        invoiceTargets.forEach((invNo) => addActivityTrailEntry(invNo, payload));
        const activeInv = invoiceTargets[0] || currentInvoiceNoForDocs;
        renderStoredActivityTrail(activeInv);
      }
      showNotify("Email sent", "Your email was sent successfully.");
      resetCompose();
    });
  }

  if (composeAttachments) {
    composeAttachments.addEventListener("focus", showAttachmentPicker);
    composeAttachments.addEventListener("click", showAttachmentPicker);
  }

  if (attachmentPicker) {
    attachmentPicker.addEventListener("change", (event) => {
      const checkbox = event.target.closest(".emailAttachmentChk");
      if (!checkbox) return;
      const docName = checkbox.getAttribute("data-doc-name") || "";
      const current = parseAttachmentList(composeAttachments?.value || "");
      const next = checkbox.checked
        ? Array.from(new Set(current.concat(docName).filter(Boolean)))
        : current.filter(name => name !== docName);
      if (composeAttachments) composeAttachments.value = next.join(", ");
    });
  }

  if (attachmentUploadBtn && attachmentUploadInput) {
    attachmentUploadBtn.addEventListener("click", () => {
      attachmentUploadInput.click();
    });
    attachmentUploadInput.addEventListener("change", () => {
      const names = attachmentUploadInput.files
        ? Array.from(attachmentUploadInput.files).map(file => file.name)
        : [];
      updateAttachmentValue(names);
      attachmentUploadInput.value = "";
    });
  }

  document.addEventListener("click", (event) => {
    const field = event.target.closest(".emailAttachmentField");
    if (!field && attachmentPicker) {
      hideAttachmentPicker();
    }
  });

  wireSuggestionInput(composeTo, toSuggestions);
  wireSuggestionInput(composeCc, ccSuggestions);

  selectFirstEmail();
}

function wireDispositionActivityEvents() {
  const activityTypeSelect = document.getElementById("activityTypeSelect");
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
  const pdcFields = document.getElementById("pdcFields");
  const pdcList = document.getElementById("pdcList");
  const addPdcBtn = document.getElementById("addPdcBtn");
  const pdcError = document.getElementById("pdcError");
  const pdcOpsUser = document.getElementById("pdcOpsUser");
  const pdcCourierName = document.getElementById("pdcCourierName");
  const pdcDispatchDate = document.getElementById("pdcDispatchDate");
  const pdcTrackingNo = document.getElementById("pdcTrackingNo");
  const pdcDispatchMode = document.getElementById("pdcDispatchMode");
  const dispatchModalEl = document.getElementById("pdcDispatchConfirmModal");
  const dispatchAddBtn = document.getElementById("pdcDispatchAddDetailBtn");
  const dispatchProceedBtn = document.getElementById("pdcDispatchProceedBtn");
  const deliveryChallanFields = document.getElementById("deliveryChallanFields");
  const issueTrackerCheck = document.getElementById("issueTrackerCheck");
  const actionOwnerSelect = document.getElementById("actionOwnerSelect");
  const approvalProcessSelect = document.getElementById("approvalProcessSelect");

  const miscModes = ["NEFT", "RTGS", "Cheque", "Demand Draft", "PDC", "CN", "Adv"];
  const miscAdjustmentModes = new Set(["PDC", "CN", "Adv"]);
  const adjustmentTypeMap = { PDC: "PDC", CN: "Credit Note", Adv: "Advance" };
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
  const defaultSubStatus = "No Response";
  let pendingPdcSubmission = null;
  const collectionSubStatuses = new Set(["Collection", "Paid by customer", "Collected"]);

  const isCollectionFlowSelected = () => {
    const selectedSubStatus = String(subStatusSelect?.value || "").trim();
    const selectedActivityType = String(activityTypeSelect?.value || "").trim();
    return collectionSubStatuses.has(selectedSubStatus) || selectedActivityType === "Collection";
  };

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

  const showPdcError = (message) => {
    if (!pdcError) return;
    pdcError.textContent = message;
    pdcError.classList.remove("hidden");
  };

  const clearPdcError = () => {
    if (!pdcError) return;
    pdcError.textContent = "";
    pdcError.classList.add("hidden");
  };

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
      <div class="suggestionItem" data-name="${safeText(name)}">
        <span>${safeText(name)}</span>
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
    const isCollection = isCollectionFlowSelected();
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
    wireBankSuggestion(row.querySelector(".miscBank"));
  };

  const updatePdcRowLabels = () => {
    if (!pdcList) return;
    const rows = Array.from(pdcList.querySelectorAll(".pdcRow"));
    rows.forEach((row, idx) => {
      const label = row.querySelector(".pdcRowHeader strong");
      if (label) label.textContent = `PDC ${idx + 1}`;
      const removeBtn = row.querySelector(".pdcRemoveBtn");
      if (removeBtn) removeBtn.classList.toggle("hidden", rows.length === 1);
    });
  };

  const createPdcRow = (prefillAmount) => {
    if (!pdcList) return;
    const row = document.createElement("div");
    row.className = "pdcRow";
    row.innerHTML = `
      <div class="pdcRowHeader">
        <strong>PDC</strong>
        <button type="button" class="pdcRemoveBtn">Remove</button>
      </div>
      <div class="pdcGrid">
        <div>
          <label>PDC date</label>
          <input type="date" class="pdcDate" />
        </div>
        <div>
          <label>Cheque no</label>
          <input type="text" class="pdcChequeNo" placeholder="Cheque number" />
        </div>
        <div>
          <label>Bank</label>
          <div class="bankSuggest">
            <div class="inputWithClear">
              <input type="text" class="pdcBank" placeholder="Bank name" autocomplete="off" />
              <button class="clearBtn" type="button" aria-label="Clear search">
                <i class="bi bi-x-lg" aria-hidden="true"></i>
              </button>
            </div>
            <div class="suggestionBox"></div>
          </div>
        </div>
        <div>
          <label>Amount</label>
          <input type="number" class="pdcAmount" min="0" step="0.01" placeholder="0" />
        </div>
      </div>
      <div class="pdcImageRow">
        <label>PDC image (optional)</label>
        <input type="file" class="pdcImage" accept=".jpg,.jpeg,.png,image/*" />
      </div>
    `;

    const removeBtn = row.querySelector(".pdcRemoveBtn");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        row.remove();
        updatePdcRowLabels();
      });
    }

    const amountInput = row.querySelector(".pdcAmount");
    if (amountInput && Number(prefillAmount) > 0) {
      amountInput.value = String(prefillAmount);
    }

    row.querySelectorAll("input").forEach((input) => {
      const eventName = input.type === "file" ? "change" : "input";
      input.addEventListener(eventName, (event) => {
        clearPdcError();
        if (input.type === "file") {
          const file = event.target.files && event.target.files[0];
          if (!file) {
            row.dataset.imageName = "";
            row.dataset.imageData = "";
            return;
          }
          const name = file.name || "";
          const isImageType = String(file.type || "").toLowerCase().startsWith("image/");
          const isAllowedExt = /\.(jpe?g|png)$/i.test(name);
          if (!isImageType && !isAllowedExt) {
            showPdcError("Only JPG, JPEG, or PNG images are allowed.");
            input.value = "";
            row.dataset.imageName = "";
            row.dataset.imageData = "";
            return;
          }
          row.dataset.imageName = file.name || "";
          const reader = new FileReader();
          reader.onload = () => {
            row.dataset.imageData = String(reader.result || "");
          };
          reader.readAsDataURL(file);
        }
      });
    });

    pdcList.appendChild(row);
    wireBankSuggestion(row.querySelector(".pdcBank"));
    updatePdcRowLabels();
  };

  const getPdcRowsData = () => {
    if (!pdcList) return [];
    return Array.from(pdcList.querySelectorAll(".pdcRow")).map((row) => ({
      pdcDate: row.querySelector(".pdcDate")?.value || "",
      chequeNo: row.querySelector(".pdcChequeNo")?.value || "",
      bank: row.querySelector(".pdcBank")?.value || "",
      amount: row.querySelector(".pdcAmount")?.value || "",
      imageName: row.dataset.imageName || row.querySelector(".pdcImage")?.files?.[0]?.name || "",
      imageData: row.dataset.imageData || ""
    }));
  };

  const getDispatchDetails = () => ({
    courierName: pdcCourierName?.value || "",
    dispatchDate: pdcDispatchDate?.value || "",
    trackingNo: pdcTrackingNo?.value || "",
    dispatchMode: pdcDispatchMode?.value || ""
  });

  const hasDispatchDetails = (details) => {
    if (!details) return false;
    return Boolean(
      details.courierName ||
      details.dispatchDate ||
      details.trackingNo ||
      details.dispatchMode
    );
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

  const updateInvoiceStatuses = (invoiceNos, status, options = {}) => {
    if (!Array.isArray(invoiceNos) || invoiceNos.length === 0) return;
    const updatedAt = options.updatedAt || new Date().toISOString();
    const updatedBy = options.updatedBy || (isCustomerLandingView ? "customer" : "agent");
    invoiceNos.forEach((invNo) => {
      const invoice = currentInvoicesAll.find(inv => inv.invoiceNo === invNo);
      if (invoice) {
        invoice.status = status;
        invoice.subStatus = status;
        if (options.primaryStatus) invoice.primaryStatus = options.primaryStatus;
        if (options.broadStatus) invoice.broadStatus = options.broadStatus;
        upsertInvoiceStatusOverride(invNo, {
          broadStatus: options.broadStatus || invoice.broadStatus || "",
          primaryStatus: options.primaryStatus || invoice.primaryStatus || "",
          subStatus: status || invoice.subStatus || "",
          status: status || invoice.status || "",
          updatedAt,
          updatedBy
        });
      }
    });
    populateFilters(currentInvoicesAll);
    applyFiltersAndRender();
    const activeInv = currentInvoiceNoForDocs || invoiceNos[0];
    if (activeInv) {
      const invoice = currentInvoicesAll.find(inv => inv.invoiceNo === activeInv);
      if (invoice) renderInvoiceDetails(invoice);
    }
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
    if (!collectionFields) return;
    const isCollection = isCollectionFlowSelected();
    collectionFields.classList.toggle("hidden", !isCollection);
    if (isCollection) updateCollectionTotals();
  };

  const togglePdcFields = () => {
    if (!subStatusSelect || !pdcFields) return;
    const isPdc = subStatusSelect.value === "PDC given";
    pdcFields.classList.toggle("hidden", !isPdc);
    if (!isPdc) {
      clearPdcError();
    }
    if (isPdc && pdcList && pdcList.children.length === 0) {
      const outstanding = getOutstandingAmount();
      createPdcRow(outstanding || "");
    }
  };

  const toggleDeliveryChallanFields = () => {
    if (!subStatusSelect || !deliveryChallanFields) return;
    const selected = String(subStatusSelect.value || "").trim().toLowerCase();
    const isDeliveryChallan = selected === "delivery challan required";
    deliveryChallanFields.classList.toggle("hidden", !isDeliveryChallan);
  };

  wireBankSuggestion(document.getElementById("collectionBank"));

  if (subStatusSelect) {
    subStatusSelect.addEventListener("change", () => {
      toggleCollectionFields();
      togglePdcFields();
      toggleDeliveryChallanFields();
    });
    toggleCollectionFields();
    togglePdcFields();
    toggleDeliveryChallanFields();
  }

  if (activityTypeSelect) {
    activityTypeSelect.addEventListener("change", () => {
      toggleCollectionFields();
    });
  }

  if (instrumentModeSelect) {
    instrumentModeSelect.addEventListener("change", toggleCollectionModeFields);
    toggleCollectionModeFields();
  }

  if (addMiscBtn) {
    addMiscBtn.addEventListener("click", () => createMiscRow("NEFT"));
  }

  if (addPdcBtn) {
    addPdcBtn.addEventListener("click", () => {
      clearPdcError();
      createPdcRow("");
    });
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

  if (dispatchAddBtn) {
    dispatchAddBtn.addEventListener("click", () => {
      pendingPdcSubmission = null;
      if (dispatchModalEl) {
        dispatchModalEl.classList.remove("open");
        dispatchModalEl.setAttribute("aria-hidden", "true");
      }
    });
  }

  if (dispatchProceedBtn) {
    dispatchProceedBtn.addEventListener("click", () => {
      const pending = pendingPdcSubmission;
      pendingPdcSubmission = null;
      if (dispatchModalEl) {
        dispatchModalEl.classList.remove("open");
        dispatchModalEl.setAttribute("aria-hidden", "true");
      }
      if (pending) pending();
    });
  }

  if (dispatchModalEl) {
    dispatchModalEl.addEventListener("click", (event) => {
      const closeBtn = event.target.closest("[data-modal-close]");
      if (closeBtn || event.target === dispatchModalEl) {
        pendingPdcSubmission = null;
        dispatchModalEl.classList.remove("open");
        dispatchModalEl.setAttribute("aria-hidden", "true");
      }
    });
  }

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
    clearPdcError();
    const subStatus = getValue("subStatusSelect");
    const isCollection = isCollectionFlowSelected();
    const isPdcGiven = subStatus === "PDC given";
    const instrumentMode = getValue("collectionInstrumentMode");
    const isMisc = instrumentMode === "Miscellenious";
    const outstanding = getOutstandingAmount();
    const miscRows = isMisc ? getMiscRowsData() : [];
    const pdcRows = isPdcGiven ? getPdcRowsData() : [];
    const pdcOpsUserName = pdcOpsUser?.value || "";
    const dispatchDetails = isPdcGiven ? getDispatchDetails() : null;

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

    if (isPdcGiven) {
      if (!pdcOpsUserName) {
        showPdcError("Select a PDC Ops user.");
        return;
      }
      if (pdcRows.length === 0) {
        showPdcError("Add at least one PDC.");
        return;
      }
      const hasMissing = pdcRows.some((row) =>
        !row.pdcDate || !row.chequeNo || !row.bank || !row.amount
      );
      if (hasMissing) {
        showPdcError("Complete PDC date, cheque no, bank, and amount for each PDC.");
        return;
      }
    }

    const data = {
      activityType: getValue("activityTypeSelect"),
      broadStatus: getValue("broadStatusSelect"),
      primaryStatus: getValue("primaryStatusSelect"),
      subStatus,
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
      pdcRows,
      pdcOpsUser: pdcOpsUserName,
      dispatchDetails,
      totalCollected,
      outstanding
    };

    const submitActivity = () => {
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

      const isDeliveryChallan = String(subStatus || "").trim().toLowerCase() === "delivery challan required";
      const shouldAddIssue = isDeliveryChallan && issueTrackerCheck && issueTrackerCheck.checked;
      let issueTrailEntry = null;
      let approvalTrailEntry = null;
      let issueTrailPayload = null;
      let approvalTrailPayload = null;
      const activityTimestamp = new Date().toISOString();
      if (shouldAddIssue) {
        const customer = customersData.find(c => c.id === selectedCustomerId);
        const invNo = dispositionInvoiceList && dispositionInvoiceList.length > 0
          ? dispositionInvoiceList[0]
          : currentInvoiceNoForDocs;
        const invoice = invNo ? currentInvoicesAll.find(inv => inv.invoiceNo === invNo) : null;
        const now = new Date();
        const approvalProcessName = approvalProcessSelect?.value || "";
        const approvalProcessId = findApprovalProcessId(approvalProcessName);
        const approvalProcess = findApprovalProcessByName(approvalProcessName);
        const approvalMatrix = findApprovalMatrixForProcess(approvalProcessName);
        const approvalMatrixObj = findApprovalMatrixById(approvalProcess?.matrixId || approvalMatrix.id);
        const actionOwner = actionOwnerSelect?.value || "";
        const invoiceValue = parseAmount(invoice?.invoiceAmount ?? invoice?.amountForMonth ?? 0);
        const invoiceDueAmount = parseAmount(invoice?.netDueAmount ?? invoiceValue ?? 0);
        const issue = {
          id: `ISS_MAN_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          title: "Delivery Challan Required",
          status: "Open",
          created: now.toISOString().slice(0, 10),
          createdAt: now.toISOString(),
          description: remarkText || "Delivery challan required.",
          activityType: data.activityType || "-",
          primaryStatus: data.primaryStatus || "-",
          broadStatus: data.broadStatus || "-",
          subStatus: "Delivery Challan Required",
          stage: 1,
          agent: customer?.agentName || "Agent",
          manager: customer?.managerName || "",
          actionOwner,
          approvalProcessId,
          approvalProcessName,
          approvalMatrixId: approvalMatrix.id,
          approvalMatrixName: approvalMatrix.name,
          invoiceDueAmount,
          invoiceDueDate: invoice?.dueDate || "",
          region: customer?.region || "",
          invoiceNo: invNo || "",
          invoiceDate: invoice?.invoiceDate || "",
          invoiceTotal: invoiceValue,
          customerName: customer?.name || "",
          customerCode: customer?.code || "",
          isCustom: true,
          actionTrail: [{
            who: "You",
            what: "created issue from activity",
            type: "remark",
            when: now.toISOString(),
            sequence: 1,
            remark: remarkText || ""
          }]
        };

        const customIssues = readStoredArray(issueTrackerCustomKey);
        customIssues.push(issue);
        try { localStorage.setItem(issueTrackerCustomKey, JSON.stringify(customIssues)); } catch (_) {}
        try { localStorage.removeItem(issueTrackerClearedKey); } catch (_) {}
        const total = syncIssueTrackerTotal();
        const issueEl = document.getElementById("centerIssueCount");
        if (issueEl) issueEl.textContent = String(total);

        const issueTrailEvent = {
          title: "Issue tracker update",
          meta: `${issue.id} - created issue from activity`,
          badge: "Issue",
          lines: [
            { label: "Invoice", value: invNo || "-" },
            { label: "Action Owner", value: actionOwner || "-" },
            { label: "Sub Status", value: issue.subStatus || "-" },
            { label: "Approval Process", value: approvalProcessName || "-" },
            { label: "Approval Matrix", value: approvalMatrix.name || "-" }
          ],
          eventClass: "event-issue"
        };
        issueTrailEntry = buildIssueTrailEntry(issueTrailEvent);
        const createdTrail = issue.actionTrail[0];
        issueTrailPayload = {
          id: `issue:${issue.id}:${createdTrail?.when || activityTimestamp}:${createdTrail?.what || "created"}`,
          type: "issue",
          at: activityTimestamp,
          sequence: 1,
          event: issueTrailEvent
        };

        if (approvalProcessName) {
          const reqKey = "approval_requests";
          const existingReqs = readStoredArray(reqKey);
          const processId = approvalProcess?.id || approvalProcessId || approvalProcessName;
          const matrixId = approvalProcess?.matrixId || approvalMatrix.id || "";
          const matrixName = approvalMatrixObj?.name || approvalMatrix.name || "";
          const levels = Array.isArray(approvalMatrixObj?.levels)
            ? approvalMatrixObj.levels.map((lvl, idx) => ({
                level: idx + 1,
                ownerName: lvl?.ownerName || "",
                ownerEmail: lvl?.ownerEmail || ""
              }))
            : [];
          const nowIso = activityTimestamp;
          let req = existingReqs.find(r => r && r.issue && r.issue.id === issue.id && r.processId === processId && r.status === "pending");
          if (!req) {
            req = {
              id: `REQ_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
              processId,
              processName: approvalProcess?.process || approvalProcessName || processId,
              matrixId,
              matrixName,
              levels,
              currentLevel: 1,
              status: "pending",
              createdAt: nowIso,
              updatedAt: nowIso,
              issue: {
                id: issue.id,
                title: issue.title || "",
                status: issue.status || "",
                created: issue.created || "",
                description: issue.description || "",
                primaryStatus: issue.primaryStatus || "",
                broadStatus: issue.broadStatus || "",
                subStatus: issue.subStatus || "",
                actionOwner: issue.actionOwner || ""
              },
              invoice: {
                id: invNo || "",
                customer: customer?.name || "",
                date: invoice?.invoiceDate || "",
                total: invoiceValue,
                dueDate: invoice?.dueDate || "",
                dueAmount: invoiceDueAmount
              },
              trail: []
            };
            existingReqs.push(req);
          } else {
            req.processName = approvalProcess?.process || req.processName || processId;
            req.matrixId = matrixId || req.matrixId || "";
            req.matrixName = matrixName || req.matrixName || "";
            if (levels.length) req.levels = levels;
            req.issue = req.issue || {};
            req.issue.actionOwner = issue.actionOwner || req.issue.actionOwner || "";
            req.updatedAt = nowIso;
          }
          req.trail = Array.isArray(req.trail) ? req.trail : [];
          req.trail.push({
            action: "submitted",
            by: "You",
            level: req.currentLevel || 1,
            at: nowIso,
            remark: remarkText || "Submitted from activity",
            files: []
          });
          try { localStorage.setItem(reqKey, JSON.stringify(existingReqs)); } catch (_) {}

          const approvalEntry = {
            who: "You",
            what: `submitted for approval (${req.processName || processId})`,
            type: "approval",
            when: nowIso,
            sequence: 2,
            remark: remarkText || "",
            approvalKey: `approval:${req.id}:${nowIso}:submitted`
          };
          issue.actionTrail.push(approvalEntry);
          try { localStorage.setItem(issueTrackerCustomKey, JSON.stringify(customIssues)); } catch (_) {}

          const approvalTrailEvent = {
            title: "Issue tracker update",
            meta: `${issue.id} - submitted for approval (${req.processName || processId})`,
            badge: "Issue",
            lines: [
              { label: "Process", value: req.processName || processId },
              { label: "Matrix", value: matrixName || "-" },
              { label: "Level", value: "1" }
            ],
            eventClass: "event-issue"
          };
          approvalTrailEntry = buildIssueTrailEntry(approvalTrailEvent);
          approvalTrailPayload = {
            id: approvalEntry.approvalKey || `issue:${issue.id}:${approvalEntry.when}:${approvalEntry.what}`,
            type: "issue",
            at: nowIso,
            sequence: 2,
            event: approvalTrailEvent
          };
        }
      }

      if (isPdcGiven) {
        const customer = customersData.find(c => c.id === selectedCustomerId);
        const createdBy = localStorage.getItem("activeUserName") || customer?.agentName || "Agent";
        const dispatched = hasDispatchDetails(dispatchDetails);
        const pdcRecords = pdcRows.map((row) => {
          const id = createPdcRecordId();
          return {
            id,
            adjustmentId: id,
            invoiceNo: invoices[0] || "",
            invoiceNos: invoices,
            customerId: customer?.id || "",
            customerCode: customer?.code || "",
            customerName: customer?.name || "",
            agentName: customer?.agentName || createdBy,
            chequeNo: row.chequeNo,
            pdcDate: row.pdcDate,
            bank: row.bank,
            amount: Number(row.amount || 0),
            imageName: row.imageName || "",
            imageData: row.imageData || "",
            status: dispatched ? "PDC dispatched" : "PDC logged",
            pdcOpsUser: pdcOpsUserName,
            dispatch: {
              courierName: dispatchDetails?.courierName || "",
              dispatchDate: dispatchDetails?.dispatchDate || "",
              trackingNo: dispatchDetails?.trackingNo || "",
              dispatchMode: dispatchDetails?.dispatchMode || ""
            },
            createdAt: new Date().toISOString(),
            createdBy
          };
        });
        addPdcRecords(pdcRecords);
      }

      if (subStatus && invoices.length > 0) {
        updateInvoiceStatuses(invoices, subStatus, {
          broadStatus: data.broadStatus,
          primaryStatus: data.primaryStatus,
          updatedBy: isCustomerLandingView ? "customer" : "agent",
          updatedAt: activityTimestamp
        });
      }

      const statusPayload = buildStatusTrailPayload(data, activityTimestamp);
      const entry = buildStatusUpdateEntry(statusPayload.data);
      trail.prepend(entry);
      if (approvalTrailEntry) trail.prepend(approvalTrailEntry);
      if (issueTrailEntry) trail.prepend(issueTrailEntry);

      const invoiceTargets = Array.isArray(data.invoices) && data.invoices.length
        ? data.invoices
        : (currentInvoiceNoForDocs ? [currentInvoiceNoForDocs] : []);
      if (invoiceTargets.length) {
        const payloadsToStore = [issueTrailPayload, approvalTrailPayload, statusPayload].filter(Boolean);
        invoiceTargets.forEach((invoiceNo) => {
          payloadsToStore.forEach((payload) => addActivityTrailEntry(invoiceNo, payload));
        });
      }

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
      resetSelect("subStatusSelect", defaultSubStatus);
      resetSelect("actionOwnerSelect");
      resetSelect("approvalProcessSelect");

      ["activityRemarks", "collectionInstrumentRef", "collectionBank", "collectionTransferDate", "collectionAmount", "collectionTds", "collectionLd", "pdcOpsUser", "pdcCourierName", "pdcDispatchDate", "pdcTrackingNo", "pdcDispatchMode"]
        .forEach((id) => {
          const el = document.getElementById(id);
          if (el) el.value = "";
        });

      if (issueTrackerCheck) issueTrackerCheck.checked = true;

      if (instrumentModeSelect) {
        instrumentModeSelect.value = "NEFT";
      }
      if (miscList) {
        miscList.innerHTML = "";
      }
      if (pdcList) {
        pdcList.innerHTML = "";
      }
      clearPdcError();

      toggleCollectionModeFields();
      toggleCollectionFields();
      togglePdcFields();
    };

    if (isPdcGiven && !hasDispatchDetails(dispatchDetails)) {
      if (dispatchModalEl) {
        pendingPdcSubmission = submitActivity;
        dispatchModalEl.classList.add("open");
        dispatchModalEl.setAttribute("aria-hidden", "false");
        return;
      }
    }

  submitActivity();
  });
}

function wireCustomerPayRemarkEvents() {
  if (!isCustomerLandingView) return;

  const payModalEl = document.getElementById("customerPayModal");
  const remarkModalEl = document.getElementById("customerRemarkModal");
  if (!payModalEl || !remarkModalEl) return;

  const payInvoiceMeta = document.getElementById("customerPayInvoiceMeta");
  const payOutstandingAmount = document.getElementById("customerPayOutstandingAmount");
  const payTotalAmount = document.getElementById("customerPayTotalAmount");
  const payError = document.getElementById("customerPayError");
  const payMode = document.getElementById("customerPayInstrumentMode");
  const payInstrumentRef = document.getElementById("customerPayInstrumentRef");
  const payBank = document.getElementById("customerPayBank");
  const payTransferDate = document.getElementById("customerPayTransferDate");
  const payAmount = document.getElementById("customerPayAmount");
  const payTds = document.getElementById("customerPayTds");
  const payLd = document.getElementById("customerPayLd");
  const payMiscFields = document.getElementById("customerPayMiscFields");
  const payMiscList = document.getElementById("customerPayMiscList");
  const payAddMiscModeBtn = document.getElementById("customerPayAddMiscModeBtn");
  const paySingleFields = document.querySelectorAll(".customerPaySingleFields");
  const payReceiptInput = document.getElementById("customerPayReceiptInput");
  const payReceiptHint = document.getElementById("customerPayReceiptHint");
  const paySubmitBtn = document.getElementById("customerPaySubmitBtn");
  const remarkInvoiceMeta = document.getElementById("customerRemarkInvoiceMeta");
  const remarkText = document.getElementById("customerRemarkText");
  const remarkError = document.getElementById("customerRemarkError");
  const remarkSaveBtn = document.getElementById("customerRemarkSaveBtn");
  const remarksAccordion = document.getElementById("invoiceRemarksCollapse");
  const activityAccordion = document.getElementById("invoiceActivityCollapse");
  const notifyDock = document.getElementById("notifyDock");

  const allowedReceiptTypes = new Set(["application/pdf", "image/jpeg", "image/png"]);
  const allowedReceiptExt = /\.(pdf|jpe?g|png)$/i;
  const miscModes = ["NEFT", "RTGS", "Cheque", "Demand Draft", "PDC", "CN", "Adv"];
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

  let payInvoiceNo = "";
  let remarkInvoiceNo = "";

  const showNotify = (title, message) => {
    if (!notifyDock) return;
    const popup = document.createElement("div");
    popup.className = "notifyPopup success animateUp";
    popup.innerHTML = `
      <i class="bi bi-check-circle-fill" aria-hidden="true"></i>
      <div>
        <strong>${safeText(title)}</strong>
        <span>${safeText(message)}</span>
      </div>
      <button class="notifyClose" type="button" aria-label="Dismiss">
        <i class="bi bi-x-lg" aria-hidden="true"></i>
      </button>
    `;
    const closeBtn = popup.querySelector(".notifyClose");
    if (closeBtn) closeBtn.addEventListener("click", () => popup.remove());
    notifyDock.prepend(popup);
    setTimeout(() => {
      if (popup.isConnected) popup.remove();
    }, 4000);
  };

  const hideBankSuggestions = (box) => {
    if (!box) return;
    box.style.display = "none";
    box.innerHTML = "";
  };

  const renderBankSuggestions = (input, box, clearBtn) => {
    if (!input || !box) return;
    const query = String(input.value || "").trim().toLowerCase();
    if (!query) {
      hideBankSuggestions(box);
      if (clearBtn) clearBtn.classList.remove("visible");
      return;
    }
    const matches = bankSuggestions.filter((name) => name.toLowerCase().includes(query));
    if (!matches.length) {
      box.innerHTML = `<div style="padding:6px 8px; font-size:12px; color:#94a3b8;">No matches found.</div>`;
      box.style.display = "block";
      if (clearBtn) clearBtn.classList.add("visible");
      return;
    }
    box.innerHTML = matches.map((name) => (
      `<div class="suggestionItem" data-name="${safeText(name)}"><span>${safeText(name)}</span></div>`
    )).join("");
    box.style.display = "block";
    if (clearBtn) clearBtn.classList.add("visible");
  };

  const wireBankSuggestion = (input) => {
    if (!input || input.dataset.customerPayBankBound) return;
    const wrap = input.closest(".bankSuggest");
    const box = wrap ? wrap.querySelector(".suggestionBox") : null;
    const clearBtn = wrap ? wrap.querySelector(".clearBtn") : null;
    if (!box) return;

    input.dataset.customerPayBankBound = "true";
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

  const showPayError = (message) => {
    if (!payError) return;
    payError.textContent = message;
    payError.classList.remove("hidden");
  };

  const clearPayError = () => {
    if (!payError) return;
    payError.textContent = "";
    payError.classList.add("hidden");
  };

  const showRemarkError = (message) => {
    if (!remarkError) return;
    remarkError.textContent = message;
    remarkError.classList.remove("hidden");
  };

  const clearRemarkError = () => {
    if (!remarkError) return;
    remarkError.textContent = "";
    remarkError.classList.add("hidden");
  };

  const getPayInvoice = () => {
    if (!payInvoiceNo) return null;
    return currentInvoicesAll.find((invoice) => invoice.invoiceNo === payInvoiceNo) || null;
  };

  const getPayOutstanding = () => {
    const invoice = getPayInvoice();
    return invoice ? Number(invoice.netDueAmount || 0) : 0;
  };

  const getPayMiscRows = () => {
    if (!payMiscList) return [];
    return Array.from(payMiscList.querySelectorAll(".collectionMiscRow")).map((row) => ({
      mode: row.querySelector(".miscModeSelect")?.value || "",
      instrumentRef: row.querySelector(".miscInstrumentRef")?.value || "",
      bank: row.querySelector(".miscBank")?.value || "",
      transferDate: row.querySelector(".miscTransferDate")?.value || "",
      amount: Number(row.querySelector(".miscAmount")?.value || 0),
      tds: Number(row.querySelector(".miscTds")?.value || 0),
      ld: Number(row.querySelector(".miscLd")?.value || 0)
    }));
  };

  const computePayTotal = () => {
    const isMisc = payMode?.value === "Miscellenious";
    if (isMisc) {
      return getPayMiscRows().reduce((sum, row) => sum + row.amount + row.tds + row.ld, 0);
    }
    return Number(payAmount?.value || 0) + Number(payTds?.value || 0) + Number(payLd?.value || 0);
  };

  const updatePayTotals = () => {
    if (payOutstandingAmount) {
      payOutstandingAmount.textContent = `Rs. ${formatINR(getPayOutstanding())}`;
    }
    if (payTotalAmount) {
      payTotalAmount.textContent = `Rs. ${formatINR(computePayTotal())}`;
    }
  };

  const createPayMiscRow = () => {
    if (!payMiscList) return;
    const row = document.createElement("div");
    row.className = "collectionMiscRow";
    row.innerHTML = `
      <div class="collectionMiscRowHeader">
        <div>
          <label>Mode</label>
          <select class="miscModeSelect">
            ${miscModes.map((mode) => `<option>${mode}</option>`).join("")}
          </select>
        </div>
        <button type="button" class="miscRemoveBtn">Remove</button>
      </div>
      <div class="collectionMiscGrid">
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
    `;

    const removeBtn = row.querySelector(".miscRemoveBtn");
    if (removeBtn) {
      removeBtn.addEventListener("click", () => {
        row.remove();
        updatePayTotals();
      });
    }

    row.querySelectorAll("input, select").forEach((input) => {
      input.addEventListener("input", () => {
        clearPayError();
        updatePayTotals();
      });
      input.addEventListener("change", () => {
        clearPayError();
        updatePayTotals();
      });
    });

    wireBankSuggestion(row.querySelector(".miscBank"));
    payMiscList.appendChild(row);
    updatePayTotals();
  };

  const togglePayModeFields = () => {
    const isMisc = payMode?.value === "Miscellenious";
    paySingleFields.forEach((field) => field.classList.toggle("hidden", isMisc));
    if (payMiscFields) payMiscFields.classList.toggle("hidden", !isMisc);
    if (isMisc && payMiscList && payMiscList.children.length === 0) {
      createPayMiscRow();
    }
    updatePayTotals();
  };

  const validateReceipt = () => {
    if (!payReceiptInput || !payReceiptInput.files || payReceiptInput.files.length === 0) return true;
    const file = payReceiptInput.files[0];
    const fileName = String(file.name || "");
    const fileType = String(file.type || "").toLowerCase();
    if (!allowedReceiptExt.test(fileName) && !allowedReceiptTypes.has(fileType)) {
      showPayError("Receipt must be a PDF, JPG, JPEG, or PNG file.");
      payReceiptInput.value = "";
      if (payReceiptHint) payReceiptHint.textContent = "Accepted: PDF, JPG, JPEG, PNG";
      return false;
    }
    if (payReceiptHint) payReceiptHint.textContent = `Selected file: ${fileName}`;
    return true;
  };

  const validatePayForm = () => {
    clearPayError();
    const outstanding = getPayOutstanding();
    const mode = payMode?.value || "";
    const isMisc = mode === "Miscellenious";
    const totalCollected = computePayTotal();
    const singleAmount = Number(payAmount?.value || 0);
    const singleTds = Number(payTds?.value || 0);
    const singleLd = Number(payLd?.value || 0);
    const miscRows = isMisc ? getPayMiscRows() : [];

    if (!mode) {
      showPayError("Select instrument mode.");
      return null;
    }

    if (isMisc) {
      if (!miscRows.length) {
        showPayError("Add at least one collection mode.");
        return null;
      }
      const missingRow = miscRows.some((row) => (
        !row.mode || !row.instrumentRef || !row.bank || !row.transferDate || Number(row.amount || 0) <= 0
      ));
      if (missingRow) {
        showPayError("Complete mode, reference, bank, transfer date, and amount for each collection row.");
        return null;
      }
    } else {
      if (!String(payInstrumentRef?.value || "").trim()) {
        showPayError("Enter instrument reference number.");
        return null;
      }
      if (!String(payBank?.value || "").trim()) {
        showPayError("Enter bank name.");
        return null;
      }
      if (!String(payTransferDate?.value || "").trim()) {
        showPayError("Select transfer date.");
        return null;
      }
      if (singleAmount <= 0) {
        showPayError("Amount must be greater than zero.");
        return null;
      }
    }

    if (totalCollected <= 0) {
      showPayError("Total collected must be greater than zero.");
      return null;
    }
    if (totalCollected > outstanding) {
      showPayError("Total collected cannot be more than total outstanding.");
      return null;
    }
    if (!validateReceipt()) return null;

    return {
      mode,
      isMisc,
      instrumentRef: String(payInstrumentRef?.value || "").trim(),
      bank: String(payBank?.value || "").trim(),
      transferDate: String(payTransferDate?.value || "").trim(),
      amount: singleAmount,
      tds: singleTds,
      ld: singleLd,
      miscRows,
      totalCollected,
      receiptName: payReceiptInput?.files?.[0]?.name || ""
    };
  };

  const resetPayForm = () => {
    clearPayError();
    if (payInstrumentRef) payInstrumentRef.value = "";
    if (payBank) payBank.value = "";
    if (payTransferDate) payTransferDate.value = "";
    if (payAmount) payAmount.value = "";
    if (payTds) payTds.value = "";
    if (payLd) payLd.value = "";
    if (payReceiptInput) payReceiptInput.value = "";
    if (payReceiptHint) payReceiptHint.textContent = "Accepted: PDF, JPG, JPEG, PNG";
    if (payMode) payMode.value = "NEFT";
    if (payMiscList) payMiscList.innerHTML = "";
    togglePayModeFields();
  };

  const openPayModalForInvoice = (invNo) => {
    const invoice = currentInvoicesAll.find((item) => item.invoiceNo === invNo);
    if (!invoice) return;
    payInvoiceNo = invNo;
    clearPayError();
    if (payInvoiceMeta) payInvoiceMeta.textContent = invoice.invoiceNo;
    resetPayForm();
    updatePayTotals();
    if (window.bootstrap && window.bootstrap.Modal) {
      const modal = window.bootstrap.Modal.getOrCreateInstance(payModalEl);
      modal.show();
    }
  };

  const openRemarkModalForInvoice = (invNo) => {
    const invoice = currentInvoicesAll.find((item) => item.invoiceNo === invNo);
    if (!invoice) return;
    remarkInvoiceNo = invNo;
    clearRemarkError();
    if (remarkText) remarkText.value = "";
    if (remarkInvoiceMeta) remarkInvoiceMeta.textContent = `Invoice: ${invoice.invoiceNo}`;
    if (window.bootstrap && window.bootstrap.Modal) {
      const modal = window.bootstrap.Modal.getOrCreateInstance(remarkModalEl);
      modal.show();
    }
  };

  openCustomerPayModal = openPayModalForInvoice;
  openCustomerRemarkModal = openRemarkModalForInvoice;

  wireBankSuggestion(payBank);

  if (payMode) payMode.addEventListener("change", togglePayModeFields);
  if (payAddMiscModeBtn) {
    payAddMiscModeBtn.addEventListener("click", createPayMiscRow);
  }
  [payAmount, payTds, payLd, payInstrumentRef, payBank, payTransferDate].forEach((input) => {
    if (!input) return;
    input.addEventListener("input", () => {
      clearPayError();
      updatePayTotals();
    });
    input.addEventListener("change", () => {
      clearPayError();
      updatePayTotals();
    });
  });

  if (payReceiptInput) {
    payReceiptInput.addEventListener("change", () => {
      clearPayError();
      validateReceipt();
    });
  }

  if (paySubmitBtn) {
    paySubmitBtn.addEventListener("click", () => {
      const invoice = getPayInvoice();
      if (!invoice) return;
      const values = validatePayForm();
      if (!values) return;

      const customer = customersData.find((item) => item.id === selectedCustomerId) || null;
      const previousOutstanding = Number(invoice.netDueAmount || 0);
      const updatedOutstanding = Math.max(0, previousOutstanding - values.totalCollected);
      const timestampIso = new Date().toISOString();
      const customerBroadStatus = "Work in Progress";
      const customerPrimaryStatus = "Collection In Progress";
      const customerSubStatus = "Paid by customer";
      invoice.netDueAmount = Number(updatedOutstanding.toFixed(2));
      invoice.broadStatus = customerBroadStatus;
      invoice.primaryStatus = customerPrimaryStatus;
      invoice.subStatus = customerSubStatus;
      invoice.status = customerSubStatus;

      upsertInvoiceStatusOverride(invoice.invoiceNo, {
        broadStatus: customerBroadStatus,
        primaryStatus: customerPrimaryStatus,
        subStatus: customerSubStatus,
        status: customerSubStatus,
        updatedAt: timestampIso,
        updatedBy: "customer"
      });

      const paymentRemark = values.receiptName
        ? `Customer submitted payment details. Receipt: ${values.receiptName}`
        : "Customer submitted payment details.";
      const dispositionPrefill = {
        activityType: "Collection",
        broadStatus: customerBroadStatus,
        primaryStatus: customerPrimaryStatus,
        subStatus: customerSubStatus,
        remarks: paymentRemark,
        instrumentMode: values.mode,
        instrumentRef: values.instrumentRef,
        bank: values.bank,
        transferDate: values.transferDate,
        amount: values.amount,
        tds: values.tds,
        ld: values.ld,
        miscRows: values.miscRows
      };
      const statusPayload = buildStatusTrailPayload({
        activityType: "Collection",
        broadStatus: customerBroadStatus,
        primaryStatus: customerPrimaryStatus,
        subStatus: customerSubStatus,
        remarks: paymentRemark,
        invoices: [invoice.invoiceNo],
        instrumentMode: values.mode,
        instrumentRef: values.instrumentRef,
        bank: values.bank,
        transferDate: values.transferDate,
        amount: values.amount,
        tds: values.tds,
        ld: values.ld,
        miscRows: values.miscRows,
        totalCollected: values.totalCollected,
        outstanding: previousOutstanding
      }, timestampIso);
      addActivityTrailEntry(invoice.invoiceNo, statusPayload);

      addNotificationCenterItem({
        id: `customer-payment:${invoice.invoiceNo}:${timestampIso}`,
        type: "customer-payment",
        title: "Customer payment submitted",
        message: `${customer?.name || "Customer"} submitted payment details for ${invoice.invoiceNo}.`,
        createdAt: timestampIso,
        audience: ["agent"],
        details: [
          { label: "Customer", value: customer ? `${customer.name} (${customer.code})` : "-" },
          { label: "Invoice", value: invoice.invoiceNo },
          { label: "Amount submitted", value: `Rs. ${formatINR(values.totalCollected)}` },
          { label: "Transfer date", value: values.transferDate || "-" },
          { label: "Instrument mode", value: values.mode || "-" },
          { label: "Status", value: `${customerBroadStatus} / ${customerPrimaryStatus} / ${customerSubStatus}` }
        ],
        ctas: [
          { label: "Open activity", action: "open-disposition", invoiceNo: invoice.invoiceNo }
        ],
        data: {
          invoiceNo: invoice.invoiceNo,
          prefillDisposition: dispositionPrefill,
          prefillStatus: {
            broadStatus: customerBroadStatus,
            primaryStatus: customerPrimaryStatus,
            subStatus: customerSubStatus
          }
        }
      });

      applyFiltersAndRender();
      if (!selectInvoiceByNo(invoice.invoiceNo)) {
        currentInvoiceNoForDocs = invoice.invoiceNo;
        renderInvoiceDetails(invoice);
        renderStoredActivityTrail(invoice.invoiceNo);
      }
      setActiveTab("invoice");

      if (activityAccordion && window.bootstrap && window.bootstrap.Collapse) {
        const collapse = window.bootstrap.Collapse.getOrCreateInstance(activityAccordion, { toggle: false });
        collapse.show();
      }

      if (window.bootstrap && window.bootstrap.Modal) {
        const modal = window.bootstrap.Modal.getInstance(payModalEl);
        if (modal) modal.hide();
      }
      showNotify("Payment saved", "Collection details captured successfully.");
    });
  }

  if (remarkText) {
    remarkText.addEventListener("input", clearRemarkError);
  }

  if (remarkSaveBtn) {
    remarkSaveBtn.addEventListener("click", () => {
      const invNo = remarkInvoiceNo;
      if (!invNo) return;
      const text = String(remarkText?.value || "").trim();
      if (!text) {
        showRemarkError("Remark cannot be empty.");
        return;
      }

      const timestamp = new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });

      addStoredRemark(invNo, {
        text,
        authorRole: "client",
        authorLabel: "Customer",
        timestamp,
        createdAt: new Date().toISOString()
      });

      currentInvoiceNoForDocs = invNo;
      if (!selectInvoiceByNo(invNo)) {
        const invoice = currentInvoicesAll.find((item) => item.invoiceNo === invNo);
        if (invoice) renderInvoiceDetails(invoice);
      }
      renderStoredRemarks(invNo);
      if (remarksAccordion && window.bootstrap && window.bootstrap.Collapse) {
        const collapse = window.bootstrap.Collapse.getOrCreateInstance(remarksAccordion, { toggle: false });
        collapse.show();
      }
      setActiveTab("invoice");

      if (window.bootstrap && window.bootstrap.Modal) {
        const modal = window.bootstrap.Modal.getInstance(remarkModalEl);
        if (modal) modal.hide();
      }
      showNotify("Remark added", "Your remark has been saved.");
    });
  }

  document.addEventListener("click", (event) => {
    document.querySelectorAll("#customerPayModal .bankSuggest").forEach((wrap) => {
      if (wrap.contains(event.target)) return;
      hideBankSuggestions(wrap.querySelector(".suggestionBox"));
    });
  });

  payModalEl.addEventListener("hidden.bs.modal", () => {
    clearPayError();
  });
  remarkModalEl.addEventListener("hidden.bs.modal", () => {
    clearRemarkError();
  });

  togglePayModeFields();
}

function wireDocsEvents() {
  const menu = document.getElementById("docsFilterMenu");
  const clipBtn = document.getElementById("docsClipBtn");
  const picker = document.getElementById("docsPicker");

  if (menu) {
    menu.addEventListener("click", (e) => {
      const item = e.target.closest("[data-value]");
      if (!item) return;
      currentDocsScope = item.getAttribute("data-value") === "invoice" ? "invoice" : "customer";
      renderDocsInvoiceSelect(customersData.find(c => c.id === selectedCustomerId));
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

    if (action === "pay") {
      if (typeof openCustomerPayModal === "function") {
        openCustomerPayModal(inv);
      }
      closeFloatingMenu();
      return;
    }

    if (action === "add-remark") {
      if (typeof openCustomerRemarkModal === "function") {
        openCustomerRemarkModal(inv);
      }
      closeFloatingMenu();
      return;
    }

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
  if (isCustomerLandingView) return;
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
function getDefaultTenantId() {
  const ids = Object.keys(tenantBrandMap);
  return ids.length > 0 ? ids[0] : "";
}

function applyTenantBrand(tenantId) {
  const relationshipLogo = document.getElementById("relationshipLogo");
  const relationshipName = document.getElementById("relationshipName");
  const storedId = localStorage.getItem("activeTenantId");
  const resolvedId = tenantBrandMap[tenantId]
    ? tenantId
    : (tenantBrandMap[storedId] ? storedId : getDefaultTenantId());

  const brand = tenantBrandMap[resolvedId];
  if (!brand) return;

  if (relationshipLogo) {
    relationshipLogo.innerHTML = "";
    if (brand.logo) {
      const img = document.createElement("img");
      img.src = resolvePath(brand.logo);
      img.alt = `${brand.name} logo`;
      relationshipLogo.appendChild(img);
    } else {
      relationshipLogo.textContent = brand.badge;
    }
  }
  if (relationshipName) {
    relationshipName.textContent = brand.name;
  }
  localStorage.setItem("activeTenantId", resolvedId);

  const list = document.getElementById("clientPickerList");
  if (list) {
    list.querySelectorAll("[data-client-id]").forEach((item) => {
      const isActive = item.getAttribute("data-client-id") === resolvedId;
      item.classList.toggle("active", isActive);
      item.setAttribute("aria-pressed", isActive ? "true" : "false");
    });
  }
}

function renderClientPicker() {
  const list = document.getElementById("clientPickerList");
  if (!list) return;

  list.innerHTML = "";
  Object.entries(tenantBrandMap).forEach(([id, brand]) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "headerPopupItem";
    button.setAttribute("data-client-id", id);
    button.setAttribute("aria-pressed", "false");

    const name = document.createElement("span");
    name.textContent = brand.name;

    const badge = document.createElement("span");
    badge.className = "clientBadge";
    badge.textContent = brand.badge;

    button.appendChild(name);
    button.appendChild(badge);
    list.appendChild(button);
  });
}

function renderDirectoryList() {
  const list = document.getElementById("directoryList");
  if (!list) return;

  list.innerHTML = "";
  const customerContacts = customersData.flatMap((customer) => (
    (customer.contacts || []).map((contact) => {
      const nameParts = [contact.firstName, contact.lastName].filter(Boolean);
      const email = contact.email || "-";
      const phone = contact.phonePrimary || contact.phoneSecondary || "-";
      const metaParts = [`Company: ${customer.name}`, `Email: ${email}`, `Phone: ${phone}`];
      return {
        name: nameParts.join(" ") || customer.name,
        meta: metaParts.join(" | "),
        group: "customer",
        tagLabel: "Customer",
        tagClass: "tagCustomer"
      };
    })
  ));

  const internalContacts = headerDirectoryContacts.internal.map((entry) => ({
    name: entry.name,
    meta: [`Email: ${entry.email || "-"}`, `Phone: ${entry.phone || "-"}`].join(" | "),
    group: "internal",
    tagLabel: "Internal",
    tagClass: "tagInternal"
  }));

  const entries = [...customerContacts, ...internalContacts].sort(
    (a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" })
  );

  const buildEntry = (entry) => {
    const row = document.createElement("div");
    row.className = "directoryEntry";
    row.setAttribute("data-directory-group", entry.group);

    const nameValue = entry.name || "-";
    const letter = nameValue.trim().charAt(0).toUpperCase();
    row.setAttribute("data-letter", letter || "#");
    row.setAttribute("data-directory-search", `${nameValue} ${entry.meta || ""}`.toLowerCase());

    const body = document.createElement("div");
    const title = document.createElement("div");
    title.className = "directoryName";
    title.textContent = nameValue;
    body.appendChild(title);

    if (entry.meta) {
      const meta = document.createElement("div");
      meta.className = "directoryMeta";
      meta.textContent = entry.meta;
      body.appendChild(meta);
    }

    const tag = document.createElement("span");
    tag.className = `directoryTag ${entry.tagClass}`;
    tag.textContent = entry.tagLabel;

    row.appendChild(body);
    row.appendChild(tag);
    return row;
  };

  entries.forEach((entry) => {
    list.appendChild(buildEntry(entry));
  });
}

function renderDirectoryAlphabet() {
  const alphabet = document.getElementById("directoryAlphabet");
  if (!alphabet) return;

  alphabet.innerHTML = "";
  for (let i = 65; i <= 90; i += 1) {
    const letter = String.fromCharCode(i);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = letter;
    btn.setAttribute("data-directory-letter", letter);
    alphabet.appendChild(btn);
  }
}

function updateDirectoryAlphabet() {
  const alphabet = document.getElementById("directoryAlphabet");
  if (!alphabet) return;

  const visibleLetters = new Set();
  document.querySelectorAll(".directoryEntry:not(.hidden)").forEach((entry) => {
    const letter = entry.getAttribute("data-letter");
    if (letter) visibleLetters.add(letter);
  });

  alphabet.querySelectorAll("[data-directory-letter]").forEach((btn) => {
    const letter = btn.getAttribute("data-directory-letter");
    const isAvailable = visibleLetters.has(letter);
    btn.classList.toggle("is-disabled", !isAvailable);
    btn.setAttribute("aria-disabled", isAvailable ? "false" : "true");
  });
}

function applyDirectoryFilters() {
  const query = directorySearchQuery.trim().toLowerCase();
  document.querySelectorAll(".directoryEntry").forEach((entry) => {
    const group = entry.getAttribute("data-directory-group");
    const searchValue = entry.getAttribute("data-directory-search") || "";
    const matchesFilter = activeDirectoryFilter === "all" || group === activeDirectoryFilter;
    const matchesQuery = !query || searchValue.includes(query);
    const shouldShow = matchesFilter && matchesQuery;
    entry.classList.toggle("hidden", !shouldShow);
  });

  updateDirectoryAlphabet();
}

function setDirectoryFilter(filter) {
  activeDirectoryFilter = filter || "all";
  applyDirectoryFilters();
}

function showDirectoryForm() {
  const popup = document.getElementById("directoryPopup");
  const listView = document.getElementById("directoryListView");
  const formView = document.getElementById("directoryFormView");
  const form = document.getElementById("directoryContactForm");
  if (!popup || !listView || !formView) return;
  if (form) form.reset();
  updateDirectoryContactTypeUI();
  formView.classList.remove("hidden");
  popup.classList.add("is-form");
}

function showDirectoryListView() {
  const popup = document.getElementById("directoryPopup");
  const listView = document.getElementById("directoryListView");
  const formView = document.getElementById("directoryFormView");
  if (!popup || !listView || !formView) return;
  formView.classList.add("hidden");
  popup.classList.remove("is-form");
}

function updateDirectoryContactTypeUI() {
  const typeSelect = document.getElementById("directoryContactType");
  const searchRow = document.getElementById("directoryContactSearchRow");
  if (!typeSelect || !searchRow) return;
  const value = typeSelect.value;
  const shouldShow = value === "customer" || value === "internal";
  searchRow.classList.toggle("hidden", !shouldShow);
}

function wireDirectoryContactType() {
  const typeSelect = document.getElementById("directoryContactType");
  if (!typeSelect) return;
  typeSelect.addEventListener("change", updateDirectoryContactTypeUI);
  updateDirectoryContactTypeUI();
}

function populateDirectoryContactCompanyList() {
  const list = document.getElementById("directoryContactCompanyList");
  if (!list) return;
  list.innerHTML = "";
  const names = customersData.map((customer) => customer.name).filter(Boolean);
  const unique = Array.from(new Set(names)).sort((a, b) => a.localeCompare(b));
  unique.forEach((name) => {
    const option = document.createElement("option");
    option.value = name;
    list.appendChild(option);
  });
}

function wireDirectoryFilters() {
  const filterWrap = document.querySelector(".directoryFilters");
  if (!filterWrap) return;

  filterWrap.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-directory-filter]");
    if (!btn) return;
    const filter = btn.getAttribute("data-directory-filter");

    filterWrap.querySelectorAll("[data-directory-filter]").forEach((item) => {
      const isActive = item === btn;
      item.classList.toggle("pillActive", isActive);
      item.setAttribute("aria-pressed", isActive ? "true" : "false");
    });

    setDirectoryFilter(filter);
  });
}

function wireDirectorySearch() {
  const input = document.getElementById("directorySearch");
  if (!input) return;

  input.addEventListener("input", () => {
    directorySearchQuery = input.value || "";
    applyDirectoryFilters();
  });
}

function wireDirectoryAlphabet() {
  const alphabet = document.getElementById("directoryAlphabet");
  const list = document.getElementById("directoryList");
  if (!alphabet || !list) return;

  alphabet.addEventListener("click", (event) => {
    const btn = event.target.closest("[data-directory-letter]");
    if (!btn || btn.classList.contains("is-disabled")) return;
    const letter = btn.getAttribute("data-directory-letter");

    const target = Array.from(list.querySelectorAll(".directoryEntry:not(.hidden)")).find(
      (entry) => entry.getAttribute("data-letter") === letter
    );
    if (target) target.scrollIntoView({ block: "start", behavior: "smooth" });
  });
}

function wireDirectoryAddContact() {
  const addBtn = document.getElementById("directoryAddContactBtn");
  if (!addBtn) return;

  addBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    showDirectoryForm();
  });
}

function wireDirectoryClose() {
  const closeBtn = document.getElementById("directoryCloseBtn");
  const popup = document.getElementById("directoryPopup");
  const btn = document.getElementById("directoryBtn");
  if (!closeBtn || !popup || !btn) return;

  closeBtn.addEventListener("click", (event) => {
    event.stopPropagation();
    closeHeaderPopup(popup, btn);
  });
}

function buildDefaultUserProfile() {
  const activeName = localStorage.getItem("activeUserName") || "Aditi Sharma";
  const parts = activeName.split(" ").filter(Boolean);
  const firstName = parts.shift() || "User";
  const lastName = parts.join(" ");
  const role = localStorage.getItem("activeUserRole") || "agent";
  const loginId = activeName.trim().toLowerCase().replace(/\s+/g, ".");
  return {
    firstName,
    lastName,
    email: `${loginId}@inebura.com`,
    phone: "+91 98xxxxxx21",
    designation: role === "manager" ? "Collections Manager" : "Collections Agent",
    department: "Collections",
    loginId,
    reportingTo: role === "manager" ? "Head of Ops" : "Rohit Mehra",
    role,
    avatarPath: ""
  };
}

function getInitials(firstName, lastName) {
  return [firstName, lastName]
    .filter(Boolean)
    .map((value) => value.trim().charAt(0).toUpperCase())
    .join("")
    .slice(0, 2);
}

function hashStringToIndex(value, size) {
  if (!value || size === 0) return 0;
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash) % size;
}

function ensureUserAvatar(profile) {
  if (profile.photo || profile.avatarPath || userAvatarOptions.length === 0) {
    return profile;
  }
  const seed = profile.loginId || `${profile.firstName || ""}${profile.lastName || ""}`.trim();
  const index = hashStringToIndex(seed || "user", userAvatarOptions.length);
  profile.avatarPath = userAvatarOptions[index];
  saveUserProfile(profile);
  return profile;
}

function setAvatarImage(element, initials, photo, fallbackImage) {
  if (!element) return;
  const imageSrc = photo || fallbackImage;
  if (imageSrc) {
    element.style.backgroundImage = `url(${imageSrc})`;
    element.classList.add("has-photo");
    element.textContent = "";
  } else {
    element.style.backgroundImage = "";
    element.classList.remove("has-photo");
    element.textContent = initials || "US";
  }
}

function getUserProfile() {
  const stored = localStorage.getItem("userProfile");
  if (stored) {
    try {
      return ensureUserAvatar(JSON.parse(stored));
    } catch (err) {
      return ensureUserAvatar(buildDefaultUserProfile());
    }
  }
  return ensureUserAvatar(buildDefaultUserProfile());
}

function saveUserProfile(profile) {
  localStorage.setItem("userProfile", JSON.stringify(profile));
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ");
  if (fullName) localStorage.setItem("activeUserName", fullName);
  if (profile.role) localStorage.setItem("activeUserRole", profile.role);
}

function renderUserPopup() {
  const profile = getUserProfile();
  const fullName = [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "User";
  const avatar = document.getElementById("userPopupAvatar");
  const headerAvatar = document.getElementById("headerUserAvatar");
  const nameEl = document.getElementById("userPopupName");
  const emailEl = document.getElementById("userPopupEmail");
  const loginEl = document.getElementById("userPopupLoginId");
  const roleValueEl = document.getElementById("userPopupRoleValue");

  const initials = getInitials(profile.firstName, profile.lastName);
  setAvatarImage(avatar, initials, profile.photo, profile.avatarPath);
  setAvatarImage(headerAvatar, initials, profile.photo, profile.avatarPath);
  if (nameEl) nameEl.textContent = fullName;
  const roleLabel = userRoleLabels[profile.role] || profile.role || "Agent";
  if (emailEl) emailEl.textContent = profile.email || "-";
  if (loginEl) loginEl.textContent = profile.loginId || "-";
  if (roleValueEl) roleValueEl.textContent = roleLabel;
}

function populateUserUpdateForm() {
  const profile = getUserProfile();
  const avatar = document.getElementById("userUpdateAvatar");
  const photoInput = document.getElementById("userUpdatePhoto");
  const initials = getInitials(profile.firstName, profile.lastName);
  const formMap = {
    userUpdateFirstName: profile.firstName,
    userUpdateLastName: profile.lastName,
    userUpdateEmail: profile.email,
    userUpdatePhone: profile.phone,
    userUpdateDesignation: profile.designation,
    userUpdateDepartment: profile.department,
    userUpdateLoginId: profile.loginId,
    userUpdateReportingTo: profile.reportingTo
  };

  Object.entries(formMap).forEach(([id, value]) => {
    const input = document.getElementById(id);
    if (input) input.value = value || "";
  });

  if (photoInput) photoInput.value = "";
  setAvatarImage(avatar, initials, profile.photo, profile.avatarPath);
}

function wireUserPopupEvents() {
  const userBtn = document.getElementById("headerUserBtn");
  const userPopup = document.getElementById("userPopup");
  const userWrap = document.getElementById("userPopupWrap");
  const updateModal = document.getElementById("userUpdateModal");
  const updateSave = document.getElementById("userUpdateSaveBtn");
  const updateTriggers = document.querySelectorAll("[data-user-update]");
  const photoInput = document.getElementById("userUpdatePhoto");
  const updateAvatar = document.getElementById("userUpdateAvatar");
  let pendingPhotoData = null;

  if (userBtn && userPopup) {
    userBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      const shouldOpen = userPopup.classList.contains("hidden");
      if (shouldOpen) {
        renderUserPopup();
        userPopup.classList.remove("hidden");
        userBtn.setAttribute("aria-expanded", "true");
        closeHeaderPopups();
        if (typeof toggleNotificationPopup === "function") {
          toggleNotificationPopup(false);
        }
      } else {
        userPopup.classList.add("hidden");
        userBtn.setAttribute("aria-expanded", "false");
      }
    });
  }

  document.addEventListener("click", (event) => {
    if (!userPopup || userPopup.classList.contains("hidden")) return;
    if (userWrap && userWrap.contains(event.target)) return;
    userPopup.classList.add("hidden");
    if (userBtn) userBtn.setAttribute("aria-expanded", "false");
  });

  if (updateModal) {
    updateTriggers.forEach((btn) => {
      btn.addEventListener("click", (event) => {
        event.stopPropagation();
        pendingPhotoData = null;
        populateUserUpdateForm();
        const modal = bootstrap.Modal.getOrCreateInstance(updateModal);
        modal.show();
      });
    });
  }

  if (photoInput && updateAvatar) {
    photoInput.addEventListener("change", () => {
      const file = photoInput.files && photoInput.files[0];
      if (!file) {
        const profile = getUserProfile();
        const initials = getInitials(profile.firstName, profile.lastName);
        setAvatarImage(updateAvatar, initials, profile.photo);
        pendingPhotoData = null;
        return;
      }
      const reader = new FileReader();
      reader.onload = () => {
        const profile = getUserProfile();
        const initials = getInitials(profile.firstName, profile.lastName);
        pendingPhotoData = reader.result;
        setAvatarImage(updateAvatar, initials, pendingPhotoData, profile.avatarPath);
        const headerAvatar = document.getElementById("headerUserAvatar");
        setAvatarImage(headerAvatar, initials, pendingPhotoData, profile.avatarPath);
      };
      reader.readAsDataURL(file);
    });
  }

  if (updateSave && updateModal) {
    updateSave.addEventListener("click", () => {
      const profile = getUserProfile();
      profile.firstName = (document.getElementById("userUpdateFirstName") || {}).value || "";
      profile.lastName = (document.getElementById("userUpdateLastName") || {}).value || "";
      profile.email = (document.getElementById("userUpdateEmail") || {}).value || "";
      profile.phone = (document.getElementById("userUpdatePhone") || {}).value || "";
      profile.designation = (document.getElementById("userUpdateDesignation") || {}).value || "";
      profile.department = (document.getElementById("userUpdateDepartment") || {}).value || "";
      const finalizeSave = (photoData) => {
        if (photoData) profile.photo = photoData;
        saveUserProfile(profile);
        renderUserPopup();
        const modal = bootstrap.Modal.getInstance(updateModal);
        if (modal) modal.hide();
        pendingPhotoData = null;
      };

      finalizeSave(pendingPhotoData);
    });
  }
}

function closeHeaderPopup(popup, button) {
  if (!popup) return;
  popup.classList.add("hidden");
  if (button) button.setAttribute("aria-expanded", "false");
}

function openDirectoryPopup() {
  const popup = document.getElementById("directoryPopup");
  const btn = document.getElementById("directoryBtn");
  if (!popup || !btn) return;
  closeHeaderPopups(popup);
  if (typeof toggleNotificationPopup === "function") {
    toggleNotificationPopup(false);
  }
  popup.classList.remove("hidden");
  btn.setAttribute("aria-expanded", "true");
  showDirectoryListView();
}

function closeHeaderPopups(exceptPopup) {
  const clientPopup = document.getElementById("clientPickerPopup");
  const clientBtn = document.getElementById("clientPickerBtn");
  if (clientPopup && clientPopup !== exceptPopup) {
    closeHeaderPopup(clientPopup, clientBtn);
  }

  const directoryPopup = document.getElementById("directoryPopup");
  const directoryBtn = document.getElementById("directoryBtn");
  if (directoryPopup && directoryPopup !== exceptPopup) {
    closeHeaderPopup(directoryPopup, directoryBtn);
  }
}

function toggleHeaderPopup(popup, button) {
  if (!popup) return;
  const shouldOpen = popup.classList.contains("hidden");

  if (!shouldOpen) {
    closeHeaderPopup(popup, button);
    return;
  }

  closeHeaderPopups(popup);
  if (typeof toggleNotificationPopup === "function") {
    toggleNotificationPopup(false);
  }
  popup.classList.remove("hidden");
  if (popup.id === "directoryPopup") {
    showDirectoryListView();
  }
  if (button) button.setAttribute("aria-expanded", "true");
}

function wireHeaderPopupEvents() {
  const clientBtn = document.getElementById("clientPickerBtn");
  const clientPopup = document.getElementById("clientPickerPopup");
  const clientWrap = document.getElementById("clientPickerWrap");

  const directoryBtn = document.getElementById("directoryBtn");
  const directoryPopup = document.getElementById("directoryPopup");
  const directoryWrap = document.getElementById("directoryWrap");

  if (clientBtn) {
    clientBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      toggleHeaderPopup(clientPopup, clientBtn);
    });
  }

  if (directoryBtn) {
    directoryBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      openDirectoryPopup();
    });
  }

  if (clientPopup) {
    clientPopup.addEventListener("click", (event) => {
      const item = event.target.closest("[data-client-id]");
      if (!item) return;
      applyTenantBrand(item.getAttribute("data-client-id"));
      closeHeaderPopup(clientPopup, clientBtn);
    });
  }

  document.addEventListener("click", (event) => {
    if (event.target.closest("#addCustomerContactBtn")) {
      return;
    }
    if (clientPopup && !clientPopup.classList.contains("hidden")) {
      if (!clientWrap || !clientWrap.contains(event.target)) {
        closeHeaderPopup(clientPopup, clientBtn);
      }
    }

    // Directory popup stays open unless explicitly closed elsewhere.
  });
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
      const toggle = event.target.closest(".nav-link[data-toggle=\"submenu\"]");
      if (toggle) {
        event.preventDefault();
        const menuItem = toggle.closest(".menu-item");
        if (!menuItem) return;
        const isOpen = menuItem.classList.toggle("open");
        toggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
        return;
      }

      const item = event.target.closest(".nav-link[data-module], .submenu-link[data-module]");
      if (!item) return;
      const moduleKey = item.getAttribute("data-module");
      const activeRole = String(localStorage.getItem("activeUserRole") || "").trim().toLowerCase();
      const landingPath = activeRole === "customer" ? "pages/LPcustomer.html" : "LPagent.html";
      const destinations = {
        "visit": "pages/visitmodule.html",
        "visit-review": "pages/visitmoduleReview.html",
        "landing": landingPath,
        "landing-agent": "LPagent.html",
        "landing-customer": "pages/LPcustomer.html",
        "landing-manager": "pages/LPmanager.html",
        "landing-backend": "pages/LPbackend.html",
        "pdc-agent": "pages/PDCagent.html",
        "pdc-ops": "pages/PDCOps.html"
      };
      const target = destinations[moduleKey];
      if (target) window.location.href = resolvePath(target);
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  renderClientPicker();
  applyTenantBrand();
  renderDirectoryList();
  renderDirectoryAlphabet();
  setDirectoryFilter("all");
  wireDirectoryFilters();
  wireDirectorySearch();
  wireDirectoryAlphabet();
  wireDirectoryAddContact();
  wireDirectoryClose();
  wireDirectoryContactType();
  populateDirectoryContactCompanyList();
  wireHeaderPopupEvents();
  wireUserPopupEvents();
  renderUserPopup();
  initUserSelect();
  wireSideNavEvents();
  syncLegacyNotificationsToCenter();
  seedNotificationCenter();
  updateManagerNotificationBadge();

  const search = document.getElementById("customerSearch");
  if (search) {
    search.addEventListener("input", () => {
      renderCustomers(getFilteredCustomers(), selectedCustomerId);
    });
  }

  const invoiceSearch = document.getElementById("invoiceSearch");
  if (invoiceSearch) {
    invoiceSearch.addEventListener("input", () => {
      currentPage = 1;
      closeFloatingMenu();
      applyFiltersAndRender();
    });
  }

  const customerSortSelect = document.getElementById("customerSortSelect");
  if (customerSortSelect) {
    customerSortSelect.addEventListener("change", () => {
      renderCustomers(getFilteredCustomers(), selectedCustomerId);
    });
  }

  wireLeftPanelTabs();

  wireTabEvents();
  wireContactEvents();
  wireDispositionEvents();
  wireDispositionActivityEvents();
  wireCustomerPayRemarkEvents();
  wireEmailPanelEvents();
  wireDocsEvents();
  wireFilterEvents();
  wireIssueCountNavigation();
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
      closeHeaderPopups();
      toggleNotificationPopup();
    });
  }

  const notificationExpandBtn = document.getElementById("notificationExpandBtn");
  if (notificationExpandBtn) {
    notificationExpandBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      const popup = document.getElementById("notificationPopup");
      if (!popup) return;
      const isExpanded = popup.classList.toggle("expanded");
      const icon = notificationExpandBtn.querySelector("i");
      if (icon) {
        icon.className = isExpanded ? "bi bi-arrows-angle-contract" : "bi bi-arrows-angle-expand";
      }
    });
  }

  const notificationPopup = document.getElementById("notificationPopup");
  if (notificationPopup) {
    notificationPopup.addEventListener("click", (event) => {
      const runAction = (action, href, invNo, noteId = "") => {
        if (action === "open-invoice" && invNo && openInvoiceContext(invNo)) {
          setActiveTab("invoice");
          return true;
        }
        if (action === "open-todo") {
          setActiveTab("todo");
          return true;
        }
        if (action === "open-email") {
          if (invNo) openInvoiceContext(invNo);
          openEmailPanel(invNo || "");
          setActiveTab("invoice");
          return true;
        }
        if (action === "open-disposition") {
          if (!invNo || !openInvoiceContext(invNo)) {
            showTransientNotification("Invoice not found", "Unable to open activity for this invoice.", "error");
            return false;
          }
          const note = getNotificationCenterItemById(noteId);
          const fallbackPrefill = getLatestCustomerPaymentPrefill(invNo);
          const statusPrefill = note?.data?.prefillStatus || {};
          const collectionPrefill = note?.data?.prefillDisposition || {};
          const hasCollectionPayload = collectionPrefill && typeof collectionPrefill === "object"
            && Object.keys(collectionPrefill).length > 0;
          const hasStatusPayload = statusPrefill && typeof statusPrefill === "object"
            && Object.keys(statusPrefill).length > 0;
          const prefill = hasCollectionPayload || hasStatusPayload
            ? { ...(fallbackPrefill || {}), ...statusPrefill, ...collectionPrefill }
            : (fallbackPrefill || null);
          openDispositionForSingleInvoice(invNo, prefill);
          setActiveTab("invoice");
          return true;
        }
        if (action === "open-pdc") {
          const target = isManagerView ? "pages/PDCOps.html" : "pages/PDCagent.html";
          window.location.href = resolvePath(target);
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
        runAction(
          cta.getAttribute("data-action"),
          cta.getAttribute("data-href"),
          cta.getAttribute("data-inv"),
          cta.getAttribute("data-note")
        );
        return;
      }

      if (notificationPopup.classList.contains("expanded")) return;
      const card = event.target.closest(".notificationCard");
      if (!card) return;
      runAction(
        card.getAttribute("data-action"),
        card.getAttribute("data-href"),
        card.getAttribute("data-inv"),
        card.getAttribute("data-note-id")
      );
    });
  }

  document.addEventListener("click", (event) => {
    const popup = document.getElementById("notificationPopup");
    const wrap = document.querySelector(".notificationBellWrap");
    if (!popup || popup.classList.contains("hidden")) return;
    if (wrap && wrap.contains(event.target)) return;
    toggleNotificationPopup(false);
  });

    window.addEventListener("storage", (event) => {
      if (event.key === notificationCenterKey || event.key === managerNotificationsKey || event.key === pdcNotificationKey) {
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
    if (event.key === activityTrailStorageKey) {
      renderStoredActivityTrail(currentInvoiceNoForDocs);
    }
    if (event.key === issueTrackerCustomKey) {
      renderStoredActivityTrail(currentInvoiceNoForDocs);
    }
    if (event.key === issueTrackerTotalKey || event.key === issueTrackerCustomKey || event.key === issueTrackerBaseKey) {
      updateCenterIssueCountDisplay();
    }
    if (event.key === invoiceStatusOverridesKey) {
      applyInvoiceStatusOverrides(customersData);
      const customer = customersData.find(c => c.id === selectedCustomerId) || customersData[0];
      if (customer) {
        renderCenter(customer);
        renderCustomerDetails(customer);
        currentInvoicesAll = customer.invoices || [];
        populateFilters(currentInvoicesAll);
        applyFiltersAndRender();
      }
      if (currentInvoiceNoForDocs) {
        selectInvoiceByNo(currentInvoiceNoForDocs);
      }
    }
  });

  const refreshIssueCount = () => {
    const customer = customersData.find(c => c.id === selectedCustomerId);
    const fallback = customer
      ? (customer.invoices || []).filter(inv => {
          const status = String(inv.status || "").toLowerCase();
          const primary = String(inv.primaryStatus || "").toLowerCase();
          return status === "dispute" || primary === "dispute";
        }).length
      : 0;
    updateCenterIssueCountDisplay(fallback);
  };

  window.addEventListener("focus", refreshIssueCount);
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) refreshIssueCount();
  });

  const bulkNew = document.getElementById("bulkNewActivity");
  if (bulkNew && isManagerView) {
    bulkNew.textContent = "Add remarks";
  }

  const invoiceStorageKey = "ineburaInvoiceData";
  const invoiceSnapshot = customersData.flatMap((customer) => (
    (customer.invoices || []).map((invoice) => ({
      customerName: customer.name,
      customerCode: customer.code,
      invoiceNo: invoice.invoiceNo,
      invoiceDate: invoice.invoiceDate || "",
      invoiceValue: Number(invoice.invoiceAmount) || 0,
      dueDate: invoice.dueDate || "",
      amountForMonth: Number(invoice.amountForMonth) || 0
    }))
  ));
  localStorage.setItem(invoiceStorageKey, JSON.stringify(invoiceSnapshot));

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
