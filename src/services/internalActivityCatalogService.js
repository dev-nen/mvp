import { normalizeDescriptionFormat } from "@/helpers/activityPresentation";
import { slugifyText } from "@/helpers/textSlug";
import {
  buildSupabasePublicStorageUrl,
  getSupabaseClient,
  getSupabaseClientError,
} from "@/services/supabaseClient";

export const INTERNAL_ACTIVITY_CATALOG_FILTERS = {
  ALL: "all",
  PUBLISHED: "published",
  UNPUBLISHED: "unpublished",
};

const VALID_FILTERS = new Set(Object.values(INTERNAL_ACTIVITY_CATALOG_FILTERS));

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeFilter(value) {
  const filter = getTrimmedText(value).toLowerCase();

  return VALID_FILTERS.has(filter) ? filter : INTERNAL_ACTIVITY_CATALOG_FILTERS.ALL;
}

function normalizeAdminActivityImageUrl(value) {
  const imageUrl = getTrimmedText(value);

  if (!imageUrl) {
    return "";
  }

  if (
    imageUrl.startsWith("/") ||
    imageUrl.startsWith("data:") ||
    imageUrl.startsWith("blob:") ||
    /^https?:\/\//i.test(imageUrl)
  ) {
    return imageUrl;
  }

  return buildSupabasePublicStorageUrl("activities", imageUrl) || "";
}

function normalizeInternalAdminActivity(row = {}) {
  const cityName = getTrimmedText(row.city_name);
  const description = getTrimmedText(row.description);
  const shortDescription =
    getTrimmedText(row.short_description) || description;
  const isPublished = row.is_published === true;

  return {
    id: row.activity_id ?? null,
    activityId: row.activity_id ?? null,
    title: getTrimmedText(row.title) || `Actividad #${row.activity_id ?? "?"}`,
    center_id: row.center_id ?? null,
    center_name: getTrimmedText(row.center_name),
    city_id: row.city_id ?? null,
    city_name: cityName,
    city_slug: slugifyText(cityName),
    category_id: row.category_id ?? null,
    category_label: getTrimmedText(row.category_label),
    type_id: row.type_id ?? null,
    type_label: getTrimmedText(row.type_label),
    description,
    description_format: normalizeDescriptionFormat(row.description_format),
    short_description: shortDescription,
    image_url: normalizeAdminActivityImageUrl(row.image_url),
    age_rule_type: getTrimmedText(row.age_rule_type),
    age_min: typeof row.age_min === "number" ? row.age_min : null,
    age_max: typeof row.age_max === "number" ? row.age_max : null,
    price_label: getTrimmedText(row.price_label),
    is_free: row.is_free === true,
    schedule_label: getTrimmedText(row.schedule_label),
    venue_name: getTrimmedText(row.venue_name),
    venue_address_1: getTrimmedText(row.venue_address_1),
    venue_postal_code: getTrimmedText(row.venue_postal_code),
    is_featured: row.is_featured === true,
    is_published: isPublished,
    isPublished,
    activityCreatedAt: row.activity_created_at ?? "",
    activityUpdatedAt: row.activity_updated_at ?? "",
    draftId: row.draft_id ?? null,
    draftSourceType: getTrimmedText(row.draft_source_type),
    draftSourceLabel: getTrimmedText(row.draft_source_label),
    draftReviewStatus: getTrimmedText(row.draft_review_status),
  };
}

function normalizePublicationResult(data) {
  const row = Array.isArray(data) ? data[0] ?? null : data;

  if (!row) {
    return null;
  }

  return {
    activityId: row.activity_id ?? null,
    isPublished: row.is_published === true,
    activityUpdatedAt: row.activity_updated_at ?? "",
  };
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error(
      getSupabaseClientError() ||
        "No pudimos conectar con Supabase para cargar actividades internas.",
    );
  }

  return supabase;
}

export async function listInternalAdminActivities({ filter = "all" } = {}) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc("list_internal_admin_activities", {
    p_publication_filter: normalizeFilter(filter),
  });

  if (error) {
    throw new Error("No pudimos cargar el panel interno de actividades.");
  }

  return (data ?? []).map(normalizeInternalAdminActivity);
}

export async function publishInternalAdminActivity(activityId) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc(
    "publish_internal_admin_activity",
    {
      p_activity_id: activityId,
      p_review_notes: null,
    },
  );

  if (error) {
    throw new Error("No pudimos republicar la actividad.");
  }

  return normalizePublicationResult(data);
}

export async function unpublishInternalAdminActivity(activityId) {
  const supabase = getSupabaseOrThrow();
  const { data, error } = await supabase.rpc(
    "unpublish_internal_admin_activity",
    {
      p_activity_id: activityId,
      p_review_notes: null,
    },
  );

  if (error) {
    throw new Error("No pudimos despublicar la actividad.");
  }

  return normalizePublicationResult(data);
}
