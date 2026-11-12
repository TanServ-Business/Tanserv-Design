'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createInstance}=require('./dunning-core.js');
const management=require('./dunning-management.js');
const actor={role:'client-admin',clientId:'demo-client',userId:'sender-admin'};
const choices=['agent','system','arservices'];
const senderAccountKey='ineburaAdminDemoState:v1';
const senderAccounts=[
  {id:'sender-primary',accountType:'System Generated',senderEmail:'collections@example.test',clientId:actor.clientId,status:'Active'},
  {id:'sender-backup',accountType:'System Generated',senderEmail:'backup@example.test',clientId:actor.clientId,status:'Active'}
];
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
function senderRows(app,rows) {app.storage.setItem(senderAccountKey,JSON.stringify({'sender-account':rows}));}
function managementInput(overrides={}) {return {...draft(),coverage:{targetType:'customer',targetMode:'all'},selectedIds:[],...overrides};}

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
  const input=managementInput({fallbackSenderAccountId:senderAccounts[0].id});
  const before=JSON.stringify(state);
  for(const senderType of choices)assert.equal(management.buildStrategy({...input,senderType},null,state,actor,senderAccounts).senderType,senderType);
  assert.equal(management.buildStrategy(input,null,state,actor).senderType,'system');
  assert.equal(management.buildStrategy(input,draft({senderType:'agent',clientId:actor.clientId}),state,actor,senderAccounts).senderType,'agent');
  assert.throws(()=>management.buildStrategy({...input,senderType:'external'},null,state,actor),/valid email sender/);
  assert.equal(JSON.stringify(state),before);
});

test('system sender accounts include only current-client active system accounts with valid emails and unique IDs',()=>{
  const app=fixture();
  const rows=[
    senderAccounts[0],{...senderAccounts[0],senderEmail:'duplicate@example.test'},senderAccounts[1],
    {id:'missing-status',accountType:'System Generated',senderEmail:'missing@example.test',clientId:actor.clientId},
    {id:'null-status',accountType:'System Generated',senderEmail:'null@example.test',clientId:actor.clientId,status:null},
    {id:'boolean-active',accountType:'System Generated',senderEmail:'boolean@example.test',clientId:actor.clientId,status:true},
    {id:'demo-unscoped',accountType:'System Generated',senderEmail:'demo@example.test'},
    {id:'listener',accountType:'Listener',senderEmail:'listener@example.test',status:'Active'},
    {id:'inactive',accountType:'System Generated',senderEmail:'inactive@example.test',status:'Inactive'},
    {id:'false-status',accountType:'System Generated',senderEmail:'false@example.test',status:false},
    {id:'pending-status',accountType:'System Generated',senderEmail:'pending@example.test',status:'Pending'},
    {id:'foreign',accountType:'System Generated',senderEmail:'foreign@example.test',clientId:'another-client',status:'Active'},
    {id:'bad-email',accountType:'System Generated',senderEmail:'not-an-email',status:'Active'},
    {id:'blank-email',accountType:'System Generated',senderEmail:'',status:'Active'}
  ];
  senderRows(app,rows);
  assert.deepEqual(management.systemSenderAccounts(actor,{seedRows:[]},app.storage).map(row=>row.id),
    ['sender-primary','sender-backup','missing-status','null-status','boolean-active','demo-unscoped']);
  assert.equal(management.systemSenderAccounts(actor,{seedRows:[]},app.storage)[0].senderEmail,'collections@example.test');
  assert.deepEqual(management.systemSenderAccounts({...actor,clientId:'another-client'},{seedRows:rows},app.storage).map(row=>row.id),['foreign']);
});

test('saved sender accounts are authoritative, including an empty list, while absent state uses definition seeds',()=>{
  const app=fixture(),definition={seedRows:senderAccounts};
  assert.deepEqual(management.systemSenderAccounts(actor,definition,app.storage).map(row=>row.id),senderAccounts.map(row=>row.id));
  senderRows(app,[]);
  assert.deepEqual(management.systemSenderAccounts(actor,definition,app.storage),[],'deleting configured accounts cannot revive seeds');
  senderRows(app,[senderAccounts[1]]);
  assert.deepEqual(management.systemSenderAccounts(actor,definition,app.storage).map(row=>row.id),['sender-backup']);
  assert.deepEqual(management.systemSenderAccounts({...actor,clientId:'real-client'},{seedRows:[{id:'demo',accountType:'System Generated',senderEmail:'demo@example.test'}]},fixture().storage),[],'unscoped demo seed accounts do not leak into other clients');
});

test('sender account access checks Client Admin and client context before reading storage or seeds',()=>{
  let reads=0;
  const storage={getItem(){reads++;throw new Error('private account storage read');}};
  const definition={get seedRows(){reads++;throw new Error('private seed read');}};
  for(const context of [...['agent','supervisor','mis','mis-manager','backend'].map(role=>({...actor,role})),{...actor,clientId:''},null]) {
    assert.throws(()=>management.systemSenderAccounts(context,definition,storage),/Client Admin/);
    assert.equal(reads,0);
  }
});

test('Agent strategies require an available selected fallback and retain it only while that account remains eligible',()=>{
  const app=fixture(),state=app.api.getState(),input=managementInput({senderType:'agent',fallbackSenderAccountId:'sender-primary'});
  const built=management.buildStrategy(input,null,state,actor,senderAccounts);
  assert.equal(built.fallbackSenderAccountId,'sender-primary');
  const saved=app.api.saveStrategy(built),reopened=createInstance({storage:app.storage,context:actor}).getState().strategies.find(row=>row.id===saved.id);
  assert.equal(reopened.fallbackSenderAccountId,'sender-primary');
  const omitted=managementInput({senderType:'agent'});
  assert.equal(management.buildStrategy(omitted,saved,state,actor,senderAccounts).fallbackSenderAccountId,'sender-primary');
  for(const fallbackSenderAccountId of ['',null,{},'unavailable']) {
    assert.throws(()=>management.buildStrategy({...input,fallbackSenderAccountId},saved,state,actor,senderAccounts),/fallback|system generated/i);
  }
  assert.throws(()=>management.buildStrategy(omitted,saved,state,actor,[senderAccounts[1]]),/fallback|system generated/i);
  assert.throws(()=>management.buildStrategy(omitted,null,state,actor,senderAccounts),/fallback|system generated/i);
  assert.throws(()=>management.buildStrategy(input,null,state,actor),/fallback|system generated/i);
  assert.equal(saved.fallbackSenderAccountId,'sender-primary');
  for(const senderType of ['system','arservices']) {
    assert.equal(management.buildStrategy({...input,senderType,systemSenderAccountId:'sender-primary'},saved,state,actor,senderAccounts).fallbackSenderAccountId,'','other sender choices clear the Agent fallback');
  }
});

test('optional core fallback IDs preserve legacy compatibility and reject malformed edits atomically',()=>{
  for(const fallbackSenderAccountId of [undefined,'','sender-primary','a'.repeat(200)]) {
    const app=fixture(),saved=app.api.saveStrategy(draft({senderType:'agent',...(fallbackSenderAccountId===undefined?{}:{fallbackSenderAccountId})}));
    assert.equal(saved.fallbackSenderAccountId,fallbackSenderAccountId);
    assert.equal(app.api.saveStrategy({id:saved.id,name:'Updated name'}).fallbackSenderAccountId,fallbackSenderAccountId);
  }
  const app=fixture();app.api.saveStrategy(draft({senderType:'agent',fallbackSenderAccountId:'sender-primary'}));
  for(const fallbackSenderAccountId of [null,false,true,1,[],{},' sender-primary','sender-primary ','a'.repeat(201)]) {
    unchanged(app,()=>app.api.saveStrategy({id:'sender-strategy',fallbackSenderAccountId}),/fallback|system generated/i);
  }
});

function mountedFixture({rows=senderAccounts,seedRows=senderAccounts}={}) {
  const app=fixture(),listeners={},modalListeners={},nodes=new Map();
  senderRows(app,rows);
  const element=()=>({innerHTML:'',hidden:false,textContent:'',classList:{toggle(){},remove(){},add(){}},setAttribute(){},addEventListener(){},removeEventListener(){}});
  const container={...element(),querySelector(selector){if(!nodes.has(selector))nodes.set(selector,element());return nodes.get(selector);},querySelectorAll:()=>[],addEventListener(type,listener){listeners[type]=listener;}};
  const fields={name:{value:'Sender modal scenario'},status:{value:'draft'},subClient:{value:'North'},targetType:{value:'customer'},targetMode:{value:'all'},senderType:{name:'senderType',value:'system'},systemSenderAccountId:{name:'systemSenderAccountId',value:'',disabled:false,required:true},fallbackSenderAccountId:{name:'fallbackSenderAccountId',value:'',disabled:true,required:false},'days-0':{value:'15'},'template-0':{value:'dunning-template-1'},'key-0':{value:'all'},'all-statuses-0':{checked:true},'all-aging-0':{checked:true}};
  const error=element(),help=element(),targets=element(),fallback=element(),system=element();
  const form={elements:fields,matches:selector=>selector.split(',').includes('[data-dm-strategy]'),querySelector:selector=>selector==='.dmFormError'?error:null};
  const modal={...element(),addEventListener(type,listener){modalListeners[type]=listener;},querySelector(selector){return {'[data-dm-strategy]':form,'[data-dm-sender-help]':help,'[data-dm-targets]':targets,'[data-dm-agent-fallback]':fallback,'[data-dm-system-sender]':system,'[name="systemSenderAccountId"]':fields.systemSenderAccountId,'[name="fallbackSenderAccountId"]':fields.fallbackSenderAccountId}[selector]||null;}};
  let markup='';
  Object.defineProperty(modal,'innerHTML',{get:()=>markup,set(value){
    markup=value;
    for(const name of ['senderType','fallbackSenderAccountId','systemSenderAccountId']) {
      const select=value.match(new RegExp('<select\\b([^>]*\\bname="'+name+'"[^>]*)>([\\s\\S]*?)<\\/select>'));
      if(!select)continue;
      const options=[...select[2].matchAll(/<option\b([^>]*)>([\s\S]*?)<\/option>/g)];
      const selected=options.find(option=>/\bselected\b/.test(option[1]))||options[0];
      fields[name].value=selected?.[1].match(/\bvalue="([^"]*)"/)?.[1]||'';
      fields[name].disabled=/\bdisabled\b/.test(select[1]);
      fields[name].required=/\brequired\b/.test(select[1]);
    }
    const wrapper=value.match(/<[^>]+\bdata-dm-agent-fallback\b[^>]*>/);
    fallback.hidden=Boolean(wrapper&&/\bhidden\b/.test(wrapper[0]));
    const systemWrapper=value.match(/<[^>]+\bdata-dm-system-sender\b[^>]*>/);
    system.hidden=Boolean(systemWrapper&&/\bhidden\b/.test(systemWrapper[0]));
  }});
  const host={document:{getElementById:id=>id==='adminModal'?modal:null},location:{search:'',hash:''},IneburaAdminModules:{'sender-account':{seedRows}},IneburaAdminPreviewStorage:app.storage,IneburaDunningManagementTemplates:{mount:()=>({ready:Promise.resolve(),destroy(){}})},IneburaDunningManagementReport:{mount:()=>({refresh(){},destroy(){}})}};
  vm.runInNewContext(fs.readFileSync(__dirname+'/dunning-management.js','utf8'),{window:host,URLSearchParams,Intl,Date,setTimeout,clearTimeout});
  const mounted=host.IneburaDunningManagement.mount(container,{api:app.api});
  const click=(kind,id='')=>listeners.click({target:{closest:selector=>selector==='[data-dm-action]'?{dataset:{dmAction:kind,id},disabled:false}:null}});
  const submit=()=>modalListeners.submit({target:form,preventDefault(){}});
  const change=senderType=>{const before=JSON.stringify(app.api.getState());fields.senderType.value=senderType;modalListeners.change({target:fields.senderType});assert.equal(JSON.stringify(app.api.getState()),before,'selecting a sender does not save until submit');};
  return {app,container,fields,error,help,fallback,system,modal,mounted,click,submit,change};
}

test('Create and Edit save and reopen Agent fallback selection and conditionally require and enable it',async()=>{
  const ui=mountedFixture(),{app,container,fields,help,fallback,modal,mounted,click,submit,change}=ui;
  await click('add-strategy');
  assert.match(modal.innerHTML,/<legend>Sending<\/legend>/);
  assert.match(modal.innerHTML,/<option value="system" selected>System generated email/);
  assert.match(modal.innerHTML,/Agent&#39;s email/);
  assert.match(modal.innerHTML,/arservices@tanserv\.com/);
  assert.equal(fallback.hidden,true);
  assert.equal(fields.fallbackSenderAccountId.disabled,true);
  assert.equal(fields.fallbackSenderAccountId.required,false);
  assert.match(modal.innerHTML,/collections@example\.test/);
  assert.match(modal.innerHTML,/backup@example\.test/);
  change('agent');
  assert.equal(fallback.hidden,false);
  assert.equal(fields.fallbackSenderAccountId.disabled,false);
  assert.equal(fields.fallbackSenderAccountId.required,true);
  assert.match(help.textContent,/agent has not configured their email/);
  assert.match(help.textContent,/selected system generated email/);
  assert.match(help.textContent,/arservices@tanserv\.com when fallback is toggled on/);
  fields.fallbackSenderAccountId.value='sender-backup';
  await submit();
  const saved=app.api.getState().strategies.at(-1);
  assert.equal(saved.senderType,'agent');
  assert.equal(saved.fallbackSenderAccountId,'sender-backup');
  await click('edit-strategy',saved.id);
  assert.match(modal.innerHTML,/<option value="agent" selected>/);
  assert.equal(fields.fallbackSenderAccountId.value,'sender-backup');
  assert.equal(fallback.hidden,false);
  assert.equal(fields.fallbackSenderAccountId.required,true);
  assert.equal(fields.fallbackSenderAccountId.disabled,false);
  change('system');
  assert.equal(fallback.hidden,true);
  assert.equal(fields.fallbackSenderAccountId.required,false);
  assert.equal(fields.fallbackSenderAccountId.disabled,true);
  assert.match(help.textContent,/If the system generated email is not configured/);
  assert.match(help.textContent,/when fallback is toggled on/);
  assert.doesNotMatch(help.textContent,/agent has not configured/);
  fields.systemSenderAccountId.value='sender-primary';
  await submit();
  assert.equal(app.api.getState().strategies.find(row=>row.id===saved.id).senderType,'system');
  assert.equal(app.api.getState().strategies.find(row=>row.id===saved.id).fallbackSenderAccountId,'');
  await click('edit-strategy',saved.id);
  assert.match(modal.innerHTML,/<option value="system" selected>/);
  change('arservices');
  assert.equal(fallback.hidden,true);
  assert.equal(fields.fallbackSenderAccountId.required,false);
  assert.equal(fields.fallbackSenderAccountId.disabled,true);
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

test('a missing or removed fallback is rejected on submit using fresh sender account state',async()=>{
  const ui=mountedFixture(),{app,fields,error,modal,mounted,click,submit,change}=ui;
  await click('add-strategy');change('agent');
  let before=JSON.stringify(app.api.getState());
  fields.fallbackSenderAccountId.value='';
  await submit();assert.equal(JSON.stringify(app.api.getState()),before);assert.match(error.textContent,/fallback|system generated/i);
  fields.fallbackSenderAccountId.value='sender-primary';
  senderRows(app,[senderAccounts[1]]);
  await submit();assert.equal(JSON.stringify(app.api.getState()),before);assert.match(error.textContent,/fallback|system generated/i);
  assert.match(modal.innerHTML,/collections@example\.test/,'the dialog was opened before that account was removed');
  fields.fallbackSenderAccountId.value='sender-backup';await submit();
  const saved=app.api.getState().strategies.at(-1);assert.equal(saved.fallbackSenderAccountId,'sender-backup');
  await click('edit-strategy',saved.id);assert.doesNotMatch(modal.innerHTML,/collections@example\.test/,'reopening also reads current sender accounts');
  senderRows(app,[]);before=JSON.stringify(app.api.getState());await submit();
  assert.equal(JSON.stringify(app.api.getState()),before);assert.match(error.textContent,/fallback|system generated/i);
  assert.equal(app.api.getState().strategies.find(row=>row.id===saved.id).fallbackSenderAccountId,'sender-backup');
  mounted.destroy();
});

test('an empty configured account list shows setup guidance and cannot be replaced by demo seed accounts',async()=>{
  const {app,fields,error,modal,mounted,click,submit,change}=mountedFixture({rows:[]});
  await click('add-strategy');
  assert.match(modal.innerHTML,/href="[^"]*module=sender-account/);
  assert.doesNotMatch(modal.innerHTML,/collections@example\.test|backup@example\.test/);
  change('agent');fields.fallbackSenderAccountId.value='sender-primary';
  const before=JSON.stringify(app.api.getState());await submit();
  assert.equal(JSON.stringify(app.api.getState()),before);assert.match(error.textContent,/fallback|system generated/i);
  mounted.destroy();
});

test('an open Agent form cannot read or save fallback accounts after role or client changes',async()=>{
  for(const update of [{role:'agent'},{clientId:'another-client'}]) {
    const {app,container,fields,mounted,click,submit,change}=mountedFixture();
    await click('add-strategy');change('agent');fields.fallbackSenderAccountId.value='sender-primary';
    Object.assign(app.person,update);
    let accountReads=0;const original=app.storage.getItem;
    app.storage.getItem=key=>{if(key===senderAccountKey)accountReads++;return original(key);};
    const before=JSON.stringify(app.api.getState());await submit();
    assert.equal(JSON.stringify(app.api.getState()),before);assert.equal(accountReads,0);
    assert.match(container.innerHTML,/Access restricted/);mounted.destroy();
  }
});


test('System sender selection persists per strategy and rejects missing, inactive or foreign accounts',()=>{
  const app=fixture(),state=app.api.getState();
  const input=managementInput({senderType:'system',systemSenderAccountId:'sender-backup'});
  const saved=app.api.saveStrategy(management.buildStrategy(input,null,state,actor,senderAccounts));
  assert.equal(createInstance({storage:app.storage,context:actor}).getState().strategies.find(s=>s.id===saved.id).systemSenderAccountId,'sender-backup');
  assert.equal(management.buildStrategy(managementInput({senderType:'system'}),saved,state,actor,senderAccounts).systemSenderAccountId,'sender-backup');
  for(const systemSenderAccountId of ['',null,'missing',{}])assert.throws(()=>management.buildStrategy({...input,systemSenderAccountId},saved,state,actor,senderAccounts),/sender email/);
  for(const accounts of [[],[{...senderAccounts[1],status:'Inactive'}],[{...senderAccounts[1],clientId:'foreign'}]])assert.throws(()=>management.buildStrategy(input,saved,state,actor,accounts),/sender email/);
  assert.equal(management.buildStrategy({...input,senderType:'arservices'},saved,state,actor,senderAccounts).systemSenderAccountId,'');
  for(const systemSenderAccountId of [null,{},' padded','a'.repeat(201)])unchanged(app,()=>app.api.saveStrategy({id:saved.id,systemSenderAccountId}),/sender email account/);
});

test('Create and Edit require System sender choice, restore it, and validate the live account list',async()=>{
  const {app,fields,system,fallback,error,mounted,click,submit,change}=mountedFixture();
  await click('add-strategy');
  assert.equal(system.hidden,false);assert.equal(fields.systemSenderAccountId.required,true);assert.equal(fields.systemSenderAccountId.disabled,false);
  const before=JSON.stringify(app.api.getState());await submit();assert.equal(JSON.stringify(app.api.getState()),before);assert.match(error.textContent,/sender email/);
  fields.systemSenderAccountId.value='sender-backup';await submit();const saved=app.api.getState().strategies.at(-1);
  assert.equal(saved.systemSenderAccountId,'sender-backup');assert.equal(saved.fallbackSenderAccountId,'');
  await click('edit-strategy',saved.id);assert.equal(fields.systemSenderAccountId.value,'sender-backup');
  change('agent');assert.equal(system.hidden,true);assert.equal(fields.systemSenderAccountId.required,false);assert.equal(fields.systemSenderAccountId.disabled,true);assert.equal(fallback.hidden,false);
  change('arservices');assert.equal(system.hidden,true);assert.equal(fallback.hidden,true);
  change('system');senderRows(app,[]);const unchangedState=JSON.stringify(app.api.getState());await submit();assert.equal(JSON.stringify(app.api.getState()),unchangedState);assert.match(error.textContent,/sender email/);
  await click('edit-strategy',saved.id);assert.match(fields.systemSenderAccountId.value,/sender-backup/);
  mounted.destroy();
});
