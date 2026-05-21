import { AlertTriangle, ArrowLeft, LoaderCircle, SearchX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { CatalogState } from "@/components/states/CatalogState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityPublicationBadge } from "@/features/scout-drafts/ActivityPublicationBadge";
import { ScoutDraftReviewForm } from "@/features/scout-drafts/ScoutDraftReviewForm";
import { ScoutDraftStatusBadge } from "@/features/scout-drafts/ScoutDraftStatusBadge";
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
import { resolveActivityImagePreviewUrl } from "@/services/internalDraftCoverImageService";
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

  useEffect(() => {
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
    setFormState((currentFormState) => {
      if (fieldName === "centerId" && getTrimmedText(nextValue)) {
        return {
          ...currentFormState,
          centerId: nextValue,
          centerMode: "existing",
          centerProposalName: "",
          centerProposalNotes: "",
        };
      }

      return {
        ...currentFormState,
        [fieldName]: nextValue,
      };
    });
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
    if (!draft || !isPendingDraft) {
      return;
    }

    setIsSaving(true);
    setFeedbackMessage("");
    setError("");

    try {
      const nextDraft = await saveInternalDraftReview({
        draftId: draft.id,
        internalReviewNotes: reviewNotes,
        reviewedPayload: mapFormStateToDraftPayload(formState),
        reviewNotes,
      });

      setDraft(nextDraft);
      setFormState(mapDraftPayloadToFormState(getInitialDraftPayload(nextDraft)));
      setReviewNotes(nextDraft.internalReviewNotes || nextDraft.reviewNotes || "");
      setFeedbackTone("success");
      setFeedbackMessage("Draft guardado.");
    } catch (saveError) {
      setFeedbackTone("error");
      setFeedbackMessage(
        saveError instanceof Error
          ? saveError.message
          : "No pudimos guardar el draft.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleRejectDraft = async () => {
    if (!draft || !isPendingDraft) {
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
      setIsRejecting(false);
    }
  };

  const handleRequestChanges = async () => {
    if (!draft || !isPendingDraft) {
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
      setIsRequestingChanges(false);
    }
  };

  const handleArchiveDraft = async () => {
    if (!canArchiveDraft) {
      return;
    }

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
      setIsArchiving(false);
    }
  };

  const handleApproveDraft = async () => {
    if (!draft || !isPendingDraft) {
      return;
    }

    const approvalValidationError = validateDraftForApproval(formState);

    if (approvalValidationError) {
      setFeedbackTone("error");
      setFeedbackMessage(approvalValidationError);
      return;
    }

    setIsApproving(true);
    setFeedbackMessage("");
    setError("");

    try {
      await saveInternalDraftReview({
        draftId: draft.id,
        internalReviewNotes: reviewNotes,
        reviewedPayload: mapFormStateToDraftPayload(formState),
        reviewNotes,
      });
      const approvedActivityId = await approveInternalDraft(draft.id);
      await refreshDraft(
        `Draft aprobado. Actividad creada con id ${approvedActivityId}.`,
        "success",
      );
    } catch (approveError) {
      setFeedbackTone("error");
      setFeedbackMessage(
        approveError instanceof Error
          ? approveError.message
          : "No pudimos aprobar el draft.",
      );
    } finally {
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
                        isReadOnly={isReadOnlyDraft}
                      />

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
                          disabled={draft.reviewStatus === "approved" || draft.reviewStatus === "archived"}
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
                            disabled={
                              isSaving ||
                              isRequestingChanges ||
                              isRejecting ||
                              isArchiving ||
                              isApproving
                            }
                          >
                            {isSaving ? "Guardando..." : "Guardar draft"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleRequestChanges}
                            disabled={
                              isSaving ||
                              isRequestingChanges ||
                              isRejecting ||
                              isArchiving ||
                              isApproving
                            }
                          >
                            {isRequestingChanges
                              ? "Pidiendo cambios..."
                              : "Pedir cambios"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleRejectDraft}
                            disabled={
                              isSaving ||
                              isRequestingChanges ||
                              isRejecting ||
                              isArchiving ||
                              isApproving
                            }
                          >
                            {isRejecting ? "No aprobando..." : "No aprobar"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleArchiveDraft}
                            disabled={
                              isSaving ||
                              isRequestingChanges ||
                              isRejecting ||
                              isArchiving ||
                              isApproving
                            }
                          >
                            {isArchiving ? "Archivando..." : "Archivar"}
                          </Button>
                          <Button
                            onClick={handleApproveDraft}
                            disabled={
                              isSaving ||
                              isRequestingChanges ||
                              isRejecting ||
                              isArchiving ||
                              isApproving
                            }
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
