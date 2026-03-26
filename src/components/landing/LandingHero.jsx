import { Button } from "@/components/ui/button";

export function LandingHero({ onExploreActivities }) {
  return (
    <section className="landing-section landing-hero">
      <div className="landing-hero__panel">
        <p className="landing-section__eyebrow">ACTIVIDADES PARA FAMILIAS</p>
        <h1 className="landing-hero__title">
          Encuentra actividades para peques y familias en un solo lugar
        </h1>
        <p className="landing-hero__description">
          Nendo reune propuestas culturales, deportivas, extraescolares y
          familiares para ayudarte a descubrir que hacer cerca tuyo sin perder
          tiempo buscando en mil sitios.
        </p>

        <div className="landing-hero__actions">
          <Button onClick={onExploreActivities}>Explorar actividades</Button>
        </div>
      </div>
    </section>
  );
}
