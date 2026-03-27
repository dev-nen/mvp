import { useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ActivityFacts } from "@/components/catalog/ActivityFacts";
import { buildWhatsappActivityUrl } from "@/helpers/buildWhatsappActivityMessage";
import { getActivityDescription } from "@/helpers/activityPresentation";
import "./ActivityDetailModal.css";

export function ActivityDetailModal({ activity, open, onClose }) {
  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        onClose?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  if (!open || !activity) {
    return null;
  }

  const handleOpenWhatsapp = () => {
    window.open(buildWhatsappActivityUrl(activity), "_blank", "noopener,noreferrer");
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
        <button
          type="button"
          className="activity-detail-modal__close"
          onClick={onClose}
          aria-label="Cerrar detalle"
        >
          <X />
        </button>

        <div className="activity-detail-modal__media">
          <img
            src={activity.image_url || "/placeholder.jpg"}
            alt={activity.title}
            className="activity-detail-modal__image"
          />
        </div>

        <div className="activity-detail-modal__body">
          <p className="activity-detail-modal__category">
            {activity.category_label}
          </p>
          <h2
            id="activity-detail-modal-title"
            className="activity-detail-modal__title"
          >
            {activity.title}
          </h2>

          <ActivityFacts activity={activity} />

          <p className="activity-detail-modal__description">
            {getActivityDescription(activity)}
          </p>

          <div className="activity-detail-modal__contact">
            <p className="activity-detail-modal__contact-copy">
              Tienes dudas o quieres saber si esta actividad encaja con tu
              familia? Escribenos directamente.
            </p>
            <Button onClick={handleOpenWhatsapp}>Consultar por WhatsApp</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
