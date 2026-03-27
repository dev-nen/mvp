import { Navigate, Route, Routes } from "react-router-dom";
import { FavoriteActivityDetailPage } from "@/pages/FavoriteActivityDetailPage";
import { FavoritesPage } from "@/pages/FavoritesPage";
import { HomePage } from "@/pages/HomePage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { PviPage } from "@/pages/PviPage";
import { ProfilePage } from "@/pages/ProfilePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/pvi" element={<PviPage />} />
      <Route path="/perfil" element={<ProfilePage />} />
      <Route path="/favoritos" element={<FavoritesPage />} />
      <Route
        path="/favoritos/:activityId"
        element={<FavoriteActivityDetailPage />}
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
  );
}
