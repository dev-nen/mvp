import { BrandLockup } from "@/components/branding/BrandLockup";
import "./Footer.css";

export function Footer() {
  return (
    <footer className="footer">
      <div className="footer__ribbon" aria-hidden="true" />
      <div className="page-container footer__inner">
        <BrandLockup variant="footer" />
        <p className="footer__text">
          NensGo es un prototipo MVP. Algunas actividades mostradas son
          ejemplos de prueba usados para diseño, validación y desarrollo.
        </p>
      </div>
    </footer>
  );
}
