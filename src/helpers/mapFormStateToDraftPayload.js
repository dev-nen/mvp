function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeIntegerValue(value) {
  if (typeof value === "number" && Number.isInteger(value)) {
    return value;
  }

  if (typeof value === "string" && /^\d+$/.test(value.trim())) {
    return Number(value.trim());
  }

  return null;
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

export function mapFormStateToDraftPayload(formState) {
  const ageRuleType = normalizeAgeRuleType(formState?.ageRuleType);
  const ageMin = normalizeIntegerValue(formState?.ageMin);
  const ageMax = normalizeIntegerValue(formState?.ageMax);

  return {
    activity: {
      title: getTrimmedText(formState?.title),
      description: getTrimmedText(formState?.description),
      center_id: normalizeIntegerValue(formState?.centerId),
      category_id: normalizeIntegerValue(formState?.categoryId),
      type_id: normalizeIntegerValue(formState?.typeId),
      image_url: getTrimmedText(formState?.imageUrl),
      age_rule_type: ageRuleType,
      age_min: ageRuleType === "range" || ageRuleType === "from" ? ageMin : null,
      age_max: ageRuleType === "range" || ageRuleType === "until" ? ageMax : null,
      price_label: getTrimmedText(formState?.priceLabel),
      is_free: formState?.isFree === "true",
      schedule_label: getTrimmedText(formState?.scheduleLabel),
      venue_name: getTrimmedText(formState?.venueName),
      venue_address_1: getTrimmedText(formState?.venueAddress1),
      venue_postal_code: getTrimmedText(formState?.venuePostalCode),
    },
  };
}
