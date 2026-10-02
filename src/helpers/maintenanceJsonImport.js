const text = (value) => typeof value === "string" ? value.trim() : "";
const object = (value) => value && typeof value === "object" && !Array.isArray(value) ? value : {};
const integer = (value) => Number.isInteger(value) && value >= 0 ? value : null;
const folded = (value) => text(value).normalize("NFKC").toLocaleLowerCase("es");
const safeUrl = (value) => {
  const candidate = text(value);
  if (!candidate) return null;
  try { const url = new URL(candidate); return ["https:", "http:"].includes(url.protocol) ? url.href : null; } catch { return null; }
};
const methods = new Set(["whatsapp", "phone", "email", "website", "form", "instagram"]);

export const MAINTENANCE_IMPORT_EXAMPLE = {
  version: 1,
  activities: [{
    title: "Título que aparece en el cartel",
    description: null,
    category: null,
    type: null,
    center: { name: "Nombre real del centro", city: null, institution_name: null, address_line_1: null, postal_code: null },
    age: { rule: null, min: null, max: null },
    price: { is_free: null, label: null },
    date: null,
    schedule: null,
    venue: { name: null, address_line_1: null, postal_code: null },
    image_url: null,
    contacts: [],
    source_url: null,
    notes: "Indica aquí los datos que faltan o requieren confirmación.",
  }],
};

export function buildMaintenanceImportPrompt({ categories = [], types = [] } = {}) {
  return `Extrae las actividades del material proporcionado y devuelve solo JSON válido con version: 1 y activities: []. Usa la estructura de este ejemplo:\n${JSON.stringify(MAINTENANCE_IMPORT_EXAMPLE, null, 2)}\nCategorías disponibles: ${categories.map((entry) => entry.name).join(", ") || "se elegirán durante la revisión"}. Tipos disponibles: ${types.map((entry) => entry.name).join(", ") || "se elegirán durante la revisión"}.\nNo inventes datos. Usa null si falta un dato; no completes el año de una fecha, la edad ni el precio. age.rule admite range, from, until, all o null; all solo cuando la fuente indica todas las edades. price.is_free es true solo si la fuente indica gratis, false solo si indica de pago; si no consta, null. Puedes sugerir una categoría y redactar una descripción basada exclusivamente en la información disponible: identifica estas propuestas en notes para revisión humana. Conserva nombres, fechas y contactos tal como constan. date es texto literal, sin añadir el año. schedule contiene el horario literal. contacts usa method (whatsapp, phone, email, website, form, instagram), value y label opcional. No conviertas una URL de referencia en contacto si no consta como tal. Si consultas una web, registra su URL en source_url y explica la procedencia en notes. No incluyas identificadores internos, HTML, imágenes base64 ni datos de usuarios. Nunca publiques: el resultado se revisará como borrador.`;
}

function matchChoice(choices, name) {
  const matches = choices.filter((entry) => folded(entry.name) === folded(name));
  return matches.length === 1 ? matches[0] : null;
}

export function parseMaintenanceJsonImport(rawText, { centers = [], categories = [], types = [] } = {}) {
  if (typeof rawText !== "string" || rawText.length > 1024 * 1024) throw new Error("El JSON debe tener como máximo 1 MB.");
  let value;
  try { value = JSON.parse(rawText); } catch { throw new Error("El contenido no es JSON válido. Revisa comas, comillas y llaves."); }
  const envelope = object(value);
  if (envelope.version !== 1 || !Array.isArray(envelope.activities) || !envelope.activities.length || envelope.activities.length > 100) {
    throw new Error("Usa version: 1 y activities con entre 1 y 100 actividades.");
  }
  return envelope.activities.map((entry, index) => {
    if (!entry || typeof entry !== "object" || Array.isArray(entry)) throw new Error(`La actividad ${index + 1} debe ser un objeto.`);
    const warnings = [];
    const center = object(entry.center);
    const age = object(entry.age);
    const price = object(entry.price);
    const venue = object(entry.venue);
    const category = matchChoice(categories, entry.category);
    const type = matchChoice(types, entry.type);
    const centerMatches = centers.filter((choice) => folded(choice.name) === folded(center.name)
      && (!text(center.city) || folded(choice.cityName) === folded(center.city)));
    const existingCenter = centerMatches.length === 1 ? centerMatches[0] : null;
    const ageRule = ["range", "from", "until", "all"].includes(age.rule) ? age.rule : null;
    const isFree = typeof price.is_free === "boolean" ? price.is_free : null;
    const contacts = [];
    if (entry.contacts != null && !Array.isArray(entry.contacts)) throw new Error(`Los contactos de la actividad ${index + 1} deben ser una lista.`);
    for (const [contactIndex, contact] of (entry.contacts ?? []).entries()) {
      if (!methods.has(contact?.method) || !text(contact?.value)) {
        warnings.push(`Contacto ${contactIndex + 1} incompleto; añádelo en la revisión.`);
        continue;
      }
      const contactValue = text(contact.value);
      if (["website", "form"].includes(contact.method) && !safeUrl(contactValue)) {
        warnings.push(`Contacto ${contactIndex + 1} con URL no válida; corrígelo en la revisión.`);
        continue;
      }
      contacts.push({ contact_method: contact.method, contact_value: contactValue, contact_label: text(contact.label) || null, is_primary: false });
    }
    const missing = [
      [!text(entry.title), "Falta el título."], [!text(entry.description), "Falta la descripción."],
      [!category, "Selecciona y confirma la categoría."], [!type, "Selecciona y confirma el tipo."],
      [!existingCenter, centerMatches.length > 1 ? "Hay varios centros coincidentes; selecciona uno." : "Selecciona un centro o revisa el alta del centro nuevo."],
      [!ageRule, "La edad no consta: debe confirmarse antes de publicar."],
      [isFree === null, "El precio no consta: debe confirmarse antes de publicar."],
      [!text(entry.schedule), "Falta confirmar el horario."],
      [!contacts.length, "No hay contactos confirmados."],
      [text(entry.image_url) && !safeUrl(entry.image_url), "La URL de imagen no es válida; sube una imagen durante la revisión."],
    ];
    missing.forEach(([condition, warning]) => { if (condition) warnings.push(warning); });
    const dateText = text(entry.date);
    if (dateText && !/\b(?:19|20)\d{2}\b/.test(dateText)) warnings.push("La fecha no incluye año: confirma su vigencia sin deducirlo.");
    if (ageRule === "range" && (integer(age.min) === null || integer(age.max) === null || age.min > age.max)) warnings.push("El rango de edad debe completarse o corregirse.");
    if (ageRule === "from" && integer(age.min) === null) warnings.push("Falta la edad mínima.");
    if (ageRule === "until" && integer(age.max) === null) warnings.push("Falta la edad máxima.");
    const payload = {
      activity: {
        title: text(entry.title), description: text(entry.description), description_format: "markdown",
        center_id: existingCenter?.id ?? null, category_id: category?.id ?? null, type_id: type?.id ?? null,
        image_url: safeUrl(entry.image_url), age_rule_type: ageRule,
        age_min: ["range", "from"].includes(ageRule) ? integer(age.min) : null,
        age_max: ["range", "until"].includes(ageRule) ? integer(age.max) : null,
        is_free: isFree, price_label: isFree === true ? null : text(price.label) || null,
        schedule_label: [dateText, text(entry.schedule)].filter(Boolean).join(" · ") || null,
        venue_name: text(venue.name) || null, venue_address_1: text(venue.address_line_1) || null,
        venue_postal_code: text(venue.postal_code) || null,
      },
      center: existingCenter ? { mode: "existing", center_id: existingCenter.id } : {
        mode: "proposed_new", name: text(center.name), city_name: text(center.city),
        institution_name: text(center.institution_name), address_line_1: text(center.address_line_1),
        postal_code: text(center.postal_code), notes: text(entry.notes),
      },
      contact_options: contacts,
      import_review: { warnings, notes: text(entry.notes), date_literal: dateText, requires_confirmation: true },
    };
    return { payload, warnings, sourceLabel: `Importación JSON · ${text(entry.title) || `Actividad ${index + 1}`}`, sourceUrl: safeUrl(entry.source_url), original: entry };
  });
}

export async function getMaintenanceImportBatchKey(items) {
  const content = JSON.stringify(items.map(({ payload, sourceUrl }) => ({ payload, sourceUrl })));
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(content));
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}
