import { Card, CardContent } from "@/components/ui/card";

const FAMILY_POINTS = [
  "Descubre actividades sin revisar veinte webs distintas",
  "Compara opciones por ciudad y categoria",
  "Encuentra propuestas que encajen con tu momento familiar",
];

export function LandingFamilyFocus() {
  return (
    <section className="landing-section landing-family-focus">
      <div className="landing-family-focus__copy">
        <p className="landing-section__eyebrow">POR QUE NENDO</p>
        <h2 className="landing-section__title">Pensado para familias</h2>
        <p className="landing-section__description">
          Cuando llegas a una zona nueva, quieres comparar opciones o
          simplemente no sabes por donde empezar, Nendo te ayuda a reunir
          propuestas en un mismo lugar para decidir con mas calma y menos
          vueltas.
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
