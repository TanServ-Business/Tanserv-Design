# Tanserv Design Project Changes

This document summarizes the current project changes in the working tree. The changes are primarily around AI-assisted invoice workflows, AI Activity Center review, invoice disposition mapping, email-driven suggestions, and visit planning suggestions.

## Changed Files

- `pages/ai-activity-center.html`
- `css/ai-activity-center.css`
- `scripts/ai-activity-center.js`
- `LPagent.html`
- `scripts/app.js`
- `css/styles.css`
- `pages/visitmodule.html`
- `scripts/shared-header.js`

## 1. AI Activity Center

### Purpose

The AI Activity Center is a new module for reviewing invoice-based AI workflow actions. It focuses on scheduled AI actions by invoice instead of showing a large card-based queue.

### Navigation

`scripts/shared-header.js` was updated to add **AI Activity Center** to the shared sidebar menu.

- Menu label: `AI Activity Center`
- Icon: Bootstrap Icons `bi-stars`
- Route: `pages/ai-activity-center.html`
- Module key: `ai-activity-center`

### Main UI

The page now uses a compact operational table.

Table columns include:

- Invoice
- Customer
- Invoice amount
- Net due
- Invoice date
- Due date
- Primary status
- Sub status
- Previous status
- AI actions
- Schedule state
- Review action

The page also includes:

- Agent / Manager role toggle
- Search by invoice, customer, or action
- Action type filter
- Schedule state filter
- Compact metric chips for scheduled, revoked, email, and visit actions
- Manager agent chips when in manager view

### Review Flow

Rows remain visible at all times. Selecting a row expands an inline review section below that invoice.

The expanded section shows:

- AI suggested actions for that invoice
- Multiple action pills per invoice, where applicable
- Active action detail
- Source and evidence
- Action that will happen
- Confidence / risk
- Compact email preview for email/reminder actions
- Timeline snippets
- Review controls

Review controls:

- **Keep scheduled**
- **Review later**
- **Revoke**
- **View email**, when an action has an email draft

### Drawer

A right-side drawer is used for full email preview.

The drawer shows:

- From
- To
- CC
- Subject
- Attachments
- Full email body

### Data Model

The AI Activity Center mock data is stored locally in `scripts/ai-activity-center.js`.

The current sample set contains 28 AI actions across multiple invoices and customers, including Apollo Pharmacy, Varun Beverages, Blue Star Limited, Bikanerwala Foods, Shiva Healthcare, and Ambane India.

Each action contains fields such as:

- `invoiceNo`
- `customer`
- `agent`
- `manager`
- `invoiceAmount`
- `netDue`
- `primaryStatus`
- `subStatus`
- `previousStatus`
- `type`
- `label`
- `source`
- `evidence`
- `actionDetail`
- `scheduledAt`
- `confidence`
- `risk`
- `email`
- `timeline`

Supported action types:

- `activity`
- `email`
- `reminder`
- `visit`

### Persistence

Review decisions are stored in browser `localStorage`.

Storage key:

```text
ineburaAiActivityDecisions
```

Decision states:

- `scheduled`
- `revoked`
- `later`

Legacy states `approved` and `rejected` are normalized to `scheduled` and `revoked`.

## 2. Agent Landing / Invoice Workflow Changes

### Email Panel Changes

`LPagent.html` and `scripts/app.js` now support AI-driven email suggestions.

Changes include:

- Added a structured inbound email example for a delivery challan issue.
- Added metadata attributes to email items for AI action extraction.
- Moved the email action suggestion area into a reusable AI suggestion strip.
- Added support for AI-drafted email responses.

AI suggestions can now appear from email content when the email indicates:

- Payment confirmation
- Delivery challan required
- General email response required

### AI Suggestion Strip

`css/styles.css` adds reusable styling for AI suggestion strips.

Main classes:

- `.aiSuggestionStrip`
- `.aiSuggestionHeader`
- `.aiSuggestionPills`
- `.aiSuggestionItem`
- `.aiSuggestionPill`
- `.aiSuggestionAction`
- `.aiReasonBtn`
- `.aiReasonPopover`

The strip is used to show AI-recommended actions as compact pills with a reason affordance.

### Email Suggestions

New logic in `scripts/app.js` supports:

- Parsing payment confirmation emails
- Parsing delivery challan/document issue emails
- Building AI-drafted email responses
- Opening the email compose panel with prefilled AI draft data
- Applying email-derived invoice disposition suggestions

Example AI email actions:

- Mark invoice as collected after payment confirmation
- Mark delivery challan required after document request
- Draft response to customer email

## 3. Invoice Disposition Mapping

### Purpose

Invoice disposition statuses were standardized so sub-status selections map back to the correct broad and primary status.

### Added Data

`scripts/app.js` now includes:

- `dispositionActivityTypeOptions`
- `invoiceDispositionRows`
- `dispositionSubStatusAliases`

These define valid mappings between:

- Broad status
- Primary status
- Sub status

Examples:

- `Collection Done / Collected / Collected`
- `External dependency / Further Docs Required / Delivery Challan Required`
- `Work In Progress / PTP / PTP`
- `Work In Progress / Collection In Progress / PDC Given`

### Activity Modal Changes

`LPagent.html` activity modal was updated:

- Sub-status is the editable primary input.
- Broad status and primary status are derived and disabled.
- PTP date field was added.
- AI suggestion strip was added above the activity form.

This reduces invalid status combinations and makes activity entry more consistent.

### Status Override Changes

Invoice status override logic now:

- Resolves status mappings from disposition rows.
- Stores and applies PTP dates.
- Normalizes status display in activity trail entries.
- Treats collected and PDC states using normalized disposition values.

## 4. Activity-Based AI Suggestions

`scripts/app.js` now supports AI suggestions inside the invoice activity/disposition workflow.

Suggestions can be generated from:

- Future PTP date
- Current invoice status
- Delivery challan/document requirement
- Collection/payment state

Example actions:

- Mark as collected
- Send reminder
- Edit reminder
- Prefill delivery challan disposition
- Send document-support email

AI suggestion payloads are encoded into button attributes and decoded when the user applies the suggestion.

## 5. Visit Module AI Suggestions

`pages/visitmodule.html` was updated to surface AI suggested visits.

### UI Changes

Added:

- AI suggested visits panel inside the plan modal
- Reason buttons for AI suggestions
- Plan remark field

### Suggestion Logic

The visit module now generates suggested customers from invoice and activity data.

Signals include:

- PTP scheduled for the selected date
- Email asking to collect cheque/PDC
- Delivery challan or document issue
- Follow-up visit activity
- Invoice submission pending

Suggestions are shown only for today or future plan dates.

### Adding AI Suggested Visits

When an AI suggested customer is added:

- The customer is added to selected visits.
- The reason is preserved.
- A plan action trail entry is logged.
- The selected visits and AI suggestions refresh.

### Remarks

The plan modal now has a remark field. When a plan is saved or submitted, the remark is saved against the selected date and plan owner.

## 6. Shared Styling

Reusable AI UI styles were added to `css/styles.css`.

These styles support:

- AI suggestion strips
- AI action pills
- Reason buttons
- Reason popovers

Visit-module-specific AI styles were added inside `pages/visitmodule.html` for:

- AI suggested visit panel
- AI reason buttons

AI Activity Center styles live in `css/ai-activity-center.css`.

## 7. Local Storage Keys

The changes use existing and new browser storage keys.

Relevant keys:

```text
ineburaAiActivityDecisions
ineburaInvoiceStatusOverrides
ineburaActivityTrailByInvoice
```

Existing visit planning storage is also used by the visit module for plan state, remarks, and trails.

## 8. Verification Performed

Static checks run:

```bash
node --check scripts/ai-activity-center.js
node --check scripts/shared-header.js
```

The AI Activity Center page was also served locally during implementation to verify that the HTML endpoint loads.

## 9. Known Notes

- The AI Activity Center currently uses local mock data, not backend API data.
- Review decisions are local browser state only.
- AI suggestions in the agent and visit modules are prototype logic based on local invoice/activity/email data.
- The implementation is suitable for UI/workflow validation before backend integration.
