import { Button } from "@/components/ui/button";
import { useI18n } from "@/i18n/useI18n";

export function LandingHero({ onExploreActivities }) {
  const { t } = useI18n();

  return (
    <section className="landing-section landing-hero">
      <div className="landing-hero__panel">
        <div className="landing-hero__content">
          <p className="landing-section__eyebrow">
            {t("landingHero.eyebrow")}
          </p>

          <div className="landing-hero__brand-lockup" aria-label="NensGo">
            <img
              className="landing-hero__brand-mark"
              src="/nensgo-navbar-mark.png"
              alt=""
              aria-hidden="true"
              width="128"
              height="116"
            />
            <span className="landing-hero__brand-wordmark">
              <span className="landing-hero__brand-wordmark-nens">Nens</span>
              <span className="landing-hero__brand-wordmark-go">Go</span>
            </span>
          </div>

          <h1 className="landing-hero__title">{t("landingHero.title")}</h1>
          <p className="landing-hero__description">
            {t("landingHero.description")}
          </p>

          <div className="landing-hero__actions">
            <Button onClick={onExploreActivities}>{t("landingHero.cta")}</Button>
          </div>
        </div>

        <figure className="landing-hero__visual" aria-hidden="true">
          <img
            src="/para-centros/kidspainting.webp"
            width="1122"
            height="1402"
            decoding="async"
            alt=""
          />
        </figure>
      </div>
    </section>
  );
}
