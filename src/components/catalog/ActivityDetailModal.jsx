import { useEffect, useRef, useState } from "react";
import {
  ArrowLeft,
  Heart,
  LoaderCircle,
  X,
} from "lucide-react";
import { ActivityContactOptionsDialog } from "@/components/catalog/ActivityContactOptionsDialog";
import { Button } from "@/components/ui/button";
import {
  ACTIVITY_DETAIL_PLACEHOLDER_SRC,
  buildActivityDetailViewModel,
  handleActivityDetailImageError,
} from "@/helpers/activityDetailViewModel";
import { openActivityContactAction } from "@/helpers/buildActivityContactAction";
import { useActivityContactOptions } from "@/hooks/useActivityContactOptions";
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
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const {
    contactOptions,
    isLoading: isContactOptionsLoading,
    error: contactOptionsError,
    reload: reloadContactOptions,
  } = useActivityContactOptions(activity?.id, open);

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
  const hasSingleContactOption = contactOptions.length === 1;
  const hasMultipleContactOptions = contactOptions.length > 1;
  const hasContactOptions = hasSingleContactOption || hasMultipleContactOptions;
  const contactMessage = isContactOptionsLoading
    ? "Cargando opciones de contacto."
    : contactOptionsError
      ? "No pudimos cargar el contacto ahora mismo."
      : hasMultipleContactOptions
        ? "Elige el canal que prefieras."
        : hasSingleContactOption
          ? null
          : "No hay un canal de contacto publicado en este momento.";

  const handleSelectContactOption = (contactOption) => {
    onContactClick?.(activity, contactOption);
    openActivityContactAction(activity, contactOption);
    setIsContactDialogOpen(false);
  };

  const handleContactAction = () => {
    if (!hasContactOptions || isContactOptionsLoading) {
      return;
    }

    if (hasSingleContactOption) {
      handleSelectContactOption(contactOptions[0]);
      return;
    }

    setIsContactDialogOpen(true);
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
                <p className="activity-detail-modal__description">
                  {viewModel.description}
                </p>
              </section>
            ) : null}

            {viewModel.evaluationItems.length > 0 ? (
              <section className="activity-detail-modal__section">
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
                <h3 className="activity-detail-modal__section-title">
                  Contacto
                </h3>
              </div>
              {contactMessage ? (
                <p className="activity-detail-modal__contact-copy">
                  {contactMessage}
                </p>
              ) : null}
              {contactOptionsError ? (
                <Button type="button" variant="outline" onClick={reloadContactOptions}>
                  Reintentar contactos
                </Button>
              ) : hasContactOptions ? (
                <Button
                  type="button"
                  onClick={handleContactAction}
                  disabled={isContactOptionsLoading}
                >
                  {isContactOptionsLoading ? (
                    <>
                      <LoaderCircle className="animate-spin" />
                      Cargando contacto
                    </>
                  ) : hasMultipleContactOptions ? (
                    "Elegir contacto"
                  ) : (
                    "Contactar"
                  )}
                </Button>
              ) : null}
            </section>
          </div>
        </div>
      </div>
      <ActivityContactOptionsDialog
        activity={activity}
        contactOptions={contactOptions}
        open={isContactDialogOpen}
        onClose={() => setIsContactDialogOpen(false)}
        onSelectOption={handleSelectContactOption}
      />
    </div>
  );
}
