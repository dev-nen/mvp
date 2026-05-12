import { LANGUAGE_OPTIONS } from "@/i18n/i18nConfig";
import { useI18n } from "@/i18n/useI18n";
import "./LanguageSelector.css";

export function LanguageSelector({ className = "" }) {
  const { language, setLanguage } = useI18n();

  return (
    <div className={["language-selector", className].filter(Boolean).join(" ")}>
      {LANGUAGE_OPTIONS.map((option) => (
        <button
          key={option.code}
          type="button"
          className={`language-selector__option${
            language === option.code ? " language-selector__option--active" : ""
          }`}
          onClick={() => setLanguage(option.code)}
          aria-pressed={language === option.code}
        >
          {option.label}
        </button>
      ))}
    </div>
  );
}
