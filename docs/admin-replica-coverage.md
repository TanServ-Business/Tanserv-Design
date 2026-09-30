# Admin replica implementation — 5 September 2026

## Scope and current status

The Admin area is available through `pages/admin.html`, including all 32 menu destinations and the dashboard. This is a **design-only, local prototype**. Navigation, filtering, paging, field selection, template-building controls, and dialogs are interactive. Terminal operations display a preview notice instead of saving, uploading, sending, deleting, or purging.

**Full exact-reference parity is not yet signed off.** Route coverage and smoke tests are not equivalent to a completed screen-by-screen visual audit. The remaining items below are explicit rather than being represented as finished.

## Implemented structure

| Area | Implemented pages and states |
| --- | --- |
| Shared shell | Reference logos and icon font, navigation groups, active module, Directory/Add Contact, notifications empty state, profile menu, responsive single-line workspace tabs |
| Master setup | Branch, Holiday, Bank, Internal Company Contacts; existing detailed forms retained; edit/create dialogs and searchable choices |
| Operational setup | Invoice Preferences, Document Setup, Role/Display Name, User Setup, Notification Manager using the existing dedicated renderer |
| Configuration | Submission process, Push Email Settings, module configuration, visit settings, Month-End, Client Confirmation, PDC, escalation processes/matrices, Issue Tracker configuration |
| Bulk upload | Portfolio Transfer, Bulk Document Upload/limbo, GRN, CN/Advance, Payment Receipt, Customer Portfolio Transfer; history, paging, upload dialogs |
| Customer onboarding | Group Master, Customer Master, Customer Contacts, Customer Bulk Upload; expanded customer/contact forms |
| Email setup | Template Master, SMTP Setup, Sender Account; Google/Exchange conditional fields, masked sample credentials, OTP/Test Email preview actions |
| Strategy | List with 24 sample records, paging, filters, preview, existing rich template builder, Email Sender tab |
| Invoice master | Invoice Upload and 35-field invoice form, Invoice Reallocation, Invoice Deletion |
| Account/client | Admin reset with conditional password fields, separate profile password page, Client Master/sub-client dialog |
| Audit | Retention settings, purge preview/history, Audit Trail with all 163 reference entity labels, searchable picker, sample change history |
| Help | Existing 100-article Help Center, category/search views, empty tickets, ticket and feedback controls |

## Important implementation details

- `admin-preview.js` selects one renderer per module and provides an isolated in-memory store. It never imports, clears, or modifies the user's real localStorage data.
- `admin-composed-generated.js` is generated from the existing Dashboard, Help, and Strategy pages. Run `node scripts/build-admin-composed-pages.js` after changing those source views. Standalone role pages are not rewritten by the generator.
- `admin-monthend.js` provides separate Manual/Automatic controls, calendar/fiscal year selection, same/different CC dates, valid days per month, scheduling rows, recipient selection, and sample run history. Draft schedules have no server effect.
- `assets/admin-reference/` contains the captured reference brand assets/icon font and locally bundled Bootstrap/Chart dependencies. No production credentials are included.
- The Admin CSP blocks non-local connection targets and form submission. Preview interception is the primary no-write boundary; it is not a production security design.

## Verification performed

- `node scripts/validate-admin-modules.js`: passed, 32 menu modules and 32 definitions; all declared tab targets resolve.
- `node --test scripts/test-admin-preview.js`: six tests passed (memory isolation, terminal actions, navigation/opening actions, confirmation actions, strategy deletion, renderer ownership).
- Browser smoke check: all 32 menu pages rendered their expected heading and content at 746 × 1120 and 390 × 844. No document-level horizontal overflow was reported.
- Invoice form: search narrowed to the requested customer; selection worked; saving did not persist or send data. The 390 × 844 modal used one column, a scrolling body, and visible footer controls.
- Month-End: selecting both Automatic modes and Different dates rendered seven fiscal-year rows and all seven expected schedule columns.
- Strategy: next page displayed records 11–20 of 24; Email Sender route opened correctly.
- Dashboard: paired source/local screenshots at 746 × 1120, followed by spacing, header size, data consistency, progress-bar and typography fixes. A chart callback recursion found earlier was removed; no additional console errors appeared during subsequent route checks.
- Syntax checks and scoped `git diff --check` passed.

## Remaining parity / QA work

1. **Template Master editor:** the reference returned “Failed to initiate edit” during inspection. The prototype mirrors that observed state; the unavailable editor has not been fabricated. A working reference editor or screenshots are needed for exact implementation.
2. **Deep configuration states:** escalation wizard/matrix rows, PDC dialogs, retention confirmation/history and per-entity audit record layouts still use representative layouts. Their complete field-by-field and same-viewport visual comparisons remain outstanding.
3. **Large lookup sets:** customer/location/industry/user choices are intentionally synthetic samples, not a replica of tenant records. Some selector presentation and dependent-field behavior still needs reference matching.
4. **Strategy preview and template variants:** the list and builder are present, but the preview summary and the complete set of source template-specific branches are not yet exact matches.
5. **Inherited operational pages:** retained existing layouts and interactions; complete popup/state visual revalidation has not been performed in this pass.
6. **Fine visual details:** date-picker placeholder formatting, some table action icons, upload-history columns in Customer Bulk Upload, typography in deep dialogs, and notification/directory micro-layout need a final comparison pass.
7. **Accessibility:** main Admin dialogs have focus containment, Escape and scroll locking. Equivalent behavior and hidden semantics in every inherited Help/Strategy overlay still need comprehensive keyboard testing.

## Local preview

From the repository root:

```sh
python3 -m http.server 8765 --bind 127.0.0.1
```

Open `http://127.0.0.1:8765/pages/admin.html?module=dashboard`.

The implementation preserves unrelated pre-existing repository edits and tutorial removal. No Git commit, push, deployment, live save, upload, email, password change, or purge was performed.
