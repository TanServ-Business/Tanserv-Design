"use strict";
const test = require("node:test");
const assert = require("node:assert/strict");
const core = require("./invoice-master-core.js");
const invoice = (no, values = {}) => ({ company: "A", fields: { "Invoice No": no }, ...values });
test("unallocated is determined only by Agent and Manager, including whitespace", () => {
  assert.deepEqual(core.missingAssignments(invoice("1", { agent: "Agent", manager: "Manager" })), []);
  assert.deepEqual(core.missingAssignments(invoice("1", { agent: " ", manager: "Manager", kam: "KAM", kas: "KAS" })), ["agent"]);
  assert.deepEqual(core.missingAssignments(invoice("1", { agent: "Agent" })), ["manager"]);
  assert.deepEqual(core.missingAssignments(invoice("1")), ["agent", "manager"]);
});
test("batch allocation fills missing roles only and preserves other companies and assignments", () => {
  const a = invoice("1", { manager: "Existing manager", kam: "KAM", kas: "KAS" });
  const b = invoice("2", { agent: "Existing agent" });
  const c = { ...invoice("1"), company: "B" };
  const records = [a, b, c];
  const result = core.allocate([a, b], records, "A", { agent: "New agent", manager: "New manager" });
  assert.equal(result.next[0].agent, "New agent");
  assert.equal(result.next[0].manager, "Existing manager");
  assert.equal(result.next[0].kam, "KAM");
  assert.equal(result.next[0].kas, "KAS");
  assert.equal(result.next[1].agent, "Existing agent");
  assert.equal(result.next[1].manager, "New manager");
  assert.deepEqual(result.next[2], c);
  assert.equal(a.agent, undefined);
  assert.equal(result.changes.length, 2);
});
test("partial allocation keeps invoices missing the other role in the queue", () => {
  const r = invoice("1");
  const result = core.allocate([r], [r], "A", { agent: "Agent" });
  assert.deepEqual(core.missingAssignments(result.next[0]), ["manager"]);
});
test("allocation rejects stale, deleted and foreign-company targets without mutation", () => {
  const a = invoice("1"), b = invoice("2");
  const current = [a, { ...b, manager: "Changed" }];
  assert.throws(() => core.allocate([a, b], current, "A", { agent: "Agent" }), /changed/);
  assert.equal(a.agent, undefined);
  assert.throws(() => core.allocate([a], [], "A", { agent: "Agent" }), /changed/);
  assert.throws(() => core.allocate([{ ...a, company: "B" }], current, "A", { agent: "Agent" }), /outside/);
});
test("allocation rejects empty selections, missing assignees and operations with no changes", () => {
  const r = invoice("1", { agent: "Agent" });
  assert.throws(() => core.allocate([], [r], "A", { agent: "A" }), /Select/);
  assert.throws(() => core.allocate([r], [r], "A", {}), /Choose/);
  assert.throws(() => core.allocate([r], [r], "A", { agent: "Other" }), /no missing/);
});
