/* Interactive submission review prototype; no live submission or email calls. */
(() => {
  'use strict';
  const C = window.SubmissionJourney, S = window.SubmissionStrategy, $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[char]));
  const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
  const date = value => { const key = C.keyDate(value); return /^\d{4}-\d{2}-\d{2}$/.test(key) ? key.split('-').reverse().join('-') : 'Not available'; };
  const timestamp = value => Number.isFinite(Date.parse(value)) ? new Intl.DateTimeFormat('en-IN', { timeZone:'Asia/Kolkata',day:'2-digit',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit' }).format(new Date(value)) : 'Not available';
  const duration = value => value === null ? 'Not available' : `${value} day${value === 1 ? '' : 's'}`;
  const submissionSource = invoice => invoice.submissionStatus === 'External Submission' || (invoice.submissionMedium || invoice.method) === 'External' ? 'external' : (invoice.submissionMedium || invoice.method) === 'Manual' ? 'manual' : (invoice.submissionMedium || invoice.method) === 'Automated' ? 'automated' : 'unspecified';
  const submissionMedium = invoice => !C.submitted(invoice) ? invoice.submissionMedium === 'Manual' && invoice.reason ? 'Manual' : '—' : ({ automated:'Automated',manual:'Manual',external:'External' }[submissionSource(invoice)] || 'Not recorded');
  const firstRecorded = (...values) => {
    const found=values.find(value => value != null && String(value).trim() !== '');
    return found === undefined ? '' : found;
  };
  function invoiceMasterDetails(invoice) {
    try {
      const records=JSON.parse(localStorage.getItem('ineburaAdminInvoiceMaster:v1')||'[]');
      return Array.isArray(records)?records.find(record=>String(record?.fields?.['Invoice No']||'')===String(invoice.invoiceNo)&&String(record.fields['Customer Code']||'')===String(invoice.code))||null:null;
    } catch (_) { return null; }
  }
  function invoiceOverviewHTML(invoice, done) {
    const master=invoiceMasterDetails(invoice), fields=master?.fields||{};
    const cell=(label,value,empty='Not recorded')=>{const display=firstRecorded(value)===''?empty:value;return `<div><dt>${esc(label)}</dt><dd${display==='Not recorded'||display==='—'?' class="sjMissingValue"':''}>${esc(display)}</dd></div>`;};
    const subclients=firstRecorded(invoice.subClients,invoice.subclients,invoice.subClient,invoice.subclient,fields['Sub Clients'],fields['Sub Client']);
    const subclientNames=Array.isArray(subclients)?subclients.map(item=>typeof item==='string'?item:item?.name||item?.code).filter(Boolean).join(', '):subclients;
    const poDate=firstRecorded(invoice.poDate,fields['PO Date']);
    const poValue=firstRecorded(invoice.poValue,fields['PO Value']);
    const ownership=[['Agent',firstRecorded(invoice.agent,invoice.assignee,master?.agent)],['Manager',firstRecorded(invoice.manager,master?.manager)],['KAM',firstRecorded(invoice.kam,master?.kam)],['KAS',firstRecorded(invoice.kas,master?.kas)]];
    const order=[['Business unit',firstRecorded(invoice.businessUnit,fields['Business Unit'])],['Profit center',firstRecorded(invoice.profitCenter,fields['Profit Center'])],['PO number',firstRecorded(invoice.poNumber,invoice.purchaseOrderNumber,fields['PO Number'])],['Sales order (SO)',firstRecorded(invoice.salesOrderNumber,invoice.saleOrder,invoice.soNumber,fields['Sales Order Number'])]];
    if(poDate)order.push(['PO date',date(poDate)]);
    if(poValue)order.push(['PO value',money(poValue)]);
    if(subclientNames)order.push(['Sub-clients',subclientNames]);
    const firstSubmission=invoice.firstSubmittedAt||invoice.submissionDate?date(invoice.firstSubmittedAt||invoice.submissionDate):done&&submissionSource(invoice)==='external'?'Submitted externally · date not recorded':'Not submitted yet';
    const submission=[['Source',invoice.source],['Created in Inebura',date(invoice.createdAt)],['Documents ready',invoice.documentsReadyAt?date(invoice.documentsReadyAt):'Not recorded'],['First recorded submission',firstSubmission],['Update recorded on',invoice.submissionRecordedAt?timestamp(invoice.submissionRecordedAt):'Not recorded'],['Submission medium',submissionMedium(invoice)],['Submission sub-status',done?invoice.submissionSubStatus||(submissionSource(invoice)==='external'?'—':'Not recorded'):'—'],['Submission destination',done?invoice.submissionDestination||(submissionSource(invoice)==='external'?'—':'Not recorded'):'—']];
    const age=C.days(invoice.invoiceDate,done?invoice.firstSubmittedAt||invoice.submissionDate:C.today());
    return `<section class="sjInvoiceOverview" aria-label="Invoice and submission details"><dl class="sjDetailFacts"><div><dt>Invoice value</dt><dd>${money(invoice.value)}</dd></div><div><dt>Invoice date</dt><dd>${date(invoice.invoiceDate)}</dd></div><div><dt>Due date</dt><dd>${date(invoice.dueDate)}</dd></div><div><dt>Invoice aging</dt><dd>${duration(age)}</dd></div></dl><div class="sjOverviewSections"><section class="sjOverviewGroup"><h3>Ownership</h3><dl class="sjOverviewGrid">${ownership.map(([label,value])=>cell(label,value)).join('')}</dl></section><section class="sjOverviewGroup"><h3>Order &amp; organisation</h3><dl class="sjOverviewGrid">${order.map(([label,value])=>cell(label,value)).join('')}</dl></section><section class="sjOverviewGroup sjOverviewGroup--submission"><h3>Submission record</h3><dl class="sjOverviewGrid">${submission.map(([label,value])=>cell(label,value)).join('')}</dl></section></div></section>`;
  }
  function automationSummary(count, enabled, now = new Date()) {
    if (!enabled) return 'Automatic submission is disabled';
    if (!count) return 'No invoices scheduled for submission';
    // Demo schedule agreed for this prototype: daily at 18:00 IST.
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit' }).formatToParts(now).map(part => [part.type,part.value]));
    let next = new Date(`${parts.year}-${parts.month}-${parts.day}T18:00:00+05:30`);
    if (next <= now) next = new Date(next.getTime() + 86400000);
    const runDate = new Intl.DateTimeFormat('en-GB', { timeZone:'Asia/Kolkata',day:'2-digit',month:'2-digit',year:'numeric' }).format(next);
    const runTime = new Intl.DateTimeFormat('en-US', { timeZone:'Asia/Kolkata',hour:'2-digit',minute:'2-digit',hour12:true }).format(next);
    return `${count} invoice${count === 1 ? '' : 's'} will be submitted at ${runTime}, ${runDate}`;
  }
  const pill = (text, tone = '') => `<span class="sjPill ${tone}">${esc(text)}</span>`;
  let state, issues = [], groups = [], attachments = [], strategies = [], view = 'all', selectedInvoice = '', timelineFilter = '', page = 1, sort = 'impact', direction = -1;
  let reviewKeys = [], deferKeys = [], manualIds = [], inlineManualInvoice = '', manualSnapshot = '', selected = new Set(), returnFocus = null;
  let invoiceFrom = '', invoiceTo = '', draftFrom = '', draftTo = '', rangeMonth;
  const currentUser = () => { const config = window.IssueTrackerConfig; const user = localStorage.getItem('issue_tracker_active_user_agent') || localStorage.getItem('activeUserName'); return config.roleOf(user) === 'agent' ? user : config.defaultUser('agent'); };
  const activeRole = () => { const config=window.IssueTrackerConfig; const user=localStorage.getItem('activeUserName') || localStorage.getItem('issue_tracker_active_user_agent') || config.defaultUser('agent'); return config.roleOf(user); };
  const notice = (text, error = false, html = false) => { $('sjNotice').hidden = false; $('sjNotice').classList.toggle('error', error); html ? $('sjNotice').innerHTML = text : $('sjNotice').textContent = text; };
  const persist = next => { C.transaction(localStorage, { [C.KEY]: next }); state = next; };
  function refresh() {
    state = C.load(localStorage);
    strategies = S.read(localStorage,S.defaultStrategies);
    issues = C.readIssues(localStorage); attachments = C.issueAttachments(issues);
    const next = C.clone(state), custom = JSON.parse(localStorage.getItem('customIssues') || '[]');
    const requests = JSON.parse(localStorage.getItem('approval_requests') || '[]');
    const requirementsChanged = next.invoices.reduce((changed, invoice) => {
      const masterCategory=invoiceMasterDetails(invoice)?.fields?.['Product Category'];
      if (masterCategory && invoice.productCategory !== masterCategory) { invoice.productCategory=masterCategory; changed=true; }
      const strategy = S.resolve(invoice,strategies);
      const required = S.requirements(invoice,strategy);
      if (JSON.stringify(invoice.effectiveRequirements || []) === JSON.stringify(required)) return changed;
      invoice.effectiveRequirements = required; return true;
    },false);
    const changed = C.reconcileIssues(next, custom, attachments);
    const approvalsChanged = C.reconcileApprovalRequests(custom,requests);
    const observed = C.observe(next, issues, C.today(), attachments);
    if (requirementsChanged || changed || approvalsChanged || observed || !localStorage.getItem(C.KEY)) {
      C.transaction(localStorage, { [C.KEY]: next, ...(changed ? { customIssues: custom } : {}), ...(approvalsChanged ? { approval_requests: requests } : {}) }); state = next;
      issues = C.readIssues(localStorage); attachments = C.issueAttachments(issues);
    }
    groups = C.blockers(state, issues, C.today(), attachments);
  }
  const issueURL = issue => `issuetrackerdetail.html?${new URLSearchParams({ invoice: issue.invoiceNo, issue: issue.id, role:'agent',user:currentUser() })}`;
  const invoiceGroups = invoice => groups.filter(group => group.invoices.some(row => row.invoiceNo === invoice.invoiceNo));
  const reviewInvoiceNos = () => new Set(groups.filter(group => group.eligible).flatMap(group => group.qualifying.map(invoice => invoice.invoiceNo)));
  const reviewGroupsForInvoice = invoice => invoiceGroups(invoice).filter(group => group.eligible && group.qualifying.some(row => row.invoiceNo === invoice.invoiceNo));
  const invoiceIssues = invoice => C.linkedIssues(issues, invoice).filter(issue=>C.agentCanView(issue,currentUser()));
  const openSubmissionIssues = () => issues.filter(issue => issue.source === 'submission-module' && !C.closed(issue));
  const awaitingApproval = issue => {
    const step = String(issue.workflowStep || '');
    if (['manager-review','reopen-manager-review'].includes(step) || step.startsWith('approver-l')) return true;
    if (step) return false;
    return String(issue.managerApprovalStatus || '').toLowerCase() === 'pending' || String(issue.matrixApprovalStatus || issue.approvalStatus || '').toLowerCase() === 'pending';
  };
  const awaitingDocuments = invoice => !C.submitted(invoice) && C.missing(state,invoice,attachments).length > 0;
  const nextRun = (now = new Date()) => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(now).map(part=>[part.type,part.value]));
    let run = new Date(`${parts.year}-${parts.month}-${parts.day}T18:00:00+05:30`);
    if (run <= now) run = new Date(run.getTime()+86400000);
    return run;
  };
  const nextPlan = () => S.plan(state,strategies,C,attachments,nextRun());
  const decisionFor = invoice => S.assessment(state,invoice,S.resolve(invoice,strategies),C,attachments,nextRun());
  const groupState = group => group.issue ? 'linked' : group.deferred ? 'deferred' : group.eligible ? 'eligible' : 'waiting';
  function groupStateHTML(group) {
    if (group.issue) return `${pill('Issue raised','blue')}<small>${C.agentCanView(group.issue,currentUser())?esc(group.issue.id):'Covered by an existing issue'}</small>`;
    if (group.deferred) return `${pill('Deferred','gray')}<small>Review ${date(group.review.until)} · ${esc(group.review.by)}</small>`;
    if (group.eligible) return `${pill(group.previousIssue ? 'Review recurrence' : 'Needs review','amber')}<small>${esc(group.trigger)}</small>`;
    return `${pill('Waiting','gray')}<small>Not yet due for review</small>`;
  }
  function filteredRows() {
    const query = $('sjSearch').value.trim().toLowerCase(), reason = $('sjReason').value, review = $('sjReviewFilter').value;
    const from = invoiceFrom, to = invoiceTo;
    const matchInvoice = invoice => (!reason || (reason === 'ready' ? decisionFor(invoice).ready : reason === 'Docs Pending' ? invoice.reason === reason || awaitingDocuments(invoice) : invoice.reason === reason)) && (!from || C.keyDate(invoice.invoiceDate) >= from) && (!to || C.keyDate(invoice.invoiceDate) <= to);
    const reviewNos = view === 'review' ? reviewInvoiceNos() : null;
    const linkedIssues = review === 'linked' ? openSubmissionIssues() : [];
    const rows = state.invoices.filter(invoice => (view === 'all' || C.submitted(invoice) === (view === 'submitted')) && (!reviewNos || reviewNos.has(invoice.invoiceNo)) && matchInvoice(invoice) && (!review || (review === 'documents' ? awaitingDocuments(invoice) : review === 'linked' ? linkedIssues.some(issue => C.issueAffects(issue,invoice)) : (view === 'review' ? reviewGroupsForInvoice(invoice) : invoiceGroups(invoice)).some(group => groupState(group) === review))) && (!query || [invoice.invoiceNo,invoice.code,invoice.name,invoice.reason,invoice.submissionStatus,invoice.submissionSubStatus,submissionMedium(invoice),...C.requirements(invoice).map(req => req.name)].join(' ').toLowerCase().includes(query)));
    const value = row => sort === 'age' ? C.days(row.invoiceDate, C.submitted(row) ? row.firstSubmittedAt || row.submissionDate : C.today()) ?? -1 : sort === 'name' ? row.name : sort === 'code' ? row.code : sort === 'impact' ? row.value : row.invoiceNo;
    return rows.sort((a,b) => typeof value(a) === 'number' ? (value(a) - value(b)) * direction : String(value(a)).localeCompare(String(value(b)),undefined,{numeric:true}) * direction);
  }
  function impactHTML(invoices, qualifying) {
    return `<details class="sjImpact"><summary>${invoices.length} invoice${invoices.length === 1 ? '' : 's'} affected${qualifying == null ? '' : ` · ${qualifying} meet the rule`}</summary><div class="sjImpactList">${invoices.map(invoice => `<div><button type="button" class="sjLink" data-invoice="${esc(invoice.invoiceNo)}">${esc(invoice.invoiceNo)}</button><span>${date(invoice.invoiceDate)}</span><span>${money(invoice.value)}</span></div>`).join('')}</div></details>`;
  }
  function render() {
    if (!selectedInvoice) { restoreManualDialog(); inlineManualInvoice = ''; }
    const pending = state.invoices.filter(row => !C.submitted(row)), ready = nextPlan().batches.flatMap(batch => batch.invoices);
    const submitted = state.invoices.filter(C.submitted);
    const submissionCounts = submitted.reduce((counts, invoice) => { counts[submissionSource(invoice)]++; return counts; }, { manual:0, automated:0, external:0, unspecified:0 });
    const submissionSummary = `Manual: ${submissionCounts.manual} · Automated: ${submissionCounts.automated} · Externally submitted: ${submissionCounts.external}${submissionCounts.unspecified ? ` · Unspecified: ${submissionCounts.unspecified}` : ''}`;
    const reviewInvoiceCount = reviewInvoiceNos().size;
    const open = openSubmissionIssues().filter(issue => state.invoices.some(invoice => C.issueAffects(issue,invoice)));
    const approvalCount = open.filter(awaitingApproval).length;
    const awaiting = pending.filter(awaitingDocuments), awaitingCustomers = new Set(awaiting.map(invoice => invoice.code || invoice.name).filter(Boolean));
    $('sjSummary').innerHTML = [
      ['Not Submitted',pending.length,automationSummary(ready.length,state.settings.autoSubmission),'bi-hourglass-split','pending'],
      ['Needs Review',reviewInvoiceCount,`${pending.length} not submitted invoice${pending.length === 1 ? '' : 's'}`,'bi-clipboard-check','review'],
      ['Submitted',submitted.length,submissionSummary,'bi-check2-circle','submitted'],
      ['Open Issues',open.length,`${approvalCount} issue${approvalCount === 1 ? '' : 's'} ${approvalCount === 1 ? 'awaits approval' : 'await approvals'}`,'bi-link-45deg','issues'],
      ['Awaiting for documents',awaiting.length,`${awaitingCustomers.size} customer${awaitingCustomers.size === 1 ? '' : 's'} ${awaitingCustomers.size === 1 ? 'is' : 'are'} awaiting documents to submit`,'bi-file-earmark-text','documents']
    ].map(([label,value,hint,icon,target]) => {
      const unit = target === 'issues' ? `issue${value === 1 ? '' : 's'}` : `invoice${value === 1 ? '' : 's'}`;
      return `<button type="button" class="sjStat" data-summary="${target}"><span><span class="sjStatLabel">${label}</span><strong>${value} <span class="sjStatUnit">${unit}</span></strong><small>${hint}</small></span><i class="bi ${icon}" aria-hidden="true"></i></button>`;
    }).join('');
    $('sjAllCount').textContent = state.invoices.length; $('sjReviewCount').textContent = reviewInvoiceCount; $('sjPendingCount').textContent = pending.length; $('sjPendingAllCount').textContent = pending.length; $('sjSubmittedCount').textContent = submitted.length;
    $('sjOverviewHeader').hidden = Boolean(selectedInvoice); $('sjSummary').hidden = Boolean(selectedInvoice);
    $('sjList').hidden = Boolean(selectedInvoice); $('sjDetail').hidden = !selectedInvoice;
    if (selectedInvoice) { renderDetail(); return; }
    const parentView = view === 'review' ? 'pending' : view;
    document.querySelectorAll('[data-view]').forEach(button => {button.setAttribute('aria-selected',String(button.dataset.view === parentView));button.tabIndex=button.dataset.view===parentView?0:-1;});
    $('sjPendingViews').hidden = parentView !== 'pending';
    document.querySelectorAll('[data-pending-view]').forEach(button => {button.setAttribute('aria-selected',String(button.dataset.pendingView === view));button.tabIndex=button.dataset.pendingView===view?0:-1;});
    $('sjListHeading').textContent = view === 'all' && $('sjReviewFilter').value === 'linked' ? 'Invoices linked to open issues' : view === 'all' ? 'All invoices, with their submission status' : view === 'review' ? 'Invoices needing review' : view === 'pending' && $('sjReviewFilter').value === 'documents' ? 'Invoices awaiting documents' : view === 'pending' ? 'Every pending invoice, with its next step' : 'Recorded submissions';
    $('sjListDescription').textContent = view === 'all' && $('sjReviewFilter').value === 'linked' ? 'These pending or submitted invoices have open issues raised through the submission review.' : view === 'all' ? 'Submitted and not submitted invoices together. Open an invoice to see its complete submission history.' : view === 'review' ? 'Each invoice appears once. Review its blocking documents or reasons before raising an issue.' : view === 'pending' && $('sjReviewFilter').value === 'documents' ? 'Required documents are still missing for these invoices.' : view === 'pending' ? 'Waiting, deferred and linked issues stay visible here.' : 'See the recorded method, elapsed time and complete activity history.';
    const headers = [['',''],['Customer code','code'],['Customer name','name'],['Invoice number','invoiceNo'],['Invoice date',''],['Invoice value','impact'],['Aging','age'],['Submission',''],['Submission sub-status',''],['Submission medium',''],['Reason',''],['Review / issues',''],['Action','']];
    $('sjTableHead').innerHTML = `<tr>${headers.map(([label,key],index) => `<th scope="col" ${key ? `aria-sort="${sort === key ? direction === 1 ? 'ascending' : 'descending' : 'none'}"` : ''}>${!label && index === 0 ? '<input type="checkbox" id="sjSelectAll" aria-label="Select all visible invoices">' : key ? `<button type="button" data-sort="${key}">${label}<i class="bi ${sort === key ? direction === 1 ? 'bi-caret-up-fill' : 'bi-caret-down-fill' : 'bi-arrow-down-up'}" aria-hidden="true"></i></button>` : label}</th>`).join('')}</tr>`;
    const rows = filteredRows(), max = Math.max(1,Math.ceil(rows.length/10)); page = Math.min(page,max);
    const shown = rows.slice((page-1)*10,page*10);
    $('sjTableBody').innerHTML = shown.length ? shown.map(invoiceRow).join('') : `<tr><td colspan="${headers.length}" class="sjEmpty"><strong>${view === 'review' ? 'No invoices need review' : 'No matching invoices'}</strong>${view === 'review' ? 'Pending invoices remain visible in All Pending. Adjust the filters to see more.' : 'Try clearing your filters.'}</td></tr>`;
    $('sjPageInfo').textContent = rows.length ? `Showing ${(page-1)*10+1}–${Math.min(page*10,rows.length)} of ${rows.length} invoices` : '0 results';
    $('sjPageNumber').textContent = `${page} / ${max}`; $('sjPrev').disabled=page===1; $('sjNext').disabled=page===max;
    $('sjFootnote').textContent = view === 'review' ? `Invoice-date aging · ${state.settings.reviewDays}-day review threshold · Flags do not create issues automatically. Shared dependencies are reviewed once.` : 'Submission aging uses invoice date. Missing historical dates are shown as unavailable.';
    $('sjBulk').hidden = !selected.size || view === 'submitted'; $('sjSelectedCount').textContent=`${selected.size} selected`;
    if ($('sjSelectAll')) {
      const selectable = shown.filter(row => !C.submitted(row)), selectedCount = selectable.filter(row => selected.has(row.invoiceNo)).length;
      $('sjSelectAll').disabled = !selectable.length;
      $('sjSelectAll').checked = selectable.length > 0 && selectedCount === selectable.length;
      $('sjSelectAll').indeterminate = selectedCount > 0 && selectedCount < selectable.length;
    }
  }
  function invoiceRow(invoice) {
    const ownGroups=invoiceGroups(invoice), ownIssues=invoiceIssues(invoice), open=ownIssues.filter(issue=>!C.closed(issue));
    const group = view === 'review' ? reviewGroupsForInvoice(invoice)[0] : ownGroups.find(item=>item.issue)||ownGroups.find(item=>item.eligible)||ownGroups.find(item=>item.deferred)||ownGroups[0];
    const done=C.submitted(invoice), age=C.days(invoice.invoiceDate,done?invoice.firstSubmittedAt||invoice.submissionDate:C.today());
    const reason=done?'':invoice.reason|| (awaitingDocuments(invoice)?'Docs Pending':decisionFor(invoice).reason);
    const needsReview=ownGroups.some(item=>item.eligible), issueCount=new Set([...open.map(issue=>issue.id),...ownGroups.filter(item=>item.issue).map(item=>item.issue.id)]).size;
    const reviewStatus=done?pill('Complete','gray'):[needsReview?pill('Needs review','amber'):'',issueCount?pill(`${issueCount} open issue${issueCount===1?'':'s'}`,'blue'):'',!needsReview&&!issueCount?group?.deferred?pill('Deferred','gray'):group?pill('Waiting','gray'):pill('No review needed','gray'):''].join(' ');
    return `<tr><td><input type="checkbox" data-select="${esc(invoice.invoiceNo)}" aria-label="Select ${esc(invoice.invoiceNo)}" ${selected.has(invoice.invoiceNo)?'checked':''} ${done?'disabled':''}></td><td>${esc(invoice.code)}</td><td>${esc(invoice.name)}</td><td><button class="sjLink" data-invoice="${esc(invoice.invoiceNo)}" type="button">${esc(invoice.invoiceNo)}</button></td><td>${date(invoice.invoiceDate)}</td><td>${money(invoice.value)}</td><td><strong>${duration(age)}</strong></td><td>${pill(done?invoice.submissionStatus:'Not Submitted',done?'green':'amber')}</td><td>${esc(done?invoice.submissionSubStatus||(submissionSource(invoice)==='external'?'—':'Not recorded'):'—')}</td><td>${esc(submissionMedium(invoice))}</td><td><span class="sjReason" title="${esc(reason || 'No reason recorded')}">${esc(reason || '—')}</span></td><td>${reviewStatus}</td><td><div class="sjRowActions"><button class="sjButton" type="button" data-invoice="${esc(invoice.invoiceNo)}">${done?'View':'Update'}</button></div></td></tr>`;
  }
  function existingDocumentsFor(invoiceNos,customerCodes) {
    const seen=new Set();
    return [...state.documents,...attachments].filter(document=>{
      if(!document?.name || !(document.scope==='customer'?customerCodes.has(document.customerCode):document.scope==='invoice'&&invoiceNos.has(document.invoiceNo)))return false;
      const key=[document.scope,document.customerCode||'',document.invoiceNo||'',document.requirementId||document.requirement||'',document.name,document.uploadedAt||''].join('|');
      if(seen.has(key))return false;
      seen.add(key);return true;
    }).sort((a,b)=>Date.parse(b.uploadedAt||0)-Date.parse(a.uploadedAt||0));
  }
  function existingDocumentsCardHTML(invoice) {
    const documents=existingDocumentsFor(new Set([invoice.invoiceNo]),new Set([invoice.code]));
    const demoNames=['Invoice','Payment Receipt','Delivery Challan','Invoice Acknowledgment','GR Number','Email Communication (Invoice)'];
    const labelFor=document=>document.requirement==='Invoice Copy'?'Invoice':document.requirement||'Document';
    const actual=documents.map(document=>`<span class="sjExistingDocumentChip sjExistingDocumentChip--inverted" title="${esc(`${document.name} · ${document.scope} document · ${document.uploadedBy||'User'} · ${timestamp(document.uploadedAt)}`)}"><i class="bi bi-paperclip" aria-hidden="true"></i>${esc(labelFor(document))}<small>Attached</small></span>`).join('');
    const actualTypes=new Set(documents.map(labelFor).map(label=>label.toLowerCase()));
    const samples=demoNames.filter(label=>!actualTypes.has(label.toLowerCase())).map(label=>`<span class="sjExistingDocumentChip is-sample" title="Sample document type; no file is attached"><i class="bi bi-file-earmark" aria-hidden="true"></i>${esc(label)}<small>Sample</small></span>`).join('');
    return `<details class="sjExistingDocuments sjDetailExistingDocuments" open><summary class="sjExistingDocumentsHead"><div><h3>Existing Documents</h3><p>Shared customer files and documents tagged to this invoice · ${documents.length} available</p></div><span class="sjExistingDocumentsMeta"><span class="sjExistingDocumentsCount">${documents.length}</span><i class="bi bi-chevron-down" aria-hidden="true"></i></span></summary><div class="sjExistingDocumentsBody"><div class="sjExistingDocumentChips">${actual}${samples}</div></div></details>`;
  }
  function renderDetail() {
    const invoice=state.invoices.find(row=>row.invoiceNo===selectedInvoice); if(!invoice){selectedInvoice='';render();return;}
    restoreManualDialog();
    const ownIssues=invoiceIssues(invoice), done=C.submitted(invoice);
    const correction=done && activeRole()==='agent';
    $('sjDetail').innerHTML=`<header class="sjDetailHead"><div><button type="button" class="sjLink sjBack" data-back aria-label="Return to invoice list" title="Return to invoice list"><i class="bi bi-arrow-left" aria-hidden="true"></i></button><h2>${esc(invoice.invoiceNo)} ${pill(invoice.submissionStatus,done?'green':'amber')}</h2><p>${esc(invoice.name)} · ${esc(invoice.code)}</p></div></header>
      <div class="sjDetailLayout"><div class="sjDetailMain">
        ${invoiceOverviewHTML(invoice,done)}
        ${existingDocumentsCardHTML(invoice)}
        ${!done||correction?`<section id="sjUpdateSection" class="sjUpdateSection sjDialog sjManualDialog" aria-labelledby="sjManualTitle">${correction?'<div class="sjNextStep" role="status"><strong>Correct this record</strong><p>Return this invoice to Not Submitted and explain the correction in Remarks. The previous submission stays in the activity timeline.</p></div>':''}</section>`:''}
      </div><section id="sjTimelineSection" class="sjActivityCard" aria-label="Activity timeline">${timelineHTML(invoice,ownIssues)}</section></div>`;
    prepareTimeline();
    if (!done || correction) {
      $('sjUpdateSection').append($('sjManualForm'));
      if (inlineManualInvoice !== invoice.invoiceNo || ($('sjManualTitle').textContent === 'Correct submission') !== correction) { configureManual([invoice.invoiceNo],correction); inlineManualInvoice = invoice.invoiceNo; }
    } else inlineManualInvoice = '';
  }
  function timelineHTML(invoice, ownIssues) {
    const events=state.events.filter(item=>(item.invoiceNos||[]).includes(invoice.invoiceNo));
    ownIssues.forEach(issue=>{
      (issue.actionTrail||[]).forEach((item,index)=>events.push({ id:`${issue.id}-${index}`,type:'issue',at:item.when,by:item.who,what:item.what,remark:item.remark,issueId:issue.id }));
      const request=JSON.parse(localStorage.getItem('approval_requests')||'[]').find(row=>row.issue?.id===issue.id);
      (request?.trail||[]).forEach((item,index)=>{if(!events.some(row=>row.issueId===issue.id&&Math.abs(Date.parse(row.at)-Date.parse(item.at))<2000&&/approval/.test(row.what||'')))events.push({id:`${issue.id}-approval-${index}`,type:'issue',at:item.at,by:item.by,what:`Approval ${item.action}`,remark:item.remark,issueId:issue.id});});
    });
    const seen=new Set(), visible=events.filter(item=>{const signature=item.issueId?`${item.issueId}|${/created issue|Issue raised/.test(item.what)?'created':`${item.at}|${item.what}`}`:item.id;if(seen.has(signature))return false;seen.add(signature);return !timelineFilter||item.type===timelineFilter;}).sort((a,b)=>Date.parse(b.at)-Date.parse(a.at));
    return `<div class="sjDetailContentHeader"><div><span class="sjEyebrow">WHAT HAPPENED</span><h3>Activity timeline</h3></div><label><span class="sjSrOnly">Filter timeline</span><select id="sjTimelineFilter">${[['','All activity'],['invoice','Invoice creation'],['document','Documents'],['submission','Submission updates'],['automation','Automation'],['review','Review / deferral'],['issue','Issues / approvals']].map(([value,label])=>`<option value="${value}" ${timelineFilter===value?'selected':''}>${label}</option>`).join('')}</select></label></div>${visible.length?`<ol class="sjTimeline">${visible.map(item=>`<li><time>${timestamp(item.at)}</time><div><h4>${esc(item.what)}</h4><p>${esc(String(item.remark||'').replace(/\b1 invoices\b/g,'1 invoice'))}</p><small>${esc(item.by||'System')}${item.issueId?` · ${ownIssues.find(issue=>issue.id===item.issueId)?`<a href="${esc(issueURL(ownIssues.find(issue=>issue.id===item.issueId)))}">${esc(item.issueId)}</a>`:esc(item.issueId)}`:''}</small>${item.data?`<details><summary>Submission details</summary><dl>${Object.entries(item.data).filter(([key,value])=>value&&key!=='missingIds').map(([key,value])=>`<dt>${esc(({activityType:'Activity type',submissionStatus:'Submission status',submissionSubStatus:'Sub-status / reason',submissionMedium:'Submission medium',submissionDestination:'Submission destination',submissionDate:'Submission date',submissionType:'Submission type',invoiceType:'Invoice type',sentTo:'Sent to / received by',courierName:'Courier',courierDate:'Courier date',courierAwb:'AWB',remarks:'Remarks'})[key]||key)}</dt><dd>${esc(Array.isArray(value)?value.join(', '):value)}</dd>`).join('')}</dl></details>`:''}</div></li>`).join('')}</ol>`:'<p class="sjTimelineEmpty">No activity has been recorded for this filter.</p>'}`;
  }
  function prepareTimeline() {
    const card=$('sjTimelineSection'), count=card?.querySelectorAll('.sjTimeline > li').length || 0;
    if (!card) return;
    card.classList.remove('is-expanded');
    if (count <= 5) return;
    const button=document.createElement('button');
    button.type='button';button.className='sjButton sjMoreActivity';button.dataset.toggleHistory='';button.setAttribute('aria-expanded','false');
    button.textContent=`Show ${count-5} older activities`;
    card.append(button);
  }
  function openDialog(id) { returnFocus=document.activeElement; $(id).showModal(); }
  function closeDialog(id) { $(id).close(); if(returnFocus?.isConnected)returnFocus.focus(); }
  const rangeDate = value => date(value).replaceAll('-', '/');
  function setDateRange(from = '', to = '') {
    invoiceFrom = from; invoiceTo = to;
    $('sjDateRangeValue').textContent = from && to ? `${rangeDate(from)} – ${rangeDate(to)}` : 'Any date';
  }
  function renderRangeCalendar() {
    const months = [rangeMonth, new Date(rangeMonth.getFullYear(),rangeMonth.getMonth() + 1,1)];
    const label = month => month.toLocaleDateString('en-GB',{month:'long',year:'numeric'});
    $('sjRangeMonthsLabel').innerHTML = `${label(months[0])}<span class="sjRangeSecondLabel"> – ${label(months[1])}</span>`;
    $('sjRangeMonths').innerHTML = months.map(month => {
      const year = month.getFullYear(), monthIndex = month.getMonth();
      const firstWeekday = (new Date(year,monthIndex,1).getDay() + 6) % 7;
      const days = new Date(year,monthIndex + 1,0).getDate();
      const weekdays = ['Mo','Tu','We','Th','Fr','Sa','Su'].map(day => `<span>${day}</span>`).join('');
      const blanks = '<span></span>'.repeat(firstWeekday);
      const buttons = Array.from({length:days},(_,index) => {
        const day = `${year}-${String(monthIndex + 1).padStart(2,'0')}-${String(index + 1).padStart(2,'0')}`;
        const start = day === draftFrom, end = day === draftTo, between = draftFrom && draftTo && day > draftFrom && day < draftTo;
        const classes = [start?'is-start':'',end?'is-end':'',between?'is-between':''].filter(Boolean).join(' ');
        const dayLabel = new Date(year,monthIndex,index + 1).toLocaleDateString('en-GB',{day:'numeric',month:'long',year:'numeric'});
        return `<button type="button" class="${classes}" data-range-day="${day}" aria-label="${dayLabel}${start?' start date':''}${end?' end date':''}" aria-pressed="${Boolean(start||end)}">${index + 1}</button>`;
      }).join('');
      return `<section class="sjRangeMonth"><h3>${label(month)}</h3><div class="sjRangeDays">${weekdays}${blanks}${buttons}</div></section>`;
    }).join('');
    $('sjRangeSelection').textContent = draftFrom ? draftTo ? `${rangeDate(draftFrom)} – ${rangeDate(draftTo)}` : `Start: ${rangeDate(draftFrom)} · Select an end date` : 'No dates selected';
    $('sjDateRangeApply').disabled = !(draftFrom && draftTo);
  }
  function openRangeCalendar() {
    draftFrom = invoiceFrom; draftTo = invoiceTo;
    const [year,month] = (invoiceFrom || C.today()).split('-').map(Number);
    rangeMonth = new Date(year,month - (invoiceFrom ? 1 : 2),1);
    renderRangeCalendar(); openDialog('sjDateRangeDialog'); $('sjDateRangeTrigger').setAttribute('aria-expanded','true');
  }
  function openInvoice(id) { ['sjReviewDialog','sjDeferDialog','sjManualDialog'].forEach(key=>{if($(key).open)$(key).close();}); $('sjNotice').hidden=true;selectedInvoice=id;timelineFilter='';render();document.querySelector('[data-back]')?.focus();window.scrollTo({top:0}); }
  function renderReviewDocuments(chosen) {
    $('sjExistingDocuments').open=false;
    const invoiceNos=new Set(chosen.flatMap(group=>group.invoices.map(invoice=>invoice.invoiceNo)));
    const customerCodes=new Set(chosen.map(group=>group.code));
    const documents=existingDocumentsFor(invoiceNos,customerCodes);
    $('sjExistingDocumentsCount').textContent=documents.length;
    $('sjExistingDocumentsBody').innerHTML=documents.length?`<div class="sjExistingDocumentRows">${documents.map(document=>`<div class="sjExistingDocumentRow${document.scope==='customer'?' is-shared':''}"><i class="bi bi-file-earmark-check" aria-hidden="true"></i><span><strong>${esc(document.requirement||'Supporting document')}</strong><small title="${esc(document.name)}">${esc(document.name)}</small><em><i class="bi bi-link-45deg" aria-hidden="true"></i>${esc(document.scope==='customer'?'Customer document':document.invoiceNo||'Invoice document')} · ${esc(document.uploadedBy||'User')} · ${timestamp(document.uploadedAt)}</em></span></div>`).join('')}</div>`:'<div class="sjExistingDocumentsEmpty"><i class="bi bi-file-earmark" aria-hidden="true"></i><span><strong>No existing documents</strong><small>Documents already available for these invoices will appear here.</small></span></div>';
  }
  function openReview(keys) {
    refresh(); reviewKeys=[...new Set(keys)].filter(key=>groups.some(group=>group.key===key&&C.issueReasonForGroup(group)));
    if(!reviewKeys.length){notice('Only the five supported non-submission reasons can be raised as issues.');render();return;}
    const chosen=reviewKeys.map(key=>groups.find(group=>group.key===key));
    renderReviewDocuments(chosen);
    const affected=new Set(chosen.flatMap(group=>group.invoices.map(row=>row.invoiceNo))).size;
    $('sjReviewContext').textContent=`${chosen.length} dependenc${chosen.length===1?'y':'ies'} · ${affected} distinct invoice${affected===1?'':'s'} affected. Customer-level issues include all currently affected invoices, not only those meeting the age rule.`;
    $('sjReviewItems').innerHTML=chosen.map((group,index)=>{const reason=C.issueReasonForGroup(group);return `<section class="sjReviewItem"><div class="sjReviewItemTop"><input id="sjPromote${index}" type="checkbox" data-promote="${esc(group.key)}" aria-label="Raise issue for ${esc(reason)}${group.requirement.kind==='reason'?'':` · ${esc(group.requirement.name)}`}" ${group.issue||group.previousIssue?'disabled':''}><label for="sjPromote${index}"><strong>${esc(reason)}</strong> ${pill(group.scope==='customer'?'Customer document':group.requirement.kind==='reason'?'Invoice reason':'Invoice document','gray')}<small>${group.requirement.kind==='reason'?'':`Missing: ${esc(group.requirement.name)} · `}${esc(group.customer)} · ${esc(group.trigger)}${group.deferred?` · Deferred to ${date(group.review.until)}`:''}</small></label></div>${impactHTML(group.invoices,group.qualifying.length)}${group.issue||group.previousIssue?`<p class="sjHint">${group.issue?'An open issue already covers this dependency.':'A previous issue is closed. Review it and use the existing reopen workflow if this dependency has returned.'} ${C.agentCanView(group.issue||group.previousIssue,currentUser())?`<a href="${esc(issueURL(group.issue||group.previousIssue))}">Open ${esc((group.issue||group.previousIssue).id)}</a>`:'Issue details follow Issue Tracker access permissions.'}</p>`:''}</section>`;}).join('');
    const config=window.IssueTrackerConfig, approvals=config.ensureApprovalData();
    $('sjIssueOwner').innerHTML='<option value="">Select action owner</option>'+config.usersForRole('action-owner').map(user=>`<option>${esc(user.name)}</option>`).join('');
    $('sjIssueProcess').innerHTML='<option value="">No approval process</option>'+approvals.processes.map(process=>`<option value="${esc(process.id)}">${esc(process.process)}</option>`).join('');
    $('sjIssueRemark').value=chosen.map(group=>`${C.issueReasonForGroup(group)}${group.requirement.kind==='reason'?'':` — ${group.requirement.name}`}: ${group.invoices.length} invoice(s) affected.`).join('\n');
    $('sjIssueError').textContent=''; updateConfirmation(); openDialog('sjReviewDialog');
  }
  function selectedReviewKeys() { return [...document.querySelectorAll('[data-promote]:checked')].map(input=>input.dataset.promote); }
  function updateConfirmation() {
    const keys=selectedReviewKeys(), chosen=keys.map(key=>groups.find(group=>group.key===key)).filter(Boolean), affected=new Set(chosen.flatMap(group=>group.invoices.map(row=>row.invoiceNo))).size;
    $('sjCreateIssues').textContent=`Create ${keys.length} issue${keys.length===1?'':'s'}`; $('sjCreateIssues').disabled=!keys.length;
    $('sjIssueConfirm').innerHTML=`<strong>${keys.length} issue${keys.length===1?'':'s'} · ${affected} distinct invoice${affected===1?'':'s'} impacted</strong><br>${chosen.map(group=>`${esc(C.issueReasonForGroup(group))}${group.requirement.kind==='reason'?'':` · ${esc(group.requirement.name)}`} → ${group.invoices.length} invoice(s) · Owner: ${esc($('sjIssueOwner').value||'Select above')}`).join('<br>')}`;
    const skipManager=Boolean(window.IssueTrackerConfig.settings().skipManagerApproval);
    $('sjIssueRoute').textContent=`Route: ${skipManager?'Manager review skipped':'Manager review first'}${$('sjIssueProcess').value?' · selected approval process':' · no additional approval process'} · action owner: ${$('sjIssueOwner').value||'choose above'}.`;
  }
  function openDefer(keys) {
    refresh(); deferKeys=[...new Set(keys)].filter(key=>groups.some(group=>group.key===key&&!group.issue));
    if(!deferKeys.length){notice('These dependencies already have issues or are no longer pending.');render();return;}
    if($('sjReviewDialog').open)$('sjReviewDialog').close();
    $('sjDeferContext').textContent=`Defer ${deferKeys.length} dependency review(s). Missing documents will stay visible in All Pending.`;
    $('sjDeferDate').value=''; $('sjDeferDate').min=new Date(Date.parse(C.today())+86400000).toISOString().slice(0,10);$('sjDeferRemark').value='';$('sjDeferError').textContent='';openDialog('sjDeferDialog');
  }
  const setOptions=(id,options,placeholder)=>{$(id).innerHTML=`<option value="">${placeholder}</option>`+options.map(value=>`<option>${esc(value)}</option>`).join('');$(id).disabled=!options.length;};
  function restoreManualDialog() {
    const form=$('sjManualForm'), dialog=$('sjManualDialog');
    if(form && form.parentElement !== dialog) dialog.append(form);
  }
  function configureManual(ids, correction = false) {
    manualIds=ids.filter(id=>state.invoices.some(row=>row.invoiceNo===id&&(correction ? C.submitted(row) && activeRole()==='agent' : !C.submitted(row))));
    if(!manualIds.length){notice('Select pending invoices for a manual update.');return false;}
    $('sjManualForm').reset();setOptions('sjManualStatus',correction?['Not Submitted']:['Submitted','Not Submitted'],'Select submission status');setOptions('sjManualMedium',[],'Select status first');setManualActivityOptions();
    $('sjManualTitle').textContent=correction?'Correct submission':'Update submission';
    const config=window.IssueTrackerConfig, approvals=config.ensureApprovalData();
    $('sjManualIssueOwner').innerHTML='<option value="">Select action owner</option>'+config.usersForRole('action-owner').map(user=>`<option value="${esc(user.name)}">${esc(user.name)}</option>`).join('');
    $('sjManualIssueProcess').innerHTML='<option value="">Select approval process</option>'+approvals.processes.map(process=>`<option value="${esc(process.id)}">${esc(process.process)}</option>`).join('');
    $('sjManualContext').textContent=manualIds.length===1?`${manualIds[0]} · ${state.invoices.find(row=>row.invoiceNo===manualIds[0]).name}`:`${manualIds.length} invoices selected. Each invoice will receive its own activity record.`;
    const reqs=[...new Map(manualIds.flatMap(id=>C.missing(state,state.invoices.find(row=>row.invoiceNo===id),attachments)).map(req=>[`${req.scope}|${req.id}`,req])).values()];
    $('sjMissingChoices').innerHTML=reqs.length?reqs.map(req=>`<label><input type="checkbox" data-missing="${esc(req.id)}"> ${esc(req.name)} <small>${req.scope}</small></label>`).join(''):'<p class="sjHint">No configured missing documents are recorded for these invoices.</p>';
    $('sjSubmissionDate').max=C.today();$('sjCourierDate').max=C.today();$('sjManualError').textContent='';$('sjManualSave').textContent='Save update';
    manualSnapshot=manualFormSnapshot();return true;
  }
  const manualFormSnapshot=()=>JSON.stringify([...$('sjManualForm').querySelectorAll('input, select, textarea')].map(field=>[field.id||field.name,field.type==='checkbox'||field.type==='radio'?field.checked:field.value]));
  const hasUnsavedManual=()=>Boolean(selectedInvoice && inlineManualInvoice === selectedInvoice && manualSnapshot && manualFormSnapshot() !== manualSnapshot);
  function openManual(ids) {
    refresh(); restoreManualDialog();
    if(configureManual(ids))openDialog('sjManualDialog');
  }
  function setManualActivityOptions() {
    const status=$('sjManualStatus').value, medium=$('sjManualMedium').value;
    ['sjSubmissionDate','sjSentTo','sjCourierName','sjCourierDate','sjCourierAwb','sjManualRemark'].forEach(id=>$(id).value='');
    setOptions('sjSubmissionType',[],'Select sub-status first');setOptions('sjInvoiceType',[],'Select sub-status first');
    $('sjAddToIssueTracker').checked=false;
    setOptions('sjActivity',C.manualFlow(status,'',medium).activities,medium?'Select activity':'Select medium first');
    if(status==='Not Submitted')$('sjActivity').value='No Activity';
    setManualSubOptions();
  }
  function setManualSubOptions() {
    const status=$('sjManualStatus').value, flow=C.manualFlow(status,$('sjActivity').value,$('sjManualMedium').value);
    $('sjManualSubLabel').textContent=status==='Not Submitted'?'Reason for non-submission':'Submission sub-status';
    setOptions('sjManualSub',flow.subStatuses,'Select activity first');
    if(flow.subStatus)$('sjManualSub').value=flow.subStatus;
    else if(flow.subStatuses.length)$('sjManualSub').options[0].textContent='Select reason';
    setOptions('sjManualDestination',flow.destinations,'Select destination');
    manualChanged();
  }
  function manualChanged() {
    const status=$('sjManualStatus').value, medium=$('sjManualMedium').value, flow=C.manualFlow(status,$('sjActivity').value,medium), delivery=flow.delivery&&$('sjManualSub').value===flow.subStatus, courier=flow.courier;
    const addIssue=status==='Not Submitted'&&$('sjAddToIssueTracker').checked;
    $('sjManualStatusField').classList.toggle('sjFull',status==='Not Submitted');
    $('sjManualMediumField').hidden=status==='Not Submitted';
    $('sjActivityField').hidden=flow.external||status==='Not Submitted';$('sjActivity').required=Boolean(status)&&!flow.external;
    $('sjManualDetails').hidden=flow.external||!medium;$('sjManualSub').required=!flow.external;
    $('sjCompletedFields').hidden=!delivery;$('sjManualDestination').required=delivery;
    $('sjFulfilmentFields').hidden=!(delivery||courier);$('sjDelivery').hidden=!delivery;$('sjSentFields').hidden=!(delivery||courier);$('sjCourier').hidden=!courier;
    $('sjEscalationChoice').hidden=status!=='Not Submitted';$('sjInlineIssueFields').hidden=!addIssue;
    $('sjMissingFields').hidden=!addIssue||$('sjManualSub').value!=='Docs Pending';
    const correction=manualIds.some(id=>C.submitted(state.invoices.find(row=>row.invoiceNo===id)));
    $('sjManualIssueOwner').required=addIssue;$('sjManualIssueProcess').required=addIssue;$('sjManualRemark').required=addIssue||correction;
    $('sjManualRemarkRequired').hidden=!(addIssue||correction);
    $('sjManualAutomation').hidden=!(delivery||flow.external);
    ['sjSubmissionType','sjInvoiceType','sjSubmissionDate'].forEach(id=>$(id).required=delivery);$('sjSentTo').required=delivery||courier;['sjCourierName','sjCourierDate','sjCourierAwb'].forEach(id=>$(id).required=courier);
    if(delivery){const previous=$('sjInvoiceType').value;setOptions('sjSubmissionType',[flow.submissionType],'Select type');$('sjSubmissionType').value=flow.submissionType;setOptions('sjInvoiceType',flow.invoiceTypes,'Select invoice type');$('sjInvoiceType').value=flow.invoiceTypes.includes(previous)?previous:flow.invoiceTypes[0];}
    $('sjManualSave').textContent=addIssue?'Save update and add to Issue Tracker':'Save update';
  }
  document.addEventListener('click',event=>{
    const button=event.target.closest('button'); if(!button)return;
    if(button.id==='sjDateRangeTrigger'){openRangeCalendar();return;}
    if(button.dataset.rangeMonth){rangeMonth=new Date(rangeMonth.getFullYear(),rangeMonth.getMonth()+Number(button.dataset.rangeMonth),1);renderRangeCalendar();return;}
    if(button.dataset.rangeDay){const day=button.dataset.rangeDay;if(!draftFrom||draftTo){draftFrom=day;draftTo='';}else if(day<draftFrom){draftTo=draftFrom;draftFrom=day;}else draftTo=day;renderRangeCalendar();$('sjRangeMonths').querySelector(`[data-range-day="${day}"]`)?.focus();return;}
    if(button.hasAttribute('data-toggle-history')){const expanded=$('sjTimelineSection').classList.toggle('is-expanded');button.setAttribute('aria-expanded',String(expanded));button.textContent=expanded?'Show recent activity':`Show ${$('sjTimelineSection').querySelectorAll('.sjTimeline > li').length-5} older activities`;return;}
    if(button.id==='sjDateRangeApply'){setDateRange(draftFrom,draftTo);closeDialog('sjDateRangeDialog');page=1;render();return;}
    if(button.id==='sjDateRangeClear'){setDateRange();closeDialog('sjDateRangeDialog');page=1;render();return;}
    if(button.dataset.close){closeDialog(button.dataset.close);return;}
    if(button.dataset.pendingView){view=button.dataset.pendingView;page=1;selected.clear();if(['linked','documents'].includes($('sjReviewFilter').value))$('sjReviewFilter').value='';render();return;}
    if(button.dataset.view){view=button.dataset.view==='pending'?'review':button.dataset.view;page=1;selected.clear();if(['linked','documents'].includes($('sjReviewFilter').value))$('sjReviewFilter').value='';render();return;}
    if(button.dataset.summary){selectedInvoice='';view=button.dataset.summary==='issues'?'all':button.dataset.summary==='pending'?'review':button.dataset.summary==='documents'?'pending':button.dataset.summary;page=1;selected.clear();if(['review','issues','documents'].includes(button.dataset.summary)){['sjSearch','sjReason','sjReviewFilter'].forEach(id=>$(id).value='');setDateRange();}$('sjReviewFilter').value=button.dataset.summary==='issues'?'linked':button.dataset.summary==='documents'?'documents':'';render();return;}
    if(button.dataset.invoice){openInvoice(button.dataset.invoice);return;}
    if(button.hasAttribute('data-back')){if(hasUnsavedManual()&&!window.confirm('Discard your unsaved submission update?'))return;selectedInvoice='';render();document.querySelector(view==='review'?'[data-pending-view="review"]':`[data-view="${view}"]`)?.focus();return;}
    if(button.dataset.review){openReview([button.dataset.review]);return;}
    if(button.dataset.reviewInvoice){const invoice=state.invoices.find(row=>row.invoiceNo===button.dataset.reviewInvoice);if(invoice)openReview(reviewGroupsForInvoice(invoice).map(group=>group.key));return;}
    if(button.dataset.defer){openDefer([button.dataset.defer]);return;}
    if(button.dataset.manual){openManual([button.dataset.manual]);return;}
    if(button.dataset.sort){sort===button.dataset.sort?direction*=-1:(sort=button.dataset.sort,direction=sort==='age'?-1:1);page=1;render();}
  });
  document.addEventListener('keydown',event=>{
    const tab=event.target.closest('[role=tab]');if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    const tabs=[...tab.parentElement.querySelectorAll('[role=tab]')], index=tabs.indexOf(tab);
    const next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
    event.preventDefault();tabs[next].click();const selector=tabs[next].dataset.pendingView?`[data-pending-view="${tabs[next].dataset.pendingView}"]`:`[data-view="${tabs[next].dataset.view}"]`;document.querySelector(selector)?.focus();
  });
  document.addEventListener('change',event=>{
    if(event.target.dataset.select){event.target.checked?selected.add(event.target.dataset.select):selected.delete(event.target.dataset.select);render();}
    if(event.target.id==='sjSelectAll'){filteredRows().slice((page-1)*10,page*10).filter(row=>!C.submitted(row)).forEach(row=>event.target.checked?selected.add(row.invoiceNo):selected.delete(row.invoiceNo));render();}
    if(event.target.dataset.promote||['sjIssueOwner','sjIssueProcess'].includes(event.target.id))updateConfirmation();
    if(event.target.id==='sjTimelineFilter'){timelineFilter=event.target.value;const invoice=state.invoices.find(row=>row.invoiceNo===selectedInvoice);if(invoice){$('sjTimelineSection').innerHTML=timelineHTML(invoice,invoiceIssues(invoice));prepareTimeline();$('sjTimelineFilter').focus();}}
  });
  ['sjSearch','sjReason','sjReviewFilter'].forEach(id=>$(id).addEventListener(id==='sjSearch'?'input':'change',()=>{page=1;render();}));
  $('sjDateRangeDialog').addEventListener('close',()=>$('sjDateRangeTrigger').setAttribute('aria-expanded','false'));
  $('sjClear').addEventListener('click',()=>{['sjSearch','sjReason','sjReviewFilter'].forEach(id=>$(id).value='');setDateRange();page=1;render();});
  $('sjPrev').addEventListener('click',()=>{page--;render();});$('sjNext').addEventListener('click',()=>{page++;render();});
  $('sjBulkUpdate').addEventListener('click',()=>openManual([...selected]));
  $('sjBulkReview').addEventListener('click',()=>openReview(groups.filter(group=>group.invoices.some(row=>selected.has(row.invoiceNo))).map(group=>group.key)));
  $('sjDeferFromReview').addEventListener('click',()=>openDefer(selectedReviewKeys().length?selectedReviewKeys():reviewKeys));
  $('sjManualStatus').addEventListener('change',()=>{const status=$('sjManualStatus').value;setOptions('sjManualMedium',status==='Submitted'?['Manual','External']:status==='Not Submitted'?['Manual']:[],'Select medium');if(status==='Not Submitted')$('sjManualMedium').value='Manual';setManualActivityOptions();});
  $('sjManualMedium').addEventListener('change',setManualActivityOptions);
  $('sjActivity').addEventListener('change',setManualSubOptions);$('sjManualSub').addEventListener('change',manualChanged);$('sjAddToIssueTracker').addEventListener('change',manualChanged);
  $('sjManualForm').addEventListener('submit',event=>{
    event.preventDefault(); if(!$('sjManualForm').reportValidity())return;
    try {
      if (manualIds.length > 1) {
        const names=[...new Set(state.invoices.filter(row=>manualIds.includes(row.invoiceNo)).map(row=>row.name))];
        if (!window.confirm(`Apply this update to ${manualIds.length} invoices for ${names.join(', ')}?\n\n${manualIds.join(', ')}`)) return;
      }
      refresh(); if(manualIds.some(id=>!state.invoices.some(row=>row.invoiceNo===id&&(!C.submitted(row)||$('sjManualStatus').value==='Not Submitted'&&activeRole()==='agent'))))throw new Error('An invoice changed while this form was open. Close it and review the latest status.');
      const status=$('sjManualStatus').value, addIssue=status==='Not Submitted'&&$('sjAddToIssueTracker').checked;
      const missingIds=addIssue?[...document.querySelectorAll('[data-missing]:checked')].map(input=>input.dataset.missing):[];
      if(addIssue&&$('sjManualSub').value==='Docs Pending'&&!missingIds.length)throw new Error('Select the missing document(s) to add to Issue Tracker.');
      const update={activityType:status==='Not Submitted'?'No Activity':$('sjActivity').value,submissionStatus:status,submissionSubStatus:$('sjManualSub').value,submissionMedium:status==='Not Submitted'?'Manual':$('sjManualMedium').value,submissionDestination:$('sjCompletedFields').hidden?'':$('sjManualDestination').value,submissionDate:$('sjDelivery').hidden?'':$('sjSubmissionDate').value,submissionType:$('sjDelivery').hidden?'':$('sjSubmissionType').value,invoiceType:$('sjDelivery').hidden?'':$('sjInvoiceType').value,sentTo:$('sjSentFields').hidden?'':$('sjSentTo').value,courierName:$('sjCourier').hidden?'':$('sjCourierName').value,courierDate:$('sjCourier').hidden?'':$('sjCourierDate').value,courierAwb:$('sjCourier').hidden?'':$('sjCourierAwb').value,remarks:$('sjManualDetails').hidden?'':$('sjManualRemark').value,missingIds};
      const correcting=manualIds.some(id=>C.submitted(state.invoices.find(row=>row.invoiceNo===id)));
      const next=C.clone(state); C.saveManual(next,manualIds,update,currentUser(),activeRole());
      let created=[];
      if(addIssue){
        const keys=C.blockers(next,issues,C.today(),attachments).filter(group=>group.invoices.some(row=>manualIds.includes(row.invoiceNo))&&(update.submissionSubStatus==='Docs Pending'?group.requirement.kind!=='reason'&&missingIds.includes(group.requirement.id):group.requirement.kind==='reason'&&group.requirement.name===update.submissionSubStatus)).map(group=>group.key);
        if(!keys.length)throw new Error('No matching blocker is available for an issue. Review the reason and selected documents.');
        const result=C.promote(state,keys,{owner:$('sjManualIssueOwner').value,process:$('sjManualIssueProcess').value,remark:$('sjManualRemark').value.trim()},window.IssueTrackerConfig,localStorage,currentUser(),{invoiceNos:manualIds,update,actorRole:activeRole()});
        state=result.state;created=result.issues;
      } else persist(next);
      refresh();if($('sjManualDialog').open)closeDialog('sjManualDialog');selected.clear();inlineManualInvoice='';render();
      if(created.length)notice(`${created.length} issue${created.length===1?'':'s'} created with the submission update. ${created.map(issue=>`<a href="${esc(issueURL(issue))}">${esc(issue.documentRequirement)} · Open Issue Tracker</a>`).join(' · ')}`,false,true);
      else notice(status==='Not Submitted'?correcting?'Submission corrected to Not Submitted. Previous submission remains in the timeline. No issue has been created.':'Non-submission reason saved. No issue has been created.':`${$('sjManualMedium').value} submission saved. Automatic submission is skipped.`);
    }catch(error){$('sjManualError').textContent=error.message;}
  });
  $('sjIssueForm').addEventListener('submit',event=>{
    event.preventDefault();if(!$('sjIssueForm').reportValidity())return; $('sjCreateIssues').disabled=true;
    try {
      refresh(); const result=C.promote(state,selectedReviewKeys(),{owner:$('sjIssueOwner').value,process:$('sjIssueProcess').value,remark:$('sjIssueRemark').value.trim()},window.IssueTrackerConfig,localStorage,currentUser());
      state=result.state;refresh();closeDialog('sjReviewDialog');render();notice(`${result.issues.length} issue(s) created. ${result.issues.map(issue=>`<a href="${esc(issueURL(issue))}">${esc(issue.documentRequirement)} · Open Issue Tracker</a>`).join(' · ')}`,false,true);
    }catch(error){$('sjIssueError').textContent=error.message;updateConfirmation();}
  });
  $('sjDeferForm').addEventListener('submit',event=>{
    event.preventDefault();if(!$('sjDeferForm').reportValidity())return;
    try{refresh();const next=C.clone(state);deferKeys.forEach(key=>{const group=groups.find(row=>row.key===key&&!row.issue);if(!group)throw new Error('A dependency changed. Review it again.');C.defer(next,group,$('sjDeferDate').value,$('sjDeferRemark').value,currentUser());});persist(next);refresh();closeDialog('sjDeferDialog');render();notice(`Review deferred to ${date($('sjDeferDate').value)}. The blockers remain visible in All Pending.`);}catch(error){$('sjDeferError').textContent=error.message;}
  });
  $('sjRulesBtn').addEventListener('click',()=>{$('sjReviewDays').textContent=state.settings.reviewDays;openDialog('sjRulesDialog');});
  window.addEventListener('focus',()=>{if(document.querySelector('dialog[open]')||hasUnsavedManual())return;try{refresh();render();}catch(error){notice(error.message,true);}});
  window.addEventListener('storage',()=>{if(document.querySelector('dialog[open]')||hasUnsavedManual())return;try{refresh();render();}catch(error){notice(error.message,true);}});
  window.addEventListener('beforeunload',event=>{if(!hasUnsavedManual())return;event.preventDefault();event.returnValue='';});
  function headerAssets(){const logo=$('relationshipLogo');if(logo)logo.innerHTML='<img src="../assets/submission-reference/client-logo.jpg" alt="Client logo">';const avatar=$('headerUserAvatar');if(avatar)avatar.innerHTML='<img src="../assets/submission-reference/avatar.png" alt="User profile">';const badge=document.querySelector('.notification-badge');if(badge)badge.textContent='5';}
  try{refresh();render();const target=new URLSearchParams(location.search).get('invoice');if(target&&state.invoices.some(row=>row.invoiceNo===target))openInvoice(target);}catch(error){notice(error.message,true);$('sjList').hidden=true;}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',headerAssets);else headerAssets();
})();
