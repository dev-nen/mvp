import {
  getSupabaseClient,
  getSupabaseClientError,
} from "@/services/supabaseClient";

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getFeedbackItems(value) {
  return Array.isArray(value) ? value : [];
}

function getPayload(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};
}

function normalizePublicationRow(row = {}) {
  return {
    itemKind: getTrimmedText(row.item_kind),
    draftId: row.draft_id ?? null,
    activityId: row.activity_id ?? null,
    title: getTrimmedText(row.title) || "Publicacion",
    reviewStatus: getTrimmedText(row.review_status),
    userStatus: getTrimmedText(row.user_status),
    isPublished: row.is_published === true,
    userFeedbackSummary: getTrimmedText(row.user_feedback_summary),
    userFeedbackJson: getFeedbackItems(row.user_feedback_json),
    revisionNumber:
      typeof row.revision_number === "number" ? row.revision_number : 1,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
    canCorrect: row.can_correct === true,
    canUnpublish: row.can_unpublish === true,
    canRequestEdit: row.can_request_edit === true,
  };
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error(
      getSupabaseClientError() ||
        "No pudimos conectar con Supabase para cargar tus publicaciones.",
    );
  }

  return supabase;
}

function normalizeCorrectionDraftRow(row = {}) {
  return {
    draftId: row.draft_id ?? null,
    title: getTrimmedText(row.title) || "Publicacion",
    sourceReferenceUrl: getTrimmedText(row.source_reference_url),
    reviewedPayload: getPayload(row.reviewed_payload_json),
    userFeedbackSummary: getTrimmedText(row.user_feedback_summary),
    userFeedbackJson: getFeedbackItems(row.user_feedback_json),
    revisionNumber:
      typeof row.revision_number === "number" ? row.revision_number : 1,
  };
}

function normalizeEditableActivityRow(row = {}) {
  return {
    activityId: row.activity_id ?? null,
    title: getTrimmedText(row.title) || "Publicacion",
    sourceReferenceUrl: getTrimmedText(row.source_reference_url),
    activityPayload: getPayload(row.activity_payload_json),
  };
}

function normalizeFormOptions(rows = []) {
  const centerChoices = [];
  const categoryChoices = [];
  const typeChoices = [];

  rows.forEach((row) => {
    const optionKind = getTrimmedText(row.option_kind);
    const id = row.id;
    const name = getTrimmedText(row.name);
    const label = getTrimmedText(row.label) || name;

    if (!id || !name) {
      return;
    }

    if (optionKind === "center") {
      centerChoices.push({
        cityId: row.city_id ?? null,
        cityName: getTrimmedText(row.city_name),
        id,
        label,
        name,
      });
      return;
    }

    if (optionKind === "category") {
      categoryChoices.push({ id, name });
      return;
    }

    if (optionKind === "type") {
      typeChoices.push({ id, name });
    }
  });

  return {
    categoryChoices,
    centerChoices,
    typeChoices,
  };
}

export async function listMyActivityPublications() {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc("list_my_activity_publications");

  if (error) {
    throw new Error("No pudimos cargar tus publicaciones.");
  }

  return (data ?? []).map(normalizePublicationRow);
}

export async function listMyPublicationFormOptions() {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc(
    "list_activity_publication_form_options",
  );

  if (error) {
    throw new Error("No pudimos cargar las opciones del formulario.");
  }

  return normalizeFormOptions(data ?? []);
}

export async function unpublishMyActivity(activityId) {
  const numericActivityId = Number(activityId);

  if (!Number.isFinite(numericActivityId) || numericActivityId <= 0) {
    throw new Error("No pudimos identificar la actividad.");
  }

  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc("unpublish_my_activity", {
    p_activity_id: numericActivityId,
  });

  if (error) {
    throw new Error("No pudimos despublicar esta actividad.");
  }

  const [row] = Array.isArray(data) ? data : [];

  return {
    activityId: row?.activity_id ?? numericActivityId,
    isPublished: row?.is_published === true,
    updatedAt: row?.activity_updated_at ?? new Date().toISOString(),
  };
}

export async function getMyActivityDraftForCorrection(draftId) {
  const numericDraftId = Number(draftId);

  if (!Number.isFinite(numericDraftId) || numericDraftId <= 0) {
    throw new Error("No pudimos identificar la publicacion.");
  }

  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc(
    "get_my_activity_draft_for_correction",
    {
      p_draft_id: numericDraftId,
    },
  );

  if (error) {
    throw new Error("No pudimos cargar esta correccion.");
  }

  const [row] = Array.isArray(data) ? data : [];

  if (!row) {
    throw new Error("Esta publicacion no esta disponible para correccion.");
  }

  return normalizeCorrectionDraftRow(row);
}

export async function resubmitMyActivityDraft({
  draftId,
  reviewedPayload,
  sourceReferenceUrl,
}) {
  const numericDraftId = Number(draftId);

  if (!Number.isFinite(numericDraftId) || numericDraftId <= 0) {
    throw new Error("No pudimos identificar la publicacion.");
  }

  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc("resubmit_my_activity_draft", {
    p_draft_id: numericDraftId,
    p_reviewed_payload: reviewedPayload,
    p_source_reference_url:
      typeof sourceReferenceUrl === "string" ? sourceReferenceUrl : null,
  });

  if (error) {
    throw new Error("No pudimos enviar la correccion.");
  }

  return data;
}

export async function getMyActivityForEdit(activityId) {
  const numericActivityId = Number(activityId);

  if (!Number.isFinite(numericActivityId) || numericActivityId <= 0) {
    throw new Error("No pudimos identificar la actividad.");
  }

  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc("get_my_activity_for_edit", {
    p_activity_id: numericActivityId,
  });

  if (error) {
    throw new Error("No pudimos cargar esta publicacion.");
  }

  const [row] = Array.isArray(data) ? data : [];

  if (!row) {
    throw new Error("Esta publicacion no esta disponible para editar.");
  }

  return normalizeEditableActivityRow(row);
}

export async function createMyActivityEditDraft({
  activityId,
  reviewedPayload,
  sourceReferenceUrl,
}) {
  const numericActivityId = Number(activityId);

  if (!Number.isFinite(numericActivityId) || numericActivityId <= 0) {
    throw new Error("No pudimos identificar la actividad.");
  }

  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc("create_my_activity_edit_draft", {
    p_activity_id: numericActivityId,
    p_reviewed_payload: reviewedPayload,
    p_source_reference_url:
      typeof sourceReferenceUrl === "string" ? sourceReferenceUrl : null,
  });

  if (error) {
    throw new Error("No pudimos enviar los cambios.");
  }

  return data;
}
