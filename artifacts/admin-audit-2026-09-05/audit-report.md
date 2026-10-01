# Admin design parity audit

**Verdict: admin.html does not fully match the live Admin platform.**

33 landing pages + 35 secondary states/attempts • 136 screenshots • 1440 × 1000 • 5 September 2026

No landing page has been signed off as exact. Close means recognizably similar, not passed. This report does not certify all states.

## Priority findings

- **P1 — Different workflows:** Invoice Reallocation (27), Invoice Deletion (28), Customer Bulk Upload (20b), Directory (1a) and submission settings (11/11b) need structural correction before fine visual tuning.
- **P1 — Missing fields and controls:** Custom aging groups (6b) omit the colour picker and most bucket choices. Bank rows (4) omit Delete; User Setup (9) omits credential-send controls. Submission creation (11a) lacks document search and most choices.
- **P1 — Readability and initial control states:** Several configuration/retention/password headings use dark text on dark purple. Document presets (7b) show an enabled-looking Add Selected with no selection; Strategy creation (25a) presents dependent controls differently.
- **P2 — Forms and layout:** Branch, Group, Customer, Customer Contact and Subclient forms use the wrong widths, field pairing, placeholders or footer labels. Role groups wrap; actions move out of view on wide tables.
- **P2 — Status and sample states:** Bulk histories must model success, rejection and conditional failed downloads accurately. Static sample values are allowed; contradictory chart states and missing visual status variants are not evidence of fidelity.

## 1. Dashboard

Health: **Mismatch**

Same navigation branding and headline metrics; local content starts farther inward and lower; activity chart is narrow rather than full-width. Local nonzero bars/gauge conflict with zero totals. Full reference is internally scrollable; lower sections not included in this pass.

Next: Match dashboard insets and chart width; make zero-value mock charts consistent with the counters.

![Live reference](01-dashboard-reference.jpg)

![Local admin.html](01-dashboard-local-desktop.jpg)

### 1a. Global Directory

Health: **Major mismatch**

Reference opens a centered 900px modal with overlay, close button, one-column contact rows, role badges and A–Z rail. Local opens a small top-right popover, two-column avatar cards, no phone lines or alphabet rail, and no modal backdrop.

![Live reference](01a-directory-reference.jpg)

![Local admin.html](01a-directory-local.jpg)

### 1b. Directory: Add Contact

Health: **Mismatch**

Same ten principal fields plus communication checkbox, but local 720px modal differs from source 800px; checkbox is centered in a half-width box and starts checked while reference is inline and unchecked. Contact-type conditional variants/options unverified.

![Live reference](01b-directory-add-reference.jpg)

![Local admin.html](01b-directory-add-local.jpg)

## 2. Branch Master

Health: **Mismatch**

Base layout close; Create New renamed Create Branch; sorting added to extra columns. Create dialog is 720px vs reference800px with different grid, title and placeholders; adds Status and required City/State/Country/Region instead of grey lookup fields.

Next: Restore Create New and the exact branch field grid, required states, lookups and modal size.

![Live reference](02-branch-master-reference.jpg)

![Local admin.html](02-branch-master-local.jpg)

### 2a. Create Branch

Health: **Mismatch**

Local 720px form differs from reference 800px: GST and addresses span full width, title and placeholders differ, an extra Status field appears, and geographic fields have different required/lookup presentation.

![Live reference](02a-branch-create-reference.jpg)

![Local admin.html](02a-branch-create-local.jpg)

## 3. Holiday Master

Health: **Close base; not exact**

One-line tabs preserved, main columns match. Create New renamed Create Holiday; column widths and badge colours differ. Sample rows omit multi-state +1 badge state present in reference.

Next: Preserve one-line tabs; match modal corners, input heights, badge variants and state selection.

![Live reference](03-holiday-master-reference.jpg)

![Local admin.html](03-holiday-master-local.jpg)

### 3a. Create Holiday

Health: **Close fields; visual mismatch**

Exact field labels/placeholders and two-column arrangement retained. Outer rounding broken locally (square header/footer corners); state input taller, weekly-off checkbox/footer styling differ.

![Live reference](03a-holiday-create-reference.jpg)

![Local admin.html](03a-holiday-create-local.jpg)

### 3b. Holiday state dropdown

Health: **Close visible options**

Visible first six states/codes and searchable dropdown appearance match closely; full list and weekly-off/calendar branches not exercised.

![Live reference](03b-holiday-states-reference.jpg)

![Local admin.html](03b-holiday-states-local.jpg)

## 4. Bank Master

Health: **Mismatch**

Same search/table purpose and single-line tabs. Delete action missing from every local row; Create New renamed Create Bank; actions alignment and header height differ.

Next: Restore row-level Delete presentation and the reference toolbar.

![Live reference](04-bank-master-reference.jpg)

![Local admin.html](04-bank-master-local.jpg)

### 4a. Create Bank

Health: **Close**

Bank Name field/title/placeholder and800px modal align; minor type/button/backdrop differences.

![Live reference](04a-bank-create-reference.jpg)

![Local admin.html](04a-bank-create-local.jpg)

## 5. Internal Company Contact

Health: **Close base; not exact**

Matching columns and edit pattern. Long Create Internal Company Contact replaces Create New; tabs tighter, table positioning/type differ; sample row counts not treated as defect.

Next: Restore Create New and the reference selector affordances and widths.

![Live reference](05-internal-contacts-reference.jpg)

![Local admin.html](05-internal-contacts-local.jpg)

### 5a. Create Internal Company Contact

Health: **Close fields; controls differ**

All visible fields/required markers and grid match. Local gender/department search-icon inputs replace source dropdown chevrons; minor typography/footer spacing differences. Full lookup options unverified.

![Live reference](05a-contact-create-reference.jpg)

![Local admin.html](05a-contact-create-local.jpg)

## 6. Invoice Preferences

Health: **Mismatch**

Tabs and bucket fields present. Select column disproportionately wide locally, pushing bucket name and values to right; selected defaults differ. Custom aging, dispositions and purge policy were also inspected; see secondary states.

Next: Recreate the 19-chip custom group picker, colour field, helper text and table proportions.

![Live reference](06-invoice-preferences-reference.jpg)

![Local admin.html](06-invoice-preferences-local.jpg)

### 6a. Custom aging groups

Health: **Different state**

Reference empty custom-group state, local populated cards; cannot validate populated card fidelity. Create Bucket toolbar occupies separate row locally.

![Live reference](06a-custom-aging-reference.jpg)

![Local admin.html](06a-custom-aging-local.jpg)

### 6b. Create custom aging group

Health: **Major mismatch**

Missing Group Color and consecutive-selection instructions;19 bucket chips replaced with native8-option list. Wrong title/placeholder/Save Group label and dialog dimensions.

![Live reference](06b-create-bucket-reference.jpg)

![Local admin.html](06b-create-bucket-local.jpg)

### 6c. Disposition hierarchy

Health: **Mismatch**

Broad/Primary/Substatus/Colour hierarchy recognizable; source far denser with narrower first columns. Local replaces some sub-status wording/sets; colour controls visually differ.

![Live reference](06c-dispositions-reference.jpg)

![Local admin.html](06c-dispositions-local.jpg)

### 6d. Invoice purge policy

Health: **Mismatch**

Count/Edit/warning preserved. Local narrower/taller card and purple header with unreadable dark title; warning wrapping differs. No edits/saves.

![Live reference](06d-purge-policy-reference.jpg)

![Local admin.html](06d-purge-policy-local.jpg)

## 7. Document Setup

Health: **Mismatch**

Preset/Create/Edit/Delete controls present. Local table has taller rows (~88px vs~65px), different column widths and badge styling; only7 rows fit vs10 reference.

Next: Match row density and modal sizing; disable Add Selected when no preset is selected.

![Live reference](07-document-setup-reference.jpg)

![Local admin.html](07-document-setup-local.jpg)

### 7a. Create Document

Health: **Close fields; visual mismatch**

Four field labels/placeholders and required flags match. Local720px rather than800px modal, different vertical spacing/buttons and native select replacing source category lookup.

![Live reference](07a-document-create-reference.jpg)

![Local admin.html](07a-document-create-local.jpg)

### 7b. Document presets

Health: **Mismatch**

Preset table/category/status closely represented. Local Add Selected appears enabled with nothing selected; source disabled and helper Select documents to add missing. Different max-height/row fit.

![Live reference](07b-document-presets-reference.jpg)

![Local admin.html](07b-document-presets-local.jpg)

## 8. Role and Display Name Setup

Health: **Mismatch**

Role cards/connectors exist. Reference has four horizontal groups; local Customer Roles wraps below support group with purple instead of yellow heading, requiring extra scroll. Confirmed at the matched desktop viewport.

Next: Keep all four role groups in the desktop row and reproduce heading colours.

![Live reference](08-role-display-reference.jpg)

![Local admin.html](08-role-display-local.jpg)

### 8a. Role display-name form

Health: **Close initial state**

Labels/placeholders/helper and disabled controls match; local form28px shorter and native select chevrons differ. Dependent options not fully compared.

![Live reference](08a-role-names-reference.jpg)

![Local admin.html](08a-role-names-local.jpg)

## 9. User Setup

Health: **Mismatch**

Core columns/Edit/Pwd/Suspend/Delete present. Missing Bulk Send Creds and per-row Send Creds; role colour semantics collapsed to green; toolbar and table spacing differ. No live credential send invoked.

Next: Restore credential-send UI as non-operative prototype controls, and distinct role badge colours.

![Live reference](09-user-setup-reference.jpg)

![Local admin.html](09-user-setup-local.jpg)

### 9a. Create User: Step 1

Health: **Close Step1**

Hierarchy note, existing-contact option, six fields and mandatory markers retained. Local shorter dialog, tighter rows/smaller footer buttons. Step2 and role-dependent branches not reached.

![Live reference](09a-user-create-reference.jpg)

![Local admin.html](09a-user-create-local.jpg)

### 9b. User bulk-upload history

Health: **Close base**

Upload history columns, status/count badges and conditional failed icons represented well. Date format, title/button sizing and columns differ. Upload modal not yet checked.

![Live reference](09b-user-bulk-reference.jpg)

![Local admin.html](09b-user-bulk-local.jpg)

## 10. Notification Manager

Health: **Close base; not exact**

Search, four columns, switches and pagination preserved. Slight row density, column widths, switch colour and footer/background differences. Live switches deliberately not toggled because may save immediately.

Next: Match widths, density and switch styling without triggering live switches.

![Live reference](10-notification-manager-reference.jpg)

![Local admin.html](10-notification-manager-local.jpg)

## 11. Invoice Submission process

Health: **Major mismatch**

Reference default Strategy Manager shows a two-row strategy list with Create New. Local injects Push Settings/Email Settings on this tab, pushing list below viewport; Add Strategy replaces Create New. Dark text on purple settings headings creates obvious contrast risk.

Next: Remove settings from the default strategy list; match both the strategy form and Push Email tab.

![Live reference](11-submission-process-reference.jpg)

![Local admin.html](11-submission-process-local.jpg)

### 11a. Create submission strategy

Health: **Major mismatch**

Source has an 800px Add Strategy form, full-width Strategy Type, helper text, Agent Selection switch, searchable 16-document checkbox list, and Create Strategy. Local uses a compact 720px form, plain checkbox, five document options, no document search or explanatory text, and Save.

![Live reference](11a-submission-create-reference.jpg)

![Local admin.html](11a-submission-create-local.jpg)

### 11b. Push Email Settings

Health: **Major mismatch**

Source stacks Email Configuration and Include Contacts cards, uses three switches and a left Submit button. Local compresses these into a two-column fieldset with checkboxes, purple heading bar, and right Save Changes; select placeholder/default differs.

![Live reference](11b-push-settings-reference.jpg)

![Local admin.html](11b-push-settings-local.jpg)

## 12. Module Configuration

Health: **Major mismatch**

Seven tabs present; default panel fields represented. Local adds large purple title bars with dark text, oversized cards/full-width TDS field and left Edit button rather than source compact white cards/right Edit. GRN pushed below fold. Contrast risk on dark purple headings.

Next: Match each of the seven tabs individually; restore switches, summaries, helper copy and readable headings.

![Live reference](12-module-configuration-reference.jpg)

![Local admin.html](12-module-configuration-local.jpg)

### 12a. Visit Module

Health: **Major mismatch**

Missing the two current-time summary panels. Local replaces Yes/No radio group with select, changes four-column fields to two columns, adds purple heading and description, and loses required-marker parity.

![Live reference](12a-visit-config-reference.jpg)

![Local admin.html](12a-visit-config-local.jpg)

### 12b. Monthend: manual initial state

Health: **Mismatch**

Manual mode content and radio choices are largely present. Local loses the client pill, adds spacing and height, and pushes ODM Report Email below the viewport. Automatic schedule and lower recipient controls are not covered.

![Live reference](12b-monthend-config-reference.jpg)

![Local admin.html](12b-monthend-config-local.jpg)

### 12c. Client Confirmation history

Health: **Major mismatch**

One plain local status row omits the yellow completed/validation-failure variants, green/red counts and conditional download icons. Added purple heading and compressed content. Sample values are not treated as data-sync errors.

![Live reference](12c-client-confirmation-config-reference.jpg)

![Local admin.html](12c-client-confirmation-config-local.jpg)

### 12d. PDC Configuration

Health: **Mismatch**

Local substitutes checkbox for switch, omits auto-clear/helper guidance, adds Save Changes in read-only state, uses plain Active text instead of badge and Remove text instead of trash icon. Enlarged stacked cards and purple heading bars differ substantially.

![Live reference](12d-pdc-config-reference.jpg)

![Local admin.html](12d-pdc-config-local.jpg)

### 12e. Escalation Matrix lists

Health: **Mismatch**

Both process/matrix lists and actions exist. Local moves search to separate rows, loses explanatory copy and destructive red Delete styling, changes Process to Name, and greatly enlarges cards with dark-on-purple headings. Create/View/Edit branches remain unverified.

![Live reference](12e-escalation-config-reference.jpg)

![Local admin.html](12e-escalation-config-local.jpg)

### 12f. Issue Tracker Configuration

Health: **Mismatch**

Switch replaced by checkbox; helper copy, card layout and Save alignment differ. Local heading computed colour rgb(31,41,55) on rgb(92,37,141), 19px/700; visually hard to read. No switch changes saved.

![Live reference](12f-issue-tracker-config-reference.jpg)

![Local admin.html](12f-issue-tracker-config-local.jpg)

## 13. Portfolio Transfer

Health: **Mismatch**

Correct8columns/upload action. Validation failures green instead of red; Failed shown on every row including zero rejects; progress lacks Complete100% label and uses purple; company format and subtitle differ.

Next: Match conditional Failed visibility, status colours, count colours and labelled progress.

![Live reference](13-portfolio-transfer-reference.jpg)

![Local admin.html](13-portfolio-transfer-local.jpg)

### 13a. Portfolio upload dialog

Health: **Close, with differences**

Matching 600px dialog, file formats, drop zone, template download and footer actions. Local is shorter, has different spacing, template button treatment and footer button sizes. No file selection/upload performed; other upload variants are not inferred from this one.

![Live reference](13a-portfolio-upload-reference.jpg)

![Local admin.html](13a-portfolio-upload-local.jpg)

## 14. Bulk Document Upload

Health: **Mismatch**

Document type/file controls and Limbo action exist. Reference yellow guidance banner missing; one-row toolbar split across three rows locally; larger table text, no shown sorting controls, no pagination in local one-row sample.

Next: Restore the warning banner and single-row upload toolbar.

![Live reference](14-bulk-document-upload-reference.jpg)

![Local admin.html](14-bulk-document-upload-local.jpg)

## 15. GRN Upload

Health: **Mismatch**

Columns match. Same failure badge/Failed-on-success/progress-label defects as Portfolio Transfer; custom subtitle not source copy.

Next: Match GRN-specific statuses, count colours, progress labels and conditional downloads.

![Live reference](15-grn-upload-reference.jpg)

![Local admin.html](15-grn-upload-local.jpg)

## 16. CN/Advance Upload

Health: **Mismatch**

Correct columns but wrong widths/status variants; Failed displayed for zero rejects, unlabelled purple progress instead of green Complete100%; red rejection counts absent.

Next: Match CN/Advance widths, statuses, rejection counts and conditional downloads.

![Live reference](16-cn-advance-upload-reference.jpg)

![Local admin.html](16-cn-advance-upload-local.jpg)

## 17. Payment Receipt Upload

Health: **Mismatch**

Same shell and columns; failure status green, rejection counts uncoloured, progress unlabeled/purple and failure action styling wrong. Sample number of rows not itself a defect.

Next: Restore Payment Receipt failure styling and progress presentation.

![Live reference](17-payment-receipt-upload-reference.jpg)

![Local admin.html](17-payment-receipt-upload-local.jpg)

## 18. Customer Portfolio Transfer

Health: **Mismatch**

Column set and subtitle preserved. Source itself uses green validation-failure badges; not counted as parity defect on this page. Local still shows Failed on all successes, loses red/green count styling and Complete100% progress label.

Next: Match this page’s own reference status colours, conditional downloads and labelled progress.

![Live reference](18-customer-portfolio-transfer-reference.jpg)

![Local admin.html](18-customer-portfolio-transfer-local.jpg)

## 19. Group Master

Health: **Close base; not exact**

Four tabs and table/Edit/Delete present. Create New renamed Add New Group; smaller action buttons and different header/border treatment; subtitle altered.

Next: Use the source 500px single-column Group form and Save Group label.

![Live reference](19-group-master-reference.jpg)

![Local admin.html](19-group-master-local.jpg)

### 19a. Create Group

Health: **Mismatch**

Same three fields, but source is a 500px single-column modal with full-width description and Save Group. Local is 720px, two columns, half-width description, and Save.

![Live reference](19a-group-create-reference.jpg)

![Local admin.html](19a-group-create-local.jpg)

## 20. Customer Master

Health: **Mismatch**

Tabs/search/create/table present. Reference Actions is first and Edit always visible; local starts with Customer Code so edit affordance not visible without horizontal scroll. Columns compressed, subtitle and search ellipsis differ. Full offscreen columns pending.

Next: Keep Actions first; reproduce the two-column customer form and customer upload schema.

![Live reference](20-customer-master-reference.jpg)

![Local admin.html](20-customer-master-local.jpg)

### 20a. Create Customer

Health: **Major mismatch**

Source is an 850px two-column scrollable form; local is 900px three columns. Enter placeholders become field-specific text, selector affordances differ, and source header/footer spacing and scroll treatment are not matched. Source lower fields/options not fully inspected.

![Live reference](20a-customer-create-reference.jpg)

![Local admin.html](20a-customer-create-local.jpg)

### 20b. Customer Bulk Upload

Health: **Major mismatch**

Wrong table schema: Count and File Name are replaced by Company and Progress, Status is relocated, and failed-file download icons are missing for rejected rows. Upload File becomes Bulk Upload. This is a linked page, beyond the 33 menu landing pages.

![Live reference](20b-customer-bulk-reference.jpg)

![Local admin.html](20b-customer-bulk-local.jpg)

## 21. Customer Contacts

Health: **Mismatch**

Reference Name/Email/Phone/Customer/Actions versus local Customer/Name/Email/Department/Phone Number/Actions. Extra search, renamed Add New Contact, wrong order and extra Department column.

Next: Restore the five-column contact table and full-width Customer lookup in its form.

![Live reference](21-customer-contacts-reference.jpg)

![Local admin.html](21-customer-contacts-local.jpg)

### 21a. Create Customer Contact

Health: **Mismatch**

Nine fields present, but Customer should span full width; all following field pairings shift. Local is 720px instead of 800px and Save replaces Save Contact. Dropdown option inventories remain unverified.

![Live reference](21a-customer-contact-create-reference.jpg)

![Local admin.html](21a-customer-contact-create-local.jpg)

## 22. Template Master

Health: **Major mismatch**

Tabs present but reference begins Actions/Edit; local moves actions to clipped far right, adds Status and Preview, and omits the Description column. Schedule exists in both. Reference includes WhatsApp and long token-bearing subjects; local samples do not demonstrate those states.

Next: Restore Actions first and Description; remove extra Status/actions unless the reference supports them. Resolve reference editor access before matching it.

![Live reference](22-template-master-reference.jpg)

![Local admin.html](22-template-master-local.jpg)

### 22a. Template Edit attempt

Health: **Blocked comparison**

The first live Edit action returned “Failed to initiate edit”. Local first Edit left the table visible in the captured state. Editor-field parity cannot be assessed from this attempt; do not copy the reference error as the intended editor design.

![Live reference](22a-template-edit-reference.jpg)

![Local admin.html](22a-template-edit-local.jpg)

## 23. Email Sender SMTP Setup

Health: **Mismatch**

Two account categories and masked fields preserved. Missing full setup guidance, integration document link, client heading and reveal-eye affordances; added pagination/sorting. Credential-bearing edits/reveals excluded intentionally.

Next: Restore guidance, integration link and masked-field controls; inspect credential-bearing states only under an appropriate safe workflow.

![Live reference](23-smtp-setup-reference.jpg)

![Local admin.html](23-smtp-setup-local.jpg)

## 24. Email Sender Account Setup

Health: **Mismatch**

Two account rows/Edit available. Missing purpose guidance and client badge; extra Sender Account Type column, sorting and pagination not in reference.

Next: Restore introductory guidance, client badge and the reference account columns.

![Live reference](24-sender-account-reference.jpg)

![Local admin.html](24-sender-account-local.jpg)

## 25. Strategy Manager

Health: **Major mismatch**

Strategy columns/filters/action types exist. Different hero/card style, blue CTA, no visible strategy count; equal-width columns narrow name and wrap actions, rows~95px vs~57px. Source10 rows visible vs local6.

Next: Match list density and creation hierarchy, required markers and dependent disabled states.

![Live reference](25-strategy-manager-reference.jpg)

![Local admin.html](25-strategy-manager-local.jpg)

### 25a. Create Strategy: initial state

Health: **Major mismatch**

Local adds top Back/Cancel controls, changes purple actions to blue and Running to Active, omits template trash and several required markers, enables Notification Mode before template selection, and places Schedule beside Notification Settings instead of the full-width initial prompt. Dependent target/template/schedule branches not verified.

![Live reference](25a-strategy-create-reference.jpg)

![Local admin.html](25a-strategy-create-local.jpg)

## 26. Invoice Upload

Health: **Mismatch**

Create and Bulk Upload present. Create uses primary instead of outline styling; reference download icons replaced by buttons; unlabelled purple progress and Failed-on-success repeat. Table typography/density differ.

Next: Match upload history and button styles; preserve the close invoice form and verify lookup/date branches.

![Live reference](26-invoice-upload-reference.jpg)

![Local admin.html](26-invoice-upload-local.jpg)

### 26a. Create Invoice

Health: **Close, with differences**

24 visible fields, three-column grid, labels, placeholders and Save Invoice align closely. Missing search icons on disabled assignment fields, native date formatting/icons, spacing and button dimensions differ. Lookup results, date-picker states and validations not tested.

![Live reference](26a-invoice-create-reference.jpg)

![Local admin.html](26a-invoice-create-local.jpg)

## 27. Invoice reallocation

Health: **Major mismatch**

Source uses searchable invoice table with Client Code/KAM/KAS and per-row Reallocate. Replica substitutes bulk-role/assignee/reason form, extra filters, Select/View Invoice actions; omits Client Code/KAM/KAS columns. This is a different workflow, with low-contrast heading.

Next: Replace the substituted bulk workflow with the reference search and per-row reallocation UI, using sample-only actions.

![Live reference](27-invoice-reallocation-reference.jpg)

![Local admin.html](27-invoice-reallocation-local.jpg)

## 28. Invoice Deletion

Health: **Major mismatch**

Source initial state only search, no records shown before query. Local instead opens bulk deletion reason/details form plus filters and seeded records. Workflow/empty state differ. No deletion clicked.

Next: Match the initial search-only deletion state before implementing mock search/result/confirmation states.

![Live reference](28-invoice-deletion-reference.jpg)

![Local admin.html](28-invoice-deletion-local.jpg)

## 29. Change Password - Admin

Health: **Mismatch**

Select-user initial task preserved. Reference centered narrow card; local full-width nested cards, added Change Password tab and low-contrast purple heading; subtitle differs. No passwords entered.

Next: Restore the compact centered password-selection card and remove extra tab/banner.

![Live reference](29-change-password-reference.jpg)

![Local admin.html](29-change-password-local.jpg)

## 30. Client Master

Health: **Major mismatch**

Client details and subclient table present. Adds Client Accounts/Text Setup tabs, moves actions below, shrinks logo and omits its edit affordance, loses renewal/status chips, adds empty purple bar and duplicate empty-state copy. Low-contrast Sub Clients heading.

Next: Restore logo-edit affordance, renewal/status chips and source subclient layout.

![Live reference](30-client-master-reference.jpg)

![Local admin.html](30-client-master-local.jpg)

### 30a. Create Subclient

Health: **Mismatch**

Source is 600px single-column; local is 720px two-column, with smaller footer buttons. The same three labels/placeholders exist. Local keyboard spot check passed: initial focus on close, Shift+Tab stayed inside modal, Escape closed it and restored focus to Create Sub Client.

![Live reference](30a-subclient-create-reference.jpg)

![Local admin.html](30a-subclient-create-local.jpg)

## 31. Audit Retention & Purge

Health: **Major mismatch**

Primary policy inputs/checks exist. Local adds tab/purple banners and inflated full-width form; source compact retention, override, run-purge cards all fit first viewport. Missing per-field explanatory copy and last-purge timestamp/reason. No purge/save run.

Next: Restore the compact policy/override/purge cards, explanatory text and last-purge details.

![Live reference](31-audit-retention-reference.jpg)

![Local admin.html](31-audit-retention-local.jpg)

## 32. Audit Trail

Health: **Mismatch**

Six filters and data columns exist. Local adds redundant Audit Trail tab, moves Search/Export and adds duplicate No records found plus instruction outside table; table text larger, card much taller.

Next: Remove duplicate empty-state copy and match the filter/action/table layout.

![Live reference](32-audit-trail-reference.jpg)

![Local admin.html](32-audit-trail-local.jpg)

## 33. Help & Support

Health: **Close base; not exact**

Hero/search/chips/FAQ/category content and tabs closely recreated. Reference hero inset24px; local edge-to-edge. Source6 category cards per row vs local7, different outer padding and card proportions.

Next: Match hero inset and six-column category layout; remove the extra ticket attachment block.

![Live reference](33-help-support-reference.jpg)

![Local admin.html](33-help-support-local.jpg)

### 33a. Create Support Ticket

Health: **Mismatch**

Same category and priority options, subject/description fields. Local adds Attachment block absent from source and longer description placeholder, different header/close/footer styling.

![Live reference](33a-create-ticket-reference.jpg)

![Local admin.html](33a-create-ticket-local.jpg)

### 33b. Feedback form

Health: **Close visible portion**

Visible feedback rating, type, module, subject and body fields closely match; same24px layout offset. Footer/options not fully tested.

![Live reference](33b-feedback-reference.jpg)

![Local admin.html](33b-feedback-local.jpg)

## Limits and unverified states

- This is a complete pass over the 33 currently exposed Admin landing pages, not proof that every reachable state or responsive width matches. The 35 secondary entries below include one blocked editor attempt and one non-equivalent empty/populated state.
- No live Save, Upload, Delete, credential send, purge, password entry, account change or file submission was performed. This was design-only observation; application source files were not edited.
- Not verified: notification/profile dropdowns; dashboard lower sections and drilldowns; every edit/delete confirmation; holiday calendar/week-off branches and full state list; role-dependent User Step 2; complete lookup inventories; all upload-modal variants and file-selected/error states; Bulk Document Limbo; customer lower form fields and dependent selections; strategy target/template/schedule branches; escalation process/matrix forms; PDC user assignment; retention dry-run/purge confirmations; password-selected states; support article/ticket-detail journeys.
- Template Master’s first Edit attempt failed in the live reference with “Failed to initiate edit”. Editor parity is blocked; the failure is not an intended design to copy. Credential-bearing SMTP/account edits and reveal controls were intentionally not opened.
- Live and local sample records differ. Exact names, dates, totals or row counts were not treated as synchronization bugs. Differences in schema, available states, conditionally visible actions and row density were assessed.
- Screenshots used matched 1440 × 1000 CSS viewports. Source images were visibly softer than local captures; do not infer pixel-perfect font or anti-aliasing differences from that softness. Modal widths and row sizes in notes are approximate visual measurements.
- Accessibility was a limited visual/DOM/keyboard spot-check, not a screen-reader, zoom, mobile, reduced-motion or full WCAG assessment. On the local subclient dialog, the title relationship and aria-modal were present, opening focused Close, reverse Tab remained inside, Escape closed it and focus returned. This does not certify every dialog.
- Artifacts contain the visible test-tenant data captured during this audit. Keep them local unless sharing is approved. The report references only accepted screenshots from this run; earlier rejected/unaligned captures are excluded.

## Acceptance gate for a later correction pass

For each page: match the default layout; inventory every tab, popup, field, placeholder, option and required/disabled state; implement sample-only interactions; capture matched viewport/state pairs; verify keyboard behavior; mark unobservable branches as blocked rather than passed.

Evidence: capture-manifest.json records source/local URLs and notes. evidence-integrity.json records dimensions and SHA-256 hashes for the 136 accepted screenshots.
