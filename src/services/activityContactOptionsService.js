import {
  getPublicSupabaseClient,
  getSupabaseClientError,
} from "@/services/supabaseClient";
import { PUBLIC_CONTACT_COLUMNS } from "@/shared/publicCatalogBackupContract.mjs";
import { publicCatalogBackupReader } from "@/services/publicCatalogBackupService";

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

  const rows = await publicCatalogBackupReader.readContacts(activityId, async (signal) => {
    const supabase = getPublicSupabaseClient();
    if (!supabase) {
      throw new Error(getSupabaseClientError() || "Public contacts are unavailable.");
    }
    const { data, error } = await supabase
      .from("activity_contact_options_read")
      .select(PUBLIC_CONTACT_COLUMNS.join(", "))
      .eq("activity_id", activityId)
      .order("id", { ascending: true })
      .abortSignal(signal);
    if (error) throw new Error("Public contacts are unavailable.");
    return data ?? [];
  });

  return rows
    .map(normalizeContactOption)
    .filter((contactOption) => contactOption.contactMethod && contactOption.contactValue);
}
