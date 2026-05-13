import { useEffect, useMemo, useState } from "react";
import { AlertTriangle, SearchX } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Footer } from "@/components/Footer";
import {
  CatalogActivityCard,
  CatalogActivityCardPlaceholder,
  isPublicCatalogActivityValid,
} from "@/components/catalog/CatalogActivityCard";
import { ActivityDetailModal } from "@/components/catalog/ActivityDetailModal";
import { CatalogToolbar } from "@/components/filters/CatalogToolbar";
import { LandingHero } from "@/components/landing/LandingHero";
import { SeoHead } from "@/components/SeoHead";
import { CatalogState } from "@/components/states/CatalogState";
import {
  filterActivities,
  getCatalogAreaOptions,
  getCategoryLabelOptions,
} from "@/helpers/catalogFilters";
import { searchActivities } from "@/helpers/catalogSearch";
import { getShortUserDisplayName } from "@/helpers/userDisplayName";
import { useCatalog } from "@/hooks/useCatalog";
import { useAuth } from "@/hooks/useAuth";
import { useFavorites } from "@/hooks/useFavorites";
import { useI18n } from "@/i18n/useI18n";
import {
  CATALOG_MODAL_SOURCE,
  trackActivityContactClick,
  trackActivityViewMore,
} from "@/services/activityEventsService";
import "./HomePage.css";

const HOME_CATALOG_PLACEHOLDER_COUNT = 2;

export function HomePage() {
  const location = useLocation();
  const { t } = useI18n();
  const { activities, isLoading, error, reload } = useCatalog();
  const {
    appUser,
    consumeResolvedIntent,
    resolvedIntent,
    startProtectedAction,
    user,
  } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryLabels, setSelectedCategoryLabels] = useState([]);
  const [selectedAreaKey, setSelectedAreaKey] = useState("");
  const [selectedActivity, setSelectedActivity] = useState(null);

  const publicCatalogActivities = useMemo(
    () => activities.filter(isPublicCatalogActivityValid),
    [activities],
  );

  const categoryLabelOptions = useMemo(
    () => getCategoryLabelOptions(publicCatalogActivities),
    [publicCatalogActivities],
  );
  const areaOptions = useMemo(() => getCatalogAreaOptions(), []);
  const contactRequesterName = useMemo(
    () => (appUser || user ? getShortUserDisplayName({ appUser, user }) : ""),
    [appUser, user],
  );

  const visibleActivities = useMemo(() => {
    const searchedActivities = searchActivities(
      publicCatalogActivities,
      searchQuery,
    );

    return filterActivities(searchedActivities, {
      selectedCategoryLabels,
      selectedAreaKey,
    });
  }, [
    publicCatalogActivities,
    searchQuery,
    selectedCategoryLabels,
    selectedAreaKey,
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
    setSelectedAreaKey("");
  };

  const handleExploreActivities = () => {
    document
      .getElementById("explorar-actividades")
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  useEffect(() => {
    if (location.hash !== "#explorar-actividades") {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      document
        .getElementById("explorar-actividades")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [location.hash]);

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
        title={t("home.seoTitle")}
        description={t("home.seoDescription")}
        canonicalUrl="https://nensgo.com/"
      />
      <main className="home-page__main">
        <div className="page-container home-page__container">
          <LandingHero onExploreActivities={handleExploreActivities} />

          <section
            id="explorar-actividades"
            className="home-page__catalog"
            aria-live="polite"
          >
            <h2 className="home-page__sr-only">{t("home.catalogSrTitle")}</h2>

            <CatalogToolbar
              searchQuery={searchQuery}
              onSearchQueryChange={setSearchQuery}
              areaOptions={areaOptions}
              selectedAreaKey={selectedAreaKey}
              onSelectedAreaKeyChange={setSelectedAreaKey}
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
                title={t("home.catalogLoadErrorTitle")}
                description={error}
                actionLabel={t("home.retry")}
                onAction={reload}
              />
            ) : visibleActivities.length === 0 ? (
              <CatalogState
                icon={SearchX}
                title={t("home.emptyTitle")}
                description={t("home.emptyDescription")}
                actionLabel={t("home.clearFilters")}
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
        contactRequesterName={contactRequesterName}
        isFavorite={selectedActivity ? isFavorite(selectedActivity.id) : false}
        open={Boolean(selectedActivity)}
        onClose={() => setSelectedActivity(null)}
        onContactClick={handleCatalogModalContactClick}
        onToggleFavorite={handleCatalogModalToggleFavorite}
      />
    </div>
  );
}
