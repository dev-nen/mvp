import { useState } from "react";
import { ChevronDown, Search, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

const FILTER_SECTIONS = [
  { id: "search", label: "Buscar" },
  { id: "city", label: "Ciudad" },
  { id: "categories", label: "Categorías" },
];

export function CatalogToolbar({
  searchQuery,
  onSearchQueryChange,
  cityOptions,
  selectedCityId,
  onSelectedCityIdChange,
  categoryLabelOptions,
  selectedCategoryLabels,
  onToggleCategoryLabel,
  onClearFilters,
}) {
  const [openSections, setOpenSections] = useState({
    search: true,
    city: false,
    categories: false,
  });
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    String(selectedCityId).length > 0 ||
    selectedCategoryLabels.length > 0;
  const selectedCityName =
    cityOptions.find((cityOption) => String(cityOption.city_id) === String(selectedCityId))
      ?.city_name || "Todas";

  const toggleSection = (sectionId) => {
    setOpenSections((currentOpenSections) => ({
      ...currentOpenSections,
      [sectionId]: !currentOpenSections[sectionId],
    }));
  };

  return (
    <Card className="catalog-toolbar-card">
      <CardContent className="catalog-toolbar">
        <div className="catalog-toolbar__topline">
          <p className="catalog-toolbar__intro">
            Encuentra una actividad por nombre, centro, ciudad o categoría.
          </p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={onClearFilters}>
              Limpiar
            </Button>
          ) : null}
        </div>

        <div className="catalog-toolbar__accordion-list">
          {FILTER_SECTIONS.map((section) => {
            const isOpen = openSections[section.id];
            const panelId = `catalog-toolbar-panel-${section.id}`;

            return (
              <section
                key={section.id}
                className={`catalog-toolbar__section ${
                  isOpen ? "catalog-toolbar__section--open" : ""
                }`}
              >
                <button
                  type="button"
                  className="catalog-toolbar__section-trigger"
                  onClick={() => toggleSection(section.id)}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                >
                  <span className="catalog-toolbar__section-label">
                    {section.label}
                  </span>
                  <span className="catalog-toolbar__section-summary">
                    {section.id === "search" && searchQuery
                      ? searchQuery
                      : section.id === "city"
                        ? selectedCityName
                        : section.id === "categories" &&
                            selectedCategoryLabels.length > 0
                          ? `${selectedCategoryLabels.length} seleccionada${
                              selectedCategoryLabels.length > 1 ? "s" : ""
                            }`
                          : ""}
                  </span>
                  <ChevronDown className="catalog-toolbar__section-icon" />
                </button>

                {isOpen ? (
                  <div id={panelId} className="catalog-toolbar__section-panel">
                    {section.id === "search" ? (
                      <label className="catalog-toolbar__search-field">
                        <span className="sr-only">
                          Buscar por actividad, centro, ciudad o categoría
                        </span>
                        <Search className="catalog-toolbar__search-icon" />
                        <Input
                          type="search"
                          placeholder="Buscar por actividad, centro o ciudad"
                          value={searchQuery}
                          onChange={(event) =>
                            onSearchQueryChange(event.target.value)
                          }
                          className="catalog-toolbar__input"
                        />
                        <Sparkles className="catalog-toolbar__spark-icon" />
                      </label>
                    ) : null}

                    {section.id === "city" ? (
                      <label className="catalog-toolbar__select-field">
                        <span className="catalog-toolbar__control-label">
                          Ciudad
                        </span>
                        <select
                          className="catalog-toolbar__select"
                          value={selectedCityId}
                          onChange={(event) =>
                            onSelectedCityIdChange(event.target.value)
                          }
                        >
                          <option value="">Todas</option>
                          {cityOptions.map((cityOption) => (
                            <option
                              key={cityOption.city_id}
                              value={String(cityOption.city_id)}
                            >
                              {cityOption.city_name}
                            </option>
                          ))}
                        </select>
                      </label>
                    ) : null}

                    {section.id === "categories" ? (
                      <div className="catalog-toolbar__chip-group">
                        {categoryLabelOptions.map((categoryLabel) => {
                          const isSelected =
                            selectedCategoryLabels.includes(categoryLabel);

                          return (
                            <Button
                              key={categoryLabel}
                              type="button"
                              variant="ghost"
                              className={`catalog-toolbar__chip ${
                                isSelected ? "catalog-toolbar__chip--active" : ""
                              }`}
                              onClick={() => onToggleCategoryLabel(categoryLabel)}
                            >
                              {categoryLabel}
                            </Button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </section>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
