/* VM smoke tests exercise the real UI event bridges without a browser dependency. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createInstance,KEY}=require('./dunning-core.js');
const manager={role:'client-admin',userId:'demo-user',clientId:'demo-client'};
const agent={role:'agent',userId:'demo-agent',clientId:'demo-client'};
const savedTimezone=process.env.TZ;
process.env.TZ='Asia/Kolkata';
function element() {
 const handlers={};
 return {dataset:{},children:[],innerHTML:'',textContent:'',disabled:false,checked:false,
  classList:{add(){},remove(){},toggle(){}},setAttribute(){},focus(){},append(child){this.children.push(child);},contains(child){return this.children.includes(child);},
  closest(){return null;},querySelector(){return null;},querySelectorAll(){return[];},addEventListener(name,fn){(handlers[name] ||= []).push(fn);},emit(name,event){for(const fn of handlers[name]||[])fn(event);}};
}
function fixture(role=manager,initialState) {
 const map=new Map(initialState?[[KEY,JSON.stringify(initialState)]]:[]);
 const storage={getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value)};
 const core=createInstance({storage,context:role});
 const elements=new Map();const events={};const frames=[];const emailParent=element();
 const document=Object.assign(element(),{body:element(),readyState:'loading',createElement(){const node=element();Object.defineProperty(node,'id',{get(){return this._id;},set(value){this._id=value;elements.set(value,this);}});return node;},getElementById:id=>elements.get(id)||null,querySelector:query=>query==='.emailTabPane[data-email-tab="sent"] .emailList'?emailParent:null});
 const downloads=[];
 const window={IneburaDunning:core,IneburaDunningDocuments:{preview:snapshot=>downloads.push(snapshot),download:snapshot=>downloads.push(snapshot)},addEventListener:(name,fn)=>{(events[name]||=[]).push(fn);}};
 const location={pathname:'/index.html',search:''};
 const context={window,location,document,URLSearchParams,MutationObserver:class{observe(){}},requestAnimationFrame:fn=>frames.push(fn),setTimeout:()=>0,Date,Number,Intl,console};
 function load(name){vm.runInNewContext(fs.readFileSync(require.resolve('./'+name),'utf8'),context,{filename:name});}
 return{core,window,context,document,elements,emailParent,frames,downloads,load,emit(name,detail){for(const fn of events[name]||[])fn({detail});},flush(){for(const fn of frames.splice(0))fn();}};
}
const invoiceDetail={customer:{id:'c1',code:'CUST-001',name:'Sample existing workspace customer',contacts:[{email:'accounts@example.test'}]},invoice:{invoiceNo:'INV-10291',invoiceAmount:124000,netDueAmount:98000,dueDate:'05 Nov 2025'}};
const tests=[];const test=(name,fn)=>tests.push({name,fn});
test('workspace invoice bridge uses invoiceAmount and preserves the calendar due date',()=>{
 const f=fixture();f.load('dunning-integrations.js');f.emit('inebura:invoice-selected',invoiceDetail);
 const invoice=f.core.getState().invoices.find(row=>row.invoiceNo==='INV-10291');
 assert.ok(invoice,'Workspace invoice must reach shared Dunning state');assert.equal(invoice.originalAmount,124000);assert.equal(invoice.outstanding,98000);assert.equal(invoice.dueDate,'2025-11-05');
 assert.equal(invoice.strategyMasterInvoiceId,'INV-10291');assert.equal(invoice.strategyMasterCustomerId,'c1');
});
test('source without contacts preserves the known contact list',()=>{
 const f=fixture();f.load('dunning-integrations.js');
 const details=JSON.parse(JSON.stringify(invoiceDetail));details.invoice.invoiceValue=124000;
 f.emit('inebura:invoice-selected',details);
 delete details.customer.contacts;f.emit('inebura:invoice-selected',details);
 const customer=f.core.getState().customers.find(row=>row.name===details.customer.name);
 assert.deepEqual(customer.contacts.map(row=>row.email),['accounts@example.test']);
});
test('workspace bridge preserves actual email merge values and leaves missing metadata unknown',()=>{
 const f=fixture();f.load('dunning-integrations.js');
 const detail=JSON.parse(JSON.stringify(invoiceDetail));
 Object.assign(detail.customer,{client:{name:'Actual client',logo:'../assets/client-logo.png'},subdomain:'actual-client',customerLinkToken:'actual-token',dunningContacts:[{name:'Collections contact',email:'collections@example.test',phone:'12345'}],contacts:[{name:'Accounts contact',email:'accounts@example.test',phone:'67890'}]});
 Object.assign(detail.invoice,{invoiceDate:'12 Oct 2025',salesOrderNo:'SO-ACTUAL',purchaseOrderNo:'PO-ACTUAL',description:'Actual invoice description'});
 f.emit('inebura:invoice-selected',detail);
 let state=f.core.getState(),invoice=state.invoices.find(row=>row.invoiceNo==='INV-10291'),customer=state.customers.find(row=>row.id===invoice.customerId);
 assert.equal(invoice.invoiceDate,'2025-10-12','Calendar issue date must not shift in the email renderer');assert.equal(invoice.saleOrderNo,'SO-ACTUAL');assert.equal(invoice.poNumber,'PO-ACTUAL');assert.equal(invoice.desc,'Actual invoice description');
 assert.equal(customer.clientName,'Actual client');assert.equal(customer.clientLogo,'../assets/client-logo.png');assert.equal(customer.subdomain,'actual-client');assert.equal(customer.customerLinkToken,'actual-token');assert.equal(customer.contacts[0].name,'Accounts contact');assert.equal(customer.contacts[0].phone,'67890');assert.equal(customer.dunningContacts[0].email,'collections@example.test');
 for(const key of ['client','subdomain','customerLinkToken','dunningContacts','contacts'])delete detail.customer[key];
 for(const key of ['invoiceDate','salesOrderNo','purchaseOrderNo','description'])delete detail.invoice[key];
 f.emit('inebura:invoice-selected',detail);state=f.core.getState();invoice=state.invoices.find(row=>row.invoiceNo==='INV-10291');customer=state.customers.find(row=>row.id===invoice.customerId);
 assert.equal(invoice.poNumber,'PO-ACTUAL');assert.equal(customer.clientName,'Actual client');assert.equal(customer.contacts[0].name,'Accounts contact','An incomplete refresh must retain known merge values');
 const unknown=JSON.parse(JSON.stringify(invoiceDetail));unknown.customer.id='unknown-customer';unknown.customer.code='UNKNOWN-CUSTOMER';unknown.invoice.invoiceNo='UNKNOWN-METADATA';f.emit('inebura:invoice-selected',unknown);state=f.core.getState();invoice=state.invoices.find(row=>row.invoiceNo==='UNKNOWN-METADATA');customer=state.customers.find(row=>row.id===invoice.customerId);
 for(const key of ['invoiceDate','saleOrderNo','poNumber','desc'])assert.equal(invoice[key],undefined,`${key} must not be fabricated`);
 for(const key of ['clientName','clientLogo','subdomain','customerLinkToken'])assert.equal(customer[key],undefined,`${key} must not be fabricated`);
});
test('agent invoice bridge cannot silently adopt another agent assignment',()=>{
 const f=fixture(agent);f.load('dunning-integrations.js');const detail=JSON.parse(JSON.stringify(invoiceDetail));detail.invoice.invoiceValue=124000;detail.invoice.agentId='other-agent';detail.customer.agentId='other-agent';
 const before=JSON.stringify(f.core.getState());f.emit('inebura:invoice-selected',detail);assert.equal(JSON.stringify(f.core.getState()),before);
});
test('old Email and Document Setup surfaces do not expose Dunning controls or accept direct history actions',()=>{
 const state=fixture().core.getState();state.enabled=true;
 state.emails=[{id:'issued',status:'sent',customerId:'dunning-customer-north',subject:'PRIVATE ISSUED LETTER',body:'Captured content',date:'2026-10-20',stage:1,to:[],recipientResults:[],letterSnapshot:{reference:'EXACT',pdfDataUri:'data:application/pdf;base64,EXACT'}}];
 for(const role of [manager,agent,{...manager,role:'supervisor'},{...manager,role:'mis-user'}]) {
  const f=fixture(role,state),detailPane=element(),documentParent=element();f.elements.set('emailDetailContent',detailPane);
  f.context.location.pathname='/pages/admin.html';f.context.location.search='?module=document-setup';
  f.document.querySelector=selector=>selector==='.opWorkspaceBody'?documentParent:selector==='.emailTabPane[data-email-tab="sent"] .emailList'?f.emailParent:null;
  f.load('dunning-integrations.js');f.flush();assert.equal(f.elements.has('dnEmailHistory'),false);assert.equal(f.elements.has('dnDocumentSetup'),false);assert.equal(f.elements.has('dnInvoiceBook'),false);
  const before=JSON.stringify(f.core.getState());
  for(const dataset of [{dnEmail:'issued'},{dnPreview:'issued'},{dnDownload:'issued'}]) {
   const button={disabled:false,dataset,closest:()=>element()};
   f.document.emit('click',{target:{closest:selector=>selector.includes('[data-dn-exclude]')?null:button}});
  }
  assert.equal(detailPane.innerHTML,'');assert.equal(f.downloads.length,0);assert.equal(JSON.stringify(f.core.getState()),before);
 }
});
test('invoice screen retains assigned Agent exclusion and exposes management link only to Client Admin',()=>{
 for(const role of [manager,agent,{...manager,role:'supervisor'}]) {
  const state=fixture().core.getState();state.enabled=true;const f=fixture(role,state),invoiceParent=element();
  f.document.querySelector=selector=>selector==='#invoiceStrategyCollapse .accordion-body'?invoiceParent:null;
  f.load('dunning-integrations.js');f.emit('inebura:invoice-selected',invoiceDetail);f.flush();
  const section=f.elements.get('dnInvoiceContext');
  if(role.role==='supervisor'){assert.equal(section,undefined);continue;}
  assert.match(section.innerHTML,/Exclude from Dunning Letters/);assert.equal(section.innerHTML.includes('view=dunning-letters'),role.role==='client-admin');assert.doesNotMatch(section.innerHTML,/View Strategy Master/);
  const id='workspace-invoice-'+invoiceDetail.invoice.invoiceNo,button={disabled:false,dataset:{dnExclude:id},closest:()=>section};
  f.document.emit('click',{target:{closest:()=>button}});assert.equal(f.core.getState().exclusions.find(row=>row.invoiceId===id).active,true);
 }
});
test('Module Configuration saves Dunning enabled state and denies unauthorized direct action',()=>{
 const f=fixture();const mount=element(),modal=element(),toast=element();
 const toggle=Object.assign(element(),{dataset:{configEditable:'dunning'},checked:true}),count=Object.assign(element(),{value:'3',dataset:{configEditable:'dunning'}});
 mount.querySelector=selector=>selector==='[data-config-toggle="dunning"]'?toggle:selector==='#config-dunning-count'?count:null;mount.querySelectorAll=()=>[toggle,count];modal.querySelectorAll=()=>[{value:'dunning'}];
 f.elements.set('adminPageContent',mount);f.elements.set('adminModal',modal);f.elements.set('adminToast',toast);f.window.IneburaAdminPage={module:'module-configuration'};f.window.IneburaAdminPreviewNotice=()=>{};
 f.load('admin-configurations.js');
 modal.emit('click',{target:{closest:()=>({dataset:{configAction:'apply'}})}});
 mount.emit('click',{target:{closest:selector=>selector==='[data-config-action]'?{dataset:{configAction:'save'}}:null}});
 assert.equal(f.core.getState().enabled,true);assert.equal(f.core.getState().documentTypes.length,3);
 f.core.setEnabled(false);assert.equal(toggle.checked,false,'Saved changes from another surface refresh a clean control');
 toggle.checked=true;toggle.dataset.configToggle='dunning';mount.emit('change',{target:toggle});f.core.setEnabled(false);assert.equal(toggle.checked,true,'External updates preserve a locally edited unsaved value');
 const blocked=fixture(agent);const blockedMount=element(),blockedModal=element(),blockedToast=element();
 blockedMount.querySelector=selector=>selector==='#config-dunning-count'?count:toggle;blockedMount.querySelectorAll=()=>[toggle,count];blockedModal.querySelectorAll=()=>[{value:'dunning'}];
 blocked.elements.set('adminPageContent',blockedMount);blocked.elements.set('adminModal',blockedModal);blocked.elements.set('adminToast',blockedToast);blocked.window.IneburaAdminPage={module:'module-configuration'};blocked.window.IneburaAdminPreviewNotice=()=>{};
 blocked.load('admin-configurations.js');blockedModal.emit('click',{target:{closest:()=>({dataset:{configAction:'apply'}})}});assert.equal(toggle.disabled,true);
 const before=JSON.stringify(blocked.core.getState());blockedMount.emit('click',{target:{closest:selector=>selector==='[data-config-action]'?{dataset:{configAction:'save'}}:null}});assert.equal(JSON.stringify(blocked.core.getState()),before);assert.match(blockedToast.textContent,/permission/);
});
test('workspace portfolio bridge publishes all invoices and updates amounts independently of table filters',()=>{
 const source=fs.readFileSync(require.resolve('./app.js'),'utf8');
 const bridge=source.slice(source.indexOf('function publishDunningInvoicePortfolio()'),source.indexOf('function renderInvoiceTable(invoices)'));
 assert.match(source,/function renderInvoiceTable\(invoices\) \{\s*publishDunningInvoicePortfolio\(\)/);
 const customers=[{id:'c1',name:'One',contacts:[{email:'one@example.test'}],invoices:[{invoiceNo:'A',netDueAmount:100},{invoiceNo:'B',netDueAmount:200}]},{id:'c2',name:'Two',contacts:[],invoices:[{invoiceNo:'C',netDueAmount:300}]}];
 const emitted=[];const window={dispatchEvent:event=>emitted.push(event)};
 const environment=vm.createContext({window,customersData:customers,CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail;}}});
 vm.runInContext(bridge+';publishDunningInvoicePortfolio();',environment);
 assert.equal(emitted[0].type,'inebura:invoice-portfolio');assert.equal(window.IneburaDunningInvoicePortfolio.flatMap(customer=>customer.invoices).length,3);
 customers[0].invoices[0].netDueAmount=50;assert.equal(emitted[0].detail[0].invoices[0].netDueAmount,100,'Published payload is a snapshot');
 vm.runInContext('publishDunningInvoicePortfolio();',environment);assert.equal(emitted[1].detail[0].invoices[0].netDueAmount,50);
});
test('portfolio events sync unselected invoices, preserve assignment scope and skip unchanged renders',()=>{
 const f=fixture(agent);f.load('dunning-integrations.js');
 const portfolio=[{...invoiceDetail.customer,invoices:[{...invoiceDetail.invoice},{invoiceNo:'UNSELECTED-2',invoiceAmount:8000,netDueAmount:7000,dueDate:'06 Nov 2025'},{invoiceNo:'FOREIGN-ASSIGNMENT',invoiceAmount:500,netDueAmount:500,dueDate:'06 Nov 2025',agentId:'other-agent'}]},{id:'foreign',name:'Foreign client',clientId:'foreign-client',invoices:[{invoiceNo:'FOREIGN-CLIENT',invoiceAmount:500,netDueAmount:500,dueDate:'06 Nov 2025'}]}];
 f.emit('inebura:invoice-portfolio',portfolio);
 const state=f.core.getState();assert.equal(state.invoices.find(row=>row.invoiceNo==='UNSELECTED-2').outstanding,7000);assert.equal(state.invoices.filter(row=>row.invoiceNo.startsWith('FOREIGN-')).length,0);
 f.emit('inebura:invoice-portfolio',portfolio);assert.equal(f.core.getState().revision,state.revision,'Table-only re-render must not rewrite state');
 portfolio[0].invoices[1].netDueAmount=2500;f.emit('inebura:invoice-portfolio',portfolio);assert.equal(f.core.getState().invoices.find(row=>row.invoiceNo==='UNSELECTED-2').outstanding,2500);
});
let failures=0;for(const {name,fn}of tests){try{fn();process.stdout.write('PASS '+name+'\n');}catch(error){failures++;process.stderr.write('FAIL '+name+'\n'+error.stack+'\n');}}
if(savedTimezone===undefined)delete process.env.TZ;else process.env.TZ=savedTimezone;
if(failures)process.exitCode=1;else process.stdout.write(tests.length+' Dunning integration scenarios passed.\n');
