# Submission Details live reference — 9 October 2026

Source: https://testclient.inebura.ai/dashboard/modules/ar/submissiondetails
Browser: Safari, dedicated window UUID 953E25C6-E61B-4E33-9ED5-5ED57F99181E.
All captures are read-only; no submission was saved on live.

## Verified states
- Not Submitted filter: eight invoices; one-row Submit opens inline form and locks selection.
- Activity choices: No Activity, Visited, Emailed, Couriered.
- Visited statuses: Not Submitted, Submitted, External Submission.
- Emailed statuses: Not Submitted, Email Sent, External Submission.
- Couriered statuses: Not Submitted, Docs Sent, External Submission.
- Not Submitted substatuses: Rejected by Customer -Supporting Docs required; Rejected by Customer -Invoice Not correct; Not Received By Customer; Invoice Cancelled; Docs Pending.
- Email Sent substatuses: Vendor HelpDesk; Sent To Other Dept; Sent To User; Vendor Portal.
- Email Sent + Vendor HelpDesk: Submission Type Email, Invoice Type Digital.
- Docs Sent substatuses: Vendor HelpDesk; Sent To User; Sent To Other Dept.
- Email Sent shows required submission type, invoice type, submission date, sent to/received by.
- Docs Sent also shows required courier name, courier date, courier AWB number.
- Submission and substatus fields are disabled until their preceding value is selected.
- Three summary cards: Submitted Invoices 732; Non Submitted Invoices 8; Externally Submitted 731.
- Quick Info: Physical Submission 0; Emailed 1; Externally Submitted 731.
- Table columns: selection, Customer Code, Customer Name, Invoice No, Invoice Date, Due Date, Invoice Status, Invoice Value, Submission Status, Submission Date, Action.
- Status filter options: All, Not Submitted, Submitted, Email Sent, Docs Sent, External Submission.

## Additional verified source evidence
- Loaded All state, 740-row pagination, bulk selection and bulk form, External Submission form, date range filter, and mobile 390 × 844 captures saved.
- Source CSS, Bootstrap icon font, client/logo/avatar images saved locally; main screen uses Arial.
- Renewed login verified current status order and dependent super-substatus catalogues. Pending document categories and rejected-invoice categories are captured separately.
- Vendor Portal under Submitted uses Physical; invoice options are Hard Copy In Triplicate (Govt) and Hard Copy.
- `source-loading.png` is transient. `source-mobile-form.png` is a table capture, not a verified form capture.

## Replica and verification
- Replica uses source assets and styles. First ten All rows and eight pending rows match observations. Remaining pagination rows are explicitly synthetic DEMO fixtures in code.
- Not Submitted includes the requested Add Issue action. Existing local Issue Tracker routing and storage behavior is retained.
- Local single-invoice form opens; required-field validation, dependent selectors, and save success verified. Local save updated TVS545661 to Not Submitted & Tracking with submission date 09-10-2026. No live save was made.
- Desktop and inline form source/local composite comparisons saved.
- Mobile 390 × 844 source/local comparison completed in `comparison-mobile.png`; summary cards, Quick Info, filters and horizontally scrolling table checked.
- Local issue for TVS545662 saved successfully and opened in the existing Issue Tracker with the expected manager-review route. Invoice status and pending count stayed unchanged. Evidence: `implementation-issue-saved.png` and `implementation-tracker-link.png`.
- Bulk form, empty search, pagination and date range apply/clear verified. Calendar propagation fixed after date-filter testing. Safari console contained no errors.
- Final preview restored in the separate Safari window after the meeting pause. Root `design-qa.md` records passed QA for the captured states and the remaining prototype boundaries.
