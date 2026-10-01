/* Run with: node scripts/validate-admin-modules.js */
"use strict";

const fs = require("fs");
const path = require("path");
const vm = require("vm");

const repoRoot = path.resolve(__dirname, "..");
const context = { window: {} };
vm.createContext(context);

[
  "admin-modules-setup.js",
  "admin-modules-config.js",
  "admin-modules-operations.js",
  "admin-parity-definitions.js",
].forEach((fileName) => {
  const source = fs.readFileSync(path.join(__dirname, fileName), "utf8");
  vm.runInContext(source, context, { filename: fileName });
});

const modules = context.window.IneburaAdminModules || {};
const expected = [
  "branch-master", "holiday-master", "bank-master", "internal-contacts",
  "invoice-preferences", "document-setup", "role-display", "user-setup", "notification-manager",
  "submission-process", "module-configuration", "strategy-manager",
  "portfolio-transfer", "bulk-document-upload", "grn-upload", "cn-advance-upload", "payment-receipt-upload", "customer-portfolio-transfer",
  "group-master", "customer-master", "customer-contacts",
  "template-master", "smtp-setup", "sender-account",
  "invoice-master", "invoice-upload", "invoice-reallocation", "invoice-deletion",
  "change-password", "client-master", "audit-retention", "audit-trail", "help-support",
];

const errors = [];
expected.forEach((id) => {
  const module = modules[id];
  if (!module) {
    errors.push(`Missing module definition: ${id}`);
    return;
  }
  if (!module.title || !module.description) errors.push(`${id}: title and description are required`);
  if (!module.create && !module.upload && !module.settingsSections?.length && !module.columns?.length && !module.customBlocks?.length) {
    errors.push(`${id}: has no interactive page content`);
  }
  (module.rowActions || []).forEach((action) => {
    if (!action.id || !action.label) errors.push(`${id}: every row action needs id and label`);
  });
  [...(module.create?.fields || []), ...(module.upload?.fields || []), ...(module.settingsSections || []).flatMap((section) => section.fields || []), ...(module.customBlocks || []).flatMap((block) => block.fields || [])]
    .forEach((field) => {
      if (!field.key || !field.label) errors.push(`${id}: every field needs key and label`);
    });
  (module.tabs || []).forEach((tab) => {
    if (!tab.label) errors.push(`${id}: tab label is missing`);
    const baseTarget = String(tab.module || id).split(/[:#]/)[0];
    if (!modules[baseTarget]) errors.push(`${id}: tab target ${tab.module} has no module definition`);
  });
});

Object.keys(modules).filter((id) => !expected.includes(id)).forEach((id) => errors.push(`Unexpected module definition: ${id}`));

const adminPage = fs.readFileSync(path.join(repoRoot, "pages", "admin.html"), "utf8");
["admin-modules-setup.js", "admin-modules-config.js", "admin-modules-operations.js", "admin-shell.js", "admin-header-runtime.js", "admin-runtime.js"]
  .forEach((fileName) => {
    if (!adminPage.includes(fileName)) errors.push(`pages/admin.html does not load ${fileName}`);
  });

if (errors.length) {
  console.error(`Admin validation failed with ${errors.length} error(s):`);
  errors.forEach((error) => console.error(`- ${error}`));
  process.exit(1);
}

console.log(`Admin validation passed: ${expected.length} menu modules, ${Object.keys(modules).length} definitions, all tab targets resolved.`);
