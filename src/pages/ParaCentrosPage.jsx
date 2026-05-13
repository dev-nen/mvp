import { useEffect, useState } from "react";
import { Footer } from "@/components/Footer";
import { PARA_CENTROS_FORM_URL } from "@/constants/paraCentros";
import { SeoHead } from "@/components/SeoHead";
import { useI18n } from "@/i18n/useI18n";
import "./ParaCentrosPage.css";

function SectionHeading({ kicker, title, description }) {
  return (
    <div className="para-centros__section-heading">
      {kicker ? <p className="para-centros__section-kicker">{kicker}</p> : null}
      <h2 className="para-centros__section-title">{title}</h2>
      {description ? (
        <p className="para-centros__section-description">{description}</p>
      ) : null}
    </div>
  );
}

function PreviewInfoCard({ label, value, accent = false }) {
  return (
    <article
      className={`para-centros__preview-card${
        accent ? " para-centros__preview-card--accent" : ""
      }`}
    >
      <p className="para-centros__preview-card-label">{label}</p>
      <p className="para-centros__preview-card-value">{value}</p>
    </article>
  );
}

function ActivityPreviewModal({ open, onClose, activityExample, preview }) {
  if (!open) {
    return null;
  }

  return (
    <div className="para-centros__modal-overlay" onClick={onClose}>
      <div
        className="para-centros__modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="para-centros-preview-title"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="para-centros__modal-topbar">
          <button
            className="para-centros__modal-back"
            type="button"
            onClick={onClose}
          >
            {preview.back}
          </button>

          <button
            className="para-centros__modal-close"
            type="button"
            aria-label={preview.close}
            onClick={onClose}
          >
            x
          </button>
        </div>

        <div className="para-centros__modal-scroll">
          <figure className="para-centros__modal-media">
            <img
              src="/para-centros/kidspainting.webp"
              width="1122"
              height="1402"
              decoding="async"
              alt={activityExample.imageAlt}
            />
          </figure>

          <div className="para-centros__modal-content">
            <p className="para-centros__modal-category">
              {activityExample.category}
            </p>
            <h2
              id="para-centros-preview-title"
              className="para-centros__modal-title"
            >
              {activityExample.title}
            </h2>

            <section className="para-centros__modal-section">
              <p className="para-centros__modal-text">{preview.description}</p>
            </section>

            <section className="para-centros__modal-section">
              <div className="para-centros__modal-grid">
                <PreviewInfoCard label={preview.age} value={activityExample.ages} />
                <PreviewInfoCard
                  label={preview.scheduleLabel}
                  value={preview.schedule}
                />
                <PreviewInfoCard
                  label={preview.priceLabel}
                  value={preview.price}
                  accent
                />
              </div>
            </section>

            <section className="para-centros__modal-section">
              <div className="para-centros__modal-grid">
                <PreviewInfoCard label={preview.center} value={preview.venue} />
                <PreviewInfoCard
                  label={preview.addressLabel}
                  value={preview.address}
                />
                <PreviewInfoCard label={preview.cityLabel} value={preview.city} />
              </div>
            </section>

            <section className="para-centros__modal-contact">
              <h3 className="para-centros__modal-contact-title">
                {preview.contactTitle}
              </h3>
              <p className="para-centros__modal-text">{preview.contactCopy}</p>
              <a
                className="para-centros__button para-centros__button--contact"
                href={PARA_CENTROS_FORM_URL}
                target="_blank"
                rel="noreferrer noopener"
              >
                {preview.contactCta}
              </a>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ParaCentrosPage() {
  const { t } = useI18n();
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const hero = t("paraCentros.hero");
  const story = t("paraCentros.story");
  const idea = t("paraCentros.idea");
  const activityExample = t("paraCentros.activityExample");
  const preview = t("paraCentros.preview");
  const benefits = t("paraCentros.benefits");
  const audience = t("paraCentros.audience");
  const requiredInfo = t("paraCentros.requiredInfo");
  const product = t("paraCentros.product");
  const cta = t("paraCentros.cta");

  useEffect(() => {
    if (!isPreviewOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsPreviewOpen(false);
      }
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isPreviewOpen]);

  return (
    <>
      <SeoHead
        title={t("paraCentros.seoTitle")}
        description={t("paraCentros.seoDescription")}
        canonicalUrl="https://nensgo.com/para-centros"
      />
      <main className="para-centros-page">
        <section
          id="inicio"
          className="para-centros__section para-centros__section--hero"
        >
          <div className="para-centros__container para-centros__hero">
            <div className="para-centros__hero-copy">
              <p className="para-centros__section-kicker">{hero.kicker}</p>
              <h1 className="para-centros__hero-title">{hero.title}</h1>
              <p className="para-centros__hero-description">
                {hero.description}
              </p>

              <ul className="para-centros__hero-points">
                {hero.points.map((point) => (
                  <li key={point} className="para-centros__hero-point">
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            <aside className="para-centros__hero-visual">
              <div className="para-centros__hero-panel">
                <div className="para-centros__hero-panel-brand">
                  <img
                    className="para-centros__hero-panel-logo"
                    src="/nensgo-navbar-mark.png"
                    alt=""
                    aria-hidden="true"
                  />
                  <div className="para-centros__hero-panel-intro">
                    <strong>{hero.panelTitle}</strong>
                    <p>{hero.panelDescription}</p>
                  </div>
                </div>

                <ul className="para-centros__simple-list para-centros__simple-list--compact">
                  {hero.featureItems.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            </aside>
          </div>
        </section>

        <section
          id="historia"
          className="para-centros__section para-centros__section--soft"
        >
          <div className="para-centros__container para-centros__content-grid para-centros__content-grid--feature para-centros__history-layout">
            <div className="para-centros__history-copy">
              <SectionHeading
                kicker={story.kicker}
                title={story.title}
                description={story.description}
              />

              <div className="para-centros__history-narrative">
                <div className="para-centros__history-block">
                  {story.intro.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>

                <div className="para-centros__history-block">
                  {story.challenge.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>

                <article className="para-centros__summary-card para-centros__summary-card--accent para-centros__history-callout">
                  <p className="para-centros__summary-eyebrow">
                    {story.calloutEyebrow}
                  </p>
                  <p className="para-centros__history-callout-lead">
                    {story.promptIntro}
                  </p>

                  <ul className="para-centros__history-prompts">
                    {story.prompts.map((prompt) => (
                      <li key={prompt}>{prompt}</li>
                    ))}
                  </ul>

                  <p className="para-centros__history-callout-footer">
                    {story.bridge}
                  </p>
                </article>

                <div className="para-centros__history-block">
                  {story.closing.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>

            <aside className="para-centros__summary-card para-centros__history-summary">
              <p className="para-centros__summary-eyebrow">
                {story.summaryEyebrow}
              </p>
              <h3 className="para-centros__summary-title">
                {story.summaryTitle}
              </h3>

              <ul className="para-centros__simple-list">
                {story.missionPoints.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </aside>
          </div>
        </section>

        <section id="que-es" className="para-centros__section">
          <div className="para-centros__container para-centros__content-grid para-centros__content-grid--feature">
            <div className="para-centros__copy-stack">
              <SectionHeading
                kicker={idea.kicker}
                title={idea.title}
                description={idea.description}
              />

              <div className="para-centros__copy-paragraphs">
                {idea.paragraphs.map((paragraph) => (
                  <p key={paragraph}>{paragraph}</p>
                ))}
              </div>
            </div>

            <article className="para-centros__summary-card para-centros__summary-card--preview">
              <p className="para-centros__summary-eyebrow">
                {idea.previewEyebrow}
              </p>

              <article className="para-centros__activity-example">
                <figure className="para-centros__activity-media">
                  <img
                    src="/para-centros/kidspainting.webp"
                    width="1122"
                    height="1402"
                    loading="lazy"
                    decoding="async"
                    alt={activityExample.imageAlt}
                  />
                </figure>

                <div className="para-centros__activity-content">
                  <p className="para-centros__activity-category">
                    {activityExample.category}
                  </p>
                  <h3 className="para-centros__activity-title">
                    {activityExample.title}
                  </h3>
                  <p className="para-centros__activity-meta">
                    {activityExample.ages}
                  </p>
                  <p className="para-centros__activity-meta">
                    {activityExample.center}
                  </p>
                  <p className="para-centros__activity-meta">
                    {activityExample.locality}
                  </p>

                  <div className="para-centros__activity-actions">
                    <button
                      type="button"
                      className="para-centros__button para-centros__button--primary para-centros__activity-button"
                      onClick={() => setIsPreviewOpen(true)}
                    >
                      {activityExample.cta}
                    </button>
                  </div>
                </div>
              </article>
            </article>
          </div>
        </section>

        <section
          id="beneficios"
          className="para-centros__section para-centros__section--soft"
        >
          <div className="para-centros__container para-centros__stack">
            <SectionHeading
              kicker={benefits.kicker}
              title={benefits.title}
              description={benefits.description}
            />

            <div className="para-centros__benefits-grid">
              {benefits.items.map((benefit) => (
                <article key={benefit.title} className="para-centros__benefit-card">
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </article>
              ))}
            </div>

            <article className="para-centros__future-strip">
              <strong>{benefits.futureTitle}</strong>
              <p>{benefits.futureText}</p>
              <ul className="para-centros__future-list">
                {benefits.futureSignals.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section id="participar" className="para-centros__section">
          <div className="para-centros__container para-centros__content-grid">
            <article className="para-centros__summary-card">
              <SectionHeading
                kicker={audience.kicker}
                title={audience.title}
                description={audience.description}
              />

              <ul className="para-centros__simple-list">
                {audience.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="para-centros__summary-card para-centros__summary-card--accent">
              <SectionHeading
                kicker={requiredInfo.kicker}
                title={requiredInfo.title}
                description={requiredInfo.description}
              />

              <ul className="para-centros__simple-list para-centros__simple-list--checks">
                {requiredInfo.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          </div>
        </section>

        <section
          id="producto"
          className="para-centros__section para-centros__section--tight"
        >
          <div className="para-centros__container para-centros__product-layout">
            <div className="para-centros__trust-copy">
              <SectionHeading
                kicker={product.kicker}
                title={product.title}
                description={product.description}
              />

              <p className="para-centros__trust-text">{product.text}</p>
            </div>

            <figure className="para-centros__product-shot">
              <div className="para-centros__product-frame">
                <img
                  src="/para-centros/muestra.webp"
                  width="1024"
                  height="645"
                  loading="lazy"
                  decoding="async"
                  alt={product.imageAlt}
                />
              </div>
              <figcaption>{product.caption}</figcaption>
            </figure>
          </div>
        </section>

        <section className="para-centros__section para-centros__section--tight">
          <div className="para-centros__container">
            <article className="para-centros__cta-band">
              <div className="para-centros__cta-content">
                <p className="para-centros__section-kicker para-centros__section-kicker--light">
                  {cta.kicker}
                </p>
                <h2 className="para-centros__cta-title">{cta.title}</h2>
                <p className="para-centros__cta-text">{cta.text}</p>
                <p className="para-centros__contact-note">
                  {cta.contactNote}{" "}
                  <a href="mailto:info@nensgo.com">info@nensgo.com</a>.
                </p>
              </div>

              <div className="para-centros__cta-actions">
                <a
                  className="para-centros__button para-centros__button--secondary"
                  href={PARA_CENTROS_FORM_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  {cta.action}
                </a>
              </div>
            </article>
          </div>
        </section>
      </main>

      <Footer />

      <ActivityPreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        activityExample={activityExample}
        preview={preview}
      />
    </>
  );
}
