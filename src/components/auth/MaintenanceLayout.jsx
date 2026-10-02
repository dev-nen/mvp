import { useState } from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import { BrandLockup } from "@/components/branding/BrandLockup";
import { CatalogBackupPanel } from "@/components/internal/CatalogBackupPanel";
import { SeoHead } from "@/components/SeoHead";
import { Button } from "@/components/ui/button";
import { MaintenanceAuthProvider } from "@/context/MaintenanceAuthContext";
import { useAuth } from "@/hooks/useAuth";
import { useI18n } from "@/i18n/useI18n";
import "./MaintenanceLayout.css";

function PrivateLayoutContent() {
  const { isMaintenanceOperator, signOut } = useAuth();
  const { t } = useI18n();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [signOutError, setSignOutError] = useState(false);
  async function handleSignOut() {
    setIsSigningOut(true);
    setSignOutError(false);
    try {
      const result = await signOut();
      setSignOutError(Boolean(result?.error));
    } catch { setSignOutError(true); }
    finally { setIsSigningOut(false); }
  }
  return (
    <div className="maintenance-layout">
      <SeoHead title="Administración | NensGo" robots="noindex, nofollow" />
      <header className="maintenance-layout__header page-container">
        <Link to="/" aria-label={t("maintenance.backToSite")}><BrandLockup variant="navbar" /></Link>
        {isMaintenanceOperator && <>
          <nav aria-label={t("maintenance.navigation")}>
            <NavLink to="/internal/drafts">{t("maintenance.drafts")}</NavLink>
            <NavLink to="/internal/activities">{t("maintenance.activities")}</NavLink>
            <NavLink to="/internal/import">{t("maintenance.import")}</NavLink>
          </nav>
          <Button variant="outline" onClick={handleSignOut} disabled={isSigningOut}>{t("maintenance.signOut")}</Button>
        </>}
      </header>
      {signOutError && <p className="page-container" role="alert">{t("maintenance.signOutError")}</p>}
      {isMaintenanceOperator && <div className="page-container"><CatalogBackupPanel /></div>}
      <Outlet />
    </div>
  );
}

export function MaintenanceLayout() {
  return <MaintenanceAuthProvider><PrivateLayoutContent /></MaintenanceAuthProvider>;
}
