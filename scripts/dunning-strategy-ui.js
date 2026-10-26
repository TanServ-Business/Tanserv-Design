/* Compatibility adapter for saved Strategy Master Dunning payloads. */
(function (root, factory) {
  'use strict';
  const adapter = factory();
  if (typeof module === 'object' && module.exports) module.exports = adapter;
  else root.IneburaDunningStrategyAdapter = adapter;
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const ATTACHMENT = 'Dunning letter + annexure (PDF)';
  const AGING = ['1-30','31-45','46-60','61-90','91-120','121-150','151-180','181-210','211-240','241-270','271-300','301-330','331-365','1-2 yrs','2-3 yrs','3-4 yrs','4-5 yrs','5+ yrs'];
  const SUB_STATUSES = ['Funds Issue','As Per Payment Terms','Part Payment Made','Call Back','Call Back/Email','Customer deduction','Contact But No RPC','Number Always Busy','Customer Visit Required','Recommended For Legal','Send Pre-Legal Letter'];
  const clone = value => JSON.parse(JSON.stringify(value));
  const list = value => Array.isArray(value) ? value : [];
  const unique = value => [...new Set(list(value).map(String))];
  const stateOf = core => core && typeof core.getState === 'function' ? core.getState() : core || {};
  const text = value => String(value == null ? '' : value);
  const first = (...values) => values.find(value => value !== undefined && value !== null && value !== '');
  const STATUS_ALIASES = {'Within Credit Period':'Within Credit Period/Days','Call Back/Email':'Call Back/Email Follow up','Wrong Billing':'Wrong/Incorrect Billing','PO Copy Required':'PO (Purchase Order) Copy Required'};

  function iso(value) {
    const raw = text(value).trim();
    if (/^\d{4}-\d{2}-\d{2}/.test(raw)) return raw.slice(0,10);
    const numeric = raw.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);
    if (numeric) return `${numeric[3]}-${numeric[2].padStart(2,'0')}-${numeric[1].padStart(2,'0')}`;
    const parsed = new Date(raw);
    if (!raw || Number.isNaN(+parsed)) return '';
    return `${parsed.getFullYear()}-${String(parsed.getMonth()+1).padStart(2,'0')}-${String(parsed.getDate()).padStart(2,'0')}`;
  }

  function normalizedCustomers(customers, enrichedInvoices, data, clientId) {
    return list(customers).map(source => {
      const code = text(first(source.customerCode, source.code, source.id));
      const matches = list(data.customers).filter(row => row.clientId === clientId && (text(row.customerCode || row.code) === code || row.id === source.id));
      if (matches.length > 1) throw new Error(`Customer ${code} matches more than one Dunning customer.`);
      const oldCustomer = matches[0];
      const id = oldCustomer?.id || `workspace-customer-${code}`;
      const keyAccount = first(source.strategyMasterKeyAccount, source.keyAccount, source.isKeyAccount);
      return {
        id, clientId:source.clientId || clientId, name:source.name || source.customerName || oldCustomer?.name || code,
        customerCode:code, strategyMasterCustomerId:text(source.id || code),
        subClientId:source.subClientId || oldCustomer?.subClientId || '',
        address:source.address || source.billToAddress || oldCustomer?.address || '',
        ...(source.clientCode !== undefined ? {clientCode:source.clientCode} : {}),
        ...(source.agentId ? {agentId:source.agentId} : {}),
        ...(Array.isArray(source.contacts) ? {contacts:clone(source.contacts)} : {}),
        ...(keyAccount !== undefined ? {strategyMasterKeyAccount:keyAccount} : {}),
        invoices:list(source.invoices).map(invoice => {
          const invoiceNo = text(invoice.invoiceNo || invoice.id);
          const matches = list(data.invoices).filter(row => row.clientId === clientId && text(row.invoiceNo) === invoiceNo);
          if (matches.length > 1) throw new Error(`Invoice ${invoiceNo} matches more than one Dunning invoice.`);
          const old = matches[0];
          const enriched = list(enrichedInvoices).find(row => text(row.invoiceNo) === invoiceNo && (!row.customerId || text(row.customerId) === text(source.id))) || {};
          const originalAmount = first(invoice.originalAmount, invoice.invoiceAmount, invoice.invoiceValue, invoice.amount, old?.originalAmount);
          if (originalAmount === undefined) throw new Error(`Invoice ${invoiceNo} needs its invoice amount before saving a Dunning strategy.`);
          const outstanding = first(invoice.netDueAmount, invoice.outstanding, invoice.outstandingAmount, invoice.netDue, old?.outstanding, originalAmount);
          const dueDate = iso(first(invoice.dueDate, invoice.invoiceDueDate, invoice.customerDueDate, old?.dueDate));
          if (!dueDate) throw new Error(`Invoice ${invoiceNo} needs its due date before saving a Dunning strategy.`);
          const status = text(first(invoice.strategyMasterSubStatus, invoice.subStatus, enriched.strategyMasterSubStatus, enriched.subStatus)).trim();
          const account = first(invoice.strategyMasterKeyAccount, invoice.keyAccount, invoice.isKeyAccount);
          return {
            id:old?.id || `workspace-invoice-${invoiceNo}`, invoiceNo, dueDate,
            originalAmount:Number(originalAmount), outstanding:Number(outstanding),
            strategyMasterInvoiceId:invoiceNo, strategyMasterCustomerId:text(source.id || code),
            ...(status ? {strategyMasterSubStatus:STATUS_ALIASES[status] || status} : {}),
            ...(account !== undefined ? {strategyMasterKeyAccount:account} : {}),
            ...(invoice.agentId ? {agentId:invoice.agentId} : {})
          };
        })
      };
    });
  }

  function catalog(state) {
    const data = stateOf(state);
    const types = new Map(list(data.documentTypes).map(type => [type.id, type]));
    const templates = list(data.templates).filter(template => {
      const stage = Number(template.stageNumber || types.get(template.documentTypeId)?.stageNumber || types.get(template.documentTypeId)?.stage);
      return Number.isInteger(stage) && stage > 0;
    }).map(template => {
      const type = types.get(template.documentTypeId) || {};
      return {id:template.id,label:template.name || type.name || `Dunning Letter ${template.stageNumber || type.stageNumber || type.stage}`,stageNumber:Number(template.stageNumber || type.stageNumber || type.stage)};
    });
    if (!data.enabled) {
      for (let number = 1; number <= 3; number += 1) {
        if (!templates.some(template => template.stageNumber === number)) templates.push({id:`dunning-template-${number}`,label:`Dunning Letter ${number}`,stageNumber:number});
      }
    }
    return templates.sort((a, b) => a.stageNumber - b.stageNumber || a.label.localeCompare(b.label)).map(template => ({
      ...template, isDunning:true, supportedModes:['custom'], supportedTimings:['after'],
      allowedDispositionGroups:['due_reminder','contactability','legal'], defaultDispositionGroups:['due_reminder'],
      allowedSubStatuses:[...SUB_STATUSES], defaultSubStatuses:['Funds Issue','Part Payment Made','Call Back/Email'],
      defaultInvoiceStatuses:['Overdue'], defaultAgingBuckets:[...AGING]
    }));
  }

  function entries(payload, core) {
    const byId = new Map(catalog(core).map(template => [template.id, template]));
    const known = new Set(list(stateOf(core).strategies).flatMap(strategy => list(strategy.stages).map(stage => stage.templateId)));
    return list(payload?.templates).filter(entry => byId.has(entry.templateId) || known.has(entry.templateId) || /^dunning-template-/.test(text(entry.templateId))).map(entry => ({entry,template:byId.get(entry.templateId)}));
  }

  function validate(payload, core) {
    const selected = entries(payload, core);
    if (!selected.length) return '';
    const data = stateOf(core);
    if (!data.enabled) return 'Enable Dunning Letters in Module Configuration before saving its templates.';
    if (payload.reminderType !== 'post_due') return 'Dunning Letters require the Post Due reminder type.';
    if (!['customer','invoice'].includes(payload.targetType)) return 'Choose a customer or invoice target for Dunning Letters.';
    if (!['all','selected'].includes(payload.targetMode)) return 'Choose target coverage for Dunning Letters.';
    if (payload.targetMode === 'selected' && !list(payload.selectedTargetIds).length) return 'Select at least one target for Dunning Letters.';
    for (const [index, item] of selected.entries()) {
      const {entry, template} = item;
      if (!template || !list(data.templates).some(row => row.id === entry.templateId)) return 'A selected Dunning Letter template is no longer available. Select an existing template.';
      if (template.stageNumber !== index + 1) return 'Add Dunning Letter templates in order from Letter 1, without missing or duplicate stages.';
      if (entry.notificationMode !== 'custom') return `Dunning Letter ${index + 1} requires Custom notification mode.`;
      if (list(entry.reminderSteps).length !== 1) return `Dunning Letter ${index + 1} requires one reminder step. Add the next letter using Add Template.`;
      const step = entry.reminderSteps[0];
      if (step.when !== 'after') return `Dunning Letter ${index + 1} must use after timing.`;
      if (!Number.isInteger(Number(step.days)) || Number(step.days) < 1 || Number(step.days) > 365) return `Enter a whole number of days from 1 to 365 for Dunning Letter ${index + 1}.`;
      if (list(step.attachments).length !== 1 || step.attachments[0] !== ATTACHMENT) return `Select ${ATTACHMENT} as the attachment for Dunning Letter ${index + 1}.`;
    }
    return '';
  }

  function scopeFilters(payload, data, customers, enrichedInvoices, clientId) {
    const coreCustomers = list(data.customers).filter(customer => !customer.clientId || customer.clientId === clientId);
    const coreInvoices = list(data.invoices).filter(invoice => !invoice.clientId || invoice.clientId === clientId);
    const resolve = (value, type) => {
      const key = text(value);
      const rows = type === 'customer' ? coreCustomers : coreInvoices;
      const direct = rows.filter(row => text(row.id) === key);
      if (direct.length === 1) return direct[0].id;
      let matches;
      if (type === 'customer') {
        const source = list(customers).find(customer => text(customer.id) === key || text(customer.code) === key);
        const code = text(source?.customerCode || source?.code || key);
        matches = rows.filter(customer => text(customer.customerCode || customer.code) === code);
      } else {
        const source = list(enrichedInvoices).find(invoice => text(invoice.id) === key || text(invoice.invoiceNo) === key);
        const number = text(source?.invoiceNo || key);
        matches = rows.filter(invoice => text(invoice.invoiceNo) === number);
      }
      if (matches.length !== 1) throw new Error(`The selected ${type} ${key} is not uniquely available in Dunning Letters. Refresh its invoice data before saving.`);
      return matches[0].id;
    };
    const selected = unique(payload.selectedTargetIds);
    const excluded = unique(payload.excludedTargetIds);
    const selectedIds = payload.targetMode === 'selected' ? selected.map(id => resolve(id, payload.targetType)) : [];
    const excludedIds = payload.targetMode === 'all' ? excluded.map(id => resolve(id, payload.targetType)) : [];
    return {
      targetType:payload.targetType, targetMode:payload.targetMode,
      selectedTargetIds:selected, excludedTargetIds:excluded,
      selectedCustomerIds:payload.targetType === 'customer' ? selectedIds : [],
      excludedCustomerIds:payload.targetType === 'customer' ? excludedIds : [],
      selectedInvoiceIds:payload.targetType === 'invoice' ? selectedIds : [],
      excludedInvoiceIds:payload.targetType === 'invoice' ? excludedIds : []
    };
  }

  function stageFilters(entry) {
    return {
      keyAccountFilter:entry.keyAccountFilter || 'all',
      invoiceStatuses:unique(entry.invoiceStatuses),
      invoiceBroadSelections:unique(entry.invoiceBroadSelections),
      invoicePrimarySelections:unique(entry.invoicePrimarySelections),
      agingBuckets:unique(entry.agingBuckets),
      dispositionGroups:unique(entry.dispositionGroups), subStatuses:unique(entry.subStatuses)
    };
  }

  function save(payload, core, customers, enrichedInvoices) {
    if (!core || typeof core.saveStrategy !== 'function') throw new Error('Dunning Letters is still loading. Please try again.');
    const error = validate(payload, core);
    if (error) throw new Error(error);
    const selected = entries(payload, core);
    const data = core.getState();
    const previous = list(data.strategies).find(strategy => strategy.id === payload.id);
    if (!selected.length) {
      if (!previous) return null;
      return core.saveStrategy({...previous,status:'stopped',strategyMasterDeleted:true,strategyMasterDetached:true,strategyMasterPayload:clone(payload)});
    }
    const context = core.getContext();
    if (context.role !== 'client-admin') throw new Error('Your role does not have permission for this Dunning Letters action.');
    if (previous?.clientId && previous.clientId !== context.clientId) throw new Error('This record is outside your client scope.');
    const records = normalizedCustomers(customers, enrichedInvoices, data, context.clientId);
    const pendingCustomers = records.map(({invoices, ...customer}) => customer);
    const pendingInvoices = records.flatMap(customer => customer.invoices.map(invoice => ({...invoice,customerId:customer.id,clientId:customer.clientId})));
    const prospective = {
      ...data,
      customers:[...list(data.customers).filter(row => !pendingCustomers.some(next => next.id === row.id)),...pendingCustomers],
      invoices:[...list(data.invoices).filter(row => !pendingInvoices.some(next => next.id === row.id)),...pendingInvoices]
    };
    const coverage = scopeFilters(payload, prospective, customers, enrichedInvoices, context.clientId);
    const status = payload.status === 'active' ? 'active' : previous?.status === 'stopped' ? 'stopped' : 'paused';
    if (records.length) core.syncInvoices(records);
    return core.saveStrategy({
      ...(previous || {}), id:payload.id, name:payload.strategyName,
      clientId:previous?.clientId || context.clientId,
      status, firstStageDays:Number(selected[0].entry.reminderSteps[0].days),
      stages:selected.map(({entry}, index) => ({templateId:entry.templateId,intervalDays:index ? Number(entry.reminderSteps[0].days) : 0,filters:stageFilters(entry)})),
      filters:{...(previous?.filters || {}), strategyMaster:coverage},
      strategyMasterPayload:clone(payload), strategyMasterDeleted:false, strategyMasterDetached:false
    });
  }

  function projectedEntry(stage, index, strategy, previous) {
    const filters = stage.filters || {};
    return {
      ...(previous || {}), uid:previous?.uid || `dunning_${strategy.id}_${index + 1}`,
      templateId:stage.templateId, notificationMode:'custom', keyAccountFilter:filters.keyAccountFilter || previous?.keyAccountFilter || 'all',
      reminderSteps:[{uid:previous?.reminderSteps?.[0]?.uid || `dunning_step_${strategy.id}_${index + 1}`, days:index ? Number(stage.intervalDays) : Number(strategy.firstStageDays), when:'after', attachments:[ATTACHMENT]}],
      ongoingInterval:'', ongoingAttachments:[],
      invoiceStatuses:clone(filters.invoiceStatuses || previous?.invoiceStatuses || ['Overdue']),
      invoiceBroadSelections:clone(filters.invoiceBroadSelections || previous?.invoiceBroadSelections || []),
      invoicePrimarySelections:clone(filters.invoicePrimarySelections || previous?.invoicePrimarySelections || []),
      invoiceStatusUi:clone(previous?.invoiceStatusUi || {broadOpen:[],primaryOpen:[]}),
      agingBuckets:clone(filters.agingBuckets || previous?.agingBuckets || AGING),
      dispositionGroups:clone(filters.dispositionGroups || previous?.dispositionGroups || ['due_reminder']),
      subStatuses:clone(filters.subStatuses || previous?.subStatuses || ['Funds Issue','Part Payment Made','Call Back/Email'])
    };
  }

  function existing(core) {
    if (!core || typeof core.getState !== 'function') return [];
    const data = core.getState();
    const clientId = core.getContext().clientId;
    const ids = new Set(catalog(data).map(template => template.id));
    return list(data.strategies).filter(strategy => !strategy.strategyMasterDeleted && (!strategy.clientId || strategy.clientId === clientId)).map(strategy => {
      const saved = clone(strategy.strategyMasterPayload || {});
      const oldDunning = list(saved.templates).filter(entry => ids.has(entry.templateId) || /^dunning-template-/.test(text(entry.templateId)));
      const rebuilt = list(strategy.stages).map((stage, index) => projectedEntry(stage, index, strategy, oldDunning[index]));
      let index = 0;
      const templates = list(saved.templates).map(entry => ids.has(entry.templateId) || /^dunning-template-/.test(text(entry.templateId)) ? rebuilt[index++] : entry).filter(Boolean);
      templates.push(...rebuilt.slice(index));
      const coverage = strategy.filters?.strategyMaster;
      return {
        ...saved, id:strategy.id, strategyName:strategy.name, status:strategy.status === 'active' ? 'active' : 'inactive',
        reminderType:'post_due', targetType:coverage?.targetType || saved.targetType || 'invoice',
        targetMode:coverage?.targetMode || saved.targetMode || 'all',
        selectedTargetIds:clone(coverage?.selectedTargetIds || saved.selectedTargetIds || []),
        excludedTargetIds:clone(coverage?.excludedTargetIds || saved.excludedTargetIds || []),
        templates, updatedAt:saved.updatedAt || ''
      };
    });
  }

  function remove(id, core) {
    const strategy = list(core?.getState?.().strategies).find(row => row.id === id);
    if (!strategy) return null;
    return core.saveStrategy({...strategy,status:'stopped',strategyMasterDeleted:true,strategyMasterDetached:false});
  }

  return {ATTACHMENT,catalog,validate,save,existing,remove};
});
