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

  private updateDocumentLang(lang: SupportedLanguage): void {
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = lang;
      document.documentElement.setAttribute('data-lang', lang);
    }
  }

  private constructor() {
    try {
      const savedLang = localStorage.getItem('limbo_language') as SupportedLanguage;
      if (savedLang && (savedLang === 'ko' || savedLang === 'en' || savedLang === 'ja')) {
        this.currentLanguage = savedLang;
        this.updateDocumentLang(savedLang);
        if (savedLang !== 'ko') {
          this.ensureLoaded(savedLang).then(() => {
            this.translationCache.clear();
            this.retranslateWholeDom();
            this.listeners.forEach((fn) => fn(savedLang));
          });
        }
      } else {
        this.updateDocumentLang(this.currentLanguage);
      }
    } catch (_) {
      this.updateDocumentLang(this.currentLanguage);
    }
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

  public getCurrentLanguage(): SupportedLanguage {
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
          const fixedText = parts.join('').trim();
          // 너무 짧거나 조사 단독으로 매칭되어 일반 명사구를 파괴하는 위험 패턴 방지
          if (fixedText.length <= 1) continue;
          if (['의', '는', '은', '이', '가', '을', '를', '에', '와', '과', '에게', '에서', '으로', '로', '하고', '하며', '하여', '에도', '까지', '부터'].includes(fixedText)) continue;
          // 와일드카드만 많고 고정 텍스트가 극히 빈약한 패턴 필터링
          if ((key.match(/\{\d+\}/g) || []).length >= 2 && fixedText.length < 4) continue;
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
    this.updateDocumentLang(lang);
    try {
      localStorage.setItem('limbo_language', lang);
    } catch (_) {}
    this.translationCache.clear();
    const apply = () => {
      this.updateDocumentLang(lang);
      this.translationCache.clear();
      this.retranslateWholeDom();
      this.listeners.forEach((fn) => fn(lang));
    };
    if (lang === 'ko') apply();
    else this.ensureLoaded(lang).then(apply);
  }

  /** 1. 생성 번역표 기반 완전 일치 조회 */
  private lookupGeneratedExact(text: string, l: 'en' | 'ja'): string | null {
    const dict = this.generated[l];
    if (!dict) return null;
    const norm = text.replace(/\s+/g, ' ').trim();
    const hit = dict[text] ?? dict[text.trim()] ?? dict[norm];
    return hit !== undefined ? hit : null;
  }

  /** 2. 생성 번역표 기반 {N} 템플릿 패턴 매칭 (완전 일치 미매칭 시에만) */
  private lookupGeneratedPattern(text: string, l: 'en' | 'ja', depth = 0): string | null {
    if (depth > 2) return null;
    const norm = text.replace(/\s+/g, ' ').trim();
    // 문장이 길고 마침표가 여러 개 있는 복합 단락은 와일드카드 템플릿으로 함부로 분해하지 않음
    if (norm.length > 80 && (norm.match(/\./g) || []).length >= 2) return null;

    const pats = this.patterns[l] || [];
    for (const p of pats as any[]) {
      if (!norm.includes(p.frag)) continue;
      const m = norm.match(p.re);
      if (!m) continue;
      const vals: Record<number, string> = {};
      p.order.forEach((n: number, i: number) => {
        const v = m[i + 1];
        vals[n] = /[\uac00-\ud7af]/.test(v) ? (this.lookupGeneratedExact(v, l) ?? this.lookupGeneratedPattern(v, l, depth + 1) ?? this.trFallback(v, l)) : v;
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

    // 1. 빌드 생성 전체 문장 번역표 (정확 완전 일치)
    const exactGen = this.lookupGeneratedExact(text, tLang);
    if (exactGen !== null) {
      const lead = text.match(/^\s*/)![0];
      const trail = text.match(/\s*$/)![0];
      const res = lead + exactGen + trail;
      if (this.translationCache.size > 8000) this.translationCache.clear();
      this.translationCache.set(cacheKey, res);
      return res;
    }

    // 2. 완전 일치 사전 (Exact Match)
    const exact = EXACT_TRANSLATIONS[tLang]?.[trimmed] ?? EXACT_TRANSLATIONS[tLang]?.[text];
    if (exact) {
      const res = text.replace(trimmed, exact);
      this.translationCache.set(cacheKey, res);
      return res;
    }

    // 2.01 빌드 생성 {N} 템플릿 패턴 매칭 (완전 일치 미매칭 시에만)
    const genPattern = this.lookupGeneratedPattern(text, tLang);
    if (genPattern !== null) {
      const lead = text.match(/^\s*/)![0];
      const trail = text.match(/\s*$/)![0];
      const res = lead + genPattern + trail;
      if (this.translationCache.size > 8000) this.translationCache.clear();
      this.translationCache.set(cacheKey, res);
      return res;
    }

    // 2.05 복합 로그 분할 번역 (화살표 ➔ 또는 파이프 | 로 결합된 복합 다중 피격/원호 로그 - 전체 문장 미매칭 시 분할)
    if (text.includes(' ➔ ')) {
      const parts = text.split(' ➔ ');
      const res = parts.map(part => this.tr(part, lang)).join(' ➔ ');
      this.translationCache.set(cacheKey, res);
      return res;
    }

    if (text.includes(' | ')) {
      const parts = text.split(' | ');
      const res = parts.map(part => this.tr(part, lang)).join(' | ');
      this.translationCache.set(cacheKey, res);
      return res;
    }

    // 2.1 몬스터 식별 알파벳 접미사 (예: "종언의 제단 광신도 A")
    const alphaSuffixMatch = trimmed.match(/^(.+?)\s+([A-Z])$/);
    if (alphaSuffixMatch) {
      const baseName = alphaSuffixMatch[1].trim();
      const suffix = alphaSuffixMatch[2];
      const trBase = this.tr(baseName, lang);
      if (trBase && trBase !== baseName) {
        const res = text.replace(trimmed, `${trBase} ${suffix}`);
        this.translationCache.set(cacheKey, res);
        return res;
      }
    }

    // 2.2 대괄호 태그 분리 번역 (예: "[아이리스]", "[궁극기]")
    const bracketMatch = trimmed.match(/^\[(.+?)\]$/);
    if (bracketMatch) {
      const inner = bracketMatch[1].trim();
      const trInner = this.tr(inner, lang);
      if (trInner && trInner !== inner) {
        const res = text.replace(trimmed, `[${trInner}]`);
        this.translationCache.set(cacheKey, res);
        return res;
      }
    }

    // 2.3 스킬 특수 접두 태그 (예: "[궁극기] 종언의 메테오", "★[궁극기] 메테오")
    const skillPrefixMatch = trimmed.match(/^(\★?\[(?:궁극기|고유기)\])\s*(.+)$/);
    if (skillPrefixMatch) {
      const prefix = skillPrefixMatch[1].trim();
      const skillName = skillPrefixMatch[2].trim();
      const trPrefix = this.tr(prefix, lang);
      const trSkill = this.tr(skillName, lang);
      const res = text.replace(trimmed, `${trPrefix} ${trSkill}`);
      this.translationCache.set(cacheKey, res);
      return res;
    }

    // 2.35 대괄호 상태/장비 접두 태그 분리 번역 (예: "[침식된] 수습 대장장이의 철검", "[저주받은] 단검", "[전설] 흑철 검")
    const bracketPrefixMatch = trimmed.match(/^(\[[^\]]+\])\s*(.+)$/);
    if (bracketPrefixMatch) {
      const prefix = bracketPrefixMatch[1].trim();
      const restText = bracketPrefixMatch[2].trim();
      // 긴 줄글/시스템 로그가 아닌 아이템명 또는 짧은 상태명 형태인 경우 (50자 이하)
      if (!restText.includes('\n') && restText.length <= 50) {
        const trPrefix = this.tr(prefix, lang);
        const trRest = this.tr(restText, lang);
        if ((trPrefix && trPrefix !== prefix) || (trRest && trRest !== restText)) {
          const res = text.replace(trimmed, `${trPrefix} ${trRest}`);
          this.translationCache.set(cacheKey, res);
          return res;
        }
      }
    }

    // 3. 동적 전투/탐험 로그 정규식 패턴 검사
    for (const p of LOG_PATTERNS) {
      const match = text.match(p.pattern);
      if (match) {
        const res = tLang === 'ja' ? p.ja(match) : p.en(match);
        this.translationCache.set(cacheKey, res);
        return res;
      }
    }

    // 2.5 전투 로그 전용 지능형 시맨틱 폴백 (미등록/동적 로그 전수 번역)
    const fallbackBattleLog = this.translateBattleLogFallback(text, tLang);
    if (fallbackBattleLog && !/[\uac00-\ud7af]/.test(fallbackBattleLog)) {
      this.translationCache.set(cacheKey, fallbackBattleLog);
      return fallbackBattleLog;
    }

    // 3. 부분 어휘 및 엔티티 치환 (자원, 시설, 클래스 등)
    let transformed = fallbackBattleLog || text;
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

  /**
   * 정규식 패턴에 걸리지 않은 미등록/동적 전투 로그를 위한 지능형 시맨틱 번역 폴백
   */
  private translateBattleLogFallback(text: string, lang: 'en' | 'ja'): string | null {
    // 전투 로그 특징: 특수 기호나 이모지, 대괄호 태그, 턴/라운드 등 전투 관련 키워드 포함
    const isBattleLogLike = /[\u{1F300}-\u{1FAFF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/u.test(text)
      || /\[.+?\]/.test(text)
      || /(?:피해|체력|마나|보호막|기절|빙결|화상|출혈|맹독|치유|회복|버프|디버프|시너지|라운드|턴|그로기|차징|부활)/.test(text);

    if (!isBattleLogLike) return null;

    let res = text;

    // 1. 긴 전투 구문 및 서술어 치환 (길이가 긴 것부터 순차 치환)
    const BATTLE_PREDICATES: { ko: string; en: string; ja: string }[] = [
      { ko: '광폭화 결계로 인해 전투에서 철수할 수 없습니다!', en: 'Frenzy barrier prevents retreat from battle!', ja: '暴走結界により戦闘から撤退できません！' },
      { ko: '적의 추격을 뿌리치고 안전하게 후퇴했습니다.', en: 'Safely escaped enemy pursuit and retreated.', ja: '敵の追撃を振り切り無事に撤退しました。' },
      { ko: '퇴로가 막혀 도주에 실패했습니다!', en: 'Escape path was blocked; retreat failed!', ja: '退路を塞がれ逃走に失敗しました！' },
      { ko: '동료의 영혼이 영겁의 어둠 속으로 흩어집니다.', en: 'Companion soul disperses into the endless dark.', ja: '仲間の魂が永劫の闇へと散っていきます。' },
      { ko: '대원의 맥박이 완전히 멎었습니다...', en: 'pulse completely stopped...', ja: '脈拍が完全に停止しました…' },
      { ko: '남은 시간이 얼마 없습니다!', en: 'Time is running out!', ja: '残された時間はわずかです！' },
      { ko: '차가운 바닥에 쓰러졌습니다!', en: 'collapsed onto the cold ground!', ja: '冷たい床に倒れました！' },
      { ko: '기적처럼 HP', en: 'miraculously with HP', ja: '奇跡のようにHP' },
      { ko: '사경을 헤매던', en: 'critically injured', ja: '死線を彷徨っていた' },
      { ko: '극적 소생시켰습니다!', en: 'dramatically revived!', ja: '劇的に蘇生させました！' },
      { ko: '완전 치유했습니다!', en: 'fully healed!', ja: '完全治癒しました！' },
      { ko: '완전 초기화했습니다!', en: 'completely reset!', ja: '完全初期化しました！' },
      { ko: '완전 정화했습니다!', en: 'completely cleansed!', ja: '完全浄化しました！' },
      { ko: '완전히 저항해냈습니다!', en: 'completely resisted!', ja: '完全に抵抗しました！' },
      { ko: '완전히 차단했습니다!', en: 'completely blocked!', ja: '完全に遮断しました！' },
      { ko: '완전히 흡수했습니다!', en: 'completely absorbed!', ja: '完全に吸収しました！' },
      { ko: '파티 전원에게 치유로 환원했습니다!', en: 'converted to party heal!', ja: '味方全員の回復に還元！' },
      { ko: '대신 받아', en: 'intercepted, taking', ja: '身代わりとなり' },
      { ko: '치유로 환원했습니다!', en: 'converted to healing!', ja: '回復に還元しました！' },
      { ko: '지속 재생을 부여했습니다!', en: 'granted continuous regen!', ja: '継続リジェネを付与しました！' },
      { ko: '보호막을 부여했습니다!', en: 'granted barrier!', ja: 'シールドを付与しました！' },
      { ko: '보호막을 전개했습니다!', en: 'deployed barrier!', ja: 'シールドを展開しました！' },
      { ko: '결계를 전개했습니다!', en: 'deployed barrier!', ja: '結界を展開しました！' },
      { ko: '방벽을 전개했습니다!', en: 'deployed absorption wall!', ja: '防壁を展開しました！' },
      { ko: '상태이상 효과를 부여했습니다!', en: 'inflicted status effect!', ja: '状態異常を付与しました！' },
      { ko: '효과를 부여했습니다!', en: 'granted effect!', ja: '効果を付与しました！' },
      { ko: '상태이상을 부여했습니다!', en: 'inflicted status condition!', ja: '状態異常を付与しました！' },
      { ko: '추가 피해를 입혔습니다!', en: 'dealt bonus damage!', ja: '追加ダメージを与えました！' },
      { ko: '치명 피해를 입혔습니다!', en: 'dealt critical damage!', ja: '会心ダメージを与えました！' },
      { ko: '피해를 입혔습니다!', en: 'dealt damage!', ja: 'ダメージを与えました！' },
      { ko: '피해 직격!', en: 'Direct hit damage!', ja: '直撃ダメージ！' },
      { ko: '증폭 피해!', en: 'Amplified damage!', ja: '増幅ダメージ！' },
      { ko: '회복되었습니다.', en: 'was restored.', ja: '回復しました。' },
      { ko: '회복되었습니다!', en: 'was restored!', ja: '回復しました！' },
      { ko: '회복했습니다!', en: 'restored!', ja: '回復しました！' },
      { ko: '치유되었습니다!', en: 'was healed!', ja: '回復しました！' },
      { ko: '치유했습니다!', en: 'healed!', ja: '回復しました！' },
      { ko: '소멸했습니다.', en: 'dissipated.', ja: '消滅しました。' },
      { ko: '부활했습니다!', en: 'revived!', ja: '復活しました！' },
      { ko: '발동했습니다!', en: 'activated!', ja: '発動しました！' },
      { ko: '분쇄되었습니다!', en: 'was shattered!', ja: '粉砕されました！' },
      { ko: '분쇄했습니다!', en: 'shattered!', ja: '粉砕しました！' },
      { ko: '증폭되었습니다!', en: 'amplified!', ja: '増幅しました！' },
      { ko: '증폭했습니다!', en: 'amplified!', ja: '増幅しました！' },
      { ko: '감소시켰습니다!', en: 'reduced!', ja: '減少させました！' },
      { ko: '감소했습니다!', en: 'decreased!', ja: '減少しました！' },
      { ko: '상승했습니다!', en: 'increased!', ja: '上昇しました！' },
      { ko: '상승합니다!', en: 'increases!', ja: '上昇します！' },
      { ko: '완충했습니다!', en: 'fully recharged!', ja: '満充填しました！' },
      { ko: '충전합니다.', en: 'charges.', ja: '充填します。' },
      { ko: '충전했습니다!', en: 'charged!', ja: '充填しました！' },
      { ko: '단축했습니다!', en: 'shortened!', ja: '短縮しました！' },
      { ko: '환급받았습니다!', en: 'refunded!', ja: '還元されました！' },
      { ko: '회피했습니다!', en: 'evaded!', ja: '回避しました！' },
      { ko: '방출합니다!', en: 'unleashes!', ja: '放ちます！' },
      { ko: '버텨냅니다!', en: 'endures!', ja: '耐え抜きます！' },
      { ko: '이동했습니다!', en: 'moved to!', ja: '移動しました！' },
      { ko: '해제되었습니다!', en: 'was removed!', ja: '解除されました！' },
      { ko: '취소되었습니다!', en: 'was cancelled!', ja: '中断されました！' },
      { ko: '봉쇄되었습니다!', en: 'was blocked!', ja: '封鎖されました！' },
      { ko: '무효화되었습니다!', en: 'was nullified!', ja: '無効化されました！' },
      { ko: '전투 승리!', en: 'Battle Victory!', ja: '戦闘勝利！' },
      { ko: '전투 패배...', en: 'Battle Defeat...', ja: '戦闘敗北…' },
      { ko: '전투 재개', en: 'Resume Battle', ja: '戦闘再開' },
      { ko: '라운드', en: 'Round', ja: 'ラウンド' },
      { ko: '턴', en: 'Turn', ja: 'ターン' },
      { ko: '파티 전원', en: 'Entire Party', ja: 'パーティ全員' },
      { ko: '파티 전체', en: 'Entire Party', ja: 'パーティ全体' },
      { ko: '아군 전원', en: 'All Allies', ja: '味方全員' },
      { ko: '아군 전체', en: 'All Allies', ja: '味方全体' },
      { ko: '생존 아군 전원', en: 'Surviving Allies', ja: '生存味方全員' },
      { ko: '적 전체', en: 'All Enemies', ja: '敵全体' },
      { ko: '적 전열', en: 'Enemy Frontline', ja: '敵前列' },
      { ko: '전열 아군', en: 'Frontline Allies', ja: '前列味方' },
      { ko: '행동 불가', en: 'Immobilized', ja: '行動不能' },
      { ko: '지속 피해', en: 'DoT', ja: '継続ダメージ' },
      { ko: '치명 피해', en: 'Crit DMG', ja: '会心ダメージ' },
      { ko: '순수 피해', en: 'Pure DMG', ja: '純粋ダメージ' },
      { ko: '마도 피해', en: 'Magic DMG', ja: '魔導ダメージ' },
      { ko: '추가 피해', en: 'Bonus DMG', ja: '追加ダメージ' },
      { ko: '공격력', en: 'ATK', ja: '攻撃力' },
      { ko: '방어력', en: 'DEF', ja: '防御力' },
      { ko: '행동력', en: 'Action SPD', ja: '行動力' },
      { ko: '명중률', en: 'Accuracy', ja: '命中率' },
      { ko: '회피율', en: 'Evasion', ja: '回避率' },
      { ko: '치명타율', en: 'Crit Rate', ja: '会心率' },
      { ko: '보호막', en: 'Barrier', ja: 'シールド' },
      { ko: '자가 회복', en: 'self recovery', ja: '自己回復' },
      { ko: '흡혈', en: 'Lifesteal', ja: '吸血' },
      { ko: '그로기', en: 'Groggy', ja: 'グロッキー' },
      { ko: '차징', en: 'Charging', ja: 'チャージ' },
      { ko: '브레이크', en: 'Break', ja: 'ブレイク' },
      { ko: '출혈', en: 'Bleed', ja: '出血' },
      { ko: '화상', en: 'Burn', ja: '火傷' },
      { ko: '빙결', en: 'Freeze', ja: '凍結' },
      { ko: '냉각', en: 'Chill', ja: '冷却' },
      { ko: '동상', en: 'Frostbite', ja: '凍傷' },
      { ko: '맹독', en: 'Poison', ja: '猛毒' },
      { ko: '기절', en: 'Stun', ja: '気絶' },
      { ko: '실명', en: 'Blind', ja: '暗闇' },
      { ko: '침묵', en: 'Silence', ja: '沈黙' },
      { ko: '은신', en: 'Stealth', ja: '潜伏' },
    ];

    for (const item of BATTLE_PREDICATES) {
      if (res.includes(item.ko)) {
        res = res.split(item.ko).join(lang === 'ja' ? item.ja : item.en);
      }
    }

    return res;
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
