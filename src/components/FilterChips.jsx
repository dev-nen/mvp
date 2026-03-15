import { cn } from '@/lib/utils'

const FILTER_ICONS = {
  'Deportes': '⚽',
  'Arte': '🎨',
  'Apoyo escolar': '📚',
  'Familia': '👨‍👩‍👧',
  'Camps': '🏕️',
  'Cultura': '🎭',
}

export function FilterChips({ filters, selectedFilters, onToggleFilter }) {
  return (
    <div 
      className="flex gap-2 overflow-x-auto -mx-4 px-4" 
      style={{ scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}
    >
      {filters.map((filter) => {
        const isSelected = selectedFilters.includes(filter)
        const icon = FILTER_ICONS[filter] || ''
        return (
          <button
            key={filter}
            onClick={() => onToggleFilter(filter)}
            className={cn(
              "flex-shrink-0 inline-flex items-center gap-1 h-9 px-3 rounded-full text-[13px] font-medium transition-all duration-200",
              "border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
              "active:scale-95",
              isSelected
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-foreground border-border hover:border-primary/40 hover:bg-secondary/50"
            )}
          >
            {icon && <span className="text-sm">{icon}</span>}
            <span className="whitespace-nowrap">{filter}</span>
          </button>
        )
      })}
    </div>
  )
}
