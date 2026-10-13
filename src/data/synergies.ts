import { Mercenary, PartySynergy } from '../types/game';
import { CHARACTER_CLASSES } from './classes';

export interface PartySynergyDefinition {
  id: string;
  category: 'role' | 'formation' | 'tier' | 'special';
  name: string;
  icon: string;
  conditionText: string;
  description: string;
  buffs: PartySynergy['buffs'];
  check: (party: Mercenary[]) => boolean;
}

export const ALL_PARTY_SYNERGIES: PartySynergyDefinition[] = [
  // =========================================================================
  // 1. 역할군 조합 시너지 (Role Combinations)
  // =========================================================================
  {
    id: 'syn_trinity',
    category: 'role',
    name: '삼위일체 밸런스',
    icon: '⚖️',
    conditionText: '탱커 1 + 딜러 1 + 서포터 1 (역할군 균형)',
    description: '전열 탱커, 중앙 딜러, 후방 지원의 완벽한 조화: 전원 모든 스탯 +6%, 매 턴 체력 2% 재생 및 마나 4 MP 회복',
    buffs: { allStatsBonus: 1.06, hpRegenPct: 0.02, mpRegenPerTurn: 4 },
    check: (party) => {
      if (party.length < 3) return false;
      const roles = party.map(h => CHARACTER_CLASSES[h.classId]?.role || 'tank');
      const hasTank = roles.includes('tank');
      const hasDealer = roles.includes('dealer_phy') || roles.includes('berserker') || roles.includes('dealer_mag');
      const hasSupport = roles.includes('healer') || roles.includes('gunner');
      return hasTank && hasDealer && hasSupport;
    }
  },
  {
    id: 'syn_citadel_monoclass',
    category: 'role',
    name: '난공불락의 불멸성채',
    icon: '🏰',
    conditionText: '탱커 3인 (순수 수호대)',
    description: '극단적 수호 방벽: 파티 방어력 +30%, 최대 체력 +15%, 받는 피해 12% 감소, 전열의 후열 엄호 30%',
    buffs: { defBonus: 1.30, maxHpBonus: 1.15, damageReductionPct: 0.12, frontlineGuardPct: 0.30 },
    check: (party) => {
      if (party.length < 3) return false;
      return party.every(h => CHARACTER_CLASSES[h.classId]?.role === 'tank');
    }
  },
  {
    id: 'syn_iron_wall',
    category: 'role',
    name: '강철의 철벽 방진',
    icon: '🛡️',
    conditionText: '탱커 2인',
    description: '중장갑 전선 구축: 파티 방어력 +18%, 받는 피해 8% 경감, 전열의 후열 엄호 20%',
    buffs: { defBonus: 1.18, damageReductionPct: 0.08, frontlineGuardPct: 0.20 },
    check: (party) => {
      if (party.length < 2) return false;
      const count = party.filter(h => CHARACTER_CLASSES[h.classId]?.role === 'tank').length;
      return count === 2;
    }
  },
  {
    id: 'syn_arcane_calamity',
    category: 'role',
    name: '대파멸 비전 의식',
    icon: '🌌',
    conditionText: '마법 딜러 3인 (순수 비전 학회)',
    description: '전장을 뒤흔드는 원소 폭풍: 공격력 +25%, 행운 +12, 방어 관통 +18%, 턴당 마나 8 MP 재생 (방어력 -8%)',
    buffs: { atkBonus: 1.25, luckBonus: 12, defPenetrationBonus: 18, defBonus: 0.92, mpRegenPerTurn: 8 },
    check: (party) => {
      if (party.length < 3) return false;
      return party.every(h => CHARACTER_CLASSES[h.classId]?.role === 'dealer_mag');
    }
  },
  {
    id: 'syn_arcane',
    category: 'role',
    name: '마도 폭주 결사단',
    icon: '🔮',
    conditionText: '마법 딜러 2인',
    description: '공명하는 에테르 에너지: 공격력 +12%, 방어 관통 +10%, 턴당 마나 4 MP 재생',
    buffs: { atkBonus: 1.12, defPenetrationBonus: 10, mpRegenPerTurn: 4 },
    check: (party) => {
      if (party.length < 2) return false;
      const count = party.filter(h => CHARACTER_CLASSES[h.classId]?.role === 'dealer_mag').length;
      return count === 2;
    }
  },
  {
    id: 'syn_orbital_annihilation',
    category: 'role',
    name: '융단 폭격 섬멸전',
    icon: '🛰️',
    conditionText: '마총사(거너) 3인 (순수 저격 여단)',
    description: '초고속 화망과 저격: 속도 +20%, 행운 +18, 치명타 피해 +25%, 중열 회피율 +15%',
    buffs: { spdBonus: 1.20, luckBonus: 18, critDmgBonus: 0.25, midRowEvasionBonus: 0.15 },
    check: (party) => {
      if (party.length < 3) return false;
      return party.every(h => CHARACTER_CLASSES[h.classId]?.role === 'gunner');
    }
  },
  {
    id: 'syn_bullet_hell',
    category: 'role',
    name: '전탄 일제 사격',
    icon: '🔫',
    conditionText: '마총사(거너) 2인',
    description: '교차 화력 지원: 속도 +12%, 공격력 +8%, 행운 +9',
    buffs: { spdBonus: 1.12, atkBonus: 1.08, luckBonus: 9 },
    check: (party) => {
      if (party.length < 2) return false;
      const count = party.filter(h => CHARACTER_CLASSES[h.classId]?.role === 'gunner').length;
      return count === 2;
    }
  },
  {
    id: 'syn_slaughter_legion',
    category: 'role',
    name: '무간 피의 도살군단',
    icon: '😈',
    conditionText: '광전사 3인 (순수 버서커)',
    description: '광란의 피의 소용돌이: 공격력 +22%, 흡혈 +15%, 치명타 피해 +20%, 빈사 적 처형 피해 +25% (방어력 -5%)',
    buffs: { atkBonus: 1.22, drainBonus: 15, critDmgBonus: 0.20, defBonus: 0.95, lowHpExecuteBonus: 0.25 },
    check: (party) => {
      if (party.length < 3) return false;
      return party.every(h => CHARACTER_CLASSES[h.classId]?.role === 'berserker');
    }
  },
  {
    id: 'syn_bloodlust',
    category: 'role',
    name: '광기의 피의 축제',
    icon: '🩸',
    conditionText: '광전사 2인',
    description: '혈기 넘치는 돌진: 공격력 +10%, 흡혈 +10%, 빈사 적 처형 피해 +15%',
    buffs: { atkBonus: 1.10, drainBonus: 10, lowHpExecuteBonus: 0.15 },
    check: (party) => {
      if (party.length < 2) return false;
      const count = party.filter(h => CHARACTER_CLASSES[h.classId]?.role === 'berserker').length;
      return count === 2;
    }
  },
  {
    id: 'syn_phantom_decapitation',
    category: 'role',
    name: '절대 암살 참수단',
    icon: '⚡',
    conditionText: '물리 딜러 3인 (순수 암살/도적)',
    description: '심장을 꿰뚫는 일격: 행운 +20, 치명타 피해 +35%, 방어 관통 +12%, 중열 회피율 +20%',
    buffs: { luckBonus: 20, critDmgBonus: 0.35, defPenetrationBonus: 12, midRowEvasionBonus: 0.20 },
    check: (party) => {
      if (party.length < 3) return false;
      return party.every(h => CHARACTER_CLASSES[h.classId]?.role === 'dealer_phy');
    }
  },
  {
    id: 'syn_rearguard',
    category: 'role',
    name: '그림자 암살 연대',
    icon: '🥷',
    conditionText: '물리 딜러 2인',
    description: '급소 노림수: 행운 +12, 치명타 피해 +18%, 속도 +8%, 중열 회피율 +10%',
    buffs: { luckBonus: 12, critDmgBonus: 0.18, spdBonus: 1.08, midRowEvasionBonus: 0.10 },
    check: (party) => {
      if (party.length < 2) return false;
      const count = party.filter(h => CHARACTER_CLASSES[h.classId]?.role === 'dealer_phy').length;
      return count === 2;
    }
  },
  {
    id: 'syn_eternal_resurrection',
    category: 'role',
    name: '불멸의 성역 결계',
    icon: '🕊️',
    conditionText: '힐러 3인 (순수 성직자)',
    description: '신성한 생명의 성역: 최대 체력 +22%, 턴당 체력 7% 재생, 피해 감소 10%, 전투 개시 시 최대 HP 20% 보호막',
    buffs: { maxHpBonus: 1.22, hpRegenPct: 0.07, damageReductionPct: 0.10, startBattleShieldPct: 0.20 },
    check: (party) => {
      if (party.length < 3) return false;
      return party.every(h => CHARACTER_CLASSES[h.classId]?.role === 'healer');
    }
  },
  {
    id: 'syn_nature_ward',
    category: 'role',
    name: '성스러운 구원의 빛',
    icon: '🌿',
    conditionText: '힐러 2인',
    description: '성자의 기도: 최대 체력 +12%, 턴당 체력 4% 자동 회복, 전투 개시 시 10% 보호막',
    buffs: { maxHpBonus: 1.12, hpRegenPct: 0.04, startBattleShieldPct: 0.10 },
    check: (party) => {
      if (party.length < 2) return false;
      const count = party.filter(h => CHARACTER_CLASSES[h.classId]?.role === 'healer').length;
      return count === 2;
    }
  },
  {
    id: 'syn_holy',
    category: 'role',
    name: '신성 성기사단',
    icon: '🛡️✨',
    conditionText: '탱커 + 힐러 조합',
    description: '빛의 가호: 받는 피해 6% 감소, 턴당 체력 3% 재생, 방어력 +8%, 전열의 후열 엄호 15%',
    buffs: { damageReductionPct: 0.06, hpRegenPct: 0.03, defBonus: 1.08, frontlineGuardPct: 0.15 },
    check: (party) => {
      const roles = party.map(h => CHARACTER_CLASSES[h.classId]?.role);
      return roles.includes('tank') && roles.includes('healer');
    }
  },
  {
    id: 'syn_magitek',
    category: 'role',
    name: '마도 중화기 공학',
    icon: '⚙️',
    conditionText: '마법 딜러 + 거너 조합',
    description: '에테르 에너지 탄환: 공격력 +10%, 방어 관통 +10%, 행운 +8, 턴당 마나 3 MP 재생',
    buffs: { atkBonus: 1.10, defPenetrationBonus: 10, luckBonus: 8, mpRegenPerTurn: 3 },
    check: (party) => {
      const roles = party.map(h => CHARACTER_CLASSES[h.classId]?.role);
      return roles.includes('dealer_mag') && roles.includes('gunner');
    }
  },
  {
    id: 'syn_shadow_blood',
    category: 'role',
    name: '암영 광풍 연격단',
    icon: '🗡️🩸',
    conditionText: '물리 딜러 + 광전사 조합',
    description: '무자비한 처형: 치명타 피해 +18%, 공격력 +8%, 흡혈 +5%, 빈사 적 처형 피해 +15%',
    buffs: { critDmgBonus: 0.18, atkBonus: 1.08, drainBonus: 5, lowHpExecuteBonus: 0.15 },
    check: (party) => {
      const roles = party.map(h => CHARACTER_CLASSES[h.classId]?.role);
      return roles.includes('dealer_phy') && roles.includes('berserker');
    }
  },
  {
    id: 'syn_vanguard',
    category: 'role',
    name: '철혈의 돌격 선봉',
    icon: '⚔️🛡️',
    conditionText: '탱커 + 광전사 조합',
    description: '선두 파쇄 진격: 공격력 +9%, 방어력 +11%, 전열의 후열 엄호 15%',
    buffs: { atkBonus: 1.09, defBonus: 1.11, frontlineGuardPct: 0.15 },
    check: (party) => {
      const roles = party.map(h => CHARACTER_CLASSES[h.classId]?.role);
      return roles.includes('tank') && roles.includes('berserker');
    }
  },
  {
    id: 'syn_aegis_sniper',
    category: 'role',
    name: '성전의 저격 지원',
    icon: '🎯🛡️',
    conditionText: '탱커 + 거너 조합',
    description: '엄호 사격 연계: 방어력 +8%, 행운 +9, 속도 +5%, 전열의 후열 엄호 15%',
    buffs: { defBonus: 1.08, luckBonus: 9, spdBonus: 1.05, frontlineGuardPct: 0.15 },
    check: (party) => {
      const roles = party.map(h => CHARACTER_CLASSES[h.classId]?.role);
      return roles.includes('tank') && roles.includes('gunner');
    }
  },
  {
    id: 'syn_arcane_sanctum',
    category: 'role',
    name: '마도 성역 수호',
    icon: '🔮💖',
    conditionText: '마법 딜러 + 힐러 조합',
    description: '축복받은 마나 샘: 공격력 +10%, 최대 체력 +8%, 턴당 체력 2% 회복, 턴당 마나 4 MP 재생',
    buffs: { atkBonus: 1.10, maxHpBonus: 1.08, hpRegenPct: 0.02, mpRegenPerTurn: 4 },
    check: (party) => {
      const roles = party.map(h => CHARACTER_CLASSES[h.classId]?.role);
      return roles.includes('dealer_mag') && roles.includes('healer');
    }
  },
  {
    id: 'syn_holy_inquisitor',
    category: 'role',
    name: '그림자 성전단',
    icon: '🗡️✨',
    conditionText: '물리 딜러 + 힐러 조합',
    description: '이단 심문관: 행운 +9, 모든 스탯 +4%, 턴당 체력 2% 회복',
    buffs: { luckBonus: 9, allStatsBonus: 1.04, hpRegenPct: 0.02 },
    check: (party) => {
      const roles = party.map(h => CHARACTER_CLASSES[h.classId]?.role);
      return roles.includes('dealer_phy') && roles.includes('healer');
    }
  },
  {
    id: 'syn_heavy_artillery',
    category: 'role',
    name: '전천후 초토화 폭격',
    icon: '🔥🔫',
    conditionText: '광전사 + 거너 조합',
    description: '전방위 파괴 공격: 공격력 +12%, 치명타 피해 +15%, 속도 +8%',
    buffs: { atkBonus: 1.12, critDmgBonus: 0.15, spdBonus: 1.08 },
    check: (party) => {
      const roles = party.map(h => CHARACTER_CLASSES[h.classId]?.role);
      return roles.includes('berserker') && roles.includes('gunner');
    }
  },
  {
    id: 'syn_spellblade',
    category: 'role',
    name: '비전 암살 결사',
    icon: '🔮🗡️',
    conditionText: '마법 딜러 + 물리 딜러 조합',
    description: '마도 물리 융합 타격: 공격력 +10%, 행운 +9, 방어 관통 +8%, 턴당 마나 2 MP 재생',
    buffs: { atkBonus: 1.10, luckBonus: 9, defPenetrationBonus: 8, mpRegenPerTurn: 2 },
    check: (party) => {
      const roles = party.map(h => CHARACTER_CLASSES[h.classId]?.role);
      return roles.includes('dealer_mag') && roles.includes('dealer_phy');
    }
  },

  // =========================================================================
  // 2. 진형 배치 시너지 (Formation Synergies)
  // =========================================================================
  {
    id: 'syn_formation_delta',
    category: 'formation',
    name: '표준 삼각 편대',
    icon: '📐',
    conditionText: '전열 1명 + 중열 1명 + 후열 1명 (균등 배치)',
    description: '이상적인 전술 삼각 배치: 모든 스탯 +4%, 속도 +5%, 중열 회피율 +15%, 전열의 후열 엄호 15%',
    buffs: { allStatsBonus: 1.04, spdBonus: 1.05, midRowEvasionBonus: 0.15, frontlineGuardPct: 0.15 },
    check: (party) => {
      if (party.length < 3) return false;
      const positions = party.map(h => h.position || 'mid');
      return positions.includes('front') && positions.includes('mid') && positions.includes('back');
    }
  },
  {
    id: 'syn_formation_vanguard',
    category: 'formation',
    name: '돌격 배수진',
    icon: '🚩',
    conditionText: '전열 2명 이상 전진 배치',
    description: '선봉 압박 전술: 파티 공격력 +6%, 방어력 +8%, 전열의 후열 엄호 20%, 전투 개시 시 15% 보호막 (전투 첫 턴 한정)',
    buffs: { atkBonus: 1.06, defBonus: 1.08, frontlineGuardPct: 0.20, startBattleShieldPct: 0.15, startBattleShieldTurns: 1 },
    check: (party) => {
      if (party.length < 2) return false;
      const frontCount = party.filter(h => (h.position || 'mid') === 'front').length;
      return frontCount >= 2;
    }
  },
  {
    id: 'syn_formation_siege',
    category: 'formation',
    name: '후방 집중 화망',
    icon: '🎯',
    conditionText: '후열 2명 이상 후방 배치',
    description: '원거리 화력 집중: 파티 공격력 +9%, 행운 +8, 턴당 마나 5 MP 재생',
    buffs: { atkBonus: 1.09, luckBonus: 8, mpRegenPerTurn: 5 },
    check: (party) => {
      if (party.length < 2) return false;
      const backCount = party.filter(h => (h.position || 'mid') === 'back').length;
      return backCount >= 2;
    }
  },
  {
    id: 'syn_formation_skirmish',
    category: 'formation',
    name: '신속 유격 진형',
    icon: '⚡',
    conditionText: '중열 2명 이상 유격 배치',
    description: '기동 게릴라 전술: 행동 속도 +10%, 행운 +6, 중열 회피율 +25%',
    buffs: { spdBonus: 1.10, luckBonus: 6, midRowEvasionBonus: 0.25 },
    check: (party) => {
      if (party.length < 2) return false;
      const midCount = party.filter(h => (h.position || 'mid') === 'mid').length;
      return midCount >= 2;
    }
  },

  // =========================================================================
  // 3. 전직 숙련도 시너지 (Veterancy & Tier Synergies)
  // =========================================================================
  {
    id: 'syn_veteran_corps',
    category: 'tier',
    name: '베테랑 정예 원정단',
    icon: '🎖️',
    conditionText: '파티원 전원 1차 전직 이상 (Tier >= 1)',
    description: '단련된 정예병들의 호흡: 파티 전체 모든 스탯 +5%',
    buffs: { allStatsBonus: 1.05 },
    check: (party) => {
      if (party.length < 3) return false;
      return party.every(h => {
        const cls = CHARACTER_CLASSES[h.classId];
        return cls && cls.tier >= 1;
      });
    }
  },
  {
    id: 'syn_legendary_lead',
    category: 'tier',
    name: '전설의 영웅단',
    icon: '👑',
    conditionText: '2차 최종 전직 영웅 1명 이상 포함',
    description: '영웅의 통솔력: 파티 전체 공격력 +8%, 최대 체력 +8%',
    buffs: { atkBonus: 1.08, maxHpBonus: 1.08 },
    check: (party) => {
      if (party.length < 1) return false;
      return party.some(h => {
        const cls = CHARACTER_CLASSES[h.classId];
        return cls && cls.tier >= 2;
      });
    }
  },
  {
    id: 'syn_mythic_ascendance',
    category: 'tier',
    name: '각성한 신화의 군단',
    icon: '🌟',
    conditionText: '파티원 3명 전원 2차 최종 전직 (Tier 2)',
    description: '신화적 무력의 정점: 모든 스탯 +10%, 받는 피해 5% 감소, 치명타 피해 +15%, 턴당 체력 3% 재생 및 마나 5 MP 회복',
    buffs: { allStatsBonus: 1.10, damageReductionPct: 0.05, critDmgBonus: 0.15, hpRegenPct: 0.03, mpRegenPerTurn: 5 },
    check: (party) => {
      if (party.length < 3) return false;
      return party.every(h => {
        const cls = CHARACTER_CLASSES[h.classId];
        return cls && cls.tier >= 2;
      });
    }
  }
];

// 직업군(role) 시너지 우선순위 (3인 순수 특화 > 3인 삼위일체 > 2인 단일 > 2인 복합 순, 최대 2개만 선별 적용)
const ROLE_PRIORITY: Record<string, number> = {
  // 3인 순수 단일 직업군 (100점)
  syn_citadel_monoclass: 100,
  syn_arcane_calamity: 100,
  syn_orbital_annihilation: 100,
  syn_slaughter_legion: 100,
  syn_phantom_decapitation: 100,
  syn_eternal_resurrection: 100,

  // 3인 밸런스 삼위일체 (90점)
  syn_trinity: 90,

  // 2인 단일 직업군 (70점)
  syn_iron_wall: 70,
  syn_arcane: 70,
  syn_bullet_hell: 70,
  syn_bloodlust: 70,
  syn_rearguard: 70,
  syn_nature_ward: 70,

  // 2인 복합 직업군 (50~55점)
  syn_holy: 55,
  syn_magitek: 55,
  syn_vanguard: 55,
  syn_arcane_sanctum: 55,
  syn_shadow_blood: 50,
  syn_aegis_sniper: 50,
  syn_holy_inquisitor: 50,
  syn_heavy_artillery: 50,
  syn_spellblade: 50,
};

// 진형(formation) 시너지 우선순위 (최대 1개만 선별 적용)
const FORMATION_PRIORITY: Record<string, number> = {
  syn_formation_delta: 90,    // 삼각 균형 진형
  syn_formation_vanguard: 80, // 돌격 배수진
  syn_formation_siege: 80,    // 후방 화망
  syn_formation_skirmish: 80, // 유격 진형
};

// 전직/숙련도 시너지 우선순위 (가장 상위 1개만 적용)
const TIER_PRIORITY: Record<string, number> = {
  syn_mythic_ascendance: 3, // 3명 전원 2차 전직 (최상위)
  syn_legendary_lead: 2,    // 2차 전직 1명 이상 (중위)
  syn_veteran_corps: 1,     // 전원 1차 전직 이상 (기본)
};

/** 
 * 현재 파티 편성에 따라 활성화된 시너지 계산
 * - 직업군(role) 시너지: 상위 최대 2개 선별
 * - 진형(formation) 시너지: 상위 최대 1개 선별
 * - 전직/숙련도(tier) 시너지: 최상위 최대 1개 선별
 * => 최종 파티 시너지는 총 최대 4개로 엄격히 제한
 */
export function calculatePartySynergies(party: Mercenary[]): PartySynergy[] {
  if (!party || party.length === 0) return [];

  const roleCandidates: { def: PartySynergyDefinition; priority: number }[] = [];
  const formationCandidates: { def: PartySynergyDefinition; priority: number }[] = [];
  const tierCandidates: { def: PartySynergyDefinition; priority: number }[] = [];
  const otherCandidates: PartySynergyDefinition[] = [];

  for (const def of ALL_PARTY_SYNERGIES) {
    if (def.check(party)) {
      if (def.category === 'role') {
        const priority = ROLE_PRIORITY[def.id] || 40;
        roleCandidates.push({ def, priority });
      } else if (def.category === 'formation') {
        const priority = FORMATION_PRIORITY[def.id] || 50;
        formationCandidates.push({ def, priority });
      } else if (def.category === 'tier') {
        const priority = TIER_PRIORITY[def.id] || 0;
        tierCandidates.push({ def, priority });
      } else {
        otherCandidates.push(def);
      }
    }
  }

  const activeSynergies: PartySynergy[] = [];

  // 1. 직업군(role) 시너지는 최대 2개만 선별
  if (roleCandidates.length > 0) {
    roleCandidates.sort((a, b) => b.priority - a.priority);
    roleCandidates.slice(0, 2).forEach(({ def }) => {
      activeSynergies.push({
        id: def.id,
        category: def.category,
        name: def.name,
        icon: def.icon,
        conditionText: def.conditionText,
        description: def.description,
        isActive: true,
        buffs: def.buffs
      });
    });
  }

  // 2. 진형(formation) 시너지는 최대 1개만 선별
  if (formationCandidates.length > 0) {
    formationCandidates.sort((a, b) => b.priority - a.priority);
    const topFormation = formationCandidates[0].def;
    activeSynergies.push({
      id: topFormation.id,
      category: topFormation.category,
      name: topFormation.name,
      icon: topFormation.icon,
      conditionText: topFormation.conditionText,
      description: topFormation.description,
      isActive: true,
      buffs: topFormation.buffs
    });
  }

  // 3. 전직/숙련도(tier) 시너지는 최대 1개만 선별
  if (tierCandidates.length > 0) {
    tierCandidates.sort((a, b) => b.priority - a.priority);
    const topTier = tierCandidates[0].def;
    activeSynergies.push({
      id: topTier.id,
      category: topTier.category,
      name: topTier.name,
      icon: topTier.icon,
      conditionText: topTier.conditionText,
      description: topTier.description,
      isActive: true,
      buffs: topTier.buffs
    });
  }

  // 기타 특수 시너지가 있다면 추가 (현재 총 최대 4개 보장)
  otherCandidates.forEach(def => {
    if (activeSynergies.length < 4) {
      activeSynergies.push({
        id: def.id,
        category: def.category,
        name: def.name,
        icon: def.icon,
        conditionText: def.conditionText,
        description: def.description,
        isActive: true,
        buffs: def.buffs
      });
    }
  });

  return activeSynergies;
}
