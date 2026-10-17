import { EquipmentRecipe, EnchantOption, EquipmentItem, EquipmentSlot, WeaponType, WeaponTrait, GameResources } from '../types/game';

// ═══════════════════════════════════════════════════════════════════════
// 🏷️ 무기 계열별 고유 특성 뱃지 및 메커니즘 (Weapon Traits)
// ═══════════════════════════════════════════════════════════════════════
export const WEAPON_TRAITS: Record<WeaponType, WeaponTrait> = {
  sword: {
    id: 'trait_slash',
    weaponType: 'sword',
    badge: '🗡️ 베기',
    name: '베기',
    color: '#ff5252',
    bgColor: 'rgba(255, 82, 82, 0.15)',
    shortDesc: '기본 공격 시 대상에게 1턴간 출혈 부여',
    description: '예리한 칼날로 대상을 베어내 기본 공격 시 대상에게 1턴간 출혈(Bleed) 상태이상을 부여합니다.'
  },
  spear: {
    id: 'trait_bash',
    weaponType: 'spear',
    badge: '🔱 방어 파쇄',
    name: '방어 파쇄',
    color: '#ff9800',
    bgColor: 'rgba(255, 152, 0, 0.15)',
    shortDesc: '보호막에 50% 추가 피해',
    description: '단단한 보호막을 분쇄하는 창끝으로 적의 보호막(Shield)에 50%의 추가 피해를 입힙니다.'
  },
  bow: {
    id: 'trait_snipe',
    weaponType: 'bow',
    badge: '🏹 급소 사격',
    name: '급소 사격',
    color: '#69f0ae',
    bgColor: 'rgba(105, 240, 174, 0.15)',
    shortDesc: '기본 공격 시 치명타율 +5% · 치명타 피해 +5%',
    description: '원거리 정밀 조준으로 기본 공격 시 치명타율이 +5%, 치명타 피해량이 +5% 증가합니다.'
  },
  gun: {
    id: 'trait_burst',
    weaponType: 'gun',
    badge: '🔫 연사',
    name: '연사',
    color: '#00e5ff',
    bgColor: 'rgba(0, 229, 255, 0.15)',
    shortDesc: '기본 공격 시 기본 15% + 행운 보정 추가 점사 (공격력 45% 피해)',
    description: '탄환을 일제 사격하여 기본 공격 시 기본 15%에 행운(🍀) 보정을 더한 확률로 공격력의 45% 위력을 지닌 추가 점사 탄환을 격발합니다.'
  },
  dagger: {
    id: 'trait_ambush',
    weaponType: 'dagger',
    badge: '⚡ 암습',
    name: '암습',
    color: '#b388ff',
    bgColor: 'rgba(179, 136, 255, 0.15)',
    shortDesc: '상대보다 속도가 빠를수록 피해량 최대 20% 증폭',
    description: '민첩한 선제 공격으로 대상 마물보다 속도가 빠를수록 피해량이 최대 20%까지 증폭됩니다.'
  },
  staff: {
    id: 'trait_resonance',
    weaponType: 'staff',
    badge: '🪄 마력 공명',
    name: '마력 공명',
    color: '#e040fb',
    bgColor: 'rgba(224, 64, 251, 0.15)',
    shortDesc: '스킬 마나 소모량 5% 절감',
    description: '에테르 마나 순환을 안정화하여 모든 스킬의 마나 소모량을 5% 절감합니다.'
  }
};

/**
 * 🔍 아이템 객체, 레시피, 또는 명칭/ID로부터 무기 계열(WeaponType)을 자동 판별합니다.
 */
export function detectWeaponType(itemOrName: { slot?: string; baseName?: string; name?: string; id?: string; weaponType?: WeaponType } | string): WeaponType | undefined {
  if (typeof itemOrName !== 'string' && itemOrName?.weaponType) {
    return itemOrName.weaponType;
  }
  const str = typeof itemOrName === 'string' 
    ? itemOrName 
    : `${itemOrName?.id || ''} ${itemOrName?.baseName || ''} ${itemOrName?.name || ''}`;
  
  const lower = str.toLowerCase();
  if (lower.includes('spear') || str.includes('창') || str.includes('극창') || str.includes('장창') || str.includes('신창') || str.includes('트라이던트')) {
    return 'spear';
  }
  if (lower.includes('dagger') || str.includes('단검') || str.includes('비수') || str.includes('단도')) {
    return 'dagger';
  }
  if (lower.includes('sword') || str.includes('검') || str.includes('도') || str.includes('대검') || str.includes('세이버') || str.includes('블레이드')) {
    return 'sword';
  }
  if (lower.includes('bow') || str.includes('활') || str.includes('대궁') || str.includes('궁') || str.includes('장궁')) {
    return 'bow';
  }
  if (lower.includes('gun') || str.includes('총') || str.includes('마총') || str.includes('포') || str.includes('권총') || str.includes('라이플') || str.includes('캐논')) {
    return 'gun';
  }
  if (lower.includes('staff') || str.includes('지팡이') || str.includes('마도봉') || str.includes('로드') || str.includes('완드')) {
    return 'staff';
  }
  return undefined;
}

export type AccessoryType = 'ring' | 'necklace' | 'amulet';

/**
 * 💍 아이템 객체, 레시피, 또는 명칭/ID로부터 악세사리 세부 계열(반지/목걸이/부적)을 자동 판별합니다.
 */
export function detectAccessoryType(itemOrName: { slot?: string; baseName?: string; name?: string; id?: string; icon?: string } | string): AccessoryType | undefined {
  const str = typeof itemOrName === 'string'
    ? itemOrName
    : `${itemOrName?.id || ''} ${itemOrName?.baseName || ''} ${itemOrName?.name || ''}`;

  const lower = str.toLowerCase();
  const icon = typeof itemOrName !== 'string' ? itemOrName?.icon : undefined;

  if (icon === '💍' || lower.includes('ring') || str.includes('반지') || str.includes('가락지') || str.includes('링')) {
    return 'ring';
  }
  if (icon === '📿' || lower.includes('necklace') || lower.includes('choker') || str.includes('목걸이') || str.includes('펜던트') || str.includes('초커') || str.includes('목걸')) {
    return 'necklace';
  }
  if (icon === '🧿' || lower.includes('amulet') || lower.includes('talisman') || lower.includes('charm') || str.includes('부적') || str.includes('성유물') || str.includes('탈리스만') || str.includes('오브') || str.includes('인장')) {
    return 'amulet';
  }
  return undefined;
}

/**
 * 🏷️ 아이템이나 무기 타입에 대응하는 무기 고유 특성(WeaponTrait)을 반환합니다.
 */
export function getWeaponTrait(itemOrType: { slot?: string; baseName?: string; name?: string; id?: string; weaponType?: WeaponType; weaponTrait?: WeaponTrait } | string): WeaponTrait | undefined {
  if (typeof itemOrType !== 'string' && itemOrType?.weaponTrait) {
    return itemOrType.weaponTrait;
  }
  const wType = (typeof itemOrType === 'string' && itemOrType in WEAPON_TRAITS)
    ? (itemOrType as WeaponType)
    : detectWeaponType(itemOrType);
  return wType ? WEAPON_TRAITS[wType] : undefined;
}

export const EQUIPMENT_RECIPES: EquipmentRecipe[] = [
  // ─── 무기 (Weapons - 6종) ──────────────────────────────
  {
    id: 'rec_sword',
    name: '검',
    slot: 'weapon',
    weaponType: 'sword',
    weaponTrait: WEAPON_TRAITS.sword,
    rarity: 'common',
    cost: { iron: 35, coal: 6, wood: 10, gold: 200 },
    baseStats: { atk: 4, luck: 1 },
    description: '단단한 철광석을 석탄 열기로 벼려낸 기본 검. [🗡️ 베기] 특성으로 기본 공격 시 출혈 대상에게 [상처 절개]를 발동합니다.',
    icon: '⚔️'
  },
  {
    id: 'rec_spear',
    name: '창',
    slot: 'weapon',
    weaponType: 'spear',
    weaponTrait: WEAPON_TRAITS.spear,
    rarity: 'common',
    cost: { iron: 28, wood: 25, coal: 6, gold: 220 },
    baseStats: { atk: 5, def: 1 },
    description: '강철 창날과 탄성 목재 자루를 결합한 견고한 창. [🔱 방어 파쇄] 특성으로 적의 보호막에 50% 추가 피해를 줍니다.',
    icon: '🔱'
  },
  {
    id: 'rec_gun',
    name: '마총',
    slot: 'weapon',
    weaponType: 'gun',
    weaponTrait: WEAPON_TRAITS.gun,
    rarity: 'rare',
    cost: { iron: 30, ether: 20, coal: 8, gold: 350 },
    baseStats: { atk: 3, spd: 2 },
    description: '에테르 기동 마력과 석탄 화약으로 탄환을 추진하는 전술 마총. [🔫 연사] 특성으로 기본 공격 시 기본 15% + 행운 보정으로 추가 점사 탄환(공격력 45% 피해)을 격발합니다.',
    icon: '🔫'
  },
  {
    id: 'rec_bow',
    name: '활',
    slot: 'weapon',
    weaponType: 'bow',
    weaponTrait: WEAPON_TRAITS.bow,
    rarity: 'common',
    cost: { wood: 35, leather: 15, bone: 8, gold: 200 },
    baseStats: { atk: 3, luck: 2 },
    description: '유연한 목재와 질긴 가죽 시위로 탄성을 극대화한 장궁. [🏹 급소 사격] 특성으로 기본 공격 시 치명타율 +5% 및 치명타 피해 +5%를 제공합니다.',
    icon: '🏹'
  },
  {
    id: 'rec_staff',
    name: '지팡이',
    slot: 'weapon',
    weaponType: 'staff',
    weaponTrait: WEAPON_TRAITS.staff,
    rarity: 'common',
    cost: { wood: 35, coal: 12, crystal: 8, ether: 12, gold: 250 },
    baseStats: { atk: 3, mp: 12 },
    description: '영목을 정제하고 마력 수정을 얹은 마도 지팡이. [🪄 공명] 특성으로 모든 스킬의 마나 소모량을 5% 절감합니다.',
    icon: '🪄'
  },
  {
    id: 'rec_dagger',
    name: '단검',
    slot: 'weapon',
    weaponType: 'dagger',
    weaponTrait: WEAPON_TRAITS.dagger,
    rarity: 'common',
    cost: { iron: 20, leather: 20, bone: 10, gold: 180 },
    baseStats: { atk: 3, spd: 2, luck: 2 },
    description: '예리한 강철과 가죽 손잡이를 깎아 맞춘 기습용 단검. [⚡ 암습] 특성으로 상대보다 속도가 빠를수록 피해량이 최대 20% 증폭됩니다.',
    icon: '🗡️'
  },

  // ─── 방어구 (Armors - 3종) ─────────────────────────────
  {
    id: 'rec_leather_armor',
    name: '가죽 갑옷',
    slot: 'armor',
    rarity: 'common',
    cost: { leather: 35, bone: 12, wood: 10, gold: 200 },
    baseStats: { def: 3, spd: 1 },
    description: '무두질된 질긴 가죽과 흉부 뼈대로 제작된 경량 갑옷. 방어력과 함께 신속한 움직임을 유지합니다.',
    icon: '🧥'
  },
  {
    id: 'rec_plate_armor',
    name: '판금 갑옷',
    slot: 'armor',
    rarity: 'rare',
    cost: { iron: 50, coal: 15, stone: 25, gold: 350 },
    baseStats: { def: 5, hp: 24 },
    description: '대량의 철광석을 고열 석탄으로 녹여 만든 두꺼운 판금 중장갑. 뛰어난 방어력과 생명력을 보장합니다.',
    icon: '🛡️'
  },
  {
    id: 'rec_robe',
    name: '로브',
    slot: 'armor',
    rarity: 'common',
    cost: { silk: 25, ether: 18, crystal: 4, gold: 250 },
    baseStats: { def: 2, mp: 18, atk: 1 },
    description: '정령의 비단(실크)을 에테르 마나 기류로 직조한 마도 로브. 마법 공격력과 마나 수용량을 확장합니다.',
    icon: '🔮'
  },

  // ─── 장신구 (Accessories - 3종) ─────────────────────────
  {
    id: 'rec_ring',
    name: '반지',
    slot: 'accessory',
    rarity: 'common',
    cost: { gold: 400, ether: 15, crystal: 5 },
    baseStats: { atk: 1, luck: 1 },
    description: '에테르 광채를 머금은 마력 수정 세공 반지. 착용자의 공격 집중력을 높여줍니다.',
    icon: '💍'
  },
  {
    id: 'rec_necklace',
    name: '목걸이',
    slot: 'accessory',
    rarity: 'common',
    cost: { gold: 400, stone: 30, herb: 15, bone: 8 },
    baseStats: { def: 1, hp: 16 },
    description: '수호석과 생명 약초 정기가 깃든 결계 목걸이. 방어력과 최대 체력을 보강합니다.',
    icon: '📿'
  },
  {
    id: 'rec_amulet',
    name: '부적',
    slot: 'accessory',
    rarity: 'rare',
    cost: { silk: 18, ether: 25, crystal: 10, gold: 450 },
    baseStats: { mp: 12, spd: 2 },
    description: '신성 실크 인장에 에테르와 영혼 수정을 새긴 마도 부적. 마나 순환과 민첩성을 높입니다.',
    icon: '🧿'
  }
];

// ═══════════════════════════════════════════════════════════════════════
// 🌟 접두어 (Prefix) 풀 — 공격 / 원소 / 파괴 (체언 앞 수식)
// ═══════════════════════════════════════════════════════════════════════
// ═══════════════════════════════════════════════════════════════════════
// 🌟 접두어 (Prefix) 풀 — 무기 / 방어구 / 장신구 카테고리별 분화
// ═══════════════════════════════════════════════════════════════════════
export const PREFIX_ENCHANT_OPTIONS: Record<string, EnchantOption> = {
  // ── 🗡️ 무기 전용 접두사 (공격 / 원소 / 파괴 / 고유스킬) ──
  'pre_sharp': {
    id: 'pre_sharp',
    name: '날카로운',
    type: 'prefix',
    targetSlot: 'weapon',
    rarity: 'rare',
    stats: { atk: 18, luck: 5 },
    description: '공격력 +18, 치명타율 +5%'
  },
  'pre_glacial': {
    id: 'pre_glacial',
    name: '혹한의',
    type: 'prefix',
    targetSlot: 'weapon',
    rarity: 'rare',
    stats: { atk: 16, def: 10 },
    grantedSkill: {
      id: 'skill_enc_glacial',
      name: '[인챈트] 동결 타격',
      description: '적 1체에게 130% 빙결 피해를 입히고 1턴간 기절(동결)시킵니다. (기본 공격 대체)',
      manaCost: 18,
      cooldown: 0,
      targetType: 'single_enemy',
      power: 1.3,
      effectType: 'stun',
      statusDuration: 1,
      icon: '❄️',
      isSpecial: false
    },
    description: '공격력 +16, 방어력 +10, 고유스킬 [동결 타격] 부여 (기본 공격 대체)'
  },
  'pre_ferocious': {
    id: 'pre_ferocious',
    name: '맹렬한',
    type: 'prefix',
    targetSlot: 'weapon',
    rarity: 'rare',
    stats: { atk: 18, damageBonus: 8 },
    description: '공격력 +18, 피해량 +8%'
  },
  'pre_accurate': {
    id: 'pre_accurate',
    name: '정밀한',
    type: 'prefix',
    targetSlot: 'weapon',
    rarity: 'rare',
    stats: { atk: 14, luck: 4, defPenetration: 10 },
    description: '공격력 +14, 행운 +4, 방어 관통 10%'
  },
  'pre_heavy': {
    id: 'pre_heavy',
    name: '묵직한',
    type: 'prefix',
    targetSlot: 'weapon',
    rarity: 'rare',
    stats: { atk: 22, def: 8 },
    description: '공격력 +22, 방어력 +8'
  },
  'pre_swift': {
    id: 'pre_swift',
    name: '신속한',
    type: 'prefix',
    targetSlot: 'weapon',
    rarity: 'rare',
    stats: { atk: 15, spd: 5, luck: 4 },
    description: '공격력 +15, 속도 +5, 치명타율 +4%'
  },
  'pre_blazing': {
    id: 'pre_blazing',
    name: '화염의',
    type: 'prefix',
    targetSlot: 'weapon',
    rarity: 'epic',
    stats: { atk: 28, damageBonus: 15 },
    grantedSkill: {
      id: 'skill_enc_blazing',
      name: '[인챈트] 작열탄',
      description: '적 1체에게 150%의 화염 물리 피해를 입히고 2턴간 지속 화상/출혈을 부여합니다. (기본 공격 대체)',
      manaCost: 15,
      cooldown: 0,
      targetType: 'single_enemy',
      power: 1.5,
      effectType: 'bleed',
      statusDuration: 2,
      icon: '🔥',
      isSpecial: false
    },
    description: '공격력 +28, 피해량 +15%, 고유스킬 [작열탄] 부여 (기본 공격 대체)'
  },
  'pre_crimson_bleed': {
    id: 'pre_crimson_bleed',
    name: '혈염의',
    type: 'prefix',
    targetSlot: 'weapon',
    targetWeaponType: 'sword',
    rarity: 'epic',
    stats: { atk: 26, damageBonus: 10 },
    grantedSkill: {
      id: 'skill_enc_crimson_bleed',
      name: '[인챈트] 혈풍검',
      description: '적 1체에게 160% 물리 피해를 입히고 2턴간 깊은 출혈을 부여합니다. (검 전용 / 기본 공격 대체)',
      manaCost: 16,
      cooldown: 0,
      targetType: 'single_enemy',
      power: 1.6,
      effectType: 'bleed',
      statusDuration: 2,
      icon: '🩸',
      isSpecial: false
    },
    description: '공격력 +26, 피해량 +10%, 검 전용 [혈풍검] 부여 (출혈 부여 / 기본 공격 대체)'
  },
  'pre_thunder_spear': {
    id: 'pre_thunder_spear',
    name: '뇌광의',
    type: 'prefix',
    targetSlot: 'weapon',
    targetWeaponType: 'spear',
    rarity: 'epic',
    stats: { atk: 25, spd: 6 },
    grantedSkill: {
      id: 'skill_enc_thunder_spear',
      name: '[인챈트] 뇌광 파쇄창',
      description: '적 1체에게 150% 뇌전 피해를 입히고 1턴간 뇌격(기절)을 부여합니다. (창 전용 / 기본 공격 대체)',
      manaCost: 18,
      cooldown: 0,
      targetType: 'single_enemy',
      power: 1.5,
      effectType: 'stun',
      statusDuration: 1,
      icon: '⚡',
      isSpecial: false
    },
    description: '공격력 +25, 속도 +6, 창 전용 [뇌광 파쇄창] 부여 (기절 부여 / 기본 공격 대체)'
  },
  'pre_flame_bow': {
    id: 'pre_flame_bow',
    name: '염화의',
    type: 'prefix',
    targetSlot: 'weapon',
    targetWeaponType: 'bow',
    rarity: 'epic',
    stats: { atk: 24, luck: 7 },
    grantedSkill: {
      id: 'skill_enc_flame_bow',
      name: '[인챈트] 화염 화살',
      description: '적 1체에게 155% 화염 관통 피해를 입히고 2턴간 지속 화상을 부여합니다. (활 전용 / 기본 공격 대체)',
      manaCost: 15,
      cooldown: 0,
      targetType: 'single_enemy',
      power: 1.55,
      effectType: 'burn',
      statusDuration: 2,
      icon: '🏹',
      isSpecial: false
    },
    description: '공격력 +24, 치명타율 +7%, 활 전용 [화염 화살] 부여 (화상 부여 / 기본 공격 대체)'
  },
  'pre_inferno_gun': {
    id: 'pre_inferno_gun',
    name: '지옥불의',
    type: 'prefix',
    targetSlot: 'weapon',
    targetWeaponType: 'gun',
    rarity: 'epic',
    stats: { atk: 28, defPenetration: 15 },
    grantedSkill: {
      id: 'skill_enc_inferno_gun',
      name: '[인챈트] 유황탄 사격',
      description: '적 1체에게 160% 폭발 관통 피해를 입히고 2턴간 지속 화상을 부여합니다. (총 전용 / 기본 공격 대체)',
      manaCost: 16,
      cooldown: 0,
      targetType: 'single_enemy',
      power: 1.6,
      effectType: 'burn',
      statusDuration: 2,
      icon: '🔥',
      isSpecial: false
    },
    description: '공격력 +28, 방어 관통 15%, 총 전용 [유황탄 사격] 부여 (화상 부여 / 기본 공격 대체)'
  },
  'pre_venom_dagger': {
    id: 'pre_venom_dagger',
    name: '맹독의',
    type: 'prefix',
    targetSlot: 'weapon',
    targetWeaponType: 'dagger',
    rarity: 'epic',
    stats: { atk: 22, spd: 8, luck: 6 },
    grantedSkill: {
      id: 'skill_enc_venom_dagger',
      name: '[인챈트] 맹독 비수',
      description: '적 1체에게 150% 암습 피해를 입히고 3턴간 치명적인 중독을 부여합니다. (단검 전용 / 기본 공격 대체)',
      manaCost: 14,
      cooldown: 0,
      targetType: 'single_enemy',
      power: 1.5,
      effectType: 'poison',
      statusDuration: 3,
      icon: '☠️',
      isSpecial: false
    },
    description: '공격력 +22, 속도 +8, 치명타율 +6%, 단검 전용 [맹독 비수] 부여 (중독 부여 / 기본 공격 대체)'
  },
  'pre_frost_staff': {
    id: 'pre_frost_staff',
    name: '영구동토의',
    type: 'prefix',
    targetSlot: 'weapon',
    targetWeaponType: 'staff',
    rarity: 'epic',
    stats: { atk: 22, mp: 120 },
    grantedSkill: {
      id: 'skill_enc_frost_staff',
      name: '[인챈트] 혹한의 서리꽃',
      description: '적 1체에게 150% 빙결 피해를 입히고 1턴간 빙결(행동 불가)을 부여합니다. (지팡이 전용 / 기본 공격 대체)',
      manaCost: 18,
      cooldown: 0,
      targetType: 'single_enemy',
      power: 1.5,
      effectType: 'freeze',
      statusDuration: 1,
      icon: '❄️',
      isSpecial: false
    },
    description: '공격력 +22, 마나 +120, 지팡이 전용 [혹한의 서리꽃] 부여 (빙결 부여 / 기본 공격 대체)'
  },
  'pre_thunder': {
    id: 'pre_thunder',
    name: '뇌전의',
    type: 'prefix',
    targetSlot: 'weapon',
    rarity: 'epic',
    stats: { atk: 24, spd: 7, luck: 6 },
    description: '공격력 +24, 속도 +7, 치명타율 +6%'
  },
  'pre_reaper': {
    id: 'pre_reaper',
    name: '사신의',
    type: 'prefix',
    targetSlot: 'weapon',
    rarity: 'epic',
    stats: { atk: 32, luck: 7, drainPercent: 15 },
    description: '공격력 +32, 치명타율 +7%, 입힌 피해의 15% 체력 흡수'
  },
  'pre_holy': {
    id: 'pre_holy',
    name: '신성한',
    type: 'prefix',
    targetSlot: 'weapon',
    rarity: 'legendary',
    stats: { atk: 30, mp: 80 },
    grantedSkill: {
      id: 'skill_enc_holy',
      name: '[인챈트] 신성 심판',
      description: '적 1체에게 160% 신성 관통 피해를 가하고 2턴간 실명을 부여합니다. (기본 공격 대체)',
      manaCost: 16,
      cooldown: 0,
      targetType: 'single_enemy',
      power: 1.6,
      effectType: 'damage',
      statusDuration: 2,
      icon: '🌟',
      isSpecial: false
    },
    description: '공격력 +30, 마나 +80, 고유스킬 [신성 심판] 부여 (기본 공격 대체)'
  },
  'pre_cataclysm': {
    id: 'pre_cataclysm',
    name: '파멸의',
    type: 'prefix',
    targetSlot: 'weapon',
    rarity: 'legendary',
    stats: { atk: 52, luck: 10, defPenetration: 25 },
    grantedSkill: {
      id: 'skill_enc_cataclysm',
      name: '[인챈트] 파멸 강타',
      description: '적 1체에 200%의 파멸적인 강타를 가하고 2턴간 적 방어력을 35% 파쇄합니다. (기본 공격 대체)',
      manaCost: 22,
      cooldown: 0,
      targetType: 'single_enemy',
      power: 2.0,
      effectType: 'damage',
      statusDuration: 2,
      icon: '☄️',
      isSpecial: false
    },
    description: '공격력 +52, 치명타율 +10%, 방어관통 25%, 고유스킬 [파멸 강타] 부여 (기본 공격 대체)'
  },
  'pre_void': {
    id: 'pre_void',
    name: '공허의',
    type: 'prefix',
    targetSlot: 'weapon',
    rarity: 'legendary',
    stats: { atk: 42, mp: 80, defPenetration: 20 },
    description: '공격력 +42, 마나 +80, 방어관통 20%'
  },

  // ── 🛡️ 방어구 전용 접두사 (방어 / 생명 / 수호 / 불굴) ──
  'pre_sturdy': {
    id: 'pre_sturdy',
    name: '견고한',
    type: 'prefix',
    targetSlot: 'armor',
    rarity: 'rare',
    stats: { def: 20, hp: 180 },
    description: '방어력 +20, 최대 체력 +180'
  },
  'pre_stoneguard': {
    id: 'pre_stoneguard',
    name: '수석의',
    type: 'prefix',
    targetSlot: 'armor',
    rarity: 'rare',
    stats: { def: 18, hp: 150, luck: 4 },
    description: '방어력 +18, 최대 체력 +150, 행운 +4'
  },
  'pre_flexible': {
    id: 'pre_flexible',
    name: '유연한',
    type: 'prefix',
    targetSlot: 'armor',
    rarity: 'rare',
    stats: { def: 16, hp: 120, spd: 4 },
    description: '방어력 +16, 최대 체력 +120, 속도 +4'
  },
  'pre_tempered': {
    id: 'pre_tempered',
    name: '단련된',
    type: 'prefix',
    targetSlot: 'armor',
    rarity: 'rare',
    stats: { def: 22, mp: 60 },
    description: '방어력 +22, 마나 +60'
  },
  'pre_thick': {
    id: 'pre_thick',
    name: '두터운',
    type: 'prefix',
    targetSlot: 'armor',
    rarity: 'rare',
    stats: { def: 24, hp: 160 },
    description: '방어력 +24, 최대 체력 +160'
  },
  'pre_warding': {
    id: 'pre_warding',
    name: '퇴마의',
    type: 'prefix',
    targetSlot: 'armor',
    rarity: 'rare',
    stats: { def: 18, mp: 80, hp: 100 },
    description: '방어력 +18, 마나 +80, 최대 체력 +100'
  },
  'pre_ironclad': {
    id: 'pre_ironclad',
    name: '강철의',
    type: 'prefix',
    targetSlot: 'armor',
    rarity: 'epic',
    stats: { def: 35, hp: 300 },
    description: '방어력 +35, 최대 체력 +300'
  },
  'pre_unyielding': {
    id: 'pre_unyielding',
    name: '불굴의',
    type: 'prefix',
    targetSlot: 'armor',
    rarity: 'epic',
    stats: { def: 28, hp: 240, luck: 6 },
    description: '방어력 +28, 최대 체력 +240, 행운 +6'
  },
  'pre_guardian': {
    id: 'pre_guardian',
    name: '수호의',
    type: 'prefix',
    targetSlot: 'armor',
    rarity: 'legendary',
    stats: { def: 55, hp: 500, spd: 7 },
    description: '방어력 +55, 최대 체력 +500, 속도 +7'
  },
  'pre_immortal': {
    id: 'pre_immortal',
    name: '불멸의',
    type: 'prefix',
    targetSlot: 'armor',
    rarity: 'legendary',
    stats: { def: 48, hp: 600, mp: 50 },
    description: '방어력 +48, 최대 체력 +600, 마나 +50'
  },

  // ── 💍 장신구 전용 접두사 (마나 / 속도 / 행운 / 다중스탯) ──
  'pre_mystic': {
    id: 'pre_mystic',
    name: '신비로운',
    type: 'prefix',
    targetSlot: 'accessory',
    rarity: 'rare',
    stats: { mp: 100, spd: 5, luck: 4 },
    description: '마나 +100, 속도 +5, 행운 +4'
  },
  'pre_radiant': {
    id: 'pre_radiant',
    name: '광채의',
    type: 'prefix',
    targetSlot: 'accessory',
    rarity: 'rare',
    stats: { mp: 80, atk: 12, def: 12 },
    description: '마나 +80, 공격력 +12, 방어력 +12'
  },
  'pre_clear': {
    id: 'pre_clear',
    name: '청명한',
    type: 'prefix',
    targetSlot: 'accessory',
    rarity: 'rare',
    stats: { mp: 70, hp: 100, luck: 5 },
    description: '마나 +70, 최대 체력 +100, 행운 +5'
  },
  'pre_shining': {
    id: 'pre_shining',
    name: '찬란한',
    type: 'prefix',
    targetSlot: 'accessory',
    rarity: 'rare',
    stats: { mp: 90, atk: 10, luck: 5 },
    description: '마나 +90, 공격력 +10, 행운 +5'
  },
  'pre_tranquil': {
    id: 'pre_tranquil',
    name: '고요한',
    type: 'prefix',
    targetSlot: 'accessory',
    rarity: 'rare',
    stats: { hp: 140, mp: 60, def: 10 },
    description: '최대 체력 +140, 마나 +60, 방어력 +10'
  },
  'pre_astral': {
    id: 'pre_astral',
    name: '성운의',
    type: 'prefix',
    targetSlot: 'accessory',
    rarity: 'epic',
    stats: { mp: 160, atk: 20, spd: 7 },
    description: '마나 +160, 공격력 +20, 속도 +7'
  },
  'pre_ethereal': {
    id: 'pre_ethereal',
    name: '에테르의',
    type: 'prefix',
    targetSlot: 'accessory',
    rarity: 'epic',
    stats: { mp: 200, hp: 200, luck: 7 },
    description: '마나 +200, 최대 체력 +200, 행운 +7'
  },
  'pre_celestial': {
    id: 'pre_celestial',
    name: '천상의',
    type: 'prefix',
    targetSlot: 'accessory',
    rarity: 'legendary',
    stats: { mp: 240, hp: 300, spd: 10, luck: 10 },
    description: '마나 +240, 최대 체력 +300, 속도 +10, 행운 +10'
  },
  'pre_infinite': {
    id: 'pre_infinite',
    name: '무한의',
    type: 'prefix',
    targetSlot: 'accessory',
    rarity: 'legendary',
    stats: { mp: 300, atk: 25, def: 25, spd: 8 },
    description: '마나 +300, 공격력 +25, 방어력 +25, 속도 +8'
  }
};

// ═══════════════════════════════════════════════════════════════════════
// 🌟 접미어 (Suffix) 풀 — 무기 / 방어구 / 장신구 카테고리별 분화
// ═══════════════════════════════════════════════════════════════════════
export const SUFFIX_ENCHANT_OPTIONS: Record<string, EnchantOption> = {
  // ── 🗡️ 무기 전용 접미사 (피해증폭 / 흡혈 / 관통 / 맹공) ──
  'suf_vampirism': {
    id: 'suf_vampirism',
    name: '흡혈',
    type: 'suffix',
    targetSlot: 'weapon',
    rarity: 'rare',
    stats: { atk: 15, drainPercent: 12 },
    description: '공격력 +15, 피해의 12% 체력 흡수'
  },
  'suf_pierce': {
    id: 'suf_pierce',
    name: '관통',
    type: 'suffix',
    targetSlot: 'weapon',
    rarity: 'rare',
    stats: { atk: 18, defPenetration: 15 },
    description: '공격력 +18, 방어 관통 15%'
  },
  'suf_rupture': {
    id: 'suf_rupture',
    name: '파열',
    type: 'suffix',
    targetSlot: 'weapon',
    rarity: 'rare',
    stats: { atk: 16, damageBonus: 8 },
    description: '공격력 +16, 피해량 +8%'
  },
  'suf_pursuit': {
    id: 'suf_pursuit',
    name: '추적',
    type: 'suffix',
    targetSlot: 'weapon',
    rarity: 'rare',
    stats: { atk: 14, spd: 4, luck: 3 },
    description: '공격력 +14, 속도 +4, 치명타율 +3%'
  },
  'suf_strike': {
    id: 'suf_strike',
    name: '강타',
    type: 'suffix',
    targetSlot: 'weapon',
    rarity: 'rare',
    stats: { atk: 20, damageBonus: 6 },
    description: '공격력 +20, 피해량 +6%'
  },
  'suf_precision': {
    id: 'suf_precision',
    name: '정조준',
    type: 'suffix',
    targetSlot: 'weapon',
    rarity: 'rare',
    stats: { atk: 16, luck: 6, defPenetration: 10 },
    description: '공격력 +16, 행운 +6, 방어 관통 10%'
  },
  'suf_destruction': {
    id: 'suf_destruction',
    name: '파괴',
    type: 'suffix',
    targetSlot: 'weapon',
    rarity: 'epic',
    stats: { atk: 30, damageBonus: 10 },
    description: '공격력 +30, 피해량 +10%'
  },
  'suf_carnage': {
    id: 'suf_carnage',
    name: '학살',
    type: 'suffix',
    targetSlot: 'weapon',
    rarity: 'epic',
    stats: { atk: 35, luck: 7, drainPercent: 8 },
    description: '공격력 +35, 행운 +7, 피해의 8% 체력 흡수'
  },
  'suf_onslaught': {
    id: 'suf_onslaught',
    name: '돌격',
    type: 'suffix',
    targetSlot: 'weapon',
    rarity: 'legendary',
    stats: { atk: 45, spd: 9, defPenetration: 15 },
    description: '공격력 +45, 속도 +9, 방어 관통 15%'
  },
  'suf_annihilation': {
    id: 'suf_annihilation',
    name: '절멸',
    type: 'suffix',
    targetSlot: 'weapon',
    rarity: 'legendary',
    stats: { atk: 60, damageBonus: 20 },
    description: '공격력 +60, 피해량 +20%'
  },

  // ── 🛡️ 방어구 전용 접미사 (방어 / 체력 / 가호 / 재생) ──
  'suf_scar': {
    id: 'suf_scar',
    name: '상흔',
    type: 'suffix',
    targetSlot: 'armor',
    rarity: 'rare',
    stats: { def: 15, atk: 15 },
    description: '방어력 +15, 공격력 +15'
  },
  'suf_aegis': {
    id: 'suf_aegis',
    name: '수호',
    type: 'suffix',
    targetSlot: 'armor',
    rarity: 'rare',
    stats: { def: 25, hp: 150 },
    description: '방어력 +25, 최대 체력 +150'
  },
  'suf_barrier': {
    id: 'suf_barrier',
    name: '장벽',
    type: 'suffix',
    targetSlot: 'armor',
    rarity: 'rare',
    stats: { def: 20, mp: 60 },
    description: '방어력 +20, 마나 +60'
  },
  'suf_vitality': {
    id: 'suf_vitality',
    name: '활력',
    type: 'suffix',
    targetSlot: 'armor',
    rarity: 'rare',
    stats: { hp: 200, def: 12 },
    description: '최대 체력 +200, 방어력 +12'
  },
  'suf_ironwall': {
    id: 'suf_ironwall',
    name: '철벽',
    type: 'suffix',
    targetSlot: 'armor',
    rarity: 'rare',
    stats: { def: 28, hp: 100 },
    description: '방어력 +28, 최대 체력 +100'
  },
  'suf_endurance': {
    id: 'suf_endurance',
    name: '인내',
    type: 'suffix',
    targetSlot: 'armor',
    rarity: 'rare',
    stats: { def: 18, hp: 180, spd: 3 },
    description: '방어력 +18, 최대 체력 +180, 속도 +3'
  },
  'suf_tenacity': {
    id: 'suf_tenacity',
    name: '불굴',
    type: 'suffix',
    targetSlot: 'armor',
    rarity: 'epic',
    stats: { def: 35, hp: 250 },
    description: '방어력 +35, 최대 체력 +250'
  },
  'suf_regen': {
    id: 'suf_regen',
    name: '재생',
    type: 'suffix',
    targetSlot: 'armor',
    rarity: 'epic',
    stats: { hp: 300, def: 20 },
    description: '최대 체력 +300, 방어력 +20'
  },
  'suf_grace': {
    id: 'suf_grace',
    name: '가호',
    type: 'suffix',
    targetSlot: 'armor',
    rarity: 'legendary',
    stats: { def: 45, hp: 400, spd: 8 },
    description: '방어력 +45, 최대 체력 +400, 속도 +8'
  },
  'suf_bastion': {
    id: 'suf_bastion',
    name: '성벽',
    type: 'suffix',
    targetSlot: 'armor',
    rarity: 'legendary',
    stats: { def: 60, hp: 500 },
    description: '방어력 +60, 최대 체력 +500'
  },

  // ── 💍 장신구 전용 접미사 (신속 / 마력 / 지혜 / 파동 / 시간) ──
  'suf_haste': {
    id: 'suf_haste',
    name: '신속',
    type: 'suffix',
    targetSlot: 'accessory',
    rarity: 'rare',
    stats: { spd: 5, luck: 4 },
    description: '속도 +5, 치명타율 +4%'
  },
  'suf_arcana': {
    id: 'suf_arcana',
    name: '마력',
    type: 'suffix',
    targetSlot: 'accessory',
    rarity: 'rare',
    stats: { mp: 120, atk: 15 },
    description: '마나 +120, 공격력 +15'
  },
  'suf_fortune': {
    id: 'suf_fortune',
    name: '행운',
    type: 'suffix',
    targetSlot: 'accessory',
    rarity: 'rare',
    stats: { luck: 5, spd: 3, mp: 60 },
    description: '행운 +5, 속도 +3, 마나 +60'
  },
  'suf_blessing': {
    id: 'suf_blessing',
    name: '축복',
    type: 'suffix',
    targetSlot: 'accessory',
    rarity: 'rare',
    stats: { mp: 100, hp: 120, luck: 4 },
    description: '마나 +100, 최대 체력 +120, 행운 +4'
  },
  'suf_vigor': {
    id: 'suf_vigor',
    name: '원기',
    type: 'suffix',
    targetSlot: 'accessory',
    rarity: 'rare',
    stats: { hp: 180, spd: 4, atk: 8 },
    description: '최대 체력 +180, 속도 +4, 공격력 +8'
  },
  'suf_wisdom': {
    id: 'suf_wisdom',
    name: '지혜',
    type: 'suffix',
    targetSlot: 'accessory',
    rarity: 'epic',
    stats: { mp: 180, spd: 7, luck: 6 },
    description: '마나 +180, 속도 +7, 행운 +6'
  },
  'suf_serenity': {
    id: 'suf_serenity',
    name: '평온',
    type: 'suffix',
    targetSlot: 'accessory',
    rarity: 'epic',
    stats: { mp: 150, hp: 250, def: 15 },
    description: '마나 +150, 최대 체력 +250, 방어력 +15'
  },
  'suf_surge': {
    id: 'suf_surge',
    name: '파동',
    type: 'suffix',
    targetSlot: 'accessory',
    rarity: 'legendary',
    stats: { hp: 450, mp: 120, atk: 20, def: 20, spd: 8 },
    description: '최대 체력 +450, 마나 +120, 공격력 +20, 방어력 +20, 속도 +8'
  },
  'suf_chronos': {
    id: 'suf_chronos',
    name: '시간',
    type: 'suffix',
    targetSlot: 'accessory',
    rarity: 'legendary',
    stats: { spd: 10, mp: 200, luck: 10 },
    description: '속도 +10, 마나 +200, 행운 +10'
  }
};

/**
 * 🔮 인챈트 성공 확률 계산 (기본 20%, 병기창 Lv.6부터 레벨당 +5% 증가, 실패 페널티 없음)
 * - 순수 접두/접미석을 이용하는 상위 인챈트 시 성공 확률이 일반의 절반(50%)으로 조정
 */
export function getEnchantSuccessRate(forgeLv: number = 1, isPure: boolean = false): number {
  const lv = Math.max(1, Math.min(10, forgeLv));
  const baseRate = lv <= 6 ? 20 : 20 + (lv - 6) * 5; // Lv.1~6: 20%, Lv.7: 25%, Lv.8: 30%, Lv.9: 35%, Lv.10: 40%
  if (isPure) {
    return Math.floor(baseRate / 2); // Lv.1~6: 10%, Lv.7: 12%, Lv.8: 15%, Lv.9: 17%, Lv.10: 20%
  }
  return baseRate;
}

/**
 * 📦 장비 등급별 인챈트석(접두석/접미석) 소모 수량 계산
 * - 일반(Common): 1개
 * - 희귀(Rare): 2개
 * - 에픽(Epic): 3개
 * - 고유(Unique): 4개
 * - 전설(Legendary): 5개
 */
export function getEnchantStoneCost(rarity: EquipmentItem['rarity'] = 'common'): number {
  switch (rarity) {
    case 'common': return 1;
    case 'rare': return 2;
    case 'epic': return 3;
    case 'unique': return 4;
    case 'legendary': return 5;
    default: return 1;
  }
}

/**
 * 💰 인챈트 소모 자원 계산 (골드 & 에테르 기존 대비 2배 증액, 대장간 할인율 적용)
 */
export function getEnchantResourceCosts(isPure: boolean, forgeDiscountMult: number = 1): { gold: number; ether: number } {
  const baseGold = isPure ? 1600 : 600;
  const baseEther = isPure ? 120 : 40;
  return {
    gold: Math.max(1, Math.floor(baseGold * forgeDiscountMult)),
    ether: Math.max(1, Math.floor(baseEther * forgeDiscountMult))
  };
}

/**
 * 🎯 특정 슬롯 및 인챈트석 등급에 적합한 인챈트 후보군 목록 필터링
 */
export function getEnchantCandidates(slot: EquipmentSlot, type: 'prefix' | 'suffix', isPure: boolean, weaponType?: WeaponType): EnchantOption[] {
  const pool = type === 'prefix' ? PREFIX_ENCHANT_OPTIONS : SUFFIX_ENCHANT_OPTIONS;
  return Object.values(pool).filter(opt => {
    // 슬롯 필터링: targetSlot이 일치하거나 'all' 또는 미지정인 경우
    const slotMatch = !opt.targetSlot || opt.targetSlot === 'all' || opt.targetSlot === slot;
    if (!slotMatch) return false;

    // 무기 세부 계열 필터링: targetWeaponType이 지정된 경우 해당 무기 계열과 일치해야 함
    if (opt.targetWeaponType) {
      if (!weaponType || opt.targetWeaponType !== weaponType) return false;
    }

    if (isPure) {
      return opt.rarity === 'epic' || opt.rarity === 'legendary';
    } else {
      return opt.rarity === 'rare' || opt.rarity === 'epic';
    }
  });
}

// ═══════════════════════════════════════════════════════════════════════
// 👑 1F~10F 보스 전용 유니크(Unique) 세트 장비 풀 (층별 무기/방어구/장신구 3종)
// ═══════════════════════════════════════════════════════════════════════
export interface BossUniqueDefinition {
  id: string;
  floor: number;
  baseName: string;
  slot: 'weapon' | 'armor' | 'accessory';
  stats: {
    atk?: number;
    def?: number;
    hp?: number;
    mp?: number;
    spd?: number;
    luck?: number;
  };
  description: string;
  icon: string;
  affinity?: string[];
}

export const BOSS_UNIQUE_DEFINITIONS: Record<number, BossUniqueDefinition[]> = {
  1: [
    {
      id: 'boss_uniq_1_wpn',
      floor: 1,
      baseName: '감시자의 심안 대검',
      slot: 'weapon',
      stats: { atk: 10, luck: 4 },
      description: '1F 보스 [침묵의 감시자]의 예리한 시선이 깃든 고유 대검.',
      icon: '🗡️',
      affinity: ['tank', 'berserker', 'dealer_phy']
    },
    {
      id: 'boss_uniq_1_arm',
      floor: 1,
      baseName: '망자의 감시 흉갑',
      slot: 'armor',
      stats: { hp: 43, def: 7 },
      description: '1F 보스 [침묵의 감시자]의 갑각을 가공하여 만든 단단한 고유 흉갑.',
      icon: '🛡️',
      affinity: ['tank', 'berserker']
    },
    {
      id: 'boss_uniq_1_acc',
      floor: 1,
      baseName: '침묵의 시선 반지',
      slot: 'accessory',
      stats: { atk: 4, spd: 3, luck: 3 },
      description: '1F 보스 [침묵의 감시자]의 눈동자가 세공된 신비로운 고유 반지.',
      icon: '💍',
      affinity: ['all']
    }
  ],
  2: [
    {
      id: 'boss_uniq_2_wpn',
      floor: 2,
      baseName: '영혼 수확자의 사신 낫',
      slot: 'weapon',
      stats: { atk: 15, mp: 21, luck: 6 },
      description: '2F 보스 [망령의 군주]가 수많은 원혼을 베어 넘기던 전설의 낫.',
      icon: '⚔️',
      affinity: ['dealer_phy', 'berserker', 'gunner']
    },
    {
      id: 'boss_uniq_2_arm',
      floor: 2,
      baseName: '망령 군주의 유령 로브',
      slot: 'armor',
      stats: { hp: 64, def: 10, mp: 26 },
      description: '2F 보스 [망령의 군주]의 유체 기운이 감도는 음산한 고유 로브.',
      icon: '🥻',
      affinity: ['dealer_mag', 'healer']
    },
    {
      id: 'boss_uniq_2_acc',
      floor: 2,
      baseName: '원한의 영혼석 목걸이',
      slot: 'accessory',
      stats: { atk: 7, def: 4, spd: 3 },
      description: '2F 보스 [망령의 군주]의 응축된 원혼석이 박힌 고유 목걸이.',
      icon: '📿',
      affinity: ['all']
    }
  ],
  3: [
    {
      id: 'boss_uniq_3_wpn',
      floor: 3,
      baseName: '광맥 파쇄 대형 해머',
      slot: 'weapon',
      stats: { atk: 22, def: 8 },
      description: '3F 보스 [원초의 골렘]의 거암을 깎아 만든 묵직한 파쇄 망치.',
      icon: '🔨',
      affinity: ['tank', 'berserker', 'dealer_phy']
    },
    {
      id: 'boss_uniq_3_arm',
      floor: 3,
      baseName: '태고 광맥의 거인 갑주',
      slot: 'armor',
      stats: { hp: 111, def: 17 },
      description: '3F 보스 [원초의 골렘]의 거대 암석 표피로 단조된 초중장갑.',
      icon: '🛡️',
      affinity: ['tank', 'berserker']
    },
    {
      id: 'boss_uniq_3_acc',
      floor: 3,
      baseName: '대지의 심장 수호 인장',
      slot: 'accessory',
      stats: { hp: 51, def: 8, spd: 2 },
      description: '3F 보스 [원초의 골렘]의 고동치는 맥박을 품은 대지의 인장.',
      icon: '🎖️',
      affinity: ['all']
    }
  ],
  4: [
    {
      id: 'boss_uniq_4_wpn',
      floor: 4,
      baseName: '시공 왜곡의 비전 지팡이',
      slot: 'weapon',
      stats: { atk: 26, mp: 55, spd: 5, luck: 5 },
      description: '4F 보스 [심연의 시공 왜곡자]가 시공간 균열을 개방하고 비전 마력을 방출하던 고유 지팡이.',
      icon: '🪄',
      affinity: ['dealer_mag', 'healer']
    },
    {
      id: 'boss_uniq_4_arm',
      floor: 4,
      baseName: '시공 왜곡자의 성운 로브',
      slot: 'armor',
      stats: { hp: 119, def: 16, mp: 51, spd: 4 },
      description: '4F 보스 [심연의 시공 왜곡자]의 왜곡된 마력 결계와 성운 기류가 깃든 고유 로브.',
      icon: '🥻',
      affinity: ['dealer_mag', 'healer']
    },
    {
      id: 'boss_uniq_4_acc',
      floor: 4,
      baseName: '차원 앵커의 비전 마도구',
      slot: 'accessory',
      stats: { atk: 11, mp: 43, spd: 5, luck: 5 },
      description: '4F 보스 [심연의 시공 왜곡자]의 시공간 왜곡 에테르가 응축된 신비로운 마도 장신구.',
      icon: '🧿',
      affinity: ['dealer_mag', 'healer', 'all']
    }
  ],
  5: [
    {
      id: 'boss_uniq_5_wpn',
      floor: 5,
      baseName: '모노리스 공허 분쇄포',
      slot: 'weapon',
      stats: { atk: 41, luck: 10, mp: 34 },
      description: '5F 보스 [공허의 지배자]의 모노리스 파편을 포신으로 개조한 결전포.',
      icon: '🔫',
      affinity: ['gunner', 'dealer_phy']
    },
    {
      id: 'boss_uniq_5_arm',
      floor: 5,
      baseName: '공허 지배자의 멸망 중갑',
      slot: 'armor',
      stats: { hp: 204, def: 29, luck: 5 },
      description: '5F 보스 [공허의 지배자]의 멸망 에너지로 응축된 칠흑의 고유 갑옷.',
      icon: '🥋',
      affinity: ['tank', 'berserker']
    },
    {
      id: 'boss_uniq_5_acc',
      floor: 5,
      baseName: '모노리스의 파멸 핵 성물',
      slot: 'accessory',
      stats: { atk: 17, def: 12, spd: 7, luck: 7 },
      description: '5F 보스 [공허의 지배자]의 파멸 모노리스 핵이 박힌 결전의 성물.',
      icon: '👑',
      affinity: ['all']
    }
  ],
  6: [
    {
      id: 'boss_uniq_6_wpn',
      floor: 6,
      baseName: '진홍 군주의 흡혈 마검',
      slot: 'weapon',
      stats: { atk: 53, luck: 13, mp: 26 },
      description: '6F 보스 [핏빛 성역의 지배자]가 피의 갈증을 채우던 진홍빛 고유 마검.',
      icon: '🗡️',
      affinity: ['berserker', 'dealer_phy', 'tank']
    },
    {
      id: 'boss_uniq_6_arm',
      floor: 6,
      baseName: '핏빛 대공의 선혈 예복',
      slot: 'armor',
      stats: { hp: 272, def: 38, spd: 5 },
      description: '6F 보스 [핏빛 성역의 지배자]의 붉은 피로 물든 고결한 고유 예복.',
      icon: '🧥',
      affinity: ['dealer_phy', 'gunner', 'healer', 'berserker']
    },
    {
      id: 'boss_uniq_6_acc',
      floor: 6,
      baseName: '진홍 마안의 흡혈 루비',
      slot: 'accessory',
      stats: { atk: 22, def: 14, spd: 7 },
      description: '6F 보스 [핏빛 성역의 지배자]의 마안이 응축된 진홍의 루비 장신구.',
      icon: '💎',
      affinity: ['all']
    }
  ],
  7: [
    {
      id: 'boss_uniq_7_wpn',
      floor: 7,
      baseName: '망각 묘지기의 영혼 참살낫',
      slot: 'weapon',
      stats: { atk: 66, spd: 10, luck: 14 },
      description: '7F 보스 [망각의 묘지기]가 원혼들의 육신과 영혼을 영구 절단하던 사신의 낫.',
      icon: '⚔️',
      affinity: ['dealer_phy', 'gunner', 'berserker']
    },
    {
      id: 'boss_uniq_7_arm',
      floor: 7,
      baseName: '망각 사신의 칠흑 사령의',
      slot: 'armor',
      stats: { hp: 340, def: 48, mp: 43 },
      description: '7F 보스 [망각의 묘지기]의 칠흑빛 사령 안개가 깃든 고유 로브.',
      icon: '🥻',
      affinity: ['dealer_mag', 'healer']
    },
    {
      id: 'boss_uniq_7_acc',
      floor: 7,
      baseName: '영혼 속박의 사슬 인장',
      slot: 'accessory',
      stats: { atk: 27, def: 17, luck: 10 },
      description: '7F 보스 [망각의 묘지기]의 영혼 억제 사슬이 각인된 고유 인장.',
      icon: '⛓️',
      affinity: ['all']
    }
  ],
  8: [
    {
      id: 'boss_uniq_8_wpn',
      floor: 8,
      baseName: '타락 기사단장의 단죄 성검',
      slot: 'weapon',
      stats: { atk: 82, def: 21, luck: 13 },
      description: '8F 보스 [타락한 성기사단장]이 단죄의 요새를 호령하던 불패의 성검.',
      icon: '⚔️',
      affinity: ['tank', 'dealer_phy', 'berserker']
    },
    {
      id: 'boss_uniq_8_arm',
      floor: 8,
      baseName: '칠흑 성역의 불패 판금갑',
      slot: 'armor',
      stats: { hp: 442, def: 62, mp: 34 },
      description: '8F 보스 [타락한 성기사단장]의 성역 가호가 부여된 최정예 중장갑.',
      icon: '🛡️',
      affinity: ['tank', 'berserker']
    },
    {
      id: 'boss_uniq_8_acc',
      floor: 8,
      baseName: '단죄 수호자의 칠흑 성배',
      slot: 'accessory',
      stats: { hp: 128, def: 24, atk: 24 },
      description: '8F 보스 [타락한 성기사단장]의 맹세가 서린 칠흑의 단죄 성배.',
      icon: '🏆',
      affinity: ['all']
    }
  ],
  9: [
    {
      id: 'boss_uniq_9_wpn',
      floor: 9,
      baseName: '만화경 환영의 차원 마도봉',
      slot: 'weapon',
      stats: { atk: 98, mp: 68, spd: 13 },
      description: '9F 보스 [거울 미궁의 지배자]의 환영 차원을 현실로 투영하는 신비로운 마도봉.',
      icon: '🪄',
      affinity: ['dealer_mag', 'healer']
    },
    {
      id: 'boss_uniq_9_arm',
      floor: 9,
      baseName: '환영 차원의 거울 외투',
      slot: 'armor',
      stats: { hp: 553, def: 75, spd: 10 },
      description: '9F 보스 [거울 미궁의 지배자]의 모든 타격을 굴절시키는 환영의 외투.',
      icon: '🧥',
      affinity: ['dealer_phy', 'gunner', 'healer', 'dealer_mag']
    },
    {
      id: 'boss_uniq_9_acc',
      floor: 9,
      baseName: '진실의 거울 마도 파편',
      slot: 'accessory',
      stats: { atk: 38, def: 27, luck: 14, spd: 9 },
      description: '9F 보스 [거울 미궁의 지배자]의 본체 거울 파편으로 세공된 전설의 성물.',
      icon: '🪞',
      affinity: ['all']
    }
  ],
  10: [
    {
      id: 'boss_uniq_10_wpn',
      floor: 10,
      baseName: '종말의 심연 파멸검',
      slot: 'weapon',
      stats: { atk: 122, luck: 17, mp: 85, spd: 15 },
      description: '10F 보스 [심연의 군주 아스모데우스]가 세계의 종말을 집행하던 신화 파멸검.',
      icon: '🪐',
      affinity: ['tank', 'dealer_phy', 'berserker', 'dealer_mag', 'gunner']
    },
    {
      id: 'boss_uniq_10_arm',
      floor: 10,
      baseName: '아스모데우스의 종말 성의',
      slot: 'armor',
      stats: { hp: 748, def: 95, luck: 9, mp: 68 },
      description: '10F 보스 [심연의 군주 아스모데우스]의 종말 권능이 깃든 절대 방호의 성의.',
      icon: '🥋',
      affinity: ['tank', 'berserker', 'dealer_mag', 'healer', 'dealer_phy', 'gunner']
    },
    {
      id: 'boss_uniq_10_acc',
      floor: 10,
      baseName: '심연 지배자의 종말 왕관',
      slot: 'accessory',
      stats: { atk: 48, def: 38, spd: 13, luck: 17 },
      description: '10F 보스 [심연의 군주 아스모데우스]의 심연 패권을 상징하는 종말의 절대 왕관.',
      icon: '👑',
      affinity: ['all']
    }
  ]
};

/**
 * 장비의 슬롯(무기, 방어구, 장신구)에 맞게 인챈트 스킬을 엄격히 정제합니다.
 * - 무기(weapon)의 접두사(prefix)에만 grantedSkill이 허용됩니다.
 * - 방어구(armor) 및 장신구(accessory)의 접두사, 그리고 모든 부위의 접미사(suffix)는 grantedSkill이 제거됩니다.
 */
export function sanitizeEquipmentEnchantSkills(item: EquipmentItem): EquipmentItem {
  if (!item) return item;
  
  // 1. 방어구 또는 장신구인 경우 접두사 스킬 제거 및 설명 정돈
  if (item.slot !== 'weapon') {
    if (item.prefix?.grantedSkill) {
      const { grantedSkill, ...prefixWithoutSkill } = item.prefix;
      item.prefix = {
        ...prefixWithoutSkill,
        description: prefixWithoutSkill.description
          ? prefixWithoutSkill.description
              .replace(', 고유스킬 [작열탄] 부여 (기본 공격 대체)', '')
              .replace(', 고유스킬 [동결 타격] 부여 (기본 공격 대체)', '')
              .replace(', 고유스킬 [신성 심판] 부여 (기본 공격 대체)', '')
              .replace(', 고유스킬 [파멸 강타] 부여 (기본 공격 대체)', '')
          : ''
      };
    }
  }

  // 2. 모든 부위의 접미사는 스킬 제거
  if (item.suffix?.grantedSkill) {
    const { grantedSkill, ...suffixWithoutSkill } = item.suffix;
    item.suffix = suffixWithoutSkill;
  }

  return item;
}

export interface BossSetBonus {
  floor: number;
  setId: string;
  setName: string;
  requiredCount: number;
  bonusName: string;
  description: string;
  effectType: 'buff_def_crit' | 'vampirism' | 'barrier' | 'mana_regen_spd' | 'skill_dmg_pen' | 'bloodlust' | 'stun_chance' | 'dmg_reduction' | 'evade_chance' | 'asmodeus_wrath';
}

export const BOSS_SET_BONUSES: Record<number, BossSetBonus> = {
  1: {
    floor: 1,
    setId: 'boss_set_1',
    setName: '1F 침묵의 감시자 세트',
    requiredCount: 3,
    bonusName: '침묵의 주시',
    description: '[3세트 완성] 침묵의 주시: 전투 시작 시 영구 방어력 +15% 및 치명타율 +10% 증가',
    effectType: 'buff_def_crit'
  },
  2: {
    floor: 2,
    setId: 'boss_set_2',
    setName: '2F 망령의 군주 세트',
    requiredCount: 3,
    bonusName: '영혼 착취',
    description: '[3세트 완성] 영혼 착취: 모든 공격 및 스킬 적중 시 가한 피해의 12%를 체력으로 흡혈',
    effectType: 'vampirism'
  },
  3: {
    floor: 3,
    setId: 'boss_set_3',
    setName: '3F 원초의 골렘 세트',
    requiredCount: 3,
    bonusName: '대지의 결계',
    description: '[3세트 완성] 대지의 결계: 전투 시작 시 최대 체력의 25%에 해당하는 바위 보호막 생성',
    effectType: 'barrier'
  },
  4: {
    floor: 4,
    setId: 'boss_set_4',
    setName: '4F 심연 시공왜곡 세트',
    requiredCount: 3,
    bonusName: '시공 왜곡장',
    description: '[3세트 완성] 시공 왜곡장: 매 턴 시작 시 MP 15 회복 및 행동 속도(SPD) +20% 가속',
    effectType: 'mana_regen_spd'
  },
  5: {
    floor: 5,
    setId: 'boss_set_5',
    setName: '5F 공허의 지배자 세트',
    requiredCount: 3,
    bonusName: '공허 붕괴역',
    description: '[3세트 완성] 공허 붕괴역: 스킬 피해량 +25% 증폭 및 적 방어력 20% 관통 무시',
    effectType: 'skill_dmg_pen'
  },
  6: {
    floor: 6,
    setId: 'boss_set_6',
    setName: '6F 핏빛 성역 세트',
    requiredCount: 3,
    bonusName: '선혈의 갈증',
    description: '[3세트 완성] 선혈의 갈증: 체력 50% 이하 시 공격력 +35% 폭주 및 피해량의 20% 흡혈',
    effectType: 'bloodlust'
  },
  7: {
    floor: 7,
    setId: 'boss_set_7',
    setName: '7F 망각의 묘지기 세트',
    requiredCount: 3,
    bonusName: '원혼의 속박',
    description: '[3세트 완성] 원혼의 속박: 공격 시 25% 확률로 대상을 1턴간 [빙결] 상태로 행동 불능화',
    effectType: 'stun_chance'
  },
  8: {
    floor: 8,
    setId: 'boss_set_8',
    setName: '8F 단죄의 성기사 세트',
    requiredCount: 3,
    bonusName: '단죄의 불패성',
    description: '[3세트 완성] 단죄의 불패성: 받는 모든 피해 20% 상시 경감 및 치명타 저항 20% 증가',
    effectType: 'dmg_reduction'
  },
  9: {
    floor: 9,
    setId: 'boss_set_9',
    setName: '9F 거울 미궁 세트',
    requiredCount: 3,
    bonusName: '환영 굴절',
    description: '[3세트 완성] 환영 굴절: 20% 확률로 적의 단일 공격을 100% 완전 회피(굴절)',
    effectType: 'evade_chance'
  },
  10: {
    floor: 10,
    setId: 'boss_set_10',
    setName: '10F 종말의 심연군주 세트',
    requiredCount: 3,
    bonusName: '종말의 심연 군주',
    description: '[3세트 완성] 종말의 군주: 올스탯 +30% 증폭 및 3턴마다 적 전체에 최대 체력 15% 심연 폭발',
    effectType: 'asmodeus_wrath'
  },
};

/**
 * 👑 영웅이 착용한 보스 세트 완성 여부 확인 (3세트 만족 시 해당 세트 정보 반환)
 */
export function getHeroEquippedBossSet(hero?: { equipment?: Partial<Record<EquipmentSlot, EquipmentItem>> }): BossSetBonus | null {
  if (!hero || !hero.equipment) return null;
  const w = hero.equipment.weapon;
  const a = hero.equipment.armor;
  const acc = hero.equipment.accessory;
  if (!w || !a || !acc) return null;
  if (!w.setId || !a.setId || !acc.setId) return null;
  if (w.setId === a.setId && a.setId === acc.setId) {
    const matched = Object.values(BOSS_SET_BONUSES).find(b => b.setId === w.setId);
    return matched || null;
  }
  return null;
}

/**
 * 일반 보스 처치 시 층수 테마의 유니크 장비를 생성하며,
 * 35% 확률로 랜덤 접두사, 35% 확률로 랜덤 접미사를 독립적으로 부여합니다.
 */
export function generateBossUniqueEquipment(floor: number): EquipmentItem {
  const f = Math.min(10, Math.max(1, floor));
  const pool = BOSS_UNIQUE_DEFINITIONS[f] || BOSS_UNIQUE_DEFINITIONS[1];
  const chosen = pool[Math.floor(Math.random() * pool.length)];

  // 1. 접두사 35% 확률 부여
  let rolledPrefix: EnchantOption | undefined = undefined;
  if (Math.random() < 0.35) {
    const allPrefixes = Object.values(PREFIX_ENCHANT_OPTIONS).filter(p => !p.targetSlot || p.targetSlot === 'all' || p.targetSlot === chosen.slot);
    // 층수별 적절한 등급 풀 필터
    const availablePrefixes = allPrefixes.filter(p => {
      if (f <= 2) return p.rarity === 'rare';
      if (f <= 5) return p.rarity === 'rare' || p.rarity === 'epic';
      return p.rarity === 'epic' || p.rarity === 'legendary';
    });
    const cand = availablePrefixes.length > 0 ? availablePrefixes : allPrefixes;
    rolledPrefix = cand[Math.floor(Math.random() * cand.length)];
  }

  // 2. 접미사 35% 확률 부여
  let rolledSuffix: EnchantOption | undefined = undefined;
  if (Math.random() < 0.35) {
    const allSuffixes = Object.values(SUFFIX_ENCHANT_OPTIONS).filter(s => !s.targetSlot || s.targetSlot === 'all' || s.targetSlot === chosen.slot);
    const availableSuffixes = allSuffixes.filter(s => {
      if (f <= 2) return s.rarity === 'rare';
      if (f <= 5) return s.rarity === 'rare' || s.rarity === 'epic';
      return s.rarity === 'epic' || s.rarity === 'legendary';
    });
    const cand = availableSuffixes.length > 0 ? availableSuffixes : allSuffixes;
    rolledSuffix = cand[Math.floor(Math.random() * cand.length)];
  }

  // 3. 스탯 합산
  const finalStats: EquipmentItem['stats'] = { ...chosen.stats };
  if (rolledPrefix?.stats) {
    Object.entries(rolledPrefix.stats).forEach(([k, v]) => {
      const key = k as keyof EquipmentItem['stats'];
      finalStats[key] = (finalStats[key] || 0) + (v as number);
    });
  }
  if (rolledSuffix?.stats) {
    Object.entries(rolledSuffix.stats).forEach(([k, v]) => {
      const key = k as keyof EquipmentItem['stats'];
      finalStats[key] = (finalStats[key] || 0) + (v as number);
    });
  }

  // 4. 이름 조합
  const prefixPart = rolledPrefix ? `[${rolledPrefix.name}] ` : '';
  const suffixPart = rolledSuffix ? ` [${rolledSuffix.name}]` : '';
  const fullName = `${prefixPart}${chosen.baseName}${suffixPart}`;

  const setBonus = BOSS_SET_BONUSES[f];

  const createdItem: EquipmentItem = {
    id: `equip_unique_${f}_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    templateId: chosen.id,
    baseName: chosen.baseName,
    name: fullName,
    slot: chosen.slot,
    level: 0,
    rarity: 'unique',
    baseStats: { ...chosen.stats },
    stats: finalStats,
    description: chosen.description,
    icon: chosen.icon,
    prefix: rolledPrefix,
    suffix: rolledSuffix,
    affinity: chosen.affinity,
    setId: setBonus?.setId || `boss_set_${f}`,
    setName: setBonus?.setName || `${f}층 보스 세트`,
    setRequiredCount: 3,
    setBonusDesc: setBonus?.description
  };

  return corruptEquipment(sanitizeEquipmentEnchantSkills(createdItem));
}

/**
 * 🏭 병기창(Forge) 레벨에 따른 기본 단조 장비 레시피 동적 생성
 * - 레벨당 기본 장비 명칭이 점진적으로 화려해집니다.
 * - 레벨당 성능이 약 10%씩 복리 증가합니다.
 * - 레벨이 오를수록 석탄, 가죽, 뼈, 마력 수정, 에테르, 공허 파편 등 복합 재료가 요구됩니다.
 */
// ─── 병기창 1~10티어 장비 명칭 및 스탯 테이블 ────────────────────────────
export const FORGE_TIER_NAMES: Record<number, {
  sword: string; spear: string; gun: string; bow: string; staff: string; dagger: string;
  leather_armor: string; plate_armor: string; robe: string;
  ring: string; necklace: string; amulet: string;
  descPrefix: string;
}> = {
  1: {
    sword: '수습 대장장이의 철검', spear: '수습 대장장이의 창', gun: '기본 마총', bow: '수습 목재 장궁', staff: '수습 원목 지팡이', dagger: '수습 단검',
    leather_armor: '수습 가죽 갑옷', plate_armor: '수습 판금 갑옷', robe: '수습 마나 로브',
    ring: '은빛 반지', necklace: '수호석 목걸이', amulet: '비전 부적',
    descPrefix: '기초적인 단조 기술로 제작된 [일반] 실전용'
  },
  2: {
    sword: '단련된 강철 장검', spear: '강철 기병창', gun: '정밀 강화 마총', bow: '탄성 강화 강궁', staff: '정제 마력 지팡이', dagger: '예리한 강철 비수',
    leather_armor: '강화 가죽 갑옷', plate_armor: '정련 강철 판금갑', robe: '정제 마나 로브',
    ring: '광채 은빛 반지', necklace: '수호 결계 목걸이', amulet: '정화의 비전 부적',
    descPrefix: '석탄 열기로 강철을 단련하여 기본 성능을 배가한 [일반] 강화'
  },
  3: {
    sword: '마도 룬 각인 명검', spear: '룬 새김 장창', gun: '마도 속사 마총', bow: '룬 마력 합성궁', staff: '원소 마도 지팡이', dagger: '그림자 암살 비수',
    leather_armor: '마도 룬 가죽갑', plate_armor: '마도 수호 판금갑', robe: '원소 공명 로브',
    ring: '마력 응축 반지', necklace: '성스러운 가호 목걸이', amulet: '영혼 공명 부적',
    descPrefix: '마력 수정을 주입해 룬을 각인하고 3개 복합 스탯을 발현한 [희귀]'
  },
  4: {
    sword: '흑요석 정예 기사검', spear: '흑요석 관통 월도', gun: '에테르 중화 마총', bow: '흑요석 관통 대궁', staff: '대마도사의 성운 지팡이', dagger: '환영 흑요석 단검',
    leather_armor: '흑요석 정예 경갑', plate_armor: '흑요석 철벽 중갑', robe: '비전 성운 로브',
    ring: '에테르 심장 반지', necklace: '기사단 영웅 목걸이', amulet: '심연 억제 부적',
    descPrefix: '흑요석과 에테르를 융합하여 강력한 3대 전투 성능을 부여한 [희귀]'
  },
  5: {
    sword: '심연 파멸의 신화검', spear: '공허 분쇄 파성창', gun: '모노리스 파멸포', bow: '심연 차원 성운궁', staff: '태고 현자의 지팡이', dagger: '심연 그림자 사령검',
    leather_armor: '심연 수호 가죽갑', plate_armor: '공허 지배 수호갑', robe: '공허 지배 성의',
    ring: '공허 인장 반지', necklace: '지배자의 심연 목걸이', amulet: '차원 왜곡 부적',
    descPrefix: '공허 파편을 벼려내 4개 결전 스탯을 개방한 심연의 [영웅]'
  },
  6: {
    sword: '진홍 혈염의 결전검', spear: '선혈 섬광 창', gun: '진홍 흡혈 마총', bow: '혈염 환영궁', staff: '진홍 천상봉', dagger: '선혈 유령도',
    leather_armor: '진홍 혈염 경갑', plate_armor: '진홍 혈염 판금갑', robe: '진홍 선혈 로브',
    ring: '혈옥의 인장 반지', necklace: '불멸 선혈 목걸이', amulet: '혈계 계약 부적',
    descPrefix: '진홍빛 혈염의 마도 권능이 깃들어 4대 전투 능력을 극대화한 [영웅]'
  },
  7: {
    sword: '망각 사신의 영혼검', spear: '사령 절단 극창', gun: '망각 저격 마총', bow: '영혼 포식 대궁', staff: '망각 사령 마도봉', dagger: '영혼 수확 암살검',
    leather_armor: '망각 사령 경갑', plate_armor: '망각 철벽 사령갑', robe: '망각 사령 로브',
    ring: '사령 속박 반지', necklace: '영혼 해방 목걸이', amulet: '망각 사신 부적',
    descPrefix: '망각 묘역의 원혼 에너지를 제련하여 파괴적인 4개 스탯을 지닌 [영웅]'
  },
  8: {
    sword: '단죄 칠흑의 심판검', spear: '단죄 성역 장창', gun: '심판 단죄 마총', bow: '성역 심판궁', staff: '단죄 성역 대지팡이', dagger: '칠흑 심판 단도',
    leather_armor: '단죄 성역 가죽갑', plate_armor: '단죄 불패 성역갑', robe: '칠흑 단죄 성의',
    ring: '단죄 수호 반지', necklace: '불패 성역 목걸이', amulet: '단죄 심판 부적',
    descPrefix: '단죄 요새의 결계 강철로 단조되어 5개 올라운드 스탯을 개화한 [전설]'
  },
  9: {
    sword: '만화경 환영 명검', spear: '거울 차원 극창', gun: '환영 굴절 마총', bow: '만화경 환영궁', staff: '거울 미궁 마도봉', dagger: '환영 굴절 비수',
    leather_armor: '만화경 환영 경갑', plate_armor: '거울 굴절 판금갑', robe: '만화경 차원 로브',
    ring: '환영 거울 반지', necklace: '미궁 진실 목걸이', amulet: '만화경 환영 부적',
    descPrefix: '거울 차원의 굴절 마력을 담아 5대 능력치를 초월적으로 증폭한 [전설]'
  },
  10: {
    sword: '절대 종말의 심연검', spear: '종말 멸망 신창', gun: '심연 종말 파멸포', bow: '종말 심연 대궁', staff: '아스모데우스 마도봉', dagger: '종말 암흑 절멸도',
    leather_armor: '종말 심연 극갑', plate_armor: '아스모데우스 절대갑', robe: '종말 절대 성의',
    ring: '절대 종말 반지', necklace: '아스모데우스 왕관 목걸이', amulet: '종말 절대 부적',
    descPrefix: '심연의 정점에 도달한 마도 공학의 궁극 5개 초월 스탯을 품은 [전설 신화]'
  }
};

export const FORGE_STAT_TABLE: Record<number, Record<string, Record<string, number>>> = {
  1: {
    sword: { atk: 6, def: 2 },
    spear: { atk: 7, def: 2 },
    gun: { atk: 4, spd: 2 },
    bow: { atk: 4, luck: 3 },
    staff: { atk: 5, mp: 22 },
    dagger: { atk: 6, spd: 3 },
    leather_armor: { def: 5, spd: 2 },
    plate_armor: { def: 7, hp: 35 },
    robe: { def: 3, mp: 25 },
    ring: { atk: 2, luck: 2 },
    necklace: { def: 2, hp: 25 },
    amulet: { mp: 20, spd: 2 },
  },
  2: {
    sword: { atk: 11, def: 2 },
    spear: { atk: 12, def: 4 },
    gun: { atk: 8, spd: 3 },
    bow: { atk: 8, luck: 4 },
    staff: { atk: 8, mp: 36 },
    dagger: { atk: 10, spd: 4 },
    leather_armor: { def: 8, spd: 3 },
    plate_armor: { def: 12, hp: 63 },
    robe: { def: 6, mp: 43 },
    ring: { atk: 5, luck: 3 },
    necklace: { def: 5, hp: 46 },
    amulet: { mp: 34, spd: 3 },
  },
  3: {
    sword: { atk: 18, def: 5, hp: 35 },
    spear: { atk: 19, def: 6, luck: 2 },
    gun: { atk: 13, spd: 4, luck: 3 },
    bow: { atk: 12, luck: 7, spd: 2 },
    staff: { atk: 14, mp: 59, def: 3 },
    dagger: { atk: 16, spd: 6, luck: 4 },
    leather_armor: { def: 14, spd: 4, hp: 42 },
    plate_armor: { def: 19, hp: 102, atk: 3 },
    robe: { def: 10, mp: 71, atk: 4 },
    ring: { atk: 8, luck: 6, spd: 1 },
    necklace: { def: 8, hp: 74, luck: 2 },
    amulet: { mp: 55, spd: 5, def: 3 },
  },
  4: {
    sword: { atk: 18, def: 5, hp: 39 },
    spear: { atk: 20, def: 6, luck: 3 },
    gun: { atk: 14, spd: 4, luck: 3 },
    bow: { atk: 13, luck: 6, spd: 3 },
    staff: { atk: 14, mp: 61, def: 3 },
    dagger: { atk: 16, spd: 6, luck: 4 },
    leather_armor: { def: 14, spd: 4, hp: 49 },
    plate_armor: { def: 19, hp: 106, atk: 3 },
    robe: { def: 10, mp: 74, atk: 5 },
    ring: { atk: 9, luck: 6, spd: 2 },
    necklace: { def: 9, hp: 79, luck: 3 },
    amulet: { mp: 58, spd: 4, def: 3 },
  },
  5: {
    sword: { atk: 25, def: 6, hp: 64, luck: 3 },
    spear: { atk: 27, def: 9, luck: 4, hp: 59 },
    gun: { atk: 19, spd: 5, luck: 4, mp: 18 },
    bow: { atk: 18, luck: 8, spd: 4, hp: 49 },
    staff: { atk: 19, mp: 85, def: 5, luck: 3 },
    dagger: { atk: 22, spd: 7, luck: 6, hp: 44 },
    leather_armor: { def: 19, spd: 5, hp: 76, luck: 3 },
    plate_armor: { def: 27, hp: 150, atk: 6, luck: 3 },
    robe: { def: 15, mp: 106, atk: 7, spd: 2 },
    ring: { atk: 12, luck: 7, spd: 3, mp: 15 },
    necklace: { def: 12, hp: 113, luck: 4, mp: 18 },
    amulet: { mp: 83, spd: 6, def: 5, atk: 5 },
  },
  6: {
    sword: { atk: 34, def: 9, hp: 93, luck: 4 },
    spear: { atk: 36, def: 12, luck: 6, hp: 88 },
    gun: { atk: 25, spd: 6, luck: 6, mp: 25 },
    bow: { atk: 24, luck: 11, spd: 5, hp: 74 },
    staff: { atk: 26, mp: 118, def: 7, luck: 4 },
    dagger: { atk: 30, spd: 9, luck: 8, hp: 69 },
    leather_armor: { def: 26, spd: 6, hp: 111, luck: 4 },
    plate_armor: { def: 36, hp: 204, atk: 8, luck: 4 },
    robe: { def: 21, mp: 145, atk: 10, spd: 3 },
    ring: { atk: 16, luck: 10, spd: 4, mp: 22 },
    necklace: { def: 16, hp: 155, luck: 6, mp: 25 },
    amulet: { mp: 112, spd: 7, def: 7, atk: 7 },
  },
  7: {
    sword: { atk: 44, def: 12, hp: 127, luck: 6 },
    spear: { atk: 46, def: 15, luck: 8, hp: 123 },
    gun: { atk: 32, spd: 8, luck: 8, mp: 34 },
    bow: { atk: 31, luck: 14, spd: 6, hp: 108 },
    staff: { atk: 34, mp: 157, def: 10, luck: 6 },
    dagger: { atk: 40, spd: 11, luck: 11, hp: 98 },
    leather_armor: { def: 34, spd: 8, hp: 152, luck: 6 },
    plate_armor: { def: 46, hp: 267, atk: 10, luck: 6 },
    robe: { def: 28, mp: 195, atk: 14, spd: 4 },
    ring: { atk: 22, luck: 13, spd: 6, mp: 30 },
    necklace: { def: 22, hp: 207, luck: 8, mp: 34 },
    amulet: { mp: 152, spd: 9, def: 10, atk: 10 },
  },
  8: {
    sword: { atk: 56, def: 16, hp: 169, luck: 8, spd: 2 },
    spear: { atk: 59, def: 19, luck: 10, hp: 165, spd: 2 },
    gun: { atk: 41, spd: 9, luck: 10, mp: 46, hp: 110 },
    bow: { atk: 39, luck: 17, spd: 8, hp: 147, mp: 35 },
    staff: { atk: 43, mp: 203, def: 13, luck: 8, hp: 139 },
    dagger: { atk: 51, spd: 13, luck: 14, hp: 136, def: 10 },
    leather_armor: { def: 43, spd: 9, hp: 195, luck: 8, atk: 11 },
    plate_armor: { def: 60, hp: 345, atk: 14, luck: 8, spd: 3 },
    robe: { def: 35, mp: 248, atk: 18, spd: 6, hp: 117 },
    ring: { atk: 28, luck: 16, spd: 7, mp: 44, hp: 88 },
    necklace: { def: 28, hp: 268, luck: 10, mp: 46, atk: 10 },
    amulet: { mp: 194, spd: 10, def: 13, atk: 14, luck: 6 },
  },
  9: {
    sword: { atk: 69, def: 20, hp: 225, luck: 11, spd: 3 },
    spear: { atk: 73, def: 23, luck: 12, hp: 221, spd: 3 },
    gun: { atk: 51, spd: 11, luck: 13, mp: 62, hp: 147 },
    bow: { atk: 48, luck: 21, spd: 10, hp: 196, mp: 47 },
    staff: { atk: 53, mp: 255, def: 16, luck: 11, hp: 186 },
    dagger: { atk: 63, spd: 16, luck: 18, hp: 181, def: 12 },
    leather_armor: { def: 54, spd: 11, hp: 260, luck: 11, atk: 14 },
    plate_armor: { def: 74, hp: 439, atk: 18, luck: 11, spd: 4 },
    robe: { def: 44, mp: 314, atk: 25, spd: 8, hp: 157 },
    ring: { atk: 34, luck: 20, spd: 9, mp: 59, hp: 118 },
    necklace: { def: 34, hp: 341, luck: 13, mp: 62, atk: 12 },
    amulet: { mp: 244, spd: 13, def: 16, atk: 19, luck: 8 },
  },
  10: {
    sword: { atk: 83, def: 25, hp: 289, luck: 13, spd: 4 },
    spear: { atk: 89, def: 29, luck: 15, hp: 284, spd: 4 },
    gun: { atk: 62, spd: 13, luck: 17, mp: 78, hp: 196 },
    bow: { atk: 58, luck: 26, spd: 12, hp: 255, mp: 62 },
    staff: { atk: 64, mp: 319, def: 21, luck: 15, hp: 245 },
    dagger: { atk: 78, spd: 19, luck: 22, hp: 235, def: 16 },
    leather_armor: { def: 66, spd: 14, hp: 328, luck: 15, atk: 19 },
    plate_armor: { def: 90, hp: 547, atk: 23, luck: 13, spd: 5 },
    robe: { def: 55, mp: 393, atk: 31, spd: 10, hp: 206 },
    ring: { atk: 42, luck: 25, spd: 11, mp: 78, hp: 157 },
    necklace: { def: 42, hp: 427, luck: 15, mp: 81, atk: 16 },
    amulet: { mp: 306, spd: 15, def: 21, atk: 24, luck: 11 },
  },
};

// ─── 💀 저주받은 장비 기본 원형 풀 (12종) ──────────────────────────────
export interface CursedBaseDef {
  key: string;
  name: string;
  slot: EquipmentSlot;
  icon: string;
  affinity?: string[];
}

export const CURSED_EQUIP_BASES: CursedBaseDef[] = [
  { key: 'sword', name: '검', slot: 'weapon', icon: '⚔️', affinity: ['tank', 'berserker', 'dealer_phy'] },
  { key: 'spear', name: '창', slot: 'weapon', icon: '🔱', affinity: ['tank', 'berserker', 'dealer_phy'] },
  { key: 'gun', name: '마총', slot: 'weapon', icon: '🔫', affinity: ['gunner', 'dealer_phy'] },
  { key: 'bow', name: '활', slot: 'weapon', icon: '🏹', affinity: ['gunner', 'dealer_phy'] },
  { key: 'staff', name: '지팡이', slot: 'weapon', icon: '🪄', affinity: ['dealer_mag', 'healer'] },
  { key: 'dagger', name: '단검', slot: 'weapon', icon: '🗡️', affinity: ['dealer_phy', 'berserker'] },
  { key: 'leather_armor', name: '가죽 갑옷', slot: 'armor', icon: '🧥', affinity: ['dealer_phy', 'gunner', 'healer', 'berserker'] },
  { key: 'plate_armor', name: '판금 갑옷', slot: 'armor', icon: '🛡️', affinity: ['tank', 'berserker'] },
  { key: 'robe', name: '로브', slot: 'armor', icon: '🔮', affinity: ['dealer_mag', 'healer'] },
  { key: 'ring', name: '반지', slot: 'accessory', icon: '💍', affinity: ['all'] },
  { key: 'necklace', name: '목걸이', slot: 'accessory', icon: '📿', affinity: ['all'] },
  { key: 'amulet', name: '부적', slot: 'accessory', icon: '🧿', affinity: ['all'] },
];

/**
 * 💀 던전 드랍 장비를 심연에 침식된 상태로 변환합니다.
 * - [침식된] 접두어 부여
 * - 착용 불가(isCorrupted = true, isUnpurified = true)
 * - 정화 시 ±30% 랜덤 스탯 산출을 위한 baseStats 보존
 */
export function corruptEquipment(item: EquipmentItem): EquipmentItem {
  if (!item) return item;

  // 이미 침식된 장비라면 그대로 반환
  if (item.isCorrupted) return item;

  // baseStats 보존 (없으면 현재 stats로 복사)
  if (!item.baseStats || Object.keys(item.baseStats).length === 0) {
    item.baseStats = { ...item.stats };
  }

  item.isCorrupted = true;
  item.isUnpurified = true;

  // [침식된] 접두어 부착
  const cleanName = item.name.replace(/^\[(침식된|저주받은|정화된)\]\s*/, '').trim();
  item.name = `[침식된] ${cleanName}`;
  item.curseDesc = '착용 불가 (병기창에서 정화 필요)';

  return item;
}

/**
 * ✨ 침식된 장비를 병기창에서 정화하여 순정 장비로 복원합니다.
 * - 결과물에 [정화된] 같은 접두어가 붙지 않고 순정 템으로 복원
 * - 단조 시와 같이 기본 베이스 템의 ±30% 랜덤 스탯 조정
 * - 착용 가능 상태로 전환 (isCorrupted = false, isUnpurified = false)
 */
export function purifyCorruptedEquipment(item: EquipmentItem): EquipmentItem {
  if (!item) return item;

  // 1. [침식된], [저주받은] 등 접두어 완벽 제거하여 순정 명칭으로 복원
  const pureName = item.name.replace(/^\[(침식된|저주받은|정화된)\]\s*/, '').trim();

  // 2. 기본 베이스 템 스탯 기준치 확보
  const baseStatSource = item.baseStats && Object.keys(item.baseStats).length > 0 
    ? item.baseStats 
    : item.stats;

  // 3. 기본 베이스 템의 ±30% (70% ~ 130%) 랜덤 스탯 조정
  const rolledStats: EquipmentItem['stats'] = {};
  for (const [sKey, sVal] of Object.entries(baseStatSource)) {
    if (typeof sVal === 'number' && sVal > 0) {
      // 0.70 ~ 1.30 (±30% 랜덤 배율)
      const variance = 0.70 + Math.random() * 0.60;
      rolledStats[sKey as keyof EquipmentItem['stats']] = Math.max(1, Math.round(sVal * variance));
    }
  }

  // 4. 기존 접두사(prefix)나 접미사(suffix) 인챈트가 있다면 인챈트 보너스 합산
  if (item.prefix?.stats) {
    Object.entries(item.prefix.stats).forEach(([k, v]) => {
      const key = k as keyof EquipmentItem['stats'];
      rolledStats[key] = (rolledStats[key] || 0) + (v as number);
    });
  }
  if (item.suffix?.stats) {
    Object.entries(item.suffix.stats).forEach(([k, v]) => {
      const key = k as keyof EquipmentItem['stats'];
      rolledStats[key] = (rolledStats[key] || 0) + (v as number);
    });
  }

  // 5. 설명 복원 (침식 경고문 제거)
  let cleanDesc = item.description || '';
  cleanDesc = cleanDesc.replace(/\[(심연의 저주에 침식된 장비|심연에 침식된 장비|침식 상태)\].*?(\.|$)/g, '').trim();
  if (!cleanDesc) {
    cleanDesc = `병기창에서 심연의 침식을 온전히 정화하여 순정한 위력을 되찾은 장비입니다.`;
  }

  return {
    ...item,
    name: pureName,
    isCorrupted: false,
    isUnpurified: false,
    isCursed: false,
    curseDesc: undefined,
    baseStats: { ...baseStatSource },
    stats: rolledStats,
    description: cleanDesc
  };
}

/**
 * 🩸 저주받은 장비 정화 시 모든 등급 풀에서 결정 및 최상급 스탯 부여 (호환성 유지)
 */
export function createPurifiedEquipmentFromCursed(cursedItem: EquipmentItem): EquipmentItem {
  return purifyCorruptedEquipment(cursedItem);
}

/**
 * 🎲 병기창 레벨에 따른 단조 등급 확률 정의
 * - Lv 1~5: 기본 일반(Common), 확률적으로 희귀(Rare) 제작 (+보너스 스탯)
 * - Lv 6~9: 기본 일반(Common), 확률적으로 희귀(Rare) 및 영웅(Epic) 등급까지 제작 가능
 * - Lv 10: 전설(Legendary) 등급까지 낮은 확률로 제작 가능
 */
export interface ForgeRarityRates {
  common: number;
  rare: number;
  epic: number;
  legendary: number;
  maxRarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export function getForgeRarityRates(forgeLevel: number): ForgeRarityRates {
  const lv = Math.max(1, Math.min(10, forgeLevel));
  if (lv <= 2) {
    // 1~2레벨: 일반 등급만 단조 (희귀 0%)
    return {
      common: 1,
      rare: 0,
      epic: 0,
      legendary: 0,
      maxRarity: 'common'
    };
  } else if (lv <= 5) {
    // 3~5레벨: 기본 일반, 확률적 희귀 (Lv3: 20%, Lv4: 28%, Lv5: 35%)
    const rareRate = 0.20 + (lv - 3) * 0.075;
    return {
      common: Math.round((1 - rareRate) * 100) / 100,
      rare: Math.round(rareRate * 100) / 100,
      epic: 0,
      legendary: 0,
      maxRarity: 'rare'
    };
  } else if (lv <= 9) {
    // 6~9레벨: 일반 기본, 희귀 및 영웅 확률
    const epicRate = 0.10 + (lv - 6) * 0.05; // Lv6: 10%, Lv7: 15%, Lv8: 20%, Lv9: 25%
    const rareRate = 0.35 + (lv - 6) * 0.02; // Lv6: 35%, Lv7: 37%, Lv8: 39%, Lv9: 41%
    const commonRate = Math.max(0, 1 - epicRate - rareRate);
    return {
      common: Math.round(commonRate * 100) / 100,
      rare: Math.round(rareRate * 100) / 100,
      epic: Math.round(epicRate * 100) / 100,
      legendary: 0,
      maxRarity: 'epic'
    };
  } else {
    // Lv 10: 전설 7% 낮은 확률
    return {
      common: 0.20,
      rare: 0.45,
      epic: 0.28,
      legendary: 0.07,
      maxRarity: 'legendary'
    };
  }
}

export function rollForgeItemRarity(forgeLevel: number): 'common' | 'rare' | 'epic' | 'legendary' {
  const rates = getForgeRarityRates(forgeLevel);
  const roll = Math.random();
  if (rates.legendary > 0 && roll < rates.legendary) {
    return 'legendary';
  }
  if (rates.epic > 0 && roll < (rates.legendary + rates.epic)) {
    return 'epic';
  }
  if (rates.rare > 0 && roll < (rates.legendary + rates.epic + rates.rare)) {
    return 'rare';
  }
  return 'common';
}

/**
 * 💫 단조 시 롤링된 등급에 따른 추가 스탯 및 증폭 보너스 적용
 */
export function applyForgeRarityBonus(
  baseStats: Record<string, number>,
  slot: EquipmentSlot,
  rarity: 'common' | 'rare' | 'unique' | 'epic' | 'legendary',
  forgeLevel: number
): { finalStats: Record<string, number>; bonusNotes: string[] } {
  const finalStats: Record<string, number> = { ...baseStats };
  const bonusNotes: string[] = [];

  // 기본 제작 편차 (±8%)
  for (const k of Object.keys(finalStats)) {
    const v = finalStats[k];
    if (typeof v === 'number' && v > 0) {
      const variance = 0.92 + Math.random() * 0.16;
      finalStats[k] = Math.max(1, Math.round(v * variance));
    }
  }

  // 잠재적 추가 스탯 후보군
  const allPotentialStats: { key: string; baseVal: number }[] = [
    { key: 'atk', baseVal: Math.max(2, Math.round(forgeLevel * 3.5)) },
    { key: 'def', baseVal: Math.max(2, Math.round(forgeLevel * 2.5)) },
    { key: 'hp', baseVal: Math.max(15, Math.round(forgeLevel * 22)) },
    { key: 'mp', baseVal: Math.max(10, Math.round(forgeLevel * 15)) },
    { key: 'spd', baseVal: Math.max(1, Math.min(15, Math.round(forgeLevel * 1.2))) },
    { key: 'luck', baseVal: Math.max(2, Math.min(25, Math.round(forgeLevel * 1.8))) },
  ];

  if (rarity === 'rare') {
    // 1. 기존 스탯 15%~25% 보너스
    const mult = 1.15 + Math.random() * 0.10;
    for (const k of Object.keys(finalStats)) {
      finalStats[k] = Math.max(1, Math.round(finalStats[k] * mult));
    }
    bonusNotes.push('스탯 +20% 증폭');

    // 2. 추가 스탯 1개 발현
    const available = allPotentialStats.filter(s => finalStats[s.key] === undefined || finalStats[s.key] === 0);
    if (available.length > 0) {
      const picked = available[Math.floor(Math.random() * available.length)];
      finalStats[picked.key] = picked.baseVal;
      bonusNotes.push(`${picked.key.toUpperCase()} +${picked.baseVal}`);
    }
  } else if (rarity === 'epic') {
    // 1. 기존 스탯 30%~45% 보너스
    const mult = 1.30 + Math.random() * 0.15;
    for (const k of Object.keys(finalStats)) {
      finalStats[k] = Math.max(1, Math.round(finalStats[k] * mult));
    }
    bonusNotes.push('스탯 +35% 대폭 증폭');

    // 2. 추가 스탯 2개 발현
    const available = allPotentialStats.filter(s => finalStats[s.key] === undefined || finalStats[s.key] === 0);
    const count = Math.min(2, available.length);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * available.length);
      const picked = available.splice(idx, 1)[0];
      const val = Math.round(picked.baseVal * 1.2);
      finalStats[picked.key] = val;
      bonusNotes.push(`${picked.key.toUpperCase()} +${val}`);
    }
  } else if (rarity === 'legendary') {
    // 1. 기존 스탯 55%~75% 극대화 보너스
    const mult = 1.55 + Math.random() * 0.20;
    for (const k of Object.keys(finalStats)) {
      finalStats[k] = Math.max(1, Math.round(finalStats[k] * mult));
    }
    bonusNotes.push('전설의 권능: 전 스탯 +65% 극대화');

    // 2. 추가 스탯 3개 발현
    const available = allPotentialStats.filter(s => finalStats[s.key] === undefined || finalStats[s.key] === 0);
    const count = Math.min(3, available.length);
    for (let i = 0; i < count; i++) {
      const idx = Math.floor(Math.random() * available.length);
      const picked = available.splice(idx, 1)[0];
      const val = Math.round(picked.baseVal * 1.5);
      finalStats[picked.key] = val;
      bonusNotes.push(`${picked.key.toUpperCase()} +${val}`);
    }
  }

  return { finalStats, bonusNotes };
}

export const FORGE_ITEM_BASE_COSTS: Record<string, Partial<GameResources>> = {
  // ⚔️ 무기군
  sword: { iron: 35, coal: 6, wood: 10, gold: 200 },
  spear: { iron: 28, wood: 25, coal: 6, gold: 220 },
  gun: { iron: 30, ether: 20, coal: 8, gold: 350 },
  bow: { wood: 35, leather: 15, bone: 8, gold: 200 },
  staff: { wood: 35, coal: 12, crystal: 8, ether: 12, gold: 250 },
  dagger: { iron: 20, leather: 20, bone: 10, gold: 180 },
  // 🛡️ 방어구군
  leather_armor: { leather: 35, bone: 12, wood: 10, gold: 200 },
  plate_armor: { iron: 50, coal: 15, stone: 25, gold: 350 },
  robe: { silk: 25, ether: 18, crystal: 4, gold: 250 },
  // 💍 장신구군
  ring: { gold: 400, ether: 15, crystal: 5 },
  necklace: { gold: 400, stone: 30, herb: 15, bone: 8 },
  amulet: { silk: 18, ether: 25, crystal: 10, gold: 450 },
};

/**
 * 🏭 병기창(Forge) 레벨에 따른 기본 단조 장비 레시피 동적 생성
 */
export function getForgeEquipmentRecipes(forgeLevel: number = 1): EquipmentRecipe[] {
  const lv = Math.max(1, Math.min(10, forgeLevel));
  const curTier = FORGE_TIER_NAMES[lv] || FORGE_TIER_NAMES[1];
  const curStats = FORGE_STAT_TABLE[lv] || FORGE_STAT_TABLE[1];

  // 단조 기본 등급은 일반(Common)이며, 단조 시 병기창 레벨에 따라 희귀/영웅/전설 등급 확률 롤 적용
  const itemRarity: 'common' | 'rare' | 'epic' | 'legendary' = 'common';

  // ── 아이템 타입별 & 등급(스탯 개수)별 연관 자원 비용 산출 함수 ──
  const calculateForgeItemCost = (itemKey: string): Partial<GameResources> => {
    // 1. 레벨별 기본 스케일 배율 (1레벨 1.0배 ~ 10레벨 11.5배)
    const TIER_SCALE: Record<number, number> = {
      1: 1.0,
      2: 1.35,
      3: 1.8,
      4: 2.3,
      5: 3.2,
      6: 4.2,
      7: 5.5,
      8: 7.0,
      9: 9.0,
      10: 11.5,
    };
    const mult = TIER_SCALE[lv] || 1.0;

    // 2. 아이템별 주재료 기초 베이스 수치
    const base = FORGE_ITEM_BASE_COSTS[itemKey] || { gold: 300, iron: 20 };
    const cost: Partial<GameResources> = {};

    // 기본 특화 재료에 티어 배율 적용
    for (const [k, v] of Object.entries(base)) {
      cost[k as keyof GameResources] = Math.max(1, Math.round(((v as number) || 0) * mult));
    }

    // 3. 🌟 등급 상승 및 스탯 종류 확장에 따른 고급 심연 재료(에테르, 마력 수정, 공허 파편) 대폭 추가
    const isMagicOrAccessory = ['robe', 'staff', 'amulet', 'ring', 'gun'].includes(itemKey);

    // 3-1) 에테르 (마도 촉매 & 차원 결속)
    if (lv >= 3) {
      if (isMagicOrAccessory) {
        // 마법/장신구: Lv3부터 에테르 대폭 확장
        const extraEther = lv >= 8 ? (lv - 7) * 45 + 100 : lv >= 5 ? (lv - 4) * 25 + 30 : (lv - 2) * 15;
        cost.ether = (cost.ether || 0) + extraEther;
      } else {
        // 물리 무기/갑옷: 3스탯/4스탯/5스탯 마도 융합을 위해 에테르 본격 요구
        const phyEther = lv >= 8 ? (lv - 7) * 40 + 75 : lv >= 5 ? (lv - 4) * 20 + 20 : (lv - 2) * 8;
        cost.ether = (cost.ether || 0) + phyEther;
      }
    }

    // 3-2) 마력 수정 (3스탯부터 룬 각인 및 스탯 확장 핵심 촉매)
    if (lv >= 3) {
      if (isMagicOrAccessory) {
        const extraCrystal = lv >= 8 ? (lv - 7) * 20 + 40 : lv >= 5 ? (lv - 4) * 12 + 15 : (lv - 2) * 6;
        cost.crystal = (cost.crystal || 0) + extraCrystal;
      } else {
        // 물리 무기/방어구도 3스탯 이상에서는 마력 수정 주입
        const phyCrystal = lv >= 8 ? (lv - 7) * 15 + 25 : lv >= 5 ? (lv - 4) * 8 + 8 : (lv - 2) * 4;
        cost.crystal = (cost.crystal || 0) + phyCrystal;
      }
    }

    // 3-3) 공허 파편 (4스탯 이상 개방되는 Lv.5+ 영웅/전설/신화 장비 전용 최고급 심연 재료)
    if (lv >= 5) {
      // 5티어: 4~5개, 6티어: 7~8개, 7티어: 10~11개, 8티어: 18~21개, 9티어: 27~30개, 10티어: 36~42개
      const baseVoid = isMagicOrAccessory ? 1 : 0;
      const voidShardAmt = lv >= 8 
        ? 18 + (lv - 8) * 9 + baseVoid * 3
        : 4 + (lv - 5) * 3 + baseVoid;
      cost.void_shard = (cost.void_shard || 0) + voidShardAmt;
    }

    return cost;
  };

  const statCountLabel = lv >= 8 ? '5대 특화' : lv >= 5 ? '4대 특화' : lv >= 3 ? '3대 복합' : '기본 실전';

  return [
    // ─── 무기 (Weapons - 6종) ──────────────────────────────
    {
      id: 'rec_sword',
      templateId: `forge_t${lv}_sword`,
      tier: lv,
      name: curTier.sword,
      slot: 'weapon',
      weaponType: 'sword',
      weaponTrait: WEAPON_TRAITS.sword,
      rarity: itemRarity,
      cost: calculateForgeItemCost('sword'),
      baseStats: curStats.sword,
      description: `${curTier.descPrefix} 검. 대량의 철광석과 석탄 열기로 단련하여 균형 잡힌 물리 파괴력을 지닌 [🗡️ 베기] 특화 무기입니다. (병기창 Lv.${lv})`,
      icon: '⚔️',
      affinity: ['tank', 'berserker', 'dealer_phy']
    },
    {
      id: 'rec_spear',
      templateId: `forge_t${lv}_spear`,
      tier: lv,
      name: curTier.spear,
      slot: 'weapon',
      weaponType: 'spear',
      weaponTrait: WEAPON_TRAITS.spear,
      rarity: itemRarity,
      cost: calculateForgeItemCost('spear'),
      baseStats: curStats.spear,
      description: `${curTier.descPrefix} 창. 긴 원목 자루와 정련 강철 창날로 적 보호막을 분쇄하는 [🔱 방어 파쇄] 특화 무기입니다. (병기창 Lv.${lv})`,
      icon: '🔱',
      affinity: ['tank', 'berserker', 'dealer_phy']
    },
    {
      id: 'rec_gun',
      templateId: `forge_t${lv}_gun`,
      tier: lv,
      name: curTier.gun,
      slot: 'weapon',
      weaponType: 'gun',
      weaponTrait: WEAPON_TRAITS.gun,
      rarity: itemRarity,
      cost: calculateForgeItemCost('gun'),
      baseStats: curStats.gun,
      description: `${curTier.descPrefix} 마총. 석탄 화약 추진과 에테르 마나 기류로 빠른 연속 사격을 가하는 [🔫 연사] 특화 무기입니다. (병기창 Lv.${lv})`,
      icon: '🔫',
      affinity: ['gunner', 'dealer_phy']
    },
    {
      id: 'rec_bow',
      templateId: `forge_t${lv}_bow`,
      tier: lv,
      name: curTier.bow,
      slot: 'weapon',
      weaponType: 'bow',
      weaponTrait: WEAPON_TRAITS.bow,
      rarity: itemRarity,
      cost: calculateForgeItemCost('bow'),
      baseStats: curStats.bow,
      description: `${curTier.descPrefix} 활. 유연한 원목과 질긴 가죽 시위로 치명적인 약점을 노리는 [🏹 급소] 특화 무기입니다. (병기창 Lv.${lv})`,
      icon: '🏹',
      affinity: ['gunner', 'dealer_phy']
    },
    {
      id: 'rec_staff',
      templateId: `forge_t${lv}_staff`,
      tier: lv,
      name: curTier.staff,
      slot: 'weapon',
      weaponType: 'staff',
      weaponTrait: WEAPON_TRAITS.staff,
      rarity: itemRarity,
      cost: calculateForgeItemCost('staff'),
      baseStats: curStats.staff,
      description: `${curTier.descPrefix} 지팡이. 신성 영목을 정제하고 마력 수정을 박아 마나 효율을 극대화하는 [🪄 공명] 특화 마도구입니다. (병기창 Lv.${lv})`,
      icon: '🪄',
      affinity: ['dealer_mag', 'healer']
    },
    {
      id: 'rec_dagger',
      templateId: `forge_t${lv}_dagger`,
      tier: lv,
      name: curTier.dagger,
      slot: 'weapon',
      weaponType: 'dagger',
      weaponTrait: WEAPON_TRAITS.dagger,
      rarity: itemRarity,
      cost: calculateForgeItemCost('dagger'),
      baseStats: curStats.dagger,
      description: `${curTier.descPrefix} 단검. 예리한 강철과 가죽 손잡이로 민첩한 선제 기습을 가하는 [⚡ 암습] 특화 무기입니다. (병기창 Lv.${lv})`,
      icon: '🗡️',
      affinity: ['dealer_phy', 'berserker']
    },

    // ─── 방어구 (Armors - 3종) ─────────────────────────────
    {
      id: 'rec_leather_armor',
      templateId: `forge_t${lv}_leather_armor`,
      tier: lv,
      name: curTier.leather_armor,
      slot: 'armor',
      rarity: itemRarity,
      cost: calculateForgeItemCost('leather_armor'),
      baseStats: curStats.leather_armor,
      description: `${curTier.descPrefix} 가죽 갑옷. 질긴 가죽과 흉부 뼈대로 신속한 기동성과 회피력을 온전히 보존하는 ${statCountLabel} 방어구입니다. (병기창 Lv.${lv})`,
      icon: '🧥',
      affinity: ['dealer_phy', 'gunner', 'healer', 'berserker']
    },
    {
      id: 'rec_plate_armor',
      templateId: `forge_t${lv}_plate_armor`,
      tier: lv,
      name: curTier.plate_armor,
      slot: 'armor',
      rarity: itemRarity,
      cost: calculateForgeItemCost('plate_armor'),
      baseStats: curStats.plate_armor,
      description: `${curTier.descPrefix} 판금 갑옷. 막대한 철광석과 석탄 열기로 단조된 철벽같은 방호력과 생명력의 ${statCountLabel} 중갑입니다. (병기창 Lv.${lv})`,
      icon: '🛡️',
      affinity: ['tank', 'berserker']
    },
    {
      id: 'rec_robe',
      templateId: `forge_t${lv}_robe`,
      tier: lv,
      name: curTier.robe,
      slot: 'armor',
      rarity: itemRarity,
      cost: calculateForgeItemCost('robe'),
      baseStats: curStats.robe,
      description: `${curTier.descPrefix} 로브. 대량의 실크(비단)와 순수 에테르를 직조하여 마나 수용과 마도 위력을 극대화한 ${statCountLabel} 성의입니다. (병기창 Lv.${lv})`,
      icon: '🔮',
      affinity: ['dealer_mag', 'healer']
    },

    // ─── 장신구 (Accessories - 3종) ─────────────────────────
    {
      id: 'rec_ring',
      templateId: `forge_t${lv}_ring`,
      tier: lv,
      name: curTier.ring,
      slot: 'accessory',
      rarity: itemRarity,
      cost: calculateForgeItemCost('ring'),
      baseStats: curStats.ring,
      description: `${curTier.descPrefix} 반지. 에테르 광채와 마력 수정 세공으로 공격 집중력과 치명적인 기회를 창출하는 ${statCountLabel} 장신구입니다. (병기창 Lv.${lv})`,
      icon: '💍',
      affinity: ['all']
    },
    {
      id: 'rec_necklace',
      templateId: `forge_t${lv}_necklace`,
      tier: lv,
      name: curTier.necklace,
      slot: 'accessory',
      rarity: itemRarity,
      cost: calculateForgeItemCost('necklace'),
      baseStats: curStats.necklace,
      description: `${curTier.descPrefix} 목걸이. 수호석과 생명 정기로 착용자의 신체 한계를 결계로 보호하는 ${statCountLabel} 장신구입니다. (병기창 Lv.${lv})`,
      icon: '📿',
      affinity: ['all']
    },
    {
      id: 'rec_amulet',
      templateId: `forge_t${lv}_amulet`,
      tier: lv,
      name: curTier.amulet,
      slot: 'accessory',
      rarity: itemRarity,
      cost: calculateForgeItemCost('amulet'),
      baseStats: curStats.amulet,
      description: `${curTier.descPrefix} 부적. 신성 실크와 영혼 수정, 에테르 주술로 전신의 마나 흐름을 가속하는 ${statCountLabel} 장신구입니다. (병기창 Lv.${lv})`,
      icon: '🧿',
      affinity: ['all']
    }
  ];
}

/**
 * 장비의 순수 기본 스탯(0강, 접두/접미 제외)을 정확하게 추출
 */
export function getEquipmentBaseStats(item: EquipmentItem, forgeRecipes: EquipmentRecipe[] = []): NonNullable<EquipmentItem['stats']> {
  if (item.baseStats && Object.keys(item.baseStats).length > 0) {
    return { ...item.baseStats };
  }

  // 1. 대장간 동적 레시피 및 기본 레시피 검색
  const recipe = forgeRecipes.find(r => r.name === item.baseName || r.id === item.baseName)
    || EQUIPMENT_RECIPES.find(r => r.name === item.baseName || r.id === item.baseName);
  if (recipe?.baseStats) {
    return { ...recipe.baseStats };
  }

  // 2. 보스 유니크 장비 정의 검색
  for (const list of Object.values(BOSS_UNIQUE_DEFINITIONS)) {
    const found = list.find(b => b.baseName === item.baseName || b.id === item.baseName || item.id.includes(b.id));
    if (found?.stats) {
      return { ...found.stats };
    }
  }

  // 3. 대체 폴백: item.stats에서 접두/접미 수치 제거 및 기존 강화 역연산
  const clean: NonNullable<EquipmentItem['stats']> = { ...(item.stats || {}) };
  if (item.prefix?.stats) {
    Object.entries(item.prefix.stats).forEach(([k, v]) => {
      const key = k as keyof EquipmentItem['stats'];
      if (typeof v === 'number' && clean[key] !== undefined) {
        clean[key] = (clean[key] || 0) - v;
      }
    });
  }
  if (item.suffix?.stats) {
    Object.entries(item.suffix.stats).forEach(([k, v]) => {
      const key = k as keyof EquipmentItem['stats'];
      if (typeof v === 'number' && clean[key] !== undefined) {
        clean[key] = (clean[key] || 0) - v;
      }
    });
  }

  if (item.level > 0) {
    for (let l = item.level; l > 0; l--) {
      if (clean.atk !== undefined) clean.atk = Math.max(1, Math.round((clean.atk - 4) / 1.05));
      if (clean.def !== undefined) clean.def = Math.max(1, Math.round((clean.def - 3) / 1.05));
      if (clean.hp !== undefined) clean.hp = Math.max(1, Math.round((clean.hp - 25) / 1.05));
      if (clean.mp !== undefined) clean.mp = Math.max(1, Math.round((clean.mp - 15) / 1.05));
      if (clean.spd !== undefined) clean.spd = Math.max(0, (clean.spd || 0) - 1);
      if (clean.luck !== undefined) clean.luck = Math.max(0, (clean.luck || 0) - 1);
    }
  }

  return clean;
}

/**
 * 장비의 순수 기본 스탯을 기준으로 목표 강화 레벨에 맞는 스탯을 정확하게 재계산 (접두/접미 중복 합산 방지)
 */
export function recalculateEquipmentStats(
  item: EquipmentItem,
  targetLevel: number,
  forgeRecipes: EquipmentRecipe[] = []
): NonNullable<EquipmentItem['stats']> {
  if (item.slot === 'weapon') {
    if (!item.weaponType) item.weaponType = detectWeaponType(item);
    if (!item.weaponTrait && item.weaponType) item.weaponTrait = getWeaponTrait(item.weaponType);
  }
  const pureBase = getEquipmentBaseStats(item, forgeRecipes);
  item.baseStats = { ...pureBase };

  const computed: NonNullable<EquipmentItem['stats']> = { ...pureBase };

  for (let l = 0; l < targetLevel; l++) {
    if (computed.atk !== undefined) computed.atk = Math.floor(computed.atk * 1.05 + 4);
    if (computed.def !== undefined) computed.def = Math.floor(computed.def * 1.05 + 3);
    if (computed.hp !== undefined) computed.hp = Math.floor(computed.hp * 1.05 + 25);
    if (computed.mp !== undefined) computed.mp = Math.floor(computed.mp * 1.05 + 15);
    if (computed.spd !== undefined) computed.spd = Math.min(30, Math.floor((computed.spd || 0) + 1));
    if (computed.luck !== undefined) computed.luck = Math.min(60, Math.floor((computed.luck || 0) + 1));
  }

  // 접두어 스탯 가산 (단 1회만 정확히 합산)
  if (item.prefix?.stats) {
    Object.entries(item.prefix.stats).forEach(([k, v]) => {
      const key = k as keyof NonNullable<EquipmentItem['stats']>;
      if (typeof v === 'number') {
        computed[key] = (computed[key] || 0) + v;
      }
    });
  }

  // 접미어 스탯 가산 (단 1회만 정확히 합산)
  if (item.suffix?.stats) {
    Object.entries(item.suffix.stats).forEach(([k, v]) => {
      const key = k as keyof NonNullable<EquipmentItem['stats']>;
      if (typeof v === 'number') {
        computed[key] = (computed[key] || 0) + v;
      }
    });
  }

  return computed;
}

/**
 * 🏆 차원 아레나 랭크/레이팅에 따른 고성능 보상 장비 생성
 * - 아레나 등급(실버~그랜드마스터)에 부합하는 고티어 스탯 및 강화 단계(+1~+10강) 부여
 * - 연승(streak) 달성 시 추가 강화 및 상위 등급 보너스 가산
 * - 무기 / 방어구 / 장신구 중 1종을 균형 있게 추첨
 */
export function generateArenaRewardEquipment(
  rating: number,
  rank: number = 50,
  streak: number = 0
): EquipmentItem {
  let tierName: 'silver' | 'gold' | 'platinum' | 'diamond' | 'master' | 'grandmaster' = 'silver';
  let targetRarity: 'rare' | 'epic' | 'legendary' | 'unique' = 'rare';
  let prefixChance = 0.12;
  let suffixChance = 0.10;

  if (rating >= 2200 || rank <= 3) {
    tierName = 'grandmaster';
    targetRarity = Math.random() < 0.5 ? 'unique' : 'legendary';
    prefixChance = 0.35;
    suffixChance = 0.30;
  } else if (rating >= 1900 || rank <= 10) {
    tierName = 'master';
    targetRarity = Math.random() < 0.3 ? 'unique' : 'legendary';
    prefixChance = 0.30;
    suffixChance = 0.25;
  } else if (rating >= 1600) {
    tierName = 'diamond';
    targetRarity = Math.random() < 0.35 ? 'legendary' : 'epic';
    prefixChance = 0.25;
    suffixChance = 0.20;
  } else if (rating >= 1300) {
    tierName = 'platinum';
    targetRarity = Math.random() < 0.25 ? 'legendary' : 'epic';
    prefixChance = 0.20;
    suffixChance = 0.15;
  } else if (rating >= 1000) {
    tierName = 'gold';
    targetRarity = Math.random() < 0.4 ? 'epic' : 'rare';
    prefixChance = 0.16;
    suffixChance = 0.12;
  } else {
    tierName = 'silver';
    targetRarity = 'rare';
    prefixChance = 0.12;
    suffixChance = 0.10;
  }

  // 강화 단계 없이 생성 (0강)
  const finalEnhanceLevel = 0;

  // 장비 베이스 후보 추첨 (기존 대비 약 30% 스탯 하향 조정)
  const ARENA_BASE_TEMPLATES = [
    // 무기
    { baseName: '투사의 처형검', slot: 'weapon' as EquipmentSlot, icon: '🗡️', baseStats: { atk: 22, def: 7, luck: 6 }, desc: '차원 결투장에서 수많은 강자를 쓰러뜨린 투사의 명검.' },
    { baseName: '투사의 파쇄창', slot: 'weapon' as EquipmentSlot, icon: '🔱', baseStats: { atk: 25, def: 8 }, desc: '적의 전열을 분쇄하는 거대한 투사의 전술 장창.' },
    { baseName: '투사의 결전 마총', slot: 'weapon' as EquipmentSlot, icon: '🔫', baseStats: { atk: 24, spd: 4, luck: 4 }, desc: '에테르 탄환을 고속 연사하는 차원 아레나 제식 마총.' },
    { baseName: '투사의 저격궁', slot: 'weapon' as EquipmentSlot, icon: '🏹', baseStats: { atk: 23, luck: 8, spd: 3 }, desc: '후열의 적을 정확히 꿰뚫는 투사의 초장거리 강궁.' },
    { baseName: '투사의 원소 마도봉', slot: 'weapon' as EquipmentSlot, icon: '🪄', baseStats: { atk: 21, mp: 56, def: 6 }, desc: '차원 마력을 벼려 만든 투사의 비전 지팡이.' },
    { baseName: '투사의 암살 비수', slot: 'weapon' as EquipmentSlot, icon: '🗡️', baseStats: { atk: 20, spd: 7, luck: 7 }, desc: '급소를 기습하기 위해 정밀 연마된 투사의 비수.' },
    // 방어구
    { baseName: '투사의 불패 판금갑', slot: 'armor' as EquipmentSlot, icon: '🛡️', baseStats: { def: 27, hp: 98 }, desc: '어떠한 맹공도 버텨내는 불패의 투사 중장갑주.' },
    { baseName: '투사의 신속 경갑주', slot: 'armor' as EquipmentSlot, icon: '🥋', baseStats: { def: 18, spd: 4, hp: 63 }, desc: '민첩한 기동과 회피를 극대화한 투사의 전투 경갑.' },
    { baseName: '투사의 마나 성의', slot: 'armor' as EquipmentSlot, icon: '🥻', baseStats: { def: 14, mp: 77, hp: 49 }, desc: '마나 순환과 보호 결계를 증폭하는 투사의 마도 로브.' },
    // 장신구
    { baseName: '투사의 영광 반지', slot: 'accessory' as EquipmentSlot, icon: '💍', baseStats: { atk: 11, def: 7, luck: 8, spd: 4 }, desc: '차원 투기장 승리자에게 주어지는 영예로운 반지.' },
    { baseName: '투사의 결전 목걸이', slot: 'accessory' as EquipmentSlot, icon: '📿', baseStats: { hp: 84, def: 10, mp: 35 }, desc: '위기 순간 착용자의 생체 에너지를 지탱하는 결전 펜던트.' },
  ];

  const pickedTemplate = ARENA_BASE_TEMPLATES[Math.floor(Math.random() * ARENA_BASE_TEMPLATES.length)];

  // 접두사/접미사 선별 (낮은 확률 적용)
  let rolledPrefix: EnchantOption | undefined = undefined;
  if (Math.random() < prefixChance) {
    const allPrefixes = Object.values(PREFIX_ENCHANT_OPTIONS).filter(p => !p.targetSlot || p.targetSlot === 'all' || p.targetSlot === pickedTemplate.slot);
    const pool = allPrefixes.filter(p => {
      if (tierName === 'silver') return p.rarity === 'rare';
      if (tierName === 'gold') return p.rarity === 'rare' || p.rarity === 'epic';
      if (tierName === 'platinum') return p.rarity === 'epic' || p.rarity === 'rare';
      return p.rarity === 'epic' || p.rarity === 'legendary';
    });
    const cand = pool.length > 0 ? pool : allPrefixes;
    rolledPrefix = cand[Math.floor(Math.random() * cand.length)];
  }

  let rolledSuffix: EnchantOption | undefined = undefined;
  if (Math.random() < suffixChance) {
    const allSuffixes = Object.values(SUFFIX_ENCHANT_OPTIONS).filter(s => !s.targetSlot || s.targetSlot === 'all' || s.targetSlot === pickedTemplate.slot);
    const pool = allSuffixes.filter(s => {
      if (tierName === 'silver') return s.rarity === 'rare';
      if (tierName === 'gold') return s.rarity === 'rare' || s.rarity === 'epic';
      if (tierName === 'platinum') return s.rarity === 'epic' || s.rarity === 'rare';
      return s.rarity === 'epic' || s.rarity === 'legendary';
    });
    const cand = pool.length > 0 ? pool : allSuffixes;
    rolledSuffix = cand[Math.floor(Math.random() * cand.length)];
  }

  const prefixPart = rolledPrefix ? `[${rolledPrefix.name}] ` : '';
  const suffixPart = rolledSuffix ? ` [${rolledSuffix.name}]` : '';
  const fullName = `${prefixPart}${pickedTemplate.baseName}${suffixPart}`;

  const baseStats = { ...pickedTemplate.baseStats };
  const rawItem: EquipmentItem = {
    id: `equip_arena_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    baseName: pickedTemplate.baseName,
    name: fullName,
    slot: pickedTemplate.slot,
    level: 0,
    rarity: targetRarity,
    baseStats: baseStats,
    stats: { ...baseStats },
    description: pickedTemplate.desc,
    icon: pickedTemplate.icon,
    prefix: rolledPrefix,
    suffix: rolledSuffix,
  };

  rawItem.stats = recalculateEquipmentStats(rawItem, 0);
  return sanitizeEquipmentEnchantSkills(rawItem);
}

// ═══════════════════════════════════════════════════════════════════════
// 🎖️ 명예 상점 클래스별 전용 장비 (희귀 / 에픽 각 1종, 총 12종)
// ═══════════════════════════════════════════════════════════════════════
export interface ClassHonorShopItemDef {
  key: string;
  classId: 'squire' | 'rogue' | 'apprentice' | 'acolyte' | 'vanguard' | 'gunner';
  className: string;
  grade: 'rare' | 'epic';
  name: string;
  baseName: string;
  slot: EquipmentSlot;
  level: number;
  cost: number;
  reqGateLv: number;
  icon: string;
  desc: string;
  description: string;
  baseStats: NonNullable<EquipmentItem['baseStats']>;
  prefix?: EnchantOption;
  suffix?: EnchantOption;
}

export const CLASS_HONOR_SHOP_DEFINITIONS: Record<string, ClassHonorShopItemDef> = {
  // ── 1. 기사 계열 (Squire / Paladin / Guardian / Aegis Valkyrie) ──
  glory_knight_rare: {
    key: 'glory_knight_rare',
    classId: 'squire',
    className: '기사',
    grade: 'rare',
    name: '수호 기사의 결전 방패',
    baseName: '수호 기사의 결전 방패',
    slot: 'armor',
    level: 0,
    cost: 300,
    reqGateLv: 1,
    icon: '🛡️',
    desc: 'DEF+10, HP+42, LUCK+1 [기사 특화] 결전 방패',
    description: '차원 투기장에서 맹활약하는 기사를 위한 결전 방패. 강력한 방어력과 생명력을 제공합니다.',
    baseStats: { def: 10, hp: 42, luck: 1 },
    prefix: {
      id: 'pre_glory_sturdy',
      name: '견고한',
      type: 'prefix',
      rarity: 'rare',
      stats: { def: 6, hp: 28 },
      description: '방어력 +6, HP +28',
    },
  },
  glory_knight_epic: {
    key: 'glory_knight_epic',
    classId: 'squire',
    className: '기사',
    grade: 'epic',
    name: '성기사의 영광 판금갑',
    baseName: '성기사의 영광 판금갑',
    slot: 'armor',
    level: 0,
    cost: 650,
    reqGateLv: 3,
    icon: '🛡️',
    desc: 'DEF+17, HP+84, ATK+4 [기사 특화] 영광 판금갑',
    description: '어떠한 맹공도 버텨내는 기사 계열 전용 판금갑. 최전선에서 파티원을 굳건하게 지켜냅니다.',
    baseStats: { def: 17, hp: 84, atk: 4 },
    prefix: {
      id: 'pre_glory_invincible',
      name: '불패의',
      type: 'prefix',
      rarity: 'epic',
      stats: { def: 13, hp: 70 },
      description: '방어력 +13, HP +70',
    },
    suffix: {
      id: 'suf_glory_protection',
      name: '수호',
      type: 'suffix',
      rarity: 'epic',
      stats: { def: 8, hp: 42, atk: 4 },
      description: '방어력 +8, HP +42, 공격력 +4',
    },
  },

  // ── 2. 도적 계열 (Rogue / Assassin / Duelist / Shadow Phantom) ──
  glory_rogue_rare: {
    key: 'glory_rogue_rare',
    classId: 'rogue',
    className: '도적',
    grade: 'rare',
    name: '그림자 암살자의 비수',
    baseName: '그림자 암살자의 비수',
    slot: 'weapon',
    level: 0,
    cost: 300,
    reqGateLv: 1,
    icon: '🗡️',
    desc: 'ATK+11, SPD+2, LUCK+4 [도적 특화] 기습 단도',
    description: '도적 계열을 위한 예리한 결전 비수. 빠른 행동 속도와 날카로운 치명타율을 부여합니다.',
    baseStats: { atk: 11, spd: 2, luck: 4 },
    prefix: {
      id: 'pre_glory_agile',
      name: '날렵한',
      type: 'prefix',
      rarity: 'rare',
      stats: { atk: 6, spd: 2, luck: 3 },
      description: '공격력 +6, 속도 +2, 행운 +3',
    },
  },
  glory_rogue_epic: {
    key: 'glory_rogue_epic',
    classId: 'rogue',
    className: '도적',
    grade: 'epic',
    name: '사신의 밤안개 비도',
    baseName: '사신의 밤안개 비도',
    slot: 'weapon',
    level: 0,
    cost: 650,
    reqGateLv: 3,
    icon: '🗡️',
    desc: 'ATK+18, SPD+4, LUCK+7 [도적 특화] 사신의 비도',
    description: '암흑 속에서 적의 심장을 겨누는 도적 계열 최고위 비도. 치명적인 암살 일격을 보장합니다.',
    baseStats: { atk: 18, spd: 4, luck: 7 },
    prefix: {
      id: 'pre_glory_shadow',
      name: '암영의',
      type: 'prefix',
      rarity: 'epic',
      stats: { atk: 13, spd: 3, luck: 4 },
      description: '공격력 +13, 속도 +3, 행운 +4',
    },
    suffix: {
      id: 'suf_glory_critical',
      name: '치명',
      type: 'suffix',
      rarity: 'epic',
      stats: { atk: 7, luck: 7 },
      description: '공격력 +7, 행운 +7',
    },
  },

  // ── 3. 마법사 계열 (Apprentice / Elementalist / Arcane Scholar / Calamity Mage) ──
  glory_mage_rare: {
    key: 'glory_mage_rare',
    classId: 'apprentice',
    className: '마법사',
    grade: 'rare',
    name: '원소 학도의 마법봉',
    baseName: '원소 학도의 마법봉',
    slot: 'weapon',
    level: 0,
    cost: 300,
    reqGateLv: 1,
    icon: '🪄',
    desc: 'ATK+10, MP+25, LUCK+2 [마법사 특화] 원소 완드',
    description: '마법사 계열을 위해 가공된 에테르 완드. 마법 공격력과 최대 마나를 균형 있게 상승시킵니다.',
    baseStats: { atk: 10, mp: 25, luck: 2 },
    prefix: {
      id: 'pre_glory_mystic',
      name: '신비로운',
      type: 'prefix',
      rarity: 'rare',
      stats: { atk: 6, mp: 18 },
      description: '공격력 +6, 마나 +18',
    },
  },
  glory_mage_epic: {
    key: 'glory_mage_epic',
    classId: 'apprentice',
    className: '마법사',
    grade: 'epic',
    name: '아크 메이지의 재앙 지팡이',
    baseName: '아크 메이지의 재앙 지팡이',
    slot: 'weapon',
    level: 0,
    cost: 650,
    reqGateLv: 3,
    icon: '🔮',
    desc: 'ATK+18, MP+42, LUCK+4 [마법사 특화] 재앙 지팡이',
    description: '광범위 마법 폭격에 필요한 압도적인 마력을 품은 마법사 계열의 결전 대지팡이.',
    baseStats: { atk: 18, mp: 42, luck: 4 },
    prefix: {
      id: 'pre_glory_ruin',
      name: '파멸의',
      type: 'prefix',
      rarity: 'epic',
      stats: { atk: 14, mp: 35 },
      description: '공격력 +14, 마나 +35',
    },
    suffix: {
      id: 'suf_glory_arcanum',
      name: '마도',
      type: 'suffix',
      rarity: 'epic',
      stats: { atk: 8, mp: 28, luck: 4 },
      description: '공격력 +8, 마나 +28, 행운 +4',
    },
  },

  // ── 4. 사제 계열 (Acolyte / Bishop / War Priest / High Saintess) ──
  glory_priest_rare: {
    key: 'glory_priest_rare',
    classId: 'acolyte',
    className: '사제',
    grade: 'rare',
    name: '성직자의 축복 로브',
    baseName: '성직자의 축복 로브',
    slot: 'armor',
    level: 0,
    cost: 300,
    reqGateLv: 1,
    icon: '🥼',
    desc: 'DEF+8, HP+32, MP+21, LUCK+2 [사제 특화] 축복 로브',
    description: '사제 계열의 숭고한 성의. 높은 생존력과 아군 치유를 위한 지속적인 마나 흐름을 제공합니다.',
    baseStats: { def: 8, hp: 32, mp: 21, luck: 2 },
    prefix: {
      id: 'pre_glory_grace',
      name: '은총의',
      type: 'prefix',
      rarity: 'rare',
      stats: { def: 4, hp: 25, mp: 14 },
      description: '방어력 +4, HP +25, 마나 +14',
    },
  },
  glory_priest_epic: {
    key: 'glory_priest_epic',
    classId: 'acolyte',
    className: '사제',
    grade: 'epic',
    name: '대성녀의 기적 성홀',
    baseName: '대성녀의 기적 성홀',
    slot: 'weapon',
    level: 0,
    cost: 650,
    reqGateLv: 3,
    icon: '✨',
    desc: 'ATK+13, DEF+7, HP+49, MP+35 [사제 특화] 기적 성홀',
    description: '파티원 전체의 생명력을 수호하고 기적의 치유를 베푸는 사제 계열 최고위 성홀.',
    baseStats: { atk: 13, def: 7, hp: 49, mp: 35 },
    prefix: {
      id: 'pre_glory_holy_spirit',
      name: '성령의',
      type: 'prefix',
      rarity: 'epic',
      stats: { atk: 8, def: 6, mp: 28 },
      description: '공격력 +8, 방어력 +6, 마나 +28',
    },
    suffix: {
      id: 'suf_glory_vitality',
      name: '생명',
      type: 'suffix',
      rarity: 'epic',
      stats: { hp: 56, mp: 21 },
      description: 'HP +56, 마나 +21',
    },
  },

  // ── 5. 전사 계열 (Vanguard / Berserker / Warlord / Valhalla Blade) ──
  glory_vanguard_rare: {
    key: 'glory_vanguard_rare',
    classId: 'vanguard',
    className: '전사',
    grade: 'rare',
    name: '용병 검사의 처형도끼',
    baseName: '용병 검사의 처형도끼',
    slot: 'weapon',
    level: 0,
    cost: 300,
    reqGateLv: 1,
    icon: '🪓',
    desc: 'ATK+11, HP+28, LUCK+3 [전사 특화] 처형도끼',
    description: '전열에서 적진을 분쇄하는 전사 계열의 처형도끼. 강력한 타격과 생존 체력을 제공합니다.',
    baseStats: { atk: 11, hp: 28, luck: 3 },
    prefix: {
      id: 'pre_glory_onslaught',
      name: '맹공의',
      type: 'prefix',
      rarity: 'rare',
      stats: { atk: 7, hp: 21 },
      description: '공격력 +7, HP +21',
    },
  },
  glory_vanguard_epic: {
    key: 'glory_vanguard_epic',
    classId: 'vanguard',
    className: '전사',
    grade: 'epic',
    name: '발할라 블레이드의 학살검',
    baseName: '발할라 블레이드의 학살검',
    slot: 'weapon',
    level: 0,
    cost: 650,
    reqGateLv: 3,
    icon: '⚔️',
    desc: 'ATK+20, HP+49, LUCK+6, SPD+2 [전사 특화] 학살검',
    description: '피와 전투에 굶주린 전사 계열 최고위 결전 대검. 전열을 일격에 휩쓰는 광란의 공격력을 뿜어냅니다.',
    baseStats: { atk: 20, hp: 49, luck: 6, spd: 2 },
    prefix: {
      id: 'pre_glory_frenzy',
      name: '광란의',
      type: 'prefix',
      rarity: 'epic',
      stats: { atk: 14, luck: 4 },
      description: '공격력 +14, 행운 +4',
    },
    suffix: {
      id: 'suf_glory_bloodwind',
      name: '혈풍',
      type: 'suffix',
      rarity: 'epic',
      stats: { atk: 7, hp: 49, spd: 2 },
      description: '공격력 +7, HP +49, 속도 +2',
    },
  },

  // ── 6. 마총사 계열 (Gunner / Tactical Gunner / Sharpshooter / Aether Meister) ──
  glory_gunner_rare: {
    key: 'glory_gunner_rare',
    classId: 'gunner',
    className: '마총사',
    grade: 'rare',
    name: '마총사의 전술 리볼버',
    baseName: '마총사의 전술 리볼버',
    slot: 'weapon',
    level: 0,
    cost: 300,
    reqGateLv: 1,
    icon: '🔫',
    desc: 'ATK+8, SPD+2, LUCK+4 [마총사 특화] 전술 리볼버',
    description: '마총사 계열의 전술 기동 사격용 리볼버. 빠른 연사력과 안정적인 치명타를 자랑합니다.',
    baseStats: { atk: 8, spd: 2, luck: 4 },
    prefix: {
      id: 'pre_glory_precision',
      name: '정밀한',
      type: 'prefix',
      rarity: 'rare',
      stats: { atk: 6, spd: 2, luck: 3 },
      description: '공격력 +6, 속도 +2, 행운 +3',
    },
  },
  glory_gunner_epic: {
    key: 'glory_gunner_epic',
    classId: 'gunner',
    className: '마총사',
    grade: 'epic',
    name: '하이퍼 레인저의 레일 버스터',
    baseName: '하이퍼 레인저의 레일 버스터',
    slot: 'weapon',
    level: 0,
    cost: 650,
    reqGateLv: 3,
    icon: '🔫',
    desc: 'ATK+14, SPD+4, LUCK+6, MP+18 [마총사 특화] 레일 버스터',
    description: '고출력 에테르 레일을 형성하여 적의 방어선을 일격에 꿰뚫어버리는 마총사 계열의 결전 중화기.',
    baseStats: { atk: 14, spd: 4, luck: 6, mp: 18 },
    prefix: {
      id: 'pre_glory_orbital',
      name: '궤도의',
      type: 'prefix',
      rarity: 'epic',
      stats: { atk: 13, spd: 3, luck: 4 },
      description: '공격력 +13, 속도 +3, 행운 +4',
    },
    suffix: {
      id: 'suf_glory_piercing',
      name: '관통',
      type: 'suffix',
      rarity: 'epic',
      stats: { atk: 8, mp: 18, luck: 4 },
      description: '공격력 +8, 마나 +18, 행운 +4',
    },
  },
};

export function createClassHonorEquipment(key: string): EquipmentItem | null {
  const def = CLASS_HONOR_SHOP_DEFINITIONS[key];
  if (!def) return null;

  // 접두사(25%)/접미사(20%) 낮은 확률 롤링
  const hasPrefix = def.prefix && Math.random() < 0.25;
  const hasSuffix = def.suffix && Math.random() < 0.20;
  const rolledPrefix = hasPrefix ? def.prefix : undefined;
  const rolledSuffix = hasSuffix ? def.suffix : undefined;

  const prefixPart = rolledPrefix ? `[${rolledPrefix.name}] ` : '';
  const suffixPart = rolledSuffix ? ` [${rolledSuffix.name}]` : '';
  const fullName = `${prefixPart}${def.baseName}${suffixPart}`;

  const item: EquipmentItem = {
    id: `equip_${def.key}_${Date.now()}_${Math.floor(Math.random() * 10000)}`,
    baseName: def.baseName,
    name: fullName,
    slot: def.slot,
    level: 0,
    rarity: def.grade,
    baseStats: { ...def.baseStats },
    stats: { ...def.baseStats },
    description: def.description,
    icon: def.icon,
    prefix: rolledPrefix,
    suffix: rolledSuffix,
  };
  item.stats = recalculateEquipmentStats(item, 0);
  return sanitizeEquipmentEnchantSkills(item);
}

/**
 * 🏭 장비 객체로부터 에셋 스튜디오 오버라이드와 호환되는 templateId('forge_t{tier}_{key}' 또는 'boss_uniq_*')를 찾아내는 헬퍼
 */
export function getEquipmentTemplateId(item?: {
  templateId?: string;
  id?: string;
  tier?: number;
  baseName?: string;
  name?: string;
  slot?: string;
  weaponType?: string;
}): string | undefined {
  if (!item) return undefined;
  if (item.templateId) return item.templateId;
  if (item.id && (item.id.startsWith('boss_uniq_') || item.id.startsWith('forge_t'))) {
    return item.id;
  }
  const searchName = item.baseName || item.name;
  if (searchName) {
    for (const [tierStr, names] of Object.entries(FORGE_TIER_NAMES)) {
      for (const [key, val] of Object.entries(names)) {
        if (key === 'descPrefix') continue;
        if (searchName.includes(val) || val === searchName) {
          return `forge_t${tierStr}_${key}`;
        }
      }
    }
  }
  if (item.tier) {
    const key = item.weaponType || (item.slot === 'armor' ? 'plate_armor' : item.slot === 'accessory' ? 'ring' : 'sword');
    return `forge_t${item.tier}_${key}`;
  }
  return undefined;
}

/** 🌟 장비 아이템의 티어(1~10T) 정밀 판별 헬퍼 */
export function getEquipmentTier(item?: {
  tier?: number;
  templateId?: string;
  id?: string;
  baseName?: string;
  name?: string;
}): number {
  if (!item) return 1;
  if (item.tier && item.tier >= 1 && item.tier <= 10) return item.tier;
  if (item.templateId) {
    const m = item.templateId.match(/forge_t(\d+)_/);
    if (m) return parseInt(m[1], 10);
    const mBoss = item.templateId.match(/boss_uniq_(\d+)_/);
    if (mBoss) return parseInt(mBoss[1], 10);
  }
  if (item.id) {
    const m = item.id.match(/forge_t(\d+)_/);
    if (m) return parseInt(m[1], 10);
    const mBoss = item.id.match(/boss_uniq_(\d+)_/);
    if (mBoss) return parseInt(mBoss[1], 10);
  }
  const searchName = item.baseName || item.name;
  if (searchName) {
    for (const [tStr, names] of Object.entries(FORGE_TIER_NAMES)) {
      for (const [k, val] of Object.entries(names)) {
        if (k === 'descPrefix') continue;
        if (searchName.includes(val) || val === searchName) {
          return parseInt(tStr, 10);
        }
      }
    }
  }
  return 1;
}


