import { ArrowRight, Building2, Clock3, Heart, MapPin, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatActivityAgeLabel,
  formatActivityLocationLabel,
} from "@/helpers/activityPresentation";
import "./CatalogActivityCard.css";

function isValidAgeNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function formatPublicActivityAgeLabel({ age_rule_type, age_min, age_max }) {
  if (age_rule_type === "range") {
    return isValidAgeNumber(age_min) && isValidAgeNumber(age_max)
      ? `${age_min} a ${age_max} años`
      : "";
  }

  if (age_rule_type === "from") {
    return isValidAgeNumber(age_min) ? `Desde ${age_min} años` : "";
  }

  if (age_rule_type === "until") {
    return isValidAgeNumber(age_max) ? `Hasta ${age_max} años` : "";
  }

  if (age_rule_type === "all") {
    return "Para todas las edades";
  }

  return "";
}

export function CatalogActivityCard({
  activity,
  isFavorite = false,
  onToggleFavorite,
  onViewMore,
  viewMoreLabel = "Ver más",
  variant = "default",
}) {
  if (variant === "public") {
    const ageLabel = formatPublicActivityAgeLabel(activity);
    const categoryLabel = activity.category_label;
    const centerLabel = activity.center_name;
    const cityLabel = activity.city_name;

    return (
      <Card className="catalog-card catalog-card--public">
        <div className="catalog-card__media catalog-card__media--public">
          <img
            src={activity.image_url || "/placeholder.jpg"}
            alt={activity.title}
            className="catalog-card__image"
          />

          {activity.is_free === true ? (
            <span className="catalog-card__free-badge">Gratis</span>
          ) : null}
        </div>

        <CardContent className="catalog-card__content catalog-card__content--public">
          <div className="catalog-card__header">
            {categoryLabel ? (
              <p className="catalog-card__category">{categoryLabel}</p>
            ) : null}
            <h3 className="catalog-card__title catalog-card__title--public">
              {activity.title}
            </h3>
          </div>

          <div className="catalog-card__public-summary">
            {ageLabel ? (
              <p className="catalog-card__public-line catalog-card__public-line--age">
                {ageLabel}
              </p>
            ) : null}
            {centerLabel ? (
              <p className="catalog-card__public-line">{centerLabel}</p>
            ) : null}
            {cityLabel ? (
              <p className="catalog-card__public-line catalog-card__public-line--city">
                {cityLabel}
              </p>
            ) : null}
          </div>

          <Button
            type="button"
            variant="outline"
            className="catalog-card__cta catalog-card__cta--public"
            onClick={() => onViewMore?.(activity)}
            disabled={!onViewMore}
          >
            Ver más
            <ArrowRight />
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="catalog-card">
      <div className="catalog-card__media">
        <img
          src={activity.image_url || "/placeholder.jpg"}
          alt={activity.title}
          className="catalog-card__image"
        />

        <Button
          type="button"
          variant="outline"
          size="icon"
          className={`catalog-card__favorite ${
            isFavorite ? "catalog-card__favorite--active" : ""
          }`}
          onClick={() => onToggleFavorite?.(activity)}
          aria-label={
            isFavorite ? "Quitar de favoritos" : "Anadir a favoritos"
          }
        >
          <Heart
            className={`catalog-card__favorite-icon ${
              isFavorite ? "catalog-card__favorite-icon--filled" : ""
            }`}
          />
        </Button>
      </div>

      <CardContent className="catalog-card__content">
        <div className="catalog-card__header">
          <p className="catalog-card__category">{activity.category_label}</p>
          <h3 className="catalog-card__title">{activity.title}</h3>
        </div>

        <div className="catalog-card__facts">
          <div className="catalog-card__facts-row catalog-card__facts-row--primary">
            <div className="catalog-card__fact-inline">
              <MapPin className="catalog-card__fact-icon" />
              <span className="catalog-card__fact-inline-text catalog-card__fact-inline-text--location">
                {formatActivityLocationLabel(activity)}
              </span>
            </div>

            <div className="catalog-card__fact-inline catalog-card__fact-inline--age">
              <Users className="catalog-card__fact-icon" />
              <span className="catalog-card__fact-inline-text">
                {formatActivityAgeLabel(activity)}
              </span>
            </div>
          </div>

          <div className="catalog-card__fact catalog-card__fact--boxed">
            <Clock3 className="catalog-card__fact-icon" />
            <div className="catalog-card__fact-body">
              <span className="catalog-card__fact-label">Horario</span>
              <span className="catalog-card__fact-value">
                {activity.schedule_label || "Consulta el horario"}
              </span>
            </div>
          </div>

          <div className="catalog-card__fact catalog-card__fact--boxed catalog-card__fact--price">
            <Wallet className="catalog-card__fact-icon" />
            <div className="catalog-card__fact-body">
              <span className="catalog-card__fact-value">
                {activity.price_label || "Consulta el precio"}
              </span>
            </div>
          </div>

          <div className="catalog-card__fact catalog-card__fact--center">
            <Building2 className="catalog-card__fact-icon" />
            <span className="catalog-card__fact-text">
              {activity.center_name || "Consulta el centro"}
            </span>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="catalog-card__cta"
          onClick={() => onViewMore?.(activity)}
          disabled={!onViewMore}
        >
          {viewMoreLabel}
          <ArrowRight />
        </Button>
      </CardContent>
    </Card>
  );
}
