import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { LandingBridgeCTA } from "@/components/landing/LandingBridgeCTA";
import { LandingValueProps } from "@/components/landing/LandingValueProps";
import { SeoHead } from "@/components/SeoHead";
import { useI18n } from "@/i18n/useI18n";
import "./AboutPage.css";

export function AboutPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const handleExploreActivities = () => {
    navigate("/#explorar-actividades");
  };

  return (
    <div className="about-page">
      <SeoHead
        title={t("about.seoTitle")}
        description={t("about.seoDescription")}
        canonicalUrl="https://nensgo.com/sobre-nensgo"
      />

      <main className="about-page__main">
        <div className="page-container about-page__container">
          <section className="about-page__hero">
            <div className="about-page__hero-panel">
              <p className="about-page__eyebrow">{t("about.eyebrow")}</p>
              <h1 className="about-page__hero-title">{t("about.title")}</h1>
              <p className="about-page__hero-description">
                {t("about.description")}
              </p>
            </div>
          </section>

          <LandingValueProps quickAccessItems={t("about.quickAccessItems")} />
          <LandingBridgeCTA onExploreActivities={handleExploreActivities} />
        </div>
      </main>

      <Footer />
    </div>
  );
}
