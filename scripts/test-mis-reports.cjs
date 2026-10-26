const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const core=require('./mis-access-core.js');
const {seed}=require('./mis-access-store.js');
const access=require('./mis-reports-access.js');
const reportCore=require('./reports-core.js');
const admin={id:'admin',role:'Admin',status:'Active'};
const identity=(state,id)=>access.context({state,search:'?misUser='+id},core);
const report=(state,id,period)=>access.resolve(core,state,identity(state,id),period);
const ids=dataset=>dataset.rowMetadata.map(meta=>meta.invoiceId);

test('MIS identity resolves explicit IDs or a unique active role/name; unknown identity denies',()=>{
  const state=seed();
  assert.equal(identity(state,'mis-agent').authorized,true);
  for(const id of ['missing','','agent-a'])assert.equal(identity(state,id).authorized,false);
  assert.equal(access.context({state,activeRole:'MIS User',activeName:' mis portfolio '},core).userId,'mis-agent');
  assert.equal(access.context({state,activeRole:'MIS Manager',activeName:'MIS Manager West'},core).userId,'mgr-west');
  assert.equal(access.context({state,activeRole:'MIS',activeName:'Unknown'},core).authorized,false);
  assert.equal(access.context({state,activeRole:'MIS',activeName:'MIS Manager West'},core).authorized,false);
  assert.equal(access.context({state,activeRole:'Admin'},core).requested,false);
  assert.equal(access.context({state:null,search:'?misUser=mis-agent',error:'corrupt'},core).authorized,false);
  assert.equal(access.context({state,identityError:true,error:'Storage unavailable'},core).requested,true,'identity read failures cannot fall through to unrestricted reports');
  assert.equal(access.context({state,search:'?misUser=mis-agent'},null).authorized,false);
  state.users.find(user=>user.id==='mis-agent').status='Suspended';
  assert.equal(identity(state,'mis-agent').authorized,false);
  assert.throws(()=>report(state,'mis-agent'),/No active MIS/);
  state.users.push({...state.users.find(user=>user.id==='mis-sub'),id:'duplicate',name:'MIS Client'});
  assert.equal(access.context({state,activeRole:'MIS',activeName:'MIS Client'},core).authorized,false);
});

test('MIS catalog exposes only one labelled preview; all non-MIS report descriptors are preserved',()=>{
  const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/reports-data.js','utf8'),sandbox);
  const source=JSON.parse(JSON.stringify(sandbox.window.IneburaReportsData));
  const original=JSON.stringify(source);
  assert.deepEqual(access.catalog(source,identity(seed(),'mis-agent')).map(item=>item.id),['mis-portfolio-preview']);
  assert.deepEqual(access.catalog(source,identity(seed(),'missing')).map(item=>item.id),['mis-portfolio-preview']);
  assert.deepEqual(access.catalog(source,{requested:false}),Array.from(source));
  assert.equal(JSON.stringify(source),original);
});

test('three exclusive modes, manager unions and Agent cum Manager personal portfolios retain stable metadata',()=>{
  const state=seed();
  assert.deepEqual(ids(report(state,'mis-client')),['inv-1','inv-2','inv-3','inv-4']);
  assert.deepEqual(ids(report(state,'mis-sub')),['inv-1','inv-3']);
  assert.deepEqual(ids(report(state,'mis-agent')),['inv-1','inv-2','inv-4','inv-5','inv-7']);
  assert.deepEqual(ids(report(state,'mgr-north')),['inv-1','inv-2','inv-3','inv-4']);
  assert.equal(ids(report(state,'mgr-west')).length,5,'manager overlap counts each invoice once');
  state.users.find(user=>user.id==='mis-agent').access={mode:'assignees',assigneeIds:['acm-c']};
  assert.deepEqual(ids(report(state,'mis-agent')),['inv-4','inv-7'],'Agent cum Manager team invoices are excluded');
  state.invoices[3].invoiceNo=state.invoices[6].invoiceNo='DUPLICATE';
  const dataset=report(state,'mis-agent');
  assert.equal(dataset.rows.length,2,'invoice number is not the identity');
  assert.equal(dataset.rows[0].length,dataset.headers.length);
  assert.equal(dataset.rows[0].includes('inv-4'),false,'stable IDs are separate from display schema');
  assert.equal(dataset.rowMetadata[0].assigneeId,'acm-c');
});

test('report previews inherit both optional scope intersections and primary-only compatibility from the hierarchy core',()=>{
  const state=seed(),agent=state.users.find(user=>user.id==='mis-agent'),sub=state.users.find(user=>user.id==='mis-sub');
  agent.access={mode:'assignees',assigneeIds:['agent-a','acm-c'],subclientIds:['tc-north','apollo-north']};
  assert.deepEqual(ids(report(state,'mis-agent')),['inv-1','inv-5']);
  sub.access={mode:'subclients',subclientIds:['tc-north','apollo-south'],assigneeIds:['agent-a','acm-c']};
  assert.deepEqual(ids(report(state,'mis-sub')),['inv-1','inv-7']);
  assert.deepEqual(report(state,'mis-sub').rowMetadata.map(meta=>meta.assigneeId),['agent-a','acm-c']);
  agent.access.subclientIds=[];sub.access.assigneeIds=[];
  assert.deepEqual(ids(report(state,'mis-agent')),['inv-1','inv-2','inv-4','inv-5','inv-7']);
  assert.deepEqual(ids(report(state,'mis-sub')),['inv-1','inv-3','inv-6','inv-7']);
  agent.access.subclientIds=['apollo-south'];agent.access.assigneeIds=['agent-a'];
  assert.deepEqual(ids(report(state,'mis-agent')),[],'valid saved constraints can currently have no invoices');
});

test('manager report unions combine complete intersections and deduplicate shared stable invoice IDs',()=>{
  const state=seed(),agent=state.users.find(user=>user.id==='mis-agent'),west=state.users.find(user=>user.id==='mis-west');
  agent.access={mode:'assignees',assigneeIds:['agent-a'],subclientIds:['tc-north']};
  west.access={mode:'subclients',subclientIds:['tc-north','apollo-south'],assigneeIds:['agent-a','acm-c']};
  assert.deepEqual(ids(report(state,'mgr-west')),['inv-1','inv-7']);
  assert.deepEqual(report(state,'mgr-west').rows.map(row=>row[3]),['Agent One','Rajneesh ACM']);
  assert.equal(ids(report(state,'mgr-west')).includes('inv-3'),false,'a primary subclient cannot widen the secondary assignee restriction');
  assert.equal(ids(report(state,'mgr-west')).includes('inv-5'),false,'a primary agent cannot widen the secondary subclient restriction');
});

test('a two-level change invalidates fingerprints and stale report rows are reauthorized against the fresh intersection',()=>{
  const state=seed(),old=report(state,'mis-agent'),options={state,search:'?misUser=mis-agent'};
  const stamp=access.fingerprint(options,access.context(options,core));
  state.users.find(user=>user.id==='mis-agent').access.subclientIds=['tc-north'];
  assert.notEqual(access.fingerprint(options,access.context(options,core)),stamp,'secondary scope is part of access fingerprint without requiring a revision update');
  let fresh=report(state,'mis-agent');
  assert.deepEqual(ids(fresh),['inv-1']);
  assert.deepEqual(access.approvedRows(old,old.rows,fresh).map(row=>row[0]),['MIS-TC-001']);
  const reassigned=core.reassignInvoice(state,'inv-1','agent-b',admin);
  fresh=report(reassigned,'mis-agent');
  assert.deepEqual(access.approvedRows(old,old.rows,fresh),[],'ordinary reassignment outside the primary agents removes the stale export row');
  const fallback=core.transitionUser(state,'agent-a','suspend','agent-b',admin);
  assert.deepEqual(ids(report(fallback,'mis-agent')),['inv-1','inv-3'],'fallback respects secondary subclients while adding B existing authorized portfolio');
});

test('date range filters use actual invoice dates, include boundaries and keep metadata aligned',()=>{
  const state=seed();
  const dataset=report(state,'mis-agent',{start:new Date(2026,9,2),end:new Date(2026,9,4)});
  assert.deepEqual(ids(dataset),['inv-2','inv-4']);
  assert.deepEqual(dataset.rows.map(row=>row[5]),['02-10-2026','04-10-2026']);
  assert.deepEqual(report(state,'mis-agent',{start:new Date(2026,8,1),end:new Date(2026,8,30)}).rows,[]);
  assert.throws(()=>report(state,'mis-agent',{start:new Date(2026,9,4),end:new Date(2026,9,2)}),/on or before/);
  state.invoices[1].invoiceDate='2026-02-31';
  assert.deepEqual(ids(report(state,'mis-agent',{start:new Date(2026,1,1),end:new Date(2026,2,1)})),[]);
});

test('ordinary reassignment, fallback, reactivation and reporting transfers read current state',()=>{
  let state=seed();
  state=core.reassignInvoice(state,'inv-1','agent-b',admin);
  assert.equal(ids(report(state,'mis-agent')).includes('inv-1'),false);
  state=core.transitionUser(state,'agent-a','suspend','agent-b',admin);
  assert.equal(ids(report(state,'mis-agent')).includes('inv-3'),true,'fallback includes existing portfolio');
  assert.equal(ids(report(state,'mis-agent')).includes('inv-6'),true,'fallback spans main clients');
  state=core.transitionUser(state,'agent-a','reactivate',null,admin);
  assert.deepEqual(state.users.find(user=>user.id==='mis-agent').access.assigneeIds,['agent-b','acm-c']);
  state=core.saveUser(state,{...state.users.find(user=>user.id==='mis-agent'),managerId:'mgr-north'},admin);
  assert.deepEqual(ids(report(state,'mgr-west')),['inv-2','inv-4'],'old manager retains only independent overlap');
  assert.equal(ids(report(state,'mgr-north')).includes('inv-6'),true);
});

test('filtered exports reauthorize stable invoice IDs and obtain fresh cells after revocation',()=>{
  const oldState=seed(),oldReport=report(oldState,'mis-agent');
  const selected=reportCore.filterRows(oldReport.rows,{1:'TestClient Pvt Ltd'});
  const next=core.reassignInvoice(oldState,'inv-1','agent-b',admin);
  next.invoices.find(invoice=>invoice.id==='inv-2').customerName='Updated customer';
  const fresh=report(next,'mis-agent');
  const rows=access.approvedRows(oldReport,selected,fresh);
  assert.deepEqual(rows.map(row=>row[0]),['MIS-TC-002','MIS-TC-004']);
  assert.equal(rows[0][4],'Updated customer','old rendered cell values cannot leak into a fresh export');
  assert.deepEqual(access.approvedRows(oldReport,[selected[0],selected[0]],fresh),[],'revoked duplicate rows excluded');
  assert.deepEqual(access.approvedRows(oldReport,[['invented']],fresh),[],'untracked rows excluded');
  assert.throws(()=>access.approvedRows({id:'captured'},[],fresh),/unavailable/);
  const incomplete=structuredClone(next);incomplete.users.find(user=>user.id==='mis-agent').access={mode:'assignees',assigneeIds:[]};
  assert.deepEqual(access.approvedRows(oldReport,selected,report(incomplete,'mis-agent')),[],'incomplete scope never expands');
});

test('fingerprints invalidate MIS state, identity and mapping edits even without revision changes',()=>{
  const state=seed(),options={state,search:'?misUser=mis-agent',activeRole:'Admin',activeName:'Admin'};
  const original=access.fingerprint(options,access.context(options,core));
  state.users.find(user=>user.id==='mis-agent').access.assigneeIds=['agent-b'];
  assert.notEqual(access.fingerprint(options,access.context(options,core)),original);
  const nonMis={state,search:'',activeRole:'Admin',activeName:'Admin'};
  const normal=access.fingerprint(nonMis,access.context(nonMis,core));
  state.revision++;
  assert.equal(access.fingerprint(nonMis,access.context(nonMis,core)),normal,'normal captured reports ignore unrelated MIS edits');
  nonMis.activeRole='MIS';
  assert.notEqual(access.fingerprint(nonMis,access.context(nonMis,core)),normal);
});
