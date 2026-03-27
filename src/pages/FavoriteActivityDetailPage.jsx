import { useEffect } from "react";
import { AlertTriangle, ArrowLeft, Heart, LoaderCircle, SearchX } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { ActivityFacts } from "@/components/catalog/ActivityFacts";
import { CatalogState } from "@/components/states/CatalogState";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { buildWhatsappActivityUrl } from "@/helpers/buildWhatsappActivityMessage";
import { getActivityDescription } from "@/helpers/activityPresentation";
import { useCatalog } from "@/hooks/useCatalog";
import { useFavorites } from "@/hooks/useFavorites";
import {
  FAVORITES_DETAIL_SOURCE,
  trackActivityContactClick,
  trackActivityFavoriteRemove,
  trackActivityViewMore,
} from "@/services/activityEventsService";
import "./FavoriteActivityDetailPage.css";

const trackedFavoriteDetailViews = new Set();

export function FavoriteActivityDetailPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { activityId = "" } = useParams();
  const { activities, isLoading, error, reload } = useCatalog();
  const { favoriteIds, removeFavorite } = useFavorites();

  const activity =
    activities.find((item) => String(item.id) === activityId) ?? null;
  const isSavedFavorite = favoriteIds.includes(activityId);

  const handleGoBack = () => {
    navigate("/favoritos");
  };

  const handleRemoveFavorite = () => {
    if (activity) {
      void trackActivityFavoriteRemove(activity, FAVORITES_DETAIL_SOURCE);
    }

    removeFavorite(activityId);
    navigate("/favoritos");
  };

  const handleOpenWhatsapp = () => {
    if (!activity) {
      return;
    }

    void trackActivityContactClick(activity, FAVORITES_DETAIL_SOURCE);
    window.open(buildWhatsappActivityUrl(activity), "_blank", "noopener,noreferrer");
  };

  useEffect(() => {
    if (!activity || !isSavedFavorite) {
      return;
    }

    const trackingKey = `${location.key || location.pathname}:${String(activity.id)}`;

    if (trackedFavoriteDetailViews.has(trackingKey)) {
      return;
    }

    trackedFavoriteDetailViews.add(trackingKey);
    void trackActivityViewMore(activity, FAVORITES_DETAIL_SOURCE);
  }, [activity, isSavedFavorite, location.key, location.pathname]);

  let content = null;

  if (isLoading) {
    content = (
      <CatalogState
        icon={LoaderCircle}
        eyebrow="Favoritos"
        title="Cargando la ficha"
        description="Estamos preparando la informacion completa de esta actividad."
      />
    );
  } else if (error) {
    content = (
      <CatalogState
        icon={AlertTriangle}
        eyebrow="Error"
        title="No pudimos cargar esta actividad"
        description={error}
        actionLabel="Reintentar"
        onAction={reload}
      />
    );
  } else if (!activity && isSavedFavorite) {
    content = (
      <CatalogState
        icon={SearchX}
        eyebrow="No disponible"
        title="Esta actividad ya no esta disponible"
        description="La actividad sigue guardada, pero no hemos podido recuperarla desde el catalogo actual."
        actionLabel="Volver a favoritos"
        onAction={handleGoBack}
      />
    );
  } else if (!activity) {
    content = (
      <CatalogState
        icon={SearchX}
        eyebrow="No encontrada"
        title="No encontramos esta actividad"
        description="La ficha que intentas abrir no existe en el catalogo actual. Vuelve a favoritos para seguir revisando tus actividades guardadas."
        actionLabel="Volver a favoritos"
        onAction={handleGoBack}
      />
    );
  } else if (!isSavedFavorite) {
    content = (
      <CatalogState
        icon={Heart}
        eyebrow="Fuera de favoritos"
        title="Esta actividad ya no esta en tus favoritos"
        description="Vuelve a tu lista para seguir revisando las actividades que todavia tienes guardadas."
        actionLabel="Volver a favoritos"
        onAction={handleGoBack}
      />
    );
  } else {
    content = (
      <>
        <Card className="favorite-activity-detail__hero">
          <div className="favorite-activity-detail__hero-grid">
            <div className="favorite-activity-detail__media">
              <img
                src={activity.image_url || "/placeholder.jpg"}
                alt={activity.title}
                className="favorite-activity-detail__image"
              />
            </div>

            <CardContent className="favorite-activity-detail__hero-content">
              <p className="favorite-activity-detail__category">
                {activity.category_label}
              </p>
              <h1 className="favorite-activity-detail__title">
                {activity.title}
              </h1>
              <p className="favorite-activity-detail__support">
                Si esta actividad te interesa, puedes escribirnos directamente
                para recibir mas informacion.
              </p>

              <ActivityFacts activity={activity} />

              <div className="favorite-activity-detail__actions">
                <Button onClick={handleOpenWhatsapp}>
                  Consultar por WhatsApp
                </Button>
                <Button variant="outline" onClick={handleRemoveFavorite}>
                  Quitar de favoritos
                </Button>
              </div>
            </CardContent>
          </div>
        </Card>

        <Card>
          <CardContent className="favorite-activity-detail__description-card">
            <p className="favorite-activity-detail__description-eyebrow">
              Descripcion
            </p>
            <h2 className="favorite-activity-detail__description-title">
              Lo que necesitas saber
            </h2>
            <p className="favorite-activity-detail__description">
              {getActivityDescription(activity)}
            </p>
          </CardContent>
        </Card>
      </>
    );
  }

  return (
    <div className="favorite-activity-detail">
      <Navbar />

      <main className="favorite-activity-detail__main">
        <div className="page-container favorite-activity-detail__container">
          <header className="favorite-activity-detail__header">
            <Button
              variant="ghost"
              className="favorite-activity-detail__back-button"
              onClick={handleGoBack}
            >
              <ArrowLeft />
              Volver a favoritos
            </Button>
          </header>

          {content}
        </div>
      </main>

      <Footer />
    </div>
  );
}
