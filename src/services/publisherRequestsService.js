import {
  getDefaultPublisherStatus,
  normalizePublisherStatus,
} from "@/helpers/publisherStatus";
import {
  getSupabaseClient,
  getSupabaseClientError,
} from "@/services/supabaseClient";

const ORGANIZER_TYPES = ["individual", "company_or_entity"];

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getPayload(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function getFeedbackItems(value) {
  return Array.isArray(value) ? value : [];
}

function getBoolean(value) {
  return value === true;
}

function getNumericId(value) {
  const numericValue = Number(value);

  return Number.isFinite(numericValue) && numericValue > 0
    ? numericValue
    : null;
}

function normalizeOrganizerType(value) {
  const normalizedValue = getTrimmedText(value).toLowerCase();

  return ORGANIZER_TYPES.includes(normalizedValue)
    ? normalizedValue
    : "individual";
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error(
      getSupabaseClientError() ||
        "No pudimos conectar con Supabase para gestionar tu solicitud.",
    );
  }

  return supabase;
}

function normalizePublisherRequest(value = {}) {
  const row = getPayload(value);

  return {
    activityDescription: getTrimmedText(row.activity_description),
    addressLine1: getTrimmedText(row.address_line_1),
    cityId: row.city_id ?? null,
    commercialName: getTrimmedText(row.commercial_name),
    fullName: getTrimmedText(row.full_name),
    hasPhysicalLocation: row.has_physical_location === true,
    id: row.id ?? null,
    instagram: getTrimmedText(row.instagram),
    organizerType: normalizeOrganizerType(row.organizer_type),
    phone: getTrimmedText(row.phone),
    status: normalizePublisherStatus(row.status || row.review_status),
    submittedAt: row.submitted_at ?? "",
    updatedAt: row.updated_at ?? "",
    userFeedbackJson: getFeedbackItems(row.user_feedback_json),
    userFeedbackSummary: getTrimmedText(row.user_feedback_summary),
    website: getTrimmedText(row.website),
  };
}

function normalizePublisherProfile(value = {}) {
  const row = getPayload(value);

  if (!row.id) {
    return null;
  }

  return {
    activityDescription: getTrimmedText(row.activity_description),
    addressLine1: getTrimmedText(row.address_line_1),
    approvedAt: row.approved_at ?? "",
    cityId: row.city_id ?? null,
    commercialName: getTrimmedText(row.commercial_name),
    fullName: getTrimmedText(row.full_name),
    hasPhysicalLocation: row.has_physical_location === true,
    id: row.id,
    instagram: getTrimmedText(row.instagram),
    organizerType: normalizeOrganizerType(row.organizer_type),
    phone: getTrimmedText(row.phone),
    website: getTrimmedText(row.website),
  };
}

function normalizeMyPublisherStatusRow(row = {}) {
  const status = normalizePublisherStatus(row.status);
  const latestRequest = row.latest_request
    ? normalizePublisherRequest(row.latest_request)
    : null;
  const activeProfile = row.active_profile
    ? normalizePublisherProfile(row.active_profile)
    : null;

  return {
    activeProfile,
    canRequest: row.can_request === true,
    canResubmit: row.can_resubmit === true,
    canSubmitActivities: row.can_submit_activities === true,
    latestRequest,
    latestRequestId: row.latest_request_id ?? latestRequest?.id ?? null,
    status,
    userFeedbackJson: getFeedbackItems(row.user_feedback_json),
    userFeedbackSummary: getTrimmedText(row.user_feedback_summary),
  };
}

function buildPublisherRequestPayload(payload = {}) {
  const cityId = getNumericId(payload.cityId ?? payload.city_id);

  return {
    activity_description: getTrimmedText(
      payload.activityDescription ?? payload.activity_description,
    ),
    address_line_1: getTrimmedText(payload.addressLine1 ?? payload.address_line_1),
    city_id: cityId,
    commercial_name: getTrimmedText(
      payload.commercialName ?? payload.commercial_name,
    ),
    full_name: getTrimmedText(payload.fullName ?? payload.full_name),
    has_physical_location: getBoolean(
      payload.hasPhysicalLocation ?? payload.has_physical_location,
    ),
    instagram: getTrimmedText(payload.instagram),
    organizer_type: normalizeOrganizerType(
      payload.organizerType ?? payload.organizer_type,
    ),
    phone: getTrimmedText(payload.phone),
    website: getTrimmedText(payload.website),
  };
}

function normalizeInternalPublisherRequestRow(row = {}) {
  return {
    activityDescription: getTrimmedText(row.activity_description),
    addressLine1: getTrimmedText(row.address_line_1),
    cityId: row.city_id ?? null,
    cityName: getTrimmedText(row.city_name),
    commercialName: getTrimmedText(row.commercial_name),
    createdAt: row.created_at ?? "",
    fullName: getTrimmedText(row.full_name),
    hasPhysicalLocation: row.has_physical_location === true,
    instagram: getTrimmedText(row.instagram),
    internalReviewNotes: getTrimmedText(row.internal_review_notes),
    organizerType: normalizeOrganizerType(row.organizer_type),
    phone: getTrimmedText(row.phone),
    requestId: row.request_id ?? null,
    reviewStatus: normalizePublisherStatus(row.review_status),
    reviewedAt: row.reviewed_at ?? "",
    submittedAt: row.submitted_at ?? "",
    updatedAt: row.updated_at ?? "",
    userEmail: getTrimmedText(row.user_email),
    userFeedbackJson: getFeedbackItems(row.user_feedback_json),
    userFeedbackSummary: getTrimmedText(row.user_feedback_summary),
    website: getTrimmedText(row.website),
  };
}

function normalizeReviewActionResult(data) {
  const row = Array.isArray(data) ? data[0] : data;

  return {
    profileId: row?.profile_id ?? null,
    requestId: row?.request_id ?? null,
    reviewStatus: normalizePublisherStatus(row?.review_status),
    updatedAt: row?.updated_at ?? "",
  };
}

function getReviewActionResultOrThrow(data, message) {
  const result = normalizeReviewActionResult(data);

  if (!result.requestId) {
    throw new Error(message);
  }

  return result;
}

export async function getMyPublisherStatus() {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc("get_my_publisher_status");

  if (error) {
    throw new Error("No pudimos cargar tu estado de Organizador.");
  }

  const row = Array.isArray(data) ? data[0] : data;

  return row
    ? normalizeMyPublisherStatusRow(row)
    : getDefaultPublisherStatus();
}

export async function submitMyPublisherRequest(payload) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc("submit_my_publisher_request", {
    p_payload: buildPublisherRequestPayload(payload),
  });

  if (error) {
    throw new Error("No pudimos enviar tu solicitud de Organizador.");
  }

  return data;
}

export async function resubmitMyPublisherRequest({ payload, requestId }) {
  const numericRequestId = getNumericId(requestId);

  if (!numericRequestId) {
    throw new Error("No pudimos identificar la solicitud.");
  }

  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc("resubmit_my_publisher_request", {
    p_payload: buildPublisherRequestPayload(payload),
    p_request_id: numericRequestId,
  });

  if (error) {
    throw new Error("No pudimos reenviar tu solicitud de Organizador.");
  }

  return data;
}

export async function listInternalPublisherRequests(status = null) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc(
    "list_internal_publisher_requests",
    {
      p_status: status && status !== "all" ? status : null,
    },
  );

  if (error) {
    throw new Error("No pudimos cargar las solicitudes de publicadores.");
  }

  return (data ?? []).map(normalizeInternalPublisherRequestRow);
}

export async function getInternalPublisherRequest(requestId) {
  const numericRequestId = getNumericId(requestId);

  if (!numericRequestId) {
    throw new Error("No pudimos identificar la solicitud.");
  }

  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc(
    "get_internal_publisher_request",
    {
      p_request_id: numericRequestId,
    },
  );

  if (error) {
    throw new Error("No pudimos cargar esta solicitud de publicador.");
  }

  const row = Array.isArray(data) ? data[0] : data;

  if (!row) {
    throw new Error("Esta solicitud ya no está disponible.");
  }

  return normalizeInternalPublisherRequestRow(row);
}

export async function requestPublisherChanges({
  internalReviewNotes,
  requestId,
  userFeedbackJson = [],
  userFeedbackSummary,
}) {
  const numericRequestId = getNumericId(requestId);

  if (!numericRequestId) {
    throw new Error("No pudimos identificar la solicitud.");
  }

  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc(
    "request_internal_publisher_changes",
    {
      p_internal_review_notes: getTrimmedText(internalReviewNotes) || null,
      p_request_id: numericRequestId,
      p_user_feedback_json: Array.isArray(userFeedbackJson)
        ? userFeedbackJson
        : [],
      p_user_feedback_summary: getTrimmedText(userFeedbackSummary),
    },
  );

  if (error) {
    throw new Error("No pudimos pedir cambios para esta solicitud.");
  }

  return getReviewActionResultOrThrow(
    data,
    "Esta solicitud no está disponible para pedir cambios.",
  );
}

export async function rejectPublisherRequest({
  internalReviewNotes,
  requestId,
  userFeedbackJson = [],
  userFeedbackSummary,
}) {
  const numericRequestId = getNumericId(requestId);

  if (!numericRequestId) {
    throw new Error("No pudimos identificar la solicitud.");
  }

  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc(
    "reject_internal_publisher_request",
    {
      p_internal_review_notes: getTrimmedText(internalReviewNotes) || null,
      p_request_id: numericRequestId,
      p_user_feedback_json: Array.isArray(userFeedbackJson)
        ? userFeedbackJson
        : [],
      p_user_feedback_summary: getTrimmedText(userFeedbackSummary),
    },
  );

  if (error) {
    throw new Error("No pudimos rechazar esta solicitud.");
  }

  return getReviewActionResultOrThrow(
    data,
    "Esta solicitud no está disponible para rechazar.",
  );
}

export async function approvePublisherRequest({
  internalReviewNotes,
  requestId,
}) {
  const numericRequestId = getNumericId(requestId);

  if (!numericRequestId) {
    throw new Error("No pudimos identificar la solicitud.");
  }

  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc(
    "approve_internal_publisher_request",
    {
      p_internal_review_notes: getTrimmedText(internalReviewNotes) || null,
      p_request_id: numericRequestId,
    },
  );

  if (error) {
    throw new Error("No pudimos aprobar esta solicitud.");
  }

  return getReviewActionResultOrThrow(
    data,
    "Esta solicitud no está disponible para aprobar.",
  );
}
