export function formatActivityAgeLabel({
  age_rule_type,
  age_min,
  age_max,
}) {
  if (age_rule_type === "open") {
    return "Todas las edades";
  }

  if (typeof age_min === "number" && typeof age_max === "number") {
    return `${age_min}-${age_max} años`;
  }

  if (typeof age_min === "number") {
    return `Desde ${age_min} años`;
  }

  if (typeof age_max === "number") {
    return `Hasta ${age_max} años`;
  }

  return "Consulta la edad";
}

export function formatActivityLocationLabel({ city_name, venue_name }) {
  if (city_name && venue_name) {
    return `${city_name} - ${venue_name}`;
  }

  return city_name || venue_name || "Consulta la ubicación";
}

export function getActivityDescription(activity) {
  const longDescription = activity?.description?.trim();

  if (longDescription) {
    return longDescription;
  }

  return activity?.short_description || "Consulta más información por WhatsApp.";
}
