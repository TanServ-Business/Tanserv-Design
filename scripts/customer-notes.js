(() => {
  const V2_STORAGE_KEY = "tns-notes-v2";
  const LEGACY_STORAGE_KEY = "tns-customer-level-notes-v1";

  const toText = (value) => String(value || "").trim();
  const normalize = (value) => toText(value).replace(/\s+/g, " ").toLowerCase();

  const escapeHtml = (value) => String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#39;");

  const safeDate = (value) => {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  };

  const formatDateTime = (value) => {
    const parsed = safeDate(value);
    return parsed.toLocaleString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatCreatorStamp = (name, value) => {
    const parsed = safeDate(value);
    const hh = String(parsed.getHours()).padStart(2, "0");
    const mm = String(parsed.getMinutes()).padStart(2, "0");
    const dd = String(parsed.getDate()).padStart(2, "0");
    const mon = String(parsed.getMonth() + 1).padStart(2, "0");
    return `${toText(name) || "User"} • ${hh}:${mm}, ${dd}-${mon}`;
  };

  const buildPreviewText = (note, surface, maxLength = 90, clickable = false) => {
    const flat = String(note?.text || "").replace(/\s+/g, " ").trim();
    if (flat.length <= maxLength) return escapeHtml(flat);
    const readMoreMarkup = clickable
      ? `<button class="customerNotesReadMore customerNotesReadMoreBtn" type="button" data-action="expand-note" data-note-id="${escapeHtml(note.id)}" data-surface="${escapeHtml(surface)}">Read more</button>`
      : `<span class="customerNotesReadMore">Read more</span>`;
    return `${escapeHtml(flat.slice(0, maxLength))}... ${readMoreMarkup}`;
  };

  const uid = (prefix = "note") => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const getUser = () => {
    const name = toText(localStorage.getItem("activeUserName") || "User");
    const roleFromStorage = toText(localStorage.getItem("activeUserRole"));
    const heading = normalize(document.querySelector("h1")?.textContent || "");
    let inferredRole = "agent";
    if (heading.includes("kam")) inferredRole = "kam";
    if (heading.includes("kas")) inferredRole = "kas";
    if (heading.includes("manager")) inferredRole = "manager";
    const role = normalize(roleFromStorage || inferredRole || "agent") || "agent";
    return {
      name,
      role,
      key: `${normalize(name)}::${role}`
    };
  };

  const isGenericScopeCode = (value) => {
    const v = normalize(value);
    return !v || v === "-" || v === "all" || v === "mgr" || v === "agt" || v === "cust";
  };

  const isLikelyScopeCode = (value) => /^cust[-_\s]*\d+/i.test(toText(value));

  const getNodeText = (selector) => {
    const node = document.querySelector(selector);
    return node ? toText(node.textContent) : "";
  };

  const detectScope = () => {
    const codeCenter = getNodeText("#centerCustomerCode");
    const nameCenter = toText((getNodeText("#centerCustomerName") || "").split("CUST-")[0]);

    if (!isGenericScopeCode(codeCenter)) {
      return {
        scopeKey: normalize(codeCenter),
        scopeLabel: nameCenter || codeCenter,
        scopeName: nameCenter || codeCenter
      };
    }

    const selectedLabel = getNodeText("#selectedAgentName");
    if (/^customer\s*:/i.test(selectedLabel)) {
      const parsed = toText(selectedLabel.replace(/^customer\s*:/i, ""));
      if (parsed) {
        return {
          scopeKey: normalize(parsed),
          scopeLabel: parsed,
          scopeName: parsed
        };
      }
    }

    const codeManager = getNodeText("#managerCustomerCode");
    const nameManager = getNodeText("#managerCustomerName");
    if (!isGenericScopeCode(codeManager)) {
      return {
        scopeKey: normalize(codeManager),
        scopeLabel: nameManager || codeManager,
        scopeName: nameManager || codeManager
      };
    }

    const fallback = toText(document.body?.dataset?.relationshipName || "Customer");
    return {
      scopeKey: normalize(fallback),
      scopeLabel: fallback,
      scopeName: fallback
    };
  };

  const normalizeNote = (raw, fallbackType = "customer") => {
    const createdAt = raw?.createdAt || raw?.updatedAt || new Date().toISOString();
    const createdBy = toText(raw?.createdBy || raw?.author || "User") || "User";
    const createdRole = normalize(raw?.createdRole || raw?.role || "agent") || "agent";
    const type = raw?.type === "personal" ? "personal" : fallbackType;
    return {
      id: toText(raw?.id) || uid(type === "personal" ? "pnote" : "cnote"),
      type,
      text: toText(raw?.text),
      scopeKey: normalize(raw?.scopeKey || raw?.scopeLabel || ""),
      scopeLabel: toText(raw?.scopeLabel || raw?.scopeKey || ""),
      createdAt,
      updatedAt: raw?.updatedAt || createdAt,
      createdBy,
      createdRole,
      updatedBy: toText(raw?.updatedBy || createdBy) || createdBy
    };
  };

  const emptyStore = () => ({
    customer_notes: [],
    personal_notes: {}
  });

  const normalizeStore = (raw) => {
    const base = emptyStore();
    if (!raw || typeof raw !== "object") return base;

    const customerList = Array.isArray(raw.customer_notes) ? raw.customer_notes : [];
    base.customer_notes = customerList
      .map((item) => normalizeNote(item, "customer"))
      .filter((item) => item.text);

    const personal = raw.personal_notes && typeof raw.personal_notes === "object" ? raw.personal_notes : {};
    Object.keys(personal).forEach((key) => {
      const list = Array.isArray(personal[key]) ? personal[key] : [];
      base.personal_notes[key] = list
        .map((item) => normalizeNote({ ...item, type: "personal" }, "personal"))
        .filter((item) => item.text);
    });

    return base;
  };

  const saveStore = (store) => {
    try {
      localStorage.setItem(V2_STORAGE_KEY, JSON.stringify(store));
      return true;
    } catch (_err) {
      return false;
    }
  };

  const migrateLegacyIfNeeded = (store) => {
    if (store.customer_notes.length > 0) return store;

    let legacy = [];
    try {
      const rawLegacy = localStorage.getItem(LEGACY_STORAGE_KEY);
      const parsed = rawLegacy ? JSON.parse(rawLegacy) : [];
      legacy = Array.isArray(parsed) ? parsed : [];
    } catch (_err) {
      legacy = [];
    }

    if (!legacy.length) return store;

    const migrated = legacy
      .map((item) => normalizeNote({
        id: item?.id,
        type: "customer",
        text: item?.text,
        scopeKey: item?.scopeKey,
        scopeLabel: item?.scopeLabel,
        createdAt: item?.createdAt,
        updatedAt: item?.updatedAt || item?.createdAt,
        createdBy: item?.author || item?.createdBy,
        createdRole: item?.role || item?.createdRole,
        updatedBy: item?.updatedBy || item?.author || item?.createdBy
      }, "customer"))
      .filter((note) => note.text);

    if (!migrated.length) return store;

    const next = {
      ...store,
      customer_notes: migrated
    };
    saveStore(next);
    return next;
  };

  const loadStore = () => {
    try {
      const raw = localStorage.getItem(V2_STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : emptyStore();
      const normalized = normalizeStore(parsed);
      return migrateLegacyIfNeeded(normalized);
    } catch (_err) {
      return migrateLegacyIfNeeded(emptyStore());
    }
  };

  const sortByNewest = (list) => [...list].sort((a, b) => safeDate(b.updatedAt).getTime() - safeDate(a.updatedAt).getTime());

  const buildMainTile = (note, state, surface) => {
    const meta = escapeHtml(formatCreatorStamp(note.createdBy, note.updatedAt));
    const isEditing = state.editing?.surface === surface && state.editing?.noteId === note.id;

    if (isEditing) {
      return `
        <article class="customerNotesTile customerNotesTileEditing customerNotesTileEditorFocus" data-note-id="${escapeHtml(note.id)}" data-surface="${escapeHtml(surface)}">
          <textarea class="customerNotesInlineEditor" data-edit-input>${escapeHtml(note.text)}</textarea>
          <div class="customerNotesTileFooter">
            <div class="customerNotesTileMeta">${meta}</div>
            <div class="customerNotesTileActions">
              <button class="customerNotesActionBtn customerNotesActionSave" type="button" data-action="save-edit" data-note-id="${escapeHtml(note.id)}" data-surface="${escapeHtml(surface)}">Save</button>
              <button class="customerNotesActionBtn" type="button" data-action="cancel-edit" data-note-id="${escapeHtml(note.id)}" data-surface="${escapeHtml(surface)}">Close</button>
            </div>
          </div>
        </article>
      `;
    }

    return `
      <article class="customerNotesTile" data-note-id="${escapeHtml(note.id)}">
        <div class="customerNotesTileBody">${buildPreviewText(note, surface, 90, false)}</div>
        <div class="customerNotesTileFooter">
          <div class="customerNotesTileMeta">${meta}</div>
          <div class="customerNotesTileActions">
            <button class="customerNotesActionBtn customerNotesIconAction" type="button" data-action="edit" data-note-id="${escapeHtml(note.id)}" data-surface="${escapeHtml(surface)}" aria-label="Edit note">
              <i class="bi bi-pencil-square" aria-hidden="true"></i>
            </button>
            <button class="customerNotesActionBtn customerNotesActionDanger customerNotesIconAction" type="button" data-action="delete" data-note-id="${escapeHtml(note.id)}" aria-label="Delete note">
              <i class="bi bi-trash" aria-hidden="true"></i>
            </button>
          </div>
        </div>
      </article>
    `;
  };

  const createModule = (container, index) => {
    container.innerHTML = `
      <div class="customerNotesV2" data-notes-root>
        <div class="customerNotesTopRow">
          <h4 class="customerNotesTitle">Notes</h4>
          <div class="customerNotesTopActions">
            <button class="customerNotesTopBtn customerNotesTopBtnCustomer" type="button" data-action="switch-customer">Customer Notes</button>
            <button class="customerNotesTopBtn customerNotesTopBtnNotepad" type="button" data-action="switch-notepad">My Notepad</button>
            <button class="customerNotesTopBtn" type="button" data-action="open-manage">Manage Notes</button>
          </div>
        </div>

        <div class="customerNotesScopeHint" data-scope-hint></div>

        <div class="customerNotesGrid" data-main-list aria-live="polite"></div>

        <div class="customerNotesComposer">
          <textarea class="customerNotesComposerInput" data-main-input placeholder="Add note..."></textarea>
          <div class="customerNotesComposerActions">
            <button class="todoAddBtn customerNotesPrimaryBtn" type="button" data-action="add-note">Add Note</button>
          </div>
        </div>
      </div>
    `;

    const modalId = `customerNotesManageModal-${index}`;
    const modalMarkup = `
      <div class="customerNotesManageModal hidden" id="${modalId}" aria-hidden="true">
        <div class="customerNotesManageBackdrop" data-action="close-manage"></div>
        <div class="customerNotesManageDialog" role="dialog" aria-modal="true" aria-label="Manage customer notes">
          <div class="customerNotesManageHeader">
            <h4>Manage Customer Notes</h4>
            <button class="customerNotesIconBtn" type="button" data-action="close-manage" aria-label="Close">×</button>
          </div>
          <div class="customerNotesManageFilters">
            <div class="customerNotesManageCustomerFilter" data-customer-filter-wrap>
              <button class="customerNotesFilterTrigger" type="button" data-action="toggle-filter-menu">
                <span data-customer-filter-label>All customers</span>
                <i class="bi bi-chevron-down" aria-hidden="true"></i>
              </button>
              <div class="customerNotesFilterMenu hidden" data-customer-filter-menu-wrap>
                <div class="customerNotesFilterSearch">
                  <i class="bi bi-search" aria-hidden="true"></i>
                  <input type="search" data-customer-filter-search placeholder="Search customer..." />
                </div>
                <div class="customerNotesFilterOptions" data-customer-filter-options></div>
              </div>
              <div class="customerNotesFilterPills" data-customer-filter-pills></div>
            </div>
            <input type="search" class="customerNotesManageSearch" data-manage-search placeholder="Search across notes..." />
          </div>
          <div class="customerNotesManageGrid" data-manage-list aria-live="polite"></div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML("beforeend", modalMarkup);
    const modalEl = document.getElementById(modalId);

    const state = {
      mode: "customer",
      editing: null,
      expanded: null,
      scope: detectScope(),
      manageFilter: "all",
      manageSearch: "",
      manageFilterOpen: false,
      manageCustomerQuery: ""
    };

    const rerenderScope = () => {
      state.scope = detectScope();
    };

    const getStore = () => loadStore();

    const getMainNotes = () => {
      const store = getStore();
      if (state.mode === "personal") {
        const user = getUser();
        const personal = Array.isArray(store.personal_notes[user.key]) ? store.personal_notes[user.key] : [];
        return sortByNewest(personal);
      }
      return sortByNewest(store.customer_notes.filter((note) => normalize(note.scopeKey) === normalize(state.scope.scopeKey)));
    };

    const getManageNotes = () => {
      const store = getStore();
      let list = sortByNewest(store.customer_notes);
      if (state.manageFilter !== "all") {
        list = list.filter((note) => normalize(note.scopeKey) === normalize(state.manageFilter));
      }
      if (state.manageSearch) {
        const q = normalize(state.manageSearch);
        list = list.filter((note) => normalize(note.text).includes(q) || normalize(note.createdBy).includes(q) || normalize(note.scopeLabel).includes(q));
      }
      return list;
    };

    const renderMain = () => {
      rerenderScope();
      const root = container.querySelector("[data-notes-root]");
      if (!root) return;

      const scopeHint = root.querySelector("[data-scope-hint]");
      const customerBtn = root.querySelector('[data-action="switch-customer"]');
      const notepadBtn = root.querySelector('[data-action="switch-notepad"]');
      const addBtn = root.querySelector('[data-action="add-note"]');
      const input = root.querySelector("[data-main-input]");
      const listEl = root.querySelector("[data-main-list]");

      const isPersonal = state.mode === "personal";
      customerBtn?.classList.toggle("is-active", !isPersonal);
      notepadBtn?.classList.toggle("is-active", isPersonal);

      if (scopeHint) {
        scopeHint.textContent = isPersonal
          ? `My Notepad (${getUser().name})`
          : `Customer Notes • ${state.scope.scopeName || state.scope.scopeLabel}`;
      }

      if (input) {
        input.placeholder = isPersonal
          ? "Write in your personal notepad..."
          : "Add a customer note...";
      }

      if (addBtn) {
        addBtn.textContent = isPersonal ? "Add to My Notepad" : "Add Customer Note";
      }

      const notes = getMainNotes();
      if (!listEl) return;

      if (!notes.length) {
        root.classList.remove("is-editing-main");
        listEl.innerHTML = '<div class="customerNotesEmpty">No notes found.</div>';
        return;
      }

      const isEditingMain = state.editing?.surface === "main";
      root.classList.toggle("is-editing-main", Boolean(isEditingMain));
      if (isEditingMain) {
        const selected = notes.find((note) => note.id === state.editing.noteId);
        if (selected) {
          listEl.innerHTML = buildMainTile(selected, state, "main");
          return;
        }
        state.editing = null;
        root.classList.remove("is-editing-main");
      }

      listEl.innerHTML = notes.map((note) => buildMainTile(note, state, "main")).join("");
    };

    const renderManageFilter = () => {
      if (!modalEl) return;
      const labelEl = modalEl.querySelector("[data-customer-filter-label]");
      const menuWrapEl = modalEl.querySelector("[data-customer-filter-menu-wrap]");
      const optionsEl = modalEl.querySelector("[data-customer-filter-options]");
      const pillsEl = modalEl.querySelector("[data-customer-filter-pills]");
      const filterSearchEl = modalEl.querySelector("[data-customer-filter-search]");
      if (!optionsEl || !pillsEl || !labelEl || !menuWrapEl || !filterSearchEl) return;

      const store = getStore();
      const labelByKey = new Map();
      sortByNewest(store.customer_notes)
        .filter((note) => note.scopeKey)
        .forEach((note) => {
          const key = note.scopeKey;
          const candidate = toText(note.scopeLabel || note.scopeKey);
          const current = labelByKey.get(key);
          const shouldReplace = !current || (isLikelyScopeCode(current) && !isLikelyScopeCode(candidate));
          if (shouldReplace) labelByKey.set(key, candidate);
        });
      const options = Array.from(labelByKey.entries());

      const current = state.manageFilter;
      const safeCurrent = current === "all" || options.some(([k]) => k === current) ? current : "all";
      state.manageFilter = safeCurrent;

      const selectedLabel = safeCurrent === "all"
        ? "All customers"
        : (options.find(([key]) => key === safeCurrent)?.[1] || "All customers");
      labelEl.textContent = selectedLabel;
      filterSearchEl.value = state.manageCustomerQuery;
      menuWrapEl.classList.toggle("hidden", !state.manageFilterOpen);

      const filteredOptions = options.filter(([, label]) => (
        !state.manageCustomerQuery || normalize(label).includes(normalize(state.manageCustomerQuery))
      ));
      const selectedOption = options.find(([key]) => key === state.manageFilter);
      const hasSelectedInFiltered = selectedOption && filteredOptions.some(([key]) => key === selectedOption[0]);
      if (selectedOption && !hasSelectedInFiltered && state.manageFilter !== "all") {
        filteredOptions.unshift(selectedOption);
      }
      const optionRows = [
        { key: "all", label: "All customers" },
        ...filteredOptions.map(([key, label]) => ({ key, label }))
      ];

      optionsEl.innerHTML = optionRows.map((option) => `
        <button
          class="customerNotesFilterOption${state.manageFilter === option.key ? " is-active" : ""}"
          type="button"
          data-action="choose-filter"
          data-filter-value="${escapeHtml(option.key)}"
        >
          ${escapeHtml(option.label)}
        </button>
      `).join("");

      pillsEl.innerHTML = optionRows.map((option) => `
        <button
          class="customerNotesFilterPill${state.manageFilter === option.key ? " is-active" : ""}"
          type="button"
          data-action="choose-filter"
          data-filter-value="${escapeHtml(option.key)}"
        >
          ${escapeHtml(option.label)}
        </button>
      `).join("");
    };

    const renderManage = () => {
      if (!modalEl) return;
      renderManageFilter();

      const listEl = modalEl.querySelector("[data-manage-list]");
      if (!listEl) return;

      const isEditingModal = state.editing?.surface === "modal";
      const isExpandedModal = state.expanded?.surface === "modal";
      const isFocusedModal = Boolean(isEditingModal || isExpandedModal);
      modalEl.classList.toggle("is-editing-modal", isFocusedModal);

      const notes = isFocusedModal
        ? sortByNewest(getStore().customer_notes).filter((note) => note.id === (state.editing?.noteId || state.expanded?.noteId))
        : getManageNotes();
      if (!notes.length) {
        state.editing = null;
        state.expanded = null;
        modalEl.classList.remove("is-editing-modal");
        listEl.innerHTML = '<div class="customerNotesEmpty">No customer notes found.</div>';
        return;
      }

      const labelByKey = new Map();
      sortByNewest(getStore().customer_notes)
        .filter((entry) => entry.scopeKey)
        .forEach((entry) => {
          const key = entry.scopeKey;
          const candidate = toText(entry.scopeLabel || entry.scopeKey);
          const current = labelByKey.get(key);
          const shouldReplace = !current || (isLikelyScopeCode(current) && !isLikelyScopeCode(candidate));
          if (shouldReplace) labelByKey.set(key, candidate);
        });

      listEl.innerHTML = notes.map((note) => {
        const meta = escapeHtml(formatCreatorStamp(note.createdBy, note.updatedAt));
        const scopeLine = escapeHtml(labelByKey.get(note.scopeKey) || note.scopeLabel || note.scopeKey || "Customer");
        const isEditing = state.editing?.surface === "modal" && state.editing?.noteId === note.id;
        const isExpanded = state.expanded?.surface === "modal" && state.expanded?.noteId === note.id;

        if (isEditing) {
          return `
            <article class="customerNotesTile customerNotesTileLarge customerNotesTileEditing customerNotesTileEditorFocus" data-note-id="${escapeHtml(note.id)}" data-surface="modal">
              <div class="customerNotesTileScope"><span class="customerNotesScopePill">${scopeLine}</span></div>
              <textarea class="customerNotesInlineEditor" data-edit-input>${escapeHtml(note.text)}</textarea>
              <div class="customerNotesTileFooter">
                <div class="customerNotesTileMeta">${meta}</div>
                <div class="customerNotesTileActions">
                  <button class="customerNotesActionBtn customerNotesActionSave" type="button" data-action="save-edit" data-note-id="${escapeHtml(note.id)}" data-surface="modal">Save</button>
                  <button class="customerNotesActionBtn" type="button" data-action="cancel-edit" data-note-id="${escapeHtml(note.id)}" data-surface="modal">Close</button>
                </div>
              </div>
            </article>
          `;
        }

        if (isExpanded) {
          return `
            <article class="customerNotesTile customerNotesTileLarge customerNotesTileEditing customerNotesTileEditorFocus" data-note-id="${escapeHtml(note.id)}" data-surface="modal">
              <div class="customerNotesTileScope"><span class="customerNotesScopePill">${scopeLine}</span></div>
              <div class="customerNotesTileBody customerNotesExpandedBody">${escapeHtml(note.text)}</div>
              <div class="customerNotesTileFooter">
                <div class="customerNotesTileMeta">${meta}</div>
                <div class="customerNotesTileActions">
                  <button class="customerNotesActionBtn" type="button" data-action="close-expand" data-note-id="${escapeHtml(note.id)}" data-surface="modal">Close</button>
                </div>
              </div>
            </article>
          `;
        }

        return `
          <article class="customerNotesTile customerNotesTileLarge" data-note-id="${escapeHtml(note.id)}">
            <div class="customerNotesTileScope"><span class="customerNotesScopePill">${scopeLine}</span></div>
            <div class="customerNotesTileBody">${buildPreviewText(note, "modal", 90, true)}</div>
            <div class="customerNotesTileFooter">
              <div class="customerNotesTileMeta">${meta}</div>
              <div class="customerNotesTileActions">
                <button class="customerNotesActionBtn customerNotesIconAction" type="button" data-action="edit" data-note-id="${escapeHtml(note.id)}" data-surface="modal" aria-label="Edit note">
                  <i class="bi bi-pencil-square" aria-hidden="true"></i>
                </button>
                <button class="customerNotesActionBtn customerNotesActionDanger customerNotesIconAction" type="button" data-action="delete" data-note-id="${escapeHtml(note.id)}" aria-label="Delete note">
                  <i class="bi bi-trash" aria-hidden="true"></i>
                </button>
              </div>
            </div>
          </article>
        `;
      }).join("");
    };

    const rerenderAll = () => {
      renderMain();
      renderManage();
    };

    const updateNote = (noteId, nextText) => {
      const user = getUser();
      const cleaned = toText(nextText);
      if (!cleaned) return;

      const store = getStore();
      let updated = false;

      const customerNext = store.customer_notes.map((note) => {
        if (note.id !== noteId) return note;
        updated = true;
        return {
          ...note,
          text: cleaned,
          updatedAt: new Date().toISOString(),
          updatedBy: user.name
        };
      });

      if (!updated) {
        Object.keys(store.personal_notes).forEach((key) => {
          store.personal_notes[key] = (store.personal_notes[key] || []).map((note) => {
            if (note.id !== noteId) return note;
            updated = true;
            return {
              ...note,
              text: cleaned,
              updatedAt: new Date().toISOString(),
              updatedBy: user.name
            };
          });
        });
      }

      if (!updated) return;

      const nextStore = {
        ...store,
        customer_notes: customerNext
      };
      saveStore(nextStore);
    };

    const deleteNote = (noteId) => {
      const store = getStore();
      const customerBefore = store.customer_notes.length;
      const customerNext = store.customer_notes.filter((note) => note.id !== noteId);
      let changed = customerBefore !== customerNext.length;

      const personalNext = { ...store.personal_notes };
      Object.keys(personalNext).forEach((key) => {
        const original = Array.isArray(personalNext[key]) ? personalNext[key] : [];
        const filtered = original.filter((note) => note.id !== noteId);
        if (filtered.length !== original.length) changed = true;
        personalNext[key] = filtered;
      });

      if (!changed) return;
      saveStore({
        ...store,
        customer_notes: customerNext,
        personal_notes: personalNext
      });
    };

    const addNote = () => {
      const input = container.querySelector("[data-main-input]");
      const text = toText(input?.value || "");
      if (!text) {
        input?.focus();
        return;
      }

      const user = getUser();
      const scope = detectScope();
      const now = new Date().toISOString();
      const store = getStore();

      if (state.mode === "personal") {
        const userList = Array.isArray(store.personal_notes[user.key]) ? store.personal_notes[user.key] : [];
        store.personal_notes[user.key] = [
          {
            id: uid("pnote"),
            type: "personal",
            text,
            scopeKey: "",
            scopeLabel: "",
            createdAt: now,
            updatedAt: now,
            createdBy: user.name,
            createdRole: user.role,
            updatedBy: user.name
          },
          ...userList
        ];
      } else {
        store.customer_notes.unshift({
          id: uid("cnote"),
          type: "customer",
          text,
          scopeKey: scope.scopeKey,
          scopeLabel: scope.scopeLabel,
          createdAt: now,
          updatedAt: now,
          createdBy: user.name,
          createdRole: user.role,
          updatedBy: user.name
        });
      }

      saveStore(normalizeStore(store));
      if (input) input.value = "";
      state.editing = null;
      rerenderAll();
    };

    const openManage = () => {
      if (!modalEl) return;
      state.manageFilterOpen = false;
      state.expanded = null;
      modalEl.classList.remove("hidden");
      modalEl.setAttribute("aria-hidden", "false");
      renderManage();
    };

    const closeManage = () => {
      if (!modalEl) return;
      state.manageFilterOpen = false;
      state.expanded = null;
      state.editing = null;
      modalEl.classList.add("hidden");
      modalEl.setAttribute("aria-hidden", "true");
    };

    container.addEventListener("click", (event) => {
      const actionEl = event.target.closest("[data-action]");
      if (!actionEl) return;
      const action = actionEl.getAttribute("data-action");

      if (action === "switch-customer") {
        state.mode = "customer";
        state.editing = null;
        state.expanded = null;
        renderMain();
        return;
      }

      if (action === "switch-notepad") {
        state.mode = "personal";
        state.editing = null;
        state.expanded = null;
        renderMain();
        return;
      }

      if (action === "open-manage") {
        openManage();
        return;
      }

      if (action === "add-note") {
        addNote();
        return;
      }

      if (action === "edit") {
        const noteId = actionEl.getAttribute("data-note-id") || "";
        const surface = actionEl.getAttribute("data-surface") || "main";
        if (!noteId) return;
        state.expanded = null;
        state.editing = { noteId, surface };
        rerenderAll();
        return;
      }

      if (action === "cancel-edit") {
        state.editing = null;
        state.expanded = null;
        rerenderAll();
        return;
      }

      if (action === "save-edit") {
        const noteId = actionEl.getAttribute("data-note-id") || "";
        const surface = actionEl.getAttribute("data-surface") || "main";
        const tile = actionEl.closest(`.customerNotesTile[data-surface="${surface}"]`) || actionEl.closest(".customerNotesTile");
        const input = tile ? tile.querySelector("[data-edit-input]") : null;
        if (!noteId || !input) return;
        updateNote(noteId, input.value);
        state.editing = null;
        state.expanded = null;
        rerenderAll();
        return;
      }

      if (action === "delete") {
        const noteId = actionEl.getAttribute("data-note-id") || "";
        if (!noteId) return;
        const confirmed = window.confirm("Delete this note?");
        if (!confirmed) return;
        deleteNote(noteId);
        state.editing = null;
        state.expanded = null;
        rerenderAll();
      }
    });

    container.addEventListener("keydown", (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
        const target = event.target;
        if (target && target.matches("[data-main-input]")) {
          event.preventDefault();
          addNote();
        }
      }
    });

    modalEl?.addEventListener("click", (event) => {
      if (state.manageFilterOpen && !event.target.closest("[data-customer-filter-wrap]")) {
        state.manageFilterOpen = false;
        renderManageFilter();
      }

      const actionEl = event.target.closest("[data-action]");
      if (!actionEl) return;
      const action = actionEl.getAttribute("data-action");
      if (action === "close-manage") {
        closeManage();
        return;
      }

      if (action === "toggle-filter-menu") {
        state.manageFilterOpen = !state.manageFilterOpen;
        renderManageFilter();
        return;
      }

      if (action === "choose-filter") {
        const nextFilter = actionEl.getAttribute("data-filter-value") || "all";
        state.manageFilter = nextFilter;
        state.manageFilterOpen = false;
        renderManage();
        return;
      }

      if (action === "expand-note") {
        const noteId = actionEl.getAttribute("data-note-id") || "";
        const surface = actionEl.getAttribute("data-surface") || "modal";
        if (!noteId) return;
        state.editing = null;
        state.expanded = { noteId, surface };
        renderManage();
        return;
      }

      if (action === "close-expand") {
        state.expanded = null;
        renderManage();
        return;
      }

      if (action === "edit") {
        const noteId = actionEl.getAttribute("data-note-id") || "";
        if (!noteId) return;
        state.expanded = null;
        state.editing = { noteId, surface: "modal" };
        rerenderAll();
        return;
      }

      if (action === "cancel-edit") {
        state.editing = null;
        state.expanded = null;
        rerenderAll();
        return;
      }

      if (action === "save-edit") {
        const noteId = actionEl.getAttribute("data-note-id") || "";
        const tile = actionEl.closest('.customerNotesTile[data-surface="modal"]') || actionEl.closest(".customerNotesTile");
        const input = tile ? tile.querySelector("[data-edit-input]") : null;
        if (!noteId || !input) return;
        updateNote(noteId, input.value);
        state.editing = null;
        state.expanded = null;
        rerenderAll();
        return;
      }

      if (action === "delete") {
        const noteId = actionEl.getAttribute("data-note-id") || "";
        if (!noteId) return;
        const confirmed = window.confirm("Delete this note?");
        if (!confirmed) return;
        deleteNote(noteId);
        state.editing = null;
        state.expanded = null;
        rerenderAll();
      }
    });

    const searchEl = modalEl?.querySelector("[data-manage-search]");
    const filterSearchEl = modalEl?.querySelector("[data-customer-filter-search]");

    searchEl?.addEventListener("input", () => {
      state.manageSearch = toText(searchEl.value);
      renderManage();
    });

    filterSearchEl?.addEventListener("input", () => {
      state.manageCustomerQuery = toText(filterSearchEl.value);
      state.manageFilterOpen = true;
      renderManageFilter();
    });

    const observeTargets = [
      document.getElementById("centerCustomerCode"),
      document.getElementById("centerCustomerName"),
      document.getElementById("selectedAgentName"),
      document.getElementById("managerCustomerCode"),
      document.getElementById("managerCustomerName")
    ].filter(Boolean);

    if (observeTargets.length) {
      const observer = new MutationObserver(() => {
        const prevScope = state.scope.scopeKey;
        rerenderScope();
        if (state.mode === "customer" && state.scope.scopeKey !== prevScope) {
          renderMain();
        }
      });
      observeTargets.forEach((node) => {
        observer.observe(node, { childList: true, subtree: true, characterData: true });
      });
    }

    // Ensure right-side notes panel is visible on pages where it starts hidden.
    const rightPanel = container.closest(".managerTodoPanel");
    if (rightPanel && rightPanel.classList.contains("hidden") && !document.getElementById("todoHeaderBtn")) {
      rightPanel.classList.remove("hidden");
      const layout = document.querySelector(".managerLayout");
      if (layout) layout.classList.add("todoOpen");
    }

    rerenderAll();
  };

  const init = () => {
    const mounts = Array.from(document.querySelectorAll("[data-customer-notes]"));
    if (!mounts.length) return;
    mounts.forEach((mount, index) => createModule(mount, index));
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
