function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function capitalizeName(value) {
  const trimmedValue = getTrimmedText(value);

  if (!trimmedValue) {
    return "";
  }

  return `${trimmedValue.charAt(0).toUpperCase()}${trimmedValue.slice(1)}`;
}

function getFirstWord(value) {
  return getTrimmedText(value).split(/\s+/)[0] || "";
}

function getFirstEmailSegment(email) {
  const localPart = getTrimmedText(email).split("@")[0] || "";
  return localPart.split(/[._-]/)[0] || "";
}

function getAuthUserMetadata(user) {
  return user?.user_metadata && typeof user.user_metadata === "object"
    ? user.user_metadata
    : {};
}

export function getShortUserDisplayName({ appUser, profile, user } = {}) {
  const metadata = getAuthUserMetadata(user);
  const rawName =
    getTrimmedText(profile?.display_name) ||
    getTrimmedText(profile?.name) ||
    getTrimmedText(appUser?.name) ||
    getTrimmedText(appUser?.fullName) ||
    getTrimmedText(metadata.given_name) ||
    getTrimmedText(metadata.first_name) ||
    getTrimmedText(metadata.full_name) ||
    getTrimmedText(metadata.name);
  const firstName = getFirstWord(rawName);

  if (firstName) {
    return capitalizeName(firstName);
  }

  return (
    capitalizeName(
      getFirstEmailSegment(getTrimmedText(appUser?.email) || user?.email),
    ) || "Usuario"
  );
}
