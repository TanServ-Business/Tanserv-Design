(() => {
  const REQ_KEY = 'approval_requests';
  const openIssuesCard = document.getElementById('open-issues-card');
  const openApprovalsCard = document.getElementById('open-approvals-card');
  const approvalOpenCount = document.getElementById('approval-open-count');
  const approvalApprovedCount = document.getElementById('approval-approved-count');
  const approvalRejectedCount = document.getElementById('approval-rejected-count');
  const approvalTotalCount = document.getElementById('approval-total-count');
  const approvalPie = document.getElementById('approval-status-pie');
  const approvalLegendPending = document.getElementById('approval-legend-pending');
  const approvalLegendApproved = document.getElementById('approval-legend-approved');
  const approvalLegendRejected = document.getElementById('approval-legend-rejected');

  function goToIssues() {
    window.location.href = 'index.html';
  }

  function goToApprovals() {
    window.location.href = '../../pages/issuetrackerLP.html?view=my-work&role=approver';
  }

  function loadRequests() {
    try {
      const raw = localStorage.getItem(REQ_KEY);
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function updateApprovalStats() {
    const requests = loadRequests();
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let approvedThisMonth = 0;
    let rejectedThisMonth = 0;

    requests.forEach(req => {
      const status = (req.status || 'pending').toLowerCase();
      if (status === 'approved') approvedCount += 1;
      else if (status === 'rejected') rejectedCount += 1;
      else pendingCount += 1;

      (req.trail || []).forEach(entry => {
        const action = (entry.action || '').toLowerCase();
        const date = new Date(entry.at || req.updatedAt || req.createdAt || Date.now());
        if (date.getMonth() !== month || date.getFullYear() !== year) return;
        if (action === 'approved') approvedThisMonth += 1;
        if (action === 'rejected') rejectedThisMonth += 1;
      });
    });

    if (approvalOpenCount) approvalOpenCount.textContent = pendingCount;
    if (approvalApprovedCount) approvalApprovedCount.textContent = approvedThisMonth;
    if (approvalRejectedCount) approvalRejectedCount.textContent = rejectedThisMonth;
    if (approvalTotalCount) approvalTotalCount.textContent = requests.length;

    if (approvalLegendPending) approvalLegendPending.textContent = pendingCount;
    if (approvalLegendApproved) approvalLegendApproved.textContent = approvedCount;
    if (approvalLegendRejected) approvalLegendRejected.textContent = rejectedCount;

    if (approvalPie) {
      const total = pendingCount + approvedCount + rejectedCount;
      const pendingPct = total ? (pendingCount / total) * 100 : 0;
      const approvedPct = total ? (approvedCount / total) * 100 : 0;
      const p1 = pendingPct;
      const p2 = pendingPct + approvedPct;
      approvalPie.style.setProperty('--p1', `${p1}%`);
      approvalPie.style.setProperty('--p2', `${p2}%`);
    }
  }

  if (openIssuesCard) {
    openIssuesCard.addEventListener('click', goToIssues);
    openIssuesCard.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        goToIssues();
      }
    });
  }

  if (openApprovalsCard) {
    openApprovalsCard.addEventListener('click', goToApprovals);
    openApprovalsCard.addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        goToApprovals();
      }
    });
  }

  updateApprovalStats();
  window.addEventListener('storage', (event) => {
    if (event.key === REQ_KEY) updateApprovalStats();
  });
})();
