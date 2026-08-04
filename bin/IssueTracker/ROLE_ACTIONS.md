# Role-based actions

The role selector changes the work queue and the main action shown inside the issue. It no longer exposes a separate approval dashboard.

## Agent

- Create an issue from an activity with an original remark and any tagged approval matrix.
- Wait while the new issue is assigned to the manager for mandatory approval.
- Receive the issue when the manager or any matrix approver rejects it.
- Add required documents and remarks.
- Save progress without advancing the workflow.
- Reassign, close, or reopen through More issue actions.

## Manager / Approver

- My Work contains only issues currently assigned to the logged-in manager or approver.
- Review the agent's original remark, all supporting documents, complete approval matrix, and prior action.
- As manager, accept the new issue or reject it back to the agent.
- As a tagged matrix approver, accept and send to the next level or reject back to the agent.
- A decision remark is mandatory; supporting documents are optional.

## Action Owner

- My Work contains only open issues assigned to the logged-in action owner.
- Add supporting documents and a clear resolution.
- Save progress, reassign, close, or reopen.

## Shared behavior

- Open Issues is the full active register; Closed is the archived register.
- Issues assigned to someone else are read-only and never appear in the logged-in user's My Work.
- The approval process and matrix are read from `approval_processes` and `approval_matrices`.
- The selected role persists in `issue_tracker_role`.
- Every action writes an entry to the issue activity trail.
