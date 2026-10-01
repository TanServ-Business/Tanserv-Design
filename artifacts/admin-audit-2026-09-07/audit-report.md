# TestClient vs Tanserv Admin — UI audit

2026-09-07

**Not an exact match; not ready for UI-parity sign-off.** All 33 Admin destinations have evidence; 103 paired states / 206 screenshots. No application files were changed.

[Open screenshot gallery](index.html)

## What is working

All Admin destinations are represented. The first Module Configuration tab and its editor are close; Holiday/Bank field inventories, Invoice Create and the observed Help article are comparatively strong. These are scoped observations, not full-module passes.

## Highest-impact findings

- **P1 · Missing or wrong interactions:** 22b Template editor, 09b existing-contact picker, 27/27a Reallocation, 28/28a Deletion and 00a Directory do not reproduce their reference workflows. Restore the same visual entry points, forms and transitions using sample-only states.
- **P1 · Missing fields and states:** 06b/06d bucket/sub-status editors and 12b–12p nested Configuration screens omit controls, summaries, helpers or wizard paths. Match field inventory, labels, required markers, defaults, conditional visibility and disabled states before styling polish.
- **P1 · Premature enabled controls:** 07a Add Selected, 12f/26b Upload, 12l Sub Status and 24a OTP Update do not preserve reference prerequisites. Simulate prerequisites without enabling real server writes.
- **P1 · Readability and sample integrity:** Dark text on purple panels affects several configuration, deletion, password and audit screens. Dashboard/notification sample states contradict their totals. Restore readable panel treatment, then validate actual contrast; make sample data internally consistent.
- **P1/P2 · Tables and composition:** Customer bulk/contact/template tables change schemas; action columns disappear beyond horizontal scroll. Strategy Manager and Client Master differ substantially. Match column inventory/order, action placement, density and reference container structure.
- **P2 · Shared visual drift:** Office Setup margins, header weights, modal widths/columns, button hierarchy, label casing, backdrop blur and pagination differ repeatedly. Standardize shared tokens/components, then re-capture each affected module at matched breakpoints.

## Module-by-module coverage and next step

| # | Module | Observed screens | Health | Recommended next step |
|---|---|---|---|---|
| 1 | Dashboard | Landing and lower analytics | State gaps | Make chart values agree with totals; restore reference chart series, hour range and feed/session labels. |
| 2 | Branch Master | List and create form | Form gaps | Align required markers and location controls after confirming whether those values are derived; match Create New and list spacing. |
| 3 | Holiday Master | List, create form and state picker | Minor drift | Retain matching field inventory and one-line headers; align dialog corners, backdrop, labels and table spacing. |
| 4 | Bank Master | List and create form | Minor drift | Retain matching field/title/placeholder; match toolbar label, tab underline and button weight. |
| 5 | Internal Company Contact | List and create form | Layout drift | Use reference Create New label and reference form column layout at the tested width. |
| 6 | Invoice Preferences | Aging, custom bucket, dispositions, sub-status and purge policy | Major gaps | Restore complete bucket/color/grid editor, primary status groups and inline Code/Display Value/Color editing. |
| 7 | Document Setup | List, presets and create form | State gaps | Disable Add Selected when nothing is selected; restore helper footer and prevent status clipping. |
| 8 | Role and Display Name Setup | Hierarchy and display-name editor | Overflow | Wrap the hierarchy at constrained widths so Support and View remain reachable without page overflow. |
| 9 | User Setup | List, create step 1, existing-contact selection and bulk history | Missing interaction | Restore existing-contact picker and Send Creds visual action; verify step 2 separately without sending credentials. |
| 10 | Notification Manager | WhatsApp list and control semantics | Minor drift | Match shared table layout and give search/switch controls meaningful accessible names. |
| 11 | Invoice Submission process | Strategy list, create and Push/Email settings | Major gaps | Separate strategy and Push/Email views; restore full searchable document choices and switch controls. |
| 12 | Module Configuration | Configurations, Visit, Month-End, Client Confirmation, PDC, Escalation and Issue Tracker | Mixed; nested gaps | Keep the close Configurations first tab; restore missing current-value summaries, native reference control patterns, wizard fields and disabled states on other tabs. |
| 13 | Portfolio Transfer | Upload history and dialog | State gaps | Show progress and row-appropriate failure actions; distinguish failure status; align upload footer. |
| 14 | Bulk Document Upload | Upload and Limbo | Guidance gaps | Restore upload guidance, document choices and table pagination; inspect Limbo edit in a follow-up. |
| 15 | GRN Upload | Upload history and dialog | State gaps | Restore progress text and row-specific download states; align modal width and inline footer. |
| 16 | CN/Advance Upload | Upload history and dialog | State gaps | Restore progress text and row-specific download states; do not copy the reference green failure-badge inconsistency. |
| 17 | Payment Receipt Upload | Upload history and dialog | State gaps | Restore progress text and row-specific download states; align modal width and inline footer. |
| 18 | Customer Portfolio Transfer | Transfer history and dialog | State gaps | Restore progress and conditional actions; align required-column guidance and upload footer. |
| 19 | Group Master | List and create form | Layout drift | Remove needless two-column table overflow; match create-dialog width and Save Group label. |
| 20 | Customer Master | List, create and bulk history | Table gaps | Restore first-column Edit action and bulk Count/File Name schema; preserve failed-file download state. |
| 21 | Customer Contacts | List and create form | Schema mismatch | Match Name/Email/Phone/Customer/Actions column order and create-form label treatment. |
| 22 | Template Master | List, failed edit attempt and working reference editor | Editor missing | Implement the full clickable editor with sample fields and preview; remove unsupported extra row actions. |
| 23 | Email Sender SMTP Setup | Account list and sanitized edit form | Visual drift; reference risk | Match provider tiles and account explanations; mask credentials rather than copying the reference exposure. |
| 24 | Email Sender Account Setup | Account list and OTP-stage form | State gating gaps | Keep Update disabled until the simulated OTP prerequisite; match OTP timing and footer controls. |
| 25 | Strategy Manager | List, builder, template selection and sender selection | Major drift | Match list composition and builder rows, required markers and sender cards; confirm default selections. |
| 26 | Invoice Upload | History, create invoice and bulk dialog | State/layout gaps | Keep close create-form inventory; fix table overflow and enforce file-selection disabled state. |
| 27 | Invoice reallocation | List and reference reassignment dialog | Wrong workflow | Replace invented bulk workflow with the reference per-invoice reassignment dialog and ownership columns. |
| 28 | Invoice Deletion | Initial state and searched invoice | Wrong workflow | Match search-first flow, reference result columns and row checkbox; do not implement destructive persistence. |
| 29 | Change Password - Admin | Initial and selected-user password fields | Layout/readability | Use reference compact card and user picker; restore readable heading and footer separator. |
| 30 | Client Master | Account card and create sub-client | Missing details | Restore logo-edit affordance and renewal badge; remove unsupported tabs and empty purple heading. |
| 31 | Audit Retention & Purge | Settings and lower purge/history controls | Warning/readability gaps | Restore permanent-deletion warning, readable headers, last-purge context and danger-button hierarchy. |
| 32 | Audit Trail | Filters, entity picker, results and revision detail | Dropdown/detail gaps | Prevent picker clipping and focus search on open; restore revision hierarchy, status and old/new distinction. |
| 33 | Help & Support | Landing, one article, create ticket, My Tickets and Feedback | Mostly close | Retain matching article/content structure; align gutters, category grid, modal header/close/footer and ticket counters. |

## Accessibility risks

Visible low-contrast panel headings, clipped menus/role charts, weak disabled-control styling, icon-only/unnamed controls and missing dialog/expanded semantics require follow-up. These findings come from screenshots and targeted DOM observations; no WCAG compliance claim is made. Verify contrast numerically, keyboard access, focus entry/return/trapping, Escape behavior and screen-reader names before sign-off.

## Reference-side issues

SMTP Edit exposes credential fields as text. The shared screenshot was re-captured with unsaved redaction text, then abandoned; no source credentials are included in this deliverable. Mask these fields and review credential exposure/rotation with the security owner. The reference also has narrow-width clipping, awkward badge wrapping, inconsistent green failure badges, an empty-state count anomaly and one failed template edit. These are reference defects/risks, not requirements to copy.

## Evidence and limits

- All 33 Admin navigation destinations were opened. The 103 paired states include landing pages, forms, selected tabs, dropdowns, wizards and safe error/empty states; they do not exhaust every conditional screen.
- No Save, Upload, Delete, purge, credential sending, OTP/email sending, password update, ticket submission or feedback submission was executed. Unsaved selections were discarded. Backend functionality and persistence are outside this design-only audit.
- User Setup step 2/edit/reset, bulk-user dialog, Limbo edit, customer edit/bulk dialog, alternate SMTP provider fields, deletion confirmation, uploaded-file results and every conditional Strategy path remain unverified.
- The source had no tickets or sub-clients, so ticket conversations and linked sub-client detail could not be compared. One Template Edit record errored; a later record opened successfully and is included. Only one Help article body was compared, not the other 99.
- Live and mock record contents/counts were not treated as visual failures. Internal contradictions (e.g. badge count versus empty panel, non-zero charts versus zero totals) were reported separately.
- Matched pair viewports were 746×1120 or 1112×1120 CSS pixels, not a single desktop breakpoint. Screenshot-provider scaling and different scroll offsets are noted; this is not pixel-diff scoring. Mobile, 1440px+, 200% zoom, full keyboard/focus trapping, screen-reader behavior and measured WCAG contrast remain untested.
- The requested one-line local tabs/headers are intentional and are not flagged simply for differing from reference wrapping. Reference clipping, awkward badges, green failure statuses, empty-state count anomalies and credential exposure should not be copied blindly.
- URLs identify module landing routes, not guaranteed deep-state URLs. Per-capture DOM and original viewport records were not retained; encoded image dimensions and hashes are verified directly from saved files.
- Contains tenant-visible names, contact details and account information; share only with authorized reviewers. SMTP credential fields in the distributed capture contain unsaved redaction text; nothing was saved to the source portal.

## Business decisions to confirm

- Should Strategy aging defaults (2 versus 19 selected) and Directory email-communication consent mirror the reference? These affect behavior and should not be silently chosen.
- Should upload hints allow CSV, or only the reference XLSX/XLS formats? The audit flags the displayed contract, not backend file support.
- Should the SMTP integration guide remain removed under the earlier remove-tutorials request? Its absence is a decision point, not an automatic defect.

## Acceptance checklist for the repair pass

1. Match navigation entry points and field/column inventories before cosmetic changes.
2. Verify empty, populated, selected, disabled, dropdown-open and modal-open sample states with no persistence.
3. Match typography, margins, widths, labels, icons, placeholders and button hierarchy.
4. Re-capture at 746px, 1112px and a agreed desktop width; add mobile/zoom/focus checks separately.
5. Close each finding against paired screenshots, retaining explicit decisions for intentional deviations.

## Numbered screenshot evidence

### 1. Navigation — Significant gap

Evidence: 00-navigation. P1/P2: Notification Manager is top-level in reference but nested under Operational Setup locally. Sidebar width ~300 vs 280 CSS px, header/menu spacing and font sizes differ; footer not pinned to bottom locally; blur absent. All destination labels/routes otherwise present.

TestClient

![TestClient Navigation](00-navigation-testclient.jpg)

Tanserv

![Tanserv Navigation](00-navigation-tanserv.jpg)

### 2. Directory — Significant gap

Evidence: 00a-directory. P1: Reference large centered modal with close, A–Z rail and single-column contact rows is replaced by small header popover/two-column cards. Missing phone/customer details and alphabet navigation, no visible close control. Sample names not compared.

TestClient

![TestClient Directory](00a-directory-testclient.jpg)

Tanserv

![Tanserv Directory](00a-directory-tanserv.jpg)

### 3. Directory Add — Significant gap

Evidence: 00b-directory-add. P1/P2: Use Email for Communication starts checked locally vs unchecked reference; wrong checkbox card layout. Core field inventory exists; local uses native dropdowns, smaller dialog, title-case labels and denser spacing.

TestClient

![TestClient Directory Add](00b-directory-add-testclient.jpg)

Tanserv

![Tanserv Directory Add](00b-directory-add-tanserv.jpg)

### 4. Notifications — Significant gap

Evidence: 00c-notifications. P1: local notification badge shows 2 while the open panel says No notifications yet; its sample state is internally inconsistent. Reference shows two timestamped cards. P2: panel width and heading treatment differ. Different notification text is not a defect. At this wider viewport the local hour chart also stops well before the available card width.

TestClient

![TestClient Notifications](00c-notifications-testclient.jpg)

Tanserv

![Tanserv Notifications](00c-notifications-tanserv.jpg)

### 5. Dashboard — Close / minor drift

Evidence: 01-dashboard. Close first-viewport hierarchy; live/sample counts intentionally differ. Lower-chart and sample-state findings are documented in 01a and 00c.

TestClient

![TestClient Dashboard](01-dashboard-testclient.jpg)

Tanserv

![Tanserv Dashboard](01-dashboard-tanserv.jpg)

### 6. Dashboard Lower — Significant gap

Evidence: 01a-dashboard-lower. P2: Local trend adds Customers series/summary instead of reference Today summary; Live Sessions renamed Sessions; Daily Activity Feed Live badge replaced Today; session headers lack sort affordances. Current local empty session data prevents populated-row visual comparison; reference has four rows. P1: Local charts show non-zero activity/session bars while adjacent totals and durations read zero, so sample states are internally inconsistent. Hour chart stops at 6 PM instead of 24 hours; local colored area fills differ from reference.

TestClient

![TestClient Dashboard Lower](01a-dashboard-lower-testclient.jpg)

Tanserv

![Tanserv Dashboard Lower](01a-dashboard-lower-tanserv.jpg)

### 7. Branch Master — Visual drift

Evidence: 02-branch-master. P2: local outer padding 16px vs reference48px; Create Branch vs Create New; table proportions and header styling differ. Single-line local tabs intentional.

TestClient

![TestClient Branch Master](02-branch-master-testclient.jpg)

Tanserv

![Tanserv Branch Master](02-branch-master-tanserv.jpg)

### 8. Branch Create — Significant gap

Evidence: 02a-branch-create. P1: required-marker and control-type mismatch in City/State/Country/Region; the reference location fields look derived while the local form presents editable controls. Actual derivation/read-only behavior was not tested. P2: placeholders, title, label casing and spacing differ.

TestClient

![TestClient Branch Create](02a-branch-create-testclient.jpg)

Tanserv

![Tanserv Branch Create](02a-branch-create-tanserv.jpg)

### 9. Holiday Master — Visual drift

Evidence: 03-holiday-master. P2: shared Office Setup padding/header-color/action-label drift; matching four-column table. Sample counts excluded.

TestClient

![TestClient Holiday Master](03-holiday-master-testclient.jpg)

Tanserv

![Tanserv Holiday Master](03-holiday-master-tanserv.jpg)

### 10. Holiday Create — Visual drift

Evidence: 03a-holiday-create. P2: correct four-field structure and placeholders; local loses rounded dialog corners, differs label weight, background blur, checkbox size and button styling.

TestClient

![TestClient Holiday Create](03a-holiday-create-testclient.jpg)

Tanserv

![Tanserv Holiday Create](03a-holiday-create-tanserv.jpg)

### 11. Holiday States — Close / minor drift

Evidence: 03b-holiday-states. Close: searchable dropdown shows corresponding state names/codes and scroll; subtle weight/spacing mismatch.

TestClient

![TestClient Holiday States](03b-holiday-states-testclient.jpg)

Tanserv

![Tanserv Holiday States](03b-holiday-states-tanserv.jpg)

### 12. Bank Master — Visual drift

Evidence: 04-bank-master. P2: shared Office Setup spacing and Create Bank label differ; local tab underline touches text at this width; source itself clips toolbar/action column. Local search moves below tabs.

TestClient

![TestClient Bank Master](04-bank-master-testclient.jpg)

Tanserv

![Tanserv Bank Master](04-bank-master-tanserv.jpg)

### 13. Bank Create — Close / minor drift

Evidence: 04a-bank-create. Close field, title and placeholder match; P3 local placeholder bold, gradient Save and backdrop blur differ.

TestClient

![TestClient Bank Create](04a-bank-create-testclient.jpg)

Tanserv

![Tanserv Bank Create](04a-bank-create-tanserv.jpg)

### 14. Internal Contacts — Visual drift

Evidence: 05-internal-contacts. P2 shared Office Setup spacing; long Create Internal Company Contact replaces Create New and pushes toolbar to second row; active tab underline overlaps text.

TestClient

![TestClient Internal Contacts](05-internal-contacts-testclient.jpg)

Tanserv

![Tanserv Internal Contacts](05-internal-contacts-tanserv.jpg)

### 15. Contact Create — Visual drift

Evidence: 05a-contact-create. P2: fields/placeholders largely match but local uses two columns where reference stacks one column at746px, reducing form height by375px; gender/department affordances differ.

TestClient

![TestClient Contact Create](05a-contact-create-testclient.jpg)

Tanserv

![Tanserv Contact Create](05a-contact-create-tanserv.jpg)

### 16. Invoice Preferences — Visual drift

Evidence: 06-invoice-preferences. P2: matching aging bucket structure but table proportions/header color/outer margins drift. Saved checkbox selection is data-dependent.

TestClient

![TestClient Invoice Preferences](06-invoice-preferences-testclient.jpg)

Tanserv

![Tanserv Invoice Preferences](06-invoice-preferences-tanserv.jpg)

### 17. Custom Aging — State unverified

Evidence: 06a-custom-aging. State mismatch: source empty, local sample cards. Must add empty-state preview; cannot establish populated-card parity from this source state.

TestClient

![TestClient Custom Aging](06a-custom-aging-testclient.jpg)

Tanserv

![Tanserv Custom Aging](06a-custom-aging-tanserv.jpg)

### 18. Create Bucket — Significant gap

Evidence: 06b-create-bucket. P1: missing Group Color control, missing consecutive-selection grid and buckets beyond151–180; wrong title, placeholder and Save Group label.

TestClient

![TestClient Create Bucket](06b-create-bucket-testclient.jpg)

Tanserv

![Tanserv Create Bucket](06b-create-bucket-tanserv.jpg)

### 19. Dispositions — Significant gap

Evidence: 06c-dispositions. P1: local hierarchy omits multiple reference primary-status groups (Red Flag, Further Action, Material/Service issues) from DOM; row height/grid styling and Add Sub Status sizing differ.

TestClient

![TestClient Dispositions](06c-dispositions-testclient.jpg)

Tanserv

![Tanserv Dispositions](06c-dispositions-tanserv.jpg)

### 20. Substatus — Significant gap

Evidence: 06d-substatus. P1: reference inline editor Display Value, Code, Color replaced by modal Sub Status, Color; Code missing and interaction pattern wrong.

TestClient

![TestClient Substatus](06d-substatus-testclient.jpg)

Tanserv

![Tanserv Substatus](06d-substatus-tanserv.jpg)

### 21. Purge Policy — Significant gap

Evidence: 06e-purge-policy. P1: local purple panel header renders dark purple title almost invisible; source white background. Control and warning structure otherwise present.

TestClient

![TestClient Purge Policy](06e-purge-policy-testclient.jpg)

Tanserv

![Tanserv Purge Policy](06e-purge-policy-tanserv.jpg)

### 22. Document Setup — Visual drift

Evidence: 07-document-setup. P2: shared layout/table-color drift; source category badges wrap awkwardly at746, local stays one line (do not reproduce source defect without decision).

TestClient

![TestClient Document Setup](07-document-setup-testclient.jpg)

Tanserv

![Tanserv Document Setup](07-document-setup-tanserv.jpg)

### 23. Document Presets — Significant gap

Evidence: 07a-document-presets. P1: local Add Selected looks enabled with zero selection unlike disabled source; missing Select documents to add footer; local Status badges clipped at right. Same columns otherwise.

TestClient

![TestClient Document Presets](07a-document-presets-testclient.jpg)

Tanserv

![Tanserv Document Presets](07a-document-presets-tanserv.jpg)

### 24. Document Create — Visual drift

Evidence: 07b-document-create. P2: fields/placeholders match but reference single-column form vs local split first row; dialog dimensions/placement differ.

TestClient

![TestClient Document Create](07b-document-create-testclient.jpg)

Tanserv

![Tanserv Document Create](07b-document-create-tanserv.jpg)

### 25. Role Display — Significant gap

Evidence: 08-role-display. P1 responsive mismatch: reference wraps Support/View roles below Operational hierarchy; local fixed-width chart pushes them off-screen horizontally, large blank lower canvas.

TestClient

![TestClient Role Display](08-role-display-testclient.jpg)

Tanserv

![Tanserv Role Display](08-role-display-tanserv.jpg)

### 26. Role Names — Visual drift

Evidence: 08a-role-names. P2: correct three controls and disabled defaults; local two-column layout instead of source stacked fields, shorter panel.

TestClient

![TestClient Role Names](08a-role-names-testclient.jpg)

Tanserv

![Tanserv Role Names](08a-role-names-tanserv.jpg)

### 27. User Setup — Significant gap

Evidence: 09-user-setup. P1: Send Creds row action missing locally (DOM). P2: role filter shows truncated A, uniform badge colors and email ellipsis differ. Source toolbar itself overlaps at746px.

TestClient

![TestClient User Setup](09-user-setup-testclient.jpg)

Tanserv

![Tanserv User Setup](09-user-setup-tanserv.jpg)

### 28. User Create — Visual drift

Evidence: 09a-user-create. P2: correct step1 fields and note; local two-column form vs reference one column and different modal height.

TestClient

![TestClient User Create](09a-user-create-testclient.jpg)

Tanserv

![Tanserv User Create](09a-user-create-tanserv.jpg)

### 29. User Existing — Significant gap

Evidence: 09b-user-existing. P1: existing-contact checkbox fails to open reference second-level picker; local remains on step1 after checking.

TestClient

![TestClient User Existing](09b-user-existing-testclient.jpg)

Tanserv

![Tanserv User Existing](09b-user-existing-tanserv.jpg)

### 30. User Bulk — Visual drift

Evidence: 09c-user-bulk. P2: same upload/history structure; row density, heading color, date format and outer layout differ. Counts excluded.

TestClient

![TestClient User Bulk](09c-user-bulk-testclient.jpg)

Tanserv

![Tanserv User Bulk](09c-user-bulk-tanserv.jpg)

### 31. Notification Manager — Visual drift

Evidence: 10-notification-manager. P2 visual: same columns/switches but shared padding/color drift. Accessibility: local search accessible name is icon and switches unnamed in DOM; reference switches named WhatsApp: On. Live switches not toggled (may persist).

TestClient

![TestClient Notification Manager](10-notification-manager-testclient.jpg)

Tanserv

![Tanserv Notification Manager](10-notification-manager-tanserv.jpg)

### 32. Submission Process — Significant gap

Evidence: 11-submission-process. P1: local Strategy Manager wrongly includes Push/Email settings above list; source is strategy list only. Different strategy states/type terminology and CTA.

TestClient

![TestClient Submission Process](11-submission-process-testclient.jpg)

Tanserv

![Tanserv Submission Process](11-submission-process-tanserv.jpg)

### 33. Submission Create — Significant gap

Evidence: 11a-submission-create. P1: missing searchable full document checklist, agent-selection help and strategy explanation; checkbox replaces switch; five local document options vs reference16; Save instead of Create Strategy.

TestClient

![TestClient Submission Create](11a-submission-create-testclient.jpg)

Tanserv

![Tanserv Submission Create](11a-submission-create-tanserv.jpg)

### 34. Push Email — Significant gap

Evidence: 11b-push-email. P1: reference two white sections with KAM/KAS/Manager switches and Submit; local single low-contrast purple header, checkboxes and Save Changes. Sender/default values data-dependent.

TestClient

![TestClient Push Email](11b-push-email-testclient.jpg)

Tanserv

![Tanserv Push Email](11b-push-email-tanserv.jpg)

### 35. Module Configuration — Close / minor drift

Evidence: 12-module-configuration. Close: four cards, text, disabled controls and spacing align after intentional single-line tab height difference. Local tabs scroll internally; reference has page overflow. No major first-tab field gap observed.

TestClient

![TestClient Module Configuration](12-module-configuration-testclient.jpg)

Tanserv

![Tanserv Module Configuration](12-module-configuration-tanserv.jpg)

### 36. Config Edit — Close / minor drift

Evidence: 12a-config-edit. Close:500px dialog, four unchecked fields, Cancel/Apply and spacing closely match; local adds background blur. This does not validate other configuration tabs.

TestClient

![TestClient Config Edit](12a-config-edit-testclient.jpg)

Tanserv

![Tanserv Config Edit](12a-config-edit-tanserv.jpg)

### 37. Visit — Significant gap

Evidence: 12b-visit. P1: missing Current Start/End Time cards, dropdown substitutes Yes/No radios; RPC marked mandatory locally unlike reference; missing start-time required marker. Low-contrast purple panel header.

TestClient

![TestClient Visit](12b-visit-testclient.jpg)

Tanserv

![Tanserv Visit](12b-visit-tanserv.jpg)

### 38. Monthend — Significant gap

Evidence: 12c-monthend. P1/P2: core manual/automatic sections exist; local DOM omits Bucket This Would Close/Last Closed/Would Run At summary and retry explanations; body typography, client badge and spacing drift.

TestClient

![TestClient Monthend](12c-monthend-testclient.jpg)

Tanserv

![Tanserv Monthend](12c-monthend-tanserv.jpg)

### 39. Monthend Auto — Significant gap

Evidence: 12d-monthend-auto. P1/P2: schedule exists but native radios replace month-segment buttons, text input lacks source calendar affordance, low-contrast purple schedule heading. Recipients is textbox locally vs source multiselect combobox. Saved dates/sample defaults excluded. Scroll positions differ.

TestClient

![TestClient Monthend Auto](12d-monthend-auto-testclient.jpg)

Tanserv

![Tanserv Monthend Auto](12d-monthend-auto-tanserv.jpg)

### 40. Client Confirmation — Significant gap

Evidence: 12e-client-confirmation. P1/P2: heading shortened, low-contrast local panel, missing pagination/sort affordances and status badges; sample counts excluded. Reference status pill has severe narrow-width wrapping; do not copy defect.

TestClient

![TestClient Client Confirmation](12e-client-confirmation-testclient.jpg)

Tanserv

![Tanserv Client Confirmation](12e-client-confirmation-tanserv.jpg)

### 41. Cc Upload — Significant gap

Evidence: 12f-cc-upload. P1: enabled Upload before file selection vs disabled Start Upload; wrong title, file-types text vs10MB hint, misplaced/renamed download button.

TestClient

![TestClient Cc Upload](12f-cc-upload-testclient.jpg)

Tanserv

![Tanserv Cc Upload](12f-cc-upload-tanserv.jpg)

### 42. Pdc — Significant gap

Evidence: 12g-pdc. P1: checkbox vs switch; missing auto-clear and Ops helper text; premature Save Changes visible while locked; low-contrast panel headings.

TestClient

![TestClient Pdc](12g-pdc-testclient.jpg)

Tanserv

![Tanserv Pdc](12g-pdc-tanserv.jpg)

### 43. Pdc User — Significant gap

Evidence: 12h-pdc-user. P1: searchable inline user popover replaced by modal native select and Add User step.

TestClient

![TestClient Pdc User](12h-pdc-user-testclient.jpg)

Tanserv

![Tanserv Pdc User](12h-pdc-user-tanserv.jpg)

### 44. Escalation — Significant gap

Evidence: 12i-escalation. P1/P2: source lavender headers/search integrated with cards; local dark-on-purple headings, search below, no footer guidance, Name instead of Process, different action layout.

TestClient

![TestClient Escalation](12i-escalation-testclient.jpg)

Tanserv

![Tanserv Escalation](12i-escalation-tanserv.jpg)

### 45. Process Create — Visual drift

Evidence: 12j-process-create. P2: four-step flow exists but source bullet introduction replaced by dense inline step text, extra Cancel footer, different modal width.

TestClient

![TestClient Process Create](12j-process-create-testclient.jpg)

Tanserv

![Tanserv Process Create](12j-process-create-tanserv.jpg)

### 46. Process Name — Visual drift

Evidence: 12k-process-name. P2: wrong placeholder (source blank), missing helper text, oversized local wizard shell.

TestClient

![TestClient Process Name](12k-process-name-testclient.jpg)

Tanserv

![Tanserv Process Name](12k-process-name-tanserv.jpg)

### 47. Process Status — Significant gap

Evidence: 12l-process-status. P1: source optional-field explanatory badge missing; local Sub Status initially enabled vs disabled source; select styling/layout differ.

TestClient

![TestClient Process Status](12l-process-status-testclient.jpg)

Tanserv

![Tanserv Process Status](12l-process-status-tanserv.jpg)

### 48. Process Matrix — Significant gap

Evidence: 12m-process-matrix. P1: missing Create new matrix route from wizard and reuse helper text; wrong placeholder.

TestClient

![TestClient Process Matrix](12m-process-matrix-testclient.jpg)

Tanserv

![Tanserv Process Matrix](12m-process-matrix-tanserv.jpg)

### 49. Matrix New — Visual drift

Evidence: 12n-matrix-new. P2: source640x500 reserved dialog vs local wider/shallow; missing empty-state/helper copy.

TestClient

![TestClient Matrix New](12n-matrix-new-testclient.jpg)

Tanserv

![Tanserv Matrix New](12n-matrix-new-tanserv.jpg)

### 50. Matrix Level — Significant gap

Evidence: 12o-matrix-level. P1: source numbered Level1 with remove and Approver selector; local Approver Role plus Level Name, lacks remove control/numbered level presentation.

TestClient

![TestClient Matrix Level](12o-matrix-level-testclient.jpg)

Tanserv

![Tanserv Matrix Level](12o-matrix-level-tanserv.jpg)

### 51. Issue Tracker — Significant gap

Evidence: 12p-issue-tracker. P1/P2: local plain checkbox replaces reference switch/card; helper copy differs, missing existing-setup intro, low-contrast heading. Source page scrolls horizontally when last tab selected, cropping title; local active tab remains offscreen.

TestClient

![TestClient Issue Tracker](12p-issue-tracker-testclient.jpg)

Tanserv

![Tanserv Issue Tracker](12p-issue-tracker-tanserv.jpg)

### 52. Portfolio Transfer — Significant gap

Evidence: 13-portfolio-transfer. P1: local failed status is green like success, Progress cells blank, Failed download shown on success rows too. P2 shared padding/table/toolbar drift. Source has severe vertical status-pill wrapping.

TestClient

![TestClient Portfolio Transfer](13-portfolio-transfer-testclient.jpg)

Tanserv

![Tanserv Portfolio Transfer](13-portfolio-transfer-tanserv.jpg)

### 53. Portfolio Upload — Visual drift

Evidence: 13a-portfolio-upload. P2: same upload content; local wider dialog and full-width stacked footer buttons vs600px reference and inline footer.

TestClient

![TestClient Portfolio Upload](13a-portfolio-upload-testclient.jpg)

Tanserv

![Tanserv Portfolio Upload](13a-portfolio-upload-tanserv.jpg)

### 54. Bulk Document Upload — Significant gap

Evidence: 14-bulk-document-upload. P1/P2: missing yellow guidance panel, native file control vs styled Browse, document options limited locally, missing table pagination/sort; different action placement.

TestClient

![TestClient Bulk Document Upload](14-bulk-document-upload-testclient.jpg)

Tanserv

![Tanserv Bulk Document Upload](14-bulk-document-upload-tanserv.jpg)

### 55. Limbo — Visual drift

Evidence: 14a-limbo. P2: correctly switches to Client/File/Type/Actions table; local lacks pagination and reference icons/styling. Edit detail not inspected.

TestClient

![TestClient Limbo](14a-limbo-testclient.jpg)

Tanserv

![Tanserv Limbo](14a-limbo-tanserv.jpg)

### 56. Grn Upload — Significant gap

Evidence: 15-grn-upload. P1/P2: shared bulk-table parity gaps: blank local progress, failed download displayed on success rows, shared padding/header/toolbar drift. Failed badges green locally; compare source color by module. Source narrow-width status wrapping also defective.

TestClient

![TestClient Grn Upload](15-grn-upload-testclient.jpg)

Tanserv

![Tanserv Grn Upload](15-grn-upload-tanserv.jpg)

### 57. Grn Dialog — Visual drift

Evidence: 15a-grn-dialog. P2: matching upload title and file types, but local wider modal, stacked full-width footer actions and different download button; source600px with inline footer.

TestClient

![TestClient Grn Dialog](15a-grn-dialog-testclient.jpg)

Tanserv

![Tanserv Grn Dialog](15a-grn-dialog-tanserv.jpg)

### 58. Cn Advance Upload — Significant gap

Evidence: 16-cn-advance-upload. P1/P2: shared bulk-table parity gaps: blank local progress, failed download displayed on success rows, shared padding/header/toolbar drift. Failed badges green locally; compare source color by module. Source narrow-width status wrapping also defective.

TestClient

![TestClient Cn Advance Upload](16-cn-advance-upload-testclient.jpg)

Tanserv

![Tanserv Cn Advance Upload](16-cn-advance-upload-tanserv.jpg)

### 59. Cn Dialog — Visual drift

Evidence: 16a-cn-dialog. P2: matching upload title and file types, but local wider modal, stacked full-width footer actions and different download button; source600px with inline footer.

TestClient

![TestClient Cn Dialog](16a-cn-dialog-testclient.jpg)

Tanserv

![Tanserv Cn Dialog](16a-cn-dialog-tanserv.jpg)

### 60. Payment Receipt Upload — Significant gap

Evidence: 17-payment-receipt-upload. P1/P2: shared bulk-table parity gaps: blank local progress, failed download displayed on success rows, shared padding/header/toolbar drift. Failed badges green locally; compare source color by module. Source narrow-width status wrapping also defective.

TestClient

![TestClient Payment Receipt Upload](17-payment-receipt-upload-testclient.jpg)

Tanserv

![Tanserv Payment Receipt Upload](17-payment-receipt-upload-tanserv.jpg)

### 61. Payment Dialog — Visual drift

Evidence: 17a-payment-dialog. P2: matching upload title and file types, but local wider modal, stacked full-width footer actions and different download button; source600px with inline footer.

TestClient

![TestClient Payment Dialog](17a-payment-dialog-testclient.jpg)

Tanserv

![Tanserv Payment Dialog](17a-payment-dialog-tanserv.jpg)

### 62. Customer Portfolio Transfer — Significant gap

Evidence: 18-customer-portfolio-transfer. P1/P2: blank local progress and unconditional Failed action; shared table/toolbar/padding drift. Both source/local use green failure badge here (source UX inconsistency).

TestClient

![TestClient Customer Portfolio Transfer](18-customer-portfolio-transfer-testclient.jpg)

Tanserv

![Tanserv Customer Portfolio Transfer](18-customer-portfolio-transfer-tanserv.jpg)

### 63. Customer Transfer Dialog — Visual drift

Evidence: 18a-customer-transfer-dialog. P2: matching upload title and file types, but local wider modal, stacked full-width footer actions and different download button; source600px with inline footer. Required-column guidance exists but wording/color differ (yellow reference, lavender local);10MB hint moved.

TestClient

![TestClient Customer Transfer Dialog](18a-customer-transfer-dialog-testclient.jpg)

Tanserv

![Tanserv Customer Transfer Dialog](18a-customer-transfer-dialog-tanserv.jpg)

### 64. Group Master — Visual drift

Evidence: 19-group-master. P2: Create New is renamed Add New Group; outer margins are 16px vs 48px; local two-column table has an unnecessary horizontal scrollbar and tab underline touches text.

TestClient

![TestClient Group Master](19-group-master-testclient.jpg)

Tanserv

![Tanserv Group Master](19-group-master-tanserv.jpg)

### 65. Group Create — Visual drift

Evidence: 19a-group-create. P2: Three fields match, but local dialog is about 710px vs 500px, textarea is shorter, and Save Group is renamed Save.

TestClient

![TestClient Group Create](19a-group-create-testclient.jpg)

Tanserv

![Tanserv Group Create](19a-group-create-tanserv.jpg)

### 66. Customer Master — Significant gap

Evidence: 20-customer-master. P1: Actions moved from first to last column, hiding Edit beyond horizontal scroll. P2: copy and margins differ, local customer names lose bold emphasis. Sample records/counts excluded.

TestClient

![TestClient Customer Master](20-customer-master-testclient.jpg)

Tanserv

![Tanserv Customer Master](20-customer-master-tanserv.jpg)

### 67. Customer Create — Visual drift

Evidence: 20a-customer-create. P2: Field inventory and required markers are largely present, but plain Enter placeholders are rewritten; dropdown DOM uses search controls instead of reference carets. Both forms are single-column here; local vertical spacing is denser and modal/header/footer styling differs.

TestClient

![TestClient Customer Create](20a-customer-create-testclient.jpg)

Tanserv

![Tanserv Customer Create](20a-customer-create-tanserv.jpg)

### 68. Customer Bulk — Significant gap

Evidence: 20b-customer-bulk. P1: Wrong table schema: local Company/Status replaces Count/File Name, losing uploaded file identification. Local rows with rejected records lack Failed download action. P2: Upload File renamed Bulk Upload; row density differs.

TestClient

![TestClient Customer Bulk](20b-customer-bulk-testclient.jpg)

Tanserv

![Tanserv Customer Bulk](20b-customer-bulk-tanserv.jpg)

### 69. Customer Contacts — Significant gap

Evidence: 21-customer-contacts. P1: Table schema/order differs: reference Name, Email, Phone, Customer, Actions; local Customer, Name, Email, Department, Phone Number, Actions. P2: Added search, changed title copy and Create New label.

TestClient

![TestClient Customer Contacts](21-customer-contacts-testclient.jpg)

Tanserv

![Tanserv Customer Contacts](21-customer-contacts-tanserv.jpg)

### 70. Customer Contact Create — Visual drift

Evidence: 21a-customer-contact-create. P2: Field and Department option inventory matches closely. Labels switch from uppercase to title case; spacing, search input corners and Save Contact label differ. Full Name is disabled locally; reference DOM does not mark disabled (derivation behavior not tested).

TestClient

![TestClient Customer Contact Create](21a-customer-contact-create-testclient.jpg)

Tanserv

![Tanserv Customer Contact Create](21a-customer-contact-create-tanserv.jpg)

### 71. Template Master — Significant gap

Evidence: 22-template-master. P1: Description column replaced by Status, Edit moved offscreen to last column, and local invents Preview/Duplicate/Activate/Delete actions absent in reference. P2: global margins and code emphasis differ.

TestClient

![TestClient Template Master](22-template-master-testclient.jpg)

Tanserv

![Tanserv Template Master](22-template-master-tanserv.jpg)

### 72. Template Edit — Reference error / local gap

Evidence: 22a-template-edit. Reference-specific failure: first record Edit returned Failed to initiate edit. Local first Edit opened no editor/new tab. Later reference IssueTrackerYourTurn record worked; see 22b.

TestClient

![TestClient Template Edit](22a-template-edit-testclient.jpg)

Tanserv

![Tanserv Template Edit](22a-template-edit-tanserv.jpg)

### 73. Template Editor — Significant gap

Evidence: 22b-template-editor. P1: Reference opens full editor with Event Type, Recipient Role, Comm Mode, schedule, code, description, subject, content/source/preview and Disabled control; local Edit does nothing on sampled row. Different sample record content is not the issue: the editor surface is missing.

TestClient

![TestClient Template Editor](22b-template-editor-testclient.jpg)

Tanserv

![Tanserv Template Editor](22b-template-editor-tanserv.jpg)

### 74. Smtp Setup — Visual drift

Evidence: 23-smtp-setup. P2: Missing account-role explanations and client heading, and missing masked-value visibility controls; adds pagination to fixed two-account table. Integration guide omission may be intentional under prior tutorial-removal instruction; confirm before restoring.

TestClient

![TestClient Smtp Setup](23-smtp-setup-testclient.jpg)

Tanserv

![Tanserv Smtp Setup](23-smtp-setup-tanserv.jpg)

### 75. Smtp Edit — Significant gap

Evidence: 23a-smtp-edit. P1 reference risk: Edit exposes existing credentials as visible text; they were replaced with redaction text in unsaved fields before this distributed capture, then discarded. Do not replicate secret exposure. P2: Local uses simple radios instead of provider logo tiles; shortened title, missing Email Type required marker, different disabled-field fill and spacing.

TestClient

![TestClient Smtp Edit](23a-smtp-edit-testclient.jpg)

Tanserv

![Tanserv Smtp Edit](23a-smtp-edit-tanserv.jpg)

### 76. Sender Account — Significant gap

Evidence: 24-sender-account. P1/P2: Local adds Sender Account Type column, pushing Edit beyond horizontal scroll; reference has three columns and fits. Missing role-explanation panel and client badge; unnecessary pagination.

TestClient

![TestClient Sender Account](24-sender-account-testclient.jpg)

Tanserv

![Tanserv Sender Account](24-sender-account-tanserv.jpg)

### 77. Sender Edit — Significant gap

Evidence: 24a-sender-edit. P1: Local Update enabled before OTP verification while reference disabled; local shows OTP text field prematurely. P2: Send OTP/Test Email stacked full-width with duplicate labels; reference Test Email is footer action. No emails or OTPs sent.

TestClient

![TestClient Sender Edit](24a-sender-edit-testclient.jpg)

Tanserv

![Tanserv Sender Edit](24a-sender-edit-tanserv.jpg)

### 78. Strategy Manager — Significant gap

Evidence: 25-strategy-manager. P1/P2: Entire landing composition differs: local boxed header, blue full-width CTA, stacked filters and narrow wrapping name column vs reference purple CTA, inline filters and single-line names. Local Active/Inactive status filter conflicts with displayed Running state; search lacks accessible name.

TestClient

![TestClient Strategy Manager](25-strategy-manager-testclient.jpg)

Tanserv

![Tanserv Strategy Manager](25-strategy-manager-tanserv.jpg)

### 79. Strategy Create — Significant gap

Evidence: 25a-strategy-create. P1/P2: Local missing Reminder Type/Template/Notification Mode required markers and remove-template control on initial block. Running renamed Active; extra Back to list/Cancel actions; reference three-column field rows become large single-column blocks. Native select vs searchable reference dropdown.

TestClient

![TestClient Strategy Create](25a-strategy-create-testclient.jpg)

Tanserv

![Tanserv Strategy Create](25a-strategy-create-tanserv.jpg)

### 80. Strategy Template — Significant gap

Evidence: 25b-strategy-template. P1/P2: Same Both/Invoice/ReminderForPaymentDue selection, but local automatically selects Custom while reference requires Notification Mode choice. Local template option set is shorter; aging defaults differ (2 vs 19 selected), needs business confirmation. Both hierarchy and bucket sections exist. Screenshots have different vertical offsets; reference also overflows horizontally.

TestClient

![TestClient Strategy Template](25b-strategy-template-testclient.jpg)

Tanserv

![Tanserv Strategy Template](25b-strategy-template-tanserv.jpg)

### 81. Strategy Email Sender — Significant gap

Evidence: 25c-strategy-email-sender. P1/P2: Reference sender summary banner and selectable account cards replaced with plain text/native radios. Cancel/Save disabled semantics match, but local disabled Save appears strongly active. Missing iconography/badge/helper panel, altered header structure.

TestClient

![TestClient Strategy Email Sender](25c-strategy-email-sender-testclient.jpg)

Tanserv

![Tanserv Strategy Email Sender](25c-strategy-email-sender-tanserv.jpg)

### 82. Invoice Upload — Significant gap

Evidence: 26-invoice-upload. P1/P2: Local table pushes actions beyond horizontal scroll at 1112px while reference fits; progress uses purple bare bars instead of green bar plus 100% — Complete text. Create New loses secondary-button hierarchy. Shared table header color/copy differ; green failure badges exist on reference too.

TestClient

![TestClient Invoice Upload](26-invoice-upload-testclient.jpg)

Tanserv

![Tanserv Invoice Upload](26-invoice-upload-tanserv.jpg)

### 83. Invoice Create — Close / minor drift

Evidence: 26a-invoice-create. Close: field inventory, required markers, three-column structure and footer match. P2: Invoice Date/Due Date use native dd/mm/yyyy UI vs custom dd-mm-yyyy; disabled ownership fields lack search icons. Modal blur and field spacing differ.

TestClient

![TestClient Invoice Create](26a-invoice-create-testclient.jpg)

Tanserv

![Tanserv Invoice Create](26a-invoice-create-tanserv.jpg)

### 84. Invoice Bulk — Significant gap

Evidence: 26b-invoice-bulk. P1/P2: Local title duplicates Upload; file hint adds CSV to reference xlsx/xls; local Upload enabled without file while reference DOM disables it. Download Template position/style and modal vertical spacing differ.

TestClient

![TestClient Invoice Bulk](26b-invoice-bulk-testclient.jpg)

Tanserv

![Tanserv Invoice Bulk](26b-invoice-bulk-tanserv.jpg)

### 85. Invoice Reallocation — Significant gap

Evidence: 27-invoice-reallocation. P1: Wrong workflow: reference per-row Reallocate; local introduces bulk role/assignee/reason form and filters. Missing Client Code/KAM/KAS columns. P1 visual readability: dark heading on purple. P2: Wrong copy and action taxonomy.

TestClient

![TestClient Invoice Reallocation](27-invoice-reallocation-testclient.jpg)

Tanserv

![Tanserv Invoice Reallocation](27-invoice-reallocation-tanserv.jpg)

### 86. Reallocation Dialog — Significant gap

Evidence: 27a-reallocation-dialog. P1: Reference Edit Invoice dialog for Agent/Manager/KAM/KAS is absent from local row actions (Select/View Invoice instead). Local inline bulk form is shown as the alternative, not an equivalent modal.

TestClient

![TestClient Reallocation Dialog](27a-reallocation-dialog-testclient.jpg)

Tanserv

![Tanserv Reallocation Dialog](27a-reallocation-dialog-tanserv.jpg)

### 87. Invoice Deletion — Significant gap

Evidence: 28-invoice-deletion. P1: reference starts with a search-only state; local immediately shows a bulk-deletion reason form, date/branch filters and sample rows absent from the reference. Dark-on-purple heading is difficult to read. Search results are covered in 28a; destructive confirmation was not tested.

TestClient

![TestClient Invoice Deletion](28-invoice-deletion-testclient.jpg)

Tanserv

![Tanserv Invoice Deletion](28-invoice-deletion-tanserv.jpg)

### 88. Deletion Search — Significant gap

Evidence: 28a-deletion-search. Reference searched a known observed invoice; local searched its own sample invoice. Compare workflow, not row values. No destructive action clicked. P1: Local table omits Client Code, Customer Code, Current Net Due, Agent/Manager/KAM/KAS and Due Date; uses No/Select pill action instead of row checkbox.

TestClient

![TestClient Deletion Search](28a-deletion-search-testclient.jpg)

Tanserv

![Tanserv Deletion Search](28a-deletion-search-tanserv.jpg)

### 89. Change Password — Significant gap

Evidence: 29-change-password. P1/P2: Reference compact centered 505px card becomes full-width nested tab/card with unreadable dark-purple heading; local adds Change Password tab absent in reference, and replaces custom user picker with native select. 

TestClient

![TestClient Change Password](29-change-password-testclient.jpg)

Tanserv

![Tanserv Change Password](29-change-password-tanserv.jpg)

### 90. Password Fields — Close / minor drift

Evidence: 29a-password-fields. Close field inventory: New/Confirm Password and Cancel/Update appear after selection. P2: Missing footer separator; full-width layout and title/typography mismatch persist. Password values and submission not tested.

TestClient

![TestClient Password Fields](29a-password-fields-testclient.jpg)

Tanserv

![Tanserv Password Fields](29a-password-fields-tanserv.jpg)

### 91. Client Master — Significant gap

Evidence: 30-client-master. P1/P2: Missing logo-edit affordance and renewal-days badge, extra Client Accounts/Text Setup tabs, empty purple heading bar, unreadable Sub Clients heading, smaller logo without dashed frame. Duplicate empty messages. Source counts empty state as 1 record (reference defect, do not copy).

TestClient

![TestClient Client Master](30-client-master-testclient.jpg)

Tanserv

![Tanserv Client Master](30-client-master-tanserv.jpg)

### 92. Client Create — Visual drift

Evidence: 30a-client-create. P2: Three fields/placeholders match; local 720px two-column dialog vs 600px single-column, title-case labels instead of uppercase, different footer and button sizes.

TestClient

![TestClient Client Create](30a-client-create-testclient.jpg)

Tanserv

![Tanserv Client Create](30a-client-create-tanserv.jpg)

### 93. Audit Retention — Significant gap

Evidence: 31-audit-retention. P1/P2: Repeated dark-on-purple low-contrast headers; added tab/nested cards; missing explanatory helper paragraphs and last-purge timestamp/reason; oversized notification days field. Correct main control inventory/default values.

TestClient

![TestClient Audit Retention](31-audit-retention-testclient.jpg)

Tanserv

![Tanserv Audit Retention](31-audit-retention-tanserv.jpg)

### 94. Purge History — Significant gap

Evidence: 31a-purge-history. P1: Missing permanent-deletion warning paragraph above purge controls. P2: Run Purge Now loses red danger styling, history lacks status badge and pagination. No purge or dry-run executed. Lower-panel screenshots taken with End; layout density causes different sections visible.

TestClient

![TestClient Purge History](31a-purge-history-testclient.jpg)

Tanserv

![Tanserv Purge History](31a-purge-history-tanserv.jpg)

### 95. Audit Trail — Visual drift

Evidence: 32-audit-trail. P2: Correct filter/table inventory, but added tab, altered grid/button placement, duplicate empty messages and heavier typography. Local entity trigger has generic role, missing dropdown caret/expanded semantics.

TestClient

![TestClient Audit Trail](32-audit-trail-testclient.jpg)

Tanserv

![Tanserv Audit Trail](32-audit-trail-tanserv.jpg)

### 96. Audit Entity Picker — Significant gap

Evidence: 32a-audit-entity-picker. P1/P2: Local entity menu is clipped by card bottom; loses visible continuation. Search receives focus automatically on reference but not local. Option inventory broadly aligns.

TestClient

![TestClient Audit Entity Picker](32a-audit-entity-picker-testclient.jpg)

Tanserv

![Tanserv Audit Entity Picker](32a-audit-entity-picker-tanserv.jpg)

### 97. Audit Results — Visual drift

Evidence: 32b-audit-results. P2: Local result lacks Created/Updated colored badge and pagination; timestamp format and View changes border differ. Sample values excluded.

TestClient

![TestClient Audit Results](32b-audit-results-testclient.jpg)

Tanserv

![Tanserv Audit Results](32b-audit-results-tanserv.jpg)

### 98. Audit Details — Visual drift

Evidence: 32c-audit-details. P2: Local flattens revision card, removes action badge and old/new color differentiation, uses much taller table rows and Cancel instead of Close. Generic sample schema (name, no disabled) does not demonstrate entity-specific Bank Details fields. Modal exposed without dialog role in local snapshot.

TestClient

![TestClient Audit Details](32c-audit-details-testclient.jpg)

Tanserv

![Tanserv Audit Details](32c-audit-details-tanserv.jpg)

### 99. Help Support — Close / minor drift

Evidence: 33-help-support. Close content and visual language: hero, search, shortcuts, FAQs and category inventory align. P2: Local lacks 24px outer gutter/top gap; seven category columns instead of reference six at 1112px.

TestClient

![TestClient Help Support](33-help-support-testclient.jpg)

Tanserv

![Tanserv Help Support](33-help-support-tanserv.jpg)

### 100. Help Article — Close / minor drift

Evidence: 33a-help-article. Close: observed article content, permission chips and section order match. P2: local title header lacks lavender fill, close button has browser-default square border, background blur missing and footer button oversized. Other 99 article bodies not individually audited.

TestClient

![TestClient Help Article](33a-help-article-testclient.jpg)

Tanserv

![Tanserv Help Article](33a-help-article-tanserv.jpg)

### 101. Create Ticket — Visual drift

Evidence: 33b-create-ticket. P2: Local adds Attachment section absent from observed reference form, expands Description placeholder, removes lavender title and blur, uses default square close and oversized footer controls. Category/Priority options align. No ticket submitted.

TestClient

![TestClient Create Ticket](33b-create-ticket-testclient.jpg)

Tanserv

![Tanserv Create Ticket](33b-create-ticket-tanserv.jpg)

### 102. My Tickets — Visual drift

Evidence: 33c-my-tickets. P2: Summary counters lose white cards, colored left borders and bold value hierarchy; New Ticket uses different style. Correct tabs/status filters and empty-state message. No reference tickets available, so conversation detail unverified.

TestClient

![TestClient My Tickets](33c-my-tickets-testclient.jpg)

Tanserv

![Tanserv My Tickets](33c-my-tickets-tanserv.jpg)

### 103. Feedback — Close / minor drift

Evidence: 33d-feedback. Close: rating, category/module fields, placeholders and section structure align. P2: inherited outer gutter/hero offsets and submit styling differ. Rating buttons are icon-only in reference; accessibility needs explicit 1–5 labels. No feedback sent.

TestClient

![TestClient Feedback](33d-feedback-testclient.jpg)

Tanserv

![Tanserv Feedback](33d-feedback-tanserv.jpg)

