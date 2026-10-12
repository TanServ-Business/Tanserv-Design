(function () {
  'use strict';

  const VERSION = '20260805-approved-flow-v1';
  const KEYS = {
    version: 'issueTrackerWorkflowVersion',
    base: 'issueTrackerBaseData',
    custom: 'customIssues',
    requests: 'approval_requests',
    total: 'issueTrackerTotalIssues',
    cleared: 'issueTrackerDataCleared',
    notifications: 'ineburaNotificationCenter',
    activity: 'ineburaActivityTrailByInvoice',
    settings: 'issueTrackerSettings',
    processes: 'approval_processes',
    matrices: 'approval_matrices'
  };

  const users = [
    { id: 'agent-aditi', name: 'Aditi Sharma', role: 'agent' },
    { id: 'agent-manish', name: 'Manish Kumar', role: 'agent' },
    { id: 'agent-palak', name: 'Palak Choudhary', role: 'agent' },
    { id: 'agent-abhishek', name: 'Abhishek Sharma', role: 'agent' },
    { id: 'agent-sakshi', name: 'Sakshi Sharma', role: 'agent' },
    { id: 'agent-rahul', name: 'Rahul Jain', role: 'agent' },
    { id: 'agent-karan', name: 'Karan Singh', role: 'agent' },
    { id: 'agent-sahil', name: 'Sahil Joshi', role: 'agent' },
    { id: 'manager-mukesh', name: 'Mukesh Mishra', role: 'manager' },
    { id: 'manager-meera', name: 'Meera Iyer', role: 'manager' },
    { id: 'manager-rohit', name: 'Rohit Malhotra', role: 'manager' },
    { id: 'manager-rohit-mehra', name: 'Rohit Mehra', role: 'manager' },
    { id: 'manager-isha', name: 'Isha Verma', role: 'manager' },
    { id: 'manager-meera-nair', name: 'Meera Nair', role: 'manager' },
    { id: 'approver-anoop', name: 'Anoop Sharma', role: 'approver' },
    { id: 'approver-priya', name: 'Priya Verma', role: 'approver' },
    { id: 'approver-sanjay', name: 'Sanjay Rao', role: 'approver' },
    { id: 'approver-kavita', name: 'Kavita Nair', role: 'approver' },
    { id: 'approver-vikram', name: 'Vikram Singh', role: 'approver' },
    { id: 'approver-pooja', name: 'Pooja Mehta', role: 'approver' },
    { id: 'owner-neha', name: 'Neha Gupta', role: 'action-owner' },
    { id: 'owner-arjun', name: 'Arjun Patel', role: 'action-owner' },
    { id: 'owner-karan', name: 'Karan Shah', role: 'action-owner' }
  ];

  const roleLabels = {
    agent: 'Agent',
    manager: 'Manager',
    approver: 'Approver',
    'action-owner': 'Action Owner'
  };

  const read = (key, fallback) => {
    try {
      const value = JSON.parse(localStorage.getItem(key) || 'null');
      return value == null ? fallback : value;
    } catch (_) { return fallback; }
  };
  const write = (key, value) => {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  };

  function ensureCleanSlate() {
    if (localStorage.getItem(KEYS.version) === VERSION) return false;
    const base = read(KEYS.base, []);
    if (Array.isArray(base)) {
      write(KEYS.base, base.map((invoice) => ({ ...invoice, issues: [] })));
    }
    write(KEYS.custom, []);
    write(KEYS.total, 0);
    localStorage.setItem(KEYS.cleared, '1');
    localStorage.setItem(KEYS.version, VERSION);
    return true;
  }

  // New submission issues must never be erased by the old demo clean-slate migration.
  function ensureWorkflowVersion() {
    localStorage.setItem(KEYS.version, VERSION);
  }

  const usersForRole = (role) => users.filter((user) => user.role === role);
  const defaultUser = (role) => usersForRole(role)[0]?.name || '';
  const roleOf = (name) => users.find((user) => user.name.toLowerCase() === String(name || '').trim().toLowerCase())?.role || '';
  const settings = () => read(KEYS.settings, { skipManagerApproval: false });

  function ensureApprovalData() {
    const seededMatrices = [
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
    const seededProcesses = [
      { id: 'PROC_INV_DELAY', process: 'Invoice Delay Resolution', invoiceSubStatus: 'Pending Verification', primaryStatus: 'In Progress', broadStatus: 'Amber', slaHours: 48, matrixId: 'MATRIX_INV_DELAY_DEFAULT', activeIssues: 0 },
      { id: 'PROC_PO_APPROVAL', process: 'PO Approval Follow-up', invoiceSubStatus: 'Verified', primaryStatus: 'Open', broadStatus: 'Green', slaHours: 72, matrixId: 'MATRIX_PO_APPROVAL_DEFAULT', activeIssues: 0 },
      { id: 'PROC_DELIVERY_CHALLAN', process: 'Delivery Challan Collection', invoiceSubStatus: 'Invoice Received', primaryStatus: 'Waiting on Vendor', broadStatus: 'Red', slaHours: 24, matrixId: 'MATRIX_DELIVERY_CHALLAN_DEFAULT', activeIssues: 0 }
    ];
    let matrices = read(KEYS.matrices, []);
    let processes = read(KEYS.processes, []);
    if (!Array.isArray(matrices) || !matrices.length) matrices = seededMatrices;
    if (!Array.isArray(processes) || !processes.length) processes = seededProcesses;

    const approvers = usersForRole('approver');
    matrices = matrices.map((matrix, matrixIndex) => ({
      ...matrix,
      levels: (Array.isArray(matrix.levels) ? matrix.levels : []).map((level, levelIndex) => {
        if (roleOf(level.ownerName) === 'approver') return { ...level, level: levelIndex + 1 };
        const replacement = approvers[(matrixIndex * 3 + levelIndex) % Math.max(approvers.length, 1)];
        return replacement
          ? { ...level, level: levelIndex + 1, ownerName: replacement.name, ownerEmail: `${replacement.name.toLowerCase().replace(/\s+/g, '.')}@example.com` }
          : { ...level, level: levelIndex + 1 };
      })
    }));
    write(KEYS.matrices, matrices);
    write(KEYS.processes, processes);
    return { processes, matrices };
  }

  window.IssueTrackerConfig = {
    VERSION,
    KEYS,
    users,
    roleLabels,
    usersForRole,
    defaultUser,
    roleOf,
    settings,
    ensureCleanSlate,
    ensureWorkflowVersion,
    ensureApprovalData
  };
})();
