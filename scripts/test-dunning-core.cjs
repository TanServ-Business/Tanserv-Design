'use strict';
const assert = require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createInstance, KEY} = require('./dunning-core.js');
const manager = {role:'client-admin',userId:'admin',clientId:'demo-client'};
const supervisor = {...manager,role:'supervisor'};
const agent = {...manager,role:'agent',userId:'demo-agent'};
function configureStrategy(api) {
  api.getState().templates.forEach(template=>api.saveTemplate({...template,standardReady:true}));
  api.saveStrategy({id:'dunning-strategy-demo',name:'Explicit test daily payment reminders',status:'active',firstStageDays:15,stages:[{templateId:'dunning-template-1',intervalDays:0},{templateId:'dunning-template-2',intervalDays:7},{templateId:'dunning-template-3',intervalDays:7}],filters:{}});
}
function fixture() {
  const map = new Map();
  const storage = {getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value)};
  const api=createInstance({storage,context:manager});
  api.setEnabled(true);configureStrategy(api);
  return {api,storage,map};
}
function onlyNorth(api) { const strategy=api.getState().strategies[0];api.saveStrategy({...strategy,subClientId:'North'}); }
function northBatch(api,date) {return api.getState().batches.find(row=>row.customerId==='dunning-customer-north' && row.createdDate===date);}
function immutableFailure(api,action,pattern) { const before=JSON.stringify(api.getState()); assert.throws(action,pattern);assert.equal(JSON.stringify(api.getState()),before); }
const cases=[];
function test(name,run) {cases.push({name,run});}
function strategyMasterFixture() {
 const result=fixture(),{api}=result;
 const source=api.getState();
 api.syncInvoices(source.customers.map((customer,index)=>({...customer,strategyMasterCustomerId:`sm-customer-${index+1}`,strategyMasterKeyAccount:index===0?'yes':'no',invoices:source.invoices.filter(invoice=>invoice.customerId===customer.id).map(invoice=>({...invoice,strategyMasterInvoiceId:invoice.invoiceNo,strategyMasterCustomerId:`sm-customer-${index+1}`,strategyMasterSubStatus:'PTP',ageingBucket:'5+ yrs'}))})));
 const strategy=api.getState().strategies[0];
 api.saveStrategy({...strategy,filters:{strategyMaster:{targetType:'invoice',targetMode:'all',selectedTargetIds:[],excludedTargetIds:[]}}});
 return result;
}

test('enabling is idempotent and persistence survives new instances',()=>{
 const {api,storage}=fixture();api.setEnabled(false);api.setEnabled(true);
 assert.equal(api.getState().documentTypes.length,3);assert.equal(api.getState().templates.length,3);
 assert.equal(createInstance({storage,context:manager}).getState().strategies[0].status,'active');
 const detached=api.getState();detached.invoices[0].outstanding=0;assert.notEqual(api.getState().invoices[0].outstanding,0);
});
test('daily batches progress independently and repeated runs never resend',()=>{
 const {api}=fixture();onlyNorth(api);
 assert.equal(api.runDaily('2026-10-20').batchesCreated,1);
 api.runDaily('2026-10-21');api.runDaily('2026-10-22');
 assert.equal(api.getState().batches.length,3);
 assert.equal(northBatch(api,'2026-10-20').nextDate,'2026-10-27');
 assert.equal(northBatch(api,'2026-10-21').nextDate,'2026-10-28');
 const count=api.getState().emails.length;api.runDaily('2026-10-22');assert.equal(api.getState().emails.length,count);
 api.runDaily('2026-10-27');assert.equal(northBatch(api,'2026-10-20').stage,3);
 assert.equal(northBatch(api,'2026-10-21').stage,2);
});
test('new Letter 1 and earlier Letter 2 on same day remain separate emails',()=>{
 const {api}=fixture();onlyNorth(api);api.runDaily('2026-10-20');
 api.syncInvoices([{id:'dunning-customer-north',name:'Sample: Aurora Manufacturing',subClientId:'North',invoices:[{id:'later-invoice',invoiceNo:'LATER',dueDate:'2026-10-12',amount:3000}]}]);
 api.runDaily('2026-10-27');const emails=api.getState().emails.filter(row=>row.date==='2026-10-27');
 assert.deepEqual(emails.map(row=>row.stage).sort(),[1,2]);
 assert.notEqual(emails[0].batchId,emails[1].batchId);
});
test('fully paid invoices excluded; partial payments snapshot remaining balance',()=>{
 const {api}=fixture();onlyNorth(api);api.runDaily('2026-10-20');api.updateInvoice('dunning-invoice-1-1',{outstanding:4000});api.updateInvoice('dunning-invoice-1-4',{outstanding:0});
 api.runDaily('2026-10-27');const email=api.getState().emails.find(row=>row.stage===2);assert.equal(email.letterSnapshot.totalOutstanding,4000);
 const first=api.getState().emails[0];assert.equal(first.letterSnapshot.invoices[0].outstanding,10000);assert.match(first.reference,/^DL-20261020-\d{6}$/);
 api.updateInvoice('dunning-invoice-1-1',{outstanding:0});api.runDaily('2026-11-03');
 assert.equal(api.getState().emails.filter(row=>row.batchId===first.batchId).length,2);
});
test('manual exclusions persist, block sends, and reinstatement stays pending',()=>{
 const {api}=fixture();onlyNorth(api);api.excludeInvoice('dunning-invoice-1-1',agent);api.excludeInvoice('dunning-invoice-1-4',agent);api.runDaily('2026-10-20');assert.equal(api.getState().emails.length,0);
 immutableFailure(api,()=>api.reinstateInvoice('dunning-invoice-1-1',agent),/pending team confirmation/);
 assert.equal(api.getState().exclusions[0].active,true);
});
test('complete failures retry next day, shift remaining schedule, and have no invented cap',()=>{
 const {api}=fixture();onlyNorth(api);
 api.runDaily('2026-10-20',{outcome:'failure'});api.runDaily('2026-10-20',{outcome:'success'});
 assert.equal(northBatch(api,'2026-10-20').attempts.length,1);
 api.runDaily('2026-10-21',{outcome:'failure'});api.runDaily('2026-10-22',{outcome:'success'});
 const batch=northBatch(api,'2026-10-20');assert.equal(batch.nextDate,'2026-10-29');assert.equal(batch.delayDays,2);assert.equal(batch.stage,2);
 assert.equal(batch.attempts.length,3);assert.equal(batch.sentEmailIds.length,1);
});
test('partial success completes stage and does not retry failed contacts',()=>{
 const {api}=fixture();onlyNorth(api);api.runDaily('2026-10-20',{outcome:'partial'});
 const batch=northBatch(api,'2026-10-20');assert.equal(batch.stage,2);assert.equal(batch.nextDate,'2026-10-27');
 const email=api.getState().emails[0];assert.equal(email.status,'partial');assert.deepEqual(email.recipientResults.map(row=>row.status),['sent','failed']);
 api.runDaily('2026-10-21');assert.equal(northBatch(api,'2026-10-20').attempts.length,1);
});
test('all role and client-scope guards reject without any mutation',()=>{
 const {api}=fixture();
 for (const action of [()=>api.setEnabled(false,agent),()=>api.addDocumentType('New',agent),()=>api.saveTemplate(api.getState().templates[0],agent),()=>api.saveStrategy(api.getState().strategies[0],agent),()=>api.setStrategyStatus('dunning-strategy-demo','paused',agent),()=>api.runDaily('2026-10-20',{actor:agent}),()=>api.updateInvoice('dunning-invoice-1-1',{outstanding:0},agent),()=>api.excludeInvoice('dunning-invoice-1-1',supervisor),()=>api.excludeInvoice('dunning-invoice-1-1',{...agent,userId:'another-agent'}),()=>api.updateInvoice('dunning-invoice-1-1',{outstanding:0},{...manager,clientId:'other-client'})]) immutableFailure(api,action,/permission|scope|assigned/);
 immutableFailure(api,()=>api.saveTemplate({...api.getState().templates[0],name:'Supervisor revision'},supervisor),/permission/);
});
test('overlapping strategies hold invoices until one strategy is selected',()=>{
 const {api}=fixture();onlyNorth(api);const original=api.getState().strategies[0];api.saveStrategy({...original,id:'strategy-two',name:'Second'});
 api.runDaily('2026-10-20');assert.equal(api.getState().emails.length,0);const conflict=api.getState().conflicts[0];assert.equal(conflict.status,'unresolved');
 api.resolveConflict(conflict.invoiceId,'strategy-two');api.runDaily('2026-10-20');
 assert.equal(api.getState().emails.length,1);assert.equal(api.getState().batches[0].strategyId,'strategy-two');
});
test('active strategy/template edits apply to unsent stages but preserve sent snapshots',()=>{
 const {api}=fixture();onlyNorth(api);api.runDaily('2026-10-20');const frozen=JSON.stringify(api.getState().emails[0]);
 const strategy=api.getState().strategies[0];strategy.stages[1].intervalDays=3;api.saveStrategy(strategy);
 const template=api.getState().templates[1];api.saveTemplate({...template,body:'<p>Changed {{customerName}}</p>',letterHtml:'<p>Changed {{customerName}}</p>'});
 assert.equal(northBatch(api,'2026-10-20').nextDate,'2026-10-23');api.runDaily('2026-10-23');
 assert.match(api.getState().emails.find(row=>row.stage===2).letterSnapshot.template.body,/Changed/);
 assert.equal(JSON.stringify(api.getState().emails[0]),frozen);
});
test('additional letter stages continue without final escalation',()=>{
 const {api}=fixture();onlyNorth(api);api.setLetterCount(4);const strategy=api.getState().strategies[0];strategy.stages.push({templateId:'dunning-template-3',intervalDays:7});api.saveStrategy(strategy);
 for(const date of ['2026-10-20','2026-10-27','2026-11-03','2026-11-10'])api.runDaily(date);
 const batch=northBatch(api,'2026-10-20');assert.equal(batch.status,'completed');assert.equal(batch.sentEmailIds.length,4);assert.equal(batch.nextDate,null);
});
test('missed-date resume is blocked; immediate resume allowed; disable prevents runs',()=>{
 const {api}=fixture();onlyNorth(api);api.runDaily('2026-10-20');api.setStrategyStatus('dunning-strategy-demo','paused');
 immutableFailure(api,()=>api.setStrategyStatus('dunning-strategy-demo','active',{...manager,date:'2026-10-28'}),/pending team confirmation/);
 api.setStrategyStatus('dunning-strategy-demo','active',{...manager,date:'2026-10-21'});
 api.setEnabled(false);immutableFailure(api,()=>api.runDaily('2026-10-22'),/Enable/);
});
test('missing contacts hold the batch and template validation rejects unknown calculations',()=>{
 const {api}=fixture();onlyNorth(api);api.syncInvoices([{id:'dunning-customer-north',name:'Sample missing contacts',subClientId:'North',contacts:[],invoices:[]}]);
 api.runDaily('2026-10-20');assert.equal(api.getState().emails[0].failureReason,'No customer contacts');assert.equal(northBatch(api,'2026-10-20').stage,1);
 immutableFailure(api,()=>api.saveTemplate({...api.getState().templates[0],calculation:{totalOutstanding:'eval(1)'}}),/calculation/);
 immutableFailure(api,()=>api.saveTemplate({...api.getState().templates[0],letterHtml:'{{notMapped}}'}),/Map/);
 immutableFailure(api,()=>api.runDaily('2026-02-31'),/valid date/);
});
test('storage failures do not partially mutate in-memory state',()=>{
 const api=createInstance({storage:{getItem:()=>null,setItem:()=>{throw Error('quota');}},context:manager});
 immutableFailure(api,()=>api.setEnabled(true),/could not be saved/);
});
test('live invoice synchronization preserves sent history and blocks foreign assignments',()=>{
 const {api}=fixture();onlyNorth(api);api.runDaily('2026-10-20');const frozen=JSON.stringify(api.getState().emails[0]);
 api.syncInvoices([{id:'dunning-customer-north',name:'Sample: Aurora Manufacturing',subClientId:'North',invoices:[{id:'dunning-invoice-1-1',dueDate:'2026-10-05',amount:10000,outstandingAmount:5000}]}],agent);
 assert.equal(api.getState().invoices[0].outstanding,5000);assert.equal(JSON.stringify(api.getState().emails[0]),frozen);
 immutableFailure(api,()=>api.syncInvoices([{id:'foreign-customer',name:'Foreign',clientId:'foreign',invoices:[]}],agent),/scope/);
});
test('same-day customer invoices consolidate in one letter and exclusion has an accurate empty status',()=>{
 const {api}=fixture();onlyNorth(api);api.runDaily('2026-10-20');
 assert.equal(api.getState().emails.length,1);assert.equal(api.getState().emails[0].letterSnapshot.invoices.length,2);
 api.excludeInvoice('dunning-invoice-1-1',agent);api.excludeInvoice('dunning-invoice-1-4',agent);api.runDaily('2026-10-27');
 const batch=northBatch(api,'2026-10-20');assert.equal(batch.status,'empty');assert.match(batch.emptyReason,/excluded/);
});
test('changed filters apply to unsent stages without altering sent membership',()=>{
 const {api}=fixture();onlyNorth(api);api.runDaily('2026-10-20');
 const first=api.getState().emails[0];const strategy=api.getState().strategies[0];
 api.saveStrategy({...strategy,filters:{invoiceIds:['dunning-invoice-1-4']}});api.runDaily('2026-10-27');
 const next=api.getState().emails.find(row=>row.batchId===first.batchId && row.stage===2);
 assert.deepEqual(next.letterSnapshot.invoices.map(row=>row.id),['dunning-invoice-1-4']);
 assert.equal(api.getState().emails[0].letterSnapshot.invoices.length,2);
});
test('saved minimum thresholds retire on load without changing other filters or issued letters',()=>{
 const {api,storage}=fixture();onlyNorth(api);api.runDaily('2026-10-20');
 const saved=api.getState();saved.emails[0].letterSnapshot.pdfDataUri='data:application/pdf;base64,c2VudC1sZXR0ZXI=';
 const history=JSON.stringify(saved.emails),batches=JSON.stringify(saved.batches);
 saved.strategies[0].filters={minOutstanding:999999,invoiceIds:['dunning-invoice-1-1','dunning-invoice-1-4']};
 saved.strategies[0].stages[1].filters={minOutstanding:999999,agingBuckets:['1-30']};
 saved.invoices.find(row=>row.id==='dunning-invoice-1-1').outstanding=0.01;
 saved.invoices.find(row=>row.id==='dunning-invoice-1-4').outstanding=0;
 storage.setItem(KEY,JSON.stringify(saved));
 const restored=createInstance({storage,context:manager}),current=restored.getState(),persisted=JSON.parse(storage.getItem(KEY));
 assert.deepEqual(current.strategies[0].filters,{invoiceIds:['dunning-invoice-1-1','dunning-invoice-1-4']});
 assert.deepEqual(current.strategies[0].stages[1].filters,{agingBuckets:['1-30']});
 assert.deepEqual(persisted.strategies,current.strategies);
 assert.equal(JSON.stringify(current.emails),history);assert.equal(JSON.stringify(current.batches),batches);
 restored.runDaily('2026-10-27');
 const next=restored.getState().emails.find(row=>row.stage===2);
 assert.deepEqual(next.letterSnapshot.invoices.map(row=>row.id),['dunning-invoice-1-1']);
 assert.equal(next.letterSnapshot.totalOutstanding,0.01);
 assert.equal(JSON.stringify(restored.getState().emails.slice(0,1)),history);
});
test('strategy saves discard obsolete minimum values and include any positive outstanding balance',()=>{
 const {api,storage}=fixture();onlyNorth(api);
 api.updateInvoice('dunning-invoice-1-1',{outstanding:0.01});api.updateInvoice('dunning-invoice-1-4',{outstanding:0});
 const strategy=api.saveStrategy({...api.getState().strategies[0],filters:{minOutstanding:'obsolete-invalid',invoiceIds:['dunning-invoice-1-1','dunning-invoice-1-4']}});
 assert.deepEqual(strategy.filters,{invoiceIds:['dunning-invoice-1-1','dunning-invoice-1-4']});
 assert.deepEqual(JSON.parse(storage.getItem(KEY)).strategies[0].filters,strategy.filters);
 api.runDaily('2026-10-20');const sent=api.getState().emails[0];
 assert.deepEqual(sent.letterSnapshot.invoices.map(row=>row.id),['dunning-invoice-1-1']);
 assert.equal(sent.letterSnapshot.totalOutstanding,0.01);
});
test('conflict selection after Letter 1 transfers only remaining stages and preserves sent history',()=>{
 const {api}=fixture();onlyNorth(api);api.runDaily('2026-10-20');const first=api.getState().emails[0], frozen=JSON.stringify(first);
 const original=api.getState().strategies[0];api.saveStrategy({...original,id:'strategy-two',name:'Other strategy'});
 api.runDaily('2026-10-27');assert.equal(api.getState().emails.filter(row=>row.batchId===first.batchId).length,1);
 api.resolveConflict('dunning-invoice-1-1','strategy-two');api.runDaily('2026-10-27');
 const transferred=api.getState().batches.find(row=>row.transferredFrom===first.batchId);
 assert.equal(transferred.strategyId,'strategy-two');assert.equal(transferred.stage,3);
 const letter=api.getState().emails.find(row=>row.batchId===transferred.id);assert.equal(letter.stage,2);
 assert.deepEqual(letter.letterSnapshot.previousReferences,[first.reference]);
 assert.equal(JSON.stringify(api.getState().emails[0]),frozen);
 assert.ok(api.getState().batches.find(row=>row.id===first.batchId).originalInvoiceIds.includes('dunning-invoice-1-1'));
});
test('browser saves the actual PDF bytes and receives state updates from other tabs',()=>{
 const events=new Map(),saved=new Map();
 const fakeWindow={localStorage:{getItem:key=>saved.get(key)||null,setItem:(key,value)=>saved.set(key,value)},location:{pathname:'/pages/admin.html',search:''},addEventListener:(name,fn)=>events.set(name,fn),IneburaDunningDocuments:{createPdf:snapshot=>'data:application/pdf;base64,'+Buffer.from(snapshot.reference).toString('base64')}};
 vm.runInNewContext(fs.readFileSync(require.resolve('./dunning-core.js'),'utf8'),{window:fakeWindow,URLSearchParams,Intl,Date,Map,Set,JSON});
 const api=fakeWindow.IneburaDunning;api.setEnabled(true);configureStrategy(api);api.runDaily('2026-10-20');
 assert.match(api.getState().emails[0].letterSnapshot.pdfDataUri,/^data:application\/pdf;base64,/);
 let updates=0;api.subscribe(()=>updates++);const fromOtherTab=api.getState(),issued=JSON.stringify(fromOtherTab.emails);fromOtherTab.enabled=false;fromOtherTab.revision++;
 fromOtherTab.strategies[0].filters={minOutstanding:999999,customerIds:['dunning-customer-north']};
 events.get('storage')({key:KEY,newValue:JSON.stringify(fromOtherTab)});assert.equal(api.getState().enabled,false);assert.equal(updates,1);
 assert.deepEqual(api.getState().strategies[0].filters,{customerIds:['dunning-customer-north']});
 assert.deepEqual(JSON.parse(saved.get(KEY)).strategies[0].filters,{customerIds:['dunning-customer-north']});
 assert.equal(JSON.stringify(api.getState().emails),issued);
});
test('browser roles follow explicit query then Admin shell then user workspace preference',()=>{
 const source=fs.readFileSync(require.resolve('./dunning-core.js'),'utf8');
 const contextFor=(pathname,search,stored,shell)=>{
  const window={location:{pathname,search},document:{body:{dataset:shell?{adminRole:shell}:{}}},localStorage:{getItem:key=>key==='activeUserRole'?stored:null,setItem(){}},addEventListener(){}};
  vm.runInNewContext(source,{window,URLSearchParams,Intl,Date,Map,Set,JSON});return window.IneburaDunning.getContext();
 };
 assert.equal(contextFor('/pages/admin.html','','agent').role,'client-admin');
 assert.equal(contextFor('/pages/admin.html','','agent','admin').role,'client-admin');
 assert.equal(contextFor('/pages/admin.html','?role=supervisor','agent','admin').role,'supervisor');
 assert.equal(contextFor('/pages/admin.html','?role=agent','client-admin','admin').role,'agent');
 assert.equal(contextFor('/index.html','','agent').role,'agent');
 assert.equal(contextFor('/pages/strategy-master.html','','supervisor').role,'supervisor');
 assert.equal(contextFor('/pages/strategy-master.html','?role=client-admin','agent').role,'client-admin');
});
test('issued letter snapshots preserve source codes and never substitute internal IDs',()=>{
 const {api}=fixture();onlyNorth(api);api.runDaily('2026-10-20');
 const issued=api.getState().emails[0];const frozen=JSON.stringify(issued);
 assert.equal(issued.letterSnapshot.clientCode,'SAMPLE-CLIENT');assert.equal(issued.letterSnapshot.customerCode,'SAMPLE-CUST-001');
 api.syncInvoices([{id:'dunning-customer-north',name:'Updated customer display',subClientId:'North',clientCode:'UPDATED-CLIENT',customerCode:'UPDATED-CUSTOMER',invoices:[]}]);
 api.runDaily('2026-10-27');
 const next=api.getState().emails.find(email=>email.batchId===issued.batchId && email.stage===2);
 assert.equal(next.letterSnapshot.clientCode,'UPDATED-CLIENT');assert.equal(next.letterSnapshot.customerCode,'UPDATED-CUSTOMER');assert.equal(JSON.stringify(api.getState().emails[0]),frozen);
 const other=fixture().api;
 other.syncInvoices([{id:'internal-customer-id',name:'Source customer',code:'ACTUAL-CUSTOMER-CODE',contacts:['accounts@example.test'],invoices:[{id:'source-invoice-id',invoiceNo:'SOURCE-INVOICE',dueDate:'2026-10-05',amount:1000}]}]);
 other.runDaily('2026-10-20');const source=other.getState().emails.find(email=>email.customerId==='internal-customer-id').letterSnapshot;
 assert.equal(source.clientCode,'');assert.equal(source.customerCode,'ACTUAL-CUSTOMER-CODE');
});
test('Strategy Master selected invoice IDs and exclusions never widen to the full portfolio',()=>{
 const {api}=strategyMasterFixture(),strategy=api.getState().strategies[0];
 api.saveStrategy({...strategy,filters:{strategyMaster:{targetType:'invoice',targetMode:'selected',selectedTargetIds:['SAMPLE-101','SAMPLE-104'],excludedTargetIds:['SAMPLE-104']}}});
 api.runDaily('2026-10-20');
 assert.deepEqual(api.getState().emails.flatMap(email=>email.letterSnapshot.invoices.map(invoice=>invoice.invoiceNo)),['SAMPLE-101']);
 const empty=strategyMasterFixture().api,current=empty.getState().strategies[0];
 empty.saveStrategy({...current,filters:{strategyMaster:{targetType:'invoice',targetMode:'selected',selectedTargetIds:[],excludedTargetIds:[]}}});
 assert.equal(empty.runDaily('2026-10-20').emailsCreated,0);
 const internal=strategyMasterFixture().api;
 internal.saveStrategy({...internal.getState().strategies[0],filters:{strategyMaster:{targetType:'invoice',targetMode:'selected',selectedTargetIds:['dunning-invoice-1-1']}}});
 assert.equal(internal.runDaily('2026-10-20').emailsCreated,0);
});
test('Strategy Master customer selection and All exclusions use source IDs and reject unlinked records',()=>{
 for (const target of [
  {targetType:'customer',targetMode:'selected',selectedTargetIds:['sm-customer-1']},
  {targetType:'customer',targetMode:'all',excludedTargetIds:['sm-customer-2']}
 ]) {
  const {api}=strategyMasterFixture();
  api.syncInvoices([{id:'unlinked-customer',name:'Outside Strategy Master source',contacts:['test@example.test'],invoices:[{id:'unlinked-invoice',dueDate:'2026-10-05',amount:2000}]}]);
  api.saveStrategy({...api.getState().strategies[0],filters:{strategyMaster:target}});
  api.runDaily('2026-10-20');
  assert.deepEqual(api.getState().emails.map(email=>email.customerId),['dunning-customer-north']);
 }
});
test('editing global target exclusions applies to unsent batch stages and preserves issued letters',()=>{
 const {api}=strategyMasterFixture();api.runDaily('2026-10-20');
 const first=api.getState().emails.find(email=>email.customerId==='dunning-customer-north'),frozen=JSON.stringify(first),strategy=api.getState().strategies[0];
 api.saveStrategy({...strategy,filters:{strategyMaster:{...strategy.filters.strategyMaster,excludedTargetIds:['SAMPLE-101']}}});
 api.runDaily('2026-10-27');
 const later=api.getState().emails.find(email=>email.batchId===first.batchId && email.stage===2);
 assert.deepEqual(later.letterSnapshot.invoices.map(invoice=>invoice.invoiceNo),['SAMPLE-104']);
 assert.equal(JSON.stringify(api.getState().emails.find(email=>email.id===first.id)),frozen);
});
test('each template uses its current leaf status and key account filters for its own stage',()=>{
 const {api}=strategyMasterFixture(),strategy=api.getState().strategies[0];
 strategy.stages[0].filters={keyAccountFilter:'yes',invoiceStatuses:['PTP'],invoiceBroadSelections:['Work In Progress'],invoicePrimarySelections:[],agingBuckets:['1-30']};
 strategy.stages[1].filters={keyAccountFilter:'yes',invoiceStatuses:['Funds Issue'],invoiceBroadSelections:[],invoicePrimarySelections:['Work In Progress|||Collection In Progress'],agingBuckets:['1-30']};
 api.saveStrategy(strategy);api.runDaily('2026-10-20');
 assert.equal(api.getState().emails.length,1);
 const first=api.getState().emails[0],frozen=JSON.stringify(first);
 assert.deepEqual(first.letterSnapshot.invoices.map(invoice=>invoice.invoiceNo),['SAMPLE-101','SAMPLE-104']);
 api.syncInvoices([{id:'dunning-customer-north',subClientId:'North',invoices:[{id:'dunning-invoice-1-1',strategyMasterSubStatus:'Funds Issue'}]}]);
 api.runDaily('2026-10-27');
 const second=api.getState().emails.find(email=>email.batchId===first.batchId && email.stage===2);
 assert.deepEqual(second.letterSnapshot.invoices.map(invoice=>invoice.invoiceNo),['SAMPLE-101']);
 assert.equal(JSON.stringify(api.getState().emails.find(email=>email.id===first.id)),frozen);
});
test('unknown key accounts and missing or empty status selections cannot satisfy restrictive template filters',()=>{
 for (const keyAccountFilter of ['yes','no']) {
  const {api}=fixture();
  const strategy=api.getState().strategies[0];strategy.stages[0].filters={keyAccountFilter};api.saveStrategy(strategy);
  assert.equal(api.runDaily('2026-10-20').emailsCreated,0);
 }
 for (const filters of [{invoiceStatuses:[]},{invoiceStatuses:['Unknown source status']},{invoiceBroadSelections:['Work In Progress']}]) {
  const {api}=strategyMasterFixture(),strategy=api.getState().strategies[0];strategy.stages[0].filters=filters;api.saveStrategy(strategy);
  assert.equal(api.runDaily('2026-10-20').emailsCreated,0);
 }
 const {api}=strategyMasterFixture(),strategy=api.getState().strategies[0];strategy.stages[0].filters={keyAccountFilter:'no'};api.saveStrategy(strategy);
 api.runDaily('2026-10-20');assert.deepEqual(api.getState().emails.map(email=>email.customerId),['dunning-customer-south']);
});
test('aging filters advance from actual run date and changed stage filters release only matching batch members',()=>{
 const {api}=strategyMasterFixture(),strategy=api.getState().strategies[0];
 strategy.filters.strategyMaster={targetType:'invoice',targetMode:'selected',selectedTargetIds:['SAMPLE-101']};
 strategy.stages[0].filters={agingBuckets:['1-30']};
 strategy.stages[1].filters={agingBuckets:['31-45'],invoiceStatuses:['PTP']};
 api.saveStrategy(strategy);api.runDaily('2026-10-20');const first=api.getState().emails[0];
 api.runDaily('2026-10-27');assert.equal(api.getState().emails.length,1);assert.equal(api.getState().batches[0].status,'empty');
 api.runDaily('2026-11-05');assert.equal(api.getState().emails.length,2);
 assert.equal(api.getState().emails[1].stage,2);assert.equal(api.getState().emails[1].letterSnapshot.invoices[0].invoiceNo,'SAMPLE-101');
 assert.equal(api.getState().batches[0].nextDate,'2026-11-12');
 const revised=api.getState().strategies[0];revised.stages[2].filters={invoiceStatuses:[]};api.saveStrategy(revised);
 api.runDaily('2026-11-12');assert.equal(api.getState().emails.filter(email=>email.batchId===first.batchId).length,2);
 revised.stages[2].filters={invoiceStatuses:['PTP']};api.saveStrategy(revised);api.runDaily('2026-11-12');
 assert.equal(api.getState().emails.filter(email=>email.batchId===first.batchId).length,3);
});
test('invalid target and aging filter payloads fail before mutating the strategy',()=>{
 const {api}=strategyMasterFixture(),strategy=api.getState().strategies[0];
 immutableFailure(api,()=>api.saveStrategy({...strategy,filters:{strategyMaster:{targetType:'customer',targetMode:'everything'}}}),/target selections/);
 const stages=JSON.parse(JSON.stringify(strategy.stages));stages[0].filters={agingBuckets:['30+']};
 immutableFailure(api,()=>api.saveStrategy({...strategy,stages}),/aging bucket/);
});
let failed=0;
for(const item of cases){try{item.run();process.stdout.write(`PASS ${item.name}\n`);}catch(error){failed+=1;process.stderr.write(`FAIL ${item.name}\n${error.stack}\n`);}}
if(failed)process.exitCode=1;else process.stdout.write(`${cases.length} Dunning core scenarios passed.\n`);
