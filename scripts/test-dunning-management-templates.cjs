'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const {createInstance}=require('./dunning-core.js');
const adapter=require('./dunning-template-adapter.js');
const {createController}=require('./dunning-management-templates.js');
global.mammoth=require('./vendor/mammoth.browser.min.js');
global.jspdf=require('./vendor/jspdf.umd.min.js');
require('./dunning-documents.js');
const docs=global.IneburaDunningDocuments;
const ctx={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('./template-master-data.js'),'utf8'),ctx);
const source=JSON.parse(JSON.stringify(ctx.window.IneburaTemplateMasterSource));
const bytes=fs.readFileSync(require.resolve('../assets/dunning/standard-dunning-letter.docx'));
const file={name:'standard-dunning-letter.docx',size:bytes.length,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};
const actualStandard=()=>docs.importDocx(file).then(result=>({...result,sourceFileName:file.name}));
const word=stage=>`<p>{{customerName}} {{letterDate}} {{letterReference}}</p><p>{{invoiceTable}} {{totalOutstanding}}</p>${stage>1?'<p>{{previousLetters}}</p>':''}`;
const deferred=()=>{let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};};
function fixture({count=3,storage,documents={}}={}){
 const actor={role:'client-admin',clientId:'demo-client',userId:'qa-admin'};
 const data=new Map();const store=storage||{getItem:k=>data.get(k)||null,setItem:(k,v)=>data.set(k,v)};
 const api=createInstance({storage:store,context:()=>actor});api.saveConfiguration({enabled:true,letterCount:count});
 const documentApi={...docs,loadStandardTemplate:actualStandard,...documents};
 const controller=createController({api,documents:documentApi,adapter,source,storage:store,canManage:()=>actor.role==='client-admin'});
 return {actor,api,controller,store};
}
test('one letter uses actual standard DOCX and no strategy is automatically created',async()=>{
 const {api,controller,store}=fixture({count:1});await controller.provision();
 const state=api.getState();assert.equal(state.templates.length,1);assert.equal(state.strategies.length,0);
 const row=state.templates[0];assert.equal(row.standardReady,true);assert.equal(row.sourceType,'standard');
 assert.match(row.letterHtml,/Service Restricted Due to Non-Payment/);assert.equal(adapter.validateUpload(row.letterHtml,1).valid,true);
 assert.equal(row.emailTemplateSource.body,source.templates.find(item=>adapter.stageFor(item)===1).body);
 const restored=createInstance({storage:store,context:{role:'client-admin'}}).getState();assert.deepEqual(restored.templates,state.templates);
 const rendered=docs.renderLetter(docs.sampleSnapshot(row,1));assert.doesNotMatch(rendered,/Invoice annexure|Total amount due|18,000/);
});
test('five configured stages retain DL1 to DL3 email sources and reuse DL3 for later stages',async()=>{
 const {api,controller}=fixture({count:5});await controller.provision();
 for(const row of api.getState().templates){assert.equal(row.standardReady,true);assert.equal(adapter.validateUpload(row.body,row.stageNumber).valid,true);const original=source.templates.find(item=>adapter.stageFor(item)===Math.min(row.stageNumber,3));assert.equal(row.emailTemplateSource.subject,original.subject);assert.equal(row.emailTemplateSource.body,original.body);assert.equal(row.emailTemplateSource.id,original.id);assert.equal(row.id,`dunning-template-${row.stageNumber}`);}
});
test('additional letters share current DL3 email while keeping independent Word templates',async()=>{
 const app=fixture({count:5,documents:{importDocx:async f=>({html:f.html,messages:[]})}});await app.controller.provision();
 const fourth=app.controller.session(4),fifth=app.controller.session(5),before=app.api.getState();
 assert.equal(fourth.draft.sharedEmail,true);assert.equal(fifth.draft.sharedEmail,true);assert.equal(app.controller.session(3).draft.sharedEmail,false);
 assert.throws(()=>fourth.setEmail({subject:'Independent DL4'}),/use the DL3 email/);
 const third=app.controller.session(3);third.setEmail({subject:'Updated shared final reminder',body:'<p>Dear {{customerName}}, please see {{letterReference}}.</p>'});third.save();
 for(const session of [fourth,fifth]){assert.equal(session.draft.email.subject,'Updated shared final reminder');assert.equal(session.draft.email.body,'<p>Dear {{customerName}}, please see {{letterReference}}.</p>');}
 await fourth.upload({name:'custom-letter-4.docx',html:word(4)+'<p>Fourth letter wording</p>'});const saved=fourth.save();
 assert.equal(saved.stageNumber,4);assert.equal(saved.id,'dunning-template-4');assert.equal(saved.sourceFileName,'custom-letter-4.docx');assert.match(saved.letterHtml,/Fourth letter wording/);assert.equal(saved.emailSourceStage,3);assert.equal(saved.emailTemplateSource.subject,'Updated shared final reminder');
 assert.equal(app.api.getState().templates.find(t=>t.stageNumber===5).letterHtml,before.templates.find(t=>t.stageNumber===5).letterHtml);
 assert.deepEqual(app.api.getState().emails,before.emails);assert.deepEqual(app.api.getState().batches,before.batches);
});
test('additional letters replace legacy generic email defaults with saved DL3 wording',async()=>{
 const app=fixture({count:5}),third=source.templates.find(item=>adapter.stageFor(item)===3);
 app.store.setItem('ineburaTemplateMaster:xeon:20261015:v1',JSON.stringify({templates:[{...third,subject:'Saved DL3 subject',body:'<p>Saved DL3 message for {{customerName}}</p>'}]}));
 await app.controller.provision();
 for(const stage of [4,5]){const draft=app.controller.session(stage).draft;assert.equal(draft.email.subject,'Saved DL3 subject');assert.equal(draft.email.body,'<p>Saved DL3 message for {{customerName}}</p>');}
});
test('saved communication email edits migrate exactly while existing custom Word remains intact',async()=>{
 const {api,controller,store}=fixture();const original=source.templates.find(item=>adapter.stageFor(item)===1);
 store.setItem('ineburaTemplateMaster:xeon:20261015:v1',JSON.stringify({templates:[{...original,subject:'Saved client subject',body:'<p>Client message {{customerName}}</p>'}]}));
 const custom={...api.getState().templates[1],sourceType:'upload',standardReady:false,sourceFileName:'approved.docx',body:word(2),letterHtml:word(2)};api.saveTemplate(custom);
 await controller.provision();const saved=api.getState().templates;
 assert.equal(saved[0].emailTemplateSource.subject,'Saved client subject');assert.equal(saved[0].emailTemplateSource.body,'<p>Client message {{customerName}}</p>');
 assert.equal(saved[1].sourceFileName,'approved.docx');assert.equal(saved[1].letterHtml,word(2));
});
test('missing and unsupported uploaded values block saving without mutating the saved template',async()=>{
 const app=fixture({documents:{importDocx:async f=>({html:f.html,messages:[]})}});await app.controller.provision();const session=app.controller.session(2),before=JSON.stringify(app.api.getState());
 await assert.rejects(session.upload({name:'bad.docx',html:word(1)}),/Previous letter reference/);assert.throws(()=>session.save(),/valid Word/);
 await assert.rejects(session.upload({name:'unknown.docx',html:word(2)+'<p>{{notSupported}}</p>'}),/Unsupported values/);
 assert.equal(JSON.stringify(app.api.getState()),before);
});
test('validated custom Word and email changes save to the original template ID and persist',async()=>{
 const app=fixture({documents:{importDocx:async f=>({html:f.html,messages:[]})}});await app.controller.provision();const session=app.controller.session(1),before=app.api.getState();
 await session.upload({name:'client-letter.docx',html:word(1)});assert.deepEqual(app.api.getState(),before,'validation is read-only');
 session.setEmail({subject:'Please pay {{customerName}}',body:'<p>Dear {{customerName}}, please review the attachment.</p>'});const result=session.save();
 assert.equal(result.id,'dunning-template-1');assert.equal(result.documentTypeId,'dunning-document-1');assert.equal(result.sourceType,'upload');assert.equal(result.sourceFileName,'client-letter.docx');assert.equal(result.emailTemplateSource.subject,'Please pay {{customerName}}');assert.equal(app.api.getState().templates.length,3);
 const reopened=app.controller.session(1);assert.equal(reopened.draft.selection,'docx');assert.equal(reopened.draft.letter.html,word(1));
 await reopened.useStandard();const restored=reopened.save();assert.equal(restored.sourceType,'standard');assert.equal(restored.standardReady,true);assert.match(restored.body,/Service Restricted/);
});
test('only current Client Admin role can manage templates including after an asynchronous load',async()=>{
 const pending=deferred(),app=fixture({documents:{loadStandardTemplate:()=>pending.promise}});const initial=JSON.stringify(app.api.getState());const task=app.controller.provision();app.actor.role='supervisor';pending.resolve(await actualStandard());await assert.rejects(task,/Only Client Admin/);assert.equal(JSON.stringify(app.api.getState()),initial);
 for(const role of ['agent','supervisor','mis-user','licensee']){app.actor.role=role;assert.equal(app.controller.allowed(),false);assert.throws(()=>app.controller.session(1),/Only Client Admin/);await assert.rejects(app.controller.provision(),/Only Client Admin/);}
 app.actor.role='client-admin';await app.controller.provision();const session=app.controller.session(1);app.actor.role='agent';assert.throws(()=>session.save(),/Only Client Admin/);
});
test('letter count reduction blocks an open removed-stage draft and late upload',async()=>{
 const pending=deferred(),app=fixture({count:5,documents:{importDocx:()=>pending.promise}});await app.controller.provision();const session=app.controller.session(5),task=session.upload({name:'late.docx'});
 app.api.setLetterCount(1);const before=JSON.stringify(app.api.getState());pending.resolve({html:word(5),messages:[]});await assert.rejects(task,/above the configured letter count/);assert.throws(()=>session.save(),/above the configured letter count/);assert.equal(JSON.stringify(app.api.getState()),before);assert.equal(app.controller.rows().length,1);
});
test('latest upload wins and closing a draft discards pending import results',async()=>{
 const first=deferred(),last=deferred(),app=fixture({documents:{importDocx:f=>f.name==='old.docx'?first.promise:last.promise}});await app.controller.provision();const session=app.controller.session(1),before=JSON.stringify(app.api.getState());
 const old=session.upload({name:'old.docx'}),latest=session.upload({name:'new.docx'});last.resolve({html:word(1),messages:[]});await latest;first.reject(new Error('Stale failure'));assert.equal(await old,false);assert.equal(session.draft.letter.sourceFileName,'new.docx');assert.equal(session.draft.invalid,false);
 const pending=deferred(),other=fixture({documents:{importDocx:()=>pending.promise}});await other.controller.provision();const closed=other.controller.session(1),task=closed.upload({name:'closed.docx'});closed.dispose();pending.resolve({html:word(1),messages:[]});assert.equal(await task,false);assert.throws(()=>closed.save(),/closed/);assert.equal(JSON.stringify(app.api.getState()),before);
});
test('choosing custom upload requires a newly validated file and a failed standard fetch saves nothing',async()=>{
 const app=fixture();await app.controller.provision();const session=app.controller.session(1);session.selectUpload();assert.throws(()=>session.save(),/valid Word/);
 const broken=fixture({documents:{loadStandardTemplate:async()=>{throw new Error('Word file unavailable');}}}),before=JSON.stringify(broken.api.getState());await assert.rejects(broken.controller.provision(),/Word file unavailable/);assert.equal(JSON.stringify(broken.api.getState()),before);
});

test('only exact untouched legacy generated defaults migrate to the real Word including DL4',async()=>{
 const app=fixture({count:5}),legacy=app.api.getState();
 for(const row of legacy.templates)for(const key of ['sourceType','sourceFileName','standardReady','uploadValidation','managedIn'])delete row[key];
 const generated=JSON.parse(JSON.stringify(legacy.templates));
 legacy.templates[0].sourceFileName='sample-dunning-letter.docx';
 legacy.templates[2].body+='<p>Client edited wording</p>';legacy.templates[2].letterHtml=legacy.templates[2].body;
 legacy.templates[4].id='client-custom-letter-5';
 legacy.emails=[{id:'previous-issue',stage:2,letterSnapshot:{template:JSON.parse(JSON.stringify(generated[1])),pdfDataUri:'retained-pdf'}}];
 legacy.batches=[{id:'previous-batch',stage:2,templateId:'dunning-template-2',invoiceIds:['dunning-invoice-1-1']}];
 app.store.setItem(app.api.KEY,JSON.stringify(legacy));
 const api=createInstance({storage:app.store,context:()=>app.actor});
 const controller=createController({api,documents:{...docs,loadStandardTemplate:actualStandard},adapter,source,storage:app.store});
 assert.deepEqual(controller.pendingDefaults().map(row=>row.stageNumber),[2,4]);await controller.provision();
 const after=api.getState();
 for(const stage of [2,4]){const row=after.templates[stage-1];assert.equal(row.sourceType,'standard');assert.equal(row.standardReady,true);assert.match(row.body,/Service Restricted Due to Non-Payment/);assert.equal(row.id,generated[stage-1].id);assert.equal(row.documentTypeId,generated[stage-1].documentTypeId);}
 assert.equal(after.templates[0].sourceFileName,'sample-dunning-letter.docx');assert.equal(after.templates[0].body,legacy.templates[0].body);
 assert.equal(after.templates[2].body,legacy.templates[2].body);assert.equal(after.templates[2].sourceType,undefined);
 assert.equal(after.templates[4].body,legacy.templates[4].body);assert.equal(after.templates[4].sourceType,undefined);
 assert.deepEqual(after.emails,legacy.emails);assert.deepEqual(after.batches,legacy.batches);assert.deepEqual(after.strategies,legacy.strategies);
 assert.equal(after.templates[1].emailTemplateSource.body,source.templates.find(row=>adapter.stageFor(row)===2).body);
 assert.equal(controller.pendingDefaults().length,0);
});

test('a custom file saved while the legacy default is loading is never replaced',async()=>{
 const app=fixture({count:1}),legacy=app.api.getState(),pending=deferred();
 for(const key of ['sourceType','sourceFileName','standardReady'])delete legacy.templates[0][key];app.store.setItem(app.api.KEY,JSON.stringify(legacy));
 const api=createInstance({storage:app.store,context:()=>app.actor}),controller=createController({api,documents:{...docs,loadStandardTemplate:()=>pending.promise},adapter,source,storage:app.store});
 const task=controller.provision();api.saveTemplate({...api.getState().templates[0],sourceType:'upload',sourceFileName:'new-client.docx',body:word(1),letterHtml:word(1)});const saved=JSON.stringify(api.getState());pending.resolve(await actualStandard());await task;assert.equal(JSON.stringify(api.getState()),saved);
});

test('validated custom uploads render as validated with Preview enabled even when standardReady is false',async()=>{
 const app=fixture({count:1,documents:{importDocx:async file=>({html:file.html,messages:[]})}});await app.controller.provision();
 const session=app.controller.session(1);await session.upload({name:'client-approved.docx',html:word(1)});const saved=session.save();
 assert.equal(saved.sourceType,'upload');assert.equal(saved.standardReady,false);assert.equal(saved.uploadValidation.valid,true);
 const window={IneburaDunningDocuments:docs,IneburaDunningTemplateAdapter:adapter,IneburaTemplateMasterSource:source,localStorage:app.store};
 vm.runInNewContext(fs.readFileSync(require.resolve('./dunning-management-templates.js'),'utf8'),{window});
 const container={innerHTML:'',addEventListener(){},removeEventListener(){}};
 const view=window.IneburaDunningManagementTemplates.mount(container,{api:app.api,canManage:()=>true});await view.ready;
 assert.match(container.innerHTML,/client-approved\.docx/);assert.match(container.innerHTML,/<td>Validated<\/td>/);
 assert.doesNotMatch(container.innerHTML,/Standard template is loading|Loading the standard Word template/);
 const preview=container.innerHTML.match(/<button[^>]*data-dm-template-preview="1"[^>]*>/)?.[0];assert.ok(preview);assert.doesNotMatch(preview,/\bdisabled\b/);view.destroy();
});

test('only a pending standard Word row renders loading and disables its Preview',()=>{
 const pending=deferred(),app=fixture({count:1});
 const window={IneburaDunningDocuments:{...docs,loadStandardTemplate:()=>pending.promise},IneburaDunningTemplateAdapter:adapter,IneburaTemplateMasterSource:source,localStorage:app.store};
 vm.runInNewContext(fs.readFileSync(require.resolve('./dunning-management-templates.js'),'utf8'),{window});
 const container={innerHTML:'',addEventListener(){},removeEventListener(){}};
 const view=window.IneburaDunningManagementTemplates.mount(container,{api:app.api,canManage:()=>true});
 assert.match(container.innerHTML,/Standard template is loading/);
 const preview=container.innerHTML.match(/<button[^>]*data-dm-template-preview="1"[^>]*>/)?.[0];assert.ok(preview);assert.match(preview,/\bdisabled\b/);view.destroy();pending.reject(new Error('Closed view'));
});
