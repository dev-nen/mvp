import { Card, CardContent } from "@/components/ui/card";

function hasExactCategorySet(selectedCategoryLabels, targetCategoryLabels) {
  if (selectedCategoryLabels.length !== targetCategoryLabels.length) {
    return false;
  }

  return targetCategoryLabels.every((categoryLabel) =>
    selectedCategoryLabels.includes(categoryLabel),
  );
}

export function LandingValueProps({
  quickAccessItems = [],
  selectedCategoryLabels = [],
  onQuickAccessSelect,
}) {
  return (
    <section className="landing-section">
      <div className="landing-section__header">
        <p className="landing-section__eyebrow">TIPOS DE ACTIVIDADES</p>
        <h2 className="landing-section__title">Qué puedes encontrar</h2>
        <p className="landing-section__description">
          Una forma más clara de descubrir propuestas para el día a día y para
          momentos especiales.
        </p>
      </div>

      <div className="landing-value-props">
        {quickAccessItems.map((quickAccessItem) => {
          const isActive = hasExactCategorySet(
            selectedCategoryLabels,
            quickAccessItem.targetCategoryLabels,
          );

          return (
            <Card
              key={quickAccessItem.id}
              className={`landing-value-props__item ${
                isActive ? "landing-value-props__item--active" : ""
              }`}
            >
              <CardContent className="landing-value-props__card">
                <button
                  type="button"
                  className="landing-value-props__button"
                  onClick={() =>
                    onQuickAccessSelect?.(quickAccessItem.targetCategoryLabels)
                  }
                  aria-pressed={isActive}
                >
                  <h3 className="landing-value-props__title">
                    {quickAccessItem.title}
                  </h3>
                  <p className="landing-value-props__description">
                    {quickAccessItem.description}
                  </p>
                </button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
