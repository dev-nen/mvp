import { Heart, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import './ActivityCard.css'

const CATEGORY_ICONS = {
  Deportes: '\u26bd',
  Arte: '\u{1f3a8}',
  'Apoyo escolar': '\u{1f4da}',
  Familia: '\u{1f468}\u200d\u{1f469}\u200d\u{1f467}',
  Camps: '\u{1f3d5}\ufe0f',
  Cultura: '\u{1f3ad}',
}

export function ActivityCard({
  id,
  title,
  location,
  ageRange,
  category,
  imageUrl,
  isFavorite = false,
  onToggleFavorite,
  onViewActivity,
}) {
  const categoryIcon = CATEGORY_ICONS[category] || ''

  return (
    <Card className="activity-card">
      <div className="activity-card__media">
        <div className="activity-card__image-frame">
          <img src={imageUrl} alt={title} className="activity-card__image" />
        </div>
        <button
          type="button"
          onClick={() => onToggleFavorite?.(id)}
          className={`activity-card__favorite ${
            isFavorite ? 'activity-card__favorite--active' : ''
          }`}
          aria-label={isFavorite ? 'Quitar de favoritos' : 'Añadir a favoritos'}
        >
          <Heart
            className={`activity-card__favorite-icon ${
              isFavorite ? 'activity-card__favorite-icon--filled' : ''
            }`}
          />
        </button>
      </div>

      <CardContent className="activity-card__content">
        <h3 className="activity-card__title">{title}</h3>

        <div className="activity-card__meta">
          <div className="activity-card__meta-item">
            <MapPin className="activity-card__meta-icon" />
            <span>{location}</span>
          </div>
          <div className="activity-card__meta-item">
            <span className="activity-card__meta-emoji">{'\u{1f476}'}</span>
            <span>{ageRange}</span>
          </div>
          <div className="activity-card__meta-item">
            {categoryIcon && <span className="activity-card__meta-emoji">{categoryIcon}</span>}
            <span>{category}</span>
          </div>
        </div>

        <Button onClick={() => onViewActivity?.(id)} className="activity-card__button">
          Ver actividad
        </Button>
      </CardContent>
    </Card>
  )
}
