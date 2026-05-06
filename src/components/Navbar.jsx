import { useEffect, useState } from "react";
import { Heart, LogIn, Menu, Search, User, X } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { BrandLockup } from "@/components/branding/BrandLockup";
import { PARA_CENTROS_FORM_URL } from "@/constants/paraCentros";
import { getShortUserDisplayName } from "@/helpers/userDisplayName";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import "./Navbar.css";

export function Navbar({ enableSearch = false }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const {
    accessState,
    appUser,
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
  const getTextNavLinkClassName = ({ isActive }) =>
    ["navbar__nav-link", isActive ? "navbar__nav-link--active" : ""]
      .filter(Boolean)
      .join(" ");
  const getHomeLinkClassName = () =>
    [
      "navbar__nav-link",
      location.pathname === "/" && location.hash !== "#explorar-actividades"
        ? "navbar__nav-link--active"
        : "",
    ]
      .filter(Boolean)
      .join(" ");
  const getActivitiesLinkClassName = () =>
    [
      "navbar__nav-link",
      location.pathname === "/" && location.hash === "#explorar-actividades"
        ? "navbar__nav-link--active"
        : "",
    ]
      .filter(Boolean)
      .join(" ");

  const userDisplayName = getShortUserDisplayName({ appUser, user });
  const isReadyAccess = accessState === "ready";
  const isResolvingAccess = isAuthLoading || accessState === "loading_user";
  const accessButtonLabel =
    accessState === "onboarding_required"
      ? "Completa tu perfil"
      : accessState === "verification_pending"
        ? "Verifica tu email"
        : "Acceder";
  const isParaCentrosRoute = location.pathname === "/para-centros";

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleOpenAccessGate = () => {
    closeMenu();
    openAccessGate();
  };

  const scrollToActivities = () => {
    document
      .getElementById("explorar-actividades")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleActivitiesNavigation = (event) => {
    closeMenu();

    if (location.pathname !== "/") {
      return;
    }

    event.preventDefault();
    navigate("/#explorar-actividades", {
      replace: location.hash === "#explorar-actividades",
    });
    window.requestAnimationFrame(scrollToActivities);
  };

  useEffect(() => {
    setIsMenuOpen(false);
    setIsSearchOpen(false);
  }, [location.pathname, location.hash]);

  const renderAuthAction = (className = "") => (
    <div className={["navbar__auth-slot", className].filter(Boolean).join(" ")}>
      {isResolvingAccess ? (
        <div className="navbar__auth-placeholder" aria-hidden="true" />
      ) : isReadyAccess ? (
        <Link
          to="/perfil"
          className="navbar__auth-chip"
          aria-label="Sesion activa. Abrir perfil"
          onClick={closeMenu}
        >
          <span className="navbar__auth-status-dot" aria-hidden="true" />
          <span className="navbar__auth-chip-label">{userDisplayName}</span>
        </Link>
      ) : (
        <Button
          variant="outline"
          className="navbar__auth-button"
          onClick={handleOpenAccessGate}
        >
          <LogIn />
          <span className="navbar__auth-label navbar__auth-label--full">
            {accessButtonLabel}
          </span>
          <span className="navbar__auth-label navbar__auth-label--compact">
            {accessState === "onboarding_required"
              ? "Perfil"
              : accessState === "verification_pending"
                ? "Email"
                : "Entrar"}
          </span>
        </Button>
      )}
    </div>
  );

  const renderProtectedLinks = () => (
    <>
      <NavLink
        to="/favoritos"
        className={getNavLinkClassName}
        aria-label="Favoritos"
        onClick={closeMenu}
      >
        <Heart />
      </NavLink>
      <NavLink
        to="/perfil"
        className={getNavLinkClassName}
        aria-label="Perfil"
        onClick={closeMenu}
      >
        <User />
      </NavLink>
    </>
  );

  return (
    <header className="navbar">
      <div className="page-container navbar__bar">
        <Link
          to="/"
          className="navbar__brand"
          aria-label="NensGo - Inicio"
          onClick={closeMenu}
        >
          <BrandLockup variant="navbar" />
        </Link>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="navbar__menu-toggle"
          onClick={() => setIsMenuOpen((current) => !current)}
          aria-controls="navbar-public-menu"
          aria-expanded={isMenuOpen}
          aria-label={isMenuOpen ? "Cerrar menu" : "Abrir menu"}
        >
          {isMenuOpen ? <X /> : <Menu />}
        </Button>

        <nav
          id="navbar-public-menu"
          className={`navbar__nav${isMenuOpen ? " navbar__nav--open" : ""}`}
          aria-label="Navegacion principal"
        >
          <Link to="/" className={getHomeLinkClassName()} onClick={closeMenu}>
            Inicio
          </Link>
          <Link
            to="/#explorar-actividades"
            className={getActivitiesLinkClassName()}
            onClick={handleActivitiesNavigation}
          >
            Actividades
          </Link>
          <NavLink
            to="/sobre-nensgo"
            className={getTextNavLinkClassName}
            onClick={closeMenu}
          >
            Sobre NensGo
          </NavLink>
          <NavLink
            to="/para-centros"
            className={getTextNavLinkClassName}
            onClick={closeMenu}
          >
            Para centros
          </NavLink>
          <div className="navbar__mobile-actions">
            {isParaCentrosRoute ? (
              <a
                className="navbar__b2b-action"
                href={PARA_CENTROS_FORM_URL}
                target="_blank"
                rel="noreferrer noopener"
                onClick={closeMenu}
              >
                Unirme al proyecto
              </a>
            ) : null}
            {renderAuthAction("navbar__auth-slot--mobile")}
            <div className="navbar__mobile-icon-links">{renderProtectedLinks()}</div>
          </div>
        </nav>

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

          {isParaCentrosRoute ? (
            <a
              className="navbar__b2b-action"
              href={PARA_CENTROS_FORM_URL}
              target="_blank"
              rel="noreferrer noopener"
            >
              Unirme
            </a>
          ) : null}
          {renderAuthAction()}
          {renderProtectedLinks()}
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
