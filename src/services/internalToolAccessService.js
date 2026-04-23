import {
  getSupabaseClient,
  getSupabaseClientError,
} from "@/services/supabaseClient";

export const DRAFT_INBOX_TOOL_NAME = "draft_inbox";

export async function hasInternalToolAccess(userId, toolName = DRAFT_INBOX_TOOL_NAME) {
  if (!userId) {
    return false;
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error(
      getSupabaseClientError() ||
        "No pudimos conectar con Supabase para comprobar el acceso interno.",
    );
  }

  const { data, error } = await supabase
    .from("internal_tool_access")
    .select("user_id, tool_name")
    .eq("user_id", userId)
    .eq("tool_name", toolName)
    .maybeSingle();

  if (error) {
    throw new Error(
      error.message ||
        "No pudimos comprobar el acceso interno con la configuración actual.",
    );
  }

  return Boolean(data?.user_id);
}
