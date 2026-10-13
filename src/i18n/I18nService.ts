import { SupportedLanguage, TranslationDictionary } from './types';
import { koDictionary } from './locales/ko';
import { enDictionary } from './locales/en';
import { jaDictionary } from './locales/ja';
import { EXACT_TRANSLATIONS, LOG_PATTERNS } from './translationDictionary';
import { RESOURCE_NAMES, BUILDING_NAMES, CLASS_NAMES } from './dataLocales';

export class I18nService {
  private static instance: I18nService;
  private currentLanguage: SupportedLanguage = 'ko';
  private dictionaries: Record<SupportedLanguage, TranslationDictionary> = {
    ko: koDictionary,
    en: enDictionary,
    ja: jaDictionary,
  };

  private listeners: ((lang: SupportedLanguage) => void)[] = [];
  private translationCache: Map<string, string> = new Map();
  private domObserver: MutationObserver | null = null;
  private isTranslatingDom = false;

  /** 빌드 시 생성된 전체 문장 번역표 (ko 원문 → 번역) — 언어별 지연 로딩 */
  private generated: Partial<Record<'en' | 'ja', Record<string, string>>> = {};
  private patterns: Partial<Record<'en' | 'ja', { re: RegExp; frag: string; tpl: string }[]>> = {};
  private loading: Partial<Record<'en' | 'ja', Promise<void>>> = {};

  private constructor() {
    try {
      const savedLang = localStorage.getItem('limbo_language') as SupportedLanguage;
      if (savedLang && (savedLang === 'ko' || savedLang === 'en' || savedLang === 'ja')) {
        this.currentLanguage = savedLang;
        if (savedLang !== 'ko') {
          this.ensureLoaded(savedLang).then(() => {
            this.translationCache.clear();
            this.retranslateWholeDom();
            this.listeners.forEach((fn) => fn(savedLang));
          });
        }
      }
    } catch (_) {}
  }

  public static getInstance(): I18nService {
    if (!I18nService.instance) {
      I18nService.instance = new I18nService();
    }
    return I18nService.instance;
  }

  public getLanguage(): SupportedLanguage {
    return this.currentLanguage;
  }

  /** 지정 언어의 생성 번역표를 로드하고 {N} 템플릿 패턴을 컴파일 */
  public ensureLoaded(lang: SupportedLanguage): Promise<void> {
    if (lang === 'ko') return Promise.resolve();
    const l = lang as 'en' | 'ja';
    if (this.generated[l]) return Promise.resolve();
    if (!this.loading[l]) {
      const loader = l === 'en' ? import('./generated/en.json') : import('./generated/ja.json');
      this.loading[l] = loader.then((mod: any) => {
        const dict: Record<string, string> = mod.default || mod;
        this.generated[l] = dict;
        const pats: { re: RegExp; frag: string; tpl: string }[] = [];
        for (const key of Object.keys(dict)) {
          if (!/\{\d+\}/.test(key)) continue;
          const parts = key.split(/\{\d+\}/);
          const esc = parts.map(p => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
          const re = new RegExp('^' + esc.join('(.+?)') + '$', 's');
          const frag = parts.reduce((a, b) => (b.length > a.length ? b : a), '');
          pats.push({ re, frag, tpl: dict[key] });
          // 캡처 순서와 {N} 번호가 다를 수 있으므로 key의 {N} 순서를 보관
          (pats[pats.length - 1] as any).order = (key.match(/\{(\d+)\}/g) || []).map(s => Number(s.slice(1, -1)));
        }
        pats.sort((a, b) => b.frag.length - a.frag.length);
        this.patterns[l] = pats;
      }).catch((e) => { console.warn('[i18n] dictionary load failed', e); });
    }
    return this.loading[l]!;
  }

  public setLanguage(lang: SupportedLanguage): void {
    if (this.currentLanguage === lang) return;
    this.currentLanguage = lang;
    try {
      localStorage.setItem('limbo_language', lang);
    } catch (_) {}
    this.translationCache.clear();
    const apply = () => {
      this.translationCache.clear();
      this.retranslateWholeDom();
      this.listeners.forEach((fn) => fn(lang));
    };
    if (lang === 'ko') apply();
    else this.ensureLoaded(lang).then(apply);
  }

  /** 생성 번역표 기반 조회 (완전 일치 → {N} 템플릿 패턴) */
  private lookupGenerated(text: string, l: 'en' | 'ja', depth = 0): string | null {
    const dict = this.generated[l];
    if (!dict) return null;
    const norm = text.replace(/\s+/g, ' ').trim();
    const hit = dict[norm];
    if (hit !== undefined) return hit;
    if (depth > 2) return null;
    const pats = this.patterns[l] || [];
    for (const p of pats as any[]) {
      if (!norm.includes(p.frag)) continue;
      const m = norm.match(p.re);
      if (!m) continue;
      const vals: Record<number, string> = {};
      p.order.forEach((n: number, i: number) => {
        const v = m[i + 1];
        vals[n] = /[\uac00-\ud7af]/.test(v) ? (this.lookupGenerated(v, l, depth + 1) ?? this.trFallback(v, l)) : v;
      });
      return (p.tpl as string).replace(/\{(\d+)\}/g, (_: string, n: string) => vals[Number(n)] ?? '');
    }
    return null;
  }

  private trFallback(text: string, l: 'en' | 'ja'): string {
    return this.tr(text, l);
  }

  public subscribe(listener: (lang: SupportedLanguage) => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((fn) => fn !== listener);
    };
  }

  /** 번역 키 기반 텍스트 추출 함수 (예: t('common.confirm')) */
  public t(path: string, params?: Record<string, string | number>): string {
    const keys = path.split('.');
    const dict = this.dictionaries[this.currentLanguage] || koDictionary;
    const fallbackDict = koDictionary;

    let value: any = dict;
    for (const key of keys) {
      value = value?.[key];
    }

    if (value === undefined) {
      let fallbackVal: any = fallbackDict;
      for (const key of keys) {
        fallbackVal = fallbackVal?.[key];
      }
      value = fallbackVal;
    }

    if (typeof value !== 'string') {
      return path;
    }

    if (params) {
      return Object.entries(params).reduce((acc, [k, v]) => {
        return acc.replace(new RegExp(`{${k}}`, 'g'), String(v));
      }, value);
    }

    return value;
  }

  public getDict(): TranslationDictionary {
    return this.dictionaries[this.currentLanguage] || koDictionary;
  }

  /**
   * 임의의 한국어 문자열을 현재(또는 지정된) 언어로 자동 번역하는 범용 번역 엔진
   */
  public tr(text: string, targetLang?: SupportedLanguage): string {
    if (!text || typeof text !== 'string') return text;
    const lang = targetLang || this.currentLanguage;
    if (lang === 'ko') return text;
    if (!/[\uac00-\ud7af]/.test(text)) return text; // 한글 미포함 시 즉시 반환

    const cacheKey = `${lang}:${text}`;
    if (this.translationCache.has(cacheKey)) {
      return this.translationCache.get(cacheKey)!;
    }

    const trimmed = text.trim();

    const tLang = (lang === 'ja' ? 'ja' : 'en') as 'en' | 'ja';

    // 0. 빌드 생성 전체 문장 번역표 (정확 일치 + {N} 템플릿)
    const gen = this.lookupGenerated(text, tLang);
    if (gen !== null) {
      const lead = text.match(/^\s*/)![0];
      const trail = text.match(/\s*$/)![0];
      const res = lead + gen + trail;
      if (this.translationCache.size > 8000) this.translationCache.clear();
      this.translationCache.set(cacheKey, res);
      return res;
    }

    // 1. 완전 일치 사전 (Exact Match)
    const exact = EXACT_TRANSLATIONS[tLang]?.[trimmed];
    if (exact) {
      const res = text.replace(trimmed, exact);
      this.translationCache.set(cacheKey, res);
      return res;
    }

    // 2. 동적 전투/탐험 로그 정규식 패턴 검사
    for (const p of LOG_PATTERNS) {
      const match = text.match(p.pattern);
      if (match) {
        const res = tLang === 'ja' ? p.ja(match) : p.en(match);
        this.translationCache.set(cacheKey, res);
        return res;
      }
    }

    // 3. 부분 어휘 및 엔티티 치환 (자원, 시설, 클래스 등)
    let transformed = text;
    const dict = EXACT_TRANSLATIONS[tLang] || {};

    for (const [k, v] of Object.entries(dict)) {
      if (k.length >= 2 && transformed.includes(k)) {
        transformed = transformed.split(k).join(v);
      }
    }

    // 자원명 치환
    for (const [_, map] of Object.entries(RESOURCE_NAMES)) {
      const koName = map.ko;
      const targetName = map[lang] || koName;
      if (koName && targetName && transformed.includes(koName)) {
        transformed = transformed.split(koName).join(targetName);
      }
    }

    // 시설명 치환
    for (const [_, map] of Object.entries(BUILDING_NAMES)) {
      const koName = map.ko?.name;
      const targetName = map[lang]?.name || koName;
      if (koName && targetName && transformed.includes(koName)) {
        transformed = transformed.split(koName).join(targetName);
      }
    }

    // 직업명 치환
    for (const [_, map] of Object.entries(CLASS_NAMES)) {
      const koName = map.ko?.name;
      const targetName = map[lang]?.name || koName;
      if (koName && targetName && transformed.includes(koName)) {
        transformed = transformed.split(koName).join(targetName);
      }
    }

    // 조사 정리 (한국어 조사 제거)
    if (lang === 'en') {
      transformed = transformed
        .replace(/이\(가\)/g, '')
        .replace(/을\(를\)/g, '')
        .replace(/은\(는\)/g, '')
        .replace(/(?:을|를|이|가|은|는|에|에게|의|로|으로)\s+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    } else if (lang === 'ja') {
      transformed = transformed
        .replace(/이\(가\)/g, 'が')
        .replace(/을\(를\)/g, 'を')
        .replace(/은\(는\)/g, 'は')
        .trim();
    }

    this.translationCache.set(cacheKey, transformed);
    return transformed;
  }

  private static readonly HANGUL = /[\uac00-\ud7af]/;
  private static readonly ATTRS = ['placeholder', 'title', 'alt', 'aria-label'];
  private static readonly SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'CODE']);

  /** 텍스트 노드 하나를 현재 언어에 맞춰 번역/복원 (원문은 __origKo 에 보존) */
  private syncTextNode(textNode: Text, fromMutation: boolean): void {
    const n = textNode as any;
    const val = textNode.nodeValue || '';
    if (fromMutation && n.__lastTr !== undefined && val === n.__lastTr) return; // 우리가 쓴 값
    if (this.currentLanguage === 'ko') {
      if (n.__origKo !== undefined && !fromMutation) {
        textNode.nodeValue = n.__origKo;
      }
      if (!fromMutation) { delete n.__origKo; delete n.__lastTr; }
      else if (I18nService.HANGUL.test(val)) { delete n.__origKo; delete n.__lastTr; }
      return;
    }
    // 외부(React)가 새 값을 썼다면 그것이 새 원문
    let src: string;
    if (fromMutation || n.__origKo === undefined) src = val;
    else src = n.__origKo;
    if (!I18nService.HANGUL.test(src)) {
      if (fromMutation) { delete n.__origKo; delete n.__lastTr; }
      return;
    }
    n.__origKo = src;
    const translated = this.tr(src, this.currentLanguage);
    n.__lastTr = translated;
    if (translated !== val) textNode.nodeValue = translated;
  }

  /** 요소의 번역 대상 속성(placeholder/title/alt/aria-label) 처리 */
  private syncAttrs(el: Element, onlyAttr?: string): void {
    const e = el as any;
    for (const a of I18nService.ATTRS) {
      if (onlyAttr && onlyAttr !== a) continue;
      if (!el.hasAttribute(a)) continue;
      const key = '__orig_' + a;
      const lastKey = '__last_' + a;
      const cur = el.getAttribute(a) || '';
      if (onlyAttr && e[lastKey] !== undefined && cur === e[lastKey]) continue;
      if (this.currentLanguage === 'ko') {
        if (e[key] !== undefined && !onlyAttr) el.setAttribute(a, e[key]);
        if (!onlyAttr || I18nService.HANGUL.test(cur)) { delete e[key]; delete e[lastKey]; }
        continue;
      }
      const src = (onlyAttr || e[key] === undefined) ? cur : e[key];
      if (!I18nService.HANGUL.test(src)) continue;
      e[key] = src;
      const tr = this.tr(src, this.currentLanguage);
      e[lastKey] = tr;
      if (tr !== cur) el.setAttribute(a, tr);
    }
  }

  private walkDom(node: Node): void {
    if (node.nodeType === Node.TEXT_NODE) {
      this.syncTextNode(node as Text, false);
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      if (I18nService.SKIP_TAGS.has(el.tagName)) return;
      this.syncAttrs(el);
      for (let c = el.firstChild; c; c = c.nextSibling) this.walkDom(c);
    }
  }

  /** 실시간 DOM 텍스트/속성 자동 번역 옵저버 초기화 */
  public initDomTranslator(): void {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (this.domObserver) return;

    const handle = (mutations: MutationRecord[]) => {
      if (this.currentLanguage === 'ko') return;
      for (const mut of mutations) {
        if (mut.type === 'childList') {
          mut.addedNodes.forEach((node) => this.walkDom(node));
        } else if (mut.type === 'characterData') {
          if (mut.target.nodeType === Node.TEXT_NODE) this.syncTextNode(mut.target as Text, true);
        } else if (mut.type === 'attributes' && mut.attributeName) {
          this.syncAttrs(mut.target as Element, mut.attributeName);
        }
      }
    };

    this.domObserver = new MutationObserver(handle);
    this.domObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true,
      attributes: true,
      attributeFilter: I18nService.ATTRS,
    });

    if (this.currentLanguage !== 'ko') {
      this.ensureLoaded(this.currentLanguage).then(() => {
        this.translationCache.clear();
        this.retranslateWholeDom();
        this.listeners.forEach((fn) => fn(this.currentLanguage));
      });
    }
  }

  /** DOM 전체를 현재 언어로 번역 / 한국어 복원 */
  public retranslateWholeDom(): void {
    if (typeof document === 'undefined') return;
    this.walkDom(document.body);
  }
}
