import {
  AlertTriangle,
  ArrowLeft,
  ClipboardList,
  EyeOff,
  LoaderCircle,
  SearchX,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { CatalogState } from "@/components/states/CatalogState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/useI18n";
import {
  listMyActivityPublications,
  unpublishMyActivity,
} from "@/services/userPublicationsService";
import "./UserPublicationsPage.css";

function formatDateLabel(value) {
  if (!value) {
    return "";
  }

  const dateValue = new Date(value);

  if (Number.isNaN(dateValue.getTime())) {
    return "";
  }

  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "medium",
  }).format(dateValue);
}

function getPublicationStatusLabel(userStatus, t) {
  if (userStatus === "needs_changes") {
    return t("userPublications.status.needsChanges");
  }

  if (userStatus === "published") {
    return t("userPublications.status.published");
  }

  if (userStatus === "unpublished") {
    return t("userPublications.status.unpublished");
  }

  if (userStatus === "rejected") {
    return t("userPublications.status.rejected");
  }

  if (userStatus === "archived") {
    return t("userPublications.status.archived");
  }

  return t("userPublications.status.inReview");
}

export function UserPublicationsPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [publications, setPublications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const [pendingActionKey, setPendingActionKey] = useState("");

  useEffect(() => {
    let isMounted = true;

    const loadPublications = async () => {
      setIsLoading(true);
      setError("");

      try {
        const nextPublications = await listMyActivityPublications();

        if (!isMounted) {
          return;
        }

        setPublications(nextPublications);
      } catch (loadError) {
        if (!isMounted) {
          return;
        }

        setPublications([]);
        setError(
          loadError instanceof Error
            ? loadError.message
            : t("userPublications.loadErrorDescription"),
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    void loadPublications();

    return () => {
      isMounted = false;
    };
  }, [t]);

  const handleUnpublish = async (publication) => {
    if (!publication.canUnpublish || !publication.activityId) {
      return;
    }

    const confirmed = window.confirm(
      t("userPublications.actions.unpublishConfirm"),
    );

    if (!confirmed) {
      return;
    }

    const actionKey = `${publication.itemKind}-${publication.activityId}-unpublish`;
    setPendingActionKey(actionKey);
    setActionError("");
    setActionMessage("");

    try {
      const result = await unpublishMyActivity(publication.activityId);

      setPublications((currentPublications) =>
        currentPublications.map((currentPublication) => {
          if (currentPublication.activityId !== result.activityId) {
            return currentPublication;
          }

          return {
            ...currentPublication,
            canUnpublish: false,
            isPublished: false,
            updatedAt: result.updatedAt || currentPublication.updatedAt,
            userStatus: "unpublished",
          };
        }),
      );
      setActionMessage(t("userPublications.actions.unpublishSuccess"));
    } catch (unpublishError) {
      setActionError(
        unpublishError instanceof Error
          ? unpublishError.message
          : t("userPublications.actions.unpublishError"),
      );
    } finally {
      setPendingActionKey("");
    }
  };

  return (
    <div className="user-publications-page">
      <main className="user-publications-page__main">
        <div className="page-container user-publications-page__container">
          <header className="user-publications-page__header">
            <Button
              variant="ghost"
              className="user-publications-page__back-button"
              onClick={() => navigate("/perfil")}
            >
              <ArrowLeft />
              {t("userPublications.back")}
            </Button>

            <div className="user-publications-page__intro">
              <p className="user-publications-page__eyebrow">
                {t("userPublications.eyebrow")}
              </p>
              <h1 className="user-publications-page__title">
                {t("userPublications.title")}
              </h1>
              <p className="user-publications-page__description">
                {t("userPublications.description")}
              </p>
            </div>
          </header>

          {isLoading ? (
            <CatalogState
              icon={LoaderCircle}
              eyebrow={t("userPublications.loadingEyebrow")}
              title={t("userPublications.loadingTitle")}
              description={t("userPublications.loadingDescription")}
            />
          ) : error ? (
            <CatalogState
              icon={AlertTriangle}
              eyebrow={t("userPublications.errorEyebrow")}
              title={t("userPublications.loadErrorTitle")}
              description={error}
              actionLabel={t("userPublications.retry")}
              onAction={() => window.location.reload()}
            />
          ) : publications.length === 0 ? (
            <CatalogState
              icon={SearchX}
              eyebrow={t("userPublications.emptyEyebrow")}
              title={t("userPublications.emptyTitle")}
              description={t("userPublications.emptyDescription")}
            />
          ) : (
            <section className="user-publications-page__list" aria-live="polite">
              {actionMessage ? (
                <p className="user-publications-page__action-feedback user-publications-page__action-feedback--success">
                  {actionMessage}
                </p>
              ) : null}

              {actionError ? (
                <p
                  className="user-publications-page__action-feedback user-publications-page__action-feedback--error"
                  role="alert"
                >
                  {actionError}
                </p>
              ) : null}

              {publications.map((publication) => {
                const statusLabel = getPublicationStatusLabel(
                  publication.userStatus,
                  t,
                );
                const dateLabel = formatDateLabel(
                  publication.updatedAt || publication.createdAt,
                );
                const key = `${publication.itemKind}-${publication.draftId ?? publication.activityId}`;
                const unpublishActionKey = `${publication.itemKind}-${publication.activityId}-unpublish`;
                const isUnpublishing = pendingActionKey === unpublishActionKey;

                return (
                  <Card key={key} className="user-publications-page__card">
                    <CardContent className="user-publications-page__card-content">
                      <div className="user-publications-page__card-topline">
                        <span
                          className={`user-publications-page__status user-publications-page__status--${publication.userStatus || "in_review"}`}
                        >
                          {statusLabel}
                        </span>
                        {dateLabel ? (
                          <span className="user-publications-page__date">
                            {dateLabel}
                          </span>
                        ) : null}
                      </div>

                      <div className="user-publications-page__card-heading">
                        <ClipboardList />
                        <h2>{publication.title}</h2>
                      </div>

                      {publication.userFeedbackSummary ? (
                        <div className="user-publications-page__feedback">
                          <p>{publication.userFeedbackSummary}</p>
                        </div>
                      ) : null}

                      {publication.userFeedbackJson.length > 0 ? (
                        <ul className="user-publications-page__feedback-list">
                          {publication.userFeedbackJson.map((item, index) => (
                            <li key={`${item.reason_code || item.field}-${index}`}>
                              {item.message}
                            </li>
                          ))}
                        </ul>
                      ) : null}

                      {publication.canUnpublish ? (
                        <div className="user-publications-page__actions">
                          <Button
                            type="button"
                            variant="outline"
                            className="user-publications-page__action-button"
                            onClick={() => {
                              void handleUnpublish(publication);
                            }}
                            disabled={isUnpublishing}
                          >
                            {isUnpublishing ? <LoaderCircle /> : <EyeOff />}
                            {isUnpublishing
                              ? t("userPublications.actions.unpublishing")
                              : t("userPublications.actions.unpublish")}
                          </Button>
                        </div>
                      ) : null}
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
