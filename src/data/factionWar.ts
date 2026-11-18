export type FactionId = 'dawn' | 'arcana' | 'iron';

export interface FactionMeta {
  id: FactionId;
  name: string;
  shortName: string;
  engName: string;
  icon: string;
  color: string;
  bgGradient: string;
  borderColor: string;
  hqNodeId: string;
  slogan: string;
  passiveDesc: string;
}

export type StrongholdId =
  | 'hq_dawn'
  | 'hq_arcana'
  | 'hq_iron'
  | 'node_12'
  | 'node_2'
  | 'node_4'
  | 'node_6'
  | 'node_8'
  | 'node_10'
  | 'node_core';

export type GateDifficultyTier = 'flank_easy' | 'center_hard' | 'corridor_mid' | 'core_boss';

export interface FactionWarGateDefinition {
  id: string;
  name: string;
  fromNodeId: StrongholdId;
  toNodeId: StrongholdId;
  lineCategory: 'dawn_outpost' | 'arcana_outpost' | 'iron_outpost' | 'emerald_ring' | 'crimson_core';
  difficultyTier: GateDifficultyTier;
  difficultyStars: string;
  monsterName: string;
  monsterLevel: number;
  recommendedCp: number;
  maxHp: number;
  /** 지도상 X 좌표 (%) */
  x: number;
  /** 지도상 Y 좌표 (%) */
  y: number;
  desc: string;
}

export interface FactionWarNodeDefinition {
  id: StrongholdId;
  name: string;
  subTitle: string;
  icon: string;
  tier: 0 | 1 | 2 | 3; // 0 = 불침 본진, 1 = 전면 내곽, 2 = 접경 내곽, 3 = 중앙 아카식 코어
  isHq?: boolean;
  defaultFaction: FactionId | null;
  maxHp: number;
  maxGarrisons: number;
  pointsPerHour: number;
  buffTitle: string;
  buffDesc: string;
  /** 지도상 X 좌표 (%) */
  x: number;
  /** 지도상 Y 좌표 (%) */
  y: number;
  /** 인접한 내곽 주요 거점 목록 (교두보 2거점 연결 판정용) */
  adjacentInnerNodes: StrongholdId[];
  /** 이 거점으로 연결되는 관문 ID 목록 */
  connectedGateIds: string[];
}

export interface GarrisonSquadEntry {
  id: string;
  commanderUid: string;
  commanderName: string;
  faction: FactionId;
  combatPower: number;
  fatigue: number; // 0 ~ 6 (스택당 공방 -10%)
  defendWins: number;
  deployedAt: number;
  leaderClassId: string;
  leaderName: string;
}

export interface FactionWarNodeRuntimeState {
  id: StrongholdId;
  ownerFaction: FactionId | null;
  hp: number;
  maxHp: number;
  shieldUntil: number;
  lastCapturedBy?: string;
  garrisons: GarrisonSquadEntry[];
}

export interface FactionWarGateRuntimeState {
  id: string;
  /** 각 진영별 관문 개방 여부 (돌파율 100% 달성 시 true) */
  clearedBy: Record<FactionId, boolean>;
  /** 현재 남은 수호병 내구도 (진영 공통 또는 진영별 공략 진행도) */
  hpByFaction: Record<FactionId, number>;
  maxHp: number;
}

/** ⏳ 1시간 원정 진격 명령 정보 */
export interface MarchingOrder {
  id: string;
  targetType: 'gate' | 'node';
  targetId: string;
  targetName: string;
  startedAt: number;
  arrivesAt: number; // startedAt + 3600 * 1000 (1시간)
  heroes: Array<{ id: string; name: string; classId: string; level: number; cp: number; icon: string }>;
  isCompleted?: boolean;
}

export interface FactionWarState {
  seasonId: string;
  /** 4주 시즌 주기 (1: 배치, 2: 진격, 3: 결전, 4: 시즌 아웃) */
  currentWeek: 1 | 2 | 3 | 4;
  /** 시즌 일차 (1 ~ 28일) */
  seasonDay: number;
  playerFaction: FactionId | null;
  /** ⚔️ 차원 성좌 전쟁 전담 3인 차출 부대 용병 ID 목록 (시즌 중 변경 불가, 타 컨텐츠 출전 제한) */
  dispatchedSquadIds: string[];
  /** ⏳ 진행 중이거나 완료된 1시간 원정 명령 */
  marchingOrder: MarchingOrder | null;
  /** 👑 아카식 크라운 코어 24시간 수성 카운트다운 (최초 함락 시점 기록, 24시간 도달 시 패권 버프 부여) */
  coreHoldStartedAt: number | null;
  coreHegemonyActive: boolean;
  constellationSeals: number;
  personalContribution: number;
  siegeTokens: number;
  maxSiegeTokens: number;
  awakeningProtectionShards: number;
  scores: Record<FactionId, number>;
  rallyTargets: Record<FactionId, StrongholdId | null>;
  nodes: Record<StrongholdId, FactionWarNodeRuntimeState>;
  gates: Record<string, FactionWarGateRuntimeState>;
  battleLogs: Array<{
    id: string;
    timestamp: number;
    text: string;
    faction?: FactionId;
    isSystem?: boolean;
  }>;
}

export const FACTIONS: Record<FactionId, FactionMeta> = {
  dawn: {
    id: 'dawn',
    name: '창백한 여명회',
    shortName: '여명회',
    engName: 'Order of Pale Dawn',
    icon: '☀️',
    color: '#ffd54f',
    bgGradient: 'from-[#3a2c0f] via-[#241b08] to-[#141005]',
    borderColor: '#ffd54f',
    hqNodeId: 'hq_dawn',
    slogan: '심연을 정화하고 태양의 질서를 되찾는 성전 기사단',
    passiveDesc: '영혼의 제단 & 성소 효율 +10% · 전투 개시 시 아군 최대 HP 8% 성광 보호막',
  },
  arcana: {
    id: 'arcana',
    name: '심연 마도 학회',
    shortName: '마도학회',
    engName: 'Abyssal Arcana',
    icon: '🔮',
    color: '#e040fb',
    bgGradient: 'from-[#2e1038] via-[#1c0924] to-[#100514]',
    borderColor: '#e040fb',
    hqNodeId: 'hq_arcana',
    slogan: '금기된 심연 마도 공학과 시공 에테르를 지배하는 학파',
    passiveDesc: '아카데미 & 연금 공방 효율 +10% · 마법/원소 스킬 피해 +8% 및 초기 MP +15',
  },
  iron: {
    id: 'iron',
    name: '강철 방주 연맹',
    shortName: '강철연맹',
    engName: 'Iron Ark Coalition',
    icon: '⚙️',
    color: '#00e5ff',
    bgGradient: 'from-[#0d2b38] via-[#081b24] to-[#040f14]',
    borderColor: '#00e5ff',
    hqNodeId: 'hq_iron',
    slogan: '오직 강철의 병기와 화력만이 생존을 담보하는 중장갑 자치군',
    passiveDesc: '마도 병기창 & 광산 효율 +10% · 물리/관통 치명타 피해량 +12%',
  },
};

export const FACTION_WAR_NODES: Record<StrongholdId, FactionWarNodeDefinition> = {
  hq_dawn: {
    id: 'hq_dawn',
    name: '여명회 대성당 성소',
    subTitle: '10시 불침 성채 (창백한 여명회)',
    icon: '☀️',
    tier: 0,
    isHq: true,
    defaultFaction: 'dawn',
    maxHp: 99999,
    maxGarrisons: 99,
    pointsPerHour: 0,
    buffTitle: '불침 성채 (본진)',
    buffDesc: '창백한 여명회의 불침 성채입니다. 12시·10시·8시 3갈래 출진선이 연결되어 있습니다.',
    x: 14.5,
    y: 21.0,
    adjacentInnerNodes: ['node_12', 'node_10', 'node_8'],
    connectedGateIds: ['gate_dawn_12', 'gate_dawn_10', 'gate_dawn_8'],
  },
  hq_arcana: {
    id: 'hq_arcana',
    name: '마도 학회 부유 첨탑',
    subTitle: '2시 불침 성채 (심연 마도 학회)',
    icon: '🔮',
    tier: 0,
    isHq: true,
    defaultFaction: 'arcana',
    maxHp: 99999,
    maxGarrisons: 99,
    pointsPerHour: 0,
    buffTitle: '불침 성채 (본진)',
    buffDesc: '심연 마도 학회의 불침 성채입니다. 12시·2시·4시 3갈래 출진선이 연결되어 있습니다.',
    x: 85.5,
    y: 21.0,
    adjacentInnerNodes: ['node_12', 'node_2', 'node_4'],
    connectedGateIds: ['gate_arcana_12', 'gate_arcana_2', 'gate_arcana_4'],
  },
  hq_iron: {
    id: 'hq_iron',
    name: '강철 방주 기계 요새',
    subTitle: '6시 불침 성채 (강철 방주 연맹)',
    icon: '⚙️',
    tier: 0,
    isHq: true,
    defaultFaction: 'iron',
    maxHp: 99999,
    maxGarrisons: 99,
    pointsPerHour: 0,
    buffTitle: '불침 성채 (본진)',
    buffDesc: '강철 방주 연맹의 불침 성채입니다. 8시·6시·4시 3갈래 출진선이 연결되어 있습니다.',
    x: 50.0,
    y: 86.5,
    adjacentInnerNodes: ['node_8', 'node_6', 'node_4'],
    connectedGateIds: ['gate_iron_8', 'gate_iron_6', 'gate_iron_4'],
  },
  node_10: {
    id: 'node_10',
    name: '수정 대공동',
    subTitle: '10시 여명회 전면 거점',
    icon: '💎',
    tier: 1,
    defaultFaction: null,
    maxHp: 4000,
    maxGarrisons: 12,
    pointsPerHour: 15,
    buffTitle: '영지 4대 기초 자원 생산량 +25%',
    buffDesc: '점령 시 소속 진영 전원의 에테르·철광석·석재·목재 생산량이 실시간으로 +25% 증가합니다.',
    x: 34.2,
    y: 32.5,
    adjacentInnerNodes: ['node_12', 'node_8'],
    connectedGateIds: ['gate_dawn_10', 'gate_ring_10_12', 'gate_ring_8_10', 'gate_core_10'],
  },
  node_2: {
    id: 'node_2',
    name: '별빛 관측소',
    subTitle: '2시 마도학회 전면 거점',
    icon: '🌌',
    tier: 1,
    defaultFaction: null,
    maxHp: 4000,
    maxGarrisons: 12,
    pointsPerHour: 15,
    buffTitle: '전투 초기 MP +20 & 스킬 치명타 +8%',
    buffDesc: '점령 시 소속 진영 전원의 모든 전투 초기 MP가 +20 증가하고 스킬 치명타 확률이 +8% 상승합니다.',
    x: 65.8,
    y: 32.5,
    adjacentInnerNodes: ['node_12', 'node_4'],
    connectedGateIds: ['gate_arcana_2', 'gate_ring_12_2', 'gate_ring_2_4', 'gate_core_2'],
  },
  node_6: {
    id: 'node_6',
    name: '거신 성벽 요새',
    subTitle: '6시 강철연맹 전면 거점',
    icon: '🛡️',
    tier: 1,
    defaultFaction: null,
    maxHp: 4000,
    maxGarrisons: 12,
    pointsPerHour: 15,
    buffTitle: '아군 방어력/최대 HP +10% & 공성 타격 +20%',
    buffDesc: '점령 시 소속 진영 전원의 방어력과 최대 체력이 +10% 증가하며 거점 공성 내구도 타격량이 +20% 상승합니다.',
    x: 50.0,
    y: 63.5,
    adjacentInnerNodes: ['node_4', 'node_8'],
    connectedGateIds: ['gate_iron_6', 'gate_ring_4_6', 'gate_ring_6_8', 'gate_core_6'],
  },
  node_12: {
    id: 'node_12',
    name: '고대 아카이브',
    subTitle: '12시 여명⚔️학회 접경 거점',
    icon: '📜',
    tier: 2,
    defaultFaction: null,
    maxHp: 4500,
    maxGarrisons: 15,
    pointsPerHour: 20,
    buffTitle: '던전 전투 EXP +30% & 마도서 연독 +20%',
    buffDesc: '점령 시 소속 진영 전원의 던전 경험치 획득량이 +30% 증가하고 마도서 연독 숙련도 상승량이 +20% 증폭됩니다.',
    x: 50.0,
    y: 11.5,
    adjacentInnerNodes: ['node_10', 'node_2'],
    connectedGateIds: ['gate_dawn_12', 'gate_arcana_12', 'gate_ring_10_12', 'gate_ring_12_2', 'gate_core_12'],
  },
  node_4: {
    id: 'node_4',
    name: '화산 단조로',
    subTitle: '4시 학회⚔️강철 접경 거점',
    icon: '🔥',
    tier: 2,
    defaultFaction: null,
    maxHp: 4500,
    maxGarrisons: 15,
    pointsPerHour: 20,
    buffTitle: '병기창 단조·강화 비용 -10% 추가 할인',
    buffDesc: '점령 시 소속 진영 전원의 마도 병기창 장비 제작 및 강화 비용이 10% 추가 할인됩니다.',
    x: 68.5,
    y: 60.5,
    adjacentInnerNodes: ['node_2', 'node_6'],
    connectedGateIds: ['gate_arcana_4', 'gate_iron_4', 'gate_ring_2_4', 'gate_ring_4_6', 'gate_core_4'],
  },
  node_8: {
    id: 'node_8',
    name: '서부 무역항',
    subTitle: '8시 강철⚔️여명 접경 거점',
    icon: '⚖️',
    tier: 2,
    defaultFaction: null,
    maxHp: 4500,
    maxGarrisons: 15,
    pointsPerHour: 20,
    buffTitle: '최대 골드 한도 +10만G 확장 & 교역 보너스',
    buffDesc: '점령 시 소속 진영 전원의 최대 골드 보유 한도가 +100,000G 확장되고 암시장 수급 효율이 상승합니다.',
    x: 31.5,
    y: 60.5,
    adjacentInnerNodes: ['node_10', 'node_6'],
    connectedGateIds: ['gate_dawn_8', 'gate_iron_8', 'gate_ring_8_10', 'gate_ring_6_8', 'gate_core_8'],
  },
  node_core: {
    id: 'node_core',
    name: '아카식 크라운 코어',
    subTitle: '정중앙 전 차원 패권 성소',
    icon: '👑',
    tier: 3,
    defaultFaction: null,
    maxHp: 10000,
    maxGarrisons: 25,
    pointsPerHour: 50,
    buffTitle: '★ 장비 각성 성공 확률 +2%p 가산 & 올스탯 +5%',
    buffDesc: '점령 시 소속 진영 전원의 1~3차 장비 각성 성공 확률이 +2%p 가산(22%/12%/7%)되고 파티 올스탯이 +5% 증가합니다!',
    x: 50.0,
    y: 45.0,
    adjacentInnerNodes: ['node_12', 'node_2', 'node_4', 'node_6', 'node_8', 'node_10'],
    connectedGateIds: ['gate_core_12', 'gate_core_2', 'gate_core_4', 'gate_core_6', 'gate_core_8', 'gate_core_10'],
  },
};

export const FACTION_WAR_GATES: Record<string, FactionWarGateDefinition> = {
  // ── 1. 창백한 여명회 3갈래 출진 관문 (좌/우익 저난도 vs 중앙 고난도) ──
  gate_dawn_12: {
    id: 'gate_dawn_12',
    name: '여명 북부 접경 관문',
    fromNodeId: 'hq_dawn',
    toNodeId: 'node_12',
    lineCategory: 'dawn_outpost',
    difficultyTier: 'flank_easy',
    difficultyStars: '★☆☆ (저난도 속공)',
    monsterName: '차원 망령 정찰대',
    monsterLevel: 48,
    recommendedCp: 12000,
    maxHp: 1500,
    x: 34.8,
    y: 16.0,
    desc: '[주변부 저난도 관문] 쉽게 돌파하여 12시 고대 아카이브를 빠르게 선점할 수 있으나, 마도 학회와의 즉각적인 PvP 교전이 발생합니다.',
  },
  gate_dawn_10: {
    id: 'gate_dawn_10',
    name: '여명 중앙 직할 관문',
    fromNodeId: 'hq_dawn',
    toNodeId: 'node_10',
    lineCategory: 'dawn_outpost',
    difficultyTier: 'center_hard',
    difficultyStars: '★★★ (고난도 수호거신)',
    monsterName: '고대 철갑 수호 거신',
    monsterLevel: 70,
    recommendedCp: 32000,
    maxHp: 3500,
    x: 25.4,
    y: 30.8,
    desc: '[중앙 고난도 관문] 타 진영의 방해 없이 10시 수정 대공동에 안전하게 진입할 수 있는 대신, 강력한 PvE 철갑 거신이 버티고 있습니다.',
  },
  gate_dawn_8: {
    id: 'gate_dawn_8',
    name: '여명 서남 접경 관문',
    fromNodeId: 'hq_dawn',
    toNodeId: 'node_8',
    lineCategory: 'dawn_outpost',
    difficultyTier: 'flank_easy',
    difficultyStars: '★☆☆ (저난도 속공)',
    monsterName: '차원 망령 경비대',
    monsterLevel: 48,
    recommendedCp: 12000,
    maxHp: 1500,
    x: 24.0,
    y: 45.8,
    desc: '[주변부 저난도 관문] 빠르게 돌파하여 8시 서부 무역항을 선점할 수 있으나, 강철 방주 연맹과의 치열한 접경전이 펼쳐집니다.',
  },

  // ── 2. 심연 마도 학회 3갈래 출진 관문 (좌/우익 저난도 vs 중앙 고난도) ──
  gate_arcana_12: {
    id: 'gate_arcana_12',
    name: '학회 북부 접경 관문',
    fromNodeId: 'hq_arcana',
    toNodeId: 'node_12',
    lineCategory: 'arcana_outpost',
    difficultyTier: 'flank_easy',
    difficultyStars: '★☆☆ (저난도 속공)',
    monsterName: '차원 망령 정찰대',
    monsterLevel: 48,
    recommendedCp: 12000,
    maxHp: 1500,
    x: 65.2,
    y: 16.0,
    desc: '[주변부 저난도 관문] 쉽게 돌파하여 12시 고대 아카이브를 선점할 수 있으나, 창백한 여명회와의 즉각적인 PvP 교전이 발생합니다.',
  },
  gate_arcana_2: {
    id: 'gate_arcana_2',
    name: '학회 중앙 직할 관문',
    fromNodeId: 'hq_arcana',
    toNodeId: 'node_2',
    lineCategory: 'arcana_outpost',
    difficultyTier: 'center_hard',
    difficultyStars: '★★★ (고난도 수호거신)',
    monsterName: '고대 마도 수호 거신',
    monsterLevel: 70,
    recommendedCp: 32000,
    maxHp: 3500,
    x: 75.4,
    y: 30.5,
    desc: '[중앙 고난도 관문] 타 진영의 방해 없이 2시 별빛 관측소에 독점 진입할 수 있는 대신, 강력한 PvE 마도 거신이 길을 막고 있습니다.',
  },
  gate_arcana_4: {
    id: 'gate_arcana_4',
    name: '학회 동남 접경 관문',
    fromNodeId: 'hq_arcana',
    toNodeId: 'node_4',
    lineCategory: 'arcana_outpost',
    difficultyTier: 'flank_easy',
    difficultyStars: '★☆☆ (저난도 속공)',
    monsterName: '차원 망령 경비대',
    monsterLevel: 48,
    recommendedCp: 12000,
    maxHp: 1500,
    x: 76.4,
    y: 45.2,
    desc: '[주변부 저난도 관문] 빠르게 돌파하여 4시 화산 단조로를 선점할 수 있으나, 강철 방주 연맹과의 치열한 접경전이 펼쳐집니다.',
  },

  // ── 3. 강철 방주 연맹 3갈래 출진 관문 (좌/우익 저난도 vs 중앙 고난도) ──
  gate_iron_8: {
    id: 'gate_iron_8',
    name: '강철 서남 접경 관문',
    fromNodeId: 'hq_iron',
    toNodeId: 'node_8',
    lineCategory: 'iron_outpost',
    difficultyTier: 'flank_easy',
    difficultyStars: '★☆☆ (저난도 속공)',
    monsterName: '차원 망령 정찰대',
    monsterLevel: 48,
    recommendedCp: 12000,
    maxHp: 1500,
    x: 38.2,
    y: 74.5,
    desc: '[주변부 저난도 관문] 쉽게 돌파하여 8시 서부 무역항을 선점할 수 있으나, 창백한 여명회와의 즉각적인 PvP 교전이 발생합니다.',
  },
  gate_iron_6: {
    id: 'gate_iron_6',
    name: '강철 중앙 직할 관문',
    fromNodeId: 'hq_iron',
    toNodeId: 'node_6',
    lineCategory: 'iron_outpost',
    difficultyTier: 'center_hard',
    difficultyStars: '★★★ (고난도 수호거신)',
    monsterName: '고대 중장갑 수호 거신',
    monsterLevel: 70,
    recommendedCp: 32000,
    maxHp: 3500,
    x: 50.0,
    y: 75.5,
    desc: '[중앙 고난도 관문] 타 진영의 방해 없이 6시 거신 성벽 요새에 독점 진입할 수 있는 대신, 강력한 PvE 중장갑 거신을 돌파해야 합니다.',
  },
  gate_iron_4: {
    id: 'gate_iron_4',
    name: '강철 동남 접경 관문',
    fromNodeId: 'hq_iron',
    toNodeId: 'node_4',
    lineCategory: 'iron_outpost',
    difficultyTier: 'flank_easy',
    difficultyStars: '★☆☆ (저난도 속공)',
    monsterName: '차원 망령 경비대',
    monsterLevel: 48,
    recommendedCp: 12000,
    maxHp: 1500,
    x: 61.8,
    y: 74.5,
    desc: '[주변부 저난도 관문] 빠르게 돌파하여 4시 화산 단조로를 선점할 수 있으나, 심연 마도 학회와의 치열한 접경전이 펼쳐집니다.',
  },

  // ── 4. 에메랄드 내곽 6각 순환 회랑 관문 (6곳) ──
  gate_ring_10_12: {
    id: 'gate_ring_10_12',
    name: '북서 성좌 회랑 관문',
    fromNodeId: 'node_10',
    toNodeId: 'node_12',
    lineCategory: 'emerald_ring',
    difficultyTier: 'corridor_mid',
    difficultyStars: '★★☆ (회랑 파수꾼)',
    monsterName: '성좌 회랑 파수꾼',
    monsterLevel: 68,
    recommendedCp: 26000,
    maxHp: 2500,
    x: 41.5,
    y: 23.0,
    desc: '10시 수정 대공동과 12시 고대 아카이브를 연결하는 내곽 순환 관문입니다. 두 거점을 연결해 교두보를 구축할 수 있습니다.',
  },
  gate_ring_12_2: {
    id: 'gate_ring_12_2',
    name: '북동 성좌 회랑 관문',
    fromNodeId: 'node_12',
    toNodeId: 'node_2',
    lineCategory: 'emerald_ring',
    difficultyTier: 'corridor_mid',
    difficultyStars: '★★☆ (회랑 파수꾼)',
    monsterName: '성좌 회랑 파수꾼',
    monsterLevel: 68,
    recommendedCp: 26000,
    maxHp: 2500,
    x: 58.5,
    y: 23.0,
    desc: '12시 고대 아카이브와 2시 별빛 관측소를 연결하는 내곽 순환 관문입니다.',
  },
  gate_ring_2_4: {
    id: 'gate_ring_2_4',
    name: '동부 성좌 회랑 관문',
    fromNodeId: 'node_2',
    toNodeId: 'node_4',
    lineCategory: 'emerald_ring',
    difficultyTier: 'corridor_mid',
    difficultyStars: '★★☆ (회랑 파수꾼)',
    monsterName: '성좌 회랑 파수꾼',
    monsterLevel: 68,
    recommendedCp: 26000,
    maxHp: 2500,
    x: 67.2,
    y: 47.2,
    desc: '2시 별빛 관측소와 4시 화산 단조로를 연결하는 내곽 순환 관문입니다.',
  },
  gate_ring_4_6: {
    id: 'gate_ring_4_6',
    name: '남동 성좌 회랑 관문',
    fromNodeId: 'node_4',
    toNodeId: 'node_6',
    lineCategory: 'emerald_ring',
    difficultyTier: 'corridor_mid',
    difficultyStars: '★★☆ (회랑 파수꾼)',
    monsterName: '성좌 회랑 파수꾼',
    monsterLevel: 68,
    recommendedCp: 26000,
    maxHp: 2500,
    x: 59.0,
    y: 64.2,
    desc: '4시 화산 단조로와 6시 거신 성벽 요새를 연결하는 내곽 순환 관문입니다.',
  },
  gate_ring_6_8: {
    id: 'gate_ring_6_8',
    name: '남서 성좌 회랑 관문',
    fromNodeId: 'node_6',
    toNodeId: 'node_8',
    lineCategory: 'emerald_ring',
    difficultyTier: 'corridor_mid',
    difficultyStars: '★★☆ (회랑 파수꾼)',
    monsterName: '성좌 회랑 파수꾼',
    monsterLevel: 68,
    recommendedCp: 26000,
    maxHp: 2500,
    x: 41.0,
    y: 64.2,
    desc: '6시 거신 성벽 요새와 8시 서부 무역항을 연결하는 내곽 순환 관문입니다.',
  },
  gate_ring_8_10: {
    id: 'gate_ring_8_10',
    name: '서부 성좌 회랑 관문',
    fromNodeId: 'node_8',
    toNodeId: 'node_10',
    lineCategory: 'emerald_ring',
    difficultyTier: 'corridor_mid',
    difficultyStars: '★★☆ (회랑 파수꾼)',
    monsterName: '성좌 회랑 파수꾼',
    monsterLevel: 68,
    recommendedCp: 26000,
    maxHp: 2500,
    x: 32.8,
    y: 47.2,
    desc: '8시 서부 무역항과 10시 수정 대공동을 연결하는 내곽 순환 관문입니다.',
  },

  // ── 5. 진홍빛 아카식 왕관 수호 성문 (6곳 — 인접 2거점 확보 시에만 해금!) ──
  gate_core_12: {
    id: 'gate_core_12',
    name: '제1 왕관 수호 성문 (12시)',
    fromNodeId: 'node_12',
    toNodeId: 'node_core',
    lineCategory: 'crimson_core',
    difficultyTier: 'core_boss',
    difficultyStars: '★★★★ (왕관 수호 거신)',
    monsterName: '아카식 심판의 거신병 I',
    monsterLevel: 85,
    recommendedCp: 50000,
    maxHp: 5000,
    x: 50.0,
    y: 28.0,
    desc: '[교두보 조건 필요] 12시 고대 아카이브와 인접 거점(10시 또는 2시)을 동시에 확보해야만 성문 공략이 열립니다.',
  },
  gate_core_2: {
    id: 'gate_core_2',
    name: '제2 왕관 수호 성문 (2시)',
    fromNodeId: 'node_2',
    toNodeId: 'node_core',
    lineCategory: 'crimson_core',
    difficultyTier: 'core_boss',
    difficultyStars: '★★★★ (왕관 수호 거신)',
    monsterName: '아카식 심판의 거신병 II',
    monsterLevel: 85,
    recommendedCp: 50000,
    maxHp: 5000,
    x: 58.6,
    y: 42.2,
    desc: '[교두보 조건 필요] 2시 별빛 관측소와 인접 거점(12시 또는 4시)을 동시에 확보해야만 성문 공략이 열립니다.',
  },
  gate_core_4: {
    id: 'gate_core_4',
    name: '제3 왕관 수호 성문 (4시)',
    fromNodeId: 'node_4',
    toNodeId: 'node_core',
    lineCategory: 'crimson_core',
    difficultyTier: 'core_boss',
    difficultyStars: '★★★★ (왕관 수호 거신)',
    monsterName: '아카식 심판의 거신병 III',
    monsterLevel: 85,
    recommendedCp: 50000,
    maxHp: 5000,
    x: 59.0,
    y: 55.5,
    desc: '[교두보 조건 필요] 4시 화산 단조로와 인접 거점(2시 또는 6시)을 동시에 확보해야만 성문 공략이 열립니다.',
  },
  gate_core_6: {
    id: 'gate_core_6',
    name: '제4 왕관 수호 성문 (6시)',
    fromNodeId: 'node_6',
    toNodeId: 'node_core',
    lineCategory: 'crimson_core',
    difficultyTier: 'core_boss',
    difficultyStars: '★★★★ (왕관 수호 거신)',
    monsterName: '아카식 심판의 거신병 IV',
    monsterLevel: 85,
    recommendedCp: 50000,
    maxHp: 5000,
    x: 50.0,
    y: 54.0,
    desc: '[교두보 조건 필요] 6시 거신 성벽 요새와 인접 거점(4시 또는 8시)을 동시에 확보해야만 성문 공략이 열립니다.',
  },
  gate_core_8: {
    id: 'gate_core_8',
    name: '제5 왕관 수호 성문 (8시)',
    fromNodeId: 'node_8',
    toNodeId: 'node_core',
    lineCategory: 'crimson_core',
    difficultyTier: 'core_boss',
    difficultyStars: '★★★★ (왕관 수호 거신)',
    monsterName: '아카식 심판의 거신병 V',
    monsterLevel: 85,
    recommendedCp: 50000,
    maxHp: 5000,
    x: 41.0,
    y: 55.5,
    desc: '[교두보 조건 필요] 8시 서부 무역항과 인접 거점(6시 또는 10시)을 동시에 확보해야만 성문 공략이 열립니다.',
  },
  gate_core_10: {
    id: 'gate_core_10',
    name: '제6 왕관 수호 성문 (10시)',
    fromNodeId: 'node_10',
    toNodeId: 'node_core',
    lineCategory: 'crimson_core',
    difficultyTier: 'core_boss',
    difficultyStars: '★★★★ (왕관 수호 거신)',
    monsterName: '아카식 심판의 거신병 VI',
    monsterLevel: 85,
    recommendedCp: 50000,
    maxHp: 5000,
    x: 41.4,
    y: 42.2,
    desc: '[교두보 조건 필요] 10시 수정 대공동과 인접 거점(12시 또는 8시)을 동시에 확보해야만 성문 공략이 열립니다.',
  },
};

export interface ConstellationShopItem {
  id: string;
  name: string;
  icon: string;
  costSeals: number;
  desc: string;
  rewardType: 'protection_shard' | 'pure_prefix' | 'pure_suffix' | 'void_shard' | 'ether';
  amount: number;
}

export const CONSTELLATION_SHOP_ITEMS: ConstellationShopItem[] = [
  {
    id: 'shop_protection_shard',
    name: '불멸의 성좌 보호석 조각',
    icon: '🌟',
    costSeals: 500,
    desc: '3개 수집 시 +10강 장비 각성 실패 시 파괴를 1회 완벽 방어하는 [성좌의 가호]가 발동합니다.',
    rewardType: 'protection_shard',
    amount: 1,
  },
  {
    id: 'shop_pure_prefix',
    name: '순수 접두 마도석',
    icon: '🌟',
    costSeals: 350,
    desc: '마도 병기창에서 최상위 접두사 인챈트를 확정 부여하는 고대 결정입니다.',
    rewardType: 'pure_prefix',
    amount: 2,
  },
  {
    id: 'shop_pure_suffix',
    name: '순수 접미 마도석',
    icon: '🪐',
    costSeals: 350,
    desc: '마도 병기창에서 최상위 접미사 인챈트를 확정 부여하는 고대 결정입니다.',
    rewardType: 'pure_suffix',
    amount: 2,
  },
  {
    id: 'shop_void_shard',
    name: '공허의 파편 번들 (×5)',
    icon: '🌌',
    costSeals: 300,
    desc: '3차 초월 전직 및 신화 장비 단조에 사용되는 고밀도 공허 파편 5개를 획득합니다.',
    rewardType: 'void_shard',
    amount: 5,
  },
  {
    id: 'shop_ether_pack',
    name: '고농축 성좌 에테르 (×3,000)',
    icon: '✨',
    costSeals: 200,
    desc: '영지 증축과 연구에 즉시 사용할 수 있는 순수 에테르 3,000개를 보급받습니다.',
    rewardType: 'ether',
    amount: 3000,
  },
];

const INNER_RING_NODE_IDS: StrongholdId[] = ['node_12', 'node_2', 'node_4', 'node_6', 'node_8', 'node_10'];

/**
 * 👑 [인접 2거점 교두보 법칙 판정]
 * 특정 내곽 거점(innerNodeId)에서 중앙 [아카식 크라운 코어]로 진입할 수 있는지 검사합니다.
 * 조건: 해당 내곽 거점을 우리 진영이 점령 중이고 + 그 거점과 인접한 내곽 거점 최소 1곳도 우리 진영이 동시에 점령 중이어야 함!
 */
export function hasBridgeheadForNode(
  innerNodeId: StrongholdId,
  faction: FactionId | null,
  nodesState: Record<StrongholdId, FactionWarNodeRuntimeState>
): boolean {
  if (!faction) return false;
  const def = FACTION_WAR_NODES[innerNodeId];
  const state = nodesState[innerNodeId];
  if (!def || !state || state.ownerFaction !== faction) return false;

  return def.adjacentInnerNodes.some((adjId) => {
    if (!INNER_RING_NODE_IDS.includes(adjId)) return false;
    return nodesState[adjId]?.ownerFaction === faction;
  });
}

/**
 * 우리 진영이 중앙 [아카식 크라운 코어]에 접근 가능한 교두보(인접 2거점 이상 연결)를 최소 1쌍 이상 보유했는지 판정
 */
export function canFactionAccessAkashicCore(
  faction: FactionId | null,
  nodesState: Record<StrongholdId, FactionWarNodeRuntimeState>
): { canAccess: boolean; activeBridgeheadNodes: StrongholdId[] } {
  if (!faction) return { canAccess: false, activeBridgeheadNodes: [] };
  const activeBridgeheadNodes = INNER_RING_NODE_IDS.filter((nId) =>
    hasBridgeheadForNode(nId, faction, nodesState)
  );
  return {
    canAccess: activeBridgeheadNodes.length > 0,
    activeBridgeheadNodes,
  };
}

/**
 * 🏛️ 팩션 가입 자격 검증 함수
 * 여명회: 기사(squire 계열) or 사제(acolyte 계열) 1차 전직 이상 (tier >= 1)
 * 마도학회: 마법사(apprentice 계열) or 마총(gunner 계열) 1차 전직 이상 (tier >= 1)
 * 강철연맹: 용병검사(vanguard 계열) or 그림자(rogue 계열) 1차 전직 이상 (tier >= 1)
 */
export function canJoinFaction(
  factionId: FactionId,
  heroes: Array<{ classId: string; tier?: number }>
): { eligible: boolean; reason?: string } {
  const DAWN_CLASSES = ['paladin', 'guardian', 'aegis_valkyrie', 'fortress', 'aegis_bastion', 'cleric', 'battle_priest', 'high_saintess', 'crusader_lord', 'seraphic_inquisitor'];
  const ARCANA_CLASSES = ['elementalist', 'arcanist', 'archmage', 'chronomancer', 'chrono_archon', 'gun_meister', 'sniper', 'ghost_sniper', 'omega_deadeye'];
  const IRON_CLASSES = ['berserker', 'tactician', 'valhalla_blade', 'iron_marshal', 'valhalla_warlord', 'assassin', 'duelist', 'shadow_phantom', 'blade_dancer', 'void_strider'];

  if (factionId === 'dawn') {
    const hasHero = heroes.some(h => DAWN_CLASSES.includes(h.classId) || ((h.classId.includes('squire') || h.classId.includes('acolyte')) && (h.tier || 0) >= 1));
    return hasHero
      ? { eligible: true }
      : { eligible: false, reason: '기사 또는 사제 클래스의 1차 전직 이상 용병이 부대에 최소 1명 포함되어야 합니다.' };
  }
  if (factionId === 'arcana') {
    const hasHero = heroes.some(h => ARCANA_CLASSES.includes(h.classId) || ((h.classId.includes('apprentice') || h.classId.includes('gunner')) && (h.tier || 0) >= 1));
    return hasHero
      ? { eligible: true }
      : { eligible: false, reason: '마법사 또는 마총 클래스의 1차 전직 이상 용병이 부대에 최소 1명 포함되어야 합니다.' };
  }
  if (factionId === 'iron') {
    const hasHero = heroes.some(h => IRON_CLASSES.includes(h.classId) || ((h.classId.includes('vanguard') || h.classId.includes('rogue')) && (h.tier || 0) >= 1));
    return hasHero
      ? { eligible: true }
      : { eligible: false, reason: '용병 검사 또는 그림자 클래스의 1차 전직 이상 용병이 부대에 최소 1명 포함되어야 합니다.' };
  }
  return { eligible: true };
}

/**
 * 초기 기본 성좌 전쟁 상태 생성기
 */
export function createInitialFactionWarState(): FactionWarState {
  const nodes = {} as Record<StrongholdId, FactionWarNodeRuntimeState>;
  (Object.keys(FACTION_WAR_NODES) as StrongholdId[]).forEach((id) => {
    const def = FACTION_WAR_NODES[id];
    nodes[id] = {
      id,
      ownerFaction: def.defaultFaction,
      hp: def.maxHp,
      maxHp: def.maxHp,
      shieldUntil: 0,
      garrisons: [],
    };
  });

  const gates: Record<string, FactionWarGateRuntimeState> = {};
  Object.keys(FACTION_WAR_GATES).forEach((gId) => {
    const gDef = FACTION_WAR_GATES[gId];
    gates[gId] = {
      id: gId,
      clearedBy: { dawn: false, arcana: false, iron: false },
      hpByFaction: { dawn: gDef.maxHp, arcana: gDef.maxHp, iron: gDef.maxHp },
      maxHp: gDef.maxHp,
    };
  });

  return {
    seasonId: '2026_S1',
    currentWeek: 2, // 기본 2주차(진격기)로 활성화하여 테스트 가능하도록 설정
    seasonDay: 8,
    playerFaction: 'dawn',
    dispatchedSquadIds: [],
    marchingOrder: null,
    coreHoldStartedAt: null,
    coreHegemonyActive: false,
    constellationSeals: 1500,
    personalContribution: 0,
    siegeTokens: 10,
    maxSiegeTokens: 10,
    awakeningProtectionShards: 0,
    scores: {
      dawn: 1250,
      arcana: 1180,
      iron: 1210,
    },
    rallyTargets: {
      dawn: 'node_12',
      arcana: 'node_12',
      iron: 'node_6',
    },
    nodes,
    gates,
    battleLogs: [
      {
        id: 'init_1',
        timestamp: Date.now() - 60000,
        text: '🌌 [차원 성좌 전쟁] 시즌이 개막했습니다! 본진 3갈래 관문을 개척하고 인접 2개 거점 교두보를 확보해 [👑 아카식 크라운 코어]를 점령하십시오!',
        isSystem: true,
      },
    ],
  };
}
