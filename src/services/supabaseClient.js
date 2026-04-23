import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim() ?? "";
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() ?? "";
const normalizedSupabaseUrl = supabaseUrl.replace(/\/+$/, "");

const missingEnvVars = [];

if (!supabaseUrl) {
  missingEnvVars.push("VITE_SUPABASE_URL");
}

if (!supabaseAnonKey) {
  missingEnvVars.push("VITE_SUPABASE_ANON_KEY");
}

const supabaseConfigError = missingEnvVars.length
  ? `Faltan variables de entorno de Supabase: ${missingEnvVars.join(", ")}.`
  : "";

let supabaseRuntimeError = "";
let supabaseClient = null;

if (!supabaseConfigError) {
  try {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
  } catch (error) {
    supabaseRuntimeError =
      "No pudimos inicializar el cliente de Supabase con la configuración actual.";

    if (import.meta.env.DEV) {
      console.warn("[supabase] Fallo al crear el cliente.", error);
    }
  }
}

export const supabase = supabaseClient;

export function isSupabaseReady() {
  return Boolean(supabase);
}

export function getSupabaseClientError() {
  return supabaseConfigError || supabaseRuntimeError;
}

export function getSupabaseClient() {
  return supabase;
}

export function buildSupabasePublicStorageUrl(bucketName, objectPath) {
  const normalizedBucketName =
    typeof bucketName === "string"
      ? bucketName.trim().replace(/^\/+|\/+$/g, "")
      : "";
  const normalizedObjectPath =
    typeof objectPath === "string" ? objectPath.trim().replace(/^\/+/, "") : "";

  if (
    !normalizedSupabaseUrl ||
    !normalizedBucketName ||
    !normalizedObjectPath
  ) {
    return "";
  }

  const encodedObjectPath = normalizedObjectPath
    .split("/")
    .filter(Boolean)
    .map((pathSegment) => encodeURIComponent(pathSegment))
    .join("/");

  if (!encodedObjectPath) {
    return "";
  }

  return `${normalizedSupabaseUrl}/storage/v1/object/public/${normalizedBucketName}/${encodedObjectPath}`;
}
