export function formatActivityAgeLabel(
  { age_rule_type, age_min, age_max },
  copy = {},
) {
  const labels = {
    allAges: "Todas las edades",
    ageRange: "{min}-{max} años",
    ageFrom: "Desde {min} años",
    ageUntil: "Hasta {max} años",
    consultAge: "Consulta la edad",
    ...copy,
  };

  if (age_rule_type === "open" || age_rule_type === "all") {
    return labels.allAges;
  }

  if (typeof age_min === "number" && typeof age_max === "number") {
    return labels.ageRange
      .replace("{min}", age_min)
      .replace("{max}", age_max);
  }

  if (typeof age_min === "number") {
    return labels.ageFrom.replace("{min}", age_min);
  }

  if (typeof age_max === "number") {
    return labels.ageUntil.replace("{max}", age_max);
  }

  return labels.consultAge;
}

export function formatActivityLocationLabel(
  { city_name, venue_name },
  copy = {},
) {
  if (city_name && venue_name) {
    return `${city_name} - ${venue_name}`;
  }

  return city_name || venue_name || copy.consultLocation || "Consulta la ubicación";
}

export function getActivityDescription(activity, copy = {}) {
  const longDescription = activity?.description?.trim();

  if (longDescription) {
    return longDescription;
  }

  return (
    activity?.short_description ||
    copy.fallbackDescription ||
    "Consulta más información por WhatsApp."
  );
}
