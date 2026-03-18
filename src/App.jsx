import { Navigate, Route, Routes } from "react-router-dom";
import { HomePage } from "@/pages/HomePage";
import { PlaceholderPage } from "@/pages/PlaceholderPage";
import { ProfilePage } from "@/pages/ProfilePage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/perfil" element={<ProfilePage />} />
      <Route
        path="/favoritos"
        element={
          <PlaceholderPage
            title="Favoritos"
            description="Estamos preparando esta pantalla para que puedas volver rápido a las actividades que más te interesan."
          />
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
  );
}
