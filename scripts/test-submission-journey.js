'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const C = require('./submission-journey-core.js');
const S = require('./submission-strategy-core.js');
class Storage {
  constructor(seed = {}) { this.data = new Map(Object.entries(seed).map(([key,value]) => [key, JSON.stringify(value)])); }
  getItem(key) { return this.data.has(key) ? this.data.get(key) : null; }
  setItem(key,value) { if (this.fail === key) { this.fail = null; throw new Error('quota'); } this.data.set(key,String(value)); }
  removeItem(key) { this.data.delete(key); }
}
function fixture() {
  const storage = new Storage(), sandbox = { window:{}, localStorage:storage, console };
  vm.runInNewContext(fs.readFileSync('bin/IssueTracker/js/issue-tracker-config.js','utf8'), sandbox);
  const config = sandbox.window.IssueTrackerConfig, state = C.seed();
  C.transaction(storage, { [C.KEY]:state });
  return { storage, config, state, fields:{ owner:config.defaultUser('action-owner'), process:'', remark:'Please share the missing document.' }, by:config.defaultUser('agent') };
}
const purchaseGroup = state => C.blockers(state,[], '2026-10-09').find(group=>group.requirement.id==='purchase-order');
const completedUpdate = overrides => ({ submissionStatus:'Submitted',activityType:'Visited',submissionSubStatus:'On Premises',submissionMedium:'Manual',submissionDestination:'Accepted By User',submissionType:'Physical',invoiceType:'Hard Copy',submissionDate:'2026-10-09',sentTo:'Customer reception',...overrides });
test('each Reason filter choice has at least ten demo invoices and older sessions gain them once',()=>{
  const state=C.seed();
  for(const reason of C.issueReasons) assert(state.invoices.filter(invoice=>invoice.reason===reason).length>=10);
  assert.equal(state.invoices.filter(invoice=>C.eligibleForAutomation(state,invoice)).length,10);
  const addedIds=new Set(state.invoices.filter(invoice=>invoice.invoiceNo!=='INV261000'&&/^INV26\d{4}$/.test(invoice.invoiceNo)).map(invoice=>invoice.invoiceNo));
  state.invoices=state.invoices.filter(invoice=>!addedIds.has(invoice.invoiceNo));
  state.documents=state.documents.filter(document=>!addedIds.has(document.invoiceNo));
  state.events=state.events.filter(event=>!event.invoiceNos?.some(id=>addedIds.has(id)));
  state.invoices.find(invoice=>invoice.invoiceNo==='FT6567567').status='Edited by user';
  const storage=new Storage({[C.KEY]:state}), loaded=C.load(storage);
  assert.equal(loaded.invoices.find(invoice=>invoice.invoiceNo==='FT6567567').status,'Edited by user');
  assert.equal(loaded.invoices.filter(invoice=>invoice.reason==='Not Received By Customer').length,10);
  assert.equal(loaded.invoices.filter(invoice=>invoice.reason==='Invoice Cancelled').length,10);
  for(const reason of C.issueReasons.slice(0,2)) assert.equal(loaded.invoices.filter(invoice=>invoice.reason===reason).length,10);
  assert.equal(loaded.invoices.filter(invoice=>C.eligibleForAutomation(loaded,invoice)).length,10);
  assert.equal(C.load(storage).invoices.length,loaded.invoices.length);
});
test('legacy disposition-based invoice numbers migrate with linked data and remain stable',()=>{
  const state=JSON.parse(JSON.stringify(C.seed()).replaceAll('INV261000','READY-001').replaceAll('INV261001','NRC-002').replaceAll('INV261003','READY-002'));
  const key='invoice|NRC-002|reason:Not Received By Customer';
  state.invoices.find(invoice=>invoice.invoiceNo==='NRC-002').remarks='Customer callback due';
  state.reviews[key]={until:'2026-10-30',by:'Agent',remark:'Awaiting response',invoiceNos:['NRC-002']};
  state.flags[key]='NRC-002:Not Received By Customer';
  const issue={id:'ISS-DEMO',source:'submission-module',documentScope:'invoice',invoiceNo:'NRC-002',dependencyKey:key,affectedInvoices:[{invoiceNo:'NRC-002'}],activeAffectedInvoiceNos:['NRC-002'],documents:[{invoiceNo:'READY-002'}]};
  const request={id:'REQ-DEMO',invoice:{id:'NRC-002'},issue:{id:'ISS-DEMO'}};
  const storage=new Storage({[C.KEY]:state,customIssues:[issue],approval_requests:[request]});
  const loaded=C.load(storage), renamed=loaded.invoices.find(invoice=>invoice.invoiceNo==='INV261001');
  assert.equal(renamed.remarks,'Customer callback due');
  assert(!loaded.invoices.some(invoice=>/^(READY|CAN|NRC)-\d{3}$/.test(invoice.invoiceNo)));
  assert(loaded.events.some(event=>event.invoiceNos?.includes('INV261000')));
  assert(loaded.documents.some(document=>document.invoiceNo==='INV261003'));
  assert.equal(loaded.reviews['invoice|INV261001|reason:Not Received By Customer'].invoiceNos[0],'INV261001');
  assert.equal(JSON.parse(storage.getItem('customIssues'))[0].documents[0].invoiceNo,'INV261003');
  assert.equal(JSON.parse(storage.getItem('approval_requests'))[0].invoice.id,'INV261001');
  const saved=storage.getItem(C.KEY);C.load(storage);assert.equal(storage.getItem(C.KEY),saved);
  C.saveManual(loaded,['INV261001'],{invoiceNo:'CAN-010',submissionStatus:'Not Submitted',activityType:'No Activity',submissionSubStatus:'Invoice Cancelled'},'Agent');
  assert.equal(renamed.invoiceNo,'INV261001');
});
test('client-admin review days persist separately and control invoice-date eligibility',()=>{
  const storage=new Storage(), original=C.seed();
  C.transaction(storage,{[C.KEY]:original});
  assert.equal(C.readReviewDays(storage),7);
  assert.equal(C.load(storage).settings.reviewDays,7);
  assert.equal(C.saveReviewDays(storage,30),30);
  assert.equal(C.load(storage).settings.reviewDays,30);
  assert.equal(C.blockers(C.load(storage),[],'2026-10-09').find(group=>group.requirement.id==='purchase-order').qualifying.length,0);
  assert.equal(C.readIssues(storage).length,0);
  assert.equal(storage.getItem(C.KEY),JSON.stringify(original));
  assert.throws(()=>C.saveReviewDays(storage,0),/whole number/);
  assert.throws(()=>C.saveReviewDays(storage,366),/whole number/);
  assert.throws(()=>C.saveReviewDays(storage,2.5),/whole number/);
  assert.equal(C.readReviewDays(storage),30);
});
test('1,000 incomplete imports become visible dependencies, never automatically created issues',()=>{
  const state=C.seed(), first=state.invoices[0];
  state.invoices=Array.from({length:1000},(_,index)=>({...C.clone(first),invoiceNo:`IMPORT-${index}`}));
  state.documents=[];C.observe(state,[],'2026-10-09');
  const groups=C.blockers(state,[],'2026-10-09');
  assert.equal(groups.filter(group=>group.scope==='customer').length,1000);
  assert(groups.filter(group=>group.scope==='customer').every(group=>group.invoices.length===1));
  assert.equal(groups.filter(group=>group.scope==='invoice').length,1000);
  assert.equal(C.readIssues(new Storage()).length,0);
});
test('customer document review counts 100 invoice blockers and 90 meet invoice-date aging',()=>{
  const groups=C.blockers(C.seed(),[],'2026-10-09').filter(group=>group.requirement.id==='purchase-order');
  assert.equal(groups.length,100);assert.equal(groups.filter(group=>group.eligible).length,90);
});
test('recent non-submission reason does not bypass the invoice-age review rule',()=>{
  const state=C.seed();state.invoices.find(row=>row.invoiceNo==='FT6567567').invoiceDate='2026-10-09';
  const groups=C.blockers(state,[],'2026-10-09');
  assert.equal(groups.find(group=>group.invoices[0].invoiceNo==='FT6567567').eligible,false);
  assert.equal(groups.find(group=>group.invoices[0].invoiceNo==='DV5623526').eligible,false);
});
test('a recorded reason does not hide an independently missing document',()=>{
  const state=C.seed(), invoice=state.invoices.find(row=>row.invoiceNo==='AMS-0001');
  invoice.reason='Not Received By Customer';
  const own=C.blockers(state,[],'2026-10-09').filter(group=>group.invoices.some(row=>row.invoiceNo===invoice.invoiceNo));
  assert(own.some(group=>group.requirement.id==='purchase-order'));
  assert(own.some(group=>group.requirement.name==='Not Received By Customer'));
});
test('document readiness clears when a required attachment is removed',()=>{
  const state=C.seed(), invoice=state.invoices.find(row=>row.invoiceNo==='INV261000');
  assert(invoice.documentsReadyAt);
  state.documents=state.documents.filter(document=>document.invoiceNo!==invoice.invoiceNo || document.requirementId!=='invoice-copy');
  assert(C.missing(state,invoice).length>0);
  assert.equal(C.observe(state,[],'2026-10-12'),true);
  assert.equal(invoice.documentsReadyAt,'');
  assert(state.events.some(event=>event.what==='Document readiness lost'&&event.invoiceNos.includes(invoice.invoiceNo)));
});
test('explicit document scope prevents invoice attachment reuse and permits customer reuse',()=>{
  const state=C.seed(), a=state.invoices[0], b=state.invoices[1];
  const customerDoc={requirementId:'purchase-order',scope:'customer',customerCode:a.code};
  assert(C.attachmentMatches(a.requirements[0],customerDoc,a));assert(C.attachmentMatches(b.requirements[0],customerDoc,b));
  const tagged={requirementId:'invoice-copy',scope:'invoice',invoiceNo:a.invoiceNo};
  assert(C.attachmentMatches(a.requirements[1],tagged,a));assert(!C.attachmentMatches(b.requirements[1],tagged,b));
  assert(!C.attachmentMatches(a.requirements[0],{...customerDoc,scope:undefined},a));
});
test('defer remains visible and waits until the chosen date despite impact changes',()=>{
  const state=C.seed(), group=purchaseGroup(state);
  C.defer(state,group,'2026-10-12','Customer will share on Monday.','Agent','2026-10-09');
  let current=C.blockers(state,[],'2026-10-10').find(item=>item.key===group.key);assert(current.deferred);assert(!current.eligible);
  state.invoices.find(row=>row.invoiceNo!==group.invoices[0].invoiceNo).submissionStatus='Submitted';
  state.invoices.push({...C.clone(state.invoices[1]),invoiceNo:'NEW-SHARED'});
  current=C.blockers(state,[],'2026-10-10').find(item=>item.key===group.key);assert(current.deferred);assert(!current.eligible);
  assert(C.blockers(state,[],'2026-10-12').find(item=>item.key===group.key).eligible);
  assert.throws(()=>C.defer(state,group,'2026-10-09','x','Agent','2026-10-09'),/future/);
});
test('changed invoice blocker inherits its active deferral without hiding other blockers',()=>{
  const state=C.seed(), invoice=state.invoices.find(row=>row.invoiceNo==='FT6567567');
  const group=C.blockers(state,[],'2026-10-09').find(item=>item.invoices[0].invoiceNo===invoice.invoiceNo);
  C.defer(state,group,'2026-10-15','Wait for follow-up.','Agent','2026-10-09');
  invoice.reason='Invoice Cancelled';
  const changed=C.blockers(state,[],'2026-10-10').find(item=>item.invoices[0].invoiceNo===invoice.invoiceNo);
  assert.notEqual(changed.key,group.key);assert(changed.deferred);assert(!changed.eligible);
  assert(C.blockers(state,[],'2026-10-15').find(item=>item.key===changed.key).eligible);
  const other=C.blockers(state,[],'2026-10-10').find(item=>item.code==='94669526'&&item.requirement.id==='extension-letter');
  assert(other.eligible);
});
test('the five supported issue reasons remain available in saved records and manual updates',()=>{
  const state=C.seed(), storage=new Storage();
  assert.equal(C.issueReasons.length,5);
  assert.deepEqual(Array.from(C.manualFlow('Not Submitted','No Activity').subStatuses),Array.from(C.issueReasons));
  state.invoices.push({...C.clone(state.invoices.find(row=>row.invoiceNo==='FT6567567')),invoiceNo:'IV523232',reason:'Rejected by Customer -Invoice Not correct'});
  state.invoices.find(row=>row.invoiceNo==='SU6472864327').reason='Rejected by Customer -Supporting Docs required';
  C.transaction(storage,{[C.KEY]:state});
  const loaded=C.load(storage);
  assert.equal(loaded.invoices.find(row=>row.invoiceNo==='SU6472864327').reason,'Rejected by Customer -Supporting Docs required');
  assert(C.load(storage).invoices.some(row=>row.invoiceNo==='IV523232'));
});
test('issue creation accepts the five reasons and rejects other blockers',()=>{
  const f=fixture();
  for(const reason of C.issueReasons) {
    const group=C.blockers(f.state,[],C.today()).find(item=>C.issueReasonForGroup(item)===reason);
    assert(group,`Missing issue group for ${reason}`);
    assert.equal(C.issueReasonForGroup(group),reason);
  }
  const unsupported=f.state.invoices.find(row=>row.invoiceNo==='FT6567567');
  unsupported.reason='Internal routing hold';
  C.transaction(f.storage,{[C.KEY]:f.state});
  const group=C.blockers(f.state,[],C.today()).find(item=>item.invoices.some(row=>row.invoiceNo===unsupported.invoiceNo));
  assert.equal(C.issueReasonForGroup(group),'');
  assert.throws(()=>C.promote(f.state,[group.key],f.fields,f.config,f.storage,f.by),/five supported non-submission reasons/);
  assert.equal(C.readIssues(f.storage).length,0);
});
test('one customer-document promotion creates one issue for one invoice',()=>{
  const f=fixture(), group=purchaseGroup(f.state), result=C.promote(f.state,[group.key],f.fields,f.config,f.storage,f.by), issue=result.issues[0];
  assert.equal(result.issues.length,1);assert.equal(issue.affectedInvoices.length,1);assert.equal(issue.documentScope,'customer');
  assert.equal(issue.issueReason,'Docs Pending');
  assert.equal(issue.workflowStep,'manager-review');assert.equal(issue.initialVisibilityReleased,false);
  assert.equal(C.readIssues(f.storage).length,1);assert(C.issueAffects(issue,group.invoices[0]));assert(!C.issueAffects(issue,f.state.invoices.find(row=>row.invoiceNo!==group.invoices[0].invoiceNo)));
  assert.equal(f.state.invoices[0].submissionStatus,'Not Submitted');
  assert.throws(()=>C.promote(result.state,[group.key],f.fields,f.config,f.storage,f.by),/already has an issue/);
  assert.equal(C.readIssues(f.storage).length,1);
});
test('three selected documents create three separate issues',()=>{
  const f=fixture(), keys=C.blockers(f.state,[],'2026-10-09').filter(group=>group.code==='94669526'&&group.scope==='customer').map(group=>group.key);
  assert.equal(keys.length,3);assert.equal(C.promote(f.state,keys,f.fields,f.config,f.storage,f.by).issues.length,3);
});
test('skipping manager approval preserves sequential approval request behavior',()=>{
  const f=fixture();f.storage.setItem(f.config.KEYS.settings,JSON.stringify({skipManagerApproval:true}));
  f.fields.process=f.config.ensureApprovalData().processes[0].id;
  const result=C.promote(f.state,[purchaseGroup(f.state).key],f.fields,f.config,f.storage,f.by);
  assert.equal(result.issues[0].workflowStep,'approver-l1');assert.equal(result.issues[0].initialVisibilityReleased,true);
  const requests=JSON.parse(f.storage.getItem('approval_requests'));assert.equal(requests.length,1);assert.equal(requests[0].levels[0].status,'pending');
});
test('promotion write failure rolls back issues, requests and lifecycle state',()=>{
  const f=fixture();f.config.ensureApprovalData();const before=f.storage.getItem(C.KEY);f.storage.fail='approval_requests';
  assert.throws(()=>C.promote(f.state,[purchaseGroup(f.state).key],f.fields,f.config,f.storage,f.by),/could not be saved/);
  assert.equal(f.storage.getItem(C.KEY),before);assert.equal(C.readIssues(f.storage).length,0);assert.equal(f.storage.getItem('approval_requests'),null);
});
test('stale promotion rechecks latest saved state and refuses completed invoices',()=>{
  const f=fixture(), group=purchaseGroup(f.state), next=C.clone(f.state);
  C.saveManual(next,group.invoices.map(row=>row.invoiceNo),completedUpdate(),f.by);
  C.transaction(f.storage,{[C.KEY]:next});
  assert.throws(()=>C.promote(f.state,[group.key],f.fields,f.config,f.storage,f.by),/changed/);assert.equal(C.readIssues(f.storage).length,0);
});
test('manual completion before documents suppresses automatic submission and retains required documents',()=>{
  const state=C.seed(), invoice=state.invoices[0], count=invoice.requirements.length;
  C.saveManual(state,[invoice.invoiceNo],completedUpdate(),'Agent');
  assert(C.submitted(invoice));assert(invoice.automationSuppressed);assert(!C.eligibleForAutomation(state,invoice));assert.equal(invoice.requirements.length,count);
  assert(!C.blockers(state).some(group=>group.invoices.some(row=>row.invoiceNo===invoice.invoiceNo)));
  assert(state.events.some(event=>event.what==='Automatic submission skipped'&&event.invoiceNos.includes(invoice.invoiceNo)));
});
test('pending manual update never suppresses automation or removes configured requirements',()=>{
  const state=C.seed(), invoice=state.invoices[0];C.saveManual(state,[invoice.invoiceNo],{submissionStatus:'Not Submitted',activityType:'No Activity',submissionSubStatus:'Docs Pending',missingIds:['purchase-order']},'Agent');
  assert.equal(invoice.automationSuppressed,false);assert.equal(invoice.requirements.length,2);
  C.saveManual(state,[invoice.invoiceNo],completedUpdate(),'Agent');
  C.saveManual(state,[invoice.invoiceNo],completedUpdate({submissionStatus:'Not Submitted',activityType:'No Activity',submissionSubStatus:'Docs Pending',remarks:'Correcting a mistaken completed submission'}),'Agent','agent');
  assert.equal(invoice.submissionStatus,'Not Submitted');assert.equal(invoice.submissionMedium,'Manual');assert.equal(invoice.method,'Manual');assert.equal(invoice.activityType,'No Activity');assert.equal(invoice.submissionDestination,'');
  assert.equal(invoice.submissionDate,'');assert.equal(invoice.submissionType,'');assert.equal(invoice.invoiceType,'');assert.equal(invoice.sentTo,'');
  assert.equal(invoice.automationSuppressed,false);assert.equal(invoice.requirements.length,2);
  assert.equal(invoice.firstSubmittedAt,'2026-10-09');assert(state.events.some(item=>item.what==='Invoice returned to Not Submitted'));
});
test('Not Submitted manual updates always use Manual and No Activity',()=>{
  const state=C.seed(), invoice=state.invoices[0];
  assert.deepEqual(C.manualFlow('Not Submitted','No Activity','Manual').activities,['No Activity']);
  assert.throws(()=>C.saveManual(state,[invoice.invoiceNo],{submissionStatus:'Not Submitted',submissionMedium:'Manual',activityType:'Visited',submissionSubStatus:'Invoice Cancelled'},'Agent'),/No Activity/);
  C.saveManual(state,[invoice.invoiceNo],{submissionStatus:'Not Submitted',submissionSubStatus:'Invoice Cancelled'},'Agent');
  assert.equal(invoice.submissionMedium,'Manual');assert.equal(invoice.activityType,'No Activity');
});
test('inline issue creation saves the reason and issue together',()=>{
  const f=fixture(), invoice=f.state.invoices[0], process=f.config.ensureApprovalData().processes[0];
  const update={submissionStatus:'Not Submitted',submissionMedium:'Manual',activityType:'No Activity',submissionSubStatus:'Invoice Cancelled',remarks:'Invoice requires correction'};
  const key=`invoice|${invoice.invoiceNo}|reason:Invoice Cancelled`, manualUpdate={invoiceNos:[invoice.invoiceNo],update,actorRole:'agent'};
  const fields={owner:f.fields.owner,process:process.id,remark:update.remarks};
  const result=C.promote(f.state,[key],fields,f.config,f.storage,f.by,manualUpdate);
  assert.equal(result.issues.length,1);
  assert.equal(result.issues[0].issueReason,'Invoice Cancelled');
  assert.equal(result.issues[0].approvalProcessId,process.id);
  assert.equal(C.load(f.storage).invoices[0].reason,'Invoice Cancelled');
  assert.equal(C.load(f.storage).invoices[0].submissionMedium,'Manual');
  assert.equal(C.readIssues(f.storage).filter(issue=>issue.source==='submission-module').length,1);
});
test('inline issue creation permits no approval process and keeps the action owner',()=>{
  const f=fixture(), invoice=f.state.invoices[0];
  const update={submissionStatus:'Not Submitted',submissionMedium:'Manual',activityType:'No Activity',submissionSubStatus:'Invoice Cancelled',remarks:'Invoice requires correction'};
  const key=`invoice|${invoice.invoiceNo}|reason:Invoice Cancelled`;
  const result=C.promote(f.state,[key],{owner:f.fields.owner,process:'',remark:update.remarks},f.config,f.storage,f.by,{invoiceNos:[invoice.invoiceNo],update,actorRole:'agent'});
  assert.equal(result.issues.length,1);
  assert.equal(result.issues[0].actionOwner,f.fields.owner);
  assert.equal(result.issues[0].approvalProcessId,'');
  assert.equal(result.issues[0].workflowStep,'manager-review');
  assert.equal(C.load(f.storage).invoices[0].reason,'Invoice Cancelled');
  assert.equal(C.readIssues(f.storage).length,1);
});
test('failed inline issue creation leaves the submission update untouched',()=>{
  const f=fixture(), invoice=f.state.invoices[0], process=f.config.ensureApprovalData().processes[0];
  const before=f.storage.getItem(C.KEY), update={submissionStatus:'Not Submitted',submissionMedium:'Manual',activityType:'No Activity',submissionSubStatus:'Invoice Cancelled',remarks:'Invoice requires correction'};
  f.storage.fail='customIssues';
  assert.throws(()=>C.promote(f.state,[`invoice|${invoice.invoiceNo}|reason:Invoice Cancelled`],{owner:f.fields.owner,process:process.id,remark:update.remarks},f.config,f.storage,f.by,{invoiceNos:[invoice.invoiceNo],update,actorRole:'agent'}),/could not be saved/);
  assert.equal(f.storage.getItem(C.KEY),before);
  assert.equal(C.readIssues(f.storage).filter(issue=>issue.source==='submission-module').length,0);
});
test('only an Agent can return a completed invoice to Not Submitted',()=>{
  const state=C.seed(), invoice=state.invoices[0];
  C.saveManual(state,[invoice.invoiceNo],completedUpdate(),'Agent');
  const before=C.clone(state), correction={submissionStatus:'Not Submitted',activityType:'No Activity',submissionSubStatus:'Invoice Cancelled',remarks:'Submission recorded against the wrong invoice'};
  assert.throws(()=>C.saveManual(state,[invoice.invoiceNo],correction,'Manager','manager'),/Only an Agent/);
  assert.throws(()=>C.saveManual(state,[invoice.invoiceNo],correction,'Unknown'),/Only an Agent/);
  assert.deepEqual(state,before);
  assert.throws(()=>C.saveManual(state,[invoice.invoiceNo],{...correction,remarks:''},'Agent','agent'),/Remarks/);
  C.saveManual(state,[invoice.invoiceNo],correction,'Agent','agent');
  assert.equal(invoice.submissionStatus,'Not Submitted');
  assert(state.events.some(event=>event.what==='Invoice returned to Not Submitted'));
});
test('Manual completion uses two broad statuses and activity-dependent sub-statuses',()=>{
  const cases=[
    completedUpdate(),
    completedUpdate({activityType:'Emailed',submissionSubStatus:'Email Sent',submissionType:'Email',invoiceType:'Digital',submissionDestination:'Sent To User'}),
    completedUpdate({activityType:'Couriered',submissionSubStatus:'Docs Sent',submissionDestination:'Sent To User',courierName:'Blue Dart',courierDate:'2026-10-08',courierAwb:'AWB-123'})
  ];
  for(const update of cases){
    const state=C.seed(), invoice=state.invoices[0];
    C.saveManual(state,[invoice.invoiceNo],update,'Agent');
    assert.equal(invoice.submissionStatus,'Submitted');assert.equal(invoice.submissionSubStatus,update.submissionSubStatus);
    assert.equal(invoice.method,update.submissionMedium);assert.equal(invoice.submissionDestination,update.submissionDestination);
    assert(invoice.automationSuppressed);assert(!C.eligibleForAutomation(state,invoice));
    const history=state.events.findLast(item=>item.type==='submission'&&item.invoiceNos.includes(invoice.invoiceNo));
    assert.equal(history.data.submissionStatus,'Submitted');assert.equal(history.data.submissionMedium,update.submissionMedium);
  }
  assert.deepEqual(C.manualFlow('','').activities,[]);
  assert(!C.manualFlow('Submitted','').activities.includes('No Activity'));
  assert(C.manualFlow('Not Submitted','No Activity').subStatuses.includes('Docs Pending'));
});
test('External completion needs only status and medium and discards hidden Manual details',()=>{
  for(const update of [{submissionStatus:'Submitted',submissionMedium:'External'},completedUpdate({submissionMedium:'External',courierName:'Old courier',courierDate:'2026-10-08',courierAwb:'OLD-AWB',remarks:'Old Manual remark'})]){
    const state=C.seed(), invoice=state.invoices[0], requirementCount=invoice.requirements.length;
    C.saveManual(state,[invoice.invoiceNo],update,'Agent');
    assert.equal(invoice.submissionStatus,'Submitted');assert.equal(invoice.submissionMedium,'External');assert.equal(invoice.method,'External');
    for(const key of ['activityType','submissionSubStatus','submissionDestination','submissionDate','submissionType','invoiceType','sentTo','courierName','courierDate','courierAwb','remarks'])assert.equal(invoice[key],'');
    assert.equal(invoice.firstSubmittedAt,'');assert.equal(invoice.lastSubmittedAt,'');assert(invoice.submissionRecordedAt);
    assert(invoice.automationSuppressed);assert(!C.eligibleForAutomation(state,invoice));assert.equal(invoice.requirements.length,requirementCount);
    assert(state.events.some(item=>item.what==='External submission recorded'));
    assert(state.events.some(item=>item.what==='Automatic submission skipped'));
    assert(!C.blockers(state).some(group=>group.invoices.some(row=>row.invoiceNo===invoice.invoiceNo)));
    const roundTrip=C.load(new Storage({[C.KEY]:state})).invoices[0];
    assert.equal(roundTrip.submissionSubStatus,'');assert.equal(roundTrip.activityType,'');assert.equal(roundTrip.submissionMedium,'External');
  }
  assert.deepEqual(C.manualFlow('Submitted','','External').activities,[]);
  assert.equal(C.manualFlow('Submitted','','External').delivery,false);
  const state=C.seed(), before=JSON.stringify(state);
  assert.throws(()=>C.saveManual(state,[state.invoices[0].invoiceNo],{submissionStatus:'Not Submitted',submissionMedium:'External'},'Agent'),/only available with Submitted/);
  assert.equal(JSON.stringify(state),before);
});
test('invalid status, activity and dependent fields are rejected before any invoice or history changes',()=>{
  const changes=[
    {submissionStatus:'Email Sent'}, {activityType:'No Activity'}, {activityType:'Emailed'},
    {submissionMedium:'Automated'}, {submissionDestination:'Sent To User'}, {invoiceType:'Digital'},
    {submissionDate:'2026-02-31'}, {sentTo:''},
    {activityType:'Couriered',submissionSubStatus:'Docs Sent',submissionDestination:'Sent To User'}
  ];
  for(const change of changes){
    const state=C.seed(), before=JSON.stringify(state);
    assert.throws(()=>C.saveManual(state,[state.invoices[0].invoiceNo,state.invoices[1].invoiceNo],completedUpdate(change),'Agent'));
    assert.equal(JSON.stringify(state),before);
  }
  const state=C.seed(), before=JSON.stringify(state);
  assert.throws(()=>C.saveManual(state,[state.invoices[0].invoiceNo],{submissionStatus:'Not Submitted',activityType:'No Activity',submissionSubStatus:'Email Sent'},'Agent'));
  assert.equal(JSON.stringify(state),before);
});
test('saved legacy completion statuses migrate with destinations, mediums and historical dates retained',()=>{
  const state=C.seed(), examples=[
    {submissionStatus:'Email Sent',submissionSubStatus:'Sent To User',activityType:'Emailed',method:'Automated'},
    {submissionStatus:'Docs Sent',submissionSubStatus:'Sent To Other Dept',activityType:'Couriered',method:'Manual'},
    {submissionStatus:'External Submission',submissionSubStatus:'Accepted By User',activityType:'Visited',method:'Manual'}
  ];
  state.invoices=examples.map((example,index)=>({...example,invoiceNo:`LEGACY-${index}`,firstSubmittedAt:'2026-09-29',requirements:[]}));
  state.events=[{id:'KEEP-HISTORY',type:'submission',at:'2026-09-29T06:00:00Z',invoiceNos:['LEGACY-0'],data:{...examples[0]}}];
  const storage=new Storage({[C.KEY]:state}), loaded=C.load(storage);
  assert.deepEqual(loaded.invoices.map(invoice=>invoice.submissionStatus),['Submitted','Submitted','Submitted']);
  assert.deepEqual(loaded.invoices.map(invoice=>invoice.submissionSubStatus),['Email Sent','Docs Sent','On Premises']);
  assert.deepEqual(loaded.invoices.map(invoice=>invoice.submissionDestination),['Sent To User','Sent To Other Dept','Accepted By User']);
  assert.deepEqual(loaded.invoices.map(invoice=>invoice.submissionMedium),['Automated','Manual','External']);
  assert(loaded.invoices.every(invoice=>invoice.firstSubmittedAt==='2026-09-29'));
  assert.equal(loaded.events.length,1);assert.equal(loaded.events[0].at,state.events[0].at);
  assert.equal(loaded.events[0].data.submissionStatus,'Submitted');assert.equal(loaded.events[0].data.submissionSubStatus,'Email Sent');
  assert.deepEqual(JSON.parse(storage.getItem(C.KEY)),loaded);
  assert.deepEqual(C.load(storage),loaded);
  assert(!C.submitted({}));
});
test('document arrival closes the matching Docs Pending issue and pending approval',()=>{
  const f=fixture(), group=purchaseGroup(f.state), result=C.promote(f.state,[group.key],f.fields,f.config,f.storage,f.by);
  const attachment={requirementId:'purchase-order',requirement:'Purchase Order',scope:'customer',customerCode:group.code,name:'PO.pdf',uploadedAt:'2026-10-09T08:00:00Z',uploadedBy:'Owner'};
  C.observe(result.state,result.issues,'2026-10-09',[attachment]);
  C.reconcileIssues(result.state,result.issues,[attachment]);
  assert.equal(result.state.invoices[0].reason,'');assert(C.eligibleForAutomation(result.state,result.state.invoices[0],[attachment]));
  assert.equal(result.issues[0].status,'Closed');assert(result.state.invoices[0].documentsReadyAt);
  assert(result.state.events.some(item=>item.what==='Docs Pending issue closed'));
  const requests=[{status:'pending',issue:{id:result.issues[0].id},trail:[]}];
  assert(C.reconcileApprovalRequests(result.issues,requests));assert.equal(requests[0].status,'superseded');
});
test('a later Docs Pending update clears when documents were already ready',()=>{
  const state=C.seed(), invoice=state.invoices.find(row=>row.invoiceNo==='INV261000');
  C.saveManual(state,[invoice.invoiceNo],{submissionStatus:'Not Submitted',activityType:'No Activity',submissionSubStatus:'Docs Pending'},'Agent');
  assert.equal(invoice.reason,'Docs Pending');
  C.observe(state,[]);
  assert.equal(invoice.reason,'');assert(C.eligibleForAutomation(state,invoice));
});
test('strategy modes, categories and bulk document rule are enforced',()=>{
  const company={id:'company',applyOn:'COMPANY',strategyType:'Invoice',batchInvoicesInOneEmail:false};
  const product={id:'product',applyOn:'PRODUCT',productCategory:'Services',strategyType:'Invoice',batchInvoicesInOneEmail:false};
  assert.match(S.validate([company],product),/company-wide/);
  assert.match(S.validate([product],company),/only strategy/);
  assert.match(S.validate([],{...product,productCategory:''}),/product category/);
  assert.match(S.validate([product],{...product,id:'other'}),/already has a strategy/);
  assert.match(S.validate([],{...product,batchInvoicesInOneEmail:true,bulkSendAfterDays:2,strategyType:'Invoice + Docs(Sequentially)'}),/Sequential/);
  assert.match(S.validate([],{...product,agentSelection:true,agentDocumentDelivery:'sequential',batchInvoicesInOneEmail:true,bulkSendAfterDays:2}),/Sequential/);
  assert.match(S.validate([],{...product,agentSelection:true,agentDocumentDelivery:'unknown'}),/Choose how/);
  assert.equal(S.validate([],{...product,batchInvoicesInOneEmail:true,bulkSendAfterDays:2,strategyType:'Invoice + Docs(In 1 Shot)'}),'');
  assert.equal(S.resolve({productCategory:'Services'},[product]).id,'product');
  assert.equal(S.resolve({productCategory:'Other'},[product]),null);
});
test('agent-selected documents wait for one-shot delivery and allow sequential invoice submission',()=>{
  const state=C.seed();
  const invoice=state.invoices.find(row=>row.invoiceNo==='INV261000');
  invoice.agentSelectedDocuments=[{name:'AGENT CONTRACT',scope:'invoice'}];
  state.invoices=[invoice];
  const strategy={id:'agent',applyOn:'COMPANY',status:'RUNNING',strategyType:'Invoice + Docs(In 1 Shot)',agentSelection:true,agentDocumentDelivery:'one-shot',selectedDocuments:['SUBMISSION CERTIFICATE'],batchInvoicesInOneEmail:false};
  assert(S.requirements(invoice,strategy).some(item=>item.name==='AGENT CONTRACT'));
  assert.equal(S.assessment(state,invoice,strategy,C).reason,'Awaiting required documents');
  strategy.agentDocumentDelivery='sequential';
  assert.equal(S.assessment(state,invoice,strategy,C).ready,true);
  const firstEmail=S.plan(state,[strategy],C);
  assert.deepEqual(firstEmail.batches.map(batch=>batch.invoices),[[invoice.invoiceNo]]);
  assert.deepEqual(firstEmail.batches[0].documents,['INVOICE']);
  invoice.submissionStatus='Submitted';
  invoice.submissionMedium='Automated';
  invoice.sequentialSentDocuments=['INVOICE'];
  state.documents.push({requirement:'AGENT CONTRACT',scope:'invoice',invoiceNo:invoice.invoiceNo});
  assert.deepEqual(S.plan(state,[strategy],C).documentEmails.map(email=>email.document),['AGENT CONTRACT']);
  invoice.sequentialSentDocuments.push('AGENT CONTRACT');
  assert.equal(S.plan(state,[strategy],C).documentEmails.length,0);
  state.documents.push({requirement:'SUBMISSION CERTIFICATE',scope:'invoice',invoiceNo:invoice.invoiceNo});
  assert.deepEqual(S.plan(state,[strategy],C).documentEmails.map(email=>email.document),['SUBMISSION CERTIFICATE']);
  invoice.submissionStatus='Not Submitted';
  strategy.agentDocumentDelivery='one-shot';
  assert.equal(S.assessment(state,invoice,strategy,C).ready,true);
  assert.deepEqual(S.plan(state,[strategy],C).batches[0].documents,['INVOICE','SUBMISSION CERTIFICATE','AGENT CONTRACT']);
  strategy.agentSelection=false;
  assert.equal(S.requirements(invoice,strategy).some(item=>item.name==='AGENT CONTRACT'),false);
});
test('bulk grouping waits for every invoice or the oldest invoice deadline',()=>{
  const state=C.seed(), strategy={id:'bulk',applyOn:'COMPANY',status:'RUNNING',strategyName:'Bulk',strategyType:'Invoice + Docs(In 1 Shot)',selectedDocuments:['INVOICE','DOC A','DOC B'],batchInvoicesInOneEmail:true,bulkSendAfterDays:7};
  const docs=[{id:'invoice',name:'INVOICE',scope:'invoice'},{id:'a',name:'DOC A',scope:'invoice'},{id:'b',name:'DOC B',scope:'invoice'}];
  state.invoices=Array.from({length:10},(_,i)=>({invoiceNo:`OLD-${i}`,code:'ABC',name:'Customer ABC',createdAt:'2026-10-01T06:00:00Z',requirements:docs}));
  state.documents=[];
  const addDocs=(ids,complete)=>ids.forEach(id=>docs.slice(0,complete?3:2).forEach(doc=>state.documents.push({requirementId:doc.id,scope:'invoice',invoiceNo:id,requirement:doc.name})));
  addDocs(state.invoices.map(row=>row.invoiceNo),false);addDocs(state.invoices.slice(0,7).map(row=>row.invoiceNo),true);
  const at=date=>S.plan(state,[strategy],C,[],new Date(date));
  assert.equal(at('2026-10-03T12:30:00Z').batches.length,0);
  state.invoices.push(...Array.from({length:10},(_,i)=>({invoiceNo:`NEW-${i}`,code:'ABC',name:'Customer ABC',createdAt:'2026-10-04T06:00:00Z',requirements:docs})));
  addDocs(state.invoices.slice(10).map(row=>row.invoiceNo),false);
  addDocs(['OLD-7','OLD-8','OLD-9','NEW-0','NEW-1','NEW-2','NEW-3'],true);
  assert.equal(at('2026-10-04T12:30:00Z').batches.length,0);
  const due=at('2026-10-08T12:30:00Z');
  assert.equal(due.batches.length,1);assert.equal(due.batches[0].invoices.length,14);
  assert.equal([...due.decisions.values()].filter(row=>row.reason==='Awaiting required documents').length,6);
  due.batches[0].invoices.forEach(id=>{state.invoices.find(row=>row.invoiceNo===id).submissionStatus='Submitted';});
  addDocs(state.invoices.filter(row=>!C.submitted(row)).map(row=>row.invoiceNo),true);
  assert.equal(at('2026-10-09T12:30:00Z').batches[0].invoices.length,6);
});
test('bulk email keeps different customer, strategy and recipient groups separate',()=>{
  const state=C.seed();state.invoices=[
    {invoiceNo:'ONE',code:'A',name:'Alpha',productCategory:'Services',createdAt:'2026-10-09T06:00:00Z',requirements:[],submissionRecipients:'first@example.test'},
    {invoiceNo:'TWO',code:'A',name:'Alpha',productCategory:'Services',createdAt:'2026-10-09T06:00:00Z',requirements:[],submissionRecipients:'first@example.test'},
    {invoiceNo:'THREE',code:'A',name:'Alpha',productCategory:'Services',createdAt:'2026-10-09T06:00:00Z',requirements:[],submissionRecipients:'second@example.test'},
    {invoiceNo:'FOUR',code:'B',name:'Beta',productCategory:'Services',createdAt:'2026-10-09T06:00:00Z',requirements:[],submissionRecipients:'first@example.test'},
    {invoiceNo:'OTHER',code:'A',name:'Alpha',productCategory:'Goods',createdAt:'2026-10-09T06:00:00Z',requirements:[],submissionRecipients:'first@example.test'}
  ];
  const strategies=[{id:'services',applyOn:'PRODUCT',productCategory:'Services',status:'RUNNING',batchInvoicesInOneEmail:true,bulkSendAfterDays:7},{id:'goods',applyOn:'PRODUCT',productCategory:'Goods',status:'RUNNING',batchInvoicesInOneEmail:true,bulkSendAfterDays:7}];
  const plan=S.plan(state,strategies,C,[],new Date('2026-10-12T13:00:00Z'));
  assert.deepEqual(plan.batches.map(batch=>batch.invoices),[['ONE','TWO'],['THREE'],['FOUR'],['OTHER']]);
  strategies[0].status='PAUSED';assert.equal(S.plan(state,strategies,C,[],new Date('2026-10-12T13:00:00Z')).decisions.get('ONE').reason,'Submission strategy is paused');
});
test('the default strategy keeps ten demo invoices eligible at the next run',()=>{
  const state=C.seed();
  state.invoices.forEach(invoice=>{invoice.effectiveRequirements=S.requirements(invoice,S.resolve(invoice,S.defaultStrategies));});
  const plan=S.plan(state,S.defaultStrategies,C,[],new Date('2026-10-12T12:30:00Z'));
  assert.equal(plan.batches.reduce((total,batch)=>total+batch.invoices.length,0),10);
  assert.equal(S.requirements(state.invoices[0],S.defaultStrategies[0]).find(item=>item.name.toUpperCase()==='PURCHASE ORDER').scope,'customer');
  assert.equal(S.validate([],{...S.defaultStrategies[0],recipientList:'invalid-address'}),'Enter valid customer email addresses, separated by commas.');
});
test('documents do not automatically close issues raised for another reason',()=>{
  const state=C.seed(), invoice=state.invoices.find(row=>row.invoiceNo==='INV261000');
  const issue={id:'REJECTION',source:'submission-module',issueReason:'Not Received By Customer',status:'Open',invoiceNo:invoice.invoiceNo,documentScope:'invoice',documentRequirementId:'reason:Not Received By Customer',affectedInvoices:[{invoiceNo:invoice.invoiceNo}]};
  C.reconcileIssues(state,[issue]);
  assert.equal(issue.status,'Open');
});
test('customer document issues are separate by invoice and close independently',()=>{
  const f=fixture(), groups=C.blockers(f.state,[],'2026-10-09').filter(group=>group.requirement.id==='purchase-order');
  assert(groups.length>1);assert(groups.every(group=>group.invoices.length===1));
  const selected=groups.slice(0,2), result=C.promote(f.state,selected.map(group=>group.key),f.fields,f.config,f.storage,f.by);
  assert.equal(result.issues.length,2);
  const first=selected[0].invoices[0], second=selected[1].invoices[0];
  assert.notEqual(result.issues[0].invoiceNo,result.issues[1].invoiceNo);
  const document={requirementId:'purchase-order',requirement:'Purchase Order',scope:'customer',customerCode:first.code,invoiceNo:first.invoiceNo};
  C.reconcileIssues(result.state,result.issues,[document]);
  assert.equal(result.issues.find(issue=>issue.invoiceNo===first.invoiceNo).status,'Closed');
  assert.equal(result.issues.find(issue=>issue.invoiceNo===second.invoiceNo).status,'Open');
  assert(C.missing(result.state,second,[document]).some(requirement=>requirement.id==='purchase-order'));
});
test('closure and reopen durations use closed cycles and the current open cycle',()=>{
  const issue={status:'Open',createdAt:'2026-10-01T08:00:00Z',actionTrail:[{type:'closure',when:'2026-10-03T08:00:00Z'},{type:'reopen',when:'2026-10-06T08:00:00Z'}]};
  const metric=C.issueMetrics(issue,'2026-10-09');assert.equal(metric.reopenCount,1);assert.equal(metric.total,5);assert.equal(metric.current,3);assert.equal(metric.cycles[0].days,2);
  assert.equal(C.issueMetrics({status:'Closed',actionTrail:[]}).total,null);
});
test('old submission snapshots migrate without inventing missing historical events',()=>{
  const storage=new Storage({submissionLiveReplicaUpdates:{TVS545661:{submissionStatus:'Not Submitted',submissionSubStatus:'Docs Pending',submissionDate:'09-10-2026',remarks:'Earlier update'}}});
  const state=C.load(storage);assert.equal(state.invoices.find(row=>row.invoiceNo==='TVS545661').remarks,'Earlier update');
  assert(!state.events.some(event=>event.what==='Earlier update'));
});
test('invoice aging follows Kolkata calendar dates across UTC midnight',()=>{
  assert.equal(C.keyDate('2026-10-08T20:00:00Z'),'2026-10-09');
  assert.equal(C.days('2026-10-08T20:00:00Z','2026-10-09'),0);
  assert.equal(C.days(null,'2026-10-09'),null);
});
test('agent issue details retain creator visibility while duplicate detection stays global',()=>{
  const issue={agent:'Aditi Sharma',dependencyKey:'customer|C|po'};
  assert(C.agentCanView(issue,'aditi sharma'));assert(!C.agentCanView(issue,'Rahul Jain'));
});
test('submission workflow version registration preserves existing tracker data',()=>{
  const f=fixture();f.storage.setItem('customIssues',JSON.stringify([{id:'KEEP',source:'submission-module'}]));
  f.config.ensureWorkflowVersion();assert.equal(f.config.ensureCleanSlate(),false);
  assert.equal(C.readIssues(f.storage)[0].id,'KEEP');
});
test('tracker document list shares explicit customer documents and isolates invoice attachments',()=>{
  const source=fs.readFileSync('bin/IssueTracker/js/issue-tracker-unified.js','utf8');
  const section=source.slice(source.indexOf('  function documentRequirement('),source.indexOf('  function renderDocuments('));
  const invoice={id:'INV-A',customerCode:'C1'}, issue={id:'ISS-A',documents:[]};
  const other={id:'INV-B',customerCode:'C1'}, foreign={id:'INV-C',customerCode:'C2'};
  const sandbox={cleanName:value=>String(value||'').trim(),allIssueRecords:()=>[
    {invoice,issue},
    {invoice:other,issue:{id:'ISS-B',documents:[{name:'shared-po.pdf',scope:'customer',requirement:'PO'},{name:'private-invoice.pdf',scope:'invoice',invoiceNo:'INV-B'},{name:'unknown-scope.pdf'}]}},
    {invoice:foreign,issue:{id:'ISS-C',documents:[{name:'foreign.pdf',scope:'customer'}]}}
  ],visibilityReleased:()=>true,canViewIssue:()=>true,getRole:()=> 'agent',rolePerson:()=> 'Aditi Sharma'};
  vm.createContext(sandbox);vm.runInContext(section+'\nthis.docs=issueDocuments(this.invoice,this.issue,null);',Object.assign(sandbox,{invoice,issue}));
  assert.deepEqual(Array.from(sandbox.docs,doc=>doc.name),['shared-po.pdf']);
});

test('Outlook size splitting keeps each invoice and its ZIP together',()=>{
  const result=S.splitByAttachmentLimit(['A','B','C','D'],{A:[2,3],B:[3,4],C:[8,4],D:[1,1]},10);
  assert.deepEqual(result.parts,[['A'],['B','D']]);
  assert.deepEqual(result.oversized,['C']);assert.deepEqual(result.unknown,[]);
  assert.deepEqual(S.splitByAttachmentLimit(['A'],{A:[2]},10).unknown,['A']);
});
