import {
  getSupabaseClient,
  getSupabaseClientError,
} from "@/services/supabaseClient";

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getActivityPayload(payload) {
  return payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload.activity && typeof payload.activity === "object" && !Array.isArray(payload.activity)
      ? payload
      : {}
    : {};
}

function getManagedActivityTitle(row) {
  const payload = getActivityPayload(row?.activity_payload_json);
  const title = getTrimmedText(payload?.activity?.title);

  return title || `Actividad #${row?.activity_id ?? "?"}`;
}

function normalizeManagedActivityRow(row) {
  return {
    draftId: row?.draft_id ?? null,
    activityId: row?.activity_id ?? null,
    sourceLabel: getTrimmedText(row?.source_label),
    reviewStatus: getTrimmedText(row?.review_status),
    reviewNotes: getTrimmedText(row?.review_notes),
    isPublished: row?.is_published === true,
    activityCreatedAt: row?.activity_created_at ?? "",
    activityUpdatedAt: row?.activity_updated_at ?? "",
    activityPayload: getActivityPayload(row?.activity_payload_json),
    displayTitle: getManagedActivityTitle(row),
  };
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error(
      getSupabaseClientError() ||
        "No pudimos conectar con Supabase para trabajar con actividades aprobadas.",
    );
  }

  return supabase;
}

export async function getInternalApprovedActivity(activityId) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc("get_internal_approved_activity", {
    p_activity_id: activityId,
  });

  if (error) {
    throw new Error(
      error.message || "No pudimos cargar la actividad aprobada solicitada.",
    );
  }

  const row = Array.isArray(data) ? data[0] ?? null : data;

  return row ? normalizeManagedActivityRow(row) : null;
}

export async function listInternalApprovedActivityStates(draftIds) {
  if (!Array.isArray(draftIds) || draftIds.length === 0) {
    return new Map();
  }

  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc(
    "list_internal_approved_activity_states",
    {
      p_draft_ids: draftIds,
    },
  );

  if (error) {
    throw new Error(
      error.message ||
        "No pudimos comprobar el estado publico de las actividades aprobadas.",
    );
  }

  return new Map(
    (data ?? []).map((row) => [
      row.draft_id,
      {
        activityId: row.activity_id ?? null,
        isPublished: row.is_published === true,
      },
    ]),
  );
}

export async function saveInternalApprovedActivityReview({
  draftId,
  reviewedPayload,
  reviewNotes,
}) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc(
    "update_approved_activity_from_draft",
    {
      p_draft_id: draftId,
      p_review_notes: getTrimmedText(reviewNotes) || null,
      p_reviewed_payload: reviewedPayload,
    },
  );

  if (error) {
    throw new Error(
      error.message ||
        "No pudimos guardar los cambios de la actividad aprobada.",
    );
  }

  return typeof data === "number" ? data : Number(data);
}

export async function unpublishInternalApprovedActivity({ draftId, reviewNotes }) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc("unpublish_approved_activity", {
    p_draft_id: draftId,
    p_review_notes: getTrimmedText(reviewNotes) || null,
  });

  if (error) {
    throw new Error(
      error.message || "No pudimos despublicar la actividad aprobada.",
    );
  }

  return typeof data === "number" ? data : Number(data);
}

export async function republishInternalApprovedActivity({ draftId, reviewNotes }) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc("republish_approved_activity", {
    p_draft_id: draftId,
    p_review_notes: getTrimmedText(reviewNotes) || null,
  });

  if (error) {
    throw new Error(
      error.message || "No pudimos republicar la actividad aprobada.",
    );
  }

  return typeof data === "number" ? data : Number(data);
}
