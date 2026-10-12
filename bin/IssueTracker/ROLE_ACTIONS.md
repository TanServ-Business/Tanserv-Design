# Role-based actions

Each user has exactly one Issue Tracker role. Admin Preview first selects a role, then shows only users assigned to that role. Approval work is part of the unified Issue Tracker; there is no separate approval module.

## Agent

- Create issues from any External Dependency primary-status/substatus combination.
- View a new issue during the private Manager publication gate.
- Receive Manager- or Approver-rejected issues in My Work.
- Correct an approval rejection by adding a remark; the remark automatically resubmits the issue to the Manager. Documents alone do not resubmit it.
- Review a submitted resolution on their issue and choose Accept and close, Accept resolution, or Reject resolution. Only the issue's Agent receives the resolution-review assignment and notification; each resolution version can be decided once.
- Close any open issue with a mandatory remark, or reopen a closed issue through Manager review.
- Request an approval-process change on their open issue with a mandatory remark; the change goes to the issue Manager for approval.
- Add remarks and documents to any visible open issue without changing its workflow step.

## Manager

- Accept a new issue to publish and route it, or reject it to the Agent. A decision remark is mandatory.
- Monitor permitted team issues in Open Issues, including rejected issues highlighted in red.
- Monitor submitted resolutions and contribute remarks/documents without deciding them. Review resolution, Accept and close, Accept resolution, and Reject resolution are reserved for the issue's Agent; the Manager retains the separate Close issue action.
- Close any open issue with a mandatory remark or reopen it directly to the Action Owner.
- Approve an approval-matrix change before the new matrix begins at L1.
- Request an approval-process change on their open issue with a mandatory remark; the change follows the same Manager review before the new matrix begins.
- Add remarks and documents to any visible open issue without advancing it.

## Approver

- See an issue only after its initial Manager publication gate has passed.
- Accept or reject only when assigned as the current matrix Approver.
- Accept to advance to the next level; final acceptance routes to the Action Owner.
- Reject to return the issue to the Agent for correction.
- Continue viewing the complete trail and contributing remarks/documents after the issue has been published, including during later correction cycles.
- Cannot close or reopen an issue.

## Action Owner

- See an issue only after its initial Manager publication gate has passed.
- Receive the issue after required approvals and provide a formal resolution using documents, a remark, or both.
- Provide a formal resolution during an active approval; this supersedes the pending approval and sends the issue to Resolution Review.
- Receive a rejected resolution directly and submit a revised resolution without another Manager/matrix cycle.
- Add remarks and documents to any visible open issue even when it is assigned elsewhere.
- Cannot close or reopen an issue.

## Shared rules

- My Work contains only open issues assigned to the selected user. Open Issues contains other active issues that user may view.
- Any connected user may add a remark or document while an issue is open; this does not change assignment or workflow state.
- Documents are shared automatically across all issues for the same customer and retain source metadata.
- Rejected issues remain in the existing tabs and are visually highlighted; there is no Rejected tab.
- Every decision, contribution, assignment, and state change is written to the action trail.
- Only the issue Agent and Manager can change its approval process. Approvers and Action Owners cannot.
- The prototype sends event-specific in-app notifications only.
- There is no Resubmit button and no Resend for Approval action.
