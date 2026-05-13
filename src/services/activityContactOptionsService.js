import {
  getSupabaseClient,
  getSupabaseClientError,
} from "@/services/supabaseClient";

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeContactOption(row) {
  return {
    id: row.id,
    activityId: row.activity_id,
    contactMethod: getTrimmedText(row.contact_method).toLowerCase(),
    contactValue: getTrimmedText(row.contact_value),
  };
}

export async function listActivityContactOptions(activityId) {
  if (!activityId) {
    return [];
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error(
      getSupabaseClientError() ||
        "No pudimos conectar con Supabase para cargar los contactos.",
    );
  }

  const { data, error } = await supabase
    .from("activity_contact_options_read")
    .select("id, activity_id, contact_method, contact_value")
    .eq("activity_id", activityId)
    .order("id", { ascending: true });

  if (error) {
    throw new Error(
      error.message ||
        "No pudimos cargar las opciones de contacto de esta actividad.",
    );
  }

  return (data ?? [])
    .map(normalizeContactOption)
    .filter((contactOption) => contactOption.contactMethod && contactOption.contactValue);
}
