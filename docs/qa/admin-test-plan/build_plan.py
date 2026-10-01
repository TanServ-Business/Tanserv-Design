"""Generate the proposed Admin test catalog. This does not execute tests."""
from pathlib import Path
import json

ROOT = Path(__file__).resolve().parent
REPO = ROOT.parents[2]
audit = json.loads((REPO / 'artifacts/admin-audit-2026-09-05/capture-manifest.json').read_text())

# One observable, high-risk acceptance target per landing page.
targets = [
 ('DASH', 'Dashboard totals and charts', 'Open the dashboard with a zero-active-user sample; compare cards and activity chart.', 'Zero totals and chart/gauge states are internally consistent; activity chart spans the reference width; card insets and labels match.'),
 ('BRN', 'Branch table and create form', 'Open Branch Master, then Create New; compare the complete form without saving.', 'Create New label, table actions, 800px reference form, field pairing and placeholders match; no unsupported Status field is added. Geographic behavior is gated by Q-BRN.'),
 ('HOL', 'Holiday one-line headings', 'Open Holiday Master; inspect tabs and table headings at 1440px and with long sample state names.', 'Tabs and reference single-line headers do not wrap; column widths and multi-state +1 badges match; create action uses the reference label.'),
 ('BNK', 'Bank row actions', 'Open Bank Master with at least two sample records; inspect each row and open create/edit forms.', 'Every applicable row presents Edit and Delete as in the reference; Create New and the Bank Name field match. Do not execute a live delete.'),
 ('ICC', 'Internal contact controls', 'Open Internal Company Contact and its create form.', 'Reference Create New label, nine visible fields, required markers, field pairing and gender/department dropdown affordances are preserved.'),
 ('INVPR', 'Invoice setup structure', 'Open each Invoice Preferences tab and inspect the aging table.', 'Select column does not dominate the table; aging names/ranges and tab labels match; custom groups, dispositions and purge policy remain separately reachable.'),
 ('DOC', 'Document list density', 'Open Document Setup with ten representative rows, including required/optional categories.', 'Create/preset/Edit/Delete actions, category badges and reference row density are represented; approximately ten rows fit the reference desktop view.'),
 ('ROLE', 'Role group layout', 'Open Role and Display Name Setup at the desktop baseline.', 'All four role groups remain in the same horizontal arrangement as the reference; Customer Roles heading uses its reference colour and connectors align.'),
 ('USR', 'User credential-action presence', 'Open User Setup with active, suspended and differing-role samples; inspect bulk and row controls.', 'Bulk Send Creds and row Send Creds are represented as sample-only UI; role badge variants and other reference actions are present. No credentials are sent.'),
 ('NOTIF', 'Notification list', 'Open Notification Manager; search for a known name and a no-result value in the local replica.', 'Four reference columns, switch appearance, result/empty states and paging match. Reference switches are not toggled because changes may save immediately.'),
 ('SUB', 'Submission strategy landing state', 'Open Invoice Submission Process on its default Strategy Manager tab.', 'Only the strategy list and Create New are shown in that initial state; Push Settings/Email Settings forms do not appear above the list.'),
 ('MOD', 'Seven configuration tabs', 'Open Module Configuration; visit each of its seven tabs locally and inspect its matching baseline.', 'Configurations, Visit, Monthend, Client Confirmation, PDC, Escalation and Issue Tracker remain reachable; source-specific cards, controls, readable headings and action positions are retained.'),
 ('PORT', 'Portfolio upload outcome variants', 'Load local history samples with zero rejects and with validation failures.', 'Failed download appears only in applicable failed rows; red failure styling, count colours and green labelled Complete • 100% presentation match this reference.'),
 ('BDOC', 'Bulk document toolbar', 'Open Bulk Document Upload with no file selected; inspect guidance and toolbar.', 'Yellow guidance banner and single-row document-type/file/upload/Limbo arrangement match; accepted types and size guidance are transcribed, not guessed.'),
 ('GRN', 'GRN upload outcomes', 'Load GRN history samples with successful and rejected rows.', 'GRN-specific status, rejection counts, conditional failed-file actions and labelled progress match; generic green failure badges are not substituted.'),
 ('CN', 'CN/Advance upload outcomes', 'Load success and rejection samples in CN/Advance Upload.', 'Column widths, status variants, red rejection counts and conditional downloads match the CN/Advance reference.'),
 ('PAY', 'Payment receipt upload outcomes', 'Load successful and validation-failure receipt upload samples.', 'Failure badges and rejected counts use the reference treatment; progress is labelled and download actions depend on outcome.'),
 ('CPORT', 'Customer portfolio outcomes', 'Inspect customer-transfer success and failure samples against this page’s own reference.', 'Keep the reference’s green validation-failure styling on this page; preserve conditional Failed actions, count colours and labelled progress. Do not impose another upload page’s colours.'),
 ('GRP', 'Group list and form', 'Open Group Master, Create New, then cancel.', 'List actions match; form is the reference 500px single-column layout with Group Name, Group Value, full-width Description and Save Group.'),
 ('CUST', 'Customer table action placement', 'Open Customer Master with long customer names and wide addresses; inspect initial and horizontally scrolled table.', 'Actions/Edit are first and discoverable at the initial position; all reference columns are present and no columns overlap or disappear.'),
 ('CCON', 'Customer contact schema', 'Open Customer Contacts with multiple sample customers.', 'Table order is Name, Email, Phone, Customer, Actions; extra Department column is not inserted; create form preserves full-width Customer lookup.'),
 ('TPL', 'Template table schema', 'Open Template Master with Email and WhatsApp samples and long token-bearing subjects.', 'Actions precedes other fields; Description and Schedule are present; extra Status/Preview/other unsupported actions are not substituted. Long tokens remain inspectable.'),
 ('SMTP', 'SMTP setup guidance and masking', 'Open SMTP Setup without revealing or copying credentials.', 'Account categories, client heading, integration guidance/link, masked fields and reveal affordances match. Use synthetic credentials for any local reveal test.'),
 ('SEND', 'Sender account setup', 'Open Email Sender Account Setup; inspect headings and the two account categories.', 'Reference purpose guidance, client badge, columns and Edit controls match; unsupported Sender Account Type column and paging are not added.'),
 ('STR', 'Strategy list density and actions', 'Open Strategy Manager with long names, multiple statuses and enough samples for two pages.', 'Count, filters, purple action styling and reference row density match; Preview/Edit/Pause/Delete do not wrap into inflated rows.'),
 ('IUP', 'Invoice upload history', 'Open Invoice Upload with successful and failed-history samples.', 'Create New is outlined; download icons and conditionally visible failed downloads match; progress and status styling are consistent with the reference.'),
 ('IRE', 'Invoice reallocation initial workflow', 'Open Invoice Reallocation and inspect the search/result layout without reallocating.', 'Reference invoice table includes Client Code, KAM and KAS with per-row Reallocate; unrelated bulk role/assignee/reason form is absent.'),
 ('IDEL', 'Invoice deletion initial workflow', 'Open Invoice Deletion with a fresh local state before searching.', 'Initial state is the reference search-only view; seeded results and bulk-deletion reason forms do not appear before the relevant interaction.'),
 ('PWD', 'Admin password selection view', 'Open Change Password—Admin without entering a password.', 'Reference compact centered selection card is retained; no extra tab, full-width nested panel or unreadable purple heading is introduced.'),
 ('CLIENT', 'Client account summary', 'Open Client Master with synthetic parent/subclient samples.', 'Logo and edit affordance, renewal/status chips, top action placement and subclient table match; duplicate empty-state text and unsupported tabs are absent.'),
 ('RET', 'Retention layout and context', 'Open Audit Retention & Purge without changing any control.', 'Compact policy, override and run-purge sections include field guidance and last-purge timestamp/reason; important content is not hidden by oversized cards.'),
 ('TRAIL', 'Audit Trail empty/filter state', 'Open Audit Trail with empty sample results, then locally filter populated samples.', 'Six reference filters, table columns, Search/Export placement and a single coherent empty state match; no duplicate instructions imply a second result area.'),
 ('HELP', 'Help landing layout', 'Open Help & Support; inspect hero/search/categories and locally search for a known and unknown article.', 'Hero has the reference inset and six category cards per desktop row; result and empty states are clear and preserve the help navigation.'),
]

# Ask these when the module begins; they are not asserted business requirements.
questions = [
 ('DASH', 'Which records/timezone define each dashboard count and activity chart, and how fresh must they be?'),
 ('BRN', 'Does pincode selection autofill City/State/Country/Region, and are those fields read-only? Also confirm Branch Code uniqueness scope and GST requirements before their validation tests.'),
 ('HOL', 'How do state-specific holidays and weekly offs combine; are duplicate date/state entries allowed, and are past-date edits permitted?'),
 ('BNK', 'Is Bank Name unique after trimming/case normalization, and what happens when a referenced bank is renamed or deleted?'),
 ('ICC', 'Which contact fields are mandatory, which email/phone uniqueness scope applies, and can an internal contact exist without a user account?'),
 ('INVPR', 'Are custom aging buckets required to be consecutive and non-overlapping; which date drives aging? Confirm disposition transitions and invoice-purge eligibility separately.'),
 ('DOC', 'What makes a document mandatory, which file types/sizes apply per category, and may a document type in use be deleted?'),
 ('ROLE', 'Which roles/display names are fixed or editable, what scope do renamed labels affect, and which assignments are allowed?'),
 ('USR', 'Which contact/role/hierarchy combinations are valid, what are the login-ID uniqueness rules, and what should suspension and credential sending do?'),
 ('NOTIF', 'Does toggling save immediately; who receives each channel/event, and are there mandatory notifications an Admin cannot disable?'),
 ('SUB', 'Which customers/documents qualify for each submission strategy; how do overlapping strategies, Agent Selection and sender/recipient rules interact?'),
 ('MOD', 'Confirm business rules separately for Visit targets/time windows, Monthend/CC sequencing, PDC auto-clear, escalation routing and Issue Tracker hierarchy. See the dedicated configuration questions below.'),
 ('PORT', 'Which invoice ownership fields may be transferred, how are inactive users handled, and is a mixed-validity file partially accepted or entirely rejected?'),
 ('BDOC', 'How are documents matched to invoices/customers, when do they go to Limbo, and are duplicates rejected or replaced? Confirm file count/type/size limits.'),
 ('GRN', 'What invoice identifiers and GRN date constraints apply, and may an existing GRN date be replaced?'),
 ('CN', 'How are credit notes versus advances identified, signed, matched and allocated; are partial allocations and duplicate references allowed?'),
 ('PAY', 'How are receipts identified and allocated, which amount/date rules apply, and how are duplicates, partial and excess payments handled?'),
 ('CPORT', 'Does transferring a customer also move existing invoices and contacts, or only future ownership; how are conflicting assignments handled?'),
 ('GRP', 'Must Group Name/Value be unique, may customers belong to multiple groups, and what happens on deletion of a group in use?'),
 ('CUST', 'Which identity/address/category/assignment fields are mandatory; what is the uniqueness scope, and how do Agent/Manager/KAM/KAS choices depend on each other?'),
 ('CCON', 'Can one contact belong to multiple customers, what makes a contact eligible for communication, and what email/phone duplication rules apply?'),
 ('TPL', 'Which tokens and channel-specific fields are supported, how are invalid tokens handled, and are templates versioned or activated after editing? A working reference editor is also needed.'),
 ('SMTP', 'Which providers/authentication modes are supported, who may view/change credentials, and what connection/test-email results are expected?'),
 ('SEND', 'How is a sender selected/verified, what is the OTP expiry/resend/attempt policy if applicable, and what fallback sender is used?'),
 ('STR', 'Which target/reminder/template combinations are valid, how are overlapping schedules prioritized, and what do pause/resume and removal do to already scheduled messages?'),
 ('IUP', 'Confirm invoice uniqueness scope, mandatory fields, amount precision, tax/base/outstanding relationships and the due-date/credit-period calculation.'),
 ('IRE', 'Which invoices/roles are eligible for reallocation, how do existing activities/tasks move, and is confirmation/audit history required?'),
 ('IDEL', 'Which invoice states are deletable, is deletion soft or permanent, what linked data is affected, and is a reason/approval required?'),
 ('PWD', 'What password policy applies, who may reset whom, is force-change-at-next-login required, and are existing sessions invalidated?'),
 ('CLIENT', 'Which parent/subclient settings and data are inherited or isolated, what limits apply, and how do renewal/deactivation/deletion behave?'),
 ('RET', 'What retention periods and overrides are allowed, what is the cutoff/timezone, and how do dry-run counts, legal holds, purge eligibility and history work?'),
 ('TRAIL', 'Which events/fields must be audited, who may view/export them, what is masked, and what timezone/date boundaries and retention rules apply?'),
 ('HELP', 'Which ticket categories/priorities and attachment rules apply, who sees each ticket, and what are the ticket statuses, reply permissions and feedback rules?'),
]
config_questions = [
 ('VISIT', 'How are daily visit/RPC targets counted, what start/end times and timezone are allowed, and what happens outside the window?'),
 ('MONTHEND', 'Confirm calendar/fiscal-year scheduling, manual/automatic combinations, valid month-end days, same/different CC dates, parent/subclient scope and ODM recipients.'),
 ('CC', 'Which Monthend cycle can a confirmation target, what sequence/cutoffs apply, how are repeats/corrections treated, and how are accepted/rejected rows determined?'),
 ('PDC', 'What event/date starts auto-clear, is zero/blank meaningful, what transitions and user roles are allowed, and what happens when PDC is disabled?'),
 ('ESC', 'Are approval levels sequential or parallel, who may approve, how do rejection/rework/timeout behave, and what happens when an active matrix changes?'),
 ('ISSUE', 'When does the reporting manager precede the matrix, what happens without a manager, and how are existing issues affected by configuration changes?'),
]

# Uncaptured branches: baseline discovery is a gate, not a fabricated oracle.
uncovered = [
 ('DASH','Header notification and profile menus; self-password page; dashboard lower panels and each card drilldown'),
 ('HOL','Date-picker navigation/selection; weekly-off controls; full state lookup and multi-select clear/remove states'),
 ('ICC','Gender/department options; edit prefill and dismissal of existing-contact forms'),
 ('INVPR','Colour picker states; bucket toggling boundaries; disposition edit hierarchy and purge policy editor'),
 ('DOC','Category lookup options; preset multi-selection; document edit and delete-confirmation UI'),
 ('ROLE','Role/display-name dependent selections and role-assignment boundaries'),
 ('USR','Create User Step 2 and every role-dependent form; bulk upload dialog; password/suspend/delete/credential-send confirmation UI'),
 ('SUB','Apply On and Strategy Type conditional branches; full document search/list; strategy edit and sender options'),
 ('MOD','Default Edit Configuration expanded controls; Visit time dropdowns; all Monthend/CC manual/automatic schedule combinations and lower recipient controls'),
 ('MOD','Client Confirmation upload dialog, no-file/selected-file/error states and failed-row download presentation'),
 ('MOD','PDC Add Ops User dialog, lookup/no-results/selection, edit mode and remove confirmation'),
 ('MOD','Escalation Process Create/View/Edit; Matrix New/View/Edit; add/remove/reorder levels and unsaved dismissal'),
 ('PORT','Portfolio upload selected-file, invalid-file, retry and result states'),
 ('BDOC','Document-type options; file selection; Limbo list, matching/detail dialogs and empty/error states'),
 ('GRN','GRN-specific upload dialog/template guidance and file/result variants'),
 ('CN','CN/Advance-specific upload dialog and subtype-dependent fields/results'),
 ('PAY','Payment Receipt-specific upload dialog, file/results and failure-detail states'),
 ('CPORT','Customer-transfer upload dialog, file/results and lookup/assignment variants'),
 ('CUST','Full lower Create/Edit Customer form; lookup dependencies; Customer Bulk Upload dialog and result details'),
 ('CCON','Customer search/no-results/selection; full gender/department lists; edit prefill'),
 ('TPL','Working Email/WhatsApp editor and all token/preview variants; current first Edit attempt is reference-blocked'),
 ('SMTP','Provider-specific credential form and synthetic local masked/reveal/error states; do not expose live secrets'),
 ('SEND','Sender edit, verification/OTP/test-email dialogs with synthetic local data'),
 ('STR','Strategy Preview/Edit; Email Sender tab; target/reminder options; all template-specific scheduling/filter branches; add/remove template cards'),
 ('IUP','All Create Invoice fields including below-fold content; customer-dependent assignment/lookups; date pickers; invoice bulk upload variants'),
 ('IRE','Search results/no-results; per-row Reallocate dialog; candidate assignee options and confirmation/cancel UI'),
 ('IDEL','Search/results/no-results; applicable delete dialog and cancellation; never assume a Delete click is non-mutating'),
 ('PWD','Selected-user reset form and profile self-password form; synthetic local strength/error/reveal states'),
 ('CLIENT','Logo edit; Show Deleted; subclient detail/edit and limit/status states if exposed by the reference'),
 ('RET','Per-entity overrides, purge preview/history and confirmation/error states; use mocked local results'),
 ('TRAIL','Full entity chooser; date boundaries; record-detail field variants; export presentation with synthetic data'),
 ('HELP','Categories/articles/back navigation; ticket list/detail/reply/status variants; feedback dropdowns/footer and errors'),
]

cases=[]
def add(case_id,module,kind,title,steps,expected,priority='P2',dependency='',state='NOT_RUN',evidence=''):
    cases.append(dict(id=case_id,module=module,type=kind,priority=priority,title=title,precondition='Reference baseline or approved specification available; use synthetic local fixtures. No live terminal operations.',steps=steps,expected=expected,dependency=dependency,status=state,actual_result='',evidence=evidence,defect_id='',owner='',run_date=''))

shared = [
 ('SAFE','P0','Prototype isolation','Record existing local storage/network state; exercise Save/Upload/Delete/Send/Purge only in the local prototype using synthetic data; reload.','Only a clearly identified preview response occurs; no external request, real download payload, persistent business-data mutation or live effect occurs. Compare against the explicitly approved prototype contract.'),
 ('SHELL','P1','Shared navigation and branding','Inspect logos/header; expand every menu group; open/close sidebar; follow each observed link.','All 32 destinations plus Dashboard resolve; labels/order/icons/active states match; no hidden or duplicate navigation intercepts keyboard focus.'),
 ('FIELD','P1','Field-by-field form contract','For EACH observed form create a field matrix; test blank, valid, whitespace, boundary-length, invalid-format and dependent-selection values locally.','Every field has exact label/order/control type/placeholder/default/required/disabled/helper behavior. Known UI behavior matches; unconfirmed validation outcomes remain RULE_PENDING rather than guessed.'),
 ('SELECT','P1','Dropdown contract','For EACH lookup/select test open, search, no results, single/multiple selection, clear/remove, keyboard navigation, Escape and reopening.','Options/order/search/selection chips and dependent reset behavior match the approved matrix. Synthetic options exercise long labels and empty results; no live tenant data is required.'),
 ('TABLE','P1','Table and pagination contract','For EACH table test zero, one, page-size, page-size+1 records; long text; sorting each supported column; searching and clearing; horizontal scroll.','Columns/actions remain aligned and discoverable; supported sort/paging/search controls and range text are correct; unsupported controls are absent; no missing or duplicate fixture rows across pages.'),
 ('MODAL','P1','Modal state and dismissal','For EACH create/edit/view/confirmation dialog test open, title, prefill, scrolling, close, Cancel, Escape and reopen; verify focus.','Reference size/grid/footer and close behavior match; background cannot be operated when modal; focus enters, stays contained and returns. Unsaved-change behavior is gated where not specified.'),
 ('ERROR','P1','Loading/empty/error/retry states','Using local fixtures or mocks, display loading, empty, validation, failed-load, retry, success and disabled states wherever supported.','States have meaningful text, preserve recoverable input, do not overlap content or expose secrets, and match an approved reference/specification; absent baselines remain REFERENCE_PENDING.'),
 ('FILES','P1','File input and result contract','For EACH upload use synthetic valid, wrong-extension, corrupt, zero-byte, oversized, duplicate and mixed-validity fixtures only after limits/schema are confirmed.','Picker/dropzone, selected filename/remove, disabled/loading/error/result presentation match. Acceptance, row counts and partial-success outcomes are business-rule gated; no live upload is performed.'),
 ('A11Y','P1','Accessibility acceptance baseline','Inspect accessible names, label associations, heading order, focus visibility, errors, status announcements and contrast; use keyboard-only navigation.','No essential control is unlabeled or unreachable; errors are not colour-only; modal focus works. Confirm the formal accessibility target before claiming compliance.'),
 ('DATA','P1','Data and evidence hygiene','Use fabricated people, accounts, invoice identifiers, emails and secrets; record screenshot, URL, viewport, fixture and case ID.','No real credentials or sensitive exports appear in test evidence. A test cannot be marked PASS without actual result and evidence; this plan creates no execution results.'),
]
for code,priority,title,steps,expected in shared:
    add('ADM-G-'+code,'Shared', 'COMMON',title,steps,expected,priority)

for index,(code,title,steps,expected) in enumerate(targets,1):
    name=audit['notes'][index-1]['name']
    ref='01-dashboard' if index==1 else f'{index:02d}-'+audit['localRoutes'][index-2]['url'].split('module=')[1].split('&')[0]
    add(f'ADM-{code}-01',name,'NAVIGATION','Open, deep link and active navigation','Open via Admin menu; record URL; reload local deep link; navigate away and return.','Correct page and active tab/menu are restored; title/content match intended module; no blank page, loader stuck state or console error.', 'P1',evidence=ref)
    add(f'ADM-{code}-02',name,'VISUAL',title,steps,expected,'P1',evidence=ref)
    add(f'ADM-{code}-03',name,'RESPONSIVE','Viewport, long-content and zoom checks','Compare 1440×1000 baseline; test local 1280×800 and proposed 390×844, then 200% zoom with long fixtures.','No overlapping controls or lost actions; tables may scroll within their container; dialog footer remains reachable. Exact small-screen parity awaits a matching reference capture and Q-DEVICE.',dependency='Q-DEVICE')
    add(f'ADM-{code}-04',name,'ACCESSIBILITY','Keyboard and semantic checks','Apply ADM-G-A11Y and ADM-G-MODAL to all controls/states in this module.','Tab order is logical; all visible actions are operable; dialog title/labels/focus/dismissal are correct; no hidden overlay receives focus. Record failures per control.', 'P1',dependency='Q-A11Y')

state_modules={n['step']:n['name'] for n in audit['notes']}
for state in sorted(audit['states'],key=lambda s:s['key']):
    key=state['key']; num=int(key[:2]); name=state_modules[num]
    blocked=key=='22a-template-edit'; divergent=key=='06a-custom-aging'
    observed=state.get('notes',state.get('note'))
    add('ADM-STATE-'+key.split('-')[0].upper(),name,'STATE_PARITY',key.split('-',1)[1].replace('-',' ').title(),
        'Open the named state in the local module and its reference/approved baseline; use the field/dropdown/modal checklist; capture the same viewport and state.',
        ('Obtain a working reference editor or approved editor screenshots/specification before defining field-level expected results.' if blocked else 'Align fixtures to equivalent empty/populated states before judging card-level parity.' if divergent else 'The reference structure and controls are matched; no unsupported fields or substituted layouts. Regression to check: '+observed),
        'P1' if 'Major' in state['health'] else 'P2',dependency='REF-TEMPLATE' if blocked else 'Equivalent fixtures' if divergent else '',state='REFERENCE_BLOCKED' if blocked else 'REFERENCE_PENDING' if divergent else 'NOT_RUN',evidence=key)

module_names={code:audit['notes'][i]['name'] for i,(code,*_) in enumerate(targets)}
for i,(code,title) in enumerate(uncovered,1):
    add(f'ADM-DEEP-{i:02d}',module_names[code],'DISCOVERY',title,
        'Inventory every listed branch in the reference using non-mutating actions; capture the field/options/state contract, then split each distinct form or branch into child case IDs and run it locally.',
        'Every discovered branch receives a named baseline, input fixture, concrete expected result and child test. Missing access or any action that may write live data is blocked and raised; a discovery row alone cannot count as tested behavior.',
        'P1',dependency='Reference access; relevant module business-rule question',state='REFERENCE_BLOCKED' if code=='TPL' else 'REFERENCE_PENDING')

for code,question in questions:
    add(f'ADM-{code}-BR01',module_names[code],'BUSINESS_RULE','Confirm rules, then test functional boundaries',
        f'Ask Q-{code} at the start of this module. Record the answer; derive positive, negative, boundary, role/scope and cross-module cases. Execute only on an explicitly approved isolated functional environment.',
        'Pending business-owner answer; no functional outcome or backend behavior is assumed from the prototype or a screenshot. Expand into executable child cases after approval.',
        'P1',dependency=f'Q-{code}; Q-SCOPE; Q-ENV',state='RULE_PENDING')
for code,question in config_questions:
    add(f'ADM-MOD-{code}-BR01',module_names['MOD'],'BUSINESS_RULE',code+' feature rules',
        f'Ask Q-{code} before this configuration feature; record decisions and derive sequence/date/role/error cases.',
        'Expected outcomes remain pending confirmation; UI-only cases may continue independently.', 'P1',dependency=f'Q-{code}; Q-SCOPE; Q-ENV',state='RULE_PENDING')

global_questions=[
 ('Q-SCOPE','Asked','Both design/UI and separate future functional/business-rule cases, or design/UI only? Until answered, functional cases are a proposed backlog, not authorized execution.'),
 ('Q-DEVICE','Queued','Which desktop/mobile viewports and browsers are supported? Is 200% zoom part of acceptance? Proposed planning matrix is 1440×1000, 1280×800 and 390×844.'),
 ('Q-A11Y','Queued','What formal accessibility target and supported assistive technologies should be used? The plan currently includes practical keyboard/label/readability checks, not certification.'),
 ('Q-ENV','Queued','Before any functional run: which disposable test tenant, roles, synthetic data and reset procedure are approved, and which saves/uploads/emails/deletions/purges may actually execute?'),
]
qrows=[{'id':qid,'status':status,'question':q,'answer':''} for qid,status,q in global_questions]
qrows += [{'id':'Q-'+code,'status':'Asked (geography only)' if code=='BRN' else 'Queued','question':q,'answer':''} for code,q in questions]
qrows += [{'id':'Q-'+code,'status':'Queued','question':q,'answer':''} for code,q in config_questions]
routes={audit['notes'][0]['name']:{'reference_url':audit['reference'],'local_url':audit['local']+'?module=dashboard'}}
for i,note in enumerate(audit['notes'][1:]):
    routes[note['name']]={'reference_url':audit['routes'][i]['url'],'local_url':audit['localRoutes'][i]['url']}
for case in cases:
    case.update(routes.get(case['module'],{'reference_url':audit['reference'],'local_url':audit['local']+'?module=dashboard'}))
result={'title':'Admin module-wise test plan','version':'Draft 1','date':'2026-09-05','execution':'Not executed; status values are planning gates, not test results.','cases':cases,'questions':qrows}
(ROOT/'test-cases.json').write_text(json.dumps(result,indent=2))

lines=['# Admin module-wise test plan', '', '**Draft 1 · 5 September 2026 · No tests executed by this planning task**', '',
 '## Scope and safety', '',
 'Cover Dashboard, all 32 Admin menu destinations, every observed tab/popup, and the explicitly unverified nested branches from the audit. The current deliverable is a design-only prototype: test navigation and sample UI states locally; do not expect real persistence, emails, uploads, reallocation, deletion or purging. Functional/business-rule cases are a separate proposed backlog pending Q-SCOPE and confirmed rules.', '',
 'The live reference is read-only. Never click a live action merely because it might open a confirmation; inspect it safely or request an approved test environment. No credentials are revealed, no real customer data is submitted, and no external effects are authorized by this plan.', '',
 '## Sources and test oracle', '',
 '- [Audit report](../../../artifacts/admin-audit-2026-09-05/audit-report.html) and [capture manifest](../../../artifacts/admin-audit-2026-09-05/capture-manifest.json): 33 landing pages, 35 secondary states/attempts, captured on 5 September 2026. These are baseline observations, not current test passes.',
 '- [Implementation scope](../../admin-replica-coverage.md): design-only safety and known unverified branches. Its implementation claims are not treated as audited expected results.',
 '- Confirmed business-owner answers become the rule oracle. A live error or existing local defect is not the intended design. If the reference has changed, version the new baseline and do not silently overwrite expected results.', '',
 '## Execution order', '',
 '1. Shared shell, prototype isolation and fixture setup.',
 '2. Master Setup: Branch → Holiday → Bank → Internal Company Contact.',
 '3. Operational Setup: Invoice Preferences → Document Setup → Role/Display Names → User Setup → Notification Manager.',
 '4. Configuration: Submission Process → Module Configuration (Configurations → Visit → Monthend → Client Confirmation → PDC → Escalation → Issue Tracker).',
 '5. Bulk Upload: Portfolio → Bulk Documents/Limbo → GRN → CN/Advance → Payment Receipt → Customer Portfolio.',
 '6. Customers: Group → Customer Master/Bulk Upload → Customer Contacts.',
 '7. Email/Strategy: Template Master → SMTP → Sender Account → Strategy Manager.',
 '8. Invoice Master: Upload/Create → Reallocation → Deletion.',
 '9. Account/Compliance/Support: Password → Client Master → Retention/Purge → Audit Trail → Help & Support.', '',
 'Within each module: inventory states → ask at most three relevant questions → confirm baseline and fixtures → run UI cases → run approved functional cases separately → record defects → retest → run shared-component regression. Unanswered rules block only their dependent cases.', '',
 '## Case format and statuses', '',
 'Each JSON case includes ID, module, type, priority, precondition, steps, expected result, dependency, status, actual result, evidence, defect ID, owner and run date. P0 protects data/no-write boundaries; P1 covers missing/wrong workflows and essential behavior; P2 covers visual/responsive refinement.', '',
 '`NOT_RUN`: executable UI case, not yet run. `REFERENCE_PENDING`: capture/specification required. `REFERENCE_BLOCKED`: known unavailable reference. `RULE_PENDING`: business decision required. During execution use PASS, FAIL, BLOCKED or NOT_APPLICABLE with evidence/reason. The prior audit’s mismatch ratings are not execution statuses.', '',
 '## Reusable checklists', '',
 'Apply each checklist to every applicable control, not only the first row or first popup. Create child IDs such as ADM-BRN-FIELD-01 and ADM-MOD-MONTHEND-AUTO-01 once the field/branch matrix is known. Do not count a parent discovery or business-rule row as complete functional coverage.', '',
 'Field matrix columns: screen/state; label; order; control type; placeholder; default; required; editable/disabled; options/data source; dependencies; length/format/min/max; helper/error text; keyboard behavior; reference evidence; rule question ID. Unknown values stay TBD.', '',
 'Fixtures: empty, one record, multi-page records, long labels, Unicode, whitespace, missing optional values, inactive records, success/reject/partial states, masked synthetic secrets and disposable files. Business acceptance of those inputs remains gated where rules are unknown.', '',
 '## Coverage index', '', '| # | Module | Planned case rows | Rule question |', '|---|---|---:|---|']
for i,(code,*_) in enumerate(targets,1):
    name=module_names[code]; total=sum(c['module']==name for c in cases)
    lines.append(f'| {i} | {name} | {total} | Q-{code} |')
lines += ['', f'Total: **{len(cases)} planning rows** including shared checks, UI cases, discovery gates and business-rule placeholders. Counts do not represent executed tests or complete field-level coverage.', '', '## Shared cases', '']

def write_cases(items):
    for c in items:
        lines.extend([f'### {c["id"]} — {c["title"]}', '', f'**{c["type"]} · {c["priority"]} · {c["status"]}**', '',
                      f'- Steps: {c["steps"]}', f'- Expected: {c["expected"]}'])
        if c['dependency']: lines.append('- Gate: '+c['dependency'])
        if c['evidence']: lines.append('- Audit evidence ID: '+c['evidence'])
        lines.append('')
write_cases([c for c in cases if c['module']=='Shared'])
for i,(code,*_) in enumerate(targets,1):
    name=module_names[code]
    lines += [f'## {i}. {name}', '', 'Apply the shared checklists to every applicable table, form, dropdown, modal and error state below.', '']
    write_cases([c for c in cases if c['module']==name])
lines += ['## Business-question queue', '', 'Only Q-SCOPE and the first Branch geography decision have been asked now. Ask queued questions when their module begins, not as one large questionnaire. Split compound module questions into short batches when needed.', '']
for q in qrows:
    lines += [f'### {q["id"]} — {q["status"]}', '', q['question'], '', 'Answer / owner / date: Pending.', '']
lines += ['## Exit criteria', '',
 '- Every menu route and linked state has a case or an explicit blocker; every field and dropdown branch has a populated matrix or a named open question.',
 '- All P0/P1 UI cases pass; remaining visual deviations are explicitly accepted by the owner. No exact-parity claim for unobserved states.',
 '- All critical dialogs pass focus, close/cancel, scroll and sample-only terminal-action checks. Supported viewport/browser targets are confirmed.',
 '- Defects have before/after evidence and retest results. Fixes to shared CSS/dialogs/tables are regressed across every consuming module.',
 '- Functional signoff is separate: approved environment and data, confirmed rules, positive/negative/boundary/permission/integration cases, and evidence of outcomes plus cleanup.',
 '- Final traceability lists executed/not-run/blocked cases, open questions, accepted deviations and coverage gaps. The plan itself is not a signoff.', '',
 '## Execution record', '',
 'Use test-cases.json as the editable tracker or import its fields into the selected test-management system. Defect format: Case ID; module/state; build; viewport/browser; fixture; steps; expected; actual; severity; screenshot; reference ID; business question; owner; retest result. No external tickets are created by this planning task.', '']
(ROOT/'admin-module-test-plan.md').write_text('\n'.join(lines))

assert len(targets)==33 and len(questions)==33
assert len({c['id'] for c in cases})==len(cases)
assert all(c['status'] not in ('PASS','FAIL') for c in cases)
assert all(c['expected'] and c['steps'] for c in cases)
print(json.dumps({'modules':33,'cases':len(cases),'questions':len(qrows),'states':len(audit['states']),'discovery_rows':len(uncovered),'report':str(ROOT/'admin-module-test-plan.md')}))
