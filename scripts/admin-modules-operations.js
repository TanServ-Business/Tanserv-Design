/* Admin module definitions: communication, strategy, invoice operations, and standalone admin tools. */
(() => {
  "use strict";

  const field = (key, label, type = "text", extra = {}) => ({
    key,
    label,
    type,
    ...extra
  });

  const action = (id, label, kind = "secondary", extra = {}) => ({
    id,
    label,
    kind,
    ...extra
  });

  const communicationTabs = [
    { label: "Template Master", module: "template-master" },
    { label: "Email Sender SMTP Setup", module: "smtp-setup" },
    { label: "Email Sender Account Setup", module: "sender-account" }
  ];

  const invoiceTabs = [
    { label: "Invoice Upload", module: "invoice-upload" },
    { label: "Invoice Reallocation", module: "invoice-reallocation" },
    { label: "Invoice Deletion", module: "invoice-deletion" }
  ];

  const uploadResultColumns = [
    { key: "fileName", label: "File Name" },
    { key: "status", label: "Status", type: "status" },
    { key: "uploadedAt", label: "Upload Date", type: "datetime" },
    { key: "total", label: "Total", type: "number" },
    { key: "success", label: "Success", type: "number" },
    { key: "rejected", label: "Rejected", type: "number" },
    { key: "progress", label: "Progress", type: "progress" }
  ];

  const modules = {
    "template-master": {
      id: "template-master",
      title: "Communication Setup",
      description: "Configure message templates, sender infrastructure, and outbound accounts.",
      sectionTitle: "Template Master",
      tabs: communicationTabs,
      columns: [
        { key: "eventType", label: "Event Type" },
        { key: "recipientRole", label: "Recipient Role" },
        { key: "communicationMode", label: "Comm. Mode" },
        { key: "code", label: "Code" },
        { key: "subject", label: "Subject" },
        { key: "schedule", label: "Schedule" },
        { key: "status", label: "Status", type: "status" }
      ],
      seedRows: [
        {
          id: "tpl-001",
          eventType: "Reminder for Payment Due",
          recipientRole: "Customer",
          communicationMode: "Email",
          code: "PAYMENT_DUE_REMINDER",
          subject: "Payment reminder for invoice {{InvoiceNo}}",
          schedule: "Strategy controlled",
          description: "Payment reminder used by active collection strategies.",
          status: "Active"
        },
        {
          id: "tpl-002",
          eventType: "Acknowledgement of Invoice Receipt",
          recipientRole: "Customer Contact",
          communicationMode: "Email",
          code: "INVOICE_ACK",
          subject: "Please acknowledge invoice {{InvoiceNo}}",
          schedule: "On demand",
          description: "Requests confirmation after invoice documents are shared.",
          status: "Active"
        },
        {
          id: "tpl-003",
          eventType: "PTP Missed Mail",
          recipientRole: "Customer",
          communicationMode: "Email",
          code: "PTP_MISSED",
          subject: "Follow-up on missed promise to pay",
          schedule: "Strategy controlled",
          description: "Sent after a committed payment date is missed.",
          status: "Draft"
        }
      ],
      searchPlaceholder: "Search event, code, subject, or recipient role",
      filters: [
        field("communicationMode", "Communication Mode", "select", { options: ["All", "Email", "WhatsApp", "SMS"] }),
        field("status", "Status", "select", { options: ["All", "Active", "Draft", "Inactive"] })
      ],
      create: {
        label: "Create Template",
        title: "Create Email Template",
        fields: [
          field("eventType", "Event Type", "select", {
            required: true,
            options: [
              "Acknowledgement of Invoice Receipt",
              "Cheque Bounce",
              "New Invoice - Existing Customer",
              "New Invoice - No Outstanding",
              "Pending Payments",
              "PTP Confirmation Mail",
              "PTP Missed Mail",
              "Reminder for Payment Due",
              "Request for Payment Advice or Details"
            ]
          }),
          field("recipientRole", "Recipient Role", "select", {
            required: true,
            options: ["Customer", "Customer Contact", "Agent", "Manager", "Key Account Manager"]
          }),
          field("communicationMode", "Communication Mode", "select", {
            required: true,
            options: ["Email", "WhatsApp", "SMS"]
          }),
          field("code", "Template Code", "text", {
            required: true,
            placeholder: "Example: PAYMENT_DUE_REMINDER"
          }),
          field("subject", "Subject", "text", {
            required: true,
            placeholder: "Enter the message subject",
            span: 2
          }),
          field("schedule", "Schedule", "select", {
            required: true,
            options: ["On demand", "Strategy controlled", "Daily", "Weekly"]
          }),
          field("status", "Status", "select", {
            required: true,
            options: ["Active", "Draft", "Inactive"]
          }),
          field("description", "Template Description", "textarea", {
            required: true,
            placeholder: "Describe when this template should be used",
            span: 2
          }),
          field("body", "Template Body", "richtext", {
            required: true,
            placeholder: "Compose the customer message using available placeholders",
            span: 2
          })
        ]
      },
      rowActions: [
        action("preview", "Preview", "secondary"),
        action("edit", "Edit", "primary"),
        action("duplicate", "Duplicate", "secondary"),
        action("toggle-status", "Activate / Deactivate", "secondary"),
        action("delete", "Delete", "danger", {
          confirmTitle: "Delete template?",
          confirmBody: "This removes the dummy template from Template Master. Strategies already using it remain unchanged in this prototype."
        })
      ],
      customBlocks: [
        {
          id: "template-preview",
          type: "dialog",
          title: "Template Preview",
          triggerAction: "preview",
          fields: [
            field("previewRecipient", "Preview Recipient", "email", { placeholder: "customer@example.com" }),
            field("previewData", "Sample Invoice", "select", { options: ["INV-2026-1042", "INV-2026-1038"] })
          ],
          actions: [
            action("close", "Close", "secondary"),
            action("send-preview", "Generate Preview", "primary")
          ]
        },
        {
          id: "template-placeholders",
          type: "info",
          title: "Available Placeholders",
          items: ["{{CustomerName}}", "{{InvoiceNo}}", "{{InvoiceDate}}", "{{DueDate}}", "{{OutstandingAmount}}"]
        }
      ],
      emptyMessage: "No communication templates match the selected filters."
    },

    "smtp-setup": {
      id: "smtp-setup",
      title: "Communication Setup",
      description: "Configure message templates, sender infrastructure, and outbound accounts.",
      sectionTitle: "Email Sender SMTP Setup",
      tabs: communicationTabs,
      columns: [
        { key: "name", label: "SMTP Name" },
        { key: "provider", label: "Provider" },
        { key: "host", label: "Host" },
        { key: "port", label: "Port", type: "number" },
        { key: "username", label: "Username" },
        { key: "security", label: "Security" },
        { key: "status", label: "Status", type: "status" }
      ],
      seedRows: [
        {
          id: "smtp-001",
          name: "TestClient Microsoft 365",
          provider: "Microsoft Exchange",
          host: "smtp.office365.com",
          port: 587,
          username: "collections@testclient.example",
          security: "STARTTLS",
          status: "Active",
          password: "••••••••••••"
        },
        {
          id: "smtp-002",
          name: "System Generated Mail",
          provider: "SMTP",
          host: "smtp.testclient.example",
          port: 465,
          username: "no-reply@testclient.example",
          security: "SSL/TLS",
          status: "Inactive",
          password: "••••••••••••"
        }
      ],
      searchPlaceholder: "Search SMTP name, provider, host, or username",
      filters: [
        field("provider", "Provider", "select", { options: ["All", "SMTP", "Microsoft Exchange"] }),
        field("status", "Status", "select", { options: ["All", "Active", "Inactive"] })
      ],
      create: {
        label: "Add SMTP Setup",
        title: "Add Email Sender SMTP Setup",
        fields: [
          field("name", "SMTP Name", "text", { required: true, placeholder: "Enter a recognisable setup name" }),
          field("provider", "Provider", "select", { required: true, options: ["SMTP", "Microsoft Exchange"] }),
          field("host", "SMTP Host", "text", {
            required: true,
            placeholder: "smtp.example.com",
            dependsOn: { key: "provider", value: "SMTP" }
          }),
          field("port", "Port", "number", {
            required: true,
            placeholder: "587",
            dependsOn: { key: "provider", value: "SMTP" }
          }),
          field("username", "Username / Email", "email", { required: true, placeholder: "sender@example.com" }),
          field("password", "Password / App Password", "password", { required: true, placeholder: "Enter credential" }),
          field("security", "Connection Security", "select", {
            required: true,
            options: ["STARTTLS", "SSL/TLS", "None"],
            dependsOn: { key: "provider", value: "SMTP" }
          }),
          field("tenantId", "Tenant ID", "text", {
            placeholder: "Microsoft Entra tenant ID",
            dependsOn: { key: "provider", value: "Microsoft Exchange" }
          }),
          field("clientId", "Client ID", "text", {
            placeholder: "Microsoft Entra application ID",
            dependsOn: { key: "provider", value: "Microsoft Exchange" }
          }),
          field("clientSecret", "Client Secret", "password", {
            placeholder: "Enter client secret",
            dependsOn: { key: "provider", value: "Microsoft Exchange" }
          }),
          field("status", "Status", "toggle", { required: true })
        ]
      },
      rowActions: [
        action("edit", "Edit", "primary"),
        action("test-connection", "Test Connection", "secondary"),
        action("toggle-status", "Activate / Deactivate", "secondary"),
        action("delete", "Delete", "danger", {
          confirmTitle: "Delete SMTP setup?",
          confirmBody: "Sender accounts linked to this dummy setup will need another SMTP configuration."
        })
      ],
      customBlocks: [
        {
          id: "smtp-test",
          type: "dialog",
          title: "Test SMTP Connection",
          triggerAction: "test-connection",
          description: "Run a simulated connection test without sending email or transmitting credentials.",
          fields: [
            field("testRecipient", "Test Recipient", "email", { required: true, placeholder: "admin@testclient.example" })
          ],
          actions: [
            action("cancel", "Cancel", "secondary"),
            action("run-test", "Run Dummy Test", "primary")
          ],
          successMessage: "Connection authenticated successfully. No message was sent."
        },
        {
          id: "credential-notice",
          type: "notice",
          tone: "info",
          title: "Credentials are masked",
          description: "This design shell never stores or submits real SMTP passwords, app passwords, or client secrets."
        }
      ],
      emptyMessage: "No SMTP configurations have been added."
    },

    "sender-account": {
      id: "sender-account",
      title: "Communication Setup",
      description: "Configure message templates, sender infrastructure, and outbound accounts.",
      sectionTitle: "Email Sender Account Setup",
      tabs: communicationTabs,
      columns: [
        { key: "accountName", label: "Account Name" },
        { key: "accountType", label: "Account Type" },
        { key: "senderName", label: "Sender Name" },
        { key: "senderEmail", label: "Sender Email" },
        { key: "smtpSetup", label: "SMTP Setup" },
        { key: "isDefault", label: "Default", type: "boolean" },
        { key: "status", label: "Status", type: "status" }
      ],
      seedRows: [
        {
          id: "sender-001",
          accountName: "Primary Collections",
          accountType: "System Generated",
          senderName: "TestClient Collections",
          senderEmail: "collections@testclient.example",
          smtpSetup: "TestClient Microsoft 365",
          isDefault: true,
          status: "Active"
        },
        {
          id: "sender-002",
          accountName: "Payment Advice Listener",
          accountType: "Listener",
          senderName: "Accounts Receivable",
          senderEmail: "ar@testclient.example",
          smtpSetup: "TestClient Microsoft 365",
          isDefault: false,
          status: "Active"
        }
      ],
      searchPlaceholder: "Search account, sender email, or SMTP setup",
      filters: [
        field("accountType", "Account Type", "select", { options: ["All", "System Generated", "Listener"] }),
        field("status", "Status", "select", { options: ["All", "Active", "Inactive"] })
      ],
      create: {
        label: "Add Sender Account",
        title: "Add Email Sender Account",
        fields: [
          field("accountName", "Account Name", "text", { required: true, placeholder: "Example: Primary Collections" }),
          field("accountType", "Account Type", "select", { required: true, options: ["System Generated", "Listener"] }),
          field("senderName", "Sender Display Name", "text", { required: true, placeholder: "Name shown to recipients" }),
          field("senderEmail", "Sender Email Address", "email", { required: true, placeholder: "sender@example.com" }),
          field("smtpSetup", "SMTP Setup", "select", {
            required: true,
            options: ["TestClient Microsoft 365", "System Generated Mail"]
          }),
          field("replyTo", "Reply-to Address", "email", { placeholder: "reply@example.com" }),
          field("listenerFolder", "Listener Folder", "text", {
            placeholder: "Inbox/Payment Advice",
            dependsOn: { key: "accountType", value: "Listener" }
          }),
          field("isDefault", "Set as Default Sender", "checkbox"),
          field("status", "Active", "toggle", { required: true })
        ]
      },
      rowActions: [
        action("edit", "Edit", "primary"),
        action("set-default", "Set as Default", "secondary"),
        action("test-account", "Send Test", "secondary"),
        action("toggle-status", "Activate / Deactivate", "secondary"),
        action("delete", "Delete", "danger", {
          confirmTitle: "Delete sender account?",
          confirmBody: "This removes the dummy sender account. Templates and strategies are not changed."
        })
      ],
      customBlocks: [
        {
          id: "sender-test",
          type: "dialog",
          title: "Send Test Email",
          triggerAction: "test-account",
          fields: [
            field("recipient", "Recipient Email", "email", { required: true, placeholder: "admin@testclient.example" }),
            field("subject", "Subject", "text", { required: true, placeholder: "TestClient sender verification" })
          ],
          actions: [
            action("cancel", "Cancel", "secondary"),
            action("send-test", "Simulate Send", "primary")
          ]
        }
      ],
      emptyMessage: "No sender accounts match the selected filters."
    },

    "strategy-manager": {
      id: "strategy-manager",
      title: "Manage Collection Strategies",
      description: "Set the target population first, then attach template-driven reminder rules.",
      sectionTitle: "Strategies",
      tabs: [{ label: "Strategy Manager", module: "strategy-manager" }],
      columns: [
        { key: "strategyName", label: "Strategy Name" },
        { key: "status", label: "Status", type: "status" },
        { key: "target", label: "Target" },
        { key: "selectedRecords", label: "Selected Records", type: "number" },
        { key: "templates", label: "Templates", type: "chips" }
      ],
      seedRows: [
        {
          id: "strategy-001",
          strategyName: "Overdue Enterprise Follow-up",
          status: "Active",
          target: "Selected Customers",
          selectedRecords: 18,
          templates: ["Reminder for Payment Due", "Pending Payments"],
          reminderType: "Post Due",
          createdBy: "admin TestClient",
          nextRun: "31 Jul 2026, 09:00"
        },
        {
          id: "strategy-002",
          strategyName: "Upcoming Due Date Reminder",
          status: "Paused",
          target: "All Invoices",
          selectedRecords: 246,
          templates: ["Reminder for Payment Due"],
          reminderType: "PreDue",
          createdBy: "admin TestClient",
          nextRun: "Paused"
        },
        {
          id: "strategy-003",
          strategyName: "Missed PTP Escalation",
          status: "Draft",
          target: "Selected Invoices",
          selectedRecords: 12,
          templates: ["PTP Missed Mail"],
          reminderType: "Post Due",
          createdBy: "admin TestClient",
          nextRun: "Not scheduled"
        }
      ],
      searchPlaceholder: "Search strategy name, target, or template",
      filters: [
        field("status", "Status", "select", { options: ["All", "Active", "Paused", "Draft"] }),
        field("target", "Target", "select", {
          options: ["All", "All Customers", "Selected Customers", "All Invoices", "Selected Invoices"]
        }),
        field("reminderType", "Reminder Type", "select", { options: ["All", "PreDue", "Post Due", "Both"] })
      ],
      create: {
        label: "Create Strategy",
        title: "Create Collection Strategy",
        fields: [
          field("strategyName", "Strategy Name", "text", {
            required: true,
            placeholder: "Enter a unique strategy name",
            span: 2
          }),
          field("reminderType", "Reminder Type", "select", {
            required: true,
            options: ["PreDue", "Post Due", "Both"]
          }),
          field("active", "Active", "toggle"),
          field("targetEntity", "Target Entity", "select", {
            required: true,
            options: ["Customer", "Invoice"]
          }),
          field("targetScope", "Target Scope", "select", {
            required: true,
            options: ["All", "Selected"]
          }),
          field("selectedCustomers", "Select Customers", "multiselect", {
            options: ["CUST-1001 · Apex Retail", "CUST-1014 · Northstar Industries", "CUST-1028 · Meridian Healthcare"],
            dependsOn: { key: "targetEntity", value: "Customer", and: { key: "targetScope", value: "Selected" } },
            span: 2
          }),
          field("selectedInvoices", "Select Invoices", "multiselect", {
            options: ["INV-2026-1042", "INV-2026-1038", "INV-2026-1029"],
            dependsOn: { key: "targetEntity", value: "Invoice", and: { key: "targetScope", value: "Selected" } },
            span: 2
          }),
          field("excludedRecords", "Exclude Records", "multiselect", {
            placeholder: "Search customers or invoices to exclude",
            span: 2
          }),
          field("template", "Email Template", "select", {
            required: true,
            options: [
              "Acknowledgement of Invoice Receipt",
              "Cheque Bounce",
              "New Invoice - Existing Customer",
              "New Invoice - No Outstanding",
              "Pending Payments",
              "PTP Confirmation Mail",
              "PTP Missed Mail",
              "Reminder for Payment Due",
              "Request for Payment Advice or Details"
            ],
            span: 2
          }),
          field("notificationMode", "Notification Mode", "select", {
            required: true,
            options: ["Custom", "Ongoing"]
          }),
          field("keyAccountFilter", "Key Account Filter", "select", {
            required: true,
            options: ["All", "Yes", "No"]
          }),
          field("trigger", "Reminder Trigger", "select", {
            required: true,
            options: [
              "Days Before Due Date",
              "Days After Due Date",
              "Days After Cheque Bounced",
              "Days After Invoice And Document Uploaded",
              "Days After PTP Date",
              "Days Before PTP Date",
              "Days After Collected / Part Collected",
              "Days After New Invoice Is Uploaded"
            ],
            dependsOn: { key: "notificationMode", value: "Custom" }
          }),
          field("triggerDays", "Number of Days", "number", {
            required: true,
            placeholder: "Example: 3"
          }),
          field("repeatGap", "Repeat Every (Days)", "number", {
            placeholder: "Example: 7",
            dependsOn: { key: "notificationMode", value: "Ongoing" }
          }),
          field("senderAccount", "Email Sender", "select", {
            required: true,
            options: ["Primary Collections", "Payment Advice Listener"]
          }),
          field("broadStatus", "Broad Status", "multiselect", {
            options: ["Open", "Overdue", "Disputed", "Promise to Pay"]
          }),
          field("primaryStatus", "Primary Status", "multiselect", {
            options: ["Due", "Past Due", "Under Follow-up", "Dispute"]
          }),
          field("subStatus", "Sub Status", "multiselect", {
            options: ["Awaiting Advice", "Commitment Received", "Escalated", "Documents Pending"]
          }),
          field("ageingBuckets", "Ageing Buckets", "multiselect", {
            options: ["Not Due", "0–30", "31–60", "61–90", "91–180", "180+"],
            span: 2
          }),
          field("attachments", "Attachments", "multiselect", {
            options: ["Invoice", "Statement of Account", "GRN", "Purchase Order", "Payment Advice"],
            placeholder: "Search configured documents",
            span: 2
          })
        ]
      },
      rowActions: [
        action("preview", "Preview", "secondary"),
        action("edit", "Edit", "primary"),
        action("pause-resume", "Pause / Resume", "warning", {
          confirmTitle: "Change strategy status?",
          confirmBody: "Paused strategies stop future dummy reminders. Resuming restores the displayed schedule."
        }),
        action("delete", "Delete", "danger", {
          confirmTitle: "Delete strategy?",
          confirmBody: "This permanently removes the selected dummy strategy and its future reminder schedule."
        })
      ],
      customBlocks: [
        {
          id: "strategy-wizard",
          type: "wizard",
          title: "Create Collection Strategy",
          triggerAction: "create",
          steps: [
            { id: "basics", label: "Basics & Target" },
            { id: "template", label: "Template & Reminder" },
            { id: "filters", label: "Invoice Filters" },
            { id: "attachments", label: "Attachments" },
            { id: "review", label: "Review & Save" }
          ],
          targetNotices: {
            allCustomers: "All current and future customers are included unless specifically excluded.",
            allInvoices: "All current and future invoices are included unless specifically excluded."
          }
        },
        {
          id: "strategy-preview",
          type: "dialog",
          title: "Strategy Preview",
          triggerAction: "preview",
          sections: [
            "Target summary",
            "Selected templates and sender",
            "Reminder schedule",
            "Status, ageing and key-account filters",
            "Attachments",
            "Next scheduled activity"
          ],
          actions: [
            action("close", "Close", "secondary"),
            action("edit", "Edit Strategy", "primary")
          ]
        },
        {
          id: "strategy-history",
          type: "activity",
          title: "Recent Strategy Activity",
          items: [
            { title: "Overdue Enterprise Follow-up executed", meta: "29 Jul 2026, 09:00 · 16 reminders queued" },
            { title: "Upcoming Due Date Reminder paused", meta: "28 Jul 2026, 16:42 · admin TestClient" },
            { title: "Missed PTP Escalation saved as draft", meta: "27 Jul 2026, 11:18 · admin TestClient" }
          ]
        }
      ],
      emptyMessage: "No collection strategies match the selected filters."
    },

    "invoice-upload": {
      id: "invoice-upload",
      title: "Invoice Master",
      description: "Upload invoice transactions, inspect validation results, and review prior upload batches.",
      sectionTitle: "Invoice Upload",
      tabs: invoiceTabs,
      columns: uploadResultColumns,
      seedRows: [
        {
          id: "inv-upload-001",
          fileName: "TestClient_Invoices_July_2026.xlsx",
          company: "TestClient Pvt Ltd",
          branch: "Gurugram",
          status: "Completed",
          uploadedAt: "30 Jul 2026, 10:22",
          total: 128,
          success: 124,
          rejected: 4,
          progress: 100
        },
        {
          id: "inv-upload-002",
          fileName: "TestClient_Invoices_Adjustment.xlsx",
          company: "TestClient Pvt Ltd",
          branch: "Mumbai",
          status: "Completed",
          uploadedAt: "28 Jul 2026, 15:46",
          total: 36,
          success: 36,
          rejected: 0,
          progress: 100
        }
      ],
      searchPlaceholder: "Search file name, company, branch, or status",
      filters: [
        field("company", "Company", "select", { options: ["All", "TestClient Pvt Ltd"] }),
        field("status", "Status", "select", { options: ["All", "Validating", "Processing", "Completed", "Rejected"] }),
        field("uploadedAt", "Upload Date", "date")
      ],
      create: {
        label: "Create New",
        title: "Create Invoice",
        editTitle: "Edit Invoice",
        fields: [
          field("company", "Company", "select", {
            required: true,
            options: ["TestClient Pvt Ltd"]
          }),
          field("branch", "Branch", "select", {
            required: true,
            options: ["Gurugram", "Mumbai", "Bengaluru"]
          }),
          field("invoiceNo", "Invoice Number", "text", {
            required: true,
            placeholder: "Enter invoice number"
          }),
          field("customerCode", "Customer Code", "text", {
            required: true,
            placeholder: "Enter customer code"
          }),
          field("invoiceDate", "Invoice Date", "date", { required: true }),
          field("dueDate", "Due Date", "date", { required: true }),
          field("invoiceValue", "Invoice Amount", "number", {
            required: true,
            placeholder: "0.00"
          }),
          field("currency", "Currency", "select", {
            required: true,
            options: ["INR", "USD", "EUR"]
          })
        ]
      },
      upload: {
        accept: ".xlsx,.xls,.csv",
        multiple: false,
        fields: [
          field("company", "Company", "select", { required: true, options: ["TestClient Pvt Ltd"] }),
          field("branch", "Branch", "select", { required: true, options: ["All Branches", "Gurugram", "Mumbai", "Bengaluru"] }),
          field("invoiceType", "Invoice Type", "select", { required: true, options: ["Standard Invoice", "Debit Note"] })
        ],
        buttons: [
          action("download-template", "Download Template", "secondary"),
          action("clear-upload", "Clear", "secondary"),
          action("upload", "Upload", "primary")
        ],
        resultColumns: uploadResultColumns
      },
      rowActions: [
        action("view-results", "View Results", "secondary"),
        action("download-rejections", "Download Rejections", "secondary")
      ],
      customBlocks: [
        {
          id: "invoice-upload-results",
          type: "drawer",
          title: "Invoice Upload Results",
          triggerAction: "view-results",
          summaryCards: ["Total Rows", "Successful", "Rejected"],
          columns: [
            { key: "rowNumber", label: "Row" },
            { key: "invoiceNo", label: "Invoice No." },
            { key: "customerCode", label: "Customer Code" },
            { key: "status", label: "Status", type: "status" },
            { key: "message", label: "Validation Message" }
          ]
        },
        {
          id: "invoice-upload-states",
          type: "upload-status",
          states: ["Selected", "Validating", "Processing", "Completed", "Completed with Rejections"]
        }
      ],
      emptyMessage: "No invoice upload batches match the selected filters."
    },

    "invoice-reallocation": {
      id: "invoice-reallocation",
      title: "Invoice Master",
      description: "Find invoices and move their collection ownership within the operational hierarchy.",
      sectionTitle: "Invoice Reallocation",
      tabs: invoiceTabs,
      columns: [
        { key: "selected", label: "Select", type: "checkbox" },
        { key: "customerCode", label: "Customer Code" },
        { key: "customerName", label: "Customer Name" },
        { key: "invoiceNo", label: "Invoice No." },
        { key: "invoiceValue", label: "Invoice Value", type: "currency" },
        { key: "outstanding", label: "Outstanding", type: "currency" },
        { key: "assignee", label: "Current Assignee" },
        { key: "manager", label: "Manager" }
      ],
      seedRows: [
        {
          id: "invoice-1042",
          selected: false,
          customerCode: "CUST-1001",
          customerName: "Apex Retail Pvt Ltd",
          invoiceNo: "INV-2026-1042",
          invoiceValue: 842500,
          outstanding: 842500,
          assignee: "Neha Sharma",
          manager: "Rahul Mehta",
          branch: "Gurugram",
          status: "Overdue"
        },
        {
          id: "invoice-1038",
          selected: false,
          customerCode: "CUST-1014",
          customerName: "Northstar Industries",
          invoiceNo: "INV-2026-1038",
          invoiceValue: 415000,
          outstanding: 215000,
          assignee: "Aman Verma",
          manager: "Rahul Mehta",
          branch: "Mumbai",
          status: "Part Collected"
        },
        {
          id: "invoice-1029",
          selected: false,
          customerCode: "CUST-1028",
          customerName: "Meridian Healthcare",
          invoiceNo: "INV-2026-1029",
          invoiceValue: 1275000,
          outstanding: 1275000,
          assignee: "Priya Singh",
          manager: "Kavita Rao",
          branch: "Bengaluru",
          status: "Open"
        }
      ],
      searchPlaceholder: "Search customer code, customer name, or invoice number",
      filters: [
        field("branch", "Branch", "select", { options: ["All", "Gurugram", "Mumbai", "Bengaluru"] }),
        field("status", "Invoice Status", "select", { options: ["All", "Open", "Overdue", "Part Collected"] }),
        field("assignee", "Current Assignee", "select", { options: ["All", "Neha Sharma", "Aman Verma", "Priya Singh"] })
      ],
      rowActions: [
        action("select", "Select", "secondary"),
        action("view-invoice", "View Invoice", "secondary")
      ],
      customBlocks: [
        {
          id: "reallocation-toolbar",
          type: "bulk-action",
          title: "Reallocate Selected Invoices",
          requiresSelection: true,
          fields: [
            field("roleLevel", "Reallocate To Role", "select", {
              required: true,
              options: ["Agent", "Manager", "Key Account Manager", "Key Account Supervisor"]
            }),
            field("newAssignee", "New Assignee", "select", {
              required: true,
              options: ["Neha Sharma", "Aman Verma", "Priya Singh", "Rohit Kapoor"]
            }),
            field("reason", "Reason", "textarea", {
              required: true,
              placeholder: "Enter the reason for reallocation",
              span: 2
            })
          ],
          actions: [action("reallocate", "Reallocate", "primary")]
        },
        {
          id: "reallocation-confirmation",
          type: "confirm",
          triggerAction: "reallocate",
          title: "Confirm invoice reallocation",
          body: "The selected dummy invoices will move to the chosen assignee. Invoice amounts and statuses will remain unchanged.",
          confirmLabel: "Confirm Reallocation",
          cancelLabel: "Cancel"
        }
      ],
      emptyMessage: "No invoices match the reallocation search."
    },

    "invoice-deletion": {
      id: "invoice-deletion",
      title: "Invoice Master",
      description: "Locate uploaded invoices and remove dummy records with an auditable reason.",
      sectionTitle: "Invoice Deletion",
      tabs: invoiceTabs,
      columns: [
        { key: "selected", label: "Select", type: "checkbox" },
        { key: "invoiceNo", label: "Invoice No." },
        { key: "customer", label: "Customer" },
        { key: "invoiceDate", label: "Invoice Date", type: "date" },
        { key: "invoiceValue", label: "Invoice Value", type: "currency" },
        { key: "outstanding", label: "Outstanding", type: "currency" },
        { key: "status", label: "Status", type: "status" }
      ],
      seedRows: [
        {
          id: "delete-inv-1017",
          selected: false,
          invoiceNo: "INV-2026-1017",
          customer: "Apex Retail Pvt Ltd",
          invoiceDate: "18 Jul 2026",
          invoiceValue: 126500,
          outstanding: 126500,
          status: "Open",
          branch: "Gurugram"
        },
        {
          id: "delete-inv-1009",
          selected: false,
          invoiceNo: "INV-2026-1009",
          customer: "Northstar Industries",
          invoiceDate: "11 Jul 2026",
          invoiceValue: 238750,
          outstanding: 238750,
          status: "Open",
          branch: "Mumbai"
        }
      ],
      searchPlaceholder: "Search invoice number or customer",
      filters: [
        field("branch", "Branch", "select", { options: ["All", "Gurugram", "Mumbai", "Bengaluru"] }),
        field("invoiceDateFrom", "Invoice Date From", "date"),
        field("invoiceDateTo", "Invoice Date To", "date")
      ],
      rowActions: [
        action("select", "Select", "secondary"),
        action("view-invoice", "View Invoice", "secondary")
      ],
      customBlocks: [
        {
          id: "invoice-delete-toolbar",
          type: "bulk-action",
          title: "Delete Selected Invoices",
          requiresSelection: true,
          fields: [
            field("reasonCode", "Deletion Reason", "select", {
              required: true,
              options: ["Duplicate Upload", "Incorrect Customer", "Incorrect Invoice Data", "Cancelled Invoice", "Other"]
            }),
            field("reason", "Reason Details", "textarea", {
              required: true,
              placeholder: "Explain why these invoice records should be removed",
              span: 2
            })
          ],
          actions: [action("delete-selected", "Delete Selected", "danger")]
        },
        {
          id: "invoice-deletion-confirmation",
          type: "confirm",
          triggerAction: "delete-selected",
          title: "Delete selected invoices?",
          body: "This removes only the selected dummy invoice records. The action will appear in the local Audit Trail.",
          confirmLabel: "Delete Invoices",
          cancelLabel: "Cancel",
          acknowledgement: "I understand that the selected dummy records will be removed."
        }
      ],
      emptyMessage: "No invoices are available for deletion."
    },

    "change-password": {
      id: "change-password",
      title: "Admin Change Password",
      description: "Reset a TestClient user's password without exposing or storing a real credential.",
      sectionTitle: "Update User Password",
      tabs: [{ label: "Change Password", module: "change-password" }],
      columns: [
        { key: "name", label: "User" },
        { key: "username", label: "Username" },
        { key: "role", label: "Role" },
        { key: "branch", label: "Branch" },
        { key: "status", label: "Status", type: "status" },
        { key: "lastUpdated", label: "Password Last Updated", type: "datetime" }
      ],
      seedRows: [
        {
          id: "user-001",
          name: "Neha Sharma",
          username: "neha.sharma",
          role: "Agent",
          branch: "Gurugram",
          status: "Active",
          lastUpdated: "14 Jul 2026"
        },
        {
          id: "user-002",
          name: "Rahul Mehta",
          username: "rahul.mehta",
          role: "Manager",
          branch: "Gurugram",
          status: "Active",
          lastUpdated: "02 Jul 2026"
        }
      ],
      searchPlaceholder: "Search user name, username, role, or branch",
      filters: [
        field("role", "Role", "select", { options: ["All", "Agent", "Manager", "Key Account Manager"] }),
        field("branch", "Branch", "select", { options: ["All", "Gurugram", "Mumbai", "Bengaluru"] }),
        field("status", "Status", "select", { options: ["All", "Active", "Suspended"] })
      ],
      create: {
        label: "Reset Password",
        title: "Reset User Password",
        fields: [
          field("userId", "Select User", "select", {
            required: true,
            options: ["Neha Sharma · Agent", "Rahul Mehta · Manager", "Priya Singh · Agent"],
            span: 2
          }),
          field("newPassword", "New Password", "password", {
            required: true,
            placeholder: "Enter a strong password"
          }),
          field("confirmPassword", "Confirm New Password", "password", {
            required: true,
            placeholder: "Re-enter the new password"
          }),
          field("forceChange", "Require user to change password at next sign-in", "checkbox", { span: 2 }),
          field("notifyUser", "Notify user of the administrative reset", "checkbox", { span: 2 })
        ]
      },
      rowActions: [
        action("reset-password", "Reset Password", "primary")
      ],
      settingsSections: [
        {
          title: "Password Requirements",
          description: "The dummy form validates the same visible password rules before showing success.",
          fields: [
            field("minimumLength", "Minimum 8 characters", "checklist"),
            field("uppercase", "At least one uppercase letter", "checklist"),
            field("lowercase", "At least one lowercase letter", "checklist"),
            field("number", "At least one number", "checklist"),
            field("special", "At least one special character", "checklist")
          ]
        }
      ],
      customBlocks: [
        {
          id: "password-success",
          type: "dialog",
          title: "Password Updated",
          triggerAction: "submit",
          description: "The dummy password has been updated for the selected user. No real account credential was changed.",
          actions: [action("close", "Done", "primary")]
        }
      ],
      emptyMessage: "No users match the password reset search."
    },

    "client-master": {
      id: "client-master",
      title: "Client Master",
      description: "Manage client identity, subscriptions, administrator details, and display text setup.",
      sectionTitle: "Client Accounts",
      tabs: [
        { label: "Client Accounts", module: "client-master" },
        { label: "Text Setup", module: "client-master#text-setup" }
      ],
      columns: [
        { key: "clientName", label: "Client" },
        { key: "clientCode", label: "Client Code" },
        { key: "subscription", label: "Subscription" },
        { key: "adminName", label: "Admin" },
        { key: "adminEmail", label: "Admin Email" },
        { key: "createdOn", label: "Created On", type: "date" },
        { key: "status", label: "Status", type: "status" }
      ],
      seedRows: [
        {
          id: "client-001",
          clientName: "TestClient Pvt Ltd",
          clientCode: "TESTCLIENT",
          subscription: "Enterprise",
          adminName: "admin TestClient",
          adminEmail: "admin@testclient.example",
          createdOn: "12 Jan 2025",
          status: "Active",
          country: "India",
          timezone: "Asia/Kolkata"
        },
        {
          id: "client-002",
          clientName: "Demo Manufacturing Ltd",
          clientCode: "DEMOMFG",
          subscription: "Professional",
          adminName: "Demo Administrator",
          adminEmail: "admin@demomfg.example",
          createdOn: "06 Mar 2026",
          status: "Trial",
          country: "India",
          timezone: "Asia/Kolkata"
        }
      ],
      searchPlaceholder: "Search client, code, administrator, or subscription",
      filters: [
        field("subscription", "Subscription", "select", { options: ["All", "Enterprise", "Professional", "Starter"] }),
        field("status", "Status", "select", { options: ["All", "Active", "Trial", "Suspended", "Inactive"] })
      ],
      create: {
        label: "Create Client",
        title: "Create Client Account",
        fields: [
          field("clientName", "Client Name", "text", { required: true, placeholder: "Enter legal client name", span: 2 }),
          field("clientCode", "Client Code", "text", { required: true, placeholder: "Example: TESTCLIENT" }),
          field("subscription", "Subscription", "select", {
            required: true,
            options: ["Enterprise", "Professional", "Starter"]
          }),
          field("adminName", "Client Administrator", "text", { required: true, placeholder: "Administrator name" }),
          field("adminEmail", "Administrator Email", "email", { required: true, placeholder: "admin@example.com" }),
          field("country", "Country", "select", { required: true, options: ["India", "Singapore", "United Arab Emirates"] }),
          field("timezone", "Timezone", "select", { required: true, options: ["Asia/Kolkata", "Asia/Singapore", "Asia/Dubai"] }),
          field("subscriptionStart", "Subscription Start", "date", { required: true }),
          field("subscriptionEnd", "Subscription End", "date", { required: true }),
          field("status", "Status", "select", { required: true, options: ["Active", "Trial", "Suspended", "Inactive"] }),
          field("notes", "Notes", "textarea", { placeholder: "Optional implementation notes", span: 2 })
        ]
      },
      rowActions: [
        action("view", "View", "secondary"),
        action("edit", "Edit", "primary"),
        action("manage-text", "Text Setup", "secondary"),
        action("toggle-status", "Suspend / Reactivate", "warning", {
          confirmTitle: "Change client status?",
          confirmBody: "This changes only the visible dummy client status."
        })
      ],
      settingsSections: [
        {
          id: "text-setup",
          title: "Client Text Setup",
          description: "Override platform labels for the selected client while retaining the default fallback.",
          fields: [
            field("customerLabel", "Customer Label", "text", { placeholder: "Customer" }),
            field("invoiceLabel", "Invoice Label", "text", { placeholder: "Invoice" }),
            field("agentLabel", "Agent Label", "text", { placeholder: "Agent" }),
            field("managerLabel", "Manager Label", "text", { placeholder: "Manager" }),
            field("collectionLabel", "Collection Label", "text", { placeholder: "Collection" }),
            field("resetText", "Restore default labels", "button")
          ]
        }
      ],
      customBlocks: [
        {
          id: "client-details",
          type: "drawer",
          title: "Client Details",
          triggerAction: "view",
          sections: ["Client identity", "Administrator", "Subscription", "Regional settings", "Enabled modules"]
        }
      ],
      emptyMessage: "No client accounts match the selected filters."
    },

    "audit-retention": {
      id: "audit-retention",
      title: "Audit Retention & Purge",
      description: "Set retention periods for immutable audit records and simulate governed purge requests.",
      sectionTitle: "Retention Policy",
      tabs: [{ label: "Retention Policy", module: "audit-retention" }],
      columns: [
        { key: "entityType", label: "Entity Type" },
        { key: "retentionPeriod", label: "Retention Period" },
        { key: "recordsEligible", label: "Eligible Records", type: "number" },
        { key: "lastUpdated", label: "Last Updated", type: "datetime" },
        { key: "updatedBy", label: "Updated By" },
        { key: "status", label: "Status", type: "status" }
      ],
      seedRows: [
        {
          id: "retention-001",
          entityType: "Invoice",
          retentionPeriod: "84 months",
          recordsEligible: 128,
          lastUpdated: "22 Jul 2026, 14:05",
          updatedBy: "admin TestClient",
          status: "Active"
        },
        {
          id: "retention-002",
          entityType: "Customer",
          retentionPeriod: "60 months",
          recordsEligible: 14,
          lastUpdated: "22 Jul 2026, 14:05",
          updatedBy: "admin TestClient",
          status: "Active"
        },
        {
          id: "retention-003",
          entityType: "User",
          retentionPeriod: "36 months",
          recordsEligible: 0,
          lastUpdated: "19 Jul 2026, 11:32",
          updatedBy: "admin TestClient",
          status: "Active"
        }
      ],
      searchPlaceholder: "Search audited entity or updated by",
      filters: [
        field("entityType", "Entity Type", "select", {
          options: ["All", "Invoice", "Customer", "User", "Document", "Strategy", "Communication"]
        }),
        field("status", "Status", "select", { options: ["All", "Active", "Inactive"] })
      ],
      create: {
        label: "Add Retention Policy",
        title: "Add Retention Policy",
        fields: [
          field("entityType", "Entity Type", "select", {
            required: true,
            options: ["Invoice", "Customer", "User", "Document", "Strategy", "Communication"]
          }),
          field("retentionValue", "Retention Period", "number", { required: true, placeholder: "Example: 84" }),
          field("retentionUnit", "Period Unit", "select", { required: true, options: ["Months", "Years"] }),
          field("status", "Active", "toggle", { required: true }),
          field("reason", "Policy Note", "textarea", {
            required: true,
            placeholder: "Record the compliance basis for this retention period",
            span: 2
          })
        ]
      },
      rowActions: [
        action("edit", "Edit", "primary"),
        action("preview-purge", "Preview Purge", "secondary"),
        action("request-purge", "Purge Eligible Records", "danger", {
          confirmTitle: "Confirm dummy purge?",
          confirmBody: "The shell will simulate a purge result and log it locally. No production or source data will be deleted."
        })
      ],
      settingsSections: [
        {
          title: "Retention Guardrails",
          description: "Purge is available only after a preview and explicit confirmation.",
          fields: [
            field("previewRequired", "Require preview before purge", "checkbox"),
            field("recordReason", "Require purge reason", "checkbox"),
            field("auditPurge", "Create immutable purge audit event", "checkbox")
          ]
        }
      ],
      customBlocks: [
        {
          id: "purge-preview",
          type: "dialog",
          title: "Purge Preview",
          triggerAction: "preview-purge",
          summaryCards: ["Eligible Records", "Oldest Record", "Retention Cut-off"],
          columns: [
            { key: "recordId", label: "Record ID" },
            { key: "entity", label: "Entity" },
            { key: "createdAt", label: "Created At" },
            { key: "eligibleReason", label: "Eligibility" }
          ],
          actions: [
            action("close", "Close", "secondary"),
            action("request-purge", "Continue to Purge", "danger")
          ]
        },
        {
          id: "purge-confirmation",
          type: "confirm",
          triggerAction: "request-purge",
          title: "Purge eligible audit records?",
          body: "This is a dummy-only operation. The visible eligible count will become zero and a local Audit Trail event will be added.",
          acknowledgement: "I have reviewed the purge preview.",
          fields: [
            field("purgeReason", "Purge Reason", "textarea", {
              required: true,
              placeholder: "Enter the approved reason"
            })
          ],
          confirmLabel: "Simulate Purge",
          cancelLabel: "Cancel"
        }
      ],
      emptyMessage: "No retention policies match the selected filters."
    },

    "audit-trail": {
      id: "audit-trail",
      title: "Audit Trail",
      description: "Immutable record of who changed what, when, and from where across audited entities.",
      sectionTitle: "Audit Events",
      tabs: [{ label: "Audit Trail", module: "audit-trail" }],
      columns: [
        { key: "timestamp", label: "Timestamp", type: "datetime" },
        { key: "entityType", label: "Entity Type" },
        { key: "action", label: "Action", type: "status" },
        { key: "recordId", label: "Record ID" },
        { key: "changedBy", label: "Changed By" },
        { key: "sourceIp", label: "Source IP" },
        { key: "revision", label: "Revision", type: "number" }
      ],
      seedRows: [
        {
          id: "audit-001",
          timestamp: "30 Jul 2026, 11:48:16",
          entityType: "Strategy",
          action: "UPDATE",
          recordId: "strategy-001",
          changedBy: "admin TestClient",
          sourceIp: "10.24.8.16",
          revision: 7,
          changes: [
            { field: "status", before: "Paused", after: "Active" },
            { field: "nextRun", before: "—", after: "31 Jul 2026, 09:00" }
          ]
        },
        {
          id: "audit-002",
          timestamp: "30 Jul 2026, 10:22:03",
          entityType: "Invoice Upload",
          action: "CREATE",
          recordId: "inv-upload-001",
          changedBy: "admin TestClient",
          sourceIp: "10.24.8.16",
          revision: 1,
          changes: [{ field: "status", before: "—", after: "Completed with 4 rejections" }]
        },
        {
          id: "audit-003",
          timestamp: "29 Jul 2026, 16:35:41",
          entityType: "SMTP Setup",
          action: "UPDATE",
          recordId: "smtp-001",
          changedBy: "admin TestClient",
          sourceIp: "10.24.8.16",
          revision: 3,
          changes: [{ field: "security", before: "TLS", after: "STARTTLS" }]
        }
      ],
      searchPlaceholder: "Search record ID, changed by, source IP, or entity",
      filters: [
        field("entityType", "Entity Type", "select", {
          options: ["All", "Client", "Customer", "Invoice", "Invoice Upload", "Strategy", "SMTP Setup", "User"]
        }),
        field("action", "Action", "select", {
          options: ["All", "CREATE", "UPDATE", "DELETE", "LOGIN", "EXPORT", "PURGE"]
        }),
        field("recordId", "Record ID", "text", { placeholder: "Exact or partial ID" }),
        field("changedBy", "Changed By", "text", { placeholder: "User name or username" }),
        field("dateFrom", "From Date", "date"),
        field("dateTo", "To Date", "date")
      ],
      rowActions: [
        action("view-details", "View Changes", "secondary")
      ],
      customBlocks: [
        {
          id: "audit-toolbar",
          type: "toolbar",
          actions: [
            action("search-audit", "Search", "primary"),
            action("clear-audit-filters", "Clear Filters", "secondary"),
            action("export-csv", "Export CSV", "secondary")
          ],
          export: {
            fileName: "TestClient_Audit_Trail.csv",
            format: "csv",
            source: "filteredRows"
          }
        },
        {
          id: "audit-detail",
          type: "drawer",
          title: "Audit Event Details",
          triggerAction: "view-details",
          sections: ["Event metadata", "Changed fields", "Before and after values"],
          changeColumns: [
            { key: "field", label: "Field" },
            { key: "before", label: "Before" },
            { key: "after", label: "After" }
          ],
          actions: [action("close", "Close", "secondary")]
        }
      ],
      emptyMessage: "No audit events match the selected filters."
    },

    "help-support": {
      id: "help-support",
      title: "Help Center",
      description: "Search guidance, raise a support request, and follow TestClient ticket progress.",
      sectionTitle: "Help & Support",
      tabs: [
        { label: "Help Center", module: "help-support" },
        { label: "My Tickets", module: "help-support#tickets" },
        { label: "Feedback", module: "help-support#feedback" }
      ],
      columns: [
        { key: "ticketId", label: "Ticket ID" },
        { key: "title", label: "Title" },
        { key: "module", label: "Module" },
        { key: "priority", label: "Priority", type: "status" },
        { key: "status", label: "Status", type: "status" },
        { key: "updatedAt", label: "Last Updated", type: "datetime" }
      ],
      seedRows: [
        {
          id: "ticket-001",
          ticketId: "TKT-2026-184",
          title: "Four invoice rows rejected during upload",
          module: "Invoice & Billing",
          priority: "High",
          status: "In Progress",
          updatedAt: "30 Jul 2026, 11:05",
          description: "Rows were rejected due to missing customer codes.",
          conversation: [
            { author: "admin TestClient", at: "30 Jul 2026, 10:35", message: "Please help us verify the rejected rows." },
            { author: "Inebura Support", at: "30 Jul 2026, 11:05", message: "We are reviewing the validation report." }
          ]
        },
        {
          id: "ticket-002",
          ticketId: "TKT-2026-173",
          title: "Need an additional sender account",
          module: "Account & Users",
          priority: "Medium",
          status: "Open",
          updatedAt: "28 Jul 2026, 16:18",
          description: "Request for a dedicated payment-advice mailbox.",
          conversation: [
            { author: "admin TestClient", at: "28 Jul 2026, 16:18", message: "Please confirm the setup prerequisites." }
          ]
        },
        {
          id: "ticket-003",
          ticketId: "TKT-2026-151",
          title: "Audit export completed",
          module: "Reports",
          priority: "Low",
          status: "Closed",
          updatedAt: "24 Jul 2026, 12:42",
          description: "CSV export guidance was provided.",
          conversation: [
            { author: "Inebura Support", at: "24 Jul 2026, 12:42", message: "The export steps have been shared and confirmed." }
          ]
        }
      ],
      searchPlaceholder: "Search help articles or your ticket ID",
      filters: [
        field("status", "Ticket Status", "select", { options: ["All", "Open", "In Progress", "Closed"] }),
        field("priority", "Priority", "select", { options: ["All", "Low", "Medium", "High", "Critical"] }),
        field("module", "Module", "select", {
          options: ["All", "Dashboard", "Invoice & Billing", "Payments & Collections", "Documents & Files", "Account & Users", "Reports", "General / Other"]
        })
      ],
      create: {
        label: "Create Ticket",
        title: "Create Support Ticket",
        fields: [
          field("title", "Ticket Title", "text", {
            required: true,
            placeholder: "Briefly describe the issue",
            span: 2
          }),
          field("module", "Module", "select", {
            required: true,
            options: ["Dashboard", "Invoice & Billing", "Payments & Collections", "Documents & Files", "Account & Users", "Reports", "General / Other"]
          }),
          field("priority", "Priority", "select", {
            required: true,
            options: ["Low", "Medium", "High", "Critical"]
          }),
          field("description", "Description", "textarea", {
            required: true,
            placeholder: "Include what happened, what you expected, and any error message",
            span: 2
          }),
          field("attachment", "Attachment", "file", {
            accept: ".png,.jpg,.jpeg,.pdf,.txt,.csv,.xlsx",
            placeholder: "Attach an optional screenshot or report",
            span: 2
          })
        ]
      },
      rowActions: [
        action("view-ticket", "View Ticket", "primary")
      ],
      customBlocks: [
        {
          id: "help-search",
          type: "hero-search",
          title: "How can we help you?",
          placeholder: "Search invoice upload, user access, documents in limbo…"
        },
        {
          id: "help-articles",
          type: "cards",
          title: "Frequently Asked",
          items: [
            { title: "How to upload a new invoice", category: "Invoice & Billing", meta: "4 min read", icon: "bi-receipt" },
            { title: "What happens when a document enters Limbo?", category: "Documents & Files", meta: "2 min read", icon: "bi-file-earmark-x" },
            { title: "How to reset a user password", category: "Account & Users", meta: "2 min read", icon: "bi-key" },
            { title: "How to read an upload rejection file", category: "Invoice & Billing", meta: "3 min read", icon: "bi-filetype-csv" }
          ]
        },
        {
          id: "ticket-detail",
          type: "dialog",
          title: "Support Ticket",
          triggerAction: "view-ticket",
          sections: ["Ticket summary", "Conversation", "Attachments"],
          fields: [
            field("reply", "Add Reply", "textarea", { placeholder: "Type a dummy reply", span: 2 }),
            field("replyAttachment", "Attachment", "file", { accept: ".png,.jpg,.jpeg,.pdf,.txt,.csv,.xlsx" })
          ],
          actions: [
            action("close", "Close", "secondary"),
            action("submit-reply", "Send Reply", "primary")
          ]
        },
        {
          id: "feedback-form",
          type: "form",
          title: "Share Feedback",
          fields: [
            field("feedbackType", "Feedback Type", "select", {
              required: true,
              options: ["General", "Feature Request", "Bug Report", "Compliment"]
            }),
            field("feedbackModule", "Module", "select", {
              required: true,
              options: ["Dashboard", "Invoice & Billing", "Payments & Collections", "Documents & Files", "Account & Users", "Reports", "General / Other"]
            }),
            field("rating", "Rating", "rating", { required: true }),
            field("feedback", "Comments", "textarea", {
              required: true,
              placeholder: "Tell us what worked or what should improve",
              span: 2
            })
          ],
          actions: [action("submit-feedback", "Submit Feedback", "primary")]
        }
      ],
      emptyMessage: "No support tickets match the selected filters."
    }
  };

  window.IneburaAdminModules = Object.assign(window.IneburaAdminModules || {}, modules);
})();
