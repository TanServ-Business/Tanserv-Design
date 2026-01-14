# Issue Tracker - Project Documentation

## Overview
This project is a front-end only Issue Tracker prototype built with static HTML, CSS, and vanilla JavaScript. It simulates invoice issues, approvals, assignments, resolutions, and action trails using in-browser localStorage. There is no backend; all data is mocked and persisted locally in the browser.

## Core Pages
- `index.html`: Main Issue Tracker (invoices, issues, details, actions, trail).
- `dashboard.html`: User dashboard with charts (dummy data).
- `UserScreen.html`: Invite-based onboarding for new users.
- `InviteUser.html`: Invite flow for new users (mocked).
- `escalationMatrix.html`: Manage approval processes and escalation matrices.
- `approver-dashboard.html`: Approver summary dashboard.
- `approval-request.html`: Approver decision page for a specific request.

## High-Level Data Flow
1. **Invoices and issues are generated** on page load in `js/app.js`.
2. **Issues are displayed** per invoice in `index.html`.
3. **User actions** (assign, email, approve, resolution, close/reopen) update the issue and trail.
4. **Approval processes** come from `escalationMatrix.html` and persist in localStorage.
5. **Approval requests** are created in `index.html` and shown in `approver-dashboard.html`.
6. **Approval decisions** in `approval-request.html` update the request and issue trail.
7. **LocalStorage** is the single source of truth across pages.

## Reporting Issues (Main Flow)
The main flow is entirely on `index.html`:
1. Select an invoice in the left column.
2. Select an issue in the middle column.
3. The right column shows issue details and the Action panel.
4. The user triggers actions like Approve, Assign, Re-Send Email, Approval Process, Add Resolution, Close/Resolved, or Reopen.
5. Each action writes a structured entry into the Action Trail.

## Action Flow Details
### Assign to Client Action Owner
- Select an action owner from a dropdown.
- Remark is required.
- Updates issue actionOwner and adds an assignment entry to the trail.

### Re-Send Email
- Select reminder or escalation email type.
- Remark is required.
- Escalation requires valid email addresses.
- Adds an email entry to the trail.

### Approval Process (Submit for Approval)
- Select approval process from escalation matrix list.
- Remark is required.
- Creates or updates an approval request in localStorage.
- Adds a "submitted for approval" entry to the trail.

### Approve / Close / Reopen
- Uses the same remark prompt.
- Remark is required.
- Approve submits an approval request when a process is selected.
- Close sets status to Resolved.
- Reopen sets status back to Open.

### Add Resolution
- Resolution summary is required.
- Remark is optional.
- Optional file attachment list is captured (file names only).
- Sets status to Resolved and updates the trail.

## Approval Workflow
1. **Process Definition**
   - `escalationMatrix.html` defines:
     - Processes (name, SLA, linked matrix).
     - Matrices (levels with approver name/email).
2. **Issue Submission**
   - In `index.html`, user selects an approval process and approves.
   - A request is created in localStorage under `approval_requests`.
3. **Approver Dashboard**
   - `approver-dashboard.html` reads all requests.
   - Displays KPIs and a list of requests relevant to the selected approver.
4. **Approval Request**
   - `approval-request.html` shows issue + invoice details.
   - Shows escalation matrix, decision box (if the user can decide), and trail.
   - Approve advances to the next level; Reject ends the request.
5. **Trail Sync**
   - Approval trail entries are synced back into the issue action trail.

## Role-Based Actions
The header dropdown in `index.html` changes visible action pills:
- **Agent**: Assign to Client Action Owner, Re-Send Email, Approval Process
- **Manager**: Approve, Assign to Client Action Owner, Re-Send Email, Approval Process
- **Action Owner**: Assign to Client Action Owner, Add Resolution, Close/Resolved

Close/Resolved and Reopen visibility also depend on issue status.

## LocalStorage Keys
- `customIssues`: Manually added issues.
- `approval_processes`: Process definitions from `escalationMatrix.html`.
- `approval_matrices`: Escalation matrices from `escalationMatrix.html`.
- `approval_requests`: Approval requests and their trail.
- `issue_tracker_role`: Current role selected in the header.
- `approver_active_user`: Current approver in approver dashboard.

## File-Level Responsibilities
- `js/app.js`
  - Generates mock invoice/issue data.
  - Renders invoice list, issue list, and details.
  - Handles action panels and trail updates.
  - Creates approval requests and syncs approval trails.
  - Applies role-based action visibility.
- `js/approver-dashboard.js`
  - Reads approval requests and filters by active user.
  - Renders KPIs and chart.
- `js/approval-request.js`
  - Loads request by id.
  - Enforces decision permissions based on escalation matrix.
  - Updates request status and trail.
- `escalationMatrix.html`
  - Stores and manages matrices/processes.
  - Seeds defaults when empty.

## Data Flow Diagram (Text)
1. `index.html` loads -> generates invoices/issues -> renders lists.
2. Action submitted -> update issue + trail -> persist localStorage if needed.
3. Approval submitted -> write to `approval_requests` -> appears in approver dashboard.
4. Approver decision -> update request -> sync back to issue action trail.

## Testing Checklist
1. Select invoice/issue -> details render.
2. Trigger each action -> trail updates.
3. Submit approval -> appears in approver dashboard.
4. Approve at level 1 -> request moves to level 2.
5. Reject -> request closes and trail updates.
6. Role switch -> action pills update and panels close.

## Notes and Limitations
- This is a static prototype; no backend or authentication.
- File uploads are not persisted; only file names are captured.
- localStorage data is browser-specific and can be cleared.
