import { useEffect, useRef } from "react";
import {
  ArrowLeft,
  Heart,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsappActivityUrl } from "@/helpers/buildWhatsappActivityMessage";
import {
  ACTIVITY_DETAIL_PLACEHOLDER_SRC,
  buildActivityDetailViewModel,
  handleActivityDetailImageError,
} from "@/helpers/activityDetailViewModel";
import "./ActivityDetailModal.css";

export function ActivityDetailModal({
  activity,
  isFavorite = false,
  onToggleFavorite,
  open,
  onClose,
  onContactClick,
}) {
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [open, activity?.id]);

  if (!open || !activity) {
    return null;
  }

  const viewModel = buildActivityDetailViewModel(activity);

  const handleOpenWhatsapp = () => {
    onContactClick?.(activity);
    window.open(buildWhatsappActivityUrl(activity), "_blank", "noopener,noreferrer");
  };

  const handleToggleFavorite = () => {
    onToggleFavorite?.(activity);
  };

  return (
    <div className="activity-detail-modal" role="presentation">
      <div className="activity-detail-modal__overlay" onClick={onClose} />

      <div
        className="activity-detail-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-detail-modal-title"
      >
        <div
          ref={scrollContainerRef}
          className="activity-detail-modal__scroll"
        >
          <div className="activity-detail-modal__topbar">
            <button
              type="button"
              className="activity-detail-modal__back"
              onClick={onClose}
            >
              <ArrowLeft />
              <span>Volver</span>
            </button>

            <button
              type="button"
              className="activity-detail-modal__close"
              onClick={onClose}
              aria-label="Cerrar detalle"
            >
              <X />
            </button>
          </div>

          <div className="activity-detail-modal__media">
            <img
              src={viewModel.imageSrc}
              alt={activity.title}
              className="activity-detail-modal__image"
              data-placeholder-applied={
                viewModel.imageSrc === ACTIVITY_DETAIL_PLACEHOLDER_SRC
                  ? "true"
                  : "false"
              }
              onError={handleActivityDetailImageError}
            />
          </div>

          <div className="activity-detail-modal__body">
            <section className="activity-detail-modal__identity">
              <div className="activity-detail-modal__identity-head">
                <div className="activity-detail-modal__identity-copy">
                  <h2
                    id="activity-detail-modal-title"
                    className="activity-detail-modal__title"
                  >
                    {viewModel.title}
                  </h2>
                  {viewModel.categoryLabel || viewModel.showFreeBadge ? (
                    <div className="activity-detail-modal__identity-meta">
                      {viewModel.categoryLabel ? (
                        <p className="activity-detail-modal__category">
                          {viewModel.categoryLabel}
                        </p>
                      ) : null}
                      {viewModel.showFreeBadge ? (
                        <span className="activity-detail-modal__free-badge">
                          Gratis
                        </span>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className={`activity-detail-modal__favorite ${
                    isFavorite ? "activity-detail-modal__favorite--active" : ""
                  }`}
                  onClick={handleToggleFavorite}
                  disabled={!onToggleFavorite}
                  aria-label={
                    isFavorite ? "Quitar de favoritos" : "Anadir a favoritos"
                  }
                >
                  <Heart
                    className={`activity-detail-modal__favorite-icon ${
                      isFavorite
                        ? "activity-detail-modal__favorite-icon--filled"
                        : ""
                    }`}
                  />
                </Button>
              </div>
            </section>

            {viewModel.description ? (
              <section className="activity-detail-modal__section">
                <p className="activity-detail-modal__section-eyebrow">
                  Descripcion
                </p>
                <p className="activity-detail-modal__description">
                  {viewModel.description}
                </p>
              </section>
            ) : null}

            {viewModel.evaluationItems.length > 0 ? (
              <section className="activity-detail-modal__section">
                <div className="activity-detail-modal__section-head">
                  <p className="activity-detail-modal__section-eyebrow">
                    Informacion clave
                  </p>
                  <h3 className="activity-detail-modal__section-title">
                    Evalua si encaja
                  </h3>
                </div>

                <dl className="activity-detail-modal__facts-grid">
                  {viewModel.evaluationItems.map(
                    ({ key, label, value, icon: Icon, tone }) => (
                      <div
                        key={key}
                        className={`activity-detail-modal__fact ${
                          tone ? `activity-detail-modal__fact--${tone}` : ""
                        }`}
                      >
                        <dt className="activity-detail-modal__fact-label">{label}</dt>
                        <dd className="activity-detail-modal__fact-value">
                          <Icon
                            className="activity-detail-modal__fact-icon"
                            aria-hidden="true"
                          />
                          <span>{value}</span>
                        </dd>
                      </div>
                    ),
                  )}
                </dl>
              </section>
            ) : null}

            {viewModel.locationItems.length > 0 ? (
              <section className="activity-detail-modal__section">
                <div className="activity-detail-modal__section-head">
                  <p className="activity-detail-modal__section-eyebrow">
                    Ubicacion
                  </p>
                  <h3 className="activity-detail-modal__section-title">
                    Referencia practica
                  </h3>
                </div>

                <dl className="activity-detail-modal__facts-grid activity-detail-modal__facts-grid--location">
                  {viewModel.locationItems.map(({ key, label, value, icon: Icon }) => (
                    <div key={key} className="activity-detail-modal__fact">
                      <dt className="activity-detail-modal__fact-label">{label}</dt>
                      <dd className="activity-detail-modal__fact-value">
                        <Icon
                          className="activity-detail-modal__fact-icon"
                          aria-hidden="true"
                        />
                        <span>{value}</span>
                      </dd>
                    </div>
                  ))}
                </dl>
              </section>
            ) : null}

            <section className="activity-detail-modal__contact">
              <div className="activity-detail-modal__section-head">
                <p className="activity-detail-modal__section-eyebrow">
                  Accion principal
                </p>
                <h3 className="activity-detail-modal__section-title">
                  Contactar
                </h3>
              </div>
              <p className="activity-detail-modal__contact-copy">
                Puedes escribir directamente al centro si quieres confirmar si
                esta actividad encaja con tu familia.
              </p>
              <Button onClick={handleOpenWhatsapp} className="button--whatsapp">
                Contactar
              </Button>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}
