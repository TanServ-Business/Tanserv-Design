/* Keep invoice participation connected to the Dunning Letters module. */
(() => {
  'use strict';
  const core = window.IneburaDunning;
  if (!core) return;
  const admin = location.pathname.endsWith('/admin.html');
  const base = admin ? '' : 'pages/';
  const escape = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = n => Number(n || 0).toLocaleString('en-IN', {minimumFractionDigits:2, maximumFractionDigits:2});
  const actor = () => core.getContext();
  const manage = () => actor().role==='client-admin';
  const canExclude = () => ['client-admin','agent'].includes(actor().role);
  let currentId = '', sourceError = '', syncing = false, scheduled = false, portfolioFingerprint = '';
  function iso(value) {
    const raw = String(value ?? '').trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0,10);
    const dayFirst = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (dayFirst) return `${dayFirst[3]}-${dayFirst[2].padStart(2,'0')}-${dayFirst[1].padStart(2,'0')}`;
    if (!raw) return '';
    const parsed = new Date(raw);
    return Number.isNaN(+parsed) ? '' : `${parsed.getFullYear()}-${String(parsed.getMonth()+1).padStart(2,'0')}-${String(parsed.getDate()).padStart(2,'0')}`;
  }
  function customerRecord(customer,invoices) {
    const customerId = `workspace-customer-${customer.customerCode || customer.code || customer.id}`;
    return {id:customerId,clientId:customer.clientId || actor().clientId,subClientId:customer.subClientId || '',
      name:customer.name || customer.customerName || customerId,
      ...(customer.id ? {strategyMasterCustomerId:String(customer.id)} : {}),
      ...(customer.keyAccount!=null || customer.isKeyAccount!=null ? {strategyMasterKeyAccount:customer.keyAccount ?? customer.isKeyAccount} : {}),
      ...(customer.clientCode!=null ? {clientCode:customer.clientCode} : {}),
      ...(customer.customerCode!=null || customer.code!=null ? {customerCode:customer.customerCode ?? customer.code} : {}),
      ...(customer.clientName!=null || customer.client?.name!=null ? {clientName:customer.clientName ?? customer.client.name} : {}),
      ...(customer.clientLogo!=null || customer.client?.logo!=null ? {clientLogo:customer.clientLogo ?? customer.client.logo} : {}),
      ...Object.fromEntries(['subdomain','token','customerLinkToken','dunningContacts'].filter(key=>customer[key]!=null).map(key=>[key,customer[key]])),
      address:customer.address || customer.billToAddress || '',
      ...(customer.agentId ? {agentId:customer.agentId} : {}),
      ...(customer.contacts ? {contacts:customer.contacts.filter(c=>typeof c==='string'?c:c?.email).map(c=>typeof c==='string'?c:{...c})} : {}),
      invoices:invoices.map(invoice=>({id:`workspace-invoice-${invoice.invoiceNo}`,invoiceNo:invoice.invoiceNo,
        dueDate:iso(invoice.dueDate || invoice.invoiceDueDate || invoice.customerDueDate),
        ...(invoice.invoiceDate!=null ? {invoiceDate:iso(invoice.invoiceDate)} : {}),
        ...(invoice.saleOrderNo!=null || invoice.salesOrderNo!=null ? {saleOrderNo:invoice.saleOrderNo ?? invoice.salesOrderNo} : {}),
        ...(invoice.poNumber!=null || invoice.purchaseOrderNo!=null ? {poNumber:invoice.poNumber ?? invoice.purchaseOrderNo} : {}),
        ...(invoice.desc!=null || invoice.description!=null ? {desc:invoice.desc ?? invoice.description,description:invoice.desc ?? invoice.description} : {}),
        strategyMasterInvoiceId:String(invoice.invoiceNo),
        ...(customer.id ? {strategyMasterCustomerId:String(customer.id)} : {}),
        ...(invoice.subStatus ? {strategyMasterSubStatus:invoice.subStatus} : {}),
        ...(invoice.keyAccount!=null || invoice.isKeyAccount!=null ? {strategyMasterKeyAccount:invoice.keyAccount ?? invoice.isKeyAccount} : {}),
        ...(invoice.agentId ? {agentId:invoice.agentId} : {}),
        amount:Number(invoice.invoiceValue ?? invoice.invoiceAmount ?? invoice.amount ?? 0),
        outstandingAmount:Number(invoice.netDueAmount ?? invoice.netDue ?? invoice.outstandingAmount ?? invoice.totalOutstanding ?? invoice.invoiceValue ?? invoice.invoiceAmount ?? invoice.amount ?? 0)}))};
  }
  function syncPortfolio(customers) {
    if(!canExclude()||!Array.isArray(customers)||!core.syncInvoices)return;
    const person=actor();
    const records=customers.filter(c=>(!c.clientId||c.clientId===person.clientId)&&(person.role!=='agent'||!c.agentId||c.agentId===person.userId)).map(c=>customerRecord(c,(c.invoices||[]).filter(i=>(person.role!=='agent'||!i.agentId||i.agentId===person.userId)&&iso(i.dueDate||i.invoiceDueDate||i.customerDueDate))));
    const fingerprint=JSON.stringify(records);
    if(fingerprint===portfolioFingerprint)return;
    try{syncing=true;core.syncInvoices(records,person);portfolioFingerprint=fingerprint;}
    catch(error){sourceError=error.message;}
    finally{syncing=false;}
    schedule();
  }
  function syncSelected(detail) {
    if (!canExclude()) return;
    if (!detail?.invoice || !detail.customer || !core.syncInvoices) { currentId=''; schedule(); return; }
    const {customer,invoice} = detail;
    currentId = `workspace-invoice-${invoice.invoiceNo}`;
    const record=customerRecord(customer,[invoice]);
    if (!record.invoices[0].dueDate) { sourceError='A due date is required before this invoice can enter a Dunning strategy.'; schedule(); return; }
    try {syncing=true;core.syncInvoices([record],actor());sourceError='';}
    catch(error){sourceError=error.message;}
    finally{syncing=false;}
    schedule();
  }
  function section(id,parent) {
    if (!parent) return null;
    let el=document.getElementById(id);
    if (!el || !parent.contains(el)) { el=document.createElement('section');el.id=id;el.className='dnIntegration';parent.append(el); }
    return el;
  }
  function html(el,value) { if(el && el.dataset.rendered!==value){el.innerHTML=value;el.dataset.rendered=value;} }
  function notice(el,message) {
    let box=el?.querySelector('.dnMessage');
    if(!box && el){box=document.createElement('p');box.className='dnMessage';box.setAttribute('role','status');el.append(box);}
    if(box)box.textContent=message;
  }
  function invoiceCard(invoice,state) {
    if(!invoice) return `<p>${escape(sourceError || 'Select an invoice to see its Dunning participation.')}</p>`;
    const excluded=state.exclusions.some(e=>e.invoiceId===invoice.id && e.active!==false);
    const batches=state.batches.filter(b=>(b.invoiceIds || []).includes(invoice.id));
    return `<div class="dnInvoiceMeta"><strong>${escape(invoice.invoiceNo)}</strong><span>Due ${escape(invoice.dueDate)}</span><span>Outstanding ${money(invoice.outstandingAmount ?? invoice.outstanding)}</span></div>
      <p>${excluded?'Manually excluded from Dunning Letters.':Number(invoice.outstandingAmount ?? invoice.outstanding)<=0?'Fully paid — automatically excluded.':batches.length?`Included in ${batches.length} daily batch${batches.length===1?'':'es'}.`:'Will be checked against active strategies on the daily run.'}</p>
      <div class="dnActions">${excluded?'<button disabled title="Letter-stage behaviour after reinstatement awaits team confirmation">Remove exclusion</button>':`<button data-dn-exclude="${escape(invoice.id)}" ${canExclude()&&state.enabled?'':'disabled'}>Exclude from Dunning Letters</button>`}
      ${manage()?`<a href="${base}admin.html?module=module-configuration&view=dunning-letters">Manage Dunning Letters</a>`:''}</div>${excluded?'<p><small>Reinstatement scheduling is pending team confirmation.</small></p>':''}`;
  }
  function render() {
    scheduled=false;
    const state=core.getState();
    if (!canExclude()) return;
    const parent=admin?document.querySelector('#imResult .imPanel .imDetailsScroll'):document.querySelector('#invoiceStrategyCollapse .accordion-body');
    const el=section('dnInvoiceContext',parent);
    html(el,`<h3>Dunning Letters</h3>${state.enabled?invoiceCard(state.invoices.find(i=>i.id===currentId),state):`<p>Dunning Letters is disabled for this client.</p>`}`);
  }
  function schedule(){if(!scheduled){scheduled=true;requestAnimationFrame(render);}}
  document.addEventListener('click',event=>{
    const btn=event.target.closest('[data-dn-exclude]');
    if(!btn || btn.disabled)return;
    const host=btn.closest('.dnIntegration');
    try{
      if(btn.dataset.dnExclude){core.excludeInvoice(btn.dataset.dnExclude,actor());notice(host,'Invoice excluded from future Dunning Letters.');}
    }catch(error){notice(host,error.message);}
  });
  window.addEventListener('inebura:invoice-portfolio',event=>syncPortfolio(event.detail));
  window.addEventListener('inebura:invoice-selected',event=>syncSelected(event.detail));
  core.subscribe(()=>{if(!syncing)schedule();});
  new MutationObserver(schedule).observe(document.getElementById('adminPageContent')||document.body,{childList:true,subtree:true});
  syncPortfolio(window.IneburaDunningInvoicePortfolio);
  syncSelected(window.IneburaDunningSelectedInvoice);
  schedule();
})();
