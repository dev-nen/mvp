import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, SearchX } from "lucide-react";
import { useLocation } from "react-router-dom";
import { Footer } from "@/components/Footer";
import {
  CatalogActivityCard,
  CatalogActivityCardPlaceholder,
  isPublicCatalogActivityValid,
} from "@/components/catalog/CatalogActivityCard";
import { ActivityDetailModal } from "@/components/catalog/ActivityDetailModal";
import { CategoryChips } from "@/components/catalog/CategoryChips";
import { LandingHero } from "@/components/landing/LandingHero";
import { SeoHead } from "@/components/SeoHead";
import { CatalogState } from "@/components/states/CatalogState";
import { getCategoryLabelOptions } from "@/helpers/catalogFilters";
import { useCatalog } from "@/hooks/useCatalog";
import { useI18n } from "@/i18n/useI18n";
import "./HomePage.css";

const HOME_CATALOG_PLACEHOLDER_COUNT = 2;

export function HomePage() {
  const location = useLocation();
  const { t } = useI18n();
  const { activities, isLoading, error, reload } = useCatalog();
  const [selectedCategoryLabels, setSelectedCategoryLabels] = useState([]);
  const [selectedActivity, setSelectedActivity] = useState(null);
  const publicCatalogActivities = useMemo(
    () => activities.filter(isPublicCatalogActivityValid),
    [activities],
  );
  const categoryLabelOptions = useMemo(
    () => getCategoryLabelOptions(publicCatalogActivities),
    [publicCatalogActivities],
  );
  const visibleActivities = useMemo(
    () => publicCatalogActivities.filter(
      (activity) => selectedCategoryLabels.length === 0 ||
        selectedCategoryLabels.includes(activity.category_label),
    ),
    [publicCatalogActivities, selectedCategoryLabels],
  );

  const handleToggleCategoryLabel = (categoryLabel) => {
    setSelectedCategoryLabels((currentLabels) =>
      currentLabels.includes(categoryLabel)
        ? currentLabels.filter((label) => label !== categoryLabel)
        : [...currentLabels, categoryLabel],
    );
  };
  const handleClearCategories = () => setSelectedCategoryLabels([]);
  const handleCloseActivityDetail = useCallback(() => setSelectedActivity(null), []);
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
    return () => window.cancelAnimationFrame(frameId);
  }, [location.hash]);

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
            <CategoryChips
              categoryLabels={categoryLabelOptions}
              selectedLabels={selectedCategoryLabels}
              onToggle={handleToggleCategoryLabel}
              onClear={handleClearCategories}
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
                description={t("home.catalogLoadErrorDescription")}
                actionLabel={t("home.retry")}
                onAction={reload}
              />
            ) : visibleActivities.length === 0 ? (
              <CatalogState
                icon={SearchX}
                title={t("home.emptyTitle")}
                description={t("home.emptyDescription")}
                actionLabel={selectedCategoryLabels.length ? t("home.clearFilters") : undefined}
                onAction={selectedCategoryLabels.length ? handleClearCategories : undefined}
              />
            ) : (
              <div className="home-page__grid">
                {visibleActivities.map((activity) => (
                  <CatalogActivityCard
                    key={activity.id}
                    activity={activity}
                    onViewMore={setSelectedActivity}
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
        onClose={handleCloseActivityDetail}
      />
    </div>
  );
}
