function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeContactMethod(contactMethod) {
  return getTrimmedText(contactMethod).toLowerCase();
}

function buildActivityGreeting(activity, contactContext = {}) {
  const activityTitle = getTrimmedText(activity?.title) || "esta actividad";
  const cityFragment = activity?.city_name ? ` en ${activity.city_name}` : "";
  const requesterName = getTrimmedText(contactContext.requesterName);
  const interestFragment = requesterName
    ? ` soy ${requesterName}. Me interesa`
    : " me interesa";

  return `Hola,${interestFragment} la actividad "${activityTitle}"${cityFragment}. ¿Podrías darme más información?`;
}

function buildWhatsappUrl(contactValue, activity, contactContext) {
  const normalizedPhone = getTrimmedText(contactValue).replace(/\D+/g, "");

  if (!normalizedPhone) {
    return "";
  }

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(
    buildActivityGreeting(activity, contactContext),
  )}`;
}

function buildEmailUrl(contactValue, activity, contactContext) {
  const normalizedEmail = getTrimmedText(contactValue);

  if (!normalizedEmail) {
    return "";
  }

  const activityTitle = getTrimmedText(activity?.title) || "actividad";
  const subject = `Consulta sobre ${activityTitle}`;
  const body = buildActivityGreeting(activity, contactContext);

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

export function buildActivityContactActionUrl(
  activity,
  contactOption,
  contactContext = {},
) {
  const contactMethod = normalizeContactMethod(contactOption?.contactMethod);
  const contactValue = getTrimmedText(contactOption?.contactValue);

  if (!contactMethod || !contactValue) {
    return "";
  }

  if (contactMethod === "whatsapp") {
    return buildWhatsappUrl(contactValue, activity, contactContext);
  }

  if (contactMethod === "email") {
    return buildEmailUrl(contactValue, activity, contactContext);
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

export function openActivityContactAction(
  activity,
  contactOption,
  contactContext = {},
) {
  if (typeof window === "undefined") {
    return false;
  }

  const contactMethod = normalizeContactMethod(contactOption?.contactMethod);
  const contactUrl = buildActivityContactActionUrl(
    activity,
    contactOption,
    contactContext,
  );

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
