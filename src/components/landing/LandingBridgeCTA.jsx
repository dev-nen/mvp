import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function LandingBridgeCTA({ onExploreActivities }) {
  return (
    <section className="landing-section landing-bridge">
      <Card>
        <CardContent className="landing-bridge__content">
          <p className="landing-section__eyebrow">CATALOGO ACTIVO</p>
          <h2 className="landing-section__title">Empieza a explorar opciones</h2>
          <p className="landing-section__description">
            Baja al catalogo para ver actividades activas, filtrar por ciudad o
            categoria y quedarte con las que mejor encajan con tu familia.
          </p>
          <Button onClick={onExploreActivities}>Explorar actividades</Button>
        </CardContent>
      </Card>
    </section>
  );
}
