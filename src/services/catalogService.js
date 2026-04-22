import {
  buildSupabasePublicStorageUrl,
  getSupabaseClient,
  getSupabaseClientError,
} from "@/services/supabaseClient";
import { slugifyText } from "@/helpers/textSlug";

const CATALOG_SELECT =
  "id, title, center_id, center_name, city_id, city_name, category_id, category_label, type_id, type_label, description, short_description, image_url, age_rule_type, age_min, age_max, price_label, is_free, schedule_label, venue_name, venue_address_1, venue_postal_code, is_featured, created_at";

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCatalogImageUrl(value) {
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

function normalizeCatalogActivity(activity) {
  const cityName = getTrimmedText(activity.city_name);
  const description = getTrimmedText(activity.description);
  const shortDescription =
    getTrimmedText(activity.short_description) || description;

  return {
    ...activity,
    category_label: getTrimmedText(activity.category_label),
    center_name: getTrimmedText(activity.center_name),
    city_name: cityName,
    city_slug: slugifyText(cityName),
    description,
    image_url: normalizeCatalogImageUrl(activity.image_url),
    short_description: shortDescription,
  };
}

export async function listActivities() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error(
      getSupabaseClientError() ||
        "No pudimos conectar con Supabase para cargar el catalogo.",
    );
  }

  const { data, error } = await supabase
    .from("catalog_activities_read")
    .select(CATALOG_SELECT)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(
      error.message || "No pudimos cargar el catalogo desde la base de datos.",
    );
  }

  return (data ?? []).map(normalizeCatalogActivity);
}
