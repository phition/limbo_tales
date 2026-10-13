import { useState, useEffect, useCallback } from 'react';
import { I18nService } from '../i18n/I18nService';
import { SupportedLanguage } from '../i18n/types';

export function useI18n() {
  const service = I18nService.getInstance();
  const [lang, setLang] = useState<SupportedLanguage>(service.getLanguage());

  useEffect(() => {
    return service.subscribe((newLang) => {
      setLang(newLang);
    });
  }, [service]);

  const changeLanguage = useCallback((newLang: SupportedLanguage) => {
    service.setLanguage(newLang);
  }, [service]);

  const t = useCallback((path: string, params?: Record<string, string | number>) => {
    return service.t(path, params);
  }, [lang, service]);

  const tr = useCallback((text: string, targetLang?: SupportedLanguage) => {
    return service.tr(text, targetLang);
  }, [lang, service]);

  const dict = service.getDict();

  return {
    lang,
    setLanguage: changeLanguage,
    t,
    tr,
    dict,
  };
}
