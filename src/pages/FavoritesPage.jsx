import { useMemo } from "react";
import { AlertTriangle, Heart, SearchX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import {
  CatalogActivityCard,
  CatalogActivityCardPlaceholder,
} from "@/components/catalog/CatalogActivityCard";
import { CatalogState } from "@/components/states/CatalogState";
import { useCatalog } from "@/hooks/useCatalog";
import { useFavorites } from "@/hooks/useFavorites";
import { useI18n } from "@/i18n/useI18n";
import "./FavoritesPage.css";

export function FavoritesPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { activities, isLoading, error, reload } = useCatalog();
  const {
    favoriteIds,
    isFavorite,
    toggleFavorite,
    isLoading: isFavoritesLoading,
    error: favoritesError,
  } = useFavorites();

  const favoriteActivities = useMemo(() => {
    const activitiesById = new Map(
      activities.map((activity) => [String(activity.id), activity]),
    );

    return favoriteIds
      .map((favoriteId) => activitiesById.get(favoriteId))
      .filter(Boolean);
  }, [activities, favoriteIds]);

  const hasNoSavedFavorites = favoriteIds.length === 0;
  const hasUnresolvableFavorites =
    !hasNoSavedFavorites && favoriteActivities.length === 0;
  const isPageLoading = isLoading || isFavoritesLoading;
  const resolvedError = error || favoritesError;
  const placeholderCount = favoriteIds.length > 0 ? favoriteIds.length : 2;

  const handleToggleFavorite = (activity) => {
    void toggleFavorite(activity.id);
  };

  return (
    <div className="favorites-page">
      <main className="favorites-page__main">
        <div className="page-container favorites-page__container">
          <header className="favorites-page__header">
            <div className="favorites-page__copy">
              <h2 className="favorites-page__title">{t("favorites.title")}</h2>
              <p className="favorites-page__description">
                {t("favorites.description")}
              </p>
            </div>
          </header>

          {isPageLoading ? (
            <section className="favorites-page__section" aria-hidden="true">
              <div className="favorites-page__grid">
                {Array.from({ length: placeholderCount }).map((_, index) => (
                  <CatalogActivityCardPlaceholder
                    key={`favorites-placeholder-${index}`}
                  />
                ))}
              </div>
            </section>
          ) : resolvedError ? (
            <CatalogState
              icon={AlertTriangle}
              title={t("favorites.loadErrorTitle")}
              description={resolvedError}
              actionLabel={t("home.retry")}
              onAction={reload}
            />
          ) : hasNoSavedFavorites ? (
            <CatalogState
              icon={Heart}
              title={t("favorites.noSavedTitle")}
              description={t("favorites.noSavedDescription")}
              actionLabel={t("favorites.backHome")}
              onAction={() => navigate("/")}
            />
          ) : hasUnresolvableFavorites ? (
            <CatalogState
              icon={SearchX}
              title={t("favorites.unavailableTitle")}
              description={t("favorites.unavailableDescription")}
              actionLabel={t("favorites.explore")}
              onAction={() => navigate("/")}
            />
          ) : (
            <section className="favorites-page__section" aria-live="polite">
              <div className="favorites-page__grid">
                {favoriteActivities.map((activity) => (
                  <CatalogActivityCard
                    key={activity.id}
                    activity={activity}
                    isFavorite={isFavorite(activity.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onViewMore={() => navigate(`/favoritos/${activity.id}`)}
                    viewMoreLabel={t("catalog.card.fullCard")}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
}
