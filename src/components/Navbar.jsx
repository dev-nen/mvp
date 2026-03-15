import { useState } from 'react'
import { Search, Heart, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import './Navbar.css'

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <header className="navbar">
      <div className="page-container navbar__bar">
        <div className="navbar__brand">
          <div className="navbar__brand-mark">
            <span>IK</span>
          </div>
          <span className="navbar__brand-name">InfoKids</span>
        </div>

        <div className="navbar__actions">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Buscar"
          >
            {isSearchOpen ? <X /> : <Search />}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Favoritos">
            <Heart />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Perfil">
            <User />
          </Button>
        </div>
      </div>

      {isSearchOpen && (
        <div className="page-container navbar__search-panel">
          <Input
            type="search"
            placeholder="Buscar actividades..."
            className="navbar__search-input"
            autoFocus
          />
        </div>
      )}
    </header>
  )
}
