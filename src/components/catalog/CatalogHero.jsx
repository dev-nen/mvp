export function CatalogHero({
  activityCount,
  categoryCount,
  cityCount,
  searchQuery,
}) {
  const hasSearch = searchQuery.trim().length > 0;

  return (
    <section className="catalog-hero">
      <p className="catalog-hero__eyebrow">Catalogo</p>
      <h1 className="catalog-hero__title">Actividades activas para familias</h1>
      <p className="catalog-hero__description">
        Explora actividades activas para peques y familias con una base
        preparada para conectar el catalogo real en la siguiente iteracion.
      </p>

      <div className="catalog-hero__stats" aria-label="Resumen del catalogo">
        <div className="catalog-hero__stat">
          <span className="catalog-hero__stat-value">{activityCount}</span>
          <span className="catalog-hero__stat-label">actividades activas</span>
        </div>
        <div className="catalog-hero__stat">
          <span className="catalog-hero__stat-value">{categoryCount}</span>
          <span className="catalog-hero__stat-label">categorias</span>
        </div>
        <div className="catalog-hero__stat">
          <span className="catalog-hero__stat-value">{cityCount}</span>
          <span className="catalog-hero__stat-label">ciudades</span>
        </div>
      </div>

      {hasSearch ? (
        <p className="catalog-hero__search-feedback">
          Buscando resultados para "{searchQuery.trim()}".
        </p>
      ) : null}
    </section>
  );
}
