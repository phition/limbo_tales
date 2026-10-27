import { GameResources, Skill } from '../types/game';

export interface GrimoireRecipe {
  id: string;
  name: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  tier?: number;
  icon?: string;
  reqAlchemyLv: number;
  cost: Partial<GameResources>;
  desc: string;
  skill: Skill;
  category?: 'class_base' | 'class_advanced' | 'class_master' | 'ancient';
  sourceClass?: string;
}

export const GRIMOIRE_CRAFT_SUCCESS_RATES: Record<'common' | 'rare' | 'epic' | 'legendary', number> = {
  common: 80,
  rare: 50,
  epic: 30,
  legendary: 10,
};

export const GRIMOIRE_RARITY_REQ_ALCHEMIST_LV: Record<'common' | 'rare' | 'epic' | 'legendary', number> = {
  common: 1,
  rare: 3,
  epic: 5,
  legendary: 7,
};

export const GRIMOIRE_CRAFT_RECIPES: GrimoireRecipe[] = [
  // =========================================================================
  // ── 1. 일반 등급 (Common) - 공방 Lv.1 ~ Lv.2 [기본 클래스 스킬 마도서] ──
  // =========================================================================
  {
    id: 'squire_shield_slam',
    name: '마도서: 방패 강타',
    rarity: 'common',
    reqAlchemyLv: 1,
    sourceClass: '종자',
    cost: { ether: 25, iron: 15, gold: 120 },
    desc: '적 1체에게 130% 물리 피해를 입히고 1턴간 기절시킵니다.',
    skill: {
      id: 'squire_shield_slam',
      name: '방패 강타',
      description: '적 1체 130% 물리 피해 + 1턴 기절',
      manaCost: 15,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 1.3,
      effectType: 'stun',
      statusDuration: 1,
      positionBonus: 'front',
      icon: '🛡️'
    }
  },
  {
    id: 'squire_strike',
    name: '마도서: 단련된 일격',
    rarity: 'common',
    reqAlchemyLv: 1,
    sourceClass: '종자',
    cost: { ether: 25, wood: 15, gold: 120 },
    desc: '단련된 칼끝으로 적 1체에게 120% 물리 피해를 입힙니다.',
    skill: {
      id: 'squire_strike',
      name: '단련된 일격',
      description: '적 1체 120% 물리 피해',
      manaCost: 8,
      cooldown: 0,
      targetType: 'single_enemy',
      power: 1.2,
      effectType: 'damage',
      positionBonus: 'front',
      icon: '⚔️'
    }
  },
  {
    id: 'rogue_shadow_strike',
    name: '마도서: 그림자 베기',
    rarity: 'common',
    reqAlchemyLv: 1,
    sourceClass: '도적',
    cost: { ether: 25, leather: 15, gold: 120 },
    desc: '적 1체에게 135% 치명 참격을 가합니다. (치명타율 +30%)',
    skill: {
      id: 'rogue_shadow_strike',
      name: '그림자 베기',
      description: '적 1체 135% 참격 피해 (치명타율 +30%)',
      manaCost: 12,
      cooldown: 1,
      targetType: 'single_enemy',
      power: 1.35,
      effectType: 'damage',
      positionBonus: 'front',
      icon: '🗡️'
    }
  },
  {
    id: 'rogue_shadow_dance',
    name: '마도서: 암영 난무',
    rarity: 'common',
    reqAlchemyLv: 1,
    sourceClass: '도적',
    cost: { ether: 25, herb: 15, gold: 120 },
    desc: '그림자 속을 춤추며 적 1체에 140% 피해를 입히고 2턴간 출혈을 부여합니다.',
    skill: {
      id: 'rogue_shadow_dance',
      name: '암영 난무',
      description: '적 1체 140% 피해 + 2턴간 출혈',
      manaCost: 16,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 1.4,
      effectType: 'bleed',
      statusDuration: 2,
      positionBonus: 'front',
      icon: '💨'
    }
  },
  {
    id: 'van_cleave',
    name: '마도서: 전열 가르기',
    rarity: 'common',
    reqAlchemyLv: 1,
    sourceClass: '돌격병',
    cost: { ether: 25, stone: 15, gold: 120 },
    desc: '대검을 크게 휘둘러 적 전열 전체에 110% 참격 피해를 입힙니다.',
    skill: {
      id: 'van_cleave',
      name: '전열 가르기',
      description: '적 전열에 110% 광역 참격 피해',
      manaCost: 14,
      cooldown: 1,
      targetType: 'all_enemies',
      power: 1.1,
      effectType: 'damage',
      positionBonus: 'front',
      icon: '🪓'
    }
  },
  {
    id: 'van_charge',
    name: '마도서: 돌파 돌격',
    rarity: 'common',
    reqAlchemyLv: 1,
    sourceClass: '돌격병',
    cost: { ether: 25, bone: 15, gold: 120 },
    desc: '적 1체에게 140% 돌격 강타를 가하고 1턴간 기절시킵니다.',
    skill: {
      id: 'van_charge',
      name: '돌파 돌격',
      description: '적 1체 140% 돌격 강타 + 1턴 기절',
      manaCost: 15,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 1.4,
      effectType: 'stun',
      statusDuration: 1,
      positionBonus: 'front',
      icon: '💥'
    }
  },
  {
    id: 'gun_quickshot',
    name: '마도서: 속사',
    rarity: 'common',
    reqAlchemyLv: 2,
    sourceClass: '사수',
    cost: { ether: 45, iron: 20, gold: 200 },
    desc: '적 1체에게 재빠른 2연속 사격으로 125% 물리 피해를 입힙니다.',
    skill: {
      id: 'gun_quickshot',
      name: '속사',
      description: '적 1체 125% 고속 사격 피해',
      manaCost: 10,
      cooldown: 1,
      targetType: 'single_enemy',
      power: 1.25,
      effectType: 'damage',
      positionBonus: 'back',
      icon: '🔫'
    }
  },
  {
    id: 'gun_buckshot',
    name: '마도서: 산탄 사격',
    rarity: 'common',
    reqAlchemyLv: 2,
    sourceClass: '사수',
    cost: { ether: 45, coal: 20, gold: 200 },
    desc: '산탄을 넓게 발사하여 적 전체에 105% 물리 피해를 가합니다.',
    skill: {
      id: 'gun_buckshot',
      name: '산탄 사격',
      description: '적 전체에 105% 산탄 광역 피해',
      manaCost: 18,
      cooldown: 2,
      targetType: 'all_enemies',
      power: 1.05,
      effectType: 'damage',
      positionBonus: 'back',
      icon: '💥'
    }
  },
  {
    id: 'apprentice_bolt',
    name: '마도서: 에테르 볼트',
    rarity: 'common',
    reqAlchemyLv: 2,
    sourceClass: '원소 학도',
    cost: { ether: 50, crystal: 2, gold: 200 },
    desc: '응축된 순수 마나 화살을 쏘아 적 1체에게 135% 마법 피해를 가합니다.',
    skill: {
      id: 'apprentice_bolt',
      name: '에테르 볼트',
      description: '적 1체 135% 순수 마법 피해',
      manaCost: 12,
      cooldown: 0,
      targetType: 'single_enemy',
      power: 1.35,
      effectType: 'damage',
      positionBonus: 'back',
      icon: '✨'
    }
  },
  {
    id: 'apprentice_flame',
    name: '마도서: 원소 폭발',
    rarity: 'common',
    reqAlchemyLv: 2,
    sourceClass: '원소 학도',
    cost: { ether: 50, coal: 20, gold: 200 },
    desc: '에테르 불길을 폭발시켜 모든 적에게 81% 화염 광역 피해를 가하고 화상을 부여합니다.',
    skill: {
      id: 'apprentice_flame',
      name: '원소 폭발',
      description: '모든 적에게 81% 화염 광역 피해 및 화상 부여.',
      manaCost: 36,
      cooldown: 3,
      targetType: 'all_enemies',
      power: 0.81,
      effectType: 'burn',
      statusDuration: 2,
      positionBonus: 'back',
      icon: '🔥'
    }
  },
  {
    id: 'acolyte_heal',
    name: '마도서: 성광의 치유',
    rarity: 'common',
    reqAlchemyLv: 2,
    sourceClass: '복사',
    cost: { ether: 45, herb: 25, gold: 200 },
    desc: '가장 체력이 낮은 아군 1명의 HP를 공격력의 150%만큼 즉시 회복시킵니다.',
    skill: {
      id: 'acolyte_heal',
      name: '성광의 치유',
      description: '단일 아군 공격력 150% 즉시 치유',
      manaCost: 14,
      cooldown: 1,
      targetType: 'single_ally',
      power: 1.5,
      effectType: 'heal',
      icon: '💚'
    }
  },
  {
    id: 'acolyte_smite',
    name: '마도서: 신성 일격',
    rarity: 'common',
    reqAlchemyLv: 2,
    sourceClass: '복사',
    cost: { ether: 45, silk: 15, gold: 200 },
    desc: '적 1체에게 130% 신성 마법 피해를 입히고 언데드/악마에게 1.5배 피해를 줍니다.',
    skill: {
      id: 'acolyte_smite',
      name: '신성 일격',
      description: '적 1체 130% 신성 피해 (언데드 특효)',
      manaCost: 12,
      cooldown: 1,
      targetType: 'single_enemy',
      power: 1.3,
      effectType: 'damage',
      icon: '☀️'
    }
  },
  {
    id: 'craft_barrier',
    name: '비전서: 수호의 방패',
    rarity: 'common',
    reqAlchemyLv: 1,
    cost: { ether: 30, stone: 20, gold: 120 },
    desc: '자신에게 100% 보호막을 2턴간 부여합니다.',
    skill: {
      id: 'skill_craft_barrier',
      name: '수호의 방패',
      description: '자신 100% 보호막 (2턴)',
      manaCost: 12,
      cooldown: 1,
      targetType: 'self',
      power: 1.0,
      effectType: 'shield',
      statusDuration: 2,
      icon: '🛡️'
    }
  },
  {
    id: 'craft_first_aid',
    name: '비전서: 응급 회복',
    rarity: 'common',
    reqAlchemyLv: 1,
    cost: { ether: 30, herb: 15, gold: 120 },
    desc: '단일 아군 HP를 25% 즉시 회복합니다.',
    skill: {
      id: 'skill_craft_first_aid',
      name: '응급 회복',
      description: '단일 아군 HP 25% 회복',
      manaCost: 14,
      cooldown: 1,
      targetType: 'single_ally',
      power: 0.25,
      effectType: 'heal',
      icon: '🩹'
    }
  },

  // =========================================================================
  // ── 2. 희귀 등급 (Rare) - 공방 Lv.3 ~ Lv.4 [1차 전직 클래스 핵심 스킬 마도서] ──
  // =========================================================================
  {
    id: 'paladin_judgment',
    name: '마도서: 심판의 빛',
    rarity: 'rare',
    reqAlchemyLv: 3,
    sourceClass: '성기사',
    cost: { ether: 90, crystal: 3, gold: 400 },
    desc: '적 1체에게 160% 신성 강타를 가하고 2턴간 방어력을 20% 감소시킵니다.',
    skill: {
      id: 'paladin_judgment',
      name: '심판의 빛',
      description: '적 1체 160% 신성 피해 + 2턴 방어 20% 감소',
      manaCost: 20,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 1.6,
      effectType: 'damage',
      positionBonus: 'front',
      icon: '✨'
    }
  },
  {
    id: 'paladin_shield',
    name: '마도서: 신성 방벽',
    rarity: 'rare',
    reqAlchemyLv: 3,
    sourceClass: '성기사',
    cost: { ether: 90, iron: 25, gold: 400 },
    desc: '아군 전체에게 공격력의 120% 보호막을 2턴간 부여합니다.',
    skill: {
      id: 'paladin_shield',
      name: '신성 방벽',
      description: '아군 전체 120% 보호막 (2턴)',
      manaCost: 24,
      cooldown: 2,
      targetType: 'all_allies',
      power: 1.2,
      effectType: 'shield',
      statusDuration: 2,
      icon: '🛡️'
    }
  },
  {
    id: 'guard_iron_wall',
    name: '마도서: 철벽 방어',
    rarity: 'rare',
    reqAlchemyLv: 3,
    sourceClass: '중장 보병',
    cost: { ether: 90, iron: 30, gold: 400 },
    desc: '자신에게 200% 대형 보호막을 치고 2턴간 도발 상태에 돌입합니다.',
    skill: {
      id: 'guard_iron_wall',
      name: '철벽 방어',
      description: '자신 200% 보호막 + 2턴 도발',
      manaCost: 18,
      cooldown: 2,
      targetType: 'self',
      power: 2.0,
      effectType: 'shield',
      statusDuration: 2,
      positionBonus: 'front',
      icon: '🏰'
    }
  },
  {
    id: 'guard_shield_bash',
    name: '마도서: 철퇴 강타',
    rarity: 'rare',
    reqAlchemyLv: 3,
    sourceClass: '중장 보병',
    cost: { ether: 90, stone: 30, gold: 400 },
    desc: '적 1체에게 150% 물리 피해를 입히고 1턴간 기절시킵니다.',
    skill: {
      id: 'guard_shield_bash',
      name: '철퇴 강타',
      description: '적 1체 150% 강타 + 1턴 기절',
      manaCost: 18,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 1.5,
      effectType: 'stun',
      statusDuration: 1,
      positionBonus: 'front',
      icon: '🔨'
    }
  },
  {
    id: 'assassin_shadow_step',
    name: '마도서: 그림자 걸음',
    rarity: 'rare',
    reqAlchemyLv: 3,
    sourceClass: '암살자',
    cost: { ether: 90, silk: 20, gold: 400 },
    desc: '적 후열로 도약하여 180% 치명 일격을 가합니다.',
    skill: {
      id: 'assassin_shadow_step',
      name: '그림자 걸음',
      description: '[후열 저격] 적 후열 180% 치명 일격',
      manaCost: 18,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 1.8,
      effectType: 'damage',
      positionBonus: 'back',
      icon: '👤'
    }
  },
  {
    id: 'assassin_vital_strike',
    name: '마도서: 급소 찌르기',
    rarity: 'rare',
    reqAlchemyLv: 3,
    sourceClass: '암살자',
    cost: { ether: 90, bone: 25, gold: 400 },
    desc: '적 1체에게 160% 참격을 가하고 2턴간 치명적 출혈을 유발합니다.',
    skill: {
      id: 'assassin_vital_strike',
      name: '급소 찌르기',
      description: '적 1체 160% 참격 + 2턴 출혈',
      manaCost: 16,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 1.6,
      effectType: 'bleed',
      statusDuration: 2,
      positionBonus: 'front',
      icon: '🗡️'
    }
  },
  {
    id: 'duel_riposte',
    name: '마도서: 환영의 반격',
    rarity: 'rare',
    reqAlchemyLv: 3,
    sourceClass: '그림자 결투사',
    cost: { ether: 95, crystal: 3, gold: 420 },
    desc: '적 1체에 130% 피해를 입히고 2턴간 회피율 60% 상승 및 피격 시 즉시 반격합니다.',
    skill: {
      id: 'duel_riposte',
      name: '환영의 반격',
      description: '적 1체 130% 피해 + 2턴 회피 60% 및 즉시 반격',
      manaCost: 20,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 1.3,
      effectType: 'damage',
      positionBonus: 'front',
      icon: '⚔️'
    }
  },
  {
    id: 'duel_flurry',
    name: '마도서: 질풍 4연참',
    rarity: 'rare',
    reqAlchemyLv: 3,
    sourceClass: '그림자 결투사',
    cost: { ether: 95, iron: 25, gold: 420 },
    desc: '적 1체에게 4연속 고속 참격을 퍼부어 총 170% 피해를 입힙니다. (치명타율 +40%)',
    skill: {
      id: 'duel_flurry',
      name: '질풍 4연참',
      description: '[전열 특화] 적 1체 4연속 참격 (170% 피해, 치명타 +40%)',
      manaCost: 22,
      cooldown: 1,
      targetType: 'single_enemy',
      power: 1.7,
      effectType: 'damage',
      positionBonus: 'front',
      icon: '🗡️'
    }
  },
  {
    id: 'duel_blade_waltz',
    name: '마도서: 환영 난무 왈츠',
    rarity: 'rare',
    reqAlchemyLv: 4,
    sourceClass: '그림자 결투사',
    cost: { ether: 140, crystal: 5, gold: 600 },
    desc: '전장을 가르며 적 전체에 130% 참격을 가하고 2턴간 적들의 공격력을 30% 감소시킵니다.',
    skill: {
      id: 'duel_blade_waltz',
      name: '환영 난무 왈츠',
      description: '적 전체 130% 참격 피해 + 2턴간 적 공격력 30% 감소',
      manaCost: 28,
      cooldown: 3,
      targetType: 'all_enemies',
      power: 1.3,
      effectType: 'damage',
      statusDuration: 2,
      icon: '🌪️'
    }
  },
  {
    id: 'berserk_blood_slash',
    name: '마도서: 혈풍참',
    rarity: 'rare',
    reqAlchemyLv: 4,
    sourceClass: '광전사',
    cost: { ether: 130, bone: 30, gold: 550 },
    desc: '피의 회오리를 일으켜 적 전체에 125% 물리 피해를 입히고 출혈을 유발합니다.',
    skill: {
      id: 'berserk_blood_slash',
      name: '혈풍참',
      description: '적 전체 125% 물리 피해 + 2턴 출혈',
      manaCost: 22,
      cooldown: 2,
      targetType: 'all_enemies',
      power: 1.25,
      effectType: 'bleed',
      statusDuration: 2,
      positionBonus: 'front',
      icon: '🩸'
    }
  },
  {
    id: 'warlord_overwhelm',
    name: '마도서: 전열 압도',
    rarity: 'rare',
    reqAlchemyLv: 4,
    sourceClass: '전술 지휘관',
    cost: { ether: 140, iron: 30, gold: 600 },
    desc: '적 전체에 110% 대검 충격파를 가하고 공격력을 30% 약화 & 아군 전체 25% 보호막 부여',
    skill: {
      id: 'warlord_overwhelm',
      name: '전열 압도',
      description: '적 전체 110% 대검 충격파 + 공격력 30% 감소 & 아군 전체 25% 보호막',
      manaCost: 26,
      cooldown: 3,
      targetType: 'all_enemies',
      power: 1.1,
      effectType: 'damage',
      statusDuration: 2,
      positionBonus: 'front',
      icon: '🚩'
    }
  },
  {
    id: 'tac_penetration_shot',
    name: '마도서: 레일건 관통포',
    rarity: 'rare',
    reqAlchemyLv: 4,
    sourceClass: '전술 포수',
    cost: { ether: 135, iron: 35, gold: 580 },
    desc: '[후열 관통] 적 일렬을 25% 방어 관통하여 70% 물리 피해를 입힙니다.',
    skill: {
      id: 'tac_penetration_shot',
      name: '레일건 관통포',
      description: '[후열 관통] 적 일렬 25% 방어 관통하여 70% 물리 피해',
      manaCost: 45,
      cooldown: 3,
      targetType: 'all_enemies',
      power: 0.7,
      effectType: 'damage',
      positionBonus: 'back',
      piercePct: 25,
      icon: '⚡'
    }
  },
  {
    id: 'sniper_headshot',
    name: '마도서: 정밀 헤드샷',
    rarity: 'rare',
    reqAlchemyLv: 4,
    sourceClass: '심연의 저격수',
    cost: { ether: 140, bone: 30, gold: 600 },
    desc: '적 후열의 급소를 저격하여 220% 초치명타 일격을 꽂아넣습니다.',
    skill: {
      id: 'sniper_headshot',
      name: '정밀 헤드샷',
      description: '[후열 저격] 적 후열 220% 초치명타 저격',
      manaCost: 24,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 2.2,
      effectType: 'damage',
      positionBonus: 'back',
      icon: '🎯'
    }
  },
  {
    id: 'elem_chain_lightning',
    name: '마도서: 연쇄 번개',
    rarity: 'rare',
    reqAlchemyLv: 4,
    sourceClass: '대마도사',
    cost: { ether: 140, crystal: 6, gold: 600 },
    desc: '고압 전격을 방출하여 적 전체에 120% 전격 마법 피해를 가합니다.',
    skill: {
      id: 'elem_chain_lightning',
      name: '연쇄 번개',
      description: '적 전체 120% 전격 마법 피해',
      manaCost: 20,
      cooldown: 2,
      targetType: 'all_enemies',
      power: 1.2,
      effectType: 'damage',
      icon: '⚡'
    }
  },
  {
    id: 'elem_blizzard',
    name: '마도서: 혹한의 눈보라',
    rarity: 'rare',
    reqAlchemyLv: 4,
    sourceClass: '대마도사',
    cost: { ether: 140, crystal: 6, gold: 600 },
    desc: '적 전체에 110% 얼음 피해를 입히고 2턴간 냉각(빙결 유도) 상태로 만듭니다.',
    skill: {
      id: 'elem_blizzard',
      name: '혹한의 눈보라',
      description: '적 전체 110% 얼음 피해 + 2턴 냉각',
      manaCost: 24,
      cooldown: 3,
      targetType: 'all_enemies',
      power: 1.1,
      effectType: 'freeze',
      statusDuration: 2,
      icon: '❄️'
    }
  },
  {
    id: 'bishop_holy_sanctuary',
    name: '마도서: 성역 전개',
    rarity: 'rare',
    reqAlchemyLv: 4,
    sourceClass: '주교',
    cost: { ether: 135, herb: 35, gold: 580 },
    desc: '아군 전체의 HP를 공격력의 160%만큼 대량 치유합니다.',
    skill: {
      id: 'bishop_holy_sanctuary',
      name: '성역 전개',
      description: '아군 전체 160% 대량 광역 치유',
      manaCost: 26,
      cooldown: 2,
      targetType: 'all_allies',
      power: 1.6,
      effectType: 'heal',
      icon: '✨'
    }
  },
  {
    id: 'warpriest_smite_crusade',
    name: '마도서: 십자군 강타',
    rarity: 'rare',
    reqAlchemyLv: 4,
    sourceClass: '전투 사제',
    cost: { ether: 135, iron: 30, gold: 580 },
    desc: '적 1체에 160% 신성 피해를 가하고 아군 전원의 HP를 20% 회복합니다.',
    skill: {
      id: 'warpriest_smite_crusade',
      name: '십자군 강타',
      description: '적 1체 160% 신성 피해 & 아군 전원 20% 치유',
      manaCost: 22,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 1.6,
      effectType: 'damage',
      positionBonus: 'front',
      icon: '⚔️'
    }
  },

  // =========================================================================
  // ── 3. 영웅 등급 (Epic) - 공방 Lv.5 ~ Lv.6 [2차 각성 클래스 비전 마도서] ──
  // =========================================================================
  {
    id: 'valk_invincible',
    name: '고위 마도서: 불멸의 성역',
    rarity: 'epic',
    reqAlchemyLv: 5,
    sourceClass: '발키리',
    cost: { ether: 260, void_shard: 6, gold: 1200 },
    desc: '아군 전원에게 200% 신성 절대 방벽을 2턴간 전개합니다.',
    skill: {
      id: 'valk_invincible',
      name: '불멸의 성역',
      description: '아군 전체 200% 신성 방벽 (2턴)',
      manaCost: 32,
      cooldown: 3,
      targetType: 'all_allies',
      power: 2.0,
      effectType: 'shield',
      statusDuration: 2,
      icon: '👑'
    }
  },
  {
    id: 'phantom_clone',
    name: '고위 마도서: 분신 난무',
    rarity: 'epic',
    reqAlchemyLv: 5,
    sourceClass: '그림자 망령',
    cost: { ether: 260, void_shard: 6, gold: 1200 },
    desc: '적 전체에 130% 방어무시 암영 참격 피해를 가합니다.',
    skill: {
      id: 'phantom_clone',
      name: '분신 난무',
      description: '적 전체 130% 방어무시 참격 피해',
      manaCost: 28,
      cooldown: 2,
      targetType: 'all_enemies',
      power: 1.3,
      effectType: 'damage',
      icon: '👥'
    }
  },
  {
    id: 'valhalla_strike',
    name: '고위 마도서: 발할라 참격',
    rarity: 'epic',
    reqAlchemyLv: 5,
    sourceClass: '발할라 블레이드',
    cost: { ether: 260, void_shard: 6, gold: 1200 },
    desc: '자신의 잃은 체력에 비례하여 최대 250% 파멸의 참격을 적 1체에 꽂아넣습니다.',
    skill: {
      id: 'valhalla_strike',
      name: '발할라 참격',
      description: '적 1체 최대 250% 역전 참격 (잃은 체력 비례)',
      manaCost: 24,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 2.5,
      effectType: 'damage',
      positionBonus: 'front',
      icon: '⚔️'
    }
  },
  {
    id: 'hyper_orbital_cannon',
    name: '고위 마도서: 위성 궤도포',
    rarity: 'epic',
    reqAlchemyLv: 6,
    sourceClass: '하이퍼 레인저',
    cost: { ether: 320, void_shard: 8, gold: 1600 },
    desc: '우주 궤도에서 에테르 빔을 투하하여 적 전체에 180% 폭발 피해를 입힙니다.',
    skill: {
      id: 'hyper_orbital_cannon',
      name: '위성 궤도포',
      description: '적 전체 180% 궤도 폭격 피해',
      manaCost: 35,
      cooldown: 3,
      targetType: 'all_enemies',
      power: 1.8,
      effectType: 'damage',
      positionBonus: 'back',
      icon: '🛰️'
    }
  },
  {
    id: 'calamity_meteor',
    name: '고위 마도서: 종말의 메테오',
    rarity: 'epic',
    reqAlchemyLv: 6,
    sourceClass: '아크 메이지',
    cost: { ether: 340, void_shard: 10, gold: 1700 },
    desc: '거대한 운석을 소환하여 적 전체에 190% 화염 폭발 피해 및 3턴간 화상을 입힙니다.',
    skill: {
      id: 'calamity_meteor',
      name: '종말의 메테오',
      description: '적 전체 190% 화염 폭발 + 3턴 화상',
      manaCost: 36,
      cooldown: 3,
      targetType: 'all_enemies',
      power: 1.9,
      effectType: 'burn',
      statusDuration: 3,
      icon: '☄️'
    }
  },
  {
    id: 'craft_vampiric_edge',
    name: '고위 마도서: 흡혈의 흉인',
    rarity: 'epic',
    reqAlchemyLv: 6,
    cost: { ether: 320, void_shard: 8, bone: 40, gold: 1500 },
    desc: '단일 적에게 170% 피해를 입히고 가한 피해의 50%를 흡혈합니다.',
    skill: {
      id: 'skill_craft_vampiric_edge',
      name: '흡혈의 흉인',
      description: '단일 적 170% 피해 + 50% 흡혈',
      manaCost: 22,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 1.7,
      effectType: 'drain',
      icon: '🩸'
    }
  },

  // =========================================================================
  // ── 4. 전설 등급 (Legendary) - 공방 Lv.7 ~ Lv.10 [태초 및 고대 전설 마도서] ──
  // =========================================================================
  {
    id: 'craft_apocalypse',
    name: '고대 마도서: 아마겟돈',
    rarity: 'legendary',
    reqAlchemyLv: 7,
    cost: { ether: 500, void_shard: 15, pure_mana_stone: 1, gold: 3000 },
    desc: '적 전체에 160% 파멸의 암흑 마법 폭발 피해를 가합니다.',
    skill: {
      id: 'skill_craft_apocalypse',
      name: '아마겟돈',
      description: '적 전체 160% 파멸 암흑 피해',
      manaCost: 35,
      cooldown: 3,
      targetType: 'all_enemies',
      power: 1.6,
      effectType: 'damage',
      icon: '🌌'
    }
  },
  {
    id: 'craft_aegis_eternity',
    name: '고대 마도서: 영겁의 수호 결계',
    rarity: 'legendary',
    reqAlchemyLv: 7,
    cost: { ether: 500, void_shard: 15, pure_mana_stone: 1, gold: 3000 },
    desc: '아군 전체에게 150% 수호 결계를 2턴간 부여하고 디버프를 차단합니다.',
    skill: {
      id: 'skill_craft_aegis_eternity',
      name: '영겁의 수호 결계',
      description: '아군 전체 150% 보호막 + 면역 (2턴)',
      manaCost: 32,
      cooldown: 3,
      targetType: 'all_allies',
      power: 1.5,
      effectType: 'shield',
      statusDuration: 2,
      icon: '🔮'
    }
  },
  {
    id: 'craft_ragnarok',
    name: '고대 마도서: 라그나로크',
    rarity: 'legendary',
    reqAlchemyLv: 8,
    cost: { ether: 700, void_shard: 20, pure_mana_stone: 2, gold: 5000 },
    desc: '적 전체에 185% 화염 폭발을 일으키고 2턴간 격렬한 화상을 입힙니다.',
    skill: {
      id: 'skill_craft_ragnarok',
      name: '라그나로크',
      description: '적 전체 185% 화염 피해 + 2턴 화상',
      manaCost: 38,
      cooldown: 3,
      targetType: 'all_enemies',
      power: 1.85,
      effectType: 'burn',
      statusDuration: 2,
      icon: '☄️'
    }
  },
  {
    id: 'craft_divine_grace',
    name: '고대 마도서: 신의 은총',
    rarity: 'legendary',
    reqAlchemyLv: 8,
    cost: { ether: 700, void_shard: 20, pure_mana_stone: 2, gold: 5000 },
    desc: '아군 전체 HP를 45% 완전 치유하고 2턴간 지속 재생시킵니다.',
    skill: {
      id: 'skill_craft_divine_grace',
      name: '신의 은총',
      description: '아군 전체 HP 45% 치유 + 2턴 재생',
      manaCost: 36,
      cooldown: 3,
      targetType: 'all_allies',
      power: 0.45,
      effectType: 'heal',
      statusDuration: 2,
      icon: '🕊️'
    }
  },
  {
    id: 'craft_dimensional_rift',
    name: '시공의 마도서: 차원 붕괴',
    rarity: 'legendary',
    reqAlchemyLv: 9,
    cost: { ether: 950, void_shard: 30, pure_mana_stone: 3, gold: 8000 },
    desc: '단일 적에게 280% 방어 무시 절대 차원 피해를 꽂아넣습니다.',
    skill: {
      id: 'skill_craft_dimensional_rift',
      name: '차원 붕괴',
      description: '단일 적 280% 방어 무시 절대 피해',
      manaCost: 40,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 2.8,
      effectType: 'damage',
      icon: '🕳️'
    }
  },
  {
    id: 'craft_genesis_light',
    name: '태초의 마도서: 창세의 여명',
    rarity: 'legendary',
    reqAlchemyLv: 10,
    cost: { ether: 1500, void_shard: 50, pure_mana_stone: 5, gold: 15000 },
    desc: '적 전체에 220% 창세의 신성 피해를 퍼붓고, 아군 전체 HP를 35% 치유합니다.',
    skill: {
      id: 'craft_genesis_light',
      name: '창세의 여명',
      description: '적 전체 220% 신성 피해 & 아군 35% 치유',
      manaCost: 45,
      cooldown: 3,
      targetType: 'all_enemies',
      power: 2.2,
      effectType: 'damage',
      icon: '☀️'
    }
  },
  {
    id: 'craft_void_cataclysm',
    name: '태초의 마도서: 공허의 종말',
    rarity: 'legendary',
    reqAlchemyLv: 10,
    cost: { ether: 1500, void_shard: 50, pure_mana_stone: 5, gold: 15000 },
    desc: '적 전체에 240% 공허 절대 피해를 입히고 2턴간 치명적 맹독을 누적시킵니다.',
    skill: {
      id: 'craft_void_cataclysm',
      name: '공허의 종말',
      description: '적 전체 240% 공허 피해 + 2턴 맹독',
      manaCost: 48,
      cooldown: 3,
      targetType: 'all_enemies',
      power: 2.4,
      effectType: 'poison',
      statusDuration: 2,
      icon: '🪐'
    }
  }
];
