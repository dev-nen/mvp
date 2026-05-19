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

export async function listMyActivityPublications() {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc("list_my_activity_publications");

  if (error) {
    throw new Error("No pudimos cargar tus publicaciones.");
  }

  return (data ?? []).map(normalizePublicationRow);
}
