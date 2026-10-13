import { FallenHero, Mercenary, ActiveAncestralBlessing, MercenaryGrade, PartySynergy } from '../types/game';

export interface AncestralBlessingConfig {
  id: string;
  classId: string;
  name: string;
  icon: string;
  baseDescription: string;
  baseBuffs: PartySynergy['buffs'];
}

/** 🌟 용병 등급별 영령의 가호 수치 강화 배율 */
export const GRADE_BLESSING_MULT: Record<MercenaryGrade, number> = {
  rookie: 1.00,  // N등급: 기본 (100%)
  veteran: 1.25, // V등급: 1.25배
  hero: 1.50,    // H등급: 1.50배
  elite: 1.50,   // H등급(엘리트 호환)
  epic: 1.80,    // E등급: 1.80배
  legend: 2.20,  // L등급: 2.20배 (최대)
};

/** 🔮 용병 등급별 공물(에테르) 소모량 (30개 ~ 100개) */
export const GRADE_OFFERING_ETHER_COST: Record<MercenaryGrade, number> = {
  rookie: 30,   // N등급: 30개
  veteran: 45,  // V등급: 45개
  hero: 60,     // H등급: 60개
  elite: 60,    // H등급(엘리트): 60개
  epic: 80,     // E등급: 80개
  legend: 100,  // L등급: 100개
};

export function getOfferingEtherCost(grade?: MercenaryGrade): number {
  if (!grade) return 30;
  return GRADE_OFFERING_ETHER_COST[grade] ?? 30;
}

/** 🪦 24종 전 클래스(전직 포함) 고유 영령의 가호 정의 */
export const ANCESTRAL_BLESSINGS_CONFIG: Record<string, AncestralBlessingConfig> = {
  // ── 1. 견습 기사 계열 (Tank) ──
  'squire': {
    id: 'blessing_squire',
    classId: 'squire',
    name: '초심자의 방패',
    icon: '🛡️',
    baseDescription: '선대 견습 기사의 숭고한 방진: 파티 방어력 +8%, 받는 피해 3% 경감',
    baseBuffs: { defBonus: 1.08, damageReductionPct: 0.03 }
  },
  'paladin': {
    id: 'blessing_paladin',
    classId: 'paladin',
    name: '빛의 성역',
    icon: '✨',
    baseDescription: '성기사의 거룩한 성역: 받는 피해 6% 경감, 매 턴 체력 1.5% 재생',
    baseBuffs: { damageReductionPct: 0.06, hpRegenPct: 0.015 }
  },
  'guardian': {
    id: 'blessing_guardian',
    classId: 'guardian',
    name: '철벽의 수호혼',
    icon: '🏰',
    baseDescription: '중장 보병의 굳건한 벽: 파티 방어력 +12%, 전열 엄호율 +15%',
    baseBuffs: { defBonus: 1.12, frontlineGuardPct: 0.15 }
  },
  'aegis_valkyrie': {
    id: 'blessing_aegis_valkyrie',
    classId: 'aegis_valkyrie',
    name: '발키리의 결계',
    icon: '👑',
    baseDescription: '성녀의 영원한 결계: 전투 개시 시 최대 HP 15% 보호막(3턴), 받는 피해 8% 감소',
    baseBuffs: { startBattleShieldPct: 0.15, startBattleShieldTurns: 3, damageReductionPct: 0.08 }
  },
  'fortress': {
    id: 'blessing_fortress',
    classId: 'fortress',
    name: '난공불락의 성벽',
    icon: '🏰',
    baseDescription: '포트리스의 거신 방벽: 파티 방어력 +18%, 받는 피해 12% 감소, 전열 엄호율 +25%',
    baseBuffs: { defBonus: 1.18, damageReductionPct: 0.12, frontlineGuardPct: 0.25 }
  },

  // ── 2. 그림자 수련생 계열 (Rogue / Dealer Physical) ──
  'rogue': {
    id: 'blessing_rogue',
    classId: 'rogue',
    name: '그림자 발걸음',
    icon: '💨',
    baseDescription: '그림자 수련생의 기민함: 파티 속도 +6%, 중열 회피율 +8%',
    baseBuffs: { spdBonus: 1.06, midRowEvasionBonus: 0.08 }
  },
  'assassin': {
    id: 'blessing_assassin',
    classId: 'assassin',
    name: '치명적 급소',
    icon: '🗡️',
    baseDescription: '암살자의 냉혹한 관통: 파티 치명타율 +7%, 적 방어 관통 +10%',
    baseBuffs: { critRateBonus: 7, defPenetrationBonus: 10 }
  },
  'duelist': {
    id: 'blessing_duelist',
    classId: 'duelist',
    name: '환영의 검무',
    icon: '⚔️',
    baseDescription: '결투사의 유려한 칼날: 치명타 피해 +20%, 중열 회피율 +10%',
    baseBuffs: { critDmgBonus: 0.20, midRowEvasionBonus: 0.10 }
  },
  'shadow_phantom': {
    id: 'blessing_shadow_phantom',
    classId: 'shadow_phantom',
    name: '심연의 유령참',
    icon: '👤',
    baseDescription: '망령의 시공간 절삭: 치명타율 +10%, 치명타 피해 +25%, 방어 관통 +15%',
    baseBuffs: { critRateBonus: 10, critDmgBonus: 0.25, defPenetrationBonus: 15 }
  },
  'blade_dancer': {
    id: 'blessing_blade_dancer',
    classId: 'blade_dancer',
    name: '만화경의 검무',
    icon: '⚔️',
    baseDescription: '환영 검성의 극의: 파티 속도 +12%, 회피율 +15%, 치명타 피해 +30%',
    baseBuffs: { spdBonus: 1.12, midRowEvasionBonus: 0.15, critDmgBonus: 0.30 }
  },

  // ── 3. 원소 학도 계열 (Mage / Dealer Magical) ──
  'apprentice': {
    id: 'blessing_apprentice',
    classId: 'apprentice',
    name: '원소의 통찰',
    icon: '🔮',
    baseDescription: '학도의 순수한 마도: 매 턴 마나 +3 MP 회복, 파티 속도 +5%',
    baseBuffs: { mpRegenPerTurn: 3, spdBonus: 1.05 }
  },
  'elementalist': {
    id: 'blessing_elementalist',
    classId: 'elementalist',
    name: '초신성의 잔향',
    icon: '☄️',
    baseDescription: '대마도사의 원소 과부하: 파티 공격력 +10%, 매 턴 마나 +4 MP 회복',
    baseBuffs: { atkBonus: 1.10, mpRegenPerTurn: 4 }
  },
  'arcane_scholar': {
    id: 'blessing_arcane_scholar',
    classId: 'arcane_scholar',
    name: '시공의 섭리',
    icon: '⏳',
    baseDescription: '비전 학자의 지혜: 매 턴 마나 +5 MP 회복, 행운 +8',
    baseBuffs: { mpRegenPerTurn: 5, luckBonus: 8 }
  },
  'calamity_mage': {
    id: 'blessing_calamity_mage',
    classId: 'calamity_mage',
    name: '종말의 마력핵',
    icon: '🌌',
    baseDescription: '아크 메이지의 파멸 마도: 파티 공격력 +15%, 전능력치 +6%',
    baseBuffs: { atkBonus: 1.15, allStatsBonus: 1.06 }
  },
  'chronomancer': {
    id: 'blessing_chronomancer',
    classId: 'chronomancer',
    name: '영원의 시공간',
    icon: '⏳',
    baseDescription: '시공 조율사의 인피니티: 매 턴 마나 +6 MP 회복, 파티 속도 +10%, 전능력치 +6%',
    baseBuffs: { mpRegenPerTurn: 6, spdBonus: 1.10, allStatsBonus: 1.06 }
  },

  // ── 4. 견습 사제 계열 (Healer) ──
  'acolyte': {
    id: 'blessing_acolyte',
    classId: 'acolyte',
    name: '치유의 은총',
    icon: '💖',
    baseDescription: '견습 사제의 기도: 매 턴 체력 2% 재생, 파티 최대 체력 +8%',
    baseBuffs: { hpRegenPct: 0.02, maxHpBonus: 1.08 }
  },
  'bishop': {
    id: 'blessing_bishop',
    classId: 'bishop',
    name: '성스러운 축복',
    icon: '☀️',
    baseDescription: '주교의 자애: 파티 방어력 +10%, 매 턴 체력 2.5% 재생, 개시 보호막 +10%',
    baseBuffs: { defBonus: 1.10, hpRegenPct: 0.025, startBattleShieldPct: 0.10, startBattleShieldTurns: 2 }
  },
  'war_priest': {
    id: 'blessing_war_priest',
    classId: 'war_priest',
    name: '성전사의 투지',
    icon: '🏛️',
    baseDescription: '전투 사제의 신앙: 파티 공격력 +8%, 치명타율 +6%, 흡혈 +5%',
    baseBuffs: { atkBonus: 1.08, critRateBonus: 6, drainBonus: 5 }
  },
  'high_saintess': {
    id: 'blessing_high_saintess',
    classId: 'high_saintess',
    name: '영원한 구원의 빛',
    icon: '🕊️',
    baseDescription: '구원자의 불멸 성가: 매 턴 체력 3.5% 및 마나 +4 MP 재생, 전능력치 +8%',
    baseBuffs: { hpRegenPct: 0.035, mpRegenPerTurn: 4, allStatsBonus: 1.08 }
  },
  'crusader_lord': {
    id: 'blessing_crusader_lord',
    classId: 'crusader_lord',
    name: '성전의 심판령',
    icon: '⚖️',
    baseDescription: '성전 심판관의 권능: 파티 공격력 +12%, 매 턴 체력 3% 재생, 흡혈 +7%',
    baseBuffs: { atkBonus: 1.12, hpRegenPct: 0.03, drainBonus: 7 }
  },

  // ── 5. 용병 검사 계열 (Berserker / Dealer Frontline) ──
  'vanguard': {
    id: 'blessing_vanguard',
    classId: 'vanguard',
    name: '전사의 투혼',
    icon: '🗡️',
    baseDescription: '용병 검사의 투지: 파티 공격력 +8%, 최대 체력 +6%',
    baseBuffs: { atkBonus: 1.08, maxHpBonus: 1.06 }
  },
  'berserker': {
    id: 'blessing_berserker',
    classId: 'berserker',
    name: '피의 맹세',
    icon: '🩸',
    baseDescription: '광전사의 분노: 파티 공격력 +12%, 흡혈 +6%, 저체력 처형 피해 +15%',
    baseBuffs: { atkBonus: 1.12, drainBonus: 6, lowHpExecuteBonus: 0.15 }
  },
  'warlord': {
    id: 'blessing_warlord',
    classId: 'warlord',
    name: '불패의 통솔력',
    icon: '🚩',
    baseDescription: '전술 지휘관의 진격: 파티 전능력치 +6%, 속도 +8%, 받는 피해 5% 감소',
    baseBuffs: { allStatsBonus: 1.06, spdBonus: 1.08, damageReductionPct: 0.05 }
  },
  'valhalla_blade': {
    id: 'blessing_valhalla_blade',
    classId: 'valhalla_blade',
    name: '발할라의 영광',
    icon: '🌋',
    baseDescription: '불멸 전사의 분노: 파티 공격력 +16%, 치명타 피해 +25%, 흡혈 +8%',
    baseBuffs: { atkBonus: 1.16, critDmgBonus: 0.25, drainBonus: 8 }
  },
  'iron_marshal': {
    id: 'blessing_iron_marshal',
    classId: 'iron_marshal',
    name: '불패의 군세',
    icon: '🚩',
    baseDescription: '철혈 패황의 지휘령: 파티 공격력 +15%, 방어력 +12%, 받는 피해 8% 감소',
    baseBuffs: { atkBonus: 1.15, defBonus: 1.12, damageReductionPct: 0.08 }
  },

  // ── 6. 마총 수련생 계열 (Gunner) ──
  'gunner': {
    id: 'blessing_gunner',
    classId: 'gunner',
    name: '마도 조준경',
    icon: '🎯',
    baseDescription: '마총사의 사격술: 파티 치명타율 +6%, 속도 +5%',
    baseBuffs: { critRateBonus: 6, spdBonus: 1.05 }
  },
  'tactical_gunner': {
    id: 'blessing_tactical_gunner',
    classId: 'tactical_gunner',
    name: '전술 분석망',
    icon: '🚀',
    baseDescription: '전술 포수의 궤도 분석: 적 방어 관통 +12%, 파티 속도 +8%',
    baseBuffs: { defPenetrationBonus: 12, spdBonus: 1.08 }
  },
  'sharpshooter': {
    id: 'blessing_sharpshooter',
    classId: 'sharpshooter',
    name: '정밀 저격안',
    icon: '💥',
    baseDescription: '심연 저격수의 일격: 파티 치명타율 +10%, 치명타 피해 +25%',
    baseBuffs: { critRateBonus: 10, critDmgBonus: 0.25 }
  },
  'aether_gun_meister': {
    id: 'blessing_aether_gun_meister',
    classId: 'aether_gun_meister',
    name: '하이퍼 에테르 코어',
    icon: '⚡',
    baseDescription: '하이퍼 레인저의 출력: 방어 관통 +18%, 치명타율 +12%, 턴당 마나 +4 MP',
    baseBuffs: { defPenetrationBonus: 18, critRateBonus: 12, mpRegenPerTurn: 4 }
  },
  'ghost_sniper': {
    id: 'blessing_ghost_sniper',
    classId: 'ghost_sniper',
    name: '사신의 절대 탄환',
    icon: '💥',
    baseDescription: '사신 저격수의 암살안: 파티 치명타율 +15%, 치명타 피해 +35%, 방어 관통 +20%',
    baseBuffs: { critRateBonus: 15, critDmgBonus: 0.35, defPenetrationBonus: 20 }
  }
};

/**
 * 🪦 전사한 영웅 정보를 기반으로 등급(N~L) 배율이 적용된 활성 영령의 가호 객체 생성
 */
export function createActiveBlessingForHero(hero: FallenHero | Mercenary): ActiveAncestralBlessing {
  const config = ANCESTRAL_BLESSINGS_CONFIG[hero.classId] || ANCESTRAL_BLESSINGS_CONFIG['squire'];
  const mult = GRADE_BLESSING_MULT[hero.grade] || 1.0;

  const scaledBuffs: PartySynergy['buffs'] = {};

  if (config.baseBuffs.allStatsBonus) {
    const bonus = (config.baseBuffs.allStatsBonus - 1) * mult;
    scaledBuffs.allStatsBonus = Number((1 + bonus).toFixed(3));
  }
  if (config.baseBuffs.atkBonus) {
    const bonus = (config.baseBuffs.atkBonus - 1) * mult;
    scaledBuffs.atkBonus = Number((1 + bonus).toFixed(3));
  }
  if (config.baseBuffs.defBonus) {
    const bonus = (config.baseBuffs.defBonus - 1) * mult;
    scaledBuffs.defBonus = Number((1 + bonus).toFixed(3));
  }
  if (config.baseBuffs.spdBonus) {
    const bonus = (config.baseBuffs.spdBonus - 1) * mult;
    scaledBuffs.spdBonus = Number((1 + bonus).toFixed(3));
  }
  if (config.baseBuffs.maxHpBonus) {
    const bonus = (config.baseBuffs.maxHpBonus - 1) * mult;
    scaledBuffs.maxHpBonus = Number((1 + bonus).toFixed(3));
  }
  if (config.baseBuffs.hpRegenPct) {
    scaledBuffs.hpRegenPct = Number((config.baseBuffs.hpRegenPct * mult).toFixed(3));
  }
  if (config.baseBuffs.mpRegenPerTurn) {
    scaledBuffs.mpRegenPerTurn = Math.round(config.baseBuffs.mpRegenPerTurn * mult);
  }
  if (config.baseBuffs.critRateBonus) {
    scaledBuffs.critRateBonus = Math.round(config.baseBuffs.critRateBonus * mult);
  }
  if (config.baseBuffs.critDmgBonus) {
    scaledBuffs.critDmgBonus = Number((config.baseBuffs.critDmgBonus * mult).toFixed(3));
  }
  if (config.baseBuffs.defPenetrationBonus) {
    scaledBuffs.defPenetrationBonus = Math.round(config.baseBuffs.defPenetrationBonus * mult);
  }
  if (config.baseBuffs.drainBonus) {
    scaledBuffs.drainBonus = Math.round(config.baseBuffs.drainBonus * mult);
  }
  if (config.baseBuffs.damageReductionPct) {
    scaledBuffs.damageReductionPct = Number((config.baseBuffs.damageReductionPct * mult).toFixed(3));
  }
  if (config.baseBuffs.startBattleShieldPct) {
    scaledBuffs.startBattleShieldPct = Number((config.baseBuffs.startBattleShieldPct * mult).toFixed(3));
    scaledBuffs.startBattleShieldTurns = config.baseBuffs.startBattleShieldTurns || 2;
  }
  if (config.baseBuffs.lowHpExecuteBonus) {
    scaledBuffs.lowHpExecuteBonus = Number((config.baseBuffs.lowHpExecuteBonus * mult).toFixed(3));
  }
  if (config.baseBuffs.midRowEvasionBonus) {
    scaledBuffs.midRowEvasionBonus = Number((config.baseBuffs.midRowEvasionBonus * mult).toFixed(3));
  }
  if (config.baseBuffs.frontlineGuardPct) {
    scaledBuffs.frontlineGuardPct = Number((config.baseBuffs.frontlineGuardPct * mult).toFixed(3));
  }
  if (config.baseBuffs.luckBonus) {
    scaledBuffs.luckBonus = Math.round(config.baseBuffs.luckBonus * mult);
  }

  // 설명 텍스트 동적 빌드
  const effectParts: string[] = [];
  if (scaledBuffs.allStatsBonus) effectParts.push(`전능력치 +${Math.round((scaledBuffs.allStatsBonus - 1) * 100)}%`);
  if (scaledBuffs.atkBonus) effectParts.push(`공격력 +${Math.round((scaledBuffs.atkBonus - 1) * 100)}%`);
  if (scaledBuffs.defBonus) effectParts.push(`방어력 +${Math.round((scaledBuffs.defBonus - 1) * 100)}%`);
  if (scaledBuffs.spdBonus) effectParts.push(`속도 +${Math.round((scaledBuffs.spdBonus - 1) * 100)}%`);
  if (scaledBuffs.maxHpBonus) effectParts.push(`최대 HP +${Math.round((scaledBuffs.maxHpBonus - 1) * 100)}%`);
  if (scaledBuffs.hpRegenPct) effectParts.push(`매 턴 체력 +${(scaledBuffs.hpRegenPct * 100).toFixed(1)}% 재생`);
  if (scaledBuffs.mpRegenPerTurn) effectParts.push(`매 턴 마나 +${scaledBuffs.mpRegenPerTurn} MP`);
  if (scaledBuffs.critRateBonus) effectParts.push(`치명타율 +${scaledBuffs.critRateBonus}%`);
  if (scaledBuffs.critDmgBonus) effectParts.push(`치명타 피해 +${Math.round(scaledBuffs.critDmgBonus * 100)}%`);
  if (scaledBuffs.defPenetrationBonus) effectParts.push(`방어 관통 +${scaledBuffs.defPenetrationBonus}%`);
  if (scaledBuffs.drainBonus) effectParts.push(`흡혈 +${scaledBuffs.drainBonus}%`);
  if (scaledBuffs.damageReductionPct) effectParts.push(`받는 피해 ${Math.round(scaledBuffs.damageReductionPct * 100)}% 감소`);
  if (scaledBuffs.startBattleShieldPct) effectParts.push(`전투 개시 보호막 ${Math.round(scaledBuffs.startBattleShieldPct * 100)}%`);
  if (scaledBuffs.midRowEvasionBonus) effectParts.push(`중열 회피율 +${Math.round(scaledBuffs.midRowEvasionBonus * 100)}%`);
  if (scaledBuffs.frontlineGuardPct) effectParts.push(`전열 엄호율 +${Math.round(scaledBuffs.frontlineGuardPct * 100)}%`);
  if (scaledBuffs.luckBonus) effectParts.push(`행운 +${scaledBuffs.luckBonus}`);

  const gradeLabel = hero.grade.toUpperCase();
  const desc = `[${hero.name} (Lv.${hero.level} ${gradeLabel})]의 영령 가호: ${effectParts.join(', ')}`;

  return {
    heroId: hero.id,
    heroName: hero.name,
    heroTitle: hero.title || '방주의 결사대원',
    heroLevel: hero.level,
    classId: hero.classId,
    grade: hero.grade,
    blessingId: config.id,
    name: config.name,
    icon: config.icon,
    description: desc,
    buffs: scaledBuffs,
    activatedAt: Date.now()
  };
}
