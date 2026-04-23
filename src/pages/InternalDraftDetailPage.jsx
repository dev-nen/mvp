import { AlertTriangle, ArrowLeft, LoaderCircle, SearchX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { CatalogState } from "@/components/states/CatalogState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InternalToolRoute } from "@/components/auth/InternalToolRoute";
import { ActivityPublicationBadge } from "@/features/scout-drafts/ActivityPublicationBadge";
import { ScoutDraftReviewForm } from "@/features/scout-drafts/ScoutDraftReviewForm";
import { ScoutDraftStatusBadge } from "@/features/scout-drafts/ScoutDraftStatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { mapDraftPayloadToFormState } from "@/helpers/mapDraftPayloadToFormState";
import { mapFormStateToDraftPayload } from "@/helpers/mapFormStateToDraftPayload";
import { getInternalApprovedActivity } from "@/services/internalApprovedActivitiesService";
import { approveInternalDraft } from "@/services/draftApprovalService";
import {
  getInternalDraftById,
  listDraftCategories,
  listDraftCenters,
  listDraftTypes,
  rejectInternalDraft,
  saveInternalDraftReview,
} from "@/services/internalDraftsService";
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

  return "";
}

export function InternalDraftDetailPage() {
  const navigate = useNavigate();
  const { draftId } = useParams();
  const { user } = useAuth();
  const [draft, setDraft] = useState(null);
  const [formState, setFormState] = useState(() => mapDraftPayloadToFormState({}));
  const [reviewNotes, setReviewNotes] = useState("");
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
          setLinkedApprovedActivity(null);
          setLinkedApprovedActivityError("");
          return;
        }

        setDraft(nextDraft);
        setCenterChoices(nextCenters);
        setCategoryChoices(nextCategories);
        setTypeChoices(nextTypes);
        setFormState(mapDraftPayloadToFormState(getInitialDraftPayload(nextDraft)));
        setReviewNotes(nextDraft.reviewNotes || "");
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

  const isTerminalDraft = draft?.reviewStatus === "approved" || draft?.reviewStatus === "rejected";
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
    setReviewNotes(nextDraft.reviewNotes || "");
    setLinkedApprovedActivity(nextLinkedApprovedActivity);
    setLinkedApprovedActivityError(nextLinkedApprovedActivityError);
    setFeedbackMessage(nextFeedbackMessage);
    setFeedbackTone(nextFeedbackTone);
  };

  const handleFieldChange = (fieldName, nextValue) => {
    setFormState((currentFormState) => ({
      ...currentFormState,
      [fieldName]: nextValue,
    }));
  };

  const handleSaveDraft = async () => {
    if (!draft || isTerminalDraft) {
      return;
    }

    setIsSaving(true);
    setFeedbackMessage("");
    setError("");

    try {
      const nextDraft = await saveInternalDraftReview({
        draftId: draft.id,
        reviewedPayload: mapFormStateToDraftPayload(formState),
        reviewNotes,
      });

      setDraft(nextDraft);
      setFormState(mapDraftPayloadToFormState(getInitialDraftPayload(nextDraft)));
      setReviewNotes(nextDraft.reviewNotes || "");
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
    if (!draft || isTerminalDraft) {
      return;
    }

    setIsRejecting(true);
    setFeedbackMessage("");
    setError("");

    try {
      const nextDraft = await rejectInternalDraft({
        draftId: draft.id,
        reviewedPayload: mapFormStateToDraftPayload(formState),
        reviewNotes,
        reviewedByUserId: user?.id,
      });

      setDraft(nextDraft);
      setFormState(mapDraftPayloadToFormState(getInitialDraftPayload(nextDraft)));
      setReviewNotes(nextDraft.reviewNotes || "");
      setFeedbackTone("success");
      setFeedbackMessage("Draft rechazado.");
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

  const handleApproveDraft = async () => {
    if (!draft || isTerminalDraft) {
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
    <InternalToolRoute>
      <div className="internal-draft-detail-page">
        <Navbar />

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
                <h1 className="internal-draft-detail-page__title">
                  {draft ? draft.displayTitle : "Detalle de draft"}
                </h1>
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

                      <ScoutDraftReviewForm
                        centerChoices={centerChoices}
                        categoryChoices={categoryChoices}
                        typeChoices={typeChoices}
                        formState={formState}
                        onFieldChange={handleFieldChange}
                        isReadOnly={isTerminalDraft}
                      />

                      <div className="internal-draft-detail-page__notes-field">
                        <label htmlFor="draft-review-notes">Notas editoriales</label>
                        <textarea
                          id="draft-review-notes"
                          className="internal-draft-detail-page__notes-input"
                          value={reviewNotes}
                          onChange={(event) => setReviewNotes(event.target.value)}
                          disabled={isTerminalDraft}
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
                            disabled={isSaving || isRejecting || isApproving}
                          >
                            {isSaving ? "Guardando..." : "Guardar draft"}
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleRejectDraft}
                            disabled={isSaving || isRejecting || isApproving}
                          >
                            {isRejecting ? "Rechazando..." : "Rechazar draft"}
                          </Button>
                          <Button
                            onClick={handleApproveDraft}
                            disabled={isSaving || isRejecting || isApproving}
                          >
                            {isApproving ? "Aprobando..." : "Aprobar"}
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
    </InternalToolRoute>
  );
}
