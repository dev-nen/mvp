// Shared by the build exporter and browser. No private Supabase model belongs here.
export const PUBLIC_BACKUP_VERSION = 1;
export const PUBLIC_BACKUP_BASE = "/catalog-backup";
export const PUBLIC_BACKUP_MANIFEST_URL = `${PUBLIC_BACKUP_BASE}/manifest.json`;
export const PUBLIC_BACKUP_DATA_URL = `${PUBLIC_BACKUP_BASE}/catalog.json`;
export const PUBLIC_CATALOG_COLUMNS = Object.freeze([
  "id", "title", "center_id", "center_name", "city_id", "city_name",
  "category_id", "category_label", "type_id", "type_label", "description",
  "description_format", "short_description", "image_url", "age_rule_type",
  "age_min", "age_max", "price_label", "is_free", "schedule_label",
  "venue_name", "venue_address_1", "venue_postal_code", "is_featured", "created_at",
]);
export const PUBLIC_CONTACT_COLUMNS = Object.freeze([
  "id", "activity_id", "contact_method", "contact_value", "contact_label",
]);
const IMAGE_PATH = /^\/catalog-backup\/images\/[a-f0-9]{64}\.(?:jpg|png|webp|gif|avif|svg)$/;
const SNAPSHOT_KEYS = ["version", "generationId", "generatedAt", "activities", "contactOptions"];
const MANIFEST_KEYS = ["version", "generationId", "generatedAt", "activityCount", "contactCount", "imageCount", "imageBytes"];
const MAX_ROWS = 50_000;

function isRecord(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function hasOnlyKeys(record, allowedKeys) {
  return isRecord(record) && Object.keys(record).every((key) => allowedKeys.includes(key));
}

function isIdentifier(value) {
  return (typeof value === "number" && Number.isSafeInteger(value)) ||
    (typeof value === "string" && value.length > 0 && value.length < 200);
}

export function pickPublicColumns(row, columns) {
  if (!isRecord(row)) throw new Error("Invalid public row.");
  return Object.fromEntries(columns.map((key) => [key, row[key] ?? null]));
}

function validateRows(rows, columns) {
  if (!Array.isArray(rows) || rows.length > MAX_ROWS) throw new Error("Invalid public backup rows.");
  for (const row of rows) {
    if (!hasOnlyKeys(row, columns) || !isIdentifier(row.id)) throw new Error("Invalid public backup row.");
    for (const value of Object.values(row)) {
      if (value !== null && !["string", "number", "boolean"].includes(typeof value)) {
        throw new Error("Non-public value in backup.");
      }
      if ((typeof value === "number" && !Number.isFinite(value)) ||
        (typeof value === "string" && value.length > 2_000_000)) {
        throw new Error("Invalid public backup value.");
      }
    }
  }
  const identifiers = rows.map((row) => String(row.id));
  if (new Set(identifiers).size !== identifiers.length) throw new Error("Duplicate public backup row.");
}

function validateGeneration(value) {
  if (value.version !== PUBLIC_BACKUP_VERSION ||
    typeof value.generationId !== "string" || !/^[a-f0-9-]{36}$/.test(value.generationId) ||
    typeof value.generatedAt !== "string" || !Number.isFinite(Date.parse(value.generatedAt))) {
    throw new Error("Invalid public backup generation.");
  }
}

export function validatePublicBackupManifest(value) {
  if (!hasOnlyKeys(value, MANIFEST_KEYS)) throw new Error("Invalid public backup manifest.");
  validateGeneration(value);
  for (const key of ["activityCount", "contactCount", "imageCount", "imageBytes"]) {
    if (!Number.isSafeInteger(value[key]) || value[key] < 0) throw new Error("Invalid public backup counts.");
  }
  return value;
}

export function validatePublicCatalogBackup(value, manifest = null) {
  if (!hasOnlyKeys(value, SNAPSHOT_KEYS)) throw new Error("Invalid public catalog backup.");
  validateGeneration(value);
  validateRows(value.activities, PUBLIC_CATALOG_COLUMNS);
  validateRows(value.contactOptions, PUBLIC_CONTACT_COLUMNS);
  const activityIds = new Set(value.activities.map((row) => String(row.id)));
  for (const activity of value.activities) {
    if (activity.image_url !== null && activity.image_url !== "" && !IMAGE_PATH.test(activity.image_url)) {
      throw new Error("Backup images must be local public copies.");
    }
  }
  for (const contact of value.contactOptions) {
    if (!activityIds.has(String(contact.activity_id))) throw new Error("Contact outside public catalog.");
  }
  if (manifest) {
    validatePublicBackupManifest(manifest);
    if (manifest.generationId !== value.generationId || manifest.generatedAt !== value.generatedAt ||
      manifest.activityCount !== value.activities.length || manifest.contactCount !== value.contactOptions.length) {
      throw new Error("Public backup generation mismatch.");
    }
  }
  return value;
}

export function validatePublicSupabaseKey(key) {
  if (typeof key !== "string" || !key.trim() || key.startsWith("sb_secret_")) {
    throw new Error("A public Supabase key is required.");
  }
  if (key.startsWith("sb_publishable_")) return key;
  try {
    const payload = JSON.parse(atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
    if (payload.role === "anon") return key;
  } catch { /* Reject malformed and server-only credentials. */ }
  throw new Error("Only an anon or publishable Supabase key may export public data.");
}
