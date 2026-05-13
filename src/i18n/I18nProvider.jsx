import { createContext, useCallback, useEffect, useMemo, useState } from "react";
import es from "@/i18n/locales/es";
import ca from "@/i18n/locales/ca";
import en from "@/i18n/locales/en";
import esLegal from "@/i18n/legal/es";
import caLegal from "@/i18n/legal/ca";
import enLegal from "@/i18n/legal/en";
import {
  DEFAULT_LANGUAGE,
  LANGUAGE_STORAGE_KEY,
  SUPPORTED_LANGUAGES,
} from "@/i18n/i18nConfig";

export const I18nContext = createContext(null);

const dictionaries = {
  es: { ...es, legal: esLegal },
  ca: { ...ca, legal: caLegal },
  en: { ...en, legal: enLegal },
};

function isSupportedLanguage(language) {
  return SUPPORTED_LANGUAGES.includes(language);
}

function getInitialLanguage() {
  if (typeof window === "undefined") {
    return DEFAULT_LANGUAGE;
  }

  const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);

  return isSupportedLanguage(storedLanguage) ? storedLanguage : DEFAULT_LANGUAGE;
}

function getPathValue(source, key) {
  return key.split(".").reduce((currentValue, keyPart) => {
    if (
      currentValue &&
      typeof currentValue === "object" &&
      Object.prototype.hasOwnProperty.call(currentValue, keyPart)
    ) {
      return currentValue[keyPart];
    }

    return undefined;
  }, source);
}

function interpolate(value, params) {
  if (typeof value !== "string" || !params) {
    return value;
  }

  return value.replace(/\{([a-zA-Z0-9_]+)\}/g, (_, paramName) =>
    params[paramName] === undefined || params[paramName] === null
      ? ""
      : String(params[paramName]),
  );
}

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = useCallback((nextLanguage) => {
    const resolvedLanguage = isSupportedLanguage(nextLanguage)
      ? nextLanguage
      : DEFAULT_LANGUAGE;

    setLanguageState(resolvedLanguage);

    if (typeof window !== "undefined") {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, resolvedLanguage);
    }
  }, []);

  const t = useCallback(
    (key, params) => {
      const selectedValue = getPathValue(dictionaries[language], key);
      const fallbackValue = getPathValue(dictionaries[DEFAULT_LANGUAGE], key);
      const resolvedValue =
        selectedValue === undefined
          ? fallbackValue === undefined
            ? key
            : fallbackValue
          : selectedValue;

      return interpolate(resolvedValue, params);
    },
    [language],
  );

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t,
    }),
    [language, setLanguage, t],
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
