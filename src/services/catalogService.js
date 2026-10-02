import {
  buildSupabasePublicStorageUrl,
  getPublicSupabaseClient,
  getSupabaseClientError,
} from "@/services/supabaseClient";
import { normalizeDescriptionFormat } from "@/helpers/activityPresentation";
import { slugifyText } from "@/helpers/textSlug";
import { PUBLIC_CATALOG_COLUMNS } from "@/shared/publicCatalogBackupContract.mjs";
import { publicCatalogBackupReader } from "@/services/publicCatalogBackupService";

const CATALOG_SELECT = PUBLIC_CATALOG_COLUMNS.join(", ");

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
    description_format: normalizeDescriptionFormat(activity.description_format),
    image_url: normalizeCatalogImageUrl(activity.image_url),
    short_description: shortDescription,
  };
}

export async function listActivities() {
  const rows = await publicCatalogBackupReader.readCatalog(async (signal) => {
    const supabase = getPublicSupabaseClient();

    if (!supabase) {
      throw new Error(getSupabaseClientError() || "Public catalog is unavailable.");
    }

    const activities = [];
    const pageSize = 500;
    for (let offset = 0; offset < 50_000; offset += pageSize) {
      const { data, error } = await supabase
        .from("catalog_activities_read")
        .select(CATALOG_SELECT)
        .order("created_at", { ascending: false })
        .order("id", { ascending: false })
        .range(offset, offset + pageSize - 1)
        .abortSignal(signal);
      if (error) throw new Error("Public catalog is unavailable.");
      activities.push(...(data ?? []));
      if ((data ?? []).length < pageSize) return activities;
    }
    throw new Error("Public catalog limit exceeded.");
  });

  return rows.map(normalizeCatalogActivity);
}
