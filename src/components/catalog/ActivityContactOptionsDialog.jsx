import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getActivityContactOptionLabel } from "@/helpers/buildActivityContactAction";
import "./ActivityContactOptionsDialog.css";

export function ActivityContactOptionsDialog({
  activity,
  contactOptions = [],
  open = false,
  onClose,
  onSelectOption,
}) {
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
            <p className="activity-contact-options-dialog__eyebrow">
              Contacto disponible
            </p>
            <h3
              id="activity-contact-options-dialog-title"
              className="activity-contact-options-dialog__title"
            >
              Elige como contactar con {activity.title}
            </h3>
          </div>

          <button
            type="button"
            className="activity-contact-options-dialog__close"
            onClick={onClose}
            aria-label="Cerrar opciones de contacto"
          >
            <X />
          </button>
        </div>

        <div className="activity-contact-options-dialog__list">
          {contactOptions.map((contactOption) => (
            <button
              key={contactOption.id}
              type="button"
              className="activity-contact-options-dialog__item"
              onClick={() => onSelectOption?.(contactOption)}
            >
              <span className="activity-contact-options-dialog__item-label">
                {getActivityContactOptionLabel(contactOption)}
              </span>
              <span className="activity-contact-options-dialog__item-value">
                {contactOption.contactValue}
              </span>
            </button>
          ))}
        </div>

        <Button
          type="button"
          variant="outline"
          className="activity-contact-options-dialog__dismiss"
          onClick={onClose}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}
