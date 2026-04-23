import { LoaderCircle, SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { InternalToolRoute } from "@/components/auth/InternalToolRoute";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { CatalogState } from "@/components/states/CatalogState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ActivityPublicationBadge } from "@/features/scout-drafts/ActivityPublicationBadge";
import { ScoutDraftStatusBadge } from "@/features/scout-drafts/ScoutDraftStatusBadge";
import { listInternalDrafts } from "@/services/internalDraftsService";
import "./InternalDraftInboxPage.css";

function formatConfidenceScore(confidenceScore) {
  if (typeof confidenceScore !== "number" || Number.isNaN(confidenceScore)) {
    return "Sin señal";
  }

  const normalizedScore =
    confidenceScore <= 1 ? confidenceScore * 100 : confidenceScore;
  return `${Math.round(normalizedScore)}%`;
}

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

function getApprovedActivitySummary(draft) {
  if (!draft.approvedActivityId) {
    return "Pendiente";
  }

  if (draft.approvedActivityIsPublished === true) {
    return `#${draft.approvedActivityId} · Publicada`;
  }

  if (draft.approvedActivityIsPublished === false) {
    return `#${draft.approvedActivityId} · Oculta`;
  }

  return `#${draft.approvedActivityId}`;
}

export function InternalDraftInboxPage() {
  const navigate = useNavigate();
  const [drafts, setDrafts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadDrafts = async () => {
      setIsLoading(true);
      setError("");

      try {
        const nextDrafts = await listInternalDrafts();

        if (!isMounted) {
          return;
        }

        setDrafts(nextDrafts);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setDrafts([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : "No pudimos cargar el Draft Inbox interno.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadDrafts();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <InternalToolRoute>
      <div className="internal-draft-inbox-page">
        <Navbar />

        <main className="internal-draft-inbox-page__main">
          <div className="page-container internal-draft-inbox-page__container">
            <header className="internal-draft-inbox-page__header">
              <div className="internal-draft-inbox-page__copy">
                <p className="internal-draft-inbox-page__eyebrow">
                  Uso interno | Draft Inbox
                </p>
                <h1 className="internal-draft-inbox-page__title">
                  Draft Inbox
                </h1>
                <p className="internal-draft-inbox-page__description">
                  Revisa drafts editoriales, corrige el payload publicable y
                  decide si pasan o no a una actividad real del catálogo.
                </p>
              </div>

              {!isLoading && !error && drafts.length > 0 ? (
                <p className="internal-draft-inbox-page__count">
                  {drafts.length} drafts visibles
                </p>
              ) : null}
            </header>

            {isLoading ? (
              <CatalogState
                icon={LoaderCircle}
                eyebrow="Draft Inbox"
                title="Cargando drafts internos"
                description="Estamos recuperando los drafts disponibles para revisión editorial."
              />
            ) : error ? (
              <CatalogState
                icon={SearchX}
                eyebrow="Error"
                title="No pudimos cargar el Draft Inbox"
                description={error}
                actionLabel="Reintentar"
                onAction={() => window.location.reload()}
              />
            ) : drafts.length === 0 ? (
              <CatalogState
                icon={SearchX}
                eyebrow="Sin drafts"
                title="No hay drafts visibles todavía"
                description="Aplica el SQL de la fase y ejecuta la seed del Draft Inbox para empezar a validar el circuito editorial."
              />
            ) : (
              <section
                className="internal-draft-inbox-page__list"
                aria-live="polite"
              >
                {drafts.map((draft) => (
                  <Card
                    key={draft.id}
                    className="internal-draft-inbox-page__draft-card"
                  >
                    <CardContent className="internal-draft-inbox-page__draft-content">
                      <div className="internal-draft-inbox-page__draft-topline">
                        <div className="internal-draft-inbox-page__draft-meta">
                          <span>Draft #{draft.id}</span>
                          <span>{draft.sourceType || "Desconocido"}</span>
                          <span>{formatDateLabel(draft.createdAt)}</span>
                        </div>
                        <div className="internal-draft-inbox-page__draft-statuses">
                          <ScoutDraftStatusBadge
                            reviewStatus={draft.reviewStatus}
                          />
                          {draft.approvedActivityId ? (
                            <ActivityPublicationBadge
                              isPublished={
                                draft.approvedActivityIsPublished === true
                              }
                            />
                          ) : null}
                        </div>
                      </div>

                      <div>
                        <h2 className="internal-draft-inbox-page__draft-title">
                          {draft.displayTitle}
                        </h2>
                      </div>

                      <div className="internal-draft-inbox-page__draft-grid">
                        <div className="internal-draft-inbox-page__draft-field">
                          <span className="internal-draft-inbox-page__draft-field-label">
                            Etiqueta de origen
                          </span>
                          <span className="internal-draft-inbox-page__draft-field-value">
                            {draft.sourceLabel || "Sin etiqueta"}
                          </span>
                        </div>

                        <div className="internal-draft-inbox-page__draft-field">
                          <span className="internal-draft-inbox-page__draft-field-label">
                            Confianza
                          </span>
                          <span className="internal-draft-inbox-page__draft-field-value">
                            {formatConfidenceScore(draft.confidenceScore)}
                          </span>
                        </div>

                        <div className="internal-draft-inbox-page__draft-field">
                          <span className="internal-draft-inbox-page__draft-field-label">
                            Payload revisado
                          </span>
                          <span className="internal-draft-inbox-page__draft-field-value">
                            {draft.reviewStatus === "pending_review"
                              ? "Editable"
                              : "Solo lectura"}
                          </span>
                        </div>

                        <div className="internal-draft-inbox-page__draft-field">
                          <span className="internal-draft-inbox-page__draft-field-label">
                            Actividad publicada
                          </span>
                          <span className="internal-draft-inbox-page__draft-field-value">
                            {getApprovedActivitySummary(draft)}
                          </span>
                        </div>
                      </div>

                      <div className="internal-draft-inbox-page__draft-actions">
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/internal/drafts/${draft.id}`)}
                        >
                          Abrir draft
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </section>
            )}
          </div>
        </main>

        <Footer />
      </div>
    </InternalToolRoute>
  );
}
