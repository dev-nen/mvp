import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { LandingBridgeCTA } from "@/components/landing/LandingBridgeCTA";
import { LandingValueProps } from "@/components/landing/LandingValueProps";
import { Navbar } from "@/components/Navbar";
import "./AboutPage.css";

const ABOUT_QUICK_ACCESS_ITEMS = [
  {
    id: "extraescolares",
    title: "Extraescolares",
    description:
      "Opciones semanales para deporte, arte y apoyo escolar con un solo acceso rápido.",
    targetCategoryLabels: ["Apoyo escolar", "Arte", "Deportes"],
  },
  {
    id: "talleres-puntuales",
    title: "Talleres y actividades puntuales",
    description:
      "Planes para probar algo nuevo entre semana, fines de semana o vacaciones.",
    targetCategoryLabels: ["Arte", "Cultura", "Familia", "Camps"],
  },
  {
    id: "deportes-movimiento",
    title: "Deportes y movimiento",
    description:
      "Escuelas y actividades para moverse, jugar y gastar energía.",
    targetCategoryLabels: ["Deportes"],
  },
  {
    id: "cultura-familia",
    title: "Cultura y planes en familia",
    description:
      "Teatro, museos y propuestas culturales para disfrutar juntos.",
    targetCategoryLabels: ["Cultura", "Familia"],
  },
];

export function AboutPage() {
  const navigate = useNavigate();

  const handleExploreActivities = () => {
    navigate("/");
  };

  return (
    <div className="about-page">
      <Navbar />

      <main className="about-page__main">
        <div className="page-container about-page__container">
          <section className="about-page__hero">
            <div className="about-page__hero-panel">
              <p className="about-page__eyebrow">Sobre NensGo</p>
              <h1 className="about-page__hero-title">Qué es NensGo</h1>
              <p className="about-page__hero-description">
                Una forma más sencilla de encontrar actividades, talleres y
                planes familiares cerca de ti.
              </p>
            </div>
          </section>

          <LandingValueProps quickAccessItems={ABOUT_QUICK_ACCESS_ITEMS} />
          <LandingBridgeCTA onExploreActivities={handleExploreActivities} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
