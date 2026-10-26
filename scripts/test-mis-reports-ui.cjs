/* DOM harness for saved report callbacks: no browser or external session used. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const core=require('./mis-access-core.js');
const storeApi=require('./mis-access-store.js');
const adapter=require('./mis-reports-access.js');

class Node {
  constructor(tag='div',attributes={}){this.tagName=tag.toUpperCase();this.attributes={...attributes};this.children=[];this.listeners={};this.style={};this.dataset={};this.hidden=false;this.open=false;this.scrollLeft=0;for(const [name,value]of Object.entries(attributes))if(name.startsWith('data-'))this.dataset[name.slice(5).replace(/-([a-z])/g,(_,c)=>c.toUpperCase())]=value;this.classList={add:(...names)=>{this.attributes.class=[this.attributes.class||'',...names].join(' ');},remove:(...names)=>{this.attributes.class=(this.attributes.class||'').split(' ').filter(name=>!names.includes(name)).join(' ');},toggle:(name,on)=>{const has=(this.attributes.class||'').split(' ').includes(name);if(on??!has)this.classList.add(name);else this.classList.remove(name);}};}
  set innerHTML(value){this.html=String(value);this.children=[];for(const match of this.html.matchAll(/<([a-z][a-z0-9-]*)\b([^>]*)>/gi)){const attrs={};for(const item of match[2].matchAll(/([\w-]+)(?:=(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g))attrs[item[1]]=item[2]??item[3]??item[4]??'';this.append(new Node(match[1],attrs));}}
  get innerHTML(){return this.html||'';}
  get textContent(){return this.text??this.innerHTML.replace(/<[^>]*>/g,'');}
  set textContent(value){this.text=String(value);this.innerHTML='';}
  get lastElementChild(){return this.children.at(-1);}
  get className(){return this.attributes.class||'';}
  set className(value){this.attributes.class=value;}
  setAttribute(name,value){this.attributes[name]=String(value);}
  getAttribute(name){return this.attributes[name]??null;}
  matches(selector){const attrs=[...selector.matchAll(/\[([\w-]+)(?:="([^"]*)")?\]/g)];if(attrs.some(([,name,value])=>!(name in this.attributes)||(value!==undefined&&this.attributes[name]!==value)))return false;const plain=selector.replace(/\[[^\]]+\]/g,'');const id=plain.match(/#([\w-]+)/)?.[1];if(id&&this.attributes.id!==id)return false;for(const [,name]of plain.matchAll(/\.([\w-]+)/g))if(!(this.attributes.class||'').split(' ').includes(name))return false;const tag=plain.match(/^[a-z][a-z0-9-]*/i)?.[0];return !tag||this.tagName===tag.toUpperCase();}
  querySelectorAll(selector){return this.children.flatMap(child=>[...(child.matches(selector)?[child]:[]),...child.querySelectorAll(selector)]);}
  querySelector(selector){return this.querySelectorAll(selector)[0]||null;}
  append(child){child.parent=this;this.children.push(child);}
  insertAdjacentHTML(_position,value){const extra=new Node();extra.innerHTML=value;for(const child of extra.children)this.append(child);this.html=(this.html||'')+value;}
  remove(){if(this.parent)this.parent.children=this.parent.children.filter(child=>child!==this);}
  addEventListener(type,listener){(this.listeners[type]||=[]).push(listener);}
  click(){const event={target:this,preventDefault(){},stopPropagation(){},stopImmediatePropagation(){},composedPath:()=>[this]};this.onclick?.(event);for(const listener of this.listeners.click||[])listener(event);}
  focus(){}
  showModal(){this.open=true;}
  close(){this.open=false;}
  getBoundingClientRect(){return {left:0,right:100,top:0,bottom:40};}
}

function setup({search='?misUser=mis-agent',role='Admin',name='Admin'}={}){
  const body=new Node('body'),elements={};
  for(const id of ['reportTrigger','reportOptions','reportParameters','reportActions','reportResults','reportResources','resourcesDialog','closeResources','resourcesList','reportBundleLinks','reportToast','misReportScope']){const node=new Node('div',{id});body.append(node);elements[id]=node;}
  const resources=new Node('footer',{class:'rgResources'}),resourceLabel=new Node('span');resources.append(resourceLabel);body.append(resources);
  const document={body,hidden:false,readyState:'complete',listeners:{},getElementById:id=>body.querySelector('#'+id),querySelector:selector=>selector==='.rgResources > span'?resourceLabel:body.querySelector(selector),querySelectorAll:selector=>body.querySelectorAll(selector),createElement:tag=>new Node(tag),addEventListener(type,listener){(this.listeners[type]||=[]).push(listener);}};
  const values=new Map([['activeUserRole',role],['activeUserName',name]]),storage={getItem:key=>values.get(key)??null,setItem:(key,value)=>values.set(key,String(value)),removeItem:key=>values.delete(key)};
  let timerId=0;const timers=new Map(),downloads=[],listeners={};
  const win={location:{search},document,localStorage:storage,addEventListener(type,listener){(listeners[type]||=[]).push(listener);},dispatchEvent(event){for(const listener of listeners[event.type]||[])listener(event);},setInterval(){},IneburaMisCore:core,IneburaMisReports:adapter,IneburaReportsCore:require('./reports-core.js'),IneburaReportsDunning:require('./reports-dunning.js')};
  win.IneburaMisStore=storeApi.createStore(storage,()=>win.dispatchEvent({type:'inebura:mis-change'}));
  const XLSX={utils:{book_new:()=>({Sheets:{}}),aoa_to_sheet:rows=>({rows}),book_append_sheet:(book,sheet,name)=>{book.Sheets[name]=sheet;}},writeFile:(book,name)=>downloads.push({book,name})};win.XLSX=XLSX;
  const context={window:win,document,location:win.location,localStorage:storage,URLSearchParams,Date,Element:Node,innerWidth:1200,innerHeight:800,XLSX,URL:{createObjectURL:()=>'',revokeObjectURL(){}},Blob:class{},setTimeout:(callback,delay)=>{const id=++timerId;timers.set(id,{callback,delay});return id;},clearTimeout:id=>timers.delete(id)};
  vm.runInNewContext(fs.readFileSync(__dirname+'/reports-data.js','utf8'),context);
  vm.runInNewContext(fs.readFileSync(__dirname+'/reports.js','utf8'),context);
  const find=selector=>body.querySelector(selector);
  const tick=()=>{for(const [id,timer]of [...timers])if(timer.delay<=500){timers.delete(id);timer.callback();}};
  const ready=mode=>{find(mode==='xlsx'?'.rptActionBtnDownload':'.rptActionBtnGenerate').click();tick();};
  const view=()=>{ready('view');find('.rptReadyAction').click();};
  const mutate=change=>{const state=win.IneburaMisStore.getState();change(state);storage.setItem(storeApi.KEY,JSON.stringify(state));};
  return {win,document,elements,resources,storage,downloads,find,tick,ready,view,mutate};
}

test('MIS UI lists only preview, hides raw attachments and exports current scoped rows',()=>{
  const app=setup();
  assert.equal(app.resources.hidden,true);
  assert.equal(app.elements.resourcesDialog.hidden,true);
  assert.equal(app.elements.reportBundleLinks.innerHTML,'');
  assert.equal(app.elements.resourcesList.innerHTML,'');
  app.elements.reportTrigger.click();
  assert.equal(app.elements.reportOptions.querySelectorAll('[data-report]').length,1);
  assert.equal(app.elements.reportOptions.querySelector('[data-report]').dataset.report,'mis-portfolio-preview');
  app.view();
  assert.equal(app.elements.reportResults.querySelectorAll('.rgDataRow').length,5);
  app.find('.rgBtnDownloadFiltered').click();
  assert.equal(app.downloads.length,1);
  assert.equal(app.downloads[0].name,'mis-portfolio-preview_filtered.xlsx');
  const rows=app.downloads[0].book.Sheets['MIS Portfolio Preview'].rows;
  assert.deepEqual(Array.from(rows.slice(1),row=>row[0]),['MIS-TC-001','MIS-TC-002','MIS-TC-004','MIS-AP-005','MIS-AP-007']);
});

test('queued, ready and already-rendered callbacks cannot use revoked mappings',()=>{
  const queued=setup();queued.find('.rptActionBtnGenerate').click();
  queued.mutate(state=>{state.users.find(user=>user.id==='mis-agent').status='Suspended';});queued.tick();
  assert.equal(queued.find('.rptReadyAction'),null);
  assert.equal(queued.elements.reportResults.innerHTML,'');

  const ready=setup();ready.ready('xlsx');const savedReady=ready.find('.rptReadyAction');
  ready.mutate(state=>{state.users.find(user=>user.id==='mis-agent').access={mode:'assignees',assigneeIds:['agent-b']};});savedReady.click();
  assert.equal(ready.downloads.length,0);
  assert.equal(ready.elements.reportResults.innerHTML,'');

  const rendered=setup();rendered.view();const savedFiltered=rendered.find('.rgBtnDownloadFiltered').onclick;
  rendered.mutate(state=>{state.invoices.find(invoice=>invoice.id==='inv-1').assigneeId='agent-b';});savedFiltered();
  assert.equal(rendered.downloads.length,0);
  assert.equal(rendered.elements.reportResults.innerHTML,'');
});

test('filter menus and both export paths recheck identity synchronously',()=>{
  const app=setup();app.view();const savedFilter=app.find('[data-filter="3"]').onclick;
  app.mutate(state=>{state.users.find(user=>user.id==='mis-agent').status='Suspended';});savedFilter();
  assert.equal(app.find('.rgColDropMenu'),null);
  assert.equal(app.elements.reportResults.innerHTML,'');

  const session=setup({search:'',role:'MIS',name:'MIS Portfolio'});session.ready('xlsx');const savedDownload=session.find('.rptReadyAction');
  session.storage.setItem('activeUserName','Unknown MIS user');savedDownload.click();
  assert.equal(session.downloads.length,0);
  assert.match(session.elements.misReportScope.innerHTML,/unavailable/);
  assert.equal(session.find('.rptActionBtnDownload').getAttribute('disabled'),'');
});

test('saved source-resource handlers are denied after entering MIS; normal catalog stays intact',()=>{
  const app=setup({search:''});const savedResources=app.elements.reportResources.onclick;
  app.elements.reportTrigger.click();assert.equal(app.elements.reportOptions.querySelectorAll('[data-report]').length,19);
  assert.equal(app.elements.resourcesList.querySelector('#dunningReportTemplate'),null);
  assert.equal(app.resources.hidden,false);assert.ok(app.elements.reportBundleLinks.innerHTML.includes('All sample data'));
  app.storage.setItem('activeUserRole','MIS');app.storage.setItem('activeUserName','MIS Portfolio');savedResources();
  assert.equal(app.downloads.length,0);
  assert.equal(app.resources.hidden,true);
  assert.equal(app.elements.resourcesList.innerHTML,'');
  app.elements.reportResources.onclick();assert.equal(app.elements.resourcesDialog.open,false);
  const unknown=setup({search:'?misUser=unknown'});
  assert.equal(unknown.find('.rptActionBtnGenerate').getAttribute('disabled'),'');
  assert.equal(unknown.elements.resourcesList.innerHTML,'');
});

test('store events immediately invalidate visible scope and normal reports ignore unrelated MIS edits',()=>{
  const app=setup();app.view();
  app.win.IneburaMisStore.reassignInvoice('inv-1','agent-b',{id:'admin',role:'Admin',status:'Active'});
  assert.equal(app.elements.reportResults.innerHTML,'');
  app.view();assert.equal(app.elements.reportResults.querySelectorAll('.rgDataRow').length,4);
  const normal=setup({search:'?report=odm-report'});normal.view();
  assert.equal(normal.elements.reportResults.querySelectorAll('.rgDataRow').length,12);
  normal.win.IneburaMisStore.reassignInvoice('inv-1','agent-b',{id:'admin',role:'Admin',status:'Active'});
  assert.equal(normal.elements.reportResults.querySelectorAll('.rgDataRow').length,12);
});
