import { Construction } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/i18n/useI18n";
import "./PlaceholderPage.css";

export function PlaceholderPage({ title, description }) {
  const navigate = useNavigate();
  const { t } = useI18n();

  return (
    <div className="placeholder-page">
      <main className="placeholder-page__main">
        <div className="page-container placeholder-page__container">
          <Card className="placeholder-page__card">
            <CardContent className="placeholder-page__content">
              <div className="placeholder-page__icon-wrap" aria-hidden="true">
                <Construction className="placeholder-page__icon" />
              </div>
              <h1 className="placeholder-page__title">{title}</h1>
              <p className="placeholder-page__description">{description}</p>
              <p className="placeholder-page__contact">
                {t("support.contactPrefix")}{" "}
                <a
                  className="placeholder-page__contact-link"
                  href="mailto:info@nensgo.com"
                >
                  info@nensgo.com
                </a>
                .
              </p>
              <Button onClick={() => navigate("/perfil")}>
                {t("support.backToProfile")}
              </Button>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
}
