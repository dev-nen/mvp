import {
  getSupabaseClient,
  getSupabaseClientError,
  isSupabaseReady,
} from "@/services/supabaseClient";

export const CATALOG_CARD_SOURCE = "catalog_card";
export const CATALOG_MODAL_SOURCE = "catalog_modal";
export const FAVORITES_DETAIL_SOURCE = "favorites_detail";

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

function normalizeActivityEventActivityId(activityId) {
  if (typeof activityId === "number" && Number.isInteger(activityId)) {
    return activityId;
  }

  if (typeof activityId === "string" && /^\d+$/.test(activityId.trim())) {
    return Number(activityId);
  }

  return null;
}

function normalizeActivityEventCityId(cityId) {
  if (typeof cityId === "number" && Number.isInteger(cityId)) {
    return cityId;
  }

  if (typeof cityId === "string" && /^\d+$/.test(cityId.trim())) {
    return Number(cityId);
  }

  return null;
}

async function getCurrentUserProfileId() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { session },
  } = await supabase.auth.getSession();

  return session?.user?.id ?? null;
}

async function insertActivityViewEvent(payload) {
  if (!isSupabaseReady()) {
    warnInDev(
      "[activity-events] Supabase no configurado. Evento de vista omitido.",
      getSupabaseClientError(),
    );
    return;
  }

  const supabaseClient = getSupabaseClient();
  const { error } = await supabaseClient.from("activity_view_events").insert(payload);

  if (error) {
    errorInDev("[activity-events] No pudimos registrar la vista.", {
      activity_id: payload.activity_id,
      source: payload.source,
      error,
    });
  }
}

async function insertActivityContactEvent(payload) {
  if (!isSupabaseReady()) {
    warnInDev(
      "[activity-events] Supabase no configurado. Evento de contacto omitido.",
      getSupabaseClientError(),
    );
    return;
  }

  const supabaseClient = getSupabaseClient();
  const { error } = await supabaseClient
    .from("activity_contact_events")
    .insert(payload);

  if (error) {
    errorInDev("[activity-events] No pudimos registrar el contacto.", {
      activity_id: payload.activity_id,
      source: payload.source,
      contact_method: payload.contact_method,
      error,
    });
  }
}

export async function trackActivityViewMore(activity, source) {
  if (!activity?.id) {
    return;
  }

  const normalizedActivityId = normalizeActivityEventActivityId(activity.id);
  const normalizedCityId = normalizeActivityEventCityId(activity.city_id);

  if (normalizedActivityId === null || normalizedCityId === null) {
    warnInDev("[activity-events] Payload invalido para activity_view_events.", {
      activity_id: activity.id,
      source,
      city_id: activity.city_id,
    });
    return;
  }

  await insertActivityViewEvent({
    activity_id: normalizedActivityId,
    user_profile_id: await getCurrentUserProfileId(),
    city_snapshot_id: normalizedCityId,
    source,
  });
}

export async function trackActivityContactClick(activity, source, contactOption) {
  if (!activity?.id || !contactOption?.contactMethod || !contactOption?.contactValue) {
    return;
  }

  const normalizedActivityId = normalizeActivityEventActivityId(activity.id);
  const normalizedCityId = normalizeActivityEventCityId(activity.city_id);

  if (normalizedActivityId === null || normalizedCityId === null) {
    warnInDev("[activity-events] Payload invalido para activity_contact_events.", {
      activity_id: activity.id,
      source,
      city_id: activity.city_id,
      contact_method: contactOption.contactMethod,
    });
    return;
  }

  await insertActivityContactEvent({
    activity_id: normalizedActivityId,
    user_profile_id: await getCurrentUserProfileId(),
    city_snapshot_id: normalizedCityId,
    contact_method: contactOption.contactMethod,
    contact_target_snapshot: contactOption.contactValue,
    source,
  });
}
