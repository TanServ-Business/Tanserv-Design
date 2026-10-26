'use strict';
const assert = require('node:assert/strict');
const {createInstance,KEY}=require('./dunning-core.js');
const admin={role:'client-admin',userId:'admin',clientId:'demo-client'};
const cases=[];
const test=(name,run)=>cases.push({name,run});
function fixture(initial,options={}) {
  const data=new Map(initial?[[KEY,JSON.stringify(initial)]]:[]);
  const storage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
  return {api:createInstance({storage,context:admin,...options}),storage,data};
}
function ready(api) {api.getState().templates.filter(row=>row.standardReady===false).forEach(row=>api.saveTemplate({...row,standardReady:true}));}
function strategy(api,count=3,input={}) {
  ready(api);
  return api.saveStrategy({id:'explicit-strategy',name:'Explicit strategy',status:'active',firstStageDays:15,subClientId:'North',stages:Array.from({length:count},(_,index)=>({templateId:`dunning-template-${index+1}`,intervalDays:index?7:0})),...input});
}
function unchanged(api,action,pattern) {
  const before=JSON.stringify(api.getState());assert.throws(action,pattern);assert.equal(JSON.stringify(api.getState()),before);
}
const firstBatch=api=>api.getState().batches.find(row=>row.createdDate==='2026-10-20');

test('one letter is valid, persisted and cannot send without an explicitly configured strategy',()=>{
  const {api,storage}=fixture();assert.equal(api.getState().letterCount,3);
  assert.deepEqual(api.saveConfiguration({enabled:true,letterCount:1}),{enabled:true,letterCount:1});
  let state=api.getState();assert.equal(state.templates.length,1);assert.equal(state.documentTypes.length,1);assert.deepEqual(state.strategies,[]);
  assert.deepEqual(api.runDaily('2026-10-20'),{date:'2026-10-20',batchesCreated:0,emailsCreated:0,failures:0,conflicts:0});
  strategy(api,1);api.runDaily('2026-10-21');state=api.getState();assert.ok(state.emails.length);assert.ok(state.batches.every(row=>row.status==='completed'));
  const saved=createInstance({storage,context:admin}).getState();assert.equal(saved.letterCount,1);assert.equal(saved.strategies.length,1);
});
test('invalid count and toggle values reject atomically',()=>{
  const {api}=fixture();
  for (const letterCount of [0,-1,1.1,'3',null,NaN,Infinity,1001,Number.MAX_SAFE_INTEGER+1]) unchanged(api,()=>api.setLetterCount(letterCount),/whole number between 1 and 1000/);
  unchanged(api,()=>api.saveConfiguration({enabled:'true',letterCount:1}),/toggle/);
});
test('provisioned standard templates cannot activate or send until the real Word template is loaded',()=>{
  const {api}=fixture();api.setEnabled(true);
  assert.equal(api.getState().templates[0].sourceType,'standard');assert.equal(api.getState().templates[0].standardReady,false);
  unchanged(api,()=>api.saveStrategy({name:'Blocked',status:'active',firstStageDays:0,stages:[{templateId:'dunning-template-1',intervalDays:0}]}),/Load the standard Word template/);
  const draft=api.saveStrategy({name:'Draft',status:'draft',firstStageDays:0,stages:[{templateId:'dunning-template-1',intervalDays:0}]});
  unchanged(api,()=>api.setStrategyStatus(draft.id,'active'),/Load the standard Word template/);
  ready(api);api.setStrategyStatus(draft.id,'active');assert.equal(api.runDaily('2026-10-20').emailsCreated,2);
});
test('increasing capacity provisions rows but leaves strategies and active batch schedules unchanged',()=>{
  const {api}=fixture();api.setEnabled(true);strategy(api);api.runDaily('2026-10-20');
  const before=api.getState(),batch=firstBatch(api),emails=JSON.stringify(before.emails);
  api.setLetterCount(5);let state=api.getState();assert.equal(state.templates.length,5);assert.equal(state.strategies[0].stages.length,3);assert.deepEqual(firstBatch(api),batch);assert.equal(JSON.stringify(state.emails),emails);
  ready(api);strategy(api,5);assert.equal(firstBatch(api).nextDate,'2026-10-27');
  for(const date of ['2026-10-27','2026-11-03','2026-11-10','2026-11-17'])api.runDaily(date);
  assert.equal(firstBatch(api).sentEmailIds.length,5);assert.equal(firstBatch(api).status,'completed');
  assert.equal(JSON.stringify(api.getState().emails.slice(0,before.emails.length)),emails);
});
test('count reduction trims all unsent strategy stages and completes batches beyond the new count without changing sent history',()=>{
  const {api}=fixture();api.saveConfiguration({enabled:true,letterCount:5});strategy(api,5);api.runDaily('2026-10-20');
  api.saveStrategy({...api.getState().strategies[0],id:'paused-strategy',name:'Paused strategy',status:'paused'});
  const issued=JSON.stringify(api.getState().emails);api.setLetterCount(1);const state=api.getState();
  assert.ok(state.strategies.every(row=>row.stages.length===1));assert.equal(firstBatch(api).status,'completed');assert.equal(firstBatch(api).nextDate,null);assert.equal(JSON.stringify(state.emails),issued);
  assert.equal(state.templates.length,5,'Keep former stage templates and document metadata for history');assert.equal(state.documentTypes.length,5);
  api.runDaily('2026-10-27');assert.equal(api.getState().emails.filter(row=>row.batchId===firstBatch(api).id).length,1);
});
test('reducing count while a stage has completely failed removes only stages above the count and preserves its retry',()=>{
  const {api}=fixture();api.setEnabled(true);strategy(api);api.runDaily('2026-10-20',{outcome:'failure'});
  const batch=firstBatch(api),issued=JSON.stringify(api.getState().emails);api.setLetterCount(1);
  assert.equal(firstBatch(api).status,'retry');assert.equal(firstBatch(api).nextDate,batch.nextDate);assert.deepEqual(firstBatch(api).attempts,batch.attempts);assert.equal(JSON.stringify(api.getState().emails),issued);
  api.runDaily('2026-10-21');assert.equal(firstBatch(api).status,'completed');assert.equal(firstBatch(api).sentEmailIds.length,1);
});
test('completed batches stay completed after a later count increase and explicit strategy expansion',()=>{
  const {api}=fixture();api.saveConfiguration({enabled:true,letterCount:1});strategy(api,1);api.runDaily('2026-10-20');
  const closed=firstBatch(api),issued=JSON.stringify(api.getState().emails);api.setLetterCount(4);strategy(api,4);api.runDaily('2026-10-27');
  assert.deepEqual(firstBatch(api),closed);assert.equal(JSON.stringify(api.getState().emails.filter(row=>row.batchId===closed.id)),issued);
  assert.ok(api.getState().batches.some(row=>row.id!==closed.id && row.status==='scheduled'));
});
test('strategy length and selected template cannot bypass the configured count',()=>{
  const {api}=fixture();api.setEnabled(true);strategy(api);api.setLetterCount(1);
  unchanged(api,()=>strategy(api,2),/no more than 1/);
  unchanged(api,()=>strategy(api,1,{stages:[{templateId:'dunning-template-3',intervalDays:0}]}),/above the configured/);
});
test('native selected customer and invoice coverage stays narrow and rejects empty or foreign selections',()=>{
  const {api}=fixture();api.setEnabled(true);
  const selected=strategy(api,1,{filters:{coverage:{targetType:'invoice',targetMode:'selected'},invoiceIds:['dunning-invoice-1-1']}});
  for (const filters of [{coverage:{targetType:'invoice',targetMode:'selected'},invoiceIds:[]},{coverage:{targetType:'customer',targetMode:'selected'},customerIds:[]},{invoiceIds:['unknown-invoice']},{customerIds:['unknown-customer']},{invoiceIds:'dunning-invoice-1-1'}]) unchanged(api,()=>api.saveStrategy({...selected,filters}),/Select at least one|scope|valid customer/);
  api.runDaily('2026-10-20');assert.deepEqual(api.getState().emails[0].letterSnapshot.invoices.map(row=>row.id),['dunning-invoice-1-1']);
  assert.equal(api.getState().batches.length,1);
  const other=api.getState().customers[1];
  api.saveStrategy({...selected,id:'customer-coverage',name:'Customer coverage',subClientId:'',filters:{coverage:{targetType:'customer',targetMode:'selected'},customerIds:[other.id]}});
  api.runDaily('2026-10-21');const customerMail=api.getState().emails.find(row=>row.strategyId==='customer-coverage');assert.equal(customerMail.customerId,other.id);
});
test('eligibility preview only returns the managing client’s invoices',()=>{
  const {api}=fixture();api.setEnabled(true);const saved=strategy(api);
  api.syncInvoices([{id:'foreign-customer',name:'Private customer',clientId:'foreign',invoices:[{id:'foreign-invoice',invoiceNo:'PRIVATE',dueDate:'2026-10-01',amount:100}]}],{...admin,clientId:'foreign'});
  const before=JSON.stringify(api.getState()),rows=api.previewEligibility(saved.id,'2026-10-20');
  assert.ok(rows.length);assert.ok(rows.every(row=>row.invoice.clientId==='demo-client'));assert.equal(rows.some(row=>row.invoice.id==='foreign-invoice'),false);assert.equal(JSON.stringify(api.getState()),before);
});
test('email edited in Dunning management is not replaced by the old Template Master catalog',()=>{
  const catalog=[{id:'xeon-template-46',code:'DunningLetterOneEmail',eventType:'DunningLetterOne',communicationMode:'Email',subject:'Old global subject',body:'Old global body'}];
  const {api}=fixture(undefined,{emailTemplates:catalog});api.setEnabled(true);strategy(api);api.runDaily('2026-10-20');
  const first=api.getState().emails[0];assert.equal(first.subject,'Old global subject');
  const template=api.getState().templates[0];api.saveTemplate({...template,managedIn:'dunning-management',emailSubject:'New Dunning subject',emailBody:'New Dunning message',emailTemplateSource:{id:'new-owned-email',subject:'New Dunning subject',body:'New Dunning message'}});
  api.runDaily('2026-10-21');const issued=api.getState().emails;
  assert.equal(issued.at(-1).subject,'New Dunning subject');assert.equal(issued.at(-1).body,'New Dunning message');assert.deepEqual(issued[0],first);
});
test('Supervisor, Agent and MIS cannot invoke management actions or mutate configuration',()=>{
  const {api}=fixture();api.setEnabled(true);const saved=strategy(api);
  for (const role of ['supervisor','agent','mis-user']) {
    const actor={...admin,role};
    for (const action of [()=>api.saveConfiguration({enabled:false,letterCount:1},actor),()=>api.setLetterCount(1,actor),()=>api.setEnabled(false,actor),()=>api.saveTemplate(api.getState().templates[0],actor),()=>api.saveStrategy(saved,actor),()=>api.setStrategyStatus(saved.id,'paused',actor),()=>api.runDaily('2026-10-20',{actor}),()=>api.resolveConflict('dunning-invoice-1-1',saved.id,actor),()=>api.previewEligibility(saved.id,'2026-10-20',actor)]) unchanged(api,action,/permission/);
  }
  api.excludeInvoice('dunning-invoice-1-1',{...admin,role:'agent',userId:'demo-agent'});assert.equal(api.getState().exclusions.length,1);
  unchanged(api,()=>api.excludeInvoice('dunning-invoice-1-4',{...admin,role:'agent',userId:'other-agent'}),/assigned/);
});
test('legacy saved data preserves IDs, custom templates, stages and completed history while inferring capacity',()=>{
  const source=fixture().api;source.saveConfiguration({enabled:true,letterCount:4});strategy(source,4);source.runDaily('2026-10-20');
  const original=source.getState();delete original.letterCount;original.templates.forEach(row=>{delete row.standardReady;delete row.sourceType;});
  const {api}=fixture(original);assert.equal(api.getState().letterCount,4);
  const oldTemplates=JSON.stringify(api.getState().templates),oldEmails=JSON.stringify(api.getState().emails);api.setEnabled(true);
  assert.equal(api.getState().strategies[0].id,'explicit-strategy');assert.equal(api.getState().strategies[0].stages.length,4);assert.equal(JSON.stringify(api.getState().templates),oldTemplates);assert.equal(JSON.stringify(api.getState().emails),oldEmails);
  api.runDaily('2026-10-27');assert.ok(api.getState().emails.some(row=>row.stage===2));
});

let failures=0;for(const {name,run} of cases){try{run();process.stdout.write(`PASS ${name}\n`);}catch(error){failures++;console.error(`FAIL ${name}\n${error.stack}`);}}
if(failures)process.exitCode=1;else process.stdout.write(`${cases.length} Dunning configuration tests passed.\n`);
