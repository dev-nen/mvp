import { useState } from "react";
import { Heart, LogIn, Search, User, X } from "lucide-react";
import { BrandLockup } from "@/components/branding/BrandLockup";
import { Link, NavLink } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "./Navbar.css";

export function Navbar({ enableSearch = false }) {
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const {
    accessState,
    isAuthLoading,
    openAccessGate,
    user,
  } = useAuth();

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

  const userDisplayName =
    user?.user_metadata?.full_name?.trim() ||
    user?.user_metadata?.name?.trim() ||
    user?.email?.split("@")[0] ||
    "Cuenta activa";
  const isReadyAccess = accessState === "ready";
  const isResolvingAccess =
    isAuthLoading || accessState === "loading_user";
  const accessButtonLabel =
    accessState === "missing_city" ? "Completa tu ciudad" : "Continue with Google";

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

          <div className="navbar__auth-slot">
            {isResolvingAccess ? (
              <div className="navbar__auth-placeholder" aria-hidden="true" />
            ) : isReadyAccess ? (
              <Link
                to="/perfil"
                className="navbar__auth-chip"
                aria-label={`Sesion activa${
                  user?.email ? ` para ${user.email}` : ""
                }`}
              >
                <span className="navbar__auth-status-dot" aria-hidden="true" />
                <span className="navbar__auth-chip-label">{userDisplayName}</span>
              </Link>
            ) : (
              <Button
                variant="outline"
                className="navbar__auth-button"
                onClick={() => openAccessGate()}
              >
                <LogIn />
                <span className="navbar__auth-label navbar__auth-label--full">
                  {accessButtonLabel}
                </span>
                <span className="navbar__auth-label navbar__auth-label--compact">
                  {accessState === "missing_city" ? "Ciudad" : "Google"}
                </span>
              </Button>
            )}
          </div>

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
