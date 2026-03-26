import { Card, CardContent } from "@/components/ui/card";

const VALUE_PROPS = [
  {
    title: "Extraescolares",
    description:
      "Opciones semanales para deporte, arte, idiomas y apoyo escolar.",
  },
  {
    title: "Talleres y actividades puntuales",
    description:
      "Propuestas para probar algo nuevo entre semana, el fin de semana o en vacaciones.",
  },
  {
    title: "Deportes y movimiento",
    description:
      "Escuelas, clases y actividades para jugar, moverse y ganar autonomia.",
  },
  {
    title: "Cultura y planes en familia",
    description:
      "Teatro, museos, actividades creativas y propuestas para disfrutar juntos.",
  },
];

export function LandingValueProps() {
  return (
    <section className="landing-section">
      <div className="landing-section__header">
        <p className="landing-section__eyebrow">TIPOS DE ACTIVIDADES</p>
        <h2 className="landing-section__title">Que puedes encontrar</h2>
        <p className="landing-section__description">
          Una forma mas clara de descubrir propuestas para el dia a dia y para
          momentos especiales.
        </p>
      </div>

      <div className="landing-value-props">
        {VALUE_PROPS.map((valueProp) => (
          <Card key={valueProp.title}>
            <CardContent className="landing-value-props__card">
              <h3 className="landing-value-props__title">{valueProp.title}</h3>
              <p className="landing-value-props__description">
                {valueProp.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}
