/* Source-preserving message editing: only copy is editable; dynamic values stay locked. */
(() => {
  'use strict';
  const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
  const variable = /\$\{[^}]+\}|\{\{[^}]+\}\}|\bNULL\b/g;
  const samples = {
    recipientName: 'Aarav Sharma', clientFullName: 'Aarav Sharma', userFullName: 'Aarav Sharma',
    fprName: 'Priya Mehta', userName: 'Aarav Sharma', user: 'Aarav Sharma', userId: 'aarav.sharma',
    userLoginId: 'aarav.sharma', loginUserId: 'aarav.sharma', userClient: 'Xeon Infraservices Pvt Ltd',
    clientName: 'Xeon Infraservices Pvt Ltd', customerName: 'Acme Industries Ltd', customerCode: 'CUST-001',
    agentName: 'Rahul Verma', agent: 'Rahul Verma', assignee: 'Rahul Verma', manager: 'Priya Mehta',
    managerName: 'Priya Mehta', approver: 'Priya Mehta', kam: 'Priya Mehta', createdBy: 'Rahul Verma',
    actionOwners: 'Priya Mehta', customersAsString: 'Acme Industries Ltd, Horizon Enterprises',
    UserRole: 'Agent', subdomain: 'xeon', subDomain: 'xeon', clientSubDomain: 'xeon', tenantSchema: 'xeon',
    emailId: 'aarav@example.com', emailOtp: '123456', phoneOtp: '654321', tempPassKey: 'SamplePassword123',
    generatedPassKey: 'SamplePassword123', token: 'sample-reference',
    invoiceNo: 'INV-2026-001', invoiceDate: '01-Oct-2026', invoiceDueDate: '31-Oct-2026',
    poNumber: 'PO-2026-101', saleOrderNo: 'SO-2026-101', invoiceValue: '1,25,000.00', basicValue: '1,05,932.20',
    outstandingAmount: '75,000.00', totalOutstanding: '75,000.00', totalDueAmount: '75,000.00',
    dueAmount: '75,000.00', AmountPaid: '50,000.00', tdsAmount: '2,500.00', currency: 'INR',
    instrumentNo: 'CHQ-102345', instrumentRefNo: 'UTR-20261019001', chequeNo: '102345', bank: 'HDFC Bank',
    instrumentDate: '19-Oct-2026', instrumentTransferDate: '19-Oct-2026', paymentDate: '19-Oct-2026',
    issue: 'Payment confirmation pending', latestRemarks: 'Customer will share payment advice.',
    managerRemarks: 'Please follow up with the customer.', substatus: 'Payment advice awaited',
    desc: 'Professional services for October 2026', commitDate: '23-Oct-2026', ptpAmount: '75,000.00',
    collectedAmount: '50,000.00', dunningLetterNo: 'DL-2026-001', docRefNo: 'DOC-2026-001',
    dunningLetterRefNo: 'DL-2026-001', dunningLetterOneRefNo: 'DL-2026-001', dunningLetterTwoRefNo: 'DL-2026-002',
    dunningLetterContactInfo: 'Rahul Verma, rahul@example.com',
    period: 'October 2026', reportDate: '19-Oct-2026', visitDate: '20-Oct-2026', visitTime: '10:30 AM',
    month: 'October', monthStart: '01-Oct-2026', monthEnd: '31-Oct-2026', yearLabel: '2026–2027',
    finalizedAmount: '5,00,000.00', committedAmount: '4,50,000.00', dayCollection: '50,000.00',
    monthCollection: '3,75,000.00', collectionPercent: '75%', callBackForTheDay: '5', ptpForTheDay: '3',
    newAllocationCount: '12', pendingCount: '4', totalCount: '24', totalRecord: '24', successRecord: '22',
    failedRecords: '2', totalDue: '75,000.00', totalOutstandingAmount: '75,000.00',
    tenantCount: '1', agentCount: '6', schemaCount: '1', totalLeave: '2', totalAbsent: '1',
    totalVisitPlan: '12', grandTotal: '24', grandPresent: '20', grandAbsent: '2', grandLeave: '2',
    presentDays: '20', absentDays: '1', leaveDays: '1', total: '22', agentList: 'Rahul Verma, Neha Singh',
    visitRemarks: 'Payment follow-up and account reconciliation', reportName: 'Outstanding Invoice Report',
    urgencyColor: '#5c258d', urgencyText: 'Action required',
    ccBucketStatus: 'Pending', safeFailureReason: 'A processing step could not finish.', runReference: 'RUN-2026-001',
    failedCount: '2', successCount: '22', executionMode: 'Scheduled', editedBy: 'Priya Mehta',
    editedByEmail: 'priya@example.com', dateMode: 'Calendar date', yearType: 'Financial year',
    monthEndRunMode: 'Automatic', ccRunMode: 'Automatic'
  };
  function sample(token, context = '') {
    if (token === 'NULL') {
      const label = context.replace(/<[^>]*>/g, '').trim();
      if (/Cheque(?: No:)?\s*$/i.test(label)) return '102345';
      if (/Amount:\s*$/i.test(label)) return 'INR 1,25,000.00';
      if (/Bank:\s*$/i.test(label)) return 'HDFC Bank';
      if (/PDC Date:\s*$/i.test(label) || /banking on\s*$/i.test(label)) return '21-Oct-2026';
      return 'Aarav Sharma';
    }
    const name = token.replace(/^\$\{|^\{\{|\}\}$|\}$/g, '').trim();
    if (name === "'\n'" || name === "'\\n'") return '\n';
    if (/totalCount\s*==\s*1\)?\?string/.test(name)) return 'ies';
    if (/\?size/.test(name)) return '2';
    if (/^[abc]Date\b/.test(name)) return '19-Oct-2026';
    const field = name.replace(/[()!]/g, '').split('?')[0].split('.').at(-1);
    if (samples[field] !== undefined) return samples[field];
    if (/Url$/i.test(field)) return 'https://example.invalid/inebura';
    if (/At$|Date$|Starts$|lockAt/i.test(field)) return '19-Oct-2026';
    if (/Count$|Days$|Record/i.test(field)) return '12';
    if (field === 'invoiceList') return 'INV-2026-001';
    return 'Sample ' + field.replace(/([a-z])([A-Z])/g, '$1 $2').toLowerCase();
  }
  const looksHtml = text => /<(?:!doctype|html|body|div|table|p|br|span|h[1-6])\b/i.test(text);
  const directives = /<#--[\s\S]*?-->|<\/?#[\s\S]*?>/g;

  // Keep original source ranges. Saving an untouched message returns its exact original bytes,
  // including conditional/list expressions, HTML attributes and tokens in links or logos.
  function project(original, { plain = false, editable = false } = {}) {
    const html = !plain && looksHtml(original);
    const parts = [];
    let output = '', inHead = false, inStyle = false, inScript = false;
    const chunks = html ? original.matchAll(/<!--[\s\S]*?-->|<#--[\s\S]*?-->|<\/?#[\s\S]*?>|<(?:"[^"]*"|'[^']*'|[^'">])*>|[^<]+|</g) : [{ 0: original, index: 0 }];
    for (const chunk of chunks) {
      const text = chunk[0], start = chunk.index;
      if (html && text.startsWith('<')) {
        if (/^<\/?#/.test(text)) continue;
        if (/^<head\b/i.test(text)) inHead = true;
        if (/^<style\b/i.test(text)) inStyle = true;
        if (/^<script\b/i.test(text)) inScript = true;
        output += text.replace(variable, token => escape(sample(token, original.slice(0, start))));
        if (/^<\/head\b/i.test(text)) inHead = false;
        if (/^<\/style\b/i.test(text)) inStyle = false;
        if (/^<\/script\b/i.test(text)) inScript = false;
        continue;
      }
      if (inHead || inStyle || inScript) { output += text; continue; }
      let cursor = 0;
      const copy = (value, offset) => {
        if (!value && !editable) return;
        const rendered = html ? value : escape(value);
        if (!editable || (value && !value.trim())) { output += rendered; return; }
        const index = parts.length;
        parts.push({ start: start + offset, end: start + offset + value.length, value, html });
        output += `<span class="tmCopy" data-tm-copy="${index}" contenteditable="plaintext-only" role="textbox" aria-label="${plain ? 'Subject' : 'Message'} text ${index + 1}" spellcheck="true">${rendered}</span>`;
      };
      for (const match of text.matchAll(variable)) {
        copy(text.slice(cursor, match.index), cursor);
        const value = escape(sample(match[0], original.slice(0, start + match.index)));
        output += editable ? `<span class="tmValue" contenteditable="false" title="Sample value is locked">${value}</span>` : value;
        cursor = match.index + match[0].length;
      }
      copy(text.slice(cursor), cursor);
    }
    return { original, html, parts, markup: html || plain ? output : `<div class="tmPlainMessage">${output}</div>` };
  }
  function rebuild(model, changes) {
    let body = model.original;
    for (let i = model.parts.length - 1; i >= 0; i--) {
      if (!changes.has(i)) continue;
      const part = model.parts[i];
      const value = part.html ? escape(changes.get(i)).replace(/\r?\n/g, '<br>') : changes.get(i);
      body = body.slice(0, part.start) + value + body.slice(part.end);
    }
    return body;
  }
  function safeMarkup(markup) {
    return markup.replace(/<(script|iframe|object|embed|form)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
      .replace(/<(?:meta|link|base|script|iframe|object|embed)\b[^>]*\/?\s*>/gi, '')
      .replace(/\s(?:on\w+|srcdoc)\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/gi, '')
      .replace(/\s(?:href|src)\s*=\s*(["'])\s*javascript:[\s\S]*?\1/gi, '')
      .replace(/<img\b[^>]*>/gi, tag => {
        const logo = /inebura_logo|inebura-logo/i.test(tag) ? 'inebura-logo.png' : /Client Logo|Sample client logo/i.test(tag) ? 'xeon-logo.jpg' : null;
        if (!logo) return '';
        const url = new URL('../assets/template-master/' + logo, location.href).href;
        return tag.replace(/\bsrc\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+)/i, `src="${escape(url)}"`);
      });
  }
  function frameDocument(markup, editable = false) {
    const safe = safeMarkup(markup);
    const imageOrigin = location.protocol === 'file:' ? 'file:' : location.origin;
    const rules = `html{overflow-wrap:anywhere}body{margin:0;padding:16px;font:14px/1.6 Calibri,"Segoe UI",Arial,sans-serif!important;color:#283244;background:#fff!important}body>div{max-width:none!important;width:100%!important;box-shadow:none!important}img{max-width:100%;object-fit:contain}table{max-width:100%}a{cursor:default}a *{cursor:text}.tmPlainMessage{white-space:pre-wrap}.tmCopy{white-space:pre-wrap;border-radius:3px;outline:none}.tmCopy:empty{display:inline-block;min-width:.5em;min-height:1em;vertical-align:baseline}.tmCopy:hover{background:#f7f3fc}.tmCopy:focus{background:#faf7ff;box-shadow:0 0 0 2px #b9a1d5}.tmValue{background:#f0e8f8;color:#583184;border:1px solid #d9c7e9;border-radius:4px;padding:1px 5px;box-decoration-break:clone;-webkit-box-decoration-break:clone;cursor:default;font-weight:500}.tmValue:before{content:'🔒';font-size:10px;padding-right:3px}p{min-height:1em}`;
    // Put our CSP first, and style last so captured message styles cannot narrow the preview.
    return `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src ${imageOrigin} data:; font-src 'none'; form-action 'none'; base-uri 'none'"><meta charset="utf-8">${safe}<style>${rules}${editable ? '' : 'a{pointer-events:none}.tmCopy{background:none!important;box-shadow:none!important}'}</style>`;
  }
  function attachEditor(root, model, onChange) {
    const changes = new Map(), baseline = new Map();
    root.querySelectorAll('[data-tm-copy]').forEach(node => baseline.set(Number(node.dataset.tmCopy), node.innerText));
    const update = event => {
      const node = event.target.closest('[data-tm-copy]');
      if (!node || !root.contains(node)) return;
      const index = Number(node.dataset.tmCopy), text = node.innerText;
      if (text === baseline.get(index)) changes.delete(index); else changes.set(index, text);
      onChange(rebuild(model, changes));
    };
    // Each copy span is an independent editing host. Tokens, links, table structure and other
    // hosts are outside it, so select-all, backspace, cut and paste cannot remove sample values.
    root.addEventListener('input', update);
    root.addEventListener('click', event => { if (event.target.closest('a')) event.preventDefault(); });
    root.addEventListener('dragstart', event => event.preventDefault());
    root.addEventListener('drop', event => event.preventDefault());
    root.addEventListener('keydown', event => {
      if (event.key === 'Enter' && root.classList.contains('tmSubjectEditor')) event.preventDefault();
    });
    return () => rebuild(model, changes);
  }
  window.IneburaTemplateEditor = { escape, sample, project, rebuild, frameDocument, attachEditor, directives };
})();
