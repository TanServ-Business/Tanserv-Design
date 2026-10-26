'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const clone=value=>JSON.parse(JSON.stringify(value));
const source=fs.readFileSync(require.resolve('./strategy-master.js'),'utf8');
function fixture(raw,coreState={templates:[],strategies:[],batches:[],emails:[]}) {
  const data=new Map(raw===undefined?[]:[['ineburaStrategyMaster',JSON.stringify(raw)]]),nodes=new Map(),adapterCalls=[];
  const node=()=>({dataset:{},classList:{add(){},remove(){},toggle(){}},setAttribute(){},querySelectorAll(){return[];},querySelector(){return null;},addEventListener(){},textContent:'',innerHTML:'',value:'',options:[]});
  const document={body:node(),getElementById(id){if(!nodes.has(id))nodes.set(id,node());return nodes.get(id);},addEventListener(){},querySelectorAll(){return[];}};
  const window={localStorage:{getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)},IneburaDunning:{getState:()=>clone(coreState)},IneburaDunningStrategyAdapter:Object.fromEntries(['catalog','existing','validate','save','remove'].map(name=>[name,()=>{adapterCalls.push(name);throw Error('Old Dunning adapter must not run');}])),ineburaStrategyTemplateSource:{ChequeBounce:{subjectLine:'Bounce notice',templateContent:'<p>Payment reminder</p>'}}};
  const instrumented=source.replace('document.addEventListener("DOMContentLoaded", init);','window.testApi={state,loadStrategies,deleteStrategy,saveStrategy,getOrderedTemplates,normalizeStoredStrategy,createTemplateEntry};');
  vm.runInNewContext(instrumented,{window,document,Intl,Date,Map,Set,JSON,Math,console});
  return {api:window.testApi,data,nodes,adapterCalls,coreState};
}
const regular={templateId:'cheque_bounce',notificationMode:'custom',reminderSteps:[{days:2,when:'after',attachments:[]}],invoiceStatuses:['Funds Issue'],agingBuckets:['1-30']};
const dunning={templateId:'dunning-template-1',notificationMode:'custom',reminderSteps:[{days:15,when:'after',attachments:['Dunning letter + annexure (PDF)']}]};
const saved=(id,templates)=>({id,strategyName:id,status:'active',reminderType:'post_due',targetType:'invoice',targetMode:'selected',selectedTargetIds:['INV-1'],excludedTargetIds:['INV-2'],templates});
const tests=[];const test=(name,run)=>tests.push({name,run});
test('old Strategy Master dropdown contains only regular email templates',()=>{
  const f=fixture([],{templates:[{id:'dunning-template-1',stageNumber:1},{id:'client-custom-final',stageNumber:2}],strategies:[]});
  assert.deepEqual(Array.from(f.api.getOrderedTemplates(),row=>row.id),['cheque_bounce']);assert.deepEqual(f.adapterCalls,[]);
});
test('loading filters Dunning blocks and retains mixed strategy IDs and exact target selections without touching Dunning state',()=>{
  const state={templates:[{id:'client-custom-final',stageNumber:2}],strategies:[{id:'mixed',status:'active'}],batches:[{id:'in-flight',strategyId:'mixed',stage:2}],emails:[{id:'sent',letterSnapshot:{pdfDataUri:'EXACT'}}]};
  const before=JSON.stringify(state),f=fixture([saved('pure',[dunning]),saved('mixed',[regular,dunning,{templateId:'client-custom-final'}]),saved('regular',[regular])],state);
  f.api.loadStrategies();assert.deepEqual(Array.from(f.api.state.strategies,row=>row.id),['mixed','regular']);
  assert.deepEqual(Array.from(f.api.state.strategies[0].templates,row=>row.templateId),['cheque_bounce']);
  assert.equal(JSON.stringify(f.api.state.strategies[0].selectedTargetIds),JSON.stringify(['INV-1']));assert.equal(JSON.stringify(f.api.state.strategies[0].excludedTargetIds),JSON.stringify(['INV-2']));
  assert.equal(JSON.stringify(state),before);assert.deepEqual(f.adapterCalls,[]);
});
test('saving and deleting the regular part of a migrated mixed strategy never stops its Dunning batches',()=>{
  const state={templates:[],strategies:[{id:'mixed',status:'active',stages:[{templateId:'dunning-template-1'}]}],batches:[{id:'active',strategyId:'mixed',stage:2,status:'scheduled'}],emails:[{id:'sent',letterSnapshot:{pdfDataUri:'EXACT'}}]},before=JSON.stringify(state);
  const f=fixture([saved('mixed',[regular,dunning])],state);f.api.loadStrategies();
  f.api.state.formMode='edit';f.api.state.editingId='mixed';f.api.state.form=clone(f.api.state.strategies[0]);f.api.state.form.strategyName='Edited regular strategy';
  f.api.saveStrategy({preventDefault(){}});assert.equal(f.nodes.get('smFormError').textContent,'');
  const persisted=JSON.parse(f.data.get('ineburaStrategyMaster'));assert.equal(persisted[0].strategyName,'Edited regular strategy');assert.deepEqual(persisted[0].templates.map(row=>row.templateId),['cheque_bounce']);
  f.api.deleteStrategy('mixed');assert.deepEqual(JSON.parse(f.data.get('ineburaStrategyMaster')),[]);assert.equal(JSON.stringify(state),before);assert.deepEqual(f.adapterCalls,[]);
});
test('legacy payload-only mixed strategy appears once and ordinary deletion does not resurrect it',()=>{
  const state={templates:[],strategies:[{id:'payload-only',status:'active',strategyMasterPayload:saved('payload-only',[dunning,regular])}]};
  const f=fixture(undefined,state);f.api.loadStrategies();assert.deepEqual(Array.from(f.api.state.strategies,row=>row.id),['payload-only']);
  f.api.deleteStrategy('payload-only');f.api.loadStrategies();assert.equal(f.api.state.strategies.length,0);assert.equal(state.strategies[0].status,'active');assert.deepEqual(f.adapterCalls,[]);
});
let failures=0;for(const {name,run}of tests){try{run();console.log('PASS '+name);}catch(error){failures++;console.error('FAIL '+name+'\n'+error.stack);}}
if(failures)process.exitCode=1;else console.log(`${tests.length} Strategy Master Dunning migration scenarios passed.`);
