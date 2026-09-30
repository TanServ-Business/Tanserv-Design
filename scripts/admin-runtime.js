/* Admin demo runtime: renders module definitions and keeps state isolated from LP roles. */
(() => {
  "use strict";

  const mount = document.getElementById("adminPageContent");
  if (!mount) return;
  if (window.IneburaAdminPage && window.IneburaAdminPage.renderer !== "registry") return;

  const parameters = new URLSearchParams(window.location.search);
  const moduleId = parameters.get("module") || "branch-master";
  const viewId = parameters.get("view") || "";
  const modules = window.IneburaAdminModules || {};
  const definition = modules[moduleId];
  if (!definition) return;
  const configuredTabs = (definition.tabs || []).filter((tab) => tab?.label);
  const splitTarget = (rawTarget = moduleId) => {
    const match = String(rawTarget).match(/^([^:#]+)(?:[:#](.+))?$/);
    return { module: match?.[1] || moduleId, view: match?.[2] || "" };
  };
  const firstTabTarget = splitTarget(configuredTabs[0]?.module || moduleId);
  const currentView = viewId || configuredTabs[0]?.view || (firstTabTarget.module === moduleId ? firstTabTarget.view : "");
  const tabContentMap = definition.customBlocks?.find((block) => block.type === "tabContentMap")?.views || {};
  const currentPresentation = tabContentMap[currentView] || "";

  const STORAGE_KEY = "ineburaAdminDemoState:v1";
  const pageSize = Math.max(1, Number(definition.pageSize) || 8);
  let query = "";
  let page = 1;
  let sortKey = "";
  let sortDirection = 1;
  let activeFilters = {};
  let selectedUploadFiles = [];
  let activeFormFields = [];
  let auditSearchCommitted = false;
  const sourceFilterlessModules = new Set([
    "branch-master", "holiday-master", "bank-master", "internal-contacts",
    "document-setup", "role-display", "template-master", "smtp-setup",
    "sender-account", "portfolio-transfer", "bulk-document-upload",
    "grn-upload", "cn-advance-upload", "payment-receipt-upload", "invoice-upload",
  ]);

  const clone = (value) => JSON.parse(JSON.stringify(value));
  const escapeHtml = (value) => String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

  const readState = () => {
    try {
      const parsed = JSON.parse(window.IneburaAdminPreviewStorage?.getItem(STORAGE_KEY) || "{}");
      return parsed && typeof parsed === "object" ? parsed : {};
    } catch (_) {
      return {};
    }
  };

  const writeState = (state) => window.IneburaAdminPreviewStorage?.setItem(STORAGE_KEY, JSON.stringify(state));
  const state = readState();
  state._dataVersions ||= {};
  const dataVersionChanged = definition.dataVersion != null
    && String(state._dataVersions[moduleId] ?? "") !== String(definition.dataVersion);
  if (!Array.isArray(state[moduleId]) || dataVersionChanged) {
    state[moduleId] = clone(definition.seedRows || []);
    if (definition.dataVersion != null) state._dataVersions[moduleId] = definition.dataVersion;
    writeState(state);
  }

  const rows = () => state[moduleId];
  const persistRows = (nextRows) => {
    state[moduleId] = nextRows;
    writeState(state);
  };

  const notify = (message, variant = "") => {
    const toast = document.getElementById("adminToast");
    if (!toast) return;
    toast.className = `adminToast${variant ? ` is-${variant}` : ""}`;
    toast.innerHTML = ["error", "warning"].includes(variant)
      ? `<button type="button" data-runtime-action="close-toast" aria-label="Close notification">&times;</button><i class="bi ${variant === "warning" ? "bi-exclamation-circle-fill" : "bi-exclamation-triangle-fill"}" aria-hidden="true"></i><strong>${escapeHtml(variant === "warning" ? (definition.create?.validationToastTitle || "Warning") : "Error")}</strong><span>${escapeHtml(message)}</span>`
      : escapeHtml(message);
    toast.classList.add("is-visible");
    window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
  };

  const routeFor = (target, view = "") => `admin.html?module=${encodeURIComponent(target)}${view ? `&view=${encodeURIComponent(view)}` : ""}`;
  const tableColumns = () => (definition.columns || []).filter((column) => column.type !== "actions"
    && !(moduleId === "branch-master" && column.key === "status")
    && !(moduleId === "audit-trail" && column.key === "entityType"));
  const tableActions = () => (definition.rowActions || []).filter((action) => moduleId !== "branch-master" || action.id === "edit");
  const rowActionVisible = (action, row) => {
    if (!action.showWhen) return true;
    const value = row[action.showWhen.key];
    if (action.showWhen.greaterThan != null) return Number(value) > Number(action.showWhen.greaterThan);
    if (action.showWhen.equals != null) return String(value) === String(action.showWhen.equals);
    return true;
  };

  const renderTabs = () => {
    const tabs = configuredTabs;
    if (tabs.length < 2) return "";
    return `<nav class="adminRuntimeTabs" aria-label="${escapeHtml(definition.title)} sections">${tabs.map((tab) => {
      const rawTarget = tab.module || moduleId;
      const parsedTarget = splitTarget(rawTarget);
      const target = modules[rawTarget] ? rawTarget : parsedTarget.module;
      const targetView = tab.view || parsedTarget.view || "";
      const active = target === moduleId && targetView === currentView;
      return `<a class="${active ? "is-active" : ""}" href="${routeFor(target, targetView)}">${escapeHtml(tab.label)}</a>`;
    }).join("")}</nav>`;
  };

  const renderField = (field, value = "") => {
    const id = `admin-field-${field.key}`;
    const required = field.required ? "required" : "";
    const span = field.span === 2 ? " adminFieldWide" : "";
    const dependency = field.dependsOn;
    const dependencyKey = dependency?.key || dependency?.field || "";
    const dependencyValues = dependency ? (dependency.values || [dependency.value ?? dependency.equals]) : [];
    const depends = dependency ? ` data-depends-on="${escapeHtml(dependencyKey)}" data-depends-values="${escapeHtml(JSON.stringify(dependencyValues))}"${dependency.and ? ` data-depends-and="${escapeHtml(JSON.stringify(dependency.and))}"` : ""}` : "";
    const label = `${escapeHtml(field.label)}${field.required ? " *" : ""}`;
    const options = field.options || [];
    if (field.type === "checkbox" && field.checkboxLabel) {
      return `<div class="adminCheckSection${span}" data-field-key="${escapeHtml(field.key)}"${depends}><span class="adminFieldLabel">${label}</span><label class="adminCheckLine"><input id="${id}" name="${escapeHtml(field.key)}" type="checkbox" ${value ? "checked" : ""} /><span>${escapeHtml(field.checkboxLabel)}</span></label></div>`;
    }
    if (field.type === "checkbox" || field.type === "switch" || field.type === "toggle") {
      return `<label class="adminCheckField${span}"${depends}><input id="${id}" name="${escapeHtml(field.key)}" type="checkbox" ${value ? "checked" : ""} /><span><strong>${label}</strong>${field.help ? `<small>${escapeHtml(field.help)}</small>` : ""}</span></label>`;
    }
    if (field.type === "checkbox-group" || field.type === "radio") {
      const inputType = field.type === "radio" ? "radio" : "checkbox";
      const selectedValues = Array.isArray(value) ? value : [value];
      return `<fieldset class="adminRuntimeChoiceGroup${span}"${depends}><legend>${label}</legend>${options.map((option) => {
        const optionValue = typeof option === "object" ? option.value : option;
        const optionLabel = typeof option === "object" ? option.label : option;
        return `<label><input type="${inputType}" name="${escapeHtml(field.key)}" value="${escapeHtml(optionValue)}" ${selectedValues.map(String).includes(String(optionValue)) ? "checked" : ""} /><span>${escapeHtml(optionLabel)}</span></label>`;
      }).join("")}</fieldset>`;
    }
    if (field.type === "rating") {
      return `<fieldset class="adminRuntimeChoiceGroup adminRuntimeRating${span}"${depends}><legend>${label}</legend>${[1, 2, 3, 4, 5].map((rating) => `<label><input type="radio" name="${escapeHtml(field.key)}" value="${rating}" ${String(value) === String(rating) ? "checked" : ""} /><span>${rating} <i class="bi bi-star-fill"></i></span></label>`).join("")}</fieldset>`;
    }
    if (field.type === "reorder-list") {
      return `<div class="adminRuntimeReorder${span}"${depends}><strong>${label}</strong>${options.map((option, index) => `<div><span>${index + 1}</span>${escapeHtml(option)}<i class="bi bi-grip-vertical"></i></div>`).join("")}</div>`;
    }
    if (field.type === "checklist") {
      return `<div class="adminRuntimeChecklist${span}"${depends}><strong>${label}</strong>${(field.items || options).map((item) => `<label><input type="checkbox" checked /><span>${escapeHtml(typeof item === "object" ? item.label : item)}</span></label>`).join("")}</div>`;
    }
    if (field.type === "button") {
      return `<div class="adminRuntimeField${span}"${depends}><span>${label}</span><button type="button" class="adminSecondary" data-runtime-action="custom" data-message="${escapeHtml(field.message || field.label)}">${escapeHtml(field.buttonLabel || field.label)}</button></div>`;
    }
    if (field.type === "tag-multiselect") {
      const selectedValues = (Array.isArray(value) ? value : [value]).filter(Boolean).map(String);
      const selectedJson = escapeHtml(JSON.stringify(selectedValues));
      return `<div class="adminRuntimeField adminTagSelectField${span}" data-field-key="${escapeHtml(field.key)}" data-tag-select${depends}><span>${label}</span><div class="adminTagSelectControl"><i class="bi bi-search adminTagSearchIcon" aria-hidden="true"></i><input class="adminTagSearch" type="text" autocomplete="off" placeholder="${escapeHtml(field.placeholder || "Type to add...")}" aria-label="${escapeHtml(field.label)}" /><input type="hidden" name="${escapeHtml(field.key)}" value="${selectedJson}" data-tag-values /></div><div class="adminTagChips" data-tag-chips>${selectedValues.map((item) => `<button type="button" data-runtime-action="remove-tag" data-value="${escapeHtml(item)}"><span>${escapeHtml(item)}</span><i class="bi bi-x"></i></button>`).join("")}</div><div class="adminTagMenu" hidden>${options.map((option) => {
        const optionValue = typeof option === "object" ? option.value : option;
        const optionLabel = typeof option === "object" ? option.label : option;
        const optionCode = typeof option === "object" ? option.code : "";
        return `<button type="button" data-runtime-action="select-tag" data-value="${escapeHtml(optionValue)}" data-label="${escapeHtml(optionLabel)}" ${selectedValues.includes(String(optionValue)) ? "hidden" : ""}><span>${escapeHtml(optionLabel)}</span>${optionCode ? `<small>${escapeHtml(optionCode)}</small>` : ""}</button>`;
      }).join("")}</div><small class="adminFieldError" data-field-error hidden>${escapeHtml(field.validationMessage || `${field.label} is required`)}</small></div>`;
    }
    if (field.type === "search-select") {
      const selectedValue = String(value || "");
      return `<div class="adminRuntimeField adminSearchSelectField${span}" data-field-key="${escapeHtml(field.key)}" data-search-select${depends}><span>${label}</span><div class="adminSearchSelectControl"><input type="text" value="${escapeHtml(selectedValue)}" placeholder="${escapeHtml(field.placeholder || "Select")}" aria-label="${escapeHtml(field.placeholder || field.label)}" autocomplete="off" role="combobox" aria-expanded="false" ${field.disabled ? "disabled" : ""} data-runtime-action="toggle-search-select" /><input type="hidden" id="${id}" name="${escapeHtml(field.key)}" value="${escapeHtml(selectedValue)}" ${required} /><button type="button" data-runtime-action="toggle-search-select" aria-label="Open ${escapeHtml(field.label)} options"><i class="bi bi-search"></i></button></div><div class="adminSearchSelectMenu" role="listbox" hidden>${options.map((option) => {
        const optionValue = typeof option === "object" ? option.value : option;
        const optionLabel = typeof option === "object" ? option.label : option;
        return `<button type="button" data-runtime-action="choose-search-select" data-value="${escapeHtml(optionValue)}">${escapeHtml(optionLabel)}</button>`;
      }).join("")}</div><small class="adminFieldError" data-field-error hidden>${escapeHtml(field.validationMessage || `${field.label} is required`)}</small></div>`;
    }
    if (field.type === "select" || field.type === "multiselect") {
      return `<label class="adminRuntimeField${span}"${depends}><span>${label}</span><select id="${id}" name="${escapeHtml(field.key)}" ${field.type === "multiselect" ? "multiple" : ""} ${required}><option value="">${escapeHtml(field.placeholder || "Select")}</option>${options.map((option) => {
        const optionValue = typeof option === "object" ? option.value : option;
        const optionLabel = typeof option === "object" ? option.label : option;
        const selected = Array.isArray(value) ? value.includes(optionValue) : String(value) === String(optionValue);
        return `<option value="${escapeHtml(optionValue)}" ${selected ? "selected" : ""}>${escapeHtml(optionLabel)}</option>`;
      }).join("")}</select>${field.help ? `<small>${escapeHtml(field.help)}</small>` : ""}</label>`;
    }
    if (field.type === "textarea" || field.type === "richtext") {
      return `<label class="adminRuntimeField${span}"${depends}><span>${label}</span><textarea id="${id}" name="${escapeHtml(field.key)}" placeholder="${escapeHtml(field.placeholder || "")}" ${field.maxLength?`maxlength="${field.maxLength}"`:""} ${required}>${escapeHtml(value)}</textarea>${field.maxLength?`<small class="adminCharacterCount">${String(value||"").length} / ${field.maxLength}</small>`:""}${field.help ? `<small>${escapeHtml(field.help)}</small>` : ""}</label>`;
    }
    const inputType = field.type === "phone" ? "tel" : (["text", "email", "tel", "password", "number", "date", "datetime-local", "url", "file"].includes(field.type) ? field.type : "text");
    const todayMinimum = field.minToday && !value ? new Date().toISOString().slice(0, 10) : field.min;
    return `<label class="adminRuntimeField${span}" data-field-key="${escapeHtml(field.key)}"${depends}><span>${label}</span><input id="${id}" name="${escapeHtml(field.key)}" type="${escapeHtml(inputType || "text")}" value="${escapeHtml(value)}" placeholder="${escapeHtml(field.placeholder || "")}" ${todayMinimum != null ? `min="${escapeHtml(todayMinimum)}"` : ""} ${field.max != null ? `max="${escapeHtml(field.max)}"` : ""} ${field.maxLength != null ? `maxlength="${escapeHtml(field.maxLength)}"` : ""} ${field.disabled ? "disabled" : ""} ${required} /><small class="adminFieldError" data-field-error hidden>${escapeHtml(field.validationMessage || `${field.label} is required`)}</small>${field.help ? `<small>${escapeHtml(field.help)}</small>` : ""}</label>`;
  };

  const renderFilters = () => {
    if (!definition.filters?.length) return "";
    return definition.filters.map((filter) => {
      if (filter.type !== "select") {
        return `<label class="adminSourceFilterField"><span>${escapeHtml(filter.label)}</span><input class="adminRuntimeFilter" data-filter-key="${escapeHtml(filter.key)}" type="${escapeHtml(filter.type || "text")}" placeholder="${escapeHtml(filter.placeholder || filter.label)}" /></label>`;
      }
      const selected = activeFilters[filter.key] || "All";
      return `<details class="adminFilterDropdown"><summary>${escapeHtml(filter.label)}<span>${escapeHtml(selected)}</span><i class="bi bi-chevron-down"></i></summary><div class="adminFilterMenu"><button type="button" data-runtime-action="filter-option" data-filter-key="${escapeHtml(filter.key)}" data-filter-value="">All</button>${(filter.options || []).filter((option) => option !== "All").map((option) => `<button type="button" data-runtime-action="filter-option" data-filter-key="${escapeHtml(filter.key)}" data-filter-value="${escapeHtml(option)}">${escapeHtml(option)}</button>`).join("")}</div></details>`;
    }).join("");
  };

  const renderAuditFilters = () => {
    if (moduleId !== "audit-trail") return "";
    const order = ["entityType", "recordId", "action", "changedBy", "dateFrom", "dateTo"];
    const filters = [...(definition.filters || [])].sort((a, b) => order.indexOf(a.key) - order.indexOf(b.key));
    return `<section class="adminAuditFilterArea"><div class="adminAuditFilterGrid">${filters.map((filter) => {
      if (filter.type === "select") return `<label class="adminSourceFilterField"><span>${escapeHtml(filter.label)}${filter.key === "entityType" ? " *" : ""}</span><select class="adminRuntimeFilter" data-filter-key="${escapeHtml(filter.key)}"><option value="">${filter.key === "entityType" ? "Select entity…" : "All"}</option>${(filter.options || []).filter((option) => option !== "All").map((option) => `<option value="${escapeHtml(option)}">${escapeHtml(option)}</option>`).join("")}</select></label>`;
      return `<label class="adminSourceFilterField"><span>${escapeHtml(filter.label.replace(" Date", ""))}</span><input class="adminRuntimeFilter" data-filter-key="${escapeHtml(filter.key)}" type="${escapeHtml(filter.type || "text")}" placeholder="${escapeHtml(filter.placeholder || (filter.key === "recordId" ? "e.g. 4521" : filter.key === "changedBy" ? "username" : ""))}" /></label>`;
    }).join("")}</div><div class="adminAuditFilterActions"><button class="adminPrimary" data-runtime-action="apply-filters"><i class="bi bi-search"></i>Search</button><button class="adminSecondary" data-runtime-action="export"><i class="bi bi-download"></i>Export CSV</button></div></section>`;
  };

  const renderSettings = () => {
    if (!definition.settingsSections?.length) return "";
    const savedSettings = state._settings?.[moduleId] || {};
    const requestedSection = currentPresentation.startsWith("settings:") ? currentPresentation.split(":")[1] : "";
    const sections = definition.settingsSections.map((section, sectionIndex) => ({ section, sectionIndex }))
      .filter(({ section }) => !requestedSection || section.id === requestedSection)
      .filter(() => !currentPresentation || currentPresentation.startsWith("settings") || !tabContentMap[currentView]);
    if (!sections.length) return "";
    return `<div class="adminRuntimeSettings">${sections.map(({ section, sectionIndex }) => `<section class="adminRuntimeSettingCard" data-settings-section="${sectionIndex}"><header><div><h2>${escapeHtml(section.title)}</h2>${section.description ? `<p>${escapeHtml(section.description)}</p>` : ""}</div></header><div class="adminRuntimeFormGrid">${(section.fields || []).map((field) => renderField(field, savedSettings[field.key] ?? field.value ?? field.default ?? "")).join("")}</div><footer><button class="adminPrimary" type="button" data-runtime-action="save-settings" data-section="${sectionIndex}">Save Changes</button></footer></section>`).join("")}</div>`;
  };

  const renderCustomBlocks = () => {
    if (!definition.customBlocks?.length) return "";
    const visibleBlocks = definition.customBlocks.filter((block) => {
      if (block.type === "tabContentMap") return false;
      if (moduleId === "audit-trail" && block.type === "toolbar") return false;
      if (block.type === "upload-status") return false;
      if (["customer-detail", "uploadResult", "settings-savebar"].includes(block.type)) return false;
      if (block.view && block.view !== currentView) return false;
      if (["dialog", "drawer", "confirm"].includes(block.type)) return false;
      if (moduleId === "help-support" && ["hero-search", "cards"].includes(block.type)) return !currentView;
      if (moduleId === "help-support" && block.type === "form") return currentView === "feedback";
      return true;
    });
    return `<div class="adminCustomBlocks">${visibleBlocks.map((block) => {
      if (["notice", "infoBanner", "warningBanner", "upload-help"].includes(block.type)) return `<article class="adminCustomNotice ${block.type === "warningBanner" ? "is-warning" : ""}"><i class="bi bi-${escapeHtml(block.icon || (block.type === "warningBanner" ? "exclamation-triangle" : "info-circle"))}"></i><div><h3>${escapeHtml(block.title)}</h3><p>${escapeHtml(block.text || block.body || block.description || "")}</p>${block.items?.length ? `<ul>${block.items.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>` : ""}</div>${block.actions?.length ? `<div class="adminCustomActions">${block.actions.map((action) => `<button class="adminSecondary" data-runtime-action="${action.kind === "download" ? "download-template" : "custom"}" data-message="${escapeHtml(action.label)}">${escapeHtml(action.label)}</button>`).join("")}</div>` : ""}</article>`;
      if (block.type === "stats") return `<section class="adminCustomStats">${(block.items || []).map((item) => `<article><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong><small>${escapeHtml(item.help || "")}</small></article>`).join("")}</section>`;
      if (block.type === "limbo-summary") return `<section class="adminCustomStats">${(block.metrics || []).map((item) => `<article><span>${escapeHtml(item.label)}</span><strong>${escapeHtml(item.value)}</strong></article>`).join("")}</section>`;
      if (block.type === "info") return `<article class="adminCustomNotice"><i class="bi bi-info-circle"></i><div><h3>${escapeHtml(block.title || "Details")}</h3><p>${escapeHtml(block.description || block.text || "")}</p>${block.items?.length ? `<div class="adminRuntimeChips">${block.items.map((item) => `<span>${escapeHtml(typeof item === "object" ? `${item.label}: ${item.value}` : item)}</span>`).join("")}</div>` : ""}</div></article>`;
      if (block.type === "hero-search") return `<section class="adminRuntimeHeroSearch"><i class="bi bi-search"></i><div><h2>${escapeHtml(block.title || "How can we help?")}</h2><p>${escapeHtml(block.description || "")}</p><input type="search" placeholder="${escapeHtml(block.placeholder || "Search help articles")}" /></div></section>`;
      if (block.type === "toolbar") return `<section class="adminRuntimeBlockToolbar"><div><h3>${escapeHtml(block.title || "")}</h3><p>${escapeHtml(block.description || "")}</p></div><div>${(block.actions || []).map((action) => {
        const label = typeof action === "string" ? action : action.label;
        const id = typeof action === "string" ? "" : action.id;
        const runtimeAction = id?.includes("export") || id?.includes("download") ? "export" : "custom";
        return `<button class="${action.kind === "primary" ? "adminPrimary" : "adminSecondary"}" data-runtime-action="${runtimeAction}" data-message="${escapeHtml(label)}">${escapeHtml(label)}</button>`;
      }).join("")}</div></section>`;
      if (block.type === "wizard") return `<section class="adminRuntimeWizard"><div class="adminRuntimeWizardSteps">${(block.steps || []).map((step, index) => `<span class="${index === 0 ? "is-active" : ""}"><i>${index + 1}</i>${escapeHtml(typeof step === "object" ? step.label || step.title : step)}</span>`).join("")}</div><article><h3>${escapeHtml(block.title || "Guided setup")}</h3><p>${escapeHtml(block.description || "Complete each step using dummy data.")}</p><button class="adminPrimary" data-runtime-action="custom" data-message="Advanced to the next dummy step">Continue</button></article></section>`;
      if (block.type === "activity") return `<section class="adminRuntimeActivity"><h3>${escapeHtml(block.title || "Recent activity")}</h3>${(block.items || []).map((item) => `<article><i class="bi bi-check-circle"></i><div><strong>${escapeHtml(item.title || item.label)}</strong><p>${escapeHtml(item.text || item.description || "")}</p></div><time>${escapeHtml(item.time || item.date || "")}</time></article>`).join("")}</section>`;
      if (block.type === "form") return `<section class="adminRuntimeSettingCard"><header><div><h2>${escapeHtml(block.title || "Submit details")}</h2><p>${escapeHtml(block.description || "")}</p></div></header><form id="adminRuntimeInlineForm" class="adminRuntimeFormGrid" data-runtime-inline-form>${(block.fields || []).map((field) => renderField(field, field.default || "")).join("")}</form><footer>${(block.actions || [{ label: "Submit", kind: "primary" }]).map((action) => `<button type="${action.kind === "primary" ? "submit" : "button"}" ${action.kind === "primary" ? 'form="adminRuntimeInlineForm"' : ""} class="${action.kind === "primary" ? "adminPrimary" : "adminSecondary"}" data-runtime-action="${action.kind === "primary" ? "submit-inline-form" : "custom"}" data-message="${escapeHtml(action.label)}">${escapeHtml(action.label)}</button>`).join("")}</footer></section>`;
      if (block.type === "bulk-action") return `<section class="adminRuntimeSettingCard"><header><div><h2>${escapeHtml(block.title)}</h2><p>${escapeHtml(block.description || "Select rows and apply this dummy bulk action.")}</p></div></header><div class="adminRuntimeFormGrid">${(block.fields || []).map((field) => renderField(field, "")).join("")}</div><footer>${(block.actions || []).map((action) => `<button class="${action.kind === "danger" ? "adminPrimary adminDangerButton" : action.kind === "primary" ? "adminPrimary" : "adminSecondary"}" data-runtime-action="custom" data-message="${escapeHtml(action.label)}">${escapeHtml(action.label)}</button>`).join("")}</footer></section>`;
      if (block.type === "upload-status") return `<article class="adminCustomNotice"><i class="bi bi-cloud-check"></i><div><h3>${escapeHtml(block.title || "Upload status")}</h3><p>${escapeHtml((block.states || []).join(" · "))}</p></div></article>`;
      if (["cards", "faq", "presetCards"].includes(block.type)) return `<section class="adminCustomCards">${(block.items || []).map((item, index) => `<article><i class="bi ${escapeHtml(item.icon || "bi-file-earmark-text")}"></i><div><h3>${escapeHtml(item.title)}</h3><p>${escapeHtml(item.text || item.description || "")}</p></div>${item.action ? `<button class="adminSecondary" data-runtime-action="custom" data-custom-index="${index}" data-message="${escapeHtml(item.action)}">${escapeHtml(item.actionLabel || item.action)}</button>` : ""}</article>`).join("")}</section>`;
      if (["process-preview", "customer-detail", "uploadResult", "settings-savebar"].includes(block.type)) return `<article class="adminCustomNotice"><i class="bi bi-layout-text-window-reverse"></i><div><h3>${escapeHtml(block.title || definition.title)}</h3><p>${escapeHtml(block.description || "Interactive dummy state is available in this section.")}</p></div>${block.actions?.length ? `<div class="adminCustomActions">${block.actions.map((action) => {
        const label = typeof action === "string" ? action : action.label;
        return `<button class="adminSecondary" data-runtime-action="custom" data-message="${escapeHtml(label)}">${escapeHtml(label)}</button>`;
      }).join("")}</div>` : ""}</article>`;
      return "";
    }).join("")}</div>`;
  };

  const renderUpload = () => {
    if (!definition.upload) return "";
    const upload = definition.upload;
    const configuredButtons = upload.buttons?.length ? upload.buttons : ["Clear", "Upload"];
    const normalizedButtons = configuredButtons.map((button) => {
      const label = typeof button === "string" ? button : button.label;
      const providedAction = typeof button === "object" ? (button.action || button.id) : "";
      const lowered = String(label).toLowerCase();
      const action = providedAction || (lowered === "cancel" ? "close-modal" : lowered.includes("download") ? "download-template" : lowered.includes("browse") ? "choose-files" : lowered === "clear" ? "clear-files" : lowered.includes("upload") || lowered.includes("create users") ? "run-upload" : "custom");
      return { label, action };
    });
    const downloadButtons = normalizedButtons.filter((button) => button.action.includes("download"));
    const footerButtons = normalizedButtons.filter((button) => !button.action.includes("download")).map((button) => button.action === "clear-files" || button.action === "clear-upload" ? { label: "Cancel", action: "close-modal" } : button);
    const fields = moduleId === "invoice-upload" ? [] : (upload.fields || []);
    const buttonMarkup = footerButtons.map((button) => {
      const isUploadAction = button.action === "run-upload" || button.action === "upload";
      return `<button type="button" class="${isUploadAction ? "adminPrimary" : "adminSecondary"}" data-runtime-action="${escapeHtml(button.action)}" data-message="${escapeHtml(button.label)}" ${isUploadAction ? "disabled" : ""}>${escapeHtml(button.label)}</button>`;
    }).join("");
    return `<section class="adminRuntimeUpload">${upload.instructions ? `<p class="adminPlatformNote">${escapeHtml(upload.instructions)}</p>` : ""}<div class="adminRuntimeUploadFields">${fields.map((field) => renderField(field, "")).join("")}</div><span class="adminUploadFieldLabel">${escapeHtml(upload.fieldLabel || (upload.accept?.includes("xls") ? "Excel File" : "Data File"))}</span><button type="button" class="adminRuntimeDropzone" data-runtime-action="choose-files"><i class="bi bi-cloud-arrow-up"></i><strong>Drag &amp; Drop Data File</strong><span>${escapeHtml(upload.help || `Select ${upload.accept || "a supported file"}`)}</span><em>Click to browse files</em></button><input id="adminRuntimeFile" type="file" accept="${escapeHtml(upload.accept || "")}" ${upload.multiple ? "multiple" : ""} hidden /><div id="adminRuntimeFileList" class="adminRuntimeFileList" hidden></div>${downloadButtons.length ? `<div class="adminUploadTemplateActions">${downloadButtons.map((button) => `<button type="button" class="adminSecondary" data-runtime-action="${escapeHtml(button.action)}"><i class="bi bi-download"></i>${escapeHtml(button.label)}</button>`).join("")}</div>` : ""}<div class="adminRuntimeUploadButtons">${buttonMarkup}</div><div id="adminRuntimeUploadProgress" class="adminRuntimeUploadProgress" hidden><i></i><span>Preparing dummy upload…</span></div></section>`;
  };

  const filteredRows = () => {
    if (moduleId === "audit-trail" && !auditSearchCommitted) return [];
    let list = [...rows()];
    if (query) {
      const needle = query.toLowerCase();
      list = list.filter((row) => Object.values(row).some((value) => String(value ?? "").toLowerCase().includes(needle)));
    }
    Object.entries(activeFilters).forEach(([key, value]) => {
      if (value) list = list.filter((row) => String(row[key] ?? "").toLowerCase().includes(String(value).toLowerCase()));
    });
    if (sortKey) list.sort((a, b) => String(a[sortKey] ?? "").localeCompare(String(b[sortKey] ?? ""), undefined, { numeric: true }) * sortDirection);
    return list;
  };

  const cellValue = (row, column) => {
    const value = row[column.key];
    if (column.type === "stateBadge") return `<span class="adminStateBadge">${escapeHtml(Array.isArray(value) ? value.join(", ") : value)}</span>`;
    if (column.type === "date" && /^\d{4}-\d{2}-\d{2}$/.test(String(value || ""))) {
      const [yearText, monthText, dayText] = String(value).split("-");
      if (column.format === "dd-mm-yyyy") return `${dayText}-${monthText}-${yearText}`;
      const [year, month, day] = [yearText, monthText, dayText].map(Number);
      return `${month}/${day}/${year}`;
    }
    if (column.type === "tags" || column.type === "chips") return `<span class="adminRuntimeTags">${(Array.isArray(value) ? value : [value]).filter(Boolean).map((tag) => `<i>${escapeHtml(tag)}</i>`).join("")}</span>`;
    if (column.type === "boolean" || column.type === "checkbox") return `<span class="adminStatus ${String(value).toLowerCase() === "no" || value === false ? "muted" : ""}">${escapeHtml(value === true ? "Yes" : value === false ? "No" : value)}</span>`;
    if (column.type === "status") return `<span class="adminStatus ${String(value).toLowerCase().includes("inactive") || String(value).toLowerCase().includes("paused") ? "muted" : ""}">${escapeHtml(value)}</span>`;
    if (column.type === "row-checkbox") return `<input type="checkbox" class="adminRowCheckbox" data-runtime-action="toggle-row" data-row-id="${escapeHtml(row.id)}" aria-label="Select ${escapeHtml(row.invoiceNo || row.id)}" ${value ? "checked" : ""} />`;
    if (column.type === "progress") { const amount=Math.max(0,Math.min(100,Number(value)||0)); return `<span class="adminProgressWithText"><span class="adminProgress"><i style="width:${amount}%"></i></span><small>${amount}%${amount===100?' — Complete':''}</small></span>`; }
    if (column.type === "secret") return "••••••••";
    if (column.type === "currency") return `₹${Number(value || 0).toLocaleString("en-IN")}`;
    return escapeHtml(Array.isArray(value) ? value.join(", ") : value);
  };

  const renderTable = () => {
    const table = document.getElementById("adminRuntimeTable");
    if (!table) return;
    const list = filteredRows();
    const sourcePagination = definition.sourcePagination;
    const usingSourcePagination = Boolean(sourcePagination && !query && !sortKey && !Object.values(activeFilters).some(Boolean));
    const maxPage = Math.max(1, usingSourcePagination ? Number(sourcePagination.pageCount) || 1 : Math.ceil(list.length / pageSize));
    page = Math.min(page, maxPage);
    const sourcePageRows = usingSourcePagination
      ? list.filter((row) => Number(row.sourcePage || 1) === page).slice(0, pageSize)
      : [];
    const sourceFallbackPool = usingSourcePagination
      ? list.filter((row) => Number(row.sourcePage || 1) !== Number(sourcePagination.pageCount))
      : [];
    const sourceFallbackOffset = sourceFallbackPool.length
      ? ((page - 1) * pageSize) % sourceFallbackPool.length
      : 0;
    const visible = usingSourcePagination
      ? (sourcePageRows.length
        ? sourcePageRows
        : Array.from({ length: pageSize }, (_, index) => sourceFallbackPool[(sourceFallbackOffset + index) % sourceFallbackPool.length]).filter(Boolean))
      : list.slice((page - 1) * pageSize, page * pageSize);
    const actions = tableActions();
    const columns = tableColumns();
    const actionIcon = (action) => action.id.includes("edit") ? "bi-pencil" : action.id.includes("delete") || action.id === "remove" ? "bi-trash3" : action.id.includes("download") ? "bi-cloud-arrow-down" : action.id.startsWith("view") || action.id === "preview" ? "bi-eye" : "bi-arrow-right-circle";
    const emptyMessage = moduleId === "audit-trail" && !auditSearchCommitted ? "Select an entity type and search." : (definition.emptyMessage || "No records found");
    const actionHeading = actions.length ? "<th>Actions</th>" : "";
    const columnHeadings = columns.map((column) => {
      if (column.type === "row-checkbox") {
        const selectedRows = visible.filter((row) => row[column.key]);
        return `<th><input type="checkbox" class="adminRowCheckbox" data-runtime-action="toggle-visible-rows" aria-label="Select all invoices" ${visible.length && selectedRows.length === visible.length ? "checked" : ""} /></th>`;
      }
      return `<th>${column.sortable === false ? escapeHtml(column.label) : `<button data-runtime-action="sort" data-sort-key="${escapeHtml(column.key)}">${escapeHtml(column.label)}<i class="bi bi-arrow-down-up"></i></button>`}</th>`;
    }).join("");
    table.innerHTML = `<thead><tr>${definition.actionsFirst ? actionHeading : ""}${columnHeadings}${definition.actionsFirst ? "" : actionHeading}</tr></thead><tbody>${visible.length ? visible.map((row) => { const visibleActions=actions.filter(action=>rowActionVisible(action,row)); const actionCell=actions.length?`<td><div class="adminRuntimeRowActions">${visibleActions.map((action) => `<button data-runtime-action="row-action" data-action-id="${escapeHtml(action.id)}" data-row-id="${escapeHtml(row.id)}" class="${action.kind === "danger" ? "is-danger" : ""}" aria-label="${escapeHtml(action.label)}"><i class="bi ${actionIcon(action)}"></i>${action.iconOnly ? "" : escapeHtml(action.label)}</button>`).join("")}</div></td>`:""; return `<tr data-row-id="${escapeHtml(row.id)}">${definition.actionsFirst?actionCell:""}${columns.map((column) => `<td>${cellValue(row, column)}</td>`).join("")}${definition.actionsFirst?"":actionCell}</tr>`; }).join("") : `<tr><td colspan="${columns.length + (actions.length ? 1 : 0)}"><div class="adminRuntimeEmpty">${moduleId === "audit-trail" ? "" : '<i class="bi bi-inbox"></i>'}<strong>${escapeHtml(emptyMessage)}</strong></div></td></tr>`}</tbody>`;
    const summary = document.getElementById("adminRuntimeSummary");
    const displayedTotal = usingSourcePagination ? Number(sourcePagination.total) || list.length : list.length;
    const displayedStart = displayedTotal && visible.length ? (page - 1) * pageSize + 1 : 0;
    const displayedEnd = visible.length ? Math.min(displayedStart + visible.length - 1, displayedTotal) : 0;
    if (summary) summary.textContent = `Showing ${displayedStart}–${displayedEnd} of ${displayedTotal}`;
    const selectionBar = document.getElementById("adminRuntimeSelectionBar");
    if (selectionBar) {
      const selectedCount = list.filter((row) => row.selected).length;
      selectionBar.hidden = !selectedCount;
      selectionBar.innerHTML = selectedCount ? `<button class="adminPrimary adminDangerButton" data-runtime-action="bulk-delete-selected"><i class="bi bi-trash3"></i>Delete Selected (${selectedCount})</button>` : "";
    }
    const pager = document.getElementById("adminRuntimePager");
    const pageItems = usingSourcePagination && Array.isArray(sourcePagination.pages)
      ? sourcePagination.pages
      : Array.from({ length: maxPage }, (_, index) => index + 1).slice(0, 7);
    if (pager) pager.innerHTML = `<button data-runtime-action="page" data-page="${page - 1}" aria-label="Previous page" ${page === 1 ? "disabled" : ""}><i class="bi bi-chevron-left"></i></button>${pageItems.map((number) => number === "…" ? '<button type="button" disabled aria-label="More pages">…</button>' : `<button data-runtime-action="page" data-page="${number}" class="${number === page ? "is-current" : ""}">${number}</button>`).join("")}<button data-runtime-action="page" data-page="${page + 1}" aria-label="Next page" ${page === maxPage ? "disabled" : ""}><i class="bi bi-chevron-right"></i></button>`;
    if (pager?.closest(".adminPager")) pager.closest(".adminPager").hidden = moduleId === "audit-trail" && !auditSearchCommitted;
  };

  const render = () => {
    const showTable = definition.columns?.length && (moduleId === "help-support" ? currentView === "tickets" : (!currentPresentation || currentPresentation === "table" || ["history", "limbo", "team-members", "display-names", "aging", "preferences"].some((name) => currentView.includes(name))));
    const showUpload = definition.upload && (!currentPresentation || currentPresentation === "upload" || ["bulk", "upload"].some((name) => currentView.includes(name)));
    const showCreate = !definition.hideCreate && definition.create && currentPresentation !== "upload" && !["history", "limbo", "team-members", "bulk-user"].some((name) => currentView.includes(name));
    const showCompactFilters = showTable && moduleId !== "audit-trail" && !definition.headerSearch && !sourceFilterlessModules.has(moduleId) && (definition.filters?.length || definition.searchPlaceholder);
    const headerSearch = definition.headerSearch ? `<label class="adminHeaderSearch"><i class="bi bi-search" aria-hidden="true"></i><input id="adminRuntimeSearch" type="search" placeholder="${escapeHtml(definition.searchPlaceholder || "Search records…")}" aria-label="${escapeHtml(definition.searchPlaceholder || "Search records")}" /></label>` : "";
    const workspaceActions = `${headerSearch}${showCreate ? `<button class="adminPrimary" data-runtime-action="create"><i class="bi bi-plus-circle"></i>${escapeHtml(definition.create.label || "Create New")}</button>` : ""}${showUpload ? `<button class="adminPrimary adminUploadAction" data-runtime-action="open-upload"><i class="bi bi-cloud-arrow-up-fill"></i>${escapeHtml(definition.upload.label || "Bulk Upload")}</button>` : ""}`;
    const compactFilters = showCompactFilters ? `<div class="adminTableFilters"><label class="adminTableSearch"><i class="bi bi-search"></i><input id="adminRuntimeSearch" value="${escapeHtml(query)}" placeholder="${escapeHtml(definition.searchPlaceholder || "Search records…")}" /></label>${renderFilters()}${definition.searchFirst && !definition.liveSearchFirst?'<button class="adminPrimary" data-runtime-action="apply-search"><i class="bi bi-search"></i>Search</button>':''}${definition.liveSearchFirst ? '' : '<button class="adminSecondary adminFilterReset" data-runtime-action="reset-filters"><i class="bi bi-arrow-counterclockwise"></i>Reset</button>'}</div>` : "";
    const tableMarkup = showTable ? `<section class="adminPanel adminSourceTablePanel">${moduleId === "audit-trail" ? renderAuditFilters() : compactFilters}<div id="adminRuntimeSelectionBar" class="adminRuntimeSelectionBar" hidden></div>${definition.tableIntro ? `<p class="adminTableIntro">${escapeHtml(definition.tableIntro)}</p>` : ""}${definition.searchFirst&&!auditSearchCommitted?'':`<div class="adminTableWrap"><table id="adminRuntimeTable" class="adminTable"></table></div><footer class="adminPager"><span id="adminRuntimeSummary"></span><div id="adminRuntimePager"></div></footer>`}</section>` : "";
    const tabsMarkup = renderTabs();
    const workspaceHeader = tabsMarkup || workspaceActions ? `<header class="adminWorkspaceHeader"><div class="adminWorkspaceTabs">${tabsMarkup}</div><div class="adminWorkspaceActions">${workspaceActions}</div></header>` : "";
    mount.innerHTML = `<main class="adminPage adminRuntimePage" data-admin-module="${escapeHtml(moduleId)}"><section class="adminPageHero"><div><h1>${escapeHtml(definition.title)}</h1><span>${escapeHtml(definition.description || "")}</span></div></section><section class="adminSourceWorkspace">${workspaceHeader}<div class="adminWorkspaceBody">${renderCustomBlocks()}${renderSettings()}${tableMarkup}</div></section>${definition.hideReset ? "" : '<button class="adminResetDemo" data-runtime-action="reset-demo"><i class="bi bi-arrow-repeat"></i>Reset this page’s dummy data</button>'}</main>`;
    renderTable();
    window.requestAnimationFrame(() => {
      const tabScroller = mount.querySelector(".adminWorkspaceTabs");
      const activeTab = tabScroller?.querySelector(".adminRuntimeTabs .is-active");
      if (!tabScroller || !activeTab) return;
      tabScroller.scrollLeft = Math.max(0, activeTab.offsetLeft - (tabScroller.clientWidth - activeTab.offsetWidth) / 2);
    });
  };

  const modal = () => document.getElementById("adminModal");
  const closeModal = () => {
    const element = modal();
    if (!element) return;
    element.classList.remove("is-open", "is-holiday-master", "is-bank-master", "is-bank-delete", "is-internal-contacts");
    element.setAttribute("aria-hidden", "true");
    element.innerHTML = "";
  };

  const tagValues = (field) => {
    try {
      return JSON.parse(field?.querySelector("[data-tag-values]")?.value || "[]");
    } catch (_) {
      return [];
    }
  };

  const syncTagSelect = (field, values = tagValues(field)) => {
    if (!field) return;
    const normalized = values.filter(Boolean).map(String);
    const hidden = field.querySelector("[data-tag-values]");
    const chips = field.querySelector("[data-tag-chips]");
    if (hidden) hidden.value = JSON.stringify(normalized);
    if (chips) chips.innerHTML = normalized.map((item) => `<button type="button" data-runtime-action="remove-tag" data-value="${escapeHtml(item)}"><span>${escapeHtml(item)}</span><i class="bi bi-x"></i></button>`).join("");
    field.querySelectorAll("[data-runtime-action='select-tag']").forEach((option) => {
      option.hidden = normalized.includes(String(option.dataset.value));
    });
    const weeklyOff = field.closest("form")?.elements?.weeklyOff;
    if (weeklyOff) {
      weeklyOff.disabled = normalized.includes("ALL STATE");
      if (weeklyOff.disabled) weeklyOff.checked = false;
    }
  };

  const validateRecordForm = (form) => {
    let valid = true;
    activeFormFields.forEach((field) => {
      if (!field.required) return;
      const wrapper = form.querySelector(`[data-field-key="${CSS.escape(field.key)}"]`);
      const input = form.elements?.[field.key];
      const value = field.type === "tag-multiselect" ? tagValues(wrapper) : input?.value;
      const missing = Array.isArray(value) ? !value.length : !String(value ?? "").trim();
      wrapper?.classList.toggle("is-invalid", missing);
      const error = wrapper?.querySelector("[data-field-error]");
      if (error) error.hidden = !missing;
      if (missing) valid = false;
    });
    return valid;
  };

  const openUploadModal = () => {
    if (!definition.upload) return;
    selectedUploadFiles = [];
    const element = modal();
    const uploadName = definition.sectionTitle || definition.title;
    const uploadTitle = definition.upload.modalTitle || (uploadName.toLowerCase().includes("upload") ? `Bulk ${uploadName}` : `Bulk ${uploadName} Upload`);
    element.innerHTML = `<section class="adminModalCard adminUploadModal" role="dialog" aria-modal="true" aria-labelledby="adminUploadModalTitle"><header><h2 id="adminUploadModalTitle">${escapeHtml(uploadTitle)}</h2><button class="adminModalClose" data-runtime-action="close-modal" aria-label="Close modal"><i class="bi bi-x-lg"></i></button></header><div class="adminUploadModalBody">${renderUpload()}</div></section>`;
    element.classList.add("is-open");
    element.setAttribute("aria-hidden", "false");
  };

  const openRecordForm = (record = null, action = null) => {
    const settingsFields = (definition.settingsSections || []).flatMap((section) => section.fields || []);
    const config = (record && definition.edit) || definition.create || (settingsFields.length ? {
      title: action?.label || `Edit ${definition.title}`,
      editTitle: action?.label || `Edit ${definition.title}`,
      fields: settingsFields,
    } : null);
    if (!config) {
      openPreview(action || { label: "View" }, record || rows()[0] || {});
      return;
    }
    activeFormFields = config.fields || [];
    const element = modal();
    const edit = Boolean(record);
    const moduleModalClass = ["invoice-upload", "customer-master", "invoice-reallocation", "template-master"].includes(moduleId) ? " adminLongFormModal" : moduleId === "holiday-master" ? " adminHolidayModal" : (moduleId === "bank-master" ? " adminBankModal" : (moduleId === "internal-contacts" ? " adminInternalContactsModal" : ""));
    const formMarkup = (config.fields || []).map((field) => {
      const rendered = renderField(field, record?.[field.key] ?? field.default ?? "");
      if (moduleId !== "template-master" || field.key !== "body") return rendered;
      return `${rendered}<section class="adminTemplatePreview" aria-label="Notification Preview"><strong>Notification Preview</strong><div><header><img src="../assets/admin-reference/inebura-logo.png" alt="Inebura" /><img src="../assets/admin-reference/client-logo.jpg" alt="Client logo" /></header><article><p>Dear ${"${clientFullName}"},</p><p>This is a preview of the selected communication template.</p><table><thead><tr><th>Client Name</th><th>Customer Name</th></tr></thead><tbody><tr><td>TestClient Pvt Ltd</td><td>Sample Customer</td></tr></tbody></table><small>Template variables and content update locally only.</small></article></div></section>`;
    }).join("");
    element.innerHTML = `<section class="adminModalCard adminRuntimeModal${moduleModalClass}" role="dialog" aria-modal="true" aria-labelledby="adminRuntimeModalTitle"><header><div><p>${edit ? "Update record" : "New record"}</p><h2 id="adminRuntimeModalTitle">${escapeHtml(edit ? (config.editTitle || `Edit ${definition.sectionTitle || definition.title}`) : config.title)}</h2></div><button class="adminModalClose" data-runtime-action="close-modal" aria-label="Close modal"><i class="bi bi-x-lg"></i></button></header><form id="adminRuntimeForm" class="adminRecordForm" data-row-id="${escapeHtml(record?.id || "")}" novalidate>${formMarkup}</form><footer><button class="adminSecondary" data-runtime-action="close-modal">Cancel</button><button class="adminPrimary" type="submit" form="adminRuntimeForm">${escapeHtml(edit ? (config.editSubmitLabel || "Update") : (config.submitLabel || "Save"))}</button></footer></section>`;
    element.classList.add("is-open");
    element.classList.toggle("is-holiday-master", moduleId === "holiday-master");
    element.classList.toggle("is-bank-master", moduleId === "bank-master");
    element.classList.toggle("is-internal-contacts", moduleId === "internal-contacts");
    element.classList.remove("is-bank-delete");
    element.setAttribute("aria-hidden", "false");
    element.querySelectorAll("[data-tag-select]").forEach((field) => syncTagSelect(field));
    element.querySelector("input, select")?.dispatchEvent(new Event("change", { bubbles: true }));
  };

  const openConfirm = (action, record) => {
    const element = modal();
    const recordName = record.name || record.title || record.id;
    if (moduleId === "bank-master") {
      element.innerHTML = `<section class="adminModalCard adminBankDeleteModal" role="dialog" aria-modal="true" aria-labelledby="adminBankDeleteTitle"><header><h2 id="adminBankDeleteTitle">${escapeHtml(action.confirmTitle || "Confirm Delete")}</h2><button class="adminModalClose" data-runtime-action="close-modal" aria-label="Close modal"><i class="bi bi-x-lg"></i></button></header><p>Are you sure you want to delete <strong>${escapeHtml(recordName)}</strong>?</p><footer><button class="adminSecondary" data-runtime-action="close-modal">Cancel</button><button class="adminPrimary adminDangerButton" data-runtime-action="confirm-row-action" data-action-id="${escapeHtml(action.id)}" data-row-id="${escapeHtml(record.id)}">${escapeHtml(action.confirmLabel || "Delete")}</button></footer></section>`;
      element.classList.add("is-bank-master", "is-bank-delete");
    } else {
      element.innerHTML = `<section class="adminModalCard adminRuntimeConfirm" role="dialog" aria-modal="true"><div class="adminConfirmIcon ${action.kind === "danger" ? "is-danger" : ""}"><i class="bi ${action.kind === "danger" ? "bi-exclamation-triangle" : "bi-question-circle"}"></i></div><h2>${escapeHtml(action.confirmTitle || action.label)}</h2><p>${escapeHtml((action.confirmBody || `Apply ${action.label} to this record?`).replace("{name}", recordName))}</p><footer><button class="adminSecondary" data-runtime-action="close-modal">Cancel</button><button class="adminPrimary ${action.kind === "danger" ? "adminDangerButton" : ""}" data-runtime-action="confirm-row-action" data-action-id="${escapeHtml(action.id)}" data-row-id="${escapeHtml(record.id)}">${escapeHtml(action.confirmLabel || "Confirm")}</button></footer></section>`;
    }
    element.classList.add("is-open");
    element.setAttribute("aria-hidden", "false");
  };

  const openPreview = (action, record) => {
    const element = modal();
    element.innerHTML = `<section class="adminModalCard adminRuntimePreview" role="dialog" aria-modal="true"><header><div><p>Preview</p><h2>${escapeHtml(record.name || record.title || record.subject || definition.title)}</h2></div><button class="adminModalClose" data-runtime-action="close-modal"><i class="bi bi-x-lg"></i></button></header><div class="adminPreviewBody">${tableColumns().map((column) => `<div><span>${escapeHtml(column.label)}</span><strong>${cellValue(record, column)}</strong></div>`).join("")}</div><footer><button class="adminPrimary" data-runtime-action="close-modal">Close</button></footer></section>`;
    element.classList.add("is-open");
    element.setAttribute("aria-hidden", "false");
  };

  const openConfiguredInteraction = (block, record) => {
    const element = modal();
    const fields = block.fields || [];
    const sections = block.sections || [];
    const actions = block.actions || [{ id: "close", label: "Close", kind: "primary" }];
    element.innerHTML = `<section class="adminModalCard adminRuntimePreview ${block.type === "drawer" ? "adminRuntimeDrawer" : ""}" role="dialog" aria-modal="true"><header><div><p>${block.type === "drawer" ? "Details" : "Admin action"}</p><h2>${escapeHtml(block.title)}</h2></div><button class="adminModalClose" data-runtime-action="close-modal"><i class="bi bi-x-lg"></i></button></header><form id="adminInteractionForm" class="adminRecordForm">${block.description ? `<p class="adminInteractionDescription">${escapeHtml(block.description)}</p>` : ""}${fields.map((field) => renderField(field, record?.[field.key] ?? field.default ?? "")).join("")}${sections.length ? `<div class="adminInteractionSections">${sections.map((section) => `<span><i class="bi bi-check-circle"></i>${escapeHtml(section)}</span>`).join("")}</div>` : ""}${block.summaryCards?.length ? `<div class="adminCustomStats">${block.summaryCards.map((label, index) => `<article><span>${escapeHtml(label)}</span><strong>${index === 0 ? rows().length : index === 1 ? Math.max(0, rows().length - 1) : 1}</strong></article>`).join("")}</div>` : ""}</form><footer>${actions.map((item) => `<button class="${item.kind === "primary" || item.kind === "danger" ? `adminPrimary ${item.kind === "danger" ? "adminDangerButton" : ""}` : "adminSecondary"}" type="${item.kind === "primary" || item.kind === "danger" ? "submit" : "button"}" ${item.kind === "primary" || item.kind === "danger" ? 'form="adminInteractionForm"' : 'data-runtime-action="close-modal"'} data-message="${escapeHtml(block.successMessage || `${item.label} completed in the dummy workspace`)}">${escapeHtml(item.label)}</button>`).join("")}</footer></section>`;
    element.classList.add("is-open");
    element.setAttribute("aria-hidden", "false");
  };

  const formValues = (form, fields = definition.create?.fields || []) => {
    const values = {};
    fields.forEach((field) => {
      const input = form.elements?.[field.key] || form.querySelector?.(`[name="${CSS.escape(field.key)}"]`);
      if (!input) return;
      if (field.type === "checkbox" || field.type === "switch" || field.type === "toggle") values[field.key] = input.checked;
      else if (field.type === "checkbox-group") values[field.key] = Array.from(form.querySelectorAll(`[name="${CSS.escape(field.key)}"]:checked`)).map((option) => option.value);
      else if (field.type === "radio") values[field.key] = form.querySelector(`[name="${CSS.escape(field.key)}"]:checked`)?.value || "";
      else if (field.type === "multiselect") values[field.key] = Array.from(input.selectedOptions).map((option) => option.value);
      else if (field.type === "tag-multiselect") {
        const selected = tagValues(form.querySelector(`[data-field-key="${CSS.escape(field.key)}"]`));
        values[field.key] = selected.length === 1 ? selected[0] : selected;
      }
      else if (field.type === "file") values[field.key] = input.files?.[0]?.name || "";
      else values[field.key] = input.value;
    });
    return values;
  };

  const applyRowAction = (actionId, rowId) => {
    const action = (definition.rowActions || []).find((item) => item.id === actionId);
    const currentRows = rows();
    const index = currentRows.findIndex((row) => String(row.id) === String(rowId));
    if (!action || index < 0) return;
    if (action.id.includes("delete") || action.id === "remove") currentRows.splice(index, 1);
    else if (action.id === "duplicate") currentRows.splice(index + 1, 0, { ...currentRows[index], id: `${moduleId}-${Date.now()}`, name: `${currentRows[index].name || currentRows[index].title || "Copy"} (Copy)` });
    else if (action.set) currentRows[index] = { ...currentRows[index], ...action.set };
    else if (action.toggleField) {
      const current = currentRows[index][action.toggleField];
      currentRows[index][action.toggleField] = action.toggleValues?.[String(current)] ?? action.toggleValues?.default ?? !current;
    } else if (action.id.includes("toggle") || action.id === "pause-resume") {
      const currentStatus = String(currentRows[index].status || "Active").toLowerCase();
      currentRows[index].status = currentStatus === "active" || currentStatus === "running" ? (action.id === "pause-resume" ? "Paused" : "Inactive") : (action.id === "pause-resume" ? "Running" : "Active");
    } else currentRows[index].status = action.resultStatus || action.label;
    persistRows(currentRows);
    closeModal();
    renderTable();
    notify(`${action.label} completed in the dummy Admin workspace`);
  };

  const exportCsv = () => {
    const columns = tableColumns();
    const csv = [columns.map((column) => `"${String(column.label).replaceAll('"', '""')}"`).join(","), ...filteredRows().map((row) => columns.map((column) => `"${String(row[column.key] ?? "").replaceAll('"', '""')}"`).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const link = document.createElement("a");
    link.href = url;
    link.download = `${moduleId}-dummy-export.csv`;
    link.click();
    URL.revokeObjectURL(url);
    notify("Dummy CSV generated");
  };

  document.addEventListener("click", (event) => {
    const trigger = event.target.closest("[data-runtime-action]");
    if (!trigger) return;
    const action = trigger.dataset.runtimeAction;
    if (action === "create") openRecordForm();
    if (action === "open-upload") openUploadModal();
    if (action === "close-modal") closeModal();
    if (action === "close-toast") trigger.closest(".adminToast")?.classList.remove("is-visible");
    if (action === "select-tag") {
      const field = trigger.closest("[data-tag-select]");
      syncTagSelect(field, [...tagValues(field), trigger.dataset.value]);
      const search = field?.querySelector(".adminTagSearch");
      if (search) search.value = "";
      field?.classList.remove("is-invalid");
      const error = field?.querySelector("[data-field-error]");
      if (error) error.hidden = true;
    }
    if (action === "remove-tag") {
      const field = trigger.closest("[data-tag-select]");
      syncTagSelect(field, tagValues(field).filter((value) => String(value) !== String(trigger.dataset.value)));
      field?.querySelector(".adminTagSearch")?.focus();
    }
    if (action === "toggle-search-select") {
      const field = trigger.closest("[data-search-select]");
      const menu = field?.querySelector(".adminSearchSelectMenu");
      document.querySelectorAll(".adminSearchSelectMenu").forEach((other) => {
        if (other !== menu) other.hidden = true;
      });
      if (menu) { menu.hidden = !menu.hidden; field.querySelector('input[type="text"]').setAttribute("aria-expanded", String(!menu.hidden)); }
    }
    if (action === "choose-search-select") {
      const field = trigger.closest("[data-search-select]");
      const value = trigger.dataset.value || trigger.textContent.trim();
      const hidden = field?.querySelector('input[type="hidden"]');
      const display = field?.querySelector('input[type="text"]');
      if (hidden) hidden.value = value;
      if (display) { display.value = trigger.textContent.trim(); display.setAttribute("aria-expanded", "false"); display.focus(); }
      const menu = field?.querySelector(".adminSearchSelectMenu");
      if (menu) menu.hidden = true;
      field?.classList.remove("is-invalid");
      const error = field?.querySelector("[data-field-error]");
      if (error) error.hidden = true;
      hidden?.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (action === "filter-option") {
      activeFilters[trigger.dataset.filterKey] = trigger.dataset.filterValue || "";
      page = 1;
      render();
    }
    if (action === "apply-filters") {
      auditSearchCommitted = true;
      page = 1;
      renderTable();
      notify("Audit filters applied to the dummy records");
    }
    if (action === "apply-search") {
      auditSearchCommitted = true;
      page = 1;
      render();
    }
    if (action === "reset-filters") {
      query = ""; activeFilters = {}; page = 1; auditSearchCommitted = false;
      const search = document.getElementById("adminRuntimeSearch");
      if (search) search.value = "";
      document.querySelectorAll(".adminRuntimeFilter").forEach((filter) => { filter.value = ""; });
      definition.searchFirst ? render() : renderTable();
    }
    if (action === "sort") {
      const key = trigger.dataset.sortKey;
      sortDirection = sortKey === key ? sortDirection * -1 : 1;
      sortKey = key;
      renderTable();
    }
    if (action === "page") {
      page = Number(trigger.dataset.page) || 1;
      renderTable();
    }
    if (action === "row-action") {
      const row = rows().find((item) => String(item.id) === String(trigger.dataset.rowId));
      const rowAction = (definition.rowActions || []).find((item) => item.id === trigger.dataset.actionId);
      if (!row || !rowAction) return;
      const configuredInteraction = definition.customBlocks?.find((block) => block.triggerAction === rowAction.id);
      if (configuredInteraction && ["dialog", "drawer"].includes(configuredInteraction.type)) {
        openConfiguredInteraction(configuredInteraction, row);
        return;
      }
      if (rowAction.id === "edit" || rowAction.id.startsWith("edit-") || ["edit", "form"].includes(rowAction.kind)) openRecordForm(row, rowAction);
      else if (rowAction.kind === "download" || rowAction.id.includes("download")) window.IneburaAdminPreviewNotice();
      else if (["preview", "drawer"].includes(rowAction.kind) || rowAction.id === "preview" || rowAction.id.startsWith("view")) openPreview(rowAction, row);
      else openConfirm(rowAction, row);
    }
    if (action === "confirm-row-action") applyRowAction(trigger.dataset.actionId, trigger.dataset.rowId);
    if (action === "toggle-row") {
      const row=rows().find(item=>String(item.id)===String(trigger.dataset.rowId));
      if(row){row.selected=trigger.checked;persistRows(rows());renderTable();}
    }
    if (action === "toggle-visible-rows") {
      const visibleIds = new Set(filteredRows().slice((page - 1) * pageSize, page * pageSize).map((row) => String(row.id)));
      rows().forEach((row) => { if (visibleIds.has(String(row.id))) row.selected = trigger.checked; });
      persistRows(rows());
      renderTable();
    }
    if (action === "bulk-delete-selected") {
      const selectedCount = rows().filter((row) => row.selected).length;
      const element = modal();
      element.innerHTML = `<section class="adminModalCard adminConfirmModal" role="dialog" aria-modal="true" aria-labelledby="adminBulkDeleteTitle"><header><h2 id="adminBulkDeleteTitle">Delete Selected Invoices</h2><button class="adminModalClose" data-runtime-action="close-modal" aria-label="Close modal"><i class="bi bi-x-lg"></i></button></header><div class="adminConfirmBody"><i class="bi bi-exclamation-triangle"></i><p>This preview will remove ${selectedCount} selected invoice${selectedCount === 1 ? "" : "s"} from the local sample state only.</p></div><footer><button class="adminSecondary" data-runtime-action="close-modal">Cancel</button><button class="adminPrimary adminDangerButton" data-runtime-action="confirm-bulk-delete">Delete</button></footer></section>`;
      element.classList.add("is-open");
      element.setAttribute("aria-hidden", "false");
    }
    if (action === "confirm-bulk-delete") {
      persistRows(rows().filter((row) => !row.selected));
      closeModal();
      renderTable();
      notify("Selected invoices removed from the local sample state");
    }
    if (action === "choose-files") document.getElementById("adminRuntimeFile")?.click();
    if (action === "clear-files" || action === "clear-upload") {
      selectedUploadFiles = [];
      const input = document.getElementById("adminRuntimeFile");
      if (input) input.value = "";
      const list = document.getElementById("adminRuntimeFileList");
      if (list) {
        list.innerHTML = "";
        list.hidden = true;
      }
      document.querySelectorAll("[data-runtime-action='run-upload'], [data-runtime-action='upload']").forEach((button) => { button.disabled = true; });
    }
    if (action === "validate-upload") {
      if (!selectedUploadFiles.length) {
        notify("Choose at least one valid file first");
        return;
      }
      const progress = document.getElementById("adminRuntimeUploadProgress");
      progress.hidden = false;
      progress.querySelector("i").style.width = "100%";
      progress.querySelector("span").textContent = `${selectedUploadFiles.length} file(s) passed dummy validation`;
      notify("Dummy file validation completed");
    }
    if (action === "run-upload" || (action.includes("upload") && !action.includes("download") && !["open-upload", "clear-upload", "validate-upload"].includes(action))) {
      if (!selectedUploadFiles.length) {
        notify("Choose at least one valid file first");
        return;
      }
      const progress = document.getElementById("adminRuntimeUploadProgress");
      progress.hidden = false;
      progress.querySelector("i").style.width = "35%";
      progress.querySelector("span").textContent = "Validating dummy records…";
      window.setTimeout(() => {
        progress.querySelector("i").style.width = "100%";
        progress.querySelector("span").textContent = `${selectedUploadFiles.length} file(s) processed successfully`;
        const uploadRows = selectedUploadFiles.map((file, index) => ({ id: `upload-${Date.now()}-${index}`, name: file.name, fileName: file.name, file: file.name, status: "Completed", progress: 100, uploadDate: new Date().toLocaleDateString("en-IN"), uploadedAt: new Date().toLocaleString("en-IN"), total: 24, success: 22, successful: 22, rejected: 2 }));
        persistRows([...uploadRows, ...rows()]);
        renderTable();
        notify("Dummy upload completed");
      }, 650);
    }
    if (action === "save-settings") {
      const sectionIndex = Number(trigger.dataset.section);
      const section = definition.settingsSections?.[sectionIndex];
      const card = trigger.closest("[data-settings-section]");
      state._settings ||= {};
      state._settings[moduleId] ||= {};
      if (card && section) Object.assign(state._settings[moduleId], formValues(card, section.fields || []));
      writeState(state);
      notify("Configuration saved in the Admin dummy workspace");
    }
    if (action === "export" || action === "download-template") exportCsv();
    if (action === "reset-demo") {
      persistRows(clone(definition.seedRows || []));
      query = ""; activeFilters = {}; page = 1; sortKey = ""; auditSearchCommitted = false;
      render();
      notify("Dummy page data reset");
    }
    if (action === "custom") notify(trigger.dataset.message || "Dummy action completed");
  });

  document.addEventListener("input", (event) => {
    if (event.target.matches(".adminTagSearch")) {
      const field = event.target.closest("[data-tag-select]");
      const queryValue = event.target.value.trim().toLowerCase();
      const selected = tagValues(field).map(String);
      field?.querySelectorAll("[data-runtime-action='select-tag']").forEach((option) => {
        option.hidden = selected.includes(String(option.dataset.value)) || !option.textContent.toLowerCase().includes(queryValue);
      });
      const menu = field?.querySelector(".adminTagMenu");
      if (menu) menu.hidden = false;
    }
    if (event.target.form?.id === "adminRuntimeForm") {
      const wrapper = event.target.closest("[data-field-key]");
      wrapper?.classList.remove("is-invalid");
      const error = wrapper?.querySelector("[data-field-error]");
      if (error) error.hidden = true;
      if (["internal-contacts", "customer-contacts"].includes(moduleId) && ["firstName", "lastName"].includes(event.target.name)) {
        const firstName = event.target.form.elements.firstName?.value.trim() || "";
        const lastName = event.target.form.elements.lastName?.value.trim() || "";
        const fullName = event.target.form.elements.fullName;
        if (fullName) fullName.value = [firstName, lastName].filter(Boolean).join(" ");
      }
      if (event.target.maxLength > 0) {
        const counter=event.target.parentElement?.querySelector(".adminCharacterCount");
        if(counter)counter.textContent=`${event.target.value.length} / ${event.target.maxLength}`;
      }
    }
    if (event.target.id === "adminRuntimeSearch") {
      query = event.target.value;
      page = 1;
      if (definition.liveSearchFirst) {
        const wasCommitted = auditSearchCommitted;
        auditSearchCommitted = Boolean(query.trim());
        if (wasCommitted === auditSearchCommitted) renderTable();
        else {
          render();
          const replacement = document.getElementById("adminRuntimeSearch");
          replacement?.focus();
          replacement?.setSelectionRange(query.length, query.length);
        }
      } else if (!definition.searchFirst || auditSearchCommitted) renderTable();
    }
    if (event.target.matches(".adminRuntimeFilter")) {
      activeFilters[event.target.dataset.filterKey] = event.target.value === "All" ? "" : event.target.value;
      page = 1;
      if (moduleId !== "audit-trail") renderTable();
    }
  });

  document.addEventListener("change", (event) => {
    if (event.target.id === "adminRuntimeFile") {
      selectedUploadFiles = Array.from(event.target.files || []);
      const list = document.getElementById("adminRuntimeFileList");
      if (list) {
        list.innerHTML = selectedUploadFiles.map((file) => `<span><i class="bi bi-file-earmark-check"></i>${escapeHtml(file.name)}<small>${Math.max(1, Math.round(file.size / 1024))} KB</small></span>`).join("");
        list.hidden = !selectedUploadFiles.length;
      }
      document.querySelectorAll("[data-runtime-action='run-upload'], [data-runtime-action='upload']").forEach((button) => { button.disabled = !selectedUploadFiles.length; });
    }
    if (event.target.form?.id === "adminRuntimeForm") {
      document.querySelectorAll("[data-depends-on]").forEach((wrapper) => {
        const controlling = event.target.form.elements[wrapper.dataset.dependsOn];
        let matches = true;
        if (controlling) {
          const actual = controlling.type === "checkbox" ? controlling.checked : controlling.value;
          const accepted = JSON.parse(wrapper.dataset.dependsValues || "[]").map(String);
          matches = !accepted.length || accepted.includes(String(actual));
        }
        if (matches && wrapper.dataset.dependsAnd) {
          const extra = JSON.parse(wrapper.dataset.dependsAnd);
          const extraInput = event.target.form.elements[extra.key || extra.field];
          const extraActual = extraInput?.type === "checkbox" ? extraInput.checked : extraInput?.value;
          const extraAccepted = (extra.values || [extra.value ?? extra.equals]).map(String);
          matches = !extraAccepted.length || extraAccepted.includes(String(extraActual));
        }
        wrapper.hidden = !matches;
      });
    }
  });

  document.addEventListener("submit", (event) => {
    if (event.target.id === "adminInteractionForm") {
      event.preventDefault();
      const message = event.submitter?.dataset.message || "Dummy Admin action completed";
      closeModal();
      notify(message);
      return;
    }
    if (event.target.matches("[data-runtime-inline-form]")) {
      event.preventDefault();
      event.target.reset();
      notify("Dummy form submitted successfully");
      return;
    }
    if (event.target.id !== "adminRuntimeForm") return;
    event.preventDefault();
    if (!validateRecordForm(event.target)) {
      notify(definition.create?.validationToast || "Please fill all required fields", definition.create?.validationToast ? "warning" : "error");
      event.target.querySelector(".is-invalid input, .is-invalid select")?.focus();
      return;
    }
    const values = formValues(event.target, activeFormFields);
    if (moduleId === "internal-contacts") {
      values.fullName = [values.firstName, values.lastName].filter(Boolean).join(" ");
      values.name = values.fullName;
      values.email = values.emailId;
      values.mobile = values.phoneNumber1;
    }
    const rowId = event.target.dataset.rowId;
    const currentRows = rows();
    if (rowId) {
      const index = currentRows.findIndex((row) => String(row.id) === String(rowId));
      if (index >= 0) currentRows[index] = { ...currentRows[index], ...values };
    } else {
      currentRows.unshift({ id: `${moduleId}-${Date.now()}`, status: "Active", ...(definition.newRowDefaults || {}), ...values });
    }
    persistRows(currentRows);
    closeModal();
    renderTable();
    notify(rowId ? (definition.create?.updateMessage || "Record updated") : (definition.create?.successMessage || "Record created"));
  });

  document.addEventListener("focusin", (event) => {
    if (!event.target.matches(".adminTagSearch")) return;
    document.querySelectorAll(".adminTagMenu").forEach((menu) => { menu.hidden = true; });
    const menu = event.target.closest("[data-tag-select]")?.querySelector(".adminTagMenu");
    if (menu) menu.hidden = false;
  });

  document.addEventListener("input", event => {
    if (!event.target.matches('[data-search-select] input[type="text"]')) return;
    const field=event.target.closest("[data-search-select]");
    const menu=field.querySelector(".adminSearchSelectMenu");
    menu.hidden=false;
    event.target.setAttribute("aria-expanded","true");
    field.querySelector('input[type="hidden"]').value="";
    menu.querySelectorAll("button").forEach(option=>option.hidden=!option.textContent.toLowerCase().includes(event.target.value.toLowerCase()));
  });
  document.addEventListener("keydown", event => {
    const field=event.target.closest("[data-search-select]");
    if(!field)return;
    const menu=field.querySelector(".adminSearchSelectMenu");
    const options=[...menu.querySelectorAll("button")].filter(option=>!option.hidden);
    if(event.key==="ArrowDown"||event.key==="ArrowUp"){
      event.preventDefault();menu.hidden=false;
      const index=options.indexOf(document.activeElement);
      options[(index+(event.key==="ArrowDown"?1:-1)+options.length)%options.length]?.focus();
    }
    if(event.key==="Escape"&&!menu.hidden){event.stopPropagation();menu.hidden=true;field.querySelector('input[type="text"]').focus();}
  });
  document.addEventListener("click", (event) => {
    if (event.target.closest("[data-tag-select], [data-search-select]")) return;
    document.querySelectorAll(".adminTagMenu").forEach((menu) => { menu.hidden = true; });
    document.querySelectorAll(".adminSearchSelectMenu").forEach((menu) => { menu.hidden = true; });
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeModal();
  });

  render();
})();
