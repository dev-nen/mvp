import assert from "node:assert/strict";
import {
  PUBLIC_BACKUP_DATA_URL,
  PUBLIC_BACKUP_MANIFEST_URL,
  validatePublicCatalogBackup,
} from "../src/shared/publicCatalogBackupContract.mjs";

// Explicit target only: never assume a main-branch preview represents this task.
// No credentials, private reports, mutations or deploy hooks are used here.
const argument = process.argv.find((value) => value.startsWith("--preview-url="));
const local = process.argv.includes("--local");

async function request(site, pathname, method = "GET") {
  const response = await fetch(new URL(pathname, site), {
    method, redirect: "manual", cache: "no-store", signal: AbortSignal.timeout(15_000),
  });
  assert.ok(response.status < 300 || response.status >= 400,
    "A deployment redirect prevented verification. If Vercel authentication is required, review the authenticated preview in a browser.");
  assert.ok(![401, 403].includes(response.status) || pathname === "/api/internal/catalog-backup",
    "Deployment protection prevented verification. Review the authenticated preview in a browser.");
  return response;
}

try {
  assert.ok(argument, "Provide --preview-url=<the approved deployment URL>.");
  const site = new URL(argument.slice("--preview-url=".length));
  assert.ok(["http:", "https:"].includes(site.protocol) && !site.username && !site.password && !site.search && !site.hash, "Invalid preview URL.");
  assert.ok(!local || ["localhost", "127.0.0.1", "[::1]"].includes(site.hostname), "--local is only for a local Vite preview.");
  const home = await request(site, "/");
  assert.ok(home.ok && (await home.text()).includes("NensGo"), "Preview home is unavailable.");
  console.log("PASS preview home responds");

  const [manifestResponse, snapshotResponse] = await Promise.all([
    request(site, PUBLIC_BACKUP_MANIFEST_URL), request(site, PUBLIC_BACKUP_DATA_URL),
  ]);
  assert.ok(manifestResponse.ok && snapshotResponse.ok, "Public backup files are unavailable.");
  const manifest = await manifestResponse.json();
  const snapshot = validatePublicCatalogBackup(await snapshotResponse.json(), manifest);
  const images = [...new Set(snapshot.activities.map((activity) => activity.image_url).filter(Boolean))];
  for (const pathname of images) {
    const response = await request(site, pathname, "HEAD");
    assert.ok(response.ok && response.headers.get("content-type")?.startsWith("image/"), "A copied public image is unavailable.");
  }
  console.log(`PASS confirmed public generation: ${snapshot.activities.length} activities, ${snapshot.contactOptions.length} contacts, ${images.length} copied images`);

  if (local) {
    console.log("Partial: Vite preview does not serve Vercel APIs; API permissions are covered by check:backup and require deployed verification.");
  } else {
    assert.equal((await request(site, "/api/internal/pvi")).status, 410, "Retired statistics API must return 410.");
    assert.equal((await request(site, "/api/internal/catalog-backup", "POST")).status, 401, "Backup API must deny unauthenticated requests without triggering a build.");
    console.log("PASS retired statistics and unauthenticated backup denial");
  }
  console.log("Browser checks remain required: languages, mobile, contacts, both administrators and simulated database outage.");
} catch (error) {
  console.error(`FAIL preview check: ${error instanceof Error ? error.message : "Verification could not complete."}`);
  process.exitCode = 1;
}
