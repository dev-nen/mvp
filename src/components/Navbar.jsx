import { useEffect, useState } from "react";
import { Menu, X } from "lucide-react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { BrandLockup } from "@/components/branding/BrandLockup";
import { LanguageSelector } from "@/components/i18n/LanguageSelector";
import { useI18n } from "@/i18n/useI18n";
import { Button } from "@/components/ui/button";
import "./Navbar.css";

export function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const closeMenu = () => setIsMenuOpen(false);
  const getTextNavLinkClassName = ({ isActive }) =>
    ["navbar__nav-link", isActive ? "navbar__nav-link--active" : ""]
      .filter(Boolean)
      .join(" ");

  const handleActivitiesNavigation = (event) => {
    closeMenu();
    if (location.pathname !== "/") {
      return;
    }
    event.preventDefault();
    navigate("/#explorar-actividades", {
      replace: location.hash === "#explorar-actividades",
    });
    window.requestAnimationFrame(() => {
      document
        .getElementById("explorar-actividades")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname, location.hash]);

  useEffect(() => {
    if (!isMenuOpen) {
      return undefined;
    }
    const handleEscape = (event) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isMenuOpen]);

  return (
    <header className="navbar">
      <div className="page-container navbar__bar">
        <Link
          to="/"
          className="navbar__brand"
          aria-label={t("nav.brandHome")}
          onClick={closeMenu}
        >
          <BrandLockup variant="navbar" />
        </Link>
        <nav
          id="navbar-public-menu"
          className={`navbar__nav${isMenuOpen ? " navbar__nav--open" : ""}`}
          aria-label={t("nav.primaryNavigation")}
        >
          <Link
            to="/#explorar-actividades"
            className={`navbar__nav-link${
              location.pathname === "/" ? " navbar__nav-link--active" : ""
            }`}
            onClick={handleActivitiesNavigation}
          >
            {t("nav.activities")}
          </Link>
          <NavLink
            to="/sobre-nensgo"
            className={getTextNavLinkClassName}
            onClick={closeMenu}
          >
            {t("nav.about")}
          </NavLink>
        </nav>
        <div className="navbar__actions">
          <LanguageSelector className="navbar__language-selector" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="navbar__menu-toggle"
            onClick={() => setIsMenuOpen((current) => !current)}
            aria-controls="navbar-public-menu"
            aria-expanded={isMenuOpen}
            aria-label={isMenuOpen ? t("nav.closeMenu") : t("nav.openMenu")}
          >
            {isMenuOpen ? <X /> : <Menu />}
          </Button>
        </div>
      </div>
    </header>
  );
}
