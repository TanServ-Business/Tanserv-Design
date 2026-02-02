(() => {
  const REQ_KEY = 'approval_requests';
  const ACTIVE_USER_KEY = 'approver_active_user';
  const CUSTOM_ISSUES_KEY = 'customIssues';

  const requestMeta = document.getElementById('request-meta');
  const levelsWrap = document.getElementById('matrix-levels');
  const viewerNote = document.getElementById('viewer-note');
  const remarkInput = document.getElementById('remark');
  const docsInput = document.getElementById('documents');
  const decisionCard = document.getElementById('decision-card');
  const approveBtn = document.getElementById('approve-btn');
  const rejectBtn = document.getElementById('reject-btn');
  const backBtn = document.getElementById('back-to-dashboard');
  const actionMsg = document.getElementById('action-msg');
  const trailWrap = document.getElementById('trail');

  function loadRequests() {
    try {
      const raw = localStorage.getItem(REQ_KEY);
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function loadCustomIssues() {
    try {
      const raw = localStorage.getItem(CUSTOM_ISSUES_KEY);
      const parsed = JSON.parse(raw || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch (_) {
      return [];
    }
  }

  function saveCustomIssues(list) {
    try {
      localStorage.setItem(CUSTOM_ISSUES_KEY, JSON.stringify(list || []));
    } catch (_) {}
  }

  function persistApprovalToCustomIssue(req, entry) {
    const issueId = req?.issue?.id;
    if (!issueId) return;
    const list = loadCustomIssues();
    const idx = list.findIndex(item => item && item.id === issueId);
    if (idx < 0) return;
    const current = list[idx];
    const actionTrail = Array.isArray(current.actionTrail) ? current.actionTrail : [];
    const approvalKey = `approval:${req.id || issueId}:${entry.at}:${entry.action}`;
    actionTrail.push({
      who: entry.by || 'Approver',
      what: entry.action === 'approved'
        ? 'approved the issue'
        : entry.action === 'rejected'
          ? 'rejected the issue'
          : 'updated approval',
      type: 'approval',
      when: entry.at,
      remark: entry.remark || '',
      files: Array.isArray(entry.files) ? entry.files.slice() : [],
      approvalKey
    });
    list[idx] = {
      ...current,
      status: req.status || current.status || '',
      approvalProcessId: req.processId || current.approvalProcessId || '',
      approvalProcessName: req.processName || current.approvalProcessName || '',
      approvalMatrixId: req.matrixId || current.approvalMatrixId || '',
      approvalMatrixName: req.matrixName || current.approvalMatrixName || '',
      actionTrail
    };
    saveCustomIssues(list);
  }

  function saveRequests(list) {
    localStorage.setItem(REQ_KEY, JSON.stringify(list || []));
  }

  function getParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name) || '';
  }

  function normalizeId(value) {
    return String(value || '').trim().toLowerCase();
  }

  function normalizeIdentity(value) {
    return normalizeId(value).replace(/[^a-z0-9]+/g, ' ').trim();
  }

  function normalizeEmailName(value) {
    if (!value || typeof value !== 'string') return '';
    const at = value.indexOf('@');
    if (at === -1) return '';
    return normalizeIdentity(value.slice(0, at));
  }

  function setMessage(text, tone) {
    if (!actionMsg) return;
    actionMsg.textContent = text;
    actionMsg.style.display = 'block';
    if (tone === 'success') {
      actionMsg.style.background = '#dcfce7';
      actionMsg.style.borderColor = '#16a34a';
      actionMsg.style.color = '#166534';
    } else if (tone === 'error') {
      actionMsg.style.background = '#fee2e2';
      actionMsg.style.borderColor = '#dc2626';
      actionMsg.style.color = '#991b1b';
    } else {
      actionMsg.style.background = '#fff7ed';
      actionMsg.style.borderColor = '#f59e0b';
      actionMsg.style.color = '#92400e';
    }
  }

  function getLevelDurations(req, now) {
    const levels = Array.isArray(req?.levels) ? req.levels : [];
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

  function renderTrail(req) {
    if (!trailWrap) return;
    trailWrap.innerHTML = '';
    const now = new Date();
    const durations = getLevelDurations(req || {}, now);
    const durationMap = new Map();
    durations.forEach(item => {
      const levelMatch = item.label.match(/^Level\s+(\d+)/i);
      if (!levelMatch) return;
      durationMap.set(Number(levelMatch[1]), item);
    });

    const trail = Array.isArray(req?.trail) ? req.trail : [];
    if (!trail.length) {
      const empty = document.createElement('div');
      empty.className = 'meta';
      empty.textContent = 'No actions yet.';
      trailWrap.appendChild(empty);
      return;
    }

    trail.slice().sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0)).forEach(entry => {
      const block = document.createElement('div');
      const action = String(entry.action || '').toLowerCase();
      const statusLabel = action ? action.charAt(0).toUpperCase() + action.slice(1) : 'Update';
      const levelIndex = Number(entry.level || 0);
      const levelDuration = durationMap.get(levelIndex);
      const showDuration = action === 'approved' || action === 'rejected';
      const durationLine = showDuration && levelDuration
        ? `<div class="trailOpenDays">Open days: ${levelDuration.days} day${levelDuration.days === 1 ? '' : 's'}</div>`
        : '';
      const dateObj = new Date(entry.at || Date.now());
      const dateLine = dateObj.toLocaleDateString();
      const timeLine = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const documents = entry.files && entry.files.length
        ? entry.files.map(name => (
          `<a class="trailDocLink" href="#" role="button">${name}</a>`
        )).join('')
        : '<span class="trailDocEmpty">No documents</span>';
      const statusClass = action === 'approved'
        ? 'trailItem--approved'
        : action === 'rejected'
          ? 'trailItem--rejected'
          : action === 'submitted'
            ? 'trailItem--submitted'
            : 'trailItem--default';

      block.innerHTML = `
        <details class="trailItem ${statusClass}">
          <summary class="trailSummary">
            <span class="trailDot" aria-hidden="true"></span>
            <div class="trailText">
              <div class="trailTitle">${statusLabel} <span class="trailBy">- ${entry.by || 'Unknown'}</span></div>
              <div class="trailSubtitle">Level ${entry.level || '-'} · ${dateLine}</div>
            </div>
            <span class="trailStatusPill">${statusLabel}</span>
          </summary>
          <div class="trailBody">
            ${durationLine}
            <div class="trailMetaRow">
              <span class="trailMetaLabel">Documents</span>
              <div class="trailDocs">${documents}</div>
            </div>
            <div class="trailMetaRow">
              <span class="trailMetaLabel">Remark</span>
              <span class="trailRemark">${entry.remark || '-'}</span>
            </div>
            <div class="trailFooter">
              <div class="trailDateFooter">
                <span>${dateLine}</span>
                <span>${timeLine}</span>
              </div>
            </div>
          </div>
        </details>
      `;
      trailWrap.appendChild(block.firstElementChild);
    });
  }

  function renderLevels(levels, currentLevel) {
    if (!levelsWrap) return;
    levelsWrap.innerHTML = '';
    if (!levels || !levels.length) {
      levelsWrap.textContent = 'No levels defined.';
      return;
    }
    levels.forEach((lvl, idx) => {
      const div = document.createElement('div');
      div.className = 'level' + (idx + 1 === currentLevel ? ' is-current' : '');
      div.innerHTML = `
        <div>Level ${idx + 1} - ${lvl.ownerName || 'Approver'}</div>
        <div>${lvl.ownerEmail || '-'}</div>
      `;
      levelsWrap.appendChild(div);
    });
  }

  function renderMeta(req) {
    if (!requestMeta) return;
    const issue = req.issue || {};
    const invoice = req.invoice || {};
    requestMeta.innerHTML = `
      <div><strong>Request:</strong> ${req.id || '-'}</div>
      <div><strong>Process:</strong> ${req.processName || req.processId || '-'}</div>
      <div><strong>Status:</strong> ${req.status || 'pending'} (Level ${req.currentLevel || 1})</div>
      <div><strong>Issue:</strong> ${issue.id || '-'} - ${issue.title || issue.subStatus || '-'}</div>
      <div><strong>Issue Detail:</strong> ${issue.description || '-'}</div>
      <div><strong>Invoice:</strong> ${invoice.id || '-'} - ${invoice.customer || '-'}</div>
      <div><strong>Invoice Date:</strong> ${invoice.date || '-'}</div>
      <div><strong>Total:</strong> ${invoice.total != null ? invoice.total : '-'}</div>
    `;
  }

  const requestId = getParam('id');
  const viewerEmail = getParam('user') || localStorage.getItem(ACTIVE_USER_KEY) || '';
  const list = loadRequests();
  const req = list.find(r => r && r.id === requestId);

  if (!req) {
    renderMeta({ id: requestId || '-', status: 'not found' });
    renderLevels([], 0);
    renderTrail({ trail: [] });
    setMessage('Approval request not found.', 'error');
    if (approveBtn) approveBtn.disabled = true;
    if (rejectBtn) rejectBtn.disabled = true;
    return;
  }

  function getCurrentOwner() {
    return Array.isArray(req.levels) ? req.levels[(req.currentLevel || 1) - 1] : null;
  }

  function updatePermissions() {
    const currentOwner = getCurrentOwner();
    const viewerId = normalizeIdentity(viewerEmail);
    const viewerNameFromEmail = normalizeEmailName(viewerEmail);
    const ownerEmail = normalizeIdentity(currentOwner && currentOwner.ownerEmail);
    const ownerName = normalizeIdentity(currentOwner && currentOwner.ownerName);
    const canAct = req.status === 'pending' && currentOwner && viewerId
      && (viewerId === ownerEmail || viewerId === ownerName || viewerNameFromEmail === ownerName);
    if (decisionCard) {
      decisionCard.style.display = '';
    }
    if (approveBtn) approveBtn.disabled = !canAct;
    if (rejectBtn) rejectBtn.disabled = !canAct;
    if (backBtn) {
      backBtn.removeAttribute('aria-disabled');
      backBtn.removeAttribute('tabindex');
    }
    if (viewerNote) {
      if (!canAct) {
        viewerNote.textContent = viewerEmail
          ? 'You can view this request, but actions are only available for the current approval level.'
          : 'Select an approver from the dashboard to take action on this request.';
        viewerNote.style.display = 'block';
      } else {
        viewerNote.style.display = 'none';
      }
    }
    return canAct;
  }

  renderMeta(req);
  renderLevels(req.levels || [], req.currentLevel || 1);
  renderTrail(req);
  updatePermissions();

  if (backBtn) {
    backBtn.addEventListener('click', (event) => {
      event.preventDefault();
    });
  }

  function handleAction(action) {
    const remark = (remarkInput && remarkInput.value || '').trim();
    if (!remark) {
      setMessage('Remarks are required before approving or rejecting.', 'error');
      return;
    }
    const currentOwner = getCurrentOwner();
    const viewerId = normalizeIdentity(viewerEmail);
    const viewerNameFromEmail = normalizeEmailName(viewerEmail);
    const ownerEmail = normalizeIdentity(currentOwner && currentOwner.ownerEmail);
    const ownerName = normalizeIdentity(currentOwner && currentOwner.ownerName);
    const canAct = req.status === 'pending' && currentOwner && viewerId
      && (viewerId === ownerEmail || viewerId === ownerName || viewerNameFromEmail === ownerName);
    if (!canAct) {
      setMessage('You cannot act on this request at the current level.', 'error');
      return;
    }
    const now = new Date().toISOString();
    const files = docsInput && docsInput.files ? Array.from(docsInput.files).map(f => f.name) : [];
    req.trail = req.trail || [];
    req.trail.push({
      action,
      by: currentOwner.ownerName || viewerEmail || 'Approver',
      level: req.currentLevel || 1,
      at: now,
      remark,
      files
    });

    if (action === 'approved') {
      if ((req.currentLevel || 1) < (req.levels || []).length) {
        req.currentLevel = (req.currentLevel || 1) + 1;
        req.status = 'pending';
        setMessage(`Approved. Sent to Level ${req.currentLevel}.`, 'success');
      } else {
        req.status = 'approved';
        setMessage('Approved. All levels completed.', 'success');
      }
    } else {
      req.status = 'rejected';
      setMessage('Rejected. The request is closed.', 'error');
    }

    req.updatedAt = now;
    saveRequests(list);
    persistApprovalToCustomIssue(req, req.trail[req.trail.length - 1]);
    renderMeta(req);
    renderLevels(req.levels || [], req.currentLevel || 1);
    renderTrail(req);
    if (remarkInput) remarkInput.value = '';
    if (docsInput) docsInput.value = '';
    updatePermissions();
  }
  if (approveBtn) {
    approveBtn.addEventListener('click', () => handleAction('approved'));
  }
  if (rejectBtn) {
    rejectBtn.addEventListener('click', () => handleAction('rejected'));
  }
})();
