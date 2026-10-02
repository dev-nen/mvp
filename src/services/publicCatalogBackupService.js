import {
  PUBLIC_BACKUP_DATA_URL,
  PUBLIC_BACKUP_MANIFEST_URL,
  validatePublicBackupManifest,
  validatePublicCatalogBackup,
} from "../shared/publicCatalogBackupContract.mjs";

export const PUBLIC_READ_TIMEOUT_MS = 8_000;

export async function withPublicReadTimeout(read, timeoutMs = PUBLIC_READ_TIMEOUT_MS) {
  const controller = new AbortController();
  let timer;
  try {
    return await Promise.race([
      Promise.resolve().then(() => read(controller.signal)),
      new Promise((_, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(new Error("Public catalog read timed out."));
        }, timeoutMs);
      }),
    ]);
  } finally {
    clearTimeout(timer);
  }
}

// A page using the backup must use its contacts too, rather than mixing generations.
export function createPublicCatalogBackupReader({ fetchImpl = globalThis.fetch, timeoutMs } = {}) {
  let activeSnapshot = null;
  let cachedSnapshot = null;
  let loadingSnapshot = null;
  let catalogReadVersion = 0;

  async function readJson(url) {
    return withPublicReadTimeout(async (signal) => {
      const response = await fetchImpl(url, { signal, cache: "no-store" });
      if (!response.ok) throw new Error("Public backup is unavailable.");
      const body = await response.text();
      if (body.length > 25_000_000) throw new Error("Public backup is too large.");
      return JSON.parse(body);
    }, timeoutMs);
  }

  async function loadSnapshot() {
    if (cachedSnapshot) return cachedSnapshot;
    if (!loadingSnapshot) {
      loadingSnapshot = (async () => {
        const [manifest, snapshot] = await Promise.all([
          readJson(PUBLIC_BACKUP_MANIFEST_URL),
          readJson(PUBLIC_BACKUP_DATA_URL),
        ]);
        cachedSnapshot = validatePublicCatalogBackup(snapshot, manifest);
        return cachedSnapshot;
      })().finally(() => { loadingSnapshot = null; });
    }
    return loadingSnapshot;
  }

  return {
    loadSnapshot,
    getActiveSnapshot: () => activeSnapshot,
    async readCatalog(liveRead) {
      const requestVersion = ++catalogReadVersion;
      try {
        const rows = await withPublicReadTimeout(liveRead, timeoutMs);
        if (requestVersion === catalogReadVersion) activeSnapshot = null;
        return rows;
      } catch {
        const snapshot = await loadSnapshot();
        if (requestVersion === catalogReadVersion) activeSnapshot = snapshot;
        return snapshot.activities;
      }
    },
    async readContacts(activityId, liveRead) {
      const contactsIn = (snapshot) => snapshot.contactOptions.filter(
        (contact) => String(contact.activity_id) === String(activityId),
      );
      if (activeSnapshot) return contactsIn(activeSnapshot);
      try {
        const liveRows = await withPublicReadTimeout(liveRead, timeoutMs);
        return activeSnapshot ? contactsIn(activeSnapshot) : liveRows;
      } catch {
        // A partial contact outage uses the same confirmed backup for this lookup.
        return contactsIn(await loadSnapshot());
      }
    },
    async readManifest() {
      return validatePublicBackupManifest(await readJson(PUBLIC_BACKUP_MANIFEST_URL));
    },
  };
}

export const publicCatalogBackupReader = createPublicCatalogBackupReader();

export async function readPublicBackupManifest() {
  return publicCatalogBackupReader.readManifest();
}
