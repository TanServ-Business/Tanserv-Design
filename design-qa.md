# Issue Tracker Design QA

## Comparison target

- Source visual truth:
  - `/Users/devashishrattan/Developer/Git/Tanserv-Design/artifacts/issue-tracker-landing-source.png`
  - `/Users/devashishrattan/Developer/Git/Tanserv-Design/artifacts/issue-tracker-detail-source.png`
- Browser-rendered implementation:
  - `/Users/devashishrattan/Developer/Git/Tanserv-Design/artifacts/issue-tracker-landing-implementation.png`
  - `/Users/devashishrattan/Developer/Git/Tanserv-Design/artifacts/issue-tracker-detail-implementation.png`
- Combined comparison evidence:
  - `/Users/devashishrattan/Developer/Git/Tanserv-Design/artifacts/issue-tracker-design-comparison.png`
- Responsive evidence:
  - `/Users/devashishrattan/Developer/Git/Tanserv-Design/artifacts/issue-tracker-landing-1024.png`
  - `/Users/devashishrattan/Developer/Git/Tanserv-Design/artifacts/issue-tracker-detail-1024.png`

## Viewport and normalization

- Desktop implementation CSS viewport: 1536 x 1024 at device scale factor 1.
- Landing source pixels: 1487 x 1058. It was proportionally fitted beside the 1536 x 1024 implementation in the combined comparison; no differences caused only by the small crop/aspect mismatch were filed.
- Detail source pixels: 1536 x 1024. Detail implementation pixels: 1536 x 1024; direct 1:1 comparison.
- Responsive implementation CSS viewport and pixels: 1024 x 768 at device scale factor 1.
- Comparison board pixels: 1536 x 1300, with source and implementation displayed together for each page.
- State: agent My Work landing view and a new/open issue requiring a supporting document, remark, and first approval submission.

## Findings

- No actionable P0, P1, or P2 findings remain.
- The landing intentionally differs from the early mock by removing `Pending With` and due-period group rows. This reflects the approved product decisions: My Work contains only the current user's items, and rows are clubbed by invoice number in one table.
- Counts and customer values differ because the implementation uses the live prototype state exercised during workflow QA; hierarchy, placement, and behavior remain equivalent.

## Required fidelity surfaces

- Fonts and typography: existing Inebura product font stack is retained. Heading weight, KPI hierarchy, table labels, action title, helper text, and right-rail metadata remain clearly distinct at both tested widths.
- Spacing and layout rhythm: the landing uses the approved overview-card and full-width table structure. Detail retains the broad working canvas and narrower reference rail, with the largest space reserved for attachments and remarks.
- Colors and visual tokens: the existing Inebura purple, neutral surfaces, semantic red/green/amber states, subtle borders, and focus-visible treatments map consistently across both pages.
- Image quality and assets: existing Inebura and Apollo source logos are reused. Bootstrap Icons supplies the visible UI icon family; no placeholder drawings or fake product imagery were introduced.
- Copy and content: language is action-led and plain: `Upload ... and add your remark`, `Waiting for ...`, `Approve and send forward`, and `No action required`. Complete reference data is moved to the right rail.
- Accessibility and interaction states: form controls have accessible names, the upload wrapper no longer nests one button inside another, tab selection is exposed, status updates use a live region, and responsive layouts avoid overlap.

## Focused comparison evidence

- Landing table: checked invoice group rows, customer code/name, invoice and issue identifiers, due state, and action button alignment against the approved direction.
- Detail work area: checked current-action banner, substatus/original remark/action owner/matrix summary, document pills, upload target, large remark field, submit controls, approval matrix, complete details, and compact before/after handoff.
- Separate crop files were not needed because the combined comparison renders both screens at a readable scale, while the full-resolution implementation captures were inspected independently for control and text detail.

## Comparison history

### Iteration 1

- Earlier P2: the shared global `header` rule painted the page-level headers purple, weakening hierarchy below the main navigation.
- Fix: page-level `.issuePageHeader` and `.detailTopbar` now explicitly use a transparent background and zero padding.
- Post-fix evidence: both 1536 x 1024 implementation captures and the final combined comparison.

### Iteration 2

- Earlier P2: at 1024 px, the action button in the last table column was partially clipped by the horizontal table width.
- Fix: the table minimum width is reduced to 960 px at the 1180 px breakpoint while preserving the desktop column proportions.
- Post-fix evidence: `artifacts/issue-tracker-landing-1024.png`; the full Action column and Open task button are visible.

## Functional QA

- Tested search and My Work/Open Issues/Closed tabs.
- Opened and cancelled the New issue dialog.
- Uploaded a supporting document, added a remark, and submitted to the first approver.
- Approved the same request through Arjun Patel, Meera Iyer, and Compliance Team; verified the current-level indicator and final closure.
- Verified `approver-dashboard.html` redirects to unified My Work.
- Verified the Approval setup route opens `escalationMatrix.html` and exposes a Back to Issue Tracker link.
- Browser console: 0 errors and 0 warnings during the final checked flow.
- Static checks: `node --check` passed for both changed JavaScript files; `git diff --check` passed.

## Follow-up polish

- P3: connect document eye icons to a real backend preview endpoint when the prototype receives service APIs; the current local prototype uses mock document metadata.

final result: passed
