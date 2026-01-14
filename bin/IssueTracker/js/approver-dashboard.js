(() => {
  const MAT_KEY = 'approval_matrices';
  const REQ_KEY = 'approval_requests';
  const ACTIVE_USER_KEY = 'approver_active_user';

  const userToggle = document.getElementById('user-toggle');
  const userPanel = document.getElementById('user-panel');
  const userSelect = document.getElementById('user-select');
  const userLabel = document.getElementById('user-label');
  const userAvatar = document.getElementById('user-avatar');

  const metricOpen = document.getElementById('metric-open');
  const metricApproved = document.getElementById('metric-approved');
  const metricRejected = document.getElementById('metric-rejected');
  const metricTotal = document.getElementById('metric-total');
  const pieEl = document.getElementById('status-pie');
  const legendPending = document.getElementById('legend-pending');
  const legendApproved = document.getElementById('legend-approved');
  const legendRejected = document.getElementById('legend-rejected');
  const refreshBtn = document.getElementById('refresh-btn');
  const tbody = document.getElementById('request-tbody');
  const emptyState = document.getElementById('request-empty');

  function loadMatrices() {
    try {
      const raw = localStorage.getItem(MAT_KEY);
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
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

  function getApproverMap() {
    const matrices = loadMatrices();
    const map = new Map();
    matrices.forEach(m => {
      (m.levels || []).forEach(l => {
        if (!l || !l.ownerEmail) return;
        map.set(l.ownerEmail, l.ownerName || l.ownerEmail);
      });
    });
    return map;
  }

  function getInitials(nameOrEmail) {
    if (!nameOrEmail) return 'UA';
    const name = nameOrEmail.includes('@') ? nameOrEmail.split('@')[0] : nameOrEmail;
    const parts = name.trim().split(/[\s._-]+/).filter(Boolean);
    const first = parts[0] ? parts[0][0] : '';
    const second = parts[1] ? parts[1][0] : '';
    return (first + second).toUpperCase() || 'UA';
  }

  function setUserDisplay(email, map) {
    const label = email ? `${map.get(email) || email}` : 'Select approver';
    if (userLabel) userLabel.textContent = label;
    if (userAvatar) userAvatar.textContent = getInitials(map.get(email) || email || 'UA');
  }

  function setActiveUser(email, map) {
    if (email) {
      localStorage.setItem(ACTIVE_USER_KEY, email);
    } else {
      localStorage.removeItem(ACTIVE_USER_KEY);
    }
    if (userSelect) userSelect.value = email || '';
    setUserDisplay(email, map);
    render();
  }

  function buildUserOptions(map) {
    if (!userSelect) return;
    userSelect.innerHTML = '';
    if (!map.size) {
      const opt = document.createElement('option');
      opt.value = '';
      opt.textContent = 'No approvers found';
      userSelect.appendChild(opt);
      userSelect.disabled = true;
      setUserDisplay('', map);
      return;
    }
    Array.from(map.entries()).forEach(([email, name]) => {
      const opt = document.createElement('option');
      opt.value = email;
      opt.textContent = `${name} (${email})`;
      userSelect.appendChild(opt);
    });
    userSelect.disabled = false;
  }

  function toggleUserPanel(force) {
    if (!userPanel || !userToggle) return;
    const isOpen = userPanel.classList.contains('is-open');
    const next = typeof force === 'boolean' ? force : !isOpen;
    userPanel.classList.toggle('is-open', next);
    userToggle.setAttribute('aria-expanded', String(next));
  }

  function formatStatus(status) {
    if (!status) return { label: 'pending', cls: 'status status--pending' };
    const lower = status.toLowerCase();
    if (lower === 'approved') return { label: 'approved', cls: 'status status--approved' };
    if (lower === 'rejected') return { label: 'rejected', cls: 'status status--rejected' };
    return { label: lower, cls: 'status status--pending' };
  }

  function isSameUser(by, email, name) {
    if (!by) return false;
    if (email && by === email) return true;
    if (name && by === name) return true;
    return false;
  }

  function render() {
    if (!tbody) return;
    const map = getApproverMap();
    const selected = localStorage.getItem(ACTIVE_USER_KEY) || '';
    setUserDisplay(selected, map);
    const selectedName = selected ? map.get(selected) : '';
    const requests = loadRequests();

    let list = requests.slice();
    if (selected) {
      list = list.filter(r => Array.isArray(r.levels) && r.levels.some(l => l.ownerEmail === selected));
    }
    list.sort((a, b) => new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0));

    tbody.innerHTML = '';
    list.forEach(r => {
      const issue = r.issue || {};
      const invoice = r.invoice || {};
      const currentLevel = r.currentLevel || 1;
      const currentOwner = Array.isArray(r.levels) ? r.levels[currentLevel - 1] : null;
      const myTurn = selected && r.status === 'pending' && currentOwner && currentOwner.ownerEmail === selected;
      const statusInfo = formatStatus(r.status);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>
          <strong>${r.id || '-'}</strong>
          <div class="meta">${new Date(r.createdAt || Date.now()).toLocaleString()}</div>
        </td>
        <td>
          <div>${issue.id || '-'}</div>
          <div class="meta">${issue.title || issue.subStatus || '-'}</div>
        </td>
        <td>
          <div>${invoice.id || '-'}</div>
          <div class="meta">${invoice.customer || '-'}</div>
        </td>
        <td>
          <div>${r.processName || r.processId || '-'}</div>
          <div class="meta">Matrix: ${r.matrixName || '-'}</div>
        </td>
        <td>
          <div>Level ${currentLevel}</div>
          <div class="meta">${currentOwner ? currentOwner.ownerName : 'Unassigned'}</div>
          ${myTurn ? '<div class="meta">My turn</div>' : ''}
        </td>
        <td><span class="${statusInfo.cls}">${statusInfo.label}</span></td>
        <td>
          <a class="btn btn--ghost" href="approval-request.html?id=${encodeURIComponent(r.id || '')}&user=${encodeURIComponent(selected || '')}">Review</a>
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (emptyState) {
      emptyState.style.display = list.length ? 'none' : 'block';
      emptyState.textContent = selected
        ? 'No approval requests for the selected approver.'
        : 'Select an approver to see approval requests.';
    }

    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let openToApprove = 0;
    let approvedThisMonth = 0;
    let rejectedThisMonth = 0;

    list.forEach(r => {
      const status = (r.status || 'pending').toLowerCase();
      if (status === 'approved') approvedCount += 1;
      else if (status === 'rejected') rejectedCount += 1;
      else pendingCount += 1;

      const currentLevel = r.currentLevel || 1;
      const currentOwner = Array.isArray(r.levels) ? r.levels[currentLevel - 1] : null;
      if (status === 'pending' && selected && currentOwner && currentOwner.ownerEmail === selected) {
        openToApprove += 1;
      }

      (r.trail || []).forEach(entry => {
        const action = (entry.action || '').toLowerCase();
        const date = new Date(entry.at || r.updatedAt || r.createdAt || Date.now());
        if (date.getMonth() !== month || date.getFullYear() !== year) return;
        if (!selected || isSameUser(entry.by, selected, selectedName)) {
          if (action === 'approved') approvedThisMonth += 1;
          if (action === 'rejected') rejectedThisMonth += 1;
        }
      });
    });

    if (metricOpen) metricOpen.textContent = openToApprove;
    if (metricApproved) metricApproved.textContent = approvedThisMonth;
    if (metricRejected) metricRejected.textContent = rejectedThisMonth;
    if (metricTotal) metricTotal.textContent = list.length;

    if (legendPending) legendPending.textContent = pendingCount;
    if (legendApproved) legendApproved.textContent = approvedCount;
    if (legendRejected) legendRejected.textContent = rejectedCount;

    if (pieEl) {
      const total = pendingCount + approvedCount + rejectedCount;
      const pendingPct = total ? (pendingCount / total) * 100 : 0;
      const approvedPct = total ? (approvedCount / total) * 100 : 0;
      const p1 = pendingPct;
      const p2 = pendingPct + approvedPct;
      pieEl.style.setProperty('--p1', `${p1}%`);
      pieEl.style.setProperty('--p2', `${p2}%`);
    }
  }

  const map = getApproverMap();
  buildUserOptions(map);
  const saved = localStorage.getItem(ACTIVE_USER_KEY) || '';
  const first = map.size ? Array.from(map.keys())[0] : '';
  const active = saved && map.has(saved) ? saved : first;
  if (active) {
    setActiveUser(active, map);
  } else {
    setUserDisplay('', map);
    render();
  }

  if (userSelect) {
    userSelect.addEventListener('change', (event) => {
      const email = event.target.value || '';
      setActiveUser(email, getApproverMap());
      toggleUserPanel(false);
    });
  }
  if (userToggle) {
    userToggle.addEventListener('click', (event) => {
      event.stopPropagation();
      toggleUserPanel();
    });
  }
  if (userPanel) {
    userPanel.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  }
  window.addEventListener('click', () => toggleUserPanel(false));

  if (refreshBtn) refreshBtn.addEventListener('click', render);
  window.addEventListener('storage', (event) => {
    if (event.key === REQ_KEY || event.key === MAT_KEY || event.key === ACTIVE_USER_KEY) {
      buildUserOptions(getApproverMap());
      render();
    }
  });
})();
