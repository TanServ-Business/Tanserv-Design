'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const adapter=require('./dunning-template-adapter.js'),{createInstance}=require('./dunning-core.js');
const {createController}=require('./dunning-management-templates.js');
global.mammoth=require('./vendor/mammoth.browser.min.js');require('./dunning-documents.js');const documents=global.IneburaDunningDocuments;
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/template-master-data.js','utf8'),sandbox);
const catalog=JSON.parse(JSON.stringify(sandbox.window.IneburaTemplateMasterSource));
const rows=adapter.catalogRows(catalog),actor={role:'client-admin',userId:'admin',clientId:'demo-client'};
const map=new Map(),storage={getItem:key=>map.get(key)||null,setItem:(key,value)=>map.set(key,value)};
const bytes=fs.readFileSync(__dirname+'/../assets/dunning/standard-dunning-letter.docx');
const standard=()=>documents.importDocx({name:'standard-dunning-letter.docx',size:bytes.length,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)}).then(value=>({...value,sourceFileName:'standard-dunning-letter.docx'}));
function fiveStageStrategy(api) {
 api.saveStrategy({id:'qa-five',name:'Five configured daily letters',clientId:actor.clientId,subClientId:'North',status:'active',firstStageDays:15,stages:Array.from({length:5},(_,index)=>({templateId:`dunning-template-${index+1}`,intervalDays:index?1:0}))});
}
async function additionalLetterFlow() {
 const data=new Map(),localStorage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
 const api=createInstance({storage:localStorage,context:actor,emailTemplates:catalog});api.saveConfiguration({enabled:true,letterCount:5});
 const controller=createController({api,adapter,documents:{...documents,loadStandardTemplate:standard},source:catalog,storage:localStorage});await controller.provision();
 // Represent already-saved DL4/5 records from the former independent-email design.
 for(const stage of [4,5]) {
  const template=api.getState().templates.find(row=>row.stageNumber===stage);
  api.saveTemplate({...template,letterHtml:template.letterHtml+`<p>Custom DL${stage} Word letter</p>`,body:template.body+`<p>Custom DL${stage} Word letter</p>`,emailSubject:`Stale DL${stage}`,emailBody:`Stale DL${stage} message`,emailTemplateSource:{id:`old-dl${stage}`,subject:`Stale DL${stage}`,body:`Stale DL${stage} message`}});
 }
 fiveStageStrategy(api);
 for(const date of ['2026-10-20','2026-10-21','2026-10-22'])api.runDaily(date);
 const initial=api.getState(),batchId=initial.batches.find(row=>row.createdDate==='2026-10-20').id,issued=JSON.stringify(initial.emails),issuedCount=initial.emails.length;
 const oldThird=initial.emails.find(row=>row.batchId===batchId&&row.stage===3);assert.equal(oldThird.letterSnapshot.template.emailTemplateSource.id,rows[2].id);
 let editor=controller.session(3);editor.setEmail({subject:'DL3 revised {{letterReference}}',body:rows[2].body+'<p>Shared current DL3 message.</p>'});editor.save();
 api.runDaily('2026-10-23');let state=api.getState(),fourth=state.emails.find(row=>row.batchId===batchId&&row.stage===4);
 assert(fourth);assert.equal(fourth.subject,`DL3 revised ${fourth.reference}`);assert.match(fourth.body,/Shared current DL3 message/);assert.match(fourth.body,/SAMPLE-101/);assert.match(fourth.body,/Aurora/);assert.match(fourth.body,new RegExp(initial.emails.find(row=>row.batchId===batchId&&row.stage===1).reference));
 assert.equal(fourth.letterSnapshot.stageNumber,4);assert.equal(fourth.letterSnapshot.template.id,'dunning-template-4');assert.match(fourth.letterSnapshot.template.body,/Custom DL4 Word letter/);assert.equal(fourth.letterSnapshot.template.emailTemplateSource.id,rows[2].id);assert.equal(fourth.letterSnapshot.template.emailSourceStage,3);
 assert.equal(JSON.stringify(state.emails.slice(0,issuedCount)),issued,'all issued emails and exact PDF snapshots remain unchanged');
 const frozenFourth=JSON.stringify(fourth);
 editor=controller.session(3);editor.setEmail({subject:'DL3 latest {{letterReference}}',body:'<p>Latest shared DL3 for {{customerName}}: {{letterReference}}</p>{{invoiceTable}}'});editor.save();
 api.runDaily('2026-10-24');state=api.getState();const fifth=state.emails.find(row=>row.batchId===batchId&&row.stage===5);
 assert(fifth);assert.equal(fifth.subject,`DL3 latest ${fifth.reference}`);assert.match(fifth.body,/Latest shared DL3/);assert.match(fifth.body,new RegExp(fifth.reference));assert.match(fifth.body,/SAMPLE-101/);assert.equal(fifth.letterSnapshot.template.id,'dunning-template-5');assert.match(fifth.letterSnapshot.template.body,/Custom DL5 Word letter/);assert.equal(fifth.letterSnapshot.stageNumber,5);
 assert.equal(JSON.stringify(state.emails.find(row=>row.id===fourth.id)),frozenFourth);assert.equal(JSON.stringify(state.emails.slice(0,issuedCount)),issued);
}
function legacyCatalogAdditionalFlow() {
 const data=new Map(),localStorage={getItem:key=>data.get(key)||null,setItem:(key,value)=>data.set(key,value)};
 const api=createInstance({storage:localStorage,context:actor,emailTemplates:catalog});api.saveConfiguration({enabled:true,letterCount:5});
 for(const template of api.getState().templates)api.saveTemplate({...template,standardReady:true});
 fiveStageStrategy(api);
 data.set('ineburaTemplateMaster:xeon:20261015:v1',JSON.stringify({templates:[{...rows[2],subject:'Saved DL3 {{letterReference}}',body:'<p>Saved DL3 {{customerName}} {{letterReference}}</p>{{invoiceTable}}'}]}));
 for(const date of ['2026-10-20','2026-10-21','2026-10-22','2026-10-23'])api.runDaily(date);
 let state=api.getState();const fourth=state.emails.find(row=>row.stage===4),frozen=JSON.stringify(fourth);
 assert(fourth);assert.equal(fourth.subject,`Saved DL3 ${fourth.reference}`);assert.equal(fourth.letterSnapshot.template.emailTemplateSource.id,rows[2].id);assert.match(fourth.body,/Saved DL3/);
 data.set('ineburaTemplateMaster:xeon:20261015:v1',JSON.stringify({templates:[{...rows[2],subject:'Saved DL3 updated {{letterReference}}',body:'<p>New saved DL3 {{customerName}}</p>{{invoiceTable}}'}]}));
 api.runDaily('2026-10-24');state=api.getState();const fifth=state.emails.find(row=>row.stage===5);
 assert(fifth);assert.equal(fifth.subject,`Saved DL3 updated ${fifth.reference}`);assert.match(fifth.body,/New saved DL3/);assert.equal(JSON.stringify(state.emails.find(row=>row.id===fourth.id)),frozen);
}
(async()=>{
 const api=createInstance({storage,context:actor,emailTemplates:catalog});api.setEnabled(true);assert.equal(api.getState().strategies.length,0);
 const controller=createController({api,adapter,documents:{...documents,loadStandardTemplate:standard,importDocx:async file=>({html:file.html,messages:[]})},source:catalog,storage});await controller.provision();
 api.saveStrategy({id:'qa-strategy',name:'Client configured daily letters',clientId:'demo-client',subClientId:'North',status:'active',firstStageDays:15,stages:api.getState().templates.map((template,index)=>({templateId:template.id,intervalDays:index?7:0}))});
 api.runDaily('2026-10-20');let state=api.getState(),first=state.emails[0];
 assert.equal(first.subject,rows[0].subject);assert.equal(first.letterSnapshot.template.emailTemplateSource.id,rows[0].id);
 assert.doesNotMatch(first.body,/\$\{|<#|<\/#|\{\{/);assert.match(first.body,/SAMPLE-101/);assert.match(first.body,/Aurora/);
 assert.match(first.letterSnapshot.template.body,/Service Restricted Due to Non-Payment/);assert.doesNotMatch(documents.renderLetter(first.letterSnapshot),/Total amount due|Invoice annexure/);
 const issued=JSON.stringify(state.emails);
 const changed={...rows[0],subject:'Obsolete generic Template Master change',body:rows[0].body.replace('Dear Sir/Madam','Old popup greeting')};
 map.set('ineburaTemplateMaster:xeon:20261015:v1',JSON.stringify({templates:[changed]}));api.runDaily('2026-10-21');state=api.getState();assert.equal(state.emails.at(-1).subject,rows[0].subject,'migrated templates cannot be overwritten by the old generic catalog');
 const editor=controller.session(1);editor.setEmail({subject:'Edited in Dunning Letters tab'});editor.save();api.runDaily('2026-10-22');state=api.getState();assert.equal(state.emails.at(-1).subject,'Edited in Dunning Letters tab');
 assert.equal(JSON.stringify(state.emails.slice(0,1)),issued,'template changes never rewrite issued emails');
 api.runDaily('2026-10-27');state=api.getState();const second=state.emails.find(e=>e.stage===2);assert(second);assert.equal(second.letterSnapshot.previousLetterDates[0],'2026-10-20');assert.match(second.body,new RegExp(first.reference));assert.match(second.body,/20-Oct-2026/);assert.doesNotMatch(second.body,/\$\{|<#|<\/#/);
 const html='<p>{{letterDate}}</p><p>{{letterReference}}</p><p>{{customerName}}</p><p>{{totalOutstanding}}</p><p>{{invoiceTable}}</p>';
 const replacement=controller.session(1),previous=state.templates[0];await replacement.upload({name:'validated.docx',html});replacement.save();assert.equal(api.getState().strategies[0].stages[0].templateId,previous.id);assert.equal(api.getState().templates.find(t=>t.id===previous.id).sourceFileName,'validated.docx');
 const before=JSON.stringify(api.getState());await assert.rejects(replacement.upload({name:'missing.docx',html:'<p>{{customerName}}</p>'}),/Missing required/);assert.throws(()=>replacement.save(),/valid Word/);assert.equal(JSON.stringify(api.getState()),before);
 assert.throws(()=>api.saveTemplate(previous,{role:'agent',userId:'demo-agent',clientId:'demo-client'}),/permission/);assert.equal(JSON.stringify(api.getState()),before);
 await additionalLetterFlow();legacyCatalogAdditionalFlow();
 console.log('Passed: actual standard Word, explicit strategy, exact DL1-3 catalog migration, new-tab edits used on send, old catalog override blocked, DL2 prior dates/references, issued immutability, validated custom upload and role guards; DL4/5 use live managed or saved DL3 emails while keeping their own Word, stage, merge values and immutable history.');
})().catch(error=>{console.error(error);process.exitCode=1;});
