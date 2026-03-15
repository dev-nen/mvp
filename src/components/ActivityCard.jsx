import { Heart, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

const CATEGORY_ICONS = {
  'Deportes': '⚽',
  'Arte': '🎨',
  'Apoyo escolar': '📚',
  'Familia': '👨‍👩‍👧',
  'Camps': '🏕️',
  'Cultura': '🎭',
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
    <Card className="overflow-hidden bg-card border-border shadow-sm hover:shadow-lg transition-shadow duration-200">
      <div className="relative">
        <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={title}
            className="w-full h-full object-cover"
          />
        </div>
        <button
          onClick={() => onToggleFavorite?.(id)}
          className={cn(
            "absolute top-3 right-3 w-9 h-9 rounded-full flex items-center justify-center transition-all duration-200",
            "bg-card/90 backdrop-blur-sm shadow-sm hover:scale-110",
            isFavorite ? "text-destructive" : "text-muted-foreground hover:text-destructive"
          )}
          aria-label={isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
        >
          <Heart className={cn("h-5 w-5", isFavorite && "fill-current")} />
        </button>
      </div>
      
      <CardContent className="p-4">
        <h3 className="font-semibold text-foreground text-lg leading-tight mb-3 text-balance">
          {title}
        </h3>
        
        <div className="flex flex-col gap-1.5 mb-4">
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <MapPin className="h-4 w-4 flex-shrink-0 text-primary" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            <span className="text-base">👶</span>
            <span>{ageRange}</span>
          </div>
          <div className="flex items-center gap-1.5 text-muted-foreground text-sm">
            {categoryIcon && <span className="text-base">{categoryIcon}</span>}
            <span>{category}</span>
          </div>
        </div>
        
        <Button
          onClick={() => onViewActivity?.(id)}
          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium"
        >
          Ver actividad
        </Button>
      </CardContent>
    </Card>
  )
}
