/* Reference contracts for Admin screens whose generic definitions diverged. */
(() => {
  "use strict";
  const modules = window.IneburaAdminModules || {};
  const field = (key, label, type = "text", extra = {}) => ({ key, label, type, ...extra });
  const action = (id, label, kind = "secondary", extra = {}) => ({ id, label, kind, ...extra });

  if (modules["template-master"]) Object.assign(modules["template-master"], {
    columns: [
      { key: "actions", label: "Actions", type: "actions" },
      { key: "eventType", label: "Event Type" },
      { key: "recipientRole", label: "Recipient Role" },
      { key: "communicationMode", label: "Comm. Mode" },
      { key: "code", label: "Code" },
      { key: "subject", label: "Subject" },
      { key: "schedule", label: "Schedule" },
      { key: "description", label: "Description" },
    ],
    actionsFirst: true,
    rowActions: [action("edit", "Edit", "edit")],
    create: {
      label: "Create New",
      title: "Create Template",
      editTitle: "Edit Template",
      submitLabel: "Create",
      editSubmitLabel: "Update",
      fields: [
        field("eventType", "Event Type", "search-select", { required: true, options: ["Acknowledgement of Invoice Receipt", "Cheque Bounce", "New Invoice - Existing Customer", "New Invoice - No Outstanding", "Pending Payments", "PTP Confirmation Mail", "PTP Missed Mail", "Reminder for Payment Due", "Request for Payment Advice or Details"] }),
        field("recipientRole", "Recipient Role", "search-select", { required: true, options: ["Customer", "Customer Contact", "Agent", "Manager", "KAM", "KAS"] }),
        field("communicationMode", "Comm. Mode", "search-select", { required: true, options: ["Email", "WhatsApp", "SMS"] }),
        field("schedule", "Schedule", "search-select", { required: true, options: ["On demand", "Strategy controlled", "Daily", "Weekly"] }),
        field("code", "Code", "text", { required: true, placeholder: "Enter template code" }),
        field("subject", "Subject Line", "text", { required: true, placeholder: "Enter subject" }),
        field("description", "Description", "textarea", { placeholder: "Enter template description", span: 2 }),
        field("body", "Template Content", "richtext", { required: true, placeholder: "Enter template content", maxLength: 4500 }),
        field("disabled", "Disabled", "toggle", { help: "Disable this template without deleting it.", span: 2 }),
      ],
    },
  });

  if (modules["invoice-reallocation"]) Object.assign(modules["invoice-reallocation"], {
    description: "Upload, reallocate, and manage invoices.",
    hideCreate: true,
    columns: [
      { key: "customerName", label: "Customer" },
      { key: "customerCode", label: "Customer Code" },
      { key: "invoiceNo", label: "Invoice No." },
      { key: "invoiceValue", label: "Invoice Value", type: "currency" },
      { key: "outstanding", label: "Total Outstanding", type: "currency" },
      { key: "assignee", label: "Assignee" },
      { key: "manager", label: "Manager" },
      { key: "kam", label: "KAM" },
      { key: "kas", label: "KAS" },
    ],
    rowActions: [action("reallocate", "Reallocate", "edit")],
    customBlocks: [],
    edit: {
      title: "Edit Invoice",
      editTitle: "Edit Invoice",
      editSubmitLabel: "Update",
      fields: [
        field("customerName", "Customer", "search-select", { required: true, disabled: true }),
        field("customerCode", "Customer Code", "search-select", { disabled: true }),
        field("pincode", "Pincode", "search-select", { disabled: true }),
        field("city", "City", "search-select", { required: true, disabled: true }),
        field("state", "State", "search-select", { disabled: true }),
        field("region", "Region", "search-select", { disabled: true }),
        field("assignee", "Assignee", "search-select", { required: true, options: ["Neha Sharma", "Aman Verma", "Priya Singh"] }),
        field("manager", "Manager", "search-select", { options: ["Rahul Mehta", "Kavita Rao"] }),
        field("kam", "KAM", "search-select", { options: ["KAM One", "KAM Two"] }),
        field("kas", "KAS", "search-select", { options: ["KAS One", "KAS Two"] }),
        field("invoiceNo", "Invoice No.", "text", { required: true, disabled: true }),
        field("invoiceDate", "Invoice Date", "text", { required: true, disabled: true }),
        field("creditPeriod", "Credit Period", "text", { disabled: true }),
        field("dueDate", "Invoice Due Date", "text", { disabled: true }),
        field("invoiceValue", "Invoice Value", "number", { required: true, disabled: true }),
        field("outstanding", "Total Outstanding", "number", { required: true, disabled: true }),
        field("taxValue", "Tax Value", "number", { disabled: true }),
        field("baseValue", "Base Value", "number", { disabled: true }),
        field("poNumber", "PO Number", "text", { disabled: true }),
        field("saleOrderNumber", "Sale Order Number", "text", { disabled: true }),
        field("industryType", "Industry Type", "search-select", { disabled: true }),
        field("keyAccount", "Key Account", "text", { disabled: true }),
        field("productCategory", "Product Category", "search-select", { disabled: true }),
        field("description", "Description", "textarea", { disabled: true }),
        field("handoverDate", "Invoice Handover Date", "text", { disabled: true }),
        field("billTo", "Bill To Address", "textarea", { disabled: true }),
        field("shipTo", "Ship To Address", "textarea", { disabled: true }),
      ],
    },
  });

  const reallocRows = modules["invoice-reallocation"]?.seedRows || [];
  reallocRows.forEach((row, index) => Object.assign(row, {
    kam: row.kam || "KAM One", kas: row.kas || "KAS One", pincode: row.pincode || "122001",
    city: row.city || ["Gurugram", "Mumbai", "Bengaluru"][index % 3], state: row.state || ["Haryana", "Maharashtra", "Karnataka"][index % 3], region: row.region || ["North", "West", "South"][index % 3],
    invoiceDate: row.invoiceDate || "13-07-2026", creditPeriod: row.creditPeriod || "30", dueDate: row.dueDate || "12-08-2026",
    taxValue: row.taxValue || 17514, baseValue: row.baseValue || 97300, poNumber: row.poNumber || "PO95294002", saleOrderNumber: row.saleOrderNumber || "SO95294002",
    industryType: row.industryType || "Services", keyAccount: row.keyAccount || "YES", productCategory: row.productCategory || "Services",
    description: row.description || "Sample invoice description", handoverDate: row.handoverDate || "13-07-2026", billTo: row.billTo || "Sample billing address", shipTo: row.shipTo || "Sample shipping address",
  }));

  if (modules["invoice-deletion"]) Object.assign(modules["invoice-deletion"], {
    description: "Upload, reallocate, and manage invoices.",
    searchFirst: true,
    liveSearchFirst: true,
    hideCreate: true,
    filters: [],
    searchPlaceholder: "Search by customer code, name, client or invoice no...",
    columns: [
      { key: "selected", label: "", type: "row-checkbox", sortable: false },
      { key: "invoiceNo", label: "Invoice No" },
      { key: "clientCode", label: "Client Code" },
      { key: "customer", label: "Customer Name" },
      { key: "customerCode", label: "Customer Code" },
      { key: "invoiceValue", label: "Invoice Value", type: "currency" },
      { key: "status", label: "Invoice Status" },
      { key: "outstanding", label: "Outstanding", type: "currency" },
      { key: "currentNetDue", label: "Current Net Due", type: "currency" },
      { key: "assignee", label: "Agent" },
      { key: "manager", label: "Manager" },
      { key: "kam", label: "KAM" },
      { key: "kas", label: "KAS" },
      { key: "invoiceDate", label: "Date" },
      { key: "dueDate", label: "Due Date" },
    ],
    rowActions: [action("delete", "Delete", "danger", { iconOnly: true })],
    customBlocks: [],
  });
  (modules["invoice-deletion"]?.seedRows || []).forEach((row, index) => Object.assign(row, { clientCode: "TC", customerCode: `CUST-${1001 + index}`, currentNetDue: row.outstanding, assignee: index ? "Aman Verma" : "Neha Sharma", manager: "Rahul Mehta", kam: "KAM One", kas: "KAS One", invoiceDate: "13-07-2026", dueDate: "18-08-2026" }));

  if (modules["customer-contacts"]) Object.assign(modules["customer-contacts"], {
    columns: [
      { key: "name", label: "Name" }, { key: "email", label: "Email" }, { key: "phoneNumber", label: "Phone" },
      { key: "customer", label: "Customer" }, { key: "actions", label: "Actions", type: "actions" },
    ],
  });

  if (modules["customer-master"]) Object.assign(modules["customer-master"], { actionsFirst: true });

  if (modules["invoice-upload"]) {
    modules["invoice-upload"].description = "Upload, reallocate, and manage invoices.";
    Object.assign(modules["invoice-upload"].upload || {}, {
      modalTitle: "Bulk Invoice Upload",
      accept: ".xlsx,.xls",
      help: "Select .xlsx or .xls file",
    });
  }

  for (const id of ["portfolio-transfer", "grn-upload", "cn-advance-upload", "payment-receipt-upload", "customer-portfolio-transfer", "invoice-upload"]) {
    const definition = modules[id];
    if (!definition) continue;
    definition.rowActions?.forEach(rowAction => {
      if (rowAction.id.includes("download")) rowAction.showWhen = { key: "rejected", greaterThan: 0 };
    });
  }
})();
