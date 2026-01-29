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
  const metricAvgDays = document.getElementById('metric-avg-days');
  const metricApproved = document.getElementById('metric-approved');
  const metricRejected = document.getElementById('metric-rejected');
  const metricTotal = document.getElementById('metric-total');
  const quickInfoList = document.getElementById('approval-quick-info');
  const vintageList = document.getElementById('approval-vintage-list');
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

  function getLevelDurations(req, now) {
    const levels = Array.isArray(req.levels) ? req.levels : [];
    if (!levels.length) return [];
    const start = new Date(req.createdAt || req.updatedAt || Date.now());
    const starts = Array(levels.length).fill(null);
    const ends = Array(levels.length).fill(null);
    starts[0] = start;

    const trail = Array.isArray(req.trail) ? req.trail.slice() : [];
    trail.sort((a, b) => new Date(a.at || 0) - new Date(b.at || 0));
    trail.forEach(entry => {
      const levelIndex = (entry.level || 1) - 1;
      if (levelIndex < 0 || levelIndex >= levels.length) return;
      const at = new Date(entry.at || Date.now());
      if (!starts[levelIndex]) starts[levelIndex] = at;
      ends[levelIndex] = at;
      if (String(entry.action || '').toLowerCase() === 'approved' && levelIndex + 1 < levels.length) {
        if (!starts[levelIndex + 1]) starts[levelIndex + 1] = at;
      }
    });

    const currentIndex = (req.currentLevel || 1) - 1;
    const isPending = String(req.status || 'pending').toLowerCase() === 'pending';
    const results = [];

    levels.forEach((lvl, idx) => {
      if (!starts[idx]) return;
      let end = ends[idx];
      let isOpen = false;
      if (!end && isPending && idx === currentIndex) {
        end = now;
        isOpen = true;
      }
      if (!end) return;
      const diffDays = Math.max(0, Math.floor((end.getTime() - starts[idx].getTime()) / (1000 * 60 * 60 * 24)));
      const label = lvl.ownerName ? `Level ${idx + 1} - ${lvl.ownerName}` : `Level ${idx + 1}`;
      results.push({ label, days: diffDays, isOpen });
    });

    return results;
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

    const now = new Date();
    const getOpenDays = (req) => {
      const start = new Date(req.createdAt || req.updatedAt || Date.now());
      if (Number.isNaN(start.getTime())) return 0;
      const diffMs = now.getTime() - start.getTime();
      return Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    };

    tbody.innerHTML = '';
    list.forEach(r => {
      const issue = r.issue || {};
      const invoice = r.invoice || {};
      const currentLevel = r.currentLevel || 1;
      const currentOwner = Array.isArray(r.levels) ? r.levels[currentLevel - 1] : null;
      const myTurn = selected && r.status === 'pending' && currentOwner && currentOwner.ownerEmail === selected;
      const statusInfo = formatStatus(r.status);
      const isPending = (r.status || 'pending').toLowerCase() === 'pending';
      const openDays = isPending ? getOpenDays(r) : '-';
      const levelDurations = getLevelDurations(r, now);
      const tooltip = levelDurations.length
        ? levelDurations.map(item => `${item.label}: ${item.days} day${item.days === 1 ? '' : 's'}${item.isOpen ? ' (open)' : ''}`).join('\n')
        : '';
      const tr = document.createElement('tr');
      tr.innerHTML = `
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
        <td class="open-days-cell">${openDays}</td>
        <td>
          <a class="btn btn--ghost" href="approval-request.html?id=${encodeURIComponent(r.id || '')}&user=${encodeURIComponent(selected || '')}">Review</a>
        </td>
      `;
      if (tooltip) {
        const openCell = tr.querySelector('.open-days-cell');
        if (openCell) openCell.title = tooltip;
      }
      tbody.appendChild(tr);
    });

    if (emptyState) {
      emptyState.style.display = list.length ? 'none' : 'block';
      emptyState.textContent = selected
        ? 'No approval requests for the selected approver.'
        : 'Select an approver to see approval requests.';
    }

    const month = now.getMonth();
    const year = now.getFullYear();

    let pendingCount = 0;
    let approvedCount = 0;
    let rejectedCount = 0;
    let openToApprove = 0;
    let approvedThisMonth = 0;
    let rejectedThisMonth = 0;
    let pendingOpenDaysTotal = 0;
    const vintageBuckets = [
      { label: '0-2 days', min: 0, max: 2, count: 0 },
      { label: '3-5 days', min: 3, max: 5, count: 0 },
      { label: '6-10 days', min: 6, max: 10, count: 0 },
      { label: '11-15 days', min: 11, max: 15, count: 0 },
      { label: '16+ days', min: 16, max: Infinity, count: 0 }
    ];

    list.forEach(r => {
      const status = (r.status || 'pending').toLowerCase();
      if (status === 'approved') approvedCount += 1;
      else if (status === 'rejected') rejectedCount += 1;
      else {
        pendingCount += 1;
        const openDays = getOpenDays(r);
        pendingOpenDaysTotal += openDays;
        const bucket = vintageBuckets.find(item => openDays >= item.min && openDays <= item.max);
        if (bucket) bucket.count += 1;
      }

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
    if (metricAvgDays) {
      const avg = pendingCount ? pendingOpenDaysTotal / pendingCount : 0;
      metricAvgDays.textContent = avg ? avg.toFixed(1) : '0';
    }
    if (metricApproved) metricApproved.textContent = approvedThisMonth;
    if (metricRejected) metricRejected.textContent = rejectedThisMonth;
    if (metricTotal) metricTotal.textContent = list.length;

    if (quickInfoList) {
      quickInfoList.innerHTML = `
        <li class="quick-info-item"><span>Pending</span><span class="quick-info-count">${pendingCount}</span></li>
        <li class="quick-info-item"><span>Approved</span><span class="quick-info-count">${approvedCount}</span></li>
        <li class="quick-info-item"><span>Rejected</span><span class="quick-info-count">${rejectedCount}</span></li>
      `;
    }

    if (vintageList) {
      vintageList.innerHTML = vintageBuckets
        .map(bucket => (
          `<li class="quick-info-item"><span>${bucket.label}</span><span class="quick-info-count">${bucket.count}</span></li>`
        ))
        .join('');
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

  window.addEventListener('storage', (event) => {
    if (event.key === REQ_KEY || event.key === MAT_KEY || event.key === ACTIVE_USER_KEY) {
      buildUserOptions(getApproverMap());
      render();
    }
  });
})();
