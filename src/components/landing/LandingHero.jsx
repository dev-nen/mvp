import { Button } from "@/components/ui/button";

export function LandingHero({ onExploreActivities }) {
  return (
    <section className="landing-section landing-hero">
      <div className="landing-hero__panel">
        <div className="landing-hero__content">
          <p className="landing-section__eyebrow">
            ACTIVIDADES PARA PEQUES Y FAMILIAS
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

          <h1 className="landing-hero__title">
            Descubre actividades para peques y familias en un solo lugar
          </h1>
          <p className="landing-hero__description">
            NensGo reúne actividades culturales, deportivas, extraescolares y
            planes en familia para ayudarte a encontrar opciones cerca de ti sin
            perder tiempo saltando entre webs, redes y mensajes.
          </p>

          <div className="landing-hero__actions">
            <Button onClick={onExploreActivities}>Explorar actividades</Button>
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
