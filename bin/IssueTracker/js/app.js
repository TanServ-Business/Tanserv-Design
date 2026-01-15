(function() {
  // Dummy users for assignment
  const users = [
    'Anoop Sharma', 'Priya Verma', 'Rahul Jain', 'Neha Gupta', 'Rohit Malhotra', 'Devashish.Rattan'
  ];

  const companies = ['Acme Corp','Globex Inc','Initech'];
  const regions = ['North','South','East','West','Central'];
  const activities = ['Emailed','Phone','Portal','Meeting'];
  const primaries = ['Material Delivery Issues','Awaiting PO','Invoice Dispute','Payment Processing','Clarification Needed'];
  const broads = ['External dependency','Internal','Customer','Finance','Operations'];
  const subStatuses = [
    'Invoice Copy Required',
    'PO (Purchase Order) Copy Required',
    'Service/PM Report Required',
    'Compliance Docs (Salary, PF, Attendance & ESI) required',
    'Indeminity Bond Required',
    'BG/PBG Required',
    'GST Challan/ GST Certifcate by CA Required',
    'Delivery Challan Required',
    'Statutory Docs(PAN, GST Registration, Turnover Certifcate ) Required',
    'Wrong/Incorrect Billing',
    'Payment Wrongly Adjusted',
    'PO Cancelled/Contract Terminated',
    'Proposed For Write-Off',
    'Credit Note To Be Issued',
    'Vendor Portal Issue',
    'Reversal & Re-Bill',
    'Tax Issue On The Invoice',
    'Customized Invoice Required',
    'Discount Required',
    'Customer deduction',
    'Proposed for Cancellation',
    'Material Not Received',
    'Partial Material Received',
    'Damaged Material Received',
    'Late Shipment',
    'Wrong Material Delivered',
    'Material Delivered To Wrong Site',
    'Material Recalled/Returned',
    'PM Pending',
    'Equipment Not Working',
    'Call Not Attended',
    'Turnkey Project Issues',
    'Unsatisfactory Service Report By Customer',
    'Installation Pending',
    'Commissioning Pending',
    'Inspection Pending'
  ];
  const titles = ['Material Delivery Issue','Missing PO reference','Payment Verification','Address Mismatch','GST Mismatch','Quantity Dispute','Duplicate Invoice','Bank Details Clarification','Pending Approval','Awaiting Confirmation'];
  const agents = ['Anoop Sharma','Priya Verma','Rahul Jain','Neha Gupta','Rohit Malhotra','Devashish.Rattan'];
  const managers = ['Priya Verma','Rohit Malhotra','Sanjay Rao','Meera Iyer'];

  // Sample data generator: 5-6 invoices x 2-3 issues each
  function generateData() {
    // Limit to 3 customers and assign randomly per invoice (multiple invoices can belong to the same customer)
    const now = new Date();
    const arr = [];
    const numInvoices = 10 + Math.floor(Math.random() * 3); // 10 to 12
    for (let i = 1; i <= numInvoices; i++) {
      const cust = companies[Math.floor(Math.random() * companies.length)];
      const invId = `INV_${String(i).padStart(4,'0')}`;
      const invDate = new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - (i % 15)));
      const total = Math.floor(Math.random() * 900000) + 50000;
      const issues = [];
      const numIssues = 3 + Math.floor(Math.random() * 3); // 3 to 5
      for (let j = 1; j <= numIssues; j++) {
        const idx = (i * j) % titles.length;
        const title = titles[idx];
        // Ensure issue created date is never before the invoice date
        const createdRaw = new Date(now.getFullYear(), now.getMonth(), Math.max(1, now.getDate() - ((i + j) % 20)));
        const created = new Date(Math.max(createdRaw.getTime(), invDate.getTime()));
        const status = (j % 7 === 0) ? 'Resolved' : 'Open';
        const stage = status === 'Resolved' ? 3 : (j % 3);
        const act = activities[(i + j) % activities.length];
        const primary = primaries[(i + 2 * j) % primaries.length];
        const broad = broads[(i + 3 * j) % broads.length];
        const agent = agents[(i + j) % agents.length];
        const manager = managers[(i + 2 * j) % managers.length];
        const owner = agent;
        const dueAmt = Math.max(0, total - Math.floor(Math.random() * (total * 0.5)));
        const dueDate = new Date(invDate.getFullYear(), invDate.getMonth(), invDate.getDate() + 15 + (j % 10));
        const region = regions[(i + j) % regions.length];
        const id = `ISS_${String(i).padStart(4,'0')}_${String(j).padStart(2,'0')}`;
        const trail = [];
        if (stage >= 1) trail.push({ who: manager, what: 'approved the issue', type: 'approval', when: new Date(created.getTime() + 2 * 3600 * 1000).toISOString() });
        if (stage >= 2) trail.push({ who: owner, what: `assigned to action owner (${owner})`, type: 'assignment', when: new Date(created.getTime() + 6 * 3600 * 1000).toISOString() });
        if (Math.random() < 0.5) trail.push({ who: owner, what: 'updated remark', type: 'remark', when: new Date(created.getTime() + 8 * 3600 * 1000).toISOString(), remark: 'Initial remark on issue.' });
        if (status === 'Resolved') trail.push({ who: owner, what: 'marked the issue as resolved', type: 'closure', when: new Date(created.getTime() + 24 * 3600 * 1000).toISOString() });
        issues.push({
          id,
          title,
          status,
          created: created.toISOString().slice(0,10),
          description: `${title} for ${cust}.`,
          activityType: act,
          primaryStatus: primary,
          broadStatus: broad,
          subStatus: subStatuses[(i + j) % subStatuses.length],
          stage,
          agent,
          manager,
          fpr: `FPR-${100 + i * j}`,
          spr: `SPR-${200 + i * j}`,
          actionOwner: owner,
          invoiceDueAmount: dueAmt,
          invoiceDueDate: dueDate.toISOString().slice(0,10),
          region,
          actionTrail: trail
        });
      }
      arr.push({ id: invId, customer: cust, date: invDate.toISOString().slice(0,10), total, issues });
    }
    return arr;
  }

  // Base data and dynamic custom issues from localStorage
  const baseData = generateData();
  let data = baseData.slice();

  function readCustomIssues() {
    try {
      const raw = localStorage.getItem('customIssues');
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      return [];
    }
  }

  function rebuildDataWithCustomIssues() {
    data = baseData.slice();
    const custom = readCustomIssues();
    if (custom.length > 0) {
      // Ensure required minimal shape for issues
      const normalized = custom.map((iss, idx) => ({
        id: iss.id || `ISS_MAN_${Date.now()}_${idx}`,
        title: iss.title || (iss.subStatus ? String(iss.subStatus) : 'Manual Issue'),
        status: iss.status || 'Open',
        created: iss.created || new Date().toISOString().slice(0,10),
        description: iss.description || 'Added manually from Activity page.',
        activityType: iss.activityType || '-',
        primaryStatus: iss.primaryStatus || '-',
        broadStatus: iss.broadStatus || '-',
        subStatus: iss.subStatus || '-',
        stage: iss.stage != null ? iss.stage : 1,
        agent: iss.agent || '-',
        manager: iss.manager || '-',
        fpr: iss.fpr || '',
        spr: iss.spr || '',
        actionOwner: iss.actionOwner || '',
        approvalProcessId: iss.approvalProcessId || '',
        approvalProcessName: iss.approvalProcessName || '',
        invoiceDueAmount: iss.invoiceDueAmount != null ? iss.invoiceDueAmount : undefined,
        invoiceDueDate: iss.invoiceDueDate || undefined,
        region: iss.region || '',
        actionTrail: Array.isArray(iss.actionTrail) ? iss.actionTrail : []
      }));
      const inv = {
        id: 'INV_CUSTOM',
        customer: 'Manual Entries',
        date: new Date().toISOString().slice(0,10),
        total: 0,
        issues: normalized
      };
      data.push(inv);
    }
  }

  rebuildDataWithCustomIssues();

  const invoiceList = document.getElementById('invoice-list');
  const issueList = document.getElementById('issue-list');
  const detailView = document.getElementById('detail-view');
  const generatedTimeEl = document.getElementById('generated-time');
  const sortBtn = document.getElementById('invoice-sort-btn');
  const sortMenu = document.getElementById('invoice-sort-menu');
  const addIssueBtn = document.getElementById('add-issue-btn');
  const addIssueModal = document.getElementById('add-issue-modal');
  const addIssueForm = document.getElementById('add-issue-form');
  const addIssueClose = document.getElementById('add-issue-close');
  const addIssueCancel = document.getElementById('add-issue-cancel');
  const addIssueBroad = document.getElementById('new-issue-broad');
  const addIssuePrimary = document.getElementById('new-issue-primary');
  const addIssueSub = document.getElementById('new-issue-sub');
  const addIssueRemark = document.getElementById('new-issue-remark');
  const roleSelect = document.getElementById('role-select');
  const ROLE_STORAGE_KEY = 'issue_tracker_role';
  const ROLE_ACTIONS = {
    agent: ['assign-btn', 'email-btn', 'approval-process-btn', 'close-btn'],
    manager: ['approve-btn', 'assign-btn', 'email-btn', 'approval-process-btn'],
    'action-owner': ['assign-btn', 'resolution-btn', 'close-btn']
  };
  let currentRole = 'agent';
  let currentSort = 'none'; // 'valueDesc' | 'valueAsc' | 'daysDesc' | 'daysAsc' | 'none'
  let selectedInvoiceId = null;
  let selectedIssueId = null;

  // Utility: format dates and currency
  const fmtDate = (d) => new Date(d).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' });
  const fmtCurrency = (n) => new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' }).format(n);
  let trailIdSeed = 0;
  function ensureTrailId(entry) {
    if (entry && entry.trailId) return entry.trailId;
    trailIdSeed += 1;
    const id = `trail_${Date.now()}_${trailIdSeed}`;
    if (entry) entry.trailId = id;
    return id;
  }
  function normalizeTrailFiles(entry) {
    if (!entry || !Array.isArray(entry.files)) return [];
    const trailId = ensureTrailId(entry);
    const normalized = entry.files.map((file, idx) => {
      if (!file) return null;
      if (typeof file === 'string') {
        return { id: `${trailId}_file_${idx + 1}`, name: file, url: '', status: '' };
      }
      const name = file.name || `Document ${idx + 1}`;
      return {
        id: file.id || `${trailId}_file_${idx + 1}`,
        name,
        url: file.url || '',
        status: file.status || ''
      };
    }).filter(Boolean);
    entry.files = normalized;
    return normalized;
  }

  function normalizeRole(role) {
    const value = String(role || '').trim().toLowerCase();
    if (value === 'agent') return 'agent';
    if (value === 'manager') return 'manager';
    if (value === 'action-owner' || value === 'action_owner' || value === 'action owner') return 'action-owner';
    return 'agent';
  }

  function clearActionButtonHighlights() {
    document.querySelectorAll('.action-buttons .pill.is-highlighted').forEach(btn => {
      btn.classList.remove('is-highlighted');
    });
  }

  function resetActionPanels() {
    const panels = ['assign-panel', 'email-panel', 'approval-process-panel', 'resolution-panel', 'action-remark'];
    panels.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.classList.add('hidden');
        el.setAttribute('aria-hidden', 'true');
      }
    });
    const form = document.getElementById('trail-form');
    if (form) form.classList.remove('hidden');
    clearActionButtonHighlights();
  }

  function applyRoleToActions(role, issue) {
    const allowed = new Set(ROLE_ACTIONS[role] || ROLE_ACTIONS.agent);
    const statusLower = (issue && issue.status ? issue.status : '').toLowerCase();
    const isClosed = statusLower === 'resolved' || statusLower === 'closed';
    const setVisible = (id, visible) => {
      const btn = document.getElementById(id);
      if (!btn) return;
      btn.classList.toggle('hidden', !visible);
      btn.setAttribute('aria-hidden', String(!visible));
    };
    setVisible('approve-btn', allowed.has('approve-btn'));
    setVisible('assign-btn', allowed.has('assign-btn'));
    setVisible('email-btn', allowed.has('email-btn'));
    setVisible('approval-process-btn', allowed.has('approval-process-btn'));
    setVisible('resolution-btn', allowed.has('resolution-btn'));
    setVisible('close-btn', allowed.has('close-btn') && !isClosed);
    setVisible('reopen-btn', allowed.has('reopen-btn') && isClosed);
  }

  function getSelectedIssue() {
    const invoice = data.find(d => d.id === selectedInvoiceId);
    return invoice?.issues.find(i => i.id === selectedIssueId) || null;
  }

  function setRole(role, options) {
    const opts = options || {};
    const normalized = normalizeRole(role);
    currentRole = normalized;
    if (roleSelect) roleSelect.value = normalized;
    if (opts.persist) {
      try { localStorage.setItem(ROLE_STORAGE_KEY, normalized); } catch (_) {}
    }
    if (opts.resetPanels) resetActionPanels();
    applyRoleToActions(currentRole, getSelectedIssue());
  }

  if (roleSelect) {
    const stored = normalizeRole(localStorage.getItem(ROLE_STORAGE_KEY));
    setRole(stored, { persist: false, resetPanels: false });
    roleSelect.addEventListener('change', () => {
      setRole(roleSelect.value, { persist: true, resetPanels: true });
    });
  }

  // Fixed English month short names for consistent invoice range formatting
  const MONTHS_EN = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function fmtShortDateEn(d) {
    const dt = new Date(d);
    const m = MONTHS_EN[dt.getMonth()];
    const day = String(dt.getDate()).padStart(2,'0');
    const y = dt.getFullYear();
    return `${m} ${day}, ${y}`;
  }
  // Format a compact range like: "Nov 09 - Nov 25, 2025" (same year)
  // If years differ: "Dec 28, 2025 - Jan 03, 2026"
  function fmtDateRange(start, end) {
    const a = new Date(start);
    const b = new Date(end);
    const sameYear = a.getFullYear() === b.getFullYear();
    if (sameYear) {
      const year = a.getFullYear();
      const left = `${MONTHS_EN[a.getMonth()]} ${String(a.getDate()).padStart(2,'0')}`;
      const right = `${MONTHS_EN[b.getMonth()]} ${String(b.getDate()).padStart(2,'0')}, ${year}`;
      return `${left} - ${right}`;
    }
    return `${fmtShortDateEn(a)} - ${fmtShortDateEn(b)}`;
  }
  // Derive an invoice-level due date as the latest issue due date (if any)
  function getInvoiceDueDate(inv) {
    let maxTime = null;
    (inv.issues || []).forEach(iss => {
      const v = iss && iss.invoiceDueDate;
      if (!v) return;
      const t = new Date(v).getTime();
      if (isNaN(t)) return;
      if (maxTime === null || t > maxTime) maxTime = t;
    });
    return maxTime !== null ? new Date(maxTime) : null;
  }

  const APPROVAL_REQ_KEY = 'approval_requests';
  const APPROVAL_PROC_KEY = 'approval_processes';
  const APPROVAL_MAT_KEY = 'approval_matrices';

  function loadApprovalProcesses() {
    try {
      const raw = localStorage.getItem(APPROVAL_PROC_KEY);
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function loadApprovalMatrices() {
    try {
      const raw = localStorage.getItem(APPROVAL_MAT_KEY);
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function loadApprovalRequests() {
    try {
      const raw = localStorage.getItem(APPROVAL_REQ_KEY);
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveApprovalRequests(list) {
    try {
      localStorage.setItem(APPROVAL_REQ_KEY, JSON.stringify(list || []));
    } catch (_) {}
  }

  function seedApprovalDataIfMissing() {
    let processes = loadApprovalProcesses();
    let matrices = loadApprovalMatrices();
    let changed = false;

    if (!matrices.length) {
      matrices = [
        {
          id: 'MATRIX_INV_DELAY_DEFAULT',
          name: 'Invoice Delay Default',
          levels: [
            { level: 1, ownerName: 'Anoop Sharma', ownerEmail: 'anoop.sharma@example.com' },
            { level: 2, ownerName: 'Priya Verma', ownerEmail: 'priya.verma@example.com' },
            { level: 3, ownerName: 'Rohit Malhotra', ownerEmail: 'rohit.m@example.com' }
          ]
        },
        {
          id: 'MATRIX_PO_APPROVAL_DEFAULT',
          name: 'PO Approval Default',
          levels: [
            { level: 1, ownerName: 'Rahul Jain', ownerEmail: 'rahul.jain@example.com' },
            { level: 2, ownerName: 'Neha Gupta', ownerEmail: 'neha.gupta@example.com' },
            { level: 3, ownerName: 'Sanjay Rao', ownerEmail: 'sanjay.rao@example.com' }
          ]
        },
        {
          id: 'MATRIX_DELIVERY_CHALLAN_DEFAULT',
          name: 'Delivery Challan Default',
          levels: [
            { level: 1, ownerName: 'Arjun Patel', ownerEmail: 'arjun.patel@example.com' },
            { level: 2, ownerName: 'Meera Iyer', ownerEmail: 'meera.iyer@example.com' },
            { level: 3, ownerName: 'Compliance Team', ownerEmail: 'compliance@example.com' }
          ]
        }
      ];
      try { localStorage.setItem(APPROVAL_MAT_KEY, JSON.stringify(matrices)); } catch (_) {}
      changed = true;
    }

    if (!processes.length) {
      processes = [
        {
          id: 'PROC_INV_DELAY',
          process: 'Invoice Delay Resolution',
          invoiceSubStatus: 'Pending Verification',
          primaryStatus: 'In Progress',
          broadStatus: 'Amber',
          slaHours: 48,
          matrixId: matrices[0] ? matrices[0].id : '',
          activeIssues: 0
        },
        {
          id: 'PROC_PO_APPROVAL',
          process: 'PO Approval Follow-up',
          invoiceSubStatus: 'Verified',
          primaryStatus: 'Open',
          broadStatus: 'Green',
          slaHours: 72,
          matrixId: matrices[1] ? matrices[1].id : '',
          activeIssues: 0
        },
        {
          id: 'PROC_DELIVERY_CHALLAN',
          process: 'Delivery Challan Collection',
          invoiceSubStatus: 'Invoice Received',
          primaryStatus: 'Waiting on Vendor',
          broadStatus: 'Red',
          slaHours: 24,
          matrixId: matrices[2] ? matrices[2].id : '',
          activeIssues: 0
        }
      ];
      try { localStorage.setItem(APPROVAL_PROC_KEY, JSON.stringify(processes)); } catch (_) {}
      changed = true;
    }

    return { processes, matrices, changed };
  }

  function getApprovalSummary(issueId) {
    const list = loadApprovalRequests();
    const matched = list.filter(r => r && r.issue && r.issue.id === issueId);
    if (!matched.length) return null;
    matched.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));
    return matched[0];
  }

  function getApprovalTrailEntries(issueId) {
    const reqs = loadApprovalRequests();
    const entries = [];
    reqs.forEach(req => {
      if (!req || !req.issue || req.issue.id !== issueId) return;
      const processLabel = req.processName || req.processId || 'approval';
      (req.trail || []).forEach(entry => {
        const action = (entry.action || '').toLowerCase();
        let what = '';
        if (action === 'submitted') {
          what = `submitted for approval (${processLabel})`;
        } else if (action === 'approved') {
          const levelText = entry.level ? `Level ${entry.level}` : 'approval';
          what = `approved at ${levelText} (${processLabel})`;
        } else if (action === 'rejected') {
          const levelText = entry.level ? `Level ${entry.level}` : 'approval';
          what = `rejected at ${levelText} (${processLabel})`;
        } else {
          what = `${action} (${processLabel})`;
        }
        const when = entry.at || req.updatedAt || req.createdAt || new Date().toISOString();
        entries.push({
          approvalKey: `approval:${req.id}:${when}:${action}`,
          who: entry.by || 'Approver',
          what,
          type: action === 'rejected' ? 'closure' : 'approval',
          when,
          remark: entry.remark || '',
          files: entry.files || []
        });
      });
    });
    return entries;
  }

  function syncApprovalTrail(issue) {
    if (!issue) return;
    const entries = getApprovalTrailEntries(issue.id);
    if (!entries.length) return;
    issue.actionTrail = issue.actionTrail || [];
    const existing = new Set(issue.actionTrail.map(e => e.approvalKey).filter(Boolean));
    const existingSignatures = new Set(issue.actionTrail.map(e => `${e.when || ''}|${e.what || ''}`));
    entries.forEach(entry => {
      if (existing.has(entry.approvalKey)) return;
      if (existingSignatures.has(`${entry.when || ''}|${entry.what || ''}`)) return;
      issue.actionTrail.push(entry);
      existing.add(entry.approvalKey);
      existingSignatures.add(`${entry.when || ''}|${entry.what || ''}`);
    });
  }

  function getInvoiceSnapshot(invoice, issue) {
    const dueDate = getInvoiceDueDate(invoice);
    return {
      id: invoice.id,
      customer: invoice.customer,
      date: invoice.date,
      total: invoice.total,
      dueDate: dueDate ? dueDate.toISOString().slice(0, 10) : '',
      dueAmount: issue && issue.invoiceDueAmount != null ? issue.invoiceDueAmount : ''
    };
  }

  function getIssueSnapshot(issue) {
    return {
      id: issue.id,
      title: issue.title || '',
      status: issue.status || '',
      created: issue.created || '',
      description: issue.description || '',
      primaryStatus: issue.primaryStatus || '',
      broadStatus: issue.broadStatus || '',
      subStatus: issue.subStatus || '',
      actionOwner: issue.actionOwner || ''
    };
  }

  // ===== Sorting utilities for Invoices =====
  function daysBetween(d1, d2) {
    const ms = (new Date(d2)).setHours(0,0,0,0) - (new Date(d1)).setHours(0,0,0,0);
    return Math.max(0, Math.floor(ms / (24 * 3600 * 1000)));
  }
  function computeInvoiceDaysOpen(inv) {
    const today = new Date();
    let maxDays = 0;
    (inv.issues || []).forEach(iss => {
      const status = (iss.status || '').toLowerCase();
      if (status === 'open') {
        maxDays = Math.max(maxDays, daysBetween(iss.created, today));
      }
    });
    return maxDays; // 0 when no open issues
  }
  function getSortedInvoices() {
    const arr = data.slice();
    switch (currentSort) {
      case 'valueDesc':
        arr.sort((a,b) => b.total - a.total || a.id.localeCompare(b.id));
        break;
      case 'valueAsc':
        arr.sort((a,b) => a.total - b.total || a.id.localeCompare(b.id));
        break;
      case 'daysDesc':
        arr.sort((a,b) => computeInvoiceDaysOpen(b) - computeInvoiceDaysOpen(a) || a.id.localeCompare(b.id));
        break;
      case 'daysAsc':
        arr.sort((a,b) => computeInvoiceDaysOpen(a) - computeInvoiceDaysOpen(b) || a.id.localeCompare(b.id));
        break;
      default:
        // keep original order (by id) to be deterministic
        arr.sort((a,b) => a.id.localeCompare(b.id));
    }
    return arr;
  }
  function renderInvoicesSortedAndPreserveSelection() {
    const sorted = getSortedInvoices();
    renderInvoices(sorted);
    // restore selection if exists; otherwise select first
    const idToSelect = selectedInvoiceId && sorted.some(x=>x.id===selectedInvoiceId)
      ? selectedInvoiceId
      : (sorted[0]?.id || null);
    if (idToSelect) {
      // Avoid double-activating selection highlight by setting aria before calling select
      const el = invoiceList.querySelector(`[data-id="${CSS.escape(idToSelect)}"]`);
      if (el) el.setAttribute('aria-selected','true');
      selectInvoice(idToSelect);
    }
  }

  function clearSelected(list) {
    list.querySelectorAll('[aria-selected="true"]').forEach(el => el.setAttribute('aria-selected', 'false'));
  }

  function renderInvoices(invoices) {
    invoiceList.innerHTML = '';
    invoices.forEach((inv, idx) => {
      const li = document.createElement('li');
      li.className = 'list-item';
      li.setAttribute('role', 'option');
      li.setAttribute('tabindex', idx === 0 ? '0' : '-1');
      li.setAttribute('data-id', inv.id);
      li.setAttribute('aria-selected', 'false');
      // Highest Days Open across issues (status-agnostic)
      const maxDaysOpen = computeInvoiceDaysOpen(inv);
      // Derive invoice-level due date range display
      const dueDate = getInvoiceDueDate(inv);
      const dateDisplay = (dueDate && (new Date(dueDate).getTime() > new Date(inv.date).getTime()))
        ? fmtDateRange(inv.date, dueDate)
        : fmtDate(inv.date);
      li.innerHTML = `
        <span class="badge">${inv.customer}</span>
        <div>
          <div>${inv.id}</div>
          <div class="meta meta--stack">
            <div class="meta-top">${dateDisplay} • ${fmtCurrency(inv.total)}</div>
            <div class="meta-bottom"></div>
          </div>
        </div>
        <div class="aside aside--labels">
          <span class="chip chip--days" title="Highest days open among this invoice’s issues">Days: ${maxDaysOpen}</span>
          <span class="chip chip--count" aria-label="Issue count"> Issue${inv.issues.length === 1 ? '' : 's'}: ${inv.issues.length} </span>
        </div>
      `;
      li.addEventListener('click', () => selectInvoice(inv.id));
      li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectInvoice(inv.id); } });
      invoiceList.appendChild(li);
    });
  }

  function renderIssues(issues) {
    // Renders issues list/cards
    issueList.innerHTML = '';
    if (!issues || issues.length === 0) {
      const empty = document.createElement('li');
      empty.className = 'list-item';
      empty.textContent = 'No issues for this invoice.';
      empty.setAttribute('aria-disabled', 'true');
      issueList.appendChild(empty);
      detailView.innerHTML = '<p>Select an issue to see details.</p>';
      const trailList = document.getElementById('trail-list');
      if (trailList) trailList.innerHTML = '';
      return;
    }
    issues.forEach((iss, idx) => {
      const li = document.createElement('li');
      li.className = 'issue-card';
      li.setAttribute('role', 'option');
      li.setAttribute('tabindex', idx === 0 ? '0' : '-1');
      li.setAttribute('data-id', iss.id);
      li.setAttribute('aria-selected', 'false');

      // Card content
      const header = document.createElement('div');
      header.className = 'card-header';
      const status = (iss.status || 'Open');
      const statusLower = status.toLowerCase();
      const statusClass = statusLower === 'open' ? 'pill--success' : (statusLower === 'resolved' || statusLower === 'closed' ? 'pill--closed' : 'pill--secondary');
      const subStatus = iss.subStatus || '';
      header.innerHTML = `
        <span>${iss.id.replace('ISS_', 'ISS_')}</span>
        <span class="pill ${statusClass} status-pill">${status.toUpperCase()}</span>
      `;

      const body = document.createElement('div');
      body.className = 'card-body';
      body.innerHTML = `
        <div class="select-row">
          <div class="select-group">
            <label>Primary Status</label>
            <div class="static-value">${iss.primaryStatus}</div>
          </div>
          <div class="select-group">
            <label>Sub Status</label>
            <div class="static-value">${iss.subStatus}</div>
          </div>
          <div class="select-group">
            <label>Remarks</label>
            <div class="static-value">${iss.description || '-'}</div>
          </div>
        </div>
        <div class="stepper" aria-label="Progress">
          <div class="rail"><div class="fill" style="width: ${(iss.stage||0)/3*100}%"></div></div>
          <div class="dots">
            ${[0,1,2,3].map(s=>`<div class="dot ${iss.stage>=s?'active':''}"></div>`).join('')}
          </div>
          <div class="labels"><span>Created</span><span>Approved</span><span>Assigned</span><span>Closed</span></div>
        </div>
      `;


      li.appendChild(header);
      li.appendChild(body);

      li.addEventListener('click', () => {
        selectIssue(iss.id);
      });
      li.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); selectIssue(iss.id); } });
      issueList.appendChild(li);
    });
  }

  function fillSelectOptions(el, options, placeholder) {
    if (!el) return;
    el.innerHTML = '';
    const opt = document.createElement('option');
    opt.value = '';
    opt.textContent = placeholder;
    opt.disabled = true;
    opt.selected = true;
    el.appendChild(opt);
    options.forEach((value) => {
      const item = document.createElement('option');
      item.value = value;
      item.textContent = value;
      el.appendChild(item);
    });
  }

  function initAddIssueOptions() {
    fillSelectOptions(addIssueBroad, broads, 'Select broad status');
    fillSelectOptions(addIssuePrimary, primaries, 'Select primary status');
    fillSelectOptions(addIssueSub, subStatuses, 'Select sub status');
  }

  function resetAddIssueForm() {
    if (addIssueBroad) addIssueBroad.selectedIndex = 0;
    if (addIssuePrimary) addIssuePrimary.selectedIndex = 0;
    if (addIssueSub) addIssueSub.selectedIndex = 0;
    if (addIssueRemark) addIssueRemark.value = '';
  }

  function openAddIssueModal() {
    if (!selectedInvoiceId) {
      try { window.alert('Select an invoice first.'); } catch (_) {}
      return;
    }
    if (!addIssueModal) return;
    addIssueModal.classList.remove('hidden');
    addIssueModal.setAttribute('aria-hidden', 'false');
    if (addIssueBtn) addIssueBtn.setAttribute('aria-expanded', 'true');
    resetAddIssueForm();
    if (addIssueBroad) addIssueBroad.focus();
  }

  function closeAddIssueModal() {
    if (!addIssueModal) return;
    addIssueModal.classList.add('hidden');
    addIssueModal.setAttribute('aria-hidden', 'true');
    if (addIssueBtn) addIssueBtn.setAttribute('aria-expanded', 'false');
    if (addIssueBtn) addIssueBtn.focus();
  }

  function getIssueTemplate(invoice) {
    if (!invoice || !invoice.issues) return null;
    if (selectedIssueId) {
      const selected = invoice.issues.find(i => i.id === selectedIssueId);
      if (selected) return selected;
    }
    return invoice.issues[0] || null;
  }

  function nextIssueId(invoice) {
    const base = String(invoice.id || '').replace(/^INV_/, '');
    const existing = new Set((invoice.issues || []).map(i => i.id));
    let idx = (invoice.issues || []).length + 1;
    let candidate = `ISS_${base}_${String(idx).padStart(2,'0')}`;
    while (existing.has(candidate)) {
      idx += 1;
      candidate = `ISS_${base}_${String(idx).padStart(2,'0')}`;
    }
    return candidate;
  }

  function buildNewIssue(invoice, template, values) {
    const now = new Date();
    const base = template || {};
    const remark = values.remark || '';
    return {
      id: nextIssueId(invoice),
      title: values.subStatus || base.title || 'New Issue',
      status: 'Open',
      created: now.toISOString().slice(0,10),
      description: remark || (values.subStatus ? `${values.subStatus} for ${invoice.customer}.` : `Issue for ${invoice.customer}.`),
      activityType: base.activityType || '-',
      primaryStatus: values.primaryStatus || base.primaryStatus || '-',
      broadStatus: values.broadStatus || base.broadStatus || '-',
      subStatus: values.subStatus || base.subStatus || '-',
      stage: 0,
      agent: base.agent || '-',
      manager: base.manager || '-',
      fpr: base.fpr || '',
      spr: base.spr || '',
      actionOwner: base.actionOwner || '',
      invoiceDueAmount: base.invoiceDueAmount != null ? base.invoiceDueAmount : undefined,
      invoiceDueDate: base.invoiceDueDate || undefined,
      region: base.region || '',
      actionTrail: []
    };
  }

  // Helper: refresh issues list and preserve current selection
  function refreshIssueListFor(invoice, issueId) {
    renderIssues(invoice?.issues || []);
    if (issueId) {
      const el = issueList.querySelector(`[data-id="${CSS.escape(issueId)}"]`);
      if (el) el.setAttribute('aria-selected', 'true');
    }
  }

  function renderDetails(invoice, issue) {
    if (!issue) {
      detailView.innerHTML = '<p>Select an issue to see details.</p>';
      const tl = document.getElementById('trail-list');
      if (tl) tl.innerHTML = '';
      // Hide action launcher and action section when no issue
      const launcher = document.getElementById('action-launcher');
      const actionPanel = document.getElementById('action-panel');
      if (launcher) launcher.classList.add('hidden');
      if (actionPanel) { actionPanel.classList.add('hidden'); actionPanel.setAttribute('aria-hidden','true'); }
      return;
    }
    const approvalSummary = getApprovalSummary(issue.id);
    const approvalProcessName = approvalSummary
      ? (approvalSummary.processName || approvalSummary.processId || '-')
      : (issue.approvalProcessName || issue.approvalProcessId || '-');
    let approvalStatus = 'Not submitted';
    if (approvalSummary) {
      const levelText = approvalSummary.currentLevel ? ` (Level ${approvalSummary.currentLevel})` : '';
      approvalStatus = `${approvalSummary.status || 'pending'}${levelText}`;
    }
    detailView.innerHTML = `
      <div class="detail-head">
        <div class="head-left">
          <h3>${invoice.id} - ${issue.id}</h3>
          <p class="meta">Status: ${issue.status} - Created: ${fmtDate(issue.created)}</p>
          <p class="meta">Invoice: ${invoice.id} - ${invoice.customer} - ${fmtDate(invoice.date)} - ${fmtCurrency(invoice.total)}</p>
        </div>
        <div class="head-right">
          ${issue.subStatus ? `<span class="pill pill--sub" title="${issue.subStatus}">${issue.subStatus}</span>` : ''}
        </div>
      </div>
      <hr />
      <p>${issue.description}</p>
      <div class="details-grid">
        <div class="field"><span class="label">Agent</span><span class="value">${issue.agent || '-'}</span></div>
        <div class="field"><span class="label">Manager</span><span class="value">${issue.manager || '-'}</span></div>
        <div class="field"><span class="label">FPR</span><span class="value">${issue.fpr || '-'}</span></div>
        <div class="field"><span class="label">SPR</span><span class="value">${issue.spr || '-'}</span></div>
        <div class="field"><span class="label">Action Owner</span><span class="value">${issue.actionOwner || '-'}</span></div>
        <div class="field"><span class="label">Status</span><span class="value">${issue.status || '-'}</span></div>
        <div class="field"><span class="label">Approval Process</span><span class="value">${approvalProcessName}</span></div>
        <div class="field"><span class="label">Approval Status</span><span class="value">${approvalStatus}</span></div>
        <div class="field"><span class="label">Invoice Due Amount</span><span class="value">${issue.invoiceDueAmount != null ? fmtCurrency(issue.invoiceDueAmount) : '-'}</span></div>
        <div class="field"><span class="label">Invoice Due Date</span><span class="value">${issue.invoiceDueDate ? fmtDate(issue.invoiceDueDate) : '-'}</span></div>
        <div class="field"><span class="label">Region</span><span class="value">${issue.region || '-'}</span></div>
      </div>
      <hr />
    `;

    // Ensure launcher visible and action aside hidden until opened
    const launcher = document.getElementById('action-launcher');
    const newActionBtn = document.getElementById('new-action-btn');
    const actionPanel = document.getElementById('action-panel');
    if (launcher && newActionBtn && actionPanel) {
      launcher.classList.remove('hidden');
      actionPanel.classList.add('hidden');
      actionPanel.setAttribute('aria-hidden','true');
      newActionBtn.onclick = () => {
        actionPanel.classList.remove('hidden');
        actionPanel.setAttribute('aria-hidden','false');
        launcher.classList.add('hidden');
      };
    }

    // Render action trail
    syncApprovalTrail(issue);
    const trailList = document.getElementById('trail-list');
    if (trailList) {
      trailList.innerHTML = '';
      const sortedTrail = (issue.actionTrail || []).slice().sort((a,b) => new Date(b.when) - new Date(a.when));
      sortedTrail.forEach(entry => {
        const li = document.createElement('li');
        const when = new Date(entry.when).toLocaleString();
        const type = (entry.type || '').toLowerCase();
        li.className = `trail-item ${type ? 'trail-item--' + type : ''}`;
        const typeLabel = type ? `<span class="trail-type">${type.toUpperCase()}</span>` : '';
        const remarkBox = entry.remark ? `<textarea class="trail-remark" readonly>${entry.remark}</textarea>` : '';
        const trailId = ensureTrailId(entry);
        const files = normalizeTrailFiles(entry);
        const filesLine = files.length
          ? `<div class="trail-files">${files.map(file => {
              const status = (file.status || '').toLowerCase();
              const isAccepted = status === 'accepted';
              const isRejected = status === 'rejected';
              const statusLabel = isAccepted
                ? '<span class="trail-file__status is-accepted">Accepted</span>'
                : (isRejected ? '<span class="trail-file__status is-rejected">Rejected</span>' : '');
              const linkAttrs = file.url
                ? `href="${file.url}" download="${file.name}"`
                : 'href="#" data-doc-fallback="1"';
              return `
                <div class="trail-file">
                  <a class="trail-file__link" ${linkAttrs}>${file.name}</a>
                  <div class="trail-file__actions">
                    <button type="button" class="trail-file__btn trail-file__btn--accept ${isAccepted ? 'is-active' : ''}" data-doc-action="accept" data-trail-id="${trailId}" data-file-id="${file.id}">Accept</button>
                    <button type="button" class="trail-file__btn trail-file__btn--reject ${isRejected ? 'is-active' : ''}" data-doc-action="reject" data-trail-id="${trailId}" data-file-id="${file.id}">Reject</button>
                    ${statusLabel}
                  </div>
                </div>
              `;
            }).join('')}</div>`
          : '';
        li.innerHTML = `
          <div class="trail-head">
            ${typeLabel}
            <strong class="trail-who">${entry.who}</strong>
            <span class="trail-what">${entry.what || ''}</span>
            <span class="meta trail-when">${when}</span>
          </div>
          ${remarkBox}
          ${filesLine}
        `;
        trailList.appendChild(li);
      });
      trailList.onclick = (e) => {
        const actionBtn = e.target.closest('button[data-doc-action]');
        if (actionBtn) {
          const trailId = actionBtn.getAttribute('data-trail-id');
          const fileId = actionBtn.getAttribute('data-file-id');
          const action = actionBtn.getAttribute('data-doc-action');
          if (!trailId || !fileId || !action) return;
          const entry = (issue.actionTrail || []).find(item => item && item.trailId === trailId);
          if (!entry) return;
          const files = normalizeTrailFiles(entry);
          const file = files.find(item => item.id === fileId);
          if (!file) return;
          file.status = action === 'accept' ? 'accepted' : 'rejected';
          renderDetails(invoice, issue);
          return;
        }
        const downloadLink = e.target.closest('a[data-doc-fallback]');
        if (downloadLink) {
          e.preventDefault();
          try { window.alert('Document download is not available in this demo.'); } catch (_) {}
        }
      };
    }

    // Hook form
    const form = document.getElementById('trail-form');
    const input = document.getElementById('trail-remark');
    const fileInput = document.getElementById('trail-files');
    if (form && input) {
      form.onsubmit = (e) => {
        e.preventDefault();
        const text = input.value.trim();
        if (!text) return;
        const fileList = fileInput && fileInput.files ? Array.from(fileInput.files) : [];
        issue.actionTrail = issue.actionTrail || [];
        const entry = { who: 'You', what: 'updated remark', type: 'remark', when: new Date().toISOString(), remark: text };
        ensureTrailId(entry);
        if (fileList.length) {
          entry.what = `updated remark with ${fileList.length} document${fileList.length === 1 ? '' : 's'}`;
          entry.files = fileList.map((file, idx) => ({
            id: `${entry.trailId}_file_${idx + 1}`,
            name: file.name,
            url: URL.createObjectURL(file),
            status: ''
          }));
        }
        issue.actionTrail.push(entry);
        input.value = '';
        if (fileInput) fileInput.value = '';
        renderDetails(invoice, issue);
      };
    }

    // Hook action buttons
    const approveBtn = document.getElementById('approve-btn');
    const assignBtn = document.getElementById('assign-btn');
    const emailBtn = document.getElementById('email-btn');
    const approvalProcessBtn = document.getElementById('approval-process-btn');
    const resolutionBtn = document.getElementById('resolution-btn');
    const closeBtn = document.getElementById('close-btn');
    const reopenBtn = document.getElementById('reopen-btn');
    const assignPanel = document.getElementById('assign-panel');
    const assignOwnerSel = document.getElementById('assign-owner');
    const assignConfirm = document.getElementById('assign-confirm');
    const assignCancel = document.getElementById('assign-cancel');
    const assignRemark = document.getElementById('assign-remark');

    // Generic remark prompt elements for actions
    const actionRemark = document.getElementById('action-remark');
    const actionRemarkText = document.getElementById('action-remark-text');
    const actionRemarkConfirm = document.getElementById('action-remark-confirm');
    const actionRemarkCancel = document.getElementById('action-remark-cancel');
    const processSelect = document.getElementById('approval-process');
    const approvalProcessPanel = document.getElementById('approval-process-panel');
    const approvalProcessRemark = document.getElementById('approval-process-remark');
    const approvalProcessSave = document.getElementById('approval-process-save');

    function populateProcessOptions() {
      if (!processSelect) return;
      const seed = seedApprovalDataIfMissing();
      const processes = seed.processes;
      if (!processes.length) return;
      const currentValue = processSelect.value;
      processSelect.innerHTML = '';
      const ph = document.createElement('option');
      ph.value = '';
      ph.textContent = 'Select approval process';
      ph.disabled = true;
      ph.selected = true;
      processSelect.appendChild(ph);
      processes.forEach(p => {
        const opt = document.createElement('option');
        opt.value = p.id;
        opt.textContent = p.process || p.id;
        processSelect.appendChild(opt);
      });
      if (issue.approvalProcessId) {
        processSelect.value = issue.approvalProcessId;
      } else if (currentValue) {
        processSelect.value = currentValue;
      }
    }

    // Email action panel elements
    const emailPanel = document.getElementById('email-panel');
    const emailTypeSel = document.getElementById('email-type');
    const emailEscRow = document.getElementById('email-escalate-row');
    const emailRecipients = document.getElementById('email-recipients');
    const emailRemarkText = document.getElementById('email-remark-text');
    const emailSend = document.getElementById('email-send');
    const emailCancel = document.getElementById('email-cancel');

    // Resolution panel elements
    const resolutionPanel = document.getElementById('resolution-panel');
    const resolutionFiles = document.getElementById('resolution-files');
    const resolutionText = document.getElementById('resolution-text');
    const resolutionRemark = document.getElementById('resolution-remark');
    const resolutionSubmit = document.getElementById('resolution-submit');
    const resolutionCancel = document.getElementById('resolution-cancel');

    // Temporary highlight management (main color) for any click
    function clearHighlights() {
      clearActionButtonHighlights();
    }
    function highlightButton(btn) {
      clearHighlights();
      if (btn) btn.classList.add('is-highlighted');
    }
    // Ensure no stale highlight when rendering details for a new issue
    clearHighlights();

    function ensureAssignOptions() {
      if (!assignOwnerSel) return;
      const current = issue.actionOwner || '';
      assignOwnerSel.innerHTML = '';
      users.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u; opt.textContent = u; if (u === current) opt.selected = true; assignOwnerSel.appendChild(opt);
      });
    }

    function isVisible(el) {
      return !!(el && !el.classList.contains('hidden'));
    }

    // Helper to open/close generic remark prompt
    let pendingAction = null; // { type: 'approval'|'email'|'closure', buttonEl: HTMLElement }
    function openRemark(type, buttonEl) {
      // Ensure only one remark UI is visible at any time
      if (assignPanel) { assignPanel.classList.add('hidden'); assignPanel.setAttribute('aria-hidden', 'true'); }
      if (emailPanel) { emailPanel.classList.add('hidden'); emailPanel.setAttribute('aria-hidden', 'true'); }
      if (resolutionPanel) { resolutionPanel.classList.add('hidden'); resolutionPanel.setAttribute('aria-hidden', 'true'); }
      if (approvalProcessPanel) { approvalProcessPanel.classList.add('hidden'); approvalProcessPanel.setAttribute('aria-hidden', 'true'); }
      if (form) form.classList.add('hidden');
      pendingAction = { type, buttonEl };
      if (type === 'approval') {
        populateProcessOptions();
      }
      if (actionRemark && actionRemarkText) {
        actionRemark.classList.remove('hidden');
        actionRemark.setAttribute('aria-hidden','false');
        actionRemarkText.value = '';
        actionRemarkText.focus();
      }
    }
    function closeRemark() {
      pendingAction = null;
      if (actionRemark) { actionRemark.classList.add('hidden'); actionRemark.setAttribute('aria-hidden','true'); }
      if (actionRemarkText) actionRemarkText.value = '';
      if (form) form.classList.remove('hidden');
    }

    if (actionRemarkConfirm) {
      actionRemarkConfirm.onclick = () => {
        if (!pendingAction || !actionRemarkText) { closeRemark(); return; }
        const text = actionRemarkText.value.trim();
        if (!text) { try { window.alert('Remark is required.'); } catch(_) {} return; }
        issue.actionTrail = issue.actionTrail || [];
        const nowIso = new Date().toISOString();
        if (pendingAction.type === 'approval') {
          const selectedProcessId = (processSelect && processSelect.value) ? processSelect.value : (issue.approvalProcessId || '');
          if (!selectedProcessId) {
            issue.actionTrail.push({ who: 'You', what: 'approved the issue', type: 'approval', when: nowIso, remark: text });
            issue.stage = Math.max(issue.stage || 0, 1);
            if (pendingAction.buttonEl) pendingAction.buttonEl.classList.add('is-active');
          } else {
            const seed = seedApprovalDataIfMissing();
            const processes = seed.processes;
            const process = processes.find(p => p.id === selectedProcessId) || {
              id: selectedProcessId,
              process: processSelect && processSelect.selectedIndex > -1 ? processSelect.options[processSelect.selectedIndex].text : selectedProcessId,
              matrixId: ''
            };
            const matrices = seed.matrices.length ? seed.matrices : loadApprovalMatrices();
            const matrix = process.matrixId ? matrices.find(m => m.id === process.matrixId) : null;
            const levels = (matrix && Array.isArray(matrix.levels))
              ? matrix.levels.map((lvl, idx) => ({ level: idx + 1, ownerName: lvl.ownerName || '', ownerEmail: lvl.ownerEmail || '' }))
              : [];

            const reqs = loadApprovalRequests();
            let req = reqs.find(r => r && r.issue && r.issue.id === issue.id && r.processId === selectedProcessId && r.status === 'pending');
            if (!req) {
              req = {
                id: `REQ_${Date.now()}`,
                processId: process.id,
                processName: process.process || process.id,
                matrixId: process.matrixId || '',
                matrixName: matrix ? matrix.name : '',
                levels,
                currentLevel: 1,
                status: 'pending',
                createdAt: nowIso,
                updatedAt: nowIso,
                issue: getIssueSnapshot(issue),
                invoice: getInvoiceSnapshot(invoice, issue),
                trail: []
              };
              reqs.push(req);
            } else {
              req.processName = process.process || req.processName || process.id;
              req.matrixId = process.matrixId || req.matrixId || '';
              req.matrixName = matrix ? matrix.name : req.matrixName || '';
              if (levels.length) req.levels = levels;
              req.issue = getIssueSnapshot(issue);
              req.invoice = getInvoiceSnapshot(invoice, issue);
              req.updatedAt = nowIso;
            }
            req.trail = req.trail || [];
            req.trail.push({
              action: 'submitted',
              by: 'You',
              level: req.currentLevel || 1,
              at: nowIso,
              remark: text,
              files: []
            });
            saveApprovalRequests(reqs);

            issue.approvalProcessId = process.id;
            issue.approvalProcessName = process.process || process.id;
            const approvalKey = `approval:${req.id}:${nowIso}:submitted`;
            issue.actionTrail.push({ who: 'You', what: `submitted for approval (${process.process || process.id})`, type: 'approval', when: nowIso, remark: text, approvalKey });
            issue.stage = Math.max(issue.stage || 0, 1);
            if (pendingAction.buttonEl) pendingAction.buttonEl.classList.add('is-active');
          }
        } else if (pendingAction.type === 'email') {
          const target = issue.actionOwner || 'action owner';
          issue.actionTrail.push({ who: 'You', what: `re-sent email to ${target}`, type: 'email', when: nowIso, remark: text });
          if (pendingAction.buttonEl) pendingAction.buttonEl.classList.add('is-active');
          try { window.alert('Mock: Email re-sent to ' + target); } catch(_e) {}
        } else if (pendingAction.type === 'closure') {
          issue.status = 'Resolved';
          issue.stage = 3;
          issue.actionTrail.push({ who: 'You', what: 'marked the issue as resolved', type: 'closure', when: nowIso, remark: text });
          if (pendingAction.buttonEl) pendingAction.buttonEl.classList.add('is-active');
        } else if (pendingAction.type === 'reopen') {
          issue.status = 'Open';
          // Reset stage to Approved (1) to indicate reopened workflow (not closed)
          issue.stage = 1;
          issue.actionTrail.push({ who: 'You', what: 'reopened the issue', type: 'reopen', when: nowIso, remark: text });
          if (pendingAction.buttonEl) pendingAction.buttonEl.classList.add('is-active');
        }
        // Clear temporary highlight and close prompt
        clearHighlights();
        closeRemark();
        refreshIssueListFor(invoice, issue.id);
        renderDetails(invoice, issue);
        // Re-render invoices to refresh Days Open chips and maintain current selection/sort
        renderInvoicesSortedAndPreserveSelection();
      };
    }
    if (actionRemarkCancel) {
      actionRemarkCancel.onclick = () => { clearHighlights(); closeRemark(); };
    }

    if (approveBtn) {
      approveBtn.onclick = () => {
        if (isVisible(actionRemark) && pendingAction && pendingAction.type === 'approval') {
          closeRemark();
          clearHighlights();
          return;
        }
        highlightButton(approveBtn);
        openRemark('approval', approveBtn);
      };
    }

    if (assignBtn) {
      assignBtn.onclick = () => {
        if (isVisible(assignPanel)) {
          assignPanel.classList.add('hidden');
          assignPanel.setAttribute('aria-hidden', 'true');
          if (form) form.classList.remove('hidden');
          clearHighlights();
          return;
        }
        highlightButton(assignBtn);
        if (assignPanel) {
          // Ensure only one remark UI at a time: close generic remark if open
          closeRemark();
          if (emailPanel) { emailPanel.classList.add('hidden'); emailPanel.setAttribute('aria-hidden','true'); }
          if (resolutionPanel) { resolutionPanel.classList.add('hidden'); resolutionPanel.setAttribute('aria-hidden','true'); }
          if (approvalProcessPanel) { approvalProcessPanel.classList.add('hidden'); approvalProcessPanel.setAttribute('aria-hidden','true'); }
          ensureAssignOptions();
          assignPanel.classList.remove('hidden');
          assignPanel.setAttribute('aria-hidden', 'false');
          if (assignRemark) assignRemark.value = '';
          if (form) form.classList.add('hidden');
        }
      };
    }
    if (assignConfirm) {
      assignConfirm.onclick = () => {
        if (!assignOwnerSel) return;
        const name = assignOwnerSel.value;
        const remarkText = (assignRemark && assignRemark.value || '').trim();
        if (!remarkText) { try { window.alert('Remark is required to assign.'); } catch(_) {} return; }
        issue.actionOwner = name;
        issue.actionTrail = issue.actionTrail || [];
        issue.actionTrail.push({ who: 'You', what: `assigned to action owner (${name})`, type: 'assignment', when: new Date().toISOString(), remark: remarkText });
        issue.stage = Math.max(issue.stage || 0, 2);
        if (assignPanel) { assignPanel.classList.add('hidden'); assignPanel.setAttribute('aria-hidden', 'true'); }
        if (form) form.classList.remove('hidden');
        clearHighlights();
        if (assignBtn) assignBtn.classList.add('is-active');
        refreshIssueListFor(invoice, issue.id);
        renderDetails(invoice, issue);
      };
    }
    if (assignCancel) {
      assignCancel.onclick = () => {
        if (assignPanel) { assignPanel.classList.add('hidden'); assignPanel.setAttribute('aria-hidden', 'true'); }
        if (form) form.classList.remove('hidden');
        clearHighlights();
      };
    }

    // Email action behavior
    function setEmailEscRowVisibility() {
      if (!emailEscRow || !emailTypeSel) return;
      const isEsc = (emailTypeSel.value === 'escalate');
      emailEscRow.classList.toggle('hidden', !isEsc);
      emailEscRow.setAttribute('aria-hidden', String(!isEsc));
    }
    function openEmailPanel() {
      // ensure single panel visible
      if (assignPanel) { assignPanel.classList.add('hidden'); assignPanel.setAttribute('aria-hidden','true'); }
      if (resolutionPanel) { resolutionPanel.classList.add('hidden'); resolutionPanel.setAttribute('aria-hidden','true'); }
      if (approvalProcessPanel) { approvalProcessPanel.classList.add('hidden'); approvalProcessPanel.setAttribute('aria-hidden','true'); }
      closeRemark();
      if (form) form.classList.add('hidden');
      if (emailPanel) {
        emailPanel.classList.remove('hidden');
        emailPanel.setAttribute('aria-hidden','false');
      }
      if (emailTypeSel) { emailTypeSel.value = 'reminder'; }
      if (emailRecipients) { emailRecipients.value = ''; }
      if (emailRemarkText) { emailRemarkText.value = ''; }
      setEmailEscRowVisibility();
      if (emailTypeSel) emailTypeSel.focus();
    }
    if (emailTypeSel) {
      emailTypeSel.onchange = setEmailEscRowVisibility;
    }
    if (emailBtn) {
      emailBtn.onclick = () => {
        if (isVisible(emailPanel)) {
          if (emailPanel) { emailPanel.classList.add('hidden'); emailPanel.setAttribute('aria-hidden','true'); }
          if (form) form.classList.remove('hidden');
          clearHighlights();
          return;
        }
        highlightButton(emailBtn);
        openEmailPanel();
      };
    }
    if (emailCancel) {
      emailCancel.onclick = () => {
        if (emailPanel) { emailPanel.classList.add('hidden'); emailPanel.setAttribute('aria-hidden','true'); }
        if (form) form.classList.remove('hidden');
        clearHighlights();
        if (emailBtn) emailBtn.focus();
      };
    }

    function openResolutionPanel() {
      if (assignPanel) { assignPanel.classList.add('hidden'); assignPanel.setAttribute('aria-hidden','true'); }
      if (emailPanel) { emailPanel.classList.add('hidden'); emailPanel.setAttribute('aria-hidden','true'); }
      if (approvalProcessPanel) { approvalProcessPanel.classList.add('hidden'); approvalProcessPanel.setAttribute('aria-hidden','true'); }
      closeRemark();
      if (form) form.classList.add('hidden');
      if (resolutionPanel) {
        resolutionPanel.classList.remove('hidden');
        resolutionPanel.setAttribute('aria-hidden','false');
      }
      if (resolutionText) resolutionText.value = '';
      if (resolutionRemark) resolutionRemark.value = '';
      if (resolutionFiles) resolutionFiles.value = '';
      if (resolutionText) resolutionText.focus();
    }

    function closeResolutionPanel() {
      if (resolutionPanel) { resolutionPanel.classList.add('hidden'); resolutionPanel.setAttribute('aria-hidden','true'); }
      if (form) form.classList.remove('hidden');
    }

    if (resolutionBtn) {
      resolutionBtn.onclick = () => {
        if (isVisible(resolutionPanel)) {
          closeResolutionPanel();
          clearHighlights();
          return;
        }
        highlightButton(resolutionBtn);
        openResolutionPanel();
      };
    }

    if (resolutionCancel) {
      resolutionCancel.onclick = () => {
        closeResolutionPanel();
        clearHighlights();
        if (resolutionBtn) resolutionBtn.focus();
      };
    }

    if (resolutionSubmit) {
      resolutionSubmit.onclick = () => {
        const resolution = (resolutionText && resolutionText.value || '').trim();
        const remark = (resolutionRemark && resolutionRemark.value || '').trim();
        if (!resolution) { try { window.alert('Resolution summary is required.'); } catch(_) {} return; }
        const fileList = resolutionFiles && resolutionFiles.files ? Array.from(resolutionFiles.files) : [];
        const fileLabel = fileList.length ? ` with ${fileList.length} document${fileList.length === 1 ? '' : 's'}` : '';
        const remarkText = remark ? `Resolution: ${resolution}\nRemark: ${remark}` : `Resolution: ${resolution}`;
        issue.actionTrail = issue.actionTrail || [];
        const entry = {
          who: 'You',
          what: `submitted resolution${fileLabel}`,
          type: 'resolution',
          when: new Date().toISOString(),
          remark: remarkText
        };
        ensureTrailId(entry);
        entry.files = fileList.map((file, idx) => ({
          id: `${entry.trailId}_file_${idx + 1}`,
          name: file.name,
          url: URL.createObjectURL(file),
          status: ''
        }));
        issue.actionTrail.push(entry);
        issue.status = 'Resolved';
        issue.stage = 3;
        closeResolutionPanel();
        clearHighlights();
        if (resolutionBtn) resolutionBtn.classList.add('is-active');
        refreshIssueListFor(invoice, issue.id);
        renderDetails(invoice, issue);
        renderInvoicesSortedAndPreserveSelection();
      };
    }

    if (approvalProcessBtn) {
      approvalProcessBtn.onclick = () => {
        if (isVisible(approvalProcessPanel)) {
          approvalProcessPanel.classList.add('hidden');
          approvalProcessPanel.setAttribute('aria-hidden', 'true');
          if (form) form.classList.remove('hidden');
          clearHighlights();
          return;
        }
        highlightButton(approvalProcessBtn);
        populateProcessOptions();
        if (assignPanel) { assignPanel.classList.add('hidden'); assignPanel.setAttribute('aria-hidden','true'); }
        if (emailPanel) { emailPanel.classList.add('hidden'); emailPanel.setAttribute('aria-hidden','true'); }
        if (resolutionPanel) { resolutionPanel.classList.add('hidden'); resolutionPanel.setAttribute('aria-hidden','true'); }
        closeRemark();
        if (approvalProcessPanel) {
          approvalProcessPanel.classList.remove('hidden');
          approvalProcessPanel.setAttribute('aria-hidden', 'false');
          if (form) form.classList.add('hidden');
          if (approvalProcessRemark) approvalProcessRemark.value = '';
        }
      };
    }

    if (approvalProcessSave) {
      approvalProcessSave.onclick = () => {
        if (!processSelect) return;
        const selectedProcessId = processSelect.value;
        if (!selectedProcessId) { try { window.alert('Please choose an approval process.'); } catch(_) {} return; }
        const selectedOption = processSelect.options[processSelect.selectedIndex];
        const processName = selectedOption ? selectedOption.text : selectedProcessId;
        const remark = approvalProcessRemark ? approvalProcessRemark.value.trim() : '';
        const nowIso = new Date().toISOString();

        issue.approvalProcessId = selectedProcessId;
        issue.approvalProcessName = processName;
        issue.actionTrail = issue.actionTrail || [];
        issue.actionTrail.push({
          who: 'You',
          what: `selected approval process (${processName})`,
          type: 'assigned',
          when: nowIso,
          remark
        });

        if (approvalProcessPanel) { approvalProcessPanel.classList.add('hidden'); approvalProcessPanel.setAttribute('aria-hidden', 'true'); }
        if (form) form.classList.remove('hidden');
        clearHighlights();
        if (approvalProcessBtn) approvalProcessBtn.classList.add('is-active');
        refreshIssueListFor(invoice, issue.id);
        renderDetails(invoice, issue);
      };
    }

    applyRoleToActions(currentRole, issue);

    if (reopenBtn) {
      reopenBtn.onclick = () => {
        if (isVisible(actionRemark) && pendingAction && pendingAction.type === 'reopen') {
          closeRemark();
          clearHighlights();
          return;
        }
        highlightButton(reopenBtn);
        // ensure only one panel visible
        if (assignPanel) { assignPanel.classList.add('hidden'); assignPanel.setAttribute('aria-hidden','true'); }
        if (emailPanel) { emailPanel.classList.add('hidden'); emailPanel.setAttribute('aria-hidden','true'); }
        if (resolutionPanel) { resolutionPanel.classList.add('hidden'); resolutionPanel.setAttribute('aria-hidden','true'); }
        if (approvalProcessPanel) { approvalProcessPanel.classList.add('hidden'); approvalProcessPanel.setAttribute('aria-hidden','true'); }
        if (form) form.classList.add('hidden');
        openRemark('reopen', reopenBtn);
      };
    }

    function parseEmails(raw) {
      return raw.split(/[ ,;]+/).map(s=>s.trim()).filter(Boolean);
    }
    function isValidEmail(s) {
      // basic email regex
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
    }
    if (emailSend) {
      emailSend.onclick = () => {
        const kind = emailTypeSel ? emailTypeSel.value : 'reminder';
        const remark = (emailRemarkText && emailRemarkText.value || '').trim();
        if (!remark) { try { window.alert('Remark is required.'); } catch(_) {} return; }
        let recipients = [];
        if (kind === 'escalate') {
          const raw = (emailRecipients && emailRecipients.value || '').trim();
          if (!raw) { try { window.alert('Please enter at least one email for escalation.'); } catch(_) {} return; }
          recipients = parseEmails(raw);
          if (!recipients.length || !recipients.every(isValidEmail)) {
            try { window.alert('One or more email addresses are invalid.'); } catch(_) {}
            return;
          }
        }
        issue.actionTrail = issue.actionTrail || [];
        const nowIso = new Date().toISOString();
        let what = '';
        if (kind === 'reminder') {
          const target = issue.actionOwner || 'action owner';
          what = `re-sent reminder email to ${target}`;
        } else {
          const preview = recipients.slice(0, 3).join(', ');
          const extra = recipients.length > 3 ? `, +${recipients.length - 3} more` : '';
          what = `sent escalation email to ${preview}${extra}`;
        }
        const trailEntry = { who: 'You', what, type: 'email', when: nowIso, remark };
        if (kind === 'escalate') trailEntry.recipients = recipients;
        issue.actionTrail.push(trailEntry);
        // close panel and refresh
        if (emailPanel) { emailPanel.classList.add('hidden'); emailPanel.setAttribute('aria-hidden','true'); }
        if (form) form.classList.remove('hidden');
        clearHighlights();
        if (emailBtn) emailBtn.classList.add('is-active');
        try { window.alert(kind === 'reminder' ? 'Mock: Reminder email re-sent.' : 'Mock: Escalation email sent.'); } catch(_e) {}
        refreshIssueListFor(invoice, issue.id);
        renderDetails(invoice, issue);
        if (emailBtn) emailBtn.focus();
      };
    }
    if (closeBtn) {
      closeBtn.onclick = () => {
        if (isVisible(actionRemark) && pendingAction && pendingAction.type === 'closure') {
          closeRemark();
          clearHighlights();
          return;
        }
        highlightButton(closeBtn);
        openRemark('closure', closeBtn);
      };
    }
  }

  function selectInvoice(id) {
    selectedInvoiceId = id;
    selectedIssueId = null;
    // highlight selection
    clearSelected(invoiceList);
    const el = invoiceList.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (el) el.setAttribute('aria-selected', 'true');

    const invoice = data.find(d => d.id === id);
    const issues = invoice?.issues || [];
    renderIssues(issues);

    // Always auto-load the first issue's details if available
    if (issues.length > 0) {
      const firstIssue = issues[0];
      selectedIssueId = firstIssue.id;
      const issueEl = issueList.querySelector(`[data-id="${CSS.escape(firstIssue.id)}"]`);
      if (issueEl) issueEl.setAttribute('aria-selected', 'true');
      renderDetails(invoice, firstIssue);
    } else {
      renderDetails(invoice, null);
    }
  }

  function selectIssue(id) {
    selectedIssueId = id;
    clearSelected(issueList);
    const el = issueList.querySelector(`[data-id="${CSS.escape(id)}"]`);
    if (el) el.setAttribute('aria-selected', 'true');

    const invoice = data.find(d => d.id === selectedInvoiceId);
    const issue = invoice?.issues.find(i => i.id === id);
    renderDetails(invoice, issue);
  }

  // ===== Sort control wiring =====
  if (sortBtn && sortMenu) {
    const items = Array.from(sortMenu.querySelectorAll('.sort-item'));
    function markActive() {
      items.forEach(it => {
        it.classList.toggle('is-active', it.dataset.sort === currentSort);
      });
    }
    function openMenu() {
      sortMenu.classList.remove('hidden');
      sortBtn.setAttribute('aria-expanded','true');
      markActive();
    }
    function closeMenu() {
      sortMenu.classList.add('hidden');
      sortBtn.setAttribute('aria-expanded','false');
    }
    function toggleMenu() { if (sortMenu.classList.contains('hidden')) openMenu(); else closeMenu(); }

    // Click to open/close
    sortBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleMenu();
      if (!sortMenu.classList.contains('hidden')) {
        // focus first item
        const first = items[0];
        if (first) first.focus();
      }
    });

    // Select option
    items.forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        currentSort = btn.dataset.sort;
        markActive();
        closeMenu();
        // Re-render
        renderInvoicesSortedAndPreserveSelection();
        // Return focus to trigger for accessibility
        sortBtn.focus();
      });
    });

    // Keyboard support on trigger
    sortBtn.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowDown' || e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openMenu();
        const first = items[0];
        if (first) first.focus();
      }
    });

    // Keyboard navigation within menu
    sortMenu.addEventListener('keydown', (e) => {
      const focusables = items;
      const idx = focusables.indexOf(document.activeElement);
      if (e.key === 'Escape') {
        e.preventDefault();
        closeMenu();
        sortBtn.focus();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        const next = focusables[(idx + 1) % focusables.length] || focusables[0];
        if (next) next.focus();
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = focusables[(idx - 1 + focusables.length) % focusables.length] || focusables[0];
        if (prev) prev.focus();
      } else if (e.key === 'Home') {
        e.preventDefault();
        if (focusables[0]) focusables[0].focus();
      } else if (e.key === 'End') {
        e.preventDefault();
        if (focusables[focusables.length - 1]) focusables[focusables.length - 1].focus();
      } else if (e.key === 'Enter' || e.key === ' ') {
        // Activate current item
        const el = document.activeElement;
        if (el && el.classList.contains('sort-item')) {
          el.click();
        }
      }
    });

    // Outside click closes
    window.addEventListener('mousedown', (e) => {
      if (!sortMenu.classList.contains('hidden')) {
        if (!sortMenu.contains(e.target) && e.target !== sortBtn) {
          closeMenu();
        }
      }
    });
  }

  if (addIssueBtn) {
    addIssueBtn.addEventListener('click', openAddIssueModal);
  }
  if (addIssueClose) {
    addIssueClose.addEventListener('click', closeAddIssueModal);
  }
  if (addIssueCancel) {
    addIssueCancel.addEventListener('click', closeAddIssueModal);
  }
  if (addIssueModal) {
    addIssueModal.addEventListener('click', (e) => {
      if (e.target === addIssueModal) closeAddIssueModal();
    });
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && addIssueModal && !addIssueModal.classList.contains('hidden')) {
      closeAddIssueModal();
    }
  });
  if (addIssueForm) {
    addIssueForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const broad = addIssueBroad ? addIssueBroad.value : '';
      const primary = addIssuePrimary ? addIssuePrimary.value : '';
      const sub = addIssueSub ? addIssueSub.value : '';
      const remark = (addIssueRemark && addIssueRemark.value || '').trim();
      if (!broad || !primary || !sub) {
        try { window.alert('Please select broad, primary, and sub status.'); } catch (_) {}
        return;
      }
      if (!remark) {
        try { window.alert('Agent remark is required.'); } catch (_) {}
        return;
      }
      const invoice = data.find(d => d.id === selectedInvoiceId);
      if (!invoice) {
        try { window.alert('Select an invoice first.'); } catch (_) {}
        return;
      }
      const template = getIssueTemplate(invoice);
      const newIssue = buildNewIssue(invoice, template, {
        broadStatus: broad,
        primaryStatus: primary,
        subStatus: sub,
        remark
      });
      const nowIso = new Date().toISOString();
      newIssue.actionTrail.push({ who: 'You', what: 'created issue', type: 'remark', when: nowIso, remark });
      invoice.issues = invoice.issues || [];
      invoice.issues.unshift(newIssue);
      closeAddIssueModal();
      const newIssueId = newIssue.id;
      renderInvoicesSortedAndPreserveSelection();
      if (selectedInvoiceId) {
        selectIssue(newIssueId);
      }
    });
  }

  // Initialize
  initAddIssueOptions();
  renderInvoicesSortedAndPreserveSelection();

  // Ensure details open when any issue card is clicked (event delegation safety)
  if (issueList) {
    issueList.addEventListener('click', (e) => {
      const card = e.target.closest('.issue-card');
      if (card && card.dataset.id) {
        selectIssue(card.dataset.id);
      }
    });
    issueList.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        const card = e.target.closest('.issue-card');
        if (card && card.dataset.id) {
          e.preventDefault();
          selectIssue(card.dataset.id);
        }
      }
    });
  }

  // Preselect first invoice if none selected yet (after initial sorted render)
  if (data.length && !selectedInvoiceId) {
    selectInvoice(data[0].id);
  }

  // Generated time
  if (generatedTimeEl) {
    const now = new Date();
    try {
      generatedTimeEl.textContent = now.toLocaleString();
      generatedTimeEl.setAttribute('datetime', now.toISOString());
    } catch(e) {
      generatedTimeEl.textContent = now.toString();
    }
  }

  // Listen for changes to localStorage from other tabs/windows and refresh
  window.addEventListener('storage', (e) => {
    if (e && e.key === 'customIssues') {
      const prevSelectedInvoice = selectedInvoiceId;
      const prevSelectedIssue = selectedIssueId;
      rebuildDataWithCustomIssues();
      renderInvoicesSortedAndPreserveSelection();
      // Try to restore selection if still present
      if (prevSelectedInvoice && data.some(d => d.id === prevSelectedInvoice)) {
        selectInvoice(prevSelectedInvoice);
        if (prevSelectedIssue) {
          const inv = data.find(d => d.id === prevSelectedInvoice);
          const exists = inv && inv.issues && inv.issues.some(i => i.id === prevSelectedIssue);
          if (exists) selectIssue(prevSelectedIssue);
      }
      }
    }
  });
})();
