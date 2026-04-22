import { LoaderCircle, SearchX } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { CatalogState } from "@/components/states/CatalogState";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScoutDraftStatusBadge } from "@/features/scout-drafts/ScoutDraftStatusBadge";
import { InternalToolRoute } from "@/components/auth/InternalToolRoute";
import { listInternalDrafts } from "@/services/internalDraftsService";
import "./InternalDraftInboxPage.css";

function formatConfidenceScore(confidenceScore) {
  if (typeof confidenceScore !== "number" || Number.isNaN(confidenceScore)) {
    return "No signal";
  }

  const normalizedScore = confidenceScore <= 1 ? confidenceScore * 100 : confidenceScore;
  return `${Math.round(normalizedScore)}%`;
}

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
                <p className="internal-draft-inbox-page__eyebrow">Uso interno | Draft Inbox</p>
                <h1 className="internal-draft-inbox-page__title">Draft Inbox</h1>
                <p className="internal-draft-inbox-page__description">
                  Revisa drafts editoriales, corrige el payload publicable y decide
                  si pasan o no a una actividad real del catalogo.
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
                description="Estamos recuperando los drafts disponibles para revision editorial."
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
                title="No hay drafts visibles todavia"
                description="Aplica el SQL de la fase y ejecuta la seed del Draft Inbox para empezar a validar el circuito editorial."
              />
            ) : (
              <section className="internal-draft-inbox-page__list" aria-live="polite">
                {drafts.map((draft) => (
                  <Card
                    key={draft.id}
                    className="internal-draft-inbox-page__draft-card"
                  >
                    <CardContent className="internal-draft-inbox-page__draft-content">
                      <div className="internal-draft-inbox-page__draft-topline">
                        <div className="internal-draft-inbox-page__draft-meta">
                          <span>Draft #{draft.id}</span>
                          <span>{draft.sourceType || "unknown"}</span>
                          <span>{formatDateLabel(draft.createdAt)}</span>
                        </div>
                        <ScoutDraftStatusBadge reviewStatus={draft.reviewStatus} />
                      </div>

                      <div>
                        <h2 className="internal-draft-inbox-page__draft-title">
                          {draft.displayTitle}
                        </h2>
                      </div>

                      <div className="internal-draft-inbox-page__draft-grid">
                        <div className="internal-draft-inbox-page__draft-field">
                          <span className="internal-draft-inbox-page__draft-field-label">
                            Source label
                          </span>
                          <span className="internal-draft-inbox-page__draft-field-value">
                            {draft.sourceLabel || "No label"}
                          </span>
                        </div>

                        <div className="internal-draft-inbox-page__draft-field">
                          <span className="internal-draft-inbox-page__draft-field-label">
                            Confidence
                          </span>
                          <span className="internal-draft-inbox-page__draft-field-value">
                            {formatConfidenceScore(draft.confidenceScore)}
                          </span>
                        </div>

                        <div className="internal-draft-inbox-page__draft-field">
                          <span className="internal-draft-inbox-page__draft-field-label">
                            Reviewed payload
                          </span>
                          <span className="internal-draft-inbox-page__draft-field-value">
                            {draft.reviewStatus === "pending_review"
                              ? "Editable"
                              : "Terminal"}
                          </span>
                        </div>

                        <div className="internal-draft-inbox-page__draft-field">
                          <span className="internal-draft-inbox-page__draft-field-label">
                            Approved activity
                          </span>
                          <span className="internal-draft-inbox-page__draft-field-value">
                            {draft.approvedActivityId ?? "Pending"}
                          </span>
                        </div>
                      </div>

                      <div className="internal-draft-inbox-page__draft-actions">
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/internal/drafts/${draft.id}`)}
                        >
                          Open draft
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
