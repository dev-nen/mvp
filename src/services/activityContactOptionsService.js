import {
  getSupabaseClient,
  getSupabaseClientError,
} from "@/services/supabaseClient";

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeContactMethod(value) {
  const contactMethod = getTrimmedText(value).toLowerCase();

  return contactMethod === "web" ? "website" : contactMethod;
}

function normalizeContactOption(row) {
  return {
    id: row.id,
    activityId: row.activity_id,
    contactMethod: normalizeContactMethod(row.contact_method),
    contactValue: getTrimmedText(row.contact_value),
    contactLabel: getTrimmedText(row.contact_label),
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
    .select("id, activity_id, contact_method, contact_value, contact_label")
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
