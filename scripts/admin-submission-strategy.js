/* Local, live-aligned Strategy Manager preview. No Xeon data is changed. */
(() => {
  'use strict';
  const page = window.IneburaAdminPage;
  if (page?.module !== 'submission-process' || page.view) return;
  const body = document.querySelector('.adminRuntimePage[data-admin-module="submission-process"] .adminWorkspaceBody');
  const modal = document.getElementById('adminModal');
  const previewStorage = window.IneburaAdminPreviewStorage;
  if (!body || !modal || !previewStorage) return;

  const key = 'submissionStrategies:v1';
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
  const save = () => previewStorage.setItem(key, JSON.stringify(strategies));
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
        <button class="adminPrimary" type="button" data-submission-action="create"><i class="bi bi-plus-circle" aria-hidden="true"></i>Create New</button>
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
          <td><span class="adminSubmissionStrategyName"><strong>${escapeHtml(row.strategyName)}</strong><small>${escapeHtml(row.strategySubtitle || '')}</small></span></td>
          <td><span class="adminSubmissionApplyOn">${escapeHtml(row.applyOn)}</span></td>
          <td>${escapeHtml(row.strategyType)}</td>
          <td>${row.agentSelection ? 'Yes' : 'No'}</td>
          <td><span class="adminSubmissionDocs">${(row.selectedDocuments || []).length} DOCS</span></td>
          <td><span class="adminSubmissionRowActions"><button type="button" data-submission-action="edit" data-id="${escapeHtml(row.id)}"><i class="bi bi-pencil-square" aria-hidden="true"></i>Edit</button><button type="button" data-submission-action="delete" data-id="${escapeHtml(row.id)}"><i class="bi bi-trash3" aria-hidden="true"></i>Delete</button></span></td>
        </tr>`).join('') : '<tr><td class="adminSubmissionEmpty" colspan="7">No strategies found</td></tr>'}</tbody>
      </table></div>
    </section>`;
  }

  const closeModal = () => {
    modal.classList.remove('is-open');
    modal.setAttribute('aria-hidden', 'true');
    modal.innerHTML = '';
    if (returnFocus?.isConnected) returnFocus.focus();
  };
  const showModal = markup => {
    returnFocus = document.activeElement;
    modal.innerHTML = markup;
    modal.classList.add('is-open');
    modal.setAttribute('aria-hidden', 'false');
    modal.querySelector('form input:not([type=checkbox])')?.focus();
  };

  function openForm(record = null) {
    const editing = Boolean(record);
    const selected = new Set(record?.selectedDocuments || []);
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
          <label class="adminSubmissionFormField"><span>APPLY ON <abbr title="Required">*</abbr></span><select name="applyOn" required><option value="">Select...</option><option value="COMPANY" ${record?.applyOn === 'COMPANY' ? 'selected' : ''}>Company</option><option value="PRODUCT" ${record?.applyOn === 'PRODUCT' ? 'selected' : ''}>Product</option></select></label>
          <div class="adminSubmissionProductField" ${record?.applyOn === 'PRODUCT' ? '' : 'hidden'}><label class="adminSubmissionFormField">PRODUCT CATEGORY<select name="productCategory"><option value="">Select Product</option><option value="Services" ${record?.productCategory === 'Services' ? 'selected' : ''}>Services</option></select></label><button type="button" class="adminSecondary" data-submission-action="add-product"><i class="bi bi-plus-lg" aria-hidden="true"></i>Add New</button></div>
          <label class="adminSubmissionFormField adminSubmissionWide"><span>STRATEGY TYPE <abbr title="Required">*</abbr></span><select name="strategyType" required>${['Invoice','Invoice + Docs(In 1 Shot)','Invoice + Docs(Sequentially)'].map(type => `<option value="${escapeHtml(type)}" ${type === (record?.strategyType || 'Invoice') ? 'selected' : ''}>${escapeHtml(type)}</option>`).join('')}</select></label>
          <p class="adminSubmissionTypeHint" id="submissionTypeHint">${escapeHtml(typeHint(record?.strategyType || 'Invoice'))}</p>
          <label class="adminSubmissionAgent"><input type="checkbox" name="agentSelection" ${record?.agentSelection ? 'checked' : ''} /><strong>Agent<br />Selection</strong><span>The agent can also select documents that should go with the strategy. Turning this on will allow manual agent selections.</span></label>
          <div class="adminSubmissionDocuments"><label class="adminSubmissionFormField" for="submissionDocumentSearch">SELECT DOCUMENTS</label><div class="adminSubmissionDocumentSearch"><i class="bi bi-search" aria-hidden="true"></i><input id="submissionDocumentSearch" type="search" placeholder="Search documents..." /></div>
            <div class="adminSubmissionDocumentList"><label class="adminSubmissionSelectAll"><input type="checkbox" id="submissionSelectAll" />SELECT ALL <span id="submissionSelectedCount">${selected.size} selected</span></label><div id="submissionDocumentOptions">${documentNames.map(name => `<label data-document-name="${escapeHtml(name)}"><input type="checkbox" value="${escapeHtml(name)}" ${selected.has(name) ? 'checked' : ''} />${escapeHtml(name)}</label>`).join('')}</div></div>
          </div>
        </div>
      </form>
      <footer><button type="button" class="adminSecondary" data-submission-action="close-modal">Cancel</button><span class="adminSubmissionModalActions">${editing ? `<button type="button" class="adminSubmissionPause" data-submission-action="toggle-status">${record.status === 'RUNNING' ? 'Pause' : 'Resume'} Strategy</button>` : ''}<button type="submit" form="submissionStrategyForm" class="adminPrimary">${editing ? 'Save Changes' : 'Create Strategy'}</button></span></footer>
    </section>`);

    const form = modal.querySelector('#submissionStrategyForm');
    const documentInputs = [...form.querySelectorAll('#submissionDocumentOptions input')];
    const all = form.querySelector('#submissionSelectAll');
    const syncCount = () => {
      const count = documentInputs.filter(input => input.checked).length;
      form.querySelector('#submissionSelectedCount').textContent = `${count} selected`;
      all.checked = count === documentInputs.length;
      all.indeterminate = count > 0 && count < documentInputs.length;
    };
    syncCount();
    form.elements.applyOn.addEventListener('change', () => { form.querySelector('.adminSubmissionProductField').hidden = form.elements.applyOn.value !== 'PRODUCT'; });
    form.elements.strategyType.addEventListener('change', () => { form.querySelector('#submissionTypeHint').textContent = typeHint(form.elements.strategyType.value); });
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
      const next = {id: record?.id || `submission-${Date.now()}`,status: record?.status || 'RUNNING',strategyName:name,strategySubtitle:applyOn === 'PRODUCT' ? (form.elements.productCategory.value || 'Product') : 'Xeon Infraservices Pvt Ltd',applyOn,strategyType:form.elements.strategyType.value,agentSelection:form.elements.agentSelection.checked,productCategory:form.elements.productCategory.value,selectedDocuments,documents:[`${selectedDocuments.length} DOCS`]};
      if (editing) strategies = strategies.map(item => item.id === record.id ? next : item);
      else strategies.push(next);
      save(); closeModal(); render(); notify(editing ? 'Strategy updated in this preview.' : 'Strategy created in this preview.');
    });
    modal.querySelector('[data-submission-action="toggle-status"]')?.addEventListener('click', () => {
      const nextStatus = record.status === 'RUNNING' ? 'PAUSED' : 'RUNNING';
      strategies = strategies.map(item => item.id === record.id ? {...item,status:nextStatus} : item);
      save(); closeModal(); render(); notify(`Strategy ${nextStatus.toLowerCase()} in this preview.`);
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

  body.addEventListener('click', event => {
    const sort = event.target.closest('[data-submission-sort]');
    if (sort) { const next = sort.dataset.submissionSort; sortDirection = sortKey === next ? -sortDirection : 1; sortKey = next; render(); return; }
    const button = event.target.closest('[data-submission-action]');
    if (!button) return;
    if (button.dataset.submissionAction === 'create') openForm();
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
      strategies = strategies.filter(item => item.id !== button.dataset.id);
      save(); closeModal(); render(); notify('Strategy deleted from this preview.');
    }
  });
  render();
})();
