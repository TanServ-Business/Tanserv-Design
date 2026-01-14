# Role-Based Actions (Issue Tracker)

## Overview
The Issue Tracker now supports a role selector in the header to control which action pills are available. This is a UI-level filter that shows the actions relevant to the selected role while keeping the rest of the issue workflow intact.

## Roles and Actions
The dropdown offers three roles. When a role is selected, only the corresponding action pills are shown:

- Agent
  - Assign to Client Action Owner
  - Re-Send Email
  - Approval Process
- Manager
  - Approve
  - Assign to Client Action Owner
  - Re-Send Email
  - Approval Process
- Action Owner
  - Assign to Client Action Owner
  - Add Resolution
  - Close/Resolved

## Behavior Rules
- The role selector appears in the top-right of the header on `index.html`.
- Changing the role hides any open action panels and clears the current pill highlight.
- The selected role is persisted in localStorage so it remains after refresh.
- Close/Resolved and Reopen are still controlled by issue status:
  - If the issue is resolved or closed, Close/Resolved is hidden and Reopen is shown.
  - If the issue is open, Close/Resolved is shown and Reopen is hidden.
- Approval Process selection is a separate pill. The process list comes from the escalation matrix stored in localStorage.

## Panels and Remarks
- Assign, Approval, Close/Resolved, and Reopen require remarks.
- Add Resolution requires a resolution summary; remark is optional.
- Re-Send Email requires a remark and, for escalation, validated email addresses.

## Local Storage Keys
These keys are used by the UI:
- `issue_tracker_role`: the current role selected in the header dropdown.
- `approval_processes`: list of approval processes (loaded in Approval Process panel).
- `approval_matrices`: approval matrices used to populate process escalations.
- `approval_requests`: stored approval requests and trail entries.

## Implementation Notes
Main files involved:
- `index.html`: adds the role dropdown in the header and keeps the action pills in the Action panel.
- `css/style.css`: header layout and dropdown styles.
- `js/app.js`: role definitions, persistence, and action visibility logic.

Role-to-action mapping is defined in `js/app.js` as:
```js
const ROLE_ACTIONS = {
  agent: ['assign-btn', 'email-btn', 'approval-process-btn'],
  manager: ['approve-btn', 'assign-btn', 'email-btn', 'approval-process-btn'],
  'action-owner': ['assign-btn', 'resolution-btn', 'close-btn']
};
```

## How to Test
1. Open `index.html` in a browser.
2. Select any invoice and issue to load the action panel.
3. Change the role dropdown and confirm the visible action pills match the list above.
4. Toggle roles while a panel is open to confirm it closes and the highlight resets.
5. Verify Close/Resolved vs Reopen visibility by switching an issue between Open and Resolved.

## Extending Roles
To add a new role or change actions:
1. Update the dropdown options in `index.html`.
2. Add a new entry in `ROLE_ACTIONS` in `js/app.js`.
3. If needed, add new action pills and handlers in the Action panel.
