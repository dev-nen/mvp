import { getPlainActivityDescription } from "@/helpers/activityPresentation";

function normalizeSearchValue(value) {
  return value.trim().toLowerCase();
}

export function searchActivities(activities, searchQuery) {
  const normalizedQuery = normalizeSearchValue(searchQuery);

  if (!normalizedQuery) {
    return activities;
  }

  return activities.filter((activity) =>
    [
      activity.title,
      getPlainActivityDescription(activity),
      activity.category_label,
      activity.venue_name,
      activity.center_name,
      activity.city_name,
    ]
      .filter(Boolean)
      .some((value) => value.toLowerCase().includes(normalizedQuery)),
  );
}
