import { Button } from "@/components/ui/button";

export function LandingHero({ onExploreActivities }) {
  return (
    <section className="landing-section landing-hero">
      <div className="landing-hero__panel">
        <p className="landing-section__eyebrow">
          ACTIVIDADES PARA PEQUES Y FAMILIAS
        </p>
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
    </section>
  );
}
