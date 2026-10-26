const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const XLSX=require('./vendor/xlsx.full.min.js');
const bridge=require('./reports-dunning.js');
const core=require('./reports-core.js');
const sandbox={window:{}};vm.runInNewContext(fs.readFileSync(__dirname+'/reports-data.js','utf8'),sandbox);
const references=JSON.parse(JSON.stringify(sandbox.window.IneburaReportsData));
const catalog=bridge.register(references);
assert.equal(catalog.length,19);assert.equal(references.length,19);
assert.equal(catalog.filter(r=>r.id==='dunning-letters').length,0);
assert.ok(!catalog.some(r=>r.id==='dunning-letter-tracker'));
assert.deepEqual(catalog.filter(r=>!r.live),references.filter(r=>r.id!=='dunning-letter-tracker'));
assert.equal(bridge.register(catalog).length,19,'registration is idempotent');
assert.deepEqual(bridge.register([{id:'dunning-letters'},{id:'dunning-letter-tracker'},{id:'other'}]),[{id:'other'}]);
let context={role:'client-admin',clientId:'c1',userId:'a1'};
const email=(id,status,stage,date,agent='a1')=>({id,status,to:['one@example.test','two@example.test'],letterSnapshot:{customer:{name:'=Literal customer',clientId:'c1',clientCode:'0001',customerCode:'00002',agentId:agent},stageNumber:stage,date,reference:'000'+id,invoices:[{id:'i'+id,invoiceNo:'00003',originalAmount:1200.5,dueDate:'2026-10-01',clientId:'c1',agentId:agent}]}});
const state={enabled:false,emails:[email(1,'sent',1,'2026-10-20'),email(2,'partial',4,'2026-10-27','a2'),email(3,'failed',2,'2026-10-21')]};
const api={getState:()=>structuredClone(state),getContext:()=>({...context})};
let report=bridge.resolve(api);assert.equal(report.rows.length,2,'history available while disabled; failed attempt omitted');
assert.equal(bridge.resolve(api,{start:new Date(2026,9,20),end:new Date(2026,9,20)}).rows.length,1);
const filtered=core.filterRows(report.rows,{6:'DL4'});assert.equal(filtered.length,1);
const book=bridge.workbook(XLSX,report,report.rows);
const bytes=XLSX.write(book,{type:'buffer',bookType:'xlsx'});
const read=XLSX.read(bytes,{type:'buffer',cellDates:false,cellNF:true});
const sheet=read.Sheets['Dunning Letters'];
assert.deepEqual(XLSX.utils.sheet_to_json(sheet,{header:1})[0],report.headers);
assert.equal(sheet.A2.t,'s');assert.equal(sheet.A2.v,'0001');
assert.equal(sheet.B2.v,'00002');assert.equal(sheet.D2.v,'00003');
assert.equal(sheet.C2.v,'=Literal customer');assert.equal(sheet.C2.f,undefined);
assert.equal(sheet.E2.t,'n');assert.equal(sheet.E2.v,1200.5);
assert.equal(sheet.F2.t,'n');assert.equal(XLSX.SSF.format(sheet.F2.z,sheet.F2.v),'2026-10-01');
assert.equal(XLSX.SSF.format(sheet.I2.z,sheet.I2.v),'2026-10-27');
assert.equal(sheet.J2.v,'one@example.test, two@example.test');
assert.equal(sheet.K1,undefined,'only agreed columns exported');
const single=bridge.workbook(XLSX,report,filtered).Sheets['Dunning Letters'];assert.equal(single['!ref'],'A1:J2');
assert.equal(bridge.workbook(XLSX,report,[]).Sheets['Dunning Letters']['!ref'],'A1:J1');
state.emails.push(email(4,'sent',5,'2026-10-28'));
assert.equal(bridge.resolve(api).rows.length,3,'each action reads fresh history');
context.role='agent';assert.throws(()=>bridge.resolve(api),/do not have access/);
context.role='supervisor';assert.throws(()=>bridge.resolve(api),/do not have access/);
context.role='mis-manager';assert.throws(()=>bridge.resolve(api),/do not have access/);
context.role='backend';assert.throws(()=>bridge.resolve(api),/do not have access/);
context.role='client-admin';context.clientId='other';assert.equal(bridge.resolve(api).rows.length,0);
context.clientId='';assert.throws(()=>bridge.resolve(api),/do not have access/);
assert.throws(()=>bridge.resolve(null),/could not load/);
assert.throws(()=>bridge.resolve(api,{start:new Date(2026,10,1),end:new Date(2026,9,1)}),/access/);
context.clientId='c1';assert.throws(()=>bridge.resolve(api,{start:new Date(2026,10,1),end:new Date(2026,9,1)}),/on or before/);
for(const legacy of ['dunning-letter-tracker','dunning-letters']) {
  context.role='client-admin';assert.deepEqual(bridge.legacyRoute(api,'?report='+legacy),{authorized:true,destination:'admin.html?module=module-configuration&view=dunning-letters'});
  assert.equal(bridge.legacyRoute(api,'?report='+legacy+'&misUser=test').authorized,false);
  for(const role of ['agent','supervisor','backend','mis','mis-manager']) {context.role=role;assert.deepEqual(bridge.legacyRoute(api,'?report='+legacy),{authorized:false,destination:''});}
}
assert.equal(bridge.legacyRoute(api,'?report=odm-report'),null);
assert.equal(bridge.legacyRoute(null,'?report=dunning-letters').authorized,false);
for(const role of ['client-admin','agent','supervisor','mis','mis-manager']) {
  context.role=role;let redirected='';const target={innerHTML:''};
  vm.runInNewContext(fs.readFileSync(__dirname+'/reports.js','utf8'),{window:{IneburaReportsDunning:bridge,IneburaDunning:api},location:{search:'?report=dunning-letter-tracker',replace:value=>redirected=value},document:{getElementById:id=>{assert.equal(id,'reportsApp');return target;}}});
  if(role==='client-admin') {assert.equal(redirected,'admin.html?module=module-configuration&view=dunning-letters');assert.match(target.innerHTML,/has moved/);}
  else {assert.equal(redirected,'');assert.match(target.innerHTML,/access unavailable/);assert.doesNotMatch(target.innerHTML,/invoice amount|REF-|00001/);}
}
const html=fs.readFileSync(__dirname+'/../pages/reports.html','utf8');assert.doesNotMatch(html,/Dunning Letters uses issued history/);
assert.ok(!fs.readdirSync(__dirname+'/../assets/reports/downloads').some(name=>/dunning/i.test(name)), 'download directory excludes Dunning resources');
for(const file of ['Reports Sample Data.xlsx','Reports Excel Layout Templates.xlsx']) {
  const book=XLSX.read(fs.readFileSync(__dirname+'/../outputs/reports-module-01a10b0c/'+file),{type:'buffer'});
  assert.equal(book.SheetNames.length,19);assert.ok(!book.SheetNames.some(name=>/dunning/i.test(name)));
}
console.log('Passed: 19 preserved reference reports, no Dunning selector/resource, guarded legacy redirects, Client Admin-only live history, date/column filters, disabled history, full/filtered/empty XLSX byte readback, literal text, numeric amounts and timezone-safe Excel dates.');
