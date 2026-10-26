# Module Configuration Dunning Letters verification

Date: 21 October 2026. Static local design; email delivery is simulated.

## Automated checks

All 18 related suites pass. Full results, commands, stdout and durations are in `automated-tests.json`. New template-management tests include 13 cases, main management tests include 10 cases, core tests include 28 scenarios, and configuration tests include 13 cases. Coverage includes role/scope denial with non-mutation, count limits, batch changes, repeated runs, failed/partial delivery, snapshots, migrated mixed strategies, uploaded values, async uploads, exact legacy-default upgrades, report projection and typed exports. Generic Template Master retains 80 non-Dunning rows; the three staged and one legacy Dunning entry are no longer editable there. `git diff --check` and main script syntax checks pass.

## Browser checks

The user preview at port 8771 retained its existing custom template, four-stage configuration, active strategy and 28 issued letters. Only exact untouched generated DL2/DL3 defaults were upgraded to the final standard Word asset; custom uploaded DL1 and edited DL4 remained intact.

Fresh end-to-end checks used port 8773, an isolated browser origin:

1. Enabled Dunning Letters in Configurations and saved letter count **1**.
2. Confirmed one standard Word template loaded and validated, with **zero active strategies and zero issued letters**. Daily-cycle button was disabled without a strategy.
3. Previewed the actual default document as **two PDF pages**. The final-notice wording appeared on page 1. Invoice number, due date, original amount, amount due, description and total were on page 2.
4. Created and activated a North-sub-client strategy at 15 days after due date. Ran 20 October. One letter contained two invoices and its batch completed at DL1.
5. Invoice report showed two invoice rows and the exact ten requested columns. Downloaded `dunning-letters.xlsx`; separate OpenPyXL readback confirmed two rows, ten columns, numeric invoice amount and typed Excel dates.
6. Chose custom Word upload in the new template editor, uploaded the standard DOCX through the real file chooser, observed successful required-value validation and saved it to the same DL1 template.
7. Increased count from **1 to 3**. The strategy still contained only DL1 until explicitly edited. Added DL2 and DL3 on the same page. The already completed 20 October batch stayed completed.
8. Ran 21 October with partial delivery. One contact succeeded, one failed and the stage progressed. Ran 28 October: DL2 for the prior batch and DL1 for another batch produced separate letter issues with independent schedules.
9. Reduced count from **3 to 1**. The report retained all five invoice-history rows across four issued letters, including DL2 above the current count. Its DL2 filter returned exactly one invoice row.
10. Direct Agent navigation to the management tab showed Access restricted and omitted its navigation tab. The legacy report URL denied Agent access without report rows. The Client Admin legacy report URL redirected to Module Configuration → Dunning Letters.
11. Increased the isolated configuration to **5**. DL4 and DL5 loaded and validated the standard Word file. The previously uploaded DL1 remained a validated custom template with its Preview PDF button enabled.

Screenshots: `dunning-tab.jpg` (existing user preview after migration), `report-filter.jpg` (isolated historical DL2 report).

## Retained decisions and limits

Retry cutoff, missed-date pause/resume scheduling and reinstatement after removing an exclusion remain pending team confirmation. Existing guards remain in place. The supplied default Word still contains intentional payment-days, payment-instruction and sender placeholders; the UI explains how to download, complete and upload a custom copy. This design has local browser persistence and a manual daily-cycle simulation, not a production scheduler or email backend. Word import preserves supported text/basic formatting rather than all Microsoft Word layout features.
