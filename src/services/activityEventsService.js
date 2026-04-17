import {
  getSupabaseClient,
  getSupabaseClientError,
  isSupabaseReady,
} from "@/services/supabaseClient";
import { getOrCreateSessionId } from "@/helpers/sessionId";

export const ACTIVITY_VIEW_MORE_EVENT = "activity_view_more";
export const ACTIVITY_CONTACT_CLICK_EVENT = "activity_contact_click";
export const ACTIVITY_FAVORITE_ADD_EVENT = "activity_favorite_add";
export const ACTIVITY_FAVORITE_REMOVE_EVENT = "activity_favorite_remove";

export const CATALOG_CARD_SOURCE = "catalog_card";
export const CATALOG_MODAL_SOURCE = "catalog_modal";
export const FAVORITES_DETAIL_SOURCE = "favorites_detail";

export const ACTIVITY_EVENTS_AVAILABILITY_READY = "ready";
export const ACTIVITY_EVENTS_AVAILABILITY_UNAVAILABLE = "unavailable";

export const ACTIVITY_EVENTS_REASON_SUPABASE_NOT_CONFIGURED =
  "supabase_not_configured";
export const ACTIVITY_EVENTS_REASON_ACTIVITY_EVENTS_MISSING =
  "activity_events_missing";
export const ACTIVITY_EVENTS_REASON_ACTIVITY_EVENTS_FORBIDDEN =
  "activity_events_forbidden";

function warnInDev(message, error) {
  if (!import.meta.env.DEV) {
    return;
  }

  console.warn(message, error);
}

function errorInDev(message, context) {
  if (!import.meta.env.DEV) {
    return;
  }

  console.error(message, context);
}

function buildUnavailableActivityEventsResult(reason, message, error) {
  warnInDev("[activity-events] Lectura de PVI no disponible.", {
    reason,
    message,
    error,
  });

  return {
    availability: ACTIVITY_EVENTS_AVAILABILITY_UNAVAILABLE,
    reason,
    message,
    events: [],
  };
}

function buildActivityEventsReadErrorText(error) {
  return [error?.code, error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function isActivityEventsMissingError(error) {
  const errorText = buildActivityEventsReadErrorText(error);

  if (error?.code === "PGRST205" || error?.code === "42P01") {
    return true;
  }

  return (
    errorText.includes("activity_events") &&
    (errorText.includes("could not find the table") ||
      errorText.includes("schema cache") ||
      errorText.includes("does not exist"))
  );
}

function isActivityEventsForbiddenError(error) {
  const errorText = buildActivityEventsReadErrorText(error);

  if (error?.code === "42501") {
    return true;
  }

  return (
    errorText.includes("permission denied") ||
    errorText.includes("forbidden") ||
    errorText.includes("not allowed") ||
    errorText.includes("row-level security")
  );
}

function normalizeActivityEventActivityId(activityId) {
  if (typeof activityId === "number" && Number.isInteger(activityId)) {
    return activityId;
  }

  if (typeof activityId === "string" && /^\d+$/.test(activityId.trim())) {
    return Number(activityId);
  }

  return null;
}

function getTrackingPayload(activity, source, eventName, options = {}) {
  const normalizedActivityId = normalizeActivityEventActivityId(activity.id);

  if (normalizedActivityId === null) {
    return null;
  }

  const basePayload = {
    event_name: eventName,
    activity_id: normalizedActivityId,
    activity_title_snapshot: activity.title,
    city_name_snapshot: activity.city_name || null,
    source,
  };

  if (options.sessionId) {
    basePayload.session_id = options.sessionId;
  }

  if (eventName === ACTIVITY_CONTACT_CLICK_EVENT) {
    return {
      ...basePayload,
      contact_method: options.contactMethod,
    };
  }

  if (
    eventName === ACTIVITY_FAVORITE_ADD_EVENT ||
    eventName === ACTIVITY_FAVORITE_REMOVE_EVENT
  ) {
    return {
      ...basePayload,
      contact_method: null,
    };
  }

  return basePayload;
}

export async function listActivityEvents() {
  const supabaseClient = getSupabaseClient();

  if (!supabaseClient) {
    return buildUnavailableActivityEventsResult(
      ACTIVITY_EVENTS_REASON_SUPABASE_NOT_CONFIGURED,
      "Supabase no esta configurado en este entorno para leer activity_events.",
      getSupabaseClientError() ||
        "Supabase no esta disponible para cargar las interacciones.",
    );
  }

  const { data, error } = await supabaseClient
    .from("activity_events")
    .select(
      "id, event_name, activity_id, activity_title_snapshot, city_name_snapshot, source, contact_method, session_id, created_at",
    )
    .in("event_name", [
      ACTIVITY_VIEW_MORE_EVENT,
      ACTIVITY_CONTACT_CLICK_EVENT,
      ACTIVITY_FAVORITE_ADD_EVENT,
      ACTIVITY_FAVORITE_REMOVE_EVENT,
    ])
    .order("created_at", { ascending: false });

  if (error) {
    if (isActivityEventsMissingError(error)) {
      return buildUnavailableActivityEventsResult(
        ACTIVITY_EVENTS_REASON_ACTIVITY_EVENTS_MISSING,
        "activity_events no existe o todavia no esta disponible en este entorno.",
        error,
      );
    }

    if (isActivityEventsForbiddenError(error)) {
      return buildUnavailableActivityEventsResult(
        ACTIVITY_EVENTS_REASON_ACTIVITY_EVENTS_FORBIDDEN,
        "Las credenciales actuales no pueden leer activity_events en este entorno.",
        error,
      );
    }

    errorInDev("[activity-events] Error inesperado al leer activity_events.", {
      error,
    });
    throw new Error(
      "No pudimos cargar las interacciones desde activity_events.",
    );
  }

  return {
    availability: ACTIVITY_EVENTS_AVAILABILITY_READY,
    events: data ?? [],
  };
}

async function insertActivityEvent(payload) {
  if (!isSupabaseReady()) {
    warnInDev(
      "[activity-events] Supabase no configurado. Evento omitido.",
      getSupabaseClientError(),
    );
    return;
  }

  const supabaseClient = getSupabaseClient();
  const { error } = await supabaseClient.from("activity_events").insert(payload);

  if (error) {
    errorInDev("[activity-events] No pudimos registrar el evento.", {
      event_name: payload.event_name,
      activity_id: payload.activity_id,
      source: payload.source,
      error,
    });
  }
}

export async function trackActivityViewMore(activity, source) {
  if (!activity?.id) {
    return;
  }

  const sessionId = getOrCreateSessionId();
  const payload = getTrackingPayload(
    activity,
    source,
    ACTIVITY_VIEW_MORE_EVENT,
    {
      sessionId,
    },
  );

  if (!payload) {
    warnInDev("[activity-events] Payload invalido para activity_view_more.", {
      event_name: ACTIVITY_VIEW_MORE_EVENT,
      activity_id: activity.id,
      source,
      error:
        "activity_events.activity_id exige bigint y el frontend esta enviando un id no numerico.",
    });
    return;
  }

  await insertActivityEvent(payload);
}

export async function trackActivityContactClick(
  activity,
  source,
  contactMethod = "whatsapp",
) {
  if (!activity?.id) {
    return;
  }

  const sessionId = getOrCreateSessionId();
  const payload = getTrackingPayload(
    activity,
    source,
    ACTIVITY_CONTACT_CLICK_EVENT,
    {
      contactMethod,
      sessionId,
    },
  );

  if (!payload) {
    warnInDev("[activity-events] Payload invalido para activity_contact_click.", {
      event_name: ACTIVITY_CONTACT_CLICK_EVENT,
      activity_id: activity.id,
      source,
      error:
        "activity_events.activity_id exige bigint y el frontend esta enviando un id no numerico.",
    });
    return;
  }

  await insertActivityEvent(payload);
}

export async function trackActivityFavoriteAdd(activity, source, sessionId) {
  if (!activity?.id) {
    return;
  }

  const resolvedSessionId = sessionId || getOrCreateSessionId();
  const payload = getTrackingPayload(
    activity,
    source,
    ACTIVITY_FAVORITE_ADD_EVENT,
    {
      sessionId: resolvedSessionId,
    },
  );

  if (!payload) {
    warnInDev("[activity-events] Payload invalido para activity_favorite_add.", {
      event_name: ACTIVITY_FAVORITE_ADD_EVENT,
      activity_id: activity.id,
      source,
      error:
        "activity_events.activity_id exige bigint y el frontend esta enviando un id no numerico.",
    });
    return;
  }

  await insertActivityEvent(payload);
}

export async function trackActivityFavoriteRemove(activity, source, sessionId) {
  if (!activity?.id) {
    return;
  }

  const resolvedSessionId = sessionId || getOrCreateSessionId();
  const payload = getTrackingPayload(
    activity,
    source,
    ACTIVITY_FAVORITE_REMOVE_EVENT,
    {
      sessionId: resolvedSessionId,
    },
  );

  if (!payload) {
    warnInDev(
      "[activity-events] Payload invalido para activity_favorite_remove.",
      {
        event_name: ACTIVITY_FAVORITE_REMOVE_EVENT,
        activity_id: activity.id,
        source,
        error:
          "activity_events.activity_id exige bigint y el frontend esta enviando un id no numerico.",
      },
    );
    return;
  }

  await insertActivityEvent(payload);
}
