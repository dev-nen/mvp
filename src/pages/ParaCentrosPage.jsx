import { useEffect, useMemo, useState } from "react";
import "./ParaCentrosPage.css";

const FORM_URL =
  "https://docs.google.com/forms/d/e/1FAIpQLSe0r8a3Ej3kf3VABHjRSWlyVk99oTxnRdDZ7ZuOgGAVU667rA/viewform";

const NAV_LINKS = [
  { label: "Nuestra historia", href: "#historia" },
  { label: "Qué es", href: "#que-es" },
  { label: "Beneficios", href: "#beneficios" },
  { label: "Participar", href: "#participar" },
  { label: "Vista previa", href: "#producto" },
];

const HERO_POINTS = [
  "Más visibilidad local para actividades de calidad.",
  "Una presentación clara para que las familias entiendan rápido tu propuesta.",
  "Un proceso simple para empezar a formar parte del proyecto.",
];

const FEATURE_ITEMS = [
  "Tipo de actividad y edades recomendadas.",
  "Ubicación, horarios y zona de trabajo.",
  "Descripción breve y visual de la propuesta.",
  "Imágenes y forma de contacto.",
];

const ACTIVITY_EXAMPLE = {
  category: "Arte",
  title: "Taller de pintura creativa",
  ages: "7 a 12 años",
  center: "Espai Creatiu Ribes",
  locality: "Sant Pere de Ribes",
  cta: "Ver más",
};

const ACTIVITY_PREVIEW = {
  description:
    "Sesiones creativas para peques que quieren experimentar con color, composición y materiales en un entorno guiado y cercano.",
  schedule: "Martes y jueves, 17:30 a 19:00",
  price: "Desde 42 EUR al mes",
  venue: "Espai Creatiu Ribes",
  address: "Carrer de la Pintura, 12",
  city: "Sant Pere de Ribes",
  contactTitle: "Contactar",
  contactCopy:
    "Puedes escribir directamente al centro si quieres confirmar si esta actividad encaja con tu familia.",
  contactCta: "Contactar",
};

const BENEFITS = [
  {
    title: "Más visibilidad",
    description:
      "Tu actividad aparece en un espacio centrado en planes y servicios para peques y familias.",
  },
  {
    title: "Más claridad",
    description:
      "La propuesta se presenta de forma ordenada para que una familia entienda rápido si encaja.",
  },
  {
    title: "Más oportunidades de contacto",
    description:
      "Facilitamos que nuevos interesados descubran tu actividad y quieran saber más.",
  },
];

const AUDIENCE_ITEMS = [
  "Academias y centros formativos.",
  "Actividades extraescolares y deportivas.",
  "Talleres artísticos, creativos y culturales.",
  "Espacios familiares, casales y propuestas de temporada.",
  "Profesionales o entidades que trabajen con peques y familias.",
];

const REQUIRED_INFO = [
  "Quién eres o qué entidad representas.",
  "Qué actividad o servicio ofreces.",
  "En qué zona trabajas.",
  "Para qué edades está pensada tu propuesta.",
  "Una forma de contacto.",
];

const FUTURE_SIGNALS = [
  "Qué tipos de actividades despiertan más interés.",
  "Qué zonas concentran más búsquedas.",
  "Qué fichas generan más clics o contactos.",
];

const STORY_INTRO_PARAGRAPHS = [
  "Somos una familia a la que le encanta hacer planes. Siempre estamos buscando nuevas actividades, propuestas diferentes y experiencias que nos permitan descubrir cosas, compartir tiempo de calidad y, sobre todo, regalarle a nuestro hijo oportunidades para aprender, disfrutar y vivir algo nuevo.",
];

const STORY_CHALLENGE_PARAGRAPHS = [
  "Con el tiempo fuimos notando algo que seguramente le pasa a muchas familias: encontrar actividades interesantes no siempre es fácil.",
  "Muchas veces la información está dispersa, incompleta o cuesta muchísimo llegar a propuestas distintas a las de siempre.",
];

const STORY_PROMPT_INTRO =
  "También nos pasó que, casi sin querer, empezamos a convertirnos en una especie de referencia para otras familias.";

const STORY_PROMPTS = [
  '"Ustedes que siempre están haciendo cosas... ¿qué nos recomendáis?"',
  '"¿Tenéis alguna idea para este finde?"',
  '"¿Dónde encontrasteis esa actividad?"',
];

const STORY_ORIGIN_BRIDGE =
  "Y así, entre mensajes, recomendaciones y enlaces compartidos, vimos una necesidad muy clara: ¿por qué no crear un sitio donde todo esto pueda encontrarse de forma más fácil y ordenada?";

const STORY_CLOSING_PARAGRAPHS = [
  "Por eso NensGo nace con una idea muy simple: ayudar a las familias a descubrir actividades cerca de ellas, dar visibilidad a pequeños proyectos, talleres, espacios y propuestas locales, y reunir en un solo lugar opciones para disfrutar con hijos y en familia.",
  'Queremos facilitar la búsqueda, inspirar nuevos planes y hacer que encontrar algo para hacer no dependa de tener "el contacto correcto" o de que justo alguien te pase la información.',
  "Porque creemos que hay muchísimo por descubrir, y que compartirlo también es una forma de construir comunidad.",
];

const STORY_MISSION_POINTS = [
  "Ayudar a las familias a descubrir actividades cerca de ellas.",
  "Dar visibilidad a pequeños proyectos, talleres, espacios y propuestas locales.",
  "Reunir en un solo lugar opciones para disfrutar con hijos y en familia.",
];

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

function ActivityPreviewModal({ open, onClose }) {
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
            Volver
          </button>

          <button
            className="para-centros__modal-close"
            type="button"
            aria-label="Cerrar vista previa"
            onClick={onClose}
          >
            x
          </button>
        </div>

        <div className="para-centros__modal-scroll">
          <figure className="para-centros__modal-media">
            <img
              src="/para-centros/kidspainting.png"
              alt="Tres niños pintando en un caballete, vistos de espaldas."
            />
          </figure>

          <div className="para-centros__modal-content">
            <p className="para-centros__modal-category">
              {ACTIVITY_EXAMPLE.category}
            </p>
            <h2
              id="para-centros-preview-title"
              className="para-centros__modal-title"
            >
              {ACTIVITY_EXAMPLE.title}
            </h2>

            <section className="para-centros__modal-section">
              <p className="para-centros__modal-text">
                {ACTIVITY_PREVIEW.description}
              </p>
            </section>

            <section className="para-centros__modal-section">
              <div className="para-centros__modal-grid">
                <PreviewInfoCard label="Edad" value={ACTIVITY_EXAMPLE.ages} />
                <PreviewInfoCard
                  label="Horario"
                  value={ACTIVITY_PREVIEW.schedule}
                />
                <PreviewInfoCard
                  label="Precio"
                  value={ACTIVITY_PREVIEW.price}
                  accent
                />
              </div>
            </section>

            <section className="para-centros__modal-section">
              <div className="para-centros__modal-grid">
                <PreviewInfoCard label="Centro" value={ACTIVITY_PREVIEW.venue} />
                <PreviewInfoCard
                  label="Dirección"
                  value={ACTIVITY_PREVIEW.address}
                />
                <PreviewInfoCard label="Ciudad" value={ACTIVITY_PREVIEW.city} />
              </div>
            </section>

            <section className="para-centros__modal-contact">
              <h3 className="para-centros__modal-contact-title">
                {ACTIVITY_PREVIEW.contactTitle}
              </h3>
              <p className="para-centros__modal-text">
                Habla directamente con el centro para pedir más información.
              </p>
              <a
                className="para-centros__button para-centros__button--contact"
                href={FORM_URL}
                target="_blank"
                rel="noreferrer noopener"
              >
                {ACTIVITY_PREVIEW.contactCta}
              </a>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

export function ParaCentrosPage() {
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const currentYear = useMemo(() => new Date().getFullYear(), []);

  useEffect(() => {
    const previousTitle = document.title;
    const existingRobotsMeta = document.querySelector('meta[name="robots"]');
    const hadRobotsMeta = Boolean(existingRobotsMeta);
    const robotsMeta =
      existingRobotsMeta || document.createElement("meta");
    const previousRobotsContent = existingRobotsMeta?.getAttribute("content");

    document.title = "NensGo | Plataforma de actividades infantiles y familiares";

    robotsMeta.setAttribute("name", "robots");
    robotsMeta.setAttribute("content", "noindex,nofollow");

    if (!hadRobotsMeta) {
      document.head.appendChild(robotsMeta);
    }

    return () => {
      document.title = previousTitle;

      if (hadRobotsMeta) {
        if (previousRobotsContent === null) {
          robotsMeta.removeAttribute("content");
        } else {
          robotsMeta.setAttribute("content", previousRobotsContent);
        }

        return;
      }

      robotsMeta.remove();
    };
  }, []);

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
      <main className="para-centros-page">
        <header className="para-centros__header">
          <div className="para-centros__container para-centros__header-inner">
            <a
              className="para-centros__brand"
              href="#inicio"
              aria-label="Ir al inicio de NensGo para centros"
            >
              <img
                className="para-centros__brand-mark"
                src="/nensgo-navbar-mark.png"
                alt="Logotipo de NensGo"
              />
              <span className="para-centros__brand-copy">
                <strong>NensGo</strong>
                <span>Plataforma de actividades infantiles y familiares</span>
              </span>
            </a>

            <nav
              className="para-centros__nav"
              aria-label="Secciones principales para centros"
            >
              {NAV_LINKS.map((link) => (
                <a
                  key={link.href}
                  className="para-centros__nav-link"
                  href={link.href}
                >
                  {link.label}
                </a>
              ))}
            </nav>

            <a
              className="para-centros__button para-centros__button--secondary"
              href={FORM_URL}
              target="_blank"
              rel="noreferrer noopener"
            >
              Unirme al proyecto
            </a>
          </div>
        </header>

        <section
          id="inicio"
          className="para-centros__section para-centros__section--hero"
        >
          <div className="para-centros__container para-centros__hero">
            <div className="para-centros__hero-copy">
              <p className="para-centros__section-kicker">
                ¿Ofreces actividades para peques o familias?
              </p>
              <h1 className="para-centros__hero-title">
                Haz que tu propuesta llegue mejor a las familias.
              </h1>
              <p className="para-centros__hero-description">
                NensGo es una plataforma de actividades infantiles y familiares
                que quiere reunir en un solo lugar propuestas que hoy están
                dispersas entre redes, grupos y canales poco claros. Esta
                página presenta la visión del proyecto, la plataforma que
                estamos construyendo y la convocatoria abierta para talleres,
                deporte, arte, cultura y espacios para peques que quieran
                sumarse desde el principio.
              </p>

              <ul className="para-centros__hero-points">
                {HERO_POINTS.map((point) => (
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
                    <strong>Un escaparate digital claro</strong>
                    <p>
                      Tu propuesta se muestra de forma simple, visual y fácil de
                      entender.
                    </p>
                  </div>
                </div>

                <ul className="para-centros__simple-list para-centros__simple-list--compact">
                  {FEATURE_ITEMS.map((item) => (
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
                kicker="Nuestra historia"
                title="Así nació NensGo"
                description="NensGo nace de una necesidad muy concreta: encontrar actividades bien explicadas, cercanas y distintas a las de siempre."
              />

              <div className="para-centros__history-narrative">
                <div className="para-centros__history-block">
                  {STORY_INTRO_PARAGRAPHS.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>

                <div className="para-centros__history-block">
                  {STORY_CHALLENGE_PARAGRAPHS.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>

                <article className="para-centros__summary-card para-centros__summary-card--accent para-centros__history-callout">
                  <p className="para-centros__summary-eyebrow">
                    Lo empezamos a oir una y otra vez
                  </p>
                  <p className="para-centros__history-callout-lead">
                    {STORY_PROMPT_INTRO}
                  </p>

                  <ul className="para-centros__history-prompts">
                    {STORY_PROMPTS.map((prompt) => (
                      <li key={prompt}>{prompt}</li>
                    ))}
                  </ul>

                  <p className="para-centros__history-callout-footer">
                    {STORY_ORIGIN_BRIDGE}
                  </p>
                </article>

                <div className="para-centros__history-block">
                  {STORY_CLOSING_PARAGRAPHS.map((paragraph) => (
                    <p key={paragraph}>{paragraph}</p>
                  ))}
                </div>
              </div>
            </div>

            <aside className="para-centros__summary-card para-centros__history-summary">
              <p className="para-centros__summary-eyebrow">
                Lo que queremos construir
              </p>
              <h3 className="para-centros__summary-title">
                Un lugar más claro para descubrir planes en familia
              </h3>

              <ul className="para-centros__simple-list">
                {STORY_MISSION_POINTS.map((point) => (
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
                kicker="La idea base"
                title="Una forma clara, moderna y práctica de descubrir actividades"
                description="Cada propuesta se presenta en una ficha visual y ordenada para que una familia entienda rápido si encaja con lo que está buscando."
              />

              <div className="para-centros__copy-paragraphs">
                <p>
                  NensGo quiere ser ese lugar donde descubrir planes resulte
                  sencillo: una experiencia pensada para ver en pocos segundos
                  qué es cada actividad, para qué edades está pensada y dónde
                  encontrarla.
                </p>
                <p>
                  La ficha que ves aquí resume esa idea: una propuesta bien
                  presentada, con la información importante a la vista y una
                  estructura que ayuda a decidir sin tener que rebuscar entre
                  mensajes, redes o enlaces sueltos.
                </p>
                <p>
                  Buscamos una solución moderna, organizativa y práctica: un
                  espacio cuidado para las familias y, al mismo tiempo, una
                  forma clara de mostrar cada proyecto con orden, contexto y
                  utilidad real.
                </p>
              </div>
            </div>

            <article className="para-centros__summary-card para-centros__summary-card--preview">
              <p className="para-centros__summary-eyebrow">
                Así se verá una actividad
              </p>

              <article className="para-centros__activity-example">
                <figure className="para-centros__activity-media">
                  <img
                    src="/para-centros/kidspainting.png"
                    alt="Tres niños pintando en un caballete, vistos de espaldas."
                  />
                </figure>

                <div className="para-centros__activity-content">
                  <p className="para-centros__activity-category">
                    {ACTIVITY_EXAMPLE.category}
                  </p>
                  <h3 className="para-centros__activity-title">
                    {ACTIVITY_EXAMPLE.title}
                  </h3>
                  <p className="para-centros__activity-meta">
                    {ACTIVITY_EXAMPLE.ages}
                  </p>
                  <p className="para-centros__activity-meta">
                    {ACTIVITY_EXAMPLE.center}
                  </p>
                  <p className="para-centros__activity-meta">
                    {ACTIVITY_EXAMPLE.locality}
                  </p>

                  <div className="para-centros__activity-actions">
                    <button
                      type="button"
                      className="para-centros__button para-centros__button--primary para-centros__activity-button"
                      onClick={() => setIsPreviewOpen(true)}
                    >
                      {ACTIVITY_EXAMPLE.cta}
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
              kicker="¿Qué gana tu proyecto?"
              title="Más visibilidad, más claridad y más oportunidades de contacto"
              description="NensGo está pensado para que proyectos reales ganen presencia sin perder tiempo en una web compleja."
            />

            <div className="para-centros__benefits-grid">
              {BENEFITS.map((benefit) => (
                <article key={benefit.title} className="para-centros__benefit-card">
                  <h3>{benefit.title}</h3>
                  <p>{benefit.description}</p>
                </article>
              ))}
            </div>

            <article className="para-centros__future-strip">
              <strong>Más adelante</strong>
              <p>
                También queremos compartir señales útiles para ayudarte a
                entender mejor el interés que genera tu actividad:
              </p>
              <ul className="para-centros__future-list">
                {FUTURE_SIGNALS.map((item) => (
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
                kicker="¿A quién va dirigido?"
                title="A centros, actividades y proyectos pensados para peques y familias"
                description="Si tu propuesta aporta valor a familias y niños, nos interesa conocerla."
              />

              <ul className="para-centros__simple-list">
                {AUDIENCE_ITEMS.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>

            <article className="para-centros__summary-card para-centros__summary-card--accent">
              <SectionHeading
                kicker="¿Qué necesitamos de ti?"
                title="Solo unos pocos datos para valorar tu propuesta"
                description="Solo pedimos una primera información básica para entender el proyecto y poder hablar contigo."
              />

              <ul className="para-centros__simple-list para-centros__simple-list--checks">
                {REQUIRED_INFO.map((item) => (
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
                kicker="¿Qué tipo de espacio queremos crear?"
                title="Un espacio útil, cuidado y de valor real"
                description="NensGo no quiere ser un listado sin criterio. Queremos crear un espacio donde las familias encuentren propuestas confiables y donde quienes organizan actividades puedan mostrarse de forma clara."
              />

              <p className="para-centros__trust-text">
                Por eso nos interesa contar con proyectos reales, bien
                explicados y con ganas de formar parte de una plataforma pensada
                para conectar mejor la oferta con la demanda.
              </p>
            </div>

            <figure className="para-centros__product-shot">
              <div className="para-centros__product-frame">
                <img
                  src="/para-centros/muestra.png"
                  alt="Vista previa de la aplicación NensGo con buscador, filtros y tarjetas de actividades."
                />
              </div>
              <figcaption>
                Vista real de la aplicación que guiará a las familias a
                descubrir actividades de forma más clara.
              </figcaption>
            </figure>
          </div>
        </section>

        <section className="para-centros__section para-centros__section--tight">
          <div className="para-centros__container">
            <article className="para-centros__cta-band">
              <div className="para-centros__cta-content">
                <p className="para-centros__section-kicker para-centros__section-kicker--light">
                  ¿Quieres unirte al proyecto?
                </p>
                <h2 className="para-centros__cta-title">
                  Tu actividad puede formar parte de NensGo.
                </h2>
                <p className="para-centros__cta-text">
                  Déjanos tus datos en el formulario y te contactaremos si así
                  lo deseas.
                </p>
              </div>

              <div className="para-centros__cta-actions">
                <a
                  className="para-centros__button para-centros__button--secondary"
                  href={FORM_URL}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Quiero participar
                </a>
              </div>
            </article>
          </div>
        </section>
      </main>

      <footer
        className="para-centros__footer"
        aria-label="Pie de pagina de NensGo para centros"
      >
        <div className="para-centros__container para-centros__footer-inner">
          <p className="para-centros__footer-brand">NensGo</p>
          <p className="para-centros__footer-rights">
            Copyright {currentYear} NensGo. Todos los derechos reservados.
          </p>
          <p className="para-centros__footer-note">
            Los textos, diseños, imágenes y materiales publicados en esta web
            pertenecen a NensGo o se usan con autorización.
          </p>
        </div>
      </footer>

      <ActivityPreviewModal
        open={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
      />
    </>
  );
}
