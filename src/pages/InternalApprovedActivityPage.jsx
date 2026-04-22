import { AlertTriangle, ArrowLeft, LoaderCircle, SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { InternalToolRoute } from "@/components/auth/InternalToolRoute";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { CatalogState } from "@/components/states/CatalogState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityPublicationBadge } from "@/features/scout-drafts/ActivityPublicationBadge";
import { ScoutDraftReviewForm } from "@/features/scout-drafts/ScoutDraftReviewForm";
import { mapDraftPayloadToFormState } from "@/helpers/mapDraftPayloadToFormState";
import { mapFormStateToDraftPayload } from "@/helpers/mapFormStateToDraftPayload";
import {
  getInternalApprovedActivity,
  republishInternalApprovedActivity,
  saveInternalApprovedActivityReview,
  unpublishInternalApprovedActivity,
} from "@/services/internalApprovedActivitiesService";
import {
  listDraftCategories,
  listDraftCenters,
  listDraftTypes,
} from "@/services/internalDraftsService";
import "./InternalApprovedActivityPage.css";

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

function validateApprovedActivityForm(formState) {
  if (!getTrimmedText(formState.title)) {
    return "El titulo es obligatorio para guardar.";
  }

  if (!getTrimmedText(formState.description)) {
    return "La descripcion es obligatoria para guardar.";
  }

  if (!getTrimmedText(formState.centerId)) {
    return "El centro es obligatorio para guardar.";
  }

  if (!getTrimmedText(formState.categoryId)) {
    return "La categoria es obligatoria para guardar.";
  }

  if (!getTrimmedText(formState.typeId)) {
    return "El tipo es obligatorio para guardar.";
  }

  if (!getTrimmedText(formState.scheduleLabel)) {
    return "El horario es obligatorio para guardar.";
  }

  if (formState.ageRuleType === "range" && (!getTrimmedText(formState.ageMin) || !getTrimmedText(formState.ageMax))) {
    return "La regla de edad rango necesita edad minima y maxima.";
  }

  if (formState.ageRuleType === "from" && !getTrimmedText(formState.ageMin)) {
    return "La regla de edad desde necesita edad minima.";
  }

  if (formState.ageRuleType === "until" && !getTrimmedText(formState.ageMax)) {
    return "La regla de edad hasta necesita edad maxima.";
  }

  return "";
}

export function InternalApprovedActivityPage() {
  const navigate = useNavigate();
  const { activityId } = useParams();
  const [activity, setActivity] = useState(null);
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
  const [isTogglingPublication, setIsTogglingPublication] = useState(false);

  useEffect(() => {
    let isMounted = true;

    const numericActivityId = Number(activityId);

    const loadApprovedActivity = async () => {
      setIsLoading(true);
      setError("");
      setFeedbackMessage("");

      try {
        if (!Number.isFinite(numericActivityId)) {
          throw new Error("La actividad aprobada solicitada no es valida.");
        }

        const [nextActivity, nextCenters, nextCategories, nextTypes] = await Promise.all([
          getInternalApprovedActivity(numericActivityId),
          listDraftCenters(),
          listDraftCategories(),
          listDraftTypes(),
        ]);

        if (!isMounted) {
          return;
        }

        setActivity(nextActivity);
        setCenterChoices(nextCenters);
        setCategoryChoices(nextCategories);
        setTypeChoices(nextTypes);
        setFormState(mapDraftPayloadToFormState(nextActivity?.activityPayload ?? {}));
        setReviewNotes(nextActivity?.reviewNotes || "");
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setActivity(null);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No pudimos cargar la actividad aprobada.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadApprovedActivity();

    return () => {
      isMounted = false;
    };
  }, [activityId]);

  const refreshActivity = async (nextFeedbackMessage = "", nextFeedbackTone = "success") => {
    const nextActivity = await getInternalApprovedActivity(Number(activityId));

    if (!nextActivity) {
      throw new Error("No pudimos refrescar la actividad aprobada.");
    }

    setActivity(nextActivity);
    setFormState(mapDraftPayloadToFormState(nextActivity.activityPayload));
    setReviewNotes(nextActivity.reviewNotes || "");
    setFeedbackMessage(nextFeedbackMessage);
    setFeedbackTone(nextFeedbackTone);
  };

  const handleFieldChange = (fieldName, nextValue) => {
    setFormState((currentFormState) => ({
      ...currentFormState,
      [fieldName]: nextValue,
    }));
  };

  const handleSaveChanges = async () => {
    if (!activity) {
      return;
    }

    const validationError = validateApprovedActivityForm(formState);

    if (validationError) {
      setFeedbackTone("error");
      setFeedbackMessage(validationError);
      return;
    }

    setIsSaving(true);
    setFeedbackMessage("");
    setError("");

    try {
      await saveInternalApprovedActivityReview({
        draftId: activity.draftId,
        reviewedPayload: mapFormStateToDraftPayload(formState),
        reviewNotes,
      });
      await refreshActivity("Actividad aprobada actualizada.", "success");
    } catch (saveError) {
      setFeedbackTone("error");
      setFeedbackMessage(
        saveError instanceof Error
          ? saveError.message
          : "No pudimos guardar la actividad aprobada.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleTogglePublication = async () => {
    if (!activity) {
      return;
    }

    setIsTogglingPublication(true);
    setFeedbackMessage("");
    setError("");

    try {
      if (activity.isPublished) {
        await unpublishInternalApprovedActivity({
          draftId: activity.draftId,
          reviewNotes,
        });
        await refreshActivity("Actividad retirada del catalogo publico.", "success");
      } else {
        await republishInternalApprovedActivity({
          draftId: activity.draftId,
          reviewNotes,
        });
        await refreshActivity("Actividad devuelta al catalogo publico.", "success");
      }
    } catch (toggleError) {
      setFeedbackTone("error");
      setFeedbackMessage(
        toggleError instanceof Error
          ? toggleError.message
          : "No pudimos cambiar el estado publico de la actividad.",
      );
    } finally {
      setIsTogglingPublication(false);
    }
  };

  return (
    <InternalToolRoute>
      <div className="internal-approved-activity-page">
        <Navbar />

        <main className="internal-approved-activity-page__main">
          <div className="page-container internal-approved-activity-page__container">
            <header className="internal-approved-activity-page__header">
              <Button
                variant="ghost"
                className="internal-approved-activity-page__back-button"
                onClick={() =>
                  navigate(
                    activity?.draftId
                      ? `/internal/drafts/${activity.draftId}`
                      : "/internal/drafts",
                  )
                }
              >
                <ArrowLeft />
                Volver al draft aprobado
              </Button>

              <div className="internal-approved-activity-page__intro">
                <p className="internal-approved-activity-page__eyebrow">
                  Uso interno | Actividad aprobada
                </p>
                <h1 className="internal-approved-activity-page__title">
                  {activity ? activity.displayTitle : "Actividad aprobada"}
                </h1>
                <p className="internal-approved-activity-page__description">
                  Edita la actividad ya creada y controla si entra o sale del
                  catalogo publico sin romper la trazabilidad con su draft.
                </p>
                {activity ? (
                  <div className="internal-approved-activity-page__header-meta">
                    <ActivityPublicationBadge isPublished={activity.isPublished} />
                    <span>Actividad #{activity.activityId}</span>
                    <span>Draft #{activity.draftId}</span>
                  </div>
                ) : null}
              </div>
            </header>

            {isLoading ? (
              <CatalogState
                icon={LoaderCircle}
                eyebrow="Actividad aprobada"
                title="Cargando actividad interna"
                description="Estamos recuperando la actividad aprobada y su contrato editorial."
              />
            ) : error ? (
              <CatalogState
                icon={AlertTriangle}
                eyebrow="Error"
                title="No pudimos cargar esta actividad"
                description={error}
                actionLabel="Volver al inbox"
                onAction={() => navigate("/internal/drafts")}
              />
            ) : !activity ? (
              <CatalogState
                icon={SearchX}
                eyebrow="Sin actividad"
                title="No encontramos esta actividad aprobada"
                description="La actividad solicitada no esta gestionada por el Draft Inbox actual."
                actionLabel="Volver al inbox"
                onAction={() => navigate("/internal/drafts")}
              />
            ) : (
              <div className="internal-approved-activity-page__layout">
                <div className="internal-approved-activity-page__column">
                  <Card className="internal-approved-activity-page__panel">
                    <CardContent className="internal-approved-activity-page__panel-content">
                      <h2 className="internal-approved-activity-page__panel-title">
                        Payload publicable
                      </h2>

                      <ScoutDraftReviewForm
                        centerChoices={centerChoices}
                        categoryChoices={categoryChoices}
                        typeChoices={typeChoices}
                        formState={formState}
                        onFieldChange={handleFieldChange}
                      />

                      <div className="internal-approved-activity-page__notes-field">
                        <label htmlFor="approved-activity-review-notes">
                          Notas editoriales
                        </label>
                        <textarea
                          id="approved-activity-review-notes"
                          className="internal-approved-activity-page__notes-input"
                          value={reviewNotes}
                          onChange={(event) => setReviewNotes(event.target.value)}
                        />
                      </div>

                      {feedbackMessage ? (
                        <p
                          className={`internal-approved-activity-page__feedback internal-approved-activity-page__feedback--${feedbackTone}`}
                          role={feedbackTone === "error" ? "alert" : "status"}
                        >
                          {feedbackMessage}
                        </p>
                      ) : null}

                      <div className="internal-approved-activity-page__actions">
                        <Button
                          variant="outline"
                          onClick={handleSaveChanges}
                          disabled={isSaving || isTogglingPublication}
                        >
                          {isSaving ? "Guardando..." : "Guardar cambios"}
                        </Button>
                        <Button
                          onClick={handleTogglePublication}
                          disabled={isSaving || isTogglingPublication}
                        >
                          {isTogglingPublication
                            ? activity.isPublished
                              ? "Despublicando..."
                              : "Republicando..."
                            : activity.isPublished
                              ? "Despublicar"
                              : "Republicar"}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <div className="internal-approved-activity-page__column">
                  <Card className="internal-approved-activity-page__panel">
                    <CardContent className="internal-approved-activity-page__panel-content">
                      <h2 className="internal-approved-activity-page__panel-title">
                        Contexto editorial
                      </h2>
                      <div className="internal-approved-activity-page__metadata-grid">
                        <div className="internal-approved-activity-page__metadata-item">
                          <span className="internal-approved-activity-page__metadata-label">
                            Estado publico
                          </span>
                          <span className="internal-approved-activity-page__metadata-value">
                            {activity.isPublished ? "Visible en catalogo" : "Oculta del catalogo"}
                          </span>
                        </div>
                        <div className="internal-approved-activity-page__metadata-item">
                          <span className="internal-approved-activity-page__metadata-label">
                            Draft vinculado
                          </span>
                          <span className="internal-approved-activity-page__metadata-value">
                            #{activity.draftId}
                          </span>
                        </div>
                        <div className="internal-approved-activity-page__metadata-item">
                          <span className="internal-approved-activity-page__metadata-label">
                            Source label
                          </span>
                          <span className="internal-approved-activity-page__metadata-value">
                            {activity.sourceLabel || "Sin etiqueta"}
                          </span>
                        </div>
                        <div className="internal-approved-activity-page__metadata-item">
                          <span className="internal-approved-activity-page__metadata-label">
                            Review status
                          </span>
                          <span className="internal-approved-activity-page__metadata-value">
                            {activity.reviewStatus || "approved"}
                          </span>
                        </div>
                        <div className="internal-approved-activity-page__metadata-item">
                          <span className="internal-approved-activity-page__metadata-label">
                            Creada
                          </span>
                          <span className="internal-approved-activity-page__metadata-value">
                            {formatDateLabel(activity.activityCreatedAt)}
                          </span>
                        </div>
                        <div className="internal-approved-activity-page__metadata-item">
                          <span className="internal-approved-activity-page__metadata-label">
                            Actualizada
                          </span>
                          <span className="internal-approved-activity-page__metadata-value">
                            {formatDateLabel(activity.activityUpdatedAt)}
                          </span>
                        </div>
                      </div>
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
