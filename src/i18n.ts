import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import enTranslations from './locales/en.json';
import fiTranslations from './locales/fi.json';
import svTranslations from './locales/sv.json';
import ptBrTranslations from './locales/pt-BR.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: enTranslations,
      fi: fiTranslations,
      sv: svTranslations,
      'pt-BR': ptBrTranslations,
    },
    lng: 'en', // default language
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
