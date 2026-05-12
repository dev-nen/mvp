import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActivityContactOptionLabel } from "@/helpers/buildActivityContactAction";
import { useI18n } from "@/i18n/useI18n";
import "./ActivityContactOptionsDialog.css";

function normalizeContactMethod(contactMethod) {
  return typeof contactMethod === "string" ? contactMethod.trim().toLowerCase() : "";
}

function getContactOptionTone(contactOption) {
  const contactMethod = normalizeContactMethod(contactOption?.contactMethod);

  if (["whatsapp", "email", "web", "form", "phone"].includes(contactMethod)) {
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

  if (contactMethod === "web") {
    return "Web";
  }

  if (contactMethod === "form") {
    return t("catalog.contactOptions.form");
  }

  if (contactMethod === "phone") {
    return t("catalog.contactOptions.phone");
  }

  return getActivityContactOptionLabel(contactOption);
}

export function ActivityContactOptionsDialog({
  activity,
  contactOptions = [],
  open = false,
  onClose,
  onSelectOption,
}) {
  const { t } = useI18n();

  if (!open || !activity) {
    return null;
  }

  return (
    <div className="activity-contact-options-dialog" role="presentation">
      <div
        className="activity-contact-options-dialog__overlay"
        onClick={onClose}
      />

      <div
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
              {t("catalog.contactOptions.title")}
            </h3>
            <p className="activity-contact-options-dialog__subtitle">
              {t("catalog.contactOptions.subtitle", { title: activity.title })}
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

            return (
              <button
                key={contactOption.id}
                type="button"
                className={`activity-contact-options-dialog__item activity-contact-options-dialog__item--${tone}`}
                onClick={() => onSelectOption?.(contactOption)}
              >
                <span className="activity-contact-options-dialog__item-label">
                  {getContactOptionDisplayLabel(contactOption, t)}
                </span>
                <span className="activity-contact-options-dialog__item-value">
                  {contactOption.contactValue}
                </span>
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
