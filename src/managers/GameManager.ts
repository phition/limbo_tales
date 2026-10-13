export interface TraitDef {
  name: string;
  desc: string;
  atkMod: number;
  defMod: number;
  hpMod: number;
  mpMod: number;
  spdMod: number;
  luckMod: number;
}

export const HERO_TRAITS: Record<string, TraitDef> = {
  '맹렬한 투사':   { name: '맹렬한 투사',   desc: '공격력 +12%, 체력 +5%, 행운 +5', atkMod: 1.12, defMod: 0.95, hpMod: 1.05, mpMod: 0.95, spdMod: 0, luckMod: 5 },
  '강철의 수호자': { name: '강철의 수호자', desc: '방어력 +18%, 체력 +15%, 행운 -3', atkMod: 0.95, defMod: 1.18, hpMod: 1.15, mpMod: 0.95, spdMod: -1, luckMod: -3 },
  '신속한 그림자': { name: '신속한 그림자', desc: '속도 +2, 행운 +8, 공격력 +5%', atkMod: 1.05, defMod: 0.92, hpMod: 0.95, mpMod: 1.05, spdMod: 2, luckMod: 8 },
  '비전 탐구자':   { name: '비전 탐구자',   desc: '마나 +20%, 공격력 +8%, 행운 +4', atkMod: 1.08, defMod: 0.95, hpMod: 0.95, mpMod: 1.20, spdMod: 0, luckMod: 4 },
  '생존의 달인':   { name: '생존의 달인',   desc: '체력 +12%, 방어력 +8%, 속도 +1, 행운 +3', atkMod: 1.00, defMod: 1.08, hpMod: 1.12, mpMod: 1.00, spdMod: 1, luckMod: 3 },
  '균형잡힌 정예': { name: '균형잡힌 정예', desc: '전 능력치 +5%, 속도 +1, 행운 +4', atkMod: 1.05, defMod: 1.05, hpMod: 1.05, mpMod: 1.05, spdMod: 1, luckMod: 4 },
  '광전사의 혈통': { name: '광전사의 혈통', desc: '공격력 +16%, 체력 +8%, 행운 +6', atkMod: 1.16, defMod: 0.90, hpMod: 1.08, mpMod: 0.90, spdMod: 1, luckMod: 6 },
  '신성한 서약':   { name: '신성한 서약',   desc: '체력 +10%, 마나 +15%, 방어력 +10%, 행운 +2', atkMod: 0.98, defMod: 1.10, hpMod: 1.10, mpMod: 1.15, spdMod: 0, luckMod: 2 },
};

import {
  GameResources,
  BuildingId,
  BuildingState,
  Mercenary,
  Quest,
  LogEntry,
  PartySynergy,
  PositionSlot,
  EquipmentItem,
  EquipmentRecipe,
  EquipmentSlot,
  TavernCandidate,
  MonsterData,
  MercenaryGrade,
  DungeonItemSlot,
  Skill,
  SkillBookItem,
  PendingLootItem,
  ExpeditionReturnReport,
  StatusEffect,
  ArenaOpponent,
  NemesisState,
  InvasionTarget,
  InvasionDefenseLog,
  InvasionState,
  SelectiveResetOptions,
  FallenHero,
  ActiveAncestralBlessing,
  CodexCollectionItem,
  EquipmentRarity,
  EnchantOption,
  DimensionalDeck,
  TacticalTowerState,
  TacticalTowerBranch
} from '../types/game';
import { createActiveBlessingForHero, getOfferingEtherCost } from '../data/ancestralBlessings';
import { CODEX_COLLECTIONS } from '../data/codex';
import { NEMESIS_BOSS_CONFIG, NEMESIS_MILESTONES, NEMESIS_CYCLE_CONSTANTS } from '../data/nemesis';
import { INITIAL_BUILDINGS, BUILDING_BASE_COSTS } from '../data/buildings';
import { INITIAL_QUESTS } from '../data/quests';
import { CHARACTER_CLASSES } from '../data/classes';
import { INITIAL_HEROES_CONFIG } from '../data/mercenaries';
import { 
  EQUIPMENT_RECIPES, 
  PREFIX_ENCHANT_OPTIONS, 
  SUFFIX_ENCHANT_OPTIONS, 
  generateBossUniqueEquipment, 
  getForgeEquipmentRecipes, 
  sanitizeEquipmentEnchantSkills,
  getEnchantSuccessRate,
  getEnchantStoneCost,
  getEnchantResourceCosts,
  getEnchantCandidates,
  recalculateEquipmentStats,
  getEquipmentBaseStats,
  CURSED_EQUIP_BASES,
  createPurifiedEquipmentFromCursed,
  corruptEquipment,
  purifyCorruptedEquipment,
  getHeroEquippedBossSet,
  detectWeaponType,
  getWeaponTrait,
  detectAccessoryType,
  rollForgeItemRarity,
  applyForgeRarityBonus,
  getForgeRarityRates
} from '../data/equipment';
import { calculatePartySynergies, ALL_PARTY_SYNERGIES } from '../data/synergies';
import { ALL_SKILL_BOOKS, ALL_SKILLS_MAP, getSkillBookRarity, GRIMOIRE_RARITY_META, getMasteryGainPerBook, cleanMonsterNameForDrop, adjustSkillDescriptionForDrop, normalizeDroppedSkillDescription, determineSkillAffinity, getSkillAffinityMeta } from '../data/skillBooks';
import { getIconMeta } from '../utils/iconMap';
import { GRIMOIRE_CRAFT_RECIPES, GRIMOIRE_CRAFT_SUCCESS_RATES, GrimoireRecipe } from '../data/classSkillRecipes';
import { BUILDING_TECH_TREE, BUILDING_MILESTONE_TIERS, getBuildingConstructionDurationSec } from '../data/buildings';
import { FirebaseService } from '../services/FirebaseService';
import { GameDataService } from '../services/GameDataService';
import { I18nService } from '../i18n/I18nService';
import { RESOURCE_NAMES } from '../i18n/dataLocales';
import { SoundManager } from './SoundManager';
import { triggerHaptic } from '../utils/haptics';
import { Capacitor } from '@capacitor/core';

const BASE_SAVE_KEY = 'LIMBO_TALES_SAVE_V08';

export class GameManager {
  private static instance: GameManager;

  public resources: GameResources = {
    // 🪵 기본 원자재
    wood: 50,   stone: 50,  iron: 30,
    food: 20,   gold: 200,  ether: 10,
    // 🌿 특수 파밍 재료
    herb: 15,   leather: 15, silk: 10, coal: 15, bone: 15,
    crystal: 5, void_shard: 2,
    // ✨ 인챈트 마도석
    prefix_stone: 3, suffix_stone: 2, pure_prefix_stone: 1, pure_suffix_stone: 0,
    // 👑 광폭화 보스 전용 신화 유물
    relic_floor_1: 0, relic_floor_2: 0, relic_floor_3: 0, relic_floor_4: 0, relic_floor_5: 0,
    relic_floor_6: 0, relic_floor_7: 0, relic_floor_8: 0, relic_floor_9: 0, relic_floor_10: 0
  };

  public buildings: Record<BuildingId, BuildingState> = JSON.parse(JSON.stringify(INITIAL_BUILDINGS));
  public quests: Quest[] = JSON.parse(JSON.stringify(INITIAL_QUESTS));
  public subQuestCooldownUntil: number = 0; // 서브 퀘스트 리필 10분 쿨다운 타임스탬프
  public hasInitializedSubQuests: boolean = false; // 주점 완공 후 서브 퀘스트 초기 3개 지급 완료 여부
  
  // 3인 원정대 파티 및 전체 용병 보관소
  public party: Mercenary[] = [];
  public barracks: Mercenary[] = [];
  
  // 장비 인벤토리 & 주점 고용 풀
  public equipmentInventory: EquipmentItem[] = [];
  public skillBookInventory: SkillBookItem[] = [];
  public customSkills: Record<string, Skill> = {};
  public tavernCandidates: TavernCandidate[] = [];
  public tavernArrivalSecondsLeft: number = 600;
  public tavernRefreshCount: number = 0;

  // 의료소 입원 환자 관리 (용병 ID 목록)
  public infirmaryPatients: string[] = [];

  // ✨ 정화된 장비 이력 (최근 5분간 유지)
  public purifiedEquipmentHistory: { item: EquipmentItem; purifiedAt: number }[] = [];

  // 🧭⌛ 크로노스 시공간 에픽 완료 시 해금: 차원의 나침반을 완전 대체하여 용병 이송 턴을 0턴으로 완전 소멸
  public hasChronoCompass: boolean = false;

  public citadelLogs: LogEntry[] = [];
  public dungeonLogs: LogEntry[] = [];
  public battleLogs: LogEntry[] = [];
  public currentBattleTurn: number = 1;

  public setBattleTurn(turn: number): void {
    this.currentBattleTurn = Math.max(1, turn);
  }
  public logs: LogEntry[] = [];
  public currentArenaRank: number = 24;
  public currentArenaRating: number = 1200;
  public arenaCoins: number = 150;
  public arenaStreak: number = 0;
  public pveBuffActive: boolean = false;
  
  // ── 🛒 블랙 마켓 품목별 재고 및 매진 시 10분 재입고 상태 ──
  public marketStock: Record<string, { current: number; restockAt?: number }> = {};
  
  // ── 🌌 차원 네메시스 (Dimensional Nemesis) 월드 레이드 상태 ──
  public nemesisState: NemesisState = {
    totalDamage: 0,
    highestDamage: 0,
    currentBossHp: NEMESIS_BOSS_CONFIG.maxHp,
    maxBossHp: NEMESIS_BOSS_CONFIG.maxHp,
    phase: 1,
    claimedMilestones: [],
    dailyAttempts: 3,
    lastDate: new Date().toISOString().slice(0, 10),
    cycleStartTime: Date.now(),
    lastPlunderCheckTime: Date.now(),
    lastHpRegenTime: Date.now(),
    windowStartHp: NEMESIS_BOSS_CONFIG.maxHp,
    isDefeated: false,
  };

  // ── 🏰 차원 영지 침공 (Dimensional Estate Invasion) 상태 ──
  public invasionState: InvasionState = {
    squadHeroIds: [],
    invasionCoins: 0,
    peaceShieldUntil: 0,
    defenseLogs: [],
    totalInvasions: 0,
    totalWins: 0,
    totalPlundered: {},
    lastScoutedAt: 0,
    tacticalTower: {
      attack: { tier1: 0, tier2: 0, tier3: 0 },
      defense: { tier1: 0, tier2: 0, tier3: 0 },
      utility: { tier1: 0, tier2: 0, tier3: 0 },
    },
  };
  
  // 모닥불 온기 버프 시스템
  public bonfireStacks: number = 0;
  public bonfireWarmthTime: number = 0;
  public lastTickTimestamp: number = Date.now();
  public offlineReport: {
    elapsedSeconds: number;
    formattedTime: string;
    resourcesGained: Partial<Record<keyof GameResources, number>>;
    grossProduced?: Partial<Record<keyof GameResources, number>>;
    foodConsumedByInfirmary: number;
    etherConsumedByInfirmary?: number;
    healedHeroes: Array<{ id: string; name: string; hpGained: number; isFullyHealed: boolean }>;
    bonfireWarmthExpired: boolean;
    bonfireSecondsLeft: number;
    upkeepGoldPaid: number;
    upkeepFoodPaid?: number;
    upkeepEtherPaid?: number;
  } | null = null;
  public lastOfflineReport: any = null;
  public currentSceneContext: 'citadel' | 'exploration' | 'battle' | 'arena' = 'citadel';

  // 던전 진행도 및 현재 조우 몬스터
  public dungeonFloor: number = 1;
  public overchargedBossDefeatedOnFloor: number = 0;
  public defeatedOverchargedFloorsThisRun: number[] = [];
  public dungeonDangerLevel: number = 0;
  public campCooldown: number = 0; // 🏕️ 야영 쿨다운 (탐색 3회당 1회)
  public mercenaryManageCharges: number = 1; // 👥 던전 용병 관리 횟수 (최초 1회, 야영 시 1회 충전, 최대 1회)
  public inTransitHero: { targetSlot: number; heroId: string; heroName: string; turnsLeft: number } | null = null; // 🚚 긴급 이송 대기
  public isOvercharged: boolean = false;
  public unlockedDungeonFloor: number = 1;
  public hasEnteredDungeon: boolean = false;
  public hasReturnedFromDungeon: boolean = false;
  public hasCraftedEquipment: boolean = false;
  public hasCraftedGrimoire: boolean = false;
  public unlockedAviciTier: number = 1; // 🌌 무간도 세부 진입 계층 (1~10층, 위험도 0~9,000)
  public purifiedFloors: number[] = []; // ✨ 연무가 정화된 심연 층 목록
  public portalAppeared: boolean = false;
  public currentMonsters: MonsterData[] = [];
  public returnReport: ExpeditionReturnReport | null = null;
  public citadelSupplies: Record<string, number> = {
    torch: 0, food: 0, pickaxe: 0, bandage: 0, holy_water: 0, key: 0, rift_anchor: 0,
    enhanced_torch: 0, enhanced_food: 0, enhanced_pickaxe: 0, enhanced_bandage: 0, enhanced_holy_water: 0, enhanced_key: 0, enhanced_rift_anchor: 0
  };

  // 던전 전용 임시 인벤토리 (성공 귀환 시 정산, 실패 시 소실)
  // 던전 전용 임시 인벤토리 (성공 귀환 시 정산, 실패 시 소실)
  public dungeonInventory: DungeonItemSlot[] = [];
  public pendingLoot: any[] = []; // PendingLootItem[]
  public backpackCapacity: number = 16;
  public lastSelectedBagId: string = 'medium';
  public activeCatalysts: string[] = [];
  // 🎬 광고 보상형 일일 순환 상태 (성화 일일 5회, 짐수레는 광고 1회당 1회 사용, 촉매 슬롯 개방)
  public bonfireAdCharges: number = 5;
  public wagonAdCharges: number = 0;
  public hasCatalystCharge: boolean = false;
  public lastAdDailyResetDate: string = '';

  // 용병 간 유대 수치 (key: heroAId_heroBId, value: 0~100)
  public bonds: Record<string, number> = {};

  // 🪦 성채 묘지 (영구 사망한 영웅들의 명단)
  public cemetery: FallenHero[] = [];

  // 🪦 묘비 헌화 경험치 버프 만료 시각 (ms)
  public memorialExpBuffUntil: number = 0;

  // ⚰️ 영령의 가호 (현재 결속된 영령의 시너지)
  public activeAncestralBlessing: ActiveAncestralBlessing | null = null;

  // ✨ 던전 탐험 이벤트 가호 (이번 원정 동안 유지되는 파티 버프/시너지)
  public expeditionBuffs: PartySynergy[] = [];

  // 📜 심연의 백과 및 회고록 (완료/해금된 컬렉션 ID 목록 및 등록 순서)
  public codexUnlockedItems: Record<string, boolean> = {};
  public codexUnlockOrder: string[] = [];
  public codexUnlockedTimestamps: Record<string, number> = {};

  // 👑 마스터 계정 플래그 (차원 앵커 멀티 요소 노출 및 관리자 기능)
  private _isMasterAccount: boolean = false;
  public get isMasterAccount(): boolean {
    if (this._isMasterAccount) return true;
    try {
      if (FirebaseService.getInstance().isMasterUser()) return true;
    } catch (_) {}
    return false;
  }
  public set isMasterAccount(val: boolean) {
    this._isMasterAccount = val;
  }

  // 현재 화면 상태 (React 라우터 역할)
  public currentScreen: 'citadel' | 'exploration' | 'battle' | 'arena' = 'citadel';
  private currentUserId: string = 'guest';

  public setCurrentUser(uid: string | null): void {
    this.currentUserId = uid || 'guest';
  }

  public getCurrentUserId(): string {
    return this.currentUserId;
  }

  public getSaveKey(): string {
    return `${BASE_SAVE_KEY}_${this.currentUserId || 'guest'}`;
  }

  private tickerInterval: ReturnType<typeof setInterval> | null = null;
  private tickCount: number = 0;
  private listeners: Record<string, Array<(data?: unknown) => void>> = {};
  private cloudSaveDebounceTimer: ReturnType<typeof setTimeout> | null = null;
  private isCheckingQuests: boolean = false;


  private constructor() {
    this.initDefaultData();
    this.loadGame();
    if (this.tavernCandidates.length === 0) {
      this.refreshTavernPool();
    }
    this.checkAllQuestObjectives();
    this.startResourceTicker();
    // ☁️ Firebase 게임 마스터 데이터 실시간 동기화 (최초 로드 및 변경 시 Hot Reload)
    GameDataService.getInstance().onUpdate(() => {
      const gds = GameDataService.getInstance();
      for (const [skId, sk] of Object.entries(this.customSkills)) {
        if (skId.startsWith('skill_m_')) {
          const bOverride = gds.getSkillBookOverride(skId.replace(/^skill_m_/, 'book_m_'));
          if (bOverride) {
            if (bOverride.power !== undefined) sk.power = bOverride.power;
            if (bOverride.manaCost !== undefined) sk.manaCost = bOverride.manaCost;
            if (bOverride.cooldown !== undefined) sk.cooldown = bOverride.cooldown;
            if (bOverride.description !== undefined) sk.description = bOverride.description;
          }
        }
      }
      this.skillBookInventory.forEach(b => {
        const bOverride = gds.getSkillBookOverride(b.bookId);
        if (bOverride && b.skill) {
          if (bOverride.power !== undefined) {
            b.basePower = bOverride.power;
            b.skill.power = bOverride.power;
          }
          if (bOverride.manaCost !== undefined) b.skill.manaCost = bOverride.manaCost;
          if (bOverride.cooldown !== undefined) b.skill.cooldown = bOverride.cooldown;
          if (bOverride.description !== undefined) b.skill.description = bOverride.description;
        }
      });
      this.emit('update');
      this.addLog('☁️ [클라우드 데이터] 최신 마스터 데이터(몬스터/비전서/밸런스)가 실시간 동기화되었습니다.', 'system');
    });
    GameDataService.getInstance().initRealtimeSync();
  }

  public static getInstance(): GameManager {
    if (!GameManager.instance) {
      GameManager.instance = new GameManager();
    }
    return GameManager.instance;
  }

  public static readonly GRADE_STAT_MULT: Record<MercenaryGrade, number> = {
    rookie: 1.0,
    veteran: 1.20,
    hero: 1.45,
    elite: 1.45,
    epic: 1.75,
    legend: 2.10
  };

  public static readonly GRADE_GROWTH_BONUS: Record<MercenaryGrade, { hpBonus: number; statBonus: number; luckBonusPct: number }> = {
    rookie:  { hpBonus: 0, statBonus: 0.0, luckBonusPct: 0.00 }, // N: 기본
    veteran: { hpBonus: 2, statBonus: 0.3, luckBonusPct: 0.10 }, // V: HP+2, 주스탯+0.3, 행운+10%
    hero:    { hpBonus: 4, statBonus: 0.6, luckBonusPct: 0.20 }, // H: HP+4, 주스탯+0.6, 행운+20%
    elite:   { hpBonus: 4, statBonus: 0.6, luckBonusPct: 0.20 }, // H(동급): HP+4, 주스탯+0.6, 행운+20%
    epic:    { hpBonus: 7, statBonus: 1.0, luckBonusPct: 0.30 }, // E: HP+7, 주스탯+1.0, 행운+30%
    legend:  { hpBonus: 12, statBonus: 1.5, luckBonusPct: 0.50 } // L: HP+12, 주스탯+1.5, 행운+50%
  };

  public static readonly ROLE_GROWTH: Record<string, { hp: number; mp: number; atk: number; def: number; spd: number; luck: number }> = {
    tank:        { hp: 14, mp: 3,  atk: 2, def: 2,   spd: 0.5, luck: 0.5 },
    dealer_phy:  { hp: 10, mp: 3,  atk: 3, def: 1,   spd: 1.0, luck: 1.2 },
    berserker:   { hp: 12, mp: 3,  atk: 3, def: 1.5, spd: 0.8, luck: 0.8 },
    dealer_mag:  { hp: 7,  mp: 6,  atk: 3, def: 1,   spd: 0.8, luck: 0.8 },
    gunner:      { hp: 8,  mp: 5,  atk: 3, def: 1,   spd: 1.0, luck: 1.1 },
    healer:      { hp: 9,  mp: 5,  atk: 1, def: 1.5, spd: 0.8, luck: 0.8 },
  };

  public static readonly DEFAULT_GROWTH = { hp: 10, mp: 6, atk: 2, def: 1, spd: 1, luck: 0.8 };

  public static readonly ROOT_CLASS_MAP: Record<string, string> = {
    squire: 'squire', paladin: 'squire', guardian: 'squire', aegis_valkyrie: 'squire', fortress: 'squire',
    rogue: 'rogue', assassin: 'rogue', duelist: 'rogue', shadow_phantom: 'rogue', blade_dancer: 'rogue',
    apprentice: 'apprentice', elementalist: 'apprentice', arcane_scholar: 'apprentice', calamity_mage: 'apprentice', chronomancer: 'apprentice',
    acolyte: 'acolyte', bishop: 'acolyte', war_priest: 'acolyte', high_saintess: 'acolyte', crusader_lord: 'acolyte',
    vanguard: 'vanguard', berserker: 'vanguard', warlord: 'vanguard', valhalla_blade: 'vanguard', iron_marshal: 'vanguard',
    gunner: 'gunner', tactical_gunner: 'gunner', sharpshooter: 'gunner', aether_gun_meister: 'gunner', ghost_sniper: 'gunner',
  };

  public static readonly ROOT_BASE_STATS: Record<string, { hp: number; mp: number; atk: number; def: number; spd: number; luck: number }> = {
    squire:     { hp: 260, mp: 20, atk: 14, def: 14, spd: 8,  luck: 10 },
    rogue:      { hp: 180, mp: 30, atk: 18, def: 7,  spd: 14, luck: 22 },
    apprentice: { hp: 150, mp: 54, atk: 17, def: 5,  spd: 10, luck: 15 },
    acolyte:    { hp: 170, mp: 51, atk: 6,  def: 9,  spd: 9,  luck: 16 },
    vanguard:   { hp: 250, mp: 25, atk: 20, def: 10, spd: 11, luck: 14 },
    gunner:     { hp: 170, mp: 50, atk: 19, def: 8,  spd: 13, luck: 20 },
  };

  public static calcHeroStatsForClassAndLevel(
    classId: string,
    level: number,
    grade: MercenaryGrade,
    traitName?: string,
    promotionBonuses?: Array<'hp' | 'mp' | 'atk' | 'def' | 'spd' | 'luck'>,
    awakeningBonuses?: Array<'hp' | 'mp' | 'atk' | 'def' | 'spd' | 'luck'>
  ): { maxHp: number; maxMp: number; stats: { atk: number; def: number; spd: number; luck: number } } {
    const cClass = CHARACTER_CLASSES[classId] || CHARACTER_CLASSES['squire'];
    const rootId = GameManager.ROOT_CLASS_MAP[classId] || 'squire';
    const rootBase = GameManager.ROOT_BASE_STATS[rootId] || GameManager.ROOT_BASE_STATS['squire'];
    const classBase = cClass.baseStats || rootBase;
    const statMult = GameManager.GRADE_STAT_MULT[grade] || 1.0;
    const baseGrowth = GameManager.ROLE_GROWTH[cClass.role] || GameManager.DEFAULT_GROWTH;
    const gradeGrowth = GameManager.GRADE_GROWTH_BONUS[grade] || { hpBonus: 0, statBonus: 0, luckBonusPct: 0 };
    const effectiveGrowth = {
      hp: baseGrowth.hp + gradeGrowth.hpBonus,
      mp: baseGrowth.mp + Math.round(gradeGrowth.hpBonus * 0.4),
      atk: baseGrowth.atk + gradeGrowth.statBonus,
      def: baseGrowth.def + gradeGrowth.statBonus,
      spd: baseGrowth.spd + gradeGrowth.statBonus * 0.5,
      luck: baseGrowth.luck * (1 + gradeGrowth.luckBonusPct)
    };
    const lvlBonus = Math.max(0, level - 1);
    const trait = traitName ? (HERO_TRAITS[traitName] || null) : null;

    const hpMod = trait?.hpMod ?? 1.0;
    const mpMod = trait?.mpMod ?? 1.0;
    const atkMod = trait?.atkMod ?? 1.0;
    const defMod = trait?.defMod ?? 1.0;
    const spdMod = trait?.spdMod ?? 0;
    const luckMod = trait?.luckMod ?? 0;

    let maxHp = (classBase.hp * statMult + effectiveGrowth.hp * lvlBonus) * hpMod;
    let maxMp = (classBase.mp * statMult + effectiveGrowth.mp * lvlBonus) * mpMod;
    let atk = (classBase.atk * statMult + effectiveGrowth.atk * lvlBonus) * atkMod;
    let def = (classBase.def * statMult + effectiveGrowth.def * lvlBonus) * defMod;
    let spd = classBase.spd * statMult + effectiveGrowth.spd * lvlBonus + spdMod;
    let luck = classBase.luck * statMult + effectiveGrowth.luck * lvlBonus + luckMod;

    // 🌟 [전직 특화 스탯 +30% 적용]: 전직 시 선택한 스탯만 30% 영구 집중 증폭
    if (Array.isArray(promotionBonuses)) {
      promotionBonuses.forEach(b => {
        if (b === 'hp') maxHp *= 1.30;
        else if (b === 'mp') maxMp *= 1.30;
        else if (b === 'atk') atk *= 1.30;
        else if (b === 'def') def *= 1.30;
        else if (b === 'spd') spd *= 1.30;
        else if (b === 'luck') luck *= 1.30;
      });
    }

    // 🔮 [초월 각성 스탯 +15% 적용]: 2차 전직 후 10레벨마다 각성 시 선택한 스탯 15% 영구 집중 증폭
    if (Array.isArray(awakeningBonuses)) {
      awakeningBonuses.forEach(b => {
        if (b === 'hp') maxHp *= 1.15;
        else if (b === 'mp') maxMp *= 1.15;
        else if (b === 'atk') atk *= 1.15;
        else if (b === 'def') def *= 1.15;
        else if (b === 'spd') spd *= 1.15;
        else if (b === 'luck') luck *= 1.15;
      });
    }

    return {
      maxHp: Math.round(maxHp),
      maxMp: Math.round(maxMp),
      stats: {
        atk: Math.round(atk),
        def: Math.round(def),
        spd: Math.round(spd),
        luck: Math.max(0, Math.round(luck * 10) / 10)
      }
    };
  }

  public sanitizeHero(hero: Partial<Mercenary> | Mercenary): Mercenary {
    if (!hero) return hero as Mercenary;
    if (!hero.equipment || typeof hero.equipment !== 'object') {
      hero.equipment = {};
    } else {
      (['weapon', 'armor', 'accessory'] as EquipmentSlot[]).forEach(slot => {
        if (hero.equipment && hero.equipment[slot] === undefined) {
          delete hero.equipment[slot];
        } else if (hero.equipment && hero.equipment[slot]) {
          hero.equipment[slot] = sanitizeEquipmentEnchantSkills(hero.equipment[slot]!);
          this.recalculateItemStats(hero.equipment[slot]!);
        }
      });
    }
    if (!Array.isArray(hero.statusEffects)) {
      hero.statusEffects = [];
    }
    if (!Array.isArray(hero.equippedSkills)) {
      hero.equippedSkills = [];
    }
    if (!Array.isArray(hero.learnedSkills)) {
      hero.learnedSkills = [...hero.equippedSkills];
    }
    if (!hero.skillMastery || typeof hero.skillMastery !== 'object') {
      hero.skillMastery = {};
    }
    if (Array.isArray(hero.learnedSkills)) {
      hero.learnedSkills.forEach(sid => {
        if (hero.skillMastery) {
          hero.skillMastery[sid] = Math.max(hero.skillMastery[sid] || 0, 100);
        }
      });
    }
    if (!Array.isArray(hero.studyingSkills)) {
      hero.studyingSkills = [];
    }
    if (hero.skillMastery) {
      Object.keys(hero.skillMastery).forEach(sid => {
        const mastery = hero.skillMastery![sid] || 0;
        if (mastery > 0 && mastery < 100 && !(hero.learnedSkills || []).includes(sid)) {
          if (!hero.studyingSkills!.includes(sid)) {
            hero.studyingSkills!.push(sid);
          }
        }
      });
    }
    hero.studyingSkills = hero.studyingSkills.filter(sid => !(hero.learnedSkills || []).includes(sid));
    if (hero.studyingSkills.length > 6) {
      hero.studyingSkills = hero.studyingSkills.slice(0, 6);
    }
    const cClass = hero.classId ? CHARACTER_CLASSES[hero.classId] : null;
    if (cClass) {
      const specialId = cClass.specialSkill.id;
      hero.learnedSkills = hero.learnedSkills.filter(sid => sid !== specialId && sid !== 'acolyte_blessing');
      hero.equippedSkills = hero.equippedSkills.filter(sid => sid !== specialId && sid !== 'acolyte_blessing').slice(0, 2);
    }
    if (!hero.stats) {
      hero.stats = { atk: 10, def: 5, spd: 10, luck: 10 };
    } else {
      if (hero.stats.atk !== undefined) hero.stats.atk = Math.round(hero.stats.atk);
      if (hero.stats.def !== undefined) hero.stats.def = Math.round(hero.stats.def);
      if (hero.stats.spd !== undefined) hero.stats.spd = Math.round(hero.stats.spd);
      if (hero.stats.luck !== undefined) hero.stats.luck = Math.round(hero.stats.luck * 10) / 10;
    }
    if (!Array.isArray(hero.promotionBonuses)) {
      hero.promotionBonuses = [];
    }
    if (!Array.isArray(hero.awakeningBonuses)) {
      hero.awakeningBonuses = [];
    }
    if (hero.awakeningCount === undefined) {
      hero.awakeningCount = hero.awakeningBonuses.length;
    }
    // 기존 세이브에서 전직/각성 시 스탯 손실이 발생했던 용병 자동 보정 및 스탯 최신화
    if (hero.classId && hero.level && hero.grade) {
      const cClass = CHARACTER_CLASSES[hero.classId];
      if (cClass) {
        if (!hero.trait) {
          hero.trait = (hero.title && HERO_TRAITS[hero.title]) ? hero.title : '균형잡힌 정예';
        }
        const expected = GameManager.calcHeroStatsForClassAndLevel(
          hero.classId,
          hero.level,
          hero.grade as MercenaryGrade,
          hero.trait,
          hero.promotionBonuses,
          hero.awakeningBonuses
        );
        // 만약 저장된 maxHp가 정상 계산값의 85% 미만인 경우 (과거 전직 버그로 스탯이 초기화되었던 경우)
        if (!hero.maxHp || hero.maxHp < expected.maxHp * 0.85) {
          hero.maxHp = Math.round(expected.maxHp);
          hero.currentHp = Math.round(Math.min(hero.maxHp, (hero.currentHp || hero.maxHp)));
          hero.maxMp = Math.round(expected.maxMp);
          hero.currentMp = Math.round(Math.min(hero.maxMp, (hero.currentMp || hero.maxMp)));
          hero.stats = { ...expected.stats };
        }
      }
    }
    // 체력 및 마나 정수(Math.round) 보장
    if (hero.maxHp !== undefined) hero.maxHp = Math.round(hero.maxHp);
    if (hero.currentHp !== undefined) hero.currentHp = Math.round(hero.currentHp);
    if (hero.maxMp !== undefined) hero.maxMp = Math.round(hero.maxMp);
    if (hero.currentMp !== undefined) hero.currentMp = Math.round(hero.currentMp);

    // 🛡️ 생존 대원 데이터 정합성 보장: 체력이 0보다 큰 영웅은 절대 사망/사경 상태가 될 수 없음
    if (hero.currentHp !== undefined && hero.currentHp > 0) {
      hero.isPermanentlyDead = false;
      hero.deathCountdown = undefined;
    } else if (hero.currentHp !== undefined && hero.currentHp <= 0) {
      hero.currentHp = 0;
    }

    return hero as Mercenary;
  }

  public resetToNewGame(): void {
    this.initDefaultData();
    this.saveGame();
    this.emit('resourcesChanged');
    this.emit('buildingUpdated');
    this.sortPartyByPosition();
    this.emit('partyUpdated', this.party);
    this.emit('questUpdated');
    this.emit('inventoryUpdated', this.equipmentInventory);
  }

  public initDefaultData(): void {
    // 1. 건물 완전 초기화 (INITIAL_BUILDINGS 기본 레벨/해금 상태로 복원)
    this.buildings = JSON.parse(JSON.stringify(INITIAL_BUILDINGS));

    // 2. 퀘스트 완전 초기화 (INITIAL_QUESTS 기본 상태로 복원)
    this.quests = JSON.parse(JSON.stringify(INITIAL_QUESTS));
    this.subQuestCooldownUntil = 0;
    this.hasInitializedSubQuests = false;

    // 3. 자원 초기화
    this.resources = {
      wood: 50,   stone: 50,  iron: 30,
      food: 20,   gold: 200,  ether: 10,
      herb: 15,   leather: 15, silk: 10, coal: 15, bone: 15,
      crystal: 5, void_shard: 2,
      prefix_stone: 3, suffix_stone: 2, pure_prefix_stone: 1, pure_suffix_stone: 0,
      relic_floor_1: 0, relic_floor_2: 0, relic_floor_3: 0, relic_floor_4: 0, relic_floor_5: 0,
      relic_floor_6: 0, relic_floor_7: 0, relic_floor_8: 0, relic_floor_9: 0, relic_floor_10: 0
    };

    // 4. 초기 3인 용병 파티 생성
    const heroesData = INITIAL_HEROES_CONFIG.map(h => this.sanitizeHero(JSON.parse(JSON.stringify(h))));
    this.barracks = [...heroesData];
    this.party = [...heroesData];

    // 5. 스킬북 및 장비 인벤토리 초기화
    this.skillBookInventory = [];
    this.addSkillBookToInventory('book_heavy_strike', 2);
    this.addSkillBookToInventory('book_first_aid', 2);
    this.addSkillBookToInventory('book_flame_cleave', 2);
    this.equipmentInventory = [];

    // 6. 던전 및 탐험 상태 초기화
    this.dungeonFloor = 1;
    this.unlockedDungeonFloor = 1;
    this.hasEnteredDungeon = false;
    this.hasCraftedEquipment = false;
    this.hasCraftedGrimoire = false;
    this.unlockedAviciTier = 1;
    this.purifiedFloors = [];
    this.dungeonDangerLevel = 0;
    this.isOvercharged = false;
    this.overchargedBossDefeatedOnFloor = 0;
    this.defeatedOverchargedFloorsThisRun = [];
    this.dungeonInventory = [];
    this.campCooldown = 0;
    this.activeCatalysts = [];
    this.backpackCapacity = 16;
    this.lastSelectedBagId = 'medium';

    // 7. 아레나 / 성화 / 병동 / 유대 초기화
    this.currentArenaRank = 100;
    this.currentArenaRating = 1000;
    this.arenaCoins = 0;
    this.pveBuffActive = false;
    this.bonfireStacks = 0;
    this.bonfireWarmthTime = 0;
    this.bonfireAdCharges = 5;
    this.wagonAdCharges = 0;
    this.hasCatalystCharge = false;
    this.lastAdDailyResetDate = new Date().toISOString().slice(0, 10);
    this.infirmaryPatients = [];
    this.bonds = {};
    this.citadelSupplies = {
      torch: 0, food: 0, pickaxe: 0, bandage: 0, holy_water: 0, key: 0, rift_anchor: 0,
      enhanced_torch: 0, enhanced_food: 0, enhanced_pickaxe: 0, enhanced_bandage: 0, enhanced_holy_water: 0, enhanced_key: 0, enhanced_rift_anchor: 0
    };
    this.cemetery = [this.getInitialFallenHero()];
    this.memorialExpBuffUntil = 0;
    this.activeAncestralBlessing = null;
    this.codexUnlockedItems = {};
    this.codexUnlockOrder = [];
    this.codexUnlockedTimestamps = {};

    this.tavernCandidates = [];
    this.tavernArrivalSecondsLeft = 600;
    this.tavernRefreshCount = 0;
    this.refreshTavernPool();

    this.citadelLogs = [];
    this.dungeonLogs = [];
    this.battleLogs = [];
    this.logs = [];
    this.addLog('차가운 흑무가 방주 성채를 감싸고 있습니다.', 'normal', 'citadel');
    this.addLog('📜 [방주 회고록: 선발 원정대의 비극] 심연으로 강하했던 3인의 선발대 중 견습 사제 [엘레나]가 마물의 습격에 쓰러져 성채 묘지에 안치되었습니다.', 'story', 'citadel');
    this.addLog('⚔️ 남겨진 2인의 원정대원(아이리스, 시안)으로 결원이 발생했습니다. 방랑자의 라운지를 건설하여 새로운 대원을 영입해야 합니다.', 'danger', 'citadel');
    this.addLog(this.getCurrentPartyLogText(), 'story', 'citadel');
    this.reconcileParty();
  }

  /** 게임 데이터 선택적 또는 전체 초기화 */
  public async resetGame(options?: SelectiveResetOptions): Promise<void> {
    const isFullReset = !options || (
      options.buildings &&
      options.resources &&
      options.heroes &&
      options.dungeon
    );

    if (isFullReset) {
      // 1. 기본 데이터 완전 초기화
      this.initDefaultData();

      // 2. 로컬 스토리지 세이브 및 지휘관 최고 전력 플래그 완전 삭제
      try {
        localStorage.removeItem(this.getSaveKey());
        const uid = this.getCurrentUserId();
        localStorage.removeItem(`limbo_commander_max_upgraded_v1_${uid}`);
        localStorage.removeItem(`limbo_commander_max_upgraded_v2_${uid}`);
        localStorage.removeItem(`limbo_commander_max_upgraded_v1_guest`);
        localStorage.removeItem(`limbo_commander_max_upgraded_v2_guest`);
      } catch (_) {}

      // 3. 클라우드 세이브 삭제 (options.cloud가 false가 아니면 기본 삭제)
      if (!options || options.cloud !== false) {
        try {
          await FirebaseService.getInstance().deleteProgress();
        } catch (err) {
          console.warn('클라우드 세이브 초기화 실패 (네트워크 또는 비로그인):', err);
        }
      }

      this.currentScreen = 'citadel';
      this.currentSceneContext = 'citadel';
      this.addLog('🔄 [완전 초기화] 모든 게임 데이터가 초기화되었습니다. 처음부터 다시 시작합니다.', 'story', 'citadel');
    } else {
      // 선택적 초기화
      const resetLogs: string[] = [];

      if (options.buildings) {
        this.buildings = JSON.parse(JSON.stringify(INITIAL_BUILDINGS));
        resetLogs.push('거점 건물');
      }

      if (options.resources) {
        this.resources = {
          wood: 50,   stone: 50,  iron: 30,
          food: 20,   gold: 200,  ether: 10,
          herb: 15,   leather: 15, silk: 10, coal: 15, bone: 15,
          crystal: 5, void_shard: 2,
          prefix_stone: 3, suffix_stone: 2, pure_prefix_stone: 1, pure_suffix_stone: 0,
          relic_floor_1: 0, relic_floor_2: 0, relic_floor_3: 0, relic_floor_4: 0, relic_floor_5: 0,
          relic_floor_6: 0, relic_floor_7: 0, relic_floor_8: 0, relic_floor_9: 0, relic_floor_10: 0
        };
        resetLogs.push('보유 자원');
      }

      if (options.heroes) {
        const hero1: Mercenary = this.sanitizeHero({
          id: 'hero_01',
          name: '아이리스',
          title: '강철의 수호자',
          classId: 'squire',
          grade: 'rookie',
          level: 1, exp: 0, expToNext: 80,
          currentHp: 260, maxHp: 260,
          currentMp: 30,  maxMp: 30,
          position: 'front',
          stats: { atk: 13, def: 17, spd: 7, luck: 10 },
          equippedSkills: ['squire_strike', 'squire_guard'],
          learnedSkills: ['squire_strike', 'squire_guard'],
          equipment: {}, statusEffects: [],
          portraitPromptKey: 'hero_squire'
        });

        const hero2: Mercenary = this.sanitizeHero({
          id: 'hero_02',
          name: '시안',
          title: '신속한 그림자',
          classId: 'rogue',
          grade: 'rookie',
          level: 1, exp: 0, expToNext: 80,
          currentHp: 180, maxHp: 180,
          currentMp: 42, maxMp: 42,
          position: 'mid',
          stats: { atk: 19, def: 6, spd: 16, luck: 22 },
          equippedSkills: ['rogue_slash', 'rogue_smoke'],
          learnedSkills: ['rogue_slash', 'rogue_smoke'],
          equipment: {}, statusEffects: [],
          portraitPromptKey: 'hero_rogue'
        });

        this.barracks = [hero1, hero2];
        this.party = [hero1, hero2];
        this.equipmentInventory = [];
        this.skillBookInventory = [];
        this.addSkillBookToInventory('book_heavy_strike', 2);
        this.addSkillBookToInventory('book_first_aid', 2);
        this.addSkillBookToInventory('book_flame_cleave', 2);
        this.infirmaryPatients = [];
        this.bonds = {};
        this.reconcileParty();
        resetLogs.push('용병단 및 장비');
      }

      if (options.dungeon) {
        this.dungeonFloor = 1;
        this.unlockedDungeonFloor = 1;
        this.hasEnteredDungeon = false;
        this.unlockedAviciTier = 1;
        this.dungeonDangerLevel = 0;
        this.isOvercharged = false;
        this.overchargedBossDefeatedOnFloor = 0;
        this.defeatedOverchargedFloorsThisRun = [];
        this.dungeonInventory = [];
        this.campCooldown = 0;
        this.activeCatalysts = [];
        this.purifiedFloors = [];
        this.quests = JSON.parse(JSON.stringify(INITIAL_QUESTS));
        this.subQuestCooldownUntil = 0;
        this.currentArenaRank = 100;
        this.currentArenaRating = 1000;
        this.arenaCoins = 0;
        this.pveBuffActive = false;
        resetLogs.push('던전 및 퀘스트');
      }

      if (options.cloud) {
        try {
          await FirebaseService.getInstance().deleteProgress();
          resetLogs.push('클라우드 세이브');
        } catch (_) {}
      }

      this.addLog(`🔄 [선택 초기화 완료] (${resetLogs.join(', ')}) 항목이 초기화되었습니다.`, 'story', 'citadel');
    }

    this.saveGame();
    if (!isFullReset) {
      this.saveToCloud().catch(() => {});
    }

    this.checkAllQuestObjectives();
    this.emit('resourcesChanged');
    this.emit('buildingUpdated');
    this.emit('partyUpdated', this.party);
    this.emit('questUpdated');
    this.emit('inventoryUpdated', this.equipmentInventory);
    this.emit('dungeonUpdated');
    this.emit('screenChanged', this.currentScreen);
    this.emit('update');
  }

  // ================= 🌙 미접속(오프라인) 시간 경과 일괄 정산 엔진 =================
  /**
   * 게임 접속 종료(창 닫기/새로고침) 후 경과된 시간을 측정하여
   * 생산 자원, 성화 온기 감소, 병동 환자 치료, 유지비를 O(1)로 일괄 즉시 정산합니다.
   * (서버 부하/호스팅 비용 0원, 완벽한 오프라인 방치 보상 지원)
   */
  public processOfflineProgress(): {
    elapsedSeconds: number;
    formattedTime: string;
    resourcesGained: Partial<Record<keyof GameResources, number>>;
    grossProduced?: Partial<Record<keyof GameResources, number>>;
    foodConsumedByInfirmary: number;
    etherConsumedByInfirmary: number;
    healedHeroes: Array<{ id: string; name: string; hpGained: number; isFullyHealed: boolean }>;
    bonfireWarmthExpired: boolean;
    bonfireSecondsLeft: number;
    upkeepGoldPaid: number;
    upkeepFoodPaid?: number;
    upkeepEtherPaid?: number;
  } | null {
    const now = Date.now();
    if (!this.lastTickTimestamp) {
      this.lastTickTimestamp = now;
      return null;
    }

    const elapsedMs = now - this.lastTickTimestamp;
    let elapsedSec = Math.floor(elapsedMs / 1000);
    this.lastTickTimestamp = now;

    // 10초 미만의 짧은 새로고침은 실시간 틱 루프에서 처리
    if (elapsedSec < 10) {
      return null;
    }

    // 최대 오프라인 보상 상한 (최대 24시간 = 86,400초)
    const MAX_OFFLINE_SEC = 24 * 60 * 60;
    elapsedSec = Math.min(elapsedSec, MAX_OFFLINE_SEC);

    const initialResources = { ...this.resources };
    let foodConsumedByInfirmary = 0;
    let etherConsumedByInfirmary = 0;
    const healedHeroes: Array<{ id: string; name: string; hpGained: number; isFullyHealed: boolean }> = [];

    // ── 1. 성화 온기 및 영웅 상태 초기화 ──
    const initialWarmth = this.bonfireWarmthTime;
    let currentWarmth = this.bonfireWarmthTime;
    let bonfireWarmthExpired = false;

    // 환자 및 영웅 시작 체력/마나 기록
    const initialHeroHps: Record<string, number> = {};
    const initialHeroMps: Record<string, number> = {};
    this.barracks.forEach(h => {
      initialHeroHps[h.id] = h.currentHp;
      initialHeroMps[h.id] = h.currentMp;
    });

    // ── 2. 건물 생산 규칙 준비 (가동 중인 건물만) ──
    interface ProdRule {
      res: keyof GameResources;
      baseAmt: number;
      period: number;
    }
    const activeProds: ProdRule[] = [];

    // 기본 생산 건물
    const prodConfig: Array<[BuildingId, keyof GameResources, number, number]> = [
      ['cabin',      'gold',  5, 13], // 13초마다 레벨당 5 골드 (세금)
      ['market',     'gold',  2, 15], // 15초마다 레벨당 2 골드 (상업 수급)
      ['lumberCamp', 'wood',  2, 9],  // 9초마다 레벨당 2 목재
      ['quarry',     'stone', 2, 11], // 11초마다 레벨당 2 석재
      ['alchemy',    'ether', 1, 15], // 15초마다 레벨당 1 에테르
      ['butchery',   'food',  1, 13], // 13초마다 레벨당 1 식량
    ];

    for (const [bId, res, perLevel, period] of prodConfig) {
      const b = this.buildings[bId];
      if (b && b.level > 0 && !b.isPaused) {
        let amt = b.level * perLevel;
        // 🏕️ 생존자 안식처: 5% 감축 적용된 getCabinBaseProduction
        if (bId === 'cabin') {
          amt = GameManager.getCabinBaseProduction(b.level);
        } else if (bId === 'market') {
          // ⚖️ 황혼의 블랙 마켓: 5% 감축 적용
          amt = GameManager.getMarketBaseProduction(b.level);
        } else if (bId === 'alchemy') {
          // 🧪 에테르 연금 공방: 5% 감축 적용
          amt = GameManager.getAlchemyBaseProduction(b.level);
        } else if (bId === 'butchery') {
          // 🥩 생체 정제소: 5% 감축 적용
          amt = GameManager.getButcheryBaseProduction(b.level);
        } else {
          // 📉 벌채소, 시추소 10% 감축
          amt = Math.max(1, Math.round(amt * 0.9));
        }
        activeProds.push({ res, baseAmt: amt, period });
      }
    }

    // 마도 광산 철광석 특수 생산 (Lv.3+, 11초 주기)
    const quarry = this.buildings['quarry'];
    if (quarry && quarry.level >= 3 && !quarry.isPaused) {
      activeProds.push({ res: 'iron', baseAmt: Math.floor(quarry.level / 3), period: 11 });
    }

    // 마물 가공소 가죽 특수 생산 (Lv.3+, 13초 주기)
    const butchery = this.buildings['butchery'];
    if (butchery && butchery.level >= 3 && !butchery.isPaused) {
      activeProds.push({ res: 'leather', baseAmt: Math.floor(butchery.level / 3), period: 13 });
    }

    // 🍺 방랑자의 라운지 식량 특수 생산 (Lv.5+, 15초 주기, 5% 감축 적용)
    const tavern = this.buildings['tavern'];
    if (tavern && tavern.level >= 5 && !tavern.isPaused) {
      const tavFood = GameManager.getTavernBaseFoodProduction(tavern.level);
      activeProds.push({
        res: 'food',
        baseAmt: tavFood,
        period: 15
      });
    }

    // ── 3. 영지 시설 유지비 설정 준비 ──
    const upkeepInterval = this.getUpkeepIntervalSeconds();
    let foodUpkeepPerTick = 0;
    let etherUpkeepPerTick = 0;
    let goldUpkeepPerTick = 0;

    for (const bId in this.buildings) {
      const b = this.buildings[bId as BuildingId];
      if (b && (b.level >= 4 || bId === 'storage') && b.level > 0 && !b.isPaused) {
        const up = this.getBuildingUpkeep(bId as BuildingId, b.level);
        if (up.res === 'food') foodUpkeepPerTick += up.amount;
        else if (up.res === 'ether') etherUpkeepPerTick += up.amount;
        else if (up.res === 'gold') goldUpkeepPerTick += up.amount;

        // 보조 유지비(secondaryRes) 자동 합산
        if (up.secondaryRes && up.secondaryAmount && up.secondaryAmount > 0) {
          if (up.secondaryRes === 'food') foodUpkeepPerTick += up.secondaryAmount;
          else if (up.secondaryRes === 'ether') etherUpkeepPerTick += up.secondaryAmount;
          else if (up.secondaryRes === 'gold') goldUpkeepPerTick += up.secondaryAmount;
        }
      }
    }

    // ── 4. 생체 복원 병동 환자 설정 준비 ──
    const infirmary = this.buildings['infirmary'];
    const hasInfirmary = !!(infirmary && infirmary.level > 0 && !infirmary.isPaused && this.infirmaryPatients.length > 0);
    const healPeriod = hasInfirmary ? Math.max(1, Math.floor(5 - (infirmary.level - 1) * 0.4)) : 999999;
    const mpPeriod = (hasInfirmary && infirmary.level >= 4) ? this.getInfirmaryMpPeriod(infirmary.level) : 999999;
    const mpHealAmount = (hasInfirmary && infirmary.level >= 4) ? this.getInfirmaryMpHealAmount(infirmary.level) : 0;

    const patientHeroes = hasInfirmary
      ? this.infirmaryPatients
          .map(pid => this.barracks.find(h => h.id === pid))
          .filter((h): h is Mercenary => !!h)
          .map(h => ({ hero: h, eff: this.getHeroEffectiveStats(h) }))
      : [];

    // ── 5. 자원 창고 한계 용량 캐싱 ──
    const caps: Partial<Record<keyof GameResources, number>> = {
      gold: this.getMaxResourceCapacity('gold'),
      wood: this.getMaxResourceCapacity('wood'),
      stone: this.getMaxResourceCapacity('stone'),
      iron: this.getMaxResourceCapacity('iron'),
      food: this.getMaxResourceCapacity('food'),
      ether: this.getMaxResourceCapacity('ether'),
      leather: this.getMaxResourceCapacity('leather'),
      herb: this.getMaxResourceCapacity('herb'),
      bone: this.getMaxResourceCapacity('bone'),
      crystal: this.getMaxResourceCapacity('crystal'),
      void_shard: this.getMaxResourceCapacity('void_shard'),
    };

    // ── 6. 라운지 모험가 도착 타이머 처리 ──
    if (this.tavernArrivalSecondsLeft > 0) {
      if (elapsedSec >= this.tavernArrivalSecondsLeft) {
        const remainingAfterFirst = elapsedSec - this.tavernArrivalSecondsLeft;
        this.tavernArrivalSecondsLeft = 600 - (remainingAfterFirst % 600);
        this.tavernRefreshCount = 0;
        this.refreshTavernPool();
      } else {
        this.tavernArrivalSecondsLeft -= elapsedSec;
      }
    }

    // ── 7. 고정밀 오프라인 틱 시뮬레이션 (초 단위 생산 & 유지비 & 치료 상호작용) ──
    // [핵심]: 창고 용량에 도달했더라도 유지비가 소비되면 다음 생산 틱에서 다시 채워지므로
    // 생산량과 유지비가 동시에 지속 상호작용하도록 실시간과 동일한 틱 시뮬레이션 적용!
    const isDungeonActiveNow = this.currentScreen === 'exploration' || this.currentScreen === 'battle';
    const grossProduced: Partial<Record<keyof GameResources, number>> = {};
    let upkeepGoldPaid = 0;
    let upkeepFoodPaid = 0;
    let upkeepEtherPaid = 0;

    for (let t = 1; t <= elapsedSec; t++) {
      // 1) 성화 온기 카운트다운
      if (currentWarmth > 0) {
        currentWarmth--;
        if (currentWarmth === 0) {
          bonfireWarmthExpired = true;
        }
      }
      const isWarm = currentWarmth > 0 && this.bonfireStacks >= 5;

      // 2) 성화 온기 자연 치유 (6초 주기, 영지에 대기 중인 용병 전원)
      if (isWarm && !isDungeonActiveNow && t % 6 === 0) {
        this.barracks.forEach(hero => {
          const eff = this.getHeroEffectiveStats(hero);
          if (hero.currentHp < eff.maxHp) hero.currentHp = Math.min(eff.maxHp, Math.max(0, hero.currentHp) + 1);
          if (hero.currentMp < eff.maxMp) hero.currentMp = Math.min(eff.maxMp, Math.max(0, hero.currentMp) + 1);
        });
      }

      // 3) 건물 자원 생산 (창고 상한까지 누적, 총 생산량은 grossProduced에 별도 집계)
      for (const rule of activeProds) {
        if (t % rule.period === 0) {
          let amt = rule.baseAmt;
          if (isWarm) {
            amt = Math.ceil(amt * 1.15);
          }
          const codexProd = this.getCodexBonus?.()?.productionBonusPct || 0;
          if (codexProd > 0) {
            amt = Math.ceil(amt * (1 + codexProd / 100));
          }
          grossProduced[rule.res] = (grossProduced[rule.res] || 0) + amt;
          const maxCap = caps[rule.res] ?? 999999;
          this.resources[rule.res] = Math.min(maxCap, this.resources[rule.res] + amt);
        }
      }

      // 4) 영지 시설 유지비 차감 (생산으로 채워진 자원에서 우선 차감)
      if (t % upkeepInterval === 0) {
        if (foodUpkeepPerTick > 0) {
          const pay = Math.min(this.resources.food, foodUpkeepPerTick);
          this.resources.food -= pay;
          upkeepFoodPaid += pay;
        }
        if (etherUpkeepPerTick > 0) {
          const pay = Math.min(this.resources.ether, etherUpkeepPerTick);
          this.resources.ether -= pay;
          upkeepEtherPaid += pay;
        }
        if (goldUpkeepPerTick > 0) {
          const pay = Math.min(this.resources.gold, goldUpkeepPerTick);
          this.resources.gold -= pay;
          upkeepGoldPaid += pay;
        }
      }

      // 5) 생체 복원 병동 환자 치료 (식량 / 에테르 소비)
      if (patientHeroes.length > 0) {
        const foodCostPerHeal = (infirmary?.level || 0) <= 3 ? 2 : 3;
        if (t % healPeriod === 0) {
          for (const p of patientHeroes) {
            if (p.hero.currentHp < p.eff.maxHp && this.resources.food >= foodCostPerHeal) {
              this.resources.food -= foodCostPerHeal;
              foodConsumedByInfirmary += foodCostPerHeal;
              p.hero.currentHp = Math.min(p.eff.maxHp, p.hero.currentHp + 5);
            }
          }
        }
        if (mpPeriod <= elapsedSec && t % mpPeriod === 0) {
          for (const p of patientHeroes) {
            if (p.hero.currentMp < p.eff.maxMp && this.resources.ether >= 1) {
              this.resources.ether -= 1;
              etherConsumedByInfirmary += 1;
              p.hero.currentMp = Math.min(p.eff.maxMp, p.hero.currentMp + mpHealAmount);
            }
          }
        }
      }
    }

    // ── 8. 상태 동기화 및 보고서 생성 ──
    this.bonfireWarmthTime = currentWarmth;
    if (this.bonfireWarmthTime === 0) {
      this.bonfireStacks = 0;
    }

    this.barracks.forEach(hero => {
      const pHero = this.party.find(p => p.id === hero.id);
      if (pHero) {
        pHero.currentHp = hero.currentHp;
        pHero.currentMp = hero.currentMp;
      }
    });

    patientHeroes.forEach(({ hero, eff }) => {
      const initHp = initialHeroHps[hero.id] ?? hero.currentHp;
      const hpGained = Math.max(0, hero.currentHp - initHp);
      const isFullyHealed = hero.currentHp >= eff.maxHp && (infirmary!.level < 4 || hero.currentMp >= eff.maxMp);
      if (hpGained > 0 || isFullyHealed) {
        healedHeroes.push({
          id: hero.id,
          name: hero.name,
          hpGained,
          isFullyHealed
        });
      }
    });

    // ── 9. 순 획득량 계산 ──
    const resourcesGained: Partial<Record<keyof GameResources, number>> = {};
    for (const key in this.resources) {
      const k = key as keyof GameResources;
      const diff = this.resources[k] - initialResources[k];
      if (diff > 0) {
        resourcesGained[k] = diff;
      }
    }

    const hours = Math.floor(elapsedSec / 3600);
    const mins = Math.floor((elapsedSec % 3600) / 60);
    const secs = elapsedSec % 60;
    const formattedTime = hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분 ${secs}초`;

    // ── 10. 오프라인 정산 정보 로그 기록 ──
    const RES_META: Record<string, { icon: string; name: string }> = {
      gold: { icon: '🪙', name: '골드' },
      wood: { icon: '🪵', name: '목재' },
      stone: { icon: '🪨', name: '석재' },
      iron: { icon: '⚙️', name: '철광석' },
      food: { icon: '🍖', name: '식량' },
      ether: { icon: '✨', name: '에테르' },
      leather: { icon: '🥋', name: '가죽' },
      herb: { icon: '🌿', name: '약초' },
      bone: { icon: '🦴', name: '뼈' },
      crystal: { icon: '💎', name: '수정' },
      void_shard: { icon: '🌌', name: '공허 파편' }
    };

    const gainParts: string[] = [];
    for (const [k, amt] of Object.entries(grossProduced)) {
      if (amt && amt > 0) {
        const meta = RES_META[k] || { icon: '📦', name: k };
        const cap = caps[k as keyof GameResources] ?? 999999;
        const isAtCap = this.resources[k as keyof GameResources] >= cap;
        const capTag = isAtCap ? ' [창고 가득 참]' : '';
        gainParts.push(`${meta.icon}${meta.name} +${amt.toLocaleString()}${capTag}`);
      }
    }

    const upkeepParts: string[] = [];
    if (upkeepGoldPaid > 0) upkeepParts.push(`🪙골드 -${upkeepGoldPaid.toLocaleString()}G`);
    if (upkeepFoodPaid > 0) upkeepParts.push(`🍖식량 -${upkeepFoodPaid.toLocaleString()}`);
    if (upkeepEtherPaid > 0) upkeepParts.push(`✨에테르 -${upkeepEtherPaid.toLocaleString()}`);

    this.addLog(`🌙 [오프라인 정산 (${formattedTime} 경과)] 부재 중 영지 활동이 정산되었습니다.`, 'system', 'citadel');
    this.addLog(this.getCurrentPartyLogText(), 'story', 'citadel');

    if (gainParts.length > 0) {
      this.addLog(`📦 [자원 총 생산] ${gainParts.join(', ')}`, 'reward');
    }

    if (upkeepParts.length > 0) {
      this.addLog(`📉 [시설 유지비] ${upkeepParts.join(', ')} 지출 (생산량으로 지속 충당 및 창고 상한 보전)`, 'normal');
    }

    if (healedHeroes.length > 0) {
      const healDetails = healedHeroes.map(h => `${h.name}(HP +${h.hpGained}${h.isFullyHealed ? ' [완치!]' : ''})`).join(', ');
      const costParts: string[] = [];
      if (foodConsumedByInfirmary > 0) costParts.push(`🍖식량 -${foodConsumedByInfirmary}`);
      if (etherConsumedByInfirmary > 0) costParts.push(`✨에테르 -${etherConsumedByInfirmary}`);
      const costStr = costParts.length > 0 ? ` (소모: ${costParts.join(', ')})` : '';
      this.addLog(`💉 [생체 복원 병동] 환자 치료: ${healDetails}${costStr}`, 'reward');
    }

    if (bonfireWarmthExpired) {
      this.addLog(`🔥 [방주의 성화] 부재 중 성화가 소멸하여 온기 버프가 만료되었습니다.`, 'bonfire0');
    } else if (this.bonfireWarmthTime > 0) {
      const warmthMins = Math.floor(this.bonfireWarmthTime / 60);
      this.addLog(`🔥 [방주의 성화] 성화가 유지 중입니다. (남은 온기: ${warmthMins}분)`, 'bonfire1');
    }

    const report = {
      elapsedSeconds: elapsedSec,
      formattedTime,
      resourcesGained,
      grossProduced,
      foodConsumedByInfirmary,
      etherConsumedByInfirmary,
      healedHeroes,
      bonfireWarmthExpired,
      bonfireSecondsLeft: this.bonfireWarmthTime,
      upkeepGoldPaid,
      upkeepFoodPaid,
      upkeepEtherPaid
    };

    this.offlineReport = report;
    this.lastOfflineReport = report;
    this.processBuildingUpkeep(); // 부재 중 모인 자원으로 체납 시설 자동 복구 및 상태 동기화
    this.saveGame();
    this.emit('offlineProgressSettled', report);
    this.emit('update');
    return report;
  }

  /** 오프라인 결산 확인 완료 및 보고서 정리 */
  public clearOfflineReport(): void {
    this.offlineReport = null;
    this.lastOfflineReport = null;
    this.emit('offlineProgressSettled', null);
    this.emit('update');
  }

  // ================= 실시간 자원 자동 생산 틱 루프 =================
  /** 자원 자동 생산 틱 루프. 각 건물의 생산 설정을 기반으로 실시간 생산. */
  private startResourceTicker(): void {
    if (this.tickerInterval) clearInterval(this.tickerInterval);

    // 틱 루프 시작 전 미정산 오프라인 시간 경과가 있다면 즉시 정산
    if (this.lastTickTimestamp && (Date.now() - this.lastTickTimestamp) >= 10000) {
      this.processOfflineProgress();
    }
    this.lastTickTimestamp = this.lastTickTimestamp || Date.now();

    // 생산 설정: [buildingId, 생산 자원, 수량/레벨, 틱 주기(초)] (모든 건물 틱 +5초 적용)
    const productionConfig: Array<[BuildingId, keyof GameResources, number, number]> = [
      ['cabin',      'gold',  5, 13], // 13초마다 레벨당 5 골드 (세금)
      ['market',     'gold',  2, 15], // 15초마다 레벨당 2 골드 (블랙 마켓 상업 수급)
      ['lumberCamp', 'wood',  2, 9],  // 9초마다 레벨당 2 목재
      ['quarry',     'stone', 2, 11], // 11초마다 레벨당 2 석재
      ['alchemy',    'ether', 1, 15], // 15초마다 레벨당 1 에테르
      ['butchery',   'food',  1, 13], // 13초마다 레벨당 1 식량 생산
    ];

    this.tickerInterval = setInterval(() => {
      this.tickCount += 1;
      this.lastTickTimestamp = Date.now();
      let changed = false;

      // ⏳ 건설 중인 건물의 완공 여부 실시간 체크
      this.checkBuildingConstructions();

      // 🎬 매 분마다 자정 기준 일일 무료 광고 충전 리셋 확인
      if (this.tickCount % 60 === 0) {
        this.checkAdDailyReset();
      }

      if (this.bonfireWarmthTime > 0) {
        this.bonfireWarmthTime -= 1;
        if (this.bonfireWarmthTime <= 0) {
          this.bonfireStacks = 0;
          this.bonfireWarmthTime = 0;
          this.addLog('방주의 성화가 꺼졌습니다. 다시 한기가 몰려옵니다.', 'bonfire0');
          this.emit('buildingUpdated');
        }
      }

      for (const [bId, res, perLevel, period] of productionConfig) {
        const b = this.buildings[bId];
        if (b && b.level > 0 && !b.isPaused && this.tickCount % period === 0) {
          const maxCap = this.getMaxResourceCapacity(res);
          let amount = b.level * perLevel;
          // 🏕️ 생존자 안식처: 5% 감축 적용된 getCabinBaseProduction
          if (bId === 'cabin') {
            amount = GameManager.getCabinBaseProduction(b.level);
          } else if (bId === 'market') {
            // ⚖️ 황혼의 블랙 마켓: 5% 감축 적용
            amount = GameManager.getMarketBaseProduction(b.level);
          } else if (bId === 'alchemy') {
            // 🧪 에테르 연금 공방: 5% 감축 적용
            amount = GameManager.getAlchemyBaseProduction(b.level);
          } else if (bId === 'butchery') {
            // 🥩 생체 정제소: 5% 감축 적용
            amount = GameManager.getButcheryBaseProduction(b.level);
          } else {
            // 📉 벌채소, 시추소 10% 감축
            amount = Math.max(1, Math.round(amount * 0.9));
          }
          if (this.bonfireWarmthTime > 0 && this.bonfireStacks >= 5) {
            amount = Math.ceil(amount * 1.15); // 건물 생산력 15% 버프
          }
          const codexProd = this.getCodexBonus?.()?.productionBonusPct || 0;
          if (codexProd > 0) {
            amount = Math.ceil(amount * (1 + codexProd / 100));
          }
          this.resources[res] = Math.min(maxCap, this.resources[res] + amount);
          changed = true;
        }
      }

      // 마도 광산 특수 생산: 3레벨 도달 시부터 레벨/3 만큼의 철광석을 6초마다 생산
      const quarry = this.buildings['quarry'];
      if (quarry && quarry.level >= 3 && !quarry.isPaused && this.tickCount % 11 === 0) {
        let extraIron = Math.floor(quarry.level / 3);
        if (this.bonfireWarmthTime > 0 && this.bonfireStacks >= 5) {
          extraIron = Math.ceil(extraIron * 1.15);
        }
        const maxCap = this.getMaxResourceCapacity('iron');
        this.resources.iron = Math.min(maxCap, this.resources.iron + extraIron);
        changed = true;
      }

      // 마물 가공소 특수 생산: 3레벨 도달 시부터 레벨/3 만큼의 가죽을 8초마다 생산
      const butchery = this.buildings['butchery'];
      if (butchery && butchery.level >= 3 && !butchery.isPaused && this.tickCount % 13 === 0) {
        let extraLeather = Math.floor(butchery.level / 3);
        if (this.bonfireWarmthTime > 0 && this.bonfireStacks >= 5) {
          extraLeather = Math.ceil(extraLeather * 1.15);
        }
        const maxCap = this.getMaxResourceCapacity('leather');
        this.resources.leather = Math.min(maxCap, this.resources.leather + extraLeather);
        changed = true;
      }

      // 🍺 방랑자의 라운지 특수 생산: 5레벨 도달 시부터 15초마다 식량 생산 (5% 감축 적용)
      const tavern = this.buildings['tavern'];
      if (tavern && tavern.level >= 5 && !tavern.isPaused && this.tickCount % 15 === 0) {
        let foodAmt = GameManager.getTavernBaseFoodProduction(tavern.level);
        if (this.bonfireWarmthTime > 0 && this.bonfireStacks >= 5) {
          foodAmt = Math.ceil(foodAmt * 1.15);
        }
        const maxCap = this.getMaxResourceCapacity('food');
        this.resources.food = Math.min(maxCap, this.resources.food + foodAmt);
        changed = true;
      }

      // 🍺 방랑자의 라운지 10분 모험가 도착 & 새로고침 비용 초기화 타이머 (1초마다 1초씩 감소)
      if (this.tavernArrivalSecondsLeft > 0) {
        this.tavernArrivalSecondsLeft -= 1;
        if (this.tavernArrivalSecondsLeft <= 0) {
          this.tavernArrivalSecondsLeft = 600;
          this.tavernRefreshCount = 0;
          this.refreshTavernPool();
          this.addLog('🍸 [방랑자의 라운지] 새로운 방랑 모험가들이 라운지에 도착했습니다! (새로고침 비용 100G 초기화)', 'reward', 'citadel');
          changed = true;
        }
      }

      // 🔥 방주의 성화 활성화 중 전원 HP/MP 자동 재생 버프 (6초마다 모든 영지 용병 HP +1, MP +1 회복)
      // 🌟 [중요]: 던전 탐험/전투 중인 파티원만 던전 내 자동 부활 방지를 위해 재생에서 제외!
      //            영지에 복귀한 원정대(또는 대기 중인 용병)는 쓰러진 대원(HP 0)을 포함하여 성화 온기로 정상 회복/소생됨.
      const isDungeonActive = this.currentScreen === 'exploration' || this.currentScreen === 'battle';
      if (this.bonfireWarmthTime > 0 && this.bonfireStacks >= 5 && this.tickCount % 6 === 0) {
        let partyRegened = false;
        this.barracks.forEach(hero => {
          // 1. 던전 탐험/전투 중일 때 출진 파티원은 성화 재생 버프 완전 제외 (던전 내 자동 부활 방지)
          if (isDungeonActive && this.party.some(p => p.id === hero.id)) {
            return;
          }

          // 2. 던전 내부가 아니라 영지에 있다면 쓰러진 영웅(HP <= 0)도 성화 온기로 회복/소생 가능
          let healed = false;
          const maxHp = hero.maxHp;
          const maxMp = hero.maxMp;

          if (hero.currentHp < maxHp) {
            hero.currentHp = Math.min(maxHp, Math.max(0, hero.currentHp) + 1);
            healed = true;
          }
          if (hero.currentMp < maxMp) {
            hero.currentMp = Math.min(maxMp, Math.max(0, hero.currentMp) + 1);
            healed = true;
          }

          // 3. 파티 배열(this.party)의 동일 영웅 데이터와 완벽히 동기화
          const pHero = this.party.find(p => p.id === hero.id);
          if (pHero) {
            pHero.currentHp = hero.currentHp;
            pHero.currentMp = hero.currentMp;
          }

          if (healed) partyRegened = true;
        });

        if (partyRegened) {
          changed = true;
        }
      }

      // 의료소 회복 로직
      const infirmary = this.buildings['infirmary'];
      if (infirmary && infirmary.level > 0 && this.infirmaryPatients.length > 0) {
        // 1. HP 회복 (레벨에 따라 회복 주기 감소: 기본 5초 -> 레벨업당 0.4초씩 감소, 최소 1초, 틱당 5 HP 회복, Lv.1~3 식량 2 / Lv.4+ 식량 3 소모)
        const healPeriod = Math.max(1, Math.floor(5 - (infirmary.level - 1) * 0.4));
        const foodCostPerHeal = infirmary.level <= 3 ? 2 : 3;
        if (this.tickCount % healPeriod === 0) {
          let healedSomeone = false;
          let outOfFood = false;

          // 입원 환자 모두 회복 (틱당 5 HP 회복, 인당 회복 틱마다 식량 foodCostPerHeal 소모)
          this.infirmaryPatients.forEach(patientId => {
            const hero = this.barracks.find(h => h.id === patientId);
            if (hero) {
              const eff = this.getHeroEffectiveStats(hero);
              if (hero.currentHp < eff.maxHp) {
                if (this.resources.food >= foodCostPerHeal) {
                  this.resources.food -= foodCostPerHeal;
                  hero.currentHp = Math.min(eff.maxHp, hero.currentHp + 5);
                  healedSomeone = true;
                  
                  if (hero.currentHp >= eff.maxHp) {
                    this.addLog(`💉 [생체 복원 병동] ${hero.name}의 상처가 모두 완치되었습니다!`, 'system', 'citadel');
                  }
                } else {
                  outOfFood = true;
                }
              }
            }
          });
          
          if (outOfFood && this.tickCount % 10 === 0) {
            this.addLog(`⚠️ [생체 복원 병동] 식량이 고갈되어 부상병 치료가 일시 중단되었습니다! (치료 틱당 식량 ${foodCostPerHeal} 소모)`, 'danger', 'citadel');
          }

          // 완치된 환자는 자동으로 퇴원시키지 않고 100% 상태로 둠 (유저가 직접 편성해야 함)
          if (healedSomeone) changed = true;
        }

        // 2. MP 회복 (Lv.4 이상 에테르 캡슐 충전: 회복 주기 Lv.4=5초 ~ Lv.10=1초, 틱당 4 MP 회복, 틱당 에테르 1 소모)
        if (infirmary.level >= 4) {
          const mpPeriod = this.getInfirmaryMpPeriod(infirmary.level);
          if (mpPeriod > 0 && this.tickCount % mpPeriod === 0) {
            let mpHealedSomeone = false;
            let outOfEther = false;
            const mpHealAmount = this.getInfirmaryMpHealAmount(infirmary.level);

            this.infirmaryPatients.forEach(patientId => {
              const hero = this.barracks.find(h => h.id === patientId);
              if (hero) {
                const eff = this.getHeroEffectiveStats(hero);
                if (hero.currentMp < eff.maxMp) {
                  if (this.resources.ether >= 1) {
                    this.resources.ether -= 1;
                    hero.currentMp = Math.min(eff.maxMp, hero.currentMp + mpHealAmount);
                    mpHealedSomeone = true;

                    if (hero.currentMp >= eff.maxMp) {
                      this.addLog(`✨ [생체 복원 병동] ${hero.name}의 마나가 완전히 충전되었습니다!`, 'system', 'citadel');
                    }
                  } else {
                    outOfEther = true;
                  }
                }
              }
            });

            if (outOfEther && this.tickCount % 10 === 0) {
              this.addLog(`⚠️ [생체 복원 병동] 에테르가 고갈되어 마나 충전이 일시 중단되었습니다! (충전 틱당 에테르 1 소모)`, 'danger', 'citadel');
            }

            if (mpHealedSomeone) changed = true;
          }
        }
      }

      // 🏢 영지 시설 유지비 지불 및 체납 처리 (기본 15초 + 마켓 레벨당 1초 연장, Lv.3 이상 적용)
      const upkeepInterval = this.getUpkeepIntervalSeconds();
      if (this.tickCount % upkeepInterval === 0) {
        if (this.processBuildingUpkeep()) {
          changed = true;
        }
      }

      // 매 틱 서브 퀘스트 10분 쿨다운 체크 및 자동 보충
      this.ensureActiveSubQuests();

      // 🌌 시공 침식 네메시스 사이클 갱신 (자연 회복, 6시간 약탈 판정, 6일 활동/1일 재소환)
      if (this.updateNemesisCycle()) {
        changed = true;
      }

      if (changed) {
        this.emit('resourcesChanged', this.resources);
        this.emit('partyUpdated'); // HP 변화 UI 반영을 위해 이벤트 발생
        this.checkAllQuestObjectives();
      }
    }, 1000);
  }

  /** 영지 시설 유지비 지불 주기 (초) 계산: 기본 20초 + 마켓 레벨당 1초씩 연장 */
  public getUpkeepIntervalSeconds(): number {
    const marketLv = this.buildings['market']?.level || 0;
    return 20 + marketLv;
  }

  /** 🏛️ 계단식 유지비 가중 계수: Lv.1~3 무료(0), Lv.4~6 Tier 1 (1~3), Lv.7~10 Tier 2 (5, 7, 9, 12) */
  public getUpkeepFactor(level: number): number {
    if (level < 4) return 0;
    if (level <= 6) return level - 3; // Lv.4=1, Lv.5=2, Lv.6=3
    const tier2Map: Record<number, number> = { 7: 5, 8: 7, 9: 9, 10: 12 };
    return tier2Map[level] || (12 + (level - 10) * 3);
  }

  /** 🏛️ 3대 핵심 인프라 시너지 상태 반환 */
  public getInfraSynergies(): {
    foodSynergy: boolean;     // 🥩 생체 정제소 Lv.5+ [대량 배급제]: 식량 유지비 -30%
    goldSynergy: boolean;     // ⚖️ 블랙 마켓 Lv.5+ [상업 네트워크]: 골드 유지비 -25%
    etherSynergy: boolean;    // 🧪 에테르 연금 공방 Lv.6+ [에테르 환류관]: 마도 에테르 유지비 -25%
  } {
    const butcheryLv = this.buildings['butchery']?.level || 0;
    const marketLv = this.buildings['market']?.level || 0;
    const alchemyLv = this.buildings['alchemy']?.level || 0;

    return {
      foodSynergy: butcheryLv >= 5,
      goldSynergy: marketLv >= 5,
      etherSynergy: alchemyLv >= 6
    };
  }

  // ================= 영지 시설 유지비 시스템 (Lv.1~3 무료, Lv.4+ 계단식 적용 & 인프라 시너지 감면) =================
  public getBuildingUpkeep(id: BuildingId, level: number): {
    res: 'food' | 'ether' | 'gold' | null;
    amount: number;
    resIcon: string;
    resName: string;
    secondaryRes?: 'food' | 'ether' | 'gold' | null;
    secondaryAmount?: number;
    secondaryIcon?: string;
    secondaryName?: string;
    originalAmount?: number;
    isDiscounted?: boolean;
  } {
    if (level < 4 && id !== 'storage') {
      return { res: null, amount: 0, resIcon: '✨', resName: '무료 (Lv.1~3)' };
    }

    const lvFactor = this.getUpkeepFactor(level);
    if (lvFactor <= 0 && id !== 'storage') {
      return { res: null, amount: 0, resIcon: '✨', resName: '무료 (Lv.1~3)' };
    }

    const synergies = this.getInfraSynergies();
    let res: 'food' | 'ether' | 'gold' | null = null;
    let baseAmount = 0;
    let secondaryRes: 'food' | 'ether' | 'gold' | null = null;
    let secondaryAmount = 0;
    let secondaryIcon = '';
    let secondaryName = '';

    switch (id) {
      // 1. 인력 / 상업 시설 -> 식량 소모
      case 'cabin':      // 생존자 안식처 (전 레벨 식량 유지비 +2개 상향 적용: lvFactor * 2 + 2)
        res = 'food';
        baseAmount = lvFactor * 2 + 2;
        break;
      case 'infirmary': { // 생체 복원 병동 (레벨당 3 식량 소모 + 식량 유지비의 50% 골드 보조 소모)
        res = 'food';
        baseAmount = lvFactor * 3;
        if (level >= 4 && baseAmount > 0) {
          let infGold = Math.floor(baseAmount * 0.5);
          if (synergies.goldSynergy) {
            infGold = Math.max(1, Math.ceil(infGold * 0.75));
          }
          secondaryRes = 'gold';
          secondaryAmount = infGold;
          secondaryIcon = '🪙';
          secondaryName = '골드';
        }
        break;
      }
      case 'market':     // 황혼의 블랙 마켓 (Lv.4부터 식량 소모)
        res = 'food';
        baseAmount = lvFactor * 4;
        break;

      // 2. 기술 / 마도 집중 시설 -> 에테르 소모
      case 'sanctuary': { // 영혼의 제단 (Lv.4: 5 ~ Lv.10: 25)
        res = 'ether';
        const sanctuaryUpkeepMap = [0, 0, 0, 0, 5, 8, 11, 14, 18, 21, 25];
        baseAmount = sanctuaryUpkeepMap[level] || (25 + (level - 10) * 4);
        break;
      }
      case 'blacksmith': { // 심연의 병기창 (에테르 유지비 + Lv.4부터 골드 소모: Lv.4=4G ~ Lv.10=10G)
        res = 'ether';
        const blacksmithUpkeepMap = [0, 0, 0, 0, 4, 8, 12, 16, 20, 25, 30];
        baseAmount = blacksmithUpkeepMap[level] || (30 + (level - 10) * 5);
        if (level >= 4) {
          let goldCost = level; // Lv.4 = 4G, Lv.5 = 5G, ..., Lv.10 = 10G
          if (synergies.goldSynergy) {
            goldCost = Math.max(1, Math.ceil(goldCost * 0.75));
          }
          secondaryRes = 'gold';
          secondaryAmount = goldCost;
          secondaryIcon = '🪙';
          secondaryName = '골드';
        }
        break;
      }
      case 'arenaGate': { // 차원 앵커 게이트 (Lv.10: 40)
        res = 'ether';
        const arenaGateUpkeepMap = [0, 0, 0, 0, 2, 4, 7, 12, 20, 29, 40];
        baseAmount = arenaGateUpkeepMap[level] || (40 + (level - 10) * 8);
        break;
      }

      // 3. 생산 및 주점 / 창고 시설 -> 골드 소모
      case 'storage': {   // 방주 중앙 병참고 (Lv.1: 1G ~ Lv.10: 14G)
        res = 'gold';
        const storageUpkeepMap = [0, 1, 2, 3, 4, 6, 8, 9, 11, 12, 14];
        baseAmount = storageUpkeepMap[level] || (14 + (level - 10) * 2);
        break;
      }
      case 'tavern':     // 방랑자의 라운지 (유지비 50% 감축: 5G/Lv)
        res = 'gold';
        baseAmount = lvFactor * 5;
        break;
      case 'alchemy': {  // 에테르 연금 공방 (골드 8 + 보조 식량 1 소모)
        res = 'gold';
        baseAmount = lvFactor * 8;
        if (level >= 4 && lvFactor > 0) {
          let alcFood = lvFactor * 1;
          const foodDiscount = level >= 7 ? 0.65 : 0.70;
          if (synergies.foodSynergy) {
            alcFood = Math.max(1, Math.ceil(alcFood * foodDiscount));
          }
          secondaryRes = 'food';
          secondaryAmount = alcFood;
          secondaryIcon = '🍖';
          secondaryName = '식량';
        }
        break;
      }
      case 'lumberCamp': // 영목 벌채소
        res = 'gold';
        baseAmount = lvFactor * 15;
        if (level >= 5) {
          // 5레벨부터 7%씩 줄여서 10레벨에는 42% 줄어듦 (Lv.5=7%, Lv.6=14%, Lv.7=21%, Lv.8=28%, Lv.9=35%, Lv.10=42%)
          const discountRate = Math.min(0.42, (level - 4) * 0.07);
          baseAmount = Math.round(baseAmount * (1 - discountRate));
        }
        break;
      case 'quarry': {   // 에테르 광맥 시추소
        res = 'gold';
        let qGold = lvFactor * 15;
        if (level >= 5) {
          const discountRate = Math.min(0.42, (level - 4) * 0.07);
          qGold = Math.round(qGold * (1 - discountRate));
        }
        if (level >= 7) {
          // 🌟 7레벨 이후 골드 유지비 30% 감축 및 감축된 수치만큼 식량 유지비 추가
          const foodCost = Math.round(qGold * 0.30);
          baseAmount = qGold - foodCost;
          let finalFood = foodCost;
          const foodDiscount = level >= 7 ? 0.65 : 0.70;
          if (synergies.foodSynergy) {
            finalFood = Math.max(1, Math.ceil(foodCost * foodDiscount));
          }
          secondaryRes = 'food';
          secondaryAmount = finalFood;
          secondaryIcon = '🍖';
          secondaryName = '식량';
        } else {
          baseAmount = qGold;
        }
        break;
      }
      case 'butchery':   // 심연 생체 정제소
        res = 'gold';
        baseAmount = lvFactor * 6;
        break;

      default:
        return { res: null, amount: 0, resIcon: '', resName: '없음' };
    }

    let finalAmount = baseAmount;
    let isDiscounted = false;

    if (res === 'food' && synergies.foodSynergy) {
      const foodDiscount = level >= 7 ? 0.65 : 0.70; // 🥩 식량 유지비 감면 (Lv.7+ 35% 감면 적용)
      finalAmount = Math.max(1, Math.ceil(baseAmount * foodDiscount));
      isDiscounted = true;
    } else if (res === 'gold' && synergies.goldSynergy) {
      finalAmount = Math.max(1, Math.ceil(baseAmount * 0.75)); // ⚖️ 골드 유지비 25% 감면
      isDiscounted = true;
    } else if (res === 'ether' && synergies.etherSynergy) {
      finalAmount = Math.max(1, Math.ceil(baseAmount * 0.75)); // 🧪 마도 에테르 유지비 25% 감면 (인프라 시너지 5% 축소)
      isDiscounted = true;
    }

    // 📜 심연의 백과 영지 시설 유지비 감면 적용
    const codexUpkeepDiscount = this.getCodexBonus?.()?.upkeepDiscountPct || 0;
    if (codexUpkeepDiscount > 0) {
      const discountRatio = Math.min(0.5, codexUpkeepDiscount / 100);
      finalAmount = Math.max(1, Math.ceil(finalAmount * (1 - discountRatio)));
      isDiscounted = true;
    }

    const resMeta = {
      food: { icon: '🍖', name: '식량' },
      ether: { icon: '✨', name: '에테르' },
      gold: { icon: '🪙', name: '골드' },
    }[res];

    return {
      res,
      amount: finalAmount,
      resIcon: resMeta.icon,
      resName: resMeta.name,
      secondaryRes: secondaryRes || undefined,
      secondaryAmount: secondaryAmount > 0 ? secondaryAmount : undefined,
      secondaryIcon: secondaryIcon || undefined,
      secondaryName: secondaryName || undefined,
      originalAmount: baseAmount,
      isDiscounted
    };
  }

  /** 시설 유지비 처리 및 체납 시 일시 하향 / 유지비 지불 가능 시 원래 레벨로 자동 복구 */
  public processBuildingUpkeep(): boolean {
    const UNLOCK_PRIORITY: BuildingId[] = [
      'butchery', 'cabin', 'lumberCamp', 'quarry',
      'storage', 'tavern', 'blacksmith', 'sanctuary', 'alchemy', 'infirmary', 'market', 'arenaGate'
    ];

    const demoted: { name: string; prevLv: number; newLv: number; resName: string }[] = [];
    const restored: { name: string; prevLv: number; newLv: number; resName: string }[] = [];
    let stateChanged = false;

    // 🌟 자원별 실제 차감 총액 집계 (중복 방지 및 단일 통일)
    const totalDeducted: Record<'gold' | 'food' | 'ether', number> = { gold: 0, food: 0, ether: 0 };

    const resTypes: Array<'food' | 'ether' | 'gold'> = ['food', 'ether', 'gold'];

    for (const resType of resTypes) {
      const targetBIds = UNLOCK_PRIORITY.filter(id => {
        const b = this.buildings[id];
        if (!b || b.isPaused) return false; // ⏸️ 가동 정지된 시설은 유지비 청구 및 체납 제외
        const permanentLv = b.maxLevel || b.level;
        return (permanentLv >= 4 || id === 'storage') && permanentLv > 0 && this.getBuildingUpkeep(id, permanentLv).res === resType;
      });

      if (targetBIds.length === 0) continue;

      // 1. 전체 최고 레벨(maxLevel) 유지비 총합
      const fullReq = targetBIds.reduce((acc, id) => {
        const b = this.buildings[id];
        const permanentLv = b.maxLevel || b.level;
        return acc + this.getBuildingUpkeep(id, permanentLv).amount;
      }, 0);

      // 2. 현재 실제 작동 레벨(level) 유지비 총합
      const activeReq = targetBIds.reduce((acc, id) => {
        const b = this.buildings[id];
        return acc + this.getBuildingUpkeep(id, b.level).amount;
      }, 0);

      const resMeta = GameManager.getResourceMeta(resType);

      if (this.resources[resType] >= fullReq && fullReq > 0) {
        // [완전 결제]: 최고 레벨 유지비 정상 차감 및 일시 하향된 건물 원상 복구
        this.resources[resType] -= fullReq;
        totalDeducted[resType] += fullReq;

        // 해당 건물의 보조 유지비(secondaryRes) 함께 일괄 차감
        for (const bId of targetBIds) {
          const b = this.buildings[bId];
          const permanentLv = b?.maxLevel || b?.level || 0;
          const up = this.getBuildingUpkeep(bId, permanentLv);
          if (up.secondaryRes && up.secondaryAmount && up.secondaryAmount > 0) {
            const secRes = up.secondaryRes;
            const secAmt = up.secondaryAmount;
            this.resources[secRes] = Math.max(0, this.resources[secRes] - secAmt);
            totalDeducted[secRes] += secAmt;
          }
        }

        stateChanged = true;

        for (const bId of targetBIds) {
          const b = this.buildings[bId];
          if (b && b.maxLevel && b.level < b.maxLevel) {
            const prevLv = b.level;
            b.level = b.maxLevel;
            restored.push({ name: b.name, prevLv, newLv: b.level, resName: resMeta.name });
          }
        }
      } else if (this.resources[resType] >= activeReq && activeReq > 0) {
        // [부분 유지 결제]: 현재 작동 중인 레벨의 유지비만 차감 (추가 하락 없이 현상태 유지)
        this.resources[resType] -= activeReq;
        totalDeducted[resType] += activeReq;

        for (const bId of targetBIds) {
          const b = this.buildings[bId];
          const up = this.getBuildingUpkeep(bId, b.level);
          if (up.secondaryRes && up.secondaryAmount && up.secondaryAmount > 0) {
            const secRes = up.secondaryRes;
            const secAmt = up.secondaryAmount;
            this.resources[secRes] = Math.max(0, this.resources[secRes] - secAmt);
            totalDeducted[secRes] += secAmt;
          }
        }

        stateChanged = true;
      } else if (activeReq === 0) {
        // 모든 건물이 Lv.2 이하로 하향되어 현재 유지비 0원인 상태 -> 체납 처리 없음
      } else {
        // [유지비 체납]: 현재 자원을 0으로 소모하고, 작동 중인 건물 1개 1단계 일시 하향
        this.resources[resType] = 0;
        stateChanged = true;

        for (const bId of targetBIds) {
          const b = this.buildings[bId];
          if (b && ((b.level >= 4) || (bId === 'storage' && b.level > 1))) {
            if (!b.maxLevel || b.maxLevel < b.level) {
              b.maxLevel = b.level;
            }
            const prevLv = b.level;
            b.level -= 1;
            demoted.push({ name: b.name, prevLv, newLv: b.level, resName: resMeta.name });
            break;
          }
        }
      }
    }

    // 🌟 같은 자원은 단일 항목으로 통일하여 중복 아이콘 없이 표시 (골드 ➔ 식량 ➔ 에테르 순)
    const paidParts: string[] = [];
    const displayOrder: Array<'gold' | 'food' | 'ether'> = ['gold', 'food', 'ether'];
    for (const rKey of displayOrder) {
      if (totalDeducted[rKey] > 0) {
        const meta = GameManager.getResourceMeta(rKey);
        paidParts.push(`${meta.icon} -${totalDeducted[rKey]}`);
      }
    }

    if (paidParts.length > 0) {
      // 🌟 상단 자원바 실시간 티커 이벤트로 단일 통일된 메시지 발행
      this.emit('upkeepPaid', {
        message: `유지비가 결제되었습니다. (${paidParts.join(', ')})`,
        paidParts
      });
    }

    if (restored.length > 0) {
      restored.forEach(r => {
        this.addLog(`✨ [시설 복구] 충분한 유지비가 확보되어 [${r.name}]의 기능이 정상 레벨(Lv.${r.newLv})로 복구되었습니다!`, 'reward');
      });
      this.emit('buildingUpdated');
      this.saveGame();
    }

    if (demoted.length > 0) {
      demoted.forEach(d => {
        this.addLog(`⚠️ [유지비 체납!] ${d.resName} 부족으로 인해 [${d.name}]의 시설 유지가 중단되어 기능이 일시 하향되었습니다. (Lv.${d.prevLv} ➔ Lv.${d.newLv}, 유지비 확보 시 자동 복구)`, 'danger');
      });
      this.emit('buildingUpdated');
      this.saveGame();
    }

    return stateChanged;
  }

  public on(event: string, callback: (data?: unknown) => void): void {
    if (!this.listeners[event]) this.listeners[event] = [];
    this.listeners[event].push(callback);
  }

  public off(event: string, callback: (data?: unknown) => void): void {
    if (!this.listeners[event]) return;
    this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
  }

  public removeAllListeners(event?: string): void {
    if (event) {
      this.listeners[event] = [];
    } else {
      this.listeners = {};
    }
  }

  public emit(event: string, data?: unknown): void {
    if (this.listeners[event]) this.listeners[event].forEach(cb => cb(data));
  }

  /** React 훅용 전체 상태 스냅샷 반환 */
  public getSnapshot() {
    const cleanParty = this.party.filter(p => p && p.id && this.barracks.some(b => b.id === p.id) && !this.infirmaryPatients.includes(p.id));
    return {
      resources: { ...this.resources },
      buildings: { ...this.buildings },
      quests: [...this.quests],
      subQuestCooldownUntil: this.subQuestCooldownUntil,
      party: [...cleanParty],
      barracks: [...this.barracks],
      equipmentInventory: [...this.equipmentInventory],
      skillBookInventory: [...this.skillBookInventory],
      tavernCandidates: [...this.tavernCandidates],
      tavernArrivalSecondsLeft: this.tavernArrivalSecondsLeft,
      tavernRefreshCount: this.tavernRefreshCount,
      tavernRefreshCost: this.getTavernRefreshCost(),
      infirmaryPatients: [...this.infirmaryPatients],
      logs: [...this.logs],
      citadelLogs: [...this.citadelLogs],
      dungeonLogs: [...this.dungeonLogs],
      battleLogs: [...this.battleLogs],
      currentArenaRank: this.currentArenaRank,
      currentArenaRating: this.currentArenaRating,
      arenaCoins: this.arenaCoins,
      arenaStreak: this.arenaStreak,
      pveBuffActive: this.pveBuffActive,
      bonfireStacks: this.bonfireStacks,
      bonfireWarmthTime: this.bonfireWarmthTime,
      lastTickTimestamp: this.lastTickTimestamp,
      offlineReport: this.offlineReport,
      dungeonFloor: this.dungeonFloor,
      dungeonDangerLevel: this.dungeonDangerLevel,
      isOvercharged: this.isOvercharged,
      unlockedDungeonFloor: this.unlockedDungeonFloor,
      purifiedFloors: [...(this.purifiedFloors || [])],
      hasEnteredDungeon: this.hasEnteredDungeon,
      hasReturnedFromDungeon: this.hasReturnedFromDungeon,
      hasCraftedEquipment: this.hasCraftedEquipment,
      hasCraftedGrimoire: this.hasCraftedGrimoire,
      portalAppeared: this.portalAppeared,
      currentMonsters: [...this.currentMonsters],
      dungeonInventory: [...this.dungeonInventory],
      pendingLoot: [...this.pendingLoot],
      backpackCapacity: this.backpackCapacity,
      lastSelectedBagId: this.lastSelectedBagId,
      activeCatalysts: [...this.activeCatalysts],
      bonds: { ...this.bonds },
      nemesisState: { ...this.nemesisState },
      invasionState: { ...this.invasionState },
      citadelSupplies: { ...this.citadelSupplies },
      codexUnlockedItems: { ...this.codexUnlockedItems },
      codexUnlockOrder: [...(this.codexUnlockOrder || [])],
      codexUnlockedTimestamps: { ...(this.codexUnlockedTimestamps || {}) },
      cemetery: [...this.cemetery],
      memorialExpBuffUntil: this.memorialExpBuffUntil,
      activeAncestralBlessing: this.activeAncestralBlessing ? { ...this.activeAncestralBlessing } : null,
      mercenaryManageCharges: this.mercenaryManageCharges ?? 1,
      inTransitHero: this.inTransitHero ? { ...this.inTransitHero } : null,
      bonfireAdCharges: this.bonfireAdCharges,
      wagonAdCharges: this.wagonAdCharges,
      hasCatalystCharge: this.hasCatalystCharge,
      currentScreen: this.currentScreen,
    };
  }

  /** 화면 전환 (React 라우터 역할) 및 상황별 로그 격리/정리 */
  public navigateTo(screen: 'citadel' | 'exploration' | 'battle' | 'arena'): void {
    const prevScreen = this.currentScreen;
    this.currentScreen = screen;
    this.currentSceneContext = screen === 'battle' ? 'battle'
      : screen === 'exploration' ? 'exploration'
      : screen === 'arena' ? 'arena'
      : 'citadel';
    this.syncAllHeroesStats();

    // 🌟 화면 전환 시 이전 상황 로그 격리 및 정리
    if (screen === 'exploration') {
      this.hasEnteredDungeon = true;
      if (this.dungeonFloor >= 1) {
        this.updateQuestObjective('Q_MAIN_02', 2, 1);
      }
      if (prevScreen === 'citadel') {
        // 성채에서 새로운 던전 출진 시 이전 탐험 로그 완전 초기화
        this.dungeonLogs = [];
        this.addLog(`🗺️ [심연 탐험] 방주 원정대가 심연의 던전 ${this.dungeonFloor === 11 ? '무간도' : `${this.dungeonFloor}층`}에 진입했습니다.`, 'story', 'dungeon');
      } else if (prevScreen === 'battle') {
        // 전투 후 탐험 복귀 시
        this.addLog(`🧭 [탐색 재개] 전투를 마치고 ${this.dungeonFloor === 11 ? '무간도' : `${this.dungeonFloor}층`} 탐색을 이어갑니다.`, 'normal', 'dungeon');
      } else if (this.dungeonLogs.length === 0) {
        this.addLog(`🗺️ [심연 탐험] 방주 원정대가 심연의 던전 ${this.dungeonFloor === 11 ? '무간도' : `${this.dungeonFloor}층`}에 진입했습니다.`, 'story', 'dungeon');
      }
    } else if (screen === 'battle') {
      // 새로운 전투 진입 시 이전 전투 로그 완전 초기화
      this.battleLogs = [];
      this.addLog(`⚔️ [전투 돌입] 몬스터와의 전투가 시작되었습니다!`, 'danger', 'battle');
    } else if (screen === 'citadel') {
      // 🌟 성채 복귀 시 던전 세션 완전 정리 및 즉시 저장
      this.clearDungeonSession();
      this.battleLogs = [];
      if (this.citadelLogs.length === 0) {
        this.addLog('🏰 방주 성채로 무사히 귀환했습니다.', 'normal', 'citadel');
        this.addLog(this.getCurrentPartyLogText(), 'story', 'citadel');
      }
      this.saveGame();
      try {
        this.saveToCloud();
      } catch (_) {}
    }

    this.emit('screenChanged', screen);
    this.emit('update');
  }

  public clearBattleLogs(): void {
    this.battleLogs = [];
    this.emit('update');
  }

  public clearDungeonLogs(): void {
    this.dungeonLogs = [];
    this.emit('update');
  }

  public clearCitadelLogs(): void {
    this.citadelLogs = [];
    this.emit('update');
  }

  /** 📖 전역 백과사전 모달 호출 브릿지 (검색어 및 탭 자동 포커스) */
  public openEncyclopedia(query?: string, tab?: string): void {
    this.emit('openEncyclopedia', { query: query || '', tab: tab || 'all' });
  }

  private lastLogText: string = '';
  private lastLogTime: number = 0;

  public addLog(
    text: string,
    type: LogEntry['type'] = 'normal',
    category?: 'citadel' | 'dungeon' | 'battle',
    extra?: { round?: number; turn?: number; actorName?: string }
  ): void {
    const now = Date.now();
    // 600ms 이내에 완전히 동일한 텍스트가 연속으로 들어오면 중복 방지 (StrictMode 및 렌더 훅 중복 방지)
    if (this.lastLogText === text && (now - this.lastLogTime) < 600) {
      return;
    }
    this.lastLogText = text;
    this.lastLogTime = now;

    let targetCategory: 'citadel' | 'dungeon' | 'battle' = category || (
      type === 'round_divider' || type === 'turn_divider' ? 'battle'
      : this.currentScreen === 'battle' ? 'battle'
      : this.currentScreen === 'exploration' ? 'dungeon'
      : 'citadel'
    );

    // 📜 서브 의뢰 도착 관련 로그는 항상 영지(성채) 로그로 분류하여 던전/전투 로그에 혼입 방지
    if (text.includes('[신규 서브 의뢰 도착]') || text.includes('서브 의뢰 도착')) {
      targetCategory = 'citadel';
    }

    const time = new Date().toTimeString().split(' ')[0];
    const newEntry: LogEntry = {
      id: Math.random().toString(36).substring(2, 9),
      text,
      type,
      timestamp: time,
      category: targetCategory,
      turn: extra?.turn,
      round: extra?.round,
      actorName: extra?.actorName,
    };

    if (targetCategory === 'battle') {
      this.battleLogs.push(newEntry);
      if (this.battleLogs.length > 150) this.battleLogs.shift();
    } else if (targetCategory === 'dungeon') {
      this.dungeonLogs.push(newEntry);
      if (this.dungeonLogs.length > 45) this.dungeonLogs.shift();
    } else {
      this.citadelLogs.push(newEntry);
      if (this.citadelLogs.length > 45) this.citadelLogs.shift();
    }

    // 전체 logs 배열에도 보관 (최대 45개 유지)
    this.logs.push(newEntry);
    if (this.logs.length > 45) this.logs.shift();

    this.emit('logAdded', newEntry);
  }

    /** 실시간 자원별 초당 증감율(Net Production Rate) 계산 (생산량 vs 유지비) */
  public getResourceNetRate(resKey: keyof GameResources): {
    ratePerSec: number;
    productionPerSec: number;
    consumptionPerSec: number;
    trend: 'up' | 'down' | 'stable';
    text: string;
  } {
    const hasWarmth = this.bonfireWarmthTime > 0 && this.bonfireStacks >= 5;
    const warmthMult = hasWarmth ? 1.15 : 1.0;
    const upkeepSec = this.getUpkeepIntervalSeconds();

    let prodPerSec = 0;
    let consPerSec = 0;

    if (resKey === 'wood') {
      const lc = this.buildings['lumberCamp'];
      if (lc && lc.level > 0 && !lc.isPaused) {
        prodPerSec = (Math.max(1, Math.round(lc.level * 2 * 0.9)) * warmthMult) / 9; // 9초마다 2*Lv (10% 감축)
      }
    } else if (resKey === 'stone') {
      const q = this.buildings['quarry'];
      if (q && q.level > 0 && !q.isPaused) {
        prodPerSec = (Math.max(1, Math.round(q.level * 2 * 0.9)) * warmthMult) / 11; // 11초마다 2*Lv (10% 감축)
      }
    } else if (resKey === 'iron') {
      const q = this.buildings['quarry'];
      if (q && q.level >= 3 && !q.isPaused) {
        prodPerSec = (Math.floor(q.level / 3) * warmthMult) / 11; // 11초마다 Lv/3
      }
    } else if (resKey === 'food') {
      const b = this.buildings['butchery'];
      if (b && b.level > 0 && !b.isPaused) {
        const baseAmt = GameManager.getButcheryBaseProduction(b.level);
        prodPerSec += (baseAmt * warmthMult) / 13; // 13초마다 식량
      }
      const tav = this.buildings['tavern'];
      if (tav && tav.level >= 5 && !tav.isPaused) {
        const tavFood = GameManager.getTavernBaseFoodProduction(tav.level);
        prodPerSec += (tavFood * warmthMult) / 15; // 15초마다 식량 (5% 감축)
      }
      for (const bId in this.buildings) {
        const building = this.buildings[bId as BuildingId];
        if (building && building.level >= 4 && !building.isPaused) {
          const up = this.getBuildingUpkeep(bId as BuildingId, building.level);
          if (up.res === 'food') {
            consPerSec += up.amount / upkeepSec;
          }
        }
      }
      // 공방 보조 식량 유지비
      const alc = this.buildings['alchemy'];
      if (alc && alc.level >= 4 && !alc.isPaused) {
        let alcFood = this.getUpkeepFactor(alc.level) * 1;
        if (this.getInfraSynergies().foodSynergy) alcFood = Math.max(1, Math.ceil(alcFood * 0.70));
        consPerSec += alcFood / upkeepSec;
      }
      // 에테르 광맥 시추소 7레벨 이후 보조 식량 유지비
      const quarry = this.buildings['quarry'];
      if (quarry && quarry.level >= 7 && !quarry.isPaused) {
        const qUp = this.getBuildingUpkeep('quarry', quarry.level);
        if (qUp.secondaryAmount && qUp.secondaryAmount > 0) {
          consPerSec += qUp.secondaryAmount / upkeepSec;
        }
      }
    } else if (resKey === 'leather') {
      const b = this.buildings['butchery'];
      if (b && b.level >= 3 && !b.isPaused) {
        prodPerSec = (Math.floor(b.level / 3) * warmthMult) / 13; // 13초마다 Lv/3
      }
    } else if (resKey === 'ether') {
      const alc = this.buildings['alchemy'];
      if (alc && alc.level > 0 && !alc.isPaused) {
        const alcBase = GameManager.getAlchemyBaseProduction(alc.level);
        prodPerSec = (alcBase * warmthMult) / 15; // 15초마다 alcBase
      }
      for (const bId in this.buildings) {
        const building = this.buildings[bId as BuildingId];
        if (building && building.level >= 4 && !building.isPaused) {
          const up = this.getBuildingUpkeep(bId as BuildingId, building.level);
          if (up.res === 'ether') {
            consPerSec += up.amount / upkeepSec;
          }
        }
      }
    } else if (resKey === 'gold') {
      const cabin = this.buildings['cabin'];
      if (cabin && cabin.level > 0 && !cabin.isPaused) {
        const cabinBase = GameManager.getCabinBaseProduction(cabin.level);
        prodPerSec += (cabinBase * warmthMult) / 13; // 13초마다 cabinBase
      }
      const market = this.buildings['market'];
      if (market && market.level > 0 && !market.isPaused) {
        prodPerSec += (GameManager.getMarketBaseProduction(market.level) * warmthMult) / 15; // 15초마다 marketBase (5% 감축)
      }
      for (const bId in this.buildings) {
        const building = this.buildings[bId as BuildingId];
        if (building && (building.level >= 4 || bId === 'storage') && building.level > 0 && !building.isPaused) {
          const up = this.getBuildingUpkeep(bId as BuildingId, building.level);
          if (up.res === 'gold') {
            consPerSec += up.amount / upkeepSec;
          }
        }
      }
      // 심연의 병기창 보조 골드 유지비
      const forge = this.buildings['blacksmith'];
      if (forge && forge.level >= 4 && !forge.isPaused) {
        const forgeUp = this.getBuildingUpkeep('blacksmith', forge.level);
        if (forgeUp.secondaryAmount && forgeUp.secondaryAmount > 0) {
          consPerSec += forgeUp.secondaryAmount / upkeepSec;
        }
      }
      // 생체 복원 병동 보조 골드 유지비 (식량 유지비의 50%)
      const inf = this.buildings['infirmary'];
      if (inf && inf.level >= 4 && !inf.isPaused) {
        let infGold = Math.floor(this.getBuildingUpkeep('infirmary', inf.level).amount * 0.5);
        if (this.getInfraSynergies().goldSynergy) infGold = Math.max(1, Math.ceil(infGold * 0.75));
        consPerSec += infGold / upkeepSec;
      }
    }

    const net = prodPerSec - consPerSec;
    const isFull = (this.resources[resKey] || 0) >= this.getMaxResourceCapacity(resKey);

    if (isFull && net > 0) {
      return {
        ratePerSec: 0,
        productionPerSec: prodPerSec,
        consumptionPerSec: consPerSec,
        trend: 'stable',
        text: '최대 보관 중'
      };
    }

    if (Math.abs(net) < 0.01) {
      return {
        ratePerSec: 0,
        productionPerSec: prodPerSec,
        consumptionPerSec: consPerSec,
        trend: 'stable',
        text: '유지 중'
      };
    } else if (net > 0) {
      return {
        ratePerSec: net,
        productionPerSec: prodPerSec,
        consumptionPerSec: consPerSec,
        trend: 'up',
        text: `+${net.toFixed(1)}/초`
      };
    } else {
      return {
        ratePerSec: net,
        productionPerSec: prodPerSec,
        consumptionPerSec: consPerSec,
        trend: 'down',
        text: `${net.toFixed(1)}/초`
      };
    }
  }

  /** 📦 방주 중앙 병참고(storage) 레벨별 자원 최대 적재 한도 (Lv.0~10) */
  // 1. 🏰 영지 생산품 (목재, 식량, 석재, 석탄, 에테르) ➔ 10레벨에 20,000개
  public static readonly STORAGE_CAPACITIES_BASIC = [250, 250, 500, 1000, 2000, 3500, 6000, 9000, 12500, 16000, 20000];

  // 2. 🌿 파밍 재료 (철광석, 가죽, 약초, 실크, 짐승 뼈) ➔ 10레벨에 5,000개
  public static readonly STORAGE_CAPACITIES_FARMING = [250, 250, 500, 1000, 1500, 2000, 2600, 3200, 3800, 4400, 5000];

  // 3. 🔮 심연 재료 (마력 수정, 공허 파편, 접두/접미석, 순수석, 보스 유물 등) ➔ 10레벨에 1,000개
  public static readonly STORAGE_CAPACITIES_RARE = [50, 50, 100, 200, 350, 500, 600, 700, 800, 900, 1000];

  /** 🏕️ 생존자 안식처(cabin) 레벨별 기본 골드 생산량 (13초 주기, Lv.6 손익분기점, Lv.9 미세적자, Lv.10 +0.2G/초 흑자 조율) */
  public static getCabinBaseProduction(level: number): number {
    if (level <= 0) return 0;
    const cabinMap: Record<number, number> = {
      1: 4,
      2: 10,
      3: 15,
      4: 21,
      5: 26,
      6: 51,
      7: 74,
      8: 93,
      9: 104,
      10: 134
    };
    if (cabinMap[level]) return cabinMap[level];
    return Math.round(134 * Math.pow(1.25, level - 10));
  }

  /** 🥩 심연 생체 정제소(butchery) 레벨별 기본 식량 생산량 (13초 주기, 생산량 5% 감축 적용) */
  public static getButcheryBaseProduction(level: number): number {
    if (level <= 0) return 0;
    const base = level <= 4 ? level : Math.round((4 + (level - 4) * 2) * 1.5);
    const full = Math.max(1, Math.round(base * 1.8));
    const baseAfter10 = Math.max(1, Math.round(full * 0.9));
    // 📉 식량 생산량 5% 추가 감축 적용
    return Math.max(1, Math.round(baseAfter10 * 0.95));
  }

  /** 🧪 에테르 연금 공방(alchemy) 레벨별 기본 에테르 생산량 (15초 주기, Lv.3·Lv.4 틱당 +2개 상향 적용) */
  public static getAlchemyBaseProduction(level: number): number {
    if (level <= 0) return 0;
    const alcMap: Record<number, number> = {
      1: 2,
      2: 5,
      3: 7,   // 기존 5에서 틱당 +2 상향 (7)
      4: 11,  // 기존 9에서 틱당 +2 상향 (11)
      5: 15,
      6: 18,
      7: 23,
      8: 29,
      9: 35,
      10: 41
    };
    if (alcMap[level]) return alcMap[level];
    return Math.round(41 * Math.pow(1.15, level - 10));
  }

  /** ⚖️ 황혼의 블랙 마켓(market) 레벨별 기본 골드 수급량 (15초 주기, 골드 5% 감축 적용) */
  public static getMarketBaseProduction(level: number): number {
    if (level <= 0) return 0;
    const base = Math.max(1, Math.round(level * 2 * 0.9));
    // 📉 골드 생산량 5% 추가 감축 적용
    return Math.max(1, Math.round(base * 0.95));
  }

  /** 🍺 방랑자의 라운지(tavern) 레벨별 기본 식량 생산량 (15초 주기, Lv.5+, 식량 5% 감축 적용) */
  public static getTavernBaseFoodProduction(level: number): number {
    if (level < 5) return 0;
    const base = (2 + Math.floor((level - 5) / 2) * 2) * 2;
    const baseAfter10 = Math.max(1, Math.round(base * 0.9));
    // 📉 식량 생산량 5% 추가 감축 적용
    return Math.max(1, Math.round(baseAfter10 * 0.95));
  }

  /** 자원 타입의 카테고리 분류 반환 */
  public getResourceCategory(type: keyof GameResources): 'basic' | 'farming' | 'rare' {
    switch (type) {
      case 'wood':
      case 'food':
      case 'stone':
      case 'coal':
      case 'ether':
        return 'basic';
      case 'iron':
      case 'leather':
      case 'herb':
      case 'silk':
      case 'bone':
        return 'farming';
      default:
        return 'rare';
    }
  }

  /** 특정 창고 레벨에서의 자원 분류별 최대 적재 한도 반환 */
  public getMaxResourceCapacityForLevel(level: number, category: 'basic' | 'farming' | 'rare' = 'basic'): number {
    const idx = Math.min(10, Math.max(0, level));
    if (category === 'farming') {
      return GameManager.STORAGE_CAPACITIES_FARMING[idx] || 250;
    }
    if (category === 'rare') {
      return GameManager.STORAGE_CAPACITIES_RARE[idx] || 50;
    }
    return GameManager.STORAGE_CAPACITIES_BASIC[idx] || 250;
  }

  public getMaxResourceCapacity(type: keyof GameResources): number {
    if (type === 'gold') return 100_000_000;
    const keyStr = String(type);
    if (keyStr.startsWith('ooparts_') || keyStr.startsWith('memoir_note_')) {
      return 9999;
    }
    
    const warehouseLevel = this.buildings['storage']?.level || 0;
    const cat = this.getResourceCategory(type);
    return this.getMaxResourceCapacityForLevel(warehouseLevel, cat);
  }

  public modifyResource(type: keyof GameResources, amount: number): boolean {
    if (this.resources[type] === undefined) {
      (this.resources as any)[type] = 0;
    }
    if (amount < 0 && this.resources[type] + amount < 0) return false;
    
    const maxCapacity = this.getMaxResourceCapacity(type);
    
    if (amount > 0) {
      // 🌟 창고가 레벨 다운되었을 때: 다운된 적재량 이상이 있는 자원은 추가 저장이 되지 않고 멈춤
      if (this.resources[type] < maxCapacity) {
        this.resources[type] = Math.min(maxCapacity, this.resources[type] + amount);
      }
    } else if (amount < 0) {
      // 🌟 자원 소모 시: 현재 수량이 다운된 적재량을 초과해 있더라도 기존 수량에서 정상 차감 (강제 축소 없음)
      this.resources[type] = Math.max(0, this.resources[type] + amount);
    }
    
    this.emit('resourcesChanged', this.resources);
    this.checkAllQuestObjectives();
    this.saveGame();
    return true;
  }

  public getBuildingUpgradeCost(id: BuildingId, currentLevel: number): Partial<GameResources> {
    const baseCost = BUILDING_BASE_COSTS[id] || {};
    if (currentLevel === 0) {
      const initialCost: Partial<GameResources> = {};
      for (const [res, amt] of Object.entries(baseCost)) {
        if (id !== 'infirmary' && res !== 'wood') {
          initialCost[res as keyof GameResources] = Math.max(1, Math.floor((amt as number) * 2.1));
        } else {
          initialCost[res as keyof GameResources] = amt as number;
        }
      }
      // 🕶️ 황혼의 블랙 마켓: 모든 구간에서 골드 2배
      if (id === 'market' && initialCost.gold) {
        initialCost.gold = Math.max(1, Math.floor(initialCost.gold * 2));
      }
      return initialCost;
    }
    
    // 급격한 요구량 증가 (노가다 유도)
    const multiplier = Math.pow(1.6, currentLevel);
    const finalCost: Partial<GameResources> = {};
    
    for (const [res, amt] of Object.entries(baseCost)) {
      finalCost[res as keyof GameResources] = Math.floor((amt as number) * multiplier);
    }
    
    if (currentLevel >= 3) {
      const ironBase = id === 'infirmary' ? 45 : 15;
      finalCost.iron = (finalCost.iron || 0) + Math.floor(ironBase * Math.pow(1.6, currentLevel - 3));
    }
    if (currentLevel >= 5) {
      finalCost.ether = (finalCost.ether || 0) + Math.floor(10 * Math.pow(1.6, currentLevel - 5));
    }
    if (currentLevel >= 7) {
      finalCost.leather = (finalCost.leather || 0) + Math.floor(20 * Math.pow(1.6, currentLevel - 7));
    }
    if (currentLevel >= 9) {
      finalCost.void_shard = (finalCost.void_shard || 0) + Math.floor(5 * Math.pow(1.6, currentLevel - 9));
    }

    // 🏥 병원(생체 복원 병동): 6레벨부터 목재를 제외한 모든 강화 재료(약초, 철광석, 에테르, 가죽, 공허파편 등) 2.1배 (3배에서 30% 감축)
    if (id === 'infirmary' && currentLevel >= 6) {
      for (const res of Object.keys(finalCost) as (keyof GameResources)[]) {
        if (res !== 'wood' && (finalCost[res] || 0) > 0) {
          finalCost[res] = Math.max(1, Math.floor((finalCost[res] || 0) * 2.1));
        }
      }
    } else if (id !== 'infirmary') {
      // 🏛️ 병원을 제외한 모든 건물의 목재 외 강화 재료(석재, 철광석, 골드, 에테르, 가죽, 공허파편 등) 전 구간 2.1배 (3배에서 30% 감축)
      for (const res of Object.keys(finalCost) as (keyof GameResources)[]) {
        if (res !== 'wood' && (finalCost[res] || 0) > 0) {
          finalCost[res] = Math.max(1, Math.floor((finalCost[res] || 0) * 2.1));
        }
      }
    }

    // 🕶️ 황혼의 블랙 마켓: 5레벨부터 강화 시(Lv.5+) 석재 필요량 30% 감축
    if (id === 'market' && currentLevel >= 5 && finalCost.stone) {
      finalCost.stone = Math.max(1, Math.floor(finalCost.stone * 0.7));
    }

    // 🕶️ 황혼의 블랙 마켓: 3레벨 이후(Lv.3+) 레벨 당 건설 자원 비용 50% 증가 (1.5배)
    if (id === 'market' && currentLevel >= 3) {
      for (const res of Object.keys(finalCost) as (keyof GameResources)[]) {
        if ((finalCost[res] || 0) > 0) {
          finalCost[res] = Math.max(1, Math.round((finalCost[res] || 0) * 1.5));
        }
      }
    }

    // ── 🏗️ 건물별 맞춤 건축 자원 밸런싱 규칙 (목표 레벨 = currentLevel + 1) ──
    const targetLevel = currentLevel + 1;

    // 1. 생존자 안식처(cabin): 레벨4부터 목재 소모량 2배, 8레벨부터 3배
    if (id === 'cabin' && finalCost.wood) {
      if (targetLevel >= 8) {
        finalCost.wood = Math.max(1, Math.floor(finalCost.wood * 3));
      } else if (targetLevel >= 4) {
        finalCost.wood = Math.max(1, Math.floor(finalCost.wood * 2));
      }
    }

    // 2. 광맥시추소(quarry): 레벨 5부터 목재 소모 3배
    if (id === 'quarry' && targetLevel >= 5 && finalCost.wood) {
      finalCost.wood = Math.max(1, Math.floor(finalCost.wood * 3));
    }

    // 3. 심연의 병기창(blacksmith): 레벨 4부터 목재 2배, 레벨 6부터 석재 2배, 레벨 8부터 철제 3배
    if (id === 'blacksmith') {
      if (targetLevel >= 4 && finalCost.wood) {
        finalCost.wood = Math.max(1, Math.floor(finalCost.wood * 2));
      }
      if (targetLevel >= 6 && finalCost.stone) {
        finalCost.stone = Math.max(1, Math.floor(finalCost.stone * 2));
      }
      if (targetLevel >= 8 && finalCost.iron) {
        finalCost.iron = Math.max(1, Math.floor(finalCost.iron * 3));
      }
    }

    // 4. 영혼의 제단(sanctuary): 레벨 5부터 에테르 2배
    if (id === 'sanctuary' && targetLevel >= 5 && finalCost.ether) {
      finalCost.ether = Math.max(1, Math.floor(finalCost.ether * 2));
    }

    // 5. 에테르 연금 공방(alchemy): 레벨 4부터 철광석 2배
    if (id === 'alchemy' && targetLevel >= 4 && finalCost.iron) {
      finalCost.iron = Math.max(1, Math.floor(finalCost.iron * 2));
    }

    // 6. 방주 중앙 병참고(storage): 레벨 4부터 모든 소모 자원 2배
    if (id === 'storage' && targetLevel >= 4) {
      for (const res of Object.keys(finalCost) as (keyof GameResources)[]) {
        if ((finalCost[res] || 0) > 0) {
          finalCost[res] = Math.max(1, Math.floor((finalCost[res] || 0) * 2));
        }
      }
    }

    // 7. 생체 복원 병동(infirmary): 레벨 4부터 목재 1.5배, 철광석 2배, 에테르 2배
    if (id === 'infirmary' && targetLevel >= 4) {
      if (finalCost.wood) {
        finalCost.wood = Math.max(1, Math.floor(finalCost.wood * 1.5));
      }
      if (finalCost.iron) {
        finalCost.iron = Math.max(1, Math.floor(finalCost.iron * 2));
      }
      if (finalCost.ether) {
        finalCost.ether = Math.max(1, Math.floor(finalCost.ether * 2));
      }
    }

    // 8. 황혼의 블랙 마켓(market): 모든 구간에서 골드 2배 및 10레벨 달성 시 석재 소모량 19725로 보정 (창고 20000 대비 1.375% 낮음)
    if (id === 'market') {
      if (finalCost.gold) {
        finalCost.gold = Math.max(1, Math.floor(finalCost.gold * 2));
      }
      if (targetLevel === 10) {
        finalCost.stone = 19725;
      }
    }

    // 9. 심연의 병기창(blacksmith): 후반부(Lv.8->9, Lv.9->10) 석재 및 철광석 창고 적재 한도 대비 1~10% 낮은 값 보정
    if (id === 'blacksmith') {
      if (targetLevel === 9) {
        // 8->9: 철광석 소모량 오버(7749) 보정 -> 파밍 창고 5000 한도 대비 5% 낮은 4750
        finalCost.iron = 4750;
      }
      if (targetLevel === 10) {
        // 9->10: 석재(20000 대비 3.5% 낮은 19300), 철광석(5000 대비 2.4% 낮은 4880)
        finalCost.stone = 19300;
        finalCost.iron = 4880;
      }
    }

    // 10. 차원의 관문(arenaGate): 후반부(Lv.8->9, Lv.9->10) 석재 및 철광석 창고 적재 한도 대비 1~10% 낮은 값 보정
    if (id === 'arenaGate') {
      if (targetLevel === 9) {
        // 8->9: 철광석(5000 대비 6% 낮은 4700)
        finalCost.iron = 4700;
      }
      if (targetLevel === 10) {
        if (finalCost.stone) finalCost.stone = Math.min(finalCost.stone, 19500); // 20000 대비 2.5% 낮음
        finalCost.iron = 4850; // 5000 대비 3% 낮음
      }
    }

    // 11. 영혼의 제단(sanctuary): 후반부(Lv.9->10) 철광석 창고 적재 한도 대비 1~10% 낮은 값 보정
    if (id === 'sanctuary' && targetLevel === 10) {
      finalCost.iron = 4800; // 5000 대비 4% 낮음
    }

    // 12. 창고 최대 적재 한도 초과 방지 범용 안전 캡 (제한폭 대비 1~10% 낮은 값 보장)
    for (const res of Object.keys(finalCost) as (keyof GameResources)[]) {
      if (res === 'gold') continue;
      const cat = this.getResourceCategory(res);
      if (cat === 'basic' && (finalCost[res] || 0) > 20000) {
        finalCost[res] = 19500; // 20000 대비 2.5% 낮음
      } else if (cat === 'farming' && (finalCost[res] || 0) > 5000) {
        finalCost[res] = 4850; // 5000 대비 3.0% 낮음
      } else if (cat === 'rare' && (finalCost[res] || 0) > 1000) {
        finalCost[res] = 950; // 1000 대비 5.0% 낮음
      }
    }
    
    return finalCost;
  }

    /** 건물 수동 가동 일시 정지 / 재가동 토글 (생산 및 유지비 소모 완전 중단) */
  public toggleBuildingPause(id: BuildingId): boolean {
    const b = this.buildings[id];
    if (!b || b.level <= 0) return false;

    b.isPaused = !b.isPaused;
    if (id === 'tavern') {
      this.addLog(
        b.isPaused
          ? `⏸️ [방랑자의 라운지] 가동을 일시 정지했습니다. (식량 생산/유지비 및 신규 서브 의뢰 갱신 중단)`
          : `▶️ [방랑자의 라운지] 가동을 재개했습니다. (정상 작동 및 서브 의뢰 갱신 재개)`,
        'system'
      );
      if (!b.isPaused) {
        this.ensureActiveSubQuests();
      }
    } else {
      this.addLog(
        b.isPaused
          ? `⏸️ [${b.name}] 시설 가동을 일시 정지했습니다. (생산 및 유지비 소모 중단)`
          : `▶️ [${b.name}] 시설 가동을 재개했습니다. (정상 작동 재개)`,
        'system'
      );
    }
    this.emit('buildingUpdated', b);
    this.emit('resourcesChanged', this.resources);
    this.saveGame();
    return true;
  }

  /** 영지 건물 테크트리 선행 조건 및 초/중/후반 3단계 마일스톤 관문 검증 */
  public checkBuildingPrerequisites(id: BuildingId, targetLevel: number): {
    allowed: boolean;
    reason?: string;
    reqName?: string;
    reqLevel?: number;
    reqBuildingId?: BuildingId;
  } {
    // 👑 마스터 계정은 차원 앵커 게이트 선행 조건 즉시 통과
    if (this.isMasterAccount && id === 'arenaGate') {
      return { allowed: true };
    }

    // 1. 기본 선행 건물 체인 검증 (최초 Lv.1 건설 시에만 선행 건물 Lv.1 이상 요구)
    if (targetLevel === 1) {
      const rule = BUILDING_TECH_TREE[id];
      if (rule) {
        const prereqBuilding = this.buildings[rule.prereqId];
        const curPrereqLv = prereqBuilding?.level || 0;

        if (curPrereqLv < 1) {
          return {
            allowed: false,
            reason: `선행 시설 [${rule.prereqName} 건설(Lv.1 이상)] 필요 (현재 미건설) - ${rule.reason}`,
            reqName: rule.prereqName,
            reqLevel: 1,
            reqBuildingId: rule.prereqId
          };
        }
      }
    }

    // 2. 중반 및 후반 세 번에 걸친 핵심 인프라 마일스톤 관문 검증
    //   - Phase 1 (중반 1차, Lv.4+): 방주 중앙 병참고(storage) Lv.3 이상 필요
    //   - Phase 2 (중반 2차, Lv.7+): 에테르 연금 공방(alchemy) Lv.5 이상 필요
    //   - Phase 3 (후반 3차, Lv.9+): 영혼의 제단(sanctuary) Lv.6 이상 필요
    for (const tier of BUILDING_MILESTONE_TIERS) {
      if (targetLevel >= tier.minLevel && id !== tier.reqBuildingId) {
        const milestoneBuilding = this.buildings[tier.reqBuildingId];
        const curMilestoneLv = milestoneBuilding?.level || 0;
        if (curMilestoneLv < tier.reqLevel) {
          return {
            allowed: false,
            reason: `[${tier.name}] ${tier.reqBuildingName} Lv.${tier.reqLevel} 이상 필요 (현재 Lv.${curMilestoneLv}) - ${tier.reason}`,
            reqName: tier.reqBuildingName,
            reqLevel: tier.reqLevel,
            reqBuildingId: tier.reqBuildingId
          };
        }
      }
    }

    return { allowed: true };
  }

  public buildBuilding(id: BuildingId): boolean {
    const b = this.buildings[id];
    if (!b) return false;
    
    if (b.level >= 10) {
      this.addLog(`[${b.name}] 이미 최고 레벨(Lv.10)입니다.`, 'normal');
      return false;
    }

    // ⏳ 이미 공사 진행 중인지 확인
    if (b.construction) {
      const remainSec = Math.max(1, Math.ceil((b.construction.startedAt + b.construction.durationMs - Date.now()) / 1000));
      this.addLog(`[${b.name}] 이미 증축/건설 공사가 진행 중입니다! (남은 시간: ${remainSec}초)`, 'normal');
      return false;
    }

    // 🏛️ 건물 테크트리 선행 조건 검증
    const nextLevel = b.level + 1;
    const prereq = this.checkBuildingPrerequisites(id, nextLevel);
    if (!prereq.allowed) {
      this.addLog(`건설 불가: ${prereq.reason}`, 'danger');
      return false;
    }

    const cost = this.getBuildingUpgradeCost(id, b.level);
    for (const [res, amt] of Object.entries(cost)) {
      if (this.resources[res as keyof GameResources] < (amt as number)) {
        this.addLog(`건설 실패: [${b.name}]에 필요한 자원이 부족합니다!`, 'danger');
        return false;
      }
    }

    const costParts: string[] = [];
    for (const [res, amt] of Object.entries(cost)) {
      const num = amt || 0;
      if (num > 0) {
        this.modifyResource(res as keyof GameResources, -num);
        const icon = res === 'gold' ? '🪙' : res === 'wood' ? '🪵' : res === 'stone' ? '🪨' : res === 'iron' ? '⚙️' : res === 'food' ? '🌾' : res === 'ether' ? '✨' : res;
        costParts.push(`${icon}${num}`);
      }
    }

    // ⏳ 레벨별 점진적 소요 시간 산정 (1레벨 3초 ~ 10레벨 60초)
    const durationSec = getBuildingConstructionDurationSec(nextLevel);
    b.construction = {
      startedAt: Date.now(),
      durationMs: durationSec * 1000,
      targetLevel: nextLevel,
    };

    const costStr = costParts.length > 0 ? ` (소모: ${costParts.join(' ')})` : '';
    this.addLog(`⚒️ [${b.name}] Lv.${nextLevel} 공사를 시작했습니다!${costStr} (예상 소요: ${durationSec}초)`, 'normal');
    SoundManager.getInstance().play('click');
    triggerHaptic('medium');

    this.emit('resourcesChanged');
    this.emit('buildingUpdated', b);
    this.saveGame();
    return true;
  }

  public getQuestRewardSummary(q: Quest): string {
    const parts: string[] = [];
    if (q.rewards.gold) parts.push(`🪙 ${q.rewards.gold}G`);
    if (q.rewards.ether) parts.push(`✨ ${q.rewards.ether}에테르`);
    if (q.rewards.unlockBuildingIds?.length || q.rewards.unlockBuildingId) parts.push('🏛️ 신규 시설 해금');
    if (q.rewards.equipment) parts.push('⚔️ 무장 보급');
    if (q.rewards.supplies?.length) parts.push('🎒 탐험 보급품');
    if (q.rewards.resources && Object.keys(q.rewards.resources).length > 0) parts.push('📦 영지 재건 자원');
    return parts.length > 0 ? parts.join(' · ') : '영지 보상';
  }

  /**
   * 🏗️ 건물 공사 완료 처리
   */
  public completeBuildingConstruction(id: BuildingId): boolean {
    const b = this.buildings[id];
    if (!b || !b.construction) return false;

    const targetLevel = b.construction.targetLevel;
    delete b.construction;

    b.level = targetLevel;
    b.maxLevel = Math.max(b.maxLevel || b.level, b.level);
    b.unlocked = true;

    this.addLog(`🎉 [${b.name}] (Lv.${b.level}) 공사가 완료되었습니다!`, 'reward');
    SoundManager.getInstance().play('quest_complete');
    triggerHaptic('heavy');

    if (id === 'butchery')    this.updateQuestObjective('Q_MAIN_01', 0, 1);
    if (id === 'storage')     this.updateQuestObjective('Q_UPGRADE_STORAGE', 0, 1);
    if (id === 'cabin')       this.updateQuestObjective('Q_BUILD_CABIN', 0, 1);
    if (id === 'lumberCamp')  this.updateQuestObjective('Q_BUILD_LUMBER', 0, 1);
    if (id === 'quarry') {
      this.updateQuestObjective('Q_BUILD_QUARRY', 0, 1);
      if (this.buildings['tavern']) {
        this.buildings['tavern'].unlocked = true;
      }
      this.activateQuest('Q_MAIN_02');
    }
    if (id === 'tavern') {
      this.updateQuestObjective('Q_MAIN_02', 0, 1);
      this.ensureActiveSubQuests();
      if (b.level === 1) {
        this.addLog('📜 [서브 의뢰 게시판 해금] 방랑자의 라운지가 완공되어 주민들의 서브 의뢰가 개방되었습니다!', 'reward');
      } else {
        this.addLog(`🍸 [방랑자의 라운지 Lv.${b.level} 증축] 명성이 높아져 더욱 보상이 풍성한 고급 서브 의뢰들이 접수됩니다! (요구치 및 골드·에테르·마도석 보상 강화)`, 'reward');
      }
    }
    if (id === 'blacksmith') {
      this.updateQuestObjective('Q_BUILD_FORGE', 0, 1);
      if (b.level >= 3) {
        this.updateQuestObjective('Q_UPGRADE_FORGE_03', 0, 1);
        this.activateQuest('Q_EQUIPMENT_ENHANCE');
        this.addLog('⚒️ [심연의 병기창 Lv.3 증축 완료] +7강 장비 한계 돌파 및 마도 제식 강화 퀘스트가 개방되었습니다!', 'reward');
      }
      if (b.level >= 6) {
        this.activateQuest('Q_ENHANCED_SUPPLY_TORCH');
        this.addLog('✨🔥 [병기창 Lv.6 특화: 강화 보급품 전면 해금!] 일반 보급품이 에테르 횃불 등 7종의 강화 보급품으로 전면 대체되었습니다! 에테르 횃불 제작 퀘스트가 개방되었습니다.', 'reward');
      }
    }
    if (id === 'alchemy') {
      this.updateQuestObjective('Q_BUILD_ALCHEMY', 0, 1);
    }
    if (id === 'infirmary') {
      this.updateQuestObjective('Q_BUILD_INFIRMARY', 0, 1);
    }
    if (id === 'sanctuary') {
      this.updateQuestObjective('Q_BUILD_SANCTUARY', 0, 1);
      this.activateQuest('Q_EPIC_LORE_01');
      this.addLog('👑 [에픽 시나리오 해금] 영혼의 제단이 완공되어 고대 방주의 기원 에픽 스토리가 개방되었습니다!', 'reward');
    }
    if (id === 'arenaGate') {
      this.updateQuestObjective('Q_BUILD_ARENA', 0, 1);
      this.activateQuest('Q_ARENA_FIRST_BATTLE');
      if (b.level >= 3) {
        this.updateQuestObjective('Q_NEMESIS_AWAKEN', 0, 1);
        this.activateQuest('Q_NEMESIS_FIRST_STRIKE');
        this.activateQuest('Q_GATE_UPGRADE_06');
        this.addLog('🌌 [차원 네메시스 관문 개방!] 차원 앵커 게이트가 Lv.3에 도달하여 시공의 침식자 네메시스 월드 레이드가 해금되었습니다!', 'reward');
      }
      if (b.level >= 6) {
        this.updateQuestObjective('Q_GATE_UPGRADE_06', 0, 1);
        this.activateQuest('Q_INVASION_FIRST_SIEGE');
        this.activateQuest('Q_TACTICAL_TOWER_RESEARCH');
        this.addLog('🏰 [차원 영지 침공 개방!] 차원 앵커 게이트가 Lv.6에 도달하여 5인 부대 영지 침공 및 전술 타워 방어 시스템이 해금되었습니다!', 'reward');
      }
    }

    this.checkAllQuestObjectives();
    const readyQuest = this.quests.find(q => q.status === 'active' && q.objectives.every(o => o.isCompleted));
    if (readyQuest) {
      this.emit('questReadyToClaim', {
        questId: readyQuest.id,
        title: readyQuest.title,
        rewardSummary: this.getQuestRewardSummary(readyQuest),
        quest: readyQuest
      });
    }
    this.emit('buildingConstructionCompleted', { buildingId: id, building: b });
    this.emit('buildingUpdated', b);
    this.emit('resourcesChanged');
    this.saveGame();
    return true;
  }

  /**
   * ⚡ 건물 공사 즉시 완료 (개발/테스트/특수 상황용)
   */
  public instantCompleteBuildingConstruction(id: BuildingId): boolean {
    const b = this.buildings[id];
    if (!b || !b.construction) return false;
    return this.completeBuildingConstruction(id);
  }

  /**
   * ⏳ 진행 중인 건물 공사의 완료 여부 정기 검사
   */
  public checkBuildingConstructions(): void {
    const now = Date.now();
    let hasCompleted = false;

    (Object.keys(this.buildings) as BuildingId[]).forEach((bId) => {
      const b = this.buildings[bId];
      if (b && b.construction) {
        if (now >= b.construction.startedAt + b.construction.durationMs) {
          this.completeBuildingConstruction(bId);
          hasCompleted = true;
        }
      }
    });

    if (hasCompleted) {
      this.emit('buildingUpdated');
      this.emit('resourcesChanged');
      this.saveGame();
    }
  }

  // ================= 3인 원정 파티 자유 교체 & 진형 =================
  public swapPartyMember(pos: PositionSlot, newHeroId: string): boolean {
    this.reconcileParty();
    const newHero = this.barracks.find(h => h.id === newHeroId);
    if (!newHero) return false;

    // 🏥 생체 복원 병동 입원 중인 용병은 파티 편성 불가
    if (this.infirmaryPatients.includes(newHeroId)) {
      this.addLog(`⚠️ [생체 복원 병동] [${newHero.name}]은(는) 현재 입원 치료 중이므로 파티에 편성할 수 없습니다.`, 'danger');
      return false;
    }

    // 기존 해당 슬롯의 파티원 찾기
    const oldPartyIdx = this.party.findIndex(h => h.position === pos);
    
    // 이미 파티에 포함되어 있는지 확인
    const alreadyInPartyIdx = this.party.findIndex(h => h.id === newHeroId);
    if (alreadyInPartyIdx !== -1) {
      // 파티 내에서 위치 교환
      if (oldPartyIdx !== -1) {
        const tempPos = this.party[oldPartyIdx].position;
        this.party[oldPartyIdx].position = this.party[alreadyInPartyIdx].position;
        this.party[alreadyInPartyIdx].position = tempPos;
      }
    } else {
      newHero.position = pos;
      if (oldPartyIdx !== -1) {
        this.party[oldPartyIdx] = newHero;
      } else {
        this.party.push(newHero);
      }
    }

    this.addLog(`[파티 교체] [${newHero.name}]님이 [${pos === 'front' ? '전열' : pos === 'mid' ? '중앙' : '후방'}]으로 원정대에 합류했습니다.`, 'normal');
    this.reconcileParty();
    this.emit('partyUpdated', this.party);
    this.emit('update');
    this.saveGame();
    return true;
  }

  // ================= 마도 대장간 (장비 제작 & 강화 & 인챈트 & 장착) =================
  public getForgeRecipes(): EquipmentRecipe[] {
    const forgeLv = (this.buildings as unknown as Record<string, { level?: number }>)['blacksmith']?.level || (this.buildings as unknown as Record<string, { level?: number }>)['forge']?.level || 1;
    return getForgeEquipmentRecipes(forgeLv);
  }

  public static buildEquipmentName(item: EquipmentItem): string {
    const rawBase = item.baseName || item.name;
    const cleanBase = rawBase.replace(/\s*\[★\d각성\]/g, '');
    const pre = item.prefix ? `[${item.prefix.name}] ` : '';
    const suf = item.suffix ? ` [${item.suffix.name}]` : '';
    const awk = (item.awakeningLevel && item.awakeningLevel > 0) ? ` [★${item.awakeningLevel}각성]` : '';
    return `${pre}${cleanBase}${suf}${awk}`;
  }

  public craftEquipment(recipeId: string, forcedRarity?: EquipmentRarity): EquipmentItem | null {
    const recipes = this.getForgeRecipes();
    const recipe = recipes.find(r => r.id === recipeId) || EQUIPMENT_RECIPES.find(r => r.id === recipeId);
    if (!recipe) return null;

    const mult = this.getForgeDiscountMultiplier();

    for (const [res, amt] of Object.entries(recipe.cost)) {
      const discountedAmt = Math.max(1, Math.floor(((amt as number) || 0) * mult));
      if (this.resources[res as keyof GameResources] < discountedAmt) {
        this.addLog(`제작 실패: [${recipe.name}]에 필요한 재화가 부족합니다!`, 'danger');
        return null;
      }
    }

    for (const [res, amt] of Object.entries(recipe.cost)) {
      const discountedAmt = Math.max(1, Math.floor(((amt as number) || 0) * mult));
      this.modifyResource(res as keyof GameResources, -discountedAmt);
    }

    // 🎲 병기창 레벨에 따른 등급 롤 및 추가 스탯 보너스 산출
    const forgeLevel = this.buildings['blacksmith']?.level || 1;
    const rolledRarity = forcedRarity || rollForgeItemRarity(forgeLevel);
    const { finalStats, bonusNotes } = applyForgeRarityBonus(recipe.baseStats, recipe.slot, rolledRarity, forgeLevel);

    const statDeltas: string[] = [];
    for (const [sKey, sVal] of Object.entries(finalStats)) {
      if (typeof sVal === 'number' && sVal > 0) {
        statDeltas.push(`${sKey.toUpperCase()} +${sVal}`);
      }
    }

    const wType = recipe.slot === 'weapon' ? (recipe.weaponType || detectWeaponType(recipe)) : undefined;
    const wTrait = recipe.slot === 'weapon' ? (recipe.weaponTrait || getWeaponTrait(recipe)) : undefined;
    const baseKey = recipe.id.replace(/^rec_/, '');
    const templateId = `forge_t${forgeLevel}_${baseKey}`;

    const rarityPrefix = rolledRarity === 'legendary' ? '👑 [전설] '
      : rolledRarity === 'epic' ? '🌟 [영웅] '
      : rolledRarity === 'rare' ? '✨ [희귀] '
      : '';
    const itemName = `${rarityPrefix}${recipe.name}`;

    const newItem: EquipmentItem = {
      id: `equip_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      templateId,
      tier: forgeLevel,
      baseName: recipe.name,
      name: itemName,
      slot: recipe.slot,
      weaponType: wType,
      weaponTrait: wTrait,
      level: 0,
      rarity: rolledRarity,
      baseStats: { ...finalStats },
      stats: { ...finalStats },
      description: recipe.description,
      icon: recipe.icon,
      affinity: recipe.affinity
    };

    this.equipmentInventory.push(newItem);
    this.hasCraftedEquipment = true;

    if (rolledRarity === 'legendary') {
      SoundManager.getInstance().play('level_up');
      this.addLog(`👑 [전설 신화 단조 대성공!!!] [${newItem.name}] (${statDeltas.join(', ')}) 단조 완료! ${bonusNotes.join(' · ')}`, 'reward');
    } else if (rolledRarity === 'epic') {
      SoundManager.getInstance().play('quest_complete');
      this.addLog(`🌟 [영웅 대박 단조!!] [${newItem.name}] (${statDeltas.join(', ')}) 단조 완료! ${bonusNotes.join(' · ')}`, 'reward');
    } else if (rolledRarity === 'rare') {
      SoundManager.getInstance().play('anvil');
      this.addLog(`✨ [희귀 단조 성공!] [${newItem.name}] (${statDeltas.join(', ')}) 단조 완료! ${bonusNotes.join(' · ')}`, 'reward');
    } else {
      SoundManager.getInstance().play('anvil');
      this.addLog(`⚒️ [대장간 단조 완성] [${newItem.name}] (${statDeltas.join(', ')}) 단조 완료!`, 'reward');
    }

    this.updateQuestObjective('Q_CRAFT_EQUIP', 0, 1);
    this.updateQuestObjective('Q_BUILD_FORGE', 1, 1);
    this.emit('inventoryUpdated', this.equipmentInventory);
    this.saveGame();
    return newItem;
  }

  /** ⚒️ 심연의 병기창 레벨에 따른 장비 최대 강화 한도 (Lv.3 미만: 0, Lv.3~4: 5강 돌파, Lv.5~6: 8강 해금, Lv.7~10: 10강 돌파) */
  public static getForgeMaxEnhanceLevel(level: number): number {
    if (level < 3) return 0;
    if (level < 5) return 5;
    if (level < 7) return 8;
    return 10;
  }

  /** 🧪 에테르 연금 공방 레벨에 따른 마도서/스킬 최대 강화 한도 (병기창과 동일: Lv.1: +3, Lv.2: +5, Lv.3~6: +7, Lv.7~10: +10) */
  public static getAlchemyMaxEnhanceLevel(level: number): number {
    if (level <= 0) return 0;
    if (level === 1) return 3;
    if (level === 2) return 5;
    if (level < 7) return 7;
    return 10;
  }

  public static getEnhanceRateInfo(currentLevel: number): {
    targetLevel: number;
    successRate: number;
    failKeepRate: number;
    failDropRate: number;
  } {
    const targetLevel = currentLevel + 1;
    switch (currentLevel) {
      case 0: return { targetLevel, successRate: 100, failKeepRate: 0,  failDropRate: 0  }; // +0 -> +1: 100% 안전
      case 1: return { targetLevel, successRate: 100, failKeepRate: 0,  failDropRate: 0  }; // +1 -> +2: 100% 안전
      case 2: return { targetLevel, successRate: 100, failKeepRate: 0,  failDropRate: 0  }; // +2 -> +3: 100% 안전
      case 3: return { targetLevel, successRate: 75,  failKeepRate: 20, failDropRate: 5  }; // +3 -> +4: 성공 75%, 유지 20%, 하락 5%
      case 4: return { targetLevel, successRate: 60,  failKeepRate: 25, failDropRate: 15 }; // +4 -> +5: 성공 60%, 유지 25%, 하락 15%
      case 5: return { targetLevel, successRate: 45,  failKeepRate: 30, failDropRate: 25 }; // +5 -> +6: 성공 45%, 유지 30%, 하락 25%
      case 6: return { targetLevel, successRate: 35,  failKeepRate: 30, failDropRate: 35 }; // +6 -> +7: 성공 35%, 유지 30%, 하락 35%
      case 7: return { targetLevel, successRate: 25,  failKeepRate: 35, failDropRate: 40 }; // +7 -> +8: 성공 25%, 유지 35%, 하락 40%
      case 8: return { targetLevel, successRate: 15,  failKeepRate: 35, failDropRate: 50 }; // +8 -> +9: 성공 15%, 유지 35%, 하락 50%
      case 9: return { targetLevel, successRate: 8,   failKeepRate: 32, failDropRate: 60 }; // +9 -> +10: 성공 8%, 유지 32%, 하락 60%
      default: return { targetLevel, successRate: 0,  failKeepRate: 100, failDropRate: 0 };
    }
  }

  public recalculateItemStats(item: EquipmentItem): void {
    item.stats = recalculateEquipmentStats(item, item.level, this.getForgeRecipes());
  }

  /** 장비 등급 및 레벨에 따른 단계별 강화 비용 및 소모 재료 계산 */
  public static getEquipmentEnhanceCost(item: EquipmentItem, discountMultiplier: number = 1): Partial<GameResources> {
    const level = item.level; // 0, 1, ..., 9
    const nextLevel = level + 1; // 1, 2, ..., 10
    const rarity: string = item.rarity || 'common';
    const isUnique = rarity === 'unique' || item.id.startsWith('boss_') || item.id.includes('unique');

    const cost: Partial<GameResources> = {};

    // 1. 기본 골드 & 철광석 (등급별 배율)
    let baseGoldPerLv = 250;
    let baseIronPerLv = 15;

    if (isUnique) {
      baseGoldPerLv = 1800;
      baseIronPerLv = 70;
    } else {
      switch (rarity) {
        case 'rare':
          baseGoldPerLv = 500;
          baseIronPerLv = 30;
          break;
        case 'epic':
          baseGoldPerLv = 1000;
          baseIronPerLv = 50;
          break;
        case 'legendary':
          baseGoldPerLv = 2800;
          baseIronPerLv = 95;
          break;
        default: // common
          baseGoldPerLv = 250;
          baseIronPerLv = 15;
          break;
      }
    }

    cost.gold = Math.max(1, Math.floor(nextLevel * baseGoldPerLv * discountMultiplier));
    cost.iron = Math.max(1, Math.floor(nextLevel * baseIronPerLv * discountMultiplier));

    // 2. 에테르 (마도 촉매)
    if (isUnique) {
      cost.ether = Math.max(10, Math.floor(nextLevel * 30 * discountMultiplier));
    } else {
      switch (rarity) {
        case 'common':
          if (nextLevel >= 4) {
            cost.ether = Math.max(2, Math.floor((nextLevel - 2) * 6 * discountMultiplier));
          }
          break;
        case 'rare':
          cost.ether = Math.max(4, Math.floor(nextLevel * 10 * discountMultiplier));
          break;
        case 'epic':
          cost.ether = Math.max(8, Math.floor(nextLevel * 20 * discountMultiplier));
          break;
        case 'legendary':
          cost.ether = Math.max(15, Math.floor(nextLevel * 45 * discountMultiplier));
          break;
      }
    }

    // 3. 마력 수정 (Crystal) & 공허 파편 (Void Shard)
    if (isUnique) {
      cost.crystal = Math.max(2, Math.floor(nextLevel * 3 * discountMultiplier));
      cost.void_shard = Math.max(1, Math.floor(nextLevel * 2 * discountMultiplier));
    } else {
      switch (rarity) {
        case 'common':
          if (nextLevel >= 7) {
            cost.crystal = Math.max(1, Math.floor((nextLevel - 5) * 1 * discountMultiplier));
          }
          break;
        case 'rare':
          if (nextLevel >= 4) {
            cost.crystal = Math.max(1, Math.floor((nextLevel - 2) * 2 * discountMultiplier));
          }
          if (nextLevel >= 7) {
            cost.void_shard = Math.max(1, Math.floor((nextLevel - 5) * 1 * discountMultiplier));
          }
          break;
        case 'epic':
          cost.crystal = Math.max(1, Math.floor(nextLevel * 2 * discountMultiplier));
          if (nextLevel >= 4) {
            cost.void_shard = Math.max(1, Math.floor((nextLevel - 2) * 2 * discountMultiplier));
          }
          break;
        case 'legendary':
          cost.crystal = Math.max(3, Math.floor(nextLevel * 4 * discountMultiplier));
          cost.void_shard = Math.max(2, Math.floor(nextLevel * 3 * discountMultiplier));
          break;
      }
    }

    // 4. 고유/에픽/전설 장비 및 상위 강화 단계 시 순수 인챈트석 (Pure Stones)
    if (isUnique) {
      if (nextLevel >= 5) {
        cost.pure_prefix_stone = 1;
      }
      if (nextLevel >= 8) {
        cost.pure_suffix_stone = 1;
      }
      if (nextLevel >= 10) {
        cost.pure_prefix_stone = 2;
        cost.pure_suffix_stone = 2;
      }
    } else if (rarity === 'legendary') {
      if (nextLevel >= 5) {
        cost.pure_prefix_stone = 1;
      }
      if (nextLevel >= 8) {
        cost.pure_suffix_stone = 1;
      }
      if (nextLevel >= 10) {
        cost.pure_prefix_stone = 2;
        cost.pure_suffix_stone = 2;
      }
    } else if (rarity === 'epic') {
      if (nextLevel >= 7) {
        cost.pure_prefix_stone = 1;
      }
      if (nextLevel >= 10) {
        cost.pure_suffix_stone = 1;
      }
    }

    return cost;
  }

  public enhanceEquipment(itemId: string, forcedOutcome?: 'success' | 'keep' | 'drop'): {
    success: boolean;
    result: 'success' | 'keep' | 'drop' | 'error';
    prevLevel: number;
    newLevel: number;
    error?: string;
  } {
    const item = this.equipmentInventory.find(e => e.id === itemId)
      || this.party.flatMap(h => Object.values(h.equipment || {})).find(e => e && e.id === itemId)
      || this.barracks.flatMap(h => Object.values(h.equipment || {})).find(e => e && e.id === itemId);
    if (!item) return { success: false, result: 'error', prevLevel: 0, newLevel: 0, error: '아이템을 찾을 수 없습니다.' };

    const unlocks = this.getForgeFeatureUnlocks();
    if (!unlocks.enhance.unlocked) {
      this.addLog(`강화 불가: 마도 대장간 Lv.${unlocks.enhance.reqLv} 이상 증축이 필요합니다!`, 'danger');
      return { success: false, result: 'error', prevLevel: item.level, newLevel: item.level, error: '대장간 증축 필요' };
    }

    const forgeLv = this.buildings['blacksmith']?.level || 0;
    const maxAllowed = GameManager.getForgeMaxEnhanceLevel(forgeLv);
    if (item.level >= maxAllowed) {
      if (item.level >= 10) {
        this.addLog(`[${item.name}]은(는) 이미 최고 강화 단계(+10)입니다!`, 'normal');
      } else {
        this.addLog(`강화 제한: 현재 심연의 병기창(Lv.${forgeLv})에서는 장비를 최대 +${maxAllowed}강까지만 강화할 수 있습니다! (병기창 증축 필요)`, 'danger');
      }
      return { success: false, result: 'error', prevLevel: item.level, newLevel: item.level, error: '최고 레벨 도달 또는 증축 필요' };
    }

    const mult = this.getForgeDiscountMultiplier();
    const cost = GameManager.getEquipmentEnhanceCost(item, mult);

    const missing: string[] = [];
    for (const [resKey, reqAmt] of Object.entries(cost)) {
      const curAmt = (this.resources as unknown as Record<string, number>)[resKey] || 0;
      if (curAmt < (reqAmt as number)) {
        const meta = GameManager.getResourceMeta(resKey as keyof GameResources);
        missing.push(`${meta.icon}${meta.name}(${curAmt}/${reqAmt})`);
      }
    }

    if (missing.length > 0) {
      SoundManager.getInstance().play('forge_fail');
      this.addLog(`강화 실패: 필요 재화가 부족합니다! [부족: ${missing.join(', ')}]`, 'danger');
      return { success: false, result: 'error', prevLevel: item.level, newLevel: item.level, error: '재료 부족' };
    }

    for (const [resKey, amt] of Object.entries(cost)) {
      this.modifyResource(resKey as keyof GameResources, -(amt as number));
    }

    const rateInfo = GameManager.getEnhanceRateInfo(item.level);
    const prevLv = item.level;
    const roll = Math.random() * 100;
    const determinedOutcome: 'success' | 'keep' | 'drop' = forcedOutcome || (
      roll < rateInfo.successRate ? 'success'
      : (roll < rateInfo.successRate + rateInfo.failKeepRate ? 'keep' : 'drop')
    );

    if (determinedOutcome === 'success') {
      item.level += 1;
      this.recalculateItemStats(item);
      item.name = GameManager.buildEquipmentName(item);

      let unlockMsg = '';
      if (item.level === 3) unlockMsg = ' ➔ ✨ [접두어 인챈트] 슬롯이 해금되었습니다!';
      if (item.level === 7) unlockMsg = ' ➔ 🔮 [접미어 인챈트] 슬롯이 해금되었습니다!';

      SoundManager.getInstance().play('forge_success');
      this.addLog(`✨ [장비 강화 성공!] (성공률 ${rateInfo.successRate}%) [${item.name}]로 강화되었습니다!${unlockMsg}`, 'reward');

      // 📜 장비 강화 연계 퀘스트 진행도 갱신
      if (item.level >= 3) {
        this.updateQuestObjective('Q_EQUIPMENT_ENHANCE', 0, 1);
        this.activateQuest('Q_EQUIPMENT_ENHANCE_02');
      }
      if (item.level >= 5) {
        this.updateQuestObjective('Q_EQUIPMENT_ENHANCE_02', 0, 1);
      }
      this.reconcileEquipment();
      this.emit('inventoryUpdated', this.equipmentInventory);
      this.saveGame();
      return { success: true, result: 'success', prevLevel: prevLv, newLevel: item.level };
    } else if (determinedOutcome === 'keep') {
      SoundManager.getInstance().play('forge_fail');
      this.addLog(`⚠️ [강화 실패] 강화에 실패하여 재료만 소모되었습니다. (현재 수치 +${item.level} 유지)`, 'danger');
      this.reconcileEquipment();
      this.emit('inventoryUpdated', this.equipmentInventory);
      this.saveGame();
      return { success: false, result: 'keep', prevLevel: prevLv, newLevel: item.level };
    } else {
      item.level = Math.max(0, item.level - 1);
      this.recalculateItemStats(item);
      item.name = GameManager.buildEquipmentName(item);

      SoundManager.getInstance().play('forge_fail');
      this.addLog(`💥 [강화 대실패!] 강화 충격으로 인해 강화 단계가 1단계 하락했습니다! (+${prevLv} ➔ +${item.level})`, 'danger');
      this.reconcileEquipment();
      this.emit('inventoryUpdated', this.equipmentInventory);
      this.saveGame();
      return { success: false, result: 'drop', prevLevel: prevLv, newLevel: item.level };
    }
  }

  /**
   * 🌟 병기창 10레벨 전용: 장비 각성 (Awakening)
   * - 조건: 병기창 Lv.10, 대상 장비 +10강 도달, 각성 단계 3단계 미만 (최대 3회 각성)
   * - 성공 확률: 20%
   * - 성공 시: 현재 +10강의 모든 능력치(접두/접미 제외 순수 스탯)를 새로운 기본 스탯(baseStats)으로 영구 보존하고 강화 단계를 +0으로 초기화
   * - 실패 시: 무기 영구 파괴 (소멸)
   */
  public awakenEquipment(itemId: string): {
    success: boolean;
    destroyed: boolean;
    prevLevel: number;
    newLevel: number;
    prevAwakeningLevel: number;
    newAwakeningLevel: number;
    error?: string;
  } {
    const item = this.equipmentInventory.find(e => e.id === itemId)
      || this.party.flatMap(h => Object.values(h.equipment || {})).find(e => e && e.id === itemId)
      || this.barracks.flatMap(h => Object.values(h.equipment || {})).find(e => e && e.id === itemId);
    if (!item) return { success: false, destroyed: false, prevLevel: 0, newLevel: 0, prevAwakeningLevel: 0, newAwakeningLevel: 0, error: '아이템을 찾을 수 없습니다.' };

    const forgeLv = this.buildings['blacksmith']?.level || 0;
    if (forgeLv < 10) {
      this.addLog('장비 각성 불가: 마도 병기창 Lv.10 이상 증축이 필요합니다!', 'danger');
      return { success: false, destroyed: false, prevLevel: item.level, newLevel: item.level, prevAwakeningLevel: item.awakeningLevel || 0, newAwakeningLevel: item.awakeningLevel || 0, error: '병기창 10레벨 필요' };
    }

    if (item.level < 10) {
      this.addLog(`각성 불가: [${item.name}]은(는) +10강에 도달해야 각성을 시도할 수 있습니다!`, 'danger');
      return { success: false, destroyed: false, prevLevel: item.level, newLevel: item.level, prevAwakeningLevel: item.awakeningLevel || 0, newAwakeningLevel: item.awakeningLevel || 0, error: '10강 미달' };
    }

    const currentAwk = item.awakeningLevel || 0;
    if (currentAwk >= 3) {
      this.addLog(`각성 불가: [${item.name}]은(는) 이미 최고 각성 단계(★3단계 각성)에 도달했습니다!`, 'normal');
      return { success: false, destroyed: false, prevLevel: item.level, newLevel: item.level, prevAwakeningLevel: currentAwk, newAwakeningLevel: currentAwk, error: '최대 각성 도달' };
    }

    const mult = this.getForgeDiscountMultiplier();
    const cost = GameManager.getEquipmentEnhanceCost(item, mult);

    const missing: string[] = [];
    for (const [resKey, reqAmt] of Object.entries(cost)) {
      const curAmt = (this.resources as unknown as Record<string, number>)[resKey] || 0;
      if (curAmt < (reqAmt as number)) {
        const meta = GameManager.getResourceMeta(resKey as keyof GameResources);
        missing.push(`${meta.icon}${meta.name}(${curAmt}/${reqAmt})`);
      }
    }

    if (missing.length > 0) {
      SoundManager.getInstance().play('forge_fail');
      this.addLog(`각성 실패: 필요 재화가 부족합니다! [부족: ${missing.join(', ')}]`, 'danger');
      return { success: false, destroyed: false, prevLevel: item.level, newLevel: item.level, prevAwakeningLevel: currentAwk, newAwakeningLevel: currentAwk, error: '재료 부족' };
    }

    for (const [resKey, amt] of Object.entries(cost)) {
      this.modifyResource(resKey as keyof GameResources, -(amt as number));
    }

    const prevAwk = currentAwk;
    const roll = Math.random() * 100;
    const isSuccess = roll < 20;

    if (isSuccess) {
      // 🌟 각성 성공: 현재 스탯을 영구 기본 스탯으로 보존하고 level을 0으로 리셋!
      const pureCurrent: NonNullable<EquipmentItem['stats']> = { ...item.stats };
      if (item.prefix?.stats) {
        Object.entries(item.prefix.stats).forEach(([k, v]) => {
          const key = k as keyof NonNullable<EquipmentItem['stats']>;
          if (typeof v === 'number' && pureCurrent[key] !== undefined) {
            pureCurrent[key] = (pureCurrent[key] || 0) - v;
          }
        });
      }
      if (item.suffix?.stats) {
        Object.entries(item.suffix.stats).forEach(([k, v]) => {
          const key = k as keyof NonNullable<EquipmentItem['stats']>;
          if (typeof v === 'number' && pureCurrent[key] !== undefined) {
            pureCurrent[key] = (pureCurrent[key] || 0) - v;
          }
        });
      }

      item.baseStats = { ...pureCurrent };
      item.level = 0;
      item.awakeningLevel = prevAwk + 1;
      item.stats = recalculateEquipmentStats(item, 0, this.getForgeRecipes());
      item.name = GameManager.buildEquipmentName(item);

      SoundManager.getInstance().play('forge_success');
      this.addLog(`🌟✨ [장비 각성 대성공!] (확률 20%) [${item.name}]이(가) ★${item.awakeningLevel}단계 각성에 도달했습니다! 누적된 막강한 스탯이 기본 스탯으로 영구 보존되며, 강화 단계가 +0으로 초기화되었습니다! (다시 +10강까지 재강화 가능)`, 'reward');

      this.reconcileEquipment();
      this.emit('inventoryUpdated', this.equipmentInventory);
      this.emit('partyUpdated', this.party);
      this.saveGame();
      return {
        success: true,
        destroyed: false,
        prevLevel: 10,
        newLevel: 0,
        prevAwakeningLevel: prevAwk,
        newAwakeningLevel: item.awakeningLevel
      };
    } else {
      // 💥 각성 실패: 무기 파괴 (인벤토리 및 장착 목록에서 영구 소멸)
      const destroyedItemName = item.name;
      for (const hero of [...this.party, ...this.barracks]) {
        if (hero.equipment) {
          for (const [slotKey, eq] of Object.entries(hero.equipment)) {
            if (eq && eq.id === item.id) {
              delete (hero.equipment as Record<string, EquipmentItem | undefined>)[slotKey];
            }
          }
        }
      }
      this.equipmentInventory = this.equipmentInventory.filter(e => e.id !== item.id);

      SoundManager.getInstance().play('forge_fail');
      this.addLog(`💥 [장비 각성 실패 - 무기 파괴!] 각성의 강력한 심연 마력을 견디지 못하고 [${destroyedItemName}]이(가) 산산조각나 영구 파괴되었습니다...`, 'danger');

      this.reconcileEquipment();
      this.emit('inventoryUpdated', this.equipmentInventory);
      this.emit('partyUpdated', this.party);
      this.saveGame();
      return {
        success: false,
        destroyed: true,
        prevLevel: 10,
        newLevel: 0,
        prevAwakeningLevel: prevAwk,
        newAwakeningLevel: prevAwk,
        error: '장비 파괴됨'
      };
    }
  }

  public enchantEquipment(itemId: string, type: 'prefix' | 'suffix', isPure = false): boolean {
    const item = this.equipmentInventory.find(e => e.id === itemId);
    if (!item) return false;

    if (type === 'prefix' && item.level < 3) {
      this.addLog(`인챈트 불가: [접두어] 인챈트는 +3강 이상 장비에만 가능합니다! (현재 +${item.level})`, 'danger');
      return false;
    }
    if (type === 'suffix' && item.level < 7) {
      this.addLog(`인챈트 불가: [접미어] 인챈트는 +7강 이상 장비에만 가능합니다! (현재 +${item.level})`, 'danger');
      return false;
    }

    const forgeLv = (this.buildings as unknown as Record<string, { level?: number }>)['blacksmith']?.level || (this.buildings as unknown as Record<string, { level?: number }>)['forge']?.level || 1;
    const unlocks = this.getForgeFeatureUnlocks();
    if (!unlocks.enchant.unlocked) {
      this.addLog(`인챈트 불가: 마도 대장간 Lv.${unlocks.enchant.reqLv} 이상 증축이 필요합니다!`, 'danger');
      return false;
    }

    const mult = this.getForgeDiscountMultiplier();
    const stoneCost = getEnchantStoneCost(item.rarity);
    const { gold: goldCost, ether: etherCost } = getEnchantResourceCosts(isPure, mult);

    const stoneKey = type === 'prefix'
      ? (isPure ? 'pure_prefix_stone' : 'prefix_stone')
      : (isPure ? 'pure_suffix_stone' : 'suffix_stone');
    const stoneName = type === 'prefix'
      ? (isPure ? '순수한 접두석' : '접두석')
      : (isPure ? '순수한 접미석' : '접미석');

    if ((this.resources[stoneKey] || 0) < stoneCost) {
      this.addLog(`인챈트 실패: [${stoneName}]이(가) 부족합니다! (${this.resources[stoneKey] || 0}/${stoneCost}개 필요)`, 'danger');
      return false;
    }
    if (this.resources.gold < goldCost || this.resources.ether < etherCost) {
      this.addLog(`인챈트 실패: 골드(${goldCost}) 또는 에테르(${etherCost})가 부족합니다!`, 'danger');
      return false;
    }

    // 재화 및 인챈트석 소모
    this.modifyResource(stoneKey, -stoneCost);
    this.modifyResource('gold', -goldCost);
    this.modifyResource('ether', -etherCost);

    // 성공 확률 판정 (기본 20%, 병기창 Lv.6부터 레벨당 +5% 증가, 순수석 사용 시 50% 반감)
    const successRate = getEnchantSuccessRate(forgeLv, isPure);
    const roll = Math.random() * 100;
    const isSuccess = roll < successRate;

    if (!isSuccess) {
      this.addLog(`💨 [마도 인챈트 실패] 마력 주입이 흩어져 인챈트에 실패했습니다. (성공 확률: ${successRate}%, 장비 손상 없음)`, 'danger');
      this.emit('inventoryUpdated', this.equipmentInventory);
      this.saveGame();
      return false;
    }

    // 슬롯 및 등급에 맞는 인챈트 옵션 풀에서 추첨
    const wType = item.slot === 'weapon' ? (item.weaponType || detectWeaponType(item)) : undefined;
    const candidates = getEnchantCandidates(item.slot, type, isPure, wType);
    const chosen = Phaser.Utils.Array.GetRandom(candidates);
    if (!chosen) return false;

    if (type === 'prefix') {
      item.prefix = chosen;
    } else {
      item.suffix = chosen;
    }

    sanitizeEquipmentEnchantSkills(item);
    item.name = GameManager.buildEquipmentName(item);

    const hasSkill = item.slot === 'weapon' && item.prefix?.grantedSkill;
    const skillNotice = hasSkill ? ` | 기본 공격 대체 고유스킬 [${item.prefix!.grantedSkill!.name}] 획득!` : '';
    this.addLog(`🌟 [마도 인챈트 대성공!] (성공 확률: ${successRate}%) [${item.name} +${item.level}]에 [${chosen.name}] 부여! (${item.prefix?.description || item.suffix?.description || chosen.description})${skillNotice}`, 'reward');
    this.reconcileEquipment();
    this.emit('inventoryUpdated', this.equipmentInventory);
    this.saveGame();
    return true;
  }

  public cleanseEnchant(itemId: string): boolean {
    const item = this.equipmentInventory.find(e => e.id === itemId);
    if (!item) return false;
    if (!item.prefix && !item.suffix) {
      this.addLog(`[${item.name}]에는 부여된 인챈트가 없습니다.`, 'normal');
      return false;
    }

    if (this.resources.ether < 50) {
      this.addLog('초기화 실패: 에테르(50)가 부족합니다!', 'danger');
      return false;
    }
    this.modifyResource('ether', -50);

    item.prefix = undefined;
    item.suffix = undefined;
    item.name = item.baseName || item.name;

    this.addLog(`✨ [인챈트 초기화 완료] [${item.name}]의 모든 인챈트가 초기화되었습니다.`, 'story');
    this.reconcileEquipment();
    this.emit('inventoryUpdated', this.equipmentInventory);
    this.saveGame();
    return true;
  }

  public getHeroEffectiveStats(hero: Mercenary): {
    atk: number;
    def: number;
    spd: number;
    luck: number;
    maxHp: number;
    maxMp: number;
    damageBonus: number;
    defPenetration: number;
    drainPercent: number;
    critDmg: number;
  } {
    // 🌟 베이스 스탯은 calcHeroStatsForClassAndLevel로부터 순수하게 산출 (중복 가산 방지)
    const base = GameManager.calcHeroStatsForClassAndLevel(
      hero.classId,
      hero.level,
      hero.grade,
      hero.trait || hero.title,
      hero.promotionBonuses,
      hero.awakeningBonuses
    );
    let atk = base.stats.atk;
    let def = base.stats.def;
    let spd = base.stats.spd;
    let luck = base.stats.luck;
    let maxHp = base.maxHp;
    let maxMp = base.maxMp;
    let damageBonus = 0;
    let defPenetration = 0;
    let drainPercent = 0;
    let critDmg = 1.5; // 기본 치명타 배율 150%

    // 1. 장비 스탯 & 인챈트 스탯 가산 (클래스 호환성 검증)
    Object.values(hero.equipment || {}).forEach(eq => {
      if (!eq) return;

      const isComp = this.isEquipmentCompatible(hero.classId, eq);
      const mult = isComp ? 1.0 : 0.5; // 비호환 장비 스탯 50% 반감
      if (!isComp) {
        spd = Math.max(1, spd - 3); // 비호환 페널티: 행동속도 -3
      }

      if (eq.stats.atk) atk += Math.floor(eq.stats.atk * mult);
      if (eq.stats.def) def += Math.floor(eq.stats.def * mult);
      if (eq.stats.spd) spd += Math.floor(eq.stats.spd * mult);
      if (eq.stats.luck) luck += Math.floor(eq.stats.luck * mult);
      if (eq.stats.hp) maxHp += Math.floor(eq.stats.hp * mult);
      if (eq.stats.mp) maxMp += Math.floor(eq.stats.mp * mult);

      if (eq.prefix?.stats) {
        if (eq.prefix.stats.atk) atk += Math.floor(eq.prefix.stats.atk * mult);
        if (eq.prefix.stats.def) def += Math.floor(eq.prefix.stats.def * mult);
        if (eq.prefix.stats.spd) spd += Math.floor(eq.prefix.stats.spd * mult);
        if (eq.prefix.stats.luck) luck += Math.floor(eq.prefix.stats.luck * mult);
        if (eq.prefix.stats.hp) maxHp += Math.floor(eq.prefix.stats.hp * mult);
        if (eq.prefix.stats.mp) maxMp += Math.floor(eq.prefix.stats.mp * mult);
        if (eq.prefix.stats.damageBonus) damageBonus += eq.prefix.stats.damageBonus * mult;
        if (eq.prefix.stats.defPenetration) defPenetration += eq.prefix.stats.defPenetration * mult;
        if (eq.prefix.stats.drainPercent) drainPercent += eq.prefix.stats.drainPercent * mult;
      }

      if (eq.suffix?.stats) {
        if (eq.suffix.stats.atk) atk += Math.floor(eq.suffix.stats.atk * mult);
        if (eq.suffix.stats.def) def += Math.floor(eq.suffix.stats.def * mult);
        if (eq.suffix.stats.spd) spd += Math.floor(eq.suffix.stats.spd * mult);
        if (eq.suffix.stats.luck) luck += Math.floor(eq.suffix.stats.luck * mult);
        if (eq.suffix.stats.hp) maxHp += Math.floor(eq.suffix.stats.hp * mult);
        if (eq.suffix.stats.mp) maxMp += Math.floor(eq.suffix.stats.mp * mult);
        if (eq.suffix.stats.damageBonus) damageBonus += eq.suffix.stats.damageBonus * mult;
        if (eq.suffix.stats.defPenetration) defPenetration += eq.suffix.stats.defPenetration * mult;
        if (eq.suffix.stats.drainPercent) drainPercent += eq.suffix.stats.drainPercent * mult;
      }
    });

    // 💍 [악세사리 강화 고유 효과]: 목걸이 = 1강당 1% 흡혈, 부적 = 1강당 올스탯 +1%
    const heroAcc = hero.equipment?.accessory;
    if (heroAcc && heroAcc.enhanceLevel && heroAcc.enhanceLevel > 0) {
      const accType = detectAccessoryType(heroAcc);
      if (accType === 'necklace') {
        drainPercent += heroAcc.enhanceLevel * 1.0; // 목걸이: 1강당 1% 흡혈 (10강 = 10%)
      } else if (accType === 'amulet') {
        const amuletMult = 1 + (heroAcc.enhanceLevel * 0.01); // 부적: 1강당 올스탯 +1% (10강 = 10%)
        atk = Math.floor(atk * amuletMult);
        def = Math.floor(def * amuletMult);
        spd = Math.floor(spd * amuletMult);
        luck = Math.floor(luck * amuletMult);
        maxHp = Math.floor(maxHp * amuletMult);
        maxMp = Math.floor(maxMp * amuletMult);
      }
    }

    // 2. 파티 출전 중인 영웅에게만 활성 원정대 시너지 버프 적용
    const inParty = this.party && this.party.some(p => p && p.id === hero.id);
    if (inParty) {
      const synergies = this.getActiveSynergies();
      for (const syn of synergies) {
        if (!syn || !syn.buffs) continue;
        if (syn.buffs.atkBonus) atk = Math.floor(atk * syn.buffs.atkBonus);
        if (syn.buffs.defBonus) def = Math.floor(def * syn.buffs.defBonus);
        if (syn.buffs.spdBonus) spd = Math.floor(spd * syn.buffs.spdBonus);
        if (syn.buffs.maxHpBonus) maxHp = Math.floor(maxHp * syn.buffs.maxHpBonus);
        if (syn.buffs.luckBonus) luck += syn.buffs.luckBonus;
        if (syn.buffs.critRateBonus) luck += syn.buffs.critRateBonus;
        if (syn.buffs.flatAtkBonus) atk += syn.buffs.flatAtkBonus;
        if (syn.buffs.flatDefBonus) def += syn.buffs.flatDefBonus;
        if (syn.buffs.flatSpdBonus) spd += syn.buffs.flatSpdBonus;
        if (syn.buffs.critDmgBonus) critDmg += syn.buffs.critDmgBonus;
        if (syn.buffs.drainBonus) drainPercent += syn.buffs.drainBonus;
        if (syn.buffs.defPenetrationBonus) defPenetration += syn.buffs.defPenetrationBonus;
        if (syn.buffs.allStatsBonus) {
          if (syn.buffs.allStatsBonus > 1 && syn.buffs.allStatsBonus < 2) {
            atk = Math.floor(atk * syn.buffs.allStatsBonus);
            def = Math.floor(def * syn.buffs.allStatsBonus);
            spd = Math.floor(spd * syn.buffs.allStatsBonus);
            luck = Math.floor(luck * syn.buffs.allStatsBonus);
            maxHp = Math.floor(maxHp * syn.buffs.allStatsBonus);
            maxMp = Math.floor(maxMp * syn.buffs.allStatsBonus);
          } else {
            atk += syn.buffs.allStatsBonus;
            def += syn.buffs.allStatsBonus;
            spd += syn.buffs.allStatsBonus;
            luck += syn.buffs.allStatsBonus;
            maxHp += syn.buffs.allStatsBonus;
            maxMp += syn.buffs.allStatsBonus;
          }
        }
      }

      // 3. 파티 동료와의 최고 유대(Bond) 단계에 따른 영웅 스탯 보너스 적용
      if (this.party.length > 1) {
        const maxBondWithParty = this.party
          .filter(p => p && p.id !== hero.id)
          .reduce((max, p) => Math.max(max, this.getBond(hero.id, p.id)), 0);

        if (maxBondWithParty >= 100) { // Lv.5 영혼의 결속 (공/방 +15%)
          atk = Math.floor(atk * 1.15);
          def = Math.floor(def * 1.15);
        } else if (maxBondWithParty >= 80) { // Lv.4 사선의 맹세 (전능력치 +10%)
          atk = Math.floor(atk * 1.10);
          def = Math.floor(def * 1.10);
          spd = Math.floor(spd * 1.10);
          luck = Math.floor(luck * 1.10);
          maxHp = Math.floor(maxHp * 1.10);
          maxMp = Math.floor(maxMp * 1.10);
        } else if (maxBondWithParty >= 60) { // Lv.3 굳건한 신뢰 (치명타/행운 +8)
          luck += 8;
        } else if (maxBondWithParty >= 20) { // Lv.1 동료애 (최대 HP +5%)
          maxHp = Math.floor(maxHp * 1.05);
        }
      }

      // 4. 소외감(Alienation) 페널티: 다른 2명은 친하고 본인은 고립된 경우 모든 능력치 -10%
      if (this.isHeroAlienated(hero.id)) {
        atk = Math.floor(atk * 0.90);
        def = Math.floor(def * 0.90);
        spd = Math.max(1, Math.floor(spd * 0.90));
        luck = Math.max(0, Math.floor(luck * 0.90));
        maxHp = Math.max(1, Math.floor(maxHp * 0.90));
        maxMp = Math.max(0, Math.floor(maxMp * 0.90));
      }
    }

    // 5. 📜 심연의 백과(Codex) 완성 영구 패시브 보너스 합산
    const codex = this.getCodexBonus();
    if (codex.atk > 0) atk += codex.atk;
    if (codex.def > 0) def += codex.def;
    if (codex.spd > 0) spd += codex.spd;
    if (codex.luck > 0) luck += codex.luck;
    if (codex.hp > 0) maxHp += codex.hp;
    if (codex.mp > 0) maxMp += codex.mp;
    if (codex.allDmgPct > 0) damageBonus += codex.allDmgPct;
    if (codex.allStatsBonus && codex.allStatsBonus > 0) {
      atk += codex.allStatsBonus;
      def += codex.allStatsBonus;
      spd += codex.allStatsBonus;
      luck += codex.allStatsBonus;
      maxHp += codex.allStatsBonus;
      maxMp += codex.allStatsBonus;
    }
    // 6. 👑 보스 유니크 3세트 완성 특별 세트 보너스 적용
    const bossSet = getHeroEquippedBossSet(hero);
    if (bossSet) {
      if (bossSet.effectType === 'buff_def_crit') {
        def = Math.floor(def * 1.15);
        luck += 10;
      } else if (bossSet.effectType === 'vampirism') {
        drainPercent += 12;
      } else if (bossSet.effectType === 'mana_regen_spd') {
        spd = Math.floor(spd * 1.20);
      } else if (bossSet.effectType === 'skill_dmg_pen') {
        damageBonus += 25;
        defPenetration += 20;
      } else if (bossSet.effectType === 'bloodlust') {
        if (hero.currentHp <= hero.maxHp * 0.5) {
          atk = Math.floor(atk * 1.35);
          drainPercent += 20;
        }
      } else if (bossSet.effectType === 'dmg_reduction') {
        def = Math.floor(def * 1.20);
      } else if (bossSet.effectType === 'asmodeus_wrath') {
        atk = Math.floor(atk * 1.30);
        def = Math.floor(def * 1.30);
        spd = Math.floor(spd * 1.30);
        luck = Math.floor(luck * 1.30);
        maxHp = Math.floor(maxHp * 1.30);
        maxMp = Math.floor(maxMp * 1.30);
      }
    }

    return {
      atk: Math.round(atk),
      def: Math.round(def),
      spd: Math.round(spd),
      luck: Math.round(luck * 10) / 10,
      maxHp: Math.round(maxHp),
      maxMp: Math.round(maxMp),
      damageBonus: Math.round(damageBonus * 100) / 100,
      defPenetration: Math.round(defPenetration * 10) / 10,
      drainPercent: Math.round(drainPercent * 10) / 10,
      critDmg: Math.round(critDmg * 100) / 100
    };
  }

  /** 개별 영웅의 스탯을 유효 스탯(Effective Stats)과 완벽 동기화 */
  public syncHeroStats(hero: Mercenary): void {
    if (!hero) return;
    const prevMaxHp = hero.maxHp || 0;
    const prevMaxMp = hero.maxMp || 0;
    const eff = this.getHeroEffectiveStats(hero);

    // 이전 최대치와 동일했던 풀피 상태였다면 장비 장착 등으로 늘어난 새 최대치로 동반 승급
    if (prevMaxHp > 0 && hero.currentHp >= prevMaxHp && eff.maxHp > prevMaxHp) {
      hero.currentHp = eff.maxHp;
    }
    if (prevMaxMp > 0 && hero.currentMp >= prevMaxMp && eff.maxMp > prevMaxMp) {
      hero.currentMp = eff.maxMp;
    }

    hero.maxHp = eff.maxHp;
    hero.maxMp = eff.maxMp;
    hero.stats.atk = eff.atk;
    hero.stats.def = eff.def;
    hero.stats.spd = eff.spd;
    hero.stats.luck = eff.luck;

    // 최대 한도 초과 방지 클램핑
    if (hero.currentHp > hero.maxHp) hero.currentHp = hero.maxHp;
    if (hero.currentMp > hero.maxMp) hero.currentMp = hero.maxMp;
  }

  /** 모든 병영 및 파티 영웅의 스탯 일괄 동기화 */
  public syncAllHeroesStats(): void {
    if (Array.isArray(this.barracks)) {
      this.barracks.forEach(h => this.syncHeroStats(h));
    }
    if (Array.isArray(this.party)) {
      this.party.forEach(h => this.syncHeroStats(h));
    }
  }

  /** 행운 및 층수 기반 치명타 확률 계산 (기본 max 90%, 층당 -7% 페널티 + 심연의 백과 보너스) */
  public getCritChance(luck: number, floor: number = this.dungeonFloor || 1): number {
    const baseCrit = Math.min(90, luck * 0.375);
    const floorPenaltyRatio = (floor * 7) / 100;
    const codexCrit = this.getCodexBonus?.()?.critRate || 0;
    return Math.max(0, baseCrit * (1 - floorPenaltyRatio) + codexCrit);
  }

  /** 행운 기반 회피 보정 수치 계산 (최대 70% 캡) */
  public static getEvasionModifier(luck: number): number {
    return Math.min(70, luck * 0.3);
  }

  public getEvasionModifier(luck: number): number {
    return GameManager.getEvasionModifier(luck);
  }

  // ================= 장비 클래스 적합성 & 인계/장착 로직 =================
  /** 장비가 해당 클래스에 적합한지 검사 (악세사리는 전 클래스 공용) */
  // ================= 마도 대장간 레벨 할인 & 순차 해금 시스템 =================
  /** 대장간 레벨에 따른 비용 할인율 (레벨당 3% 할인, 최대 50%) */
  public getForgeDiscountMultiplier(): number {
    const forgeLv = this.buildings['blacksmith']?.level || 1;
    const discountPct = Math.min(50, forgeLv * 3);
    return Math.max(0.5, (100 - discountPct) / 100);
  }

  /** 대장간 기능별 해금 최소 레벨 (매 3레벨마다 해금) */
  public getForgeFeatureUnlocks(): {
    craft: { reqLv: number; unlocked: boolean };
    enhance: { reqLv: number; unlocked: boolean };
    enchant: { reqLv: number; unlocked: boolean };
    curse: { reqLv: number; unlocked: boolean };
  } {
    const forgeLv = this.buildings['blacksmith']?.level || 0;
    return {
      craft:   { reqLv: 1, unlocked: forgeLv >= 1 },
      enhance: { reqLv: 3, unlocked: forgeLv >= 3 },
      enchant: { reqLv: 6, unlocked: forgeLv >= 6 },
      curse:   { reqLv: 1, unlocked: forgeLv >= 1 },
    };
  }

  public isEquipmentCompatible(classId: string, item: EquipmentItem): boolean {
    if (!item) return false;

    // 장신구: 기본적으로 전원 호환 (all)
    if (item.slot === 'accessory') {
      if (item.affinity && item.affinity.length > 0) {
        if (item.affinity.includes('all')) return true;
        const c = CHARACTER_CLASSES[classId];
        const role = c?.role || 'tank';
        return item.affinity.includes(role) || item.affinity.includes(classId);
      }
      return true;
    }

    const c = CHARACTER_CLASSES[classId];
    const role = c?.role || 'tank';

    // 1. 하이브리드 클래스(전투 사제/성전의 심판관/세라픽 인퀴지터 등) 및 전직 클래스 호환 매핑
    // - crusader_lord, war_priest, seraphic_inquisitor: role은 'healer'이나 검/창/해머/판금갑옷 착용 가능한 신성 딜탱
    const isHolyCrusader = classId === 'war_priest' || classId === 'crusader_lord' || classId === 'seraphic_inquisitor';
    const isPriest = ['acolyte', 'bishop', 'war_priest', 'high_saintess', 'crusader_lord', 'seraphic_inquisitor'].includes(classId) || role === 'healer';
    const isRogue = ['rogue', 'assassin', 'shadow_stalker', 'shadow_phantom', 'duelist', 'blade_dancer', 'reaper', 'void_strider'].includes(classId);
    const isGunner = ['gunner', 'tactical_gunner', 'aether_gun_meister', 'sharpshooter', 'ghost_sniper', 'sniper', 'heavy_gunner', 'artificer', 'omega_deadeye'].includes(classId) || role === 'gunner';

    const baseName = item.baseName || item.name || '';
    const detectedWeapon = item.slot === 'weapon' ? (item.weaponType || detectWeaponType(item) || detectWeaponType(baseName)) : undefined;

    // 🚫 [무기 계열별 엄격 배제 규칙]: 명시적 친화도보다 우선 적용
    if (item.slot === 'weapon') {
      // 1. 검 계열: 사제 계열(성직자/힐러) 완전 제외
      if (detectedWeapon === 'sword' && isPriest) return false;
      // 2. 총 계열: 도적 계열 완전 제외
      if (detectedWeapon === 'gun' && isRogue) return false;
      // 3. 활 계열: 거너 계열 완전 제외
      if (detectedWeapon === 'bow' && isGunner) return false;
    }

    // 2. 명시적 affinity 검사
    if (item.affinity && item.affinity.length > 0) {
      if (item.affinity.includes('all')) return true;
      if (item.affinity.includes(role) || item.affinity.includes(classId)) return true;
      // 전열 성전사(war_priest, crusader_lord, seraphic_inquisitor)는 tank/berserker/dealer_phy 장비 친화도 호환 허용 (단, 검은 위에서 제외됨)
      if (isHolyCrusader && (item.affinity.includes('tank') || item.affinity.includes('berserker') || item.affinity.includes('dealer_phy'))) {
        return true;
      }
      // tank/berserker 상호 호환 판금/무기 허용
      if ((role === 'tank' && item.affinity.includes('berserker')) || (role === 'berserker' && item.affinity.includes('tank'))) {
        return true;
      }
      return false;
    }

    if (item.slot === 'weapon') {
      // 1. 검 / 대검 / 도 (sword)
      if (detectedWeapon === 'sword' || ['검', '대검', '명검', '신화검', '기사검', '결전검', '심판검', '파멸검', '마검'].some(k => baseName.includes(k))) {
        if (isPriest) return false;
        return ['tank', 'berserker', 'dealer_phy'].includes(role);
      }

      // 2. 창 / 해머 / 도끼 / 둔기 / 월도 (spear)
      if (detectedWeapon === 'spear' || ['창', '장창', '기병창', '극창', '신창', '트라이던트', '해머', '망치', '메이스', '철퇴', '모닝스타', '도끼', '둔기', '월도'].some(k => baseName.includes(k))) {
        if (['tank', 'berserker'].includes(role) || isHolyCrusader) return true;
        return ['squire', 'paladin', 'guardian', 'aegis_valkyrie', 'fortress', 'vanguard', 'berserker', 'valhalla_blade', 'warlord', 'iron_marshal', 'crusader_lord', 'war_priest', 'aegis_bastion', 'valhalla_warlord', 'seraphic_inquisitor'].includes(classId);
      }

      // 3. 마총 / 총 / 포 / 속사총 / 저격총 / 분쇄포 (gun)
      const isGun = detectedWeapon === 'gun' ||
        ['마총', '총', '포', '속사', '저격', '파멸포', '분쇄포', '라이플', '권총', '캐논'].some(k => baseName.includes(k));
      if (isGun) {
        if (isRogue) return false;
        return isGunner;
      }

      // 4. 활 / 궁 (bow)
      const isBow = detectedWeapon === 'bow' ||
        ['활', '궁', '장궁', '강궁', '합성궁', '대궁', '성운궁', '환영궁'].some(k => baseName.includes(k));
      if (isBow) {
        if (isGunner) return false;
        return isRogue || role === 'dealer_phy';
      }

      // 5. 단검 / 비수 / 낫 / 도 (dagger)
      const isDagger = detectedWeapon === 'dagger' ||
        ['단검', '비수', '낫', '사신 낫', '절단', '암살', '그림자', '유령도', '차원도', '단도'].some(k => baseName.includes(k));
      if (isDagger) {
        if (['dealer_phy', 'berserker'].includes(role)) return true;
        return ['rogue', 'assassin', 'shadow_stalker', 'shadow_phantom', 'duelist', 'blade_dancer', 'reaper', 'void_strider'].includes(classId);
      }

      // 6. 지팡이 / 봉 (staff)
      const isStaff = detectedWeapon === 'staff' ||
        ['지팡이', '봉', '마도봉', '천상봉', '마력봉', '로드', '완드'].some(k => baseName.includes(k));
      if (isStaff) {
        if (['dealer_mag', 'healer'].includes(role)) return true;
        return ['apprentice', 'mage', 'archmage', 'elementalist', 'arcane_scholar', 'calamity_mage', 'chronomancer', 'acolyte', 'bishop', 'war_priest', 'high_saintess', 'crusader_lord', 'chrono_archon', 'seraphic_inquisitor'].includes(classId);
      }

      return true;
    }

    if (item.slot === 'armor') {
      // 판금 / 중갑 / 갑주 / 흉갑 / 성역갑
      if (['판금', '중갑', '갑주', '흉갑', '투구', '수호갑', '절대갑', '철갑', '중장갑', '방진갑'].some(k => baseName.includes(k))) {
        if (['tank', 'berserker'].includes(role)) return true;
        if (isHolyCrusader) return true;
        return ['squire', 'paladin', 'guardian', 'aegis_valkyrie', 'fortress', 'vanguard', 'berserker', 'valhalla_blade', 'destroyer', 'warlord', 'iron_marshal', 'crusader_lord', 'war_priest', 'aegis_bastion', 'valhalla_warlord', 'seraphic_inquisitor'].includes(classId);
      }
      // 가죽 / 경갑 / 코트 / 예복 / 외투
      if (['가죽', '경갑', '코트', '예복', '외투', '가죽 갑옷'].some(k => baseName.includes(k))) {
        if (['dealer_phy', 'gunner', 'healer', 'berserker', 'tank'].includes(role)) return true;
        return ['rogue', 'assassin', 'shadow_stalker', 'shadow_phantom', 'duelist', 'blade_dancer', 'reaper', 'gunner', 'tactical_gunner', 'sharpshooter', 'ghost_sniper', 'aether_gun_meister', 'acolyte', 'bishop', 'war_priest', 'high_saintess', 'crusader_lord', 'vanguard', 'valhalla_blade', 'void_strider', 'omega_deadeye', 'seraphic_inquisitor'].includes(classId);
      }
      // 로브 / 성의 / 사령의
      if (['로브', '성의', '사령의', '법의'].some(k => baseName.includes(k))) {
        if (['dealer_mag', 'healer'].includes(role)) return true;
        return ['apprentice', 'mage', 'archmage', 'elementalist', 'arcane_scholar', 'calamity_mage', 'chronomancer', 'acolyte', 'bishop', 'war_priest', 'high_saintess', 'crusader_lord', 'chrono_archon', 'seraphic_inquisitor'].includes(classId);
      }
      return true;
    }

    return true;
  }

  /** 장비 인벤토리에 안전하게 새 장비 추가 (고유 ID 강제 보장 및 스탯 동기화) */
  public addEquipmentToInventory(item: EquipmentItem): EquipmentItem {
    if (!Array.isArray(this.equipmentInventory)) this.equipmentInventory = [];

    // 원본 참조 오염 방지를 위한 깊은 복사
    const cleanItem: EquipmentItem = JSON.parse(JSON.stringify(item));

    // 고유 ID 보장 (기존 ID가 누락되었거나 이미 인벤토리에 존재하면 무조건 신규 고유 ID 생성)
    if (!cleanItem.id || this.equipmentInventory.some(e => e.id === cleanItem.id)) {
      cleanItem.id = `equip_${cleanItem.slot || 'item'}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    }

    cleanItem.equippedHeroId = undefined;
    sanitizeEquipmentEnchantSkills(cleanItem);
    this.recalculateItemStats(cleanItem);

    this.equipmentInventory.push(cleanItem);
    this.reconcileEquipment();
    this.emit('inventoryUpdated', this.equipmentInventory);
    this.emit('equipmentUpdated', this.equipmentInventory);
    return cleanItem;
  }

  /** 장비 인벤토리와 용병단 장비 슬롯 간의 양방향 데이터 무결성 동기화 및 중복/유령 장비 원천 차단 */
  public reconcileEquipment(): void {
    if (!Array.isArray(this.equipmentInventory)) this.equipmentInventory = [];
    if (!Array.isArray(this.barracks)) this.barracks = [];
    if (!Array.isArray(this.party)) this.party = [];

    const validHeroIds = new Set(this.barracks.filter(h => h && h.id).map(h => h.id));

    // 0. 인벤토리 내 중복 ID 검사 및 고유 ID 재부여 (ID 충돌로 인한 아이템 덮어쓰기/복사 방지)
    const seenIds = new Set<string>();
    const deduplicatedInventory: EquipmentItem[] = [];
    for (const item of this.equipmentInventory) {
      if (!item || !item.name) continue;
      if (!item.id || seenIds.has(item.id)) {
        item.id = `equip_${item.slot || 'item'}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      }
      seenIds.add(item.id);

      if (!item.stats) item.stats = {};
      if (!item.baseStats) item.baseStats = { ...item.stats };
      sanitizeEquipmentEnchantSkills(item);
      this.recalculateItemStats(item);
      deduplicatedInventory.push(item);
    }
    this.equipmentInventory = deduplicatedInventory;

    // 1. 모든 용병의 장비 슬롯 검증:
    // - 다중 용병의 동일 아이템 중복 착용(복사 버그) 원천 차단
    // - 인벤토리 객체와 동일한 참조로 완벽 일치화
    const equippedItemMap = new Map<string, string>(); // itemId -> heroId

    this.barracks.forEach(hero => {
      if (!hero.equipment || typeof hero.equipment !== 'object') {
        hero.equipment = {};
      }
      (['weapon', 'armor', 'accessory'] as EquipmentSlot[]).forEach(slot => {
        const eq = hero.equipment[slot];
        if (eq && eq.id) {
          // 이미 다른 용병이 동일한 아이템 ID를 착용 중인 경우 중복 슬롯 해제 (복사 방지)
          if (equippedItemMap.has(eq.id)) {
            delete hero.equipment[slot];
            return;
          }

          let invItem = this.equipmentInventory.find(e => e.id === eq.id);
          if (!invItem) {
            eq.equippedHeroId = hero.id;
            this.equipmentInventory.push(eq);
            invItem = eq;
          } else {
            Object.assign(invItem, eq);
            invItem.equippedHeroId = hero.id;
            hero.equipment[slot] = invItem;
          }

          equippedItemMap.set(eq.id, hero.id);
        } else {
          delete hero.equipment[slot];
        }
      });
    });

    // 2. 인벤토리에서 착용 중으로 표시되었으나 실제 용병이 착용하지 않은 장비의 소유권 정리
    this.equipmentInventory.forEach(item => {
      if (item.equippedHeroId) {
        if (!validHeroIds.has(item.equippedHeroId)) {
          item.equippedHeroId = undefined;
        } else {
          const wearer = this.barracks.find(h => h.id === item.equippedHeroId);
          if (!wearer || !wearer.equipment || wearer.equipment[item.slot]?.id !== item.id) {
            item.equippedHeroId = undefined;
          }
        }
      }
    });

    // 3. 파티원 배열이 barracks의 동일 객체를 완벽히 참조하도록 동기화
    this.reconcileParty();
  }

  /** 파티 무결성 검증 및 동기화 (해고된 용병, 입원 환자, 중복 용병 제거 및 용병단 참조 동기화) */
  public reconcileParty(): void {
    // 1. barracks에 실존하고, 입원 환자 목록에 없는 용병만 유지
    this.party = this.party.filter(p => p && p.id && this.barracks.some(b => b.id === p.id) && !this.infirmaryPatients.includes(p.id));

    // 2. barracks의 최신 객체 참조 및 포지션 동기화
    this.party = this.party.map(p => {
      const live = this.barracks.find(b => b.id === p.id);
      if (live) {
        live.position = p.position || live.position || 'mid';
        return live;
      }
      return p;
    });

    // 3. 중복 용병 제거
    const seenIds = new Set<string>();
    this.party = this.party.filter(p => {
      if (seenIds.has(p.id)) return false;
      seenIds.add(p.id);
      return true;
    });

    // 4. 모든 영웅 스탯(파티 시너지 및 장비 유효 스탯) 동기화
    this.syncAllHeroesStats();
  }

  /** 현재 편성된 원정대 파티 현황을 정밀 안내하는 로그 텍스트 생성 */
  public getCurrentPartyLogText(): string {
    const posNames: Record<string, string> = { front: '전열', mid: '중앙', back: '후열' };
    const posOrder: Record<string, number> = { front: 0, mid: 1, back: 2 };
    const partyMembers = (this.party || [])
      .filter(p => p && p.name)
      .sort((a, b) => (posOrder[a.position || 'mid'] ?? 1) - (posOrder[b.position || 'mid'] ?? 1));

    if (partyMembers.length === 0) {
      return '⚔️ 현재 원정대에 편성된 대원이 없습니다. 병영에서 대원을 편성하세요.';
    }

    const partyDesc = partyMembers
      .map(p => `${posNames[p.position || 'mid'] || '중앙'}: ${p.name}`)
      .join(', ');

    // 주점이 아직 건설되지 않았고 대원이 2명 이하인 극초반인 경우에만 3번째 대원 모집 가이드 안내
    const hasTavern = (this.buildings['tavern']?.level || 0) > 0;
    if (partyMembers.length < 3 && !hasTavern) {
      return `⚔️ 현재 원정대로 [${partyDesc}] 대원이 결성되어 있습니다. 방랑자의 라운지를 건설하여 3번째 대원을 모집하세요.`;
    }

    return `⚔️ 현재 원정대로 [${partyDesc}] 대원이 결성되어 있습니다.`;
  }

  /** 창고 장비 판매 (매각) 헬퍼 */
  public removeEquipmentItem(itemId: string): boolean {
    const idx = this.equipmentInventory.findIndex(e => e.id === itemId);
    if (idx !== -1) {
      this.equipmentInventory.splice(idx, 1);

      // 용병단 착용 슬롯에서도 완전 해제 (유령 장비 잔류 및 부활 방지)
      this.barracks.forEach(hero => {
        if (hero.equipment) {
          (['weapon', 'armor', 'accessory'] as EquipmentSlot[]).forEach(slot => {
            if (hero.equipment[slot]?.id === itemId) {
              delete hero.equipment[slot];
            }
          });
        }
      });

      this.reconcileEquipment();
      this.saveGame();
      this.emit('equipmentUpdated', this.equipmentInventory);
      this.emit('inventoryUpdated', this.equipmentInventory);
      this.emit('partyUpdated', this.party);
      return true;
    }
    return false;
  }

  /** 🪙 선택한 복수 장비 일괄 매각 헬퍼 (착용 중 장비는 안전 보호 제외) */
  public sellEquipmentBatch(itemIds: string[]): { count: number; totalGold: number; soldItems: EquipmentItem[] } {
    if (!itemIds || itemIds.length === 0) return { count: 0, totalGold: 0, soldItems: [] };
    const idSet = new Set(itemIds);
    let totalGold = 0;
    const soldItems: EquipmentItem[] = [];

    const basePriceMap: Record<string, number> = {
      common: 50,
      rare: 150,
      unique: 400,
      epic: 400,
      legendary: 1000,
    };

    const remaining: EquipmentItem[] = [];
    this.equipmentInventory.forEach(item => {
      if (idSet.has(item.id)) {
        // 장착 중인 장비는 안전을 위해 일괄 판매에서 제외
        if (item.equippedHeroId) {
          remaining.push(item);
          return;
        }
        const basePrice = basePriceMap[item.rarity] || 50;
        const levelMultiplier = 1 + (item.level || 0) * 0.35;
        const enchantBonus = (item.prefix ? 50 : 0) + (item.suffix ? 50 : 0);
        const price = Math.max(10, Math.floor(basePrice * levelMultiplier + enchantBonus));
        totalGold += price;
        soldItems.push(item);
      } else {
        remaining.push(item);
      }
    });

    if (soldItems.length > 0) {
      this.equipmentInventory = remaining;
      this.modifyResource('gold', totalGold);
      this.reconcileEquipment();
      this.saveGame();
      this.emit('equipmentUpdated', this.equipmentInventory);
      this.emit('inventoryUpdated', this.equipmentInventory);
      this.emit('partyUpdated', this.party);
    }
    return { count: soldItems.length, totalGold, soldItems };
  }

  public equipItem(heroId: string, itemId: string): boolean {
    const hero = this.barracks.find(h => h.id === heroId) || this.party.find(h => h.id === heroId);
    const item = this.equipmentInventory.find(e => e.id === itemId);
    if (!hero || !item) return false;

    // 💀 [침식된] 장비 착용 원천 차단
    if (item.isCorrupted || item.isUnpurified || item.isCursed || item.name.startsWith('[침식된]')) {
      this.addLog(`⚠️ [착용 불가] [${item.name}]은(는) 심연에 침식된 장비입니다. 병기창에서 정화 과정을 거쳐야 착용할 수 있습니다!`, 'danger');
      return false;
    }

    if (!hero.equipment || typeof hero.equipment !== 'object') {
      hero.equipment = {};
    }

    // 1. 용병단 내 다른 용병이 이 아이템을 착용하고 있는 경우 정상 해제 및 인계 처리
    this.barracks.forEach(otherHero => {
      if (otherHero.id !== heroId && otherHero.equipment?.[item.slot]?.id === itemId) {
        delete otherHero.equipment[item.slot];
        this.addLog(`🔄 [장비 인계] ${otherHero.name}이(가) 착용 중이던 [${item.name}]을(를) ${hero.name}에게 인계했습니다.`, 'system');
      }
    });

    // 2. 대상 영웅이 이미 해당 슬롯에 착용 중이던 장비의 소유권 해제 (보관함으로 반환)
    const oldItem = hero.equipment[item.slot];
    if (oldItem && oldItem.id !== itemId) {
      oldItem.equippedHeroId = undefined;
      const oldInv = this.equipmentInventory.find(e => e.id === oldItem.id);
      if (oldInv) oldInv.equippedHeroId = undefined;
    }

    // 3. 새 장비 착용 및 소유자 등록
    hero.equipment[item.slot] = item;
    item.equippedHeroId = hero.id;

    // 파티원 동기화
    this.reconcileParty();

    // 4. 클래스 적합성 검사 및 안내 로그
    const isComp = this.isEquipmentCompatible(hero.classId, item);
    if (!isComp) {
      this.addLog(`⚠️ [비호환 장비] ${hero.name}의 클래스에 맞지 않는 장비입니다! (장비 스탯 50% 반감 및 SPD -3 페널티 적용)`, 'danger');
    } else {
      this.addLog(`[장착 완료] ${hero.name}에게 [${item.name} +${item.level}]을(를) 장착했습니다.`, 'normal');
    }

    this.reconcileEquipment();
    SoundManager.getInstance().play('equip');
    this.emit('inventoryUpdated', this.equipmentInventory);
    this.emit('equipmentUpdated', this.equipmentInventory);
    this.emit('partyUpdated', this.party);
    this.saveGame();
    return true;
  }

  public unequipItem(heroId: string, slot: EquipmentSlot): void {
    const hero = this.barracks.find(h => h.id === heroId) || this.party.find(h => h.id === heroId);
    if (hero && hero.equipment?.[slot]) {
      const item = hero.equipment[slot];
      if (item) {
        item.equippedHeroId = undefined;
        const invItem = this.equipmentInventory.find(e => e.id === item.id);
        if (invItem) invItem.equippedHeroId = undefined;
      }
      delete hero.equipment[slot];

      this.reconcileParty();
      this.reconcileEquipment();
      SoundManager.getInstance().play('equip');
      this.addLog(`[해제 완료] ${hero.name}의 ${slot} 장비를 해제했습니다.`, 'normal');
      this.emit('inventoryUpdated', this.equipmentInventory);
      this.emit('equipmentUpdated', this.equipmentInventory);
      this.emit('partyUpdated', this.party);
      this.saveGame();
    }
  }

  /**
   * 깊은 층으로 갈 때마다 스킬 MP 소모량 증가 (각 층당 +10%씩 증가)
   * 1층: 1.0배 (기본), 2층: 1.1배 (+10%), 3층: 1.2배 (+20%), N층: 1 + (N - 1) * 0.10
   */
  public getSkillManaCost(baseCost: number, floor?: number, hero?: Mercenary): number {
    if (!baseCost || baseCost <= 0) return 0;
    const f = Math.max(1, floor ?? this.dungeonFloor ?? 1);
    const multiplier = 1 + (f - 1) * 0.10;
    let cost = Math.max(1, Math.round(baseCost * multiplier));

    if (hero) {
      // 🔮 [아크 메이지 패시브: 무한의 마도] 모든 마법 스킬 마나 소모량 30% 감소
      if (hero.classId === 'calamity_mage') {
        cost = Math.max(1, Math.round(cost * 0.70));
      }
      // 🪄 [지팡이 무기 특성] 마나 소모량 5% 절감
      const heroWpn = hero.equipment?.weapon;
      const heroTrait = heroWpn ? (heroWpn.weaponTrait || getWeaponTrait(heroWpn)) : undefined;
      if (heroTrait?.weaponType === 'staff') {
        cost = Math.max(1, Math.round(cost * 0.95));
      }
      // 💍 [반지 악세사리 강화 효과] 1강당 마나 소모량 1% 감소 (10강 = 10% 감소)
      const heroAcc = hero.equipment?.accessory;
      if (heroAcc && detectAccessoryType(heroAcc) === 'ring') {
        const ringEnhance = heroAcc.enhanceLevel || 0;
        if (ringEnhance > 0) {
          const ringDiscount = 1 - Math.min(0.25, ringEnhance * 0.01);
          cost = Math.max(1, Math.round(cost * ringDiscount));
        }
      }
    }

    return cost;
  }


  // ================= 📖 스킬북 전수 & 스킬 장착 관리 시스템 =================
  public buySkillBook(bookId: string, costGold: number): boolean {
    if (this.resources.gold < costGold) {
      this.addLog(`골드가 부족하여 스킬북을 구매할 수 없습니다! (필요: ${costGold}G)`, 'danger');
      return false;
    }
    this.modifyResource('gold', -costGold);
    this.addSkillBookToInventory(bookId);
    const bDef = ALL_SKILL_BOOKS.find(b => b.id === bookId);
    this.addLog(`🛒 [블랙 마켓 구매] [${bDef?.name || '스킬북'}]을(를) 구매하여 보관함에 보관했습니다!`, 'reward');
    this.saveGame();
    return true;
  }

  /** 📚 서고(skillBookInventory)에 마도서 입고 (동일 bookId + level 스택 병합) */
  public addSkillBook(bookItem: SkillBookItem, qty: number = 1): void {
    if (!Array.isArray(this.skillBookInventory)) this.skillBookInventory = [];
    if (bookItem.skill && bookItem.skill.id) {
      this.customSkills[bookItem.skill.id] = bookItem.skill;
      ALL_SKILLS_MAP[bookItem.skill.id] = bookItem.skill;
    }

    const curLv = bookItem.level || 1;
    const existing = this.skillBookInventory.find(b => b.bookId === bookItem.bookId && (b.level || 1) === curLv);
    if (existing) {
      existing.count = (existing.count || 1) + qty;
    } else {
      this.skillBookInventory.push({
        ...bookItem,
        count: Math.max(1, qty)
      });
    }
    this.emit('skillBooksUpdated', this.skillBookInventory);
  }

  public addSkillBookToInventory(bookId: string, qty: number = 1): boolean {
    const bDef = ALL_SKILL_BOOKS.find(b => b.id === bookId);
    if (!bDef) return false;
    const item: SkillBookItem = {
      id: `sb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      bookId: bDef.id,
      name: bDef.name,
      rank: bDef.rank,
      rarity: bDef.rarity || getSkillBookRarity(bDef.rank),
      level: 1,
      count: qty,
      basePower: bDef.skill.power,
      skill: { ...bDef.skill },
      description: bDef.description,
      icon: bDef.icon
    };
    this.addSkillBook(item, qty);
    this.saveGame();
    return true;
  }

  /** 🧪 에테르 연금 공방 마도서 강화 비용 산출 (Lv.1 -> Lv.10) */
  public static getGrimoireEnhanceCost(currentLevel: number): Partial<GameResources> {
    const costs: Record<number, Partial<GameResources>> = {
      1: { ether: 25, gold: 150, herb: 15 },
      2: { ether: 45, gold: 300, silk: 15 },
      3: { ether: 70, gold: 500, crystal: 10 },
      4: { ether: 110, gold: 800, crystal: 18 },
      5: { ether: 160, gold: 1300, crystal: 28 },
      6: { ether: 230, gold: 2000, crystal: 20, void_shard: 12 },
      7: { ether: 320, gold: 3200, crystal: 30, void_shard: 20 },
      8: { ether: 450, gold: 5000, void_shard: 30, pure_prefix_stone: 6 },
      9: { ether: 650, gold: 8000, void_shard: 45, pure_prefix_stone: 12, pure_suffix_stone: 6 },
    };
    return costs[currentLevel] || { ether: 800, gold: 10000, void_shard: 50, pure_prefix_stone: 15 };
  }

  /** 🧪 에테르 연금 공방: 마도서 강화 (최고 10레벨) */
  /** 🧪 에테르 연금 공방: 용병이 습득한 스킬 비전 강화 (최고 10레벨)
   * - 연금 재료 소모 (마도서 소모 없음)
   * - 장비 강화 확률 (getEnhanceRateInfo) 적용: 성공(+1), 실패(유지), 실패(하락)
   * - 위력 및 MP 소모 동시 증가 (+12%/레벨)
   */
  public enhanceHeroLearnedSkill(
    heroId: string,
    skillId: string,
    forcedOutcome?: 'success' | 'keep' | 'drop'
  ): {
    success: boolean;
    result: 'success' | 'keep' | 'drop' | 'error';
    newLevel: number;
    error?: string;
  } {
    const alc = this.buildings['alchemy'];
    if (!alc || alc.level < 1 || alc.isPaused) {
      this.addLog('강화 불가: 에테르 연금 공방(Lv.1 이상) 시설이 필요합니다.', 'danger');
      return { success: false, result: 'error', newLevel: 0, error: '에테르 연금 공방이 필요합니다.' };
    }

    const hero = this.barracks.find(h => h.id === heroId) || this.party.find(h => h.id === heroId);
    if (!hero) {
      return { success: false, result: 'error', newLevel: 0, error: '용병을 찾을 수 없습니다.' };
    }

    if (!hero.learnedSkills || !hero.learnedSkills.includes(skillId)) {
      return { success: false, result: 'error', newLevel: 0, error: '용병이 습득하지 않은 스킬입니다.' };
    }

    hero.skillLevels = hero.skillLevels || {};
    const curLv = hero.skillLevels[skillId] || 1;
    if (curLv >= 10) {
      this.addLog(`[${hero.name}]의 스킬은 이미 최고 강화 단계(Lv.10)입니다!`, 'normal');
      return { success: false, result: 'error', newLevel: 10, error: '이미 최고 레벨입니다.' };
    }

    const maxEnhanceAllowed = GameManager.getAlchemyMaxEnhanceLevel(alc.level);
    if (curLv >= maxEnhanceAllowed) {
      this.addLog(`강화 제한: 현재 에테르 연금 공방(Lv.${alc.level})에서는 스킬을 최대 Lv.${maxEnhanceAllowed}까지만 강화할 수 있습니다! (공방 증축 필요)`, 'danger');
      return { success: false, result: 'error', newLevel: curLv, error: `연금 공방 증축 필요 (최대 Lv.${maxEnhanceAllowed})` };
    }

    const skill = this.resolveSkillData(skillId, hero);
    const skillName = skill?.name || skillId;

    // 1. 연금 자원 체크
    const cost = GameManager.getGrimoireEnhanceCost(curLv);
    const missing: string[] = [];
    for (const [resKey, reqAmt] of Object.entries(cost)) {
      const curAmt = (this.resources as unknown as Record<string, number>)[resKey] || 0;
      if (curAmt < (reqAmt as number)) {
        const meta = GameManager.getResourceMeta(resKey as keyof GameResources);
        missing.push(`${meta.icon}${meta.name}(${curAmt}/${reqAmt})`);
      }
    }

    if (missing.length > 0) {
      SoundManager.getInstance().play('forge_fail');
      this.addLog(`강화 실패: 필요 재화가 부족합니다! [부족: ${missing.join(', ')}]`, 'danger');
      return { success: false, result: 'error', newLevel: curLv, error: '재화 부족' };
    }

    // 2. 자원 차감
    for (const [resKey, amt] of Object.entries(cost)) {
      this.modifyResource(resKey as keyof GameResources, -(amt as number));
    }

    // 3. 장비 강화 확률 (getEnhanceRateInfo) 적용
    const rateInfo = GameManager.getEnhanceRateInfo(curLv);
    const roll = Math.random() * 100;
    const determinedOutcome: 'success' | 'keep' | 'drop' = forcedOutcome || (
      roll < rateInfo.successRate ? 'success'
      : (roll < rateInfo.successRate + rateInfo.failKeepRate ? 'keep' : 'drop')
    );

    if (determinedOutcome === 'success') {
      const newLv = curLv + 1;
      hero.skillLevels[skillId] = newLv;
      SoundManager.getInstance().play('forge_success');
      this.addLog(
        `✨ [스킬 비전 강화 성공!] (성공률 ${rateInfo.successRate}%) [${hero.name}]의 [${skillName}] 스킬이 Lv.${newLv}로 승급했습니다! (위력 +12% / 소모 MP +25% 증가)`,
        'reward'
      );
      this.emit('partyUpdated', this.party);
      this.emit('heroesUpdated', this.barracks);
      this.saveGame();
      return { success: true, result: 'success', newLevel: newLv };
    } else if (determinedOutcome === 'keep') {
      SoundManager.getInstance().play('forge_fail');
      this.addLog(
        `⚠️ [스킬 비전 강화 실패] 마력 불안정으로 강화에 실패하여 연금 재료만 소모되었습니다. (현재 Lv.${curLv} 유지)`,
        'danger'
      );
      this.saveGame();
      return { success: false, result: 'keep', newLevel: curLv };
    } else {
      const prevLv = curLv;
      const newLv = Math.max(1, curLv - 1);
      hero.skillLevels[skillId] = newLv;
      SoundManager.getInstance().play('forge_fail');
      this.addLog(
        `💥 [스킬 비전 강화 대실패!] 마력 역류로 인해 [${hero.name}]의 [${skillName}] 스킬 레벨이 1단계 하락했습니다! (Lv.${prevLv} ➔ Lv.${newLv})`,
        'danger'
      );
      this.emit('partyUpdated', this.party);
      this.emit('heroesUpdated', this.barracks);
      this.saveGame();
      return { success: false, result: 'drop', newLevel: newLv };
    }
  }

  public enhanceSkillBook(bookInventoryId: string): { success: boolean; newLevel: number; error?: string } {
    const alc = this.buildings['alchemy'];
    if (!alc || alc.level < 1 || alc.isPaused) {
      this.addLog('강화 불가: 에테르 연금 공방(Lv.1 이상) 시설이 필요합니다.', 'danger');
      return { success: false, newLevel: 0, error: '에테르 연금 공방이 필요합니다.' };
    }

    const book = this.skillBookInventory.find(b => b.id === bookInventoryId);
    if (!book) return { success: false, newLevel: 0, error: '마도서를 찾을 수 없습니다.' };

    const curLv = book.level || 1;
    if (curLv >= 10) {
      this.addLog(`[${book.name}]은(는) 이미 최고 강화 단계(+10)입니다!`, 'normal');
      return { success: false, newLevel: 10, error: '이미 최고 레벨입니다.' };
    }

    const maxEnhanceAllowed = GameManager.getAlchemyMaxEnhanceLevel(alc.level);
    if (curLv >= maxEnhanceAllowed) {
      this.addLog(`강화 제한: 현재 에테르 연금 공방(Lv.${alc.level})에서는 마도서를 최대 Lv.${maxEnhanceAllowed}까지만 강화할 수 있습니다! (공방 증축 필요)`, 'danger');
      return { success: false, newLevel: curLv, error: `연금 공방 증축 필요 (최대 Lv.${maxEnhanceAllowed})` };
    }

    const cost = GameManager.getGrimoireEnhanceCost(curLv);
    const missing: string[] = [];
    for (const [resKey, reqAmt] of Object.entries(cost)) {
      const curAmt = (this.resources as unknown as Record<string, number>)[resKey] || 0;
      if (curAmt < (reqAmt as number)) {
        const meta = GameManager.getResourceMeta(resKey as keyof GameResources);
        missing.push(`${meta.icon}${meta.name}(${curAmt}/${reqAmt})`);
      }
    }

    if (missing.length > 0) {
      SoundManager.getInstance().play('forge_fail');
      this.addLog(`강화 실패: 필요 재화가 부족합니다! [부족: ${missing.join(', ')}]`, 'danger');
      return { success: false, newLevel: curLv, error: '재화 부족' };
    }

    for (const [resKey, amt] of Object.entries(cost)) {
      this.modifyResource(resKey as keyof GameResources, -(amt as number));
    }

    const newLv = curLv + 1;
    const bookRarity = book.rarity || getSkillBookRarity(book.rank);
    const rMeta = GRIMOIRE_RARITY_META[bookRarity];

    // 원본 베이스 스킬 데이터 조회 (Lv.1 기준 원본 설명 및 위력 확보)
    const baseSkill = this.resolveSkillData(book.skill.id, 1) || book.skill;
    const basePwr = book.basePower || baseSkill.power || book.skill.power || 1.0;
    const multPower = 1 + (newLv - 1) * 0.12;
    const newPower = Number((basePwr * multPower).toFixed(2));

    // 원본 설명문에서 [Lv.X] 접두어 제거 후 모든 계수 퍼센트를 레벨 배율에 맞춰 동반 스케일링
    const cleanBaseDesc = (baseSkill.description || book.skill.description || '').replace(/^\[Lv\.\d+[^\]]*\]\s*/, '');
    let scaledDesc = cleanBaseDesc;
    if (scaledDesc.includes('%')) {
      scaledDesc = scaledDesc.replace(/(\d+)\s*%(?!\s*(?:이하|이상|확률))/g, (_match, p1) => {
        const origVal = parseInt(p1, 10);
        return `${Math.round(origVal * multPower)}%`;
      });
    } else {
      scaledDesc = `${scaledDesc} (위력 ${Math.round(newPower * 100)}%)`;
    }
    const finalDescription = `[Lv.${newLv} ${rMeta.label}] ${scaledDesc}`;

    let targetBook = book;
    if ((book.count || 1) > 1) {
      book.count = (book.count || 1) - 1;
      const enhancedBook: SkillBookItem = JSON.parse(JSON.stringify(book));
      enhancedBook.id = `sb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      enhancedBook.level = newLv;
      enhancedBook.count = 1;
      enhancedBook.basePower = basePwr;
      enhancedBook.skill.power = newPower;
      enhancedBook.name = `${book.name.replace(/\s\+\d+$/, '')} +${newLv}`;
      enhancedBook.skill.description = finalDescription;
      this.addSkillBook(enhancedBook, 1);
      targetBook = enhancedBook;
    } else {
      book.level = newLv;
      book.basePower = basePwr;
      book.skill.power = newPower;
      book.name = `${book.name.replace(/\s\+\d+$/, '')} +${newLv}`;
      book.skill.description = finalDescription;
      const existingSameLv = this.skillBookInventory.find(b => b !== book && b.bookId === book.bookId && (b.level || 1) === newLv);
      if (existingSameLv) {
        existingSameLv.count = (existingSameLv.count || 1) + (book.count || 1);
        const idx = this.skillBookInventory.indexOf(book);
        if (idx !== -1) this.skillBookInventory.splice(idx, 1);
        targetBook = existingSameLv;
      }
    }

    // 기본 스킬 맵 및 커스텀 스킬에는 오염되지 않은 순수 Lv.1 기본 정의 유지
    if (!ALL_SKILLS_MAP[targetBook.skill.id] || ALL_SKILLS_MAP[targetBook.skill.id].power > (baseSkill.power || 1.0)) {
      ALL_SKILLS_MAP[targetBook.skill.id] = { ...baseSkill, description: cleanBaseDesc, power: basePwr };
    }
    if (this.customSkills) {
      this.customSkills[targetBook.skill.id] = { ...baseSkill, description: cleanBaseDesc, power: basePwr };
    }

    this.barracks.forEach(h => {
      if (h.learnedSkills && h.learnedSkills.includes(targetBook.skill.id)) {
        h.skillLevels = h.skillLevels || {};
        h.skillLevels[targetBook.skill.id] = Math.max(h.skillLevels[targetBook.skill.id] || 1, newLv);
      }
    });

    SoundManager.getInstance().play('forge_success');
    this.addLog(`✨ [마도서 강화 성공!] [${targetBook.name}] (Lv.${newLv}) 강화 완료! (스킬 위력: ${Math.round(targetBook.skill.power * 100)}%)`, 'reward');
    this.emit('skillBooksUpdated', this.skillBookInventory);
    this.emit('partyUpdated', this.party);
    this.saveGame();
    return { success: true, newLevel: newLv };
  }

  /** 🧪 에테르 연금 공방 마도서 제작 레시피 목록 (클래스별 스킬 비전서 기반, 궁극기 제외) */
  public getGrimoireRecipes(): GrimoireRecipe[] {
    return GRIMOIRE_CRAFT_RECIPES.filter(
      r => !r.skill?.isSpecial && !r.name.includes('궁극기') && !r.skill?.name?.includes('궁극기')
    );
  }

  /** 🧪 마도서 희귀도별 제본 성공률 (기본 80%, 희귀 50%, 에픽 30%, 전설 10%) */
  public getGrimoireCraftSuccessRate(rarity: 'common' | 'rare' | 'epic' | 'legendary'): number {
    return GRIMOIRE_CRAFT_SUCCESS_RATES[rarity] || 80;
  }

  /** 🧪 에테르 연금 공방: 마도서 제작 (등급별 확률 판정 & forcedSuccess 동기화 지원) */
  public craftSkillBook(recipeId: string, forcedSuccess?: boolean): { success: boolean; item?: SkillBookItem; error?: string } {
    const alc = this.buildings['alchemy'];
    if (!alc || alc.level < 1 || alc.isPaused) {
      this.addLog('제작 불가: 에테르 연금 공방(Lv.1 이상) 시설이 필요합니다.', 'danger');
      return { success: false, error: '에테르 연금 공방이 필요합니다.' };
    }

    const recipes = this.getGrimoireRecipes();
    const recipe = recipes.find(r => r.id === recipeId);
    if (!recipe) return { success: false, error: '레시피를 찾을 수 없습니다.' };

    if (alc.level < recipe.reqAlchemyLv) {
      this.addLog(`제작 불가: 에테르 연금 공방 Lv.${recipe.reqAlchemyLv} 이상 증축이 필요합니다.`, 'danger');
      return { success: false, error: `공방 Lv.${recipe.reqAlchemyLv} 필요` };
    }

    const missing: string[] = [];
    for (const [resKey, reqAmt] of Object.entries(recipe.cost)) {
      const curAmt = (this.resources as unknown as Record<string, number>)[resKey] || 0;
      if (curAmt < (reqAmt as number)) {
        const meta = GameManager.getResourceMeta(resKey as keyof GameResources);
        missing.push(`${meta.icon}${meta.name}(${curAmt}/${reqAmt})`);
      }
    }

    if (missing.length > 0) {
      SoundManager.getInstance().play('forge_fail');
      this.addLog(`제작 실패: 재료가 부족합니다! [부족: ${missing.join(', ')}]`, 'danger');
      return { success: false, error: '재료 부족' };
    }

    for (const [resKey, amt] of Object.entries(recipe.cost)) {
      this.modifyResource(resKey as keyof GameResources, -(amt as number));
    }

    // 🎲 등급별 연성 성공률 판정 (기본: 80%, 희귀: 50%, 에픽: 30%, 전설: 10%)
    const successRate = this.getGrimoireCraftSuccessRate(recipe.rarity);
    const isSuccess = typeof forcedSuccess === 'boolean' ? forcedSuccess : ((Math.random() * 100) < successRate);

    if (!isSuccess) {
      SoundManager.getInstance().play('forge_fail');
      this.addLog(`⚠️ [마도서 연성 실패] 에테르 마력 공명이 붕괴하여 [${recipe.name}] 제본에 실패했습니다! (성공률: ${successRate}%, 소모 재료 증발)`, 'danger');
      this.saveGame();
      return { success: false, error: `연성 실패 (공명 붕괴, 성공률: ${successRate}%)` };
    }

    const bookItem: SkillBookItem = {
      id: `sb_craft_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      bookId: `book_${recipe.id}`,
      name: recipe.name,
      rank: recipe.rarity === 'legendary' ? 'mythic' : (recipe.rarity as any),
      rarity: recipe.rarity,
      level: 1,
      count: 1,
      basePower: recipe.skill.power,
      skill: { ...recipe.skill },
      description: recipe.desc,
      icon: recipe.skill.icon || '📖'
    };

    this.addSkillBook(bookItem, 1);
    this.hasCraftedGrimoire = true;

    SoundManager.getInstance().play('forge_success');
    this.addLog(`📖✨ [마도서 연성 대성공!] [${bookItem.name}] (${GRIMOIRE_RARITY_META[recipe.rarity].label}, 성공률 ${successRate}%) 제작 완료! 서고에 보관되었습니다.`, 'reward');
    this.updateQuestObjective('Q_CRAFT_GRIMOIRE', 0, 1);
    this.checkAllQuestObjectives();
    this.saveGame();
    return { success: true, item: bookItem };
  }

  /** 📖 스킬북을 읽어 연구 습득률(%)을 채우고 100% 달성 시 완전 습득 (스택 권수 차감) */
  public learnSkillFromBook(heroId: string, bookInventoryId: string): boolean {
    const hero = this.barracks.find(h => h.id === heroId);
    const bookIdx = this.skillBookInventory.findIndex(b => b.id === bookInventoryId);
    if (!hero || bookIdx === -1) return false;

    const book = this.skillBookInventory[bookIdx];
    hero.learnedSkills = hero.learnedSkills || [];
    hero.equippedSkills = hero.equippedSkills || [];
    hero.skillLevels = hero.skillLevels || {};
    hero.skillMastery = hero.skillMastery || {};

    const bookLv = book.level || 1;
    const rMeta = GRIMOIRE_RARITY_META[book.rarity || getSkillBookRarity(book.rank)];

    // 영구 스킬 맵 및 런타임 맵 등록
    if (book.skill && book.skill.id) {
      this.customSkills[book.skill.id] = book.skill;
      ALL_SKILLS_MAP[book.skill.id] = book.skill;
    }

    const consumeOneBook = () => {
      if ((book.count || 1) > 1) {
        book.count = (book.count || 1) - 1;
      } else {
        this.skillBookInventory.splice(bookIdx, 1);
      }
    };

    // 1. 이미 완전히 배운(100%) 스킬인 경우
    if (hero.learnedSkills.includes(book.skill.id)) {
      const curLv = hero.skillLevels[book.skill.id] || 1;
      if (bookLv > curLv) {
        hero.skillLevels[book.skill.id] = bookLv;
        consumeOneBook();
        SoundManager.getInstance().play('forge_success');
        this.addLog(`📖 [스킬 강화 전수] [${hero.name}]님의 [${book.skill.name}] 스킬이 Lv.${bookLv}로 승급되었습니다! (위력 상승)`, 'reward');
        this.emit('partyUpdated', this.party);
        this.emit('skillBooksUpdated', this.skillBookInventory);
        this.saveGame();
        return true;
      }
      this.addLog(`습득 불가: [${hero.name}]님은 이미 [${book.skill.name}] (Lv.${curLv}) 기술을 완전히 터득(100%)했습니다.`, 'danger');
      return false;
    }

    // 2. 미습득 스킬인 경우:
    hero.studyingSkills = hero.studyingSkills || [];
    const isAlreadyStudying = hero.studyingSkills.includes(book.skill.id);

    // 신규 학습 시작 시 학습 슬롯 한도(최대 6개) 검사
    if (!isAlreadyStudying && hero.studyingSkills.length >= 6) {
      this.addLog(`⚠️ [학습 슬롯 초과] [${hero.name}]님은 이미 최대치(6개)의 마도서를 동시에 학습 중입니다! 기존 학습 중인 스킬을 완료하거나 중도 포기하세요.`, 'danger');
      return false;
    }

    // 3. 연구 습득률(Mastery %) 가산
    const currentMastery = hero.skillMastery[book.skill.id] || 0;
    const gain = getMasteryGainPerBook(book.rarity || getSkillBookRarity(book.rank));
    let nextMastery = currentMastery + gain;

    // 만약 이미 습득 스킬 슬롯이 6개 꽉 차있다면, 100% 도달을 방지하고 99%로 제한
    if (nextMastery >= 100 && hero.learnedSkills.length >= 6) {
      nextMastery = 99;
      hero.skillMastery[book.skill.id] = 99;
      if (!hero.studyingSkills.includes(book.skill.id)) {
        hero.studyingSkills.push(book.skill.id);
      }
      consumeOneBook();
      SoundManager.getInstance().play('button_click');
      this.addLog(`📖⚠️ [습득 슬롯 가득 참] [${hero.name}]님의 [${book.name}] 연독률이 99%에 도달했습니다! 정식 습득(100%)하려면 기존 습득 스킬(6개) 중 하나를 망각해야 합니다.`, 'danger');
      this.emit('partyUpdated', this.party);
      this.emit('skillBooksUpdated', this.skillBookInventory);
      this.emit('update');
      this.saveGame();
      return true;
    }

    nextMastery = Math.min(100, nextMastery);
    hero.skillMastery[book.skill.id] = nextMastery;
    consumeOneBook();

    if (nextMastery >= 100) {
      // 100% 완전 터득!
      hero.learnedSkills.push(book.skill.id);
      hero.studyingSkills = hero.studyingSkills.filter(sid => sid !== book.skill.id);
      hero.skillLevels[book.skill.id] = bookLv;
      if (hero.equippedSkills.length < 2) {
        hero.equippedSkills.push(book.skill.id);
      }
      SoundManager.getInstance().play('forge_success');
      this.addLog(`📖✨ [기술 완전 습득!] [${hero.name}]님이 [${book.name}] 연구를 완료하여 [${book.skill.name}] (${rMeta.label} Lv.${bookLv}) 스킬을 완벽하게 터득했습니다! (습득률 100%)`, 'reward');
    } else {
      if (!hero.studyingSkills.includes(book.skill.id)) {
        hero.studyingSkills.push(book.skill.id);
      }
      const remainingBooks = Math.ceil((100 - nextMastery) / gain);
      SoundManager.getInstance().play('button_click');
      this.addLog(`📖 [마도서 연독] [${hero.name}]님이 [${book.name}]을(를) 정독했습니다. 습득률: ${currentMastery}% ➔ ${nextMastery}% (+${gain}%, 완전 습득까지 약 ${remainingBooks}권 필요)`, 'story');
    }

    this.emit('partyUpdated', this.party);
    this.emit('skillBooksUpdated', this.skillBookInventory);
    this.emit('update');
    this.saveGame();
    return true;
  }

  /** 학습(연독) 중인 스킬 중도 포기 (연독률 초기화 및 학습 슬롯 반환) */
  public abandonStudyingSkill(heroId: string, skillId: string): boolean {
    const hero = this.barracks.find(h => h.id === heroId);
    if (!hero) return false;

    hero.studyingSkills = hero.studyingSkills || [];
    const idx = hero.studyingSkills.indexOf(skillId);
    if (idx !== -1) {
      hero.studyingSkills.splice(idx, 1);
    }
    if (hero.skillMastery) {
      delete hero.skillMastery[skillId];
    }

    const sk = this.resolveSkillData(skillId, hero);
    SoundManager.getInstance().play('button_click');
    this.addLog(`🗑️ [학습 중도 포기] [${hero.name}]님의 [${sk?.name || skillId}] 마도서 학습을 중도 포기했습니다. (연독률 초기화 및 슬롯 반환)`, 'system');

    this.emit('partyUpdated', this.party);
    this.emit('update');
    this.saveGame();
    return true;
  }

  /** 습득한 스킬을 망각하여 슬롯을 비움 (언제든지 제거 가능) */
  public unlearnSkill(heroId: string, skillId: string): boolean {
    const hero = this.barracks.find(h => h.id === heroId);
    if (!hero || !hero.learnedSkills) return false;

    const idx = hero.learnedSkills.indexOf(skillId);
    if (idx === -1) return false;

    const sk = this.resolveSkillData(skillId, hero);
    hero.learnedSkills.splice(idx, 1);
    hero.equippedSkills = (hero.equippedSkills || []).filter(sid => sid !== skillId);
    if (hero.studyingSkills) {
      hero.studyingSkills = hero.studyingSkills.filter(sid => sid !== skillId);
    }
    hero.skillMastery = hero.skillMastery || {};
    delete hero.skillMastery[skillId]; // 망각 시 습득률 초기화
    if (hero.skillLevels) {
      delete hero.skillLevels[skillId];
    }

    this.addLog(`🗑️ [스킬 망각] [${hero.name}]님의 [${sk?.name || skillId}] 스킬을 제거하여 슬롯을 확보했습니다. (습득률 초기화)`, 'system');
    this.emit('partyUpdated', this.party);
    this.emit('update');
    this.saveGame();
    return true;
  }

  /** 스킬을 특정 슬롯(0번 또는 1번)에 장착 */
  public equipSkillToSlot(heroId: string, skillId: string, slotIdx: number): boolean {
    const hero = this.barracks.find(h => h.id === heroId);
    if (!hero) return false;

    hero.learnedSkills = hero.learnedSkills || [];
    hero.equippedSkills = hero.equippedSkills || [];

    if (!hero.learnedSkills.includes(skillId)) {
      this.addLog(`장착 불가: 먼저 해당 스킬을 습득해야 합니다.`, 'danger');
      return false;
    }

    // 다른 슬롯에 이미 장착되어 있다면 제거
    hero.equippedSkills = hero.equippedSkills.filter(sid => sid !== skillId);

    // 해당 슬롯에 배치
    if (slotIdx === 0) {
      hero.equippedSkills[0] = skillId;
    } else {
      if (hero.equippedSkills.length === 0) {
        hero.equippedSkills[0] = skillId;
      } else {
        hero.equippedSkills[1] = skillId;
      }
    }

    const sk = this.resolveSkillData(skillId, hero);
    this.addLog(`⚔️ [스킬 장착] [${hero.name}] 슬롯 ${slotIdx + 1}에 [${sk?.name || skillId}] 장착 완료!`, 'normal');
    this.emit('partyUpdated', this.party);
    this.saveGame();
    return true;
  }

  /** 특정 슬롯의 스킬을 장착 해제 */
  public unequipSkillSlot(heroId: string, slotIdx: number): boolean {
    const hero = this.barracks.find(h => h.id === heroId);
    if (!hero || !hero.equippedSkills) return false;

    if (slotIdx === 0 && hero.equippedSkills.length > 0) {
      hero.equippedSkills.splice(0, 1);
    } else if (slotIdx === 1 && hero.equippedSkills.length > 1) {
      hero.equippedSkills.splice(1, 1);
    }

    this.addLog(`[스킬 해제] [${hero.name}] 슬롯 ${slotIdx + 1}의 스킬을 해제했습니다.`, 'normal');
    this.emit('partyUpdated', this.party);
    this.saveGame();
    return true;
  }

  /** 던전 긴급 이송 시작: 균열의 닻 1개 소모, 용병 1명을 방주로 귀환시키고 대기소 영웅 1명을 소환 (도착까지 3턴 소요) */
  public startEmergencyTransport(leaveHeroId: string, joinHeroId: string): boolean {
    if (this.inTransitHero) {
      this.addLog('⚠️ [긴급 이송 진행 중] 이미 차원 이송 중인 용병이 있습니다!', 'danger');
      return false;
    }

    const hasEnhanced = this.getDungeonItemCount('enhanced_rift_anchor') > 0;
    const hasNormal = this.getDungeonItemCount('rift_anchor') > 0;
    if (!hasEnhanced && !hasNormal) {
      this.addLog('⚠️ [아이템 부족] 긴급 이송을 위해 [균열의 닻] 또는 [심연의 닻] 1개가 필요합니다.', 'danger');
      return false;
    }

    const leaveIdx = this.party.findIndex(h => h.id === leaveHeroId);
    if (leaveIdx === -1) {
      this.addLog('⚠️ [대상 오류] 출전 중인 파티원을 찾을 수 없습니다.', 'danger');
      return false;
    }

    const joinHero = this.barracks.find(h => h.id === joinHeroId);
    if (!joinHero) {
      this.addLog('⚠️ [대상 오류] 호출할 대기 용병을 찾을 수 없습니다.', 'danger');
      return false;
    }

    if (this.party.some(h => h.id === joinHeroId)) {
      this.addLog('⚠️ [대상 오류] 이미 원정대에 출전 중인 용병입니다.', 'danger');
      return false;
    }

    if (this.infirmaryPatients.includes(joinHeroId)) {
      this.addLog('⚠️ [출전 불가] 치료실에 입원 중인 용병은 소환할 수 없습니다.', 'danger');
      return false;
    }

    // 🌟 강화된 [심연의 닻] 우선 소모! (도착 시간 2턴 vs 3턴)
    let turns = 3;
    let anchorName = '균열의 닻';
    if (hasEnhanced) {
      const consumed = this.consumeDungeonItem('enhanced_rift_anchor', 1);
      if (!consumed) return false;
      turns = 2; // 심연의 닻: 용병 도착 시간 2턴
      anchorName = '심연의 닻';
    } else {
      const consumed = this.consumeDungeonItem('rift_anchor', 1);
      if (!consumed) return false;
      turns = 3;
      anchorName = '균열의 닻';
    }

    const leaveHero = this.party[leaveIdx];
    const isDead = !!leaveHero.isPermanentlyDead || (leaveHero.deathCountdown !== undefined && leaveHero.deathCountdown <= 0) || leaveHero.currentHp <= 0;

    if (isDead) {
      // ⚰️ 완전 전사자: 성채 묘지에 안장하고 유품(장비)을 회수하여 영주로 돌려보냄
      this.buryFallenHero(leaveHero, this.dungeonFloor, '심연의 마물');
      // (buryFallenHero 내에서 this.party 필터링 처리됨)
    } else {
      // 생존자: 파티 슬롯에서 제거 (성채 병영에 정상 복귀)
      this.party.splice(leaveIdx, 1);
    }

    const targetSlot = Math.min(leaveIdx, this.party.length);
    const hasChronoCompass = this.activeCatalysts.includes('chrono_compass') || (this.activeCatalysts.includes('compass') && this.hasChronoCompass) || this.hasChronoCompass;
    const hasCompass = this.activeCatalysts.includes('compass') || this.activeCatalysts.includes('chrono_compass');

    // 🧭⌛ 시공간의 나침반: 용병 이송에 걸리는 턴을 완전히 없앰 (0턴 즉시 합류!)
    // 🧭 차원의 나침반: 용병 이송 턴 1턴 단축 (최소 1턴)
    if (hasChronoCompass) {
      turns = 0;
    } else if (hasCompass) {
      turns = Math.max(1, turns - 1);
    }

    if (turns <= 0) {
      // 0턴 즉시 합류 (시공간의 나침반 초월 효과)
      this.inTransitHero = null;
      this.party.splice(targetSlot, 0, joinHero);
      SoundManager.getInstance().play('portal');
      SoundManager.getInstance().play('level_up');

      if (isDead) {
        this.addLog(`⚰️🕊️ [유해 안치] [${anchorName}]의 영혼 인도 주술로 [${leaveHero.name}] 대원의 유해를 성채 묘역으로 경건히 운구했습니다.`, 'reward');
      } else {
        this.addLog(`🌀 [차원 철수] [${anchorName}]의 공간 도약 마법으로 [${leaveHero.name}] 대원을 방주로 안전히 후송했습니다.`, 'reward');
      }
      this.addLog(`🧭⌛✨ [시공간의 나침반 초월 도약] [시공간의 나침반]의 시공간 왜곡 초월 권능으로 대기 턴 없이 [${joinHero.name}] 대원이 즉시 원정대 전열에 합류했습니다! (이송 턴 0턴)`, 'reward');
    } else {
      // 대기 설정 (닻 종류 및 나침반 단축 적용)
      this.inTransitHero = {
        targetSlot,
        heroId: joinHero.id,
        heroName: joinHero.name,
        turnsLeft: turns
      };

      SoundManager.getInstance().play('portal');
      if (isDead) {
        this.addLog(`⚰️🕊️ [유해 안치와 전열 재정비] [${anchorName}]의 영혼 인도 주술이 발동하여 숨을 거둔 [${leaveHero.name}] 대원의 유해를 성채 묘역으로 경건히 운구하고 유품을 안전히 회수했습니다. 이 숭고한 빈자리를 지키기 위해 방주의 [${joinHero.name}] 대원이 차원 통로를 향해 전력 질주합니다.`, 'reward');
      } else {
        this.addLog(`🌀 [차원 철수 및 원군 급파] [${anchorName}]의 공간 도약 마법으로 한계에 다다른 [${leaveHero.name}] 대원을 방주로 안전히 후송했습니다. 긴급 지원 요청에 응답한 [${joinHero.name}] 대원이 차원의 틈을 넘어 전장으로 달려옵니다.`, 'reward');
      }

      if (hasCompass) {
        this.addLog(`🧭✨ [차원의 나침반] 시공간 왜곡 권능으로 [${joinHero.name}] 대원의 이송 시간이 1턴 단축되었습니다! (도착까지 ${turns}턴)`, 'reward');
      }
    }
    this.emit('partyUpdated', this.party);
    this.emit('dungeonUpdated');
    this.saveGame();
    return true;
  }

  /** 던전 탐험 1스텝 전진 시 긴급 이송 턴 감소 및 합류 처리 */
  public advanceEmergencyTransport(): void {
    if (!this.inTransitHero) return;

    this.inTransitHero.turnsLeft -= 1;
    if (this.inTransitHero.turnsLeft <= 0) {
      const arrivedHero = this.barracks.find(h => h.id === this.inTransitHero!.heroId);
      if (arrivedHero) {
        // 원래 슬롯 또는 끝에 추가
        if (this.inTransitHero.targetSlot <= this.party.length) {
          this.party.splice(this.inTransitHero.targetSlot, 0, arrivedHero);
        } else {
          this.party.push(arrivedHero);
        }
        SoundManager.getInstance().play('level_up');
        this.addLog(`🎉 [원군 합류] 차원의 틈새를 뚫고 달려온 [${arrivedHero.name}] 대원이 원정대 전열에 굳건히 합류했습니다!`, 'reward');
        this.emit('partyUpdated', this.party);
      }
      this.inTransitHero = null;
    } else {
      this.addLog(`🚚 [원군 진군 중] 차원 통로를 건너는 [${this.inTransitHero.heroName}] 대원의 발소리가 어둠 속에서 점점 가깝게 울려 퍼집니다...`, 'normal');
    }
    this.emit('dungeonUpdated');
    this.saveGame();
  }

  /** 용병 관리 충전 (야영 시 1회 충전, 최대 1회) */
  public rechargeMercenaryManage(): void {
    this.mercenaryManageCharges = 1;
    this.addLog(`👥 [용병 관리 충전] 야영을 통해 원정대 재정비 기회를 얻었습니다. (용병 관리 가능 1/1)`, 'reward');
    this.emit('dungeonUpdated');
    this.saveGame();
  }

  /** 용병 관리 1회 소모 */
  public consumeMercenaryManageCharge(): boolean {
    if ((this.mercenaryManageCharges ?? 1) <= 0) return false;
    this.mercenaryManageCharges = 0;
    this.emit('dungeonUpdated');
    this.saveGame();
    return true;
  }

  /** 스킬 ID로부터 스킬 정보 조회 (클래스 기본기 + 스킬북 스킬 전체 탐색, 영웅 개별 스킬 레벨 스케일링 반영) */
  public resolveSkillData(skillId: string, heroOrLevel?: Mercenary | number): Skill | null {
    let base: Skill | null = null;
    // 1. 클래스 고유 정의(기본기 및 특수기) 최우선 매칭 (피아 식별 및 스탯 무결성 보장)
    for (const cls of Object.values(CHARACTER_CLASSES)) {
      if (cls.specialSkill && cls.specialSkill.id === skillId) { base = cls.specialSkill; break; }
      const found = cls.skills.find(s => s.id === skillId);
      if (found) { base = found; break; }
    }
    // 2. 공방 비전서 제작 레시피 매칭
    if (!base) {
      const rec = GRIMOIRE_CRAFT_RECIPES.find(r => r.skill && r.skill.id === skillId);
      if (rec) base = rec.skill;
    }
    // 3. 스킬북 및 커스텀 스킬 매칭
    if (!base && ALL_SKILLS_MAP[skillId]) base = ALL_SKILLS_MAP[skillId];
    if (!base && this.customSkills && this.customSkills[skillId]) {
      base = this.customSkills[skillId];
      ALL_SKILLS_MAP[skillId] = base;
    }
    if (!base && skillId.startsWith('skill_m_')) {
      base = {
        id: skillId,
        name: '마물의 비기',
        description: '심연 마물의 정수가 담긴 비전 마도 기술',
        icon: '📖',
        manaCost: 15,
        cooldown: 1,
        targetType: 'single_enemy',
        power: 1.2,
        effectType: 'damage'
      };
      this.customSkills[skillId] = base;
      ALL_SKILLS_MAP[skillId] = base;
    }
    if (!base) return null;

    // 드랍 마도서 스킬 설명 정규화 보장 (약화된 실제 위력과 일치)
    if (skillId.startsWith('skill_m_') && base.power && base.description) {
      base.description = normalizeDroppedSkillDescription(base.description, base.power);
    }

    // 각 클래스 궁극기(특수기) 판정: isSpecial 플래그 또는 이름에 '궁극기' 또는 클래스 정의의 specialSkill과 일치
    const isSpecialSkill = Boolean(
      base.isSpecial ||
      base.name.includes('궁극기') ||
      Object.values(CHARACTER_CLASSES).some(c => c.specialSkill && c.specialSkill.id === base.id)
    );

    // 영웅 레벨 추출 (Mercenary 객체가 넘어온 경우 hero.level, 숫자가 넘어온 경우 해당 숫자)
    const heroLevel = typeof heroOrLevel === 'number'
      ? heroOrLevel
      : (typeof heroOrLevel === 'object' && heroOrLevel ? heroOrLevel.level : 1);

    // 🌟 [FEVER 시스템 전격 도입] 궁극기는 단순 레벨 비례 곱연산 대신 전투 중 실시간 전술 모멘텀 FEVER 시스템을 통해 증폭됩니다.

    // 만약 hero 또는 레벨이 주어지면 파워(+12%/Lv) 및 MP 소모 스케일링(+25%/Lv) 적용
    const lv = typeof heroOrLevel === 'number' 
      ? heroOrLevel 
      : heroOrLevel?.skillLevels?.[skillId];
    if (lv && lv > 1) {
      const multPower = 1 + (lv - 1) * 0.12;
      const multMp = 1 + (lv - 1) * 0.25;
      const newPower = Number((base.power * multPower).toFixed(2));
      const newPowerPct = Math.round(newPower * 100);
      const basePowerPct = Math.round((base.power || 1.0) * 100);

      // 복합 스킬 내의 모든 능력치 퍼센트(주요 위력 및 부가 계수: 공격력/방어력/치명타/회피/보호막/흡혈 등)를 강화 배율에 맞춰 동반 강화 치환
      let updatedDesc = (base.description || '').replace(/^\[Lv\.\d+[^\]]*\]\s*/, '');
      if (updatedDesc.includes('%')) {
        updatedDesc = updatedDesc.replace(/(\d+)\s*%(?!\s*(?:이하|이상|확률))/g, (_match, p1) => {
          const origVal = parseInt(p1, 10);
          const scaledVal = Math.round(origVal * multPower);
          return `${scaledVal}%`;
        });
      } else if (newPowerPct > 0) {
        updatedDesc = `${updatedDesc} (위력 ${newPowerPct}%)`;
      }

      return {
        ...base,
        power: newPower,
        manaCost: Math.max(1, Math.round(base.manaCost * multMp)),
        description: `[Lv.${lv}] ${updatedDesc}`
      };
    }

    if (base.description && /^\[Lv\.\d+[^\]]*\]\s*/.test(base.description)) {
      return {
        ...base,
        description: base.description.replace(/^\[Lv\.\d+[^\]]*\]\s*/, '')
      };
    }

    return base;
  }

  // ================= 주점 (용병 고용 풀 & 개별 스탯 랜덤 편차 엔진) =================
  public refreshTavernPool(): void {
    const ALL_NAMES = [
      '루나', '카엘', '미아', '발렌타인', '클로에', '알렉스', '세린', '로건', '레이',
      '베아트리스', '다리우스', '일레인', '트리스탄', '실비아', '가웨인', '오리온', '세실리아', '펠릭스',
      '발레리아', '란슬롯', '카밀라', '베르나르', '로웨나', '하비', '아델라인', '아서', '모건', '기드온',
      '클레어', '로이드', '아우렐리아', '시그루드', '비비안', '롤랑', '헥터', '헬레나', '에드워드', '에블린',
      '가브리엘', '빅터', '이사벨라', '타리크', '레오나', '카이엔', '디아나', '유리엘', '오스카', '제노'
    ];

    // 현재 보유 중인 용병단(barracks/party) 이름 수집하여 중복 제외
    const existingHeroNames = new Set(this.barracks.map(h => h.name));
    const availableNames = ALL_NAMES.filter(n => !existingHeroNames.has(n));
    const classIds = ['squire', 'rogue', 'apprentice', 'acolyte', 'vanguard', 'gunner'];
    const tavernLv = this.buildings['tavern']?.level || 1;
    const sanctuaryLv = this.buildings['sanctuary']?.level || 0;
    
    // 🌟 라운지 레벨 3 이하: 100% N(뉴비) 등급만 등장
    // 🌟 라운지 레벨 4 이상: [V] 베테랑 등급 출현
    // 🌟 라운지 레벨 6 이상: [H] 히어로 등급 출현
    // 🌟 라운지 레벨 8 이상: [E] 에픽 등급 출현
    let epicChance = 0;
    let heroChance = 0;
    let veteranChance = 0;

    if (tavernLv >= 4) {
      veteranChance = Math.min(35, 12 + (tavernLv - 4) * 4 + sanctuaryLv * 2); // Lv.4: 12% ~
      if (tavernLv >= 6) {
        heroChance = Math.min(18, 6 + (tavernLv - 6) * 3 + sanctuaryLv * 1.5); // Lv.6: 6% ~
      }
      if (tavernLv >= 8) {
        epicChance = Math.min(10, 2 + (tavernLv - 8) * 2 + sanctuaryLv * 1);   // Lv.8: 2% ~
      }
    }

    const TRAITS = [
      { name: '맹렬한 투사', atkMod: 1.12, defMod: 0.95, hpMod: 1.05, mpMod: 0.95, spdMod: 0, luckMod: 5 },
      { name: '강철의 수호자', atkMod: 0.95, defMod: 1.18, hpMod: 1.15, mpMod: 0.95, spdMod: -1, luckMod: -3 },
      { name: '신속한 그림자', atkMod: 1.05, defMod: 0.92, hpMod: 0.95, mpMod: 1.05, spdMod: 2, luckMod: 8 },
      { name: '비전 탐구자', atkMod: 1.08, defMod: 0.95, hpMod: 0.95, mpMod: 1.20, spdMod: 0, luckMod: 4 },
      { name: '생존의 달인', atkMod: 1.00, defMod: 1.08, hpMod: 1.12, mpMod: 1.00, spdMod: 1, luckMod: 3 },
      { name: '균형잡힌 정예', atkMod: 1.05, defMod: 1.05, hpMod: 1.05, mpMod: 1.05, spdMod: 1, luckMod: 4 },
      { name: '광전사의 혈통', atkMod: 1.16, defMod: 0.90, hpMod: 1.08, mpMod: 0.90, spdMod: 1, luckMod: 6 }
    ];

    const poolSize = [0, 3, 3, 3, 4, 4, 5, 5, 6, 6, 6][tavernLv] || 3;
    this.tavernCandidates = Array.from({ length: poolSize }).map((_, idx) => {
      const cId = classIds[Math.floor(Math.random() * classIds.length)];
      const cData = CHARACTER_CLASSES[cId];
      
      const rand = Math.random() * 100;
      let grade: MercenaryGrade = 'rookie';
      let statMult = 1.0;
      let hiringCost = 400;
      
      if (rand < epicChance) {
        grade = 'epic'; // [E] 에픽
        statMult = 1.75;
        hiringCost = 8000; // [E] 8,000G
      } else if (rand < epicChance + heroChance) {
        grade = 'hero'; // [H] 히어로
        statMult = 1.45;
        hiringCost = 4000; // [H] 4,000G
      } else if (rand < epicChance + heroChance + veteranChance) {
        grade = 'veteran'; // [V] 베테랑
        statMult = 1.2;
        hiringCost = 1200; // [V] 1,200G
      } else {
        grade = 'rookie'; // [N] 뉴비
        statMult = 1.0;
        hiringCost = 400; // [N] 400G
      }

      const traitObj = TRAITS[Math.floor(Math.random() * TRAITS.length)];
      // 개별 용병 스탯 분산 (기본 ±7% 미세 편차)
      const rollVar = () => 0.93 + Math.random() * 0.14;

      const rolledStats = {
        atk: Math.max(3, Math.floor(cData.baseStats.atk * statMult * traitObj.atkMod * rollVar())),
        def: Math.max(3, Math.floor(cData.baseStats.def * statMult * traitObj.defMod * rollVar())),
        spd: Math.max(4, Math.floor((cData.baseStats.spd * statMult + traitObj.spdMod) * rollVar())),
        luck: Math.max(1, Math.floor((cData.baseStats.luck + traitObj.luckMod) * rollVar())),
        hp: Math.max(100, Math.floor(cData.baseStats.hp * statMult * traitObj.hpMod * rollVar())),
        mp: Math.max(10, Math.floor(cData.baseStats.mp * statMult * traitObj.mpMod * rollVar()))
      };

      // 중복되지 않는 이름 선별
      let candidateName = '방랑자';
      if (availableNames.length > 0) {
        const randNameIdx = Math.floor(Math.random() * availableNames.length);
        candidateName = availableNames.splice(randNameIdx, 1)[0];
      } else {
        candidateName = `용병_${Math.floor(Math.random() * 900 + 100)}`;
      }

      return {
        id: `cand_${Date.now()}_${idx}`,
        name: candidateName,
        classId: cId,
        grade,
        trait: traitObj.name,
        hiringCost,
        stats: rolledStats
      };
    });
    this.emit('tavernRefreshed', this.tavernCandidates);
  }

  /** 라운지 수동 새로고침 비용 계산 (처음 100G -> 다음 400G -> 1,000G 이후 1,000G씩 지속 증가) */
  public getTavernRefreshCost(): number {
    if (this.tavernRefreshCount === 0) return 100;
    if (this.tavernRefreshCount === 1) return 400;
    return 1000 + (this.tavernRefreshCount - 2) * 1000;
  }

  /** 라운지 수동 새로고침 실행 (단계별 비용 차감 및 후보 재생성) */
  public manualRefreshTavern(): boolean {
    const cost = this.getTavernRefreshCost();
    if (this.resources.gold < cost) {
      this.addLog(`골드가 부족합니다! (갱신 비용: 🪙${cost}G 필요)`, 'danger');
      return false;
    }
    this.modifyResource('gold', -cost);
    this.tavernRefreshCount += 1;
    this.refreshTavernPool();
    this.addLog(`🍸 [라운지 갱신] 골드 🪙${cost}G를 지불하여 새로운 용병 후보를 탐색했습니다. (다음 갱신 비용: 🪙${this.getTavernRefreshCost()}G)`, 'system');
    this.saveGame();
    this.emit('update');
    return true;
  }

  /** 📺 광고 시청을 통한 라운지 모험가 도착 쿨타임 및 갱신 비용 즉시 초기화 */
  public resetTavernCooldownWithAd(): boolean {
    this.tavernArrivalSecondsLeft = 600;
    this.tavernRefreshCount = 0;
    this.refreshTavernPool();
    this.addLog('📺 [방랑자의 라운지] 광고 시청으로 모험가 도착 쿨타임이 즉시 초기화되어 새로운 방랑 모험가들이 도착했습니다! (골드 갱신 비용 100G 초기화)', 'reward', 'citadel');
    this.saveGame();
    this.emit('update');
    return true;
  }

  public dismissMercenary(heroId: string): boolean {
    const hero = this.barracks.find(h => h.id === heroId);
    if (!hero) return false;

    if (this.barracks.length <= 3) {
      this.addLog('해고 불가: 원정 파티(3인) 편성을 위해 용병단에 최소 3명의 대원은 유지해야 합니다!', 'danger');
      return false;
    }

    // 장착 장비 보관함으로 자동 반환
    if (hero.equipment) {
      (['weapon', 'armor', 'accessory'] as EquipmentSlot[]).forEach(slot => {
        const eq = hero.equipment[slot];
        if (eq) {
          eq.equippedHeroId = undefined;
          const invItem = this.equipmentInventory.find(e => e.id === eq.id);
          if (invItem) invItem.equippedHeroId = undefined;
        }
      });
      hero.equipment = {};
    }

    this.barracks = this.barracks.filter(h => h.id !== heroId);
    this.infirmaryPatients = this.infirmaryPatients.filter(id => id !== heroId);
    this.reconcileParty();
    this.reconcileEquipment();
    this.emit('inventoryUpdated', this.equipmentInventory);
    this.emit('equipmentUpdated', this.equipmentInventory);

    // 파티가 비었을 경우 대기 중이고 입원하지 않은 첫 용병을 자동 파티 합류
    if (this.party.length === 0 && this.barracks.length > 0) {
      const available = this.barracks.find(b => !this.infirmaryPatients.includes(b.id));
      if (available) {
        available.position = available.position || 'front';
        this.party.push(available);
      }
    }

    const gradeLabels: Record<string, string> = { rookie: '[N]', veteran: '[V]', hero: '[H]', elite: '[H]', epic: '[E]', legend: '[E]' };
    this.addLog(`👋 [용병 해고] [${gradeLabels[hero.grade] || hero.grade}] ${hero.name} 용병과의 고용 계약을 해지했습니다. 장착 중이던 장비는 보관함으로 반환되었습니다.`, 'system');
    this.reconcileParty();
    this.emit('partyUpdated', this.party);
    this.emit('update');
    this.saveGame();
    return true;
  }

  public hireMercenary(candidateId: string): boolean {
    if (this.barracks.length >= 7) {
      this.addLog('용병단 정원 초과: 용병단은 최대 7명까지만 수용할 수 있습니다! 기존 용병을 해고해야 합니다.', 'danger');
      return false;
    }

    const candIdx = this.tavernCandidates.findIndex(c => c.id === candidateId);
    if (candIdx === -1) return false;
    const cand = this.tavernCandidates[candIdx];

    if (!this.modifyResource('gold', -cand.hiringCost)) {
      this.addLog('골드가 부족하여 용병을 고용할 수 없습니다!', 'danger');
      return false;
    }

    const cClass = CHARACTER_CLASSES[cand.classId];
    const newHero: Mercenary = this.sanitizeHero({
      id: `hero_${Date.now()}`,
      name: cand.name,
      title: cand.trait || '주점 영입 용병',
      trait: cand.trait || '균형잡힌 정예',
      classId: cand.classId,
      grade: cand.grade,
      level: 1, exp: 0, expToNext: 80,
      currentHp: cand.stats.hp,
      maxHp: cand.stats.hp,
      currentMp: cand.stats.mp,
      maxMp: cand.stats.mp,
      position: 'mid',
      stats: { atk: cand.stats.atk, def: cand.stats.def, spd: cand.stats.spd, luck: cand.stats.luck },
      equippedSkills: cClass.skills.slice(0, 2).map(s => s.id),
      learnedSkills: cClass.skills.map(s => s.id),
      equipment: {}, statusEffects: [],
      portraitPromptKey: cClass.promptKey
    });

    this.barracks.push(newHero);
    this.tavernCandidates.splice(candIdx, 1);
    this.addLog(`★ [용병 영입] [${newHero.name}] (${cClass.name})을(를) 영입했습니다!`, 'reward');
    this.updateQuestObjective('Q_MAIN_02', 1, 1);
    this.checkAllQuestObjectives();
    this.emit('partyUpdated', this.party);
    this.emit('questUpdated');
    this.saveGame();
    return true;
  }

  // ================= 전투 승리 보상 정산 + EXP 분배 =================
  public claimBattleRewards(monster: MonsterData): {
    gold: number;
    ether: number;
    guaranteedResource: { key: string; name: string; icon: string; amount: number };
    exp: number;
    resources: Record<string, number>;
    equipment: EquipmentItem[];
    skillBooks?: SkillBookItem[];
    levelUps: string[];
  } {
    return this.claimSquadBattleRewards([monster]);
  }

  /** 다중 몬스터 편대 승리 보상 통합 정산 (자원 종류 최대 4가지 엄격 제한 & 초과분 골드 환산) */
  public claimSquadBattleRewards(monsters: MonsterData[]): {
    gold: number;
    ether: number;
    guaranteedResource: { key: string; name: string; icon: string; amount: number };
    exp: number;
    resources: Record<string, number>;
    equipment: EquipmentItem[];
    skillBooks: SkillBookItem[];
    levelUps: string[];
  } {
    const isOvc = this.isOvercharged;
    const lootMult = isOvc ? 1.5 : 1.0;

    let totGold = 0;
    let totGuaranteedAmt = 0;
    let baseTotalExp = 0;
    const rawResources: Record<string, number> = {};
    const droppedEquips: EquipmentItem[] = [];
    const droppedSkillBooks: SkillBookItem[] = [];
    const levelUps: string[] = [];

    const floor = Math.max(1, this.dungeonFloor || 1);
    const guaranteedRes = GameManager.getGuaranteedBattleResource(floor);
    const maxDanger = 100 + (floor - 1) * 30;
    const currentDanger = this.dungeonDangerLevel || 0;
    const dangerRatio = currentDanger / maxDanger;
    const isHighDanger = dangerRatio >= 0.5; // 위험도 50% 이상: 고위험 심연 영역

    monsters.forEach(m => {
      const rew = m.rewards;
      if (!rew) return;

      const lootMult = isOvc ? 1.5 : 1.0;
      totGold += Math.ceil((rew.gold || 0) * lootMult);
      totGuaranteedAmt += Math.ceil((rew.ether || 0) * lootMult);
      
      const expMultBonus = isOvc ? 1.3 : 1.0;
      const rawExp = rew.exp || (m.level * 30 + Math.floor(m.maxHp * 0.05));
      baseTotalExp += Math.floor(rawExp * expMultBonus);

      // ─── 몬스터 등급 및 위험도별 재료 드랍 테이블 ───
      if (m.type === 'normal') {
        if (!isHighDanger) {
          // 🌿 [낮은 위험도]: 일반 파밍 재료 위주 (약초, 가죽, 실크, 석탄, 짐승 뼈)
          const lowPools: Record<number, string[]> = {
            1: ['herb', 'leather', 'bone'],
            2: ['leather', 'coal', 'silk', 'bone'],
            3: ['herb', 'coal', 'silk', 'bone'],
            4: ['silk', 'coal', 'leather', 'bone'],
            5: ['herb', 'silk', 'coal', 'bone'],
            6: ['leather', 'coal', 'bone'],
            7: ['silk', 'coal', 'bone'],
            8: ['leather', 'silk', 'bone'],
            9: ['coal', 'silk', 'bone'],
            10: ['coal', 'leather', 'silk', 'bone'],
          };
          const pool = lowPools[floor] || ['herb', 'leather', 'coal', 'silk', 'bone'];
          const picked = pool[Math.floor(Math.random() * pool.length)];
          const qty = Math.ceil((Math.floor(Math.random() * 2) + 1) * lootMult);
          rawResources[picked] = (rawResources[picked] || 0) + qty;
        } else {
          // 🔮 [높은 위험도]: 심연 유물 및 희귀 마도 재료 포함 (마력 수정, 공허 파편, 짐승 뼈, 고유 유물)
          const highPools: Record<number, string[]> = {
            1: ['crystal', 'herb', 'leather', 'bone'],
            2: ['crystal', 'coal', 'silk', 'bone'],
            3: ['crystal', 'void_shard', 'bone'],
            4: ['void_shard', 'crystal', 'bone'],
            5: ['void_shard', 'crystal', 'bone'],
            6: ['crystal', 'void_shard', 'bone'],
            7: ['void_shard', 'crystal', 'bone'],
            8: ['void_shard', 'crystal', 'bone'],
            9: ['void_shard', 'crystal', 'bone'],
            10: ['void_shard', 'crystal', 'bone'],
          };
          const pool = highPools[floor] || ['crystal', 'void_shard', 'bone'];
          const picked = pool[Math.floor(Math.random() * pool.length)];
          const qty = Math.ceil((Math.floor(Math.random() * 2) + 1) * lootMult);
          rawResources[picked] = (rawResources[picked] || 0) + qty;

          // 높은 위험도에서는 마력 수정/공허 파편 추가 획득
          if (Math.random() < 0.15) {
            const rareItem = Math.random() < 0.5 ? 'crystal' : 'void_shard';
            rawResources[rareItem] = (rawResources[rareItem] || 0) + 1;
          }
        }
      } else if (m.type === 'elite') {
        // ⭐ [정예 마물]: 접두석 / 접미석 확정 드랍 및 심연 수정/파편 획득
        if (floor <= 5) {
          const stone = Math.random() < 0.5 ? 'prefix_stone' : 'suffix_stone';
          rawResources[stone] = (rawResources[stone] || 0) + 1;
          this.addLog(`⭐ [정예 마물 전리품] [${stone === 'prefix_stone' ? '일반 접두석' : '일반 접미석'}] 1개를 획득했습니다!`, 'reward');
        } else {
          const pureStone = Math.random() < 0.5 ? 'pure_prefix_stone' : 'pure_suffix_stone';
          rawResources[pureStone] = (rawResources[pureStone] || 0) + 1;
          this.addLog(`⭐ [정예 마물 전리품] [${pureStone === 'pure_prefix_stone' ? '순수한 접두석' : '순수한 접미석'}] 1개를 획득했습니다!`, 'reward');
        }
        rawResources['crystal'] = (rawResources['crystal'] || 0) + Math.ceil(2 * lootMult);
        rawResources['void_shard'] = (rawResources['void_shard'] || 0) + Math.ceil(1 * lootMult);
      } else if (m.type === 'boss') {
        const curFloor = Math.min(10, Math.max(1, this.dungeonFloor));
        // 👑 [보스 토벌]: 접두석/접미석 + 층별 고유 유물 + 심연 유물 확정 드랍
        if (curFloor <= 5) {
          rawResources['prefix_stone'] = (rawResources['prefix_stone'] || 0) + 1;
          rawResources['suffix_stone'] = (rawResources['suffix_stone'] || 0) + 1;
        } else {
          rawResources['pure_prefix_stone'] = (rawResources['pure_prefix_stone'] || 0) + 1;
          rawResources['pure_suffix_stone'] = (rawResources['pure_suffix_stone'] || 0) + 1;
        }

        // 🌟 [보스 고유 장비 드랍율]: 1층 30%에서 시작하여 10층에서 15%까지 점진적 감소 (비호환 클래스 착용 시 스탯 50% 반감)
        const bossEquipDropRate = Number((0.30 - ((curFloor - 1) * (0.15 / 9))).toFixed(4));
        if (Math.random() < bossEquipDropRate) {
          const uniqueEquip = generateBossUniqueEquipment(curFloor);
          this.addToDungeonInventory(uniqueEquip.id, uniqueEquip.name, uniqueEquip.icon, 1, uniqueEquip);
          droppedEquips.push(uniqueEquip);
          this.addLog(`👑 [보스 고유 장비 획득!] ${curFloor}층 보스 세트 비보 [${uniqueEquip.name}]을(를) 획득했습니다! (드랍율: ${(bossEquipDropRate * 100).toFixed(1)}%)`, 'reward');
        }

        // 🌟 [광폭화 보스 전용 마도 비전서 드랍율]: 보스 마도서 획득 난이도에 맞춰 4%로 조정
        if (isOvc && rew.dropSkillBookId) {
          const ovcBookDropRate = 0.04;
          if (Math.random() < ovcBookDropRate) {
            const bDef = ALL_SKILL_BOOKS.find(b => b.id === rew.dropSkillBookId);
            if (bDef) {
              const bookItem: SkillBookItem = {
                id: `sb_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                bookId: bDef.id,
                name: bDef.name,
                rank: bDef.rank,
                rarity: bDef.rarity || getSkillBookRarity(bDef.rank),
                level: 1,
                basePower: bDef.skill.power,
                skill: { ...bDef.skill },
                description: bDef.description,
                icon: bDef.icon
              };
              this.addToDungeonInventory(bDef.id, bDef.name, bDef.icon, 1, undefined, bookItem, 'skillBook');
              droppedSkillBooks.push(bookItem);
              this.addLog(`👑📖 [광폭화 보스 전리품] [${bDef.name}]을(를) 획득하여 탐험 배낭에 보관했습니다! 성채 귀환 시 정산됩니다. (드랍율: ${(ovcBookDropRate * 100).toFixed(1)}%)`, 'reward');
            }
          }
        }

        rawResources['crystal'] = (rawResources['crystal'] || 0) + Math.ceil(3 * lootMult);
        rawResources['void_shard'] = (rawResources['void_shard'] || 0) + Math.ceil(2 * lootMult);

        // 🌟 각 층별 보스 토벌 퀘스트 목표 달성
        this.updateQuestObjective(`Q_SLAY_BOSS_0${curFloor}`, 0, 1);
        this.updateQuestObjective(`Q_SLAY_BOSS_${curFloor}`, 0, 1);

        // 🌟 다음 층 진입 포인트 영구 해금 (10층까지 확장)
        const nextFloor = Math.min(10, curFloor + 1);
        if (nextFloor > this.unlockedDungeonFloor) {
          this.unlockedDungeonFloor = nextFloor;
          this.addLog(`🌀 [심연 진입로 개방] ${curFloor}층 보스를 토벌하여 심연 ${nextFloor}층 진입 포인트가 성채 채비실에 영구 해금되었습니다!`, 'reward');
        }
      }

      // 📖 [몬스터 대표 스킬 마도서 드랍 시스템]
      // 각 마물이 드랍하는 마도서를 해당 마물의 대표 스킬 1가지로 엄격히 고정 (보스 4%, 엘리트 10%, 일반 마물 17.5%)
      const monsterSkillDropRate = m.type === 'boss' ? 0.04 : (m.type === 'elite' ? 0.10 : 0.175);
      if (m.skills && m.skills.length > 0 && Math.random() < monsterSkillDropRate) {
        // 1) 보스 몬스터이면서 전용 비전서(dropSkillBookId)가 정의되어 있는 경우: 해당 대표 비전서 드랍
        if (m.rewards?.dropSkillBookId) {
          const alreadyDropped = droppedSkillBooks.some(b => b.bookId === m.rewards?.dropSkillBookId);
          if (!alreadyDropped) {
            const bDef = ALL_SKILL_BOOKS.find(b => b.id === m.rewards.dropSkillBookId);
            if (bDef) {
              const cleanMonName = cleanMonsterNameForDrop(m.name);
              const bookItem: SkillBookItem = {
                id: `sb_drop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
                bookId: bDef.id,
                name: bDef.name,
                rank: bDef.rank,
                rarity: bDef.rarity || getSkillBookRarity(bDef.rank),
                level: 1,
                count: 1,
                basePower: bDef.skill.power,
                originMonsterName: cleanMonName,
                affinity: bDef.affinity,
                skill: { ...bDef.skill },
                description: bDef.description,
                icon: bDef.icon
              };
              this.addToDungeonInventory(bookItem.bookId, bookItem.name, bookItem.icon, 1, undefined, bookItem, 'skillBook');
              droppedSkillBooks.push(bookItem);
              const rMeta = GRIMOIRE_RARITY_META[bookItem.rarity || 'epic'];
              this.addLog(`📖 [보스 대표 마도서 드랍!] [${cleanMonName}]에게서 대표 비전서 [${bookItem.name}] (${rMeta.label})을(를) 획득했습니다!`, 'reward');
            }
          }
        } else {
          // 2) 일반/엘리트 및 기타 마물: 마물의 대표 스킬 (signatureSkillIndex 또는 0번 스킬) 1종으로 엄격히 고정
          const sigIdx = (m.signatureSkillIndex !== undefined && m.signatureSkillIndex >= 0 && m.signatureSkillIndex < m.skills.length)
            ? m.signatureSkillIndex
            : 0;
          const mSkill = m.skills[sigIdx] || m.skills[0];
          if (mSkill) {
            // 장비 등급 체계 일원화: common | rare | epic | legendary
            let rarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common';
            if (m.type === 'boss') {
              rarity = floor >= 6 ? 'legendary' : 'epic';
            } else if (m.type === 'elite') {
              rarity = floor >= 5 ? 'epic' : 'rare';
            } else {
              rarity = floor >= 7 ? 'rare' : 'common';
            }

            // 드랍 시점의 마도서 성능은 몬스터 원본 대비 50% 약화 (0.5배 기본값)
            const basePwr = mSkill.power || 1.0;
            const weakenedPower = Number((basePwr * 0.5).toFixed(2));
            const cleanMonName = cleanMonsterNameForDrop(m.name);
            const cleanMonId = (m.id || 'monster').replace(/_[A-Z]$/, '').replace(/_mon_\d+.*$/, '');
            const cleanSkillName = (mSkill.name || '비기').trim();
            const skillId = `skill_m_${cleanMonId}`;
            const bookId = `book_m_${cleanMonId}`;
            const isAoe = (mSkill.description || '').includes('전체') || (mSkill.description || '').includes('파티') || (mSkill.name || '').includes('전체');
            const cleanSkillDesc = adjustSkillDescriptionForDrop(mSkill.description || mSkill.name, basePwr, weakenedPower);
            const affinity = determineSkillAffinity(mSkill, cleanMonName);
            const affMeta = getSkillAffinityMeta(affinity);

            // 🌟 마스터 데이터 스튜디오 오버라이드 실시간 조회 및 적용
            const gds = GameDataService.getInstance();
            const bookOverride = gds.getSkillBookOverride(bookId);
            const finalPower = bookOverride?.power !== undefined ? bookOverride.power : Math.max(0.2, weakenedPower);
            const finalMana = bookOverride?.manaCost !== undefined ? bookOverride.manaCost : Math.max(10, Math.round(12 + floor * 1.5));
            const finalCooldown = bookOverride?.cooldown !== undefined ? bookOverride.cooldown : 1;
            const finalDesc = bookOverride?.description
              ? bookOverride.description
              : `[${affMeta.shortName} 계열] [${cleanMonName}의 대표 비기] ${cleanSkillDesc}`;

            const resolvedSkillIcon = getIconMeta(skillId)?.fallback || getIconMeta(bookId)?.fallback || '📖';
            const resolvedBookIcon = getIconMeta(bookId)?.fallback || '📖';

            const bookSkill: Skill = {
              id: skillId,
              name: cleanSkillName,
              description: finalDesc,
              icon: resolvedSkillIcon,
              manaCost: finalMana,
              cooldown: finalCooldown,
              targetType: isAoe ? 'all_enemies' : 'single_enemy',
              power: finalPower,
              effectType: (mSkill.effectType as any) || 'damage',
              statusDuration: mSkill.statusDuration || 2,
              affinity: affinity
            };

            this.customSkills[skillId] = bookSkill;
            ALL_SKILLS_MAP[skillId] = bookSkill;

            const bookItem: SkillBookItem = {
              id: `sb_drop_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
              bookId: bookId,
              name: `마도서: ${cleanSkillName}`,
              rank: rarity === 'legendary' ? 'mythic' : (rarity as any),
              rarity: rarity,
              level: 1,
              count: 1,
              basePower: finalPower,
              originMonsterName: cleanMonName,
              affinity: affinity,
              skill: bookSkill,
              description: bookOverride?.description
                ? `[${cleanMonName}]의 대표 기술을 결집한 마도서. ${bookOverride.description}`
                : `[${affMeta.name} 특화] [${cleanMonName}]의 대표 기술을 결집한 마도서. ${cleanSkillDesc} (비적합 계열 사용 시 위력 50% 반감)`,
              icon: resolvedBookIcon
            };

            this.addToDungeonInventory(bookItem.bookId, bookItem.name, bookItem.icon, 1, undefined, bookItem, 'skillBook');
            droppedSkillBooks.push(bookItem);
            const rMeta = GRIMOIRE_RARITY_META[rarity];
            this.addLog(`📖 [마도서 드랍!] [${cleanMonName}]에게서 대표 마도서 [${affMeta.icon} ${bookItem.name}] (${rMeta.label} · ${affMeta.name})을(를) 획득했습니다!`, 'reward');
          }
        }
      }

      if (rew.dropEquipment) {
        const corrupted = corruptEquipment(rew.dropEquipment);
        const added = this.addEquipmentToInventory(corrupted);
        droppedEquips.push(added);
        this.addLog(`🎁 [침식 장비 획득] [${corrupted.name}]을(를) 획득했습니다! (병기창 정화 필요)`, 'reward');
      }

      if (rew.dropEquipmentRecipeId) {
        const rec = EQUIPMENT_RECIPES.find(r => r.id === rew.dropEquipmentRecipeId);
        if (rec) {
          this.addLog(`📜 [장비 도안 획득] [${rec.name}] 단조 레시피를 해금했습니다!`, 'story');
        }
      }
    });

    // 🌟 6층 필드 연계 퀘스트: 핏빛 성역의 정화 작전 (6층 마물 토벌 카운트)
    if (floor === 6 && monsters.length > 0) {
      this.updateQuestObjective('Q_EXPEDITION_6F', 0, 1);
    }

    // ⚡ 오버차지 광폭화 보스 처치 특수 전리품
    if (isOvc) {
      const bossFloor = Math.min(11, Math.max(1, this.dungeonFloor));

      // 🌟 [광폭화 보스]: 에픽 퀘스트 클리어용 신화 유물 100% 확정 드랍!
      let relicKey: string | null = null;
      if (bossFloor <= 10) {
        relicKey = `relic_floor_${bossFloor}`;
      }

      if (relicKey) {
        rawResources[relicKey] = (rawResources[relicKey] || 0) + 1;
        const relicMeta = GameManager.getResourceMeta(relicKey);
        this.addLog(`👑 [광폭화 보스 토벌 신화 유물] 에픽 퀘스트 핵심 전리품 [${relicMeta.icon} ${relicMeta.name}]을(를) 100% 확정 획득했습니다!`, 'reward');
      }

      // 10층 광폭화 보스 격파 시 무간도(11F) 영구 해금
      if (bossFloor === 10) {
        if (this.unlockedDungeonFloor < 11) {
          this.unlockedDungeonFloor = 11;
          this.addLog(`🌌 [초월 엔드 컨텐츠 해금] 심연의 군주 아스모데우스를 완전 굴복시켰습니다! 끝없는 억겁의 심연 [무간도 (Avici, 11F)]가 개방되었습니다!`, 'story');
          this.activateQuest('Q_EPIC_AVICI_ENDING');
        }
      } else if (bossFloor === 11) {
        // 11층 무간도 광폭화 진 최종 보스 격파 시 최종 퀘스트 달성!
        this.updateQuestObjective('Q_EPIC_AVICI_ENDING', 0, 1);
        this.addLog(`✨🌌 [태초의 창세 승리] 무간도의 지배자 아르케오스의 광폭화를 잠재우고 모든 심연을 영구 봉인했습니다!`, 'story');
      }

      // 추가로 보스 고유 유니크 세트 장비도 100% 확정 드랍
      const uniqueEquip = generateBossUniqueEquipment(Math.min(10, bossFloor));
      this.addToDungeonInventory(uniqueEquip.id, uniqueEquip.name, uniqueEquip.icon, 1, uniqueEquip);
      droppedEquips.push(uniqueEquip);
      this.addLog(`👑 [광폭화 보스 전리품] 보스 고유 비보 [${uniqueEquip.name}]을(를) 획득했습니다!`, 'reward');

      // 접두석 및 접미석 확정 드랍
      rawResources['pure_prefix_stone'] = (rawResources['pure_prefix_stone'] || 0) + 1;
      rawResources['pure_suffix_stone'] = (rawResources['pure_suffix_stone'] || 0) + 1;
      this.addLog(`⭐🌌 [광폭화 보스 마도석] [순수한 접두석] 1개와 [순수한 접미석] 1개를 모두 획득했습니다!`, 'reward');

      rawResources['crystal'] = (rawResources['crystal'] || 0) + 3;
      rawResources['void_shard'] = (rawResources['void_shard'] || 0) + 3;

      this.addLog(`🏆⚡ [심연 오버차지 정복 대승리!] ${bossFloor === 11 ? '무간도' : `${bossFloor}층`} 광폭화 보스를 격파했습니다! (EXP +30%, 전리품 +50%)`, 'reward');
      this.isOvercharged = false;
      this.overchargedBossDefeatedOnFloor = bossFloor;
      if (!this.defeatedOverchargedFloorsThisRun.includes(bossFloor)) {
        this.defeatedOverchargedFloorsThisRun.push(bossFloor);
      }
      this.portalAppeared = true;
    }

    // 📜 [회고록 쪽지 드랍] 층마다 낮은 확률로 드랍 (보스 60%, 엘리트 25%, 일반 12%)
    const hasBoss = monsters.some(m => m.type === 'boss');
    const hasElite = monsters.some(m => m.type === 'elite');
    const noteDropRate = hasBoss ? 0.60 : (hasElite ? 0.25 : 0.12);
    if (floor <= 10 && Math.random() < noteDropRate) {
      const noteKey = `memoir_note_${floor}`;
      rawResources[noteKey] = (rawResources[noteKey] || 0) + 1;
      this.addLog(`📜 [회고록 쪽지 발견] ${floor}층의 서사가 적힌 [${floor}층 회고록 쪽지]를 발견했습니다! (심연의 백과 등록용)`, 'reward');
    }

    // 🏛️ [구세계 오파츠 드랍] 멸망 이전 세계의 흔적이 남은 백과 등록용 오파츠 (보스 45%, 엘리트 18%, 일반 8%)
    const oopartsDropRate = hasBoss ? 0.45 : (hasElite ? 0.18 : 0.08);
    if (floor <= 10 && Math.random() < oopartsDropRate) {
      const subIdx = Math.random() < 0.5 ? 1 : 2;
      const oopartsKey = `ooparts_${floor}_${subIdx}`;
      rawResources[oopartsKey] = (rawResources[oopartsKey] || 0) + 1;
      const oMeta = GameManager.getResourceMeta(oopartsKey);
      this.addLog(`🏛️✨ [멸망 이전 유물 발굴] 구세계의 오파츠 [${oMeta.name}]을(를) 발굴했습니다! (심연의 백과 등록용)`, 'reward');
    }

    // 🌟 [핵심] 전투 보상 획득 자원 종류를 최대 4가지로 엄격 제한 (가장 희귀/고가치 자원 우선)
    const priorityWeight: Record<string, number> = {
      relic_floor_1: 100, relic_floor_2: 100, relic_floor_3: 100, relic_floor_4: 100, relic_floor_5: 100,
      relic_floor_6: 100, relic_floor_7: 100, relic_floor_8: 100, relic_floor_9: 100, relic_floor_10: 100,
      pure_prefix_stone: 95, pure_suffix_stone: 95,
      ooparts_1_1: 93, ooparts_1_2: 93, ooparts_2_1: 93, ooparts_2_2: 93,
      ooparts_3_1: 93, ooparts_3_2: 93, ooparts_4_1: 93, ooparts_4_2: 93,
      ooparts_5_1: 93, ooparts_5_2: 93, ooparts_6_1: 93, ooparts_6_2: 93,
      ooparts_7_1: 93, ooparts_7_2: 93, ooparts_8_1: 93, ooparts_8_2: 93,
      ooparts_9_1: 93, ooparts_9_2: 93, ooparts_10_1: 93, ooparts_10_2: 93,
      memoir_note_1: 92, memoir_note_2: 92, memoir_note_3: 92, memoir_note_4: 92, memoir_note_5: 92,
      memoir_note_6: 92, memoir_note_7: 92, memoir_note_8: 92, memoir_note_9: 92, memoir_note_10: 92,
      prefix_stone: 90, suffix_stone: 90,
      crystal: 80, void_shard: 80, dark_essence: 75,
      silk: 60, coal: 55, bone: 52, leather: 50, herb: 45,
      iron: 40, stone: 35, wood: 30, food: 25
    };

    const sortedEntries = Object.entries(rawResources).sort((a, b) => {
      const weightA = priorityWeight[a[0]] || 20;
      const weightB = priorityWeight[b[0]] || 20;
      if (weightA !== weightB) return weightB - weightA;
      return b[1] - a[1];
    });

    const finalResources: Record<string, number> = {};
    const top4 = sortedEntries.slice(0, 4);
    for (const [res, amt] of top4) {
      finalResources[res] = amt;
      const meta = GameManager.getResourceMeta(res);
      this.addToDungeonInventory(res, meta.name, meta.icon, amt);
    }

    // 4종류를 초과하여 제외된 기타 자원은 1개당 5 골드로 자동 환산 보너스 지급 (골드 50% 감소)
    const discarded = sortedEntries.slice(4);
    if (discarded.length > 0) {
      let extraGold = 0;
      discarded.forEach(([_, amt]) => { extraGold += amt * 5; });
      totGold += extraGold;
    }

    // 📜 [심연의 백과] 골드 및 경험치 획득량 증가 보너스 합산
    const codex = this.getCodexBonus?.();
    if (codex?.goldBonusPct && codex.goldBonusPct > 0) {
      totGold = Math.ceil(totGold * (1 + codex.goldBonusPct / 100));
    }
    if (codex?.expBonusPct && codex.expBonusPct > 0) {
      baseTotalExp = Math.ceil(baseTotalExp * (1 + codex.expBonusPct / 100));
    }

    // 🌟 [층별 획득 경험치 캡 조정]
    // 1) 6층~10층: 획득 가능한 최대 경험치 캡 30% 감축 적용
    const floorExpCap6to10: Record<number, { normal: number; boss: number }> = {
      6: { normal: 315, boss: 595 },    // 기존: 일반 450, 보스 850 (-30%)
      7: { normal: 350, boss: 735 },    // 기존: 일반 500, 보스 1050 (-30%)
      8: { normal: 385, boss: 910 },    // 기존: 일반 550, 보스 1300 (-30%)
      9: { normal: 455, boss: 1155 },   // 기존: 일반 650, 보스 1650 (-30%)
      10: { normal: 595, boss: 1960 }   // 기존: 일반 850, 보스 2800 (-30%)
    };

    if (floor >= 6 && floor <= 10 && floorExpCap6to10[floor]) {
      const capRule = floorExpCap6to10[floor];
      const maxCap = hasBoss ? capRule.boss : capRule.normal;
      const effectiveCap = isOvc ? Math.floor(maxCap * 1.3) : maxCap;
      if (baseTotalExp > effectiveCap) {
        baseTotalExp = effectiveCap;
      }
    } else if (floor === 11 && !hasBoss) {
      // 2) 11층 무간도 일반 전투: 최소~최대 모두 절반 수준(기존 800~2500 -> 400~1250)으로 낮추고,
      //    위험도 1000 구간마다 최소 10%씩 복합 상승
      const danger1000Bracket = Math.floor(currentDanger / 1000);
      const danger1000ExpMult = 1 + danger1000Bracket * 0.10;
      const minCap = Math.floor(400 * danger1000ExpMult);
      const maxCap = Math.floor(1250 * danger1000ExpMult);
      const effectiveMin = isOvc ? Math.floor(minCap * 1.3) : minCap;
      const effectiveMax = isOvc ? Math.floor(maxCap * 1.3) : maxCap;
      baseTotalExp = Math.max(effectiveMin, Math.min(effectiveMax, baseTotalExp));
    }

    this.addToDungeonInventory('gold', '골드', '🪙', totGold);
    this.addToDungeonInventory(guaranteedRes.key, guaranteedRes.name, guaranteedRes.icon, totGuaranteedAmt);

    // 퀘스트 갱신
    this.quests.filter(q => q.status === 'active' && (q.type === 'sub' || q.type === 'repeatable')).forEach(subQ => {
      const slayObj = subQ.objectives.find(o => o.description.includes('마물') || o.description.includes('처치'));
      if (slayObj && !slayObj.isCompleted) {
        slayObj.current = Math.min(slayObj.required, slayObj.current + monsters.length);
        if (slayObj.current >= slayObj.required) slayObj.isCompleted = true;
      }
    });

    // EXP 파티 분배
    const partySize = Math.max(this.party.filter(h => h.currentHp > 0).length, 1);
    const avgMonsterLvl = Math.round(monsters.reduce((acc, m) => acc + m.level, 0) / monsters.length);

    this.party.filter(h => h.currentHp > 0).forEach(hero => {
      const prevLvl = hero.level;
      const levelDiff = avgMonsterLvl - hero.level;
      const expMult = Math.max(0.5, Math.min(2.0, 1.0 + levelDiff * 0.15));
      const heroExp = Math.floor((baseTotalExp / partySize) * expMult);
      this.gainExp(hero, heroExp);
      if (hero.level > prevLvl) {
        levelUps.push(`${hero.name} (Lv.${prevLvl} ➔ Lv.${hero.level})`);
      }
    });

    // 💖 [전투 승리 전우애] 사선을 함께 넘긴 파티원 간 유대감 증가 (기본 +1, 신규/소외 대원 +2 보너스)
    const aliveParty = this.party.filter(h => h.currentHp > 0);
    for (let i = 0; i < aliveParty.length; i++) {
      for (let j = i + 1; j < aliveParty.length; j++) {
        const curBond = this.getBond(aliveParty[i].id, aliveParty[j].id);
        // 유대감이 25 미만인 초면/신규 관계일 때 사선 승리 전우애 보너스로 +2, 일반 +1
        const bondGain = curBond < 25 ? 2 : 1;
        this.increaseBond(aliveParty[i].id, aliveParty[j].id, bondGain);
      }
    }

    this.saveGame();

    const totEther = guaranteedRes.key === 'ether' ? totGuaranteedAmt : 0;

    return {
      gold: totGold,
      ether: totEther,
      guaranteedResource: {
        key: guaranteedRes.key,
        name: guaranteedRes.name,
        icon: guaranteedRes.icon,
        amount: totGuaranteedAmt
      },
      exp: baseTotalExp,
      resources: finalResources,
      equipment: droppedEquips,
      skillBooks: droppedSkillBooks,
      levelUps
    };
  }


  // ================= 유틸리티: 저장/불러오기 =================
  /** 전투 승리 시 층수별 확정 획득 특수 자원 정의 (1~3F: 석재, 4~5F: 철광석, 6~8F: 에테르, 9F+: 공허 파편) */
  public static getGuaranteedBattleResource(floor: number): { key: 'stone' | 'iron' | 'ether' | 'void_shard'; name: string; icon: string } {
    const f = Math.max(1, floor || 1);
    if (f <= 3) {
      return { key: 'stone', name: '석재', icon: '🪨' };
    } else if (f <= 5) {
      return { key: 'iron', name: '철광석', icon: '⚙️' };
    } else if (f <= 8) {
      return { key: 'ether', name: '에테르', icon: '✨' };
    } else {
      return { key: 'void_shard', name: '공허 파편', icon: '🌌' };
    }
  }

  /** expToNext = 100 + (level-1)×80 */
  public static getResourceMeta(key: string | number | keyof GameResources): { name: string; icon: string } {
    const kStr = String(key);
    const map: Record<string, { name: string; icon: string }> = {
      gold: { name: '골드', icon: '🪙' },
      ether: { name: '에테르', icon: '✨' },
      wood: { name: '목재', icon: '🪵' },
      stone: { name: '석재', icon: '🪨' },
      iron: { name: '철광석', icon: '⚙️' },
      food: { name: '식량', icon: '🍖' },
      herb: { name: '약초', icon: '🌿' },
      bone: { name: '짐승 뼈', icon: '🦴' },
      leather: { name: '가죽', icon: '🥋' },
      silk: { name: '실크', icon: '🕸️' },
      coal: { name: '석탄', icon: '⬛' },
      crystal: { name: '마력수정', icon: '💎' },
      void_shard: { name: '공허파편', icon: '🌌' },
      dark_essence: { name: '암흑 정수', icon: '🌑' },
      prefix_stone: { name: '일반 접두석', icon: '⭐' },
      suffix_stone: { name: '일반 접미석', icon: '🔮' },
      pure_prefix_stone: { name: '순수 접두석', icon: '🌟' },
      pure_suffix_stone: { name: '순수 접미석', icon: '🪐' },
      relic_floor_1: { name: '침묵의 흑핵', icon: '🔮' },
      relic_floor_2: { name: '망령의 영혼수정', icon: '💠' },
      relic_floor_3: { name: '원초의 광맥 심장', icon: '🫀' },
      relic_floor_4: { name: '심연의 시공 닻', icon: '⚓' },
      relic_floor_5: { name: '공허 지배자의 모노리스 핵', icon: '👑' },
      relic_floor_6: { name: '핏빛 대공의 진홍 성배', icon: '🍷' },
      relic_floor_7: { name: '망각 묘지기의 영혼 나침반', icon: '🧭' },
      relic_floor_8: { name: '단죄의 기사단장 맹세 휘장', icon: '🎖️' },
      relic_floor_9: { name: '미궁 지배자의 진실 거울 파편', icon: '🪞' },
      relic_floor_10: { name: '심연 군주의 옥새', icon: '👑' },
      torch: { name: '횃불', icon: '🔥' },
      pickaxe: { name: '곡괭이', icon: '⛏️' },
      bandage: { name: '붕대', icon: '🩹' },
      holy_water: { name: '정화의 성수', icon: '💧' },
      key: { name: '던전 열쇠', icon: '🗝️' },
      skeleton_key: { name: '녹슨 만능열쇠', icon: '🗝️' },
      golden_toad: { name: '황금 두꺼비', icon: '🐸' },
      compass: { name: '차원의 나침반', icon: '🧭' },
      blood_contract: { name: '피의 서약서', icon: '📜' },
      dimensional_whistle: { name: '차원의 호각', icon: '📯' },
      rift_anchor: { name: '균열의 닻', icon: '⚓' },
      potion: { name: '체력 포션', icon: '🧪' },
      // ✨ 강화 보급품 7종
      enhanced_torch: { name: '에테르 횃불', icon: '✨🔥' },
      enhanced_food: { name: '던전 도시락', icon: '🍱' },
      enhanced_pickaxe: { name: '심연 곡괭이', icon: '⛏️✨' },
      enhanced_bandage: { name: '성유 붕대', icon: '🩹✨' },
      enhanced_holy_water: { name: '여신의 성수', icon: '💧✨' },
      enhanced_key: { name: '황금 열쇠', icon: '🗝️✨' },
      enhanced_rift_anchor: { name: '심연의 닻', icon: '⚓✨' },
      gold_bag: { name: '골드', icon: '🪙' },
      // 📜 1F~10F 회고록 쪽지
      memoir_note_1: { name: '1층 회고록 쪽지', icon: '📜' },
      memoir_note_2: { name: '2층 회고록 쪽지', icon: '📜' },
      memoir_note_3: { name: '3층 회고록 쪽지', icon: '📜' },
      memoir_note_4: { name: '4층 회고록 쪽지', icon: '📜' },
      memoir_note_5: { name: '5층 회고록 쪽지', icon: '📜' },
      memoir_note_6: { name: '6층 회고록 쪽지', icon: '📜' },
      memoir_note_7: { name: '7층 회고록 쪽지', icon: '📜' },
      memoir_note_8: { name: '8층 회고록 쪽지', icon: '📜' },
      memoir_note_9: { name: '9층 회고록 쪽지', icon: '📜' },
      memoir_note_10: { name: '10층 회고록 쪽지', icon: '📜' },
      // 🏛️ 1F~10F 고대 오파츠 (구세계 유물)
      ooparts_1_1: { name: '금이 간 스마트폰 액정', icon: '📱' },
      ooparts_1_2: { name: '녹슨 스테인리스 텀블러', icon: '🥤' },
      ooparts_2_1: { name: '빛바랜 플라스틱 신용카드', icon: '💳' },
      ooparts_2_2: { name: '먼지 쌓인 카세트 테이프', icon: '📼' },
      ooparts_3_1: { name: '방전된 리튬 배터리', icon: '🔋' },
      ooparts_3_2: { name: '금이 간 세라믹 머그잔', icon: '☕' },
      ooparts_4_1: { name: '찢겨진 지하철 노선도', icon: '🗺️' },
      ooparts_4_2: { name: '멈춰버린 쿼츠 손목시계', icon: '⌚' },
      ooparts_5_1: { name: '부서진 헤드폰', icon: '🎧' },
      ooparts_5_2: { name: '비닐 코팅된 학생증', icon: '🪪' },
      ooparts_6_1: { name: '녹슨 와인 오프너', icon: '🍷' },
      ooparts_6_2: { name: '말라붙은 립스틱 케이스', icon: '💄' },
      ooparts_7_1: { name: '빛바랜 폴라로이드 사진', icon: '📷' },
      ooparts_7_2: { name: '굳어버린 3색 볼펜', icon: '🖊️' },
      ooparts_8_1: { name: '부서진 무전기 트랜시버', icon: '📻' },
      ooparts_8_2: { name: '찌그러진 티타늄 안경테', icon: '👓' },
      ooparts_9_1: { name: '홀로그램 디스플레이 큐브', icon: '🧊' },
      ooparts_9_2: { name: '녹아내린 카메라 렌즈', icon: '🔍' },
      ooparts_10_1: { name: '양자 코어 칩셋', icon: '💾' },
      ooparts_10_2: { name: '타임캡슐 황동 열쇠', icon: '🗝️' },
    };
    const defaultMeta = map[kStr] || { name: kStr, icon: '📦' };
    const currentLang = I18nService.getInstance().getLanguage();
    if (currentLang !== 'ko' && RESOURCE_NAMES[kStr]?.[currentLang]) {
      return { name: RESOURCE_NAMES[kStr][currentLang], icon: defaultMeta.icon };
    }
    return defaultMeta;
  }

  public static readonly MAX_HERO_LEVEL = 99;

  public static calcExpToNext(level: number): number {
    if (level >= GameManager.MAX_HERO_LEVEL) {
      return Infinity;
    }
    // 기본 전체 성장 곡선 (2레벨 달성 요구치 100에서 시작하는 이차함수 곡선)
    const baseExp = 100 + (level - 1) * 30 + Math.pow(level - 1, 2) * 2;
    
    // 1~10레벨 구간은 전체 곡선 대비 20% 낮은 수치로 보정
    if (level <= 10) {
      return Math.floor(baseExp * 0.8);
    }
    
    return Math.floor(baseExp);
  }

  public addExpToHero(hero: Mercenary, amount: number): void {
    this.gainExp(hero, amount);
  }

  public gainExp(hero: Mercenary, amount: number): void {
    if (hero.level >= GameManager.MAX_HERO_LEVEL) {
      hero.level = GameManager.MAX_HERO_LEVEL;
      hero.exp = 0;
      hero.expToNext = Infinity;
      return;
    }

    // 🌟 레벨 구간별 동적 경험치 부스트 (Lv 1~10: 1.5배(+50% 부스트) / Lv 11+: 1배 정상치)
    let levelMult = 1.0;
    if (hero.level <= 10) {
      levelMult = 1.5;
    }
    amount = Math.round(amount * levelMult);

    if (this.bonfireWarmthTime > 0 && this.bonfireStacks >= 5) {
      amount = Math.ceil(amount * 1.20); // 전투 경험치 20% 버프
    }

    // 🌟 [영혼의 제단]: 클래스 티어별 추가 경험치 버프
    // - 기본 클래스 (Tier 0): 2레벨부터 레벨당 +10% (5레벨 최대 50%)
    // - 1차 각성 클래스 (Tier 1): 6레벨부터 레벨당 +10% (10레벨 최대 40%)
    let sanctExpBonus = 0;
    const sanct = this.buildings['sanctuary'];
    if (sanct && sanct.level >= 2 && !sanct.isPaused) {
      const cls = CHARACTER_CLASSES[hero.classId];
      const tier = cls?.tier ?? 0;
      if (tier === 0) {
        sanctExpBonus = Math.min(0.50, sanct.level * 0.10);
      } else if (tier === 1 && sanct.level >= 6) {
        sanctExpBonus = Math.min(0.40, (sanct.level - 5) * 0.10);
      }
    }
    if (sanctExpBonus > 0) {
      amount = Math.ceil(amount * (1 + sanctExpBonus));
    }

    // 🪦 [묘비 헌화 영령의 인도]: 기본 10% + 영웅 1명 추가당 +5% (최대 5명 30%), 5분 지속
    let memorialExpBonus = 0;
    let memorialExpPct = 0;
    if (this.memorialExpBuffUntil > Date.now() && this.cemetery.length > 0) {
      const heroCount = Math.min(5, this.cemetery.length);
      memorialExpPct = Math.min(30, 10 + (heroCount - 1) * 5);
      memorialExpBonus = memorialExpPct / 100;
      amount = Math.ceil(amount * (1 + memorialExpBonus));
    }

    // 경험치 성장 곡선 실시간 보정
    hero.expToNext = GameManager.calcExpToNext(hero.level);

    hero.exp += amount;
    const sanctTag = sanctExpBonus > 0 ? ` (제단 EXP +${Math.round(sanctExpBonus * 100)}%)` : '';
    const memTag = memorialExpBonus > 0 ? ` (추모 헌화 EXP +${memorialExpPct}%)` : '';
    this.addLog(`⭐ [EXP] ${hero.name} +${amount} EXP${sanctTag}${memTag} (${hero.exp}/${hero.expToNext})`, 'system');

    while (hero.level < GameManager.MAX_HERO_LEVEL && hero.exp >= hero.expToNext) {
      hero.exp -= hero.expToNext;
      this.levelUp(hero);
    }

    if (hero.level >= GameManager.MAX_HERO_LEVEL) {
      hero.level = GameManager.MAX_HERO_LEVEL;
      hero.exp = 0;
      hero.expToNext = Infinity;
    }
  }

  public levelUp(hero: Mercenary): void {
    if (hero.level >= GameManager.MAX_HERO_LEVEL) {
      hero.level = GameManager.MAX_HERO_LEVEL;
      hero.exp = 0;
      hero.expToNext = Infinity;
      return;
    }

    const prevBase = GameManager.calcHeroStatsForClassAndLevel(
      hero.classId,
      hero.level,
      hero.grade,
      hero.trait || hero.title,
      hero.promotionBonuses,
      hero.awakeningBonuses
    );

    hero.level += 1;
    hero.expToNext = GameManager.calcExpToNext(hero.level);

    const computed = GameManager.calcHeroStatsForClassAndLevel(
      hero.classId,
      hero.level,
      hero.grade,
      hero.trait || hero.title,
      hero.promotionBonuses,
      hero.awakeningBonuses
    );
    hero.maxHp = computed.maxHp;
    hero.currentHp = hero.maxHp;   // 레벨업 시 HP 완전 회복
    hero.maxMp = computed.maxMp;
    hero.currentMp = hero.maxMp;
    hero.stats.atk = computed.stats.atk;
    hero.stats.def = computed.stats.def;
    hero.stats.spd = computed.stats.spd;
    hero.stats.luck = computed.stats.luck;

    // 🌟 레벨업 후 장비 유효 스탯 재동기화 (장비 능력치 보존)
    this.syncHeroStats(hero);

    const cClass = CHARACTER_CLASSES[hero.classId] || CHARACTER_CLASSES['squire'];
    const tier = cClass.tier ?? 0;
    const tierReq1 = 10;   // Tier 0→1 전직 최소 레벨
    const tierReq2 = 30;  // Tier 1→2 전직 최소 레벨
    const tierReq3 = 60;  // Tier 2→3 최종 전직 최소 레벨
    let promotionHint = '';
    if (tier === 0 && hero.level >= tierReq1) {
      promotionHint = ' ★ [전직 해금] 영지 병영에서 1차 전직 가능!';
    } else if (tier === 1 && hero.level >= tierReq2) {
      promotionHint = ' ★ [전직 해금] 영지 병영에서 2차 전직 가능!';
    } else if (tier === 2 && hero.level >= tierReq3) {
      promotionHint = ' 👑 [최종 3차 전직 해금] 영지 병영에서 궁극 3차 전직 가능!';
    } else if (tier === 2) {
      const nextAwakenLv = 30 + ((hero.awakeningCount || 0) + 1) * 10;
      if (hero.level >= nextAwakenLv) {
        promotionHint = ` 🔮 [초월 각성 해금] 영지 원정단 편성에서 ${(hero.awakeningCount || 0) + 1}단계 각성 가능!`;
      }
    }

    const hpDiff = Math.round(computed.maxHp - prevBase.maxHp);
    const mpDiff = Math.round(computed.maxMp - prevBase.maxMp);
    const atkDiff = Math.round(computed.stats.atk - prevBase.stats.atk);
    const defDiff = Math.round(computed.stats.def - prevBase.stats.def);
    const spdDiff = Math.round(computed.stats.spd - prevBase.stats.spd);
    const luckDiff = Math.round((computed.stats.luck - prevBase.stats.luck) * 10) / 10;

    this.addLog(
      `🎉 [레벨업] ${hero.name} Lv.${hero.level}! (HP+${hpDiff} MP+${mpDiff} ATK+${atkDiff} DEF+${defDiff} SPD+${spdDiff} 🍀행운+${luckDiff})${promotionHint}`,
      'reward'
    );
    this.emit('partyUpdated', this.party);
  }

  public togglePartyMember(heroId: string): void {
    this.reconcileParty();
    const hero = this.barracks.find(h => h.id === heroId);
    if (!hero) return;

    const inPartyIdx = this.party.findIndex(p => p.id === heroId);
    if (inPartyIdx !== -1) {
      if (this.party.length <= 1) {
        this.addLog('파티에는 최소 1명의 용병이 출전해야 합니다.', 'danger');
        return;
      }
      this.party.splice(inPartyIdx, 1);
      this.addLog(`[파티 제외] ${hero.name} 용병이 원정대에서 대기 상태로 전환되었습니다.`, 'system');
    } else {
      // 🏥 생체 복원 병동 입원 중인 용병은 파티 출전 불가
      if (this.infirmaryPatients.includes(heroId)) {
        this.addLog(`⚠️ [생체 복원 병동] ${hero.name}은(는) 현재 입원 치료 중이므로 파티에 출전할 수 없습니다. 병동에서 퇴원 후 편성해 주세요.`, 'danger');
        return;
      }

      if (this.party.length >= 3) {
        this.addLog('원정대 파티는 최대 3명까지 편성할 수 있습니다. 기존 파티원을 먼저 제외하세요.', 'danger');
        return;
      }
      this.party.push(hero);
      this.addLog(`[파티 참가] ${hero.name} 용병이 원정대 파티에 참가했습니다!`, 'reward');
    }

    this.reconcileParty();
    this.emit('partyUpdated', this.party);
    this.emit('update');
    this.saveGame();
  }

  public sortPartyByPosition(): void {
    const POS_ORDER: Record<string, number> = { front: 1, mid: 2, back: 3 };
    this.party.sort((a, b) => {
      const orderA = POS_ORDER[a.position || 'mid'] ?? 2;
      const orderB = POS_ORDER[b.position || 'mid'] ?? 2;
      return orderA - orderB;
    });
  }

  public setHeroPosition(heroId: string, newPos: PositionSlot): void {
    const hero = this.party.find(h => h.id === heroId);
    if (hero) {
      hero.position = newPos;
      this.addLog(`[진형 변경] ${hero.name}의 위치가 [${newPos === 'front' ? '전열' : newPos === 'mid' ? '중앙' : '후방'}]으로 배치되었습니다.`, 'normal');
      this.emit('partyUpdated', this.party);
      this.saveGame();
    }
  }

  public getActiveSynergies(): PartySynergy[] {
    const list = calculatePartySynergies(this.party);
    if (this.activeAncestralBlessing && this.activeAncestralBlessing.buffs) {
      list.push({
        id: `ancestral_${this.activeAncestralBlessing.heroId}`,
        name: this.activeAncestralBlessing.name,
        icon: this.activeAncestralBlessing.icon,
        category: 'ancestral',
        description: this.activeAncestralBlessing.description,
        conditionText: '다음 원정 1회 결속',
        buffs: this.activeAncestralBlessing.buffs,
      });
    }
    if (this.expeditionBuffs && this.expeditionBuffs.length > 0) {
      list.push(...this.expeditionBuffs);
    }
    return list;
  }

  /** ✨ 이번 원정 동안 유지되는 가호/버프 시너지 부여 */
  public addExpeditionBuff(buff: PartySynergy): void {
    if (!this.expeditionBuffs) {
      this.expeditionBuffs = [];
    }
    // 동일 ID가 있으면 덮어쓰기/갱신, 없으면 추가
    const existingIdx = this.expeditionBuffs.findIndex(b => b.id === buff.id);
    if (existingIdx >= 0) {
      this.expeditionBuffs[existingIdx] = buff;
    } else {
      this.expeditionBuffs.push(buff);
    }
    this.emit('partyUpdated', this.party);
  }

  /** 🧹 이번 원정 가호/버프 초기화 (원정 종료 / 귀환 시 호출) */
  public clearExpeditionBuffs(): void {
    this.expeditionBuffs = [];
    this.emit('partyUpdated', this.party);
  }

  public promoteMercenary(
    heroId: string,
    targetClassId: string,
    chosenStat: 'hp' | 'mp' | 'atk' | 'def' | 'spd' | 'luck' = 'atk'
  ): boolean {
    const hero = this.barracks.find(h => h.id === heroId);
    const targetClass = CHARACTER_CLASSES[targetClassId];
    if (!hero || !targetClass) return false;

    const etherCost = targetClass.tier === 1 ? 20 : (targetClass.tier === 2 ? 100 : 300);
    const goldCost = targetClass.tier === 1 ? 500 : (targetClass.tier === 2 ? 3000 : 10000);

    if (this.resources.ether < etherCost || this.resources.gold < goldCost) {
      this.addLog(`전직 실패: 에테르(${etherCost}) 또는 골드(${goldCost})가 부족합니다.`, 'danger');
      return false;
    }

    this.modifyResource('ether', -etherCost);
    this.modifyResource('gold', -goldCost);

    // 🌟 제단 레벨에 따른 등급 업그레이드 확률 (레벨당 3%)
    const sanctuaryLv = this.buildings['sanctuary']?.level || 1;
    const upgradeChance = Math.min(100, sanctuaryLv * 3);
    const GRADE_ORDER: MercenaryGrade[] = ['rookie', 'veteran', 'hero', 'epic', 'legend'];
    const GRADE_NAMES: Record<string, string> = {
      rookie: '노비스(N)', veteran: '베테랑(V)', hero: '히어로(H)', elite: '히어로(H)', epic: '에픽(E)', legend: '레전드(L)'
    };
    const GRADE_STAT_MULT: Record<MercenaryGrade, number> = {
      rookie: 1.0,
      veteran: 1.20,
      hero: 1.45,
      elite: 1.45,
      epic: 1.75,
      legend: 2.10
    };

    let gradeUpgraded = false;
    const prevGrade = hero.grade;
    const curIdx = GRADE_ORDER.indexOf(hero.grade === 'elite' ? 'hero' : hero.grade);

    if (curIdx !== -1 && curIdx < GRADE_ORDER.length - 1) {
      const roll = Math.random() * 100;
      if (roll < upgradeChance) {
        hero.grade = GRADE_ORDER[curIdx + 1];
        gradeUpgraded = true;
      }
    }

    // 전직 전 클래스 및 스킬, 순수 기본 스탯 기록 (비교 로그 및 스킬 보존용)
    const prevClassId = hero.classId;
    const prevClass = CHARACTER_CLASSES[prevClassId];
    const prevClassSkillIds = prevClass ? prevClass.skills.map(s => s.id) : [];

    const prevBase = GameManager.calcHeroStatsForClassAndLevel(
      prevClassId,
      hero.level,
      hero.grade,
      hero.trait || hero.title,
      hero.promotionBonuses,
      hero.awakeningBonuses
    );
    const prevMaxHp = prevBase.maxHp;
    const prevAtk = prevBase.stats.atk;
    const prevDef = prevBase.stats.def;

    hero.classId = targetClassId;
    hero.portraitPromptKey = targetClass.promptKey;

    if (!Array.isArray(hero.promotionBonuses)) {
      hero.promotionBonuses = [];
    }
    if (chosenStat) {
      hero.promotionBonuses.push(chosenStat);
    }

    // 🌟 전직 시 선택한 1가지 스탯 +30% 집중 증폭 & 나머지 스탯은 레벨업 상당 완만한 증가 반영
    const computed = GameManager.calcHeroStatsForClassAndLevel(
      targetClassId,
      hero.level,
      hero.grade,
      hero.trait || hero.title,
      hero.promotionBonuses,
      hero.awakeningBonuses
    );
    hero.maxHp = computed.maxHp;
    hero.currentHp = hero.maxHp;
    hero.maxMp = computed.maxMp;
    hero.currentMp = hero.maxMp;
    hero.stats.atk = computed.stats.atk;
    hero.stats.def = computed.stats.def;
    hero.stats.spd = computed.stats.spd;
    hero.stats.luck = computed.stats.luck;

    // 🌟 전직 완료 후 장비 유효 스탯 재동기화 (장비 능력치 보존)
    this.syncHeroStats(hero);

    // 🌟 전직 시 기존 스킬과 학습한 스킬은 사라지지 않고 모두 학습한 스킬(learnedSkills)로 보존 (최대 6개)
    const targetClassSkillIds = targetClass.skills.map(s => s.id);

    // 신규 클래스 기본 스킬 2개를 우선 장착 슬롯에 배치
    hero.equippedSkills = targetClassSkillIds.slice(0, 2);

    // 기존 학습 스킬 + 이전 클래스 스킬 + 신규 클래스 스킬 중복 없이 통합 보존 (최대 6개)
    const combinedSkills = Array.from(new Set([
      ...targetClassSkillIds,
      ...(hero.learnedSkills || []),
      ...prevClassSkillIds,
      ...(hero.equippedSkills || [])
    ]));
    const specialSkillIds = new Set(Object.values(CHARACTER_CLASSES).map(c => c.specialSkill.id));
    specialSkillIds.add('acolyte_blessing');
    hero.learnedSkills = combinedSkills.filter(sid => !specialSkillIds.has(sid)).slice(0, 6);

    if (gradeUpgraded) {
      this.addLog(`👑 [영혼 승격 대성공!] 제단(Lv.${sanctuaryLv}, 확률 ${upgradeChance}%)의 축복으로 [${hero.name}]님의 등급이 [${GRADE_NAMES[prevGrade] || prevGrade}] ➔ [${GRADE_NAMES[hero.grade] || hero.grade}] (으)로 각성하여 모든 스탯이 대폭 상승했습니다!`, 'reward');
    }

    this.addLog(`★ [전직 각성 완료] [${hero.name}]님이 [${targetClass.name}] (Lv.${hero.level}, ${hero.grade.toUpperCase()})으로 승급했습니다! [기본 능력치 HP: ${prevMaxHp}➔${computed.maxHp}, ATK: ${prevAtk}➔${computed.stats.atk}, DEF: ${prevDef}➔${computed.stats.def}, 🍀행운: ${computed.stats.luck}] + 고유오의 [${targetClass.specialSkill.name}] 개화!`, 'reward');

    if (targetClass.tier === 1) {
      this.updateQuestObjective('Q_BUILD_SANCTUARY', 1, 1);
    }

    this.emit('heroPromoted', hero);
    this.saveGame();
    return true;
  }

  public promoteHero(
    heroId: string,
    targetClassId: string,
    chosenStat: 'hp' | 'mp' | 'atk' | 'def' | 'spd' | 'luck' = 'atk'
  ): boolean {
    return this.promoteMercenary(heroId, targetClassId, chosenStat);
  }

  /** 🔮 2차 전직 이후 10레벨마다 거행하는 초월 각성 시스템 */
  public awakenMercenary(
    heroId: string,
    chosenStat: 'hp' | 'mp' | 'atk' | 'def' | 'spd' | 'luck' = 'atk'
  ): boolean {
    const hero = this.barracks.find(h => h.id === heroId);
    if (!hero) return false;

    const cClass = CHARACTER_CLASSES[hero.classId];
    if (!cClass || (cClass.tier || 0) < 2) {
      this.addLog(`각성 불가: 2차 전직을 완료한 용병만 초월 각성을 진행할 수 있습니다.`, 'danger');
      return false;
    }

    const currentCount = hero.awakeningCount || 0;
    const reqLevel = 30 + (currentCount + 1) * 10;
    if (hero.level < reqLevel) {
      this.addLog(`각성 불가: Lv.${reqLevel} 이상에 도달해야 ${currentCount + 1}단계 각성을 진행할 수 있습니다. (현재 Lv.${hero.level})`, 'danger');
      return false;
    }

    const sanctuaryLv = this.buildings['sanctuary']?.level || 1;
    if (sanctuaryLv < 5) {
      this.addLog(`각성 불가: 영혼의 제단이 Lv.5 이상이어야 초월 각성을 거행할 수 있습니다.`, 'danger');
      return false;
    }

    const etherCost = 50 + currentCount * 25;
    const goldCost = 1500 + currentCount * 1000;

    if (this.resources.ether < etherCost || this.resources.gold < goldCost) {
      this.addLog(`각성 실패: 에테르(${etherCost}) 또는 골드(${goldCost})가 부족합니다.`, 'danger');
      return false;
    }

    this.modifyResource('ether', -etherCost);
    this.modifyResource('gold', -goldCost);

    // 🌟 각성마다 등급 승격 진화 확률 증가
    // 제단 레벨당 3% + 각성 차수당 +10% (1단계: +10%, 2단계: +20%, 3단계: +30% ...)
    const stepBonus = (currentCount + 1) * 10;
    const upgradeChance = Math.min(100, (sanctuaryLv * 3) + stepBonus);
    const GRADE_ORDER: MercenaryGrade[] = ['rookie', 'veteran', 'hero', 'epic', 'legend'];
    const GRADE_NAMES: Record<string, string> = {
      rookie: '노비스(N)', veteran: '베테랑(V)', hero: '히어로(H)', elite: '히어로(H)', epic: '에픽(E)', legend: '레전드(L)'
    };

    let gradeUpgraded = false;
    const prevGrade = hero.grade;
    const curIdx = GRADE_ORDER.indexOf(hero.grade === 'elite' ? 'hero' : hero.grade);

    if (curIdx !== -1 && curIdx < GRADE_ORDER.length - 1) {
      const roll = Math.random() * 100;
      if (roll < upgradeChance) {
        hero.grade = GRADE_ORDER[curIdx + 1];
        gradeUpgraded = true;
      }
    }

    // 각성 전 기본 스탯 기록 (비교 로그용)
    const prevBase = GameManager.calcHeroStatsForClassAndLevel(
      hero.classId,
      hero.level,
      hero.grade,
      hero.trait || hero.title,
      hero.promotionBonuses,
      hero.awakeningBonuses
    );
    const prevMaxHp = prevBase.maxHp;
    const prevAtk = prevBase.stats.atk;
    const prevDef = prevBase.stats.def;
    const prevSpd = prevBase.stats.spd;
    const prevLuck = prevBase.stats.luck;

    if (!Array.isArray(hero.awakeningBonuses)) {
      hero.awakeningBonuses = [];
    }
    hero.awakeningBonuses.push(chosenStat);
    hero.awakeningCount = (hero.awakeningCount || 0) + 1;

    const computed = GameManager.calcHeroStatsForClassAndLevel(
      hero.classId,
      hero.level,
      hero.grade,
      hero.trait || hero.title,
      hero.promotionBonuses,
      hero.awakeningBonuses
    );

    hero.maxHp = computed.maxHp;
    hero.currentHp = hero.maxHp;
    hero.maxMp = computed.maxMp;
    hero.currentMp = hero.maxMp;
    hero.stats.atk = computed.stats.atk;
    hero.stats.def = computed.stats.def;
    hero.stats.spd = computed.stats.spd;
    hero.stats.luck = computed.stats.luck;

    // 🌟 초월 각성 완료 후 장비 유효 스탯 재동기화 (장비 능력치 보존)
    this.syncHeroStats(hero);

    const STAT_NAMES: Record<string, string> = {
      hp: '체력(HP)', mp: '마나(MP)', atk: '공격력(ATK)', def: '방어력(DEF)', spd: '속도(SPD)', luck: '행운(LUK)'
    };

    if (gradeUpgraded) {
      this.addLog(`👑 [영혼 등급 진화 대성공!] 각성(${hero.awakeningCount}단계, 진화율 ${upgradeChance}%)의 기적으로 [${hero.name}]님의 등급이 [${GRADE_NAMES[prevGrade] || prevGrade}] ➔ [${GRADE_NAMES[hero.grade] || hero.grade}] (으)로 초월 진화하여 기본 잠재력이 대폭 폭증했습니다!`, 'reward');
    }

    this.addLog(`🔮 [초월 각성 ${hero.awakeningCount}단계 완료] [${hero.name}]님이 [${STAT_NAMES[chosenStat]} +15%] 특화 각성을 달성했습니다! [기본 능력치 HP: ${prevMaxHp}➔${computed.maxHp}, ATK: ${prevAtk}➔${computed.stats.atk}, DEF: ${prevDef}➔${computed.stats.def}, SPD: ${prevSpd}➔${computed.stats.spd}, 🍀LUK: ${prevLuck}➔${computed.stats.luck}]`, 'reward');

    this.emit('heroPromoted', hero);
    this.saveGame();
    return true;
  }

  public awakenHero(
    heroId: string,
    chosenStat: 'hp' | 'mp' | 'atk' | 'def' | 'spd' | 'luck' = 'atk'
  ): boolean {
    return this.awakenMercenary(heroId, chosenStat);
  }

  /** 현재 게임 상태(건물, 보유 용병, 전직 현황 등)를 기반으로 퀘스트 목표를 자동 동기화/점검 */
  /** 무작위 서브 퀘스트 생성기 (방랑자의 라운지 레벨에 따라 요구 조건 대폭 강화 및 고가치 보상 스케일링) */
  public generateRandomSubQuest(): Quest {
    const tavernLv = Math.max(1, this.buildings['tavern']?.level || 1);
    // 🍺 라운지 레벨에 따른 스케일링 계수 (요구치 대폭 강화):
    // 요구량 배율: 1 + (tavernLv - 1) * 0.40 (Lv.1: 1.0배 ~ Lv.5: 2.6배 ~ Lv.10: 4.6배)
    // 보상 배율: 1 + (tavernLv - 1) * 0.50 (Lv.1: 1.0배 ~ Lv.5: 3.0배 ~ Lv.10: 5.5배)
    const reqMult = 1 + (tavernLv - 1) * 0.40;
    const rewMult = 1 + (tavernLv - 1) * 0.50;

    const templates = [
      // 1. 마물 토벌 (석탄 및 보급품 포함)
      () => {
        const baseKills = Math.floor(Math.random() * 4) + 3; // 기본 3~6체
        const killCount = Math.max(3, Math.round(baseKills * reqMult));
        const gold = Math.round(killCount * 45 * rewMult);
        const food = Math.max(2, Math.round(killCount * 2 * rewMult));
        const herb = Math.max(2, Math.round(killCount * 2 * rewMult));
        const coal = Math.max(4, Math.round((Math.floor(Math.random() * 3) + 4) * rewMult));
        const ether = tavernLv >= 3 ? Math.round(tavernLv * 8 * rewMult) : 0;
        const pureStone = tavernLv >= 7 ? 1 : 0;

        const titles = [
          '침묵의 회랑 마물 토벌',
          '방주 외곽 위협 개체 척결',
          '어둠 속 잠복자 수색',
          '공허 변이종 소탕 의뢰'
        ];
        const title = titles[Math.floor(Math.random() * titles.length)];
        return {
          id: `Q_SUB_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          title: `[토벌 Lv.${tavernLv}] ${title}`,
          type: 'sub' as const,
          chapter: 1,
          summary: `[라운지 Lv.${tavernLv}] 방주 주변의 안전을 위해 심연 마물 ${killCount}체를 토벌하세요.`,
          flavorText: '흑무 속에서 뻗어나오는 발톱들을 베어넘겨 방주의 안전지대를 수호하라.',
          objectives: [
            { description: `심연 마물 ${killCount}체 처치`, current: 0, required: killCount, isCompleted: false }
          ],
          rewards: {
            gold,
            ether: ether > 0 ? ether : undefined,
            resources: {
              food,
              herb,
              coal,
              ...(pureStone > 0 ? { pure_prefix_stone: pureStone } : {})
            }
          },
          status: 'active' as const
        };
      },
      // 2. 횃불 제작용 고열 석탄 확보 (전용 석탄 보급 퀘스트)
      () => {
        const baseStone = Math.floor(Math.random() * 6) + 10; // 10~15개
        const baseWood = Math.floor(Math.random() * 6) + 12; // 12~17개
        const stoneAmt = Math.max(10, Math.round(baseStone * reqMult));
        const woodAmt = Math.max(12, Math.round(baseWood * reqMult));
        const gold = Math.round(180 * rewMult);
        const coal = Math.max(8, Math.round(8 * rewMult));
        const prefixStoneQty = tavernLv >= 5 ? Math.min(3, Math.floor(tavernLv / 3)) : 1;
        const torchQty = tavernLv >= 4 ? 2 : 1;

        return {
          id: `Q_SUB_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          title: `[연료 Lv.${tavernLv}] 횃불 제작 및 야영용 석탄 확보`,
          type: 'sub' as const,
          chapter: 1,
          summary: `[라운지 Lv.${tavernLv}] 원정대의 횃불 제작과 모닥불 유지를 위해 목재 ${woodAmt}개와 석재 ${stoneAmt}개를 가공소에 납품하세요.`,
          flavorText: '심연의 어둠을 밝힐 횃불에는 정제된 고열 석탄이 필수적이다. 가공 원자재를 조달하라.',
          objectives: [
            { description: `목재 ${woodAmt}개 납품`, current: 0, required: woodAmt, isCompleted: false },
            { description: `석재 ${stoneAmt}개 납품`, current: 0, required: stoneAmt, isCompleted: false }
          ],
          requiredResources: { wood: woodAmt, stone: stoneAmt },
          rewards: {
            gold,
            resources: {
              coal,
              prefix_stone: prefixStoneQty,
              ...(tavernLv >= 8 ? { pure_prefix_stone: 1 } : {})
            },
            supplies: [
              { key: 'torch', name: '탐험 횃불', icon: '🔥', qty: torchQty }
            ]
          },
          status: 'active' as const
        };
      },
      // 3. 피난민 구호 식량 지원
      () => {
        const baseAmt = Math.floor(Math.random() * 10) + 15; // 15~24개
        const amt = Math.max(15, Math.round(baseAmt * reqMult));
        const gold = Math.round(amt * 10 * rewMult);
        const ether = Math.max(5, Math.round(Math.floor(amt / 2) * rewMult));
        const leather = Math.max(4, Math.round(Math.floor(amt / 3) * rewMult));
        const coal = Math.max(3, Math.round((Math.floor(Math.random() * 3) + 3) * rewMult));
        const suffixStoneQty = tavernLv >= 5 ? Math.min(3, Math.floor(tavernLv / 3)) : 1;

        return {
          id: `Q_SUB_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          title: `[구호 Lv.${tavernLv}] 피난민 긴급 식량 지원`,
          type: 'sub' as const,
          chapter: 1,
          summary: `[라운지 Lv.${tavernLv}] 안식처의 생존자들을 위해 가공된 식량 ${amt}개를 지원하세요.`,
          flavorText: '따스한 음식 한 그릇이 절망에 빠진 생존자들에게 내일로 나아갈 용기를 준다.',
          objectives: [
            { description: `생존자 안식처에 식량 ${amt}개 지원`, current: 0, required: amt, isCompleted: false }
          ],
          requiredResources: { food: amt },
          rewards: {
            gold,
            ether,
            resources: {
              leather,
              coal,
              suffix_stone: suffixStoneQty,
              ...(tavernLv >= 8 ? { pure_suffix_stone: 1 } : {})
            }
          },
          status: 'active' as const
        };
      },
      // 4. 성화 영목 공급
      () => {
        const baseAmt = Math.floor(Math.random() * 10) + 15; // 15~24개
        const amt = Math.max(15, Math.round(baseAmt * reqMult));
        const gold = Math.round(amt * 11 * rewMult);
        const stone = Math.max(8, Math.round(Math.floor(amt / 2) * rewMult));
        const iron = Math.max(5, Math.round(Math.floor(amt / 3) * rewMult));
        const coal = Math.max(5, Math.round((Math.floor(Math.random() * 3) + 5) * rewMult));
        const ether = tavernLv >= 4 ? Math.round(tavernLv * 10 * rewMult) : undefined;

        return {
          id: `Q_SUB_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          title: `[납품 Lv.${tavernLv}] 성화 유지를 위한 영목 공급`,
          type: 'sub' as const,
          chapter: 1,
          summary: `[라운지 Lv.${tavernLv}] 방주의 신성한 불꽃이 꺼지지 않도록 영목 ${amt}개를 성화에 공급하세요.`,
          flavorText: '불씨가 사그라들면 흑무가 성벽을 집어삼킨다. 성화지기에게 영목을 공급하라.',
          objectives: [
            { description: `성화 유지를 위한 영목 ${amt}개 납품`, current: 0, required: amt, isCompleted: false }
          ],
          requiredResources: { wood: amt },
          rewards: {
            gold,
            ether,
            resources: {
              stone,
              iron,
              coal,
              ...(tavernLv >= 6 ? { prefix_stone: 1 } : {})
            }
          },
          status: 'active' as const
        };
      },
      // 5. 의료소 약초 기부 (치료 보급품)
      () => {
        const baseAmt = Math.floor(Math.random() * 8) + 12; // 12~19개
        const amt = Math.max(12, Math.round(baseAmt * reqMult));
        const gold = Math.round(amt * 12 * rewMult);
        const coal = Math.max(3, Math.round(3 * rewMult));
        const bandageQty = tavernLv >= 4 ? (tavernLv >= 8 ? 4 : 3) : 2;
        const holyWaterQty = tavernLv >= 5 ? 2 : 1;

        return {
          id: `Q_SUB_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          title: `[의료 Lv.${tavernLv}] 응급 치료용 약초 수집`,
          type: 'sub' as const,
          chapter: 1,
          summary: `[라운지 Lv.${tavernLv}] 부상당한 원정 대원들의 치료를 위해 약초 ${amt}개를 의료소에 기부하세요.`,
          flavorText: '심연의 상처는 일반 붕대로 아물지 않는다. 고농축 약초 추출액이 시급하다.',
          objectives: [
            { description: `의료소에 약초 ${amt}개 기부`, current: 0, required: amt, isCompleted: false }
          ],
          requiredResources: { herb: amt },
          rewards: {
            gold,
            resources: {
              coal,
              ...(tavernLv >= 6 ? { pure_suffix_stone: 1 } : {})
            },
            supplies: [
              { key: 'bandage', name: '치유 붕대', icon: '🩹', qty: bandageQty },
              { key: 'holy_water', name: '정화의 성수', icon: '💧', qty: holyWaterQty }
            ]
          },
          status: 'active' as const
        };
      },
      // 6. 대장간 철광석 & 석재 조달
      () => {
        const baseStone = Math.floor(Math.random() * 10) + 15; // 15~24개
        const baseIron = Math.floor(Math.random() * 5) + 5; // 5~9개
        const stoneAmt = Math.max(15, Math.round(baseStone * reqMult));
        const ironAmt = Math.max(5, Math.round(baseIron * reqMult));
        const gold = Math.round((stoneAmt * 7 + ironAmt * 16) * rewMult);
        const coal = Math.max(7, Math.round((Math.floor(Math.random() * 3) + 7) * rewMult));
        const prefixQty = tavernLv >= 4 ? 2 : 1;

        return {
          id: `Q_SUB_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
          title: `[단조 Lv.${tavernLv}] 제식 무기용 광석 조달`,
          type: 'sub' as const,
          chapter: 1,
          summary: `[라운지 Lv.${tavernLv}] 제식 무기 단조를 위해 석재 ${stoneAmt}개와 철광석 ${ironAmt}개를 납품하세요.`,
          flavorText: '강력한 칼날과 방패를 만들기 위해 단단한 마도 원석이 지속적으로 필요하다.',
          objectives: [
            { description: `석재 ${stoneAmt}개 납품`, current: 0, required: stoneAmt, isCompleted: false },
            { description: `철광석 ${ironAmt}개 납품`, current: 0, required: ironAmt, isCompleted: false }
          ],
          requiredResources: { stone: stoneAmt, iron: ironAmt },
          rewards: {
            gold,
            resources: {
              prefix_stone: prefixQty,
              coal,
              ...(tavernLv >= 7 ? { pure_prefix_stone: 1 } : {})
            }
          },
          status: 'active' as const
        };
      }
    ];

    const pickFn = templates[Math.floor(Math.random() * templates.length)];
    return pickFn();
  }

  /** 활성화된 서브 퀘스트가 항상 최대 3개 유지되도록 보충 (주점 건설 시에만 해금, 완료 시 10분 쿨다운 적용, 주점 일시정지 시 갱신 중단) */
  public ensureActiveSubQuests(): void {
    const tavern = this.buildings['tavern'];
    const hasTavern = (tavern?.level || 0) >= 1;
    if (!hasTavern) {
      // 주점 미건설 시 서브 퀘스트 완전 차단 및 정리
      this.quests = this.quests.filter(q => q.type !== 'sub' && q.type !== 'repeatable');
      return;
    }

    // 🌟 방랑자의 라운지가 일시 정지(isPaused) 중인 경우 서브 퀘스트 갱신/보충 중단
    if (tavern?.isPaused) {
      return;
    }

    const hasEverHadSubs = this.hasInitializedSubQuests || this.quests.some(q => q.type === 'sub' || q.type === 'repeatable');

    // 🍺 방랑자의 라운지 첫 완공 시: 즉시 3개 초기 지급
    if (!hasEverHadSubs) {
      this.hasInitializedSubQuests = true;
      for (let i = 0; i < 3; i++) {
        this.quests.push(this.generateRandomSubQuest());
      }
      this.subQuestCooldownUntil = 0;
      this.emit('questUpdated');
      this.saveGame();
      return;
    }

    this.hasInitializedSubQuests = true;
    const activeSubs = this.quests.filter(q => q.status === 'active' && (q.type === 'sub' || q.type === 'repeatable'));

    // 이미 활성 슬롯 3개가 모두 찬 경우 쿨다운 해제
    if (activeSubs.length >= 3) {
      if (this.subQuestCooldownUntil !== 0) {
        this.subQuestCooldownUntil = 0;
        this.saveGame();
      }
      return;
    }

    // 빈 슬롯이 존재할 때
    const now = Date.now();
    // 쿨타임이 아직 설정되지 않은 경우 (모두 완료되었거나 비정상 0 상태인 경우) 10분 쿨타임 시작
    if (this.subQuestCooldownUntil === 0) {
      this.subQuestCooldownUntil = now + 10 * 60 * 1000;
      this.saveGame();
      return;
    }

    // 쿨다운 진행 중이면 대기 (재접속 또는 실행 중에 임의로 퀘스트가 자동 생성되지 않음)
    if (now < this.subQuestCooldownUntil) {
      return;
    }

    // 10분 쿨다운이 경과한 경우: 경과 시간에 따라 최대 부족분만큼 순차 보충
    const missingCount = 3 - activeSubs.length;
    const elapsedMs = now - this.subQuestCooldownUntil;
    const additionalRefills = Math.min(missingCount - 1, Math.floor(elapsedMs / (10 * 60 * 1000)));
    const totalToAdd = 1 + additionalRefills;

    const newSubs: Quest[] = [];
    for (let i = 0; i < totalToAdd; i++) {
      const newSub = this.generateRandomSubQuest();
      this.quests.push(newSub);
      newSubs.push(newSub);
    }

    const newActiveCount = activeSubs.length + totalToAdd;
    if (newActiveCount < 3) {
      const remainingInCycle = (10 * 60 * 1000) - (elapsedMs % (10 * 60 * 1000));
      this.subQuestCooldownUntil = now + Math.max(1000, remainingInCycle);
    } else {
      this.subQuestCooldownUntil = 0;
    }

    if (newSubs.length === 1) {
      this.addLog(`✨ [신규 서브 의뢰 도착] 10분의 대기 시간이 지나 새로운 의뢰 '${newSubs[0].title}'이(가) 도착했습니다!`, 'story', 'citadel');
    } else {
      this.addLog(`✨ [신규 서브 의뢰 도착] 대기 시간이 지나 새로운 서브 의뢰 ${newSubs.length}건이 도착했습니다!`, 'story', 'citadel');
    }

    this.emit('questUpdated');
    this.saveGame();
  }

  public checkAllQuestObjectives(): void {
    if (this.isCheckingQuests) return;
    this.isCheckingQuests = true;

    try {
      let questStateChanged = false;

      // 🌟 신규 퀘스트 (4대 대형 연계 시나리오 퀘스트 등) 누락분 자동 보충
      INITIAL_QUESTS.forEach(initQ => {
        if (!this.quests.some(q => q.id === initQ.id)) {
          this.quests.push(JSON.parse(JSON.stringify(initQ)));
          questStateChanged = true;
        }
      });

      // 1. 모든 활성화된 퀘스트 중 requiredResources(자원/유물 보유)가 있는 퀘스트 진행도 실시간 동기화
      this.quests.filter(q => q.status === 'active' && q.requiredResources).forEach(q => {
        let idx = 0;
        for (const [rKey, reqAmt] of Object.entries(q.requiredResources || {})) {
          const curAmt = (this.resources[rKey as keyof GameResources] as number) || 0;
          if (q.objectives[idx]) {
            const prevCur = q.objectives[idx].current;
            const prevCompleted = q.objectives[idx].isCompleted;
            
            q.objectives[idx].current = Math.min(reqAmt as number, curAmt);
            q.objectives[idx].isCompleted = curAmt >= (reqAmt as number);

            if (prevCur !== q.objectives[idx].current || prevCompleted !== q.objectives[idx].isCompleted) {
              questStateChanged = true;
            }
          }
          idx++;
        }
      });

      // 2. 메인/건설/전직/탐험 연계 퀘스트 체크
      // Q_MAIN_01: 마물 가공소
      if (this.buildings['butchery'] && this.buildings['butchery'].level >= 1) {
        this.updateQuestObjective('Q_MAIN_01', 0, 1);
      }
      // Q_UPGRADE_STORAGE: 방주 중앙 병참고 증축 (Lv.2 이상)
      if (this.buildings['storage'] && this.buildings['storage'].level >= 2) {
        this.updateQuestObjective('Q_UPGRADE_STORAGE', 0, 1);
      }
      // Q_BUILD_CABIN: 피난민 오두막
      if (this.buildings['cabin'] && this.buildings['cabin'].level >= 1) {
        this.updateQuestObjective('Q_BUILD_CABIN', 0, 1);
      }
      // Q_BUILD_LUMBER: 성채 벌목소
      if (this.buildings['lumberCamp'] && this.buildings['lumberCamp'].level >= 1) {
        this.updateQuestObjective('Q_BUILD_LUMBER', 0, 1);
      }
      // Q_BUILD_QUARRY: 마도 광산
      if (this.buildings['quarry'] && this.buildings['quarry'].level >= 1) {
        this.updateQuestObjective('Q_BUILD_QUARRY', 0, 1);
        if (this.buildings['tavern']) {
          this.buildings['tavern'].unlocked = true;
        }
      }

      // 🍺 Q_MAIN_02: 주점이 해금되기 전까지는 보이지 않도록 locked 유지, 해금 시 active
      const isTavernUnlocked = Boolean(
        (this.buildings['tavern'] && this.buildings['tavern'].unlocked) ||
        (this.buildings['tavern'] && this.buildings['tavern'].level >= 1) ||
        (this.buildings['quarry'] && this.buildings['quarry'].level >= 1)
      );
      const qMain02 = this.quests.find(q => q.id === 'Q_MAIN_02');
      if (qMain02 && qMain02.status !== 'completed') {
        if (!isTavernUnlocked && qMain02.status === 'active') {
          qMain02.status = 'locked';
        } else if (isTavernUnlocked && qMain02.status === 'locked') {
          qMain02.status = 'active';
        }
      }

      // Q_MAIN_02: 주점 건설 및 용병 고용 & 1구역 탐험 (주점 건설 시 서브 퀘스트 해금)
      if (isTavernUnlocked && this.buildings['tavern'] && this.buildings['tavern'].level >= 1) {
        this.updateQuestObjective('Q_MAIN_02', 0, 1);
        this.ensureActiveSubQuests();
      }
      const hasHiredMercenary = this.barracks.length > 2 || this.barracks.some(h => !['hero_01', 'hero_02'].includes(h.id));
      if (isTavernUnlocked && hasHiredMercenary) {
        this.updateQuestObjective('Q_MAIN_02', 1, 1);
      }
      
      // Q_MEMORIAL_TRIBUTE: 심연 첫 귀환 후 묘지 헌화 연계 퀘스트
      if (this.hasReturnedFromDungeon || this.hasEnteredDungeon || this.unlockedDungeonFloor >= 2) {
        this.hasReturnedFromDungeon = true;
        this.activateQuest('Q_MEMORIAL_TRIBUTE');
        if (this.memorialExpBuffUntil > 0) {
          this.updateQuestObjective('Q_MEMORIAL_TRIBUTE', 0, 1);
        }
      }
      
      // Q_BUILD_FORGE: 심연의 병기창
      if (this.buildings['blacksmith'] && this.buildings['blacksmith'].level >= 1) {
        this.updateQuestObjective('Q_BUILD_FORGE', 0, 1);
      }
      if (this.buildings['blacksmith'] && this.buildings['blacksmith'].level >= 3) {
        this.updateQuestObjective('Q_UPGRADE_FORGE_03', 0, 1);
      }
      if (this.buildings['blacksmith'] && this.buildings['blacksmith'].level >= 6) {
        this.activateQuest('Q_ENHANCED_SUPPLY_TORCH');
        if ((this.citadelSupplies?.['enhanced_torch'] || 0) >= 1) {
          this.updateQuestObjective('Q_ENHANCED_SUPPLY_TORCH', 0, 1);
        }
      }
      // Q_BUILD_ALCHEMY: 에테르 연금 공방
      if (this.buildings['alchemy'] && this.buildings['alchemy'].level >= 1) {
        this.updateQuestObjective('Q_BUILD_ALCHEMY', 0, 1);
      }
      // Q_BUILD_INFIRMARY: 생체 복원 병동
      if (this.buildings['infirmary'] && this.buildings['infirmary'].level >= 1) {
        this.updateQuestObjective('Q_BUILD_INFIRMARY', 0, 1);
      }
      // Q_BUILD_MARKET: 황혼의 블랙 마켓
      if (this.buildings['market'] && this.buildings['market'].level >= 1) {
        this.updateQuestObjective('Q_BUILD_MARKET', 0, 1);
      }
      // Q_CRAFT_EQUIP: 장비 직접 단조 제작 시에만 동기화
      const qEquip = this.quests.find(q => q.id === 'Q_CRAFT_EQUIP');
      if (this.hasCraftedEquipment) {
        this.updateQuestObjective('Q_CRAFT_EQUIP', 0, 1);
      } else if (qEquip && qEquip.status !== 'completed' && qEquip.objectives && qEquip.objectives[0]) {
        if (qEquip.objectives[0].isCompleted || qEquip.objectives[0].current > 0) {
          qEquip.objectives[0].current = 0;
          qEquip.objectives[0].isCompleted = false;
        }
      }
      // Q_CRAFT_GRIMOIRE: 마도서 직접 연성 제작 시에만 동기화
      const qGrim = this.quests.find(q => q.id === 'Q_CRAFT_GRIMOIRE');
      if (this.hasCraftedGrimoire) {
        this.updateQuestObjective('Q_CRAFT_GRIMOIRE', 0, 1);
      } else if (qGrim && qGrim.status !== 'completed' && qGrim.objectives && qGrim.objectives[0]) {
        if (qGrim.objectives[0].isCompleted || qGrim.objectives[0].current > 0) {
          qGrim.objectives[0].current = 0;
          qGrim.objectives[0].isCompleted = false;
        }
      }

      // 👑 Q_EPIC_CITADEL_REBUILD_01: 방주 1차 영지 재건 완성 (핵심 11대 거점 시설 Lv.1+ 완공)
      const coreBuildingIds: BuildingId[] = [
        'butchery', 'cabin', 'lumberCamp', 'quarry', 'storage',
        'tavern', 'blacksmith', 'alchemy', 'infirmary', 'market', 'sanctuary'
      ];
      const builtCount = coreBuildingIds.filter(bId => (this.buildings[bId]?.level || 0) >= 1).length;
      let qRebuild = this.quests.find(q => q.id === 'Q_EPIC_CITADEL_REBUILD_01');
      if (!qRebuild) {
        const def = INITIAL_QUESTS.find(q => q.id === 'Q_EPIC_CITADEL_REBUILD_01');
        if (def) {
          qRebuild = JSON.parse(JSON.stringify(def));
          this.quests.push(qRebuild!);
        }
      }
      if (qRebuild && qRebuild.status !== 'completed' && qRebuild.objectives && qRebuild.objectives[0]) {
        if (qRebuild.status === 'locked') qRebuild.status = 'active';
        const prevCurrent = qRebuild.objectives[0].current;
        const prevCompleted = qRebuild.objectives[0].isCompleted;
        qRebuild.objectives[0].current = Math.min(11, builtCount);
        qRebuild.objectives[0].isCompleted = builtCount >= 11;
        if (prevCurrent !== qRebuild.objectives[0].current || prevCompleted !== qRebuild.objectives[0].isCompleted) {
          questStateChanged = true;
          if (qRebuild.objectives[0].isCompleted && !prevCompleted) {
            SoundManager.getInstance().play('victory');
            this.addLog(`🏛️🎉 [대서사 에픽 달성!] 방주 성채 11대 핵심 거점 시설의 1차 영지 재건이 모두 완료되었습니다! 의뢰소에서 완수 서사를 확인하세요.`, 'reward');
          }
        }
      }
      // 🌟 침묵의 회랑 1구역 진입 퀘스트(Q_MAIN_02) 및 각 층별 보스 토벌 동기화
      const q02 = this.quests.find(q => q.id === 'Q_MAIN_02');
      if (q02 && q02.objectives && q02.objectives[2] && q02.objectives[2].isCompleted) {
        this.hasEnteredDungeon = true;
      }
      if (this.hasEnteredDungeon || this.unlockedDungeonFloor >= 2) {
        this.hasEnteredDungeon = true;
        this.updateQuestObjective('Q_MAIN_02', 2, 1);
      } else if (this.unlockedDungeonFloor === 1 && !this.hasEnteredDungeon) {
        // 아직 한 번도 던전에 진입하지 않은 순수 신규 상태에서 목표 2가 켜져 있으면 복구
        if (q02 && q02.status !== 'completed' && q02.objectives && q02.objectives[2] && q02.objectives[2].isCompleted) {
          q02.objectives[2].current = 0;
          q02.objectives[2].isCompleted = false;
        }
      }
      if (this.unlockedDungeonFloor >= 2) {
        this.updateQuestObjective('Q_SLAY_BOSS_01', 0, 1);
        const q2 = this.quests.find(q => q.id === 'Q_SLAY_BOSS_02');
        if (q2 && q2.status === 'locked') this.activateQuest('Q_SLAY_BOSS_02');
      }
      if (this.unlockedDungeonFloor >= 3) {
        this.updateQuestObjective('Q_SLAY_BOSS_02', 0, 1);
        const q3 = this.quests.find(q => q.id === 'Q_SLAY_BOSS_03');
        if (q3 && q3.status === 'locked') this.activateQuest('Q_SLAY_BOSS_03');
        const qF3 = this.quests.find(q => q.id === 'Q_UPGRADE_FORGE_03');
        if (qF3 && qF3.status === 'locked') this.activateQuest('Q_UPGRADE_FORGE_03');
      }

      // ⚒️ 병기창 Lv.3 및 장비 마도 강화 연계 퀘스트 동기화
      if (this.buildings['blacksmith'] && this.buildings['blacksmith'].level >= 3) {
        this.updateQuestObjective('Q_UPGRADE_FORGE_03', 0, 1);
        const qEnh = this.quests.find(q => q.id === 'Q_EQUIPMENT_ENHANCE');
        if (qEnh && qEnh.status === 'locked') this.activateQuest('Q_EQUIPMENT_ENHANCE');
      }
      const allEquips = [
        ...this.equipmentInventory,
        ...this.party.flatMap(h => Object.values(h.equipment || {})),
        ...this.barracks.flatMap(h => Object.values(h.equipment || {})),
      ].filter(Boolean);
      if (allEquips.some(e => e && e.level >= 3)) {
        this.updateQuestObjective('Q_EQUIPMENT_ENHANCE', 0, 1);
        const qEnh2 = this.quests.find(q => q.id === 'Q_EQUIPMENT_ENHANCE_02');
        if (qEnh2 && qEnh2.status === 'locked') this.activateQuest('Q_EQUIPMENT_ENHANCE_02');
      }
      if (allEquips.some(e => e && e.level >= 5)) {
        this.updateQuestObjective('Q_EQUIPMENT_ENHANCE_02', 0, 1);
      }
      if (this.unlockedDungeonFloor >= 4) {
        this.updateQuestObjective('Q_SLAY_BOSS_03', 0, 1);
        const q4 = this.quests.find(q => q.id === 'Q_SLAY_BOSS_04');
        if (q4 && q4.status === 'locked') this.activateQuest('Q_SLAY_BOSS_04');
      }
      if (this.unlockedDungeonFloor >= 5) {
        this.updateQuestObjective('Q_SLAY_BOSS_04', 0, 1);
        const q5 = this.quests.find(q => q.id === 'Q_SLAY_BOSS_05');
        if (q5 && q5.status === 'locked') this.activateQuest('Q_SLAY_BOSS_05');
      }
      if (this.unlockedDungeonFloor >= 6) {
        this.updateQuestObjective('Q_SLAY_BOSS_05', 0, 1);
        const q6 = this.quests.find(q => q.id === 'Q_SLAY_BOSS_06');
        if (q6 && q6.status === 'locked') this.activateQuest('Q_SLAY_BOSS_06');
      }
      if (this.unlockedDungeonFloor >= 7) {
        this.updateQuestObjective('Q_SLAY_BOSS_06', 0, 1);
        const q7 = this.quests.find(q => q.id === 'Q_SLAY_BOSS_07');
        if (q7 && q7.status === 'locked') this.activateQuest('Q_SLAY_BOSS_07');
      }
      if (this.unlockedDungeonFloor >= 8) {
        this.updateQuestObjective('Q_SLAY_BOSS_07', 0, 1);
        const q8 = this.quests.find(q => q.id === 'Q_SLAY_BOSS_08');
        if (q8 && q8.status === 'locked') this.activateQuest('Q_SLAY_BOSS_08');
      }
      if (this.unlockedDungeonFloor >= 9) {
        this.updateQuestObjective('Q_SLAY_BOSS_08', 0, 1);
        const q9 = this.quests.find(q => q.id === 'Q_SLAY_BOSS_09');
        if (q9 && q9.status === 'locked') this.activateQuest('Q_SLAY_BOSS_09');
      }
      if (this.unlockedDungeonFloor >= 10) {
        this.updateQuestObjective('Q_SLAY_BOSS_09', 0, 1);
        const q10 = this.quests.find(q => q.id === 'Q_SLAY_BOSS_10');
        if (q10 && q10.status === 'locked') this.activateQuest('Q_SLAY_BOSS_10');
      }
      if (this.unlockedDungeonFloor >= 11) {
        this.updateQuestObjective('Q_SLAY_BOSS_10', 0, 1);
      }

      // Q_BUILD_SANCTUARY: 영혼의 성소 및 전직 (제단 건설 시 에픽 스토리 해금)
      if (this.buildings['sanctuary'] && this.buildings['sanctuary'].level >= 1) {
        this.updateQuestObjective('Q_BUILD_SANCTUARY', 0, 1);
        const epic1 = this.quests.find(q => q.id === 'Q_EPIC_LORE_01');
        if (epic1 && epic1.status === 'locked') {
          this.activateQuest('Q_EPIC_LORE_01');
        }
      }
      if (this.barracks.some(h => (CHARACTER_CLASSES[h.classId]?.tier || 0) >= 1)) {
        this.updateQuestObjective('Q_BUILD_SANCTUARY', 1, 1);
      }
      if (this.barracks.some(h => (CHARACTER_CLASSES[h.classId]?.tier || 0) >= 2)) {
        this.updateQuestObjective('Q_BARRACKS_TRAIN_2ND', 0, 1);
      }
      // 차원 앵커 게이트 및 아레나/침공 퀘스트 체인
      if (this.buildings['sanctuary'] && this.buildings['sanctuary'].level >= 1) {
        if (this.buildings['arenaGate']) {
          this.buildings['arenaGate'].unlocked = true;
        }
        const qBuildArena = this.quests.find(q => q.id === 'Q_BUILD_ARENA');
        if (qBuildArena && qBuildArena.status === 'locked') {
          this.activateQuest('Q_BUILD_ARENA');
        }
      }
      if (this.buildings['arenaGate'] && this.buildings['arenaGate'].level >= 1) {
        this.updateQuestObjective('Q_BUILD_ARENA', 0, 1);
        const qArenaBattle = this.quests.find(q => q.id === 'Q_ARENA_FIRST_BATTLE');
        if (qArenaBattle && qArenaBattle.status === 'locked') {
          this.activateQuest('Q_ARENA_FIRST_BATTLE');
        }
        const qAwaken = this.quests.find(q => q.id === 'Q_NEMESIS_AWAKEN');
        if (qAwaken && qAwaken.status === 'locked') {
          this.activateQuest('Q_NEMESIS_AWAKEN');
        }
      }
      if (this.currentArenaRating > 1000 || (this.invasionState?.totalWins || 0) > 0 || this.arenaStreak > 0) {
        this.updateQuestObjective('Q_ARENA_FIRST_BATTLE', 0, 1);
      }
      if (this.buildings['arenaGate'] && this.buildings['arenaGate'].level >= 3) {
        this.updateQuestObjective('Q_NEMESIS_AWAKEN', 0, 1);
        const qStrike = this.quests.find(q => q.id === 'Q_NEMESIS_FIRST_STRIKE');
        if (qStrike && qStrike.status === 'locked') {
          this.activateQuest('Q_NEMESIS_FIRST_STRIKE');
        }
        const qGate6 = this.quests.find(q => q.id === 'Q_GATE_UPGRADE_06');
        if (qGate6 && qGate6.status === 'locked') {
          this.activateQuest('Q_GATE_UPGRADE_06');
        }
      }
      if (this.nemesisState && (this.nemesisState.highestDamage > 0 || this.nemesisState.totalDamage > 0)) {
        this.updateQuestObjective('Q_NEMESIS_FIRST_STRIKE', 0, 1);
        const qMile = this.quests.find(q => q.id === 'Q_NEMESIS_MILESTONE');
        if (qMile && qMile.status === 'locked') {
          this.activateQuest('Q_NEMESIS_MILESTONE');
        }
      }
      if (this.nemesisState && this.nemesisState.totalDamage >= 100000) {
        this.updateQuestObjective('Q_NEMESIS_MILESTONE', 0, 1);
      }
      if (this.buildings['arenaGate'] && this.buildings['arenaGate'].level >= 6) {
        this.updateQuestObjective('Q_GATE_UPGRADE_06', 0, 1);
        const qInvasion = this.quests.find(q => q.id === 'Q_INVASION_FIRST_SIEGE');
        if (qInvasion && qInvasion.status === 'locked') {
          this.activateQuest('Q_INVASION_FIRST_SIEGE');
        }
        const qTower = this.quests.find(q => q.id === 'Q_TACTICAL_TOWER_RESEARCH');
        if (qTower && qTower.status === 'locked') {
          this.activateQuest('Q_TACTICAL_TOWER_RESEARCH');
        }
      }
      if ((this.invasionState?.totalInvasions || 0) > 0) {
        this.updateQuestObjective('Q_INVASION_FIRST_SIEGE', 0, 1);
      }
      const towerState = this.getTacticalTower();
      const hasAnyTowerUpgraded = (towerState.attack.tier1 + towerState.attack.tier2 + towerState.attack.tier3 +
                                   towerState.defense.tier1 + towerState.defense.tier2 + towerState.defense.tier3 +
                                   towerState.utility.tier1 + towerState.utility.tier2 + towerState.utility.tier3) > 0;
      if (hasAnyTowerUpgraded) {
        this.updateQuestObjective('Q_TACTICAL_TOWER_RESEARCH', 0, 1);
      }

      if (questStateChanged) {
        this.emit('questUpdated');
      }
    } finally {
      this.isCheckingQuests = false;
    }
  }

  public updateQuestObjective(questId: string, objectiveIndex: number, amount: number): void {
    const q = this.quests.find(item => item.id === questId);
    if (!q || q.status === 'completed') return;

    // 만약 잠김 상태였다면 활성화
    if (q.status === 'locked') {
      q.status = 'active';
    }

    const obj = q.objectives[objectiveIndex];
    if (!obj || obj.isCompleted) return;

    if (questId === 'Q_MAIN_02' && objectiveIndex === 2) {
      this.hasEnteredDungeon = true;
    }

    obj.current = Math.min(obj.required, obj.current + amount);
    if (obj.current >= obj.required) {
      obj.isCompleted = true;
    }

    if (q.objectives.every(o => o.isCompleted)) {
      this.addLog(`📜 [퀘스트 목표 달성!] '${q.title}'의 모든 조건을 완수했습니다! [퀘스트 & 연계] 메뉴에서 [보상 수령]을 누르세요.`, 'reward');
      this.emit('questReadyToClaim', {
        questId: q.id,
        title: q.title,
        rewardSummary: this.getQuestRewardSummary(q),
        quest: q
      });
    }

    this.emit('questUpdated', q);
    this.saveGame();
  }

  /** 사용자가 직접 버튼을 눌러 퀘스트 보상을 수령하는 함수 */
  public completeQuest(questId: string, chosenRewardType?: 'domain' | 'expedition'): boolean {
    const q = this.quests.find(item => item.id === questId);
    if (!q || q.status === 'completed') return false;

    const allDone = q.objectives.every(o => o.isCompleted);
    if (!allDone) {
      this.addLog(`[수령 불가] '${q.title}'의 목표를 아직 모두 완료하지 않았습니다.`, 'danger');
      return false;
    }

    // 자원/유물 납품 퀘스트 완료 시 해당 자원 차감
    if (q.requiredResources) {
      for (const [rKey, reqAmt] of Object.entries(q.requiredResources)) {
        this.modifyResource(rKey as keyof GameResources, -(reqAmt || 0));
      }
    }

    if (q.type === 'sub' || q.type === 'repeatable') {
      q.status = 'completed';
      this.hasInitializedSubQuests = true;
      // 🌟 서브 퀘스트 완료 시 다음 신규 의뢰 생성까지 10분 쿨다운 시작
      if (this.subQuestCooldownUntil === 0 || Date.now() >= this.subQuestCooldownUntil) {
        this.subQuestCooldownUntil = Date.now() + 10 * 60 * 1000; // 10분 (600초)
      }
      this.addLog(`✨ [의뢰 완수] '${q.title}' 의뢰를 성공적으로 완수하고 방주의 주민들로부터 감사의 보수를 건네받았습니다. 새로운 전갈과 방랑자들의 소문이 모여들 때까지 잠시 숨을 고릅니다.`, 'reward');
    } else {
      q.status = 'completed';
    }
    const rewardLogs: string[] = [];

    // 🌟 에픽 퀘스트 분기 선택 보상 또는 기본 보상 결정
    let activeRewards = { ...q.rewards };
    if (q.epicStory && chosenRewardType) {
      const branch = q.epicStory.choices.find(c => c.id === chosenRewardType);
      if (branch) {
        if (chosenRewardType === 'expedition') {
          // 결사대 무장(원정 강화)은 오직 장비, 골드, 에테르, 보급품으로만 구성
          activeRewards = {
            gold: branch.rewards.gold ?? q.rewards.gold,
            ether: branch.rewards.ether ?? q.rewards.ether,
            supplies: branch.rewards.supplies,
            equipment: branch.rewards.equipment
          };
          this.addLog(`⚔️ [원정 결사대 육성 선택] ${branch.flavorChoice}`, 'story');
        } else {
          activeRewards = {
            ...q.rewards,
            ...branch.rewards,
            resources: {
              ...(q.rewards.resources || {}),
              ...(branch.rewards.resources || {})
            }
          };
          this.addLog(`🏛️ [영지 재건 선택] ${branch.flavorChoice}`, 'story');
        }
      }
    }

    // 1. 골드 & 에테르
    if (activeRewards.gold) {
      this.modifyResource('gold', activeRewards.gold);
      rewardLogs.push(`🪙 ${activeRewards.gold}G`);
    }
    if (activeRewards.ether) {
      this.modifyResource('ether', activeRewards.ether);
      rewardLogs.push(`✨ 에테르 ${activeRewards.ether}`);
    }

    // 2. 자원 및 재료
    if (activeRewards.resources) {
      const RN: Record<string, string> = {
        wood: '🪵 목재', stone: '🪨 석재', iron: '⚙️ 철광', food: '🍖 식량',
        herb: '🌿 약초', leather: '🧱 가죽', silk: '🧵 실크', coal: '⚫ 석탄',
        crystal: '🔮 마력 수정', void_shard: '💠 공허 파편',
        prefix_stone: '✨ 일반 접두석', suffix_stone: '🔮 일반 접미석',
        pure_prefix_stone: '⭐ 순수 접두석', pure_suffix_stone: '🌌 순수 접미석'
      };
      Object.entries(activeRewards.resources).forEach(([k, amt]) => {
        if (amt && amt > 0) {
          this.modifyResource(k as keyof GameResources, amt);
          rewardLogs.push(`${RN[k] || k} ${amt}개`);
        }
      });
    }

    // 3. 소모품/보급품 (성채 창고로 바로 입고!)
    if (activeRewards.supplies) {
      activeRewards.supplies.forEach(s => {
        this.addCitadelSupply(s.key, s.qty);
        rewardLogs.push(`${s.icon} ${s.name} ${s.qty}개 (성채 창고 입고)`);
      });
    }

    // 4. 고유 장비
    if (activeRewards.equipment) {
      this.addEquipmentToInventory(activeRewards.equipment);
      rewardLogs.push(`${activeRewards.equipment.icon} [${activeRewards.equipment.name}]`);
    }

    // 5. 마도서 (SkillBooks)
    if (activeRewards.skillBooks && activeRewards.skillBooks.length > 0) {
      if (!Array.isArray(this.skillBookInventory)) this.skillBookInventory = [];
      activeRewards.skillBooks.forEach(sb => {
        this.skillBookInventory.push(sb);
        rewardLogs.push(`${sb.icon} [${sb.name}]`);
      });
    }

    // 6. 건물 해금
    const buildingsToUnlock: BuildingId[] = [];
    if (q.rewards.unlockBuildingId) {
      buildingsToUnlock.push(q.rewards.unlockBuildingId);
    }
    if (q.rewards.unlockBuildingIds) {
      for (const bId of q.rewards.unlockBuildingIds) {
        if (!buildingsToUnlock.includes(bId)) {
          buildingsToUnlock.push(bId);
        }
      }
    }
    for (const bId of buildingsToUnlock) {
      const b = this.buildings[bId];
      if (b) {
        b.unlocked = true;
        rewardLogs.push(`🏛️ [${b.name}] 건설 해금`);
      }
    }

    // 6. 다음 연계 퀘스트 활성화 (영혼의 각성은 후반부로 배치)
    if (questId === 'Q_MAIN_01') {
      this.activateQuest('Q_BUILD_CABIN');
    } else if (questId === 'Q_BUILD_CABIN') {
      this.activateQuest('Q_BUILD_LUMBER');
    } else if (questId === 'Q_BUILD_LUMBER') {
      this.activateQuest('Q_BUILD_QUARRY');
    } else if (questId === 'Q_BUILD_QUARRY') {
      if (this.buildings['tavern']) {
        this.buildings['tavern'].unlocked = true;
      }
      this.activateQuest('Q_MAIN_02');
    } else if (questId === 'Q_MAIN_02') {
      this.activateQuest('Q_SLAY_BOSS_01');
      this.activateQuest('Q_CAMP_EXPEDITION');
      this.activateQuest('Q_BUILD_FORGE');
      this.activateQuest('Q_BUILD_INFIRMARY'); // 🌟 병기창과 생체 병동 퀘스트 동시 개방 (이중 라인 시작)
    } else if (questId === 'Q_BUILD_FORGE') {
      this.activateQuest('Q_CRAFT_EQUIP');
    } else if (questId === 'Q_CRAFT_EQUIP') {
      this.activateQuest('Q_BUILD_ALCHEMY');
      this.activateQuest('Q_UPGRADE_STORAGE');
      this.activateQuest('Q_EPIC_LORE_01');
    } else if (questId === 'Q_BUILD_ALCHEMY') {
      this.activateQuest('Q_CRAFT_GRIMOIRE');
    } else if (questId === 'Q_CRAFT_GRIMOIRE') {
      this.activateQuest('Q_BUILD_MARKET'); // 🌟 마도서 제작 완료 시 마켓 퀘스트 활성화
    } else if (questId === 'Q_BUILD_INFIRMARY') {
      this.activateQuest('Q_BUILD_SANCTUARY'); // 🌟 생체 병동 완공 시 영혼의 제단 퀘스트 활성화!
    } else if (questId === 'Q_BUILD_SANCTUARY') {
      this.activateQuest('Q_BUILD_ARENA');
      this.activateQuest('Q_MAIN_BOSS_01');
    } else if (questId === 'Q_BUILD_ARENA') {
      this.activateQuest('Q_ARENA_FIRST_BATTLE');
      this.activateQuest('Q_NEMESIS_AWAKEN');
    } else if (questId === 'Q_ARENA_FIRST_BATTLE') {
      this.activateQuest('Q_NEMESIS_AWAKEN');
    } else if (questId === 'Q_BUILD_MARKET') {
      this.activateQuest('Q_CURSE_CLEANSE');
    } else if (questId === 'Q_CAMP_EXPEDITION') {
      // 차원 앵커 차단 상태
    } else if (questId === 'Q_NEMESIS_AWAKEN') {
      this.activateQuest('Q_NEMESIS_FIRST_STRIKE');
    } else if (questId === 'Q_NEMESIS_FIRST_STRIKE') {
      this.activateQuest('Q_NEMESIS_MILESTONE');
      this.activateQuest('Q_GATE_UPGRADE_06');
    } else if (questId === 'Q_NEMESIS_MILESTONE') {
      this.activateQuest('Q_GATE_UPGRADE_06');
    } else if (questId === 'Q_GATE_UPGRADE_06') {
      this.activateQuest('Q_INVASION_FIRST_SIEGE');
      this.activateQuest('Q_TACTICAL_TOWER_RESEARCH');
    } else if (questId === 'Q_INVASION_FIRST_SIEGE') {
      this.activateQuest('Q_TACTICAL_TOWER_RESEARCH');
    } else if (questId === 'Q_SLAY_BOSS_02') {
      this.activateQuest('Q_SLAY_BOSS_03');
      this.activateQuest('Q_UPGRADE_FORGE_03');
    } else if (questId === 'Q_UPGRADE_FORGE_03') {
      this.activateQuest('Q_EQUIPMENT_ENHANCE');
    } else if (questId === 'Q_EQUIPMENT_ENHANCE') {
      this.activateQuest('Q_EQUIPMENT_ENHANCE_02');
    } else if (questId === 'Q_BUILD_SANCTUARY') {
      this.activateQuest('Q_MAIN_BOSS_01');
    } else if (questId === 'Q_EPIC_LORE_01') {
      this.activateQuest('Q_EPIC_LORE_02');
    } else if (questId === 'Q_EPIC_LORE_02') {
      this.activateQuest('Q_EPIC_LORE_03');
    } else if (questId === 'Q_EPIC_LORE_03') {
      this.activateQuest('Q_EPIC_LORE_04');
    } else if (questId === 'Q_EPIC_LORE_04') {
      this.activateQuest('Q_EPIC_LORE_05');
    } else if (questId === 'Q_SLAY_BOSS_05') {
      this.activateQuest('Q_SLAY_BOSS_06');
      this.activateQuest('Q_EXPEDITION_6F');
      this.activateQuest('Q_EPIC_LORE_04');
    } else if (questId === 'Q_SLAY_BOSS_06') {
      this.activateQuest('Q_SLAY_BOSS_07');
      this.activateQuest('Q_BARRACKS_TRAIN_2ND');
    } else if (questId === 'Q_SLAY_BOSS_07') {
      this.activateQuest('Q_SLAY_BOSS_08');
      this.activateQuest('Q_EPIC_LORE_05');
    } else if (questId === 'Q_SLAY_BOSS_08') {
      this.activateQuest('Q_SLAY_BOSS_09');
      this.activateQuest('Q_ENCHANT_MASTER');
    } else if (questId === 'Q_SLAY_BOSS_09') {
      this.activateQuest('Q_SLAY_BOSS_10');
    } else if (questId === 'Q_SLAY_BOSS_10') {
      this.activateQuest('Q_EPIC_AVICI_ENDING');
    }

    // 🌟 에픽 퀘스트 완료 시 던전 층 정화 (심연의 연무 해제)
    let purifiedFloorsAdded: number[] = [];
    if (questId === 'Q_EPIC_LORE_01') {
      purifiedFloorsAdded = [1, 2];
    } else if (questId === 'Q_EPIC_LORE_02') {
      purifiedFloorsAdded = [3, 4];
    } else if (questId === 'Q_EPIC_LORE_03') {
      purifiedFloorsAdded = [5];
    } else if (questId === 'Q_EPIC_LORE_04') {
      purifiedFloorsAdded = [6, 7];
    } else if (questId === 'Q_EPIC_LORE_05') {
      purifiedFloorsAdded = [8, 9];
    } else if (questId === 'Q_SLAY_BOSS_10' || questId === 'Q_EPIC_AVICI_ENDING') {
      purifiedFloorsAdded = [10];
    }

    if (purifiedFloorsAdded.length > 0) {
      this.purifyFloors(purifiedFloorsAdded);
      rewardLogs.push(`✨ [심연 정화] 심연 ${purifiedFloorsAdded.map(f => `${f}층`).join(', ')} 마기 정화 및 연무 해제`);
    }

    // 🧭⌛ 크로노스 시공간 에픽 시나리오 최종 보상: [시공간의 나침반] 해금 및 차원의 나침반 완전 대체
    if (questId === 'Q_SCENARIO_04' || questId === 'Q_SCENARIO_4_3') {
      this.hasChronoCompass = true;
      rewardLogs.push('🧭⌛ [시공간의 나침반] 획득 (차원의 나침반 완전 대체, 용병 긴급 이송 대기 시간 0턴 즉시 합류)');
      this.addLog('🌌⌛ [신화 촉매 획득] 시공간 초월자 아르케오스의 유산 [시공간의 나침반]을 계승했습니다! 채비실의 차원의 나침반이 시공간의 나침반으로 완전히 대체되어, 용병 긴급 이송 대기 시간이 영구히 소멸(0턴 즉시 합류)합니다!', 'reward');
    }

    this.addLog(`🎉 [퀘스트 보상 수령 완료!] '${q.title}'
➔ 수령 보상: ${rewardLogs.join(', ')}`, 'reward');
    this.emit('questUpdated', q);
    this.saveGame();
    return true;
  }

  /** 특정 층이 정화되었는지 여부 */
  public isFloorPurified(floor: number): boolean {
    return Array.isArray(this.purifiedFloors) && this.purifiedFloors.includes(floor);
  }

  /** 특정 층들을 정화 상태로 등록 */
  public purifyFloors(floors: number[]): void {
    if (!Array.isArray(this.purifiedFloors)) {
      this.purifiedFloors = [];
    }
    const newlyPurified: number[] = [];
    for (const f of floors) {
      if (!this.purifiedFloors.includes(f)) {
        this.purifiedFloors.push(f);
        newlyPurified.push(f);
      }
    }
    if (newlyPurified.length > 0) {
      this.purifiedFloors.sort((a, b) => a - b);
      const floorNames = newlyPurified.map(f => `${f}층`).join(', ');
      this.addLog(`✨ [심연 정화] 보스의 마도 유핵을 성채 제단에 헌정하자 거룩한 정화의 빛이 심연 ${floorNames}을 집어삼키던 칠흑 같은 연무를 걷어냅니다! 마물들의 흉폭한 발톱과 질긴 가죽을 옥죄던 원초의 마기가 흩어져, 결사대의 진군로가 한결 맑고 안전해졌습니다.`, 'story');
      this.emit('dungeonPurified', { newlyPurified, purifiedFloors: this.purifiedFloors });
      this.emit('update');
      this.saveGame();
    }
  }

  /** 완료된 에픽 퀘스트로부터 정화 층 소급 동기화 */
  public syncPurifiedFloorsFromQuests(): void {
    if (!Array.isArray(this.purifiedFloors)) {
      this.purifiedFloors = [];
    }
    const mapping: Record<string, number[]> = {
      'Q_EPIC_LORE_01': [1, 2],
      'Q_EPIC_LORE_02': [3, 4],
      'Q_EPIC_LORE_03': [5],
      'Q_EPIC_LORE_04': [6, 7],
      'Q_EPIC_LORE_05': [8, 9],
      'Q_SLAY_BOSS_10': [10],
      'Q_EPIC_AVICI_ENDING': [10],
    };
    let changed = false;
    for (const [qId, floors] of Object.entries(mapping)) {
      const q = this.quests.find(item => item.id === qId);
      if (q && q.status === 'completed') {
        for (const f of floors) {
          if (!this.purifiedFloors.includes(f)) {
            this.purifiedFloors.push(f);
            changed = true;
          }
        }
      }
    }
    if (changed) {
      this.purifiedFloors.sort((a, b) => a - b);
    }
  }

  public activateQuest(questId: string): void {
    const q = this.quests.find(item => item.id === questId);
    if (q && q.status === 'locked') {
      q.status = 'active';
      if (questId === 'Q_CRAFT_EQUIP' && !this.hasCraftedEquipment && q.objectives) {
        q.objectives.forEach(o => { o.current = 0; o.isCompleted = false; });
      }
      if (questId === 'Q_BUILD_ALCHEMY' && (this.buildings['alchemy']?.level || 0) >= 1 && q.objectives) {
        q.objectives.forEach(o => { o.current = o.required; o.isCompleted = true; });
      }
      if (questId === 'Q_CRAFT_GRIMOIRE' && q.objectives) {
        if (this.hasCraftedGrimoire) {
          q.objectives.forEach(o => { o.current = o.required; o.isCompleted = true; });
        } else {
          q.objectives.forEach(o => { o.current = 0; o.isCompleted = false; });
        }
      }
      this.addLog(`[신규 퀘스트] ${q.title} 수락됨.`, 'story');
      this.emit('questUpdated', q);
    }
  }

  private checkQuestProgress(): void {
    this.checkAllQuestObjectives();
  }

  // ================= 의료소 및 시장 유틸리티 =================
  public getInfirmaryCapacity(): number {
    const inf = this.buildings['infirmary'];
    if (!inf || inf.level === 0) return 0;
    // 원정단 최대 7인에 맞춰 Lv.9/10에서 최대 7개 병상 가동
    const beds = [0, 2, 2, 3, 3, 4, 5, 6, 6, 7, 7];
    return beds[Math.min(inf.level, 10)] || 2;
  }

  /** Lv.4 이상 마나 회복 주기 (Lv.4=5초 ~ Lv.10=1초) */
  public getInfirmaryMpPeriod(level?: number): number {
    const lv = level ?? (this.buildings['infirmary']?.level || 0);
    if (lv < 4) return 0;
    const periods = [0, 0, 0, 0, 5, 4, 4, 3, 2, 2, 1];
    return periods[Math.min(10, Math.max(0, lv))] || 1;
  }

  /** Lv.4 이상 틱당 마나 회복량 (틱당 4 MP 고정, 틱당 에테르 1 소모) */
  public getInfirmaryMpHealAmount(level?: number): number {
    const lv = level ?? (this.buildings['infirmary']?.level || 0);
    if (lv < 4) return 0;
    return 4;
  }

  public admitToInfirmary(heroId: string): boolean {
    const hero = this.barracks.find(h => h.id === heroId);
    if (!hero) return false;
    const inf = this.buildings['infirmary'];
    const eff = this.getHeroEffectiveStats(hero);
    const canHealHp = hero.currentHp < eff.maxHp;
    const canHealMp = (inf?.level || 0) >= 4 && hero.currentMp < eff.maxMp;
    if (!canHealHp && !canHealMp) return false;
    if (this.infirmaryPatients.includes(heroId)) return false;
    
    if (this.infirmaryPatients.length >= this.getInfirmaryCapacity()) {
      this.addLog('의료소 병상이 가득 찼습니다.', 'danger');
      return false;
    }

    this.infirmaryPatients.push(heroId);
    this.reconcileParty();
    this.addLog(`💉 [생체 복원 병동] ${hero.name} 입원 완료. 집중 치료를 시작합니다.`, 'system');
    this.emit('partyUpdated', this.party);
    this.emit('update');
    this.saveGame();
    return true;
  }

  public dischargeFromInfirmary(heroId: string): void {
    this.infirmaryPatients = this.infirmaryPatients.filter(id => id !== heroId);
    this.reconcileParty();
    this.addLog(`💉 [생체 복원 병동] 용병이 퇴원했습니다.`, 'system');
    this.emit('partyUpdated', this.party);
    this.emit('update');
    this.saveGame();
  }

  // ================= 영지 시장 레벨 특전 및 품목별 매입 재고 관리 =================
  /** 시장 레벨 특전 (Lv.8 이상 시 매입가 -10% 할인, 매각가 +15% 우대 환율) */
  public getMarketPerks(): { buyDiscountPct: number; sellBonusPct: number } {
    const marketLv = this.buildings['market']?.level || 0;
    if (marketLv >= 8) {
      return { buyDiscountPct: 10, sellBonusPct: 15 };
    }
    return { buyDiscountPct: 0, sellBonusPct: 0 };
  }

  /**
   * 🛒 마켓 레벨 및 카테고리에 따른 품목별 최대 매입(구매 가능) 재고량 (기존 대비 5배 상향 조정)
   * - basic (영지 생산품): 대량 재고 (목재/식량/석재/석탄 기본 250+Lv*125, 에테르 기본 100+Lv*50)
   * - farming (파밍 재료): 중간 재고 (기본 100+Lv*50)
   * - rare (심연 재료): 소량 희귀 재고 (수정/파편 기본 25+Lv*10, 접두/접미석 기본 20+Lv*5 등)
   */
  public getMarketMaxStock(resKey: string, category?: string): number {
    const marketLv = Math.max(1, this.buildings['market']?.level || 1);
    
    let cat = category;
    if (!cat) {
      if (['wood', 'food', 'stone', 'coal', 'ether'].includes(resKey)) cat = 'basic';
      else if (['iron', 'leather', 'herb', 'silk', 'bone'].includes(resKey)) cat = 'farming';
      else cat = 'rare';
    }

    if (cat === 'basic') {
      if (resKey === 'ether') {
        return (20 + marketLv * 10) * 5;
      }
      return (50 + marketLv * 25) * 5;
    }

    if (cat === 'farming') {
      return (20 + marketLv * 10) * 5;
    }

    // rare (심연 재료)
    if (resKey === 'crystal' || resKey === 'void_shard') {
      return (5 + marketLv * 2) * 5;
    }
    if (resKey === 'prefix_stone' || resKey === 'suffix_stone') {
      return (4 + marketLv) * 5;
    }
    if (resKey === 'pure_prefix_stone' || resKey === 'pure_suffix_stone') {
      return (2 + marketLv) * 5;
    }
    if (resKey === 'pure_mana_stone') {
      return (1 + Math.floor(marketLv * 0.5)) * 5;
    }

    return (10 + marketLv * 2) * 5;
  }

  /**
   * 🛒 마켓 품목의 실시간 재고 정보 조회 (매진 시 10분 쿨다운 및 자동 재입고 처리)
   */
  public getMarketStockInfo(resKey: string, category?: string): {
    current: number;
    max: number;
    isSoldOut: boolean;
    restockRemainingSec: number;
  } {
    const max = this.getMarketMaxStock(resKey, category);
    const now = Date.now();

    if (!this.marketStock) {
      this.marketStock = {};
    }

    let stock = this.marketStock[resKey];
    if (!stock) {
      stock = { current: max };
      this.marketStock[resKey] = stock;
    } else if (!stock.restockAt && stock.current > 0) {
      // 상향 패치 등 maxStock 변경 시 현재 잔여 재고도 비례 보정
      const cached = (stock as any).maxCached || (max / 5);
      if (cached < max) {
        stock.current = Math.min(max, Math.round(stock.current * (max / cached)));
        (stock as any).maxCached = max;
      }
    }

    // 매진 상태인 경우 10분 쿨다운 및 재입고 검사
    if (stock.current <= 0) {
      if (!stock.restockAt) {
        stock.restockAt = now + 10 * 60 * 1000; // 10분 후
      }

      if (now >= stock.restockAt) {
        // 10분 경과 -> 완충 재입고!
        stock.current = max;
        delete stock.restockAt;
      }
    }

    const isSoldOut = stock.current <= 0;
    const restockRemainingSec = isSoldOut && stock.restockAt
      ? Math.max(0, Math.ceil((stock.restockAt - now) / 1000))
      : 0;

    return {
      current: Math.min(stock.current, max),
      max,
      isSoldOut,
      restockRemainingSec,
    };
  }

  public sellResource(resKey: keyof GameResources, amount: number, pricePerUnit: number): boolean {
    const RN: Record<string, string> = {
      wood: '목재', stone: '석재', iron: '철광', food: '식량', gold: '골드', ether: '에테르',
      herb: '약초', bone: '짐승 뼈', leather: '가죽', silk: '실크', coal: '석탄', crystal: '마력 수정', void_shard: '공허 파편',
      prefix_stone: '일반 접두석', suffix_stone: '일반 접미석', pure_prefix_stone: '순수 접두석', pure_suffix_stone: '순수 접미석',
      pure_mana_stone: '순수 마도석'
    };

    if (this.resources[resKey] >= amount) {
      this.resources[resKey] -= amount;
      
      const maxGold = this.getMaxResourceCapacity('gold');
      const gained = amount * pricePerUnit;
      this.resources.gold = Math.min(maxGold, this.resources.gold + gained);
      
      this.addLog(`🕵️‍♂️ [블랙 마켓 매각] [${RN[resKey] || resKey}] ${amount}개를 판매하여 🪙 ${gained}G를 획득했습니다.`, 'reward');
      this.saveGame();
      this.emit('resourceChanged');
      return true;
    }
    return false;
  }

  public buyResource(resKey: keyof GameResources, amount: number, pricePerUnit: number, category?: string): boolean {
    const RN: Record<string, string> = {
      wood: '목재', stone: '석재', iron: '철광', food: '식량', gold: '골드', ether: '에테르',
      herb: '약초', bone: '짐승 뼈', leather: '가죽', silk: '실크', coal: '석탄', crystal: '마력 수정', void_shard: '공허 파편',
      prefix_stone: '일반 접두석', suffix_stone: '일반 접미석', pure_prefix_stone: '순수 접두석', pure_suffix_stone: '순수 접미석',
      pure_mana_stone: '순수 마도석'
    };

    const stockInfo = this.getMarketStockInfo(resKey as string, category);
    if (stockInfo.isSoldOut || stockInfo.current <= 0) {
      const min = Math.floor(stockInfo.restockRemainingSec / 60);
      const sec = stockInfo.restockRemainingSec % 60;
      this.addLog(`구매 실패: [${RN[resKey] || resKey}] 품목이 매진되었습니다! (재입고까지 ${min}분 ${sec}초 남음)`, 'danger');
      return false;
    }

    if (amount > stockInfo.current) {
      this.addLog(`구매 실패: 구매 요청 수량(${amount}개)이 현재 상점 매입 재고(${stockInfo.current}개)를 초과합니다!`, 'danger');
      return false;
    }

    const cost = amount * pricePerUnit;
    const maxCap = this.getMaxResourceCapacity(resKey);
    const cur = this.resources[resKey] || 0;

    if (cur >= maxCap) {
      this.addLog(`구매 실패: [${RN[resKey] || resKey}]의 창고 적재량이 가득 찼습니다! (${cur}/${maxCap})`, 'danger');
      return false;
    }

    if (this.resources.gold >= cost) {
      this.resources.gold -= cost;
      this.resources[resKey] = Math.min(maxCap, cur + amount);
      
      // 재고 차감 및 10분 매진 타이머
      const stock = this.marketStock[resKey as string];
      if (stock) {
        stock.current -= amount;
        if (stock.current <= 0) {
          stock.current = 0;
          stock.restockAt = Date.now() + 10 * 60 * 1000; // 10분 후
          this.addLog(`📦 [블랙 마켓] [${RN[resKey] || resKey}] 품목이 전량 소진되어 매진되었습니다! (10분 후 재입고)`, 'story');
        }
      }

      this.addLog(`🕵️‍♂️ [블랙 마켓 매입] 🪙 ${cost}G를 지불하여 [${RN[resKey] || resKey}] ${amount}개를 구매했습니다. (상점 잔여 재고: ${stock?.current ?? 0}개)`, 'system');
      this.saveGame();
      this.emit('resourceChanged');
      return true;
    } else {
      this.addLog(`구매 실패: 골드가 부족합니다! (필요: ${cost}G, 보유: ${this.resources.gold}G)`, 'danger');
      return false;
    }
  }

  public updateArenaRating(delta: number, coinsEarned: number = 0): void {
    if (delta > 0) {

    }
    this.currentArenaRating = Math.max(800, this.currentArenaRating + delta);
    if (this.currentArenaRating > 1800) {
      this.currentArenaRank = Math.max(1, Math.floor((2200 - this.currentArenaRating) / 40));
    } else {
      this.currentArenaRank = Math.max(1, Math.floor(50 - (this.currentArenaRating - 1000) / 30));
    }

    if (coinsEarned > 0) {
      this.arenaCoins += coinsEarned;
    }

    if (this.currentArenaRank <= 10) {
      if (!this.pveBuffActive) {
        this.pveBuffActive = true;
        this.addLog('★ [Top 10 랭커 달성] 전 파티원 공격력/체력 +15%, 던전 식량 소모 -20%, 희귀 드랍률 +25% PVE 특수 버프 획득!', 'reward');
      }
    } else {
      this.pveBuffActive = false;
    }

    // Firebase 실시간 랭킹 동기화 (차원 앵커 게이트 레벨 동기화, 미건설 시 매칭풀 제외)
    try {
      const gateLevel = this.buildings['arenaGate']?.level || 0;
      FirebaseService.getInstance().syncArenaLeaderboard(this.currentArenaRating, this.currentArenaRank, gateLevel, this.party);
    } catch (_) {}

    this.emit('arenaUpdated', { rank: this.currentArenaRank, rating: this.currentArenaRating, coins: this.arenaCoins });
    this.saveGame();
  }

  public addArenaCoins(amount: number): void {
    this.arenaCoins += amount;
    this.emit('arenaUpdated', { rank: this.currentArenaRank, rating: this.currentArenaRating, coins: this.arenaCoins });
    this.saveGame();
  }

  public spendArenaCoins(amount: number): boolean {
    if (this.arenaCoins < amount) return false;
    this.arenaCoins -= amount;
    this.emit('arenaUpdated', { rank: this.currentArenaRank, rating: this.currentArenaRating, coins: this.arenaCoins });
    this.saveGame();
    return true;
  }

  /**
   * 🏆 차원 아레나 대전 결과 통합 정산 (레이팅, 인장, 연승 보너스)
   * ※ 차원의 아레나에서 벌어지는 모든 전투에서는 경험치(EXP)를 획득하지 않음
   */
  public claimArenaMatchRewards(
    opp: ArenaOpponent,
    isWin: boolean
  ): {
    ratingDelta: number;
    coins: number;
    equipment: EquipmentItem | null;
    streak: number;
    expGained: number;
    levelUps: string[];
  } {
    if (isWin) {
      this.arenaStreak += 1;

    } else {
      this.arenaStreak = 0;
    }

    const ratingDelta = isWin
      ? Math.max(15, Math.floor((opp.rating - this.currentArenaRating) / 25 + 30 + Math.min(10, this.arenaStreak * 2)))
      : -Math.max(10, Math.floor((this.currentArenaRating - opp.rating) / 30 + 15));

    // 기본 코인 + 연승 보너스 (승리 시 기본 40~60 + 연승 보너스)
    const baseCoins = isWin ? Math.floor(Math.random() * 20 + 40 + Math.min(20, Math.floor(opp.rating / 100))) : 15;
    const streakCoinBonus = isWin ? Math.min(40, this.arenaStreak * 6) : 0;
    const totalCoins = baseCoins + streakCoinBonus;

    this.updateArenaRating(ratingDelta, totalCoins);

    // 🎖️ 전투 결과 직접 장비 드랍 제거 -> 명예 상점 포인트(투사의 인장) 지급
    if (isWin) {
      this.addLog(
        `🏆 [아레나 결투 승리] ${this.arenaStreak > 1 ? `🔥 ${this.arenaStreak}연승! ` : ''}투사의 인장 🪙 +${totalCoins}개 획득! (명예 상점에서 장비 및 보급함 교환 가능)`,
        'reward'
      );
    } else {
      this.addLog(
        `⚔️ [아레나 결투 패배] 투사의 인장 🪙 +${totalCoins}개 위로 획득`,
        'normal'
      );
    }

    this.updateQuestObjective('Q_ARENA_FIRST_BATTLE', 0, 1);
    this.checkAllQuestObjectives();

    this.saveGame();
    return {
      ratingDelta,
      coins: totalCoins,
      equipment: null,
      streak: this.arenaStreak,
      expGained: 0,
      levelUps: [],
    };
  }

  // ═══════════════════════════════════════════════════════════════════════
  // 🌌 차원 네메시스 (Dimensional Nemesis) 월드 레이드 관리
  // ═══════════════════════════════════════════════════════════════════════

  /**
   * 🌌 차원 앵커 및 네메시스 침공/레이드 활성화 여부
   * - 마스터 계정은 게이트 레벨에 관계없이 즉시 네메시스 레이드에 참여할 수 있습니다.
   * - 단, 네메시스의 자원 약탈은 휴무로 유지됩니다.
   */
  public isNemesisInvasionActive(): boolean {
    return true;
  }

  /** 일일 토벌 도전 횟수 갱신 확인 (매일 자정 3회 자동 충전) */
  public checkNemesisDailyReset(): void {
    if (!this.isNemesisInvasionActive()) return;
    const today = new Date().toISOString().slice(0, 10);
    if (this.nemesisState.lastDate !== today) {
      this.nemesisState.lastDate = today;
      this.nemesisState.dailyAttempts = 3;
      this.addLog('🌌 [차원 네메시스] 새로운 날이 밝아 일일 토벌 도전 횟수(3회)가 충전되었습니다!', 'system');
      this.saveGame();
    }
  }

  /**
   * 🌌 시공 침식 네메시스 활동 주기(6일 활동 / 1일 재소환) & 6시간 약탈 & 분당 0.05% HP 자연 회복 갱신
   */
  public updateNemesisCycle(now: number = Date.now()): boolean {
    // 🛑 차원 앵커가 닫혀 있는 상태에서는 네메시스 침공 및 약탈 사이클 전면 중단
    if (!this.isNemesisInvasionActive()) {
      return false;
    }

    let stateChanged = false;

    // 1. 상태 초기화 및 기본값 보정
    if (!this.nemesisState.cycleStartTime) {
      this.nemesisState.cycleStartTime = now;
      this.nemesisState.lastPlunderCheckTime = now;
      this.nemesisState.lastHpRegenTime = now;
      this.nemesisState.windowStartHp = this.nemesisState.currentBossHp ?? NEMESIS_BOSS_CONFIG.maxHp;
      this.nemesisState.isDefeated = (this.nemesisState.currentBossHp ?? NEMESIS_BOSS_CONFIG.maxHp) <= 0;
      stateChanged = true;
    }
    if (this.nemesisState.currentBossHp === undefined) {
      this.nemesisState.currentBossHp = NEMESIS_BOSS_CONFIG.maxHp;
      this.nemesisState.maxBossHp = NEMESIS_BOSS_CONFIG.maxHp;
      this.nemesisState.windowStartHp = NEMESIS_BOSS_CONFIG.maxHp;
      stateChanged = true;
    }
    if (this.nemesisState.windowStartHp === undefined) {
      this.nemesisState.windowStartHp = this.nemesisState.currentBossHp;
    }
    if (this.nemesisState.maxBossHp !== NEMESIS_BOSS_CONFIG.maxHp) {
      const prevMax = this.nemesisState.maxBossHp || 5000000;
      const ratio = this.nemesisState.currentBossHp !== undefined ? Math.max(0, Math.min(1, this.nemesisState.currentBossHp / prevMax)) : 1;
      this.nemesisState.maxBossHp = NEMESIS_BOSS_CONFIG.maxHp;
      this.nemesisState.currentBossHp = Math.round(NEMESIS_BOSS_CONFIG.maxHp * ratio);
      this.nemesisState.windowStartHp = this.nemesisState.currentBossHp;
      stateChanged = true;
    }
    if (!this.nemesisState.lastHpRegenTime) {
      this.nemesisState.lastHpRegenTime = now;
    }
    if (!this.nemesisState.lastPlunderCheckTime) {
      this.nemesisState.lastPlunderCheckTime = this.nemesisState.cycleStartTime;
    }

    const {
      ACTIVE_DURATION_MS,
      TOTAL_CYCLE_MS,
      PLUNDER_INTERVAL_MS,
      HP_REGEN_PER_MINUTE_RATE,
      REQUIRED_DAMAGE_RATIO
    } = NEMESIS_CYCLE_CONSTANTS;

    // 2. 7일 전체 사이클 만료 확인 ➔ 재소환 처리
    const elapsedSinceCycleStart = now - this.nemesisState.cycleStartTime;
    if (elapsedSinceCycleStart >= TOTAL_CYCLE_MS) {
      const cyclesToAdvance = Math.floor(elapsedSinceCycleStart / TOTAL_CYCLE_MS);
      this.nemesisState.cycleStartTime += cyclesToAdvance * TOTAL_CYCLE_MS;
      this.nemesisState.currentBossHp = this.nemesisState.maxBossHp || NEMESIS_BOSS_CONFIG.maxHp;
      this.nemesisState.phase = 1;
      this.nemesisState.isDefeated = false;
      this.nemesisState.defeatedTime = undefined;
      this.nemesisState.windowStartHp = this.nemesisState.currentBossHp;
      this.nemesisState.lastPlunderCheckTime = this.nemesisState.cycleStartTime;
      this.nemesisState.lastHpRegenTime = now;

      this.addLog('🌌 [차원 네메시스 강림] 시공의 균열이 다시 열리고 \'시공의 침식자, 네메시스\'가 완전히 재소환되었습니다! 6일간의 침식 활동이 시작됩니다.', 'danger');
      this.emit('nemesisUpdated');
      this.saveGame();
      return true;
    }

    const currentCycleElapsed = now - this.nemesisState.cycleStartTime;
    const isActivePeriod = currentCycleElapsed < ACTIVE_DURATION_MS;

    // 3. 보스가 토벌된 상태인 경우
    if (this.nemesisState.isDefeated || this.nemesisState.currentBossHp <= 0) {
      if (!this.nemesisState.isDefeated) {
        this.nemesisState.isDefeated = true;
        this.nemesisState.defeatedTime = now;
        this.nemesisState.currentBossHp = 0;
        this.addLog('👑 [차원 네메시스 완전 토벌] 지휘관들의 총력전으로 시공의 침식자 네메시스가 격퇴되었습니다! 다음 재소환 주기까지 영지에 평화가 유지됩니다.', 'reward');
        this.emit('nemesisUpdated');
        this.saveGame();
        stateChanged = true;
      }
      // 토벌된 상태에서는 회복과 약탈이 발생하지 않음 (대기 유지)
      this.nemesisState.lastHpRegenTime = now;
      this.nemesisState.lastPlunderCheckTime = now;
      return stateChanged;
    }

    // 4. 1일간의 재소환 대기 기간 (6일~7일차)인 경우
    if (!isActivePeriod) {
      // 활동 기간 6일이 종료되어 1일간 재소환 준비 중
      this.nemesisState.lastHpRegenTime = now;
      this.nemesisState.lastPlunderCheckTime = now;
      return stateChanged;
    }

    // 5. 6일간의 활성 침식 기간 중 (Active Period)
    // 5-1) 체력 자연 회복 (분당 0.05%)
    const regenElapsedMs = now - this.nemesisState.lastHpRegenTime;
    if (regenElapsedMs >= 1000) { // 최소 1초 이상 경과 시 회복
      const regenMinutes = regenElapsedMs / 60000;
      const regenAmount = (this.nemesisState.maxBossHp || NEMESIS_BOSS_CONFIG.maxHp) * HP_REGEN_PER_MINUTE_RATE * regenMinutes;
      if (regenAmount > 0 && this.nemesisState.currentBossHp < this.nemesisState.maxBossHp) {
        this.nemesisState.currentBossHp = Math.min(
          this.nemesisState.maxBossHp,
          this.nemesisState.currentBossHp + regenAmount
        );
        stateChanged = true;
      }
      this.nemesisState.lastHpRegenTime = now;

      // 페이즈 실시간 보정
      const hpRatio = this.nemesisState.currentBossHp / this.nemesisState.maxBossHp;
      if (hpRatio <= 0.3) this.nemesisState.phase = 3;
      else if (hpRatio <= 0.7) this.nemesisState.phase = 2;
      else this.nemesisState.phase = 1;
    }

    // 5-2) 6시간 약탈 판정
    const plunderElapsedMs = now - this.nemesisState.lastPlunderCheckTime;
    const intervalsPassed = Math.floor(plunderElapsedMs / PLUNDER_INTERVAL_MS);

    if (intervalsPassed > 0) {
      const reqDamage = (this.nemesisState.maxBossHp || NEMESIS_BOSS_CONFIG.maxHp) * REQUIRED_DAMAGE_RATIO; // 1/24 (208,333.33)

      for (let i = 0; i < intervalsPassed; i++) {
        const hpReduced = (this.nemesisState.windowStartHp ?? this.nemesisState.maxBossHp) - this.nemesisState.currentBossHp;

        if (hpReduced >= reqDamage) {
          // 🛡️ 1/24 이상 피해를 입혀 저지 성공 ➔ 약탈 무효화
          this.addLog('🛡️ [시공 침식 저지 성공] 지난 6시간 동안 네메시스에게 체력의 1/24 이상의 피해를 입혀 차원 약탈을 무력화하고 영지를 방어했습니다!', 'reward');
        } else {
          // 🛑 네메시스의 약탈은 계속 휴무 유지 (자원 약탈 미실행 및 영지 보호)
          this.addLog('🛡️ [시공 침식] 네메시스의 영지 자원 약탈은 [휴무] 상태이므로 영지 자원 손실 없이 안전하게 방어되었습니다.', 'system');
        }

        this.nemesisState.windowStartHp = this.nemesisState.currentBossHp;
        this.nemesisState.lastPlunderCheckTime += PLUNDER_INTERVAL_MS;
      }

      this.emit('nemesisUpdated');
      this.emit('resourcesChanged');
      this.saveGame();
      return true;
    }

    if (stateChanged) {
      this.emit('nemesisUpdated');
    }
    return stateChanged;
  }

  /**
   * 💀 시공 침식 네메시스 6시간 약탈 실행:
   * - 🛑 현재 네메시스의 영지 자원 약탈은 계속 휴무 상태로 유지되어 자원 손실이 발생하지 않습니다.
   */
  public executeNemesisPlunder(): { totalLoss: number; details: Record<string, number> } {
    // 🛑 네메시스의 약탈은 계속 휴무로 놔둠 (자원 약탈 미실행)
    return { totalLoss: 0, details: {} };
  }

  /**
   * 🌌 네메시스 사이클 및 6시간 약탈 현황 상세 정보 반환
   */
  public getNemesisCycleInfo() {
    const isAnchorActive = this.isNemesisInvasionActive();
    const now = Date.now();
    const cycleStart = this.nemesisState.cycleStartTime || now;
    const {
      ACTIVE_DURATION_MS,
      TOTAL_CYCLE_MS,
      PLUNDER_INTERVAL_MS,
      REQUIRED_DAMAGE_RATIO,
      HP_REGEN_PER_MINUTE_RATE
    } = NEMESIS_CYCLE_CONSTANTS;

    const elapsedInCycle = now - cycleStart;
    const isActivePeriod = isAnchorActive && elapsedInCycle < ACTIVE_DURATION_MS;
    const isDefeated = !!(this.nemesisState.isDefeated || (this.nemesisState.currentBossHp ?? 0) <= 0);

    const activeRemainingMs = Math.max(0, ACTIVE_DURATION_MS - elapsedInCycle);
    const respawnRemainingMs = Math.max(0, TOTAL_CYCLE_MS - elapsedInCycle);

    const lastPlunder = this.nemesisState.lastPlunderCheckTime || cycleStart;
    const nextPlunderRemainingMs = Math.max(0, PLUNDER_INTERVAL_MS - (now - lastPlunder));

    const maxHp = this.nemesisState.maxBossHp || NEMESIS_BOSS_CONFIG.maxHp;
    const windowStartHp = this.nemesisState.windowStartHp ?? maxHp;
    const currentHp = this.nemesisState.currentBossHp ?? maxHp;
    const currentWindowDamage = Math.max(0, windowStartHp - currentHp);
    const requiredWindowDamage = maxHp * REQUIRED_DAMAGE_RATIO;
    const isWindowDefended = currentWindowDamage >= requiredWindowDamage;
    const windowProgressPct = Math.min(100, Math.max(0, (currentWindowDamage / requiredWindowDamage) * 100));

    let status: 'dormant' | 'active' | 'defeated' | 'cooldown' = 'active';
    if (!isAnchorActive) {
      status = 'dormant'; // 🛑 차원 앵커가 닫혀 침공이 중단/휴면된 상태
    } else if (isDefeated) {
      status = 'defeated';
    } else if (!isActivePeriod) {
      status = 'cooldown';
    }

    return {
      status,
      isAnchorActive,
      isActivePeriod,
      isDefeated,
      isPlunderActive: false, // 🛑 네메시스의 자원 약탈은 계속 휴무 유지
      activeRemainingMs,
      respawnRemainingMs,
      nextPlunderRemainingMs,
      currentWindowDamage,
      requiredWindowDamage,
      isWindowDefended,
      windowProgressPct,
      regenPerMinute: maxHp * HP_REGEN_PER_MINUTE_RATE, // 2,500 HP/분
    };
  }

  /** 네메시스 토벌전 종료 후 대미지 기록 및 정산 */
  public recordNemesisDamage(damage: number, _participatingHeroIds: string[] = []): {
    coinsEarned: number;
    etherEarned: number;
    isNewRecord: boolean;
    bossPhaseChanged: boolean;
  } {
    this.checkNemesisDailyReset();
    if (this.nemesisState.dailyAttempts > 0) {
      this.nemesisState.dailyAttempts -= 1;
    }

    const prevPhase = this.nemesisState.phase;
    this.nemesisState.totalDamage += damage;
    const isNewRecord = damage > this.nemesisState.highestDamage;
    if (isNewRecord) {
      this.nemesisState.highestDamage = damage;
    }

    // 보스 HP 감소 (최소 0)
    this.nemesisState.currentBossHp = Math.max(0, this.nemesisState.currentBossHp - damage);

    if (this.nemesisState.currentBossHp <= 0) {
      this.nemesisState.isDefeated = true;
      this.nemesisState.defeatedTime = Date.now();
      this.addLog('👑 [차원 네메시스 완전 토벌] 지휘관들의 총력전으로 시공의 침식자 네메시스가 격퇴되었습니다! 다음 재소환 주기까지 영지에 평화가 유지됩니다.', 'reward');
    }

    // 페이즈 판정
    const hpRatio = this.nemesisState.currentBossHp / this.nemesisState.maxBossHp;
    if (hpRatio <= 0.3) {
      this.nemesisState.phase = 3;
    } else if (hpRatio <= 0.7) {
      this.nemesisState.phase = 2;
    } else {
      this.nemesisState.phase = 1;
    }
    const bossPhaseChanged = this.nemesisState.phase !== prevPhase;

    // 대미지에 비례한 투사의 인장 및 에테르 보상 (기본 30개, 최대 300개)
    const coinsEarned = Math.min(300, Math.floor(30 + damage / 1500));
    const etherEarned = Math.min(100, Math.floor(10 + damage / 4000));
    this.arenaCoins = (this.arenaCoins ?? 0) + coinsEarned;
    this.modifyResource('ether', etherEarned);

    // 파티 경험치 분배
    const expGained = Math.min(600, Math.floor(60 + damage / 1200));
    this.party.forEach(hero => {
      hero.exp = (hero.exp || 0) + expGained;
      if (hero.exp >= (hero.expToNext || 100)) {
        hero.level = (hero.level || 1) + 1;
        hero.exp -= (hero.expToNext || 100);
        hero.expToNext = Math.floor((hero.expToNext || 100) * 1.3);
      }
    });

    this.addLog(`🌌 [네메시스 토벌] 가한 피해량 ${damage.toLocaleString()}! 투사의 인장 🪙+${coinsEarned}, 에테르 ✨+${etherEarned}, 파티 경험치 +${expGained} 획득!`, 'reward');
    if (isNewRecord) {
      this.addLog(`👑 [네메시스 신기록] 단일 토벌 최고 피해량 ${damage.toLocaleString()} DMG 달성!`, 'reward');
    }
    if (bossPhaseChanged) {
      this.addLog(`⚠️ [네메시스 페이즈 전환] 보스가 Phase ${this.nemesisState.phase} 상태로 돌입했습니다!`, 'danger');
    }

    // 📜 차원 네메시스 연계 퀘스트 진행도 갱신
    this.updateQuestObjective('Q_NEMESIS_FIRST_STRIKE', 0, 1);
    this.activateQuest('Q_NEMESIS_MILESTONE');
    if (this.nemesisState.totalDamage >= 100000) {
      this.updateQuestObjective('Q_NEMESIS_MILESTONE', 0, 1);
    }

    this.saveGame();
    return { coinsEarned, etherEarned, isNewRecord, bossPhaseChanged };
  }

  /** 마일스톤 누적 딜량 달성 보상 수령 */
  public claimNemesisMilestone(milestoneId: string): boolean {
    const ms = NEMESIS_MILESTONES.find(m => m.id === milestoneId);
    if (!ms) return false;
    if (this.nemesisState.claimedMilestones.includes(milestoneId)) return false;
    if (this.nemesisState.totalDamage < ms.reqDamage) return false;

    this.nemesisState.claimedMilestones.push(milestoneId);

    if (ms.rewards.arenaCoins) {
      this.arenaCoins = (this.arenaCoins ?? 0) + ms.rewards.arenaCoins;
    }
    if (ms.rewards.ether) {
      this.modifyResource('ether', ms.rewards.ether);
    }
    if (ms.rewards.purePrefixStone) {
      this.modifyResource('pure_prefix_stone', ms.rewards.purePrefixStone);
    }
    if (ms.rewards.pureSuffixStone) {
      this.modifyResource('pure_suffix_stone', ms.rewards.pureSuffixStone);
    }
    if (ms.rewards.equipment) {
      this.addEquipmentToInventory(ms.rewards.equipment);
    }

    this.addLog(`🎁 [네메시스 마일스톤] [${ms.title}] 달성 보상을 모두 수령했습니다!`, 'reward');
    this.saveGame();
    return true;
  }

  /** 에테르를 소모하여 일일 토벌 도전 횟수 1회 충전 */
  public refillNemesisAttempts(): boolean {
    if (this.resources.ether < 50) {
      this.addLog('에테르가 부족합니다! (필요: 50개)', 'danger');
      return false;
    }
    this.modifyResource('ether', -50);
    this.nemesisState.dailyAttempts += 1;
    this.addLog(`✨ [차원 네메시스] 에테르 50개를 소모하여 토벌 도전 횟수를 1회 충전했습니다! (잔여: ${this.nemesisState.dailyAttempts}회)`, 'reward');
    this.saveGame();
    return true;
  }

  // ═════════════════════════════════════════════════════════════════════════
  // 🏰 차원 영지 침공 (Dimensional Estate Invasion / 5v5 Plunder Siege) 시스템
  // ═════════════════════════════════════════════════════════════════════════

  /** 5인 차원 부대(공격 및 영지 방어 부대) 목록 반환 */
  public getInvasionSquad(): Mercenary[] {
    const allHeroes = [...this.barracks, ...this.party].filter((h, idx, arr) => h && h.id && arr.findIndex(x => x.id === h.id) === idx);
    if (allHeroes.length === 0) return [];

    let squad: Mercenary[] = [];
    if (this.invasionState.deck) {
      const deck = this.invasionState.deck;
      const allDeckIds = [...deck.mainHeroIds, deck.leaderHeroId, deck.supporterHeroId].filter(Boolean);
      const uniqueIds = Array.from(new Set(allDeckIds));
      squad = uniqueIds
        .map(id => allHeroes.find(h => h.id === id))
        .filter((h): h is Mercenary => Boolean(h));
    } else if (this.invasionState.squadHeroIds && this.invasionState.squadHeroIds.length > 0) {
      const uniqueIds = Array.from(new Set(this.invasionState.squadHeroIds));
      squad = uniqueIds
        .map(id => allHeroes.find(h => h.id === id))
        .filter((h): h is Mercenary => Boolean(h));
    }

    squad.forEach(h => this.syncHeroStats(h));
    return squad.slice(0, 5);
  }

  /** 3선발 + 1리더 + 1서포터 차원 덱 구조 반환 */
  public getDimensionalDeck(): {
    mainHeroes: Mercenary[];
    leaderHero: Mercenary | null;
    supporterHero: Mercenary | null;
    deck: DimensionalDeck;
  } {
    const allHeroes = [...this.barracks, ...this.party].filter((h, idx, arr) => h && h.id && arr.findIndex(x => x.id === h.id) === idx);

    let mainHeroIds: string[] = [];
    let leaderHeroId = '';
    let supporterHeroId = '';

    if (this.invasionState.deck) {
      mainHeroIds = this.invasionState.deck.mainHeroIds.filter(id => allHeroes.some(h => h.id === id)).slice(0, 3);
      if (allHeroes.some(h => h.id === this.invasionState.deck!.leaderHeroId)) {
        leaderHeroId = this.invasionState.deck!.leaderHeroId;
      }
      if (allHeroes.some(h => h.id === this.invasionState.deck!.supporterHeroId)) {
        supporterHeroId = this.invasionState.deck!.supporterHeroId;
      }
    } else if (this.invasionState.squadHeroIds && this.invasionState.squadHeroIds.length >= 5) {
      const validSquad = this.invasionState.squadHeroIds.filter(id => allHeroes.some(h => h.id === id));
      const unique = Array.from(new Set(validSquad));
      if (unique.length >= 5) {
        mainHeroIds = unique.slice(0, 3);
        leaderHeroId = unique[3];
        supporterHeroId = unique[4];
      }
    }

    const mainHeroes = mainHeroIds.map(id => allHeroes.find(h => h.id === id)).filter((h): h is Mercenary => Boolean(h));
    const leaderHero = allHeroes.find(h => h.id === leaderHeroId) || null;
    const supporterHero = allHeroes.find(h => h.id === supporterHeroId) || null;

    const deck: DimensionalDeck = {
      mainHeroIds: mainHeroes.map(h => h.id),
      leaderHeroId: leaderHero?.id || '',
      supporterHeroId: supporterHero?.id || '',
    };

    return { mainHeroes, leaderHero, supporterHero, deck };
  }

  /** 차원 5인 부대 편성 완료 여부 및 현황 검사 */
  public isDimensionalSquadReady(): { isReady: boolean; count: number; reason?: string } {
    const allHeroes = [...this.barracks, ...this.party].filter((h, idx, arr) => h && h.id && arr.findIndex(x => x.id === h.id) === idx);
    
    // 1. 보유 영웅 수 부족
    if (allHeroes.length < 5) {
      return {
        isReady: false,
        count: allHeroes.length,
        reason: `보유 용병이 부족합니다. (현재 ${allHeroes.length}/5명 보유)\n차원 게이트 전투에 출전하려면 주점에서 용병을 최소 5명 이상 고용해야 합니다.`
      };
    }

    // 2. 덱 편성 확인 (3선발 + 1리더 + 1서포터, 중복 없는 5인)
    const deck = this.invasionState.deck;
    if (!deck) {
      if (this.invasionState.squadHeroIds && this.invasionState.squadHeroIds.length >= 5) {
        const validSquad = this.invasionState.squadHeroIds.filter(id => allHeroes.some(h => h.id === id));
        const unique = Array.from(new Set(validSquad));
        if (unique.length >= 5) {
          const ids = unique.slice(0, 5);
          this.invasionState.deck = {
            mainHeroIds: ids.slice(0, 3),
            leaderHeroId: ids[3],
            supporterHeroId: ids[4],
          };
          return { isReady: true, count: 5 };
        }
      }
      return {
        isReady: false,
        count: 0,
        reason: '차원 5인 부대(선발 3인 + 리더 1인 + 서포터 1인)가 편성되지 않았습니다.\n전투를 시작하려면 부대를 먼저 편성해야 합니다.'
      };
    }

    const validMain = (deck.mainHeroIds || []).filter(id => allHeroes.some(h => h.id === id));
    const hasLeader = Boolean(deck.leaderHeroId && allHeroes.some(h => h.id === deck.leaderHeroId));
    const hasSupporter = Boolean(deck.supporterHeroId && allHeroes.some(h => h.id === deck.supporterHeroId));

    const usedIds = new Set<string>();
    validMain.forEach(id => usedIds.add(id));
    if (hasLeader) usedIds.add(deck.leaderHeroId);
    if (hasSupporter) usedIds.add(deck.supporterHeroId);

    if (usedIds.size < 5 || validMain.length < 3 || !hasLeader || !hasSupporter) {
      return {
        isReady: false,
        count: usedIds.size,
        reason: `차원 5인 부대가 온전히 편성되지 않았습니다. (현재 ${usedIds.size}/5인 배치)\n선발 3인, 리더 1인, 서포터 1인을 중복 없이 모두 배치해주세요.`
      };
    }

    return { isReady: true, count: 5 };
  }

  /** 차원 5인 부대 (3선발 + 1리더 + 1서포터) 전투력 기준 최적 자동 편성 */
  public autoAssignDimensionalDeck(): boolean {
    const allHeroes = [...this.barracks, ...this.party].filter((h, idx, arr) => h && h.id && arr.findIndex(x => x.id === h.id) === idx);
    if (allHeroes.length < 5) return false;

    const sorted = [...allHeroes].sort((a, b) => {
      const pA = a.stats.atk * 3 + a.stats.def * 2 + a.maxHp / 5;
      const pB = b.stats.atk * 3 + b.stats.def * 2 + b.maxHp / 5;
      return pB - pA;
    });

    const mainIds = sorted.slice(0, 3).map(h => h.id);
    const leaderId = sorted[3].id;
    const supporterId = sorted[4].id;

    this.setDimensionalDeck({
      mainHeroIds: mainIds,
      leaderHeroId: leaderId,
      supporterHeroId: supporterId,
    });
    return true;
  }

  /** 차원 덱 (3선발 + 1리더 + 1서포터) 저장 */
  public setDimensionalDeck(deck: DimensionalDeck): void {
    const allHeroes = [...this.barracks, ...this.party].filter((h, idx, arr) => h && h.id && arr.findIndex(x => x.id === h.id) === idx);
    const validMainIds = deck.mainHeroIds.filter(id => allHeroes.some(h => h.id === id)).slice(0, 3);
    const validLeaderId = allHeroes.some(h => h.id === deck.leaderHeroId) ? deck.leaderHeroId : '';
    const validSupporterId = allHeroes.some(h => h.id === deck.supporterHeroId) ? deck.supporterHeroId : '';

    this.invasionState.deck = {
      mainHeroIds: validMainIds,
      leaderHeroId: validLeaderId,
      supporterHeroId: validSupporterId,
    };
    // 기존 squadHeroIds와도 동기화 (5인 호환성)
    const combined = [...validMainIds];
    if (validLeaderId && !combined.includes(validLeaderId)) combined.push(validLeaderId);
    if (validSupporterId && !combined.includes(validSupporterId)) combined.push(validSupporterId);
    this.invasionState.squadHeroIds = combined;

    this.emit('invasionUpdated', this.invasionState);
    this.emit('update');
    this.saveGame();
  }

  /** 리더 영웅의 무덤의 영령 가호 버프 생성 */
  public getLeaderBlessing(hero: Mercenary): ActiveAncestralBlessing | null {
    if (!hero) return null;
    return createActiveBlessingForHero(hero);
  }

  /** 5인 차원 부대 편성 저장 */
  public setInvasionSquad(heroIds: string[]): void {
    const allHeroes = [...this.barracks, ...this.party].filter((h, idx, arr) => h && h.id && arr.findIndex(x => x.id === h.id) === idx);
    const validIds: string[] = [];
    for (const id of heroIds) {
      if (allHeroes.some(h => h.id === id) && !validIds.includes(id)) {
        validIds.push(id);
        if (validIds.length >= 5) break;
      }
    }
    this.invasionState.squadHeroIds = validIds;
    this.invasionState.deck = {
      mainHeroIds: validIds.slice(0, 3),
      leaderHeroId: validIds[3] || '',
      supporterHeroId: validIds[4] || '',
    };
    this.emit('invasionUpdated', this.invasionState);
    this.emit('update');
    this.saveGame();
  }

  /** 차원 게이트 Lv.6+ 침공 대상 상대 영지 목록 생성 및 정찰 */
  public async getInvasionTargets(): Promise<InvasionTarget[]> {
    const myGateLv = this.buildings['arenaGate']?.level || 0;
    const myRating = this.currentArenaRating || 1200;
    const targets: InvasionTarget[] = [];
    const limit = 5;

    // 1. Firebase 리더보드 기반 실제 유저 영지 우선 매칭 (최대 3개)
    // 영지 침공 해금 조건: 차원 앵커 게이트 Lv.6 이상인 실제 유저만 침공 매칭 타겟으로 등장
    try {
      const fb = FirebaseService.getInstance();
      const lb = await fb.getLeaderboard();
      const realEntries = lb.filter(e => e && !e.isPlayer && (e.gateLevel ?? 0) >= 6);
      for (const entry of realEntries.slice(0, 3)) {
        const oppRating = entry.rating || myRating;
        const gateLv = entry.gateLevel && entry.gateLevel >= 6 ? entry.gateLevel : Math.max(6, Math.min(10, Math.floor(oppRating / 200)));
        const defaultClasses = ['paladin', 'warlord', 'berserker', 'tactical_gunner', 'high_saintess'];
        const defenseSquad: Mercenary[] = defaultClasses.map((clsId, cIdx) => {
          const cls = CHARACTER_CLASSES[clsId] || CHARACTER_CLASSES['squire'];
          const pos = cIdx < 3 ? 'front' : 'back';
          const lv = Math.max(20, Math.floor(oppRating / 55));
          return {
            id: `inv_real_hero_${entry.rank}_${cIdx}`,
            name: `${entry.nickname}의 ${cls.name}`,
            title: cls.name,
            classId: clsId,
            grade: lv >= 35 ? 'epic' : lv >= 25 ? 'elite' : 'veteran',
            level: lv,
            exp: 0,
            expToNext: 100,
            currentHp: cls.baseStats.hp * 3 + lv * 25,
            maxHp: cls.baseStats.hp * 3 + lv * 25,
            currentMp: cls.baseStats.mp + lv * 5,
            maxMp: cls.baseStats.mp + lv * 5,
            position: pos,
            stats: {
              atk: cls.baseStats.atk * 2 + lv * 3,
              def: cls.baseStats.def * 2 + lv * 2,
              spd: cls.baseStats.spd + Math.floor(lv / 5),
              luck: cls.baseStats.luck + Math.floor(lv / 4),
            },
            equippedSkills: cls.skills.map(s => s.id),
            learnedSkills: cls.skills.map(s => s.id),
            equipment: {},
            statusEffects: [],
            portraitPromptKey: cls.promptKey,
          };
        });
        const totalPower = defenseSquad.reduce((sum, h) => sum + (h.stats.atk * 3 + h.stats.def * 2 + h.maxHp / 5), 0);
        targets.push({
          id: `target_real_${entry.rank}_${Date.now()}`,
          name: `${entry.nickname}의 방주 영지`,
          ownerNickname: entry.nickname,
          gateLevel: gateLv,
          bonfireLevel: Math.min(10, gateLv + 1),
          rating: oppRating,
          defensePower: Math.round(totalPower),
          defenseSquad,
          estateResources: {
            gold: Math.round(oppRating * 40),
            wood: Math.round(oppRating * 25),
            stone: Math.round(oppRating * 20),
            iron: Math.round(oppRating * 15),
            food: Math.round(oppRating * 18),
            ether: Math.round(oppRating * 4),
            herb: 120, leather: 120, silk: 90, coal: 110, bone: 90,
            crystal: 20, void_shard: 15, prefix_stone: 15, suffix_stone: 15,
          },
          isShielded: false,
          guildName: '심연 개척단',
          avatarIcon: '🏰',
          isBot: false, // 🌐 실제 유저!
          tacticalTower: {
            attack: { tier1: Math.min(3, Math.max(1, gateLv - 5)), tier2: Math.min(3, Math.max(0, gateLv - 6)), tier3: 0 },
            defense: { tier1: Math.min(3, Math.max(1, gateLv - 5)), tier2: Math.min(3, Math.max(0, gateLv - 6)), tier3: 0 },
            utility: { tier1: Math.min(3, Math.max(1, gateLv - 5)), tier2: Math.min(3, Math.max(0, gateLv - 6)), tier3: 0 },
          }
        });
      }
    } catch (_) {}

    const botArchetypes = [
      {
        name: '아이언팽 요새 영지',
        ownerNickname: '사령관 바르가스',
        guildName: '강철의 여명회',
        gateLevel: Math.max(6, Math.min(10, myGateLv + (Math.random() > 0.5 ? 1 : 0))),
        bonfireLevel: 7,
        classes: ['paladin', 'warlord', 'berserker', 'tactical_gunner', 'high_saintess'],
        avatarIcon: '🏰',
        gold: 48000, wood: 32000, stone: 24000, iron: 18000, food: 15000, ether: 3600
      },
      {
        name: '달빛 에테르 성소',
        ownerNickname: '대마도사 셀레스트',
        guildName: '비전 탐구단',
        gateLevel: Math.max(6, Math.min(10, myGateLv - 1 + Math.floor(Math.random() * 3))),
        bonfireLevel: 8,
        classes: ['guardian', 'calamity_mage', 'arcane_scholar', 'bishop', 'shadow_phantom'],
        avatarIcon: '✨',
        gold: 65000, wood: 20000, stone: 15000, iron: 12000, food: 22000, ether: 7800
      },
      {
        name: '핏빛 심연 원정기지',
        ownerNickname: '광전사 발할',
        guildName: '진홍의 학살자들',
        gateLevel: Math.max(6, Math.min(10, myGateLv + Math.floor(Math.random() * 2))),
        bonfireLevel: 6,
        classes: ['valhalla_blade', 'berserker', 'assassin', 'aether_gun_meister', 'war_priest'],
        avatarIcon: '🩸',
        gold: 38000, wood: 45000, stone: 35000, iron: 28000, food: 30000, ether: 2900
      },
      {
        name: '발키리 성스러운 방주',
        ownerNickname: '성녀 엘레나',
        guildName: '빛의 성기사단',
        gateLevel: Math.max(6, Math.min(10, myGateLv + 1)),
        bonfireLevel: 9,
        classes: ['aegis_valkyrie', 'paladin', 'elementalist', 'high_saintess', 'tactical_gunner'],
        avatarIcon: '🕊️',
        gold: 72000, wood: 52000, stone: 42000, iron: 31000, food: 28000, ether: 9200
      },
      {
        name: '섀도우 스파이어 은신처',
        ownerNickname: '망령 섀도우',
        guildName: '무명의 암영길드',
        gateLevel: Math.max(6, Math.min(10, myGateLv)),
        bonfireLevel: 7,
        classes: ['shadow_phantom', 'assassin', 'duelist', 'sharpshooter', 'arcane_scholar'],
        avatarIcon: '🥷',
        gold: 55000, wood: 28000, stone: 19000, iron: 22000, food: 18000, ether: 4500
      },
    ];

    let bIdx = 0;
    while (targets.length < limit) {
      const arch = botArchetypes[bIdx % botArchetypes.length];
      const idx = targets.length;
      const oppRating = Math.max(1200, myRating - 150 + idx * 80 + Math.floor(Math.random() * 50));
      const defenseSquad: Mercenary[] = arch.classes.map((clsId, cIdx) => {
        const cls = CHARACTER_CLASSES[clsId] || CHARACTER_CLASSES['squire'];
        const pos = cIdx < 3 ? 'front' : 'back';
        const lv = Math.max(20, Math.floor(oppRating / 55));
        return {
          id: `inv_bot_hero_${idx}_${cIdx}`,
          name: `${arch.ownerNickname}의 ${cls.name}`,
          title: cls.name,
          classId: clsId,
          grade: lv >= 35 ? 'epic' : lv >= 25 ? 'elite' : 'veteran',
          level: lv,
          exp: 0,
          expToNext: 100,
          currentHp: cls.baseStats.hp * 3 + lv * 25,
          maxHp: cls.baseStats.hp * 3 + lv * 25,
          currentMp: cls.baseStats.mp + lv * 5,
          maxMp: cls.baseStats.mp + lv * 5,
          position: pos,
          stats: {
            atk: cls.baseStats.atk * 2 + lv * 3,
            def: cls.baseStats.def * 2 + lv * 2,
            spd: cls.baseStats.spd + Math.floor(lv / 5),
            luck: cls.baseStats.luck + Math.floor(lv / 4),
          },
          equippedSkills: cls.skills.map(s => s.id),
          learnedSkills: cls.skills.map(s => s.id),
          equipment: {},
          statusEffects: [],
          portraitPromptKey: cls.promptKey,
        };
      });

      const totalPower = defenseSquad.reduce((sum, h) => sum + (h.stats.atk * 3 + h.stats.def * 2 + h.maxHp / 5), 0);
      const isShielded = Math.random() < 0.15; // 15% 확률로 보호막

      targets.push({
        id: `target_estate_${idx}_${Date.now()}`,
        name: arch.name,
        ownerNickname: arch.ownerNickname,
        gateLevel: arch.gateLevel,
        bonfireLevel: arch.bonfireLevel,
        rating: oppRating,
        defensePower: Math.round(totalPower),
        defenseSquad,
        estateResources: {
          gold: arch.gold,
          wood: arch.wood,
          stone: arch.stone,
          iron: arch.iron,
          food: arch.food,
          ether: arch.ether,
          herb: 100 + Math.floor(Math.random() * 150),
          leather: 100 + Math.floor(Math.random() * 150),
          silk: 80 + Math.floor(Math.random() * 120),
          coal: 100 + Math.floor(Math.random() * 150),
          bone: 80 + Math.floor(Math.random() * 120),
          crystal: 15 + Math.floor(Math.random() * 25),
          void_shard: 10 + Math.floor(Math.random() * 20),
          prefix_stone: 12 + Math.floor(Math.random() * 18),
          suffix_stone: 12 + Math.floor(Math.random() * 18),
        },
        isShielded,
        shieldExpiresAt: isShielded ? Date.now() + 7200000 : undefined,
        guildName: arch.guildName,
        avatarIcon: arch.avatarIcon,
        isBot: true, // 🤖 봇!
        tacticalTower: {
          attack: {
            tier1: Math.min(3, Math.max(1, arch.gateLevel - 5)),
            tier2: Math.min(3, Math.max(0, arch.gateLevel - 6)),
            tier3: Math.min(3, Math.max(0, arch.gateLevel - 7)),
          },
          defense: {
            tier1: Math.min(3, Math.max(1, arch.gateLevel - 5)),
            tier2: Math.min(3, Math.max(0, arch.gateLevel - 6)),
            tier3: Math.min(3, Math.max(0, arch.gateLevel - 7)),
          },
          utility: {
            tier1: Math.min(3, Math.max(1, arch.gateLevel - 5)),
            tier2: Math.min(3, Math.max(0, arch.gateLevel - 6)),
            tier3: Math.min(3, Math.max(0, arch.gateLevel - 7)),
          },
        },
      });

      bIdx++;
    }

    this.invasionState.lastScoutedAt = Date.now();
    return targets;
  }

  /** 침공 전투 승리/패배 처리: 골드&에테르 고정 30% + 영지생산, 파밍, 심연 재료 각 1종 랜덤 30% 약탈 */
  public executeInvasionPlunder(
    target: InvasionTarget,
    isWin: boolean,
    _legacyTargetResType?: keyof GameResources
  ): {
    plunderedAmount: number;
    rewardCoins: number;
    plunderedItems: Array<{ resKey: keyof GameResources; name: string; icon: string; category: string; amount: number }>;
  } {
    if (isWin) {
      const plunderedItems: Array<{ resKey: keyof GameResources; name: string; icon: string; category: string; amount: number }> = [];

      const resMetaMap: Record<string, { name: string; icon: string }> = {
        gold: { name: '골드', icon: '🪙' },
        ether: { name: '에테르', icon: '✨' },
        wood: { name: '목재', icon: '🪵' },
        stone: { name: '석재', icon: '🪨' },
        iron: { name: '철광석', icon: '⚙️' },
        food: { name: '식량', icon: '🍖' },
        herb: { name: '약초', icon: '🌿' },
        leather: { name: '가죽', icon: '🧱' },
        silk: { name: '실크', icon: '🧵' },
        coal: { name: '석탄', icon: '⚫' },
        bone: { name: '뼈', icon: '🦴' },
        crystal: { name: '마법 수정', icon: '🔮' },
        void_shard: { name: '공허 파편', icon: '🌌' },
        prefix_stone: { name: '접두석', icon: '💎' },
        suffix_stone: { name: '접미석', icon: '💠' },
      };

      // 1. 고정 약탈: 골드(30%), 에테르(30%)
      const goldSrc = target.estateResources.gold || 40000;
      const goldAmt = Math.max(100, Math.floor(goldSrc * 0.30));
      plunderedItems.push({ resKey: 'gold', name: '골드', icon: '🪙', category: '고정 약탈', amount: goldAmt });

      const etherSrc = target.estateResources.ether || 3000;
      const etherAmt = Math.max(20, Math.floor(etherSrc * 0.30));
      plunderedItems.push({ resKey: 'ether', name: '에테르', icon: '✨', category: '고정 약탈', amount: etherAmt });

      // 2. 영지 생산자원 중 랜덤 1개 (wood, stone, iron, food) 30%
      const prodPool: (keyof GameResources)[] = ['wood', 'stone', 'iron', 'food'];
      const prodRes = prodPool[Math.floor(Math.random() * prodPool.length)];
      const prodSrc = target.estateResources[prodRes] || 20000;
      const prodAmt = Math.max(50, Math.floor(prodSrc * 0.30));
      const prodMeta = resMetaMap[prodRes] || { name: String(prodRes), icon: '📦' };
      plunderedItems.push({ resKey: prodRes, name: prodMeta.name, icon: prodMeta.icon, category: '영지 생산자원', amount: prodAmt });

      // 3. 파밍 재료 중 랜덤 1개 (herb, leather, silk, coal, bone) 30%
      const farmPool: (keyof GameResources)[] = ['herb', 'leather', 'silk', 'coal', 'bone'];
      const farmRes = farmPool[Math.floor(Math.random() * farmPool.length)];
      const farmSrc = target.estateResources[farmRes] || 150;
      const farmAmt = Math.max(10, Math.floor(farmSrc * 0.30));
      const farmMeta = resMetaMap[farmRes] || { name: String(farmRes), icon: '🌿' };
      plunderedItems.push({ resKey: farmRes, name: farmMeta.name, icon: farmMeta.icon, category: '파밍 재료', amount: farmAmt });

      // 4. 심연 재료 중 랜덤 1개 (crystal, void_shard, prefix_stone, suffix_stone) 30%
      const abyssPool: (keyof GameResources)[] = ['crystal', 'void_shard', 'prefix_stone', 'suffix_stone'];
      const abyssRes = abyssPool[Math.floor(Math.random() * abyssPool.length)];
      const abyssSrc = target.estateResources[abyssRes] || 25;
      const abyssAmt = Math.max(2, Math.floor(abyssSrc * 0.30));
      const abyssMeta = resMetaMap[abyssRes] || { name: String(abyssRes), icon: '🔮' };
      plunderedItems.push({ resKey: abyssRes, name: abyssMeta.name, icon: abyssMeta.icon, category: '심연 재료', amount: abyssAmt });

      // 자원 차감/지급 및 통계 반영
      for (const item of plunderedItems) {
        this.modifyResource(item.resKey, item.amount);
        this.invasionState.totalPlundered[item.resKey] = (this.invasionState.totalPlundered[item.resKey] || 0) + item.amount;
      }

      this.invasionState.totalInvasions = (this.invasionState.totalInvasions || 0) + 1;
      this.invasionState.totalWins = (this.invasionState.totalWins || 0) + 1;

      const summaryText = plunderedItems.map(p => `${p.icon}${p.name} +${p.amount.toLocaleString()}`).join(', ');
      this.addLog(`🏰 [차원 침공 대승리] 『${target.name}』(${target.ownerNickname}) 영지를 함락하고 각 30%를 약탈했습니다! (${summaryText})`, 'reward');

      this.updateQuestObjective('Q_INVASION_FIRST_SIEGE', 0, 1);
      this.checkAllQuestObjectives();

      this.emit('resourcesUpdated', this.resources);
      this.emit('invasionUpdated', this.invasionState);
      this.emit('update');
      this.saveGame();

      return { plunderedAmount: goldAmt, rewardCoins: 0, plunderedItems };
    } else {
      this.invasionState.totalInvasions = (this.invasionState.totalInvasions || 0) + 1;
      this.updateQuestObjective('Q_INVASION_FIRST_SIEGE', 0, 1);
      this.checkAllQuestObjectives();

      this.addLog(`💀 [차원 침공 패배] 『${target.name}』 영지의 5인 방어 부대에게 가로막혀 약탈에 실패하고 퇴각했습니다.`, 'danger');

      this.emit('invasionUpdated', this.invasionState);
      this.emit('update');
      this.saveGame();

      return { plunderedAmount: 0, rewardCoins: 0, plunderedItems: [] };
    }
  }

  /** 방어 전술 타워 상태 반환 (null-safe 보장) */
  public getTacticalTower(): TacticalTowerState {
    if (!this.invasionState.tacticalTower) {
      this.invasionState.tacticalTower = {
        attack: { tier1: 0, tier2: 0, tier3: 0 },
        defense: { tier1: 0, tier2: 0, tier3: 0 },
        utility: { tier1: 0, tier2: 0, tier3: 0 },
      };
    }
    const tt = this.invasionState.tacticalTower;
    if (!tt.attack) tt.attack = { tier1: 0, tier2: 0, tier3: 0 };
    if (!tt.defense) tt.defense = { tier1: 0, tier2: 0, tier3: 0 };
    if (!tt.utility) tt.utility = { tier1: 0, tier2: 0, tier3: 0 };
    return tt;
  }

  /** 방어 전술 타워 테크 업그레이드 비용 계산 (골드, 에테르, 마법 수정, 공허 파편 등 심연 재료 소모) */
  public getTacticalTowerUpgradeCost(
    branch: TacticalTowerBranch,
    tier: 1 | 2 | 3,
    currentLv: number
  ): Partial<GameResources> {
    if (currentLv >= 3) return {};

    if (tier === 1) {
      if (currentLv === 0) return { gold: 3000, ether: 100, crystal: 2 };
      if (currentLv === 1) return { gold: 8000, ether: 250, crystal: 5, void_shard: 2 };
      if (currentLv === 2) return { gold: 18000, ether: 500, crystal: 10, void_shard: 5 };
    } else if (tier === 2) {
      if (currentLv === 0) return { gold: 6000, ether: 200, crystal: 4, void_shard: 3 };
      if (currentLv === 1) return { gold: 15000, ether: 450, crystal: 8, void_shard: 6 };
      if (currentLv === 2) return { gold: 35000, ether: 900, crystal: 16, void_shard: 12 };
    } else if (tier === 3) {
      if (currentLv === 0) return { gold: 12000, ether: 400, crystal: 8, void_shard: 6 };
      if (currentLv === 1) return { gold: 30000, ether: 800, crystal: 16, void_shard: 14 };
      if (currentLv === 2) return { gold: 70000, ether: 1800, crystal: 30, void_shard: 25 };
    }
    return { gold: 5000, ether: 100 };
  }

  /** 방어 전술 타워 테크 업그레이드 실행 */
  public upgradeTacticalTower(
    branch: TacticalTowerBranch,
    tier: 1 | 2 | 3
  ): { success: boolean; message: string } {
    const tower = this.getTacticalTower();
    const branchState = tower[branch];
    const key = `tier${tier}` as 'tier1' | 'tier2' | 'tier3';
    const currentLv = branchState[key];

    if (currentLv >= 3) {
      return { success: false, message: '이미 최고 레벨(Lv.3)에 도달했습니다.' };
    }

    // 선행 테크 해금 조건 검사
    if (tier === 2 && branchState.tier1 < 1) {
      return { success: false, message: '선행 기술인 1차 테크를 최소 1레벨 이상 활성화해야 합니다.' };
    }
    if (tier === 3 && branchState.tier2 < 1) {
      return { success: false, message: '선행 기술인 2차 테크를 최소 1레벨 이상 활성화해야 합니다.' };
    }

    // 비용 검사
    const cost = this.getTacticalTowerUpgradeCost(branch, tier, currentLv);
    for (const [resKey, amount] of Object.entries(cost)) {
      const currentAmount = this.resources[resKey as keyof GameResources] || 0;
      if (currentAmount < (amount || 0)) {
        const resNames: Record<string, string> = {
          gold: '골드 🪙',
          ether: '에테르 ✨',
          crystal: '마법 수정 🔮',
          void_shard: '공허 파편 🌌',
          wood: '목재 🪵',
          stone: '석재 🪨',
          iron: '철광석 ⚙️',
          food: '식량 🍖',
        };
        return { success: false, message: `자원이 부족합니다: ${resNames[resKey] || resKey} 필요량(${amount}) > 보유량(${currentAmount})` };
      }
    }

    // 자원 차감
    for (const [resKey, amount] of Object.entries(cost)) {
      if (amount && amount > 0) {
        this.modifyResource(resKey as keyof GameResources, -amount);
      }
    }

    // 레벨업 반영
    branchState[key] = currentLv + 1;

    const branchNames: Record<TacticalTowerBranch, string> = {
      attack: '공격 전술',
      defense: '방어 전술',
      utility: '유틸 전술',
    };
    const tierNames: Record<1 | 2 | 3, string> = {
      1: '1차 테크',
      2: '2차 테크',
      3: '3차 테크',
    };

    this.addLog(`🏗️ [방어 전술 타워 강화] ${branchNames[branch]} - ${tierNames[tier]}이(가) Lv.${currentLv + 1}(으)로 연구 완료되었습니다!`, 'reward');

    this.updateQuestObjective('Q_TACTICAL_TOWER_RESEARCH', 0, 1);
    this.checkAllQuestObjectives();

    this.emit('invasionUpdated', this.invasionState);
    this.emit('resourcesUpdated', this.resources);
    this.emit('update');
    this.saveGame();

    return { success: true, message: `${branchNames[branch]} ${tierNames[tier]} 연구 완료 (Lv.${currentLv + 1})` };
  }

  /** 내 영지 차원 보호막(Peace Shield) 활성화 (시간 단위) */
  public activatePeaceShield(hours: number = 3): boolean {
    const durationMs = hours * 3600 * 1000;
    this.invasionState.peaceShieldUntil = Math.max(Date.now(), this.invasionState.peaceShieldUntil || 0) + durationMs;
    this.addLog(`🛡️ [차원 보호막 전개] 영지에 ${hours}시간 동안 차원 침공 방어막이 활성화되었습니다!`, 'reward');
    this.emit('invasionUpdated', this.invasionState);
    this.emit('update');
    this.saveGame();
    return true;
  }

  /** 피침공 방어 로그 추가 (패배 시 3시간 자동 보호막) */
  public addDefenseLog(log: InvasionDefenseLog): void {
    if (!this.invasionState.defenseLogs) this.invasionState.defenseLogs = [];
    this.invasionState.defenseLogs.unshift(log);
    if (this.invasionState.defenseLogs.length > 20) {
      this.invasionState.defenseLogs = this.invasionState.defenseLogs.slice(0, 20);
    }

    if (!log.isVictory) {
      // 🌟 방어 실패 시 추가 연속 약탈 방지를 위한 3시간 자동 평화 보호막
      this.activatePeaceShield(3);
      if (log.plunderedResource) {
        this.addLog(`⚠️ [영지 피침공 경보] 『${log.attackerName}』의 침공으로 방어 부대가 패배하여 ${log.plunderedResource.name} ${log.plunderedResource.amount.toLocaleString()}개를 약탈당했습니다! (3시간 긴급 보호막 가동)`, 'danger');
      }
    } else {
      this.addLog(`🛡️ [영지 방어 성공] 『${log.attackerName}』의 침공을 5인 방어 부대가 완벽히 격퇴하고 영지 자원을 사수했습니다!`, 'reward');
    }

    this.emit('invasionUpdated', this.invasionState);
    this.emit('update');
    this.saveGame();
  }

  // ================= 용병 간 유대(Bond) 및 모닥불 토크 시스템 =================
  private getBondKey(id1: string, id2: string): string {
    return [id1, id2].sort().join('_');
  }

  public getBond(id1: string, id2: string): number {
    const key = this.getBondKey(id1, id2);
    return this.bonds[key] ?? 10; // 기본 초기 친밀도 10
  }

  public setBond(id1: string, id2: string, value: number): void {
    const key = this.getBondKey(id1, id2);
    this.bonds[key] = Math.max(0, Math.min(100, value));
    this.emit('bondsUpdated', this.bonds);
    this.saveGame();
  }

  public increaseBond(id1: string, id2: string, delta: number): number {
    const current = this.getBond(id1, id2);
    const updated = Math.max(0, Math.min(100, current + delta));
    this.setBond(id1, id2, updated);
    return updated;
  }

  public getBondLevel(bondValue: number): { level: number; title: string; perk: string } {
    if (bondValue >= 100) return { level: 5, title: '영혼의 결속', perk: '전투 시작 시 MP 30% 회복 (전원 최대 유대 시 50% 회복) & 공/방 +15%' };
    if (bondValue >= 80)  return { level: 4, title: '사선의 맹세', perk: '치명적 피해 시 1회 체력 1로 생존(불굴) & 스탯 +10%' };
    if (bondValue >= 60)  return { level: 3, title: '굳건한 신뢰', perk: '치명타율 +8% & 아군 빈사 시 50 HP 수호 보호막 자동 발동' };
    if (bondValue >= 40)  return { level: 2, title: '전술적 호흡', perk: '일반 공격 시 25% 확률로 동료의 원호 공격(Assist Attack)' };
    if (bondValue >= 20)  return { level: 1, title: '동료애', perk: '야영 회복량 +5% & 최대 HP +5%' };
    return { level: 0, title: '초면', perk: '효과 없음' };
  }

  /** 파티 내에서 특정 영웅이 소외감(다른 2명은 친하고 본인은 고립)을 느끼고 있는지 여부 판정 */
  public isHeroAlienated(heroId: string): boolean {
    if (!this.party || this.party.length !== 3) return false;
    const hero = this.party.find(h => h && h.id === heroId);
    if (!hero) return false;

    const others = this.party.filter(h => h && h.id !== heroId);
    if (others.length !== 2) return false;

    const bondBetweenOthers = this.getBond(others[0].id, others[1].id);
    const bondWithOther0 = this.getBond(heroId, others[0].id);
    const bondWithOther1 = this.getBond(heroId, others[1].id);

    // 다른 두 동료의 상호 유대가 35 이상이고, 자신과의 유대는 둘 다 15 이하일 때 소외 상태
    return bondBetweenOthers >= 35 && bondWithOther0 <= 15 && bondWithOther1 <= 15;
  }

  /** 사경(Near-Death)에서 간신히 생환한 영웅의 트라우마로 인한 유대감 30% 하락 및 유대 등급 강등 처리 */
  public applyNearDeathTraumaBondDrop(survivorHeroId: string): void {
    if (!this.party || this.party.length === 0) return;
    const survivor = this.party.find(h => h && h.id === survivorHeroId);
    if (!survivor) return;

    const aliveOthers = this.party.filter(h => h && h.id !== survivorHeroId && !h.isPermanentlyDead);
    if (aliveOthers.length === 0) return;

    aliveOthers.forEach(other => {
      const currentBond = this.getBond(survivorHeroId, other.id);
      if (currentBond <= 0) return;

      // 30% 하락 (최소 1 하락)
      const loss = Math.max(1, Math.round(currentBond * 0.3));
      const newBond = Math.max(0, currentBond - loss);

      const prevTier = this.getBondLevel(currentBond);
      const newTier = this.getBondLevel(newBond);

      this.setBond(survivorHeroId, other.id, newBond);

      if (prevTier.level > newTier.level) {
        this.addLog(
          `💔 [유대의 균열] 사경의 문턱에서 죽음의 공포를 겪은 [${survivor.name}]의 눈빛에 짙은 불신과 그늘이 드리웁니다. [${other.name}]과의 굳건했던 믿음이 무너지며 둘의 관계가 [${prevTier.title}]에서 [${newTier.title}] 단계로 냉담하게 멀어졌습니다...`,
          'danger'
        );
      } else {
        this.addLog(
          `💔 [사경의 상흔] 죽음의 경계를 넘나들다 돌아온 [${survivor.name}]이(가) 깊은 트라우마에 짓눌려 [${other.name}]과의 거리를 두며 마음의 문을 닫아겁니다...`,
          'danger'
        );
      }
    });

    this.emit('bondsUpdated', this.bonds);
    this.saveGame();
  }

  /** 야영 시 모닥불 토크 발생 및 유대/소외감 계산 */
  public triggerCampBanter(): {
    dialogues: { speakerName: string; text: string; icon: string }[];
    bondChanges: { heroAId: string; heroBId: string; delta: number; reason: string }[];
    isFriction: boolean;
    frictionHeroName?: string;
    unlockedBuffs: string[];
  } {
    const party = this.party;
    if (party.length < 2) {
      return {
        dialogues: [{ speakerName: '방주 원정대', text: '조용히 모닥불을 바라보며 휴식을 취합니다...', icon: '🏕️' }],
        bondChanges: [],
        isFriction: false,
        unlockedBuffs: []
      };
    }

    const dialogues: { speakerName: string; text: string; icon: string }[] = [];
    const bondChanges: { heroAId: string; heroBId: string; delta: number; reason: string }[] = [];
    const unlockedBuffs: string[] = [];
    let isFriction = false;
    let frictionHeroName: string | undefined;

    // 3인 파티일 때 소외/배척 및 환영 체크
    let newcomerWelcomed = false;
    if (party.length === 3) {
      const b01 = this.getBond(party[0].id, party[1].id);
      const b02 = this.getBond(party[0].id, party[2].id);
      const b12 = this.getBond(party[1].id, party[2].id);

      // 소외 상태 (기존 2명의 유대가 35 이상이고 1명의 유대가 15 이하)
      let isolatedIdx = -1;
      let vet1Idx = -1;
      let vet2Idx = -1;

      if (b01 >= 35 && b02 <= 15 && b12 <= 15) {
        isolatedIdx = 2; vet1Idx = 0; vet2Idx = 1;
      } else if (b02 >= 35 && b01 <= 15 && b12 <= 15) {
        isolatedIdx = 1; vet1Idx = 0; vet2Idx = 2;
      } else if (b12 >= 35 && b01 <= 15 && b02 <= 15) {
        isolatedIdx = 0; vet1Idx = 1; vet2Idx = 2;
      }

      if (isolatedIdx !== -1) {
        const isolatedHero = party[isolatedIdx];
        const vet1 = party[vet1Idx];
        const vet2 = party[vet2Idx];

        // 🎲 30% 확률로 따뜻한 환영 및 포용 이벤트 발생, 70% 확률로 기존 배척/소외감 페널티 발생
        const isWelcomingRoll = Math.random() < 0.30;

        if (isWelcomingRoll) {
          // 🌟 [30% 특별 환영 이벤트] 기존 대원들이 신입 대원을 따뜻하게 챙겨주며 포용
          newcomerWelcomed = true;
          const WELCOME_DIALOGUES = [
            [
              { speakerName: vet1.name, text: `${isolatedHero.name}, 모닥불 옆으로 더 가까이 와. 여기 따뜻한 스튜 한 그릇 들게.`, icon: '🍲' },
              { speakerName: isolatedHero.name, text: `아... 감사합니다. 두 분이 워낙 손발이 잘 맞으셔서 제가 방해가 되진 않을까 걱정했어요.`, icon: '😳' },
              { speakerName: vet2.name, text: `무슨 소릴! 심연에선 한 배를 탄 전우야. 등이 든든해졌으니 이제 우리와 호흡을 맞추면 돼!`, icon: '😄' },
              { speakerName: '방주 원정대', text: `기존 대원들의 따뜻한 배려로 [${isolatedHero.name}]이(가) 마음의 벽을 허물고 빠르게 녹아듭니다!`, icon: '🤝' }
            ],
            [
              { speakerName: vet2.name, text: `${isolatedHero.name}, 아까 전투에서 뒤를 든든하게 받쳐줘서 고마웠어.`, icon: '✨' },
              { speakerName: isolatedHero.name, text: `제가 제 몫을 했는지 모르겠네요... 아직 두 분의 움직임에 따라가기가 벅찹니다.`, icon: '🙇' },
              { speakerName: vet1.name, text: `처음엔 누구나 그래. 우린 서로 지켜주며 여기까지 온 거야. 이제 넌 우리의 소중한 동료야.`, icon: '🛡️' },
              { speakerName: '방주 원정대', text: `진솔한 격려와 조언 속에서 [${isolatedHero.name}]과의 신뢰와 전우애가 싹틉니다!`, icon: '💖' }
            ]
          ];

          const chosenWelcome = WELCOME_DIALOGUES[Math.floor(Math.random() * WELCOME_DIALOGUES.length)];
          dialogues.push(...chosenWelcome);

          // 신입 대원 대상 유대감 집중 상승 (+4 ~ +6 보너스 캐치업)
          const catchupDelta = Math.floor(Math.random() * 3) + 4; // +4 ~ +6
          const newB1 = this.increaseBond(isolatedHero.id, vet1.id, catchupDelta);
          const newB2 = this.increaseBond(isolatedHero.id, vet2.id, catchupDelta);
          bondChanges.push(
            { heroAId: isolatedHero.id, heroBId: vet1.id, delta: catchupDelta, reason: '신입 환영 & 결속' },
            { heroAId: isolatedHero.id, heroBId: vet2.id, delta: catchupDelta, reason: '신입 환영 & 결속' }
          );

          // 기존 베테랑 간에도 소량 유대 상승 (+1~+2)
          const vetDelta = Math.floor(Math.random() * 2) + 1;
          this.increaseBond(vet1.id, vet2.id, vetDelta);
          bondChanges.push({ heroAId: vet1.id, heroBId: vet2.id, delta: vetDelta, reason: '모닥불 교감' });

          this.addLog(`💖 [원정대 포용] 기존 동료들이 [${isolatedHero.name}]을(를) 모닥불로 이끌며 환영했습니다! (유대감 집중 상승 +${catchupDelta})`, 'reward');

          // 임계점 체크
          [newB1, newB2].forEach((nb, idx) => {
            const vHero = idx === 0 ? vet1 : vet2;
            const thresholds = [20, 40, 60, 80, 100];
            thresholds.forEach(th => {
              if (nb >= th && (nb - catchupDelta) < th) {
                const meta = this.getBondLevel(th);
                unlockedBuffs.push(`${isolatedHero.name} & ${vHero.name} : [${meta.title}] 해금! (${meta.perk})`);
                this.addLog(`💖 [유대 공명] ${isolatedHero.name} 🤝 ${vHero.name} 두 대원의 유대가 [${meta.title}] 단계로 승격되었습니다! (${meta.perk})`, 'reward');
              }
            });
          });
        } else {
          // 💔 [70% 기존 배척/소외감 이벤트] 버스 및 소모품 용병 남용 견제: 대화 단절 및 유대감 페널티(-2)
          isFriction = true;
          frictionHeroName = isolatedHero.name;

          if (isolatedIdx === 2) {
            dialogues.push(
              { speakerName: party[0].name, text: `${party[1].name}, 아까 전투에서 그 타이밍은 정말 완벽했어. 손발이 척척 맞는군!`, icon: '🗣️' },
              { speakerName: party[1].name, text: `너와 함께 싸울 땐 등을 맡겨도 안심이 되니까. 하하!`, icon: '😄' },
              { speakerName: party[2].name, text: `...(둘의 화기애애한 대화에 끼어들지 못하고 조용히 모닥불만 응시한다)`, icon: '😔' }
            );
          } else if (isolatedIdx === 1) {
            dialogues.push(
              { speakerName: party[0].name, text: `${party[2].name}, 오늘 네 활약이 없었다면 위험했을 거야. 고마워.`, icon: '🗣️' },
              { speakerName: party[2].name, text: `별말씀을요. 우린 서로를 믿으니까요.`, icon: '✨' },
              { speakerName: party[1].name, text: `...(어색한 침묵 속에 무기를 손질하며 한숨을 쉰다)`, icon: '😔' }
            );
          } else {
            dialogues.push(
              { speakerName: party[1].name, text: `${party[2].name}, 심연을 다 건너면 성채 주점에서 맛있는 술이나 한잔하자고!`, icon: '🍻' },
              { speakerName: party[2].name, text: `좋아요! 그때까지 살아남기만 한다면요!`, icon: '😄' },
              { speakerName: party[0].name, text: `...(말없이 굳은 표정으로 심연의 어둠을 경계하고 있다)`, icon: '😔' }
            );
          }

          this.increaseBond(vet1.id, isolatedHero.id, -2);
          this.increaseBond(vet2.id, isolatedHero.id, -2);
          bondChanges.push(
            { heroAId: vet1.id, heroBId: isolatedHero.id, delta: -2, reason: '소외감' },
            { heroAId: vet2.id, heroBId: isolatedHero.id, delta: -2, reason: '소외감' }
          );
          this.addLog(`💔 [소외감] ${isolatedHero.name}이(가) 대화에 끼지 못하고 마음의 거리를 느낍니다. (모든 능력치 -10% 페널티)`, 'danger');
        }
      }
    }

    // 소외/배척 또는 환영 이벤트가 발생하지 않은 일반적인 경우 훈훈한 모닥불 대화 발생
    if (!isFriction && !newcomerWelcomed) {
      const h1 = party[0];
      const h2 = party[1];
      const delta = Math.floor(Math.random() * 3) + 2; // 기본 +2 ~ +4

      const BANTER_TEMPLATES = [
        [
          { speakerName: h1.name, text: `${h2.name}, 오늘 밤은 유난히 한기가 심하군... 따뜻한 수프라도 더 들겠나?`, icon: '🍲' },
          { speakerName: h2.name, text: `고마워. 네가 곁에 있어 준 덕분에 이 끔찍한 심연에서도 버틸 수 있어.`, icon: '🔥' },
          { speakerName: '원정대', text: '모닥불의 온기 속에서 동료들과 깊은 교감을 나눕니다.', icon: '💖' }
        ],
        [
          { speakerName: h2.name, text: `심연의 끝에는 정말 구원이 기다리고 있을까? 가끔은 두려워져.`, icon: '💭' },
          { speakerName: h1.name, text: `우리가 함께하는 한, 어떤 어둠도 우리를 무너뜨릴 수 없어. 내가 널 지킬게.`, icon: '🛡️' },
          { speakerName: '원정대', text: '굳은 신뢰의 눈빛을 주고받으며 결속을 다집니다.', icon: '✨' }
        ],
        [
          { speakerName: h1.name, text: `상처는 좀 어때? 아까 무리해서 날 감싸지 않아도 됐는데...`, icon: '🩹' },
          { speakerName: h2.name, text: `동료를 위해 방패가 되는 건 당연한 일이야. 내일도 함께 나아가자.`, icon: '🤝' },
          { speakerName: '원정대', text: '서로의 상처를 보듬으며 끈끈한 전우애를 형성합니다.', icon: '❤️' }
        ]
      ];

      const chosen = BANTER_TEMPLATES[Math.floor(Math.random() * BANTER_TEMPLATES.length)];
      dialogues.push(...chosen);

      // 모든 파티원 쌍 간의 유대 상승
      for (let i = 0; i < party.length; i++) {
        for (let j = i + 1; j < party.length; j++) {
          const oldVal = this.getBond(party[i].id, party[j].id);
          const newVal = this.increaseBond(party[i].id, party[j].id, delta);
          bondChanges.push({ heroAId: party[i].id, heroBId: party[j].id, delta, reason: '모닥불 교감' });

          // 임계점 체크 (20, 40, 60, 80, 100)
          const thresholds = [20, 40, 60, 80, 100];
          thresholds.forEach(th => {
            if (oldVal < th && newVal >= th) {
              const meta = this.getBondLevel(th);
              unlockedBuffs.push(`${party[i].name} & ${party[j].name} : [${meta.title}] 해금! (${meta.perk})`);
              this.addLog(`💖 [유대 공명] ${party[i].name} 🤝 ${party[j].name} 두 대원의 유대가 [${meta.title}] 단계로 승격되었습니다! (${meta.perk})`, 'reward');
            }
          });
        }
      }
    }

    this.updateQuestObjective('Q_CAMP_EXPEDITION', 0, 1);
    this.emit('campBanterTriggered', { dialogues, bondChanges, isFriction: false });
    return { dialogues, bondChanges, isFriction: false, frictionHeroName: undefined, unlockedBuffs };
  }

  // ================= 심연의 저주받은 장비 생성 & 정화 시스템 =================
  /** 각 층별 광폭화 보스 고유 상급/신화 장비 생성기 */
  public generateBossUniqueEquipment(floor: number): EquipmentItem {
    const f = Math.min(5, Math.max(1, floor));

    const BOSS_EQUIP_POOLS: Record<number, Array<{
      baseName: string;
      name: string;
      slot: EquipmentSlot;
      rarity: 'epic' | 'legendary';
      icon: string;
      stats: { atk?: number; def?: number; hp?: number; mp?: number; spd?: number; luck?: number };
      prefixId?: string;
      suffixId?: string;
      description: string;
    }>> = {
      // 1층: 침묵의 회랑 보스 전용 상급 비보
      1: [
        {
          baseName: '단검',
          name: '🗡️ [침묵의 비수]',
          slot: 'weapon',
          rarity: 'epic',
          icon: '🗡️',
          stats: { atk: 32, spd: 12, luck: 10 },
          prefixId: 'pre_glacial',
          description: '침묵의 회랑 수호자가 사용하던 서리빛 비수. 동결 타격 고유 스킬이 내재되어 있습니다.'
        },
        {
          baseName: '목걸이',
          name: '📿 [침묵의 회랑 목걸이]',
          slot: 'accessory',
          rarity: 'epic',
          icon: '📿',
          stats: { def: 20, hp: 153, luck: 7 },
          suffixId: 'suf_haste',
          description: '흑무 속에서도 착용자의 감각과 행동 속도를 비약적으로 증폭시키는 고대 목걸이.'
        },
        {
          baseName: '판금 갑옷',
          name: '🛡️ [회랑 수호자의 철벽 중갑]',
          slot: 'armor',
          rarity: 'epic',
          icon: '🛡️',
          stats: { def: 31, hp: 187, atk: 8 },
          suffixId: 'suf_scar',
          description: '수많은 심연의 칼날을 막아낸 회랑 수호자의 상흔 가득한 판금 갑주.'
        }
      ],
      // 2층: 망령의 납골당 보스 전용 상급 비보
      2: [
        {
          baseName: '검',
          name: '⚔️ [망령 기사의 사형선고검]',
          slot: 'weapon',
          rarity: 'epic',
          icon: '⚔️',
          stats: { atk: 46, def: 15, luck: 12 },
          prefixId: 'pre_reaper',
          description: '타락한 망령 기사의 저주받은 대검. 적에게 입힌 대미지의 15%를 흡혈합니다.'
        },
        {
          baseName: '로브',
          name: '🥻 [납골당의 영겁 로브]',
          slot: 'armor',
          rarity: 'epic',
          icon: '🥻',
          stats: { def: 27, mp: 128, hp: 170 },
          suffixId: 'suf_tenacity',
          description: '원혼의 마력이 깃들어 착용자의 마나를 대폭 늘리고 불굴의 방어력을 부여합니다.'
        },
        {
          baseName: '반지',
          name: '💍 [망령 군주의 영혼 반지]',
          slot: 'accessory',
          rarity: 'epic',
          icon: '💍',
          stats: { atk: 19, mp: 94, spd: 8, luck: 8 },
          suffixId: 'suf_arcana',
          description: '망령들의 순수 영혼수가 응축되어 마법 위력과 치명타율을 강화하는 반지.'
        }
      ],
      // 3층: 에테르 광맥 보스 전용 상급/전설 비보
      3: [
        {
          baseName: '지팡이',
          name: '🪄 [원초 광맥의 작열 스태프]',
          slot: 'weapon',
          rarity: 'legendary',
          icon: '🪄',
          stats: { atk: 53, mp: 162, spd: 12 },
          prefixId: 'pre_blazing',
          description: '마도 광맥의 핵으로 깎아낸 지팡이. 강력한 화염 작열탄 스킬을 시전할 수 있습니다.'
        },
        {
          baseName: '창',
          name: '🔱 [심층 광맥 관통창]',
          slot: 'weapon',
          rarity: 'legendary',
          icon: '🔱',
          stats: { atk: 55, def: 20, hp: 204 },
          prefixId: 'pre_thunder',
          description: '벼락의 에테르 전류가 흐르는 강철창. 적의 방패를 꿰뚫는 강력한 물리 공격력을 자랑합니다.'
        },
        {
          baseName: '목걸이',
          name: '📿 [에테르 심장 목걸이]',
          slot: 'accessory',
          rarity: 'legendary',
          icon: '📿',
          stats: { def: 29, hp: 272, mp: 76, spd: 10 },
          suffixId: 'suf_regen',
          description: '광맥의 생명력이 맥동하여 매 턴 착용자의 체력을 지속 재생시키는 최고급 비보.'
        }
      ],
      // 4층: 심연의 균열 보스 전용 전설 비보
      4: [
        {
          baseName: '마총',
          name: '🔫 [시공 붕괴 레일건]',
          slot: 'weapon',
          rarity: 'legendary',
          icon: '🔫',
          stats: { atk: 64, spd: 19, luck: 17 },
          prefixId: 'pre_thunder',
          description: '시공간의 균열을 압축 발사하는 초고속 결전 마총. 높은 민첩성과 치명타를 보장합니다.'
        },
        {
          baseName: '활',
          name: '🏹 [심연 균열의 사냥활]',
          slot: 'weapon',
          rarity: 'legendary',
          icon: '🏹',
          stats: { atk: 61, spd: 15, luck: 22 },
          prefixId: 'pre_void',
          description: '공허의 실로 엮어낸 장궁. 적의 방어력을 20% 무시하고 치명타를 꽂아넣습니다.'
        },
        {
          baseName: '로브',
          name: '🧥 [시공 왜곡의 수호 로브]',
          slot: 'armor',
          rarity: 'legendary',
          icon: '🧥',
          stats: { def: 39, hp: 323, mp: 178, spd: 14 },
          suffixId: 'suf_grace',
          description: '공간 결계를 펼쳐 아군 전체의 피해를 30% 감소시키는 [천상의 방벽] 스킬이 깃든 로브.'
        }
      ],
      // 5층: 원초의 제단 보스 전용 신화 비보
      5: [
        {
          baseName: '검',
          name: '👑 [심연 지배자의 종언 대검]',
          slot: 'weapon',
          rarity: 'legendary',
          icon: '👑',
          stats: { atk: 81, luck: 24, def: 24, hp: 255 },
          prefixId: 'pre_cataclysm',
          suffixId: 'suf_surge',
          description: '공허 지배자가 휘두르던 종언의 무기. 파멸의 강타와 심연 방출 2종의 파괴적 스킬을 동시에 다룹니다.'
        },
        {
          baseName: '반지',
          name: '💍 [수호자의 은빛 성역 반지]',
          slot: 'accessory',
          rarity: 'legendary',
          icon: '💍',
          stats: { atk: 32, def: 32, hp: 408, mp: 153, spd: 19, luck: 15 },
          prefixId: 'pre_holy',
          description: '방주 태초의 성역 정수가 담긴 신화의 반지. 착용자의 방어력과 생명력을 대폭 강화합니다.'
        },
        {
          baseName: '판금 갑옷',
          name: '🛡️ [모노리스의 불멸 방벽]',
          slot: 'armor',
          rarity: 'legendary',
          icon: '🛡️',
          stats: { def: 61, hp: 578, mp: 119 },
          suffixId: 'suf_grace',
          description: '모노리스의 파편으로 주조된 불멸의 갑주. 착용자에게 강력한 수호의 방어력을 제공합니다.'
        }
      ]
    };

    const pool = BOSS_EQUIP_POOLS[f] || BOSS_EQUIP_POOLS[1];
    const chosen = pool[Math.floor(Math.random() * pool.length)];

    const item: EquipmentItem = {
      id: `boss_unique_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      baseName: chosen.baseName,
      name: chosen.name,
      slot: chosen.slot,
      level: 1,
      rarity: chosen.rarity,
      stats: { ...chosen.stats },
      description: chosen.description,
      icon: chosen.icon,
    };

    if (chosen.prefixId && PREFIX_ENCHANT_OPTIONS[chosen.prefixId]) {
      item.prefix = PREFIX_ENCHANT_OPTIONS[chosen.prefixId];
    }
    if (chosen.suffixId && SUFFIX_ENCHANT_OPTIONS[chosen.suffixId]) {
      item.suffix = SUFFIX_ENCHANT_OPTIONS[chosen.suffixId];
    }

    return corruptEquipment(sanitizeEquipmentEnchantSkills(item));
  }

  /**
   * 📦 병기창 레벨 및 던전 층 연동 장비 드랍 생성 (석관 / 보물 상자 / 탐험 이벤트 등)
   * - 규칙: 드랍 장비 티어 = Math.min(dungeonFloor, blacksmithLevel)
   *   - 병기창 레벨 이하의 던전 층에서는 해당 층의 레벨 장비만 확정 드랍 (도감 수집 보장)
   *     (예: 병기창 Lv.4일 때 1층에서는 1렙 장비만, 4층에서는 4렙 장비만 드랍)
   *   - 던전 층이 병기창 레벨을 초과할 경우 병기창 레벨 장비로 제한 드랍
   *     (예: 병기창 Lv.4일 때 6층에 가도 4렙 장비만 드랍)
   * - 등급: 일반(common) 60%, 희귀(rare) 30%, 에픽(epic) 10%
   * - 인챈트: 40% 확률로 접두어나 접미어 둘 중 하나 인챈트 부여
   * - 등급이 달라도 도감 등록 가능
   * - 💀 던전 드랍 장비는 모두 침식된 상태([침식된])로 드랍되며 병기창 정화 필요
   */
  public generateForgeEquipmentDrop(floorOrTier?: number): EquipmentItem {
    const currentFloor = Math.max(1, Math.min(10, floorOrTier ?? this.dungeonFloor ?? 1));
    const blacksmithLv = Math.max(1, Math.min(10, this.buildings.blacksmith?.level || (this.buildings as any).forge?.level || 1));
    // 병기창 레벨 이하의 던전 층에서는 해당 층의 장비만 확정 드랍, 층수가 더 높으면 병기창 레벨로 캡
    const targetTier = Math.max(1, Math.min(10, Math.min(currentFloor, blacksmithLv)));

    const recipes = getForgeEquipmentRecipes(targetTier);
    const chosen = recipes[Math.floor(Math.random() * recipes.length)] || recipes[0];

    // 등급 롤링: 일반(common) 60%, 희귀(rare) 30%, 에픽(epic) 10%
    const roll = Math.random();
    let rarity: 'common' | 'rare' | 'epic' = 'common';
    if (roll < 0.10) {
      rarity = 'epic'; // 10%
    } else if (roll < 0.40) {
      rarity = 'rare'; // 30%
    } else {
      rarity = 'common'; // 60%
    }

    // 등급별 스탯 보너스 적용 (targetTier 기준)
    const { finalStats } = applyForgeRarityBonus(chosen.baseStats, chosen.slot, rarity, targetTier);

    // 40% 확률로 접두어나 접미어 둘 중 하나 인챈트 부여
    let rolledPrefix: EnchantOption | undefined = undefined;
    let rolledSuffix: EnchantOption | undefined = undefined;
    if (Math.random() < 0.40) {
      const isPrefix = Math.random() < 0.50;
      const targetEnchantRarity = rarity === 'epic' ? 'epic' : 'rare';
      if (isPrefix) {
        const pList = Object.values(PREFIX_ENCHANT_OPTIONS).filter(o => o.rarity === targetEnchantRarity || o.rarity === 'rare');
        if (pList.length > 0) {
          rolledPrefix = pList[Math.floor(Math.random() * pList.length)];
        }
      } else {
        const sList = Object.values(SUFFIX_ENCHANT_OPTIONS).filter(o => o.rarity === targetEnchantRarity || o.rarity === 'rare');
        if (sList.length > 0) {
          rolledSuffix = sList[Math.floor(Math.random() * sList.length)];
        }
      }
    }

    const pre = rolledPrefix ? `[${rolledPrefix.name}] ` : '';
    const suf = rolledSuffix ? ` [${rolledSuffix.name}]` : '';

    const item: EquipmentItem = {
      id: `equip_forge_drop_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      templateId: chosen.templateId, // e.g. forge_t1_sword
      baseName: chosen.name,         // e.g. 수습 대장장이의 철검
      name: `${pre}${chosen.name}${suf}`,
      slot: chosen.slot,
      weaponType: chosen.weaponType,
      weaponTrait: chosen.weaponTrait,
      tier: targetTier,
      level: targetTier,
      rarity: rarity,
      baseStats: { ...chosen.baseStats },
      stats: finalStats,
      description: `[심연 발굴 무구] ${chosen.description}`,
      icon: chosen.icon,
      prefix: rolledPrefix,
      suffix: rolledSuffix,
      affinity: chosen.affinity
    };

    return corruptEquipment(sanitizeEquipmentEnchantSkills(item));
  }

  public generateSarcophagusEquipment(floor: number): EquipmentItem {
    // 15% 확률로 해당 층 보스 유니크, 85% 확률로 병기창 레벨 이하 제식 장비 (일반 60%, 희귀 30%, 에픽 10%, 40% 인챈트)
    if (Math.random() < 0.15) {
      const bossUnique = this.generateBossUniqueEquipment(floor);
      return corruptEquipment(sanitizeEquipmentEnchantSkills(bossUnique));
    }
    return this.generateForgeEquipmentDrop(floor);
  }

  public generateCursedEquipment(floor: number): EquipmentItem {
    const baseDef = CURSED_EQUIP_BASES[Math.floor(Math.random() * CURSED_EQUIP_BASES.length)] || CURSED_EQUIP_BASES[0];
    const cursedName = `[침식된] ${baseDef.name}`;
    const cursedItem: EquipmentItem = {
      id: `cursed_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      baseName: baseDef.name,
      name: cursedName,
      slot: baseDef.slot,
      level: 0,
      rarity: 'common',
      baseStats: { atk: 12, hp: 45 },
      stats: { atk: 12, hp: 45 },
      description: `[심연에 침식된 장비] 사악한 마기에 오염되어 장착할 수 없습니다. 병기창 정화 시설에서 정화해야 합니다.`,
      icon: baseDef.icon,
      isCorrupted: true,
      isCursed: true,
      isUnpurified: true,
      curseDesc: '착용 불가 (병기창 정화 시설에서 정화 필요)',
      affinity: baseDef.affinity,
    };
    return corruptEquipment(cursedItem);
  }

  /** ✨ 병기창 레벨 연동 장비 정화 성공 확률 (기본 30% + 병기창 레벨당 5%) */
  public getPurifySuccessRate(): number {
    const forgeLv = this.buildings['blacksmith']?.level || 1;
    return Math.min(95, 30 + forgeLv * 5);
  }

  /** ✨ 5분이 지난 정화 이력 자동 만료 정리 */
  public cleanExpiredPurifiedItems(): void {
    const now = Date.now();
    this.purifiedEquipmentHistory = (this.purifiedEquipmentHistory || []).filter(
      entry => now - entry.purifiedAt < 5 * 60 * 1000
    );
  }

  /** ✨ 최근 5분 이내 정화된 장비 목록 조회 (잔여 초 포함) */
  public getPurifiedEquipmentHistory(): { item: EquipmentItem; purifiedAt: number; remainingSec: number }[] {
    this.cleanExpiredPurifiedItems();
    const now = Date.now();
    return (this.purifiedEquipmentHistory || []).map(entry => ({
      ...entry,
      remainingSec: Math.max(0, Math.ceil((5 * 60 * 1000 - (now - entry.purifiedAt)) / 1000))
    }));
  }

  /** ✨ 침식된 장비 병기창 정화 (기본 30% + 레벨당 5% 확률, 실패 시 파괴, 성공 시 베이스 ±30% 랜덤 스탯 조정 순정 복원) */
  public cleanseCurse(itemId: string, forcedSuccess?: boolean): { success: boolean; destroyed: boolean; item?: EquipmentItem; message: string } {
    const itemIdx = this.equipmentInventory.findIndex(i => i.id === itemId);
    if (itemIdx === -1) {
      return { success: false, destroyed: false, message: '대상을 찾을 수 없습니다.' };
    }
    const item = this.equipmentInventory[itemIdx];
    const isCorrupted = item && (item.isCorrupted || item.isCursed || item.isUnpurified || item.name.startsWith('[침식된]'));
    if (!item || !isCorrupted) {
      return { success: false, destroyed: false, message: '침식되거나 저주받은 장비가 아닙니다.' };
    }

    const unlocks = this.getForgeFeatureUnlocks();
    if (!unlocks.curse.unlocked) {
      const msg = `정화 불가: 병기창 Lv.${unlocks.curse.reqLv} 이상 시설이 필요합니다!`;
      this.addLog(msg, 'danger');
      return { success: false, destroyed: false, message: msg };
    }

    const mult = this.getForgeDiscountMultiplier();
    const goldCost = Math.max(1, Math.floor(100 * mult));
    const etherCost = Math.max(1, Math.floor(5 * mult));

    if (this.resources.gold < goldCost || this.resources.ether < etherCost) {
      const msg = `정화 비용 부족: 골드(${goldCost}G) 또는 에테르(${etherCost}개)가 부족합니다.`;
      this.addLog(msg, 'danger');
      return { success: false, destroyed: false, message: msg };
    }

    this.modifyResource('gold', -goldCost);
    this.modifyResource('ether', -etherCost);

    const oldName = item.name;
    const forgeLv = this.buildings['blacksmith']?.level || 1;
    const successRate = this.getPurifySuccessRate();
    const isSuccess = typeof forcedSuccess === 'boolean' ? forcedSuccess : ((Math.random() * 100) < successRate);

    if (!isSuccess) {
      // 💀 정화 실패: 장비 파괴 소멸
      this.equipmentInventory.splice(itemIdx, 1);
      SoundManager.getInstance().play('hero_hurt');
      const failMsg = `💀 [정화 실패] 심연의 침식이 폭주하여 [${oldName}]이(가) 산산조각나 영구 파괴되었습니다! (성공률: ${successRate}%)`;
      this.addLog(failMsg, 'danger');
      this.emit('equipmentUpdated', this.equipmentInventory);
      this.emit('inventoryUpdated', this.equipmentInventory);
      this.saveGame();
      return { success: false, destroyed: true, message: failMsg };
    }

    // ✨ 정화 성공: 기본 베이스 템의 +-30% 랜덤 스탯 조정 및 [침식된] 접두어 제거된 순정 템 복원
    const purified = purifyCorruptedEquipment(item);
    this.equipmentInventory[itemIdx] = purified;

    // ✨ 5분간 유지되는 정화 이력 목록에 등록
    this.purifiedEquipmentHistory = this.purifiedEquipmentHistory || [];
    this.purifiedEquipmentHistory.unshift({ item: purified, purifiedAt: Date.now() });
    this.cleanExpiredPurifiedItems();

    SoundManager.getInstance().play('anvil');
    setTimeout(() => SoundManager.getInstance().play('equip'), 300);
    const successMsg = `✨ [정화 대성공] 심연의 침식을 온전히 씻어내고 순정 [${purified.name}] 장비로 복원했습니다! (병기창 Lv.${forgeLv} 성공률 ${successRate}% / 베이스 ±30% 스탯 재조정)`;
    this.addLog(successMsg, 'reward');
    this.updateQuestObjective('Q_CURSE_CLEANSE', 0, 1);
    this.emit('equipmentUpdated', this.equipmentInventory);
    this.emit('inventoryUpdated', this.equipmentInventory);
    this.saveGame();
    return { success: true, destroyed: false, item: purified, message: successMsg };
  }

  public purifyEquipment(itemId: string, forcedSuccess?: boolean) {
    return this.cleanseCurse(itemId, forcedSuccess);
  }

  // ================= 심연 탐험 및 배낭/스택 관리 유틸리티 =================
  /** 배낭 내 동일 자원/아이템의 분할된 스택을 단일 슬롯으로 자동 병합 정리 */
  public consolidateDungeonInventory(): void {
    if (!Array.isArray(this.dungeonInventory) || this.dungeonInventory.length === 0) return;

    if (this.dungeonInventory.length === 1) {
      const single = this.dungeonInventory[0];
      if (single.key === 'gold_bag' || single.key === 'gold') {
        single.key = 'gold';
        single.label = '골드';
        single.icon = '🪙';
        single.maxStack = 1000;
        single.itemType = 'resource';
      }
      return;
    }

    const consolidated: DungeonItemSlot[] = [];
    for (const slot of this.dungeonInventory) {
      // 🪙 골드 키 및 메타 표준화
      if (slot.key === 'gold_bag' || slot.key === 'gold') {
        slot.key = 'gold';
        slot.label = '골드';
        slot.icon = '🪙';
        slot.maxStack = 1000;
        slot.itemType = 'resource';
      }

      if (slot.maxStack > 1 && slot.itemType !== 'equipment') {
        let remainingQty = slot.qty;
        for (const target of consolidated) {
          const isMatch = (target.key === slot.key || (slot.key === 'gold' && (target.key === 'gold' || target.key === 'gold_bag'))) &&
            (slot.itemType !== 'skillBook' || (target.skillBookData?.level || 1) === (slot.skillBookData?.level || 1));
          if (isMatch && target.qty < target.maxStack) {
            const space = target.maxStack - target.qty;
            const toAdd = Math.min(space, remainingQty);
            target.qty += toAdd;
            remainingQty -= toAdd;
            if (remainingQty <= 0) break;
          }
        }
        if (remainingQty > 0) {
          consolidated.push({ ...slot, qty: remainingQty });
        }
      } else {
        consolidated.push(slot);
      }
    }

    if (consolidated.length !== this.dungeonInventory.length) {
      this.dungeonInventory = consolidated;
      this.emit('dungeonInventoryUpdated', this.dungeonInventory);
    }
  }

  /**
   * 아이템을 배낭 슬롯에 추가 (스택 한도: 골드 1,000G, 일반자원 30개, 마도서 99권, 소모품 20개, 식량 3개, 장비 1개)
   * 스택 초과 시 배낭의 새로운 칸을 차지
   */
  public addToDungeonInventory(
    key: string,
    label: string,
    icon: string,
    qty: number,
    equipmentData?: EquipmentItem,
    skillBookData?: SkillBookItem,
    itemTypeParam?: 'supply' | 'resource' | 'equipment' | 'skillBook'
  ): boolean {
    // 🌟 골드 키 즉시 통일 ('gold_bag' -> 'gold')
    if (key === 'gold_bag') {
      key = 'gold';
    }

    // 🌟 기존 배낭 슬롯 내 파편화된 스택 선행 병합 정리
    this.consolidateDungeonInventory();

    // 🐸 [황금 두꺼비 촉매 유물] 던전 드랍 자원류를 즉시 블랙마켓 기본 시세의 골드로 변환
    if (this.activeCatalysts.includes('golden_toad')) {
      const MARKET_BASE_SELL_PRICES: Record<string, number> = {
        wood: 3,
        food: 5,
        stone: 4,
        coal: 7,
        bone: 8,
        leather: 9,
        iron: 10,
        herb: 11,
        ether: 12,
        silk: 14,
        crystal: 25,
        dark_essence: 30,
        prefix_stone: 40,
        suffix_stone: 40,
        void_shard: 45,
        pure_prefix_stone: 100,
        pure_suffix_stone: 100,
        pure_mana_stone: 175,
      };

      const isGold = key === 'gold' || key === 'gold_bag';
      const isEquip = Boolean(equipmentData) || key.startsWith('cursed_') || key.startsWith('equip_') || itemTypeParam === 'equipment';
      const isBook = Boolean(skillBookData) || key.startsWith('book_') || itemTypeParam === 'skillBook';
      const isOoparts = key.startsWith('ooparts_');
      const isMemoir = key.startsWith('memoir_');
      const isRelic = key.startsWith('relic_') || key.startsWith('artifact_');
      const isSupply = itemTypeParam === 'supply' || key.startsWith('enhanced_') || [
        'torch', 'food', 'pickaxe', 'bandage', 'holy_water', 'key', 'skeleton_key', 'rift_anchor', 'potion',
        'enhanced_torch', 'enhanced_food', 'enhanced_pickaxe', 'enhanced_bandage', 'enhanced_holy_water', 'enhanced_key', 'enhanced_rift_anchor'
      ].includes(key);

      if (!isGold && !isEquip && !isBook && !isOoparts && !isMemoir && !isRelic && !isSupply) {
        const unitPrice = MARKET_BASE_SELL_PRICES[key];
        if (unitPrice && unitPrice > 0) {
          const totalGold = unitPrice * qty;
          const resMeta = GameManager.getResourceMeta(key);
          const resLabel = resMeta?.name || label || key;
          this.addLog(`🐸 [황금 두꺼비] ${resLabel} ×${qty}개가 ${totalGold.toLocaleString()}G(개당 ${unitPrice}G)로 변환되어 입고되었습니다.`, 'reward');
          return this.addToDungeonInventory('gold', '골드', '🪙', totalGold);
        }
      }
    }

    const RESOURCE_KEYS = [
      'wood', 'stone', 'iron', 'ether',
      'herb', 'leather', 'silk', 'coal', 'bone',
      'crystal', 'void_shard',
      'prefix_stone', 'suffix_stone', 'pure_prefix_stone', 'pure_suffix_stone'
    ];

    const SUPPLY_KEYS = [
      'torch', 'food', 'pickaxe', 'bandage', 'holy_water', 'key', 'skeleton_key', 'rift_anchor', 'potion',
      'enhanced_torch', 'enhanced_food', 'enhanced_pickaxe', 'enhanced_bandage', 'enhanced_holy_water', 'enhanced_key', 'enhanced_rift_anchor'
    ];

    let maxStack = 1; // 🎒 기본 비자원/유물/장비: 1개당 1칸 차지
    let itemType: 'supply' | 'resource' | 'equipment' | 'skillBook' = 'resource';

    // 🌟 한글 명칭 및 아이콘 표준화 (자연스러운 서술형 명칭이 전달되어도 인벤토리에는 게임 공식 자원명으로 자동 정규화)
    if (!equipmentData && !skillBookData && !key.startsWith('cursed_') && !key.startsWith('equip_') && !key.startsWith('book_')) {
      const resMeta = GameManager.getResourceMeta(key);
      if (resMeta && resMeta.name) {
        label = resMeta.name;
        icon = resMeta.icon;
      }
    }

    // 🌟 가방 규격에 따른 자원 기본 스택 한도 (짐수레 선택 시 모든 자원 스택 99)
    const isWagon = (this.backpackCapacity || 16) >= 30 || this.lastSelectedBagId === 'wagon';
    const defaultResourceMaxStack = isWagon ? 99 : 30;

    if (equipmentData || key.startsWith('cursed_') || key.startsWith('equip_')) {
      maxStack = 1; // ⚔️ 장비류: 슬롯당 1개 (비중첩)
      itemType = 'equipment';
      if (equipmentData) {
        corruptEquipment(equipmentData);
        label = equipmentData.name;
        icon = equipmentData.icon || icon;
      }
    } else if (skillBookData || itemTypeParam === 'skillBook' || key.startsWith('book_')) {
      maxStack = 99; // 📜 비전서: 동일 마도서 슬롯당 최대 99권 스택 중첩
      itemType = 'skillBook';
    } else if (key.startsWith('relic_')) {
      maxStack = 1; // 👑 고유 신화 유물: 슬롯당 1개 (비중첩)
      itemType = 'resource';
    } else if (key === 'food') {
      maxStack = isWagon ? 99 : 3; // 🍖 식량: 일반 3개, 짐수레 99개
      itemType = 'supply';
    } else if (key === 'gold_bag' || key === 'gold') {
      maxStack = 1000; // 🪙 골드: 슬롯당 최대 1,000 골드 스택
      itemType = 'resource';
      label = '골드';
      icon = '🪙';
    } else if (RESOURCE_KEYS.includes(key)) {
      maxStack = defaultResourceMaxStack; // 🪵 일반 자원 및 재료: 일반 30개, 짐수레 99개
      itemType = 'resource';
    } else if (SUPPLY_KEYS.includes(key)) {
      maxStack = isWagon ? 99 : 20; // 🎒 보급품: 일반 20개, 짐수레 99개
      itemType = 'supply';
    } else {
      maxStack = 1; // 기타 아이템: 슬롯당 1개
      itemType = 'resource';
    }

    let remaining = qty;

    // 1. 기존 슬롯 중 여유 공간이 있는 슬롯에 우선 채우기 (골드는 'gold' / 'gold_bag' 모두 완벽 호환 매칭)
    if (maxStack > 1) {
      for (const slot of this.dungeonInventory) {
        const isMatch = (slot.key === key || ((key === 'gold' || key === 'gold_bag') && (slot.key === 'gold' || slot.key === 'gold_bag'))) &&
          (itemType !== 'skillBook' || (slot.skillBookData?.level || 1) === (skillBookData?.level || 1));
        if (isMatch && slot.qty < (slot.maxStack || maxStack)) {
          slot.maxStack = maxStack;
          if (key === 'gold' || key === 'gold_bag') {
            slot.key = 'gold';
            slot.label = '골드';
            slot.icon = '🪙';
          }
          const space = slot.maxStack - slot.qty;
          const addAmt = Math.min(space, remaining);
          slot.qty += addAmt;
          remaining -= addAmt;
          if (remaining <= 0) break;
        }
      }
    }

    // 2. 남은 수량은 새로운 슬롯(새로운 칸) 차지
    while (remaining > 0) {
      if (this.dungeonInventory.length >= (this.backpackCapacity || 16)) {
        const pendingItem: PendingLootItem = {
          id: `pending_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          key: (key === 'gold' || key === 'gold_bag') ? 'gold' : key,
          label: (key === 'gold' || key === 'gold_bag') ? '골드' : label,
          icon: (key === 'gold' || key === 'gold_bag') ? '🪙' : icon,
          qty: remaining,
          maxStack,
          itemType,
          equipmentData,
          skillBookData
        };
        this.pendingLoot.push(pendingItem);
        this.addLog(`🎒 배낭이 가득 찼습니다! (${this.dungeonInventory.length}/${this.backpackCapacity}칸) [${label} ×${remaining}]이(가) 미수령 보관함으로 이동했습니다.`, 'danger');
        this.emit('pendingLootUpdated', this.pendingLoot);
        this.emit('dungeonInventoryUpdated', this.dungeonInventory);
        this.saveGame();
        return false;
      }

      const addAmt = Math.min(maxStack, remaining);
      const newSlot: DungeonItemSlot = {
        slotId: `slot_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        key: (key === 'gold' || key === 'gold_bag') ? 'gold' : key,
        label: (key === 'gold' || key === 'gold_bag') ? '골드' : label,
        icon: (key === 'gold' || key === 'gold_bag') ? '🪙' : icon,
        qty: addAmt,
        maxStack,
        itemType,
        equipmentData,
        skillBookData
      };
      this.dungeonInventory.push(newSlot);
      remaining -= addAmt;
    }

    this.consolidateDungeonInventory();
    this.emit('dungeonInventoryUpdated', this.dungeonInventory);
    this.saveGame();
    return true;
  }

  /** 배낭에서 특정 아이템 수량 소모 */
  public consumeDungeonItem(key: string, qty: number = 1): boolean {
    const targetKey = key === 'gold_bag' ? 'gold' : key;
    let needed = qty;
    const totalAvailable = this.getDungeonItemCount(targetKey);
    if (totalAvailable < needed) return false;

    for (let i = this.dungeonInventory.length - 1; i >= 0; i--) {
      const slot = this.dungeonInventory[i];
      const isMatch = slot.key === targetKey || (targetKey === 'gold' && (slot.key === 'gold' || slot.key === 'gold_bag'));
      if (isMatch) {
        if (slot.qty <= needed) {
          needed -= slot.qty;
          this.dungeonInventory.splice(i, 1);
        } else {
          slot.qty -= needed;
          needed = 0;
        }
        if (needed <= 0) break;
      }
    }

    this.consolidateDungeonInventory();
    this.emit('dungeonInventoryUpdated', this.dungeonInventory);
    this.saveGame();
    return true;
  }

  /** 배낭 슬롯 내 아이템 버리기 (공간 확보) */
  public discardDungeonSlot(slotIndex: number, count?: number): boolean {
    if (slotIndex < 0 || slotIndex >= this.dungeonInventory.length) return false;
    const slot = this.dungeonInventory[slotIndex];
    const dropQty = count && count > 0 && count < slot.qty ? count : slot.qty;

    if (dropQty >= slot.qty) {
      this.dungeonInventory.splice(slotIndex, 1);
    } else {
      slot.qty -= dropQty;
    }

    this.addLog(`🗑️ [배낭 정리] [${slot.label} ×${dropQty}]을(를) 바닥에 버려 배낭 공간을 확보했습니다.`, 'system');
    this.consolidateDungeonInventory();
    this.emit('dungeonInventoryUpdated', this.dungeonInventory);
    this.saveGame();
    return true;
  }

  /** 배낭 내 특정 아이템 총 보유량 조회 */
  public getDungeonItemCount(key: string): number {
    const targetKey = key === 'gold_bag' ? 'gold' : key;
    return this.dungeonInventory
      .filter(s => s.key === targetKey || (targetKey === 'gold' && (s.key === 'gold' || s.key === 'gold_bag')))
      .reduce((sum, s) => sum + s.qty, 0);
  }

  /** 성채 귀환 시 배낭의 전리품을 성채 창고 및 자원으로 완벽 정산 */
  
  public removePendingLoot(pendingId: string): void {
    this.pendingLoot = this.pendingLoot.filter(p => p.id !== pendingId);
    this.emit('pendingLootUpdated', this.pendingLoot);
    this.saveGame();
  }

  public takePendingLoot(pendingId: string): boolean {
    const item = this.pendingLoot.find(p => p.id === pendingId);
    if (!item) return false;
    
    if (item.key === 'gold_bag') {
      item.key = 'gold';
      item.label = '골드';
      item.icon = '🪙';
      item.maxStack = 1000;
    }

    // 선행 병합 정리
    this.consolidateDungeonInventory();

    // Check if there is space in existing stacks
    let spaceFound = false;
    if (item.maxStack > 1) {
      for (const slot of this.dungeonInventory) {
        const isMatch = slot.key === item.key || (item.key === 'gold' && (slot.key === 'gold' || slot.key === 'gold_bag'));
        if (isMatch && slot.qty < (slot.maxStack || item.maxStack)) {
          spaceFound = true;
          break;
        }
      }
    }
    
    // Check if there is empty slot
    if (!spaceFound && this.dungeonInventory.length >= (this.backpackCapacity || 16)) {
      return false; // Still full
    }
    
    // Try adding it
    this.removePendingLoot(pendingId);
    this.addToDungeonInventory(item.key, item.label, item.icon, item.qty, item.equipmentData, item.skillBookData, item.itemType);
    return true;
  }

  public claimAllPendingLoot(): { claimed: number; remaining: number } {
    let claimed = 0;
    const copy = [...this.pendingLoot];
    for (const p of copy) {
      if (this.takePendingLoot(p.id)) {
        claimed++;
      }
    }
    return { claimed, remaining: this.pendingLoot.length };
  }

  public clearPendingLoot(): void {
    this.pendingLoot = [];
    this.emit('pendingLootUpdated', this.pendingLoot);
    this.saveGame();
  }

  // 📦 성채 창고 보급품 입고 및 출출 헬퍼
  public addCitadelSupply(key: string, qty: number): void {
    if (!this.citadelSupplies) {
      this.citadelSupplies = { torch: 0, food: 0, pickaxe: 0, bandage: 0, holy_water: 0, key: 0, rift_anchor: 0 };
    }
    this.citadelSupplies[key] = (this.citadelSupplies[key] || 0) + qty;
    if (key === 'enhanced_torch' && qty > 0) {
      this.updateQuestObjective('Q_ENHANCED_SUPPLY_TORCH', 0, 1);
    }
    this.saveGame();
    this.emit('suppliesUpdated', this.citadelSupplies);
  }

  public consumeCitadelSupply(key: string, qty: number): boolean {
    if (!this.citadelSupplies) {
      this.citadelSupplies = { torch: 0, food: 0, pickaxe: 0, bandage: 0, holy_water: 0, key: 0, rift_anchor: 0 };
    }
    const current = this.citadelSupplies[key] || 0;
    if (current < qty) return false;
    this.citadelSupplies[key] = current - qty;
    this.saveGame();
    this.emit('suppliesUpdated', this.citadelSupplies);
    return true;
  }

  /**
   * 🏰 영지(성채) 복귀 시 파티의 모든 전투/던전 상태이상, 버프, 디버프 및 야영 쿨타임을 완전 초기화
   */
  public clearPartyStatusEffects(): void {
    this.campCooldown = 0;
    if (Array.isArray(this.party)) {
      this.party.forEach(hero => {
        hero.statusEffects = [];
      });
    }
    this.emit('partyUpdated');
  }

  /**
   * 🛡️ 영웅에게 상태이상/버프 부여 (중복 시 새 항목을 추가하지 않고 지속 턴 합산 연장)
   */
  public applyStatusEffectToHero(hero: Mercenary, effect: StatusEffect, maxCapTurns = 9): { isNew: boolean; currentTurns: number } {
    if (!Array.isArray(hero.statusEffects)) {
      hero.statusEffects = [];
    }
    const DEBUFFS = ['bleed', 'poison', 'burn', 'freeze', 'stun', 'debuff_atk', 'debuff_def', 'blind'];
    if (DEBUFFS.includes(effect.type)) {
      const hasImmunity = hero.statusEffects.some(se => se.type === 'immunity' && se.turnsLeft > 0);
      if (hasImmunity) {
        return { isNew: false, currentTurns: 0 };
      }
    }
    const existing = hero.statusEffects.find(se => se.type === effect.type);
    if (existing) {
      existing.turnsLeft = Math.min(maxCapTurns, existing.turnsLeft + effect.turnsLeft);
      existing.totalTurns = Math.max(existing.totalTurns, existing.turnsLeft);
      if (effect.magnitude !== undefined) {
        if (effect.type === 'shield') {
          existing.magnitude = (existing.magnitude || 0) + effect.magnitude;
        } else {
          existing.magnitude = Math.max(existing.magnitude || 0, effect.magnitude);
        }
      }
      if (effect.source) existing.source = effect.source;
      this.emit('partyUpdated');
      return { isNew: false, currentTurns: existing.turnsLeft };
    } else {
      hero.statusEffects.push({ ...effect });
      this.emit('partyUpdated');
      return { isNew: true, currentTurns: effect.turnsLeft };
    }
  }

  /**
   * 🧭 던전 탐색 1회 진행 시 파티의 버프/디버프 1턴 적용 및 잔여 턴 차감/해제
   */
  public advancePartyStatusEffects(): string[] {
    const logs: string[] = [];
    let hpChanged = false;

    if (!Array.isArray(this.party)) return logs;

    this.party.forEach(hero => {
      if (hero.currentHp <= 0 || !Array.isArray(hero.statusEffects) || hero.statusEffects.length === 0) return;

      const prevEffectsLen = hero.statusEffects.length;
      hero.statusEffects = hero.statusEffects.filter(se => {
        if (se.type === 'freeze') {
          const dot = Math.max(1, Math.round(hero.maxHp * 0.04));
          hero.currentHp = Math.max(1, hero.currentHp - dot);
          logs.push(`❄️ [동상] ${hero.name} 결빙 동상 지속 피해 (-${dot}) [방어력 +40%]`);
          hpChanged = true;
        } else if (se.type === 'bleed') {
          const dot = Math.max(1, Math.round(hero.maxHp * 0.07));
          hero.currentHp = Math.max(1, hero.currentHp - dot);
          logs.push(`🩸 [출혈] ${hero.name} 출혈 지속 피해 (-${dot})`);
          hpChanged = true;
        } else if (se.type === 'poison') {
          const dot = Math.max(1, Math.round(hero.maxHp * 0.14));
          hero.currentHp = Math.max(1, hero.currentHp - dot);
          logs.push(`☠️ [맹독] ${hero.name} 중독 지속 피해 (-${dot})`);
          hpChanged = true;
        } else if (se.type === 'burn') {
          const dot = Math.max(1, Math.round(hero.maxHp * 0.08));
          hero.currentHp = Math.max(1, hero.currentHp - dot);
          logs.push(`🔥 [화상] ${hero.name} 화염 지속 피해 (-${dot})`);
          hpChanged = true;
        } else if (se.type === 'regen') {
          const heal = Math.max(1, Math.round(hero.maxHp * 0.08));
          hero.currentHp = Math.min(hero.maxHp, hero.currentHp + heal);
          logs.push(`💚 [재생] ${hero.name} 지속 치유 효과로 HP +${heal} 회복`);
          hpChanged = true;
        }

        se.turnsLeft -= 1;
        const isStillActive = se.turnsLeft > 0 && (se.type !== 'shield' || se.magnitude > 0);
        if (!isStillActive) {
          const metaLabel = se.type === 'buff_atk' ? '공격력 증가'
            : se.type === 'buff_def' ? '방어력 증가'
            : se.type === 'debuff_atk' ? '공격력 감소'
            : se.type === 'debuff_def' ? '방어력 감소'
            : se.type === 'shield' ? '보호막'
            : se.type === 'freeze' ? '결빙'
            : se.type === 'stun' ? '기절'
            : se.type === 'bleed' ? '출혈'
            : se.type === 'poison' ? '중독'
            : se.type === 'burn' ? '화상'
            : se.type === 'regen' ? '재생'
            : se.type;
          logs.push(`✨ [효과 만료] ${hero.name}의 [${metaLabel}] 효과가 만료되어 해제되었습니다.`);
        }
        return isStillActive;
      });

      if (prevEffectsLen !== hero.statusEffects.length) {
        hpChanged = true;
      }
    });

    if (hpChanged) {
      this.emit('partyUpdated');
    }
    return logs;
  }

  public settleDungeonInventory(floor: number = this.dungeonFloor): Record<string, number> {
    const settled: Record<string, number> = {};
    const settledItems: Array<{ key: string; label: string; icon: string; qty: number; itemType?: string }> = [];
    const settledEquipments: EquipmentItem[] = [];
    const settledSkillBooks: SkillBookItem[] = [];

    this.dungeonInventory.forEach(slot => {
      if (slot.itemType === 'equipment' && slot.equipmentData) {
        const added = this.addEquipmentToInventory(slot.equipmentData);
        settledEquipments.push(added);
      } else if (slot.itemType === 'skillBook' && slot.skillBookData) {
        this.addSkillBook(slot.skillBookData, slot.qty);
        settledSkillBooks.push({ ...slot.skillBookData, count: slot.qty });
      } else if (slot.key === 'torch' || slot.key === 'food' || slot.key === 'enhanced_torch' || slot.key === 'enhanced_food') {
        // 🗑️ 횃불과 던전 식량은 휘발/소모되어 귀환 시 자동 소멸 (반환되지 않음)
      } else if (['pickaxe', 'bandage', 'holy_water', 'key', 'rift_anchor', 'enhanced_pickaxe', 'enhanced_bandage', 'enhanced_holy_water', 'enhanced_key', 'enhanced_rift_anchor'].includes(slot.key)) {
        // 📦 곡괭이, 붕대, 성수, 열쇠 등 재사용 소모품은 성채 창고(citadelSupplies)에 안전 적재!
        this.addCitadelSupply(slot.key, slot.qty);
        settledItems.push({ key: slot.key, label: slot.label, icon: slot.icon, qty: slot.qty, itemType: 'supply' });
      } else if (slot.key === 'gold_bag' || slot.key === 'gold') {
        this.modifyResource('gold', slot.qty);
        settled['gold'] = (settled['gold'] || 0) + slot.qty;
        settledItems.push({ key: 'gold', label: slot.label || '골드', icon: slot.icon || '🪙', qty: slot.qty, itemType: 'gold' });
      } else if (slot.key.startsWith('ooparts_') || slot.key.startsWith('memoir_note_') || this.resources[slot.key as keyof GameResources] !== undefined) {
        this.modifyResource(slot.key as keyof GameResources, slot.qty);
        settled[slot.key] = (settled[slot.key] || 0) + slot.qty;
        settledItems.push({ key: slot.key, label: slot.label, icon: slot.icon, qty: slot.qty, itemType: slot.itemType || 'resource' });
      } else {
        // 기타 던전 자원/소모품
        settledItems.push({ key: slot.key, label: slot.label, icon: slot.icon, qty: slot.qty, itemType: slot.itemType });
      }
    });

    const totalGold = settled['gold'] || 0;
    const itemsCount = this.dungeonInventory.length;

    // 🏰 원정 귀환 정산 보고서 생성 (성채 화면 복귀 시 모달로 전체 확인)
    this.returnReport = {
      floor,
      totalGold,
      items: settledItems,
      equipments: settledEquipments,
      skillBooks: settledSkillBooks,
      totalSlots: itemsCount,
    };

    this.currentScreen = 'citadel';
    this.currentSceneContext = 'citadel';
    this.dungeonInventory = [];
    this.dungeonFloor = 1;
    this.dungeonDangerLevel = 0;
    this.isOvercharged = false;
    this.overchargedBossDefeatedOnFloor = 0;
    this.mercenaryManageCharges = 1;
    this.inTransitHero = null;
    // 🪦 귀환 시 영웅 상태 정리: 사경 카운트 소진 완전 사망자 안장 및 생존 부상자 치료 대기
    if (Array.isArray(this.party)) {
      const heroesToBury: Mercenary[] = [];
      this.party.forEach(hero => {
        if (hero.isPermanentlyDead || (hero.deathCountdown !== undefined && hero.deathCountdown <= 0)) {
          heroesToBury.push(hero);
        } else if (hero.currentHp <= 0) {
          hero.currentHp = 1;
          hero.deathCountdown = undefined;
        }
        hero.statusEffects = [];
      });

      for (const h of heroesToBury) {
        this.buryFallenHero(h, floor, '심연의 마물');
      }
    }

    this.clearPartyStatusEffects();
    this.clearDungeonSession();

    // ⚰️ 다음 원정 1회 적용 만료: 귀환 시 영령의 가호 해제
    if (this.activeAncestralBlessing) {
      this.addLog(`⚰️ [영령의 안식] 이번 원정이 종료되어 결속되었던 [${this.activeAncestralBlessing.name}] 가호가 영령의 곁으로 돌아갔습니다.`, 'normal', 'citadel');
      this.activeAncestralBlessing = null;
      this.emit('ancestralBlessingUpdated', null);
    }
    this.clearExpeditionBuffs();

    // 🛒 짐수레 사용 후 다음 원정 채비 기본 선택 배낭은 표준 군장으로 리셋
    if (this.lastSelectedBagId === 'wagon') {
      this.lastSelectedBagId = 'medium';
      this.backpackCapacity = 16;
    }

    this.saveGame();
    try {
      this.saveToCloud();
    } catch (_) {}
    this.emit('dungeonInventoryUpdated', this.dungeonInventory);
    this.emit('expeditionSettled', this.returnReport);

    this.addLog(`🏰 [성채 귀환] 배낭의 전리품(${itemsCount}슬롯, 금화 +${totalGold}G 등)을 성채 창고로 무사히 정산했습니다!`, 'reward');
    if (!this.hasReturnedFromDungeon) {
      this.hasReturnedFromDungeon = true;
      this.activateQuest('Q_MEMORIAL_TRIBUTE');
      this.addLog('🪦 [진혼의 묘비] 첫 심연 탐험에서 무사히 성채로 귀환했습니다. 성채 묘지를 방문하여 영령들에게 헌화하는 퀘스트가 개방되었습니다.', 'story', 'citadel');
    }
    return settled;
  }

  /**
   * 💀 파티 전멸 처리 (던전 탐험/전투 중 패배 또는 백그라운드 3분 초과 이탈)
   * - [차원의 호각] 활성화 시: 전리품 10%~50% 긴급 회수 후 창고 정산
   * - [차원의 호각] 미활성화 시: 배낭 전리품 100% 소실
   * - 던전 진행도 초기화 (1층, 위험도 0, 오버차지 해제, 쿨다운 리셋)
   * - 빈사(0 HP 이하) 영웅들의 HP를 최소 1로 안전 보정하여 의무실 후송 상태로 전환
   * - 성채로 복귀 및 세이브 자동 저장
   */
  public resolvePartyWipeout(reason: string = '심연 탐험 중 전멸'): void {
    const hasWhistle = this.activeCatalysts.includes('dimensional_whistle');
    const lostCount = this.dungeonInventory.length;

    if (hasWhistle && lostCount > 0) {
      const recoverPct = Math.floor(Math.random() * 41) + 10; // 10% ~ 50%
      const recoverRatio = recoverPct / 100;
      const recovered: typeof this.dungeonInventory = [];

      this.dungeonInventory.forEach(slot => {
        if (slot.itemType === 'equipment' || slot.itemType === 'skillBook') {
          if (Math.random() < recoverRatio) {
            recovered.push(slot);
          }
        } else {
          const newQty = Math.floor(slot.qty * recoverRatio);
          if (newQty > 0) {
            recovered.push({ ...slot, qty: newQty });
          } else if (Math.random() < recoverRatio) {
            recovered.push({ ...slot, qty: 1 });
          }
        }
      });

      this.dungeonInventory = recovered;
      this.addLog(`💀 [${reason}] 방주 원정대가 심연에서 쓰러졌습니다.`, 'danger', 'citadel');
      this.addLog(`📯 [차원의 호각 발동] 비상 구조 신호를 포착한 구조대에 의해 배낭 전리품의 ${recoverPct}%를 긴급 회수하여 성채로 후송되었습니다!`, 'reward', 'citadel');
      this.settleDungeonInventory(this.dungeonFloor);
    } else {
      this.dungeonInventory = [];
      this.addLog(`💀 [${reason}] 원정대가 전멸했습니다. ${hasWhistle ? '' : '[차원의 호각]이 없어 '}배낭의 모든 전리품(${lostCount}슬롯)을 심연에 잃어버리고 성채로 긴급 후송되었습니다...`, 'danger', 'citadel');
      this.dungeonFloor = 1;
      this.dungeonDangerLevel = 0;
      this.isOvercharged = false;
      this.overchargedBossDefeatedOnFloor = 0;
      this.defeatedOverchargedFloorsThisRun = [];
      this.campCooldown = 0;
      this.mercenaryManageCharges = 1;
      this.inTransitHero = null;
      this.clearPartyStatusEffects();
    }

    // 빈사 상태인 영웅들을 의무실로 후송 (사경 카운트다운 소진 또는 완전 사망자는 성채 묘지 안장)
    if (Array.isArray(this.party)) {
      const heroesToBury: Mercenary[] = [];
      this.party.forEach(hero => {
        if (hero.isPermanentlyDead || (hero.deathCountdown !== undefined && hero.deathCountdown <= 0)) {
          heroesToBury.push(hero);
        } else if (hero.currentHp <= 0) {
          hero.currentHp = 1;
          hero.deathCountdown = undefined;
        }
        hero.statusEffects = [];
      });

      for (const h of heroesToBury) {
        this.buryFallenHero(h, this.dungeonFloor, '심연의 마물');
      }
    }

    this.currentMonsters = [];
    this.pendingLoot = [];
    this.currentScreen = 'citadel';

    this.clearDungeonSession();
    
    // ⚰️ 다음 원정 1회 적용 만료: 전멸 후 귀환 시 영령의 가호 해제
    if (this.activeAncestralBlessing) {
      this.addLog(`⚰️ [영령의 안식] 원정이 종료되어 결속되었던 [${this.activeAncestralBlessing.name}] 가호가 영령의 곁으로 돌아갔습니다.`, 'normal', 'citadel');
      this.activeAncestralBlessing = null;
      this.emit('ancestralBlessingUpdated', null);
    }
    this.clearExpeditionBuffs();

    // 🛒 짐수레 사용 후 다음 원정 채비 기본 선택 배낭은 표준 군장으로 리셋
    if (this.lastSelectedBagId === 'wagon') {
      this.lastSelectedBagId = 'medium';
      this.backpackCapacity = 16;
    }

    triggerHaptic('defeat');
    this.emit('partyUpdated');
    this.emit('dungeonInventoryUpdated', this.dungeonInventory);
    this.emit('screenChanged', 'citadel');
    this.saveGame();
    try {
      this.saveToCloud();
    } catch (_) {}
  }

  // ══════════════════════════════════════════════════════════════════
  // 🪦 성채 묘지 (Cemetery) & 📜 심연의 백과 (Codex) & 🏃 비상 탈출 시스템
  // ══════════════════════════════════════════════════════════════════

  /** 🪦 사경을 헤매다 완전 전사한 영웅을 성채 묘지에 안장하고 파티/병영에서 영구 제적 */
  public buryFallenHero(hero: Mercenary, floor: number, killerName = '심연의 마물', epitaph?: string): FallenHero {
    const fallen: FallenHero = {
      id: hero.id,
      name: hero.name,
      title: hero.title || '방주의 결사대원',
      classId: hero.classId,
      grade: hero.grade,
      level: hero.level,
      fallenAt: Date.now(),
      fallenFloor: floor,
      killerName,
      epitaph: epitaph || `${hero.name}, 이곳 심연 ${floor}층에 잠들다. 그의 숭고한 희생으로 방주의 성화는 꺼지지 않으리라.`,
      portraitPromptKey: hero.portraitPromptKey,
      equipmentSummary: [
        hero.equipment?.weapon?.name,
        hero.equipment?.armor?.name,
        hero.equipment?.accessory?.name,
      ].filter((n): n is string => !!n),
      battlesFought: 1,
    };

    // 묘지에 안장
    this.cemetery.unshift(fallen);

    // 🌟 묘지 최대 영웅 수 5명 한정: 6명이 되는 순간 잠금(isLocked)되지 않은 가장 오래된 영웅부터 승천 및 소멸
    // (🔒 최대 3명까지 잠금 가능하여 새 유해가 들어와도 잠긴 영웅은 밀려나지 않음)
    while (this.cemetery.length > 5) {
      // 뒤(오래된 순)에서부터 잠기지 않은 영웅을 탐색
      let evictIdx = -1;
      for (let i = this.cemetery.length - 1; i >= 0; i--) {
        if (!this.cemetery[i].isLocked) {
          evictIdx = i;
          break;
        }
      }

      // 만약 모든 영웅이 잠겨있는 예외 상황(이론상 최대 3명이므로 발생치 않으나 안전장치)에는 가장 마지막 영웅 선택
      if (evictIdx === -1) {
        evictIdx = this.cemetery.length - 1;
      }

      const [oldestHero] = this.cemetery.splice(evictIdx, 1);
      if (oldestHero) {
        if (this.activeAncestralBlessing?.heroId === oldestHero.id) {
          this.activeAncestralBlessing = null;
          this.emit('ancestralBlessingUpdated', null);
        }
        this.addLog(`🕊️ [영령 승천] [${oldestHero.name} (Lv.${oldestHero.level})] 영웅의 혼이 본분을 다하고 안식을 찾아 영겁의 평온 속으로 흩어져 사라집니다.`, 'story', 'citadel');
      }
    }

    // ⚔️ 전사자의 유품(장착 장비)을 성채 인벤토리(보관함)로 전리품 회수
    const recoveredEquips: string[] = [];
    if (hero.equipment) {
      if (!this.equipmentInventory) this.equipmentInventory = [];
      (['weapon', 'armor', 'accessory'] as const).forEach(slot => {
        const item = hero.equipment[slot];
        if (item) {
          item.equippedHeroId = undefined;
          const invItem = this.equipmentInventory.find(e => e.id === item.id);
          if (invItem) {
            invItem.equippedHeroId = undefined;
          } else {
            this.addEquipmentToInventory(item);
          }
          recoveredEquips.push(`${item.icon || '🛡️'} ${item.name}`);
          delete hero.equipment[slot];
        }
      });
      this.reconcileEquipment();
    }

    // 파티 및 병영에서 영구 제거
    this.party = this.party.filter(h => h.id !== hero.id);
    this.barracks = this.barracks.filter(h => h.id !== hero.id);
    this.infirmaryPatients = this.infirmaryPatients.filter(pid => pid !== hero.id);

    if (recoveredEquips.length > 0) {
      this.addLog(`📦 [유품 회수] 전사한 [${hero.name}]의 유품 장비(${recoveredEquips.join(', ')})를 성채 인벤토리(보관함)로 전리품처럼 안전하게 회수했습니다!`, 'reward', 'citadel');
      this.emit('inventoryUpdated', this.equipmentInventory);
      this.emit('equipmentUpdated', this.equipmentInventory);
    }

    this.addLog(`⚰️ [영구 사망] [${hero.name} (Lv.${hero.level} ${hero.title})] 결사대원이 사경을 헤매다 끝내 전사하여 성채 묘지에 안장되었습니다...`, 'danger', 'citadel');
    if (this.cemetery.length === 1 && !this.codexUnlockedItems['codex_cemetery_epitaph']) {
      this.addLog('🪦📜 [회고록 갱신] 첫 번째 묘비명이 새겨져 [심연의 백과 & 회고록]의 [성채 묘비명: 영원한 불꽃의 결사대] 등록 조건이 충족되었습니다!', 'reward', 'citadel');
    }
    this.emit('partyUpdated', this.party);
    this.emit('cemeteryUpdated', this.cemetery);
    this.saveGame();
    return fallen;
  }

  /** 🪦 방주 개척 초기에 전사한 최초 1인의 선발대원 (견습 사제 엘레나) */
  public getInitialFallenHero(): FallenHero {
    return {
      id: 'hero_fallen_elena',
      name: '엘레나',
      title: '새벽의 기도',
      classId: 'acolyte',
      grade: 'rookie',
      level: 1,
      fallenAt: Date.now() - 3600000,
      fallenFloor: 1,
      killerName: '심연의 그림자 추적자',
      epitaph: '방주의 등불을 위해 첫 번째로 쓰러진 선발대원',
      equipmentSummary: ['수련자의 목제 십자가', '낡은 사제 로브'],
      battlesFought: 1,
    };
  }

  /** 🪦 성채 묘지 전체 헌화하기 (광고 완전 대체: 목재 소모 0, 5분간 전투 경험치 +20% 확정 가호 & 심연 촉매 슬롯 동시 개방) */
  public payMemorialRespect(heroId?: string): { success: boolean; message: string } {
    return this.payMemorialRespectAd(heroId);
  }

  public payMemorialRespectAd(heroId?: string): { success: boolean; message: string } {
    const heroCount = Math.min(5, this.cemetery.length);
    if (heroCount === 0) {
      return { success: false, message: '성채 묘지에 안장된 영령이 없습니다.' };
    }

    // 5분간(300초) 전투 경험치 버프 부여/연장 (영웅 수에 따라 기본 10% ~ 최대 30%)
    const expBonusPct = heroCount <= 0 ? 10 : Math.min(30, 10 + (heroCount - 1) * 5);
    const now = Date.now();
    this.memorialExpBuffUntil = Math.max(now, this.memorialExpBuffUntil) + 300 * 1000;
    const minutesLeft = Math.ceil((this.memorialExpBuffUntil - now) / 60000);

    const targetHero = heroId ? this.cemetery.find(h => h.id === heroId) : null;
    const targetText = targetHero ? `[${targetHero.name}]의 묘비` : '성채 묘지의 모든 영령';

    // 📜 퀘스트 목표 달성: 묘지 헌화 완료
    this.updateQuestObjective('Q_MEMORIAL_TRIBUTE', 0, 1);

    // 💡 1타 2피 원칙: 심연 촉매 슬롯 개방권 동시 충전!
    this.grantCatalystCharge();

    this.addLog(`🕯️ [추모 헌화] ${targetText}에 등불과 꽃을 바쳤습니다(광고 시청 완료). 안장된 영령 ${heroCount}명의 가호로 5분간 전투 경험치 +${expBonusPct}% 버프가 적용됩니다! (잔여 ${minutesLeft}분, 심연 촉매 슬롯 동시 개방)`, 'reward', 'citadel');
    SoundManager.getInstance().play('reward');
    this.emit('cemeteryUpdated', this.cemetery);
    this.emit('update');
    this.saveGame();
    return { success: true, message: `${targetText}에 헌화하였습니다. 5분간 전투 경험치 +${expBonusPct}% 가호 및 심연 촉매가 활성화되었습니다!` };
  }

  // ================= 🎬 광고 보상형 순환 및 번들링 헬퍼 =================
  /** 일일 무료 광고 충전 리셋 (매일 자정 00:00 기준) */
  public checkAdDailyReset(): void {
    const todayStr = new Date().toISOString().slice(0, 10);
    if (this.lastAdDailyResetDate !== todayStr) {
      this.bonfireAdCharges = 5;
      this.wagonAdCharges = 0; // 견고한 짐수레는 기본 무료 없이 광고 1회당 1회 사용
      this.lastAdDailyResetDate = todayStr;
      this.emit('update');
    }
  }

  /** ✨ 심연 촉매 슬롯 활성화권 지급 (최대 1회 보유) */
  public grantCatalystCharge(): void {
    this.hasCatalystCharge = true;
    this.addLog('✨ [심연 촉매 충전] 광고 시청 혜택으로 탐험 채비실의 심연 촉매 슬롯(최대 2개)이 개방되었습니다!', 'reward', 'citadel');
    this.emit('update');
  }

  /** 🔮 심연 촉매 슬롯 소모 (던전 출격 시) */
  public consumeCatalystCharge(): void {
    this.hasCatalystCharge = false;
    this.emit('update');
  }

  /** 🔥 성화 점화 5회 광고 재충전 (+ 촉매 슬롯 동시 개방) */
  public refillBonfireCharges(): void {
    this.bonfireAdCharges += 5;
    this.grantCatalystCharge();
    this.addLog('🔥 [성화 5회 충전] 광고 시청으로 신성한 성화 점화 5회가 충전되었습니다! (심연 촉매 슬롯 동시 개방)', 'reward', 'citadel');
    this.emit('buildingUpdated');
    this.emit('update');
    this.saveGame();
  }

  /** 🛒 짐수레 1회 광고 인가 (+ 촉매 슬롯 동시 개방) */
  public refillWagonCharges(): void {
    this.wagonAdCharges = 1;
    this.grantCatalystCharge();
    this.addLog('🛒 [짐수레 인가] 광고 시청으로 견고한 짐수레 1회 사용이 인가되었습니다! (심연 촉매 슬롯 동시 개방)', 'reward', 'citadel');
    this.emit('update');
    this.saveGame();
  }

  /** 🔒 묘지 영웅 안치 보존 잠금 토글 (최대 3명까지 잠금 가능, 새 유해가 들어와도 밀려나지 않음) */
  public toggleCemeteryHeroLock(heroId: string): { success: boolean; message: string; isLocked: boolean } {
    const hero = this.cemetery.find(h => h.id === heroId);
    if (!hero) {
      return { success: false, message: '묘지에서 영웅을 찾을 수 없습니다.', isLocked: false };
    }

    if (hero.isLocked) {
      hero.isLocked = false;
      this.addLog(`🔓 [안치 잠금 해제] [${hero.name}] 영령의 영구 안치 보존 잠금을 해제했습니다.`, 'normal', 'citadel');
      this.emit('cemeteryUpdated', this.cemetery);
      this.saveGame();
      return { success: true, message: `[${hero.name}] 영령의 잠금을 해제했습니다.`, isLocked: false };
    } else {
      const lockedCount = this.cemetery.filter(h => h.isLocked).length;
      if (lockedCount >= 3) {
        return { success: false, message: '영구 안치 잠금은 최대 3명까지만 설정할 수 있습니다.', isLocked: false };
      }
      hero.isLocked = true;
      this.addLog(`🔒 [안치 보존 잠금] [${hero.name}] 영령을 영구 안치 대상으로 고정했습니다. 새 유해가 들어와도 밀려나지 않습니다! (현재 ${lockedCount + 1}/3명 잠금)`, 'reward', 'citadel');
      this.emit('cemeteryUpdated', this.cemetery);
      this.saveGame();
      return { success: true, message: `[${hero.name}] 영령을 안치 보존으로 잠갔습니다. (최대 3명)`, isLocked: true };
    }
  }

  /** ⚰️ 영웅 공물 바치기 쿨다운 잔여 시간 (ms, 1시간 = 3600000ms) */
  public getHeroOfferingCooldownLeft(heroId: string): number {
    const hero = this.cemetery.find(h => h.id === heroId);
    if (!hero || !hero.lastOfferedAt) return 0;
    const cooldownMs = 3600 * 1000;
    return Math.max(0, cooldownMs - (Date.now() - hero.lastOfferedAt));
  }

  /** ⚰️ 묘지 영웅에게 공물을 바치고 영령의 가호(Ancestral Blessing) 결속 (다음 원정 1회 적용, 1시간 쿨다운) */
  public bindAncestralBlessing(heroId: string): { success: boolean; message: string } {
    const hero = this.cemetery.find(h => h.id === heroId);
    if (!hero) return { success: false, message: '영웅을 찾을 수 없습니다.' };

    const cooldownLeft = this.getHeroOfferingCooldownLeft(heroId);
    if (cooldownLeft > 0) {
      const mins = Math.ceil(cooldownLeft / 60000);
      return { success: false, message: `아직 영령의 기운이 온전치 않습니다. (${mins}분 후 다시 공물을 바칠 수 있습니다)` };
    }

    const ETHER_COST = getOfferingEtherCost(hero.grade);
    if (this.resources.ether < ETHER_COST) {
      return { success: false, message: `공물에 필요한 에테르(${ETHER_COST}개)가 부족합니다. (현재 보유: ${this.resources.ether}개)` };
    }

    this.resources.ether -= ETHER_COST;
    hero.lastOfferedAt = Date.now();
    const prevBlessing = this.activeAncestralBlessing;
    this.activeAncestralBlessing = createActiveBlessingForHero(hero);

    if (prevBlessing) {
      this.addLog(
        `⚰️ [영령의 가호 교체] 이전 [${prevBlessing.name}] 결속이 해제되고, 전사한 [${hero.name} (${hero.title})]의 영령에 에테르 ${ETHER_COST}개를 바쳐 [${this.activeAncestralBlessing.name}] 시너지를 새로 결속했습니다! (다음 원정 1회 적용, 1시간 쿨다운)`,
        'reward',
        'citadel'
      );
    } else {
      this.addLog(
        `⚰️ [영령의 가호] 전사한 [${hero.name} (${hero.title})]의 영령에 공물(에테르 ${ETHER_COST}개)을 바치고 [${this.activeAncestralBlessing.name}] 시너지를 결속했습니다! (다음 원정 1회 적용, 1시간 쿨다운)`,
        'reward',
        'citadel'
      );
    }

    this.emit('resourcesChanged', this.resources);
    this.emit('ancestralBlessingUpdated', this.activeAncestralBlessing);
    this.emit('cemeteryUpdated', this.cemetery);
    this.emit('update');
    this.saveGame();
    return {
      success: true,
      message: `[${hero.name}]의 영령과 결속되었습니다! [${this.activeAncestralBlessing.name}] 시너지가 다음 원정 1회 동안 활성화됩니다.`
    };
  }

  /** 📜 장비가 도감 요구조건과 일치하는지 판별 (베이스/템플릿/명칭 매칭 및 최소 등급 요건 검증) */
  public static isEquipmentMatchCodexRequirement(e: EquipmentItem, req: { key: string; name: string; minRarity?: 'common' | 'rare' | 'unique' | 'epic' | 'legendary' }): boolean {
    if (e.equippedHeroId) return false; // 영웅이 착용 중인 장비는 기증 불가

    // 최소 등급 요구조건 검증 (4층 이상: 희귀 rare 이상, 8층 이상: 에픽 epic 이상)
    if (req.minRarity) {
      const RARITY_ORDER: Record<string, number> = {
        common: 0,
        rare: 1,
        unique: 2,
        epic: 3,
        legendary: 4,
      };
      const itemRarityVal = RARITY_ORDER[e.rarity] ?? 0;
      const minRarityVal = RARITY_ORDER[req.minRarity] ?? 0;
      if (itemRarityVal < minRarityVal) return false;
    }

    // 1. templateId 및 req.key 매칭 (접두사 equip_ vs forge_ 상호 호환)
    if (e.templateId) {
      if (e.templateId === req.key) return true;
      if (e.templateId.startsWith(req.key) || req.key.startsWith(e.templateId)) return true;
      const normTemplate = e.templateId.replace(/^forge_/, 'equip_');
      const normReqKey = req.key.replace(/^forge_/, 'equip_');
      if (normTemplate === normReqKey) return true;
      if (normTemplate.startsWith(normReqKey) || normReqKey.startsWith(normTemplate)) return true;
    }
    if (e.id && (e.id === req.key || e.id.startsWith(req.key))) return true;

    // 2. 장비 베이스 명칭과 도감 요구 명칭의 유연한 일치 검사 (인챈트 [대괄호] 및 +강화 정규화)
    const cleanBaseName = (e.baseName || e.name || '').replace(/\[.*?\]/g, '').replace(/\+\d+/g, '').trim();
    const cleanReqName = (req.name || '').replace(/\[.*?\]/g, '').replace(/\+\d+/g, '').trim();

    if (cleanBaseName && cleanReqName) {
      if (cleanBaseName === cleanReqName) return true;
      if (cleanBaseName.includes(cleanReqName) || cleanReqName.includes(cleanBaseName)) return true;
    }

    if (e.baseName === req.name || e.name === req.name) return true;
    if (e.name && e.name.includes(req.name)) return true;

    return false;
  }

  /** 📜 도감 등록 시 제물 우선순위 비교기: 가장 낮은 등급, 낮은 강화, 노 인챈트 장비를 최우선 선택 */
  public static compareEquipmentForCodexSacrifice(a: EquipmentItem, b: EquipmentItem): number {
    // 1. 등급 (낮은 등급 우선: common 0 < rare 1 < unique 2 < epic 3 < legendary 4)
    const RARITY_RANK: Record<string, number> = {
      common: 0,
      rare: 1,
      unique: 2,
      epic: 3,
      legendary: 4,
    };
    const rarityA = RARITY_RANK[a.rarity] ?? 0;
    const rarityB = RARITY_RANK[b.rarity] ?? 0;
    if (rarityA !== rarityB) {
      return rarityA - rarityB;
    }

    // 2. 강화 수치 (낮은 강화 우선: 0강 < 1강 < 2강 ...)
    const enhanceA = (a.level || 0) + (a.awakeningLevel || 0) * 10;
    const enhanceB = (b.level || 0) + (b.awakeningLevel || 0) * 10;
    if (enhanceA !== enhanceB) {
      return enhanceA - enhanceB;
    }

    // 3. 인챈트 여부 및 개수 (노 인챈트 우선: 0개 < 1개 < 2개 ...)
    const countEnchants = (item: EquipmentItem): number => {
      let count = 0;
      if (item.prefix || item.enchantPrefix) count++;
      if (item.suffix || item.enchantSuffix) count++;
      if (count === 0 && /\[.*?\]/.test(item.name || '')) {
        const matches = (item.name || '').match(/\[.*?\]/g);
        if (matches) count += matches.length;
      }
      return count;
    };
    const enchantsA = countEnchants(a);
    const enchantsB = countEnchants(b);
    if (enchantsA !== enchantsB) {
      return enchantsA - enchantsB;
    }

    // 4. 스탯 총합 (낮은 스탯 우선)
    const getStatSum = (item: EquipmentItem): number => {
      const s = item.stats || {};
      return (s.atk || 0) + (s.def || 0) + (s.hp || 0) + (s.mp || 0) + (s.spd || 0) + (s.luck || 0);
    };
    const statsA = getStatSum(a);
    const statsB = getStatSum(b);
    if (statsA !== statsB) {
      return statsA - statsB;
    }

    return 0;
  }

  /** 📜 심연의 백과 컬렉션 완료 여부 */
  public isCodexCompleted(collectionId: string): boolean {
    return !!this.codexUnlockedItems[collectionId];
  }

  /** 📜 특정 심연의 백과 컬렉션 항목이 현재 등록 가능한 상태인지 판별 */
  public canRegisterCodexItem(item: CodexCollectionItem): boolean {
    if (this.codexUnlockedItems[item.id]) return false;
    const usedEquipIds = new Set<string>();
    for (const req of item.requirements) {
      if (req.type === 'cemetery_epitaph') {
        const cur = (this.cemetery || []).length;
        if (cur < req.amount) return false;
      } else if (req.type === 'resource' || req.type === 'material' || req.type === 'memoir_note' || req.type === 'ooparts') {
        const cur = (this.resources as any)[req.key] ?? 0;
        if (cur < req.amount) return false;
      } else if (req.type === 'supply') {
        const cur = this.citadelSupplies[req.key] ?? 0;
        if (cur < req.amount) return false;
      } else if (req.type === 'equipment') {
        const matchingEquips = this.equipmentInventory
          .filter(e => !usedEquipIds.has(e.id) && GameManager.isEquipmentMatchCodexRequirement(e, req))
          .sort((a, b) => GameManager.compareEquipmentForCodexSacrifice(a, b));
        if (matchingEquips.length < req.amount) return false;
        matchingEquips.slice(0, req.amount).forEach(e => usedEquipIds.add(e.id));
      } else if (req.type === 'skillbook') {
        const totalBooks = this.skillBookInventory
          .filter(b =>
            b.bookId === req.key ||
            b.bookId.startsWith(req.key) ||
            b.name === req.name ||
            b.name.includes(req.name) ||
            (b.originMonsterName && (b.originMonsterName === req.name || b.originMonsterName.includes(req.name)))
          )
          .reduce((sum, b) => sum + (b.count || 1), 0);
        if (totalBooks < req.amount) return false;
      }
    }
    return true;
  }

  /** 📜 특정 카테고리 (또는 전체)에서 현재 등록 가능한 백과 컬렉션 개수 산출 */
  public getRegisterableCodexCount(category?: string): number {
    const items = (!category || category === 'all')
      ? CODEX_COLLECTIONS
      : CODEX_COLLECTIONS.filter(c => c.category === category);
    return items.filter(item => this.canRegisterCodexItem(item)).length;
  }

  /** 📜 심연의 백과 아이템 등록 / 컬렉션 완성 */
  public registerCodexCollection(collectionId: string): { success: boolean; message: string } {
    if (this.codexUnlockedItems[collectionId]) {
      return { success: false, message: '이미 완성된 컬렉션입니다.' };
    }

    const item = CODEX_COLLECTIONS.find(c => c.id === collectionId);
    if (!item) return { success: false, message: '존재하지 않는 컬렉션 항목입니다.' };

    // 1. 요구 자원/장비/마도서 충족 여부 사전 검증
    const checkUsedEquipIds = new Set<string>();
    for (const req of item.requirements) {
      if (req.type === 'cemetery_epitaph') {
        const cur = (this.cemetery || []).length;
        if (cur < req.amount) {
          return { success: false, message: `성채 묘지에 잠든 결사대원의 묘비명(사망 기록)이 필요합니다. (필요: ${req.amount}, 보유: ${cur})` };
        }
      } else if (req.type === 'resource' || req.type === 'material' || req.type === 'memoir_note' || req.type === 'ooparts') {
        const cur = (this.resources as any)[req.key] ?? 0;
        if (cur < req.amount) {
          return { success: false, message: `${req.name}이(가) 부족합니다. (필요: ${req.amount.toLocaleString()}, 보유: ${cur.toLocaleString()})` };
        }
      } else if (req.type === 'supply') {
        const cur = this.citadelSupplies[req.key] ?? 0;
        if (cur < req.amount) {
          return { success: false, message: `성채 보급품 [${req.name}]이(가) 부족합니다. (필요: ${req.amount}, 보유: ${cur})` };
        }
      } else if (req.type === 'equipment') {
        const matchingEquips = this.equipmentInventory
          .filter(e => !checkUsedEquipIds.has(e.id) && GameManager.isEquipmentMatchCodexRequirement(e, req))
          .sort((a, b) => GameManager.compareEquipmentForCodexSacrifice(a, b));
        if (matchingEquips.length < req.amount) {
          return { success: false, message: `미착용 장비 [${req.name}]이(가) 보관함에 부족합니다. (필요: ${req.amount}, 보유: ${matchingEquips.length})` };
        }
        matchingEquips.slice(0, req.amount).forEach(e => checkUsedEquipIds.add(e.id));
      } else if (req.type === 'skillbook') {
        const totalBooks = this.skillBookInventory
          .filter(b =>
            b.bookId === req.key ||
            b.bookId.startsWith(req.key) ||
            b.name === req.name ||
            b.name.includes(req.name) ||
            (b.originMonsterName && (b.originMonsterName === req.name || b.originMonsterName.includes(req.name)))
          )
          .reduce((sum, b) => sum + (b.count || 1), 0);
        if (totalBooks < req.amount) {
          return { success: false, message: `마도서 [${req.name}]이(가) 서고에 부족합니다. (필요: ${req.amount}, 보유: ${totalBooks})` };
        }
      }
    }

    // 2. 자원 및 아이템 실제 차감
    let equipmentDeducted = false;
    let skillBookDeducted = false;
    const equipIndicesToRemove = new Set<number>();
    const sacrificedEquipDescs: string[] = [];

    for (const req of item.requirements) {
      if (req.type === 'cemetery_epitaph') {
        // 성채 묘비명은 영구적 기록 조건이므로 차감하지 않음
      } else if (req.type === 'resource' || req.type === 'material' || req.type === 'memoir_note' || req.type === 'ooparts') {
        (this.resources as any)[req.key] = Math.max(0, ((this.resources as any)[req.key] ?? 0) - req.amount);
      } else if (req.type === 'supply') {
        this.citadelSupplies[req.key] = Math.max(0, (this.citadelSupplies[req.key] ?? 0) - req.amount);
      } else if (req.type === 'equipment') {
        let needed = req.amount;
        // 복수 장비 중 가장 낮은 등급, 낮은 강화, 노 인챈트 장비를 최우선 정렬하여 선별
        const candidates = this.equipmentInventory
          .map((e, index) => ({ e, index }))
          .filter(({ e, index }) => !equipIndicesToRemove.has(index) && GameManager.isEquipmentMatchCodexRequirement(e, req))
          .sort((a, b) => GameManager.compareEquipmentForCodexSacrifice(a.e, b.e));

        for (let i = 0; i < needed && i < candidates.length; i++) {
          const picked = candidates[i];
          equipIndicesToRemove.add(picked.index);
          const enchLabel = (picked.e.prefix || picked.e.suffix || /\[.*?\]/.test(picked.e.name)) ? '인챈트' : '노인챈트';
          sacrificedEquipDescs.push(`${picked.e.name} (${picked.e.rarity.toUpperCase()} / +${picked.e.level || 0}강 / ${enchLabel})`);
          equipmentDeducted = true;
        }
      } else if (req.type === 'skillbook') {
        let needed = req.amount;
        for (let i = this.skillBookInventory.length - 1; i >= 0 && needed > 0; i--) {
          const b = this.skillBookInventory[i];
          const isMatch = b.bookId === req.key ||
            b.bookId.startsWith(req.key) ||
            b.name === req.name ||
            b.name.includes(req.name) ||
            (b.originMonsterName && (b.originMonsterName === req.name || b.originMonsterName.includes(req.name)));
          if (isMatch) {
            const bCount = b.count || 1;
            if (bCount <= needed) {
              needed -= bCount;
              this.skillBookInventory.splice(i, 1);
            } else {
              b.count = bCount - needed;
              needed = 0;
            }
            skillBookDeducted = true;
          }
        }
      }
    }

    if (equipIndicesToRemove.size > 0) {
      const sortedIndices = Array.from(equipIndicesToRemove).sort((a, b) => b - a);
      for (const idx of sortedIndices) {
        this.equipmentInventory.splice(idx, 1);
      }
      this.reconcileEquipment();
    }

    this.codexUnlockedItems[collectionId] = true;
    if (!Array.isArray(this.codexUnlockOrder)) this.codexUnlockOrder = [];
    this.codexUnlockOrder = this.codexUnlockOrder.filter(id => id !== collectionId);
    this.codexUnlockOrder.push(collectionId);
    if (!this.codexUnlockedTimestamps || typeof this.codexUnlockedTimestamps !== 'object') {
      this.codexUnlockedTimestamps = {};
    }
    this.codexUnlockedTimestamps[collectionId] = Date.now();

    this.addLog(`📜✨ [심연의 백과 등록] [${item.name}] 연구가 결실을 맺어 방주에 영구한 지혜의 축복 [${item.bonus.label}]이(가) 깃들었습니다!`, 'reward', 'citadel');
    if (sacrificedEquipDescs.length > 0) {
      this.addLog(`📜 [지혜의 봉헌] 결사대의 전력 손실을 최소화할 수 있는 소장품([${sacrificedEquipDescs.join(', ')}])을 엄선하여 심연 백과의 연구 제단에 경건히 바쳤습니다.`, 'reward', 'citadel');
    }
    this.emit('resourcesChanged', this.resources);
    if (equipmentDeducted) this.emit('inventoryUpdated', this.equipmentInventory);
    if (skillBookDeducted) this.emit('skillBooksUpdated', this.skillBookInventory);
    this.syncAllHeroesStats();
    this.emit('partyUpdated', this.party);
    this.emit('codexUpdated', this.codexUnlockedItems);
    this.saveGame();
    return { success: true, message: `[${item.name}] 컬렉션이 완성되었습니다!` };
  }

  /** 📜 심연의 백과 등록 완료 시간/순서 조회 (미등록: -1) */
  public getCodexUnlockTime(collectionId: string): number {
    if (!this.codexUnlockedItems[collectionId]) return -1;
    if (this.codexUnlockedTimestamps && this.codexUnlockedTimestamps[collectionId]) {
      return this.codexUnlockedTimestamps[collectionId];
    }
    const idx = this.codexUnlockOrder ? this.codexUnlockOrder.indexOf(collectionId) : -1;
    if (idx !== -1) {
      return 1000000000000 + idx;
    }
    return 1;
  }

  /** 📜 심연의 백과 누적 영구 패시브 보너스 계산 */
  public getCodexBonus(): {
    atk: number;
    def: number;
    hp: number;
    mp: number;
    spd: number;
    luck: number;
    critRate: number;
    dmgReduction: number;
    allDmgPct: number;
    upkeepDiscountPct: number;
    productionBonusPct: number;
    expBonusPct: number;
    goldBonusPct: number;
    allStatsBonus?: number;
  } {
    const total = {
      atk: 0,
      def: 0,
      hp: 0,
      mp: 0,
      spd: 0,
      luck: 0,
      critRate: 0,
      dmgReduction: 0,
      allDmgPct: 0,
      upkeepDiscountPct: 0,
      productionBonusPct: 0,
      expBonusPct: 0,
      goldBonusPct: 0,
      allStatsBonus: 0,
    };

    for (const item of CODEX_COLLECTIONS) {
      if (this.codexUnlockedItems[item.id]) {
        const b = item.bonus;
        if (b.atk) total.atk += b.atk;
        if (b.def) total.def += b.def;
        if (b.hp) total.hp += b.hp;
        if (b.mp) total.mp += b.mp;
        if (b.spd) total.spd += b.spd;
        if (b.luck) total.luck += b.luck;
        if (b.critRate) total.critRate += b.critRate;
        if (b.dmgReduction) total.dmgReduction += b.dmgReduction;
        if (b.allDmgPct) total.allDmgPct += b.allDmgPct;
        if (b.upkeepDiscountPct) total.upkeepDiscountPct += b.upkeepDiscountPct;
        if (b.productionBonusPct) total.productionBonusPct += b.productionBonusPct;
        if (b.expBonusPct) total.expBonusPct += b.expBonusPct;
        if (b.goldBonusPct) total.goldBonusPct += b.goldBonusPct;
        if (b.allStatsBonus) {
          const flatVal = (b.allStatsBonus > 1 && b.allStatsBonus < 2)
            ? Math.round((b.allStatsBonus - 1) * 100)
            : b.allStatsBonus;
          total.allStatsBonus += flatVal;
        }
      }
    }

    return total;
  }

  /** 🏃 균열의 닻 없이 긴급 탈출 시 배낭 전리품 80% 유실 정산 */
  public settleEmergencyEscapeLoot(): { lostCount: number; keptCount: number } {
    let lostCount = 0;
    let keptCount = 0;

    this.dungeonInventory = this.dungeonInventory.map(slot => {
      if (['torch', 'food'].includes(slot.key)) {
        return slot;
      }
      const originalQty = slot.qty;
      const keptQty = Math.max(1, Math.floor(originalQty * 0.2));
      const lostQty = originalQty - keptQty;
      lostCount += lostQty;
      keptCount += keptQty;
      return { ...slot, qty: keptQty };
    });

    if (this.pendingLoot && this.pendingLoot.length > 0) {
      const originalLootCount = this.pendingLoot.length;
      this.pendingLoot = this.pendingLoot.filter(() => Math.random() < 0.2);
      lostCount += (originalLootCount - this.pendingLoot.length);
    }

    this.emit('dungeonInventoryUpdated', this.dungeonInventory);
    return { lostCount, keptCount };
  }

  /** 👑 마스터 관리자 계정 모드 토글 (차원 앵커 게이트 및 멀티 요소 개방) */
  public toggleMasterAccount(enable?: boolean): boolean {
    this.isMasterAccount = enable !== undefined ? enable : !this.isMasterAccount;
    this.addLog(`👑 [마스터 계정 상태] 차원 앵커 멀티 요소 관리자 모드가 ${this.isMasterAccount ? '활성화' : '비활성화'}되었습니다.`, 'system', 'citadel');
    this.emit('update');
    this.saveGame();
    return this.isMasterAccount;
  }

  public saveGame(): void {
    try {
      const now = Date.now();
      const data = {
        lastSavedAt: now,
        resources: this.resources,
        buildings: this.buildings,
        quests: this.quests,
        subQuestCooldownUntil: this.subQuestCooldownUntil,
        hasInitializedSubQuests: this.hasInitializedSubQuests,
        hasEnteredDungeon: this.hasEnteredDungeon,
        hasReturnedFromDungeon: this.hasReturnedFromDungeon,
        hasCraftedEquipment: this.hasCraftedEquipment,
        hasCraftedGrimoire: this.hasCraftedGrimoire,
        barracks: this.barracks,
        party: this.party,
        equipmentInventory: this.equipmentInventory,
        skillBookInventory: this.skillBookInventory,
        customSkills: this.customSkills,
        currentArenaRank: this.currentArenaRank,
        currentArenaRating: this.currentArenaRating,
        arenaCoins: this.arenaCoins,
        arenaStreak: this.arenaStreak,
        pveBuffActive: this.pveBuffActive,
        bonfireStacks: this.bonfireStacks,
        bonfireWarmthTime: this.bonfireWarmthTime,
        lastTickTimestamp: this.lastTickTimestamp || now,
        offlineReport: this.offlineReport,
        dungeonFloor: this.dungeonFloor,
        dungeonDangerLevel: this.dungeonDangerLevel,
        isOvercharged: this.isOvercharged,
        dungeonInventory: this.dungeonInventory,
        currentScreen: this.currentScreen,
        unlockedDungeonFloor: this.unlockedDungeonFloor,
        unlockedAviciTier: this.unlockedAviciTier,
        purifiedFloors: this.purifiedFloors,
        infirmaryPatients: this.infirmaryPatients,
        bonds: this.bonds,
        citadelSupplies: this.citadelSupplies,
        backpackCapacity: this.backpackCapacity,
        lastSelectedBagId: this.lastSelectedBagId,
        tavernArrivalSecondsLeft: this.tavernArrivalSecondsLeft,
        tavernRefreshCount: this.tavernRefreshCount,
        nemesisState: this.nemesisState,
        purifiedEquipmentHistory: this.purifiedEquipmentHistory,
        invasionState: {
          ...this.invasionState,
          defenseLogs: (this.invasionState.defenseLogs || []).slice(0, 20),
        },
        cemetery: this.cemetery,
        memorialExpBuffUntil: this.memorialExpBuffUntil,
        activeAncestralBlessing: this.activeAncestralBlessing,
        bonfireAdCharges: this.bonfireAdCharges,
        wagonAdCharges: this.wagonAdCharges,
        hasCatalystCharge: this.hasCatalystCharge,
        lastAdDailyResetDate: this.lastAdDailyResetDate,
        codexUnlockedItems: this.codexUnlockedItems,
        codexUnlockOrder: this.codexUnlockOrder,
        codexUnlockedTimestamps: this.codexUnlockedTimestamps,
        isMasterAccount: this.isMasterAccount,
        hasChronoCompass: this.hasChronoCompass,
        marketStock: this.marketStock,
        logs: this.logs.slice(-45)
      };
      const raw = JSON.stringify(data);
      localStorage.setItem(this.getSaveKey(), raw);
      const sizeKb = (new Blob([raw]).size / 1024).toFixed(2);
      console.log(`💾 [로컬 저장 완료] 크기: ${sizeKb} KB | 시간: ${new Date(now).toLocaleTimeString()}`);
      this.triggerDebouncedCloudSave();
    } catch (e: any) {
      console.error('Save failed', e);
      // 🛡️ QuotaExceededError 발생 시 오래된 로그/캐시 긴급 압축 후 안전 저장
      if (e && (e.name === 'QuotaExceededError' || e.code === 22 || e.number === -2147024882)) {
        try {
          this.logs = this.logs.slice(-20);
          this.citadelLogs = this.citadelLogs.slice(-20);
          this.dungeonLogs = this.dungeonLogs.slice(-20);
          this.battleLogs = this.battleLogs.slice(-20);
          if (this.invasionState?.defenseLogs) {
            this.invasionState.defenseLogs = this.invasionState.defenseLogs.slice(0, 10);
          }
          const slimData = {
            lastSavedAt: Date.now(),
            resources: this.resources,
            buildings: this.buildings,
            quests: this.quests,
            subQuestCooldownUntil: this.subQuestCooldownUntil,
            hasInitializedSubQuests: this.hasInitializedSubQuests,
            hasEnteredDungeon: this.hasEnteredDungeon,
            hasReturnedFromDungeon: this.hasReturnedFromDungeon,
            hasCraftedEquipment: this.hasCraftedEquipment,
            hasCraftedGrimoire: this.hasCraftedGrimoire,
            barracks: this.barracks,
            party: this.party,
            equipmentInventory: this.equipmentInventory,
            skillBookInventory: this.skillBookInventory,
            currentArenaRank: this.currentArenaRank,
            currentArenaRating: this.currentArenaRating,
            arenaCoins: this.arenaCoins,
            arenaStreak: this.arenaStreak,
            pveBuffActive: this.pveBuffActive,
            bonfireStacks: this.bonfireStacks,
            bonfireWarmthTime: this.bonfireWarmthTime,
            lastTickTimestamp: this.lastTickTimestamp,
            offlineReport: this.offlineReport,
            dungeonFloor: this.dungeonFloor,
            dungeonDangerLevel: this.dungeonDangerLevel,
            isOvercharged: this.isOvercharged,
            dungeonInventory: this.dungeonInventory,
            currentScreen: this.currentScreen,
            unlockedDungeonFloor: this.unlockedDungeonFloor,
            unlockedAviciTier: this.unlockedAviciTier,
            infirmaryPatients: this.infirmaryPatients,
            bonds: this.bonds,
            citadelSupplies: this.citadelSupplies,
            backpackCapacity: this.backpackCapacity,
            lastSelectedBagId: this.lastSelectedBagId,
            tavernArrivalSecondsLeft: this.tavernArrivalSecondsLeft,
            tavernRefreshCount: this.tavernRefreshCount,
            nemesisState: this.nemesisState,
            invasionState: this.invasionState,
            logs: this.logs.slice(-20)
          };
          localStorage.setItem(this.getSaveKey(), JSON.stringify(slimData));
          console.warn('⚠️ [세이브 자동 복구] localStorage 용량 부족 감지 -> 슬림화 후 안전 저장 성공');
        } catch (err2) {
          console.error('Critical: Emergency save failed', err2);
        }
      }
    }
  }

  // ── 🌀 던전 & 전투 턴 단위 실시간 세션 스냅샷 관리 ─────────────────────────
  public saveBattleSnapshot(snapshot: any): void {
    try {
      const raw = localStorage.getItem('limbo_dungeon_session');
      const session = raw ? JSON.parse(raw) : {};
      session.screen = 'battle';
      session.dungeonFloor = this.dungeonFloor;
      session.dungeonDangerLevel = this.dungeonDangerLevel;
      session.isOvercharged = this.isOvercharged;
      session.dungeonInventory = this.dungeonInventory;
      session.pendingLoot = this.pendingLoot;
      session.campCooldown = this.campCooldown;
      session.battleSnapshot = snapshot;
      session.savedAt = Date.now();
      localStorage.setItem('limbo_dungeon_session', JSON.stringify(session));
    } catch (err) {
      console.warn('[GameManager] saveBattleSnapshot 실패:', err);
    }
  }

  public saveDungeonSession(screen: 'exploration' | 'battle' = 'exploration'): void {
    try {
      const raw = localStorage.getItem('limbo_dungeon_session');
      const session = raw ? JSON.parse(raw) : {};
      session.screen = screen;
      session.dungeonFloor = this.dungeonFloor;
      session.dungeonDangerLevel = this.dungeonDangerLevel;
      session.isOvercharged = this.isOvercharged;
      session.dungeonInventory = this.dungeonInventory;
      session.pendingLoot = this.pendingLoot;
      session.campCooldown = this.campCooldown;
      session.savedAt = Date.now();
      localStorage.setItem('limbo_dungeon_session', JSON.stringify(session));
    } catch (err) {
      console.warn('[GameManager] saveDungeonSession 실패:', err);
    }
  }

  public getBattleSnapshot(): any | null {
    try {
      const raw = localStorage.getItem('limbo_dungeon_session');
      if (!raw) return null;
      const session = JSON.parse(raw);
      return session.battleSnapshot || null;
    } catch {
      return null;
    }
  }

  public getDungeonSession(): any | null {
    try {
      const raw = localStorage.getItem('limbo_dungeon_session');
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  public clearBattleSnapshot(): void {
    try {
      const raw = localStorage.getItem('limbo_dungeon_session');
      if (raw) {
        const session = JSON.parse(raw);
        session.battleSnapshot = null;
        session.screen = 'exploration';
        localStorage.setItem('limbo_dungeon_session', JSON.stringify(session));
      }
    } catch (_) {}
  }

  public clearDungeonSession(): void {
    try {
      localStorage.removeItem('limbo_dungeon_session');
    } catch (_) {}
  }

  /** 실시간 클라우드 자동 저장 (Firebase Realtime DB 즉시 동기화) */
  public triggerDebouncedCloudSave(): void {
    if (this.cloudSaveDebounceTimer) clearTimeout(this.cloudSaveDebounceTimer);
    this.cloudSaveDebounceTimer = setTimeout(() => {
      this.saveToCloud().catch((err) => {
        console.error('❌ [GameManager] saveToCloud 예외 발생:', err);
      });
    }, 500);
  }

  /** 클라우드 진행 데이터 수동/즉시 저장 */
  public async saveToCloud(): Promise<boolean> {
    const fb = FirebaseService.getInstance();

    const data = JSON.parse(JSON.stringify({
      lastSavedAt: Date.now(),
      resources: this.resources,
      buildings: this.buildings,
      quests: this.quests,
      subQuestCooldownUntil: this.subQuestCooldownUntil,
      hasInitializedSubQuests: this.hasInitializedSubQuests,
      hasEnteredDungeon: this.hasEnteredDungeon,
      hasReturnedFromDungeon: this.hasReturnedFromDungeon,
      hasCraftedEquipment: this.hasCraftedEquipment,
      hasCraftedGrimoire: this.hasCraftedGrimoire,
      barracks: this.barracks,
      party: this.party,
      equipmentInventory: this.equipmentInventory,
      skillBookInventory: this.skillBookInventory,
      currentArenaRank: this.currentArenaRank,
      currentArenaRating: this.currentArenaRating,
      arenaCoins: this.arenaCoins,
      arenaStreak: this.arenaStreak,
      pveBuffActive: this.pveBuffActive,
      bonfireStacks: this.bonfireStacks,
      bonfireWarmthTime: this.bonfireWarmthTime,
      lastTickTimestamp: this.lastTickTimestamp,
      offlineReport: this.offlineReport,
      dungeonFloor: this.dungeonFloor,
      dungeonDangerLevel: this.dungeonDangerLevel,
      isOvercharged: this.isOvercharged,
      unlockedDungeonFloor: this.unlockedDungeonFloor,
      unlockedAviciTier: this.unlockedAviciTier,
      infirmaryPatients: this.infirmaryPatients,
      bonds: this.bonds,
      citadelSupplies: this.citadelSupplies,
      backpackCapacity: this.backpackCapacity,
      lastSelectedBagId: this.lastSelectedBagId,
      tavernArrivalSecondsLeft: this.tavernArrivalSecondsLeft,
      tavernRefreshCount: this.tavernRefreshCount,
      nemesisState: this.nemesisState,
      invasionState: {
        ...this.invasionState,
        defenseLogs: (this.invasionState.defenseLogs || []).slice(0, 20),
      },
      cemetery: this.cemetery,
      memorialExpBuffUntil: this.memorialExpBuffUntil,
      activeAncestralBlessing: this.activeAncestralBlessing,
      codexUnlockedItems: this.codexUnlockedItems,
      codexUnlockOrder: this.codexUnlockOrder,
      codexUnlockedTimestamps: this.codexUnlockedTimestamps,
      isMasterAccount: this.isMasterAccount,
      logs: this.logs.slice(-45)
    }));

    const success = await fb.saveProgress(data);
    if (success) {
      const gateLevel = this.buildings['arenaGate']?.level || 0;
      fb.syncArenaLeaderboard(this.currentArenaRating, this.currentArenaRank, gateLevel, this.party).catch(() => {});
    }
    return success;
  }

  /** 클라우드에서 최신 진행 데이터 가져와 적용 */
  public async loadFromCloud(): Promise<boolean> {
    const fb = FirebaseService.getInstance();
    const cloudData = await fb.loadProgress();
    if (cloudData) {
      this.applyCloudProgress(cloudData);
      return true;
    }
    return false;
  }

  /** 로드된 퀘스트 데이터를 최신 텍스트 정의(INITIAL_QUESTS)와 병합 동기화 */
  public syncQuestsWithDefinitions(loadedQuests: Quest[]): Quest[] {
    if (!loadedQuests || loadedQuests.length === 0) return JSON.parse(JSON.stringify(INITIAL_QUESTS));
    const baseQuests: Quest[] = JSON.parse(JSON.stringify(INITIAL_QUESTS));
    // 동적 생성된 서브 퀘스트 보존 (활성 서브 퀘스트 + 최근 완료된 서브 퀘스트 최대 10개로 최적화)
    const activeSubs = loadedQuests.filter(q => q.id.startsWith('Q_SUB_') && q.status === 'active');
    const completedSubs = loadedQuests.filter(q => q.id.startsWith('Q_SUB_') && q.status === 'completed');
    const recentCompletedSubs = completedSubs.slice(-10);
    const dynamicSubs = [...activeSubs, ...recentCompletedSubs];

    // 📜 레거시 4대 시나리오 퀘스트(Q_SCENARIO_X_X) 마이그레이션 맵
    const legacyMap: Record<string, { targetId: string; stepIndex: number }> = {
      'Q_SCENARIO_1_1': { targetId: 'Q_SCENARIO_01', stepIndex: 0 },
      'Q_SCENARIO_1_2': { targetId: 'Q_SCENARIO_01', stepIndex: 1 },
      'Q_SCENARIO_1_3': { targetId: 'Q_SCENARIO_01', stepIndex: 2 },
      'Q_SCENARIO_2_1': { targetId: 'Q_SCENARIO_02', stepIndex: 0 },
      'Q_SCENARIO_2_2': { targetId: 'Q_SCENARIO_02', stepIndex: 1 },
      'Q_SCENARIO_2_3': { targetId: 'Q_SCENARIO_02', stepIndex: 2 },
      'Q_SCENARIO_3_1': { targetId: 'Q_SCENARIO_03', stepIndex: 0 },
      'Q_SCENARIO_3_2': { targetId: 'Q_SCENARIO_03', stepIndex: 1 },
      'Q_SCENARIO_3_3': { targetId: 'Q_SCENARIO_03', stepIndex: 2 },
      'Q_SCENARIO_4_1': { targetId: 'Q_SCENARIO_04', stepIndex: 0 },
      'Q_SCENARIO_4_2': { targetId: 'Q_SCENARIO_04', stepIndex: 1 },
      'Q_SCENARIO_4_3': { targetId: 'Q_SCENARIO_04', stepIndex: 2 },
    };

    return [...baseQuests, ...dynamicSubs].map(baseQ => {
      const savedQ = loadedQuests.find(q => q.id === baseQ.id);
      if (savedQ) {
        // 진행 상태 및 해금 여부 복원
        baseQ.status = savedQ.status;
        // 목표 달성 수치 및 완료 여부 복원 (최신 description과 summary 유지)
        baseQ.objectives = baseQ.objectives.map((baseObj, idx) => {
          const savedObj = savedQ.objectives?.[idx];
          if (savedObj) {
            return {
              ...baseObj,
              current: savedObj.current,
              isCompleted: savedObj.isCompleted
            };
          }
          return baseObj;
        });
        return baseQ;
      }

      // 레거시 퀘스트가 존재하는 경우 마이그레이션 적용
      const relevantLegacies = Object.entries(legacyMap).filter(([_, info]) => info.targetId === baseQ.id);
      if (relevantLegacies.length > 0) {
        let hasAnyLegacyActiveOrCompleted = false;
        let allCompleted = true;
        for (const [legacyId, info] of relevantLegacies) {
          const legQ = loadedQuests.find(q => q.id === legacyId);
          if (legQ) {
            if (legQ.status === 'active' || legQ.status === 'completed') {
              hasAnyLegacyActiveOrCompleted = true;
            }
            if (legQ.status === 'completed') {
              if (baseQ.objectives[info.stepIndex]) {
                baseQ.objectives[info.stepIndex].current = baseQ.objectives[info.stepIndex].required;
                baseQ.objectives[info.stepIndex].isCompleted = true;
              }
            } else {
              allCompleted = false;
            }
          } else {
            allCompleted = false;
          }
        }
        if (allCompleted && hasAnyLegacyActiveOrCompleted) {
          baseQ.status = 'completed';
        } else if (hasAnyLegacyActiveOrCompleted) {
          baseQ.status = 'active';
        }
      }

      return baseQ;
    });
  }

  /** 클라우드 데이터 파싱 및 게임 상태에 덮어쓰기 */
  public applyCloudProgress(parsed: Record<string, unknown>): void {
    if (!parsed) return;

    if (parsed.resources) {
      this.resources = parsed.resources as typeof this.resources;
      if (this.resources.bone === undefined) this.resources.bone = 0;
    }
    if (parsed.buildings) {
      const parsedB = parsed.buildings as typeof this.buildings;
      for (const key in parsedB) {
        const bId = key as BuildingId;
        if (this.buildings[bId]) {
          this.buildings[bId].level = parsedB[bId].level;
          this.buildings[bId].unlocked = parsedB[bId].unlocked;
          this.buildings[bId].construction = parsedB[bId].construction;
          if (parsedB[bId].maxLevel !== undefined) {
            this.buildings[bId].maxLevel = parsedB[bId].maxLevel;
          }
        }
      }
      // 창고(방주 중앙 병참고)는 최소 1레벨 및 해금 상태 유지
      if (this.buildings['storage']) {
        this.buildings['storage'].unlocked = true;
        if (this.buildings['storage'].level === 0) {
          this.buildings['storage'].level = 1;
        }
      }
    }
    if (parsed.quests)             this.quests             = this.syncQuestsWithDefinitions(parsed.quests as Quest[]);
    if (parsed.barracks) {
      this.barracks = (parsed.barracks as (Partial<Mercenary> | Mercenary)[]).map(h => this.sanitizeHero(h));
    }
    if (parsed.party) {
      const pArray = parsed.party as (Partial<Mercenary> | Mercenary)[];
      this.party = [];
      for (const p of pArray) {
        if (!p || !p.id) continue;
        const bIdx = this.barracks.findIndex(h => h.id === p.id);
        if (bIdx !== -1) {
          const sanitizedP = this.sanitizeHero(p);
          if (sanitizedP.level > this.barracks[bIdx].level || (sanitizedP.level === this.barracks[bIdx].level && sanitizedP.exp > this.barracks[bIdx].exp)) {
            this.barracks[bIdx] = sanitizedP;
          } else {
            this.barracks[bIdx].position = sanitizedP.position || this.barracks[bIdx].position || 'mid';
          }
          if (!this.party.some(h => h.id === this.barracks[bIdx].id)) {
            this.party.push(this.barracks[bIdx]);
          }
        }
      }
    }
    if (parsed.equipmentInventory) this.equipmentInventory = parsed.equipmentInventory as typeof this.equipmentInventory;
    if (parsed.customSkills) {
      this.customSkills = parsed.customSkills as Record<string, Skill>;
      const gds = GameDataService.getInstance();
      for (const [skId, sk] of Object.entries(this.customSkills)) {
        if (skId.startsWith('skill_m_')) {
          const bOverride = gds.getSkillBookOverride(skId.replace(/^skill_m_/, 'book_m_'));
          if (bOverride) {
            if (bOverride.power !== undefined) sk.power = bOverride.power;
            if (bOverride.manaCost !== undefined) sk.manaCost = bOverride.manaCost;
            if (bOverride.cooldown !== undefined) sk.cooldown = bOverride.cooldown;
            if (bOverride.description !== undefined) sk.description = bOverride.description;
          }
          if (sk.power && sk.description) {
            sk.description = normalizeDroppedSkillDescription(sk.description, sk.power);
          }
        }
      }
      Object.assign(ALL_SKILLS_MAP, this.customSkills);
    }
    if (parsed.skillBookInventory) {
      const gds = GameDataService.getInstance();
      this.skillBookInventory = (parsed.skillBookInventory as SkillBookItem[]).map(b => {
        const item: SkillBookItem = {
          ...b,
          count: b.count || 1
        };
        const bOverride = gds.getSkillBookOverride(item.bookId);
        if (bOverride && item.skill) {
          if (bOverride.power !== undefined) {
            item.basePower = bOverride.power;
            item.skill.power = bOverride.power;
          }
          if (bOverride.manaCost !== undefined) item.skill.manaCost = bOverride.manaCost;
          if (bOverride.cooldown !== undefined) item.skill.cooldown = bOverride.cooldown;
          if (bOverride.description !== undefined) item.skill.description = bOverride.description;
        }
        if (item.bookId.startsWith('book_m_') && item.skill && item.skill.power) {
          item.skill.description = normalizeDroppedSkillDescription(item.skill.description, item.skill.power);
          const cleanDescPart = item.skill.description.replace(/^\[.*?\]\s*/, '');
          item.description = bOverride?.description ? bOverride.description : `[${item.originMonsterName || '마물'}]에게서 추출한 마도서. ${cleanDescPart}`;
        }
        return item;
      });
      for (const b of this.skillBookInventory) {
        if (b.skill && b.skill.id) {
          this.customSkills[b.skill.id] = b.skill;
          ALL_SKILLS_MAP[b.skill.id] = b.skill;
        }
      }
    }
    if (parsed.currentArenaRank)   this.currentArenaRank   = parsed.currentArenaRank as number;
    if (parsed.currentArenaRating) this.currentArenaRating = parsed.currentArenaRating as number;
    if (parsed.arenaCoins !== undefined) this.arenaCoins   = parsed.arenaCoins as number;
    if (parsed.arenaStreak !== undefined) this.arenaStreak = parsed.arenaStreak as number;
    if (parsed.pveBuffActive !== undefined) this.pveBuffActive = parsed.pveBuffActive as boolean;
    if (parsed.bonfireStacks !== undefined) this.bonfireStacks = parsed.bonfireStacks as number;
    if (parsed.bonfireWarmthTime !== undefined) this.bonfireWarmthTime = parsed.bonfireWarmthTime as number;
    if (parsed.lastTickTimestamp) this.lastTickTimestamp = parsed.lastTickTimestamp as number;
    else if (parsed.lastSavedAt) this.lastTickTimestamp = parsed.lastSavedAt as number;
    if (parsed.dungeonFloor)       this.dungeonFloor       = parsed.dungeonFloor as number;
    if (parsed.dungeonDangerLevel !== undefined) this.dungeonDangerLevel = parsed.dungeonDangerLevel as number;
    if (parsed.isOvercharged !== undefined) this.isOvercharged = parsed.isOvercharged as boolean;
    if (parsed.dungeonInventory && Array.isArray(parsed.dungeonInventory)) {
      this.dungeonInventory = parsed.dungeonInventory as DungeonItemSlot[];
    }
    if (parsed.unlockedDungeonFloor) this.unlockedDungeonFloor = parsed.unlockedDungeonFloor as number;
    if (parsed.hasEnteredDungeon !== undefined) this.hasEnteredDungeon = parsed.hasEnteredDungeon as boolean;
    if (parsed.hasReturnedFromDungeon !== undefined) this.hasReturnedFromDungeon = parsed.hasReturnedFromDungeon as boolean;
    if (this.unlockedDungeonFloor >= 2) this.hasEnteredDungeon = true;
    if (parsed.hasCraftedEquipment !== undefined) this.hasCraftedEquipment = parsed.hasCraftedEquipment as boolean;
    if (parsed.hasCraftedGrimoire !== undefined) this.hasCraftedGrimoire = parsed.hasCraftedGrimoire as boolean;
    if (parsed.unlockedAviciTier !== undefined) this.unlockedAviciTier = parsed.unlockedAviciTier as number;
    if (parsed.purifiedFloors && Array.isArray(parsed.purifiedFloors)) {
      this.purifiedFloors = (parsed.purifiedFloors as number[]).map(Number).filter(n => !isNaN(n));
    }
    this.syncPurifiedFloorsFromQuests();
    if (parsed.infirmaryPatients)  this.infirmaryPatients  = parsed.infirmaryPatients as string[];
    if (parsed.bonds)              this.bonds              = parsed.bonds as Record<string, number>;
    if (parsed.citadelSupplies)     this.citadelSupplies     = { torch: 0, food: 0, pickaxe: 0, bandage: 0, holy_water: 0, key: 0, ...(parsed.citadelSupplies as Record<string, number>) };
    if (parsed.backpackCapacity !== undefined) this.backpackCapacity = parsed.backpackCapacity as number;
    if (parsed.lastSelectedBagId)  this.lastSelectedBagId  = parsed.lastSelectedBagId as string;
    if (parsed.tavernArrivalSecondsLeft !== undefined) this.tavernArrivalSecondsLeft = parsed.tavernArrivalSecondsLeft as number;
    if (parsed.tavernRefreshCount !== undefined) this.tavernRefreshCount = parsed.tavernRefreshCount as number;
    if (parsed.nemesisState) {
      this.nemesisState = { ...this.nemesisState, ...(parsed.nemesisState as Partial<NemesisState>) };
    }
    if (parsed.invasionState) {
      this.invasionState = { ...this.invasionState, ...(parsed.invasionState as Partial<InvasionState>) };
    }
    if (parsed.cemetery && Array.isArray(parsed.cemetery)) {
      this.cemetery = (parsed.cemetery as FallenHero[]).slice(0, 5);
    }
    if (parsed.subQuestCooldownUntil !== undefined) {
      this.subQuestCooldownUntil = parsed.subQuestCooldownUntil as number;
    }
    if (parsed.hasInitializedSubQuests !== undefined) {
      this.hasInitializedSubQuests = parsed.hasInitializedSubQuests as boolean;
    }
    if (parsed.memorialExpBuffUntil !== undefined) {
      this.memorialExpBuffUntil = parsed.memorialExpBuffUntil as number;
    }
    if (parsed.bonfireAdCharges !== undefined) this.bonfireAdCharges = parsed.bonfireAdCharges as number;
    if (parsed.wagonAdCharges !== undefined) this.wagonAdCharges = parsed.wagonAdCharges as number;
    if (parsed.hasCatalystCharge !== undefined) this.hasCatalystCharge = parsed.hasCatalystCharge as boolean;
    if (parsed.lastAdDailyResetDate) this.lastAdDailyResetDate = parsed.lastAdDailyResetDate as string;
    this.checkAdDailyReset();
    if (parsed.activeAncestralBlessing) {
      const ab = parsed.activeAncestralBlessing as any;
      if (ab && ab.name && ab.buffs) {
        this.activeAncestralBlessing = ab as ActiveAncestralBlessing;
      } else {
        this.activeAncestralBlessing = null;
      }
    }
    if (parsed.codexUnlockedItems) {
      this.codexUnlockedItems = parsed.codexUnlockedItems as Record<string, boolean>;
      for (let f = 1; f <= 10; f++) {
        if (this.codexUnlockedItems[`codex_ooparts_${f}_1`] || this.codexUnlockedItems[`codex_ooparts_${f}_2`]) {
          this.codexUnlockedItems[`codex_ooparts_floor_${f}`] = true;
        }
      }
    }
    if (Array.isArray(parsed.codexUnlockOrder)) {
      this.codexUnlockOrder = parsed.codexUnlockOrder as string[];
    } else if (this.codexUnlockedItems) {
      this.codexUnlockOrder = Object.keys(this.codexUnlockedItems);
    }
    if (parsed.codexUnlockedTimestamps && typeof parsed.codexUnlockedTimestamps === 'object') {
      this.codexUnlockedTimestamps = parsed.codexUnlockedTimestamps as Record<string, number>;
    }
    if (parsed.isMasterAccount !== undefined) {
      this.isMasterAccount = parsed.isMasterAccount as boolean;
    }
    if (parsed.hasChronoCompass !== undefined) {
      this.hasChronoCompass = Boolean(parsed.hasChronoCompass);
    } else if (this.quests.some(q => (q.id === 'Q_SCENARIO_04' || q.id === 'Q_SCENARIO_4_3') && q.status === 'completed')) {
      this.hasChronoCompass = true;
    }
    this.checkNemesisDailyReset();
    if (Array.isArray(parsed.logs) && parsed.logs.length > 0) {
      this.logs = (parsed.logs as LogEntry[]).map(l => {
        if (l.text && (l.text.includes('[신규 서브 의뢰 도착]') || l.text.includes('서브 의뢰 도착'))) {
          return { ...l, category: 'citadel' as const };
        }
        if (l.text && (l.text.includes('초기 2인 결사대') || l.text.includes('현재 원정대로'))) {
          return { ...l, text: this.getCurrentPartyLogText(), category: 'citadel' as const };
        }
        return l;
      });
      this.citadelLogs = this.logs.filter(l => !l.category || l.category === 'citadel');
      this.dungeonLogs = this.logs.filter(l => l.category === 'dungeon');
      this.battleLogs = this.logs.filter(l => l.category === 'battle');
    } else {
      this.logs = this.logs.map(l => {
        if (l.text && (l.text.includes('초기 2인 결사대') || l.text.includes('현재 원정대로'))) {
          return { ...l, text: this.getCurrentPartyLogText(), category: 'citadel' as const };
        }
        return l;
      });
      if (this.logs.length === 0) {
        this.addLog('차가운 흑무가 방주 성채를 감싸고 있습니다.', 'normal', 'citadel');
        this.addLog(this.getCurrentPartyLogText(), 'story', 'citadel');
      } else {
        this.citadelLogs = this.logs.filter(l => !l.category || l.category === 'citadel');
      }
    }

    // 모든 용병의 성장 경험치 테이블 최신화
    this.barracks.forEach(h => {
      h.expToNext = GameManager.calcExpToNext(h.level);
    });
    this.party.forEach(h => {
      h.expToNext = GameManager.calcExpToNext(h.level);
    });

    this.reconcileEquipment();
    this.checkAllQuestObjectives();
    this.checkBuildingConstructions();
    this.processOfflineProgress();
    this.emit('resourcesChanged');
    this.emit('buildingUpdated');
    this.emit('partyUpdated', this.party);
    this.emit('questUpdated');
    this.emit('inventoryUpdated', this.equipmentInventory);

    // 로컬 스토리지 동기화
    try {
      localStorage.setItem(this.getSaveKey(), JSON.stringify(parsed));
    } catch (_) {}
  }

  /** 🌟 3층 진행 상황 복원 및 셋업 (테스트 및 빠른 진행 복구용) */
  public setupFloor3Progress(): void {
    // 1. 던전 진행도 (3층 해금 상태)
    this.dungeonFloor = 3;
    this.unlockedDungeonFloor = 3;
    this.dungeonDangerLevel = 0;
    this.isOvercharged = false;

    // 2. 자원 풍족화 (3층 거점 빌드업에 충분한 자원)
    this.resources = {
      gold: 4500, wood: 900, stone: 800, iron: 600, food: 450, ether: 350,
      herb: 120, leather: 120, silk: 90, coal: 100, bone: 90, crystal: 50, void_shard: 25,
      prefix_stone: 15, suffix_stone: 12, pure_prefix_stone: 4, pure_suffix_stone: 3,
      relic_floor_1: 2, relic_floor_2: 2, relic_floor_3: 0, relic_floor_4: 0, relic_floor_5: 0,
      relic_floor_6: 0, relic_floor_7: 0, relic_floor_8: 0, relic_floor_9: 0, relic_floor_10: 0
    };

    // 3. 거점 모든 건물 정상 해금 및 레벨업 (총 13종 건물)
    this.buildings = JSON.parse(JSON.stringify(INITIAL_BUILDINGS));
    const unlockBuilding = (id: BuildingId, level: number) => {
      if (this.buildings[id]) {
        this.buildings[id].level = level;
        this.buildings[id].unlocked = true;
      }
    };
    unlockBuilding('bonfire', 2);     // 방주의 성화
    unlockBuilding('cabin', 3);       // 생존자 안식처
    unlockBuilding('lumberCamp', 3);  // 영목 벌채소
    unlockBuilding('quarry', 3);      // 에테르 광맥 시추소
    unlockBuilding('butchery', 2);    // 심연 생체 정제소
    unlockBuilding('tavern', 2);      // 방랑자의 라운지
    unlockBuilding('blacksmith', 2);  // 심연의 병기창 (대장간)
    unlockBuilding('sanctuary', 2);   // 영혼의 제단 (전직/각성)
    unlockBuilding('alchemy', 2);     // 에테르 연금 공방
    // 🌟 차원 앵커 게이트(arenaGate)는 건설 해금 상태 (level: 0, unlocked: true)
    if (this.buildings['arenaGate']) {
      this.buildings['arenaGate'].level = 0;
      this.buildings['arenaGate'].unlocked = true;
    }
    unlockBuilding('storage', 2);     // 방주 중앙 병참고
    unlockBuilding('infirmary', 1);   // 생체 복원 병동 (의무실)
    unlockBuilding('market', 1);      // 황혼의 블랙 마켓

    // 4. 3인 심연 원정대 + 전체 6인 보유 용병단 구성
    const h1: Mercenary = this.sanitizeHero({
      id: 'hero_01',
      name: '아이리스',
      title: '불굴의 성기사',
      classId: 'squire',
      grade: 'veteran',
      level: 10, exp: 40, expToNext: 400,
      currentHp: 580, maxHp: 580,
      currentMp: 70, maxMp: 70,
      position: 'front',
      stats: { atk: 32, def: 30, spd: 18, luck: 14 },
      equipment: {
        weapon: { id: 'eq_wp_01', baseName: '강철검', name: '강화된 강철검 +2', slot: 'weapon', rarity: 'rare', level: 2, stats: { atk: 12, def: 3, luck: 2 }, icon: '⚔️', description: '강철검' },
        armor: { id: 'eq_ar_01', baseName: '판금 갑옷', name: '견고한 판금 갑옷 +2', slot: 'armor', rarity: 'rare', level: 2, stats: { def: 14, hp: 40 }, icon: '🛡️', description: '판금 갑옷' },
        accessory: { id: 'eq_ac_01', baseName: '수호 반지', name: '수호자의 반지 +1', slot: 'accessory', rarity: 'rare', level: 1, stats: { hp: 30, def: 4 }, icon: '💍', description: '수호 반지' }
      }
    });

    const h2: Mercenary = this.sanitizeHero({
      id: 'hero_02',
      name: '바르톨',
      title: '광전사',
      classId: 'vanguard',
      grade: 'veteran',
      level: 9, exp: 120, expToNext: 360,
      currentHp: 540, maxHp: 540,
      currentMp: 60, maxMp: 60,
      position: 'front',
      stats: { atk: 44, def: 20, spd: 22, luck: 18 },
      equipment: {
        weapon: { id: 'eq_wp_02', baseName: '대검', name: '예리한 대검 +1', slot: 'weapon', rarity: 'rare', level: 2, stats: { atk: 16, spd: 2 }, icon: '🗡️', description: '대검' },
        armor: { id: 'eq_ar_02', baseName: '가시 갑옷', name: '가시 갑옷 +1', slot: 'armor', rarity: 'common', level: 2, stats: { def: 10, hp: 25 }, icon: '🦺', description: '가시 갑옷' },
        accessory: { id: 'eq_ac_02', baseName: '분노 목걸이', name: '분노의 목걸이 +1', slot: 'accessory', rarity: 'common', level: 1, stats: { atk: 6, spd: 2 }, icon: '📿', description: '분노 목걸이' }
      }
    });

    const h3: Mercenary = this.sanitizeHero({
      id: 'hero_03',
      name: '카엘',
      title: '그림자 암살자',
      classId: 'rogue',
      grade: 'veteran',
      level: 9, exp: 80, expToNext: 360,
      currentHp: 420, maxHp: 420,
      currentMp: 80, maxMp: 80,
      position: 'mid',
      stats: { atk: 42, def: 16, spd: 28, luck: 30 },
      equipment: {
        weapon: { id: 'eq_wp_03', baseName: '단검', name: '비수 단검 +2', slot: 'weapon', rarity: 'rare', level: 2, stats: { atk: 14, spd: 5, luck: 4 }, icon: '🗡️', description: '단검' },
        armor: { id: 'eq_ar_03', baseName: '가죽옷', name: '그림자 가죽옷 +1', slot: 'armor', rarity: 'common', level: 2, stats: { def: 8, spd: 4 }, icon: '🧥', description: '가죽옷' },
        accessory: { id: 'eq_ac_03', baseName: '민첩 부적', name: '민첩의 부적 +1', slot: 'accessory', rarity: 'common', level: 1, stats: { spd: 4, luck: 4 }, icon: '🧿', description: '민첩 부적' }
      }
    });

    const h4: Mercenary = this.sanitizeHero({
      id: 'hero_04',
      name: '엘레나',
      title: '원소 학도',
      classId: 'apprentice',
      grade: 'veteran',
      level: 9, exp: 150, expToNext: 360,
      currentHp: 360, maxHp: 360,
      currentMp: 140, maxMp: 140,
      position: 'back',
      stats: { atk: 46, def: 14, spd: 20, luck: 22 },
      equipment: {
        weapon: { id: 'eq_wp_04', baseName: '에테르 지팡이', name: '에테르 지팡이 +2', slot: 'weapon', rarity: 'rare', level: 2, stats: { atk: 12, mp: 30 }, icon: '🪄', description: '에테르 지팡이' },
        armor: { id: 'eq_ar_04', baseName: '로브', name: '현자의 로브 +1', slot: 'armor', rarity: 'common', level: 2, stats: { def: 7, mp: 25 }, icon: '🔮', description: '로브' },
        accessory: { id: 'eq_ac_04', baseName: '마나 반지', name: '마나 증폭 링 +1', slot: 'accessory', rarity: 'common', level: 1, stats: { mp: 25, atk: 4 }, icon: '💍', description: '마나 반지' }
      }
    });

    const h5: Mercenary = this.sanitizeHero({
      id: 'hero_05',
      name: '루시아',
      title: '성령의 사제',
      classId: 'acolyte',
      grade: 'veteran',
      level: 9, exp: 90, expToNext: 360,
      currentHp: 400, maxHp: 400,
      currentMp: 130, maxMp: 130,
      position: 'back',
      stats: { atk: 22, def: 20, spd: 19, luck: 24 },
      equipment: {
        weapon: { id: 'eq_wp_05', baseName: '성홀', name: '축복의 성홀 +1', slot: 'weapon', rarity: 'rare', level: 2, stats: { atk: 8, mp: 25, def: 3 }, icon: '🪄', description: '성홀' },
        armor: { id: 'eq_ar_05', baseName: '예복', name: '사제 예복 +1', slot: 'armor', rarity: 'common', level: 2, stats: { def: 8, mp: 20 }, icon: '🔮', description: '예복' },
        accessory: { id: 'eq_ac_05', baseName: '로사리오', name: '치유의 로사리오 +1', slot: 'accessory', rarity: 'common', level: 1, stats: { hp: 20, mp: 15 }, icon: '📿', description: '로사리오' }
      }
    });

    const h6: Mercenary = this.sanitizeHero({
      id: 'hero_06',
      name: '헤이즐',
      title: '정밀 저격수',
      classId: 'gunner',
      grade: 'veteran',
      level: 8, exp: 50, expToNext: 320,
      currentHp: 380, maxHp: 380,
      currentMp: 110, maxMp: 110,
      position: 'mid',
      stats: { atk: 40, def: 16, spd: 24, luck: 26 },
      equipment: {}
    });

    // 🌟 심연 던전 원정대는 3인 파티로 구성
    this.party = [h1, h2, h5];
    // 🌟 방주 전체 용병단(병영)은 6인 등록
    this.barracks = [h1, h2, h3, h4, h5, h6];

    // 5. 원정 소모품 및 배낭
    this.citadelSupplies = { torch: 10, food: 15, bandage: 8, holy_water: 5, pickaxe: 6, key: 3 };
    this.backpackCapacity = 10;
    this.bonfireStacks = 1;
    this.bonfireWarmthTime = 300;

    // 6. 장비 인벤토리 여유분
    this.equipmentInventory = [
      { id: 'inv_eq_01', baseName: '강철검', name: '강철 기사의 검', slot: 'weapon', rarity: 'common', level: 1, stats: { atk: 8, luck: 1 }, icon: '⚔️', description: '강철검' },
      { id: 'inv_eq_02', baseName: '활', name: '마력 깃든 활', slot: 'weapon', rarity: 'common', level: 1, stats: { atk: 7, luck: 3 }, icon: '🏹', description: '활' },
      { id: 'inv_eq_03', baseName: '흉갑', name: '경비병 흉갑', slot: 'armor', rarity: 'common', level: 1, stats: { def: 7, hp: 15 }, icon: '🦺', description: '흉갑' },
      { id: 'inv_eq_04', baseName: '생명 펜던트', name: '생명의 펜던트', slot: 'accessory', rarity: 'rare', level: 1, stats: { hp: 40 }, icon: '📿', description: '생명 펜던트' }
    ];

    // 7. 퀘스트 완료 처리 (1장 완수 및 2장 진행 중, 차원 게이트 건설 퀘스트는 진행 대기 상태)
    this.quests = JSON.parse(JSON.stringify(INITIAL_QUESTS)).map((q: Quest) => {
      if (q.chapter === 1) {
        q.status = 'completed';
        q.objectives.forEach(obj => {
          obj.current = obj.required;
          obj.isCompleted = true;
        });
      } else if (q.id === 'Q_MAIN_06' || q.chapter === 2) {
        q.status = 'active';
      }
      return q;
    });

    this.addLog('🌟 [3층 진행 복원] 심연 3층 [에테르 광맥] 및 차원 게이트 건설 준비가 완료되었습니다!', 'reward');

    this.saveGame();
    this.saveToCloud();

    this.emit('resourcesChanged');
    this.emit('buildingUpdated');
    this.emit('partyUpdated', this.party);
    this.emit('questUpdated');
    this.emit('inventoryUpdated', this.equipmentInventory);
  }

  /** 👑 [지휘관 최고 권능 업그레이드]
   * - 13개 모든 건물 해금 및 10레벨 최대 증축
   * - 27종 모든 자원(창고 Lv.10 기준) 최대 적재량 한도까지 완충
   * - 1F~10F 보스 토벌 전용 고유 마도서(10종) 서고(skillBookInventory) 입고
   * - 5인의 Lv.30 히어로('hero') 등급 영웅 원정대 편성 및 파티 배치
   * - 심연 던전 1~10층 전면 영구 해금 (성채 채비실에서 1~10층 즉시 선택 출격 가능)
   */
  public applyCommanderMaxUpgrade(): void {
    if (Capacitor.isNativePlatform()) {
      console.warn('⚠️ [GameManager] 모바일 네이티브 환경에서는 지휘관 최고 전력 치트가 차단됩니다.');
      return;
    }
    this.isMasterAccount = true;
    // 1. 모든 건물(13종) 10레벨 해금 및 활성화
    const buildingIds: BuildingId[] = [
      'bonfire', 'cabin', 'lumberCamp', 'quarry', 'butchery',
      'tavern', 'blacksmith', 'sanctuary', 'alchemy', 'arenaGate',
      'storage', 'infirmary', 'market'
    ];
    for (const bId of buildingIds) {
      if (!this.buildings[bId]) {
        this.buildings[bId] = { ...(INITIAL_BUILDINGS[bId] || { id: bId, name: bId, level: 1, unlocked: true, description: '', icon: '🏛️', promptKey: '', themeColor: 0xffffff }) };
      }
      this.buildings[bId].unlocked = true;
      this.buildings[bId].level = 10;
      this.buildings[bId].maxLevel = 10;
      this.buildings[bId].isPaused = false;
    }

    // 2. 창고(storage) Lv.10 기준 모든 자원 최대 적재 한도로 완충
    const resKeys = Object.keys(this.resources) as Array<keyof GameResources>;
    for (const key of resKeys) {
      this.resources[key] = this.getMaxResourceCapacity(key);
    }

    // 3. 1F~10F 보스 전용 고유 비전서 10종 서고(skillBookInventory)에 보관
    const bossBooks = ALL_SKILL_BOOKS.filter(b => b.isBossExclusive || b.id.startsWith('book_boss_') || (b.bossFloor !== undefined && b.bossFloor >= 1));
    if (!Array.isArray(this.skillBookInventory)) {
      this.skillBookInventory = [];
    }
    for (const bDef of bossBooks) {
      const exists = this.skillBookInventory.some(sb => sb.bookId === bDef.id);
      if (!exists) {
        this.skillBookInventory.push({
          id: `sb_boss_${bDef.id}_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          bookId: bDef.id,
          name: bDef.name,
          rank: bDef.rank,
          skill: bDef.skill,
          description: bDef.description,
          icon: bDef.icon
        });
      }
    }

    // 4. 히어로('hero') 등급 30레벨 영웅 5인 구성
    const heroDefs = [
      {
        id: 'hero_iris_h30',
        name: '아이리스',
        title: '불굴의 성기사단장',
        trait: '강철의 수호자',
        classId: 'paladin',
        position: 'front' as PositionSlot,
        equip: {
          weapon: { id: 'eq_iris_wp_30', baseName: '성광 대검', name: '영원의 성광 대검 +10', slot: 'weapon' as EquipmentSlot, rarity: 'epic' as const, level: 30, stats: { atk: 95, def: 25, hp: 120, luck: 15 }, icon: '⚔️', description: '신성한 빛이 깃든 성기사단의 보검' },
          armor: { id: 'eq_iris_ar_30', baseName: '백금 성갑', name: '수호신의 백금 성갑 +10', slot: 'armor' as EquipmentSlot, rarity: 'epic' as const, level: 30, stats: { def: 88, hp: 280, luck: 10 }, icon: '🛡️', description: '어떤 마물의 공격도 튕겨내는 불침의 갑옷' },
          accessory: { id: 'eq_iris_ac_30', baseName: '맹세 휘장', name: '단죄의 맹세 휘장 +10', slot: 'accessory' as EquipmentSlot, rarity: 'epic' as const, level: 30, stats: { hp: 150, def: 20, mp: 60, luck: 18 }, icon: '💍', description: '성기사단장의 신념이 새겨진 성스러운 휘장' }
        }
      },
      {
        id: 'hero_bartol_h30',
        name: '바르톨',
        title: '전장의 파괴자',
        trait: '광전사의 혈통',
        classId: 'valhalla_blade',
        position: 'front' as PositionSlot,
        equip: {
          weapon: { id: 'eq_bartol_wp_30', baseName: '라그나로크', name: '멸망의 라그나로크 +10', slot: 'weapon' as EquipmentSlot, rarity: 'epic' as const, level: 30, stats: { atk: 145, spd: 12, hp: 100, luck: 22 }, icon: '🗡️', description: '적의 뼈와 살을 분쇄하는 거대한 혈풍 대검' },
          armor: { id: 'eq_bartol_ar_30', baseName: '불멸 흉갑', name: '진홍의 불멸 흉갑 +10', slot: 'armor' as EquipmentSlot, rarity: 'epic' as const, level: 30, stats: { def: 65, hp: 220, atk: 25 }, icon: '🦺', description: '선혈을 흡수하여 착용자를 끝없이 전장에 머물게 하는 흉갑' },
          accessory: { id: 'eq_bartol_ac_30', baseName: '해골환', name: '투신의 분노 해골환 +10', slot: 'accessory' as EquipmentSlot, rarity: 'epic' as const, level: 30, stats: { atk: 35, hp: 80, spd: 8, luck: 20 }, icon: '📿', description: '끝없는 투쟁심을 불태우는 붉은 마도 목걸이' }
        }
      },
      {
        id: 'hero_kael_h30',
        name: '카엘',
        title: '그림자 암살자',
        trait: '신속한 그림자',
        classId: 'shadow_phantom',
        position: 'mid' as PositionSlot,
        equip: {
          weapon: { id: 'eq_kael_wp_30', baseName: '심연 비수', name: '무간 심연의 비수 +10', slot: 'weapon' as EquipmentSlot, rarity: 'epic' as const, level: 30, stats: { atk: 125, spd: 28, luck: 35 }, icon: '🗡️', description: '차원을 가르는 어둠의 단검 쌍검' },
          armor: { id: 'eq_kael_ar_30', baseName: '영혼 가죽옷', name: '환영의 영혼 가죽옷 +10', slot: 'armor' as EquipmentSlot, rarity: 'epic' as const, level: 30, stats: { def: 52, hp: 160, spd: 20, luck: 25 }, icon: '🧥', description: '모습을 감추고 적의 공격을 환영으로 흘려보내는 암살복' },
          accessory: { id: 'eq_kael_ac_30', baseName: '그림자 부적', name: '밤안개의 그림자 부적 +10', slot: 'accessory' as EquipmentSlot, rarity: 'epic' as const, level: 30, stats: { spd: 22, luck: 32, atk: 20 }, icon: '🧿', description: '심연의 안개가 피어오르는 비전 부적' }
        }
      },
      {
        id: 'hero_serena_h30',
        name: '세레나',
        title: '원소의 대마도사',
        trait: '비전 탐구자',
        classId: 'calamity_mage',
        position: 'back' as PositionSlot,
        equip: {
          weapon: { id: 'eq_serena_wp_30', baseName: '에테르 지팡이', name: '종말의 에테르 지팡이 +10', slot: 'weapon' as EquipmentSlot, rarity: 'epic' as const, level: 30, stats: { atk: 135, mp: 180, luck: 25 }, icon: '🪄', description: '천체와 원소 마나를 무한히 끌어모으는 비전 마도봉' },
          armor: { id: 'eq_serena_ar_30', baseName: '별빛 로브', name: '초신성의 별빛 로브 +10', slot: 'armor' as EquipmentSlot, rarity: 'epic' as const, level: 30, stats: { def: 48, hp: 150, mp: 120, luck: 20 }, icon: '👘', description: '원소 보호막이 둘러쳐진 고대 마도사의 비단 로브' },
          accessory: { id: 'eq_serena_ac_30', baseName: '특이점 보옥', name: '마력 특이점 보옥 +10', slot: 'accessory' as EquipmentSlot, rarity: 'epic' as const, level: 30, stats: { mp: 150, atk: 28, luck: 25 }, icon: '🔮', description: '시공간 마력을 응축한 푸른 영롱 보석' }
        }
      },
      {
        id: 'hero_elena_h30',
        name: '엘레나',
        title: '성령의 구원자',
        trait: '신성한 서약',
        classId: 'high_saintess',
        position: 'back' as PositionSlot,
        equip: {
          weapon: { id: 'eq_elena_wp_30', baseName: '성령 로드', name: '기적의 은총 성령 로드 +10', slot: 'weapon' as EquipmentSlot, rarity: 'epic' as const, level: 30, stats: { atk: 75, mp: 160, hp: 140, luck: 25 }, icon: '🌟', description: '죽어가는 자에게 즉시 생명을 불어넣는 신성 홀' },
          armor: { id: 'eq_elena_ar_30', baseName: '대성녀 예복', name: '자애로운 대성녀 예복 +10', slot: 'armor' as EquipmentSlot, rarity: 'epic' as const, level: 30, stats: { def: 58, hp: 220, mp: 100, luck: 22 }, icon: '👗', description: '모든 부정한 상태이상을 거부하는 축복받은 사제복' },
          accessory: { id: 'eq_elena_ac_30', baseName: '영혼의 묵주', name: '순백 영혼의 묵주 +10', slot: 'accessory' as EquipmentSlot, rarity: 'epic' as const, level: 30, stats: { hp: 120, mp: 110, def: 18, luck: 26 }, icon: '🕊️', description: '방주 원정대를 지켜주는 성령의 신성한 묵주' }
        }
      }
    ];

    const createdHeroes: Mercenary[] = [];
    for (const def of heroDefs) {
      const cClass = CHARACTER_CLASSES[def.classId] || CHARACTER_CLASSES['paladin'];
      const computed = GameManager.calcHeroStatsForClassAndLevel(def.classId, 30, 'hero', def.trait);
      const hero: Mercenary = this.sanitizeHero({
        id: def.id,
        name: def.name,
        title: def.title,
        trait: def.trait,
        classId: def.classId,
        grade: 'hero',
        level: 30,
        exp: 0,
        expToNext: 1500,
        currentHp: computed.maxHp,
        maxHp: computed.maxHp,
        currentMp: computed.maxMp,
        maxMp: computed.maxMp,
        position: def.position,
        stats: computed.stats,
        equippedSkills: cClass.skills.slice(0, 2).map(s => s.id),
        learnedSkills: [
          ...cClass.skills.map(s => s.id),
          ...(cClass.specialSkill ? [cClass.specialSkill.id] : [])
        ],
        equipment: def.equip,
        statusEffects: [],
        portraitPromptKey: cClass.promptKey
      });
      createdHeroes.push(hero);
    }

    // 막사(barracks)에 이 5인을 최우선 배치 (기존 타 용병과 병합, 최대 7명 정원 준수)
    const existingOtherHeroes = this.barracks.filter(h => !createdHeroes.some(ch => ch.id === h.id || ch.name === h.name));
    this.barracks = [...createdHeroes, ...existingOtherHeroes].slice(0, 7);

    // 파티는 5인 중 최적의 3인 조합 (성기사 아이리스 [전열], 그림자 카엘 [중열], 구원자 엘레나 [후열])으로 기본 편성
    this.party = [createdHeroes[0], createdHeroes[2], createdHeroes[4]];
    this.reconcileParty();

    // 5. 심연 던전 10층까지 전면 해금 (성채 채비실에서 1~10층 즉시 선택 출격 가능)
    this.unlockedDungeonFloor = Math.max(this.unlockedDungeonFloor || 1, 10);
    this.dungeonFloor = Math.max(this.dungeonFloor || 1, 10);

    // 6. 퀘스트 점검 및 상태 알림
    this.checkAllQuestObjectives();
    this.emit('resourcesChanged');
    this.emit('buildingUpdated');
    this.emit('partyUpdated', this.party);
    this.emit('questUpdated');
    this.emit('inventoryUpdated', this.equipmentInventory);
    this.emit('dungeonUpdated');
    this.emit('update');

    this.addLog('👑 [지휘관 최고 전력 활성화] 13개 전 건물 10레벨 증축, 전 자원 최대치 완충, 10종 보스 비전서 서고 입고, 5인의 30레벨 히어로급 원정대 집결, 심연 10층까지의 던전이 전면 해금되었습니다!', 'reward');
    this.saveGame();
    this.saveToCloud().catch(() => {});
  }

  public loadGame(): boolean {
    try {
      const raw = localStorage.getItem(this.getSaveKey());
      if (raw) {
        const parsed = JSON.parse(raw) as Record<string, unknown>;

        if (parsed.resources) {
          this.resources = parsed.resources as typeof this.resources;
          if (this.resources.bone === undefined) this.resources.bone = 0;
        }
        if (parsed.buildings) {
          const parsedB = parsed.buildings as typeof this.buildings;
          for (const key in parsedB) {
            const bId = key as BuildingId;
            if (this.buildings[bId]) {
              this.buildings[bId].level = parsedB[bId].level;
              this.buildings[bId].unlocked = parsedB[bId].unlocked;
              this.buildings[bId].isPaused = false; // 수동 가동 중단 기능 제거에 따른 상시 가동 상태 보장
            }
          }
          // 창고(방주 중앙 병참고)는 최소 1레벨 및 해금 상태 유지
          if (this.buildings['storage']) {
            this.buildings['storage'].unlocked = true;
            if (this.buildings['storage'].level === 0) {
              this.buildings['storage'].level = 1;
            }
          }
        }
        if (parsed.quests)             this.quests             = this.syncQuestsWithDefinitions(parsed.quests as Quest[]);
        if (parsed.barracks) {
          this.barracks = (parsed.barracks as (Partial<Mercenary> | Mercenary)[]).map(h => this.sanitizeHero(h));
        }
        if (parsed.party) {
          const pArray = parsed.party as (Partial<Mercenary> | Mercenary)[];
          this.party = [];
          for (const p of pArray) {
            if (!p || !p.id) continue;
            const bIdx = this.barracks.findIndex(h => h.id === p.id);
            if (bIdx !== -1) {
              const sanitizedP = this.sanitizeHero(p);
              // 참조 동기화 및 기존 세이브의 레벨 손실 복구
              if (sanitizedP.level > this.barracks[bIdx].level || (sanitizedP.level === this.barracks[bIdx].level && sanitizedP.exp > this.barracks[bIdx].exp)) {
                this.barracks[bIdx] = sanitizedP;
              } else {
                this.barracks[bIdx].position = sanitizedP.position || this.barracks[bIdx].position || 'mid';
              }
              if (!this.party.some(h => h.id === this.barracks[bIdx].id)) {
                this.party.push(this.barracks[bIdx]);
              }
            }
          }
        }
        if (parsed.equipmentInventory) {
          this.equipmentInventory = (parsed.equipmentInventory as EquipmentItem[]).map(item => {
            this.recalculateItemStats(item);
            return item;
          });
        }
        if (parsed.customSkills) {
          this.customSkills = parsed.customSkills as Record<string, Skill>;
          Object.assign(ALL_SKILLS_MAP, this.customSkills);
        }
        if (parsed.skillBookInventory) {
          this.skillBookInventory = (parsed.skillBookInventory as SkillBookItem[]).map(b => ({
            ...b,
            count: b.count || 1
          }));
          for (const b of this.skillBookInventory) {
            if (b.skill && b.skill.id) {
              this.customSkills[b.skill.id] = b.skill;
              ALL_SKILLS_MAP[b.skill.id] = b.skill;
            }
          }
        }
        if (parsed.currentArenaRank)   this.currentArenaRank   = parsed.currentArenaRank as number;
        if (parsed.currentArenaRating) this.currentArenaRating = parsed.currentArenaRating as number;
        if (parsed.arenaCoins !== undefined) this.arenaCoins   = parsed.arenaCoins as number;
        if (parsed.arenaStreak !== undefined) this.arenaStreak = parsed.arenaStreak as number;
        if (parsed.pveBuffActive !== undefined) this.pveBuffActive = parsed.pveBuffActive as boolean;
        if (parsed.bonfireStacks !== undefined) this.bonfireStacks = parsed.bonfireStacks as number;
        if (parsed.bonfireWarmthTime !== undefined) this.bonfireWarmthTime = parsed.bonfireWarmthTime as number;
        if (parsed.lastTickTimestamp) this.lastTickTimestamp = parsed.lastTickTimestamp as number;
        else if (parsed.lastSavedAt) this.lastTickTimestamp = parsed.lastSavedAt as number;
        if (parsed.dungeonFloor)       this.dungeonFloor       = parsed.dungeonFloor as number;
        if (parsed.dungeonDangerLevel !== undefined) this.dungeonDangerLevel = parsed.dungeonDangerLevel as number;
        if (parsed.isOvercharged !== undefined) this.isOvercharged = parsed.isOvercharged as boolean;
        if (parsed.dungeonInventory && Array.isArray(parsed.dungeonInventory)) {
          this.dungeonInventory = parsed.dungeonInventory as DungeonItemSlot[];
        }
        if (parsed.unlockedDungeonFloor) this.unlockedDungeonFloor = parsed.unlockedDungeonFloor as number;
        if (parsed.hasEnteredDungeon !== undefined) this.hasEnteredDungeon = parsed.hasEnteredDungeon as boolean;
        if (parsed.hasReturnedFromDungeon !== undefined) this.hasReturnedFromDungeon = parsed.hasReturnedFromDungeon as boolean;
        if (this.unlockedDungeonFloor >= 2) this.hasEnteredDungeon = true;
        if (parsed.hasCraftedEquipment !== undefined) this.hasCraftedEquipment = parsed.hasCraftedEquipment as boolean;
        if (parsed.hasCraftedGrimoire !== undefined) this.hasCraftedGrimoire = parsed.hasCraftedGrimoire as boolean;
        if (parsed.subQuestCooldownUntil !== undefined) this.subQuestCooldownUntil = parsed.subQuestCooldownUntil as number;
        if (parsed.hasInitializedSubQuests !== undefined) this.hasInitializedSubQuests = parsed.hasInitializedSubQuests as boolean;
        if (parsed.unlockedAviciTier !== undefined) this.unlockedAviciTier = parsed.unlockedAviciTier as number;
        if (parsed.purifiedFloors && Array.isArray(parsed.purifiedFloors)) {
          this.purifiedFloors = (parsed.purifiedFloors as number[]).map(Number).filter(n => !isNaN(n));
        }
        this.syncPurifiedFloorsFromQuests();
        if (parsed.infirmaryPatients)  this.infirmaryPatients  = parsed.infirmaryPatients as string[];
        if (parsed.bonds)              this.bonds              = parsed.bonds as Record<string, number>;
        if (parsed.citadelSupplies)     this.citadelSupplies     = { torch: 0, food: 0, pickaxe: 0, bandage: 0, holy_water: 0, key: 0, ...(parsed.citadelSupplies as Record<string, number>) };
        if (parsed.backpackCapacity !== undefined) this.backpackCapacity = parsed.backpackCapacity as number;
        if (parsed.lastSelectedBagId)  this.lastSelectedBagId  = parsed.lastSelectedBagId as string;
        if (parsed.tavernArrivalSecondsLeft !== undefined) this.tavernArrivalSecondsLeft = parsed.tavernArrivalSecondsLeft as number;
        if (parsed.tavernRefreshCount !== undefined) this.tavernRefreshCount = parsed.tavernRefreshCount as number;
        if (parsed.nemesisState) {
          this.nemesisState = { ...this.nemesisState, ...(parsed.nemesisState as Partial<NemesisState>) };
        }
        if (parsed.invasionState) {
          this.invasionState = { ...this.invasionState, ...(parsed.invasionState as Partial<InvasionState>) };
        }
        if (parsed.cemetery && Array.isArray(parsed.cemetery)) {
          this.cemetery = (parsed.cemetery as FallenHero[]).slice(0, 5);
        }
        if (!this.cemetery || this.cemetery.length === 0) {
          this.cemetery = [this.getInitialFallenHero()];
        }
        if (parsed.memorialExpBuffUntil !== undefined) {
          this.memorialExpBuffUntil = parsed.memorialExpBuffUntil as number;
        }
        if (parsed.activeAncestralBlessing) {
          const ab = parsed.activeAncestralBlessing as any;
          if (ab && ab.name && ab.buffs) {
            this.activeAncestralBlessing = ab as ActiveAncestralBlessing;
          } else {
            this.activeAncestralBlessing = null;
          }
        }
        if (parsed.marketStock && typeof parsed.marketStock === 'object') {
          this.marketStock = parsed.marketStock as Record<string, { current: number; restockAt?: number }>;
        }
        if (parsed.codexUnlockedItems) {
          this.codexUnlockedItems = parsed.codexUnlockedItems as Record<string, boolean>;
          for (let f = 1; f <= 10; f++) {
            if (this.codexUnlockedItems[`codex_ooparts_${f}_1`] || this.codexUnlockedItems[`codex_ooparts_${f}_2`]) {
              this.codexUnlockedItems[`codex_ooparts_floor_${f}`] = true;
            }
          }
        }
        if (Array.isArray(parsed.codexUnlockOrder)) {
          this.codexUnlockOrder = parsed.codexUnlockOrder as string[];
        } else if (this.codexUnlockedItems) {
          this.codexUnlockOrder = Object.keys(this.codexUnlockedItems);
        }
        if (parsed.codexUnlockedTimestamps && typeof parsed.codexUnlockedTimestamps === 'object') {
          this.codexUnlockedTimestamps = parsed.codexUnlockedTimestamps as Record<string, number>;
        }
        if (parsed.isMasterAccount !== undefined) {
          this.isMasterAccount = parsed.isMasterAccount as boolean;
        }
        if (parsed.hasChronoCompass !== undefined) {
          this.hasChronoCompass = Boolean(parsed.hasChronoCompass);
        } else if (this.quests.some(q => (q.id === 'Q_SCENARIO_04' || q.id === 'Q_SCENARIO_4_3') && q.status === 'completed')) {
          this.hasChronoCompass = true;
        }
        if (parsed.purifiedEquipmentHistory && Array.isArray(parsed.purifiedEquipmentHistory)) {
          this.purifiedEquipmentHistory = parsed.purifiedEquipmentHistory as { item: EquipmentItem; purifiedAt: number }[];
          this.cleanExpiredPurifiedItems();
        }
        this.checkNemesisDailyReset();
        if (Array.isArray(parsed.logs) && parsed.logs.length > 0) {
          this.logs = (parsed.logs as LogEntry[]).map(l => {
            if (l.text && (l.text.includes('[신규 서브 의뢰 도착]') || l.text.includes('서브 의뢰 도착'))) {
              return { ...l, category: 'citadel' as const };
            }
            if (l.text && (l.text.includes('초기 2인 결사대') || l.text.includes('현재 원정대로'))) {
              return { ...l, text: this.getCurrentPartyLogText(), category: 'citadel' as const };
            }
            return l;
          });
          this.citadelLogs = this.logs.filter(l => !l.category || l.category === 'citadel');
          this.dungeonLogs = this.logs.filter(l => l.category === 'dungeon');
          this.battleLogs = this.logs.filter(l => l.category === 'battle');
        } else {
          this.logs = this.logs.map(l => {
            if (l.text && (l.text.includes('초기 2인 결사대') || l.text.includes('현재 원정대로'))) {
              return { ...l, text: this.getCurrentPartyLogText(), category: 'citadel' as const };
            }
            return l;
          });
          if (this.logs.length === 0) {
            this.addLog('차가운 흑무가 방주 성채를 감싸고 있습니다.', 'normal', 'citadel');
            this.addLog(this.getCurrentPartyLogText(), 'story', 'citadel');
          } else {
            this.citadelLogs = this.logs.filter(l => !l.category || l.category === 'citadel');
          }
        }

        // 모든 용병의 성장 경험치 테이블 최신화
        this.barracks.forEach(h => {
          h.expToNext = GameManager.calcExpToNext(h.level);
        });
        this.party.forEach(h => {
          h.expToNext = GameManager.calcExpToNext(h.level);
        });

        this.reconcileEquipment();
        this.checkAllQuestObjectives();
        this.processOfflineProgress();
        this.emit('resourcesChanged');
        this.emit('buildingUpdated');
        this.emit('partyUpdated', this.party);
        this.emit('questUpdated');
        this.emit('inventoryUpdated', this.equipmentInventory);
        return true;
      } else {
        this.initDefaultData();
        return false;
      }
    } catch (e) {
      console.warn('Load fallback to default', e);
      this.initDefaultData();
      return false;
    }
  }

  // ================= 방주의 성화 관련 수동 액션 =================
  /** 성화 점화/유지에 필요한 영목 수량 계산 (스택당 5개씩 증가: 5->10->15->20->25, 점화 후 유지/연장은 5개) */
  public getRequiredStokeWood(): number {
    if (this.bonfireWarmthTime > 0 && this.bonfireStacks >= 5) {
      return 5; // 점화 후 불이 안 꺼지게 유지/연장하는 데는 5개 소모
    }
    return (this.bonfireStacks + 1) * 5; // 0스택->1스택(5), 1스택->2스택(10), 2스택->3스택(15), 3스택->4스택(20), 4스택->5스택(25)
  }

  public stokeFire(): void {
    const isCurrentlyLit = this.bonfireWarmthTime > 0 && this.bonfireStacks >= 5;

    // 완전히 꺼진 상태에서 5스택(완전 점화)으로 올리려는데 잔여 점화 횟수가 0인 경우 광고 충전 유도
    if (!isCurrentlyLit && this.bonfireStacks === 4 && this.bonfireAdCharges <= 0) {
      this.addLog(`⚠️ [성화 완전 점화 불가] 오늘의 성화 점화 횟수를 모두 소진했습니다. 광고를 시청하고 5회를 재충전하세요!`, 'danger', 'citadel');
      return;
    }

    const cost = this.getRequiredStokeWood();
    if (this.resources.wood < cost) {
      this.addLog(`성화 점화 실패: 영목(목재)이 부족합니다! (${cost}개 필요)`, 'danger');
      return;
    }
    this.resources.wood -= cost;
    this.emit('resourcesChanged');

    if (isCurrentlyLit) {
      // 🔥 이미 점화된 온기 연장: 추가 목재 투입으로 불을 꺼뜨리지 않는 한 점화 횟수 차감 없음!
      this.bonfireWarmthTime = Math.min(300, this.bonfireWarmthTime + 30);
      this.addLog(`🔥 [방주의 성화 유지] 영목 ${cost}개를 더해 성화의 온기를 연장합니다. (남은 온기: ${Math.floor(this.bonfireWarmthTime / 60)}분 ${this.bonfireWarmthTime % 60}초)`, 'bonfire_extend');
    } else {
      // 불씨 스택 쌓기 (1~4스택 쌓는 과정은 횟수 차감 없음)
      this.bonfireStacks = Math.min(5, this.bonfireStacks + 1);
      
      if (this.bonfireStacks === 1) {
        this.addLog(`🔥 [방주의 성화] 성화에 첫 불씨가 지펴졌습니다.`, 'bonfire1');
      } else if (this.bonfireStacks === 2) {
        this.addLog(`🔥 [방주의 성화] 성화의 불꽃이 조금 더 밝아집니다.`, 'bonfire2');
      } else if (this.bonfireStacks === 3) {
        this.addLog(`🔥 [방주의 성화] 성화 주위에 따스한 온기가 퍼져나갑니다.`, 'bonfire3');
      } else if (this.bonfireStacks === 4) {
        this.addLog(`🔥 [방주의 성화] 강렬한 성화의 불꽃이 타오르기 시작합니다! (다음 투입 시 완전 점화)`, 'bonfire4');
      } else if (this.bonfireStacks === 5) {
        // ✨ 5스택 도달로 완전 점화되는 순간에만 1회 차감!
        this.bonfireWarmthTime = 300; // 5분
        this.bonfireAdCharges = Math.max(0, this.bonfireAdCharges - 1);
        this.addLog(`✨🔥 [방주의 성화 완전 점화!] 신성한 성화의 온기가 방주 전체를 감쌉니다! (점화 횟수 1회 차감, 잔여: ${this.bonfireAdCharges}/5회) [전투 EXP +20%, 영지 생산 +15%, 6초당 전원 HP/MP +1 재생]`, 'bonfire5');
      }
    }
    this.emit('buildingUpdated');
  }

  public gatherWood(): void {
    const gained = Math.floor(Math.random() * 3) + 1; // 1~3개
    this.resources.wood = Math.min(this.getMaxResourceCapacity('wood'), this.resources.wood + gained);
    this.addLog(`방주 주변에서 떨어진 영목 가지를 주워 목재 +${gained} 획득`, 'system');
    this.emit('resourcesChanged');
    this.emit('buildingUpdated');
  }
}

