(() => {
  const STORAGE_KEY = "ineburaStrategyMaster";
  const LEGACY_STORAGE_KEY = "ineburaStrategyNotifications";
  const TEMPLATE_SOURCE_MAP = window.ineburaStrategyTemplateSource || {};

  const MODE_LABELS = {
    custom: "Custom",
    ongoing: "Ongoing"
  };

  const TIMING_OPTIONS = {
    before: "Days Before Due Date",
    after: "Days After Due Date"
  };

  const PTP_TIMING_OPTIONS = {
    before: "Days Before PTP Date",
    after: "Days After PTP Date"
  };

  const INVOICE_TIMING_OPTIONS = {
    before: "Days Before Invoice Date",
    after: "Days After Invoice Date"
  };

  const TEMPLATE_TIMING_OPTION_OVERRIDES = {
    cheque_bounce: {
      after: "Days After Cheque Bounced"
    },
    acknowledgement_of_invoice_receipt: {
      after: "Days After Invoice And Document Uploaded"
    },
    request_for_payment_advice_or_details: {
      after: "Days After Collected/Part Collected"
    },
    new_invoice_no_os: {
      after: "Days After New Invoice Is Uploaded"
    },
    new_invoice_existing_customer: {
      after: "Days After New Invoice Is Uploaded"
    }
  };

  const TEMPLATE_TIMING_DESCRIPTIONS = {
    cheque_bounce: "Custom mode only uses cheque-bounce offsets. Add one or more steps for this template.",
    acknowledgement_of_invoice_receipt: "Custom mode only uses invoice-and-document-upload offsets. Add one or more steps for this template.",
    request_for_payment_advice_or_details: "Custom mode only uses collected or part-collected offsets. Add one or more steps for this template.",
    new_invoice_no_os: "Custom mode only uses new-invoice-upload offsets. Add one or more steps for this template.",
    new_invoice_existing_customer: "Custom mode only uses new-invoice-upload offsets. Add one or more steps for this template."
  };

  const KEY_ACCOUNT_OPTIONS = [
    { value: "all", label: "All" },
    { value: "yes", label: "YES" },
    { value: "no", label: "NO" }
  ];

  const CUSTOM_ATTACHMENT_OPTIONS = ["Invoice"];
  const ONGOING_ATTACHMENT_OPTIONS = ["Invoice"];
  const PREVIEW_REPLACEMENTS = [
    { pattern: /\$\{Email_PaymentDue\.reportData\.content\[0\]\.customerName\}/g, value: "Acme Manufacturing Pvt Ltd" },
    { pattern: /\$\{Email_PaymentDue\.reportData\.content\[0\]\.clientName\}/g, value: "Inebura Technologies" },
    { pattern: /\$\{Email_PaymentDue\.reportData\.content\[0\]\.totalDueAmount\}/g, value: "1,24,500" },
    { pattern: /\$\{Email_PaymentDue\.reportData\.content\[0\]\.totalOutstanding\}/g, value: "4,82,900" },
    { pattern: /\$\{Email_PaymentDue\.reportData\.content\[0\]\.currency\}/g, value: "INR" },
    { pattern: /\$\{Email_PaymentDue\.reportData\.content\[0\]\.agent\}/g, value: "Aarav Menon" },
    { pattern: /\$\{Email_PaymentDue\.reportData\.content\[0\]\.instrumentRefNo\}/g, value: "CHQ-204918" },
    { pattern: /\$\{Email_PaymentDue\.reportData\.content\[0\]\.instrumentTransferDate\}/g, value: "17 Jun 2026" },
    { pattern: /\$\{Email_PaymentDue\.reportData\.content\[0\]\.bank\}/g, value: "HDFC Bank" },
    { pattern: /\$\{invoiceList\.invoiceNo\}/g, value: "INV-20491" },
    { pattern: /\$\{invoiceList\.invoiceDate\}/g, value: "12 Jun 2026" },
    { pattern: /\$\{invoiceList\.poNumber\}/g, value: "PO-7718" },
    { pattern: /\$\{invoiceList\.invoiceValue\}/g, value: "62,250" },
    { pattern: /\$\{invoiceList\.outstandingAmount\}/g, value: "62,250" },
    { pattern: /\$\{invoiceList\.dueAmount\}/g, value: "62,250" },
    { pattern: /\$\{invoiceList\.currency\}/g, value: "INR" },
    { pattern: /\$\{invoiceList\.invoiceDueDate\}/g, value: "25 Jun 2026" },
    { pattern: /\$\{invoiceList\.commitDate\}/g, value: "19 Jun 2026" },
    { pattern: /\$\{invoiceList\.collectedAmount\}/g, value: "45,000" },
    { pattern: /\$\{invoiceList\.chequeNo\}/g, value: "UTR984201" },
    { pattern: /\$\{invoiceList\.paymentDate\}/g, value: "16 Jun 2026" },
    { pattern: /\$\{subdomain\}/g, value: "toyota" },
    { pattern: /\$\{InputParams\.token\}/g, value: "preview-token-001" }
  ];
  const INVOICE_DISPOSITION_TREE = [
    {
      broadStatus: "Work In Progress",
      primaries: [
        {
          primaryStatus: "No Due",
          subStatuses: [
            "Within Credit Period/Days",
            "LC Payment",
            "As Per Payment Terms",
            "Retention Amount",
            "SD Amount"
          ]
        },
        {
          primaryStatus: "Part Collected",
          subStatuses: ["Part Payment through LC done", "Part Payment Made"]
        },
        {
          primaryStatus: "PTP",
          subStatuses: ["PTP"]
        },
        {
          primaryStatus: "Collection In Progress",
          subStatuses: [
            "Funds Issue",
            "PDC Given",
            "Call Back",
            "Cold Call",
            "Issue With Address Mentioned",
            "Recon Required",
            "Not my Invoice",
            "Call Back/Email Follow up"
          ]
        },
        {
          primaryStatus: "Invoice Assignment",
          subStatuses: ["Assign the Invoice to Others"]
        }
      ]
    },
    {
      broadStatus: "Red Flag",
      primaries: [
        {
          primaryStatus: "Guidance",
          subStatuses: [
            "Company Closed/Shut down",
            "Recommended For Legal",
            "Office Closed/Shut Down",
            "Shifted - Address Not Found",
            "Fix Dunning letter strategy",
            "Send Pre-Legal Letter"
          ]
        }
      ]
    },
    {
      broadStatus: "External dependency",
      primaries: [
        {
          primaryStatus: "Further Docs Required",
          subStatuses: [
            "Invoice Copy Required",
            "PO (Purchase Order) Copy Required",
            "Service/PM Report Required",
            "Compliance Docs (Salary, PF, Attendance & ESI) required",
            "Indeminity Bond Required",
            "BG/PBG Required",
            "GST Challan/ GST Certifcate by CA Required",
            "Delivery Challan Required",
            "Statutory Docs(PAN, GST Registration, Turnover Certifcate ) Required"
          ]
        },
        {
          primaryStatus: "Further Action Required",
          subStatuses: [
            "Wrong/Incorrect Billing",
            "Payment Wrongly Adjusted",
            "PO Cancelled/Contract Terminated",
            "Proposed For Write-Off",
            "Credit Note To Be Issued",
            "Vendor Portal Issue",
            "Reversal & Re-Bill",
            "Tax Issue On The Invoice",
            "Customized Invoice Required",
            "Discount Required",
            "Customer deduction",
            "Proposed for Cancellation"
          ]
        },
        {
          primaryStatus: "Material Delivery Issues",
          subStatuses: [
            "Material Not Received",
            "Partial Material Received",
            "Damaged Material Received",
            "Late Shipment",
            "Wrong Material Delivered",
            "Material Delivered To Wrong Site",
            "Material Recalled/Returned"
          ]
        },
        {
          primaryStatus: "Service Related Issues",
          subStatuses: [
            "PM Pending",
            "Equipment Not Working",
            "Call Not Attended",
            "Turnkey Project Issues",
            "Unsatisfactory Service Report By Customer",
            "Installation Pending",
            "Commissioning Pending",
            "Inspection Pending"
          ]
        }
      ]
    },
    {
      broadStatus: "Collection Done",
      primaries: [
        {
          primaryStatus: "Collected",
          subStatuses: ["Collected"]
        }
      ]
    }
  ];
  const INVOICE_BROAD_STATUSES = INVOICE_DISPOSITION_TREE.map((item) => item.broadStatus);
  const ALL_INVOICE_SUBSTATUSES = INVOICE_DISPOSITION_TREE.flatMap((item) =>
    item.primaries.flatMap((primary) => primary.subStatuses)
  );
  const AGING_BUCKETS = [
    "Not Due",
    "1-30",
    "31-45",
    "46-60",
    "61-90",
    "91-120",
    "121-150",
    "151-180",
    "181-210",
    "211-240",
    "241-270",
    "271-300",
    "301-330",
    "331-365",
    "1-2 yrs",
    "2-3 yrs",
    "3-4 yrs",
    "4-5 yrs",
    "5+ yrs"
  ];

  const DISPOSITION_GROUPS = {
    ptp: {
      label: "PTP",
      description: "Promise-to-pay cases already in motion.",
      subStatuses: ["PTP", "Future Commit Month", "PDC Given", "Part Payment Made", "Call Back/Email"]
    },
    due_reminder: {
      label: "Due Reminder",
      description: "Routine pre-due and post-due collection flows.",
      subStatuses: ["Within Credit Period", "As Per Payment Terms", "Funds Issue", "Call Back", "Call Back/Email", "Customer deduction", "Part Payment Made"]
    },
    document_pending: {
      label: "Document Pending",
      description: "Payment depends on documents still moving around the building.",
      subStatuses: ["Invoice Copy Required", "Need Further Documents", "PO Copy Required", "Service/PM Report Required", "Accepted By User", "Not Received By Customer", "Submitted To Reception", "Submitted To Others", "Vendor Portal"]
    },
    dispute: {
      label: "Dispute",
      description: "Commercial or invoice correctness issues.",
      subStatuses: ["Wrong Billing", "Customized Invoice Required", "Rejected by Customer -Supporting Docs required", "Rejected by Customer -Invoice Not correct", "Tax Issue On The Invoice", "Recon Required", "Payment Wrongly Adjusted"]
    },
    contactability: {
      label: "Contactability",
      description: "Collectible on paper, slippery in real life.",
      subStatuses: ["Contact But No RPC", "Number Always Busy", "Customer Visit Required", "Call Back", "Call Back/Email"]
    },
    legal: {
      label: "Legal",
      description: "Escalation-heavy or pre-legal collection posture.",
      subStatuses: ["Recommended For Legal", "Send Pre-Legal Letter", "Proposed For Write-Off"]
    },
    service_issue: {
      label: "Service Issue",
      description: "Collection blocked by service delivery issues.",
      subStatuses: ["PM Pending", "Equipment Not Working", "Installation Pending"]
    },
    material_issue: {
      label: "Material Issue",
      description: "Collection blocked by delivery or material problems.",
      subStatuses: ["Material Not Received", "Partial Material Received", "Damaged Material Received"]
    },
    other: {
      label: "Other",
      description: "Everything that refuses tidy categorisation.",
      subStatuses: ["Assign the Invoice to Others", "External Submission", "Skip Tracing Required"]
    }
  };

  const TEMPLATE_DEFINITIONS = [
    {
      id: "cheque_bounce",
      label: "ChequeBounce",
      supportedModes: ["custom"],
      supportedTimings: ["after"],
      allowedDispositionGroups: ["due_reminder", "legal"],
      defaultDispositionGroups: ["due_reminder"],
      allowedSubStatuses: ["Funds Issue", "Part Payment Made", "Call Back/Email", "Recommended For Legal", "Send Pre-Legal Letter"],
      defaultSubStatuses: ["Funds Issue", "Call Back/Email"],
      defaultInvoiceStatuses: ["Overdue"],
      defaultAgingBuckets: ["1-30", "31-45", "46-60"]
    },
    {
      id: "acknowledgement_of_invoice_receipt",
      label: "AcknowledgementOfInvoiceReceipt",
      supportedModes: ["custom"],
      supportedTimings: ["after"],
      allowedDispositionGroups: ["document_pending"],
      defaultDispositionGroups: ["document_pending"],
      allowedSubStatuses: ["Accepted By User", "Not Received By Customer", "Submitted To Reception", "Submitted To Others", "Vendor Portal"],
      defaultSubStatuses: ["Accepted By User", "Not Received By Customer"],
      defaultInvoiceStatuses: ["Pre-Due", "Dispute"],
      defaultAgingBuckets: ["Not Due", "1-30"]
    },
    {
      id: "invoice_resubmission",
      label: "InvoiceResubmission",
      supportedModes: ["custom", "ongoing"],
      supportedTimings: ["before", "after"],
      allowedDispositionGroups: ["document_pending", "dispute"],
      defaultDispositionGroups: ["document_pending"],
      allowedSubStatuses: ["Invoice Copy Required", "Need Further Documents", "PO Copy Required", "Service/PM Report Required", "Wrong Billing", "Customized Invoice Required", "Rejected by Customer -Supporting Docs required"],
      defaultSubStatuses: ["Invoice Copy Required", "Need Further Documents", "Rejected by Customer -Supporting Docs required"],
      defaultInvoiceStatuses: ["Dispute", "Overdue"],
      defaultAgingBuckets: ["1-30", "31-45", "46-60"]
    },
    {
      id: "pending_payments",
      label: "PendingPayments",
      supportedModes: ["custom", "ongoing"],
      supportedTimings: ["before", "after"],
      allowedDispositionGroups: ["due_reminder", "contactability"],
      defaultDispositionGroups: ["due_reminder"],
      allowedSubStatuses: ["Funds Issue", "As Per Payment Terms", "Part Payment Made", "Call Back", "Call Back/Email", "Customer deduction", "Contact But No RPC", "Number Always Busy", "Customer Visit Required"],
      defaultSubStatuses: ["Funds Issue", "Call Back/Email", "Part Payment Made"],
      defaultInvoiceStatuses: ["Overdue"],
      defaultAgingBuckets: ["1-30", "31-45", "46-60", "61-90"]
    },
    {
      id: "ptp_missed_mail",
      label: "PTPMissedMail",
      supportedModes: ["custom"],
      supportedTimings: ["after"],
      allowedDispositionGroups: ["ptp"],
      defaultDispositionGroups: ["ptp"],
      allowedSubStatuses: ["PTP", "Future Commit Month", "PDC Given"],
      defaultSubStatuses: ["PTP", "Future Commit Month"],
      defaultInvoiceStatuses: ["PTP"],
      defaultAgingBuckets: ["1-30", "31-45", "46-60", "61-90"]
    },
    {
      id: "ptp_confirmation_mail",
      label: "PTPConfirmationMail",
      supportedModes: ["custom", "ongoing"],
      supportedTimings: ["before"],
      allowedDispositionGroups: ["ptp"],
      defaultDispositionGroups: ["ptp"],
      allowedSubStatuses: ["PTP", "Future Commit Month", "PDC Given", "Part Payment Made"],
      defaultSubStatuses: ["PTP", "PDC Given"],
      defaultInvoiceStatuses: ["PTP"],
      defaultAgingBuckets: ["Not Due", "1-30", "31-45", "46-60"]
    },
    {
      id: "request_for_payment_advice_or_details",
      label: "RequestForPaymentAdviceOrDetails",
      supportedModes: ["custom", "ongoing"],
      supportedTimings: ["after"],
      allowedDispositionGroups: ["due_reminder", "contactability"],
      defaultDispositionGroups: ["due_reminder"],
      allowedSubStatuses: ["Part Payment Made", "Customer deduction", "Call Back/Email", "Funds Issue", "Contact But No RPC", "Customer Visit Required"],
      defaultSubStatuses: ["Part Payment Made", "Call Back/Email"],
      defaultInvoiceStatuses: ["Overdue"],
      defaultAgingBuckets: ["1-30", "31-45", "46-60"]
    },
    {
      id: "reminder_for_payment_due",
      label: "ReminderForPaymentDue",
      supportedModes: ["custom", "ongoing"],
      supportedTimings: ["before", "after"],
      allowedDispositionGroups: ["due_reminder", "contactability"],
      defaultDispositionGroups: ["due_reminder"],
      allowedSubStatuses: ["Within Credit Period", "As Per Payment Terms", "Call Back", "Call Back/Email", "Funds Issue", "Contact But No RPC", "Number Always Busy"],
      defaultSubStatuses: ["Within Credit Period", "As Per Payment Terms", "Call Back/Email"],
      defaultInvoiceStatuses: ["Pre-Due", "Overdue"],
      defaultAgingBuckets: ["Not Due", "1-30"]
    },
    {
      id: "new_invoice_no_os",
      label: "NewInvoiceNoO/S",
      supportedModes: ["custom"],
      supportedTimings: ["after"],
      allowedDispositionGroups: ["due_reminder", "document_pending"],
      defaultDispositionGroups: ["due_reminder"],
      allowedSubStatuses: ["Within Credit Period", "Accepted By User", "Not Received By Customer", "Call Back/Email"],
      defaultSubStatuses: ["Within Credit Period", "Accepted By User"],
      defaultInvoiceStatuses: ["Pre-Due"],
      defaultAgingBuckets: ["Not Due"]
    },
    {
      id: "new_invoice_existing_customer",
      label: "NewInvoiceExistingCustomer",
      supportedModes: ["custom", "ongoing"],
      supportedTimings: ["after"],
      allowedDispositionGroups: ["due_reminder", "document_pending"],
      defaultDispositionGroups: ["due_reminder"],
      allowedSubStatuses: ["Within Credit Period", "As Per Payment Terms", "Accepted By User", "Submitted To Reception", "Call Back/Email"],
      defaultSubStatuses: ["Within Credit Period", "Accepted By User"],
      defaultInvoiceStatuses: ["Pre-Due", "Overdue"],
      defaultAgingBuckets: ["Not Due", "1-30"]
    }
  ];

  const TEMPLATE_MAP = Object.fromEntries(TEMPLATE_DEFINITIONS.map((template) => [template.id, template]));
  const TEMPLATE_ORDER = [
    "cheque_bounce",
    "acknowledgement_of_invoice_receipt",
    "invoice_resubmission",
    "pending_payments",
    "ptp_missed_mail",
    "ptp_confirmation_mail",
    "request_for_payment_advice_or_details",
    "reminder_for_payment_due",
    "new_invoice_no_os",
    "new_invoice_existing_customer"
  ];

  const state = {
    customers: [],
    invoices: [],
    strategies: [],
    formMode: "create",
    editingId: null,
    activeTemplateUid: null,
    isPreviewOpen: false,
    listSearch: "",
    listStatusFilter: "all",
    listScopeFilter: "all",
    targetSearch: "",
    form: createBlankForm()
  };

  const els = {
    listScreen: document.getElementById("smListScreen"),
    builderScreen: document.getElementById("smBuilderScreen"),
    createNewBtn: document.getElementById("smCreateNewBtn"),
    backToListBtn: document.getElementById("smBackToListBtn"),
    cancelBtn: document.getElementById("smCancelBtn"),
    footerCancelBtn: document.getElementById("smFooterCancelBtn"),
    formTitle: document.getElementById("smFormTitle"),
    formSubtitle: document.getElementById("smFormSubtitle"),
    listSearch: document.getElementById("smListSearch"),
    listStatusFilter: document.getElementById("smListStatusFilter"),
    listScopeFilter: document.getElementById("smListScopeFilter"),
    listBody: document.getElementById("smStrategyListBody"),
    listEmpty: document.getElementById("smStrategyListEmpty"),
    form: document.getElementById("smForm"),
    error: document.getElementById("smFormError"),
    strategyName: document.getElementById("smStrategyName"),
    status: document.getElementById("smStatus"),
    statusLabel: document.getElementById("smStatusLabel"),
    reminderType: document.getElementById("smReminderType"),
    targetType: document.getElementById("smTargetType"),
    targetPickerSection: document.getElementById("smTargetPickerSection"),
    targetHeading: document.getElementById("smTargetHeading"),
    targetDescription: document.getElementById("smTargetDescription"),
    targetCount: document.getElementById("smTargetCount"),
    targetSearch: document.getElementById("smTargetSearch"),
    targetSelectAll: document.getElementById("smTargetSelectAll"),
    targetClear: document.getElementById("smTargetClear"),
    targetList: document.getElementById("smTargetList"),
    templateCount: document.getElementById("smTemplateCount"),
    previewTemplateBtn: document.getElementById("smPreviewTemplateBtn"),
    addTemplateBtn: document.getElementById("smAddTemplateBtn"),
    templateStack: document.getElementById("smTemplateStack"),
    footerMeta: document.getElementById("smFooterMeta"),
    templatePreviewModal: document.getElementById("smTemplatePreviewModal"),
    templatePreviewTitle: document.getElementById("smTemplatePreviewTitle"),
    templatePreviewMeta: document.getElementById("smTemplatePreviewMeta"),
    templatePreviewSubject: document.getElementById("smTemplatePreviewSubject"),
    templatePreviewFrame: document.getElementById("smTemplatePreviewFrame"),
    templatePreviewClose: document.getElementById("smTemplatePreviewClose"),
    templatePreviewFooterClose: document.getElementById("smTemplatePreviewFooterClose")
  };

  function createBlankForm() {
    return {
      strategyName: "",
      status: "active",
      reminderType: "",
      targetType: "",
      selectedTargetIds: [],
      templates: [createTemplateEntry("")]
    };
  }

  function createTemplateEntry(templateId) {
    const entry = {
      uid: `tpl_${Math.random().toString(36).slice(2, 10)}`,
      templateId: "",
      notificationMode: "custom",
      keyAccountFilter: "all",
      reminderSteps: [
        { uid: `step_${Math.random().toString(36).slice(2, 10)}`, days: 1, when: "before", attachments: [] }
      ],
      ongoingInterval: "",
      ongoingAttachments: [],
      dispositionGroups: [],
      subStatuses: [],
      invoiceStatusUi: { broadOpen: [], primaryOpen: [] },
      invoiceBroadSelections: [],
      invoicePrimarySelections: [],
      invoiceStatuses: [],
      agingBuckets: []
    };
    return applyTemplateDefaults(entry, templateId || "", false);
  }

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function dedupe(values) {
    return [...new Set((values || []).filter(Boolean))];
  }

  function intersect(values, allowed) {
    const allowedSet = new Set(allowed || []);
    return dedupe(values).filter((value) => allowedSet.has(value));
  }

  function clampInteger(value, fallback, min = 0, max = 365) {
    const numeric = Number.parseInt(value, 10);
    if (Number.isNaN(numeric)) {
      return fallback;
    }
    return Math.min(Math.max(numeric, min), max);
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#39;");
  }

  function titleCase(value) {
    return String(value || "")
      .replaceAll("_", " ")
      .replace(/\b\w/g, (char) => char.toUpperCase());
  }

  function slugify(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function formatCurrency(amount) {
    const numeric = Number(amount) || 0;
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      maximumFractionDigits: 0
    }).format(numeric);
  }

  function parseDisplayDate(value) {
    if (!value) {
      return null;
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  function differenceInDays(later, earlier) {
    const oneDay = 24 * 60 * 60 * 1000;
    return Math.round((later.getTime() - earlier.getTime()) / oneDay);
  }

  function hashString(value) {
    let hash = 0;
    for (const char of String(value || "")) {
      hash = (hash << 5) - hash + char.charCodeAt(0);
      hash |= 0;
    }
    return Math.abs(hash);
  }

  function pickByHash(seed, values) {
    return values[hashString(seed) % values.length];
  }

  function bucketAgeing(daysPastDue) {
    if (daysPastDue <= 0) return "Not Due";
    if (daysPastDue <= 30) return "1-30";
    if (daysPastDue <= 45) return "31-45";
    if (daysPastDue <= 60) return "46-60";
    if (daysPastDue <= 90) return "61-90";
    if (daysPastDue <= 120) return "91-120";
    if (daysPastDue <= 150) return "121-150";
    if (daysPastDue <= 180) return "151-180";
    if (daysPastDue <= 210) return "181-210";
    if (daysPastDue <= 240) return "211-240";
    if (daysPastDue <= 270) return "241-270";
    if (daysPastDue <= 300) return "271-300";
    if (daysPastDue <= 330) return "301-330";
    if (daysPastDue <= 365) return "331-365";
    if (daysPastDue <= 730) return "1-2 yrs";
    if (daysPastDue <= 1095) return "2-3 yrs";
    if (daysPastDue <= 1460) return "3-4 yrs";
    if (daysPastDue <= 1825) return "4-5 yrs";
    return "5+ yrs";
  }

  function deriveBusinessReferenceDate(customers) {
    const dueDates = customers
      .flatMap((customer) => customer.invoices || [])
      .map((invoice) => parseDisplayDate(invoice.dueDate))
      .filter(Boolean);

    if (!dueDates.length) {
      return new Date();
    }

    const latest = new Date(Math.max(...dueDates.map((date) => date.getTime())));
    latest.setDate(latest.getDate() - 14);
    return latest;
  }

  function getGroupForInvoice(invoice, daysPastDue) {
    const invoiceStatus = String(invoice.invoiceStatus || "").toLowerCase();
    switch (invoice.status) {
      case "PTP":
        return "ptp";
      case "Dispute":
        return invoiceStatus.includes("not submitted")
          ? pickByHash(invoice.invoiceNo, ["document_pending", "dispute"])
          : pickByHash(invoice.invoiceNo, ["dispute", "service_issue", "material_issue"]);
      case "Pre-Due":
        return invoiceStatus.includes("not submitted")
          ? "document_pending"
          : pickByHash(invoice.invoiceNo, ["due_reminder", "document_pending"]);
      case "Overdue":
      default:
        if (daysPastDue > 45 && hashString(invoice.invoiceNo) % 5 === 0) {
          return "legal";
        }
        if (invoiceStatus.includes("not submitted")) {
          return "document_pending";
        }
        return pickByHash(invoice.invoiceNo, ["due_reminder", "contactability", "dispute"]);
    }
  }

  function getSubStatusForGroup(group, invoice) {
    const pool = DISPOSITION_GROUPS[group]?.subStatuses || DISPOSITION_GROUPS.other.subStatuses;
    return pickByHash(invoice.invoiceNo, pool);
  }

  function enrichInvoices(customers) {
    const businessToday = deriveBusinessReferenceDate(customers);
    return customers.flatMap((customer) =>
      (customer.invoices || []).map((invoice) => {
        const dueDate = parseDisplayDate(invoice.dueDate);
        const daysPastDue = dueDate ? differenceInDays(businessToday, dueDate) : 0;
        const dispositionGroup = getGroupForInvoice(invoice, daysPastDue);
        return {
          ...invoice,
          customerId: customer.id,
          customerName: customer.name,
          customerCode: customer.code,
          kamName: customer.kamName || "",
          city: customer.city || "",
          netDueAmount: Number(invoice.netDueAmount || invoice.invoiceAmount || 0),
          ageingBucket: bucketAgeing(daysPastDue),
          dispositionGroup,
          subStatus: getSubStatusForGroup(dispositionGroup, invoice)
        };
      })
    );
  }

  function getRootPath() {
    const raw = String(document.body.dataset.rootPath || "").trim();
    return raw && !raw.endsWith("/") ? `${raw}/` : raw;
  }

  function getTemplate(templateId) {
    return TEMPLATE_MAP[templateId] || null;
  }

  function usesPtpTiming(template) {
    return template?.id === "ptp_missed_mail" || template?.id === "ptp_confirmation_mail";
  }

  function usesInvoiceTiming(template) {
    return template?.id === "acknowledgement_of_invoice_receipt";
  }

  function getTimingLabel(template, timing) {
    const overrideLabels = TEMPLATE_TIMING_OPTION_OVERRIDES[template?.id] || null;
    if (overrideLabels?.[timing]) {
      return overrideLabels[timing];
    }

    const labels = usesPtpTiming(template)
      ? PTP_TIMING_OPTIONS
      : usesInvoiceTiming(template)
        ? INVOICE_TIMING_OPTIONS
        : TIMING_OPTIONS;
    return labels[timing] || TIMING_OPTIONS[timing] || titleCase(timing);
  }

  function getCustomTimingDescription(template) {
    if (template?.id && TEMPLATE_TIMING_DESCRIPTIONS[template.id]) {
      return TEMPLATE_TIMING_DESCRIPTIONS[template.id];
    }
    return usesPtpTiming(template)
      ? "Custom mode only uses PTP-date offsets. Add one or more steps for this template."
      : usesInvoiceTiming(template)
        ? "Custom mode only uses invoice-date offsets. Add one or more steps for this template."
      : "Custom mode only uses due-date offsets. Add one or more steps for this template.";
  }

  function getPrimarySelectionKey(broadStatus, primaryStatus) {
    return `${broadStatus}|||${primaryStatus}`;
  }

  function parsePrimarySelectionKey(value) {
    const [broadStatus, primaryStatus] = String(value || "").split("|||");
    return { broadStatus, primaryStatus };
  }

  function getBroadNode(broadStatus) {
    return INVOICE_DISPOSITION_TREE.find((item) => item.broadStatus === broadStatus) || null;
  }

  function getPrimaryNode(broadStatus, primaryStatus) {
    return getBroadNode(broadStatus)?.primaries.find((item) => item.primaryStatus === primaryStatus) || null;
  }

  function getBroadSubStatuses(broadStatus) {
    const broad = getBroadNode(broadStatus);
    return broad ? broad.primaries.flatMap((primary) => primary.subStatuses) : [];
  }

  function getPrimarySubStatuses(broadStatus, primaryStatus) {
    return getPrimaryNode(broadStatus, primaryStatus)?.subStatuses || [];
  }

  function uniqueSubStatusSelection(values) {
    return intersect(values, ALL_INVOICE_SUBSTATUSES);
  }

  function createInvoiceStatusUi() {
    return {
      broadOpen: [],
      primaryOpen: []
    };
  }

  function ensureInvoiceStatusUi(entry) {
    if (!entry.invoiceStatusUi || typeof entry.invoiceStatusUi !== "object") {
      entry.invoiceStatusUi = createInvoiceStatusUi();
    }

    entry.invoiceStatusUi.broadOpen = intersect(entry.invoiceStatusUi.broadOpen || [], INVOICE_BROAD_STATUSES);
    entry.invoiceStatusUi.primaryOpen = dedupe(entry.invoiceStatusUi.primaryOpen || []).filter((value) => {
      const { broadStatus, primaryStatus } = parsePrimarySelectionKey(value);
      return !!getPrimaryNode(broadStatus, primaryStatus);
    });

    return entry.invoiceStatusUi;
  }

  function sanitizeInvoiceStatusState(entry, preserveExisting) {
    const next = entry;
    if (!preserveExisting && !(next.invoiceBroadSelections || []).length && !(next.invoicePrimarySelections || []).length) {
      next.invoiceBroadSelections = [...INVOICE_BROAD_STATUSES];
    }

    next.invoiceBroadSelections = intersect(next.invoiceBroadSelections || [], INVOICE_BROAD_STATUSES);
    next.invoicePrimarySelections = dedupe(next.invoicePrimarySelections || []).filter((value) => {
      const { broadStatus, primaryStatus } = parsePrimarySelectionKey(value);
      return !!getPrimaryNode(broadStatus, primaryStatus);
    });

    next.invoicePrimarySelections = next.invoicePrimarySelections.filter((value) => {
      const { broadStatus } = parsePrimarySelectionKey(value);
      return !next.invoiceBroadSelections.includes(broadStatus);
    });

    next.invoiceStatuses = uniqueSubStatusSelection(preserveExisting ? next.invoiceStatuses : ALL_INVOICE_SUBSTATUSES);
    if (!next.invoiceStatuses.length) {
      next.invoiceStatuses = [...ALL_INVOICE_SUBSTATUSES];
    }

    next.invoiceBroadSelections.forEach((broadStatus) => {
      next.invoiceStatuses = dedupe([...next.invoiceStatuses, ...getBroadSubStatuses(broadStatus)]);
    });

    next.invoicePrimarySelections.forEach((value) => {
      const { broadStatus, primaryStatus } = parsePrimarySelectionKey(value);
      next.invoiceStatuses = dedupe([...next.invoiceStatuses, ...getPrimarySubStatuses(broadStatus, primaryStatus)]);
    });

    return next;
  }

  function isBroadLocked(entry, broadStatus) {
    return (entry.invoiceBroadSelections || []).includes(broadStatus);
  }

  function isPrimaryLocked(entry, broadStatus, primaryStatus) {
    return (entry.invoicePrimarySelections || []).includes(getPrimarySelectionKey(broadStatus, primaryStatus));
  }

  function getOrderedTemplates() {
    return TEMPLATE_ORDER
      .map((id) => TEMPLATE_MAP[id])
      .filter((template) => template && getTemplateSource(template));
  }

  function getTemplateSource(template) {
    if (!template) {
      return null;
    }
    return TEMPLATE_SOURCE_MAP[template.label] || null;
  }

  function isMappedTemplateId(templateId) {
    const template = getTemplate(templateId);
    return Boolean(template && getTemplateSource(template));
  }

  function normalizeAttachmentSelection(value, allowedOptions) {
    const source = Array.isArray(value)
      ? value
      : typeof value === "string" && value
        ? value.split(/[,|]+/).map((item) => item.trim()).filter(Boolean)
        : [];
    return intersect(source, allowedOptions);
  }

  function normalizePreviewSource(value) {
    return String(value || "")
      .replaceAll("_x000D_", "\n")
      .replace(/\r/g, "")
      .trim();
  }

  function applyPreviewReplacements(value) {
    return PREVIEW_REPLACEMENTS.reduce((output, item) => output.replace(item.pattern, item.value), String(value || ""))
      .replace(/\$\{[^}]+\}/g, "Sample value");
  }

  function buildPreviewSubject(template) {
    const source = getTemplateSource(template);
    if (!source?.subjectLine) {
      return "Preview subject is unavailable for this template in the source workbook.";
    }

    return applyPreviewReplacements(normalizePreviewSource(source.subjectLine))
      .replace(/\s+/g, " ")
      .trim();
  }

  function buildPreviewFallbackHtml(template) {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <style>
          body { margin: 0; padding: 32px; font-family: Calibri, "Segoe UI", Arial, sans-serif; background: #f7f9fc; color: #0f172a; }
          .card { max-width: 760px; margin: 0 auto; background: #ffffff; border: 1px solid #d8e3f0; border-radius: 16px; padding: 24px; box-shadow: 0 16px 30px rgba(15, 23, 42, 0.08); }
          h1 { margin: 0 0 12px; font-size: 22px; }
          p { margin: 0; font-size: 14px; line-height: 1.6; color: #475569; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>${escapeHtml(template?.label || "Template preview unavailable")}</h1>
          <p>This template does not have a matching source entry in <code>email templates.xlsx</code>, so there is nothing reliable to preview yet.</p>
        </div>
      </body>
      </html>
    `;
  }

  function buildPreviewHtml(template) {
    const source = getTemplateSource(template);
    if (!source?.templateContent) {
      return buildPreviewFallbackHtml(template);
    }

    let html = normalizePreviewSource(source.templateContent);
    html = html.replace(/<#[^>]+>/gi, "");
    html = html.replace(/<\/#[^>]+>/gi, "");
    html = applyPreviewReplacements(html);
    html = html.replace(/<(body|div)\s*\n\s*style=/gi, "<$1 style=");

    const parsed = new DOMParser().parseFromString(html, "text/html");
    parsed.querySelectorAll("script").forEach((node) => node.remove());
    if (!parsed.head) {
      parsed.documentElement.insertBefore(parsed.createElement("head"), parsed.body || null);
    }

    const styleNode = parsed.createElement("style");
    styleNode.textContent = "body{margin:0;} img{max-width:100%;} table{max-width:100%;}";
    parsed.head.appendChild(styleNode);

    const baseNode = parsed.createElement("base");
    baseNode.setAttribute("target", "_blank");
    parsed.head.appendChild(baseNode);

    return `<!DOCTYPE html>${parsed.documentElement.outerHTML}`;
  }

  function ensureActiveTemplateUid() {
    const available = new Set(state.form.templates.map((entry) => entry.uid));
    if (!available.has(state.activeTemplateUid)) {
      state.activeTemplateUid = state.form.templates[0]?.uid || null;
    }
  }

  function syncActiveTemplateCards() {
    els.templateStack.querySelectorAll("[data-template-card]").forEach((card) => {
      card.classList.toggle("is-active", card.dataset.templateUid === state.activeTemplateUid);
    });
  }

  function updatePreviewButton() {
    ensureActiveTemplateUid();
    const template = getTemplate(getTemplateEntry(state.activeTemplateUid)?.templateId);
    els.previewTemplateBtn.disabled = !template;
    els.previewTemplateBtn.title = template ? `Preview ${template.label}` : "Select a template first.";
  }

  function populateTemplatePreview() {
    const entry = getTemplateEntry(state.activeTemplateUid);
    const template = getTemplate(entry?.templateId);
    if (!entry || !template) {
      els.templatePreviewTitle.textContent = "Template Preview";
      els.templatePreviewMeta.textContent = "Select a template to preview the source email.";
      els.templatePreviewSubject.textContent = "Preview subject will appear here.";
      els.templatePreviewFrame.srcdoc = buildPreviewFallbackHtml(null);
      return;
    }

    const source = getTemplateSource(template);
    els.templatePreviewTitle.textContent = `${template.label} Preview`;
    els.templatePreviewMeta.textContent = source
      ? `Workbook source loaded for ${template.label}.`
      : `${template.label} is missing from the source workbook.`;
    els.templatePreviewSubject.textContent = buildPreviewSubject(template);
    els.templatePreviewFrame.srcdoc = buildPreviewHtml(template);
  }

  function openTemplatePreview() {
    ensureActiveTemplateUid();
    const template = getTemplate(getTemplateEntry(state.activeTemplateUid)?.templateId);
    if (!template) {
      setError("Select a template first. The preview button refuses to read minds.");
      return;
    }

    clearError();
    populateTemplatePreview();
    state.isPreviewOpen = true;
    els.templatePreviewModal.classList.add("open");
    els.templatePreviewModal.setAttribute("aria-hidden", "false");
  }

  function closeTemplatePreview() {
    state.isPreviewOpen = false;
    els.templatePreviewModal.classList.remove("open");
    els.templatePreviewModal.setAttribute("aria-hidden", "true");
  }

  function setActiveTemplate(uid, options = {}) {
    if (!uid || state.activeTemplateUid === uid) {
      return;
    }
    state.activeTemplateUid = uid;
    syncActiveTemplateCards();
    updatePreviewButton();
    if (state.isPreviewOpen && !options.silent) {
      populateTemplatePreview();
    }
  }

  function getAllowedSubStatuses(template, groups) {
    if (!template) {
      return [];
    }
    const fromGroups = groups.flatMap((group) => DISPOSITION_GROUPS[group]?.subStatuses || []);
    return intersect(fromGroups, template.allowedSubStatuses);
  }

  function createDefaultReminderStep(template) {
    const when = template?.supportedTimings?.[0] || "before";
    return {
      uid: `step_${Math.random().toString(36).slice(2, 10)}`,
      days: 1,
      when,
      attachments: []
    };
  }

  function sanitizeReminderSteps(steps, template) {
    if (!template) {
      return [createDefaultReminderStep(null)];
    }
    const allowedTimings = template.supportedTimings;
    const source = Array.isArray(steps) && steps.length ? steps : [createDefaultReminderStep(template)];
    return source.map((step) => ({
      uid: step.uid || `step_${Math.random().toString(36).slice(2, 10)}`,
      days: clampInteger(step.days, 1, 1, 365),
      when: allowedTimings.includes(step.when) ? step.when : allowedTimings[0],
      attachments: normalizeAttachmentSelection(step.attachments || step.attachment, CUSTOM_ATTACHMENT_OPTIONS)
    }));
  }

  function applyTemplateDefaults(entry, templateId, preserveExisting) {
    const template = getTemplate(templateId);
    const next = clone(entry);
    next.templateId = templateId || "";

    if (!template) {
      return next;
    }

    next.notificationMode = preserveExisting && template.supportedModes.includes(next.notificationMode)
      ? next.notificationMode
      : template.supportedModes[0];

    next.keyAccountFilter = KEY_ACCOUNT_OPTIONS.some((option) => option.value === next.keyAccountFilter)
      ? next.keyAccountFilter
      : "all";

    next.reminderSteps = sanitizeReminderSteps(next.reminderSteps, template);
    next.ongoingInterval = next.ongoingInterval ? clampInteger(next.ongoingInterval, 7, 1, 365) : "";
    next.ongoingAttachments = normalizeAttachmentSelection(
      next.ongoingAttachments || next.ongoingAttachment,
      ONGOING_ATTACHMENT_OPTIONS
    );

    next.dispositionGroups = intersect(
      preserveExisting ? next.dispositionGroups : template.defaultDispositionGroups,
      template.allowedDispositionGroups
    );
    if (!next.dispositionGroups.length) {
      next.dispositionGroups = [...template.defaultDispositionGroups];
    }

    const allowedSubStatuses = getAllowedSubStatuses(template, next.dispositionGroups);
    next.subStatuses = intersect(
      preserveExisting ? next.subStatuses : template.defaultSubStatuses,
      allowedSubStatuses
    );
    if (!next.subStatuses.length) {
      next.subStatuses = intersect(template.defaultSubStatuses, allowedSubStatuses);
    }

    sanitizeInvoiceStatusState(next, preserveExisting);

    next.agingBuckets = intersect(
      preserveExisting ? next.agingBuckets : template.defaultAgingBuckets,
      AGING_BUCKETS
    );
    if (!next.agingBuckets.length) {
      next.agingBuckets = [...template.defaultAgingBuckets];
    }

    return next;
  }

  function getTargetOptions(targetType) {
    if (targetType === "customer") {
      return state.customers
        .map((customer) => ({
          id: customer.id,
          label: `${customer.code} — ${customer.name}`,
          meta: `${(customer.invoices || []).length} invoice${(customer.invoices || []).length === 1 ? "" : "s"} • ${formatCurrency(customer.netDueAmount || customer.totalInvoiceAmount || 0)}`
        }))
        .sort((left, right) => left.label.localeCompare(right.label));
    }

    if (targetType === "invoice") {
      return state.invoices
        .map((invoice) => ({
          id: invoice.invoiceNo,
          label: `${invoice.invoiceNo} — ${invoice.customerName}`,
          meta: `${invoice.status} • ${formatCurrency(invoice.netDueAmount)}`
        }))
        .sort((left, right) => left.label.localeCompare(right.label));
    }

    return [];
  }

  function sanitizeTargets() {
    const validIds = new Set(getTargetOptions(state.form.targetType).map((option) => option.id));
    state.form.selectedTargetIds = state.form.selectedTargetIds.filter((value) => validIds.has(value));
  }

  function readStorage(key) {
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      return null;
    }
  }

  function writeStorage(key, value) {
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      setError("Unable to save locally. Browser storage has picked a fight.");
    }
  }

  function findTemplateId(seed) {
    if (!seed) {
      return "";
    }
    const slug = slugify(seed);
    const match = TEMPLATE_DEFINITIONS.find((template) => slugify(template.id) === slug || slugify(template.label) === slug);
    return match?.id || "";
  }

  function normalizeTemplateEntry(entry) {
    const templateId = findTemplateId(entry.templateId || entry.template || entry.notificationTemplate);
    if (templateId && !isMappedTemplateId(templateId)) {
      return null;
    }
    const base = createTemplateEntry("");
    base.uid = entry.uid || `tpl_${Math.random().toString(36).slice(2, 10)}`;
    base.templateId = templateId;
    base.notificationMode = entry.notificationMode || entry.mode || "custom";
    base.keyAccountFilter = entry.keyAccountFilter || entry.keyAccount || "all";
    base.ongoingInterval = entry.ongoingInterval || "";
    base.ongoingAttachments = normalizeAttachmentSelection(
      entry.ongoingAttachments || entry.ongoingAttachment,
      ONGOING_ATTACHMENT_OPTIONS
    );
    base.dispositionGroups = dedupe(entry.dispositionGroups || entry.selectedDispositionGroups || []);
    base.subStatuses = dedupe(entry.subStatuses || entry.selectedSubStatuses || []);
    base.invoiceStatusUi = entry.invoiceStatusUi || createInvoiceStatusUi();
    base.invoiceBroadSelections = dedupe(entry.invoiceBroadSelections || []);
    base.invoicePrimarySelections = dedupe(entry.invoicePrimarySelections || []);
    base.invoiceStatuses = dedupe(entry.invoiceStatuses || []);
    base.agingBuckets = dedupe(entry.agingBuckets || entry.selectedAgingBuckets || entry.agingBands || []);

    if (Array.isArray(entry.reminderSteps) && entry.reminderSteps.length) {
      base.reminderSteps = entry.reminderSteps.map((step) => ({
        uid: step.uid || `step_${Math.random().toString(36).slice(2, 10)}`,
        days: clampInteger(step.days, 1, 1, 365),
        when: step.when || "before",
        attachments: normalizeAttachmentSelection(step.attachments || step.attachment, CUSTOM_ATTACHMENT_OPTIONS)
      }));
    } else if (Array.isArray(entry.customSteps) && entry.customSteps.length) {
      base.reminderSteps = entry.customSteps.map((step) => ({
        uid: step.uid || `step_${Math.random().toString(36).slice(2, 10)}`,
        days: clampInteger(step.days, 1, 1, 365),
        when: step.trigger === "after" ? "after" : "before",
        attachments: normalizeAttachmentSelection(step.attachments || step.attachment, CUSTOM_ATTACHMENT_OPTIONS)
      }));
    }

    return applyTemplateDefaults(base, templateId, true);
  }

  function normalizeStoredStrategy(strategy) {
    if (!strategy || typeof strategy !== "object") {
      return null;
    }

    const templates = (Array.isArray(strategy.templates) && strategy.templates.length
      ? strategy.templates.map(normalizeTemplateEntry)
      : [normalizeTemplateEntry(strategy)])
      .filter(Boolean);

    const targetType = strategy.targetType || strategy.scope || "";
    const selectedTargetIds = dedupe(strategy.selectedTargetIds || strategy.selectedCustomerIds || strategy.selectedInvoiceNos || []);
    const reminderType = ["pre_due", "post_due", "both"].includes(strategy.reminderType) ? strategy.reminderType : "";

    return {
      id: strategy.id || `SM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      strategyName: strategy.strategyName || strategy.name || "Untitled Strategy",
      status: strategy.status === "inactive" ? "inactive" : "active",
      reminderType,
      targetType: targetType === "customer" || targetType === "invoice" ? targetType : "",
      selectedTargetIds,
      templates,
      updatedAt: strategy.updatedAt || ""
    };
  }

  async function loadCustomers() {
    try {
      const response = await fetch(`${getRootPath()}scripts/customersData.json`, { cache: "no-store" });
      if (!response.ok) {
        throw new Error(`Failed to fetch customers (${response.status})`);
      }
      const payload = await response.json();
      state.customers = Array.isArray(payload) ? payload : payload?.customers || [];
      state.invoices = enrichInvoices(state.customers);
    } catch (error) {
      state.customers = [];
      state.invoices = [];
      setError("Customer data could not be loaded. The page is trying its best anyway.");
    }
  }

  function loadStrategies() {
    const raw = readStorage(STORAGE_KEY) || readStorage(LEGACY_STORAGE_KEY);
    state.strategies = Array.isArray(raw) ? raw.map(normalizeStoredStrategy).filter(Boolean) : [];
  }

  function clearError() {
    els.error.textContent = "";
    els.error.classList.add("hidden");
  }

  function setError(message) {
    els.error.textContent = message;
    els.error.classList.remove("hidden");
  }

  function showListScreen() {
    closeTemplatePreview();
    els.listScreen.classList.remove("hidden");
    els.builderScreen.classList.add("hidden");
    clearError();
    renderList();
  }

  function showBuilderScreen() {
    els.listScreen.classList.add("hidden");
    els.builderScreen.classList.remove("hidden");
    renderBuilder();
  }

  function resetBuilder() {
    state.formMode = "create";
    state.editingId = null;
    state.targetSearch = "";
    state.form = createBlankForm();
    state.activeTemplateUid = state.form.templates[0]?.uid || null;
    clearError();
  }

  function openCreate() {
    resetBuilder();
    els.formTitle.textContent = "Create Strategy";
    els.formSubtitle.textContent = "Set the target once. Each template block controls its own reminder behavior and filters.";
    showBuilderScreen();
  }

  function openEdit(strategyId) {
    const strategy = state.strategies.find((item) => item.id === strategyId);
    if (!strategy) {
      return;
    }
    resetBuilder();
    const normalizedTemplates = strategy.templates.map(normalizeTemplateEntry).filter(Boolean);
    state.formMode = "edit";
    state.editingId = strategy.id;
    state.form = {
      strategyName: strategy.strategyName,
      status: strategy.status,
      reminderType: strategy.reminderType || "",
      targetType: strategy.targetType,
      selectedTargetIds: [...strategy.selectedTargetIds],
      templates: normalizedTemplates.length ? normalizedTemplates : [createTemplateEntry("")]
    };
    state.activeTemplateUid = state.form.templates[0]?.uid || null;
    sanitizeTargets();
    els.formTitle.textContent = "Edit Strategy";
    els.formSubtitle.textContent = "Adjust target selection and template-driven logic without the extra clutter.";
    showBuilderScreen();
  }

  function deleteStrategy(strategyId) {
    state.strategies = state.strategies.filter((item) => item.id !== strategyId);
    writeStorage(STORAGE_KEY, state.strategies);
    renderList();
  }

  function renderList() {
    const query = state.listSearch.trim().toLowerCase();
    const rows = state.strategies.filter((strategy) => {
      if (state.listStatusFilter !== "all" && strategy.status !== state.listStatusFilter) {
        return false;
      }
      if (state.listScopeFilter !== "all" && strategy.targetType !== state.listScopeFilter) {
        return false;
      }
      if (query && !`${strategy.strategyName}`.toLowerCase().includes(query)) {
        return false;
      }
      return true;
    });

    els.listBody.innerHTML = rows.map((strategy) => `
      <tr>
        <td>
          <div class="smCellTitle">${escapeHtml(strategy.strategyName)}</div>
          <div class="smCellMeta">${escapeHtml(strategy.templates.map((entry) => getTemplate(entry.templateId)?.label).filter(Boolean).join(", ") || "No mapped templates")}</div>
        </td>
        <td><span class="smStatusPill is-${escapeHtml(strategy.status)}">${escapeHtml(titleCase(strategy.status))}</span></td>
        <td>${escapeHtml(titleCase(strategy.targetType))}</td>
        <td>${escapeHtml(`${strategy.selectedTargetIds.length} selected`)}</td>
        <td>${escapeHtml(`${strategy.templates.length} template${strategy.templates.length === 1 ? "" : "s"}`)}</td>
        <td>
          <div class="smTableActions">
            <button class="smTinyBtn" type="button" data-action="edit" data-id="${escapeHtml(strategy.id)}">Edit</button>
            <button class="smTinyBtn is-danger" type="button" data-action="delete" data-id="${escapeHtml(strategy.id)}">Delete</button>
          </div>
        </td>
      </tr>
    `).join("");

    els.listEmpty.classList.toggle("hidden", rows.length !== 0);
  }

  function renderBuilder() {
    els.strategyName.value = state.form.strategyName;
    els.status.checked = state.form.status === "active";
    els.statusLabel.textContent = state.form.status === "active" ? "Active" : "Inactive";
    els.reminderType.value = state.form.reminderType;
    els.targetType.value = state.form.targetType;
    renderTargets();
    renderTemplates();
    els.footerMeta.textContent = `${state.form.templates.length} template block${state.form.templates.length === 1 ? "" : "s"} in this strategy.`;
  }

  function renderTargets() {
    const options = getTargetOptions(state.form.targetType);
    const query = state.targetSearch.trim().toLowerCase();
    const visibleOptions = query
      ? options.filter((option) => `${option.label} ${option.meta}`.toLowerCase().includes(query))
      : options;
    const selectedSet = new Set(state.form.selectedTargetIds);

    const heading = state.form.targetType === "customer"
      ? "Target Customers *"
      : state.form.targetType === "invoice"
        ? "Target Invoices *"
        : "Target Records";

    const description = state.form.targetType === "customer"
      ? "Select the customers this strategy should run for."
      : state.form.targetType === "invoice"
        ? "Select the invoices this strategy should run for."
        : "Pick Customer or Invoice first so the target list knows where to look.";

    els.targetHeading.textContent = heading;
    els.targetDescription.textContent = description;
    els.targetCount.textContent = `${state.form.selectedTargetIds.length} selected`;
    els.targetPickerSection.classList.toggle("hidden", !state.form.targetType);

    if (!state.form.targetType) {
      els.targetList.innerHTML = "";
      return;
    }

    if (!visibleOptions.length) {
      els.targetList.innerHTML = `<div class="smHint">No matching ${state.form.targetType}s found for the current search.</div>`;
      return;
    }

    els.targetList.innerHTML = visibleOptions.map((option) => `
      <label class="smCheckRow">
        <input type="checkbox" data-target-id="${escapeHtml(option.id)}" ${selectedSet.has(option.id) ? "checked" : ""} />
        <span>
          <strong>${escapeHtml(option.label)}</strong>
          <small>${escapeHtml(option.meta)}</small>
        </span>
      </label>
    `).join("");
  }

  function renderTemplates() {
    ensureActiveTemplateUid();
    els.templateCount.textContent = `${state.form.templates.length} template${state.form.templates.length === 1 ? "" : "s"}`;
    els.templateStack.innerHTML = state.form.templates.map((entry, index) => renderTemplateCard(entry, index)).join("");
    syncActiveTemplateCards();
    updatePreviewButton();
    if (state.isPreviewOpen) {
      populateTemplatePreview();
    }
  }

  function renderTemplateCard(entry, index) {
    const template = getTemplate(entry.templateId);
    return `
      <article class="smTemplateCard" data-template-card data-template-uid="${escapeHtml(entry.uid)}">
        <div class="smTemplateCardHead">
          <div>
            <div class="smSectionKicker">Template ${index + 1}</div>
            <h3>${escapeHtml(template?.label || "Select Template")}</h3>
            <p>${escapeHtml(template ? "This template now owns its own notification mode, schedule, and filters." : "Select the template first. The rest of the block unlocks from there.")}</p>
          </div>
          <div class="smTemplateHeaderTools">
            ${template ? `
              <span class="smMetaPill">${escapeHtml(template.supportedModes.map((mode) => MODE_LABELS[mode]).join(" / "))}</span>
              <span class="smMetaPill">${escapeHtml(template.supportedTimings.map((timing) => getTimingLabel(template, timing)).join(" / "))}</span>
            ` : ""}
            <button class="smTinyBtn is-danger ${state.form.templates.length === 1 ? "hidden" : ""}" type="button" data-remove-template="${escapeHtml(entry.uid)}">Remove</button>
          </div>
        </div>

        <div class="smTemplateBody">
          <div class="smTemplateOverviewGrid">
            ${renderNotificationPanel(entry, template)}
            ${template
              ? (entry.notificationMode === "custom" ? renderCustomPanel(entry, template) : renderOngoingPanel(entry))
              : `
                <section class="smTemplatePanel smHintPanel">
                  <h3>Schedule</h3>
                  <p>Pick the template first. Custom or ongoing rules will appear after that.</p>
                </section>
              `}
          </div>

          ${template ? `
            <div class="smTemplateSupportGrid">
              ${renderInvoiceStatusPanel(entry)}
              ${renderAgingPanel(entry)}
            </div>
          ` : ""}
        </div>
      </article>
    `;
  }

  function renderNotificationPanel(entry, template) {
    return `
      <section class="smTemplatePanel">
        <div class="smTemplatePanelHead">
          <div>
            <h3>Notification Settings</h3>
            <p>Template, mode, and key-account scope are set here.</p>
          </div>
        </div>

        <div class="smGrid smGrid3">
          <label class="smTemplateField">
            <span>Template</span>
            <select data-template-field="templateId" data-template-uid="${escapeHtml(entry.uid)}">
              <option value="">Select Template</option>
              ${getOrderedTemplates().map((item) => `<option value="${escapeHtml(item.id)}" ${item.id === entry.templateId ? "selected" : ""}>${escapeHtml(item.label)}</option>`).join("")}
            </select>
          </label>

          <label class="smTemplateField">
            <span>Notification Mode</span>
            <select data-template-field="notificationMode" data-template-uid="${escapeHtml(entry.uid)}" ${template && template.supportedModes.length > 1 ? "" : "disabled"}>
              ${template ? template.supportedModes.map((mode) => `<option value="${escapeHtml(mode)}" ${entry.notificationMode === mode ? "selected" : ""}>${escapeHtml(MODE_LABELS[mode])}</option>`).join("") : `<option value="">Select</option>`}
            </select>
          </label>

          <label class="smTemplateField">
            <span>Key Account Filter</span>
            <select data-template-field="keyAccountFilter" data-template-uid="${escapeHtml(entry.uid)}" ${template ? "" : "disabled"}>
              ${KEY_ACCOUNT_OPTIONS.map((option) => `<option value="${escapeHtml(option.value)}" ${entry.keyAccountFilter === option.value ? "selected" : ""}>${escapeHtml(option.label)}</option>`).join("")}
            </select>
          </label>
        </div>
      </section>
    `;
  }

  function renderCustomPanel(entry, template) {
    return `
      <section class="smTemplatePanel">
        <div class="smTemplatePanelHead">
          <div>
            <h3>Reminder Steps</h3>
            <p>${escapeHtml(getCustomTimingDescription(template))}</p>
          </div>
          <button class="smTinyBtn" type="button" data-add-step="${escapeHtml(entry.uid)}">
            <i class="bi bi-plus-circle" aria-hidden="true"></i>
            Add Step
          </button>
        </div>

        <div class="smReminderTable">
          <div class="smReminderHead">
            <span>#</span>
            <span>When</span>
            <span>Days Before/After</span>
            <span>Attachments</span>
            <span></span>
          </div>
          ${entry.reminderSteps.map((step, index) => `
            <div class="smReminderRow">
              <span class="smReminderIndex">${index + 1}</span>
              ${template.supportedTimings.length === 1
                ? `<div class="smStaticField">${escapeHtml(getTimingLabel(template, template.supportedTimings[0]))}</div>`
                : `
                  <select data-step-field="when" data-template-uid="${escapeHtml(entry.uid)}" data-step-uid="${escapeHtml(step.uid)}">
                    ${template.supportedTimings.map((timing) => `<option value="${escapeHtml(timing)}" ${step.when === timing ? "selected" : ""}>${escapeHtml(getTimingLabel(template, timing))}</option>`).join("")}
                  </select>
                `}
              <input data-step-field="days" data-template-uid="${escapeHtml(entry.uid)}" data-step-uid="${escapeHtml(step.uid)}" type="number" min="1" max="365" value="${escapeHtml(step.days)}" />
              <select data-step-field="attachment" data-template-uid="${escapeHtml(entry.uid)}" data-step-uid="${escapeHtml(step.uid)}" multiple size="${Math.max(2, CUSTOM_ATTACHMENT_OPTIONS.length)}">
                ${CUSTOM_ATTACHMENT_OPTIONS.map((attachment) => `<option value="${escapeHtml(attachment)}" ${(step.attachments || []).includes(attachment) ? "selected" : ""}>${escapeHtml(attachment)}</option>`).join("")}
              </select>
              <button class="smTinyBtn is-danger ${entry.reminderSteps.length === 1 ? "hidden" : ""}" type="button" data-remove-step="${escapeHtml(step.uid)}" data-template-uid="${escapeHtml(entry.uid)}">×</button>
            </div>
          `).join("")}
        </div>
      </section>
    `;
  }

  function renderOngoingPanel(entry) {
    return `
      <section class="smTemplatePanel">
        <div class="smTemplatePanelHead">
          <div>
            <h3>Recurring Reminder</h3>
            <p>Ongoing mode uses interval and attachments only.</p>
          </div>
        </div>

        <div class="smGrid smGrid3">
          <label class="smTemplateField">
            <span>Interval (Days)</span>
            <input data-template-field="ongoingInterval" data-template-uid="${escapeHtml(entry.uid)}" type="number" min="1" max="365" value="${escapeHtml(entry.ongoingInterval)}" />
          </label>

          <label class="smTemplateField">
            <span>Attachments</span>
            <select data-template-field="ongoingAttachment" data-template-uid="${escapeHtml(entry.uid)}" multiple size="${Math.max(2, ONGOING_ATTACHMENT_OPTIONS.length)}">
              ${ONGOING_ATTACHMENT_OPTIONS.map((attachment) => `<option value="${escapeHtml(attachment)}" ${(entry.ongoingAttachments || []).includes(attachment) ? "selected" : ""}>${escapeHtml(attachment)}</option>`).join("")}
            </select>
          </label>
        </div>
      </section>
    `;
  }

  function renderInvoiceStatusPanel(entry) {
    const invoiceStatusUi = ensureInvoiceStatusUi(entry);
    const selectedSet = new Set(entry.invoiceStatuses);
    return `
      <section class="smTemplatePanel">
        <div class="smTemplatePanelHead">
          <div>
            <h3>Invoice Status Filters</h3>
            <p>Use the workbook hierarchy: broad status, primary status, then sub-status.</p>
          </div>
          <div class="smSectionActions">
            <div class="smCountPill">${entry.invoiceStatuses.length} selected</div>
            <button class="smTinyBtn" type="button" data-invoice-tree-action="all" data-template-uid="${escapeHtml(entry.uid)}">Select All</button>
            <button class="smTinyBtn" type="button" data-invoice-tree-action="clear" data-template-uid="${escapeHtml(entry.uid)}">Clear</button>
          </div>
        </div>

        <div class="smStatusTree">
          ${INVOICE_DISPOSITION_TREE.map((broad) => {
            const broadSubStatuses = getBroadSubStatuses(broad.broadStatus);
            const broadSelectedCount = broadSubStatuses.filter((value) => selectedSet.has(value)).length;
            const broadLocked = isBroadLocked(entry, broad.broadStatus);
            const broadOpen = invoiceStatusUi.broadOpen.includes(broad.broadStatus);
            return `
              <section class="smStatusBranch">
                <div class="smStatusSummary">
                  <button class="smCollapseBtn" type="button" data-invoice-collapse-kind="broad" data-template-uid="${escapeHtml(entry.uid)}" value="${escapeHtml(broad.broadStatus)}" aria-expanded="${broadOpen ? "true" : "false"}">
                    <i class="bi ${broadOpen ? "bi-chevron-down" : "bi-chevron-right"}" aria-hidden="true"></i>
                  </button>
                  <label class="smStatusNode smStatusNode--broad">
                    <input type="checkbox" data-invoice-tree-kind="broad" data-template-uid="${escapeHtml(entry.uid)}" value="${escapeHtml(broad.broadStatus)}" ${broadLocked || broadSelectedCount === broadSubStatuses.length ? "checked" : ""} />
                    <span>
                      <strong>${escapeHtml(broad.broadStatus)}</strong>
                      <small>${escapeHtml(`${broadSelectedCount}/${broadSubStatuses.length} sub-statuses selected`)}</small>
                    </span>
                  </label>
                </div>

                <div class="smStatusChildren ${broadOpen ? "" : "hidden"}">
                  ${broad.primaries.map((primary) => {
                    const primaryKey = getPrimarySelectionKey(broad.broadStatus, primary.primaryStatus);
                    const primarySelectedCount = primary.subStatuses.filter((value) => selectedSet.has(value)).length;
                    const primaryLocked = isPrimaryLocked(entry, broad.broadStatus, primary.primaryStatus);
                    const childDisabled = broadLocked || primaryLocked;
                    const primaryOpen = invoiceStatusUi.primaryOpen.includes(primaryKey);
                    return `
                      <div class="smStatusPrimary">
                        <div class="smStatusSummary">
                          <button class="smCollapseBtn" type="button" data-invoice-collapse-kind="primary" data-template-uid="${escapeHtml(entry.uid)}" value="${escapeHtml(primaryKey)}" aria-expanded="${primaryOpen ? "true" : "false"}">
                            <i class="bi ${primaryOpen ? "bi-chevron-down" : "bi-chevron-right"}" aria-hidden="true"></i>
                          </button>
                          <label class="smStatusNode smStatusNode--primary">
                            <input type="checkbox" data-invoice-tree-kind="primary" data-template-uid="${escapeHtml(entry.uid)}" value="${escapeHtml(primaryKey)}" ${primaryLocked || primarySelectedCount === primary.subStatuses.length ? "checked" : ""} ${broadLocked ? "disabled" : ""} />
                            <span>
                              <strong>${escapeHtml(primary.primaryStatus)}</strong>
                              <small>${escapeHtml(`${primarySelectedCount}/${primary.subStatuses.length} selected`)}</small>
                            </span>
                          </label>
                        </div>

                        <div class="smStatusLeafGrid ${primaryOpen ? "" : "hidden"}">
                          ${primary.subStatuses.map((subStatus) => `
                            <label class="smCheckRow is-chip ${childDisabled ? "is-disabled" : ""}">
                              <input type="checkbox" data-invoice-tree-kind="sub" data-template-uid="${escapeHtml(entry.uid)}" value="${escapeHtml(subStatus)}" ${selectedSet.has(subStatus) ? "checked" : ""} ${childDisabled ? "disabled" : ""} />
                              <span><strong>${escapeHtml(subStatus)}</strong></span>
                            </label>
                          `).join("")}
                        </div>
                      </div>
                    `;
                  }).join("")}
                </div>
              </section>
            `;
          }).join("")}
        </div>
      </section>
    `;
  }

  function renderAgingPanel(entry) {
    return `
      <section class="smTemplatePanel">
        <div class="smTemplatePanelHead">
          <div>
            <h3>Aging Buckets</h3>
            <p>Keep the aging window focused so the template fires in the right debt band.</p>
          </div>
          <div class="smCountPill">${entry.agingBuckets.length} selected</div>
        </div>

        <div class="smChecklistCard is-compact">
          ${AGING_BUCKETS.map((bucket) => `
            <label class="smCheckRow is-chip">
              <input type="checkbox" data-template-check="agingBuckets" data-template-uid="${escapeHtml(entry.uid)}" value="${escapeHtml(bucket)}" ${entry.agingBuckets.includes(bucket) ? "checked" : ""} />
              <span><strong>${escapeHtml(bucket)}</strong></span>
            </label>
          `).join("")}
        </div>
      </section>
    `;
  }

  function getTemplateEntry(uid) {
    return state.form.templates.find((entry) => entry.uid === uid) || null;
  }

  function addTemplate() {
    const entry = createTemplateEntry("");
    state.form.templates.push(entry);
    state.activeTemplateUid = entry.uid;
    renderTemplates();
  }

  function removeTemplate(uid) {
    if (state.form.templates.length === 1) {
      return;
    }
    state.form.templates = state.form.templates.filter((entry) => entry.uid !== uid);
    ensureActiveTemplateUid();
    renderTemplates();
  }

  function updateTemplateSelection(uid, templateId) {
    state.form.templates = state.form.templates.map((entry) =>
      entry.uid === uid ? applyTemplateDefaults(entry, templateId, true) : entry
    );
    renderTemplates();
  }

  function updateTemplateField(uid, field, value) {
    const entry = getTemplateEntry(uid);
    const template = getTemplate(entry?.templateId);
    if (!entry) {
      return;
    }

    if (field === "templateId") {
      updateTemplateSelection(uid, value);
      return;
    }

    if (field === "notificationMode") {
      entry.notificationMode = value;
    } else if (field === "keyAccountFilter") {
      entry.keyAccountFilter = value;
    } else if (field === "ongoingInterval") {
      entry.ongoingInterval = value ? clampInteger(value, 7, 1, 365) : "";
    } else if (field === "ongoingAttachment") {
      entry.ongoingAttachments = normalizeAttachmentSelection(value, ONGOING_ATTACHMENT_OPTIONS);
    }

    if (template) {
      Object.assign(entry, applyTemplateDefaults(entry, entry.templateId, true));
    }
    renderTemplates();
  }

  function addReminderStep(uid) {
    const entry = getTemplateEntry(uid);
    const template = getTemplate(entry?.templateId);
    if (!entry || !template) {
      return;
    }
    entry.reminderSteps.push(createDefaultReminderStep(template));
    renderTemplates();
  }

  function updateReminderStep(uid, stepUid, field, value) {
    const entry = getTemplateEntry(uid);
    const template = getTemplate(entry?.templateId);
    if (!entry || !template) {
      return;
    }
    entry.reminderSteps = entry.reminderSteps.map((step) => {
      if (step.uid !== stepUid) {
        return step;
      }
      if (field === "days") {
        return { ...step, days: clampInteger(value, step.days, 1, 365) };
      }
      if (field === "when") {
        return { ...step, when: template.supportedTimings.includes(value) ? value : template.supportedTimings[0] };
      }
      if (field === "attachment") {
        return { ...step, attachments: normalizeAttachmentSelection(value, CUSTOM_ATTACHMENT_OPTIONS) };
      }
      return step;
    });
    renderTemplates();
  }

  function removeReminderStep(uid, stepUid) {
    const entry = getTemplateEntry(uid);
    if (!entry || entry.reminderSteps.length === 1) {
      return;
    }
    entry.reminderSteps = entry.reminderSteps.filter((step) => step.uid !== stepUid);
    renderTemplates();
  }

  function toggleTemplateGroup(uid, groupId) {
    const entry = getTemplateEntry(uid);
    const template = getTemplate(entry?.templateId);
    if (!entry || !template || !template.allowedDispositionGroups.includes(groupId)) {
      return;
    }

    const selected = new Set(entry.dispositionGroups);
    if (selected.has(groupId)) {
      selected.delete(groupId);
    } else {
      selected.add(groupId);
    }

    entry.dispositionGroups = intersect([...selected], template.allowedDispositionGroups);
    if (!entry.dispositionGroups.length) {
      entry.dispositionGroups = [...template.defaultDispositionGroups];
    }

    const allowedSubStatuses = getAllowedSubStatuses(template, entry.dispositionGroups);
    entry.subStatuses = intersect(entry.subStatuses, allowedSubStatuses);
    if (!entry.subStatuses.length) {
      entry.subStatuses = intersect(template.defaultSubStatuses, allowedSubStatuses);
    }

    renderTemplates();
  }

  function toggleInvoiceTreeSelection(uid, kind, value, checked) {
    const entry = getTemplateEntry(uid);
    if (!entry) {
      return;
    }

    if (kind === "broad") {
      const broadSubStatuses = getBroadSubStatuses(value);
      entry.invoicePrimarySelections = (entry.invoicePrimarySelections || []).filter((item) => {
        const parsed = parsePrimarySelectionKey(item);
        return parsed.broadStatus !== value;
      });

      if (checked) {
        entry.invoiceBroadSelections = dedupe([...(entry.invoiceBroadSelections || []), value]);
        entry.invoiceStatuses = dedupe([...(entry.invoiceStatuses || []), ...broadSubStatuses]);
      } else {
        entry.invoiceBroadSelections = (entry.invoiceBroadSelections || []).filter((item) => item !== value);
        entry.invoiceStatuses = (entry.invoiceStatuses || []).filter((item) => !broadSubStatuses.includes(item));
      }

      renderTemplates();
      return;
    }

    if (kind === "primary") {
      const { broadStatus, primaryStatus } = parsePrimarySelectionKey(value);
      const primarySubStatuses = getPrimarySubStatuses(broadStatus, primaryStatus);
      const primaryKey = getPrimarySelectionKey(broadStatus, primaryStatus);

      if (checked) {
        entry.invoicePrimarySelections = dedupe([...(entry.invoicePrimarySelections || []), primaryKey]);
        entry.invoiceStatuses = dedupe([...(entry.invoiceStatuses || []), ...primarySubStatuses]);
      } else {
        entry.invoicePrimarySelections = (entry.invoicePrimarySelections || []).filter((item) => item !== primaryKey);
        entry.invoiceStatuses = (entry.invoiceStatuses || []).filter((item) => !primarySubStatuses.includes(item));
      }

      renderTemplates();
      return;
    }

    if (kind === "sub") {
      const selected = new Set(entry.invoiceStatuses || []);
      if (checked) {
        selected.add(value);
      } else {
        selected.delete(value);
      }
      entry.invoiceStatuses = uniqueSubStatusSelection([...selected]);
      renderTemplates();
      return;
    }
  }

  function toggleTemplateChecklist(uid, kind, value, checked) {
    const entry = getTemplateEntry(uid);
    const template = getTemplate(entry?.templateId);
    if (!entry || !template) {
      return;
    }

    const selected = new Set(entry[kind] || []);
    if (checked) {
      selected.add(value);
    } else {
      selected.delete(value);
    }

    if (kind === "agingBuckets") {
      entry.agingBuckets = intersect([...selected], AGING_BUCKETS);
    }

    renderTemplates();
  }

  function toggleInvoiceTreeBulk(uid, action) {
    const entry = getTemplateEntry(uid);
    if (!entry) {
      return;
    }

    if (action === "all") {
      entry.invoiceBroadSelections = [...INVOICE_BROAD_STATUSES];
      entry.invoicePrimarySelections = [];
      entry.invoiceStatuses = [...ALL_INVOICE_SUBSTATUSES];
    } else {
      entry.invoiceBroadSelections = [];
      entry.invoicePrimarySelections = [];
      entry.invoiceStatuses = [];
    }

    renderTemplates();
  }

  function toggleInvoiceCollapse(uid, kind, value) {
    const entry = getTemplateEntry(uid);
    if (!entry) {
      return;
    }

    const invoiceStatusUi = ensureInvoiceStatusUi(entry);
    if (kind === "broad") {
      const open = new Set(invoiceStatusUi.broadOpen);
      if (open.has(value)) {
        open.delete(value);
      } else {
        open.add(value);
      }
      invoiceStatusUi.broadOpen = [...open];
    } else if (kind === "primary") {
      const open = new Set(invoiceStatusUi.primaryOpen);
      if (open.has(value)) {
        open.delete(value);
      } else {
        open.add(value);
      }
      invoiceStatusUi.primaryOpen = [...open];
    }

    renderTemplates();
  }

  function toggleTarget(targetId, checked) {
    const selected = new Set(state.form.selectedTargetIds);
    if (checked) {
      selected.add(targetId);
    } else {
      selected.delete(targetId);
    }
    state.form.selectedTargetIds = [...selected];
    renderTargets();
  }

  function bulkTargetSelection(action) {
    const options = getTargetOptions(state.form.targetType);
    const query = state.targetSearch.trim().toLowerCase();
    const visibleIds = options
      .filter((option) => !query || `${option.label} ${option.meta}`.toLowerCase().includes(query))
      .map((option) => option.id);

    if (action === "all") {
      state.form.selectedTargetIds = dedupe([...state.form.selectedTargetIds, ...visibleIds]);
    } else {
      const visibleSet = new Set(visibleIds);
      state.form.selectedTargetIds = state.form.selectedTargetIds.filter((value) => !visibleSet.has(value));
    }
    renderTargets();
  }

  function validateForm() {
    if (!state.form.strategyName.trim()) {
      return "Strategy name is required.";
    }
    if (!state.form.targetType) {
      return "Target must be selected.";
    }
    if (!state.form.reminderType) {
      return "Reminder type must be selected.";
    }
    if (!state.form.selectedTargetIds.length) {
      return `Select at least one ${state.form.targetType}.`;
    }

    for (const [index, entry] of state.form.templates.entries()) {
      const template = getTemplate(entry.templateId);
      if (!template) {
        return `Template ${index + 1} is missing its template selection.`;
      }
      if (!entry.invoiceStatuses.length) {
        return `Template ${index + 1} needs at least one invoice status.`;
      }
      if (!entry.agingBuckets.length) {
        return `Template ${index + 1} needs at least one aging bucket.`;
      }
      if (entry.notificationMode === "custom") {
        if (!entry.reminderSteps.length) {
          return `Template ${index + 1} needs at least one reminder step.`;
        }
        if (entry.reminderSteps.some((step) => !step.days || step.days < 1)) {
          return `Template ${index + 1} has an invalid custom reminder day value.`;
        }
      }
      if (entry.notificationMode === "ongoing") {
        if (!entry.ongoingInterval || Number(entry.ongoingInterval) < 1) {
          return `Template ${index + 1} needs a valid ongoing interval.`;
        }
      }
    }

    return "";
  }

  function buildPayload() {
    return {
      id: state.editingId || `SM-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
      strategyName: state.form.strategyName.trim(),
      status: state.form.status,
      reminderType: state.form.reminderType,
      targetType: state.form.targetType,
      selectedTargetIds: [...state.form.selectedTargetIds],
      templates: state.form.templates.map((entry) => ({
        uid: entry.uid,
        templateId: entry.templateId,
        notificationMode: entry.notificationMode,
        keyAccountFilter: entry.keyAccountFilter,
        reminderSteps: entry.notificationMode === "custom" ? clone(entry.reminderSteps) : [],
        ongoingInterval: entry.notificationMode === "ongoing" ? clampInteger(entry.ongoingInterval, 7, 1, 365) : "",
        ongoingAttachments: entry.notificationMode === "ongoing" ? [...(entry.ongoingAttachments || [])] : [],
        invoiceBroadSelections: [...(entry.invoiceBroadSelections || [])],
        invoicePrimarySelections: [...(entry.invoicePrimarySelections || [])],
        dispositionGroups: [...entry.dispositionGroups],
        subStatuses: [...entry.subStatuses],
        invoiceStatuses: [...entry.invoiceStatuses],
        agingBuckets: [...entry.agingBuckets]
      })),
      updatedAt: new Date().toISOString()
    };
  }

  function saveStrategy(event) {
    event.preventDefault();
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    clearError();
    const payload = buildPayload();
    if (state.formMode === "edit" && state.editingId) {
      state.strategies = state.strategies.map((item) => (item.id === state.editingId ? payload : item));
    } else {
      state.strategies = [payload, ...state.strategies];
    }
    writeStorage(STORAGE_KEY, state.strategies);
    showListScreen();
  }

  function handleListActions(event) {
    const action = event.target.closest("[data-action]")?.dataset.action;
    const strategyId = event.target.closest("[data-id]")?.dataset.id;
    if (!action || !strategyId) {
      return;
    }
    if (action === "edit") {
      openEdit(strategyId);
    } else if (action === "delete") {
      deleteStrategy(strategyId);
    }
  }

  function bindEvents() {
    els.createNewBtn.addEventListener("click", openCreate);
    els.backToListBtn.addEventListener("click", showListScreen);
    els.cancelBtn.addEventListener("click", showListScreen);
    els.footerCancelBtn.addEventListener("click", showListScreen);
    els.form.addEventListener("submit", saveStrategy);

    els.listSearch.addEventListener("input", (event) => {
      state.listSearch = event.target.value;
      renderList();
    });
    els.listStatusFilter.addEventListener("change", (event) => {
      state.listStatusFilter = event.target.value;
      renderList();
    });
    els.listScopeFilter.addEventListener("change", (event) => {
      state.listScopeFilter = event.target.value;
      renderList();
    });
    els.listBody.addEventListener("click", handleListActions);

    els.strategyName.addEventListener("input", (event) => {
      state.form.strategyName = event.target.value;
    });
    els.status.addEventListener("change", (event) => {
      state.form.status = event.target.checked ? "active" : "inactive";
      els.statusLabel.textContent = state.form.status === "active" ? "Active" : "Inactive";
    });
    els.reminderType.addEventListener("change", (event) => {
      state.form.reminderType = event.target.value;
    });
    els.targetType.addEventListener("change", (event) => {
      state.form.targetType = event.target.value;
      sanitizeTargets();
      renderBuilder();
    });

    els.targetSearch.addEventListener("input", (event) => {
      state.targetSearch = event.target.value;
      renderTargets();
    });
    els.targetSelectAll.addEventListener("click", () => bulkTargetSelection("all"));
    els.targetClear.addEventListener("click", () => bulkTargetSelection("clear"));
    els.targetList.addEventListener("change", (event) => {
      const targetId = event.target.dataset.targetId;
      if (targetId) {
        toggleTarget(targetId, event.target.checked);
      }
    });

    els.previewTemplateBtn.addEventListener("click", openTemplatePreview);
    els.templatePreviewClose.addEventListener("click", closeTemplatePreview);
    els.templatePreviewFooterClose.addEventListener("click", closeTemplatePreview);
    els.templatePreviewModal.addEventListener("click", (event) => {
      if (event.target === els.templatePreviewModal) {
        closeTemplatePreview();
      }
    });

    els.addTemplateBtn.addEventListener("click", addTemplate);
    els.templateStack.addEventListener("click", (event) => {
      const templateCard = event.target.closest("[data-template-card]");
      if (templateCard) {
        setActiveTemplate(templateCard.dataset.templateUid, { silent: true });
      }
      const invoiceCollapseBtn = event.target.closest("[data-invoice-collapse-kind]");
      if (invoiceCollapseBtn) {
        toggleInvoiceCollapse(invoiceCollapseBtn.dataset.templateUid, invoiceCollapseBtn.dataset.invoiceCollapseKind, invoiceCollapseBtn.value);
        return;
      }
      const invoiceTreeActionBtn = event.target.closest("[data-invoice-tree-action]");
      if (invoiceTreeActionBtn) {
        toggleInvoiceTreeBulk(invoiceTreeActionBtn.dataset.templateUid, invoiceTreeActionBtn.dataset.invoiceTreeAction);
        return;
      }
      const removeTemplateBtn = event.target.closest("[data-remove-template]");
      if (removeTemplateBtn) {
        removeTemplate(removeTemplateBtn.dataset.removeTemplate);
        return;
      }
      const addStepBtn = event.target.closest("[data-add-step]");
      if (addStepBtn) {
        addReminderStep(addStepBtn.dataset.addStep);
        return;
      }
      const removeStepBtn = event.target.closest("[data-remove-step]");
      if (removeStepBtn) {
        removeReminderStep(removeStepBtn.dataset.templateUid, removeStepBtn.dataset.removeStep);
        return;
      }
    });

    els.templateStack.addEventListener("change", (event) => {
      const templateUid = event.target.dataset.templateUid;
      const field = event.target.dataset.templateField;
      const stepField = event.target.dataset.stepField;
      const stepUid = event.target.dataset.stepUid;
      const checklistKind = event.target.dataset.templateCheck;
      const invoiceTreeKind = event.target.dataset.invoiceTreeKind;
      const multiValue = event.target.multiple
        ? Array.from(event.target.selectedOptions || []).map((option) => option.value)
        : event.target.value;

      if (templateUid) {
        setActiveTemplate(templateUid, { silent: true });
      }
      if (templateUid && field) {
        updateTemplateField(templateUid, field, multiValue);
        return;
      }
      if (templateUid && stepField && stepUid) {
        updateReminderStep(templateUid, stepUid, stepField, multiValue);
        return;
      }
      if (templateUid && invoiceTreeKind) {
        toggleInvoiceTreeSelection(templateUid, invoiceTreeKind, event.target.value, event.target.checked);
        return;
      }
      if (templateUid && checklistKind) {
        toggleTemplateChecklist(templateUid, checklistKind, event.target.value, event.target.checked);
      }
    });

    els.templateStack.addEventListener("input", (event) => {
      const templateUid = event.target.dataset.templateUid;
      const field = event.target.dataset.templateField;
      const stepField = event.target.dataset.stepField;
      const stepUid = event.target.dataset.stepUid;

      if (templateUid) {
        setActiveTemplate(templateUid, { silent: true });
      }
      if (templateUid && field && field === "ongoingInterval") {
        updateTemplateField(templateUid, field, event.target.value);
        return;
      }
      if (templateUid && stepField === "days" && stepUid) {
        updateReminderStep(templateUid, stepUid, stepField, event.target.value);
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && state.isPreviewOpen) {
        closeTemplatePreview();
      }
    });
  }

  async function init() {
    bindEvents();
    await loadCustomers();
    loadStrategies();
    renderList();
    showListScreen();
  }

  document.addEventListener("DOMContentLoaded", init);
})();
