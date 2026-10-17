/**
 * ═════════════════════════════════════════════════════════════════════════
 *  🎨 CustomAssetService: 외부 에셋(아이콘, BGM, SFX, 이펙트, 던전/몬스터/용병 미디어) 로더 및 모드 전환 서비스
 * ═════════════════════════════════════════════════════════════════════════
 *  - 원클릭 순수 이모지(Pure Emoji) 모드 <-> 커스텀 64x64 에셋 모드 전환
 *  - 개별 아이콘(자원, 장비, 상태이상, 건물, 보급품, 스킬, 마도서) URL/DataURI 오버라이드
 *  - BGM(성채, 던전, 전투, 보스) 및 SFX(29종) 커스텀 오디오 URL 오버라이드
 *  - 스킬 이펙트 (VFX) 스프라이트 / GIF / WebP 애니메이션 오버라이드
 *  - 던전 1~10층 배경 이미지 / GIF / 비디오 오버라이드
 *  - 몬스터 / 보스 스탠딩 이미지, GIF 및 보스 컷신 영상(MP4/WebM) 오버라이드
 *  - 용병 클래스 / 영웅별 초상화 및 일러스트 오버라이드
 *  - JSON 프리셋 내보내기/가져오기 및 IndexedDB 영속화
 */

import { NPC_NAME_TO_ID, NPC_ID_TO_NAME } from '../data/npcs';

export interface SpriteSheetConfig {
  cols: number;
  rows: number;
  totalFrames?: number;
  duration?: number; // ms
}

export interface AssetConfigData {
  pureEmojiMode: boolean;
  syntheticAudioOnly: boolean;
  iconOverrides: Record<string, string>;
  bgmOverrides: Record<string, string>;
  sfxOverrides: Record<string, string>;
  vfxOverrides: Record<string, string>;
  vfxConfigs?: Record<string, SpriteSheetConfig>;
  dungeonFloorOverrides: Record<string, string>;
  monsterOverrides: Record<string, string>;
  monsterVideoOverrides: Record<string, string>;
  mercenaryOverrides: Record<string, string>;
  npcOverrides?: Record<string, string>;
  version: number;
}

type EventListener = (data?: unknown) => void;

const LEGACY_STORAGE_KEY = 'limbo_custom_assets_config_v1';
const IDB_DB_NAME = 'limbo_custom_assets_idb';
const IDB_STORE_NAME = 'assets_store';
const IDB_KEY = 'custom_assets_config';

export class CustomAssetService {
  private static instance: CustomAssetService | null = null;
  private listeners: Map<string, Set<EventListener>> = new Map();
  private isInitialized = false;

  private config: AssetConfigData = {
    pureEmojiMode: false,
    syntheticAudioOnly: false,
    iconOverrides: {},
    bgmOverrides: {},
    sfxOverrides: {},
    vfxOverrides: {},
    vfxConfigs: {},
    dungeonFloorOverrides: {},
    monsterOverrides: {},
    monsterVideoOverrides: {},
    mercenaryOverrides: {},
    npcOverrides: {},
    version: 1,
  };

  private constructor() {
    this.initStorage();
  }

  public static getInstance(): CustomAssetService {
    if (!CustomAssetService.instance) {
      CustomAssetService.instance = new CustomAssetService();
    }
    return CustomAssetService.instance;
  }

  public static getIconOverride(key: string): string | undefined {
    return CustomAssetService.getInstance().getIconOverride(key);
  }

  public static getBgmOverride(scene: string): string | undefined {
    return CustomAssetService.getInstance().getBgmOverride(scene);
  }

  public static getSfxOverride(key: string): string | undefined {
    return CustomAssetService.getInstance().getSfxOverride(key);
  }

  public static getVfxOverride(type: string): string | undefined {
    return CustomAssetService.getInstance().getVfxOverride(type);
  }

  public static getVfxConfig(type: string): SpriteSheetConfig | undefined {
    return CustomAssetService.getInstance().getVfxConfig(type);
  }

  public static getMonsterOverride(id: string): string | undefined {
    return CustomAssetService.getInstance().getMonsterOverride(id);
  }

  public static getMercenaryOverride(idOrClass: string): string | undefined {
    return CustomAssetService.getInstance().getMercenaryOverride(idOrClass);
  }

  public static getNpcOverride(nameOrId: string): string | undefined {
    return CustomAssetService.getInstance().getNpcOverride(nameOrId);
  }

  public static getElainePortrait(emotion: 'normal' | 'serious' | 'smile' | 'worry' = 'normal'): string {
    return CustomAssetService.getInstance().getElainePortrait(emotion);
  }

  // ── 이벤트 리스너 ──────────────────────────────────────────────────────────
  public on(event: string, fn: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(fn);
  }

  public off(event: string, fn: EventListener): void {
    this.listeners.get(event)?.delete(fn);
  }

  /** React useSyncExternalStore 구독 인터페이스 */
  public subscribe(callback: () => void): () => void {
    this.on('changed', callback);
    return () => this.off('changed', callback);
  }

  private emit(event: string, data?: unknown): void {
    this.listeners.get(event)?.forEach(fn => {
      try {
        fn(data);
      } catch (err) {
        console.error(`[CustomAssetService] Error in listener for ${event}:`, err);
      }
    });
  }

  // ── IndexedDB 헬퍼 ────────────────────────────────────────────────────────
  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported'));
      }
      const req = window.indexedDB.open(IDB_DB_NAME, 2);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async getFromIdb(): Promise<AssetConfigData | null> {
    try {
      const db = await this.openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE_NAME, 'readonly');
        const store = tx.objectStore(IDB_STORE_NAME);
        const req = store.get(IDB_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[CustomAssetService] IndexedDB read error:', e);
      return null;
    }
  }

  private async saveToIdb(data: AssetConfigData): Promise<void> {
    try {
      const db = await this.openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
        const store = tx.objectStore(IDB_STORE_NAME);
        const req = store.put(data, IDB_KEY);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error('[CustomAssetService] IndexedDB write error:', e);
    }
  }

  // ── 초기화 및 마이그레이션 ─────────────────────────────────────────────────
  private async initStorage(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // 1. 레거시 localStorage 에셋 데이터 확인 (이전 버전 호환 및 마이그레이션)
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      let legacyData: AssetConfigData | null = null;
      if (legacyRaw) {
        try {
          legacyData = JSON.parse(legacyRaw);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
          console.info('✨ [CustomAssetService] 레거시 localStorage 에셋을 IndexedDB로 마이그레이션 완료.');
        } catch (_) {}
      }

      // 2. IndexedDB에서 사용자 기기 로컬 에셋 데이터 로드
      let saved = await this.getFromIdb();
      if (!saved && legacyData) {
        saved = legacyData;
        await this.saveToIdb(saved);
      }

      // 3. 배포용 정적 프리셋(assets/custom_assets_preset.json) 항상 탐색 (모바일/Capacitor/웹 서브경로 호환)
      let staticPreset: Partial<AssetConfigData> = {};
      const basePrefix = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL)
        ? import.meta.env.BASE_URL.replace(/\/$/, '') + '/'
        : '';
      const candidateUrls = [
        `${basePrefix}assets/custom_assets_preset.json`,
        'assets/custom_assets_preset.json',
        './assets/custom_assets_preset.json',
        '/assets/custom_assets_preset.json'
      ];

      for (const url of candidateUrls) {
        try {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            if (data && typeof data === 'object') {
              staticPreset = data;
              break;
            }
          }
        } catch (_) {}
      }

      // 4. Two-Tier Merge: 배포 정적 프리셋(기본) + 기기 로컬 IndexedDB 사용자 오버라이드
      // (사용자가 특정 아이콘을 'emoji'로 복원/초기화한 설정도 온전히 유지)
      const mergedOverrides = { ...(staticPreset.iconOverrides || {}), ...(saved?.iconOverrides || {}) };

      const mergedVfxOverrides = { ...(staticPreset.vfxOverrides || {}), ...(saved?.vfxOverrides || {}) };
      // 🛡️ 레거시 고정 저해상도 base64 플레이스홀더 정리 (배포 정적 스프라이트 에셋이 존재하면 우선 적용)
      for (const [k, v] of Object.entries(staticPreset.vfxOverrides || {})) {
        if (v && !v.startsWith('data:') && (!mergedVfxOverrides[k] || mergedVfxOverrides[k].startsWith('data:image/png;base64,iVBORw0KGgoAAA') || mergedVfxOverrides[k].startsWith('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4'))) {
          mergedVfxOverrides[k] = v;
        }
      }

      const mergedMonsterOverrides = { ...(staticPreset.monsterOverrides || {}) };
      if (saved?.monsterOverrides) {
        for (const [k, v] of Object.entries(saved.monsterOverrides)) {
          // VFX 키가 실수로 monsterOverrides에 들어간 경우 제외
          if (!mergedVfxOverrides[k]) {
            mergedMonsterOverrides[k] = v;
          }
        }
      }
      // 보스 결전기 VFX 키가 monsterOverrides에 잔류하지 않도록 제거
      const bossVfxKeys = ['boss_apocalypse', 'boss_cataclysm', 'boss_dragon_breath', 'boss_abyss_vortex'];
      for (const bvk of bossVfxKeys) {
        delete mergedMonsterOverrides[bvk];
      }

      const mergedNpcOverrides: Record<string, string> = { ...(staticPreset.npcOverrides || {}), ...(saved?.npcOverrides || {}) };
      // 🛡️ 언더스코어(_) 키 및 겹친 파일 경로 자동 정화
      for (const k of Object.keys(mergedNpcOverrides)) {
        if (/^_+$/.test(k)) {
          delete mergedNpcOverrides[k];
        }
      }
      for (const [k, v] of Object.entries(mergedNpcOverrides)) {
        if (typeof v === 'string' && (v.includes('________') || v.includes('___'))) {
          if (k === 'npc_lloyd' || k === '선봉대장 로이드') {
            mergedNpcOverrides[k] = 'assets/custom_uploaded/npcs/npc_lloyd.png';
          } else if (k === 'npc_chief_advisor' || k === '방주 총괄 참모') {
            mergedNpcOverrides[k] = 'assets/custom_uploaded/npcs/npc_chief_advisor.png';
          } else {
            const mappedId = NPC_NAME_TO_ID[k] || k;
            if (staticPreset.npcOverrides?.[mappedId]) {
              mergedNpcOverrides[k] = staticPreset.npcOverrides[mappedId];
            } else {
              delete mergedNpcOverrides[k];
            }
          }
        }
      }
      // 선봉대장 로이드 & 방주 총괄 참모 독립 경로 보장
      if (mergedNpcOverrides['npc_lloyd']) mergedNpcOverrides['선봉대장 로이드'] = mergedNpcOverrides['npc_lloyd'];
      if (mergedNpcOverrides['npc_chief_advisor']) mergedNpcOverrides['방주 총괄 참모'] = mergedNpcOverrides['npc_chief_advisor'];

      this.config = {
        pureEmojiMode: saved?.pureEmojiMode ?? staticPreset.pureEmojiMode ?? false,
        syntheticAudioOnly: saved?.syntheticAudioOnly ?? staticPreset.syntheticAudioOnly ?? false,
        iconOverrides: mergedOverrides,
        bgmOverrides: { ...(staticPreset.bgmOverrides || {}), ...(saved?.bgmOverrides || {}) },
        sfxOverrides: { ...(staticPreset.sfxOverrides || {}), ...(saved?.sfxOverrides || {}) },
        vfxOverrides: mergedVfxOverrides,
        vfxConfigs: { ...(staticPreset.vfxConfigs || {}), ...(saved?.vfxConfigs || {}) },
        dungeonFloorOverrides: { ...(staticPreset.dungeonFloorOverrides || {}), ...(saved?.dungeonFloorOverrides || {}) },
        monsterOverrides: mergedMonsterOverrides,
        monsterVideoOverrides: { ...(staticPreset.monsterVideoOverrides || {}), ...(saved?.monsterVideoOverrides || {}) },
        mercenaryOverrides: { ...(staticPreset.mercenaryOverrides || {}), ...(saved?.mercenaryOverrides || {}) },
        npcOverrides: mergedNpcOverrides,
        version: Math.max(saved?.version || 1, staticPreset.version || 1),
      };
    } catch (err) {
      console.warn('[CustomAssetService] Failed to init custom asset storage:', err);
    } finally {
      this.isInitialized = true;
      this.emit('changed', this.config);
    }
  }

  public saveToStorage(): void {
    if (typeof window === 'undefined') return;
    this.config.version = (this.config.version || 0) + 1;
    this.saveToIdb(this.config);
    this.emit('changed', this.config);

    // 🌟 로컬 개발 서버 또는 배포 API 서버로 백그라운드 자동 동기화 (public/assets/custom_assets_preset.json 영구 반영)
    this.syncToServer().catch(() => {});
  }

  /**
   * 🌟 스튜디오에서 편집한 전체 config(아이콘, BGM, SFX 등)를 일괄 적용하고 파일시스템 및 IndexedDB에 영구 저장
   */
  public async saveAllConfig(newConfig: AssetConfigData): Promise<{ success: boolean; message?: string }> {
    if (typeof window === 'undefined') return { success: false, message: 'Window not available' };
    this.config = JSON.parse(JSON.stringify(newConfig));
    this.config.version = (this.config.version || 0) + 1;
    await this.saveToIdb(this.config);
    this.emit('changed', this.config);
    const syncRes = await this.syncToServer();
    return syncRes;
  }

  /**
   * 🌟 서버 파일시스템(public/assets/custom_assets_preset.json 및 custom_uploaded/)으로 즉시 저장
   * Vite dev server 실행 중인 경우 자동으로 물리 파일로 기록되어 git commit, npm run build, npx cap sync android에 포함됩니다.
   */
  public async syncToServer(): Promise<{ success: boolean; message?: string }> {
    if (typeof window === 'undefined') return { success: false, message: 'Window not available' };
    try {
      const res = await fetch('/api/custom-assets/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.config),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.savedPreset) {
          // 서버에서 base64 -> 상대 파일 경로로 정규화된 프리셋으로 갱신
          this.config = { ...this.config, ...result.savedPreset };
          await this.saveToIdb(this.config);
          this.emit('changed', this.config);
          this.emit('synced', { success: true, timestamp: Date.now() });
          return { success: true, message: '로컬 파일시스템(custom_assets_preset.json)에 영구 저장 완료!' };
        }
      }
      return { success: false, message: '서버 응답 오류' };
    } catch (e: any) {
      // 모바일 환경이나 오프라인 환경 등 서버 API가 없을 때는 로컬 IndexedDB로 안전하게 동작
      return { success: false, message: e?.message || '동기화 서버 미연결' };
    }
  }

  /**
   * 서버 자동 동기화 가용 여부 확인
   */
  public async checkServerSyncStatus(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const res = await fetch('/api/custom-assets/status');
      if (res.ok) {
        const data = await res.json();
        return !!data.serverSyncActive;
      }
    } catch (_) {}
    return false;
  }

  // ── Getters & Checkers (인메모리 0ms 동기 조회) ──────────────────────────
  public getVersion(): number {
    return this.config.version || 1;
  }

  public isPureEmojiMode(): boolean {
    return this.config.pureEmojiMode;
  }

  public isSyntheticAudioOnly(): boolean {
    return this.config.syntheticAudioOnly;
  }

  public getIconOverride(key: string): string | undefined {
    if (!key) return undefined;
    // 1. 직접 키 일치
    if (this.config.iconOverrides[key]) return this.config.iconOverrides[key];

    // 2. 마도서(book_) <-> 스킬(skill_) 일체화 상호 참조
    if (key.startsWith('skill_')) {
      const bookKey = key.replace(/^skill_/, 'book_');
      if (this.config.iconOverrides[bookKey]) return this.config.iconOverrides[bookKey];
      const bareKey = key.replace(/^skill_/, '');
      if (this.config.iconOverrides[bareKey]) return this.config.iconOverrides[bareKey];
    } else if (key.startsWith('book_')) {
      const skillKey = key.replace(/^book_/, 'skill_');
      if (this.config.iconOverrides[skillKey]) return this.config.iconOverrides[skillKey];
      const bareKey = key.replace(/^book_/, '');
      if (this.config.iconOverrides[bareKey]) return this.config.iconOverrides[bareKey];
    } else {
      // 접두사 없는 스킬 ID (e.g. 'squire_strike') -> 'skill_' / 'book_' 매핑도 탐색
      if (this.config.iconOverrides[`skill_${key}`]) return this.config.iconOverrides[`skill_${key}`];
      if (this.config.iconOverrides[`book_${key}`]) return this.config.iconOverrides[`book_${key}`];
    }

    // 3. 프리픽스 제거 키 일치 (e.g. 'weapon_sword' -> 'sword')
    // forge_t* / boss_uniq_* 키는 일반 장비 슬롯 오버라이드를 상속받지 않음
    if (!key.startsWith('forge_t') && !key.startsWith('boss_uniq_')) {
      const stripped = key.replace(/^(weapon_|armor_|equip_|rec_|book_|skill_)/, '');
      if (this.config.iconOverrides[stripped]) return this.config.iconOverrides[stripped];
    }

    return undefined;
  }

  public getBgmOverride(track: string): string | undefined {
    if (this.config.syntheticAudioOnly) return undefined;
    return this.config.bgmOverrides[track];
  }

  public getSfxOverride(type: string): string | undefined {
    if (this.config.syntheticAudioOnly) return undefined;
    return this.config.sfxOverrides[type];
  }

  public getVfxOverride(type: string): string | undefined {
    if (!type) return undefined;
    if (this.config.vfxOverrides[type]) return this.config.vfxOverrides[type];
    // 광역기(_aoe) 커스텀이 없을 경우 기본 단일기 커스텀으로 유연한 fallback
    if (type.endsWith('_aoe')) {
      const baseType = type.replace(/_aoe$/, '');
      if (this.config.vfxOverrides[baseType]) return this.config.vfxOverrides[baseType];
    }
    return undefined;
  }

  public getVfxConfig(type: string): SpriteSheetConfig | undefined {
    if (!type) return undefined;
    if (this.config.vfxConfigs?.[type]) return this.config.vfxConfigs[type];
    if (type.endsWith('_aoe')) {
      const baseType = type.replace(/_aoe$/, '');
      if (this.config.vfxConfigs?.[baseType]) return this.config.vfxConfigs[baseType];
    }
    return undefined;
  }

  public getDungeonFloorOverride(floor: number | string): string | undefined {
    const key = String(floor).replace(/^dungeon_/, '');
    return this.config.dungeonFloorOverrides[`dungeon_${key}`] || this.config.dungeonFloorOverrides[key];
  }

  public getMonsterOverride(monsterIdOrKey: string): string | undefined {
    if (!monsterIdOrKey) return undefined;
    return this.config.monsterOverrides[monsterIdOrKey];
  }

  public getMonsterVideoOverride(bossIdOrKey: string): string | undefined {
    if (!bossIdOrKey) return undefined;
    return this.config.monsterVideoOverrides[bossIdOrKey];
  }

  public getMercenaryOverride(classIdOrKey: string): string | undefined {
    if (!classIdOrKey) return undefined;
    return this.config.mercenaryOverrides[classIdOrKey];
  }

  public getNpcOverride(nameOrId: string): string | undefined {
    if (!nameOrId) return undefined;
    const overrides = this.config.npcOverrides;
    if (!overrides) return undefined;

    const sanitize = (val?: string): string | undefined => {
      if (!val) return undefined;
      if (typeof val === 'string' && (val.includes('________') || val.includes('___'))) {
        if (nameOrId === 'npc_lloyd' || nameOrId === '선봉대장 로이드') return 'assets/custom_uploaded/npcs/npc_lloyd.png';
        if (nameOrId === 'npc_chief_advisor' || nameOrId === '방주 총괄 참모') return 'assets/custom_uploaded/npcs/npc_chief_advisor.png';
        return undefined;
      }
      return val;
    };

    // 1. 직접 키 일치 (e.g. 'npc_lloyd' or '선봉대장 로이드')
    if (overrides[nameOrId]) {
      const s = sanitize(overrides[nameOrId]);
      if (s) return s;
    }

    // 2. 한국어 NPC 이름 -> 영문 id 변환 조회
    const mappedId = NPC_NAME_TO_ID[nameOrId];
    if (mappedId && overrides[mappedId]) {
      const s = sanitize(overrides[mappedId]);
      if (s) return s;
    }

    // 3. 영문 id -> 한국어 NPC 이름 변환 조회
    const mappedName = NPC_ID_TO_NAME[nameOrId];
    if (mappedName && overrides[mappedName]) {
      const s = sanitize(overrides[mappedName]);
      if (s) return s;
    }

    // 4. 'npc_' 접두사 유무 상호 호환 조회
    if (nameOrId.startsWith('npc_')) {
      const stripped = nameOrId.replace(/^npc_/, '');
      if (overrides[stripped]) {
        const s = sanitize(overrides[stripped]);
        if (s) return s;
      }
    } else {
      const prefixed = `npc_${nameOrId}`;
      if (overrides[prefixed]) {
        const s = sanitize(overrides[prefixed]);
        if (s) return s;
      }
    }

    // 특별 폴백: 선봉대장 로이드 & 방주 총괄 참모 기본 에셋 경로
    if (nameOrId === 'npc_lloyd' || nameOrId === '선봉대장 로이드') return 'assets/custom_uploaded/npcs/npc_lloyd.png';
    if (nameOrId === 'npc_chief_advisor' || nameOrId === '방주 총괄 참모') return 'assets/custom_uploaded/npcs/npc_chief_advisor.png';

    return undefined;
  }

  public getElainePortrait(emotion: 'normal' | 'serious' | 'smile' | 'worry' = 'normal'): string {
    const emotionKey = `npc_elaine_${emotion}`;
    const specific = this.getNpcOverride(emotionKey);
    if (specific) return specific;
    const base = this.getNpcOverride('npc_elaine') || this.getNpcOverride('수석 오퍼레이터 일레인');
    if (base) return base;
    return 'assets/portraits/portrait_t1_scholar.png';
  }

  public getAllConfig(): AssetConfigData {
    return JSON.parse(JSON.stringify(this.config));
  }

  // ── Setters ─────────────────────────────────────────────────────────────
  public setPureEmojiMode(enabled: boolean): void {
    this.config.pureEmojiMode = enabled;
    this.saveToStorage();
  }

  public setSyntheticAudioOnly(enabled: boolean): void {
    this.config.syntheticAudioOnly = enabled;
    this.saveToStorage();
  }

  public setIconOverride(key: string, urlOrDataUri: string | null): void {
    const val = urlOrDataUri ? urlOrDataUri.trim() : null;
    if (!val) {
      delete this.config.iconOverrides[key];
      if (key.startsWith('book_')) {
        delete this.config.iconOverrides[key.replace(/^book_/, 'skill_')];
      } else if (key.startsWith('skill_')) {
        delete this.config.iconOverrides[key.replace(/^skill_/, 'book_')];
      }
    } else {
      this.config.iconOverrides[key] = val;
      // 마도서(book_) 설정 시 대응하는 스킬(skill_) 아이콘도 100% 동일하게 일체화
      if (key.startsWith('book_')) {
        this.config.iconOverrides[key.replace(/^book_/, 'skill_')] = val;
      } else if (key.startsWith('skill_')) {
        this.config.iconOverrides[key.replace(/^skill_/, 'book_')] = val;
      }
    }
    this.saveToStorage();
  }

  public setBgmOverride(track: string, url: string | null): void {
    if (!url) {
      delete this.config.bgmOverrides[track];
    } else {
      this.config.bgmOverrides[track] = url.trim();
    }
    this.saveToStorage();
  }

  public setSfxOverride(type: string, url: string | null): void {
    if (!url) {
      delete this.config.sfxOverrides[type];
    } else {
      this.config.sfxOverrides[type] = url.trim();
    }
    this.saveToStorage();
  }

  public setVfxOverride(type: string, urlOrDataUri: string | null): void {
    if (!urlOrDataUri) {
      delete this.config.vfxOverrides[type];
    } else {
      this.config.vfxOverrides[type] = urlOrDataUri.trim();
    }
    this.saveToStorage();
  }

  public setVfxConfig(type: string, cfg: SpriteSheetConfig | null): void {
    if (!this.config.vfxConfigs) {
      this.config.vfxConfigs = {};
    }
    if (!cfg) {
      delete this.config.vfxConfigs[type];
    } else {
      this.config.vfxConfigs[type] = { ...cfg };
    }
    this.saveToStorage();
  }

  public setDungeonFloorOverride(floor: number | string, urlOrDataUri: string | null): void {
    const key = `dungeon_${String(floor).replace(/^dungeon_/, '')}`;
    if (!urlOrDataUri) {
      delete this.config.dungeonFloorOverrides[key];
      delete this.config.dungeonFloorOverrides[String(floor)];
    } else {
      this.config.dungeonFloorOverrides[key] = urlOrDataUri.trim();
    }
    this.saveToStorage();
  }

  public setMonsterOverride(monsterIdOrKey: string, urlOrDataUri: string | null): void {
    if (!urlOrDataUri) {
      delete this.config.monsterOverrides[monsterIdOrKey];
    } else {
      this.config.monsterOverrides[monsterIdOrKey] = urlOrDataUri.trim();
    }
    this.saveToStorage();
  }

  public setMonsterVideoOverride(bossIdOrKey: string, urlOrDataUri: string | null): void {
    if (!urlOrDataUri) {
      delete this.config.monsterVideoOverrides[bossIdOrKey];
    } else {
      this.config.monsterVideoOverrides[bossIdOrKey] = urlOrDataUri.trim();
    }
    this.saveToStorage();
  }

  public setMercenaryOverride(classIdOrKey: string, urlOrDataUri: string | null): void {
    if (!classIdOrKey) return;
    if (!urlOrDataUri) {
      delete this.config.mercenaryOverrides[classIdOrKey];
    } else {
      this.config.mercenaryOverrides[classIdOrKey] = urlOrDataUri.trim();
    }
    this.saveToStorage();
  }

  public setNpcOverride(nameOrId: string, urlOrDataUri: string | null): void {
    if (!nameOrId) return;
    if (!this.config.npcOverrides) {
      this.config.npcOverrides = {};
    }

    const mappedId = NPC_NAME_TO_ID[nameOrId];
    const mappedName = NPC_ID_TO_NAME[nameOrId];

    if (!urlOrDataUri) {
      delete this.config.npcOverrides[nameOrId];
      if (mappedId) delete this.config.npcOverrides[mappedId];
      if (mappedName) delete this.config.npcOverrides[mappedName];
    } else {
      const val = urlOrDataUri.trim();
      this.config.npcOverrides[nameOrId] = val;
      // name과 id 둘 다 동기화 저장하여 조회 시 0ms 즉시 보장
      if (mappedId) this.config.npcOverrides[mappedId] = val;
      if (mappedName) this.config.npcOverrides[mappedName] = val;
    }
    this.saveToStorage();
  }

  public resetToDefaults(): void {
    this.config = {
      pureEmojiMode: false,
      syntheticAudioOnly: false,
      iconOverrides: {},
      bgmOverrides: {},
      sfxOverrides: {},
      vfxOverrides: {},
      vfxConfigs: {},
      dungeonFloorOverrides: {},
      monsterOverrides: {},
      monsterVideoOverrides: {},
      mercenaryOverrides: {},
      npcOverrides: {},
      version: 1,
    };
    this.saveToStorage();
  }

  // ── JSON 파일 내보내기 및 가져오기 (배포/Deploy용) ────────────────────────
  public exportToJsonString(): string {
    return JSON.stringify(this.config, null, 2);
  }

  public importFromJsonString(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (typeof parsed !== 'object' || !parsed) return false;
      this.config = {
        pureEmojiMode: !!parsed.pureEmojiMode,
        syntheticAudioOnly: !!parsed.syntheticAudioOnly,
        iconOverrides: parsed.iconOverrides || {},
        bgmOverrides: parsed.bgmOverrides || {},
        sfxOverrides: parsed.sfxOverrides || {},
        vfxOverrides: parsed.vfxOverrides || {},
        vfxConfigs: parsed.vfxConfigs || {},
        dungeonFloorOverrides: parsed.dungeonFloorOverrides || {},
        monsterOverrides: parsed.monsterOverrides || {},
        monsterVideoOverrides: parsed.monsterVideoOverrides || {},
        mercenaryOverrides: parsed.mercenaryOverrides || {},
        npcOverrides: parsed.npcOverrides || {},
        version: (this.config.version || 1) + 1,
      };
      this.saveToStorage();
      return true;
    } catch (err) {
      console.error('[CustomAssetService] Failed to import JSON config:', err);
      return false;
    }
  }
}
