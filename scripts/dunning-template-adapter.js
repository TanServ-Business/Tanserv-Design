/* Pure bridge between the existing communication catalogue and uploaded Dunning letters. */
(function (root, factory) {
  'use strict';
  const adapter = factory();
  if (typeof module === 'object' && module.exports) module.exports = adapter;
  else root.IneburaDunningTemplateAdapter = adapter;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const IDENTITIES = [
    { id:'xeon-template-46', sourceId:46, code:'DunningLetterOneEmail', eventType:'DunningLetterOne', stage:1 },
    { id:'xeon-template-47', sourceId:47, code:'DunningLetterTwoEmail', eventType:'DunningLetterTwo', stage:2 },
    { id:'xeon-template-48', sourceId:48, code:'DunningLetterThreeEmail', eventType:'DunningLetterThree', stage:3 }
  ];
  const FIELDS = [
    {key:'customerCode',label:'Customer code',source:'customer.code'},
    {key:'customerName',label:'Customer name',source:'customer.name'},
    {key:'customerAddress',label:'Customer address',source:'customer.address'},
    {key:'letterDate',label:'Letter issue date',source:'date'},
    {key:'letterReference',label:'Dunning letter reference number',source:'reference'},
    {key:'previousLetters',label:'Previous letter reference(s)',source:'previousReferences'},
    {key:'totalOutstanding',label:'Total remaining outstanding amount',source:'totalOutstanding'},
    {key:'originalTotal',label:'Total original invoice amount',source:'originalTotal'},
    {key:'invoiceCount',label:'Number of included invoices',source:'invoiceCount'},
    {key:'invoiceTable',label:'Invoice annexure',source:'invoices'}
  ];
  const DEFAULT_MAPPINGS = Object.fromEntries(FIELDS.map(field => [field.key,field.source]));
  const BY_SOURCE = Object.fromEntries(FIELDS.map(field => [field.source,field.key]));
  const REQUIRED = ['customerName','invoiceTable','totalOutstanding','letterDate','letterReference'];
  const ALIASES = {
    'userCustomer.customerCode':'customerCode', 'customer.code':'customerCode',
    'userCustomer.customerName':'customerName', 'userCustomer.name':'customerName',
    'userCustomer.address':'customerAddress', 'dunningLetterRefNo':'letterReference',
    'dunningLetterReferenceNo':'letterReference', 'listOfInvoices':'invoiceTable',
    'outstandingAmount':'totalOutstanding', 'date':'letterDate', 'reference':'letterReference',
    'previousReferences':'previousLetters', 'dunningLetterOneRefNo':'previousLetters',
    'dunningLetterTwoRefNo':'previousLetters', 'customer.name':'customerName',
    'customer.address':'customerAddress', 'invoices':'invoiceTable'
  };
  const clone = value => JSON.parse(JSON.stringify(value));
  const rowsOf = value => Array.isArray(value) ? value : value?.templates || [];
  const stateOf = value => typeof value?.getState === 'function' ? value.getState() : value || {};
  const escape = value => String(value ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
  const decode = value => String(value ?? '').replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (all, entity) => {
    const named = {amp:'&',lt:'<',gt:'>',quot:'"',apos:"'",nbsp:' '};
    if (entity[0] !== '#') return named[entity.toLowerCase()] ?? all;
    const number = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2),16) : Number(entity.slice(1));
    return number > 0 && number <= 0x10ffff ? String.fromCodePoint(number) : '';
  });
  const textOf = value => decode(String(value ?? '').replace(/<[^>]*>/g,''));
  const unique = values => [...new Set(values)];
  function stageFor(row, sourceTemplates) {
    if (!row || typeof row !== 'object') return null;
    const immutable = rowsOf(sourceTemplates).find(source => source.id === row.id);
    const value = immutable || row;
    const identity = IDENTITIES.find(item => item.id === value.id || Number(value.sourceId) === item.sourceId);
    if (identity) return identity.stage;
    const future=String(value.code || '').match(/^DunningLetter([4-9]|[1-9]\d+)Email$/);
    if ((immutable || (!value.id && value.sourceId === undefined)) && future && value.eventType===`DunningLetter${future[1]}` && value.communicationMode==='Email') return Number(future[1]);
    // An unrelated row cannot become a Dunning template through an editable code or event.
    if (value.id || value.sourceId !== undefined) return null;
    return IDENTITIES.find(item => item.code === value.code && item.eventType === value.eventType && value.communicationMode === 'Email')?.stage || null;
  }
  const catalogRows = source => rowsOf(source).filter(row => stageFor(row,source)).map(row => ({...clone(row),stageNumber:stageFor(row,source)})).sort((a,b) => a.stageNumber-b.stageNumber);
  function requiredFields(stage) {
    const keys = Number(stage) > 1 ? [...REQUIRED,'previousLetters'] : REQUIRED;
    return keys.map(key => ({...FIELDS.find(field => field.key === key),marker:`{{${key}}}`}));
  }
  function canonical(token,mappings) {
    const name = textOf(token).trim();
    if (Object.hasOwn(DEFAULT_MAPPINGS,name)) return name;
    if (Object.hasOwn(ALIASES,name)) return ALIASES[name];
    if (Object.hasOwn(BY_SOURCE,name)) return BY_SOURCE[name];
    if (Object.hasOwn(mappings || {},name)) return BY_SOURCE[mappings[name]] || null;
    if (/^aDate\?(?:date|string\(["']dd-MMM-yyyy["']\))$/.test(name)) return 'letterDate';
    return null;
  }
  function validateUpload(input,stage,mappings) {
    if (input && typeof input === 'object') { mappings=input.mappings || input.fieldMappings;stage=input.stageNumber || input.stage;input=input.html || input.letterHtml; }
    const original=String(input ?? ''), unknown=[],errors=[],fields=[];
    const number=stage === undefined || stage === null ? 1 : Number(stage);
    if (!Number.isInteger(number) || number < 1) errors.push('Choose a valid Dunning letter stage.');
    if (!textOf(original).trim()) errors.push('The Word document has no letter text.');
    if (/<\/?(?:script|iframe|object|embed|form|svg|math)\b|\bon\w+\s*=|(?:javascript|vbscript)\s*:/i.test(original)) errors.push('The Word document contains unsupported active content.');
    if (/<\/?#|&lt;\/?#/i.test(original)) errors.push('Word templates support data markers, not FreeMarker instructions.');
    const html=original.replace(/\{\{([\s\S]*?)\}\}|\$\{([^{}]*)\}/g,(marker,brace,legacy) => {
      const key=canonical(brace ?? legacy,mappings);
      if (!key) { unknown.push(textOf(marker)); return marker; }
      fields.push(key); return `{{${key}}}`;
    });
    const residual=textOf(original).replace(/\{\{[\s\S]*?\}\}|\$\{[^{}]*\}/g,'');
    if (/\{\{|\}\}|\$\{/.test(residual)) errors.push('A data marker is incomplete. Use the exact {{fieldName}} format.');
    const missing=requiredFields(number).filter(field => !fields.includes(field.key)).map(field => field.label);
    if (missing.length) errors.push(`Missing required values: ${missing.join(', ')}.`);
    if (unknown.length) errors.push(`Unsupported values: ${unique(unknown).join(', ')}.`);
    return {valid:errors.length===0,html,missing,missingFields:missing,unknown:unique(unknown),unknownFields:unique(unknown),fields:unique(fields),mappings:{...DEFAULT_MAPPINGS},errors};
  }
  const EMAIL_EXPRESSIONS = new Set([
    'clientLogo','userCustomer.customerCode','userCustomer.customerName','dunningLetterRefNo',
    'aDate?string("dd-MMM-yyyy")',"aDate?string('dd-MMM-yyyy')",'aDate?date',"'\\n'",'"\\n"',
    'dunningLetterOneRefNo','dunningLetterTwoRefNo','bDate?date','cDate?date','userClient',
    '(invoiceList.saleOrderNo)!','invoiceList.saleOrderNo','invoiceList.invoiceNo','invoiceList.invoiceDate',
    '(invoiceList.invoiceValue)!','invoiceList.invoiceValue','invoiceList.totalOutstanding','invoiceList.poNumber',
    '(invoiceList.desc)!','invoiceList.desc','dunningLetterContactInfo!','dunningLetterContactInfo','subdomain','token'
  ]);
  const EMAIL_DIRECTIVES = new Set([
    '#assignaDateTime=.now','#assignaDate=aDateTime?date','#settingdate_format="dd-MMM-yyyy"',
    '#assignbDateTime=firstMailSentDate','#assignbDate=bDateTime?date("yyyy-MM-dd")',
    '#assigncDateTime=secondMailSentDate','#assigncDate=cDateTime?date("yyyy-MM-dd")',
    '#listlistOfInvoicesasinvoiceList','/#list'
  ]);
  function validateEmail(subject,body) {
    if (subject && typeof subject === 'object') {body=subject.body;subject=subject.subject;}
    const errors=[],unknown=[],combined=`${subject || ''}\n${body || ''}`;
    if (!String(subject || '').trim() || !String(body || '').trim()) errors.push('Add the email subject and email message.');
    if (/<\/?(?:script|iframe|object|embed|form|svg|math)\b|\bon\w+\s*=|(?:javascript|vbscript)\s*:/i.test(combined)) errors.push('The email template contains unsupported active content.');
    const directives=combined.match(/<\/?#[^>]*>/g) || [];
    let lists=0;
    for (const directive of directives) {
      const key=directive.slice(1,-1).replace(/\s/g,'');
      if (!EMAIL_DIRECTIVES.has(key)) unknown.push(directive);
      if (key==='#listlistOfInvoicesasinvoiceList') {lists++;if(lists>1) errors.push('Nested invoice lists are not supported.');}
      if (key==='/#list' && --lists < 0) errors.push('The invoice list has an unmatched closing instruction.');
    }
    if (lists) errors.push('The invoice list is incomplete.');
    const markers=combined.match(/\$\{[^{}]*\}|\{\{[\s\S]*?\}\}/g) || [];
    for (const marker of markers) {
      if (marker.startsWith('${')) {if(!EMAIL_EXPRESSIONS.has(decode(marker.slice(2,-1)).trim())) unknown.push(marker);}
      else if (!canonical(marker.slice(2,-2))) unknown.push(marker);
    }
    const residual=combined.replace(/<\/?#[^>]*>/g,'').replace(/\$\{[^{}]*\}|\{\{[\s\S]*?\}\}/g,'');
    if (/\$\{|\{\{|\}\}|<\/?#/.test(residual)) errors.push('An email data marker or instruction is incomplete.');
    const outsideLists=combined.replace(/<#list\s+listOfInvoices\s+as\s+invoiceList\s*>[\s\S]*?<\/#list\s*>/g,'');
    if (/\$\{\(?invoiceList\./.test(outsideLists)) errors.push('Invoice values must be inside the existing invoice list.');
    if (unknown.length) errors.push(`Unsupported email values or instructions: ${unique(unknown).join(', ')}.`);
    return {valid:errors.length===0,unknown:unique(unknown),errors};
  }
  function dateLabel(value) {
    if (!value) return '';
    const raw=String(value),date=new Date(/^\d{4}-\d{2}-\d{2}$/.test(raw)?`${raw}T12:00:00Z`:raw);
    return Number.isNaN(+date)?raw:`${String(date.getUTCDate()).padStart(2,'0')}-${['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][date.getUTCMonth()]}-${date.getUTCFullYear()}`;
  }
  const amount=value => value === undefined || value === null || value === '' ? '' : Number.isFinite(Number(value)) ? Number(value).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}) : '';
  const invoiceValue=(invoice,key) => ({saleOrderNo:invoice.saleOrderNo || invoice.salesOrderNo || '',invoiceNo:invoice.invoiceNo || '',invoiceDate:dateLabel(invoice.invoiceDate),invoiceValue:amount(invoice.originalAmount ?? invoice.invoiceValue ?? invoice.amount),totalOutstanding:amount(invoice.outstanding ?? invoice.outstandingAmount ?? invoice.totalOutstanding),poNumber:invoice.poNumber || invoice.purchaseOrderNo || '',desc:invoice.desc || invoice.description || ''})[key];
  function renderEmail(template,snapshot) {
    const source=template.emailTemplateSource || {subject:template.emailSubject,body:template.emailBody};
    const check=validateEmail(source.subject,source.body);if(!check.valid) throw new Error(check.errors.join(' '));
    const invoices=snapshot.invoices || [],customer=snapshot.customer || {},prior=snapshot.previousIssues || snapshot.previousLetters || [];
    const references=snapshot.previousReferences || prior.map(item=>typeof item==='string'?item:item.reference || '');
    const dates=snapshot.previousLetterDates || prior.map(item=>typeof item==='object'?item.date || item.snapshot?.date:'');
    const values={
      'customer.code':customer.customerCode || customer.code || snapshot.customerCode || '',
      'customer.name':customer.name || snapshot.customerName || '', 'customer.address':customer.address || '',
      date:dateLabel(snapshot.date || snapshot.sentAt),reference:snapshot.reference || '',previousReferences:references.filter(Boolean).join(', '),
      totalOutstanding:amount(invoices.reduce((sum,invoice)=>sum+Number(invoice.outstanding ?? invoice.outstandingAmount ?? 0),0)),
      originalTotal:amount(invoices.reduce((sum,invoice)=>sum+Number(invoice.originalAmount ?? invoice.invoiceValue ?? invoice.amount ?? 0),0)),invoiceCount:String(invoices.length)
    };
    const contacts=snapshot.dunningContacts || customer.contacts || [];
    const contactHtml=contacts.map(contact=>`<tr><td>${escape(contact.name || '')}</td><td>${escape(contact.phone || contact.mobile || '')}</td><td>${escape(contact.email || '')}</td></tr>`).join('');
    const annexure=`<table><thead><tr><th>Invoice</th><th>Due date</th><th>Original amount</th><th>Outstanding</th></tr></thead><tbody>${invoices.map(invoice=>`<tr><td>${escape(invoice.invoiceNo || '')}</td><td>${escape(dateLabel(invoice.dueDate))}</td><td>${escape(invoiceValue(invoice,'invoiceValue'))}</td><td>${escape(invoiceValue(invoice,'totalOutstanding'))}</td></tr>`).join('')}</tbody></table>`;
    function valueFor(expression,invoice) {
      if (expression.startsWith('invoiceList.') || expression.startsWith('(invoiceList.')) return invoiceValue(invoice || {},expression.replace(/^\(?invoiceList\./,'').replace(/\)!$|!$/,''));
      const logo=snapshot.clientLogo || snapshot.client?.logo || customer.clientLogo || '';
      const simple={clientLogo:/^(?:https?:\/\/|\.?\.?\/assets\/|\/?assets\/)/i.test(logo)?logo:'','userCustomer.customerCode':customer.customerCode || customer.code || snapshot.customerCode || '','userCustomer.customerName':values['customer.name'],dunningLetterRefNo:values.reference,'aDate?string("dd-MMM-yyyy")':values.date,"aDate?string('dd-MMM-yyyy')":values.date,'aDate?date':values.date,"'\\n'":'\n','"\\n"':'\n',dunningLetterOneRefNo:references[0] || '',dunningLetterTwoRefNo:references[1] || '','bDate?date':dateLabel(dates[0]),'cDate?date':dateLabel(dates[1]),userClient:snapshot.clientName || snapshot.client?.name || customer.clientName || '',subdomain:/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/i.test(snapshot.subdomain || '')?snapshot.subdomain:'',token:encodeURIComponent(snapshot.token || snapshot.customerLinkToken || '')};
      return simple[expression] ?? '';
    }
    function fragment(value,invoice,plain) {
      return value.replace(/\$\{([^{}]*)\}|\{\{([\s\S]*?)\}\}/g,(_,legacy,brace)=>{
        if (legacy !== undefined) {
          const expression=decode(legacy).trim();
          if (/^dunningLetterContactInfo!?$/.test(expression)) return plain?textOf(contactHtml):contactHtml;
          const replacement=valueFor(expression,invoice);return plain?String(replacement):escape(replacement);
        }
        const key=canonical(brace),mapped=DEFAULT_MAPPINGS[key];
        if(mapped==='invoices') return plain?'Invoice annexure attached':annexure;
        return plain?String(values[mapped] ?? ''):escape(values[mapped] ?? '');
      });
    }
    function render(value,plain) {
      // The captured DL2 email ends inside an unfinished HTML tag. Keep its saved
      // source untouched; discard only that incomplete tag from rendered output.
      const sourceText=String(value || '');
      const clean=(plain?sourceText:sourceText.replace(/<\/?[A-Za-z][^>]*$/,'')).replace(/<#(?:assign|setting)\b[^>]*>/g,'');
      const pattern=/<#list\s+listOfInvoices\s+as\s+invoiceList\s*>([\s\S]*?)<\/#list\s*>/g;let position=0,out='';
      for(const match of clean.matchAll(pattern)) {out+=fragment(clean.slice(position,match.index),null,plain);out+=invoices.map(invoice=>fragment(match[1],invoice,plain)).join('');position=match.index+match[0].length;}
      return out+fragment(clean.slice(position),null,plain);
    }
    return {subject:render(source.subject,true),body:render(source.body,false)};
  }
  function canonicalEmail(value) {
    return String(value || '').replace(/<#(?:assign|setting)\b[^>]*>/g,'').replace(/<#list\s+listOfInvoices\s+as\s+invoiceList\s*>[\s\S]*?<\/#list\s*>/g,'{{invoiceTable}}').replace(/\$\{([^{}]*)\}/g,(_,expression)=>{
      const key=canonical(decode(expression).trim());return key?`{{${key}}}`:'';
    }).replace(/\{\{([\s\S]*?)\}\}/g,(_,token)=>{const key=canonical(token);return key?`{{${key}}}`:'';});
  }
  function resolveEmailTemplate(state,template,options) {
    const data=stateOf(state),settings=options || {},stage=Number(settings.stageNumber ?? template.stageNumber);
    const sourceStage=stage>=4?3:stage;
    const isThird=row=>{const type=(data.documentTypes || []).find(item=>item.id===row?.documentTypeId);return Number(row?.stageNumber || type?.stageNumber || type?.stage)===3;};
    // Later letters share the current DL3 email while retaining their own Word letter,
    // stage and identity. Read on every issue so later DL3 edits reach unsent stages.
    const emailTemplate=stage>=4?(
      (data.templates || []).find(row=>row.id===settings.stage3TemplateId && isThird(row)) ||
      (data.templates || []).find(row=>isThird(row) && row.managedIn==='dunning-management') ||
      (data.templates || []).find(row=>row.id==='dunning-template-3' && isThird(row)) ||
      (data.templates || []).find(isThird)
    ):template;
    let emailSource;
    if(emailTemplate?.managedIn==='dunning-management') {
      emailSource=emailTemplate.emailTemplateSource || {id:emailTemplate.sourceTemplateId || `dunning-email-${sourceStage}`,subject:emailTemplate.emailSubject,body:emailTemplate.emailBody};
    } else {
      const original=catalogRows(settings.sourceTemplates || []).find(row=>row.stageNumber===sourceStage);
      if(original) {
        const saved=rowsOf(settings.savedRows).find(row=>row.id===original.id);
        emailSource={...original,subject:saved?.subject ?? original.subject,body:saved?.body ?? original.body};
      } else if(emailTemplate) {
        if(stage<4 && !emailTemplate.emailTemplateSource)return clone(template);
        emailSource=emailTemplate.emailTemplateSource || {id:emailTemplate.sourceTemplateId || `dunning-email-${sourceStage}`,subject:emailTemplate.emailSubject,body:emailTemplate.emailBody};
      }
    }
    if(!emailSource) {
      if(stage>=4)throw new Error('The DL3 email template is unavailable. Configure DL3 before sending additional Dunning letters.');
      return clone(template);
    }
    return {...clone(template),emailSubject:canonicalEmail(emailSource.subject),emailBody:canonicalEmail(emailSource.body),emailTemplateSource:clone(emailSource),emailRenderer:'existing-template-master',sourceTemplateId:emailSource.id || emailTemplate?.sourceTemplateId,...(stage>=4?{emailSourceStage:3}:{})};
  }
  function buildTemplate(state,row,options) {
    const data=stateOf(state),settings=options || {},stage=stageFor(row,settings.sourceTemplates);
    if(!stage) throw new Error('Choose an existing Dunning Letter email template.');
    const type=(data.documentTypes || []).find(item=>Number(item.stageNumber || item.stage)===stage);
    const existing=settings.existing || (data.templates || []).find(item=>(!item.stageNumber || Number(item.stageNumber)===stage) && (item.emailTemplateSource?.id===row.id || item.sourceTemplateId===row.id)) || (data.templates || []).find(item=>item.id===`dunning-template-${stage}`) || (data.templates || []).find(item=>type && item.documentTypeId===type.id) || (data.templates || []).find(item=>Number(item.stageNumber)===stage);
    const letterHtml=settings.letterHtml ?? existing?.letterHtml ?? existing?.body ?? '';
    if(!textOf(letterHtml).trim() && settings.letterHtml===undefined) throw new Error('Upload a Word letter template before saving this Dunning stage.');
    const validation=validateUpload(letterHtml,stage,existing?.fieldMappings || existing?.mappings);
    if(settings.letterHtml !== undefined && !validation.valid) throw new Error(validation.errors.join(' '));
    const source={id:row.id,sourceId:row.sourceId,code:row.code,eventType:row.eventType,subject:settings.subject ?? row.subject,body:settings.body ?? row.body};
    const emailCheck=validateEmail(source.subject,source.body);if(!emailCheck.valid) throw new Error(emailCheck.errors.join(' '));
    const normalizedLetter=validation.unknown.length || validation.errors.some(error=>/incomplete|active content|FreeMarker/.test(error))?letterHtml:validation.html;
    return {...clone(existing || {}),id:existing?.id || `dunning-template-${stage}`,documentTypeId:existing?.documentTypeId || type?.id || `dunning-document-${stage}`,stageNumber:existing?.stageNumber || stage,name:existing?.name || `Dunning Letter ${stage}`,body:normalizedLetter,letterHtml:normalizedLetter,mappings:{...DEFAULT_MAPPINGS,...validation.mappings},fieldMappings:{...DEFAULT_MAPPINGS,...validation.mappings},calculation:{totalOutstanding:'sumOutstanding'},emailSubject:canonicalEmail(source.subject),emailBody:canonicalEmail(source.body),emailTemplateSource:source,emailRenderer:'existing-template-master',sourceTemplateId:row.id,...(settings.sourceFileName !== undefined?{sourceFileName:settings.sourceFileName,sourceType:'docx'}:{}),...(settings.letterHtml !== undefined?{uploadValidation:{valid:true,fields:validation.fields,stageNumber:stage}}:{})};
  }
  return Object.freeze({stageFor,isDunning:(row,source)=>stageFor(row,source)!==null,catalogRows,requiredFields,validateUpload,validateEmail,buildTemplate,renderEmail,resolveEmailTemplate,defaultMappings:{...DEFAULT_MAPPINGS}});
});
