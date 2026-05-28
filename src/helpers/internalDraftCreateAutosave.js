import { CONTACT_OPTION_TYPES } from "@/helpers/contactOptions";
import {
  clearFormLocalRecovery,
  readFormLocalRecovery,
  writeFormLocalRecovery,
} from "@/helpers/formLocalRecovery";
import { getDefaultDraftFormState } from "@/helpers/mapDraftPayloadToFormState";

export const INTERNAL_DRAFT_CREATE_LOCAL_DRAFT_STORAGE_KEY =
  "nensgo.internalDraftCreate.localDraft.v1";

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

  let hasPrimaryContactOption = false;

  return contactOptions
    .map((contactOption) => {
      if (!contactOption || typeof contactOption !== "object") {
        return null;
      }

      const isPrimary =
        contactOption.isPrimary === true && !hasPrimaryContactOption;

      if (isPrimary) {
        hasPrimaryContactOption = true;
      }

      return {
        isPrimary,
        label: normalizeText(contactOption.label),
        type: normalizeContactType(contactOption.type),
        value: normalizeText(contactOption.value),
      };
    })
    .filter(Boolean);
}

export function getInternalDraftCreateDefaultFormState() {
  return {
    ...getDefaultDraftFormState(),
    descriptionFormat: "markdown",
    hasContactOptionsPayload: true,
  };
}

export function sanitizeInternalDraftCreateFormState(formState) {
  if (!formState || typeof formState !== "object" || Array.isArray(formState)) {
    return getInternalDraftCreateDefaultFormState();
  }

  const nextFormState = getInternalDraftCreateDefaultFormState();

  STRING_FIELDS.forEach((fieldName) => {
    nextFormState[fieldName] = normalizeText(formState[fieldName]);
  });

  nextFormState.descriptionFormat = normalizeChoice(
    formState.descriptionFormat,
    DESCRIPTION_FORMATS,
    "markdown",
  );
  nextFormState.ageRuleType = normalizeChoice(
    formState.ageRuleType,
    AGE_RULE_TYPES,
    "all",
  );
  nextFormState.centerMode = normalizeChoice(
    formState.centerMode,
    CENTER_MODES,
    "existing",
  );
  nextFormState.isFree =
    formState.isFree === "true" || formState.isFree === true ? "true" : "false";
  nextFormState.contactOptions = sanitizeContactOptions(
    formState.contactOptions,
  );
  nextFormState.contactOptionsTouched = formState.contactOptionsTouched === true;
  nextFormState.hasContactOptionsPayload = true;

  return nextFormState;
}

function hasMeaningfulLocalDraft(formState, hadCoverFile) {
  if (hadCoverFile) {
    return true;
  }

  if (formState.isFree === "true" || formState.ageRuleType !== "all") {
    return true;
  }

  if (formState.centerMode !== "existing") {
    return true;
  }

  if (
    formState.contactOptionsTouched === true ||
    formState.contactOptions.length > 0
  ) {
    return true;
  }

  return STRING_FIELDS.some((fieldName) => getTrimmedText(formState[fieldName]));
}

function normalizeStoredPayload(storedPayload) {
  if (
    !storedPayload ||
    typeof storedPayload !== "object" ||
    Array.isArray(storedPayload)
  ) {
    return null;
  }

  const formState = sanitizeInternalDraftCreateFormState(
    storedPayload.formState,
  );
  const hadCoverFile = storedPayload.hadCoverFile === true;

  if (!hasMeaningfulLocalDraft(formState, hadCoverFile)) {
    return null;
  }

  return {
    formState,
    hadCoverFile,
  };
}

export function readInternalDraftCreateLocalDraft() {
  return readFormLocalRecovery({
    storageKey: INTERNAL_DRAFT_CREATE_LOCAL_DRAFT_STORAGE_KEY,
    version: STORAGE_VERSION,
    sanitizePayload: normalizeStoredPayload,
  });
}

export function writeInternalDraftCreateLocalDraft(formState, options = {}) {
  return writeFormLocalRecovery({
    storageKey: INTERNAL_DRAFT_CREATE_LOCAL_DRAFT_STORAGE_KEY,
    version: STORAGE_VERSION,
    payload: {
      formState,
      hadCoverFile: options.hadCoverFile === true,
    },
    sanitizePayload: normalizeStoredPayload,
  });
}

export function clearInternalDraftCreateLocalDraft() {
  clearFormLocalRecovery(INTERNAL_DRAFT_CREATE_LOCAL_DRAFT_STORAGE_KEY);
}
