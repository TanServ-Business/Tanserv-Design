/* Admin module definitions: Master Setup and Operational Setup.
 * Data and actions are intentionally local/demo-only. The Admin runtime merges
 * these definitions into its registry; LPAgent state is never referenced.
 */
(() => {
  "use strict";

  const officeTabs = [
    { label: "Branch Setup", module: "branch-master" },
    { label: "Holiday Master", module: "holiday-master" },
    { label: "Bank Master", module: "bank-master" },
    { label: "Internal Company Contacts", module: "internal-contacts" }
  ];

  const yesNo = ["Yes", "No"];
  const activeOptions = ["Active", "Inactive"];
  const states = ["Haryana", "Maharashtra", "Karnataka", "Tamil Nadu", "Delhi", "West Bengal"];
  const branches = ["TestClient Gurugram", "TestClient Mumbai", "TestClient Bengaluru"];
  const roles = ["Collection Agent", "Collection Manager", "Supervisor", "KAM", "KAS", "Finance Controller"];

  const auditColumns = [
    { key: "createdOn", label: "Created On", type: "date" },
    { key: "updatedOn", label: "Last Updated", type: "date" }
  ];

  const modules = {
    "branch-master": {
      id: "branch-master",
      title: "Office Setup",
      description: "Manage your branch locations, holidays, bank details, and contacts.",
      sectionTitle: "Branch Setup",
      tabs: officeTabs,
      columns: [
        { key: "code", label: "Branch Code" },
        { key: "name", label: "Branch Name" },
        { key: "address", label: "Address" },
        { key: "pincode", label: "Pincode" },
        { key: "city", label: "City" },
        { key: "state", label: "State" },
        { key: "country", label: "Country" },
        { key: "region", label: "Region" },
        { key: "status", label: "Status", type: "status" }
      ],
      seedRows: [
        { id: "br-001", gstNumber: "06AAACT2727Q1ZV", code: "TC-GGN", name: "TestClient Gurugram", address: "Tower B, Golf Course Road", address1: "Tower B, Golf Course Road", address2: "Sector 54", address3: "", pincode: "122002", city: "Gurugram", state: "Haryana", country: "India", region: "North", status: "Active" },
        { id: "br-002", gstNumber: "27AAACT2727Q1ZX", code: "TC-MUM", name: "TestClient Mumbai", address: "Andheri Kurla Road", address1: "Andheri Kurla Road", address2: "Andheri East", address3: "", pincode: "400059", city: "Mumbai", state: "Maharashtra", country: "India", region: "West", status: "Active" },
        { id: "br-003", gstNumber: "29AAACT2727Q1ZT", code: "TC-BLR", name: "TestClient Bengaluru", address: "Outer Ring Road", address1: "Outer Ring Road", address2: "Bellandur", address3: "", pincode: "560103", city: "Bengaluru", state: "Karnataka", country: "India", region: "South", status: "Inactive" }
      ],
      searchPlaceholder: "Search by branch code, name, city or state",
      filters: [
        { key: "state", label: "State", type: "select", options: states },
        { key: "region", label: "Region", type: "select", options: ["North", "South", "East", "West"] },
        { key: "status", label: "Status", type: "select", options: activeOptions }
      ],
      create: {
        label: "Create Branch",
        title: "Create Branch",
        fields: [
          { key: "gstNumber", label: "GST Number", type: "text", required: true, placeholder: "Enter GST number", span: 2 },
          { key: "code", label: "Branch Code", type: "text", required: true, placeholder: "Enter branch code" },
          { key: "name", label: "Branch Name", type: "text", required: true, placeholder: "Enter branch name" },
          { key: "address1", label: "Address Line 1", type: "text", required: true, placeholder: "Enter address", span: 2 },
          { key: "address2", label: "Address Line 2", type: "text", placeholder: "Enter address", span: 2 },
          { key: "address3", label: "Address Line 3", type: "text", placeholder: "Enter address", span: 2 },
          { key: "pincode", label: "Pincode", type: "text", required: true, placeholder: "Enter 6-digit pincode" },
          { key: "city", label: "City", type: "text", required: true, placeholder: "Enter city" },
          { key: "state", label: "State", type: "select", required: true, options: states },
          { key: "country", label: "Country", type: "select", required: true, options: ["India"] },
          { key: "region", label: "Region", type: "select", required: true, options: ["North", "South", "East", "West"] },
          { key: "status", label: "Status", type: "select", required: true, options: activeOptions }
        ]
      },
      rowActions: [
        { id: "edit", label: "Edit", kind: "form" },
        { id: "toggle-status", label: "Change Status", kind: "confirm", confirmTitle: "Change branch status?", confirmBody: "This changes only the branch's dummy status in the Admin prototype." }
      ],
      emptyMessage: "No branches found."
    },

    "holiday-master": {
      id: "holiday-master",
      title: "Office Setup",
      description: "Manage your branch locations, holidays, bank details, and contacts.",
      sectionTitle: "Holiday Master",
      tabs: officeTabs,
      columns: [
        { key: "name", label: "Holiday Name" },
        { key: "state", label: "State" },
        { key: "date", label: "Holiday Date", type: "date" },
        { key: "optional", label: "Optional", type: "boolean" },
        { key: "status", label: "Status", type: "status" }
      ],
      seedRows: [
        { id: "hol-001", name: "Republic Day", state: "All India", date: "2026-01-26", optional: "No", status: "Active" },
        { id: "hol-002", name: "Holi", state: "Haryana", date: "2026-03-04", optional: "No", status: "Active" },
        { id: "hol-003", name: "Maharashtra Day", state: "Maharashtra", date: "2026-05-01", optional: "No", status: "Active" },
        { id: "hol-004", name: "Diwali", state: "All India", date: "2026-11-08", optional: "No", status: "Active" }
      ],
      searchPlaceholder: "Search holiday name or state",
      filters: [
        { key: "state", label: "State", type: "select", options: ["All India", ...states] },
        { key: "dateFrom", label: "From date", type: "date" },
        { key: "dateTo", label: "To date", type: "date" },
        { key: "status", label: "Status", type: "select", options: activeOptions }
      ],
      create: {
        label: "Create Holiday",
        title: "Add Holiday",
        fields: [
          { key: "name", label: "Holiday Name", type: "text", required: true, placeholder: "Enter holiday name", span: 2 },
          { key: "state", label: "Applicable State", type: "select", required: true, options: ["All India", ...states] },
          { key: "date", label: "Holiday Date", type: "date", required: true },
          { key: "optional", label: "Optional Holiday", type: "select", required: true, options: yesNo },
          { key: "status", label: "Status", type: "select", required: true, options: activeOptions }
        ]
      },
      rowActions: [
        { id: "edit", label: "Edit", kind: "form" },
        { id: "delete", label: "Delete", kind: "danger", confirmTitle: "Delete holiday?", confirmBody: "The holiday will be removed from this dummy calendar only." }
      ],
      customBlocks: [
        {
          type: "infoBanner",
          icon: "calendar-check",
          title: "Holiday calendar",
          body: "Maintain state-wise holidays used for visit and activity planning.",
          actions: [{ id: "download-holiday-calendar", label: "Download Calendar", kind: "download" }]
        }
      ],
      emptyMessage: "No holidays found for the selected period."
    },

    "bank-master": {
      id: "bank-master",
      title: "Office Setup",
      description: "Manage your branch locations, holidays, bank details, and contacts.",
      sectionTitle: "Bank Master",
      tabs: officeTabs,
      columns: [
        { key: "name", label: "Bank Name" },
        { key: "shortName", label: "Short Name" },
        { key: "status", label: "Status", type: "status" },
        ...auditColumns
      ],
      seedRows: [
        { id: "bank-001", name: "HDFC Bank", shortName: "HDFC", status: "Active", createdOn: "2026-01-08", updatedOn: "2026-07-18" },
        { id: "bank-002", name: "ICICI Bank", shortName: "ICICI", status: "Active", createdOn: "2026-01-08", updatedOn: "2026-07-18" },
        { id: "bank-003", name: "State Bank of India", shortName: "SBI", status: "Active", createdOn: "2026-01-10", updatedOn: "2026-07-21" }
      ],
      searchPlaceholder: "Search bank name",
      filters: [{ key: "status", label: "Status", type: "select", options: activeOptions }],
      create: {
        label: "Create Bank",
        title: "Create Bank",
        fields: [
          { key: "name", label: "Bank Name", type: "text", required: true, placeholder: "Enter bank name", span: 2 },
          { key: "shortName", label: "Short Name", type: "text", required: true, placeholder: "Enter abbreviation" },
          { key: "status", label: "Status", type: "select", required: true, options: activeOptions }
        ]
      },
      rowActions: [
        { id: "edit", label: "Edit", kind: "form" },
        { id: "delete", label: "Delete", kind: "danger", confirmTitle: "Delete bank?", confirmBody: "This removes the dummy bank record. Existing prototype records are unaffected." }
      ],
      emptyMessage: "No banks have been configured."
    },

    "internal-contacts": {
      id: "internal-contacts",
      title: "Office Setup",
      description: "Manage your branch locations, holidays, bank details, and contacts.",
      sectionTitle: "Internal Company Contacts",
      tabs: officeTabs,
      columns: [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "department", label: "Department" },
        { key: "mobile", label: "Mobile No." },
        { key: "branch", label: "Branch" },
        { key: "status", label: "Status", type: "status" }
      ],
      seedRows: [
        { id: "contact-001", name: "Aditi Mehra", email: "aditi.mehra@testclient.example", department: "Finance", mobile: "+91 98765 41021", branch: "TestClient Gurugram", status: "Active" },
        { id: "contact-002", name: "Kunal Shah", email: "kunal.shah@testclient.example", department: "Treasury", mobile: "+91 98765 41028", branch: "TestClient Mumbai", status: "Active" },
        { id: "contact-003", name: "Riya Nair", email: "riya.nair@testclient.example", department: "Legal", mobile: "+91 98765 41035", branch: "TestClient Bengaluru", status: "Active" }
      ],
      searchPlaceholder: "Search name, email or department",
      filters: [
        { key: "department", label: "Department", type: "select", options: ["Finance", "Treasury", "Legal", "Sales", "Operations"] },
        { key: "branch", label: "Branch", type: "select", options: branches },
        { key: "status", label: "Status", type: "select", options: activeOptions }
      ],
      create: {
        label: "Create Contact",
        title: "Add Internal Company Contact",
        fields: [
          { key: "name", label: "Name", type: "text", required: true, placeholder: "Enter full name" },
          { key: "department", label: "Department", type: "select", required: true, options: ["Finance", "Treasury", "Legal", "Sales", "Operations"] },
          { key: "email", label: "Email ID", type: "email", required: true, placeholder: "name@company.com" },
          { key: "mobile", label: "Mobile Number", type: "tel", required: true, placeholder: "+91 98765 43210" },
          { key: "branch", label: "Branch", type: "select", required: true, options: branches },
          { key: "status", label: "Status", type: "select", required: true, options: activeOptions }
        ]
      },
      rowActions: [
        { id: "edit", label: "Edit", kind: "form" },
        { id: "delete", label: "Delete", kind: "danger", confirmTitle: "Delete contact?", confirmBody: "This removes the internal contact from the dummy directory." }
      ],
      emptyMessage: "No internal contacts found."
    },

    "invoice-preferences": {
      id: "invoice-preferences",
      title: "Invoice Preferences",
      description: "Configure ageing buckets, activity dispositions, and data purge policies.",
      sectionTitle: "Invoice Preferences",
      tabs: [
        { label: "Aging Bucket", module: "invoice-preferences", view: "aging" },
        { label: "Activity Dispositions", module: "invoice-preferences", view: "dispositions" },
        { label: "Purge Policy", module: "invoice-preferences", view: "purge" }
      ],
      columns: [
        { key: "name", label: "Bucket Name" },
        { key: "from", label: "From (Days)", type: "number" },
        { key: "to", label: "To (Days)", type: "number" },
        { key: "status", label: "Status", type: "status" }
      ],
      seedRows: [
        { id: "age-001", name: "Not Due", from: "-9999", to: "0", status: "Active" },
        { id: "age-002", name: "1–30 Days", from: "1", to: "30", status: "Active" },
        { id: "age-003", name: "31–60 Days", from: "31", to: "60", status: "Active" },
        { id: "age-004", name: "61–90 Days", from: "61", to: "90", status: "Active" },
        { id: "age-005", name: "Above 90 Days", from: "91", to: "9999", status: "Active" }
      ],
      searchPlaceholder: "Search bucket name",
      create: {
        label: "Add Custom Bucket",
        title: "Create Aging Bucket",
        fields: [
          { key: "name", label: "Bucket Name", type: "text", required: true, placeholder: "For example 91–120 Days", span: 2 },
          { key: "from", label: "From (Days)", type: "number", required: true, placeholder: "91" },
          { key: "to", label: "To (Days)", type: "number", required: true, placeholder: "120" },
          { key: "status", label: "Status", type: "select", required: true, options: activeOptions }
        ]
      },
      rowActions: [
        { id: "edit", label: "Edit", kind: "form" },
        { id: "delete", label: "Delete", kind: "danger", confirmTitle: "Delete aging bucket?", confirmBody: "The selected custom bucket will be removed from the dummy configuration." }
      ],
      settingsSections: [
        {
          id: "aging-mode",
          title: "Aging Bucket",
          description: "Choose the standard invoice ageing buckets or configure your own non-overlapping ranges.",
          fields: [
            { key: "agingMode", label: "Bucket Configuration", type: "radio", required: true, options: ["Use Existing Buckets", "Create Custom Buckets"] }
          ]
        },
        {
          id: "activity-dispositions",
          title: "Activity Dispositions",
          description: "Select the outcomes agents can use when recording an activity.",
          fields: [
            { key: "dispositions", label: "Available Dispositions", type: "checkbox-group", options: ["Promise to Pay", "Payment Done", "Call Back", "Dispute Raised", "No Response", "Wrong Contact", "Part Payment", "Document Requested"] },
            { key: "allowCustomDisposition", label: "Allow custom disposition", type: "checkbox" }
          ]
        },
        {
          id: "purge-policy",
          title: "Purge Policy",
          description: "Define when completed activity and notification records leave the operational view.",
          fields: [
            { key: "purgeEnabled", label: "Enable Purge Policy", type: "checkbox" },
            { key: "activityRetention", label: "Activity Retention (months)", type: "number", required: true, placeholder: "24", dependsOn: { field: "purgeEnabled", equals: true } },
            { key: "notificationRetention", label: "Notification Retention (months)", type: "number", required: true, placeholder: "12", dependsOn: { field: "purgeEnabled", equals: true } }
          ]
        }
      ],
      customBlocks: [
        { type: "tabContentMap", views: { aging: "table", dispositions: "settings:activity-dispositions", purge: "settings:purge-policy" } }
      ],
      emptyMessage: "No aging buckets configured."
    },

    "document-setup": {
      id: "document-setup",
      title: "Document Setup",
      description: "Manage document presets, checklist items, and accepted file requirements.",
      sectionTitle: "Documents List",
      tabs: [
        { label: "Document Setup", module: "document-setup", view: "documents" },
        { label: "Document Presets", module: "document-setup", view: "presets" }
      ],
      columns: [
        { key: "code", label: "Document Code" },
        { key: "name", label: "Document Name" },
        { key: "category", label: "Category" },
        { key: "description", label: "Description" },
        { key: "mandatory", label: "Mandatory", type: "boolean" },
        { key: "status", label: "Status", type: "status" }
      ],
      seedRows: [
        { id: "doc-001", code: "INV_COPY", name: "Invoice Copy", category: "Invoice", description: "Customer invoice document", mandatory: "Yes", status: "Active", fileTypes: ["PDF"] },
        { id: "doc-002", code: "POD", name: "Proof of Delivery", category: "Supporting Document", description: "Signed delivery proof", mandatory: "No", status: "Active", fileTypes: ["PDF", "JPG", "PNG"] },
        { id: "doc-003", code: "GRN", name: "Goods Receipt Note", category: "Supporting Document", description: "Customer-issued GRN", mandatory: "No", status: "Active", fileTypes: ["PDF", "XLSX"] }
      ],
      searchPlaceholder: "Search document code or name",
      filters: [
        { key: "category", label: "Category", type: "select", options: ["Invoice", "Supporting Document", "Tax Document", "Correspondence"] },
        { key: "mandatory", label: "Mandatory", type: "select", options: yesNo },
        { key: "status", label: "Status", type: "select", options: activeOptions }
      ],
      create: {
        label: "Create Document",
        title: "Create Document",
        fields: [
          { key: "preset", label: "Select Preset", type: "select", options: ["Start from scratch", "Invoice Documents", "Payment Documents", "Dispute Documents"], span: 2 },
          { key: "code", label: "Document Code", type: "text", required: true, placeholder: "Enter a unique code" },
          { key: "name", label: "Document Name", type: "text", required: true, placeholder: "Enter document name" },
          { key: "category", label: "Document Category", type: "select", required: true, options: ["Invoice", "Supporting Document", "Tax Document", "Correspondence"] },
          { key: "fileTypes", label: "Allowed File Types", type: "multiselect", required: true, options: ["PDF", "JPG", "JPEG", "PNG", "XLSX"] },
          { key: "description", label: "Description", type: "textarea", placeholder: "Describe when this document is used", span: 2 },
          { key: "mandatory", label: "Mandatory Document", type: "select", required: true, options: yesNo },
          { key: "status", label: "Status", type: "select", required: true, options: activeOptions }
        ]
      },
      rowActions: [
        { id: "edit", label: "Edit", kind: "form" },
        { id: "delete", label: "Delete", kind: "danger", confirmTitle: "Delete document setup?", confirmBody: "The document will be removed from this dummy setup. No uploaded files are affected." }
      ],
      customBlocks: [
        {
          type: "presetCards",
          view: "presets",
          items: [
            { id: "preset-invoice", title: "Invoice Documents", description: "Invoice Copy, POD and supporting tax documents", count: 3, action: "use-preset" },
            { id: "preset-payment", title: "Payment Documents", description: "Receipt, remittance advice and bank confirmation", count: 3, action: "use-preset" },
            { id: "preset-dispute", title: "Dispute Documents", description: "Dispute evidence and customer correspondence", count: 2, action: "use-preset" }
          ]
        }
      ],
      emptyMessage: "No document definitions found."
    },

    "role-display": {
      id: "role-display",
      title: "Role and Display Name Setup",
      description: "Configure organisation hierarchy and the role names shown throughout the platform.",
      sectionTitle: "Organisation Hierarchy",
      tabs: [
        { label: "Organisation Hierarchy", module: "role-display", view: "hierarchy" },
        { label: "Role Display Names", module: "role-display", view: "display-names" }
      ],
      columns: [
        { key: "operationalRole", label: "Operational Role" },
        { key: "displayName", label: "Display Name" },
        { key: "reportsTo", label: "Reports To" },
        { key: "mandatory", label: "Mandatory", type: "boolean" },
        { key: "status", label: "Status", type: "status" }
      ],
      seedRows: [
        { id: "role-001", operationalRole: "Collection Agent", displayName: "Collection Agent", reportsTo: "Collection Manager", mandatory: "Yes", status: "Active" },
        { id: "role-002", operationalRole: "Collection Manager", displayName: "Collection Manager", reportsTo: "Supervisor", mandatory: "Yes", status: "Active" },
        { id: "role-003", operationalRole: "Supervisor", displayName: "Supervisor", reportsTo: "KAM", mandatory: "Yes", status: "Active" },
        { id: "role-004", operationalRole: "KAM", displayName: "Key Account Manager", reportsTo: "Admin", mandatory: "No", status: "Active" },
        { id: "role-005", operationalRole: "KAS", displayName: "Key Account Support", reportsTo: "KAM", mandatory: "No", status: "Active" }
      ],
      searchPlaceholder: "Search operational role or display name",
      filters: [
        { key: "reportsTo", label: "Reports To", type: "select", options: [...roles, "Admin"] },
        { key: "status", label: "Status", type: "select", options: activeOptions }
      ],
      create: {
        label: "Add Role",
        title: "Configure Role",
        fields: [
          { key: "operationalRole", label: "Operational Role", type: "select", required: true, options: roles },
          { key: "displayName", label: "Display Name", type: "text", required: true, placeholder: "Enter the name shown to users" },
          { key: "reportsTo", label: "Reports To", type: "select", required: true, options: [...roles, "Admin"] },
          { key: "mandatory", label: "Mandatory Role", type: "select", required: true, options: yesNo },
          { key: "status", label: "Status", type: "select", required: true, options: activeOptions }
        ]
      },
      rowActions: [{ id: "edit", label: "Edit Display Name", kind: "form" }],
      settingsSections: [
        {
          id: "hierarchy-order",
          title: "Organisation Hierarchy",
          description: "The operational reporting order used for allocation and escalation.",
          fields: [
            { key: "hierarchy", label: "Hierarchy Order", type: "reorder-list", options: ["Collection Agent", "Collection Manager", "Supervisor", "KAM", "Admin"] }
          ]
        }
      ],
      customBlocks: [
        { type: "tabContentMap", views: { hierarchy: "settings:hierarchy-order", "display-names": "table" } },
        { type: "warningBanner", title: "Mandatory roles", body: "Collection Agent, Collection Manager and Supervisor cannot be removed from the operational hierarchy." }
      ],
      emptyMessage: "No roles match the selected filters."
    },

    "user-setup": {
      id: "user-setup",
      title: "User Setup",
      description: "Create users, import user lists, and manage your TestClient team.",
      sectionTitle: "Team Members",
      tabs: [
        { label: "User Creation", module: "user-setup", view: "create-user" },
        { label: "User Bulk Creation", module: "user-setup", view: "bulk-user" },
        { label: "Team Members", module: "user-setup", view: "team-members" }
      ],
      columns: [
        { key: "name", label: "Name" },
        { key: "email", label: "Email" },
        { key: "role", label: "Role" },
        { key: "branch", label: "Branch" },
        { key: "reportingTo", label: "Reporting To" },
        { key: "status", label: "Status", type: "status" }
      ],
      seedRows: [
        { id: "usr-001", employeeId: "TC1001", name: "Aarav Sharma", email: "aarav.sharma@testclient.example", mobile: "+91 98111 24011", role: "Collection Agent", branch: "TestClient Gurugram", reportingTo: "Neha Batra", status: "Active" },
        { id: "usr-002", employeeId: "TC1002", name: "Neha Batra", email: "neha.batra@testclient.example", mobile: "+91 98111 24018", role: "Collection Manager", branch: "TestClient Gurugram", reportingTo: "Rohan Rao", status: "Active" },
        { id: "usr-003", employeeId: "TC1003", name: "Rohan Rao", email: "rohan.rao@testclient.example", mobile: "+91 98111 24022", role: "Supervisor", branch: "TestClient Mumbai", reportingTo: "Priya Menon", status: "Active" },
        { id: "usr-004", employeeId: "TC1004", name: "Meera Iyer", email: "meera.iyer@testclient.example", mobile: "+91 98111 24029", role: "Collection Agent", branch: "TestClient Bengaluru", reportingTo: "Neha Batra", status: "Suspended" }
      ],
      searchPlaceholder: "Search name, email or employee ID",
      filters: [
        { key: "role", label: "Role", type: "select", options: roles },
        { key: "branch", label: "Branch", type: "select", options: branches },
        { key: "status", label: "Status", type: "select", options: ["Active", "Invited", "Suspended", "Inactive"] }
      ],
      create: {
        label: "Create User",
        title: "User Creation",
        fields: [
          { key: "employeeId", label: "Employee ID", type: "text", required: true, placeholder: "Enter employee ID" },
          { key: "name", label: "Full Name", type: "text", required: true, placeholder: "Enter full name" },
          { key: "email", label: "Official Email ID", type: "email", required: true, placeholder: "name@company.com" },
          { key: "mobile", label: "Mobile Number", type: "tel", required: true, placeholder: "+91 98765 43210" },
          { key: "role", label: "Operational Role", type: "select", required: true, options: roles },
          { key: "branch", label: "Branch", type: "select", required: true, options: branches },
          { key: "reportingTo", label: "Reporting To", type: "select", required: true, options: ["Neha Batra", "Rohan Rao", "Priya Menon", "Admin TestClient"] },
          { key: "sendInvite", label: "Send account invitation", type: "checkbox" }
        ]
      },
      rowActions: [
        { id: "edit", label: "Edit", kind: "form" },
        { id: "reset-password", label: "Reset Password", kind: "confirm", confirmTitle: "Reset user password?", confirmBody: "A dummy reset confirmation will be recorded. No email will be sent." },
        { id: "toggle-suspension", label: "Suspend / Reactivate", kind: "confirm", confirmTitle: "Change user access?", confirmBody: "The selected user's dummy access status will change immediately." },
        { id: "delete", label: "Delete", kind: "danger", confirmTitle: "Delete user?", confirmBody: "This removes the user from the Admin prototype only." }
      ],
      upload: {
        accept: ".xlsx,.xls,.csv",
        multiple: false,
        fields: [
          { key: "defaultBranch", label: "Default Branch", type: "select", required: true, options: branches },
          { key: "duplicateHandling", label: "If email already exists", type: "select", required: true, options: ["Reject row", "Update existing dummy user"] }
        ],
        buttons: [
          { id: "download-template", label: "Download User Template", kind: "download" },
          { id: "clear-files", label: "Clear", kind: "secondary" },
          { id: "validate-upload", label: "Validate", kind: "secondary" },
          { id: "upload-users", label: "Create Users", kind: "primary" }
        ]
      },
      customBlocks: [
        { type: "tabContentMap", views: { "create-user": "createForm", "bulk-user": "upload", "team-members": "table" } },
        {
          type: "uploadResult",
          view: "bulk-user",
          states: ["idle", "validating", "ready", "processing", "completed", "completed-with-errors"],
          summaryKeys: ["total", "valid", "rejected"],
          rejectionColumns: ["Row", "Employee ID", "Email", "Reason"]
        }
      ],
      emptyMessage: "No team members match the selected filters."
    },

    "notification-manager": {
      id: "notification-manager",
      title: "Notification Manager",
      description: "Configure user communication preferences and WhatsApp declarations.",
      sectionTitle: "User Preferences",
      tabs: [
        { label: "User Preferences", module: "notification-manager", view: "preferences" },
        { label: "Channel Configuration", module: "notification-manager", view: "channels" }
      ],
      columns: [
        { key: "name", label: "Name" },
        { key: "phone", label: "Phone Number" },
        { key: "email", label: "Email ID" },
        { key: "whatsappDeclaration", label: "WhatsApp Declaration" },
        { key: "emailEnabled", label: "Email", type: "boolean" },
        { key: "whatsappEnabled", label: "WhatsApp", type: "boolean" },
        { key: "status", label: "Status", type: "status" }
      ],
      seedRows: [
        { id: "pref-001", name: "Aarav Sharma", phone: "+91 98111 24011", email: "aarav.sharma@testclient.example", whatsappDeclaration: "Accepted", emailEnabled: "Yes", whatsappEnabled: "Yes", status: "Active" },
        { id: "pref-002", name: "Neha Batra", phone: "+91 98111 24018", email: "neha.batra@testclient.example", whatsappDeclaration: "Pending", emailEnabled: "Yes", whatsappEnabled: "No", status: "Active" },
        { id: "pref-003", name: "Meera Iyer", phone: "+91 98111 24029", email: "meera.iyer@testclient.example", whatsappDeclaration: "Declined", emailEnabled: "Yes", whatsappEnabled: "No", status: "Inactive" }
      ],
      searchPlaceholder: "Search user name, phone or email",
      filters: [
        { key: "whatsappDeclaration", label: "WhatsApp Declaration", type: "select", options: ["Accepted", "Pending", "Declined"] },
        { key: "status", label: "Status", type: "select", options: activeOptions }
      ],
      create: null,
      rowActions: [
        { id: "edit-preferences", label: "Edit Preferences", kind: "form" },
        { id: "resend-declaration", label: "Resend Declaration", kind: "confirm", confirmTitle: "Resend WhatsApp declaration?", confirmBody: "A dummy declaration request will be added to the activity feed. No message will be sent." }
      ],
      settingsSections: [
        {
          id: "user-preference-form",
          title: "Communication Preferences",
          description: "Select which channels this user can receive platform notifications on.",
          fields: [
            { key: "name", label: "User", type: "select", required: true, options: ["Aarav Sharma", "Neha Batra", "Rohan Rao", "Meera Iyer"] },
            { key: "emailEnabled", label: "Email Notifications", type: "checkbox" },
            { key: "smsEnabled", label: "SMS Notifications", type: "checkbox" },
            { key: "whatsappEnabled", label: "WhatsApp Notifications", type: "checkbox", dependsOn: { field: "whatsappDeclaration", equals: "Accepted" } },
            { key: "pushEnabled", label: "In-app Notifications", type: "checkbox" }
          ]
        },
        {
          id: "channel-config",
          title: "Channel Configuration",
          description: "Set global channel availability for TestClient users.",
          fields: [
            { key: "emailChannel", label: "Email", type: "toggle" },
            { key: "smsChannel", label: "SMS", type: "toggle" },
            { key: "whatsappChannel", label: "WhatsApp", type: "toggle" },
            { key: "inAppChannel", label: "In-app", type: "toggle" }
          ]
        }
      ],
      customBlocks: [
        { type: "tabContentMap", views: { preferences: "table", channels: "settings:channel-config" } },
        {
          type: "infoBanner",
          icon: "whatsapp",
          title: "WhatsApp declaration",
          body: "WhatsApp notifications are available only after a user accepts the communication declaration."
        }
      ],
      emptyMessage: "No notification preferences found."
    }
  };

  window.IneburaAdminModules = Object.assign({}, window.IneburaAdminModules || {}, modules);
})();
