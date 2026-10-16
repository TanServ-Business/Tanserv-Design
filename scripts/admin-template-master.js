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
  let rows = source.templates.map(row => ({ ...row, ...(saved?.templates?.find(item => item.id === row.id) || {}) }));
  let failover = saved?.failoverEnabled ?? source.failoverEnabled;
  let page = 1, sortKey = '', sortDirection = 1, editing = null, opener = null;
  const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
  const persist = () => storage.setItem(key, JSON.stringify({ templates: rows, failoverEnabled: failover }));
  const modal = document.getElementById('adminModal');
  const fields = [ ['eventType', 'Event Type', 0, 'Select Event Type'], ['recipientRole', 'Recipient Role', 1, 'Select Recipient Role'], ['communicationMode', 'Communication Mode', 2, 'Select Mode'], ['schedule', 'Scheduled Sending', 3, 'Select Schedule'] ];
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
    const list = [...rows];
    if (sortKey) list.sort((a,b) => String(a[sortKey] || '').localeCompare(String(b[sortKey] || ''), undefined, {numeric:true}) * sortDirection);
    document.getElementById('tmRows').innerHTML = list.slice((page-1)*10,page*10).map(row => `<tr><td><button class="tmEdit" data-tm-edit="${escape(row.id)}"><i class="bi bi-pencil" aria-hidden="true"></i> Edit</button></td>${columns.map(([key])=>`<td${key==='code'?' class="tmCode"':''}>${escape(row[key] || '-')}</td>`).join('')}</tr>`).join('');
    const count = Math.ceil(list.length/10);
    document.getElementById('tmSummary').textContent = `Showing ${(page-1)*10+1}–${Math.min(page*10,list.length)} of ${list.length}`;
    const visible = new Set([1,count,...Array.from({length:5},(_,i)=>Math.max(1,Math.min(count-4,page-2))+i)]);
    const pages = [...visible].sort((a,b)=>a-b);
    document.getElementById('tmPages').innerHTML = `<button data-tm-page="${page-1}" aria-label="Previous page" ${page===1?'disabled':''}><i class="bi bi-chevron-left"></i></button>${pages.map((n,i)=>`${i&&n-pages[i-1]>1?'<button disabled aria-label="More pages">…</button>':''}<button data-tm-page="${n}" ${n===page?'class="is-active" aria-current="page"':''}>${n}</button>`).join('')}<button data-tm-page="${page+1}" aria-label="Next page" ${page===count?'disabled':''}><i class="bi bi-chevron-right"></i></button>`;
    document.querySelectorAll('[data-tm-sort]').forEach(button => { button.closest('th').setAttribute('aria-sort', button.dataset.tmSort===sortKey ? sortDirection===1?'ascending':'descending' : 'none'); });
  }
  const selectField = (row,[key,label,index,placeholder]) => {
    const options = [...source.options[index]];
    if (row[key] && !options.some(option=>option.value===row[key])) options.push({value:row[key],label:row[key]});
    return `<label class="tmField"><span>${label}${index<2?' *':''}</span><select name="${key}">${options.map(option=>`<option value="${escape(option.value)}" ${option.value===row[key]?'selected':''}>${escape(option.value?option.label:placeholder)}</option>`).join('')}</select></label>`;
  };
  function preview(body,mode) {
    const frame = document.getElementById('tmPreview');
    const html = mode === 'WhatsApp' && !/<(?:!doctype|html|body|div|table|p)[\s>]/i.test(body) ? `<div style="white-space:pre-wrap;font:14px/1.5 Calibri,Arial,sans-serif;padding:12px">${escape(body)}</div>` : body;
    // Render untrusted template HTML in a unique-origin sandbox with no network or script execution.
    frame.srcdoc = `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src data:; font-src 'none'; form-action 'none'; base-uri 'none'"><style>html{overflow-wrap:anywhere}body{margin:0;font-family:Calibri,"Segoe UI",Arial,sans-serif!important;line-height:1.5}img{max-width:100%}a{pointer-events:none}</style>${html}`;
  }
  function openEditor(id,button) {
    const row = rows.find(item=>item.id===id);
    if (!row) return;
    editing = row.id; opener = button;
    modal.classList.add('is-open', 'tmBackdrop'); modal.setAttribute('aria-hidden','false');
    modal.innerHTML = `<section class="tmModal" role="dialog" aria-modal="true" aria-labelledby="tmEditorTitle"><header><h2 id="tmEditorTitle">Edit Template</h2><button type="button" class="tmClose" data-tm-close aria-label="Close editor"><img src="../assets/template-master/close.svg" alt=""></button></header><form id="tmForm"><div class="tmFormGrid">${fields.map(field=>selectField(row,field)).join('')}<label class="tmField"><span>Code *</span><input name="code" maxlength="${Math.max(50,row.code.length)}" value="${escape(row.code)}" required></label><label class="tmField"><span>Subject Line</span><input name="subject" maxlength="1000" value="${escape(row.subject)}"></label><label class="tmField tmFull"><span>Description</span><input name="description" maxlength="${Math.max(50,row.description.length)}" value="${escape(row.description)}"></label><label class="tmField tmBodyField"><span>Template Content *</span><textarea name="body" rows="3" maxlength="${Math.max(4500,row.body.length)}" required>${escape(row.body)}</textarea><small id="tmCount">${row.body.length}/4500</small></label><div class="tmPreviewField"><span>Notification Preview</span><iframe id="tmPreview" title="Notification Preview" sandbox="" referrerpolicy="no-referrer"></iframe></div></div><label class="tmSwitch tmDisabled"><input name="disabled" type="checkbox" ${row.disabled?'checked':''}><span class="tmSwitchTrack"></span><span id="tmDisabledLabel">Disabled</span></label></form><footer><button class="tmCancel" type="button" data-tm-close>Cancel</button><button class="tmUpdate" type="submit" form="tmForm">Update</button></footer></section>`;
    preview(row.body,row.communicationMode);
    document.body.style.overflow='hidden';
    modal.querySelector('.tmClose').focus();
  }
  function closeEditor() {
    modal.classList.remove('is-open','tmBackdrop');modal.setAttribute('aria-hidden','true');modal.innerHTML='';editing=null;document.body.style.overflow='';opener?.focus();
  }
  mount.addEventListener('click', event => {
    const edit = event.target.closest('[data-tm-edit]'); if(edit)openEditor(edit.dataset.tmEdit,edit);
    const next = event.target.closest('[data-tm-page]'); if(next&&!next.disabled){page=Number(next.dataset.tmPage);renderRows();}
    const sort = event.target.closest('[data-tm-sort]');if(sort){sortDirection=sortKey===sort.dataset.tmSort?-sortDirection:1;sortKey=sort.dataset.tmSort;page=1;renderRows();}
  });
  mount.addEventListener('change', event => {if(event.target.id==='tmFailover'){failover=event.target.checked;persist();document.getElementById('tmFailoverLabel').textContent=failover?'On':'Off';notify('Failover setting saved in this offline app.');}});
  modal.addEventListener('click', event => {if(editing&&(event.target===modal||event.target.closest('[data-tm-close]')))closeEditor();});
  modal.addEventListener('input', event => {if(!editing)return;const form=document.getElementById('tmForm');if(['body','communicationMode'].includes(event.target.name)){document.getElementById('tmCount').textContent=`${form.elements.body.value.length}/4500`;preview(form.elements.body.value,form.elements.communicationMode.value);}});
  modal.addEventListener('submit', event => {
    if(!editing||event.target.id!=='tmForm')return;event.preventDefault();
    const form=event.target, updated=rows.find(row=>row.id===editing);
    for(const name of ['eventType','recipientRole','communicationMode','schedule','code','subject','description','body'])updated[name]=form.elements[name].value;
    updated.disabled=form.elements.disabled.checked;persist();closeEditor();renderRows();notify('Template updated in this offline app.');
  });
  document.addEventListener('keydown', event=>{if(!editing)return;if(event.key==='Escape'){event.preventDefault();closeEditor();}if(event.key==='Tab'){const focusable=[...modal.querySelectorAll('button,input,select,textarea')].filter(e=>!e.disabled);const first=focusable[0],last=focusable.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}}});
  renderRows();
})();
