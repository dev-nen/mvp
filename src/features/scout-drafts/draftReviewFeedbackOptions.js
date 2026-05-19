export const DRAFT_REVIEW_TARGET_STATUSES = {
  NEEDS_CHANGES: "needs_changes",
  REJECTED: "rejected",
};

export const DRAFT_REVIEW_FEEDBACK_OPTIONS = [
  {
    id: "missing_age",
    label: "Falta edad recomendada",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.NEEDS_CHANGES,
    field: "ageRuleType",
    payload_path: "activity.age_rule_type",
    reason_code: "missing_age",
    message: "Falta indicar para que edades esta recomendada la actividad.",
  },
  {
    id: "missing_schedule",
    label: "Falta horario o fecha",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.NEEDS_CHANGES,
    field: "scheduleLabel",
    payload_path: "activity.schedule_label",
    reason_code: "missing_schedule",
    message: "Falta indicar el horario, fecha o disponibilidad de la actividad.",
  },
  {
    id: "missing_location",
    label: "Falta ubicacion",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.NEEDS_CHANGES,
    field: "venueAddress1",
    payload_path: "activity.venue_address_1",
    reason_code: "missing_location",
    message: "Falta indicar donde se realiza la actividad.",
  },
  {
    id: "missing_price",
    label: "Falta precio claro",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.NEEDS_CHANGES,
    field: "priceLabel",
    payload_path: "activity.price_label",
    reason_code: "missing_price",
    message: "Indica claramente si la actividad es gratis o de pago y cual es el precio.",
  },
  {
    id: "insufficient_description",
    label: "El texto es insuficiente",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.NEEDS_CHANGES,
    field: "description",
    payload_path: "activity.description",
    reason_code: "insufficient_description",
    message: "La descripcion necesita mas informacion para que una familia entienda la actividad.",
  },
  {
    id: "unclear_description",
    label: "La descripcion no se entiende",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.NEEDS_CHANGES,
    field: "description",
    payload_path: "activity.description",
    reason_code: "unclear_description",
    message: "Reescribe la descripcion de forma mas clara y facil de entender.",
  },
  {
    id: "missing_reference",
    label: "Falta contacto o enlace de referencia",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.NEEDS_CHANGES,
    field: "sourceReferenceUrl",
    payload_path: "source_reference_url",
    reason_code: "missing_reference",
    message: "Falta un enlace o referencia que nos permita revisar la informacion.",
  },
  {
    id: "invalid_image",
    label: "Imagen no valida o no representativa",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.NEEDS_CHANGES,
    field: "imageUrl",
    payload_path: "activity.image_url",
    reason_code: "invalid_image",
    message: "La imagen no parece valida o no representa bien la actividad.",
  },
  {
    id: "wrong_category",
    label: "Categoria incorrecta",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.NEEDS_CHANGES,
    field: "categoryId",
    payload_path: "activity.category_id",
    reason_code: "wrong_category",
    message: "Revisa la categoria de la actividad.",
  },
  {
    id: "wrong_area",
    label: "Ciudad o zona incorrecta",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.NEEDS_CHANGES,
    field: "venueAddress1",
    payload_path: "activity.venue_address_1",
    reason_code: "wrong_area",
    message: "Revisa la ciudad, zona o direccion indicada.",
  },
  {
    id: "possible_duplicate",
    label: "Actividad duplicada o parecida",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.NEEDS_CHANGES,
    field: "title",
    payload_path: "activity.title",
    reason_code: "possible_duplicate",
    message: "Esta actividad parece duplicada o muy parecida a otra ya existente. Revisa la informacion.",
  },
  {
    id: "unverifiable_information",
    label: "Informacion no verificable",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.NEEDS_CHANGES,
    field: "sourceReferenceUrl",
    payload_path: "source_reference_url",
    reason_code: "unverifiable_information",
    message: "No pudimos verificar la informacion. Anade una referencia clara o corrige los datos.",
  },
  {
    id: "not_family_focused",
    label: "No encaja con publico infantil/familiar",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.REJECTED,
    field: "description",
    payload_path: "activity.description",
    reason_code: "not_family_focused",
    message: "La actividad no encaja con el publico infantil o familiar de NensGo.",
  },
  {
    id: "adult_only_activity",
    label: "Actividad para mayores de edad",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.REJECTED,
    field: "ageRuleType",
    payload_path: "activity.age_rule_type",
    reason_code: "adult_only_activity",
    message: "No podemos aprobar actividades orientadas a mayores de edad.",
  },
  {
    id: "misleading_price",
    label: "Informacion enganosa sobre precio",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.REJECTED,
    field: "priceLabel",
    payload_path: "activity.price_label",
    reason_code: "misleading_price",
    message: "La informacion sobre el precio no es clara o puede resultar enganosa.",
  },
  {
    id: "potentially_harmful_content",
    label: "Contenido potencialmente danino",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.REJECTED,
    field: "description",
    payload_path: "activity.description",
    reason_code: "potentially_harmful_content",
    message: "No podemos aprobar contenido que pueda resultar danino o inadecuado para familias o menores.",
  },
  {
    id: "incompatible_sponsor",
    label: "Patrocinio o marca no compatible",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.REJECTED,
    field: "description",
    payload_path: "activity.description",
    reason_code: "incompatible_sponsor",
    message: "El patrocinio, marca o enfoque comercial no encaja con los criterios de NensGo.",
  },
  {
    id: "does_not_match_nensgo_criteria",
    label: "No cumple criterios de NensGo",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.REJECTED,
    field: "description",
    payload_path: "activity.description",
    reason_code: "does_not_match_nensgo_criteria",
    message: "La publicacion no cumple los criterios de NensGo para actividades infantiles o familiares.",
  },
  {
    id: "terms_violation",
    label: "No cumple terminos de uso",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.REJECTED,
    field: "description",
    payload_path: "activity.description",
    reason_code: "terms_violation",
    message: "La publicacion no cumple nuestros terminos de uso.",
  },
  {
    id: "unverifiable_activity",
    label: "Actividad no verificable",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.REJECTED,
    field: "sourceReferenceUrl",
    payload_path: "source_reference_url",
    reason_code: "unverifiable_activity",
    message: "No pudimos verificar la actividad con la informacion disponible.",
  },
  {
    id: "excessive_commercial_content",
    label: "Contenido comercial excesivo",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.REJECTED,
    field: "description",
    payload_path: "activity.description",
    reason_code: "excessive_commercial_content",
    message: "El contenido tiene un enfoque comercial excesivo para NensGo.",
  },
  {
    id: "child_safety_risk",
    label: "Riesgo de seguridad o bienestar infantil",
    targetStatus: DRAFT_REVIEW_TARGET_STATUSES.REJECTED,
    field: "description",
    payload_path: "activity.description",
    reason_code: "child_safety_risk",
    message: "No podemos aprobar publicaciones que generen dudas sobre seguridad o bienestar infantil.",
  },
];

export function getDraftReviewFeedbackOptions(targetStatus) {
  return DRAFT_REVIEW_FEEDBACK_OPTIONS.filter(
    (option) => option.targetStatus === targetStatus,
  );
}

export function buildUserFeedbackItems(selectedOptions) {
  return selectedOptions.map(
    ({ field, message, payload_path: payloadPath, reason_code: reasonCode }) => ({
      field,
      payload_path: payloadPath,
      reason_code: reasonCode,
      message,
    }),
  );
}

export function buildDefaultUserFeedbackSummary(targetStatus, selectedOptions) {
  const chipLabels = selectedOptions.map((option) => option.label).join(", ");

  if (targetStatus === DRAFT_REVIEW_TARGET_STATUSES.REJECTED) {
    return `No podemos aprobar esta publicacion porque no cumple los criterios de NensGo: ${chipLabels || "criterios de revision"}. Puedes revisar nuestros criterios y enviar una nueva publicacion que si encaje con la plataforma.`;
  }

  return `Tu publicacion necesita algunos cambios antes de poder revisarse de nuevo: ${chipLabels || "campos indicados"}. Corrige esos campos y vuelve a enviarla para revision.`;
}
