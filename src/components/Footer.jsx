import { Link } from "react-router-dom";
import { BrandLockup } from "@/components/branding/BrandLockup";
import { useI18n } from "@/i18n/useI18n";
import "./Footer.css";

export function Footer() {
  const { t } = useI18n();
  const legalLinks = t("footer.legalLinks");

  return (
    <footer className="footer">
      <div className="footer__ribbon" aria-hidden="true" />
      <div className="page-container footer__inner">
        <BrandLockup variant="footer" />
        <p className="footer__text">{t("footer.text")}</p>
        <p className="footer__contact">
          {t("footer.contactLabel")}{" "}
          <a className="footer__contact-link" href="mailto:info@nensgo.com">
            info@nensgo.com
          </a>
        </p>
        <nav className="footer__legal" aria-label={t("footer.legalAria")}>
          {legalLinks.map((link) => (
            <Link className="footer__legal-link" key={link.to} to={link.to}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
