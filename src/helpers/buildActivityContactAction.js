function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeContactMethod(contactMethod) {
  return getTrimmedText(contactMethod).toLowerCase();
}

function buildActivityGreeting(activity) {
  const activityTitle = getTrimmedText(activity?.title) || "esta actividad";
  const cityFragment = activity?.city_name ? ` en ${activity.city_name}` : "";

  return `Hola, me interesa la actividad "${activityTitle}"${cityFragment}. Podrias darme mas informacion?`;
}

function buildWhatsappUrl(contactValue, activity) {
  const normalizedPhone = getTrimmedText(contactValue).replace(/\D+/g, "");

  if (!normalizedPhone) {
    return "";
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(buildActivityGreeting(activity))}`;
}

function buildEmailUrl(contactValue, activity) {
  const normalizedEmail = getTrimmedText(contactValue);

  if (!normalizedEmail) {
    return "";
  }

  const activityTitle = getTrimmedText(activity?.title) || "actividad";
  const subject = `Consulta sobre ${activityTitle}`;
  const body = buildActivityGreeting(activity);

  return `mailto:${normalizedEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function buildPhoneUrl(contactValue) {
  const normalizedPhone = getTrimmedText(contactValue).replace(/[^\d+]/g, "");

  return normalizedPhone ? `tel:${normalizedPhone}` : "";
}

function buildWebUrl(contactValue) {
  const normalizedUrl = getTrimmedText(contactValue);

  if (!normalizedUrl) {
    return "";
  }

  if (/^https?:\/\//i.test(normalizedUrl)) {
    return normalizedUrl;
  }

  return `https://${normalizedUrl}`;
}

export function buildActivityContactActionUrl(activity, contactOption) {
  const contactMethod = normalizeContactMethod(contactOption?.contactMethod);
  const contactValue = getTrimmedText(contactOption?.contactValue);

  if (!contactMethod || !contactValue) {
    return "";
  }

  if (contactMethod === "whatsapp") {
    return buildWhatsappUrl(contactValue, activity);
  }

  if (contactMethod === "email") {
    return buildEmailUrl(contactValue, activity);
  }

  if (contactMethod === "phone") {
    return buildPhoneUrl(contactValue);
  }

  if (contactMethod === "form" || contactMethod === "web") {
    return buildWebUrl(contactValue);
  }

  return "";
}

export function getActivityContactOptionLabel(contactOption) {
  const contactMethod = normalizeContactMethod(contactOption?.contactMethod);

  if (contactMethod === "whatsapp") {
    return "Abrir WhatsApp";
  }

  if (contactMethod === "email") {
    return "Enviar email";
  }

  if (contactMethod === "phone") {
    return "Llamar";
  }

  if (contactMethod === "form") {
    return "Abrir formulario";
  }

  if (contactMethod === "web") {
    return "Abrir web";
  }

  return "Abrir contacto";
}

export function openActivityContactAction(activity, contactOption) {
  if (typeof window === "undefined") {
    return false;
  }

  const contactMethod = normalizeContactMethod(contactOption?.contactMethod);
  const contactUrl = buildActivityContactActionUrl(activity, contactOption);

  if (!contactUrl) {
    return false;
  }

  if (contactMethod === "email" || contactMethod === "phone") {
    window.location.assign(contactUrl);
    return true;
  }

  window.open(contactUrl, "_blank", "noopener,noreferrer");
  return true;
}
