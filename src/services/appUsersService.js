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

function splitAuthFullName(fullName) {
  const normalizedFullName = getTrimmedText(fullName);

  if (!normalizedFullName) {
    return {
      name: "",
      lastName: "",
    };
  }

  const nameParts = normalizedFullName.split(/\s+/).filter(Boolean);

  if (nameParts.length === 1) {
    return {
      name: nameParts[0],
      lastName: "",
    };
  }

  return {
    name: nameParts.slice(0, -1).join(" "),
    lastName: nameParts[nameParts.length - 1],
  };
}

function buildAppUser(profileRow, cityName) {
  if (!profileRow?.id) {
    return null;
  }

  const normalizedName = getTrimmedText(profileRow.name);
  const normalizedLastName = getTrimmedText(profileRow.last_name);

  return {
    id: profileRow.id,
    authUserId: profileRow.id,
    name: normalizedName,
    lastName: normalizedLastName,
    fullName: [normalizedName, normalizedLastName].filter(Boolean).join(" "),
    email: getTrimmedText(profileRow.email),
    cityId: profileRow.city_id ?? null,
    cityName: getTrimmedText(cityName),
    roleId: profileRow.role_id ?? null,
    raw: profileRow,
  };
}

async function getCityNameById(supabase, cityId) {
  if (!cityId) {
    return "";
  }

  const { data, error } = await supabase
    .from("cities")
    .select("name")
    .eq("id", cityId)
    .maybeSingle();

  if (error) {
    throw new Error(
      error.message || "No pudimos resolver la ciudad del perfil.",
    );
  }

  return getTrimmedText(data?.name);
}

export function isAuthUserEmailVerified(authUser) {
  return Boolean(authUser?.email_confirmed_at || authUser?.confirmed_at);
}

export function getDefaultOnboardingForm(authUser, appUser = null) {
  const metadata = getAuthUserMetadata(authUser);
  const preferredName =
    getTrimmedText(appUser?.name) ||
    getTrimmedText(metadata.given_name) ||
    getTrimmedText(metadata.first_name) ||
    splitAuthFullName(
      getTrimmedText(metadata.full_name) || getTrimmedText(metadata.name),
    ).name ||
    getTrimmedText(authUser?.email).split("@")[0] ||
    "";
  const preferredLastName =
    getTrimmedText(appUser?.lastName) ||
    getTrimmedText(metadata.family_name) ||
    getTrimmedText(metadata.last_name) ||
    splitAuthFullName(
      getTrimmedText(metadata.full_name) || getTrimmedText(metadata.name),
    ).lastName ||
    "";

  return {
    name: preferredName,
    lastName: preferredLastName,
    cityId: appUser?.cityId ? String(appUser.cityId) : "",
  };
}

export function hasRequiredAppUserProfile(appUser) {
  return Boolean(getTrimmedText(appUser?.name) && appUser?.cityId);
}

export async function readAppUser(authUser) {
  if (!authUser?.id) {
    return null;
  }

  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error(
      getSupabaseClientError() ||
        "No pudimos conectar con Supabase para cargar el perfil.",
    );
  }

  const { data, error } = await supabase
    .from("user_profiles")
    .select("id, name, last_name, email, city_id, role_id")
    .eq("id", authUser.id)
    .maybeSingle();

  if (error) {
    throw new Error(
      error.message || "No pudimos cargar el perfil de la cuenta autenticada.",
    );
  }

  if (!data) {
    return null;
  }

  const cityName = await getCityNameById(supabase, data.city_id);

  return buildAppUser(data, cityName);
}

export async function ensureAppUserProfile(profileInput) {
  const supabase = getSupabaseClient();

  if (!supabase) {
    throw new Error(
      getSupabaseClientError() ||
        "No pudimos conectar con Supabase para completar el perfil.",
    );
  }

  const normalizedName = getTrimmedText(profileInput?.name);
  const normalizedLastName = getTrimmedText(profileInput?.lastName);
  const normalizedCityId =
    typeof profileInput?.cityId === "string" && /^\d+$/.test(profileInput.cityId)
      ? Number(profileInput.cityId)
      : typeof profileInput?.cityId === "number"
        ? profileInput.cityId
        : null;

  if (!normalizedName) {
    throw new Error("El nombre es obligatorio para completar el perfil.");
  }

  if (!normalizedCityId) {
    throw new Error("La ciudad es obligatoria para completar el perfil.");
  }

  const { data, error } = await supabase.rpc("ensure_my_profile", {
    profile_name: normalizedName,
    profile_last_name: normalizedLastName || null,
    profile_city_id: normalizedCityId,
  });

  if (error) {
    throw new Error(
      error.message || "No pudimos completar el perfil del usuario.",
    );
  }

  const cityName = await getCityNameById(supabase, data?.city_id ?? normalizedCityId);

  return buildAppUser(data, cityName);
}
