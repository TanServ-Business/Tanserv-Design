/* Bulk submission confirmation for the AR landing page demo. */
(() => {
  'use strict';
  const trigger = document.getElementById('bulkSubmitInvoices');
  const element = document.getElementById('bulkSubmitInvoicesModal');
  if (!trigger || !element) return;
  const $ = id => document.getElementById(id);
  const chooser = $('bulkSubmitAction');
  const dropdown = $('bulkSubmitActionDropdown');
  const actionTrigger = $('bulkSubmitActionTrigger');
  const confirm = $('bulkSubmitConfirm');
  const modal = window.bootstrap?.Modal.getOrCreateInstance(element);
  const documentName = value => String(value || '').trim().toUpperCase().replace(/\s+/g, ' ').replace(/^INVOICE COPY$/, 'INVOICE');
  const plural = count => `${count} invoice${count === 1 ? '' : 's'}`;
  let groups, requested = false;

  // Each selected invoice belongs to one overview group; action counts use
  // those same groups. Document-only requests never include submitted invoices.
  function collectSelection() {
    const result = { ready:[], documents:[], sequential:[], submitted:[], incomplete:[], noProcess:[] };
    const strategies = window.SubmissionStrategy?.read(localStorage, window.SubmissionStrategy.defaultStrategies) || [];
    for (const invoiceNo of selectedInvoiceNos) {
      const customer = customersData.find(row => (row.invoices || []).some(invoice => invoice.invoiceNo === invoiceNo));
      const invoice = customer?.invoices.find(row => row.invoiceNo === invoiceNo);
      const row = { invoiceNo, customer:customer?.name || '' };
      if (!invoice) { result.noProcess.push(row); continue; }
      if (/submitted/i.test(invoice.invoiceStatus || '') && !/not submitted/i.test(invoice.invoiceStatus || '')) {
        result.submitted.push(row);
        continue;
      }
      const context = { ...invoice, productCategory:invoice.productCategory || customer.product };
      const strategy = window.SubmissionStrategy?.resolve(context, strategies);
      if (!strategy) { result.noProcess.push(row); continue; }
      const required = window.SubmissionStrategy.requirements(context, strategy).map(item => documentName(item.name));
      const available = new Set((invoice.attachedDocuments || customer.documents || []).map(item => documentName(typeof item === 'string' ? item : item.name)));
      const missing = required.filter(name => !available.has(name));
      const sent = new Set((invoice.sequentialSentDocuments || []).map(documentName));
      row.strategyId = strategy.id;
      row.documents = required.filter(name => available.has(name) && !sent.has(name));
      row.missing = missing;
      if (window.SubmissionStrategy.deliveryMode?.(strategy) === 'sequential' && !strategy.batchInvoicesInOneEmail) {
        // The invoice copy permits submission; supporting files can be sent
        // separately while the invoice itself is still pending.
        if (available.has('INVOICE')) {
          row.documents = [...new Set(['INVOICE', ...row.documents])];
          result.sequential.push(row);
        } else if (row.documents.length) result.documents.push(row);
        else result.incomplete.push(row);
      } else {
        if (/docs?\s*(pending|required)|further docs|invoice copy required/i.test(`${invoice.primaryStatus || ''} ${invoice.status || ''}`) && !missing.length) missing.push('Supporting document flagged as missing');
        (missing.length ? result.incomplete : result.ready).push(row);
      }
    }
    return result;
  }

  function actions() {
    return {
      submit:{ label:'Submit ready invoices', rows:groups.ready, button:count => `Submit ${plural(count)}`, hint:count => `Only ${plural(count)} with all required documents will be submitted.` },
      resend:{ label:'Resend submitted invoices', rows:groups.submitted, button:count => `Resend ${plural(count)}`, hint:count => `${plural(count)} will receive the submission email again. Their submission status stays unchanged.` },
      documents:{ label:'Send sequential documents only', rows:groups.documents, button:count => `Send documents for ${plural(count)}`, hint:count => `Send available, unsent documents for ${plural(count)}. These invoices remain Not Submitted.` },
      sequential:{ label:'Send sequential documents and submit', rows:groups.sequential, button:count => `Send & submit ${plural(count)}`, hint:count => `Send the invoice and available, unsent documents for ${plural(count)}. Submission completes when Outlook accepts the email.` }
    };
  }

  function showAction() {
    const availableActions = actions();
    const action = availableActions[chooser.value];
    $('bulkSubmitActionValue').textContent = action ? `${action.label} (${action.rows.length})` : 'Select an action';
    actionTrigger.setAttribute('aria-disabled', String(chooser.disabled));
    for (const [key, definition] of Object.entries(availableActions)) {
      const item = $(`bulkSubmitOption-${key}`);
      item.textContent = `${definition.label} (${definition.rows.length})`;
      item.disabled = chooser.disabled || !definition.rows.length;
      item.setAttribute('aria-selected', String(chooser.value === key));
    }
    confirm.disabled = requested || !action?.rows.length;
    confirm.textContent = requested ? 'Request recorded' : action ? action.button(action.rows.length) : 'Select an action';
    $('bulkSubmitActionHint').textContent = action ? action.hint(action.rows.length) : 'None of the selected invoices can be processed. Review the breakdown above.';
  }

  function reviewSelection(preferredAction = '') {
    groups = collectSelection();
    requested = false;
    chooser.disabled = false;
    dropdown.open = false;
    const counts = {
      bulkSubmitProcessCount:groups.ready.length + groups.documents.length + groups.sequential.length,
      bulkSubmitReadyCount:groups.ready.length,
      bulkSubmitDocumentsCount:groups.documents.length,
      bulkSubmitSequentialCount:groups.sequential.length,
      bulkSubmitSubmittedCount:groups.submitted.length,
      bulkSubmitAttentionCount:groups.incomplete.length + groups.noProcess.length,
      bulkSubmitPendingCount:groups.incomplete.length,
      bulkSubmitNoProcessCount:groups.noProcess.length
    };
    for (const [id, count] of Object.entries(counts)) $(id).textContent = count;
    $('bulkSubmitSummary').textContent = `${plural(selectedInvoiceNos.size)} selected`;
    const blocked = groups.incomplete.length + groups.noProcess.length;
    $('bulkSubmitMissing').hidden = blocked === 0;
    $('bulkSubmitMissing').textContent = 'Invoices with missing documents or no submission process remain pending.';
    const availableActions = actions();
    for (const option of chooser.options) {
      const action = availableActions[option.value];
      if (!action) continue;
      option.textContent = `${action.label} (${action.rows.length})`;
      option.disabled = !action.rows.length;
    }
    chooser.value = availableActions[preferredAction]?.rows.length ? preferredAction : Object.keys(availableActions).find(key => availableActions[key].rows.length) || '';
    $('bulkSubmitResult').hidden = true;
    showAction();
  }

  trigger.addEventListener('click', () => { reviewSelection(); modal?.show(); });
  chooser.addEventListener('change', showAction);
  for (const key of ['submit', 'resend', 'documents', 'sequential']) {
    $(`bulkSubmitOption-${key}`).addEventListener('click', () => {
      if (chooser.disabled || !actions()[key].rows.length) return;
      chooser.value = key;
      showAction();
      dropdown.open = false;
      actionTrigger.focus();
    });
  }
  actionTrigger.addEventListener('click', event => {
    if (chooser.disabled) event.preventDefault();
  });
  dropdown.addEventListener('keydown', event => {
    if (chooser.disabled) return;
    if (event.key === 'Escape' && dropdown.open) {
      dropdown.open = false;
      actionTrigger.focus();
      event.preventDefault();
      event.stopPropagation();
      return;
    }
    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
    const enabled = ['submit', 'resend', 'documents', 'sequential']
      .map(key => $(`bulkSubmitOption-${key}`)).filter(item => !item.disabled && !item.hidden);
    if (!enabled.length) return;
    dropdown.open = true;
    const current = enabled.indexOf(document.activeElement);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? enabled.length - 1
      : current < 0 ? (event.key === 'ArrowDown' ? 0 : enabled.length - 1)
        : (current + (event.key === 'ArrowDown' ? 1 : -1) + enabled.length) % enabled.length;
    enabled[next].focus();
    event.preventDefault();
  });
  confirm.addEventListener('click', () => {
    if (requested) return;
    const actionKey = chooser.value;
    const previous = JSON.stringify(groups);
    const current = collectSelection();
    if (JSON.stringify(current) !== previous) {
      reviewSelection(actionKey);
      $('bulkSubmitActionHint').textContent = 'The selection or its document readiness changed. Review the updated counts before continuing.';
      return;
    }
    const action = actions()[actionKey];
    if (!action?.rows.length) return;
    const result = $('bulkSubmitResult');
    try {
      const requests = JSON.parse(localStorage.getItem('ineburaBulkSubmissionRequests:v1') || '[]');
      if (!Array.isArray(requests)) throw new Error('Invalid request history');
      const repeats = actionKey === 'resend' ? groups.submitted.map(row => row.invoiceNo) : [];
      requests.push({
        id:`SUB-${Date.now()}`, createdAt:new Date().toISOString(), action:actionKey,
        invoiceNos:action.rows.map(row => row.invoiceNo), resubmissionInvoiceNos:repeats,
        documentOnly:actionKey === 'documents',
        documentsByInvoice:Object.fromEntries(action.rows.filter(row => row.documents).map(row => [row.invoiceNo, row.documents])),
        status:'Awaiting Outlook delivery'
      });
      localStorage.setItem('ineburaBulkSubmissionRequests:v1', JSON.stringify(requests));
    } catch (_) {
      result.textContent = 'The request could not be saved. No submission was requested. Please try again.';
      result.setAttribute('data-state', 'error');
      result.hidden = false;
      return;
    }
    requested = true;
    chooser.disabled = true;
    dropdown.open = false;
    result.hidden = true;
    showAction();
    const message = actionKey === 'documents'
      ? `Document sending requested for ${plural(action.rows.length)}. These invoices remain Not Submitted.`
      : actionKey === 'resend'
        ? `Resending requested for ${plural(action.rows.length)}. Their submission status stays unchanged.`
        : `Submission requested for ${plural(action.rows.length)}. Submission completes when Outlook accepts the email.`;
    modal?.hide();
    showTransientNotification(actionKey === 'documents' ? 'Documents requested' : actionKey === 'resend' ? 'Resend requested' : 'Submission requested', message, 'success');
  });
})();
