import { useEffect } from "react";
import { AlertTriangle, Heart, LoaderCircle, SearchX } from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { ActivityDetailModal } from "@/components/catalog/ActivityDetailModal";
import { CatalogState } from "@/components/states/CatalogState";
import { getShortUserDisplayName } from "@/helpers/userDisplayName";
import { useCatalog } from "@/hooks/useCatalog";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useI18n } from "@/i18n/useI18n";
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
  const { t } = useI18n();
  const { activityId = "" } = useParams();
  const { appUser, user } = useAuth();
  const { activities, isLoading, error, reload } = useCatalog();
  const { favoriteIds, removeFavorite } = useFavorites();
  const contactRequesterName =
    appUser || user ? getShortUserDisplayName({ appUser, user }) : "";

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
        title={t("favorites.detailLoadingTitle")}
        description={t("favorites.detailLoadingDescription")}
      />
    );
  } else if (error) {
    content = (
      <CatalogState
        icon={AlertTriangle}
        title={t("favorites.detailLoadErrorTitle")}
        description={error}
        actionLabel={t("home.retry")}
        onAction={reload}
      />
    );
  } else if (!activity && isSavedFavorite) {
    content = (
      <CatalogState
        icon={SearchX}
        title={t("favorites.activityUnavailableTitle")}
        description={t("favorites.activityUnavailableDescription")}
        actionLabel={t("favorites.backToFavorites")}
        onAction={handleGoBack}
      />
    );
  } else if (!activity) {
    content = (
      <CatalogState
        icon={SearchX}
        title={t("favorites.activityNotFoundTitle")}
        description={t("favorites.activityNotFoundDescription")}
        actionLabel={t("favorites.backToFavorites")}
        onAction={handleGoBack}
      />
    );
  } else if (!isSavedFavorite) {
    content = (
      <CatalogState
        icon={Heart}
        title={t("favorites.noLongerFavoriteTitle")}
        description={t("favorites.noLongerFavoriteDescription")}
        actionLabel={t("favorites.backToFavorites")}
        onAction={handleGoBack}
      />
    );
  } else if (activity && isSavedFavorite) {
    content = (
      <ActivityDetailModal
        activity={activity}
        contactRequesterName={contactRequesterName}
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
              {t("favorites.backToFavorites")}
            </button>
          </header>

          {content}
        </div>
      </main>

      <Footer />
    </div>
  );
}
