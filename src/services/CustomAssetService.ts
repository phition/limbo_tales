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

export const CLASS_GENDER_PORTRAITS: Record<string, { male: string; female: string }> = {
  squire: {
    male: 'assets/portraits/portrait_squire_male.png',
    female: 'assets/portraits/portrait_squire_female.png',
  },
  paladin: {
    male: 'assets/portraits/portrait_paladin_male.png',
    female: 'assets/portraits/portrait_paladin_female.png',
  },
  guardian: {
    male: 'assets/portraits/portrait_t1_guardian.png',
    female: 'assets/portraits/portrait_paladin_female.png',
  },
  aegis_valkyrie: {
    male: 'assets/portraits/portrait_t2_valkyrie_male.png',
    female: 'assets/portraits/portrait_t2_valkyrie.png',
  },
  aegis_bastion: {
    male: 'assets/portraits/portrait_t3_bastion.png',
    female: 'assets/portraits/portrait_t3_bastion_female.png',
  },
  fortress: {
    male: 'assets/portraits/portrait_t3_bastion.png',
    female: 'assets/portraits/portrait_t3_bastion_female.png',
  },
  crusader_lord: {
    male: 'assets/portraits/portrait_t3_seraphic_inquisitor.png',
    female: 'assets/portraits/portrait_t3_seraphic_inquisitor_female.png',
  },
  rogue: {
    male: 'assets/portraits/portrait_rogue_male.png',
    female: 'assets/portraits/portrait_rogue_female.png',
  },
  duelist: {
    male: 'assets/portraits/portrait_t1_duelist.png',
    female: 'assets/portraits/portrait_rogue_female.png',
  },
  blade_dancer: {
    male: 'assets/portraits/portrait_t1_duelist.png',
    female: 'assets/portraits/portrait_t2_shadow_phantom.png',
  },
  assassin: {
    male: 'assets/portraits/portrait_t2_shadow_phantom_male.png',
    female: 'assets/portraits/portrait_t2_shadow_phantom.png',
  },
  shadow_phantom: {
    male: 'assets/portraits/portrait_t2_shadow_phantom_male.png',
    female: 'assets/portraits/portrait_t2_shadow_phantom.png',
  },
  void_strider: {
    male: 'assets/portraits/portrait_t3_void_strider.png',
    female: 'assets/portraits/portrait_t3_void_strider_female.png',
  },
  apprentice: {
    male: 'assets/portraits/portrait_apprentice_male.png',
    female: 'assets/portraits/portrait_apprentice_female.png',
  },
  apprentice_mage: {
    male: 'assets/portraits/portrait_apprentice_male.png',
    female: 'assets/portraits/portrait_apprentice_female.png',
  },
  mage: {
    male: 'assets/portraits/portrait_mage_male.png',
    female: 'assets/portraits/portrait_mage_female.png',
  },
  elementalist: {
    male: 'assets/portraits/portrait_mage_male.png',
    female: 'assets/portraits/portrait_mage_female.png',
  },
  arcane_scholar: {
    male: 'assets/portraits/portrait_t1_scholar.png',
    female: 'assets/portraits/portrait_mage_female.png',
  },
  scholar: {
    male: 'assets/portraits/portrait_t1_scholar.png',
    female: 'assets/portraits/portrait_mage_female.png',
  },
  calamity_mage: {
    male: 'assets/portraits/portrait_t2_calamity_mage_male.png',
    female: 'assets/portraits/portrait_t2_calamity_mage.png',
  },
  chronomancer: {
    male: 'assets/portraits/portrait_t3_chrono_archon.png',
    female: 'assets/portraits/portrait_t3_chrono_archon_female.png',
  },
  chrono_archon: {
    male: 'assets/portraits/portrait_t3_chrono_archon.png',
    female: 'assets/portraits/portrait_t3_chrono_archon_female.png',
  },
  acolyte: {
    male: 'assets/portraits/portrait_acolyte_male.png',
    female: 'assets/portraits/portrait_acolyte_female.png',
  },
  novice_cleric: {
    male: 'assets/portraits/portrait_acolyte_male.png',
    female: 'assets/portraits/portrait_acolyte_female.png',
  },
  cleric: {
    male: 'assets/portraits/portrait_cleric_male.png',
    female: 'assets/portraits/portrait_cleric_female.png',
  },
  war_priest: {
    male: 'assets/portraits/portrait_t1_war_priest.png',
    female: 'assets/portraits/portrait_cleric_female.png',
  },
  bishop: {
    male: 'assets/portraits/portrait_t2_high_saintess_male.png',
    female: 'assets/portraits/portrait_t2_high_saintess.png',
  },
  high_saintess: {
    male: 'assets/portraits/portrait_t2_high_saintess_male.png',
    female: 'assets/portraits/portrait_t2_high_saintess.png',
  },
  seraphic_inquisitor: {
    male: 'assets/portraits/portrait_t3_seraphic_inquisitor.png',
    female: 'assets/portraits/portrait_t3_seraphic_inquisitor_female.png',
  },
  vanguard: {
    male: 'assets/portraits/portrait_vanguard_male.png',
    female: 'assets/portraits/portrait_vanguard_female.png',
  },
  warrior: {
    male: 'assets/portraits/portrait_berserker_male.png',
    female: 'assets/portraits/portrait_berserker_female.png',
  },
  berserker: {
    male: 'assets/portraits/portrait_berserker_male.png',
    female: 'assets/portraits/portrait_berserker_female.png',
  },
  warlord: {
    male: 'assets/portraits/portrait_t1_warlord.png',
    female: 'assets/portraits/portrait_berserker_female.png',
  },
  valhalla_blade: {
    male: 'assets/portraits/portrait_t2_valhalla_blade_male.png',
    female: 'assets/portraits/portrait_t2_valhalla_blade.png',
  },
  iron_marshal: {
    male: 'assets/portraits/portrait_t3_valhalla_warlord.png',
    female: 'assets/portraits/portrait_t3_valhalla_warlord_female.png',
  },
  valhalla_warlord: {
    male: 'assets/portraits/portrait_t3_valhalla_warlord.png',
    female: 'assets/portraits/portrait_t3_valhalla_warlord_female.png',
  },
  gunner: {
    male: 'assets/portraits/portrait_gunner_male.png',
    female: 'assets/portraits/portrait_gunner_female.png',
  },
  archer: {
    male: 'assets/portraits/portrait_gunner_male.png',
    female: 'assets/portraits/portrait_gunner_female.png',
  },
  tactical_gunner: {
    male: 'assets/portraits/portrait_gunner_male.png',
    female: 'assets/portraits/portrait_gunner_female.png',
  },
  sharpshooter: {
    male: 'assets/portraits/portrait_gunner_male.png',
    female: 'assets/portraits/portrait_t1_sharpshooter.png',
  },
  aether_gun_meister: {
    male: 'assets/portraits/portrait_t2_gun_meister_male.png',
    female: 'assets/portraits/portrait_t2_gun_meister.png',
  },
  gun_meister: {
    male: 'assets/portraits/portrait_t2_gun_meister_male.png',
    female: 'assets/portraits/portrait_t2_gun_meister.png',
  },
  ghost_sniper: {
    male: 'assets/portraits/portrait_t3_omega_deadeye.png',
    female: 'assets/portraits/portrait_t3_omega_deadeye_female.png',
  },
  omega_deadeye: {
    male: 'assets/portraits/portrait_t3_omega_deadeye.png',
    female: 'assets/portraits/portrait_t3_omega_deadeye_female.png',
  },
};

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

  public static getGenderPortrait(classId: string, gender: 'male' | 'female' = 'male'): string {
    return CustomAssetService.getInstance().getGenderPortrait(classId, gender);
  }

  public static getHeroPortrait(hero?: {
    id?: string;
    name?: string;
    classId?: string;
    gender?: 'male' | 'female';
    portraitUrl?: string;
    portraitPromptKey?: string;
  }): string {
    return CustomAssetService.getInstance().getHeroPortrait(hero);
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

      const cacheBustQuery = `?v=${Date.now()}`;
      for (const url of candidateUrls) {
        try {
          let res: Response | null = null;
          try {
            res = await fetch(url + cacheBustQuery, { cache: 'no-cache' });
          } catch (_) {
            // 폴백: 쿼리스트링 미지원 환경(일부 로컬 파일 스킴 등)
            res = await fetch(url);
          }
          if (res && res.ok) {
            const data = await res.json();
            if (data && typeof data === 'object') {
              staticPreset = data;
              break;
            }
          }
        } catch (_) {}
      }

      // 4. Two-Tier Merge: 배포 정적 프리셋(기본) + 기기 로컬 IndexedDB 사용자 오버라이드
      // 🌟 배포 프리셋 버전이 로컬 저장소보다 높으면 배포 버전의 최신 에셋이 최우선 적용되도록 보장
      const isNewPresetVersion = (staticPreset.version || 0) > (saved?.version || 0);

      const mergeAssetMap = (
        staticMap: Record<string, string> = {},
        savedMap: Record<string, string> = {},
        preferStatic: boolean = false
      ): Record<string, string> => {
        const result: Record<string, string> = preferStatic
          ? { ...savedMap, ...staticMap }
          : { ...staticMap, ...savedMap };

        // 🛡️ 레거시 base64('data:...')만 실제 파일 경로('assets/...')로 보정
        // ⚠️ 사용자가 명시적으로 선택한 'emoji' 또는 유니코드 이모지 문자열은 절대 파일 경로로 강제 덮어쓰지 않음!
        for (const [key, staticVal] of Object.entries(staticMap)) {
          if (staticVal && staticVal.startsWith('assets/') && (!result[key] || result[key].startsWith('data:'))) {
            result[key] = staticVal;
          }
        }
        for (const [key, savedVal] of Object.entries(savedMap)) {
          if (savedVal && savedVal.startsWith('assets/') && (!result[key] || result[key].startsWith('data:'))) {
            result[key] = savedVal;
          }
        }
        return result;
      };

      const mergedOverrides = mergeAssetMap(staticPreset.iconOverrides, saved?.iconOverrides, isNewPresetVersion);
      const mergedVfxOverrides = mergeAssetMap(staticPreset.vfxOverrides, saved?.vfxOverrides, isNewPresetVersion);

      // 🛡️ 레거시 고정 저해상도 base64 플레이스홀더 정리 (배포 정적 스프라이트 에셋이 존재하면 우선 적용)
      for (const [k, v] of Object.entries(staticPreset.vfxOverrides || {})) {
        if (v && !v.startsWith('data:') && (!mergedVfxOverrides[k] || mergedVfxOverrides[k].startsWith('data:image/png;base64,iVBORw0KGgoAAA') || mergedVfxOverrides[k].startsWith('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGAAAABgCAYAAADimHc4'))) {
          mergedVfxOverrides[k] = v;
        }
      }

      const mergedMonsterOverrides = mergeAssetMap(staticPreset.monsterOverrides, saved?.monsterOverrides, isNewPresetVersion);
      // 보스 결전기 및 VFX 키가 실수로 monsterOverrides에 잔류하지 않도록 제거
      const bossVfxKeys = ['boss_apocalypse', 'boss_cataclysm', 'boss_dragon_breath', 'boss_abyss_vortex'];
      for (const bvk of bossVfxKeys) {
        delete mergedMonsterOverrides[bvk];
      }
      for (const vk of Object.keys(mergedVfxOverrides)) {
        delete mergedMonsterOverrides[vk];
      }

      const mergedNpcOverrides: Record<string, string> = mergeAssetMap(staticPreset.npcOverrides, saved?.npcOverrides, isNewPresetVersion);
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
        pureEmojiMode: isNewPresetVersion ? (staticPreset.pureEmojiMode ?? false) : (saved?.pureEmojiMode ?? staticPreset.pureEmojiMode ?? false),
        syntheticAudioOnly: saved?.syntheticAudioOnly ?? staticPreset.syntheticAudioOnly ?? false,
        iconOverrides: mergedOverrides,
        bgmOverrides: mergeAssetMap(staticPreset.bgmOverrides, saved?.bgmOverrides, isNewPresetVersion),
        sfxOverrides: mergeAssetMap(staticPreset.sfxOverrides, saved?.sfxOverrides, isNewPresetVersion),
        vfxOverrides: mergedVfxOverrides,
        vfxConfigs: { ...(staticPreset.vfxConfigs || {}), ...(saved?.vfxConfigs || {}) },
        dungeonFloorOverrides: mergeAssetMap(staticPreset.dungeonFloorOverrides, saved?.dungeonFloorOverrides, isNewPresetVersion),
        monsterOverrides: mergedMonsterOverrides,
        monsterVideoOverrides: mergeAssetMap(staticPreset.monsterVideoOverrides, saved?.monsterVideoOverrides, isNewPresetVersion),
        mercenaryOverrides: mergeAssetMap(staticPreset.mercenaryOverrides, saved?.mercenaryOverrides, isNewPresetVersion),
        npcOverrides: mergedNpcOverrides,
        version: Math.max(saved?.version || 1, staticPreset.version || 1),
      };

      // 🌟 새로운 배포 프리셋이 로드되었거나 로컬 저장소가 없었던 경우 최신 상태를 IndexedDB에 즉시 보관
      if (isNewPresetVersion || !saved) {
        await this.saveToIdb(this.config);
      }
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

    // 1-0. 촉매/보급품 묶음 팩 키 자동 호환 (e.g. 'enhanced_torch_pack_10' -> 'enhanced_torch', 'prefix_stone_pack_10' -> 'prefix_stone')
    const packBaseKey = key.replace(/_pack(?:_\d+)?$/, '');
    if (packBaseKey !== key) {
      if (this.config.iconOverrides[packBaseKey]) return this.config.iconOverrides[packBaseKey];
      if (packBaseKey === 'pure_prefix' && this.config.iconOverrides['pure_prefix_stone']) return this.config.iconOverrides['pure_prefix_stone'];
      if (packBaseKey === 'pure_suffix' && this.config.iconOverrides['pure_suffix_stone']) return this.config.iconOverrides['pure_suffix_stone'];
    }
    if (key === 'pure_prefix' && this.config.iconOverrides['pure_prefix_stone']) return this.config.iconOverrides['pure_prefix_stone'];
    if (key === 'pure_suffix' && this.config.iconOverrides['pure_suffix_stone']) return this.config.iconOverrides['pure_suffix_stone'];

    // 1-1. 영지 건물 및 성채 네비게이션 휠 키 상호 호환 참조
    if (key === 'forge' && this.config.iconOverrides['blacksmith']) return this.config.iconOverrides['blacksmith'];
    if (key === 'blacksmith' && this.config.iconOverrides['forge']) return this.config.iconOverrides['forge'];
    if (key === 'arena' && this.config.iconOverrides['arenaGate']) return this.config.iconOverrides['arenaGate'];
    if (key === 'arenaGate' && this.config.iconOverrides['arena']) return this.config.iconOverrides['arena'];
    if (key === 'citadel' && this.config.iconOverrides['bonfire']) return this.config.iconOverrides['bonfire'];
    if (key === 'bonfire' && this.config.iconOverrides['citadel']) return this.config.iconOverrides['citadel'];

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

  public getGenderPortrait(classId: string, gender: 'male' | 'female' = 'male'): string {
    if (!classId) return gender === 'female' ? 'assets/portraits/portrait_paladin_female.png' : 'assets/portraits/portrait_paladin_male.png';
    const norm = classId.toLowerCase().replace(/^hero_/, '');
    const gKey = gender === 'female' ? 'female' : 'male';

    // 1. 개별 커스텀 오버라이드 확인 (예: 'squire_female', 'squire_male', 'paladin_female' 등)
    const specificOverride = this.config.mercenaryOverrides[`${norm}_${gKey}`] 
      || this.config.mercenaryOverrides[`hero_${norm}_${gKey}`];
    if (specificOverride) return specificOverride;

    // 2. 클래스 성별 매핑 테이블 조회
    const mapping = CLASS_GENDER_PORTRAITS[norm];
    if (mapping && mapping[gKey]) {
      return mapping[gKey];
    }

    // 3. 일반 클래스 오버라이드 조회
    const generalOverride = this.config.mercenaryOverrides[norm] || this.config.mercenaryOverrides[`hero_${norm}`];
    if (generalOverride) return generalOverride;

    // 4. 기본 폴백
    return gKey === 'female' ? 'assets/portraits/portrait_paladin_female.png' : 'assets/portraits/portrait_paladin_male.png';
  }

  public getHeroPortrait(hero?: {
    id?: string;
    name?: string;
    classId?: string;
    gender?: 'male' | 'female';
    portraitUrl?: string;
    portraitPromptKey?: string;
  }): string {
    if (!hero) return 'assets/portraits/portrait_paladin_male.png';

    // 1. 영웅 ID 또는 이름 기준 직접 커스텀 오버라이드 확인
    if (hero.id && this.config.mercenaryOverrides[hero.id]) {
      return this.config.mercenaryOverrides[hero.id];
    }
    if (hero.name && this.config.mercenaryOverrides[hero.name]) {
      return this.config.mercenaryOverrides[hero.name];
    }

    // 2. hero.portraitUrl 명시되어 있는 경우 (단, 유효한 경로인 경우)
    if (hero.portraitUrl && typeof hero.portraitUrl === 'string' && hero.portraitUrl.trim().length > 0) {
      return hero.portraitUrl;
    }

    // 3. 성별 및 클래스 기반 초상화 조회
    const classId = hero.classId || (hero.portraitPromptKey ? hero.portraitPromptKey.replace(/^hero_/, '') : 'squire');
    const gender = hero.gender || (hero.name === '아이리스' ? 'female' : hero.name === '시안' ? 'male' : 'male');
    return this.getGenderPortrait(classId, gender);
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
    const applyVal = (k: string, v: string | null) => {
      if (!v) {
        delete this.config.iconOverrides[k];
      } else {
        this.config.iconOverrides[k] = v;
      }
    };

    applyVal(key, val);

    // 마도서(book_) 설정 시 대응하는 스킬(skill_) 아이콘도 100% 동일하게 일체화
    if (key.startsWith('book_')) {
      applyVal(key.replace(/^book_/, 'skill_'), val);
    } else if (key.startsWith('skill_')) {
      applyVal(key.replace(/^skill_/, 'book_'), val);
    }

    // 영지 시설 / 휠 버튼 상호 일원화 동기화
    if (key === 'blacksmith') applyVal('forge', val);
    else if (key === 'forge') applyVal('blacksmith', val);
    else if (key === 'arenaGate') applyVal('arena', val);
    else if (key === 'arena') applyVal('arenaGate', val);

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
