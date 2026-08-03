(() => {
  "use strict";

  if (window.IneburaTutorials) return;

  const STORAGE_PREFIX = "ineburaTutorialProgress:v1";
  const PAGE_KEY = "dashboard_agent";
  const steps = [
    {
      label: "Navigation",
      accent: "#60a5fa",
      callouts: [
        {
          selector: "#headerMenuBtn",
          eyebrow: "Module menu",
          title: "Move across Inebura",
          copy: "Open Landing, Issue Tracker, AR Transactions, PDC, Commitment and the other modules from here.",
          placement: "bottom"
        },
        {
          selector: "#notificationBellBtn",
          eyebrow: "Notifications",
          title: "Stay with the live queue",
          copy: "Open notifications to review the updates waiting for your attention.",
          placement: "bottom"
        }
      ]
    },
    {
      label: "More to know",
      accent: "#c084fc",
      callouts: [
        {
          selector: "#totalNetDueCard",
          eyebrow: "KPI drill-downs",
          title: "Start with Total Net Due",
          copy: "Open this card to move to the landing workspace. The other clickable KPI cards open their own supporting detail.",
          placement: "bottom"
        },
        {
          selector: "#dashboardTrendsToggle",
          eyebrow: "Performance trends",
          title: "Read the story over time",
          copy: "Open View Trends to compare dashboard performance across the available periods.",
          placement: "left"
        }
      ]
    },
    {
      label: "Inside Inebura",
      accent: "#34d399",
      callouts: [
        {
          selector: "#dashboardSummaryBtn",
          eyebrow: "Dashboard summary",
          title: "Turn the screen into a brief",
          copy: "Use Summary for a concise reading of the dashboard data currently in view.",
          placement: "bottom"
        },
        {
          selector: "#headerUserBtn",
          eyebrow: "Anytime refresher",
          title: "Replay the tutorial",
          copy: "Open Tutorials from the profile menu whenever you want another guided lap.",
          placement: "left"
        }
      ]
    }
  ];

  let overlay = null;
  let stage = null;
  let currentStep = 0;
  let opener = null;
  let resizeFrame = 0;

  const normalize = (value) => String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const getUserKey = () => {
    let profile = {};
    try { profile = JSON.parse(localStorage.getItem("userProfile") || "{}"); } catch (_) { profile = {}; }
    const identity = profile.email
      || profile.loginId
      || localStorage.getItem("activeUserId")
      || localStorage.getItem("activeUserName");
    const role = localStorage.getItem("activeUserRole");
    const tenant = localStorage.getItem("activeTenantId")
      || document.body.dataset.relationshipName
      || "default";
    return [normalize(tenant), normalize(identity || "preview-user"), normalize(role || "agent")].join(":");
  };

  const storageKey = () => `${STORAGE_PREFIX}:${getUserKey()}`;
  const readProgress = () => {
    try { return JSON.parse(localStorage.getItem(storageKey()) || "{}") || {}; } catch (_) { return {}; }
  };
  const saveProgress = (progress) => {
    try { localStorage.setItem(storageKey(), JSON.stringify(progress)); } catch (_) { /* Never block dashboard work. */ }
  };
  const markSeen = () => {
    const progress = readProgress();
    progress[PAGE_KEY] = { completedAt: new Date().toISOString() };
    saveProgress(progress);
  };

  const injectStyles = () => {
    if (document.getElementById("dashboardAgentTutorialStyles")) return;
    const style = document.createElement("style");
    style.id = "dashboardAgentTutorialStyles";
    style.textContent = `
      .dashboardTutorialOverlay {
        position: fixed;
        inset: 0;
        z-index: 10070;
        overflow: hidden;
        background: rgba(8, 15, 30, .60);
        color: #f8fafc;
        font-family: "Avenir Next", "Segoe UI", Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
      }
      .dashboardTutorialOverlay[hidden] { display: none; }
      .dashboardTutorialStage {
        position: absolute;
        inset: 0;
        pointer-events: none;
      }
      .dashboardTutorialFocus {
        position: fixed;
        z-index: 1;
        box-sizing: border-box;
        border: 2px solid var(--dashboard-tutorial-accent);
        border-radius: 12px;
        background: rgba(255, 255, 255, .06);
        box-shadow:
          0 0 0 4px rgba(255, 255, 255, .12),
          0 8px 24px rgba(2, 6, 23, .28);
      }
      .dashboardTutorialFocus::after {
        content: "";
        position: absolute;
        inset: -7px;
        border: 1px solid rgba(255, 255, 255, .38);
        border-radius: 16px;
      }
      .dashboardTutorialCallout {
        position: fixed;
        z-index: 3;
        width: min(278px, calc(100vw - 36px));
        box-sizing: border-box;
        padding: 15px 17px 16px;
        border: 1px solid rgba(255, 255, 255, .25);
        border-left: 4px solid var(--dashboard-tutorial-accent);
        border-radius: 14px;
        background: rgba(15, 23, 42, .95);
        box-shadow: 0 16px 42px rgba(2, 6, 23, .35);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        text-align: left;
      }
      .dashboardTutorialEyebrow {
        margin: 0 0 5px;
        color: var(--dashboard-tutorial-accent);
        font-size: 10px;
        font-weight: 800;
        line-height: 1.2;
        letter-spacing: .13em;
        text-transform: uppercase;
      }
      .dashboardTutorialTitle {
        margin: 0;
        color: #fff;
        font-size: 16px;
        font-weight: 750;
        line-height: 1.25;
        letter-spacing: -.01em;
      }
      .dashboardTutorialCopy {
        margin: 6px 0 0;
        color: #cbd5e1;
        font-size: 12.5px;
        font-weight: 500;
        line-height: 1.45;
      }
      .dashboardTutorialArrow {
        position: fixed;
        z-index: 2;
        width: 72px;
        height: 72px;
        object-fit: contain;
        pointer-events: none;
        opacity: .96;
        filter: drop-shadow(0 3px 3px rgba(2, 6, 23, .48));
        transform-origin: 50% 50%;
      }
      .dashboardTutorialHint {
        position: fixed;
        left: 24px;
        bottom: 27px;
        margin: 0;
        color: rgba(255, 255, 255, .78);
        font-size: 11px;
        font-weight: 700;
        letter-spacing: .08em;
        text-transform: uppercase;
      }
      .dashboardTutorialControls {
        position: fixed;
        right: 22px;
        bottom: 18px;
        display: flex;
        align-items: center;
        gap: 8px;
        min-height: 46px;
        padding: 6px;
        border: 1px solid rgba(255, 255, 255, .28);
        border-radius: 16px;
        background: rgba(15, 23, 42, .95);
        box-shadow: 0 14px 36px rgba(2, 6, 23, .35);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
      }
      .dashboardTutorialControls button {
        min-height: 34px;
        border: 0;
        border-radius: 10px;
        padding: 7px 11px;
        background: transparent;
        color: #e2e8f0;
        font: inherit;
        font-size: 12px;
        font-weight: 750;
        cursor: pointer;
      }
      .dashboardTutorialControls button:hover,
      .dashboardTutorialControls button:focus-visible {
        background: rgba(255, 255, 255, .11);
        outline: 2px solid rgba(255, 255, 255, .7);
        outline-offset: 1px;
      }
      .dashboardTutorialNext {
        background: var(--dashboard-tutorial-accent) !important;
        color: #07111f !important;
        padding-inline: 15px !important;
      }
      .dashboardTutorialBack[hidden] { display: none; }
      .dashboardTutorialStepMeta {
        display: grid;
        gap: 4px;
        min-width: 118px;
        padding: 0 6px;
      }
      .dashboardTutorialStepName {
        color: #fff;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: .02em;
        text-align: center;
      }
      .dashboardTutorialDots {
        display: flex;
        justify-content: center;
        gap: 5px;
      }
      .dashboardTutorialDot {
        width: 18px;
        height: 3px;
        border-radius: 999px;
        background: rgba(255, 255, 255, .24);
      }
      .dashboardTutorialDot.is-active { background: var(--dashboard-tutorial-accent); }
      @media (max-width: 760px) {
        .dashboardTutorialCallout {
          width: min(238px, calc(100vw - 28px));
          padding: 12px 14px 13px;
        }
        .dashboardTutorialTitle { font-size: 14px; }
        .dashboardTutorialCopy { font-size: 11.5px; }
        .dashboardTutorialArrow { width: 56px; height: 56px; }
        .dashboardTutorialHint { display: none; }
        .dashboardTutorialControls {
          right: 10px;
          bottom: 10px;
          left: 10px;
          justify-content: space-between;
        }
        .dashboardTutorialStepMeta { min-width: 96px; }
      }
      @media (prefers-reduced-motion: no-preference) {
        .dashboardTutorialCallout,
        .dashboardTutorialFocus { animation: dashboardTutorialEnter .2s ease-out both; }
        @keyframes dashboardTutorialEnter {
          from { opacity: 0; transform: translateY(5px); }
          to { opacity: 1; transform: translateY(0); }
        }
      }
    `;
    document.head.appendChild(style);
  };

  const clamp = (value, min, max) => Math.min(Math.max(value, min), Math.max(min, max));
  const intersects = (a, b, padding = 0) => !(
    a.right + padding <= b.left
    || a.left >= b.right + padding
    || a.bottom + padding <= b.top
    || a.top >= b.bottom + padding
  );
  const intersectionArea = (a, b, padding = 0) => {
    const width = Math.max(0, Math.min(a.right + padding, b.right + padding) - Math.max(a.left - padding, b.left - padding));
    const height = Math.max(0, Math.min(a.bottom + padding, b.bottom + padding) - Math.max(a.top - padding, b.top - padding));
    return width * height;
  };

  const candidateFor = (placement, target, width, height, gap) => {
    if (placement === "top") {
      return { left: target.left + (target.width - width) / 2, top: target.top - height - gap };
    }
    if (placement === "bottom") {
      return { left: target.left + (target.width - width) / 2, top: target.bottom + gap };
    }
    if (placement === "left") {
      return { left: target.left - width - gap, top: target.top + (target.height - height) / 2 };
    }
    return { left: target.right + gap, top: target.top + (target.height - height) / 2 };
  };

  const placeCallout = (card, target, preferred, occupied) => {
    const measured = card.getBoundingClientRect();
    const width = measured.width;
    const height = measured.height;
    const gap = window.innerWidth < 760 ? 48 : 68;
    const safeTop = 72;
    const safeBottom = 88;
    const placements = [preferred, "right", "left", "bottom", "top"]
      .filter((value, index, list) => list.indexOf(value) === index);
    const rawCandidates = placements.map((placement, priority) => ({
      ...candidateFor(placement, target, width, height, gap),
      placement,
      priority
    }));

    const gridLefts = [18, (window.innerWidth - width) / 2, window.innerWidth - width - 18];
    const gridTops = [safeTop, safeTop + 142, window.innerHeight - height - safeBottom];
    gridTops.forEach((top, row) => {
      gridLefts.forEach((left, column) => {
        rawCandidates.push({ left, top, placement: "lane", priority: 8 + row + column });
      });
    });

    const controlsRect = {
      left: window.innerWidth - 390,
      top: window.innerHeight - 86,
      right: window.innerWidth,
      bottom: window.innerHeight
    };
    const hintRect = {
      left: 0,
      top: window.innerHeight - 64,
      right: 300,
      bottom: window.innerHeight
    };
    const targetCenter = {
      x: target.left + target.width / 2,
      y: target.top + target.height / 2
    };

    const options = rawCandidates.map((candidate) => {
      const left = clamp(candidate.left, 16, window.innerWidth - width - 16);
      const top = clamp(candidate.top, safeTop, window.innerHeight - height - safeBottom);
      const rect = { left, top, right: left + width, bottom: top + height, width, height };
      const clampPenalty = Math.abs(left - candidate.left) + Math.abs(top - candidate.top);
      const targetPenalty = intersects(rect, target, 12) ? 50000 + intersectionArea(rect, target, 12) : 0;
      const occupiedPenalty = occupied.reduce((score, other) => (
        score + (intersects(rect, other, 18) ? 30000 + intersectionArea(rect, other, 18) : 0)
      ), 0);
      const controlsPenalty = intersects(rect, controlsRect, 8) ? 40000 : 0;
      const hintPenalty = intersects(rect, hintRect, 8) ? 20000 : 0;
      const center = { x: left + width / 2, y: top + height / 2 };
      const distancePenalty = Math.hypot(center.x - targetCenter.x, center.y - targetCenter.y) * .04;
      return {
        rect,
        score: targetPenalty
          + occupiedPenalty
          + controlsPenalty
          + hintPenalty
          + clampPenalty
          + distancePenalty
          + (candidate.priority * 16)
      };
    });

    const best = options.sort((a, b) => a.score - b.score)[0];
    card.style.left = `${best.rect.left}px`;
    card.style.top = `${best.rect.top}px`;
    occupied.push(best.rect);
    return best.rect;
  };

  const edgePoint = (rect, toward) => {
    const center = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    const dx = toward.x - center.x;
    const dy = toward.y - center.y;
    const horizontalScale = dx === 0 ? Number.POSITIVE_INFINITY : (rect.width / 2) / Math.abs(dx);
    const verticalScale = dy === 0 ? Number.POSITIVE_INFINITY : (rect.height / 2) / Math.abs(dy);
    const scale = Math.min(horizontalScale, verticalScale);
    return { x: center.x + (dx * scale), y: center.y + (dy * scale) };
  };

  const addArrow = (cardRect, targetRect) => {
    const targetCenter = {
      x: targetRect.left + targetRect.width / 2,
      y: targetRect.top + targetRect.height / 2
    };
    const cardCenter = {
      x: cardRect.left + cardRect.width / 2,
      y: cardRect.top + cardRect.height / 2
    };
    const tail = edgePoint(cardRect, targetCenter);
    const head = edgePoint(targetRect, cardCenter);
    const dx = head.x - tail.x;
    const dy = head.y - tail.y;
    if (Math.hypot(dx, dy) < 26) return;

    const arrow = document.createElement("img");
    const size = window.innerWidth < 760 ? 56 : 72;
    const desiredAngle = Math.atan2(dy, dx) * (180 / Math.PI);
    const sourceAngle = -133;
    arrow.className = "dashboardTutorialArrow";
    arrow.src = "../assets/tutorial/chalk-arrow-up-left.png";
    arrow.alt = "";
    arrow.style.width = `${size}px`;
    arrow.style.height = `${size}px`;
    arrow.style.left = `${((tail.x + head.x) / 2) - (size / 2)}px`;
    arrow.style.top = `${((tail.y + head.y) / 2) - (size / 2)}px`;
    arrow.style.transform = `rotate(${desiredAngle - sourceAngle}deg)`;
    stage.appendChild(arrow);
  };

  const visibleTarget = (selector) => {
    const target = document.querySelector(selector);
    if (!target) return null;
    const rect = target.getBoundingClientRect();
    if (rect.width < 2 || rect.height < 2 || rect.bottom < 0 || rect.top > window.innerHeight) return null;
    return target;
  };

  const render = () => {
    if (!overlay || overlay.hidden) return;
    const tutorialStep = steps[currentStep];
    overlay.style.setProperty("--dashboard-tutorial-accent", tutorialStep.accent);
    stage.replaceChildren();
    const occupied = [];

    tutorialStep.callouts.forEach((item) => {
      const target = visibleTarget(item.selector);
      if (!target) return;
      const targetRect = target.getBoundingClientRect();

      const focus = document.createElement("div");
      focus.className = "dashboardTutorialFocus";
      focus.style.setProperty("--dashboard-tutorial-accent", tutorialStep.accent);
      focus.style.left = `${Math.max(4, targetRect.left - 6)}px`;
      focus.style.top = `${Math.max(4, targetRect.top - 6)}px`;
      focus.style.width = `${Math.min(window.innerWidth - Math.max(4, targetRect.left - 6) - 4, targetRect.width + 12)}px`;
      focus.style.height = `${targetRect.height + 12}px`;
      stage.appendChild(focus);

      const card = document.createElement("article");
      card.className = "dashboardTutorialCallout";
      card.style.setProperty("--dashboard-tutorial-accent", tutorialStep.accent);
      card.innerHTML = `
        <p class="dashboardTutorialEyebrow"></p>
        <h2 class="dashboardTutorialTitle"></h2>
        <p class="dashboardTutorialCopy"></p>
      `;
      card.querySelector(".dashboardTutorialEyebrow").textContent = item.eyebrow;
      card.querySelector(".dashboardTutorialTitle").textContent = item.title;
      card.querySelector(".dashboardTutorialCopy").textContent = item.copy;
      stage.appendChild(card);

      const cardRect = placeCallout(card, targetRect, item.placement, occupied);
      addArrow(cardRect, targetRect);
    });

    overlay.querySelector(".dashboardTutorialStepName").textContent = tutorialStep.label;
    overlay.querySelectorAll(".dashboardTutorialDot").forEach((dot, index) => {
      dot.classList.toggle("is-active", index === currentStep);
    });
    const back = overlay.querySelector(".dashboardTutorialBack");
    const next = overlay.querySelector(".dashboardTutorialNext");
    back.hidden = currentStep === 0;
    next.textContent = currentStep === steps.length - 1 ? "Done" : "Next";
  };

  const close = (remember = true) => {
    if (!overlay || overlay.hidden) return;
    overlay.hidden = true;
    document.body.style.removeProperty("overflow");
    if (remember) markSeen();
    opener?.focus?.();
  };

  const open = (source) => {
    if (!overlay) return;
    opener = source || document.activeElement;
    const userPopup = document.getElementById("userPopup");
    if (userPopup) userPopup.classList.add("hidden");
    document.getElementById("headerUserBtn")?.setAttribute("aria-expanded", "false");
    currentStep = 0;
    overlay.hidden = false;
    document.body.style.overflow = "hidden";
    render();
    overlay.querySelector(".dashboardTutorialNext")?.focus();
  };

  const reset = () => {
    const progress = readProgress();
    delete progress[PAGE_KEY];
    saveProgress(progress);
  };

  window.IneburaTutorials = {
    open: () => open(document.activeElement),
    resetCurrentPage: reset
  };

  const init = () => {
    injectStyles();
    overlay = document.createElement("section");
    overlay.className = "dashboardTutorialOverlay";
    overlay.hidden = true;
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Agent Dashboard page tutorial");
    overlay.innerHTML = `
      <div class="dashboardTutorialStage" aria-live="polite"></div>
      <p class="dashboardTutorialHint">Use Close to exit the tutorial</p>
      <div class="dashboardTutorialControls">
        <button class="dashboardTutorialClose" type="button">Close</button>
        <button class="dashboardTutorialBack" type="button">Back</button>
        <div class="dashboardTutorialStepMeta">
          <span class="dashboardTutorialStepName"></span>
          <span class="dashboardTutorialDots" aria-hidden="true">
            <span class="dashboardTutorialDot"></span>
            <span class="dashboardTutorialDot"></span>
            <span class="dashboardTutorialDot"></span>
          </span>
        </div>
        <button class="dashboardTutorialNext" type="button">Next</button>
      </div>
    `;
    document.body.appendChild(overlay);
    stage = overlay.querySelector(".dashboardTutorialStage");

    overlay.querySelector(".dashboardTutorialClose").addEventListener("click", () => close(true));
    overlay.querySelector(".dashboardTutorialBack").addEventListener("click", () => {
      if (currentStep > 0) {
        currentStep -= 1;
        render();
      }
    });
    overlay.querySelector(".dashboardTutorialNext").addEventListener("click", () => {
      if (currentStep < steps.length - 1) {
        currentStep += 1;
        render();
      } else {
        close(true);
      }
    });
    window.addEventListener("resize", () => {
      window.cancelAnimationFrame(resizeFrame);
      resizeFrame = window.requestAnimationFrame(render);
    });

    document.getElementById("openTutorialBtn")?.addEventListener("click", (event) => open(event.currentTarget));

    const forceOpen = new URLSearchParams(window.location.search).get("tutorial") === "1";
    if (forceOpen || !readProgress()[PAGE_KEY]) {
      window.setTimeout(() => open(document.activeElement), 550);
    }
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
