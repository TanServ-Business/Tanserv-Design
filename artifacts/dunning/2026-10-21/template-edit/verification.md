# Dunning email-template revision — 21 October 2026

The existing page-5 DunningLetterOneEmail, DunningLetterTwoEmail and DunningLetterThreeEmail rows are reused. Their existing Edit pop-up keeps the original subject/message editor and gains Word attachment upload/replacement. The separate Dunning section, Word rich editor, manual field mapping and calculation controls have been removed.

Only those existing three email templates are included. The user explicitly selected no new DL4+ email rows for now. Existing additional-stage records and issued history are preserved.

## Browser verification

An isolated local origin (8772) was configured through the actual Module Configuration UI. Template Master still shows 84 Admin templates and the same Dunning rows on page 5, with zero standalone .dunningTemplates sections.

- DL1 file missing required values: automatic validation failed and Update was disabled; saved data remained unchanged.
- Complete DL1 Word file: validation passed; no Word editor/toolbar/mapping controls exist. The existing email subject was edited, Update saved both records, and reopening retained the filename and new subject.
- DL2 file without previous-letter references: validation failed with that exact missing value and disabled Update. A valid follow-up file passed, saved and reopened successfully.
- The artifact-only send-check.html uses actual saved catalogue, engine, Word files and PDF renderer. Browser-driven simulated sends used the existing DunningLetterOneEmail and DunningLetterTwoEmail source and the validated uploaded files. Generated PDF bytes were retained. See send-results.json.
- Screenshot page-five.png shows the list; final-popup.png shows the existing Edit pop-up with saved validation state; missing-previous-reference.png shows blocked validation.

## Automated verification

All 13 relevant suites passed. Full logs: automated-tests.json.

- 28 Dunning core scenarios
- 10 source-catalog/upload adapter tests
- 9 popup lifecycle tests: validation, no mutation on failure, upload races/cancellation and latest-role guards
- Actual core send flow using existing catalogue source, live edits, prior references/dates and immutable sent history
- 110 email source round trips, 84 populated previews and 26 Admin exclusions/guards
- 10 workspace/Email integrations, including safe HTML history preview and retained business merge fields
- PDF/DOCX handling, 10 Strategy Master scenarios, all report suites, configuration and Admin composition parity

Syntax and whitespace checks also pass. Changes were not committed or deployed.

## Known source/production limits

The captured DL2 email source already ends in an unfinished link tag. Its raw source is preserved; runtime drops only the incomplete tag and does not invent missing CTA/signature wording. A complete source is still needed for production review. Missing business metadata remains blank rather than fabricated. Full Word layout fidelity, the previously identified non-Latin PDF limitation and the three pending policy decisions remain open. The prototype sends no real emails and supplies no production scheduler or authentication boundary.
