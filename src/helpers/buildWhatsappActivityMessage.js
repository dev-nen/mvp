const WHATSAPP_BASE_URL = "https://wa.me/34635220915";

export function buildWhatsappActivityMessage(activity) {
  const activityTitle = activity?.title?.trim() || "esta actividad";
  const cityFragment = activity?.city_name ? ` en ${activity.city_name}` : "";

  return `Hola, me interesa la actividad "${activityTitle}"${cityFragment}. Podrias darme mas informacion?`;
}

export function buildWhatsappActivityUrl(activity) {
  const message = buildWhatsappActivityMessage(activity);

  return `${WHATSAPP_BASE_URL}?text=${encodeURIComponent(message)}`;
}
