import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { createAndLinkMaintenanceCenter, applyMaintenanceCenterBinding } from "../src/helpers/maintenanceCenterCreation.js";

// Resolve the app's aliases in memory. No emitted modules, network, secrets or
// browser data are used. Service mocks verify the actual optional CAS query.
const moduleCache = new Map();
const mockClientSource = "export function getSupabaseClient(){return globalThis.__maintenanceCenterMockClient;} export function getSupabaseClientError(){return ''; }";
async function moduleUrl(relativePath) {
  if (moduleCache.has(relativePath)) return moduleCache.get(relativePath);
  let source = relativePath === "src/services/supabaseClient.js" ? mockClientSource
    : relativePath === "src/services/internalApprovedActivitiesService.js" ? "export async function listInternalApprovedActivityStates(){return new Map();}"
    : await readFile(new URL(`../${relativePath}`, import.meta.url), "utf8");
  for (const match of [...source.matchAll(/from\s+["'](@\/[^"']+)["']/g)]) {
    const path = `src/${match[1].slice(2)}.js`;
    source = source.replace(match[0], `from ${JSON.stringify(await moduleUrl(path))}`);
  }
  const url = `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`;
  moduleCache.set(relativePath, url);
  return url;
}
const { mapDraftPayloadToFormState } = await import(await moduleUrl("src/helpers/mapDraftPayloadToFormState.js"));
const { mapFormStateToDraftPayload } = await import(await moduleUrl("src/helpers/mapFormStateToDraftPayload.js"));
const { sanitizeInternalDraftCreateFormState } = await import(await moduleUrl("src/helpers/internalDraftCreateAutosave.js"));
const { saveInternalDraftReview } = await import(await moduleUrl("src/services/internalDraftsService.js"));
const { createMaintenanceCenter } = await import(await moduleUrl("src/services/maintenanceAdminService.js"));

const proposedPayload = {
  activity: { title: "Synthetic review only", age_rule_type: null, is_free: null },
  center: { mode: "proposed_new", name: "Synthetic center", city_name: "Vilanova i la Geltrú", city_id: 41, city_label: "Vilanova i la Geltrú · Barcelona",
    institution_name: "Confirmed organizer", institution_id: 12, address_line_1: "Fixture street", postal_code: "00000", notes: "Confirmed source" },
  import_review: { warnings: ["Age unknown"], review_confirmed: true },
};
const restored = mapDraftPayloadToFormState(proposedPayload);
assert.equal(restored.centerProposalCityId, "41");
assert.equal(restored.centerProposalCityLabel, "Vilanova i la Geltrú · Barcelona");
assert.equal(restored.centerProposalInstitutionId, "12");
assert.equal(restored.ageRuleType, "");
assert.equal(restored.isFree, "");
const roundTrip = mapFormStateToDraftPayload(restored);
assert.deepEqual(roundTrip.center, proposedPayload.center);
assert.equal(roundTrip.activity.age_rule_type, null);
assert.equal(roundTrip.activity.is_free, null);
const autosaved = sanitizeInternalDraftCreateFormState(restored);
for (const field of ["centerProposalName", "centerProposalNotes", "centerProposalCity", "centerProposalCityId", "centerProposalCityLabel", "centerProposalInstitution", "centerProposalInstitutionId", "centerProposalAddress", "centerProposalPostalCode"]) {
  assert.equal(autosaved[field], restored[field], `Autosave lost ${field}`);
}
assert.equal(autosaved.ageRuleType, "");
assert.equal(autosaved.isFree, "");
assert.equal(mapDraftPayloadToFormState({ center: { mode: "proposed_new", city_name: "Vilanova" } }).centerProposalCityId, "");

const request = { draftId: 5, reviewedPayload: proposedPayload, internalReviewNotes: "Private fixture note", centerPayload: {
  name: "Synthetic center", institution_id: 12, city_id: 41, address_line_1: "Fixture street", postal_code: "00000",
} };
const initialDraft = { id: 5, reviewStatus: "pending_review", updatedAt: "2026-10-03T10:00:00.000Z", reviewedPayload: structuredClone(proposedPayload) };
function fixture(overrides = {}) {
  let draft = structuredClone(initialDraft);
  const calls = [];
  const dependencies = {
    readDraft: async () => { calls.push("read"); return structuredClone(draft); },
    saveDraft: async (input) => {
      calls.push("save");
      assert.equal(input.expectedUpdatedAt, draft.updatedAt);
      draft = { ...draft, reviewedPayload: structuredClone(input.reviewedPayload), updatedAt: "2026-10-03T10:00:01.000Z" };
      return structuredClone(draft);
    },
    createCenter: async (input) => {
      calls.push("create");
      assert.equal(input.draft_id, 5);
      draft = applyMaintenanceCenterBinding(draft, 99);
      draft.updatedAt = "2026-10-03T10:00:02.000Z";
      return 99;
    },
  };
  return { calls, dependencies: { ...dependencies, ...overrides }, getDraft: () => draft, setDraft: (value) => { draft = structuredClone(value); }, base: dependencies };
}
const success = fixture();
const result = await createAndLinkMaintenanceCenter(request, success.dependencies);
assert.deepEqual(success.calls, ["read", "save", "create"]);
assert.equal(result.centerId, 99);
assert.equal(result.recovered, false);
assert.equal(result.draft.reviewedPayload.activity.center_id, 99);
assert.equal(result.draft.reviewedPayload.activity.age_rule_type, null);
assert.equal(result.draft.reviewedPayload.activity.is_free, null);
assert.equal(result.draft.reviewedPayload.import_review.review_confirmed, false);
assert.equal(initialDraft.reviewedPayload.activity.center_id, undefined); // no mutation
const repeated = await createAndLinkMaintenanceCenter(request, success.dependencies);
assert.equal(repeated.recovered, true);
assert.deepEqual(success.calls, ["read", "save", "create", "read"]); // no stale re-save

const responseLost = fixture();
responseLost.dependencies.createCenter = async (input) => { await responseLost.base.createCenter(input); throw new Error("Raw network timeout fixture"); };
const recovered = await createAndLinkMaintenanceCenter(request, responseLost.dependencies);
assert.equal(recovered.recovered, true);
assert.equal(recovered.centerId, 99);
assert.deepEqual(responseLost.calls, ["read", "save", "create", "read"]);

const unreadableRecovery = fixture();
let reads = 0;
unreadableRecovery.dependencies.readDraft = async () => { if (++reads === 2) throw new Error("Raw backend fixture"); return unreadableRecovery.base.readDraft(); };
unreadableRecovery.dependencies.createCenter = async (input) => { await unreadableRecovery.base.createCenter(input); throw new Error("Raw response loss fixture"); };
await assert.rejects(() => createAndLinkMaintenanceCenter(request, unreadableRecovery.dependencies), (error) => error.requiresRecovery === true && !/Raw/.test(error.message));
const afterRecoveryFailure = await createAndLinkMaintenanceCenter(request, unreadableRecovery.dependencies);
assert.equal(afterRecoveryFailure.recovered, true);
assert.equal(unreadableRecovery.calls.filter((call) => call === "save").length, 1);
assert.equal(unreadableRecovery.calls.filter((call) => call === "create").length, 1);

const conflict = fixture();
conflict.dependencies.saveDraft = async () => { const error = new Error("Raw revision fixture"); error.code = "DRAFT_REVISION_CONFLICT"; throw error; };
await assert.rejects(() => createAndLinkMaintenanceCenter(request, conflict.dependencies), (error) => error.code === "DRAFT_REVISION_CONFLICT" && error.requiresRecovery === true && !/Raw/.test(error.message));
assert.ok(!conflict.calls.includes("create"));
assert.deepEqual(conflict.calls, ["read", "read"]);
const conflictReadFailed = fixture();
let conflictReads = 0;
conflictReadFailed.dependencies.readDraft = async () => { if (++conflictReads === 2) throw new Error("Raw conflict read fixture"); return conflictReadFailed.base.readDraft(); };
conflictReadFailed.dependencies.saveDraft = conflict.dependencies.saveDraft;
await assert.rejects(() => createAndLinkMaintenanceCenter(request, conflictReadFailed.dependencies), (error) => error.code === "DRAFT_REVISION_CONFLICT" && error.requiresRecovery === true && !/Raw/.test(error.message));
assert.ok(!conflictReadFailed.calls.includes("create"));
const conflictAlreadyBound = fixture();
conflictAlreadyBound.dependencies.saveDraft = async () => {
  conflictAlreadyBound.setDraft(applyMaintenanceCenterBinding(conflictAlreadyBound.getDraft(), 77));
  const error = new Error("Raw concurrent binding fixture"); error.code = "DRAFT_REVISION_CONFLICT"; throw error;
};
const reconciledConflict = await createAndLinkMaintenanceCenter(request, conflictAlreadyBound.dependencies);
assert.equal(reconciledConflict.centerId, 77);
assert.equal(reconciledConflict.recovered, true);
assert.ok(!conflictAlreadyBound.calls.includes("create"));
const archived = fixture(); archived.setDraft({ ...initialDraft, reviewStatus: "archived" });
await assert.rejects(() => createAndLinkMaintenanceCenter(request, archived.dependencies), (error) => error.code === "DRAFT_NOT_PENDING");
assert.deepEqual(archived.calls, ["read"]);
const readUnavailable = fixture({ readDraft: async () => { throw new Error("Raw unavailable fixture"); } });
await assert.rejects(() => createAndLinkMaintenanceCenter(request, readUnavailable.dependencies), (error) => error.requiresRecovery === true && !/Raw/.test(error.message));
assert.deepEqual(readUnavailable.calls, []);
for (const badId of [0, -1, "abc", Number.MAX_SAFE_INTEGER + 1]) {
  await assert.rejects(() => createAndLinkMaintenanceCenter({ ...request, draftId: badId }, fixture().dependencies), (error) => error.code === "DRAFT_ID_INVALID");
}
const invalidResponse = fixture({ createCenter: async () => Number.MAX_SAFE_INTEGER + 1 });
await assert.rejects(() => createAndLinkMaintenanceCenter(request, invalidResponse.dependencies), (error) => error.requiresRecovery === true && error.code === "CENTER_RESULT_UNCERTAIN");
const rawFailure = fixture({ createCenter: async () => { throw new Error("Raw SQL private table fixture"); } });
await assert.rejects(() => createAndLinkMaintenanceCenter(request, rawFailure.dependencies), (error) => error.code === "CENTER_RESULT_UNCERTAIN" && error.requiresRecovery === true && !/Raw|SQL|private table/.test(error.message));
const typedFailure = fixture({ createCenter: async () => { const error = new Error("Ya existe este centro. Selecciónalo en la lista."); error.isUserFacing = true; error.creationRejected = true; error.code = "CENTER_DUPLICATE"; throw error; } });
await assert.rejects(() => createAndLinkMaintenanceCenter(request, typedFailure.dependencies), (error) => error.code === "CENTER_DUPLICATE" && /Selecciónalo/.test(error.message));

// An edit made before the fresh read must not be overwritten by a stale form.
const alreadyChanged = fixture();
alreadyChanged.setDraft({ ...initialDraft, updatedAt: "2026-10-03T10:01:00.000Z", reviewedPayload: { ...proposedPayload, activity: { title: "Another administrator's edit" } } });
await assert.rejects(() => createAndLinkMaintenanceCenter({ ...request, expectedDraftUpdatedAt: initialDraft.updatedAt }, alreadyChanged.dependencies), (error) => error.code === "DRAFT_REVISION_CONFLICT" && error.requiresRecovery === true);
assert.deepEqual(alreadyChanged.calls, ["read"]);
assert.equal(alreadyChanged.getDraft().reviewedPayload.activity.title, "Another administrator's edit");

// A timed-out request may commit AFTER a read that still shows no binding.
const delayedCommit = fixture({ createCenter: async () => { throw Object.assign(new Error("Safe transport error"), { isUserFacing: true }); } });
await assert.rejects(() => createAndLinkMaintenanceCenter(request, delayedCommit.dependencies), (error) => error.requiresRecovery === true);
delayedCommit.setDraft(applyMaintenanceCenterBinding(delayedCommit.getDraft(), 99));
const recoveredDelayed = await createAndLinkMaintenanceCenter({ ...request, expectedDraftUpdatedAt: initialDraft.updatedAt }, delayedCommit.dependencies);
assert.equal(recoveredDelayed.centerId, 99);
assert.equal(recoveredDelayed.recovered, true);
assert.equal(delayedCommit.calls.filter((call) => call === "save").length, 1);

// Retrying an uncertain unbound request retries the atomic RPC only, never
// writes the stale reviewed payload over more recent server edits.
const uncertainUnbound = fixture();
uncertainUnbound.setDraft({ ...initialDraft, updatedAt: "2026-10-03T10:02:00.000Z", reviewedPayload: { ...proposedPayload, activity: { ...proposedPayload.activity, title: "Preserved concurrent edit" } } });
const retriedUnbound = await createAndLinkMaintenanceCenter({ ...request, expectedDraftUpdatedAt: initialDraft.updatedAt, recoveringCreation: true }, uncertainUnbound.dependencies);
assert.equal(retriedUnbound.draft.reviewedPayload.activity.title, "Preserved concurrent edit");
assert.deepEqual(uncertainUnbound.calls, ["read", "create"]);

let acknowledgedSave;
const acknowledged = fixture();
acknowledged.dependencies.onDraftSaved = (saved) => { acknowledgedSave = saved; };
acknowledged.dependencies.createCenter = async () => {
  assert.equal(acknowledgedSave.updatedAt, acknowledged.getDraft().updatedAt);
  return acknowledged.base.createCenter({ ...request.centerPayload, draft_id: request.draftId });
};
await createAndLinkMaintenanceCenter(request, acknowledged.dependencies);
assert.equal(acknowledgedSave.reviewedPayload.center.mode, "proposed_new");

// A read failure before the RPC is different from an uncertain RPC outcome:
// retry must still save the administrator's unsaved form before creation.
const initialReadFailed = fixture();
const localEdit = { ...request, expectedDraftUpdatedAt: initialDraft.updatedAt, reviewedPayload: { ...proposedPayload, activity: { ...proposedPayload.activity, title: "Unsaved reviewed title" } } };
let initialReads = 0;
initialReadFailed.dependencies.readDraft = async () => { if (++initialReads === 1) throw new Error("Initial fixture network failure"); return initialReadFailed.base.readDraft(); };
let firstFailure;
try { await createAndLinkMaintenanceCenter(localEdit, initialReadFailed.dependencies); } catch (error) { firstFailure = error; }
assert.equal(firstFailure.requiresRecovery, true);
assert.equal(firstFailure.centerRequestStarted, false);
const retriedInitialRead = await createAndLinkMaintenanceCenter({ ...localEdit, recoveringCreation: firstFailure.centerRequestStarted }, initialReadFailed.dependencies);
assert.equal(retriedInitialRead.draft.reviewedPayload.activity.title, "Unsaved reviewed title");
assert.deepEqual(initialReadFailed.calls, ["read", "save", "create"]);

for (const [rpcError, expectedRejected] of [
  [{ code: "P0001", message: "a center with this name and city already exists" }, true],
  [{ code: "42501", message: "Raw permission fixture" }, true],
  [{ code: "", message: "Raw network fixture" }, false],
  [{ code: "P0001", message: "Unknown private fixture" }, false],
]) {
  globalThis.__maintenanceCenterMockClient = { rpc: async () => ({ data: null, error: rpcError }) };
  await assert.rejects(() => createMaintenanceCenter(request.centerPayload), (error) => error.creationRejected === expectedRejected && error.isUserFacing === true && !/Raw|private|Unknown/.test(error.message));
}

// Exercise the actual service's conditional update rather than only testing an
// imitation of it. The fake builder observes the filters and result semantics.
function clientMock(response) {
  const filters = [];
  let update;
  const builder = { update: (value) => { update = value; return builder; }, eq: (key, value) => { filters.push([key, value]); return builder; }, select: () => builder, maybeSingle: async () => response };
  return { client: { from: () => builder }, filters, update: () => update };
}
const serviceSuccess = clientMock({ data: { id: 5, reviewed_payload_json: proposedPayload, review_status: "pending_review", updated_at: "2026-10-03T10:00:01.000Z" }, error: null });
globalThis.__maintenanceCenterMockClient = serviceSuccess.client;
await saveInternalDraftReview({ draftId: 5, reviewedPayload: proposedPayload, expectedUpdatedAt: initialDraft.updatedAt });
assert.deepEqual(serviceSuccess.filters, [["id", 5], ["review_status", "pending_review"], ["updated_at", initialDraft.updatedAt]]);
assert.ok(Date.parse(serviceSuccess.update().updated_at) > Date.parse(initialDraft.updatedAt));
globalThis.__maintenanceCenterMockClient = clientMock({ data: null, error: null }).client;
await assert.rejects(() => saveInternalDraftReview({ draftId: 5, reviewedPayload: proposedPayload, expectedUpdatedAt: initialDraft.updatedAt }), (error) => error.code === "DRAFT_REVISION_CONFLICT");
globalThis.__maintenanceCenterMockClient = clientMock({ data: null, error: { message: "Raw SQL private fixture" } }).client;
await assert.rejects(() => saveInternalDraftReview({ draftId: 5, reviewedPayload: proposedPayload, expectedUpdatedAt: initialDraft.updatedAt }), (error) => !/Raw|SQL|private/.test(error.message));
delete globalThis.__maintenanceCenterMockClient;
console.log("Center flow checks passed: immediate binding, no stale retry, response-loss recovery, failed recovery lock, conflicts, pending guards, safe errors, selected-reference restoration and unknown facts.");
