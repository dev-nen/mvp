import { Navigate, Route, Routes } from "react-router-dom";
import { InternalDraftDetailPage } from "@/pages/InternalDraftDetailPage";
import { InternalDraftInboxPage } from "@/pages/InternalDraftInboxPage";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AuthProvider } from "@/context/AuthContext";
import { FavoriteActivityDetailPage } from "@/pages/FavoriteActivityDetailPage";
import { FavoritesPage } from "@/pages/FavoritesPage";
import { HomePage } from "@/pages/HomePage";
import { ParaCentrosPage } from "@/pages/ParaCentrosPage";
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
        <Route path="/para-centros" element={<ParaCentrosPage />} />
        <Route path="/pvi" element={<PviPage />} />
        <Route path="/internal/drafts" element={<InternalDraftInboxPage />} />
        <Route
          path="/internal/drafts/:draftId"
          element={<InternalDraftDetailPage />}
        />
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
