const DEFAULT_RECOVERY_VERSION = 1;

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

function getSessionStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.sessionStorage;
  } catch {
    return null;
  }
}

export function readFormLocalRecovery({
  storageKey,
  version = DEFAULT_RECOVERY_VERSION,
  sanitizePayload,
}) {
  const storage = getSessionStorage();

  if (!storage || !storageKey) {
    return null;
  }

  try {
    const storedValue = storage.getItem(storageKey);

    if (!storedValue) {
      return null;
    }

    const storedPayload = JSON.parse(storedValue);

    if (!isPlainObject(storedPayload) || storedPayload.version !== version) {
      return null;
    }

    const nextPayload =
      typeof sanitizePayload === "function"
        ? sanitizePayload(storedPayload)
        : storedPayload;

    return isPlainObject(nextPayload) ? nextPayload : null;
  } catch {
    return null;
  }
}

export function writeFormLocalRecovery({
  storageKey,
  version = DEFAULT_RECOVERY_VERSION,
  payload,
  sanitizePayload,
}) {
  const storage = getSessionStorage();

  if (!storage || !storageKey) {
    return false;
  }

  try {
    const nextPayload =
      typeof sanitizePayload === "function" ? sanitizePayload(payload) : payload;

    if (!isPlainObject(nextPayload)) {
      storage.removeItem(storageKey);
      return false;
    }

    storage.setItem(
      storageKey,
      JSON.stringify({
        ...nextPayload,
        savedAt: new Date().toISOString(),
        version,
      }),
    );

    return true;
  } catch {
    return false;
  }
}

export function clearFormLocalRecovery(storageKey) {
  const storage = getSessionStorage();

  if (!storage || !storageKey) {
    return;
  }

  try {
    storage.removeItem(storageKey);
  } catch {
    // Browser-local recovery is best effort only.
  }
}
