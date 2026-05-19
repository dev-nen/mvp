import {
  AlertTriangle,
  ArrowLeft,
  FileText,
  LoaderCircle,
  SearchX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { CatalogState } from "@/components/states/CatalogState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityPublicationBadge } from "@/features/scout-drafts/ActivityPublicationBadge";
import {
  formatActivityAgeLabel,
  formatActivityLocationLabel,
} from "@/helpers/activityPresentation";
import {
  INTERNAL_ACTIVITY_CATALOG_FILTERS,
  listInternalAdminActivities,
  publishInternalAdminActivity,
  unpublishInternalAdminActivity,
} from "@/services/internalActivityCatalogService";
import "./InternalActivityCatalogPage.css";

const ADMIN_ACTIVITY_PLACEHOLDER_SRC =
  "/placeholders/activity-card-placeholder.svg";

const FILTER_OPTIONS = [
  {
    label: "Todas",
    value: INTERNAL_ACTIVITY_CATALOG_FILTERS.ALL,
  },
  {
    label: "Publicadas",
    value: INTERNAL_ACTIVITY_CATALOG_FILTERS.PUBLISHED,
  },
  {
    label: "Despublicadas",
    value: INTERNAL_ACTIVITY_CATALOG_FILTERS.UNPUBLISHED,
  },
];

function handleAdminActivityImageError(event) {
  const imageElement = event.currentTarget;

  if (imageElement.dataset.placeholderApplied === "true") {
    return;
  }

  imageElement.dataset.placeholderApplied = "true";
  imageElement.src = ADMIN_ACTIVITY_PLACEHOLDER_SRC;
}

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function joinLabels(labels) {
  return labels.map(getTrimmedText).filter(Boolean).join(" · ");
}

function getPriceLabel(activity) {
  if (activity.is_free === true) {
    return "Gratis";
  }

  return getTrimmedText(activity.price_label) || "Consultar precio";
}

function getScheduleLabel(activity) {
  return getTrimmedText(activity.schedule_label) || "Consultar horario";
}

function getDraftReference(activity) {
  if (!activity.draftId) {
    return "Sin draft vinculado";
  }

  return `Draft #${activity.draftId}`;
}

function getActionLabel(activity, isPending) {
  if (activity.isPublished) {
    return isPending ? "Despublicando..." : "Despublicar";
  }

  return isPending ? "Republicando..." : "Republicar";
}

export function InternalActivityCatalogPage() {
  const navigate = useNavigate();
  const [filter, setFilter] = useState(INTERNAL_ACTIVITY_CATALOG_FILTERS.ALL);
  const [activities, setActivities] = useState([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackTone, setFeedbackTone] = useState("success");
  const [pendingActivityId, setPendingActivityId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadActivities = async () => {
      setIsLoading(true);
      setError("");

      try {
        const nextActivities = await listInternalAdminActivities({ filter });

        if (!isMounted) {
          return;
        }

        setActivities(nextActivities);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setActivities([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No pudimos cargar el panel de actividades.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadActivities();

    return () => {
      isMounted = false;
    };
  }, [filter, reloadKey]);

  const refreshActivities = async () => {
    const nextActivities = await listInternalAdminActivities({ filter });
    setActivities(nextActivities);
  };

  const handleTogglePublication = async (activity) => {
    if (!activity?.activityId || pendingActivityId) {
      return;
    }

    setPendingActivityId(activity.activityId);
    setFeedbackMessage("");
    setError("");

    try {
      if (activity.isPublished) {
        await unpublishInternalAdminActivity(activity.activityId);
        await refreshActivities();
        setFeedbackMessage("Actividad despublicada.");
      } else {
        await publishInternalAdminActivity(activity.activityId);
        await refreshActivities();
        setFeedbackMessage("Actividad republicada.");
      }

      setFeedbackTone("success");
    } catch (toggleError) {
      setFeedbackTone("error");
      setFeedbackMessage(
        toggleError instanceof Error
          ? toggleError.message
          : "No pudimos cambiar la publicacion de la actividad.",
      );
    } finally {
      setPendingActivityId(null);
    }
  };

  return (
    <div className="internal-activity-catalog-page">
      <main className="internal-activity-catalog-page__main">
        <div className="page-container internal-activity-catalog-page__container">
          <header className="internal-activity-catalog-page__header">
            <div className="internal-activity-catalog-page__copy">
              <Button
                variant="ghost"
                className="internal-activity-catalog-page__back-button"
                onClick={() => navigate("/perfil")}
              >
                <ArrowLeft />
                Volver al perfil
              </Button>
              <p className="internal-activity-catalog-page__eyebrow">
                Uso interno | Catalogo de actividades
              </p>
              <h2 className="internal-activity-catalog-page__title">
                Panel de actividades
              </h2>
              <p className="internal-activity-catalog-page__description">
                Revisa actividades publicadas y despublicadas sin mezclar la
                visibilidad del catalogo con el ciclo de vida de drafts.
              </p>
            </div>

            <div className="internal-activity-catalog-page__header-actions">
              {!isLoading && !error ? (
                <p className="internal-activity-catalog-page__count">
                  {activities.length} actividades visibles
                </p>
              ) : null}
              <Button
                variant="outline"
                onClick={() => navigate("/internal/drafts")}
              >
                <FileText />
                Draft Inbox
              </Button>
            </div>
          </header>

          <section
            className="internal-activity-catalog-page__toolbar"
            aria-label="Filtros de publicacion"
          >
            <div className="internal-activity-catalog-page__filters">
              {FILTER_OPTIONS.map((option) => (
                <Button
                  key={option.value}
                  type="button"
                  variant={filter === option.value ? "default" : "outline"}
                  className="internal-activity-catalog-page__filter-button"
                  aria-pressed={filter === option.value}
                  onClick={() => {
                    setFilter(option.value);
                    setFeedbackMessage("");
                  }}
                >
                  {option.label}
                </Button>
              ))}
            </div>
          </section>

          {feedbackMessage ? (
            <p
              className={`internal-activity-catalog-page__feedback internal-activity-catalog-page__feedback--${feedbackTone}`}
              role={feedbackTone === "error" ? "alert" : "status"}
            >
              {feedbackMessage}
            </p>
          ) : null}

          {isLoading ? (
            <CatalogState
              icon={LoaderCircle}
              eyebrow="Actividades"
              title="Cargando catalogo interno"
              description="Estamos recuperando actividades publicadas y despublicadas."
            />
          ) : error ? (
            <CatalogState
              icon={AlertTriangle}
              eyebrow="Error"
              title="No pudimos cargar actividades"
              description={error}
              actionLabel="Reintentar"
              onAction={() => setReloadKey((currentKey) => currentKey + 1)}
            />
          ) : activities.length === 0 ? (
            <CatalogState
              icon={SearchX}
              eyebrow="Sin actividades"
              title="No hay actividades para este filtro"
              description="Cambia el filtro o revisa que la migracion del panel interno este aplicada en Supabase."
            />
          ) : (
            <section
              className="internal-activity-catalog-page__grid"
              aria-live="polite"
            >
              {activities.map((activity) => {
                const imageSrc =
                  getTrimmedText(activity.image_url) ||
                  ADMIN_ACTIVITY_PLACEHOLDER_SRC;
                const isPlaceholderImage =
                  imageSrc === ADMIN_ACTIVITY_PLACEHOLDER_SRC;
                const isPending = pendingActivityId === activity.activityId;
                const taxonomyLabel = joinLabels([
                  activity.category_label,
                  activity.type_label,
                ]);

                return (
                  <Card
                    key={activity.activityId}
                    className={`internal-activity-catalog-page__card ${
                      activity.isPublished
                        ? "internal-activity-catalog-page__card--published"
                        : "internal-activity-catalog-page__card--unpublished"
                    }`}
                  >
                    <div className="internal-activity-catalog-page__card-media">
                      <img
                        src={imageSrc}
                        alt={activity.title}
                        className="internal-activity-catalog-page__card-image"
                        data-placeholder-applied={
                          isPlaceholderImage ? "true" : "false"
                        }
                        onError={handleAdminActivityImageError}
                      />
                    </div>

                    <CardContent className="internal-activity-catalog-page__card-content">
                      <div className="internal-activity-catalog-page__card-topline">
                        <ActivityPublicationBadge
                          isPublished={activity.isPublished}
                          unpublishedLabel="Despublicada"
                        />
                        <span className="internal-activity-catalog-page__card-id">
                          Actividad #{activity.activityId}
                        </span>
                      </div>

                      <div className="internal-activity-catalog-page__card-heading">
                        {taxonomyLabel ? (
                          <p className="internal-activity-catalog-page__card-category">
                            {taxonomyLabel}
                          </p>
                        ) : null}
                        <h2 className="internal-activity-catalog-page__card-title">
                          {activity.title}
                        </h2>
                      </div>

                      <div className="internal-activity-catalog-page__facts">
                        <div className="internal-activity-catalog-page__fact">
                          <span className="internal-activity-catalog-page__fact-label">
                            Ubicacion
                          </span>
                          <span className="internal-activity-catalog-page__fact-value">
                            {formatActivityLocationLabel(activity, {
                              consultLocation: "Consulta la ubicacion",
                            })}
                          </span>
                        </div>
                        <div className="internal-activity-catalog-page__fact">
                          <span className="internal-activity-catalog-page__fact-label">
                            Centro
                          </span>
                          <span className="internal-activity-catalog-page__fact-value">
                            {activity.center_name || "Centro no informado"}
                          </span>
                        </div>
                        <div className="internal-activity-catalog-page__fact">
                          <span className="internal-activity-catalog-page__fact-label">
                            Edad
                          </span>
                          <span className="internal-activity-catalog-page__fact-value">
                            {formatActivityAgeLabel(activity)}
                          </span>
                        </div>
                        <div className="internal-activity-catalog-page__fact">
                          <span className="internal-activity-catalog-page__fact-label">
                            Horario
                          </span>
                          <span className="internal-activity-catalog-page__fact-value">
                            {getScheduleLabel(activity)}
                          </span>
                        </div>
                        <div className="internal-activity-catalog-page__fact">
                          <span className="internal-activity-catalog-page__fact-label">
                            Precio
                          </span>
                          <span className="internal-activity-catalog-page__fact-value">
                            {getPriceLabel(activity)}
                          </span>
                        </div>
                        <div className="internal-activity-catalog-page__fact">
                          <span className="internal-activity-catalog-page__fact-label">
                            Trazabilidad
                          </span>
                          <span className="internal-activity-catalog-page__fact-value">
                            {getDraftReference(activity)}
                          </span>
                        </div>
                      </div>

                      <div className="internal-activity-catalog-page__card-actions">
                        {activity.draftId ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() =>
                              navigate(
                                `/internal/activities/${activity.activityId}`,
                              )
                            }
                          >
                            Abrir detalle
                          </Button>
                        ) : (
                          <span className="internal-activity-catalog-page__no-detail">
                            Sin detalle editable
                          </span>
                        )}
                        <Button
                          type="button"
                          onClick={() => handleTogglePublication(activity)}
                          disabled={Boolean(pendingActivityId)}
                        >
                          {getActionLabel(activity, isPending)}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
