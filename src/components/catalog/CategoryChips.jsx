import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/useI18n";
import "./CategoryChips.css";

export function CategoryChips({ categoryLabels, selectedLabels, onToggle, onClear }) {
  const { t } = useI18n();

  if (categoryLabels.length === 0) {
    return null;
  }

  return (
    <fieldset className="category-chips">
      <legend className="home-page__sr-only">{t("catalog.categories.label")}</legend>
      <Button
        type="button"
        variant="outline"
        className={`category-chips__chip${selectedLabels.length === 0 ? " category-chips__chip--active" : ""}`}
        aria-pressed={selectedLabels.length === 0}
        onClick={onClear}
      >
        {t("catalog.categories.all")}
      </Button>
      {categoryLabels.map((label) => {
        const isSelected = selectedLabels.includes(label);
        return (
          <Button
            key={label}
            type="button"
            variant="outline"
            className={`category-chips__chip${isSelected ? " category-chips__chip--active" : ""}`}
            aria-pressed={isSelected}
            onClick={() => onToggle(label)}
          >
            {label}
          </Button>
        );
      })}
    </fieldset>
  );
}
