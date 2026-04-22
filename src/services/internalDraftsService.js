import {
  getSupabaseClient,
  getSupabaseClientError,
} from "@/services/supabaseClient";

const LIST_DRAFTS_SELECT =
  "id, source_type, source_label, confidence_score, review_status, parsed_payload_json, reviewed_payload_json, created_at";
const DRAFT_DETAIL_SELECT =
  "id, source_type, source_label, source_file_path, source_file_name, source_mime_type, source_reference_url, raw_extracted_text, parsed_payload_json, reviewed_payload_json, confidence_score, review_status, review_notes, reviewed_by, approved_activity_id, created_by, created_at, updated_at";

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getDraftPayload(payload) {
  return payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload
    : {};
}

function getDraftDisplayTitle(row) {
  const reviewedPayload = getDraftPayload(row.reviewed_payload_json);
  const parsedPayload = getDraftPayload(row.parsed_payload_json);
  const reviewedTitle = getTrimmedText(reviewedPayload?.activity?.title);
  const parsedTitle = getTrimmedText(parsedPayload?.activity?.title);

  return reviewedTitle || parsedTitle || getTrimmedText(row.source_label) || `Draft ${row.id}`;
}

function normalizeDraftRow(row) {
  const parsedPayload = getDraftPayload(row.parsed_payload_json);
  const reviewedPayload = getDraftPayload(row.reviewed_payload_json);

  return {
    id: row.id,
    sourceType: getTrimmedText(row.source_type),
    sourceLabel: getTrimmedText(row.source_label),
    sourceFilePath: getTrimmedText(row.source_file_path),
    sourceFileName: getTrimmedText(row.source_file_name),
    sourceMimeType: getTrimmedText(row.source_mime_type),
    sourceReferenceUrl: getTrimmedText(row.source_reference_url),
    rawExtractedText: getTrimmedText(row.raw_extracted_text),
    parsedPayload,
    reviewedPayload,
    confidenceScore:
      typeof row.confidence_score === "number"
        ? row.confidence_score
        : row.confidence_score === null
          ? null
          : Number(row.confidence_score),
    reviewStatus: getTrimmedText(row.review_status),
    reviewNotes: getTrimmedText(row.review_notes),
    reviewedBy: row.reviewed_by ?? null,
    approvedActivityId: row.approved_activity_id ?? null,
    createdBy: row.created_by ?? null,
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
    displayTitle: getDraftDisplayTitle(row),
  };
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error(
      getSupabaseClientError() ||
        "No pudimos conectar con Supabase para trabajar con drafts.",
    );
  }

  return supabase;
}

export async function listInternalDrafts() {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from("activity_drafts")
    .select(LIST_DRAFTS_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      error.message || "No pudimos cargar los drafts internos.",
    );
  }

  return (data ?? []).map(normalizeDraftRow);
}

export async function getInternalDraftById(draftId) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from("activity_drafts")
    .select(DRAFT_DETAIL_SELECT)
    .eq("id", draftId)
    .maybeSingle();

  if (error) {
    throw new Error(
      error.message || "No pudimos cargar el draft solicitado.",
    );
  }

  if (!data) {
    return null;
  }

  return normalizeDraftRow(data);
}

export async function saveInternalDraftReview({
  draftId,
  reviewedPayload,
  reviewNotes,
}) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from("activity_drafts")
    .update({
      reviewed_payload_json: reviewedPayload,
      review_notes: getTrimmedText(reviewNotes) || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId)
    .eq("review_status", "pending_review")
    .select(DRAFT_DETAIL_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(
      error.message || "No pudimos guardar la revision del draft.",
    );
  }

  if (!data) {
    throw new Error("No pudimos guardar el draft pendiente solicitado.");
  }

  return normalizeDraftRow(data);
}

export async function rejectInternalDraft({
  draftId,
  reviewedPayload,
  reviewNotes,
  reviewedByUserId,
}) {
  if (!reviewedByUserId) {
    throw new Error("Necesitamos una cuenta interna activa para rechazar drafts.");
  }

  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from("activity_drafts")
    .update({
      reviewed_payload_json: reviewedPayload,
      review_notes: getTrimmedText(reviewNotes) || null,
      review_status: "rejected",
      reviewed_by: reviewedByUserId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", draftId)
    .eq("review_status", "pending_review")
    .select(DRAFT_DETAIL_SELECT)
    .maybeSingle();

  if (error) {
    throw new Error(
      error.message || "No pudimos rechazar el draft solicitado.",
    );
  }

  if (!data) {
    throw new Error("No pudimos rechazar el draft pendiente solicitado.");
  }

  return normalizeDraftRow(data);
}

export async function listDraftCenters() {
  const supabase = getSupabaseOrThrow();
  const { data: centerRows, error: centerError } = await supabase
    .from("centers")
    .select("id, name, city_id")
    .eq("is_active", true)
    .eq("is_deleted", false)
    .order("name", { ascending: true });

  if (centerError) {
    throw new Error(
      centerError.message || "No pudimos cargar los centros disponibles.",
    );
  }

  const cityIds = [...new Set((centerRows ?? []).map((row) => row.city_id).filter(Boolean))];

  let cityRows = [];

  if (cityIds.length > 0) {
    const { data, error } = await supabase
      .from("cities")
      .select("id, name")
      .in("id", cityIds);

    if (error) {
      throw new Error(
        error.message || "No pudimos resolver las ciudades de los centros.",
      );
    }

    cityRows = data ?? [];
  }

  const citiesById = new Map(
    cityRows.map((cityRow) => [cityRow.id, getTrimmedText(cityRow.name)]),
  );

  return (centerRows ?? [])
    .map((centerRow) => {
      const name = getTrimmedText(centerRow.name);
      const cityName = getTrimmedText(citiesById.get(centerRow.city_id));

      return {
        id: centerRow.id,
        name,
        cityId: centerRow.city_id ?? null,
        cityName,
        label: cityName ? `${name} (${cityName})` : name,
      };
    })
    .sort((leftCenter, rightCenter) => leftCenter.label.localeCompare(rightCenter.label));
}

export async function listDraftCategories() {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from("categories")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(
      error.message || "No pudimos cargar las categorias disponibles.",
    );
  }

  return (data ?? []).map((categoryRow) => ({
    id: categoryRow.id,
    name: getTrimmedText(categoryRow.name),
  }));
}

export async function listDraftTypes() {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase
    .from("type_activity")
    .select("id, name")
    .order("name", { ascending: true });

  if (error) {
    throw new Error(
      error.message || "No pudimos cargar los tipos disponibles.",
    );
  }

  return (data ?? []).map((typeRow) => ({
    id: typeRow.id,
    name: getTrimmedText(typeRow.name),
  }));
}
