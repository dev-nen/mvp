import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Navbar } from "@/components/Navbar";
import { RouteLoadingFallback } from "@/components/ui/RouteLoadingFallback";
import { I18nProvider } from "@/i18n/I18nProvider";
import { HomePage } from "@/pages/HomePage";

function lazyNamedPage(importer, exportName) {
  return lazy(() => importer().then((module) => ({ default: module[exportName] })));
}

const AboutPage = lazyNamedPage(() => import("@/pages/AboutPage"), "AboutPage");
const PrivacyPolicyPage = lazyNamedPage(() => import("@/pages/PrivacyPolicyPage"), "PrivacyPolicyPage");
const TermsOfUsePage = lazyNamedPage(() => import("@/pages/TermsOfUsePage"), "TermsOfUsePage");
const MaintenanceLayout = lazyNamedPage(() => import("@/components/auth/MaintenanceLayout"), "MaintenanceLayout");
const MaintenanceRoute = lazyNamedPage(() => import("@/components/auth/MaintenanceRoute"), "MaintenanceRoute");
const MaintenanceLoginPage = lazyNamedPage(() => import("@/pages/MaintenanceLoginPage"), "MaintenanceLoginPage");
const InternalDraftInboxPage = lazyNamedPage(() => import("@/pages/InternalDraftInboxPage"), "InternalDraftInboxPage");
const InternalDraftCreatePage = lazyNamedPage(() => import("@/pages/InternalDraftCreatePage"), "InternalDraftCreatePage");
const InternalDraftDetailPage = lazyNamedPage(() => import("@/pages/InternalDraftDetailPage"), "InternalDraftDetailPage");
const InternalActivityCatalogPage = lazyNamedPage(() => import("@/pages/InternalActivityCatalogPage"), "InternalActivityCatalogPage");
const InternalApprovedActivityPage = lazyNamedPage(() => import("@/pages/InternalApprovedActivityPage"), "InternalApprovedActivityPage");
const InternalJsonImportPage = lazyNamedPage(() => import("@/pages/InternalJsonImportPage"), "InternalJsonImportPage");

function PublicLayout() {
  return <><Navbar /><Suspense fallback={<RouteLoadingFallback />}><Outlet /></Suspense></>;
}

function PrivatePage({ children }) {
  return <MaintenanceRoute>{children}</MaintenanceRoute>;
}

export default function App() {
  return (
    <I18nProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/sobre-nensgo" element={<AboutPage />} />
          <Route path="/privacidad" element={<PrivacyPolicyPage />} />
          <Route path="/terminos" element={<TermsOfUsePage />} />
          <Route path="/para-centros" element={<Navigate to="/sobre-nensgo" replace />} />
        </Route>
        <Route element={<Suspense fallback={<RouteLoadingFallback />}><MaintenanceLayout /></Suspense>}>
          <Route path="/usuario" element={<MaintenanceLoginPage />} />
          <Route path="/internal" element={<Navigate to="/internal/drafts" replace />} />
          <Route path="/internal/drafts" element={<PrivatePage><InternalDraftInboxPage /></PrivatePage>} />
          <Route path="/internal/drafts/new" element={<PrivatePage><InternalDraftCreatePage /></PrivatePage>} />
          <Route path="/internal/drafts/:draftId" element={<PrivatePage><InternalDraftDetailPage /></PrivatePage>} />
          <Route path="/internal/activities" element={<PrivatePage><InternalActivityCatalogPage /></PrivatePage>} />
          <Route path="/internal/activities/:activityId" element={<PrivatePage><InternalApprovedActivityPage /></PrivatePage>} />
          <Route path="/internal/import" element={<PrivatePage><InternalJsonImportPage /></PrivatePage>} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </I18nProvider>
  );
}
