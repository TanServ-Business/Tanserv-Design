/* Admin-only definitions: Configuration, Bulk Upload, and Customers. */
(() => {
  "use strict";

  const select = (key, label, options, extra = {}) => ({
    key,
    label,
    type: "select",
    options,
    ...extra
  });
  const field = (key, label, type = "text", extra = {}) => ({
    key,
    label,
    type,
    ...extra
  });
  const statusFilter = {
    key: "status",
    label: "Status",
    type: "select",
    options: ["All", "Active", "Inactive", "Draft", "Paused"]
  };
  const editAction = { id: "edit", label: "Edit", kind: "edit" };

  const modules = {
    "submission-process": {
      id: "submission-process",
      title: "Invoice Submission Process",
      description: "Configure how invoices and supporting documents are shared with customers.",
      sectionTitle: "Invoice Submission Processes",
      tabs: [
        { label: "Strategy Manager", module: "submission-process" },
        { label: "Push Settings", module: "submission-process:push-settings" },
        { label: "Email Settings", module: "submission-process:email-settings" }
      ],
      columns: [
        { key: "status", label: "Status", type: "status" },
        { key: "strategyName", label: "Strategy Name", type: "text" },
        { key: "applyOn", label: "Apply On", type: "text" },
        { key: "strategyType", label: "Strategy Type", type: "text" },
        { key: "documents", label: "Selected Documents", type: "tags" },
        { key: "actions", label: "Actions", type: "actions" }
      ],
      seedRows: [
        {
          id: "submission-001",
          status: "Active",
          strategyName: "Invoice with supporting documents",
          applyOn: "All Customers",
          strategyType: "Email & Push",
          documents: ["Invoice Copy", "Statement of Account"]
        },
        {
          id: "submission-002",
          status: "Draft",
          strategyName: "Key account submission",
          applyOn: "Selected Customer Groups",
          strategyType: "Email",
          documents: ["Invoice Copy", "Purchase Order", "GRN"]
        }
      ],
      searchPlaceholder: "Search strategy name",
      filters: [
        statusFilter,
        select("applyOn", "Apply On", ["All", "All Customers", "Customer Group", "Selected Customers"]),
        select("strategyType", "Strategy Type", ["All", "Email", "Push", "Email & Push"])
      ],
      create: {
        label: "Create Process",
        title: "Create Invoice Submission Process",
        fields: [
          field("strategyName", "Strategy Name", "text", {
            required: true,
            placeholder: "Enter a unique strategy name",
            span: 2
          }),
          select("status", "Status", ["Active", "Inactive", "Draft"], { required: true }),
          select("applyOn", "Apply On", ["All Customers", "Customer Group", "Selected Customers"], {
            required: true
          }),
          select("customerGroup", "Customer Group", ["Enterprise Accounts", "Retail Accounts", "North Region"], {
            dependsOn: { field: "applyOn", value: "Customer Group" }
          }),
          field("customers", "Customers", "multiselect", {
            options: ["Apex Retail Ltd", "Bluebird Manufacturing", "Crescent Healthcare"],
            dependsOn: { field: "applyOn", value: "Selected Customers" },
            span: 2
          }),
          select("strategyType", "Submission Mode", ["Email", "Push", "Email & Push"], {
            required: true
          }),
          field("documents", "Documents to Submit", "checkbox-group", {
            required: true,
            options: ["Invoice Copy", "Statement of Account", "Purchase Order", "GRN", "Supporting Documents"],
            span: 2
          }),
          select("senderAccount", "Sender Account", ["billing@testclient.com", "collections@testclient.com"], {
            dependsOn: { field: "strategyType", values: ["Email", "Email & Push"] }
          }),
          select("emailTemplate", "Email Template", ["Invoice Submission", "Invoice with Statement"], {
            dependsOn: { field: "strategyType", values: ["Email", "Email & Push"] }
          }),
          field("pushTitle", "Push Notification Title", "text", {
            placeholder: "Invoice documents are ready",
            dependsOn: { field: "strategyType", values: ["Push", "Email & Push"] },
            span: 2
          })
        ]
      },
      rowActions: [
        editAction,
        { id: "preview", label: "Preview", kind: "preview" },
        {
          id: "toggle-status",
          label: "Pause / Activate",
          kind: "confirm",
          confirmTitle: "Change process status?",
          confirmBody: "This changes only the dummy process status. No customer communication will be sent."
        },
        {
          id: "delete",
          label: "Delete",
          kind: "danger",
          confirmTitle: "Delete submission process?",
          confirmBody: "The selected dummy process will be removed from this Admin prototype."
        }
      ],
      settingsSections: [
        {
          title: "Push Settings",
          description: "Default delivery and retry behaviour for invoice submission push notifications.",
          fields: [
            field("pushEnabled", "Enable Push Notifications", "toggle"),
            field("pushRetries", "Retry Attempts", "number", { placeholder: "3" }),
            field("pushExpiryHours", "Notification Expiry (hours)", "number", { placeholder: "48" })
          ]
        },
        {
          title: "Email Settings",
          description: "Default sender and attachment behaviour for invoice submission emails.",
          fields: [
            select("defaultSender", "Default Sender", ["billing@testclient.com", "collections@testclient.com"]),
            field("attachInvoice", "Attach Invoice Copy", "toggle"),
            field("attachStatement", "Attach Statement of Account", "toggle")
          ]
        }
      ],
      customBlocks: [
        {
          type: "process-preview",
          id: "submission-preview",
          title: "Submission Preview",
          description: "Shows the selected template, recipients, and document checklist before saving."
        }
      ],
      emptyMessage: "No invoice submission processes found."
    },

    "module-configuration": {
      id: "module-configuration",
      title: "Module Configuration",
      description: "Configure operational modules and client-level processing rules.",
      sectionTitle: "Configurations",
      tabs: [],
      columns: [
        { key: "module", label: "Module", type: "text" },
        { key: "configuration", label: "Configuration", type: "text" },
        { key: "status", label: "Status", type: "status" },
        { key: "updatedBy", label: "Updated By", type: "text" },
        { key: "lastUpdated", label: "Last Updated", type: "date" },
        { key: "actions", label: "Actions", type: "actions" }
      ],
      seedRows: [
        {
          id: "config-visit",
          module: "Visit",
          configuration: "Geo validation and mandatory visit outcome",
          status: "Active",
          updatedBy: "admin TestClient",
          lastUpdated: "30 Jul 2026"
        },
        {
          id: "config-month-end",
          module: "Month-end Activity",
          configuration: "Confirmation required on the final working day",
          status: "Active",
          updatedBy: "admin TestClient",
          lastUpdated: "29 Jul 2026"
        },
        {
          id: "config-pdc",
          module: "PDC",
          configuration: "Maker-checker approval enabled",
          status: "Active",
          updatedBy: "operations.admin",
          lastUpdated: "26 Jul 2026"
        }
      ],
      searchPlaceholder: "Search configuration",
      filters: [
        select("module", "Module", ["All", "Visit", "Month-end Activity", "Client Confirmation", "PDC", "Escalation"]),
        statusFilter
      ],
      create: null,
      rowActions: [editAction],
      settingsSections: [
        {
          title: "Visit",
          description: "Field-visit rules and evidence requirements.",
          fields: [
            field("visitEnabled", "Enable Visit Module", "toggle"),
            field("visitGeoValidation", "Require Geo-location", "toggle"),
            field("visitPhoto", "Require Visit Photograph", "toggle"),
            select("visitOutcome", "Mandatory Visit Outcome", ["Yes", "No"])
          ]
        },
        {
          title: "Month-end Activity",
          description: "Control month-end confirmations and auto-submission.",
          fields: [
            field("monthEndEnabled", "Enable Month-end Activity", "toggle"),
            field("monthEndAutoSubmit", "Auto Submission", "toggle"),
            select("monthEndDueDay", "Due Day", ["Last Working Day", "1st of Next Month", "2nd of Next Month"]),
            field("monthEndReminder", "Reminder Before Due Date (days)", "number", { placeholder: "2" })
          ]
        },
        {
          title: "Client Confirmation",
          description: "Set confirmation frequency and supporting-document requirements.",
          fields: [
            field("confirmationEnabled", "Enable Client Confirmation", "toggle"),
            select("confirmationFrequency", "Frequency", ["Monthly", "Quarterly", "Half-yearly"]),
            field("confirmationAttachment", "Require Signed Attachment", "toggle")
          ]
        },
        {
          title: "PDC",
          description: "Configure post-dated cheque processing and approvals.",
          fields: [
            field("pdcEnabled", "Enable PDC Module", "toggle"),
            field("pdcMakerChecker", "Maker-checker Approval", "toggle"),
            field("pdcReminderDays", "Expiry Reminder (days)", "number", { placeholder: "7" })
          ]
        },
        {
          title: "Escalation",
          description: "Define escalation timing for unattended collection work.",
          fields: [
            field("escalationEnabled", "Enable Escalations", "toggle"),
            field("escalationHours", "Escalate After (hours)", "number", { placeholder: "24" }),
            field("escalationNotifyManager", "Notify Reporting Manager", "toggle")
          ]
        },
        {
          title: "Invoice Adjustments",
          description: "Client-level rules for deduction and reconciliation data.",
          fields: [
            field("tdsEnabled", "Enable TDS", "toggle"),
            field("tdsPercentage", "Default TDS Percentage", "number", {
              placeholder: "10",
              dependsOn: { field: "tdsEnabled", value: true }
            }),
            field("cnAdvanceEnabled", "Enable CN / Advance", "toggle"),
            field("grnEnabled", "Enable GRN", "toggle")
          ]
        }
      ],
      upload: null,
      customBlocks: [
        {
          type: "settings-savebar",
          title: "Unsaved configuration",
          actions: ["Discard Changes", "Save Configuration"]
        }
      ],
      emptyMessage: "No module configurations are available."
    },

    "portfolio-transfer": {
      id: "portfolio-transfer",
      title: "Bulk Uploads (AR Transactions)",
      description: "Transfer invoice portfolios between operational users using the prescribed template.",
      sectionTitle: "Portfolio Transfer",
      tabs: [
        { label: "Portfolio Transfer", module: "portfolio-transfer" },
        { label: "Upload History", module: "portfolio-transfer:history" }
      ],
      columns: [
        { key: "fileName", label: "File Name", type: "text" },
        { key: "company", label: "Company", type: "text" },
        { key: "status", label: "Status", type: "status" },
        { key: "uploadDate", label: "Upload Date", type: "datetime" },
        { key: "total", label: "Total", type: "number" },
        { key: "success", label: "Success", type: "number" },
        { key: "rejected", label: "Rejected", type: "number" },
        { key: "progress", label: "Progress", type: "progress" },
        { key: "actions", label: "Actions", type: "actions" }
      ],
      seedRows: [
        {
          id: "transfer-001",
          fileName: "Portfolio_Transfer_July.xlsx",
          company: "TestClient Pvt Ltd",
          status: "Completed",
          uploadDate: "30 Jul 2026, 10:42 AM",
          total: 128,
          success: 124,
          rejected: 4,
          progress: 100
        }
      ],
      searchPlaceholder: "Search file or company",
      filters: [
        select("company", "Company", ["All", "TestClient Pvt Ltd"]),
        select("status", "Status", ["All", "Validating", "Processing", "Completed", "Completed with errors", "Rejected"])
      ],
      create: null,
      rowActions: [
        { id: "view-results", label: "View Results", kind: "drawer" },
        { id: "download-errors", label: "Download Rejections", kind: "download" }
      ],
      settingsSections: [],
      upload: {
        accept: ".xlsx,.xls,.csv",
        multiple: false,
        fields: [
          select("company", "Company", ["TestClient Pvt Ltd"], { required: true }),
          select("transferType", "Transfer Type", ["Agent to Agent", "Manager to Manager", "Branch Transfer"], {
            required: true
          }),
          field("effectiveDate", "Effective Date", "date", { required: true })
        ],
        buttons: ["Download Template", "Browse File", "Clear", "Upload"],
        resultColumns: ["Row No.", "Invoice No.", "From User", "To User", "Result", "Remarks"]
      },
      customBlocks: [
        {
          type: "upload-help",
          title: "Before you upload",
          items: [
            "Use the latest portfolio transfer template.",
            "Do not change the template column headings.",
            "Invoices with invalid assignees will be listed as rejected."
          ]
        }
      ],
      emptyMessage: "No portfolio transfer uploads found."
    },

    "bulk-document-upload": {
      id: "bulk-document-upload",
      title: "Bulk Uploads (AR Transactions)",
      description: "Upload supporting documents and associate each file with the selected document type.",
      sectionTitle: "Bulk Document Upload",
      tabs: [
        { label: "Bulk Document Upload", module: "bulk-document-upload" },
        { label: "Upload History", module: "bulk-document-upload:history" },
        { label: "Limbo Documents", module: "bulk-document-upload:limbo" }
      ],
      columns: [
        { key: "fileName", label: "File Name", type: "text" },
        { key: "documentType", label: "Document Type", type: "text" },
        { key: "invoiceNumber", label: "Invoice Number", type: "text" },
        { key: "status", label: "Status", type: "status" },
        { key: "uploadDate", label: "Upload Date", type: "datetime" },
        { key: "uploadedBy", label: "Uploaded By", type: "text" },
        { key: "actions", label: "Actions", type: "actions" }
      ],
      seedRows: [
        {
          id: "document-001",
          fileName: "INV-TC-10248-GRN.pdf",
          documentType: "GRN",
          invoiceNumber: "TC/INV/10248",
          status: "Mapped",
          uploadDate: "30 Jul 2026, 11:05 AM",
          uploadedBy: "admin TestClient"
        },
        {
          id: "document-002",
          fileName: "customer_acknowledgement.jpg",
          documentType: "Acknowledgement",
          invoiceNumber: "—",
          status: "Limbo",
          uploadDate: "30 Jul 2026, 10:56 AM",
          uploadedBy: "admin TestClient"
        }
      ],
      searchPlaceholder: "Search file name or invoice number",
      filters: [
        select("documentType", "Document Type", ["All", "Invoice Copy", "GRN", "Purchase Order", "Acknowledgement", "Other"]),
        select("status", "Status", ["All", "Mapped", "Processing", "Limbo", "Rejected"])
      ],
      create: null,
      rowActions: [
        { id: "preview", label: "Preview", kind: "preview" },
        { id: "map-document", label: "Map Document", kind: "edit" },
        {
          id: "remove",
          label: "Remove",
          kind: "danger",
          confirmTitle: "Remove document?",
          confirmBody: "This removes only the dummy document entry from the prototype."
        }
      ],
      settingsSections: [],
      upload: {
        accept: ".pdf,.jpeg,.jpg,.png",
        multiple: true,
        fields: [
          select("company", "Company", ["TestClient Pvt Ltd"], { required: true }),
          select("documentType", "Document Type", ["Invoice Copy", "GRN", "Purchase Order", "Acknowledgement", "Other"], {
            required: true
          })
        ],
        buttons: ["Browse Files", "Clear", "Upload", "Show Limbo Documents"],
        resultColumns: ["File Name", "Document Type", "Matched Invoice", "Result", "Remarks"]
      },
      customBlocks: [
        {
          type: "limbo-summary",
          title: "Documents in Limbo",
          metrics: [
            { label: "Awaiting Mapping", value: 3 },
            { label: "Duplicate Match", value: 1 },
            { label: "Invalid File Name", value: 2 }
          ]
        }
      ],
      emptyMessage: "No documents have been uploaded."
    },

    "grn-upload": {
      id: "grn-upload",
      title: "Bulk Uploads (AR Transactions)",
      description: "Upload goods receipt note details using the TestClient GRN template.",
      sectionTitle: "GRN Upload",
      tabs: [
        { label: "GRN Upload", module: "grn-upload" },
        { label: "Upload History", module: "grn-upload:history" }
      ],
      columns: [
        { key: "fileName", label: "File Name", type: "text" },
        { key: "company", label: "Company", type: "text" },
        { key: "status", label: "Status", type: "status" },
        { key: "uploadDate", label: "Upload Date", type: "datetime" },
        { key: "total", label: "Total", type: "number" },
        { key: "success", label: "Success", type: "number" },
        { key: "rejected", label: "Rejected", type: "number" },
        { key: "progress", label: "Progress", type: "progress" },
        { key: "actions", label: "Actions", type: "actions" }
      ],
      seedRows: [
        {
          id: "grn-001",
          fileName: "GRN_July_Week_4.xlsx",
          company: "TestClient Pvt Ltd",
          status: "Completed",
          uploadDate: "29 Jul 2026, 04:20 PM",
          total: 86,
          success: 84,
          rejected: 2,
          progress: 100
        }
      ],
      searchPlaceholder: "Search GRN upload",
      filters: [
        select("company", "Company", ["All", "TestClient Pvt Ltd"]),
        select("status", "Status", ["All", "Validating", "Processing", "Completed", "Completed with errors", "Rejected"])
      ],
      create: null,
      rowActions: [
        { id: "view-results", label: "View Results", kind: "drawer" },
        { id: "download-errors", label: "Download Rejections", kind: "download" }
      ],
      settingsSections: [],
      upload: {
        accept: ".xlsx,.xls,.csv",
        multiple: false,
        fields: [
          select("company", "Company", ["TestClient Pvt Ltd"], { required: true }),
          select("dataPeriod", "Data Period", ["Jul 2026", "Jun 2026", "May 2026"], { required: true })
        ],
        buttons: ["Download Template", "Browse File", "Clear", "Upload"],
        resultColumns: ["Row No.", "Invoice No.", "GRN No.", "GRN Date", "Result", "Remarks"]
      },
      customBlocks: [],
      emptyMessage: "No GRN uploads found."
    },

    "cn-advance-upload": {
      id: "cn-advance-upload",
      title: "Bulk Uploads (AR Transactions)",
      description: "Upload credit-note and customer-advance details against open invoices.",
      sectionTitle: "CN/Advance Upload",
      tabs: [
        { label: "CN / Advance Upload", module: "cn-advance-upload" },
        { label: "Upload History", module: "cn-advance-upload:history" }
      ],
      columns: [
        { key: "fileName", label: "File Name", type: "text" },
        { key: "transactionType", label: "Transaction Type", type: "text" },
        { key: "company", label: "Company", type: "text" },
        { key: "status", label: "Status", type: "status" },
        { key: "uploadDate", label: "Upload Date", type: "datetime" },
        { key: "total", label: "Total", type: "number" },
        { key: "success", label: "Success", type: "number" },
        { key: "rejected", label: "Rejected", type: "number" },
        { key: "actions", label: "Actions", type: "actions" }
      ],
      seedRows: [
        {
          id: "cn-001",
          fileName: "CN_Advance_July.xlsx",
          transactionType: "Credit Note & Advance",
          company: "TestClient Pvt Ltd",
          status: "Completed with errors",
          uploadDate: "28 Jul 2026, 02:10 PM",
          total: 64,
          success: 61,
          rejected: 3
        }
      ],
      searchPlaceholder: "Search CN / advance upload",
      filters: [
        select("transactionType", "Transaction Type", ["All", "Credit Note", "Advance", "Credit Note & Advance"]),
        select("status", "Status", ["All", "Validating", "Processing", "Completed", "Completed with errors", "Rejected"])
      ],
      create: null,
      rowActions: [
        { id: "view-results", label: "View Results", kind: "drawer" },
        { id: "download-errors", label: "Download Rejections", kind: "download" }
      ],
      settingsSections: [],
      upload: {
        accept: ".xlsx,.xls,.csv",
        multiple: false,
        fields: [
          select("company", "Company", ["TestClient Pvt Ltd"], { required: true }),
          select("transactionType", "Transaction Type", ["Credit Note", "Advance", "Credit Note & Advance"], {
            required: true
          }),
          select("dataPeriod", "Data Period", ["Jul 2026", "Jun 2026", "May 2026"], { required: true })
        ],
        buttons: ["Download Template", "Browse File", "Clear", "Upload"],
        resultColumns: ["Row No.", "Customer Code", "Invoice No.", "Reference No.", "Amount", "Result", "Remarks"]
      },
      customBlocks: [],
      emptyMessage: "No CN / Advance uploads found."
    },

    "payment-receipt-upload": {
      id: "payment-receipt-upload",
      title: "Bulk Uploads (AR Transactions)",
      description: "Upload payment receipts and allocation references using the payment template.",
      sectionTitle: "Payment Receipt Upload",
      tabs: [
        { label: "Payment Receipt Upload", module: "payment-receipt-upload" },
        { label: "Upload History", module: "payment-receipt-upload:history" }
      ],
      columns: [
        { key: "fileName", label: "File Name", type: "text" },
        { key: "company", label: "Company", type: "text" },
        { key: "status", label: "Status", type: "status" },
        { key: "uploadDate", label: "Upload Date", type: "datetime" },
        { key: "total", label: "Total", type: "number" },
        { key: "success", label: "Success", type: "number" },
        { key: "rejected", label: "Rejected", type: "number" },
        { key: "progress", label: "Progress", type: "progress" },
        { key: "actions", label: "Actions", type: "actions" }
      ],
      seedRows: [
        {
          id: "payment-001",
          fileName: "Payment_Receipts_30_July.xlsx",
          company: "TestClient Pvt Ltd",
          status: "Completed",
          uploadDate: "30 Jul 2026, 09:35 AM",
          total: 113,
          success: 113,
          rejected: 0,
          progress: 100
        }
      ],
      searchPlaceholder: "Search payment receipt upload",
      filters: [
        select("company", "Company", ["All", "TestClient Pvt Ltd"]),
        select("status", "Status", ["All", "Validating", "Processing", "Completed", "Completed with errors", "Rejected"])
      ],
      create: null,
      rowActions: [
        { id: "view-results", label: "View Results", kind: "drawer" },
        { id: "download-errors", label: "Download Rejections", kind: "download" }
      ],
      settingsSections: [],
      upload: {
        accept: ".xlsx,.xls,.csv",
        multiple: false,
        fields: [
          select("company", "Company", ["TestClient Pvt Ltd"], { required: true }),
          select("receiptMode", "Receipt Mode", ["Bank Receipt", "Cash Receipt", "Online Transfer", "Mixed"], {
            required: true
          }),
          field("receiptDate", "Receipt Date", "date", { required: true })
        ],
        buttons: ["Download Template", "Browse File", "Clear", "Upload"],
        resultColumns: ["Row No.", "Receipt No.", "Customer Code", "Invoice No.", "Amount", "Result", "Remarks"]
      },
      customBlocks: [],
      emptyMessage: "No payment receipt uploads found."
    },

    "group-master": {
      id: "group-master",
      title: "Customer Onboarding",
      description: "Manage customer groups, customer master records, and contacts.",
      sectionTitle: "Group Master",
      tabs: [
        { label: "Group Master", module: "group-master" },
        { label: "Customer Master", module: "customer-master" },
        { label: "Customer Contacts", module: "customer-contacts" },
        { label: "Customer Bulk Upload", module: "customer-master:bulk-upload" }
      ],
      columns: [
        { key: "groupCode", label: "Group Code", type: "text" },
        { key: "groupName", label: "Group Name", type: "text" },
        { key: "customerCount", label: "Customer Count", type: "number" },
        { key: "status", label: "Status", type: "status" },
        { key: "createdOn", label: "Created On", type: "date" },
        { key: "actions", label: "Actions", type: "actions" }
      ],
      seedRows: [
        {
          id: "group-001",
          groupCode: "ENT-001",
          groupName: "Enterprise Accounts",
          customerCount: 18,
          status: "Active",
          createdOn: "12 Jan 2026"
        },
        {
          id: "group-002",
          groupCode: "RET-001",
          groupName: "Retail Accounts",
          customerCount: 42,
          status: "Active",
          createdOn: "18 Jan 2026"
        }
      ],
      searchPlaceholder: "Search group code or name",
      filters: [statusFilter],
      create: {
        label: "Create Group",
        title: "Create Customer Group",
        fields: [
          field("groupCode", "Group Code", "text", { required: true, placeholder: "e.g. ENT-001" }),
          field("groupName", "Group Name", "text", { required: true, placeholder: "Enter group name" }),
          field("description", "Description", "textarea", {
            placeholder: "Describe the customers in this group",
            span: 2
          }),
          select("status", "Status", ["Active", "Inactive"], { required: true })
        ]
      },
      rowActions: [
        editAction,
        { id: "view-customers", label: "View Customers", kind: "drawer" },
        {
          id: "delete",
          label: "Delete",
          kind: "danger",
          confirmTitle: "Delete customer group?",
          confirmBody: "Groups linked to dummy customers must be reassigned before deletion."
        }
      ],
      settingsSections: [],
      upload: null,
      customBlocks: [],
      emptyMessage: "No customer groups found."
    },

    "customer-master": {
      id: "customer-master",
      title: "Customer Onboarding",
      description: "Create and maintain customer identities, ownership, tax details, and contact information.",
      sectionTitle: "Customer Master",
      tabs: [
        { label: "Group Master", module: "group-master" },
        { label: "Customer Master", module: "customer-master" },
        { label: "Customer Contacts", module: "customer-contacts" },
        { label: "Customer Bulk Upload", module: "customer-master:bulk-upload" }
      ],
      columns: [
        { key: "customerCode", label: "Customer Code", type: "text" },
        { key: "customerName", label: "Customer Name", type: "text" },
        { key: "pan", label: "Customer PAN", type: "text" },
        { key: "groupName", label: "Group", type: "text" },
        { key: "agent", label: "Agent", type: "text" },
        { key: "manager", label: "Manager", type: "text" },
        { key: "kam", label: "KAM", type: "text" },
        { key: "kas", label: "KAS", type: "text" },
        { key: "status", label: "Status", type: "status" },
        { key: "actions", label: "Actions", type: "actions" }
      ],
      seedRows: [
        {
          id: "customer-001",
          customerCode: "CUST-10021",
          customerName: "Apex Retail Ltd",
          pan: "AABCA1234F",
          groupName: "Enterprise Accounts",
          agent: "Arjun Mehta",
          manager: "Neha Kapoor",
          kam: "Ritika Shah",
          kas: "Kabir Verma",
          status: "Active"
        },
        {
          id: "customer-002",
          customerCode: "CUST-10035",
          customerName: "Bluebird Manufacturing",
          pan: "AAGCB4821D",
          groupName: "North Region",
          agent: "Sana Sheikh",
          manager: "Vivek Rao",
          kam: "Ritika Shah",
          kas: "Kabir Verma",
          status: "Active"
        }
      ],
      searchPlaceholder: "Search customer code, name, PAN, or owner",
      filters: [
        select("groupName", "Group", ["All", "Enterprise Accounts", "Retail Accounts", "North Region"]),
        select("branch", "Branch", ["All", "Gurugram", "Mumbai", "Bengaluru"]),
        statusFilter
      ],
      create: {
        label: "Create Customer",
        title: "Create Customer",
        fields: [
          field("customerCode", "Customer Code", "text", { required: true, placeholder: "Enter customer code" }),
          field("customerName", "Customer Name", "text", { required: true, placeholder: "Enter legal customer name" }),
          field("pan", "Customer PAN", "text", { required: true, placeholder: "ABCDE1234F" }),
          field("gstin", "GSTIN", "text", { placeholder: "Enter 15-character GSTIN" }),
          select("groupName", "Customer Group", ["Enterprise Accounts", "Retail Accounts", "North Region"]),
          select("industry", "Industry", ["Automotive", "Healthcare", "Manufacturing", "Retail", "Services", "Other"]),
          select("branch", "Branch", ["Gurugram", "Mumbai", "Bengaluru"], { required: true }),
          select("status", "Status", ["Active", "Inactive", "On Hold"], { required: true }),
          field("address1", "Address Line 1", "text", {
            required: true,
            placeholder: "Building / street",
            span: 2
          }),
          field("address2", "Address Line 2", "text", { placeholder: "Area / landmark", span: 2 }),
          field("pincode", "Pincode", "text", { required: true, placeholder: "6-digit pincode" }),
          field("city", "City", "text", { required: true }),
          select("state", "State", ["Delhi", "Haryana", "Karnataka", "Maharashtra", "Tamil Nadu"], {
            required: true
          }),
          select("country", "Country", ["India"], { required: true }),
          select("agent", "Agent", ["Arjun Mehta", "Sana Sheikh"], { required: true }),
          select("manager", "Manager", ["Neha Kapoor", "Vivek Rao"], { required: true }),
          select("kam", "KAM", ["Ritika Shah", "Aman Gill"]),
          select("kas", "KAS", ["Kabir Verma", "Meera Nair"]),
          field("creditLimit", "Credit Limit", "number", { placeholder: "0.00" }),
          field("paymentTerms", "Payment Terms (days)", "number", { placeholder: "30" })
        ]
      },
      rowActions: [
        { id: "view", label: "View", kind: "drawer" },
        editAction,
        {
          id: "toggle-status",
          label: "Activate / Deactivate",
          kind: "confirm",
          confirmTitle: "Change customer status?",
          confirmBody: "This changes only the dummy customer status in the Admin prototype."
        }
      ],
      settingsSections: [],
      upload: {
        accept: ".xlsx,.xls,.csv",
        multiple: false,
        fields: [
          select("company", "Company", ["TestClient Pvt Ltd"], { required: true }),
          select("defaultBranch", "Default Branch", ["Gurugram", "Mumbai", "Bengaluru"], { required: true })
        ],
        buttons: ["Download Template", "Browse File", "Clear", "Upload"],
        resultColumns: ["Row No.", "Customer Code", "Customer Name", "Result", "Remarks"]
      },
      customBlocks: [
        {
          type: "customer-detail",
          title: "Customer Details",
          sections: ["Business Identity", "Address & Tax", "Collection Ownership", "Credit & Payment Terms"]
        }
      ],
      emptyMessage: "No customers found."
    },

    "customer-contacts": {
      id: "customer-contacts",
      title: "Customer Onboarding",
      description: "Maintain customer contacts and their communication roles.",
      sectionTitle: "Customer Contacts",
      tabs: [
        { label: "Group Master", module: "group-master" },
        { label: "Customer Master", module: "customer-master" },
        { label: "Customer Contacts", module: "customer-contacts" },
        { label: "Customer Bulk Upload", module: "customer-master:bulk-upload" }
      ],
      columns: [
        { key: "name", label: "Name", type: "text" },
        { key: "designation", label: "Designation", type: "text" },
        { key: "email", label: "Email", type: "email" },
        { key: "phone", label: "Phone", type: "phone" },
        { key: "customer", label: "Customer", type: "text" },
        { key: "contactType", label: "Contact Type", type: "text" },
        { key: "status", label: "Status", type: "status" },
        { key: "actions", label: "Actions", type: "actions" }
      ],
      seedRows: [
        {
          id: "contact-001",
          name: "Ananya Joshi",
          designation: "Accounts Payable Lead",
          email: "ananya.joshi@apexretail.example",
          phone: "+91 98765 41022",
          customer: "Apex Retail Ltd",
          contactType: "Accounts Payable",
          status: "Active"
        },
        {
          id: "contact-002",
          name: "Rahul Sethi",
          designation: "Finance Controller",
          email: "rahul.sethi@bluebird.example",
          phone: "+91 98110 28416",
          customer: "Bluebird Manufacturing",
          contactType: "Escalation",
          status: "Active"
        }
      ],
      searchPlaceholder: "Search name, email, phone, or customer",
      filters: [
        select("customer", "Customer", ["All", "Apex Retail Ltd", "Bluebird Manufacturing", "Crescent Healthcare"]),
        select("contactType", "Contact Type", ["All", "Accounts Payable", "Finance", "Escalation", "Management"]),
        statusFilter
      ],
      create: {
        label: "Create Contact",
        title: "Create Customer Contact",
        fields: [
          select("customer", "Customer", ["Apex Retail Ltd", "Bluebird Manufacturing", "Crescent Healthcare"], {
            required: true,
            span: 2
          }),
          field("name", "Contact Name", "text", { required: true, placeholder: "Enter full name" }),
          field("designation", "Designation", "text", { placeholder: "Enter designation" }),
          field("email", "Email Address", "email", { required: true, placeholder: "name@company.com" }),
          field("phone", "Mobile Number", "tel", { required: true, placeholder: "+91 98XXX XXXXX" }),
          select("contactType", "Contact Type", ["Accounts Payable", "Finance", "Escalation", "Management"], {
            required: true
          }),
          select("preferredChannel", "Preferred Communication", ["Email", "Phone", "WhatsApp"]),
          field("primaryContact", "Primary Contact", "checkbox"),
          field("whatsappOptIn", "WhatsApp Declaration Received", "checkbox"),
          select("status", "Status", ["Active", "Inactive"], { required: true })
        ]
      },
      rowActions: [
        editAction,
        {
          id: "toggle-status",
          label: "Activate / Deactivate",
          kind: "confirm",
          confirmTitle: "Change contact status?",
          confirmBody: "This changes only the dummy contact status."
        },
        {
          id: "delete",
          label: "Delete",
          kind: "danger",
          confirmTitle: "Delete customer contact?",
          confirmBody: "The selected dummy contact will be removed from the Admin prototype."
        }
      ],
      settingsSections: [],
      upload: null,
      customBlocks: [],
      emptyMessage: "No customer contacts found."
    }
  };

  window.IneburaAdminModules = {
    ...(window.IneburaAdminModules || {}),
    ...modules
  };
})();
