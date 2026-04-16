import { listActivities } from "@/services/catalogService";

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function listCatalogCityChoices() {
  const activities = await listActivities();
  const cityChoices = new Map();

  activities.forEach((activity) => {
    const cityName = getTrimmedText(activity.city_name);
    const citySlug = getTrimmedText(activity.city_slug);

    if (!cityName || !citySlug || cityChoices.has(citySlug)) {
      return;
    }

    cityChoices.set(citySlug, {
      id: activity.city_id ?? null,
      name: cityName,
      slug: citySlug,
    });
  });

  return [...cityChoices.values()].sort((leftCity, rightCity) =>
    leftCity.name.localeCompare(rightCity.name),
  );
}
