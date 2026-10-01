(() => {
  const actionTypeMeta = {
    activity: { label: "Activity", icon: "bi-check2-circle" },
    email: { label: "Email", icon: "bi-envelope" },
    reminder: { label: "Reminder", icon: "bi-bell" },
    visit: { label: "Visit", icon: "bi-geo-alt" }
  };

  const actions = [
    {
      id: "ai-10291-activity-ptp",
      invoiceNo: "INV-10291",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 124000,
      netDue: 98000,
      invoiceDate: "12 Oct 2025",
      dueDate: "05 Nov 2025",
      primaryStatus: "PTP",
      subStatus: "PTP",
      previousStatus: "Within Credit Period/Days",
      type: "activity",
      label: "Call Back/Email Follow up",
      source: "Activity - PTP",
      evidence: "PTP date was recorded for 28 May 2026 and the invoice is still open.",
      actionDetail: "Create a follow-up activity on the invoice and keep the status mapped to the disposition sheet.",
      scheduledAt: "28 May 2026, 10:00 AM",
      confidence: 92,
      risk: "Medium",
      email: null,
      timeline: [
        ["12 Nov 2025, 09:42 AM", "Email received", "Customer asked for revised payment date."],
        ["11 Nov 2025, 04:30 PM", "Reminder sent", "PTP reminder shared with invoice copy."],
        ["07 Nov 2025, 11:32 AM", "Activity", "PTP captured by agent."]
      ]
    },
    {
      id: "ai-10291-email-draft",
      invoiceNo: "INV-10291",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 124000,
      netDue: 98000,
      invoiceDate: "12 Oct 2025",
      dueDate: "05 Nov 2025",
      primaryStatus: "PTP",
      subStatus: "PTP",
      previousStatus: "PTP",
      type: "email",
      label: "Draft response",
      source: "Email",
      evidence: "Customer asked for a revised payment timeline without payment proof.",
      actionDetail: "Open an AI drafted reply asking for confirmed payment date and payment proof once processed.",
      scheduledAt: "28 May 2026, 10:05 AM",
      confidence: 86,
      risk: "Low",
      email: {
        from: "Aditi Sharma <aditi@inebura.com>",
        to: "finance@apollopharmacy.com",
        cc: "Rohit Mehra <rohit.mehra@inebura.com>",
        subject: "Payment timeline confirmation for INV-10291",
        attachments: "Invoice_INV-10291.pdf",
        body: "Dear Team,\n\nPlease confirm the revised payment date for INV-10291 and share payment proof once processed.\n\nRegards,\nAditi Sharma"
      },
      timeline: [
        ["12 Nov 2025, 09:42 AM", "Email received", "Customer asked for revised payment date."],
        ["11 Nov 2025, 04:30 PM", "Reminder sent", "PTP reminder shared."]
      ]
    },
    {
      id: "ai-10211-activity-dc",
      invoiceNo: "INV-10211",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 210000,
      netDue: 210000,
      invoiceDate: "22 Sep 2025",
      dueDate: "06 Oct 2025",
      primaryStatus: "Further Docs Required",
      subStatus: "Delivery Challan Required",
      previousStatus: "Invoice Copy Required",
      type: "activity",
      label: "Delivery Challan Required",
      source: "Email",
      evidence: "Customer wrote that INV-10211 cannot be processed because the delivery challan is missing.",
      actionDetail: "Prefill activity as Delivery Challan Required and create the document support workflow.",
      scheduledAt: "Today, 02:00 PM",
      confidence: 91,
      risk: "Medium",
      email: null,
      timeline: [
        ["10 Nov 2025, 03:26 PM", "Email received", "Customer requested delivery challan copy."],
        ["08 Nov 2025, 03:28 PM", "Invoice trail", "Invoice still marked as document required."]
      ]
    },
    {
      id: "ai-10211-email-draft",
      invoiceNo: "INV-10211",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 210000,
      netDue: 210000,
      invoiceDate: "22 Sep 2025",
      dueDate: "06 Oct 2025",
      primaryStatus: "Further Docs Required",
      subStatus: "Delivery Challan Required",
      previousStatus: "Invoice Copy Required",
      type: "email",
      label: "Draft response",
      source: "Email",
      evidence: "Inbound email asks for delivery challan before invoice processing.",
      actionDetail: "Open a drafted reply acknowledging the request and confirming that the challan copy will be shared.",
      scheduledAt: "Today, 02:05 PM",
      confidence: 88,
      risk: "Low",
      email: {
        from: "Aditi Sharma <aditi@inebura.com>",
        to: "Anita Nair <finance@apollopharmacy.com>",
        cc: "Rohit Mehra <rohit.mehra@inebura.com>",
        subject: "Delivery challan for INV-10211",
        attachments: "Delivery_Challan_INV-10211.pdf",
        body: "Dear Anita,\n\nWe have noted the delivery challan requirement for INV-10211. We will share the challan copy and confirm dispatch details shortly.\n\nRegards,\nAditi Sharma"
      },
      timeline: [
        ["10 Nov 2025, 03:26 PM", "Email received", "Delivery challan requested."],
        ["06 Oct 2025", "Due date passed", "Invoice entered overdue bucket."]
      ]
    },
    {
      id: "ai-10211-visit-dc",
      invoiceNo: "INV-10211",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 210000,
      netDue: 210000,
      invoiceDate: "22 Sep 2025",
      dueDate: "06 Oct 2025",
      primaryStatus: "Further Docs Required",
      subStatus: "Delivery Challan Required",
      previousStatus: "Invoice Copy Required",
      type: "visit",
      label: "Invoice Submission",
      source: "Email",
      evidence: "Customer requested delivery challan support; a visit can close the document gap.",
      actionDetail: "Suggest customer in visit planner with reason Invoice Submission.",
      scheduledAt: "Next plan date",
      confidence: 80,
      risk: "Low",
      email: null,
      timeline: [
        ["10 Nov 2025, 03:26 PM", "Email received", "Delivery challan missing."],
        ["Visit module", "AI suggestion", "Submit Delivery Challan as requested."]
      ]
    },
    {
      id: "ai-10308-activity-collected",
      invoiceNo: "INV-10308",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 95000,
      netDue: 42000,
      invoiceDate: "04 Nov 2025",
      dueDate: "12 Nov 2025",
      primaryStatus: "PTP",
      subStatus: "PTP",
      previousStatus: "Call Back",
      type: "activity",
      label: "Collected",
      source: "Activity - PTP",
      evidence: "Future PTP date exists for this invoice and collection closure is the next possible disposition when payment is confirmed.",
      actionDetail: "Open activity panel prefilled as Collection Done / Collected / Collected.",
      scheduledAt: "28 May 2026, 05:00 PM",
      confidence: 84,
      risk: "Low",
      email: null,
      timeline: [
        ["Activity", "PTP", "PTP date is 28 May 2026."],
        ["AI suggestion", "Activity panel", "Collected pill shown for PTP follow-up."]
      ]
    },
    {
      id: "ai-10308-reminder",
      invoiceNo: "INV-10308",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 95000,
      netDue: 42000,
      invoiceDate: "04 Nov 2025",
      dueDate: "12 Nov 2025",
      primaryStatus: "PTP",
      subStatus: "PTP",
      previousStatus: "Call Back",
      type: "reminder",
      label: "Send reminder",
      source: "Activity - PTP",
      evidence: "PTP date is 28 May 2026 and invoice is still open.",
      actionDetail: "Send scheduled reminder email asking customer to confirm once payment is processed.",
      scheduledAt: "28 May 2026, 09:00 AM",
      confidence: 87,
      risk: "Low",
      email: {
        from: "Aditi Sharma <aditi@inebura.com>",
        to: "finance@apollopharmacy.com",
        cc: "-",
        subject: "Payment reminder for INV-10308",
        attachments: "Invoice_INV-10308.pdf",
        body: "Dear Team,\n\nThis is a reminder for the payment committed for INV-10308 on 28 May 2026. Please confirm once processed.\n\nRegards,\nAditi Sharma"
      },
      timeline: [
        ["Activity", "PTP", "Payment commitment date recorded."],
        ["Reminder", "Scheduled", "Reminder will run unless revoked."]
      ]
    },
    {
      id: "ai-30402-visit-cheque",
      invoiceNo: "INV-30402",
      customer: "Varun Beverages",
      agent: "Palak Choudhary",
      manager: "Mukesh Mishra",
      invoiceAmount: 152000,
      netDue: 152000,
      invoiceDate: "18 Nov 2025",
      dueDate: "02 Dec 2025",
      primaryStatus: "Collection In Progress",
      subStatus: "PDC Given",
      previousStatus: "PDC Given",
      type: "visit",
      label: "Collection follow up",
      source: "Email",
      evidence: "Customer asked the agent to collect cheques and share receipt confirmation.",
      actionDetail: "Suggest customer in visit planner with reason Collection follow up.",
      scheduledAt: "Next plan date",
      confidence: 82,
      risk: "Low",
      email: null,
      timeline: [
        ["12 Nov 2025, 12:01 PM", "Email received", "Customer confirmed cheque/PDC collection request."],
        ["Visit module", "AI suggestion", "Customer asked to collect cheques."]
      ]
    },
    {
      id: "ai-20518-activity-callback",
      invoiceNo: "INV-20518",
      customer: "Blue Star Limited",
      agent: "Manish Kumar",
      manager: "Rohit Mehra",
      invoiceAmount: 342000,
      netDue: 342000,
      invoiceDate: "19 Sep 2025",
      dueDate: "19 Oct 2025",
      primaryStatus: "Collection In Progress",
      subStatus: "Call Back",
      previousStatus: "Cold Call",
      type: "activity",
      label: "Manager Review",
      source: "Activity - Callback",
      evidence: "Three callback attempts were logged without a payment date or dispute reason.",
      actionDetail: "Create a manager review activity and keep the invoice in Call Back until next instruction.",
      scheduledAt: "Today, 04:30 PM",
      confidence: 78,
      risk: "Medium",
      email: null,
      timeline: [
        ["08 Jun 2026, 11:20 AM", "Call back", "Finance contact asked to call later."],
        ["09 Jun 2026, 03:10 PM", "Call back", "No payment date captured."],
        ["10 Jun 2026, 12:40 PM", "AI signal", "Repeated callback pattern detected."]
      ]
    },
    {
      id: "ai-20518-reminder-manager",
      invoiceNo: "INV-20518",
      customer: "Blue Star Limited",
      agent: "Manish Kumar",
      manager: "Rohit Mehra",
      invoiceAmount: 342000,
      netDue: 342000,
      invoiceDate: "19 Sep 2025",
      dueDate: "19 Oct 2025",
      primaryStatus: "Collection In Progress",
      subStatus: "Call Back",
      previousStatus: "Call Back",
      type: "reminder",
      label: "Escalation Reminder",
      source: "Activity - Callback",
      evidence: "Invoice is overdue and repeated callbacks did not produce a commitment.",
      actionDetail: "Send a firm reminder requesting confirmed payment date or dispute reason.",
      scheduledAt: "Today, 05:00 PM",
      confidence: 81,
      risk: "Medium",
      email: {
        from: "Manish Kumar <manish.kumar@inebura.com>",
        to: "finance@bluestar.com",
        cc: "Rohit Mehra <rohit.mehra@inebura.com>",
        subject: "Payment confirmation required for INV-20518",
        attachments: "Invoice_INV-20518.pdf",
        body: "Dear Team,\n\nWe have been following up on INV-20518 and have not yet received a confirmed payment date.\n\nPlease share the expected payment date or any dispute reason by today so we can update the invoice record.\n\nRegards,\nManish Kumar"
      },
      timeline: [
        ["09 Jun 2026, 03:10 PM", "Call back", "No PTP captured."],
        ["10 Jun 2026, 12:40 PM", "AI signal", "Escalation reminder queued."]
      ]
    },
    {
      id: "ai-40777-activity-rebill",
      invoiceNo: "INV-40777",
      customer: "Bikanerwala Foods Pvt Ltd",
      agent: "Sakshi Sharma",
      manager: "Mukesh Mishra",
      invoiceAmount: 268500,
      netDue: 268500,
      invoiceDate: "03 May 2026",
      dueDate: "02 Jun 2026",
      primaryStatus: "Further Action Required",
      subStatus: "Reversal & Re-Bill",
      previousStatus: "Wrong/Incorrect Billing",
      type: "activity",
      label: "Reversal & Re-Bill",
      source: "Email",
      evidence: "Customer flagged incorrect GST value and requested corrected invoice before processing.",
      actionDetail: "Prefill activity as Reversal & Re-Bill and route to billing support.",
      scheduledAt: "Today, 11:30 AM",
      confidence: 89,
      risk: "High",
      email: null,
      timeline: [
        ["07 Jun 2026, 10:08 AM", "Email received", "Customer flagged GST mismatch."],
        ["08 Jun 2026, 01:25 PM", "Issue tracker", "Billing correction requested."],
        ["10 Jun 2026, 09:00 AM", "AI signal", "Rebill path recommended."]
      ]
    },
    {
      id: "ai-40777-email-rebill",
      invoiceNo: "INV-40777",
      customer: "Bikanerwala Foods Pvt Ltd",
      agent: "Sakshi Sharma",
      manager: "Mukesh Mishra",
      invoiceAmount: 268500,
      netDue: 268500,
      invoiceDate: "03 May 2026",
      dueDate: "02 Jun 2026",
      primaryStatus: "Further Action Required",
      subStatus: "Reversal & Re-Bill",
      previousStatus: "Wrong/Incorrect Billing",
      type: "email",
      label: "Draft response",
      source: "Email",
      evidence: "Customer expects acknowledgement and timeline for corrected invoice.",
      actionDetail: "Draft a response confirming rebill review and expected correction timeline.",
      scheduledAt: "Today, 11:35 AM",
      confidence: 84,
      risk: "Low",
      email: {
        from: "Sakshi Sharma <sakshi.sharma@inebura.com>",
        to: "accounts@bikanerwala.com",
        cc: "Mukesh Mishra <mukesh.mishra@inebura.com>",
        subject: "Rebill review for INV-40777",
        attachments: "Invoice_INV-40777.pdf",
        body: "Dear Team,\n\nWe have noted the billing correction request for INV-40777 and are coordinating with billing support for the revised invoice.\n\nWe will share the corrected copy once validation is complete.\n\nRegards,\nSakshi Sharma"
      },
      timeline: [
        ["07 Jun 2026, 10:08 AM", "Email received", "GST mismatch reported."],
        ["10 Jun 2026, 09:05 AM", "AI draft", "Customer acknowledgement queued."]
      ]
    },
    {
      id: "ai-51240-reminder-predue",
      invoiceNo: "INV-51240",
      customer: "Shiva Healthcare Pvt Ltd",
      agent: "Abhishek Sharma",
      manager: "Mukesh Mishra",
      invoiceAmount: 186000,
      netDue: 186000,
      invoiceDate: "27 May 2026",
      dueDate: "26 Jun 2026",
      primaryStatus: "No Due",
      subStatus: "Within Credit Period/Days",
      previousStatus: "Submitted and tracking",
      type: "reminder",
      label: "Pre-due Reminder",
      source: "Strategy",
      evidence: "Invoice is within credit period and enters the configured pre-due reminder window tomorrow.",
      actionDetail: "Send a low-risk reminder with invoice copy and due date.",
      scheduledAt: "24 Jun 2026, 09:30 AM",
      confidence: 74,
      risk: "Low",
      email: {
        from: "Abhishek Sharma <abhishek.sharma@inebura.com>",
        to: "payments@shivahealthcare.com",
        cc: "-",
        subject: "Upcoming due date reminder for INV-51240",
        attachments: "Invoice_INV-51240.pdf",
        body: "Dear Team,\n\nThis is a reminder that INV-51240 is due on 26 Jun 2026.\n\nPlease confirm the planned payment date or share payment proof once processed.\n\nRegards,\nAbhishek Sharma"
      },
      timeline: [
        ["27 May 2026", "Invoice created", "Invoice submitted and tracking."],
        ["Strategy", "Reminder rule", "Pre-due reminder window matched."]
      ]
    },
    {
      id: "ai-51240-visit-key-account",
      invoiceNo: "INV-51240",
      customer: "Shiva Healthcare Pvt Ltd",
      agent: "Abhishek Sharma",
      manager: "Mukesh Mishra",
      invoiceAmount: 186000,
      netDue: 186000,
      invoiceDate: "27 May 2026",
      dueDate: "26 Jun 2026",
      primaryStatus: "No Due",
      subStatus: "Within Credit Period/Days",
      previousStatus: "Submitted and tracking",
      type: "visit",
      label: "Key Account Visit",
      source: "Strategy",
      evidence: "Customer is marked as key account and has a high-value invoice due this month.",
      actionDetail: "Suggest account visit for payment readiness check before due date.",
      scheduledAt: "Next plan date",
      confidence: 70,
      risk: "Low",
      email: null,
      timeline: [
        ["Strategy", "Key account", "Visit suggested for high-value invoice readiness."],
        ["Invoice", "Due date", "Payment due on 26 Jun 2026."]
      ]
    },
    {
      id: "ai-61890-activity-tax",
      invoiceNo: "INV-61890",
      customer: "Ambane India Pvt Ltd",
      agent: "Karan Singh",
      manager: "Rohit Mehra",
      invoiceAmount: 412000,
      netDue: 412000,
      invoiceDate: "11 Apr 2026",
      dueDate: "11 May 2026",
      primaryStatus: "Further Action Required",
      subStatus: "Tax Issue On The Invoice",
      previousStatus: "Vendor Portal Issue",
      type: "activity",
      label: "Tax Issue",
      source: "Email",
      evidence: "Customer rejected invoice on portal due to tax breakup mismatch.",
      actionDetail: "Prefill activity as Tax Issue On The Invoice and route to finance validation.",
      scheduledAt: "Today, 03:00 PM",
      confidence: 90,
      risk: "High",
      email: null,
      timeline: [
        ["06 Jun 2026, 04:50 PM", "Portal update", "Invoice rejected by customer portal."],
        ["07 Jun 2026, 12:15 PM", "Email received", "Tax breakup mismatch reported."],
        ["10 Jun 2026, 10:30 AM", "AI signal", "Tax issue disposition recommended."]
      ]
    },
    {
      id: "ai-61890-email-tax",
      invoiceNo: "INV-61890",
      customer: "Ambane India Pvt Ltd",
      agent: "Karan Singh",
      manager: "Rohit Mehra",
      invoiceAmount: 412000,
      netDue: 412000,
      invoiceDate: "11 Apr 2026",
      dueDate: "11 May 2026",
      primaryStatus: "Further Action Required",
      subStatus: "Tax Issue On The Invoice",
      previousStatus: "Vendor Portal Issue",
      type: "email",
      label: "Draft response",
      source: "Email",
      evidence: "Customer needs acknowledgement and corrected tax breakup timeline.",
      actionDetail: "Draft a response confirming finance validation and next update.",
      scheduledAt: "Today, 03:10 PM",
      confidence: 82,
      risk: "Low",
      email: {
        from: "Karan Singh <karan.singh@inebura.com>",
        to: "ap@ambaneindia.com",
        cc: "Rohit Mehra <rohit.mehra@inebura.com>",
        subject: "Tax breakup validation for INV-61890",
        attachments: "Invoice_INV-61890.pdf",
        body: "Dear Team,\n\nWe have noted the tax breakup mismatch for INV-61890 and are validating it with our finance team.\n\nWe will revert with the corrected breakup or next action after validation.\n\nRegards,\nKaran Singh"
      },
      timeline: [
        ["07 Jun 2026, 12:15 PM", "Email received", "Tax mismatch reported."],
        ["10 Jun 2026, 03:10 PM", "AI draft", "Response queued for review."]
      ]
    },
    {
      id: "ai-10418-activity-assignment",
      invoiceNo: "INV-10418",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 56000,
      netDue: 56000,
      invoiceDate: "07 Oct 2025",
      dueDate: "22 Oct 2025",
      primaryStatus: "Invoice Assignment",
      subStatus: "Assign the Invoice to Others",
      previousStatus: "Not submitted and untouched",
      type: "activity",
      label: "Assign Invoice",
      source: "Invoice status",
      evidence: "Invoice is untouched and assignment status indicates ownership is unresolved.",
      actionDetail: "Create assignment activity and route invoice to the responsible internal owner.",
      scheduledAt: "Today, 12:15 PM",
      confidence: 83,
      risk: "Medium",
      email: null,
      timeline: [
        ["09 Jun 2026, 10:00 AM", "Invoice scan", "Invoice still not submitted."],
        ["10 Jun 2026, 01:00 PM", "AI signal", "Assignment workflow recommended."]
      ]
    },
    {
      id: "ai-10418-email-assignment",
      invoiceNo: "INV-10418",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 56000,
      netDue: 56000,
      invoiceDate: "07 Oct 2025",
      dueDate: "22 Oct 2025",
      primaryStatus: "Invoice Assignment",
      subStatus: "Assign the Invoice to Others",
      previousStatus: "Not submitted and untouched",
      type: "email",
      label: "Owner Clarification",
      source: "Invoice status",
      evidence: "Invoice assignment is pending and customer contact needs confirmation of processing owner.",
      actionDetail: "Draft email asking customer finance team to confirm the right processing owner and document route.",
      scheduledAt: "Today, 12:20 PM",
      confidence: 77,
      risk: "Low",
      email: {
        from: "Aditi Sharma <aditi@inebura.com>",
        to: "finance@apollopharmacy.com",
        cc: "Rohit Mehra <rohit.mehra@inebura.com>",
        subject: "Processing owner confirmation for INV-10418",
        attachments: "Invoice_INV-10418.pdf",
        body: "Dear Team,\n\nPlease confirm the correct processing owner or department for INV-10418 so we can route the invoice and complete submission.\n\nRegards,\nAditi Sharma"
      },
      timeline: [
        ["09 Jun 2026, 10:00 AM", "Invoice scan", "Assignment unresolved."],
        ["10 Jun 2026, 12:20 PM", "AI draft", "Owner clarification email queued."]
      ]
    },
    {
      id: "ai-10433-activity-legal",
      invoiceNo: "INV-10433",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 98000,
      netDue: 45000,
      invoiceDate: "25 Oct 2025",
      dueDate: "08 Nov 2025",
      primaryStatus: "Guidance",
      subStatus: "Recommended For Legal",
      previousStatus: "Reminder sent",
      type: "activity",
      label: "Legal Review",
      source: "Aging + status",
      evidence: "Invoice is overdue and already marked Recommended For Legal after reminder attempts.",
      actionDetail: "Create legal review activity and keep manager in copy for final decision.",
      scheduledAt: "Today, 03:45 PM",
      confidence: 85,
      risk: "High",
      email: null,
      timeline: [
        ["08 Jun 2026", "Due review", "Invoice remained overdue."],
        ["10 Jun 2026, 03:45 PM", "AI signal", "Legal review queued."]
      ]
    },
    {
      id: "ai-10433-reminder-legal",
      invoiceNo: "INV-10433",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 98000,
      netDue: 45000,
      invoiceDate: "25 Oct 2025",
      dueDate: "08 Nov 2025",
      primaryStatus: "Guidance",
      subStatus: "Recommended For Legal",
      previousStatus: "Reminder sent",
      type: "reminder",
      label: "Final Reminder",
      source: "Aging + status",
      evidence: "No response after reminder; final notice should be sent before legal escalation.",
      actionDetail: "Send final payment reminder requesting proof, dispute reason, or confirmation before escalation.",
      scheduledAt: "Today, 04:00 PM",
      confidence: 86,
      risk: "High",
      email: {
        from: "Aditi Sharma <aditi@inebura.com>",
        to: "finance@apollopharmacy.com",
        cc: "Rohit Mehra <rohit.mehra@inebura.com>",
        subject: "Final reminder before escalation for INV-10433",
        attachments: "Invoice_INV-10433.pdf",
        body: "Dear Team,\n\nThis is a final reminder for INV-10433 before escalation. Please share payment proof, confirmed payment date, or dispute reason by end of day.\n\nRegards,\nAditi Sharma"
      },
      timeline: [
        ["08 Jun 2026", "Reminder status", "No customer response recorded."],
        ["10 Jun 2026, 04:00 PM", "Reminder", "Final reminder scheduled."]
      ]
    },
    {
      id: "ai-10457-activity-credit-note",
      invoiceNo: "INV-10457",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 34000,
      netDue: 34000,
      invoiceDate: "28 Nov 2025",
      dueDate: "12 Dec 2025",
      primaryStatus: "Further Action Required",
      subStatus: "Credit Note To Be Issued",
      previousStatus: "Submitted and tracking",
      type: "activity",
      label: "Credit Note",
      source: "Customer deduction",
      evidence: "Customer deduction note references price mismatch and asks for credit note.",
      actionDetail: "Prefill activity as Credit Note To Be Issued and route to finance approval.",
      scheduledAt: "Today, 01:30 PM",
      confidence: 88,
      risk: "Medium",
      email: null,
      timeline: [
        ["09 Jun 2026, 04:05 PM", "Email received", "Customer reported price mismatch."],
        ["10 Jun 2026, 01:30 PM", "AI signal", "Credit note disposition suggested."]
      ]
    },
    {
      id: "ai-10457-email-credit-note",
      invoiceNo: "INV-10457",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 34000,
      netDue: 34000,
      invoiceDate: "28 Nov 2025",
      dueDate: "12 Dec 2025",
      primaryStatus: "Further Action Required",
      subStatus: "Credit Note To Be Issued",
      previousStatus: "Submitted and tracking",
      type: "email",
      label: "Credit Note Reply",
      source: "Customer deduction",
      evidence: "Customer expects acknowledgement of deduction and credit-note workflow.",
      actionDetail: "Draft email confirming finance review for credit note issuance.",
      scheduledAt: "Today, 01:35 PM",
      confidence: 82,
      risk: "Low",
      email: {
        from: "Aditi Sharma <aditi@inebura.com>",
        to: "finance@apollopharmacy.com",
        cc: "Rohit Mehra <rohit.mehra@inebura.com>",
        subject: "Credit note review for INV-10457",
        attachments: "Invoice_INV-10457.pdf",
        body: "Dear Team,\n\nWe have noted the credit note request for INV-10457 and are validating it with finance.\n\nWe will confirm the next update after review.\n\nRegards,\nAditi Sharma"
      },
      timeline: [
        ["09 Jun 2026, 04:05 PM", "Email received", "Credit note requested."],
        ["10 Jun 2026, 01:35 PM", "AI draft", "Credit-note acknowledgement queued."]
      ]
    },
    {
      id: "ai-10502-activity-portal",
      invoiceNo: "INV-10502",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 176500,
      netDue: 176500,
      invoiceDate: "05 Dec 2025",
      dueDate: "04 Jan 2026",
      primaryStatus: "Further Action Required",
      subStatus: "Vendor Portal Issue",
      previousStatus: "Invoice Copy Required",
      type: "activity",
      label: "Vendor Portal Issue",
      source: "Portal rejection",
      evidence: "Portal rejected upload because PO reference and invoice value did not match.",
      actionDetail: "Create vendor portal issue activity and attach portal rejection note.",
      scheduledAt: "Tomorrow, 10:15 AM",
      confidence: 87,
      risk: "Medium",
      email: null,
      timeline: [
        ["10 Jun 2026, 06:20 PM", "Portal", "Upload rejected due to PO mismatch."],
        ["11 Jun 2026, 09:15 AM", "AI signal", "Vendor portal issue queued."]
      ]
    },
    {
      id: "ai-10502-reminder-portal",
      invoiceNo: "INV-10502",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 176500,
      netDue: 176500,
      invoiceDate: "05 Dec 2025",
      dueDate: "04 Jan 2026",
      primaryStatus: "Further Action Required",
      subStatus: "Vendor Portal Issue",
      previousStatus: "Invoice Copy Required",
      type: "reminder",
      label: "Portal Follow-up",
      source: "Portal rejection",
      evidence: "Customer portal issue is blocking invoice submission and needs PO clarification.",
      actionDetail: "Send email asking customer to confirm PO mapping and portal upload requirements.",
      scheduledAt: "Tomorrow, 10:30 AM",
      confidence: 79,
      risk: "Medium",
      email: {
        from: "Aditi Sharma <aditi@inebura.com>",
        to: "portal.support@apollopharmacy.com",
        cc: "finance@apollopharmacy.com",
        subject: "Portal upload issue for INV-10502",
        attachments: "Invoice_INV-10502.pdf, Portal_Rejection_INV-10502.png",
        body: "Dear Team,\n\nThe portal upload for INV-10502 was rejected due to PO reference/value mismatch. Please confirm the correct PO mapping or upload requirement so we can resubmit.\n\nRegards,\nAditi Sharma"
      },
      timeline: [
        ["10 Jun 2026, 06:20 PM", "Portal", "Upload rejected."],
        ["11 Jun 2026, 10:30 AM", "Reminder", "Portal follow-up scheduled."]
      ]
    },
    {
      id: "ai-10544-activity-material",
      invoiceNo: "INV-10544",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 142800,
      netDue: 142800,
      invoiceDate: "15 Dec 2025",
      dueDate: "14 Jan 2026",
      primaryStatus: "Material Delivery Issues",
      subStatus: "Partial Material Received",
      previousStatus: "Submitted and tracking",
      type: "activity",
      label: "Partial Material Received",
      source: "Email",
      evidence: "Customer reported that only part of the shipment was received and requested delivery confirmation.",
      actionDetail: "Prefill activity as Partial Material Received and route to operations for delivery proof.",
      scheduledAt: "Today, 05:15 PM",
      confidence: 86,
      risk: "Medium",
      email: null,
      timeline: [
        ["11 Jun 2026, 09:35 AM", "Email received", "Partial delivery reported."],
        ["11 Jun 2026, 11:00 AM", "AI signal", "Material issue disposition queued."]
      ]
    },
    {
      id: "ai-10544-visit-material",
      invoiceNo: "INV-10544",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 142800,
      netDue: 142800,
      invoiceDate: "15 Dec 2025",
      dueDate: "14 Jan 2026",
      primaryStatus: "Material Delivery Issues",
      subStatus: "Partial Material Received",
      previousStatus: "Submitted and tracking",
      type: "visit",
      label: "Delivery Confirmation",
      source: "Email",
      evidence: "Customer requested physical confirmation for partial shipment before payment processing.",
      actionDetail: "Suggest customer visit with reason Invoice Submission / delivery confirmation.",
      scheduledAt: "Next plan date",
      confidence: 75,
      risk: "Low",
      email: null,
      timeline: [
        ["11 Jun 2026, 09:35 AM", "Email received", "Partial shipment issue reported."],
        ["Visit module", "AI suggestion", "Delivery confirmation visit suggested."]
      ]
    },
    {
      id: "ai-10601-activity-pdc",
      invoiceNo: "INV-10601",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 221000,
      netDue: 221000,
      invoiceDate: "22 Dec 2025",
      dueDate: "21 Jan 2026",
      primaryStatus: "Collection In Progress",
      subStatus: "PDC Given",
      previousStatus: "Call Back",
      type: "activity",
      label: "PDC Tracking",
      source: "Email",
      evidence: "Customer confirmed PDC dispatch but did not share courier details.",
      actionDetail: "Create PDC tracking activity and request courier reference.",
      scheduledAt: "Today, 06:00 PM",
      confidence: 84,
      risk: "Low",
      email: null,
      timeline: [
        ["11 Jun 2026, 12:40 PM", "Email received", "PDC dispatch confirmed without tracking."],
        ["11 Jun 2026, 01:00 PM", "AI signal", "PDC tracking activity queued."]
      ]
    },
    {
      id: "ai-10601-email-pdc",
      invoiceNo: "INV-10601",
      customer: "Apollo Pharmacy Pvt Ltd",
      agent: "Aditi Sharma",
      manager: "Rohit Mehra",
      invoiceAmount: 221000,
      netDue: 221000,
      invoiceDate: "22 Dec 2025",
      dueDate: "21 Jan 2026",
      primaryStatus: "Collection In Progress",
      subStatus: "PDC Given",
      previousStatus: "Call Back",
      type: "email",
      label: "PDC Details Request",
      source: "Email",
      evidence: "Courier details are missing for dispatched PDC.",
      actionDetail: "Draft email asking for courier partner, tracking number, and expected delivery date.",
      scheduledAt: "Today, 06:05 PM",
      confidence: 85,
      risk: "Low",
      email: {
        from: "Aditi Sharma <aditi@inebura.com>",
        to: "finance@apollopharmacy.com",
        cc: "-",
        subject: "PDC tracking details for INV-10601",
        attachments: "Invoice_INV-10601.pdf",
        body: "Dear Team,\n\nThank you for confirming PDC dispatch for INV-10601. Please share courier partner, tracking number, and expected delivery date so we can update the invoice record.\n\nRegards,\nAditi Sharma"
      },
      timeline: [
        ["11 Jun 2026, 12:40 PM", "Email received", "PDC dispatch confirmed."],
        ["11 Jun 2026, 06:05 PM", "AI draft", "PDC tracking email queued."]
      ]
    }
  ];

  const state = {
    role: "agent",
    activeAgent: "Aditi Sharma",
    expandedInvoice: "",
    activeActionByInvoice: {},
    drawerId: "",
    drawerView: "email",
    search: "",
    actionType: "all",
    scheduleState: "all",
    decisions: loadDecisions()
  };

  function loadDecisions() {
    try {
      return JSON.parse(localStorage.getItem("ineburaAiActivityDecisions") || "{}") || {};
    } catch (_) {
      return {};
    }
  }

  function saveDecisions() {
    try {
      localStorage.setItem("ineburaAiActivityDecisions", JSON.stringify(state.decisions));
    } catch (_) {}
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function formatINR(value) {
    return Number(value || 0).toLocaleString("en-IN");
  }

  function getDecision(action) {
    const decision = state.decisions[action.id] || { state: "scheduled", reason: "", reviewer: "", decidedAt: "" };
    if (decision.state === "approved") return { ...decision, state: "scheduled" };
    if (decision.state === "rejected") return { ...decision, state: "revoked" };
    if (!["scheduled", "revoked", "later"].includes(decision.state)) return { ...decision, state: "scheduled" };
    return decision;
  }

  function getScheduleLabel(action) {
    const decision = getDecision(action);
    if (decision.state === "revoked") return "Revoked";
    if (decision.state === "later") return "Review later";
    return "Scheduled";
  }

  function isActionVisibleBySchedule(action) {
    if (state.scheduleState === "all") return true;
    return getDecision(action).state === state.scheduleState;
  }

  function getScopedActions() {
    return actions.filter((action) => {
      if (state.role === "agent") return action.agent === state.activeAgent;
      return state.activeAgent === "all" || action.agent === state.activeAgent;
    });
  }

  function getVisibleActions() {
    const query = state.search.trim().toLowerCase();
    return getScopedActions().filter((action) => {
      if (state.actionType !== "all" && action.type !== state.actionType) return false;
      if (!isActionVisibleBySchedule(action)) return false;
      if (!query) return true;
      return [
        action.invoiceNo,
        action.customer,
        action.agent,
        action.primaryStatus,
        action.subStatus,
        action.previousStatus,
        action.label,
        action.source,
        action.evidence,
        action.actionDetail
      ].some((value) => String(value).toLowerCase().includes(query));
    });
  }

  function groupByInvoice(list) {
    const map = new Map();
    list.forEach((action) => {
      if (!map.has(action.invoiceNo)) {
        map.set(action.invoiceNo, {
          invoiceNo: action.invoiceNo,
          customer: action.customer,
          agent: action.agent,
          manager: action.manager,
          invoiceAmount: action.invoiceAmount,
          netDue: action.netDue,
          invoiceDate: action.invoiceDate,
          dueDate: action.dueDate,
          primaryStatus: action.primaryStatus,
          subStatus: action.subStatus,
          previousStatus: action.previousStatus,
          actions: []
        });
      }
      map.get(action.invoiceNo).actions.push(action);
    });
    return Array.from(map.values());
  }

  function getVisibleInvoices() {
    return groupByInvoice(getVisibleActions());
  }

  function renderAgentStrip() {
    const strip = document.getElementById("aiManagerStrip");
    const chips = document.getElementById("aiAgentChips");
    if (!strip || !chips) return;
    strip.classList.toggle("hidden", state.role !== "manager");
    if (state.role !== "manager") return;

    const agents = Array.from(new Set(actions.map((action) => action.agent)));
    chips.innerHTML = [
      agentChip("all", `All agents (${actions.length})`),
      ...agents.map((agent) => {
        const count = actions.filter((action) => action.agent === agent).length;
        return agentChip(agent, `${agent} (${count})`);
      })
    ].join("");
  }

  function agentChip(agent, label) {
    return `<button type="button" class="aiAgentChip ${state.activeAgent === agent ? "is-active" : ""}" data-agent="${escapeHtml(agent)}">${escapeHtml(label)}</button>`;
  }

  function renderMetrics() {
    const strip = document.getElementById("aiMetricStrip");
    if (!strip) return;
    const scoped = getScopedActions();
    const scheduled = scoped.filter((action) => getDecision(action).state === "scheduled").length;
    const revoked = scoped.filter((action) => getDecision(action).state === "revoked").length;
    const email = scoped.filter((action) => action.type === "email" || action.type === "reminder").length;
    const visits = scoped.filter((action) => action.type === "visit").length;
    strip.innerHTML = [
      ["Scheduled", scheduled],
      ["Revoked", revoked],
      ["Email actions", email],
      ["Visit suggestions", visits]
    ].map(([label, value]) => `
      <span class="aiMetricChip">
        <strong>${value}</strong>
        ${escapeHtml(label)}
      </span>
    `).join("");
  }

  function renderTable() {
    const tbody = document.getElementById("aiInvoiceTableBody");
    const subtitle = document.getElementById("aiTableSubtitle");
    if (!tbody) return;

    const visibleInvoices = getVisibleInvoices();
    const visibleActions = getVisibleActions();
    const scopeLabel = state.role === "manager"
      ? (state.activeAgent === "all" ? "all agents" : state.activeAgent)
      : state.activeAgent;

    if (subtitle) {
      subtitle.textContent = `${visibleInvoices.length} invoices, ${visibleActions.length} AI actions for ${scopeLabel}`;
    }

    if (!visibleInvoices.length) {
      tbody.innerHTML = `<tr><td class="aiEmptyRow" colspan="12">No invoices match the current view.</td></tr>`;
      return;
    }

    tbody.innerHTML = visibleInvoices.map((invoice) => tableRow(invoice)).join("");
  }

  function tableRow(invoice) {
    const selected = invoice.invoiceNo === state.expandedInvoice ? "is-selected" : "";
    return `
      <tr class="${selected}" data-invoice-no="${escapeHtml(invoice.invoiceNo)}" tabindex="0">
        <td><span class="aiCellStrong">${escapeHtml(invoice.invoiceNo)}</span></td>
        <td>${escapeHtml(invoice.customer)}</td>
        <td class="numericCell">Rs. ${formatINR(invoice.invoiceAmount)}</td>
        <td class="numericCell">Rs. ${formatINR(invoice.netDue)}</td>
        <td>${escapeHtml(invoice.invoiceDate)}</td>
        <td>${escapeHtml(invoice.dueDate)}</td>
        <td>${escapeHtml(invoice.primaryStatus)}</td>
        <td>${escapeHtml(invoice.subStatus)}</td>
        <td>${escapeHtml(invoice.previousStatus)}</td>
        <td>${renderActionSummary(invoice.actions)}</td>
        <td>${renderScheduleSummary(invoice.actions)}</td>
        <td>
          <button type="button" class="aiReviewBtn" data-review-invoice="${escapeHtml(invoice.invoiceNo)}">
            Review
          </button>
        </td>
      </tr>
      ${invoice.invoiceNo === state.expandedInvoice ? expandedRow(invoice) : ""}
    `;
  }

  function renderActionSummary(invoiceActions) {
    const counts = invoiceActions.reduce((acc, action) => {
      acc[action.type] = (acc[action.type] || 0) + 1;
      return acc;
    }, {});
    return Object.entries(counts).map(([type, count]) => {
      const meta = actionTypeMeta[type] || actionTypeMeta.activity;
      return `<span class="aiPill ${escapeHtml(type)}"><i class="bi ${meta.icon}" aria-hidden="true"></i>${escapeHtml(meta.label)}${count > 1 ? ` ${count}` : ""}</span>`;
    }).join(" ");
  }

  function renderScheduleSummary(invoiceActions) {
    const scheduled = invoiceActions.filter((action) => getDecision(action).state === "scheduled").length;
    const revoked = invoiceActions.filter((action) => getDecision(action).state === "revoked").length;
    const later = invoiceActions.filter((action) => getDecision(action).state === "later").length;
    return `
      <span class="aiPill scheduled">${scheduled} scheduled</span>
      ${revoked ? `<span class="aiPill revoked">${revoked} revoked</span>` : ""}
      ${later ? `<span class="aiPill later">${later} later</span>` : ""}
    `;
  }

  function expandedRow(invoice) {
    const activeAction = getActiveAction(invoice);
    return `
      <tr class="aiExpandedRow">
        <td colspan="12">
          <div class="aiExpandedPanel">
            <div class="aiSuggestionReview">
              <div>
                <h3>AI suggested actions</h3>
                <p>These actions are scheduled and will run unless revoked.</p>
              </div>
              <div class="aiSuggestionPillRow">
                ${invoice.actions.map((action) => actionPill(action, activeAction)).join("")}
              </div>
            </div>
            ${activeAction ? actionDetailPanel(activeAction) : ""}
          </div>
        </td>
      </tr>
    `;
  }

  function getActiveAction(invoice) {
    const activeId = state.activeActionByInvoice[invoice.invoiceNo];
    return invoice.actions.find((action) => action.id === activeId) || invoice.actions[0] || null;
  }

  function actionPill(action, activeAction) {
    const meta = actionTypeMeta[action.type] || actionTypeMeta.activity;
    const isActive = activeAction?.id === action.id ? "is-active" : "";
    const stateLabel = getScheduleLabel(action);
    return `
      <button type="button" class="aiActionPill ${isActive}" data-action-pill="${escapeHtml(action.id)}">
        <i class="bi ${meta.icon}" aria-hidden="true"></i>
        <span>${escapeHtml(action.label)}</span>
        <em>${escapeHtml(stateLabel)}</em>
      </button>
    `;
  }

  function actionDetailPanel(action) {
    const decision = getDecision(action);
    const meta = actionTypeMeta[action.type] || actionTypeMeta.activity;
    return `
      <div class="aiActionDetailPanel">
        <div class="aiActionDetailHead">
          <div>
            <span class="aiPill ${escapeHtml(action.type)}"><i class="bi ${meta.icon}" aria-hidden="true"></i>${escapeHtml(meta.label)}</span>
            <h3>${escapeHtml(action.label)}</h3>
            <p>${escapeHtml(getScheduleLabel(action))} for ${escapeHtml(action.scheduledAt || "next available slot")}</p>
          </div>
          <span class="aiPill ${escapeHtml(decision.state)}">${escapeHtml(getScheduleLabel(action))}</span>
        </div>
        <div class="aiDetailGrid">
          ${kv("Source", action.source)}
          ${kv("Evidence", action.evidence)}
          ${kv("Action that will happen", action.actionDetail)}
          ${kv("Confidence / Risk", `${action.confidence}% / ${action.risk}`)}
        </div>
        ${compactEmail(action)}
        <div class="aiTimeline compact">
          ${action.timeline.map(([time, title, body]) => `
            <div class="aiTimelineItem">
              <strong>${escapeHtml(title)}</strong>
              <span>${escapeHtml(time)} | ${escapeHtml(body)}</span>
            </div>
          `).join("")}
        </div>
        <div class="aiExpandedActions">
          <button type="button" class="aiDecisionBtn approve" data-decision="scheduled" data-id="${escapeHtml(action.id)}">
            <i class="bi bi-check2" aria-hidden="true"></i>
            Keep scheduled
          </button>
          ${action.email ? `
            <button type="button" class="aiGhostBtn" data-drawer="email" data-id="${escapeHtml(action.id)}">
              <i class="bi bi-envelope-paper" aria-hidden="true"></i>
              View email
            </button>
          ` : ""}
          <button type="button" class="aiDecisionBtn later" data-decision="later" data-id="${escapeHtml(action.id)}">
            <i class="bi bi-bookmark" aria-hidden="true"></i>
            Review later
          </button>
          <button type="button" class="aiDecisionBtn reject" data-open-reject="${escapeHtml(action.id)}">
            <i class="bi bi-x-lg" aria-hidden="true"></i>
            Revoke
          </button>
        </div>
        <div class="aiRejectBox" id="aiRejectBox-${escapeHtml(action.id)}">
          <textarea data-reject-reason="${escapeHtml(action.id)}" placeholder="Reason for revoking this scheduled action...">${escapeHtml(decision.reason || "")}</textarea>
          <button type="button" class="aiDecisionBtn reject" data-decision="revoked" data-id="${escapeHtml(action.id)}">Confirm revoke</button>
        </div>
      </div>
    `;
  }

  function compactEmail(action) {
    if (!action.email) {
      return `<div class="aiCompactEmail"><strong>Email:</strong> No customer email will be sent for this action.</div>`;
    }

    return `
      <div class="aiCompactEmail">
        <div><strong>To:</strong> ${escapeHtml(action.email.to)}</div>
        <div><strong>Subject:</strong> ${escapeHtml(action.email.subject)}</div>
        <p>${escapeHtml(firstEmailLine(action.email.body))}</p>
      </div>
    `;
  }

  function firstEmailLine(body) {
    return String(body || "").split("\n").find((line) => line.trim()) || "";
  }

  function kv(label, value) {
    return `
      <div class="aiKv">
        <span>${escapeHtml(label)}</span>
        <strong>${escapeHtml(value)}</strong>
      </div>
    `;
  }

  function setDecision(id, nextState, reason = "") {
    state.decisions[id] = {
      state: nextState,
      reason,
      reviewer: state.role === "manager" ? "Manager reviewer" : state.activeAgent,
      decidedAt: new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      })
    };
    saveDecisions();
    renderMetrics();
    renderTable();
    if (state.drawerId === id) renderDrawer();
  }

  function renderAll() {
    renderMetrics();
    renderAgentStrip();
    renderTable();
  }

  function wireEvents() {
    document.querySelectorAll("[data-role]").forEach((button) => {
      button.addEventListener("click", () => {
        state.role = button.dataset.role || "agent";
        state.activeAgent = state.role === "manager" ? "all" : "Aditi Sharma";
        state.expandedInvoice = "";
        closeDrawer();
        document.querySelectorAll("[data-role]").forEach((item) => {
          const active = item.dataset.role === state.role;
          item.classList.toggle("is-active", active);
          item.setAttribute("aria-pressed", active ? "true" : "false");
        });
        renderAll();
      });
    });

    const search = document.getElementById("aiSearchInput");
    const actionFilter = document.getElementById("aiActionFilter");
    const scheduleFilter = document.getElementById("aiScheduleFilter");

    if (search) search.addEventListener("input", () => { state.search = search.value; renderTable(); });
    if (actionFilter) actionFilter.addEventListener("change", () => {
      state.actionType = actionFilter.value;
      state.expandedInvoice = "";
      renderTable();
    });
    if (scheduleFilter) scheduleFilter.addEventListener("change", () => {
      state.scheduleState = scheduleFilter.value;
      state.expandedInvoice = "";
      renderTable();
    });

    document.addEventListener("click", (event) => {
      const agentChip = event.target.closest("[data-agent]");
      if (agentChip) {
        state.activeAgent = agentChip.dataset.agent || "all";
        state.expandedInvoice = "";
        closeDrawer();
        renderAll();
        return;
      }

      const actionPill = event.target.closest("[data-action-pill]");
      if (actionPill) {
        const action = actions.find((item) => item.id === actionPill.dataset.actionPill);
        if (action) {
          state.activeActionByInvoice[action.invoiceNo] = action.id;
          renderTable();
        }
        return;
      }

      const drawerButton = event.target.closest("[data-drawer]");
      if (drawerButton) {
        event.stopPropagation();
        state.drawerId = drawerButton.dataset.id || "";
        state.drawerView = drawerButton.dataset.drawer || "email";
        renderDrawer();
        return;
      }

      if (event.target.closest("[data-drawer-close]") || event.target.id === "aiDrawerOverlay") {
        closeDrawer();
        return;
      }

      const openReject = event.target.closest("[data-open-reject]");
      if (openReject) {
        const id = openReject.dataset.openReject;
        const box = document.getElementById(`aiRejectBox-${id}`);
        if (box) box.classList.add("is-open");
        return;
      }

      const decisionButton = event.target.closest("[data-decision]");
      if (decisionButton) {
        event.stopPropagation();
        const id = decisionButton.dataset.id;
        const nextState = decisionButton.dataset.decision;
        const reason = nextState === "revoked"
          ? (document.querySelector(`[data-reject-reason="${CSS.escape(id)}"]`)?.value || "Revoked by reviewer")
          : "";
        setDecision(id, nextState, reason);
        return;
      }

      const reviewButton = event.target.closest("[data-review-invoice]");
      if (reviewButton) {
        const nextInvoice = reviewButton.dataset.reviewInvoice || "";
        state.expandedInvoice = state.expandedInvoice === nextInvoice ? "" : nextInvoice;
        renderTable();
        return;
      }

      const row = event.target.closest("[data-invoice-no]");
      if (row) {
        state.expandedInvoice = state.expandedInvoice === row.dataset.invoiceNo ? "" : row.dataset.invoiceNo || "";
        renderTable();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key !== "Enter") return;
      const row = event.target.closest("[data-invoice-no]");
      if (!row) return;
      state.expandedInvoice = row.dataset.invoiceNo || "";
      renderTable();
    });
  }

  function renderDrawer() {
    const overlay = document.getElementById("aiDrawerOverlay");
    const drawer = document.getElementById("aiDrawer");
    const action = actions.find((item) => item.id === state.drawerId);
    if (!overlay || !drawer || !action) return;

    overlay.classList.remove("hidden");
    overlay.setAttribute("aria-hidden", "false");
    drawer.innerHTML = `
      <div class="aiDrawerHeader">
        <div>
          <div class="aiEyebrow">Email Preview</div>
          <h2>${escapeHtml(action.invoiceNo)}</h2>
          <p>${escapeHtml(action.customer)} | ${escapeHtml(action.label)}</p>
        </div>
        <button type="button" class="aiIconBtn" data-drawer-close aria-label="Close details">
          <i class="bi bi-x-lg" aria-hidden="true"></i>
        </button>
      </div>
      ${action.email ? renderFullEmail(action) : `
        <div class="aiReviewBox">
          <h3>No email for this action</h3>
          <p>This recommendation updates workflow only. No customer email will be sent.</p>
        </div>
      `}
    `;
  }

  function renderFullEmail(action) {
    return `
      <div class="aiEmailPreview">
        <div class="aiEmailMeta">
          <div><strong>From:</strong> ${escapeHtml(action.email.from)}</div>
          <div><strong>To:</strong> ${escapeHtml(action.email.to)}</div>
          <div><strong>CC:</strong> ${escapeHtml(action.email.cc)}</div>
          <div><strong>Subject:</strong> ${escapeHtml(action.email.subject)}</div>
          <div><strong>Attachments:</strong> ${escapeHtml(action.email.attachments)}</div>
        </div>
        <div class="aiEmailBody">${escapeHtml(action.email.body)}</div>
      </div>
    `;
  }

  function closeDrawer() {
    state.drawerId = "";
    const overlay = document.getElementById("aiDrawerOverlay");
    const drawer = document.getElementById("aiDrawer");
    if (overlay) {
      overlay.classList.add("hidden");
      overlay.setAttribute("aria-hidden", "true");
    }
    if (drawer) drawer.innerHTML = "";
  }

  wireEvents();
  renderAll();
})();
