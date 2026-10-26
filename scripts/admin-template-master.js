/* Offline replica of the Xeon communication template catalog. */
(() => {
  'use strict';
  if (new URLSearchParams(location.search).get('module') !== 'template-master') return;
  const source = window.IneburaTemplateMasterSource;
  const mount = document.getElementById('adminPageContent');
  if (!source || !mount) return;
  document.body.classList.add('templateMasterActive');
  let storage;
  try { storage = window.localStorage; } catch (_) { storage = window.IneburaAdminPreviewStorage; }
  const key = 'ineburaTemplateMaster:xeon:20261015:v1';
  let saved;
  try { saved = JSON.parse(storage.getItem(key) || 'null'); } catch (_) {}
  // Only copy is editable; older saves cannot override the read-only details or the removed Disabled flag.
  const editable = ['subject', 'body', 'description'];
  let rows = source.templates.map(row => {
    const item = saved?.templates?.find(entry => entry.id === row.id) || {};
    return { ...row, ...Object.fromEntries(editable.filter(name => typeof item[name] === 'string').map(name => [name, item[name]])) };
  });
  const editor = window.IneburaTemplateEditor;
  // Red entries in the approved 19 October catalog are unavailable to Admin.
  // Match immutable source IDs so old saved code edits cannot restore hidden templates.
  const hiddenCodes = new Set([
    "CcProcessingInterrupted",
    "CcClosedNoImpactedInvoices",
    "CcStillPending",
    "CcExecutedWithErrors",
    "CcExecuted",
    "CcHeldMonthEndFailed",
    "CcPendingEscalation",
    "CcPendingReminder",
    "MonthEndAgentCollectionReminder",
    "MonthEndConfigChanged",
    "MonthEndUpcomingNotice",
    "MonthEndCycleFailure",
    "SuperAdminAttendanceReport",
    "MonthlyVisitHrReport",
    "TestEmail",
    "ClientDeleteEmail",
    "ClientSuspendEmail",
    "ActivityReportMail",
    "UserCreatedAdmin",
    "OnBoardingLinkExpired",
    "ClientCreationError",
    "ClientCreation",
    "ODMReportMail",
    "PasswordResetEmail",
    "UserCreated",
    "PasswordGenerationEmail"
]);
  const hiddenIds = new Set(source.templates.filter(row => hiddenCodes.has(row.code)).map(row => row.id));
  const dunningIds = new Set(source.templates.filter(row => row.id === 'xeon-template-10' || /^DunningLetter(?:One|Two|Three|\d+)Email$/.test(row.code)).map(row => row.id));
  const adminRows = () => rows.filter(row => !hiddenIds.has(row.id) && !dunningIds.has(row.id));
  let draft = null;
  let failover = saved?.failoverEnabled ?? source.failoverEnabled;
  let page = 1, sortKey = '', sortDirection = 1, editing = null, opener = null;
  const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const persist = () => storage.setItem(key, JSON.stringify({ templates: rows, failoverEnabled: failover }));
  const modal = document.getElementById('adminModal');
  const columns = [['eventType','Event Type'],['recipientRole','Recipient Role'],['communicationMode','Comm. Mode'],['code','Code'],['subject','Subject'],['schedule','Schedule'],['description','Description']];
  const notify = text => { const toast = document.getElementById('adminToast'); toast.textContent = text; toast.classList.add('is-visible'); setTimeout(() => toast.classList.remove('is-visible'), 2400); };
  // Keep the shared offline shell; use the captured client branding on this module only.
  const brand = document.querySelector('.adminSharedHeader .logoInebura');
  if (brand) brand.src = '../assets/template-master/inebura-logo.png';
  const clientLogo = document.querySelector('.adminSharedHeader .relLogo img');
  if (clientLogo) clientLogo.src = '../assets/template-master/xeon-logo.jpg';
  const clientName = document.querySelector('.adminRelationshipName');
  if (clientName) clientName.textContent = 'Xeon Infraservices Pvt Ltd';
  const avatar = document.querySelector('.headerUserAvatar');
  if (avatar) avatar.textContent = 'AX';
  mount.innerHTML = `<main class="tmPage" data-admin-module="template-master"><section class="tmHero"><h1>Communication Setup</h1><p>Configure SMTP, email accounts, and templates.</p></section><section class="tmFailover"><h2>Failover Email</h2><div class="tmFailoverRow"><div><strong>Failover Email to ar.services@inebura.com</strong><p>If none of your own sender mailboxes can send a message, it goes out from ar.services@inebura.com instead.</p><p class="tmMuted">Sign-in mail — one-time codes, password resets and new-user credentials — always uses ar.services@inebura.com whatever this is set to, so turning it off cannot lock anyone out.</p></div><label class="tmSwitch"><input id="tmFailover" type="checkbox" aria-label="Failover email to ar.services@inebura.com" ${failover ? 'checked' : ''}><span class="tmSwitchTrack"></span><span id="tmFailoverLabel">${failover ? 'On' : 'Off'}</span></label></div></section><section class="tmWorkspace"><nav class="tmTabs" aria-label="Communication Setup sections"><a class="is-active" aria-current="page" href="admin.html?module=template-master">Template Master</a><a href="admin.html?module=smtp-setup">Email Sender SMTP Setup</a><a href="admin.html?module=sender-account">Email Sender Account Setup</a></nav><div class="tmWorkspaceBody"><div class="tmTableWrap" tabindex="0" role="region" aria-label="Communication templates"><table class="tmTable"><thead><tr><th>Actions</th>${columns.map(([key,label])=>`<th>${['code','subject','description'].includes(key)?`<button data-tm-sort="${key}">${label}<span class="tmSortIcons"><i class="bi bi-caret-up-fill"></i><i class="bi bi-caret-down-fill"></i></span></button>`:label}</th>`).join('')}</tr></thead><tbody id="tmRows"></tbody></table></div><footer class="tmPager"><strong id="tmSummary"></strong><nav id="tmPages" aria-label="Template pagination"></nav></footer></div></section></main>`;
  function renderRows() {
    const list = adminRows();
    if (sortKey) list.sort((a,b) => String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''), undefined, {numeric:true}) * sortDirection);
    document.getElementById('tmRows').innerHTML = list.slice((page-1)*10,page*10).map(row => `<tr><td><button class="tmEdit" data-tm-edit="${escape(row.id)}"><i class="bi bi-pencil" aria-hidden="true"></i> Edit</button></td>${columns.map(([key])=>`<td${key==='code'?' class="tmCode"':''}>${escape(row[key] || '-')}</td>`).join('')}</tr>`).join('');
    const count = Math.ceil(list.length/10);
    document.getElementById('tmSummary').textContent = `Showing ${(page-1)*10+1}–${Math.min(page*10,list.length)} of ${list.length}`;
    const visible = new Set([1,count,...Array.from({length:5},(_,i)=>Math.max(1,Math.min(count-4,page-2))+i)]);
    const pages = [...visible].sort((a,b)=>a-b);
    document.getElementById('tmPages').innerHTML = `<button data-tm-page="${page-1}" aria-label="Previous page" ${page===1?'disabled':''}><i class="bi bi-chevron-left"></i></button>${pages.map((n,i)=>`${i&&n-pages[i-1]>1?'<button disabled aria-label="More pages">…</button>':''}<button data-tm-page="${n}" ${n===page?'class="is-active" aria-current="page"':''}>${n}</button>`).join('')}<button data-tm-page="${page+1}" aria-label="Next page" ${page===count?'disabled':''}><i class="bi bi-chevron-right"></i></button>`;
    document.querySelectorAll('[data-tm-sort]').forEach(button => { button.closest('th').setAttribute('aria-sort', button.dataset.tmSort===sortKey ? sortDirection===1?'ascending':'descending' : 'none'); });
  }
  function templateDetails(row) {
    const fields = [['eventType', 'Event Type', 0], ['recipientRole', 'Recipient Role', 1], ['communicationMode', 'Communication Mode', 2], ['schedule', 'Scheduled Sending', 3], ['code', 'Code', null]];
    return `<section class="tmMetadata tmFull" aria-label="Template details"><div class="tmMetadataHeading"><span>Template details</span><span class="tmReadOnlyBadge">Read only</span></div>${fields.map(([name, label, index]) => {
      const option = index === null ? null : source.options[index]?.find(item => item.value === row[name]);
      const value = row[name] ? option?.label || row[name] : 'Not set';
      return `<label class="tmField${name === 'code' ? ' tmMetaWide' : ''}"><span>${label}</span><input name="${name}" value="${escape(value)}" readonly aria-readonly="true"></label>`;
    }).join('')}</section>`;
  }
  function openEditor(id, button) {
    const row = adminRows().find(item => item.id === id);
    if (!row) return;
    editing = row.id; opener = button;
    draft = { body: row.body, subject: row.subject };
    modal.classList.add('is-open', 'tmBackdrop'); modal.setAttribute('aria-hidden','false');
    modal.innerHTML = `<section class="tmModal" role="dialog" aria-modal="true" aria-labelledby="tmEditorTitle"><header><h2 id="tmEditorTitle">Edit Template</h2><button type="button" class="tmClose" data-tm-close aria-label="Close editor"><img src="../assets/template-master/close.svg" alt=""></button></header><form id="tmForm"><div class="tmFormGrid">${templateDetails(row)}<div class="tmField tmFull"><span id="tmSubjectLabel">Subject Line</span><div class="tmSubjectEditor" id="tmSubjectEditor" role="group" aria-labelledby="tmSubjectLabel"></div></div><label class="tmField tmFull"><span>Description</span><input name="description" maxlength="${Math.max(50,row.description.length)}" value="${escape(row.description)}"></label><section class="tmPreviewField tmFull" aria-labelledby="tmPreviewLabel"><div class="tmPreviewHeading"><span id="tmPreviewLabel">Notification Preview</span><span class="tmSampleBadge">Sample data</span></div><p class="tmEditorHint" id="tmEditorHint">Click message text to edit it. <span class="tmLockedKey">🔒 Sample values</span> are locked and replaced with actual data when sent.</p><iframe id="tmBodyEditor" title="Notification Preview editor" aria-describedby="tmEditorHint" sandbox="allow-same-origin" referrerpolicy="no-referrer"></iframe></section></div></form><footer><button class="tmCancel" type="button" data-tm-close>Cancel</button><button class="tmUpdate" type="submit" form="tmForm" disabled>Update</button></footer></section>`;
    const subjectModel = editor.project(row.subject, { plain: true, editable: true });
    const subjectRoot = document.getElementById('tmSubjectEditor');
    subjectRoot.innerHTML = subjectModel.markup;
    editor.attachEditor(subjectRoot, subjectModel, value => { draft.subject = value; });
    let bodyReady=false;
    const syncUpdate=()=>{if(editing===row.id)modal.querySelector('.tmUpdate').disabled=!bodyReady;};
    const bodyModel = editor.project(row.body, { editable: true });
    const frame = document.getElementById('tmBodyEditor');
    frame.addEventListener('load', () => {
      if (editing !== row.id || !frame.isConnected) return;
      const doc = frame.contentDocument;
      editor.attachEditor(doc.body, bodyModel, value => { draft.body = value; });
      // Keyboard navigation works across the isolated message editor and modal controls.
      doc.addEventListener('keydown', event => {
        if (event.key === 'Escape') { event.preventDefault(); closeEditor(); return; }
        const fields = [...doc.querySelectorAll('[contenteditable="plaintext-only"]')];
        if (event.key === 'Tab' && event.shiftKey && doc.activeElement === fields[0]) {
          event.preventDefault(); document.querySelector('#tmForm input[name="description"]').focus();
        } else if (event.key === 'Tab' && !event.shiftKey && doc.activeElement === fields.at(-1)) {
          event.preventDefault(); modal.querySelector('.tmCancel').focus();
        }
      });
      bodyReady=true;syncUpdate();
    }, { once: true });
    frame.srcdoc = editor.frameDocument(bodyModel.markup, true);
    document.body.style.overflow='hidden';
    modal.querySelector('.tmClose').focus();
  }
  function closeEditor() {
    modal.classList.remove('is-open','tmBackdrop');modal.setAttribute('aria-hidden','true');modal.innerHTML='';editing=null;draft=null;document.body.style.overflow='';opener?.focus();
  }
  mount.addEventListener('click', event => {
    const edit = event.target.closest('[data-tm-edit]'); if(edit)openEditor(edit.dataset.tmEdit,edit);
    const next = event.target.closest('[data-tm-page]'); if(next&&!next.disabled){page=Number(next.dataset.tmPage);renderRows();}
    const sort = event.target.closest('[data-tm-sort]');if(sort){sortDirection=sortKey===sort.dataset.tmSort?-sortDirection:1;sortKey=sort.dataset.tmSort;page=1;renderRows();}
  });
  mount.addEventListener('change', event => {if(event.target.id==='tmFailover'){failover=event.target.checked;persist();document.getElementById('tmFailoverLabel').textContent=failover?'On':'Off';notify('Failover setting saved in this offline app.');}});
  modal.addEventListener('click', event => {if(editing&&(event.target===modal||event.target.closest('[data-tm-close]')))closeEditor();});
  modal.addEventListener('submit', event => {
    if(!editing||event.target.id!=='tmForm')return;event.preventDefault();
    const form=event.target, updated=rows.find(row=>row.id===editing);
    if (!updated || hiddenIds.has(updated.id) || dunningIds.has(updated.id) || !draft || modal.querySelector('.tmUpdate').disabled) return;
    const previous={...updated};
    try {
      updated.subject=draft.subject;updated.body=draft.body;updated.description=form.elements.description.value;
      persist();
      closeEditor();renderRows();notify('Template updated in this offline app.');
    } catch(error) {
      Object.assign(updated,previous);
      notify(error.message||'Template could not be saved.');
    }
  });
  document.addEventListener('keydown', event=>{if(!editing)return;if(event.key==='Escape'){event.preventDefault();closeEditor();}if(event.key==='Tab'){const focusable=[...modal.querySelectorAll('button,input,select,textarea,iframe,[contenteditable="plaintext-only"]')].filter(e=>!e.disabled);const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
  renderRows();
})();
