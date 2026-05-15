import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { ArrowLeft, Heart, LoaderCircle, X } from "lucide-react";
import { ActivityContactOptionsDialog } from "@/components/catalog/ActivityContactOptionsDialog";
import { Button } from "@/components/ui/button";
import {
  ACTIVITY_DETAIL_PLACEHOLDER_SRC,
  buildActivityDetailViewModel,
  handleActivityDetailImageError,
} from "@/helpers/activityDetailViewModel";
import { openActivityContactAction } from "@/helpers/buildActivityContactAction";
import { useActivityContactOptions } from "@/hooks/useActivityContactOptions";
import { useI18n } from "@/i18n/useI18n";
import "./ActivityDetailModal.css";

const SafeMarkdown = lazy(() =>
  import("@/components/ui/SafeMarkdown").then((module) => ({
    default: module.SafeMarkdown,
  })),
);

export function ActivityDetailModal({
  activity,
  isFavorite = false,
  onToggleFavorite,
  open,
  onClose,
  onContactClick,
  contactRequesterName = "",
}) {
  const { t } = useI18n();
  const scrollContainerRef = useRef(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
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

    setIsDescriptionExpanded(false);

    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [open, activity?.id]);

  if (!open || !activity) {
    return null;
  }

  const viewModel = buildActivityDetailViewModel(activity, {
    age: {
      allAges: t("catalog.card.allAges"),
      ageRange: t("catalog.card.ageRange"),
      ageFrom: t("catalog.card.ageFrom"),
      ageUntil: t("catalog.card.ageUntil"),
      consultAge: t("catalog.card.consultAge"),
    },
    fallbackDescription: t("catalog.detail.fallbackDescription"),
    ageLabel: t("catalog.detail.ageLabel"),
    scheduleLabel: t("catalog.detail.scheduleLabel"),
    priceLabel: t("catalog.detail.priceLabel"),
    venueLabel: t("catalog.detail.venueLabel"),
    addressLabel: t("catalog.detail.addressLabel"),
    centerLabel: t("catalog.detail.centerLabel"),
    cityLabel: t("catalog.detail.cityLabel"),
  });
  const hasDescription = Boolean(viewModel.description);
  const hasSingleContactOption = contactOptions.length === 1;
  const hasMultipleContactOptions = contactOptions.length > 1;
  const hasContactOptions = hasSingleContactOption || hasMultipleContactOptions;
  const contactMessage = isContactOptionsLoading
    ? t("catalog.detail.loadingContactOptions")
    : contactOptionsError
      ? t("catalog.detail.contactOptionsError")
      : hasMultipleContactOptions
        ? t("catalog.detail.choosePreferredChannel")
        : hasSingleContactOption
          ? null
          : t("catalog.detail.noContactOptions");

  const handleSelectContactOption = (contactOption) => {
    onContactClick?.(activity, contactOption);
    openActivityContactAction(activity, contactOption, {
      requesterName: contactRequesterName,
    });
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
        className={`activity-detail-modal__panel ${
          isDescriptionExpanded ? "activity-detail-modal__panel--expanded" : ""
        }`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-detail-modal-title"
      >
        <div ref={scrollContainerRef} className="activity-detail-modal__scroll">
          <div className="activity-detail-modal__topbar">
            <button
              type="button"
              className="activity-detail-modal__back"
              onClick={onClose}
            >
              <ArrowLeft />
              <span>{t("catalog.detail.back")}</span>
            </button>

            <button
              type="button"
              className="activity-detail-modal__close"
              onClick={onClose}
              aria-label={t("catalog.detail.close")}
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
                          {t("catalog.detail.free")}
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
                    isFavorite
                      ? t("catalog.detail.removeFavorite")
                      : t("catalog.detail.addFavorite")
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

            {hasDescription ? (
              <section className="activity-detail-modal__section">
                {viewModel.descriptionFormat === "markdown" ? (
                  <Suspense fallback={null}>
                    <SafeMarkdown
                      content={viewModel.description}
                      className={`activity-detail-modal__description ${
                        isDescriptionExpanded
                          ? "activity-detail-modal__description--expanded"
                          : "activity-detail-modal__description--collapsed"
                      }`}
                    />
                  </Suspense>
                ) : (
                  <p
                    className={`activity-detail-modal__description ${
                      isDescriptionExpanded
                        ? "activity-detail-modal__description--expanded"
                        : "activity-detail-modal__description--collapsed"
                    }`}
                  >
                    {viewModel.description}
                  </p>
                )}
                <button
                  type="button"
                  className="activity-detail-modal__description-toggle"
                  onClick={() =>
                    setIsDescriptionExpanded((currentValue) => !currentValue)
                  }
                >
                  {isDescriptionExpanded
                    ? t("catalog.detail.showLess")
                    : t("catalog.detail.showMore")}
                </button>
              </section>
            ) : null}

            {viewModel.summaryItems.length > 0 ? (
              <section className="activity-detail-modal__section">
                <ul className="activity-detail-modal__summary-list">
                  {viewModel.summaryItems.map(({ key, value, tone }) => (
                    <li
                      key={key}
                      className={`activity-detail-modal__summary-item ${
                        tone ? `activity-detail-modal__summary-item--${tone}` : ""
                      }`}
                    >
                      {value}
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}

            <section className="activity-detail-modal__contact">
              <div className="activity-detail-modal__section-head">
                <h3 className="activity-detail-modal__section-title">
                  {t("catalog.detail.contact")}
                </h3>
              </div>
              {contactMessage ? (
                <p className="activity-detail-modal__contact-copy">
                  {contactMessage}
                </p>
              ) : null}
              {contactOptionsError ? (
                <Button type="button" variant="outline" onClick={reloadContactOptions}>
                  {t("catalog.detail.retryContacts")}
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
                      {t("catalog.detail.loadingContact")}
                    </>
                  ) : hasMultipleContactOptions ? (
                    t("catalog.detail.chooseContact")
                  ) : (
                    t("catalog.detail.contactAction")
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
