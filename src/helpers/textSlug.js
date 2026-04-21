export function slugifyText(value) {
  const normalizedValue =
    typeof value === "string"
      ? value
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase()
          .trim()
      : "";

  return normalizedValue
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
