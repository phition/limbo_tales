import { I18nService } from '../i18n/I18nService';

export interface TranslationResult {
  translatedText: string;
  detectedSourceLang?: string;
  fromCache?: boolean;
}

export class TranslationService {
  private static instance: TranslationService;
  private apiKey: string;
  private cache: Map<string, string> = new Map();

  private constructor() {
    this.apiKey = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY || 'AIzaSyDpLWdYo53j_wk6xs2Za3BgITC1MH0bJeQ';
    this.loadCache();
  }

  public static getInstance(): TranslationService {
    if (!TranslationService.instance) {
      TranslationService.instance = new TranslationService();
    }
    return TranslationService.instance;
  }

  private loadCache(): void {
    try {
      const saved = localStorage.getItem('limbo_guestbook_translations');
      if (saved) {
        const parsed: Record<string, string> = JSON.parse(saved);
        Object.entries(parsed).forEach(([key, val]) => {
          this.cache.set(key, val);
        });
      }
    } catch (_) {}
  }

  private saveCache(): void {
    try {
      const obj: Record<string, string> = {};
      this.cache.forEach((val, key) => {
        obj[key] = val;
      });
      localStorage.setItem('limbo_guestbook_translations', JSON.stringify(obj));
    } catch (_) {}
  }

  /**
   * 🌐 텍스트 1개 번역 (캐시 우선 확인)
   */
  public async translate(text: string, customTargetLang?: string): Promise<TranslationResult> {
    const clean = (text || '').trim();
    if (!clean) {
      return { translatedText: '', detectedSourceLang: 'und' };
    }

    const currentLang = customTargetLang || I18nService.getInstance().getCurrentLanguage();
    // Google Translate 언어 코드 매핑
    const target = currentLang === 'ja' ? 'ja' : currentLang === 'en' ? 'en' : 'ko';

    const cacheKey = `${target}:${clean}`;
    if (this.cache.has(cacheKey)) {
      return {
        translatedText: this.cache.get(cacheKey)!,
        fromCache: true
      };
    }

    const url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;
    const payload = {
      q: [clean],
      target,
      format: 'text'
    };

    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => null);
        console.warn('⚠️ [TranslationService] 번역 API 호출 실패:', errJson || resp.statusText);
        
        if (resp.status === 403 && errJson?.error?.message?.includes('Requests from referer')) {
          throw new Error('Google Cloud Console에서 API 키의 HTTP 리퍼러 제한(localhost 또는 앱 도메인)을 확인해 주세요.');
        }
        throw new Error(errJson?.error?.message || `번역 서버 응답 실패 (${resp.status})`);
      }

      const json = await resp.json();
      const item = json?.data?.translations?.[0];
      const translated = item?.translatedText || clean;
      const detectedSourceLang = item?.detectedSourceLanguage;

      // 번역 성공 시 캐시에 보존 (재호출 과금 방지)
      this.cache.set(cacheKey, translated);
      this.saveCache();

      return {
        translatedText: translated,
        detectedSourceLang,
        fromCache: false
      };
    } catch (err: any) {
      console.error('⚠️ [TranslationService] translate 예외:', err);
      throw err;
    }
  }

  /**
   * 📚 여러 텍스트 일괄 번역 (배치 쿼리로 한 번에 호출)
   */
  public async translateBatch(texts: string[], customTargetLang?: string): Promise<TranslationResult[]> {
    if (!texts || texts.length === 0) return [];

    const currentLang = customTargetLang || I18nService.getInstance().getCurrentLanguage();
    const target = currentLang === 'ja' ? 'ja' : currentLang === 'en' ? 'en' : 'ko';

    const results: TranslationResult[] = new Array(texts.length);
    const toFetchIndices: number[] = [];
    const toFetchTexts: string[] = [];

    // 캐시 우선 확인
    texts.forEach((txt, idx) => {
      const clean = (txt || '').trim();
      const cacheKey = `${target}:${clean}`;
      if (this.cache.has(cacheKey)) {
        results[idx] = { translatedText: this.cache.get(cacheKey)!, fromCache: true };
      } else {
        toFetchIndices.push(idx);
        toFetchTexts.push(clean);
      }
    });

    if (toFetchTexts.length === 0) {
      return results;
    }

    const url = `https://translation.googleapis.com/language/translate/v2?key=${this.apiKey}`;
    try {
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          q: toFetchTexts,
          target,
          format: 'text'
        })
      });

      if (!resp.ok) {
        const errJson = await resp.json().catch(() => null);
        console.warn('⚠️ [TranslationService] 배치 번역 실패:', errJson);
        // 실패 시 원문 반환
        toFetchIndices.forEach((origIdx, i) => {
          results[origIdx] = { translatedText: toFetchTexts[i], fromCache: false };
        });
        return results;
      }

      const json = await resp.json();
      const translations: any[] = json?.data?.translations || [];

      toFetchIndices.forEach((origIdx, i) => {
        const trItem = translations[i];
        const translated = trItem?.translatedText || toFetchTexts[i];
        const cacheKey = `${target}:${toFetchTexts[i]}`;
        this.cache.set(cacheKey, translated);
        results[origIdx] = {
          translatedText: translated,
          detectedSourceLang: trItem?.detectedSourceLanguage,
          fromCache: false
        };
      });

      this.saveCache();
      return results;
    } catch (e) {
      console.error('⚠️ [TranslationService] translateBatch 예외:', e);
      toFetchIndices.forEach((origIdx, i) => {
        results[origIdx] = { translatedText: toFetchTexts[i], fromCache: false };
      });
      return results;
    }
  }

  /**
   * 🧹 번역 캐시 초기화
   */
  public clearCache(): void {
    this.cache.clear();
    try {
      localStorage.removeItem('limbo_guestbook_translations');
    } catch (_) {}
  }
}
