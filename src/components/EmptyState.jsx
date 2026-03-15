import { SearchX } from 'lucide-react'
import { Button } from '@/components/ui/button'
import './EmptyState.css'

export function EmptyState({ onClearFilters, onChangeLocation }) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon-wrap">
        <SearchX className="empty-state__icon" />
      </div>
      <h3 className="empty-state__title">No encontramos actividades para estos filtros</h3>
      <p className="empty-state__description">
        Prueba a cambiar los filtros o buscar en otra zona cercana
      </p>
      <div className="empty-state__actions">
        <Button variant="outline" onClick={onClearFilters}>
          Borrar filtros
        </Button>
        <Button onClick={onChangeLocation}>Cambiar zona</Button>
      </div>
    </div>
  )
}
