import './FilterChips.css'

const FILTER_ICONS = {
  Deportes: '\u26bd',
  Arte: '\u{1f3a8}',
  'Apoyo escolar': '\u{1f4da}',
  Familia: '\u{1f468}\u200d\u{1f469}\u200d\u{1f467}',
  Camps: '\u{1f3d5}\ufe0f',
  Cultura: '\u{1f3ad}',
}

export function FilterChips({ filters, selectedFilters, onToggleFilter }) {
  return (
    <div className="filter-chips">
      <div className="filter-chips__list">
        {filters.map((filter) => {
          const isSelected = selectedFilters.includes(filter)
          const icon = FILTER_ICONS[filter] || ''

          return (
            <button
              type="button"
              key={filter}
              onClick={() => onToggleFilter(filter)}
              className={`filter-chip ${isSelected ? 'filter-chip--selected' : ''}`}
            >
              {icon && <span className="filter-chip__icon">{icon}</span>}
              <span className="filter-chip__label">{filter}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
