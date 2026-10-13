/* Local, live-aligned Strategy Manager preview. No Xeon data is changed. */
(() => {
  'use strict';
  const page = window.IneburaAdminPage;
  if (page?.module !== 'submission-process' || page.view) return;
  const body = document.querySelector('.adminRuntimePage[data-admin-module="submission-process"] .adminWorkspaceBody');
  const modal = document.getElementById('adminModal');
  const previewStorage = window.localStorage;
  const strategyRules = window.SubmissionStrategy;
  if (!body || !modal || !strategyRules) return;

  const key = strategyRules.KEY;
  const documentNames = [
    'EMAIL COMMUNICATION (CUSTOMER)', 'EMAIL COMMUNICATION (INVOICE)', 'GR NUMBER',
    'INVOICE ACKNOWLEDGEMENT', 'WORK ORDER', 'PREVENTIVE MAINTENANCE REPORT',
    'INDEMNITY BOND', 'DELIVERY CHALLAN', 'PERFORMANCE BANK GUARANTEE',
    'BANK GUARANTEE', 'CONTRACT', 'AGREEMENT', 'PAYMENT RECEIPT',
    'PURCHASE ORDER', 'INVOICE'
  ];
  const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
  const clone = value => JSON.parse(JSON.stringify(value));
  const seed = window.IneburaAdminModules['submission-process'].seedRows || [];
  let strategies;
  try { strategies = JSON.parse(previewStorage.getItem(key) || 'null'); } catch (_) { strategies = null; }
  if (!Array.isArray(strategies)) strategies = clone(seed);
  let sortKey = '';
  let sortDirection = 1;
  let returnFocus = null;
  let dirtyCheck = () => false;
  const save = () => previewStorage.setItem(key, JSON.stringify(strategies));
  function scheduledInvoices(strategyId) {
    try {
      const C=window.SubmissionJourney, state=C.load(previewStorage), issues=C.readIssues(previewStorage);
      const attachments=C.issueAttachments(issues);
      state.invoices.forEach(invoice => { invoice.effectiveRequirements=strategyRules.requirements(invoice,strategyRules.resolve(invoice,strategies)); });
      const now=new Date(), parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(part=>[part.type,part.value]));
      let run=new Date(`${parts.year}-${parts.month}-${parts.day}T18:00:00+05:30`);
      if(run<=now) run=new Date(run.getTime()+86400000);
      return strategyRules.plan(state,strategies,C,attachments,run).batches.filter(batch=>batch.strategyId===strategyId).flatMap(batch=>batch.invoices);
    } catch (_) { return []; }
  }
  function confirmStrategyChange(record) {
    const scheduled=scheduledInvoices(record.id);
    if (!scheduled.length) return true;
    return window.confirm(`${scheduled.length} invoice${scheduled.length===1?' is':'s are'} scheduled for the next 06:00 PM IST run under this strategy. Saving this change stops that plan immediately. All pending invoices will be reassessed under the new strategy. Continue?`);
  }
  function recordStrategyChange(record) {
    try {
      const C=window.SubmissionJourney, state=C.load(previewStorage);
      C.event(state,{type:'automation',invoiceNos:state.invoices.filter(invoice=>!C.submitted(invoice)).map(invoice=>invoice.invoiceNo),what:'Submission strategy changed',remark:`${record.strategyName}: previous scheduled plan stopped; pending invoices will follow the current strategy.`});
      C.transaction(previewStorage,{[C.KEY]:state});
    } catch (_) { /* Keep the strategy edit available even if demo history is unavailable. */ }
  }
  const notify = text => {
    const toast = document.getElementById('adminToast');
    if (!toast) return;
    toast.textContent = text;
    toast.classList.add('is-visible');
    window.setTimeout(() => toast.classList.remove('is-visible'), 3200);
  };

  function render() {
    const rows = [...strategies];
    if (sortKey) rows.sort((a, b) => String(a[sortKey] ?? '').localeCompare(String(b[sortKey] ?? ''), undefined, {numeric:true}) * sortDirection);
    body.innerHTML = `<section class="adminSubmissionStrategy" aria-labelledby="submissionStrategyTitle">
      <header class="adminSubmissionStrategyHeader">
        <h2 id="submissionStrategyTitle">Invoice Submission Processes</h2>
        <div class="adminSubmissionHeaderActions"><button class="adminSecondary" type="button" data-submission-action="preview">Preview next run</button><button class="adminPrimary" type="button" data-submission-action="create"><i class="bi bi-plus-circle" aria-hidden="true"></i>Create New</button></div>
      </header>
      <div class="adminSubmissionStrategyTableWrap"><table class="adminSubmissionStrategyTable">
        <thead><tr>
          <th><button type="button" data-submission-sort="status">Status <i class="bi bi-arrow-down-up" aria-hidden="true"></i></button></th>
          <th><button type="button" data-submission-sort="strategyName">Strategy Name <i class="bi bi-arrow-down-up" aria-hidden="true"></i></button></th>
          <th>Apply On</th><th>Strategy Type</th>
          <th><button type="button" data-submission-sort="agentSelection">Agent Selected <i class="bi bi-arrow-down-up" aria-hidden="true"></i></button></th>
          <th>Docs</th><th>Actions</th>
        </tr></thead>
        <tbody>${rows.length ? rows.map(row => `<tr>
          <td><span class="adminSubmissionStatus${row.status === 'RUNNING' ? '' : ' is-muted'}"><i class="bi bi-play-fill" aria-hidden="true"></i>${escapeHtml(row.status)}</span></td>
          <td><span class="adminSubmissionStrategyName"><strong>${escapeHtml(row.strategyName)}</strong><small>${escapeHtml(row.strategySubtitle || '')}</small>${row.batchInvoicesInOneEmail ? `<small>Bulk email after ${escapeHtml(row.bulkSendAfterDays)} ${Number(row.bulkSendAfterDays) === 1 ? 'day' : 'days'} in Inebura</small>` : ''}</span></td>
          <td><span class="adminSubmissionApplyOn">${escapeHtml(row.applyOn)}</span></td>
          <td>${escapeHtml(row.strategyType)}</td>
          <td>${row.agentSelection ? 'Yes' : 'No'}</td>
          <td><span class="adminSubmissionDocs">${(row.selectedDocuments || []).length} DOCS</span></td>
          <td><span class="adminSubmissionRowActions"><button type="button" data-submission-action="edit" data-id="${escapeHtml(row.id)}"><i class="bi bi-pencil-square" aria-hidden="true"></i>Edit</button><button type="button" data-submission-action="delete" data-id="${escapeHtml(row.id)}"><i class="bi bi-trash3" aria-hidden="true"></i>Delete</button></span></td>
        </tr>`).join('') : '<tr><td class="adminSubmissionEmpty" colspan="7">No strategies found</td></tr>'}</tbody>
      </table></div>
    </section>`;
  }

  const closeModal = (discard = false) => {
    if (!discard && dirtyCheck() && !window.confirm('Discard your unsaved strategy changes?')) return;
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = '';
    dirtyCheck = () => false;
    if (returnFocus?.isConnected) returnFocus.focus();
  };
  const showModal = markup => {
    returnFocus = document.activeElement;
    modal.innerHTML = markup;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    (modal.querySelector('form input:not([type=checkbox])') || modal.querySelector('.adminModalClose'))?.focus();
  };

  function openForm(record = null) {
    const editing = Boolean(record);
    const selected = new Set(record?.selectedDocuments || []);
    const productCategories = [...new Set(['Services',...strategies.map(row => row.productCategory),record?.productCategory].filter(Boolean))];
    const otherStrategies = strategies.filter(row => row.id !== record?.id);
    const companyExists = otherStrategies.some(row => row.applyOn === 'COMPANY');
    const productExists = otherStrategies.some(row => row.applyOn === 'PRODUCT');
    const typeHint = type => type === 'Invoice + Docs(In 1 Shot)'
      ? 'This will share all the selected documents and invoice once all are uploaded.'
      : type === 'Invoice + Docs(Sequentially)'
        ? 'The invoice and selected documents will be shared as each is uploaded.'
        : 'Only the invoice will be shared when uploaded.';
    showModal(`<section class="adminModalCard adminSubmissionStrategyModal" role="dialog" aria-modal="true" aria-labelledby="submissionStrategyFormTitle">
      <header><h2 id="submissionStrategyFormTitle">${editing ? 'Edit' : 'Add'} Strategy</h2><button type="button" class="adminModalClose" data-submission-action="close-modal" aria-label="Close"><i class="bi bi-x-lg"></i></button></header>
      <form id="submissionStrategyForm">
        <div class="adminSubmissionStrategyFields">
          <label class="adminSubmissionFormField"><span>STRATEGY NAME <abbr title="Required">*</abbr></span><input name="strategyName" type="text" placeholder="e.g. Master Strategy" maxlength="100" required value="${escapeHtml(record?.strategyName || '')}" /></label>
          <label class="adminSubmissionFormField"><span>APPLY ON <abbr title="Required">*</abbr></span><select name="applyOn" required><option value="">Select...</option><option value="COMPANY" ${record?.applyOn === 'COMPANY' ? 'selected' : ''} ${productExists ? 'disabled' : ''}>Company-wide</option><option value="PRODUCT" ${record?.applyOn === 'PRODUCT' ? 'selected' : ''} ${companyExists ? 'disabled' : ''}>Product category</option></select><small>Choose one company-wide strategy or separate product-category strategies.</small></label>
          <div class="adminSubmissionProductField" ${record?.applyOn === 'PRODUCT' ? '' : 'hidden'}><label class="adminSubmissionFormField">PRODUCT CATEGORY <abbr title="Required for product strategy">*</abbr><select name="productCategory"><option value="">Select Product</option>${productCategories.map(value=>`<option value="${escapeHtml(value)}" ${record?.productCategory === value ? 'selected' : ''}>${escapeHtml(value)}</option>`).join('')}</select></label><button type="button" class="adminSecondary" data-submission-action="add-product"><i class="bi bi-plus-lg" aria-hidden="true"></i>Add New</button></div>
          <label class="adminSubmissionFormField adminSubmissionWide"><span>STRATEGY TYPE <abbr title="Required">*</abbr></span><select name="strategyType" required>${['Invoice','Invoice + Docs(In 1 Shot)','Invoice + Docs(Sequentially)'].map(type => `<option value="${escapeHtml(type)}" ${type === (record?.strategyType || 'Invoice') ? 'selected' : ''}>${escapeHtml(type)}</option>`).join('')}</select></label>
          <p class="adminSubmissionTypeHint" id="submissionTypeHint">${escapeHtml(typeHint(record?.strategyType || 'Invoice'))}</p>
          <label class="adminSubmissionFormField adminSubmissionWide"><span>CUSTOMER RECIPIENT LIST</span><input name="recipientList" type="text" value="${escapeHtml(record?.recipientList || '')}" placeholder="Optional — use invoice customer recipients" /><small>Separate bulk emails are prepared when the recipient list differs. Separate multiple addresses with commas.</small></label>
          <label class="adminSubmissionAgent"><input type="checkbox" name="agentSelection" ${record?.agentSelection ? 'checked' : ''} /><strong>Agent<br />Selection</strong><span>The agent can also select documents that should go with the strategy. Turning this on will allow manual agent selections.</span></label>
          <section class="adminSubmissionBulk" aria-labelledby="submissionBulkTitle">
            <label class="adminSubmissionBulkToggle"><input type="checkbox" name="batchInvoicesInOneEmail" ${record?.batchInvoicesInOneEmail ? 'checked' : ''} /><span><strong id="submissionBulkTitle">Submit multiple invoices in one email</strong><small>A customer batch goes at the next run when every invoice has its required documents, or after the configured wait. At the deadline, only document-complete invoices are sent; incomplete invoices remain pending.</small></span></label>
            <div class="adminSubmissionBulkDelay" ${record?.batchInvoicesInOneEmail ? '' : 'hidden'}><label class="adminSubmissionFormField" for="submissionBulkDays"><span>Bulk send after <abbr title="Required when bulk email is enabled">*</abbr></span><span class="adminSubmissionBulkInput"><input id="submissionBulkDays" name="bulkSendAfterDays" type="number" min="0" step="1" inputmode="numeric" value="${record?.batchInvoicesInOneEmail && Number.isInteger(Number(record.bulkSendAfterDays)) ? escapeHtml(record.bulkSendAfterDays) : ''}" /><span>days</span></span></label><small>Count from the earliest waiting invoice added to Inebura. New invoices do not restart the wait. At the deadline, send only invoices with all required documents tagged.</small></div>
          </section>
          <div class="adminSubmissionDocuments"><label class="adminSubmissionFormField" for="submissionDocumentSearch">SELECT DOCUMENTS</label><div class="adminSubmissionDocumentSearch"><i class="bi bi-search" aria-hidden="true"></i><input id="submissionDocumentSearch" type="search" placeholder="Search documents..." /></div>
            <div class="adminSubmissionDocumentList"><label class="adminSubmissionSelectAll"><input type="checkbox" id="submissionSelectAll" />SELECT ALL <span id="submissionSelectedCount">${selected.size} selected</span></label><div id="submissionDocumentOptions">${documentNames.map(name => `<label data-document-name="${escapeHtml(name)}"><input type="checkbox" value="${escapeHtml(name)}" ${selected.has(name) ? 'checked' : ''} />${escapeHtml(name)}</label>`).join('')}</div></div>
          </div>
        </div>
      </form>
      <p id="submissionStrategyError" class="adminSubmissionFormError" role="alert"></p><footer><button type="button" class="adminSecondary" data-submission-action="close-modal">Cancel</button><span class="adminSubmissionModalActions">${editing ? `<button type="button" class="adminSubmissionPause" data-submission-action="toggle-status">${record.status === 'RUNNING' ? 'Pause' : 'Resume'} Strategy</button>` : ''}<button type="submit" form="submissionStrategyForm" class="adminPrimary">${editing ? 'Save Changes' : 'Create Strategy'}</button></span></footer>
    </section>`);

    const form = modal.querySelector('#submissionStrategyForm');
    const snapshot = () => JSON.stringify([...new FormData(form)]);
    const documentInputs = [...form.querySelectorAll('#submissionDocumentOptions input')];
    const all = form.querySelector('#submissionSelectAll');
    const syncCount = () => {
      const count = documentInputs.filter(input => input.checked).length;
      form.querySelector('#submissionSelectedCount').textContent = `${count} selected`;
      all.checked = count === documentInputs.length;
      all.indeterminate = count > 0 && count < documentInputs.length;
    };
    syncCount();
    form.elements.applyOn.addEventListener('change', () => { const product = form.elements.applyOn.value === 'PRODUCT'; form.querySelector('.adminSubmissionProductField').hidden = !product; form.elements.productCategory.required = product; });
    form.elements.productCategory.required = record?.applyOn === 'PRODUCT';
    form.elements.strategyType.addEventListener('change', () => { form.querySelector('#submissionTypeHint').textContent = typeHint(form.elements.strategyType.value); });
    const syncBulkDelay = () => {
      const enabled = form.elements.batchInvoicesInOneEmail.checked;
      form.elements.bulkSendAfterDays.disabled = !enabled;
      form.elements.bulkSendAfterDays.required = enabled;
      form.querySelector('.adminSubmissionBulkDelay').hidden = !enabled;
      const sequential = [...form.elements.strategyType.options].find(option => option.value === 'Invoice + Docs(Sequentially)');
      if (sequential) sequential.disabled = enabled;
      if (enabled && form.elements.strategyType.value === 'Invoice + Docs(Sequentially)') {
        form.elements.strategyType.value = 'Invoice + Docs(In 1 Shot)';
        form.querySelector('#submissionTypeHint').textContent = 'Bulk email waits until all selected documents are uploaded.';
      }
    };
    form.elements.batchInvoicesInOneEmail.addEventListener('change', syncBulkDelay);
    syncBulkDelay();
    const original = snapshot();
    dirtyCheck = () => snapshot() !== original;
    form.querySelector('#submissionDocumentSearch').addEventListener('input', event => {
      const term = event.target.value.trim().toLowerCase();
      form.querySelectorAll('#submissionDocumentOptions label').forEach(label => { label.hidden = !label.dataset.documentName.toLowerCase().includes(term); });
    });
    all.addEventListener('change', () => { documentInputs.forEach(input => { input.checked = all.checked; }); syncCount(); });
    documentInputs.forEach(input => input.addEventListener('change', syncCount));
    form.addEventListener('submit', event => {
      event.preventDefault();
      if (!form.reportValidity()) return;
      const name = form.elements.strategyName.value.trim();
      if (!name) { form.elements.strategyName.focus(); return; }
      const applyOn = form.elements.applyOn.value;
      const selectedDocuments = documentInputs.filter(input => input.checked).map(input => input.value);
      const batchInvoicesInOneEmail = form.elements.batchInvoicesInOneEmail.checked;
      const next = {id: record?.id || `submission-${Date.now()}`,status: record?.status || 'RUNNING',strategyName:name,strategySubtitle:applyOn === 'PRODUCT' ? form.elements.productCategory.value : 'Xeon Infraservices Pvt Ltd',applyOn,strategyType:form.elements.strategyType.value,agentSelection:form.elements.agentSelection.checked,batchInvoicesInOneEmail,bulkSendAfterDays:batchInvoicesInOneEmail ? Number(form.elements.bulkSendAfterDays.value) : null,productCategory:applyOn === 'PRODUCT' ? form.elements.productCategory.value : '',recipientList:form.elements.recipientList.value.trim(),selectedDocuments,documents:[`${selectedDocuments.length} DOCS`]};
      const error = strategyRules.validate(strategies,next);
      if (error) { form.querySelector('#submissionStrategyError').textContent = error; return; }
      if (editing && !confirmStrategyChange(record)) return;
      if (editing) strategies = strategies.map(item => item.id === record.id ? next : item);
      else strategies.push(next);
      save(); if (editing) recordStrategyChange(record); closeModal(true); render(); notify(editing ? 'Strategy updated. Pending invoices now follow the new rule.' : 'Strategy created in this preview.');
    });
    modal.querySelector('[data-submission-action="toggle-status"]')?.addEventListener('click', () => {
      if (dirtyCheck() && !window.confirm('Discard your unsaved edits and change the strategy status?')) return;
      if (!confirmStrategyChange(record)) return;
      const nextStatus = record.status === 'RUNNING' ? 'PAUSED' : 'RUNNING';
      strategies = strategies.map(item => item.id === record.id ? {...item,status:nextStatus} : item);
      save(); recordStrategyChange(record); closeModal(true); render(); notify(`Strategy ${nextStatus.toLowerCase()} in this preview.`);
    });
    modal.querySelector('[data-submission-action="add-product"]').addEventListener('click', () => {
      const field = form.querySelector('.adminSubmissionProductField');
      const current = field.querySelector('.adminSubmissionNewProduct');
      if (current) { current.focus(); return; }
      field.insertAdjacentHTML('beforeend', '<input class="adminSubmissionNewProduct" type="text" placeholder="New product category" aria-label="New product category" maxlength="60" />');
      const input = field.querySelector('.adminSubmissionNewProduct');
      input.focus();
      input.addEventListener('change', () => {
        const name = input.value.trim();
        if (!name) return;
        const option = new Option(name, name, true, true);
        form.elements.productCategory.add(option);
        input.remove();
      });
    });
  }

  function openDelete(record) {
    showModal(`<section class="adminModalCard adminSubmissionDeleteModal" role="dialog" aria-modal="true" aria-labelledby="submissionDeleteTitle"><header><h2 id="submissionDeleteTitle">Delete Strategy</h2><button type="button" class="adminModalClose" data-submission-action="close-modal" aria-label="Close"><i class="bi bi-x-lg"></i></button></header><p>Delete <strong>${escapeHtml(record.strategyName)}</strong> from this preview?</p><footer><button type="button" class="adminSecondary" data-submission-action="close-modal">Cancel</button><button type="button" class="adminSubmissionDeleteButton" data-submission-action="confirm-delete" data-id="${escapeHtml(record.id)}">Delete</button></footer></section>`);
  }
  function openPreview() {
    try {
      const C=window.SubmissionJourney;
      const state=C.load(localStorage);
      const issues=C.readIssues(localStorage);
      const attachments=C.issueAttachments(issues);
      let master=[];
      try { master=JSON.parse(localStorage.getItem('ineburaAdminInvoiceMaster:v1')||'[]'); } catch (_) { master=[]; }
      if (!Array.isArray(master)) master=[];
      state.invoices.forEach(invoice=>{const row=master.find(item=>String(item?.fields?.['Invoice No']||'')===String(invoice.invoiceNo)&&String(item.fields['Customer Code']||'')===String(invoice.code));if(row?.fields?.['Product Category'])invoice.productCategory=row.fields['Product Category'];});
      state.invoices.forEach(invoice => { invoice.effectiveRequirements=strategyRules.requirements(invoice,strategyRules.resolve(invoice,strategies)); });
      const now=new Date(), parts=Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(part=>[part.type,part.value]));
      let run=new Date(`${parts.year}-${parts.month}-${parts.day}T18:00:00+05:30`);
      if (run <= now) run=new Date(run.getTime()+86400000);
      const plan=strategyRules.plan(state,strategies,C,attachments,run);
      const waiting=[...plan.decisions.values()].filter(item=>!item.ready&&item.reason!=='Already submitted').reduce((counts,item)=>{counts[item.reason]=(counts[item.reason]||0)+1;return counts;},{});
      const schedule=new Intl.DateTimeFormat('en-IN',{timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'}).format(run);
      const batches=plan.batches.map(batch=>`<tr><td>${escapeHtml(batch.customer)}<small>${escapeHtml(batch.customerCode)}</small></td><td>${escapeHtml(batch.strategyName)}</td><td>${escapeHtml(batch.recipients.join(', '))}</td><td>${escapeHtml(batch.invoices.join(', '))}</td></tr>`).join('');
      showModal(`<section class="adminModalCard adminSubmissionStrategyModal adminSubmissionPreview" role="dialog" aria-modal="true" aria-labelledby="submissionPreviewTitle"><header><h2 id="submissionPreviewTitle">Next submission run</h2><button type="button" class="adminModalClose" data-submission-action="close-modal" aria-label="Close"><i class="bi bi-x-lg"></i></button></header><div class="adminSubmissionPreviewBody"><p><strong>${escapeHtml(schedule)} IST</strong> · ${plan.batches.length} email batch${plan.batches.length===1?'':'es'} · ${plan.batches.reduce((total,batch)=>total+batch.invoices.length,0)} eligible invoices</p><p>This is a plan only. No email is sent from this preview.</p><div class="adminSubmissionStrategyTableWrap"><table class="adminSubmissionStrategyTable"><thead><tr><th>Customer</th><th>Strategy</th><th>Recipient list</th><th>Invoices</th></tr></thead><tbody>${batches||'<tr><td colspan="4">No invoice is eligible for this run.</td></tr>'}</tbody></table></div><h3>Waiting or blocked</h3><ul>${Object.entries(waiting).map(([reason,count])=>`<li>${escapeHtml(reason)}: ${count} invoice${count===1?'':'s'}</li>`).join('')||'<li>None</li>'}</ul></div><footer><button type="button" class="adminSecondary" data-submission-action="close-modal">Close</button></footer></section>`);
    } catch (error) { notify(error.message || 'Could not prepare the run preview.'); }
  }

  body.addEventListener('click', event => {
    const sort = event.target.closest('[data-submission-sort]');
    if (sort) { const next = sort.dataset.submissionSort; sortDirection = sortKey === next ? -sortDirection : 1; sortKey = next; render(); return; }
    const button = event.target.closest('[data-submission-action]');
    if (!button) return;
    if (button.dataset.submissionAction === 'create') openForm();
    if (button.dataset.submissionAction === 'preview') openPreview();
    const record = strategies.find(item => item.id === button.dataset.id);
    if (button.dataset.submissionAction === 'edit' && record) openForm(record);
    if (button.dataset.submissionAction === 'delete' && record) openDelete(record);
  });
  modal.addEventListener('click', event => {
    if (event.target === modal) { closeModal(); return; }
    const button = event.target.closest('[data-submission-action]');
    if (!button) return;
    if (button.dataset.submissionAction === 'close-modal') closeModal();
    if (button.dataset.submissionAction === 'confirm-delete') {
      const record=strategies.find(item=>item.id===button.dataset.id);
      if (record && !confirmStrategyChange(record)) return;
      strategies = strategies.filter(item => item.id !== button.dataset.id);
      save(); if(record) recordStrategyChange(record); closeModal(); render(); notify('Strategy deleted from this preview.');
    }
  });
  document.addEventListener('keydown', event => {
    if (event.key !== 'Escape' || !modal.classList.contains('is-open') || !dirtyCheck()) return;
    event.preventDefault(); event.stopImmediatePropagation();
    closeModal();
  }, true);
  render();
})();
