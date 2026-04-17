import { ArrowRight, Building2, Clock3, Heart, MapPin, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatActivityAgeLabel,
  formatActivityLocationLabel,
} from "@/helpers/activityPresentation";
import "./CatalogActivityCard.css";

const PUBLIC_CATALOG_CARD_PLACEHOLDER_SRC =
  "/placeholders/activity-card-placeholder.svg";

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidAgeNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function formatPublicActivityAgeLabel({ age_rule_type, age_min, age_max }) {
  if (age_rule_type === "range") {
    return isValidAgeNumber(age_min) && isValidAgeNumber(age_max)
      ? `${age_min} a ${age_max} a\u00f1os`
      : "";
  }

  if (age_rule_type === "from") {
    return isValidAgeNumber(age_min) ? `Desde ${age_min} a\u00f1os` : "";
  }

  if (age_rule_type === "until") {
    return isValidAgeNumber(age_max) ? `Hasta ${age_max} a\u00f1os` : "";
  }

  if (age_rule_type === "all") {
    return "Para todas las edades";
  }

  return "";
}

function handlePublicCardImageError(event) {
  const imageElement = event.currentTarget;

  if (imageElement.dataset.placeholderApplied === "true") {
    return;
  }

  imageElement.dataset.placeholderApplied = "true";
  imageElement.src = PUBLIC_CATALOG_CARD_PLACEHOLDER_SRC;
}

export function buildPublicCatalogCardViewModel(activity = {}) {
  const title = getTrimmedText(activity.title);
  const imageUrl = getTrimmedText(activity.image_url);
  const categoryLabel = getTrimmedText(activity.category_label);
  const centerLabel = getTrimmedText(activity.center_name);
  const cityLabel = getTrimmedText(activity.city_name);
  const ageLabel = formatPublicActivityAgeLabel(activity);

  return {
    ageLabel,
    categoryLabel,
    centerLabel,
    cityLabel,
    imageSrc: imageUrl || PUBLIC_CATALOG_CARD_PLACEHOLDER_SRC,
    showFreeBadge: activity.is_free === true,
    title,
  };
}

export function isPublicCatalogActivityValid(activity) {
  const viewModel = buildPublicCatalogCardViewModel(activity);
  const hasUsefulSignal = Boolean(
    viewModel.ageLabel || viewModel.categoryLabel || viewModel.centerLabel,
  );

  return Boolean(
    viewModel.title &&
      viewModel.cityLabel &&
      viewModel.imageSrc &&
      hasUsefulSignal,
  );
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
    const viewModel = buildPublicCatalogCardViewModel(activity);
    const isPlaceholderImage =
      viewModel.imageSrc === PUBLIC_CATALOG_CARD_PLACEHOLDER_SRC;

    return (
      <Card className="catalog-card catalog-card--public">
        <div className="catalog-card__media catalog-card__media--public">
          <img
            src={viewModel.imageSrc}
            alt={viewModel.title}
            className="catalog-card__image"
            data-placeholder-applied={isPlaceholderImage ? "true" : "false"}
            onError={handlePublicCardImageError}
          />

          <Button
            type="button"
            variant="outline"
            size="icon"
            className={`catalog-card__favorite catalog-card__favorite--public ${
              isFavorite ? "catalog-card__favorite--active" : ""
            }`}
            onClick={() => onToggleFavorite?.(activity)}
            disabled={!onToggleFavorite}
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

          {viewModel.showFreeBadge ? (
            <span className="catalog-card__free-badge">Gratis</span>
          ) : null}
        </div>

        <CardContent className="catalog-card__content catalog-card__content--public">
          <div className="catalog-card__header">
            {viewModel.categoryLabel ? (
              <p className="catalog-card__category">{viewModel.categoryLabel}</p>
            ) : null}
            <h3 className="catalog-card__title catalog-card__title--public">
              {viewModel.title}
            </h3>
          </div>

          <div className="catalog-card__public-summary">
            {viewModel.ageLabel ? (
              <p className="catalog-card__public-line catalog-card__public-line--age">
                {viewModel.ageLabel}
              </p>
            ) : null}
            {viewModel.centerLabel ? (
              <p className="catalog-card__public-line">{viewModel.centerLabel}</p>
            ) : null}
            {viewModel.cityLabel ? (
              <p className="catalog-card__public-line catalog-card__public-line--city">
                {viewModel.cityLabel}
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
          src={activity.image_url || PUBLIC_CATALOG_CARD_PLACEHOLDER_SRC}
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
