import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { LOCALES, DEFAULT_LOCALE, SUPPORTED_LOCALES, type LocaleMeta } from '../locales';
import { supabase } from '../lib/supabase';

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
  // Synchronously initialize language from localStorage to eliminate FOUC (flash of wrong language)
  const [locale, setLocaleState] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved && LOCALES[saved] ? saved : DEFAULT_LOCALE;
    } catch {
      return DEFAULT_LOCALE;
    }
  });

  const activeMeta = LOCALES[locale]?.meta || LOCALES[DEFAULT_LOCALE].meta;
  const isRTL = activeMeta.dir === 'rtl';

  useEffect(() => {
    // Update HTML root attributes for direction and language
    document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
    document.documentElement.lang = locale;
  }, [locale, isRTL]);

  // Sync with user's profile asynchronously if logged in
  useEffect(() => {
    let isMounted = true;
    async function syncProfileLanguage() {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user?.id) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('preferred_language')
            .eq('id', session.user.id)
            .single();

          if (isMounted && profile?.preferred_language && LOCALES[profile.preferred_language]) {
            const localSaved = localStorage.getItem(STORAGE_KEY);
            // Only update if local state differs and profile has explicit preference
            if (!localSaved) {
              setLocaleState(profile.preferred_language);
              localStorage.setItem(STORAGE_KEY, profile.preferred_language);
            }
          }
        }
      } catch (err) {
        // Quiet non-blocking fallback
      }
    }
    syncProfileLanguage();
    return () => { isMounted = false; };
  }, []);

  const setLocale = useCallback((code: string) => {
    if (LOCALES[code]) {
      setLocaleState(code);
      try {
        localStorage.setItem(STORAGE_KEY, code);
      } catch {}

      // Asynchronously push preference to user profile if authenticated
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session?.user?.id) {
          supabase
            .from('profiles')
            .update({ preferred_language: code })
            .eq('id', session.user.id)
            .then();
        }
      }).catch(() => {});
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

    // Robust Fallback to English (DEFAULT_LOCALE) if key missing in target locale
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

    // Variable interpolation {{variable_name}}
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
