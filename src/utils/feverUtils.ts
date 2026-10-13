import { FeverBadgeType, FeverBadgeMeta, FeverSynergyResult, FeverSynergyId } from '../types/fever';
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
