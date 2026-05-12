import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/useI18n";

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
  const { t } = useI18n();
  const isInteractive = typeof onQuickAccessSelect === "function";

  return (
    <section className="landing-section">
      <div className="landing-section__header">
        <p className="landing-section__eyebrow">
          {t("landingValueProps.eyebrow")}
        </p>
        <h2 className="landing-section__title">
          {t("landingValueProps.title")}
        </h2>
        <p className="landing-section__description">
          {t("landingValueProps.description")}
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
                {isInteractive ? (
                  <button
                    type="button"
                    className="landing-value-props__button"
                    onClick={() =>
                      onQuickAccessSelect(quickAccessItem.targetCategoryLabels)
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
                ) : (
                  <div className="landing-value-props__button">
                    <h3 className="landing-value-props__title">
                      {quickAccessItem.title}
                    </h3>
                    <p className="landing-value-props__description">
                      {quickAccessItem.description}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
