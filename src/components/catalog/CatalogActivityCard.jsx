import {
  ArrowRight,
  Building2,
  Clock3,
  Heart,
  MapPin,
  Share2,
  Users,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatActivityAgeLabel,
  formatActivityLocationLabel,
} from "@/helpers/activityPresentation";
import { useI18n } from "@/i18n/useI18n";
import "./CatalogActivityCard.css";

const PUBLIC_CATALOG_CARD_PLACEHOLDER_SRC =
  "/placeholders/activity-card-placeholder.svg";

const DEFAULT_CARD_COPY = {
  allAges: "Para todas las edades",
  ageRange: "{min} a {max} años",
  ageFrom: "Desde {min} años",
  ageUntil: "Hasta {max} años",
  consultAge: "Consulta la edad",
};

function getTrimmedText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isValidAgeNumber(value) {
  return typeof value === "number" && Number.isFinite(value);
}

function formatPublicActivityAgeLabel(
  { age_rule_type, age_min, age_max },
  copy = DEFAULT_CARD_COPY,
) {
  if (age_rule_type === "range") {
    return isValidAgeNumber(age_min) && isValidAgeNumber(age_max)
      ? copy.ageRange.replace("{min}", age_min).replace("{max}", age_max)
      : "";
  }

  if (age_rule_type === "from") {
    return isValidAgeNumber(age_min) ? copy.ageFrom.replace("{min}", age_min) : "";
  }

  if (age_rule_type === "until") {
    return isValidAgeNumber(age_max) ? copy.ageUntil.replace("{max}", age_max) : "";
  }

  if (age_rule_type === "all" || age_rule_type === "open") {
    return copy.allAges;
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

async function sharePublicActivity(activity, copy) {
  if (typeof window === "undefined") {
    return;
  }

  const title = getTrimmedText(activity?.title) || copy.shareTitle;
  const shareUrl = new URL("/", window.location.origin);

  if (activity?.id) {
    shareUrl.searchParams.set("actividad", String(activity.id));
  }

  const sharePayload = {
    title,
    text: copy.shareText.replace("{title}", title),
    url: shareUrl.toString(),
  };

  if (navigator.share) {
    await navigator.share(sharePayload);
    return;
  }

  await navigator.clipboard?.writeText(sharePayload.url);
}

export function buildPublicCatalogCardViewModel(
  activity = {},
  copy = DEFAULT_CARD_COPY,
) {
  const title = getTrimmedText(activity.title);
  const imageUrl = getTrimmedText(activity.image_url);
  const categoryLabel = getTrimmedText(activity.category_label);
  const centerLabel = getTrimmedText(activity.center_name);
  const cityLabel = getTrimmedText(activity.city_name);
  const ageLabel = formatPublicActivityAgeLabel(activity, copy);

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
  viewMoreLabel,
  variant = "default",
}) {
  const { t } = useI18n();
  const ageCopy = {
    allAges: t("catalog.card.allAges"),
    ageRange: t("catalog.card.ageRange"),
    ageFrom: t("catalog.card.ageFrom"),
    ageUntil: t("catalog.card.ageUntil"),
    consultAge: t("catalog.card.consultAge"),
  };
  const resolvedViewMoreLabel = viewMoreLabel || t("catalog.card.viewMore");

  if (variant === "public") {
    const viewModel = buildPublicCatalogCardViewModel(activity, ageCopy);
    const isPlaceholderImage =
      viewModel.imageSrc === PUBLIC_CATALOG_CARD_PLACEHOLDER_SRC;
    const publicMetaLabel = [viewModel.ageLabel, viewModel.cityLabel]
      .filter(Boolean)
      .join(" · ");

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
              isFavorite
                ? t("catalog.card.removeFavorite")
                : t("catalog.card.addFavorite")
            }
          >
            <Heart
              className={`catalog-card__favorite-icon ${
                isFavorite ? "catalog-card__favorite-icon--filled" : ""
              }`}
            />
          </Button>

          {viewModel.showFreeBadge ? (
            <span className="catalog-card__free-badge">
              {t("catalog.card.free")}
            </span>
          ) : null}

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="catalog-card__share catalog-card__share--public"
            onClick={() => {
              void sharePublicActivity(activity, {
                shareTitle: t("catalog.card.shareTitle"),
                shareText: t("catalog.card.shareText"),
              }).catch(() => {});
            }}
            aria-label={t("catalog.card.share")}
          >
            <Share2 />
          </Button>
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
            {publicMetaLabel ? (
              <p className="catalog-card__public-meta">{publicMetaLabel}</p>
            ) : null}
            {viewModel.centerLabel ? (
              <p className="catalog-card__public-center">
                {viewModel.centerLabel}
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
            {t("catalog.card.viewMore")}
            <ArrowRight />
          </Button>
        </CardContent>
      </Card>
    );
  }

  const resolvedImageSrc =
    getTrimmedText(activity.image_url) || PUBLIC_CATALOG_CARD_PLACEHOLDER_SRC;
  const isPlaceholderImage =
    resolvedImageSrc === PUBLIC_CATALOG_CARD_PLACEHOLDER_SRC;

  return (
    <Card className="catalog-card">
      <div className="catalog-card__media">
        <img
          src={resolvedImageSrc}
          alt={activity.title}
          className="catalog-card__image"
          data-placeholder-applied={isPlaceholderImage ? "true" : "false"}
          onError={handlePublicCardImageError}
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
            isFavorite
              ? t("catalog.card.removeFavorite")
              : t("catalog.card.addFavorite")
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
                {formatActivityLocationLabel(activity, {
                  consultLocation: t("catalog.card.consultLocation"),
                })}
              </span>
            </div>

            <div className="catalog-card__fact-inline catalog-card__fact-inline--age">
              <Users className="catalog-card__fact-icon" />
              <span className="catalog-card__fact-inline-text">
                {formatActivityAgeLabel(activity, ageCopy)}
              </span>
            </div>
          </div>

          <div className="catalog-card__fact catalog-card__fact--boxed">
            <Clock3 className="catalog-card__fact-icon" />
            <div className="catalog-card__fact-body">
              <span className="catalog-card__fact-label">
                {t("catalog.card.schedule")}
              </span>
              <span className="catalog-card__fact-value">
                {activity.schedule_label || t("catalog.card.consultSchedule")}
              </span>
            </div>
          </div>

          <div className="catalog-card__fact catalog-card__fact--boxed catalog-card__fact--price">
            <Wallet className="catalog-card__fact-icon" />
            <div className="catalog-card__fact-body">
              <span className="catalog-card__fact-value">
                {activity.price_label || t("catalog.card.consultPrice")}
              </span>
            </div>
          </div>

          <div className="catalog-card__fact catalog-card__fact--center">
            <Building2 className="catalog-card__fact-icon" />
            <span className="catalog-card__fact-text">
              {activity.center_name || t("catalog.card.consultCenter")}
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
          {resolvedViewMoreLabel}
          <ArrowRight />
        </Button>
      </CardContent>
    </Card>
  );
}

export function CatalogActivityCardPlaceholder({ variant = "default" }) {
  const isPublic = variant === "public";

  return (
    <Card
      className={`catalog-card catalog-card--placeholder ${
        isPublic ? "catalog-card--placeholder-public" : ""
      }`}
      aria-hidden="true"
    >
      <div
        className={`catalog-card__media catalog-card__placeholder-media ${
          isPublic ? "catalog-card__media--public" : ""
        }`}
      >
        <div className="catalog-card__placeholder-block catalog-card__placeholder-block--image" />
      </div>

      <CardContent
        className={`catalog-card__content ${
          isPublic ? "catalog-card__content--public" : ""
        }`}
      >
        <div className="catalog-card__header">
          <div className="catalog-card__placeholder-line catalog-card__placeholder-line--eyebrow" />
          <div className="catalog-card__placeholder-line catalog-card__placeholder-line--title" />
          <div className="catalog-card__placeholder-line catalog-card__placeholder-line--title-short" />
        </div>

        {isPublic ? (
          <div className="catalog-card__public-summary">
            <div className="catalog-card__placeholder-line catalog-card__placeholder-line--body" />
            <div className="catalog-card__placeholder-line catalog-card__placeholder-line--body-short" />
            <div className="catalog-card__placeholder-line catalog-card__placeholder-line--body-short" />
          </div>
        ) : (
          <div className="catalog-card__facts">
            <div className="catalog-card__placeholder-line catalog-card__placeholder-line--body" />
            <div className="catalog-card__placeholder-line catalog-card__placeholder-line--body-short" />
            <div className="catalog-card__placeholder-line catalog-card__placeholder-line--body-short" />
          </div>
        )}

        <div className="catalog-card__placeholder-cta" />
      </CardContent>
    </Card>
  );
}
