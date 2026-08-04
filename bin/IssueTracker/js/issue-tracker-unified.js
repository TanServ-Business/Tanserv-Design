(function () {
  'use strict';

  const KEYS = {
    base: 'issueTrackerBaseData',
    custom: 'customIssues',
    processes: 'approval_processes',
    matrices: 'approval_matrices',
    requests: 'approval_requests',
    role: 'issue_tracker_role',
    activeUser: 'issue_tracker_active_user',
    activeApprover: 'approver_active_user'
  };
  const PAGE_SIZE = 5;
  const USERS = ['Rahul Jain', 'Meera Iyer', 'Arjun Patel', 'Priya Verma', 'Neha Gupta', 'Sanjay Rao', 'Compliance Team'];
  const PRIMARY_STATUSES = ['Payment Processing', 'Material Delivery Issues', 'Invoice Dispute', 'Clarification Needed'];
  const SUB_STATUSES = ['Delivery Challan Required', 'Invoice Rebill Required', 'Manager Approval', 'Review Resolution', 'Further Documents Required', 'Service/PM Report Required', 'Payment Verification', 'PO Copy Required'];

  const read = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value == null ? fallback : value;
    } catch (_) { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  };
  const esc = (value) => String(value == null ? '' : value)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#039;');
  const id = (prefix) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const isoNow = () => new Date().toISOString();
  const cleanName = (value) => String(value || '').replace(/\s*<[^>]+>\s*/g, '').trim();
  const isClosed = (issue) => /closed|resolved/i.test(issue?.status || '');
  const money = (value) => `₹${Math.round(Number(value || 0)).toLocaleString('en-IN')}`;
  const prettyDate = (value) => {
    if (!value) return '—';
    const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
    if (Number.isNaN(date.getTime())) return String(value);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };
  const shortDateTime = (value) => {
    const date = new Date(value || Date.now());
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });
  };
  const issueOpenDays = (issue) => {
    if (!issue?.created || isClosed(issue)) return '—';
    const created = new Date(`${String(issue.created).slice(0, 10)}T00:00:00`);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (Number.isNaN(created.getTime())) return '—';
    return Math.max(1, Math.floor((today - created) / 86400000) + 1);
  };
  const toast = (message, tone) => {
    const node = document.getElementById('issue-toast');
    if (!node) return;
    node.textContent = message;
    node.className = `issueToast${tone ? ` is-${tone}` : ''}`;
    clearTimeout(toast.timer);
    toast.timer = setTimeout(() => node.classList.add('hidden'), 3000);
  };

  function seedApprovals() {
    let matrices = read(KEYS.matrices, []);
    let processes = read(KEYS.processes, []);
    if (!Array.isArray(matrices) || !matrices.length) {
      matrices = [
        { id: 'MATRIX_INV_DELAY_DEFAULT', name: 'Invoice Delay Default', levels: [
          { level: 1, ownerName: 'Anoop Sharma', ownerEmail: 'anoop.sharma@example.com' },
          { level: 2, ownerName: 'Priya Verma', ownerEmail: 'priya.verma@example.com' },
          { level: 3, ownerName: 'Rohit Malhotra', ownerEmail: 'rohit.m@example.com' }
        ] },
        { id: 'MATRIX_PO_APPROVAL_DEFAULT', name: 'PO Approval Default', levels: [
          { level: 1, ownerName: 'Rahul Jain', ownerEmail: 'rahul.jain@example.com' },
          { level: 2, ownerName: 'Neha Gupta', ownerEmail: 'neha.gupta@example.com' },
          { level: 3, ownerName: 'Sanjay Rao', ownerEmail: 'sanjay.rao@example.com' }
        ] },
        { id: 'MATRIX_DELIVERY_CHALLAN_DEFAULT', name: 'Delivery Challan Default', levels: [
          { level: 1, ownerName: 'Arjun Patel', ownerEmail: 'arjun.patel@example.com' },
          { level: 2, ownerName: 'Meera Iyer', ownerEmail: 'meera.iyer@example.com' },
          { level: 3, ownerName: 'Compliance Team', ownerEmail: 'compliance@example.com' }
        ] }
      ];
      write(KEYS.matrices, matrices);
    }
    if (!Array.isArray(processes) || !processes.length) {
      processes = [
        { id: 'PROC_INV_DELAY', process: 'Invoice Delay Resolution', invoiceSubStatus: 'Pending Verification', primaryStatus: 'In Progress', broadStatus: 'Amber', slaHours: 48, matrixId: 'MATRIX_INV_DELAY_DEFAULT', activeIssues: 0 },
        { id: 'PROC_PO_APPROVAL', process: 'PO Approval Follow-up', invoiceSubStatus: 'Verified', primaryStatus: 'Open', broadStatus: 'Green', slaHours: 72, matrixId: 'MATRIX_PO_APPROVAL_DEFAULT', activeIssues: 0 },
        { id: 'PROC_DELIVERY_CHALLAN', process: 'Delivery Challan Collection', invoiceSubStatus: 'Invoice Received', primaryStatus: 'Waiting on Vendor', broadStatus: 'Red', slaHours: 24, matrixId: 'MATRIX_DELIVERY_CHALLAN_DEFAULT', activeIssues: 0 }
      ];
      write(KEYS.processes, processes);
    }
    return { processes, matrices };
  }

  function fallbackData() {
    const customers = [
      ['CUST-001', 'Acme Corp'], ['CUST-002', 'Globex Inc'], ['CUST-003', 'Initech'],
      ['CUST-004', 'Stark Industries'], ['CUST-005', 'Wayne Enterprises'], ['CUST-006', 'Umbrella Ltd']
    ];
    const issueSpecs = [
      ['Delivery Challan Required', 'Material Delivery Issues', '2026-08-03', 'Rahul Jain', 'PROC_DELIVERY_CHALLAN'],
      ['Invoice Rebill Required', 'Invoice Dispute', '2026-08-03', 'Rahul Jain', 'PROC_INV_DELAY'],
      ['Manager Approval', 'Payment Processing', '2026-08-05', 'Meera Iyer', 'PROC_INV_DELAY'],
      ['Review Resolution', 'Clarification Needed', '2026-08-06', 'Rahul Jain', 'PROC_PO_APPROVAL'],
      ['Further Documents Required', 'Material Delivery Issues', '2026-08-10', 'Rahul Jain', 'PROC_DELIVERY_CHALLAN'],
      ['Service/PM Report Required', 'Payment Processing', '2026-08-18', 'Rahul Jain', 'PROC_PO_APPROVAL'],
      ['Payment Verification', 'Invoice Dispute', '2026-08-20', 'Meera Iyer', 'PROC_INV_DELAY'],
      ['PO Copy Required', 'Material Delivery Issues', '2026-08-22', 'Rahul Jain', 'PROC_PO_APPROVAL']
    ];
    return issueSpecs.map((spec, index) => {
      const invoiceNumber = index === 1 ? 'INV_0001' : `INV_${String(index + 1).padStart(4, '0')}`;
      const customer = customers[index % customers.length];
      const issueNumber = `ISS_${String(index + 1).padStart(4, '0')}_${index === 1 ? '02' : '01'}`;
      return {
        id: invoiceNumber,
        customerCode: customer[0], customer: customer[1], date: `2026-07-${String(20 - index).padStart(2, '0')}`,
        total: 944358 - index * 31741, kam: 'Karan Shah', kas: 'Nisha Kapoor', manager: 'Meera Iyer',
        issues: [{
          id: issueNumber, title: spec[0], status: index === 7 ? 'Closed' : 'Open', created: `2026-07-${String(21 - index).padStart(2, '0')}`,
          description: `${spec[0]} for ${customer[1]}.`, primaryStatus: spec[1], broadStatus: index % 3 === 0 ? 'Red' : 'Amber',
          subStatus: spec[0], stage: index === 2 ? 2 : (index === 3 ? 3 : (index === 7 ? 4 : 1)),
          agent: 'Rahul Jain', manager: 'Meera Iyer', fpr: `FPR-${101 + index}`, spr: `SPR-${201 + index}`,
          actionOwner: spec[3], approvalProcessId: spec[4], invoiceDueAmount: 662017 - index * 24167,
          managerApprovalStatus: index === 7 ? 'Approved' : 'Pending', assignedTo: index === 7 ? '' : 'Meera Iyer', assignmentRole: index === 7 ? '' : 'manager',
          invoiceDueDate: spec[2], region: ['East', 'North', 'West', 'South'][index % 4],
          documents: index === 0 ? [{ name: 'Invoice_INV_0001.pdf', requirement: 'Invoice', uploadedBy: 'Rahul Jain', uploadedAt: '2026-08-01T10:30:00Z' }] : [],
          actionTrail: [
            { who: 'Rahul Jain', what: 'created the issue', type: 'created', when: `2026-07-${String(21 - index).padStart(2, '0')}T08:00:00Z`, remark: index === 0 ? 'Delivery challan is missing from the invoice submission. Please upload it before approval.' : `Please complete ${spec[0].toLowerCase()} for ${customer[1]}.` }
          ]
        }]
      };
    });
  }

  function loadData() {
    let base = read(KEYS.base, null);
    if (!Array.isArray(base) || !base.length) {
      base = fallbackData();
      write(KEYS.base, base);
    }
    const custom = read(KEYS.custom, []);
    const cloned = JSON.parse(JSON.stringify(base));
    const map = new Map(cloned.map((invoice) => [invoice.id, invoice]));
    (Array.isArray(custom) ? custom : []).forEach((raw, index) => {
      const issue = normalizeIssue(raw, index);
      const invoiceId = issue.invoiceNo || raw.invoiceId || 'INV_MANUAL';
      let invoice = map.get(invoiceId);
      if (!invoice) {
        invoice = { id: invoiceId, customerCode: issue.customerCode || 'CUST-MANUAL', customer: issue.customerName || 'Manual entry', date: issue.invoiceDate || issue.created, total: Number(issue.invoiceTotal || 0), manager: issue.manager, issues: [] };
        cloned.unshift(invoice);
        map.set(invoiceId, invoice);
      }
      if (!invoice.issues.some((item) => item.id === issue.id)) invoice.issues.unshift(issue);
    });
    return cloned;
  }

  function normalizeIssue(raw, index) {
    return {
      id: raw.id || `ISS_MAN_${index + 1}`, title: raw.title || raw.subStatus || 'Manual issue', status: raw.status || 'Open',
      created: raw.created || new Date().toISOString().slice(0, 10), description: raw.description || '', primaryStatus: raw.primaryStatus || 'Clarification Needed',
      broadStatus: raw.broadStatus || 'Amber', subStatus: raw.subStatus || raw.title || 'Further Documents Required', stage: Number(raw.stage || 1),
      agent: raw.agent || 'Rahul Jain', manager: raw.manager || 'Meera Iyer', fpr: raw.fpr || '', spr: raw.spr || '', actionOwner: raw.actionOwner || 'Rahul Jain',
      approvalProcessId: raw.approvalProcessId || '', approvalProcessName: raw.approvalProcessName || '', approvalMatrixId: raw.approvalMatrixId || '', approvalMatrixName: raw.approvalMatrixName || '',
      managerApprovalStatus: raw.managerApprovalStatus || (isClosed(raw) ? 'Approved' : 'Pending'), assignedTo: raw.assignedTo || (isClosed(raw) ? '' : (raw.manager || 'Meera Iyer')), assignmentRole: raw.assignmentRole || (isClosed(raw) ? '' : 'manager'),
      invoiceDueAmount: Number(raw.invoiceDueAmount || 0), invoiceDueDate: raw.invoiceDueDate || '', region: raw.region || '', documents: Array.isArray(raw.documents) ? raw.documents : [],
      actionTrail: Array.isArray(raw.actionTrail) ? raw.actionTrail : [], isCustom: raw.isCustom !== false,
      invoiceNo: raw.invoiceNo || raw.invoiceId || '', invoiceDate: raw.invoiceDate || '', invoiceTotal: Number(raw.invoiceTotal || 0), customerName: raw.customerName || '', customerCode: raw.customerCode || ''
    };
  }

  let approvalData = seedApprovals();
  let data = loadData();

  function allIssueRecords() {
    return data.flatMap((invoice) => (invoice.issues || []).map((issue) => ({ invoice, issue })));
  }
  function findRecord(invoiceId, issueId) {
    const records = allIssueRecords();
    return records.find((record) => (!invoiceId || record.invoice.id === invoiceId) && (!issueId || record.issue.id === issueId)) || null;
  }
  function saveRecord(invoice, issue) {
    if (issue.isCustom) {
      const list = read(KEYS.custom, []);
      const index = list.findIndex((item) => item.id === issue.id);
      const snapshot = { ...issue, invoiceNo: invoice.id, invoiceDate: invoice.date, invoiceTotal: invoice.total, customerName: invoice.customer, customerCode: invoice.customerCode, isCustom: true };
      if (index >= 0) list[index] = snapshot; else list.push(snapshot);
      write(KEYS.custom, list);
    } else {
      const base = read(KEYS.base, []);
      const invoiceIndex = base.findIndex((item) => item.id === invoice.id && (item.issues || []).some((storedIssue) => storedIssue.id === issue.id));
      if (invoiceIndex >= 0) {
        const issueIndex = (base[invoiceIndex].issues || []).findIndex((item) => item.id === issue.id);
        if (issueIndex >= 0) base[invoiceIndex].issues[issueIndex] = JSON.parse(JSON.stringify(issue));
      }
      write(KEYS.base, base);
    }
    data = loadData();
  }

  function getProcess(issue) {
    if (issue.approvalProcessId) return approvalData.processes.find((process) => process.id === issue.approvalProcessId) || null;
    const text = `${issue.subStatus} ${issue.title}`.toLowerCase();
    if (text.includes('challan') || text.includes('document')) return approvalData.processes.find((item) => item.id === 'PROC_DELIVERY_CHALLAN') || approvalData.processes[0];
    if (text.includes('po ') || text.includes('purchase') || text.includes('resolution')) return approvalData.processes.find((item) => item.id === 'PROC_PO_APPROVAL') || approvalData.processes[0];
    return approvalData.processes.find((item) => item.id === 'PROC_INV_DELAY') || approvalData.processes[0];
  }
  function getTaggedProcess(issue) {
    if (!issue.approvalProcessId) return null;
    return approvalData.processes.find((process) => process.id === issue.approvalProcessId) || null;
  }
  function getMatrix(issue) {
    const process = getTaggedProcess(issue);
    const matrixId = issue.approvalMatrixId || process?.matrixId;
    return approvalData.matrices.find((matrix) => matrix.id === matrixId) || null;
  }
  function requests() { const list = read(KEYS.requests, []); return Array.isArray(list) ? list : []; }
  function latestRequest(issueId) {
    return requests().filter((request) => request?.issue?.id === issueId)
      .sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0))[0] || null;
  }
  function currentApprover(request) {
    if (!request || !Array.isArray(request.levels)) return null;
    const level = Number(request.currentLevel || 1);
    return request.levels.find((item) => Number(item.level) === level) || request.levels[level - 1] || null;
  }
  function managerApprovalStatus(issue) {
    const value = String(issue?.managerApprovalStatus || '').toLowerCase();
    if (value === 'approved' || value === 'rejected' || value === 'pending') return value;
    return isClosed(issue) ? 'approved' : 'pending';
  }
  function hasResolution(issue) {
    const trail = issue?.actionTrail || [];
    const latestResolution = trail.filter((entry) => String(entry.type || '').toLowerCase() === 'resolution')
      .sort((left, right) => new Date(right.when || 0) - new Date(left.when || 0))[0];
    const latestReopen = trail.filter((entry) => String(entry.type || '').toLowerCase() === 'reopen')
      .sort((left, right) => new Date(right.when || 0) - new Date(left.when || 0))[0];
    return Boolean(latestResolution && (!latestReopen || new Date(latestResolution.when || 0) > new Date(latestReopen.when || 0)));
  }
  function samePerson(left, right) {
    return cleanName(left).toLowerCase() === cleanName(right).toLowerCase();
  }
  function assignedUser(issue, request = latestRequest(issue.id)) {
    if (isClosed(issue)) return '';
    const managerStatus = managerApprovalStatus(issue);
    if (managerStatus === 'pending') return issue.manager || 'Meera Iyer';
    if (managerStatus === 'rejected') return issue.agent || 'Rahul Jain';
    if (request?.status === 'pending') return currentApprover(request)?.ownerName || issue.assignedTo || 'Approver';
    if (request?.status === 'rejected') return issue.agent || 'Rahul Jain';
    return issue.assignedTo || issue.agent || issue.actionOwner || 'Rahul Jain';
  }
  function approvalDecisionContext(issue, request = latestRequest(issue.id), role = getRole()) {
    if (role !== 'manager' || isClosed(issue)) return null;
    const loggedInUser = rolePerson(role);
    const assigned = assignedUser(issue, request);
    if (!samePerson(loggedInUser, assigned)) return null;
    if (managerApprovalStatus(issue) === 'pending') {
      return { kind: 'manager', label: 'Manager approval', actor: issue.manager || loggedInUser };
    }
    if (request?.status === 'pending') {
      const level = Number(request.currentLevel || 1);
      return { kind: 'approver', label: `Approver L${level} approval`, actor: currentApprover(request)?.ownerName || loggedInUser, level };
    }
    return null;
  }
  function approvalStatus(issue) {
    const request = latestRequest(issue.id);
    const managerStatus = managerApprovalStatus(issue);
    if (managerStatus === 'pending' || managerStatus === 'rejected') return managerStatus;
    if (request?.status === 'pending' || request?.status === 'rejected' || request?.status === 'approved') return request.status;
    return managerStatus === 'approved' ? 'approved' : 'not-submitted';
  }
  function getRole() {
    const query = new URLSearchParams(location.search).get('role');
    const role = query || localStorage.getItem(KEYS.role) || 'agent';
    return ['agent', 'manager', 'action-owner'].includes(role) ? role : 'agent';
  }
  function setRole(role) {
    localStorage.setItem(KEYS.role, role);
    const url = new URL(location.href);
    url.searchParams.set('role', role);
    history.replaceState({}, '', url);
  }
  function defaultUserForRole(role) {
    return role === 'manager' ? 'Meera Iyer' : 'Rahul Jain';
  }
  function roleUserKey(role) {
    return `${KEYS.activeUser}_${role}`;
  }
  function usersForRole(role) {
    const records = allIssueRecords();
    let candidates = [];
    if (role === 'manager') {
      candidates = [
        ...records.map(({ issue }) => issue.manager),
        ...approvalData.matrices.flatMap((matrix) => (matrix.levels || []).map((level) => level.ownerName)),
        ...requests().flatMap((request) => (request.levels || []).map((level) => level.ownerName))
      ];
    } else if (role === 'action-owner') {
      candidates = records.map(({ issue }) => issue.actionOwner);
    } else {
      candidates = records.map(({ issue }) => issue.agent);
    }
    return [...new Set([defaultUserForRole(role), ...candidates].map(cleanName).filter(Boolean))];
  }
  function setActiveUser(user, role = getRole()) {
    const activeUser = cleanName(user) || defaultUserForRole(role);
    localStorage.setItem(KEYS.activeUser, activeUser);
    localStorage.setItem(roleUserKey(role), activeUser);
    if (role === 'manager') localStorage.setItem(KEYS.activeApprover, activeUser);
    const url = new URL(location.href);
    url.searchParams.set('user', activeUser);
    history.replaceState({}, '', url);
  }
  function rolePerson(role) {
    const queryUser = cleanName(new URLSearchParams(location.search).get('user'));
    if (queryUser) return queryUser;
    const savedUser = cleanName(localStorage.getItem(roleUserKey(role)));
    if (savedUser) return savedUser;
    if (role === 'manager') return cleanName(localStorage.getItem(KEYS.activeApprover)) || defaultUserForRole(role);
    return defaultUserForRole(role);
  }
  function actionState(issue, role) {
    const request = latestRequest(issue.id);
    if (isClosed(issue)) return { key: 'closed', label: 'Issue completed', meta: 'No action required' };
    const assigned = assignedUser(issue, request);
    const mine = samePerson(assigned, rolePerson(role));
    const decision = approvalDecisionContext(issue, request, role);
    if (!mine) return { key: 'waiting', label: `Assigned to ${assigned || 'another user'}`, meta: `Assigned to ${assigned || 'another user'}` };
    if (decision) return { key: 'approval', label: decision.label, meta: decision.kind === 'manager' ? 'Manager decision required' : `Approval level ${decision.level}` };
    if (hasResolution(issue) && role === 'agent') return { key: 'documents', label: 'Review resolution and close issue', meta: 'Resolution provided' };
    if (role === 'action-owner') return { key: 'resolution', label: 'Add resolution', meta: issue.subStatus || issue.title };
    return { key: 'documents', label: issue.subStatus || issue.title || 'Add documents and remarks', meta: managerApprovalStatus(issue) === 'rejected' || request?.status === 'rejected' ? 'Returned to agent' : 'Assigned to you' };
  }
  function isMyWork(record, role) {
    return !isClosed(record.issue) && samePerson(assignedUser(record.issue), rolePerson(role));
  }

  function initRoleSelect(rerender) {
    const roleSelect = document.getElementById('role-select');
    const userSelect = document.getElementById('user-select');
    if (!roleSelect || !userSelect) return;
    const populateUsers = (role, preferredUser) => {
      const users = usersForRole(role);
      const preferred = cleanName(preferredUser);
      const activeUser = preferred && users.includes(preferred) ? preferred : defaultUserForRole(role);
      userSelect.innerHTML = users.map((user) => `<option value="${esc(user)}">${esc(user)}</option>`).join('');
      userSelect.value = activeUser;
      setActiveUser(activeUser, role);
    };
    const role = getRole();
    roleSelect.value = role;
    const queryUser = new URLSearchParams(location.search).get('user');
    const savedUser = localStorage.getItem(roleUserKey(role)) || (role === 'manager' ? localStorage.getItem(KEYS.activeApprover) : '');
    populateUsers(role, queryUser || savedUser || defaultUserForRole(role));
    roleSelect.addEventListener('change', () => {
      setRole(roleSelect.value);
      populateUsers(roleSelect.value, localStorage.getItem(roleUserKey(roleSelect.value)) || defaultUserForRole(roleSelect.value));
      rerender();
    });
    userSelect.addEventListener('change', () => {
      setActiveUser(userSelect.value, roleSelect.value);
      rerender();
    });
  }

  function initLanding() {
    let view = new URLSearchParams(location.search).get('view') || 'my-work';
    let page = 1;
    const collapsedInvoices = new Set();
    const body = document.getElementById('invoice-table-body');
    const search = document.getElementById('invoice-search-input');
    const approvalFilter = document.getElementById('approval-filter');
    const actionFilter = document.getElementById('action-filter');

    function render() {
      data = loadData();
      approvalData = seedApprovals();
      const role = getRole();
      const records = allIssueRecords();
      const open = records.filter((item) => !isClosed(item.issue));
      const closed = records.filter((item) => isClosed(item.issue));
      const mine = open.filter((item) => isMyWork(item, role));
      const waiting = open.filter((item) => actionState(item.issue, role).key === 'waiting');
      const pending = open.filter((item) => approvalStatus(item.issue) === 'pending');
      const openInvoices = new Set(open.map((item) => item.invoice.id)).size;
      const netDue = open.reduce((sum, item) => sum + Number(item.issue.invoiceDueAmount || 0), 0);
      document.getElementById('statMyActions').textContent = mine.length;
      document.getElementById('statOpenIssues').textContent = open.length;
      document.getElementById('statOpenInvoices').textContent = `Across ${openInvoices} invoices`;
      document.getElementById('statWaiting').textContent = waiting.length;
      document.getElementById('statWaitingApprovals').textContent = `${pending.length} awaiting approval`;
      document.getElementById('statInvoiceAmount').textContent = money(netDue);
      document.getElementById('tabMyWorkCount').textContent = mine.length;
      document.getElementById('tabOpenCount').textContent = open.length;
      document.getElementById('tabClosedCount').textContent = closed.length;

      let filtered = view === 'closed' ? closed : (view === 'open' ? open : mine);
      const query = search.value.trim().toLowerCase();
      if (query) filtered = filtered.filter(({ invoice, issue }) => [invoice.id, invoice.customer, invoice.customerCode, issue.id, issue.title, issue.subStatus].join(' ').toLowerCase().includes(query));
      if (approvalFilter.value !== 'all') filtered = filtered.filter(({ issue }) => approvalStatus(issue) === approvalFilter.value);
      if (actionFilter.value !== 'all') filtered = filtered.filter(({ issue }) => {
        const key = actionState(issue, role).key;
        if (actionFilter.value === 'my-actionable') return ['documents', 'approval', 'resolution'].includes(key);
        if (actionFilter.value === 'no-action-required') return ['waiting', 'closed'].includes(key);
        return actionFilter.value === 'resolution-provided' && (key === 'closed' || Number(issue.stage) >= 3);
      });
      const groups = [];
      filtered.forEach((record) => {
        let group = groups.find((item) => item.invoice.id === record.invoice.id);
        if (!group) { group = { invoice: record.invoice, records: [] }; groups.push(group); }
        group.records.push(record);
      });
      const pages = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
      page = Math.min(Math.max(1, page), pages);
      const shown = groups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
      body.innerHTML = shown.map((group) => {
        const due = group.records.reduce((sum, item) => sum + Number(item.issue.invoiceDueAmount || 0), 0);
        const collapsed = collapsedInvoices.has(group.invoice.id);
        return `<tr class="invoiceGroupRow${collapsed ? ' is-collapsed' : ''}"><td colspan="8"><button class="invoiceGroupToggle" type="button" data-invoice-toggle="${esc(group.invoice.id)}" aria-expanded="${String(!collapsed)}"><span class="invoiceGroupIdentity"><i class="bi bi-chevron-down invoiceGroupChevron" aria-hidden="true"></i><strong><i class="bi bi-receipt" aria-hidden="true"></i> ${esc(group.invoice.id)}</strong><span>${group.records.length} issue${group.records.length === 1 ? '' : 's'}</span></span><span class="invoiceGroupAmount">Net due ${esc(money(due))}</span></button></td></tr>` + group.records.map(({ invoice, issue }) => {
          const state = actionState(issue, role);
          const params = new URLSearchParams({ invoice: invoice.id, issue: issue.id, role, user: rolePerson(role) });
          return `<tr class="issueRow" data-invoice-issue="${esc(invoice.id)}"${collapsed ? ' hidden' : ''}><td><span class="actionName">${esc(issue.subStatus || issue.title || '—')}</span><span class="actionMeta">${esc(state.meta)}</span></td><td>${esc(invoice.customerCode)}</td><td>${esc(invoice.customer)}</td><td><strong>${esc(invoice.id)}</strong></td><td>${esc(issue.id)}</td><td>${esc(prettyDate(issue.created))}</td><td class="openDaysCell">${esc(issueOpenDays(issue))}</td><td><a class="smallAction${['documents', 'approval', 'resolution'].includes(state.key) ? ' is-primary' : ''}" href="issuetrackerdetail.html?${params}">${state.key === 'closed' ? 'View' : 'Open task'}</a></td></tr>`;
        }).join('');
      }).join('');
      body.querySelectorAll('[data-invoice-toggle]').forEach((button) => button.addEventListener('click', () => {
        const invoiceId = button.dataset.invoiceToggle;
        if (collapsedInvoices.has(invoiceId)) collapsedInvoices.delete(invoiceId);
        else collapsedInvoices.add(invoiceId);
        render();
      }));
      document.getElementById('issue-empty-state').classList.toggle('hidden', groups.length > 0);
      body.closest('table').classList.toggle('hidden', groups.length === 0);
      document.getElementById('invoice-page-info').textContent = groups.length ? `Showing invoices ${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, groups.length)} of ${groups.length}` : 'Showing 0 invoices';
      document.getElementById('invoice-page-current').textContent = page;
      document.getElementById('invoice-page-prev').disabled = page === 1;
      document.getElementById('invoice-page-next').disabled = page === pages;
      document.querySelectorAll('.workTab').forEach((tab) => {
        const active = tab.dataset.view === view;
        tab.classList.toggle('is-active', active);
        tab.setAttribute('aria-selected', String(active));
      });
      const filterCount = Number(approvalFilter.value !== 'all') + Number(actionFilter.value !== 'all');
      const count = document.getElementById('active-filter-count');
      count.textContent = filterCount;
      count.classList.toggle('hidden', filterCount === 0);
      const toggle = document.getElementById('toggle-closed-invoices');
      toggle.innerHTML = view === 'closed' ? '<i class="bi bi-eye"></i> Show active' : '<i class="bi bi-eye-slash"></i> Show archived';
    }

    initRoleSelect(render);
    document.querySelectorAll('.workTab').forEach((tab) => tab.addEventListener('click', () => { view = tab.dataset.view; page = 1; render(); }));
    search.addEventListener('input', () => { page = 1; render(); });
    approvalFilter.addEventListener('change', () => { page = 1; render(); });
    actionFilter.addEventListener('change', () => { page = 1; render(); });
    document.getElementById('clear-filters').addEventListener('click', () => { approvalFilter.value = 'all'; actionFilter.value = 'all'; render(); });
    document.getElementById('toggle-closed-invoices').addEventListener('click', () => { view = view === 'closed' ? 'my-work' : 'closed'; page = 1; render(); });
    document.getElementById('invoice-page-prev').addEventListener('click', () => { page -= 1; render(); });
    document.getElementById('invoice-page-next').addEventListener('click', () => { page += 1; render(); });
    initNewIssue(render);
    render();
  }

  function initNewIssue(renderLanding) {
    const trigger = document.getElementById('add-issue-btn');
    if (!trigger) return;
    const modal = document.getElementById('add-issue-modal');
    const invoiceSelect = document.getElementById('new-issue-invoice');
    const primarySelect = document.getElementById('new-issue-primary');
    const subSelect = document.getElementById('new-issue-sub');
    const ownerSelect = document.getElementById('new-issue-owner');
    const processSelect = document.getElementById('new-issue-process');
    const fill = () => {
      invoiceSelect.innerHTML = data.map((invoice) => `<option value="${esc(invoice.id)}">${esc(invoice.id)} · ${esc(invoice.customer)}</option>`).join('');
      primarySelect.innerHTML = PRIMARY_STATUSES.map((value) => `<option>${esc(value)}</option>`).join('');
      subSelect.innerHTML = SUB_STATUSES.map((value) => `<option>${esc(value)}</option>`).join('');
      ownerSelect.innerHTML = USERS.map((value) => `<option>${esc(value)}</option>`).join('');
      processSelect.innerHTML = approvalData.processes.map((process) => `<option value="${esc(process.id)}">${esc(process.process)}</option>`).join('');
    };
    const close = () => { modal.classList.add('hidden'); modal.setAttribute('aria-hidden', 'true'); };
    trigger.addEventListener('click', () => { fill(); modal.classList.remove('hidden'); modal.setAttribute('aria-hidden', 'false'); });
    document.getElementById('add-issue-close').addEventListener('click', close);
    document.getElementById('add-issue-cancel').addEventListener('click', close);
    modal.addEventListener('click', (event) => { if (event.target === modal) close(); });
    document.getElementById('add-issue-form').addEventListener('submit', (event) => {
      event.preventDefault();
      const invoice = data.find((item) => item.id === invoiceSelect.value);
      const process = approvalData.processes.find((item) => item.id === processSelect.value);
      const matrix = approvalData.matrices.find((item) => item.id === process?.matrixId);
      const list = read(KEYS.custom, []);
      const issueNumber = `ISS_${String(Date.now()).slice(-6)}_01`;
      list.push({
        id: issueNumber, invoiceNo: invoice.id, invoiceDate: invoice.date, invoiceTotal: invoice.total, customerName: invoice.customer, customerCode: invoice.customerCode,
        title: subSelect.value, subStatus: subSelect.value, primaryStatus: primarySelect.value, broadStatus: 'Amber', status: 'Open', created: new Date().toISOString().slice(0, 10),
        agent: 'Rahul Jain', manager: invoice.manager || 'Meera Iyer', actionOwner: ownerSelect.value, region: 'East', invoiceDueAmount: invoice.total, invoiceDueDate: invoice.issues?.[0]?.invoiceDueDate || '2026-08-10',
        approvalProcessId: process?.id || '', approvalProcessName: process?.process || '', approvalMatrixId: matrix?.id || '', approvalMatrixName: matrix?.name || '', stage: 1, documents: [], isCustom: true,
        managerApprovalStatus: 'Pending', assignedTo: invoice.manager || 'Meera Iyer', assignmentRole: 'manager',
        actionTrail: [{ who: 'Rahul Jain', what: 'created the issue', type: 'created', when: isoNow(), remark: document.getElementById('new-issue-remark').value.trim() }]
      });
      write(KEYS.custom, list);
      close();
      renderLanding();
      location.href = `issuetrackerdetail.html?${new URLSearchParams({ invoice: invoice.id, issue: issueNumber, role: getRole(), user: rolePerson(getRole()) })}`;
    });
  }

  function documentRequirement(issue) {
    const text = `${issue.subStatus} ${issue.title}`.toLowerCase();
    if (text.includes('challan')) return 'Delivery Challan';
    if (text.includes('po ') || text.includes('purchase')) return 'Purchase Order';
    if (text.includes('receipt') || text.includes('payment')) return 'Payment Receipt';
    if (text.includes('agreement')) return 'Agreement';
    if (text.includes('contract')) return 'Contract';
    return 'Supporting Document';
  }
  function sameCustomer(left, right) {
    const leftCode = cleanName(left?.customerCode).toLowerCase();
    const rightCode = cleanName(right?.customerCode).toLowerCase();
    if (leftCode && rightCode) return leftCode === rightCode;
    return cleanName(left?.customer).toLowerCase() === cleanName(right?.customer).toLowerCase();
  }
  function issueDocuments(invoice, issue, request) {
    const documents = [];
    const seen = new Set();
    const addDocument = (document, sourceInvoice, sourceIssue, fallback = {}) => {
      const raw = typeof document === 'string' ? { name: document } : (document || {});
      const name = cleanName(raw.name);
      if (!name) return;
      const requirement = raw.requirement || fallback.requirement || 'Supporting document';
      const signature = `${name}|${requirement}`.toLowerCase();
      if (seen.has(signature)) return;
      seen.add(signature);
      const sourceInvoiceId = raw.sourceInvoice || sourceInvoice?.id || invoice.id;
      const sourceIssueId = raw.sourceIssue || sourceIssue?.id || issue.id;
      documents.push({
        ...raw,
        name,
        requirement,
        uploadedBy: raw.uploadedBy || fallback.uploadedBy,
        uploadedAt: raw.uploadedAt || fallback.uploadedAt,
        sourceInvoice: sourceInvoiceId,
        sourceIssue: sourceIssueId,
        shared: sourceInvoiceId !== invoice.id || sourceIssueId !== issue.id
      });
    };
    (issue.documents || []).forEach((document) => addDocument(document, invoice, issue));
    allIssueRecords().forEach(({ invoice: sourceInvoice, issue: sourceIssue }) => {
      if (!sameCustomer(invoice, sourceInvoice) || (sourceInvoice.id === invoice.id && sourceIssue.id === issue.id)) return;
      (sourceIssue.documents || []).forEach((document) => addDocument(document, sourceInvoice, sourceIssue));
    });
    (request?.trail || []).forEach((entry) => (entry.files || []).forEach((file) => {
      addDocument(file, invoice, issue, { requirement: 'Approval attachment', uploadedBy: entry.by, uploadedAt: entry.at });
    }));
    return documents;
  }
  function renderDocuments(invoice, issue, request) {
    const docs = issueDocuments(invoice, issue, request);
    if (!docs.length) return `<div class="emptyDocuments"><i class="bi bi-file-earmark" aria-hidden="true"></i><span><strong>No customer documents uploaded</strong><small>Files uploaded from any invoice for this customer will appear here.</small></span></div>`;
    return `<div class="documentRows">${docs.map((doc) => `<div class="documentRow${doc.shared ? ' is-shared' : ''}"><i class="bi bi-file-earmark-check" aria-hidden="true"></i><span><strong>${esc(doc.requirement || 'Supporting document')}</strong><small title="${esc(doc.name)}">${esc(doc.name)}</small>${doc.shared ? `<em><i class="bi bi-link-45deg" aria-hidden="true"></i> Shared from ${esc(doc.sourceInvoice)}</em>` : ''}</span><button type="button" data-preview-document="${esc(doc.name)}" title="Preview ${esc(doc.name)}" aria-label="Preview ${esc(doc.name)}"><i class="bi bi-eye"></i></button></div>`).join('')}</div>`;
  }

  function initDetail() {
    const params = new URLSearchParams(location.search);
    let record = findRecord(params.get('invoice'), params.get('issue'));
    const pendingFiles = [];
    let selectedRequirement = '';
    if (!record) {
      document.getElementById('detail-empty-state').classList.remove('hidden');
      return;
    }

    function refreshRecord() { record = findRecord(record.invoice.id, record.issue.id) || record; }
    function render() {
      data = loadData(); approvalData = seedApprovals(); refreshRecord();
      const { invoice, issue } = record;
      const role = getRole();
      const request = latestRequest(issue.id);
      const state = actionState(issue, role);
      const backLink = document.querySelector('.backLink');
      if (backLink) backLink.href = `issuetrackerLP.html?${new URLSearchParams({ view: 'my-work', role, user: rolePerson(role) })}`;
      document.getElementById('detail-empty-state').classList.add('hidden');
      document.getElementById('issue-detail-layout').classList.remove('hidden');
      document.getElementById('detail-title').textContent = issue.subStatus || issue.title || 'Issue detail';
      document.getElementById('detail-identity').textContent = `Invoice no.: ${invoice.id} · Issue ID: ${issue.id} · ${invoice.customerCode} · ${invoice.customer}`;
      const status = document.getElementById('detail-status');
      status.textContent = isClosed(issue) ? 'Closed' : (approvalStatus(issue) === 'pending' ? 'Approval pending' : issue.status || 'Open');
      status.className = `statusPill${isClosed(issue) ? ' is-closed' : (approvalStatus(issue) === 'pending' ? ' is-pending' : '')}`;
      renderCurrentAction(issue, state, request);
      renderContext(issue, request);
      renderWorkArea(invoice, issue, request, state, pendingFiles, selectedRequirement);
      renderActivity(issue, request);
      renderMatrix(issue, request);
      renderDetails(invoice, issue, request);
      renderRoute(issue, request);
      bindDetailEvents(invoice, issue, request, state);
    }

    function bindDetailEvents(invoice, issue, request, state) {
      document.querySelectorAll('[data-preview-document]').forEach((button) => button.addEventListener('click', () => toast(`${button.dataset.previewDocument} is ready to preview in the document viewer.`, 'success')));
      document.querySelectorAll('[data-add-document]').forEach((button) => button.addEventListener('click', () => { selectedRequirement = button.dataset.addDocument; document.getElementById('document-file-input').click(); }));
      document.querySelectorAll('[data-trigger-upload]').forEach((button) => button.addEventListener('click', () => { selectedRequirement = button.dataset.requirement || documentRequirement(issue); document.getElementById('document-file-input').click(); }));
      const remark = document.getElementById('work-remark');
      const counter = document.getElementById('remark-counter');
      if (remark && counter) remark.addEventListener('input', () => { counter.textContent = `${remark.value.length} / 1000`; });
      const submit = document.getElementById('submit-primary-action');
      if (submit) submit.addEventListener('click', () => {
        const text = remark?.value.trim() || '';
        if (!text) { showFormError('Please add a remark so the next person knows what happened.'); return; }
        shareUpdate(invoice, issue, text, pendingFiles);
        pendingFiles.length = 0; render();
      });
      const reminder = document.getElementById('send-reminder-action');
      if (reminder) reminder.addEventListener('click', () => { issue.actionTrail.push({ who: rolePerson(getRole()), what: 'sent an approval reminder', type: 'reminder', when: isoNow(), remark: 'Please review this issue when possible.' }); saveRecord(invoice, issue); toast('Reminder sent.', 'success'); render(); });
      function bindQuickActionPanel() {
        const quickCancel = document.getElementById('quick-action-cancel');
        if (quickCancel) quickCancel.addEventListener('click', closeQuickActionPanel);
        const emailType = document.getElementById('quick-email-type');
        if (emailType) emailType.addEventListener('change', () => {
          document.getElementById('quick-email-recipients')?.classList.toggle('hidden', emailType.value !== 'escalate');
        });
        const quickConfirm = document.getElementById('quick-action-confirm');
        if (quickConfirm) quickConfirm.addEventListener('click', () => {
          if (performQuickAction(quickConfirm.dataset.action, invoice, issue, request, pendingFiles)) {
            pendingFiles.length = 0;
            render();
          }
        });
        document.querySelectorAll('[data-quick-decision]').forEach((button) => button.addEventListener('click', () => {
          if (performQuickAction(button.dataset.quickDecision, invoice, issue, request, pendingFiles)) {
            pendingFiles.length = 0;
            render();
          }
        }));
      }
      document.querySelectorAll('[data-issue-action]').forEach((button) => button.addEventListener('click', () => {
        if (button.classList.contains('is-active')) {
          closeQuickActionPanel();
          return;
        }
        openQuickActionPanel(button.dataset.issueAction, issue, request);
        bindQuickActionPanel();
      }));
    }

    document.getElementById('document-file-input').addEventListener('change', (event) => {
      Array.from(event.target.files || []).forEach((file) => pendingFiles.push({ name: file.name, requirement: selectedRequirement || documentRequirement(record.issue), size: file.size }));
      event.target.value = '';
      const pendingList = document.getElementById('pending-upload-list');
      if (pendingList) {
        pendingList.classList.toggle('hidden', pendingFiles.length === 0);
        const names = pendingList.querySelector('span');
        if (names) names.textContent = pendingFiles.map((file) => file.name).join(', ');
      }
    });
    initRoleSelect(render);
    window.addEventListener('storage', (event) => { if ([KEYS.processes, KEYS.matrices, KEYS.requests].includes(event.key)) render(); });
    render();
  }

  function showFormError(message) {
    const node = document.getElementById('work-form-error');
    if (node) node.textContent = message; else toast(message, 'error');
  }
  function renderCurrentAction(issue, state, request) {
    const node = document.getElementById('current-action');
    const title = state.key === 'documents' ? `Upload ${documentRequirement(issue)} and add your remark` : state.label;
    const explanation = state.key === 'approval' ? 'Review the supporting documents and the previous remark, then approve or send it back.' :
      state.key === 'waiting' ? 'This issue is assigned to another person, but you can still add documents, share a resolution, add remarks or use the available actions.' :
      state.key === 'resolution' ? 'Explain the resolution clearly and attach any supporting proof.' :
      state.key === 'closed' ? 'This issue has completed its action and approval flow.' : 'Attach the requested document and explain what you completed before sending it forward.';
    const waitingWith = state.key === 'waiting' ? `<span class="actionDue"><i class="bi bi-person"></i>With ${esc(assignedUser(issue, request) || 'another user')}</span>` : '';
    node.className = `currentAction${state.key === 'waiting' ? ' is-waiting' : (state.key === 'closed' ? ' is-complete' : '')}`;
    node.innerHTML = `<div class="currentActionHeader"><div><span class="eyebrow">${state.key === 'approval' ? 'Your approval is needed' : (state.key === 'waiting' ? 'Waiting on another person' : (state.key === 'closed' ? 'Completed' : 'Your action is needed'))}</span><h2>${esc(title)}</h2><p>${esc(explanation)}</p></div>${waitingWith}</div>`;
  }
  function originalRemark(issue) {
    return (issue.actionTrail || []).find((entry) => entry.remark)?.remark || issue.description || 'No original remark provided.';
  }
  function renderContext(issue, request) {
    const matrix = getMatrix(issue);
    document.getElementById('issue-context').innerHTML = `<h2 class="sectionHeading">Issue context</h2><div class="contextGrid"><div class="contextItem"><span>Primary status</span><strong>${esc(issue.primaryStatus || '—')}</strong></div><div class="contextItem"><span>Sub status</span><strong>${esc(issue.subStatus || issue.title || '—')}</strong></div><div class="contextItem"><span>Action owner</span><strong>${esc(issue.actionOwner || 'Unassigned')}</strong></div><div class="contextItem"><span>Approval matrix</span><strong>${esc(matrix?.name || 'Not selected')}</strong></div></div><div class="originalRemarkCard"><span>Agent's original remark</span><p>${esc(originalRemark(issue))}</p></div>`;
  }
  function canCloseIssue(role = getRole()) {
    if (role === 'agent') return true;
    if (role !== 'manager') return false;
    const viewer = rolePerson(role);
    return allIssueRecords().some(({ issue }) => samePerson(issue.manager, viewer));
  }
  function renderActionToolbar(issue, request) {
    const closed = isClosed(issue);
    const decision = approvalDecisionContext(issue, request);
    const managerPending = managerApprovalStatus(issue) === 'pending';
    const pendingLevel = request?.status === 'pending' ? Number(request.currentLevel || 1) : 0;
    const approvalLabel = decision?.kind === 'approver' ? `Approver L${decision.level}` : (managerPending ? 'Manager approval' : (pendingLevel ? `Approver L${pendingLevel}` : 'Approval'));
    const approvalOwner = assignedUser(issue, request) || 'the current assignee';
    const actions = [
      ['approve', 'bi-check2-circle', approvalLabel, closed || !decision, decision?.label || `Only ${approvalOwner} can accept or reject at this stage`],
      ['assign', 'bi-person-plus', 'Reassign', closed, 'Reassign action owner'],
      ['email', 'bi-envelope-arrow-up', 'Resend', false, 'Resend email'],
      ['process', 'bi-diagram-3', 'Process', closed, 'Change approval process'],
      ['resolution', 'bi-file-earmark-check', 'Resolve', closed, 'Add resolution'],
      ['close', 'bi-lock', 'Close', closed || !canCloseIssue(), canCloseIssue() ? 'Close issue at any point in the workflow' : 'Only an agent or manager can close this issue'],
      ['reopen', 'bi-arrow-counterclockwise', 'Reopen', !closed, 'Reopen issue']
    ];
    return `<section class="workActionSection" aria-labelledby="issue-actions-title"><div id="issue-actions-title" class="workActionSummary"><span><i class="bi bi-three-dots" aria-hidden="true"></i> Actions</span></div><div class="workActionContent"><div class="workActionButtons">${actions.map(([key, icon, label, disabled, title]) => `<button type="button" class="workActionButton" data-issue-action="${key}" title="${esc(title)}" aria-label="${esc(title)}"${disabled ? ' disabled' : ''}><i class="bi ${icon}" aria-hidden="true"></i><span>${label}</span></button>`).join('')}</div><div id="quick-action-panel" class="quickActionPanel hidden" aria-live="polite"></div></div></section>`;
  }
  function restoreDefaultWorkInputs() {
    const inputs = document.getElementById('default-work-inputs');
    const slot = document.getElementById('default-work-input-slot');
    if (!inputs || !slot) return;
    inputs.classList.remove('is-in-action');
    slot.insertAdjacentElement('afterend', inputs);
  }
  function closeQuickActionPanel() {
    const panel = document.getElementById('quick-action-panel');
    if (!panel) return;
    restoreDefaultWorkInputs();
    panel.innerHTML = '';
    delete panel.dataset.quickAction;
    panel.classList.add('hidden');
    document.querySelectorAll('[data-issue-action]').forEach((button) => button.classList.remove('is-active'));
  }
  function openQuickActionPanel(action, issue, request) {
    const panel = document.getElementById('quick-action-panel');
    if (!panel) return;
    restoreDefaultWorkInputs();
    document.querySelectorAll('[data-issue-action]').forEach((button) => button.classList.toggle('is-active', button.dataset.issueAction === action));
    const processOptions = approvalData.processes.map((process) => `<option value="${esc(process.id)}"${process.id === (issue.approvalProcessId || getProcess(issue)?.id) ? ' selected' : ''}>${esc(process.process)}</option>`).join('');
    const ownerOptions = USERS.map((user) => `<option value="${esc(user)}"${user === issue.actionOwner ? ' selected' : ''}>${esc(user)}</option>`).join('');
    const header = (icon, title, description) => `<div class="quickActionHeader"><span class="quickActionHeaderIcon"><i class="bi ${icon}" aria-hidden="true"></i></span><div><h4>${title}</h4><p>${description}</p></div></div>`;
    const footer = (label) => `<div class="quickActionFooter"><button id="quick-action-confirm" data-action="${action}" class="primaryButton" type="button">${label}</button><button id="quick-action-cancel" class="outlineButton" type="button">Cancel</button></div>`;
    const approvalFooter = `<div class="quickActionFooter quickActionFooter--decision"><button type="button" class="primaryButton" data-quick-decision="approve"><i class="bi bi-check2" aria-hidden="true"></i> Accept</button><button type="button" class="dangerButton" data-quick-decision="reject"><i class="bi bi-x-lg" aria-hidden="true"></i> Reject</button><button id="quick-action-cancel" class="outlineButton" type="button">Cancel</button></div>`;
    let content = '';
    if (action === 'approve') {
      const decision = approvalDecisionContext(issue, request);
      if (!decision) return;
      const description = decision.kind === 'manager' ? 'Accept the new issue so processing can begin, or reject it back to the agent.' : 'Accept this approval level to continue the matrix, or reject it back to the agent.';
      const statusLabel = decision.kind === 'manager' ? managerApprovalStatus(issue) : (currentApprover(request)?.status || 'pending');
      content = `${header('bi-check2-circle', decision.label, description)}<div class="quickActionBody"><div class="quickActionValue"><span>Assigned approver</span><strong>${esc(decision.actor)}</strong></div><div class="quickActionValue"><span>Current decision</span><strong>${esc(statusLabel)}</strong></div></div>${approvalFooter}`;
    } else if (action === 'assign') {
      content = `${header('bi-person-plus', 'Reassign action owner', 'Select the person responsible for the next action.')}<div class="quickActionBody"><label>Action owner<select id="quick-owner">${ownerOptions}</select></label></div>${footer('Reassign')}`;
    } else if (action === 'email') {
      content = `${header('bi-envelope-arrow-up', 'Resend email', 'Send a reminder or escalate the issue by email.')}<div class="quickActionBody"><div class="quickActionGrid"><label>Email type<select id="quick-email-type"><option value="reminder">Reminder email</option><option value="escalate">Escalation email</option></select></label><label id="quick-email-recipients" class="hidden">Escalate to<input id="quick-email-addresses" type="text" placeholder="name@example.com, manager@example.com"></label></div></div>${footer('Send email')}`;
    } else if (action === 'process') {
      content = `${header('bi-diagram-3', 'Approval process', 'Change the approval route applied to this issue.')}<div class="quickActionBody"><label>Approval process<select id="quick-process">${processOptions}</select></label></div>${footer('Save process')}`;
    } else if (action === 'resolution') {
      content = `${header('bi-file-earmark-check', 'Add resolution', 'Submit the attached files and remark as the resolution.')}${footer('Submit resolution')}`;
    } else {
      const label = action === 'reopen' ? 'Reopen issue' : 'Close issue';
      content = `${header(action === 'reopen' ? 'bi-arrow-counterclockwise' : 'bi-lock', label, action === 'reopen' ? 'Return this issue to active work.' : 'Complete this issue and remove it from active work.')}${footer(label)}`;
    }
    panel.dataset.quickAction = action;
    panel.innerHTML = content;
    panel.classList.remove('hidden');
    const sharedInputs = document.getElementById('default-work-inputs');
    const actionFooter = panel.querySelector('.quickActionFooter');
    if (sharedInputs) {
      sharedInputs.classList.add('is-in-action');
      if (actionFooter) panel.insertBefore(sharedInputs, actionFooter);
      else panel.appendChild(sharedInputs);
    }
    panel.querySelector('select, input')?.focus();
  }
  function performQuickAction(action, invoice, issue, request, pendingFiles) {
    const by = rolePerson(getRole());
    const remarkField = document.getElementById('work-remark');
    const remark = remarkField?.value.trim() || '';
    const actionFiles = pendingFiles.map((file) => ({ name: file.name, requirement: file.requirement }));
    const requireRemark = () => {
      if (remark) return true;
      showFormError('Please add remark.');
      remarkField?.focus();
      return false;
    };
    if (action === 'approve' || action === 'reject') {
      if (!requireRemark()) return false;
      const decisionContext = approvalDecisionContext(issue, request);
      if (!decisionContext) { toast('This approval is not assigned to the logged-in user.', 'error'); return false; }
      if (decisionContext.kind === 'approver') {
        decideApproval(invoice, issue, request, action === 'reject' ? 'rejected' : 'approved', remark, pendingFiles);
      } else {
        decideManagerApproval(invoice, issue, action === 'reject' ? 'rejected' : 'approved', remark, pendingFiles);
      }
      return true;
    }
    if (action === 'assign') {
      if (!requireRemark()) return false;
      const owner = document.getElementById('quick-owner')?.value || issue.actionOwner;
      issue.actionOwner = owner;
      issue.assignedTo = owner;
      issue.assignmentRole = 'action-owner';
      issue.stage = Math.max(Number(issue.stage || 0), 2);
      attachFiles(invoice, issue, pendingFiles, by);
      issue.actionTrail.push({ who: by, what: `assigned to action owner (${owner})`, type: 'assignment', when: isoNow(), remark, files: actionFiles });
      saveRecord(invoice, issue); toast(`Assigned to ${owner}.`, 'success'); return true;
    }
    if (action === 'email') {
      if (!requireRemark()) return false;
      const kind = document.getElementById('quick-email-type')?.value || 'reminder';
      const addresses = (document.getElementById('quick-email-addresses')?.value || '').split(/[ ,;]+/).map((value) => value.trim()).filter(Boolean);
      if (kind === 'escalate' && (!addresses.length || !addresses.every((value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)))) {
        toast('Enter at least one valid escalation email address.', 'error'); return false;
      }
      const target = kind === 'escalate' ? addresses.join(', ') : (issue.actionOwner || 'action owner');
      attachFiles(invoice, issue, pendingFiles, by);
      issue.actionTrail.push({ who: by, what: `${kind === 'escalate' ? 'sent escalation email to' : 're-sent reminder email to'} ${target}`, type: 'email', when: isoNow(), remark, recipients: addresses, files: actionFiles });
      saveRecord(invoice, issue); toast(kind === 'escalate' ? 'Escalation email sent.' : 'Reminder email re-sent.', 'success'); return true;
    }
    if (action === 'process') {
      if (!requireRemark()) return false;
      const processId = document.getElementById('quick-process')?.value;
      const process = approvalData.processes.find((item) => item.id === processId);
      if (!process) { toast('Select an approval process.', 'error'); return false; }
      issue.approvalProcessId = process.id; issue.approvalProcessName = process.process;
      attachFiles(invoice, issue, pendingFiles, by);
      issue.actionTrail.push({ who: by, what: `selected approval process (${process.process})`, type: 'process', when: isoNow(), remark, files: actionFiles });
      saveRecord(invoice, issue); toast('Approval process saved.', 'success'); return true;
    }
    if (action === 'resolution') {
      if (!requireRemark()) return false;
      provideResolution(invoice, issue, remark, pendingFiles);
      return true;
    }
    if (action === 'close' && !canCloseIssue()) {
      toast('Only an agent or manager can close this issue.', 'error');
      return false;
    }
    if (!requireRemark()) return false;
    issue.status = action === 'reopen' ? 'Open' : 'Closed';
    issue.stage = action === 'reopen' ? 1 : 4;
    issue.assignedTo = action === 'reopen' ? (issue.agent || 'Rahul Jain') : '';
    issue.assignmentRole = action === 'reopen' ? 'agent' : '';
    attachFiles(invoice, issue, pendingFiles, by);
    issue.actionTrail.push({ who: by, what: action === 'reopen' ? 'reopened the issue' : 'closed the issue', type: action === 'reopen' ? 'reopen' : 'closure', when: isoNow(), remark, files: actionFiles });
    saveRecord(invoice, issue); toast(action === 'reopen' ? 'Issue reopened.' : 'Issue closed.', 'success'); return true;
  }
  function renderWorkArea(invoice, issue, request, state, pendingFiles) {
    const node = document.getElementById('work-area');
    const actionToolbar = renderActionToolbar(issue, request);
    const customerDocuments = issueDocuments(invoice, issue, request);
    const docs = renderDocuments(invoice, issue, request);
    const pendingUpload = `<div id="pending-upload-list" class="uploadFileList${pendingFiles.length ? '' : ' hidden'}"><strong>Ready to attach:</strong> <span>${pendingFiles.map((file) => esc(file.name)).join(', ')}</span></div>`;
    const upload = `<div class="uploadZone"><span class="uploadIcon"><i class="bi bi-cloud-arrow-up"></i></span><div class="uploadCopy"><strong>Attach supporting documents</strong><span>PDF, JPG, PNG, DOCX or XLSX</span><small>${esc(documentRequirement(issue))} ${customerDocuments.some((item) => String(item.requirement || '').toLowerCase() === documentRequirement(issue).toLowerCase()) ? 'is already available for this customer' : 'is requested for this issue'} · New uploads are reusable across this customer's invoices</small></div><button class="outlineButton uploadAction" type="button" data-trigger-upload data-requirement="${esc(documentRequirement(issue))}"><i class="bi bi-paperclip" aria-hidden="true"></i> Browse</button></div>${pendingUpload}`;
    const remark = `<label class="workRemarkLabel" for="work-remark">${state.key === 'approval' ? 'Decision remark' : (state.key === 'resolution' ? 'Resolution' : 'Your remark')} <span aria-hidden="true">*</span></label><textarea id="work-remark" class="workRemark" maxlength="1000" placeholder="Explain what you checked, attached or decided. This is shown to the next person."></textarea><span id="remark-counter" class="remarkCounter">0 / 1000</span><div id="work-form-error" class="formError"></div>`;
    const documentSection = `<section class="workSection documentSection"><div class="workSectionHeader"><div><h3>Existing Documents</h3><p>Documents available for this customer across all invoices</p></div><span class="documentCount">${customerDocuments.length}</span></div>${docs}</section>`;
    const workNote = state.key === 'approval' ? `Sharing an update does not approve or reject the issue. Use the ${esc(state.label)} action above for the decision.` :
      state.key === 'waiting' ? 'Shares the remark and any attached documents without changing the current assignment.' :
      state.key === 'closed' ? 'Sharing an update does not reopen the issue.' :
      'Shares the remark and any attached documents together.';
    const defaultWorkInputs = `<div id="default-work-inputs" class="defaultWorkInputs">${upload}<div class="resolutionFields">${remark}</div><div class="workActions"><button id="submit-primary-action" class="primaryButton" type="button"><i class="bi bi-send" aria-hidden="true"></i> Share update</button><span class="workNote"><i class="bi bi-info-circle"></i> ${workNote}</span></div></div>`;
    const interactiveWorkArea = `${actionToolbar}<div id="default-work-input-slot" aria-hidden="true"></div>${defaultWorkInputs}`;
    if (state.key === 'waiting') {
      node.innerHTML = `${documentSection}<section class="workSection resolutionSection resolutionSection--waiting"><div class="workSectionHeader"><div><h3>Contribute to this issue</h3><p>Share documents, resolution or remarks even while another user owns the next approval.</p></div></div><div class="waitingAssignmentNote"><i class="bi bi-person-check" aria-hidden="true"></i><span>Currently assigned to <strong>${esc(assignedUser(issue, request) || 'another user')}</strong>. Only Accept/Reject follows the active approval level; all other actions remain available.</span></div>${interactiveWorkArea}</section>`;
      return;
    }
    if (state.key === 'closed') {
      node.innerHTML = `${documentSection}<section class="workSection resolutionSection resolutionSection--closed"><div class="workSectionHeader"><div><h3>Update issue</h3><p>Attach supporting files or share a remark without reopening the issue.</p></div></div>${interactiveWorkArea}</section>`;
      return;
    }
    if (state.key === 'approval') {
      node.innerHTML = `${documentSection}<section class="workSection resolutionSection"><div class="workSectionHeader"><div><h3>Review and respond</h3><p>Attach supporting evidence, share a resolution or record your approval decision.</p></div></div>${interactiveWorkArea}</section>`;
      return;
    }
    node.innerHTML = `${documentSection}<section class="workSection resolutionSection"><div class="workSectionHeader"><div><h3>Provide resolution</h3><p>Upload supporting files and explain the action completed.</p></div></div>${interactiveWorkArea}</section>`;
  }

  function attachFiles(invoice, issue, files, by) {
    issue.documents = Array.isArray(issue.documents) ? issue.documents : [];
    files.forEach((file) => issue.documents.push({ name: file.name, requirement: file.requirement, uploadedBy: by, uploadedAt: isoNow(), sourceInvoice: invoice.id, sourceIssue: issue.id, customerCode: invoice.customerCode, customerName: invoice.customer }));
  }
  function shareUpdate(invoice, issue, remark, files) {
    const by = rolePerson(getRole());
    attachFiles(invoice, issue, files, by);
    issue.actionTrail.push({
      who: by,
      what: files.length ? 'shared an update with supporting documents' : 'shared an update',
      type: 'remark',
      when: isoNow(),
      remark,
      files: files.map((file) => ({ name: file.name, requirement: file.requirement }))
    });
    saveRecord(invoice, issue);
    toast(files.length ? 'Update and documents shared.' : 'Update shared.', 'success');
  }
  function startMatrixApproval(invoice, issue, remark, files, by) {
    const process = getTaggedProcess(issue);
    const matrix = getMatrix(issue);
    if (!process || !matrix || !Array.isArray(matrix.levels) || !matrix.levels.length) return false;
    attachFiles(invoice, issue, files, by);
    const list = requests();
    const now = isoNow();
    list.forEach((item) => {
      if (item?.issue?.id === issue.id && item.status === 'pending') {
        item.status = 'superseded';
        item.updatedAt = now;
      }
    });
    const request = {
      id: id('APR'), processId: process.id, processName: process.process, matrixId: matrix.id, matrixName: matrix.name,
      status: 'pending', currentLevel: 1, levels: matrix.levels.map((level, index) => ({ level: index + 1, ownerName: level.ownerName, ownerEmail: level.ownerEmail, status: index === 0 ? 'pending' : 'waiting' })),
      invoice: { id: invoice.id, customer: invoice.customer, customerCode: invoice.customerCode, date: invoice.date, total: invoice.total },
      issue: { id: issue.id, title: issue.title, subStatus: issue.subStatus }, createdAt: now, updatedAt: now,
      trail: [{ action: 'submitted', by, at: now, remark, files: files.map((file) => ({ name: file.name, requirement: file.requirement })) }]
    };
    list.push(request); write(KEYS.requests, list);
    issue.approvalProcessId = process.id; issue.approvalProcessName = process.process; issue.approvalMatrixId = matrix.id; issue.approvalMatrixName = matrix.name;
    issue.approvalStatus = 'pending'; issue.stage = 2; issue.assignedTo = matrix.levels[0].ownerName; issue.assignmentRole = 'approver';
    issue.actionTrail.push({ who: by, what: `accepted the issue as manager and assigned it to Approver L1 (${matrix.levels[0].ownerName})`, type: 'approval', when: now, remark, files: files.map((file) => ({ name: file.name, requirement: file.requirement })) });
    saveRecord(invoice, issue);
    toast(`Issue accepted and assigned to Approver L1: ${matrix.levels[0].ownerName}.`, 'success');
    return true;
  }
  function decideManagerApproval(invoice, issue, decision, remark, files) {
    const by = issue.manager || rolePerson(getRole());
    const now = isoNow();
    issue.managerApprovalStatus = decision === 'rejected' ? 'Rejected' : 'Approved';
    issue.managerApprovalBy = by;
    issue.managerApprovalAt = now;
    if (decision === 'rejected') {
      attachFiles(invoice, issue, files, by);
      const list = requests();
      list.forEach((item) => {
        if (item?.issue?.id === issue.id && item.status === 'pending') { item.status = 'superseded'; item.updatedAt = now; }
      });
      write(KEYS.requests, list);
      issue.approvalStatus = 'not-submitted'; issue.stage = 1; issue.assignedTo = issue.agent || 'Rahul Jain'; issue.assignmentRole = 'agent';
      issue.actionTrail.push({ who: by, what: `rejected the new issue and assigned it back to ${issue.assignedTo}`, type: 'approval', when: now, remark, files: files.map((file) => ({ name: file.name, requirement: file.requirement })) });
      saveRecord(invoice, issue); toast(`Issue rejected and assigned to ${issue.assignedTo}.`, 'error'); return;
    }
    if (startMatrixApproval(invoice, issue, remark, files, by)) return;
    attachFiles(invoice, issue, files, by);
    issue.approvalStatus = 'not-submitted'; issue.stage = 3; issue.assignedTo = issue.actionOwner || issue.agent || 'Rahul Jain'; issue.assignmentRole = issue.actionOwner ? 'action-owner' : 'agent';
    issue.actionTrail.push({ who: by, what: `accepted the new issue and assigned it to ${issue.assignedTo}`, type: 'approval', when: now, remark, files: files.map((file) => ({ name: file.name, requirement: file.requirement })) });
    saveRecord(invoice, issue); toast(`Issue accepted and assigned to ${issue.assignedTo}.`, 'success');
  }
  function decideApproval(invoice, issue, request, decision, remark, files) {
    if (!request || request.status !== 'pending') { toast('There is no pending approval request for this issue.', 'error'); return; }
    const list = requests(); const target = list.find((item) => item.id === request.id); if (!target) return;
    const by = currentApprover(target)?.ownerName || rolePerson(getRole());
    attachFiles(invoice, issue, files, by);
    const currentLevel = Number(target.currentLevel || 1);
    const level = target.levels.find((item) => Number(item.level) === currentLevel) || target.levels[currentLevel - 1];
    level.status = decision;
    const now = isoNow();
    target.trail = Array.isArray(target.trail) ? target.trail : [];
    target.trail.push({ action: decision, by, level: currentLevel, at: now, remark, files: files.map((file) => ({ name: file.name, requirement: file.requirement })) });
    if (decision === 'rejected') {
      target.status = 'rejected'; issue.approvalStatus = 'rejected'; issue.stage = 1; issue.assignedTo = issue.agent || 'Rahul Jain'; issue.assignmentRole = 'agent';
      issue.actionTrail.push({ who: by, what: `rejected approval level ${currentLevel} and assigned the issue back to ${issue.assignedTo}`, type: 'approval', when: now, remark, files });
      toast(`Issue rejected and assigned to ${issue.assignedTo}.`, 'error');
    } else if (currentLevel < target.levels.length) {
      target.currentLevel = currentLevel + 1; target.levels[currentLevel].status = 'pending'; issue.approvalStatus = 'pending'; issue.stage = 2;
      const next = currentApprover(target);
      issue.assignedTo = next?.ownerName || 'Approver'; issue.assignmentRole = 'approver';
      issue.actionTrail.push({ who: by, what: `accepted approval level ${currentLevel} and sent to ${next?.ownerName}`, type: 'approval', when: now, remark, files });
      toast(`Accepted. Assigned to Approver L${target.currentLevel}: ${next?.ownerName}.`, 'success');
    } else {
      target.status = 'approved'; issue.approvalStatus = 'approved'; issue.status = 'Open'; issue.stage = 3; issue.assignedTo = issue.actionOwner || issue.agent || 'Rahul Jain'; issue.assignmentRole = issue.actionOwner ? 'action-owner' : 'agent';
      issue.actionTrail.push({ who: by, what: `completed the final approval and assigned the issue to ${issue.assignedTo} for resolution`, type: 'approval', when: now, remark, files });
      toast(`Final approval completed. Assigned to ${issue.assignedTo} for resolution.`, 'success');
    }
    target.updatedAt = now; write(KEYS.requests, list); saveRecord(invoice, issue);
  }
  function provideResolution(invoice, issue, remark, files) {
    const by = rolePerson(getRole()); attachFiles(invoice, issue, files, by); issue.stage = 4; issue.assignedTo = issue.agent || 'Rahul Jain'; issue.assignmentRole = 'agent';
    issue.actionTrail.push({ who: by, what: `provided a resolution and assigned the issue to ${issue.assignedTo} for closure`, type: 'resolution', when: isoNow(), remark, files });
    saveRecord(invoice, issue); toast(files.length ? `Resolution saved and assigned to ${issue.assignedTo} for closure. Documents are available across this customer’s invoices.` : `Resolution saved and assigned to ${issue.assignedTo} for closure.`, 'success');
  }

  function mergedActivity(issue, request) {
    const entries = [...(issue.actionTrail || [])];
    (request?.trail || []).forEach((entry) => {
      if (entry.action === 'submitted' && entries.some((item) => item.type === 'approval' && item.who === entry.by && item.when === entry.at)) return;
      const signature = `${entry.at}|${entry.action}|${entry.by}`;
      if (!entries.some((item) => `${item.when}|${String(item.what).includes(entry.action) ? entry.action : ''}|${item.who}` === signature)) entries.push({ who: entry.by, what: entry.action === 'submitted' ? 'submitted the issue for approval' : `${entry.action} approval level ${entry.level || request.currentLevel || ''}`.trim(), when: entry.at, remark: entry.remark, files: entry.files, type: 'approval' });
    });
    return entries.sort((a, b) => new Date(b.when || 0) - new Date(a.when || 0));
  }
  function renderActivity(issue, request) {
    const entries = mergedActivity(issue, request);
    document.getElementById('activity-count').textContent = entries.length;
    const supportedTypes = ['approval', 'remark', 'assignment', 'email', 'resolution', 'closure', 'reopen'];
    document.getElementById('activity-list').innerHTML = entries.map((entry) => {
      const rawType = String(entry.type || 'remark').toLowerCase();
      const type = rawType === 'assigned' ? 'assignment' : (supportedTypes.includes(rawType) ? rawType : 'remark');
      const files = Array.isArray(entry.files) ? entry.files : [];
      return `<li class="activityItem activityItem--${type}"><div class="activityHead"><span class="activityType">${esc(type.toUpperCase())}</span><strong class="activityWho">${esc(entry.who || 'System')}</strong><span class="activityWhat">${esc(entry.what || 'updated the issue')}</span><time class="activityWhen">${esc(shortDateTime(entry.when))}</time></div>${entry.remark ? `<p class="activityRemark">${esc(entry.remark)}</p>` : ''}${files.length ? `<div class="activityFiles">${files.map((file) => `<span><i class="bi bi-paperclip" aria-hidden="true"></i>${esc(typeof file === 'string' ? file : (file.name || 'Attachment'))}</span>`).join('')}</div>` : ''}</li>`;
    }).join('') || '<li class="activityItem activityItem--remark"><div class="activityHead"><span class="activityType">REMARK</span><strong>No activity yet</strong></div></li>';
  }
  function renderMatrix(issue, request) {
    const matrix = getMatrix(issue);
    const levels = request?.levels || matrix?.levels || [];
    const hierarchyLevels = levels.map((level, index) => ({ level, index })).reverse();
    const assigned = assignedUser(issue, request);
    document.getElementById('approval-matrix-panel').innerHTML = `<div class="assignedToBanner"><span>Assigned to</span><strong><i class="bi bi-person-check" aria-hidden="true"></i>${esc(assigned || 'No active assignment')}</strong></div><h2>Approval matrix</h2><p>${esc(request?.matrixName || matrix?.name || 'No approval matrix selected')} <span class="matrixOrderNote">Highest level first</span></p><div class="matrixList" aria-label="Approval hierarchy, highest level first">${hierarchyLevels.map(({ level, index }) => {
      let state = level.status || (request ? (index + 1 < Number(request.currentLevel || 1) ? 'approved' : (index + 1 === Number(request.currentLevel || 1) && request.status === 'pending' ? 'current' : 'waiting')) : 'not started');
      if (state === 'pending') state = 'current';
      const stateClass = String(state).toLowerCase().replace(/\s+/g, '-');
      return `<div class="matrixLevel is-${esc(stateClass)}"><div class="matrixLevelMeta"><span class="levelTag">Level ${index + 1}</span><span class="matrixState is-${esc(stateClass)}">${esc(state === 'current' ? 'CURRENT' : state.toUpperCase())}</span></div><div class="matrixPerson"><span class="matrixAvatar"><i class="bi bi-person" aria-hidden="true"></i></span><div><strong>${esc(level.ownerName || 'Unassigned')}</strong><span>${esc(level.ownerEmail || '')}</span></div></div></div>`;
    }).join('') || '<p>No approvers are configured.</p>'}</div>`;
  }
  function renderDetails(invoice, issue, request) {
    const fields = [
      ['Customer code', invoice.customerCode], ['Customer name', invoice.customer], ['Invoice no.', invoice.id], ['Invoice date', prettyDate(invoice.date)], ['Invoice value', money(invoice.total)],
      ['Issue no.', issue.id], ['Primary status', issue.primaryStatus], ['Substatus', issue.subStatus], ['Agent', issue.agent], ['Manager', issue.manager], ['FPR / SPR', `${issue.fpr || '—'} / ${issue.spr || '—'}`],
      ['Action owner', issue.actionOwner], ['Assigned to', assignedUser(issue, request) || '—'], ['Manager approval', managerApprovalStatus(issue)], ['Matrix approval', latestRequest(issue.id)?.status || 'not submitted'], ['Invoice due amount', money(issue.invoiceDueAmount)], ['Invoice due date', prettyDate(issue.invoiceDueDate)], ['Region', issue.region || '—']
    ];
    document.getElementById('complete-details-panel').innerHTML = `<h2>Complete details</h2><p>Reference information for this issue.</p><dl class="detailList">${fields.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value || '—')}</dd></div>`).join('')}</dl>`;
  }
  function nextWorkflowStep(issue, request) {
    if (isClosed(issue)) return { person: 'No further action', action: 'Workflow complete', complete: true };
    if (hasResolution(issue)) return { person: issue.agent || 'Agent', action: 'Review resolution and close issue', complete: false };

    const managerStatus = managerApprovalStatus(issue);
    const matrix = getMatrix(issue);
    const matrixLevels = request?.levels || matrix?.levels || [];
    const firstLevel = matrixLevels.find((level) => Number(level.level || 1) === 1) || matrixLevels[0];

    if (managerStatus === 'rejected') return { person: issue.agent || 'Agent', action: 'Address rejection and resubmit for manager approval', complete: false };
    if (request?.status === 'rejected') return { person: issue.agent || 'Agent', action: 'Address rejection and resubmit for approval', complete: false };
    if (managerStatus === 'pending') {
      if (firstLevel) return { person: firstLevel.ownerName || 'Approver L1', action: 'Approver L1 approval', complete: false };
      return { person: issue.actionOwner || issue.agent || 'Action owner', action: 'Provide resolution', complete: false };
    }
    if (request?.status === 'pending') {
      const currentLevel = Number(request.currentLevel || 1);
      const nextLevel = matrixLevels
        .filter((level, index) => Number(level.level || index + 1) > currentLevel)
        .sort((left, right) => Number(left.level || 0) - Number(right.level || 0))[0];
      if (nextLevel) return { person: nextLevel.ownerName || `Approver L${currentLevel + 1}`, action: `Approver L${Number(nextLevel.level || currentLevel + 1)} approval`, complete: false };
      return { person: issue.actionOwner || issue.agent || 'Action owner', action: 'Provide resolution', complete: false };
    }
    if (request?.status === 'approved') return { person: issue.actionOwner || issue.agent || 'Action owner', action: 'Provide resolution', complete: false };
    if (firstLevel) return { person: firstLevel.ownerName || 'Approver L1', action: 'Approver L1 approval', complete: false };
    return { person: issue.actionOwner || issue.agent || 'Action owner', action: 'Provide resolution', complete: false };
  }
  function renderRoute(issue, request) {
    const next = nextWorkflowStep(issue, request);
    document.getElementById('before-after-panel').innerHTML = `<h2>What's next!</h2><div class="nextStepCard"><span class="nextStepIcon"><i class="bi ${next.complete ? 'bi-check2' : 'bi-arrow-right'}" aria-hidden="true"></i></span><div><strong>${esc(next.person)}</strong><span>${esc(next.action)}</span></div></div>`;
  }

  const landing = document.getElementById('issue-tracker-landing');
  const detail = document.getElementById('issue-detail-page');
  if (landing) initLanding();
  if (detail) initDetail();
})();
