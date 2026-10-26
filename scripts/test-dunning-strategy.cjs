'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const adapter = require('./dunning-strategy-ui.js');
const {createInstance} = require('./dunning-core.js');
const context = {role:'client-admin',userId:'admin',clientId:'demo-client'};
function fixture(actor = context) {
  const core = createInstance({context:actor});
  core.setEnabled(true, context);
  core.getState().templates.forEach(template=>core.saveTemplate({...template,standardReady:true},context));
  return core;
}
function payload(overrides = {}) {
  return {
    id:'SM-dunning',strategyName:'Overdue recovery',status:'active',reminderType:'post_due',targetType:'invoice',targetMode:'all',selectedTargetIds:[],excludedTargetIds:[],
    templates:[1,2,3].map(number => ({uid:`block-${number}`,templateId:`dunning-template-${number}`,notificationMode:'custom',keyAccountFilter:'all',reminderSteps:[{uid:`step-${number}`,days:number === 1 ? 15 : 7,when:'after',attachments:[adapter.ATTACHMENT]}],invoiceStatuses:['Funds Issue'],invoiceBroadSelections:[],invoicePrimarySelections:[],agingBuckets:['1-30','31-45'],dispositionGroups:['due_reminder'],subStatuses:['Funds Issue']})),
    ...overrides
  };
}
function customers() {
  return [{id:'c1',code:'CUST-001',name:'Customer One',keyAccount:false,contacts:[{email:'ar@example.test'}],invoices:[{invoiceNo:'INV-001',invoiceAmount:12500,netDueAmount:9500,dueDate:'05 Oct 2026'}]}];
}
function enriched() { return [{invoiceNo:'INV-001',customerId:'c1',subStatus:'Funds Issue'}]; }
function unchanged(core, action, pattern) { const before=JSON.stringify(core.getState());assert.throws(action,pattern);assert.equal(JSON.stringify(core.getState()),before); }

test('catalog preserves core IDs and offers defaults while disabled without mutating state', () => {
  const core = createInstance({context});
  const before=JSON.stringify(core.getState());
  assert.deepEqual(adapter.catalog(core).map(item => item.id), ['dunning-template-1','dunning-template-2','dunning-template-3']);
  assert.equal(JSON.stringify(core.getState()),before);
  core.setEnabled(true);
  const custom={id:'client-fourth-letter',name:'Final customer reminder',documentTypeId:'custom-type',stageNumber:4};
  const state=core.getState();state.templates.push(custom);
  const descriptor=adapter.catalog(state).find(item=>item.id===custom.id);
  assert.equal(descriptor.label,custom.name);assert.equal(descriptor.stageNumber,4);
  assert.deepEqual(descriptor.supportedModes,['custom']);assert.deepEqual(descriptor.supportedTimings,['after']);
  assert.equal(descriptor.defaultAgingBuckets.includes('Not Due'),false);
});

test('validation enforces sequence, timing, attachment and selected coverage', () => {
  const core=fixture();assert.equal(adapter.validate(payload(),core),'');
  const variants=[
    [p=>p.reminderType='both',/Post Due/],
    [p=>p.templates.reverse(),/order/],
    [p=>p.templates.splice(1,1),/order/],
    [p=>p.templates[1].templateId=p.templates[0].templateId,/duplicate/],
    [p=>p.templates[0].notificationMode='ongoing',/Custom/],
    [p=>p.templates[0].reminderSteps.push({...p.templates[0].reminderSteps[0]}),/one reminder step/],
    [p=>p.templates[1].reminderSteps[0].when='before',/after timing/],
    [p=>p.templates[0].reminderSteps[0].days=0,/whole number/],
    [p=>p.templates[0].reminderSteps[0].attachments=['Invoice'],/annexure/],
    [p=>p.templates[0].reminderSteps[0].attachments=[adapter.ATTACHMENT,'Invoice'],/annexure/],
    [p=>p.targetMode='selected',/Select at least one target/]
  ];
  for (const [change,pattern] of variants) { const value=payload();change(value);assert.match(adapter.validate(value,core),pattern); }
  assert.match(adapter.validate(payload(),createInstance({context})),/Enable Dunning Letters/);
});

test('save reuses the same strategy ID, existing customer/invoice IDs and preserves all control settings', () => {
  const core=fixture();
  core.syncInvoices([{id:'known-customer',customerCode:'CUST-001',name:'Customer One',invoices:[{id:'known-invoice',invoiceNo:'INV-001',dueDate:'2026-10-05',amount:12500,outstanding:9500}]}]);
  const value=payload({targetMode:'selected',selectedTargetIds:['INV-001']});
  adapter.save(value,core,customers(),enriched());
  const state=core.getState();const strategy=state.strategies.find(row=>row.id===value.id);
  assert.equal(strategy.firstStageDays,15);assert.deepEqual(strategy.stages.map(stage=>stage.intervalDays),[0,7,7]);
  assert.equal(state.invoices.filter(row=>row.invoiceNo==='INV-001').length,1);
  assert.equal(state.invoices.find(row=>row.invoiceNo==='INV-001').id,'known-invoice');
  assert.equal(state.invoices.find(row=>row.id==='known-invoice').strategyMasterSubStatus,'Funds Issue');
  assert.equal(state.customers.find(row=>row.id==='known-customer').strategyMasterKeyAccount,false);
  assert.deepEqual(strategy.filters.strategyMaster.selectedTargetIds,['INV-001']);
  assert.deepEqual(strategy.filters.strategyMaster.selectedInvoiceIds,['known-invoice']);
  assert.deepEqual(strategy.strategyMasterPayload,value);
  assert.deepEqual(strategy.stages[0].filters.invoiceStatuses,['Funds Issue']);
  const projected=adapter.existing(core).find(row=>row.id===value.id);
  assert.deepEqual(projected.selectedTargetIds,['INV-001']);assert.equal(projected.templates[1].reminderSteps[0].days,7);
});

test('source synchronization preserves zero balances, local dates and missing known amounts', () => {
  const core=fixture();const source=customers();source[0].invoices[0].netDueAmount=0;source[0].invoices[0].dueDate='2026-04-14T00:00:00+05:30';
  adapter.save(payload(),core,source,[{invoiceNo:'INV-001',customerId:'c1',subStatus:'Wrong Billing'}]);
  let invoice=core.getState().invoices.find(row=>row.invoiceNo==='INV-001');
  assert.equal(invoice.outstanding,0);assert.equal(invoice.dueDate,'2026-04-14');assert.equal(invoice.strategyMasterSubStatus,'Wrong/Incorrect Billing');
  const sparse=[{id:'c1',code:'CUST-001',invoices:[{invoiceNo:'INV-001'}]}];
  adapter.save(payload(),core,sparse,[]);
  invoice=core.getState().invoices.find(row=>row.invoiceNo==='INV-001');
  assert.equal(invoice.originalAmount,12500);assert.equal(invoice.outstanding,0);assert.equal(invoice.dueDate,'2026-04-14');
  assert.equal(core.getState().customers.find(row=>row.customerCode==='CUST-001').contacts[0].email,'ar@example.test');
});

test('unresolved or ambiguous target IDs fail before source or strategy mutation', () => {
  const core=fixture();
  unchanged(core,()=>adapter.save(payload({targetMode:'selected',selectedTargetIds:['MISSING']}),core,customers(),enriched()),/not uniquely available/);
  unchanged(core,()=>adapter.save(payload({excludedTargetIds:['MISSING']}),core,customers(),enriched()),/not uniquely available/);
  const source=customers();source[0].invoices[0]={invoiceNo:'UNKNOWN',dueDate:'2026-10-05'};
  unchanged(core,()=>adapter.save(payload(),core,source,[]),/invoice amount/);
});

test('existing projects legacy core strategies and scopes them to the current client', () => {
  const core=fixture();core.saveStrategy({id:'dunning-strategy-demo',name:'Legacy saved strategy',status:'draft',firstStageDays:15,stages:[1,2,3].map(number=>({templateId:`dunning-template-${number}`,intervalDays:number===1?0:7}))});
  const demo=adapter.existing(core).find(row=>row.id==='dunning-strategy-demo');
  assert.equal(demo.targetType,'invoice');assert.equal(demo.targetMode,'all');assert.equal(demo.status,'inactive');
  assert.deepEqual(demo.templates.map(entry=>entry.reminderSteps[0].days),[15,7,7]);
  assert.equal(demo.templates[0].reminderSteps[0].attachments[0],adapter.ATTACHMENT);
  core.saveStrategy({...core.getState().strategies[0],id:'foreign',clientId:'another-client'},{...context,clientId:'another-client'});
  assert.equal(adapter.existing(core).some(row=>row.id==='foreign'),false);
});

test('normal reminder blocks survive projection alongside Dunning blocks', () => {
  const core=fixture();const value=payload();
  const normal={uid:'normal',templateId:'reminder_for_payment_due',notificationMode:'ongoing',ongoingInterval:10};
  value.templates.splice(1,0,normal);
  adapter.save(value,core,customers(),enriched());
  const projected=adapter.existing(core).find(row=>row.id===value.id);
  assert.deepEqual(projected.templates[1],normal);assert.equal(projected.templates.length,4);
});

test('role checks happen before invoice synchronization and core enforces missed-date resume', () => {
  const actor={...context};const core=fixture(()=>actor);
  actor.role='agent';unchanged(core,()=>adapter.save(payload(),core,customers(),enriched()),/permission/);
  actor.role='supervisor';unchanged(core,()=>adapter.save(payload(),core,customers(),enriched()),/permission/);
  actor.role='client-admin';adapter.save(payload(),core,customers(),enriched());
  core.runDaily('2026-10-20');
  adapter.save(payload({status:'inactive'}),core,[],[]);core.runDaily('2026-11-05');
  unchanged(core,()=>adapter.save(payload(),core,[],[]),/pending team confirmation/);
});

test('remove stops sending and hides the strategy while preserving sent records', () => {
  const core=fixture();adapter.save(payload(),core,customers(),enriched());core.runDaily('2026-10-20');
  const state=core.getState();assert.ok(state.emails.length>0);
  adapter.remove('SM-dunning',core);
  const saved=core.getState();assert.equal(saved.strategies.find(row=>row.id==='SM-dunning').status,'stopped');
  assert.deepEqual(saved.emails,state.emails);assert.deepEqual(saved.batches,state.batches);
  assert.equal(adapter.existing(core).some(row=>row.id==='SM-dunning'),false);
});

test('ordinary deletion is a no-op and switching to reminders detaches the old sequence', () => {
  const core=fixture();const untouched=JSON.stringify(core.getState());
  assert.equal(adapter.remove('ordinary-reminder',core),null);assert.equal(JSON.stringify(core.getState()),untouched);
  const ordinary={id:'SM-dunning',strategyName:'Ordinary reminder',status:'active',reminderType:'post_due',targetType:'invoice',targetMode:'all',selectedTargetIds:[],excludedTargetIds:[],templates:[{templateId:'reminder_for_payment_due',notificationMode:'ongoing',ongoingInterval:7}]};
  adapter.save(payload(),core,customers(),enriched());core.runDaily('2026-10-20');
  const sent=core.getState().emails;
  adapter.save(ordinary,core,customers(),enriched());
  const record=core.getState().strategies.find(row=>row.id==='SM-dunning');
  assert.equal(record.status,'stopped');assert.equal(record.strategyMasterDetached,true);assert.equal(record.strategyMasterDeleted,true);
  assert.deepEqual(record.strategyMasterPayload,ordinary);assert.deepEqual(core.getState().emails,sent);
  assert.equal(adapter.existing(core).some(row=>row.id==='SM-dunning'),false);
  core.runDaily('2026-10-27');assert.deepEqual(core.getState().emails,sent);
});
