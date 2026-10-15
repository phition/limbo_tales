import { MONSTERS } from '../data/monsters';
import { EQUIPMENT_RECIPES, FORGE_ITEM_BASE_COSTS } from '../data/equipment';
import { INITIAL_BUILDINGS, BUILDING_BASE_COSTS } from '../data/buildings';
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

    const merged: CustomGameDataPackage = {
      ...(staticPreset || {}),
      ...(savedOverrides || {})
    };

    if (Object.keys(merged).length > 0) {
      this.applyCustomPackage(merged, false);
    }
  }

  /**
   * 🌟 커스텀 데이터 패키지를 인게임 런타임에 즉각 적용
   */
  public applyCustomPackage(pkg: CustomGameDataPackage, persist = true): void {
    this.customOverrides = { ...this.customOverrides, ...pkg };

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
   * ☁️ 원격 데이터를 로컬 메모리 및 전역 데이터 객체에 병합
   */
  public applyRemoteData(remoteData: any, source: string = 'remote'): boolean {
    if (!remoteData || typeof remoteData !== 'object') return false;

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

    if (updated) {
      this.isRemoteSynced = true;
      this.notifyListeners();
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

  public async seedMasterDataToFirebase(): Promise<{ success: boolean; message: string }> {
    const fb = FirebaseService.getInstance();
    const currentUser = fb.getCurrentUser();

    if (!currentUser) {
      return { success: false, message: '로그인 상태가 아닙니다. @bumpcat.net 지휘관 계정으로 로그인해 주세요.' };
    }

    if (!fb.isMasterUser()) {
      return {
        success: false,
        message: `마스터 권한이 없습니다. (현재 계정: ${currentUser.email || '익명 계정'} / @bumpcat.net 이메일 필요)`
      };
    }

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
        balance: this.balanceConfig,
        nemesis: NEMESIS_BOSS_CONFIG,
      };

      await set(dataRef, payload);
      console.log('[GameDataService] Master game data seeded to Firebase /game_data successfully.');
      return { success: true, message: '✅ Firebase /game_data 노드에 마스터 데이터가 성공적으로 저장되었습니다!' };
    } catch (err: any) {
      console.error('[GameDataService] Failed to seed master game data to Firebase.', err);
      const errMsg = err?.message || String(err);
      if (errMsg.includes('PERMISSION_DENIED')) {
        return {
          success: false,
          message: '❌ PERMISSION_DENIED: Firebase 콘솔 > Realtime Database > 규칙 탭에 game_data 쓰기 규칙을 게시해 주세요!'
        };
      }
      return { success: false, message: `❌ 시딩 실패: ${errMsg}` };
    }
  }

  public isSyncedWithRemote(): boolean {
    return this.isRemoteSynced;
  }
}
