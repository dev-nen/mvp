import { CATALOG_SUPPORTED_AREAS } from "@/config/catalogSupportedAreas";
import { getPlainActivityDescription } from "@/helpers/activityPresentation";
import { normalizeSearchText } from "@/helpers/textNormalize";

const AREA_KEY_BY_NORMALIZED_CITY = new Map([
  ["vilanova i la geltru", "vilanova-i-la-geltru"],
  ["sitges", "sitges"],
  ["sant pere de ribes", "sant-pere-de-ribes"],
  ["les roquetes", "les-roquetes"],
  ["roquetes", "les-roquetes"],
  ["les roquetas", "les-roquetes"],
  ["roquetas", "les-roquetes"],
]);

function containsRoquetesSignal(value) {
  const normalizedValue = normalizeSearchText(value);

  return /\broquet(?:es|as)\b/.test(normalizedValue);
}

function getActivityAreaDetectionText(activity = {}) {
  // Temporary MVP heuristic: Les Roquetes is not modeled separately yet, so
  // detection depends only on available activity text and never invents data.
  return [
    activity.city_name,
    activity.title,
    activity.venue_name,
    activity.venue_address_1,
    getPlainActivityDescription(activity),
    activity.center_name,
  ]
    .filter(Boolean)
    .join(" ");
}

export function getCatalogSupportedAreaOptions() {
  return CATALOG_SUPPORTED_AREAS;
}

export function getCatalogSupportedAreaLabel(areaKey) {
  return (
    CATALOG_SUPPORTED_AREAS.find((area) => area.key === areaKey)?.label || ""
  );
}

export function getActivityCatalogAreaKey(activity = {}) {
  const normalizedCityName = normalizeSearchText(activity.city_name);

  if (containsRoquetesSignal(normalizedCityName)) {
    return "les-roquetes";
  }

  const directAreaKey = AREA_KEY_BY_NORMALIZED_CITY.get(normalizedCityName);

  if (!directAreaKey) {
    return null;
  }

  if (
    directAreaKey === "sant-pere-de-ribes" &&
    containsRoquetesSignal(getActivityAreaDetectionText(activity))
  ) {
    return "les-roquetes";
  }

  return directAreaKey;
}
