/* Isolated synthetic MIS preview data; never reads or writes production records. */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory(require('./mis-access-core.js'));
  else root.IneburaMisStore = factory(root.IneburaMisCore,root);
})(typeof window !== 'undefined' ? window : globalThis, function (core, browser) {
  'use strict';
  const KEY = 'ineburaMisHierarchy:v1';
  function seed() {
    const users = [
      {id:'agent-a',name:'Agent One',email:'agent.one@example.test',role:'AGENT',status:'Active',branch:'Gurugram',reportingTo:'Rajneesh ACM'},
      {id:'agent-b',name:'Agent Two',email:'agent.two@example.test',role:'AGENT',status:'Active',branch:'Gurugram',reportingTo:'Rajneesh ACM'},
      {id:'acm-c',name:'Rajneesh ACM',email:'rajneesh.acm@example.test',role:'AGENTCUMMANAGER',status:'Active',branch:'Gurugram',reportingTo:'Supervisor'},
      {id:'mgr-north',name:'MIS Manager North',email:'mis.manager.north@example.test',role:'MIS MANAGER',status:'Active',branch:'Gurugram'},
      {id:'mgr-west',name:'MIS Manager West',email:'mis.manager.west@example.test',role:'MIS MANAGER',status:'Active',branch:'Gurugram'},
      {id:'mis-client',name:'MIS Client',email:'mis.client@example.test',role:'MIS',status:'Active',branch:'Gurugram',managerId:'mgr-north',access:{mode:'client',clientId:'client-tc'}},
      {id:'mis-sub',name:'MIS North',email:'mis.north@example.test',role:'MIS',status:'Active',branch:'Gurugram',managerId:'mgr-north',access:{mode:'subclients',subclientIds:['tc-north']}},
      {id:'mis-agent',name:'MIS Portfolio',email:'mis.portfolio@example.test',role:'MIS',status:'Active',branch:'Gurugram',managerId:'mgr-west',access:{mode:'assignees',assigneeIds:['agent-a','acm-c']}},
      {id:'mis-west',name:'MIS West',email:'mis.west@example.test',role:'MIS',status:'Active',branch:'Gurugram',managerId:'mgr-west',access:{mode:'subclients',subclientIds:['tc-west']}},
      {id:'customer-1',name:'Customer Sahrudaya',email:'customer.sahrudaya@example.test',role:'CUSTOMER',status:'Active',branch:'Gurugram'},
      {id:'kam-1',name:'KAM One',email:'kam.one@example.test',role:'KAM',status:'Active',branch:'Gurugram',reportingTo:'KAS One'},
    ];
    const clients = [{id:'client-tc',name:'TestClient Pvt Ltd'},{id:'client-apollo',name:'Apollo'}];
    const subclients = [{id:'tc-north',name:'North',clientId:'client-tc'},{id:'tc-west',name:'West',clientId:'client-tc'},{id:'apollo-north',name:'North',clientId:'client-apollo'},{id:'apollo-south',name:'South',clientId:'client-apollo'}];
    const invoices = [
      ['inv-1','MIS-TC-001','client-tc','tc-north','agent-a','Customer Alpha',125000],
      ['inv-2','MIS-TC-002','client-tc','tc-west','agent-a','Customer Beta',84000],
      ['inv-3','MIS-TC-003','client-tc','tc-north','agent-b','Customer Gamma',56000],
      ['inv-4','MIS-TC-004','client-tc','tc-west','acm-c','Customer Delta',99000],
      ['inv-5','MIS-AP-005','client-apollo','apollo-north','agent-a','Customer Epsilon',76000],
      ['inv-6','MIS-AP-006','client-apollo','apollo-south','agent-b','Customer Zeta',62000],
      ['inv-7','MIS-AP-007','client-apollo','apollo-south','acm-c','Customer Eta',47000],
    ].map((row,index) => ({id:row[0],invoiceNo:row[1],clientId:row[2],subclientId:row[3],assigneeId:row[4],customerName:row[5],outstanding:row[6],invoiceDate:`2026-10-${String(index+1).padStart(2,'0')}`}));
    return {version:1,revision:0,users,clients,subclients,invoices,audit:[]};
  }
  function createStore(storage, dispatch = () => {}) {
    function getState() {
      const raw = storage.getItem(KEY);
      if (raw == null) {const initial = seed();storage.setItem(KEY,JSON.stringify(initial));return initial;}
      let state;
      try {state = JSON.parse(raw);} catch (_) {throw new Error('MIS preview data could not be read. Stored data was not overwritten.');}
      if (state?.version !== 1 || !Number.isInteger(state.revision) || !['users','clients','subclients','invoices'].every(key => Array.isArray(state[key]))) throw new Error('MIS preview data is incompatible. Stored data was not overwritten.');
      return state;
    }
    function update(operation, expectedRevision) {
      const current = getState();
      if (expectedRevision != null && current.revision !== expectedRevision) throw new Error('The MIS data changed in another view. Close this dialog and reopen it before saving.');
      const next = operation(current);
      storage.setItem(KEY,JSON.stringify(next));
      dispatch(next);
      return next;
    }
    return {
      KEY,getState,
      saveUser:(user,actor,revision) => update(state => core.saveUser(state,user,actor),revision),
      transitionUser:(id,action,replacement,actor,revision) => update(state => core.transitionUser(state,id,action,replacement,actor),revision),
      reassignInvoice:(id,assignee,actor,revision) => update(state => core.reassignInvoice(state,id,assignee,actor),revision),
    };
  }
  if (!browser) return Object.freeze({KEY,seed,createStore});
  const api = createStore(browser.localStorage, () => browser.dispatchEvent(new CustomEvent('inebura:mis-change')));
  api.actor = () => {
    const id = new URLSearchParams(browser.location.search).get('previewActor');
    if (id) {const person = api.getState().users.find(user => user.id === id);return person || {id,role:'unknown',status:'Inactive'};}
    return {id:'admin-preview',role:browser.document.body.dataset.adminRole || browser.localStorage.getItem('activeUserRole') || 'unknown',status:'Active'};
  };
  browser.IneburaMisStore = Object.freeze(api);
  return browser.IneburaMisStore;
});
