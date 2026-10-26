/* Report-card dashboard for the isolated MIS design workspace. */
(() => {
  'use strict';
  const app = document.getElementById('misDashboardApp');
  if (!app) return;
  const core = window.IneburaMisCore, store = window.IneburaMisStore;
  const model = window.IneburaMisDashboard, identity = window.IneburaMisReports, reports = window.IneburaReportsCore;
  const $ = id => document.getElementById(id);
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const integer = value => Number(value || 0).toLocaleString('en-IN');
  const money = value => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(Number(value || 0));
  const percent = value => value == null ? '—' : `${Math.round(value)}%`;
  const fraction = (part,total) => total ? part/total*100 : null;
  const palette = {purple:'#5c258d',teal:'#1ca58e',amber:'#e8ad43',lavender:'#d8c8f0',pale:'#eceef5',text:'#586b8a'};
  const definitions = [
    ['odm','ODM Report','Invoice status for your selected portfolio.'],
    ['credit','Credit Report','Credit usage and available balance.'],
    ['achievement','Achievement Report','Collection achievement against commitment.'],
    ['submission','Submission Report','Submitted and not submitted, by mode.'],
    ['acknowledgement','Submission vs Acknowledgement','Acknowledgement status for submitted invoices.'],
    ['issues','Issue Tracker Report','Invoices with issues by resolution status.']
  ];
  const charts = new Map();
  let selectedIds = null, selectedKind = null, last = null, view = 'dashboard', optionKey = '', query = '', timer;
  let period = {start:'2026-10-01',end:'2026-10-20'};
  const roleLabel = value => core.userRole(value) === 'agent-manager' ? 'Agent cum Manager' : 'Agent';
  function notify(message) {
    const target=$('misDashboardToast');clearTimeout(timer);target.textContent=message;target.hidden=false;
    timer=setTimeout(()=>{target.hidden=true;},4500);
  }
  function current() {
    if (!core || !store || !model || !identity || !reports) throw new Error('The MIS dashboard could not be loaded. Refresh this page.');
    const state=store.getState();
    const resolved=identity.context({state,search:location.search,activeRole:localStorage.getItem('activeUserRole'),activeName:localStorage.getItem('activeUserName')},core);
    if (!resolved.authorized) throw new Error(resolved.reason || 'No active MIS user matches this session.');
    const args={state,userId:resolved.userId,filter:{kind:selectedKind || undefined,ids:selectedIds},period};
    const snapshot=model.snapshot(args);
    if (!snapshot.authorized) throw new Error(snapshot.reason);
    return {state,args,snapshot};
  }
  function dispose(id) {
    const chart=charts.get(id);if(chart){chart.destroy();charts.delete(id);}
  }
  function disposeAll() {for(const key of [...charts.keys()])dispose(key);}
  function renderCardShells() {
    $('misReportGrid').innerHTML=definitions.map(([id,name,description])=>`<article class="misReportCard" id="misCard-${id}" aria-labelledby="misCardTitle-${id}"><header><h2 id="misCardTitle-${id}">${name}</h2><button type="button" class="misDownload" data-mis-download="${id}" aria-label="Download ${name} as CSV"><i class="bi bi-download" aria-hidden="true"></i><span>Download</span></button></header><p class="misCardSubtitle">${description}</p><div class="misCardBody" id="misCardBody-${id}"></div><p id="misCoverage-${id}" class="misCoverage" hidden></p></article>`).join('');
  }
  function chart(id,type,data,options={}) {
    dispose(id);
    if (!window.Chart) throw new Error('Charts could not be loaded. Refresh this page.');
    const canvas=$(id);if(!canvas)return;
    const instance=new window.Chart(canvas,{type,data,options:{responsive:true,maintainAspectRatio:false,animation:false,plugins:{legend:{display:false},tooltip:{enabled:true}},...options}});
    charts.set(id,instance);
  }
  function legend(label,value,color,share=null) {
    return `<div class="misLegendRow"><span class="misLegendDot" style="background:${color}" aria-hidden="true"></span><span class="misLegendText">${esc(label)}</span><span class="misLegendValue">${esc(value)}${share==null?'':`<small class="misLegendPercent">${percent(share)}</small>`}</span></div>`;
  }
  function donutBody(id,center,caption,entries,extra='') {
    return `<div class="misDoughnutLayout"><div class="misDonut"><canvas id="${id}" role="img" aria-label="${esc(entries.map(item=>`${item.label}: ${item.value}`).join('; '))}"></canvas><div class="misDonutCenter"><strong>${esc(center)}</strong><span>${esc(caption)}</span></div></div><div class="misLegend">${entries.map(item=>legend(item.label,item.formatted ?? integer(item.value),item.color,item.share)).join('')}${extra}</div></div>`;
  }
  function drawDonut(id,entries) {
    const total=entries.reduce((sum,item)=>sum+item.value,0);
    chart(id,'doughnut',{labels:total?entries.map(item=>item.label):['No records'],datasets:[{data:total?entries.map(item=>item.value):[1],backgroundColor:total?entries.map(item=>item.color):[palette.pale],borderWidth:0,hoverOffset:3}]},{cutout:'62%',plugins:{legend:{display:false},tooltip:{enabled:total>0}}});
  }
  function progress(id,value,total,color,label) {
    const safeTotal=Math.max(total,value,0);
    chart(id,'bar',{labels:[label],datasets:[{data:[value],backgroundColor:color,borderRadius:7,borderSkipped:false,barThickness:28},{data:[Math.max(0,safeTotal-value)],backgroundColor:palette.pale,borderRadius:7,borderSkipped:false,barThickness:28}]},{indexAxis:'y',scales:{x:{display:false,stacked:true,min:0,max:safeTotal || 1},y:{display:false,stacked:true}},plugins:{legend:{display:false},tooltip:{callbacks:{label:context=>context.datasetIndex===0?`${label}: ${integer(value)}`:''},filter:context=>context.datasetIndex===0}}});
  }
  const progressHtml=(id,label)=>`<div class="misProgressCanvas"><canvas id="${id}" role="img" aria-label="${esc(label)}"></canvas></div>`;
  function renderCards(snapshot) {
    disposeAll();
    for (const [id] of definitions) {
      const card=snapshot.cards[id],target=$(`misCardBody-${id}`),button=$(`misCard-${id}`).querySelector('button'),coverage=$(`misCoverage-${id}`);
      button.disabled=!card.available || card.invoiceCount===0;
      coverage.hidden=card.complete || !card.available;
      coverage.textContent=`Data available for ${card.coveredCount} of ${card.invoiceCount} selected invoices.`;
      target.className='misCardBody';
      if(!card.available || card.invoiceCount===0) {
        target.innerHTML=`<div class="misCardEmpty"><i class="bi bi-bar-chart" aria-hidden="true"></i>${card.invoiceCount===0?'No invoices in this selection.':'Report data is not available for the selected portfolio.'}</div>`;
        continue;
      }
      const m=card.metrics;
      if(id==='odm') {
        const entries=[{label:'Untouched',value:m.untouched,color:palette.amber},{label:'Tracking',value:m.tracking,color:palette.purple},{label:'Collected',value:m.collected,color:palette.teal}].map(item=>({...item,share:fraction(item.value,m.total)}));
        target.innerHTML=donutBody('misOdmChart',integer(m.total),'invoices',entries);drawDonut('misOdmChart',entries);
      }
      if(id==='credit') {
        target.innerHTML=`<div class="misMetricRow misCreditTotal"><span>Total credit</span><strong>${money(m.total)}</strong></div><div class="misMetricRow"><span>Used</span><strong>${money(m.used)} <small>(${percent(m.usagePercent)})</small></strong></div>${progressHtml('misCreditUsed',`Credit used ${money(m.used)} of ${money(m.total)}`)}<div class="misMetricRow"><span>Available</span><strong>${money(m.balance)} <small>(${percent(fraction(m.balance,m.total))})</small></strong></div>${progressHtml('misCreditBalance',`Credit balance ${money(m.balance)} of ${money(m.total)}`)}`;
        progress('misCreditUsed',m.used,m.total,palette.purple,'Used');progress('misCreditBalance',m.balance,m.total,palette.teal,'Available');
      }
      if(id==='achievement') {
        const entries=[{label:'Achieved',value:m.achieved,formatted:money(m.achieved),color:palette.purple,share:m.achievementPercent},{label:'Remaining',value:m.remaining,formatted:money(m.remaining),color:palette.lavender,share:fraction(m.remaining,m.committed)}];
        target.innerHTML=donutBody('misAchievementChart',percent(m.achievementPercent),m.achievementPercent==null?'no commitment':'achieved',entries,`<div class="misCommitment"><span>Committed</span><strong>${money(m.committed)}</strong></div>`);
        drawDonut('misAchievementChart',entries);
      }
      if(id==='submission') {
        const modes=m.modes.filter(mode=>mode.id!=='unspecified' || mode.total>0);
        target.innerHTML=`<div class="misSubmissionChart"><canvas id="misSubmissionChart" role="img" aria-label="${esc(modes.map(mode=>`${mode.name}: ${mode.submitted} submitted, ${mode.notSubmitted} not submitted`).join('; '))}"></canvas></div><div class="misSubmissionLegend"><span><i class="misLegendDot" style="background:${palette.purple}"></i>Submitted</span><span><i class="misLegendDot" style="background:${palette.lavender}"></i>Not submitted</span></div><div class="misSubmissionSummary"><div><span>Submitted</span><strong>${integer(m.submitted)}</strong> <small>(${percent(fraction(m.submitted,m.total))})</small></div><div><span>Not submitted</span><strong>${integer(m.notSubmitted)}</strong> <small>(${percent(fraction(m.notSubmitted,m.total))})</small></div></div>`;
        chart('misSubmissionChart','bar',{labels:modes.map(mode=>mode.name),datasets:[{label:'Submitted',data:modes.map(mode=>mode.submitted),backgroundColor:palette.purple,borderRadius:3,maxBarThickness:31},{label:'Not submitted',data:modes.map(mode=>mode.notSubmitted),backgroundColor:palette.lavender,borderRadius:3,maxBarThickness:31}]},{layout:{padding:{top:10}},scales:{x:{grid:{display:false},ticks:{color:palette.text,font:{size:11}}},y:{beginAtZero:true,ticks:{precision:0,color:palette.text,font:{size:10}},grid:{color:'#e8edf5'},border:{display:false}}},plugins:{legend:{display:false},tooltip:{enabled:true}}});
      }
      if(id==='acknowledgement') {
        target.classList.add('misAcknowledgement');
        target.innerHTML=`<div class="misMetricRow"><span>Submitted</span><strong>${integer(m.submitted)}</strong></div>${progressHtml('misSubmitted',`${m.submitted} submitted invoices`)}<div class="misMetricRow"><span>Acknowledged</span><strong>${integer(m.acknowledged)} <small>(${percent(m.acknowledgementPercent)})</small></strong></div>${progressHtml('misAcknowledged',`${m.acknowledged} acknowledged of ${m.submitted} submitted invoices`)}<div class="misPending"><i class="bi bi-clock" aria-hidden="true"></i><div><span>Pending acknowledgement</span><strong>${integer(m.pending)}</strong><small>(${percent(fraction(m.pending,m.submitted))})</small></div></div>`;
        progress('misSubmitted',m.submitted,m.submitted,palette.purple,'Submitted');progress('misAcknowledged',m.acknowledged,m.submitted,palette.teal,'Acknowledged');
      }
      if(id==='issues') {
        const entries=[{label:'Open',value:m.unresolved,color:palette.amber},{label:'Resolved',value:m.resolved,color:palette.teal}].map(item=>({...item,share:fraction(item.value,m.withIssues)}));
        target.innerHTML=donutBody('misIssuesChart',integer(m.withIssues),'invoices with issues',entries);drawDonut('misIssuesChart',entries);
      }
    }
  }
  function filterSearch() {
    const term=$('misScopeSearch').value.trim().toLowerCase();
    const options=[...$('misScopeOptions').querySelectorAll('.misScopeOption')];
    options.forEach(option=>{option.hidden=!option.textContent.toLowerCase().includes(term);});
    $('misScopeNoResults').hidden=options.some(option=>!option.hidden);
  }
  function renderScope(snapshot,state) {
    const {kind,label,items}=snapshot.filterOptions,agents=kind==='assignees',noun=agents?'agents':'subclients';
    const qualifier=snapshot.userRole==='mis-manager' || snapshot.scopeKind==='client'?'permitted':'tagged';
    const key=JSON.stringify([kind,items]);
    if(optionKey!==key) {
      optionKey=key;
      $('misScopeOptions').innerHTML=items.map(item=>`<label class="misScopeOption"><input type="checkbox" data-mis-scope="${esc(item.id)}"><span>${esc(item.name)}${agents?`<small>${esc(roleLabel(state.users.find(user=>user.id===item.id)?.role))}</small>`:''}</span></label>`).join('');
    }
    $('misScopeLabel').textContent=label;
    $('misScopeValue').textContent=snapshot.allRequested?`All ${qualifier} ${noun} (${items.length})`:`${snapshot.selectedIds.length} of ${items.length} ${noun} selected`;
    $('misScopeSearch').placeholder=`Search ${qualifier} ${noun}`;
    $('misSelectAllLabel').textContent=`All ${qualifier} ${noun} (${items.length})`;
    const all=$('misSelectAll');all.checked=snapshot.allRequested || (items.length>0 && snapshot.allSelected);all.indeterminate=!all.checked && snapshot.selectedIds.length>0;
    all.disabled=items.length===0;
    for(const input of $('misScopeOptions').querySelectorAll('[data-mis-scope]'))input.checked=snapshot.selectedIds.includes(input.dataset.misScope);
    $('misCumulativeValue').textContent=`Cumulative totals for ${snapshot.selectedIds.length} selected ${snapshot.selectedIds.length===1?(agents?'agent':'subclient'):noun}`;
    filterSearch();
  }
  const displayDay=value=>new Date(`${value}T00:00:00`).toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'});
  function renderPeriod() {
    const label=period.start && period.end?`${displayDay(period.start)} – ${displayDay(period.end)}`:period.start?`From ${displayDay(period.start)}`:period.end?`Through ${displayDay(period.end)}`:'All dates';
    $('misPeriodValue').textContent=label;
    $('misPeriodStart').value=period.start;$('misPeriodEnd').value=period.end;
  }
  function selectedInvoices(state,snapshot) {
    const ids=new Set(snapshot.selectedInvoiceIds);
    return core.visibleInvoices(state,snapshot.userId).filter(invoice=>ids.has(invoice.id));
  }
  function detailRows(state,snapshot) {
    const people=new Map(state.users.map(user=>[user.id,user.name])),clients=new Map(state.clients.map(client=>[client.id,client.name])),subs=new Map(state.subclients.map(sub=>[sub.id,sub.name]));
    const invoices=selectedInvoices(state,snapshot);
    if(view==='invoices')return {headers:['Invoice','Customer','Client / Subclient','Assigned to','Invoice date','Outstanding'],rows:invoices.map(invoice=>[invoice.invoiceNo,invoice.customerName,`${clients.get(invoice.clientId)||invoice.clientId} / ${subs.get(invoice.subclientId)||'—'}`,people.get(invoice.assigneeId)||invoice.assigneeId,invoice.invoiceDate,money(invoice.outstanding)])};
    const customers=new Map();
    for(const invoice of invoices) {
      const key=JSON.stringify([invoice.clientId,invoice.customerName]);
      if(!customers.has(key))customers.set(key,{name:invoice.customerName,client:clients.get(invoice.clientId)||invoice.clientId,count:0,outstanding:0});
      const customer=customers.get(key);customer.count++;customer.outstanding+=Number(invoice.outstanding)||0;
    }
    return {headers:['Customer','Client','Visible invoices','Outstanding'],rows:[...customers.values()].map(customer=>[customer.name,customer.client,integer(customer.count),money(customer.outstanding)])};
  }
  function renderDetail(state,snapshot) {
    const target=$('misDashboardDetail');
    if(view==='dashboard'){target.hidden=true;$('misReportGrid').hidden=false;return;}
    $('misReportGrid').hidden=true;target.hidden=false;
    if(view==='schedule') {
      target.innerHTML='<h2>Schedule &amp; Share</h2><p>Scheduling and recipient permissions for MIS users are awaiting team clarification.</p><button type="button" class="misDownload" data-mis-back>Back to reports</button>';
      return;
    }
    const data=detailRows(state,snapshot),term=query.trim().toLowerCase(),rows=data.rows.filter(row=>row.some(cell=>String(cell).toLowerCase().includes(term)));
    target.innerHTML=`<div class="misDetailToolbar"><div><h2>${view==='invoices'?'Invoice Overview':'Customer Overview'}</h2><span class="misCardSubtitle">${rows.length} ${view==='invoices'?'invoices':'customers'} · Read only · Selected portfolio</span></div><button type="button" class="misDownload" data-mis-back>Back to reports</button></div><div class="misDetailToolbar"><input id="misDetailSearch" type="search" aria-label="Search selected ${view}" placeholder="Search ${view}…" value="${esc(query)}"></div><div class="misTableWrap" tabindex="0" aria-label="Selected ${view}"><table class="misDataTable"><thead><tr>${data.headers.map(value=>`<th>${esc(value)}</th>`).join('')}</tr></thead><tbody>${rows.map(row=>`<tr>${row.map(value=>`<td>${esc(value)}</td>`).join('')}</tr>`).join('')||`<tr><td colspan="${data.headers.length}">No ${view} in this selection.</td></tr>`}</tbody></table></div>`;
  }
  function scopedHeaderLinks(userId) {
    for(const link of document.querySelectorAll('[data-shared-header] a[href]')) {
      const url=new URL(link.href,location.href);
      if(url.origin===location.origin && /\/(reports|LPmis)\.html$/.test(url.pathname)) {
        url.searchParams.set('misUser',userId);link.href=url.href;
      }
    }
  }
  function denied(message) {
    disposeAll();last=null;$('misDashboardFilters').hidden=true;$('misDashboardDetail').hidden=true;$('misReportGrid').hidden=false;
    $('misReportGrid').innerHTML=`<div class="misDenied"><h2>MIS access unavailable</h2><p>${esc(message)}</p><p>This local sample can be reviewed using a sample MIS identity.</p><a href="LPmis.html?misUser=mis-agent">Open sample MIS User</a><a href="LPmis.html?misUser=mgr-west">Open sample MIS Manager</a></div>`;
    $('misDashboardSample').textContent='Sample workspace';
  }
  function refresh() {
    try {
      const {state,snapshot}=current();
      if(!$('misCard-odm'))renderCardShells();
      if(snapshot.filterValidation.invalidKind)selectedIds=[];
      selectedKind=snapshot.filterOptions.kind;
      if(selectedIds!==null)selectedIds=snapshot.selectedIds.slice();
      last=snapshot;$('misDashboardFilters').hidden=false;
      $('misDashboardSample').textContent=`Sample data · ${snapshot.userName}`;
      const note=$('misDashboardNotice');note.hidden=snapshot.filterValidation.valid;
      note.textContent='Your available mappings changed. Only the remaining permitted selections are shown. Choose All tagged to review your current combined portfolio.';
      renderScope(snapshot,state);renderPeriod();renderCards(snapshot);renderDetail(state,snapshot);scopedHeaderLinks(snapshot.userId);
    } catch(error) {denied(error.message);}
  }
  function download(cardId) {
    try {
      const {args,snapshot}=current(),card=snapshot.cards[cardId];
      if(!card || card.invoiceCount===0)throw new Error('No invoices are selected for this report.');
      const file=model.reportRows(cardId,args);
      if(!file.rows.length)throw new Error('No report data is available for the selected portfolio.');
      const blob=new Blob([reports.csv(file.headers,file.rows)],{type:'text/csv;charset=utf-8;'});
      const url=URL.createObjectURL(blob),link=document.createElement('a');
      const name=definitions.find(([id])=>id===cardId)[1].toLowerCase().replace(/[^a-z0-9]+/g,'-');
      link.href=url;link.download=`${name}_${period.start||'all'}_${period.end||'dates'}.csv`;document.body.append(link);link.click();link.remove();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      notify(`${file.rows.length} ${file.rows.length===1?'row':'rows'} downloaded for your selected portfolio.`);
      refresh();
    } catch(error) {refresh();notify(error.message);}
  }
  function changeView(next) {
    view=next;query='';
    const names={dashboard:'MIS Dashboard',invoices:'Invoice Overview',customers:'Customer Overview',schedule:'Schedule & Share'};
    $('misDashboardTitle').textContent=names[next];
    $('misDashboardSubtitle').textContent=next==='dashboard'?'Your reports, at a glance.':'Your selected portfolio.';
    const ids={dashboard:'reportOverviewBtn',invoices:'invoiceOverviewBtn',customers:'customerOverviewBtn',schedule:'scheduleShareBtn'};
    for(const button of $('misQuickActions').querySelectorAll('button')){const active=button.id===ids[next];button.classList.toggle('is-active',active);button.setAttribute('aria-pressed',String(active));}
    refresh();$('misDashboardTitle').focus({preventScroll:true});
  }
  function init() {
    const actions=document.querySelector('.managerMain .actionPanel');
    if(actions)$('misQuickActions').append(actions);
    renderCardShells();
    $('reportOverviewBtn')?.addEventListener('click',()=>changeView('dashboard'));
    $('invoiceOverviewBtn')?.addEventListener('click',()=>changeView('invoices'));
    $('customerOverviewBtn')?.addEventListener('click',()=>changeView('customers'));
    $('scheduleShareBtn')?.addEventListener('click',()=>changeView('schedule'));
    app.addEventListener('click',event=>{
      const downloadButton=event.target.closest('[data-mis-download]');if(downloadButton){download(downloadButton.dataset.misDownload);return;}
      if(event.target.closest('[data-mis-back]'))changeView('dashboard');
    });
    $('misScopeSearch').addEventListener('input',filterSearch);
    $('misScopeOptions').addEventListener('change',event=>{
      if(!event.target.matches('[data-mis-scope]') || !last)return;
      selectedIds=[...$('misScopeOptions').querySelectorAll('[data-mis-scope]:checked')].map(input=>input.dataset.misScope);refresh();
    });
    $('misSelectAll').addEventListener('change',event=>{selectedIds=event.target.checked?null:[];refresh();});
    $('misScopeClear').addEventListener('click',()=>{selectedIds=[];refresh();});
    $('misScopeDone').addEventListener('click',()=>{$('misScopeDropdown').open=false;$('misScopeDropdown').querySelector('summary').focus();});
    $('misPeriodForm').addEventListener('submit',event=>{
      event.preventDefault();const start=$('misPeriodStart').value,end=$('misPeriodEnd').value,error=$('misPeriodError');
      if(start && end && start>end){error.textContent='From date must be on or before To date.';error.hidden=false;return;}
      period={start,end};error.hidden=true;$('misPeriodDropdown').open=false;refresh();
    });
    $('misPeriodAll').addEventListener('click',()=>{period={start:'',end:''};$('misPeriodError').hidden=true;$('misPeriodDropdown').open=false;refresh();});
    $('misDashboardDetail').addEventListener('input',event=>{
      if(event.target.id!=='misDetailSearch')return;
      const cursor=event.target.selectionStart;query=event.target.value;
      try {const {state,snapshot}=current();renderDetail(state,snapshot);const input=$('misDetailSearch');input.focus();if(input.type!=='search')input.setSelectionRange(cursor,cursor);}catch(error){denied(error.message);}
    });
    document.addEventListener('click',event=>{for(const id of ['misScopeDropdown','misPeriodDropdown']){const detail=$(id);if(detail.open && !detail.contains(event.target))detail.open=false;}});
    document.addEventListener('keydown',event=>{if(event.key==='Escape'){for(const id of ['misScopeDropdown','misPeriodDropdown']){const detail=$(id);if(detail.open){detail.open=false;detail.querySelector('summary').focus();event.preventDefault();}}}});
    document.addEventListener('click',event=>{
      const link=event.target.closest('a[data-module="landing-mis"]');if(!link)return;
      event.preventDefault();event.stopImmediatePropagation();
      try {const {snapshot}=current();const url=new URL('LPmis.html',location.href);url.searchParams.set('misUser',snapshot.userId);location.assign(url.href);}catch(error){denied(error.message);}
    },true);
    window.addEventListener('inebura:mis-change',refresh);
    window.addEventListener('storage',event=>{if(event.key===store?.KEY || event.key===null || ['activeUserRole','activeUserName'].includes(event.key))refresh();});
    window.addEventListener('focus',refresh);
    window.addEventListener('pageshow',refresh);
    refresh();
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
