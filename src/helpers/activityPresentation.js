export function formatActivityAgeLabel({
  age_rule_type,
  age_min,
  age_max,
}) {
  if (age_rule_type === "open") {
    return "Todas las edades";
  }

  if (typeof age_min === "number" && typeof age_max === "number") {
    return `${age_min}-${age_max} anos`;
  }

  if (typeof age_min === "number") {
    return `Desde ${age_min} anos`;
  }

  if (typeof age_max === "number") {
    return `Hasta ${age_max} anos`;
  }

  return "Consulta la edad";
}

export function formatActivityLocationLabel({ city_name, venue_name }) {
  if (city_name && venue_name) {
    return `${city_name} - ${venue_name}`;
  }

  return city_name || venue_name || "Consulta la ubicacion";
}

export function getActivityDescription(activity) {
  const longDescription = activity?.description?.trim();

  if (longDescription) {
    return longDescription;
  }

  return activity?.short_description || "Consulta mas informacion por WhatsApp.";
}
