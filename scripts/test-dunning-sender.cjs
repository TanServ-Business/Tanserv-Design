'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createInstance}=require('./dunning-core.js');
const management=require('./dunning-management.js');
const actor={role:'client-admin',clientId:'demo-client',userId:'sender-admin'};
const choices=['agent','system','arservices'];
function fixture() {
  const values=new Map();
  const storage={getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)};
  const person={...actor};
  const api=createInstance({storage,context:()=>person});
  api.setEnabled(true);
  for(const template of api.getState().templates)api.saveTemplate({...template,standardReady:true});
  return {api,storage,values,person};
}
function draft(overrides={}) {
  return {id:'sender-strategy',name:'Dunning sender choice',status:'draft',firstStageDays:15,subClientId:'North',filters:{},stages:[{templateId:'dunning-template-1',intervalDays:0},{templateId:'dunning-template-2',intervalDays:7}],...overrides};
}
function unchanged(app,action,pattern) {
  const state=JSON.stringify(app.api.getState()),saved=app.storage.getItem(app.api.KEY);
  assert.throws(action,pattern);
  assert.equal(JSON.stringify(app.api.getState()),state);
  assert.equal(app.storage.getItem(app.api.KEY),saved);
}

test('each configured Dunning sender persists and reopens with its original strategy identity',()=>{
  for(const senderType of choices) {
    const app=fixture(),saved=app.api.saveStrategy(draft({senderType}));
    assert.equal(saved.senderType,senderType);
    const reopened=createInstance({storage:app.storage,context:actor}).getState().strategies.find(row=>row.id===saved.id);
    assert.equal(reopened.senderType,senderType);
    assert.equal(reopened.id,'sender-strategy');
    assert.deepEqual(reopened.stages,saved.stages);
  }
});

test('legacy strategies without a sender remain valid on load, save and activation',()=>{
  const app=fixture(),saved=app.api.saveStrategy(draft());
  assert.equal(saved.senderType,undefined);
  const reopened=createInstance({storage:app.storage,context:actor});
  const legacy=reopened.getState().strategies.find(row=>row.id===saved.id);
  assert.equal(legacy.senderType,undefined);
  const active=reopened.saveStrategy({...legacy,status:'active'});
  assert.equal(active.status,'active');
  assert.equal(active.senderType,undefined);
});

test('an ordinary partial strategy update preserves the selected sender',()=>{
  const app=fixture();
  app.api.saveStrategy(draft({senderType:'agent'}));
  const renamed=app.api.saveStrategy({id:'sender-strategy',name:'Renamed strategy'});
  assert.equal(renamed.senderType,'agent');
});

test('unknown or malformed sender values reject atomically before saving',()=>{
  const app=fixture();
  for(const senderType of ['',null,true,false,1,[],['system'],{},'unknown','Agent','arservices@tanserv.com','ar.services@inebura.com']) {
    unchanged(app,()=>app.api.saveStrategy(draft({senderType})),/valid Dunning email sender/);
  }
});

test('an invalid sender edit preserves the saved choice and existing issued history',()=>{
  const app=fixture();app.api.saveStrategy(draft({senderType:'system',status:'active'}));
  app.api.runDaily('2026-10-20');
  assert.ok(app.api.getState().emails.length>0);
  unchanged(app,()=>app.api.saveStrategy({id:'sender-strategy',senderType:'external'}),/valid Dunning email sender/);
  assert.equal(app.api.getState().strategies[0].senderType,'system');
});

test('editing sender preserves active batch stages and dates and exact issued email snapshots',()=>{
  const app=fixture();app.api.saveStrategy(draft({senderType:'system',status:'active'}));
  app.api.runDaily('2026-10-20');
  const before=app.api.getState(),emails=JSON.stringify(before.emails),batches=JSON.stringify(before.batches);
  assert.ok(before.batches.some(batch=>batch.status==='scheduled'&&batch.stage===2));
  for(const senderType of choices) {
    const edited=app.api.saveStrategy({id:'sender-strategy',senderType});
    assert.equal(edited.senderType,senderType);
    assert.equal(JSON.stringify(app.api.getState().emails),emails);
    assert.equal(JSON.stringify(app.api.getState().batches),batches);
  }
});

test('sender edits respect current role and client scope without mutation',()=>{
  const app=fixture();app.api.saveStrategy(draft({senderType:'system'}));
  for(const role of ['agent','supervisor','mis','mis-manager','backend']) {
    unchanged(app,()=>app.api.saveStrategy({id:'sender-strategy',senderType:'agent'},{...actor,role}),/permission/);
  }
  unchanged(app,()=>app.api.saveStrategy({id:'sender-strategy',senderType:'agent'},{...actor,clientId:'foreign-client'}),/client scope/);
});

test('management builds preserve each sender and default legacy or new strategies to system',()=>{
  const app=fixture(),state=app.api.getState();
  const input={...draft(),coverage:{targetType:'customer',targetMode:'all'},selectedIds:[]};
  const before=JSON.stringify(state);
  for(const senderType of choices)assert.equal(management.buildStrategy({...input,senderType},null,state,actor).senderType,senderType);
  assert.equal(management.buildStrategy(input,null,state,actor).senderType,'system');
  assert.equal(management.buildStrategy(input,draft({senderType:'agent',clientId:actor.clientId}),state,actor).senderType,'agent');
  assert.throws(()=>management.buildStrategy({...input,senderType:'external'},null,state,actor),/valid email sender/);
  assert.equal(JSON.stringify(state),before);
});

test('Create and Edit handlers save and reopen sender choices with the appropriate fallback guidance',async()=>{
  const app=fixture(),listeners={},modalListeners={},nodes=new Map();
  const element=()=>({innerHTML:'',hidden:false,textContent:'',classList:{toggle(){},remove(){},add(){}},setAttribute(){},addEventListener(){},removeEventListener(){}});
  const container={...element(),querySelector(selector){if(!nodes.has(selector))nodes.set(selector,element());return nodes.get(selector);},querySelectorAll:()=>[],addEventListener(type,listener){listeners[type]=listener;}};
  const fields={name:{value:'Sender modal scenario'},status:{value:'draft'},subClient:{value:'North'},targetType:{value:'customer'},targetMode:{value:'all'},senderType:{name:'senderType',value:'system'},'days-0':{value:'15'},'template-0':{value:'dunning-template-1'},'key-0':{value:'all'},'all-statuses-0':{checked:true},'all-aging-0':{checked:true}};
  const error=element(),help=element(),targets=element();
  const form={elements:fields,matches:selector=>selector.split(',').includes('[data-dm-strategy]'),querySelector:selector=>selector==='.dmFormError'?error:null};
  const modal={...element(),addEventListener(type,listener){modalListeners[type]=listener;},querySelector(selector){return {'[data-dm-strategy]':form,'[data-dm-sender-help]':help,'[data-dm-targets]':targets}[selector]||null;}};
  const host={document:{getElementById:id=>id==='adminModal'?modal:null},location:{search:'',hash:''},IneburaDunningManagementTemplates:{mount:()=>({ready:Promise.resolve(),destroy(){}})},IneburaDunningManagementReport:{mount:()=>({refresh(){},destroy(){}})}};
  vm.runInNewContext(fs.readFileSync(__dirname+'/dunning-management.js','utf8'),{window:host,URLSearchParams,Intl,Date,setTimeout,clearTimeout});
  const mounted=host.IneburaDunningManagement.mount(container,{api:app.api});
  const click=(kind,id='')=>listeners.click({target:{closest:selector=>selector==='[data-dm-action]'?{dataset:{dmAction:kind,id},disabled:false}:null}});
  const submit=()=>modalListeners.submit({target:form,preventDefault(){}});
  const change=senderType=>{const before=JSON.stringify(app.api.getState());fields.senderType.value=senderType;modalListeners.change({target:fields.senderType});assert.equal(JSON.stringify(app.api.getState()),before,'selecting a sender does not save until submit');};
  await click('add-strategy');
  assert.match(modal.innerHTML,/<legend>Sending<\/legend>/);
  assert.match(modal.innerHTML,/<option value="system" selected>System generated email/);
  assert.match(modal.innerHTML,/Agent&#39;s email/);
  assert.match(modal.innerHTML,/arservices@tanserv\.com/);
  change('agent');
  assert.match(help.textContent,/agent has not configured their email/);
  assert.match(help.textContent,/system generated email/);
  assert.match(help.textContent,/arservices@tanserv\.com when fallback is toggled on/);
  await submit();
  const saved=app.api.getState().strategies.at(-1);
  assert.equal(saved.senderType,'agent');
  await click('edit-strategy',saved.id);
  assert.match(modal.innerHTML,/<option value="agent" selected>/);
  change('system');
  assert.match(help.textContent,/If the system generated email is not configured/);
  assert.match(help.textContent,/when fallback is toggled on/);
  assert.doesNotMatch(help.textContent,/agent has not configured/);
  await submit();
  assert.equal(app.api.getState().strategies.find(row=>row.id===saved.id).senderType,'system');
  await click('edit-strategy',saved.id);
  assert.match(modal.innerHTML,/<option value="system" selected>/);
  change('arservices');
  assert.equal(help.textContent,'Dunning letters will be sent using arservices@tanserv.com.');
  await submit();
  assert.equal(app.api.getState().strategies.find(row=>row.id===saved.id).senderType,'arservices');
  await click('edit-strategy',saved.id);
  assert.match(modal.innerHTML,/<option value="arservices" selected>/);
  app.person.role='agent';const before=JSON.stringify(app.api.getState());
  await submit();
  assert.match(container.innerHTML,/Access restricted/);
  assert.equal(JSON.stringify(app.api.getState()),before,'a saved handler cannot edit sender after role revocation');
  mounted.destroy();
});
