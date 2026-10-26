# Dunning Letters design review

The implemented workspace is **Module Configuration → Dunning Letters**, available to **Client Admin only**. The existing **Configurations** tab retains the Dunning toggle and number of letters. Sending, templates, invoice participation, activity and reporting are managed together in the new tab.

## Review order

1. Open `pages/admin.html?module=module-configuration&view=configurations`. Use **Edit Configuration** to enable Dunning Letters and set **Number of Dunning Letters**. Valid counts are whole numbers from **1 to 1000**; the initial count is 3.
2. Open `pages/admin.html?module=module-configuration&view=dunning-letters`. Review these five sections:
   - **Letter Templates:** choose the provided standard Word template or upload a `.docx` for each stage; edit its email subject and message; validate and preview the generated PDF.
   - **Sending & Scheduling:** create or edit a strategy, select its coverage and sequential letter stages, configure timing and invoice filters, then activate it. Review eligibility, pause or stop it here.
   - **Letter Activity:** review daily batches, next dates, strategy conflicts, recipient results, sent emails and retained PDFs. The labelled **Run daily cycle** control simulates success, partial success or complete failure on a selected date.
   - **Invoice Participation:** review original and outstanding amounts, filter by the latest successfully sent letter, and exclude invoices from future letters. Fully paid invoices are omitted automatically from future letters.
   - **Invoice Report:** filter issued history by issue date, customer name/code and letter stage; download all or filtered rows as XLSX.
3. Review Agent exclusions on the existing invoice screen (`index.html`) or the appropriate invoice workspace. Agents can exclude their assigned invoices but cannot open the Dunning management tab or report. Supervisor and MIS roles also cannot access this tab.
4. Check the old Template Master, Document Setup, Strategy Master, Email and Reports screens. Dunning management now belongs to the new tab; ordinary functionality remains in those screens. Dunning email templates are hidden from the generic template list, and its report is removed from the Reports selector and attachments.

The Admin shell establishes Client Admin independently of a previously visited Agent workspace. Explicit role query parameters are local review overrides, not authentication. Legacy Reports URLs using `?report=dunning-letter-tracker` or `?report=dunning-letters` redirect an authorized Client Admin to the new tab; other roles receive an unavailable state.

## Letter count and strategy changes

- A count of 1 supports a complete single-letter setup. Setting the count creates available template stages; **it does not create or activate a sending strategy**. Without a configured active strategy, no letters send.
- Increasing the count makes further stages available. Client Admin must add their templates and schedules to the strategy on this page. Added stages apply to active and new batches; completed batches remain completed.
- Decreasing the count removes stages above the new count from every unsent sequence, including existing batches. Sent emails, PDFs and invoice-report rows remain available, including historical DL numbers above the current count.
- Existing strategy IDs, invoice/customer targets, exclusions, filters, batch membership and sent history are retained during the move. Ordinary edits preserve migrated Strategy Master coverage. Explicit coverage changes replace those target rules. Mixed strategies retain their ordinary reminder blocks while their Dunning sequence is managed here.

## Standard Word and email templates

The default file is `assets/dunning/standard-dunning-letter.docx`. It uses the approved letter wording on page 1 and an invoice annexure table on page 2. Invoice number, amount due, due date and invoice totals belong in the annexure. Customer branding, names, signatures and stamps from the supplied source were removed and replaced with reusable fields.

Use the Word letter template dropdown to choose **Standard Word Template** or **Upload my Word Template**. The upload/replace control appears only for the upload choice. Users can download the standard Word file, edit it externally, and upload their own version. There is **no in-application Word editor**. Uploaded Word files are checked for supported customer, letter and invoice values; missing, unknown or malformed values block saving. Required values include customer name, issue date, reference, outstanding total and invoice table. Follow-up letters also require previous-letter references. Validation failures, cancelled edits and late upload responses cannot replace a saved template.

DL1–DL3 reuse the existing captured email templates and previously saved email edits. DL4 and later use the current DL3 email subject and message. Edit the email in DL3 to apply changes to future DL3 and later sends; additional stages display that shared email for review and retain their own Word template and schedule. Existing issued emails and PDFs remain frozen. New-tab email edits are not overwritten by the old Template Master catalog.

The standard file contains neutral placeholders for payment days, payment instructions and sender details. Client Admin should set those in the Word file and upload it before client use.

## Confirmed sending behaviour

- Daily eligibility groups newly eligible invoices into one batch per customer and strategy. Each batch follows its own schedule. Different letter stages due for the same customer on the same day produce separate emails.
- Repeating a daily run does not resend a stage or duplicate that day's customer batch. Fully paid invoices are omitted; partial payments use the remaining outstanding balance. An empty batch sends no letter and shows its hold reason.
- Invoice participation is automatic through eligibility rules. Manual exclusions persist. There is no inclusion request, approval flow, dispute flow or separate currency handling.
- Invoice Participation shows each invoice's **Last letter sent**, based on the latest successful or partially successful issue containing that invoice. Filter by **All letters**, **Not sent**, or **DL1/DL2/DL3…**, combined with customer/invoice search. Failed attempts do not advance this value. Paid and manually excluded invoices retain their sent stage; historical DL stages remain available after reducing the configured count.
- All customer contacts are included. Any successful contact completes the stage; failed contacts are not retried after partial success. Complete failure retries on the next daily run, blocks later stages and shifts their dates when delivery eventually succeeds. Other batches keep their schedules.
- Timing, template and filter changes apply to unsent stages. Sent content, captured amounts, recipients and PDF bytes remain unchanged.
- Overlapping active strategies hold affected invoices until Client Admin selects one strategy. Previously sent stages and references are retained; resolving a conflict does not resend earlier letters.
- Finishing the last configured stage does not create an additional escalation or collection activity. Disabling Dunning prevents processing and retains configuration/history.

## Invoice report

Each row represents one invoice in one issued letter whose delivery is successful or partially successful. Completely failed attempts are excluded. The exact columns, in order, are:

1. Client Code
2. Customer code
3. customer name
4. invoice number
5. invoice amount
6. invoice due date
7. Dunning letter
8. Dunning letter reference no
9. Dunning letter issue date
10. recipients (comma separated)

Invoice amount is the **original invoice amount captured at issue**, rather than its remaining outstanding amount. Later changes do not rewrite historical rows. Missing business codes remain blank; internal IDs are not substituted. All original To recipients are retained, including those in a partially failed issue.

Both downloads are XLSX with exactly ten columns. Amounts are numbers, dates are typed Excel dates, and codes/references remain literal text with leading zeroes preserved. Filtered downloads include matching rows across all pages. The old Dunning Reports entry, individual samples/templates and corresponding sheets in aggregate workbooks/ZIP have been removed; the other 19 report layouts remain available. See `docs/dunning-report-integration.md` for the detailed report contract.

## Pending team confirmation

1. **Retry limit:** maximum complete-failure retries. The prototype demonstrates daily retry without inventing a cutoff.
2. **Resume after a manual pause:** scheduling when a pending date passed while paused. That transition remains blocked; resume before a missed date is available.
3. **Removing an exclusion:** stage on reinstatement. Restarting at Letter 1 in a new daily batch is a proposal awaiting confirmation; reinstatement remains unavailable.

## Prototype boundaries and verification

This is a local HTML design prototype, with shared browser state under `inebura:dunning:review-v1` on the same origin. It has **no production scheduler, email service or server-side authorization**. The daily cycle simulates delivery, and invoice refresh uses local sample portfolio data.

Mammoth imports Word text and basic paragraph/table formatting; the local PDF renderer is not Microsoft's Word layout engine. The supplied Word document and generated PDF can differ in pagination, fonts and complex formatting. Letter and annexure are combined into one generated PDF; each simulated issue retains its exact PDF bytes. Non-Latin PDF rendering remains a production limitation to resolve.

The captured DL2 email source ends with an incomplete link tag. Its saved source is preserved; runtime drops the unfinished tag without inventing missing content. Production needs the complete DL2 email source.

Verification includes `scripts/test-dunning-core.cjs`, `test-dunning-management.cjs`, `test-dunning-management-templates.cjs`, `test-dunning-management-report.cjs`, `test-dunning-integrations.cjs`, `test-dunning-documents.cjs`, `test-dunning-report.cjs`, `test-dunning-template-adapter.cjs`, `test-dunning-template-email-flow.cjs`, `test-dunning-strategy.cjs`, `test-reports-dunning.cjs`, `test-reports.cjs` and MIS report regression suites. Run each with the bundled Node runtime. Checks cover count limits, a complete one-letter cycle, batch scheduling, immutable history, migration/coverage preservation, upload validation, pending transitions, role/client changes during asynchronous work, saved-handler guards and typed XLSX readback.

Current implementation QA is recorded under `artifacts/dunning/2026-10-21/module-configuration/`. Browser testing uses an isolated localhost origin on port 8773; the user's existing port 8771 state is preserved. Browser export readback confirmed a two-row, ten-column invoice report with numeric amounts and typed dates. Earlier screenshots under other Dunning artifact folders describe earlier placements and are historical evidence.
