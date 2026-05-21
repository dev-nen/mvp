import { normalizeContactOptionsForPayload } from "@/helpers/contactOptions";

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

function normalizeCenterMode(value) {
  const normalizedValue = getTrimmedText(value).toLowerCase();

  if (["existing", "proposed_new", "not_applicable"].includes(normalizedValue)) {
    return normalizedValue;
  }

  return "existing";
}

export function mapFormStateToDraftPayload(formState) {
  const ageRuleType = normalizeAgeRuleType(formState?.ageRuleType);
  const centerMode = normalizeCenterMode(formState?.centerMode);
  const centerId =
    centerMode === "existing" ? normalizeIntegerValue(formState?.centerId) : null;
  const ageMin = normalizeIntegerValue(formState?.ageMin);
  const ageMax = normalizeIntegerValue(formState?.ageMax);
  const { contactOptions } = normalizeContactOptionsForPayload(
    formState?.contactOptions,
  );
  const shouldIncludeContactOptions =
    formState?.hasContactOptionsPayload === true ||
    formState?.contactOptionsTouched === true;

  const payload = {
    activity: {
      title: getTrimmedText(formState?.title),
      description: getTrimmedText(formState?.description),
      description_format: "markdown",
      center_id: centerId,
      category_id: normalizeIntegerValue(formState?.categoryId),
      type_id: normalizeIntegerValue(formState?.typeId),
      image_url: getTrimmedText(formState?.imageUrl),
      age_rule_type: ageRuleType,
      age_min: ageRuleType === "range" || ageRuleType === "from" ? ageMin : null,
      age_max: ageRuleType === "range" || ageRuleType === "until" ? ageMax : null,
      price_label:
        formState?.isFree === "true" ? "" : getTrimmedText(formState?.priceLabel),
      is_free: formState?.isFree === "true",
      schedule_label: getTrimmedText(formState?.scheduleLabel),
      venue_name: getTrimmedText(formState?.venueName),
      venue_address_1: getTrimmedText(formState?.venueAddress1),
      venue_postal_code: getTrimmedText(formState?.venuePostalCode),
    },
    center:
      centerMode === "existing"
        ? {
            mode: "existing",
            center_id: centerId,
          }
        : centerMode === "proposed_new"
          ? {
              mode: "proposed_new",
              name: getTrimmedText(formState?.centerProposalName),
              notes: getTrimmedText(formState?.centerProposalNotes),
            }
          : {
              mode: "not_applicable",
              notes: getTrimmedText(formState?.centerProposalNotes),
            },
  };

  if (shouldIncludeContactOptions) {
    payload.contact_options = contactOptions;
  }

  return payload;
}
