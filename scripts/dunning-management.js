/* Client Admin workspace for Dunning Letters. The shared engine owns all writes. */
(function(root, factory) {
  'use strict';
  const management = factory(root);
  if (typeof module === 'object' && module.exports) module.exports = management;
  else { root.IneburaDunningManagement = management; management.autoMount(); }
})(typeof window !== 'undefined' ? window : globalThis, function(root) {
  'use strict';
  const clone = value => JSON.parse(JSON.stringify(value));
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const canManage = context => context?.role === 'client-admin' && Boolean(context.clientId);
  const money = value => Number(value || 0).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2});
  const today = () => new Intl.DateTimeFormat('en-CA', {timeZone:'Asia/Kolkata',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
  const aging = ['Not Due','1-30','31-45','46-60','61-90','91-120','121-150','151-180','181-210','211-240','241-270','271-300','301-330','331-365','1-2 yrs','2-3 yrs','3-4 yrs','4-5 yrs','5+ yrs'];
  function guard(context) { if (!canManage(context)) throw new Error('Dunning Letters is available to Client Admin only.'); }
  function scoped(state, context) {
    guard(context);
    const customers = state.customers.filter(row => row.clientId === context.clientId);
    const invoices = state.invoices.filter(row => row.clientId === context.clientId);
    const strategies = state.strategies.filter(row => row.clientId === context.clientId);
    const ids = new Set(strategies.map(row => row.id));
    const emails = state.emails.filter(email => (email.letterSnapshot?.customer?.clientId || email.letterSnapshot?.clientId) === context.clientId);
    return {...state,customers,invoices,strategies,emails,exclusions:state.exclusions.filter(row=>invoices.some(invoice=>invoice.id===row.invoiceId)),batches:state.batches.filter(row => ids.has(row.strategyId)),conflicts:state.conflicts.filter(row => invoices.some(invoice => invoice.id === row.invoiceId))};
  }
  function participationView(state, context, filters = {}) {
    const data = scoped(state, context), lastSent = new Map();
    const invoiceIds = new Set(data.invoices.map(invoice => invoice.id));
    const count = Math.max(1, Math.min(1000, Number(data.letterCount) || 3));
    const stages = new Set(Array.from({length:count}, (_, index) => index + 1));
    data.emails.forEach((email, index) => {
      if (!['sent','partial'].includes(email.status)) return;
      const snapshot = email.letterSnapshot, stage = Number(snapshot?.stageNumber || email.stage);
      if (!snapshot || !Number.isSafeInteger(stage) || stage < 1 || stage > 1000) return;
      const parsed = Date.parse(snapshot.sentAt || snapshot.date || email.date || '');
      const timestamp = Number.isFinite(parsed) ? parsed : -Infinity;
      (snapshot.invoices || []).forEach(invoice => {
        if (!invoiceIds.has(invoice.id) || invoice.clientId && invoice.clientId !== context.clientId) return;
        stages.add(stage);
        const previous = lastSent.get(invoice.id);
        if (!previous || timestamp > previous.timestamp || timestamp === previous.timestamp && index > previous.index) {
          lastSent.set(invoice.id, {stage, timestamp, index, date:String(snapshot.date || email.date || snapshot.sentAt || '').slice(0,10), reference:snapshot.reference || email.reference || ''});
        }
      });
    });
    const query = String(filters.search || '').trim().toLowerCase(), selected = String(filters.stage || '');
    if (selected && selected !== 'not-sent' && !/^(?:[1-9]\d{0,2}|1000)$/.test(selected)) throw new Error('Choose a valid sent-letter filter.');
    const rows = data.invoices.map(invoice => {
      const sent = lastSent.get(invoice.id);
      return {invoice:clone(invoice),customer:clone(data.customers.find(customer => customer.id === invoice.customerId) || {}),lastSentStage:sent?.stage || null,lastSentDate:sent?.date || '',lastSentReference:sent?.reference || '',excluded:data.exclusions.some(exclusion => exclusion.invoiceId === invoice.id && exclusion.active !== false),paid:Number(invoice.outstandingAmount ?? invoice.outstanding) <= 0};
    }).filter(row => (!query || `${row.invoice.invoiceNo} ${row.customer.name || ''} ${row.customer.customerCode || row.customer.code || ''}`.toLowerCase().includes(query)) && (!selected || (selected === 'not-sent' ? row.lastSentStage === null : row.lastSentStage === Number(selected))));
    return {rows,stages:[...stages].sort((a,b) => a-b)};
  }
  function buildStrategy(input, existing, state, context) {
    guard(context);
    if (existing && existing.clientId !== context.clientId) throw new Error('This strategy is outside your client scope.');
    const count = Number(state.letterCount || 3);
    if (!Number.isInteger(input.firstStageDays) || input.firstStageDays < 0 || input.firstStageDays > 3650) throw new Error('Enter whole days from 0 to 3650 for the first letter.');
    if (!String(input.name || '').trim()) throw new Error('Enter a strategy name.');
    if (!Array.isArray(input.stages) || !input.stages.length || input.stages.length > count) throw new Error(`Configure between 1 and ${count} letter stages.`);
    input.stages.forEach((stage, i) => {
      const template = state.templates.find(row => row.id === stage.templateId);
      if (!template || Number(template.stageNumber) !== i + 1) throw new Error(`Select a template for DL${i + 1}.`);
      if (!Number.isInteger(stage.intervalDays) || stage.intervalDays < (i ? 1 : 0) || stage.intervalDays > 3650) throw new Error('Enter whole days from 1 to 3650 between later letters.');
    });
    const filters = clone(existing?.filters || {});
    if (input.coverageChanged || !existing) {
      const coverage = input.coverage || {};
      if (!['customer','invoice'].includes(coverage.targetType) || !['all','selected'].includes(coverage.targetMode)) throw new Error('Choose valid invoice coverage.');
      const selected = [...new Set(input.selectedIds || [])];
      const rows = coverage.targetType === 'invoice' ? state.invoices : state.customers;
      if (coverage.targetMode === 'selected' && !selected.length) throw new Error(`Select at least one ${coverage.targetType}.`);
      if (selected.some(id => !rows.some(row => row.id === id && row.clientId === context.clientId))) throw new Error('A selected target is outside your client scope.');
      delete filters.strategyMaster;
      delete filters.customerIds;
      delete filters.invoiceIds;
      filters.coverage = clone(coverage);
      if (coverage.targetMode === 'selected') filters[coverage.targetType === 'invoice' ? 'invoiceIds' : 'customerIds'] = selected;
    }
    delete filters.minOutstanding;
    return {...clone(existing || {}),...(existing?.id ? {id:existing.id}:{}),clientId:context.clientId,name:input.name.trim(),status:input.status || 'draft',firstStageDays:input.firstStageDays,subClientId:input.subClientId || '',filters,stages:clone(input.stages)};
  }
  function mount(container, options = {}) {
    const api = options.api || root.IneburaDunning;
    const context = () => api.getContext();
    const boundClientId = api?.getContext().clientId;
    let currentSection = 'templates', renderPending = false, formStrategy = null, formStages = [], coverageChanged = false;
    let searchInvoices = '', searchActivity = '', invoiceStage = '', destroyed = false, noticeTimer;
    const configUrl = () => `?module=module-configuration&view=configurations${new URLSearchParams(root.location.search).get('role') ? `&role=${encodeURIComponent(context().role)}` : ''}`;
    function notify(message, error = false) {
      const box = container.querySelector('[data-dm-notice]');
      if (box) { box.textContent = message; box.hidden = false; box.classList.toggle('is-error', error); }
      clearTimeout(noticeTimer);
      if (!error) noticeTimer = setTimeout(() => { if (box) box.hidden = true; }, 6000);
      options.notify?.(message, error);
    }
    function authorized() { if (canManage(context()) && context().clientId===boundClientId) return true; renderDenied(); return false; }
    function renderDenied() {
      const dialog=root.document?.getElementById('adminModal');
      if(dialog?.querySelector('.dmModal')){dialog.classList.remove('is-open');dialog.setAttribute('aria-hidden','true');dialog.innerHTML='';formStrategy=null;}
      container.innerHTML = '<section class="dmEmpty" role="alert"><h2>Access restricted</h2><p>Dunning Letters is available to Client Admin only. If your client context changed, reload this page.</p></section>';
    }
    if (!api || !canManage(context())) { renderDenied(); return {refresh:renderDenied,destroy(){destroyed=true;}}; }
    const sections = [['templates','Letter Templates'],['scheduling','Sending & Scheduling'],['activity','Letter Activity'],['invoices','Invoice Participation'],['report','Invoice Report']];
    container.innerHTML = `<div class="dmWorkspace"><header class="dmHeader"><div><h2>Dunning Letters</h2><p>Manage daily invoice batches, letter schedules and issued history.</p></div><a class="dmButton" href="${configUrl()}">Edit configuration</a></header><div class="dmSummary" data-dm-summary></div><p class="dmNotice" data-dm-notice role="status" hidden></p><nav class="dmNavigation" role="tablist" aria-label="Dunning Letters sections">${sections.map(([id,label],i)=>`<button type="button" id="dm-tab-${id}" role="tab" aria-selected="${i===0}" aria-controls="dm-panel-${id}" tabindex="${i===0?'0':'-1'}" data-dm-section="${id}">${label}</button>`).join('')}</nav>${sections.map(([id,label],i)=>`<section class="dmSection" id="dm-panel-${id}" role="tabpanel" aria-labelledby="dm-tab-${id}" ${i?'hidden':''}>${id==='templates'?'<div data-dunning-templates></div>':id==='report'?'<div data-dunning-report></div>':`<div data-dm-${id}></div>`}</section>`).join('')}<p class="dmPrototype">Design preview: the daily cycle simulates email delivery.</p></div>`;
    const templates = root.IneburaDunningManagementTemplates?.mount(container.querySelector('[data-dunning-templates]'), {api,notify,canManage:()=>canManage(context())});
    const report = root.IneburaDunningManagementReport?.mount(container.querySelector('[data-dunning-report]'), {api,notify});
    if (!templates) notify('Letter templates could not load. Reload this page.', true);
    if (!report) notify('The invoice report could not load. Reload this page.', true);
    function table(headers, rows, empty) { return `<div class="dmTableScroll"><table><thead><tr>${headers.map(h=>`<th scope="col">${escape(h)}</th>`).join('')}</tr></thead><tbody>${rows.length?rows.map(row=>`<tr>${row.map(cell=>`<td>${cell}</td>`).join('')}</tr>`).join(''):`<tr><td colspan="${headers.length}" class="dmEmpty">${escape(empty)}</td></tr>`}</tbody></table></div>`; }
    const button = (label,action,id='',disabled=false,tone='') => `<button type="button" class="dmButton ${tone}" data-dm-action="${action}" data-id="${escape(id)}" ${disabled?'disabled':''}>${label}</button>`;
    const badge = text => `<span class="dmBadge">${escape(text)}</span>`;
    function renderScheduling(state) {
      const rows = state.strategies.filter(s=>!s.strategyMasterDeleted).map(s => [escape(s.name),badge(s.status),`${s.firstStageDays} days after due date`,escape((s.stages||[]).map((step,i)=>`DL${i+1}${i?` +${step.intervalDays}d`:''}`).join(' → ')),`${s.subClientId?`${escape(s.subClientId)} · `:''}${scopeLabel(s,state)}`,`<div class="dmActions">${button('Edit','edit-strategy',s.id)}${s.status==='draft'||s.status==='paused'?button(s.status==='paused'?'Resume':'Activate','activate',s.id,!state.enabled):''}${s.status==='active'?button('Pause','pause',s.id):''}${!['draft','stopped'].includes(s.status)?button('Stop','stop',s.id):''}${button('Eligibility','eligibility',s.id)}</div>`]);
      container.querySelector('[data-dm-scheduling]').innerHTML = `<div class="dmSectionHeading"><div><h3>Sending & Scheduling</h3><p>Each daily customer batch follows its own schedule. A configured active strategy is required to send letters.</p></div>${button('+ Add strategy','add-strategy','',!state.enabled,'is-primary')}</div>${!state.enabled?`<p class="dmEmpty">Dunning Letters is disabled. <a href="${configUrl()}">Enable it in Configurations</a> to configure sending.</p>`:''}${table(['Strategy','Status','DL1 timing','Letter schedule','Coverage','Actions'],rows,'No strategy configured. No Dunning emails will be sent.')}<div data-dm-eligibility></div><div class="dmPending"><strong>Pending team confirmation</strong><p>Retry limit, resume scheduling after missed dates, and scheduling after removing an invoice exclusion.</p></div>`;
    }
    function scopeLabel(s,state) {
      const f=s.filters || {}, legacy=f.strategyMaster;
      if(legacy) return `${escape(legacy.targetType)} · ${escape(legacy.targetMode)}${legacy.targetMode==='selected'?` (${legacy.selectedTargetIds?.length||0})`:''} · existing exclusions retained`;
      if(f.invoiceIds?.length) return `${f.invoiceIds.length} selected invoices`;
      if(f.customerIds?.length) return `${f.customerIds.length} selected customers`;
      return 'All eligible customer invoices';
    }
    function renderActivity(state) {
      const q=searchActivity.trim().toLowerCase();
      const findCustomer=id=>state.customers.find(c=>c.id===id)?.name || id;
      const batches=state.batches.filter(b=>!q||`${b.id} ${findCustomer(b.customerId)}`.toLowerCase().includes(q));
      const emails=state.emails.filter(e=>!q||`${e.reference} ${e.letterSnapshot?.customer?.name}`.toLowerCase().includes(q));
      const conflicts=state.conflicts.filter(c=>c.status==='unresolved');
      container.querySelector('[data-dm-activity]').innerHTML = `<div class="dmSectionHeading"><div><h3>Letter Activity</h3><p>Review independent daily batches, recipient results and the exact sent PDF.</p></div></div><form data-dm-run class="dmRun"><label>Cycle date<input type="date" name="date" value="${escape(api.getState().lastRunDate || today())}" required></label><label>Delivery scenario<select name="outcome"><option value="success">All contacts succeed</option><option value="partial">Some contacts fail</option><option value="failure">All contacts fail</option></select></label><button class="dmButton is-primary" ${!state.enabled||!state.strategies.some(s=>s.status==='active')?'disabled':''}>Run daily cycle</button></form><label class="dmSearch">Find customer, batch or reference<input type="search" value="${escape(searchActivity)}" data-dm-search="activity" placeholder="Search letter activity"></label>${conflicts.length?`<div class="dmConflict"><h4>Resolve strategy conflicts</h4><p>An invoice matching more than one active strategy is held until one strategy is selected.</p>${conflicts.map(c=>`<form data-dm-conflict="${escape(c.invoiceId)}"><strong>${escape(state.invoices.find(i=>i.id===c.invoiceId)?.invoiceNo || c.invoiceId)}</strong><select name="strategy" aria-label="Strategy for ${escape(c.invoiceId)}" required><option value="">Select a strategy</option>${c.strategyIds.filter(id=>state.strategies.some(s=>s.id===id)).map(id=>`<option value="${escape(id)}">${escape(state.strategies.find(s=>s.id===id)?.name)}</option>`).join('')}</select><button class="dmButton">Resolve conflict</button></form>`).join('')}</div>`:''}<h4>Daily batches</h4>${table(['Batch date','Customer','Strategy','Next letter','Scheduled date','Status','Invoices'],batches.map(b=>[escape(b.createdDate),escape(findCustomer(b.customerId)),escape(state.strategies.find(s=>s.id===b.strategyId)?.name),b.status==='completed'?'Complete':`DL${b.stage}`,escape(b.nextDate || '—'),`${badge(b.status)}${b.blockedReason?`<small>${escape(b.blockedReason)}</small>`:''}`,String(b.invoiceIds.length)]),'No daily batches yet.')}<h4>Letter issues and delivery</h4>${table(['Issue date','Customer','Letter','Reference','Recipients','Delivery','PDF'],emails.slice().reverse().map(e=>[escape(e.date),escape(e.letterSnapshot?.customer?.name || findCustomer(e.customerId)),`DL${e.stage}`,escape(e.reference),`<div class="dmRecipients">${(e.recipientResults||[]).map(r=>`${escape(r.email)} — ${escape(r.status)}`).join('<br>') || escape((e.to||[]).join(', '))}</div>`,badge(e.status),e.status!=='failed'?`<div class="dmActions">${button('Preview','pdf-preview',e.id)}${button('Download','pdf-download',e.id)}${button('Email','email-preview',e.id)}</div>`:'No issued PDF']),'No letters issued yet.')}`;
    }
    function renderInvoices(state) {
      const view=participationView(state,context(),{search:searchInvoices,stage:invoiceStage});
      // Retain a selected historical stage if a data refresh removes its final invoice.
      const stages=[...new Set([...view.stages,...(Number(invoiceStage)>0?[Number(invoiceStage)]:[])])].sort((a,b)=>a-b);
      const rows=view.rows.map(({invoice:i,customer,lastSentStage,excluded,paid})=>{
        return [escape(i.invoiceNo),escape(customer.name),escape(i.dueDate),money(i.originalAmount??i.amount),money(i.outstandingAmount??i.outstanding),badge(lastSentStage?`DL${lastSentStage}`:'Not sent'),badge(excluded?'Manually excluded':paid?'Fully paid':'Automatic eligibility'),excluded?button('Remove exclusion · pending','reinstate',i.id,true):button('Exclude','exclude',i.id,paid||!state.enabled)];
      });
      container.querySelector('[data-dm-invoices]').innerHTML = `<div class="dmSectionHeading"><div><h3>Invoice Participation</h3><p>Fully paid invoices are excluded automatically; partial payments use the remaining balance. Manual exclusions persist until removed.</p></div>${button('Refresh invoice data','refresh-invoices')}</div><div class="dmParticipationFilters"><label class="dmSearch">Find customer or invoice<input type="search" value="${escape(searchInvoices)}" data-dm-search="invoices" placeholder="Search invoice participation"></label><label>Last letter sent<select data-dm-invoice-stage><option value="" ${!invoiceStage?'selected':''}>All letters</option><option value="not-sent" ${invoiceStage==='not-sent'?'selected':''}>Not sent</option>${stages.map(stage=>`<option value="${stage}" ${invoiceStage===String(stage)?'selected':''}>DL${stage}</option>`).join('')}</select></label></div><p class="dmHelp">Last letter sent is the latest letter with at least one successful recipient. Failed attempts do not change it.</p>${table(['Invoice','Customer','Due date','Invoice amount','Outstanding','Last letter sent','Participation','Action'],rows,searchInvoices.trim()||invoiceStage?'No invoices match these filters.':'No invoices available for this client.')}<p class="dmHelp">Agents can still exclude their assigned invoices on the existing invoice screen. Reinstatement scheduling is pending team confirmation.</p>`;
    }
    function refresh() {
      if(destroyed||!authorized()||!container.querySelector('[data-dm-summary]'))return;
      const state=scoped(api.getState(),context());
      const count=state.letterCount || 3,active=state.strategies.filter(s=>s.status==='active').length,issued=state.emails.filter(e=>e.status!=='failed').length;
      container.querySelector('[data-dm-summary]').innerHTML = `${badge(state.enabled?'Enabled':'Disabled')}<span><strong>${count}</strong> available letter stage${count===1?'':'s'}</span><span><strong>${active}</strong> active strateg${active===1?'y':'ies'}</span><span><strong>${issued}</strong> issued letter${issued===1?'':'s'}</span>`;
      renderScheduling(state); renderActivity(state); renderInvoices(state);
    }
    function scheduleRefresh() { if(!renderPending){renderPending=true;(root.requestAnimationFrame||setTimeout)(()=>{renderPending=false;refresh();});} }
    function switchSection(id) {
      if(!authorized()||!sections.some(([value])=>id===value))return;
      currentSection=id;
      container.querySelectorAll('[data-dm-section]').forEach(b=>{b.setAttribute('aria-selected',String(b.dataset.dmSection===id));b.tabIndex=b.dataset.dmSection===id?0:-1;});
      sections.forEach(([key])=>{container.querySelector(`#dm-panel-${key}`).hidden=key!==id;});
      if(id==='report')report?.refresh();
    }
    const modal=root.document.getElementById('adminModal');
    function closeModal() { if(!modal)return; modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');modal.innerHTML='';formStrategy=null; }
    function openModal(title,body,footer='') {
      modal.innerHTML=`<section class="adminModalCard dmModal" role="dialog" aria-modal="true" aria-labelledby="dm-dialog-title"><header><h2 id="dm-dialog-title">${escape(title)}</h2><button type="button" class="dmButton" data-dm-action="close-modal" aria-label="Close dialog">✕</button></header>${body}${footer}</section>`;
      modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');
    }
    function stageHtml(stage,index,state) {
      const f=stage.filters||{};
      const statuses=[...new Set([...state.invoices.map(i=>i.strategyMasterSubStatus||i.subStatus).filter(Boolean),...(f.invoiceStatuses||[])])].sort();
      return `<fieldset class="dmStage" data-dm-stage="${index}"><legend>DL${index+1}</legend><div class="dmFormGrid"><label>Letter template<select name="template-${index}" required>${state.templates.filter(t=>Number(t.stageNumber)===index+1).map(t=>`<option value="${escape(t.id)}" ${stage.templateId===t.id?'selected':''}>${escape(t.name || `Dunning Letter ${index+1}`)}</option>`).join('')}</select></label><label>${index?'Days after previous successful letter':'Days after invoice due date'}<input name="days-${index}" type="number" min="${index?1:0}" max="3650" step="1" value="${index?stage.intervalDays:(formStrategy?.firstStageDays??15)}" required></label></div><details><summary>Invoice eligibility filters</summary><div class="dmFormGrid"><label>Key account<select name="key-${index}">${['all','yes','no'].map(value=>`<option value="${value}" ${(f.keyAccountFilter||'all')===value?'selected':''}>${value==='all'?'All accounts':value==='yes'?'Key accounts only':'Other accounts only'}</option>`).join('')}</select></label><div><label class="dmCheck"><input type="checkbox" name="all-statuses-${index}" data-dm-all="statuses-${index}" ${f.invoiceStatuses===undefined?'checked':''}>All invoice statuses</label><label>Selected invoice statuses<select name="statuses-${index}" multiple ${f.invoiceStatuses===undefined?'disabled':''}>${statuses.map(value=>`<option value="${escape(value)}" ${(f.invoiceStatuses||[]).includes(value)?'selected':''}>${escape(value)}</option>`).join('')}</select></label></div><div><label class="dmCheck"><input type="checkbox" name="all-aging-${index}" data-dm-all="aging-${index}" ${f.agingBuckets===undefined?'checked':''}>All aging buckets</label><label>Selected aging buckets<select name="aging-${index}" multiple ${f.agingBuckets===undefined?'disabled':''}>${aging.map(value=>`<option value="${escape(value)}" ${(f.agingBuckets||[]).includes(value)?'selected':''}>${escape(value)}</option>`).join('')}</select></label></div></div></details></fieldset>`;
    }
    function coverageValues(strategy) {
      const f=strategy?.filters||{};
      if(f.coverage)return {...f.coverage,ids:f.invoiceIds||f.customerIds||[]};
      if(f.strategyMaster)return {...f.strategyMaster,legacy:true,ids:[]};
      return {targetType:f.invoiceIds?.length?'invoice':'customer',targetMode:f.invoiceIds?.length||f.customerIds?.length?'selected':'all',ids:f.invoiceIds||f.customerIds||[]};
    }
    function openStrategy(id) {
      const state=scoped(api.getState(),context());
      formStrategy=id?clone(state.strategies.find(s=>s.id===id)):null;
      if(id&&!formStrategy)throw new Error('This strategy is unavailable.');
      coverageChanged=false;
      formStages=clone(formStrategy?.stages||[{templateId:state.templates.find(t=>Number(t.stageNumber)===1)?.id,intervalDays:0}]);
      const coverage=coverageValues(formStrategy);
      openModal(formStrategy?'Edit Dunning strategy':'Add Dunning strategy',`<form data-dm-strategy><div class="dmModalBody"><p class="dmFormError" role="alert" hidden></p><div class="dmFormGrid"><label>Strategy name<input name="name" value="${escape(formStrategy?.name||'')}" maxlength="120" required></label><label>Status<select name="status">${['draft','active','paused','stopped'].map(s=>`<option ${s===(formStrategy?.status||'draft')?'selected':''}>${s}</option>`).join('')}</select></label><label>Sub-client<select name="subClient"><option value="">All sub-clients</option>${[...new Set([...state.customers.map(c=>c.subClientId),formStrategy?.subClientId].filter(Boolean))].map(value=>`<option value="${escape(value)}" ${value===formStrategy?.subClientId?'selected':''}>${escape(value)}</option>`).join('')}</select></label><label>Target type<select name="targetType" data-dm-coverage><option value="customer" ${coverage.targetType==='customer'?'selected':''}>Customers</option><option value="invoice" ${coverage.targetType==='invoice'?'selected':''}>Invoices</option></select></label><label>Coverage<select name="targetMode" data-dm-coverage><option value="all" ${coverage.targetMode==='all'?'selected':''}>All eligible records</option><option value="selected" ${coverage.targetMode==='selected'?'selected':''}>Selected records</option></select></label></div>${coverage.legacy?'<p class="dmHelp">Existing target selections and exclusions are retained. Change coverage explicitly to replace them.</p>':''}<div data-dm-targets></div><div data-dm-stages>${formStages.map((s,i)=>stageHtml(s,i,state)).join('')}</div><div class="dmActions">${button('Add letter stage','add-stage','',formStages.length>=state.letterCount)}${button('Remove last stage','remove-stage','',formStages.length<=1)}</div><p class="dmHelp">Available stages: ${state.letterCount}. New stages send only after they are added to an active strategy. Changes apply to unsent stages; sent letters stay unchanged.</p></div><footer>${button('Cancel','close-modal')}<button type="submit" class="dmButton is-primary">Save strategy</button></footer></form>`);
      renderTargets(coverage.ids);
    }
    function renderTargets(selectedIds=[]) {
      const form=modal.querySelector('[data-dm-strategy]'),state=scoped(api.getState(),context());
      if(!form)return;
      const kind=form.elements.targetType.value,mode=form.elements.targetMode.value;
      const target=modal.querySelector('[data-dm-targets]');
      if(mode!=='selected'){target.innerHTML='';return;}
      const rows=kind==='invoice'?state.invoices:state.customers;
      target.innerHTML=`<label>Selected ${kind==='invoice'?'invoices':'customers'}<select name="selectedTargets" multiple size="5" required>${rows.map(row=>`<option value="${escape(row.id)}" ${selectedIds.includes(row.id)?'selected':''}>${escape(kind==='invoice'?`${row.invoiceNo} · ${state.customers.find(c=>c.id===row.customerId)?.name||''}`:`${row.name} · ${row.customerCode||''}`)}</option>`).join('')}</select></label>`;
    }
    function readStages(form) {
      return formStages.map((old,i)=>{
        const filters=clone(old.filters||{});
        filters.keyAccountFilter=form.elements[`key-${i}`].value;
        if(form.elements[`all-statuses-${i}`].checked){delete filters.invoiceStatuses;delete filters.invoiceBroadSelections;delete filters.invoicePrimarySelections;}
        else filters.invoiceStatuses=[...form.elements[`statuses-${i}`].selectedOptions].map(o=>o.value);
        if(form.elements[`all-aging-${i}`].checked)delete filters.agingBuckets;
        else filters.agingBuckets=[...form.elements[`aging-${i}`].selectedOptions].map(o=>o.value);
        return {...old,templateId:form.elements[`template-${i}`].value,intervalDays:i?Number(form.elements[`days-${i}`].value):0,filters};
      });
    }
    async function refreshInvoices() {
      if(!authorized())return;
      const response=await root.fetch(new URL('../scripts/customersData.json',root.location.href));
      if(!response.ok)throw new Error('Invoice data could not load. Existing data is preserved.');
      const payload=await response.json();if(!authorized())return;
      const customers=Array.isArray(payload)?payload:payload.customers;
      if(!Array.isArray(customers))throw new Error('Invoice data has an invalid format.');
      root.dispatchEvent(new root.CustomEvent('inebura:invoice-portfolio',{detail:customers}));
      notify('Invoice data refreshed. Existing sent history is preserved.');
    }
    function showEligibility(id) {
      const rows=api.previewEligibility(id,today(),context()).filter(row=>row.invoice.clientId===context().clientId);
      switchSection('scheduling');
      container.querySelector('[data-dm-eligibility]').innerHTML=`<h4>Eligibility for today</h4>${table(['Invoice','Customer','Eligible date','Participation','Reason'],rows.map(r=>[escape(r.invoice.invoiceNo),escape(r.customer.name),escape(r.eligibleDate),badge(r.status),escape(r.reason)]),'No matching invoices.')}`;
    }
    function emailFor(id) { return scoped(api.getState(),context()).emails.find(e=>e.id===id); }
    async function action(event) {
      const nav=event.target.closest('[data-dm-section]');
      if(nav){switchSection(nav.dataset.dmSection);return;}
      const b=event.target.closest('[data-dm-action]');
      if(!b||b.disabled)return;
      const kind=b.dataset.dmAction,id=b.dataset.id;
      try {
        if(!authorized())return;
        if(kind==='close-modal'){closeModal();return;}
        if(kind==='add-strategy'||kind==='edit-strategy'){openStrategy(id);return;}
        if(kind==='add-stage'||kind==='remove-stage') {
          const form=modal.querySelector('[data-dm-strategy]');formStages=readStages(form);
          const firstDays=form.elements['days-0'].value;
          if(kind==='add-stage') {
            const state=api.getState();
            if(formStages.length>=state.letterCount)throw new Error('Increase the number of letters in Configurations first.');
            formStages.push({templateId:state.templates.find(t=>Number(t.stageNumber)===formStages.length+1)?.id,intervalDays:7});
          } else {if(formStages.length<=1)return;formStages.pop();}
          const previous=formStrategy;formStrategy={...formStrategy,firstStageDays:Number(firstDays)};
          modal.querySelector('[data-dm-stages]').innerHTML=formStages.map((s,i)=>stageHtml(s,i,scoped(api.getState(),context()))).join('');
          formStrategy=previous;
          modal.querySelector('[data-dm-action="add-stage"]').disabled=formStages.length>=api.getState().letterCount;
          modal.querySelector('[data-dm-action="remove-stage"]').disabled=formStages.length<=1;
          return;
        }
        if(['activate','pause','stop'].includes(kind)) {
          if(kind==='activate')await templates?.ready;
          if(!authorized())return;api.setStrategyStatus(id,{activate:'active',pause:'paused',stop:'stopped'}[kind],{...context(),date:today()});notify('Strategy updated.');
        } else if(kind==='eligibility')showEligibility(id);
        else if(kind==='exclude'){api.excludeInvoice(id,context());notify('Invoice excluded from future Dunning Letters.');}
        else if(kind==='refresh-invoices')await refreshInvoices();
        else if(kind==='pdf-preview'||kind==='pdf-download') {
          const email=emailFor(id);if(!email?.letterSnapshot||email.status==='failed')throw new Error('The issued letter is unavailable.');
          root.IneburaDunningDocuments[kind==='pdf-preview'?'preview':'download'](email.letterSnapshot);
        } else if(kind==='email-preview') {
          const email=emailFor(id);if(!email)throw new Error('This email is unavailable.');
          const policy="default-src 'none'; style-src 'unsafe-inline'; img-src 'none'; form-action 'none'";
          openModal(email.subject,`<div class="dmModalBody"><p><strong>To:</strong> ${escape((email.to||[]).join(', '))}</p><p><strong>Reference:</strong> ${escape(email.reference)}</p><iframe class="dmEmailFrame" title="Issued email" sandbox="" referrerpolicy="no-referrer" srcdoc="${escape(`<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="${policy}"></head><body>${email.bodyFormat==='text'?`<pre>${escape(email.body)}</pre>`:email.body}</body></html>`)}"></iframe></div>`);
        }
      } catch(error) {notify(error.message,true);}
    }
    async function submit(event) {
      if(!event.target.matches('[data-dm-strategy],[data-dm-run],[data-dm-conflict]'))return;
      event.preventDefault();
      const form=event.target;
      try {
        if(!authorized())return;
        if(form.matches('[data-dm-strategy]')) {
          await templates?.ready;if(!authorized())return;
          const input={name:form.elements.name.value,status:form.elements.status.value,firstStageDays:Number(form.elements['days-0'].value),subClientId:form.elements.subClient.value,coverageChanged,coverage:{targetType:form.elements.targetType.value,targetMode:form.elements.targetMode.value},selectedIds:[...(form.elements.selectedTargets?.selectedOptions||[])].map(o=>o.value),stages:readStages(form)};
          const payload=buildStrategy(input,formStrategy,scoped(api.getState(),context()),context());
          api.saveStrategy(payload,{...context(),date:today()});closeModal();notify('Dunning strategy saved. Only active strategies send letters.');
        } else if(form.matches('[data-dm-run]')) {
          await templates?.ready;if(!authorized())return;
          const result=api.runDaily(form.elements.date.value,{outcome:form.elements.outcome.value,actor:context()});
          notify(`Daily cycle complete: ${Math.max(0,(result.emailsCreated||0)-(result.failures||0))} letters sent, ${result.failures||0} failed, ${result.conflicts||0} conflicts.`);
        } else {api.resolveConflict(form.dataset.dmConflict,form.elements.strategy.value,context());notify('Strategy conflict resolved.');}
      } catch(error) {
        const box=form.querySelector('.dmFormError');
        if(box){box.textContent=error.message;box.hidden=false;box.scrollIntoView?.({block:'nearest'});}else notify(error.message,true);
      }
    }
    function change(event) {
      if(event.target.matches('[data-dm-invoice-stage]')){
        if(!authorized())return;
        const selected=event.target.value;
        if(selected && selected!=='not-sent' && !/^(?:[1-9]\d{0,2}|1000)$/.test(selected))return;
        invoiceStage=selected;refresh();container.querySelector('[data-dm-invoice-stage]').focus();return;
      }
      if(event.target.name==='selectedTargets'){if(!authorized())return;coverageChanged=true;}
      if(event.target.matches('[data-dm-coverage]')){if(!authorized())return;coverageChanged=true;renderTargets();}
      if(event.target.matches('[data-dm-all]')){const field=modal.querySelector(`[name="${event.target.dataset.dmAll}"]`);if(field)field.disabled=event.target.checked;}
    }
    function input(event) {
      if(!event.target.matches('[data-dm-search]'))return;
      const field=event.target.dataset.dmSearch,position=event.target.selectionStart;
      if(field==='activity')searchActivity=event.target.value;else searchInvoices=event.target.value;
      refresh();
      const replacement=container.querySelector(`[data-dm-search="${field}"]`);replacement.focus();replacement.setSelectionRange(position,position);
    }
    function keyboard(event) {
      const tab=event.target.closest('[data-dm-section]');
      if(!tab||!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
      event.preventDefault();const index=sections.findIndex(([key])=>key===currentSection);
      const next=event.key==='Home'?0:event.key==='End'?sections.length-1:(index+(event.key==='ArrowRight'?1:sections.length-1))%sections.length;
      switchSection(sections[next][0]);container.querySelector(`[data-dm-section="${sections[next][0]}"]`).focus();
    }
    container.addEventListener('click',action);container.addEventListener('submit',submit);container.addEventListener('input',input);container.addEventListener('keydown',keyboard);container.addEventListener('change',change);
    modal.addEventListener('click',action);modal.addEventListener('submit',submit);modal.addEventListener('change',change);
    const unsubscribe=api.subscribe(scheduleRefresh);
    refresh();
    const hash=String(root.location.hash||'').slice(1);if(sections.some(([key])=>key===hash))switchSection(hash);
    return {refresh,destroy(){destroyed=true;unsubscribe();templates?.destroy();report?.destroy();clearTimeout(noticeTimer);container.removeEventListener('click',action);container.removeEventListener('submit',submit);container.removeEventListener('input',input);container.removeEventListener('keydown',keyboard);container.removeEventListener('change',change);modal.removeEventListener('click',action);modal.removeEventListener('submit',submit);modal.removeEventListener('change',change);},templates,report};
  }
  function autoMount() { const container=root.document?.getElementById('dunningManagementMount');if(container)mount(container); }
  return {canManage,scoped,participationView,buildStrategy,mount,autoMount};
});
