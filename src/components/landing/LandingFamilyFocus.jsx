import { Card, CardContent } from "@/components/ui/card";

const FAMILY_POINTS = [
  "Descubre actividades sin revisar veinte webs distintas",
  "Compara opciones por ciudad y categoría",
  "Encuentra propuestas que encajan con tu momento familiar",
];

export function LandingFamilyFocus() {
  return (
    <section className="landing-section landing-family-focus">
      <div className="landing-family-focus__copy">
        <p className="landing-section__eyebrow">POR QUÉ NENSGO</p>
        <h2 className="landing-section__title">Pensado para familias</h2>
        <p className="landing-section__description">
          Cuando llegas a una zona nueva o simplemente no sabes por dónde
          empezar, NensGo te ayuda a reunir opciones en un mismo lugar para
          comparar con más calma y decidir mejor.
        </p>
      </div>

      <Card className="landing-family-focus__card">
        <CardContent className="landing-family-focus__card-content">
          <ul className="landing-family-focus__list">
            {FAMILY_POINTS.map((point, index) => (
              <li key={point} className="landing-family-focus__item">
                <span className="landing-family-focus__bullet" aria-hidden="true">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span>{point}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </section>
  );
}
