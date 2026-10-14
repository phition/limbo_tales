import { Skill, MonsterSkill, StatusEffect, Mercenary, MonsterData, MagicSchool } from '../types/game';
import type { SoundEffectType } from '../managers/SoundManager';
import type { VFXType } from '../components/BattleVFXOverlay';

export interface SkillTag {
  id: string;
  label: string;
  bg: string;
  text: string;
  border: string;
  icon: string;
}

export const ALL_SKILL_TAGS_META: Record<string, SkillTag> = {
  holy: { id: 'holy', label: '신성', bg: '#ffd54f1a', text: '#ffd54f', border: '#ffd54f44', icon: '✨' },
  crush: { id: 'crush', label: '강타', bg: '#ff91001a', text: '#ff9100', border: '#ff910044', icon: '🔨' },
  storm: { id: 'storm', label: '폭풍', bg: '#00e5ff1a', text: '#00e5ff', border: '#00e5ff44', icon: '🌪️' },
  lightning: { id: 'lightning', label: '뇌격', bg: '#ffeb3b1a', text: '#ffee58', border: '#ffeb3b44', icon: '⚡' },
  snipe: { id: 'snipe', label: '저격', bg: '#29b6f61a', text: '#29b6f6', border: '#29b6f644', icon: '🎯' },
  pierce: { id: 'pierce', label: '관통', bg: '#42a5f51a', text: '#42a5f5', border: '#42a5f544', icon: '🏹' },
  slash: { id: 'slash', label: '베기', bg: '#ef53501a', text: '#ef5350', border: '#ef535044', icon: '🗡️' },
  dark: { id: 'dark', label: '암흑', bg: '#7e57c21a', text: '#b39ddb', border: '#7e57c244', icon: '🔮' },
  magic: { id: 'magic', label: '마법', bg: '#7c4dff1a', text: '#b388ff', border: '#7c4dff44', icon: '✨' },
  elemental: { id: 'elemental', label: '원소', bg: '#7c4dff1a', text: '#b388ff', border: '#7c4dff44', icon: '🔮' },
  shield_break: { id: 'shield_break', label: '방패 파쇄', bg: '#ab47bc1a', text: '#ab47bc', border: '#ab47bc44', icon: '🛡️💥' },
  heal: { id: 'heal', label: '치유', bg: '#66bb6a1a', text: '#66bb6a', border: '#66bb6a44', icon: '💚' },
  regen: { id: 'regen', label: '재생', bg: '#26a69a1a', text: '#26a69a', border: '#26a69a44', icon: '🌱' },
  drain: { id: 'drain', label: '흡혈', bg: '#e91e631a', text: '#e91e63', border: '#e91e6344', icon: '🩸' },
  shield: { id: 'shield', label: '보호막', bg: '#00d2ff1a', text: '#00d2ff', border: '#00d2ff44', icon: '🛡️' },
  stun: { id: 'stun', label: '기절', bg: '#ffea001a', text: '#ffea00', border: '#ffea0044', icon: '💫' },
  bleed: { id: 'bleed', label: '출혈', bg: '#ff17441a', text: '#ff1744', border: '#ff174444', icon: '🩸' },
  poison: { id: 'poison', label: '중독', bg: '#00e6761a', text: '#00e676', border: '#00e67644', icon: '☣️' },
  freeze: { id: 'freeze', label: '빙결', bg: '#80d8ff1a', text: '#80d8ff', border: '#80d8ff44', icon: '❄️' },
  burn: { id: 'burn', label: '화상', bg: '#ff6d001a', text: '#ff6d00', border: '#ff6d0044', icon: '🔥' },
  attack: { id: 'attack', label: '공격', bg: '#8b9bb41a', text: '#8b9bb4', border: '#8b9bb444', icon: '⚔️' }
};

export function getTagMeta(tagId: string): SkillTag {
  return ALL_SKILL_TAGS_META[tagId] || { id: tagId, label: tagId, bg: '#8b9bb41a', text: '#8b9bb4', border: '#8b9bb444', icon: '🏷️' };
}

/**
 * 마법 계열 분류 판별 함수
 * - elemental: 원소 마법 (화염, 빙결, 전격, 폭풍, 비전 등)
 * - dark: 암흑 마법 (암흑, 공허, 저주, 침식, 영혼 등)
 * - holy: 신성 마법 (신성, 성광, 심판, 축복, 기도 등)
 * - undefined: 순수 물리/비마법 스킬
 */
export function getSkillMagicSchool(skill?: Skill | MonsterSkill | any): MagicSchool | undefined {
  if (!skill) return undefined;
  if (skill === 'basic') return undefined;

  // 1. 명시적으로 지정된 magicSchool이 있는 경우 최우선 반환
  if (skill.magicSchool && ['elemental', 'dark', 'holy'].includes(skill.magicSchool)) {
    return skill.magicSchool as MagicSchool;
  }

  const sId = (skill.id || '').toLowerCase();
  const sName = (skill.name || '').toLowerCase();
  const sDesc = (skill.description || '').toLowerCase();
  const comboCat = skill.comboCategory;
  const eff = skill.effectType || '';

  // 2. 신성 마법 (holy)
  // - comboCategory === 'holy' 또는 신성 관련 키워드
  if (
    comboCat === 'holy' ||
    sId.includes('holy') || sId.includes('divine') || sId.includes('smite') || sId.includes('saint') || sId.includes('sacred') ||
    sId === 'paladin_judgment' || sId === 'valk_spear' || sId === 'acolyte_smite' || sId === 'warpriest_smite_crusade' ||
    sName.includes('신성') || sName.includes('성광') || sName.includes('성역') || sName.includes('심판') || sName.includes('축복') || sName.includes('정화') || sName.includes('천벌') ||
    sDesc.includes('신성') || sDesc.includes('성스러운') || sDesc.includes('성광') || sDesc.includes('정화의')
  ) {
    return 'holy';
  }

  // 3. 암흑 마법 (dark)
  // - 암흑, 공허, 저주, 침식, 흑마법 관련 키워드
  if (
    sId.includes('dark') || sId.includes('shadow') || sId.includes('void') || sId.includes('curse') || sId.includes('abyss') || sId.includes('corrupt') || sId.includes('armageddon') ||
    sName.includes('암흑') || sName.includes('공허') || sName.includes('저주') || sName.includes('파멸') || sName.includes('암영') || sName.includes('침식') || sName.includes('흑마법') || sName.includes('흑염') || sName.includes('아마게돈') ||
    sDesc.includes('암흑') || sDesc.includes('공허') || sDesc.includes('저주') || sDesc.includes('침식') || sDesc.includes('흑마법') || sDesc.includes('영혼을 갉아')
  ) {
    return 'dark';
  }

  // 4. 원소 마법 (elemental)
  // - comboCategory === 'magic' 또는 화염/빙결/전격/폭풍/마법/메테오/블리자드 등
  if (
    comboCat === 'magic' ||
    eff === 'burn' || eff === 'freeze' ||
    sId.includes('magic') || sId.includes('elemental') || sId.includes('fire') || sId.includes('flame') || sId.includes('ice') || sId.includes('freeze') || sId.includes('frost') || sId.includes('blizzard') || sId.includes('meteor') || sId.includes('arcane') || sId.includes('lightning') || sId.includes('thunder') || sId.includes('storm') || sId.includes('earthquake') || sId.includes('eruption') ||
    sName.includes('화염') || sName.includes('불꽃') || sName.includes('빙결') || sName.includes('냉기') || sName.includes('눈보라') || sName.includes('혹한') || sName.includes('번개') || sName.includes('낙뢰') || sName.includes('뇌격') || sName.includes('전격') || sName.includes('폭풍') || sName.includes('원소') || sName.includes('메테오') || sName.includes('비전') || sName.includes('마법') || sName.includes('블리자드') ||
    sDesc.includes('원소') || sDesc.includes('화염') || sDesc.includes('빙결') || sDesc.includes('냉각') || sDesc.includes('마법 피해') || sDesc.includes('비전') || sDesc.includes('에테르 마법') || sDesc.includes('뇌격')
  ) {
    return 'elemental';
  }

  return undefined;
}

/**
 * 원소 마법의 구체적인 세부 속성 추출 ('fire' | 'ice' | 'lightning' | 'earth')
 */
export function getElementalSubtype(skill?: Skill | MonsterSkill | any): 'fire' | 'ice' | 'lightning' | 'earth' {
  if (!skill) return 'fire';
  const str = `${skill.id || ''} ${skill.name || ''} ${skill.description || ''}`.toLowerCase();
  if (str.includes('ice') || str.includes('freeze') || str.includes('frost') || str.includes('blizzard') || str.includes('빙결') || str.includes('냉기') || str.includes('눈보라') || str.includes('혹한') || str.includes('동상') || str.includes('냉각')) {
    return 'ice';
  }
  if (str.includes('lightning') || str.includes('thunder') || str.includes('shock') || str.includes('spark') || str.includes('전격') || str.includes('번개') || str.includes('낙뢰') || str.includes('뇌격') || str.includes('감전')) {
    return 'lightning';
  }
  if (str.includes('earth') || str.includes('quake') || str.includes('stone') || str.includes('rock') || str.includes('지진') || str.includes('대지') || str.includes('암석')) {
    return 'earth';
  }
  return 'fire';
}

export interface ComboRule {
  comboName: string;
  icon: string;
  triggerStatus: string;       // 필요한 상태이상 한글명
  triggerStatusTypes: string[]; // 내부 타입: 'freeze' | 'stun' | 'bleed' | 'poison' | 'debuff_def' | 'debuff_atk' | 'burn'
  requiredTagIds: string[];    // 필요한 스킬 태그 ID: 'crush', 'slash', 'pierce', 'snipe', 'storm', 'magic', 'holy', 'lightning', 'dark', 'drain', 'shield_break'
  summary: string;             // 연계 효과 요약
  fullDesc: string;
  bannerColor: string;
}

export const COMBO_RULES: ComboRule[] = [
  // ── 1. 빙결 분쇄 ──
  {
    comboName: '빙결 분쇄',
    icon: '❄️💥',
    triggerStatus: '빙결/기절',
    triggerStatusTypes: ['freeze', 'stun'],
    requiredTagIds: ['crush', 'slash'],
    summary: '광역 얼음 파편 폭풍 피해 (45%)',
    fullDesc: '빙결/기절 상태의 적을 강타/베기로 타격 시 외피가 산산조각나며 주변 적들에게 45% 파편 피해',
    bannerColor: '#00d2ff',
  },
  // ── 2. 과출혈 기폭 ──
  {
    comboName: '과출혈 기폭',
    icon: '🩸💥',
    triggerStatus: '출혈',
    triggerStatusTypes: ['bleed'],
    requiredTagIds: ['slash', 'pierce', 'snipe'],
    summary: '누적 출혈 즉시 폭발 & 공격력 25% 약화',
    fullDesc: '출혈 상태의 적을 베기/관통으로 타격 시 상처가 일제히 터져나가며 대량 즉발 폭발 및 2턴간 공격력 25% 감소',
    bannerColor: '#ff1744',
  },
  // ── 3. 독성 기화 폭발 ──
  {
    comboName: '독성 기화 폭발',
    icon: '☣️💥',
    triggerStatus: '중독',
    triggerStatusTypes: ['poison'],
    requiredTagIds: ['magic', 'elemental'],
    summary: '마법 폭발 & 적 전체 맹독 전이',
    fullDesc: '중독 상태의 적을 마법/원소로 타격 시 독소가 마력과 반응하여 최대 HP 12% 폭발 및 적 전체 맹독 전이',
    bannerColor: '#00e676',
  },
  // ── 4. 자세 붕괴 ──
  {
    comboName: '자세 붕괴',
    icon: '🛡️💔',
    triggerStatus: '방어 약화',
    triggerStatusTypes: ['debuff_def'],
    requiredTagIds: ['crush', 'shield_break'],
    summary: '1턴 기절 & 차징 브레이크 150 파쇄',
    fullDesc: '방어 약화 상태의 적을 강타로 강타 시 무너진 방어선을 분쇄하여 1턴간 기절 및 차징 브레이크 150 파쇄',
    bannerColor: '#ff9100',
  },
  // ── 5. 신성 정벌 ──
  {
    comboName: '신성 정벌',
    icon: '✨⚖️',
    triggerStatus: '공격 약화',
    triggerStatusTypes: ['debuff_atk'],
    requiredTagIds: ['holy'],
    summary: '단죄 30% 추가 피해 & 아군 전체 치유/마나',
    fullDesc: '공격 약화 상태의 적에게 신성 일격 적중 시 단죄 폭발 및 아군 전원 HP 대량 치유 + MP 10 반환',
    bannerColor: '#ffd54f',
  },
  // ── 6. 화염 폭풍 ──
  {
    comboName: '화염 폭풍',
    icon: '🔥🌪️',
    triggerStatus: '화상',
    triggerStatusTypes: ['burn'],
    requiredTagIds: ['storm'],
    summary: '40% 화염 소용돌이 폭발 & 적 전체 화상 확산',
    fullDesc: '화상 상태의 적을 거센 폭풍/바람 공격으로 강타 시 거센 불길 소용돌이가 일어나며 40% 추가 폭발 및 적 전체 화상 전염',
    bannerColor: '#ff6d00',
  },
  // ── 7. 초전도 감전 ──
  {
    comboName: '초전도 감전',
    icon: '⚡❄️',
    triggerStatus: '빙결/기절',
    triggerStatusTypes: ['freeze', 'stun'],
    requiredTagIds: ['lightning', 'magic'],
    summary: '마법 저항 50% 분쇄 & 연쇄 전격 40% 폭발',
    fullDesc: '얼어붙은 적에게 벼락/마법을 내리꽂아 초전도 상태를 유발하고 2턴간 방어/마법 저항을 50% 분쇄하며 연쇄 전격 피해',
    bannerColor: '#4fc3f7',
  },
  // ── 8. 급소 처형 낙인 ──
  {
    comboName: '급소 처형 낙인',
    icon: '🎯🩸',
    triggerStatus: '출혈/방어약화',
    triggerStatusTypes: ['bleed', 'debuff_def'],
    requiredTagIds: ['snipe', 'pierce'],
    summary: '방어 100% 무시 확정 치명타 (1.6배)',
    fullDesc: '상처가 벌어지거나 방어가 무너진 적의 급소를 저격으로 꿰뚫어 방어력을 100% 무시하는 1.6배 확정 치명타를 가합니다.',
    bannerColor: '#e040fb',
  },
  // ── 9. 암흑 피의 섭취 ──
  {
    comboName: '암흑 피의 섭취',
    icon: '🔮🩸',
    triggerStatus: '출혈',
    triggerStatusTypes: ['bleed'],
    requiredTagIds: ['dark', 'drain'],
    summary: '피해량 60% 아군 전체 수호 방벽 전환',
    fullDesc: '출혈 중인 적의 상처에서 피의 마력을 강탈하여 적에게 35% 암흑 피해를 입히고 가한 피해의 60%를 아군 전체 보호막으로 부여',
    bannerColor: '#880e4f',
  },
  // ── 10. 성염 융화 ──
  {
    comboName: '성염 융화',
    icon: '✨🔥',
    triggerStatus: '화상',
    triggerStatusTypes: ['burn'],
    requiredTagIds: ['holy'],
    summary: '신성 정화의 불꽃 폭발 & 적 버프 해제',
    fullDesc: '화상 상태의 적에게 신성 마법을 융합시켜 정화의 불꽃 폭발(45% 추가 피해)을 일으키고 적의 모든 강화 효과를 일제 해제',
    bannerColor: '#ffb300',
  },
  // ── 11. 신경 마비 충격 ──
  {
    comboName: '신경 마비 충격',
    icon: '🔨☣️',
    triggerStatus: '중독',
    triggerStatusTypes: ['poison'],
    requiredTagIds: ['crush'],
    summary: '1턴 확정 기절 & 신경 마비 행동 저지',
    fullDesc: '체내에 독이 퍼진 적을 강타로 충격하면 신경계가 붕괴하여 1턴간 완전히 기절하며 차징 행동을 취소시킵니다.',
    bannerColor: '#76ff03',
  },
  // ── 12. 뇌폭 폭풍 ──
  {
    comboName: '뇌폭 폭풍',
    icon: '⚡🌪️',
    triggerStatus: '빙결/기절',
    triggerStatusTypes: ['freeze', 'stun'],
    requiredTagIds: ['storm'],
    summary: '적 전체를 휩쓰는 벼락 폭풍 35% 연쇄 타격',
    fullDesc: '행동 불능 상태의 적에게 폭풍을 일으켜 전장에 거대한 뇌운을 소환하고 모든 적에게 35% 전격 폭풍 광역 피해',
    bannerColor: '#00e5ff',
  },
  // ── 13. 산성 외골격 융해 ──
  {
    comboName: '산성 외골격 융해',
    icon: '🛡️💥',
    triggerStatus: '중독',
    triggerStatusTypes: ['poison'],
    requiredTagIds: ['shield_break'],
    summary: '방패/외피 완전 부식 & 방어력 50% 영구 분쇄',
    fullDesc: '중독 독액에 방패 파쇄 공격을 가해 산성 반응을 극대화하여 3턴간 방어력을 50% 격하하고 30% 산성 파열 피해',
    bannerColor: '#cddc39',
  },
  // ── 14. 그림자 처형 기습 ──
  {
    comboName: '그림자 처형 기습',
    icon: '💫🗡️',
    triggerStatus: '공격 약화/기절',
    triggerStatusTypes: ['debuff_atk', 'stun'],
    requiredTagIds: ['slash', 'snipe'],
    summary: '약점 베기 50% 추가 피해 & 시전자 1턴 은신',
    fullDesc: '기절하거나 무력화된 적의 목을 베어 50%의 치명적 처형 피해를 입히고 시전자는 1턴간 회피율 60% 은신 상태 진입',
    bannerColor: '#673ab7',
  },
  // ── 15. 영혼 분리 흡수 ──
  {
    comboName: '영혼 분리 흡수',
    icon: '💀⚖️',
    triggerStatus: '공격 약화',
    triggerStatusTypes: ['debuff_atk'],
    requiredTagIds: ['dark', 'drain'],
    summary: '30% 암흑 피해 & 시전자 MP 25 즉시 충전',
    fullDesc: '공격력이 약화된 적의 영혼 정수를 갈고리로 낚아채 30% 암흑 피해를 입히고 시전자의 마나를 25 즉시 충전합니다.',
    bannerColor: '#311b92',
  },
  // ── 16. 열압력 열폭 ──
  {
    comboName: '열압력 열폭',
    icon: '🔥💥',
    triggerStatus: '화상',
    triggerStatusTypes: ['burn'],
    requiredTagIds: ['crush', 'shield_break'],
    summary: '고열 압축 폭발 & 인접 적 35% 파편 피해',
    fullDesc: '불타는 적을 둔기로 짓이겨 고열을 순간 압축 폭발시킵니다. 타겟에게 40% 추가 화염 피해 및 주변 적들에게 35% 파편 피해',
    bannerColor: '#ff3d00',
  },
];


/**
 * 스킬의 이름, 설명, ID, effectType, comboCategory를 종합 분석하여 대표 특성 태그 배열을 반환합니다.
 */
export function getSkillTags(skill: Skill | 'basic'): SkillTag[] {
  if (skill === 'basic') {
    return [{ id: 'slash', label: '베기/타격', bg: '#ef53501a', text: '#ef5350', border: '#ef535044', icon: '⚔️' }];
  }

  const tags: SkillTag[] = [];
  const sName = (skill.name || '').toLowerCase();
  const sDesc = (skill.description || '').toLowerCase();
  const sId = (skill.id || '').toLowerCase();
  const eff = skill.effectType || '';
  const comboCat = skill.comboCategory;

  // 1. 신성 (holy)
  if (comboCat === 'holy' || sName.includes('신성') || sDesc.includes('신성') || sId.includes('divine') || sId.includes('smite') || sId.includes('holy') || sName.includes('성광') || sName.includes('성역') || sDesc.includes('축복') || sId.includes('saint')) {
    tags.push({ id: 'holy', label: '신성', bg: '#ffd54f1a', text: '#ffd54f', border: '#ffd54f44', icon: '✨' });
  }

  // 2. 강타 (crush)
  if (comboCat === 'crush' || sName.includes('강타') || sName.includes('분쇄') || sName.includes('격파') || sName.includes('충격') || sName.includes('결전분노') || sName.includes('함성') || sName.includes('포효') || sName.includes('진격') || sDesc.includes('방패 강타') || sDesc.includes('둔기') || sDesc.includes('파쇄') || sDesc.includes('충격') || sId.includes('slam') || sId.includes('bash') || sId.includes('smash') || sId.includes('crush') || sId.includes('warcry') || sId.includes('roar') || sId.includes('order')) {
    tags.push({ id: 'crush', label: '강타', bg: '#ff91001a', text: '#ff9100', border: '#ff910044', icon: '🔨' });
  }

  // 3. 폭풍 / 바람 (storm / wind) 🌪️
  if (sName.includes('폭풍') || sName.includes('바람') || sName.includes('질풍') || sName.includes('돌풍') || sName.includes('회오리') || sName.includes('사이클론') || sName.includes('템페스트') || sName.includes('혈풍') || sDesc.includes('폭풍') || sDesc.includes('돌풍') || sDesc.includes('질풍') || sDesc.includes('바람') || sId.includes('storm') || sId.includes('cyclone') || sId.includes('wind') || sId.includes('flurry') || sId.includes('tempest') || sId.includes('gale') || sId.includes('tornado')) {
    tags.push({ id: 'storm', label: '폭풍', bg: '#00e5ff1a', text: '#00e5ff', border: '#00e5ff44', icon: '🌪️' });
  }

  // 4. 뇌격 / 전격 (lightning) ⚡
  if (sName.includes('번개') || sName.includes('뇌격') || sName.includes('전격') || sName.includes('낙뢰') || sDesc.includes('번개') || sDesc.includes('전격') || sDesc.includes('낙뢰') || sId.includes('lightning') || sId.includes('thunder') || sId.includes('shock') || sId.includes('bolt')) {
    tags.push({ id: 'lightning', label: '뇌격', bg: '#ffeb3b1a', text: '#ffee58', border: '#ffeb3b44', icon: '⚡' });
  }

  // 5. 관통 / 저격 (pierce / snipe)
  if (comboCat === 'pierce' || sName.includes('저격') || sName.includes('헤드샷') || sName.includes('궤도') || sName.includes('폭격') || sName.includes('리로드') || sDesc.includes('저격') || sDesc.includes('포격') || sId.includes('snipe') || sId.includes('headshot') || sId.includes('orbital') || sId.includes('drone') || sId.includes('reload')) {
    tags.push({ id: 'snipe', label: '저격', bg: '#29b6f61a', text: '#29b6f6', border: '#29b6f644', icon: '🎯' });
  } else if (sName.includes('관통') || sName.includes('사격') || sName.includes('속사') || sDesc.includes('관통') || sDesc.includes('탄환') || sDesc.includes('화살') || sId.includes('pierce') || sId.includes('shot') || sId.includes('bullet') || sId.includes('railgun')) {
    tags.push({ id: 'pierce', label: '관통', bg: '#42a5f51a', text: '#42a5f5', border: '#42a5f544', icon: '🏹' });
  }

  // 6. 베기 (slash)
  if (comboCat === 'slash' || sName.includes('베기') || sName.includes('참격') || sName.includes('난무') || sName.includes('일격') || sName.includes('왈츠') || sName.includes('암영') || sName.includes('반격') || sDesc.includes('참격') || sDesc.includes('검무') || sDesc.includes('칼날') || sDesc.includes('난무') || sDesc.includes('베어') || sId.includes('slash') || sId.includes('dance') || sId.includes('waltz') || sId.includes('blade') || sId.includes('cleave') || sId.includes('phantom') || sId.includes('riposte')) {
    tags.push({ id: 'slash', label: '베기', bg: '#ef53501a', text: '#ef5350', border: '#ef535044', icon: '🗡️' });
  }

  // 7. 암흑 / 저주 (dark) 🔮
  if (sName.includes('암흑') || sName.includes('그림자') || sName.includes('공허') || sName.includes('저주') || sName.includes('파멸') || sName.includes('암영') || sName.includes('아마게돈') || sName.includes('연막') || sDesc.includes('암흑') || sDesc.includes('공허') || sDesc.includes('저주') || sDesc.includes('침식') || sId.includes('dark') || sId.includes('shadow') || sId.includes('void') || sId.includes('curse') || sId.includes('rift') || sId.includes('armageddon') || sId.includes('smoke')) {
    tags.push({ id: 'dark', label: '암흑', bg: '#7e57c21a', text: '#b39ddb', border: '#7e57c244', icon: '🔮' });
  }

  // 8. 마법 / 원소 (magic / elemental)
  if (comboCat === 'magic' || sName.includes('마법') || sName.includes('화염') || sName.includes('빙결') || sName.includes('메테오') || sName.includes('시공') || sDesc.includes('마법') || sDesc.includes('원소') || sDesc.includes('에테르') || sDesc.includes('차원') || sId.includes('magic') || sId.includes('fire') || sId.includes('blizzard') || sId.includes('arcane') || sId.includes('gravity') || sId.includes('meteor') || sId.includes('rift') || sId.includes('time_warp')) {
    tags.push({ id: 'magic', label: '마법', bg: '#7c4dff1a', text: '#b388ff', border: '#7c4dff44', icon: '✨' });
  }

  // 9. 방패 파쇄 (shield break)
  if (sDesc.includes('방어력 감소') || sDesc.includes('방어 분쇄') || sDesc.includes('방어력 50%') || sDesc.includes('방어력 35%') || sDesc.includes('방어무시') || sId.includes('shatter') || sId.includes('break') || (eff === 'debuff' && sDesc.includes('방어'))) {
    tags.push({ id: 'shield_break', label: '방패 파쇄', bg: '#ab47bc1a', text: '#ab47bc', border: '#ab47bc44', icon: '🛡️💥' });
  }

  // 10. 치유 & 재생 (heal & regen)
  if (eff === 'heal' || sName.includes('치유') || sDesc.includes('치유') || sDesc.includes('체력 회복') || sId.includes('heal') || sId.includes('cure') || sId.includes('first_aid')) {
    tags.push({ id: 'heal', label: '치유', bg: '#66bb6a1a', text: '#66bb6a', border: '#66bb6a44', icon: '💚' });
  }
  if (eff === 'regen' || sName.includes('재생') || sDesc.includes('지속 재생') || sDesc.includes('매턴 hp') || sId.includes('regen') || sId.includes('vitality')) {
    tags.push({ id: 'regen', label: '재생', bg: '#26a69a1a', text: '#26a69a', border: '#26a69a44', icon: '🌱' });
  }

  // 11. 흡혈 (drain)
  if (eff === 'drain' || sName.includes('흡혈') || sDesc.includes('흡혈') || sDesc.includes('피해의 일부') || sId.includes('drain') || sId.includes('vampiric') || sId.includes('reap')) {
    tags.push({ id: 'drain', label: '흡혈', bg: '#e91e631a', text: '#e91e63', border: '#e91e6344', icon: '🩸' });
  }

  // 12. 보호막 (shield)
  if (eff === 'shield' || sName.includes('보호막') || sName.includes('방벽') || sName.includes('철벽') || sName.includes('방진') || sDesc.includes('보호막') || sDesc.includes('방어력') || sDesc.includes('방어 태세') || sId.includes('barrier') || sId.includes('shield') || sId.includes('bastion')) {
    tags.push({ id: 'shield', label: '보호막', bg: '#00d2ff1a', text: '#00d2ff', border: '#00d2ff44', icon: '🛡️' });
  }

  // 13. 기절 / 출혈 / 중독 / 빙결 / 화상 상태이상 부여형
  if (eff === 'stun' || sDesc.includes('기절') || sId.includes('stun')) {
    tags.push({ id: 'stun', label: '기절', bg: '#ffea001a', text: '#ffea00', border: '#ffea0044', icon: '💫' });
  }
  if (eff === 'bleed' || sDesc.includes('출혈') || sId.includes('bleed')) {
    tags.push({ id: 'bleed', label: '출혈', bg: '#ff17441a', text: '#ff1744', border: '#ff174444', icon: '🩸' });
  }
  if (eff === 'poison' || sDesc.includes('중독') || sDesc.includes('맹독') || sId.includes('poison') || sId.includes('venom')) {
    tags.push({ id: 'poison', label: '중독', bg: '#00e6761a', text: '#00e676', border: '#00e67644', icon: '☣️' });
  }
  if (eff === 'freeze' || sDesc.includes('빙결') || sDesc.includes('냉각') || sId.includes('freeze') || sId.includes('frost')) {
    tags.push({ id: 'freeze', label: '빙결', bg: '#80d8ff1a', text: '#80d8ff', border: '#80d8ff44', icon: '❄️' });
  }
  if (eff === 'burn' || sDesc.includes('화상') || sName.includes('화상') || sDesc.includes('화염') || sName.includes('화염') || sDesc.includes('불꽃') || sDesc.includes('작열') || sId.includes('burn') || sId.includes('flame') || sId.includes('ragnarok')) {
    tags.push({ id: 'burn', label: '화상', bg: '#ff6d001a', text: '#ff6d00', border: '#ff6d0044', icon: '🔥' });
  }

  // 최소 1개의 태그 보장
  if (tags.length === 0) {
    tags.push({ id: 'attack', label: '공격', bg: '#8b9bb41a', text: '#8b9bb4', border: '#8b9bb444', icon: '⚔️' });
  }

  return tags;
}

/**
 * 이 스킬이 유발할 수 있는 상태이상 연계 콤보 규칙들을 찾아서 반환합니다.
 */
export function getTriggerableCombos(skill: Skill | 'basic'): ComboRule[] {
  const tags = getSkillTags(skill);
  const tagIds = tags.map(t => t.id);

  return COMBO_RULES.filter(rule => 
    rule.requiredTagIds.some(req => tagIds.includes(req))
  );
}

/**
 * 현재 적 몬스터의 상태이상 목록을 보고, 이 스킬로 즉시 연계(Combo)를 터뜨릴 수 있는지 확인합니다.
 */
export function isComboReadyForMonster(skill: Skill | 'basic', monsterEffects?: StatusEffect[]): ComboRule | null {
  if (!monsterEffects || monsterEffects.length === 0) return null;
  const triggerable = getTriggerableCombos(skill);

  for (const combo of triggerable) {
    const hasTriggerStatus = monsterEffects.some(se => 
      combo.triggerStatusTypes.includes(se.type) && se.turnsLeft > 0
    );
    if (hasTriggerStatus) {
      return combo;
    }
  }
  return null;
}

/**
 * 스킬의 description, name, positionBonus 속성을 종합 분석하여
 * 실제 포지션 특화('front' | 'back' | 'any')를 추출합니다.
 */
export function getEffectivePositionBonus(skill: Skill | 'basic'): 'front' | 'back' | 'any' | undefined {
  if (skill === 'basic') return undefined;
  if (skill.positionBonus) return skill.positionBonus;

  const desc = skill.description || '';
  const name = skill.name || '';
  
  if (
    desc.includes('[후열 저격]') ||
    desc.includes('[후열 관통]') ||
    desc.includes('후열 적') ||
    desc.includes('적 후열') ||
    name.includes('저격') ||
    name.includes('헤드샷')
  ) {
    return 'back';
  }
  if (
    desc.includes('[전열 특화]') ||
    desc.includes('전열 적') ||
    desc.includes('적 전열') ||
    desc.includes('전열 1체')
  ) {
    return 'front';
  }
  if (desc.includes('[전열/후열 대응]') || desc.includes('전/후열 대응')) {
    return 'any';
  }
  return undefined;
}

export interface BattleMonsterTarget {
  id?: string;
  currentHp: number;
  statusEffects?: StatusEffect[];
  data?: { name: string; type?: string };
  isGroggy?: boolean;
}

/**
 * 스킬의 타겟팅 방식(광역/단일), 포지션 특화(전열/후열/전체), 현재 유저 선택 인덱스를 종합 고려하여,
 * 이 스킬이 "실제로 타격하게 될 몬스터들"의 배열을 반환합니다.
 * - idx < 2: 전열 (Front)
 * - idx >= 2: 후열 (Back)
 */
export function getActualSkillTargetMonsters<T extends BattleMonsterTarget>(
  skill: Skill | 'basic',
  monsters: T[],
  targetedMonsterIdx: number
): T[] {
  if (!monsters || monsters.length === 0) return [];

  // 1. 아군 대상 스킬은 적 몬스터를 타격하지 않음
  if (skill !== 'basic') {
    const tType = skill.targetType || '';
    if (tType === 'all_allies' || tType === 'single_ally' || tType === 'self') {
      return [];
    }
  }

  const aliveMonsters = monsters.filter(m => m.currentHp > 0);
  if (aliveMonsters.length === 0) return [];

  // 2. 적 전체 광역 공격: 살아있는 모든 적
  const isAoe = skill !== 'basic' && (
    skill.targetType === 'all_enemies' ||
    (skill.description && skill.description.includes('전체') && !skill.targetType?.includes('allie'))
  );
  if (isAoe) {
    return aliveMonsters;
  }

  // 3. 단일 대상 공격: 포지션 특화(positionBonus) 엄격 판정
  const posBonus = getEffectivePositionBonus(skill);

  if (posBonus === 'front') {
    // ⚔️ 전열 특화 스킬: 전열(idx < 2)의 몬스터만 우선 타격!
    if (targetedMonsterIdx < 2 && monsters[targetedMonsterIdx] && monsters[targetedMonsterIdx].currentHp > 0) {
      return [monsters[targetedMonsterIdx]];
    }
    const aliveFront = monsters.find((m, idx) => idx < 2 && m.currentHp > 0);
    if (aliveFront) {
      return [aliveFront];
    }
    // 전열이 모두 전멸했을 때만 남은 첫 번째 생존 몬스터 타격
    const firstAlive = monsters.find(m => m.currentHp > 0);
    return firstAlive ? [firstAlive] : [];
  }

  if (posBonus === 'back') {
    // 🎯 후열 저격 스킬: 후열(idx >= 2)의 몬스터만 우선 타격!
    if (targetedMonsterIdx >= 2 && monsters[targetedMonsterIdx] && monsters[targetedMonsterIdx].currentHp > 0) {
      return [monsters[targetedMonsterIdx]];
    }
    const aliveBack = monsters.find((m, idx) => idx >= 2 && m.currentHp > 0);
    if (aliveBack) {
      return [aliveBack];
    }
    // 후열이 모두 전멸했을 때만 남은 첫 번째 생존 몬스터 타격
    const firstAlive = monsters.find(m => m.currentHp > 0);
    return firstAlive ? [firstAlive] : [];
  }

  // 4. 일반 단일 공격: 유저가 선택한 몬스터가 생존해 있다면 그 대상, 아니면 첫 번째 생존 몬스터
  const currentTarget = monsters[targetedMonsterIdx];
  if (currentTarget && currentTarget.currentHp > 0) {
    return [currentTarget];
  }
  const firstAlive = monsters.find(m => m.currentHp > 0);
  return firstAlive ? [firstAlive] : [];
}

export interface ComboMatchResult<T extends BattleMonsterTarget = BattleMonsterTarget> {
  combo: ComboRule;
  targetMonster: T;
  targetIndex: number;
  isFrontTarget: boolean;
  isAoe: boolean;
}

/**
 * 전투 시 스킬 버튼에 연계 뱃지를 띄울지 여부를 결정하는 핵심 판별 엔진.
 * - 스킬의 실제 타겟팅 포지션(전열/후열/광역)을 정밀 분석.
 * - 실제로 공격받게 될 대상 몬스터(들)에게 "정확히 일치하는 선행 상태이상"이 적용되어 있는 경우에만 뱃지 활성화!
 * - 가령 후열 저격 스킬은 전열에 상태이상이 아무리 많아도 후열 대상에게 없으면 절대 뱃지가 등장하지 않습니다.
 */
export function isComboReadyForBattleTarget<T extends BattleMonsterTarget>(
  skill: Skill | 'basic',
  monsters: T[],
  targetedMonsterIdx: number
): ComboMatchResult<T> | null {
  const isAoe = Boolean(skill !== 'basic' && (
    skill.targetType === 'all_enemies' ||
    (skill.description && skill.description.includes('전체') && !skill.targetType?.includes('allie'))
  ));

  // 실제 타격 대상들 산출 (전열/후열 포지션 보너스 엄격 필터링)
  const actualTargets = getActualSkillTargetMonsters(skill, monsters, targetedMonsterIdx);
  if (actualTargets.length === 0) return null;

  for (const target of actualTargets) {
    if (!target.statusEffects || target.statusEffects.length === 0) continue;

    const combo = isComboReadyForMonster(skill, target.statusEffects);
    if (combo) {
      const originalIdx = monsters.indexOf(target);
      return {
        combo,
        targetMonster: target,
        targetIndex: originalIdx,
        isFrontTarget: originalIdx < 2,
        isAoe
      };
    }
  }

  return null;
}

// ─────────────────────────────────────────────────────────────
// 🤝 원호 공격 (Assist Follow-up Attack) 시스템 정의
// ─────────────────────────────────────────────────────────────

export interface AssistAttackDef {
  typeKey: 'tank' | 'rogue' | 'mage' | 'healer' | 'berserker' | 'gunner';
  typeName: string;
  skillName: string;
  icon: string;
  quote: string;
  ratio: number; // 기본 공격력 대비 대미지 배율 (예: 0.8 = 80%)
  desc: string;
  effectType: 'shield' | 'bleed' | 'mana' | 'heal' | 'debuff_atk' | 'debuff_def';
  vfx: 'heavy_slash' | 'arcane_nova' | 'divine_smite' | 'blood_bleed' | 'phantom_slash' | 'bullet_trail';
  sound: 'crit' | 'spell' | 'slash' | 'shield' | 'bash';
}

/**
 * 6대 클래스 계열별 고유 원호 추가타 정의
 */
export const CLASS_ASSIST_DEFINITIONS: Record<string, AssistAttackDef> = {
  // 1. 수호 / 기사 계열 (Tank)
  tank: {
    typeKey: 'tank',
    typeName: '수호 기사계',
    skillName: '수호의 방패 원호',
    icon: '🛡️💥',
    quote: '"방어선은 내가 지킨다! 연계 돌파!"',
    ratio: 0.75,
    desc: '적 차징 100 파쇄 및 아군 전체 최대 HP 12% 보호막 전개',
    effectType: 'shield',
    vfx: 'heavy_slash',
    sound: 'shield',
  },
  // 2. 그림자 / 암살 계열 (Rogue / Assassin / Duelist)
  rogue: {
    typeKey: 'rogue',
    typeName: '그림자 암살계',
    skillName: '그림자 기습 비수',
    icon: '🗡️🩸',
    quote: '"빈틈이다. 급소 포착!"',
    ratio: 1.20,
    desc: '방어력을 100% 무시하는 확정 치명타 및 2턴 깊은 출혈 부여',
    effectType: 'bleed',
    vfx: 'phantom_slash',
    sound: 'crit',
  },
  // 3. 원소 / 마도 계열 (Mage / Elementalist)
  mage: {
    typeKey: 'mage',
    typeName: '원소 마도계',
    skillName: '에테르 공명 탄막',
    icon: '🔮⚡',
    quote: '"마력 파동 증폭, 일제 방출!"',
    ratio: 0.90,
    desc: '마법 광역 탄막 연타 및 아군 파티 전원 MP 10 반환',
    effectType: 'mana',
    vfx: 'arcane_nova',
    sound: 'spell',
  },
  // 4. 신성 / 사제 계열 (Healer / Priest / Saintess)
  healer: {
    typeKey: 'healer',
    typeName: '신성 구원계',
    skillName: '빛의 단죄와 가호',
    icon: '🕊️✨',
    quote: '"빛의 정의가 함께하길! 정화하라!"',
    ratio: 0.65,
    desc: '신성 단죄 타격 및 최저 체력 아군 1명 체력 30% 즉각 응급 치유',
    effectType: 'heal',
    vfx: 'divine_smite',
    sound: 'spell',
  },
  // 5. 선봉 / 광전사 계열 (Berserker / Vanguard / Warlord)
  berserker: {
    typeKey: 'berserker',
    typeName: '광전사 선봉계',
    skillName: '전장의 분노 추격타',
    icon: '🪓🔥',
    quote: '"지금이다! 뼈까지 부숴주마!"',
    ratio: 1.30,
    desc: '묵직한 물리 파괴 일격 및 2턴간 대상의 공격력 30% 강제 억제',
    effectType: 'debuff_atk',
    vfx: 'heavy_slash',
    sound: 'bash',
  },
  // 6. 마총 / 저격 계열 (Gunner / Sharpshooter)
  gunner: {
    typeKey: 'gunner',
    typeName: '마총 저격계',
    skillName: '전술 마도 저격',
    icon: '🎯🔫',
    quote: '"사선 확보 완료. 격발!"',
    ratio: 1.10,
    desc: '방어 관통 마도탄 저격 및 2턴간 대상 방어력 35% 추가 분쇄',
    effectType: 'debuff_def',
    vfx: 'bullet_trail',
    sound: 'crit',
  },
};

/**
 * 용병의 classId 또는 role을 판별하여 해당하는 원호 정의를 반환합니다.
 */
export function getHeroAssistDef(hero: Mercenary): AssistAttackDef {
  const cid = (hero.classId || '').toLowerCase();
  
  if (cid.includes('paladin') || cid.includes('guard') || cid.includes('squire') || cid.includes('valkyrie') || cid.includes('aegis')) {
    return CLASS_ASSIST_DEFINITIONS.tank;
  }
  if (cid.includes('rogue') || cid.includes('assassin') || cid.includes('duelist') || cid.includes('phantom') || cid.includes('shadow')) {
    return CLASS_ASSIST_DEFINITIONS.rogue;
  }
  if (cid.includes('element') || cid.includes('mage') || cid.includes('apprentice') || cid.includes('scholar') || cid.includes('calamity')) {
    return CLASS_ASSIST_DEFINITIONS.mage;
  }
  if (cid.includes('acolyte') || cid.includes('priest') || cid.includes('bishop') || cid.includes('saint')) {
    return CLASS_ASSIST_DEFINITIONS.healer;
  }
  if (cid.includes('vanguard') || cid.includes('berserk') || cid.includes('warlord') || cid.includes('valhalla')) {
    return CLASS_ASSIST_DEFINITIONS.berserker;
  }
  if (cid.includes('gunner') || cid.includes('sharpshooter') || cid.includes('tactical')) {
    return CLASS_ASSIST_DEFINITIONS.gunner;
  }

  // fallback by role or default
  return CLASS_ASSIST_DEFINITIONS.berserker;
}

/**
 * 파티 내에서 공격자(attackerId)를 제외한 생존 아군 중 1명을 원호자로 선출합니다.
 */
export function selectAssistHero(party: Mercenary[], attackerId: string): Mercenary | null {
  const eligible = party.filter(h => 
    h.id !== attackerId && 
    h.currentHp > 0 && 
    !h.isPermanentlyDead && 
    !h.isDead && 
    h.deathCountdown === undefined
  );
  if (eligible.length === 0) return null;
  
  // 가장 공격력이 높거나 레벨이 높은 용병 우선
  eligible.sort((a, b) => {
    const aAtk = a.stats?.atk ?? (a as any).atk ?? 0;
    const bAtk = b.stats?.atk ?? (b as any).atk ?? 0;
    if (bAtk !== aAtk) return bAtk - aAtk;
    return b.level - a.level;
  });
  return eligible[0];
}

// ─────────────────────────────────────────────────────────────
// 👾 적(몬스터)의 아군 대상 상태이상 연계 공격 (Enemy Status Detonation)
// ─────────────────────────────────────────────────────────────

export interface EnemyComboResult {
  triggered: boolean;
  comboName: string;
  icon: string;
  desc: string;
  extraDamage: number;
  effectType?: 'stun' | 'vuln' | 'poison_splash' | 'mana_drain' | 'drain';
  bannerColor: string;
}

/**
 * 몬스터가 아군을 공격할 때, 아군의 상태이상을 파악하여 적의 상태이상 연계 공격을 판별합니다.
 */
export function checkMonsterStatusComboOnHero(
  monsterName: string,
  hero: Mercenary,
  baseDamage: number
): EnemyComboResult {
  const result: EnemyComboResult = {
    triggered: false,
    comboName: '',
    icon: '',
    desc: '',
    extraDamage: 0,
    bannerColor: '#ef5350'
  };

  const effects = hero.statusEffects || [];
  const findEff = (t: string) => effects.find(s => s.type === t && s.turnsLeft > 0);

  // 1. [빙결/기절] ➔ ❄️💥 빙결 쇄골 분쇄
  const freezeOrStun = findEff('freeze') || findEff('stun');
  if (freezeOrStun) {
    result.triggered = true;
    result.comboName = '빙결 쇄골 분쇄';
    result.icon = '❄️💥';
    result.bannerColor = '#00d2ff';
    result.extraDamage = Math.max(1, Math.floor(baseDamage * 0.45));
    result.desc = `${monsterName}이(가) 얼어붙은 ${hero.name}의 외피를 내리찍어 ${result.extraDamage}의 산산조각 파편 피해를 입히고 기절을 연장시킵니다!`;
    result.effectType = 'stun';
    return result;
  }

  // 2. [출혈] ➔ 🩸💥 상처 찢기
  const bleed = findEff('bleed');
  if (bleed) {
    result.triggered = true;
    result.comboName = '상처 찢기';
    result.icon = '🩸💥';
    result.bannerColor = '#ff1744';
    result.extraDamage = Math.max(1, Math.floor(baseDamage * 0.40));
    result.desc = `${monsterName}이(가) 피 흘리는 ${hero.name}의 상처를 무자비하게 후벼파 ${result.extraDamage} 추가 피해를 입히고 2턴간 받는 피해를 25% 증폭시킵니다!`;
    result.effectType = 'vuln';
    return result;
  }

  // 3. [중독] ➔ ☣️💥 독소 역류
  const poison = findEff('poison');
  if (poison) {
    result.triggered = true;
    result.comboName = '독소 역류';
    result.icon = '☣️💥';
    result.bannerColor = '#00e676';
    result.extraDamage = Math.max(1, Math.floor(baseDamage * 0.35));
    result.desc = `${monsterName}의 타격으로 ${hero.name}의 혈관 속 독소가 역류하여 ${result.extraDamage} 추가 피해를 입히고 인접 동료에게 독액을 흩뿌립니다!`;
    result.effectType = 'poison_splash';
    return result;
  }

  // 4. [화상] ➔ 🔥💥 불길 폭압
  const burn = findEff('burn');
  if (burn) {
    result.triggered = true;
    result.comboName = '불길 폭압';
    result.icon = '🔥💥';
    result.bannerColor = '#ff6d00';
    result.extraDamage = Math.max(1, Math.floor(baseDamage * 0.40));
    result.desc = `${monsterName}이(가) 불타는 ${hero.name}의 화염을 자극하여 ${result.extraDamage} 화염 폭발을 일으키고 마나를 15 소실시킵니다!`;
    result.effectType = 'mana_drain';
    return result;
  }

  // 5. [방어 약화] ➔ 🛡️💔 방어선 붕괴
  const defDebuff = findEff('debuff_def');
  if (defDebuff) {
    result.triggered = true;
    result.comboName = '방어선 붕괴';
    result.icon = '🛡️💔';
    result.bannerColor = '#ff9100';
    result.extraDamage = Math.max(1, Math.floor(baseDamage * 0.35));
    result.desc = `${monsterName}이(가) 방어가 허물어진 ${hero.name}의 틈새를 꿰뚫어 ${result.extraDamage}의 치명타 관통 피해를 입힙니다!`;
    return result;
  }

  // 6. [공격 약화] ➔ 💀⚖️ 생명력 갈취
  const atkDebuff = findEff('debuff_atk');
  if (atkDebuff) {
    result.triggered = true;
    result.comboName = '생명력 갈취';
    result.icon = '💀⚖️';
    result.bannerColor = '#7e57c2';
    result.extraDamage = Math.max(1, Math.floor(baseDamage * 0.30));
    result.desc = `${monsterName}이(가) 무력해진 ${hero.name}의 생명력을 흡수하여 ${result.extraDamage} 피해를 가하고 자신의 체력을 회복합니다!`;
    result.effectType = 'drain';
    return result;
  }

  return result;
}

// ─────────────────────────────────────────────────────────────
// 📜 장비 인챈트 특수 효과 프록 추가타 (Equipment Proc)
// ─────────────────────────────────────────────────────────────

export interface EquipmentProcResult {
  triggered: boolean;
  procName: string;
  equipName: string;
  extraDamage: number;
  icon: string;
  desc: string;
}

/**
 * 영웅의 장비 인챈트 옵션을 검사하여 25% 확률로 마도 인챈트 프록 추가타를 발동합니다.
 */
export function checkEquipmentProc(hero: Mercenary): EquipmentProcResult | null {
  const equips = Object.values(hero.equipment || {}).filter(Boolean);
  if (equips.length === 0) return null;

  // 인챈트가 붙은 장비 탐색
  const enchanted = equips.filter(e => e.enchantPrefix || e.enchantSuffix);
  if (enchanted.length === 0) return null;

  // 25% 기본 발동 확률
  if (Math.random() > 0.25) return null;

  const targetEquip = enchanted[Math.floor(Math.random() * enchanted.length)];
  const opt = targetEquip.enchantPrefix || targetEquip.enchantSuffix;
  const optName = opt?.name || '마도 룬';

  let procName = '에테르 공명 검기';
  let icon = '🗡️✨';
  let ratio = 0.50;

  if (optName.includes('질풍') || optName.includes('신속') || optName.includes('바람')) {
    procName = '질풍의 칼바람';
    icon = '🌪️⚔️';
    ratio = 0.55;
  } else if (optName.includes('화염') || optName.includes('작열') || optName.includes('혈염')) {
    procName = '작열의 혈염파';
    icon = '🔥🗡️';
    ratio = 0.60;
  } else if (optName.includes('번개') || optName.includes('뇌전') || optName.includes('전격')) {
    procName = '뇌전의 낙뢰검';
    icon = '⚡🗡️';
    ratio = 0.55;
  } else if (optName.includes('사신') || optName.includes('암흑') || optName.includes('처형')) {
    procName = '사신의 처형 비수';
    icon = '💀🗡️';
    ratio = 0.65;
  } else if (optName.includes('수호') || optName.includes('강철') || optName.includes('신성')) {
    procName = '신성한 성광 파동';
    icon = '✨🛡️';
    ratio = 0.50;
  }

  const heroAtk = hero.stats?.atk ?? (hero as any).atk ?? 20;
  const extraDmg = Math.max(10, Math.floor(heroAtk * ratio * (0.9 + Math.random() * 0.2)));

  return {
    triggered: true,
    procName,
    equipName: targetEquip.name,
    extraDamage: extraDmg,
    icon,
    desc: `[${targetEquip.name}]의 [${optName}] 룬이 공명하여 [${procName}]이(가) 뿜어져 나왔습니다!`
  };
}

// ─────────────────────────────────────────────────────────────────────────────
//  🎯 [VFX & SFX 통합 태그 선별 매핑 엔진]
// ─────────────────────────────────────────────────────────────────────────────

export interface CombatVfxSfxPair {
  vfx: VFXType;
  sfx: SoundEffectType;
  primaryTag: string;
}

/**
 * 스킬(또는 기본 공격), 시전자(영웅/몬스터), 광역 여부 및 티어를 분석하여
 * 상응하는 최적의 VFX 타입과 정밀 SFX 사운드 타입을 1:1로 매핑하여 반환합니다.
 */
export function resolveCombatVfxAndSfx(
  skill: Skill | MonsterSkill | 'basic' | null | undefined,
  heroOrAttacker?: Mercenary | MonsterData | string,
  isMultiTarget = false,
  skillTier: 0 | 1 | 2 = 0
): CombatVfxSfxPair {
  const classOrName = typeof heroOrAttacker === 'string'
    ? heroOrAttacker
    : ('classId' in (heroOrAttacker || {}) ? (heroOrAttacker as Mercenary).classId : (heroOrAttacker as MonsterData)?.name || '');
  const c = classOrName.toLowerCase();

  // 1. 기본 공격 (Basic Attack)
  if (!skill || skill === 'basic') {
    if (c.includes('gun') || c.includes('sniper') || c.includes('cannon')) {
      return { vfx: isMultiTarget ? 'bullet_aoe' : 'bullet', sfx: 'gunshot', primaryTag: 'snipe' };
    }
    if (c.includes('archer') || c.includes('ranger') || c.includes('hunter') || c.includes('bow')) {
      return { vfx: isMultiTarget ? 'bullet_aoe' : 'bullet', sfx: 'bow_shot', primaryTag: 'snipe' };
    }
    if (c.includes('lancer') || c.includes('spear') || c.includes('dragoon') || c.includes('valkyrie')) {
      return { vfx: isMultiTarget ? 'slash_aoe' : 'crit_slash', sfx: 'pierce', primaryTag: 'pierce' };
    }
    if (c.includes('crusher') || c.includes('hammer') || c.includes('berserker') || c.includes('mace') || c.includes('brawler') || c.includes('monk') || c.includes('paladin') || c.includes('warlord')) {
      return { vfx: isMultiTarget ? 'heavy_slash_aoe' : 'heavy_slash', sfx: 'crush', primaryTag: 'crush' };
    }
    if (c.includes('cleric') || c.includes('priest') || c.includes('saint') || c.includes('bishop')) {
      return { vfx: isMultiTarget ? 'divine_smite_aoe' : 'divine_smite', sfx: 'holy_spell', primaryTag: 'holy' };
    }
    if (c.includes('mage') || c.includes('wizard') || c.includes('apprentice') || c.includes('scholar') || c.includes('elemental')) {
      return { vfx: isMultiTarget ? 'arcane_nova' : 'bullet', sfx: 'arcane_magic', primaryTag: 'magic' };
    }
    if (c.includes('warlock') || c.includes('necromancer') || c.includes('dark') || c.includes('abyss') || c.includes('reaper')) {
      return { vfx: isMultiTarget ? 'dark_curse_aoe' : 'dark_curse', sfx: 'dark_magic', primaryTag: 'dark' };
    }
    if (c.includes('rogue') || c.includes('assassin') || c.includes('duelist') || c.includes('phantom')) {
      return { vfx: isMultiTarget ? 'phantom_slash' : 'slash', sfx: 'slash', primaryTag: 'slash' };
    }
    return { vfx: isMultiTarget ? 'slash_aoe' : 'slash', sfx: 'slash', primaryTag: 'slash' };
  }

  // 2. 특수 상징적 스킬 ID / 네임 예외
  const sid = (skill.id || '').toLowerCase();
  const sName = (skill.name || '').toLowerCase();
  const sDesc = (skill.description || '').toLowerCase();
  const eff = (skill.effectType || '').toLowerCase();
  const isBossMonster = (heroOrAttacker as any)?.type === 'boss' || Boolean((heroOrAttacker as any)?.isBoss);

  // ☄️ 유성 / 메테오 / 초신성 (최우선 판정: calamity_ultimate 및 메테오 스킬)
  if (
    sid.includes('meteor') || sName.includes('메테오') || sDesc.includes('메테오') ||
    sName.includes('유성') || sDesc.includes('유성') ||
    sid.includes('supernova') || sName.includes('초신성') ||
    sid.includes('flame_pillar') || sid === 'calamity_ultimate'
  ) {
    return { vfx: 'meteor_strike', sfx: 'fire', primaryTag: 'burn' };
  }

  // 🗡️ 환영 난무 / 왈츠 / 분신 / 검무
  if (
    sid.includes('phantom') || sid.includes('shadow_dance') || sid.includes('waltz') || sid === 'duel_blade_waltz' ||
    sName.includes('환영') || sName.includes('난무') || sName.includes('검무') || sName.includes('분신') ||
    sid.includes('flurry') || sid.includes('thousand_cuts') || sName.includes('질풍참')
  ) {
    return { vfx: 'phantom_slash', sfx: 'slash', primaryTag: 'slash' };
  }

  // ❄️ 눈보라 / 절대영도
  if (
    sid.includes('blizzard') || sid.includes('absolute_zero') ||
    sName.includes('눈보라') || sName.includes('절대영도') || sid.includes('colossus_core')
  ) {
    return { vfx: 'blizzard_storm', sfx: 'ice', primaryTag: 'freeze' };
  }

  // 🎯 사격 / 총탄 / 저격 / 레일건 / 드론 / 궤도 폭격 (Hero 총기 및 저격 스킬)
  if (
    sid.includes('snipe') || sid.includes('bullet') || sid.includes('railgun') || sid.includes('drone') ||
    sid.includes('gun_') || sid.includes('sharp_') || sid.includes('plasma') || sid.includes('orbital') ||
    sName.includes('탄환') || sName.includes('저격') || sName.includes('사격') || sName.includes('레일건') ||
    sName.includes('관통포') || sName.includes('버스터') || sName.includes('폭격') || sDesc.includes('탄환') ||
    c.includes('gun') || c.includes('sniper')
  ) {
    return { vfx: isMultiTarget ? 'bullet_aoe' : 'bullet', sfx: 'gunshot', primaryTag: 'snipe' };
  }

  // 🏹 궁술 / 화살
  if (
    sName.includes('화살비') || sid.includes('arrow_storm') ||
    (sName.includes('화살') && !sName.includes('에테르')) ||
    c.includes('archer') || c.includes('ranger') || c.includes('hunter')
  ) {
    return { vfx: isMultiTarget ? 'bullet_aoe' : 'bullet', sfx: 'bow_shot', primaryTag: 'snipe' };
  }

  // 🌌 비전 폭발 / 특이점 / 시공 정지 / 중력 붕괴
  if (
    sid.includes('nova') || sid.includes('singularity') || sName.includes('특이점') ||
    sName.includes('오버로드') || sid.includes('arcane_overload') || sid.includes('time_stop') ||
    sName.includes('시공 정지') || sid.includes('gravity') || sName.includes('중력') ||
    sid.includes('chrono_warp') || sid.includes('arcane_storm')
  ) {
    return { vfx: 'arcane_nova', sfx: 'arcane_magic', primaryTag: 'magic' };
  }

  // 🌋 발키리/광전사 궁극기: 결전분노
  if (sid === 'val_ultimate' || sName.includes('결전분노')) {
    return { vfx: 'boss_cataclysm', sfx: 'crush', primaryTag: 'crush' };
  }

  // 👑 보스 전용 화면 장악 연출 (보스 몬스터이거나 보스 전용 스킬일 때만)
  if (isBossMonster || sid.includes('boss_asmodeus') || sid.includes('apocalypse')) {
    if (sName.includes('종말') || sName.includes('대재앙') || sid.includes('apocalypse')) {
      return { vfx: 'boss_apocalypse', sfx: 'dark_magic', primaryTag: 'dark' };
    }
    if (sName.includes('공허') || sName.includes('블랙홀') || sName.includes('와류') || sid.includes('vortex')) {
      return { vfx: 'boss_abyss_vortex', sfx: 'dark_magic', primaryTag: 'dark' };
    }
    if (sName.includes('브레스') || sName.includes('숨결') || sid.includes('breath')) {
      return { vfx: 'boss_dragon_breath', sfx: 'fire', primaryTag: 'burn' };
    }
    if (sName.includes('지각 파괴') || sName.includes('천지 분쇄') || sid.includes('cataclysm')) {
      return { vfx: 'boss_cataclysm', sfx: 'crush', primaryTag: 'crush' };
    }
  }

  // 3. getSkillTags 기반 우선순위 매핑
  const tags = getSkillTags(skill as Skill);
  const tagIds = new Set(tags.map(t => t.id));

  // A. 신성 (holy)
  if (tagIds.has('holy') || sName.includes('신성') || sDesc.includes('신성') || sid.includes('holy') || sid.includes('divine') || sid.includes('smite') || sName.includes('성광') || sName.includes('성전') || sName.includes('성령') || sName.includes('정화의 빛')) {
    return { vfx: isMultiTarget ? 'divine_smite_aoe' : 'divine_smite', sfx: 'holy_spell', primaryTag: 'holy' };
  }

  // B. 암흑 / 심연 / 저주 (dark)
  if (tagIds.has('dark') || sName.includes('암흑') || sDesc.includes('암흑') || sid.includes('dark') || sid.includes('curse') || sid.includes('void') || sName.includes('심연') || sid.includes('armageddon') || sName.includes('아마겟돈')) {
    return { vfx: isMultiTarget ? 'dark_curse_aoe' : 'dark_curse', sfx: 'dark_magic', primaryTag: 'dark' };
  }

  // C. 화염 / 화상 (burn / fire)
  if (tagIds.has('burn') || sName.includes('화염') || sDesc.includes('화염') || sid.includes('fire') || sid.includes('flame') || sid.includes('eruption') || sDesc.includes('화상') || sName.includes('불꽃')) {
    return { vfx: isMultiTarget ? 'fire_aoe' : 'fire', sfx: 'fire', primaryTag: 'burn' };
  }

  // D. 빙결 / 냉기 (freeze / ice)
  if (tagIds.has('freeze') || sName.includes('빙결') || sDesc.includes('빙결') || sid.includes('ice') || sid.includes('frost') || sDesc.includes('동상') || sName.includes('서리')) {
    return { vfx: isMultiTarget ? 'blizzard_storm' : 'ice', sfx: 'ice', primaryTag: 'freeze' };
  }

  // E. 뇌격 / 번개 (lightning)
  if (tagIds.has('lightning') || sName.includes('번개') || sName.includes('뇌격') || sid.includes('lightning') || sid.includes('thunder') || sName.includes('전격') || sName.includes('낙뢰') || sName.includes('벼락')) {
    return { vfx: isMultiTarget ? 'lightning_aoe' : 'lightning', sfx: 'lightning', primaryTag: 'lightning' };
  }

  // F. 폭풍 / 바람 (storm / wind)
  if (tagIds.has('storm') || sName.includes('폭풍') || sName.includes('돌풍') || sName.includes('질풍') || sid.includes('storm') || sid.includes('wind') || sid.includes('gale') || sName.includes('회오리')) {
    return { vfx: isMultiTarget ? 'blizzard_storm' : 'arcane_nova', sfx: 'wind_storm', primaryTag: 'storm' };
  }

  // G. 중독 / 맹독 / 산성 (poison)
  if (tagIds.has('poison') || eff === 'poison' || sName.includes('독') || sDesc.includes('중독') || sid.includes('poison') || sid.includes('toxic') || sid.includes('acid') || sName.includes('부식')) {
    return { vfx: isMultiTarget ? 'toxic_eruption_aoe' : 'toxic_eruption', sfx: 'poison', primaryTag: 'poison' };
  }

  // H. 출혈 / 열상 (bleed)
  if (tagIds.has('bleed') || eff === 'bleed' || sName.includes('출혈') || sDesc.includes('출혈') || sid.includes('bleed') || sid.includes('blood') || sName.includes('선혈') || sName.includes('혈풍')) {
    return { vfx: isMultiTarget ? 'blood_bleed_aoe' : 'blood_bleed', sfx: 'bleed', primaryTag: 'bleed' };
  }

  // I. 흡혈 / 생명착취 (drain)
  if (tagIds.has('drain') || eff === 'drain' || sName.includes('흡혈') || sDesc.includes('흡혈') || sid.includes('drain') || sName.includes('착취') || sid.includes('reap')) {
    return { vfx: isMultiTarget ? 'blood_bleed_aoe' : 'necrotic_drain', sfx: 'drain', primaryTag: 'drain' };
  }

  // J. 방패 파쇄 (shield_break)
  if (tagIds.has('shield_break') || sName.includes('파쇄') || sDesc.includes('방어 분쇄') || sid.includes('break') || sName.includes('방패 깨기')) {
    return { vfx: isMultiTarget ? 'heavy_slash_aoe' : 'heavy_slash', sfx: 'shield_break', primaryTag: 'shield_break' };
  }

  // K. 강타 / 기절 / 둔기 / 지진 (crush / stun)
  if (tagIds.has('crush') || tagIds.has('stun') || eff === 'stun' || sName.includes('강타') || sName.includes('분쇄') || sName.includes('충격') || sid.includes('crush') || sid.includes('smash') || sid.includes('bash') || sid.includes('slam') || sName.includes('해머') || sName.includes('대지분쇄') || sName.includes('지진') || sName.includes('총진격')) {
    return { vfx: isMultiTarget ? 'heavy_slash_aoe' : 'heavy_slash', sfx: 'crush', primaryTag: 'crush' };
  }

  // L. 치유 & 재생 (heal)
  if (tagIds.has('heal') || eff === 'heal' || sName.includes('치유') || sDesc.includes('치유') || sid.includes('heal') || sName.includes('회복') || sName.includes('소생') || sName.includes('부활')) {
    return { vfx: isMultiTarget ? 'holy_heal_aoe' : 'holy_heal', sfx: 'heal', primaryTag: 'heal' };
  }

  // M. 보호막 & 방벽 (shield)
  if (tagIds.has('shield') || eff === 'shield' || sName.includes('보호막') || sName.includes('방벽') || sid.includes('shield') || sName.includes('결계') || sName.includes('방진') || sName.includes('성벽') || sName.includes('성역') || sName.includes('오라') || sName.includes('철벽')) {
    return { vfx: 'shield', sfx: 'shield', primaryTag: 'shield' };
  }

  // N. 마법 / 비전 (magic)
  if (tagIds.has('magic') || sName.includes('마법') || sDesc.includes('마법') || sDesc.includes('에테르') || sid.includes('magic') || sid.includes('arcane')) {
    return { vfx: isMultiTarget ? 'arcane_nova' : 'bullet', sfx: 'arcane_magic', primaryTag: 'magic' };
  }

  // O. 베기 / 참격 (slash)
  return { vfx: isMultiTarget ? 'slash_aoe' : 'slash', sfx: 'slash', primaryTag: 'slash' };
}

/**
 * 🌟 특정 VFX가 전투 엔진에서 단독 또는 연계로 발동될 때 매칭되는 표준 SFX 반환
 * 에셋 스튜디오 미리보기와 인게임 전투 엔진의 완벽한 1:1 일치 보장
 */
export function getVfxAssociatedSfx(vfxType: VFXType): SoundEffectType {
  switch (vfxType) {
    // ⚔️ 물리/참격 계열
    case 'slash':
    case 'slash_aoe':
    case 'phantom_slash':
    case 'sonic':
      return 'slash';
    case 'heavy_slash':
    case 'heavy_slash_aoe':
      return 'crush';
    case 'crit_slash':
      return 'crit';
    case 'claw':
    case 'claw_aoe':
    case 'abyssal_claw':
      return 'slash';

    // 🎯 원거리/탄환
    case 'bullet':
    case 'bullet_aoe':
    case 'bullet_trail':
      return 'gunshot';

    // 🔥 화염/운석
    case 'fire':
    case 'fire_aoe':
    case 'meteor_strike':
    case 'boss_dragon_breath':
    case 'status_burn':
      return 'fire';

    // ❄️ 빙결/혹한
    case 'ice':
    case 'ice_aoe':
    case 'blizzard_storm':
    case 'status_freeze':
      return 'ice';

    // ⚡ 전격/번개
    case 'lightning':
    case 'lightning_aoe':
      return 'lightning';

    // 🔮 암흑/심연/공허
    case 'dark_curse':
    case 'dark_curse_aoe':
    case 'shadow_strike':
    case 'boss_apocalypse':
    case 'boss_abyss_vortex':
    case 'status_curse':
      return 'dark_magic';

    // ✨ 신성/성광
    case 'divine_smite':
    case 'divine_smite_aoe':
      return 'holy_spell';

    // ☠️ 맹독/부식
    case 'toxic_eruption':
    case 'toxic_eruption_aoe':
    case 'status_poison':
      return 'poison';

    // 🩸 출혈/열상
    case 'blood_bleed':
    case 'blood_bleed_aoe':
    case 'status_bleed':
      return 'bleed';

    // 🩸 흡혈
    case 'necrotic_drain':
      return 'drain';

    // 🔮 비전/마법
    case 'arcane_nova':
      return 'arcane_magic';

    // 🌋 대지 분쇄
    case 'boss_cataclysm':
      return 'crush';

    // 💫 기절
    case 'status_stun':
      return 'stun';

    // 💚 치유 & 🛡️ 보호막
    case 'holy_heal':
    case 'holy_heal_aoe':
      return 'heal';
    case 'shield':
    case 'status_shield':
      return 'shield';

    // ⚡ 시스템 / 차징 / 제작 / 회피
    case 'charge':
      return 'charge';
    case 'forge_spark':
      return 'anvil';
    case 'craft_magic':
      return 'craft';
    case 'evade':
      return 'evade';

    default:
      return 'slash';
  }
}
