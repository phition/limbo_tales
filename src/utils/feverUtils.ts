import { FeverBadgeType, FeverBadgeMeta, FeverSynergyResult, FeverSynergyId, FeverAffinity, FeverShowdownOutcome, ShowdownResult } from '../types/fever';
import { Mercenary } from '../types/game';

export const FEVER_BADGE_META: Record<FeverBadgeType, FeverBadgeMeta> = {
  assist: {
    type: 'assist',
    label: '원호 추격',
    shortLabel: 'ASSIST',
    icon: '🎯',
    color: '#ffd54f',
    borderColor: '#ffd54f88',
    bg: '#ffd54f22',
    description: '아군 공격 후 원호 또는 약점 추격 발동'
  },
  extra: {
    type: 'extra',
    label: '스킬 연계',
    shortLabel: 'EXTRA',
    icon: '⚡',
    color: '#ff9800',
    borderColor: '#ff980088',
    bg: '#ff980022',
    description: '클래스 간 시너지 콤보 연계 성공'
  },
  crit: {
    type: 'crit',
    label: '치명 일격',
    shortLabel: 'CRIT',
    icon: '💥',
    color: '#ff5252',
    borderColor: '#ff525288',
    bg: '#ff525222',
    description: '강력한 치명타 적중'
  },
  guard: {
    type: 'guard',
    label: '수호 개입',
    shortLabel: 'GUARD',
    icon: '🛡️',
    color: '#38ef7d',
    borderColor: '#38ef7d88',
    bg: '#38ef7d22',
    description: '보호막 전개, 방패 막기 또는 아군 수호'
  },
  heal: {
    type: 'heal',
    label: '신성 치유',
    shortLabel: 'HEAL',
    icon: '💖',
    color: '#ff4081',
    borderColor: '#ff408188',
    bg: '#ff408122',
    description: '회복/재생 스킬로 자신 이외의 아군 치료'
  },
  counter: {
    type: 'counter',
    label: '환영 반격',
    shortLabel: 'COUNTER',
    icon: '⚔️',
    color: '#ce93d8',
    borderColor: '#ce93d888',
    bg: '#ce93d822',
    description: '회피 또는 반격 태세로 공격 맞받아침'
  },
  break: {
    type: 'break',
    label: '차징 붕괴',
    shortLabel: 'BREAK',
    icon: '💫',
    color: '#00d2ff',
    borderColor: '#00d2ff88',
    bg: '#00d2ff22',
    description: '적의 차징 캔슬 및 그로기 유발'
  },
  evade: {
    type: 'evade',
    label: '회피 기동',
    shortLabel: 'EVADE',
    icon: '🌀',
    color: '#00e5ff',
    borderColor: '#00e5ff88',
    bg: '#00e5ff22',
    description: '적의 공격을 회피(EVADE)하여 흘려냄'
  }
};

/**
 * 5개의 모멘텀 뱃지 조합을 분석하여 최적의 FEVER 시너지 효과를 산출합니다.
 */
export function evaluateFeverSynergy(badges: FeverBadgeType[] = [], party: Mercenary[] = []): FeverSynergyResult {
  const counts: Record<FeverBadgeType, number> = {
    assist: 0,
    extra: 0,
    crit: 0,
    guard: 0,
    heal: 0,
    counter: 0,
    break: 0,
    evade: 0
  };

  const safeBadges = Array.isArray(badges) ? badges : [];
  safeBadges.forEach(b => {
    if (counts[b] !== undefined) counts[b]++;
  });

  const totalBadges = safeBadges.length;
  const safeParty = Array.isArray(party) ? party : [];
  const hasFallenHero = safeParty.some(h => h && h.currentHp <= 0);
  const hasDyingHero = safeParty.some(h => h && h.currentHp > 0 && (h.currentHp / (h.maxHp || 1)) <= 0.35);
  const distinctCount = Object.values(counts).filter(c => c > 0).length;

  // 1. 🕊️✨ 【기적의 소생 / 기적의 성역】: 가드(GUARD) 2개 이상 + 힐(HEAL) 3개 이상
  if (counts.guard >= 2 && counts.heal >= 3) {
    return {
      id: 'miracle_resurrection',
      name: hasFallenHero ? '기적의 소생' : '기적의 성역',
      subTitle: hasFallenHero ? 'Miracle Resurrection' : 'Miracle Sanctuary',
      icon: '🕊️💖',
      color: '#ff4081',
      bg: 'linear-gradient(135deg, rgba(255,64,129,0.3), rgba(30,10,25,0.95))',
      borderColor: '#ff4081',
      summary: hasFallenHero
        ? '사망 아군 1인 HP 60% 기적의 부활 + 생존 아군 전원 HP 50% 회복 & 디버프 완전 정화'
        : '부활 대상 없음: 파티 전원 HP 70% 대량 치유 + 최대 HP 40% 보호막 & 디버프 면역 2턴',
      powerMult: 1.4,
      critRateBonus: 0.15,
      critDamageBonus: 0.2,
      armorPenetration: 0.2,
      isForceAoe: false,
      lifestealPct: 0.3,
      partyShieldPct: hasFallenHero ? 0.3 : 0.4,
      reviveFallen: hasFallenHero,
      reviveHpPct: 0.6,
      partyFullHeal: false,
      cleanseDebuffs: true,
      immunityTurns: hasFallenHero ? 1 : 2,
      riposteTurns: 0,
      stunTurns: 0,
      rechargePartyMp: false
    };
  }

  // 2. 🛡️🧱 【철벽 수호 (Iron Bulwark)】: 수호(GUARD) 뱃지 4개 이상
  // (방어 관통, 파티 흡혈, 디버프 면역 제외, 파티 전원 최대 HP 25% 에테르 보호막 집중 부여)
  if (counts.guard >= 4) {
    return {
      id: 'iron_bulwark',
      name: '철벽 수호',
      subTitle: 'Iron Bulwark',
      icon: '🛡️🧱',
      color: '#38ef7d',
      bg: 'linear-gradient(135deg, rgba(56,239,125,0.3), rgba(10,35,22,0.95))',
      borderColor: '#38ef7d',
      summary: '파티 전원 최대 HP 25% 에테르 보호막(3턴) 즉시 전개',
      powerMult: 1.35,
      critRateBonus: 0.15,
      critDamageBonus: 0.25,
      armorPenetration: 0,      // 방어 관통 제외
      isForceAoe: false,
      lifestealPct: 0,          // 파티 흡혈 제외
      partyShieldPct: 0.25,     // 아군 전체 체력 25% 보호막 부여
      reviveFallen: false,
      reviveHpPct: 0,
      partyFullHeal: false,
      cleanseDebuffs: false,
      immunityTurns: 0,         // 디버프 면역 제외
      riposteTurns: 0,
      stunTurns: 0,
      rechargePartyMp: false
    };
  }

  // 3. 🩸🕊️ 【기사회생 (Miracle Revive)】: 가드(GUARD) 3개 이상 또는 힐(HEAL) 3개 이상
  // (사망 아군 1인 HP 10% 부활, 사망 아군 부재 시 생존 아군 체력 50% 회복)
  if (counts.guard >= 3 || counts.heal >= 3) {
    const hasDead = hasFallenHero || hasDyingHero;
    return {
      id: 'miracle_revive',
      name: '기사회생',
      subTitle: 'Miracle Revive',
      icon: '🩸🕊️',
      color: '#38ef7d',
      bg: 'linear-gradient(135deg, rgba(56,239,125,0.25), rgba(11,29,19,0.9))',
      borderColor: '#38ef7d',
      summary: hasDead
        ? '사망 아군 1인 HP 10% 기적의 부활 & 생존 아군 HP 50% 회복'
        : '파티 전원 HP 50% 즉시 회복 및 해로운 상태이상 정화',
      powerMult: 1.3,
      critRateBonus: 0.15,
      critDamageBonus: 0.2,
      armorPenetration: 0.15,
      isForceAoe: false,
      lifestealPct: 0.2,
      partyShieldPct: 0,
      reviveFallen: hasDead,
      reviveHpPct: 0.10,
      reviveSingle: true,       // 사망 아군 1인만 부활
      partyFullHeal: false,
      partyHealPct: 0.50,       // 사망자 없을 시(또는 생존자) 체력 50% 회복
      cleanseDebuffs: true,
      immunityTurns: 1,
      riposteTurns: 0,
      stunTurns: 0,
      rechargePartyMp: false
    };
  }

  // 4. ⚡🌪️ 【연격 폭풍 (Chain Onslaught)】: EXTRA 뱃지 4개 이상
  // (단일 대상이어도 적 전체로 확장 + 위력 50% 추가 + 치명타 확률 50% 증가)
  if (counts.extra >= 4) {
    return {
      id: 'extra_onslaught',
      name: '연격 폭풍',
      subTitle: 'Chain Onslaught',
      icon: '⚡🌪️',
      color: '#ff9800',
      bg: 'linear-gradient(135deg, rgba(255,152,0,0.3), rgba(38,18,0,0.9))',
      borderColor: '#ff9800',
      summary: '궁극기 범위 적 전체로 강제 확장 + 최종 위력 +50% + 치명타 확률 +50%',
      powerMult: 1.5,           // 위력 50% 추가
      critRateBonus: 0.50,      // 치명타 확률 50% 증가
      critDamageBonus: 0.50,
      armorPenetration: 0.35,
      isForceAoe: true,         // 적 전체로 강제 확장
      lifestealPct: 0.15,
      partyShieldPct: 0,
      reviveFallen: false,
      reviveHpPct: 0,
      partyFullHeal: false,
      cleanseDebuffs: false,
      immunityTurns: 0,
      riposteTurns: 0,
      stunTurns: 0,
      rechargePartyMp: false
    };
  }

  // 5. 🌀⚔️ 【환영 신기루 (Mirage Step)】: EVADE 뱃지 3개 이상
  // (전체 명중력 50% 증가 + 전체 환영 반격 2턴 부여)
  if (counts.evade >= 3) {
    return {
      id: 'mirage_evasion',
      name: '환영 신기루',
      subTitle: 'Mirage Step',
      icon: '🌀⚔️',
      color: '#00e5ff',
      bg: 'linear-gradient(135deg, rgba(0,229,255,0.3), rgba(0,25,35,0.9))',
      borderColor: '#00e5ff',
      summary: '파티 전원 명중력 +50% 증가 & 2턴간 [환영 반격 결계] 전개',
      powerMult: 1.35,
      critRateBonus: 0.20,
      critDamageBonus: 0.30,
      armorPenetration: 0.25,
      isForceAoe: false,
      lifestealPct: 0.15,
      partyShieldPct: 0,
      reviveFallen: false,
      reviveHpPct: 0,
      partyFullHeal: false,
      cleanseDebuffs: true,
      immunityTurns: 1,
      riposteTurns: 2,          // 전체 환영 반격 2턴 부여
      stunTurns: 0,
      rechargePartyMp: false,
      hitRateBonus: 0.50        // 전체 명중력 50% 증가
    };
  }

  // 6. ⚡ 【질풍노도 (Flurry Overdrive)】: CRIT 3개 이상 또는 CRIT 2개 + EXTRA 2개
  if (counts.crit >= 3 || (counts.crit >= 2 && counts.extra >= 2)) {
    return {
      id: 'flurry_overdrive',
      name: '질풍노도',
      subTitle: 'Flurry Overdrive',
      icon: '⚡💥',
      color: '#ff5252',
      bg: 'linear-gradient(135deg, rgba(255,82,82,0.3), rgba(41,10,10,0.9))',
      borderColor: '#ff5252',
      summary: '방어력 100% 무시(순수 관통 피해) + 확정 치명타(100%) + 치명 피해 +150% 폭발',
      powerMult: 1.5,
      critRateBonus: 1.0,      // 100% 확정 치명타
      critDamageBonus: 1.5,    // 치명 피해 +150%
      armorPenetration: 1.0,   // 방어력 100% 무시
      isForceAoe: false,
      lifestealPct: 0.2,
      partyShieldPct: 0,
      reviveFallen: false,
      reviveHpPct: 0,
      partyFullHeal: false,
      cleanseDebuffs: false,
      immunityTurns: 0,
      riposteTurns: 0,
      stunTurns: 0,
      rechargePartyMp: false
    };
  }

  // 7. 🎯 【총력 섬멸 (Total Assault)】: ASSIST 3개 이상 또는 ASSIST 2개 + EXTRA 2개
  if (counts.assist >= 3 || (counts.assist >= 2 && counts.extra >= 2)) {
    return {
      id: 'total_assault',
      name: '총력 섬멸',
      subTitle: 'Total Assault',
      icon: '🎯🚀',
      color: '#ffd54f',
      bg: 'linear-gradient(135deg, rgba(255,213,79,0.3), rgba(37,29,8,0.9))',
      borderColor: '#ffd54f',
      summary: '궁극기 범위 적 전체로 강제 확장 + 최종 위력 +60% 증폭 + 방어 관통 40%',
      powerMult: 1.6,          // 위력 60% 증가로 조정
      critRateBonus: 0.3,
      critDamageBonus: 0.5,
      armorPenetration: 0.4,
      isForceAoe: true,        // 적 전체화
      lifestealPct: 0.15,
      partyShieldPct: 0,
      reviveFallen: false,
      reviveHpPct: 0,
      partyFullHeal: false,
      cleanseDebuffs: false,
      immunityTurns: 0,
      riposteTurns: 0,
      stunTurns: 0,
      rechargePartyMp: false
    };
  }

  // 8. 🛡️ 【불멸의 요새 (Immortal Bastion)】: GUARD 2개 이상 + COUNTER 2개 이상
  if (counts.guard >= 2 && counts.counter >= 2) {
    return {
      id: 'immortal_bastion',
      name: '불멸의 요새',
      subTitle: 'Immortal Bastion',
      icon: '🛡️🏰',
      color: '#00d2ff',
      bg: 'linear-gradient(135deg, rgba(0,210,255,0.25), rgba(10,25,45,0.9))',
      borderColor: '#00d2ff',
      summary: '전 파티원 최대 HP 30% 에테르 방벽 부여 + 2턴간 100% 환영 반격 결계',
      powerMult: 1.4,
      critRateBonus: 0.2,
      critDamageBonus: 0.3,
      armorPenetration: 0.3,
      isForceAoe: false,
      lifestealPct: 0.2,
      partyShieldPct: 0.30,    // 최대체력 30% 보호막으로 조정
      reviveFallen: false,
      reviveHpPct: 0,
      partyFullHeal: false,
      cleanseDebuffs: true,
      immunityTurns: 1,
      riposteTurns: 2,         // 2턴간 반격 결계
      stunTurns: 0,
      rechargePartyMp: false
    };
  }

  // 9. 🌐 【전술의 극의 (Grand Maestro)】: 5개 뱃지가 모두 서로 다를 때 (distinctCount >= 5)
  if (distinctCount >= 5 && totalBadges >= 5) {
    return {
      id: 'grand_maestro',
      name: '전술의 극의',
      subTitle: 'Grand Tactical Maestro',
      icon: '🌐👑',
      color: '#e040fb',
      bg: 'linear-gradient(135deg, rgba(224,64,251,0.3), rgba(30,10,38,0.9))',
      borderColor: '#e040fb',
      summary: '위력 +80%, 치명타 +50%, 관통 50%, 파티 MP 30% 회복, 적 전체 1턴 완전 그로기',
      powerMult: 1.8,
      critRateBonus: 0.5,
      critDamageBonus: 0.8,
      armorPenetration: 0.5,
      isForceAoe: true,
      lifestealPct: 0.3,
      partyShieldPct: 0.3,
      reviveFallen: false,
      reviveHpPct: 0,
      partyFullHeal: false,
      cleanseDebuffs: true,
      immunityTurns: 1,
      riposteTurns: 1,
      stunTurns: 1,            // 적 전체 1턴 그로기
      rechargePartyMp: false,
      rechargePartyMpPct: 0.30 // 파티 MP 30% 회복으로 조정
    };
  }

  // 6. 🍷 【흡혈 진혼곡 (Vampiric Requiem)】: COUNTER 또는 BREAK 중심
  if (counts.counter >= 2 || counts.break >= 2) {
    return {
      id: 'vampiric_requiem',
      name: '흡혈 진혼곡',
      subTitle: 'Vampiric Requiem',
      icon: '🍷🩸',
      color: '#ba68c8',
      bg: 'linear-gradient(135deg, rgba(186,104,200,0.3), rgba(32,12,38,0.9))',
      borderColor: '#ba68c8',
      summary: '가한 피해의 100%를 파티 전원에게 균등 흡혈 회복 + 초과분은 에테르 보호막으로 전환',
      powerMult: 1.5,
      critRateBonus: 0.25,
      critDamageBonus: 0.5,
      armorPenetration: 0.35,
      isForceAoe: false,
      lifestealPct: 1.0,       // 피해 100% 흡혈
      partyShieldPct: 0.25,
      reviveFallen: false,
      reviveHpPct: 0,
      partyFullHeal: false,
      cleanseDebuffs: false,
      immunityTurns: 0,
      riposteTurns: 1,
      stunTurns: 0,
      rechargePartyMp: false
    };
  }

  // 7. 🌟 【전술 파동 (Tactical Burst)】: 뱃지별 개별 누적 기본 효과
  const basePower = 1 + (counts.assist * 0.15) + (counts.extra * 0.12);
  const baseCrit = (counts.crit * 0.12);
  const basePen = (counts.break * 0.15) + (counts.counter * 0.10);
  const baseShield = (counts.guard * 0.12);
  const baseLifesteal = 0.2 + (counts.heal * 0.10);
  const baseRiposte = counts.evade >= 2 ? 1 : 0;

  return {
    id: 'tactical_burst',
    name: '전술 파동',
    subTitle: 'Tactical Momentum Burst',
    icon: '⚡🌟',
    color: '#ffd54f',
    bg: 'linear-gradient(135deg, rgba(255,213,79,0.2), rgba(20,25,35,0.9))',
    borderColor: '#ffd54faa',
    summary: `궁극기 위력 +${Math.round((basePower - 1) * 100)}%, 치명타율 +${Math.round(baseCrit * 100)}%, 방어 관통 ${Math.round(basePen * 100)}%`,
    powerMult: Number(basePower.toFixed(2)),
    critRateBonus: Number(baseCrit.toFixed(2)),
    critDamageBonus: 0.4,
    armorPenetration: Number(basePen.toFixed(2)),
    isForceAoe: false,
    lifestealPct: Number(baseLifesteal.toFixed(2)),
    partyShieldPct: Number(baseShield.toFixed(2)),
    reviveFallen: false,
    reviveHpPct: 0,
    partyFullHeal: false,
    cleanseDebuffs: false,
    immunityTurns: 0,
    riposteTurns: baseRiposte,
    stunTurns: 0,
    rechargePartyMp: false
  };
}

// ── 피버 족보 대결 (Fever Showdown) 메타 및 판정 로직 ──────────────────────────────────────

export const FEVER_AFFINITY_META: Record<FeverAffinity, { label: string; icon: string; color: string; desc: string }> = {
  burst: {
    label: '돌파계',
    icon: '💥',
    color: '#ff5252',
    desc: '치명타/연격/원호 중심의 폭발적 극딜 진형입니다.'
  },
  guard: {
    label: '수호계',
    icon: '🛡️',
    color: '#38ef7d',
    desc: '방벽/치유/반격 중심의 난공불락 결계 진형입니다.'
  },
  trick: {
    label: '변칙계',
    icon: '🌀',
    color: '#00e5ff',
    desc: '회피/흡혈/브레이크 중심의 전술 교란 진형입니다.'
  },
  joker: {
    label: '전술의 극의',
    icon: '🌐',
    color: '#e040fb',
    desc: '5종의 배지가 조화된 최상위 스트레이트 족보. 모든 상성을 무시하고 절대 승리합니다.'
  },
  neutral: {
    label: '일반',
    icon: '⚡',
    color: '#ffd54f',
    desc: '특수 족보를 완성하지 못한 기본 전술 파동입니다. 배지 총점(High Card)으로 우위를 겨룹니다.'
  }
};

export const FEVER_SYNERGY_AFFINITY_MAP: Record<FeverSynergyId, FeverAffinity> = {
  grand_maestro: 'joker',
  flurry_overdrive: 'burst',
  extra_onslaught: 'burst',
  total_assault: 'burst',
  iron_bulwark: 'guard',
  miracle_resurrection: 'guard',
  divine_sanctuary: 'guard',
  miracle_revive: 'guard',
  immortal_bastion: 'guard',
  mirage_evasion: 'trick',
  vampiric_requiem: 'trick',
  tactical_burst: 'neutral'
};

// 족보 위계 (포커 핸드 티어: 5 = 스트레이트, 4 = 포카드, 3 = 풀하우스, 2 = 트리플/투페어, 1 = 원페어, 0 = 탑)
export const FEVER_SYNERGY_HAND_RANK: Record<FeverSynergyId, number> = {
  grand_maestro: 5,        // 스트레이트 (조커)
  iron_bulwark: 4,         // 포카드 (가드 4)
  extra_onslaught: 4,      // 포카드 (엑스트라 4)
  miracle_resurrection: 3, // 풀하우스 (가드2 + 힐3)
  divine_sanctuary: 3,     // 풀하우스급 (힐 3+)
  flurry_overdrive: 2,     // 트리플 (크릿 3)
  total_assault: 2,        // 트리플 (어시스트 3)
  miracle_revive: 2,       // 트리플 (가드3 or 힐3)
  mirage_evasion: 2,       // 트리플 (회피 3)
  immortal_bastion: 2,     // 투페어 (가드2 + 카운터2)
  vampiric_requiem: 1,     // 원페어 (카운터2 or 브레이크2)
  tactical_burst: 0        // 노페어 (잡패)
};

// ── ⚖️ 뱃지 가중치 점수 (High Card 점수제) ─────────────────────────────────
// 전술 파동(잡패) 및 동급 판정 시 회피/힐은 비교적 달성 쉬우므로 점수를 낮추고,
// 카운터/엑스트라/크릿 등 고난이도 액션에 높은 가중치를 부여합니다.
export const FEVER_BADGE_WEIGHT: Record<FeverBadgeType, number> = {
  extra: 35,    // ⚡ 스킬 연계 콤보 (최고 가중치)
  counter: 30,  // ⚔️ 환영 반격
  crit: 25,     // 💥 치명 일격
  break: 20,    // 💫 차징 붕괴
  guard: 15,    // 🛡️ 수호 개입
  assist: 15,   // 🎯 원호 추격
  heal: 10,     // 💖 신성 치유 (기본 회복)
  evade: 10     // 🌀 회피 기동
};

export function calculateFeverBadgeScore(badges: FeverBadgeType[] = []): number {
  return (badges || []).reduce((sum, b) => sum + (FEVER_BADGE_WEIGHT[b] || 10), 0);
}

// ── 🔄 주간 가위바위보 상성 순환 기믹 (Weekly Affinity Cycle) ───────────────
export type AffinityRuleType = 'standard' | 'inverted' | 'disruption';

export interface WeeklyAffinityConfig {
  id: AffinityRuleType;
  title: string;
  relationText: string;
  desc: string;
  beats: Record<'burst' | 'guard' | 'trick', 'burst' | 'guard' | 'trick'>;
}

export const WEEKLY_AFFINITY_RULES: Record<AffinityRuleType, WeeklyAffinityConfig> = {
  standard: {
    id: 'standard',
    title: '정규 차원율 (Standard)',
    relationText: '💥돌파 > 🌀변칙 > 🛡️수호 > 💥돌파',
    desc: '돌파계가 변칙계를 부수고, 변칙계가 수호계를 뚫으며, 수호계가 돌파계를 받아냅니다.',
    beats: {
      burst: 'trick',
      trick: 'guard',
      guard: 'burst'
    }
  },
  inverted: {
    id: 'inverted',
    title: '반전 차원율 (Inverted)',
    relationText: '🛡️수호 > 🌀변칙 > 💥돌파 > 🛡️수호',
    desc: '차원의 왜곡으로 상성이 정반대로 역전되어 수호계가 변칙계를, 변칙계가 돌파계를, 돌파계가 수호계를 격파합니다.',
    beats: {
      guard: 'trick',
      trick: 'burst',
      burst: 'guard'
    }
  },
  disruption: {
    id: 'disruption',
    title: '혼돈 차원율 (Disruption)',
    relationText: '🌀변칙 > 💥돌파 > 🛡️수호 > 🌀변칙',
    desc: '변칙계의 환영이 돌파계를 농락하고, 돌파계가 수호계를 분쇄하며, 수호계가 변칙계를 봉쇄합니다.',
    beats: {
      trick: 'burst',
      burst: 'guard',
      guard: 'trick'
    }
  }
};

/**
 * 연중 주차 기반으로 주간 가위바위보 상성 룰 반환
 */
export function getWeeklyAffinityConfig(weekOffset: number = 0): WeeklyAffinityConfig {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 1);
  const diff = now.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  const weekNum = Math.floor(diff / oneWeek) + weekOffset;

  const keys: AffinityRuleType[] = ['standard', 'inverted', 'disruption'];
  const selected = keys[Math.abs(weekNum) % keys.length];
  return WEEKLY_AFFINITY_RULES[selected];
}

// ── 📖 전체 피버 족보 도감 데이터 (Codex) ──────────────────────────────────
export interface FeverCodexItem {
  id: FeverSynergyId;
  name: string;
  subTitle: string;
  affinity: FeverAffinity;
  handRankLabel: string;
  tierRank: number;
  requiredBadges: string;
  summary: string;
  icon: string;
  color: string;
  bg: string;
  borderColor: string;
}

export const ALL_FEVER_SYNERGIES_CODEX: FeverCodexItem[] = [
  {
    id: 'grand_maestro',
    name: '전술의 극의',
    subTitle: 'Grand Tactical Maestro',
    affinity: 'joker',
    handRankLabel: '스트레이트 (최상위)',
    tierRank: 5,
    requiredBadges: '5종 서로 다른 배지 (무지개)',
    summary: '상성 무관 절대 승리. 적 전체 1턴 기절, 위력 +80%, 파티 MP 30% 회복',
    icon: '🌐👑',
    color: '#e040fb',
    bg: 'linear-gradient(135deg, rgba(224,64,251,0.25), rgba(30,10,38,0.95))',
    borderColor: '#e040fb'
  },
  {
    id: 'iron_bulwark',
    name: '철벽 수호',
    subTitle: 'Iron Bulwark',
    affinity: 'guard',
    handRankLabel: '포카드 (최상위 수호)',
    tierRank: 4,
    requiredBadges: '🛡️ 가드 4개 이상',
    summary: '파티 전원 최대 HP 25% 에테르 보호막(3턴) 즉시 전개',
    icon: '🛡️🧱',
    color: '#38ef7d',
    bg: 'linear-gradient(135deg, rgba(56,239,125,0.25), rgba(10,35,22,0.95))',
    borderColor: '#38ef7d'
  },
  {
    id: 'extra_onslaught',
    name: '연격 폭풍',
    subTitle: 'Chain Onslaught',
    affinity: 'burst',
    handRankLabel: '포카드 (최상위 돌파)',
    tierRank: 4,
    requiredBadges: '⚡ 엑스트라 4개 이상',
    summary: '궁극기 범위 적 전체로 강제 확장 + 최종 위력 +50% + 치명타율 +50%',
    icon: '⚡🌪️',
    color: '#ff9800',
    bg: 'linear-gradient(135deg, rgba(255,152,0,0.25), rgba(38,18,0,0.9))',
    borderColor: '#ff9800'
  },
  {
    id: 'miracle_resurrection',
    name: '기적의 소생',
    subTitle: 'Miracle Resurrection',
    affinity: 'guard',
    handRankLabel: '풀하우스',
    tierRank: 3,
    requiredBadges: '🛡️ 가드 2개 + 💖 힐 3개',
    summary: '사망 아군 1인 HP 60% 기적의 부활 + 생존 아군 전원 HP 50% 치유 & 정화',
    icon: '🕊️💖',
    color: '#ff4081',
    bg: 'linear-gradient(135deg, rgba(255,64,129,0.25), rgba(30,10,25,0.95))',
    borderColor: '#ff4081'
  },
  {
    id: 'divine_sanctuary',
    name: '신성 성역',
    subTitle: 'Divine Sanctuary',
    affinity: 'guard',
    handRankLabel: '트리플 / 풀하우스급',
    tierRank: 3,
    requiredBadges: '💖 힐 3개 이상',
    summary: '파티 전원 체력 50% 대량 회복 및 1턴간 모든 해로운 효과 면역',
    icon: '💖🕊️',
    color: '#ff4081',
    bg: 'linear-gradient(135deg, rgba(255,64,129,0.2), rgba(30,10,25,0.9))',
    borderColor: '#ff4081aa'
  },
  {
    id: 'flurry_overdrive',
    name: '질풍노도',
    subTitle: 'Flurry Overdrive',
    affinity: 'burst',
    handRankLabel: '트리플 / 투페어',
    tierRank: 2,
    requiredBadges: '💥 크릿 3개 이상 (또는 크릿2 + 엑스트라2)',
    summary: '방어력 100% 무시(순수 관통) + 확정 치명타(100%) + 치명 피해 +150% 폭발',
    icon: '⚡💥',
    color: '#ff5252',
    bg: 'linear-gradient(135deg, rgba(255,82,82,0.25), rgba(41,10,10,0.9))',
    borderColor: '#ff5252'
  },
  {
    id: 'total_assault',
    name: '총력 섬멸',
    subTitle: 'Total Assault',
    affinity: 'burst',
    handRankLabel: '트리플 / 투페어',
    tierRank: 2,
    requiredBadges: '🎯 어시스트 3개 이상 (또는 어시스트2 + 엑스트라2)',
    summary: '궁극기 범위 적 전체 강제 확장 + 최종 위력 +60% + 방어 관통 40%',
    icon: '🎯🚀',
    color: '#ffd54f',
    bg: 'linear-gradient(135deg, rgba(255,213,79,0.25), rgba(37,29,8,0.9))',
    borderColor: '#ffd54f'
  },
  {
    id: 'mirage_evasion',
    name: '환영 신기루',
    subTitle: 'Mirage Step',
    affinity: 'trick',
    handRankLabel: '트리플',
    tierRank: 2,
    requiredBadges: '🌀 회피 3개 이상',
    summary: '파티 전원 명중력 +50% 증가 & 2턴간 [환영 반격 결계] 전개',
    icon: '🌀⚔️',
    color: '#00e5ff',
    bg: 'linear-gradient(135deg, rgba(0,229,255,0.25), rgba(0,25,35,0.9))',
    borderColor: '#00e5ff'
  },
  {
    id: 'immortal_bastion',
    name: '불멸의 요새',
    subTitle: 'Immortal Bastion',
    affinity: 'guard',
    handRankLabel: '투페어',
    tierRank: 2,
    requiredBadges: '🛡️ 가드 2개 + ⚔️ 카운터 2개',
    summary: '전 파티원 최대 HP 30% 에테르 방벽 부여 + 2턴간 100% 환영 반격 결계',
    icon: '🛡️🏰',
    color: '#00d2ff',
    bg: 'linear-gradient(135deg, rgba(0,210,255,0.25), rgba(10,25,45,0.9))',
    borderColor: '#00d2ff'
  },
  {
    id: 'vampiric_requiem',
    name: '흡혈 진혼곡',
    subTitle: 'Vampiric Requiem',
    affinity: 'trick',
    handRankLabel: '원페어',
    tierRank: 1,
    requiredBadges: '⚔️ 카운터 2개 또는 💫 브레이크 2개',
    summary: '가한 피해 100% 균등 흡혈 파티 배분 + 초과분 에테르 방벽 전환',
    icon: '🍷🩸',
    color: '#ba68c8',
    bg: 'linear-gradient(135deg, rgba(186,104,200,0.25), rgba(32,12,38,0.9))',
    borderColor: '#ba68c8'
  },
  {
    id: 'miracle_revive',
    name: '기사회생',
    subTitle: 'Miracle Revive',
    affinity: 'guard',
    handRankLabel: '트리플',
    tierRank: 2,
    requiredBadges: '🛡️ 가드 3개 이상 또는 💖 힐 3개 이상',
    summary: '사망 아군 1인 HP 10% 부활 & 생존 아군 HP 50% 회복 및 디버프 정화',
    icon: '🩸🕊️',
    color: '#38ef7d',
    bg: 'linear-gradient(135deg, rgba(56,239,125,0.25), rgba(11,29,19,0.9))',
    borderColor: '#38ef7d'
  },
  {
    id: 'tactical_burst',
    name: '전술 파동',
    subTitle: 'Tactical Burst',
    affinity: 'neutral',
    handRankLabel: '노페어 (하이카드)',
    tierRank: 0,
    requiredBadges: '임의의 배지 5개 (특수 조합 실패 시)',
    summary: '보유 배지 가중치 총점에 비례한 기본 스탯 증폭 및 피해량 가산',
    icon: '⚡🌟',
    color: '#ffd54f',
    bg: 'linear-gradient(135deg, rgba(255,213,79,0.2), rgba(20,25,35,0.9))',
    borderColor: '#ffd54faa'
  }
];

// ── 🎯 3인 파티 기반 가능성 높은 추천 족보 TOP 3 예측 알고리즘 ───────────────
export interface PredictedSynergy {
  codex: FeverCodexItem;
  probabilityPct: number;
  reason: string;
}

export function predictTopSynergies(party: Mercenary[]): PredictedSynergy[] {
  const safeParty = (party || []).filter(Boolean);
  if (safeParty.length === 0) return [];

  // 클래스별 배지 유발 가중치 집계
  const tendencies: Record<FeverBadgeType, number> = {
    guard: 0,
    heal: 0,
    crit: 0,
    extra: 0,
    assist: 0,
    counter: 0,
    break: 0,
    evade: 0
  };

  safeParty.forEach((hero, idx) => {
    const clsId = hero.classId || '';
    const pos = hero.position || (idx === 0 ? 'front' : idx === 1 ? 'mid' : 'back');

    // 포지션 기본 성향
    if (pos === 'front') { tendencies.guard += 2; tendencies.counter += 1; }
    if (pos === 'mid') { tendencies.extra += 1; tendencies.crit += 1; tendencies.assist += 1; }
    if (pos === 'back') { tendencies.heal += 1; tendencies.break += 1; tendencies.evade += 1; }

    // 클래스별 전문 성향
    if (clsId === 'paladin' || clsId === 'guardian' || clsId === 'aegis_valkyrie') {
      tendencies.guard += 3; tendencies.counter += 1;
    } else if (clsId === 'high_saintess' || clsId === 'bishop' || clsId === 'war_priest') {
      tendencies.heal += 3; tendencies.guard += 1;
    } else if (clsId === 'assassin' || clsId === 'shadow_phantom' || clsId === 'duelist') {
      tendencies.crit += 3; tendencies.evade += 2; tendencies.extra += 1;
    } else if (clsId === 'tactical_gunner' || clsId === 'sharpshooter') {
      tendencies.assist += 2; tendencies.extra += 2; tendencies.crit += 1;
    } else if (clsId === 'elementalist' || clsId === 'calamity_mage' || clsId === 'arcane_scholar') {
      tendencies.extra += 2; tendencies.break += 2; tendencies.assist += 1;
    } else if (clsId === 'vanguard' || clsId === 'berserker' || clsId === 'valhalla_blade') {
      tendencies.crit += 2; tendencies.counter += 2; tendencies.extra += 1;
    }
  });

  // 각 시너지 족보별 달성 가능성 점수 계산
  const scored = ALL_FEVER_SYNERGIES_CODEX.filter(c => c.id !== 'tactical_burst').map(codex => {
    let score = 0;
    let reason = '';

    switch (codex.id) {
      case 'iron_bulwark': // 가드 4
        score = tendencies.guard * 25;
        reason = '전열 수호자 중심의 방어막 전개';
        break;
      case 'extra_onslaught': // 엑스트라 4
        score = tendencies.extra * 25;
        reason = '연계 마도사/원딜 중심의 스킬 콤보';
        break;
      case 'miracle_resurrection': // 가드 2 + 힐 3
        score = (tendencies.guard * 15) + (tendencies.heal * 20);
        reason = '수호와 신성 치유가 결합된 부활 진형';
        break;
      case 'flurry_overdrive': // 크릿 3
        score = (tendencies.crit * 22) + (tendencies.extra * 8);
        reason = '치명타 딜러 중심의 순수 관통 폭딜';
        break;
      case 'total_assault': // 어시스트 3
        score = (tendencies.assist * 22) + (tendencies.extra * 8);
        reason = '원호 및 협공 위주의 전체 포격';
        break;
      case 'immortal_bastion': // 가드 2 + 카운터 2
        score = (tendencies.guard * 15) + (tendencies.counter * 18);
        reason = '방패와 반격이 융합된 결계 진형';
        break;
      case 'mirage_evasion': // 회피 3
        score = (tendencies.evade * 25) + (tendencies.counter * 10);
        reason = '민첩 회피 및 신기루 반격 전개';
        break;
      case 'vampiric_requiem': // 카운터2 or 브레이크2
        score = (tendencies.counter * 15) + (tendencies.break * 15);
        reason = '적 차징 붕괴 및 피해 흡혈 전술';
        break;
      case 'grand_maestro': // 5종 서로 다른 배지
        const variety = Object.values(tendencies).filter(v => v > 0).length;
        score = variety * 12;
        reason = '다양한 포지션의 올라운더 스트레이트';
        break;
      default:
        score = 20;
        reason = '전술적 모멘텀 연계';
    }

    return {
      codex,
      score,
      reason
    };
  });

  scored.sort((a, b) => b.score - a.score);

  const top3 = scored.slice(0, 3);
  const maxScore = Math.max(1, top3[0]?.score || 1);

  return top3.map(item => {
    const rawPct = Math.min(95, Math.max(45, Math.round((item.score / maxScore) * 85 + 10)));
    return {
      codex: item.codex,
      probabilityPct: rawPct,
      reason: item.reason
    };
  });
}

/**
 * 아군과 적군의 피버 뱃지 슬롯을 대조하여 쇼다운(Showdown) 승패를 판정합니다.
 * - 주간 가위바위보 상성 순환 기믹 반영
 * - 전술 파동(Neutral) 시 배지 가중치 총점(Score) 반영
 */
export function resolveFeverShowdown(
  playerBadges: FeverBadgeType[] = [],
  oppBadges: FeverBadgeType[] = [],
  playerParty: Mercenary[] = [],
  oppParty: Mercenary[] = [],
  customWeeklyRule?: WeeklyAffinityConfig
): ShowdownResult {
  const playerSynergy = evaluateFeverSynergy(playerBadges, playerParty);
  const oppSynergy = evaluateFeverSynergy(oppBadges, oppParty);

  const playerAffinity = FEVER_SYNERGY_AFFINITY_MAP[playerSynergy.id] || 'neutral';
  const oppAffinity = FEVER_SYNERGY_AFFINITY_MAP[oppSynergy.id] || 'neutral';

  const playerRank = FEVER_SYNERGY_HAND_RANK[playerSynergy.id] ?? 0;
  const oppRank = FEVER_SYNERGY_HAND_RANK[oppSynergy.id] ?? 0;

  const playerScore = calculateFeverBadgeScore(playerBadges);
  const oppScore = calculateFeverBadgeScore(oppBadges);

  const weeklyRule = customWeeklyRule || getWeeklyAffinityConfig();

  let outcome: FeverShowdownOutcome = 'clash';
  let bannerTitle = '⚔️ FEVER SHOWDOWN!';
  let bannerSub = '양측의 차원 모멘텀이 전광판에서 격돌합니다!';
  let narrative = '';
  let icon = '⚡';

  // 1. 조커 (전술의 극의) 판정
  if (playerAffinity === 'joker' && oppAffinity === 'joker') {
    outcome = 'clash';
    bannerTitle = '🌐 DOUBLE GRAND MAESTRO!';
    bannerSub = '양측 모두 전술의 극의를 완성하여 차원이 진동합니다!';
    narrative = '양측의 완전무결한 전술이 상쇄되며 피버 위력이 절반으로 억제됩니다.';
    icon = '🌐⚡';
  } else if (playerAffinity === 'joker') {
    outcome = 'player_win';
    bannerTitle = '👑 GRAND MAESTRO OVERRIDE!';
    bannerSub = '아군의 전술의 극의가 적의 모든 족보를 무력화했습니다!';
    narrative = `아군의 5색 스트레이트 전술이 적의 [${oppSynergy.name}]을 완벽히 간파하여 적 전체를 기절시킵니다!`;
    icon = '👑✨';
  } else if (oppAffinity === 'joker') {
    outcome = 'opp_win';
    bannerTitle = '💀 OPPONENT GRAND MAESTRO!';
    bannerSub = '적군의 전술의 극의가 아군의 전술을 제압했습니다!';
    narrative = `적의 5색 스트레이트 전술에 아군의 [${playerSynergy.name}]이 무력화되었습니다!`;
    icon = '💀🌐';
  }
  // 2. 일반(Neutral - 족보 미완성 전술 파동) 판정: 배지 가중치 총점(Score) 반영
  else if (playerAffinity === 'neutral' && oppAffinity === 'neutral') {
    if (playerScore > oppScore) {
      outcome = 'player_win';
      bannerTitle = '⚡ TACTICAL HIGH CARD!';
      bannerSub = `[전술 파동 총점 우세] 아군 뱃지 ${playerScore}점 vs 적군 ${oppScore}점!`;
      narrative = `양측 모두 전술 파동이었으나, 아군의 고급 뱃지 연계 가중치 점수가 더 높아 선제권을 장악했습니다!`;
      icon = '⚡🏆';
    } else if (oppScore > playerScore) {
      outcome = 'opp_win';
      bannerTitle = '💀 OPPONENT HIGH CARD!';
      bannerSub = `[전술 파동 총점 열세] 적군 뱃지 ${oppScore}점 vs 아군 ${playerScore}점!`;
      narrative = `양측 모두 전술 파동이었으나, 적군의 고급 뱃지 가중치에 밀려 아군이 충격을 흡수해야 합니다.`;
      icon = '💀⚡';
    } else {
      outcome = 'clash';
      bannerTitle = '⚔️ TACTICAL CLASH!';
      bannerSub = `[전술 파동 동점] 양측 뱃지 총점이 ${playerScore}점으로 동일합니다!`;
      narrative = '동일한 전술 파동의 파괴력이 서로를 상쇄하며 50%의 위력으로 작렬합니다.';
      icon = '⚔️';
    }
  } else if (playerAffinity === 'neutral' && oppAffinity !== 'neutral') {
    outcome = 'opp_win';
    bannerTitle = '💀 SHATTERED FORMATION!';
    bannerSub = `적의 유효 족보 [${oppSynergy.name}]에 아군의 기본 전술이 압도당했습니다!`;
    narrative = `아군이 족보를 완성하지 못한 틈을 타 적의 [${oppSynergy.name}]이 작렬합니다! (적군 ${oppScore}점 vs 아군 ${playerScore}점)`;
    icon = '💀';
  } else if (oppAffinity === 'neutral' && playerAffinity !== 'neutral') {
    outcome = 'player_win';
    bannerTitle = '🏆 FLAWLESS STRIKE!';
    bannerSub = `아군의 유효 족보 [${playerSynergy.name}]이 적의 어설픈 진형을 분쇄했습니다!`;
    narrative = `적군이 족보를 갖추지 못한 사이 아군의 [${playerSynergy.name}]이 일방적으로 전장을 장악합니다! (아군 ${playerScore}점 vs 적군 ${oppScore}점)`;
    icon = '🏆💥';
  }
  // 3. 3대 계열 주간 가위바위보 상성 순환 판정
  else if (
    (playerAffinity === 'burst' || playerAffinity === 'guard' || playerAffinity === 'trick') &&
    (oppAffinity === 'burst' || oppAffinity === 'guard' || oppAffinity === 'trick') &&
    playerAffinity !== oppAffinity
  ) {
    const playerBeatsOpp = weeklyRule.beats[playerAffinity] === oppAffinity;
    const oppBeatsPlayer = weeklyRule.beats[oppAffinity] === playerAffinity;

    if (playerBeatsOpp) {
      outcome = 'player_win';
      bannerTitle = '🛡️ COUNTER BREAK!!';
      bannerSub = `[${weeklyRule.title}] 아군의 ${FEVER_AFFINITY_META[playerAffinity].label}가 적의 ${FEVER_AFFINITY_META[oppAffinity].label}를 요격했습니다!`;
      narrative = `이번 주의 차원율 (${weeklyRule.relationText})에 따라 아군의 [${playerSynergy.name}]이 적의 피버를 상쇄하고 작렬합니다!`;
      icon = '🛡️💥';
    } else if (oppBeatsPlayer) {
      outcome = 'opp_win';
      bannerTitle = '💀 COUNTERED BY OPPONENT!';
      bannerSub = `[${weeklyRule.title}] 적군의 ${FEVER_AFFINITY_META[oppAffinity].label}가 아군의 ${FEVER_AFFINITY_META[playerAffinity].label}를 요격했습니다!`;
      narrative = `이번 주의 차원율 (${weeklyRule.relationText})에 따라 아군의 [${playerSynergy.name}]이 상쇄당했습니다.`;
      icon = '💀🛡️';
    }
  }
  // 4. 동일 계열 간의 티어(Hand Rank) & 파워 & 배지 총점 비교
  else {
    if (playerRank > oppRank) {
      outcome = 'player_win';
      bannerTitle = '🏆 SUPERIOR HAND!';
      bannerSub = `동일 계열 대결에서 아군의 상위 족보 [${playerSynergy.name}]이 적의 [${oppSynergy.name}]을 제압했습니다!`;
      narrative = `아군의 핸드 파워(${playerRank}등급 vs ${oppRank}등급)가 우세하여 적의 피버를 억누르고 선제타를 날립니다!`;
      icon = '🏆';
    } else if (oppRank > playerRank) {
      outcome = 'opp_win';
      bannerTitle = '💀 INFERIOR HAND!';
      bannerSub = `동일 계열 대결에서 적군의 상위 족보 [${oppSynergy.name}]에 밀렸습니다!`;
      narrative = `적군의 핸드 파워(${oppRank}등급 vs ${playerRank}등급)에 밀려 아군 피버가 상쇄당했습니다.`;
      icon = '💀';
    } else {
      // 랭크까지 동일하면 위력 배율 비교
      if (playerSynergy.powerMult > oppSynergy.powerMult) {
        outcome = 'player_win';
        bannerTitle = '⚡ POWER OVERWHELMING!';
        bannerSub = `동급 족보 격돌! 아군의 위력(${Math.round(playerSynergy.powerMult * 100)}%)이 적(${Math.round(oppSynergy.powerMult * 100)}%)을 압도했습니다!`;
        narrative = `동일한 [${playerSynergy.name}] 격돌에서 아군의 완성도가 더 높아 우세를 점합니다!`;
        icon = '⚡';
      } else if (oppSynergy.powerMult > playerSynergy.powerMult) {
        outcome = 'opp_win';
        bannerTitle = '💀 OVERPOWERED!';
        bannerSub = `동급 족보 격돌에서 적군의 위력(${Math.round(oppSynergy.powerMult * 100)}%)에 밀렸습니다!`;
        narrative = `적군의 [${oppSynergy.name}] 위력에 밀려 아군이 충격을 흡수해야 합니다.`;
        icon = '💀';
      } else {
        // 배율까지 동일하면 뱃지 가중치 총점(Score) 비교
        if (playerScore > oppScore) {
          outcome = 'player_win';
          bannerTitle = '⚡ HIGH SCORE TIEBREAKER!';
          bannerSub = `동급 족보 대결! 아군의 뱃지 총점(${playerScore}점)이 적군(${oppScore}점)을 제치고 우위를 점했습니다!`;
          narrative = `동일한 [${playerSynergy.name}] 대결에서 아군의 뱃지 가중치가 앞서 승리합니다!`;
          icon = '⚡🏆';
        } else if (oppScore > playerScore) {
          outcome = 'opp_win';
          bannerTitle = '💀 OPPONENT HIGH SCORE!';
          bannerSub = `동급 족보 대결에서 적군의 뱃지 총점(${oppScore}점)에 밀렸습니다!`;
          narrative = `적군의 뱃지 가중치 점수가 더 높아 아군 피버가 상쇄당했습니다.`;
          icon = '💀';
        } else {
          outcome = 'clash';
          bannerTitle = '⚔️ FEVER PUSH (CLASH)!';
          bannerSub = '완벽한 동급의 족보가 맞부딪혀 양측 에너지가 동시 폭발합니다!';
          narrative = `[${playerSynergy.name}] vs [${oppSynergy.name}]! 양측의 피버 위력이 절반으로 감쇄되어 동시 작렬합니다.`;
          icon = '⚔️💥';
        }
      }
    }
  }

  return {
    outcome,
    playerSynergy,
    oppSynergy,
    playerAffinity,
    oppAffinity,
    playerScore,
    oppScore,
    weeklyRuleTitle: weeklyRule.title,
    bannerTitle,
    bannerSub,
    narrative,
    icon
  };
}
