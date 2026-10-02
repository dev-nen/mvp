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
const MAX_COVER_DIMENSION = 1600;

export async function optimizeDraftCoverImage(file) {
  const validationError = validateDraftCoverImageFile(file);
  if (validationError) throw new Error(validationError);
  let decoded;
  let imageUrl = "";
  try {
    if (typeof createImageBitmap === "function") decoded = await createImageBitmap(file);
    else {
      imageUrl = URL.createObjectURL(file);
      decoded = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = imageUrl;
      });
    }
    if (!decoded.width || !decoded.height || decoded.width * decoded.height > 40000000) throw new Error("La imagen tiene dimensiones demasiado grandes.");
    const ratio = Math.min(1, MAX_COVER_DIMENSION / Math.max(decoded.width, decoded.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(decoded.width * ratio));
    canvas.height = Math.max(1, Math.round(decoded.height * ratio));
    const context = canvas.getContext("2d");
    if (!context) throw new Error("No pudimos preparar la imagen.");
    context.drawImage(decoded, 0, 0, canvas.width, canvas.height);
    const result = await new Promise((resolve) => canvas.toBlob(resolve, "image/webp", 0.82));
    if (!result || result.size > MAX_COVER_IMAGE_BYTES) throw new Error("No pudimos optimizar la imagen.");
    // Browsers without WebP encoding may return PNG; use its actual MIME.
    return new File([result], "cover", { type: result.type });
  } catch {
    throw new Error("No pudimos preparar la imagen. Prueba con otro archivo JPG, PNG o WebP.");
  } finally {
    decoded?.close?.();
    if (imageUrl) URL.revokeObjectURL(imageUrl);
  }
}

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
  const optimizedFile = await optimizeDraftCoverImage(file);
  const extension = COVER_IMAGE_EXTENSION_BY_MIME.get(optimizedFile.type);
  const objectPath = `drafts/${normalizedDraftId}/cover-${getSafeUuid()}.${extension}`;
  const { error } = await supabase.storage
    .from(ACTIVITY_IMAGE_BUCKET)
    .upload(objectPath, optimizedFile, {
      cacheControl: "3600",
      contentType: optimizedFile.type,
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
