const SESSION_STORAGE_KEY = "nensgo_session_id";
const LEGACY_STORAGE_PREFIX = ["nen", "do"].join("");
const LEGACY_SESSION_STORAGE_KEY = `${LEGACY_STORAGE_PREFIX}_session_id`;

function generateSessionId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `nensgo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getOrCreateSessionId() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    const existingSessionId = window.localStorage.getItem(SESSION_STORAGE_KEY);

    if (existingSessionId) {
      return existingSessionId;
    }

    const legacySessionId = window.localStorage.getItem(
      LEGACY_SESSION_STORAGE_KEY,
    );

    if (legacySessionId) {
      window.localStorage.setItem(SESSION_STORAGE_KEY, legacySessionId);
      window.localStorage.removeItem(LEGACY_SESSION_STORAGE_KEY);
      return legacySessionId;
    }

    const nextSessionId = generateSessionId();

    window.localStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);

    return nextSessionId;
  } catch {
    return null;
  }
}
