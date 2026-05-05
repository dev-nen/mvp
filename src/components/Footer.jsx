import { BrandLockup } from "@/components/branding/BrandLockup";
import "./Footer.css";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__ribbon" aria-hidden="true" />
      <div className="page-container footer__inner">
        <BrandLockup variant="footer" />
        <p className="footer__text">
          Actividades para peques y familias, organizadas para ayudarte a
          decidir mejor.
        </p>
        <p className="footer__contact">
          Contacto:{" "}
          <a className="footer__contact-link" href="mailto:info@nensgo.com">
            info@nensgo.com
          </a>
        </p>
      </div>
    </footer>
  );
}
