/* Local Dunning documents: safe Word import and deterministic PDFs from frozen snapshots. */
(function (root) {
  'use strict';
  const pdfAssets = typeof document !== 'undefined' && document.currentScript?.src ? new URL('./vendor/pdfjs/', document.currentScript.src).href : '';
  const standardTemplateUrl = typeof document !== 'undefined' && document.currentScript?.src ? new URL('../assets/dunning/standard-dunning-letter.docx', document.currentScript.src).href : '../assets/dunning/standard-dunning-letter.docx';
  let pdfRenderer;
  let standardTemplateRequest;
  const escape = value => String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
  const decode = value => String(value).replace(/&(#x[0-9a-f]+|#\d+|amp|lt|gt|quot|apos|nbsp);/gi, (all, entity) => {
    const named = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' };
    if (entity[0] !== '#') return named[entity.toLowerCase()] ?? all;
    const n = entity[1].toLowerCase() === 'x' ? parseInt(entity.slice(2), 16) : Number(entity.slice(1));
    return n > 0 && n <= 0x10ffff ? String.fromCodePoint(n) : '';
  });
  const allowed = new Set(['p', 'div', 'br', 'h1', 'h2', 'h3', 'strong', 'b', 'em', 'i', 'u', 'ul', 'ol', 'li', 'blockquote', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span']);
  const blocked = new Set(['script', 'style', 'iframe', 'object', 'embed', 'svg', 'math', 'template', 'form', 'textarea', 'title', 'noscript']);
  const tokens = html => String(html ?? '').match(/<!--[\s\S]*?(?:-->|$)|<\/?[a-zA-Z][^>]*>|[^<]+|</g) || [];
  function sanitizeHtml(html) {
    let blockedTag = '', depth = 0;
    return tokens(html).map(token => {
      if (token.startsWith('<!--')) return '';
      const tag = token.match(/^<(\/?)\s*([a-zA-Z][a-zA-Z0-9]*)\b/);
      if (!tag) return blockedTag ? '' : escape(decode(token));
      const name = tag[2].toLowerCase(), closing = Boolean(tag[1]);
      if (blockedTag) {
        if (name === blockedTag) { depth += closing ? -1 : 1; if (!depth) blockedTag = ''; }
        return '';
      }
      if (blocked.has(name)) { if (!closing && !/\/>$/.test(token)) { blockedTag = name; depth = 1; } return ''; }
      if (!allowed.has(name)) return '';
      if (name === 'br') return '<br>';
      if (closing) return `</${name}>`;
      // No URLs, handlers, IDs or arbitrary styling survive imported/editor markup.
      const alignment = token.match(/(?:style\s*=\s*["'][^"']*text-align\s*:\s*|align\s*=\s*["']?)(left|center|right)\b/i)?.[1]?.toLowerCase();
      return `<${name}${alignment ? ` style="text-align:${alignment}"` : ''}>`;
    }).join('');
  }
  const amount = value => Number(value || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  function dateLabel(value) {
    const date = new Date(/^\d{4}-\d{2}-\d{2}$/.test(String(value || '')) ? `${value}T12:00:00Z` : value);
    return Number.isNaN(date.valueOf()) ? String(value || '') : date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', timeZone: 'UTC' });
  }
  const fieldSources = [
    ['customer.code', 'Customer code'],
    ['customer.name', 'Customer name'], ['customer.address', 'Customer address'], ['date', 'Letter date'], ['reference', 'Letter reference'],
    ['previousReferences', 'Previous letter references'], ['totalOutstanding', 'Sum of remaining outstanding'], ['originalTotal', 'Sum of original invoice amounts'],
    ['invoiceCount', 'Number of included invoices'], ['invoices', 'Invoice annexure']
  ];
  const defaultMappings = { customerCode: 'customer.code', customerName: 'customer.name', customerAddress: 'customer.address', letterDate: 'date', letterReference: 'reference', previousLetters: 'previousReferences', totalOutstanding: 'totalOutstanding', originalTotal: 'originalTotal', invoiceCount: 'invoiceCount', invoiceTable: 'invoices' };
  function valuesFor(snapshot) {
    const invoices = snapshot.invoices || [];
    const previous = snapshot.previousReferences || (snapshot.previousReference ? [snapshot.previousReference] : []);
    return {
      'customer.code': snapshot.customer?.customerCode || snapshot.customer?.code || snapshot.customerCode || '',
      'customer.name': snapshot.customer?.name || snapshot.customerName || '', 'customer.address': snapshot.customer?.address || '',
      date: dateLabel(snapshot.date || snapshot.sentAt), reference: snapshot.reference || '',
      previousReferences: Array.isArray(previous) ? previous.map(value => typeof value === 'string' ? value : value.reference || '').filter(Boolean).join(', ') || 'First letter' : String(previous),
      totalOutstanding: amount(invoices.reduce((sum, invoice) => sum + Number(invoice.outstanding || 0), 0)),
      originalTotal: amount(invoices.reduce((sum, invoice) => sum + Number(invoice.originalAmount ?? invoice.amount ?? invoice.outstanding ?? 0), 0)),
      invoiceCount: String(invoices.length), invoices: 'Please refer to the invoice annexure included with this letter.'
    };
  }
  function renderLetter(snapshot) {
    const template = snapshot.template || {};
    const mappings = { ...defaultMappings, ...(template.mappings || template.fieldMappings || {}), ...(snapshot.fieldMappings || {}) };
    const values = valuesFor(snapshot);
    let body = sanitizeHtml(snapshot.letterHtml || template.letterHtml || template.body || '');
    // The Word download shows the annexure scaffold on page 2. Its live table is
    // rendered separately from frozen invoices, never printed on the letter page.
    const annexureHeading = /<(?:p|h[1-3])\b[^>]*>(?:\s|<(?:strong|b)\b[^>]*>)*Invoice\s+annexure(?:\s|<\/(?:strong|b)>)*<\/(?:p|h[1-3])>/ig;
    for (const match of body.matchAll(annexureHeading)) {
      if (/\{\{\s*invoiceTable\s*\}\}/.test(body.slice(match.index))) { body = body.slice(0, match.index); break; }
    }
    return body.replace(/\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g, (_, token) => escape(values[mappings[token]] ?? `[Unmapped: ${token}]`));
  }
  function validateTemplate(template) {
    const body = sanitizeHtml(template.letterHtml || template.body || '');
    if (!plainText(body).trim()) throw new Error('Add letter wording before saving.');
    if (!(template.emailSubject || '').trim() || !(template.emailBody || '').trim()) throw new Error('Add the email subject and email message.');
    const mappings = template.fieldMappings || template.mappings || {};
    const validSources = new Set(fieldSources.map(([value]) => value));
    const fields = [...new Set([...`${body} ${template.emailSubject || ''} ${template.emailBody || ''}`.matchAll(/\{\{\s*([A-Za-z][A-Za-z0-9_]*)\s*\}\}/g)].map(match => match[1]))];
    for (const name of fields) if (!validSources.has(mappings[name])) throw new Error(`Choose a data field for {{${name}}}.`);
    const rules = template.calculation;
    if (rules && !['SUM(outstanding)', 'sumOutstanding'].includes(rules) && (typeof rules !== 'object' || Object.entries(rules).some(([key, rule]) => !({ totalOutstanding: 'sumOutstanding', originalTotal: 'sumOriginalAmount', invoiceCount: 'countInvoices' }[key] === rule)))) throw new Error('Choose one of the available calculation rules.');
    return true;
  }
  function plainText(html) { return decode(String(html || '').replace(/<br\s*\/?\s*>/gi, '\n').replace(/<\/(?:p|div|h[1-3]|li|tr|blockquote)>/gi, '\n').replace(/<[^>]*>/g, '')).trim(); }
  function sampleSnapshot(template, count = 3) {
    const invoices = Array.from({ length: count }, (_, index) => ({ id: `sample-${index + 1}`, invoiceNo: `INV-2026-${String(index + 1).padStart(4, '0')}`, dueDate: '2026-10-05', originalAmount: 25000 + index * 1250, outstanding: 18000 + index * 1000 }));
    return { template: JSON.parse(JSON.stringify(template)), letterHtml: template.letterHtml || template.body, fieldMappings: template.fieldMappings || template.mappings, customer: { customerCode:'SAMPLE-CUST-001', name: 'Example Customer Pvt Ltd', address: '12 Business Park, New Delhi' }, invoices, date: '2026-10-20', sentAt: '2026-10-20T09:00:00.000Z', reference: 'SAMPLE-DL-20261020-001', previousReferences: (template.stageNumber || 1) > 1 ? ['SAMPLE-DL-20261013-001'] : [], stageNumber: template.stageNumber || 1 };
  }
  function htmlPreview(snapshot) {
    return `<!doctype html><html><head><meta charset="utf-8"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline';"><style>body{margin:0;background:#eef0f4;color:#253047;font:14px/1.6 Arial,sans-serif}.page{margin:20px auto;padding:42px;max-width:740px;background:white;box-sizing:border-box}.head{border-bottom:2px solid #5c258d;padding-bottom:12px;margin-bottom:24px}.head h1{font-size:19px;margin:0;color:#4b1f73}.meta{font-size:11px;color:#697386}.letter h1{font-size:22px}.letter h2{font-size:18px}.letter p{margin:0 0 14px}.letter table{border-collapse:collapse;width:100%}.letter td,.letter th{border:1px solid #ddd;padding:8px}.annexure{page-break-before:always}.annexure h2{font-size:18px;color:#4b1f73}table{width:100%;border-collapse:collapse;font-size:12px}th,td{text-align:left;padding:10px 8px;border-bottom:1px solid #ddd;overflow-wrap:anywhere}th{background:#f0e9f7;color:#4b1f73}.number{text-align:right}tfoot{font-weight:bold}.foot{font-size:11px;color:#6b7280;margin-top:28px}@media(max-width:600px){.page{padding:22px;margin:12px}.annexure{overflow:auto}}</style></head><body><section class="page"><div class="head"><h1>Dunning Letter ${escape(snapshot.stageNumber || 1)}</h1><div class="meta">${escape(snapshot.reference)} · ${escape(dateLabel(snapshot.date || snapshot.sentAt))}</div></div><div class="letter">${renderLetter(snapshot)}</div></section><section class="page annexure"><h2>Invoice annexure</h2><p class="meta">${escape(snapshot.customer?.name || '')} · ${escape(snapshot.reference)}</p><table><thead><tr><th>Invoice no.</th><th>Invoice date</th><th>Due date</th><th class="number">Invoice amount</th><th class="number">Amount due</th><th>Description</th></tr></thead><tbody>${(snapshot.invoices || []).map(invoice => `<tr><td>${escape(invoice.invoiceNo || invoice.id)}</td><td>${escape(dateLabel(invoice.invoiceDate))}</td><td>${escape(dateLabel(invoice.dueDate))}</td><td class="number">${escape(amount(invoice.originalAmount ?? invoice.amount ?? invoice.outstanding))}</td><td class="number">${escape(amount(invoice.outstanding))}</td><td>${escape(invoice.description || invoice.desc || '')}</td></tr>`).join('')}</tbody><tfoot><tr><td colspan="4">Total remaining outstanding</td><td class="number">${escape(valuesFor(snapshot).totalOutstanding)}</td><td></td></tr></tfoot></table><p class="foot">Amounts and included invoices are captured for this letter.</p></section></body></html>`;
  }
  function letterBlocks(html) {
    const blocks = []; let current = { runs: [], size: 11, align: 'left' }, bold = 0, italic = 0;
    function flush() { if (current.runs.some(run => run.text.trim())) blocks.push(current); current = { runs: [], size: 11, align: 'left' }; }
    for (const token of tokens(sanitizeHtml(html))) {
      const tag = token.match(/^<(\/?)\s*([a-zA-Z0-9]+)/);
      if (!tag) { current.runs.push({ text: decode(token), bold: bold > 0, italic: italic > 0 }); continue; }
      const name = tag[2].toLowerCase(), close = Boolean(tag[1]);
      if (['b', 'strong'].includes(name)) { bold = Math.max(0, bold + (close ? -1 : 1)); continue; }
      if (['i', 'em'].includes(name)) { italic = Math.max(0, italic + (close ? -1 : 1)); continue; }
      if (name === 'br') { current.runs.push({ text: '\n', bold: false, italic: false }); continue; }
      if (['th', 'td'].includes(name) && close) current.runs.push({ text: '   ', bold: false, italic: false });
      if (['p', 'div', 'h1', 'h2', 'h3', 'li', 'blockquote', 'tr'].includes(name)) {
        flush();
        if (!close) {
          current.size = ({ h1: 18, h2: 15, h3: 13 })[name] || 11;
          current.align = token.match(/text-align:(left|center|right)/)?.[1] || 'left';
          if (name.startsWith('h')) current.heading = true;
          if (name === 'li') current.runs.push({ text: '- ', bold: false, italic: false });
        }
      }
    }
    flush(); return blocks;
  }
  function ascii(value) { return String(value || '').replace(/[\u2018\u2019]/g, "'").replace(/[\u201c\u201d]/g, '"').replace(/[\u2010-\u2015]/g, '-').replace(/\u2026/g, '...').replace(/\u00a0/g, ' '); }
  function stableId(snapshot) {
    const value = JSON.stringify(snapshot); let a = 2166136261, b = 5381;
    for (let i = 0; i < value.length; i++) { a = Math.imul(a ^ value.charCodeAt(i), 16777619); b = Math.imul(b, 33) ^ value.charCodeAt(i); }
    return ((a >>> 0).toString(16).padStart(8, '0') + (b >>> 0).toString(16).padStart(8, '0')).repeat(2).toUpperCase();
  }
  function buildPdf(snapshot) {
    const Pdf = root.jspdf?.jsPDF;
    if (!Pdf) throw new Error('The local PDF renderer could not be loaded. Reload this page and try again.');
    const pdf = new Pdf({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true, putOnlyUsedFonts: true, precision: 3 });
    const when = new Date(snapshot.sentAt || `${snapshot.date || '2000-01-01'}T12:00:00Z`);
    const validDate = Number.isNaN(when.valueOf()) ? new Date('2000-01-01T12:00:00Z') : when;
    pdf.setCreationDate(`D:${validDate.toISOString().replace(/[-:T]/g, '').slice(0, 14)}+00'00'`);
    pdf.setFileId(stableId(snapshot)); pdf.setProperties({ title: `Dunning Letter ${snapshot.stageNumber || 1} - ${snapshot.reference || ''}`, author: 'Inebura', subject: 'Payment reminder and invoice annexure', creator: 'Inebura Dunning Letters' });
    const margin = 20, contentWidth = 170, bottom = 273; let y = 0;
    const font = (bold, italic, size) => { pdf.setFont('helvetica', bold && italic ? 'bolditalic' : bold ? 'bold' : italic ? 'italic' : 'normal'); pdf.setFontSize(size); };
    function header(title) {
      font(true, false, 16); pdf.setTextColor(75, 31, 115); pdf.text(title, margin, 23);
      font(false, false, 9); pdf.setTextColor(90, 99, 115); pdf.text(ascii(`${snapshot.reference || ''} | ${dateLabel(snapshot.date || snapshot.sentAt)}`), margin, 30);
      pdf.setDrawColor(205, 192, 219); pdf.line(margin, 34, 190, 34); pdf.setTextColor(37, 48, 71); y = 45;
      const previous = snapshot.previousReference || snapshot.previousReferences?.at(-1);
      const reference = typeof previous === 'string' ? previous : previous?.reference;
      if (reference) {
        font(false, false, 9);
        const lines = pdf.splitTextToSize(ascii(`Previous letter: ${reference}`), contentWidth);
        pdf.text(lines, margin, 40);
        y = Math.max(y, 44 + lines.length * 4);
      }
    }
    header(`Dunning Letter ${snapshot.stageNumber || 1}`);
    function newLetterPage() { pdf.addPage(); header(`Dunning Letter ${snapshot.stageNumber || 1} - continued`); }
    for (const block of letterBlocks(renderLetter(snapshot))) {
      const lineHeight = block.size * 0.3528 * 1.48; let line = [], width = 0;
      function outputLine() {
        if (!line.length) { y += lineHeight; return; }
        if (y + lineHeight > bottom) newLetterPage();
        let x = margin + (block.align === 'center' ? (contentWidth - width) / 2 : block.align === 'right' ? contentWidth - width : 0);
        for (const word of line) { font(word.bold || block.heading, word.italic, block.size); pdf.text(word.text, x, y); x += word.width; }
        y += lineHeight; line = []; width = 0;
      }
      for (const run of block.runs) {
        for (let word of ascii(run.text).split(/(\n|\s+)/).filter(Boolean)) {
          if (word === '\n') { outputLine(); continue; }
          if (/^\s+$/.test(word)) word = ' ';
          if (!line.length && word === ' ') continue;
          font(run.bold || block.heading, run.italic, block.size);
          // Break unusually long IDs/URLs as well as ordinary words; never clip the page.
          const parts = pdf.getTextWidth(word) > contentWidth ? pdf.splitTextToSize(word, contentWidth) : [word];
          for (const part of parts) {
            const w = pdf.getTextWidth(part);
            if (width + w > contentWidth && line.length) outputLine();
            if (!line.length && part === ' ') continue;
            line.push({ text: part, width: w, bold: run.bold, italic: run.italic }); width += w;
          }
        }
      }
      if (line.length) outputLine(); y += 3;
    }
    const columns = [
      {label:'Invoice no.',x:22,width:34,value:invoice=>invoice.invoiceNo || invoice.id},
      {label:'Invoice date',x:57,width:24,value:invoice=>dateLabel(invoice.invoiceDate)},
      {label:'Due date',x:83,width:24,value:invoice=>dateLabel(invoice.dueDate)},
      {label:'Invoice amount',x:109,width:28,number:true,value:invoice=>amount(invoice.originalAmount ?? invoice.amount ?? invoice.outstanding)},
      {label:'Amount due',x:139,width:26,number:true,value:invoice=>amount(invoice.outstanding)},
      {label:'Description',x:167,width:21,value:invoice=>invoice.description || invoice.desc || ''}
    ];
    function annexureHeader() {
      header('Invoice annexure'); font(false, false, 10);
      const nameLines = pdf.splitTextToSize(ascii(snapshot.customer?.name || ''), contentWidth); pdf.text(nameLines, margin, y); y += nameLines.length * 5 + 6;
      pdf.setFillColor(240, 233, 247); pdf.rect(margin, y - 5, contentWidth, 13, 'F'); font(true, false, 8);
      for (const column of columns) pdf.text(pdf.splitTextToSize(column.label,column.width),column.number?column.x+column.width:column.x,y,{align:column.number?'right':'left'});
      y += 15;
    }
    pdf.addPage(); annexureHeader();
    for (const invoice of snapshot.invoices || []) {
      font(false, false, 8);
      const cells=columns.map(column=>pdf.splitTextToSize(ascii(column.value(invoice)),column.width));
      const height = Math.max(10,...cells.map(lines=>lines.length * 4.3 + 5));
      if (y + height > bottom) { pdf.addPage(); annexureHeader(); }
      font(false, false, 8);
      columns.forEach((column,index)=>pdf.text(cells[index],column.number?column.x+column.width:column.x,y,{align:column.number?'right':'left'}));
      y += height; pdf.setDrawColor(227, 229, 234); pdf.line(margin, y - 4, 190, y - 4);
    }
    if (y + 16 > bottom) { pdf.addPage(); annexureHeader(); }
    font(true, false, 10); pdf.text('Total remaining outstanding', 22, y + 3); pdf.text(valuesFor(snapshot).totalOutstanding, 188, y + 3, { align: 'right' });
    const pages = pdf.getNumberOfPages();
    for (let number = 1; number <= pages; number++) { pdf.setPage(number); font(false, false, 8); pdf.setTextColor(115, 119, 130); pdf.text(ascii(snapshot.reference || ''), margin, 286); pdf.text(`Page ${number} of ${pages}`, 190, 286, { align: 'right' }); }
    return pdf;
  }
  // createPdf returns a data:application/pdf;base64,... string. It only reads its snapshot.
  const createPdf = snapshot => buildPdf(snapshot).output('datauristring');
  const filename = snapshot => `${String(snapshot.reference || 'dunning-letter').replace(/[^a-zA-Z0-9_-]/g, '-')}.pdf`;
  function download(snapshot) { const data = snapshot.pdfDataUri || createPdf(snapshot); const anchor = document.createElement('a'); anchor.href = data; anchor.download = filename(snapshot); document.body.appendChild(anchor); anchor.click(); anchor.remove(); return data; }
  let previewClose;
  function preview(snapshot) {
    previewClose?.();
    const pdfData = snapshot.pdfDataUri || createPdf(snapshot);
    const binary = atob(pdfData.split(',')[1]);
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    let loadingTask = null, pdfDocument = null, cancelled = false;
    const overlay = document.createElement('div'); overlay.className = 'dunningDocumentPreview';
    overlay.innerHTML = `<section role="dialog" aria-modal="true" aria-labelledby="ddPreviewTitle"><header><div><h2 id="ddPreviewTitle">Letter and invoice annexure</h2><p>${escape(snapshot.reference || '')} · ${escape(snapshot.customer?.name || '')}</p></div><button type="button" data-dd-close aria-label="Close letter preview">×</button></header><div class="ddPdfPages" role="document" aria-label="Generated Dunning Letter and invoice annexure" tabindex="0"><p class="ddLoading" role="status">Rendering PDF…</p></div><footer><span>One PDF · ${escape((snapshot.invoices || []).length)} invoices</span><button type="button" data-dd-download>Download PDF</button></footer><p class="ddError" role="alert" hidden></p></section>`;
    const previousFocus = document.activeElement, previousOverflow = document.body.style.overflow;
    const close = () => { cancelled = true; (pdfDocument || loadingTask)?.destroy?.()?.catch?.(() => {}); overlay.remove(); document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', keydown); previewClose = null; previousFocus?.focus?.(); };
    const keydown = event => { if (event.key === 'Escape') { event.preventDefault(); event.stopImmediatePropagation(); close(); } if (event.key === 'Tab') { const controls = [...overlay.querySelectorAll('button')]; if (event.shiftKey && document.activeElement === controls[0]) { event.preventDefault(); controls.at(-1).focus(); } else if (!event.shiftKey && document.activeElement === controls.at(-1)) { event.preventDefault(); controls[0].focus(); } } };
    previewClose = close;
    overlay.addEventListener('click', event => { if (event.target === overlay || event.target.closest('[data-dd-close]')) close(); if (event.target.closest('[data-dd-download]')) { try { download(snapshot); } catch (error) { const message = overlay.querySelector('.ddError'); message.hidden = false; message.textContent = error.message; } } });
    document.body.appendChild(overlay); document.body.style.overflow = 'hidden'; document.addEventListener('keydown', keydown); overlay.querySelector('[data-dd-close]').focus();
    (async () => {
      // Render the actual retained PDF bytes. Embedded native PDF viewers are unavailable
      // in several in-app browsers, so use the same local renderer on every surface.
      if (!pdfRenderer) pdfRenderer = import(`${pdfAssets}pdf.min.mjs`);
      const renderer = await pdfRenderer; if (cancelled) return;
      renderer.GlobalWorkerOptions.workerSrc = `${pdfAssets}pdf.worker.min.mjs`;
      loadingTask = renderer.getDocument({ data: bytes, standardFontDataUrl: `${pdfAssets}standard_fonts/`, useSystemFonts: true, isEvalSupported: false });
      pdfDocument = await loadingTask.promise; if (cancelled) return;
      const pages = overlay.querySelector('.ddPdfPages'); pages.innerHTML = '';
      overlay.querySelector('footer>span').textContent = `One PDF · ${pdfDocument.numPages} pages · ${(snapshot.invoices || []).length} invoices`;
      for (let number = 1; number <= pdfDocument.numPages; number++) {
        if (cancelled) return;
        const page = await pdfDocument.getPage(number); if (cancelled) return;
        const pageRoot = document.createElement('section'); pageRoot.className = 'ddPdfPage'; pageRoot.setAttribute('aria-label', `PDF page ${number} of ${pdfDocument.numPages}`);
        const canvas = document.createElement('canvas'); canvas.setAttribute('aria-hidden', 'true'); pageRoot.appendChild(canvas); pages.appendChild(pageRoot);
        const base = page.getViewport({ scale: 1 }), available = Math.max(240, Math.min(790, pages.clientWidth - 48));
        const viewport = page.getViewport({ scale: available / base.width }); const density = Math.min(root.devicePixelRatio || 1, 2);
        canvas.width = Math.ceil(viewport.width * density); canvas.height = Math.ceil(viewport.height * density); canvas.style.width = `${viewport.width}px`; canvas.style.height = `${viewport.height}px`;
        const context = canvas.getContext('2d', { alpha: false });
        await page.render({ canvasContext: context, viewport, transform: density === 1 ? null : [density, 0, 0, density, 0, 0] }).promise;
        if (cancelled) return;
        const content = await page.getTextContent(); const accessible = document.createElement('div'); accessible.className = 'ddAccessibleText'; accessible.textContent = content.items.map(item => item.str || '').join(' '); pageRoot.appendChild(accessible);
      }
    })().catch(caught => { if (!cancelled) { const message = overlay.querySelector('.ddError'); message.hidden = false; message.textContent = `The PDF preview could not load. You can still download the PDF. ${caught.message || ''}`; overlay.querySelector('.ddLoading')?.remove(); } });
    return close;
  }
  async function importDocx(file) {
    if (!/\.docx$/i.test(file.name || '')) throw new Error('Choose a Word .docx file.');
    if (file.size > 5 * 1024 * 1024) throw new Error('Choose a Word file smaller than 5 MB.');
    if (!root.mammoth) throw new Error('The local Word importer could not be loaded. Reload this page and try again.');
    const result = await root.mammoth.convertToHtml({ arrayBuffer: await file.arrayBuffer() }, { externalFileAccess: false, convertImage: root.mammoth.images.imgElement(() => Promise.resolve({ src: '' })) });
    // A Word scaffold containing the full-table marker illustrates the annexure
    // columns. Keep only its dynamic marker on import; the frozen invoice data
    // supplies the annexure, rather than sending the scaffold's placeholder row.
    const html = sanitizeHtml(result.value).replace(/<table>([\s\S]*?)<\/table>/g, (table, content) => {
      const text = plainText(content);
      if (/<table>/.test(content) || !/\{\{\s*invoiceTable\s*\}\}/.test(text)) return table;
      const remainder = text.replace(/\{\{\s*invoiceTable\s*\}\}/g, '');
      // Other (including incomplete) markers must still reach upload validation.
      if (/\{\{|\}\}|\$\{/.test(remainder)) return table;
      return '<p>{{invoiceTable}}</p>';
    });
    if (!plainText(html).trim()) throw new Error('This Word document has no letter text to import.');
    return { html, messages: result.messages.map(message => String(message.message || '')) };
  }
  async function loadStandardTemplate() {
    if (!standardTemplateRequest) standardTemplateRequest = (async()=>{
      if (typeof root.fetch !== 'function') throw new Error('The standard Word template could not be loaded. Reload this page and try again.');
      const response=await root.fetch(standardTemplateUrl,{cache:'no-cache'});
      if(!response.ok) throw new Error('The standard Word template could not be loaded. Reload this page and try again.');
      const bytes=await response.arrayBuffer();
      const result=await importDocx({name:'standard-dunning-letter.docx',size:bytes.byteLength,arrayBuffer:async()=>bytes});
      return {...result,sourceFileName:'standard-dunning-letter.docx',sourceType:'standard',standardReady:true};
    })().catch(error=>{standardTemplateRequest=null;throw error;});
    return standardTemplateRequest;
  }
  root.IneburaDunningDocuments = Object.freeze({ sanitizeHtml, plainText, fieldSources, defaultMappings, valuesFor, renderLetter, validateTemplate, sampleSnapshot, htmlPreview, createPdf, download, preview, previewSnapshot: preview, downloadSnapshot: download, importDocx, loadStandardTemplate, standardTemplateUrl });
})(typeof window !== 'undefined' ? window : globalThis);
