import { useEffect, useMemo, useRef, useState } from "react";
import { ActivityCard } from "@/components/ActivityCard";
import { AppDescription } from "@/components/AppDescription";
import { EmptyState } from "@/components/EmptyState";
import { FilterChips } from "@/components/FilterChips";
import { Footer } from "@/components/Footer";
import { LocationSelector } from "@/components/LocationSelector";
import { Navbar } from "@/components/Navbar";
import { MANUAL_CATALOG } from "@/data/manualCatalog";
import "@/App.css";

const FILTERS = [
  "Deportes",
  "Arte",
  "Apoyo escolar",
  "Familia",
  "Camps",
  "Cultura",
];

function useScrollDirection() {
  const [scrollDirection, setScrollDirection] = useState("up");
  const [isAtTop, setIsAtTop] = useState(true);
  const lastScrollY = useRef(0);
  const ticking = useRef(false);

  useEffect(() => {
    const updateScrollDirection = () => {
      const scrollY = window.scrollY;
      const direction = scrollY > lastScrollY.current ? "down" : "up";

      if (
        direction !== scrollDirection &&
        Math.abs(scrollY - lastScrollY.current) > 10
      ) {
        setScrollDirection(direction);
      }

      setIsAtTop(scrollY < 10);
      lastScrollY.current = scrollY > 0 ? scrollY : 0;
      ticking.current = false;
    };

    const onScroll = () => {
      if (!ticking.current) {
        window.requestAnimationFrame(updateScrollDirection);
        ticking.current = true;
      }
    };

    window.addEventListener("scroll", onScroll);

    return () => window.removeEventListener("scroll", onScroll);
  }, [scrollDirection]);

  return { scrollDirection, isAtTop };
}

export function HomePage() {
  const [selectedFilters, setSelectedFilters] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [location, setLocation] = useState("Sitges");
  const { scrollDirection, isAtTop } = useScrollDirection();
  const showNavbar = scrollDirection === "up" || isAtTop;

  const filteredActivities = useMemo(() => {
    if (selectedFilters.length === 0) return MANUAL_CATALOG;

    return MANUAL_CATALOG.filter((activity) =>
      selectedFilters.includes(activity.category),
    );
  }, [selectedFilters]);

  const handleToggleFilter = (filter) => {
    setSelectedFilters((prev) =>
      prev.includes(filter)
        ? prev.filter((item) => item !== filter)
        : [...prev, filter],
    );
  };

  const handleToggleFavorite = (id) => {
    setFavorites((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleClearFilters = () => {
    setSelectedFilters([]);
  };

  const handleSelectLocation = (nextLocation) => {
    setLocation(nextLocation);
  };

  const handleViewActivity = (id) => {
    console.log("View activity:", id);
  };

  return (
    <div className="app-shell">
      <div
        className={`app-header ${showNavbar ? "app-header--visible" : "app-header--hidden"}`}
      >
        <Navbar enableSearch />
      </div>

      <div
        className={`app-filter-bar ${
          showNavbar ? "app-filter-bar--with-navbar" : "app-filter-bar--compact"
        }`}
      >
        <div className="page-container">
          <FilterChips
            filters={FILTERS}
            selectedFilters={selectedFilters}
            onToggleFilter={handleToggleFilter}
          />
        </div>
      </div>

      <div className="app-shell__header-spacer" />

      <main className="app-main">
        <section className="app-intro">
          <div className="page-container app-intro__stack">
            <AppDescription />
            <LocationSelector
              location={location}
              onSelectLocation={handleSelectLocation}
            />
          </div>
        </section>

        <section className="app-results">
          <div className="page-container">
            {filteredActivities.length > 0 ? (
              <div className="app-results__grid">
                {filteredActivities.map((activity) => (
                  <ActivityCard
                    key={activity.id}
                    {...activity}
                    isFavorite={favorites.includes(activity.id)}
                    onToggleFavorite={handleToggleFavorite}
                    onViewActivity={handleViewActivity}
                  />
                ))}
              </div>
            ) : (
              <EmptyState
                onClearFilters={handleClearFilters}
                onChangeLocation={() => {}}
              />
            )}
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
