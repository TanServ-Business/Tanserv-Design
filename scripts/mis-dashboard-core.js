/* Scoped, read-only MIS dashboard preview. Synthetic facts are joined by stable
   invoice IDs; captured report samples never establish access or assignments. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./mis-access-core.js'));
  else root.IneburaMisDashboard = factory(root.IneburaMisCore);
})(typeof window !== 'undefined' ? window : globalThis, function (core) {
  'use strict';
  const own = (object, key) => !!object && Object.prototype.hasOwnProperty.call(object, key);
  const text = value => String(value ?? '');
  const unique = values => [...new Set(values)];
  const number = value => typeof value === 'number' && Number.isFinite(value) && value >= 0;
  const ratio = (part, whole) => whole > 0 ? part / whole * 100 : null;
  const round = value => Math.round((value + Number.EPSILON) * 100) / 100;
  const commonHeaders = ['Invoice Number', 'Client', 'Subclient', 'Assigned To', 'Customer', 'Invoice Date'];
  const modes = [{id:'manual',name:'Manual'}, {id:'automated',name:'Automated'}, {id:'external',name:'External'}, {id:'unspecified',name:'Not specified'}];
  const definitions = {
    odm: {name:'ODM Report', headers:['Invoice Status', 'Outstanding Amount']},
    credit: {name:'Credit Report', headers:['Credit Allocation ID', 'Credit Used', 'Credit Balance', 'Total Credit']},
    achievement: {name:'Achievement Report', headers:['Committed Amount', 'Achieved Amount', 'Achievement %']},
    submission: {name:'Submission Report', headers:['Submission Status', 'Submission Mode']},
    acknowledgement: {name:'Invoice Submission vs Acknowledgement', headers:['Submission Status', 'Acknowledgement Status']},
    issues: {name:'Issue Tracker Report', headers:['Issue Count', 'Resolved Issue Count', 'Open Issue Count', 'Invoice Issue Status']}
  };
  function freeze(value) {
    if (value && typeof value === 'object' && !Object.isFrozen(value)) {
      Object.values(value).forEach(freeze);
      Object.freeze(value);
    }
    return value;
  }
  // These explicit facts belong only to the seven isolated hierarchy fixtures.
  // New invoices have no dashboard facts until they are supplied deliberately.
  const sampleFacts = freeze({
    'inv-1': {odmStatus:'tracking', committedAmount:90000, achievedAmount:72000, submissionStatus:'submitted', submissionMode:'automated', acknowledged:true, credit:{allocationId:'credit-allocation-inv-1',used:18000,balance:7000}, issues:[{id:'issue-inv-1-a',status:'resolved'}]},
    'inv-2': {odmStatus:'untouched', committedAmount:60000, achievedAmount:0, submissionStatus:'not-submitted', submissionMode:'manual', acknowledged:false, credit:{allocationId:'credit-allocation-inv-2',used:6000,balance:14000}, issues:[{id:'issue-inv-2-a',status:'open'}]},
    'inv-3': {odmStatus:'tracking', committedAmount:45000, achievedAmount:36000, submissionStatus:'submitted', submissionMode:'external', acknowledged:false, credit:{allocationId:'credit-allocation-inv-3',used:9000,balance:3000}, issues:[]},
    'inv-4': {odmStatus:'collected', committedAmount:50000, achievedAmount:55000, submissionStatus:'submitted', submissionMode:'manual', acknowledged:true, credit:{allocationId:'credit-allocation-inv-4',used:12000,balance:8000}, issues:[{id:'issue-inv-4-a',status:'resolved'},{id:'issue-inv-4-b',status:'resolved'}]},
    'inv-5': {odmStatus:'tracking', committedAmount:65000, achievedAmount:42000, submissionStatus:'submitted', submissionMode:'automated', acknowledged:false, credit:{allocationId:'credit-allocation-inv-5',used:8000,balance:2000}, issues:[{id:'issue-inv-5-a',status:'resolved'},{id:'issue-inv-5-b',status:'open'}]},
    'inv-6': {odmStatus:'untouched', committedAmount:40000, achievedAmount:12000, submissionStatus:'not-submitted', submissionMode:'external', acknowledged:false, credit:{allocationId:'credit-allocation-inv-6',used:4000,balance:6000}, issues:[]},
    'inv-7': {odmStatus:'collected', committedAmount:30000, achievedAmount:30000, submissionStatus:'submitted', submissionMode:'external', acknowledged:true, credit:{allocationId:'credit-allocation-inv-7',used:5000,balance:0}, issues:[{id:'issue-inv-7-a',status:'resolved'}]}
  });
  function day(value) {
    if (value instanceof Date) {
      if (!Number.isFinite(value.getTime())) return '';
      return `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,'0')}-${String(value.getDate()).padStart(2,'0')}`;
    }
    const match = text(value).match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return '';
    const parsed = new Date(Date.UTC(+match[1], +match[2]-1, +match[3]));
    return parsed.getUTCFullYear() === +match[1] && parsed.getUTCMonth() === +match[2]-1 && parsed.getUTCDate() === +match[3] ? match[0] : '';
  }
  function readPeriod(input = {}) {
    if (!input || typeof input !== 'object' || Array.isArray(input)) throw new Error('Select a valid invoice date range.');
    const period = input && typeof input === 'object' ? input : {};
    const start = period.start == null || period.start === '' ? '' : day(period.start);
    const end = period.end == null || period.end === '' ? '' : day(period.end);
    if ((period.start != null && period.start !== '' && !start) || (period.end != null && period.end !== '' && !end)) throw new Error('Select a valid invoice date range.');
    if (start && end && start > end) throw new Error('Start date must be on or before the end date.');
    return {start,end};
  }
  function emptyMetrics(id) {
    if (id === 'odm') return {untouched:0,tracking:0,collected:0,total:0};
    if (id === 'credit') return {used:0,balance:0,total:0,usagePercent:null,allocationCount:0};
    if (id === 'achievement') return {committed:0,achieved:0,remaining:0,achievementPercent:null};
    if (id === 'submission') return {submitted:0,notSubmitted:0,total:0,modes:modes.map(mode=>({...mode,submitted:0,notSubmitted:0,total:0}))};
    if (id === 'acknowledgement') return {submitted:0,acknowledged:0,pending:0,acknowledgementPercent:null};
    return {withIssues:0,resolved:0,unresolved:0,withoutIssues:0,total:0};
  }
  function card(id, invoiceCount, authorized) {
    return {id,name:definitions[id].name,available:!!authorized && invoiceCount === 0,complete:!!authorized && invoiceCount === 0,missingCount:invoiceCount,coveredCount:0,invoiceCount,metrics:emptyMetrics(id),headers:[...commonHeaders,...definitions[id].headers],rows:[],invoiceIds:[]};
  }
  function denied(userId, reason) {
    return {authorized:false,reason,userId:text(userId),userName:'',userRole:'',scopeKind:'',scopeSummary:'',filterOptions:{kind:'subclients',label:'Subclients',items:[]},selectedIds:[],allSelected:false,visibleInvoiceIds:[],selectedInvoiceIds:[],visibleCount:0,selectedCount:0,period:{start:'',end:''},filterValidation:{valid:false,invalidKind:false,unknownIds:[],invalidIds:false,provided:false},cards:Object.fromEntries(Object.keys(definitions).map(id=>[id,card(id,0,false)]))};
  }
  function scopeUsers(state, person) {
    const role = core.userRole(person.role);
    const reports = role === 'mis' ? [person] : state.users.filter(user=>core.isActive(user) && core.userRole(user.role)==='mis' && user.managerId===person.id);
    // Invalid mappings fail closed, including corrupt scopes under a manager.
    reports.forEach(user=>core.validateAccess(state,core.cleanAccess(user.access)));
    return reports;
  }
  function optionsFor(state, reports, visible, person) {
    const scopes = reports.map(user=>core.cleanAccess(user.access));
    const assignees = scopes.length ? scopes.every(scope=>scope.mode==='assignees') : core.cleanAccess(person.access)?.mode==='assignees';
    const kind = assignees ? 'assignees' : 'subclients';
    const ids = new Set();
    if (assignees) scopes.forEach(scope=>scope.assigneeIds.forEach(id=>ids.add(text(id))));
    else scopes.forEach(scope=>{
      if (scope.mode === 'subclients') scope.subclientIds.forEach(id=>ids.add(text(id)));
      if (scope.mode === 'client') state.subclients.filter(sub=>sub.clientId===scope.clientId).forEach(sub=>ids.add(text(sub.id)));
      // A mixed manager uses subclient filters. Preserve an assignee scope's
      // explicitly saved subclient constraints even while they have no invoices.
      if (scope.mode === 'assignees') (scope.subclientIds || []).forEach(id=>ids.add(text(id)));
    });
    // For mixed manager scopes, agent-derived subclients are useful filters but
    // derive only from authorized rows after both scope levels; these filters
    // never grant their other invoices or widen a report's saved intersection.
    if (!assignees) visible.forEach(invoice=>{if (invoice.subclientId) ids.add(text(invoice.subclientId));});
    const clients = new Map(state.clients.map(client=>[text(client.id),text(client.name || client.id)]));
    const source = assignees ? state.users : state.subclients;
    const items = source.filter(item=>ids.has(text(item.id))).map(item=>({id:text(item.id),name:assignees ? text(item.name || item.id) : `${clients.get(text(item.clientId)) || text(item.clientId)} / ${text(item.name || item.id)}`}));
    return {kind,label:assignees?'Agents':'Subclients',items};
  }
  function selectionFor(input, options) {
    const provided = input != null;
    const filter = input && typeof input === 'object' && !Array.isArray(input) ? input : {};
    const invalidKind = (provided && (typeof input !== 'object' || Array.isArray(input))) || (filter.kind != null && filter.kind !== options.kind);
    const invalidIds = filter.ids != null && !Array.isArray(filter.ids);
    const allowed = options.items.map(item=>item.id), allowedSet = new Set(allowed);
    const requested = filter.ids == null ? allowed : Array.isArray(filter.ids) ? unique(filter.ids.map(text)) : [];
    const unknownIds = requested.filter(id=>!allowedSet.has(id));
    const selectedIds = invalidKind || invalidIds ? [] : requested.filter(id=>allowedSet.has(id));
    return {selectedIds,allSelected:!invalidKind && !invalidIds && selectedIds.length===allowed.length,allRequested:!invalidKind && !invalidIds && filter.ids==null,filterValidation:{valid:!invalidKind && !invalidIds && unknownIds.length===0,invalidKind:!!invalidKind,invalidIds,unknownIds,provided}};
  }
  function prefix(invoice, maps) {
    return [text(invoice.invoiceNo),maps.clients.get(text(invoice.clientId)) || text(invoice.clientId),maps.subclients.get(text(invoice.subclientId)) || text(invoice.subclientId),maps.users.get(text(invoice.assigneeId)) || text(invoice.assigneeId),text(invoice.customerName),day(invoice.invoiceDate)];
  }
  function add(card, invoice, values, maps) {
    card.coveredCount++;
    card.rows.push([...prefix(invoice,maps),...values]);
    card.invoiceIds.push(text(invoice.id));
  }
  function submission(fact) {
    if (!fact || !['submitted','not-submitted'].includes(fact.submissionStatus)) return null;
    const mode = modes.find(item=>item.id===fact.submissionMode)?.id || 'unspecified';
    return {submitted:fact.submissionStatus==='submitted',mode};
  }
  function issueCounts(fact) {
    if (!fact || !Array.isArray(fact.issues)) return null;
    const issues = new Map();
    for (const issue of fact.issues) {
      if (!issue || !text(issue.id).trim() || !['open','resolved'].includes(issue.status)) return null;
      const previous = issues.get(text(issue.id));
      if (previous && previous !== issue.status) return null;
      issues.set(text(issue.id),issue.status);
    }
    const resolved = [...issues.values()].filter(status=>status==='resolved').length;
    return {total:issues.size,resolved,open:issues.size-resolved};
  }
  function makeCards(invoices, facts, state) {
    const cards = Object.fromEntries(Object.keys(definitions).map(id=>[id,card(id,invoices.length,true)]));
    const lookup = rows=>new Map(rows.map(item=>[text(item.id),text(item.name || item.id)]));
    const maps = {clients:lookup(state.clients),subclients:lookup(state.subclients),users:lookup(state.users)};
    const credits = new Map(), conflictingCredits = new Set();
    for (const invoice of invoices) {
      const fact = own(facts,invoice.id) ? facts[invoice.id] : null;
      const credit = fact?.credit;
      if (!credit || !text(credit.allocationId).trim() || !number(credit.used) || !number(credit.balance)) continue;
      const id = text(credit.allocationId), existing = credits.get(id);
      if (existing && (existing.used!==credit.used || existing.balance!==credit.balance)) conflictingCredits.add(id);
      if (!existing) credits.set(id,{used:credit.used,balance:credit.balance});
    }
    const seenCredits = new Set();
    for (const invoice of invoices) {
      const fact = own(facts,invoice.id) ? facts[invoice.id] : null;
      if (!fact || typeof fact !== 'object') continue;
      if (['untouched','tracking','collected'].includes(fact.odmStatus)) {
        const target = cards.odm;
        target.metrics[fact.odmStatus]++; target.metrics.total++;
        add(target,invoice,[fact.odmStatus,number(invoice.outstanding)?invoice.outstanding:''],maps);
      }
      const credit = fact.credit;
      if (credit && text(credit.allocationId).trim() && number(credit.used) && number(credit.balance) && !conflictingCredits.has(text(credit.allocationId))) {
        const target = cards.credit, allocationId = text(credit.allocationId);
        // An allocation repeated on multiple visible rows contributes once.
        target.coveredCount++;
        if (!seenCredits.has(allocationId)) {
          seenCredits.add(allocationId);
          target.metrics.used += credit.used; target.metrics.balance += credit.balance; target.metrics.allocationCount++;
          target.rows.push([...prefix(invoice,maps),allocationId,credit.used,credit.balance,round(credit.used+credit.balance)]);
          target.invoiceIds.push(text(invoice.id));
        }
      }
      if (number(fact.committedAmount) && number(fact.achievedAmount)) {
        const target = cards.achievement;
        target.metrics.committed += fact.committedAmount; target.metrics.achieved += fact.achievedAmount;
        add(target,invoice,[fact.committedAmount,fact.achievedAmount,ratio(fact.achievedAmount,fact.committedAmount) ?? ''],maps);
      }
      const submitted = submission(fact);
      if (submitted) {
        const target = cards.submission, key = submitted.submitted?'submitted':'notSubmitted';
        target.metrics[key]++; target.metrics.total++;
        const bucket = target.metrics.modes.find(mode=>mode.id===submitted.mode);
        bucket[key]++; bucket.total++;
        add(target,invoice,[submitted.submitted?'Submitted':'Not submitted',bucket.name],maps);
        // Only submitted invoices can enter the acknowledgement denominator.
        if (!submitted.submitted || typeof fact.acknowledged === 'boolean') {
          const ack = cards.acknowledgement;
          if (submitted.submitted) {ack.metrics.submitted++; ack.metrics[fact.acknowledged?'acknowledged':'pending']++;}
          add(ack,invoice,[submitted.submitted?'Submitted':'Not submitted',submitted.submitted?(fact.acknowledged?'Acknowledged':'Pending acknowledgement'):'Not applicable'],maps);
        }
      }
      const issues = issueCounts(fact);
      if (issues) {
        const target = cards.issues;
        target.metrics.total++;
        if (issues.total) {target.metrics.withIssues++; target.metrics[issues.open?'unresolved':'resolved']++;}
        else target.metrics.withoutIssues++;
        add(target,invoice,[issues.total,issues.resolved,issues.open,issues.total?(issues.open?'Unresolved':'Resolved'):'No issues'],maps);
      }
    }
    const credit = cards.credit.metrics;
    credit.used=round(credit.used); credit.balance=round(credit.balance); credit.total=round(credit.used+credit.balance); credit.usagePercent=ratio(credit.used,credit.total);
    const achievement = cards.achievement.metrics;
    achievement.committed=round(achievement.committed); achievement.achieved=round(achievement.achieved); achievement.remaining=round(Math.max(0,achievement.committed-achievement.achieved)); achievement.achievementPercent=ratio(achievement.achieved,achievement.committed);
    const ack = cards.acknowledgement.metrics;
    ack.acknowledgementPercent=ratio(ack.acknowledged,ack.submitted);
    Object.values(cards).forEach(target=>{
      target.missingCount=target.invoiceCount-target.coveredCount;
      target.complete=target.missingCount===0;
      target.available=target.invoiceCount===0 || target.coveredCount>0;
    });
    return cards;
  }
  function snapshot(args = {}) {
    const {state,userId} = args;
    if (!core || !state || !['users','clients','subclients','invoices'].every(key=>Array.isArray(state[key]) && state[key].every(item=>item && typeof item==='object'))) return denied(userId,'MIS access could not be loaded. Ask Admin to review User Setup.');
    if (!text(userId).trim()) return denied(userId,'No active MIS user matches this session. Ask Admin to review User Setup.');
    const matches = state.users.filter(user=>text(user.id)===text(userId));
    const person = matches.length===1 ? matches[0] : null;
    const role = core.userRole(person?.role);
    if (!person || !core.isActive(person) || !['mis','mis-manager'].includes(role)) return denied(userId,'No active MIS user matches this session. Ask Admin to review User Setup.');
    let reports, period;
    try {reports=scopeUsers(state,person); period=readPeriod(args.period);} catch (error) {return denied(userId,error.message);}
    const visible = core.visibleInvoices(state,person.id).filter(invoice=>text(invoice.id).trim());
    const filterOptions = optionsFor(state,reports,visible,person), selected = selectionFor(args.filter,filterOptions);
    const ids = new Set(selected.selectedIds);
    const invoices = visible.filter(invoice=>selected.allRequested || ids.has(text(filterOptions.kind==='assignees'?invoice.assigneeId:invoice.subclientId))).filter(invoice=>{
      if (!period.start && !period.end) return true;
      const date = day(invoice.invoiceDate);
      return !!date && (!period.start || date>=period.start) && (!period.end || date<=period.end);
    });
    const facts = args.facts === undefined ? sampleFacts : args.facts;
    return {authorized:true,reason:'',userId:text(person.id),userName:text(person.name),userRole:role,scopeKind:role==='mis-manager'?'manager':core.cleanAccess(person.access).mode,scopeSummary:core.scopeSummary(state,person.id),filterOptions,...selected,visibleInvoiceIds:visible.map(invoice=>text(invoice.id)),selectedInvoiceIds:invoices.map(invoice=>text(invoice.id)),visibleCount:visible.length,selectedCount:invoices.length,period,cards:makeCards(invoices,facts,state)};
  }
  function reportRows(cardId, args) {
    if (!own(definitions,cardId)) throw new Error('Select an available MIS dashboard report.');
    // Resolve every export from current state/identity/filter. A previous rendered
    // card, row array or list of invoice IDs is never accepted as authority.
    const current = snapshot(args);
    if (!current.authorized) throw new Error(current.reason);
    const card = current.cards[cardId];
    if (!card.available) throw new Error('This report has no available dashboard facts for the selected invoices.');
    return {headers:card.headers.map(text),rows:card.rows.map(row=>row.slice()),invoiceIds:card.invoiceIds.slice()};
  }
  return Object.freeze({snapshot,reportRows,sampleFacts,cardIds:Object.freeze(Object.keys(definitions))});
});
