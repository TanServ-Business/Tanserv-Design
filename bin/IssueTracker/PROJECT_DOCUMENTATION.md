# Issue Tracker - Unified Workflow

## Overview

The Issue Tracker is a static front-end prototype for invoice issues, document work, remarks, reassignment, resolutions, and multi-level approvals. It uses browser `localStorage`; there is no backend.

## User-facing pages

- `pages/issuetrackerLP.html`: action-first landing page. It shows overview cards and one table clubbed by invoice number.
- `pages/issuetrackerdetail.html`: the complete issue workspace. Documents and remarks receive the largest area; approval actions appear here when it is the current user's turn.
- `bin/IssueTracker/escalationMatrix.html`: configuration for approval processes, reusable matrices, and approver levels.
- `bin/IssueTracker/approver-dashboard.html`: compatibility redirect to Issue Tracker My Work.
- `bin/IssueTracker/approval-request.html`: compatibility redirect that opens the matching issue in manager/approver mode.

## Workflow

1. An agent creates an issue from an activity. Every new issue is assigned to that agent's manager for mandatory manager approval.
2. My Work contains only open issues assigned to the logged-in user. Open Issues contains the complete active register for reference.
3. The manager accepts or rejects the new issue. A decision remark is mandatory.
4. A manager rejection assigns the issue back to the creating agent.
5. A manager acceptance starts the tagged approval matrix, when present, and assigns the issue to Approver L1. Without a tagged matrix, the issue returns to the agent for processing.
6. Each matrix approver accepts to advance to the next level or rejects to return the issue to the creating agent.
7. Final matrix acceptance returns the open issue to the agent for processing; it does not close the issue automatically.
8. Every action updates the single Assigned to value and writes an entry to the issue history. The right panel shows the current assignee above the full approval matrix.

## Data contracts

- `issueTrackerBaseData`: generated invoice and issue records.
- `customIssues`: issues created manually from the landing page.
- `approval_processes`: approval process definitions from Escalation Matrix.
- `approval_matrices`: named approver-level matrices.
- `approval_requests`: active and completed approval requests with trail entries.
- `issue_tracker_role`: selected Agent, Manager / Approver, or Action Owner view.
- `approver_active_user`: current approver identity used by legacy deep links.

`bin/IssueTracker/js/issue-tracker-unified.js` preserves these keys so existing Escalation Matrix data, notification links, and legacy approval links continue to work.

## Role behavior

- Agent: creates issues from activities and processes issues assigned or returned to them with documents and remarks.
- Manager / Approver: accepts or rejects manager-assigned issues, and accepts or rejects the current tagged matrix level when assigned as an approver.
- Action Owner: document/remark work and resolution submission, reassign, close/reopen.

## Prototype limitations

- File content is not persisted; only file names and document types are stored.
- Authentication and identity matching are simulated through the role selector.
- Data is browser-specific and can be cleared with browser storage.

## Verification checklist

1. Landing page shows one invoice-clubbed table without due-date group sections.
2. Search, tabs, archive toggle, approval filter, and action filter update the table.
3. A newly created issue appears only in the assigned manager's My Work.
4. Manager acceptance creates an `approval_requests` entry only when an approval matrix is tagged.
5. Approver acceptance advances the current level and updates Assigned to.
6. Manager or approver rejection returns the issue to the creating agent's My Work.
7. Open Issues continues to show active issues not assigned to the logged-in user.
8. Matrix edits are reflected after returning to the issue page.
9. Legacy approval URLs redirect into the unified workflow.
