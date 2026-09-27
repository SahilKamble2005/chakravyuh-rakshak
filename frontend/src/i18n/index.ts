import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "Dashboard": "Dashboard",
      "Live Monitoring": "Live Monitoring",
      "Analytics": "Analytics",
      "Alerts": "Alerts",
      "Settings": "Settings",
      "Risk Level": "Risk Level",
    }
  },
  hi: {
    translation: {
      "Dashboard": "डैशबोर्ड",
      "Live Monitoring": "लाइव मॉनिटरिंग",
      "Analytics": "एनालिटिक्स",
      "Alerts": "अलर्ट",
      "Settings": "सेटिंग्स",
      "Risk Level": "जोखिम स्तर",
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
