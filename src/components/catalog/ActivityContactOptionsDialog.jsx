import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActivityContactOptionLabel } from "@/helpers/buildActivityContactAction";
import { useI18n } from "@/i18n/useI18n";
import "./ActivityContactOptionsDialog.css";

function normalizeContactMethod(contactMethod) {
  const normalizedMethod =
    typeof contactMethod === "string" ? contactMethod.trim().toLowerCase() : "";

  return normalizedMethod === "web" ? "website" : normalizedMethod;
}

function getCustomContactLabel(contactOption) {
  return typeof contactOption?.contactLabel === "string"
    ? contactOption.contactLabel.trim()
    : "";
}

function getContactOptionTone(contactOption) {
  const contactMethod = normalizeContactMethod(contactOption?.contactMethod);

  if (contactMethod === "website") {
    return "web";
  }

  if (["whatsapp", "email", "form", "phone", "instagram"].includes(contactMethod)) {
    return contactMethod;
  }

  return "default";
}

function getContactOptionDisplayLabel(contactOption, t) {
  const contactMethod = normalizeContactMethod(contactOption?.contactMethod);

  if (contactMethod === "whatsapp") {
    return "WhatsApp";
  }

  if (contactMethod === "email") {
    return "E-mail";
  }

  if (contactMethod === "website") {
    return t("catalog.contactOptions.website");
  }

  if (contactMethod === "form") {
    return t("catalog.contactOptions.form");
  }

  if (contactMethod === "phone") {
    return t("catalog.contactOptions.phone");
  }

  if (contactMethod === "instagram") {
    return t("catalog.contactOptions.instagram");
  }

  return getActivityContactOptionLabel(contactOption);
}

function getContactOptionSecondaryValue(contactOption) {
  const contactMethod = normalizeContactMethod(contactOption?.contactMethod);
  const contactValue =
    typeof contactOption?.contactValue === "string"
      ? contactOption.contactValue.trim()
      : "";

  if (!contactValue) {
    return "";
  }

  if (["website", "form", "instagram"].includes(contactMethod)) {
    return "";
  }

  return contactValue;
}

export function ActivityContactOptionsDialog({
  activity,
  contactOptions = [],
  open = false,
  onClose,
  onSelectOption,
}) {
  const { t } = useI18n();
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }
    const previousFocusedElement = document.activeElement;
    panelRef.current?.querySelector("button")?.focus();
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose?.();
      } else if (event.key === "Tab") {
        const buttons = panelRef.current?.querySelectorAll("button:not([disabled])");
        const firstButton = buttons?.[0];
        const lastButton = buttons?.[buttons.length - 1];
        if (event.shiftKey && document.activeElement === firstButton) {
          event.preventDefault();
          lastButton?.focus();
        } else if (!event.shiftKey && document.activeElement === lastButton) {
          event.preventDefault();
          firstButton?.focus();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      previousFocusedElement?.focus?.();
    };
  }, [open, onClose]);

  if (!open || !activity) {
    return null;
  }
  const contactTitle = [activity.center_name, activity.title]
    .filter((value) => typeof value === "string" && value.trim())
    .map((value) => value.trim())
    .join(" · ");

  return (
    <div className="activity-contact-options-dialog" role="presentation">
      <div
        className="activity-contact-options-dialog__overlay"
        onClick={onClose}
      />

      <div
        ref={panelRef}
        className="activity-contact-options-dialog__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-contact-options-dialog-title"
      >
        <div className="activity-contact-options-dialog__header">
          <div>
            <h3
              id="activity-contact-options-dialog-title"
              className="activity-contact-options-dialog__title"
            >
              {contactTitle}
            </h3>
            <p className="activity-contact-options-dialog__subtitle">
              {t("catalog.contactOptions.subtitle")}
            </p>
          </div>

          <button
            type="button"
            className="activity-contact-options-dialog__close"
            onClick={onClose}
            aria-label={t("catalog.contactOptions.close")}
          >
            <X />
          </button>
        </div>

        <div className="activity-contact-options-dialog__list">
          {contactOptions.map((contactOption) => {
            const tone = getContactOptionTone(contactOption);
            const displayLabel =
              getCustomContactLabel(contactOption) ||
              getContactOptionDisplayLabel(contactOption, t);
            const secondaryValue = getContactOptionSecondaryValue(contactOption);

            return (
              <button
                key={contactOption.id}
                type="button"
                className={`activity-contact-options-dialog__item activity-contact-options-dialog__item--${tone}`}
                onClick={() => onSelectOption?.(contactOption)}
              >
                <span className="activity-contact-options-dialog__item-label">
                  {displayLabel}
                </span>
                {secondaryValue ? (
                  <span className="activity-contact-options-dialog__item-value">
                    {secondaryValue}
                  </span>
                ) : null}
              </button>
            );
          })}
        </div>

        <Button
          type="button"
          variant="outline"
          className="activity-contact-options-dialog__dismiss"
          onClick={onClose}
        >
          {t("catalog.contactOptions.back")}
        </Button>
      </div>
    </div>
  );
}
