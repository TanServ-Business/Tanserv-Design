# Dunning report integration verification — 20 October 2026

Implemented in the existing `pages/reports.html`, using `scripts/reports-dunning.js` and the issued snapshot projector. No additional page or Strategy Master control was added.

## Passed browser checks

- Selector retains 20 entries; Dunning Letters replaces the old empty nine-column tracker. Old tracker URL selects the new report.
- Full report: 101 invoice rows across four customers and DL1–DL4. QA Customer filter: 17 rows. QA Customer plus DL4: four rows.
- Existing issue-date picker, 20 October through 20 October inclusive: 23 rows, all DL1 with that issue date.
- Actual production UI export actions captured through the artifact-only `capture.html`: full.xlsx 101 rows, filtered.xlsx four rows, issue-date.xlsx 23 rows. SheetJS readback verifies all ten exact headings, numeric amounts and Excel date cells. See xlsx-readback.json.
- Blocked role: Generate rejected. Access changed after job ready: queued export rejected. Access changed after rendering: filtered export rejected and results cleared. No export captured on rejected actions.
- Authorised empty client: no-data results and header-only XLSX.
- Resources dialog offers the ten-column Dunning Excel template. Bundled source-reference workbooks remain marked as captured source layouts.

## Passed automated checks

- node scripts/test-dunning-report.cjs
- node scripts/test-reports.cjs
- node scripts/test-reports-dunning.cjs
- TZ=America/Los_Angeles node scripts/test-reports-dunning.cjs
- node --check scripts/reports.js

The integration tests verify registry idempotency and preservation of all other 19 reports, historical snapshots while feature disabled, fresh state/role/client scope, inclusive dates, partial/failed delivery rules, full/filtered/empty XLSX bytes, leading zeroes, formula-like text as literal strings and timezone-safe date cells.

## Limits

The capture harness intercepts only the native save call, leaving production report scripts in use. It changes context through test-only controls and does not mutate saved Dunning invoices, strategies or sent history. Export bytes are verified; native operating-system save completion remains unverified in the in-app browser. This local prototype does not certify a production backend or authentication boundary. The separate Hindi PDF issue and three pending business decisions are unchanged.
