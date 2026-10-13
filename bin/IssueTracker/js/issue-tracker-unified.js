(function () {
  'use strict';

  const CONFIG = window.IssueTrackerConfig;
  const submissionIssuesExist = (() => { try { return JSON.parse(localStorage.getItem('customIssues') || '[]').some(issue => issue.source === 'submission-module'); } catch (_) { return false; } })();
  if (submissionIssuesExist) CONFIG?.ensureWorkflowVersion?.();
  else CONFIG?.ensureCleanSlate();

  const KEYS = {
    base: 'issueTrackerBaseData',
    custom: 'customIssues',
    processes: 'approval_processes',
    matrices: 'approval_matrices',
    requests: 'approval_requests',
    role: 'issue_tracker_role',
    activeUser: 'issue_tracker_active_user',
    activeApprover: 'approver_active_user',
    portfolioInvoiceCount: 'issueTrackerPortfolioInvoiceCount',
    notifications: 'ineburaNotificationCenter'
  };
  const PAGE_SIZE = 5;
  // Matches the current LP Agent demo portfolio; a live total can override this localStorage key.
  const DEFAULT_PORTFOLIO_INVOICE_COUNT = 27;
  const USERS = (CONFIG?.users || []).map((user) => user.name);
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
  const invoiceDueStatus = (issue) => {
    const value = String(issue?.invoiceDueDate || '').trim();
    if (!value) return 'not-due';
    const dueDate = /^\d{4}-\d{2}-\d{2}/.test(value) ? new Date(`${value.slice(0, 10)}T00:00:00`) : new Date(value);
    if (Number.isNaN(dueDate.getTime())) return 'not-due';
    dueDate.setHours(0, 0, 0, 0);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate <= today ? 'due' : 'not-due';
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
          { level: 3, ownerName: 'Sanjay Rao', ownerEmail: 'sanjay.rao@example.com' }
        ] },
        { id: 'MATRIX_PO_APPROVAL_DEFAULT', name: 'PO Approval Default', levels: [
          { level: 1, ownerName: 'Kavita Nair', ownerEmail: 'kavita.nair@example.com' },
          { level: 2, ownerName: 'Vikram Singh', ownerEmail: 'vikram.singh@example.com' },
          { level: 3, ownerName: 'Pooja Mehta', ownerEmail: 'pooja.mehta@example.com' }
        ] },
        { id: 'MATRIX_DELIVERY_CHALLAN_DEFAULT', name: 'Delivery Challan Default', levels: [
          { level: 1, ownerName: 'Anoop Sharma', ownerEmail: 'anoop.sharma@example.com' },
          { level: 2, ownerName: 'Priya Verma', ownerEmail: 'priya.verma@example.com' },
          { level: 3, ownerName: 'Sanjay Rao', ownerEmail: 'sanjay.rao@example.com' }
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
    const approvers = CONFIG?.usersForRole('approver') || [];
    let matricesChanged = false;
    matrices = matrices.map((matrix, matrixIndex) => ({
      ...matrix,
      levels: (matrix.levels || []).map((level, levelIndex) => {
        if (CONFIG?.roleOf(level.ownerName) === 'approver') return level;
        const replacement = approvers[(matrixIndex * 3 + levelIndex) % Math.max(approvers.length, 1)];
        matricesChanged = true;
        return replacement ? { ...level, ownerName: replacement.name, ownerEmail: `${replacement.name.toLowerCase().replace(/\s+/g, '.')}@example.com` } : level;
      })
    }));
    if (matricesChanged) write(KEYS.matrices, matrices);
    return { processes, matrices };
  }

  function loadData() {
    const base = read(KEYS.base, []);
    const custom = read(KEYS.custom, []);
    const cloned = JSON.parse(JSON.stringify(Array.isArray(base) ? base : []));
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
      ...raw,
      id: raw.id || `ISS_MAN_${index + 1}`, title: raw.title || raw.subStatus || 'Manual issue', status: raw.status || 'Open',
      created: raw.created || new Date().toISOString().slice(0, 10), description: raw.description || '', primaryStatus: raw.primaryStatus || 'Clarification Needed',
      broadStatus: raw.broadStatus || 'External dependency', subStatus: raw.subStatus || raw.title || 'Further Documents Required', stage: Number(raw.stage || 1),
      agent: raw.agent || 'Rahul Jain', manager: raw.manager || 'Meera Iyer', fpr: raw.fpr || '', spr: raw.spr || '', actionOwner: raw.actionOwner || 'Rahul Jain',
      approvalProcessId: raw.approvalProcessId || '', approvalProcessName: raw.approvalProcessName || '', approvalMatrixId: raw.approvalMatrixId || '', approvalMatrixName: raw.approvalMatrixName || '',
      managerApprovalStatus: raw.managerApprovalStatus || (isClosed(raw) ? 'Approved' : 'Pending'), assignedTo: raw.assignedTo || (isClosed(raw) ? '' : (raw.manager || 'Meera Iyer')), assignmentRole: raw.assignmentRole || (isClosed(raw) ? '' : 'manager'),
      workflowStep: raw.workflowStep || '', initialVisibilityReleased: Boolean(raw.initialVisibilityReleased || raw.visibilityReleasedAt || raw.skipManagerApproval), visibilityReleasedAt: raw.visibilityReleasedAt || '', skipManagerApproval: Boolean(raw.skipManagerApproval),
      matrixApprovalStatus: raw.matrixApprovalStatus || raw.approvalStatus || 'not-submitted', resolutionStatus: raw.resolutionStatus || '', resolutionVersion: Number(raw.resolutionVersion || 0), resolutionDecisionVersion: Number(raw.resolutionDecisionVersion || 0),
      rejectionKind: raw.rejectionKind || '', rejectedBy: raw.rejectedBy || '', rejectedAt: raw.rejectedAt || '', pendingProcessId: raw.pendingProcessId || '',
      connectedUsers: Array.isArray(raw.connectedUsers) ? raw.connectedUsers : [],
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
    return records.find((record) => (!invoiceId || record.invoice.id === invoiceId || (record.issue.affectedInvoices || []).some(item => item.invoiceNo === invoiceId)) && (!issueId || record.issue.id === issueId)) || null;
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
    if (issue.source === 'submission-module' && issue.issueReason === 'Docs Pending' && window.SubmissionJourney) {
      try {
        const C = window.SubmissionJourney;
        const state = C.load(localStorage);
        const custom = read(KEYS.custom, []);
        const linked = C.readIssues(localStorage);
        const attachments = C.issueAttachments(linked);
        const requests = read(KEYS.requests, []);
        const changed = C.reconcileIssues(state, custom, attachments);
        const observed = C.observe(state, linked, C.today(), attachments);
        const approvalsChanged = C.reconcileApprovalRequests(custom, requests);
        if (changed || observed || approvalsChanged) C.transaction(localStorage, { [C.KEY]:state, ...(changed ? { [KEYS.custom]:custom } : {}), ...(approvalsChanged ? { [KEYS.requests]:requests } : {}) });
      } catch (error) {
        toast('Document saved. Refresh Submission Details to reconcile the linked issue.', 'error');
      }
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
    if (value === 'approved' || value === 'rejected' || value === 'pending' || value === 'superseded') return value;
    return isClosed(issue) ? 'approved' : 'pending';
  }
  function hasResolution(issue) {
    return issue?.workflowStep === 'resolution-review' || issue?.resolutionStatus === 'pending-review';
  }
  function workflowState(issue, request = latestRequest(issue.id)) {
    const managerStatus = managerApprovalStatus(issue);
    const matrix = getMatrix(issue);
    const levels = request?.levels || matrix?.levels || [];
    const orderedLevels = levels.map((level, index) => ({ ...level, level: Number(level.level || index + 1) }))
      .sort((left, right) => left.level - right.level);
    const actionOwner = issue.actionOwner || issue.agent || 'Rahul Jain';
    const agent = issue.agent || 'Rahul Jain';
    const firstLevel = orderedLevels[0] || null;
    const currentLevelNumber = Number(request?.currentLevel || 1);
    const currentLevel = orderedLevels.find((level) => level.level === currentLevelNumber) || orderedLevels[currentLevelNumber - 1] || null;
    const nextLevel = orderedLevels.find((level) => level.level > currentLevelNumber) || null;
    const result = (step, label, currentAssignee, next, detail) => ({
      issueState: isClosed(issue) ? 'closed' : 'open',
      step,
      label,
      detail: detail || label,
      currentAssignee: currentAssignee || '',
      actionOwner,
      next,
      contributionRights: 'Permitted users may add documents and remarks without advancing the workflow.'
    });

    const explicit = issue.workflowStep;
    if (isClosed(issue)) return result('closed', 'Closed', '', { person: 'No further action', action: 'Workflow complete', complete: true }, 'Workflow complete');
    if (explicit === 'resolution-review' || hasResolution(issue)) return result('resolution-review', 'Resolution review', agent, { person: agent, action: 'Accept or reject resolution', complete: false }, 'Resolution decision required');
    if (explicit === 'resolution-accepted') return result('resolution-accepted', 'Resolution accepted', agent, { person: agent, action: 'Close or reassign for remaining information', complete: false }, 'Resolution accepted; issue remains open');
    if (explicit === 'agent-correction') return result('agent-correction', 'Correction required', agent, { person: issue.manager || 'Manager', action: 'Manager review after the agent remark', complete: false }, 'Approval was rejected');
    if (explicit === 'manager-review' || explicit === 'reopen-manager-review') {
      return result('manager-review', 'Manager review', issue.manager || 'Meera Iyer', firstLevel
        ? { person: firstLevel.ownerName || 'Approver L1', action: 'Approver L1 approval', complete: false }
        : { person: actionOwner, action: 'Provide resolution', complete: false }, 'Manager decision required');
    }
    if (explicit?.startsWith('approver-l')) {
      return result(`approver-l${currentLevelNumber}`, `Approver L${currentLevelNumber}`, currentLevel?.ownerName || issue.assignedTo || 'Approver', nextLevel
        ? { person: nextLevel.ownerName || `Approver L${nextLevel.level}`, action: `Approver L${nextLevel.level} approval`, complete: false }
        : { person: actionOwner, action: 'Provide resolution', complete: false }, `Approval level ${currentLevelNumber}`);
    }
    if (explicit === 'resolution-work') return result('resolution-work', 'Resolution work', actionOwner, { person: agent, action: 'Review submitted resolution', complete: false }, 'Provide resolution');
    // Explicit workflow steps are authoritative. The fallbacks below only support
    // older stored records which pre-date workflowStep.
    if (managerStatus === 'rejected' || request?.status === 'rejected') return result('agent-correction', 'Correction required', agent, { person: issue.manager || 'Manager', action: 'Manager review after the agent remark', complete: false }, 'Approval was rejected');
    if (managerStatus === 'pending') {
      return result('manager-review', 'Manager review', issue.manager || 'Meera Iyer', firstLevel
        ? { person: firstLevel.ownerName || 'Approver L1', action: 'Approver L1 approval', complete: false }
        : { person: actionOwner, action: 'Provide resolution', complete: false }, 'Manager decision required');
    }
    if (request?.status === 'pending') {
      return result(`approver-l${currentLevelNumber}`, `Approver L${currentLevelNumber}`, currentLevel?.ownerName || issue.assignedTo || 'Approver', nextLevel
        ? { person: nextLevel.ownerName || `Approver L${nextLevel.level}`, action: `Approver L${nextLevel.level} approval`, complete: false }
        : { person: actionOwner, action: 'Provide resolution', complete: false }, `Approval level ${currentLevelNumber}`);
    }
    if (request?.status === 'approved') return result('resolution-work', 'Resolution work', actionOwner, { person: agent, action: 'Review submitted resolution', complete: false }, 'Provide resolution');
    if (managerStatus === 'approved' && firstLevel) {
      return result('approver-l1', 'Approver L1', firstLevel.ownerName || 'Approver L1', orderedLevels[1]
        ? { person: orderedLevels[1].ownerName || 'Approver L2', action: 'Approver L2 approval', complete: false }
        : { person: actionOwner, action: 'Provide resolution', complete: false }, 'Manager review complete');
    }
    return result('resolution-work', 'Resolution work', actionOwner, { person: agent, action: 'Review resolution and close issue', complete: false }, 'Provide resolution');
  }
  function samePerson(left, right) {
    return cleanName(left).toLowerCase() === cleanName(right).toLowerCase();
  }
  function assignedUser(issue, request = latestRequest(issue.id)) {
    return workflowState(issue, request).currentAssignee;
  }
  function approvalDecisionContext(issue, request = latestRequest(issue.id), role = getRole()) {
    if (!['manager', 'approver'].includes(role) || isClosed(issue)) return null;
    const loggedInUser = rolePerson(role);
    const assigned = assignedUser(issue, request);
    if (!samePerson(loggedInUser, assigned)) return null;
    if (role === 'manager' && managerApprovalStatus(issue) === 'pending' && ['manager-review', 'reopen-manager-review'].includes(issue.workflowStep)) {
      return { kind: 'manager', label: 'Manager approval', actor: issue.manager || loggedInUser };
    }
    if (role === 'approver' && request?.status === 'pending') {
      const level = Number(request.currentLevel || 1);
      return { kind: 'approver', label: `Approver L${level} approval`, actor: currentApprover(request)?.ownerName || loggedInUser, level };
    }
    return null;
  }
  function approvalStatus(issue) {
    const request = latestRequest(issue.id);
    const managerStatus = managerApprovalStatus(issue);
    if (issue.workflowStep === 'agent-correction') return 'rejected';
    if (['manager-review', 'reopen-manager-review'].includes(issue.workflowStep)) return 'pending';
    if (String(issue.workflowStep || '').startsWith('approver-l')) return 'pending';
    if (['resolution-work', 'resolution-review', 'resolution-accepted', 'closed'].includes(issue.workflowStep)) {
      return issue.matrixApprovalStatus === 'approved' ? 'approved' : 'not-submitted';
    }
    if (managerStatus === 'pending' || managerStatus === 'rejected') return managerStatus;
    if (request?.status === 'pending' || request?.status === 'rejected' || request?.status === 'approved') return request.status;
    return managerStatus === 'approved' ? 'approved' : 'not-submitted';
  }
  function getRole() {
    const query = new URLSearchParams(location.search).get('role');
    const role = query || localStorage.getItem(KEYS.role) || 'agent';
    return ['agent', 'manager', 'approver', 'action-owner'].includes(role) ? role : 'agent';
  }
  function setRole(role) {
    localStorage.setItem(KEYS.role, role);
    const url = new URL(location.href);
    url.searchParams.set('role', role);
    history.replaceState({}, '', url);
  }
  function defaultUserForRole(role) {
    return CONFIG?.defaultUser(role) || (role === 'manager' ? 'Mukesh Mishra' : (role === 'approver' ? 'Anoop Sharma' : (role === 'action-owner' ? 'Neha Gupta' : 'Aditi Sharma')));
  }
  function roleUserKey(role) {
    return `${KEYS.activeUser}_${role}`;
  }
  function usersForRole(role) {
    return (CONFIG?.usersForRole(role) || []).map((user) => user.name);
  }
  function setActiveUser(user, role = getRole()) {
    const activeUser = cleanName(user) || defaultUserForRole(role);
    localStorage.setItem(KEYS.activeUser, activeUser);
    localStorage.setItem(roleUserKey(role), activeUser);
    if (role === 'approver') localStorage.setItem(KEYS.activeApprover, activeUser);
    const url = new URL(location.href);
    url.searchParams.set('user', activeUser);
    history.replaceState({}, '', url);
  }
  function rolePerson(role) {
    const queryUser = cleanName(new URLSearchParams(location.search).get('user'));
    if (queryUser) return queryUser;
    const savedUser = cleanName(localStorage.getItem(roleUserKey(role)));
    if (savedUser) return savedUser;
    if (role === 'approver') return cleanName(localStorage.getItem(KEYS.activeApprover)) || defaultUserForRole(role);
    return defaultUserForRole(role);
  }
  function visibilityReleased(issue) {
    return Boolean(issue.initialVisibilityReleased || issue.visibilityReleasedAt || issue.skipManagerApproval);
  }
  function canViewIssue(issue, role = getRole(), user = rolePerson(role)) {
    const isAgent = role === 'agent' && samePerson(user, issue.agent);
    const isManager = role === 'manager' && samePerson(user, issue.manager);
    if (!visibilityReleased(issue)) return isAgent || isManager;
    if (isAgent || isManager) return true;
    const requestApprovers = requests()
      .filter((request) => request?.issue?.id === issue.id)
      .flatMap((request) => (request.levels || []).map((level) => level.ownerName));
    const matrixApprovers = (getMatrix(issue)?.levels || []).map((level) => level.ownerName);
    const connectedUsers = [issue.actionOwner, issue.resolutionProvidedBy, ...(issue.connectedUsers || []), ...requestApprovers, ...matrixApprovers];
    if (role === 'action-owner') return connectedUsers.some((name) => samePerson(name, user));
    if (role === 'approver') return [...requestApprovers, ...matrixApprovers, ...(issue.connectedUsers || [])].some((name) => samePerson(name, user));
    return false;
  }
  function visibleIssueRecords(role = getRole(), user = rolePerson(role)) {
    return allIssueRecords().filter(({ issue }) => canViewIssue(issue, role, user));
  }
  function isRejected(issue) {
    return !isClosed(issue) && Boolean(issue.rejectionKind || issue.rejectedAt)
      && (issue.workflowStep === 'agent-correction' || issue.rejectionKind === 'resolution');
  }
  function rejectionSourceLabel(issue) {
    if (issue.rejectionKind === 'manager') return 'Manager approval';
    if (issue.rejectionKind === 'resolution') return 'Resolution review';
    const approverLevel = String(issue.rejectionKind || '').match(/^approver-l(\d+)$/i)?.[1];
    return approverLevel ? `Approver ${approverLevel}` : 'Approval';
  }
  function canReviewResolution(issue, role = getRole()) {
    return !isClosed(issue) && issue.workflowStep === 'resolution-review'
      && issue.resolutionDecisionVersion !== issue.resolutionVersion
      && role === 'agent' && samePerson(rolePerson(role), issue.agent);
  }
  function actionState(issue, role) {
    const request = latestRequest(issue.id);
    const workflow = workflowState(issue, request);
    if (workflow.issueState === 'closed') return { key: 'closed', label: 'Issue completed', meta: 'Workflow complete' };
    if (workflow.step === 'resolution-review') {
      return canReviewResolution(issue, role)
        ? { key: 'resolution-review', label: 'Review resolution', meta: 'A formal resolution decision is required' }
        : { key: 'waiting', label: `Assigned to ${workflow.currentAssignee || 'the issue agent'}`, meta: `Resolution review · Waiting for ${workflow.currentAssignee || 'the issue agent'}` };
    }
    const assigned = workflow.currentAssignee;
    const mine = samePerson(assigned, rolePerson(role));
    const decision = approvalDecisionContext(issue, request, role);
    if (!mine) return { key: 'waiting', label: `Assigned to ${assigned || 'another user'}`, meta: `${workflow.label} · Waiting for ${assigned || 'another user'}` };
    if (decision) return { key: 'approval', label: decision.label, meta: decision.kind === 'manager' ? 'Manager decision required' : `Approval level ${decision.level}` };
    if (workflow.step === 'resolution-accepted') return { key: 'documents', label: issue.subStatus, meta: 'Resolution accepted · Assigned to you' };
    if (workflow.step === 'resolution-work') return { key: 'resolution', label: 'Provide resolution', meta: 'Resolution work · Assigned to you' };
    return { key: 'documents', label: issue.subStatus || issue.title || 'Add documents and remarks', meta: `${workflow.label} · Assigned to you` };
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
    const savedUser = localStorage.getItem(roleUserKey(role)) || (role === 'approver' ? localStorage.getItem(KEYS.activeApprover) : '');
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
    let sortKey = '';
    let sortDirection = 'asc';
    let groupedInvoiceIds = [];
    const collapsedInvoices = new Set();
    const body = document.getElementById('invoice-table-body');
    const sortButtons = [...document.querySelectorAll('[data-sort]')];
    const search = document.getElementById('invoice-search-input');
    const agentFilter = document.getElementById('agent-filter');
    const managerFilter = document.getElementById('manager-filter');
    const primaryStatusFilter = document.getElementById('primary-status-filter');
    const subStatusFilter = document.getElementById('sub-status-filter');
    const assigneeFilter = document.getElementById('assignee-filter');
    const actionOwnerFilter = document.getElementById('action-owner-filter');
    const invoiceDueFilter = document.getElementById('invoice-due-filter');
    const regionFilter = document.getElementById('region-filter');
    const filterPanel = document.getElementById('issue-filter-menu');
    const landingFilters = [agentFilter, managerFilter, primaryStatusFilter, subStatusFilter, assigneeFilter, actionOwnerFilter, invoiceDueFilter, regionFilter];

    const selectedFilterValues = (select) => [...select.selectedOptions]
      .map((option) => option.value)
      .filter((value) => value !== 'all');
    const resetFilter = (select) => {
      [...select.options].forEach((option) => { option.selected = option.value === 'all'; });
    };
    const matchesSelectedFilter = (select, value, exact = false) => {
      const selected = selectedFilterValues(select);
      if (!selected.length) return true;
      return selected.some((filterValue) => exact ? value === filterValue : samePerson(value, filterValue));
    };

    const syncFilterChoice = (select) => {
      const choice = select.closest('[data-filter-choice]');
      if (!choice) return;
      const badge = choice.querySelector('.filterBadge');
      const options = choice.querySelector('[data-filter-options]');
      const selectedValues = selectedFilterValues(select);
      const selectedLabels = [...select.options]
        .filter((option) => selectedValues.includes(option.value))
        .map((option) => option.textContent);
      badge.textContent = selectedLabels.length === 0 ? 'All' : (selectedLabels.length === 1 ? selectedLabels[0] : `${selectedLabels.length} selected`);
      options.innerHTML = [...select.options].map((option) => {
        const isSelected = option.value === 'all' ? selectedValues.length === 0 : selectedValues.includes(option.value);
        return `<button class="filterItem${isSelected ? ' is-selected' : ''}" type="button" data-filter-value="${esc(option.value)}" aria-pressed="${String(isSelected)}"><span>${esc(option.textContent)}</span><i class="bi bi-check2" aria-hidden="true"></i></button>`;
      }).join('');
    };
    const populatePersonFilter = (select, names, allLabel) => {
      const selected = new Set(selectedFilterValues(select));
      const options = [...new Set(names.filter(Boolean).map(cleanName))].sort((left, right) => left.localeCompare(right));
      select.innerHTML = `<option value="all">${esc(allLabel)}</option>${options.map((name) => `<option value="${esc(name)}">${esc(name)}</option>`).join('')}`;
      const retained = options.filter((value) => selected.has(value));
      [...select.options].forEach((option) => { option.selected = retained.length ? retained.includes(option.value) : option.value === 'all'; });
      syncFilterChoice(select);
    };
    const sortValue = ({ invoice, issue }, key) => {
      if (key === 'customerCode') return invoice.customerCode || '';
      if (key === 'customerName') return invoice.customer || '';
      if (key === 'invoiceNo') return invoice.id || '';
      if (key === 'invoiceValue') return Number(invoice.total || issue.invoiceTotal || 0);
      if (key === 'issueId') return issue.id || '';
      return '';
    };
    const compareRecords = (left, right) => {
      const leftValue = sortValue(left, sortKey);
      const rightValue = sortValue(right, sortKey);
      const direction = sortDirection === 'desc' ? -1 : 1;
      if (typeof leftValue === 'number' && typeof rightValue === 'number') return (leftValue - rightValue) * direction;
      return String(leftValue).localeCompare(String(rightValue), undefined, { numeric: true, sensitivity: 'base' }) * direction;
    };

    function render() {
      data = loadData();
      approvalData = seedApprovals();
      const role = getRole();
      const records = visibleIssueRecords(role, rolePerson(role));
      populatePersonFilter(agentFilter, records.map(({ issue }) => issue.agent), 'All agents');
      populatePersonFilter(managerFilter, records.map(({ issue }) => issue.manager), 'All managers');
      populatePersonFilter(primaryStatusFilter, records.map(({ issue }) => issue.primaryStatus), 'All primary statuses');
      populatePersonFilter(subStatusFilter, records.map(({ issue }) => issue.subStatus), 'All substatuses');
      populatePersonFilter(assigneeFilter, records.map(({ issue }) => assignedUser(issue)), 'All assignees');
      populatePersonFilter(actionOwnerFilter, records.map(({ issue }) => issue.actionOwner), 'All action owners');
      populatePersonFilter(regionFilter, records.map(({ issue }) => issue.region), 'All regions');
      syncFilterChoice(invoiceDueFilter);
      const open = records.filter((item) => !isClosed(item.issue));
      const closed = records.filter((item) => isClosed(item.issue));
      const submission = records.filter((item) => item.issue.source === 'submission-module');
      const mine = open.filter((item) => isMyWork(item, role));
      const waiting = open.filter((item) => actionState(item.issue, role).key === 'waiting');
      const waitingApprovals = waiting.filter((item) => approvalStatus(item.issue) === 'pending');
      const openInvoices = new Set(open.flatMap(({ invoice, issue }) => issue.affectedInvoices?.length ? issue.affectedInvoices.map(item => item.invoiceNo) : [invoice.id])).size;
      const configuredPortfolioCount = Number(read(KEYS.portfolioInvoiceCount, DEFAULT_PORTFOLIO_INVOICE_COUNT));
      const trackedInvoiceCount = new Set([...data.map(invoice => invoice.id), ...records.flatMap(({ invoice, issue }) => issue.affectedInvoices?.length ? issue.affectedInvoices.map(item => item.invoiceNo) : [invoice.id])]).size;
      const portfolioInvoiceCount = Math.max(Number.isFinite(configuredPortfolioCount) && configuredPortfolioCount > 0 ? configuredPortfolioCount : DEFAULT_PORTFOLIO_INVOICE_COUNT, trackedInvoiceCount);
      const issueInvoicePercent = portfolioInvoiceCount ? Number(((openInvoices / portfolioInvoiceCount) * 100).toFixed(1)) : 0;
      const invoiceAmounts = new Map();
      open.forEach(({ invoice, issue }) => (issue.affectedInvoices?.length ? issue.affectedInvoices : [{ invoiceNo: invoice.id, value: issue.invoiceDueAmount }]).forEach(item => invoiceAmounts.set(item.invoiceNo, Number(item.value || 0))));
      const netDue = [...invoiceAmounts.values()].reduce((sum, value) => sum + value, 0);
      document.getElementById('statMyActions').textContent = mine.length;
      document.getElementById('statOpenIssues').textContent = open.length;
      document.getElementById('statOpenInvoices').textContent = `Across ${openInvoices} invoices`;
      document.getElementById('statSubmissionIssues').textContent = submission.length;
      const openSubmission = submission.filter((item) => !isClosed(item.issue)).length;
      document.getElementById('statSubmissionBreakdown').textContent = `${openSubmission} open · ${submission.length - openSubmission} closed`;
      document.getElementById('statWaiting').textContent = waiting.length;
      document.getElementById('statWaitingApprovals').textContent = `${waitingApprovals.length} awaiting approval`;
      document.getElementById('statInvoiceAmount').textContent = money(netDue);
      document.getElementById('statIssueInvoicePercent').textContent = `${issueInvoicePercent}% of portfolio invoices · ${openInvoices} of ${portfolioInvoiceCount}`;
      document.getElementById('tabMyWorkCount').textContent = mine.length;
      document.getElementById('tabOpenCount').textContent = open.length;
      document.getElementById('tabSubmissionCount').textContent = submission.length;
      document.getElementById('tabClosedCount').textContent = closed.length;
      const openTab = document.querySelector('.workTab[data-view="open"]');
      openTab?.querySelector('.rejectedTabCount')?.remove();
      if (role === 'manager') {
        const rejectedCount = open.filter(({ issue }) => isRejected(issue)).length;
        if (rejectedCount) openTab?.insertAdjacentHTML('beforeend', `<em class="rejectedTabCount">${rejectedCount} rejected</em>`);
      }

      let filtered = view === 'closed' ? closed : view === 'submission' ? submission : view === 'open' ? open : mine;
      const query = search.value.trim().toLowerCase();
      if (query) filtered = filtered.filter(({ invoice, issue }) => [invoice.id, invoice.customer, invoice.customerCode, issue.id, issue.title, issue.primaryStatus, issue.subStatus, issue.agent, issue.manager, assignedUser(issue), issue.actionOwner, ...(issue.affectedInvoices || []).map(item => item.invoiceNo)].join(' ').toLowerCase().includes(query));
      filtered = filtered.filter(({ issue }) => matchesSelectedFilter(agentFilter, issue.agent));
      filtered = filtered.filter(({ issue }) => matchesSelectedFilter(managerFilter, issue.manager));
      filtered = filtered.filter(({ issue }) => matchesSelectedFilter(primaryStatusFilter, issue.primaryStatus));
      filtered = filtered.filter(({ issue }) => matchesSelectedFilter(subStatusFilter, issue.subStatus));
      filtered = filtered.filter(({ issue }) => matchesSelectedFilter(assigneeFilter, assignedUser(issue)));
      filtered = filtered.filter(({ issue }) => matchesSelectedFilter(actionOwnerFilter, issue.actionOwner));
      filtered = filtered.filter(({ issue }) => matchesSelectedFilter(invoiceDueFilter, invoiceDueStatus(issue), true));
      filtered = filtered.filter(({ issue }) => matchesSelectedFilter(regionFilter, issue.region));
      if (sortKey) filtered = [...filtered].sort(compareRecords);
      const groups = [];
      filtered.forEach((record) => {
        let group = groups.find((item) => item.invoice.id === record.invoice.id);
        if (!group) { group = { invoice: record.invoice, records: [] }; groups.push(group); }
        group.records.push(record);
      });
      groupedInvoiceIds = groups.map((group) => group.invoice.id);
      const pages = Math.max(1, Math.ceil(groups.length / PAGE_SIZE));
      page = Math.min(Math.max(1, page), pages);
      const shown = groups.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
      body.innerHTML = shown.map((group) => {
        const due = group.records.reduce((sum, item) => sum + Number(item.issue.invoiceDueAmount || 0), 0);
        const collapsed = collapsedInvoices.has(group.invoice.id);
        return `<tr class="invoiceGroupRow${collapsed ? ' is-collapsed' : ''}"><td colspan="10"><button class="invoiceGroupToggle" type="button" data-invoice-toggle="${esc(group.invoice.id)}" aria-expanded="${String(!collapsed)}"><span class="invoiceGroupIdentity"><i class="bi bi-chevron-down invoiceGroupChevron" aria-hidden="true"></i><strong><i class="bi bi-receipt" aria-hidden="true"></i> ${esc(group.invoice.id)}</strong><span>${group.records.length} issue${group.records.length === 1 ? '' : 's'}</span></span><span class="invoiceGroupAmount">Net due ${esc(money(due))}</span></button></td></tr>` + group.records.map(({ invoice, issue }) => {
          const state = actionState(issue, role);
          const params = new URLSearchParams({ invoice: invoice.id, issue: issue.id, role, user: rolePerson(role) });
          const assignee = assignedUser(issue) || issue.assignedTo || '—';
          const invoiceValue = Number(invoice.total || issue.invoiceTotal || 0);
          const rejected = isRejected(issue);
          const rejectedMeta = rejected ? `<span class="rejectedRowMeta"><i class="bi bi-exclamation-circle"></i> Rejected by ${esc(issue.rejectedBy || 'approver')} · ${esc(rejectionSourceLabel(issue))} · ${esc(shortDateTime(issue.rejectedAt))}</span>` : '';
          return `<tr class="issueRow${rejected ? ' is-rejected' : ''}" data-invoice-issue="${esc(invoice.id)}"${collapsed ? ' hidden' : ''}><td><span class="actionName">${esc(issue.documentRequirement || issue.subStatus || issue.title || '—')}${issue.documentScope === 'customer' ? `<span class="actionMeta">Shared customer dependency · ${(issue.affectedInvoices || []).length} invoices impacted</span>` : ''}${rejected ? '<span class="rejectedPill">Rejected</span>' : ''}</span><span class="actionMeta">${esc(state.meta)}</span>${rejectedMeta}</td><td>${esc(invoice.customerCode)}</td><td>${esc(invoice.customer)}</td><td><strong>${esc(invoice.id)}</strong>${issue.documentScope === 'customer' ? `<span class="actionMeta">+ ${Math.max(0, (issue.affectedInvoices || []).length - 1)} linked invoices</span>` : ''}</td><td class="invoiceValueCell">${esc(money(invoiceValue))}</td><td>${esc(issue.id)}</td><td class="assignedToCell"><i class="bi bi-person" aria-hidden="true"></i><span>${esc(assignee)}</span></td><td>${esc(prettyDate(issue.created))}</td><td class="openDaysCell">${esc(issueOpenDays(issue))}</td><td><a class="smallAction${['documents', 'approval', 'resolution', 'resolution-review'].includes(state.key) ? ' is-primary' : ''}" href="issuetrackerdetail.html?${params}">${state.key === 'closed' ? 'View' : 'Open task'}</a></td></tr>`;
        }).join('');
      }).join('');
      body.querySelectorAll('[data-invoice-toggle]').forEach((button) => button.addEventListener('click', () => {
        const invoiceId = button.dataset.invoiceToggle;
        if (collapsedInvoices.has(invoiceId)) collapsedInvoices.delete(invoiceId);
        else collapsedInvoices.add(invoiceId);
        render();
      }));
      const emptyState = document.getElementById('issue-empty-state');
      emptyState.querySelector('strong').textContent = view === 'submission' ? 'No submission issues in this view' : 'No issues in this view';
      emptyState.querySelector('span').textContent = view === 'submission' && !submission.length
        ? 'Issues raised from invoice submission will appear here when visible to you.'
        : 'Try another tab or clear the filters.';
      emptyState.classList.toggle('hidden', groups.length > 0);
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
      sortButtons.forEach((button) => {
        const active = button.dataset.sort === sortKey;
        const header = button.closest('th');
        const icon = button.querySelector('i');
        button.classList.toggle('is-active', active);
        header.setAttribute('aria-sort', active ? (sortDirection === 'asc' ? 'ascending' : 'descending') : 'none');
        icon.className = `bi ${active ? (sortDirection === 'asc' ? 'bi-chevron-up' : 'bi-chevron-down') : 'bi-arrow-down-up'}`;
      });
      const filterCount = landingFilters.reduce((total, filter) => total + Number(selectedFilterValues(filter).length > 0), 0);
      const count = document.getElementById('active-filter-count');
      count.textContent = filterCount;
      count.classList.toggle('hidden', filterCount === 0);
      const toggleAll = document.getElementById('toggle-all-invoices');
      const allCollapsed = groupedInvoiceIds.length > 0 && groupedInvoiceIds.every((invoiceId) => collapsedInvoices.has(invoiceId));
      toggleAll.disabled = groupedInvoiceIds.length === 0;
      toggleAll.innerHTML = allCollapsed
        ? '<i class="bi bi-arrows-expand" aria-hidden="true"></i> Expand all invoices'
        : '<i class="bi bi-arrows-collapse" aria-hidden="true"></i> Collapse all invoices';
    }

    initRoleSelect(render);
    filterPanel.addEventListener('click', (event) => {
      const summary = event.target.closest('.filterChoice > summary');
      if (summary) {
        const activeChoice = summary.parentElement;
        filterPanel.querySelectorAll('.filterChoice[open]').forEach((choice) => {
          if (choice !== activeChoice) choice.removeAttribute('open');
        });
      }
      const item = event.target.closest('[data-filter-value]');
      if (!item) return;
      const choice = item.closest('[data-filter-choice]');
      const select = document.getElementById(choice.dataset.filterChoice);
      const value = item.dataset.filterValue;
      if (value === 'all') resetFilter(select);
      else {
        const option = [...select.options].find((candidate) => candidate.value === value);
        if (option) option.selected = !option.selected;
        const selectedValues = selectedFilterValues(select);
        [...select.options].forEach((candidate) => {
          if (candidate.value === 'all') candidate.selected = selectedValues.length === 0;
        });
      }
      page = 1;
      render();
    });
    filterPanel.addEventListener('toggle', () => {
      if (!filterPanel.open) filterPanel.querySelectorAll('.filterChoice[open]').forEach((choice) => choice.removeAttribute('open'));
    });
    document.addEventListener('click', (event) => {
      if (filterPanel.contains(event.target)) return;
      filterPanel.removeAttribute('open');
      filterPanel.querySelectorAll('.filterChoice[open]').forEach((choice) => choice.removeAttribute('open'));
    }, true);
    sortButtons.forEach((button) => button.addEventListener('click', () => {
      const nextKey = button.dataset.sort;
      if (sortKey === nextKey) sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';
      else { sortKey = nextKey; sortDirection = 'asc'; }
      page = 1;
      render();
    }));
    document.querySelectorAll('.workTab').forEach((tab) => tab.addEventListener('click', () => { view = tab.dataset.view; page = 1; render(); }));
    search.addEventListener('input', () => { page = 1; render(); });
    agentFilter.addEventListener('change', () => { page = 1; render(); });
    managerFilter.addEventListener('change', () => { page = 1; render(); });
    primaryStatusFilter.addEventListener('change', () => { page = 1; render(); });
    subStatusFilter.addEventListener('change', () => { page = 1; render(); });
    assigneeFilter.addEventListener('change', () => { page = 1; render(); });
    actionOwnerFilter.addEventListener('change', () => { page = 1; render(); });
    invoiceDueFilter.addEventListener('change', () => { page = 1; render(); });
    regionFilter.addEventListener('change', () => { page = 1; render(); });
    document.getElementById('clear-filters').addEventListener('click', () => {
      landingFilters.forEach(resetFilter);
      page = 1;
      render();
    });
    document.getElementById('toggle-all-invoices').addEventListener('click', () => {
      const allCollapsed = groupedInvoiceIds.length > 0 && groupedInvoiceIds.every((invoiceId) => collapsedInvoices.has(invoiceId));
      groupedInvoiceIds.forEach((invoiceId) => {
        if (allCollapsed) collapsedInvoices.delete(invoiceId);
        else collapsedInvoices.add(invoiceId);
      });
      render();
    });
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
    return issue.documentRequirement || issue.subStatus || issue.title || 'Supporting document';
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
      if (!visibilityReleased(sourceIssue) && !canViewIssue(sourceIssue, getRole(), rolePerson(getRole()))) return;
      (sourceIssue.documents || []).forEach((document) => {
        const scope = typeof document === 'object' ? document.scope || sourceIssue.documentScope : sourceIssue.documentScope;
        const taggedInvoice = document?.invoiceNo || document?.sourceInvoice || sourceInvoice.id;
        if (scope === 'customer' || taggedInvoice === invoice.id) addDocument(document, sourceInvoice, sourceIssue);
      });
    });
    (request?.trail || []).forEach((entry) => (entry.files || []).forEach((file) => {
      addDocument(file, invoice, issue, { requirement: 'Approval attachment', uploadedBy: entry.by, uploadedAt: entry.at });
    }));
    return documents;
  }
  function renderDocuments(invoice, issue, request) {
    const docs = issueDocuments(invoice, issue, request);
    if (!docs.length) return `<div class="emptyDocuments"><i class="bi bi-file-earmark" aria-hidden="true"></i><span><strong>No customer documents uploaded</strong><small>Customer-scoped documents can be reused; invoice-scoped documents stay with their tagged invoice.</small></span></div>`;
    return `<div class="documentRows">${docs.map((doc) => `<div class="documentRow${doc.shared ? ' is-shared' : ''}"><i class="bi bi-file-earmark-check" aria-hidden="true"></i><span><strong>${esc(doc.requirement || 'Supporting document')}</strong><small title="${esc(doc.name)}">${esc(doc.name)}</small><em><i class="bi bi-link-45deg" aria-hidden="true"></i>${esc(doc.sourceInvoice || invoice.id)} · ${esc(doc.sourceIssue || issue.id)} · ${esc(doc.uploadedBy || 'User')} · ${esc(shortDateTime(doc.uploadedAt))}</em></span><button type="button" data-preview-document="${esc(doc.name)}" title="Preview ${esc(doc.name)}" aria-label="Preview ${esc(doc.name)}"><i class="bi bi-eye"></i></button></div>`).join('')}</div>`;
  }

  function initDetail() {
    const params = new URLSearchParams(location.search);
    let record = findRecord(params.get('invoice'), params.get('issue'));
    const pendingFiles = [];
    let selectedRequirement = '';
    if (!record || !canViewIssue(record.issue, getRole(), rolePerson(getRole()))) {
      document.getElementById('detail-empty-state').classList.remove('hidden');
      document.querySelector('#detail-empty-state strong').textContent = record ? 'You do not have access to this issue yet' : 'Issue not found';
      initRoleSelect(() => location.reload());
      return;
    }

    function refreshRecord() { record = findRecord(record.invoice.id, record.issue.id) || record; }
    function render() {
      data = loadData(); approvalData = seedApprovals(); refreshRecord();
      const { invoice, issue } = record;
      const role = getRole();
      if (!canViewIssue(issue, role, rolePerson(role))) {
        document.getElementById('issue-detail-layout').classList.add('hidden');
        document.getElementById('detail-empty-state').classList.remove('hidden');
        document.querySelector('#detail-empty-state strong').textContent = 'You do not have access to this issue yet';
        return;
      }
      const request = latestRequest(issue.id);
      const state = actionState(issue, role);
      const backLink = document.querySelector('.backLink');
      if (backLink) backLink.href = `issuetrackerLP.html?${new URLSearchParams({ view: 'my-work', role, user: rolePerson(role) })}`;
      document.getElementById('detail-empty-state').classList.add('hidden');
      document.getElementById('issue-detail-layout').classList.remove('hidden');
      document.getElementById('detail-title').textContent = issue.documentRequirement || issue.subStatus || issue.title || 'Issue detail';
      document.getElementById('detail-identity').textContent = issue.documentScope === 'customer' ? `Customer dependency · ${(issue.affectedInvoices || []).length} invoices impacted · Issue ID: ${issue.id} · ${invoice.customerCode} · ${invoice.customer}` : `Invoice no.: ${invoice.id} · Issue ID: ${issue.id} · ${invoice.customerCode} · ${invoice.customer}`;
      const status = document.getElementById('detail-status');
      const rejected = isRejected(issue);
      status.textContent = isClosed(issue) ? 'Closed' : (rejected ? 'Rejected · correction required' : (approvalStatus(issue) === 'pending' ? 'Approval pending' : issue.status || 'Open'));
      status.className = `statusPill${isClosed(issue) ? ' is-closed' : (rejected ? ' is-rejected' : (approvalStatus(issue) === 'pending' ? ' is-pending' : ''))}`;
      renderCurrentAction(invoice, issue, state, request);
      renderWorkflowStrip(issue, request);
      renderContext(issue, request);
      renderWorkArea(invoice, issue, request, state, pendingFiles, selectedRequirement);
      renderActivity(issue, request);
      renderMatrix(issue, request);
      renderDetails(invoice, issue, request);
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
        const correctiveRemarkRequired = issue.workflowStep === 'agent-correction' && getRole() === 'agent' && samePerson(rolePerson(getRole()), issue.agent);
        if (!text && (correctiveRemarkRequired || !pendingFiles.length)) { showFormError(correctiveRemarkRequired ? 'Please add a corrective remark to send the issue back to the manager.' : 'Please add a remark or attach a document.'); return; }
        shareUpdate(invoice, issue, text, pendingFiles);
        pendingFiles.length = 0; render();
      });
      function bindQuickActionPanel() {
        const quickCancel = document.getElementById('quick-action-cancel');
        if (quickCancel) quickCancel.addEventListener('click', closeQuickActionPanel);
        const quickClose = document.getElementById('quick-action-close');
        if (quickClose) quickClose.addEventListener('click', () => {
          closeQuickActionPanel();
          document.getElementById('work-remark')?.focus();
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
        if (button.getAttribute('aria-disabled') === 'true') {
          toast(button.dataset.unavailable || 'This action is not available to the current user.', 'error');
          return;
        }
        if (button.classList.contains('is-active')) {
          closeQuickActionPanel();
          return;
        }
        openQuickActionPanel(button.dataset.issueAction, issue, request);
        bindQuickActionPanel();
        document.querySelector('.requiredActionPanelHost')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }));
      document.querySelectorAll('[data-focus-contribution]').forEach((button) => button.addEventListener('click', () => {
        document.getElementById('contribution-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        document.getElementById('work-remark')?.focus({ preventScroll: true });
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
  function renderCurrentAction(invoice, issue, state, request) {
    const node = document.getElementById('current-action');
    const workflow = workflowState(issue, request);
    const decision = approvalDecisionContext(issue, request);
    const title = state.key === 'documents' ? (issue.subStatus || issue.title) : state.label;
    const issueReason = issue.subStatus || issue.title || 'this issue';
    const invoiceNumber = invoice?.id || issue.invoiceNo || 'the selected invoice';
    const customerName = invoice?.customer || issue.customerName || 'the customer';
    const raisedBy = issue.agent || 'the assigned agent';
    const approverLevel = String(decision?.label || 'Approver').replace(/\s+approval$/i, '');
    const approvalExplanation = decision?.kind === 'approver'
      ? `You are ${approverLevel.replace(/^Approver/i, 'approver')} for this issue. Your approval is required to provide the resolution for this issue.`
      : `${raisedBy} raised “${issueReason}” for invoice ${invoiceNumber} belonging to ${customerName}. Review the Issue context, Agent's original remark, Existing Documents, and Action trail before choosing Approve or Reject.`;
    const explanation = state.key === 'approval' ? approvalExplanation :
      state.key === 'waiting' ? `Track progress here, or contribute documents and remarks without advancing ${workflow.currentAssignee || 'the assignee'}’s step.` :
      state.key === 'resolution' ? 'Explain the resolution clearly and attach any supporting proof.' :
      state.key === 'resolution-review' ? 'Review the submitted resolution, then accept it, close the issue, or return it to the action owner.' :
      state.key === 'closed' ? 'This issue has completed its action and approval flow.' : 'Attach the requested document and explain what you completed before sending it forward.';
    const waitingWith = state.key === 'waiting' ? `<span class="actionDue"><i class="bi bi-person"></i>With ${esc(assignedUser(issue, request) || 'another user')}</span>` : '';
    let actionControl = '';
    let actionHint = '';
    if (state.key === 'approval' && decision) {
      actionControl = `<button class="currentActionButton" type="button" data-issue-action="approve" aria-describedby="current-action-hint"><i class="bi bi-check2-circle" aria-hidden="true"></i>${esc(decision.label)}</button>`;
      actionHint = 'Opens the Approve and Reject options for this issue.';
    } else if (state.key === 'resolution') {
      actionControl = '<button class="currentActionButton" type="button" data-issue-action="resolution" aria-describedby="current-action-hint"><i class="bi bi-file-earmark-check" aria-hidden="true"></i>Provide resolution</button>';
      actionHint = 'Opens the document upload and resolution remark fields.';
    } else if (state.key === 'resolution-review') {
      actionControl = '<button class="currentActionButton" type="button" data-issue-action="resolution-review" aria-describedby="current-action-hint"><i class="bi bi-clipboard-check" aria-hidden="true"></i>Review resolution</button>';
      actionHint = 'Opens Accept and close, Accept resolution, and Reject resolution options.';
    } else if (state.key === 'documents') {
      actionControl = '<button class="currentActionButton" type="button" data-focus-contribution aria-describedby="current-action-hint"><i class="bi bi-paperclip" aria-hidden="true"></i>Add documents or remark</button>';
      actionHint = 'Moves to the document upload and remark section below.';
    }
    const actionCta = actionControl && actionHint ? `<div class="currentActionCta">${actionControl}<span id="current-action-hint" class="currentActionHint" role="tooltip">${esc(actionHint)}</span></div>` : actionControl;
    node.className = `currentAction${state.key === 'waiting' ? ' is-waiting' : (state.key === 'closed' ? ' is-complete' : '')}`;
    node.innerHTML = `<div class="currentActionHeader"><div><span class="eyebrow">${state.key === 'waiting' ? 'Tracking only' : (state.key === 'closed' ? 'Completed' : 'Your required action')}</span><h2>${esc(title)}</h2><p>${esc(explanation)}</p></div><div class="currentActionControls">${waitingWith}${actionCta}</div></div>`;
  }
  function renderWorkflowStrip(issue, request) {
    const workflow = workflowState(issue, request);
    const latest = mergedActivity(issue, request)[0];
    const previousPerson = latest?.who || issue.agent || 'Agent';
    const previousAction = latest?.what || 'created the issue';
    const next = workflow.next;
    document.getElementById('workflow-strip').innerHTML = `<div class="workflowStripItem"><span>Previous update</span><strong>${esc(previousPerson)}</strong><small>${esc(previousAction)}</small></div><i class="bi bi-chevron-right workflowStripArrow" aria-hidden="true"></i><div class="workflowStripItem is-current"><span>Current assignee</span><strong>${esc(workflow.currentAssignee || 'No active assignment')}</strong><small>${esc(workflow.label)}</small></div><i class="bi bi-chevron-right workflowStripArrow" aria-hidden="true"></i><div class="workflowStripItem"><span>Next step</span><strong>${esc(next.person)}</strong><small>${esc(next.action)}</small></div>`;
  }
  function originalRemark(issue) {
    return (issue.actionTrail || []).find((entry) => entry.remark)?.remark || issue.description || 'No original remark provided.';
  }
  function renderContext(issue, request) {
    const matrix = getMatrix(issue);
    document.getElementById('issue-context').innerHTML = `<h2 class="sectionHeading">Issue context</h2><div class="contextGrid"><div class="contextItem"><span>Primary status</span><strong>${esc(issue.primaryStatus || '—')}</strong></div><div class="contextItem"><span>Sub status</span><strong>${esc(issue.subStatus || issue.title || '—')}</strong></div><div class="contextItem"><span>Action owner</span><strong>${esc(issue.actionOwner || 'Unassigned')}</strong></div><div class="contextItem"><span>Approval matrix</span><strong>${esc(matrix?.name || 'Not selected')}</strong></div></div><div class="originalRemarkCard"><span>Agent's original remark</span><p>${esc(originalRemark(issue))}</p></div>`;
  }
  function canCloseIssue(issue, role = getRole()) {
    if (role === 'agent') return samePerson(issue.agent, rolePerson(role));
    return role === 'manager' && samePerson(issue.manager, rolePerson(role));
  }
  function canChangeProcess(issue, role = getRole()) {
    return !isClosed(issue) && canCloseIssue(issue, role);
  }
  function renderMoreActions(issue, request) {
    const closed = isClosed(issue);
    const role = getRole();
    const canManage = (role === 'agent' && samePerson(issue.agent, rolePerson(role))) || (role === 'manager' && samePerson(issue.manager, rolePerson(role)));
    const canResolve = !closed && visibilityReleased(issue) && role === 'action-owner' && samePerson(issue.actionOwner, rolePerson(role));
    const actions = [
      ['resolution', 'bi-file-earmark-check', 'Provide resolution', !canResolve, 'Provide a formal resolution', 'Available to the action owner at any open stage'],
      ['assign', 'bi-person-plus', 'Reassign owner', closed || !canManage, 'Reassign the action owner', 'Available to agents and managers'],
      ['process', 'bi-diagram-3', 'Change process', !canChangeProcess(issue, role), 'Change the approval process', 'Available to the issue agent and manager'],
      ['close', 'bi-lock', 'Close issue', closed || !canCloseIssue(issue), 'Close the issue', 'Available to the agent or issue manager'],
      ['reopen', 'bi-arrow-counterclockwise', 'Reopen issue', !closed || !canCloseIssue(issue), 'Reopen the issue', 'Available to the agent or issue manager']
    ];
    return `<details class="issueActionsSection"><summary class="issueActionsHeader"><div><h3>Actions</h3><p>Administrative and exception actions</p></div><span class="issueActionsToggle"><i class="bi bi-chevron-down" aria-hidden="true"></i></span></summary><div class="workActionButtons workActionButtons--secondary">${actions.map(([key, icon, label, disabled, title, permission]) => `<button type="button" class="workActionButton${disabled ? ' is-disabled' : ''}" data-issue-action="${key}" data-unavailable="${esc(permission)}" title="${esc(title)}" aria-label="${esc(`${title}. ${permission}`)}" aria-disabled="${String(disabled)}"><i class="bi ${icon}" aria-hidden="true"></i><span>${esc(label)}<small>${esc(permission)}</small></span></button>`).join('')}</div></details>`;
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
    if (action === 'resolution-review' && !canReviewResolution(issue)) return;
    const panel = document.getElementById('quick-action-panel');
    if (!panel) return;
    restoreDefaultWorkInputs();
    document.querySelectorAll('[data-issue-action]').forEach((button) => button.classList.toggle('is-active', button.dataset.issueAction === action));
    const processOptions = approvalData.processes.map((process) => `<option value="${esc(process.id)}"${process.id === (issue.approvalProcessId || getProcess(issue)?.id) ? ' selected' : ''}>${esc(process.process)}</option>`).join('');
    const ownerOptions = usersForRole('action-owner').map((user) => `<option value="${esc(user)}"${user === issue.actionOwner ? ' selected' : ''}>${esc(user)}</option>`).join('');
    const header = (icon, title, description) => `<div class="quickActionHeader"><span class="quickActionHeaderIcon"><i class="bi ${icon}" aria-hidden="true"></i></span><div><h4>${title}</h4><p>${description}</p></div><button id="quick-action-close" class="quickActionClose" type="button" aria-label="Close action and add a remark only"><i class="bi bi-x-lg" aria-hidden="true"></i></button></div>`;
    const footer = (label) => `<div class="quickActionFooter"><button id="quick-action-confirm" data-action="${action}" class="primaryButton" type="button">${label}</button><button id="quick-action-cancel" class="outlineButton" type="button">Cancel</button></div>`;
    const approvalFooter = `<div class="quickActionFooter quickActionFooter--decision"><button type="button" class="primaryButton" data-quick-decision="approve"><i class="bi bi-check2" aria-hidden="true"></i> Approve</button><button type="button" class="dangerButton" data-quick-decision="reject"><i class="bi bi-x-lg" aria-hidden="true"></i> Reject</button><button id="quick-action-cancel" class="outlineButton" type="button">Cancel</button></div>`;
    let content = '';
    if (action === 'approve') {
      const decision = approvalDecisionContext(issue, request);
      if (!decision) return;
      const description = decision.kind === 'manager' ? 'Approve the new issue so processing can begin, or reject it back to the agent.' : 'Approve this level to continue the approval matrix, or reject the issue back to the agent.';
      const statusLabel = decision.kind === 'manager' ? managerApprovalStatus(issue) : (currentApprover(request)?.status || 'pending');
      content = `${header('bi-check2-circle', decision.label, description)}<div class="quickActionBody"><div class="quickActionValue"><span>Assigned approver</span><strong>${esc(decision.actor)}</strong></div><div class="quickActionValue"><span>Current decision</span><strong>${esc(statusLabel)}</strong></div></div>${approvalFooter}`;
    } else if (action === 'resolution-review') {
      content = `${header('bi-clipboard-check', 'Review resolution', 'Your decision applies to the current resolution version.')}<div class="quickActionBody"><div class="quickActionValue"><span>Provided by</span><strong>${esc(issue.resolutionProvidedBy || issue.actionOwner || 'Action owner')}</strong></div><div class="quickActionValue"><span>Version</span><strong>${esc(issue.resolutionVersion || 1)}</strong></div></div><div class="quickActionFooter quickActionFooter--decision"><button type="button" class="primaryButton" data-quick-decision="accept-close"><i class="bi bi-check2-all"></i> Accept and close</button><button type="button" class="outlineButton" data-quick-decision="accept-resolution"><i class="bi bi-check2"></i> Accept resolution</button><button type="button" class="dangerButton" data-quick-decision="reject-resolution"><i class="bi bi-x-lg"></i> Reject resolution</button><button id="quick-action-cancel" class="outlineButton" type="button">Cancel</button></div>`;
    } else if (action === 'assign') {
      content = `${header('bi-person-plus', 'Reassign action owner', 'Select the person responsible for the next action.')}<div class="quickActionBody"><label>Action owner<select id="quick-owner">${ownerOptions}</select></label></div>${footer('Reassign')}`;
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
      const decisionContext = approvalDecisionContext(issue, request);
      if (!decisionContext) { toast('This approval is not assigned to the logged-in user.', 'error'); return false; }
      if (decisionContext.kind === 'approver') {
        decideApproval(invoice, issue, request, action === 'reject' ? 'rejected' : 'approved', remark, pendingFiles);
      } else {
        decideManagerApproval(invoice, issue, action === 'reject' ? 'rejected' : 'approved', remark, pendingFiles);
      }
      return true;
    }
    if (['accept-close', 'accept-resolution', 'reject-resolution'].includes(action)) {
      if (!canReviewResolution(issue)) { toast('Only the issue agent can decide a pending resolution.', 'error'); return false; }
      if (!requireRemark()) return false;
      return decideResolution(invoice, issue, action, remark, pendingFiles);
    }
    if (action === 'assign') {
      if (!requireRemark()) return false;
      const owner = document.getElementById('quick-owner')?.value || issue.actionOwner;
      issue.connectedUsers = [...new Set([...(issue.connectedUsers || []), issue.actionOwner, owner].map(cleanName).filter(Boolean))];
      issue.actionOwner = owner;
      if (['resolution-work', 'resolution-accepted'].includes(issue.workflowStep)) {
        issue.assignedTo = owner;
        issue.assignmentRole = 'action-owner';
        issue.workflowStep = 'resolution-work';
      }
      issue.stage = Math.max(Number(issue.stage || 0), 2);
      attachFiles(invoice, issue, pendingFiles, by);
      issue.actionTrail.push({ who: by, what: `assigned to action owner (${owner})`, type: 'assignment', when: isoNow(), remark, files: actionFiles });
      saveRecord(invoice, issue); toast(`Assigned to ${owner}.`, 'success'); return true;
    }
    if (action === 'process') {
      if (!canChangeProcess(issue)) { toast('Only the issue agent or manager can change the approval process of an open issue.', 'error'); return false; }
      if (!requireRemark()) return false;
      const processId = document.getElementById('quick-process')?.value;
      const process = approvalData.processes.find((item) => item.id === processId);
      if (!process) { toast('Select an approval process.', 'error'); return false; }
      cancelActiveApprovals(invoice, issue, 'Approval route change requested');
      issue.pendingProcessId = process.id;
      issue.managerApprovalStatus = 'Pending'; issue.workflowStep = 'manager-review'; issue.assignedTo = issue.manager; issue.assignmentRole = 'manager';
      attachFiles(invoice, issue, pendingFiles, by);
      issue.actionTrail.push({ who: by, what: `requested approval process change (${process.process})`, type: 'process', when: isoNow(), remark, files: actionFiles });
      saveRecord(invoice, issue); toast('Process change sent to the manager.', 'success'); return true;
    }
    if (action === 'resolution') {
      if (!remark && !pendingFiles.length) { showFormError('Add a resolution remark or attach a document.'); return false; }
      provideResolution(invoice, issue, remark, pendingFiles);
      return true;
    }
    if (action === 'close' && !canCloseIssue(issue)) {
      toast('Only an agent or manager can close this issue.', 'error');
      return false;
    }
    if (!requireRemark()) return false;
    issue.status = action === 'reopen' ? 'Open' : 'Closed';
    if (action === 'reopen') {
      if (getRole() === 'manager' || issue.skipManagerApproval) {
        issue.managerApprovalStatus = 'Approved'; issue.workflowStep = 'resolution-work'; issue.assignedTo = issue.actionOwner; issue.assignmentRole = 'action-owner';
      } else {
        issue.managerApprovalStatus = 'Pending'; issue.workflowStep = 'reopen-manager-review'; issue.assignedTo = issue.manager; issue.assignmentRole = 'manager';
      }
    } else {
      cancelActiveApprovals(invoice, issue, 'Issue closed'); issue.workflowStep = 'closed'; issue.assignedTo = ''; issue.assignmentRole = '';
    }
    attachFiles(invoice, issue, pendingFiles, by);
    issue.actionTrail.push({ who: by, what: action === 'reopen' ? 'reopened the issue' : 'closed the issue', type: action === 'reopen' ? 'reopen' : 'closure', when: isoNow(), remark, files: actionFiles });
    saveRecord(invoice, issue); toast(action === 'reopen' ? 'Issue reopened.' : 'Issue closed.', 'success'); return true;
  }
  function renderWorkArea(invoice, issue, request, state, pendingFiles) {
    const node = document.getElementById('work-area');
    const customerDocuments = issueDocuments(invoice, issue, request);
    const docs = renderDocuments(invoice, issue, request);
    const pendingUpload = `<div id="pending-upload-list" class="uploadFileList${pendingFiles.length ? '' : ' hidden'}"><strong>Ready to attach:</strong> <span>${pendingFiles.map((file) => esc(file.name)).join(', ')}</span></div>`;
    const upload = `<div class="uploadZone"><span class="uploadIcon"><i class="bi bi-cloud-arrow-up"></i></span><div class="uploadCopy"><strong>Attach supporting documents</strong><span>PDF, JPG, PNG, DOCX or XLSX</span><small>${esc(documentRequirement(issue))} ${customerDocuments.some((item) => String(item.requirement || '').toLowerCase() === documentRequirement(issue).toLowerCase()) ? 'is already available for this customer' : 'is requested for this issue'} · ${issue.documentScope === 'customer' ? 'Customer-level uploads are reusable across this customer’s invoices' : 'New uploads are tagged to this invoice only'}</small></div><button class="outlineButton uploadAction" type="button" data-trigger-upload data-requirement="${esc(documentRequirement(issue))}"><i class="bi bi-paperclip" aria-hidden="true"></i> Browse</button></div>${pendingUpload}`;
    const remarkLabel = state.key === 'approval' ? 'Additional context (optional)' : (state.key === 'resolution' ? 'Resolution' : 'Your remark');
    const remarkRequired = state.key === 'approval' ? '' : ' <span aria-hidden="true">*</span>';
    const remarkPlaceholder = state.key === 'approval' ? 'Optionally add supporting context for the next person.' : 'Explain what you checked, attached or decided. This is shown to the next person.';
    const remark = `<label class="workRemarkLabel" for="work-remark">${remarkLabel}${remarkRequired}</label><textarea id="work-remark" class="workRemark" maxlength="1000" placeholder="${remarkPlaceholder}"></textarea><span id="remark-counter" class="remarkCounter">0 / 1000</span><div id="work-form-error" class="formError"></div>`;
    const documentSection = `<details class="workSection documentSection"><summary class="workSectionHeader"><div><h3>Existing Documents</h3><p>Documents available for this customer across all invoices</p></div><span class="documentSummaryMeta"><span class="documentCount">${customerDocuments.length}</span><i class="bi bi-chevron-down" aria-hidden="true"></i></span></summary><div class="documentSectionBody">${docs}</div></details>`;
    const workNote = state.key === 'approval' ? `Sharing an update does not approve or reject the issue. Use the ${esc(state.label)} action above for the decision.` :
      state.key === 'waiting' ? 'Shares the remark and any attached documents without changing the current assignment.' :
      state.key === 'closed' ? 'Sharing an update does not reopen the issue.' :
      'Shares the remark and any attached documents together.';
    const defaultWorkInputs = `<div id="default-work-inputs" class="defaultWorkInputs">${upload}<div class="resolutionFields">${remark}</div><div class="workActions"><button id="submit-primary-action" class="primaryButton" type="button"><i class="bi bi-send" aria-hidden="true"></i> Share update</button><span class="workNote"><i class="bi bi-info-circle"></i> ${workNote}</span></div></div>`;
    const contributionCopy = state.key === 'waiting' ? `Currently assigned to ${assignedUser(issue, request) || 'another user'}. Your update will not advance their step.` :
      state.key === 'closed' ? 'Add supporting context without reopening the issue.' :
      'Add documents or a remark without changing the current workflow step.';
    const contributionSection = state.key === 'closed'
      ? '<section id="contribution-section" class="workSection resolutionSection contributionSection"><div class="workSectionHeader"><div><h3>Issue closed</h3><p>Reopen the issue before adding another remark or document.</p></div></div><div id="default-work-input-slot" aria-hidden="true"></div></section>'
      : `<section id="contribution-section" class="workSection resolutionSection contributionSection"><div class="workSectionHeader"><div><h3>Add remark</h3><p>${esc(contributionCopy)}</p></div><span class="contributionBadge"><i class="bi bi-shield-check" aria-hidden="true"></i>No workflow change</span></div><div id="default-work-input-slot" aria-hidden="true"></div>${defaultWorkInputs}</section>`;
    node.innerHTML = `${documentSection}${renderMoreActions(issue, request)}<section class="requiredActionPanelHost" aria-label="Selected required action"><div id="quick-action-panel" class="quickActionPanel hidden" aria-live="polite"></div></section>${contributionSection}`;
  }

  function attachFiles(invoice, issue, files, by) {
    issue.documents = Array.isArray(issue.documents) ? issue.documents : [];
    files.forEach((file) => issue.documents.push({ name: file.name, requirement: file.requirement, uploadedBy: by, uploadedAt: isoNow(), sourceInvoice: invoice.id, sourceIssue: issue.id, customerCode: invoice.customerCode, customerName: invoice.customer, scope: issue.documentScope || 'invoice', requirementId: issue.documentRequirementId || '', invoiceNo: invoice.id }));
  }
  function addIssueNotification(issue, invoice, type, recipients, title, message) {
    const people = [...new Set((recipients || []).map(cleanName).filter(Boolean))];
    if (!people.length) return;
    const list = read(KEYS.notifications, []);
    const createdAt = isoNow();
    const latestTrailAt = (issue.actionTrail || []).at(-1)?.when || createdAt;
    const notification = {
      id: `issue-${type}:${issue.id}:${latestTrailAt}:${people.join('-')}`,
      type: `issue-${type}`,
      title,
      message,
      createdAt,
      read: false,
      audience: ['all'],
      audienceUsers: people,
      details: [
        { label: 'Issue', value: issue.id },
        { label: 'Substatus', value: issue.subStatus },
        { label: 'Invoice', value: invoice.id },
        { label: 'Assigned to', value: issue.assignedTo || '—' }
      ],
      ctas: [{ label: 'Open issue', action: 'open-url', url: `pages/issuetrackerdetail.html?invoice=${encodeURIComponent(invoice.id)}&issue=${encodeURIComponent(issue.id)}` }]
    };
    const index = list.findIndex((item) => item.id === notification.id);
    if (index >= 0) list[index] = { ...list[index], ...notification }; else list.unshift(notification);
    write(KEYS.notifications, list);
  }
  function supersedePendingRequests(issue, reason) {
    const list = requests();
    const now = isoNow();
    let changed = false;
    list.forEach((item) => {
      if (item?.issue?.id === issue.id && item.status === 'pending') {
        item.status = 'superseded'; item.updatedAt = now;
        item.trail = Array.isArray(item.trail) ? item.trail : [];
        item.trail.push({ action: 'superseded', by: rolePerson(getRole()), at: now, remark: reason || 'Workflow changed' });
        changed = true;
      }
    });
    if (changed) write(KEYS.requests, list);
    return changed;
  }
  function cancelActiveApprovals(invoice, issue, reason) {
    const activeRequest = latestRequest(issue.id);
    const recipients = [];
    if (managerApprovalStatus(issue) === 'pending' && ['manager-review', 'reopen-manager-review'].includes(issue.workflowStep)) {
      recipients.push(issue.manager);
      issue.managerApprovalStatus = 'Superseded';
    }
    if (activeRequest?.status === 'pending') {
      recipients.push(currentApprover(activeRequest)?.ownerName);
      issue.approvalStatus = 'superseded';
      issue.matrixApprovalStatus = 'superseded';
    }
    const requestChanged = supersedePendingRequests(issue, reason);
    const people = [...new Set(recipients.map(cleanName).filter(Boolean))];
    if ((requestChanged || people.length) && people.length) {
      addIssueNotification(issue, invoice, 'approval-cancelled', people, 'Approval cancelled', `${reason || 'The approval step was cancelled'} for ${issue.subStatus}.`);
    }
    return requestChanged || people.length > 0;
  }
  function shareUpdate(invoice, issue, remark, files) {
    if (isClosed(issue)) { toast('Closed issues cannot receive new remarks.', 'error'); return; }
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
    if (issue.workflowStep === 'agent-correction' && getRole() === 'agent' && samePerson(by, issue.agent)) {
      issue.rejectionKind = ''; issue.rejectedBy = ''; issue.rejectedAt = '';
      issue.managerApprovalStatus = issue.skipManagerApproval ? 'Approved' : 'Pending';
      if (issue.skipManagerApproval) {
        if (!startMatrixApproval(invoice, issue, remark, [], by)) {
          issue.workflowStep = 'resolution-work'; issue.assignedTo = issue.actionOwner; issue.assignmentRole = 'action-owner';
          saveRecord(invoice, issue);
        }
      } else {
        issue.workflowStep = 'manager-review'; issue.assignedTo = issue.manager; issue.assignmentRole = 'manager';
        saveRecord(invoice, issue);
        addIssueNotification(issue, invoice, 'manager-approval-request', [issue.manager], 'Manager approval required', `${issue.agent} added the corrective remark for ${issue.subStatus}.`);
      }
      toast('Corrective remark added and sent to the manager.', 'success');
      return;
    }
    saveRecord(invoice, issue);
    toast(files.length ? 'Update and documents shared.' : 'Update shared.', 'success');
  }
  function startMatrixApproval(invoice, issue, remark, files, by, managerDecisionText = '') {
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
    issue.approvalStatus = 'pending'; issue.matrixApprovalStatus = 'pending'; issue.stage = 2; issue.workflowStep = 'approver-l1'; issue.assignedTo = matrix.levels[0].ownerName; issue.assignmentRole = 'approver';
    const handoffText = `sent the issue to Approver 1 (${matrix.levels[0].ownerName})`;
    issue.actionTrail.push({ who: by, what: managerDecisionText ? `${managerDecisionText} and ${handoffText}` : handoffText, type: 'approval', when: now, remark, files: files.map((file) => ({ name: file.name, requirement: file.requirement })) });
    saveRecord(invoice, issue);
    addIssueNotification(issue, invoice, 'approver-request', [issue.assignedTo], 'Approver action required', `${issue.subStatus} is waiting for your approval.`);
    toast(`Issue accepted and assigned to Approver L1: ${matrix.levels[0].ownerName}.`, 'success');
    return true;
  }
  function decideManagerApproval(invoice, issue, decision, remark, files) {
    const by = issue.manager || rolePerson(getRole());
    const now = isoNow();
    const managerReviewStep = issue.workflowStep;
    const wasVisible = visibilityReleased(issue);
    const processChangeRequested = Boolean(issue.pendingProcessId);
    issue.managerApprovalStatus = decision === 'rejected' ? 'Rejected' : 'Approved';
    issue.managerApprovalBy = by;
    issue.managerApprovalAt = now;
    if (decision === 'rejected') {
      const rejectedProcessChange = Boolean(issue.pendingProcessId);
      issue.pendingProcessId = '';
      attachFiles(invoice, issue, files, by);
      const list = requests();
      list.forEach((item) => {
        if (item?.issue?.id === issue.id && item.status === 'pending') { item.status = 'superseded'; item.updatedAt = now; }
      });
      write(KEYS.requests, list);
      issue.approvalStatus = 'not-submitted'; issue.matrixApprovalStatus = 'not-submitted'; issue.stage = 1; issue.workflowStep = 'agent-correction'; issue.assignedTo = issue.agent || 'Rahul Jain'; issue.assignmentRole = 'agent';
      issue.rejectionKind = 'manager'; issue.rejectedBy = by; issue.rejectedAt = now;
      const rejectedAction = managerReviewStep === 'reopen-manager-review' ? 'rejected reopening the issue' : (rejectedProcessChange ? 'rejected the approval process change' : (wasVisible ? 'rejected the corrected issue' : 'rejected the new issue'));
      issue.actionTrail.push({ who: by, what: `${rejectedAction} and assigned it back to ${issue.assignedTo}`, type: 'approval', when: now, remark, files: files.map((file) => ({ name: file.name, requirement: file.requirement })) });
      saveRecord(invoice, issue); addIssueNotification(issue, invoice, 'correction-required', [issue.agent], 'Correction required', `${by} rejected ${issue.subStatus}. Add a corrective remark to send it back.`); toast(`Issue rejected and assigned to ${issue.assignedTo}.`, 'error'); return;
    }
    if (issue.pendingProcessId) {
      const process = approvalData.processes.find((item) => item.id === issue.pendingProcessId);
      if (process) { issue.approvalProcessId = process.id; issue.approvalProcessName = process.process; issue.approvalMatrixId = process.matrixId || ''; }
      issue.pendingProcessId = '';
    }
    if (!issue.initialVisibilityReleased) { issue.initialVisibilityReleased = true; issue.visibilityReleasedAt = now; }
    issue.rejectionKind = ''; issue.rejectedBy = ''; issue.rejectedAt = '';
    const approvalDescription = managerReviewStep === 'reopen-manager-review'
      ? `approved reopening the issue and assigned it to ${issue.actionOwner || issue.agent}`
      : (processChangeRequested ? 'approved the changed approval process' : (wasVisible ? 'accepted the corrected issue for continued processing' : 'accepted the new issue for processing'));
    if (managerReviewStep === 'reopen-manager-review') {
      attachFiles(invoice, issue, files, by);
      issue.approvalStatus = 'not-submitted'; issue.matrixApprovalStatus = 'not-submitted'; issue.stage = 3; issue.workflowStep = 'resolution-work'; issue.assignedTo = issue.actionOwner || issue.agent || 'Rahul Jain'; issue.assignmentRole = issue.actionOwner ? 'action-owner' : 'agent';
      issue.actionTrail.push({ who: by, what: approvalDescription, type: 'approval', when: now, remark, files: files.map((file) => ({ name: file.name, requirement: file.requirement })) });
      saveRecord(invoice, issue); addIssueNotification(issue, invoice, 'assigned', [issue.assignedTo], 'Issue assignment', `${issue.subStatus} was reopened and is ready for resolution.`); toast(`Issue reopened and assigned to ${issue.assignedTo}.`, 'success'); return;
    }
    if (startMatrixApproval(invoice, issue, remark, files, by, approvalDescription)) return;
    attachFiles(invoice, issue, files, by);
    issue.approvalStatus = 'not-submitted'; issue.matrixApprovalStatus = 'not-submitted'; issue.stage = 3; issue.workflowStep = 'resolution-work'; issue.assignedTo = issue.actionOwner || issue.agent || 'Rahul Jain'; issue.assignmentRole = issue.actionOwner ? 'action-owner' : 'agent';
    issue.actionTrail.push({ who: by, what: `${approvalDescription} and assigned it to ${issue.assignedTo}`, type: 'approval', when: now, remark, files: files.map((file) => ({ name: file.name, requirement: file.requirement })) });
    saveRecord(invoice, issue); addIssueNotification(issue, invoice, 'assigned', [issue.assignedTo], 'Issue assignment', `${issue.subStatus} is ready for your resolution.`); toast(`Issue accepted and assigned to ${issue.assignedTo}.`, 'success');
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
      target.status = 'rejected'; issue.approvalStatus = 'rejected'; issue.matrixApprovalStatus = 'rejected'; issue.stage = 1; issue.workflowStep = 'agent-correction'; issue.assignedTo = issue.agent || 'Rahul Jain'; issue.assignmentRole = 'agent';
      issue.rejectionKind = `approver-l${currentLevel}`; issue.rejectedBy = by; issue.rejectedAt = now;
      issue.actionTrail.push({ who: by, what: `rejected approval level ${currentLevel} and assigned the issue back to ${issue.assignedTo}`, type: 'approval', when: now, remark, files });
      addIssueNotification(issue, invoice, 'correction-required', [issue.agent], 'Correction required', `${by} rejected ${issue.subStatus}. Add a corrective remark to restart approval.`); toast(`Issue rejected and assigned to ${issue.assignedTo}.`, 'error');
    } else if (currentLevel < target.levels.length) {
      target.currentLevel = currentLevel + 1; target.levels[currentLevel].status = 'pending'; issue.approvalStatus = 'pending'; issue.matrixApprovalStatus = 'pending'; issue.stage = 2; issue.workflowStep = `approver-l${target.currentLevel}`;
      const next = currentApprover(target);
      issue.assignedTo = next?.ownerName || 'Approver'; issue.assignmentRole = 'approver';
      issue.actionTrail.push({ who: by, what: `accepted approval level ${currentLevel} and sent to ${next?.ownerName}`, type: 'approval', when: now, remark, files });
      addIssueNotification(issue, invoice, 'approver-request', [issue.assignedTo], 'Approver action required', `${issue.subStatus} is waiting for Approver ${target.currentLevel}.`); toast(`Accepted. Assigned to Approver ${target.currentLevel}: ${next?.ownerName}.`, 'success');
    } else {
      target.status = 'approved'; issue.approvalStatus = 'approved'; issue.matrixApprovalStatus = 'approved'; issue.status = 'Open'; issue.stage = 3; issue.workflowStep = 'resolution-work'; issue.assignedTo = issue.actionOwner || issue.agent || 'Rahul Jain'; issue.assignmentRole = issue.actionOwner ? 'action-owner' : 'agent';
      issue.actionTrail.push({ who: by, what: `completed the final approval and assigned the issue to ${issue.assignedTo} for resolution`, type: 'approval', when: now, remark, files });
      addIssueNotification(issue, invoice, 'assigned', [issue.assignedTo], 'Issue assignment', `${issue.subStatus} is approved and ready for resolution.`); toast(`Final approval completed. Assigned to ${issue.assignedTo} for resolution.`, 'success');
    }
    target.updatedAt = now; write(KEYS.requests, list); saveRecord(invoice, issue);
  }
  function provideResolution(invoice, issue, remark, files) {
    const by = rolePerson(getRole());
    cancelActiveApprovals(invoice, issue, 'Resolution provided before approval completed');
    attachFiles(invoice, issue, files, by); issue.stage = 4; issue.workflowStep = 'resolution-review'; issue.resolutionStatus = 'pending-review'; issue.resolutionVersion = Number(issue.resolutionVersion || 0) + 1; issue.resolutionProvidedBy = by; issue.resolutionProvidedAt = isoNow(); issue.assignedTo = issue.agent || 'Rahul Jain'; issue.assignmentRole = 'agent';
    issue.rejectionKind = ''; issue.rejectedBy = ''; issue.rejectedAt = '';
    issue.actionTrail.push({ who: by, what: `provided a resolution and assigned the issue to ${issue.assignedTo} for review`, type: 'resolution', when: isoNow(), remark, files });
    saveRecord(invoice, issue); addIssueNotification(issue, invoice, 'resolution-review-required', [issue.agent], 'Resolution review required', `${by} provided a resolution for ${issue.subStatus}.`); toast(`Resolution saved and assigned to ${issue.assignedTo} for review.`, 'success');
  }
  function decideResolution(invoice, issue, decision, remark, files) {
    if (!canReviewResolution(issue)) {
      toast('Only the issue agent can decide a pending resolution.', 'error'); return false;
    }
    const by = rolePerson(getRole());
    const now = isoNow();
    attachFiles(invoice, issue, files, by);
    issue.resolutionDecisionVersion = issue.resolutionVersion;
    if (decision === 'reject-resolution') {
      issue.resolutionStatus = 'rejected'; issue.workflowStep = 'resolution-work'; issue.assignedTo = issue.actionOwner; issue.assignmentRole = 'action-owner';
      issue.rejectionKind = 'resolution'; issue.rejectedBy = by; issue.rejectedAt = now;
      issue.actionTrail.push({ who: by, what: `rejected resolution version ${issue.resolutionVersion} and returned it to ${issue.actionOwner}`, type: 'resolution', when: now, remark, files });
      saveRecord(invoice, issue); addIssueNotification(issue, invoice, 'resolution-rejected', [issue.actionOwner], 'Resolution rejected', `${by} returned ${issue.subStatus} for a revised resolution.`); toast('Resolution rejected and returned to the action owner.', 'error'); return true;
    }
    issue.rejectionKind = ''; issue.rejectedBy = ''; issue.rejectedAt = '';
    issue.resolutionStatus = 'accepted';
    issue.actionTrail.push({ who: by, what: decision === 'accept-close' ? `accepted resolution version ${issue.resolutionVersion} and closed the issue` : `accepted resolution version ${issue.resolutionVersion}`, type: 'resolution', when: now, remark, files });
    if (decision === 'accept-close') {
      issue.status = 'Closed'; issue.workflowStep = 'closed'; issue.assignedTo = ''; issue.assignmentRole = '';
    } else {
      issue.workflowStep = 'resolution-accepted'; issue.assignedTo = issue.agent; issue.assignmentRole = 'agent';
    }
    saveRecord(invoice, issue); addIssueNotification(issue, invoice, 'resolution-accepted', [issue.actionOwner], 'Resolution accepted', `${by} accepted the resolution for ${issue.subStatus}.`); toast(decision === 'accept-close' ? 'Resolution accepted and issue closed.' : 'Resolution accepted. The issue remains open.', 'success');
    return true;
  }

  function sameApprovalMoment(left, right) {
    if (String(left?.type || '').toLowerCase() !== 'approval') return false;
    if (!samePerson(left?.who, right?.by || right?.who)) return false;
    if (String(left?.remark || '').trim() !== String(right?.remark || '').trim()) return false;
    const leftValue = left?.when;
    const rightValue = right?.at || right?.when;
    if (!leftValue || !rightValue) return false;
    const leftTime = new Date(leftValue).getTime();
    const rightTime = new Date(rightValue).getTime();
    return Number.isFinite(leftTime) && Number.isFinite(rightTime)
      ? Math.abs(leftTime - rightTime) <= 2000
      : String(left?.when || '') === String(right?.at || right?.when || '');
  }
  function collapseLegacyApprovalDuplicates(source) {
    const entries = [];
    const transitionPattern = /\b(sent|assigned|returned|completed|closed|reopened)\b/i;
    (source || []).forEach((entry) => {
      const duplicateIndex = entries.findIndex((existing) => sameApprovalMoment(existing, entry));
      if (duplicateIndex < 0) {
        entries.push(entry);
        return;
      }
      if (transitionPattern.test(String(entry?.what || '')) && !transitionPattern.test(String(entries[duplicateIndex]?.what || ''))) {
        entries[duplicateIndex] = entry;
      }
    });
    return entries;
  }
  function mergedActivity(issue, request) {
    const entries = collapseLegacyApprovalDuplicates(issue.actionTrail || []);
    (request?.trail || []).forEach((entry) => {
      if (entries.some((item) => sameApprovalMoment(item, entry))) return;
      const signature = `${entry.at}|${entry.action}|${entry.by}`;
      if (!entries.some((item) => `${item.when}|${String(item.what).includes(entry.action) ? entry.action : ''}|${item.who}` === signature)) entries.push({ who: entry.by, what: entry.action === 'submitted' ? 'submitted the issue for approval' : `${entry.action} approval level ${entry.level || request.currentLevel || ''}`.trim(), when: entry.at, remark: entry.remark, files: entry.files, type: 'approval' });
    });
    return entries.sort((a, b) => new Date(b.when || 0) - new Date(a.when || 0));
  }
  function renderActivity(issue, request) {
    const entries = mergedActivity(issue, request);
    document.getElementById('activity-count').textContent = entries.length;
    const supportedTypes = ['approval', 'remark', 'assignment', 'resolution', 'closure', 'reopen'];
    const latest = entries[0];
    const latestTypeRaw = String(latest?.type || 'remark').toLowerCase();
    const latestType = latestTypeRaw === 'assigned' ? 'assignment' : (supportedTypes.includes(latestTypeRaw) ? latestTypeRaw : 'remark');
    const latestFiles = Array.isArray(latest?.files) ? latest.files : [];
    const summaryText = latest ? `${latest.who || 'System'} · ${latest.what || 'updated the issue'}` : 'No activity recorded yet.';
    const summaryDetail = latest?.remark ? `${latestType.toUpperCase()} · ${String(latest.remark).slice(0, 110)}${String(latest.remark).length > 110 ? '…' : ''}` :
      (latestFiles.length ? `${latestType.toUpperCase()} · ${latestFiles.length} attachment${latestFiles.length === 1 ? '' : 's'}` : (latest ? `${latestType.toUpperCase()} · No additional remark` : 'Updates will appear after the first action.'));
    document.getElementById('activity-summary-latest').textContent = summaryText;
    document.getElementById('activity-summary-detail').textContent = summaryDetail;
    document.getElementById('activity-summary-time').textContent = latest ? shortDateTime(latest.when) : '';
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
    const normalizedLevels = levels.map((level, index) => ({ ...level, number: Number(level.level || index + 1) }));
    const hierarchyLevels = [...normalizedLevels].sort((left, right) => right.number - left.number);
    const workflow = workflowState(issue, request);
    const managerState = managerApprovalStatus(issue);
    const managerDisplay = workflow.step === 'resolution-review' && managerState === 'pending' ? 'superseded' : (managerState === 'pending' ? 'current' : managerState);
    const currentLevel = Number(request?.currentLevel || 0);
    const levelState = (level) => {
      if (request?.status === 'superseded') return String(level.status || '').toLowerCase() === 'approved' ? 'approved' : 'locked';
      if (managerState === 'pending') return level.number === 1 ? 'next' : 'locked';
      if (managerState === 'rejected') return 'locked';
      if (request?.status === 'approved') return 'approved';
      if (request?.status === 'rejected') return String(level.status || '').toLowerCase() === 'approved' ? 'approved' : 'locked';
      if (request?.status === 'pending') {
        const explicit = String(level.status || '').toLowerCase();
        if (explicit === 'approved') return 'approved';
        if (level.number === currentLevel) return 'current';
        if (level.number === currentLevel + 1) return 'next';
        return 'locked';
      }
      if (managerState === 'approved') return level.number === 1 ? 'current' : (level.number === 2 ? 'next' : 'locked');
      return 'locked';
    };
    const renderLevel = (level) => {
      const state = levelState(level);
      const stateClass = state.replace(/\s+/g, '-');
      const stateLabel = state === 'current' ? 'CURRENT' : state.toUpperCase();
      const summary = `<div class="matrixLevelMeta"><span class="levelTag">Approver ${level.number}</span><span class="matrixState is-${esc(stateClass)}">${esc(stateLabel)}</span></div><div class="matrixPerson"><span class="matrixAvatar"><i class="bi bi-person" aria-hidden="true"></i></span><div><strong>${esc(level.ownerName || 'Unassigned')}</strong></div></div>`;
      return `<div class="matrixLevel is-${esc(stateClass)}">${summary}</div>`;
    };
    document.getElementById('approval-matrix-panel').innerHTML = `<div class="assignedToBanner"><span>Current assignee</span><strong><i class="bi bi-person-check" aria-hidden="true"></i>${esc(workflow.currentAssignee || 'No active assignment')}</strong><small>${esc(workflow.label)}</small></div><h2>Approval route</h2><div class="managerReviewStep is-${esc(managerDisplay)}"><div><span class="levelTag">Manager review</span><strong>${esc(issue.manager || 'Unassigned manager')}</strong></div><span class="matrixState is-${esc(managerDisplay)}">${esc(managerDisplay === 'current' ? 'CURRENT' : managerDisplay.toUpperCase())}</span></div><p>${esc(request?.matrixName || matrix?.name || 'No approval matrix selected')} <span class="matrixOrderNote">Highest approver first</span></p><div class="matrixList" aria-label="Approval hierarchy, highest approver first">${hierarchyLevels.map(renderLevel).join('') || '<p>No approvers are configured.</p>'}</div>`;
  }
  function renderDetails(invoice, issue, request) {
    const workflow = workflowState(issue, request);
    const fields = [
      ['Customer code', invoice.customerCode], ['Customer name', invoice.customer], ['Invoice no.', invoice.id], ['Invoice date', prettyDate(invoice.date)], ['Invoice value', money(invoice.total)],
      ['Issue no.', issue.id], ['Primary status', issue.primaryStatus], ['Substatus', issue.subStatus], ['Agent', issue.agent], ['Manager', issue.manager], ['FPR / SPR', `${issue.fpr || '—'} / ${issue.spr || '—'}`],
      ['Action owner', issue.actionOwner], ['Current step', workflow.label], ['Current assignee', workflow.currentAssignee || '—'], ['Manager approval', managerApprovalStatus(issue)], ['Matrix approval', latestRequest(issue.id)?.status || 'not submitted'], ['Invoice due amount', money(issue.invoiceDueAmount)], ['Invoice due date', prettyDate(issue.invoiceDueDate)], ['Region', issue.region || '—']
    ];
    const sharedImpact = issue.documentScope === 'customer' ? `<section class="sharedIssueImpact"><h2>${(issue.affectedInvoices || []).length} invoices impacted</h2><p>One customer-level document issue · ${(issue.activeAffectedInvoiceNos || []).length} currently blocked. Historical links remain after submission.</p><details><summary>View all linked invoices</summary><div class="sharedIssueInvoiceList">${(issue.affectedInvoices || []).map(item => `<a href="submission.html?invoice=${encodeURIComponent(item.invoiceNo)}"><strong>${esc(item.invoiceNo)}</strong><span>${esc(money(item.value))}</span></a>`).join('')}</div></details></section>` : '';
    document.getElementById('complete-details-panel').innerHTML = `${sharedImpact}<h2>Complete details</h2><p>Reference information for this issue.</p><dl class="detailList">${fields.map(([label, value]) => `<div><dt>${esc(label)}</dt><dd>${esc(value || '—')}</dd></div>`).join('')}</dl>`;
  }
  const landing = document.getElementById('issue-tracker-landing');
  const detail = document.getElementById('issue-detail-page');
  if (landing) initLanding();
  if (detail) initDetail();
})();
