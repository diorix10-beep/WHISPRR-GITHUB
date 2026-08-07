import { useI18n } from '../contexts/I18nContext';

export function useTranslation() {
  const { locale, meta, setLocale, t, formatDate, formatNumber, formatCurrency, isRTL, supportedLocales } = useI18n();

  return {
    t,
    locale,
    meta,
    setLocale,
    formatDate,
    formatNumber,
    formatCurrency,
    isRTL,
    supportedLocales
  };
}
