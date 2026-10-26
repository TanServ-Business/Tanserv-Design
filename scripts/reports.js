(function () {
  'use strict';
  const dunning=window.IneburaReportsDunning;
  const legacy = dunning.legacyRoute(window.IneburaDunning, location.search);
  if (legacy) {
    const target = document.getElementById('reportsApp');
    if (legacy.authorized) {
      target.innerHTML = '<section class="rgTopBar"><div><h1 class="rgTopBarTitle">Dunning Letters has moved</h1><p>Opening Module Configuration…</p></div></section>';
      location.replace(legacy.destination);
    } else {
      target.innerHTML = '<section class="rgTopBar" role="alert"><div><h1 class="rgTopBarTitle">Dunning Letters access unavailable</h1><p>Only Client Admin can manage and view Dunning Letters.</p></div></section>';
    }
    return;
  }
  const sourceReports=dunning.register(window.IneburaReportsData||[]),core=window.IneburaReportsCore,mis=window.IneburaMisReports;
  let reports=sourceReports,access=null,accessStamp='';
  const el=id=>document.getElementById(id);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const icon=name=>`<i class="bi bi-${name}" aria-hidden="true"></i>`;
  const shortMonths=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const today=new Date();
  const monthLabel=(year,month)=>year===2026?['Jan-2026','Feb-2026','Mar-2026','Apr-2026','May-2026','Jun-2026','Jul-2026','Aug-2026','1 Sep - 27 Sep 2026','22 Oct - 21 Nov 2026','22 Nov - 21 Dec 2026','28 Dec 2026 - 27 Jan 2027'][month]:`${shortMonths[month]}-${year}`;
  let selected=null,open=false,job=null,jobTimer=null,jobToken=0,generated=null,filters={},sort={column:null,direction:1},page=1,search='',dateOpen=false,calendarYear=today.getFullYear(),calendarMonth=today.getMonth(),draftStart=null,draftEnd=null,draftMonths=[],columnMenu=null,toastTimer=null;
  let period={start:null,end:null,months:[]};
  const pageSize=15;
  const dateLabel=d=>d?`${d.getDate()} ${shortMonths[d.getMonth()]} ${d.getFullYear()}`:'--';
  const selectedMonthLabel=()=>period.months.map(m=>m.label).join(', ')||'All';
  function toast(message){el('reportToast').textContent=message;el('reportToast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>el('reportToast').hidden=true,4500);}
  function readAccess(){
    let state=null,error='',activeRole='',activeName='',identityError=false;
    try{activeRole=localStorage.getItem('activeUserRole')||'';activeName=localStorage.getItem('activeUserName')||'';}catch(problem){error=problem.message;identityError=true;}
    try{state=window.IneburaMisStore?.getState()||null;}catch(problem){error=problem.message;}
    const options={state,error,identityError,activeRole,activeName,search:location.search};
    const context=mis.context(options,window.IneburaMisCore);
    return {state,context,stamp:mis.fingerprint(options,context)};
  }
  function renderScope(){
    const target=el('misReportScope'),context=access.context;target.hidden=!context.requested;
    document.body.dataset.misReportContext=String(context.requested);
    if(!context.requested){target.innerHTML='';return;}
    target.classList.toggle('rgMisScopeDenied',!context.authorized);
    if(!context.authorized){target.innerHTML=`<div class="rgMisScopeHeader"><strong>MIS report access unavailable</strong></div><p>${esc(context.reason)}</p>`;return;}
    const summary=window.IneburaMisCore.scopeSummary(access.state,context.userId);
    target.innerHTML=`<div class="rgMisScopeHeader"><strong>${esc(context.user.name)}</strong><span class="rgMisScopeRole">${context.userRole==='mis-manager'?'MIS Manager':'MIS User'} · View &amp; download</span>${context.explicit?'<span class="rgMisScopeRole">Access preview</span>':''}</div><p>${esc(summary)}</p><p class="rgMisScopeNote">MIS Portfolio Preview demonstrates the agreed access using sample invoices. Final MIS report layouts and additional module permissions await team confirmation.</p>`;
  }
  function renderResources(){
    const restricted=access.context.requested,dialog=el('resourcesDialog');
    document.querySelector('.rgResources').hidden=restricted;
    if(restricted&&dialog.open)dialog.close();dialog.hidden=restricted;
    el('reportBundleLinks').innerHTML=restricted?'':'<a href="../outputs/reports-module-01a10b0c/Reports Excel Layout Templates.xlsx" download>All Excel templates</a><a href="../outputs/reports-module-01a10b0c/Reports Sample Data.xlsx" download>All sample data</a><a href="../assets/reports/downloads/reports-templates-and-samples.zip" download>Download complete ZIP</a>';
    el('resourcesList').innerHTML=restricted?'':sourceReports.filter(r=>!r.live).map(r=>`<tr><td>${esc(r.name)}</td><td>${r.headers.length}</td><td>${r.rows.length}</td><td><a href="../assets/reports/downloads/${r.id}-template.xlsx" download>Excel template</a><a href="../assets/reports/downloads/${r.id}-sample.xlsx" download>Excel sample</a><a href="../assets/reports/downloads/${r.id}-sample.csv" download>CSV</a></td></tr>`).join('');
  }
  function applyAccess(snapshot,announce){
    access=snapshot;accessStamp=snapshot.stamp;reports=mis.catalog(sourceReports,snapshot.context);
    selected=reports.find(report=>report.id===selected?.id)||(snapshot.context.requested?mis.descriptor:null);
    cancelJob(false);generated=null;filters={};sort={column:null,direction:1};page=1;open=false;dateOpen=false;search='';closeColumn();
    renderScope();renderResources();renderSelector();renderParameters();renderActions();renderResults();
    if(announce)toast('MIS identity or access changed. Generate the report again.');
  }
  function refreshAccess(announce=false){const snapshot=readAccess();if(snapshot.stamp===accessStamp)return false;applyAccess(snapshot,announce);return true;}
  function resolveReport(report,reportPeriod,expectedStamp,resourceTemplate=false){
    const snapshot=readAccess(),changed=snapshot.stamp!==accessStamp;
    if(changed)applyAccess(snapshot,false);
    if(expectedStamp&&snapshot.stamp!==expectedStamp)throw new Error('Report access changed. Generate the report again.');
    if(!report)throw new Error('Select an available report.');
    if(snapshot.context.requested){
      if(report.id!==mis.id)throw new Error('Reference reports and attachments are unavailable in MIS access.');
      return mis.resolve(window.IneburaMisCore,snapshot.state,snapshot.context,reportPeriod);
    }
    if(report.mis)throw new Error('MIS report access has changed. Select an available report.');
    if(resourceTemplate)return report;
    return report;
  }
  function resetReport(r){refreshAccess();if(r&&!reports.some(report=>report.id===r.id)){toast('This report is unavailable for the current user.');return;}document.querySelector('.rgResources > span').textContent='Reference sample data';cancelJob(false);selected=r;generated=null;filters={};sort={column:null,direction:1};page=1;open=false;dateOpen=false;search='';period={start:null,end:null,months:r?.parameter==='month'?[{year:today.getFullYear(),month:today.getMonth(),label:monthLabel(today.getFullYear(),today.getMonth())}]:[]};closeColumn();renderSelector();renderParameters();renderActions();renderResults();}
  function renderSelector(){
    el('reportTrigger').setAttribute('aria-expanded',String(open));
    el('reportTrigger').classList.toggle('open',open);
    el('reportTrigger').innerHTML=`<span class="rgFilterLabel">Report</span>${open?`<input class="rgTriggerInput" aria-label="Search reports" placeholder="Search report…" value="${esc(search)}">`:`<span class="rgFilterValuePill" data-tooltip="${esc(selected?.name||'Select…')}"><span class="rgFilterPillText">${esc(selected?.name||'Select…')}</span></span>`}${icon('caret-down-fill')}`;
    el('reportTrigger').lastElementChild.classList.add('rgFilterCaret');
    if(open){const input=el('reportTrigger').querySelector('input');input.addEventListener('click',e=>e.stopPropagation());input.addEventListener('input',()=>{search=input.value;renderOptions();});input.addEventListener('keydown',e=>{if(e.key==='ArrowDown'){e.preventDefault();el('reportOptions').querySelector('button')?.focus();}if(e.key==='Escape'){open=false;renderSelector();}});input.focus();}
    renderOptions();
  }
  function renderOptions(){
    const list=el('reportOptions');list.hidden=!open;list.classList.toggle('show',open);
    const found=reports.filter(r=>r.name.toLowerCase().includes(search.toLowerCase()));
    list.innerHTML=found.length?found.map(r=>`<li><button class="dropdown-item ${selected?.id===r.id?'active':''}" type="button" data-report="${r.id}">${esc(r.name)}</button></li>`).join(''):'<li><span class="dropdown-item text-muted">No reports found</span></li>';
    list.querySelectorAll('button').forEach(button=>button.addEventListener('click',()=>resetReport(reports.find(r=>r.id===button.dataset.report))));
  }
  function renderParameters(){
    const target=el('reportParameters');
    if(!selected?.parameter){target.innerHTML='';return;}
    const label=selected.parameter==='month'?'Month':'Date Range';
    const value=selected.parameter==='month'?selectedMonthLabel():period.start?`${dateLabel(period.start)} - ${dateLabel(period.end)}`:'All';
    target.innerHTML=`<div class="rgField"><div class="dateRangePicker"><button class="filterBtn" type="button" aria-expanded="${dateOpen}" aria-haspopup="dialog">${label}<span class="filterBadge">${esc(value)}</span></button><div id="reportDatePopup"></div></div></div>`;
    target.querySelector('.filterBtn').addEventListener('click',()=>{
      dateOpen=!dateOpen;closeColumn();if(dateOpen){draftStart=period.start;draftEnd=period.end;draftMonths=period.months.slice();calendarYear=period.start?.getFullYear()||today.getFullYear();calendarMonth=period.start?.getMonth()??today.getMonth();}renderParameters();
    });
    if(dateOpen)renderDatePopup();
  }
  function renderDatePopup(){
    const months=selected.parameter==='month';
    const header=`<div class="dateRangeHeader"><button class="dateRangeNavBtn" type="button" data-calendar="prev" aria-label="Previous ${months?'year':'month'}">${icon('chevron-left')}</button><div class="dateRangeMonth">${months?calendarYear:new Date(calendarYear,calendarMonth,1).toLocaleString('en',{month:'long',year:'numeric'})}</div><button class="dateRangeNavBtn" type="button" data-calendar="next" aria-label="Next ${months?'year':'month'}">${icon('chevron-right')}</button></div>`;
    let grid='';
    if(months){grid=`<div class="monthPickerGrid mt-2">${shortMonths.map((m,i)=>`<button class="dateCell ${draftMonths.some(x=>x.year===calendarYear&&x.month===i)?'selected':''}" type="button" data-month="${i}" title="${monthLabel(calendarYear,i)}" aria-pressed="${draftMonths.some(x=>x.year===calendarYear&&x.month===i)}">${m}</button>`).join('')}</div>`;}
    else{
      const first=new Date(calendarYear,calendarMonth,1).getDay(),days=new Date(calendarYear,calendarMonth+1,0).getDate();
      grid='<div class="dateRangeWeekdays mt-2">'+['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(x=>`<span>${x}</span>`).join('')+'</div><div class="dateRangeGrid mt-2">'+Array.from({length:first},()=>'<span></span>').join('')+Array.from({length:days},(_,i)=>{const d=new Date(calendarYear,calendarMonth,i+1);return `<button class="dateCell ${(+d===+draftStart||+d===+draftEnd)?'selected':''} ${draftStart&&draftEnd&&d>draftStart&&d<draftEnd?'inRange':''}" type="button" data-day="${i+1}" aria-label="${dateLabel(d)}">${i+1}</button>`;}).join('')+'</div>';
      grid+=`<div class="dateRangeHint mt-2">${!draftStart||draftEnd?'Select start date':'Select end date'}</div><div class="dateRangeValues mt-2">Start: <strong>${dateLabel(draftStart)}</strong>End: <strong>${dateLabel(draftEnd)}</strong></div>`;
    }
    const summary=months?`<div class="monthPickerSelection" title="${esc(draftMonths.map(m=>m.label).join(', '))}">${esc(draftMonths.map(m=>m.label).join(', ')||'All')}</div>`:'';
    el('reportDatePopup').innerHTML=`<div class="dateRangePopup" role="dialog" aria-label="${months?'Select working months':'Select date range'}">${header}${grid}<div class="${months?'monthPickerFooter':'dateRangeFooter'}">${summary}<div class="monthPickerActions"><button class="dateRangeClear" type="button">Clear</button><button class="dateRangeApply" type="button" ${!months&&(!draftStart||!draftEnd)?'disabled':''}>Apply</button></div></div></div>`;
    el('reportDatePopup').querySelectorAll('[data-calendar]').forEach(b=>b.onclick=()=>{const step=b.dataset.calendar==='next'?1:-1;if(months)calendarYear+=step;else {const d=new Date(calendarYear,calendarMonth+step,1);calendarYear=d.getFullYear();calendarMonth=d.getMonth();}renderDatePopup();});
    el('reportDatePopup').querySelectorAll('[data-month]').forEach(b=>b.onclick=()=>{const m=+b.dataset.month;const existing=draftMonths.findIndex(x=>x.year===calendarYear&&x.month===m);if(existing>=0)draftMonths.splice(existing,1);else draftMonths.push({year:calendarYear,month:m,label:monthLabel(calendarYear,m)});draftMonths.sort((a,b)=>a.year-b.year||a.month-b.month);renderDatePopup();});
    el('reportDatePopup').querySelectorAll('[data-day]').forEach(b=>b.onclick=()=>{const d=new Date(calendarYear,calendarMonth,+b.dataset.day);if(!draftStart||draftEnd){draftStart=d;draftEnd=null;}else if(d<draftStart){draftEnd=draftStart;draftStart=d;}else draftEnd=d;renderDatePopup();});
    el('reportDatePopup').querySelector('.dateRangeClear').onclick=()=>{period={start:null,end:null,months:[]};dateOpen=false;renderParameters();};
    el('reportDatePopup').querySelector('.dateRangeApply').onclick=()=>{period={start:draftStart,end:draftEnd,months:draftMonths.slice()};dateOpen=false;renderParameters();};
  }
  function renderActions(){
    if(!selected){el('reportActions').innerHTML='';return;}
    const busy=job?.status==='running';
    const denied=access?.context.requested&&!access.context.authorized;
    const ready=job?.status==='ready'?`<div class="rptReadyInline"><div class="rptReadyChip">${icon('check-circle-fill')}<span class="rptReadyText">${job.mode==='xlsx'?'File ready':'Report ready'}</span><button type="button" class="rptReadyAction">${icon(job.mode==='xlsx'?'download':'table')}${job.mode==='xlsx'?'Download':'View Report'}</button><button class="rptReadyDismiss" type="button" aria-label="Dismiss">${icon('x-lg')}</button></div></div>`:'';
    el('reportActions').innerHTML=`${ready}<div class="rptActions"><button class="rptActionBtn rptActionBtnGenerate" type="button" ${busy||denied?'disabled':''}>${icon(busy?'arrow-repeat':'play-circle')}${busy?'Generating…':'Generate'}</button>${busy?`<button class="rgCancelJobBtn" type="button" aria-label="Cancel this report">${icon('x-lg')}</button>`:''}<button class="rptActionBtn rptActionBtnDownload" type="button" ${busy||denied?'disabled':''}>${icon('download')} Download XLSX</button></div><button class="rgBtnClear" type="button">${icon('x-circle')} Clear</button>`;
    el('reportActions').querySelector('.rptActionBtnGenerate').onclick=()=>run('view');
    el('reportActions').querySelector('.rptActionBtnDownload').onclick=()=>run('xlsx');
    el('reportActions').querySelector('.rgBtnClear').onclick=()=>resetReport(null);
    el('reportActions').querySelector('.rgCancelJobBtn')?.addEventListener('click',()=>cancelJob(true));
    el('reportActions').querySelector('.rptReadyDismiss')?.addEventListener('click',()=>{job=null;renderActions();});
    el('reportActions').querySelector('.rptReadyAction')?.addEventListener('click',()=>{
      try {
        const readyJob=job;if(!readyJob)return;
        const report=resolveReport(readyJob.report,readyJob.period,readyJob.accessStamp);
        const rows=report.live||report.mis?report.rows:readyJob.rows;
        if(readyJob.mode==='xlsx') downloadExcel(report,rows,'',readyJob.period,readyJob.accessStamp);
        else {generated={report,rows,period:readyJob.period,accessStamp:readyJob.accessStamp};filters={};sort={column:null,direction:1};page=1;renderResults();}
        job=null;renderActions();
      } catch(error) { denyReport(error); }
    });
  }
  function cancelJob(announce){clearTimeout(jobTimer);jobToken++;job=null;if(announce){renderActions();toast('Report generation cancelled.');}}
  function run(mode){
    let report;
    try {report=resolveReport(selected,period);} catch(error) {denyReport(error);return;}
    const token=++jobToken;closeColumn();dateOpen=false;renderParameters();job={status:'running',mode,report,period:{...period},accessStamp,rows:report.live||report.mis?report.rows:core.parameterRows(report,period)};renderActions();
    jobTimer=setTimeout(()=>{if(token!==jobToken)return;if(refreshAccess(true))return;job.status='ready';renderActions();},450);
  }
  function denyReport(error){cancelJob(false);generated=null;filters={};closeColumn();renderActions();renderResults();toast(error.message);}
  function refreshIssued(){
    if(!generated)return false;
    try {
      const report=resolveReport(generated.report,generated.period,generated.accessStamp);
      if(report.live||report.mis)generated={...generated,report,rows:report.rows};
      return true;
    }
    catch(error){denyReport(error);return false;}
  }
  function resultRows(){return generated?core.sortRows(core.filterRows(generated.rows,filters),sort.column,sort.direction):[];}
  function renderResults(){
    const target=el('reportResults');if(!generated){target.innerHTML='';return;}if(!refreshIssued())return;
    const report=generated.report,rows=resultRows(),pages=Math.max(1,Math.ceil(rows.length/pageSize));page=Math.min(page,pages);
    const shown=rows.slice((page-1)*pageSize,page*pageSize),countFilters=Object.keys(filters).length;
    target.innerHTML=`<section class="rgResultCard"><div class="rgResultHeader"><div><div class="rgResultTitle">${esc(report.name)}</div></div><div class="d-flex gap-2">${countFilters?`<button type="button" class="rgClearFiltersBtn">${icon('x-circle')} Clear filters (${countFilters})</button>`:''}<button class="rgBtnDownloadFiltered" type="button">${icon('funnel')} Download Filtered</button></div></div><div class="rgTableWrap" tabindex="0" aria-label="${esc(report.name)} results"><table class="rgTable"><thead><tr class="rgTableHeaderRow">${report.headers.map((h,i)=>`<th title="${esc(h)}" aria-sort="${sort.column===i?(sort.direction===1?'ascending':'descending'):'none'}"><button type="button" data-sort="${i}" aria-label="Sort by ${esc(h)}"><span>${esc(h)}</span><span class="rgSortArrows"><i class="bi bi-caret-up-fill ${sort.column===i&&sort.direction===1?'sorted':''}"></i><i class="bi bi-caret-down-fill ${sort.column===i&&sort.direction===-1?'sorted':''}"></i></span></button></th>`).join('')}</tr><tr class="rgTableFilterRow">${report.headers.map((h,i)=>`<th><div class="rgColDropWrap"><button class="rgColPill ${Object.hasOwn(filters,i)?'active':''}" type="button" data-filter="${i}" title="${esc(h)}" aria-label="Filter ${esc(h)}" aria-expanded="false"><span class="rgColPillArrow">▼</span><span class="rgColPillText">${esc(filters[i]??(h.length>10?h.slice(0,10)+'…':h))}</span></button></div></th>`).join('')}</tr></thead><tbody>${shown.length?shown.map(row=>`<tr class="rgDataRow">${row.map(v=>`<td title="${esc(v)}">${esc(v)}</td>`).join('')}</tr>`).join(''):`<tr><td class="rgTableEmpty" colspan="${report.headers.length}">No data available for this report.</td></tr>`}</tbody></table></div>${rows.length>pageSize?`<div class="rgPagination"><span class="rgPagCount">Showing ${(page-1)*pageSize+1}–${Math.min(page*pageSize,rows.length)} of ${rows.length}</span><div class="rgPagControls"><button class="rgPageBtn" data-page="${page-1}" aria-label="Previous page" ${page===1?'disabled':''}>${icon('chevron-left')}</button>${Array.from({length:pages},(_,i)=>`<button class="rgPageBtn ${page===i+1?'active':''}" data-page="${i+1}" ${page===i+1?'aria-current="page"':''}>${i+1}</button>`).join('')}<button class="rgPageBtn" data-page="${page+1}" aria-label="Next page" ${page===pages?'disabled':''}>${icon('chevron-right')}</button></div></div>`:''}</section>`;
    target.querySelectorAll('[data-sort]').forEach(b=>b.onclick=()=>{const i=+b.dataset.sort;sort={column:i,direction:sort.column===i?-sort.direction:1};page=1;closeColumn();const scroll=target.querySelector('.rgTableWrap').scrollLeft;renderResults();target.querySelector('.rgTableWrap').scrollLeft=scroll;});
    target.querySelectorAll('[data-filter]').forEach(b=>b.onclick=()=>openColumn(+b.dataset.filter,b));
    target.querySelectorAll('[data-page]').forEach(b=>b.onclick=()=>{page=+b.dataset.page;closeColumn();renderResults();});
    target.querySelector('.rgClearFiltersBtn')?.addEventListener('click',()=>{filters={};page=1;closeColumn();renderResults();});
    target.querySelector('.rgBtnDownloadFiltered').onclick=()=>{if(!refreshIssued())return;if(generated.report.live||generated.report.mis){downloadExcel(generated.report,resultRows(),'_filtered',generated.period,generated.accessStamp);return;}downloadBlob(core.csv(generated.report.headers,resultRows()),generated.report.id+'_filtered.csv','text/csv;charset=utf-8');toast('Filtered CSV downloaded.');};
    target.querySelector('.rgTableWrap').addEventListener('scroll',closeColumn,{passive:true});
  }
  function closeColumn(){columnMenu?.remove();columnMenu=null;document.querySelectorAll('[data-filter][aria-expanded="true"]').forEach(b=>b.setAttribute('aria-expanded','false'));}
  function openColumn(index,button){
    if(!refreshIssued())return;
    const same=columnMenu?.dataset.column===String(index);closeColumn();if(same)return;
    columnMenu=document.createElement('div');columnMenu.className='rgColDropMenu';columnMenu.dataset.column=index;
    const rect=button.getBoundingClientRect();columnMenu.style.left=Math.max(8,Math.min(rect.left,innerWidth-288))+'px';columnMenu.style.top=Math.max(8,Math.min(rect.bottom+4,innerHeight-290))+'px';
    columnMenu.innerHTML='<div class="rgColDropSearch"><input placeholder="Search..." aria-label="Search filter values"></div><div class="rgColDropList"></div>';document.body.append(columnMenu);button.setAttribute('aria-expanded','true');
    const input=columnMenu.querySelector('input'),list=columnMenu.querySelector('.rgColDropList');
    const values=[...new Set(generated.rows.map(row=>String(row[index]??'')))].sort((a,b)=>a.localeCompare(b,undefined,{numeric:true}));
    function show(){if(!refreshIssued()){closeColumn();return;}const found=values.filter(v=>v.toLowerCase().includes(input.value.toLowerCase()));list.innerHTML=(Object.hasOwn(filters,index)?'<button type="button" class="rgColDropItem rgColDropShowAll" data-all="true">Show All</button>':'')+(found.length?found.map((v,i)=>`<button type="button" class="rgColDropItem ${filters[index]===v?'chosen':''}" data-value="${i}">${esc(v||'(Blank)')}</button>`).join(''):'<div class="rgColDropNoMatch">No matches</div>');list.querySelector('[data-all]')?.addEventListener('click',()=>{delete filters[index];page=1;closeColumn();renderResults();});list.querySelectorAll('[data-value]').forEach(b=>b.onclick=()=>{filters[index]=found[+b.dataset.value];page=1;closeColumn();renderResults();});}
    input.addEventListener('input',show);show();input.focus();
  }
  function downloadBlob(content,name,type){const url=URL.createObjectURL(new Blob([content],{type})),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  function downloadExcel(report,rows,suffix='',reportPeriod={},expectedStamp){
    try{
      const fresh=resolveReport(report,reportPeriod,expectedStamp,suffix==='_template');
      if(report.mis){rows=mis.approvedRows(report,rows,fresh);report=fresh;}
      else if(report.live)report=fresh;
    }catch(error){denyReport(error);return;}
    if(!window.XLSX){toast('The Excel export library could not load. Please reload and try again.');return;}
    const wb=XLSX.utils.book_new(),data=[report.headers,...rows.map(row=>row.map((v,c)=>{if(v===''||v==='—')return null;if(/^₹[\d,.-]+$/.test(v))return core.numeric(v);if(!/code|number|\bno\b|ref|phone|id|date|time/i.test(report.headers[c])&&/amount|value|balance|portfolio|^percentage|^count|^days|^overall|^coll vs/i.test(report.headers[c]))return core.numeric(v)??v;return v;}))];
    const sheet=XLSX.utils.aoa_to_sheet(data);sheet['!cols']=report.headers.map(h=>({wch:Math.max(15,Math.min(65,h.length+2))}));XLSX.utils.book_append_sheet(wb,sheet,report.name.slice(0,31));XLSX.writeFile(wb,report.id+suffix+'.xlsx');toast('Excel report downloaded.');
  }
  el('reportTrigger').addEventListener('click',()=>{refreshAccess();if(!open){open=true;dateOpen=false;renderParameters();closeColumn();renderSelector();}});
  el('reportTrigger').addEventListener('keydown',e=>{if(e.target.tagName==='INPUT')return;if(['Enter',' ','ArrowDown'].includes(e.key)){e.preventDefault();open=true;renderSelector();}});
  document.addEventListener('click',e=>{const path=e.composedPath();const inside=selector=>path.some(n=>n instanceof Element&&n.matches(selector));if(!inside('#reportSelector')&&open){open=false;renderSelector();}if(!inside('.dateRangePicker')&&dateOpen){dateOpen=false;renderParameters();}if(!inside('.rgColDropMenu')&&!inside('[data-filter]'))closeColumn();});
  document.addEventListener('keydown',e=>{if(e.key==='Escape'){open=false;dateOpen=false;closeColumn();renderSelector();renderParameters();}});
  window.addEventListener('resize',closeColumn);
  el('reportResources').onclick=()=>{refreshAccess();if(access.context.requested){toast('Reference attachments are unavailable in MIS access.');return;}el('resourcesDialog').showModal();};el('closeResources').onclick=()=>el('resourcesDialog').close();
  el('resourcesDialog').addEventListener('click',e=>{if(e.target===el('resourcesDialog')){const r=e.target.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)e.target.close();}});
  el('resourcesDialog').addEventListener('click',event=>{refreshAccess();if(access.context.requested){event.preventDefault();event.stopImmediatePropagation();}},true);
  window.addEventListener('inebura:mis-change',()=>refreshAccess(true));
  window.addEventListener('storage',e=>{if(['activeUserRole','activeUserName',window.IneburaMisStore?.KEY,null].includes(e.key)){refreshAccess(true);}});
  window.addEventListener('popstate',()=>refreshAccess(true));
  window.addEventListener('focus',()=>refreshAccess(true));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshAccess(true);});
  // Same-tab localStorage identity changes do not emit the storage event.
  // Every report action also checks synchronously, including saved handlers.
  window.setInterval(()=>{if(!document.hidden)refreshAccess(true);},700);
  function setReportBrand(){const image=document.querySelector('#relationshipLogo img');if(image){image.src='../assets/reports/reference/xeon-logo.jpg';image.alt='Xeon logo';}const logo=document.querySelector('.logoInebura');if(logo)logo.src='../assets/reports/reference/inebura-logo.png';}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',setReportBrand);else setReportBrand();
  refreshAccess();
  const initial=new URLSearchParams(location.search).get('report');if(initial){const r=reports.find(r=>r.id===initial);if(r)resetReport(r);}
})();
