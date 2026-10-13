import { EquipmentItem, NemesisMilestone } from '../types/game';
import { recalculateEquipmentStats } from './equipment';

export interface NemesisBossSkill {
  id: string;
  name: string;
  desc: string;
  power: number;
  target: 'single' | 'front' | 'all';
  effectType?: 'damage' | 'debuff' | 'drain';
  icon: string;
}

export interface NemesisBossConfig {
  id: string;
  name: string;
  title: string;
  maxHp: number;
  atk: number;
  def: number;
  spd: number;
  luck: number;
  image: string;
  phases: {
    phase: number;
    name: string;
    threshold: number;
    desc: string;
    badgeColor: string;
  }[];
  skills: NemesisBossSkill[];
}

export const NEMESIS_BOSS_CONFIG: NemesisBossConfig = {
  id: 'boss_chronos_nemesis',
  name: '시공의 침식자, 네메시스',
  title: '차원의 균열을 뚫고 강림한 파멸의 화신',
  maxHp: 30000000,
  atk: 95,
  def: 45,
  spd: 14,
  luck: 28,
  image: 'assets/void_overlord.jpg',
  phases: [
    {
      phase: 1,
      name: 'Phase 1: 차원의 균열 (Dimensional Rift)',
      threshold: 1.0,
      desc: '시공간의 균열을 열어 불안정한 중력 파동을 아군에게 방출합니다.',
      badgeColor: '#00d2ff',
    },
    {
      phase: 2,
      name: 'Phase 2: 시공 붕괴 (Spacetime Collapse)',
      threshold: 0.7,
      desc: '공간이 붕괴하며 아군 전체를 집어삼키는 공허의 폭풍이 몰아칩니다.',
      badgeColor: '#ce93d8',
    },
    {
      phase: 3,
      name: 'Phase 3: 네메시스 각성 (Cataclysm Countdown)',
      threshold: 0.3,
      desc: '모든 차원을 단숨에 소멸시킬 절대 절멸기를 충전하기 시작합니다!',
      badgeColor: '#ff416c',
    },
  ],
  skills: [
    {
      id: 'nemesis_rift_strike',
      name: '시공의 균열타',
      desc: '단일 대상에게 130% 물리/암흑 관통 피해',
      power: 1.3,
      target: 'single',
      icon: '⚡',
    },
    {
      id: 'nemesis_gravity_wave',
      name: '중력 왜곡파',
      desc: '전열/중열 아군에게 115% 암흑 피해',
      power: 1.15,
      target: 'front',
      icon: '🌀',
    },
    {
      id: 'nemesis_void_tempest',
      name: '공허의 폭풍',
      desc: '아군 전체에게 140% 마법 피해 및 마나 15 강탈',
      power: 1.4,
      target: 'all',
      effectType: 'drain',
      icon: '🌌',
    },
    {
      id: 'nemesis_cataclysm',
      name: '차원 소멸선 (Cataclysm)',
      desc: '3턴 충전 후 아군 전체에게 350% 궤멸적 전멸 피해!',
      power: 3.5,
      target: 'all',
      icon: '💥',
    },
  ],
};

/**
 * 🎖️ 네메시스 전용 장비 생성 헬퍼
 */
export function createNemesisRewardEquipment(tier: 'pendant' | 'core' | 'crown'): EquipmentItem {
  if (tier === 'pendant') {
    const raw: EquipmentItem = {
      id: `equip_nemesis_pendant_${Date.now()}`,
      name: '[시공의] 왜곡 펜던트 (+3)',
      baseName: '왜곡 펜던트',
      slot: 'accessory',
      level: 3,
      rarity: 'rare',
      baseStats: { atk: 14, def: 10, spd: 5, luck: 8, hp: 80 },
      stats: { atk: 14, def: 10, spd: 5, luck: 8, hp: 80 },
      prefix: {
        id: 'pre_nemesis_spacetime',
        name: '시공의',
        type: 'prefix',
        rarity: 'rare',
        stats: { atk: 10, luck: 6 },
        description: '공격력 +10, 행운 +6',
      },
      description: '차원 네메시스의 시공간 균열 에너지를 정제하여 제작된 강력한 희귀 목걸이.',
      icon: '📿',
    };
    raw.stats = recalculateEquipmentStats(raw, 3);
    return raw;
  } else if (tier === 'core') {
    const raw: EquipmentItem = {
      id: `equip_nemesis_core_${Date.now()}`,
      name: '[파멸의] 네메시스 종말 성핵 (+5) [차원]',
      baseName: '네메시스 종말 성핵',
      slot: 'accessory',
      level: 5,
      rarity: 'epic',
      baseStats: { atk: 28, def: 22, spd: 8, luck: 14, hp: 180, mp: 60 },
      stats: { atk: 28, def: 22, spd: 8, luck: 14, hp: 180, mp: 60 },
      prefix: {
        id: 'pre_nemesis_ruin',
        name: '파멸의',
        type: 'prefix',
        rarity: 'epic',
        stats: { atk: 20, mp: 40 },
        description: '공격력 +20, 마나 +40',
      },
      suffix: {
        id: 'suf_nemesis_dimension',
        name: '차원',
        type: 'suffix',
        rarity: 'epic',
        stats: { def: 16, hp: 100, luck: 8 },
        description: '방어력 +16, HP +100, 행운 +8',
      },
      description: '네메시스의 심장에서 추출한 에테르 성핵. 차원 왜곡 방벽과 파괴력을 동시에 제공합니다.',
      icon: '👑',
    };
    raw.stats = recalculateEquipmentStats(raw, 5);
    return raw;
  } else {
    const raw: EquipmentItem = {
      id: `equip_nemesis_crown_${Date.now()}`,
      name: '[절대의] 패왕 네메시스 파멸 관 (+7) [종결]',
      baseName: '패왕 네메시스 파멸 관',
      slot: 'accessory',
      level: 7,
      rarity: 'legendary',
      baseStats: { atk: 45, def: 38, spd: 12, luck: 22, hp: 320, mp: 100 },
      stats: { atk: 45, def: 38, spd: 12, luck: 22, hp: 320, mp: 100 },
      prefix: {
        id: 'pre_nemesis_absolute',
        name: '절대의',
        type: 'prefix',
        rarity: 'legendary',
        stats: { atk: 35, luck: 15 },
        description: '공격력 +35, 행운 +15',
      },
      suffix: {
        id: 'suf_nemesis_terminus',
        name: '종결',
        type: 'suffix',
        rarity: 'legendary',
        stats: { def: 25, hp: 180, spd: 5 },
        description: '방어력 +25, HP +180, 속도 +5',
      },
      description: '차원 네메시스를 무릎 꿇린 불세출의 지휘관에게만 주어지는 전설의 파멸 성관.',
      icon: '🌌',
    };
    raw.stats = recalculateEquipmentStats(raw, 7);
    return raw;
  }
}

/**
 * 🏆 누적 피해량 마일스톤 보상 6단계
 */
export const NEMESIS_MILESTONES: NemesisMilestone[] = [
  {
    id: 'nemesis_ms_1',
    reqDamage: 50000,
    title: '1단계: 차원의 균열 타격자',
    desc: '누적 5만 피해 달성 — 투사의 인장 150개 + 에테르 60개',
    icon: '📦',
    rewards: {
      arenaCoins: 150,
      ether: 60,
    },
  },
  {
    id: 'nemesis_ms_2',
    reqDamage: 150000,
    title: '2단계: 시공의 균열 분쇄자',
    desc: '누적 15만 피해 달성 — 투사의 인장 350개 + 순수 접두 마도석 2개',
    icon: '🎁',
    rewards: {
      arenaCoins: 350,
      purePrefixStone: 2,
    },
  },
  {
    id: 'nemesis_ms_3',
    reqDamage: 350000,
    title: '3단계: 차원의 왜곡 억제자',
    desc: '누적 35만 피해 달성 — 희귀 [시공의 왜곡 펜던트 (+3)] + 인장 600개',
    icon: '📿',
    rewards: {
      arenaCoins: 600,
      equipment: createNemesisRewardEquipment('pendant'),
    },
  },
  {
    id: 'nemesis_ms_4',
    reqDamage: 750000,
    title: '4단계: 공허의 폭풍 파쇄자',
    desc: '누적 75만 피해 달성 — 투사의 인장 900개 + 순수 접미 마도석 3개',
    icon: '💎',
    rewards: {
      arenaCoins: 900,
      pureSuffixStone: 3,
    },
  },
  {
    id: 'nemesis_ms_5',
    reqDamage: 1500000,
    title: '5단계: 시공의 심판관',
    desc: '누적 150만 피해 달성 — 에픽 [네메시스 종말 성핵 (+5)] + 인장 1,500개',
    icon: '👑',
    rewards: {
      arenaCoins: 1500,
      equipment: createNemesisRewardEquipment('core'),
    },
  },
  {
    id: 'nemesis_ms_6',
    reqDamage: 3000000,
    title: '6단계: 차원의 절대 지배자',
    desc: '누적 300만 피해 달성 — 전설 [패왕 네메시스 파멸 관 (+7)] + 인장 3,000개',
    icon: '🌌',
    rewards: {
      arenaCoins: 3000,
      equipment: createNemesisRewardEquipment('crown'),
    },
  },
];

/**
 * 📊 시뮬레이션 토벌 랭킹
 */
export interface NemesisLeaderboardEntry {
  rank: number;
  name: string;
  guild: string;
  damage: number;
  badge: string;
}

export const NEMESIS_LEADERBOARD_MOCK: NemesisLeaderboardEntry[] = [
  { rank: 1, name: '흑야의 성자', guild: '발할라 기사단', damage: 4280000, badge: '👑' },
  { rank: 2, name: '차원 방랑자 에단', guild: '그림자 여단', damage: 3650000, badge: '💎' },
  { rank: 3, name: '철혈의 세이라', guild: '붉은 창끝 길드', damage: 3120000, badge: '💠' },
  { rank: 4, name: '아케인 마스터', guild: '비전의 탑', damage: 2740000, badge: '⚔️' },
  { rank: 5, name: '발키리의 인도자', guild: '빛의 방주', damage: 2390000, badge: '🏆' },
  { rank: 6, name: '폭풍의 저격수', guild: '에테르 기동대', damage: 1980000, badge: '🛡️' },
  { rank: 7, name: '성기사 올리버', guild: '은빛 수호단', damage: 1620000, badge: '🛡️' },
  { rank: 8, name: '섀도우 블레이드', guild: '어둠의 장막', damage: 1350000, badge: '🛡️' },
  { rank: 9, name: '루미나스', guild: '새벽의 눈동자', damage: 1110000, badge: '🛡️' },
  { rank: 10, name: '크림슨 타이탄', guild: '불사조 용병단', damage: 920000, badge: '🛡️' },
];

/**
 * 🌌 시공 침식 네메시스 활동 주기 및 약탈 상수
 */
export const NEMESIS_CYCLE_CONSTANTS = {
  ACTIVE_DURATION_MS: 6 * 24 * 60 * 60 * 1000,    // 6일 활동 기간 (518,400,000 ms)
  RESPAWN_DURATION_MS: 1 * 24 * 60 * 60 * 1000,   // 1일 재소환 대기 기간 (86,400,000 ms)
  TOTAL_CYCLE_MS: 7 * 24 * 60 * 60 * 1000,        // 7일 전체 사이클 (604,800,000 ms)
  PLUNDER_INTERVAL_MS: 6 * 60 * 60 * 1000,        // 6시간 약탈 주기 (21,600,000 ms)
  PLUNDER_RATE: 0.20,                             // 약탈 비율 (전 자원의 20%)
  HP_REGEN_PER_MINUTE_RATE: 0.0005,               // 분당 0.05% 체력 자연 회복
  REQUIRED_DAMAGE_RATIO: 1 / 24,                  // 6시간당 24분의 1 (≈ 4.1667%)
};

