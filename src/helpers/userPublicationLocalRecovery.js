import { CONTACT_OPTION_TYPES } from "@/helpers/contactOptions";
import {
  clearFormLocalRecovery,
  readFormLocalRecovery,
  writeFormLocalRecovery,
} from "@/helpers/formLocalRecovery";
import { getDefaultDraftFormState } from "@/helpers/mapDraftPayloadToFormState";

const STORAGE_VERSION = 1;

const STRING_FIELDS = [
  "title",
  "description",
  "centerId",
  "centerSearchQuery",
  "centerProposalName",
  "centerProposalNotes",
  "categoryId",
  "typeId",
  "imageUrl",
  "ageMin",
  "ageMax",
  "priceLabel",
  "scheduleLabel",
  "venueName",
  "venueAddress1",
  "venuePostalCode",
  "sourceReferenceUrl",
];

const DESCRIPTION_FORMATS = ["markdown", "plain"];
const AGE_RULE_TYPES = ["all", "range", "from", "until"];
const CENTER_MODES = ["existing", "proposed_new", "not_applicable"];

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeText(value) {
  return typeof value === "string" ? value : "";
}

function getFieldValue(formState, fallbackFormState, fieldName) {
  if (
    formState &&
    typeof formState === "object" &&
    !Array.isArray(formState) &&
    Object.prototype.hasOwnProperty.call(formState, fieldName)
  ) {
    return formState[fieldName];
  }

  return fallbackFormState?.[fieldName];
}

function normalizeChoice(value, allowedValues, fallbackValue) {
  const normalizedValue = getTrimmedText(value).toLowerCase();

  return allowedValues.includes(normalizedValue) ? normalizedValue : fallbackValue;
}

function normalizeContactType(value) {
  const normalizedValue = getTrimmedText(value).toLowerCase();

  return CONTACT_OPTION_TYPES.includes(normalizedValue)
    ? normalizedValue
    : "whatsapp";
}

function sanitizeContactOptions(contactOptions) {
  if (!Array.isArray(contactOptions)) {
    return [];
  }

  return contactOptions
    .map((contactOption) => {
      if (!contactOption || typeof contactOption !== "object") {
        return null;
      }

      return {
        isPrimary: contactOption.isPrimary === true,
        label: normalizeText(contactOption.label),
        type: normalizeContactType(contactOption.type),
        value: normalizeText(contactOption.value),
      };
    })
    .filter(Boolean);
}

function sanitizeBooleanField(formState, fallbackFormState, fieldName) {
  const value = getFieldValue(formState, fallbackFormState, fieldName);

  return value === true;
}

function sanitizePublicationFormState(formState, fallbackFormState) {
  const fallbackState =
    fallbackFormState && typeof fallbackFormState === "object" && !Array.isArray(fallbackFormState)
      ? fallbackFormState
      : getDefaultDraftFormState();
  const nextFormState = getDefaultDraftFormState();

  STRING_FIELDS.forEach((fieldName) => {
    nextFormState[fieldName] = normalizeText(
      getFieldValue(formState, fallbackState, fieldName),
    );
  });

  nextFormState.descriptionFormat = normalizeChoice(
    getFieldValue(formState, fallbackState, "descriptionFormat"),
    DESCRIPTION_FORMATS,
    "markdown",
  );
  nextFormState.ageRuleType = normalizeChoice(
    getFieldValue(formState, fallbackState, "ageRuleType"),
    AGE_RULE_TYPES,
    "all",
  );
  nextFormState.centerMode = normalizeChoice(
    getFieldValue(formState, fallbackState, "centerMode"),
    CENTER_MODES,
    "existing",
  );
  nextFormState.isFree =
    getFieldValue(formState, fallbackState, "isFree") === "true" ||
    getFieldValue(formState, fallbackState, "isFree") === true
      ? "true"
      : "false";
  nextFormState.contactOptions = sanitizeContactOptions(
    getFieldValue(formState, fallbackState, "contactOptions"),
  );
  nextFormState.contactOptionsTouched = sanitizeBooleanField(
    formState,
    fallbackState,
    "contactOptionsTouched",
  );
  nextFormState.hasContactOptionsPayload = sanitizeBooleanField(
    formState,
    fallbackState,
    "hasContactOptionsPayload",
  );

  return nextFormState;
}

function getComparableFormState(formState) {
  return {
    ageMax: formState.ageMax,
    ageMin: formState.ageMin,
    ageRuleType: formState.ageRuleType,
    categoryId: formState.categoryId,
    centerId: formState.centerId,
    centerMode: formState.centerMode,
    centerProposalName: formState.centerProposalName,
    centerProposalNotes: formState.centerProposalNotes,
    centerSearchQuery: formState.centerSearchQuery,
    contactOptions: formState.contactOptions,
    contactOptionsTouched: formState.contactOptionsTouched,
    description: formState.description,
    descriptionFormat: formState.descriptionFormat,
    hasContactOptionsPayload: formState.hasContactOptionsPayload,
    imageUrl: formState.imageUrl,
    isFree: formState.isFree,
    priceLabel: formState.priceLabel,
    scheduleLabel: formState.scheduleLabel,
    sourceReferenceUrl: formState.sourceReferenceUrl,
    title: formState.title,
    typeId: formState.typeId,
    venueAddress1: formState.venueAddress1,
    venueName: formState.venueName,
    venuePostalCode: formState.venuePostalCode,
  };
}

function hasMeaningfulLocalDraft(formState, hadCoverFile, fallbackFormState) {
  if (hadCoverFile) {
    return true;
  }

  return (
    JSON.stringify(getComparableFormState(formState)) !==
    JSON.stringify(getComparableFormState(fallbackFormState))
  );
}

function normalizeStoredPayload(storedPayload, fallbackFormState) {
  if (
    !storedPayload ||
    typeof storedPayload !== "object" ||
    Array.isArray(storedPayload)
  ) {
    return null;
  }

  const baselineFormState = sanitizePublicationFormState(
    fallbackFormState,
    getDefaultDraftFormState(),
  );
  const formState = sanitizePublicationFormState(
    storedPayload.formState,
    baselineFormState,
  );
  const hadCoverFile = storedPayload.hadCoverFile === true;

  if (!hasMeaningfulLocalDraft(formState, hadCoverFile, baselineFormState)) {
    return null;
  }

  return {
    formState,
    hadCoverFile,
  };
}

export function getUserPublicationLocalDraftStorageKey({
  activityId,
  draftId,
  mode,
}) {
  if (mode === "new") {
    return "nensgo.userPublication.new.localDraft.v1";
  }

  if (mode === "correction" && draftId) {
    return `nensgo.userPublication.correction.${draftId}.localDraft.v1`;
  }

  if (mode === "edit" && activityId) {
    return `nensgo.userPublication.edit.${activityId}.localDraft.v1`;
  }

  return "";
}

export function readUserPublicationLocalDraft(storageKey, options = {}) {
  return readFormLocalRecovery({
    storageKey,
    version: STORAGE_VERSION,
    sanitizePayload: (payload) =>
      normalizeStoredPayload(payload, options.fallbackFormState),
  });
}

export function writeUserPublicationLocalDraft(
  storageKey,
  formState,
  options = {},
) {
  return writeFormLocalRecovery({
    storageKey,
    version: STORAGE_VERSION,
    payload: {
      formState,
      hadCoverFile: options.hadCoverFile === true,
    },
    sanitizePayload: (payload) =>
      normalizeStoredPayload(payload, options.fallbackFormState),
  });
}

export function clearUserPublicationLocalDraft(storageKey) {
  clearFormLocalRecovery(storageKey);
}
