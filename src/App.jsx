import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import { FavoriteActivityDetailPage } from "@/pages/FavoriteActivityDetailPage";
import { FavoritesPage } from "@/pages/FavoritesPage";
import { HomePage } from "@/pages/HomePage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { PviPage } from "@/pages/PviPage";
import { ProfilePage } from "@/pages/ProfilePage";

const OPEN_FAVORITES_INTENT = { type: "open_favorites" };
const OPEN_PROFILE_INTENT = { type: "open_profile" };

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/pvi" element={<PviPage />} />
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
