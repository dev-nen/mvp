import {
  clearFormLocalRecovery,
  readFormLocalRecovery,
  writeFormLocalRecovery,
} from "@/helpers/formLocalRecovery";

const STORAGE_VERSION = 1;
const BASE_STORAGE_KEY = "nensgo.publisherRequest.localDraft.v1";

const ORGANIZER_TYPES = ["individual", "company_or_entity"];

const STRING_FIELDS = [
  "activityDescription",
  "addressLine1",
  "cityId",
  "cityLabel",
  "commercialName",
  "fullName",
  "instagram",
  "municipalityQuery",
  "organizerType",
  "phone",
  "website",
];

function normalizeText(value) {
  return typeof value === "string" ? value : "";
}

function normalizeOrganizerType(value) {
  const normalizedValue = normalizeText(value).trim().toLowerCase();

  return ORGANIZER_TYPES.includes(normalizedValue)
    ? normalizedValue
    : "individual";
}

function sanitizePublisherRequestFormState(formState) {
  const source =
    formState && typeof formState === "object" && !Array.isArray(formState)
      ? formState
      : {};
  const nextFormState = {};

  STRING_FIELDS.forEach((fieldName) => {
    nextFormState[fieldName] = normalizeText(source[fieldName]);
  });

  nextFormState.organizerType = normalizeOrganizerType(
    nextFormState.organizerType,
  );
  nextFormState.hasPhysicalLocation = source.hasPhysicalLocation === true;

  return nextFormState;
}

function hasMeaningfulLocalDraft(formState) {
  return (
    formState.hasPhysicalLocation === true ||
    STRING_FIELDS.some((fieldName) => normalizeText(formState[fieldName]).trim())
  );
}

function normalizeStoredPayload(storedPayload) {
  if (
    !storedPayload ||
    typeof storedPayload !== "object" ||
    Array.isArray(storedPayload)
  ) {
    return null;
  }

  const formState = sanitizePublisherRequestFormState(storedPayload.formState);

  return hasMeaningfulLocalDraft(formState) ? { formState } : null;
}

export function getPublisherRequestLocalDraftStorageKey({ requestId } = {}) {
  if (requestId) {
    return `nensgo.publisherRequest.${requestId}.localDraft.v1`;
  }

  return BASE_STORAGE_KEY;
}

export function readPublisherRequestLocalDraft(storageKey) {
  return readFormLocalRecovery({
    sanitizePayload: normalizeStoredPayload,
    storageKey,
    version: STORAGE_VERSION,
  });
}

export function writePublisherRequestLocalDraft(storageKey, formState) {
  return writeFormLocalRecovery({
    payload: {
      formState,
    },
    sanitizePayload: normalizeStoredPayload,
    storageKey,
    version: STORAGE_VERSION,
  });
}

export function clearPublisherRequestLocalDraft(storageKey) {
  clearFormLocalRecovery(storageKey);
}
