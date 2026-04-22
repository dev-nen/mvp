import {
  getSupabaseClient,
  getSupabaseClientError,
} from "@/services/supabaseClient";

export async function approveInternalDraft(draftId) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error(
      getSupabaseClientError() ||
        "No pudimos conectar con Supabase para aprobar el draft.",
    );
  }

  const { data, error } = await supabase.rpc("approve_activity_draft", {
    p_draft_id: draftId,
  });

  if (error) {
    throw new Error(
      error.message || "No pudimos aprobar el draft solicitado.",
    );
  }

  return typeof data === "number" ? data : Number(data);
}
