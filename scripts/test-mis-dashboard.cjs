'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const core=require('./mis-access-core.js');
const {seed}=require('./mis-access-store.js');
const dashboard=require('./mis-dashboard-core.js');
const reportCore=require('./reports-core.js');
const admin={id:'admin',role:'ADMIN',status:'Active'};
const copy=value=>JSON.parse(JSON.stringify(value));
const user=(state,id)=>state.users.find(item=>item.id===id);
const view=(state,userId='mis-agent',extra={})=>dashboard.snapshot({state,userId,...extra});

test('UMD loads in browser without changing hierarchy state or exposing mutable default facts',()=>{
  const state=seed(),before=JSON.stringify(state),sandbox={window:{IneburaMisCore:core}};
  vm.runInNewContext(fs.readFileSync(__dirname+'/mis-dashboard-core.js','utf8'),sandbox);
  assert.equal(sandbox.window.IneburaMisDashboard.snapshot({state,userId:'mis-agent'}).selectedCount,5);
  assert.equal(JSON.stringify(state),before);
  assert.ok(Object.isFrozen(dashboard.sampleFacts['inv-1'].credit));
  const first=view(state); first.cards.odm.rows[0][0]='Changed';
  assert.equal(view(state).cards.odm.rows[0][0],'MIS-TC-001');
});

test('missing, ambiguous, inactive, wrong-role and invalid scopes deny with no report rows',()=>{
  for (const id of ['missing','agent-a','customer-1','']) {
    const result=view(seed(),id);
    assert.equal(result.authorized,false,id);
    assert.ok(Object.values(result.cards).every(card=>!card.available && !card.rows.length));
    assert.throws(()=>dashboard.reportRows('odm',{state:seed(),userId:id}),/active MIS/);
  }
  const state=seed(); user(state,'mis-agent').status='Suspended';
  assert.equal(view(state).authorized,false);
  user(state,'mis-agent').status='Active';
  for (const access of [null,{mode:'client',clientId:'missing'},{mode:'subclients',subclientIds:[]},{mode:'assignees',assigneeIds:['agent-a','missing']}]) {
    user(state,'mis-agent').access=access;
    assert.equal(view(state).authorized,false,JSON.stringify(access));
  }
  state.users.push(copy(user(state,'mis-client')));
  assert.equal(view(state,'mis-client').authorized,false,'ambiguous identity fails closed');
  assert.equal(view(null).authorized,false);
  const malformed=seed();malformed.invoices.push(null);
  assert.equal(view(malformed).authorized,false);
});

test('three modes authorize first, including cross-client agents and personal Agent cum Manager portfolios',()=>{
  const state=seed();
  assert.deepEqual(view(state).selectedInvoiceIds,['inv-1','inv-2','inv-4','inv-5','inv-7']);
  assert.deepEqual(view(state,'mis-client').selectedInvoiceIds,['inv-1','inv-2','inv-3','inv-4']);
  assert.deepEqual(view(state,'mis-sub').selectedInvoiceIds,['inv-1','inv-3']);
  const personal=view(state,'mis-agent',{filter:{kind:'assignees',ids:['acm-c']}});
  assert.deepEqual(personal.selectedInvoiceIds,['inv-4','inv-7']);
  assert.equal(personal.selectedInvoiceIds.includes('inv-3'),false,'ACM team member invoice is excluded');
  assert.deepEqual(dashboard.reportRows('odm',{state,userId:'mis-agent',filter:{kind:'assignees',ids:['agent-a']}}).invoiceIds,['inv-1','inv-2','inv-5']);
});

test('agent-primary scope intersects optional subclients for every dashboard card and export',()=>{
  const state=seed();
  user(state,'mis-agent').access={mode:'assignees',assigneeIds:['agent-a','acm-c'],subclientIds:['tc-north','apollo-north']};
  const current=view(state);
  assert.equal(current.authorized,true);
  assert.deepEqual(current.visibleInvoiceIds,['inv-1','inv-5']);
  assert.deepEqual(current.selectedInvoiceIds,['inv-1','inv-5']);
  assert.deepEqual(current.filterOptions.items.map(item=>item.id),['agent-a','acm-c'],'saved ACM remains available even with zero rows in the selected subclients');
  assert.equal(view(state,'mis-agent',{filter:{ids:['acm-c']}}).selectedCount,0);
  for(const id of dashboard.cardIds) {
    assert.equal(current.cards[id].invoiceCount,2,id);
    assert.deepEqual(dashboard.reportRows(id,{state,userId:'mis-agent'}).invoiceIds,['inv-1','inv-5'],id);
  }
  user(state,'mis-agent').access.subclientIds=[];
  assert.deepEqual(view(state).selectedInvoiceIds,['inv-1','inv-2','inv-4','inv-5','inv-7'],'empty secondary preserves primary-only scope');
  delete user(state,'mis-agent').access.subclientIds;
  assert.equal(view(state).selectedCount,5,'missing secondary preserves older fixtures');
});

test('subclient-primary scope intersects optional assignees without leaking other assignees or dropping empty saved subclients',()=>{
  const state=seed();
  user(state,'mis-sub').access={mode:'subclients',subclientIds:['tc-north','apollo-south'],assigneeIds:['agent-a','acm-c']};
  let current=view(state,'mis-sub');
  assert.deepEqual(current.selectedInvoiceIds,['inv-1','inv-7']);
  assert.deepEqual(current.filterOptions.items.map(item=>item.id),['tc-north','apollo-south']);
  assert.deepEqual(view(state,'mis-sub',{filter:{ids:['tc-north']}}).selectedInvoiceIds,['inv-1']);
  for(const id of dashboard.cardIds) assert.deepEqual(dashboard.reportRows(id,{state,userId:'mis-sub'}).invoiceIds,['inv-1','inv-7'],id);
  user(state,'mis-sub').access.assigneeIds=['acm-c'];
  current=view(state,'mis-sub');
  assert.deepEqual(current.selectedInvoiceIds,['inv-7']);
  assert.deepEqual(current.filterOptions.items.map(item=>item.id),['tc-north','apollo-south'],'zero-match saved primary is not pruned');
  assert.equal(view(state,'mis-sub',{filter:{ids:['tc-north']}}).selectedCount,0);
  user(state,'mis-sub').access.assigneeIds=[];
  assert.deepEqual(view(state,'mis-sub').selectedInvoiceIds,['inv-1','inv-3','inv-6','inv-7']);
  delete user(state,'mis-sub').access.assigneeIds;
  assert.equal(view(state,'mis-sub').selectedCount,4);
});

test('two-level manager scopes union authorized intersections without Cartesian widening or secondary-excluded options',()=>{
  const state=seed();
  user(state,'mis-agent').access={mode:'assignees',assigneeIds:['agent-a'],subclientIds:['tc-north']};
  user(state,'mis-west').access={mode:'subclients',subclientIds:['apollo-south'],assigneeIds:['acm-c']};
  let manager=view(state,'mgr-west');
  assert.deepEqual(manager.selectedInvoiceIds,['inv-1','inv-7']);
  assert.deepEqual(manager.filterOptions.items.map(item=>item.id),['tc-north','apollo-south']);
  assert.equal(manager.filterOptions.items.some(item=>item.id==='apollo-north'),false,'an excluded invoice held by Agent A cannot create a source option');
  assert.deepEqual(view(state,'mgr-west',{filter:{ids:['apollo-south']}}).selectedInvoiceIds,['inv-7'],'other agents in that subclient remain excluded');
  for(const id of dashboard.cardIds) assert.deepEqual(dashboard.reportRows(id,{state,userId:'mgr-west'}).invoiceIds,['inv-1','inv-7'],id);
  user(state,'mis-west').access={mode:'assignees',assigneeIds:['agent-a','acm-c'],subclientIds:['tc-north','apollo-south']};
  manager=view(state,'mgr-west');
  assert.equal(manager.filterOptions.kind,'assignees');
  assert.deepEqual(manager.selectedInvoiceIds,['inv-1','inv-7'],'overlapping reports count shared invoice once');
  assert.equal(manager.cards.odm.metrics.total,2);
});

test('valid two-level constraints with no current records stay authorized and available as empty source options',()=>{
  const state=seed();
  user(state,'mis-agent').access={mode:'assignees',assigneeIds:['agent-a'],subclientIds:['apollo-south']};
  user(state,'mis-west').access={mode:'subclients',subclientIds:['tc-west'],assigneeIds:['agent-b']};
  const agent=view(state),manager=view(state,'mgr-west');
  assert.equal(agent.authorized,true);assert.equal(agent.selectedCount,0);
  assert.deepEqual(agent.filterOptions.items.map(item=>item.id),['agent-a']);
  assert.equal(manager.authorized,true);assert.equal(manager.selectedCount,0);
  assert.deepEqual(manager.filterOptions.items.map(item=>item.id),['tc-west','apollo-south'],'explicit secondary subclient survives an empty mixed manager portfolio');
  assert.ok(Object.values(manager.cards).every(card=>card.available && card.complete && card.invoiceCount===0));
});

test('two-level dashboard exports refresh narrowed scope, reassignment and fallback without widening the secondary constraint',()=>{
  let state=seed();
  const previous=view(state);
  assert.equal(previous.selectedCount,5);
  user(state,'mis-agent').access.subclientIds=['tc-north'];
  for(const id of dashboard.cardIds) assert.deepEqual(dashboard.reportRows(id,{state,userId:'mis-agent'}).invoiceIds,['inv-1'],id);
  state=core.transitionUser(state,'agent-a','suspend','agent-b',admin);
  assert.deepEqual(view(state).selectedInvoiceIds,['inv-1','inv-3'],'fallback exposes B existing portfolio only within the saved secondary subclient');
  assert.equal(view(state).selectedInvoiceIds.includes('inv-6'),false,'B other-subclient portfolio remains excluded');
  state=core.transitionUser(state,'agent-a','reactivate','',admin);
  assert.deepEqual(view(state).selectedInvoiceIds,['inv-1','inv-3']);
  state=core.reassignInvoice(state,'inv-1','acm-c',admin);
  assert.deepEqual(dashboard.reportRows('odm',{state,userId:'mis-agent'}).invoiceIds,['inv-1','inv-3'],'still-tagged ACM retains the reassigned invoice');
  user(state,'mis-sub').access={mode:'subclients',subclientIds:['tc-north'],assigneeIds:['acm-c']};
  assert.deepEqual(dashboard.reportRows('odm',{state,userId:'mis-sub'}).invoiceIds,['inv-1']);
  state=core.reassignInvoice(state,'inv-1','agent-b',admin);
  assert.deepEqual(dashboard.reportRows('odm',{state,userId:'mis-sub'}).invoiceIds,[],'reassignment outside a secondary assignee removes export access');
});

test('12+ mapped agents use compact stable options, preserving empty agents and all/multi/one/none selections',()=>{
  const state=seed(),extra=[];
  for(let index=3;index<=15;index++) {
    const id=`agent-${index}`;
    state.users.push({id,name:`Agent ${index}`,role:'AGENT',status:'Active'});extra.push(id);
    if(index<15) state.invoices.push({id:`extra-${index}`,invoiceNo:`EX-${index}`,clientId:'client-apollo',subclientId:'apollo-south',assigneeId:id,invoiceDate:'2026-10-05',outstanding:100});
  }
  user(state,'mis-agent').access.assigneeIds.push(...extra);
  const all=view(state),options=all.filterOptions.items;
  assert.equal(options.length,15);
  assert.ok(options.some(option=>option.id==='agent-15'),'mapped agent with no invoices stays selectable');
  assert.equal(all.allSelected,true);
  assert.equal(all.selectedInvoiceIds.length,17);
  assert.equal(view(state,'mis-agent',{filter:{ids:null}}).selectedCount,17);
  assert.deepEqual(view(state,'mis-agent',{filter:{ids:['agent-3','agent-4','agent-3']}}).selectedInvoiceIds,['extra-3','extra-4']);
  assert.deepEqual(view(state,'mis-agent',{filter:{ids:['agent-3']}}).selectedInvoiceIds,['extra-3']);
  const none=view(state,'mis-agent',{filter:{ids:[]}});
  assert.equal(none.allSelected,false); assert.equal(none.selectedCount,0);
  assert.ok(Object.values(none.cards).every(card=>card.available && card.complete && !card.invoiceCount));
  assert.equal(view(state,'mis-agent',{filter:{ids:['agent-15']}}).selectedCount,0);
  assert.deepEqual(view(state,'mis-agent',{filter:{ids:null,search:'Agent 3'}}).selectedInvoiceIds,all.selectedInvoiceIds,'dropdown search is discovery only, not an implicit data selection');
});

test('unknown IDs are pruned, malformed selections and invalid filter kinds cannot widen access',()=>{
  const state=seed();
  const partial=view(state,'mis-agent',{filter:{kind:'assignees',ids:['agent-a','agent-b']}});
  assert.deepEqual(partial.selectedIds,['agent-a']);
  assert.deepEqual(partial.filterValidation.unknownIds,['agent-b']);
  assert.equal(partial.filterValidation.valid,false);
  assert.equal(partial.allSelected,false);
  for(const filter of [{kind:'subclients',ids:null},{kind:'unrestricted'},{ids:'agent-a'},'all']) {
    const result=view(state,'mis-agent',{filter});
    assert.equal(result.selectedCount,0,JSON.stringify(filter));
    assert.equal(result.filterValidation.valid,false);
  }
  assert.equal(view(state,'mis-agent',{filter:{ids:['unknown']}}).selectedCount,0);
  assert.deepEqual(view(state,'mis-client',{filter:{kind:'subclients',ids:['apollo-north']}}).selectedInvoiceIds,[]);
});

test('same-named subclients use IDs/client labels and complete-client options stay in their client',()=>{
  const state=seed(),client=view(state,'mis-client');
  assert.deepEqual(client.filterOptions.items.map(item=>item.id),['tc-north','tc-west']);
  assert.deepEqual(view(state,'mis-client',{filter:{ids:['tc-north']}}).selectedInvoiceIds,['inv-1','inv-3']);
  user(state,'mis-sub').access.subclientIds.push('apollo-north');
  const sub=view(state,'mis-sub');
  assert.equal(sub.filterOptions.items.length,2);
  assert.notEqual(sub.filterOptions.items[0].name,sub.filterOptions.items[1].name);
  assert.deepEqual(sub.selectedInvoiceIds,['inv-1','inv-3','inv-5']);
  state.subclients.push({id:'tc-empty',name:'Empty',clientId:'client-tc'});
  assert.ok(view(state,'mis-client').filterOptions.items.some(item=>item.id==='tc-empty'));
});

test('All preserves authorized client invoices without subclient metadata while explicit filters still narrow',()=>{
  const state=seed();
  state.invoices.push({id:'unallocated-subclient',invoiceNo:'NO-SUB',clientId:'client-tc',assigneeId:'agent-a',invoiceDate:'2026-10-05'});
  assert.equal(view(state,'mis-client').selectedInvoiceIds.includes('unallocated-subclient'),true);
  assert.equal(view(state,'mis-client',{filter:{kind:'subclients',ids:null}}).selectedInvoiceIds.includes('unallocated-subclient'),true);
  assert.equal(view(state,'mis-client',{filter:{ids:['tc-north','tc-west']}}).selectedInvoiceIds.includes('unallocated-subclient'),false);
  assert.equal(view(state,'mis-client',{filter:{ids:[]}}).selectedCount,0);
});

test('manager overlap and mixed-scope filters do not form an agent/subclient Cartesian union',()=>{
  const state=seed();
  const manager=view(state,'mgr-west');
  assert.equal(manager.filterOptions.kind,'subclients');
  assert.deepEqual(manager.selectedInvoiceIds,['inv-1','inv-2','inv-4','inv-5','inv-7']);
  assert.equal(manager.cards.odm.metrics.total,5);
  assert.deepEqual(view(state,'mgr-west',{filter:{ids:['apollo-south']}}).selectedInvoiceIds,['inv-7'],'Agent Two in the same subclient remains hidden');
  user(state,'mis-west').access={mode:'assignees',assigneeIds:['agent-a']};
  const agentManager=view(state,'mgr-west');
  assert.equal(agentManager.filterOptions.kind,'assignees');
  assert.equal(agentManager.filterOptions.items.length,2);
  assert.equal(agentManager.cards.odm.metrics.total,5);
  state.invoices.push(copy(state.invoices[0]));
  assert.equal(view(state,'mgr-west').cards.odm.metrics.total,5,'duplicate stable invoice ID counts once');
  user(state,'mis-west').access={mode:'assignees',assigneeIds:['missing']};
  assert.equal(view(state,'mgr-west').authorized,false,'corrupt child scope fails closed');
});

test('ordinary reassignment, fallback and reactivation use current assignments and current tags',()=>{
  let state=seed();
  state=core.reassignInvoice(state,'inv-1','agent-b',admin);
  assert.equal(view(state).selectedInvoiceIds.includes('inv-1'),false);
  assert.equal(view(state,'mis-sub').selectedInvoiceIds.includes('inv-1'),true);
  state=core.transitionUser(state,'agent-a','suspend','agent-b',admin);
  assert.deepEqual(view(state).filterOptions.items.map(item=>item.id),['agent-b','acm-c']);
  assert.equal(view(state).selectedCount,7,'fallback includes B existing portfolio across clients');
  assert.equal(view(state,'mis-agent',{filter:{ids:['agent-a']}}).selectedCount,0,'old selection is pruned');
  state=core.transitionUser(state,'agent-a','reactivate','',admin);
  assert.equal(view(state).selectedCount,7);
  assert.equal(view(state).filterOptions.items.some(item=>item.id==='agent-a'),false,'reactivation does not restore mapping');
});

test('moving reports and replacing a manager updates the visible union immediately',()=>{
  let state=seed();
  state=core.saveUser(state,{...user(state,'mis-agent'),managerId:'mgr-north'},admin);
  assert.deepEqual(view(state,'mgr-west').selectedInvoiceIds,['inv-2','inv-4']);
  assert.deepEqual(view(state,'mgr-north').selectedInvoiceIds,['inv-1','inv-2','inv-3','inv-4','inv-5','inv-7']);
  state=core.transitionUser(state,'mgr-north','delete','mgr-west',admin);
  assert.equal(view(state,'mgr-north').authorized,false);
  assert.equal(view(state,'mgr-west').selectedCount,6);
});

test('inclusive invoice-date filters allow open boundaries and reject invalid/reversed dates',()=>{
  const state=seed();
  assert.deepEqual(view(state,'mis-agent',{period:{start:'2026-10-02',end:'2026-10-04'}}).selectedInvoiceIds,['inv-2','inv-4']);
  assert.deepEqual(view(state,'mis-agent',{period:{start:new Date(2026,9,4),end:new Date(2026,9,5)}}).selectedInvoiceIds,['inv-4','inv-5']);
  assert.deepEqual(view(state,'mis-agent',{period:{end:'2026-10-02'}}).selectedInvoiceIds,['inv-1','inv-2']);
  assert.deepEqual(view(state,'mis-agent',{period:{start:'2026-10-07'}}).selectedInvoiceIds,['inv-7']);
  for(const period of [null,'invalid',[],{start:'2026-02-31'},{start:'bad'},{start:new Date('invalid')},{start:'2026-10-05',end:'2026-10-01'}]) assert.equal(view(state,'mis-agent',{period}).authorized,false);
  state.invoices[0].invoiceDate='2026-02-31';
  assert.equal(view(state,'mis-agent',{period:{start:'2026-02-01',end:'2026-03-31'}}).selectedCount,0);
  const empty=view(state,'mis-agent',{period:{start:'2025-01-01',end:'2025-12-31'}});
  assert.ok(Object.values(empty.cards).every(card=>card.available && card.complete && card.invoiceCount===0));
});

test('missing facts remain explicit per card and new invoices never acquire generated facts',()=>{
  const state=seed(),facts=copy(dashboard.sampleFacts);
  delete facts['inv-1']; delete facts['inv-2'].committedAmount;
  const partial=view(state,'mis-agent',{facts});
  assert.equal(partial.cards.odm.coveredCount,4); assert.equal(partial.cards.odm.missingCount,1);
  assert.equal(partial.cards.achievement.coveredCount,3); assert.equal(partial.cards.achievement.missingCount,2);
  assert.equal(partial.cards.odm.available,true); assert.equal(partial.cards.odm.complete,false);
  const missing=view(state,'mis-agent',{facts:{}});
  assert.ok(Object.values(missing.cards).every(card=>!card.available && card.missingCount===5 && !card.rows.length));
  assert.throws(()=>dashboard.reportRows('credit',{state,userId:'mis-agent',facts:{}}),/no available dashboard facts/);
  state.invoices.push({id:'new-invoice',invoiceNo:'NEW',clientId:'client-tc',subclientId:'tc-north',assigneeId:'agent-a',invoiceDate:'2026-10-01'});
  const added=view(state);
  assert.equal(added.selectedCount,6);
  assert.ok(Object.values(added.cards).every(card=>card.missingCount===1));
  assert.equal(ownFact('new-invoice'),false);
  function ownFact(id){return Object.hasOwn(dashboard.sampleFacts,id);}
});

test('achievement is ratio of sums, supports overachievement and gives no percentage for zero commitments',()=>{
  const state=seed(),facts={
    'inv-1':{committedAmount:100,achievedAmount:50},
    'inv-2':{committedAmount:900,achievedAmount:900},
    'inv-4':{committedAmount:0,achievedAmount:50}
  };
  const card=view(state,'mis-agent',{facts}).cards.achievement;
  assert.equal(card.metrics.committed,1000); assert.equal(card.metrics.achieved,1000);
  assert.equal(card.metrics.achievementPercent,100); assert.equal(card.missingCount,2);
  facts['inv-2'].achievedAmount=1200;
  const over=view(state,'mis-agent',{facts}).cards.achievement;
  assert.equal(over.metrics.achievementPercent,130); assert.equal(over.metrics.remaining,0);
  assert.equal(view(state,'mis-agent',{facts,filter:{ids:['acm-c']}}).cards.achievement.metrics.achievementPercent,null);
  facts['inv-1'].committedAmount=-1;
  assert.equal(view(state,'mis-agent',{facts}).cards.achievement.coveredCount,2,'invalid numeric measures are unavailable');
});

test('credit sums explicit allocations once, separates balance and usage and rejects inconsistent duplicate allocations',()=>{
  const state=seed(),facts={
    'inv-1':{credit:{allocationId:'allocation-1',used:100,balance:300}},
    'inv-2':{credit:{allocationId:'allocation-1',used:100,balance:300}},
    'inv-4':{credit:{allocationId:'allocation-2',used:50,balance:50}},
    'inv-3':{credit:{allocationId:'unassigned-secret',used:999999,balance:999999}}
  };
  let card=view(state,'mis-agent',{facts}).cards.credit;
  assert.deepEqual(card.metrics,{used:150,balance:350,total:500,usagePercent:30,allocationCount:2});
  assert.equal(card.rows.length,2); assert.equal(card.coveredCount,3); assert.equal(card.missingCount,2);
  assert.equal(JSON.stringify(card).includes('unassigned-secret'),false);
  facts['inv-2'].credit.balance=400;
  card=view(state,'mis-agent',{facts}).cards.credit;
  assert.equal(card.metrics.total,100); assert.equal(card.coveredCount,1);
  assert.equal(card.rows[0][6],'allocation-2');
});

test('submission mode groups and acknowledgement counts reconcile without treating unsubmitted invoices as acknowledged',()=>{
  const state=seed(),facts={
    'inv-1':{submissionStatus:'submitted',submissionMode:'manual',acknowledged:true},
    'inv-2':{submissionStatus:'not-submitted',submissionMode:'manual',acknowledged:true},
    'inv-4':{submissionStatus:'submitted',submissionMode:'external',acknowledged:false},
    'inv-5':{submissionStatus:'submitted',submissionMode:'automated'},
    'inv-7':{submissionStatus:'not-submitted'}
  };
  const result=view(state,'mis-agent',{facts}),submission=result.cards.submission,ack=result.cards.acknowledgement;
  assert.equal(submission.metrics.submitted,3); assert.equal(submission.metrics.notSubmitted,2);
  assert.deepEqual(submission.metrics.modes.find(mode=>mode.id==='manual'),{id:'manual',name:'Manual',submitted:1,notSubmitted:1,total:2});
  assert.equal(submission.metrics.modes.reduce((sum,mode)=>sum+mode.total,0),5);
  assert.deepEqual(ack.metrics,{submitted:2,acknowledged:1,pending:1,acknowledgementPercent:50});
  assert.equal(ack.missingCount,1,'submitted invoice with unknown acknowledgement remains explicitly missing');
  assert.equal(ack.rows.filter(row=>row.at(-1)==='Acknowledged').length,1);
});

test('issues count invoices, deduplicate records, and require every issue resolved for an invoice to be resolved',()=>{
  const state=seed(),facts={
    'inv-1':{issues:[{id:'i1',status:'resolved'},{id:'i1',status:'resolved'},{id:'i2',status:'resolved'}]},
    'inv-2':{issues:[{id:'i3',status:'resolved'},{id:'i4',status:'open'}]},
    'inv-4':{issues:[]},
    'inv-5':{issues:[{id:'i5',status:'open'}]},
    'inv-7':{issues:[{id:'i6',status:'resolved'}]}
  };
  let card=view(state,'mis-agent',{facts}).cards.issues;
  assert.deepEqual(card.metrics,{withIssues:4,resolved:2,unresolved:2,withoutIssues:1,total:5});
  assert.deepEqual(card.rows[0].slice(-4),[2,2,0,'Resolved']);
  assert.equal(card.metrics.resolved+card.metrics.unresolved,card.metrics.withIssues);
  facts['inv-2'].issues.push({id:'i3',status:'open'});
  card=view(state,'mis-agent',{facts}).cards.issues;
  assert.equal(card.missingCount,1,'conflicting issue status is unavailable rather than guessed');
});

test('export refreshes access and cell values, removes old selections and never accepts stale row authority',()=>{
  const state=seed(),old=view(state),before=JSON.stringify(state);
  assert.equal(old.cards.odm.rows.length,5);
  const next=core.reassignInvoice(state,'inv-1','agent-b',admin);
  next.invoices.find(invoice=>invoice.id==='inv-2').customerName='Current name';
  const exported=dashboard.reportRows('odm',{state:next,userId:'mis-agent'});
  assert.deepEqual(exported.invoiceIds,['inv-2','inv-4','inv-5','inv-7']);
  assert.equal(exported.rows[0][4],'Current name');
  assert.equal(exported.rows.some(row=>row.includes('MIS-TC-001')),false);
  assert.equal(JSON.stringify(state),before);
  user(next,'mis-agent').access={mode:'subclients',subclientIds:['tc-north']};
  assert.deepEqual(dashboard.reportRows('odm',{state:next,userId:'mis-agent',filter:{kind:'assignees',ids:['agent-a']}}).rows,[]);
  user(next,'mis-agent').status='Suspended';
  assert.throws(()=>dashboard.reportRows('odm',{state:next,userId:'mis-agent'}),/active MIS/);
  assert.throws(()=>dashboard.reportRows('unscoped',{state,userId:'mis-agent'}),/available MIS dashboard report/);
});

test('every report keeps row identities aligned and uses the existing formula-safe CSV wrapper',()=>{
  const state=seed(); state.invoices[0].customerName='=HYPERLINK("https://example.test")';
  for(const id of dashboard.cardIds) {
    const data=dashboard.reportRows(id,{state,userId:'mis-agent'});
    assert.equal(data.rows.length,data.invoiceIds.length,id);
    assert.ok(data.rows.every(row=>row.length===data.headers.length),id);
    assert.ok(data.invoiceIds.every(invoiceId=>view(state).selectedInvoiceIds.includes(invoiceId)),id);
    const csv=reportCore.csv(data.headers,data.rows);
    assert.ok(csv.includes("'=HYPERLINK"),id);
  }
});
