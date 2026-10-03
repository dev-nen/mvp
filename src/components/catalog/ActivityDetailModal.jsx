import { lazy, Suspense, useCallback, useEffect, useId, useRef, useState } from "react";
import { ArrowLeft, LoaderCircle, X } from "lucide-react";
import { ActivityContactOptionsDialog } from "@/components/catalog/ActivityContactOptionsDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  open,
  onClose,
}) {
  const { t, language } = useI18n();
  const panelRef = useRef(null);
  const requesterNameId = useId();
  const scrollContainerRef = useRef(null);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);
  const [requesterName, setRequesterName] = useState("");
  const handleCloseContactDialog = useCallback(() => setIsContactDialogOpen(false), []);
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
    const previousFocusedElement = document.activeElement;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    panelRef.current?.querySelector("button")?.focus();

    const handleKeyDown = (event) => {
      // The contact chooser owns keyboard interaction while it is open.
      if (document.querySelector(".activity-contact-options-dialog")) {
        return;
      }
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
        return;
      }
      if (event.key === "Tab") {
        const focusableElements = panelRef.current?.querySelectorAll(
          'button:not([disabled]), a[href], input:not([disabled]), [tabindex="0"]',
        );
        const firstElement = focusableElements?.[0];
        const lastElement = focusableElements?.[focusableElements.length - 1];
        if (event.shiftKey && document.activeElement === firstElement) {
          event.preventDefault();
          lastElement?.focus();
        } else if (!event.shiftKey && document.activeElement === lastElement) {
          event.preventDefault();
          firstElement?.focus();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overflow = previousHtmlOverflow;
      window.removeEventListener("keydown", handleKeyDown);
      previousFocusedElement?.focus?.();
    };
  }, [open, onClose]);

  useEffect(() => {
    setRequesterName("");
    setIsContactDialogOpen(false);
    setIsDescriptionExpanded(false);
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
    freeLabel: t("catalog.detail.free"),
    venueLabel: t("catalog.detail.venueLabel"),
    addressLabel: t("catalog.detail.addressLabel"),
    centerLabel: t("catalog.detail.centerLabel"),
    cityLabel: t("catalog.detail.cityLabel"),
  });
  const hasDescription = Boolean(viewModel.description);
  const hasSingleContactOption = contactOptions.length === 1;
  const hasMultipleContactOptions = contactOptions.length > 1;
  const hasContactOptions = hasSingleContactOption || hasMultipleContactOptions;
  const canPersonalizeMessage = contactOptions.some((option) =>
    ["whatsapp", "email"].includes(option.contactMethod),
  );
  const contactMessage = isContactOptionsLoading
    ? t("catalog.detail.loadingContactOptions")
    : contactOptionsError
      ? t("catalog.detail.contactOptionsError")
      : hasContactOptions
        ? null
        : t("catalog.detail.noContactOptions");

  const handleSelectContactOption = (contactOption) => {
    openActivityContactAction(activity, contactOption, {
      requesterName,
      language,
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

  return (
    <div className="activity-detail-modal" role="presentation">
      <div className="activity-detail-modal__overlay" onClick={onClose} />

      <div
        ref={panelRef}
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
              {canPersonalizeMessage ? (
                <div className="activity-detail-modal__requester-name">
                  <label htmlFor={requesterNameId}>
                    {t("catalog.detail.requesterNameLabel")}
                  </label>
                  <Input
                    id={requesterNameId}
                    type="text"
                    value={requesterName}
                    onChange={(event) => setRequesterName(event.target.value)}
                    placeholder={t("catalog.detail.requesterNamePlaceholder")}
                    autoComplete="off"
                    maxLength={80}
                    aria-describedby={`${requesterNameId}-hint`}
                  />
                  <p id={`${requesterNameId}-hint`}>
                    {t("catalog.detail.requesterNameHint")}
                  </p>
                </div>
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
        onClose={handleCloseContactDialog}
        onSelectOption={handleSelectContactOption}
      />
    </div>
  );
}
