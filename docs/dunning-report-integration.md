# Dunning Letters invoice report

The report now belongs to **Module Configuration → Dunning Letters**, within the Client Admin screen. It is not a Reports selector entry. The other 19 Reports layouts and their attachments are preserved.

## Entry point and access

Load `dunning-report-data.js`, `reports-dunning.js`, `dunning-management-report.js` and the existing `vendor/xlsx.full.min.js` in the Admin shell, with `css/dunning-management-report.css`.

```js
const report = window.IneburaDunningManagementReport.mount(container, {
  api: window.IneburaDunning,
  notify: message => showToast(message)
});
// report.refresh(); report.exportRows('full' | 'filtered'); report.destroy();
```

The UI reads fresh core state and context on every render, filtering action and export. Only Client Admin with a client scope can see or export rows. Agent, Supervisor, MIS, MIS Manager, unknown roles and missing client scope are denied. Agents retain their separately implemented invoice-screen exclusion access; that permission grants no report access.

A saved download handler cannot export after a role change, and switching client scope obtains only that client's issued snapshots. Core subscriptions and focus/storage events refresh the view. Destroy unsubscribes and invalidates saved callbacks. This remains a local prototype permission model; production must enforce the same rule at the service boundary.

Old `reports.html?report=dunning-letter-tracker` and `?report=dunning-letters` links redirect an authorized Client Admin to `admin.html?module=module-configuration&view=dunning-letters`. Unauthorized legacy links display a no-access message before the Reports UI initializes and expose no report rows. Explicit MIS identity links are denied.

## Exact columns, in order

| Key | Heading | Type |
|---|---|---|
| `clientCode` | Client Code | text |
| `customerCode` | Customer code | text |
| `customerName` | customer name | text |
| `invoiceNumber` | invoice number | text |
| `invoiceAmount` | invoice amount | number |
| `invoiceDueDate` | invoice due date | date |
| `dunningLetter` | Dunning letter | text |
| `dunningLetterReferenceNo` | Dunning letter reference no | text |
| `dunningLetterIssueDate` | Dunning letter issue date | date |
| `recipients` | recipients (comma separated) | text |

## Row and filter rules

- One row per invoice per issued email with status `sent` or `partial`. Fully failed attempts and unsent batches produce no rows. A later letter produces another row for the same invoice.
- Values come from immutable `email.letterSnapshot`, the issued email's captured To addresses and status. Current balances, contacts, customer names and templates never rewrite issued history.
- Invoice amount is the captured original amount (`originalAmount`, or legacy `amount`). Missing amounts remain blank; remaining outstanding is not substituted.
- Client and customer codes come from captured business fields. Missing legacy codes remain blank. Storage IDs must never be substituted.
- Dunning letter is the captured stage `DL1`, `DL2`, `DL3`, `DL4` and onward, irrespective of template renaming or reuse.
- Recipients are all captured To email addresses joined by comma and space, including a partially failed delivery's original recipient list.
- Historical stages remain visible after letter count decreases. History remains readable with Dunning disabled.
- Issue date from/to filters are optional and inclusive. Invalid and reversed dates display a validation message. An active date boundary excludes unknown captured issue dates.
- Customer search matches captured name or business code, case insensitively. Letter-stage choices come from issued history, including stages above the current configured count.

The report shows 15 rows per page. **Download all XLSX** exports every issued row in the current client scope; **Download filtered XLSX** applies the accepted date/customer/stage filters and exports every matching row, including other pages.

XLSX exports have exactly ten columns. Amounts are numeric cells; dates are UTC-based Excel serials formatted `yyyy-mm-dd`; codes, names, references, invoice numbers and recipients are literal strings. Leading zeroes and formula-like strings are preserved as text. Empty exports contain the header row only.

The lower-level projector remains available as `window.IneburaDunningReport`: `allRows`, `filterRows`, `projectRows`, `summary`, `buildDataset` and optional safe `toCsv`. Internal `_stage`, `_letterId` and `_customerKey` metadata support filtering/counts and are never exported.

## Reports resource migration

Removed Dunning's old selector descriptor, downloadable template/sample files, resource-dialog entry and Dunning worksheet from both bundled Reports workbooks. Removed the three Dunning resources and corresponding workbook sheets from the complete ZIP. Other worksheet/shared-string parts and unrelated report files are preserved byte for byte. Captured evidence screenshots remain historical source evidence rather than current navigation.

## Verification

Run with the bundled Node runtime:

```text
scripts/test-dunning-report.cjs
scripts/test-dunning-management-report.cjs
scripts/test-reports-dunning.cjs
scripts/test-reports.cjs
scripts/test-mis-reports-ui.cjs
scripts/test-mis-reports.cjs
```

The suites cover exact columns, original amounts, immutable snapshots, sent/partial/failed selection, inclusive and invalid filters, retained historical stages, escaped output, live role/client checks, saved-handler denial, no state mutation, disposal, guarded legacy navigation, preserved Reports catalog/resources and full/filtered/empty typed XLSX readback. The shared XLSX integration suite also runs with `TZ=America/Los_Angeles` to check date stability. Browser verification of the combined Admin tab is recorded with the module's end-to-end checks.
