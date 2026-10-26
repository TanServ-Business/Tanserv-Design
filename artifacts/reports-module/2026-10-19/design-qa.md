# Reports module reference QA 19 October 2026

## Findings and final comparison

No actionable P0, P1 or P2 findings remain in the implemented report flow.

Source visual truth: `artifacts/reports-module/2026-10-19/source/achievement-desktop.png` and `source/mobile-cdp.png`.
Implementation: `artifacts/reports-module/2026-10-19/implementation/achievement-desktop-final.png` and `implementation/visit-plan-mobile-v2.png`.
Full-view comparisons: `desktop-final-comparison.png` and `mobile-comparison-final.png` in the same artifact folder.
Focused comparisons: `toolbar-final-comparison.png` and `table-final-comparison.png`.

Desktop viewport and both raster sizes: 1066 × 1110 CSS px / pixels, density 1. State: Achievement Details, September and October 2026 selected, four September rows displayed. Mobile viewport and final comparison raster sizes: 390 × 844 CSS px / pixels, density 1. State: Visit Plan, all dates, first report page. Earlier browser screenshots that scaled a background viewport are superseded by the native CDP mobile capture and are not final comparison evidence.

## Comparison history

1. Initial implementation had a month-value overlap with Generate at 1280 px. Fixed parameter flex sizing, badge limits and action wrapping. Post-fix desktop screenshot confirms all controls are separate; source and design top bars both measure 120 px high at the matched viewport.
2. Local header branding occupied excess vertical space. Matched the source's 66 px header, used the captured source logo and corrected logo-container padding. Shared local profile and notification state remain part of the existing shell.
3. Initial local mobile header overflowed to 407 px. Reduced only the report-page header spacing and logo sizing. Retest measured the document at exactly 390 px with all right-hand controls visible. The report toolbar deliberately wraps on mobile; the source clipped the subtitle and Clear control. Wide tables retain horizontal scrolling.
4. Export comparison found formatted currency and missing-value markers in CSV. Normalised currency values to raw numbers and missing values to empty fields; preserved zero and identifiers. Added a regression assertion against these cases.

## Required fidelity surfaces

- Fonts and typography: report content uses the source Arial/Helvetica 12 px table text, 18 px bold title, 12 px subtitle, and matching control hierarchy. Header-case rendering and uppercase period badges match the reference without changing canonical output headers.
- Spacing and layout rhythm: matched 28 px desktop side padding, 24 px top padding, 16 px cards, 38 px action controls, 40 px table heading row and source table cell padding. Intentional mobile wrapping keeps persistent controls reachable.
- Colors and tokens: source report styles are retained locally, including #5c258d branding, #f4f6f9 page background, purple table headings, pale filter rows and green filtered-download action.
- Image quality and asset fidelity: captured Inebura and Xeon logos and the real Bootstrap Icons font are local assets. No report UI assets are hotlinked, hand-drawn or substituted with emoji.
- Copy and content: all 20 report names, source column counts and sample values are preserved. The attachment catalog and Reference sample data footer are requested additions. Empty source datasets remain empty.

## Browser and export checks

All 20 reports were generated through the local browser; results are in `implementation/browser-checks.json`. Verified month selection, report search, generation/ready/view states, cancellation, column filters, filter clearing, sorting, 15-row pagination, Clear and the attachment dialog. Downloaded filtered CSV and generated XLSX were reopened: CSV contained only Week 1, XLSX contained 21 headers and four rows, with portfolio value 77611681.27. Column counts of ODM and Issue Tracker are 83 and 46 respectively. Browser warning/error log check returned no entries.

All 40 individual Excel files were reopened structurally and checked for exact header order, sample row counts and absence of invented formulas. Both combined workbooks contain 20 sheets. Spreadsheet previews were reviewed for every report; widths were adjusted to fit the supplied sample values. Logic checks pass in `scripts/test-reports.cjs`.

## Expected constraints and follow-up

This is a local frontend using 166 sample rows, not a backend integration or complete tenant export. Financial fields use captured values, without new financial calculations. Server permissions and exact server date inclusion rules are not inferred from visible headers. The shared shell retains the local user's profile and notification state. Reports with no exposed event date keep the available sample rows when a date range is selected. The original live XLSX transfer failed after File ready; supplied template/sample workbooks are authored from captured layouts and data.

## Implementation checklist

- [x] Source captured and compared with rendered implementation.
- [x] Desktop and mobile controls verified.
- [x] All 20 layouts generated and checked.
- [x] CSV and XLSX downloads verified.
- [x] Templates and samples attached in the report page.
- [x] Existing unrelated work preserved.

final result: passed
