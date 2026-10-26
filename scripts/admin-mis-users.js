/* Existing User Setup, extended with MIS hierarchy in an isolated sample workspace. */
(() => {
  'use strict';
  const params = new URLSearchParams(location.search);
  if (params.get('module') !== 'user-setup') return;
  const core = window.IneburaMisCore, store = window.IneburaMisStore;
  if (!core || !store) return;
  const mount = document.getElementById('adminPageContent'), modal = document.getElementById('adminModal');
  const view = params.get('view') || 'create-user';
  if (view === 'bulk-user' && !params.has('previewActor')) return;
  if (!mount || !modal) return;
  const esc = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const money = value => `₹${Number(value || 0).toLocaleString('en-IN')}`;
  const roleName = role => ({mis:'MIS User','mis-manager':'MIS Manager',agent:'Agent','agent-manager':'Agent cum Manager',customer:'Customer',kam:'KAM'})[core.userRole(role)] || role;
  let query = '', roleFilter = 'ALL', draft = null, step = 1, draftRevision = null, pending = null;
  const roleTypes = {Admin:['ADMIN'],'Support Role':['MIS','MIS MANAGER','BACKEND','PDC OPS','PDC AGENT'],'Customer Role':['CUSTOMER'],'View Role':['CLIENT HO','CLIENT CONTROLLER','KAS','KAM','ACTION OWNER'],'Operational Role':['SUPERVISOR','MANAGER','AGENTCUMMANAGER','AGENT','TELECALLER']};
  const notify = message => {const toast = document.getElementById('adminToast');toast.textContent=message;toast.classList.add('is-visible');setTimeout(()=>toast.classList.remove('is-visible'),4500);};
  const admin = () => {try {core.requireAdmin(store.actor());return true;} catch (_) {return false;}};
  const state = () => store.getState();
  const close = () => {modal.classList.remove('is-open');modal.setAttribute('aria-hidden','true');modal.innerHTML='';pending=null;};
  function open(title,body,footer='',className='') {
    modal.innerHTML=`<section class="adminModalCard opModal misDialog ${className}" role="dialog" aria-modal="true" aria-label="${esc(title)}"><header><h2>${esc(title)}</h2><button type="button" class="adminModalClose" data-mis-action="close" aria-label="Close modal"><i class="bi bi-x-lg" aria-hidden="true"></i></button></header><div class="opModalBody">${body}<p class="misFormError" id="misFormError" role="alert" hidden></p></div>${footer?`<footer>${footer}</footer>`:''}</section>`;
    modal.classList.add('is-open');modal.setAttribute('aria-hidden','false');
    requestAnimationFrame(()=>modal.querySelector('input:not(:disabled),select:not(:disabled),button')?.focus());
  }
  const cancel = '<button type="button" class="adminSecondary" data-mis-action="close">Cancel</button>';
  const opts = (items,value,empty='Select') => `<option value="">${empty}</option>${items.map(item=>`<option value="${esc(item.id)}" ${item.id===value?'selected':''}>${esc(item.name)}</option>`).join('')}`;
  function field(label,name,value='',type='text',required=true) {
    return `<label><span>${esc(label)}${required?' *':''}</span><input name="${name}" type="${type}" value="${esc(value)}" ${required?'required':''}></label>`;
  }
  function renderRows() {
    const body=document.getElementById('misUserRows');if(!body)return;
    const s=state();const people=s.users.filter(user=>user.status!=='Deleted' && (roleFilter==='ALL'||core.userRole(user.role)===roleFilter) && `${user.name} ${user.email} ${roleName(user.role)}`.toLowerCase().includes(query.toLowerCase()));
    body.innerHTML=people.map(user=>{
      const mis=['mis','mis-manager'].includes(core.userRole(user.role));
      const manager=s.users.find(person=>person.id===user.managerId);
      return `<tr><td><strong>${esc(user.name)}</strong><small class="misEmail">${esc(user.email)}</small></td><td><span class="opRolePill">${esc(roleName(user.role))}</span></td><td>${esc(user.branch||'Gurugram')}</td><td>${esc(manager?.name||user.reportingTo||'—')}</td><td class="misScopeCell">${mis?`<button type="button" class="misTextButton" data-mis-action="access" data-id="${esc(user.id)}">${esc(core.scopeSummary(s,user.id))}</button>`:'—'}</td><td><span class="misStatus ${user.status==='Active'?'is-active':''}">${esc(user.status)}</span></td><td><div class="opRowActions misRowActions"><button type="button" class="adminSecondary" data-mis-action="edit" data-id="${esc(user.id)}"><i class="bi bi-pencil" aria-hidden="true"></i>Edit</button><button type="button" class="opPasswordButton" data-mis-action="password" data-id="${esc(user.id)}"><i class="bi bi-key" aria-hidden="true"></i>Pwd</button><button type="button" class="adminSecondary" data-mis-action="send-creds" data-id="${esc(user.id)}"><i class="bi bi-envelope" aria-hidden="true"></i>Send Creds</button>${core.isAssignee(user)&&user.status==='Suspended'?`<button type="button" class="adminSecondary" data-mis-action="reactivate" data-id="${esc(user.id)}">Reactivate</button>`:user.status==='Active'?`<button type="button" class="adminSecondary" data-mis-action="suspend" data-id="${esc(user.id)}" ${core.userRole(user.role)==='mis'?'disabled title="MIS User lifecycle rules need team clarification"':''}>Suspend</button>`:''}<button type="button" class="opDangerButton" data-mis-action="delete" data-id="${esc(user.id)}" ${core.userRole(user.role)==='mis'?'disabled title="MIS User lifecycle rules need team clarification"':''}>Delete</button></div></td></tr>`;
    }).join('')||'<tr><td colspan="7">No users match these filters.</td></tr>';
    document.getElementById('misUserCount').textContent=`${people.length} user${people.length===1?'':'s'}`;
  }
  function render() {
    if (!admin()) {mount.innerHTML='<main class="adminPage"><section class="adminPanel misDenied"><h1>Admin access required</h1><p>Only Admin can create users or change reporting, mappings and lifecycle settings.</p><a class="adminSecondary" href="reports.html?misUser='+esc(params.get('previewActor')||'')+'">View permitted reports</a></section></main>';return;}
    mount.innerHTML=`<main class="adminPage adminRuntimePage opPage"><section class="adminPageHero"><div><h1>User Setup</h1><span>Manage user accounts, reporting relationships and MIS access.</span></div></section><section class="adminSourceWorkspace opWorkspace opUserWorkspace"><header class="adminWorkspaceHeader opWorkspaceHeader"><nav class="adminRuntimeTabs opTabs" aria-label="Page sections"><a class="is-active" href="admin.html?module=user-setup&view=create-user">User Creation</a><a href="admin.html?module=user-setup&view=bulk-user">User Bulk Creation</a></nav></header><div class="adminWorkspaceBody opWorkspaceBody misWorkspace"><div class="misSampleNote"><i class="bi bi-info-circle" aria-hidden="true"></i>Sample workspace · MIS mappings and sample invoice assignments are saved in this browser.</div><div class="opUserToolbar"><h2>Team Members</h2><label class="opRoleFilter"><span>Role</span><select id="misRoleFilter" aria-label="Filter users by role"><option value="ALL">ALL</option>${[...new Set(Object.values(roleTypes).flat().map(core.userRole))].map(role=>`<option value="${role}" ${roleFilter===role?'selected':''}>${esc(roleName(role))}</option>`).join('')}</select></label><label class="opSearch"><i class="bi bi-search" aria-hidden="true"></i><input id="misUserSearch" aria-label="Search users" placeholder="Search name, email or role…" value="${esc(query)}"></label><button type="button" class="adminPrimary" data-mis-action="create"><i class="bi bi-plus-circle" aria-hidden="true"></i>Create New</button></div><div class="misListTools"><span id="misUserCount"></span><button type="button" class="misTextButton" data-mis-action="assignments">Review sample invoice assignments</button></div><div class="adminTableWrap"><table class="adminTable misUsersTable"><thead><tr><th>Name and email</th><th>Role</th><th>Branch</th><th>Reporting To</th><th>MIS Access</th><th>Status</th><th>Actions</th></tr></thead><tbody id="misUserRows"></tbody></table></div><p class="misFootnote">MIS Users and MIS Managers can view permitted data and download reports. Hierarchy controls data visibility; existing module and action permissions continue to apply.</p></div></section></main>`;
    renderRows();
  }
  function readDraft() {
    const form=document.getElementById('misUserForm');if(!form)return;
    new FormData(form).forEach((value,key)=>{draft[key]=value;});
    if(step===1)draft.sendLoginDetails=!!form.querySelector('[name="sendLoginDetails"]')?.checked;
    if(step===2&&['subclients','assignees'].includes(draft.mode)) {
      draft.subclientIds=[...form.querySelectorAll('[data-mis-map="subclients"]:checked')].map(input=>input.value);
      draft.assigneeIds=[...form.querySelectorAll('[data-mis-map="assignees"]:checked')].map(input=>input.value);
    }
  }
  function begin(id) {
    const s=state(),user=s.users.find(person=>person.id===id);
    if(user?.status==='Deleted')throw new Error('User no longer exists.');
    draft={id:user?.id||`user-${crypto.randomUUID()}`,existing:!!user,status:user?.status||'Active',firstName:user?.firstName||user?.name.split(' ')[0]||'',lastName:user?.lastName||user?.name.split(' ').slice(1).join(' ')||'',email:user?.email||'',phone1:user?(user.phone1||'9876543210'):'',phone2:user?.phone2||'',username:user?.username||user?.email.split('@')[0]||'',sendLoginDetails:!!user?.sendLoginDetails,role:user?.role||'',roleType:user?Object.keys(roleTypes).find(type=>roleTypes[type].includes(user.role))||'Support Role':'',branch:user?.branch||'',managerId:user?.managerId||'',reportingTo:user?.reportingTo||'',mode:user?.access?.mode||'',clientId:user?.access?.clientId||'',subclientIds:user?.access?.subclientIds||[],assigneeIds:user?.access?.assigneeIds||[]};
    const secondaryKey=draft.mode==='assignees'?'subclientIds':'assigneeIds';
    const malformedSecondary=['assignees','subclients'].includes(draft.mode)&&user?.access?.[secondaryKey]!==undefined&&!Array.isArray(user.access[secondaryKey]);
    if(!Array.isArray(draft.subclientIds))draft.subclientIds=[];
    if(!Array.isArray(draft.assigneeIds))draft.assigneeIds=[];
    draft.secondaryChoice=malformedSecondary||draft[secondaryKey].length?'restricted':'all';
    draftRevision=s.revision;step=1;wizard();
  }
  function wizard() {
    const s=state();let body;
    if(step===1)body=`<div class="opInfo"><i class="bi bi-info-circle" aria-hidden="true"></i><p>Create MIS Managers before assigning MIS users to them. Set the reporting manager and data access on step two.</p></div><button type="button" class="misTextButton misContactPicker" data-mis-action="contact-picker"><i class="bi bi-square" aria-hidden="true"></i>Use Existing Contact Person</button><form id="misUserForm" class="opFormGrid"><label class="misLoginDetails is-wide"><input type="checkbox" name="sendLoginDetails" ${draft.sendLoginDetails?'checked':''}><span>Send Login Details<small>Send login credentials to the user’s email. Email delivery is simulated in this sample workspace.</small></span></label>${field('FIRST NAME','firstName',draft.firstName)}${field('LAST NAME','lastName',draft.lastName,'text',false)}${field('EMAIL','email',draft.email,'email')}${field('PHONE 1','phone1',draft.phone1,'tel')}${field('PHONE 2','phone2',draft.phone2,'tel',false)}${field('USER NAME','username',draft.username)}</form>`;
    else {
      const isMis=core.userRole(draft.role)==='mis',isManager=core.userRole(draft.role)==='mis-manager';
      const available=roleTypes[draft.roleType]||[];
      const branches=[...new Set(['Gurugram','Noida',...s.users.map(user=>user.branch).filter(Boolean)])];
      body=`<form id="misUserForm" class="opFormGrid"><label><span>ROLE TYPE *</span><select name="roleType" data-mis-field="roleType" required ${draft.existing?'disabled':''}>${opts(Object.keys(roleTypes).map(name=>({id:name,name})),draft.roleType,'Select Role Type')}</select></label><label><span>ROLE *</span><select name="role" data-mis-field="role" required ${draft.existing||!draft.roleType?'disabled':''}>${opts(available.map(name=>({id:name,name:roleName(name)})),draft.role,draft.roleType?'Select Role':'Select a Role Type first')}</select></label><label><span>BRANCH *</span><select name="branch" required>${opts(branches.map(name=>({id:name,name})),draft.branch,'Select Branch')}</select></label><div class="misBranchSpacer" aria-hidden="true"></div>${isMis?`<label class="is-wide"><span>REPORTING TO *</span><select name="managerId" required aria-label="Reporting MIS Manager">${opts(s.users.filter(user=>core.userRole(user.role)==='mis-manager'&&core.isActive(user)),draft.managerId,'Select MIS Manager')}</select></label><fieldset class="misAccessFieldset is-wide"><legend>MIS data access</legend><p>Choose how to define access. Add a second filter to narrow it.</p><div class="misScopeGrid"><label><span>ACCESS MODE *</span><select name="mode" data-mis-field="mode" required>${opts([{id:'client',name:'Complete client'},{id:'subclients',name:'Selected subclients'},{id:'assignees',name:'Selected Agents / Agent cum Managers'}],draft.mode,'Select access mode')}</select></label>${mappingFields(s)}</div></fieldset>`:isManager?'<p class="is-wide misHint">MIS Managers inherit only the combined access of their reporting MIS users. No separate client, subclient or agent mapping is assigned here.</p>':draft.role?`<label class="is-wide"><span>REPORTING TO</span><input name="reportingTo" value="${esc(draft.reportingTo)}"></label>`:'<label class="is-wide"><span>REPORTING TO</span><select disabled><option>Select a Role first</option></select></label>'}${isMis||isManager?'<p class="is-wide misPermissionNote"><i class="bi bi-eye" aria-hidden="true"></i>View portfolios and details · Download permitted reports<br><small>Existing module and action permissions continue to apply.</small></p>':''}${draft.existing?'<p class="is-wide misFootnote">Role changes are pending team clarification. Existing roles cannot be changed in this preview.</p>':''}</form>`;
    }
    open(`${draft.existing?'Edit':'Create'} User - Step ${step} of 2`,body,step===1?`${cancel}<button type="button" class="adminPrimary" data-mis-action="next">Next</button>`:`<button type="button" class="adminSecondary opPrevious" data-mis-action="previous">Previous</button>${cancel}<button type="button" class="adminPrimary" data-mis-action="save">Save</button>`,'opUserModal');
    if(step===2)updateMappingControls();
  }
  const mapKey = kind => kind==='assignees'?'assigneeIds':'subclientIds';
  const primaryKind = () => draft.mode==='assignees'?'assignees':'subclients';
  function mapItems(s,kind,selected) {
    const items=kind==='assignees'
      ? s.users.filter(user=>core.isActive(user)&&core.isAssignee(user)).map(user=>({id:user.id,name:user.name,detail:roleName(user.role)}))
      : s.subclients.map(sub=>({id:sub.id,name:`${s.clients.find(client=>client.id===sub.clientId)?.name||sub.clientId} / ${sub.name}`}));
    for(const id of selected)if(!items.some(item=>item.id===id)) {
      const prior=kind==='assignees'?s.users.find(user=>user.id===id):null;
      items.push({id,name:prior?.name||`Unavailable selection (${id})`,detail:'No longer eligible — remove this selection.'});
    }
    return items;
  }
  function multiSelect(label,kind,items,selected,placeholder,secondary=false) {
    const names=items.filter(item=>selected.includes(item.id)).map(item=>item.name);
    const level=secondary?'secondary':'primary',id=secondary?'misSecondaryMapping':'misPrimaryMapping';
    const allLabel=kind==='subclients'?'All subclients for selected agents':'All agents in selected subclients';
    return `<div id="${id}" class="misMapField" data-mis-map-kind="${kind}" data-mis-map-level="${level}"><span id="${id}Label" class="misFieldLabel">${esc(label)}${secondary?' <small>Optional</small>':' *'}</span><details class="misMultiSelect" data-mis-map-kind="${kind}" data-mis-map-level="${level}" data-placeholder="${esc(placeholder)}"><summary aria-labelledby="${id}Label ${id}Value"><span id="${id}Value">${esc(names.length===1?names[0]:names.length?`${names.length} selected`:placeholder)}</span><i class="bi bi-chevron-down" aria-hidden="true"></i></summary><div class="misMultiMenu"><input type="search" data-mis-map-search placeholder="Search…" aria-label="Search ${esc(label.toLowerCase())}">${secondary?`<label class="misMapAll"><input type="checkbox" data-mis-map-all="${kind}" ${draft.secondaryChoice==='all'?'checked':''}><span>${allLabel}</span></label>`:''}<div class="misCheckList">${items.map(item=>`<label data-mis-option data-mis-option-id="${esc(item.id)}"><input type="checkbox" data-mis-map="${kind}" value="${esc(item.id)}" ${selected.includes(item.id)?'checked':''}><span>${esc(item.name)}${item.detail?`<small>${esc(item.detail)}</small>`:''}<small class="misOptionStatus"></small></span></label>`).join('')}</div><p class="misMultiEmpty" hidden>No matches.</p></div></details></div>`;
  }
  function reviewField() {
    return '<div class="misAccessReview is-wide" aria-live="polite"><strong>Access summary</strong><p id="misAccessReview"></p><span id="misAccessPreviewCount"></span></div>';
  }
  function mappingFields(s) {
    if(draft.mode==='client')return `<label><span>CLIENT *</span><select name="clientId" data-mis-field="clientId" required>${opts(s.clients,draft.clientId,'Select client')}</select></label><p class="misHint is-wide">Includes every subclient and all assignees for this client.</p>${reviewField()}`;
    if(['subclients','assignees'].includes(draft.mode)) {
      const agents=draft.mode==='assignees',first=agents?'assignees':'subclients',second=agents?'subclients':'assignees';
      return multiSelect(agents?'AGENTS / AGENT CUM MANAGERS':'SUBCLIENTS',first,mapItems(s,first,draft[mapKey(first)]),draft[mapKey(first)],agents?'Select agents / Agent cum Managers':'Select subclients')
        +multiSelect(agents?'LIMIT TO SUBCLIENTS':'LIMIT TO AGENTS / AGENT CUM MANAGERS',second,mapItems(s,second,draft[mapKey(second)]),draft[mapKey(second)],agents?'All subclients for selected agents':'All agents in selected subclients',true)
        +`<p class="misScopeHelp">${agents?'Select agents first, then optionally limit their invoices to subclients.':'Select subclients first, then optionally limit their invoices to agents.'} Both filters apply together. Agent cum Managers include personal assignments only.</p>`+reviewField();
    }
    return '<label><span>ACCESS SELECTION</span><select disabled><option>Select an access mode first</option></select></label>';
  }
  function filterMappingOptions(dropdown) {
    const term=dropdown.querySelector('[data-mis-map-search]')?.value.trim().toLowerCase()||'';
    const options=[...dropdown.querySelectorAll('[data-mis-option]')];
    options.forEach(option=>{option.hidden=option.dataset.misEligible==='false'||!option.textContent.toLowerCase().includes(term);});
    const empty=dropdown.querySelector('.misMultiEmpty');
    empty.hidden=options.some(option=>!option.hidden);
    empty.textContent=term?'No matches.':'No matching options for this selection.';
  }
  function updateMappingControls() {
    const form=document.getElementById('misUserForm');if(!form||step!==2||core.userRole(draft.role)!=='mis')return;
    const s=state(),first=primaryKind(),primary=draft[mapKey(first)];
    const related=new Set(s.invoices.filter(invoice=>primary.includes(first==='assignees'?invoice.assigneeId:invoice.subclientId)).map(invoice=>first==='assignees'?invoice.subclientId:invoice.assigneeId));
    for(const dropdown of form.querySelectorAll('.misMultiSelect')) {
      const kind=dropdown.dataset.misMapKind,secondary=dropdown.dataset.misMapLevel==='secondary',ids=draft[mapKey(kind)];
      const disabled=secondary&&!primary.length,summary=dropdown.querySelector('summary');
      summary.setAttribute('aria-disabled',String(disabled));summary.setAttribute('tabindex',disabled?'-1':'0');
      if(disabled){dropdown.open=false;dropdown.classList.add('is-disabled');}else dropdown.classList.remove('is-disabled');
      dropdown.querySelectorAll('input').forEach(input=>{input.disabled=disabled;});
      const selectedNames=[];
      for(const option of dropdown.querySelectorAll('[data-mis-option]')) {
        const input=option.querySelector('input[data-mis-map]'),selected=ids.includes(input.value);
        input.checked=selected;
        option.dataset.misEligible=String(!secondary||related.has(input.value)||selected);
        const status=option.querySelector('.misOptionStatus');
        if(status)status.textContent=secondary&&selected&&!related.has(input.value)?'Saved restriction · No current matching invoices':'';
        if(selected)selectedNames.push(input.nextElementSibling.firstChild.textContent);
      }
      const all=dropdown.querySelector('[data-mis-map-all]');if(all)all.checked=draft.secondaryChoice==='all';
      dropdown.querySelector('summary > span').textContent=disabled?(first==='assignees'?'Select agents first':'Select subclients first'):secondary&&draft.secondaryChoice==='all'?dropdown.dataset.placeholder:selectedNames.length===1?selectedNames[0]:selectedNames.length?`${selectedNames.length} selected`:secondary?'Choose All or select a restriction':dropdown.dataset.placeholder;
      filterMappingOptions(dropdown);
    }
    const review=document.getElementById('misAccessReview'),count=document.getElementById('misAccessPreviewCount');
    if(!review)return;
    if(draft.mode!=='client'&&draft.secondaryChoice==='restricted'&&!draft[mapKey(first==='assignees'?'subclients':'assignees')].length) {
      review.textContent='Select a restriction or explicitly choose All before saving.';count.textContent='';return;
    }
    const formError=document.getElementById('misFormError');
    if(formError?.textContent==='Select at least one restriction or explicitly choose All before saving.') {formError.textContent='';formError.hidden=true;}
    const candidate={id:draft.id,role:'MIS',status:'Active',managerId:draft.managerId,access:{mode:draft.mode,clientId:draft.clientId,subclientIds:draft.subclientIds,assigneeIds:draft.assigneeIds}};
    const preview={...s,users:[...s.users.filter(user=>user.id!==draft.id),candidate]};
    review.textContent=core.scopeSummary(preview,draft.id);
    const access=core.cleanAccess(candidate.access);
    try {core.validateAccess(preview,access);const total=core.visibleInvoices(preview,draft.id).length;count.textContent=`${total} matching sample invoice${total===1?'':'s'}`;}catch(_){count.textContent='Complete the required selections before saving.';}
  }
  function save() {
    const form=document.getElementById('misUserForm');if(!form.reportValidity())return;readDraft();
    const candidate={id:draft.id,name:`${draft.firstName} ${draft.lastName}`.trim(),firstName:draft.firstName,lastName:draft.lastName,email:draft.email,phone1:draft.phone1,phone2:draft.phone2,username:draft.username,sendLoginDetails:draft.sendLoginDetails,role:draft.role,status:draft.status,branch:draft.branch,reportingTo:draft.reportingTo,managerId:draft.managerId,access:{mode:draft.mode,clientId:draft.clientId,subclientIds:draft.subclientIds,assigneeIds:draft.assigneeIds}};
    if(['assignees','subclients'].includes(draft.mode)&&draft.secondaryChoice==='restricted'&&!draft[mapKey(primaryKind()==='assignees'?'subclients':'assignees')].length)throw new Error('Select at least one restriction or explicitly choose All before saving.');
    store.saveUser(candidate,store.actor(),draftRevision);close();render();notify('User and MIS mappings saved in the sample workspace.');
  }
  function access(id) {
    const s=state(),user=s.users.find(person=>person.id===id);if(!user)return;
    const invoices=core.visibleInvoices(s,id),reports=s.users.filter(person=>person.managerId===id&&core.userRole(person.role)==='mis');
    open(`${user.name} — permitted portfolio`,`<p class="misScopeSummary">${esc(core.scopeSummary(s,id))}</p>${reports.length?`<p>Reporting MIS users: ${reports.map(person=>esc(person.name)).join(', ')}</p>`:''}<p><strong>${invoices.length} unique invoices</strong> · Outstanding ${money(invoices.reduce((sum,invoice)=>sum+invoice.outstanding,0))}</p>${invoiceTable(s,invoices,false)}`,`<button type="button" class="adminSecondary" data-mis-action="close">Close</button><a class="adminPrimary" href="reports.html?misUser=${encodeURIComponent(id)}&report=mis-portfolio-preview">Open scoped report</a>`,'misPortfolioDialog');
  }
  function invoiceTable(s,invoices,reassign) {
    return `<div class="adminTableWrap"><table class="adminTable misPortfolioTable"><thead><tr><th>Invoice</th><th>Client / Subclient</th><th>Assigned to</th><th>Outstanding</th>${reassign?'<th>Action</th>':''}</tr></thead><tbody>${invoices.map(invoice=>`<tr><td><strong>${esc(invoice.invoiceNo)}</strong><small class="misEmail">${esc(invoice.customerName)}</small></td><td>${esc(s.clients.find(client=>client.id===invoice.clientId)?.name)} / ${esc(s.subclients.find(sub=>sub.id===invoice.subclientId)?.name)}</td><td>${esc(s.users.find(user=>user.id===invoice.assigneeId)?.name)}</td><td>${money(invoice.outstanding)}</td>${reassign?`<td><button type="button" class="adminSecondary" data-mis-action="reassign" data-id="${esc(invoice.id)}">Change assignee</button></td>`:''}</tr>`).join('')||`<tr><td colspan="${reassign?5:4}">No permitted invoices.</td></tr>`}</tbody></table></div>`;
  }
  function assignments() {const s=state();open('Sample invoice assignments','<p>Use these sample records to review how invoice reassignment changes MIS access. Production invoice allocation is handled through Invoice Master.</p>'+invoiceTable(s,s.invoices,true),'<button type="button" class="adminSecondary" data-mis-action="close">Close</button>','misPortfolioDialog');}
  function lifecycle(id,action) {
    const s=state(),user=s.users.find(person=>person.id===id);if(!user)throw new Error('User no longer exists.');
    const manager=core.userRole(user.role)==='mis-manager',agent=core.isAssignee(user);
    const replacements=s.users.filter(person=>person.id!==id&&core.isActive(person)&&(manager?core.userRole(person.role)==='mis-manager':core.isAssignee(person)));
    const mapped=s.users.filter(person=>manager?person.managerId===id:core.userRole(person.role)==='mis'&&['assignees','subclients'].includes(person.access?.mode)&&person.access.assigneeIds?.includes(id));
    pending={id,action,revision:s.revision};
    const title=`${action[0].toUpperCase()+action.slice(1)} ${user.name}`;
    const note=action==='reactivate'?'Existing MIS mappings will stay with the fallback agent. Admin must explicitly change a mapping to restore access to this user.':manager?'Select a replacement MIS Manager. Reporting MIS users move to that manager immediately.':agent?'Select a fallback Agent or Agent cum Manager. Assigned invoices and affected MIS mappings move to the fallback. Any saved subclient restrictions remain in place; unrestricted mappings include the fallback’s entire personal portfolio.':'This changes the selected sample user only.';
    open(title,`<p>${esc(note)}</p>${action!=='reactivate'&&(manager||agent)?`<form id="misLifecycleForm" class="opFormGrid"><label class="is-wide"><span>${manager?'REPLACEMENT MIS MANAGER':'FALLBACK AGENT'} *</span><select name="replacementId" required>${opts(replacements,'',replacements.length?'Select replacement':'No eligible replacement available')}</select></label></form><p class="misHint">Affected MIS users: ${mapped.length?mapped.map(person=>esc(person.name)).join(', '):'None currently mapped'}</p><div id="misReplacementImpact" aria-live="polite"></div>`:''}`,`${cancel}<button type="button" class="${action==='reactivate'?'adminPrimary':'opDangerButton'}" data-mis-action="confirm-lifecycle" ${action!=='reactivate'&&(manager||agent)&&!replacements.length?'disabled':''}>${action==='delete'?'Delete user':action==='suspend'?'Suspend user':'Reactivate user'}</button>`);
  }
  function reassign(id) {
    const s=state(),invoice=s.invoices.find(item=>item.id===id);pending={id,action:'reassign',revision:s.revision};
    open(`Reassign ${invoice.invoiceNo}`,`<p>MIS visibility follows the current assignee. This is an ordinary reassignment; existing MIS tags are not moved.</p><form id="misLifecycleForm" class="opFormGrid"><label class="is-wide"><span>NEW ASSIGNEE *</span><select name="replacementId" required>${opts(s.users.filter(person=>core.isActive(person)&&core.isAssignee(person)),invoice.assigneeId,'Select assignee')}</select></label></form>`,`${cancel}<button type="button" class="adminPrimary" data-mis-action="confirm-lifecycle">Reassign invoice</button>`);
  }
  function error(message) {const target=document.getElementById('misFormError');if(target){target.textContent=message;target.hidden=false;}else notify(message);}
  document.addEventListener('click',event=>{
    const button=event.target.closest('[data-mis-action]');if(!button)return;
    event.preventDefault();
    try {
      if(button.dataset.misAction==='close'){close();return;}
      core.requireAdmin(store.actor());
      const action=button.dataset.misAction,id=button.dataset.id;
      if(action==='create'||action==='edit')begin(id);
      if(action==='contact-picker') {
        readDraft();
        open('Existing Contact Persons',`<p class="misHint">Sample contacts for this design workspace.</p><div class="misCheckList">${[{id:'contact-a',name:'Aarav Mehta',email:'aarav.mehta@example.test'},{id:'contact-b',name:'Meera Shah',email:'meera.shah@example.test'}].map(person=>`<button type="button" class="misContactOption" data-mis-action="choose-contact" data-name="${esc(person.name)}" data-email="${esc(person.email)}">${esc(person.name)}<small>${esc(person.email)}</small></button>`).join('')}</div>`,'<button type="button" class="adminSecondary" data-mis-action="return-wizard">Back</button>');
      }
      if(action==='choose-contact') {const parts=button.dataset.name.split(' ');draft.firstName=parts.shift();draft.lastName=parts.join(' ');draft.email=button.dataset.email;draft.phone1='9876543210';draft.username=button.dataset.email.split('@')[0];wizard();}
      if(action==='return-wizard')wizard();
      if(action==='next'){const form=document.getElementById('misUserForm');if(!form.reportValidity())return;readDraft();step=2;wizard();}
      if(action==='previous'){readDraft();step=1;wizard();}
      if(action==='save')save();
      if(action==='password')open('Reset User Password',`<p class="misHint">Sample account only. This preview does not change login credentials.</p><form id="misPasswordForm" class="opFormGrid">${field('NEW PASSWORD','password','','password')}${field('CONFIRM PASSWORD','confirmPassword','','password')}</form>`,`${cancel}<button type="button" class="adminPrimary" data-mis-action="save-password">Update Password</button>`);
      if(action==='save-password') {const form=document.getElementById('misPasswordForm');if(!form.reportValidity())return;const values=new FormData(form);if(values.get('password')!==values.get('confirmPassword'))throw new Error('Passwords must match.');close();notify('Password reset simulated. No login credentials were changed.');}
      if(action==='send-creds')notify('Account invitation simulated. No email was sent.');
      if(action==='access')access(id);
      if(action==='assignments')assignments();
      if(action==='reassign')reassign(id);
      if(['suspend','delete','reactivate'].includes(action))lifecycle(id,action);
      if(action==='confirm-lifecycle') {
        const form=document.getElementById('misLifecycleForm');if(form&&!form.reportValidity())return;
        const replacement=form?new FormData(form).get('replacementId'):null;
        if(pending.action==='reassign')store.reassignInvoice(pending.id,replacement,store.actor(),pending.revision);
        else store.transitionUser(pending.id,pending.action,replacement,store.actor(),pending.revision);
        close();render();notify('Sample assignments and MIS access updated.');
      }
    }catch(err){error(err.message);}
  });
  document.addEventListener('change',event=>{
    if(event.target.id==='misRoleFilter'){roleFilter=event.target.value;renderRows();}
    if(event.target.matches('[data-mis-field]')) {
      readDraft();const key=event.target.dataset.misField;draft[key]=event.target.value;
      if(key==='roleType'){draft.role='';draft.managerId='';draft.reportingTo='';draft.mode='';}
      if(key==='role'){draft.managerId='';draft.reportingTo='';draft.mode='';}
      if(['roleType','role','mode'].includes(key)){draft.clientId='';draft.subclientIds=[];draft.assigneeIds=[];draft.secondaryChoice='all';}
      wizard();
    }
    if(event.target.matches('[data-mis-map]')) {
      readDraft();const dropdown=event.target.closest('.misMultiSelect');
      if(dropdown.dataset.misMapLevel==='secondary')draft.secondaryChoice='restricted';
      updateMappingControls();
    }
    if(event.target.matches('[data-mis-map-all]')) {
      readDraft();draft.secondaryChoice=event.target.checked?'all':'restricted';
      if(event.target.checked)draft[mapKey(event.target.dataset.misMapAll)]=[];
      updateMappingControls();
    }
    if(event.target.name==='replacementId'&&pending?.action!=='reassign') {
      const s=state(),replacement=s.users.find(person=>person.id===event.target.value),impact=document.getElementById('misReplacementImpact');
      if(impact)impact.textContent=replacement&&core.isAssignee(replacement)?`${replacement.name} currently holds ${s.invoices.filter(invoice=>invoice.assigneeId===replacement.id).length} invoices. Affected MIS mappings move to this user. Saved subclient restrictions continue to limit the visible portfolio.`:'';
    }
  });
  document.addEventListener('input',event=>{
    if(event.target.id==='misUserSearch'){query=event.target.value;renderRows();}
    if(event.target.matches('[data-mis-map-search]')) {
      filterMappingOptions(event.target.closest('.misMultiSelect'));
    }
  });
  document.addEventListener('submit',event=>{if(['misUserForm','misLifecycleForm','misPasswordForm'].includes(event.target.id)){event.preventDefault();}});
  window.addEventListener('storage',event=>{if(event.key===store.KEY||event.key===null){if(modal.classList.contains('is-open'))error('MIS data changed in another view. Close and reopen this dialog before saving.');render();}});
  window.IneburaMisAdmin=Object.freeze({handles:true,render});
  try {render();} catch(err) {mount.innerHTML=`<main class="adminPage"><h1>MIS preview unavailable</h1><p>${esc(err.message)}</p></main>`;}
})();
