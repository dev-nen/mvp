import { AlertTriangle, ArrowLeft, LoaderCircle, SearchX } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { CatalogState } from "@/components/states/CatalogState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityPublicationBadge } from "@/features/scout-drafts/ActivityPublicationBadge";
import { ScoutDraftReviewForm } from "@/features/scout-drafts/ScoutDraftReviewForm";
import { ScoutDraftStatusBadge } from "@/features/scout-drafts/ScoutDraftStatusBadge";
import { MaintenanceCenterCreatePanel } from "@/features/scout-drafts/MaintenanceCenterCreatePanel";
import {
  DRAFT_REVIEW_TARGET_STATUSES,
  buildDefaultUserFeedbackSummary,
  buildUserFeedbackItems,
  getDraftReviewFeedbackOptions,
} from "@/features/scout-drafts/draftReviewFeedbackOptions";
import { useAuth } from "@/hooks/useAuth";
import { normalizeContactOptionsForPayload } from "@/helpers/contactOptions";
import { mapDraftPayloadToFormState } from "@/helpers/mapDraftPayloadToFormState";
import { mapFormStateToDraftPayload } from "@/helpers/mapFormStateToDraftPayload";
import { createAndLinkMaintenanceCenter } from "@/helpers/maintenanceCenterCreation";
import { createMaintenanceCenter } from "@/services/maintenanceAdminService";
import { getInternalApprovedActivity } from "@/services/internalApprovedActivitiesService";
import { approveInternalDraft } from "@/services/draftApprovalService";
import {
  getInternalDraftById,
  archiveInternalDraft,
  listDraftCategories,
  listDraftCenters,
  listDraftTypes,
  requestInternalDraftChanges,
  rejectInternalDraft,
  saveInternalDraftReview,
} from "@/services/internalDraftsService";
import { resolveActivityImagePreviewUrl, uploadDraftCoverImage } from "@/services/internalDraftCoverImageService";
import "./InternalDraftDetailPage.css";

function formatDateLabel(value) {
  if (!value) {
    return "Desconocida";
  }

  const dateValue = new Date(value);

  if (Number.isNaN(dateValue.getTime())) {
    return "Desconocida";
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(dateValue);
}

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function hasActivityPayloadValues(payload) {
  const activityPayload =
    payload && typeof payload === "object" && !Array.isArray(payload)
      ? payload.activity
      : null;

  return Boolean(
    activityPayload &&
      typeof activityPayload === "object" &&
      Object.values(activityPayload).some((value) => {
        if (typeof value === "string") {
          return value.trim().length > 0;
        }

        return value !== null && value !== undefined && value !== false;
      }),
  );
}

function getInitialDraftPayload(draft) {
  if (hasActivityPayloadValues(draft?.reviewedPayload)) {
    return draft.reviewedPayload;
  }

  return draft?.parsedPayload ?? {};
}

function validateDraftForApproval(formState) {
  if (!["all", "range", "from", "until"].includes(formState.ageRuleType)) return "Confirma la edad antes de aprobar; no se deduce de la fuente.";
  if (!["true", "false"].includes(formState.isFree)) return "Confirma si la actividad es gratuita o de pago antes de aprobar.";
  if (formState.importReview?.requires_confirmation && formState.importReview?.review_confirmed !== true) return "Confirma la revisión de los datos importados antes de aprobar.";
  if (!getTrimmedText(formState.title)) {
    return "El título es obligatorio para aprobar.";
  }

  if (!getTrimmedText(formState.description)) {
    return "La descripción es obligatoria para aprobar.";
  }

  if (!getTrimmedText(formState.centerId)) {
    return "El centro es obligatorio para aprobar.";
  }

  if (!getTrimmedText(formState.categoryId)) {
    return "La categoría es obligatoria para aprobar.";
  }

  if (!getTrimmedText(formState.typeId)) {
    return "El tipo es obligatorio para aprobar.";
  }

  if (!getTrimmedText(formState.scheduleLabel)) {
    return "El horario es obligatorio para aprobar.";
  }

  if (formState.ageRuleType === "range" && (!getTrimmedText(formState.ageMin) || !getTrimmedText(formState.ageMax))) {
    return "La regla de edad rango necesita edad mínima y máxima.";
  }

  if (formState.ageRuleType === "from" && !getTrimmedText(formState.ageMin)) {
    return "La regla de edad desde necesita edad mínima.";
  }

  if (formState.ageRuleType === "until" && !getTrimmedText(formState.ageMax)) {
    return "La regla de edad hasta necesita edad máxima.";
  }

  const { errors } = normalizeContactOptionsForPayload(formState.contactOptions);

  if (errors.length > 0) {
    return errors[0].message;
  }

  return "";
}

function getFeedbackOptionIdsFromItems(items) {
  if (!Array.isArray(items)) {
    return [];
  }

  return items
    .map((item) => getTrimmedText(item?.reason_code))
    .filter(Boolean);
}

export function InternalDraftDetailPage() {
  const navigate = useNavigate();
  const { draftId } = useParams();
  const { user } = useAuth();
  const [draft, setDraft] = useState(null);
  const [formState, setFormState] = useState(() => mapDraftPayloadToFormState({}));
  const [reviewNotes, setReviewNotes] = useState("");
  const [userFeedbackSummary, setUserFeedbackSummary] = useState("");
  const [feedbackTargetStatus, setFeedbackTargetStatus] = useState(
    DRAFT_REVIEW_TARGET_STATUSES.NEEDS_CHANGES,
  );
  const [selectedFeedbackOptionIds, setSelectedFeedbackOptionIds] = useState([]);
  const [centerChoices, setCenterChoices] = useState([]);
  const [categoryChoices, setCategoryChoices] = useState([]);
  const [typeChoices, setTypeChoices] = useState([]);
  const [linkedApprovedActivity, setLinkedApprovedActivity] = useState(null);
  const [linkedApprovedActivityError, setLinkedApprovedActivityError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackTone, setFeedbackTone] = useState("success");
  const [isSaving, setIsSaving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isRequestingChanges, setIsRequestingChanges] = useState(false);
  const [isArchiving, setIsArchiving] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isCreatingCenter, setIsCreatingCenter] = useState(false);
  const [centerRecoveryRequired, setCenterRecoveryRequired] = useState(false);
  const [centerRecoveryMode, setCenterRecoveryMode] = useState("creation");
  const [hasUncertainCenterRequest, setHasUncertainCenterRequest] = useState(false);
  const writeInFlight = useRef(false);
  const centerOperationInFlight = useRef(false);
  const displayedDraftId = useRef(draftId);

  useEffect(() => {
    displayedDraftId.current = draftId;
    setCenterRecoveryRequired(false);
    setCenterRecoveryMode("creation");
    setHasUncertainCenterRequest(false);
    let isMounted = true;

    const loadLinkedApprovedActivity = async (nextDraft) => {
      if (
        nextDraft?.reviewStatus !== "approved" ||
        !nextDraft?.approvedActivityId
      ) {
        return {
          nextLinkedApprovedActivity: null,
          nextLinkedApprovedActivityError: "",
        };
      }

      try {
        const nextLinkedApprovedActivity = await getInternalApprovedActivity(
          nextDraft.approvedActivityId,
        );

        return {
          nextLinkedApprovedActivity,
          nextLinkedApprovedActivityError: "",
        };
      } catch (linkedActivityError) {
        return {
          nextLinkedApprovedActivity: null,
          nextLinkedApprovedActivityError:
            linkedActivityError instanceof Error
              ? linkedActivityError.message
              : "No pudimos resolver la actividad aprobada vinculada.",
        };
      }
    };

    const loadDraftDetail = async () => {
      setIsLoading(true);
      setError("");
      setFeedbackMessage("");

      try {
        const [nextDraft, nextCenters, nextCategories, nextTypes] = await Promise.all([
          getInternalDraftById(draftId),
          listDraftCenters(),
          listDraftCategories(),
          listDraftTypes(),
        ]);
        const {
          nextLinkedApprovedActivity,
          nextLinkedApprovedActivityError,
        } = await loadLinkedApprovedActivity(nextDraft);

        if (!isMounted) {
          return;
        }

        if (!nextDraft) {
          setDraft(null);
          setCenterChoices(nextCenters);
          setCategoryChoices(nextCategories);
          setTypeChoices(nextTypes);
          setError("");
          setFormState(mapDraftPayloadToFormState({}));
          setReviewNotes("");
          setUserFeedbackSummary("");
          setSelectedFeedbackOptionIds([]);
          setLinkedApprovedActivity(null);
          setLinkedApprovedActivityError("");
          return;
        }

        setDraft(nextDraft);
        setCenterChoices(nextCenters);
        setCategoryChoices(nextCategories);
        setTypeChoices(nextTypes);
        setFormState(mapDraftPayloadToFormState(getInitialDraftPayload(nextDraft)));
        setReviewNotes(nextDraft.internalReviewNotes || nextDraft.reviewNotes || "");
        setUserFeedbackSummary(nextDraft.userFeedbackSummary || "");
        setSelectedFeedbackOptionIds(
          getFeedbackOptionIdsFromItems(nextDraft.userFeedbackJson),
        );
        setLinkedApprovedActivity(nextLinkedApprovedActivity);
        setLinkedApprovedActivityError(nextLinkedApprovedActivityError);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setDraft(null);
        setLinkedApprovedActivity(null);
        setLinkedApprovedActivityError("");
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No pudimos cargar el draft interno.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDraftDetail();

    return () => {
      isMounted = false;
    };
  }, [draftId]);

  const isPendingDraft = draft?.reviewStatus === "pending_review";
  const isReadOnlyDraft = draft?.reviewStatus !== "pending_review";
  const isWriteBusy = isSaving || isRejecting || isRequestingChanges || isArchiving || isApproving || isUploadingImage || isCreatingCenter;
  const areWritesBlocked = isWriteBusy || centerRecoveryRequired;
  const canArchiveDraft =
    draft &&
    ["pending_review", "needs_changes", "rejected"].includes(draft.reviewStatus) &&
    !draft.approvedActivityId;
  const activeFeedbackOptions = useMemo(
    () => getDraftReviewFeedbackOptions(feedbackTargetStatus),
    [feedbackTargetStatus],
  );
  const selectedFeedbackOptions = useMemo(() => {
    const selectedIds = new Set(selectedFeedbackOptionIds);

    return activeFeedbackOptions.filter((option) => selectedIds.has(option.id));
  }, [activeFeedbackOptions, selectedFeedbackOptionIds]);
  const parsedPayloadPreview = useMemo(
    () => JSON.stringify(draft?.parsedPayload ?? {}, null, 2),
    [draft?.parsedPayload],
  );

  const refreshDraft = async (nextFeedbackMessage = "", nextFeedbackTone = "success") => {
    const nextDraft = await getInternalDraftById(draftId);

    if (!nextDraft) {
      throw new Error("No pudimos refrescar el draft después de la operación.");
    }

    let nextLinkedApprovedActivity = null;
    let nextLinkedApprovedActivityError = "";

    if (nextDraft.reviewStatus === "approved" && nextDraft.approvedActivityId) {
      try {
        nextLinkedApprovedActivity = await getInternalApprovedActivity(
          nextDraft.approvedActivityId,
        );
      } catch (linkedActivityError) {
        nextLinkedApprovedActivityError =
          linkedActivityError instanceof Error
            ? linkedActivityError.message
            : "No pudimos resolver la actividad aprobada vinculada.";
      }
    }

    setDraft(nextDraft);
    setFormState(mapDraftPayloadToFormState(getInitialDraftPayload(nextDraft)));
    setReviewNotes(nextDraft.internalReviewNotes || nextDraft.reviewNotes || "");
    setUserFeedbackSummary(nextDraft.userFeedbackSummary || "");
    setSelectedFeedbackOptionIds(
      getFeedbackOptionIdsFromItems(nextDraft.userFeedbackJson),
    );
    setLinkedApprovedActivity(nextLinkedApprovedActivity);
    setLinkedApprovedActivityError(nextLinkedApprovedActivityError);
    setFeedbackMessage(nextFeedbackMessage);
    setFeedbackTone(nextFeedbackTone);
  };

  const handleFieldChange = (fieldName, nextValue) => {
    if (centerOperationInFlight.current || centerRecoveryRequired) return;
    setFormState((currentFormState) => {
      if (fieldName === "centerId" && getTrimmedText(nextValue)) {
        return {
          ...currentFormState,
          centerId: nextValue,
          centerMode: "existing",
          centerProposalName: "",
          centerProposalNotes: "",
          importReview: currentFormState.importReview ? { ...currentFormState.importReview, review_confirmed: false } : null,
        };
      }

      return {
        ...currentFormState,
        [fieldName]: nextValue,
        importReview: fieldName === "importReview" ? nextValue : currentFormState.importReview ? { ...currentFormState.importReview, review_confirmed: false } : null,
      };
    });
  };

  const handleImageFileChange = async (file) => {
    if (!file || !draft || !isPendingDraft || writeInFlight.current || centerRecoveryRequired) return;
    writeInFlight.current = true;
    setIsUploadingImage(true); setFeedbackMessage("");
    try {
      const path = await uploadDraftCoverImage({ draftId: draft.id, file });
      handleFieldChange("imageUrl", path);
      setFeedbackTone("success"); setFeedbackMessage("Imagen subida. Guarda el borrador para conservarla.");
    } catch {
      setFeedbackTone("error"); setFeedbackMessage("No pudimos subir la imagen. Usa JPG, PNG o WebP de hasta 5 MB y reintenta.");
    } finally { writeInFlight.current = false; setIsUploadingImage(false); }
  };

  const handleCreateCenter = async (centerPayload) => {
    if (!draft || !isPendingDraft || writeInFlight.current) return;
    writeInFlight.current = true;
    centerOperationInFlight.current = true;
    setIsCreatingCenter(true);
    setFeedbackMessage("");
    try {
      if (centerRecoveryRequired && centerRecoveryMode === "reload") {
        const nextDraft = await getInternalDraftById(draft.id);
        if (!nextDraft) throw new Error("No pudimos recuperar el borrador actualizado. Reintenta la recarga.");
        if (String(displayedDraftId.current) !== String(draft.id)) return;
        setDraft(nextDraft);
        setFormState(mapDraftPayloadToFormState(getInitialDraftPayload(nextDraft)));
        setReviewNotes(nextDraft.internalReviewNotes || nextDraft.reviewNotes || "");
        setCenterRecoveryRequired(false);
        setHasUncertainCenterRequest(false);
        setCenterRecoveryMode("creation");
        setFeedbackTone("success");
        setFeedbackMessage("Borrador actualizado recuperado. Revisa los datos antes de continuar.");
        return;
      }
      const result = await createAndLinkMaintenanceCenter({
        draftId: draft.id,
        reviewedPayload: mapFormStateToDraftPayload(formState),
        internalReviewNotes: reviewNotes,
        centerPayload,
        expectedDraftUpdatedAt: draft.updatedAt,
        recoveringCreation: hasUncertainCenterRequest,
      }, {
        readDraft: getInternalDraftById,
        saveDraft: saveInternalDraftReview,
        createCenter: createMaintenanceCenter,
        onDraftSaved: (savedDraft) => {
          if (String(displayedDraftId.current) === String(draft.id)) setDraft(savedDraft);
        },
      });
      if (String(displayedDraftId.current) !== String(draft.id)) return;
      // Apply the confirmed transaction before any optional reference refresh.
      // A failed list read must never turn this into another creation attempt.
      setDraft(result.draft);
      setFormState(mapDraftPayloadToFormState(result.draft.reviewedPayload));
      setReviewNotes(result.draft.internalReviewNotes || result.draft.reviewNotes || "");
      setCenterRecoveryRequired(false);
      setHasUncertainCenterRequest(false);
      setCenterRecoveryMode("creation");
      setCenterChoices((current) => current.some((center) => String(center.id) === String(result.centerId)) ? current : [
        ...current,
        {
          id: result.centerId,
          name: result.recovered ? "Centro vinculado al borrador" : centerPayload.name,
          cityId: centerPayload.city_id,
          cityName: formState.centerProposalCityLabel || formState.centerProposalCity,
          label: result.recovered ? "Centro vinculado al borrador" : centerPayload.name,
        },
      ]);
      setFeedbackTone("success");
      setFeedbackMessage("Centro creado y vinculado al borrador. Revisa los demás datos antes de aprobar.");
      const [draftRead, centersRead] = await Promise.allSettled([
        getInternalDraftById(draft.id), listDraftCenters(),
      ]);
      if (String(displayedDraftId.current) !== String(draft.id)) return;
      if (centersRead.status === "fulfilled") setCenterChoices(centersRead.value);
      if (draftRead.status === "fulfilled" && draftRead.value) {
        setDraft(draftRead.value);
        setFormState(mapDraftPayloadToFormState(getInitialDraftPayload(draftRead.value)));
        setReviewNotes(draftRead.value.internalReviewNotes || draftRead.value.reviewNotes || "");
        if (centersRead.status === "rejected") setFeedbackMessage("El centro está creado y vinculado al borrador. No pudimos actualizar la lista de centros; el vínculo se conserva. Puedes guardar y continuar la revisión.");
      } else {
        setCenterRecoveryRequired(true);
        setCenterRecoveryMode("reload");
        setFeedbackMessage("El centro se creó y su vínculo está confirmado. No pudimos recuperar la última versión del borrador; recárgala antes de guardar o publicar.");
      }
    } catch (failure) {
      if (String(displayedDraftId.current) !== String(draft.id)) return;
      if (failure?.currentDraft) {
        setDraft(failure.currentDraft);
        setFormState(mapDraftPayloadToFormState(getInitialDraftPayload(failure.currentDraft)));
        setReviewNotes(failure.currentDraft.internalReviewNotes || failure.currentDraft.reviewNotes || "");
      }
      setCenterRecoveryRequired((centerRecoveryMode === "reload" && centerRecoveryRequired) || failure?.requiresRecovery === true);
      setHasUncertainCenterRequest(failure?.requiresRecovery === true && (hasUncertainCenterRequest || failure?.centerRequestStarted === true));
      if (failure?.code === "DRAFT_REVISION_CONFLICT") setCenterRecoveryMode("reload");
      if (centerRecoveryMode === "reload" && centerRecoveryRequired) throw new Error("No pudimos recuperar el borrador actualizado. Reintenta la recarga.");
      setFeedbackTone("error");
      setFeedbackMessage(failure instanceof Error ? failure.message : "No pudimos completar el alta del centro.");
      throw failure;
    } finally {
      writeInFlight.current = false;
      centerOperationInFlight.current = false;
      setIsCreatingCenter(false);
    }
  };

  const handleFeedbackTargetChange = (nextTargetStatus) => {
    setFeedbackTargetStatus(nextTargetStatus);
    setSelectedFeedbackOptionIds([]);
    setUserFeedbackSummary("");
  };

  const handleFeedbackOptionToggle = (option) => {
    setSelectedFeedbackOptionIds((currentOptionIds) => {
      const nextOptionIds = currentOptionIds.includes(option.id)
        ? currentOptionIds.filter((optionId) => optionId !== option.id)
        : [...currentOptionIds, option.id];
      const nextSelectedOptions = getDraftReviewFeedbackOptions(
        feedbackTargetStatus,
      ).filter((feedbackOption) => nextOptionIds.includes(feedbackOption.id));

      setUserFeedbackSummary(
        buildDefaultUserFeedbackSummary(feedbackTargetStatus, nextSelectedOptions),
      );

      return nextOptionIds;
    });
  };

  const handleSaveDraft = async () => {
    if (!draft || !isPendingDraft || writeInFlight.current || centerRecoveryRequired) {
      return;
    }

    writeInFlight.current = true;
    setIsSaving(true);
    setFeedbackMessage("");
    setError("");

    try {
      const nextDraft = await saveInternalDraftReview({
        draftId: draft.id,
        internalReviewNotes: reviewNotes,
        reviewedPayload: mapFormStateToDraftPayload(formState),
        reviewNotes,
        expectedUpdatedAt: draft.updatedAt,
      });

      setDraft(nextDraft);
      setFormState(mapDraftPayloadToFormState(getInitialDraftPayload(nextDraft)));
      setReviewNotes(nextDraft.internalReviewNotes || nextDraft.reviewNotes || "");
      setFeedbackTone("success");
      setFeedbackMessage("Draft guardado.");
    } catch (saveError) {
      if (saveError?.code === "DRAFT_REVISION_CONFLICT") {
        setCenterRecoveryRequired(true);
        setCenterRecoveryMode("reload");
      }
      setFeedbackTone("error");
      setFeedbackMessage(
        saveError instanceof Error
          ? saveError.message
          : "No pudimos guardar el draft.",
      );
    } finally {
      writeInFlight.current = false;
      setIsSaving(false);
    }
  };

  const handleRejectDraft = async () => {
    if (!draft || !isPendingDraft || writeInFlight.current || centerRecoveryRequired) {
      return;
    }

    if (feedbackTargetStatus !== DRAFT_REVIEW_TARGET_STATUSES.REJECTED) {
      setFeedbackTargetStatus(DRAFT_REVIEW_TARGET_STATUSES.REJECTED);
      setSelectedFeedbackOptionIds([]);
      setUserFeedbackSummary("");
      setFeedbackTone("error");
      setFeedbackMessage("Selecciona motivos de No aprobar antes de continuar.");
      return;
    }

    const normalizedSummary = getTrimmedText(userFeedbackSummary);

    if (!normalizedSummary) {
      setFeedbackTargetStatus(DRAFT_REVIEW_TARGET_STATUSES.REJECTED);
      setFeedbackTone("error");
      setFeedbackMessage("Anade un resumen publico antes de no aprobar.");
      return;
    }

    writeInFlight.current = true;
    setIsRejecting(true);
    setFeedbackMessage("");
    setError("");

    try {
      const nextDraft = await rejectInternalDraft({
        draftId: draft.id,
        internalReviewNotes: reviewNotes,
        reviewedPayload: mapFormStateToDraftPayload(formState),
        reviewNotes,
        userFeedbackJson: buildUserFeedbackItems(selectedFeedbackOptions),
        userFeedbackSummary: normalizedSummary,
        reviewedByUserId: user?.id,
      });

      setDraft(nextDraft);
      setFormState(mapDraftPayloadToFormState(getInitialDraftPayload(nextDraft)));
      setReviewNotes(nextDraft.internalReviewNotes || nextDraft.reviewNotes || "");
      setUserFeedbackSummary(nextDraft.userFeedbackSummary || "");
      setFeedbackTone("success");
      setFeedbackMessage("Draft no aprobado.");
    } catch (rejectError) {
      setFeedbackTone("error");
      setFeedbackMessage(
        rejectError instanceof Error
          ? rejectError.message
          : "No pudimos rechazar el draft.",
      );
    } finally {
      writeInFlight.current = false;
      setIsRejecting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!draft || !isPendingDraft || writeInFlight.current || centerRecoveryRequired) {
      return;
    }

    if (feedbackTargetStatus !== DRAFT_REVIEW_TARGET_STATUSES.NEEDS_CHANGES) {
      setFeedbackTargetStatus(DRAFT_REVIEW_TARGET_STATUSES.NEEDS_CHANGES);
      setSelectedFeedbackOptionIds([]);
      setUserFeedbackSummary("");
      setFeedbackTone("error");
      setFeedbackMessage("Selecciona motivos de Pedir cambios antes de continuar.");
      return;
    }

    const normalizedSummary = getTrimmedText(userFeedbackSummary);

    if (!normalizedSummary) {
      setFeedbackTargetStatus(DRAFT_REVIEW_TARGET_STATUSES.NEEDS_CHANGES);
      setFeedbackTone("error");
      setFeedbackMessage("Anade un resumen publico antes de pedir cambios.");
      return;
    }

    writeInFlight.current = true;
    setIsRequestingChanges(true);
    setFeedbackMessage("");
    setError("");

    try {
      const nextDraft = await requestInternalDraftChanges({
        draftId: draft.id,
        internalReviewNotes: reviewNotes,
        reviewedPayload: mapFormStateToDraftPayload(formState),
        reviewNotes,
        userFeedbackJson: buildUserFeedbackItems(selectedFeedbackOptions),
        userFeedbackSummary: normalizedSummary,
      });

      setDraft(nextDraft);
      setFormState(mapDraftPayloadToFormState(getInitialDraftPayload(nextDraft)));
      setReviewNotes(nextDraft.internalReviewNotes || nextDraft.reviewNotes || "");
      setUserFeedbackSummary(nextDraft.userFeedbackSummary || "");
      setFeedbackTone("success");
      setFeedbackMessage("Cambios solicitados.");
    } catch (changesError) {
      setFeedbackTone("error");
      setFeedbackMessage(
        changesError instanceof Error
          ? changesError.message
          : "No pudimos pedir cambios para el draft.",
      );
    } finally {
      writeInFlight.current = false;
      setIsRequestingChanges(false);
    }
  };

  const handleArchiveDraft = async () => {
    if (!canArchiveDraft || writeInFlight.current || centerRecoveryRequired) {
      return;
    }

    writeInFlight.current = true;
    setIsArchiving(true);
    setFeedbackMessage("");
    setError("");

    try {
      const nextDraft = await archiveInternalDraft({
        draftId: draft.id,
        internalReviewNotes: reviewNotes,
      });

      setDraft(nextDraft);
      setFormState(mapDraftPayloadToFormState(getInitialDraftPayload(nextDraft)));
      setReviewNotes(nextDraft.internalReviewNotes || nextDraft.reviewNotes || "");
      setFeedbackTone("success");
      setFeedbackMessage("Draft archivado.");
    } catch (archiveError) {
      setFeedbackTone("error");
      setFeedbackMessage(
        archiveError instanceof Error
          ? archiveError.message
          : "No pudimos archivar el draft.",
      );
    } finally {
      writeInFlight.current = false;
      setIsArchiving(false);
    }
  };

  const handleApproveDraft = async () => {
    if (!draft || !isPendingDraft || writeInFlight.current || centerRecoveryRequired) {
      return;
    }

    const approvalValidationError = validateDraftForApproval(formState);

    if (approvalValidationError) {
      setFeedbackTone("error");
      setFeedbackMessage(approvalValidationError);
      return;
    }

    writeInFlight.current = true;
    setIsApproving(true);
    setFeedbackMessage("");
    setError("");

    try {
      await saveInternalDraftReview({
        draftId: draft.id,
        internalReviewNotes: reviewNotes,
        reviewedPayload: mapFormStateToDraftPayload(formState),
        reviewNotes,
        expectedUpdatedAt: draft.updatedAt,
      });
      const approvedActivityId = await approveInternalDraft(draft.id);
      await refreshDraft(
        `Draft aprobado. Actividad creada con id ${approvedActivityId}.`,
        "success",
      );
    } catch (approveError) {
      if (approveError?.code === "DRAFT_REVISION_CONFLICT") {
        setCenterRecoveryRequired(true);
        setCenterRecoveryMode("reload");
      }
      setFeedbackTone("error");
      setFeedbackMessage(
        approveError instanceof Error
          ? approveError.message
          : "No pudimos aprobar el draft.",
      );
    } finally {
      writeInFlight.current = false;
      setIsApproving(false);
    }
  };

  return (
    <div className="internal-draft-detail-page">
        <main className="internal-draft-detail-page__main">
          <div className="page-container internal-draft-detail-page__container">
            <header className="internal-draft-detail-page__header">
              <Button
                variant="ghost"
                className="internal-draft-detail-page__back-button"
                disabled={isWriteBusy}
                onClick={() => navigate("/internal/drafts")}
              >
                <ArrowLeft />
                Volver al Draft Inbox
              </Button>

              <div className="internal-draft-detail-page__intro">
                <p className="internal-draft-detail-page__eyebrow">Uso interno | Detalle de draft</p>
                <h2 className="internal-draft-detail-page__title">
                  {draft ? draft.displayTitle : "Detalle de draft"}
                </h2>
                <p className="internal-draft-detail-page__description">
                  Corrige el payload publicable, guarda la revisión y decide si el
                  draft pasa a una actividad real o queda rechazado.
                </p>
                {draft ? (
                  <div className="internal-draft-detail-page__header-meta">
                    <ScoutDraftStatusBadge reviewStatus={draft.reviewStatus} />
                    {linkedApprovedActivity ? (
                      <ActivityPublicationBadge
                        isPublished={linkedApprovedActivity.isPublished}
                      />
                    ) : null}
                    <span>Draft #{draft.id}</span>
                    {draft.approvedActivityId ? (
                      <span>Actividad #{draft.approvedActivityId}</span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </header>

            {isLoading ? (
              <CatalogState
                icon={LoaderCircle}
                eyebrow="Detalle de draft"
                title="Cargando detalle del draft"
                description="Estamos recuperando el draft, sus referencias y el payload revisable."
              />
            ) : error ? (
              <CatalogState
                icon={AlertTriangle}
                eyebrow="Error"
                title="No pudimos cargar este draft"
                description={error}
                actionLabel="Volver al inbox"
                onAction={() => navigate("/internal/drafts")}
              />
            ) : !draft ? (
              <CatalogState
                icon={SearchX}
                eyebrow="Sin draft"
                title="No encontramos este draft"
                description="El draft solicitado no existe o ya no está visible para esta cuenta."
                actionLabel="Volver al inbox"
                onAction={() => navigate("/internal/drafts")}
              />
            ) : (
              <div className="internal-draft-detail-page__layout">
                <div className="internal-draft-detail-page__column">
                  <Card className="internal-draft-detail-page__panel">
                    <CardContent className="internal-draft-detail-page__panel-content">
                      <h2 className="internal-draft-detail-page__panel-title">
                        Payload revisado
                      </h2>

                      {formState.centerMode === "proposed_new" ? (
                        <div className="internal-draft-detail-page__center-notice">
                          <p>
                            Centro nuevo propuesto: revisar y dar de alta antes de publicar.
                          </p>
                          {formState.centerProposalName ? (
                            <span>{formState.centerProposalName}</span>
                          ) : null}
                          {formState.centerProposalNotes ? (
                            <small>{formState.centerProposalNotes}</small>
                          ) : null}
                        </div>
                      ) : null}

                      {formState.centerMode === "not_applicable" ? (
                        <div className="internal-draft-detail-page__center-notice">
                          <p>
                            Actividad marcada sin centro formal / no aplica.
                          </p>
                          {formState.centerProposalNotes ? (
                            <small>{formState.centerProposalNotes}</small>
                          ) : null}
                        </div>
                      ) : null}

                      <ScoutDraftReviewForm
                        centerChoices={centerChoices}
                        categoryChoices={categoryChoices}
                        typeChoices={typeChoices}
                        formState={formState}
                        imagePreviewSrc={resolveActivityImagePreviewUrl(
                          formState.imageUrl,
                        )}
                        onFieldChange={handleFieldChange}
                        isReadOnly={isReadOnlyDraft || areWritesBlocked}
                        isImageUploadEnabled={isPendingDraft}
                        onImageFileChange={handleImageFileChange}
                      />

                      {isPendingDraft && formState.centerMode === "proposed_new" ? <MaintenanceCenterCreatePanel
                        key={draft.id} formState={formState} onFieldChange={handleFieldChange}
                        isBusy={isWriteBusy} recoveryRequired={centerRecoveryRequired}
                        recoveryMode={centerRecoveryMode}
                        onCreate={handleCreateCenter} /> : null}

                      {centerRecoveryRequired && formState.centerMode !== "proposed_new" ? <div className="internal-draft-detail-page__center-notice">
                        <p>Recupera la versión actual del borrador antes de editar o publicar. La recarga sustituirá los cambios del formulario que no se hayan guardado.</p>
                        <Button disabled={isWriteBusy} onClick={() => {
                          void handleCreateCenter({}).catch(() => {
                            setFeedbackTone("error");
                            setFeedbackMessage("No pudimos recuperar el borrador actualizado. Reintenta la recarga; el vínculo del centro se conserva.");
                          });
                        }}>Recargar borrador actualizado</Button>
                      </div> : null}

                      {formState.importReview ? <div className="internal-draft-detail-page__center-notice">
                        <h3>Revisión del material importado</h3>
                        <p>Estos avisos describen la fuente original. Corrige los datos en el editor; comprueba especialmente la vigencia de las fechas sin año.</p>
                        {Array.isArray(formState.importReview.warnings) ? <ul>{formState.importReview.warnings.map((warning) => <li key={warning}>{warning}</li>)}</ul> : null}
                        {formState.importReview.notes ? <p>{formState.importReview.notes}</p> : null}
                        {isPendingDraft ? <label><input type="checkbox" checked={formState.importReview.review_confirmed === true}
                          disabled={areWritesBlocked}
                          onChange={(event) => handleFieldChange("importReview", { ...formState.importReview, review_confirmed: event.target.checked })} /> He contrastado los datos, las propuestas y la vigencia de las fechas antes de publicar.</label> : null}
                      </div> : null}
                      {isUploadingImage ? <p role="status">Preparando y subiendo imagen…</p> : null}

                      {isPendingDraft ? (
                        <div className="internal-draft-detail-page__public-feedback">
                          <div className="internal-draft-detail-page__feedback-header">
                            <div>
                              <h3>Feedback visible para usuario</h3>
                              <p>
                                Separa el resumen publico de las notas internas.
                              </p>
                            </div>
                            <div className="internal-draft-detail-page__feedback-targets">
                              <Button
                                type="button"
                                disabled={areWritesBlocked}
                                variant={
                                  feedbackTargetStatus ===
                                  DRAFT_REVIEW_TARGET_STATUSES.NEEDS_CHANGES
                                    ? "default"
                                    : "outline"
                                }
                                onClick={() =>
                                  handleFeedbackTargetChange(
                                    DRAFT_REVIEW_TARGET_STATUSES.NEEDS_CHANGES,
                                  )
                                }
                              >
                                Pedir cambios
                              </Button>
                              <Button
                                type="button"
                                disabled={areWritesBlocked}
                                variant={
                                  feedbackTargetStatus ===
                                  DRAFT_REVIEW_TARGET_STATUSES.REJECTED
                                    ? "default"
                                    : "outline"
                                }
                                onClick={() =>
                                  handleFeedbackTargetChange(
                                    DRAFT_REVIEW_TARGET_STATUSES.REJECTED,
                                  )
                                }
                              >
                                No aprobar
                              </Button>
                            </div>
                          </div>

                          <div className="internal-draft-detail-page__feedback-chips">
                            {activeFeedbackOptions.map((option) => (
                              <button
                                key={option.id}
                                type="button"
                                disabled={areWritesBlocked}
                                className={`internal-draft-detail-page__feedback-chip ${
                                  selectedFeedbackOptionIds.includes(option.id)
                                    ? "internal-draft-detail-page__feedback-chip--selected"
                                    : ""
                                }`}
                                onClick={() => handleFeedbackOptionToggle(option)}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>

                          <label
                            className="internal-draft-detail-page__public-summary-field"
                            htmlFor="draft-user-feedback-summary"
                          >
                            Resumen publico editable
                            <textarea
                              id="draft-user-feedback-summary"
                              className="internal-draft-detail-page__notes-input"
                              value={userFeedbackSummary}
                              disabled={areWritesBlocked}
                              onChange={(event) =>
                                setUserFeedbackSummary(event.target.value)
                              }
                            />
                          </label>
                        </div>
                      ) : draft.userFeedbackSummary ? (
                        <div className="internal-draft-detail-page__public-feedback internal-draft-detail-page__public-feedback--readonly">
                          <h3>Feedback publico enviado</h3>
                          <p>{draft.userFeedbackSummary}</p>
                        </div>
                      ) : null}

                      <div className="internal-draft-detail-page__notes-field">
                        <label htmlFor="draft-review-notes">
                          Notas internas
                        </label>
                        <textarea
                          id="draft-review-notes"
                          className="internal-draft-detail-page__notes-input"
                          value={reviewNotes}
                          onChange={(event) => setReviewNotes(event.target.value)}
                          disabled={areWritesBlocked || draft.reviewStatus === "approved" || draft.reviewStatus === "archived"}
                        />
                      </div>

                      {feedbackMessage ? (
                        <p
                          className={`internal-draft-detail-page__feedback internal-draft-detail-page__feedback--${feedbackTone}`}
                          role={feedbackTone === "error" ? "alert" : "status"}
                        >
                          {feedbackMessage}
                        </p>
                      ) : null}

                      {draft.reviewStatus === "pending_review" ? (
                        <div className="internal-draft-detail-page__actions">
                          <Button
                            variant="outline"
                            onClick={handleSaveDraft}
disabled={areWritesBlocked}
                          >
                            {isSaving ? "Guardando..." : "Guardar draft"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleRequestChanges}
disabled={areWritesBlocked}
                          >
                            {isRequestingChanges
                              ? "Pidiendo cambios..."
                              : "Pedir cambios"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleRejectDraft}
disabled={areWritesBlocked}
                          >
                            {isRejecting ? "No aprobando..." : "No aprobar"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleArchiveDraft}
disabled={areWritesBlocked}
                          >
                            {isArchiving ? "Archivando..." : "Archivar"}
                          </Button>
                          <Button
                            onClick={handleApproveDraft}
disabled={areWritesBlocked}
                          >
                            {isApproving ? "Aprobando..." : "Aprobar"}
                          </Button>
                        </div>
                      ) : canArchiveDraft ? (
                        <div className="internal-draft-detail-page__actions">
                          <Button
                            variant="outline"
                            onClick={handleArchiveDraft}
                            disabled={isArchiving}
                          >
                            {isArchiving ? "Archivando..." : "Archivar"}
                          </Button>
                        </div>
                      ) : draft.reviewStatus === "approved" && draft.approvedActivityId ? (
                        <div className="internal-draft-detail-page__approved-handoff">
                          <div className="internal-draft-detail-page__approved-copy">
                            <p className="internal-draft-detail-page__approved-title">
                              La actividad ya fue creada
                            </p>
                            <p className="internal-draft-detail-page__approved-description">
                              Desde aquí solo mantienes contexto editorial. La edición y el ciclo de publicación viven ahora en la actividad aprobada.
                            </p>
                          </div>
                          <Button
                            onClick={() =>
                              navigate(`/internal/activities/${draft.approvedActivityId}`)
                            }
                          >
                            Abrir actividad aprobada
                          </Button>
                        </div>
                      ) : null}
                    </CardContent>
                  </Card>
                </div>

                <div className="internal-draft-detail-page__column">
                  <Card className="internal-draft-detail-page__panel">
                    <CardContent className="internal-draft-detail-page__panel-content">
                      <h2 className="internal-draft-detail-page__panel-title">Metadata</h2>
                      <div className="internal-draft-detail-page__metadata-grid">
                        <div className="internal-draft-detail-page__metadata-item">
                          <span className="internal-draft-detail-page__metadata-label">
                            Tipo de origen
                          </span>
                          <span className="internal-draft-detail-page__metadata-value">
                            {draft.sourceType || "desconocido"}
                          </span>
                        </div>
                        <div className="internal-draft-detail-page__metadata-item">
                          <span className="internal-draft-detail-page__metadata-label">
                            Etiqueta de origen
                          </span>
                          <span className="internal-draft-detail-page__metadata-value">
                            {draft.sourceLabel || "Sin etiqueta"}
                          </span>
                        </div>
                        <div className="internal-draft-detail-page__metadata-item">
                          <span className="internal-draft-detail-page__metadata-label">
                            URL de referencia
                          </span>
                          <span className="internal-draft-detail-page__metadata-value">
                            {draft.sourceReferenceUrl || "Sin URL"}
                          </span>
                        </div>
                        <div className="internal-draft-detail-page__metadata-item">
                          <span className="internal-draft-detail-page__metadata-label">
                            Archivo de origen
                          </span>
                          <span className="internal-draft-detail-page__metadata-value">
                            {draft.sourceFileName || "Sin archivo"}
                          </span>
                        </div>
                        {draft.reviewStatus === "approved" && draft.approvedActivityId ? (
                          <div className="internal-draft-detail-page__metadata-item">
                            <span className="internal-draft-detail-page__metadata-label">
                              Estado público
                            </span>
                            <span className="internal-draft-detail-page__metadata-value internal-draft-detail-page__metadata-value--badge">
                              {linkedApprovedActivity ? (
                                <ActivityPublicationBadge
                                  isPublished={linkedApprovedActivity.isPublished}
                                />
                              ) : linkedApprovedActivityError ? (
                                linkedApprovedActivityError
                              ) : (
                                "Cargando..."
                              )}
                            </span>
                          </div>
                        ) : null}
                        <div className="internal-draft-detail-page__metadata-item">
                          <span className="internal-draft-detail-page__metadata-label">
                            Creado
                          </span>
                          <span className="internal-draft-detail-page__metadata-value">
                            {formatDateLabel(draft.createdAt)}
                          </span>
                        </div>
                        <div className="internal-draft-detail-page__metadata-item">
                          <span className="internal-draft-detail-page__metadata-label">
                            Actualizado
                          </span>
                          <span className="internal-draft-detail-page__metadata-value">
                            {formatDateLabel(draft.updatedAt)}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="internal-draft-detail-page__panel">
                    <CardContent className="internal-draft-detail-page__panel-content">
                      <h2 className="internal-draft-detail-page__panel-title">Texto extraído</h2>
                      <pre className="internal-draft-detail-page__text-block">
                        {draft.rawExtractedText || "No hay texto extraído guardado para este draft."}
                      </pre>
                    </CardContent>
                  </Card>

                  <Card className="internal-draft-detail-page__panel">
                    <CardContent className="internal-draft-detail-page__panel-content">
                      <h2 className="internal-draft-detail-page__panel-title">Payload parseado</h2>
                      <pre className="internal-draft-detail-page__json-block">
                        {parsedPayloadPreview}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </main>

        <Footer />
    </div>
  );
}
