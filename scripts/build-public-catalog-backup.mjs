import { createHash, randomUUID } from "node:crypto";
import { lookup } from "node:dns/promises";
import { mkdir, readFile, realpath, rename, rm, writeFile } from "node:fs/promises";
import { request } from "node:https";
import { isIP } from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import {
  PUBLIC_BACKUP_BASE,
  PUBLIC_BACKUP_VERSION,
  PUBLIC_CATALOG_COLUMNS,
  PUBLIC_CONTACT_COLUMNS,
  pickPublicColumns,
  validatePublicBackupManifest,
  validatePublicCatalogBackup,
  validatePublicSupabaseKey,
} from "../src/shared/publicCatalogBackupContract.mjs";

const PAGE_SIZE = 500;
const MAX_ROWS = 50_000;
const MAX_IMAGE_BYTES = 12 * 1024 * 1024;
const MAX_TOTAL_IMAGE_BYTES = 250 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 20_000;

function isWithin(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative !== "" && !relative.startsWith("..") && !path.isAbsolute(relative);
}

export function isPublicIp(address) {
  const ipVersion = isIP(address);
  if (ipVersion === 4) {
    const [a, b, c] = address.split(".").map(Number);
    return !(a === 0 || a === 10 || a === 127 || a >= 224 ||
      (a === 100 && b >= 64 && b <= 127) || (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) || (a === 192 && [0, 168].includes(b)) ||
      (a === 198 && [18, 19].includes(b)) || (a === 192 && b === 0 && c === 2) ||
      (a === 198 && b === 51 && c === 100) || (a === 203 && b === 0 && c === 113));
  }
  if (ipVersion === 6) {
    const normalized = address.toLowerCase();
    // Globally routed unicast only; mapped IPv4, loopback/link-local/ULA are rejected.
    return /^[23][0-9a-f]{0,3}:/.test(normalized) &&
      !/^2001:(?:0{1,4}|db8|10|20):/.test(normalized) &&
      !normalized.startsWith("2002:");
  }
  return false;
}

export function imageExtension(bytes, contentType) {
  const mime = contentType.split(";")[0].trim().toLowerCase();
  if (mime === "image/png" && bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return "png";
  if (mime === "image/jpeg" && bytes.subarray(0, 3).equals(Buffer.from([255, 216, 255]))) return "jpg";
  if (mime === "image/webp" && bytes.toString("ascii", 0, 4) === "RIFF" && bytes.toString("ascii", 8, 12) === "WEBP") return "webp";
  if (mime === "image/gif" && ["GIF87a", "GIF89a"].includes(bytes.toString("ascii", 0, 6))) return "gif";
  if (mime === "image/avif" && bytes.toString("ascii", 4, 8) === "ftyp" && /avif|avis/.test(bytes.toString("ascii", 8, 32))) return "avif";
  throw new Error("A catalog image is not a supported raster image.");
}

// DNS is checked AND pinned to the checked address. Each redirect is checked anew.
export async function downloadPublicImage(source, { lookupImpl = lookup, requestImpl = request } = {}, redirects = 0) {
  const url = new URL(source);
  if (url.protocol !== "https:" || url.username || url.password || (url.port && url.port !== "443") || redirects > 3) {
    throw new Error("A catalog image has an unsafe source.");
  }
  const hostname = url.hostname.replace(/^\[|\]$/g, "");
  let dnsTimer;
  const addresses = await Promise.race([
    lookupImpl(hostname, { all: true, verbatim: true }),
    new Promise((_, reject) => {
      dnsTimer = setTimeout(() => reject(new Error("A public catalog image could not be resolved.")), REQUEST_TIMEOUT_MS);
    }),
  ]).finally(() => clearTimeout(dnsTimer));
  if (!addresses.length || addresses.some(({ address }) => !isPublicIp(address))) {
    throw new Error("A catalog image resolves to a private or invalid address.");
  }
  const pinnedAddress = addresses[0];
  return new Promise((resolve, reject) => {
    const fail = () => reject(new Error("A public catalog image could not be copied."));
    const imageRequest = requestImpl(url, {
      method: "GET",
      autoSelectFamily: false,
      lookup: (_hostname, options, callback) => {
        if (options.all) callback(null, [pinnedAddress]);
        else callback(null, pinnedAddress.address, pinnedAddress.family);
      },
      headers: { Accept: "image/avif,image/webp,image/png,image/jpeg,image/gif" },
    }, (response) => {
      if ([301, 302, 303, 307, 308].includes(response.statusCode)) {
        response.resume();
        if (!response.headers.location) { fail(); return; }
        downloadPublicImage(new URL(response.headers.location, url).href, { lookupImpl, requestImpl }, redirects + 1)
          .then(resolve, reject);
        return;
      }
      if (response.statusCode !== 200) { response.resume(); fail(); return; }
      const chunks = [];
      let bytesRead = 0;
      response.on("data", (chunk) => {
        bytesRead += chunk.length;
        if (bytesRead > MAX_IMAGE_BYTES) { response.destroy(); fail(); return; }
        chunks.push(chunk);
      });
      response.on("error", fail);
      response.on("end", () => {
        try {
          const bytes = Buffer.concat(chunks);
          const extension = imageExtension(bytes, response.headers["content-type"] || "");
          resolve({ bytes, extension });
        } catch (error) { reject(error); }
      });
    });
    // Socket inactivity timeout plus an absolute bound, including slow drip responses.
    const requestTimer = setTimeout(() => { imageRequest.destroy(); fail(); }, REQUEST_TIMEOUT_MS);
    imageRequest.once("close", () => clearTimeout(requestTimer));
    imageRequest.setTimeout(REQUEST_TIMEOUT_MS, () => { imageRequest.destroy(); fail(); });
    imageRequest.on("error", fail);
    imageRequest.end();
  });
}

export async function readPublicView({ supabaseUrl, publicKey, view, columns, fetchImpl = fetch }) {
  if (!["catalog_activities_read", "activity_contact_options_read"].includes(view)) {
    throw new Error("Only allowlisted public views may be exported.");
  }
  const rows = [];
  let expectedTotal = null;
  for (let offset = 0; offset < MAX_ROWS; offset += PAGE_SIZE) {
    const url = new URL(`/rest/v1/${view}`, supabaseUrl);
    url.searchParams.set("select", columns.join(","));
    url.searchParams.set("order", "id.asc");
    const response = await fetchImpl(url, {
      headers: {
        apikey: publicKey,
        Authorization: `Bearer ${publicKey}`,
        Range: `${offset}-${offset + PAGE_SIZE - 1}`,
        "Range-Unit": "items",
        Prefer: "count=exact",
      },
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    });
    if (!response.ok) throw new Error("A public catalog view could not be exported.");
    const range = response.headers.get("content-range") || "";
    const match = range.match(/^(?:\d+-\d+|\*)\/(\d+)$/);
    if (!match) throw new Error("Public export requires a confirmed complete row count.");
    const total = Number(match[1]);
    if (total > MAX_ROWS || (expectedTotal !== null && total !== expectedTotal)) {
      throw new Error("Public catalog changed during export or exceeds the backup limit.");
    }
    expectedTotal = total;
    const page = await response.json();
    if (!Array.isArray(page) || page.length > PAGE_SIZE) throw new Error("Invalid public catalog export page.");
    rows.push(...page.map((row) => pickPublicColumns(row, columns)));
    if (rows.length === expectedTotal) return rows;
    if (page.length !== PAGE_SIZE || rows.length > expectedTotal) throw new Error("Incomplete public catalog export.");
  }
  throw new Error("Public catalog exceeds the backup limit.");
}

function resolveImageUrl(value, supabaseUrl) {
  if (typeof value !== "string" || !value.trim()) return "";
  const source = value.trim();
  if (source.startsWith("/") || /^https?:\/\//i.test(source)) return source;
  if (/^[a-z][a-z0-9+.-]*:/i.test(source)) throw new Error("A catalog image has an unsupported source.");
  const encoded = source.split("/").filter(Boolean).map(encodeURIComponent).join("/");
  return `${supabaseUrl}/storage/v1/object/public/activities/${encoded}`;
}

async function loadLocalImage(source, { publicDir, distDir }) {
  const pathname = decodeURIComponent(new URL(source, "https://local.invalid").pathname);
  for (const directory of [publicDir, distDir]) {
    const root = path.resolve(directory);
    const candidate = path.resolve(root, `.${pathname}`);
    if (!isWithin(root, candidate)) throw new Error("A catalog image has an unsafe local path.");
    let resolved;
    try { resolved = await realpath(candidate); } catch { continue; }
    if (!isWithin(root, resolved)) throw new Error("A catalog image is outside the public directory.");
    const bytes = await readFile(resolved);
    if (bytes.length > MAX_IMAGE_BYTES) throw new Error("A catalog image exceeds the backup limit.");
    // The existing repository-owned placeholder is a static SVG. It is not an
    // uploaded or remote image; keep this one reviewed asset in the public copy.
    if (pathname === "/placeholders/activity-card-placeholder.svg" &&
      bytes.equals(await readFile(path.join(publicDir, "placeholders/activity-card-placeholder.svg")))) {
      return { bytes, extension: "svg" };
    }
    const mime = { ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".png": "image/png", ".webp": "image/webp", ".gif": "image/gif", ".avif": "image/avif" }[path.extname(resolved).toLowerCase()] || "";
    return { bytes, extension: imageExtension(bytes, mime) };
  }
  throw new Error("A local catalog image is unavailable.");
}

export async function buildPublicCatalogBackup({
  supabaseUrl,
  publicKey,
  distDir = path.resolve("dist"),
  publicDir = path.resolve("public"),
  fetchImpl = fetch,
  downloadImage = downloadPublicImage,
  now = () => new Date(),
}) {
  validatePublicSupabaseKey(publicKey);
  const projectUrl = new URL(supabaseUrl);
  if (projectUrl.protocol !== "https:" || projectUrl.username || projectUrl.password || projectUrl.pathname !== "/" || projectUrl.search || projectUrl.hash) {
    throw new Error("Public export requires a valid HTTPS Supabase project URL.");
  }
  const root = path.resolve(distDir);
  const generationId = randomUUID();
  const stagingDirectory = path.resolve(root, `catalog-backup.work-${generationId}`);
  const outputDirectory = path.resolve(root, "catalog-backup");
  if (!isWithin(root, stagingDirectory) || !isWithin(root, outputDirectory)) throw new Error("Invalid backup output directory.");
  await mkdir(path.join(stagingDirectory, "images"), { recursive: true });
  try {
    const [activities, contactOptions] = await Promise.all([
      readPublicView({ supabaseUrl, publicKey, view: "catalog_activities_read", columns: PUBLIC_CATALOG_COLUMNS, fetchImpl }),
      readPublicView({ supabaseUrl, publicKey, view: "activity_contact_options_read", columns: PUBLIC_CONTACT_COLUMNS, fetchImpl }),
    ]);
    const copiedSources = new Map();
    const copiedImages = new Set();
    let imageBytes = 0;
    for (const activity of activities) {
      const source = resolveImageUrl(activity.image_url, supabaseUrl.replace(/\/+$/, ""));
      if (!source) { activity.image_url = ""; continue; }
      if (!copiedSources.has(source)) {
        const { bytes, extension } = source.startsWith("/")
          ? await loadLocalImage(source, { publicDir, distDir })
          : await downloadImage(source);
        if (!Buffer.isBuffer(bytes) || bytes.length > MAX_IMAGE_BYTES ||
          !["jpg", "png", "webp", "gif", "avif", "svg"].includes(extension) ||
          (extension === "svg" && source !== "/placeholders/activity-card-placeholder.svg")) {
          throw new Error("A catalog image could not be copied safely.");
        }
        const filename = `${createHash("sha256").update(bytes).digest("hex")}.${extension}`;
        if (!copiedImages.has(filename)) {
          imageBytes += bytes.length;
          if (imageBytes > MAX_TOTAL_IMAGE_BYTES) throw new Error("Public catalog images exceed the backup size limit.");
          await writeFile(path.join(stagingDirectory, "images", filename), bytes);
          copiedImages.add(filename);
        }
        copiedSources.set(source, `${PUBLIC_BACKUP_BASE}/images/${filename}`);
      }
      activity.image_url = copiedSources.get(source);
    }
    // generatedAt records a successful capture, not a deploy request acknowledgement.
    const generatedAt = now().toISOString();
    const manifest = validatePublicBackupManifest({
      version: PUBLIC_BACKUP_VERSION,
      generationId,
      generatedAt,
      activityCount: activities.length,
      contactCount: contactOptions.length,
      imageCount: copiedImages.size,
      imageBytes,
    });
    const snapshot = validatePublicCatalogBackup({ version: PUBLIC_BACKUP_VERSION, generationId, generatedAt, activities, contactOptions }, manifest);
    const encodedSnapshot = JSON.stringify(snapshot);
    if (encodedSnapshot.length > 25_000_000) throw new Error("Public catalog JSON exceeds the backup limit.");
    await writeFile(path.join(stagingDirectory, "catalog.json"), encodedSnapshot);
    await writeFile(path.join(stagingDirectory, "manifest.json"), JSON.stringify(manifest));
    // These paths were checked against the absolute build output root above.
    await rm(outputDirectory, { recursive: true, force: true });
    await rename(stagingDirectory, outputDirectory);
    return manifest;
  } catch (error) {
    await rm(stagingDirectory, { recursive: true, force: true });
    throw error;
  }
}

async function main() {
  const environment = { ...loadEnv("production", process.cwd(), ""), ...process.env };
  const manifest = await buildPublicCatalogBackup({
    supabaseUrl: environment.VITE_SUPABASE_URL?.trim(),
    publicKey: environment.VITE_SUPABASE_ANON_KEY?.trim(),
  });
  console.log(`public-catalog-backup: ${manifest.activityCount} activities, ${manifest.contactCount} contacts, ${manifest.imageCount} local images.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch(() => {
    // Never echo HTTP errors, signed URLs or configuration credentials into build logs.
    console.error("public-catalog-backup: export failed; no new deployment should be published. Check public view access and catalog images.");
    process.exitCode = 1;
  });
}
