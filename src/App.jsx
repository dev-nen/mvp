import { lazy, Suspense } from "react";
import { Navigate, Outlet, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { Navbar } from "@/components/Navbar";
import { RouteLoadingFallback } from "@/components/ui/RouteLoadingFallback";
import { AuthProvider } from "@/context/AuthContext";
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
const InternalDraftInboxPage = lazyNamedPage(
  () => import("@/pages/InternalDraftInboxPage"),
  "InternalDraftInboxPage",
);
const ParaCentrosPage = lazyNamedPage(
  () => import("@/pages/ParaCentrosPage"),
  "ParaCentrosPage",
);
const PlaceholderPage = lazyNamedPage(
  () => import("@/pages/PlaceholderPage"),
  "PlaceholderPage",
);
const ProfilePage = lazyNamedPage(
  () => import("@/pages/ProfilePage"),
  "ProfilePage",
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

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/sobre-nensgo" element={<AboutPage />} />
          <Route path="/para-centros" element={<ParaCentrosPage />} />
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
                title="Soporte"
                description="Estamos terminando este espacio para ayudarte con dudas y gestiones de la cuenta."
              />
            }
          />
        </Route>
        <Route
          path="/internal/drafts"
          element={withRouteLoadingFallback(<InternalDraftInboxPage />)}
        />
        <Route
          path="/internal/drafts/:draftId"
          element={withRouteLoadingFallback(<InternalDraftDetailPage />)}
        />
        <Route
          path="/internal/activities/:activityId"
          element={withRouteLoadingFallback(<InternalApprovedActivityPage />)}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
