/* Client-admin submission aging configuration, following Invoice Preferences. */
(() => {
  'use strict';
  const page = window.IneburaAdminPage;
  const insights = window.SubmissionInsights;
  if (page?.module !== 'submission-process' || page.view !== 'submission-aging' || !insights) return;
  const body = document.querySelector('.adminRuntimePage[data-admin-module="submission-process"] .adminWorkspaceBody');
  if (!body) return;

  body.innerHTML = `<section class="adminAgingWorkspace" aria-labelledby="adminAgingTitle">
    <header class="adminAgingHeader"><h2 id="adminAgingTitle">Submission aging bucket</h2>
      <p>Customize the non-overlapping ranges shown in the Submission Aging dashboard card. Pending invoices age from invoice date to today; submitted invoices stop on the submission date.</p></header>
    <div class="adminAgingBody">
      <div class="opSubTabs" role="tablist" aria-label="Bucket customization">
        <button type="button" role="tab" id="submissionExistingTab" aria-selected="true" aria-controls="submissionExistingPanel" class="is-active">Select from Existing</button>
        <button type="button" role="tab" id="submissionGroupsTab" aria-selected="false" aria-controls="submissionGroupsPanel">Create Custom Groups</button>
      </div>
      <div id="submissionExistingPanel" role="tabpanel" aria-labelledby="submissionExistingTab">
        <p class="adminAgingHelp">Select the days on which a new range begins. Unticked ranges merge with the previous one; day 0 is always included.</p>
        <div class="adminTableWrap"><table class="adminTable opAgingTable"><thead><tr><th>Select</th><th>Bucket name</th><th>From</th><th>To</th></tr></thead><tbody id="submissionExistingRows"></tbody></table></div>
        <div class="opEndAction"><button type="button" class="adminPrimary" id="submissionSaveExisting">Submit Selected</button></div>
      </div>
      <div id="submissionGroupsPanel" role="tabpanel" aria-labelledby="submissionGroupsTab" hidden>
        <div class="adminAgingGroupToolbar">
          <p class="adminAgingHelp">Combine consecutive existing ranges into a named group. Each range can belong to one group; ungrouped ranges remain visible on the dashboard.</p>
          <button type="button" class="adminPrimary" id="submissionCreateGroup">Create Bucket</button>
        </div>
        <div id="submissionGroupCards" class="adminAgingGroupCards"></div>
      </div>
      <p id="submissionAgingMessage" class="adminAgingMessage" role="status" aria-live="polite"></p>
    </div>
  </section>
  <div id="submissionGroupModal" class="adminAgingModalBackdrop" hidden>
    <section class="adminAgingModal" role="dialog" aria-modal="true" aria-labelledby="submissionGroupModalTitle">
      <header><h2 id="submissionGroupModalTitle">Create Custom Group</h2><button type="button" id="submissionGroupClose" aria-label="Close">×</button></header>
      <form id="submissionGroupForm"><div class="adminAgingModalFields">
        <label><span>GROUP NAME *</span><input id="submissionGroupName" type="text" maxlength="60" placeholder="e.g. Early Stage" required /></label>
        <label><span>GROUP COLOR</span><input id="submissionGroupColor" type="color" value="#55257f" /></label>
      </div><fieldset><legend>Select Buckets (consecutive selection)</legend><div id="submissionGroupPicker" class="adminAgingPicker"></div></fieldset>
      <p id="submissionGroupError" class="adminAgingMessage is-error" role="alert"></p>
      <footer><button type="button" class="adminSecondary" id="submissionGroupCancel">Cancel</button><button type="submit" class="adminPrimary">Save Group</button></footer></form>
    </section>
  </div>`;

  const $ = selector => body.querySelector(selector);
  const message = $('#submissionAgingMessage');
  let config = insights.readConfig(localStorage);
  const candidates = [...config.thresholds, ...insights.DEFAULT_THRESHOLDS.filter(day => !config.thresholds.includes(day)).slice(0, 20 - config.thresholds.length)].sort((a, b) => a - b);
  let selected = new Set(config.thresholds);
  let editing = -1;
  let picked = new Set();
  const showMessage = (value, error = false) => { message.textContent = value; message.classList.toggle('is-error', error); };
  const base = () => insights.bands(config.thresholds);
  const tab = mode => {
    const custom = mode === 'groups';
    $('#submissionExistingTab').classList.toggle('is-active', !custom);
    $('#submissionGroupsTab').classList.toggle('is-active', custom);
    $('#submissionExistingTab').setAttribute('aria-selected', String(!custom));
    $('#submissionGroupsTab').setAttribute('aria-selected', String(custom));
    $('#submissionExistingPanel').hidden = custom;
    $('#submissionGroupsPanel').hidden = !custom;
    if (custom) { selected = new Set(config.thresholds); renderExisting(); }
    showMessage('');
  };
  function renderExisting() {
    const tbody = $('#submissionExistingRows');
    tbody.replaceChildren();
    const displayed = insights.bands(candidates);
    displayed.forEach((band, index) => {
      const tr = document.createElement('tr');
      const checkCell = tr.insertCell();
      const checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.dataset.start = String(band.start);
      checkbox.checked = band.start === 0 || selected.has(band.start);
      checkbox.disabled = band.start === 0;
      checkbox.setAttribute('aria-label', `Start a range at day ${band.start}`);
      checkCell.append(checkbox);
      [band.label, String(band.start), band.end === Infinity ? 'No limit' : String(band.end)].forEach(value => {
        const td = tr.insertCell(); td.textContent = value;
      });
      tbody.append(tr);
    });
  }
  function renderGroups() {
    const cards = $('#submissionGroupCards');
    cards.replaceChildren();
    $('#submissionCreateGroup').hidden = !config.groups.length;
    if (!config.groups.length) {
      const empty = document.createElement('div'); empty.className = 'adminAgingEmpty';
      const title = document.createElement('strong'); title.textContent = 'No custom groups yet';
      const hint = document.createElement('span'); hint.textContent = 'Create a group to combine consecutive submission aging ranges.';
      const create = document.createElement('button'); create.type = 'button'; create.className = 'adminPrimary'; create.textContent = 'Create Bucket'; create.addEventListener('click', () => openGroup());
      empty.append(title, hint, create); cards.append(empty); return;
    }
    config.groups.forEach((group, index) => {
      const article = document.createElement('article');
      article.style.setProperty('--op-group-color', group.color);
      const header = document.createElement('header');
      const name = document.createElement('strong'); name.textContent = group.name; header.append(name);
      const content = document.createElement('div');
      const label = document.createElement('b'); label.textContent = 'Buckets:';
      const ranges = document.createElement('p');
      ranges.textContent = group.starts.map(start => base().find(band => band.start === start)?.label).join(', ');
      const footer = document.createElement('footer');
      const edit = document.createElement('button'); edit.type = 'button'; edit.className = 'adminSecondary'; edit.textContent = 'Edit'; edit.addEventListener('click', () => openGroup(index));
      const remove = document.createElement('button'); remove.type = 'button'; remove.className = 'adminAgingDelete'; remove.textContent = 'Delete'; remove.addEventListener('click', () => {
        try { config.groups = insights.saveGroups(localStorage, config.groups.filter((_, i) => i !== index), config.thresholds); renderGroups(); showMessage('Custom group deleted.'); }
        catch (error) { showMessage(error.message, true); }
      });
      footer.append(edit, remove); content.append(label, ranges, footer); article.append(header, content); cards.append(article);
    });
  }
  function renderPicker() {
    const picker = $('#submissionGroupPicker');
    picker.replaceChildren();
    const ranges = base();
    const claimed = new Set(config.groups.flatMap((group, index) => index === editing ? [] : group.starts));
    const indexes = [...picked].map(start => ranges.findIndex(range => range.start === start)).sort((a, b) => a - b);
    ranges.forEach((range, index) => {
      const button = document.createElement('button'); button.type = 'button';
      button.textContent = range.label; button.classList.toggle('is-selected', picked.has(range.start));
      button.disabled = claimed.has(range.start) || (picked.has(range.start) && index !== indexes[0] && index !== indexes.at(-1)) || (indexes.length > 0 && !picked.has(range.start) && index !== indexes[0] - 1 && index !== indexes.at(-1) + 1);
      button.addEventListener('click', () => { if (picked.has(range.start)) picked.delete(range.start); else picked.add(range.start); renderPicker(); });
      picker.append(button);
    });
  }
  function closeGroup() { $('#submissionGroupModal').hidden = true; }
  function openGroup(index = -1) {
    editing = index;
    const group = config.groups[index];
    picked = new Set(group?.starts || []);
    $('#submissionGroupModalTitle').textContent = index < 0 ? 'Create Custom Group' : 'Edit Custom Group';
    $('#submissionGroupName').value = group?.name || '';
    $('#submissionGroupColor').value = group?.color || '#55257f';
    $('#submissionGroupError').textContent = '';
    renderPicker(); $('#submissionGroupModal').hidden = false; $('#submissionGroupName').focus();
  }
  $('#submissionExistingTab').addEventListener('click', () => tab('existing'));
  $('#submissionGroupsTab').addEventListener('click', () => tab('groups'));
  $('#submissionExistingRows').addEventListener('change', event => {
    const start = Number(event.target.dataset.start);
    if (!Number.isInteger(start) || start === 0) return;
    if (event.target.checked) selected.add(start); else selected.delete(start);
    renderExisting();
  });
  $('#submissionSaveExisting').addEventListener('click', () => {
    try {
      const thresholds = insights.validateThresholds([...selected]);
      if (JSON.stringify(thresholds) !== JSON.stringify(config.thresholds)) {
        const hadGroups = config.groups.length > 0;
        insights.saveThresholds(localStorage, thresholds);
        config = insights.readConfig(localStorage); renderGroups();
        showMessage(hadGroups ? 'Aging buckets saved. Custom groups were cleared because their ranges changed.' : 'Aging buckets saved.');
      } else showMessage('Aging buckets saved.');
      renderExisting();
    } catch (error) { showMessage(error.message, true); }
  });
  $('#submissionCreateGroup').addEventListener('click', () => openGroup());
  $('#submissionGroupClose').addEventListener('click', closeGroup);
  $('#submissionGroupCancel').addEventListener('click', closeGroup);
  $('#submissionGroupModal').addEventListener('click', event => { if (event.target.id === 'submissionGroupModal') closeGroup(); });
  $('#submissionGroupForm').addEventListener('submit', event => {
    event.preventDefault();
    const group = { name:$('#submissionGroupName').value, color:$('#submissionGroupColor').value, starts:[...picked] };
    const next = [...config.groups];
    if (editing < 0) next.push(group); else next[editing] = group;
    try {
      config.groups = insights.saveGroups(localStorage, next, config.thresholds);
      closeGroup(); renderGroups(); showMessage('Custom group saved. The dashboard will use the updated ranges.');
    } catch (error) { $('#submissionGroupError').textContent = error.message; }
  });
  renderExisting(); renderGroups();
})();
