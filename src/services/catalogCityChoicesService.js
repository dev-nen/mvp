import { listActivities } from "@/services/catalogService";

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

export async function listCatalogCityChoices() {
  const activities = await listActivities();
  const cityChoices = new Map();

  activities.forEach((activity) => {
    const cityName = getTrimmedText(activity.city_name);
    const cityId = activity.city_id ?? null;
    const citySlug = getTrimmedText(activity.city_slug);

    if (!cityName || !citySlug || cityId === null || cityChoices.has(cityId)) {
      return;
    }

    cityChoices.set(cityId, {
      id: cityId,
      name: cityName,
      slug: citySlug,
    });
  });

  return [...cityChoices.values()].sort((leftCity, rightCity) =>
    leftCity.name.localeCompare(rightCity.name),
  );
}
