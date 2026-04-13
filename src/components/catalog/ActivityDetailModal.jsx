import { useEffect, useRef } from "react";
import {
  ArrowLeft,
  Building2,
  Clock3,
  MapPin,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildWhatsappActivityUrl } from "@/helpers/buildWhatsappActivityMessage";
import { formatActivityAgeLabel } from "@/helpers/activityPresentation";
import "./ActivityDetailModal.css";

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getDetailEvaluationItems(activity) {
  return [
    {
      key: "age",
      label: "Edad",
      value: formatActivityAgeLabel(activity),
      icon: Users,
    },
    {
      key: "schedule",
      label: "Horario",
      value: getTrimmedText(activity.schedule_label) || "Consulta el horario",
      icon: Clock3,
    },
    {
      key: "price",
      label: "Precio",
      value:
        activity.is_free === true
          ? "Gratis"
          : getTrimmedText(activity.price_label) || "Consulta el precio",
      icon: Wallet,
      tone: "price",
    },
  ];
}

function getDetailLocationItems(activity) {
  const venueName = getTrimmedText(activity.venue_name);
  const address = getTrimmedText(activity.venue_address_1);
  const centerName = getTrimmedText(activity.center_name);
  const cityName = getTrimmedText(activity.city_name);
  const locationItems = [];

  if (venueName && venueName !== centerName) {
    locationItems.push({
      key: "venue",
      label: "Lugar",
      value: venueName,
      icon: MapPin,
    });
  }

  if (address) {
    locationItems.push({
      key: "address",
      label: "Dirección",
      value: address,
      icon: MapPin,
    });
  }

  if (centerName) {
    locationItems.push({
      key: "center",
      label: "Centro",
      value: centerName,
      icon: Building2,
    });
  }

  if (cityName) {
    locationItems.push({
      key: "city",
      label: "Ciudad",
      value: cityName,
      icon: MapPin,
    });
  }

  return locationItems;
}

export function ActivityDetailModal({
  activity,
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

  const shortDescription = getTrimmedText(activity.short_description);
  const categoryLabel = getTrimmedText(activity.category_label);
  const title = getTrimmedText(activity.title);
  const evaluationItems = getDetailEvaluationItems(activity);
  const locationItems = getDetailLocationItems(activity);

  const handleOpenWhatsapp = () => {
    onContactClick?.(activity);
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
              src={activity.image_url || "/placeholder.jpg"}
              alt={activity.title}
              className="activity-detail-modal__image"
            />
          </div>

          <div className="activity-detail-modal__body">
            <section className="activity-detail-modal__identity">
              <div className="activity-detail-modal__identity-head">
                <div className="activity-detail-modal__identity-copy">
                  {categoryLabel ? (
                    <p className="activity-detail-modal__category">
                      {categoryLabel}
                    </p>
                  ) : null}
                  <h2
                    id="activity-detail-modal-title"
                    className="activity-detail-modal__title"
                  >
                    {title}
                  </h2>
                </div>

                <div
                  className="activity-detail-modal__identity-action-slot"
                  aria-hidden="true"
                />
              </div>
            </section>

            {shortDescription ? (
              <section className="activity-detail-modal__section">
                <p className="activity-detail-modal__section-eyebrow">
                  Descripción
                </p>
                <p className="activity-detail-modal__description">
                  {shortDescription}
                </p>
              </section>
            ) : null}

            <section className="activity-detail-modal__section">
              <div className="activity-detail-modal__section-head">
                <p className="activity-detail-modal__section-eyebrow">
                  Información clave
                </p>
                <h3 className="activity-detail-modal__section-title">
                  Evalúa si encaja
                </h3>
              </div>

              <dl className="activity-detail-modal__facts-grid">
                {evaluationItems.map(({ key, label, value, icon: Icon, tone }) => (
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
                ))}
              </dl>
            </section>

            {locationItems.length > 0 ? (
              <section className="activity-detail-modal__section">
                <div className="activity-detail-modal__section-head">
                  <p className="activity-detail-modal__section-eyebrow">
                    Ubicación
                  </p>
                  <h3 className="activity-detail-modal__section-title">
                    Referencia práctica
                  </h3>
                </div>

                <dl className="activity-detail-modal__facts-grid activity-detail-modal__facts-grid--location">
                  {locationItems.map(({ key, label, value, icon: Icon }) => (
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
                <p className="activity-detail-modal__section-eyebrow">Acción principal</p>
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
