import { useMemo, useRef, useState } from "react";
import { AlertTriangle, LoaderCircle, SearchX } from "lucide-react";
import { Footer } from "@/components/Footer";
import { CatalogActivityCard } from "@/components/catalog/CatalogActivityCard";
import { ActivityDetailModal } from "@/components/catalog/ActivityDetailModal";
import { CatalogToolbar } from "@/components/filters/CatalogToolbar";
import { LandingBridgeCTA } from "@/components/landing/LandingBridgeCTA";
import { LandingHero } from "@/components/landing/LandingHero";
import { LandingValueProps } from "@/components/landing/LandingValueProps";
import { Navbar } from "@/components/Navbar";
import { CatalogState } from "@/components/states/CatalogState";
import {
  filterActivities,
  getCategoryLabelOptions,
  getCityOptions,
} from "@/helpers/catalogFilters";
import { searchActivities } from "@/helpers/catalogSearch";
import { useCatalog } from "@/hooks/useCatalog";
import { useFavorites } from "@/hooks/useFavorites";
import {
  CATALOG_MODAL_SOURCE,
  trackActivityContactClick,
  trackActivityViewMore,
} from "@/services/activityEventsService";
import "./HomePage.css";

const HOME_QUICK_ACCESS_ITEMS = [
  {
    id: "extraescolares",
    title: "Extraescolares",
    description:
      "Opciones semanales para deporte, arte y apoyo escolar con un solo acceso rapido.",
    targetCategoryLabels: ["Apoyo escolar", "Arte", "Deportes"],
  },
  {
    id: "talleres-puntuales",
    title: "Talleres y actividades puntuales",
    description:
      "Planes para probar algo nuevo entre semana, fines de semana o vacaciones.",
    targetCategoryLabels: ["Arte", "Cultura", "Familia", "Camps"],
  },
  {
    id: "deportes-movimiento",
    title: "Deportes y movimiento",
    description:
      "Escuelas y actividades para moverse, jugar y gastar energia.",
    targetCategoryLabels: ["Deportes"],
  },
  {
    id: "cultura-familia",
    title: "Cultura y planes en familia",
    description:
      "Teatro, museos y propuestas culturales para disfrutar juntos.",
    targetCategoryLabels: ["Cultura", "Familia"],
  },
];

export function HomePage() {
  const { activities, isLoading, error, reload } = useCatalog();
  const { favoriteIds } = useFavorites();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryLabels, setSelectedCategoryLabels] = useState([]);
  const [selectedCitySlug, setSelectedCitySlug] = useState("");
  const [selectedActivity, setSelectedActivity] = useState(null);
  const catalogSectionRef = useRef(null);

  const categoryLabelOptions = useMemo(
    () => getCategoryLabelOptions(activities),
    [activities],
  );
  const cityOptions = useMemo(() => getCityOptions(activities), [activities]);

  const visibleActivities = useMemo(() => {
    const searchedActivities = searchActivities(activities, searchQuery);

    return filterActivities(searchedActivities, {
      selectedCategoryLabels,
      selectedCitySlug,
    });
  }, [activities, searchQuery, selectedCategoryLabels, selectedCitySlug]);

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
    setSelectedCitySlug("");
  };

  const handleExploreActivities = () => {
    catalogSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleLandingQuickAccessSelect = (targetCategoryLabels) => {
    setSelectedCategoryLabels([...targetCategoryLabels]);
    catalogSectionRef.current?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleOpenActivityDetail = (activity) => {
    setSelectedActivity(activity);
    void trackActivityViewMore(activity, CATALOG_MODAL_SOURCE);
  };

  const handleCatalogModalContactClick = (activity) => {
    void trackActivityContactClick(activity, CATALOG_MODAL_SOURCE);
  };

  return (
    <div className="home-page">
      <Navbar />

      <main className="home-page__main">
        <div className="page-container home-page__container">
          <LandingHero onExploreActivities={handleExploreActivities} />
          <LandingValueProps
            quickAccessItems={HOME_QUICK_ACCESS_ITEMS}
            selectedCategoryLabels={selectedCategoryLabels}
            onQuickAccessSelect={handleLandingQuickAccessSelect}
          />
          <LandingBridgeCTA onExploreActivities={handleExploreActivities} />

          <section
            id="explorar-actividades"
            ref={catalogSectionRef}
            className="home-page__catalog"
            aria-live="polite"
          >
            <div className="home-page__catalog-header">
              <div className="home-page__results-copy">
                <p className="home-page__catalog-eyebrow">TU BUSQUEDA EMPIEZA AQUI</p>
                <h2 className="home-page__results-title">Catalogo de actividades</h2>
                <p className="home-page__results-description">
                  Usa los filtros para acotar por ciudad o categoria y encontrar
                  una opcion que encaje con tu familia.
                </p>
              </div>

              <p className="home-page__results-count">
                {visibleActivities.length} resultados | {favoriteIds.length}{" "}
                favoritos
              </p>
            </div>

            <CatalogToolbar
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              cityOptions={cityOptions}
              selectedCitySlug={selectedCitySlug}
              onSelectedCitySlugChange={setSelectedCitySlug}
              categoryLabelOptions={categoryLabelOptions}
              selectedCategoryLabels={selectedCategoryLabels}
              onToggleCategoryLabel={handleToggleCategoryLabel}
              onClearFilters={handleClearFilters}
            />

            {isLoading ? (
              <CatalogState
                icon={LoaderCircle}
                eyebrow="Cargando"
                title="Preparando el catalogo"
                description="Estamos preparando el catalogo desde la capa de datos temporal desacoplada."
              />
            ) : error ? (
              <CatalogState
                icon={AlertTriangle}
                eyebrow="Error"
                title="No pudimos cargar el catalogo"
                description={error}
                actionLabel="Reintentar"
                onAction={reload}
              />
            ) : visibleActivities.length === 0 ? (
              <CatalogState
                icon={SearchX}
                eyebrow="Sin resultados"
                title="No encontramos actividades para estos filtros"
                description="Prueba a limpiar la busqueda o ajustar la ciudad y las categorias."
                actionLabel="Limpiar filtros"
                onAction={handleClearFilters}
              />
            ) : (
              <div className="home-page__grid">
                {visibleActivities.map((activity) => (
                  <CatalogActivityCard
                    key={activity.id}
                    activity={activity}
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
        open={Boolean(selectedActivity)}
        onClose={() => setSelectedActivity(null)}
        onContactClick={handleCatalogModalContactClick}
      />
    </div>
  );
}
