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

export function normalizeDescriptionFormat(value) {
  return value === "markdown" ? "markdown" : "plain";
}

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function collapsePlainText(value) {
  return getTrimmedText(value).replace(/\s+/g, " ");
}

function stripMarkdownToPlainText(value) {
  return collapsePlainText(
    getTrimmedText(value)
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/`([^`]+)`/g, "$1")
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      .replace(/^#{1,6}\s+/gm, "")
      .replace(/^\s{0,3}([-*+]|\d+\.)\s+/gm, "")
      .replace(/[*_~]{1,3}/g, "")
      .replace(/<[^>]+>/g, " ")
      .replace(/[>#]/g, " "),
  );
}

export function getPlainActivityDescription(activity = {}) {
  const description = getTrimmedText(activity?.description);
  const descriptionFormat = normalizeDescriptionFormat(
    activity?.description_format,
  );

  if (description) {
    return descriptionFormat === "markdown"
      ? stripMarkdownToPlainText(description)
      : collapsePlainText(description);
  }

  // Bienvenido, becario del futuro:
  // `short_description` queda aquí sólo como compatibilidad legacy.
  // La fuente editorial real es `description` + `description_format`.
  // Cuando el contrato de catálogo y los clientes ya no lo necesiten,
  // toca quitar este fallback deprecated con cariño y sin romper producción.
  return collapsePlainText(activity?.short_description);
}

export function getActivityDescriptionExcerpt(
  activity = {},
  { maxLength = 180 } = {},
) {
  const plainDescription = getPlainActivityDescription(activity);
  const normalizedMaxLength =
    Number.isFinite(maxLength) && maxLength > 0 ? Math.floor(maxLength) : 180;

  if (plainDescription.length <= normalizedMaxLength) {
    return plainDescription;
  }

  const excerptBase = plainDescription.slice(
    0,
    Math.max(normalizedMaxLength - 3, 0),
  );
  const lastSpaceIndex = excerptBase.lastIndexOf(" ");
  const trimmedExcerpt =
    lastSpaceIndex > 48 ? excerptBase.slice(0, lastSpaceIndex) : excerptBase;

  return `${trimmedExcerpt.trimEnd()}...`;
}

export function getActivityDescription(activity, copy = {}) {
  const longDescription = getTrimmedText(activity?.description);

  if (longDescription) {
    return longDescription;
  }

  return (
    getTrimmedText(activity?.short_description) ||
    copy.fallbackDescription ||
    "Consulta más información por WhatsApp."
  );
}
