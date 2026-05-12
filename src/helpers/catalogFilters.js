import {
  getActivityCatalogAreaKey,
  getCatalogSupportedAreaOptions,
} from "@/helpers/catalogArea";

export function filterActivities(
  activities,
  { selectedCategoryLabels = [], selectedAreaKey = "" } = {},
) {
  return activities.filter((activity) => {
    const matchesCategory =
      selectedCategoryLabels.length === 0 ||
      selectedCategoryLabels.includes(activity.category_label);

    const matchesArea =
      !selectedAreaKey || getActivityCatalogAreaKey(activity) === selectedAreaKey;

    return matchesCategory && matchesArea;
  });
}

export function getCategoryLabelOptions(activities) {
  return [...new Set(activities.map((activity) => activity.category_label))]
    .filter(Boolean)
    .sort((leftLabel, rightLabel) => leftLabel.localeCompare(rightLabel));
}

export function getCatalogAreaOptions() {
  return getCatalogSupportedAreaOptions();
}
