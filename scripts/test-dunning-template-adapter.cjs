'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const adapter=require('./dunning-template-adapter.js');
const sandbox={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(__dirname,'template-master-data.js'),'utf8'),sandbox);
const source=JSON.parse(JSON.stringify(sandbox.window.IneburaTemplateMasterSource));
const emails=adapter.catalogRows(source);
const letter=stage=>`<p>{{letterDate}}</p><p>{{letterReference}}</p><p>Dear {{customerName}}</p><p>{{totalOutstanding}}</p><p>{{invoiceTable}}</p>${stage>1?'<p>{{previousLetters}}</p>':''}`;
const snapshot={date:'2026-10-27',reference:'DL3-027',stageNumber:3,customer:{name:'Actual & Customer',customerCode:'00042',address:'Delhi',contacts:[{name:'Accounts',email:'accounts@example.test',phone:'123'}]},clientName:'Actual Client',clientLogo:'../assets/client.png',subdomain:'tenant',token:'customer/token',previousReferences:['DL1-020','DL2-024'],previousLetterDates:['2026-10-20','2026-10-24'],invoices:[{invoiceNo:'INV-0001',invoiceDate:'2026-09-01',dueDate:'2026-10-05',originalAmount:10000,outstanding:3500,saleOrderNo:'SO-1',poNumber:'PO-1',description:'Parts'},{invoiceNo:'INV-0002',invoiceDate:'2026-09-02',dueDate:'2026-10-06',originalAmount:20000,outstanding:4500}]};

test('immutable catalogue identities select the same three existing email templates',()=>{
  assert.deepEqual(emails.map(row=>[row.id,row.stageNumber]),[['xeon-template-46',1],['xeon-template-47',2],['xeon-template-48',3]]);
  assert.equal(adapter.stageFor({...emails[0],code:'renamed',eventType:'changed'},source.templates),1);
  assert.equal(adapter.stageFor({id:'xeon-template-49',code:'DunningLetterOneEmail',eventType:'DunningLetterOne',communicationMode:'Email'},source.templates),null);
  assert.equal(adapter.stageFor(source.templates.find(row=>row.code==='DunningLetterEmail'),source.templates),null);
  const fourth={id:'future-template-4',code:'DunningLetter4Email',eventType:'DunningLetter4',communicationMode:'Email'};
  assert.equal(adapter.stageFor(fourth,[fourth]),4);assert.equal(adapter.stageFor({...fourth,id:'unrelated'},source.templates),null);
  const before=JSON.stringify(source);adapter.catalogRows(source);assert.equal(JSON.stringify(source),before);
});

test('uploaded letters require every stage-specific captured value',()=>{
  for(let stage=1;stage<=4;stage++) {
    const check=adapter.validateUpload(letter(stage),stage);assert.equal(check.valid,true,check.errors.join(' '));
    assert.equal(check.fields.length,stage===1?5:6);
    for(const field of adapter.requiredFields(stage)) {
      const missing=adapter.validateUpload(letter(stage).replace(field.marker,''),stage);
      assert.equal(missing.valid,false);assert.ok(missing.missing.includes(field.label));
    }
  }
  assert.equal(adapter.validateUpload(letter(1),2).missing.includes('Previous letter reference(s)'),true);
});

test('automatic aliases resolve to approved sources without exposing field mapping',()=>{
  const input='<p>${userCustomer.customerName}</p><p>{{reference}}</p><p>${aDate?string("dd-MMM-yyyy")}</p><p>{{items}}</p><p>{{balance}}</p>';
  const result=adapter.validateUpload(input,1,{items:'invoices',balance:'totalOutstanding'});
  assert.equal(result.valid,true,result.errors.join(' '));
  assert.match(result.html,/\{\{customerName\}\}/);assert.match(result.html,/\{\{invoiceTable\}\}/);assert.match(result.html,/\{\{totalOutstanding\}\}/);
  assert.doesNotMatch(result.html,/\$\{|\{\{items\}\}|\{\{balance\}\}/);
  assert.equal(adapter.validateUpload({...{html:letter(2),stageNumber:2}}).valid,true);
  const inline=adapter.validateUpload(letter(1).replace('{{customerName}}','{{customer<span>Name</span>}}'),1);
  assert.equal(inline.valid,true);assert.match(inline.html,/\{\{customerName\}\}/);
});

test('unsupported and malformed upload values fail visibly instead of remaining unresolved',()=>{
  for(const marker of ['{{unknownValue}}','${unknown.value}','{{bad-name}}','{{customerName','${customerName','{{nested{{name}}}}']) {
    const result=adapter.validateUpload(letter(1)+`<p>${marker}</p>`,1);
    assert.equal(result.valid,false,marker);assert.ok(result.errors.length);
  }
  assert.match(adapter.validateUpload(letter(1)+'<script>alert(1)</script>',1).errors.join(' '),/active content/);
  assert.match(adapter.validateUpload(letter(1)+'<#assign anything = 1>',1).errors.join(' '),/FreeMarker instructions/);
  assert.equal(adapter.validateUpload(letter(1).replace('{{customerName}}','{{alias}}'),1,{alias:'customer.creditCard'}).valid,false);
});

test('every captured email source validates and renders its existing full message without FreeMarker',()=>{
  for(const row of emails) {
    const check=adapter.validateEmail(row.subject,row.body);assert.equal(check.valid,true,`${row.code}: ${check.errors.join(' ')}`);
    const before=JSON.stringify(row),result=adapter.renderEmail({emailTemplateSource:row},snapshot);
    assert.equal(result.subject,row.subject);assert.equal(JSON.stringify(row),before);
    assert.doesNotMatch(result.body,/\$\{|\{\{|<\/?#/);
    assert.match(result.body,/Actual &amp; Customer/);assert.match(result.body,/CustomerCode:\s*00042/);
    assert.match(result.body,/DL3-027/);assert.match(result.body,/27-Oct-2026/);
    assert.match(result.body,/INV-0001/);assert.match(result.body,/INV-0002/);
    assert.match(result.body,/3,500\.00/);assert.match(result.body,/20,000\.00/);
    assert.match(result.body,/Parts/);assert.match(result.body,/accounts@example\.test/);
    if(row.body.includes('${userClient}')) assert.match(result.body,/Actual Client/);
    if(row.body.includes('Click Here')) {
      assert.match(result.body,/https:\/\/tenant\.inebura\.ai\/intg\/customer-link\/customer%2Ftoken/);
      assert.match(result.body,/Click Here/);
    } else {
      assert.match(row.body,/text-decoration: none; bor$/,'the pre-existing truncated capture is retained');
      assert.doesNotMatch(result.body,/text-decoration: none; bor$/,'only the incomplete trailing tag is omitted at render time');
    }
    assert.match(result.body,/Sale Order No/);
    if(row.stageNumber>1) {assert.match(result.body,/DL1-020/);assert.match(result.body,/20-Oct-2026/);}
    if(row.stageNumber>2) {assert.match(result.body,/DL2-024/);assert.match(result.body,/24-Oct-2026/);}
  }
});

test('unsupported email expressions and broken invoice loops block saving',()=>{
  const row=emails[0];
  for(const addition of ['${arbitrary()}', '${user.password}', '<#include "other.ftl">','${unterminated','{{unknown}}','<#list listOfInvoices as invoiceList>']) {
    const check=adapter.validateEmail(row.subject,row.body+addition);assert.equal(check.valid,false,addition);
    assert.throws(()=>adapter.renderEmail({emailTemplateSource:{...row,body:row.body+addition}},snapshot),/Unsupported|incomplete/);
  }
  assert.equal(adapter.validateEmail(row.subject,row.body+'${invoiceList.invoiceNo}').valid,false);
  assert.equal(adapter.validateEmail(row.subject,row.body+'<script>evil()</script>').valid,false);
});

test('runtime values remain escaped and are never reinterpreted as another template expression',()=>{
  const hostile=JSON.parse(JSON.stringify(snapshot));hostile.customer.name='<img onerror=evil> ${token}';hostile.invoices[0].description='${userClient}<script>evil</script>';hostile.clientName='{{customerName}}';
  const result=adapter.renderEmail({emailTemplateSource:emails[0]},hostile);
  assert.match(result.body,/&lt;img onerror=evil&gt; \$\{token\}/);
  assert.match(result.body,/\$\{userClient\}&lt;script&gt;evil&lt;\/script&gt;/);
  assert.doesNotMatch(result.body,/<img onerror|<script>/);
  assert.match(result.body,/\{\{customerName\}\}/,'a value containing a marker must remain literal data');
});

test('build preserves strategy-linked IDs and exact email source; only a new upload has strict marker validation',()=>{
  const old={id:'dunning-template-2',documentTypeId:'custom-document-id',stageNumber:2,name:'Custom display name',body:'<p>Legacy working letter {{customerName}}</p>',letterHtml:'<p>Legacy working letter {{customerName}}</p>',sourceFileName:'prior.docx',mappings:{customerName:'customer.name'}};
  const state={documentTypes:[{id:'custom-document-id',stageNumber:2}],templates:[old]};
  const before=JSON.stringify(state),emailOnly=adapter.buildTemplate(state,emails[1],{subject:'Updated subject'});
  assert.equal(emailOnly.id,old.id);assert.equal(emailOnly.documentTypeId,old.documentTypeId);assert.equal(emailOnly.stageNumber,old.stageNumber);assert.equal(emailOnly.name,old.name);
  assert.equal(emailOnly.body,old.body);assert.equal(emailOnly.sourceFileName,'prior.docx');assert.equal(emailOnly.emailTemplateSource.subject,'Updated subject');assert.equal(emailOnly.emailTemplateSource.body,emails[1].body);
  const uploaded=adapter.buildTemplate(state,emails[1],{letterHtml:letter(2),sourceFileName:'replacement.docx'});
  assert.equal(uploaded.sourceFileName,'replacement.docx');assert.equal(uploaded.sourceType,'docx');assert.equal(uploaded.uploadValidation.valid,true);
  assert.equal(uploaded.emailTemplateSource.id,'xeon-template-47');assert.doesNotMatch(uploaded.emailBody,/\$\{|<\/?#/);
  assert.deepEqual(uploaded.fieldMappings,adapter.defaultMappings);assert.equal(JSON.stringify(state),before);
  assert.throws(()=>adapter.buildTemplate(state,emails[1],{letterHtml:letter(1)}),/Previous letter reference/);
  assert.throws(()=>adapter.buildTemplate(state,emails[1],{body:'${unknown}'}),/Unsupported email/);
});

test('built template passes actual core saving without changing configured strategy references',()=>{
  const core=require('./dunning-core.js').createInstance({context:{role:'client-admin',clientId:'demo-client'}});core.setEnabled(true);
  core.saveStrategy({id:'qa-strategy',name:'Configured by Client Admin',clientId:'demo-client',status:'draft',firstStageDays:15,stages:core.getState().templates.map((template,index)=>({templateId:template.id,intervalDays:index?7:0}))});
  const before=core.getState().strategies[0].stages.map(stage=>stage.templateId);
  for(const row of emails) core.saveTemplate(adapter.buildTemplate(core,row,{letterHtml:letter(row.stageNumber),sourceFileName:`DL${row.stageNumber}.docx`}));
  const state=core.getState();assert.deepEqual(state.strategies[0].stages.map(stage=>stage.templateId),before);
  assert.equal(state.templates.length,3);assert.equal(state.templates[2].emailTemplateSource.code,'DunningLetterThreeEmail');
});

test('known canonical aliases in email source normalize before actual core validation',()=>{
  const core=require('./dunning-core.js').createInstance({context:{role:'client-admin',clientId:'demo-client'}});core.setEnabled(true);
  const row={...emails[0],subject:'Reference {{reference}}',body:'<p>Dear {{customer.name}}</p><p>{{outstandingAmount}}</p>{{invoices}}'};
  const prepared=adapter.buildTemplate(core,row,{letterHtml:letter(1),sourceFileName:'approved.docx'});
  assert.equal(prepared.emailSubject,'Reference {{letterReference}}');assert.match(prepared.emailBody,/\{\{customerName\}\}/);assert.match(prepared.emailBody,/\{\{totalOutstanding\}\}/);assert.match(prepared.emailBody,/\{\{invoiceTable\}\}/);
  assert.equal(prepared.emailTemplateSource.body,row.body);assert.doesNotThrow(()=>core.saveTemplate(prepared));
  const result=adapter.renderEmail(prepared,snapshot);assert.match(result.subject,/DL3-027/);assert.match(result.body,/Actual &amp; Customer/);assert.match(result.body,/INV-0001/);assert.doesNotMatch(result.body,/\{\{/);
});

test('additional stages resolve the live DL3 email without changing their own Word template or saved state',()=>{
  const third={id:'dunning-template-3',stageNumber:3,managedIn:'dunning-management',emailTemplateSource:{id:'owned-third',subject:'Current DL3 {{letterReference}}',body:'<p>Dear {{customerName}}, current third email.</p>'}};
  const fourth={id:'dunning-template-4',stageNumber:4,documentTypeId:'dunning-document-4',name:'Fourth custom Word',body:letter(4),letterHtml:letter(4),sourceFileName:'fourth.docx',emailTemplateSource:{id:'old-fourth',subject:'Stale DL4',body:'Stale DL4 body'},managedIn:'dunning-management'};
  const data={templates:[third,fourth]},before=JSON.stringify(data);
  const resolved=adapter.resolveEmailTemplate(data,fourth,{sourceTemplates:source,stageNumber:4});
  for(const key of ['id','stageNumber','documentTypeId','name','body','letterHtml','sourceFileName'])assert.equal(resolved[key],fourth[key]);
  assert.deepEqual(resolved.emailTemplateSource,third.emailTemplateSource);assert.equal(resolved.emailSourceStage,3);
  const rendered=adapter.renderEmail(resolved,{...snapshot,stageNumber:4,reference:'DL4-ACTUAL'});
  assert.equal(rendered.subject,'Current DL3 DL4-ACTUAL');assert.match(rendered.body,/Actual &amp; Customer/);
  assert.equal(JSON.stringify(data),before,'resolving unsent emails must never mutate templates or sent snapshots');
  third.emailTemplateSource.subject='Latest third';
  assert.equal(adapter.resolveEmailTemplate(data,fourth).emailTemplateSource.subject,'Latest third');
});

test('DL4+ prefer the strategy-selected DL3, then saved or captured DL3 catalog sources',()=>{
  const third={id:'dunning-template-3',stageNumber:3,emailTemplateSource:{id:'captured-third',subject:'Captured third',body:'Captured third body'}};
  const alternate={...third,id:'alternate-third',managedIn:'dunning-management',emailTemplateSource:{id:'alternate-owned',subject:'Strategy third',body:'Strategy third body'}};
  const fifth={id:'dunning-template-5',stageNumber:5,emailSubject:'Old fifth',emailBody:'Old fifth body'};
  const data={templates:[third,alternate,fifth]};
  assert.equal(adapter.resolveEmailTemplate(data,fifth,{stage3TemplateId:third.id}).emailTemplateSource.subject,'Captured third');
  assert.equal(adapter.resolveEmailTemplate(data,fifth,{stage3TemplateId:alternate.id,sourceTemplates:source}).emailTemplateSource.subject,'Strategy third');
  const legacy={templates:[third,fifth]},savedRows={templates:[{id:emails[2].id,subject:'Saved catalog DL3',body:'<p>Saved {{customerName}}</p>'},{id:'unrelated',subject:'Never selected'}]};
  const saved=adapter.resolveEmailTemplate(legacy,fifth,{sourceTemplates:source,savedRows});
  assert.equal(saved.emailTemplateSource.subject,'Saved catalog DL3');assert.equal(saved.emailTemplateSource.id,emails[2].id);
  assert.equal(adapter.resolveEmailTemplate(legacy,fifth,{sourceTemplates:source}).emailTemplateSource.body,emails[2].body);
  assert.equal(adapter.resolveEmailTemplate(legacy,fifth).emailTemplateSource.subject,'Captured third');
  assert.throws(()=>adapter.resolveEmailTemplate({templates:[fifth]},fifth),/DL3 email template is unavailable/);
  const sharedFourth={id:'dunning-template-4',documentTypeId:'fourth-word',stageNumber:4,emailTemplateSource:emails[2],body:letter(4)};
  const ownThird={id:'dunning-template-3',documentTypeId:'third-word',stageNumber:3,emailTemplateSource:emails[2],body:letter(3)};
  const built=adapter.buildTemplate({templates:[sharedFourth,ownThird],documentTypes:[]},emails[2]);
  assert.equal(built.id,ownThird.id,'a shared DL3 source on DL4 cannot redirect a DL3 template edit');assert.equal(built.stageNumber,3);
});
