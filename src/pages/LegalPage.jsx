import { Footer } from "@/components/Footer";
import { SeoHead } from "@/components/SeoHead";
import { DEFAULT_LANGUAGE } from "@/i18n/i18nConfig";
import caLegal from "@/i18n/legal/ca";
import enLegal from "@/i18n/legal/en";
import esLegal from "@/i18n/legal/es";
import { useI18n } from "@/i18n/useI18n";
import "./LegalPage.css";

const legalDictionaries = {
  ca: caLegal,
  en: enLegal,
  es: esLegal,
};

function LegalBlock({ block }) {
  if (block.type === "list") {
    return (
      <ul className="legal-page__list">
        {block.items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
    );
  }

  if (block.type === "email") {
    return (
      <p className="legal-page__paragraph">
        <a className="legal-page__link" href={`mailto:${block.value}`}>
          {block.value}
        </a>
      </p>
    );
  }

  return <p className="legal-page__paragraph">{block.text}</p>;
}

export function LegalPage({ canonicalUrl, pageKey }) {
  const { language } = useI18n();
  const legalDictionary =
    legalDictionaries[language] || legalDictionaries[DEFAULT_LANGUAGE];
  const page = legalDictionary[pageKey] || legalDictionaries.es[pageKey];

  return (
    <div className="legal-page">
      <SeoHead
        title={page.seoTitle}
        description={page.seoDescription}
        canonicalUrl={canonicalUrl}
        robots="index, follow"
      />

      <main className="legal-page__main">
        <article className="legal-page__container" aria-labelledby="legal-page-title">
          <header className="legal-page__header">
            <h1 id="legal-page-title" className="legal-page__title">
              {page.title}
            </h1>
            <p className="legal-page__updated">{page.lastUpdated}</p>
            <p className="legal-page__intro">{page.intro}</p>
          </header>

          <div className="legal-page__sections">
            {page.sections.map((section) => (
              <section className="legal-page__section" key={section.title}>
                <h2 className="legal-page__section-title">{section.title}</h2>
                {section.blocks.map((block, index) => (
                  <LegalBlock block={block} key={`${section.title}-${index}`} />
                ))}
              </section>
            ))}
          </div>
        </article>
      </main>

      <Footer />
    </div>
  );
}
