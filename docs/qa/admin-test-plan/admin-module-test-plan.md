# Admin module-wise test plan

**Draft 1 · 5 September 2026 · No tests executed by this planning task**

## Scope and safety

Cover Dashboard, all 32 Admin menu destinations, every observed tab/popup, and the explicitly unverified nested branches from the audit. The current deliverable is a design-only prototype: test navigation and sample UI states locally; do not expect real persistence, emails, uploads, reallocation, deletion or purging. Functional/business-rule cases are a separate proposed backlog pending Q-SCOPE and confirmed rules.

The live reference is read-only. Never click a live action merely because it might open a confirmation; inspect it safely or request an approved test environment. No credentials are revealed, no real customer data is submitted, and no external effects are authorized by this plan.

## Sources and test oracle

- [Audit report](../../../artifacts/admin-audit-2026-09-05/audit-report.html) and [capture manifest](../../../artifacts/admin-audit-2026-09-05/capture-manifest.json): 33 landing pages, 35 secondary states/attempts, captured on 5 September 2026. These are baseline observations, not current test passes.
- [Implementation scope](../../admin-replica-coverage.md): design-only safety and known unverified branches. Its implementation claims are not treated as audited expected results.
- Confirmed business-owner answers become the rule oracle. A live error or existing local defect is not the intended design. If the reference has changed, version the new baseline and do not silently overwrite expected results.

## Execution order

1. Shared shell, prototype isolation and fixture setup.
2. Master Setup: Branch → Holiday → Bank → Internal Company Contact.
3. Operational Setup: Invoice Preferences → Document Setup → Role/Display Names → User Setup → Notification Manager.
4. Configuration: Submission Process → Module Configuration (Configurations → Visit → Monthend → Client Confirmation → PDC → Escalation → Issue Tracker).
5. Bulk Upload: Portfolio → Bulk Documents/Limbo → GRN → CN/Advance → Payment Receipt → Customer Portfolio.
6. Customers: Group → Customer Master/Bulk Upload → Customer Contacts.
7. Email/Strategy: Template Master → SMTP → Sender Account → Strategy Manager.
8. Invoice Master: Upload/Create → Reallocation → Deletion.
9. Account/Compliance/Support: Password → Client Master → Retention/Purge → Audit Trail → Help & Support.

Within each module: inventory states → ask at most three relevant questions → confirm baseline and fixtures → run UI cases → run approved functional cases separately → record defects → retest → run shared-component regression. Unanswered rules block only their dependent cases.

## Case format and statuses

Each JSON case includes ID, module, type, priority, precondition, steps, expected result, dependency, status, actual result, evidence, defect ID, owner and run date. P0 protects data/no-write boundaries; P1 covers missing/wrong workflows and essential behavior; P2 covers visual/responsive refinement.

`NOT_RUN`: executable UI case, not yet run. `REFERENCE_PENDING`: capture/specification required. `REFERENCE_BLOCKED`: known unavailable reference. `RULE_PENDING`: business decision required. During execution use PASS, FAIL, BLOCKED or NOT_APPLICABLE with evidence/reason. The prior audit’s mismatch ratings are not execution statuses.

## Reusable checklists

Apply each checklist to every applicable control, not only the first row or first popup. Create child IDs such as ADM-BRN-FIELD-01 and ADM-MOD-MONTHEND-AUTO-01 once the field/branch matrix is known. Do not count a parent discovery or business-rule row as complete functional coverage.

Field matrix columns: screen/state; label; order; control type; placeholder; default; required; editable/disabled; options/data source; dependencies; length/format/min/max; helper/error text; keyboard behavior; reference evidence; rule question ID. Unknown values stay TBD.

Fixtures: empty, one record, multi-page records, long labels, Unicode, whitespace, missing optional values, inactive records, success/reject/partial states, masked synthetic secrets and disposable files. Business acceptance of those inputs remains gated where rules are unknown.

## Coverage index

| # | Module | Planned case rows | Rule question |
|---|---|---:|---|
| 1 | Dashboard | 8 | Q-DASH |
| 2 | Branch Master | 6 | Q-BRN |
| 3 | Holiday Master | 8 | Q-HOL |
| 4 | Bank Master | 6 | Q-BNK |
| 5 | Internal Company Contact | 7 | Q-ICC |
| 6 | Invoice Preferences | 10 | Q-INVPR |
| 7 | Document Setup | 8 | Q-DOC |
| 8 | Role and Display Name Setup | 7 | Q-ROLE |
| 9 | User Setup | 8 | Q-USR |
| 10 | Notification Manager | 5 | Q-NOTIF |
| 11 | Invoice Submission process | 8 | Q-SUB |
| 12 | Module Configuration | 21 | Q-MOD |
| 13 | Portfolio Transfer | 7 | Q-PORT |
| 14 | Bulk Document Upload | 6 | Q-BDOC |
| 15 | GRN Upload | 6 | Q-GRN |
| 16 | CN/Advance Upload | 6 | Q-CN |
| 17 | Payment Receipt Upload | 6 | Q-PAY |
| 18 | Customer Portfolio Transfer | 6 | Q-CPORT |
| 19 | Group Master | 6 | Q-GRP |
| 20 | Customer Master | 8 | Q-CUST |
| 21 | Customer Contacts | 7 | Q-CCON |
| 22 | Template Master | 7 | Q-TPL |
| 23 | Email Sender SMTP Setup | 6 | Q-SMTP |
| 24 | Email Sender Account Setup | 6 | Q-SEND |
| 25 | Strategy Manager | 7 | Q-STR |
| 26 | Invoice Upload | 7 | Q-IUP |
| 27 | Invoice reallocation | 6 | Q-IRE |
| 28 | Invoice Deletion | 6 | Q-IDEL |
| 29 | Change Password - Admin | 6 | Q-PWD |
| 30 | Client Master | 7 | Q-CLIENT |
| 31 | Audit Retention & Purge | 6 | Q-RET |
| 32 | Audit Trail | 6 | Q-TRAIL |
| 33 | Help & Support | 8 | Q-HELP |

Total: **248 planning rows** including shared checks, UI cases, discovery gates and business-rule placeholders. Counts do not represent executed tests or complete field-level coverage.

## Shared cases

### ADM-G-SAFE — Prototype isolation

**COMMON · P0 · NOT_RUN**

- Steps: Record existing local storage/network state; exercise Save/Upload/Delete/Send/Purge only in the local prototype using synthetic data; reload.
- Expected: Only a clearly identified preview response occurs; no external request, real download payload, persistent business-data mutation or live effect occurs. Compare against the explicitly approved prototype contract.

### ADM-G-SHELL — Shared navigation and branding

**COMMON · P1 · NOT_RUN**

- Steps: Inspect logos/header; expand every menu group; open/close sidebar; follow each observed link.
- Expected: All 32 destinations plus Dashboard resolve; labels/order/icons/active states match; no hidden or duplicate navigation intercepts keyboard focus.

### ADM-G-FIELD — Field-by-field form contract

**COMMON · P1 · NOT_RUN**

- Steps: For EACH observed form create a field matrix; test blank, valid, whitespace, boundary-length, invalid-format and dependent-selection values locally.
- Expected: Every field has exact label/order/control type/placeholder/default/required/disabled/helper behavior. Known UI behavior matches; unconfirmed validation outcomes remain RULE_PENDING rather than guessed.

### ADM-G-SELECT — Dropdown contract

**COMMON · P1 · NOT_RUN**

- Steps: For EACH lookup/select test open, search, no results, single/multiple selection, clear/remove, keyboard navigation, Escape and reopening.
- Expected: Options/order/search/selection chips and dependent reset behavior match the approved matrix. Synthetic options exercise long labels and empty results; no live tenant data is required.

### ADM-G-TABLE — Table and pagination contract

**COMMON · P1 · NOT_RUN**

- Steps: For EACH table test zero, one, page-size, page-size+1 records; long text; sorting each supported column; searching and clearing; horizontal scroll.
- Expected: Columns/actions remain aligned and discoverable; supported sort/paging/search controls and range text are correct; unsupported controls are absent; no missing or duplicate fixture rows across pages.

### ADM-G-MODAL — Modal state and dismissal

**COMMON · P1 · NOT_RUN**

- Steps: For EACH create/edit/view/confirmation dialog test open, title, prefill, scrolling, close, Cancel, Escape and reopen; verify focus.
- Expected: Reference size/grid/footer and close behavior match; background cannot be operated when modal; focus enters, stays contained and returns. Unsaved-change behavior is gated where not specified.

### ADM-G-ERROR — Loading/empty/error/retry states

**COMMON · P1 · NOT_RUN**

- Steps: Using local fixtures or mocks, display loading, empty, validation, failed-load, retry, success and disabled states wherever supported.
- Expected: States have meaningful text, preserve recoverable input, do not overlap content or expose secrets, and match an approved reference/specification; absent baselines remain REFERENCE_PENDING.

### ADM-G-FILES — File input and result contract

**COMMON · P1 · NOT_RUN**

- Steps: For EACH upload use synthetic valid, wrong-extension, corrupt, zero-byte, oversized, duplicate and mixed-validity fixtures only after limits/schema are confirmed.
- Expected: Picker/dropzone, selected filename/remove, disabled/loading/error/result presentation match. Acceptance, row counts and partial-success outcomes are business-rule gated; no live upload is performed.

### ADM-G-A11Y — Accessibility acceptance baseline

**COMMON · P1 · NOT_RUN**

- Steps: Inspect accessible names, label associations, heading order, focus visibility, errors, status announcements and contrast; use keyboard-only navigation.
- Expected: No essential control is unlabeled or unreachable; errors are not colour-only; modal focus works. Confirm the formal accessibility target before claiming compliance.

### ADM-G-DATA — Data and evidence hygiene

**COMMON · P1 · NOT_RUN**

- Steps: Use fabricated people, accounts, invoice identifiers, emails and secrets; record screenshot, URL, viewport, fixture and case ID.
- Expected: No real credentials or sensitive exports appear in test evidence. A test cannot be marked PASS without actual result and evidence; this plan creates no execution results.

## 1. Dashboard

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-DASH-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 01-dashboard

### ADM-DASH-02 — Dashboard totals and charts

**VISUAL · P1 · NOT_RUN**

- Steps: Open the dashboard with a zero-active-user sample; compare cards and activity chart.
- Expected: Zero totals and chart/gauge states are internally consistent; activity chart spans the reference width; card insets and labels match.
- Audit evidence ID: 01-dashboard

### ADM-DASH-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-DASH-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-STATE-01A — Directory

**STATE_PARITY · P1 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Reference opens a centered 900px modal with overlay, close button, one-column contact rows, role badges and A–Z rail. Local opens a small top-right popover, two-column avatar cards, no phone lines or alphabet rail, and no modal backdrop.
- Audit evidence ID: 01a-directory

### ADM-STATE-01B — Directory Add

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Same ten principal fields plus communication checkbox, but local 720px modal differs from source 800px; checkbox is centered in a half-width box and starts checked while reference is inline and unchecked. Contact-type conditional variants/options unverified.
- Audit evidence ID: 01b-directory-add

### ADM-DEEP-01 — Header notification and profile menus; self-password page; dashboard lower panels and each card drilldown

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-DASH-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-DASH at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-DASH; Q-SCOPE; Q-ENV

## 2. Branch Master

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-BRN-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 02-branch-master

### ADM-BRN-02 — Branch table and create form

**VISUAL · P1 · NOT_RUN**

- Steps: Open Branch Master, then Create New; compare the complete form without saving.
- Expected: Create New label, table actions, 800px reference form, field pairing and placeholders match; no unsupported Status field is added. Geographic behavior is gated by Q-BRN.
- Audit evidence ID: 02-branch-master

### ADM-BRN-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-BRN-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-STATE-02A — Branch Create

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Local 720px form differs from reference 800px: GST and addresses span full width, title and placeholders differ, an extra Status field appears, and geographic fields have different required/lookup presentation.
- Audit evidence ID: 02a-branch-create

### ADM-BRN-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-BRN at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-BRN; Q-SCOPE; Q-ENV

## 3. Holiday Master

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-HOL-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 03-holiday-master

### ADM-HOL-02 — Holiday one-line headings

**VISUAL · P1 · NOT_RUN**

- Steps: Open Holiday Master; inspect tabs and table headings at 1440px and with long sample state names.
- Expected: Tabs and reference single-line headers do not wrap; column widths and multi-state +1 badges match; create action uses the reference label.
- Audit evidence ID: 03-holiday-master

### ADM-HOL-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-HOL-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-STATE-03A — Holiday Create

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Exact field labels/placeholders and two-column arrangement retained. Outer rounding broken locally (square header/footer corners); state input taller, weekly-off checkbox/footer styling differ.
- Audit evidence ID: 03a-holiday-create

### ADM-STATE-03B — Holiday States

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Visible first six states/codes and searchable dropdown appearance match closely; full list and weekly-off/calendar branches not exercised.
- Audit evidence ID: 03b-holiday-states

### ADM-DEEP-02 — Date-picker navigation/selection; weekly-off controls; full state lookup and multi-select clear/remove states

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-HOL-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-HOL at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-HOL; Q-SCOPE; Q-ENV

## 4. Bank Master

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-BNK-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 04-bank-master

### ADM-BNK-02 — Bank row actions

**VISUAL · P1 · NOT_RUN**

- Steps: Open Bank Master with at least two sample records; inspect each row and open create/edit forms.
- Expected: Every applicable row presents Edit and Delete as in the reference; Create New and the Bank Name field match. Do not execute a live delete.
- Audit evidence ID: 04-bank-master

### ADM-BNK-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-BNK-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-STATE-04A — Bank Create

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Bank Name field/title/placeholder and800px modal align; minor type/button/backdrop differences.
- Audit evidence ID: 04a-bank-create

### ADM-BNK-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-BNK at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-BNK; Q-SCOPE; Q-ENV

## 5. Internal Company Contact

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-ICC-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 05-internal-contacts

### ADM-ICC-02 — Internal contact controls

**VISUAL · P1 · NOT_RUN**

- Steps: Open Internal Company Contact and its create form.
- Expected: Reference Create New label, nine visible fields, required markers, field pairing and gender/department dropdown affordances are preserved.
- Audit evidence ID: 05-internal-contacts

### ADM-ICC-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-ICC-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-STATE-05A — Contact Create

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: All visible fields/required markers and grid match. Local gender/department search-icon inputs replace source dropdown chevrons; minor typography/footer spacing differences. Full lookup options unverified.
- Audit evidence ID: 05a-contact-create

### ADM-DEEP-03 — Gender/department options; edit prefill and dismissal of existing-contact forms

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-ICC-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-ICC at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-ICC; Q-SCOPE; Q-ENV

## 6. Invoice Preferences

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-INVPR-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 06-invoice-preferences

### ADM-INVPR-02 — Invoice setup structure

**VISUAL · P1 · NOT_RUN**

- Steps: Open each Invoice Preferences tab and inspect the aging table.
- Expected: Select column does not dominate the table; aging names/ranges and tab labels match; custom groups, dispositions and purge policy remain separately reachable.
- Audit evidence ID: 06-invoice-preferences

### ADM-INVPR-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-INVPR-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-STATE-06A — Custom Aging

**STATE_PARITY · P2 · REFERENCE_PENDING**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: Align fixtures to equivalent empty/populated states before judging card-level parity.
- Gate: Equivalent fixtures
- Audit evidence ID: 06a-custom-aging

### ADM-STATE-06B — Create Bucket

**STATE_PARITY · P1 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Missing Group Color and consecutive-selection instructions;19 bucket chips replaced with native8-option list. Wrong title/placeholder/Save Group label and dialog dimensions.
- Audit evidence ID: 06b-create-bucket

### ADM-STATE-06C — Dispositions

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Broad/Primary/Substatus/Colour hierarchy recognizable; source far denser with narrower first columns. Local replaces some sub-status wording/sets; colour controls visually differ.
- Audit evidence ID: 06c-dispositions

### ADM-STATE-06D — Purge Policy

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Count/Edit/warning preserved. Local narrower/taller card and purple header with unreadable dark title; warning wrapping differs. No edits/saves.
- Audit evidence ID: 06d-purge-policy

### ADM-DEEP-04 — Colour picker states; bucket toggling boundaries; disposition edit hierarchy and purge policy editor

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-INVPR-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-INVPR at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-INVPR; Q-SCOPE; Q-ENV

## 7. Document Setup

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-DOC-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 07-document-setup

### ADM-DOC-02 — Document list density

**VISUAL · P1 · NOT_RUN**

- Steps: Open Document Setup with ten representative rows, including required/optional categories.
- Expected: Create/preset/Edit/Delete actions, category badges and reference row density are represented; approximately ten rows fit the reference desktop view.
- Audit evidence ID: 07-document-setup

### ADM-DOC-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-DOC-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-STATE-07A — Document Create

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Four field labels/placeholders and required flags match. Local720px rather than800px modal, different vertical spacing/buttons and native select replacing source category lookup.
- Audit evidence ID: 07a-document-create

### ADM-STATE-07B — Document Presets

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Preset table/category/status closely represented. Local Add Selected appears enabled with nothing selected; source disabled and helper Select documents to add missing. Different max-height/row fit.
- Audit evidence ID: 07b-document-presets

### ADM-DEEP-05 — Category lookup options; preset multi-selection; document edit and delete-confirmation UI

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-DOC-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-DOC at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-DOC; Q-SCOPE; Q-ENV

## 8. Role and Display Name Setup

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-ROLE-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 08-role-display

### ADM-ROLE-02 — Role group layout

**VISUAL · P1 · NOT_RUN**

- Steps: Open Role and Display Name Setup at the desktop baseline.
- Expected: All four role groups remain in the same horizontal arrangement as the reference; Customer Roles heading uses its reference colour and connectors align.
- Audit evidence ID: 08-role-display

### ADM-ROLE-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-ROLE-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-STATE-08A — Role Names

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Labels/placeholders/helper and disabled controls match; local form28px shorter and native select chevrons differ. Dependent options not fully compared.
- Audit evidence ID: 08a-role-names

### ADM-DEEP-06 — Role/display-name dependent selections and role-assignment boundaries

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-ROLE-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-ROLE at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-ROLE; Q-SCOPE; Q-ENV

## 9. User Setup

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-USR-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 09-user-setup

### ADM-USR-02 — User credential-action presence

**VISUAL · P1 · NOT_RUN**

- Steps: Open User Setup with active, suspended and differing-role samples; inspect bulk and row controls.
- Expected: Bulk Send Creds and row Send Creds are represented as sample-only UI; role badge variants and other reference actions are present. No credentials are sent.
- Audit evidence ID: 09-user-setup

### ADM-USR-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-USR-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-STATE-09A — User Create

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Hierarchy note, existing-contact option, six fields and mandatory markers retained. Local shorter dialog, tighter rows/smaller footer buttons. Step2 and role-dependent branches not reached.
- Audit evidence ID: 09a-user-create

### ADM-STATE-09B — User Bulk

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Upload history columns, status/count badges and conditional failed icons represented well. Date format, title/button sizing and columns differ. Upload modal not yet checked.
- Audit evidence ID: 09b-user-bulk

### ADM-DEEP-07 — Create User Step 2 and every role-dependent form; bulk upload dialog; password/suspend/delete/credential-send confirmation UI

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-USR-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-USR at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-USR; Q-SCOPE; Q-ENV

## 10. Notification Manager

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-NOTIF-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 10-notification-manager

### ADM-NOTIF-02 — Notification list

**VISUAL · P1 · NOT_RUN**

- Steps: Open Notification Manager; search for a known name and a no-result value in the local replica.
- Expected: Four reference columns, switch appearance, result/empty states and paging match. Reference switches are not toggled because changes may save immediately.
- Audit evidence ID: 10-notification-manager

### ADM-NOTIF-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-NOTIF-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-NOTIF-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-NOTIF at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-NOTIF; Q-SCOPE; Q-ENV

## 11. Invoice Submission process

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-SUB-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 11-submission-process

### ADM-SUB-02 — Submission strategy landing state

**VISUAL · P1 · NOT_RUN**

- Steps: Open Invoice Submission Process on its default Strategy Manager tab.
- Expected: Only the strategy list and Create New are shown in that initial state; Push Settings/Email Settings forms do not appear above the list.
- Audit evidence ID: 11-submission-process

### ADM-SUB-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-SUB-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-STATE-11A — Submission Create

**STATE_PARITY · P1 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Source has an 800px Add Strategy form, full-width Strategy Type, helper text, Agent Selection switch, searchable 16-document checkbox list, and Create Strategy. Local uses a compact 720px form, plain checkbox, five document options, no document search or explanatory text, and Save.
- Audit evidence ID: 11a-submission-create

### ADM-STATE-11B — Push Settings

**STATE_PARITY · P1 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Source stacks Email Configuration and Include Contacts cards, uses three switches and a left Submit button. Local compresses these into a two-column fieldset with checkboxes, purple heading bar, and right Save Changes; select placeholder/default differs.
- Audit evidence ID: 11b-push-settings

### ADM-DEEP-08 — Apply On and Strategy Type conditional branches; full document search/list; strategy edit and sender options

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-SUB-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-SUB at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-SUB; Q-SCOPE; Q-ENV

## 12. Module Configuration

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-MOD-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 12-module-configuration

### ADM-MOD-02 — Seven configuration tabs

**VISUAL · P1 · NOT_RUN**

- Steps: Open Module Configuration; visit each of its seven tabs locally and inspect its matching baseline.
- Expected: Configurations, Visit, Monthend, Client Confirmation, PDC, Escalation and Issue Tracker remain reachable; source-specific cards, controls, readable headings and action positions are retained.
- Audit evidence ID: 12-module-configuration

### ADM-MOD-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-MOD-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-STATE-12A — Visit Config

**STATE_PARITY · P1 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Missing the two current-time summary panels. Local replaces Yes/No radio group with select, changes four-column fields to two columns, adds purple heading and description, and loses required-marker parity.
- Audit evidence ID: 12a-visit-config

### ADM-STATE-12B — Monthend Config

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Manual mode content and radio choices are largely present. Local loses the client pill, adds spacing and height, and pushes ODM Report Email below the viewport. Automatic schedule and lower recipient controls are not covered.
- Audit evidence ID: 12b-monthend-config

### ADM-STATE-12C — Client Confirmation Config

**STATE_PARITY · P1 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: One plain local status row omits the yellow completed/validation-failure variants, green/red counts and conditional download icons. Added purple heading and compressed content. Sample values are not treated as data-sync errors.
- Audit evidence ID: 12c-client-confirmation-config

### ADM-STATE-12D — Pdc Config

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Local substitutes checkbox for switch, omits auto-clear/helper guidance, adds Save Changes in read-only state, uses plain Active text instead of badge and Remove text instead of trash icon. Enlarged stacked cards and purple heading bars differ substantially.
- Audit evidence ID: 12d-pdc-config

### ADM-STATE-12E — Escalation Config

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Both process/matrix lists and actions exist. Local moves search to separate rows, loses explanatory copy and destructive red Delete styling, changes Process to Name, and greatly enlarges cards with dark-on-purple headings. Create/View/Edit branches remain unverified.
- Audit evidence ID: 12e-escalation-config

### ADM-STATE-12F — Issue Tracker Config

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Switch replaced by checkbox; helper copy, card layout and Save alignment differ. Local heading computed colour rgb(31,41,55) on rgb(92,37,141), 19px/700; visually hard to read. No switch changes saved.
- Audit evidence ID: 12f-issue-tracker-config

### ADM-DEEP-09 — Default Edit Configuration expanded controls; Visit time dropdowns; all Monthend/CC manual/automatic schedule combinations and lower recipient controls

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-DEEP-10 — Client Confirmation upload dialog, no-file/selected-file/error states and failed-row download presentation

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-DEEP-11 — PDC Add Ops User dialog, lookup/no-results/selection, edit mode and remove confirmation

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-DEEP-12 — Escalation Process Create/View/Edit; Matrix New/View/Edit; add/remove/reorder levels and unsaved dismissal

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-MOD-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-MOD at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-MOD; Q-SCOPE; Q-ENV

### ADM-MOD-VISIT-BR01 — VISIT feature rules

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-VISIT before this configuration feature; record decisions and derive sequence/date/role/error cases.
- Expected: Expected outcomes remain pending confirmation; UI-only cases may continue independently.
- Gate: Q-VISIT; Q-SCOPE; Q-ENV

### ADM-MOD-MONTHEND-BR01 — MONTHEND feature rules

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-MONTHEND before this configuration feature; record decisions and derive sequence/date/role/error cases.
- Expected: Expected outcomes remain pending confirmation; UI-only cases may continue independently.
- Gate: Q-MONTHEND; Q-SCOPE; Q-ENV

### ADM-MOD-CC-BR01 — CC feature rules

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-CC before this configuration feature; record decisions and derive sequence/date/role/error cases.
- Expected: Expected outcomes remain pending confirmation; UI-only cases may continue independently.
- Gate: Q-CC; Q-SCOPE; Q-ENV

### ADM-MOD-PDC-BR01 — PDC feature rules

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-PDC before this configuration feature; record decisions and derive sequence/date/role/error cases.
- Expected: Expected outcomes remain pending confirmation; UI-only cases may continue independently.
- Gate: Q-PDC; Q-SCOPE; Q-ENV

### ADM-MOD-ESC-BR01 — ESC feature rules

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-ESC before this configuration feature; record decisions and derive sequence/date/role/error cases.
- Expected: Expected outcomes remain pending confirmation; UI-only cases may continue independently.
- Gate: Q-ESC; Q-SCOPE; Q-ENV

### ADM-MOD-ISSUE-BR01 — ISSUE feature rules

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-ISSUE before this configuration feature; record decisions and derive sequence/date/role/error cases.
- Expected: Expected outcomes remain pending confirmation; UI-only cases may continue independently.
- Gate: Q-ISSUE; Q-SCOPE; Q-ENV

## 13. Portfolio Transfer

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-PORT-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 13-portfolio-transfer

### ADM-PORT-02 — Portfolio upload outcome variants

**VISUAL · P1 · NOT_RUN**

- Steps: Load local history samples with zero rejects and with validation failures.
- Expected: Failed download appears only in applicable failed rows; red failure styling, count colours and green labelled Complete • 100% presentation match this reference.
- Audit evidence ID: 13-portfolio-transfer

### ADM-PORT-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-PORT-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-STATE-13A — Portfolio Upload

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Matching 600px dialog, file formats, drop zone, template download and footer actions. Local is shorter, has different spacing, template button treatment and footer button sizes. No file selection/upload performed; other upload variants are not inferred from this one.
- Audit evidence ID: 13a-portfolio-upload

### ADM-DEEP-13 — Portfolio upload selected-file, invalid-file, retry and result states

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-PORT-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-PORT at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-PORT; Q-SCOPE; Q-ENV

## 14. Bulk Document Upload

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-BDOC-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 14-bulk-document-upload

### ADM-BDOC-02 — Bulk document toolbar

**VISUAL · P1 · NOT_RUN**

- Steps: Open Bulk Document Upload with no file selected; inspect guidance and toolbar.
- Expected: Yellow guidance banner and single-row document-type/file/upload/Limbo arrangement match; accepted types and size guidance are transcribed, not guessed.
- Audit evidence ID: 14-bulk-document-upload

### ADM-BDOC-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-BDOC-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-DEEP-14 — Document-type options; file selection; Limbo list, matching/detail dialogs and empty/error states

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-BDOC-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-BDOC at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-BDOC; Q-SCOPE; Q-ENV

## 15. GRN Upload

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-GRN-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 15-grn-upload

### ADM-GRN-02 — GRN upload outcomes

**VISUAL · P1 · NOT_RUN**

- Steps: Load GRN history samples with successful and rejected rows.
- Expected: GRN-specific status, rejection counts, conditional failed-file actions and labelled progress match; generic green failure badges are not substituted.
- Audit evidence ID: 15-grn-upload

### ADM-GRN-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-GRN-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-DEEP-15 — GRN-specific upload dialog/template guidance and file/result variants

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-GRN-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-GRN at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-GRN; Q-SCOPE; Q-ENV

## 16. CN/Advance Upload

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-CN-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 16-cn-advance-upload

### ADM-CN-02 — CN/Advance upload outcomes

**VISUAL · P1 · NOT_RUN**

- Steps: Load success and rejection samples in CN/Advance Upload.
- Expected: Column widths, status variants, red rejection counts and conditional downloads match the CN/Advance reference.
- Audit evidence ID: 16-cn-advance-upload

### ADM-CN-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-CN-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-DEEP-16 — CN/Advance-specific upload dialog and subtype-dependent fields/results

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-CN-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-CN at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-CN; Q-SCOPE; Q-ENV

## 17. Payment Receipt Upload

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-PAY-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 17-payment-receipt-upload

### ADM-PAY-02 — Payment receipt upload outcomes

**VISUAL · P1 · NOT_RUN**

- Steps: Load successful and validation-failure receipt upload samples.
- Expected: Failure badges and rejected counts use the reference treatment; progress is labelled and download actions depend on outcome.
- Audit evidence ID: 17-payment-receipt-upload

### ADM-PAY-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-PAY-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-DEEP-17 — Payment Receipt-specific upload dialog, file/results and failure-detail states

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-PAY-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-PAY at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-PAY; Q-SCOPE; Q-ENV

## 18. Customer Portfolio Transfer

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-CPORT-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 18-customer-portfolio-transfer

### ADM-CPORT-02 — Customer portfolio outcomes

**VISUAL · P1 · NOT_RUN**

- Steps: Inspect customer-transfer success and failure samples against this page’s own reference.
- Expected: Keep the reference’s green validation-failure styling on this page; preserve conditional Failed actions, count colours and labelled progress. Do not impose another upload page’s colours.
- Audit evidence ID: 18-customer-portfolio-transfer

### ADM-CPORT-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-CPORT-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-DEEP-18 — Customer-transfer upload dialog, file/results and lookup/assignment variants

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-CPORT-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-CPORT at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-CPORT; Q-SCOPE; Q-ENV

## 19. Group Master

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-GRP-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 19-group-master

### ADM-GRP-02 — Group list and form

**VISUAL · P1 · NOT_RUN**

- Steps: Open Group Master, Create New, then cancel.
- Expected: List actions match; form is the reference 500px single-column layout with Group Name, Group Value, full-width Description and Save Group.
- Audit evidence ID: 19-group-master

### ADM-GRP-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-GRP-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-STATE-19A — Group Create

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Same three fields, but source is a 500px single-column modal with full-width description and Save Group. Local is 720px, two columns, half-width description, and Save.
- Audit evidence ID: 19a-group-create

### ADM-GRP-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-GRP at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-GRP; Q-SCOPE; Q-ENV

## 20. Customer Master

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-CUST-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 20-customer-master

### ADM-CUST-02 — Customer table action placement

**VISUAL · P1 · NOT_RUN**

- Steps: Open Customer Master with long customer names and wide addresses; inspect initial and horizontally scrolled table.
- Expected: Actions/Edit are first and discoverable at the initial position; all reference columns are present and no columns overlap or disappear.
- Audit evidence ID: 20-customer-master

### ADM-CUST-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-CUST-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-STATE-20A — Customer Create

**STATE_PARITY · P1 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Source is an 850px two-column scrollable form; local is 900px three columns. Enter placeholders become field-specific text, selector affordances differ, and source header/footer spacing and scroll treatment are not matched. Source lower fields/options not fully inspected.
- Audit evidence ID: 20a-customer-create

### ADM-STATE-20B — Customer Bulk

**STATE_PARITY · P1 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Wrong table schema: Count and File Name are replaced by Company and Progress, Status is relocated, and failed-file download icons are missing for rejected rows. Upload File becomes Bulk Upload. This is a linked page, beyond the 33 menu landing pages.
- Audit evidence ID: 20b-customer-bulk

### ADM-DEEP-19 — Full lower Create/Edit Customer form; lookup dependencies; Customer Bulk Upload dialog and result details

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-CUST-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-CUST at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-CUST; Q-SCOPE; Q-ENV

## 21. Customer Contacts

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-CCON-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 21-customer-contacts

### ADM-CCON-02 — Customer contact schema

**VISUAL · P1 · NOT_RUN**

- Steps: Open Customer Contacts with multiple sample customers.
- Expected: Table order is Name, Email, Phone, Customer, Actions; extra Department column is not inserted; create form preserves full-width Customer lookup.
- Audit evidence ID: 21-customer-contacts

### ADM-CCON-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-CCON-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-STATE-21A — Customer Contact Create

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Nine fields present, but Customer should span full width; all following field pairings shift. Local is 720px instead of 800px and Save replaces Save Contact. Dropdown option inventories remain unverified.
- Audit evidence ID: 21a-customer-contact-create

### ADM-DEEP-20 — Customer search/no-results/selection; full gender/department lists; edit prefill

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-CCON-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-CCON at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-CCON; Q-SCOPE; Q-ENV

## 22. Template Master

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-TPL-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 22-template-master

### ADM-TPL-02 — Template table schema

**VISUAL · P1 · NOT_RUN**

- Steps: Open Template Master with Email and WhatsApp samples and long token-bearing subjects.
- Expected: Actions precedes other fields; Description and Schedule are present; extra Status/Preview/other unsupported actions are not substituted. Long tokens remain inspectable.
- Audit evidence ID: 22-template-master

### ADM-TPL-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-TPL-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-STATE-22A — Template Edit

**STATE_PARITY · P2 · REFERENCE_BLOCKED**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: Obtain a working reference editor or approved editor screenshots/specification before defining field-level expected results.
- Gate: REF-TEMPLATE
- Audit evidence ID: 22a-template-edit

### ADM-DEEP-21 — Working Email/WhatsApp editor and all token/preview variants; current first Edit attempt is reference-blocked

**DISCOVERY · P1 · REFERENCE_BLOCKED**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-TPL-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-TPL at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-TPL; Q-SCOPE; Q-ENV

## 23. Email Sender SMTP Setup

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-SMTP-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 23-smtp-setup

### ADM-SMTP-02 — SMTP setup guidance and masking

**VISUAL · P1 · NOT_RUN**

- Steps: Open SMTP Setup without revealing or copying credentials.
- Expected: Account categories, client heading, integration guidance/link, masked fields and reveal affordances match. Use synthetic credentials for any local reveal test.
- Audit evidence ID: 23-smtp-setup

### ADM-SMTP-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-SMTP-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-DEEP-22 — Provider-specific credential form and synthetic local masked/reveal/error states; do not expose live secrets

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-SMTP-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-SMTP at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-SMTP; Q-SCOPE; Q-ENV

## 24. Email Sender Account Setup

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-SEND-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 24-sender-account

### ADM-SEND-02 — Sender account setup

**VISUAL · P1 · NOT_RUN**

- Steps: Open Email Sender Account Setup; inspect headings and the two account categories.
- Expected: Reference purpose guidance, client badge, columns and Edit controls match; unsupported Sender Account Type column and paging are not added.
- Audit evidence ID: 24-sender-account

### ADM-SEND-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-SEND-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-DEEP-23 — Sender edit, verification/OTP/test-email dialogs with synthetic local data

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-SEND-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-SEND at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-SEND; Q-SCOPE; Q-ENV

## 25. Strategy Manager

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-STR-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 25-strategy-manager

### ADM-STR-02 — Strategy list density and actions

**VISUAL · P1 · NOT_RUN**

- Steps: Open Strategy Manager with long names, multiple statuses and enough samples for two pages.
- Expected: Count, filters, purple action styling and reference row density match; Preview/Edit/Pause/Delete do not wrap into inflated rows.
- Audit evidence ID: 25-strategy-manager

### ADM-STR-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-STR-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-STATE-25A — Strategy Create

**STATE_PARITY · P1 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Local adds top Back/Cancel controls, changes purple actions to blue and Running to Active, omits template trash and several required markers, enables Notification Mode before template selection, and places Schedule beside Notification Settings instead of the full-width initial prompt. Dependent target/template/schedule branches not verified.
- Audit evidence ID: 25a-strategy-create

### ADM-DEEP-24 — Strategy Preview/Edit; Email Sender tab; target/reminder options; all template-specific scheduling/filter branches; add/remove template cards

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-STR-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-STR at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-STR; Q-SCOPE; Q-ENV

## 26. Invoice Upload

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-IUP-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 26-invoice-upload

### ADM-IUP-02 — Invoice upload history

**VISUAL · P1 · NOT_RUN**

- Steps: Open Invoice Upload with successful and failed-history samples.
- Expected: Create New is outlined; download icons and conditionally visible failed downloads match; progress and status styling are consistent with the reference.
- Audit evidence ID: 26-invoice-upload

### ADM-IUP-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-IUP-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-STATE-26A — Invoice Create

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: 24 visible fields, three-column grid, labels, placeholders and Save Invoice align closely. Missing search icons on disabled assignment fields, native date formatting/icons, spacing and button dimensions differ. Lookup results, date-picker states and validations not tested.
- Audit evidence ID: 26a-invoice-create

### ADM-DEEP-25 — All Create Invoice fields including below-fold content; customer-dependent assignment/lookups; date pickers; invoice bulk upload variants

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-IUP-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-IUP at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-IUP; Q-SCOPE; Q-ENV

## 27. Invoice reallocation

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-IRE-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 27-invoice-reallocation

### ADM-IRE-02 — Invoice reallocation initial workflow

**VISUAL · P1 · NOT_RUN**

- Steps: Open Invoice Reallocation and inspect the search/result layout without reallocating.
- Expected: Reference invoice table includes Client Code, KAM and KAS with per-row Reallocate; unrelated bulk role/assignee/reason form is absent.
- Audit evidence ID: 27-invoice-reallocation

### ADM-IRE-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-IRE-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-DEEP-26 — Search results/no-results; per-row Reallocate dialog; candidate assignee options and confirmation/cancel UI

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-IRE-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-IRE at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-IRE; Q-SCOPE; Q-ENV

## 28. Invoice Deletion

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-IDEL-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 28-invoice-deletion

### ADM-IDEL-02 — Invoice deletion initial workflow

**VISUAL · P1 · NOT_RUN**

- Steps: Open Invoice Deletion with a fresh local state before searching.
- Expected: Initial state is the reference search-only view; seeded results and bulk-deletion reason forms do not appear before the relevant interaction.
- Audit evidence ID: 28-invoice-deletion

### ADM-IDEL-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-IDEL-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-DEEP-27 — Search/results/no-results; applicable delete dialog and cancellation; never assume a Delete click is non-mutating

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-IDEL-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-IDEL at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-IDEL; Q-SCOPE; Q-ENV

## 29. Change Password - Admin

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-PWD-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 29-change-password

### ADM-PWD-02 — Admin password selection view

**VISUAL · P1 · NOT_RUN**

- Steps: Open Change Password—Admin without entering a password.
- Expected: Reference compact centered selection card is retained; no extra tab, full-width nested panel or unreadable purple heading is introduced.
- Audit evidence ID: 29-change-password

### ADM-PWD-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-PWD-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-DEEP-28 — Selected-user reset form and profile self-password form; synthetic local strength/error/reveal states

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-PWD-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-PWD at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-PWD; Q-SCOPE; Q-ENV

## 30. Client Master

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-CLIENT-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 30-client-master

### ADM-CLIENT-02 — Client account summary

**VISUAL · P1 · NOT_RUN**

- Steps: Open Client Master with synthetic parent/subclient samples.
- Expected: Logo and edit affordance, renewal/status chips, top action placement and subclient table match; duplicate empty-state text and unsupported tabs are absent.
- Audit evidence ID: 30-client-master

### ADM-CLIENT-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-CLIENT-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-STATE-30A — Subclient Create

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Source is 600px single-column; local is 720px two-column, with smaller footer buttons. The same three labels/placeholders exist. Local keyboard spot check passed: initial focus on close, Shift+Tab stayed inside modal, Escape closed it and restored focus to Create Sub Client.
- Audit evidence ID: 30a-subclient-create

### ADM-DEEP-29 — Logo edit; Show Deleted; subclient detail/edit and limit/status states if exposed by the reference

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-CLIENT-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-CLIENT at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-CLIENT; Q-SCOPE; Q-ENV

## 31. Audit Retention & Purge

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-RET-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 31-audit-retention

### ADM-RET-02 — Retention layout and context

**VISUAL · P1 · NOT_RUN**

- Steps: Open Audit Retention & Purge without changing any control.
- Expected: Compact policy, override and run-purge sections include field guidance and last-purge timestamp/reason; important content is not hidden by oversized cards.
- Audit evidence ID: 31-audit-retention

### ADM-RET-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-RET-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-DEEP-30 — Per-entity overrides, purge preview/history and confirmation/error states; use mocked local results

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-RET-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-RET at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-RET; Q-SCOPE; Q-ENV

## 32. Audit Trail

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-TRAIL-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 32-audit-trail

### ADM-TRAIL-02 — Audit Trail empty/filter state

**VISUAL · P1 · NOT_RUN**

- Steps: Open Audit Trail with empty sample results, then locally filter populated samples.
- Expected: Six reference filters, table columns, Search/Export placement and a single coherent empty state match; no duplicate instructions imply a second result area.
- Audit evidence ID: 32-audit-trail

### ADM-TRAIL-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-TRAIL-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-DEEP-31 — Full entity chooser; date boundaries; record-detail field variants; export presentation with synthetic data

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-TRAIL-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-TRAIL at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-TRAIL; Q-SCOPE; Q-ENV

## 33. Help & Support

Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.

### ADM-HELP-01 — Open, deep link and active navigation

**NAVIGATION · P1 · NOT_RUN**

- Steps: Open via Admin menu; record URL; reload local deep link; navigate away and return.
- Expected: Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.
- Audit evidence ID: 33-help-support

### ADM-HELP-02 — Help landing layout

**VISUAL · P1 · NOT_RUN**

- Steps: Open Help & Support; inspect hero/search/categories and locally search for a known and unknown article.
- Expected: Hero has the reference inset and six category cards per desktop row; result and empty states are clear and preserve the help navigation.
- Audit evidence ID: 33-help-support

### ADM-HELP-03 — Viewport, long-content and zoom checks

**RESPONSIVE · P2 · NOT_RUN**

- Steps: Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.
- Expected: No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.
- Gate: Q-DEVICE

### ADM-HELP-04 — Keyboard and semantic checks

**ACCESSIBILITY · P1 · NOT_RUN**

- Steps: Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.
- Expected: Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.
- Gate: Q-A11Y

### ADM-STATE-33A — Create Ticket

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Same category and priority options, subject/description fields. Local adds Attachment block absent from source and longer description placeholder, different header/close/footer styling.
- Audit evidence ID: 33a-create-ticket

### ADM-STATE-33B — Feedback

**STATE_PARITY · P2 · NOT_RUN**

- Steps: Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.
- Expected: The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: Visible feedback rating, type, module, subject and body fields closely match; same24px layout offset. Footer/options not fully tested.
- Audit evidence ID: 33b-feedback

### ADM-DEEP-32 — Categories/articles/back navigation; ticket list/detail/reply/status variants; feedback dropdowns/footer and errors

**DISCOVERY · P1 · REFERENCE_PENDING**

- Steps: Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.
- Expected: Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.
- Gate: Reference access; relevant module business-rule question

### ADM-HELP-BR01 — Confirm rules, then test functional boundaries

**BUSINESS_RULE · P1 · RULE_PENDING**

- Steps: Ask Q-HELP at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.
- Expected: Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.
- Gate: Q-HELP; Q-SCOPE; Q-ENV

## Business-question queue

Only Q-SCOPE and the first Branch geography decision have been asked now. Ask queued questions when their module begins, not as one large questionnaire. Split compound module questions into short batches when needed.

### Q-SCOPE — Asked

Both design/UI and separate future functional/business-rule cases, or design/UI only? Until answered, functional cases are a proposed backlog, not authorized execution.

Answer / owner / date: Pending.

### Q-DEVICE — Queued

Which desktop/mobile viewports and browsers are supported? Is 200% zoom part of acceptance? Proposed planning matrix is 1440×1000, 1280×800 and 390×844.

Answer / owner / date: Pending.

### Q-A11Y — Queued

What formal accessibility target and supported assistive technologies should be used? The plan currently includes practical keyboard/label/readability checks, not certification.

Answer / owner / date: Pending.

### Q-ENV — Queued

Before any functional run: which disposable test tenant, roles, synthetic data and reset procedure are approved, and which saves/uploads/emails/deletions/purges may actually execute?

Answer / owner / date: Pending.

### Q-DASH — Queued

Which records/timezone define each dashboard count and activity chart, and how fresh must they be?

Answer / owner / date: Pending.

### Q-BRN — Asked (geography only)

Does pincode selection autofill City/State/Country/Region, and are those fields read-only? Also confirm Branch Code uniqueness scope and GST requirements before their validation tests.

Answer / owner / date: Pending.

### Q-HOL — Queued

How do state-specific holidays and weekly offs combine; are duplicate date/state entries allowed, and are past-date edits permitted?

Answer / owner / date: Pending.

### Q-BNK — Queued

Is Bank Name unique after trimming/case normalization, and what happens when a referenced bank is renamed or deleted?

Answer / owner / date: Pending.

### Q-ICC — Queued

Which contact fields are mandatory, which email/phone uniqueness scope applies, and can an internal contact exist without a user account?

Answer / owner / date: Pending.

### Q-INVPR — Queued

Are custom aging buckets required to be consecutive and non-overlapping; which date drives aging? Confirm disposition transitions and invoice-purge eligibility separately.

Answer / owner / date: Pending.

### Q-DOC — Queued

What makes a document mandatory, which file types/sizes apply per category, and may a document type in use be deleted?

Answer / owner / date: Pending.

### Q-ROLE — Queued

Which roles/display names are fixed or editable, what scope do renamed labels affect, and which assignments are allowed?

Answer / owner / date: Pending.

### Q-USR — Queued

Which contact/role/hierarchy combinations are valid, what are the login-ID uniqueness rules, and what should suspension and credential sending do?

Answer / owner / date: Pending.

### Q-NOTIF — Queued

Does toggling save immediately; who receives each channel/event, and are there mandatory notifications an Admin cannot disable?

Answer / owner / date: Pending.

### Q-SUB — Queued

Which customers/documents qualify for each submission strategy; how do overlapping strategies, Agent Selection and sender/recipient rules interact?

Answer / owner / date: Pending.

### Q-MOD — Queued

Confirm business rules separately for Visit targets/time windows, Monthend/CC sequencing, PDC auto-clear, escalation routing and Issue Tracker hierarchy. See the dedicated configuration questions below.

Answer / owner / date: Pending.

### Q-PORT — Queued

Which invoice ownership fields may be transferred, how are inactive users handled, and is a mixed-validity file partially accepted or entirely rejected?

Answer / owner / date: Pending.

### Q-BDOC — Queued

How are documents matched to invoices/customers, when do they go to Limbo, and are duplicates rejected or replaced? Confirm file count/type/size limits.

Answer / owner / date: Pending.

### Q-GRN — Queued

What invoice identifiers and GRN date constraints apply, and may an existing GRN date be replaced?

Answer / owner / date: Pending.

### Q-CN — Queued

How are credit notes versus advances identified, signed, matched and allocated; are partial allocations and duplicate references allowed?

Answer / owner / date: Pending.

### Q-PAY — Queued

How are receipts identified and allocated, which amount/date rules apply, and how are duplicates, partial and excess payments handled?

Answer / owner / date: Pending.

### Q-CPORT — Queued

Does transferring a customer also move existing invoices and contacts, or only future ownership; how are conflicting assignments handled?

Answer / owner / date: Pending.

### Q-GRP — Queued

Must Group Name/Value be unique, may customers belong to multiple groups, and what happens on deletion of a group in use?

Answer / owner / date: Pending.

### Q-CUST — Queued

Which identity/address/category/assignment fields are mandatory; what is the uniqueness scope, and how do Agent/Manager/KAM/KAS choices depend on each other?

Answer / owner / date: Pending.

### Q-CCON — Queued

Can one contact belong to multiple customers, what makes a contact eligible for communication, and what email/phone duplication rules apply?

Answer / owner / date: Pending.

### Q-TPL — Queued

Which tokens and channel-specific fields are supported, how are invalid tokens handled, and are templates versioned or activated after editing? A working reference editor is also needed.

Answer / owner / date: Pending.

### Q-SMTP — Queued

Which providers/authentication modes are supported, who may view/change credentials, and what connection/test-email results are expected?

Answer / owner / date: Pending.

### Q-SEND — Queued

How is a sender selected/verified, what is the OTP expiry/resend/attempt policy if applicable, and what fallback sender is used?

Answer / owner / date: Pending.

### Q-STR — Queued

Which target/reminder/template combinations are valid, how are overlapping schedules prioritized, and what do pause/resume and removal do to already scheduled messages?

Answer / owner / date: Pending.

### Q-IUP — Queued

Confirm invoice uniqueness scope, mandatory fields, amount precision, tax/base/outstanding relationships and the due-date/credit-period calculation.

Answer / owner / date: Pending.

### Q-IRE — Queued

Which invoices/roles are eligible for reallocation, how do existing activities/tasks move, and is confirmation/audit history required?

Answer / owner / date: Pending.

### Q-IDEL — Queued

Which invoice states are deletable, is deletion soft or permanent, what linked data is affected, and is a reason/approval required?

Answer / owner / date: Pending.

### Q-PWD — Queued

What password policy applies, who may reset whom, is force-change-at-next-login required, and are existing sessions invalidated?

Answer / owner / date: Pending.

### Q-CLIENT — Queued

Which parent/subclient settings and data are inherited or isolated, what limits apply, and how do renewal/deactivation/deletion behave?

Answer / owner / date: Pending.

### Q-RET — Queued

What retention periods and overrides are allowed, what is the cutoff/timezone, and how do dry-run counts, legal holds, purge eligibility and history work?

Answer / owner / date: Pending.

### Q-TRAIL — Queued

Which events/fields must be audited, who may view/export them, what is masked, and what timezone/date boundaries and retention rules apply?

Answer / owner / date: Pending.

### Q-HELP — Queued

Which ticket categories/priorities and attachment rules apply, who sees each ticket, and what are the ticket statuses, reply permissions and feedback rules?

Answer / owner / date: Pending.

### Q-VISIT — Queued

How are daily visit/RPC targets counted, what start/end times and timezone are allowed, and what happens outside the window?

Answer / owner / date: Pending.

### Q-MONTHEND — Queued

Confirm calendar/fiscal-year scheduling, manual/automatic combinations, valid month-end days, same/different CC dates, parent/subclient scope and ODM recipients.

Answer / owner / date: Pending.

### Q-CC — Queued

Which Monthend cycle can a confirmation target, what sequence/cutoffs apply, how are repeats/corrections treated, and how are accepted/rejected rows determined?

Answer / owner / date: Pending.

### Q-PDC — Queued

What event/date starts auto-clear, is zero/blank meaningful, what transitions and user roles are allowed, and what happens when PDC is disabled?

Answer / owner / date: Pending.

### Q-ESC — Queued

Are approval levels sequential or parallel, who may approve, how do rejection/rework/timeout behave, and what happens when an active matrix changes?

Answer / owner / date: Pending.

### Q-ISSUE — Queued

When does the reporting manager precede the matrix, what happens without a manager, and how are existing issues affected by configuration changes?

Answer / owner / date: Pending.

## Exit criteria

- Every menu route and linked state has a case or an explicit blocker; every field and dropdown branch has a populated matrix or a named open question.
- All P0/P1 UI cases pass; remaining visual deviations are explicitly accepted by the owner. No exact-parity claim for unobserved states.
- All critical dialogs pass focus, close/cancel, scroll and sample-only terminal-action checks. Supported viewport/browser targets are confirmed.
- Defects have before/after evidence and retest results. Fixes to shared CSS/dialogs/tables are regressed across every consuming module.
- Functional signoff is separate: approved environment and data, confirmed rules, positive/negative/boundary/permission/integration cases, and evidence of outcomes plus cleanup.
- Final traceability lists executed/not-run/blocked cases, open questions, accepted deviations and coverage gaps. The plan itself is not a signoff.

## Execution record

Use test-cases.json as the editable tracker or import its fields into the selected test-management system. Defect format: Case ID; module/state; build; viewport/browser; fixture; steps; expected; actual; severity; screenshot; reference ID; business question; owner; retest result. No external tickets are created by this planning task.
