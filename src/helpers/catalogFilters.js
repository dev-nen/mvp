export function filterActivities(
  activities,
  { selectedCategoryLabels = [], selectedCitySlug = "" } = {},
) {
  return activities.filter((activity) => {
    const matchesCategory =
      selectedCategoryLabels.length === 0 ||
      selectedCategoryLabels.includes(activity.category_label);

    const matchesCity =
      !selectedCitySlug || activity.city_slug === selectedCitySlug;

    return matchesCategory && matchesCity;
  });
}

export function getCategoryLabelOptions(activities) {
  return [...new Set(activities.map((activity) => activity.category_label))]
    .filter(Boolean)
    .sort((leftLabel, rightLabel) => leftLabel.localeCompare(rightLabel));
}

export function getCityOptions(activities) {
  const cityOptions = new Map();

  activities.forEach((activity) => {
    if (!activity.city_slug || !activity.city_name) {
      return;
    }

    cityOptions.set(activity.city_slug, {
      city_slug: activity.city_slug,
      city_name: activity.city_name,
    });
  });

  return [...cityOptions.values()].sort((leftCity, rightCity) =>
    leftCity.city_name.localeCompare(rightCity.city_name),
  );
}
