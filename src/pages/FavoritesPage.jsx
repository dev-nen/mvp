import { useMemo } from "react";
import { AlertTriangle, Heart, LoaderCircle, SearchX } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { CatalogActivityCard } from "@/components/catalog/CatalogActivityCard";
import { CatalogState } from "@/components/states/CatalogState";
import { useCatalog } from "@/hooks/useCatalog";
import { useFavorites } from "@/hooks/useFavorites";
import {
  CATALOG_MODAL_SOURCE,
  trackActivityFavoriteAdd,
  trackActivityFavoriteRemove,
} from "@/services/activityEventsService";
import "./FavoritesPage.css";

export function FavoritesPage() {
  const navigate = useNavigate();
  const { activities, isLoading, error, reload } = useCatalog();
  const { favoriteIds, isFavorite, toggleFavorite } = useFavorites();

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

  const handleToggleFavorite = (activity) => {
    const nextIsFavorite = !isFavorite(activity.id);

    toggleFavorite(activity.id);

    if (nextIsFavorite) {
      void trackActivityFavoriteAdd(activity, CATALOG_MODAL_SOURCE);
      return;
    }

    void trackActivityFavoriteRemove(activity, CATALOG_MODAL_SOURCE);
  };

  return (
    <div className="favorites-page">
      <Navbar />

      <main className="favorites-page__main">
        <div className="page-container favorites-page__container">
          <header className="favorites-page__header">
            <div className="favorites-page__copy">
              <p className="favorites-page__eyebrow">Favoritos</p>
              <h1 className="favorites-page__title">Tus actividades guardadas</h1>
              <p className="favorites-page__description">
                Revisa con mas calma las actividades que te interesan y abre su
                ficha completa cuando quieras decidir con mas contexto.
              </p>
            </div>

            {!isLoading && !error && !hasNoSavedFavorites && !hasUnresolvableFavorites ? (
              <p className="favorites-page__count">
                {favoriteActivities.length} guardadas
              </p>
            ) : null}
          </header>

          {isLoading ? (
            <CatalogState
              icon={LoaderCircle}
              eyebrow="Favoritos"
              title="Cargando tus favoritas"
              description="Estamos recuperando las actividades que guardaste para que puedas revisarlas con calma."
            />
          ) : error ? (
            <CatalogState
              icon={AlertTriangle}
              eyebrow="Error"
              title="No pudimos cargar tus favoritas"
              description={error}
              actionLabel="Reintentar"
              onAction={reload}
            />
          ) : hasNoSavedFavorites ? (
            <CatalogState
              icon={Heart}
              eyebrow="Sin favoritas"
              title="Todavia no has guardado actividades"
              description="Usa el corazon en el catalogo para recuperar aqui las opciones que quieras revisar mas tarde."
              actionLabel="Volver a Home"
              onAction={() => navigate("/")}
            />
          ) : hasUnresolvableFavorites ? (
            <CatalogState
              icon={SearchX}
              eyebrow="Sin resultados"
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
