import { useState } from 'react'
import { Search, Heart, User, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function Navbar() {
  const [isSearchOpen, setIsSearchOpen] = useState(false)

  return (
    <header className="bg-card border-b border-border">
      <div className="flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-sm">IK</span>
          </div>
          <span className="font-semibold text-foreground text-lg">InfoKids</span>
        </div>
        
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsSearchOpen(!isSearchOpen)}
            aria-label="Buscar"
          >
            {isSearchOpen ? (
              <X className="h-5 w-5" />
            ) : (
              <Search className="h-5 w-5" />
            )}
          </Button>
          <Button variant="ghost" size="icon" aria-label="Favoritos">
            <Heart className="h-5 w-5" />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Perfil">
            <User className="h-5 w-5" />
          </Button>
        </div>
      </div>
      
      {isSearchOpen && (
        <div className="px-4 pb-3 animate-in slide-in-from-top-2 duration-200">
          <Input
            type="search"
            placeholder="Buscar actividades..."
            className="w-full"
            autoFocus
          />
        </div>
      )}
    </header>
  )
}
