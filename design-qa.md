# LP Agent New Activity tutorial — design QA

## Comparison target

- Source visual truth:
  - Approved LP Agent tutorial treatment: `lpagent-tutorial-navigation.jpeg`, `lpagent-tutorial-features.jpeg`, and `lpagent-tutorial-inside.jpeg`.
  - User-confirmed form sequence and outcome-specific behaviour for Collected, Part Payment Made, PTP, Call Back/Email Follow up, and Delivery Challan Required.
- Browser-rendered implementation:
  - `lpagent-tutorial-new-activity.jpeg`
  - `lpagent-tutorial-ptp-activity.jpeg`
  - `lpagent-tutorial-callback-activity.jpeg`
  - `lpagent-tutorial-delivery-challan-activity.jpeg`
  - `lpagent-tutorial-header-fixed.jpeg`
- Full-view comparison evidence: `lpagent-new-activity-tutorial-comparison.jpg`.
- Approved-source pixels: 1405 x 768.
- Implementation pixels / CSS viewport: 1405 x 768 and 1280 x 720 at device scale 1.
- Browser and states: Safari; opened New Activity form, initial Activity Type/Sub Status guidance, PTP, Call Back/Email Follow up, Delivery Challan Required, and Part Payment Made after Activity Type was changed to Collection.

## Findings

- No actionable P0, P1, P2, or P3 findings remain.
- Entering the New Activity tutorial opens the first invoice's Update Disposition form automatically.
- The tutorial becomes selectively interactive on this step so Activity Type and Sub Status remain usable beneath the overlay.
- Outcome and System nuance copy is rendered only for the selected activity; unrelated outcome cards are absent.
- The guide cards and targeted callouts occupy separate measured lanes and do not cover the selected field, the dismissal hint, or the persistent tutorial controls.
- The complete 71px shared header remains visible while the tutorial centres the activity form and its outcome-specific fields.

## Comparison history

1. Extended the approved three-part tutorial structure without changing its category model:
   - Navigation remains the first screen.
   - More to know includes the worklist screen and the interactive New Activity walkthrough.
   - Inside Inebura retains the connected-workflow and tutorial-replay guidance.
2. Replaced the static five-outcome summary with an in-form sequence:
   - Activity Type is explained first.
   - Sub Status is explained second.
   - The spotlight then moves to the fields revealed by the selected outcome.
3. PTP moves the spotlight to PTP date and explains that the invoice remains open.
4. Call Back/Email Follow up moves the spotlight to callback date/time and gives one concise reminder-notification statement.
5. Delivery Challan Required moves the spotlight to Add to issue tracker and places its nuance panel away from the form controls.
6. Part Payment Made first prompts for Activity Type = Collection, then moves to the collection amount fields.
7. Final 1405 x 768 Safari captures show clear arrow endpoints, readable copy, and no tutorial-card collisions.
8. [P2] Centring Update Disposition scrolled the document by 19px, pushed the Customers heading under the header, and left the third-screen guide anchored away from the form.
   - Fix: the document now remains at scroll position `0`; Update Disposition gets a viewport-bounded internal scroll area, and activity guide panels default to the form-aligned top-center lane.
   - Post-fix: the shared header ends at `71.34px`, Customers begins at `85.34px`, the guide spans `342.5px–1062.5px` over the `336px–1028px` form, and deeper fields scroll inside Update Disposition.
9. [P2] At 1280 x 720, the in-flow activity panel had only 160px of usable height, leaving three Collected fields outside the tutorial viewport.
   - Fix: the activity step now uses a dedicated fixed, internally scrollable form lane from `84px–636px`, with guide and callout cards in a separate right-hand lane.
   - Post-fix: all seven Collected inputs are highlighted simultaneously; the guide spans `760px–1260px`, the callout spans `712px–982px`, and neither card overlaps the form or the other card.
10. Delivery Challan now highlights Add to issue tracker, Action Owner, and Approval Process together, with numbered guidance explaining that the selected process supplies the configured approval matrix.

## Required fidelity surfaces

- Fonts and typography: `Avenir Next`, `Segoe UI`, and Arial fallbacks preserve the approved hierarchy and professional tone.
- Spacing and layout rhythm: guide panels use safe viewport margins, measured target rectangles, alternate placement candidates, and collision penalties.
- Colors and visual tokens: the approved navy surface, purple accent, focus rings, and lighter 56% interactive overlay are preserved.
- Connector fidelity: target annotations use the existing high-resolution chalk-arrow asset rather than CSS-drawn or emoji arrows.
- Copy accuracy:
  - Part Collected describes Part Payment Made only.
  - Call Back/Email Follow up says only that the selected date and time send a reminder notification.
  - Delivery Challan Required states that an Issue is created only when Add to issue tracker remains checked.

## Interactions tested

1. `?tutorial=1` opens the LP Agent tutorial; Next reaches the activity step and opens Update Disposition automatically.
2. Activity Type and Sub Status remain clickable while the activity tutorial is active.
3. Selecting PTP reveals PTP date and replaces the tutorial copy with only the PTP outcome and nuance.
4. Selecting Call Back/Email Follow up reveals callback date/time and replaces the tutorial copy with only the callback outcome and reminder note.
5. Selecting Delivery Challan Required reveals Add to issue tracker, owner, and approval process, with only its Issue-creation nuance.
6. Selecting Part Payment Made prompts for Activity Type = Collection; choosing Collection reveals and targets the collection fields.
7. Leaving or closing the activity tutorial closes the form only when the tutorial opened it.
8. The activity step keeps both the shared header and Customers heading fully visible at document scroll position `0`.
9. PTP and other deeper outcome fields use Update Disposition's internal scroll while their guide panels remain centred over the form.
10. Leaving the activity step removes the temporary viewport constraint and closes the form when the tutorial opened it.
11. Clicking the tutorial backdrop leaves the current tutorial step open; the instructional hint now directs users to Close.
12. The scoped Close button dismisses the tutorial, while backdrop clicks and Escape do not.
13. Safari's JavaScript Console contained no error or warning entries after the final contextual renders.
14. `scripts/app.js` and `scripts/shared-header.js` passed `node --check`; all inline scripts in `LPagent.html` parsed successfully.
15. The scoped implementation passed `git diff --check`.
16. Collected submission blocks missing instrument reference, bank, and transfer date; rejects negative values, zero total collection, and totals above the invoice outstanding.
17. Delivery Challan Issue creation blocks submission until both Action Owner and Approval Process are selected; unchecking Add to issue tracker retains the documented no-Issue path.

## Final result

final result: passed

---

# Issue Tracker landing page — design QA

## Comparison target

- Source visual truth: `/var/folders/qk/bjvc8gw900scdv4cv1cgm7f00000gp/T/TemporaryItems/NSIRD_screencaptureui_VJmQiZ/Screenshot 2026-08-03 at 12.56.43 PM.png`.
- Browser-rendered implementation: `/private/tmp/issuetrackerLP-final.png`.
- Normalized full-view comparison: `/private/tmp/issuetrackerLP-final-comparison.png`.
- Viewport: 1900 x 960 CSS px at device scale 1. The source was 2000 x 1125 px; browser chrome was excluded by cropping the application region to 1900 x 960 px before comparison.
- State: Issue Tracker landing page, default list, archive closed, first pagination page.

## Findings

- No actionable P0, P1, or P2 differences remain within the requested KPI-card and invoice-table scope.
- The source's two invoice rows versus the implementation's generated data rows is expected mock-data variance; the layout, column order, labels, action placement, and pagination treatment are matched.
- [P3] The shared-header avatar state differs from the source because it reflects the local active user rather than the source session. It is outside the requested landing-page card/table scope.

## Required fidelity surfaces

- Fonts and typography: preserves the existing product typeface and hierarchy, with compact uppercase KPI labels, a strong page/table heading, and 11–12px scan-friendly table text.
- Spacing and layout rhythm: five equal lavender cards, the 280px Quick Info rail, the 16px inter-panel gap, the full-width invoice workspace, and the bottom-aligned pagination match the source composition.
- Colors and visual tokens: light lavender KPI surfaces, white card panels, pale blue-gray dividers, and the shared Inebura purple table/action treatment match the reference.
- Image quality and asset fidelity: reused the existing header logos and Bootstrap icon set; no replacement imagery or CSS-drawn assets were introduced.
- Copy and content: card labels, search placeholder, archive wording, and the ten requested invoice columns match the reference.

## Interactions tested

1. Search for `Initech` reduced the rendered list to five matching rows and updated pagination to `Showing 1–5 of 5`.
2. Show Archived toggled to Hide Archived while retaining the filtered list.
3. View issues opened the matching issue-detail route for `INV_0001`.
4. At 390px, KPI cards stack and the wide table is contained by its horizontal table wrapper rather than expanding the landing grid.
5. Browser console contained no errors. `bin/IssueTracker/js/app.js` passed `node --check`, and `git diff --check` passed.

## Comparison history

1. Replaced the original owner/matrix/sub-status table treatment with the reference's invoice dates, due date, total issues, and action layout.
2. Updated KPI wording and calculation to show aggregate Net Due in Indian currency formatting.
3. Added the purple table header, source-style sort indicators, archive label, and compact pagination controls.
4. [P2] A 1280px table initially expanded the mobile landing grid. Fix: constrained the landing-card grid item and table wrapper; the table now scrolls within its wrapper at narrow widths.

## Final result

final result: passed

---

# Agent Dashboard tutorial splash — design QA

## Comparison target

- Source visual truth:
  - Approved LP Agent treatment: `lpagent-tutorial-navigation.jpeg`, `lpagent-tutorial-features.jpeg`, and `lpagent-tutorial-inside.jpeg`.
  - Original art-direction reference: `/var/folders/qk/bjvc8gw900scdv4cv1cgm7f00000gp/T/codex-clipboard-6e6b963c-57c7-4a2c-a901-a5fd9449b2f8.png`.
  - Previous Dashboard overlay capture: `dashboard-agent-tutorial-navigation-dark-reference.jpeg`.
- Browser-rendered implementation:
  - `dashboard-agent-tutorial-navigation.jpeg`
  - `dashboard-agent-tutorial-features.jpeg`
  - `dashboard-agent-tutorial-inside.jpeg`
- Combined full-view comparison evidence: `dashboard-agent-tutorial-design-comparison.jpg`.
- Overlay-lightness comparison evidence: `dashboard-agent-overlay-lightness-comparison.jpg`.
- Approved-source pixels: 1405 x 768.
- Implementation pixels / CSS viewport: 1405 x 768 / 1405 x 768 at device scale 1.
- State: Agent Dashboard with the tutorial forced open through `?tutorial=1`; Navigation, More to know, and Inside Inebura were each captured in Safari.

The approved LP Agent implementation is the direct layout and visual-system reference. The original portrait screenshot remains the art-direction reference for a dimmed live interface, short target annotations, and a tutorial that is not a central popup.

## Findings

- No actionable P0, P1, or P2 findings remain.
- [P3] The Dashboard callouts use slightly shorter copy than the LP Agent callouts.
  - Evidence: the Dashboard has wider KPI regions and fewer toolbar controls, so each step requires only two annotations.
  - Rationale: limiting each step to two cards keeps the dense dashboard legible and prevents tutorial-card collisions.

## Comparison history

1. First Safari render:
   - Navigation placed the menu and notification annotations in separate top-left and top-right lanes.
   - More to know placed Total Net Due below its target and View Trends to the left of its target.
   - Inside Inebura placed Summary below its target and Tutorial replay to the left of the profile control.
   - No tutorial cards, target outlines, arrows, bottom hint, or persistent controls overlapped one another.
2. Final Safari evidence:
   - The target-to-arrow-to-card relationship is unambiguous in all six annotations.
   - The callout placer uses measured card rectangles, safe viewport margins, alternate cardinal placements, and fallback lanes before choosing a position.
   - The controls omit numeric `1/3`, `2/3`, and `3/3` labels while retaining section names and three understated progress bars.
3. Overlay-lightness refinement:
   - [P2] The original 74% navy overlay made the underlying KPI values, chart shapes, and card boundaries unnecessarily difficult to read.
   - Fix: reduced the overlay opacity from 74% to 60% while leaving callout panels, focus rings, arrows, and controls unchanged.
   - Post-fix evidence: `dashboard-agent-overlay-lightness-comparison.jpg` shows the same 1405 x 768 Navigation state before and after the change. Dashboard context is materially clearer, while callout contrast and target emphasis remain intact.

## Required fidelity surfaces

- Fonts and typography: `Avenir Next`, then `Segoe UI` and Arial fallbacks match the approved professional treatment. Eyebrows, titles, body copy, dismissal hint, and controls retain distinct hierarchy, weights, wrapping, and line heights.
- Spacing and layout rhythm: every step uses two callouts. Cards are clamped to safe viewport margins and the collision score penalizes overlap with targets, earlier tutorial cards, the close hint, and the bottom-right controls.
- Colors and visual tokens: the navy overlay now uses 60% opacity, preserving the dashboard context without muting KPI values and chart shapes too heavily. Blue, purple, and green accents distinguish Navigation, More to know, and Inside Inebura and remain consistent with the approved LP Agent treatment.
- Image quality and asset fidelity: connectors use the existing high-resolution `assets/tutorial/chalk-arrow-up-left.png` raster asset with short target-adjacent sizing. No custom SVG, emoji, or CSS-drawn arrow substitutes it.
- Copy and content: all tutorial statements are grounded in live Dashboard controls: module menu, notifications, Total Net Due, other KPI drill-downs, View Trends, Summary, and profile-menu tutorial replay.

## Full-view and focused comparison evidence

- The original-size 2810 x 810 side-by-side comparison confirms matching overlay treatment, card treatment, arrow style, focus rings, and bottom controls between the approved LP Agent source and Dashboard implementation.
- The original-size 2810 x 810 before/after lightness comparison confirms that only the overlay opacity changed; annotation geometry, typography, arrows, focus rings, and controls remain aligned.
- Separate 1405 x 768 Safari captures were inspected at 1:1 for each step. Additional crops were not required because callout typography, arrow endpoints, focus rings, and target controls are legible at native size.

## Interactions tested

1. `?tutorial=1` opens the Dashboard tutorial even after prior completion.
2. Next advances through Navigation, More to know, and Inside Inebura.
3. Back returns from More to know to Navigation.
4. Close and Done dismiss the overlay.
5. The shared profile-menu Tutorials action reopens the Dashboard-specific renderer.
6. The controls show section names and progress bars without numeric step fractions.
7. Clicking outside the controls leaves the Agent Dashboard tutorial open; only Close explicitly dismisses it before completion.
8. The generic Admin Dashboard tutorial follows the same close-only backdrop behaviour.
9. Escape no longer dismisses either Dashboard tutorial.
10. Safari's JavaScript Console was reopened after the lighter-overlay render; it contained no error or warning entries.
11. `scripts/dashboard-agent-tutorial.js` and `scripts/tutorial-splash.js` passed `node --check`, and the scoped page/script diff passed `git diff --check`.

## Final result

final result: passed

---

# Admin Operational Setup — design QA

## Comparison target

- Source visual truth:
  - `https://testclient.inebura.ai/admin/dashboard/invoice-setup`
  - `https://testclient.inebura.ai/admin/dashboard/document-setup`
  - `https://testclient.inebura.ai/admin/dashboard/role-display-name-setup`
  - `https://testclient.inebura.ai/admin/dashboard/user-setup`
  - `https://testclient.inebura.ai/admin/dashboard/whatsApp-declaration`
- Browser-rendered implementation:
  - `http://127.0.0.1:8765/pages/admin.html?module=invoice-preferences`
  - The remaining four screens use the same local page with their Admin module route.
- Compared at 1280 x 720 and 390 x 844 CSS pixels at device scale 1.
- Full-view evidence compared every default Operational Setup screen source-left and implementation-right.
- Focused evidence compared document creation, preset selection, role display names, the user wizard, and bulk user upload.

## Matched screens and states

1. Invoice Preferences:
   - Standard Ageing Buckets, Create Custom Groups, Customization of Activity Dispositions, and Purge Policy.
   - Create/edit/delete bucket and sub-status dialogs; editable purge controls.
2. Document Setup:
   - Source-faithful document list, category treatment, pagination, create/edit/delete dialogs, and preset selection.
3. Role and Display Name Setup:
   - Operational, Support, View, and Customer hierarchy lanes.
   - Dependent role-type and role selection with reset and submit states.
4. User Setup:
   - Team filters, search, source-style table actions, two-step create/edit wizard, and bulk upload history/modal.
5. Notification Manager:
   - Searchable notification table and live WhatsApp declaration toggles.

## Comparison history

1. [P2] The first hierarchy render compressed the source structure into four equal columns.
   - Fix: restored the Operational supervisor/manager/agent tree, separated Support and View columns, and moved Customer into its lower source lane.
2. [P2] The first user-wizard footer stretched Cancel across excess width.
   - Fix: constrained footer actions and aligned Cancel and Next to the right like the source.
3. [P2] Disabled Role Submit and Bulk Import controls looked active.
   - Fix: added the source-style muted lavender disabled treatment.
4. Final desktop and mobile review found no remaining P0, P1, or P2 issues.
5. [P3] The local user list is intentionally populated with representative dummy rows instead of reproducing a transient source loading state.
6. [P2] Activity Dispositions initially repeated empty Broad Status and Primary Status cells instead of merging each hierarchy section.
   - Fix: applied source-matched row spans to both grouping columns, including Work In Progress, No Due, Part Collected, Further Docs Required, and Collection Done.
7. [P2] Organisation Hierarchy connectors used generic level-wide lines, which incorrectly linked Agent 6 to the Manager branch and omitted the vertical Support/View chains.
   - Fix: rebuilt the Operational tree as explicit Manager and AgentCumManager branches, added branch-specific child connectors, restored Support/View vertical connectors, and matched the live node coordinates within 2 px at 1280 x 720.
8. [P1] Create User Step 2 rendered Role Type, Role, and Branch as empty text inputs, so the workflow could not be completed through dropdown selection.
   - Fix: added the source Role Type values, dependent Role options, the Gurugram branch option, Back/Next selection persistence, and a complete dummy-user save path.

## Interactions tested

1. A new document can be created and immediately appears in the document table.
2. The two-step user wizard retains step-one values and inserts the completed dummy user.
3. Custom group, disposition, document, preset, user, and bulk-upload dialogs open and close correctly.
4. Role Display Names enables its dependent controls in sequence.
5. Notification search filters the table and toggles change their visible On/Off state.
6. All five Operational Setup routes render dedicated `.opWorkspace` content.
7. At 390 px, every route retains a 390 px document width; wide tables and hierarchy content scroll inside their own regions.
8. Browser console review returned no errors or warnings.
9. `scripts/admin-operational-setup.js` and `scripts/admin-runtime.js` passed `node --check`.
10. `scripts/validate-admin-modules.js` passed all 31 menu modules and tab targets.
11. `git diff --check` passed.

## Final result

final result: passed
