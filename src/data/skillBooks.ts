import { Skill, SkillRank } from '../types/game';
import { MONSTERS } from './monsters';
import { CHARACTER_CLASSES } from './classes';

export interface SkillBookDef {
  id: string;
  name: string;
  rank: SkillRank;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
  skill: Skill;
  description: string;
  flavor: string;
  icon: string;
  costGold: number;
  affinity?: string[];
  isBossExclusive?: boolean; // 👑 1F~10F 보스 토벌 전리품 전용 여부
  bossFloor?: number;        // 출현 보스 층수
}

export function getSkillBookRarity(rank?: SkillRank | string | number): 'common' | 'rare' | 'epic' | 'legendary' {
  const str = String(rank || 'basic');
  if (str === 'mythic' || str === 'legendary') return 'legendary';
  if (str === 'epic') return 'epic';
  if (str === 'rare') return 'rare';
  return 'common';
}

/** 📖 마도서 등급별 1권당 연구 습득률(%) 상승치 (Common: 50%, Rare: 34%, Epic: 20%, Legendary: 10%) */
export function getMasteryGainPerBook(rarity?: string): number {
  if (!rarity) return 50;
  const r = getSkillBookRarity(rarity);
  switch (r) {
    case 'legendary':
      return 10; // 전설: 10권 필요 (10%씩)
    case 'epic':
      return 20; // 에픽: 5권 필요 (20%씩)
    case 'rare':
      return 34; // 희귀: 3권 필요 (34% + 34% + 34% = 100%)
    case 'common':
    default:
      return 50; // 일반: 2권 필요 (50%씩)
  }
}

/** 👾 몬스터 이름에서 호위/광폭화/정예 및 복수 스폰 구분자(A, B, C...) 제거 헬퍼 */
export function cleanMonsterNameForDrop(rawName: string): string {
  if (!rawName) return '마물';
  return rawName
    .replace(/^\[(광폭화|호위|정예|무간의 광폭 보스)\]\s*/g, '')
    .replace(/\s+[A-Z]$/g, '')
    .replace(/\s+\([A-Z0-9]+\)$/g, '')
    .trim();
}

/** 📖 몬스터 스킬에서 마도서로 추출될 때, 50% 약화된 실제 위력에 맞게 스킬 설명을 정규화하는 헬퍼 */
export function adjustSkillDescriptionForDrop(
  rawDesc: string,
  basePower: number,
  weakenedPower: number
): string {
  if (!rawDesc) return '';
  let desc = rawDesc
    .replace(/대상 파티 전체/g, '__TARGET_ALL__')
    .replace(/파티 전체/g, '__TARGET_ALL__')
    .replace(/전체 아군/g, '__TARGET_PARTY__')
    .replace(/아군 전체/g, '__TARGET_ALL__')
    .replace(/__TARGET_ALL__/g, '대상 파티 전체')
    .replace(/__TARGET_PARTY__/g, '대상 파티');

  const origPct = Math.round(basePower * 100);
  const weakPct = Math.round(weakenedPower * 100);

  // 1. 원본 위력 퍼센트 (예: 180%)가 설명에 명시되어 있다면 약화된 위력(90%)으로 치환
  if (origPct > 0 && desc.includes(origPct + '%')) {
    desc = desc.replace(new RegExp(`${origPct}\\s*%`, 'g'), `${weakPct}%`);
  }

  // 2. 설명에 존재하는 기타 퍼센트(방어 관통 N%, 흡혈 N%, 스탯 N% 증폭/감소 등)도 약화 버전에 맞춰 50%로 조정
  desc = desc.replace(/(\d+)\s*%/g, (match, p1) => {
    const val = parseInt(p1, 10);
    if (val === weakPct) return match; // 이미 약화된 주 위력이면 유지
    const powerRatio = basePower > 0 ? (weakenedPower / basePower) : 0.7;
    const halved = Math.max(1, Math.round(val * powerRatio));
    return `${halved}%`;
  });

  // 3. 고정 수치(MP N 강탈 등)도 약화 버전에 맞춰 조정
  desc = desc.replace(/MP\s*(\d+)/gi, (_match, p1) => {
    const val = parseInt(p1, 10);
    const powerRatio = basePower > 0 ? (weakenedPower / basePower) : 0.7;
    const halved = Math.max(5, Math.round(val * powerRatio));
    return `MP ${halved}`;
  });

  // 4. 만약 설명에 % 수치가 전혀 없고 기본 위력이 0보다 큰 경우, 끝에 약화된 위력 명시
  if (!desc.includes('%') && weakPct > 0) {
    desc = `${desc} (위력 ${weakPct}%)`;
  }

  return desc;
}

/** 📖 기존 세이브 내 드랍 마도서/스킬 설명 중 50% 약화 전 원본 수치가 남아있는 경우 보정하는 헬퍼 */
export function normalizeDroppedSkillDescription(desc: string, actualPower: number): string {
  if (!desc) return '';
  const actualPct = Math.round(actualPower * 100);
  const doublePct = Math.round(actualPower * 2 * 100);

  let updated = desc;
  // 2배 수치(약화 전 몬스터 원본 수치)가 설명에 들어있는 경우 실제 위력 수치로 치환
  if (doublePct > 0 && updated.includes(doublePct + '%')) {
    updated = updated.replace(new RegExp(`${doublePct}\\s*%`, 'g'), `${actualPct}%`);
  }

  return updated;
}

export const GRIMOIRE_RARITY_META: Record<'common' | 'rare' | 'epic' | 'legendary', {
  label: string;
  color: string;
  bg: string;
  borderColor: string;
}> = {
  common: { label: '일반', color: '#a0aec0', bg: '#a0aec018', borderColor: '#a0aec044' },
  rare: { label: '희귀', color: '#c8aa6e', bg: '#c8aa6e18', borderColor: '#c8aa6e44' },
  epic: { label: '에픽', color: '#ce93d8', bg: '#9c27b018', borderColor: '#ba68c844' },
  legendary: { label: '전설', color: '#ffd54f', bg: '#ff980018', borderColor: '#ffd54f44' }
};

/** ⚔️ 3대 클래스 직업 계열 정의 */
export type SkillAffinityCategory = 'knight_mercenary' | 'gunner_assassin' | 'priest_mage' | 'universal';

export interface SkillAffinityMeta {
  id: SkillAffinityCategory;
  name: string;
  shortName: string;
  icon: string;
  roles: string[];
  color: string;
  bg: string;
  borderColor: string;
  description: string;
}

export const SKILL_AFFINITY_META: Record<SkillAffinityCategory, SkillAffinityMeta> = {
  knight_mercenary: {
    id: 'knight_mercenary',
    name: '기사·용병 계열',
    shortName: '기사·용병',
    icon: '🛡️⚔️',
    roles: ['tank', 'berserker'],
    color: '#42a5f5',
    bg: '#42a5f518',
    borderColor: '#42a5f544',
    description: '견습 기사, 성기사, 발키리, 중장 보병, 포트리스, 용병 전사, 광전사, 철혈의 패황, 무사, 환영의 검성 등'
  },
  gunner_assassin: {
    id: 'gunner_assassin',
    name: '마총·암살 계열',
    shortName: '마총·암살',
    icon: '🎯🗡️',
    roles: ['gunner', 'dealer_phy'],
    color: '#ce93d8',
    bg: '#ba68c818',
    borderColor: '#ba68c844',
    description: '도적, 암살자, 그림자 학살자, 방랑 총사, 마총사, 하이퍼 레인저, 사신 저격수 등'
  },
  priest_mage: {
    id: 'priest_mage',
    name: '사제·마법 계열',
    shortName: '사제·마법',
    icon: '✨🕊️',
    roles: ['healer', 'dealer_mag'],
    color: '#ffd54f',
    bg: '#ffd54f18',
    borderColor: '#ffd54f44',
    description: '견습 사제, 주교, 성령의 구원자, 전투 사제, 성전의 심판관, 원소 학도, 대마도사, 아크 메이지, 비전 학자, 시공의 조율사 등'
  },
  universal: {
    id: 'universal',
    name: '전 클래스 공용',
    shortName: '전 클래스',
    icon: '🌐',
    roles: ['all'],
    color: '#c8aa6e',
    bg: '#c8aa6e18',
    borderColor: '#c8aa6e44',
    description: '모든 직업군이 페널티 없이 온전한 위력(100%)으로 사용 가능한 비전서'
  }
};

/** 🏷️ 스킬 또는 비전서의 affinity 목록으로부터 해당하는 3대 계열 메타를 반환하는 함수 */
export function getSkillAffinityMeta(affinity?: string[]): SkillAffinityMeta {
  if (!affinity || affinity.length === 0 || affinity.includes('all')) {
    return SKILL_AFFINITY_META.universal;
  }
  const hasTankBerserker = affinity.some(a => a === 'tank' || a === 'berserker');
  const hasGunnerPhy = affinity.some(a => a === 'gunner' || a === 'dealer_phy');
  const hasPriestMage = affinity.some(a => a === 'healer' || a === 'dealer_mag');

  if (hasTankBerserker && !hasGunnerPhy && !hasPriestMage) {
    return SKILL_AFFINITY_META.knight_mercenary;
  }
  if (hasGunnerPhy && !hasTankBerserker && !hasPriestMage) {
    return SKILL_AFFINITY_META.gunner_assassin;
  }
  if (hasPriestMage && !hasTankBerserker && !hasGunnerPhy) {
    return SKILL_AFFINITY_META.priest_mage;
  }
  if (hasTankBerserker) return SKILL_AFFINITY_META.knight_mercenary;
  if (hasGunnerPhy) return SKILL_AFFINITY_META.gunner_assassin;
  if (hasPriestMage) return SKILL_AFFINITY_META.priest_mage;

  return SKILL_AFFINITY_META.universal;
}

/** ⚔️ 영웅의 직업/역할과 스킬 친화도가 일치하는지 판별하는 헬퍼 (불일치 시 위력 50% 반감 페널티, 3차 만마도서는 100% 허용) */
export function checkSkillAffinityMatch(
  affinity?: string[],
  heroRole?: string,
  heroClassId?: string
): boolean {
  if (!affinity || affinity.length === 0 || affinity.includes('all')) return true;
  // 🌟 [만마도서 (Omni-Grimoire)]: 3차 전직 클래스는 모든 마도서 계열 제한 완전 면제 (100% 본래 위력 발휘)
  if (heroClassId && CHARACTER_CLASSES[heroClassId]?.tier === 3) return true;
  if (heroRole && affinity.includes(heroRole)) return true;
  if (heroClassId && affinity.includes(heroClassId)) return true;
  return false;
}

/** 👾 몬스터 스킬에서 마도서로 드랍될 때 3대 계열 중 하나를 자동 판별해주는 헬퍼 */
export function determineSkillAffinity(
  skill: { name?: string; description?: string; effectType?: string },
  monName?: string
): string[] {
  const text = `${skill.name || ''} ${skill.description || ''} ${monName || ''}`.toLowerCase();
  const eff = skill.effectType || '';

  // 1. 사제·마법 계열 판정 (힐, 쉴드, 마법, 화염, 빙결, 번개, 전격, 에테르, 성역, 신성, 공허, 메테오, 영혼, 원소)
  if (
    eff === 'heal' ||
    eff === 'shield' ||
    text.includes('치유') ||
    text.includes('성역') ||
    text.includes('신성') ||
    text.includes('마법') ||
    text.includes('에테르') ||
    text.includes('공허') ||
    text.includes('메테오') ||
    text.includes('화염') ||
    text.includes('빙결') ||
    text.includes('냉기') ||
    text.includes('전격') ||
    text.includes('벼락') ||
    text.includes('마도') ||
    text.includes('정화') ||
    text.includes('마나')
  ) {
    return ['healer', 'dealer_mag'];
  }

  // 2. 마총·암살 계열 판정 (관통, 저격, 사격, 독, 암기, 기습, 배후, 맹독, 사신, 차원, 은신, 치명, 속도, 환영, 민첩, 표적)
  if (
    eff === 'poison' ||
    text.includes('관통') ||
    text.includes('저격') ||
    text.includes('사격') ||
    text.includes('총') ||
    text.includes('독') ||
    text.includes('맹독') ||
    text.includes('기습') ||
    text.includes('암습') ||
    text.includes('배후') ||
    text.includes('사신') ||
    text.includes('환영') ||
    text.includes('거울') ||
    text.includes('회피') ||
    text.includes('치명') ||
    text.includes('감속') ||
    text.includes('표적') ||
    text.includes('단검')
  ) {
    return ['gunner', 'dealer_phy'];
  }

  // 3. 기사·용병 계열 판정 (기본 물리, 방어, 참격, 베기, 강타 등)
  return ['tank', 'berserker'];
}

export const ALL_SKILL_BOOKS: SkillBookDef[] = [
  // ── 1. 기본 (Basic) ──────────────────────────────────────────
  {
    id: 'book_heavy_strike',
    name: '비전서: 강타',
    rank: 'basic',
    icon: '⚔️',
    description: '체중을 실어 단일 적에게 130% 물리 피해를 입힙니다.',
    flavor: '가장 기초적이지만 실전에서 결코 배신하지 않는 묵직한 일격.',
    costGold: 150,
    affinity: ['tank', 'dealer_phy', 'berserker'],
    skill: {
      id: 'skill_heavy_strike',
      name: '강타',
      description: '단일 적 130% 물리 피해',
      manaCost: 10,
      cooldown: 1,
      targetType: 'single_enemy',
      power: 1.3,
      effectType: 'damage',
      icon: '⚔️'
    }
  },
  {
    id: 'book_shield_guard',
    name: '비전서: 방패 방어',
    rank: 'basic',
    icon: '🛡️',
    description: '방패를 굳건히 들어 자신에게 공격력 비례 120% 보호막을 2턴간 생성합니다.',
    flavor: '심연 마물의 날카로운 발톱도 단단한 방패 앞에서는 무력화된다.',
    costGold: 150,
    affinity: ['tank', 'berserker', 'healer'],
    skill: {
      id: 'skill_shield_guard',
      name: '방패 방어',
      description: '자신에게 120% 보호막 부여 (2턴)',
      manaCost: 12,
      cooldown: 1,
      targetType: 'self',
      power: 1.2,
      effectType: 'shield',
      statusDuration: 2,
      icon: '🛡️'
    }
  },
  {
    id: 'book_first_aid',
    name: '비전서: 응급 처치',
    rank: 'basic',
    icon: '🩹',
    description: '붕대와 약초를 사용하여 단일 아군의 HP를 30% 즉시 회복합니다.',
    flavor: '전투 중 흘린 피를 지혈하는 필수 응급 기술.',
    costGold: 150,
    affinity: ['healer', 'tank', 'dealer_mag'],
    skill: {
      id: 'skill_first_aid',
      name: '응급 처치',
      description: '단일 아군 HP 30% 즉시 회복',
      manaCost: 14,
      cooldown: 1,
      targetType: 'single_ally',
      power: 0.3,
      effectType: 'heal',
      icon: '🩹'
    }
  },
  {
    id: 'book_puncture',
    name: '비전서: 약점 찌르기',
    rank: 'basic',
    icon: '🗡️',
    description: '적의 틈새를 찔러 100% 피해를 주고 2턴간 출혈 상태를 유발합니다.',
    flavor: '두꺼운 갑주 사이의 이음새를 노리는 치명적인 찌르기.',
    costGold: 150,
    affinity: ['dealer_phy', 'gunner', 'berserker'],
    skill: {
      id: 'skill_puncture',
      name: '약점 찌르기',
      description: '단일 적 100% 피해 + 2턴 출혈',
      manaCost: 12,
      cooldown: 1,
      targetType: 'single_enemy',
      power: 1.0,
      effectType: 'bleed',
      statusDuration: 2,
      icon: '🗡️'
    }
  },
  {
    id: 'book_flame_dart',
    name: '비전서: 에테르 화살',
    rank: 'basic',
    icon: '✨',
    description: '응축된 에테르 탄환을 날려 단일 적에게 144% 마법 피해를 입힙니다.',
    flavor: '대기 중의 에테르를 순간 압축해 쏘아내는 기초 사격술.',
    costGold: 150,
    affinity: ['dealer_mag', 'healer'],
    skill: {
      id: 'skill_flame_dart',
      name: '에테르 화살',
      description: '단일 적 144% 마법 피해',
      manaCost: 12,
      cooldown: 1,
      targetType: 'single_enemy',
      power: 1.44,
      effectType: 'damage',
      icon: '✨'
    }
  },

  // ── 2. 강화 (Enhanced - 기본 대비 +30%) ──────────────────────────────
  {
    id: 'book_flame_cleave',
    name: '비전서: 화염 강타',
    rank: 'enhanced',
    icon: '🔥',
    description: '타오르는 불꽃을 칼날에 둘러 단일 적에게 145% 피해를 입히고 화상과 출혈을 각각 1턴씩 부여합니다.',
    flavor: '심연의 어둠을 찢고 타오르는 맹렬한 업화의 검격.',
    costGold: 400,
    affinity: ['berserker', 'dealer_phy', 'tank'],
    skill: {
      id: 'skill_flame_cleave',
      name: '화염 강타',
      description: '단일 적 145% 피해 + 화상/출혈 (각 1턴)',
      manaCost: 16,
      cooldown: 1,
      targetType: 'single_enemy',
      power: 1.45,
      effectType: 'bleed',
      statusDuration: 1,
      positionBonus: 'front',
      icon: '🔥'
    }
  },
  {
    id: 'book_phalanx_wall',
    name: '비전서: 철벽의 방진',
    rank: 'enhanced',
    icon: '🏰',
    description: '전술 방진을 펼쳐 아군 전체의 방어력을 25% 상승시킵니다.',
    flavor: '홀로 선 방패는 부서지지만, 함께 엮은 방진은 무너지지 않는다.',
    costGold: 400,
    affinity: ['tank', 'healer'],
    skill: {
      id: 'skill_phalanx_wall',
      name: '철벽의 방진',
      description: '아군 전체 방어력 +25% 버프 (3턴)',
      manaCost: 18,
      cooldown: 1,
      targetType: 'all_allies',
      power: 0.25,
      effectType: 'buff',
      statusDuration: 3,
      positionBonus: 'front',
      icon: '🏰'
    }
  },
  {
    id: 'book_war_cry',
    name: '비전서: 전장의 포효',
    rank: 'enhanced',
    icon: '📢',
    description: '사자후를 질러 적 전체의 공격력을 20% 약화시킵니다.',
    flavor: '야수와 마물조차 움츠러들게 만드는 전장의 사자후.',
    costGold: 400,
    affinity: ['berserker', 'tank'],
    skill: {
      id: 'skill_war_cry',
      name: '전장의 포효',
      description: '적 전체 공격력 20% 감소 디버프 (2턴)',
      manaCost: 16,
      cooldown: 1,
      targetType: 'all_enemies',
      power: 0.2,
      effectType: 'debuff',
      statusDuration: 2,
      icon: '📢'
    }
  },
  {
    id: 'book_holy_blessing',
    name: '비전서: 신성한 축복',
    rank: 'enhanced',
    icon: '🌟',
    description: '성스러운 기도를 바쳐 단일 아군의 HP를 52% 회복합니다.',
    flavor: '방주에 깃든 성령의 빛이 쓰러져가는 전우를 일으킨다.',
    costGold: 400,
    affinity: ['healer', 'tank'],
    skill: {
      id: 'skill_holy_blessing',
      name: '신성한 축복',
      description: '단일 아군 HP 52% 회복',
      manaCost: 18,
      cooldown: 1,
      targetType: 'single_ally',
      power: 0.52,
      effectType: 'heal',
      icon: '🌟'
    }
  },
  {
    id: 'book_shadow_ambush',
    name: '비전서: 그림자 습격',
    rank: 'enhanced',
    icon: '🥷',
    description: '적의 그림자를 타고 넘어가 155%의 관통 일격을 가합니다.',
    flavor: '눈을 깜빡이는 찰나, 차가운 칼날이 심장을 꿰뚫는다.',
    costGold: 450,
    affinity: ['dealer_phy', 'gunner'],
    skill: {
      id: 'skill_shadow_ambush',
      name: '그림자 습격',
      description: '[후열 저격] 단일 적 155% 치명 관통 피해',
      manaCost: 16,
      cooldown: 1,
      targetType: 'single_enemy',
      power: 1.55,
      effectType: 'damage',
      positionBonus: 'back',
      icon: '🥷'
    }
  },
  {
    id: 'book_sacred_veil',
    name: '비전서: 축복의 베일',
    rank: 'enhanced',
    icon: '🕊️',
    description: '단일 아군의 모든 해로운 상태이상을 즉시 제거하고 공격력 비례 140% 보호막 및 2턴간 디버프 면역을 부여합니다.',
    flavor: '성자의 은총이 깃든 순백의 베일이 모든 사악한 저주와 한기를 튕겨낸다.',
    costGold: 450,
    affinity: ['healer', 'tank'],
    skill: {
      id: 'skill_sacred_veil',
      name: '축복의 베일',
      description: '단일 아군 디버프 즉시 해제 + 140% 보호막 & 2턴간 디버프 면역',
      manaCost: 16,
      cooldown: 1,
      targetType: 'single_ally',
      power: 1.4,
      effectType: 'shield',
      statusDuration: 2,
      icon: '🕊️'
    }
  },

  // ── 3. 희귀 (Rare - 강화 대비 +30%) ──────────────────────────────
  {
    id: 'book_thunderbolt',
    name: '비전서: 천둥의 벼락',
    rank: 'rare',
    icon: '⚡',
    description: '하늘에서 뇌운을 소환하여 단일 적에게 190% 피해를 입히고 1턴간 기절시킵니다.',
    flavor: '칠흑 같은 어둠을 가르는 푸른 뇌광의 심판.',
    costGold: 900,
    affinity: ['dealer_mag'],
    skill: {
      id: 'skill_thunderbolt',
      name: '천둥의 벼락',
      description: '단일 적 190% 번개 피해 + 1턴 기절',
      manaCost: 24,
      cooldown: 1,
      targetType: 'single_enemy',
      power: 1.9,
      effectType: 'stun',
      statusDuration: 1,
      icon: '⚡'
    }
  },
  {
    id: 'book_abyssal_hex',
    name: '비전서: 심연의 저주',
    rank: 'rare',
    icon: '🔮',
    description: '공허의 흑마술로 적 전체의 방어력을 35% 분쇄하고 침식을 일으킵니다.',
    flavor: '심연의 원혼들이 적의 육신과 갑주를 부식시킨다.',
    costGold: 900,
    affinity: ['dealer_mag', 'healer'],
    skill: {
      id: 'skill_abyssal_hex',
      name: '심연의 저주',
      description: '적 전체 방어력 -35% 디버프 (2턴)',
      manaCost: 24,
      cooldown: 1,
      targetType: 'all_enemies',
      power: 0.35,
      effectType: 'debuff',
      statusDuration: 2,
      icon: '🔮'
    }
  },
  {
    id: 'book_sanctuary_barrier',
    name: '비전서: 성역의 결계',
    rank: 'rare',
    icon: '🛡️',
    description: '고대 성역을 전개하여 아군 전체에게 공격력 비례 180%의 대형 보호막을 씌웁니다.',
    flavor: '어떤 사악한 저주도 침범할 수 없는 절대적인 신성 영역.',
    costGold: 950,
    affinity: ['healer', 'tank'],
    skill: {
      id: 'skill_sanctuary_barrier',
      name: '성역의 결계',
      description: '아군 전체 180% 보호막 전개 (3턴)',
      manaCost: 26,
      cooldown: 1,
      targetType: 'all_allies',
      power: 1.8,
      effectType: 'shield',
      statusDuration: 3,
      icon: '🛡️'
    }
  },
  {
    id: 'book_blade_dance',
    name: '비전서: 광기의 난무',
    rank: 'rare',
    icon: '🌪️',
    description: '폭풍처럼 회전하며 적 전체를 3연속 난무하여 총 120% 피해를 입힙니다.',
    flavor: '춤추듯 흩날리는 칼날 속에서 마물들의 비명이 메아리친다.',
    costGold: 950,
    affinity: ['dealer_phy', 'berserker'],
    skill: {
      id: 'skill_blade_dance',
      name: '광기의 난무',
      description: '적 전체 120% 광역 난무 물리 피해',
      manaCost: 24,
      cooldown: 1,
      targetType: 'all_enemies',
      power: 1.2,
      effectType: 'damage',
      icon: '🌪️'
    }
  },
  {
    id: 'book_purifying_light',
    name: '비전서: 정화의 빛',
    rank: 'rare',
    icon: '✨',
    description: '성스러운 빛줄기를 소환하여 아군 전체의 HP를 35% 회복시키고 모든 해로운 상태이상을 완전 정화하며 2턴간 디버프 면역을 부여합니다.',
    flavor: '어둠의 심연 속에서도 결코 꺼지지 않는 정화의 태초 광휘.',
    costGold: 950,
    affinity: ['healer', 'tank', 'all'],
    skill: {
      id: 'skill_purifying_light',
      name: '정화의 빛',
      description: '아군 전체 HP 35% 회복 + 모든 디버프 완전 정화 & 2턴간 디버프 면역',
      manaCost: 24,
      cooldown: 2,
      targetType: 'all_allies',
      power: 0.35,
      effectType: 'heal',
      statusDuration: 2,
      icon: '✨'
    }
  },

  // ── 4. 에픽 (Epic - 7대 직업군 특화 고성능 마도서) ─────────────────────────
  {
    id: 'book_epic_aegis_judgment',
    name: '비전서: 성전의 수호 방진',
    rank: 'epic',
    icon: '🛡️',
    description: '신성한 수호 결계를 펼쳐 아군 전체에게 공격력 비례 210% 보호막을 부여하고 2턴간 받는 피해를 25% 경감합니다.',
    flavor: '무너지지 않는 성기사의 신념이 전우들의 목숨을 지키는 뚫리지 않는 성벽이 된다.',
    costGold: 1600,
    affinity: ['tank'],
    skill: {
      id: 'skill_epic_aegis_judgment',
      name: '성전의 수호 방진',
      description: '아군 전체 210% 보호막 + 피해 25% 경감 결계 (2턴)',
      manaCost: 28,
      cooldown: 2,
      targetType: 'all_allies',
      power: 2.1,
      effectType: 'shield',
      statusDuration: 2,
      positionBonus: 'front',
      icon: '🛡️'
    }
  },
  {
    id: 'book_epic_shadow_execution',
    name: '비전서: 그림자 처형',
    rank: 'epic',
    icon: '🗡️',
    description: '[후열 저격] 적의 방어력을 70% 무시하고 240% 치명 물리 관통 피해를 가하며 2턴간 치명적인 출혈을 유발합니다.',
    flavor: '그림자 속에 숨은 암살자는 목표가 숨을 들이쉬는 찰나에 경동맥을 긋는다.',
    costGold: 1600,
    affinity: ['dealer_phy'],
    skill: {
      id: 'skill_epic_shadow_execution',
      name: '그림자 처형',
      description: '[후열 저격] 방어무시 240% 관통 피해 + 2턴 출혈',
      manaCost: 28,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 2.4,
      effectType: 'damage',
      statusDuration: 2,
      positionBonus: 'back',
      icon: '🗡️'
    }
  },
  {
    id: 'book_epic_arcane_supernova',
    name: '비전서: 초신성 폭발',
    rank: 'epic',
    icon: '🔮',
    description: '응축된 마력을 일거에 터뜨려 적 전체에 161% 광역 비전 마법 피해를 가하고 2턴간 방어력을 35% 분쇄합니다.',
    flavor: '작은 마력 구체가 임계점을 넘는 순간, 전장은 푸른 섬광의 지옥으로 화한다.',
    costGold: 1600,
    affinity: ['dealer_mag'],
    skill: {
      id: 'skill_epic_arcane_supernova',
      name: '초신성 폭발',
      description: '적 전체 161% 비전 마법 피해 + 방어력 -35% 분쇄 (2턴)',
      manaCost: 32,
      cooldown: 2,
      targetType: 'all_enemies',
      power: 1.61,
      effectType: 'damage',
      statusDuration: 2,
      icon: '🔮'
    }
  },
  {
    id: 'book_epic_divine_grace',
    name: '비전서: 성령의 기적',
    rank: 'epic',
    icon: '🕊️',
    description: '성령의 은총을 소환하여 아군 전체의 체력을 63% 즉시 회복하고 모든 상태이상을 완전 정화하며 2턴간 디버프 면역을 부여합니다.',
    flavor: '심연의 부패와 죽음조차 성자의 손끝에 깃든 태초의 빛 앞에서는 스러진다.',
    costGold: 1600,
    affinity: ['healer'],
    skill: {
      id: 'skill_epic_divine_grace',
      name: '성령의 기적',
      description: '아군 전체 HP 63% 회복 + 디버프 완전 정화 & 2턴 면역',
      manaCost: 32,
      cooldown: 2,
      targetType: 'all_allies',
      power: 0.63,
      effectType: 'heal',
      statusDuration: 2,
      icon: '🕊️'
    }
  },
  {
    id: 'book_epic_arrow_storm',
    name: '비전서: 폭풍의 화살비',
    rank: 'epic',
    icon: '🏹',
    description: '[후열 관통] 무수한 마도 화살을 쏘아 올려 적 전체에 135% 관통 피해를 입히고 1턴간 50% 확률로 기절시킵니다.',
    flavor: '먹구름처럼 하늘을 메운 화살은 도망칠 틈조차 주지 않고 심연의 마물들을 꿰뚫는다.',
    costGold: 1600,
    affinity: ['gunner', 'dealer_phy'],
    skill: {
      id: 'skill_epic_arrow_storm',
      name: '폭풍의 화살비',
      description: '[후열 관통] 적 전체 135% 관통 피해 + 1턴 50% 기절',
      manaCost: 30,
      cooldown: 2,
      targetType: 'all_enemies',
      power: 1.35,
      effectType: 'damage',
      statusDuration: 1,
      positionBonus: 'back',
      icon: '🏹'
    }
  },
  {
    id: 'book_epic_plasma_annihilation',
    name: '비전서: 플라즈마 파쇄포',
    rank: 'epic',
    icon: '⚡',
    description: '[후열 저격] 고압 플라즈마 탄환을 발사해 단일 적에게 220% 관통 피해를 입히고 2턴간 적 공격력 40% 약화 디버프를 부여합니다.',
    flavor: '과충전된 에테르 총열에서 뿜어져 나오는 열선은 강철 장갑마저 기화시킨다.',
    costGold: 1600,
    affinity: ['gunner'],
    skill: {
      id: 'skill_epic_plasma_annihilation',
      name: '플라즈마 파쇄포',
      description: '[후열 저격] 단일 적 220% 관통 피해 + 적 공격력 -40% (2턴)',
      manaCost: 30,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 2.2,
      effectType: 'damage',
      statusDuration: 2,
      positionBonus: 'back',
      icon: '⚡'
    }
  },
  {
    id: 'book_epic_blood_rampage',
    name: '비전서: 피의 광란참',
    rank: 'epic',
    icon: '🪓',
    description: '[전열 특화] 자신의 현재 체력 15%를 소모해 적 1체에게 230%의 파괴적인 일격을 가하고 피해량의 40%를 체력으로 흡수합니다.',
    flavor: '고통을 분노로 바꾸고 흘린 피를 양분 삼아 전장의 야수가 깨어난다.',
    costGold: 1600,
    affinity: ['berserker'],
    skill: {
      id: 'skill_epic_blood_rampage',
      name: '피의 광란참',
      description: '[전열 특화] HP 15% 소모 230% 강타 + 가한 피해 40% 흡혈',
      manaCost: 24,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 2.3,
      effectType: 'damage',
      statusDuration: 2,
      positionBonus: 'front',
      icon: '🪓'
    }
  },

  // ── 5. 신화 (Mythic - 희귀 대비 +30%) ─────────────────────────
  {
    id: 'book_armageddon',
    name: '고대 마도서: 아마겟돈',
    rank: 'mythic',
    icon: '🌌',
    description: '시공간을 붕괴시켜 적 전체에 173%의 종말급 암흑 폭발을 일으킵니다.',
    flavor: '고대 문명이 멸망할 때 하늘을 뒤덮었던 원초의 멸망 마법.',
    costGold: 2500,
    affinity: ['dealer_mag'],
    skill: {
      id: 'skill_armageddon',
      name: '아마겟돈',
      description: '적 전체 173% 파멸의 암흑 폭발 + 출혈',
      manaCost: 35,
      cooldown: 1,
      targetType: 'all_enemies',
      power: 1.73,
      effectType: 'damage',
      statusDuration: 3,
      icon: '🌌'
    }
  },
  {
    id: 'book_valhalla_aegis',
    name: '신성 성전: 발할라의 불멸',
    rank: 'mythic',
    icon: '👑',
    description: '아군 전체에게 공격력 +50% 버프와 강력한 250% 보호막을 부여합니다.',
    flavor: '죽음을 초월한 고대 영웅들의 영혼이 원정대의 방패가 된다.',
    costGold: 2500,
    affinity: ['tank'],
    skill: {
      id: 'skill_valhalla_aegis',
      name: '발할라의 불멸',
      description: '아군 전체 공격력 +50% & 250% 보호막 (3턴)',
      manaCost: 35,
      cooldown: 1,
      targetType: 'all_allies',
      power: 2.5,
      effectType: 'shield',
      statusDuration: 3,
      icon: '👑'
    }
  },
  {
    id: 'book_genesis_halo',
    name: '태초의 성전: 창세의 성령',
    rank: 'mythic',
    icon: '🕊️',
    description: '태초의 빛을 강림시켜 아군 전체의 체력을 81% 즉시 회복시킵니다.',
    flavor: '방주가 다시 부유할 때 울려 퍼졌던 창세의 축복.',
    costGold: 2500,
    affinity: ['healer'],
    skill: {
      id: 'skill_genesis_halo',
      name: '창세의 성령',
      description: '아군 전체 HP 81% 회복 & 공격력 버프',
      manaCost: 38,
      cooldown: 1,
      targetType: 'all_allies',
      power: 0.81,
      effectType: 'heal',
      icon: '🕊️'
    }
  },

  // ── 5. 👑 1F ~ 10F 보스 전용 고유 비전서 (Boss Drop Exclusive) ─────────────────────
  {
    id: 'book_boss_colossus_core',
    name: '비전서: 흑핵의 영구동결 [1F 보스]',
    rank: 'rare',
    icon: '❄️',
    description: '[기사·용병 계열 특화] 침묵의 흑핵 거신의 냉각 핵을 개방하여 단일 적에게 165% 빙결 피해를 입히고 1턴 완전 결빙(행동 불가) 및 전열 아군에게 150% 보호막을 부여합니다. (비적합 계열 사용 시 위력 50% 반감)',
    flavor: '[기사·용병 계열 전용] 침묵의 회랑 깊은 곳에서 추출한 절대 영도의 동결 에너지.',
    costGold: 1500,
    affinity: ['tank', 'berserker'],
    isBossExclusive: true,
    bossFloor: 1,
    skill: {
      id: 'skill_boss_colossus_core',
      name: '흑핵의 영구동결',
      description: '[기사·용병 특화] 단일 적 165% 빙결 피해 + 1턴 결빙(행동불가) & 전열 아군 150% 보호막',
      manaCost: 32,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 1.65,
      effectType: 'stun',
      statusDuration: 1,
      positionBonus: 'front',
      affinity: ['tank', 'berserker'],
      icon: '❄️',
      isUnique: true
    }
  },
  {
    id: 'book_boss_deathknight_reap',
    name: '비전서: 사령의 영혼 수확 [2F 보스]',
    rank: 'rare',
    icon: '💀',
    description: '[기사·용병 계열 특화] 망령 군주의 사령도를 휘둘러 적 전체에 110% 암흑 참격을 가하고 가한 총 피해량의 35%를 파티 전원에게 치유로 환원합니다. (비적합 계열 사용 시 위력 50% 반감)',
    flavor: '[기사·용병 계열 전용] 납골당의 망령 군주가 수확한 원혼들의 생명력이 원정대의 상처를 메운다.',
    costGold: 1800,
    affinity: ['tank', 'berserker'],
    isBossExclusive: true,
    bossFloor: 2,
    skill: {
      id: 'skill_boss_deathknight_reap',
      name: '사령의 영혼 수확',
      description: '[기사·용병 특화] 적 전체 110% 암흑 참격 + 피해량 35% 파티 전원 흡혈 치유',
      manaCost: 36,
      cooldown: 2,
      targetType: 'all_enemies',
      power: 1.1,
      effectType: 'drain',
      positionBonus: 'any',
      affinity: ['tank', 'berserker'],
      icon: '💀',
      isUnique: true
    }
  },
  {
    id: 'book_boss_behemoth_eruption',
    name: '비전서: 광맥의 마도 분출 [3F 보스]',
    rank: 'rare',
    icon: '🌋',
    description: '[기사·용병 계열 특화] 태고의 광맥 베히모스의 마도 화산력을 분출시켜 전열 적에게 175% 방어 무시 고열 폭발을 가하고 3턴간 화상(방어력 50% 분쇄)을 일으킵니다. (비적합 계열 사용 시 위력 50% 반감)',
    flavor: '[기사·용병 계열 전용] 에테르 광맥의 지각을 붕괴시키는 태고 베히모스의 분노.',
    costGold: 2000,
    affinity: ['tank', 'berserker'],
    isBossExclusive: true,
    bossFloor: 3,
    skill: {
      id: 'skill_boss_behemoth_eruption',
      name: '광맥의 마도 분출',
      description: '[기사·용병 특화] 전열 적 175% 방어무시 고열 폭발 + 3턴 화상/방어 50% 분쇄',
      manaCost: 40,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 1.75,
      effectType: 'damage',
      statusDuration: 3,
      positionBonus: 'front',
      affinity: ['tank', 'berserker'],
      icon: '🌋',
      isUnique: true
    }
  },
  {
    id: 'book_boss_chrono_warp',
    name: '비전서: 시공간 차원 붕괴 [4F 보스]',
    rank: 'rare',
    icon: '⏳',
    description: '[마총·암살 계열 특화] 심연의 시공 왜곡자의 차원 닻을 투하하여 후열 적에게 180% 치명 저격을 가하고 적 전체의 속도를 2턴간 40% 감속시킵니다. (비적합 계열 사용 시 위력 50% 반감)',
    flavor: '[마총·암살 계열 전용] 시간의 흐름을 멈추고 차원의 틈새로 적을 빨아들이는 시공 왜곡의 극의.',
    costGold: 2300,
    affinity: ['gunner', 'dealer_phy'],
    isBossExclusive: true,
    bossFloor: 4,
    skill: {
      id: 'skill_boss_chrono_warp',
      name: '시공간 차원 붕괴',
      description: '[마총·암살 특화] 후열 적 180% 치명 차원 저격 + 적 전체 2턴 속도 40% 감속',
      manaCost: 44,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 1.8,
      effectType: 'damage',
      statusDuration: 2,
      positionBonus: 'back',
      affinity: ['gunner', 'dealer_phy'],
      icon: '⏳',
      isUnique: true
    }
  },
  {
    id: 'book_boss_void_cataclysm',
    name: '비전서: 원초의 공허 묵시록 [5F 보스]',
    rank: 'rare',
    icon: '🔮',
    description: '[사제·마법 계열 특화] 공허의 침식자의 근원 마력을 해방하여 적 전체에 150% 공허 마법 피해를 입히고 모든 아군의 디버프를 즉시 정화하며 1턴간 완전 무적 결계를 전개합니다. (비적합 계열 사용 시 위력 50% 반감)',
    flavor: '[사제·마법 계열 전용] 모든 존재를 집어삼키는 원초의 공허 모노리스의 묵시록.',
    costGold: 2500,
    affinity: ['healer', 'dealer_mag'],
    isBossExclusive: true,
    bossFloor: 5,
    skill: {
      id: 'skill_boss_void_cataclysm',
      name: '원초의 공허 묵시록',
      description: '[사제·마법 특화] 적 전체 150% 공허 마법 피해 + 아군 디버프 전원 정화 & 1턴 무적 결계',
      manaCost: 48,
      cooldown: 3,
      targetType: 'all_enemies',
      power: 1.5,
      effectType: 'damage',
      positionBonus: 'any',
      affinity: ['healer', 'dealer_mag'],
      icon: '🔮',
      isUnique: true
    }
  },
  {
    id: 'book_boss_blood_monarch',
    name: '비전서: 진홍의 피의 지배 [6F 보스]',
    rank: 'mythic',
    icon: '🍷',
    description: '[기사·용병 계열 특화] 핏빛 대공의 흡혈 권능을 발동하여 단일 적에게 190% 흡혈 참격을 가하고 적 전체에 3턴간 치명적인 출혈을 부여합니다. (비적합 계열 사용 시 위력 50% 반감)',
    flavor: '[기사·용병 계열 전용] 핏빛 성역의 지배자가 흩뿌리는 진홍빛 선혈의 향연.',
    costGold: 5500,
    affinity: ['tank', 'berserker'],
    isBossExclusive: true,
    bossFloor: 6,
    skill: {
      id: 'skill_boss_blood_monarch',
      name: '진홍의 피의 지배',
      description: '[기사·용병 특화] 단일 적 190% 흡혈 참격 + 적 전체 3턴 치명 출혈',
      manaCost: 62,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 1.9,
      effectType: 'drain',
      statusDuration: 3,
      positionBonus: 'front',
      affinity: ['tank', 'berserker'],
      icon: '🍷',
      isUnique: true
    }
  },
  {
    id: 'book_boss_oblivion_scythe',
    name: '비전서: 망각의 사신 낫 [7F 보스]',
    rank: 'mythic',
    icon: '⛓️',
    description: '[마총·암살 계열 특화] 망각의 묘지기의 거대한 사신 낫을 휘둘러 후열 적에게 200% 초극딜 참격을 가하고 전열 적에게 2턴간 침묵과 기절을 유발합니다. (비적합 계열 사용 시 위력 50% 반감)',
    flavor: '[마총·암살 계열 전용] 망각의 묘역에 발을 들인 자는 그 누구도 사신의 사슬을 벗어날 수 없다.',
    costGold: 6000,
    affinity: ['gunner', 'dealer_phy'],
    isBossExclusive: true,
    bossFloor: 7,
    skill: {
      id: 'skill_boss_oblivion_scythe',
      name: '망각의 사신 낫',
      description: '[마총·암살 특화] 후열 적 200% 초극딜 참격 + 전열 적 2턴 침묵/기절',
      manaCost: 68,
      cooldown: 2,
      targetType: 'single_enemy',
      power: 2.0,
      effectType: 'damage',
      statusDuration: 2,
      positionBonus: 'back',
      affinity: ['gunner', 'dealer_phy'],
      icon: '⛓️',
      isUnique: true
    }
  },
  {
    id: 'book_boss_judgment_sanctum',
    name: '비전서: 단죄의 칠흑 성역 [8F 보스]',
    rank: 'mythic',
    icon: '🏰',
    description: '[사제·마법 계열 특화] 타락한 기사단장의 칠흑 성역을 전개하여 아군 전체에게 공격력 비례 250% 흡수 보호막을 생성하고 3턴간 공격력을 40% 증폭합니다. (비적합 계열 사용 시 위력 50% 반감)',
    flavor: '[사제·마법 계열 전용] 단죄의 요새를 수호하던 불패의 성기사단장이 남긴 궁극의 결계.',
    costGold: 6500,
    affinity: ['healer', 'dealer_mag'],
    isBossExclusive: true,
    bossFloor: 8,
    skill: {
      id: 'skill_boss_judgment_sanctum',
      name: '단죄의 칠흑 성역',
      description: '[사제·마법 특화] 아군 전체 공격력 비례 250% 보호막 + 3턴간 공격력 40% 증폭 버프',
      manaCost: 74,
      cooldown: 3,
      targetType: 'all_allies',
      power: 2.5,
      effectType: 'shield',
      statusDuration: 3,
      positionBonus: 'any',
      affinity: ['healer', 'dealer_mag'],
      icon: '🏰',
      isUnique: true
    }
  },
  {
    id: 'book_boss_mirror_kaleidoscope',
    name: '비전서: 만화경 환영 폭풍 [9F 보스]',
    rank: 'mythic',
    icon: '🪞',
    description: '[마총·암살 계열 특화] 미궁의 지배자의 거울 차원을 개방하여 적 전체에 167% 마법 관통 피해를 입히고 2턴간 아군 전체에게 회피율 50% 버프를 부여합니다. (비적합 계열 사용 시 위력 50% 반감)',
    flavor: '[마총·암살 계열 전용] 수억 개의 거울 파편이 반사하는 환영 속에서 적의 공격은 허공을 가른다.',
    costGold: 7000,
    affinity: ['gunner', 'dealer_phy'],
    isBossExclusive: true,
    bossFloor: 9,
    skill: {
      id: 'skill_boss_mirror_kaleidoscope',
      name: '만화경 환영 폭풍',
      description: '[마총·암살 특화] 적 전체 167% 마법 관통 피해 + 2턴간 아군 전체 회피율 50% 증가',
      manaCost: 82,
      cooldown: 3,
      targetType: 'all_enemies',
      power: 1.67,
      effectType: 'damage',
      positionBonus: 'any',
      affinity: ['gunner', 'dealer_phy'],
      icon: '🪞',
      isUnique: true
    }
  },
  {
    id: 'book_boss_asmodeus_armageddon',
    name: '비전서: 종말의 심연 아마게돈 [10F 보스]',
    rank: 'mythic',
    icon: '🪐',
    description: '[사제·마법 계열 특화] 심연의 군주 아스모데우스의 종말 권능을 소환하여 적 전체에 160% 신화급 파멸 피해를 퍼붓고 1턴 기절 및 5턴간 공허 침식(공격력/방어력 50% 감소)을 부여합니다. (비적합 계열 사용 시 위력 50% 반감)',
    flavor: '[사제·마법 계열 전용] 심연의 심장부에서 탄생한 종말의 묵시록. 모든 차원의 끝을 선고하는 절대 파멸.',
    costGold: 10000,
    affinity: ['healer', 'dealer_mag'],
    isBossExclusive: true,
    bossFloor: 10,
    skill: {
      id: 'skill_boss_asmodeus_armageddon',
      name: '종말의 심연 아마게돈',
      description: '[사제·마법 특화] 적 전체 160% 신화급 파멸 피해 + 1턴 기절 & 5턴 공허 침식(공/방 50% 감소)',
      manaCost: 98,
      cooldown: 4,
      targetType: 'all_enemies',
      power: 1.6,
      effectType: 'damage',
      statusDuration: 5,
      positionBonus: 'any',
      affinity: ['healer', 'dealer_mag'],
      icon: '🪐',
      isUnique: true
    }
  }
];

export const ALL_SKILLS_MAP: Record<string, Skill> = ALL_SKILL_BOOKS.reduce((acc, b) => {
  acc[b.skill.id] = b.skill;
  return acc;
}, {} as Record<string, Skill>);

/** 🛒 영혼의 블랙 마켓에서 거래 가능한 일반 연구 마도 비전서 (보스 전용 드랍 비전서 제외) */
export const MARKET_SKILL_BOOKS: SkillBookDef[] = ALL_SKILL_BOOKS.filter(
  b => !b.isBossExclusive && !b.id.startsWith('book_boss_')
);

/** 👑 1F~10F 심연 군주 보스 토벌 시에만 드랍되는 고유 비전서 */
export const BOSS_EXCLUSIVE_SKILL_BOOKS: SkillBookDef[] = ALL_SKILL_BOOKS.filter(
  b => !!b.isBossExclusive || b.id.startsWith('book_boss_')
);

export interface DroppableMonsterSkillBookDef {
  bookId: string;
  skillId: string;
  name: string;             // e.g. "마도서: 그림자 기습"
  skillName: string;        // e.g. "그림자 기습"
  originMonsterName: string;// e.g. "공허의 잠복자"
  monsterId: string;        // e.g. "monster_stalker"
  floor: number;
  monsterType: string;
  defaultPower: number;     // 50% 약화된 기본 위력
  defaultManaCost: number;  // 기본 마나
  defaultCooldown: number;  // 1
  defaultDescription: string;
  affinity: string[];
  affinityMeta: SkillAffinityMeta;
  icon: string;
}

/** 👾 게임 내 마물들로부터 드랍되는 대표 마물 마도서 목록 추출 */
export function getDroppableMonsterSkillBooks(monstersRecord: Record<string, any> = MONSTERS): DroppableMonsterSkillBookDef[] {
  const map = new Map<string, DroppableMonsterSkillBookDef>();

  Object.values(monstersRecord).forEach(m => {
    if (!m.skills || m.skills.length === 0) return;
    // 보스 전용 고정 드랍 비전서가 있는 경우는 ALL_SKILL_BOOKS의 고유 보스 비전서로 드랍되므로 제외
    if (m.type === 'boss' && m.rewards?.dropSkillBookId) return;

    const cleanMonName = cleanMonsterNameForDrop(m.name);
    const cleanMonId = (m.id || 'monster').replace(/_[A-Z]$/, '').replace(/_mon_\d+.*$/, '');
    const bookId = `book_m_${cleanMonId}`;
    const skillId = `skill_m_${cleanMonId}`;

    if (map.has(bookId)) return;

    const sigIdx = (m.signatureSkillIndex !== undefined && m.signatureSkillIndex >= 0 && m.signatureSkillIndex < m.skills.length)
      ? m.signatureSkillIndex
      : 0;
    const mSkill = m.skills[sigIdx] || m.skills[0];
    if (!mSkill) return;

    const basePwr = mSkill.power || 1.0;
    const weakenedPower = Number((basePwr * 0.7).toFixed(2));
    const cleanSkillName = (mSkill.name || '비기').trim();
    const cleanSkillDesc = adjustSkillDescriptionForDrop(mSkill.description || mSkill.name, basePwr, weakenedPower);
    const affinity = determineSkillAffinity(mSkill, cleanMonName);
    const affMeta = getSkillAffinityMeta(affinity);

    const floor = Math.max(1, Math.min(10, Math.ceil((m.level || 1) / 3)));
    const defaultMana = Math.max(10, Math.round(12 + floor * 1.5));

    map.set(bookId, {
      bookId,
      skillId,
      name: `마도서: ${cleanSkillName}`,
      skillName: cleanSkillName,
      originMonsterName: cleanMonName,
      monsterId: m.id,
      floor,
      monsterType: m.type || 'normal',
      defaultPower: Math.max(0.2, weakenedPower),
      defaultManaCost: defaultMana,
      defaultCooldown: 1,
      defaultDescription: `[${affMeta.shortName} 계열] [${cleanMonName}의 대표 비기] ${cleanSkillDesc}`,
      affinity,
      affinityMeta: affMeta,
      icon: bookId
    });
  });

  return Array.from(map.values()).sort((a, b) => a.floor - b.floor || a.name.localeCompare(b.name, 'ko'));
}

export interface MonsterDropInfo {
  monsterName: string;
  floor?: number;
  monsterType?: string;
  isBoss?: boolean;
}

/** 👾 마도서/스킬의 드랍 마물 출처 정보 조회 헬퍼 */
export function findMonsterOriginForBook(params: {
  originMonsterName?: string;
  bookId?: string;
  skillId?: string;
  bookName?: string;
  skillName?: string;
}): MonsterDropInfo | null {
  // 1. 이미 아이템에 기록된 originMonsterName이 있는 경우
  if (params.originMonsterName) {
    const clean = cleanMonsterNameForDrop(params.originMonsterName);
    const foundMon = Object.values(MONSTERS).find(m => cleanMonsterNameForDrop(m.name) === clean);
    if (foundMon) {
      const floor = Math.max(1, Math.min(10, Math.ceil((foundMon.level || 1) / 3)));
      return {
        monsterName: clean,
        floor,
        monsterType: foundMon.type || 'normal',
        isBoss: foundMon.type === 'boss'
      };
    }
    return { monsterName: clean };
  }

  // 2. 보스 전용 고유 마도서 (MONSTERS의 dropSkillBookId)
  if (params.bookId) {
    for (const m of Object.values(MONSTERS)) {
      if (m.rewards?.dropSkillBookId === params.bookId) {
        const floor = Math.max(1, Math.min(10, Math.ceil((m.level || 1) / 3)));
        return {
          monsterName: cleanMonsterNameForDrop(m.name),
          floor,
          monsterType: 'boss',
          isBoss: true
        };
      }
    }
  }

  // 3. getDroppableMonsterSkillBooks() 매칭 (일반/엘리트 마물 드랍)
  const droppable = getDroppableMonsterSkillBooks();
  const match = droppable.find(d => 
    (params.bookId && (d.bookId === params.bookId || params.bookId.includes(d.monsterId))) ||
    (params.skillId && (d.skillId === params.skillId || d.bookId === params.skillId)) ||
    (params.skillName && d.skillName === params.skillName) ||
    (params.bookName && d.name === params.bookName)
  );

  if (match) {
    return {
      monsterName: match.originMonsterName,
      floor: match.floor,
      monsterType: match.monsterType,
      isBoss: match.monsterType === 'boss'
    };
  }

  // 4. ALL_SKILL_BOOKS에서 bossFloor가 지정된 마도서
  const bDef = ALL_SKILL_BOOKS.find(b => b.id === params.bookId || b.skill.id === params.skillId);
  if (bDef && bDef.bossFloor) {
    const boss = Object.values(MONSTERS).find(m => m.type === 'boss' && Math.ceil((m.level || 1) / 3) === bDef.bossFloor);
    if (boss) {
      return {
        monsterName: cleanMonsterNameForDrop(boss.name),
        floor: bDef.bossFloor,
        monsterType: 'boss',
        isBoss: true
      };
    }
  }

  return null;
}
