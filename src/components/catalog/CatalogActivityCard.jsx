import { ArrowRight, Building2, Clock3, Heart, MapPin, Users, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  formatActivityAgeLabel,
  formatActivityLocationLabel,
} from "@/helpers/activityPresentation";
import "./CatalogActivityCard.css";

export function CatalogActivityCard({
  activity,
  isFavorite = false,
  onToggleFavorite,
  onViewMore,
  viewMoreLabel = "Ver mas",
}) {
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
          onClick={() => onToggleFavorite?.(activity.id)}
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
