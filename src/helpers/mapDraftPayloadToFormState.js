import { normalizeDescriptionFormat } from "@/helpers/activityPresentation";
import { mapPayloadContactOptionsToFormState } from "@/helpers/contactOptions";

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

  return "";
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

function getCenterPayload(payload) {
  return payload && typeof payload === "object" && !Array.isArray(payload)
    ? payload.center && typeof payload.center === "object" && !Array.isArray(payload.center)
      ? payload.center
      : {}
    : {};
}

function normalizeCenterMode(value) {
  const normalizedValue = getTrimmedText(value).toLowerCase();

  if (["existing", "proposed_new", "not_applicable"].includes(normalizedValue)) {
    return normalizedValue;
  }

  return "existing";
}

function hasContactOptionsPayload(payload) {
  return Boolean(
    payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      Object.prototype.hasOwnProperty.call(payload, "contact_options"),
  );
}

export function getDefaultDraftFormState() {
  return {
    title: "",
    description: "",
    descriptionFormat: "markdown",
    centerMode: "existing",
    centerId: "",
    centerSearchQuery: "",
    centerProposalName: "",
    centerProposalNotes: "",
    centerProposalCity: "",
    centerProposalInstitution: "",
    centerProposalAddress: "",
    centerProposalPostalCode: "",
    categoryId: "",
    typeId: "",
    imageUrl: "",
    ageRuleType: "",
    ageMin: "",
    ageMax: "",
    priceLabel: "",
    isFree: "",
    scheduleLabel: "",
    venueName: "",
    venueAddress1: "",
    venuePostalCode: "",
    sourceReferenceUrl: "",
    contactOptions: [],
    contactOptionsTouched: false,
    hasContactOptionsPayload: false,
    importReview: null,
  };
}

export function mapDraftPayloadToFormState(payload) {
  const defaultState = getDefaultDraftFormState();
  const activityPayload = getActivityPayload(payload);
  const centerPayload = getCenterPayload(payload);
  const centerMode = normalizeCenterMode(centerPayload.mode);
  const centerId = normalizeIdValue(activityPayload.center_id || centerPayload.center_id);

  return {
    ...defaultState,
    title: getTrimmedText(activityPayload.title),
    description: getTrimmedText(activityPayload.description),
    descriptionFormat: normalizeDescriptionFormat(
      activityPayload.description_format,
    ),
    centerMode,
    centerId,
    centerSearchQuery: "",
    centerProposalName: getTrimmedText(centerPayload.name),
    centerProposalNotes: getTrimmedText(centerPayload.notes),
    centerProposalCity: getTrimmedText(centerPayload.city_name),
    centerProposalInstitution: getTrimmedText(centerPayload.institution_name),
    centerProposalAddress: getTrimmedText(centerPayload.address_line_1),
    centerProposalPostalCode: getTrimmedText(centerPayload.postal_code),
    categoryId: normalizeIdValue(activityPayload.category_id),
    typeId: normalizeIdValue(activityPayload.type_id),
    imageUrl: getTrimmedText(activityPayload.image_url),
    ageRuleType: normalizeAgeRuleType(activityPayload.age_rule_type),
    ageMin: normalizeNumericValue(activityPayload.age_min),
    ageMax: normalizeNumericValue(activityPayload.age_max),
    priceLabel: getTrimmedText(activityPayload.price_label),
    isFree: activityPayload.is_free === true ? "true" : activityPayload.is_free === false ? "false" : "",
    scheduleLabel: getTrimmedText(activityPayload.schedule_label),
    venueName: getTrimmedText(activityPayload.venue_name),
    venueAddress1: getTrimmedText(activityPayload.venue_address_1),
    venuePostalCode: getTrimmedText(activityPayload.venue_postal_code),
    contactOptions: mapPayloadContactOptionsToFormState(payload),
    contactOptionsTouched: false,
    hasContactOptionsPayload: hasContactOptionsPayload(payload),
    importReview: payload?.import_review && typeof payload.import_review === "object" ? payload.import_review : null,
  };
}
