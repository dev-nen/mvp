import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/useI18n";

export function LandingBridgeCTA({ onExploreActivities }) {
  const { t } = useI18n();

  return (
    <section className="landing-section landing-bridge">
      <Card>
        <CardContent className="landing-bridge__content">
          <h2 className="landing-section__title">{t("landingBridge.title")}</h2>
          <p className="landing-section__description">
            {t("landingBridge.description")}
          </p>
          <Button onClick={onExploreActivities}>{t("landingBridge.cta")}</Button>
        </CardContent>
      </Card>
    </section>
  );
}
