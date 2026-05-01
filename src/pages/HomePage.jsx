import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, SearchX } from "lucide-react";
import { Footer } from "@/components/Footer";
import {
  CatalogActivityCard,
  CatalogActivityCardPlaceholder,
  isPublicCatalogActivityValid,
} from "@/components/catalog/CatalogActivityCard";
import { ActivityDetailModal } from "@/components/catalog/ActivityDetailModal";
import { CatalogToolbar } from "@/components/filters/CatalogToolbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { Navbar } from "@/components/Navbar";
import { SeoHead } from "@/components/SeoHead";
import { CatalogState } from "@/components/states/CatalogState";
import {
  filterActivities,
  getCategoryLabelOptions,
  getCityOptions,
} from "@/helpers/catalogFilters";
import { searchActivities } from "@/helpers/catalogSearch";
import { useCatalog } from "@/hooks/useCatalog";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import {
  CATALOG_MODAL_SOURCE,
  trackActivityContactClick,
  trackActivityViewMore,
} from "@/services/activityEventsService";
import "./HomePage.css";

const HOME_CATALOG_PLACEHOLDER_COUNT = 2;

export function HomePage() {
  const { activities, isLoading, error, reload } = useCatalog();
  const { consumeResolvedIntent, resolvedIntent, startProtectedAction } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryLabels, setSelectedCategoryLabels] = useState([]);
  const [selectedCityId, setSelectedCityId] = useState("");
  const [selectedActivity, setSelectedActivity] = useState(null);

  const publicCatalogActivities = useMemo(
    () => activities.filter(isPublicCatalogActivityValid),
    [activities],
  );

  const categoryLabelOptions = useMemo(
    () => getCategoryLabelOptions(publicCatalogActivities),
    [publicCatalogActivities],
  );
  const cityOptions = useMemo(
    () => getCityOptions(publicCatalogActivities),
    [publicCatalogActivities],
  );

  const visibleActivities = useMemo(() => {
    const searchedActivities = searchActivities(
      publicCatalogActivities,
      searchQuery,
    );

    return filterActivities(searchedActivities, {
      selectedCategoryLabels,
      selectedCityId,
    });
  }, [
    publicCatalogActivities,
    searchQuery,
    selectedCategoryLabels,
    selectedCityId,
  ]);

  const handleToggleCategoryLabel = (categoryLabel) => {
    setSelectedCategoryLabels((currentCategoryLabels) =>
      currentCategoryLabels.includes(categoryLabel)
        ? currentCategoryLabels.filter((label) => label !== categoryLabel)
        : [...currentCategoryLabels, categoryLabel],
    );
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategoryLabels([]);
    setSelectedCityId("");
  };

  const handleExploreActivities = () => {
    document
      .getElementById("explorar-actividades")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (isLoading || !resolvedIntent) {
      return;
    }

    const nextSelectedActivity =
      publicCatalogActivities.find(
        (activity) => String(activity.id) === resolvedIntent.activityId,
      ) ?? null;

    if (!nextSelectedActivity) {
      consumeResolvedIntent();
      return;
    }

    if (resolvedIntent.type === "toggle_favorite") {
      void toggleFavorite(nextSelectedActivity.id);
      consumeResolvedIntent();
      return;
    }

    if (resolvedIntent.type !== "view_more") {
      consumeResolvedIntent();
      return;
    }

    setSelectedActivity(nextSelectedActivity);
    void trackActivityViewMore(nextSelectedActivity, CATALOG_MODAL_SOURCE);
    consumeResolvedIntent();
  }, [
    consumeResolvedIntent,
    isLoading,
    publicCatalogActivities,
    resolvedIntent,
    toggleFavorite,
  ]);

  const handleOpenActivityDetail = (activity) => {
    void startProtectedAction({
      type: "view_more",
      activityId: activity.id,
    });
  };

  const handleCatalogModalContactClick = (activity, contactOption) => {
    void trackActivityContactClick(activity, CATALOG_MODAL_SOURCE, contactOption);
  };

  const handleCatalogModalToggleFavorite = (activity) => {
    void toggleFavorite(activity.id);
  };

  const handleCatalogCardToggleFavorite = (activity) => {
    void startProtectedAction({
      type: "toggle_favorite",
      activityId: activity.id,
    });
  };

  return (
    <div className="home-page">
      <SeoHead
        title="NensGo | Actividades para peques y familias cerca de ti"
        description="Descubre actividades culturales, deportivas, extraescolares y planes en familia cerca de ti. Explora opciones por ciudad, categoría y edad."
        canonicalUrl="https://nensgo.com/"
      />
      <Navbar />

      <main className="home-page__main">
        <div className="page-container home-page__container">
          <LandingHero onExploreActivities={handleExploreActivities} />

          <section
            id="explorar-actividades"
            className="home-page__catalog"
            aria-live="polite"
          >
            <div className="home-page__catalog-header">
              <div className="home-page__results-copy">
                <p className="home-page__catalog-kicker">Explorar</p>
                <h2 className="home-page__results-title">Catálogo de actividades</h2>
                <p className="home-page__results-description">
                  Busca por actividad, ciudad o categoría y guarda las opciones
                  que mejor encajen con tu familia.
                </p>
              </div>
            </div>

            <CatalogToolbar
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              cityOptions={cityOptions}
              selectedCityId={selectedCityId}
              onSelectedCityIdChange={setSelectedCityId}
              categoryLabelOptions={categoryLabelOptions}
              selectedCategoryLabels={selectedCategoryLabels}
              onToggleCategoryLabel={handleToggleCategoryLabel}
              onClearFilters={handleClearFilters}
            />

            {isLoading ? (
              <div className="home-page__grid" aria-hidden="true">
                {Array.from({ length: HOME_CATALOG_PLACEHOLDER_COUNT }).map(
                  (_, index) => (
                    <CatalogActivityCardPlaceholder
                      key={`home-placeholder-${index}`}
                      variant="public"
                    />
                  ),
                )}
              </div>
            ) : error ? (
              <CatalogState
                icon={AlertTriangle}
                title="No pudimos cargar el catálogo"
                description={error}
                actionLabel="Reintentar"
                onAction={reload}
              />
            ) : visibleActivities.length === 0 ? (
              <CatalogState
                icon={SearchX}
                title="No encontramos actividades para estos filtros"
                description="Prueba a limpiar la búsqueda o ajustar la ciudad y las categorías."
                actionLabel="Limpiar filtros"
                onAction={handleClearFilters}
              />
            ) : (
              <div className="home-page__grid">
                {visibleActivities.map((activity) => (
                  <CatalogActivityCard
                    key={activity.id}
                    activity={activity}
                    isFavorite={isFavorite(activity.id)}
                    onToggleFavorite={handleCatalogCardToggleFavorite}
                    onViewMore={handleOpenActivityDetail}
                    variant="public"
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </main>

      <Footer />

      <ActivityDetailModal
        activity={selectedActivity}
        isFavorite={selectedActivity ? isFavorite(selectedActivity.id) : false}
        open={Boolean(selectedActivity)}
        onClose={() => setSelectedActivity(null)}
        onContactClick={handleCatalogModalContactClick}
        onToggleFavorite={handleCatalogModalToggleFavorite}
      />
    </div>
  );
}
