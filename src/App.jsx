import { useState, useMemo, useEffect, useRef } from 'react'
import { Navbar } from '@/components/Navbar'
import { LocationSelector } from '@/components/LocationSelector'
import { AppDescription } from '@/components/AppDescription'
import { FilterChips } from '@/components/FilterChips'
import { ActivityCard } from '@/components/ActivityCard'
import { EmptyState } from '@/components/EmptyState'
import { Footer } from '@/components/Footer'

const FILTERS = ['Deportes', 'Arte', 'Apoyo escolar', 'Familia', 'Camps', 'Cultura']

function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState('up')
  const [isAtTop, setIsAtTop] = useState(true)
  const lastScrollY = useRef(0)
  const ticking = useRef(false)

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY
      const direction = scrollY > lastScrollY.current ? 'down' : 'up'
      
      if (direction !== scrollDirection && Math.abs(scrollY - lastScrollY.current) > 10) {
        setScrollDirection(direction)
      }
      
      setIsAtTop(scrollY < 10)
      lastScrollY.current = scrollY > 0 ? scrollY : 0
      ticking.current = false
    }

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection)
        ticking.current = true
      }
    }

    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [scrollDirection])

  return { scrollDirection, isAtTop }
}

const ACTIVITIES = [
  {
    id: '1',
    title: 'Hockey Sitges',
    location: 'Sitges',
    ageRange: '6-12 anos',
    category: 'Deportes',
    imageUrl: '/images/hockey.jpg',
  },
  {
    id: '2',
    title: 'Taller de pintura creativa',
    location: 'Sitges',
    ageRange: '7-12 anos',
    category: 'Arte',
    imageUrl: '/images/painting.jpg',
  },
  {
    id: '3',
    title: 'Clases de natacion',
    location: 'Sitges',
    ageRange: '4-10 anos',
    category: 'Deportes',
    imageUrl: '/images/swimming.jpg',
  },
  {
    id: '4',
    title: 'Apoyo escolar matematicas',
    location: 'Sitges',
    ageRange: '8-14 anos',
    category: 'Apoyo escolar',
    imageUrl: '/images/tutoring.jpg',
  },
  {
    id: '5',
    title: 'Yoga en familia',
    location: 'Sitges',
    ageRange: 'Todas las edades',
    category: 'Familia',
    imageUrl: '/images/yoga.jpg',
  },
  {
    id: '6',
    title: 'Teatro infantil',
    location: 'Sitges',
    ageRange: '6-12 anos',
    category: 'Cultura',
    imageUrl: '/images/theater.jpg',
  },
]

export default function App() {
  const [selectedFilters, setSelectedFilters] = useState([])
  const [favorites, setFavorites] = useState([])
  const [location, setLocation] = useState('Sitges')
  const { scrollDirection, isAtTop } = useScrollDirection()
  const showNavbar = scrollDirection === 'up' || isAtTop

  const filteredActivities = useMemo(() => {
    if (selectedFilters.length === 0) return ACTIVITIES
    return ACTIVITIES.filter((activity) =>
      selectedFilters.includes(activity.category)
    )
  }, [selectedFilters])

  const handleToggleFilter = (filter) => {
    setSelectedFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((f) => f !== filter)
        : [...prev, filter]
    )
  }

  const handleToggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )
  }

  const handleClearFilters = () => {
    setSelectedFilters([])
  }

  const handleSelectLocation = (loc) => {
    setLocation(loc)
  }

  const handleViewActivity = (id) => {
    console.log('View activity:', id)
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Navbar with show/hide animation */}
      <div 
        className={`fixed top-0 left-0 right-0 z-50 transition-transform duration-300 ease-in-out ${
          showNavbar ? 'translate-y-0' : '-translate-y-full'
        }`}
      >
        <Navbar />
      </div>

      {/* Filter Chips - sticky, moves up when navbar hides */}
      <div 
        className={`fixed left-0 right-0 z-40 py-2.5 bg-background border-b border-border shadow-sm transition-all duration-300 ease-in-out ${
          showNavbar ? 'top-14' : 'top-0'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4">
          <FilterChips
            filters={FILTERS}
            selectedFilters={selectedFilters}
            onToggleFilter={handleToggleFilter}
          />
        </div>
      </div>

      {/* Spacer for fixed header */}
      <div className="h-[108px]" />

      <main className="flex-1 pb-6">
        {/* Description & Location Selector */}
        <div className="px-4 pt-3 pb-4 bg-card">
          <div className="max-w-7xl mx-auto flex flex-col gap-4">
            <AppDescription />
            <LocationSelector
              location={location}
              onSelectLocation={handleSelectLocation}
            />
          </div>
        </div>

        {/* Activity List */}
        <div className="px-4 pt-6 max-w-7xl mx-auto">
          {filteredActivities.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredActivities.map((activity) => (
                <ActivityCard
                  key={activity.id}
                  {...activity}
                  isFavorite={favorites.includes(activity.id)}
                  onToggleFavorite={handleToggleFavorite}
                  onViewActivity={handleViewActivity}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              onClearFilters={handleClearFilters}
              onChangeLocation={() => {}}
            />
          )}
        </div>
      </main>

      <Footer />
    </div>
  )
}
