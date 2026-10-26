/* MIS hierarchy rules for the local design. Production must enforce these on the server. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.IneburaMisCore = factory();
})(typeof window !== 'undefined' ? window : globalThis, function () {
  'use strict';
  const copy = value => JSON.parse(JSON.stringify(value));
  const unique = values => [...new Set(Array.isArray(values) ? values : [])];
  function userRole(value) {
    const key = String(value || '').toLowerCase().replace(/[^a-z]/g, '');
    return ({mis:'mis',misuser:'mis',mismanager:'mis-manager',admin:'admin',agent:'agent',collectionagent:'agent',agentcummanager:'agent-manager',agentmanager:'agent-manager'})[key] || key;
  }
  const isActive = user => !!user && String(user.status || '').toLowerCase() === 'active';
  const isAssignee = user => ['agent', 'agent-manager'].includes(userRole(user?.role));
  const getUser = (state, id) => state.users.find(user => user.id === id);
  function requireAdmin(actor) {
    if (userRole(actor?.role) !== 'admin' || !isActive(actor)) throw new Error('Only Admin can change users, mappings or invoice assignments.');
  }
  function cleanAccess(access) {
    if (access?.mode === 'client') return {mode:'client', clientId:String(access.clientId || '')};
    if (access?.mode === 'subclients' || access?.mode === 'assignees') {
      const primary = access.mode === 'subclients' ? 'subclientIds' : 'assigneeIds';
      const secondary = access.mode === 'subclients' ? 'assigneeIds' : 'subclientIds';
      // An absent/empty secondary is unrestricted. A malformed restriction must
      // never be silently converted into that unrestricted choice.
      if (access[secondary] !== undefined && !Array.isArray(access[secondary])) return null;
      const result = {mode:access.mode, [primary]:unique(access[primary])};
      const selected = unique(access[secondary]);
      if (selected.length) result[secondary] = selected;
      return result;
    }
    return null;
  }
  function validateAccess(state, access) {
    if (!access || !['client','subclients','assignees'].includes(access.mode)) throw new Error('Select an access mode.');
    if (access.mode === 'client' && !state.clients.some(client => client.id === access.clientId)) throw new Error('Select one client.');
    const validSubclients = ids => Array.isArray(ids) && ids.every(id => state.subclients.some(sub => sub.id === id));
    const validAssignees = ids => Array.isArray(ids) && ids.every(id => isActive(getUser(state,id)) && isAssignee(getUser(state,id)));
    if (access.mode === 'subclients') {
      if (!validSubclients(access.subclientIds) || !access.subclientIds.length) throw new Error('Select at least one valid subclient.');
      if (access.assigneeIds !== undefined && !validAssignees(access.assigneeIds)) throw new Error('Select valid active Agents or Agent cum Managers for the secondary filter, or choose all assignees.');
    }
    if (access.mode === 'assignees') {
      if (!validAssignees(access.assigneeIds) || !access.assigneeIds.length) throw new Error('Select at least one active Agent or Agent cum Manager.');
      if (access.subclientIds !== undefined && !validSubclients(access.subclientIds)) throw new Error('Select valid subclients for the secondary filter, or choose all subclients.');
    }
  }
  function ownInvoices(state, user) {
    const access = cleanAccess(user.access);
    try {validateAccess(state, access);} catch (_) {return [];}
    return state.invoices.filter(invoice => access.mode === 'client' ? invoice.clientId === access.clientId
      : (!access.subclientIds?.length || access.subclientIds.includes(invoice.subclientId))
        && (!access.assigneeIds?.length || access.assigneeIds.includes(invoice.assigneeId)));
  }
  function visibleInvoices(state, userId) {
    const user = getUser(state, userId);
    if (!isActive(user)) return [];
    let invoices = [];
    if (userRole(user.role) === 'mis') invoices = ownInvoices(state, user);
    if (userRole(user.role) === 'mis-manager') {
      const ids = new Set(state.users.filter(person => isActive(person) && userRole(person.role) === 'mis' && person.managerId === user.id).flatMap(person => ownInvoices(state, person).map(invoice => invoice.id)));
      invoices = state.invoices.filter(invoice => ids.has(invoice.id));
    }
    return [...new Map(invoices.map(invoice => [invoice.id, invoice])).values()].map(copy);
  }
  function scopeSummary(state, userId) {
    const user = getUser(state, userId);
    if (!isActive(user)) return 'No active MIS access';
    if (userRole(user.role) === 'mis-manager') {
      const count = state.users.filter(person => userRole(person.role) === 'mis' && isActive(person) && person.managerId === user.id).length;
      return `Combined scope of ${count} reporting MIS user${count === 1 ? '' : 's'}`;
    }
    const access = cleanAccess(user.access);
    try {validateAccess(state, access);} catch (_) {return 'Access mapping incomplete';}
    if (access.mode === 'client') return `Complete client: ${state.clients.find(client => client.id === access.clientId)?.name}`;
    const subclientNames = ids => ids.map(id => {const sub = state.subclients.find(item => item.id === id);return `${state.clients.find(client => client.id === sub.clientId)?.name} / ${sub.name}`;}).join(', ');
    const assigneeNames = ids => ids.map(id => getUser(state,id)?.name).join(', ');
    if (access.mode === 'subclients') return `Selected subclients: ${subclientNames(access.subclientIds)} · ${access.assigneeIds?.length ? `Selected users: ${assigneeNames(access.assigneeIds)} · Personally assigned invoices only` : 'All assignees within selected subclients'}`;
    return `Selected users: ${assigneeNames(access.assigneeIds)} · ${access.subclientIds?.length ? `Selected subclients: ${subclientNames(access.subclientIds)}` : 'All subclients across clients'} · Personally assigned invoices only`;
  }
  function finish(state, type, actor, details) {
    state.revision = (state.revision || 0) + 1;
    state.audit = [...(state.audit || []), {type,actorId:actor.id || 'admin',at:new Date().toISOString(),...details}];
    return state;
  }
  function saveUser(state, candidate, actor) {
    requireAdmin(actor);
    const next = copy(state), user = copy(candidate);
    const existing = getUser(next, user.id);
    const roles = ['admin','mis','mis-manager','agent','agent-manager','manager','supervisor','telecaller','backend','pdcops','pdcagent','customer','clientho','clientcontroller','kas','kam','actionowner'];
    if (!roles.includes(userRole(user.role))) throw new Error('Select a valid role.');
    if (!user.id || !user.name?.trim() || !user.email?.trim()) throw new Error('Name and email are required.');
    if (next.users.some(item => item.id !== user.id && item.email.toLowerCase() === user.email.toLowerCase())) throw new Error('This email is already used by another user.');
    if (existing && userRole(existing.role) !== userRole(user.role)) throw new Error('Role changes need team clarification. Create a separate user for this preview.');
    if (existing && existing.status !== user.status) throw new Error('Use the Suspend, Delete or Reactivate action to change status.');
    if (!existing && !isActive(user)) throw new Error('New preview users must be active.');
    if (userRole(user.role) === 'mis') {
      const manager = getUser(next, user.managerId);
      if (!isActive(manager) || userRole(manager.role) !== 'mis-manager' || manager.id === user.id) throw new Error('Select exactly one active MIS Manager.');
      user.access = cleanAccess(user.access);
      validateAccess(next, user.access);
    } else {
      delete user.access;
      delete user.managerId;
    }
    if (existing) next.users[next.users.findIndex(item => item.id === user.id)] = user;
    else next.users.push(user);
    return finish(next,existing ? 'user-updated' : 'user-created',actor,{userId:user.id,before:existing || null,after:user});
  }
  function transitionUser(state, userId, action, replacementId, actor) {
    requireAdmin(actor);
    const next = copy(state), user = getUser(next,userId);
    if (!user || user.status === 'Deleted') throw new Error('User is no longer available. Reload the list.');
    const role = userRole(user.role);
    if (role === 'mis') throw new Error('MIS User suspension, deletion and reactivation rules are pending team clarification.');
    if (!['suspend','delete','reactivate'].includes(action)) throw new Error('Unsupported user action.');
    if (action === 'reactivate') {
      if (!isAssignee(user) || user.status !== 'Suspended') throw new Error('Reactivation is available for suspended Agents and Agent cum Managers.');
      user.status = 'Active';
      return finish(next,'user-reactivated',actor,{userId});
    }
    if (action === 'suspend' && !isActive(user)) throw new Error('Only active users can be suspended.');
    const before = copy(user);
    if (isAssignee(user) || role === 'mis-manager') {
      const replacement = getUser(next,replacementId);
      if (!replacement || replacement.id === userId || !isActive(replacement) || (role === 'mis-manager' ? userRole(replacement.role) !== 'mis-manager' : !isAssignee(replacement))) throw new Error(role === 'mis-manager' ? 'Select an active replacement MIS Manager.' : 'Select an active fallback Agent or Agent cum Manager.');
      if (role === 'mis-manager') next.users.filter(person => userRole(person.role) === 'mis' && person.managerId === userId).forEach(person => {person.managerId = replacementId;});
      else {
        next.invoices.filter(invoice => invoice.assigneeId === userId).forEach(invoice => {invoice.assigneeId = replacementId;});
        next.users.filter(person => userRole(person.role) === 'mis' && ['assignees','subclients'].includes(person.access?.mode) && Array.isArray(person.access.assigneeIds) && person.access.assigneeIds.includes(userId)).forEach(person => {
          const access = {...person.access,assigneeIds:unique(person.access.assigneeIds.map(id => id === userId ? replacementId : id))};
          // Retain any subclient constraint, including a malformed one needing
          // Admin repair, so fallback can never turn it into unrestricted access.
          person.access = cleanAccess(access) || access;
        });
      }
    }
    user.status = action === 'delete' ? 'Deleted' : 'Suspended';
    return finish(next,`user-${action === 'delete' ? 'deleted' : 'suspended'}`,actor,{userId,replacementId:replacementId || null,before,after:copy(user)});
  }
  function reassignInvoice(state, invoiceId, assigneeId, actor) {
    requireAdmin(actor);
    const next = copy(state), invoice = next.invoices.find(item => item.id === invoiceId), assignee = getUser(next,assigneeId);
    if (!invoice) throw new Error('Invoice no longer exists.');
    if (!isActive(assignee) || !isAssignee(assignee)) throw new Error('Select an active Agent or Agent cum Manager.');
    const previousAssigneeId = invoice.assigneeId;
    invoice.assigneeId = assigneeId;
    return finish(next,'invoice-reassigned',actor,{invoiceId,previousAssigneeId,assigneeId});
  }
  return Object.freeze({userRole,isActive,isAssignee,cleanAccess,validateAccess,visibleInvoices,scopeSummary,saveUser,transitionUser,reassignInvoice,requireAdmin});
});
