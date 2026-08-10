# Issue Tracker - Unified Workflow

## Overview

The Issue Tracker is a static front-end prototype for invoice issues, remarks, customer documents, reassignment, resolution, and sequential approvals. It uses browser `localStorage`; there is no backend.

The prototype has four separate roles: **Agent**, **Manager**, **Approver**, and **Action Owner**. A user belongs to exactly one role. In Admin Preview, selecting a role limits the user selector to users assigned to that role.

## User-facing pages

- `LPagent.html`: creates an issue from an External Dependency activity. All primary-status and substatus combinations under External Dependency can be added to Issue Tracker.
- `pages/issuetrackerLP.html`: overview cards and the invoice-grouped My Work, Open Issues, and Closed tables.
- `pages/issuetrackerdetail.html`: the complete issue workspace for approvals, documents, remarks, resolutions, and administrative actions.
- `bin/IssueTracker/escalationMatrix.html`: configures reusable approval processes and approver levels.
- `bin/IssueTracker/approver-dashboard.html` and `bin/IssueTracker/approval-request.html`: legacy compatibility redirects only. Approval work is completed inside Issue Tracker.

## Visibility and assignment

- **My Work** contains only issues currently assigned to the selected user.
- **Open Issues** contains other open issues the user is allowed to see. Managers can monitor team work here.
- **Closed** contains closed issues.
- A new issue is private to its creating Agent and assigned Manager until the Manager first accepts it. Action Owners and Approvers cannot see it or receive notifications during this gate.
- The Manager's first acceptance permanently publishes the issue to its connected users. Later rejection, correction, or reapproval never hides its history from earlier Approvers or the Action Owner.
- Connected users may add remarks and documents while an issue is open, even when it is not assigned to them. These contributions do not advance the workflow.

## Workflow

### Creation and manager publication gate

1. The Agent creates the issue from an External Dependency activity. The selected substatus is the issue title and required-action label everywhere.
2. The issue is assigned to the Agent's Manager for mandatory review, unless **Skip Manager Approval** is configured.
3. Manager acceptance publishes the issue and sends it to Approver L1 when a matrix is tagged, otherwise to the Action Owner.
4. Manager rejection returns the still-private issue to the Agent. The Agent's corrective remark automatically resubmits it to the Manager; there is no Resubmit button. Attaching a document alone does not resubmit it.

### Approval matrix

1. Approvers act sequentially from L1 upward. Only the current Approver can accept or reject.
2. Acceptance advances to the next level. Final acceptance assigns the issue to the Action Owner for resolution.
3. Rejection assigns the issue to the Agent for correction and highlights it as rejected in the existing tables; there is no separate Rejected tab.
4. The Agent's corrective remark sends the issue through Manager review and then restarts the matrix at L1. Earlier decisions remain in the trail but do not count in the new cycle.
5. Previous Approvers and the Action Owner retain read/contribute access because the issue has already passed the publication gate.

### Resolution review

1. After publication, the current Action Owner can formally provide a resolution as documents, a remark, or both.
2. A formal resolution submitted during Manager or matrix approval supersedes that approval and assigns the issue to the Agent for Resolution Review.
3. The Agent or Manager may make the first formal decision on that resolution:
   - **Accept and close issue** accepts the contribution and closes the issue.
   - **Accept resolution** accepts the contribution, keeps the issue open, and assigns it to the Agent for the remaining work.
   - **Reject resolution** requires a remark and returns it to the current Action Owner for a revised resolution, without restarting Manager or matrix approval.
4. Accepted documents satisfy matching document placeholders. A remark-only resolution can satisfy information requests such as a PO number.

### Administrative actions

- Only an Agent or Manager can close an open issue. A closing remark is mandatory, and pending approvals are superseded.
- Reopening by an Agent returns to Manager approval (or the configured skip route). Reopening by a Manager goes directly to the Action Owner.
- Reassigning during approval changes the future Action Owner. Reassigning during resolution work changes both Action Owner and current assignee.
- Changing the approval matrix requires Manager approval and starts the new matrix at L1. Historical decisions remain in the trail.
- There is no separate **Resend for Approval** action.

## Customer documents

Documents uploaded for a customer are automatically visible on every issue for that customer, including issues for other invoices. Each document retains its source invoice/issue, uploader, and date. Availability alone does not approve, resolve, or close an issue.

## Notifications

This design prototype implements **in-app notifications only**. It uses event-specific Notification Center templates for assignment, Manager review, Approver review, rejection/correction, resolution review and decisions, approval cancellation, and reassignment. Notification targets must follow the visibility gate and must not expose an unpublished issue.

## Data contracts

- `issueTrackerBaseData`: invoice records and their issues.
- `customIssues`: additional issue records.
- `approval_processes`: approval-process definitions from Escalation Matrix.
- `approval_matrices`: named sequential approver matrices.
- `approval_requests`: current and historical approval cycles.
- `issue_tracker_role`: selected preview role.
- `issue_tracker_active_user`: selected preview user.

Invoice/customer portfolio data and approval setup are preserved when issue records are cleared.

## Prototype limitations

- File content is not persisted; only file metadata is stored.
- Authentication, relationships, and role matching are simulated through Admin Preview.
- Data is browser-specific and can be cleared with browser storage.

## Verification checklist

1. A new issue is visible only to its Agent and Manager until first Manager acceptance.
2. My Work shows only the selected user's assignments; Open Issues shows other permitted active issues.
3. Manager acceptance routes to matrix L1 or the Action Owner; rejection routes to the Agent.
4. An Agent corrective remark restarts approval correctly, while another user's remark does not.
5. Matrix acceptance advances one level and rejection returns to Agent correction without hiding prior history.
6. A formal resolution supersedes active approval and exposes all three Agent/Manager review decisions.
7. Rejected issues are highlighted in existing tables without adding a new tab.
8. Customer documents appear across that customer's invoices with source metadata.
9. In-app notifications use the correct event template and never bypass the publication gate.
10. Landing filters, sorting, and invoice collapse controls continue to work.
