// ─── 기본 자원 타입 (6종 원자재 + 8종 특수 재료 + 4종 인챈트 마도석) ──────────────
export type ResourceType =
  | 'wood' | 'stone' | 'iron' | 'food' | 'gold' | 'ether'
  | 'herb' | 'leather' | 'silk' | 'coal' | 'bone'
  | 'crystal' | 'void_shard'
  | 'prefix_stone' | 'suffix_stone' | 'pure_prefix_stone' | 'pure_suffix_stone'
  | 'relic_floor_1' | 'relic_floor_2' | 'relic_floor_3' | 'relic_floor_4' | 'relic_floor_5' 
  | 'relic_floor_6' | 'relic_floor_7' | 'relic_floor_8' | 'relic_floor_9' | 'relic_floor_10';

export interface GameResources {
  // 🪵 기본 원자재 (6종)
  wood: number;
  stone: number;
  iron: number;
  food: number;
  gold: number;
  ether: number;
  // 🌿 던전 파밍 재료 (5종)
  herb: number;         // 약초 — 붕대/물약/성수 제작
  leather: number;      // 가죽 — 경량 갑옷/배낭/촉매 제작
  silk: number;         // 실크(정령의 비단) — 마법 로브/부적 단조
  coal: number;         // 석탄 — 횃불 및 고급 제련 연료
  bone: number;         // 짐승 뼈 — 특수 장비/단조 및 상위 강화 재료
  // 🔮 심연 희귀 유물 (2종)
  crystal: number;      // 마력 수정 — 마법 장비 및 나침반 촉매
  void_shard: number;   // 공허의 파편 — 대용량 배낭 및 2차 승급
  // ✨ 인챈트 마도석 (4종)
  prefix_stone: number;       // 일반 접두석 (1~2층 드롭)
  suffix_stone: number;       // 일반 접미석 (1~2층 드롭)
  pure_prefix_stone: number;  // 순수 접두석 (3~5층/보스 드롭)
  pure_suffix_stone: number;  // 순수 접미석 (3~5층/보스 드롭)
  // 👑 광폭화 보스 전용 신화 유물 (10종)
  relic_floor_1: number; // 침묵의 흑핵 (1F)
  relic_floor_2: number; // 망령의 영혼수정 (2F)
  relic_floor_3: number; // 원초의 광맥 심장 (3F)
  relic_floor_4: number; // 심연의 시공 닻 (4F)
  relic_floor_5: number; // 공허 지배자의 모노리스 핵 (5F)
  relic_floor_6: number; // 핏빛 대공의 진홍 성배 (6F)
  relic_floor_7: number; // 망각 묘지기의 영혼 나침반 (7F)
  relic_floor_8: number; // 단죄의 기사단장 맹세 휘장 (8F)
  relic_floor_9: number; // 미궁 지배자의 진실 거울 파편 (9F)
  relic_floor_10: number; // 심연 군주의 옥새 / 마핵 (10F)
  // 🏛️ 고대 오파츠 및 회고록 쪽지 등 동적 컬렉터블 키 지원
  [key: string]: number;
}

export type BuildingId =
  | 'bonfire'      // 모닥불 (기초 거점)
  | 'cabin'        // 피난민 오두막 (일꾼/인구)
  | 'lumberCamp'   // 벌목장 (목재 자동 생산)
  | 'quarry'       // 마도 광산 (석재 및 철광석 자동 생산)
  | 'butchery'     // 마물 가공소 (식량 및 가죽 자동 생산)
  | 'tavern'       // 주점 (용병 고용)
  | 'blacksmith'   // 대장간 (장비 제작 및 강화)
  | 'sanctuary'    // 영혼의 성소 (1차/2차 전직 촉매)
  | 'alchemy'      // 연금술 연구소 (포션 및 에테르 정제)
  | 'arenaGate'    // 차원 아레나 (비동기 PVP)
  | 'storage'      // 창고 (아이템/재료 관리)
  | 'infirmary'    // 의료소 (부상자 치료)
  | 'market';      // 시장 (재료 판매 및 구매)

export interface BuildingState {
  id: BuildingId;
  name: string;
  level: number;
  maxLevel?: number; // 유지비 체납 전 실제 영구 증축된 최고 레벨 (유지비 재확보 시 자동 복구 기준)
  isPaused?: boolean; // ⏸️ 수동 가동 일시 정지 (생산 및 유지비 소모 완전 중단)
  unlocked: boolean;
  requiredQuestId?: string;
  description: string;
  icon: string;
  promptKey: string;
  themeColor: number;
  productionRate?: Partial<GameResources>;
  construction?: {
    startedAt: number;
    durationMs: number;
    targetLevel: number;
  };
}

export type ClassTier = 0 | 1 | 2 | 3;
export type PositionSlot = 'front' | 'mid' | 'back';
export type EquipmentSlot = 'weapon' | 'armor' | 'accessory';

export interface EnchantOption {
  id: string;
  name: string;      // e.g. "날카로운", "화염의", "상흔", "수호"
  type: 'prefix' | 'suffix';
  rarity: 'rare' | 'epic' | 'legendary';
  stats: {
    atk?: number;
    def?: number;
    hp?: number;
    mp?: number;
    spd?: number;
    luck?: number;             // 🍀 행운 (치명타/저항/적중/회피 종합 보정)
    crit?: number;             // 하위 호환용
    damageBonus?: number;      // 피해량 증폭 %
    defPenetration?: number;   // 방어 관통 %
    drainPercent?: number;     // 흡혈 %
  };
  grantedSkill?: Skill;        // 인챈트로 획득하는 고유 전투 스킬
  targetSlot?: EquipmentSlot | 'all'; // 인챈트 적용 대상 장비 슬롯 (무기/방어구/장신구/공용)
  targetWeaponType?: WeaponType; // 특정 무기 계열 전용 인챈트 (검/창/활/총/단검/지팡이)
  description: string;
}

export type WeaponType = 'sword' | 'spear' | 'bow' | 'gun' | 'staff' | 'dagger';

export interface WeaponTrait {
  id: string;
  weaponType: WeaponType;
  badge: string;            // e.g. "🗡️ 베기", "🔱 강타", "🏹 급소", "🔫 연사"
  name: string;             // e.g. "베기 (Slash)", "강타 & 쇄갑 (Bash & Pierce)"
  color: string;            // 뱃지 강조 텍스트 색상
  bgColor: string;          // 뱃지 배경색
  shortDesc: string;        // 뱃지/카드 노출용 요약 설명
  description: string;      // 상세 툴팁 설명
}

export interface EquipmentItem {
  id: string;
  baseName: string;            // 베이스 명칭 (e.g. "검", "창", "판금 갑옷")
  name: string;                // 조합된 전체 명칭 (e.g. "[화염의] 검 [상흔] +3")
  slot: EquipmentSlot;
  weaponType?: WeaponType;     // ⚔️ 무기 세부 계열 (검, 창, 활, 총 등)
  weaponTrait?: WeaponTrait;   // 🏷️ 무기 고유 특성 뱃지 및 메커니즘
  level: number;
  enhanceLevel?: number;       // 강화 수치 별칭 (level과 호환)
  awakeningLevel?: number;     // 🌟 병기창 10레벨 장비 각성 단계 (최대 3단계: 0~3)
  tier?: number;               // 🏭 병기창 단조 티어 (1~10티어)
  templateId?: string;         // 👑 원본 템플릿/보스 세트 ID (e.g. "boss_uniq_1_wpn", "forge_t3_sword")
  rarity: 'common' | 'rare' | 'unique' | 'epic' | 'legendary';
  stats: {
    atk?: number;
    def?: number;
    hp?: number;
    mp?: number;
    spd?: number;
    luck?: number;             // 🍀 행운
    crit?: number;             // 하위 호환용
    critRate?: number;         // 치명타율 별칭
  };
  baseStats?: {
    atk?: number;
    def?: number;
    hp?: number;
    mp?: number;
    spd?: number;
    luck?: number;
    crit?: number;
    critRate?: number;
  };
  description: string;
  icon: string;
  equippedHeroId?: string;
  prefix?: EnchantOption;      // 부여된 접두어
  suffix?: EnchantOption;      // 부여된 접미어
  enchantPrefix?: EnchantOption; // 하위 호환 별칭
  enchantSuffix?: EnchantOption; // 하위 호환 별칭
  isCorrupted?: boolean;         // 💀 심연 침식 여부 ([침식된] 장비, 착용 불가, 병기창 정화 필요)
  isUnpurified?: boolean;        // 정화되지 않은 상태 여부
  isCursed?: boolean;          // 심연의 저주 부여 여부
  curseDesc?: string;          // 저주 페널티 설명 (e.g. "공격 시 체력 5% 소모")
  affinity?: string[];         // 적합 클래스/직군 성향
  setId?: string;              // 👑 보스 세트 고유 ID (e.g. "boss_set_5")
  setName?: string;            // 👑 세트 명칭 (e.g. "공허 지배자 세트")
  setRequiredCount?: number;   // 👑 풀 세트 필요 장비 수 (3)
  setBonusDesc?: string;       // 👑 풀 세트 달성 시 특별 보너스 설명
}

export interface EquipmentRecipe {
  id: string;
  templateId?: string;         // 🏭 병기창 티어 아이콘 매핑용 ID (e.g. "forge_t1_sword")
  tier?: number;               // 🏭 병기창 단조 티어 (1~10티어)
  name: string;
  slot: EquipmentSlot;
  weaponType?: WeaponType;     // ⚔️ 무기 세부 계열
  weaponTrait?: WeaponTrait;   // 🏷️ 무기 고유 특성 뱃지
  rarity: 'common' | 'rare' | 'unique' | 'epic' | 'legendary';
  cost: Partial<GameResources>;
  baseStats: {
    atk?: number;
    def?: number;
    hp?: number;
    mp?: number;
    spd?: number;
    luck?: number;             // 🍀 행운
    crit?: number;
    critRate?: number;
  };
  description: string;
  icon: string;
  affinity?: string[];
}

export interface TavernCandidate {
  id: string;
  name: string;
  classId: string;
  grade: MercenaryGrade;
  trait: string;
  hiringCost: number;
  stats: {
    hp: number;
    mp: number;
    atk: number;
    def: number;
    spd: number;
    luck: number;
  };
}

export type SkillRank = 'basic' | 'enhanced' | 'rare' | 'epic' | 'mythic';

export interface SkillBookItem {
  id: string;
  bookId: string;
  name: string;
  rank: SkillRank;
  grade?: SkillRank;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  level?: number;             // 최고 10레벨까지 강화 가능 (기본 Lv.1)
  count?: number;             // 📚 서고/인벤토리 스택 수량 (보유 권수)
  basePower?: number;         // 드랍/제작 시 초기 위력 (강화 단계별 스케일링 기준)
  originMonsterName?: string; // 몬스터에게서 추출된 비기인 경우 출처 몬스터명
  affinity?: string[];        // ⚔️ 적합 직업군/계열 (['tank', 'berserker'], ['gunner', 'dealer_phy'], ['healer', 'dealer_mag'])
  skill: Skill;
  description: string;
  icon: string;
}

export interface Skill {
  id: string;
  name: string;
  description: string;
  icon?: string;
  manaCost: number;
  cooldown: number;
  targetType: 'single_enemy' | 'all_enemies' | 'single_ally' | 'all_allies' | 'self';
  power: number;
  effectType?: 'damage' | 'heal' | 'shield' | 'buff' | 'debuff' | 'stun' | 'bleed' | 'poison' | 'burn' | 'freeze' | 'regen' | 'debuff_atk' | 'debuff_def' | 'blind' | 'drain' | 'cleanse' | '';
  isSpecial?: boolean;
  isUnique?: boolean;
  rank?: SkillRank;
  affinity?: string[];
  /** 상태이상 부여 시 지속 턴 수 (bleed=2, stun=1, debuff=2 등) */
  statusDuration?: number;
  /** 포지션 연계 특화 ('front' | 'back' | 'any') */
  positionBonus?: 'front' | 'back' | 'any';
  /** 진형 붕괴 효과 ('knockback' | 'pull' | 'shuffle') */
  disruptPosition?: 'knockback' | 'pull' | 'shuffle';
  /** 콤보 기폭 특화 속성 */
  comboCategory?: 'slash' | 'crush' | 'pierce' | 'magic' | 'holy';
  /** 마법 계열 분류 ('elemental' | 'dark' | 'holy') */
  magicSchool?: MagicSchool;
  /** 보스/특수 스킬 속성 */
  isCharge?: boolean;
  breakGauge?: number;
  piercePct?: number;
  drainPct?: number;
  /** 은신 부여 여부 */
  stealth?: boolean;
  /** 궁극기 레벨 스케일링 적용 여부 플래그 */
  _isUltScaled?: boolean;
}

export type MagicSchool = 'elemental' | 'dark' | 'holy';

export const MAGIC_SCHOOL_META: Record<MagicSchool, { label: string; icon: string; color: string; desc: string }> = {
  elemental: {
    label: '원소 마법',
    icon: '🔥',
    color: '#ff9800',
    desc: '화염(화상), 빙결(동상/냉각), 전격(기절/감전) 등 원소 상태이상을 추가 부여합니다.'
  },
  dark: {
    label: '암흑 마법',
    icon: '🔮',
    color: '#9c27b0',
    desc: '기본 20% 방어 관통과 함께 마물 및 적 용병(PvP)에게 20% 추가 데미지를 입힙니다.'
  },
  holy: {
    label: '신성 마법',
    icon: '✨',
    color: '#ffd54f',
    desc: '치명타 확률이 30% 증가하며 언데드 및 타락 계열 몬스터에게 20% 추가 데미지를 입힙니다.'
  }
};

export type CharacterClassRole = 'tank' | 'dealer_phy' | 'dealer_mag' | 'healer' | 'gunner' | 'berserker';

export interface CharacterClass {
  id: string;
  name: string;
  tier: ClassTier;
  icon?: string;
  parentClassId?: string;
  promotions?: string[];
  role: CharacterClassRole;
  baseStats: {
    hp: number;
    mp: number;
    atk: number;
    def: number;
    spd: number;
    luck: number;
  };
  skills: Skill[];
  specialSkill: Skill;
  passiveDesc: string;
  promptKey: string;
  themeColor: number;
}

// ─── 상태이상 (StatusEffect) ───────────────────────────────────────────────────
export type StatusEffectType = 
  | 'bleed' 
  | 'poison' 
  | 'burn' 
  | 'freeze' 
  | 'frostbite'
  | 'stun' 
  | 'debuff_atk' 
  | 'debuff_def' 
  | 'shield' 
  | 'buff_atk' 
  | 'buff_def' 
  | 'buff_hit'
  | 'buff'
  | 'debuff'
  | 'regen' 
  | 'blind' 
  | 'riposte' 
  | 'immunity' 
  | 'buff_drain'
  | 'stealth';

export interface StatusEffect {
  type: StatusEffectType;
  /** 현재 남은 지속 턴 */
  turnsLeft: number;
  /** 원래 지속 턴 (표시용) */
  totalTurns: number;
  /** 효과 크기 (수치 또는 배율) */
  magnitude: number;
  /** 효과를 부여한 주체 이름 (로그용) */
  source: string;
  name?: string;
  duration?: number;
  icon?: string;
}

export const STATUS_EFFECT_META: Record<StatusEffectType, { icon: string; label: string; color: string; desc: string }> = {
  freeze:     { icon: '❄️', label: '냉각',      color: '#80d8ff', desc: '행동 불가 & 방어력 +40% (외피 동결 유지력 보전) & 턴당 최대 HP 4% 동상 피해' },
  frostbite:  { icon: '❄️', label: '동상',      color: '#80d8ff', desc: '매 턴 지속 한기 피해 및 행동 둔화' },
  bleed:      { icon: '🩸', label: '출혈',      color: '#ef5350', desc: '공격력 -40% & 턴당 최대 HP 7% 출혈 피해' },
  poison:     { icon: '☠️', label: '중독',      color: '#ab47bc', desc: '턴당 최대 HP 14% 치명적 맹독 피해 (최대 DoT)' },
  burn:       { icon: '🔥', label: '화상',      color: '#ff7043', desc: '방어력 -50% & 턴당 최대 HP 8% 화염 피해' },
  stun:       { icon: '💫', label: '기절',      color: '#ffd54f', desc: '1턴간 행동 불가' },
  shield:     { icon: '🛡️', label: '보호막',    color: '#42a5f5', desc: '피해 흡수' },
  debuff_atk: { icon: '🔻', label: '공격력 약화', color: '#ff7043', desc: '공격력 감소' },
  debuff_def: { icon: '💔', label: '방어력 약화', color: '#ff8a65', desc: '방어력 감소' },
  buff_atk:   { icon: '🔺', label: '공격력 강화', color: '#66bb6a', desc: '공격력 증가' },
  buff_def:   { icon: '🔰', label: '방어력 강화', color: '#4fc3f7', desc: '방어력 증가' },
  buff_hit:   { icon: '🎯', label: '명중력 증가', color: '#00e5ff', desc: '명중률 및 정밀도 상승' },
  buff:       { icon: '✨', label: '강화',      color: '#00d2ff', desc: '전투 능력 강화' },
  debuff:     { icon: '💀', label: '약화',      color: '#ff5252', desc: '전투 능력 약화' },
  regen:      { icon: '💚', label: '재생',      color: '#26a69a', desc: '턴당 체력 회복' },
  blind:      { icon: '👁️', label: '실명',      color: '#b0bec5', desc: '명중률 감소 (공격 시 50% 확률로 빗나감)' },
  riposte:    { icon: '⚡', label: '환영반격',  color: '#00e5ff', desc: '회피율 60% 증가 & 피격/회피 시 즉시 130% 환영 반격' },
  immunity:   { icon: '🌟', label: '디버프 면역', color: '#fff176', desc: '모든 해로운 상태이상(출혈/맹독/화상/냉각/기절/실명/약화) 완전 차단' },
  buff_drain: { icon: '🩸', label: '흡혈 태세',  color: '#ff1744', desc: '공격 시 가한 피해의 일부를 생명력으로 흡수' },
  stealth:    { icon: '👥', label: '은신',      color: '#b388ff', desc: '적의 표적에서 벗어나 피격되지 않으며 다음 공격 위력이 대폭 증폭됩니다' },
};

export type MercenaryGrade = 'rookie' | 'veteran' | 'hero' | 'epic' | 'elite' | 'legend';

export interface Mercenary {
  id: string;
  name: string;
  title: string;
  trait?: string; // ✨ 개인 고유 성향 특성
  promotionBonuses?: Array<'hp' | 'mp' | 'atk' | 'def' | 'spd' | 'luck'>; // ✨ 전직 시 선택한 30% 특화 스탯 목록
  awakeningCount?: number; // 🔮 2차 전직 이후 10레벨마다 거행한 초월 각성 차수
  awakeningBonuses?: Array<'hp' | 'mp' | 'atk' | 'def' | 'spd' | 'luck'>; // 🔮 초월 각성 시 선택한 15% 추가 상향 스탯 목록
  classId: string;
  grade: MercenaryGrade;
  level: number;
  exp: number;
  expToNext: number;
  currentHp: number;
  maxHp: number;
  currentMp: number;
  maxMp: number;
  position: PositionSlot;
  stats: {
    atk: number;
    def: number;
    spd: number;
    luck: number;
  };
  equippedSkills: string[];
  learnedSkills?: string[];
  /** 📖 현재 학습(연독) 진행 중인 마도서 스킬 ID 목록 (최대 4개) */
  studyingSkills?: string[];
  /** 📖 스킬 ID별 연구 습득률 (0 ~ 100%, 100% 도달 시 정식 습득) */
  skillMastery?: Record<string, number>;
  /** 습득한 스킬별 개별 레벨 (Lv.1 ~ 10, 마도서 강화 전수 결과 반영) */
  skillLevels?: Record<string, number>;
  /** 📖 장착된 마도 비전서 객체 목록 (계열 적합도 및 상세 정보 호환) */
  equippedSkillBooks?: SkillBookItem[];
  equipment: {
    weapon?: EquipmentItem;
    armor?: EquipmentItem;
    accessory?: EquipmentItem;
  };
  portraitPromptKey: string;
  /** 현재 활성화된 상태이상 목록 */
  statusEffects: StatusEffect[];
  /** 💀 사경(Death's Door) 상태 시 완전 사망까지 남은 턴 (기본 3턴) */
  deathCountdown?: number;
  /** 💀 전투 중 사망 플래그 */
  isDead?: boolean;
  /** ⚰️ 3턴 초과 또는 전멸로 인한 영구 사망 플래그 */
  isPermanentlyDead?: boolean;
}

/** 🪦 성채 묘지에 안장된 전사자 정보 */
export interface FallenHero {
  id: string;
  name: string;
  title: string;
  classId: string;
  grade: MercenaryGrade;
  level: number;
  fallenAt: number; // 전사 시점 timestamp
  fallenFloor: number; // 전사한 던전 층계
  killerName: string; // 치명타를 가한 마물 이름
  epitaph: string; // 묘비명 / 추모문구
  portraitPromptKey?: string;
  equipmentSummary: string[]; // 착용했던 무구 목록
  battlesFought?: number; // 생전 참전 횟수
  lastOfferedAt?: number; // ⚰️ 마지막으로 공물을 바친 시점 (1시간 쿨다운 체크용)
  isLocked?: boolean; // 🔒 안치 보존 잠금 (최대 3명까지 잠금, 새 유해가 들어와도 밀려나지 않음)
}

/** ⚰️ 활성화된 영령의 가호 (Ancestral Blessing) 정보 */
export interface ActiveAncestralBlessing {
  heroId: string;
  heroName: string;
  heroTitle: string;
  heroLevel: number;
  classId: string;
  grade: MercenaryGrade;
  blessingId: string;
  name: string;
  icon: string;
  description: string;
  buffs: PartySynergy['buffs'];
  activatedAt: number;
}

/** 📜 심연의 백과 및 회고록 컬렉션 항목 */
export interface CodexCollectionItem {
  id: string;
  name: string;
  icon: string;
  category: 'resource' | 'supply' | 'material' | 'armory' | 'boss_equip' | 'skillbook' | 'lore' | 'artifact';
  desc: string;
  story?: string; // 서사 일지 전문 (회고록 완성 시 열람 가능)
  requirements: {
    type: 'resource' | 'supply' | 'material' | 'equipment' | 'skillbook' | 'memoir_note' | 'ooparts' | 'cemetery_epitaph';
    key: string;
    name: string;
    icon: string;
    amount: number;
    minRarity?: 'common' | 'rare' | 'unique' | 'epic' | 'legendary';
    floor?: number;
  }[];
  bonus: {
    label: string;
    atk?: number;
    def?: number;
    hp?: number;
    mp?: number;
    spd?: number;
    luck?: number;
    critRate?: number;
    dmgReduction?: number;
    allDmgPct?: number;
    upkeepDiscountPct?: number;
    productionBonusPct?: number;
    expBonusPct?: number;
    goldBonusPct?: number;
    allStatsBonus?: number;
  };
}

export interface PartySynergy {
  id: string;
  category?: 'role' | 'formation' | 'tier' | 'special' | 'ancestral';
  name: string;
  icon: string;
  conditionText?: string;
  description: string;
  isActive?: boolean;
  buffs: {
    atkBonus?: number;
    defBonus?: number;
    spdBonus?: number;
    maxHpBonus?: number;
    hpRegenPct?: number;
    mpStartBonus?: number;
    mpRegenPerTurn?: number;
    frontlineGuardPct?: number;
    midRowEvasionBonus?: number;
    startBattleShieldPct?: number;
    startBattleShieldTurns?: number;
    lowHpExecuteBonus?: number;
    luckBonus?: number;
    critRateBonus?: number;
    critDmgBonus?: number;
    damageReductionPct?: number;
    allStatsBonus?: number;
    drainBonus?: number;
    defPenetrationBonus?: number;
    expBonus?: number;
    flatAtkBonus?: number;
    flatDefBonus?: number;
    flatSpdBonus?: number;
  };
}

export type MonsterType = 'normal' | 'elite' | 'boss';

export interface MonsterStatus {
  bleedTurns: number;
  bleedMag: number;
  stunTurns: number;
  defDebuffTurns: number;
  defDebuffMag: number;
  shieldAmount: number;
}

export interface MonsterSkill {
  id?: string;
  name: string;
  description: string;
  power: number;
  effectType?: string;
  statusDuration?: number;
  magicSchool?: MagicSchool; // 마법 계열 분류 ('elemental' | 'dark' | 'holy')
  piercePct?: number; // 방어 관통율 (0.0 ~ 1.0)
  drainPct?: number;  // 피해 흡혈율 (0.0 ~ 1.0)
  isCharge?: boolean; // 강력기 차징 여부
  breakGauge?: number; // 차징 시 파쇄에 필요한 누적 데미지
  disruptPosition?: 'knockback' | 'pull' | 'shuffle'; // 진형 붕괴
}

export type MonsterFaction = 'beast' | 'construct' | 'undead' | 'corrupted';

export const MONSTER_FACTION_META: Record<MonsterFaction, { label: string; icon: string; color: string; desc: string }> = {
  beast: { label: '마물', icon: '🐾', color: '#ff7043', desc: '야수 및 변이 괴수 계열 마물' },
  construct: { label: '구조체', icon: '⚙️', color: '#90a4ae', desc: '골렘, 석상 및 마도 기계 구조체' },
  undead: { label: '언데드', icon: '💀', color: '#ba68c8', desc: '해골, 구울, 원혼 등 언데드 사령체' },
  corrupted: { label: '타락', icon: '👁️', color: '#f06292', desc: '심연의 존재, 광신도, 타락 기사 및 악마' },
};

export interface MonsterData {
  id: string;
  name: string;
  type: MonsterType;
  faction: MonsterFaction; // 몬스터 팩션: 마물 | 구조체 | 언데드 | 타락
  level: number;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  luck: number;
  skills: MonsterSkill[];
  signatureSkillIndex?: number; // 몬스터 고유 대표 마도서 드랍 대상 스킬 인덱스 (기본: 0)
  piercePct?: number; // 몬스터 기본 방어 관통율
  drainPct?: number;  // 몬스터 기본 피해 흡혈율
  shieldBreakMult?: number; // 보호막 추가 파쇄 계수 (기본 1.0)
  rewards: {
    gold: number;
    ether: number;
    exp: number;                             // ← EXP 보상 추가
    resources?: Partial<GameResources>;
    dropEquipmentRecipeId?: string;
    dropEquipment?: EquipmentItem;
    dropSkillBookId?: string;
  };
  promptKey: string;
  imagePath: string;
  themeColor: number;
  description: string;
  imagePrompt?: string;
}

export interface EpicStoryDialogue {
  speakerName: string;
  speakerRole?: string;
  speakerAvatar?: string;
  text: string;
}

export interface EpicQuestDomainChoice {
  id: 'domain';
  title: string;
  desc: string;
  flavorChoice: string;
  rewards: {
    gold?: number;
    ether?: number;
    resources?: Partial<GameResources>;
    supplies?: { key: string; name: string; icon: string; qty: number }[];
    equipment?: EquipmentItem;
    skillBooks?: SkillBookItem[];
  };
}

export interface EpicQuestExpeditionChoice {
  id: 'expedition';
  title: string;
  desc: string;
  flavorChoice: string;
  rewards: {
    gold?: number;
    ether?: number;
    equipment?: EquipmentItem;
    skillBooks?: SkillBookItem[];
    resources?: Partial<GameResources>;
    supplies?: { key: string; name: string; icon: string; qty: number }[];
  };
}

export type EpicQuestChoice = EpicQuestDomainChoice | EpicQuestExpeditionChoice;

export interface Quest {
  id: string;
  title: string;
  type: 'main' | 'building' | 'field' | 'promotion' | 'sub' | 'repeatable' | 'epic';
  chapter: number;
  summary: string;
  flavorText: string;
  objectives: {
    description: string;
    current: number;
    required: number;
    isCompleted: boolean;
  }[];
  requiredResources?: Partial<GameResources>;
  rewards: {
    gold?: number;
    ether?: number;
    resources?: Partial<GameResources>;
    supplies?: { key: string; name: string; icon: string; qty: number }[];
    equipment?: EquipmentItem;
    skillBooks?: SkillBookItem[];
    unlockBuildingId?: BuildingId;
    unlockBuildingIds?: BuildingId[];
    unlockClassId?: string;
    unlockDungeonId?: string;
    items?: string[];
  };
  epicStory?: {
    epilogueTitle: string;
    dialogues: EpicStoryDialogue[];
    choices: [EpicQuestChoice, EpicQuestExpeditionChoice];
  };
  status: 'locked' | 'active' | 'completed';
  repeatable?: boolean;
}

export interface ArenaOpponent {
  id: string;
  name: string;
  rank: number;
  rating: number;
  defenseDeck: Mercenary[];
  guild: string;
  gateLevel?: number; // 🏰 차원 앵커 게이트 레벨
  isBot?: boolean; // 🤖 봇 상대 여부 플래그 (true면 봇, false면 실제 유저)
  isPromotion?: boolean; // 🔥 상위 티어 승급 도전 상대 여부
}

export interface LogEntry {
  id: string;
  text: string;
  type: 'normal' | 'reward' | 'danger' | 'story' | 'system' | 'bonfire0' | 'bonfire1' | 'bonfire2' | 'bonfire3' | 'bonfire4' | 'bonfire5' | 'bonfire_extend' | 'round_divider' | 'turn_divider';
  timestamp: string;
  category?: 'citadel' | 'dungeon' | 'battle';
  turn?: number;
  round?: number;
  actorName?: string;
}

// ─── 유대 & 모닥불 토크 타입 ───────────────────────────────────────────────────
export interface CampBanterResult {
  dialogues: { speakerName: string; speakerClass?: string; text: string; icon: string }[];
  bondChanges: { heroAId: string; heroBId: string; delta: number; reason: string }[];
  isFriction: boolean;
  frictionHeroName?: string;
  unlockedBuffs: string[];
}

export interface DungeonItemSlot {
  slotId: string;
  id?: string;        // slotId/key 별칭
  key: string;
  label: string;
  icon: string;
  qty: number;
  quantity?: number;  // qty 별칭
  maxStack: number;
  itemType: 'supply' | 'resource' | 'equipment' | 'skillBook';
  equipmentData?: EquipmentItem;
  skillBookData?: SkillBookItem;
}

export interface PendingLootItem {
  id: string;
  key: string;
  label: string;
  icon: string;
  qty: number;
  maxStack: number;
  itemType: 'supply' | 'resource' | 'equipment' | 'skillBook';
  equipmentData?: EquipmentItem;
  skillBookData?: SkillBookItem;
}

export interface ExpeditionReturnReport {
  floor: number;
  totalGold: number;
  items: Array<{
    key: string;
    label: string;
    icon: string;
    qty: number;
    itemType?: string;
  }>;
  equipments: EquipmentItem[];
  skillBooks?: SkillBookItem[];
  totalSlots: number;
}

// ─── 🌌 차원 네메시스 (Dimensional Nemesis) 레이드 타입 ────────────────────────
export interface NemesisMilestone {
  id: string;
  reqDamage: number;
  title: string;
  desc: string;
  icon: string;
  rewards: {
    arenaCoins?: number;
    ether?: number;
    purePrefixStone?: number;
    pureSuffixStone?: number;
    equipment?: EquipmentItem;
  };
}

export type NemesisPartId = 'head' | 'body' | 'tail';

export interface NemesisPartState {
  id: NemesisPartId;
  name: string;
  position: 'front' | 'mid' | 'back';
  currentHp: number;
  maxHp: number;
  isDefeated: boolean;
}

export interface NemesisState {
  totalDamage: number;
  highestDamage: number;
  currentBossHp: number;
  maxBossHp: number;
  phase: number;
  claimedMilestones: string[];
  dailyAttempts: number;
  lastDate: string;
  cycleStartTime?: number;       // 7일 전체 사이클 시작 타임스탬프 (ms)
  lastPlunderCheckTime?: number; // 마지막 6시간 약탈 판정 타임스탬프 (ms)
  lastHpRegenTime?: number;      // 마지막 HP 자연 회복 타임스탬프 (ms)
  windowStartHp?: number;        // 현재 6시간 윈도우 시작 시점의 보스 HP
  isDefeated?: boolean;          // 이번 사이클에서 완전 토벌되었는지 여부
  defeatedTime?: number;         // 토벌 완료 타임스탬프 (ms)
  parts?: Record<NemesisPartId, NemesisPartState>;
}

// ─── 🏰 차원 영지 침공 (Dimensional Estate Invasion) 타입 ────────────────────
export interface InvasionTarget {
  id: string;
  name: string;
  ownerNickname: string;
  gateLevel: number;
  bonfireLevel: number;
  rating: number;
  defensePower: number;
  defenseSquad: Mercenary[];
  estateResources: Partial<GameResources>;
  isShielded: boolean;
  shieldExpiresAt?: number;
  guildName?: string;
  avatarIcon?: string;
  tacticalTower?: TacticalTowerState; // 🗼 상대 영지 방어 전술 타워 상태
  isBot?: boolean; // 🤖 봇 영지 여부 플래그 (true면 봇, false면 실제 유저)
  defenseConcept?: string; // 🎯 영지 수비 방어 컨셉 (예: '철벽 방어', '화력 포격', '결빙 교란' 등)
}

export interface InvasionDefenseLog {
  id: string;
  attackerName: string;
  attackerUid?: string;
  timestamp: number;
  isVictory: boolean; // 내가 방어에 성공했는지 여부 (true = 방어 성공, false = 방어 실패 및 약탈당함)
  plunderedResource?: {
    type: ResourceType;
    amount: number;
    name: string;
    icon: string;
  };
  canRevenge: boolean;
  revenged: boolean;
  targetSquadSnapshot?: Mercenary[];
}

export interface DimensionalDeck {
  mainHeroIds: string[];       // 3인 선발 필드 전투원 ID (전열/중열/후열)
  operatorHeroId?: string;     // 1인 전술 오퍼레이터 ID (영령 가호 버프 + 피버 쇼다운 승리 시 궁극기 발동)
  leaderHeroId?: string;        // 1인 리더 영웅 ID (오퍼레이터 레거시 호환 필드)
  supporterHeroId?: string;     // 1인 서포터 영웅 ID (선택 사항)
}

export type TacticalTowerBranch = 'attack' | 'defense' | 'utility';

export interface TacticalTowerBranchState {
  tier1: number; // 0 ~ 5 (1차 테크)
  tier2: number; // 0 ~ 5 (2차 테크)
  tier3: number; // 0 ~ 5 (3차 테크)
}

export interface TacticalTowerState {
  attack: TacticalTowerBranchState;
  defense: TacticalTowerBranchState;
  utility: TacticalTowerBranchState;
}

export interface DefenseDeck {
  barrierHeroId?: string; // 🛡️ 차원 왜곡 보호막 결속 용병 ID (비공격, 체력/방어력 전량 합산)
  leftTurretHeroId?: string; // 🗼 좌측 전술 타워 탑승 사수 용병 ID (기본 공격 버프)
  rightTurretHeroId?: string; // 🗼 우측 전술 타워 탑승 사수 용병 ID (전술 스킬 버프)
  operatorHeroId: string; // 📡 수성 오퍼레이터 1인 영웅 ID
  mainHeroIds?: string[]; // 하위 호환용 (3인 ID 목록)
  leftTurretMode?: 'focus_bombard' | 'slow_field' | 'balanced'; // 좌측 타워 작전 모드 (자동포격/중력감속/균형)
  rightTurretMode?: 'barrier_regen' | 'sanctuary_heal' | 'fortress_guard'; // 우측 타워 작전 모드 (보호막수복/성역치유/철벽수호)
}

export interface InvasionState {
  squadHeroIds: string[]; // 5인 차원 부대 영웅 ID 목록 (하위 호환성)
  deck?: DimensionalDeck; // 3+1+1 차원 덱 구조
  defenseDeck?: DefenseDeck; // 🛡️ 수비 부대 및 방어 타워 세팅
  invasionCoins?: number; // 🎖️ 차원 침공 훈장 (레거시 호환)
  peaceShieldUntil: number; // 🛡️ 내 영지 평화 보호막 만료 시각 (ms)
  defenseLogs: InvasionDefenseLog[]; // 피침공 방어 기록
  totalInvasions: number; // 총 침공 횟수
  totalWins: number; // 총 침공 승리 횟수
  totalPlundered: Partial<GameResources>; // 누적 약탈 자원 총계
  lastScoutedAt: number;
  tacticalTower?: TacticalTowerState; // 🛡️ 방어 전술 타워 테크 트리
}

export interface EventCardOption {
  label: string;
  variant?: 'primary' | 'danger' | 'success' | 'ghost';
  disabled?: boolean;
  action: () => void;
}

export type EquipmentRarity = 'common' | 'rare' | 'unique' | 'epic' | 'legendary';

export interface SelectiveResetOptions {
  buildings?: boolean;   // 건물 레벨 및 해금 초기화
  resources?: boolean;   // 자원 초기화
  heroes?: boolean;      // 용병단/파티/장비/스킬북 초기화
  dungeon?: boolean;     // 던전 진행도 및 퀘스트 초기화
  cloud?: boolean;       // Firebase 클라우드 데이터 삭제
}



