/* Dunning Word and email templates, managed only from Module Configuration. */
(function(root,factory){
  'use strict';
  const moduleApi=factory(root);
  if(typeof module==='object'&&module.exports)module.exports=moduleApi;
  else root.IneburaDunningManagementTemplates=moduleApi;
})(typeof window!=='undefined'?window:globalThis,function(root){
  'use strict';
  const clone=value=>JSON.parse(JSON.stringify(value));
  const escape=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const key='ineburaTemplateMaster:xeon:20261015:v1';
  function isUntouchedLegacyDefault(row){
    const stage=Number(row.stageNumber);
    if(!Number.isSafeInteger(stage)||stage<1||row.id!==`dunning-template-${stage}`||row.documentTypeId!==`dunning-document-${stage}`||row.sourceType||row.sourceFileName||row.uploadValidation||row.managedIn)return false;
    const original=`<p>Date: {{letterDate}}</p><p>Reference: {{letterReference}}</p><h2>Dunning Letter ${stage}</h2><p>Dear {{customerName}},</p><p>${stage===1?'Our records show the following invoices remain unpaid. Please arrange payment of the outstanding balance.':'We refer to our earlier letter(s): {{previousLetters}}. The following balance remains unpaid. Please arrange payment promptly.'}</p><p>Total outstanding: {{totalOutstanding}}</p><p>Yours sincerely,<br>Accounts Receivable</p>`;
    return row.body===original&&(row.letterHtml===undefined||row.letterHtml===original);
  }
  const needsStandard=row=>row.sourceType==='standard'&&row.standardReady===false||isUntouchedLegacyDefault(row);
  function createController({api,documents,adapter,source,storage,canManage}){
    const allowed=()=>api.getContext().role==='client-admin'&&(!canManage||canManage());
    const guard=()=>{if(!allowed())throw new Error('Only Client Admin can manage Dunning Letter templates.');};
    const count=()=>Math.max(1,Number(api.getState().letterCount)||3);
    const rows=()=>api.getState().templates.filter(row=>Number(row.stageNumber)>0&&Number(row.stageNumber)<=count()).sort((a,b)=>a.stageNumber-b.stageNumber);
    const current=stage=>{guard();const state=api.getState();if(!state.enabled)throw new Error('Enable Dunning Letters in Configurations before managing templates.');if(stage<1||stage>count())throw new Error('This letter is above the configured letter count.');const row=rows().find(item=>Number(item.stageNumber)===Number(stage));if(!row)throw new Error('The Dunning Letter template is not available.');return row;};
    function emailFor(row,state){
      guard();state=state||api.getState();
      if(Number(row.stageNumber)>3){
        let savedRows=[];try{savedRows=JSON.parse(storage?.getItem(key)||'null')?.templates||[];}catch(_){/* Use the current saved DL3 or captured source. */}
        const effective=adapter.resolveEmailTemplate(state,row,{sourceTemplates:source,savedRows});
        return clone(effective.emailTemplateSource||{subject:effective.emailSubject,body:effective.emailBody});
      }
      if(row.emailTemplateSource)return clone(row.emailTemplateSource);
      const original=(source?.templates||source||[]).find(item=>adapter.stageFor(item)===Number(row.stageNumber));
      if(original){
        let saved;try{saved=JSON.parse(storage?.getItem(key)||'null')?.templates?.find(item=>item.id===original.id);}catch(_){/* Preserve the captured source if the old catalog cannot be read. */}
        return {...clone(original),subject:saved?.subject??original.subject,body:saved?.body??original.body};
      }
      return {id:`dunning-email-${row.stageNumber}`,code:`DunningLetter${row.stageNumber}Email`,eventType:`DunningLetter${row.stageNumber}`,subject:row.emailSubject||`Payment reminder — DL${row.stageNumber} — {{customerName}}`,body:row.emailBody||'<p>Dear {{customerName}},</p><p>Please find your Dunning Letter and invoice annexure attached.</p>'};
    }
    function prepare(row,letter,email,sourceType){
      guard();const upload=adapter.validateUpload(letter.html,row.stageNumber,row.fieldMappings||row.mappings);
      if(!upload.valid)throw new Error(upload.errors.join(' '));
      if(Number(row.stageNumber)>3)email=emailFor(row);
      const check=adapter.validateEmail(email.subject,email.body);if(!check.valid)throw new Error(check.errors.join(' '));
      const result={...clone(row),body:upload.html,letterHtml:upload.html,mappings:upload.mappings,fieldMappings:upload.mappings,calculation:{totalOutstanding:'sumOutstanding'},emailSubject:email.subject,emailBody:email.body,emailTemplateSource:clone(email),emailRenderer:'existing-template-master',managedIn:'dunning-management',sourceType,sourceFileName:letter.sourceFileName||row.sourceFileName,standardReady:sourceType==='standard',uploadValidation:{valid:true,fields:upload.fields,stageNumber:row.stageNumber}};
      if(Number(row.stageNumber)>3)result.emailSourceStage=3;
      documents.validateTemplate(result);return result;
    }
    async function provision(){
      guard();if(!api.getState().enabled)return;
      const pending=rows().filter(needsStandard);if(!pending.length)return;
      const standard=await documents.loadStandardTemplate();guard();
      for(const candidate of pending){
        if(candidate.stageNumber>count())continue;
        const latest=current(candidate.stageNumber);
        // A late fetch must never replace a custom upload or a changed row.
        if(latest.id!==candidate.id||!needsStandard(latest))continue;
        api.saveTemplate(prepare(latest,standard,emailFor(latest),'standard'));
      }
    }
    function session(stage){
      let disposed=false,request=0,busy=false,invalid=false;
      const initial=current(stage);let selection=initial.sourceType==='standard'?'standard':initial.sourceFileName?'docx':'existing';
      let letter={html:initial.letterHtml||initial.body,sourceFileName:initial.sourceFileName||'Previously saved Word template'};
      let email=emailFor(initial);
      const check=()=>{if(disposed)throw new Error('This template editor has been closed.');return current(stage);};
      async function load(task,type){
        check();const version=++request;busy=true;invalid=true;
        try{const next=await task();if(disposed||version!==request)return false;check();const result=adapter.validateUpload(next.html,stage,initial.fieldMappings||initial.mappings);if(!result.valid)throw new Error(result.errors.join(' '));letter={...next,html:result.html};selection=type;invalid=false;return true;}
        catch(error){if(disposed||version!==request)return false;throw error;}
        finally{if(!disposed&&version===request)busy=false;}
      }
      return {
        get draft(){return {stage:Number(stage),selection,letter:clone(letter),email:Number(stage)>3?emailFor(check()):clone(email),sharedEmail:Number(stage)>3,busy,invalid};},
        setEmail(value){check();if(Number(stage)>3)throw new Error('DL4 and later use the DL3 email template. Edit DL3 to change the email.');email={...email,...clone(value)};},
        selectUpload(){check();request++;busy=false;invalid=true;selection='docx';},
        useStandard(){return load(()=>documents.loadStandardTemplate(),'standard');},
        upload(file){return load(async()=>({...await documents.importDocx(file),sourceFileName:file.name}),'docx');},
        prepare(){const latest=check();if(busy)throw new Error('Wait for Word template validation to finish.');if(invalid)throw new Error('Choose a valid Word template before saving.');return prepare(latest,letter,email,selection==='standard'?'standard':'upload');},
        save(){const value=this.prepare();guard();return api.saveTemplate(value);},
        preview(){return documents.preview(documents.sampleSnapshot(this.prepare()));},
        dispose(){disposed=true;request++;}
      };
    }
    return {allowed,guard,rows,session,provision,emailFor,pendingDefaults:()=>rows().filter(needsStandard)};
  }
  function mount(container,{api,notify=()=>{},canManage}={}){
    const documents=root.IneburaDunningDocuments,adapter=root.IneburaDunningTemplateAdapter,editor=root.IneburaTemplateEditor;
    if(!container||!api||!documents||!adapter)return {refresh(){},destroy(){},ready:Promise.resolve()};
    let storage;try{storage=root.localStorage;}catch(_){/* Core persistence will report save errors. */}
    const model=createController({api,documents,adapter,source:root.IneburaTemplateMasterSource,storage,canManage});
    let active=null,disposed=false,loading=false,initializing=null;
    function render(){
      if(disposed||active)return;
      if(!model.allowed()){container.innerHTML='<p class="dmTemplateError" role="alert">Only Client Admin can manage Dunning Letters.</p>';return;}
      const state=api.getState();
      if(!state.enabled){container.innerHTML='<p>Enable Dunning Letters in Configurations to manage templates.</p>';return;}
      container.innerHTML=`<section class="dmTemplates"><p>Choose the standard Word letter or upload your own for each configured stage. The letter and invoice annexure are sent as one PDF.</p><p><a href="${escape(documents.standardTemplateUrl)}" download="standard-dunning-letter.docx">Download standard Word template</a></p><p>Download and edit the Word file to set payment days, payment instructions and sender details, then upload it as your template.</p><p class="dmTemplateStatus" role="status" data-dm-template-status>${loading?'Loading the standard Word template…':''}</p><div class="dmTableWrap"><table class="dmTemplateTable"><thead><tr><th>Letter</th><th>Word template</th><th>Email subject</th><th>Status</th><th>Actions</th></tr></thead><tbody>${model.rows().map(row=>`<tr><td>DL${row.stageNumber}</td><td>${escape(row.sourceType==='standard'?'Standard Word template':row.sourceFileName||'Previously saved template')}</td><td>${escape(model.emailFor(row,state).subject||'')}${Number(row.stageNumber)>3?'<small class="dmSharedEmail">Uses DL3 email template</small>':''}</td><td>${row.sourceType==='standard'&&row.standardReady===false?'Standard template is loading':row.uploadValidation?.valid?'Validated':'Existing template'}</td><td><button type="button" data-dm-template-edit="${row.stageNumber}">Edit</button> <button type="button" data-dm-template-preview="${row.stageNumber}" ${row.sourceType==='standard'&&row.standardReady===false?'disabled':''}>Preview PDF</button></td></tr>`).join('')}</tbody></table></div></section>`;
    }
    function close(){active?.session.dispose();active=null;render();}
    function open(stage){
      const session=model.session(stage),draft=session.draft;active={session,stage};
      container.innerHTML=`<section class="dmTemplateEditor" aria-labelledby="dmTemplateTitle"><h3 id="dmTemplateTitle">Edit DL${stage} template</h3><form data-dm-template-form><label class="dmTemplateChoice">Word letter template<select name="dmWordSource"><option value="standard" ${draft.selection==='standard'?'selected':''}>Standard Word Template</option><option value="docx" ${draft.selection!=='standard'?'selected':''}>Upload my Word Template</option></select></label><p>The Word file is edited outside Inebura. Uploaded files are checked for the required customer, letter and invoice values.</p><div data-dm-word-upload-controls ${draft.selection==='standard'?'hidden':''}><label class="dmTemplateFile">Upload or replace Word template<input type="file" accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document" data-dm-word-upload></label><p data-dm-word-name>${escape(draft.letter.sourceFileName||'Standard Word template')}</p></div><a href="${escape(documents.standardTemplateUrl)}" download="standard-dunning-letter.docx">Download standard Word template</a><p>Download and edit the Word file to set payment days, payment instructions and sender details, then upload it as your template.</p><details><summary>Required values</summary><ul>${adapter.requiredFields(stage).map(field=>`<li>${escape(field.label)} — ${escape(field.marker)}</li>`).join('')}</ul></details>${draft.sharedEmail?'<p class="dmSharedEmail">This letter uses the DL3 email subject and message. Edit DL3 to change the email for DL3 and later letters.</p>':''}<div class="dmTemplateFields"><label>Subject line<input type="text" data-dm-email-subject value="${escape(draft.email.subject)}" ${draft.sharedEmail?'readonly':''} required></label><label>Email message<textarea data-dm-email-body rows="12" ${draft.sharedEmail?'readonly':''} required>${escape(draft.email.body)}</textarea></label></div><p class="dmTemplateStatus" data-dm-template-status role="status">${draft.selection==='standard'?'Standard Word template selected.':'The saved Word template will be retained until a replacement passes validation.'}</p><p class="dmTemplateError" data-dm-template-error role="alert" hidden></p><div class="dmActions"><button type="button" data-dm-template-cancel>Cancel</button><button type="button" data-dm-preview-draft>Preview PDF</button><button type="submit">Save template</button></div></form></section>`;
      const form=container.querySelector('[data-dm-template-form]'),body=container.querySelector('[data-dm-email-body]');
      // Use the established message editor when available, retaining the raw
      // captured source and locking merge values rather than exposing its syntax.
      if(editor){
        const subjectInput=container.querySelector('[data-dm-email-subject]'),subjectRoot=document.createElement('div');subjectRoot.className='tmSubjectEditor';subjectRoot.setAttribute('data-dm-email-subject-rich','');subjectInput.replaceWith(subjectRoot);
        const subjectModel=editor.project(draft.email.subject,{plain:true,editable:!draft.sharedEmail});subjectRoot.innerHTML=subjectModel.markup;if(!draft.sharedEmail)editor.attachEditor(subjectRoot,subjectModel,value=>session.setEmail({subject:value}));
        const frame=document.createElement('iframe');frame.title=`DL${stage} email message editor`;frame.className='dmTemplateEmailEditor';frame.setAttribute('sandbox','allow-same-origin');frame.setAttribute('referrerpolicy','no-referrer');body.replaceWith(frame);
        const bodyModel=editor.project(draft.email.body,{editable:!draft.sharedEmail});
        frame.addEventListener('load',()=>{if(active?.session!==session||disposed||draft.sharedEmail)return;editor.attachEditor(frame.contentDocument.body,bodyModel,value=>session.setEmail({body:value}));});
        frame.srcdoc=editor.frameDocument(bodyModel.markup,!draft.sharedEmail);
      }
      form.querySelector('input[type="file"]').disabled=draft.selection==='standard';
      form.querySelector('[data-dm-word-upload]').addEventListener('change',async event=>{
        const file=event.target.files?.[0];if(!file)return;
        await runLetterTask(()=>session.upload(file),'Validating uploaded Word template…');event.target.value='';
      });
      form.addEventListener('change',async event=>{
        if(event.target.name!=='dmWordSource')return;
        form.querySelector('[data-dm-word-upload-controls]').hidden=event.target.value==='standard';
        form.querySelector('input[type="file"]').disabled=event.target.value==='standard';
        if(event.target.value==='standard')await runLetterTask(()=>session.useStandard(),'Loading standard Word template…');
        else{session.selectUpload();setStatus('Upload a Word file to replace the saved template.');form.querySelector('button[type="submit"]').disabled=true;form.querySelector('[data-dm-preview-draft]').disabled=true;}
      });
      form.addEventListener('submit',event=>{
        event.preventDefault();try{captureEmail();session.save();close();notify(`DL${stage} template saved.`);}catch(error){showError(error.message);}
      });
      form.querySelector('[data-dm-template-cancel]').addEventListener('click',close);
      form.querySelector('[data-dm-preview-draft]').addEventListener('click',()=>{try{captureEmail();session.preview();}catch(error){showError(error.message);}});
      function captureEmail(){if(!editor&&!draft.sharedEmail)session.setEmail({subject:form.querySelector('[data-dm-email-subject]').value,body:form.querySelector('[data-dm-email-body]').value});}
      function showError(message){const node=form.querySelector('[data-dm-template-error]');node.hidden=!message;node.textContent=message;}
      function setStatus(message){form.querySelector('[data-dm-template-status]').textContent=message;}
      async function runLetterTask(task,message){
        const buttons=[...form.querySelectorAll('button[type="submit"],[data-dm-preview-draft]')];buttons.forEach(button=>button.disabled=true);showError('');setStatus(message);
        try{const accepted=await task();if(active?.session!==session||!accepted)return;form.querySelector('[data-dm-word-name]').textContent=session.draft.letter.sourceFileName;setStatus('Validation passed. All required values are present. Save template to apply.');}
        catch(error){if(active?.session===session){setStatus('Validation failed. The saved template has not changed.');showError(error.message);}}
        finally{if(active?.session===session)buttons.forEach(button=>button.disabled=session.draft.busy||session.draft.invalid);}
      }
      if(draft.selection==='standard'&&api.getState().templates.find(row=>row.stageNumber===stage)?.standardReady===false)runLetterTask(()=>session.useStandard(),'Loading standard Word template…');
    }
    function initialize(){
      if(initializing)return initializing;
      if(disposed||!model.allowed()||!api.getState().enabled||!model.pendingDefaults().length)return Promise.resolve();
      loading=true;render();
      initializing=(async()=>{
        try{
          do{await model.provision();}while(!disposed&&model.allowed()&&api.getState().enabled&&model.pendingDefaults().length);
        }catch(error){if(!disposed)notify(error.message);}
        finally{loading=false;initializing=null;render();}
      })();
      return initializing;
    }
    const listener=event=>{
      const edit=event.target.closest('[data-dm-template-edit]'),preview=event.target.closest('[data-dm-template-preview]');
      try{if(edit)open(Number(edit.dataset.dmTemplateEdit));if(preview)model.session(Number(preview.dataset.dmTemplatePreview)).preview();}catch(error){notify(error.message);}
    };
    const unsubscribe=api.subscribe?.(()=>{if(disposed)return;if(active&&!model.allowed())close();render();initialize();});
    container.addEventListener('click',listener);render();initialize();
    return {get ready(){return initialize();},ensureReady:initialize,refresh(){if(active&&!model.allowed())close();render();return initialize();},destroy(){disposed=true;unsubscribe?.();active?.session.dispose();active=null;container.removeEventListener('click',listener);container.innerHTML='';}};
  }
  return Object.freeze({createController,mount});
});
