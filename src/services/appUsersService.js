import {
  getSupabaseClient,
  getSupabaseClientError,
} from "@/services/supabaseClient";

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getAuthUserMetadata(authUser) {
  return authUser?.user_metadata && typeof authUser.user_metadata === "object"
    ? authUser.user_metadata
    : {};
}

export function syncAppUserFromAuth(authUser) {
  if (!authUser?.id) {
    return null;
  }

  const metadata = getAuthUserMetadata(authUser);
  const email = getTrimmedText(authUser.email);
  const fullName =
    getTrimmedText(metadata.full_name) ||
    getTrimmedText(metadata.name) ||
    email;

  return {
    id: authUser.id,
    authUserId: authUser.id,
    cityId: metadata.city_id ?? null,
    cityName: getTrimmedText(metadata.city_name),
    citySlug: getTrimmedText(metadata.city_slug),
    email,
    fullName,
    raw: authUser,
  };
}

export function hasRequiredAppUserCity(appUser) {
  return Boolean(getTrimmedText(appUser?.cityName));
}

export async function updateAppUserRequiredCity(authUser, cityOption) {
  if (!authUser?.id) {
    throw new Error("Necesitamos una sesion activa para guardar la ciudad.");
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error(
      getSupabaseClientError() ||
        "No pudimos conectar con Supabase para guardar la ciudad.",
    );
  }

  const currentMetadata = getAuthUserMetadata(authUser);
  const nextMetadata = {
    ...currentMetadata,
    city_id: cityOption?.id ?? null,
    city_name: cityOption?.name || "",
    city_slug: cityOption?.slug || "",
  };

  const { data, error } = await supabase.auth.updateUser({
    data: nextMetadata,
  });

  if (error) {
    throw new Error(
      error.message || "No pudimos guardar la ciudad del usuario.",
    );
  }

  const nextUser = data.user ?? {
    ...authUser,
    user_metadata: nextMetadata,
  };

  return {
    appUser: syncAppUserFromAuth(nextUser),
    user: nextUser,
  };
}
