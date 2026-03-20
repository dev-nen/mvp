import { activities, centers, cities } from "@/data/catalogFallback";

function sortActivities(leftActivity, rightActivity) {
  if (leftActivity.is_featured !== rightActivity.is_featured) {
    return Number(rightActivity.is_featured) - Number(leftActivity.is_featured);
  }

  return (
    new Date(rightActivity.created_at).getTime() -
    new Date(leftActivity.created_at).getTime()
  );
}

export async function listActivities() {
  const centersById = new Map(centers.map((center) => [center.id, center]));
  const citiesById = new Map(cities.map((city) => [city.id, city]));

  return activities
    .filter((activity) => activity.is_active)
    .map((activity) => {
      const center = centersById.get(activity.center_id);
      const city =
        citiesById.get(activity.city_id) ?? citiesById.get(center?.city_id);

      return {
        ...activity,
        center_name: center?.name ?? "",
        city_name: city?.name ?? "",
        city_slug: city?.slug ?? "",
      };
    })
    .sort(sortActivities);
}
