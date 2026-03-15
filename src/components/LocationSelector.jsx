import { useState, useRef, useEffect } from 'react'
import { MapPin, ChevronDown, Check } from 'lucide-react'

const LOCATIONS = ['Sitges']

export function LocationSelector({ location, onSelectLocation }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleSelect = (loc) => {
    onSelectLocation(loc)
    setIsOpen(false)
  }

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/60 hover:bg-secondary border border-border hover:border-primary/30 transition-all duration-200 group ${
          isOpen ? 'border-primary/30 bg-secondary' : ''
        }`}
      >
        <MapPin className="h-4 w-4 text-primary" />
        <span className="font-medium text-foreground">{location}</span>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 min-w-[140px] bg-card border border-border rounded-lg shadow-lg py-1 z-50">
          {LOCATIONS.map((loc) => (
            <button
              key={loc}
              onClick={() => handleSelect(loc)}
              className="w-full flex items-center justify-between gap-2 px-3 py-2 text-sm hover:bg-secondary transition-colors"
            >
              <span className={location === loc ? 'font-medium text-foreground' : 'text-muted-foreground'}>
                {loc}
              </span>
              {location === loc && <Check className="h-4 w-4 text-primary" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
