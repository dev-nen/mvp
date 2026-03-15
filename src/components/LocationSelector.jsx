import { useState, useRef, useEffect } from 'react'
import { MapPin, ChevronDown, Check } from 'lucide-react'
import './LocationSelector.css'

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

  const handleSelect = (nextLocation) => {
    onSelectLocation(nextLocation)
    setIsOpen(false)
  }

  return (
    <div className="location-selector" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`location-selector__trigger ${
          isOpen ? 'location-selector__trigger--open' : ''
        }`}
      >
        <MapPin className="location-selector__icon" />
        <span className="location-selector__label">{location}</span>
        <ChevronDown
          className={`location-selector__chevron ${
            isOpen ? 'location-selector__chevron--open' : ''
          }`}
        />
      </button>

      {isOpen && (
        <div className="location-selector__menu">
          {LOCATIONS.map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => handleSelect(option)}
              className="location-selector__option"
            >
              <span
                className={`location-selector__option-label ${
                  location === option ? 'location-selector__option-label--selected' : ''
                }`}
              >
                {option}
              </span>
              {location === option && <Check className="location-selector__option-check" />}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
