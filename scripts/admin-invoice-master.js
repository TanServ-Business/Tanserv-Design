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
  let selected = "", plan = [], excelPromise, editBaseline;
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
    const area = document.getElementById("imResult"), record = current();
    if (!selected) { area.innerHTML = empty("Search an invoice", "Enter an invoice number to view its details and timeline."); return; }
    if (!record) { area.innerHTML = empty("Invoice not found", `No invoice ${selected} was found in ${COMPANY}. Check the number or upload new invoice data.`, true); return; }
    const r = live(record), f = r.fields;
    const month = r.month || new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit" }).slice(0, 7);
    const monthLabel = /^\d{4}-\d{2}$/.test(month) ? new Intl.DateTimeFormat("en-IN", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(`${month}-01T00:00:00Z`)) : "Current month";
    const timeline = trailEntries(record).map(renderEvent).join("");
    area.innerHTML = `<div class="imWorkspace"><section class="imPanel" aria-label="Invoice details"><div class="imDetailsScroll"><header class="imInvoiceHeader"><h2>${escape(f["Invoice No"])}${r.invoiceStatus ? `<span class="imStatus ${r.invoiceStatus === "Overdue" ? "imOverdue" : ""}">${escape(r.invoiceStatus)}</span>` : ""}</h2><p>${escape(f["Customer Name"])} · ${escape(f["Customer Code"])}</p></header><div class="imCards"><section class="infoCard"><h3 class="infoCardTitle">Assignees</h3>${[["Agent", r.agent], ["Manager", r.manager], ["KAM", r.kam], ["KAS", r.kas]].map(([k, v]) => kv(k, v)).join("")}</section><section class="infoCard imMoney"><div class="imCardHeading"><h3 class="infoCardTitle">Invoice amounts</h3><small>${escape(monthLabel)}</small></div>${kv("Invoice value", money(f["Invoice Value"], f.Currency))}${kv("Amount for the month", money(r.amountForMonth, f.Currency))}${kv("Net Due", money(r.netDue, f.Currency))}${kv("Collection in month", money(r.collectionInMonth, f.Currency), false, "imCollected")}</section><section class="infoCard imSummary"><h3 class="infoCardTitle">Invoice summary <span class="imSummaryNote"><i aria-hidden="true" class="bi bi-lock-fill"></i> Collection statuses · view only</span></h3><div class="imSummaryGrid">${[summaryLeft, summaryRight].map((col) => `<div>${col.map((h) => kv(h, fieldValue(r, h), ["Broad Status", "Primary Status", "Substatus"].includes(h), h === "Invoice Status" && r.invoiceStatus === "Overdue" ? "imOverdue" : "")).join("")}</div>`).join("")}</div></section></div></div><footer class="imActions"><button class="adminPrimary" data-im-action="edit"><i aria-hidden="true" class="bi bi-pencil"></i>Edit invoice</button><button class="adminSecondary" data-im-action="reallocate"><i aria-hidden="true" class="bi bi-diagram-3"></i>Reallocate</button><button class="adminSecondary" data-im-action="export"><i aria-hidden="true" class="bi bi-file-earmark-arrow-down"></i>Export</button><button class="adminSecondary imDelete" data-im-action="delete"><i aria-hidden="true" class="bi bi-trash"></i>Delete</button></footer></section><aside class="imPanel" aria-label="Invoice timeline"><header class="imTimelineHeading"><h2>Invoice timeline</h2><p>Activity Trail · Newest first</p></header><div class="imTimelineScroll">${timeline ? `<div class="imTrail">${timeline}</div>` : '<p role="status">No activity recorded for this invoice.</p>'}</div></aside></div>`;
  };
  mount.innerHTML = `<main class="imPage" data-admin-module="invoice-master"><header class="imHero"><div><h1>Invoice Master</h1><p>Find an invoice to view details and manage updates.</p></div><button class="adminSecondary" data-im-action="upload"><i aria-hidden="true" class="bi bi-upload"></i>Upload CSV / Excel</button></header><form class="imSearch" id="imSearchForm"><label for="imInvoiceNumber">Invoice number</label><input id="imInvoiceNumber" name="invoiceNo" autocomplete="off" placeholder="Enter invoice number" required /><button class="adminPrimary" type="submit">Search</button><button class="imTextButton" type="button" data-im-action="clear">Clear</button></form><div id="imResult" aria-live="polite"></div></main>`;
  const dialog = document.createElement("dialog");
  dialog.className = "imDialog";
  document.body.appendChild(dialog);
  const close = () => { dialog.close(); dialog.innerHTML = ""; plan = []; };
  const open = (title, body, footer = "") => {
    if (dialog.open) dialog.close();
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
    plan = [];
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
    applyButton.textContent = `Apply ${ready} valid ${mode === "add" ? "invoices" : "updates"}`;
    applyButton.disabled = !ready;
  };
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
    edit, reallocate, delete: remove, upload, close,
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
      persist(next); close(); renderResult(); notify(`${applied.length} invoices saved.`);
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
  mount.addEventListener("click", handleAction);
  dialog.addEventListener("click", handleAction);
  dialog.addEventListener("change", (e) => {
    if (["imUploadMode", "imUploadFile"].includes(e.target.id)) {
      plan = []; document.getElementById("imUploadPreview").innerHTML = ""; document.getElementById("imApply").disabled = true;
    }
  });
  dialog.addEventListener("submit", (e) => {
    e.preventDefault();
    const r = current(); if (!r) return;
    const form = new FormData(e.target);
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
    if ([STORE, TRAIL, OVERRIDES, "ineburaInvoiceData"].includes(e.key)) {
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
  renderResult();
})();
