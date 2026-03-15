import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function EmptyState({ onClearFilters, onChangeLocation }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
        <SearchX className="h-8 w-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold text-foreground mb-2">
        No encontramos actividades para estos filtros
      </h3>
      <p className="text-muted-foreground text-sm mb-6 max-w-xs">
        Prueba a cambiar los filtros o buscar en otra zona cercana
      </p>
      <div className="flex gap-3">
        <Button variant="outline" onClick={onClearFilters}>
          Borrar filtros
        </Button>
        <Button onClick={onChangeLocation}>
          Cambiar zona
        </Button>
      </div>
    </div>
  )
}
