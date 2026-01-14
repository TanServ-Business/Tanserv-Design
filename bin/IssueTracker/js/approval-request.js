(() => {
  const REQ_KEY = 'approval_requests';
  const ACTIVE_USER_KEY = 'approver_active_user';

  const requestMeta = document.getElementById('request-meta');
  const levelsWrap = document.getElementById('matrix-levels');
  const viewerNote = document.getElementById('viewer-note');
  const remarkInput = document.getElementById('remark');
  const docsInput = document.getElementById('documents');
  const decisionCard = document.getElementById('decision-card');
  const approveBtn = document.getElementById('approve-btn');
  const rejectBtn = document.getElementById('reject-btn');
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

  function saveRequests(list) {
    localStorage.setItem(REQ_KEY, JSON.stringify(list || []));
  }

  function getParam(name) {
    const params = new URLSearchParams(window.location.search);
    return params.get(name) || '';
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

  function renderTrail(trail) {
    if (!trailWrap) return;
    trailWrap.innerHTML = '';
    if (!trail || !trail.length) {
      trailWrap.textContent = 'No actions yet.';
      return;
    }
    trail.slice().sort((a, b) => new Date(b.at || 0) - new Date(a.at || 0)).forEach(entry => {
      const block = document.createElement('div');
      block.className = 'level';
      const files = entry.files && entry.files.length ? `Documents: ${entry.files.join(', ')}` : 'Documents: None';
      block.innerHTML = `
        <div>
          <strong>${entry.action || 'action'}</strong> - ${entry.by || 'Unknown'}
          <div class="meta">${new Date(entry.at || Date.now()).toLocaleString()}</div>
          <div class="meta">${files}</div>
          <div class="meta">Remark: ${entry.remark || '-'}</div>
        </div>
        <div>Level ${entry.level || '-'}</div>
      `;
      trailWrap.appendChild(block);
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
    renderTrail([]);
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
    const canAct = req.status === 'pending' && currentOwner && viewerEmail && currentOwner.ownerEmail === viewerEmail;
    if (decisionCard) {
      decisionCard.style.display = canAct ? '' : 'none';
    }
    if (approveBtn) approveBtn.disabled = !canAct;
    if (rejectBtn) rejectBtn.disabled = !canAct;
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
  renderTrail(req.trail || []);
  updatePermissions();

  function handleAction(action) {
    const remark = (remarkInput && remarkInput.value || '').trim();
    if (!remark) {
      setMessage('Remarks are required before approving or rejecting.', 'error');
      return;
    }
    const currentOwner = getCurrentOwner();
    const canAct = req.status === 'pending' && currentOwner && viewerEmail && currentOwner.ownerEmail === viewerEmail;
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
    renderMeta(req);
    renderLevels(req.levels || [], req.currentLevel || 1);
    renderTrail(req.trail || []);
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
