function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeIdValue(value) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return String(value);
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return value.trim();
  }

  return "";
}

function normalizeAgeRuleType(value) {
  const normalizedValue = getTrimmedText(value).toLowerCase();

  if (["range", "from", "until", "all"].includes(normalizedValue)) {
    return normalizedValue;
  }

  if (normalizedValue === "open") {
    return "all";
  }

  return "all";
}

function normalizeNumericValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string" && /^-?\d+$/.test(value.trim())) {
    return value.trim();
  }

  return "";
}

function getActivityPayload(payload) {
  return payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload.activity && typeof payload.activity === "object" && !Array.isArray(payload.activity)
      ? payload.activity
      : {}
    : {};
}

export function getDefaultDraftFormState() {
  return {
    title: "",
    description: "",
    centerId: "",
    categoryId: "",
    typeId: "",
    imageUrl: "",
    ageRuleType: "all",
    ageMin: "",
    ageMax: "",
    priceLabel: "",
    isFree: "false",
    scheduleLabel: "",
    venueName: "",
    venueAddress1: "",
    venuePostalCode: "",
  };
}

export function mapDraftPayloadToFormState(payload) {
  const defaultState = getDefaultDraftFormState();
  const activityPayload = getActivityPayload(payload);

  return {
    ...defaultState,
    title: getTrimmedText(activityPayload.title),
    description: getTrimmedText(activityPayload.description),
    centerId: normalizeIdValue(activityPayload.center_id),
    categoryId: normalizeIdValue(activityPayload.category_id),
    typeId: normalizeIdValue(activityPayload.type_id),
    imageUrl: getTrimmedText(activityPayload.image_url),
    ageRuleType: normalizeAgeRuleType(activityPayload.age_rule_type),
    ageMin: normalizeNumericValue(activityPayload.age_min),
    ageMax: normalizeNumericValue(activityPayload.age_max),
    priceLabel: getTrimmedText(activityPayload.price_label),
    isFree: activityPayload.is_free === true ? "true" : "false",
    scheduleLabel: getTrimmedText(activityPayload.schedule_label),
    venueName: getTrimmedText(activityPayload.venue_name),
    venueAddress1: getTrimmedText(activityPayload.venue_address_1),
    venuePostalCode: getTrimmedText(activityPayload.venue_postal_code),
  };
}
