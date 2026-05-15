import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import { InternalToolRoute } from "@/components/auth/InternalToolRoute";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { RouteLoadingFallback } from "@/components/ui/RouteLoadingFallback";
import { AuthProvider } from "@/context/AuthContext";
import { I18nProvider } from "@/i18n/I18nProvider";
import { useI18n } from "@/i18n/useI18n";
import { HomePage } from "@/pages/HomePage";

const OPEN_FAVORITES_INTENT = { type: "open_favorites" };
const OPEN_PROFILE_INTENT = { type: "open_profile" };

function lazyNamedPage(importer, exportName) {
  return lazy(() =>
    importer().then((module) => ({
      default: module[exportName],
    })),
  );
}

const AboutPage = lazyNamedPage(() => import("@/pages/AboutPage"), "AboutPage");
const FavoriteActivityDetailPage = lazyNamedPage(
  () => import("@/pages/FavoriteActivityDetailPage"),
  "FavoriteActivityDetailPage",
);
const FavoritesPage = lazyNamedPage(
  () => import("@/pages/FavoritesPage"),
  "FavoritesPage",
);
const InternalApprovedActivityPage = lazyNamedPage(
  () => import("@/pages/InternalApprovedActivityPage"),
  "InternalApprovedActivityPage",
);
const InternalDraftDetailPage = lazyNamedPage(
  () => import("@/pages/InternalDraftDetailPage"),
  "InternalDraftDetailPage",
);
const InternalDraftCreatePage = lazyNamedPage(
  () => import("@/pages/InternalDraftCreatePage"),
  "InternalDraftCreatePage",
);
const InternalDraftInboxPage = lazyNamedPage(
  () => import("@/pages/InternalDraftInboxPage"),
  "InternalDraftInboxPage",
);
const ParaCentrosPage = lazyNamedPage(
  () => import("@/pages/ParaCentrosPage"),
  "ParaCentrosPage",
);
const PrivacyPolicyPage = lazyNamedPage(
  () => import("@/pages/PrivacyPolicyPage"),
  "PrivacyPolicyPage",
);
const PlaceholderPage = lazyNamedPage(
  () => import("@/pages/PlaceholderPage"),
  "PlaceholderPage",
);
const ProfilePage = lazyNamedPage(
  () => import("@/pages/ProfilePage"),
  "ProfilePage",
);
const TermsOfUsePage = lazyNamedPage(
  () => import("@/pages/TermsOfUsePage"),
  "TermsOfUsePage",
);

function PublicLayout() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<RouteLoadingFallback />}>
        <Outlet />
      </Suspense>
    </>
  );
}

function withRouteLoadingFallback(element) {
  return <Suspense fallback={<RouteLoadingFallback />}>{element}</Suspense>;
}

function AppRoutes() {
  const { t } = useI18n();

  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/sobre-nensgo" element={<AboutPage />} />
          <Route path="/para-centros" element={<ParaCentrosPage />} />
          <Route path="/privacidad" element={<PrivacyPolicyPage />} />
          <Route path="/terminos" element={<TermsOfUsePage />} />
          <Route
            path="/perfil"
            element={
              <ProtectedRoute intent={OPEN_PROFILE_INTENT}>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favoritos"
            element={
              <ProtectedRoute intent={OPEN_FAVORITES_INTENT}>
                <FavoritesPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/favoritos/:activityId"
            element={
              <ProtectedRoute intent={OPEN_FAVORITES_INTENT}>
                <FavoriteActivityDetailPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/soporte"
            element={
              <PlaceholderPage
                title={t("support.title")}
                description={t("support.description")}
              />
            }
          />
        </Route>
        <Route
          path="/internal/drafts"
          element={withRouteLoadingFallback(
            <InternalToolRoute>
              <InternalDraftInboxPage />
            </InternalToolRoute>,
          )}
        />
        <Route
          path="/internal/drafts/new"
          element={withRouteLoadingFallback(
            <InternalToolRoute>
              <InternalDraftCreatePage />
            </InternalToolRoute>,
          )}
        />
        <Route
          path="/internal/drafts/:draftId"
          element={withRouteLoadingFallback(
            <InternalToolRoute>
              <InternalDraftDetailPage />
            </InternalToolRoute>,
          )}
        />
        <Route
          path="/internal/activities/:activityId"
          element={withRouteLoadingFallback(
            <InternalToolRoute>
              <InternalApprovedActivityPage />
            </InternalToolRoute>,
          )}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Analytics />
    </AuthProvider>
  );
}

export default function App() {
  return (
    <I18nProvider>
      <AppRoutes />
    </I18nProvider>
  );
}
