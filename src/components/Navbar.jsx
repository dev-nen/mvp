import { useState } from "react";
import { Heart, Search, User, X } from "lucide-react";
import { BrandLockup } from "@/components/branding/BrandLockup";
import { Link, NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "./Navbar.css";

export function Navbar({ enableSearch = false }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const getNavLinkClassName = ({ isActive }) =>
    [
      "button",
      "button--ghost",
      "button--size-icon",
      "navbar__icon-link",
      isActive ? "navbar__icon-link--active" : "",
    ]
      .filter(Boolean)
      .join(" ");

  return (
    <header className="navbar">
      <div className="page-container navbar__bar">
        <Link to="/" className="navbar__brand" aria-label="Ir a la Home">
          <BrandLockup variant="navbar" />
        </Link>

        <div className="navbar__actions">
          {enableSearch ? (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSearchOpen(!isSearchOpen)}
              aria-label={isSearchOpen ? "Cerrar busqueda" : "Buscar"}
            >
              {isSearchOpen ? <X /> : <Search />}
            </Button>
          ) : null}

          <NavLink
            to="/favoritos"
            className={getNavLinkClassName}
            aria-label="Favoritos"
          >
            <Heart />
          </NavLink>
          <NavLink
            to="/perfil"
            className={getNavLinkClassName}
            aria-label="Perfil"
          >
            <User />
          </NavLink>
        </div>
      </div>

      {enableSearch && isSearchOpen ? (
        <div className="page-container navbar__search-panel">
          <Input
            type="search"
            placeholder="Buscar actividades..."
            className="navbar__search-input"
            autoFocus
          />
        </div>
      ) : null}
    </header>
  );
}
