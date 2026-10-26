/* Reference-matched Configurations tab. Drafts live only in this document. */
(() => {
  "use strict";
  const page = window.IneburaAdminPage;
  if (page?.module !== "module-configuration" || (page.view && page.view !== "configurations")) return;
  const mount = document.getElementById("adminPageContent");
  const modal = document.getElementById("adminModal");
  const modules = [
    { key: "auto", name: "Auto Submission", choice: "Auto Submission", on: false,
      description: "If enabled, invoices will be automatically submitted upon upload without manual submission activity." },
    { key: "tds", name: "TDS Module Applicable", choice: "TDS Module", on: true,
      description: "This module consolidates all TDS deductions in one place." },
    { key: "cn", name: "Credit Note/Advance Module Applicable", choice: "Credit Note Module", on: true,
      description: "If this module is enabled, CN details and Adhoc/Advance Payments can be uploaded to the customer account." },
    { key: "grn", name: "GRN Module Applicable", choice: "GRN Module", on: true,
      description: "If this module is enabled, the invoice due date can be set based on the GRN captured date once the GRN details are recorded." },
  ];
  const dunning = window.IneburaDunning;
  if (dunning?.getContext().role === "client-admin") modules.push({ key: "dunning", name: "Dunning Letters", choice: "Dunning Letters", on: dunning.getState().enabled,
    description: "Send daily letters for eligible overdue invoices. Manage templates, sending, schedules and reports in the Dunning Letters tab." });
  const references = ["Invoice due date does not change.", "Invoice due date changes as per GRN date."];
  let editable = new Set();
  let dunningDirty = false;
  let selectedReference = 1;
  let menuOpen = false;
  const button = (text, action, classes = "") => `<button type="button" class="${classes}" data-config-action="${action}">${text}</button>`;
  const render = () => `<div class="adminConfigurations">
    <div class="adminConfigurationToolbar"><p>Your existing setup is as shown below.</p>${button("Edit Configuration", "edit", "adminConfigurationCTA")}</div>
    ${modules.map(item => `<section class="adminConfigurationCard" aria-labelledby="config-${item.key}-title">
      <div class="adminConfigurationRow"><div class="adminConfigurationCopy">
        <h2 id="config-${item.key}-title">${item.name}</h2><p>${item.description}</p>
        ${item.key === "dunning" ? `<div class="adminConfigurationField"><label for="config-dunning-count">Number of Dunning Letters <span>*</span></label><input id="config-dunning-count" type="number" min="1" max="1000" step="1" value="${Number(dunning.getState().letterCount || 3)}" data-config-editable="dunning" disabled><small>One or more letters. Changing the count does not configure sending. <a href="?module=module-configuration&view=dunning-letters">Manage Dunning Letters</a></small></div>` : ""}
        ${item.key === "tds" ? `<div class="adminConfigurationField adminConfigurationTDS" data-config-details="tds"><label for="config-tds-percent">% applicable for TDS <span>*</span></label><input id="config-tds-percent" type="text" inputmode="decimal" placeholder="Enter TDS %" value="2" data-config-editable="tds" disabled></div>` : ""}
        ${item.key === "grn" ? `<div class="adminConfigurationField adminConfigurationGRN" data-config-details="grn"><label id="config-grn-label">GRN Date Reference</label><div class="adminConfigurationSelect">
          <button type="button" id="config-grn-reference" role="combobox" aria-labelledby="config-grn-label" aria-haspopup="listbox" aria-expanded="false" aria-controls="config-grn-options" data-config-action="reference" data-config-editable="grn" disabled><span>${references[1]}</span><i class="bi bi-chevron-down" aria-hidden="true"></i></button>
          <div id="config-grn-options" role="listbox" aria-labelledby="config-grn-label" hidden>${references.map((text, index) => `<button type="button" role="option" aria-selected="${index === 1}" data-config-option="${index}" tabindex="-1">${index === 1 ? '<i class="bi bi-check2" aria-hidden="true"></i>' : ""}${text}</button>`).join("")}</div>
        </div></div>` : ""}
      </div><label class="adminConfigurationToggle is-disabled"><input type="checkbox" aria-label="${item.name}" data-config-toggle="${item.key}" data-config-editable="${item.key}" ${item.on ? "checked" : ""} disabled></label></div>
    </section>`).join("")}
    <div class="adminConfigurationFooter">${button("Save Changes", "save", "adminConfigurationSave")}</div>
  </div>`;
  const closeModal = () => {
    modal.classList.remove("is-open");
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = "";
  };
  function setMenu(open, focusIndex) {
    const control = document.getElementById("config-grn-reference");
    if (!control) return;
    menuOpen = open && !control.disabled;
    control.setAttribute("aria-expanded", String(menuOpen));
    document.getElementById("config-grn-options").hidden = !menuOpen;
    if (menuOpen && focusIndex !== undefined) mount.querySelector(`[data-config-option="${focusIndex}"]`).focus();
  }
  function chooseReference(index) {
    if (!editable.has("grn") || !references[index]) return;
    selectedReference = index;
    const control = document.getElementById("config-grn-reference");
    control.querySelector("span").textContent = references[index];
    mount.querySelectorAll("[data-config-option]").forEach(option => {
      const selected = Number(option.dataset.configOption) === index;
      option.setAttribute("aria-selected", String(selected));
      option.textContent = references[Number(option.dataset.configOption)];
      if (selected) option.insertAdjacentHTML("afterbegin", '<i class="bi bi-check2" aria-hidden="true"></i>');
    });
    setMenu(false);
    control.focus();
  }
  function openEdit() {
    setMenu(false);
    // The live picker starts empty each time, even after an earlier Apply.
    modal.innerHTML = `<section class="adminModalCard adminConfigurationModal" role="dialog" aria-modal="true" aria-labelledby="config-edit-title">
      <header><h2 id="config-edit-title">Select fields to edit</h2><button type="button" class="adminConfigurationClose" aria-label="Close modal" data-config-action="cancel"><i class="bi bi-x-lg" aria-hidden="true"></i></button></header>
      <div class="adminConfigurationChoices">${modules.map(item => `<div><label><input type="checkbox" value="${item.key}" data-config-choice>${item.choice}</label></div>`).join("")}</div>
      <footer>${button("Cancel", "cancel", "adminConfigurationCancel")}${button("Apply", "apply", "adminConfigurationCTA")}</footer>
    </section>`;
    modal.classList.add("is-open");
    modal.setAttribute("aria-hidden", "false");
  }
  mount.addEventListener("click", event => {
    const action = event.target.closest("[data-config-action]")?.dataset.configAction;
    if (action === "edit") openEdit();
    if (action === "reference") setMenu(!menuOpen);
    if (action === "save") {
      if (dunning && editable.has("dunning")) {
        try {
          dunning.saveConfiguration({enabled:Boolean(mount.querySelector('[data-config-toggle="dunning"]')?.checked),letterCount:Number(mount.querySelector('#config-dunning-count')?.value)}, dunning.getContext());
          dunningDirty = false;
          const toast = document.getElementById("adminToast");
          toast.textContent = "Dunning Letters configuration saved. Other configuration changes remain a preview.";
          toast.classList.add("is-visible");
          setTimeout(() => toast.classList.remove("is-visible"), 3500);
        } catch (error) {
          const toast = document.getElementById("adminToast");
          toast.textContent = error.message; toast.classList.add("is-visible");
        }
      } else window.IneburaAdminPreviewNotice();
    }
    const option = event.target.closest("[data-config-option]");
    if (option) chooseReference(Number(option.dataset.configOption));
  });
  modal.addEventListener("click", event => {
    const action = event.target.closest("[data-config-action]")?.dataset.configAction;
    if (action === "cancel") closeModal();
    if (action !== "apply") return;
    editable = new Set([...modal.querySelectorAll("[data-config-choice]:checked")].map(input => input.value));
    mount.querySelectorAll("[data-config-editable]").forEach(control => {
      control.disabled = !editable.has(control.dataset.configEditable);
      if (control.dataset.configEditable === "dunning" && dunning?.getContext().role !== "client-admin") control.disabled = true;
      control.closest(".adminConfigurationToggle")?.classList.toggle("is-disabled", control.disabled);
    });
    closeModal();
  });
  mount.addEventListener("change", event => {
    if (event.target.id === "config-dunning-count" && editable.has("dunning")) dunningDirty = true;
    const key = event.target.dataset.configToggle;
    if (!key || !editable.has(key)) return;
    if (key === "dunning") dunningDirty = true;
    const details = mount.querySelector(`[data-config-details="${key}"]`);
    if (details) details.hidden = !event.target.checked;
    if (key === "grn" && !event.target.checked) setMenu(false);
  });
  document.addEventListener("click", event => {
    if (menuOpen && !event.target.closest(".adminConfigurationSelect")) setMenu(false);
  });
  mount.addEventListener("keydown", event => {
    if (!event.target.closest(".adminConfigurationSelect")) return;
    const index = event.target.dataset.configOption;
    if (event.key === "Escape") {
      setMenu(false);
      document.getElementById("config-grn-reference").focus();
      event.preventDefault();
    } else if (["ArrowDown", "ArrowUp", "Home", "End"].includes(event.key)) {
      event.preventDefault();
      const next = event.key === "Home" ? 0 : event.key === "End" ? 1 : index === undefined ? selectedReference : (Number(index) + 1) % references.length;
      setMenu(true, next);
    } else if (event.key === "Tab") setMenu(false);
  });
  dunning?.subscribe(state => {
    const item = modules.find(row => row.key === "dunning");
    if (item) item.on = state.enabled;
    const control = mount.querySelector('[data-config-toggle="dunning"]');
    if (control && !dunningDirty) control.checked = state.enabled;
    const count = mount.querySelector('#config-dunning-count');
    if (count && !dunningDirty) count.value = state.letterCount || 3;
  });
  window.IneburaAdminConfigurations = Object.freeze({ render });
})();
