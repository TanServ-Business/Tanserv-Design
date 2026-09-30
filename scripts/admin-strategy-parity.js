/* TestClient parity around the existing in-memory Strategy Master builder. */
window.IneburaAdminStrategyParity = mount => {
  const setText = (element, value) => {
    if (element) element.textContent = value;
  };
  const list = mount.querySelector("#smListScreen");
  const shell = mount.querySelector(".smListShell");
  if (!list || !shell) return;

  const nav = document.createElement("nav");
  nav.className = "adminRuntimeTabs adminStrategyTabs";
  nav.setAttribute("aria-label", "Strategy Manager sections");
  nav.innerHTML = '<a href="?module=strategy-manager" class="is-active"><i class="bi bi-diagram-3" aria-hidden="true"></i>Strategies</a><a href="?module=strategy-manager&view=email-sender"><i class="bi bi-envelope-at" aria-hidden="true"></i>Email Sender</a>';
  shell.prepend(nav);

  const search = shell.querySelector("#smListSearch");
  search?.setAttribute("aria-label", "Search by strategy name");
  const statusFilter = shell.querySelector("#smListStatusFilter");
  if (statusFilter) {
    statusFilter.setAttribute("aria-label", "Filter by status");
    statusFilter.options[1].textContent = "Running";
    statusFilter.options[2].textContent = "Paused";
  }
  shell.querySelector("#smListScopeFilter")?.setAttribute("aria-label", "Filter by target");

  const count = document.createElement("div");
  count.className = "adminStrategyCount";
  shell.querySelector(".smToolbar")?.append(count);
  const pager = document.createElement("div");
  pager.className = "adminPlatformFooter adminStrategyPager";
  shell.append(pager);

  let currentPage = 1;
  let decorating = false;
  const decorateList = () => {
    if (decorating) return;
    decorating = true;
    const rows = [...shell.querySelectorAll("#smStrategyListBody > tr")];
    const pageCount = Math.max(1, Math.ceil(rows.length / 10));
    currentPage = Math.min(currentPage, pageCount);
    rows.forEach((row, index) => {
      row.hidden = index < (currentPage - 1) * 10 || index >= currentPage * 10;
      if (row.children[2] && index === 0) row.children[2].textContent = "Invoice";
      if (row.children[3]) row.children[3].textContent = "All selected";
      if (row.dataset.parityDecorated !== "true") {
        row.dataset.parityDecorated = "true";
        const pill = row.querySelector(".smStatusPill");
        if (pill) pill.textContent = pill.classList.contains("is-active") ? "Running" : "Paused";
        row.querySelector(".smCellMeta")?.remove();
      }
    });
    count.textContent = `${rows.length} strategies`;
    pager.innerHTML = `
      <span>Showing ${rows.length ? (currentPage - 1) * 10 + 1 : 0}–${Math.min(currentPage * 10, rows.length)} of ${rows.length}</span>
      <button class="adminSecondary" data-strategy-page="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} aria-label="Previous page"><i class="bi bi-chevron-left"></i></button>
      ${Array.from({ length: pageCount }, (_, index) => `<button class="${index + 1 === currentPage ? "adminPrimary" : "adminSecondary"}" data-strategy-page="${index + 1}" aria-label="Page ${index + 1}">${index + 1}</button>`).join("")}
      <button class="adminSecondary" data-strategy-page="${currentPage + 1}" ${currentPage === pageCount ? "disabled" : ""} aria-label="Next page"><i class="bi bi-chevron-right"></i></button>`;
    decorating = false;
  };

  const listObserver = new MutationObserver(() => requestAnimationFrame(decorateList));
  listObserver.observe(shell.querySelector("#smStrategyListBody"), { childList: true });
  decorateList();

  const modeSelections = new Map();
  const agingInitialized = new Set();
  const templateStack = mount.querySelector("#smTemplateStack");

  const markRequired = (container, startsWith) => {
    const label = [...container.querySelectorAll(".smField > span,.smTemplateField > span")]
      .find(element => element.textContent.trim().startsWith(startsWith));
    if (label && !label.textContent.includes("*")) label.append(" *");
  };

  const selectAllAging = uid => {
    const card = templateStack.querySelector(`[data-template-card][data-template-uid="${uid}"]`);
    const unchecked = card?.querySelector('input[data-template-check="agingBuckets"]:not(:checked)');
    if (!unchecked) return;
    unchecked.checked = true;
    unchecked.dispatchEvent(new Event("change", { bubbles: true }));
    requestAnimationFrame(() => selectAllAging(uid));
  };

  const patchBuilder = () => {
    markRequired(mount, "Reminder Type");
    const statusLabel = mount.querySelector("#smStatusLabel");
    if (statusLabel) statusLabel.textContent = mount.querySelector("#smStatus")?.checked ? "Running" : "Paused";

    templateStack?.querySelectorAll("[data-template-card]").forEach(card => {
      markRequired(card, "Template");
      markRequired(card, "Notification Mode");
      const uid = card.dataset.templateUid;
      const templateSelect = card.querySelector('[data-template-field="templateId"]');
      const modeSelect = card.querySelector('[data-template-field="notificationMode"]');
      const remove = card.querySelector("[data-remove-template]");
      remove?.classList.remove("hidden");
      if (remove) {
        remove.innerHTML = '<i class="bi bi-trash" aria-hidden="true"></i>';
        remove.setAttribute("aria-label", "Remove template");
        remove.setAttribute("title", "Remove template");
      }

      if (templateSelect?.value && modeSelect && !modeSelect.disabled && !modeSelections.has(uid)) {
        const placeholder = [...modeSelect.options].find(option => option.value === "") || document.createElement("option");
        placeholder.value = "";
        placeholder.textContent = "Select";
        placeholder.selected = true;
        if (!placeholder.isConnected) modeSelect.prepend(placeholder);
        modeSelect.value = "";
      }

      if (templateSelect?.value === "reminder_for_payment_due" && !agingInitialized.has(uid)) {
        agingInitialized.add(uid);
        requestAnimationFrame(() => selectAllAging(uid));
      }

      if (!templateSelect?.value) {
        const schedulePanel = [...card.querySelectorAll(".smTemplatePanel")]
          .find(panel => panel.querySelector("h3")?.textContent === "Schedule");
        if (schedulePanel) {
          schedulePanel.className = "adminStrategyTemplatePrompt";
          schedulePanel.innerHTML = '<i class="bi bi-arrow-up-circle" aria-hidden="true"></i><strong>Select a template above to continue</strong><span>Its schedule and reminder steps will appear here.</span>';
        }
      }

      const agingPanel = [...card.querySelectorAll(".smTemplatePanel")].find(panel => panel.querySelector("h3")?.textContent === "Aging Buckets");
      if (agingPanel && !agingPanel.querySelector("[data-parity-aging-all]")) {
        const actions = document.createElement("div");
        actions.className = "smSectionActions adminAgingActions";
        actions.innerHTML = `<button class="smTinyBtn" type="button" data-parity-aging-all="${uid}">Select All</button><button class="smTinyBtn" type="button" data-parity-aging-clear="${uid}">Clear</button>`;
        agingPanel.querySelector(".smTemplatePanelHead")?.append(actions);
      }
    });
  };

  const builderObserver = new MutationObserver(() => requestAnimationFrame(patchBuilder));
  if (templateStack) builderObserver.observe(templateStack, { childList: true });
  patchBuilder();

  mount.querySelector("#smStatus")?.addEventListener("change", () => requestAnimationFrame(patchBuilder));
  templateStack?.addEventListener("change", event => {
    if (event.target.matches('[data-template-field="notificationMode"]')) {
      modeSelections.set(event.target.dataset.templateUid, event.target.value);
    }
  }, true);

  mount.querySelector("#smForm")?.addEventListener("submit", event => {
    const incompleteMode = [...templateStack.querySelectorAll('[data-template-field="notificationMode"]')]
      .find(select => !select.disabled && !select.value);
    if (!incompleteMode) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const error = mount.querySelector("#smError");
    if (error) {
      error.textContent = "Choose a notification mode for every selected template.";
      error.classList.remove("hidden");
    }
    incompleteMode.focus();
  }, true);

  templateStack?.addEventListener("click", event => {
    const remove = event.target.closest("[data-remove-template]");
    if (remove && templateStack.querySelectorAll("[data-template-card]").length === 1) {
      event.preventDefault();
      event.stopImmediatePropagation();
      const select = remove.closest("[data-template-card]")?.querySelector('[data-template-field="templateId"]');
      if (select) {
        modeSelections.delete(select.dataset.templateUid);
        agingInitialized.delete(select.dataset.templateUid);
        select.value = "";
        select.dispatchEvent(new Event("change", { bubbles: true }));
      }
      return;
    }
    const all = event.target.closest("[data-parity-aging-all]");
    if (all) {
      event.preventDefault();
      selectAllAging(all.dataset.parityAgingAll);
    }
    const clear = event.target.closest("[data-parity-aging-clear]");
    if (clear) {
      event.preventDefault();
      const clearNext = () => {
        const checked = templateStack.querySelector(`[data-template-card][data-template-uid="${clear.dataset.parityAgingClear}"] input[data-template-check="agingBuckets"]:checked`);
        if (!checked) return;
        checked.checked = false;
        checked.dispatchEvent(new Event("change", { bubbles: true }));
        requestAnimationFrame(clearNext);
      };
      clearNext();
    }
  }, true);

  mount.addEventListener("click", event => {
    const pageButton = event.target.closest("[data-strategy-page]");
    if (pageButton && !pageButton.disabled) {
      currentPage = Number(pageButton.dataset.strategyPage);
      decorateList();
    }
  });

  if (window.IneburaAdminPage.view === "email-sender") {
    nav.querySelectorAll("a").forEach((link, index) => link.classList.toggle("is-active", index === 1));
    mount.querySelector("#smCreateNewBtn").hidden = true;
    shell.querySelectorAll(":scope > :not(.adminStrategyTabs)").forEach(element => { element.hidden = true; });

    const panel = document.createElement("section");
    panel.className = "adminStrategySender";
    panel.innerHTML = `
      <div class="adminSenderBanner">
        <span class="adminSenderIcon"><i class="bi bi-send" aria-hidden="true"></i></span>
        <span><small>Currently sending from</small><strong id="strategySenderCurrent">sender@example.test</strong></span>
        <span class="adminSenderBadge"><i class="bi bi-building" aria-hidden="true"></i>Client Account</span>
      </div>
      <div class="adminSenderQuestion">
        <h3>Where should reminders be sent from?</h3>
        <p>This one setting applies to every strategy you create — it is not set per strategy.</p>
      </div>
      <fieldset class="adminSenderChoices">
        <legend>Email sender</legend>
        <label class="adminSenderChoice is-selected">
          <input type="radio" name="strategySender" value="system" checked>
          <span class="adminSenderChoiceIcon"><i class="bi bi-building" aria-hidden="true"></i></span>
          <span><strong>System email account</strong><small>The account configured for this client — <b>sender@example.test</b></small></span>
          <i class="bi bi-check-circle-fill adminSenderCheck" aria-hidden="true"></i>
        </label>
        <label class="adminSenderChoice">
          <input type="radio" name="strategySender" value="mine">
          <span class="adminSenderChoiceIcon"><i class="bi bi-person-badge" aria-hidden="true"></i></span>
          <span><strong>My email sender account</strong><small>Send from <b>admin@example.test</b></small></span>
          <i class="bi bi-check-circle-fill adminSenderCheck" aria-hidden="true"></i>
        </label>
      </fieldset>
      <p class="adminSenderHelp"><i class="bi bi-info-circle" aria-hidden="true"></i>Sender mailboxes themselves are added under <a href="?module=sender-account">Communication Setup → Email Sender Accounts</a>.</p>
      <div class="adminSenderFooter">
        <button class="adminSecondary" id="strategySenderCancel" disabled>Cancel</button>
        <button class="adminPrimary" id="strategySenderSave" disabled><i class="bi bi-check-lg" aria-hidden="true"></i>Save changes</button>
      </div>`;
    shell.after(panel);

    const syncSenderChoices = () => panel.querySelectorAll(".adminSenderChoice").forEach(choice => {
      choice.classList.toggle("is-selected", choice.querySelector("input").checked);
    });
    const setSenderButtons = disabled => ["strategySenderCancel", "strategySenderSave"].forEach(id => { panel.querySelector(`#${id}`).disabled = disabled; });
    panel.addEventListener("change", () => {
      syncSenderChoices();
      setSenderButtons(false);
    });
    panel.querySelector("#strategySenderCancel").addEventListener("click", () => {
      panel.querySelector('input[value="system"]').checked = true;
      syncSenderChoices();
      setSenderButtons(true);
    });
    panel.querySelector("#strategySenderSave").addEventListener("click", () => {
      const mine = panel.querySelector('input[value="mine"]').checked;
      setText(panel.querySelector("#strategySenderCurrent"), mine ? "admin@example.test" : "sender@example.test");
      setSenderButtons(true);
      window.IneburaAdminPreviewNotice?.("Sender selection saved for this preview.");
    });
  }
};
