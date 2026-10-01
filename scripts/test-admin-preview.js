/* No browser dependencies: exercise the actual preview boundary in a VM. */
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
function preview(search='?module=invoice-upload'){
  const events={},toast={textContent:'',classList:{add(){},remove(){}}};
  const context={window:{},location:{search},URLSearchParams,Map,setTimeout:()=>0,clearTimeout(){},document:{addEventListener(type,fn){(events[type]??=[]).push(fn);},getElementById(id){return id==='adminToast'?toast:null;}}};
  Object.defineProperty(context,'localStorage',{get(){throw Error('Persistent storage must not be accessed');}});
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'admin-preview.js'),'utf8'),context);
  function click(text,dataset={}){let prevented=false,stopped=false;const button={textContent:text,dataset,hasAttribute:()=>false};events.click[0]({target:{closest:()=>button},preventDefault(){prevented=true;},stopImmediatePropagation(){stopped=true;}});return {prevented,stopped,notice:toast.textContent};}
  return {context,events,click};
}
test('preview storage is isolated and memory only',()=>{const {context}=preview();const storage=context.window.IneburaAdminPreviewStorage;assert.equal(storage.getItem('unknown'),null);storage.setItem('key','value');assert.equal(storage.getItem('key'),'value');storage.removeItem('key');assert.equal(storage.getItem('key'),null);assert.equal(preview().context.window.IneburaAdminPreviewStorage.getItem('key'),null);});
test('terminal actions reach the local module simulation handlers',()=>{for(const label of ['Save Invoice','Upload','Update Password','Send OTP','Test Email','Send','Submit Ticket','Close Ticket','Queue Month-End','Run Purge Now']){const result=preview().click(label);assert.equal(result.prevented,false,label);assert.equal(result.stopped,false,label);}});
test('opening forms and navigating remain usable',()=>{for(const label of ['Create New','Bulk Upload','Add Template','Next','Cancel','Edit'])assert.equal(preview().click(label).prevented,false,label);});
test('local confirmation and strategy actions reach their renderers',()=>{assert.equal(preview().click('',{runtimeAction:'confirm-row-action'}).prevented,false);assert.equal(preview('?module=strategy-manager').click('Delete',{action:'delete'}).prevented,false);});
test('each route has one renderer owner',()=>{for(const [module,renderer] of [['dashboard','composed'],['user-setup','operational'],['change-password','specialized'],['invoice-upload','registry']])assert.equal(preview('?module='+module).context.window.IneburaAdminPage.renderer,renderer);});
