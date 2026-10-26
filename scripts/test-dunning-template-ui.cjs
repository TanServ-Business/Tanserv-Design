/* Regression: Dunning templates can only be edited from Module Configuration. */
'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
test('old generic email-popup extension is inert for every Dunning stage',()=>{
 const window={};vm.runInNewContext(fs.readFileSync(require.resolve('./dunning-template-ui.js'),'utf8'),{window});
 for(const stage of [1,2,3,5])assert.equal(window.IneburaDunningTemplateUI.mount({row:{stageNumber:stage}}),null);
});
test('generic Template Master filters migrated immutable Dunning identities and preserves catalog sources',()=>{
 const sourceText=fs.readFileSync(require.resolve('./admin-template-master.js'),'utf8');
 assert.match(sourceText,/!dunningIds\.has\(row\.id\)/);assert.match(sourceText,/dunningIds\.has\(updated\.id\)/);
 assert.doesNotMatch(sourceText,/IneburaDunningTemplateUI|templateExtension|Upload Word template/);
 const ctx={window:{}};vm.runInNewContext(fs.readFileSync(require.resolve('./template-master-data.js'),'utf8'),ctx);
 for(const id of ['xeon-template-10','xeon-template-46','xeon-template-47','xeon-template-48'])assert.ok(ctx.window.IneburaTemplateMasterSource.templates.find(row=>row.id===id),'captured source remains available without becoming editable in the generic catalog');
});
