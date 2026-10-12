# Jira Ticket: Productize Notification Center Flow Across LP Agent and Shared Header

## Issue Type
Story

## Summary
Productize the notification center flow so PDC, email, commitment, issue, and related workflow notifications are generated, filtered, displayed, and routed consistently between `index.html` and `scripts/shared-header.js`.

## Background
The current prototype uses `index.html` to seed PDC lifecycle demo notifications into browser `localStorage`, while `scripts/shared-header.js` owns the shared notification bell UI, badge count, popup rendering, read state, role/user filtering, issue notification sync, and navigation routing.

This works for the static prototype, but the notification contract is spread across page-level seed logic and shared-header rendering logic. Productizing this needs a single documented notification payload contract and verified behavior across the landing page, notification bell, activity trail, and downstream module routing.

## Source Anchors
- `index.html:2987` defines notification storage keys: `ineburaNotificationCenter`, `ineburaPdcRecords`, and `ineburaPdcNotifications`.
- `index.html:2992` defines the seven PDC lifecycle statuses and app/email copy.
- `index.html:3072` seeds sample PDC records for `PDC logged`, `PDC dispatched`, `PDC received`, `PDC details incorrect`, `PDC banked`, `PDC cleared`, and `PDC bounced`.
- `index.html:3196` writes seeded PDC app notifications, email draft notifications, legacy PDC notification entries, and PDC records into `localStorage`.
- `index.html:3324` renders the LP Agent activity trail from seeded PDC app/email notifications.
- `scripts/shared-header.js:776` initializes the shared notification system when the PDC module script is not present.
- `scripts/shared-header.js:832` maps active user role to notification audience.
- `scripts/shared-header.js:853` filters visible notifications by audience, scheduled state, and `audienceUsers`.
- `scripts/shared-header.js:1245` syncs issue tracker and approval request data into the shared notification center.
- `scripts/shared-header.js:1752` updates the unread badge from visible unread notifications.
- `scripts/shared-header.js:1760` renders notification cards, tags, details, CTAs, and read controls in the bell popup.
- `scripts/shared-header.js:1911` refreshes notification sources when the bell is clicked.
- `scripts/shared-header.js:1946` routes notification CTAs to PDC, landing page, issue tracker, commitment, backend, MIS, credit limit, and support pages.
- `scripts/shared-header.js:2001` performs initial notification sync and listens for relevant `storage` changes.

## Current Behavior
- `index.html` seeds PDC notifications directly into `ineburaNotificationCenter` using `type: "pdc"` for app updates and `type: "email"` for email drafts.
- The same LP Agent seeding also writes legacy PDC status rows into `ineburaPdcNotifications`.
- The LP Agent activity trail renders only seeded notification IDs beginning with `seed-lp-pdc-app:` or `seed-lp-pdc-email:`.
- The shared header renders all visible notifications from `ineburaNotificationCenter`.
- Visibility is controlled by `audience`, `audienceUsers`, `activeUserRole`, and `activeUserName`.
- The unread badge counts visible notifications where `read` is false.
- Clicking an `open-pdc` notification routes users with role `ops` or `pdc-ops` to `pages/PDCOps.html`; other roles route to `pages/PDCagent.html`.
- Issue notifications are synced from `issueTrackerBaseData`, `customIssues`, and `approval_requests`.
- Prototype issue notifications are also injected by `appendDummyIssueNotifications()`.

## Problem Statement
Notification behavior is functional but prototype-oriented. The source of truth, payload schema, dedupe rules, audience targeting, and channel separation are not centralized. This creates risk that future notification types render in the bell but fail in the activity trail, route to the wrong module, over-notify users, or keep demo-only behavior in production flows.

## Requirements
1. Define a single notification payload schema used by LP Agent, PDC, issue tracker, commitment, backend, MIS, credit limit, and support notification sources.
2. Separate notification generation from demo seeding so prototype-only records can be disabled without changing shared rendering logic.
3. Preserve support for both app notifications and email draft notifications.
4. Ensure PDC notifications support all seven lifecycle statuses currently represented in LP Agent.
5. Keep activity trail rendering distinct from the bell notification center, but make both surfaces read from a documented contract.
6. Preserve audience filtering by role and named user.
7. Preserve unread badge behavior for the active user's visible notifications.
8. Ensure notification CTAs route to the correct module for the active role.
9. Remove or gate dummy issue notification injection behind an explicit demo flag.
10. Document all supported notification types, required fields, optional fields, and default CTA behavior.

## Acceptance Criteria
- Given LP Agent loads with demo PDC data enabled, the bell shows PDC app and email notifications for all seven lifecycle statuses.
- Given demo PDC data is disabled, LP Agent does not inject seed records into `ineburaNotificationCenter`, `ineburaPdcRecords`, or `ineburaPdcNotifications`.
- Given a notification has `audience: ["agent"]`, it is visible to agent users and hidden from unrelated roles.
- Given a notification has `audienceUsers`, it is visible only when `activeUserName` matches a normalized target user.
- Given a notification is scheduled with `scheduledFor` and no `sentAt`, it is hidden from the bell.
- Given a visible notification is marked as read, the unread badge count decreases without changing unrelated notification payload fields.
- Given the user clicks a PDC notification as an agent, the CTA routes to `pages/PDCagent.html`.
- Given the user clicks a PDC notification as `ops` or `pdc-ops`, the CTA routes to `pages/PDCOps.html`.
- Given the user clicks an issue notification, the CTA routes to the issue tracker or approval page defined in the notification payload/default mapping.
- Given a notification type is unsupported, it renders as a generic update without breaking the bell popup.
- Given the storage event updates `ineburaNotificationCenter` or related source keys, the bell badge and popup refresh without a page reload.
- Automated or manual QA confirms there is no duplicate notification insertion for the same stable notification ID.

## Out of Scope
- Backend persistence or API implementation.
- Real email delivery.
- User preference settings for notification frequency.
- Mobile push notifications.
- Reworking the visual design of the header or bell popup.

## QA Checklist
- Load `index.html` with empty localStorage and confirm PDC app/email notifications seed only when demo mode is enabled.
- Open the notification bell and verify title, tag, timestamp, message, details, CTA, and read control for PDC app and email notifications.
- Mark one notification as read and verify the badge count changes.
- Use `activeUserRole` values `agent`, `ops`, and `pdc-ops` and verify PDC routing.
- Use a named `activeUserName` and validate `audienceUsers` filtering.
- Trigger or seed an issue notification and confirm rendering plus CTA routing.
- Reload the page and confirm stable IDs prevent duplicate notifications.
- Confirm the LP Agent activity trail remains focused on PDC activity and does not become a duplicate of the full bell feed.

## Implementation Notes
- Keep `scripts/shared-header.js` as the shared renderer and router for the notification bell.
- Move LP Agent PDC seed behavior behind an explicit demo-data control or feature flag.
- Prefer stable IDs for all generated notifications, following the existing `seed-lp-pdc-app:<id>`, `seed-lp-pdc-email:<id>`, and `issue-*` patterns.
- Treat `ineburaNotificationCenter` as the shared notification feed for the static prototype unless a backend store is introduced.
- Avoid coupling activity trail rendering to every notification type; the trail should show workflow history, while the bell should show actionable alerts.

