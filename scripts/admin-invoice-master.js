/* Consolidated, search-first invoice workspace. Demo changes are saved locally. */
(() => {
  "use strict";
  const route = new URLSearchParams(location.search).get("module");
  if (!["invoice-master", "invoice-upload", "invoice-reallocation", "invoice-deletion"].includes(route)) return;
  const mount = document.getElementById("adminPageContent"), core = window.IneburaInvoiceCore;
  if (!mount || !core) return;
  document.title = "Invoice Master — Inebura";
  const STORE = "ineburaAdminInvoiceMaster:v1", COMPANY = "TestClient Pvt Ltd";
  const TRAIL = "ineburaActivityTrailByInvoice", OVERRIDES = "ineburaInvoiceStatusOverrides";
  const escape = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
  const read = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch (_) { return fallback; } };
  let records = read(STORE, null);
  if (!Array.isArray(records) || !records.every((r) => r?.company && r.fields?.["Invoice No"])) records = core.clone(window.IneburaInvoiceSeeds || []);
  const HISTORY = "ineburaAdminInvoiceUploads:v1";
  let selected = "", plan = [], excelPromise, editBaseline, uploadBatch = null;
  let view = "details", queueSearch = "", uploadPage = 1, queuePage = 1, showApi = false;
  let uploadSort = { key: "at", direction: -1 }, queueSort = { key: "", direction: 1 }, liveBaseline = null, bulkFile = null;
  const history = () => { const rows = read(HISTORY, []); return Array.isArray(rows) ? rows.filter((r) => r.company === COMPANY) : []; };
  const saveBatch = (batch) => {
    const saved = read(HISTORY, []), rows = Array.isArray(saved) ? saved : [];
    localStorage.setItem(HISTORY, JSON.stringify([batch, ...rows.filter((r) => r.id !== batch.id)]));
  };
  const unallocated = () => records.filter((r) => r.company === COMPANY && core.missingAssignments(r).length);
  const queueRows = () => unallocated().filter((r) =>
    [r.fields["Invoice No"], r.fields["Customer Code"], r.fields["Customer Name"], r.clientCode || COMPANY].some((v) => String(v || "").toLowerCase().includes(queueSearch.toLowerCase())));
  const persist = (next) => { localStorage.setItem(STORE, JSON.stringify(next)); records = next; };
  const current = () => records.find((r) => r.company === COMPANY && r.fields["Invoice No"] === selected);
  const money = (v, currency = "INR") => {
    if (v == null || v === "") return "—";
    if (!Number.isFinite(Number(v))) return String(v);
    return `${currency === "INR" ? "Rs." : currency} ${new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(Number(v))}`;
  };
  const date = (v) => {
    if (!v) return "—";
    try { return new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", timeZone: "Asia/Kolkata" }).format(new Date(`${core.convert("Invoice Date", v)}T00:00:00Z`)); } catch (_) { return String(v); }
  };
  const dateTime = (v) => {
    const parsed = new Date(v);
    return Number.isNaN(parsed.getTime()) ? "" : new Intl.DateTimeFormat("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Kolkata" }).format(parsed);
  };
  const notify = (text) => {
    const toast = document.getElementById("adminToast");
    toast.textContent = text; toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 3000);
  };
  const statusKeys = { "Invoice Status": "invoiceStatus", "Broad Status": "broadStatus", "Primary Status": "primaryStatus", "Substatus": "subStatus" };
  const summaryLeft = ["Invoice Status", "Broad Status", "Primary Status", "Substatus", "Client Status", "Invoice No", "Invoice Date", "Invoice Due Date", "Credit Period", "Tax Value", "Base Value", "Total Outstanding", "Currency", "Convertor", "Doc Curr Amount", "Invoice Handover Date", "Billing Start Date", "Billing End Date", "Customer Due Date", "Client Due Date", "Customer Credit Period"];
  const summaryRight = core.headers.filter((h) => h !== "Invoice Value" && !summaryLeft.includes(h));
  const trailEntries = (r) => {
    const shared = read(TRAIL, {}), key = r.timelineInvoiceNo || r.fields["Invoice No"];
    const stored = Array.isArray(shared[key]) ? shared[key] : null;
    return [...(stored || r.seedTrail || []), ...(r.audit || [])].sort((a, b) => (Date.parse(b.at || b.when) || 0) - (Date.parse(a.at || a.when) || 0));
  };
  const live = (r) => {
    const next = core.clone(r), key = r.timelineInvoiceNo || r.fields["Invoice No"];
    const snapshot = read("ineburaInvoiceData", []);
    const source = Array.isArray(snapshot) ? snapshot.find((i) => i.invoiceNo === key) : null;
    if (source) {
      next.netDue = source.netDueAmount;
      next.amountForMonth = source.amountForMonth;
      next.primaryStatus = source.primaryStatus || next.primaryStatus;
      next.subStatus = source.subStatus || source.status || next.subStatus;
    }
    const overrides = read(OVERRIDES, {});
    const latest = trailEntries(r).find((p) => p.type === "status")?.data;
    [latest, overrides[key]].filter(Boolean).forEach((s) => {
      ["broadStatus", "primaryStatus", "subStatus"].forEach((k) => { if (s[k]) next[k] = s[k]; });
    });
    return next;
  };
  const kv = (label, value, locked = false, valueClass = "") => `<div class="kv"><span>${escape(label)}${locked ? ' <i aria-hidden="true" class="bi bi-lock-fill" title="View only" aria-label="View only"></i>' : ""}</span><strong class="${valueClass}">${escape(value === "" || value == null ? "—" : value)}</strong></div>`;
  const fieldValue = (r, h) => {
    if (statusKeys[h]) return r[statusKeys[h]];
    const v = r.fields[h];
    return core.dates.has(h) ? date(v) : core.numbers.has(h) && h !== "Convertor" ? money(v, r.fields.Currency) : v;
  };
  const renderEvent = (p, i) => {
    const data = p.data || {}, event = p.event || {};
    let title, badge, subtitle, lines, color;
    if (p.type === "status") {
      title = "Invoice update"; badge = "Status"; subtitle = data.subStatus || data.status; color = "#2563eb";
      lines = [["Invoices", data.invoices?.join(", ")], ["Activity type", data.activityType], ["Broad Status", data.broadStatus], ["Primary Status", data.primaryStatus], ["Substatus", data.subStatus], ["Changed by", data.updatedBy || data.performedBy], ["PTP date", data.ptpDate], ["Instrument mode", data.instrumentMode], ["Instrument ref no", data.instrumentRef], ["Bank", data.bank], ["Transfer date", data.transferDate], ["Amount", data.amount == null ? null : money(data.amount)], ["TDS", data.tds], ["LD", data.ld]];
      if (Array.isArray(data.miscRows)) data.miscRows.forEach((item, index) => lines.push([`Collection ${index + 1}`, Object.entries(item).map(([k, v]) => `${k}: ${v}`).join(" · ")]));
      if (Array.isArray(data.pdcRows)) {
        lines.push(["PDC count", data.pdcRows.length], ["PDC Ops user", data.pdcOpsUser]);
        data.pdcRows.forEach((item, index) => lines.push([`PDC ${index + 1}`, [item.chequeNo, item.pdcDate, item.bank, item.amount, item.imageName].filter((v) => v != null && v !== "").join(" · ")]));
      }
      if (data.dispatchDetails) lines.push(["Dispatch details", Object.values(data.dispatchDetails).filter(Boolean).join(" · ")]);
      lines.push(["Remarks", data.remarks]);
    } else if (p.type === "email") {
      title = "Email sent"; badge = "Email"; subtitle = data.subject; color = "#f97316";
      lines = [["From", data.from], ["To", data.to], ["CC", data.cc], ["Subject", data.subject], ["Message", data.body ? String(data.body).replace(/<[^>]*>/g, " ") : ""]];
    } else if (p.type === "issue") {
      title = "Issue tracker update"; badge = "Issue"; subtitle = event.meta; color = "#7c3aed";
      lines = (event.lines || []).map((l) => [l.label, l.value]);
    } else if (p.type === "admin") {
      title = p.title; badge = "Admin"; subtitle = p.reason || ""; color = "#55227d";
      lines = [["Changed by", "admin TestClient"], ...(p.changes || []).map((c) => [c.field, `${c.before || "—"} → ${c.after || "—"}`])];
    } else return "";
    return `<details class="imEvent" style="--event-color:${color}" ${i === 0 ? "open" : ""}><summary><div><strong>${escape(title)}</strong><small>${escape(subtitle || "")}</small><small>${escape(dateTime(p.at || p.when || data.performedAt))}</small></div><span class="imEventBadge">${badge}</span></summary><div class="imEventBody">${lines.filter(([, v]) => v !== "" && v != null).map(([k, v]) => kv(k, v)).join("") || '<p>No additional details.</p>'}</div></details>`;
  };
  const empty = (title, message, error = false) => `<section class="imEmpty" ${error ? 'role="status"' : ""}><i aria-hidden="true" class="bi bi-search" aria-hidden="true"></i><h2>${escape(title)}</h2><p>${escape(message)}</p></section>`;
  const renderResult = () => {
    if (view === "uploads") { renderUploads(); return; }
    if (view === "unallocated") { renderQueue(); return; }
    const area = document.getElementById("imResult"), record = current();
    if (!selected) { area.innerHTML = empty("Search an invoice", "Enter an invoice number to view its details and timeline."); return; }
    if (!record) { area.innerHTML = empty("Invoice not found", `No invoice ${selected} was found in ${COMPANY}. Check the number or upload new invoice data.`, true); return; }
    const r = live(record), f = r.fields;
    window.IneburaDunningSelectedInvoice = {
      customer: { id: f["Customer Code"], customerCode: f["Customer Code"], name: f["Customer Name"] },
      invoice: { invoiceNo: f["Invoice No"], dueDate: f["Invoice Due Date"],
        invoiceValue: f["Invoice Value"], netDueAmount: r.netDue ?? f["Total Outstanding"] }
    };
    window.dispatchEvent(new CustomEvent("inebura:invoice-selected", { detail: window.IneburaDunningSelectedInvoice }));
    const month = r.month || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" }).slice(0, 7);
    const monthLabel = /^\d{4}-\d{2}$/.test(month) ? new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`)) : "Current month";
    const timeline = trailEntries(record).map(renderEvent).join("");
    area.innerHTML = `<div class="imWorkspace"><section class="imPanel" aria-label="Invoice details"><div class="imDetailsScroll"><header class="imInvoiceHeader"><h2>${escape(f["Invoice No"])}${r.invoiceStatus ? `<span class="imStatus ${r.invoiceStatus === "Overdue" ? "imOverdue" : ""}">${escape(r.invoiceStatus)}</span>` : ""}</h2><p>${escape(f["Customer Name"])} · ${escape(f["Customer Code"])}</p></header><div class="imCards"><section class="infoCard"><h3 class="infoCardTitle">Assignees</h3>${[["Agent", r.agent], ["Manager", r.manager], ["KAM", r.kam], ["KAS", r.kas]].map(([k, v]) => kv(k, v)).join("")}</section><section class="infoCard imMoney"><div class="imCardHeading"><h3 class="infoCardTitle">Invoice amounts</h3><small>${escape(monthLabel)}</small></div>${kv("Invoice value", money(f["Invoice Value"], f.Currency))}${kv("Amount for the month", money(r.amountForMonth, f.Currency))}${kv("Net Due", money(r.netDue, f.Currency))}${kv("Collection in month", money(r.collectionInMonth, f.Currency), false, "imCollected")}</section><section class="infoCard imSummary"><h3 class="infoCardTitle">Invoice summary <span class="imSummaryNote"><i aria-hidden="true" class="bi bi-lock-fill"></i> Collection statuses · view only</span></h3><div class="imSummaryGrid">${[summaryLeft, summaryRight].map((col) => `<div>${col.map((h) => kv(h, fieldValue(r, h), ["Broad Status", "Primary Status", "Substatus"].includes(h), h === "Invoice Status" && r.invoiceStatus === "Overdue" ? "imOverdue" : "")).join("")}</div>`).join("")}</div></section></div></div><footer class="imActions"><button class="adminPrimary" data-im-action="edit"><i aria-hidden="true" class="bi bi-pencil"></i>Edit invoice</button><button class="adminSecondary" data-im-action="reallocate"><i aria-hidden="true" class="bi bi-diagram-3"></i>Reallocate</button><button class="adminSecondary" data-im-action="export"><i aria-hidden="true" class="bi bi-file-earmark-arrow-down"></i>Export</button><button class="adminSecondary imDelete" data-im-action="delete"><i aria-hidden="true" class="bi bi-trash"></i>Delete</button></footer></section><aside class="imPanel" aria-label="Invoice timeline"><header class="imTimelineHeading"><h2>Invoice timeline</h2><p>Activity Trail · Newest first</p></header><div class="imTimelineScroll">${timeline ? `<div class="imTrail">${timeline}</div>` : '<p role="status">No activity recorded for this invoice.</p>'}</div></aside></div>`;
  };
  document.documentElement.classList.add("imDocument");
  mount.innerHTML = `<main class="imPage imOperationalPage" data-admin-module="invoice-master"><header class="imHero"><div><h1>Invoice Master</h1><p>Upload, reallocate, and manage invoices.</p></div></header><div class="imOperations"><div class="imTabsHeader"><nav class="imViews" aria-label="Invoice Master views"><button class="imView is-active" data-im-view="details" aria-current="page">Invoice Details</button><button class="imView" data-im-view="uploads">Invoice Upload</button><button class="imView" data-im-view="unallocated">Invoice Reallocation</button></nav><div class="imTabActions"><div class="imUploadToolbar is-inactive" id="imUploadToolbar" inert><label class="imApiToggle"><input type="checkbox" id="imShowApi" role="switch">Show API uploads</label><i class="bi bi-info-circle" title="Invoices sent through the integration API are one upload each. They are listed, searchable and retryable in Integrations → API Integration Tokens → Invoice API Trail."></i><button class="adminSecondary" data-im-action="create"><i class="bi bi-plus-circle" aria-hidden="true"></i>Create New</button><button class="adminPrimary imBulkButton" data-im-action="bulk"><i class="bi bi-cloud-arrow-up-fill" aria-hidden="true"></i>Bulk Upload</button></div></div></div><section id="imDetailsView"><form class="imSearch" id="imSearchForm"><label for="imInvoiceNumber">Invoice number</label><input id="imInvoiceNumber" name="invoiceNo" autocomplete="off" placeholder="Enter invoice number" aria-describedby="imSearchHint" required /><button class="adminPrimary" type="submit">Search</button><button class="imTextButton" type="button" data-im-action="clear">Clear</button><button class="adminPrimary imBulkUpdate" type="button" data-im-action="bulkUpdate"><i class="bi bi-cloud-arrow-up" aria-hidden="true"></i>Bulk Update</button></form><p class="imSearchHint" id="imSearchHint">Sample invoice: <button class="imTextButton" type="button" data-im-action="sample">INV-2026-1042</button></p><div id="imResult" aria-live="polite"></div></section><section id="imUploadsView" hidden></section><section id="imQueueView" hidden></section></div></main>`;
  const setView = (next) => {
    view = next;
    // Retain the shared shell and toolbar footprint when changing panels.
    [["imUploadToolbar", "uploads"]].forEach(([id, tab]) => {
      const toolbar = document.getElementById(id);
      toolbar.classList.toggle("is-inactive", view !== tab);
      toolbar.inert = view !== tab;
    });
    mount.querySelectorAll("[data-im-view]").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.imView === view);
      if (button.dataset.imView === view) button.setAttribute("aria-current", "page"); else button.removeAttribute("aria-current");
    });
    ["details", "uploads", "unallocated"].forEach((name, i) => { document.getElementById(["imDetailsView", "imUploadsView", "imQueueView"][i]).hidden = name !== view; });
    renderResult();
  };
  const batchStatus = (batch) => batch.applied ? (batch.rejected ? "Completed with Validation Failures" : "Completed") : "Reviewed · not applied";
  const sorted = (rows, sort, value) => [...rows].sort((a, b) => {
    const x = value(a, sort.key), y = value(b, sort.key);
    return sort.direction * (typeof x === "number" && typeof y === "number" ? x - y : String(x ?? "").localeCompare(String(y ?? ""), undefined, { numeric: true }));
  });
  const sortHeader = (label, key, list) => `<th scope="col"><button data-im-sort="${escape(key)}" data-im-list="${list}" title="Click to sort">${label}<span class="imSortArrows"><i class="bi bi-caret-up-fill"></i><i class="bi bi-caret-down-fill"></i></span></button></th>`;
  const pagination = (count, page, list) => {
    const pages = Math.max(1, Math.ceil(count / 10));
    return `<div class="imPagination"><span>Showing <b>${count ? (page - 1) * 10 + 1 : 0} – ${Math.min(page * 10, count)}</b> of <b>${count}</b></span><nav aria-label="${list === "uploads" ? "Upload" : "Invoice"} pages"><button data-im-page="${page - 1}" data-im-list="${list}" aria-label="Previous page" ${page === 1 ? "disabled" : ""}><i class="bi bi-chevron-left"></i></button>${Array.from({ length: pages }, (_, i) => `<button data-im-page="${i + 1}" data-im-list="${list}" ${page === i + 1 ? 'aria-current="page"' : ""}>${i + 1}</button>`).join("")}<button data-im-page="${page + 1}" data-im-list="${list}" aria-label="Next page" ${page === pages ? "disabled" : ""}><i class="bi bi-chevron-right"></i></button></nav></div>`;
  };
  const renderUploads = () => {
    const rows = sorted(history().filter((b) => showApi || b.source !== "api"), uploadSort, (r, k) => k === "ready" ? (r.applied ? r.ready : 0) : r[k]);
    uploadPage = Math.min(uploadPage, Math.max(1, Math.ceil(rows.length / 10)));
    document.getElementById("imUploadsView").innerHTML = `<div class="imListPanel"><div class="imTableScroll"><table class="imDataTable imUploadTable"><caption class="imSrOnly">Invoice upload history</caption><thead><tr><th>File Name</th><th>Status</th>${sortHeader("Upload Date", "at", "uploads")}${sortHeader("Total", "total", "uploads")}${sortHeader("Success", "ready", "uploads")}${sortHeader("Rejected", "rejected", "uploads")}<th>Progress</th><th>Actions</th></tr></thead><tbody>${rows.slice((uploadPage - 1) * 10, uploadPage * 10).map((batch) => `<tr><td>${escape(batch.name)}</td><td><span class="imPill ${batch.applied ? "imSuccess" : "imPending"}">${batchStatus(batch)}</span></td><td>${escape(new Date(batch.at).toLocaleDateString("en-GB", {timeZone:"Asia/Kolkata"}).replaceAll("/", "-"))}</td><td>${batch.total}</td><td class="imPositive">${batch.applied ? batch.ready : "—"}</td><td class="imNegative">${batch.rejected}</td><td>${batch.applied ? '<progress value="100" max="100" aria-label="Processing complete"></progress><small>100% — Complete</small>' : '<small>Awaiting application</small>'}</td><td><div class="imDownloadActions"><button class="imIconDownload" data-im-download="${escape(batch.id)}" title="${batch.original ? "Download Original" : "Download Result"}" aria-label="${batch.original ? "Download Original" : "Download Result"} ${escape(batch.name)}"><i class="bi bi-cloud-arrow-down"></i></button>${batch.rejected ? `<button class="imIconDownload imNegative" data-im-history-errors="${escape(batch.id)}" title="Download Failed" aria-label="Download Failed ${escape(batch.name)}"><i class="bi bi-cloud-arrow-down"></i></button>` : ""}</div></td></tr>`).join("") || '<tr><td colspan="8" class="imTableEmpty">No uploads found.</td></tr>'}</tbody></table></div>${pagination(rows.length, uploadPage, "uploads")}</div>`;
  };
  const renderQueueRows = () => {
    const rows = sorted(queueRows(), queueSort, (r, k) => k === "Client Code" ? r.clientCode || "—" : r.fields[k]);
    queuePage = Math.min(queuePage, Math.max(1, Math.ceil(rows.length / 10)));
    document.getElementById("imQueueRows").innerHTML = rows.slice((queuePage - 1) * 10, queuePage * 10).map((r) => {
      const f = r.fields, no = escape(f["Invoice No"]);
      return `<tr><td>${escape(r.clientCode || "—")}</td><td>${escape(f["Customer Code"] || "-")}</td><td>${escape(f["Customer Name"] || "-")}</td><td>${no}</td><td>${escape(money(f["Invoice Value"], f.Currency).replace("Rs. ", "₹"))}</td><td>${escape(money(f["Total Outstanding"], f.Currency).replace("Rs. ", "₹"))}</td>${["agent", "manager", "kam", "kas"].map((role) => `<td>${escape(r[role] || "-")}</td>`).join("")}<td><button class="imReallocateButton" data-im-allocate="${no}"><i class="bi bi-pencil-square" aria-hidden="true"></i>Reallocate</button></td></tr>`;
    }).join("") || '<tr><td colspan="11" class="imTableEmpty">No invoices found.</td></tr>';
    document.getElementById("imQueuePagination").innerHTML = pagination(rows.length, queuePage, "unallocated");
  };
  const renderQueue = () => {
    document.getElementById("imQueueView").innerHTML = `<div class="imListPanel"><label class="imLiveSearch"><i class="bi bi-search" aria-hidden="true"></i><input id="imQueueSearch" type="search" aria-label="Search invoices" placeholder="Search by invoice no, customer or client name..." value="${escape(queueSearch)}"></label><div class="imTableScroll"><table class="imDataTable imQueueTable"><caption class="imSrOnly">Invoices missing an Agent or Manager</caption><thead><tr>${["Client Code", "Customer Code", "Customer Name", "Invoice No", "Invoice Value", "Outstanding"].map((h) => sortHeader(h, h === "Outstanding" ? "Total Outstanding" : h, "unallocated")).join("")}<th>Assignee</th><th>Manager</th><th>KAM</th><th>KAS</th><th>Action</th></tr></thead><tbody id="imQueueRows"></tbody></table></div><div id="imQueuePagination"></div></div>`;
    renderQueueRows();
  };

  const dialog = document.createElement("dialog");
  dialog.className = "imDialog";
  document.body.appendChild(dialog);
  const close = () => { dialog.close(); dialog.innerHTML = ""; plan = []; uploadBatch = null; };
  const open = (title, body, footer = "") => {
    if (dialog.open) dialog.close();
    dialog.className = "imDialog";
    dialog.innerHTML = `<header class="imDialogHeader"><h2 id="imDialogTitle">${escape(title)}</h2><button class="imTextButton" data-im-action="close" aria-label="Close dialog"><i aria-hidden="true" class="bi bi-x-lg"></i></button></header><div class="imDialogBody">${body}<p class="imError" id="imDialogError" role="alert"></p></div><footer class="imDialogFooter"><button class="adminSecondary" data-im-action="close">Cancel</button>${footer}</footer>`;
    dialog.setAttribute("aria-labelledby", "imDialogTitle");
    dialog.showModal();
  };
  const showError = (error) => { document.getElementById("imDialogError").textContent = error.message || String(error); };
  const edit = () => {
    const r = current(); if (!r) return;
    editBaseline = core.clone(r);
    open(`Edit ${selected}`, `<p class="imNotice">Broad, primary and substatus are view only. Monthly amounts and current invoice status are displayed from invoice data.</p><form id="imEditForm" class="imForm">${core.headers.map((h, i) => `<label>${escape(h)}${core.required.has(h) ? " *" : ""}<input name="field-${i}" aria-label="${escape(h)}" type="${core.dates.has(h) ? "date" : core.numbers.has(h) ? "number" : "text"}" ${core.numbers.has(h) ? 'min="0" step="any"' : ""} ${core.required.has(h) ? "required" : ""} value="${escape(r.fields[h])}" /></label>`).join("")}</form>`, '<button class="adminPrimary" type="submit" form="imEditForm">Save changes</button>');
  };
  const audit = (r, title, changes = [], reason = "") => { r.audit = [...(r.audit || []), { type: "admin", at: new Date().toISOString(), title, changes, reason }]; };
  const csv = (rows) => "\uFEFF" + rows.map((row) => row.map((v) => {
    let s = String(v ?? "");
    if (/^[=+\-@]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
  }).join(",")).join("\r\n");
  const download = (name, rows) => {
    const url = URL.createObjectURL(new Blob([csv(rows)], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = name; a.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  const upload = () => {
    plan = []; uploadBatch = null;
    open("Upload invoice data", `<p class="imNotice">Match by Invoice No within ${escape(COMPANY)}. Broad, primary and substatus are view only. Blank update cells keep existing values.</p><div class="imUploadControls"><label>Company<select id="imUploadCompany"><option>${escape(COMPANY)}</option></select></label><label>Upload mode<select id="imUploadMode"><option value="add">Add new invoices</option><option value="update">Update existing invoices</option></select></label></div><label class="imDropzone">Choose your CSV or Excel file (up to 10 MB)<input type="file" id="imUploadFile" accept=".csv,.xlsx,.xls" /></label><button class="imTextButton" data-im-action="template"><i aria-hidden="true" class="bi bi-download"></i> Download CSV template</button><div id="imUploadPreview"></div>`, '<button class="adminSecondary" data-im-action="preview">Review file</button><button class="adminPrimary" data-im-action="apply" id="imApply" disabled>Apply updates</button>');
  };
  const loadExcel = () => {
    if (window.XLSX) return Promise.resolve(window.XLSX);
    if (!excelPromise) excelPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = new URL("../scripts/vendor/xlsx.full.min.js", location.href).href;
      script.onload = () => resolve(window.XLSX);
      script.onerror = () => { script.remove(); excelPromise = null; reject(new Error("Could not load the Excel reader. Retry or upload CSV.")); };
      document.head.appendChild(script);
    });
    return excelPromise;
  };
  const preview = async () => {
    const file = document.getElementById("imUploadFile")?.files[0];
    if (!file) throw new Error("Choose a CSV or Excel file first");
    if (file.size > 10 * 1024 * 1024) throw new Error("File exceeds 10 MB");
    const mode = document.getElementById("imUploadMode").value;
    const applyButton = document.getElementById("imApply"), previewArea = document.getElementById("imUploadPreview");
    applyButton.disabled = true; plan = [];
    previewArea.textContent = "Reading invoice data…";
    let matrix;
    if (/\.csv$/i.test(file.name)) matrix = core.parseCSV(await file.text());
    else if (/\.(xlsx|xls)$/i.test(file.name)) {
      const xlsx = await loadExcel();
      const workbook = xlsx.read(await file.arrayBuffer(), { type: "array", cellDates: true });
      matrix = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]], { header: 1, defval: "", raw: true });
    } else throw new Error("Choose a .csv, .xlsx or .xls file");
    if (!dialog.open || !previewArea.isConnected || file !== document.getElementById("imUploadFile")?.files[0] || mode !== document.getElementById("imUploadMode")?.value) return;
    records = read(STORE, records);
    plan = core.preview(matrix, records, COMPANY, mode);
    const ready = plan.filter((p) => !p.errors.length && p.kind !== "unchanged").length;
    const rejected = plan.filter((p) => p.errors.length).length;
    const unchanged = plan.filter((p) => p.kind === "unchanged").length;
    previewArea.innerHTML = `<p class="imPreviewSummary">${plan.length} invoices · ${ready} ready · ${unchanged} unchanged · ${rejected} errors</p><div class="imPreviewWrap"><table class="imPreviewTable"><thead><tr><th>Row</th><th>Invoice No</th><th>Changes (current → uploaded)</th><th>Result</th></tr></thead><tbody>${plan.map((p) => `<tr class="${p.errors.length ? "imRejected" : ""}"><td>${p.row}</td><td>${escape(p.invoiceNo)}</td><td><ul>${p.changes.map((c) => `<li><b>${escape(c.field)}</b>: ${escape(c.before === "" ? "—" : c.before)} → ${escape(c.after)}</li>`).join("") || "<li>No changes</li>"}</ul></td><td>${escape(p.errors.join("; ") || (p.kind === "add" ? "Ready to add" : p.kind === "update" ? "Ready to update" : "Unchanged"))}</td></tr>`).join("")}</tbody></table></div>${rejected ? '<button class="imTextButton" data-im-action="errors">Download error report</button><p class="imError">Rows with errors will be excluded. Apply only the reviewed valid invoices, or correct the file and review again.</p>' : ""}`;
    uploadBatch = { id: crypto.randomUUID(), company: COMPANY, name: file.name, mode, at: new Date().toISOString(), total: plan.length, ready, rejected, unchanged, applied: false, rows: plan.map(({ row, invoiceNo, changes, errors, kind }) => ({ row, invoiceNo, changes, errors, kind })) };
    saveBatch(uploadBatch);
    if (view === "uploads") renderUploads();
    applyButton.textContent = `Apply ${ready} valid ${mode === "add" ? "invoices" : "updates"}`;
    applyButton.disabled = !ready;
  };
  // The operational forms mirror the inspected live screens; saved data stays in this prototype.
  const roleLabels = { agent: "Assignee", manager: "Manager", kam: "KAM", kas: "KAS" };
  const liveLabels = { "Customer Name": "Customer", "Sales Order Number": "Sale Order Number", "Bill to Address": "Bill To Address" };
  const liveSearchFields = new Set(["Customer Name", "Customer Code", "Pincode", "City", "State", "Region", "Business Unit", "Industry Type", "Product Category", ...Object.keys(roleLabels)]);
  const createOrder = ["Customer Name", "Customer Code", "Pincode", "City", "State", "Region", "Business Unit", "agent", "manager", "kam", "kas", "Invoice No", "Invoice Date", "Credit Period", "Invoice Due Date", "Invoice Value", "Total Outstanding", "Tax Value", "Base Value", "PO Number", "Sales Order Number", "Industry Type", "Key Account", "Product Category", "Description", "Invoice Handover Date", "Bill to Address", "Ship To Address", "Profit Center", "Billing Start Date", "Billing End Date", "Equipment Number", "Equipment Name", "Job Type", "Sub Job Type"];
  const reallocationOrder = ["Customer Name", "Customer Code", "Pincode", "City", "State", "Region", "agent", "manager", "kam", "kas", "Invoice No", "Invoice Date", "Credit Period", "Invoice Due Date", "Invoice Value", "Total Outstanding", "Tax Value", "Base Value", "PO Number", "Sales Order Number", "Industry Type", "Key Account", "Product Category", "Description", "Invoice Handover Date", "Bill to Address", "Ship To Address", "Profit Center", "Business Unit", "Billing Start Date", "Billing End Date", "Equipment Number", "Equipment Name", "Job Type", "Sub Job Type"];
  const liveRequired = new Set(["Customer Name", "City", "Invoice No", "Invoice Date", "Credit Period", "Invoice Due Date", "Invoice Value", "Total Outstanding", "Product Category"]);
  const formValue = (r, key) => roleLabels[key] ? r?.[key] || "" : r?.fields?.[key] ?? r?.[key] ?? "";
  const displayDate = (v) => v && /^\d{4}-\d{2}-\d{2}$/.test(v) ? v.split("-").reverse().join("-") : v || "";
  const liveForm = (invoiceNo) => {
    records = read(STORE, records);
    liveBaseline = invoiceNo ? core.clone(records.find((r) => r.company === COMPANY && r.fields["Invoice No"] === invoiceNo)) : null;
    const editing = !!liveBaseline, order = editing ? reallocationOrder : createOrder;
    const body = order.map((key) => {
      const label = roleLabels[key] || liveLabels[key] || key;
      const required = editing ? (["agent", "manager", "Customer Name", "City", "Invoice No", "Invoice Date", "Invoice Value", "Total Outstanding", "Product Category"].includes(key)) : liveRequired.has(key);
      const disabled = editing ? !roleLabels[key] : !!roleLabels[key] || key === "Key Account";
      const searchable = liveSearchFields.has(key) && !(editing && key === "Business Unit");
      const placeholder = key === "Customer Name" ? "Search by customer name" : key === "Customer Code" ? "Search by customer code" : key === "Business Unit" && !editing ? "Search or type Business Unit" : roleLabels[key] && !editing ? label : key === "Key Account" ? "Select a customer first" : core.dates.has(key) ? "dd-mm-yyyy" : searchable ? `Select ${key === "Industry Type" ? "Industry" : label}` : `Enter ${label}`;
      let value = formValue(liveBaseline, key); if (core.dates.has(key)) value = displayDate(value);
      const numeric = core.numbers.has(key) || key === "Credit Period";
      if (key === "Credit Period") value = String(value).replace(/\s*days?$/i, "");
      return `<div class="imLiveField"><label for="imLive-${escape(key)}">${escape(label)}${required ? ' <em>*</em>' : ""}</label><div class="imLiveInput ${searchable ? "imHasSearch" : ""}">${searchable ? '<i class="bi bi-search" aria-hidden="true"></i>' : ""}<input id="imLive-${escape(key)}" name="${escape(key)}" aria-label="${escape(label)}" placeholder="${escape(placeholder)}" type="${numeric ? "number" : "text"}" ${numeric ? 'min="0" step="any"' : ""} ${disabled ? "disabled" : ""} ${required && !disabled ? "required" : ""} ${key === "Description" ? 'maxlength="3000"' : ""} ${core.dates.has(key) ? 'maxlength="10" inputmode="numeric"' : ""} ${searchable && !disabled ? `data-im-picker="${escape(key)}" autocomplete="off" role="combobox" aria-autocomplete="list" aria-expanded="false"` : ""} value="${escape(value)}">${searchable && !disabled ? `<button type="button" class="imPickerClear" data-im-clear="${escape(key)}" aria-label="Clear ${escape(label)}" ${value ? "" : "hidden"}><i class="bi bi-x-lg"></i></button>` : ""}${core.dates.has(key) ? `<button class="imCalendarButton" type="button" data-im-calendar="${escape(key)}" aria-label="Choose ${escape(label)}" ${disabled ? "disabled" : ""}><i class="bi bi-calendar3"></i></button>` : ""}</div>${key === "Business Unit" && !editing ? '<small>Pick a <b>Business Unit</b> to fill Agent, Manager, KAM and KAS from its mapping, or type a new one.</small>' : ""}${key === "Description" ? `<small class="imCharCount">${String(value).length} / 3000</small>` : ""}</div>`;
    }).join("");
    open(editing ? "Edit Invoice" : "Create Invoice", `<form id="imLiveForm" class="imLiveForm">${body}</form>`, `<button class="adminPrimary" type="submit" form="imLiveForm">${editing ? "Update" : "Save Invoice"}</button>`);
    dialog.classList.add("imLiveDialog");
  };
  const pickerValues = (key) => [...new Set(records.filter((r) => r.company === COMPANY).map((r) => String(formValue(r, key))).filter(Boolean))].sort();
  const clearPicker = () => { dialog.querySelectorAll(".imPicker,.imCalendar").forEach((p) => p.remove()); dialog.querySelectorAll('[aria-expanded="true"]').forEach((p) => p.setAttribute("aria-expanded", "false")); };
  const pickValue = (key, value) => {
    const input = document.getElementById(`imLive-${key}`); input.value = value; input.parentElement.querySelector(".imPickerClear").hidden = !value; clearPicker(); input.focus();
    const form = document.getElementById("imLiveForm");
    if (!liveBaseline && ["Customer Name", "Customer Code", "Business Unit"].includes(key)) {
      const match = records.find((r) => r.company === COMPANY && formValue(r, key) === value);
      if (match) {
        const keys = key === "Business Unit" ? Object.keys(roleLabels) : ["Customer Name", "Customer Code", "Pincode", "City", "State", "Region", "Key Account"];
        keys.forEach((k) => { form.elements.namedItem(k).value = formValue(match, k); });
      }
    }
  };
  const showPicker = (input) => {
    clearPicker(); const key = input.dataset.imPicker, query = input.value.trim().toLowerCase();
    input.parentElement.querySelector(".imPickerClear").hidden = !input.value;
    if (!query) return;
    const options = pickerValues(key).filter((v) => v.toLowerCase().includes(query));
    const list = document.createElement("div"); list.className = "imPicker"; list.setAttribute("role", "listbox");
    list.innerHTML = options.length ? options.map((v) => `<button type="button" role="option" data-im-pick="${escape(key)}" data-im-value="${escape(v)}">${escape(v)}${roleLabels[key] ? `<small>${escape(v.slice(0, 3).toUpperCase())}</small>` : ""}</button>`).join("") : '<div class="imPickerEmpty">No results found</div>';
    input.parentElement.appendChild(list); input.setAttribute("aria-expanded", "true");
  };
  let calendarDate, calendarKey;
  const showCalendar = (key, month) => {
    clearPicker(); calendarKey = key;
    let chosen; try { chosen = core.convert(key, document.getElementById(`imLive-${key}`).value); } catch (_) { chosen = ""; }
    calendarDate = month || (chosen ? new Date(`${chosen}T12:00:00`) : new Date());
    const y = calendarDate.getFullYear(), m = calendarDate.getMonth(), first = new Date(y, m, 1).getDay(), count = new Date(y, m + 1, 0).getDate();
    const calendar = document.createElement("div"); calendar.className = "imCalendar"; calendar.setAttribute("role", "group"); calendar.setAttribute("aria-label", `Choose ${key}`);
    calendar.innerHTML = `<header><button type="button" data-im-month="-1" aria-label="Previous month">‹</button><b>${calendarDate.toLocaleDateString("en-GB", {month:"long",year:"numeric"})}</b><button type="button" data-im-month="1" aria-label="Next month">›</button></header><div class="imCalendarDays">${["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((d) => `<small>${d}</small>`).join("")}${"<span></span>".repeat(first)}${Array.from({length:count}, (_,i) => { const d = `${y}-${String(m+1).padStart(2,"0")}-${String(i+1).padStart(2,"0")}`; return `<button type="button" data-im-day="${d}" ${d === chosen ? 'class="is-selected"' : ""}>${i+1}</button>`; }).join("")}</div><footer><button type="button" data-im-day="">Clear</button><button type="button" data-im-day="today">Today</button></footer>`;
    document.getElementById(`imLive-${key}`).parentElement.appendChild(calendar);
  };
  const calculateDueDate = () => {
    const form = document.getElementById("imLiveForm"); if (!form || liveBaseline) return;
    try {
      const date = core.convert("Invoice Date", form.elements.namedItem("Invoice Date").value), credit = form.elements.namedItem("Credit Period").value;
      if (date && credit !== "" && Number(credit) >= 0) {
        const due = new Date(`${date}T12:00:00Z`); due.setUTCDate(due.getUTCDate() + Number(credit));
        form.elements.namedItem("Invoice Due Date").value = displayDate(due.toISOString().slice(0, 10));
      }
    } catch (_) { /* Wait until a complete date has been entered. */ }
  };
  const saveLiveForm = (form) => {
    const latest = read(STORE, records), next = core.clone(latest);
    if (liveBaseline) {
      const target = next.find((r) => core.identity(r) === core.identity(liveBaseline));
      if (!target || JSON.stringify(target) !== JSON.stringify(liveBaseline)) throw new Error("This invoice changed. Close and reopen it before updating.");
      const changes = [];
      for (const role of Object.keys(roleLabels)) {
        const value = String(form.get(role) || "").trim();
        if (["agent", "manager"].includes(role) && !value) throw new Error(`Select ${roleLabels[role]}`);
        if (value && !pickerValues(role).includes(value)) throw new Error(`Choose ${roleLabels[role]} from the search results`);
        if (value !== (target[role] || "")) { changes.push({field:roleLabels[role],before:target[role] || "",after:value}); target[role] = value; }
      }
      if (changes.length) audit(target, "Invoice reallocated", changes);
    } else {
      const fields = Object.fromEntries(core.headers.map((h) => [h, core.convert(h, form.get(h) || "")])); fields.Currency = "INR";
      const errors = core.validate(fields);
      liveRequired.forEach((key) => { if (!String(form.get(key) || "").trim()) errors.push(`${liveLabels[key] || key} is required`); });
      if (errors.length) throw new Error([...new Set(errors)].join("; "));
      if (next.some((r) => r.company === COMPANY && r.fields["Invoice No"] === fields["Invoice No"])) throw new Error("This Invoice No already exists in the company");
      const record = {company:COMPANY, fields, State: form.get("State") || "", Region: form.get("Region") || ""};
      const mapping = records.find((r) => r.company === COMPANY && fields["Business Unit"] && r.fields["Business Unit"] === fields["Business Unit"]);
      Object.keys(roleLabels).forEach((role) => { record[role] = mapping?.[role] || ""; });
      audit(record, "Invoice created"); next.push(record);
    }
    persist(next); close(); renderResult(); notify(liveBaseline ? "Invoice updated successfully." : "Invoice created successfully.");
  };
  const bulkUpload = (updateOnly = false) => {
    bulkFile = null;
    dialog.dataset.bulkMode = updateOnly ? "update" : "mixed";
    open(updateOnly ? "Bulk Invoice Update" : "Bulk Invoice Upload", `<label class="imExcelLabel" for="imLiveFile">Excel File</label><label class="imLiveDropzone" id="imLiveDropzone" for="imLiveFile"><i class="bi bi-cloud-upload" aria-hidden="true"></i><strong id="imChosenFile">Drag &amp; Drop Data File</strong><small>Select .xlsx or .xls file</small><span>Click to browse files</span><input id="imLiveFile" type="file" accept=".xlsx,.xls" aria-label="Excel File"></label><div class="imTemplateRow"><button class="imTemplateButton" data-im-action="excelTemplate"><i class="bi bi-download" aria-hidden="true"></i>Download Template</button></div>`, '<button class="adminPrimary" id="imBulkSubmit" data-im-action="bulkSubmit" disabled>Upload</button>');
    dialog.classList.add("imLiveDialog", "imBulkDialog");
  };
  const chooseBulk = (file) => {
    if (!file) return;
    if (!/\.(xlsx|xls)$/i.test(file.name)) throw new Error("Select .xlsx or .xls file");
    if (file.size > 10 * 1024 * 1024) throw new Error("File exceeds 10 MB");
    bulkFile = file; document.getElementById("imChosenFile").textContent = file.name; document.getElementById("imBulkSubmit").disabled = false;
  };
  const blobDownload = (name, blob) => { const url = URL.createObjectURL(blob), a = document.createElement("a"); a.href = url; a.download = name; a.click(); setTimeout(() => URL.revokeObjectURL(url), 1000); };
  const excelDownload = async (name, matrix) => {
    const xlsx = await loadExcel(), book = xlsx.utils.book_new(); xlsx.utils.book_append_sheet(book, xlsx.utils.aoa_to_sheet(matrix), "Invoices");
    blobDownload(name, new Blob([xlsx.write(book, {type:"array",bookType:"xlsx"})], {type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"}));
  };
  const excelTemplate = () => excelDownload("invoice_upload_template.xlsx", [core.headers]);
  const fileStorage = (id, file) => new Promise((resolve, reject) => {
    const request = indexedDB.open("ineburaInvoiceUploadFiles", 1);
    request.onupgradeneeded = () => request.result.createObjectStore("files");
    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const db = request.result, transaction = db.transaction("files", file ? "readwrite" : "readonly"), store = transaction.objectStore("files");
      const operation = file ? store.put(file, id) : store.get(id); let result;
      operation.onsuccess = () => { result = operation.result; };
      transaction.oncomplete = () => { db.close(); resolve(result); };
      transaction.onerror = () => { db.close(); reject(transaction.error); };
    };
  });
  const submitBulk = async () => {
    const updateOnly = dialog.dataset.bulkMode === "update";
    const file = bulkFile; if (!file) throw new Error("Select .xlsx or .xls file");
    const xlsx = await loadExcel(), book = xlsx.read(await file.arrayBuffer(), {type:"array",cellDates:true});
    const matrix = xlsx.utils.sheet_to_json(book.Sheets[book.SheetNames[0]], {header:1,defval:"",raw:true});
    if (!dialog.open || file !== bulkFile || !document.getElementById("imLiveFile")) return;
    const latest = read(STORE, records), updates = core.preview(matrix, latest, COMPANY, "update");
    const reviewed = updateOnly ? updates : core.preview(matrix, latest, COMPANY, "add").map((row, i) => latest.some((r) => r.company === COMPANY && r.fields["Invoice No"] === row.invoiceNo) ? updates[i] : row);
    const next = core.apply(reviewed, latest), valid = reviewed.filter((r) => !r.errors.length);
    valid.filter((r) => r.kind !== "unchanged").forEach((row) => audit(next.find((r) => core.identity(r) === core.identity(row.next)), row.kind === "add" ? "Invoice uploaded" : "Invoice updated by upload", row.changes));
    const batch = {id:crypto.randomUUID(),company:COMPANY,name:file.name,mode:updateOnly ? "update" : "mixed",source:"file",at:new Date().toISOString(),total:reviewed.length,ready:valid.length,rejected:reviewed.length-valid.length,unchanged:valid.filter((r) => r.kind === "unchanged").length,applied:true,original:true,rows:reviewed.map(({row,invoiceNo,changes,errors,kind})=>({row,invoiceNo,changes,errors,kind}))};
    await fileStorage(batch.id, file);
    if (!dialog.open || file !== bulkFile) return;
    // Recheck after the asynchronous file save so a concurrent edit is never overwritten.
    if (JSON.stringify(read(STORE, records)) !== JSON.stringify(latest)) throw new Error("Invoice data changed. Please upload the file again.");
    persist(next); saveBatch(batch); close(); uploadPage = 1; setView("uploads"); notify(`${valid.length} successful · ${batch.rejected} rejected`);
  };
  const downloadBatch = async (id) => {
    try { const batch = history().find((b) => b.id === id); if (!batch) return;
      if (batch.original) { const file = await fileStorage(id); if (!file) throw new Error("Original file is no longer available in this browser."); blobDownload(batch.name, file); }
      else await excelDownload("invoice_upload_result.xlsx", [["Row","Invoice No","Result"],...batch.rows.map((r)=>[r.row,r.invoiceNo,r.errors.join("; ") || (batch.applied ? "Saved" : "Not applied")])]);
    } catch (error) { notify(error.message); }
  };
  const downloadErrors = async (id) => { try { const batch = history().find((b) => b.id === id); if (batch) await excelDownload("Failed_InvoiceUpload.xlsx", [["Row","Invoice No","Errors"],...batch.rows.filter((r) => r.errors.length).map((r) => [r.row,r.invoiceNo,r.errors.join("; ")])]); } catch (error) { notify(error.message); } };
  dialog.addEventListener("input", (e) => {
    if (e.target.dataset.imPicker) showPicker(e.target);
    if (e.target.name === "Description") e.target.closest(".imLiveField").querySelector(".imCharCount").textContent = `${e.target.value.length} / 3000`;
    if (["Invoice Date", "Credit Period"].includes(e.target.name)) calculateDueDate();
  });
  dialog.addEventListener("click", (e) => {
    const button = e.target.closest("button");
    if (button?.dataset.imClear) pickValue(button.dataset.imClear, "");
    else if (button?.dataset.imPick) pickValue(button.dataset.imPick, button.dataset.imValue);
    else if (button?.dataset.imCalendar) showCalendar(button.dataset.imCalendar);
    else if (button?.dataset.imMonth) showCalendar(calendarKey, new Date(calendarDate.getFullYear(), calendarDate.getMonth() + Number(button.dataset.imMonth), 1));
    else if (button?.hasAttribute("data-im-day")) {
      const today = new Date(), local = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,"0")}-${String(today.getDate()).padStart(2,"0")}`;
      document.getElementById(`imLive-${calendarKey}`).value = displayDate(button.dataset.imDay === "today" ? local : button.dataset.imDay); clearPicker(); if (calendarKey === "Invoice Date") calculateDueDate();
    } else if (!e.target.closest(".imLiveInput")) clearPicker();
  });
  dialog.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && dialog.querySelector(".imPicker,.imCalendar")) { e.preventDefault(); clearPicker(); }
    if (e.key === "ArrowDown" && e.target.dataset.imPicker) { e.preventDefault(); e.target.parentElement.querySelector('[role="option"]')?.focus(); }
    if (e.target.getAttribute("role") === "option" && ["ArrowDown","ArrowUp"].includes(e.key)) { e.preventDefault(); (e.key === "ArrowDown" ? e.target.nextElementSibling : e.target.previousElementSibling)?.focus(); }
  });
  dialog.addEventListener("change", (e) => { if (e.target.id === "imLiveFile") { try { chooseBulk(e.target.files[0]); } catch (error) { bulkFile = null; document.getElementById("imBulkSubmit").disabled = true; showError(error); } } });
  dialog.addEventListener("dragover", (e) => { if (e.target.closest("#imLiveDropzone")) { e.preventDefault(); e.target.closest("#imLiveDropzone").classList.add("is-dragging"); } });
  dialog.addEventListener("dragleave", (e) => e.target.closest("#imLiveDropzone")?.classList.remove("is-dragging"));
  dialog.addEventListener("drop", (e) => { if (e.target.closest("#imLiveDropzone")) { e.preventDefault(); e.target.closest("#imLiveDropzone").classList.remove("is-dragging"); try { chooseBulk(e.dataTransfer.files[0]); } catch (error) { showError(error); } } });

  const reallocate = () => {
    const r = current(); if (!r) return;
    const users = [...new Set(records.flatMap((i) => [i.agent, i.manager, i.kam, i.kas]).filter(Boolean))];
    open(`Reallocate ${selected}`, `<form id="imReallocateForm" class="imForm"><label>Role<select name="role"><option value="agent">Agent</option><option value="manager">Manager</option><option value="kam">KAM</option><option value="kas">KAS</option></select></label><label>New assignee<select name="assignee" required><option value="">Choose an assignee</option>${users.map((u) => `<option>${escape(u)}</option>`).join("")}</select></label><label class="imWide">Reason<textarea name="reason" required rows="3"></textarea></label></form>`, '<button class="adminPrimary" type="submit" form="imReallocateForm">Confirm reallocation</button>');
  };
  const remove = () => {
    if (!current()) return;
    open(`Delete ${selected}?`, `<p>Delete this invoice from Invoice Master? This action removes the invoice record.</p><form id="imDeleteForm" class="imForm"><label class="imWide">Reason<textarea name="reason" required rows="3"></textarea></label></form>`, '<button class="adminSecondary imDelete" type="submit" form="imDeleteForm">Delete invoice</button>');
  };
  document.getElementById("imSearchForm").addEventListener("submit", (e) => {
    e.preventDefault(); selected = document.getElementById("imInvoiceNumber").value.trim(); renderResult();
  });
  const actions = {
    edit, reallocate, delete: remove, upload: () => upload(), bulkUpdate: () => bulkUpload(true), close, create: () => liveForm(), bulk: () => bulkUpload(), excelTemplate: () => excelTemplate(), bulkSubmit: () => submitBulk(),
    sample: () => {
      selected = "INV-2026-1042";
      document.getElementById("imInvoiceNumber").value = selected;
      renderResult();
    },
    clear: () => { selected = ""; document.getElementById("imSearchForm").reset(); renderResult(); document.getElementById("imInvoiceNumber").focus(); },
    export: () => {
      const record = current(); if (!record) return;
      const r = live(record);
      const extra = ["Agent", "Manager", "KAM", "KAS", "Amount for the month", "Net Due", "Collection in month", "Invoice Status", "Broad Status", "Primary Status", "Substatus"];
      download(`invoice-${r.fields["Invoice No"].replace(/[^\w-]/g, "_")}.csv`, [[...core.headers, ...extra], [...core.headers.map((h) => r.fields[h]), r.agent, r.manager, r.kam, r.kas, r.amountForMonth, r.netDue, r.collectionInMonth, r.invoiceStatus, r.broadStatus, r.primaryStatus, r.subStatus]]);
    },
    template: () => download("invoice_upload_template.csv", [core.headers]),
    preview,
    errors: () => download("invoice_upload_errors.csv", [["Row", "Invoice No", "Errors"], ...plan.filter((p) => p.errors.length).map((p) => [p.row, p.invoiceNo, p.errors.join("; ")])]),
    apply: () => {
      if (!plan.some((p) => !p.errors.length && p.kind !== "unchanged")) return;
      const latest = read(STORE, records), next = core.apply(plan, latest);
      const applied = plan.filter((p) => !p.errors.length && p.kind !== "unchanged");
      applied.forEach((p) => audit(next.find((r) => core.identity(r) === core.identity(p.next)), p.kind === "add" ? "Invoice uploaded" : "Invoice updated by upload", p.changes));
      persist(next);
      let historySaved = true;
      try { saveBatch({ ...uploadBatch, applied: true }); } catch (_) { historySaved = false; }
      close(); setView("uploads"); notify(historySaved ? `${applied.length} invoices saved.` : "Invoices saved, but upload history could not be updated.");
    }
  };
  const handleAction = async (e) => {
    const button = e.target.closest("[data-im-action]"); if (!button) return;
    e.preventDefault();
    if (button.disabled) return;
    const action = actions[button.dataset.imAction]; if (!action) return;
    const error = document.getElementById("imDialogError"); if (error) error.textContent = "";
    button.disabled = true;
    try { await action(); } catch (err) {
      if (dialog.open) showError(err); else notify(err.message);
      if (button.dataset.imAction === "preview") { plan = []; const area = document.getElementById("imUploadPreview"); if (area) area.innerHTML = ""; }
    } finally { if (button.isConnected) button.disabled = false; }
  };
  mount.addEventListener("click", (e) => {
    const button = e.target.closest("button"); if (!button) return;
    if (button.dataset.imView) setView(button.dataset.imView);
    if (button.dataset.imInvoice) { selected = button.dataset.imInvoice; document.getElementById("imInvoiceNumber").value = selected; setView("details"); }
    if (button.dataset.imAllocate) liveForm(button.dataset.imAllocate);
    if (button.dataset.imSort) {
      const sort = button.dataset.imList === "uploads" ? uploadSort : queueSort;
      sort.direction = sort.key === button.dataset.imSort ? -sort.direction : 1; sort.key = button.dataset.imSort;
      renderResult();
    }
    if (button.dataset.imPage) { if (button.dataset.imList === "uploads") uploadPage = Number(button.dataset.imPage); else queuePage = Number(button.dataset.imPage); renderResult(); }
    if (button.dataset.imDownload) downloadBatch(button.dataset.imDownload);
    if (button.dataset.imHistoryErrors) downloadErrors(button.dataset.imHistoryErrors);
  });
  mount.addEventListener("input", (e) => { if (e.target.id === "imQueueSearch") { queueSearch = e.target.value; queuePage = 1; renderQueueRows(); } });
  mount.addEventListener("change", (e) => { if (e.target.id === "imShowApi") { showApi = e.target.checked; uploadPage = 1; renderUploads(); } });
  mount.addEventListener("click", handleAction);
  dialog.addEventListener("click", handleAction);
  dialog.addEventListener("change", (e) => {
    if (["imUploadMode", "imUploadFile"].includes(e.target.id)) {
      plan = []; uploadBatch = null; document.getElementById("imUploadPreview").innerHTML = ""; document.getElementById("imApply").disabled = true;
    }
  });
  dialog.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = new FormData(e.target);
    if (e.target.id === "imLiveForm") { try { saveLiveForm(form); } catch (error) { showError(error); } return; }
    const r = current(); if (!r) return;
    try {
      const next = core.clone(records), target = next.find((i) => core.identity(i) === core.identity(r));
      if (e.target.id === "imEditForm") {
        const latest = read(STORE, records).find((i) => core.identity(i) === core.identity(r));
        if (!latest || JSON.stringify(latest) !== JSON.stringify(editBaseline)) throw new Error("This invoice changed while you were editing. Close and reopen the edit form.");
        const fields = Object.fromEntries(core.headers.map((h, i) => [h, core.convert(h, form.get(`field-${i}`))]));
        const errors = core.validate(fields); if (errors.length) throw new Error(errors.join("; "));
        if (next.some((i) => i !== target && i.company === COMPANY && i.fields["Invoice No"] === fields["Invoice No"])) throw new Error("This Invoice No already exists in the company");
        const changes = core.headers.filter((h) => fields[h] !== target.fields[h]).map((h) => ({ field: h, before: target.fields[h], after: fields[h] }));
        if (!changes.length) { close(); return; }
        target.timelineInvoiceNo ||= target.fields["Invoice No"];
        target.fields = fields; audit(target, "Invoice details edited", changes);
        persist(next); selected = fields["Invoice No"]; document.getElementById("imInvoiceNumber").value = selected;
      } else if (e.target.id === "imReallocateForm") {
        const role = form.get("role"), assignee = form.get("assignee"), reason = String(form.get("reason") || "").trim();
        if (!reason || !assignee) throw new Error("Choose an assignee and enter a reason");
        if (target[role] === assignee) throw new Error("This user is already assigned to that role");
        audit(target, "Invoice reallocated", [{ field: role.toUpperCase(), before: target[role], after: assignee }], reason);
        target[role] = assignee; persist(next);
      } else if (e.target.id === "imDeleteForm") {
        const reason = String(form.get("reason") || "").trim(); if (!reason) throw new Error("Enter a deletion reason");
        const deleted = read("ineburaAdminDeletedInvoices:v1", []);
        localStorage.setItem("ineburaAdminDeletedInvoices:v1", JSON.stringify([...deleted, { invoiceNo: selected, company: COMPANY, reason, at: new Date().toISOString() }]));
        persist(next.filter((i) => i !== target)); selected = "";
      } else return;
      close(); renderResult(); notify("Invoice changes saved.");
    } catch (err) { showError(err); }
  });
  dialog.addEventListener("cancel", () => { plan = []; });
  window.addEventListener("storage", (e) => {
    if ([STORE, TRAIL, OVERRIDES, "ineburaInvoiceData", HISTORY].includes(e.key)) {
      if (e.key === STORE) records = read(STORE, records);
      renderResult();
    }
  });
  // Agent exports a snapshot in the same prototype; include any extra invoices without replacing admin changes.
  const snapshot = read("ineburaInvoiceData", []);
  const deletedInvoices = read("ineburaAdminDeletedInvoices:v1", []);
  if (Array.isArray(snapshot)) snapshot.forEach((s) => {
    if (!s.invoiceNo || deletedInvoices.some((r) => r.company === COMPANY && r.invoiceNo === s.invoiceNo) || records.some((r) => r.company === COMPANY && (r.fields["Invoice No"] === s.invoiceNo || r.timelineInvoiceNo === s.invoiceNo))) return;
    const fields = Object.fromEntries(core.headers.map((h) => [h, ""]));
    Object.assign(fields, { "Invoice No": s.invoiceNo, "Customer Code": s.customerCode, "Customer Name": s.customerName, "Invoice Value": s.invoiceValue, "Total Outstanding": s.netDueAmount, Currency: "INR" });
    [["Invoice Date", s.invoiceDate], ["Invoice Due Date", s.dueDate]].forEach(([h, v]) => { try { fields[h] = core.convert(h, v); } catch (_) { fields[h] = ""; } });
    records.push({ company: COMPANY, fields, agent: s.agentName, manager: s.managerName, kam: s.kamName, kas: s.kasName, netDue: s.netDueAmount, amountForMonth: s.amountForMonth, primaryStatus: s.primaryStatus, subStatus: s.subStatus || s.status });
  });
  try { persist(records); } catch (_) { notify("Browser storage is unavailable. Changes cannot be saved."); }
  setView(route === "invoice-reallocation" ? "unallocated" : "details");
})();
