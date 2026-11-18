# Visit Planning knowledge-base review

Updated 18 November 2026 from Usha’s Visit Planning Module document and Devashish’s decisions in the Help and support feature chat.

Source document: https://tanservbusiness-my.sharepoint.com/:w:/g/personal/usha_rani_tanserv_com/IQAjoPmM6_T2TqUAGJJ7fRCVASmV-V_I3VoQYqLnO1M64EA

## Implemented guides

All guides use the existing Help & Support template, role labels and Important note callout. All remain browsable with role labels. Existing overlapping identifiers are retained. The document’s checklist and complete-workflow sections are covered within the task guides to avoid duplicate articles.

| ID | Article | Permitted roles | Change |
| --- | --- | --- | --- |
| KB-031 | How to create and save a visit plan draft | Agent | Updated |
| KB-032 | How to record completed visits and RPC activities | Agent | Updated |
| KB-050 | How to submit a daily plan within the configured planning window | Agent | Updated |
| KB-051 | How to provide a visit shortfall or late-submission reason | Agent | Updated |
| KB-064 | How to edit and resubmit a visit plan | Agent | Updated |
| KB-065 | How to accept or reject a submitted visit plan | Manager | Updated |
| KB-066 | How to submit a Leave or Office Work plan | Agent | Updated |
| KB-142 | How to review an Agent’s plan for a selected day | Manager, Supervisor, KAS | Updated |
| KB-156 | How to view your daily visit plan | Agent | Created |
| KB-157 | How to explain incomplete visits from the previous working day | Agent | Created |
| KB-158 | How to read visit counts and monthly planning indicators | Agent, Manager, Supervisor, KAS | Created |
| KB-159 | How to suggest customers and changes to a visit plan | Manager, Supervisor, KAS | Created |

The nine source sections map to access (156/142), windows (050), creation and plan types (031/066), shortfall reasons (051), incomplete earlier visits (157), visit monitoring (032/158), Manager review (065/159), pre-submission checklist (050), and the workflow across those task guides. KB-064 captures the subsequently confirmed resubmission rule.

## Confirmed rules

- Agents create plans. Manager, Supervisor and KAS can view drafts and suggest changes. Only Managers accept or reject plans.
- Planning times and visit/RPC targets come from the Admin configuration. Articles contain no fixed client times or target counts.
- The morning cut-off and final window closing are separate. After the morning cut-off and before closing, same-day submission requires a reason and is marked Deviation. After closing, only the next day’s plan can be submitted.
- Agents can save drafts for any future date before its submission window opens.
- While the submission window is open, Agents can update and resubmit even after a Manager decision. The Manager must record a fresh decision after the update.
- A visit shortfall is allowed with a mandatory reason. One combined reason can explain both visit shortfall and late submission.
- Leave and Office Work plans are submitted for Manager review and are exempt from visit and RPC targets. Switching to Visit, Calling or Both reapplies the relevant configured targets.
- Called activities count toward RPCs. Visited activities count as completed visits.
- Any incomplete planned visit from the previous working day requires an explanation before the new submission. One explanation covers all incomplete visits from that working day.
- The Visited summary counts completed planned visits. Unplanned completed visits are shown separately.
- For the selected month, On Time Planning % is on-time daily plans divided by submitted daily plans, multiplied by 100. Approved / Rejected counts each Agent’s daily plan once. Most Visited Customer uses completed visits.

## Deferred legacy articles

KB-099, “How manager reminder emails are scheduled for pending visit approvals,” and KB-100, “How monthly visit attendance summary is sent to HR,” are withdrawn from the published article array pending verification. Their IDs stay reserved. Their former text is preserved in Git history. This is an editorial decision to avoid publishing unverified fixed schedules, recipient details and role claims alongside the confirmed guides.

KB-066 replaces the earlier holiday/leave/rejected-calendar article with the source-backed Leave and Office Work task. A universal calendar color legend and branch/state holiday mapping remain unverified. No new holiday rules are published.

## Remaining product questions

These details are deferred for later feedback. They are not prerequisites for the guides’ confirmed instructions.

1. Manager review details. Are remarks mandatory for particular decisions, may Managers reverse a decision independently of an Agent update, and can a decision be made on a draft?
2. Suggestions. Does a removal directly change the plan or require Agent action, which date restrictions apply, and should Manager Tag Along or AI suggestions receive additional guides?
3. RPC shortfalls. What happens when recorded Called activities miss the RPC target, and how are repeated activities for the same customer counted?
4. Calendar/configuration details. Which client time zone applies, how do configured windows treat non-working days, and what is the approved calendar color legend?
5. Legacy automation. Are any monthly approval deadline, reminder schedule, HR attendance report and recipient rules still valid?

The suggestion article covers adding customer suggestions and feedback. It does not assert removal semantics, Tag Along, AI behavior, mandatory Manager remarks or decision reversal rules.

## Prototype discrepancies retained for design follow-up

The KB content follows the confirmed product rules. The underlying Visit Planner/Review behavior still needs a separate implementation pass for the following differences observed in the current source.

- Planner labels and time helpers use fixed times instead of the confirmed client configuration.
- Visit submission validation checks customer presence/reasons rather than the configured visit/RPC requirements. The previous-working-day reason panel is demo-triggered.
- Leave and Office Work hide Submit plan in the current planner, although both must be submitted for Manager review.
- The Agent page has a daily table but lacks the Review page’s Visit Details summary entry point confirmed for Agents.
- The shared review page exposes decision controls through non-Agent paths and needs explicit Supervisor/KAS approval restrictions.
- On Time Planning and approval totals currently aggregate customer rows. Most Visited Customer currently derives from planned customer rows instead of completed visits.
- Resubmission needs to invalidate the earlier Manager decision consistently in the underlying workflow.

This change implements documentation in the existing Help & Support design and Admin copy. It does not implement those Visit workflow changes.

## Verification

- All 16 targeted tests pass, including five Visit KB regression tests and the existing Admin composed/preview tests.
- UI library guard passes across 44 app documents and the canonical library, with 83 canonical declaration comparisons.
- Working and commit-candidate scripts parse. Unrelated article records match the pre-change data exactly. Non-Help generated modules are preserved.
- In the in-app Browser, all 12 article dialogs opened in both standalone and Admin Help & Support. Their role labels matched. Search returned the incomplete-visit guide and related articles. No warnings or errors were recorded in either preview tab.
- Article dialogs were checked at the normal desktop viewport and 390 × 844. The mobile dialog fits between x=24 and x=366 and its body scrolls to the final content. The background page has a 482px scroll width at 390px, confirmed against the pre-change page as an existing layout issue.
- Screenshot and browser evidence is saved locally under `artifacts/visit-planning-kbs-2026-11-18/`. Evidence includes standalone desktop/mobile dialogs, scrolled content, Admin suggestions, a fresh UI Elements reference and `browser-checks.json`.
- Screenshots are verification evidence and are not embedded in the KB articles.
- The commit includes only the Visit KB source, regenerated Help module, Admin cache version, this review log and the focused regression tests. Existing uncommitted UI and other module work is retained in the working tree.
