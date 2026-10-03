function creationError(message, code, requiresRecovery = false, centerRequestStarted = false) {
  const error = new Error(message);
  error.code = code;
  error.requiresRecovery = requiresRecovery;
  error.centerRequestStarted = centerRequestStarted;
  return error;
}

function positiveId(value) {
  const id = typeof value === "string" && /^\d+$/.test(value.trim()) ? Number(value.trim()) : value;
  return Number.isSafeInteger(id) && id > 0 ? id : null;
}

function boundCenterId(draft) {
  if (draft?.reviewedPayload?.center?.mode !== "existing") return null;
  return positiveId(draft.reviewedPayload.activity?.center_id);
}

export function applyMaintenanceCenterBinding(draft, centerId) {
  const id = positiveId(centerId);
  if (!id) throw creationError("No pudimos confirmar el centro creado. Comprueba el borrador antes de reintentar.", "CENTER_RESPONSE_INVALID", true);
  const payload = draft.reviewedPayload ?? {};
  return {
    ...draft,
    reviewedPayload: {
      ...payload,
      activity: { ...payload.activity, center_id: id },
      center: { mode: "existing", center_id: id },
      ...(payload.import_review ? { import_review: { ...payload.import_review, review_confirmed: false } } : {}),
    },
  };
}

// The dependencies are injected so transaction-response loss can be tested
// without a browser or a live Supabase session. Always reconcile before saving:
// a successful previous RPC must not be overwritten by a stale proposed center.
export async function createAndLinkMaintenanceCenter(
  { draftId, reviewedPayload, internalReviewNotes, centerPayload, expectedDraftUpdatedAt, recoveringCreation = false },
  { readDraft, saveDraft, createCenter, onDraftSaved },
) {
  const id = positiveId(draftId);
  if (!id) throw creationError("No encontramos un borrador válido para crear el centro.", "DRAFT_ID_INVALID");
  let fresh;
  try { fresh = await readDraft(id); }
  catch { throw creationError("No pudimos comprobar el borrador. Reintenta la comprobación antes de guardar otros cambios.", "DRAFT_RECOVERY_REQUIRED", true); }
  if (!fresh) throw creationError("El borrador ya no está disponible. Vuelve a la lista para comprobarlo.", "DRAFT_NOT_FOUND");
  const existingId = boundCenterId(fresh);
  if (existingId) return { centerId: existingId, draft: fresh, recovered: true };
  if (fresh.reviewStatus !== "pending_review") throw creationError("Este borrador ya no está pendiente de revisión. Recárgalo antes de continuar.", "DRAFT_NOT_PENDING");
  if (!recoveringCreation && expectedDraftUpdatedAt !== undefined && expectedDraftUpdatedAt !== fresh.updatedAt) {
    throw creationError("El borrador cambió desde que lo abriste. Recarga la versión guardada antes de crear el centro.", "DRAFT_REVISION_CONFLICT", true);
  }
  if (typeof fresh.updatedAt !== "string" || !fresh.updatedAt || !Number.isFinite(Date.parse(fresh.updatedAt))) {
    throw creationError("No pudimos comprobar la versión del borrador. Recárgalo antes de guardar cambios.", "DRAFT_RECOVERY_REQUIRED", true);
  }
  let saved = fresh;
  if (!recoveringCreation) {
    try {
      saved = await saveDraft({ draftId: id, reviewedPayload, internalReviewNotes, expectedUpdatedAt: fresh.updatedAt });
    } catch (error) {
      if (error?.code === "DRAFT_REVISION_CONFLICT") {
        let currentDraft;
        try { currentDraft = await readDraft(id); }
        catch { throw creationError("El borrador cambió y no pudimos recuperar su versión actual. Recárgalo antes de guardar otros cambios.", "DRAFT_REVISION_CONFLICT", true); }
        const currentCenterId = boundCenterId(currentDraft);
        if (currentCenterId) return { centerId: currentCenterId, draft: currentDraft, recovered: true };
        throw creationError("El borrador cambió mientras lo revisabas. Recárgalo para conservar los últimos cambios antes de crear el centro.", "DRAFT_REVISION_CONFLICT", true);
      }
      throw creationError("No pudimos guardar los datos del borrador. No se ha solicitado la creación del centro.", "DRAFT_SAVE_FAILED");
    }
    onDraftSaved?.(saved);
  }
  try {
    const centerId = positiveId(await createCenter({ ...centerPayload, draft_id: id }));
    if (!centerId) throw creationError("No pudimos confirmar la respuesta de creación.", "CENTER_RESPONSE_INVALID", true);
    return { centerId, draft: applyMaintenanceCenterBinding(saved, centerId), recovered: false };
  } catch (error) {
    let recoveredDraft;
    try { recoveredDraft = await readDraft(id); }
    catch { throw creationError("No pudimos confirmar si el centro quedó creado. Reintenta la comprobación antes de guardar otros cambios.", "DRAFT_RECOVERY_REQUIRED", true, true); }
    const recoveredId = boundCenterId(recoveredDraft);
    if (recoveredId) return { centerId: recoveredId, draft: recoveredDraft, recovered: true };
    // A read without a binding does not prove a timed-out RPC has stopped.
    // Only a confirmed SQL rejection permits other writes; an uncertain
    // request can still commit after this read and must be reconciled first.
    if (error?.creationRejected === true) {
      if (error?.isUserFacing === true) {
        error.currentDraft = recoveredDraft;
        throw error;
      }
      throw creationError("No pudimos crear el centro. Los datos del borrador siguen guardados; revisa los campos y reintenta.", "CENTER_CREATION_FAILED");
    }
    throw creationError("No pudimos confirmar el resultado del alta. Compruébalo de nuevo antes de editar o guardar; la solicitud podría seguir en curso.", "CENTER_RESULT_UNCERTAIN", true, true);
  }
}
