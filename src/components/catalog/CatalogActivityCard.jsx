import { Building2, Heart, MapPin, Sparkles, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

function formatAgeLabel({ age_rule_type, age_min, age_max }) {
  if (age_rule_type === "open") {
    return "Todas las edades";
  }

  if (typeof age_min === "number" && typeof age_max === "number") {
    return `${age_min}-${age_max} anos`;
  }

  if (typeof age_min === "number") {
    return `Desde ${age_min} anos`;
  }

  if (typeof age_max === "number") {
    return `Hasta ${age_max} anos`;
  }

  return "Consulta la edad";
}

export function CatalogActivityCard({
  activity,
  isFavorite = false,
  onToggleFavorite,
}) {
  return (
    <Card className="catalog-card">
      <div className="catalog-card__media">
        <img
          src={activity.image_url || "/placeholder.jpg"}
          alt={activity.title}
          className="catalog-card__image"
        />

        {activity.is_featured ? (
          <div className="catalog-card__featured-badge">
            <Sparkles />
            Destacada
          </div>
        ) : null}

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
          <h2 className="catalog-card__title">{activity.title}</h2>
        </div>

        <p className="catalog-card__description">{activity.short_description}</p>

        <div className="catalog-card__meta">
          <div className="catalog-card__meta-item">
            <MapPin className="catalog-card__meta-icon" />
            <span>
              {activity.city_name}
              {activity.venue_name ? ` · ${activity.venue_name}` : ""}
            </span>
          </div>

          <div className="catalog-card__meta-item">
            <Users className="catalog-card__meta-icon" />
            <span>{formatAgeLabel(activity)}</span>
          </div>

          <div className="catalog-card__meta-item">
            <Building2 className="catalog-card__meta-icon" />
            <span>{activity.center_name}</span>
          </div>
        </div>

        <div className="catalog-card__details">
          <div className="catalog-card__detail-block">
            <span className="catalog-card__detail-label">Horario</span>
            <span className="catalog-card__detail-value">
              {activity.schedule_label}
            </span>
          </div>
          <div className="catalog-card__detail-block">
            <span className="catalog-card__detail-label">Precio</span>
            <span className="catalog-card__detail-value">
              {activity.price_label}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
