import {
  buildSupabasePublicStorageUrl,
  getSupabaseClient,
  getSupabaseClientError,
} from "@/services/supabaseClient";

const ACTIVITY_IMAGE_BUCKET = "activities";
const MAX_COVER_IMAGE_BYTES = 5 * 1024 * 1024;
const COVER_IMAGE_EXTENSION_BY_MIME = new Map([
  ["image/jpeg", "jpg"],
  ["image/png", "png"],
  ["image/webp", "webp"],
]);

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getSafeUuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }

  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getSupabaseOrThrow() {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error(
      getSupabaseClientError() ||
        "No pudimos conectar con Supabase para subir la imagen.",
    );
  }

  return supabase;
}

export function validateDraftCoverImageFile(file) {
  if (!file) {
    return "Selecciona una imagen principal.";
  }

  if (!COVER_IMAGE_EXTENSION_BY_MIME.has(file.type)) {
    return "La imagen debe ser JPG, PNG o WebP. SVG no está permitido.";
  }

  if (file.size > MAX_COVER_IMAGE_BYTES) {
    return "La imagen no puede superar 5 MB.";
  }

  return "";
}

export function resolveActivityImagePreviewUrl(value) {
  const imageReference = getTrimmedText(value);

  if (!imageReference) {
    return "";
  }

  if (
    imageReference.startsWith("/") ||
    imageReference.startsWith("blob:") ||
    imageReference.startsWith("data:") ||
    /^https?:\/\//i.test(imageReference)
  ) {
    return imageReference;
  }

  return buildSupabasePublicStorageUrl(ACTIVITY_IMAGE_BUCKET, imageReference);
}

export async function uploadDraftCoverImage({ draftId, file }) {
  const validationError = validateDraftCoverImageFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const normalizedDraftId = Number(draftId);

  if (!Number.isFinite(normalizedDraftId) || normalizedDraftId <= 0) {
    throw new Error("Necesitamos un draft válido antes de subir la imagen.");
  }

  const supabase = getSupabaseOrThrow();
  const extension = COVER_IMAGE_EXTENSION_BY_MIME.get(file.type);
  const objectPath = `drafts/${normalizedDraftId}/cover-${getSafeUuid()}.${extension}`;
  const { error } = await supabase.storage
    .from(ACTIVITY_IMAGE_BUCKET)
    .upload(objectPath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(
      error.message || "No pudimos subir la imagen principal.",
    );
  }

  return objectPath;
}

export async function uploadUserSubmissionCoverImage({ userId, file }) {
  const validationError = validateDraftCoverImageFile(file);

  if (validationError) {
    throw new Error(validationError);
  }

  const normalizedUserId =
    typeof userId === "string" ? userId.trim().toLowerCase() : "";

  if (!/^[0-9a-f-]{36}$/.test(normalizedUserId)) {
    throw new Error("Necesitamos una cuenta valida antes de subir la imagen.");
  }

  const supabase = getSupabaseOrThrow();
  const extension = COVER_IMAGE_EXTENSION_BY_MIME.get(file.type);
  const objectPath = `user-submissions/${normalizedUserId}/cover-${getSafeUuid()}.${extension}`;
  const { error } = await supabase.storage
    .from(ACTIVITY_IMAGE_BUCKET)
    .upload(objectPath, file, {
      cacheControl: "3600",
      contentType: file.type,
      upsert: false,
    });

  if (error) {
    throw new Error(
      error.message || "No pudimos subir la imagen principal.",
    );
  }

  return objectPath;
}
