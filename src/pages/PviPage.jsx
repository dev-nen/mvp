import { BarChart3, Shield } from "lucide-react";
import { Footer } from "@/components/Footer";
import { Navbar } from "@/components/Navbar";
import { CatalogState } from "@/components/states/CatalogState";
import { Card, CardContent } from "@/components/ui/card";
import "./PviPage.css";

export function PviPage() {
  return (
    <div className="pvi-page">
      <Navbar />

      <main className="pvi-page__main">
        <div className="page-container pvi-page__container">
          <header className="pvi-page__header">
            <p className="pvi-page__eyebrow">Uso interno | MVP 1</p>
            <h1 className="pvi-page__title">PVI interno no operativo</h1>
            <p className="pvi-page__description">
              En esta fase la app publica ya no lee analitica desde el navegador.
              El reporting real se sirve por un path interno privado para PO y DEV.
            </p>
          </header>

          <CatalogState
            icon={BarChart3}
            eyebrow="Internal only"
            title="Este panel ya no consulta metricas desde el browser"
            description="La lectura real de views y contacts se expone solo desde /api/internal/pvi con credenciales internas."
          />

          <Card>
            <CardContent className="pvi-page__metric-card">
              <div className="pvi-page__metric-icon-wrap" aria-hidden="true">
                <Shield className="pvi-page__metric-icon" />
              </div>
              <p className="pvi-page__metric-label">Ruta prevista</p>
              <p className="pvi-page__metric-value">/api/internal/pvi</p>
              <p className="pvi-page__metric-description">
                Endpoint privado para reporting de PO y DEV. Requiere token interno
                y usa service role en servidor.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
