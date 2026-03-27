const SESSION_STORAGE_KEY = "nendo_session_id";

function generateSessionId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  return `nendo-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
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

    const nextSessionId = generateSessionId();

    window.localStorage.setItem(SESSION_STORAGE_KEY, nextSessionId);

    return nextSessionId;
  } catch {
    return null;
  }
}
