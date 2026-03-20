import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function CatalogState({
  icon: Icon,
  eyebrow,
  title,
  description,
  actionLabel,
  onAction,
}) {
  return (
    <Card className="catalog-state">
      <CardContent className="catalog-state__content">
        {Icon ? (
          <div className="catalog-state__icon-wrap" aria-hidden="true">
            <Icon className="catalog-state__icon" />
          </div>
        ) : null}

        {eyebrow ? <p className="catalog-state__eyebrow">{eyebrow}</p> : null}
        <h2 className="catalog-state__title">{title}</h2>
        <p className="catalog-state__description">{description}</p>

        {actionLabel && onAction ? (
          <Button onClick={onAction}>{actionLabel}</Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
