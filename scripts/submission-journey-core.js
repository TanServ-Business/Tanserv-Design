/* Submission lifecycle and review rules. Pure helpers are shared with the local tracker. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.SubmissionJourney = api;
})(typeof window === 'undefined' ? globalThis : window, function () {
  'use strict';
  const KEY = 'ineburaSubmissionJourney:v1';
  const REVIEW_RULES_KEY = 'ineburaSubmissionReviewRules:v1';
  function readReviewDays(storage) {
    try {
      const saved = JSON.parse(storage.getItem(REVIEW_RULES_KEY) || 'null');
      const value = Number(saved?.reviewDays);
      return Number.isInteger(value) && value >= 1 && value <= 365 ? value : 7;
    } catch (_) { return 7; }
  }
  function saveReviewDays(storage, value) {
    const days = Number(value);
    if (!Number.isInteger(days) || days < 1 || days > 365) throw new Error('Enter a whole number of calendar days from 1 to 365.');
    storage.setItem(REVIEW_RULES_KEY, JSON.stringify({ reviewDays: days }));
    return days;
  }
  const clone = value => JSON.parse(JSON.stringify(value));
  const keyDate = value => {
    if (/^\d{2}-\d{2}-\d{4}$/.test(value || '')) return value.split('-').reverse().join('-');
    if (String(value || '').includes('T') && Number.isFinite(Date.parse(value))) return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value));
    return String(value || '').slice(0, 10);
  };
  const today = () => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kolkata', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date());
  const validPastDate = value => /^\d{4}-\d{2}-\d{2}$/.test(value || '') && Number.isFinite(Date.parse(value)) && new Date(value).toISOString().slice(0,10) === value && value <= today();
  const days = (from, to = today()) => { const a = Date.parse(keyDate(from)), b = Date.parse(keyDate(to)); return Number.isFinite(a) && Number.isFinite(b) && b >= a ? Math.floor((b - a) / 86400000) : null; };
  const activitySubStatuses = { Visited:'On Premises',Emailed:'Email Sent',Couriered:'Docs Sent' };
  const issueReasons = ['Rejected by Customer -Supporting Docs required','Rejected by Customer -Invoice Not correct','Not Received By Customer','Invoice Cancelled','Docs Pending'];
  const nonSubmissionReasons = issueReasons;
  const submissionDestinations = {
    'On Premises':['Vendor Portal','Accepted By User','Vendor Helpdesk','Submitted To Others','Submitted To Reception'],
    'Email Sent':['Vendor HelpDesk','Sent To Other Dept','Sent To User','Vendor Portal'],
    'Docs Sent':['Vendor HelpDesk','Sent To User','Sent To Other Dept']
  };
  const submitted = invoice => ['Submitted','Email Sent','Docs Sent','External Submission','On Premises'].includes(invoice.submissionStatus);
  function acknowledgementProof(state, invoice, attachments = []) {
    if (!submitted(invoice)) return null;
    const submittedAt = Date.parse(invoice.lastSubmittedAt || invoice.submissionRecordedAt || invoice.firstSubmittedAt || invoice.submissionDate || '');
    const afterSubmission = at => Number.isFinite(Date.parse(at)) && (!Number.isFinite(submittedAt) || Date.parse(at) >= submittedAt);
    const candidates = [];
    const recorded = invoice.acknowledgement;
    if (recorded?.proof && afterSubmission(recorded.at)) candidates.push({ source:'Agent update', proof:recorded.proof, at:recorded.at, on:recorded.on, by:recorded.by || 'Agent', note:recorded.note || '' });
    [...(state.documents || []), ...attachments].forEach(document => {
      if (document.scope !== 'invoice' || document.invoiceNo !== invoice.invoiceNo) return;
      const type = String(document.requirementId || document.requirement || '').trim().toLowerCase();
      if (!['invoice-acknowledgment','invoice-acknowledgement'].includes(type) && !/^invoice acknowledg(e)?ment$/i.test(String(document.requirement || ''))) return;
      if (document.name && afterSubmission(document.uploadedAt)) candidates.push({ source:'Attached document', proof:document.name, at:document.uploadedAt, by:document.uploadedBy || 'User' });
    });
    (state.events || []).forEach(item => {
      if (item.type !== 'acknowledgement' || item.source !== 'INTG' || !(item.invoiceNos || []).includes(invoice.invoiceNo)) return;
      if (item.proof && afterSubmission(item.at)) candidates.push({ source:"Customer's Acknowledgement", proof:item.proof, at:item.at, by:item.by || 'Customer', note:item.remark || '' });
    });
    return candidates.sort((a, b) => Date.parse(b.at) - Date.parse(a.at))[0] || null;
  }
  function recordAcknowledgement(state, invoiceNo, details, by, actorRole) {
    if (actorRole !== 'agent') throw new Error('Only an Agent can record customer acknowledgement.');
    const invoice = state.invoices.find(row => row.invoiceNo === invoiceNo);
    if (!invoice || !submitted(invoice)) throw new Error('Only submitted invoices can be acknowledged.');
    const proof = String(details?.proof || '').trim();
    const on = String(details?.on || '');
    if (!validPastDate(on)) throw new Error('Choose a valid acknowledgement date that is not in the future.');
    if (!proof || proof.length > 200) throw new Error('Enter an acknowledgement proof reference of up to 200 characters.');
    const submittedOn = keyDate(invoice.lastSubmittedAt || invoice.submissionRecordedAt || invoice.firstSubmittedAt || invoice.submissionDate);
    if (submittedOn && on < submittedOn) throw new Error('Acknowledgement cannot predate submission.');
    const at = new Date().toISOString();
    invoice.acknowledgement = { on, at, proof, by, note:String(details.note || '').trim() };
    event(state, { at, type:'acknowledgement', invoiceNos:[invoiceNo], by, what:'Customer acknowledgement recorded', remark:`${on} · ${proof}${invoice.acknowledgement.note ? ` · ${invoice.acknowledgement.note}` : ''}` });
    return invoice.acknowledgement;
  }
  function manualFlow(status, activity, medium = 'Manual') {
    const external = status === 'Submitted' && medium === 'External';
    const activities = medium !== 'Manual' ? [] : status === 'Submitted' ? Object.keys(activitySubStatuses) : status === 'Not Submitted' ? ['No Activity'] : [];
    const validActivity = activities.includes(activity), complete = status === 'Submitted' && validActivity;
    const subStatus = complete ? activitySubStatuses[activity] : '';
    return { external,activities,subStatuses:complete ? [subStatus] : status === 'Not Submitted' && validActivity ? nonSubmissionReasons : [],subStatus,
      destinations:submissionDestinations[subStatus] || [],delivery:complete,courier:validActivity && activity === 'Couriered',
      submissionType:complete ? subStatus === 'Email Sent' ? 'Email' : 'Physical' : '',
      invoiceTypes:complete ? subStatus === 'Email Sent' ? ['Digital'] : ['Hard Copy In Triplicate (Govt)','Hard Copy'] : [] };
  }
  function normaliseSubmission(record) {
    const next = { ...record }, originalStatus = next.submissionStatus, oldSub = next.submissionSubStatus || '';
    if (!submitted(next)) return next;
    const subStatus = ['Email Sent','Docs Sent','On Premises'].includes(originalStatus) ? originalStatus
      : Object.values(activitySubStatuses).includes(oldSub) ? oldSub
      : activitySubStatuses[next.activityType] || (next.method === 'Automated' || next.submissionType === 'Email' ? 'Email Sent' : submissionDestinations['On Premises'].includes(oldSub) ? 'On Premises' : '');
    next.submissionStatus = 'Submitted';
    next.submissionSubStatus = subStatus;
    if (oldSub && oldSub !== subStatus && oldSub !== 'External Submission') next.submissionDestination ||= oldSub;
    if (!next.activityType && subStatus) next.activityType = Object.keys(activitySubStatuses).find(activity => activitySubStatuses[activity] === subStatus);
    const medium = originalStatus === 'External Submission' ? 'External' : next.submissionMedium || next.method;
    if (['Manual','External','Automated'].includes(medium)) { next.submissionMedium = medium; if (Object.prototype.hasOwnProperty.call(next,'method')) next.method = medium; }
    return next;
  }
  function normaliseSubmissionState(state) {
    let changed = false;
    const normalise = record => { const next = normaliseSubmission(record); if (JSON.stringify(record) !== JSON.stringify(next)) { Object.assign(record,next); changed = true; } };
    state.invoices.forEach(normalise);
    state.events.filter(item => item.type === 'submission' && item.data?.submissionStatus).forEach(item => normalise(item.data));
    return changed;
  }
  const closed = issue => String(issue.status).toLowerCase() === 'closed' || issue.workflowStep === 'closed';
  const uid = prefix => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  function event(state, data) { state.events.push({ id: uid('EVT'), at: new Date().toISOString(), by: 'System', ...data }); }
  function requirements(invoice) { return invoice.effectiveRequirements || invoice.requirements || []; }
  function attachmentMatches(requirement, attachment, invoice) {
    if (attachment.requirementId !== requirement.id && attachment.requirement !== requirement.name) return false;
    if (attachment.scope !== requirement.scope) return false;
    return requirement.scope === 'customer' ? attachment.customerCode === invoice.code && (!attachment.invoiceNo || attachment.invoiceNo === invoice.invoiceNo) : attachment.invoiceNo === invoice.invoiceNo;
  }
  function missing(state, invoice, attachments = []) {
    return requirements(invoice).filter(requirement => ![...state.documents, ...attachments].some(document => attachmentMatches(requirement, document, invoice)));
  }
  const dependencyKey = (invoice, requirement) => `invoice|${invoice.invoiceNo}|${requirement.id}`;
  function issueAffects(issue, invoice) {
    if (issue.documentScope === 'customer') return issue.customerCode === invoice.code && (issue.affectedInvoices || []).some(item => (item.invoiceNo || item) === invoice.invoiceNo);
    return issue.invoiceNo === invoice.invoiceNo;
  }
  function agentCanView(issue, user) { return Boolean(user && issue.agent && String(issue.agent).trim().toLowerCase() === String(user).trim().toLowerCase()); }
  function linkedIssues(issues, invoice) { return issues.filter(issue => issueAffects(issue, invoice)); }
  function blockers(state, issues = [], date = today(), attachments = []) {
    const groups = new Map();
    state.invoices.filter(invoice => !submitted(invoice)).forEach(invoice => {
      const docs = missing(state, invoice, attachments);
      const dependencies = [...docs];
      if (invoice.reason && (invoice.reason !== 'Docs Pending' || !docs.length)) dependencies.push({ id: `reason:${invoice.reason}`, name: invoice.reason, scope: 'invoice', kind: 'reason' });
      dependencies.forEach(requirement => {
        const key = dependencyKey(invoice, requirement);
        if (!groups.has(key)) groups.set(key, { key, requirement, scope: requirement.scope, code: invoice.code, customer: invoice.name, invoices: [], qualifying: [] });
        const group = groups.get(key); group.invoices.push(invoice);
        if ((days(invoice.invoiceDate, date) ?? -1) >= state.settings.reviewDays) group.qualifying.push(invoice);
      });
    });
    const activeReviews = Object.entries(state.reviews).filter(([, review]) => review?.until > date);
    return [...groups.values()].map(group => {
      group.signature = group.invoices.map(invoice => `${invoice.invoiceNo}:${invoice.reason || 'Docs Pending'}`).sort().join('|');
      group.issue = issues.find(issue => issue.dependencyKey === group.key && !closed(issue));
      group.previousIssue = issues.find(issue => issue.dependencyKey === group.key && closed(issue));
      const directReview = state.reviews[group.key];
      const inheritedReview = activeReviews.find(([key, review]) => {
        if (groups.has(key)) return false;
        const invoiceNos = review.invoiceNos || (key.startsWith('invoice|') ? [key.split('|')[1]] : []);
        return group.invoices.some(invoice => invoiceNos.includes(invoice.invoiceNo));
      })?.[1];
      const review = directReview?.until > date ? directReview : inheritedReview || directReview;
      group.deferred = Boolean(review && review.until > date);
      group.review = review;
      group.eligible = !group.issue && !group.deferred && Boolean(group.qualifying.length);
      group.trigger = `Invoice age ≥ ${state.settings.reviewDays} days`;
      group.oldest = Math.max(...group.invoices.map(invoice => days(invoice.invoiceDate, date) || 0));
      return group;
    }).sort((a, b) => b.oldest - a.oldest || b.invoices.length - a.invoices.length);
  }
  function issueReasonForGroup(group) {
    const reason = group.requirement.kind === 'reason' ? group.requirement.name : 'Docs Pending';
    return issueReasons.includes(reason) ? reason : '';
  }
  function observe(state, issues = [], date = today(), attachments = []) {
    let changed = false;
    state.documentEvents ||= {};
    state.invoices.forEach(invoice => {
      const available = requirements(invoice).map(req => [...state.documents, ...attachments].filter(doc => attachmentMatches(req, doc, invoice)).sort((a,b) => Date.parse(b.uploadedAt) - Date.parse(a.uploadedAt))[0]).filter(Boolean);
      available.forEach(doc => {
        const signature = `${invoice.invoiceNo}|${doc.requirementId || doc.requirement}|${doc.name}|${doc.uploadedAt}`;
        if (!state.documentEvents[signature]) {
          event(state, { type: 'document', invoiceNos: [invoice.invoiceNo], at: doc.uploadedAt || new Date().toISOString(), by: doc.uploadedBy || 'Not available', what: 'Document attached', remark: `${doc.requirement || doc.requirementId} · ${doc.scope} level · ${doc.name}` });
          state.documentEvents[signature] = true; changed = true;
        }
      });
      if (requirements(invoice).length && available.length === requirements(invoice).length) {
        if (!invoice.documentsReadyAt) {
          const times = available.map(doc => doc.uploadedAt).filter(value => Number.isFinite(Date.parse(value))).sort();
          invoice.documentsReadyAt = times.length === available.length ? times.at(-1) : '';
          event(state, { type: 'document', invoiceNos: [invoice.invoiceNo], at: invoice.documentsReadyAt || new Date().toISOString(), what: 'All required documents available', remark: 'Document readiness updated.' });
          changed = true;
        }
        if (invoice.reason === 'Docs Pending') {
          invoice.reason = '';
          event(state, { type: 'document', invoiceNos: [invoice.invoiceNo], what: 'Docs Pending cleared', remark: 'All required documents are available.' });
          changed = true;
        }
      } else if (invoice.documentsReadyAt) {
        invoice.documentsReadyAt = '';
        event(state, { type:'document', invoiceNos:[invoice.invoiceNo], what:'Document readiness lost', remark:'A required document is no longer available under the current submission strategy.' });
        changed = true;
      }
    });
    blockers(state, issues, date, attachments).forEach(group => {
      const signature = `${group.trigger}|${group.signature}|${group.review?.until || ''}`;
      if (group.eligible && state.flags[group.key] !== signature) {
        event(state, { type: 'review', key: group.key, invoiceNos: group.invoices.map(row => row.invoiceNo), what: 'Flagged for review', remark: `${group.requirement.name} · ${group.trigger} · ${group.invoices.length} invoices affected` });
        state.flags[group.key] = signature; changed = true;
      }
    });
    return changed;
  }
  function defer(state, group, until, remark, by, date = today()) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(until) || until <= date) throw new Error('Choose a future review date.');
    if (!String(remark || '').trim()) throw new Error('Explain why review is being deferred.');
    state.reviews[group.key] = { until, remark: remark.trim(), by, invoiceNos: group.invoices.map(invoice => invoice.invoiceNo) };
    event(state, { type: 'review', key: group.key, invoiceNos: group.invoices.map(row => row.invoiceNo), by, what: 'Review deferred', remark: `${group.requirement.name} · ${remark.trim()} · Review on ${until}` });
  }
  function saveManual(state, invoiceNos, update, by, actorRole = '') {
    if (!invoiceNos.length || invoiceNos.some(id => !state.invoices.some(row => row.invoiceNo === id))) throw new Error('Select valid invoices.');
    if (update.submissionStatus === 'Not Submitted' && invoiceNos.some(id => submitted(state.invoices.find(row => row.invoiceNo === id)))) {
      if (actorRole !== 'agent') throw new Error('Only an Agent can return a submitted invoice to Not Submitted.');
      if (!String(update.remarks || '').trim()) throw new Error('Enter the reason for correcting a completed submission in Remarks.');
    }
    const { invoiceNo:ignored, ...fields } = update;
    update = fields;
    if (!['Submitted','Not Submitted'].includes(update.submissionStatus)) throw new Error('Choose Submitted or Not Submitted first.');
    if (update.submissionStatus === 'Not Submitted') {
      if (update.submissionMedium && update.submissionMedium !== 'Manual') throw new Error('External submission is only available with Submitted.');
      if (update.activityType && update.activityType !== 'No Activity') throw new Error('No Activity is the only activity for Not Submitted.');
      update = { ...update, submissionMedium:'Manual', activityType:'No Activity' };
    }
    if (update.submissionStatus === 'Submitted' && !['Manual','External'].includes(update.submissionMedium)) throw new Error('Choose Manual or External as the submission medium.');
    if (update.submissionStatus === 'Not Submitted' && update.submissionMedium && update.submissionMedium !== 'Manual') throw new Error('External submission is only available with Submitted.');
    const flow = manualFlow(update.submissionStatus,update.activityType,update.submissionMedium || (update.submissionStatus === 'Not Submitted' ? 'Manual' : ''));
    if (!flow.external && !flow.activities.includes(update.activityType)) throw new Error('Choose an activity type for this submission status.');
    if (!flow.external && !flow.subStatuses.includes(update.submissionSubStatus)) throw new Error('Choose the submission sub-status or reason allowed for this activity.');
    if (flow.delivery) {
      if (!flow.destinations.includes(update.submissionDestination)) throw new Error('Choose a submission destination for this sub-status.');
      if (update.submissionType !== flow.submissionType || !flow.invoiceTypes.includes(update.invoiceType)) throw new Error('Complete the delivery fields for the selected sub-status.');
      if (!validPastDate(update.submissionDate)) throw new Error('Choose a valid submission date that is not in the future.');
    }
    if ((flow.delivery || flow.courier) && !String(update.sentTo || '').trim()) throw new Error('Enter who the submission was sent to or received by.');
    if (flow.courier && (!String(update.courierName || '').trim() || !String(update.courierAwb || '').trim() || !validPastDate(update.courierDate))) throw new Error('Complete the courier name, date and AWB.');
    update = { ...update,activityType:flow.external ? '' : update.activityType,submissionSubStatus:flow.external ? '' : update.submissionSubStatus,
      submissionMedium:flow.delivery || flow.external ? update.submissionMedium : update.submissionStatus === 'Not Submitted' ? 'Manual' : '',submissionDestination:flow.delivery ? update.submissionDestination : '',
      submissionDate:flow.delivery ? update.submissionDate : '',submissionType:flow.delivery ? update.submissionType : '',invoiceType:flow.delivery ? update.invoiceType : '',
      sentTo:flow.delivery || flow.courier ? update.sentTo : '',courierName:flow.courier ? update.courierName : '',courierDate:flow.courier ? update.courierDate : '',courierAwb:flow.courier ? update.courierAwb : '',
      remarks:flow.external ? '' : update.remarks || '',missingIds:update.submissionStatus === 'Not Submitted' && update.submissionSubStatus === 'Docs Pending' ? update.missingIds || [] : [] };
    const at = new Date().toISOString();
    invoiceNos.forEach(id => {
      const invoice = state.invoices.find(row => row.invoiceNo === id), wasSubmitted = submitted(invoice);
      Object.assign(invoice, update, { updatedAt: at });
      if (update.submissionStatus === 'Not Submitted') {
        invoice.reason = update.submissionSubStatus; invoice.status = 'Not Submitted & Tracking'; invoice.submissionDate = ''; invoice.automationSuppressed = false; invoice.method = 'Manual'; invoice.submissionMedium = 'Manual'; invoice.submissionDestination = '';
        // Manual reporting does not alter configured document requirements.
      } else {
        invoice.reason = ''; invoice.method = update.submissionMedium; invoice.status = 'Submitted & Tracking'; invoice.automationSuppressed = true;
        invoice.firstSubmittedAt ||= flow.external ? '' : update.submissionDate || today(); invoice.lastSubmittedAt = flow.external ? '' : update.submissionDate || today();
        invoice.submissionRecordedAt = at;
      }
      event(state, { at, type: 'submission', invoiceNos: [id], by, what: submitted(invoice) ? update.submissionMedium === 'External' ? 'External submission recorded' : 'Submission recorded manually' : 'Non-submission reason recorded', remark: [update.activityType, update.submissionSubStatus,update.submissionDestination, update.remarks].filter(Boolean).join(' · '), data: clone(update) });
      if (submitted(invoice) && state.settings.autoSubmission) event(state, { at, type: 'automation', invoiceNos: [id], what: 'Automatic submission skipped', remark: 'This invoice already has a completed submission. No automatic attempt will be made.' });
      if (wasSubmitted && !submitted(invoice)) event(state, { at, type: 'submission', invoiceNos: [id], what: 'Invoice returned to Not Submitted', remark: `Correction reason: ${update.remarks.trim()} · Previous submission records are retained.` });
    });
  }
  function eligibleForAutomation(state, invoice, attachments = []) { return state.settings.autoSubmission && !submitted(invoice) && !invoice.automationSuppressed && missing(state, invoice, attachments).length === 0 && !invoice.reason; }
  function reconcileIssues(state, issues, attachments = []) {
    let changed = false;
    issues.filter(issue => issue.documentScope === 'customer' && issue.dependencyKey && !closed(issue)).forEach(issue => {
      const group = blockers(state, [], today(), attachments).find(item => item.key === issue.dependencyKey);
      const active = group?.invoices || [];
      issue.affectedInvoices ||= [];
      active.forEach(invoice => { if (!issue.affectedInvoices.some(item => item.invoiceNo === invoice.invoiceNo)) { issue.affectedInvoices.push(impact(invoice)); changed = true; } });
      const ids = active.map(invoice => invoice.invoiceNo).sort();
      if (JSON.stringify(ids) !== JSON.stringify(issue.activeAffectedInvoiceNos || [])) {
        issue.activeAffectedInvoiceNos = ids; changed = true;
        issue.actionTrail ||= [];
        issue.actionTrail.push({ type: 'impact', who: 'System', what: 'Submission impact updated', when: new Date().toISOString(), remark: `${ids.length} currently blocked; ${issue.affectedInvoices.length} invoices linked in total.` });
      }
    });
    issues.filter(issue => issue.source === 'submission-module' && issue.issueReason === 'Docs Pending' && !closed(issue)).forEach(issue => {
      const affected = state.invoices.filter(invoice => (issue.affectedInvoices || []).some(item => (item.invoiceNo || item) === invoice.invoiceNo));
      if (!affected.length) return;
      const stillMissing = affected.some(invoice => missing(state, invoice, attachments).some(requirement =>
        issue.documentRequirementId?.startsWith('reason:') || !issue.documentRequirementId || requirement.id === issue.documentRequirementId));
      if (stillMissing) return;
      const at = new Date().toISOString();
      issue.status = 'Closed'; issue.workflowStep = 'closed'; issue.assignedTo = ''; issue.assignmentRole = '';
      if (issue.managerApprovalStatus === 'Pending') issue.managerApprovalStatus = 'Superseded';
      if (issue.matrixApprovalStatus === 'pending') issue.matrixApprovalStatus = 'superseded';
      issue.actionTrail ||= [];
      issue.actionTrail.push({ type:'closure', who:'System', what:'closed the document issue', when:at, remark:'All required documents for this dependency are available.' });
      event(state, { type:'issue', at, issueId:issue.id, invoiceNos:affected.map(invoice => invoice.invoiceNo), what:'Docs Pending issue closed', remark:`${issue.id} closed automatically after the required documents became available.` });
      changed = true;
    });
    return changed;
  }
  function reconcileApprovalRequests(issues, requests) {
    let changed = false;
    requests.forEach(request => {
      if (request.status !== 'pending' || !issues.some(issue => issue.id === request.issue?.id && closed(issue))) return;
      const at = new Date().toISOString();
      request.status = 'superseded'; request.updatedAt = at;
      request.trail ||= [];
      request.trail.push({ action:'superseded', by:'System', at, remark:'The linked document issue closed when its requirements were met.' });
      changed = true;
    });
    return changed;
  }
  const impact = invoice => ({ invoiceNo: invoice.invoiceNo, code: invoice.code, name: invoice.name, invoiceDate: invoice.invoiceDate, dueDate: invoice.dueDate, value: invoice.value });
  function issueMetrics(issue, date = today()) {
    const trail = [...(issue.actionTrail || [])].sort((a, b) => new Date(a.when) - new Date(b.when));
    let start = issue.createdAt || issue.created, total = 0, cycles = [], reopenCount = 0;
    trail.forEach(entry => {
      if (entry.type === 'closure' && start) { const duration = days(start, entry.when); cycles.push({ start, end: entry.when, days: duration }); if (duration !== null) total += duration; start = null; }
      if (entry.type === 'reopen') { reopenCount++; if (!start) start = entry.when; }
    });
    const current = closed(issue) ? null : days(start, date);
    return { reopenCount, cycles, current, total: cycles.length || current !== null ? total + (current || 0) : null };
  }
  function readIssues(storage) {
    const read = key => { const value = JSON.parse(storage.getItem(key) || '[]'); if (!Array.isArray(value)) throw new Error('Issue Tracker data is invalid.'); return value; };
    const all = [...read('issueTrackerBaseData').flatMap(invoice => (invoice.issues || []).map(issue => ({ ...issue, invoiceNo: issue.invoiceNo || invoice.id, customerCode: issue.customerCode || invoice.customerCode }))), ...read('customIssues')];
    return [...new Map(all.map(issue => [issue.id, issue])).values()];
  }
  function issueAttachments(issues) {
    return issues.flatMap(issue => (issue.documents || []).filter(document => typeof document === 'object').map(document => ({ ...document, scope: document.scope || issue.documentScope, invoiceNo: document.invoiceNo || document.sourceInvoice || issue.invoiceNo, customerCode: document.customerCode || issue.customerCode, requirementId: document.requirementId || issue.documentRequirementId })));
  }
  function transaction(storage, values) {
    const previous = Object.fromEntries(Object.keys(values).map(key => [key, storage.getItem(key)]));
    try { Object.entries(values).forEach(([key, value]) => storage.setItem(key, JSON.stringify(value))); }
    catch (error) { Object.entries(previous).forEach(([key, value]) => { try { value === null ? storage.removeItem(key) : storage.setItem(key, value); } catch (_) {} }); throw new Error('Changes could not be saved. Check browser storage and try again.'); }
  }
  function promote(state, selectedKeys, fields, config, storage, by, manualUpdate = null) {
    if (!selectedKeys.length) throw new Error('Select at least one document or reason.');
    if (config.roleOf(fields.owner) !== 'action-owner') throw new Error('Select a valid action owner.');
    if (manualUpdate && manualUpdate.update?.submissionStatus !== 'Not Submitted') throw new Error('Only a Not Submitted update can be added to Issue Tracker.');
    if (!fields.remark.trim()) throw new Error('Describe what is blocking submission.');
    const { processes, matrices } = config.ensureApprovalData();
    const process = processes.find(item => item.id === fields.process), matrix = matrices.find(item => item.id === process?.matrixId);
    if (fields.process && (!process || !matrix)) throw new Error('Approval process unavailable. Choose it again.');
    state = storage.getItem(KEY) ? load(storage) : state;
    if (manualUpdate) {
      state = clone(state);
      saveManual(state, manualUpdate.invoiceNos, manualUpdate.update, by, manualUpdate.actorRole);
    }
    config.ensureWorkflowVersion?.();
    const issues = readIssues(storage), attachments = issueAttachments(issues), fresh = blockers(state, issues, today(), attachments);
    const groups = selectedKeys.map(key => fresh.find(group => group.key === key));
    if (groups.some(group => !group || group.issue || group.previousIssue)) throw new Error('The selected blocker changed or already has an issue. Refresh and review it again.');
    if (groups.some(group => !issueReasonForGroup(group))) throw new Error('Issues can only be raised for the five supported non-submission reasons.');
    const custom = JSON.parse(storage.getItem('customIssues') || '[]'), requests = JSON.parse(storage.getItem('approval_requests') || '[]');
    if (!Array.isArray(custom) || !Array.isArray(requests)) throw new Error('Issue Tracker data is invalid.');
    const next = clone(state), created = [];
    groups.forEach(group => {
      const invoice = group.invoices[0], at = new Date().toISOString(), skip = Boolean(config.settings().skipManagerApproval), levels = matrix?.levels || [];
      const manager = config.defaultUser('manager'), issue = {
        id: uid('ISS_SUB'), title: group.requirement.name, subStatus: fields.subStatus || (group.requirement.kind === 'reason' ? 'Further Action Required' : 'Further Documents Required'), primaryStatus: fields.primaryStatus || 'Clarification Needed',
        broadStatus: 'External Dependency', source: 'submission-module', description: fields.remark, status: 'Open', created: at.slice(0, 10), createdAt: at,
        invoiceNo: invoice.invoiceNo, customerCode: invoice.code, customerName: invoice.name, invoiceDate: invoice.invoiceDate, invoiceDueDate: invoice.dueDate, invoiceTotal: invoice.value, invoiceDueAmount: invoice.value,
        dependencyKey: group.key, issueReason: issueReasonForGroup(group), documentScope: group.scope, documentRequirementId: group.requirement.id, documentRequirement: group.requirement.name,
        affectedInvoices: group.invoices.map(impact), activeAffectedInvoiceNos: group.invoices.map(item => item.invoiceNo),
        agent: by, manager, actionOwner: fields.owner, stage: 1, documents: [], isCustom: true,
        approvalProcessId: process?.id || '', approvalProcessName: process?.process || '', approvalMatrixId: matrix?.id || '', approvalMatrixName: matrix?.name || '',
        skipManagerApproval: skip, initialVisibilityReleased: skip, visibilityReleasedAt: skip ? at : '', managerApprovalStatus: skip ? 'Approved' : 'Pending', matrixApprovalStatus: skip && levels.length ? 'pending' : 'not-submitted',
        workflowStep: skip ? (levels.length ? 'approver-l1' : 'resolution-work') : 'manager-review', assignedTo: skip ? (levels[0]?.ownerName || fields.owner) : manager, assignmentRole: skip ? (levels.length ? 'approver' : 'action-owner') : 'manager',
        actionTrail: [{ who: by, what: 'created issue from submission review', type: 'created', when: at, remark: `${fields.remark} · ${group.invoices.length} invoices affected · ${group.scope} document/dependency` }]
      };
      custom.push(issue); created.push(issue);
      if (skip && levels.length) requests.push({ id: `REQ_${issue.id}`, processId: process.id, processName: process.process, matrixId: matrix.id, matrixName: matrix.name, levels: levels.map((level, index) => ({ ...level, level: index + 1, status: index ? 'waiting' : 'pending' })), currentLevel: 1, status: 'pending', createdAt: at, updatedAt: at, issue: { id: issue.id, title: issue.title, subStatus: issue.subStatus }, invoice: { id: invoice.invoiceNo, customer: invoice.name, customerCode: invoice.code, total: invoice.value }, trail: [{ action: 'submitted', by, at, remark: 'Manager approval skipped by configuration.' }] });
      event(next, { type: 'issue', invoiceNos: group.invoices.map(row => row.invoiceNo), key: group.key, by, what: 'Issue raised', remark: `${group.requirement.name} · ${group.invoices.length} invoices affected`, issueId: issue.id });
      delete next.reviews[group.key];
    });
    transaction(storage, { [KEY]: next, customIssues: custom, approval_requests: requests });
    return { state: next, issues: created };
  }
  const demoInvoiceNumber = (index, offset) => `INV26${String(1001 + index * 3 + offset).padStart(4, '0')}`;
  function legacyDemoInvoiceIds() {
    const ids = { 'READY-001':'INV261000' };
    for (let index = 0; index < 9; index++) {
      const number = String(index + 2).padStart(3, '0');
      ids[`NRC-${number}`] = demoInvoiceNumber(index, 0);
      ids[`CAN-${number}`] = demoInvoiceNumber(index, 1);
      ids[`READY-${number}`] = demoInvoiceNumber(index, 2);
    }
    return ids;
  }
  function renameLegacyDemoInvoices(state, storage) {
    if (!state.invoices.some(invoice => invoice.invoiceNo === 'AMS-0001')) return { state, linked:{}, changed:false };
    const ids = Object.entries(legacyDemoInvoiceIds()).filter(([oldId,newId]) => state.invoices.some(invoice => invoice.invoiceNo === oldId) && !state.invoices.some(invoice => invoice.invoiceNo === newId));
    if (!ids.length) return { state, linked:{}, changed:false };
    const rename = value => {
      let json = JSON.stringify(value);
      ids.forEach(([oldId,newId]) => { json = json.replaceAll(oldId,newId); });
      return JSON.parse(json);
    };
    const linked = {};
    for (const key of ['customIssues','approval_requests']) {
      const raw = storage.getItem(key);
      if (raw) {
        const value = JSON.parse(raw), updated = rename(value);
        if (JSON.stringify(updated) !== raw) linked[key] = updated;
      }
    }
    return { state:rename(state), linked, changed:true };
  }
  function addDispositionExamples(state) {
    const customers = [
      ['94669526','Raos Health Care'], ['94496698','Criticam Medical Systems LLP'],
      ['6734001','Forties Hospital Noida'], ['94266641','PRAMODINI MEDICARE LIMITED'],
      ['94003975','POSTGRADUATE INSTT OF MEDICAL'], ['94060526','ALLIANCE MEDICAL SYSTEMS'],
      ['94230317','Northstar Medical Centre'], ['94072861','Cedar Health Services'],
      ['94516082','Westbridge Hospital']
    ];
    let added = false;
    for (let index = 0; index < customers.length; index++) {
      const [code, name] = customers[index];
      const examples = [
        { invoiceNo:demoInvoiceNumber(index,0), reason:'Not Received By Customer', invoiceDate:`2026-09-${String(index + 16).padStart(2, '0')}`, value:18500 + index * 2450 },
        { invoiceNo:demoInvoiceNumber(index,1), reason:'Invoice Cancelled', invoiceDate:`2026-09-${String(index + 17).padStart(2, '0')}`, value:24750 + index * 3100 },
        { invoiceNo:demoInvoiceNumber(index,2), reason:'', invoiceDate:'2026-10-09', value:32000 + index * 3750 }
      ];
      examples.forEach(example => {
        if (state.invoices.some(invoice => invoice.invoiceNo === example.invoiceNo)) return;
        const ready = !example.reason, createdAt = '2026-10-09T04:00:00Z';
        state.invoices.push({ ...example, code, name, dueDate:'2026-10-31', submissionStatus:'Not Submitted', status:ready?'Not Submitted & Untouched':'Not Submitted & Tracking', requirements:ready?[{ id:'invoice-copy', name:'Invoice Copy', scope:'invoice' }]:[], createdAt, source:'Admin bulk upload', method:'', ...(ready?{ documentsReadyAt:'2026-10-09T05:00:00Z' }:{}) });
        state.events.push({ id:`created-${example.invoiceNo}`, type:'invoice', invoiceNos:[example.invoiceNo], at:createdAt, by:'System', what:'Invoice created in Inebura', remark:'Admin bulk upload' });
        if (ready) state.documents.push({ requirementId:'invoice-copy', requirement:'Invoice Copy', scope:'invoice', invoiceNo:example.invoiceNo, customerCode:code, name:`${example.invoiceNo}.pdf`, uploadedAt:'2026-10-09T05:00:00Z', uploadedBy:'Admin bulk upload' });
        added = true;
      });
    }
    for (let index = 0; index < 10; index++) {
      const [code, name] = customers[index % customers.length];
      [issueReasons[0], issueReasons[1]].forEach((reason, offset) => {
        const invoiceNo = `INV26${String(1030 + index * 2 + offset).padStart(4, '0')}`;
        if (state.invoices.some(invoice => invoice.invoiceNo === invoiceNo)) return;
        const createdAt = '2026-10-09T04:00:00Z';
        state.invoices.push({ invoiceNo, code, name, invoiceDate:`2026-09-${String(index + 16).padStart(2, '0')}`, dueDate:'2026-10-31', value:22000 + index * 2000 + offset * 750, reason, requirements:[], submissionStatus:'Not Submitted', status:'Not Submitted & Tracking', createdAt, source:'Admin bulk upload', method:'' });
        state.events.push({ id:`created-${invoiceNo}`, type:'invoice', invoiceNos:[invoiceNo], at:createdAt, by:'System', what:'Invoice created in Inebura', remark:'Admin bulk upload' });
        added = true;
      });
    }
    return added;
  }
  function addDemoStrategyDocuments(state) {
    if (state.demoStrategyDocumentsAdded || !state.invoices.some(invoice => invoice.invoiceNo === 'AMS-0001')) return false;
    state.invoices.filter(invoice => !submitted(invoice) && !invoice.reason && invoice.requirements?.some(item => item.id === 'invoice-copy')).forEach(invoice => {
      ['PAYMENT RECEIPT','PURCHASE ORDER'].forEach(name => {
        const requirementId=`strategy-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
        if (!state.documents.some(document => document.invoiceNo === invoice.invoiceNo && document.requirementId === requirementId)) state.documents.push({ requirementId, requirement:name, scope:'invoice', invoiceNo:invoice.invoiceNo, customerCode:invoice.code, name:`${invoice.invoiceNo}-${name.toLowerCase().replace(/\s+/g, '-')}.pdf`, uploadedAt:'2026-10-09T05:00:00Z', uploadedBy:'Admin bulk upload' });
      });
    });
    state.demoStrategyDocumentsAdded=true;
    return true;
  }
  function addDemoAcknowledgements(state) {
    if (state.demoAcknowledgementsAdded) return false;
    const documentInvoice = state.invoices.find(invoice => invoice.invoiceNo === 'TN200011');
    if (documentInvoice && submitted(documentInvoice) && !acknowledgementProof(state, documentInvoice)) {
      state.documents.push({ requirementId:'invoice-acknowledgment', requirement:'Invoice Acknowledgment', scope:'invoice', invoiceNo:'TN200011', customerCode:documentInvoice.code, name:'TN200011-customer-acknowledgement.pdf', uploadedAt:'2026-09-30T08:00:00Z', uploadedBy:'Agent' });
      state.events.push({ id:'ack-doc-TN200011', type:'document', invoiceNos:['TN200011'], at:'2026-09-30T08:00:00Z', by:'Agent', what:'Invoice acknowledgement attached', remark:'TN200011-customer-acknowledgement.pdf' });
    }
    const intgInvoice = state.invoices.find(invoice => invoice.invoiceNo === 'TN200012');
    if (intgInvoice && submitted(intgInvoice) && !acknowledgementProof(state, intgInvoice)) {
      state.events.push({ id:'ack-TN200012', type:'acknowledgement', source:'INTG', invoiceNos:['TN200012'], at:'2026-10-01T07:00:00Z', by:'Customer', what:'Customer acknowledgement received', proof:'INTG verification · TN200012', remark:'Customer verification link' });
    }
    state.demoAcknowledgementsAdded = true;
    return true;
  }
  function seed() {
    const invoices = [], documents = [], events = [];
    const req = (id, name, scope) => ({ id, name, scope });
    const add = (invoice, at) => { invoices.push(invoice); if (at) events.push({ id: `created-${invoice.invoiceNo}`, type: 'invoice', invoiceNos: [invoice.invoiceNo], at, by: 'System', what: 'Invoice created in Inebura', remark: invoice.source }); };
    for (let n = 1; n <= 100; n++) add({ invoiceNo: `AMS-${String(n).padStart(4, '0')}`, code: '94060526', name: 'ALLIANCE MEDICAL SYSTEMS', invoiceDate: n > 90 ? '2026-10-07' : '2026-09-21', dueDate: '2026-10-21', value: 10000 + n * 100, submissionStatus: 'Not Submitted', status: 'Not Submitted & Untouched', reason: 'Docs Pending', source: n % 2 ? 'SAP API' : 'Admin bulk upload', createdAt: '2026-10-08T04:30:00Z', requirements: [req('purchase-order', 'Purchase Order', 'customer'), req('invoice-copy', 'Invoice Copy', 'invoice')], method: '' }, '2026-10-08T04:30:00Z');
    invoices.forEach(invoice => documents.push({ requirementId: 'invoice-copy', requirement: 'Invoice Copy', scope: 'invoice', invoiceNo: invoice.invoiceNo, customerCode: invoice.code, name: `${invoice.invoiceNo}.pdf`, uploadedAt: '2026-10-08T05:00:00Z', uploadedBy: 'Admin bulk upload' }));
    const pending = [
      ['TVS545661','94669526','Raos Health Care','2026-08-21',10000,'Docs Pending',[req('work-order','Work Order','customer'),req('extension-letter','Extension Letter','customer'),req('letter-acceptance','Letter of Acceptance','customer')]],
      ['TVS545662','94669526','Raos Health Care','2026-08-21',10000,'Docs Pending',[req('delivery-challan','Delivery Challan','invoice')]],
      ['FT6567567','94496698','Criticam Medical Systems LLP','2026-09-09',331000,'Not Received By Customer',[]],
      ['DV5623526','6734001','Forties Hospital Noida','2026-10-07',17000,'Docs Pending',[req('measurement-book','Measurement Book','invoice')]],
      ['SU6472864327','94266641','PRAMODINI MEDICARE LIMITED','2026-09-07',21000,'Docs Pending',[req('pm-report','PM Report','invoice')]],
      ['TN656457687','94060526','ALLIANCE MEDICAL SYSTEMS','2026-09-29',8767876687,'Invoice Cancelled',[]],
      ['CF54561','94003975','POSTGRADUATE INSTT OF MEDICAL','2026-09-08',21000,'Docs Pending',[req('bg','Bank Guarantee','customer')]]
    ];
    pending.forEach(([invoiceNo,code,name,invoiceDate,value,reason,requirements]) => add({ invoiceNo,code,name,invoiceDate,value,reason,requirements,dueDate:invoiceDate,submissionStatus:'Not Submitted',status:'Not Submitted & Tracking',createdAt:'2026-10-06T04:00:00Z',source:'Admin bulk upload',method:'' },'2026-10-06T04:00:00Z'));
    const done = [ ['TN200009','2026-06-07',134187,'Manual'], ['TN200011','2026-06-03',145100,'Automated'], ['TN200012','2026-06-25',132941,'Automated'] ];
    done.forEach(([invoiceNo,invoiceDate,value,method]) => { add({ invoiceNo,invoiceDate,value,method,code:'94060526',name:'ALLIANCE MEDICAL SYSTEMS',dueDate:'2026-10-01',submissionStatus:'Submitted',submissionSubStatus:method==='Manual'?'On Premises':'Email Sent',activityType:method==='Manual'?'Visited':'Emailed',submissionMedium:method,status:'Submitted & Tracking',submissionDate:'2026-09-29',firstSubmittedAt:'2026-09-29T06:00:00Z',lastSubmittedAt:'2026-09-29T06:00:00Z',createdAt:'2026-09-20T05:00:00Z',documentsReadyAt:'2026-09-28T08:00:00Z',requirements:[],reason:'',automationSuppressed:method==='Manual',source:'SAP API' },'2026-09-20T05:00:00Z'); events.push({ id:`sent-${invoiceNo}`,type:'submission',invoiceNos:[invoiceNo],at:'2026-09-29T06:00:00Z',by:method==='Manual'?'Agent':'System',what:method==='Manual'?'Submission recorded manually':'Invoice submitted automatically by email',remark:'Demonstration history' }); });
    documents.push({ requirementId:'invoice-acknowledgment', requirement:'Invoice Acknowledgment', scope:'invoice', invoiceNo:'TN200011', customerCode:'94060526', name:'TN200011-customer-acknowledgement.pdf', uploadedAt:'2026-09-30T08:00:00Z', uploadedBy:'Agent' });
    events.push({ id:'ack-doc-TN200011', type:'document', invoiceNos:['TN200011'], at:'2026-09-30T08:00:00Z', by:'Agent', what:'Invoice acknowledgement attached', remark:'TN200011-customer-acknowledgement.pdf' });
    events.push({ id:'ack-TN200012', type:'acknowledgement', source:'INTG', invoiceNos:['TN200012'], at:'2026-10-01T07:00:00Z', by:'Customer', what:'Customer acknowledgement received', proof:'INTG verification · TN200012', remark:'Customer verification link' });
    add({ invoiceNo:'INV261000',code:'CUST-READY',name:'Meridian Healthcare',invoiceDate:'2026-10-08',dueDate:'2026-11-08',value:42000,submissionStatus:'Not Submitted',status:'Not Submitted & Untouched',reason:'',requirements:[req('invoice-copy','Invoice Copy','invoice')],createdAt:'2026-10-08T07:00:00Z',source:'SAP API',documentsReadyAt:'2026-10-09T05:00:00Z' },'2026-10-08T07:00:00Z');
    documents.push({ requirementId:'invoice-copy',requirement:'Invoice Copy',scope:'invoice',invoiceNo:'INV261000',name:'INV261000.pdf',uploadedAt:'2026-10-09T05:00:00Z',uploadedBy:'Admin' });
    const state = { version:1,settings:{ autoSubmission:true,reviewDays:7 },invoices,documents,events,reviews:{},flags:{},demoAcknowledgementsAdded:true };
    addDispositionExamples(state);
    addDemoStrategyDocuments(state);
    return state;
  }
  function load(storage) {
    const raw = storage.getItem(KEY);
    if (raw) {
      let state = JSON.parse(raw);
      if (state.version !== 1 || !Array.isArray(state.invoices) || !Array.isArray(state.events)) throw new Error('Saved submission data could not be read. It has not been replaced.');
      state.settings ||= {};
      state.settings.reviewDays = readReviewDays(storage);
      const renamed = renameLegacyDemoInvoices(state, storage);
      state = renamed.state;
      const addedExamples = state.invoices.some(invoice => invoice.invoiceNo === 'AMS-0001') && state.invoices.some(invoice => invoice.invoiceNo === 'INV261000') && addDispositionExamples(state);
      const addedStrategyDocuments = addDemoStrategyDocuments(state);
      const addedAcknowledgements = addDemoAcknowledgements(state);
      const normalised = normaliseSubmissionState(state);
      if (normalised || addedExamples || addedStrategyDocuments || addedAcknowledgements || renamed.changed) transaction(storage,{ [KEY]:state, ...renamed.linked });
      return state;
    }
    const state = seed(), updates = JSON.parse(storage.getItem('submissionLiveReplicaUpdates') || '{}');
    state.settings.reviewDays = readReviewDays(storage);
    const legacyIds = legacyDemoInvoiceIds();
    Object.entries(updates).forEach(([id, update]) => { const invoice = state.invoices.find(row => row.invoiceNo === (legacyIds[id] || id)); if (invoice) { const { invoiceNo:ignored, ...fields } = update; Object.assign(invoice, fields); invoice.reason = update.submissionStatus === 'Not Submitted' ? update.submissionSubStatus : ''; if (submitted(invoice)) { invoice.method='Manual';invoice.automationSuppressed=true;invoice.firstSubmittedAt=keyDate(update.submissionDate); } } });
    normaliseSubmissionState(state);
    return state;
  }
  return { KEY,REVIEW_RULES_KEY,issueReasons,issueReasonForGroup,readReviewDays,saveReviewDays,clone,keyDate,today,days,submitted,acknowledgementProof,recordAcknowledgement,manualFlow,normaliseSubmission,closed,uid,event,requirements,attachmentMatches,missing,dependencyKey,issueAffects,agentCanView,linkedIssues,blockers,observe,defer,saveManual,eligibleForAutomation,reconcileIssues,reconcileApprovalRequests,impact,issueMetrics,readIssues,issueAttachments,transaction,promote,seed,load };
});
