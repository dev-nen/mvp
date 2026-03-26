export function CatalogHero({ searchQuery }) {
  const hasSearch = searchQuery.trim().length > 0;

  return (
    <section className="catalog-hero">
      <p className="catalog-hero__eyebrow">Catalogo</p>
      <h1 className="catalog-hero__title">Actividades activas para familias</h1>
      <p className="catalog-hero__description">
        Explora actividades activas para peques y familias con una base
        preparada para conectar el catalogo real en la siguiente iteracion.
      </p>

      {hasSearch ? (
        <p className="catalog-hero__search-feedback">
          Buscando resultados para "{searchQuery.trim()}".
        </p>
      ) : null}
    </section>
  );
}
