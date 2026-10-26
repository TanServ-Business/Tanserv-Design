# Reports module reference

The local Reports page is `pages/reports.html`. It is available from Reports in the shared navigation.

The implementation follows the Reports view available to the supplied Xeon agent account on 19 October 2026. That view contains 20 reports. It is separate from the five proposed layouts in the earlier PRD; the earlier document is unchanged.

## Behavior

- Search and select one of the 20 report names.
- Achievement Details uses a working-month picker with multiple selections. Its 2026 custom ranges reproduce those shown by the source.
- Most reports expose Date Range. Issue Tracker Report and ODM Report have no parameter controls in this account.
- Generate produces a Report ready action, followed by View Report and an inline table. Download XLSX produces File ready followed by Download.
- Results support sortable columns, searchable value filters, clearing filters, horizontal scrolling and 15-row pagination.
- Download Filtered produces CSV, as observed in the reference. XLSX generation preserves numbers, text identifiers, zero values and missing values.
- Clear resets the selected report, parameters and results. Cancelling a pending generation prevents its completion from replacing the current view.
- Excel templates and sample data opens the attachment catalog. Every report has a header-only Excel layout, a sample Excel workbook and a CSV. Combined workbooks and a ZIP are also linked.

## Samples and limits

The page runs locally with 166 captured sample rows. Activity Report Full has 30 rows for pagination testing; other populated reports contain up to 12 rows. CN Usage Report, Dunning Letter Tracker, On Account Balance Report and On Account Usage Report returned no data and retain header-only samples.

Financial amounts are captured values. The prototype introduces no financial calculations or totals. Samples are not complete tenant exports. Date filtering uses available event date columns in the sample; reports with no exposed event date retain their sample rows. Server-side date definitions and permission policies are outside this frontend reference.

The live original XLSX action reached File ready, but the browser transfer failed. The attached Excel files were created from captured table headers and sample values. They are layout references, not upload templates or original server-generated files. The original filtered Achievement CSV is retained under the source evidence folder.

## Verification

- Browser-generated every report and checked all 20 column counts against the source inventory.
- Tested working-month selection, cancellation, sorting, column filtering, clearing filters, pagination, Clear and attachment catalog behavior.
- Downloaded and reopened a generated XLSX and filtered CSV; checked their rows and monetary values.
- Validated all 40 per-report Excel files against the captured headers and sample row counts.
- Compared desktop screenshots and focused toolbar/table crops at 1066 by 1110 pixels.
- Checked mobile at 390 by 844 pixels. The design deliberately wraps the source's overflowing toolbar and keeps the shared header within the viewport.
- Browser error and warning log check returned no entries.

Source evidence and comparisons: `artifacts/reports-module/2026-10-19/`.

Run the logic checks with the bundled Node runtime and `scripts/test-reports.cjs`. Serve the repository with a static HTTP server for browser preview.
