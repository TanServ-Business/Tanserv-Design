/* Mount existing rich views inside the single Admin chrome. */
(() => {
  const page = window.IneburaAdminPage;
  if (page?.renderer !== "composed") return;

  const mount = document.getElementById("adminPageContent");
  const entry = window.IneburaAdminComposed?.[page.module];
  if (!entry) {
    mount.textContent = "This Admin view is unavailable.";
    return;
  }

  const loadScript = src => new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = `${src}${src.includes("?") ? "&" : "?"}v=20260907-4`;
    script.onload = resolve;
    script.onerror = reject;
    document.head.append(script);
  });

  const loadStyle = href => new Promise((resolve, reject) => {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `${href}${href.includes("?") ? "&" : "?"}v=20260907-4`;
    link.onload = resolve;
    link.onerror = reject;
    document.head.append(link);
  });

  const dashboardSessions = [
    { initials: "AT", name: "admin TestClient", role: "USER", login: "10:20:30", logout: "10:20:30", autoLogouts: 0, highest: "00:18", sessions: 1 },
    { initials: "RA", name: "Rajneesh Agent", role: "USER", login: "09:28:53", logout: "10:19:09", autoLogouts: 0, highest: "00:38", sessions: 1 },
    { initials: "RA", name: "Rajneesh ACM", role: "USER", login: "09:26:36", logout: "09:26:36", autoLogouts: 0, highest: "00:22", sessions: 1 },
    { initials: "MA", name: "Manish Agent", role: "USER", login: "09:23:21", logout: "09:23:21", autoLogouts: 0, highest: "00:05", sessions: 1 },
  ];

  const setText = (element, value) => {
    if (element) element.textContent = value;
  };

  function renderDashboardSessions() {
    const tbody = mount.querySelector("#sessionTableBody");
    if (!tbody) return;
    tbody.innerHTML = dashboardSessions.map(user => `
      <tr>
        <td><div class="userNameCell"><div class="avatarCircle">${user.initials}</div><div class="userNameText">${user.name}</div></div></td>
        <td><span class="pill adminRolePill">${user.role}</span></td>
        <td>${user.login}</td>
        <td>${user.logout}</td>
        <td><span class="autoLogoutBadge none">${user.autoLogouts}</span></td>
        <td><strong>${user.highest}</strong></td>
        <td>${user.sessions}</td>
        <td><span class="sessionPill offline">Offline</span></td>
      </tr>`).join("");
  }

  function applyDashboardParity() {
    const heroTags = mount.querySelectorAll(".heroTag");
    setText(heroTags[0], "0 Active Now");
    setText(heroTags[2], "4 Total Users");

    const kpis = [...mount.querySelectorAll(".kpiGrid .dashboardCard")];
    const values = ["2,358", "0", "56", "0", "0", "4", "00:38"];
    kpis.forEach((card, index) => {
      const value = card.querySelector(".kpiValue");
      setText(value, values[index] || "0");
      if (value) value.dataset.counted = "true";
    });
    setText(kpis[0]?.querySelector(".kpiDelta"), "+0.0%");
    setText(kpis[0]?.querySelector(".kpiSplitLine"), "2,358 invoices");
    setText(kpis[1]?.querySelector(".kpiDelta"), "Active");
    setText(kpis[1]?.querySelector(".kpiSub"), "Updated: 0 (0%)");
    setText(kpis[3]?.querySelector(".kpiSub"), "of 4 total users · 0%");
    setText(kpis[4]?.querySelector(".kpiSub"), "Session timeout events");
    setText(kpis[5]?.querySelector(".kpiSub"), "Across all users today");
    setText(kpis[6]?.querySelector(".kpiSub"), "Rajneesh Agent");
    kpis[1]?.querySelector(".progressFill")?.style.setProperty("--value", "0");
    kpis[2]?.querySelector(".progressFill")?.style.setProperty("--value", ".1");

    const cards = [...mount.querySelectorAll(".dashboardCard")];
    cards.find(card => card.textContent.includes("Strategies Remaining"))?.parentElement.remove();
    cards.find(card => card.textContent.includes("Activity by Category"))?.parentElement.remove();
    const hourlyColumn = mount.querySelector('[data-chart="loginsByHour"]')?.parentElement;
    if (hourlyColumn) hourlyColumn.className = "col-12";
    mount.querySelectorAll(".actionStack > div").forEach(element => {
      element.className = "col-12 col-md-4";
    });

    const documents = [...mount.querySelectorAll(".actionMeta")].find(element => element.textContent.includes("Documents in Limbo"));
    if (documents) {
      setText(documents.querySelector("strong"), "39");
      setText(documents.querySelector("span:last-child"), "5 with strategy");
    }

    setText(mount.querySelector(".radialPercent"), "0%");
    setText(mount.querySelector(".radialDelta"), "of total users");
    setText(mount.querySelector(".radialGaugeValue"), "0");
    setText(mount.querySelector(".radialCallout"), "0 auto-logouts today. Session timeout events tracked.");
    mount.querySelectorAll(".radialSummaryValue").forEach((element, index) => setText(element, index === 0 ? "4" : index === 1 ? "4" : "0"));

    const chartStats = [...mount.querySelectorAll(".chartStat")];
    const statisticValues = ["09:00", "4", "0", "00:20", "00:20", "00:38", "00:05", "0", "0", "0"];
    chartStats.forEach((stat, index) => {
      const value = stat.querySelector("strong");
      setText(value, statisticValues[index] || "0");
      if (value) value.dataset.counted = "true";
    });
    const trendStats = [...mount.querySelectorAll('[data-chart="weekTrend"] .chartStat')];
    if (trendStats[2]) trendStats[2].innerHTML = "Today<strong>0</strong>";

    const feedBadge = mount.querySelector("#feedList")?.previousElementSibling?.querySelector(".pill");
    setText(feedBadge, "LIVE");
    const sessionSubtitle = mount.querySelector(".adminTableSection .adminCardSubtitle");
    if (sessionSubtitle && !sessionSubtitle.textContent.includes("today")) sessionSubtitle.textContent += " — today";
    mount.querySelectorAll(".userSessionTable thead th").forEach(header => {
      if (!header.querySelector(".adminSortMark")) header.insertAdjacentHTML("beforeend", '<span class="adminSortMark" aria-hidden="true">◆</span>');
    });

    const chartById = id => window.Chart?.getChart?.(mount.querySelector(`#${id}`));
    const healthChart = chartById("chartSystemHealth");
    if (healthChart) {
      healthChart.options.animation = false;
      healthChart.data.datasets[0].data = [0, 4];
      healthChart.update("none");
    }
    const hourChart = chartById("chartLoginsByHour");
    if (hourChart) {
      hourChart.options.animation = false;
      hourChart.data.labels = Array.from({ length: 24 }, (_, hour) => `${String(hour).padStart(2, "0")}:00`);
      hourChart.data.datasets[0].data = hourChart.data.labels.map((_, hour) => hour === 9 ? 3 : hour === 10 ? 1 : 0);
      hourChart.data.datasets[1].data = hourChart.data.labels.map(() => 0);
      hourChart.update("none");
    }
    const durationChart = chartById("chartSessionDuration");
    if (durationChart) {
      durationChart.options.animation = false;
      durationChart.data.labels = dashboardSessions.map(user => user.name);
      durationChart.data.datasets[0].data = [18, 38, 22, 5];
      durationChart.data.datasets[0].backgroundColor = dashboardSessions.map(() => "rgba(148,163,184,.55)");
      durationChart.update("none");
    }
    const trendChart = chartById("chartWeekTrend");
    if (trendChart) {
      trendChart.options.animation = false;
      trendChart.data.labels = ["Tue", "Wed", "Thu", "Fri", "Sat", "Sun", "Mon"];
      trendChart.data.datasets = trendChart.data.datasets.slice(0, 2);
      trendChart.data.datasets.forEach(dataset => {
        dataset.data = trendChart.data.labels.map(() => 0);
        dataset.fill = false;
        dataset.tension = 0;
      });
      trendChart.update("none");
    }

    const reset = () => {
      renderDashboardSessions();
      const feed = mount.querySelector("#feedList");
      if (feed) feed.innerHTML = '<div class="adminPlatformEmpty">No activity data available</div>';
    };
    reset();
    window.refreshDashboard = reset;
    window.filterSessions = (_, button) => {
      mount.querySelectorAll(".adminFilterTab").forEach(tab => tab.classList.toggle("active", tab === button));
      reset();
    };
  }

  function applyHelpParity() {
    const description = mount.querySelector("#ticketDescription");
    if (description) description.placeholder = "Provide as much detail as possible…";
    const attachment = mount.querySelector("#ticketFileLabel")?.closest(".hsFormField");
    if (attachment) attachment.hidden = true;
    mount.querySelectorAll(".feedbackStar").forEach(star => {
      star.setAttribute("aria-label", `${star.dataset.value} of 5 stars`);
      star.setAttribute("title", `${star.dataset.value} of 5 stars`);
    });

    const allArticles = mount.querySelector(".kbAllArticlesRow");
    if (allArticles && !mount.querySelector("#adminReferenceGuides")) {
      allArticles.insertAdjacentHTML("afterend", `
        <section class="adminReferenceGuides" id="adminReferenceGuides" aria-labelledby="adminReferenceGuidesTitle">
          <div class="kbSectionLabel" id="adminReferenceGuidesTitle">Reference Guides &amp; Tutorials</div>
          <div class="adminGuideGrid">
            <button type="button" onclick="openArticle('kb-001')"><i class="bi bi-receipt"></i><span>Invoice upload guide<small>Upload, validation and Limbo checks</small></span></button>
            <button type="button" onclick="openArticle('kb-014')"><i class="bi bi-person-plus"></i><span>User setup guide<small>Users, access and roles</small></span></button>
            <button type="button" onclick="openArticle('kb-050')"><i class="bi bi-geo-alt"></i><span>Visit planning guide<small>Plan and submission workflow</small></span></button>
            <button type="button" onclick="openArticle('kb-047')"><i class="bi bi-bell"></i><span>Notification center guide<small>Read, expand and review alerts</small></span></button>
          </div>
        </section>`);
    }
  }

  document.body.dataset.relationshipName = "TestClient Pvt Ltd";
  document.body.dataset.relationshipBadge = "TC";
  window.IneburaAdminReady = callback => callback();
  mount.innerHTML = '<div class="adminPreviewLoading">Loading Admin view…</div>';

  Promise.all([
    loadStyle("../assets/admin-reference/bootstrap.min.css"),
    ...entry.css.map(file => loadStyle(`../css/${file}`)),
    loadScript("../assets/admin-reference/bootstrap.bundle.min.js"),
    ...(page.module === "dashboard" ? [loadScript("../assets/admin-reference/chart.umd.min.js")] : []),
  ]).then(() => {
    mount.innerHTML = entry.html;
    window.IneburaAdminPreviewStorage.setItem("activeUserRole", "client-admin");
    window.IneburaAdminPreviewStorage.setItem("activeUserName", "Admin TestClient");
    window.IneburaAdminPreviewStorage.setItem("activeUserEmail", "admin@example.test");

    if (page.module === "help-support") window.IneburaAdminPreviewStorage.setItem("inebura_support_tickets", "[]");
    if (page.module === "strategy-manager") {
      const names = ["High Aging Invoices of Total O/S", "Days left to pay your O/S", "Invoices O/S due to given Sub Status", "Invoices O/S due to given Primary Status", "Total O/S is past due", "Total O/S to become Due", "Gentle Reminder of Payment of O/S", "Total O/S is Past Due (Key Account)", "Payment of Total O/S is still not paid post Due Date after multiple reminders", "Repeat Reminder for Payment of Total O/S"];
      const strategies = Array.from({ length: 24 }, (_, index) => ({
        id: `strategy-${index}`,
        strategyName: names[index % names.length] + (index >= 10 ? ` — Sample ${index + 1}` : ""),
        status: index < 10 ? "active" : "inactive",
        targetType: index % 6 === 0 ? "customer" : "invoice",
        targetMode: "all",
        templates: [{ templateId: "reminder_for_payment_due", notificationMode: "ongoing", ongoingInterval: 7 }],
        selectedTargetIds: [],
        excludedTargetIds: [],
      }));
      window.IneburaAdminPreviewStorage.setItem("ineburaStrategyMaster", JSON.stringify(strategies));
    }

    entry.start();
    if (page.module === "dashboard") applyDashboardParity();
    if (page.module === "help-support") applyHelpParity();
    document.body.classList.remove("motion-preload");

    if (page.module === "strategy-manager") {
      window.IneburaAdminStrategyParity?.(mount);
      document.getElementById("smCreateNewBtn")?.addEventListener("click", () => history.replaceState(null, "", "?module=strategy-manager&view=create"));
      if (page.view === "create") document.getElementById("smCreateNewBtn")?.click();
      ["smBackToListBtn", "smCancelBtn", "smFooterCancelBtn"].forEach(id => document.getElementById(id)?.addEventListener("click", () => history.replaceState(null, "", "?module=strategy-manager")));
    }
  }).catch(error => {
    console.error("Admin view could not be mounted", error);
    mount.innerHTML = '<div class="adminPlatformEmpty">Unable to load this view. Reload to retry.</div>';
  });

  window.IneburaAdminComposedParity = { dashboardSessions, applyDashboardParity, applyHelpParity };
})();
