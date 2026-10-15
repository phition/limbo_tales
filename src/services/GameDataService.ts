import { MONSTERS } from '../data/monsters';
import { EQUIPMENT_RECIPES, FORGE_ITEM_BASE_COSTS } from '../data/equipment';
import { INITIAL_BUILDINGS, BUILDING_BASE_COSTS, BuildingTierConfig } from '../data/buildings';
import { INITIAL_QUESTS } from '../data/quests';
import { CHARACTER_CLASSES } from '../data/classes';
import { ALL_SKILL_BOOKS } from '../data/skillBooks';
import { INITIAL_HEROES_CONFIG } from '../data/mercenaries';
import { NEMESIS_BOSS_CONFIG, NemesisBossConfig } from '../data/nemesis';
import { MonsterData, EquipmentItem, BuildingState, BuildingId, Quest, CharacterClass, Mercenary, Skill, GameResources } from '../types/game';
import { ref, get, set, onValue, Unsubscribe } from 'firebase/database';
import { db } from './firebaseConfig';
import { FirebaseService } from './FirebaseService';

export interface GameBalanceConfig {
  expMultiplier: number;
  goldMultiplier: number;
  etherMultiplier: number;
  itemDropRateMultiplier: number;
  bossSkillBookDropRate: number;
  drConstant: number; // 🛡️ 방어력 피해 감소(DR%) 기준 상수 K (기본값: 300)
}

const DEFAULT_BALANCE_CONFIG: GameBalanceConfig = {
  expMultiplier: 1.0,
  goldMultiplier: 1.0,
  etherMultiplier: 1.0,
  itemDropRateMultiplier: 1.0,
  bossSkillBookDropRate: 0.04,
  drConstant: 300,
};

export interface CustomGameDataPackage {
  monsters?: Record<string, Partial<MonsterData>>;
  buildingBaseCosts?: Record<string, Partial<GameResources>>;
  buildingTierConfigs?: Record<string, Record<number, BuildingTierConfig>>;
  forgeItemBaseCosts?: Record<string, Partial<GameResources>>;
  initialHeroes?: Mercenary[];
  classBaseStats?: Record<string, Partial<CharacterClass['baseStats']>>;
  classSkills?: Record<string, Partial<Skill>>;
  skillBooks?: Record<string, { power?: number; manaCost?: number; cooldown?: number; costGold?: number; description?: string }>;
  balance?: Partial<GameBalanceConfig>;
  nemesis?: Partial<NemesisBossConfig>;
  version?: number;
  updatedAt?: number;
  updatedBy?: string;
}

function deepMergeCustomPackage(base: CustomGameDataPackage, override: CustomGameDataPackage): CustomGameDataPackage {
  const result: CustomGameDataPackage = { ...base, ...override };

  // 1. buildingTierConfigs
  if (base.buildingTierConfigs || override.buildingTierConfigs) {
    result.buildingTierConfigs = {};
    const bIds = new Set([
      ...Object.keys(base.buildingTierConfigs || {}),
      ...Object.keys(override.buildingTierConfigs || {})
    ]);
    for (const bId of bIds) {
      const baseMap = base.buildingTierConfigs?.[bId] || {};
      const overMap = override.buildingTierConfigs?.[bId] || {};
      const allLevels = new Set([
        ...Object.keys(baseMap).map(Number),
        ...Object.keys(overMap).map(Number)
      ]);
      result.buildingTierConfigs[bId] = {};
      for (const lv of allLevels) {
        const bTier = baseMap[lv] || {};
        const oTier = overMap[lv] || {};
        result.buildingTierConfigs[bId][lv] = {
          ...bTier,
          ...oTier,
          cost: { ...(bTier.cost || {}), ...(oTier.cost || {}) },
          production: { ...(bTier.production || {}), ...(oTier.production || {}) },
          upkeep: { ...(bTier.upkeep || {}), ...(oTier.upkeep || {}) }
        };
      }
    }
  }

  // 2. monsters
  if (base.monsters || override.monsters) {
    result.monsters = { ...(base.monsters || {}) };
    for (const [id, mDiff] of Object.entries(override.monsters || {})) {
      result.monsters[id] = { ...(result.monsters[id] || {}), ...mDiff };
    }
  }

  // 3. buildingBaseCosts
  if (base.buildingBaseCosts || override.buildingBaseCosts) {
    result.buildingBaseCosts = { ...(base.buildingBaseCosts || {}) };
    for (const [id, cDiff] of Object.entries(override.buildingBaseCosts || {})) {
      result.buildingBaseCosts[id] = { ...(result.buildingBaseCosts[id] || {}), ...cDiff };
    }
  }

  // 4. forgeItemBaseCosts
  if (base.forgeItemBaseCosts || override.forgeItemBaseCosts) {
    result.forgeItemBaseCosts = { ...(base.forgeItemBaseCosts || {}) };
    for (const [id, cDiff] of Object.entries(override.forgeItemBaseCosts || {})) {
      result.forgeItemBaseCosts[id] = { ...(result.forgeItemBaseCosts[id] || {}), ...cDiff };
    }
  }

  // 5. classBaseStats
  if (base.classBaseStats || override.classBaseStats) {
    result.classBaseStats = { ...(base.classBaseStats || {}) };
    for (const [id, sDiff] of Object.entries(override.classBaseStats || {})) {
      result.classBaseStats[id] = { ...(result.classBaseStats[id] || {}), ...sDiff };
    }
  }

  // 6. classSkills
  if (base.classSkills || override.classSkills) {
    result.classSkills = { ...(base.classSkills || {}) };
    for (const [id, skDiff] of Object.entries(override.classSkills || {})) {
      result.classSkills[id] = { ...(result.classSkills[id] || {}), ...skDiff };
    }
  }

  // 7. skillBooks
  if (base.skillBooks || override.skillBooks) {
    result.skillBooks = { ...(base.skillBooks || {}) };
    for (const [id, bkDiff] of Object.entries(override.skillBooks || {})) {
      result.skillBooks[id] = { ...(result.skillBooks[id] || {}), ...bkDiff };
    }
  }

  // 8. balance
  if (base.balance || override.balance) {
    result.balance = { ...(base.balance || {}), ...(override.balance || {}) };
  }

  // 9. nemesis
  if (base.nemesis || override.nemesis) {
    const mergedNemesis: Partial<NemesisBossConfig> = {
      ...(base.nemesis || {}),
      ...(override.nemesis || {})
    };
    if (base.nemesis?.parts || override.nemesis?.parts) {
      mergedNemesis.parts = {
        ...(base.nemesis?.parts || {}),
        ...(override.nemesis?.parts || {})
      } as any;
    }
    result.nemesis = mergedNemesis;
  }

  return result;
}

const IDB_DATA_KEY = 'limbo_custom_game_data_idb';

export class GameDataService {
  private static instance: GameDataService;

  private monsters: Record<string, MonsterData> = { ...MONSTERS };
  private equipmentMap: Record<string, EquipmentItem> = {};
  private buildings: Record<string, BuildingState> = { ...INITIAL_BUILDINGS };
  private questsMap: Record<string, Quest> = {};
  private classes: Record<string, CharacterClass> = { ...CHARACTER_CLASSES };
  private balanceConfig: GameBalanceConfig = { ...DEFAULT_BALANCE_CONFIG };

  // 🌟 마스터 스튜디오 오버라이드 데이터
  private customOverrides: CustomGameDataPackage = {};

  private isRemoteSynced = false;
  private listeners: Array<() => void> = [];
  private unsubscribeRealtime: Unsubscribe | null = null;

  private constructor() {
    this.initMaps();
    this.initLocalStorageAndPreset();
  }

  public static getInstance(): GameDataService {
    if (!GameDataService.instance) {
      GameDataService.instance = new GameDataService();
    }
    return GameDataService.instance;
  }

  public onUpdate(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  private notifyListeners(): void {
    this.listeners.forEach(cb => {
      try {
        cb();
      } catch (e) {
        console.error('[GameDataService] Error in update listener:', e);
      }
    });
  }

  private initMaps(): void {
    INITIAL_QUESTS.forEach((q) => {
      this.questsMap[q.id] = { ...q };
    });
  }

  /**
   * 🌟 로컬 스토리지 및 정적 배포 프리셋(/assets/custom_game_data.json) 자동 로드
   */
  private async initLocalStorageAndPreset(): Promise<void> {
    if (typeof window === 'undefined') return;

    let savedOverrides: CustomGameDataPackage | null = null;
    try {
      const raw = localStorage.getItem(IDB_DATA_KEY);
      if (raw) {
        savedOverrides = JSON.parse(raw);
      }
    } catch (_) {}

    let staticPreset: CustomGameDataPackage | null = null;
    const basePrefix = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL)
      ? import.meta.env.BASE_URL.replace(/\/$/, '') + '/'
      : '';
    const candidateUrls = [
      `${basePrefix}assets/custom_game_data.json`,
      'assets/custom_game_data.json',
      './assets/custom_game_data.json',
      '/assets/custom_game_data.json'
    ];

    for (const url of candidateUrls) {
      try {
        const res = await fetch(`${url}?t=${Date.now()}`);
        if (res.ok) {
          const data = await res.json();
          if (data && typeof data === 'object') {
            staticPreset = data;
            break;
          }
        }
      } catch (_) {}
    }

    let merged: CustomGameDataPackage = {};
    if (staticPreset && savedOverrides) {
      const staticTime = staticPreset.updatedAt || 0;
      const savedTime = savedOverrides.updatedAt || 0;
      // 정적 배포 파일이 로컬 스토리지보다 최신이거나 같으면 정적 배포 파일 우선 적용
      if (staticTime >= savedTime) {
        merged = deepMergeCustomPackage(savedOverrides, staticPreset);
        try {
          localStorage.setItem(IDB_DATA_KEY, JSON.stringify(merged));
        } catch (_) {}
      } else {
        merged = deepMergeCustomPackage(staticPreset, savedOverrides);
      }
    } else if (staticPreset) {
      merged = staticPreset;
    } else if (savedOverrides) {
      merged = savedOverrides;
    }

    if (Object.keys(merged).length > 0) {
      this.applyCustomPackage(merged, false);
    }
  }

  /**
   * 🌟 커스텀 데이터 패키지를 인게임 런타임에 즉각 적용
   */
  public applyCustomPackage(pkg: CustomGameDataPackage, persist = true): void {
    this.customOverrides = deepMergeCustomPackage(this.customOverrides, pkg);

    // 1. 몬스터 스탯 반영
    if (pkg.monsters) {
      for (const [id, mDiff] of Object.entries(pkg.monsters)) {
        if (MONSTERS[id]) {
          Object.assign(MONSTERS[id], mDiff);
        }
        if (this.monsters[id]) {
          Object.assign(this.monsters[id], mDiff);
        }
      }
    }

    // 2. 건물 건설/업그레이드 기초 자원 반영
    if (pkg.buildingBaseCosts) {
      for (const [bId, costDiff] of Object.entries(pkg.buildingBaseCosts)) {
        if (BUILDING_BASE_COSTS[bId as BuildingId]) {
          Object.assign(BUILDING_BASE_COSTS[bId as BuildingId], costDiff);
        }
      }
    }

    // 2-2. 🏛️ 영지 시설 티어/레벨별 소모자재량/생산량/유지비 오버라이드 병합
    if (pkg.buildingTierConfigs) {
      if (!this.customOverrides.buildingTierConfigs) {
        this.customOverrides.buildingTierConfigs = {};
      }
      for (const [bId, tierMap] of Object.entries(pkg.buildingTierConfigs)) {
        if (!this.customOverrides.buildingTierConfigs[bId]) {
          this.customOverrides.buildingTierConfigs[bId] = {};
        }
        for (const [lvStr, cfg] of Object.entries(tierMap)) {
          const lv = Number(lvStr);
          this.customOverrides.buildingTierConfigs[bId][lv] = {
            ...(this.customOverrides.buildingTierConfigs[bId][lv] || {}),
            ...cfg,
            cost: {
              ...(this.customOverrides.buildingTierConfigs[bId][lv]?.cost || {}),
              ...(cfg.cost || {})
            },
            production: {
              ...(this.customOverrides.buildingTierConfigs[bId][lv]?.production || {}),
              ...(cfg.production || {})
            },
            upkeep: {
              ...(this.customOverrides.buildingTierConfigs[bId][lv]?.upkeep || {}),
              ...(cfg.upkeep || {})
            }
          };
        }
      }
    }

    // 3. 단조 장비 기초 자원 소모량 반영
    if (pkg.forgeItemBaseCosts) {
      for (const [itemKey, costDiff] of Object.entries(pkg.forgeItemBaseCosts)) {
        if (FORGE_ITEM_BASE_COSTS[itemKey]) {
          Object.assign(FORGE_ITEM_BASE_COSTS[itemKey], costDiff);
        }
      }
    }

    // 4. 초기 용병 스탯 반영
    if (pkg.initialHeroes && Array.isArray(pkg.initialHeroes)) {
      pkg.initialHeroes.forEach((hOverride, idx) => {
        if (INITIAL_HEROES_CONFIG[idx]) {
          Object.assign(INITIAL_HEROES_CONFIG[idx], hOverride);
        }
      });
    }

    // 4-2. 🎖️ 각 클래스 초기 스탯(baseStats) 반영
    if (pkg.classBaseStats) {
      for (const [classId, statsDiff] of Object.entries(pkg.classBaseStats)) {
        if (CHARACTER_CLASSES[classId]) {
          Object.assign(CHARACTER_CLASSES[classId].baseStats, statsDiff);
        }
        if (this.classes[classId]) {
          Object.assign(this.classes[classId].baseStats, statsDiff);
        }
      }
    }

    // 5. 직업 고유 스킬 위력/마나/쿨다운 반영
    if (pkg.classSkills) {
      for (const [skillId, sDiff] of Object.entries(pkg.classSkills)) {
        for (const cls of Object.values(CHARACTER_CLASSES)) {
          const sk = cls.skills.find(s => s.id === skillId);
          if (sk) Object.assign(sk, sDiff);
          if (cls.specialSkill && cls.specialSkill.id === skillId) {
            Object.assign(cls.specialSkill, sDiff);
          }
        }
      }
    }

    // 6. 마도서(스킬북) 위력/골드/마나/설명 반영
    if (pkg.skillBooks) {
      for (const [bookId, bDiff] of Object.entries(pkg.skillBooks)) {
        const book = ALL_SKILL_BOOKS.find(b => b.id === bookId || b.skill.id === bookId);
        if (book) {
          if (bDiff.costGold !== undefined) book.costGold = bDiff.costGold;
          if (bDiff.power !== undefined) book.skill.power = bDiff.power;
          if (bDiff.manaCost !== undefined) book.skill.manaCost = bDiff.manaCost;
          if (bDiff.cooldown !== undefined) book.skill.cooldown = bDiff.cooldown;
          if (bDiff.description !== undefined) {
            book.skill.description = bDiff.description;
            book.description = bDiff.description;
          }
        }
      }
    }

    // 7. 글로벌 밸런스 계수 반영
    if (pkg.balance) {
      Object.assign(this.balanceConfig, pkg.balance);
    }

    // 8. 🌌 차원 네메시스 보스 설정 반영
    if (pkg.nemesis) {
      if (pkg.nemesis.name !== undefined) NEMESIS_BOSS_CONFIG.name = pkg.nemesis.name;
      if (pkg.nemesis.title !== undefined) NEMESIS_BOSS_CONFIG.title = pkg.nemesis.title;
      if (pkg.nemesis.maxHp !== undefined) NEMESIS_BOSS_CONFIG.maxHp = pkg.nemesis.maxHp;
      if (pkg.nemesis.atk !== undefined) NEMESIS_BOSS_CONFIG.atk = pkg.nemesis.atk;
      if (pkg.nemesis.def !== undefined) NEMESIS_BOSS_CONFIG.def = pkg.nemesis.def;
      if (pkg.nemesis.spd !== undefined) NEMESIS_BOSS_CONFIG.spd = pkg.nemesis.spd;
      if (pkg.nemesis.luck !== undefined) NEMESIS_BOSS_CONFIG.luck = pkg.nemesis.luck;
      if (pkg.nemesis.skills && Array.isArray(pkg.nemesis.skills)) {
        pkg.nemesis.skills.forEach(skOverride => {
          const sk = NEMESIS_BOSS_CONFIG.skills.find(s => s.id === skOverride.id);
          if (sk) Object.assign(sk, skOverride);
        });
      }
      if (pkg.nemesis.phases && Array.isArray(pkg.nemesis.phases)) {
        pkg.nemesis.phases.forEach(phOverride => {
          const ph = NEMESIS_BOSS_CONFIG.phases.find(p => p.phase === phOverride.phase);
          if (ph) Object.assign(ph, phOverride);
        });
      }
      if (pkg.nemesis.parts) {
        (['head', 'body', 'tail'] as const).forEach(partKey => {
          const partOverride = pkg.nemesis!.parts?.[partKey];
          if (partOverride && NEMESIS_BOSS_CONFIG.parts?.[partKey]) {
            Object.assign(NEMESIS_BOSS_CONFIG.parts[partKey], partOverride);
            if (partOverride.skills && Array.isArray(partOverride.skills)) {
              partOverride.skills.forEach(skOverride => {
                const psk = NEMESIS_BOSS_CONFIG.parts[partKey].skills.find(s => s.id === skOverride.id);
                if (psk) Object.assign(psk, skOverride);
              });
            }
          }
        });
      }
    }

    if (persist && typeof window !== 'undefined') {
      try {
        localStorage.setItem(IDB_DATA_KEY, JSON.stringify(this.customOverrides));
      } catch (_) {}
    }

    this.notifyListeners();
  }

  public getCustomOverrides(): CustomGameDataPackage {
    return JSON.parse(JSON.stringify(this.customOverrides));
  }

  public getSkillBookOverride(bookId: string) {
    return this.customOverrides.skillBooks?.[bookId];
  }

  public getNemesisConfig(): NemesisBossConfig {
    return NEMESIS_BOSS_CONFIG;
  }

  public getCustomBuildingTierCost(bId: BuildingId, level: number): Partial<GameResources> | undefined {
    return this.customOverrides.buildingTierConfigs?.[bId]?.[level]?.cost;
  }

  public getCustomBuildingProduction(bId: BuildingId, level: number): { primaryAmount?: number; secondaryAmount?: number } | undefined {
    return this.customOverrides.buildingTierConfigs?.[bId]?.[level]?.production;
  }

  public getCustomBuildingUpkeep(bId: BuildingId, level: number): { amount?: number; secondaryAmount?: number } | undefined {
    return this.customOverrides.buildingTierConfigs?.[bId]?.[level]?.upkeep;
  }

  public getAllCustomBuildingTierConfigs(): Record<string, Record<number, BuildingTierConfig>> {
    return this.customOverrides.buildingTierConfigs || {};
  }

  /**
   * 🌟 배포용 정적 파일시스템(/api/custom-data/save)에 영구 저장 동기화
   */
  public async saveCustomDataToServer(): Promise<{ success: boolean; message: string }> {
    if (typeof window === 'undefined') return { success: false, message: 'Window not available' };
    try {
      const res = await fetch('/api/custom-data/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.customOverrides),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success) {
          return { success: true, message: '✅ 로컬 배포 파일(public/assets/custom_game_data.json)에 성공적으로 저장되었습니다!' };
        }
      }
      return { success: false, message: '서버 응답 오류 (Vite dev server 확인 필요)' };
    } catch (e: any) {
      return { success: false, message: e?.message || '동기화 서버 미연결 (오프라인 모드: 브라우저에 임시 저장됨)' };
    }
  }

  /**
   * 🌟 몬스터 데이터 조회
   */
  public getMonster(id: string): MonsterData | undefined {
    return this.monsters[id];
  }

  public getAllMonsters(): Record<string, MonsterData> {
    return { ...this.monsters };
  }

  public getEquipmentRecipes() {
    return EQUIPMENT_RECIPES;
  }

  public getBuilding(id: BuildingId): BuildingState | undefined {
    return this.buildings[id];
  }

  public getAllBuildings(): Record<BuildingId, BuildingState> {
    return { ...this.buildings } as Record<BuildingId, BuildingState>;
  }

  public getQuest(id: string): Quest | undefined {
    return this.questsMap[id];
  }

  public getAllQuests(): Quest[] {
    return Object.values(this.questsMap);
  }

  public getClass(id: string): CharacterClass | undefined {
    return this.classes[id];
  }

  public getAllClasses(): Record<string, CharacterClass> {
    return { ...this.classes };
  }

  public getBalanceConfig(): GameBalanceConfig {
    return { ...this.balanceConfig };
  }

  /**
   * 🔄 모든 커스텀 오버라이드 설정 초기화
   */
  public resetCustomOverrides(): void {
    this.customOverrides = {};
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(IDB_DATA_KEY);
      } catch (_) {}
    }
    this.notifyListeners();
  }

  /**
   * ☁️ 원격 데이터를 로컬 메모리 및 전역 데이터 객체에 병합
   */
  public applyRemoteData(remoteData: any, source: string = 'remote'): boolean {
    if (!remoteData || typeof remoteData !== 'object') return false;

    // 로컬 변경사항이 더 최신인 경우 이전 원격 데이터로 덮어쓰지 않도록 타임스탬프 보호
    const localUpdatedAt = this.customOverrides.updatedAt || 0;
    const remoteUpdatedAt = remoteData.updatedAt || remoteData.customOverrides?.updatedAt || 0;
    if (localUpdatedAt > 0 && remoteUpdatedAt > 0 && remoteUpdatedAt < localUpdatedAt) {
      console.log(`[GameDataService] ⏭️ Skipping older remote data from ${source} (remote: ${remoteUpdatedAt} < local: ${localUpdatedAt})`);
      return false;
    }

    let updated = false;

    if (remoteData.monsters && typeof remoteData.monsters === 'object') {
      let monsterCount = 0;
      for (const [id, monData] of Object.entries(remoteData.monsters)) {
        if (monData && typeof monData === 'object') {
          const merged = { ...(this.monsters[id] || {}), ...(monData as MonsterData) };
          this.monsters[id] = merged;
          MONSTERS[id] = merged;
          monsterCount++;
          updated = true;
        }
      }
      if (monsterCount > 0) {
        console.log(`[GameDataService] ${monsterCount} monsters synced from ${source}.`);
      }
    }

    if (remoteData.balance && typeof remoteData.balance === 'object') {
      Object.assign(this.balanceConfig, remoteData.balance);
      updated = true;
    }

    if (remoteData.buildings && typeof remoteData.buildings === 'object') {
      for (const [id, bData] of Object.entries(remoteData.buildings)) {
        if (bData && typeof bData === 'object') {
          this.buildings[id] = { ...(this.buildings[id] || {}), ...(bData as BuildingState) };
          (INITIAL_BUILDINGS as any)[id] = { ...((INITIAL_BUILDINGS as any)[id] || {}), ...(bData as BuildingState) };
          updated = true;
        }
      }
    }

    if (remoteData.customOverrides && typeof remoteData.customOverrides === 'object') {
      this.applyCustomPackage(remoteData.customOverrides, false);
      updated = true;
    }

    if (remoteData.buildingTierConfigs && typeof remoteData.buildingTierConfigs === 'object') {
      this.applyCustomPackage({ buildingTierConfigs: remoteData.buildingTierConfigs }, false);
      updated = true;
    }

    if (remoteData.buildingBaseCosts && typeof remoteData.buildingBaseCosts === 'object') {
      this.applyCustomPackage({ buildingBaseCosts: remoteData.buildingBaseCosts }, false);
      updated = true;
    }

    if (remoteData.forgeItemBaseCosts && typeof remoteData.forgeItemBaseCosts === 'object') {
      this.applyCustomPackage({ forgeItemBaseCosts: remoteData.forgeItemBaseCosts }, false);
      updated = true;
    }

    if (updated) {
      this.isRemoteSynced = true;
      this.notifyListeners();
      try {
        import('../managers/GameManager').then(({ GameManager }) => {
          const gm = GameManager.getInstance();
          gm.emit('buildingUpdated');
          gm.emit('update');
          gm.emit('resourcesChanged');
        }).catch(() => {});
      } catch (_) {}
    }

    return updated;
  }

  public initRealtimeSync(): void {
    if (this.unsubscribeRealtime) return;

    try {
      const dataRef = ref(db, 'game_data');
      this.unsubscribeRealtime = onValue(
        dataRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const remoteData = snapshot.val();
            const updated = this.applyRemoteData(remoteData, 'Firebase Realtime');
            if (updated) {
              console.log('[GameDataService] ⚡ Remote game data updated in real-time from Firebase.');
            }
          }
        },
        (error) => {
          console.warn('[GameDataService] Failed to listen to game_data changes:', error);
        }
      );
      console.log('[GameDataService] Realtime sync listener registered on /game_data.');
    } catch (err) {
      console.warn('[GameDataService] Error setting up realtime sync listener:', err);
    }
  }

  public async syncRemoteOverrides(): Promise<boolean> {
    try {
      const dataRef = ref(db, 'game_data');
      const snapshot = await get(dataRef);

      if (snapshot.exists()) {
        const remoteData = snapshot.val();
        return this.applyRemoteData(remoteData, 'Firebase get()');
      }
    } catch (err) {
      console.warn('[GameDataService] Failed to sync remote overrides from Firebase. Using local master data.', err);
    }
    return false;
  }

  /**
   * 🚀 마스터 데이터 통합 배포: 로컬 프리셋 파일(/api/custom-data/save) + Firebase 실시간 DB(/game_data) 동시 배포
   */
  public async deployMasterData(packageData?: CustomGameDataPackage): Promise<{
    success: boolean;
    localSaved: boolean;
    cloudSynced: boolean;
    message: string;
  }> {
    if (packageData) {
      this.applyCustomPackage(packageData, true);
    }

    this.customOverrides.updatedAt = Date.now();
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(IDB_DATA_KEY, JSON.stringify(this.customOverrides));
      } catch (_) {}
    }

    // 1. 로컬 정적 배포 파일 저장 시도
    let localSaved = false;
    let localMessage = '';
    try {
      const localRes = await this.saveCustomDataToServer();
      localSaved = localRes.success;
      localMessage = localRes.message;
    } catch (e: any) {
      localMessage = e?.message || '로컬 서버 미응답';
    }

    // 2. Firebase 실시간 데이터베이스 배포 시도
    let cloudSynced = false;
    let cloudMessage = '';
    const fb = FirebaseService.getInstance();
    const currentUser = fb.getCurrentUser();

    if (currentUser && fb.isMasterUser()) {
      try {
        const dataRef = ref(db, 'game_data');
        const payload = {
          updatedAt: Date.now(),
          updatedBy: currentUser.email || currentUser.uid,
          monsters: MONSTERS,
          buildings: INITIAL_BUILDINGS,
          recipes: EQUIPMENT_RECIPES,
          buildingBaseCosts: BUILDING_BASE_COSTS,
          forgeItemBaseCosts: FORGE_ITEM_BASE_COSTS,
          initialHeroes: INITIAL_HEROES_CONFIG,
          customOverrides: this.customOverrides,
          buildingTierConfigs: this.customOverrides.buildingTierConfigs || {},
          balance: this.balanceConfig,
          nemesis: NEMESIS_BOSS_CONFIG,
        };
        await set(dataRef, payload);
        cloudSynced = true;
        cloudMessage = 'Firebase 클라우드 배포 완료';
        console.log('[GameDataService] ✅ Master game data synced to Firebase /game_data successfully.');
      } catch (fbErr: any) {
        console.warn('[GameDataService] Firebase seed failed:', fbErr);
        cloudMessage = `Firebase 배포 실패: ${fbErr?.message || fbErr}`;
      }
    } else {
      cloudMessage = currentUser ? '마스터 권한 부족 (@bumpcat.net 필요)' : '미로그인 상태 (클라우드 미배포)';
    }

    // 3. 인게임 UI 및 매니저에 즉각 반영 통지
    try {
      import('../managers/GameManager').then(({ GameManager }) => {
        const gm = GameManager.getInstance();
        gm.emit('buildingUpdated');
        gm.emit('update');
        gm.emit('resourcesChanged');
      }).catch(() => {});
    } catch (_) {}

    this.notifyListeners();

    // 4. 결과 메시지 조합
    const overallSuccess = localSaved || cloudSynced;
    let finalMessage = '';
    if (localSaved && cloudSynced) {
      finalMessage = '🚀 배포 파일(custom_game_data.json)과 Firebase 클라우드(/game_data)에 성공적으로 동기화 배포되었습니다!';
    } else if (cloudSynced) {
      finalMessage = '☁️ Firebase 실시간 DB(/game_data)에 성공적으로 배포되었습니다! 모든 접속자에게 실시간 적용됩니다.';
    } else if (localSaved) {
      finalMessage = `📁 로컬 정적 배포 파일(custom_game_data.json)에 저장되었습니다. (${cloudMessage})`;
    } else {
      finalMessage = '💾 브라우저 로컬 저장소 및 인게임에 즉시 적용되었습니다. (정적 파일 및 클라우드 미연결)';
    }

    return {
      success: overallSuccess,
      localSaved,
      cloudSynced,
      message: finalMessage,
    };
  }

  public async seedMasterDataToFirebase(): Promise<{ success: boolean; message: string }> {
    const res = await this.deployMasterData();
    return {
      success: res.cloudSynced || res.localSaved,
      message: res.message
    };
  }

  public isSyncedWithRemote(): boolean {
    return this.isRemoteSynced;
  }
}
