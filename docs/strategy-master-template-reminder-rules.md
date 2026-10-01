# Strategy Master Template Notification And Reminder Rules

This document defines the template-wise notification mode, reminder-step timing, attachment behavior, and filter expectations for Strategy Master.

Source template list: `pages/strategy-master.html` / `scripts/strategy-master.js`

## Common Rules

- Template selection controls the available notification mode and reminder-step timing.
- Custom notification mode uses reminder steps with an `X days` offset from the template-specific event.
- Ongoing notification mode uses recurring reminder settings and is available only where the template supports it.
- Attachment selection must show the full available document list for every reminder step, not only invoice attachment.
- Invoice Status Filters are available for every template and follow the Broad Status > Primary Status > Sub Status tree.
- Selecting a Broad Status selects all Primary Status and Sub Status children under it.
- Selecting a Primary Status selects all Sub Status children under it.
- No sub-status outside the selected tree path is allowed in the saved filter payload.
- Aging Buckets remain available for every template.

## Template-Wise Rules

### 1. ChequeBounce

- Notification type: Custom only.
- Reminder Steps: Days After Cheque Bounced.
- Rule: `X days after cheque bounces`.
- Attachments: Show all available documents.
- Default invoice status context: Overdue.
- Default aging buckets: 1-30, 31-45, 46-60.

### 2. AcknowledgementOfInvoiceReceipt

- Notification type: Custom only.
- Reminder Steps: Days After Invoice And Document Uploaded.
- Rule: `X days after invoice and document uploaded`.
- Attachments: Show all available documents.
- Default invoice status context: Pre-Due, Dispute.
- Default aging buckets: Not Due, 1-30.

### 3. InvoiceResubmission

- Notification type: Custom and Ongoing.
- Custom Reminder Steps: Days Before Due Date or Days After Due Date.
- Rule: `X days before due date` or `X days after due date`.
- Ongoing Reminder: Recurring reminder settings are allowed for this template.
- Attachments: Show all available documents.
- Default invoice status context: Dispute, Overdue.
- Default aging buckets: 1-30, 31-45, 46-60.

### 4. PendingPayments

- Notification type: Custom and Ongoing.
- Custom Reminder Steps: Days Before Due Date or Days After Due Date.
- Rule: `X days before due date` or `X days after due date`.
- Ongoing Reminder: Recurring reminder settings are allowed for this template.
- Attachments: Show all available documents.
- Default invoice status context: Overdue.
- Default aging buckets: 1-30, 31-45, 46-60, 61-90.

### 5. PTPMissedMail

- Notification type: Custom only.
- Reminder Steps: Days After PTP Date.
- Rule: `X days after PTP date`.
- Attachments: Show all available documents.
- Default invoice status context: PTP.
- Default aging buckets: 1-30, 31-45, 46-60, 61-90.

### 6. PTPConfirmationMail

- Notification type: Custom and Ongoing.
- Custom Reminder Steps: Days Before PTP Date.
- Rule: `X days before PTP date`.
- Ongoing Reminder: Recurring reminder settings are allowed for this template, anchored to PTP context.
- Attachments: Show all available documents.
- Default invoice status context: PTP.
- Default aging buckets: Not Due, 1-30, 31-45, 46-60.

### 7. RequestForPaymentAdviceOrDetails

- Notification type: Custom and Ongoing.
- Custom Reminder Steps: Days After Collected/Part Collected.
- Rule: `X days after collected or part collected`.
- Ongoing Reminder: Recurring reminder settings are allowed for this template.
- Attachments: Show all available documents.
- Default invoice status context: Overdue.
- Default aging buckets: 1-30, 31-45, 46-60.

### 8. ReminderForPaymentDue

- Notification type: Custom and Ongoing.
- Custom Reminder Steps: Days Before Due Date or Days After Due Date.
- Rule: `X days before due date` or `X days after due date`.
- Ongoing Reminder: Recurring reminder settings are allowed for this template.
- Attachments: Show all available documents.
- Default invoice status context: Pre-Due, Overdue.
- Default aging buckets: Not Due, 1-30.

### 9. NewInvoiceNoO/S

- Notification type: Custom only.
- Reminder Steps: Days After New Invoice Is Uploaded.
- Rule: `X days after new invoice is uploaded`.
- Attachments: Show all available documents.
- Default invoice status context: Pre-Due.
- Default aging buckets: Not Due.

### 10. NewInvoiceExistingCustomer

- Notification type: Custom and Ongoing.
- Custom Reminder Steps: Days After New Invoice Is Uploaded.
- Rule: `X days after new invoice is uploaded`.
- Ongoing Reminder: Recurring reminder settings are allowed for this template.
- Attachments: Show all available documents.
- Default invoice status context: Pre-Due, Overdue.
- Default aging buckets: Not Due, 1-30.

## Implementation Notes

- If a template has one supported reminder timing, show the value as a fixed field instead of a dropdown.
- If a template has multiple supported reminder timings, show a dropdown with only those allowed timing values.
- ChequeBounce, AcknowledgementOfInvoiceReceipt, PTPMissedMail, NewInvoiceNoO/S, and NewInvoiceExistingCustomer must not show due-date timing unless explicitly listed above.
- PTPMissedMail and PTPConfirmationMail must remain restricted to PTP-context invoices.
- Attachment options must come from the available document master/list so the user can choose any supported document type for the reminder.
