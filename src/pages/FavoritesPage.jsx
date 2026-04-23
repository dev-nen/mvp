import { useMemo } from "react";
import { AlertTriangle, Heart, SearchX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import {
  CatalogActivityCard,
  CatalogActivityCardPlaceholder,
} from "@/components/catalog/CatalogActivityCard";
import { CatalogState } from "@/components/states/CatalogState";
import { useCatalog } from "@/hooks/useCatalog";
import { useFavorites } from "@/hooks/useFavorites";
import "./FavoritesPage.css";

export function FavoritesPage() {
  const navigate = useNavigate();
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
      <Navbar />

      <main className="favorites-page__main">
        <div className="page-container favorites-page__container">
          <header className="favorites-page__header">
            <div className="favorites-page__copy">
              <h1 className="favorites-page__title">Tus actividades guardadas</h1>
              <p className="favorites-page__description">
                Revisa con mas calma las actividades que te interesan y abre su
                ficha completa cuando quieras decidir con mas contexto.
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
              title="No pudimos cargar tus favoritas"
              description={resolvedError}
              actionLabel="Reintentar"
              onAction={reload}
            />
          ) : hasNoSavedFavorites ? (
            <CatalogState
              icon={Heart}
              title="Todavia no has guardado actividades"
              description="Usa el corazon en el catalogo para recuperar aqui las opciones que quieras revisar mas tarde."
              actionLabel="Volver a Home"
              onAction={() => navigate("/")}
            />
          ) : hasUnresolvableFavorites ? (
            <CatalogState
              icon={SearchX}
              title="Tus favoritas ya no estan disponibles"
              description="Las actividades que habias guardado ya no se pueden recuperar desde el catalogo actual. Vuelve a explorar para guardar nuevas opciones."
              actionLabel="Explorar actividades"
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
                    viewMoreLabel="Ver ficha completa"
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
