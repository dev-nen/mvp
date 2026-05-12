import { useState } from "react";
import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/i18n/useI18n";

const FILTER_SECTIONS = [
  { id: "search", labelKey: "catalog.toolbar.search" },
  { id: "area", labelKey: "catalog.toolbar.area" },
  { id: "categories", labelKey: "catalog.toolbar.categories" },
];

export function CatalogToolbar({
  searchQuery,
  onSearchQueryChange,
  areaOptions,
  selectedAreaKey,
  onSelectedAreaKeyChange,
  categoryLabelOptions,
  selectedCategoryLabels,
  onToggleCategoryLabel,
  onClearFilters,
}) {
  const { t } = useI18n();
  const [openSections, setOpenSections] = useState({
    search: true,
    area: false,
    categories: false,
  });
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    String(selectedAreaKey).length > 0 ||
    selectedCategoryLabels.length > 0;
  const selectedAreaName =
    areaOptions.find((areaOption) => areaOption.key === selectedAreaKey)?.label ||
    t("catalog.toolbar.all");
  const selectedCategorySummary =
    selectedCategoryLabels.length === 0
      ? ""
      : selectedCategoryLabels.length === 1
        ? t("catalog.toolbar.categorySelectedOne")
        : t("catalog.toolbar.categorySelectedMany", {
            count: selectedCategoryLabels.length,
          });

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
          <p className="catalog-toolbar__intro">{t("catalog.toolbar.intro")}</p>
          {hasActiveFilters ? (
            <Button variant="outline" onClick={onClearFilters}>
              {t("catalog.toolbar.clear")}
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
                    {t(section.labelKey)}
                  </span>
                  <span className="catalog-toolbar__section-summary">
                    {section.id === "search" && searchQuery
                      ? searchQuery
                      : section.id === "area"
                        ? selectedAreaName
                        : section.id === "categories"
                          ? selectedCategorySummary
                          : ""}
                  </span>
                  <ChevronDown className="catalog-toolbar__section-icon" />
                </button>

                {isOpen ? (
                  <div id={panelId} className="catalog-toolbar__section-panel">
                    {section.id === "search" ? (
                      <div className="catalog-toolbar__search-field">
                        <Search className="catalog-toolbar__search-icon" />
                        <Input
                          type="search"
                          aria-label={t("catalog.toolbar.searchAria")}
                          placeholder={t("catalog.toolbar.searchPlaceholder")}
                          value={searchQuery}
                          onChange={(event) =>
                            onSearchQueryChange(event.target.value)
                          }
                          className="catalog-toolbar__input"
                        />
                      </div>
                    ) : null}

                    {section.id === "area" ? (
                      <label className="catalog-toolbar__select-field">
                        <span className="catalog-toolbar__control-label">
                          {t("catalog.toolbar.area")}
                        </span>
                        <select
                          className="catalog-toolbar__select"
                          value={selectedAreaKey}
                          onChange={(event) =>
                            onSelectedAreaKeyChange(event.target.value)
                          }
                        >
                          <option value="">{t("catalog.toolbar.all")}</option>
                          {areaOptions.map((areaOption) => (
                            <option key={areaOption.key} value={areaOption.key}>
                              {areaOption.label}
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
