/* Shared state and business rules for the local Dunning Letters design.
 * Browser delivery is simulated. No network requests or real email sends occur here.
 */
(function (root, factory) {
  'use strict';
  if (typeof module === 'object' && module.exports) module.exports = factory(null, require('./dunning-template-adapter.js'));
  else root.IneburaDunning = factory(root);
})(typeof window !== 'undefined' ? window : globalThis, function (host, emailAdapter) {
  'use strict';
  const KEY = 'inebura:dunning:review-v1';
  const VERSION = 1;
  const DAY = 86400000;
  const MAX_LETTERS = 1000;
  const MANAGERS = ['client-admin'];
  const EXCLUDERS = ['client-admin', 'agent'];
  const AGE_BOUNDS = [[0,'Not Due'],[30,'1-30'],[45,'31-45'],[60,'46-60'],[90,'61-90'],[120,'91-120'],[150,'121-150'],[180,'151-180'],[210,'181-210'],[240,'211-240'],[270,'241-270'],[300,'271-300'],[330,'301-330'],[365,'331-365'],[730,'1-2 yrs'],[1095,'2-3 yrs'],[1460,'3-4 yrs'],[1825,'4-5 yrs'],[Infinity,'5+ yrs']];
  const FIELDS = ['customer.code', 'customer.name', 'customer.address', 'invoices', 'totalOutstanding', 'originalTotal', 'invoiceCount', 'date', 'reference', 'previousReferences'];
  const DEFAULT_MAPPINGS = { customerCode:'customer.code', customerName:'customer.name', customerAddress:'customer.address', invoiceTable:'invoices', totalOutstanding:'totalOutstanding', letterDate:'date', previousLetters:'previousReferences', letterReference:'reference', originalTotal:'originalTotal', invoiceCount:'invoiceCount' };
  const clone = value => JSON.parse(JSON.stringify(value));
  const sum = values => Math.round(values.reduce((total, value) => total + Number(value || 0), 0) * 100) / 100;
  function fail(message, code) { const error = new Error(message); error.code = code || 'VALIDATION'; throw error; }
  function normalizeRole(value) {
    const raw = String(value || '').trim().toLowerCase().replace(/[ _]+/g, '-');
    return ({admin:'client-admin', clientadmin:'client-admin', 'client-administrator':'client-admin', 'client-admin':'client-admin', supervisor:'supervisor', agent:'agent'})[raw] || raw;
  }
  function day(value) {
    const text = String(value || '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(text) || !Number.isFinite(Date.parse(text + 'T00:00:00Z')) || new Date(text + 'T00:00:00Z').toISOString().slice(0, 10) !== text) fail('Choose a valid date.');
    return text;
  }
  const addDays = (value, days) => new Date(Date.parse(day(value) + 'T00:00:00Z') + Number(days) * DAY).toISOString().slice(0, 10);
  const daysBetween = (left, right) => Math.round((Date.parse(day(right)) - Date.parse(day(left))) / DAY);
  function today() {
    return new Intl.DateTimeFormat('en-CA', { timeZone:'Asia/Kolkata', year:'numeric', month:'2-digit', day:'2-digit' }).format(new Date());
  }
  function seed() {
    const customers = [
      { id:'dunning-customer-north', name:'Sample: Aurora Manufacturing', clientId:'demo-client', clientCode:'SAMPLE-CLIENT', customerCode:'SAMPLE-CUST-001', subClientId:'North', agentId:'demo-agent', address:'18 Industrial Estate, New Delhi', contacts:[{name:'Accounts',email:'accounts@aurora.example'},{name:'Finance',email:'finance@aurora.example'}] },
      { id:'dunning-customer-south', name:'Sample: Meridian Services', clientId:'demo-client', clientCode:'SAMPLE-CLIENT', customerCode:'SAMPLE-CUST-002', subClientId:'South', agentId:'demo-agent', address:'42 Business Park, Chennai', contacts:[{name:'Accounts',email:'accounts@meridian.example'},{name:'Finance',email:'finance@meridian.example'}] }
    ];
    const invoices = [];
    customers.forEach((customer, ci) => {
      ['2026-10-05','2026-10-06','2026-10-07','2026-10-05'].forEach((dueDate, di) => {
        const amount = (ci + 1) * 10000 + di * 2500;
        invoices.push({ id:`dunning-invoice-${ci + 1}-${di + 1}`, invoiceNo:`SAMPLE-${ci + 1}0${di + 1}`, customerId:customer.id, clientId:customer.clientId, subClientId:customer.subClientId, dueDate, originalAmount:amount, amount, outstanding:amount, outstandingAmount:amount, agentId:'demo-agent', sample:true });
      });
    });
    return { version:VERSION, enabled:false, letterCount:3, documentTypes:[], templates:[], strategies:[], customers, invoices, batches:[], emails:[], exclusions:[], conflicts:[], runs:[], lastRunDate:null, revision:0 };
  }
  function configuredCount(state) {
    if (Number.isSafeInteger(state.letterCount) && state.letterCount >= 1) return state.letterCount;
    // Earlier saved prototypes allowed extra stages before there was a count setting.
    // Infer their configured capacity without discarding any existing strategy or stage.
    return Math.max(3, ...state.strategies.map(row => Array.isArray(row.stages) ? row.stages.length : 0), ...state.templates.map(row => Number(row.stageNumber) || 0), ...state.documentTypes.map(row => Number(row.stageNumber || row.stage) || 0));
  }
  function restore(saved) {
    const restored = Object.assign(seed(), saved);
    restored.letterCount = configuredCount(Object.assign({}, restored, {letterCount:saved.letterCount}));
    return restored;
  }
  function retireMinimumOutstanding(strategies) {
    let changed = false;
    strategies.forEach(strategy => {
      // Remove only live eligibility settings; captured letters and their history stay intact.
      [strategy, ...(strategy.stages || [])].forEach(record => {
        if (record.filters && Object.prototype.hasOwnProperty.call(record.filters, 'minOutstanding')) {
          delete record.filters.minOutstanding;
          changed = true;
        }
      });
    });
    return changed;
  }
  function defaults(state) {
    for (let index = 1; index <= state.letterCount; index += 1) {
      const documentId = `dunning-document-${index}`;
      if (!state.documentTypes.some(row => row.id === documentId)) state.documentTypes.push({ id:documentId, name:`Dunning Letter ${index}`, stage:index, stageNumber:index });
      if (!state.templates.some(row => row.id === `dunning-template-${index}`)) {
        const html = `<p>Date: {{letterDate}}</p><p>Reference: {{letterReference}}</p><h2>Dunning Letter ${index}</h2><p>Dear {{customerName}},</p><p>${index === 1 ? 'Our records show the following invoices remain unpaid. Please arrange payment of the outstanding balance.' : 'We refer to our earlier letter(s): {{previousLetters}}. The following balance remains unpaid. Please arrange payment promptly.'}</p><p>Total outstanding: {{totalOutstanding}}</p><p>Yours sincerely,<br>Accounts Receivable</p>`;
        const emailTemplate=index>=4?state.templates.find(row=>Number(row.stageNumber)===3):null;
        const inheritedEmail=emailTemplate?Object.fromEntries(['emailSubject','emailBody','emailTemplateSource','emailRenderer','sourceTemplateId'].filter(key=>emailTemplate[key]!==undefined).map(key=>[key,clone(emailTemplate[key])])):{};
        state.templates.push({ id:`dunning-template-${index}`, documentTypeId:documentId, stageNumber:index, name:`Dunning Letter ${index}`, body:html, letterHtml:html, sourceType:'standard', standardReady:false, sourceFileName:'standard-dunning-letter.docx', emailSubject:`Payment reminder – Letter ${Math.min(index,3)} – {{customerName}}`, emailBody:'Dear {{customerName}},\nPlease find your payment reminder and invoice annexure attached. Outstanding: {{totalOutstanding}}.', ...inheritedEmail, ...(index>=4?{emailSourceStage:3}:{}), mappings:clone(DEFAULT_MAPPINGS), fieldMappings:clone(DEFAULT_MAPPINGS), calculation:{totalOutstanding:'sumOutstanding'} });
      }
    }
  }
  function createInstance(options) {
    const config = options || {};
    let storage = config.storage;
    if (!storage && host) { try { storage = host.localStorage; } catch (_) { /* Private browsing can disable persistence. */ } }
    function restoreSaved(saved) {
      const restored = restore(saved);
      if (retireMinimumOutstanding(restored.strategies) && storage) {
        try { storage.setItem(KEY, JSON.stringify(restored)); }
        catch (_) { /* Retired settings are still ignored in memory if migration cannot persist. */ }
      }
      return restored;
    }
    let current = seed();
    if (storage) {
      try {
        const saved = JSON.parse(storage.getItem(KEY) || 'null');
        if (saved && saved.version === VERSION && ['documentTypes','templates','strategies','customers','invoices','batches','emails','exclusions','conflicts'].every(key => Array.isArray(saved[key]))) current = restoreSaved(saved);
      } catch (_) { /* A malformed prototype record is ignored; unrelated storage is never changed. */ }
    }
    const listeners = new Set();
    function notify() {
      listeners.forEach(listener => { try { listener(clone(current)); } catch (_) { /* Views cannot invalidate saved state. */ } });
      if (host && typeof host.dispatchEvent === 'function' && typeof host.CustomEvent === 'function') host.dispatchEvent(new host.CustomEvent('inebura:dunning-change', {detail:{revision:current.revision}}));
    }
    if (host && typeof host.addEventListener === 'function') host.addEventListener('storage', event => {
      if (event.key !== KEY || !event.newValue) return;
      try {
        const saved = JSON.parse(event.newValue);
        if (saved?.version === VERSION && ['documentTypes','templates','strategies','customers','invoices','batches','emails','exclusions','conflicts'].every(key => Array.isArray(saved[key]))) {
          current = restoreSaved(saved); notify();
        }
      } catch (_) { /* Ignore incomplete or unrelated storage updates. */ }
    });
    function getContext() {
      if (config.context) {
        const provided = typeof config.context === 'function' ? config.context() : config.context;
        return Object.assign({role:'client-admin',userId:'demo-user',clientId:'demo-client'}, provided, {role:normalizeRole(provided.role || 'client-admin')});
      }
      let stored = '';
      try { stored = storage && storage.getItem('activeUserRole') || ''; } catch (_) { /* Use route default. */ }
      let query = '';
      try { query = host && new URLSearchParams(host.location.search).get('role') || ''; } catch (_) { /* Use route default. */ }
      const adminPage = host && /(?:^|\/)admin\.html$/.test(host.location.pathname);
      // Admin navigation establishes its own review role; a prior Agent workspace must not leak into it.
      const shellRole = adminPage ? host.document?.body?.dataset?.adminRole || 'client-admin' : stored || 'agent';
      const role = normalizeRole(query || shellRole);
      return {role,userId:role === 'agent' ? 'demo-agent' : 'demo-user',clientId:'demo-client'};
    }
    function actorInfo(actor) {
      const result = Object.assign({}, getContext(), typeof actor === 'string' ? {role:actor} : actor || {});
      result.role = normalizeRole(result.role);
      if (result.role === 'agent' && !(actor && typeof actor === 'object' && actor.userId)) result.userId = 'demo-agent';
      return result;
    }
    function guard(actor, roles) {
      const person = actorInfo(actor);
      if (!roles.includes(person.role)) fail('Your role does not have permission for this Dunning Letters action.', 'FORBIDDEN');
      return person;
    }
    function scope(person, record) {
      if (record.clientId && record.clientId !== person.clientId) fail('This record is outside your client scope.', 'FORBIDDEN');
      if (person.role === 'agent' && record.agentId && record.agentId !== person.userId) fail('This invoice is not assigned to you.', 'FORBIDDEN');
      if (person.invoiceIds && !person.invoiceIds.includes(record.id)) fail('This invoice is outside your assigned scope.', 'FORBIDDEN');
    }
    function transact(mutator) {
      const next = clone(current);
      const result = mutator(next);
      retireMinimumOutstanding(next.strategies);
      next.revision = Number(current.revision || 0) + 1;
      if (storage) {
        try { storage.setItem(KEY, JSON.stringify(next)); }
        catch (_) { fail('Dunning changes could not be saved. Free browser storage and try again.', 'PERSISTENCE'); }
      }
      current = next;
      notify();
      return clone(result === undefined ? current : result);
    }
    const lookup = (state, key, id) => {
      const row = state[key].find(item => item.id === id);
      if (!row) fail(`${key === 'invoices' ? 'Invoice' : 'Dunning record'} was not found.`, 'NOT_FOUND');
      return row;
    };
    const excluded = (state, invoiceId) => state.exclusions.some(item => item.invoiceId === invoiceId && item.active !== false);
    const eligibleDate = (invoice, strategy) => addDays(invoice.dueDate, strategy.firstStageDays);
    function matchesStrategyMasterTarget(state, invoice, strategy) {
      const target = strategy.filters?.strategyMaster;
      if (!target) return true;
      const customer = state.customers.find(row => row.id === invoice.customerId) || {};
      // These IDs identify the existing Strategy Master source, not the engine's internal IDs.
      const rawId = target.targetType === 'invoice' ? invoice.strategyMasterInvoiceId : invoice.strategyMasterCustomerId ?? customer.strategyMasterCustomerId;
      if (rawId === undefined || rawId === null || !String(rawId).trim()) return false;
      const id = String(rawId);
      if ((target.excludedTargetIds || []).some(value => String(value) === id)) return false;
      return target.targetMode === 'all' || target.targetMode === 'selected' && (target.selectedTargetIds || []).some(value => String(value) === id);
    }
    const matchesScope = (state, invoice, strategy) => invoice.clientId === strategy.clientId && (!strategy.subClientId || invoice.subClientId === strategy.subClientId) && (!strategy.filters?.customerIds?.length || strategy.filters.customerIds.includes(invoice.customerId)) && (!strategy.filters?.invoiceIds?.length || strategy.filters.invoiceIds.includes(invoice.id)) && matchesStrategyMasterTarget(state, invoice, strategy);
    function matchesStage(state, invoice, stage, date) {
      const filters = stage?.filters;
      if (!filters) return true;
      if (filters.keyAccountFilter && filters.keyAccountFilter !== 'all') {
        const customer = state.customers.find(row => row.id === invoice.customerId) || {};
        const source = invoice.strategyMasterKeyAccount ?? customer.strategyMasterKeyAccount ?? invoice.keyAccount ?? invoice.isKeyAccount ?? customer.keyAccount ?? customer.isKeyAccount;
        const normalized = String(source ?? '').trim().toLowerCase();
        const keyAccount = ['yes','true','1'].includes(normalized) ? 'yes' : ['no','false','0'].includes(normalized) ? 'no' : null;
        if (keyAccount !== filters.keyAccountFilter) return false;
      }
      // Broad and primary selections are already expanded into the existing UI's leaf selection.
      if (filters.invoiceStatuses !== undefined || filters.invoiceBroadSelections !== undefined || filters.invoicePrimarySelections !== undefined) {
        const status = String(invoice.strategyMasterSubStatus ?? invoice.subStatus ?? '').trim();
        if (!Array.isArray(filters.invoiceStatuses) || !filters.invoiceStatuses.includes(status)) return false;
      }
      if (filters.agingBuckets !== undefined) {
        const age = daysBetween(invoice.dueDate, date);
        const bucket = AGE_BOUNDS.find(([upper]) => age <= upper)[1];
        if (!Array.isArray(filters.agingBuckets) || !filters.agingBuckets.includes(bucket)) return false;
      }
      return true;
    }
    function stageForInvoice(state, invoice, strategy) {
      const batch = state.batches.find(row => row.strategyId === strategy.id && row.invoiceIds.includes(invoice.id) && row.status !== 'completed');
      return strategy.stages[(batch?.stage || 1) - 1];
    }
    const matching = (state, invoice, date) => state.strategies.filter(strategy => strategy.status === 'active' && matchesScope(state, invoice, strategy) && matchesStage(state, invoice, stageForInvoice(state, invoice, strategy), date) && eligibleDate(invoice, strategy) <= date);
    function selectedStrategy(state, invoiceId, strategies, date) {
      if (strategies.length < 2) return strategies[0] || null;
      let conflict = state.conflicts.find(row => row.invoiceId === invoiceId);
      const ids = strategies.map(row => row.id).sort();
      if (!conflict) { conflict = {invoiceId, strategyIds:ids, selectedStrategyId:null, status:'unresolved', date}; state.conflicts.push(conflict); }
      else {
        const changed = JSON.stringify(ids) !== JSON.stringify([...conflict.strategyIds].sort());
        conflict.strategyIds = ids;
        if (changed || !ids.includes(conflict.selectedStrategyId)) { conflict.selectedStrategyId = null; conflict.status = 'unresolved'; }
      }
      return conflict.status === 'resolved' ? strategies.find(row => row.id === conflict.selectedStrategyId) : null;
    }
    function templateValidate(template, state) {
      if (template.sourceType === 'standard' && template.standardReady === false) fail('Load the standard Word template before using this letter.');
      if (!String(template.name || '').trim()) fail('Enter a letter template name.');
      if (!state.documentTypes.some(row => row.id === template.documentTypeId)) fail('Choose a Dunning document type.');
      if (!String(template.body || '').trim() || !String(template.emailSubject || '').trim() || !String(template.emailBody || '').trim()) fail('Complete the letter, email subject and email message.');
      const allowedCalculations = ['SUM(outstanding)','sumOutstanding'];
      const calculation = typeof template.calculation === 'string' ? template.calculation : template.calculation && template.calculation.totalOutstanding;
      if (template.calculation && typeof template.calculation === 'object' && Object.entries(template.calculation).some(([key,value]) => ({totalOutstanding:'sumOutstanding',originalTotal:'sumOriginalAmount',invoiceCount:'countInvoices'})[key] !== value)) fail('Choose a supported fixed calculation rule.');
      if (!allowedCalculations.includes(calculation)) fail('Choose the supported total outstanding calculation: sum of remaining invoice balances.');
      const placeholders = [...`${template.body} ${template.emailSubject} ${template.emailBody}`.matchAll(/\{\{\s*([\w.]+)\s*\}\}/g)].map(match => match[1]);
      placeholders.forEach(token => {
        if (!Object.prototype.hasOwnProperty.call(template.mappings || {}, token) || !FIELDS.includes(template.mappings[token])) fail(`Map the ${token} field to a supported data source.`);
      });
      Object.values(template.mappings || {}).forEach(value => { if (!FIELDS.includes(value)) fail('A template field mapping uses an unsupported data source.'); });
    }
    function strategyValidate(strategy, state, active) {
      if (!String(strategy.name || '').trim()) fail('Enter a strategy name.');
      if (!Number.isInteger(strategy.firstStageDays) || strategy.firstStageDays < 0 || strategy.firstStageDays > 3650) fail('First-letter duration must be a whole number between 0 and 3650 days.');
      if (!Array.isArray(strategy.stages) || !strategy.stages.length) fail('Add at least one letter stage.');
      if (strategy.stages.length > state.letterCount) fail(`Configure no more than ${state.letterCount} Dunning letter stage${state.letterCount === 1 ? '' : 's'}.`);
      strategy.stages.forEach((stage, index) => {
        if (!Number.isInteger(stage.intervalDays) || stage.intervalDays < (index ? 1 : 0) || stage.intervalDays > 3650) fail('Stage intervals must be whole days, with at least one day between later letters.');
        const template = state.templates.find(row => row.id === stage.templateId);
        if (!template) fail(`Choose a template for Letter ${index + 1}.`);
        if (Number(template.stageNumber || state.documentTypes.find(row => row.id === template.documentTypeId)?.stageNumber || 0) > state.letterCount) fail('This letter is above the configured number of Dunning letters.');
        if (active) templateValidate(template, state);
        if (stage.filters?.keyAccountFilter !== undefined && !['all','yes','no'].includes(stage.filters.keyAccountFilter)) fail('Choose a valid key account filter.');
        ['invoiceStatuses','invoiceBroadSelections','invoicePrimarySelections','agingBuckets'].forEach(key => {
          if (stage.filters?.[key] !== undefined && (!Array.isArray(stage.filters[key]) || stage.filters[key].some(value => typeof value !== 'string' || !value.trim()))) fail('Choose valid template filter selections.');
        });
        if (stage.filters?.agingBuckets?.some(value => !AGE_BOUNDS.some(([,label]) => label === value))) fail('Choose a valid aging bucket.');
      });
      ['customerIds','invoiceIds'].forEach(key => {
        const ids = strategy.filters?.[key];
        if (ids === undefined) return;
        const records = key === 'customerIds' ? state.customers : state.invoices;
        if (!Array.isArray(ids) || ids.some(id => typeof id !== 'string' || !id.trim())) fail('Choose valid customer or invoice selections.');
        if (ids.some(id => !records.some(record => record.id === id && record.clientId === strategy.clientId))) fail('A selected customer or invoice is outside this strategy’s client scope.');
      });
      if (strategy.filters?.coverage) {
        const coverage = strategy.filters.coverage;
        if (!['customer','invoice'].includes(coverage.targetType) || !['all','selected'].includes(coverage.targetMode)) fail('Choose valid strategy coverage.');
        if (coverage.targetMode === 'selected' && !strategy.filters[coverage.targetType === 'customer' ? 'customerIds' : 'invoiceIds']?.length) fail('Select at least one customer or invoice for this strategy.');
      }
      if (strategy.filters?.strategyMaster) {
        const target = strategy.filters.strategyMaster;
        if (!['customer','invoice'].includes(target.targetType) || !['all','selected'].includes(target.targetMode)) fail('Choose valid Strategy Master target selections.');
        ['selectedTargetIds','excludedTargetIds'].forEach(key => {
          if (target[key] !== undefined && (!Array.isArray(target[key]) || target[key].some(value => !['string','number'].includes(typeof value) || !String(value).trim()))) fail('Choose valid Strategy Master target selections.');
        });
      }
    }
    function refreshBatchDates(state, strategy) {
      state.batches.filter(batch => batch.strategyId === strategy.id && batch.status !== 'completed').forEach(batch => {
        if (batch.stage > strategy.stages.length) { batch.status = 'completed'; batch.nextDate = null; return; }
        const successful = batch.attempts.filter(attempt => attempt.status !== 'failed');
        const last = successful[successful.length - 1];
        if (last) batch.scheduledDate = addDays(last.date, strategy.stages[batch.stage - 1].intervalDays);
        else {
          const dates = batch.invoiceIds.map(id => state.invoices.find(invoice => invoice.id === id)).filter(Boolean).map(invoice => eligibleDate(invoice, strategy));
          batch.scheduledDate = dates.length ? dates.sort().pop() : batch.createdDate;
        }
        const failures = batch.attempts.filter(attempt => attempt.stage === batch.stage && attempt.status === 'failed');
        batch.nextDate = failures.length ? [batch.scheduledDate, addDays(failures[failures.length - 1].date, 1)].sort().pop() : batch.scheduledDate;
      });
    }
    function saveConfiguration(input, actor) {
      guard(actor, MANAGERS);
      if (!input || typeof input !== 'object' || Array.isArray(input)) fail('Provide the Dunning configuration.');
      const count = input.letterCount === undefined ? current.letterCount : input.letterCount;
      if (!Number.isSafeInteger(count) || count < 1 || count > MAX_LETTERS) fail(`Number of Dunning Letters must be a whole number between 1 and ${MAX_LETTERS}.`);
      if (input.enabled !== undefined && typeof input.enabled !== 'boolean') fail('Choose a valid Dunning Letters toggle value.');
      return transact(state => {
        const previousCount = state.letterCount;
        state.letterCount = count;
        if (input.enabled !== undefined) state.enabled = input.enabled;
        defaults(state);
        if (count < previousCount) {
          state.strategies.forEach(strategy => {
            // Sent snapshots remain independent of the strategy's remaining stages.
            strategy.stages = strategy.stages.slice(0, count);
            refreshBatchDates(state, strategy);
          });
        }
        return {enabled:state.enabled,letterCount:state.letterCount};
      });
    }
    function setEnabled(enabled, actor) {
      return saveConfiguration({enabled:Boolean(enabled)}, actor);
    }
    function setLetterCount(letterCount, actor) {
      return saveConfiguration({letterCount}, actor);
    }
    function addDocumentType(name, actor) {
      guard(actor, MANAGERS);
      const title = String(typeof name === 'object' ? name.name : name || '').trim();
      if (!title) fail('Enter a document type name.');
      return transact(state => {
        if (state.documentTypes.some(row => row.name.toLowerCase() === title.toLowerCase())) fail('This Dunning document type already exists.');
        const number = state.documentTypes.length + 1;
        if (number > state.letterCount) fail('Increase Number of Dunning Letters in Configurations before adding another letter.');
        const row = {id:`dunning-document-${number}`, name:title, stage:number, stageNumber:number};
        state.documentTypes.push(row); return row;
      });
    }
    function saveTemplate(input, actor) {
      guard(actor, MANAGERS);
      return transact(state => {
        const existing = input.id && state.templates.find(row => row.id === input.id);
        const template = Object.assign({}, existing || {}, clone(input));
        template.id = input.id || `dunning-template-custom-${state.revision + 1}`;
        template.body = input.letterHtml !== undefined ? input.letterHtml : input.body !== undefined ? input.body : template.body;
        template.letterHtml = template.body;
        template.mappings = clone(input.fieldMappings || input.mappings || template.mappings || DEFAULT_MAPPINGS);
        template.fieldMappings = clone(template.mappings);
        template.calculation = input.calculation || template.calculation || {totalOutstanding:'sumOutstanding'};
        templateValidate(template, state);
        template.updatedAt = new Date().toISOString();
        if (existing) state.templates[state.templates.indexOf(existing)] = template; else state.templates.push(template);
        return template;
      });
    }
    function saveStrategy(input, actor) {
      const person = guard(actor, MANAGERS);
      return transact(state => {
        const existing = input.id && state.strategies.find(row => row.id === input.id);
        if (existing) scope(person, existing);
        const strategy = Object.assign({clientId:person.clientId,subClientId:'',status:'draft',filters:{}}, existing || {}, clone(input));
        retireMinimumOutstanding([strategy]);
        strategy.id = input.id || `dunning-strategy-${state.revision + 1}`;
        scope(person, strategy);
        if (!['draft','active','paused','stopped'].includes(strategy.status)) fail('Choose a valid strategy status.');
        if (existing && existing.status === 'paused' && strategy.status === 'active') checkResume(state, existing, person);
        if (existing && existing.status === 'stopped' && strategy.status === 'active') fail('A stopped strategy cannot be restarted. Create a new strategy.');
        strategyValidate(strategy, state, strategy.status === 'active');
        if (strategy.status === 'active' && !state.enabled) fail('Enable Dunning Letters before activating a strategy.');
        if (existing) state.strategies[state.strategies.indexOf(existing)] = strategy; else state.strategies.push(strategy);
        refreshBatchDates(state, strategy);
        return strategy;
      });
    }
    function checkResume(state, strategy, person) {
      const date = person.date || person.now || state.lastRunDate || today();
      if (state.batches.some(batch => batch.strategyId === strategy.id && batch.nextDate && batch.nextDate < day(date) && !['completed','paid','empty'].includes(batch.status))) fail('Scheduling after a pause with missed dates is pending team confirmation.', 'PENDING_TEAM_CONFIRMATION');
    }
    function setStrategyStatus(id, status, actor) {
      const person = guard(actor, MANAGERS);
      const strategy = lookup(current, 'strategies', id);
      scope(person, strategy);
      return saveStrategy(Object.assign({}, strategy, {status:String(status).toLowerCase()}), person);
    }
    function excludeInvoice(invoiceId, actor) {
      const person = guard(actor, EXCLUDERS);
      return transact(state => {
        const invoice = lookup(state, 'invoices', invoiceId); scope(person, invoice);
        const existing = state.exclusions.find(row => row.invoiceId === invoiceId && row.active !== false);
        if (existing) return existing;
        const record = {invoiceId,excludedAt:person.date || today(),excludedBy:person.userId,role:person.role,active:true};
        state.exclusions.push(record); return record;
      });
    }
    function reinstateInvoice(invoiceId, actor) {
      const person = guard(actor, EXCLUDERS); scope(person, lookup(current, 'invoices', invoiceId));
      fail('Letter scheduling after removing an exclusion is pending team confirmation.', 'PENDING_TEAM_CONFIRMATION');
    }
    function resolveConflict(invoiceId, strategyId, actor) {
      const person = guard(actor, MANAGERS);
      return transact(state => {
        scope(person, lookup(state, 'invoices', invoiceId));
        const conflict = state.conflicts.find(row => row.invoiceId === invoiceId && row.status === 'unresolved');
        if (!conflict || !conflict.strategyIds.includes(strategyId)) fail('Choose one of the strategies in this invoice conflict.');
        scope(person, lookup(state, 'strategies', strategyId));
        conflict.selectedStrategyId = strategyId; conflict.status = 'resolved';
        const target = lookup(state, 'strategies', strategyId);
        const sourceBatches = state.batches.filter(batch => batch.invoiceIds.includes(invoiceId) && batch.strategyId !== strategyId && batch.status !== 'completed');
        sourceBatches.forEach(source => {
          // A selected strategy owns the remaining stages; sent letters and their captured membership stay intact.
          source.originalInvoiceIds = source.originalInvoiceIds || [...source.invoiceIds];
          source.invoiceIds = source.invoiceIds.filter(id => id !== invoiceId);
          if (!source.invoiceIds.length) { source.status='empty'; source.emptyReason='Remaining invoices moved to the selected strategy'; }
          const id = `dunning-batch-transfer-${state.revision + 1}-${invoiceId}-${strategyId}`;
          const moved = Object.assign({}, clone(source), {id,strategyId,invoiceIds:[invoiceId],originalInvoiceIds:[invoiceId],transferredFrom:source.id,status:source.stage > target.stages.length ? 'completed' : 'scheduled'});
          delete moved.emptyReason;
          if (moved.status === 'completed') moved.nextDate = null;
          state.batches.push(moved);
        });
        refreshBatchDates(state, target);
        return conflict;
      });
    }
    function updateInvoice(id, patch, actor) {
      const person = guard(actor, MANAGERS);
      return transact(state => {
        const invoice = lookup(state, 'invoices', id); scope(person, invoice);
        const supported = ['outstanding','outstandingAmount','dueDate'];
        if (Object.keys(patch).some(key => !supported.includes(key))) fail('Only the remaining balance and due date can be updated in this prototype.');
        const amount = patch.outstanding !== undefined ? Number(patch.outstanding) : patch.outstandingAmount !== undefined ? Number(patch.outstandingAmount) : invoice.outstanding;
        if (!Number.isFinite(amount) || amount < 0 || amount > invoice.originalAmount) fail('Remaining balance must be between zero and the original invoice amount.');
        invoice.outstanding = amount; invoice.outstandingAmount = amount;
        if (patch.dueDate) invoice.dueDate = day(patch.dueDate);
        return invoice;
      });
    }
    function syncInvoices(customers, actor) {
      const person = guard(actor, [...MANAGERS, 'agent']);
      if (!Array.isArray(customers)) fail('Provide customer invoice records.');
      return transact(state => {
        let count = 0;
        customers.forEach(input => {
          const customerId = String(input.id || input.customerId || '');
          if (!customerId) fail('Each imported customer needs an ID.');
          const existing = state.customers.find(row => row.id === customerId);
          if (existing) scope(person, existing);
          const customer = Object.assign({}, existing || {}, clone(input), {id:customerId,clientId:input.clientId || person.clientId,subClientId:input.subClientId || '',agentId:input.agentId || existing?.agentId || (person.role === 'agent' ? person.userId : 'demo-agent')});
          delete customer.invoices;
          customer.clientCode = String(input.clientCode ?? existing?.clientCode ?? '');
          customer.customerCode = String(input.customerCode ?? input.code ?? existing?.customerCode ?? existing?.code ?? '');
          scope(person, customer);
          customer.contacts = (input.contacts || existing?.contacts || []).map(contact => typeof contact === 'string' ? {name:'',email:contact} : contact);
          if (existing) state.customers[state.customers.indexOf(existing)] = customer; else state.customers.push(customer);
          (input.invoices || []).forEach(item => {
            const id = String(item.id || item.invoiceNo || '');
            if (!id) fail('Each imported invoice needs an ID.');
            const old = state.invoices.find(row => row.id === id);
            if (old) scope(person, old);
            const originalAmount = Number(item.originalAmount ?? item.amount ?? old?.originalAmount ?? 0);
            const outstanding = Number(item.outstanding ?? item.outstandingAmount ?? old?.outstanding ?? originalAmount);
            if (!Number.isFinite(originalAmount) || originalAmount < 0 || !Number.isFinite(outstanding) || outstanding < 0 || outstanding > originalAmount) fail('Imported invoice amounts are invalid.');
            const invoice = Object.assign({}, old || {}, clone(item), {id,invoiceNo:item.invoiceNo || old?.invoiceNo || id,customerId,clientId:customer.clientId,subClientId:customer.subClientId,agentId:item.agentId || customer.agentId,dueDate:day(item.dueDate || old?.dueDate),originalAmount,amount:originalAmount,outstanding,outstandingAmount:outstanding});
            scope(person, invoice);
            if (old) state.invoices[state.invoices.indexOf(old)] = invoice; else state.invoices.push(invoice);
            count += 1;
          });
        });
        return {invoicesSynced:count};
      });
    }
    function previewEligibility(strategyId, date, actor) {
      const person = guard(actor, MANAGERS);
      const strategy = lookup(current, 'strategies', strategyId); scope(person, strategy); date = day(date);
      return current.invoices.filter(invoice=>invoice.clientId===person.clientId).map(invoice => {
        let status = 'eligible', reason = 'Eligible for the next daily customer batch';
        const eligible = eligibleDate(invoice, strategy);
        const candidates = matching(current, invoice, date);
        if (!matchesScope(current,invoice,strategy) || !matchesStage(current,invoice,stageForInvoice(current,invoice,strategy),date)) { status='out-of-scope'; reason='Outside this strategy’s client, sub-client or filters'; }
        else if (Number(invoice.outstanding) <= 0) { status='paid'; reason='Fully paid'; }
        else if (excluded(current, invoice.id)) { status='excluded'; reason='Manually excluded until reinstatement is agreed'; }
        else if (eligible > date) { status='not-due'; reason=`Eligible on ${eligible}`; }
        else if (candidates.length > 1 && !current.conflicts.some(row => row.invoiceId===invoice.id && row.status==='resolved' && row.selectedStrategyId===strategy.id && JSON.stringify([...row.strategyIds].sort())===JSON.stringify(candidates.map(item=>item.id).sort()))) { status='conflict'; reason='Select one matching strategy before sending'; }
        else if (current.batches.some(batch => batch.invoiceIds.includes(invoice.id))) { status='assigned'; reason='Already belongs to a daily batch'; }
        return {invoice:clone(invoice),customer:clone(current.customers.find(row=>row.id===invoice.customerId) || {}),status,reason,eligibleDate:eligible,candidateStrategyIds:candidates.map(row=>row.id)};
      });
    }
    function renderTemplate(value, template, snapshot) {
      const customerCode = snapshot.customer.customerCode || snapshot.customer.code || snapshot.customerCode || '';
      const values = {'customer.name':snapshot.customer.name,'customer.address':snapshot.customer.address || '',invoices:'[Invoice annexure attached]',originalTotal:sum(snapshot.invoices.map(invoice=>invoice.originalAmount)).toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}),invoiceCount:snapshot.invoices.length,totalOutstanding:snapshot.totalOutstanding.toLocaleString('en-IN',{minimumFractionDigits:2,maximumFractionDigits:2}),date:snapshot.date,reference:snapshot.reference,previousReferences:snapshot.previousReferences.join(', ') || '—'};
      values['customer.code'] = customerCode;
      return String(value || '').replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_, token) => String(values[template.mappings[token]] ?? ''));
    }
    function catalogTemplate(template,state,strategy,stageNumber) {
      const adapter=host?.IneburaDunningTemplateAdapter||emailAdapter;
      const catalog=config.emailTemplates || host?.IneburaTemplateMasterSource;
      let saved;try{saved=JSON.parse(storage?.getItem('ineburaTemplateMaster:xeon:20261015:v1')||'null');}catch(_){/* Retain captured source when unrelated saved catalog is malformed. */}
      if(!adapter?.resolveEmailTemplate) {
        if(stageNumber>=4)fail('The email template renderer is unavailable. Reload this page before sending.');
        return template;
      }
      return adapter.resolveEmailTemplate(state,template,{sourceTemplates:catalog,savedRows:saved,stageNumber,stage3TemplateId:strategy.stages[2]?.templateId});
    }
    function runDaily(date, options) {
      const opts = options || {}, person = guard(opts.actor, MANAGERS); date = day(date);
      if (!['success','partial','failure'].includes(opts.outcome || 'success')) fail('Choose a valid simulated sending outcome.');
      if (!current.enabled) fail('Enable Dunning Letters before running eligibility.');
      if (current.lastRunDate && date < current.lastRunDate) fail('The simulation date cannot be earlier than the last daily run.');
      return transact(state => {
        const summary = {date,batchesCreated:0,emailsCreated:0,failures:0,conflicts:0};
        const active = state.strategies.filter(strategy=>strategy.status==='active' && strategy.clientId===person.clientId);
        active.forEach(strategy=>strategyValidate(strategy,state,true));
        const groups = new Map();
        state.invoices.filter(invoice=>invoice.clientId===person.clientId && invoice.outstanding>0 && !excluded(state,invoice.id)).forEach(invoice => {
          const candidates = matching(state,invoice,date);
          const strategy = selectedStrategy(state,invoice.id,candidates,date);
          if (!strategy || state.batches.some(batch=>batch.invoiceIds.includes(invoice.id))) return;
          const key = `${strategy.id}|${invoice.customerId}`;
          if (!groups.has(key)) groups.set(key,{strategy,customerId:invoice.customerId,invoiceIds:[]});
          groups.get(key).invoiceIds.push(invoice.id);
        });
        groups.forEach(group => {
          const id = `dunning-batch-${date}-${group.strategy.id}-${group.customerId}`;
          if (state.batches.some(batch=>batch.id===id)) return;
          state.batches.push({id,strategyId:group.strategy.id,customerId:group.customerId,createdDate:date,invoiceIds:group.invoiceIds,originalInvoiceIds:[...group.invoiceIds],stage:1,status:'scheduled',scheduledDate:date,nextDate:date,attempts:[],sentEmailIds:[],delayDays:0});
          summary.batchesCreated += 1;
        });
        state.batches.forEach(batch => {
          const strategy = active.find(row=>row.id===batch.strategyId);
          if (!strategy || batch.status==='completed') return;
          if (batch.stage > strategy.stages.length) {batch.status='completed';batch.nextDate=null;return;}
          const members = batch.invoiceIds.map(id=>state.invoices.find(invoice=>invoice.id===id)).filter(Boolean);
          const candidates = members.filter(invoice=>invoice.outstanding>0 && !excluded(state,invoice.id) && matchesScope(state,invoice,strategy) && matchesStage(state,invoice,strategy.stages[batch.stage-1],date));
          if (!candidates.length) {
            batch.status='empty';
            batch.emptyReason = !members.length ? 'Remaining invoices moved to the selected strategy' : members.every(invoice=>invoice.outstanding<=0) ? 'Fully paid' : members.every(invoice=>excluded(state,invoice.id) || invoice.outstanding<=0) ? 'All unpaid invoices are manually excluded' : 'No invoices match the current strategy filters';
            return;
          }
          if (batch.status==='empty') {batch.status='scheduled';delete batch.emptyReason;}
          const invoices = candidates.filter(invoice=>{
            const options = matching(state,invoice,date);
            if (options.length<2) return true;
            const selected = selectedStrategy(state,invoice.id,options,date);
            return selected && selected.id===strategy.id;
          });
          if (!invoices.length) {batch.status='blocked';batch.blockedReason='Select one matching strategy before sending';return;}
          if (batch.attempts.some(attempt=>attempt.date===date) || !batch.nextDate || batch.nextDate>date) return;
          const customer = lookup(state,'customers',batch.customerId);
          const template = catalogTemplate(lookup(state,'templates',strategy.stages[batch.stage-1].templateId),state,strategy,batch.stage);
          const reference = `DL-${date.replace(/-/g,'')}-${String(state.emails.length+1).padStart(6,'0')}`;
          const previous = batch.sentEmailIds.map(id=>state.emails.find(email=>email.id===id)).filter(Boolean);
          const snapshot = {template:clone(template),letterHtml:template.letterHtml,fieldMappings:clone(template.mappings),clientCode:customer.clientCode || '',clientName:customer.clientName || '',clientLogo:customer.clientLogo || '',subdomain:customer.subdomain || '',customerLinkToken:customer.customerLinkToken || '',customerCode:customer.customerCode || customer.code || '',customer:clone(customer),invoices:clone(invoices),amount:sum(invoices.map(invoice=>invoice.outstanding)),totalOutstanding:sum(invoices.map(invoice=>invoice.outstanding)),stageNumber:batch.stage,date,sentAt:`${date}T09:00:00+05:30`,reference,previousReference:previous.length?previous[previous.length-1].reference:null,previousReferences:previous.map(email=>email.reference),previousLetterDates:previous.map(email=>email.date),previousIssues:previous.map(email=>({reference:email.reference,date:email.date}))};
          const mailAdapter=host?.IneburaDunningTemplateAdapter||emailAdapter;
          if(template.emailTemplateSource){
            if(!mailAdapter)fail('The email template renderer is unavailable. Reload this page before sending.');
            const email=mailAdapter.renderEmail(template,snapshot);snapshot.subject=email.subject;snapshot.body=email.body;
          }else{snapshot.subject=renderTemplate(template.emailSubject,template,snapshot);snapshot.body=renderTemplate(template.emailBody,template,snapshot);}
          snapshot.renderedLetterHtml=renderTemplate(template.body,template,snapshot);
          if (host) {
            if (!host.IneburaDunningDocuments?.createPdf) fail('The letter PDF renderer is unavailable. Reload this page before running sending.');
            snapshot.pdfDataUri = host.IneburaDunningDocuments.createPdf(snapshot);
          }
          const to = [...new Set((customer.contacts || []).map(contact=>typeof contact==='string'?contact:contact.email).map(value=>String(value || '').trim()).filter(Boolean))];
          const recipientResults = to.map((email,index)=>({email,status:/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && opts.outcome!=='failure' && (opts.outcome!=='partial' || index===0)?'sent':'failed',reason:opts.outcome==='failure'?'Simulated delivery failure':!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)?'Invalid email address':opts.outcome==='partial' && index>0?'Simulated delivery failure':''}));
          const successes=recipientResults.filter(row=>row.status==='sent').length;
          const status=successes?successes===recipientResults.length?'sent':'partial':'failed';
          const email={id:`dunning-email-${state.revision+1}-${state.emails.length+1}`,batchId:batch.id,strategyId:strategy.id,stage:batch.stage,customerId:customer.id,date,to,recipientResults,subject:snapshot.subject,body:snapshot.body,status,letterSnapshot:snapshot,reference,simulated:true,failureReason:!to.length?'No customer contacts':status==='failed'?'No recipient succeeded':''};
          state.emails.push(email);summary.emailsCreated+=1;
          batch.attempts.push({emailId:email.id,stage:batch.stage,date,status});
          if (status==='failed') {batch.status='retry';batch.nextDate=addDays(date,1);summary.failures+=1;}
          else {
            batch.delayDays+=Math.max(0,daysBetween(batch.scheduledDate,date));batch.sentEmailIds.push(email.id);batch.stage+=1;
            if(batch.stage>strategy.stages.length){batch.status='completed';batch.nextDate=null;}
            else{batch.status='scheduled';batch.scheduledDate=addDays(date,strategy.stages[batch.stage-1].intervalDays);batch.nextDate=batch.scheduledDate;}
          }
          delete batch.blockedReason;
        });
        summary.conflicts=state.conflicts.filter(row=>row.status==='unresolved').length;
        state.lastRunDate=date;
        state.runs.push(Object.assign({},summary,{outcome:opts.outcome||'success'}));
        return summary;
      });
    }
    return {KEY,VERSION,normalizeRole,addDays,getContext,getState:()=>clone(current),subscribe(listener){listeners.add(listener);return()=>listeners.delete(listener);},setEnabled,setLetterCount,saveConfiguration,addDocumentType,saveTemplate,saveStrategy,setStrategyStatus,excludeInvoice,reinstateInvoice,resolveConflict,updateInvoice,syncInvoices,previewEligibility,runDaily};
  }
  return Object.assign(createInstance(), {createInstance,KEY,VERSION,normalizeRole,addDays,DEFAULT_MAPPINGS:clone(DEFAULT_MAPPINGS),SUPPORTED_FIELDS:[...FIELDS]});
});
