/* Invoice template schema and import validation, shared by the browser and checks. */
((root) => {
  "use strict";
  const headers = ["Customer Code", "Customer Name", "Customer GSTN", "City", "Pincode", "Invoice No", "Invoice Date", "Credit Period", "Invoice Due Date", "Invoice Value", "Total Outstanding", "Tax Value", "Base Value", "PO Number", "Convertor", "Currency", "Client Status", "Sales Order Number", "Industry Type", "Product Category", "Description", "Invoice Handover Date", "Bill to Address", "Ship To Address", "Profit Center", "Business Unit", "Billing Start Date", "Billing End Date", "Equipment Number", "Equipment Name", "Job Type", "Sub Job Type", "Business", "Document Number", "Document Type", "Reference", "Reference Key 3", "Customer Due Date", "Doc Curr Amount", "Client Due Date", "Customer Credit Period", "Classification"];
  const dates = new Set(["Invoice Date", "Invoice Due Date", "Invoice Handover Date", "Billing Start Date", "Billing End Date", "Customer Due Date", "Client Due Date"]);
  const numbers = new Set(["Invoice Value", "Total Outstanding", "Tax Value", "Base Value", "Convertor", "Doc Curr Amount"]);
  const required = new Set(["Customer Code", "Customer Name", "Invoice No", "Invoice Date", "Invoice Due Date", "Invoice Value", "Currency"]);
  const normalize = (s) => String(s ?? "").replace(/^\uFEFF/, "").trim().toLowerCase().replace(/[\s_-]/g, "");
  const locked = new Set(["invoicestatus", "broadstatus", "primarystatus", "substatus"]);
  const clone = (v) => JSON.parse(JSON.stringify(v));
  const identity = (record) => `${record.company}\u0000${record.fields["Invoice No"]}`;
  const dateValue = (v) => {
    if (v instanceof Date && !Number.isNaN(v.getTime())) return v.toISOString().slice(0, 10);
    const s = String(v).trim();
    let y, m, d;
    let match = s.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (match) [, y, m, d] = match;
    else if ((match = s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/))) [, d, m, y] = match;
    else if ((match = s.match(/^(\d{1,2})[ -]([A-Za-z]{3})[ -](\d{4})$/))) {
      [, d, m, y] = match;
      m = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"].indexOf(m.toLowerCase()) + 1;
    } else throw new Error("Use YYYY-MM-DD, DD/MM/YYYY or DD Mon YYYY");
    const date = new Date(Date.UTC(Number(y), Number(m) - 1, Number(d)));
    if (date.getUTCFullYear() !== Number(y) || date.getUTCMonth() !== Number(m) - 1 || date.getUTCDate() !== Number(d)) throw new Error("Invalid date");
    return date.toISOString().slice(0, 10);
  };
  const convert = (header, value) => {
    if (value === "" || value == null) return "";
    if (dates.has(header)) return dateValue(value);
    if (numbers.has(header)) {
      const s = String(value).trim().replace(/,/g, "");
      if (!/^\d+(\.\d+)?$/.test(s) || !Number.isFinite(Number(s))) throw new Error("Enter a non-negative number");
      return Number(s);
    }
    return String(value).trim();
  };
  const validate = (fields) => {
    const errors = [];
    required.forEach((h) => { if (fields[h] === "" || fields[h] == null) errors.push(`${h} is required`); });
    if (fields["Invoice Date"] && fields["Invoice Due Date"] && fields["Invoice Due Date"] < fields["Invoice Date"]) errors.push("Invoice Due Date is before Invoice Date");
    if (fields["Billing Start Date"] && fields["Billing End Date"] && fields["Billing End Date"] < fields["Billing Start Date"]) errors.push("Billing End Date is before Billing Start Date");
    return errors;
  };
  // RFC 4180: retain multiline/quoted cells and reject malformed CSV instead of guessing.
  const parseCSV = (text) => {
    const rows = []; let row = [], cell = "", quoted = false, closed = false;
    const input = String(text).replace(/^\uFEFF/, "");
    const pushCell = () => { row.push(cell); cell = ""; closed = false; };
    const pushRow = () => { pushCell(); if (row.some((v) => v.trim() !== "")) rows.push(row); row = []; };
    for (let i = 0; i < input.length; i++) {
      const c = input[i];
      if (quoted) {
        if (c === '"' && input[i + 1] === '"') { cell += '"'; i++; }
        else if (c === '"') { quoted = false; closed = true; }
        else cell += c;
      } else if (c === '"') {
        if (cell || closed) throw new Error("Unexpected quote in CSV");
        quoted = true;
      } else if (c === ",") pushCell();
      else if (c === "\n" || c === "\r") { if (c === "\r" && input[i + 1] === "\n") i++; pushRow(); }
      else { if (closed) throw new Error("Unexpected text after a quoted CSV value"); cell += c; }
    }
    if (quoted) throw new Error("Unclosed quote in CSV");
    if (cell || row.length || closed) pushRow();
    return rows;
  };
  const preview = (matrix, records, company, mode) => {
    if (!["add", "update"].includes(mode)) throw new Error("Choose add or update");
    if (!matrix.length) throw new Error("The file is empty");
    const normalizedHeaders = matrix[0].map(normalize);
    if (!normalizedHeaders.includes(normalize("Invoice No"))) throw new Error("The file must include Invoice No");
    if (new Set(normalizedHeaders).size !== normalizedHeaders.length) throw new Error("Duplicate column headers");
    const lookup = new Map(headers.map((h) => [normalize(h), h]));
    const unknown = matrix[0].filter((h) => !lookup.has(normalize(h)) && !locked.has(normalize(h)));
    if (unknown.length) throw new Error(`Unknown columns: ${unknown.join(", ")}`);
    const invoiceIndex = normalizedHeaders.indexOf(normalize("Invoice No"));
    const counts = new Map();
    matrix.slice(1).forEach((row) => {
      const no = String(row[invoiceIndex] ?? "").trim();
      if (row.some((v) => v != null && String(v).trim() !== "")) counts.set(no, (counts.get(no) || 0) + 1);
    });
    const results = [];
    matrix.slice(1).forEach((row, index) => {
      if (!row.some((v) => v != null && String(v).trim() !== "")) return;
      const no = String(row[invoiceIndex] ?? "").trim();
      const existing = records.find((r) => r.company === company && r.fields["Invoice No"] === no);
      const next = existing ? clone(existing) : { company, fields: Object.fromEntries(headers.map((h) => [h, ""])) };
      const errors = [], changes = [];
      if (!no) errors.push("Invoice No is required");
      if ((counts.get(no) || 0) > 1) errors.push("Duplicate Invoice No in this file");
      if (row.length > matrix[0].length) errors.push("More values than column headers");
      if (mode === "add" && existing) errors.push("Invoice already exists; choose Update existing invoices");
      if (mode === "update" && !existing) errors.push("Invoice not found in this company; choose Add new invoices");
      matrix[0].forEach((rawHeader, column) => {
        const value = row[column];
        if (value == null || String(value).trim() === "") return;
        const normalized = normalize(rawHeader), header = lookup.get(normalized);
        if (locked.has(normalized)) { errors.push(`${rawHeader} is view only`); return; }
        try {
          const converted = convert(header, value);
          if (next.fields[header] !== converted) changes.push({ field: header, before: next.fields[header] ?? "", after: converted });
          next.fields[header] = converted;
        } catch (error) { errors.push(`${header}: ${error.message}`); }
      });
      errors.push(...validate(next.fields));
      results.push({ row: index + 2, invoiceNo: no, existing: existing ? clone(existing) : null, next, changes, errors, kind: errors.length ? "error" : existing ? (changes.length ? "update" : "unchanged") : "add" });
    });
    if (!results.length) throw new Error("The file contains headers but no invoice rows");
    return results;
  };
  const apply = (plan, current) => {
    const next = clone(current);
    plan.filter((p) => !p.errors.length && p.kind !== "unchanged").forEach((p) => {
      const i = next.findIndex((r) => identity(r) === identity(p.next));
      if (p.existing && (i < 0 || JSON.stringify(next[i]) !== JSON.stringify(p.existing))) throw new Error(`${p.invoiceNo} changed since preview. Review the file again.`);
      if (!p.existing && i >= 0) throw new Error(`${p.invoiceNo} was added since preview. Review the file again.`);
      if (i < 0) next.push(clone(p.next)); else next[i] = clone(p.next);
    });
    return next;
  };
  const api = { headers, dates, numbers, required, normalize, locked, convert, validate, parseCSV, preview, apply, identity, clone };
  if (typeof module !== "undefined" && module.exports) module.exports = api;
  else root.IneburaInvoiceCore = api;
})(typeof window === "undefined" ? globalThis : window);
