import "./BrandLockup.css";

const VALID_VARIANTS = new Set(["navbar", "footer"]);

export function BrandLockup({ variant = "navbar" }) {
  const resolvedVariant = VALID_VARIANTS.has(variant) ? variant : "navbar";

  return (
    <span
      className={`brand-lockup brand-lockup--${resolvedVariant}`}
      aria-label="NensGo"
    >
      <img
        src="/branding/nensgo-navbar-mark.png"
        alt=""
        className="brand-lockup__mark"
      />
      <span className="brand-lockup__wordmark" aria-hidden="true">
        <span className="brand-lockup__text-part brand-lockup__text-part--nens">
          Nens
        </span>
        <span className="brand-lockup__text-part brand-lockup__text-part--go">
          Go
        </span>
      </span>
    </span>
  );
}
