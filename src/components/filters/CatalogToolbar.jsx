import { Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    String(selectedCityId).length > 0 ||
    selectedCategoryLabels.length > 0;

  return (
    <Card>
      <CardContent className="catalog-toolbar">
        <div className="catalog-toolbar__header">
          <div>
            <p className="catalog-toolbar__eyebrow">Exploracion</p>
            <h2 className="catalog-toolbar__title">Busqueda y filtros</h2>
          </div>

          {hasActiveFilters ? (
            <Button variant="outline" onClick={onClearFilters}>
              Limpiar filtros
            </Button>
          ) : null}
        </div>

        <div className="catalog-toolbar__controls">
          <label className="catalog-toolbar__search">
            <span className="catalog-toolbar__control-label">Buscar</span>
            <div className="catalog-toolbar__search-field">
              <Search className="catalog-toolbar__search-icon" />
              <Input
                type="search"
                placeholder="Buscar por actividad, categoria, centro o ciudad"
                value={searchQuery}
                onChange={(event) => onSearchQueryChange(event.target.value)}
                className="catalog-toolbar__input"
              />
            </div>
          </label>

          <label className="catalog-toolbar__select-field">
            <span className="catalog-toolbar__control-label">Ciudad</span>
            <select
              className="catalog-toolbar__select"
              value={selectedCityId}
              onChange={(event) => onSelectedCityIdChange(event.target.value)}
            >
              <option value="">Todas las ciudades</option>
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
        </div>

        <div className="catalog-toolbar__chip-group">
          <span className="catalog-toolbar__control-label">Categorias</span>
          <div className="catalog-toolbar__chips">
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
        </div>
      </CardContent>
    </Card>
  );
}
