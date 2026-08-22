import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import enCommon from './locales/en/common.json';
import enSidebar from './locales/en/sidebar.json';
import enAuth from './locales/en/auth.json';
import enDashboard from './locales/en/dashboard.json';
import enPatients from './locales/en/patients.json';
import enAgenda from './locales/en/agenda.json';
import enClinical from './locales/en/clinical.json';
import enContracts from './locales/en/contracts.json';

import esCommon from './locales/es/common.json';
import esSidebar from './locales/es/sidebar.json';
import esAuth from './locales/es/auth.json';
import esDashboard from './locales/es/dashboard.json';
import esPatients from './locales/es/patients.json';
import esAgenda from './locales/es/agenda.json';
import esClinical from './locales/es/clinical.json';
import esContracts from './locales/es/contracts.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        sidebar: enSidebar,
        auth: enAuth,
        dashboard: enDashboard,
        patients: enPatients,
        agenda: enAgenda,
        clinical: enClinical,
        contracts: enContracts,
      },
      es: {
        common: esCommon,
        sidebar: esSidebar,
        auth: esAuth,
        dashboard: esDashboard,
        patients: esPatients,
        agenda: esAgenda,
        clinical: esClinical,
        contracts: esContracts,
      },
    },
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'sidebar', 'auth', 'dashboard', 'patients', 'agenda', 'clinical', 'contracts'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
    },
  });

export default i18n;
