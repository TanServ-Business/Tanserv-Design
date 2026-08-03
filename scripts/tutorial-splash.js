(() => {
  "use strict";

  if (window.IneburaTutorials) return;

  const STORAGE_PREFIX = "ineburaTutorialProgress:v1";
  const normalize = (value) => String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const pageKey = () => {
    const path = window.location.pathname.replace(/\\/g, "/");
    return path.split("/").pop().replace(/\.html$/i, "").toLowerCase() || "home";
  };

  const pageTutorials = {
    lpagent: ["Daily work", "Use the customer and invoice workspace to prioritise follow-ups, record activity, and move a collection task forward.", "Your work items connect to PDCs, commitments and issues, so one update can keep the wider account story aligned."],
    lpcustomer: ["Customer account", "Review invoices, statements, activity and available actions for the selected customer account.", "Customer views are account-scoped: the same platform can show a useful slice without exposing the whole operating kitchen."],
    lpmanager: ["Manager workspace", "Use agent summaries and quick links to review a team member's workload, visit plans, issues and commitments.", "Manager views are designed for intervention: start with the exception, then drill into the supporting record."],
    lpsupervisor: ["Supervisor workspace", "Compare manager summaries and use the quick links to move into visit review, issues or commitments.", "This layer is about removing blockers across the team, not duplicating every agent action."],
    kam: ["KAM workspace", "Review the manager summary, approval work and operational shortcuts for the assigned account area.", "KAM screens bring portfolio context and escalation decisions together when a customer needs a wider view."],
    kas: ["KAS workspace", "Use the KAM summary and operational shortcuts to trace priority work and team-level follow-through.", "The dashboard follows the reporting chain, so a drill-down keeps the context of who owns the next action."],
    lpbackend: ["Backend workspace", "Check upload status, processing summaries and the available operational hand-offs.", "Good source data is the quiet engine behind every dashboard card—unflashy, but very much invited to the party."],
    lpmis: ["MIS workspace", "Schedule or generate reports, then use invoice and customer overviews to investigate the numbers behind them.", "Reports are a starting point for analysis; filters and shared client context keep the result meaningful."],
    dashboard_agent: ["Agent dashboard", "Open KPI cards for details, use View Trends for historical performance, and switch density when you need more or less breathing room.", "The cards are designed to point from portfolio signals to a practical next action—not merely to look impressive in purple."],
    dashboard_customer: ["Customer dashboard", "Review account KPIs and open the available cards to inspect invoices, status and supporting detail.", "This dashboard keeps the customer perspective focused on their own account context."],
    dashmanager: ["Manager dashboard", "Use My Team, KPI drill-downs and performance trends to move from team health into a selected agent's detail.", "Team hierarchy is preserved through drill-downs, so a number never loses the people and portfolio behind it."],
    dashkam: ["KAM dashboard", "Use My Team, cards and trend controls to compare portfolio performance and open a dashboard at the next level down.", "Trend ranges help distinguish a one-day wobble from a pattern worth acting on."],
    dashkas: ["KAS dashboard", "Use the team navigator, KPI cards and trend controls to inspect performance at the appropriate reporting level.", "The dashboard lets leaders follow a metric into its operational owner instead of chasing it through spreadsheets."],
    dashboard_supervisor: ["Supervisor dashboard", "Open KPI cards for detail and use View Trends to compare performance over the selected period.", "Supervisor-level measures focus on exceptions and momentum across the whole operating layer."],
    dashboard_admin: ["Admin dashboard", "Use the dashboard controls and cards to monitor the system-wide operational picture.", "Administrative views are broad by design: they help spot the signal before it becomes a queue of tiny alarms."],
    visitmodule: ["Visit Planner", "Choose a date, create or update visit plans, then use remarks and the activity trail to retain the context behind each visit.", "A planned visit becomes more useful when its outcome is recorded—the calendar is only the opening act."],
    visitmodulereview: ["Visit review", "Select a plan date, review visits and remarks, then use the plan controls to approve or adjust the team's follow-through.", "Review keeps planning and accountability connected without asking managers to reconstruct the week from memory."],
    issuetrackerlp: ["Issue Tracker", "Filter the issue list, open an invoice's issues, and use Add Issue to start a documented resolution path.", "An issue carries its action trail with it, so progress is visible even when the next task belongs to another team."],
    issuetrackerdetail: ["Issue detail", "Choose an issue card, add or update its action, and use the action trail to understand what has already happened.", "The detail view is where an unresolved exception becomes an owned, traceable next step."],
    dashboard: ["Issue overview", "Use the issue and approval charts to spot status, source and category patterns before opening the relevant queue.", "The overview favours patterns over noise—because 20 separate alerts are not a strategy."],
    escalationmatrix: ["Escalation Matrix", "Review the applicable approval matrix and its levels before routing an issue or decision onward.", "Escalation rules make the hand-off predictable, especially when urgency tries to improvise."],
    "approver-dashboard": ["Approval Queue", "Review the queue, open an approval and make the required decision with the available context.", "The queue separates pending decisions from completed work so approvals do not quietly become archaeological finds."],
    "approval-request": ["Approval request", "Review the request, matrix and approval trail, then record the decision with an appropriate comment.", "The trail records why a decision was made, not just that a button was pressed."],
    inviteuser: ["Customer activity", "Use the customer summary and invoice activity to understand the account history before taking the next action.", "Account context and activity history sit together to avoid a surprise sequel halfway through a conversation."],
    userscreen: ["User profile", "Complete the profile steps and the available communication enrolment options.", "Profile completion helps the platform present the right identity and communication context across the workspace."],
    submission: ["Submission Module", "Search and filter invoices, select the relevant records, then use bulk submission or the submission form to progress them.", "Submission status makes the hand-off visible—use it to distinguish work still in your court from work already sent onward."],
    pdcagent: ["PDC Module", "Review your PDC list, open a record to update it, and use the activity trail to keep the collection story current.", "PDC actions can feed related operational signals, so accurate status updates save everyone a second round of detective work."],
    pdcops: ["PDC operations", "Use the all-PDC view, record actions and activity trail to manage items that need operational follow-through.", "Ops sees the wider PDC queue, making it the right place to coordinate exceptions across agents."],
    commitment: ["Commitment Module", "Create or update commitments, review their state and keep the related activity visible to the next reviewer.", "A commitment is most valuable when its due date and owner can be compared with the actual collection outcome."],
    commitmentmanager: ["Commitment review", "Review submitted commitments, inspect their context and take the manager decision where required.", "Manager decisions flow back into the operational record, so an approval is not a separate side quest."],
    "ai-activity-center": ["AI Activity Center", "Filter actionable invoices, open a review drawer and accept, revoke or defer a scheduled suggestion.", "Suggestions remain scheduled until someone explicitly changes them; AI here assists the workflow, it does not quietly take the wheel."],
    "strategy-master": ["Strategy Master", "Create or edit a collection strategy, define its target records, choose templates and preview the result before activation.", "Strategies turn repeatable collection approaches into reusable rules instead of rebuilding the same playbook every Monday."],
    "credit-limit-dashboard": ["Credit Limit overview", "Select a metric card to filter customers, search the portfolio and open an account to assess or manage its limit.", "Utilisation signals are there to prompt timely review—not to make a red card feel personally offended."],
    "credit-limit-assessment": ["Assessment Cockpit", "Select a customer and review the assessment panels before making a supervisory credit-limit decision.", "Assessment and limit maintenance are separate on purpose: one informs the decision, the other records the approved change."],
    "credit-limit-detail": ["Manage Credit Limits", "Review the selected customer's limit, related history and available change controls before submitting an update.", "Limit changes follow an approval-aware workflow, keeping risk decisions visible after the number changes."],
    "help-support": ["Help & Support", "Search the knowledge base, filter articles by category, raise a ticket or send feedback when self-service is not enough.", "Help is a re-entry point for tutorials too—use the profile menu's Tutorials action whenever you want a refresher."],
    "support-admin": ["Support Admin", "Review incoming tickets and feedback, update their progress and close the loop with a clear resolution.", "Support feedback is product signal in sensible shoes: it helps reveal what needs explaining or improving next."]
  };

  const genericTutorial = () => [
    document.querySelector("h1")?.textContent?.trim() || "This page",
    "Use the visible filters, actions and detail controls to work from the summary into the record that needs attention.",
    "This screen shares the same account, notification and navigation context as the rest of Inebura."
  ];

  const getUserKey = () => {
    const profile = (() => {
      try { return JSON.parse(localStorage.getItem("userProfile") || "{}"); } catch (_) { return {}; }
    })();
    const identity = profile.email || profile.loginId || localStorage.getItem("activeUserId") || localStorage.getItem("activeUserName");
    const role = localStorage.getItem("activeUserRole");
    const tenant = localStorage.getItem("activeTenantId") || document.body.dataset.relationshipName || "default";
    if (!identity && !role) return "";
    return [normalize(tenant), normalize(identity || "user"), normalize(role || "role")].join(":");
  };

  const storageKey = () => `${STORAGE_PREFIX}:${getUserKey()}`;
  const readProgress = () => {
    try { return JSON.parse(localStorage.getItem(storageKey()) || "{}") || {}; } catch (_) { return {}; }
  };
  const saveProgress = (progress) => {
    try { localStorage.setItem(storageKey(), JSON.stringify(progress)); } catch (_) { /* Keep the tutorial non-blocking. */ }
  };

  const injectStyles = () => {
    if (document.getElementById("ineburaTutorialStyles")) return;
    const style = document.createElement("style");
    style.id = "ineburaTutorialStyles";
    style.textContent = `
      .tutorialSplash{position:fixed;inset:0;z-index:10060;display:grid;place-items:center;padding:24px;background:rgba(15,23,42,.64);backdrop-filter:blur(5px)}
      .tutorialSplash[hidden]{display:none}.tutorialSplashCard{width:min(620px,100%);overflow:hidden;border:1px solid rgba(255,255,255,.35);border-radius:24px;background:#fff;box-shadow:0 28px 70px rgba(15,23,42,.35)}
      .tutorialSplashTop{padding:28px 32px 22px;background:linear-gradient(135deg,#4b1f73,#7c3eb0);color:#fff}.tutorialSplashKicker{margin-bottom:8px;font-size:11px;font-weight:800;letter-spacing:.12em;text-transform:uppercase;opacity:.82}.tutorialSplashTitle{margin:0;font-size:27px;font-weight:800;line-height:1.16}.tutorialSplashBody{padding:30px 32px 12px}.tutorialSplashPart{margin:0 0 10px;color:#5c258d;font-size:12px;font-weight:800;letter-spacing:.1em;text-transform:uppercase}.tutorialSplashCopy{margin:0;min-height:70px;color:#334155;font-size:16px;line-height:1.55}.tutorialSplashFooter{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:22px 32px 28px}.tutorialSplashProgress{color:#64748b;font-size:12px;font-weight:700}.tutorialSplashActions{display:flex;gap:9px}.tutorialSplash button{font:inherit;cursor:pointer}.tutorialSplashSkip{border:0;background:transparent;color:#64748b;font-size:13px;font-weight:700}.tutorialSplashNext{border:0;border-radius:10px;padding:10px 16px;background:#5c258d;color:#fff;font-size:13px;font-weight:800}.tutorialSplashNext:hover{background:#4b1f73}.tutorialSplashSkip:focus-visible,.tutorialSplashNext:focus-visible{outline:3px solid #c4a4df;outline-offset:2px}.tutorialReplayFloat{position:fixed;right:20px;bottom:20px;z-index:1000;border:0;border-radius:999px;padding:10px 14px;background:#5c258d;color:#fff;box-shadow:0 10px 24px rgba(76,31,115,.3);font-size:13px;font-weight:800}@media(max-width:560px){.tutorialSplash{padding:16px}.tutorialSplashTop,.tutorialSplashBody,.tutorialSplashFooter{padding-left:22px;padding-right:22px}.tutorialSplashTitle{font-size:23px}.tutorialSplashFooter{align-items:flex-start;flex-direction:column}.tutorialSplashActions{width:100%;justify-content:space-between}}
    `;
    style.textContent += `
      .tutorialSplash{display:block;padding:0;background:rgba(10,15,20,.72);backdrop-filter:none}.tutorialSplashCard{display:none}.tutorialSplashCanvas{position:absolute;inset:0;pointer-events:none}.tutorialCallout{position:fixed;max-width:min(310px,44vw);color:#fff;font-family:"Marker Felt","Comic Sans MS",cursive;font-size:clamp(17px,2vw,29px);font-weight:700;line-height:1.02;letter-spacing:.015em;text-transform:uppercase;text-align:center;text-shadow:0 2px 1px rgba(0,0,0,.45);transform:rotate(-2deg);white-space:pre-line}.tutorialCallout.is-small{font-size:clamp(14px,1.45vw,20px)}.tutorialCalloutArrow{position:absolute;width:116px;height:116px;object-fit:contain;filter:drop-shadow(0 2px 1px rgba(0,0,0,.45))}.tutorialCalloutArrow.points-down{transform:rotate(178deg)}.tutorialCalloutArrow.points-right{transform:rotate(88deg)}.tutorialCalloutArrow.points-left{transform:rotate(-88deg)}.tutorialOverlayControls{position:fixed;right:24px;bottom:22px;z-index:1;display:flex;align-items:center;gap:9px;padding:9px 11px;border:1px solid rgba(255,255,255,.65);border-radius:999px;background:rgba(10,15,20,.68);color:#fff}.tutorialOverlayControls button{border:0;border-radius:999px;padding:7px 12px;background:transparent;color:#fff;font-size:12px;font-weight:800}.tutorialOverlayControls button:hover,.tutorialOverlayControls button:focus-visible{background:#5c258d;outline:none}.tutorialOverlayCount{min-width:32px;text-align:center;font-size:12px;font-weight:800}.tutorialOverlayHint{position:fixed;left:24px;bottom:28px;color:rgba(255,255,255,.86);font-family:"Marker Felt","Comic Sans MS",cursive;font-size:16px;letter-spacing:.04em;text-transform:uppercase}@media(max-width:720px){.tutorialCallout{max-width:46vw;font-size:18px}.tutorialCalloutArrow{width:76px;height:76px}.tutorialOverlayControls{right:12px;bottom:12px}.tutorialOverlayHint{left:14px;bottom:18px;font-size:13px}}
    `;
    style.textContent += `.tutorialSplash,.tutorialCallout,.tutorialOverlayHint,.tutorialOverlayControls{font-family:"Trebuchet MS","Segoe UI",Arial,sans-serif}.tutorialCallout{font-size:clamp(15px,1.45vw,22px);font-weight:800;line-height:1.18;letter-spacing:.035em;text-shadow:0 2px 2px rgba(0,0,0,.55)}.tutorialCallout.is-small{font-size:clamp(12px,1.05vw,16px);line-height:1.22;letter-spacing:.045em}`;
    document.head.appendChild(style);
  };

  const buildOverlay = () => {
    injectStyles();
    const overlay = document.createElement("section");
    overlay.className = "tutorialSplash";
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Inebura tutorial annotations");
    overlay.innerHTML = `
      <div class="tutorialSplashCanvas" aria-live="polite"></div>
      <div class="tutorialOverlayHint">Use Close to exit the tutorial</div>
      <div class="tutorialOverlayControls"><button class="tutorialSplashSkip" type="button">Close</button><span class="tutorialOverlayCount"></span><button class="tutorialSplashNext" type="button">Next</button></div>`;
    document.body.appendChild(overlay);
    return overlay;
  };

  const init = () => {
    if (!getUserKey()) return;
    const tutorial = pageTutorials[pageKey()] || genericTutorial();
    const overlay = buildOverlay();
    const canvas = overlay.querySelector(".tutorialSplashCanvas");
    const progressLabel = overlay.querySelector(".tutorialOverlayCount");
    const next = overlay.querySelector(".tutorialSplashNext");
    const skip = overlay.querySelector(".tutorialSplashSkip");
    const labels = ["Navigation", "More to know", "Inside Inebura"];
    let step = 0;
    let opener = null;
    let replayButton = document.getElementById("openTutorialBtn");

    if (!replayButton) {
      replayButton = document.createElement("button");
      replayButton.id = "openTutorialBtn";
      replayButton.className = "tutorialReplayFloat";
      replayButton.type = "button";
      replayButton.textContent = "Tutorials";
      replayButton.setAttribute("aria-label", "Open tutorials");
      document.body.appendChild(replayButton);
    }

    const close = (markSeen) => {
      overlay.hidden = true;
      if (markSeen) {
        const progress = readProgress();
        progress[pageKey()] = { completedAt: new Date().toISOString() };
        saveProgress(progress);
      }
      opener?.focus?.();
    };
    const firstTarget = (selectors) => selectors
      .map((selector) => document.querySelector(selector))
      .find((element) => element && element.getBoundingClientRect().width > 0);
    const rootPath = document.body.dataset.rootPath || (window.location.pathname.includes("/pages/") ? "../" : window.location.pathname.includes("/bin/") ? "../../" : "");
    const arrowSource = `${rootPath}assets/tutorial/chalk-arrow-up-left.png`;
    const addCallout = (target, text, placement = "below", small = false, position = {}) => {
      if (!target || !text) return;
      const rect = target.getBoundingClientRect();
      const label = document.createElement("div");
      label.className = `tutorialCallout${small ? " is-small" : ""}`;
      label.textContent = text;
      const width = Math.min(310, Math.max(150, window.innerWidth * 0.27));
      const labelHeight = small ? 58 : 104;
      const arrowSize = small ? 96 : 176;
      const targetX = rect.left + (rect.width / 2);
      const targetY = rect.top + (rect.height / 2);
      let left = targetX + (arrowSize * 0.3);
      let top = targetY + (arrowSize * 0.23);
      left = Number.isFinite(position.left) ? position.left : left;
      top = Number.isFinite(position.top) ? position.top : top;
      left = Math.max(16, Math.min(left, window.innerWidth - width - 16));
      top = Math.max(92, Math.min(top, window.innerHeight - labelHeight - 100));
      label.style.left = `${left}px`;
      label.style.top = `${top}px`;
      const arrow = document.createElement("img");
      arrow.className = "tutorialCalloutArrow";
      arrow.src = arrowSource;
      arrow.alt = "";
      arrow.style.width = `${arrowSize}px`;
      arrow.style.height = `${arrowSize}px`;
      // The source arrow's head is at roughly 26% of its canvas. Anchor it to the live control.
      arrow.style.left = `${targetX - (arrowSize * 0.26)}px`;
      arrow.style.top = `${targetY - (arrowSize * 0.26)}px`;
      canvas.append(label, arrow);
    };
    const render = () => {
      canvas.replaceChildren();
      const menu = firstTarget(["#headerMenuBtn", "[data-admin-menu]"]);
      const notifications = firstTarget(["#notificationBellBtn", "[aria-label='Notifications']"]);
      const profile = firstTarget(["#headerUserBtn", "#openTutorialBtn"]);
      const mainAction = firstTarget(["#dashboardTrendsToggle", ".dashboardCard", ".cardClickable", ".aiTableToolbar", ".submissionCards", ".visitCalendar", ".clPanel", "main button"]);
      const supportingAction = firstTarget([".chartGrid", ".aiMetricStrip", ".submissionTable", ".visitCalendar", ".clPanel", "main table", "main section"]);
      const isAgentDashboard = pageKey() === "dashboard_agent";
      if (step === 0) {
        const menuRect = menu?.getBoundingClientRect();
        const notificationRect = notifications?.getBoundingClientRect();
        addCallout(menu, "Find every module\nfrom here", "below", true, menuRect ? { left: menuRect.right + 96, top: menuRect.bottom + 120 } : {});
        addCallout(notifications, "Stay in the loop\nwith live updates", "below", true, notificationRect ? { left: notificationRect.left - 164, top: notificationRect.bottom + 78 } : {});
      } else if (step === 1) {
        if (isAgentDashboard) {
          const trendButton = document.getElementById("dashboardTrendsToggle");
          const trendRect = trendButton?.getBoundingClientRect();
          addCallout(document.getElementById("totalNetDueCard"), "Click Total Net Due\nto open your landing page", "below", false, { left: 48, top: 450 });
          addCallout(document.getElementById("mtdCollectionCard"), "Other KPI cards open\ntheir drill-down detail", "below", true, { left: 410, top: 470 });
          addCallout(trendButton, "Open View Trends\nfor the performance story", "below", true, trendRect ? { left: trendRect.left - 126, top: trendRect.bottom + 116 } : {});
        } else {
          addCallout(mainAction, tutorial[1], "below");
          addCallout(supportingAction, "Tap into the detail\nbehind the summary", "above", true);
        }
      } else {
        addCallout(mainAction, tutorial[2], "below");
        addCallout(profile, "A refresher is always\nwaiting up here", "below", true);
      }
      progressLabel.textContent = labels[step];
      next.textContent = step === labels.length - 1 ? "Done" : "Next";
    };
    const open = (source) => {
      opener = source || document.activeElement;
      const userPopup = document.getElementById("userPopup");
      if (userPopup) userPopup.classList.add("hidden");
      document.getElementById("headerUserBtn")?.setAttribute("aria-expanded", "false");
      step = 0;
      render();
      overlay.hidden = false;
      next.focus();
    };

    next.addEventListener("click", () => { if (step < labels.length - 1) { step += 1; render(); } else close(true); });
    skip.addEventListener("click", () => close(true));
    replayButton.addEventListener("click", (event) => open(event.currentTarget));

    window.IneburaTutorials = { open: () => open(document.activeElement), resetCurrentPage: () => { const progress = readProgress(); delete progress[pageKey()]; saveProgress(progress); } };
    if (!readProgress()[pageKey()]) window.setTimeout(() => open(document.activeElement), 350);
  };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init, { once: true });
  else init();
})();
