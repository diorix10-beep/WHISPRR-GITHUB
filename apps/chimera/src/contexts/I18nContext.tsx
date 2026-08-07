import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LOCALES, DEFAULT_LOCALE, SUPPORTED_LOCALES, type LocaleMeta } from '../locales';

interface I18nContextType {
  locale: string;
  meta: LocaleMeta;
  setLocale: (code: string) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
  formatDate: (date: Date | string | number, options?: Intl.DateTimeFormatOptions) => string;
  formatNumber: (num: number, options?: Intl.NumberFormatOptions) => string;
  formatCurrency: (amount: number, currency?: string) => string;
  isRTL: boolean;
  supportedLocales: LocaleMeta[];
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

const STORAGE_KEY = 'chimera_preferred_language';

export const I18nProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [locale, setLocaleState] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved && LOCALES[saved] ? saved : DEFAULT_LOCALE;
  });

  const activeMeta = LOCALES[locale]?.meta || LOCALES[DEFAULT_LOCALE].meta;
  const isRTL = activeMeta.dir === 'rtl';

  useEffect(() => {
    // Update HTML dir attribute for RTL support
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [locale, isRTL]);

  const setLocale = useCallback((code: string) => {
    if (LOCALES[code]) {
      setLocaleState(code);
      localStorage.setItem(STORAGE_KEY, code);
      // Dispatch event for legacy listeners if any
      window.dispatchEvent(new CustomEvent('chimera-language-changed', { detail: { code } }));
    }
  }, []);

  const t = useCallback((key: string, params?: Record<string, string | number>): string => {
    const keys = key.split('.');
    let catalog = LOCALES[locale]?.catalog || LOCALES[DEFAULT_LOCALE].catalog;
    let value: any = catalog;

    for (const k of keys) {
      if (value && typeof value === 'object' && k in value) {
        value = value[k];
      } else {
        value = undefined;
        break;
      }
    }

    // Fallback to English catalog if missing in target locale
    if (value === undefined && locale !== DEFAULT_LOCALE) {
      let fallbackCatalog = LOCALES[DEFAULT_LOCALE].catalog;
      let fbValue: any = fallbackCatalog;
      for (const k of keys) {
        if (fbValue && typeof fbValue === 'object' && k in fbValue) {
          fbValue = fbValue[k];
        } else {
          fbValue = undefined;
          break;
        }
      }
      value = fbValue;
    }

    if (typeof value !== 'string') {
      return key; // Return raw token key as ultimate fallback
    }

    // Interpolate variables {{variable_name}}
    if (params) {
      Object.entries(params).forEach(([paramKey, paramVal]) => {
        value = (value as string).replace(new RegExp(`\\{\\{${paramKey}\\}\\}`, 'g'), String(paramVal));
      });
    }

    return value;
  }, [locale]);

  const formatDate = useCallback((date: Date | string | number, options?: Intl.DateTimeFormatOptions): string => {
    try {
      const d = typeof date === 'string' || typeof date === 'number' ? new Date(date) : date;
      return new Intl.DateTimeFormat(locale, options || { dateStyle: 'medium', timeStyle: 'short' }).format(d);
    } catch {
      return String(date);
    }
  }, [locale]);

  const formatNumber = useCallback((num: number, options?: Intl.NumberFormatOptions): string => {
    try {
      return new Intl.NumberFormat(locale, options).format(num);
    } catch {
      return String(num);
    }
  }, [locale]);

  const formatCurrency = useCallback((amount: number, currency = 'USD'): string => {
    try {
      return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(amount);
    } catch {
      return `$${amount}`;
    }
  }, [locale]);

  return (
    <I18nContext.Provider
      value={{
        locale,
        meta: activeMeta,
        setLocale,
        t,
        formatDate,
        formatNumber,
        formatCurrency,
        isRTL,
        supportedLocales: SUPPORTED_LOCALES
      }}
    >
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
