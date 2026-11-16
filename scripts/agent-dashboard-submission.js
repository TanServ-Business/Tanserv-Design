/* Submission analytics on the agent dashboard. */
(() => {
  'use strict';
  const journey = window.SubmissionJourney;
  const insights = window.SubmissionInsights;
  const scope = document.getElementById('submissionInsightsScope');
  if (!journey || !insights || !scope) return;

  const agingCanvas = document.getElementById('chartSubmissionAging');
  const mixRows = document.getElementById('submissionMixRows');
  const asCount = value => `${value.toLocaleString('en-IN')} ${value === 1 ? 'invoice' : 'invoices'}`;
  const asCurrency = value => new Intl.NumberFormat('en-IN', { style:'currency', currency:'INR', maximumFractionDigits:0 }).format(value);
  const detailModal = document.getElementById('submissionAgingDetailModal');
  const detailSearch = document.getElementById('submissionAgingDetailSearch');
  const detailBody = document.getElementById('submissionAgingDetailTableBody');
  const detailSummary = document.getElementById('submissionAgingDetailSummary');
  const detailLegend = document.getElementById('submissionAgingDetailLegend');
  const detailCanvas = document.getElementById('submissionAgingDetailCanvas');
  const acknowledgedCard = document.querySelector('.submissionAcknowledgedCard');
  const acknowledgedModal = document.getElementById('submissionAcknowledgedModal');
  const acknowledgedSearch = document.getElementById('submissionAcknowledgedSearch');
  const acknowledgedBody = document.getElementById('submissionAcknowledgedTableBody');
  const acknowledgedSummary = document.getElementById('submissionAcknowledgedSummary');
  const acknowledgedSubtotal = document.getElementById('submissionAcknowledgedSubtotal');
  const acknowledgedModeFilter = document.getElementById('submissionAcknowledgedModeFilter');
  const acknowledgedModeValue = document.getElementById('submissionAcknowledgedModeValue');
  const detailColors = ['#8757b0','#ad86cd','#5a8ac4','#54aebb','#39a78f','#d8a154','#db8191','#a6aad7','#897bc8','#87b3a1','#b9a5cf'];
  let agingChart = null;
  let detailChart = null;
  let currentInvoices = [];
  let currentAgingConfig = { thresholds:insights.DEFAULT_THRESHOLDS, groups:[] };
  let detailRows = [];
  let acknowledgedRows = [];
  let acknowledgedMode = 'all';
  let recordsUnavailable = false;

  function asDate(value) {
    const key = journey.keyDate(value);
    const date = new Date(`${key}T00:00:00Z`);
    return /^\d{4}-\d{2}-\d{2}$/.test(key) && Number.isFinite(date.getTime())
      ? new Intl.DateTimeFormat('en-GB', { day:'2-digit', month:'short', year:'numeric', timeZone:'UTC' }).format(date)
      : 'Not recorded';
  }

  function submissionMode(invoice) {
    const medium = String(invoice.submissionMedium || invoice.method || '').toLowerCase();
    if (medium === 'automated') return 'Automated';
    if (medium === 'manual' || medium === 'external' || invoice.submissionStatus === 'External Submission') return 'Manual';
    return 'Not recorded';
  }

  const acknowledgementMode = proof => proof.source === "Customer's Acknowledgement" ? 'Online' : 'Manual';

  function renderAcknowledgedTable() {
    if (!acknowledgedBody) return;
    const query = acknowledgedSearch.value.trim().toLowerCase();
    const rows = acknowledgedRows.filter(({ invoice, proof }) => (acknowledgedMode === 'all' || submissionMode(invoice) === acknowledgedMode) && (!query || [
      invoice.invoiceNo, invoice.code, invoice.name, asDate(invoice.invoiceDate), invoice.value,
      asDate(invoice.lastSubmittedAt || invoice.submissionDate || invoice.firstSubmittedAt),
      submissionMode(invoice), asDate(proof.on || proof.at), acknowledgementMode(proof)
    ].some(value => String(value || '').toLowerCase().includes(query))));
    acknowledgedBody.replaceChildren();
    acknowledgedSummary.textContent = recordsUnavailable ? 'Submission records unavailable'
      : `${asCount(rows.length)}${query || acknowledgedMode !== 'all' ? ` of ${acknowledgedRows.length}` : ''}`;
    acknowledgedSubtotal.textContent = recordsUnavailable ? '—'
      : asCurrency(rows.reduce((sum, row) => sum + (Number(row.invoice.value) || 0), 0));
    document.getElementById('submissionAcknowledgedModalMeta').textContent = `Submitted invoices with acknowledgement proof · ${scope.textContent}`;
    rows.forEach(({ invoice, proof }) => {
      const tr = document.createElement('tr');
      const addCell = value => {
        const td = document.createElement('td');
        if (value != null) td.textContent = value;
        tr.append(td);
        return td;
      };
      addCell(invoice.code || 'Not recorded');
      addCell(invoice.name || 'Not recorded');
      const link = document.createElement('a');
      link.textContent = invoice.invoiceNo;
      link.href = `submission.html?${new URLSearchParams({ invoice:invoice.invoiceNo })}`;
      link.setAttribute('aria-label', `View submission details for invoice ${invoice.invoiceNo}`);
      addCell().append(link);
      addCell(asDate(invoice.invoiceDate));
      addCell(asCurrency(Number(invoice.value) || 0));
      addCell(asDate(invoice.lastSubmittedAt || invoice.submissionDate || invoice.firstSubmittedAt));
      addCell(submissionMode(invoice));
      addCell(asDate(proof.on || proof.at));
      addCell(acknowledgementMode(proof));
      acknowledgedBody.append(tr);
    });
    if (!rows.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 9;
      td.className = 'submissionAcknowledgedEmpty';
      td.textContent = recordsUnavailable ? 'Submission records could not be loaded. Close this popup and try again.'
        : query || acknowledgedMode !== 'all' ? 'No acknowledged invoices match your search or submission mode.'
          : 'No acknowledged invoices in this portfolio. Invoices appear here once submission acknowledgement is recorded.';
      tr.append(td);
      acknowledgedBody.append(tr);
    }
  }

  function openAcknowledged() {
    if (!acknowledgedModal || !window.bootstrap?.Modal) return;
    acknowledgedSearch.value = '';
    acknowledgedMode = 'all';
    if (acknowledgedModeValue) acknowledgedModeValue.textContent = 'All';
    if (acknowledgedModeFilter) acknowledgedModeFilter.open = false;
    render();
    bootstrap.Modal.getOrCreateInstance(acknowledgedModal).show();
  }

  function renderDetailTable() {
    if (!detailBody) return;
    const search = detailSearch.value.trim().toLowerCase();
    const invoices = search ? currentInvoices.filter(invoice => [
      invoice.code, invoice.customerCode, invoice.name, invoice.customerName
    ].some(value => String(value || '').toLowerCase().includes(search))) : currentInvoices;
    detailRows = insights.detailRows(invoices, currentAgingConfig, journey);
    const visible = detailRows;
    detailBody.replaceChildren();
    visible.forEach(row => {
      const sourceIndex = detailRows.indexOf(row);
      const color = row.color || detailColors[sourceIndex % detailColors.length];
      const tr = document.createElement('tr');
      const cells = [row.label, row.count.toLocaleString('en-IN'), row.customers.toLocaleString('en-IN'),
        row.submitted.toLocaleString('en-IN'), row.pending.toLocaleString('en-IN'),
        row.valuedInvoices ? asCurrency(row.value) : '—'];
      cells.forEach((value, cellIndex) => {
        const td = document.createElement('td');
        if (cellIndex === 0) {
          const name = document.createElement('span');
          name.className = 'vintageBucketName';
          const dot = document.createElement('span');
          dot.className = 'vintageBucketDot';
          dot.style.setProperty('--vintage-bucket-color', color);
          name.append(dot, document.createTextNode(value));
          td.append(name);
        } else td.textContent = value;
        tr.append(td);
      });
      const shareCell = document.createElement('td');
      const share = document.createElement('span');
      share.className = 'vintageBucketShareCell';
      const track = document.createElement('span');
      track.className = 'vintageShareProgress';
      track.setAttribute('role', 'progressbar');
      track.setAttribute('aria-valuemin', '0');
      track.setAttribute('aria-valuemax', '100');
      track.setAttribute('aria-valuenow', row.share.toFixed(1));
      const fill = document.createElement('span');
      fill.className = 'vintageShareProgressFill';
      fill.style.setProperty('--vintage-bucket-color', color);
      fill.style.width = `${Math.max(0, Math.min(100, row.share))}%`;
      track.append(fill);
      const percent = document.createElement('span');
      percent.className = 'vintageBucketBarText';
      percent.textContent = `${row.share.toFixed(1)}%`;
      share.append(track, percent);
      shareCell.append(share);
      tr.append(shareCell);
      detailBody.append(tr);
    });
    const total = detailRows.reduce((sum, row) => sum + row.count, 0);
    detailSummary.textContent = `${detailRows.length} ranges · ${asCount(total)}${search ? ' matching customers' : ''}`;
    renderDetailComposition(invoices);
  }

  function openDetail() {
    if (!detailModal || !window.bootstrap?.Modal) return;
    render();
    detailSearch.value = '';
    renderDetailTable();
    bootstrap.Modal.getOrCreateInstance(detailModal).show();
  }

  function renderDetailComposition(invoices) {
    detailLegend.replaceChildren();
    detailRows.forEach((row, index) => {
      const legendItem = document.createElement('span');
      legendItem.className = 'vintageDetailLegendItem';
      const dot = document.createElement('span');
      dot.className = 'vintageDetailLegendDot';
      dot.style.setProperty('--vintage-bucket-color', row.color || detailColors[index % detailColors.length]);
      legendItem.append(dot, document.createTextNode(row.label));
      detailLegend.append(legendItem);
    });
    const unavailable = invoices.length - detailRows.reduce((sum, row) => sum + row.count, 0);
    document.getElementById('submissionAgingDetailMeta').textContent = unavailable
      ? `Invoice date to submission date, or today when pending · ${asCount(unavailable)} without a usable date`
      : 'Invoice date to submission date, or today when pending';
    detailCanvas.setAttribute('aria-label', detailRows.map(row => `${row.label}: ${asCount(row.count)}`).join('; '));
    if (detailChart) {
      detailChart.data.labels = detailRows.map(row => row.label);
      detailChart.data.datasets[0].data = detailRows.map(row => row.count);
      detailChart.data.datasets[0].backgroundColor = detailRows.map((row, index) => row.color || detailColors[index % detailColors.length]);
      detailChart.update();
      return;
    }
    detailChart = new Chart(detailCanvas.getContext('2d'), {
      type:'doughnut',
      data:{ labels:detailRows.map(row => row.label), datasets:[{
        data:detailRows.map(row => row.count), backgroundColor:detailRows.map((row, index) => row.color || detailColors[index % detailColors.length]),
        borderColor:'#fff', borderWidth:2, hoverOffset:5
      }] },
      options:{ responsive:true, maintainAspectRatio:false, cutout:'62%', plugins:{
        legend:{ display:false },
        tooltip:{ callbacks:{ label:context => `${context.label}: ${asCount(context.parsed)}` } }
      } }
    });
  }

  function renderAgingChart(ranges) {
    if (!agingCanvas || !window.Chart) return;
    const labels = ranges.map(range => range.color ? (range.label.length > 14 ? `${range.label.slice(0, 13)}…` : range.label) : range.end === Infinity ? `${range.start}+` : range.start === range.end ? `${range.start}` : `${range.start}–${range.end}`);
    const values = ranges.map(range => range.count);
    const colors = ranges.map((range, index) => range.color || [
      'rgba(92,37,141,.20)', 'rgba(92,37,141,.35)', 'rgba(92,37,141,.52)',
      'rgba(59,130,246,.40)', 'rgba(20,184,166,.42)', 'rgba(245,158,11,.48)'
    ][index % 6]);
    agingCanvas.setAttribute('aria-label', ranges.map(range => `${range.label}: ${asCount(range.count)}`).join('; '));
    if (agingChart) {
      agingChart.data.labels = labels;
      agingChart.data.datasets[0].data = values;
      agingChart.data.datasets[0].backgroundColor = colors;
      agingChart.update();
      return;
    }
    agingChart = new Chart(agingCanvas.getContext('2d'), {
      type:'bar',
      data:{ labels, datasets:[{ label:'Invoices', data:values, backgroundColor:colors, borderRadius:6, barThickness:12, maxBarThickness:14, categoryPercentage:.7, barPercentage:.7 }] },
      options:{
        responsive:true, maintainAspectRatio:false,
        plugins:{
          legend:{ display:false },
          tooltip:{
            backgroundColor:'#4b1f73', titleColor:'#fff', bodyColor:'#fff', padding:10,
            title:items => ranges[items[0]?.dataIndex]?.label || '',
            label:item => asCount(item.parsed.y || 0)
          }
        },
        scales:{
          x:{ grid:{ color:'rgba(148,163,184,.2)' }, ticks:{ color:'#64748b', font:{ size:10 }, maxRotation:0 } },
          y:{ beginAtZero:true, grid:{ color:'rgba(148,163,184,.2)' }, ticks:{ color:'#64748b', font:{ size:10 }, precision:0 } }
        }
      }
    });
  }

  function render() {
    try {
      recordsUnavailable = false;
      const state = journey.load(localStorage);
      const allInvoices = state.invoices || [];
      const agentName = document.querySelector('.heroTitleRow h1')?.textContent.trim() || '';
      const hasAgentAssignments = allInvoices.some(invoice => String(invoice.agent || '').trim());
      const invoices = hasAgentAssignments
        ? allInvoices.filter(invoice => String(invoice.agent || '').trim().toLowerCase() === agentName.toLowerCase())
        : allInvoices;
      scope.textContent = hasAgentAssignments
        ? `${asCount(invoices.length)} assigned to ${agentName}`
        : `Demo submission records · ${asCount(invoices.length)} across all customers`;
      const agingConfig = insights.readConfig(localStorage);
      const summary = insights.summarize(invoices, agingConfig, journey);
      const attachments = journey.issueAttachments(journey.readIssues(localStorage));
      const submittedInvoices = invoices.filter(journey.submitted);
      acknowledgedRows = submittedInvoices.map(invoice => ({ invoice, proof:journey.acknowledgementProof(state, invoice, attachments) }))
        .filter(row => row.proof).sort((a, b) => Date.parse(b.proof.at) - Date.parse(a.proof.at));
      const acknowledged = acknowledgedRows.length;
      document.getElementById('submissionAcknowledgedCount').textContent = acknowledged.toLocaleString('en-IN');
      document.getElementById('submissionAcknowledgedPending').textContent = `${asCount(submittedInvoices.length - acknowledged)} pending acknowledgement`;
      currentInvoices = invoices;
      currentAgingConfig = agingConfig;
      document.getElementById('submissionAgingTotal').textContent = summary.total.toLocaleString('en-IN');
      document.getElementById('submissionMixTotal').textContent = asCount(summary.total);
      document.getElementById('submissionAgingPending').textContent = (summary.mix['Not submitted'] || 0).toLocaleString('en-IN');
      const largest = summary.ranges.reduce((best, range) => range.count > (best?.count || 0) ? range : best, null);
      document.getElementById('submissionAgingLargest').textContent = largest?.count ? largest.label : '—';
      renderAgingChart(summary.ranges);
      document.getElementById('submissionAgingUnavailable').textContent = summary.unavailableAging
        ? `${asCount(summary.unavailableAging)} without a usable invoice or submission date`
        : 'Aging uses invoice date and stops on the submission date.';
      document.getElementById('submissionMixSubmitted').textContent = (summary.total - (summary.mix['Not submitted'] || 0)).toLocaleString('en-IN');
      document.getElementById('submissionMixPending').textContent = (summary.mix['Not submitted'] || 0).toLocaleString('en-IN');
      document.getElementById('submissionMixPhysical').textContent = (summary.mix.Physical || 0).toLocaleString('en-IN');
      mixRows.replaceChildren();
      const categories = [...insights.MIX_LABELS];
      if (summary.mix['Unclassified submitted']) categories.push('Unclassified submitted');
      categories.forEach(label => {
        const count = summary.mix[label] || 0;
        const row = document.createElement('div');
        row.className = 'submissionMixRow';
        row.dataset.mix = label;
        const top = document.createElement('div');
        top.className = 'submissionMixRowTop';
        const name = document.createElement('span');
        name.textContent = label;
        const value = document.createElement('strong');
        value.textContent = asCount(count);
        top.append(name, value);
        const track = document.createElement('div');
        track.className = 'submissionMixTrack';
        const fill = document.createElement('span');
        fill.style.width = `${summary.total ? Math.round(count / summary.total * 100) : 0}%`;
        track.append(fill);
        row.append(top, track);
        mixRows.append(row);
      });
    } catch (error) {
      recordsUnavailable = true;
      acknowledgedRows = [];
      scope.textContent = 'Submission records could not be loaded.';
      document.getElementById('submissionAcknowledgedCount').textContent = '—';
      document.getElementById('submissionAcknowledgedPending').textContent = 'Submission records unavailable';
      currentInvoices = [];
      if (agingChart) { agingChart.destroy(); agingChart = null; }
      mixRows.textContent = '';
    }
    renderAcknowledgedTable();
  }
  render();
  document.querySelector('.submissionAgingCard')?.addEventListener('click', openDetail);
  document.querySelector('.submissionAgingCard')?.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openDetail(); }
  });
  detailSearch?.addEventListener('input', renderDetailTable);
  acknowledgedCard?.addEventListener('click', openAcknowledged);
  acknowledgedCard?.addEventListener('keydown', event => {
    if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); openAcknowledged(); }
  });
  acknowledgedSearch?.addEventListener('input', renderAcknowledgedTable);
  for (const mode of ['all', 'Automated', 'Manual']) {
    document.getElementById(`submissionAcknowledgedMode-${mode}`)?.addEventListener('click', () => {
      acknowledgedMode = mode;
      acknowledgedModeValue.textContent = mode === 'all' ? 'All' : mode;
      acknowledgedModeFilter.open = false;
      renderAcknowledgedTable();
    });
  }
  acknowledgedModal?.addEventListener('hidden.bs.modal', () => acknowledgedCard?.focus());
  detailModal?.addEventListener('hidden.bs.modal', () => {
    if (detailChart) { detailChart.destroy(); detailChart = null; }
  });
  window.addEventListener('storage', render);
  document.getElementById('asOfRefreshTag')?.addEventListener('click', render);
})();
