import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import enConsent from "./en/consent.json";
import esConsent from "./es/consent.json";

const savedLang = localStorage.getItem("cc_language") || "en";

i18n.use(initReactI18next).init({
  resources: {
    en: { consent: enConsent },
    es: { consent: esConsent },
  },
  lng: savedLang,
  fallbackLng: "en",
  ns: ["consent"],
  defaultNS: "consent",
  interpolation: {
    escapeValue: false, // React already escapes
  },
});

export default i18n;
