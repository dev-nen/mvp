import { useEffect } from "react";
import {
  AlertTriangle,
  Heart,
  LoaderCircle,
  SearchX,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { ActivityDetailModal } from "@/components/catalog/ActivityDetailModal";
import { CatalogState } from "@/components/states/CatalogState";
import { useCatalog } from "@/hooks/useCatalog";
import { useFavorites } from "@/hooks/useFavorites";
import {
  FAVORITES_DETAIL_SOURCE,
  trackActivityContactClick,
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
    void removeFavorite(activityId);
    navigate("/favoritos");
  };

  const handleContactClick = (selectedActivity, contactOption) => {
    void trackActivityContactClick(
      selectedActivity,
      FAVORITES_DETAIL_SOURCE,
      contactOption,
    );
  };

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activityId]);

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
        title="Cargando la ficha"
        description="Estamos preparando la información completa de esta actividad."
      />
    );
  } else if (error) {
    content = (
      <CatalogState
        icon={AlertTriangle}
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
        title="Esta actividad ya no está disponible"
        description="La actividad sigue guardada, pero no hemos podido recuperarla desde el catálogo actual."
        actionLabel="Volver a favoritos"
        onAction={handleGoBack}
      />
    );
  } else if (!activity) {
    content = (
      <CatalogState
        icon={SearchX}
        title="No encontramos esta actividad"
        description="La ficha que intentas abrir no existe en el catálogo actual. Vuelve a favoritos para seguir revisando tus actividades guardadas."
        actionLabel="Volver a favoritos"
        onAction={handleGoBack}
      />
    );
  } else if (!isSavedFavorite) {
    content = (
      <CatalogState
        icon={Heart}
        title="Esta actividad ya no está en tus favoritos"
        description="Vuelve a tu lista para seguir revisando las actividades que todavía tienes guardadas."
        actionLabel="Volver a favoritos"
        onAction={handleGoBack}
      />
    );
  } else if (activity && isSavedFavorite) {
    content = (
      <ActivityDetailModal
        activity={activity}
        isFavorite
        open
        onClose={handleGoBack}
        onToggleFavorite={handleRemoveFavorite}
        onContactClick={handleContactClick}
      />
    );
  }

  const isModalDetail =
    Boolean(activity) && isSavedFavorite && !isLoading && !error;

  if (isModalDetail) {
    return (
      <div className="favorite-activity-detail favorite-activity-detail--modal-route">
        <main
          className="favorite-activity-detail__modal-route-main"
          aria-hidden="true"
        />
        {content}
      </div>
    );
  }

  return (
    <div className="favorite-activity-detail">
      <main className="favorite-activity-detail__main">
        <div className="page-container favorite-activity-detail__container">
          <header className="favorite-activity-detail__header">
            <button
              type="button"
              className="favorite-activity-detail__back-button"
              onClick={handleGoBack}
            >
              Volver a favoritos
            </button>
          </header>

          {content}
        </div>
      </main>

      <Footer />
    </div>
  );
}
