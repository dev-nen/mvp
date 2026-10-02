import assert from "node:assert/strict";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  PUBLIC_CATALOG_COLUMNS,
  PUBLIC_CONTACT_COLUMNS,
  pickPublicColumns,
  validatePublicCatalogBackup,
  validatePublicSupabaseKey,
} from "../src/shared/publicCatalogBackupContract.mjs";
import { createPublicCatalogBackupReader } from "../src/services/publicCatalogBackupService.js";
import { buildPublicCatalogBackup, downloadPublicImage, imageExtension, isPublicIp, readPublicView } from "./build-public-catalog-backup.mjs";
import { createCatalogBackupHandler, validatedDeployHook } from "../api/internal/catalog-backup.js";

const generationId = "aa8c2748-9517-4801-93cb-98c8893f5197";
const generatedAt = "2026-10-02T12:00:00.000Z";
const image = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a2ioAAAAASUVORK5CYII=", "base64");
const activity = pickPublicColumns({ id: 1, title: "Pintura", description: "Texto público", image_url: `/catalog-backup/images/${"a".repeat(64)}.png` }, PUBLIC_CATALOG_COLUMNS);
const contact = pickPublicColumns({ id: 2, activity_id: 1, contact_method: "phone", contact_value: "+34600111222" }, PUBLIC_CONTACT_COLUMNS);
const snapshot = { version: 1, generationId, generatedAt, activities: [activity], contactOptions: [contact] };
const manifest = { version: 1, generationId, generatedAt, activityCount: 1, contactCount: 1, imageCount: 1, imageBytes: image.length };
const publicKey = `header.${Buffer.from(JSON.stringify({ role: "anon" })).toString("base64url")}.signature`;

function jsonResponse(value, status = 200, headers = {}) {
  return new Response(JSON.stringify(value), { status, headers: { "content-type": "application/json", ...headers } });
}
function backupFetch(url) {
  return Promise.resolve(jsonResponse(String(url).endsWith("manifest.json") ? manifest : snapshot));
}

assert.equal(validatePublicCatalogBackup(snapshot, manifest), snapshot);
assert.throws(() => validatePublicCatalogBackup({ ...snapshot, user_profiles: [] }), /Invalid/);
assert.throws(() => validatePublicCatalogBackup({ ...snapshot, activities: [{ ...activity, password: "private" }] }), /Invalid/);
assert.throws(() => validatePublicCatalogBackup({ ...snapshot, activities: [{ ...activity, description: { password: "private" } }] }), /Non-public/);
assert.throws(() => validatePublicCatalogBackup({ ...snapshot, activities: [{ ...activity, image_url: "https://storage.invalid/image.png" }] }), /local/);
assert.throws(() => validatePublicCatalogBackup({ ...snapshot, contactOptions: [{ ...contact, activity_id: 99 }] }), /outside/);
assert.throws(() => validatePublicCatalogBackup(snapshot, { ...manifest, generationId: "ba8c2748-9517-4801-93cb-98c8893f5197" }), /mismatch/);
assert.equal(validatePublicSupabaseKey(publicKey), publicKey);
assert.equal(validatePublicSupabaseKey("sb_publishable_example"), "sb_publishable_example");
assert.throws(() => validatePublicSupabaseKey("sb_secret_example"));
assert.throws(() => validatePublicSupabaseKey(`header.${Buffer.from('{"role":"service_role"}').toString("base64url")}.signature`));

// Live errors and timeouts use one validated generation for both catalog and contacts.
const reader = createPublicCatalogBackupReader({ fetchImpl: backupFetch, timeoutMs: 20 });
assert.deepEqual(await reader.readCatalog(async () => { throw new Error("Database paused"); }), [activity]);
let liveContactsCalled = false;
assert.deepEqual(await reader.readContacts(1, async () => { liveContactsCalled = true; return []; }), [contact]);
assert.equal(liveContactsCalled, false);
assert.deepEqual(await reader.readContacts(99, async () => []), []);
const recovered = [{ id: 8, title: "Nuevo catálogo" }];
assert.deepEqual(await reader.readCatalog(async () => recovered), recovered);
assert.equal(reader.getActiveSnapshot(), null);
assert.deepEqual(await reader.readContacts(8, async () => [{ id: 9 }]), [{ id: 9 }]);
// React StrictMode / remount races must not change the active generation after a newer read.
const racingReader = createPublicCatalogBackupReader({ fetchImpl: backupFetch, timeoutMs: 100 });
let failOldRead;
const oldRead = racingReader.readCatalog(() => new Promise((_, reject) => { failOldRead = reject; }));
await racingReader.readCatalog(async () => recovered);
failOldRead(new Error("Old request failed"));
await oldRead;
assert.equal(racingReader.getActiveSnapshot(), null);
let finishContactRead;
const inFlightContacts = racingReader.readContacts(1, () => new Promise((resolve) => { finishContactRead = resolve; }));
await racingReader.readCatalog(async () => { throw new Error("Paused now"); });
finishContactRead([{ id: "Different generation" }]);
assert.deepEqual(await inFlightContacts, [contact]);
const timeoutReader = createPublicCatalogBackupReader({ fetchImpl: backupFetch, timeoutMs: 5 });
assert.deepEqual(await timeoutReader.readCatalog(() => new Promise(() => {})), [activity]);
const badReader = createPublicCatalogBackupReader({ fetchImpl: async () => new Response("<!doctype html>"), timeoutMs: 20 });
await assert.rejects(() => badReader.readCatalog(async () => { throw new Error("Paused"); }));
const missingReader = createPublicCatalogBackupReader({ fetchImpl: async () => new Response("not found", { status: 404 }), timeoutMs: 20 });
await assert.rejects(() => missingReader.readCatalog(async () => { throw new Error("Paused"); }), /unavailable/);

// More than the database's default row limit must be exported, without silently truncating.
const manyRows = Array.from({ length: 1102 }, (_, index) => ({ id: index + 1, title: "Activity", private_notes: "Must not export" }));
const pagedFetch = async (_url, options) => {
  const [start, end] = options.headers.Range.split("-").map(Number);
  return jsonResponse(manyRows.slice(start, end + 1), 200, { "content-range": `${start}-${Math.min(end, manyRows.length - 1)}/${manyRows.length}` });
};
const exportedRows = await readPublicView({ supabaseUrl: "https://project.supabase.co", publicKey, view: "catalog_activities_read", columns: PUBLIC_CATALOG_COLUMNS, fetchImpl: pagedFetch });
assert.equal(exportedRows.length, 1102);
assert.equal(JSON.stringify(exportedRows).includes("private_notes"), false);
await assert.rejects(() => readPublicView({ supabaseUrl: "https://project.supabase.co", publicKey, view: "user_profiles", columns: [], fetchImpl: pagedFetch }), /allowlisted/);
await assert.rejects(() => readPublicView({ supabaseUrl: "https://project.supabase.co", publicKey, view: "catalog_activities_read", columns: PUBLIC_CATALOG_COLUMNS, fetchImpl: async () => jsonResponse([]) }), /complete row count/);
await assert.rejects(() => readPublicView({ supabaseUrl: "https://project.supabase.co", publicKey, view: "catalog_activities_read", columns: PUBLIC_CATALOG_COLUMNS, fetchImpl: async () => jsonResponse([manyRows[0]], 200, { "content-range": "0-0/1102" }) }), /Incomplete/);

for (const ip of ["127.0.0.1", "10.0.0.1", "172.16.1.1", "192.168.1.1", "169.254.169.254", "100.64.0.1", "::1", "fe80::1", "fc00::1", "::ffff:127.0.0.1", "2001:db8::1"]) assert.equal(isPublicIp(ip), false, ip);
assert.equal(isPublicIp("93.184.216.34"), true);
assert.equal(isPublicIp("2606:4700:4700::1111"), true);
assert.equal(imageExtension(image, "image/png"), "png");
assert.throws(() => imageExtension(Buffer.from("<script>bad</script>"), "image/png"));
await assert.rejects(() => downloadPublicImage("https://image.invalid/cover.png", {
  lookupImpl: async () => [{ address: "127.0.0.1", family: 4 }],
  requestImpl: () => { throw new Error("Must not send HTTP to private addresses"); },
}), /private/);
await assert.rejects(() => downloadPublicImage("https://user:password@image.invalid/cover.png"), /unsafe/);

const tempDirectory = await mkdtemp(path.join(os.tmpdir(), "nensgo-public-backup-check-"));
try {
  const distDir = path.join(tempDirectory, "dist");
  const fixtureFetch = async (url) => {
    const isContact = String(url).includes("activity_contact_options_read");
    return jsonResponse(isContact ? [contact] : [{ ...activity, image_url: "https://images.invalid/cover.png", internal_review_notes: "private" }], 200, { "content-range": "0-0/1" });
  };
  const exportedManifest = await buildPublicCatalogBackup({ supabaseUrl: "https://project.supabase.co", publicKey, distDir, publicDir: path.join(tempDirectory, "public"), fetchImpl: fixtureFetch, downloadImage: async () => ({ bytes: image, extension: "png" }), now: () => new Date(generatedAt) });
  const exportedSnapshot = JSON.parse(await readFile(path.join(distDir, "catalog-backup/catalog.json"), "utf8"));
  assert.equal(exportedManifest.imageCount, 1);
  assert.equal(exportedSnapshot.activities[0].image_url.startsWith("/catalog-backup/images/"), true);
  assert.equal(JSON.stringify(exportedSnapshot).includes("internal_review_notes"), false);
  assert.equal((await readdir(path.join(distDir, "catalog-backup/images"))).length, 1);
  const previous = await readFile(path.join(distDir, "catalog-backup/manifest.json"), "utf8");
  await assert.rejects(() => buildPublicCatalogBackup({ supabaseUrl: "https://project.supabase.co", publicKey, distDir, fetchImpl: fixtureFetch, downloadImage: async () => { throw new Error("Image unavailable"); } }), /Image unavailable/);
  assert.equal(await readFile(path.join(distDir, "catalog-backup/manifest.json"), "utf8"), previous);
  // Only the reviewed repository placeholder may be exported as SVG. A replaced
  // build asset or an arbitrary local SVG must still fail without replacing it.
  const publicDir = path.join(tempDirectory, "public");
  const placeholderPath = "/placeholders/activity-card-placeholder.svg";
  const placeholder = await readFile(new URL("../public/placeholders/activity-card-placeholder.svg", import.meta.url));
  await mkdir(path.join(publicDir, "placeholders"), { recursive: true });
  await writeFile(path.join(publicDir, "placeholders/activity-card-placeholder.svg"), placeholder);
  const localFetch = (source) => async (url) => jsonResponse(String(url).includes("activity_contact_options_read") ? [contact] : [{ ...activity, image_url: source }], 200, { "content-range": "0-0/1" });
  const localManifest = await buildPublicCatalogBackup({ supabaseUrl: "https://project.supabase.co", publicKey, distDir, publicDir, fetchImpl: localFetch(placeholderPath) });
  assert.equal(localManifest.imageCount, 1);
  const localSnapshot = JSON.parse(await readFile(path.join(distDir, "catalog-backup/catalog.json"), "utf8"));
  assert.match(localSnapshot.activities[0].image_url, /\.svg$/);
  assert.deepEqual(await readFile(path.join(distDir, localSnapshot.activities[0].image_url.slice(1))), placeholder);
  await writeFile(path.join(publicDir, "placeholders/untrusted.svg"), "<svg><script>bad()</script></svg>");
  await assert.rejects(() => buildPublicCatalogBackup({ supabaseUrl: "https://project.supabase.co", publicKey, distDir, publicDir, fetchImpl: localFetch("/placeholders/untrusted.svg") }), /image/i);
  const empty = await buildPublicCatalogBackup({ supabaseUrl: "https://project.supabase.co", publicKey, distDir, fetchImpl: async () => jsonResponse([], 200, { "content-range": "*/0" }) });
  assert.equal(empty.activityCount, 0);
  assert.equal(empty.contactCount, 0);
} finally {
  // mkdtemp provides an absolute child of the intended OS temp directory.
  assert.equal(path.dirname(tempDirectory), path.resolve(os.tmpdir()));
  assert.equal(path.basename(tempDirectory).startsWith("nensgo-public-backup-check-"), true);
  await rm(tempDirectory, { recursive: true, force: true });
}

const hook = "https://api.vercel.com/v1/integrations/deploy/prj_example/private_example";
assert.equal(validatedDeployHook(hook).hostname, "api.vercel.com");
assert.equal(validatedDeployHook("https://evil.invalid/v1/integrations/deploy/prj_example/private_example"), null);
assert.equal(validatedDeployHook("http://api.vercel.com/v1/integrations/deploy/prj_example/private_example"), null);
const apiEnvironment = { VERCEL_ENV: "production", VITE_SUPABASE_URL: "https://project.supabase.co", VITE_SUPABASE_ANON_KEY: publicKey, PUBLIC_CATALOG_DEPLOY_HOOK: hook };
function fakeResponse() {
  return { headers: {}, setHeader(key, value) { this.headers[key] = value; }, status(value) { this.statusCode = value; return this; }, json(value) { this.body = value; } };
}
async function callApi({ method = "POST", token = "valid", host = "nensgo.com", allowed = true, identity = true, permissionError = null, environment = apiEnvironment, hookResponse = jsonResponse({ job: { id: "accepted-job", state: "PENDING" } }) } = {}) {
  let hookCalls = 0;
  let rpcCalls = 0;
  const handler = createCatalogBackupHandler({
    environment,
    now: () => new Date(generatedAt),
    createClientImpl: (_url, _key, options) => {
      assert.equal(options.global.headers.Authorization, `Bearer ${token}`);
      return {
        auth: { getUser: async (providedToken) => { assert.equal(providedToken, token); return { data: { user: identity ? { id: "operator-id" } : null } }; } },
        rpc: async (name) => { assert.equal(name, "is_maintenance_operator"); rpcCalls += 1; return { data: allowed, error: permissionError }; },
      };
    },
    fetchImpl: async (url, options) => { hookCalls += 1; assert.equal(url.searchParams.get("buildCache"), "false"); assert.equal(options.method, "POST"); return hookResponse; },
  });
  const response = fakeResponse();
  await handler({ method, headers: { host, authorization: token ? `Bearer ${token}` : undefined } }, response);
  assert.equal(JSON.stringify(response.body).includes("private_example"), false);
  assert.equal(response.headers["Cache-Control"].startsWith("no-store"), true);
  return { ...response, hookCalls, rpcCalls };
}
assert.equal((await callApi({ method: "GET" })).statusCode, 405);
assert.equal((await callApi({ token: "" })).statusCode, 401);
assert.equal((await callApi({ identity: false })).statusCode, 401);
assert.equal((await callApi({ allowed: false })).statusCode, 403);
assert.equal((await callApi({ permissionError: { message: "Missing RPC" } })).hookCalls, 0);
assert.equal((await callApi({ environment: { ...apiEnvironment, VERCEL_ENV: "preview" } })).statusCode, 409);
assert.equal((await callApi({ host: "preview.vercel.app" })).hookCalls, 0);
assert.equal((await callApi({ environment: { ...apiEnvironment, PUBLIC_CATALOG_DEPLOY_HOOK: "" } })).statusCode, 503);
assert.equal((await callApi({ hookResponse: jsonResponse({ error: "Sensitive upstream details" }, 500) })).statusCode, 502);
assert.equal((await callApi({ hookResponse: jsonResponse({ job: { id: "job", state: "ERROR" } }) })).statusCode, 502);
const accepted = await callApi();
assert.equal(accepted.statusCode, 202);
assert.equal(accepted.body.state, "pending");
assert.equal(accepted.body.requestedAt, generatedAt);
assert.equal(accepted.hookCalls, 1);
console.log("public-catalog-backup-check: ok (fallback generations, complete exports, image safety, permissions, pending acknowledgement)");
