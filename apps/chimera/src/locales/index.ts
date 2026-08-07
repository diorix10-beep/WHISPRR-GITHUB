import en from './en.json';
import fr from './fr.json';
import es from './es.json';
import de from './de.json';
import ar from './ar.json';

export interface LocaleMeta {
  code: string;
  name: string;
  flag: string;
  dir?: 'ltr' | 'rtl';
}

export type TranslationCatalog = typeof en;

export const LOCALES: Record<string, { meta: LocaleMeta; catalog: any }> = {
  en: { meta: en.meta as LocaleMeta, catalog: en },
  fr: { meta: fr.meta as LocaleMeta, catalog: fr },
  es: { meta: es.meta as LocaleMeta, catalog: es },
  de: { meta: de.meta as LocaleMeta, catalog: de },
  ar: { meta: ar.meta as LocaleMeta, catalog: ar },
};

export const DEFAULT_LOCALE = 'en';

export const SUPPORTED_LOCALES: LocaleMeta[] = Object.values(LOCALES).map(l => l.meta);
