import { AlertTriangle, ArrowLeft, LoaderCircle, SearchX } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { CatalogState } from "@/components/states/CatalogState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { InternalToolRoute } from "@/components/auth/InternalToolRoute";
import { ScoutDraftReviewForm } from "@/features/scout-drafts/ScoutDraftReviewForm";
import { ScoutDraftStatusBadge } from "@/features/scout-drafts/ScoutDraftStatusBadge";
import { useAuth } from "@/hooks/useAuth";
import { mapDraftPayloadToFormState } from "@/helpers/mapDraftPayloadToFormState";
import { mapFormStateToDraftPayload } from "@/helpers/mapFormStateToDraftPayload";
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
    return "Unknown";
  }

  const dateValue = new Date(value);

  if (Number.isNaN(dateValue.getTime())) {
    return "Unknown";
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
    return "El title es obligatorio para aprobar.";
  }

  if (!getTrimmedText(formState.description)) {
    return "La description es obligatoria para aprobar.";
  }

  if (!getTrimmedText(formState.centerId)) {
    return "El center es obligatorio para aprobar.";
  }

  if (!getTrimmedText(formState.categoryId)) {
    return "La category es obligatoria para aprobar.";
  }

  if (!getTrimmedText(formState.typeId)) {
    return "El type es obligatorio para aprobar.";
  }

  if (!getTrimmedText(formState.scheduleLabel)) {
    return "El schedule es obligatorio para aprobar.";
  }

  if (formState.ageRuleType === "range" && (!getTrimmedText(formState.ageMin) || !getTrimmedText(formState.ageMax))) {
    return "El age rule range necesita age_min y age_max.";
  }

  if (formState.ageRuleType === "from" && !getTrimmedText(formState.ageMin)) {
    return "El age rule from necesita age_min.";
  }

  if (formState.ageRuleType === "until" && !getTrimmedText(formState.ageMax)) {
    return "El age rule until necesita age_max.";
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
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackTone, setFeedbackTone] = useState("success");
  const [isSaving, setIsSaving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const [isApproving, setIsApproving] = useState(false);

  useEffect(() => {
    let isMounted = true;

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
          return;
        }

        setDraft(nextDraft);
        setCenterChoices(nextCenters);
        setCategoryChoices(nextCategories);
        setTypeChoices(nextTypes);
        setFormState(mapDraftPayloadToFormState(getInitialDraftPayload(nextDraft)));
        setReviewNotes(nextDraft.reviewNotes || "");
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setDraft(null);
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
      throw new Error("No pudimos refrescar el draft despues de la operacion.");
    }

    setDraft(nextDraft);
    setFormState(mapDraftPayloadToFormState(getInitialDraftPayload(nextDraft)));
    setReviewNotes(nextDraft.reviewNotes || "");
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
        `Draft aprobado. Activity creada con id ${approvedActivityId}.`,
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
                Back to Draft Inbox
              </Button>

              <div className="internal-draft-detail-page__intro">
                <p className="internal-draft-detail-page__eyebrow">Uso interno | Draft detail</p>
                <h1 className="internal-draft-detail-page__title">
                  {draft ? draft.displayTitle : "Draft detail"}
                </h1>
                <p className="internal-draft-detail-page__description">
                  Corrige el payload publicable, guarda la revision y decide si el
                  draft pasa a una actividad real o queda rechazado.
                </p>
                {draft ? (
                  <div className="internal-draft-detail-page__header-meta">
                    <ScoutDraftStatusBadge reviewStatus={draft.reviewStatus} />
                    <span>Draft #{draft.id}</span>
                    {draft.approvedActivityId ? (
                      <span>Approved activity #{draft.approvedActivityId}</span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </header>

            {isLoading ? (
              <CatalogState
                icon={LoaderCircle}
                eyebrow="Draft detail"
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
                description="El draft solicitado no existe o ya no esta visible para esta cuenta."
                actionLabel="Volver al inbox"
                onAction={() => navigate("/internal/drafts")}
              />
            ) : (
              <div className="internal-draft-detail-page__layout">
                <div className="internal-draft-detail-page__column">
                  <Card className="internal-draft-detail-page__panel">
                    <CardContent className="internal-draft-detail-page__panel-content">
                      <h2 className="internal-draft-detail-page__panel-title">
                        Reviewed payload
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
                        <label htmlFor="draft-review-notes">Review notes</label>
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

                      <div className="internal-draft-detail-page__actions">
                        <Button
                          variant="outline"
                          onClick={handleSaveDraft}
                          disabled={isTerminalDraft || isSaving || isRejecting || isApproving}
                        >
                          {isSaving ? "Saving..." : "Save draft"}
                        </Button>
                        <Button
                          variant="outline"
                          onClick={handleRejectDraft}
                          disabled={isTerminalDraft || isSaving || isRejecting || isApproving}
                        >
                          {isRejecting ? "Rejecting..." : "Reject draft"}
                        </Button>
                        <Button
                          onClick={handleApproveDraft}
                          disabled={isTerminalDraft || isSaving || isRejecting || isApproving}
                        >
                          {isApproving ? "Approving..." : "Approve"}
                        </Button>
                      </div>
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
                            Source type
                          </span>
                          <span className="internal-draft-detail-page__metadata-value">
                            {draft.sourceType || "unknown"}
                          </span>
                        </div>
                        <div className="internal-draft-detail-page__metadata-item">
                          <span className="internal-draft-detail-page__metadata-label">
                            Source label
                          </span>
                          <span className="internal-draft-detail-page__metadata-value">
                            {draft.sourceLabel || "No label"}
                          </span>
                        </div>
                        <div className="internal-draft-detail-page__metadata-item">
                          <span className="internal-draft-detail-page__metadata-label">
                            Reference URL
                          </span>
                          <span className="internal-draft-detail-page__metadata-value">
                            {draft.sourceReferenceUrl || "No URL"}
                          </span>
                        </div>
                        <div className="internal-draft-detail-page__metadata-item">
                          <span className="internal-draft-detail-page__metadata-label">
                            Source file
                          </span>
                          <span className="internal-draft-detail-page__metadata-value">
                            {draft.sourceFileName || "No file"}
                          </span>
                        </div>
                        <div className="internal-draft-detail-page__metadata-item">
                          <span className="internal-draft-detail-page__metadata-label">
                            Created at
                          </span>
                          <span className="internal-draft-detail-page__metadata-value">
                            {formatDateLabel(draft.createdAt)}
                          </span>
                        </div>
                        <div className="internal-draft-detail-page__metadata-item">
                          <span className="internal-draft-detail-page__metadata-label">
                            Updated at
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
                      <h2 className="internal-draft-detail-page__panel-title">Raw extracted text</h2>
                      <pre className="internal-draft-detail-page__text-block">
                        {draft.rawExtractedText || "No extracted text stored for this draft."}
                      </pre>
                    </CardContent>
                  </Card>

                  <Card className="internal-draft-detail-page__panel">
                    <CardContent className="internal-draft-detail-page__panel-content">
                      <h2 className="internal-draft-detail-page__panel-title">Parsed payload</h2>
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
