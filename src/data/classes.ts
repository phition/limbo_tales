import { CharacterClass } from '../types/game';

export const CHARACTER_CLASSES: Record<string, CharacterClass> = {
  // ================================================================
  // 1. 견습 기사 (Squire) 계열 - 탱커/방어 수호
  // ================================================================
  'squire': {
    id: 'squire',
    name: '견습 기사',
    tier: 0,
    promotions: ['paladin', 'guardian'],
    role: 'tank',
    baseStats: { hp: 260, mp: 20, atk: 14, def: 14, spd: 8, luck: 10 },
    skills: [
      { id: 'squire_strike', name: '단련된 일격', description: '[전열 특화] 적에게 120% 물리 피해 (전열 공격 시 방어 30% 분쇄)', manaCost: 5, cooldown: 1, targetType: 'single_enemy', power: 1.2, effectType: 'damage', positionBonus: 'front', icon: '⚔️' },
      { id: 'squire_guard', name: '방패 올리기', description: '자신에게 2턴간 30% 피해 흡수 방벽 전개', manaCost: 10, cooldown: 3, targetType: 'self', power: 0.3, effectType: 'shield', positionBonus: 'front', icon: '🛡️' }
    ],
    specialSkill: { id: 'squire_resolute', name: '불굴의 결의', description: '체력을 30% 즉시 회복하고 1턴간 방어 태세를 취합니다.', manaCost: 15, cooldown: 4, targetType: 'self', power: 0.3, effectType: 'heal', icon: '🌟', isSpecial: true },
    passiveDesc: '수호의 맹세: 전열 배치 시 받는 대미지 10% 추가 감소.',
    promptKey: 'hero_squire',
    themeColor: 0x4a90e2
  },
  // 1차 전직 분기 A: 성기사 (Paladin)
  'paladin': {
    id: 'paladin',
    name: '성기사',
    tier: 1,
    parentClassId: 'squire',
    promotions: ['aegis_valkyrie'],
    role: 'tank',
    baseStats: { hp: 520, mp: 55, atk: 28, def: 28, spd: 11, luck: 16 },
    skills: [
      { id: 'paladin_judgment', name: '단죄의 일격', description: '[전열 특화] 적에게 130% 신성 피해 및 방어 분쇄', manaCost: 30, cooldown: 2, targetType: 'single_enemy', power: 1.3, effectType: 'damage', positionBonus: 'front', icon: '🔨' },
      { id: 'paladin_aegis', name: '신성 방벽', description: '아군 전체에 최대 HP의 25% 보호막 부여', manaCost: 50, cooldown: 4, targetType: 'all_allies', power: 0.25, effectType: 'shield', icon: '🛡️' }
    ],
    specialSkill: { id: 'paladin_sanctuary', name: '홀리 오라', description: '아군 전체 체력을 25% 회복시키고 2턴간 디버프 면역을 부여합니다.', manaCost: 70, cooldown: 4, targetType: 'all_allies', power: 0.25, effectType: 'heal', icon: '✨', isSpecial: true },
    passiveDesc: '성스러운 오라: 파티 전체가 받는 마법 피해가 15% 감소합니다.',
    promptKey: 'hero_paladin',
    themeColor: 0xffd54f
  },
  // 1차 전직 분기 B: 중장 보병 (Guardian)
  'guardian': {
    id: 'guardian',
    name: '중장 보병',
    tier: 1,
    parentClassId: 'squire',
    promotions: ['fortress'],
    role: 'tank',
    baseStats: { hp: 600, mp: 35, atk: 24, def: 35, spd: 9, luck: 12 },
    skills: [
      { id: 'guard_shield_slam', name: '방패 강타', description: '[전열 특화] 전열 적 1체에게 110% 피해 및 1턴 기절', manaCost: 24, cooldown: 2, targetType: 'single_enemy', power: 1.1, effectType: 'stun', positionBonus: 'front', icon: '🛡️' },
      { id: 'guard_fortress', name: '철벽의 태세', description: '자신의 방어력을 3턴간 50% 증폭', manaCost: 36, cooldown: 3, targetType: 'self', power: 0.5, effectType: 'buff', positionBonus: 'front', icon: '🏰' }
    ],
    specialSkill: { id: 'guard_unbreakable', name: '절대 방진', description: '적 전체의 공격을 자신에게 집중시키고 1턴간 받는 모든 피해를 70% 경감합니다.', manaCost: 60, cooldown: 4, targetType: 'self', power: 0.7, effectType: 'shield', icon: '⛓️', isSpecial: true },
    passiveDesc: '중장갑 격벽: 물리 공격을 받을 시 30% 확률로 대미지를 완전 무효화.',
    promptKey: 'hero_guardian',
    themeColor: 0x546e7a
  },
  // 2차 전직 A-1: 발키리
  'aegis_valkyrie': {
    id: 'aegis_valkyrie',
    name: '발키리',
    tier: 2,
    parentClassId: 'paladin',
    promotions: ['aegis_bastion'],
    role: 'tank',
    baseStats: { hp: 1040, mp: 120, atk: 56, def: 56, spd: 16, luck: 25 },
    skills: [
      { id: 'valk_spear', name: '심판의 빛창', description: '[전열 특화] 전열 적 1체에게 350% 신성 관통 피해 및 방어력 50% 분쇄', manaCost: 30, cooldown: 2, targetType: 'single_enemy', power: 3.5, effectType: 'damage', positionBonus: 'front', icon: '✨' },
      { id: 'valk_divine_shield', name: '신의 가호', description: '아군 전체에 체력 40% 보호막 및 지속 치유 부여', manaCost: 40, cooldown: 3, targetType: 'all_allies', power: 0.4, effectType: 'shield', icon: '🛡️' }
    ],
    specialSkill: { id: 'valk_ultimate', name: '[궁극기] 영원의 성역', description: '모든 아군에게 최대 HP 80% 무적 결계를 전개하고 모든 디버프를 즉시 정화합니다.', manaCost: 55, cooldown: 5, targetType: 'all_allies', power: 0.8, effectType: 'shield', icon: '👑', isSpecial: true },
    passiveDesc: '불멸의 수호: 자신이 사망 시 파티 전원 체력을 100% 회복시키고 1회 자동 부활.',
    promptKey: 'hero_valkyrie',
    themeColor: 0xffeb3b
  },

  // ================================================================
  // 2. 그림자 수련생 (Rogue) 계열 - 치명 암살 / 은신
  // ================================================================
  'rogue': {
    id: 'rogue',
    name: '그림자 수련생',
    tier: 0,
    promotions: ['assassin', 'duelist'],
    role: 'dealer_phy',
    baseStats: { hp: 180, mp: 30, atk: 18, def: 7, spd: 14, luck: 22 },
    skills: [
      { id: 'rogue_slash', name: '급소 찌르기', description: '[전열/후열 대응] 적에게 140% 대미지 및 출혈 유발', manaCost: 8, cooldown: 1, targetType: 'single_enemy', power: 1.4, effectType: 'damage', positionBonus: 'any', icon: '🗡️' },
      { id: 'rogue_smoke', name: '연막탄', description: '적 전체 명중률 40% 감소, 자신 회피율 증가', manaCost: 12, cooldown: 3, targetType: 'all_enemies', power: 0.4, effectType: 'debuff', icon: '💨' }
    ],
    specialSkill: { id: 'rogue_shadow_dance', name: '암영 난무', description: '[후열 저격] 적 후열 1체에게 200% 확정 치명타 피해를 가합니다.', manaCost: 20, cooldown: 3, targetType: 'single_enemy', power: 2.0, effectType: 'damage', positionBonus: 'back', icon: '⚡', isSpecial: true },
    passiveDesc: '기습 본능: 첫 턴 공격 치명타율 100%.',
    promptKey: 'hero_rogue',
    themeColor: 0x26a69a
  },
  // 1차 전직 분기 A: 암살자 (Assassin)
  'assassin': {
    id: 'assassin',
    name: '암살자',
    tier: 1,
    parentClassId: 'rogue',
    promotions: ['shadow_phantom'],
    role: 'dealer_phy',
    baseStats: { hp: 350, mp: 60, atk: 40, def: 14, spd: 22, luck: 38 },
    skills: [
      { id: 'assassin_strike', name: '암영 연격', description: '[후열 저격] 적의 방어력을 80% 무시하고 150% 관통 피해', manaCost: 36, cooldown: 2, targetType: 'single_enemy', power: 1.5, effectType: 'damage', positionBonus: 'back', icon: '🗡️' },
      { id: 'assassin_poison', name: '독무 연격', description: '적 전체에 80% 대미지 + 3턴간 중독(누적 지속 피해)', manaCost: 44, cooldown: 3, targetType: 'all_enemies', power: 0.8, effectType: 'poison', icon: '☠️' }
    ],
    specialSkill: { id: 'assassin_execution', name: '심장 꿰뚫기', description: '[후열 저격] 후열 적에게 220%의 치명적인 처형 피해를 입힙니다. (체력 50% 이하 시 1.5배 증폭)', manaCost: 56, cooldown: 3, targetType: 'single_enemy', power: 2.2, effectType: 'damage', positionBonus: 'back', icon: '🩸', isSpecial: true },
    passiveDesc: '치명적 본능: 치명타 적중 시 30% 확률(행운 비례)로 대상에게 즉시 추가 공격을 가합니다.',
    promptKey: 'hero_assassin',
    themeColor: 0x00897b
  },
  // 2차 전직 A-1: 그림자 망령 (Shadow Phantom)
  'shadow_phantom': {
    id: 'shadow_phantom',
    name: '그림자 망령',
    tier: 2,
    parentClassId: 'assassin',
    promotions: ['void_strider'],
    role: 'dealer_phy',
    baseStats: { hp: 680, mp: 120, atk: 86, def: 25, spd: 32, luck: 58 },
    skills: [
      { id: 'phantom_teleport', name: '심연의 도약', description: '[후열 저격] 적 후열에 380% 치명타 일격을 가하고 은신', manaCost: 28, cooldown: 3, targetType: 'single_enemy', power: 3.8, effectType: 'damage', positionBonus: 'back', icon: '👤' },
      { id: 'phantom_clone', name: '분신 난무', description: '적 전체에 120% 방어무시 참격 피해', manaCost: 50, cooldown: 3, targetType: 'all_enemies', power: 1.2, effectType: 'damage', icon: '👥' }
    ],
    specialSkill: { id: 'phantom_ultimate', name: '[궁극기] 무간암영참', description: '전장을 시공간 분신으로 가득 채워 적 전체를 6연속 난무(총 200% 광역 피해)합니다.', manaCost: 75, cooldown: 4, targetType: 'all_enemies', power: 2.0, effectType: 'damage', icon: '⚡', isSpecial: true },
    passiveDesc: '사신의 징표: 치명타 피해량이 기본 200%에서 280%로 증폭.',
    promptKey: 'hero_shadow_phantom',
    themeColor: 0x1de9b6
  },

  // 1차 전직 분기 B: 그림자 결투사 (Shadow Duelist)
  'duelist': {
    id: 'duelist',
    name: '그림자 결투사',
    tier: 1,
    parentClassId: 'rogue',
    promotions: ['blade_dancer'],
    role: 'dealer_phy',
    baseStats: { hp: 380, mp: 50, atk: 38, def: 18, spd: 26, luck: 32 },
    skills: [
      { id: 'duel_riposte', name: '환영의 반격', description: '적 1체에 130% 피해 + 2턴간 회피율 60% 증가 및 피격 시 즉시 반격', manaCost: 32, cooldown: 2, targetType: 'single_enemy', power: 1.3, effectType: 'damage', positionBonus: 'front', icon: '⚔️' },
      { id: 'duel_flurry', name: '질풍 4연참', description: '[전열 특화] 적 1체에게 4연속 고속 참격 (총 170% 피해, 치명타율 +40%)', manaCost: 40, cooldown: 1, targetType: 'single_enemy', power: 1.7, effectType: 'damage', positionBonus: 'front', icon: '🗡️' }
    ],
    specialSkill: { id: 'duel_blade_waltz', name: '환영 난무 왈츠', description: '전장을 가르며 적 전체에 130% 참격을 가하고 2턴간 적들의 공격력을 30% 감소시킵니다.', manaCost: 60, cooldown: 3, targetType: 'all_enemies', power: 1.3, effectType: 'damage', icon: '⚡', isSpecial: true },
    passiveDesc: '결투의 호흡: 적의 공격을 회피할 때마다 다음 턴 공격력 35% 증폭 및 마나 10 회복.',
    promptKey: 'hero_rogue',
    themeColor: 0x00bfa5
  },

  // ================================================================
  // 3. 원소 학도 (Apprentice) 계열 - 광역 마법 / 에테르
  // ================================================================
  'apprentice': {
    id: 'apprentice',
    name: '원소 학도',
    tier: 0,
    promotions: ['elementalist', 'arcane_scholar'],
    role: 'dealer_mag',
    baseStats: { hp: 150, mp: 54, atk: 17, def: 5, spd: 10, luck: 15 },
    skills: [
      { id: 'apprentice_bolt', name: '에테르 볼트', description: '적에게 173% 마법 대미지.', manaCost: 16, cooldown: 1, targetType: 'single_enemy', power: 1.73, effectType: 'damage', icon: '✨' },
      { id: 'apprentice_flame', name: '원소 폭발', description: '모든 적에게 81% 화염 광역 피해 및 화상 부여.', manaCost: 36, cooldown: 3, targetType: 'all_enemies', power: 0.81, effectType: 'damage', icon: '🔥' }
    ],
    specialSkill: { id: 'apprentice_mana_burst', name: '에테르 과충전', description: '다음 턴 시전하는 마법의 대미지가 100% 증폭되고 마나를 20 회복합니다.', manaCost: 0, cooldown: 3, targetType: 'self', power: 1.0, effectType: 'buff', icon: '🔮', isSpecial: true },
    passiveDesc: '마력 응축: 매 턴 시작 시 마나 5 자동 회복.',
    promptKey: 'hero_apprentice',
    themeColor: 0xab47bc
  },
  // 1차 전직 분기 A: 대마도사 (Elementalist)
  'elementalist': {
    id: 'elementalist',
    name: '대마도사',
    tier: 1,
    parentClassId: 'apprentice',
    promotions: ['calamity_mage'],
    role: 'dealer_mag',
    baseStats: { hp: 300, mp: 114, atk: 43, def: 10, spd: 14, luck: 24 },
    skills: [
      { id: 'elem_chain_lightning', name: '연쇄 번개', description: '적 전체에 104% 전격 마법 피해 + 60% 기절.', manaCost: 72, cooldown: 3, targetType: 'all_enemies', power: 1.04, effectType: 'damage', icon: '⚡' },
      { id: 'elem_blizzard', name: '혹한의 눈보라', description: '적 전체에 81% 빙결 피해 및 동상/냉각(행동 불가) 부여.', manaCost: 65, cooldown: 3, targetType: 'all_enemies', power: 0.81, effectType: 'debuff', icon: '❄️' }
    ],
    specialSkill: { id: 'elem_supernova', name: '원소 초신성', description: '화염과 냉기를 융합하여 적 전체에 150% 복합 속성 피해 및 화염 지속 피해를 가합니다.', manaCost: 91, cooldown: 4, targetType: 'all_enemies', power: 1.5, effectType: 'damage', icon: '💥', isSpecial: true },
    passiveDesc: '원소 과부하: 3연속 마법 시전 시 다음 마법의 대미지 100% 증폭.',
    promptKey: 'hero_elementalist',
    themeColor: 0xba68c8
  },
  // 2차 전직 A-1: 아크 메이지 (Calamity Mage)
  'calamity_mage': {
    id: 'calamity_mage',
    name: '아크 메이지',
    tier: 2,
    parentClassId: 'elementalist',
    promotions: ['chrono_archon'],
    role: 'dealer_mag',
    baseStats: { hp: 600, mp: 228, atk: 94, def: 20, spd: 20, luck: 38 },
    skills: [
      { id: 'calamity_singularity', name: '공허의 특이점', description: '적 전체를 한 점으로 응축하여 184% 피해 및 1턴 기절(행동 불가).', manaCost: 91, cooldown: 4, targetType: 'all_enemies', power: 1.84, effectType: 'stun', icon: '🌌' },
      { id: 'calamity_arcane_storm', name: '비전 폭풍', description: '적 전체에 173% 지속 비전 대미지.', manaCost: 85, cooldown: 3, targetType: 'all_enemies', power: 1.73, effectType: 'damage', icon: '⚡' }
    ],
    specialSkill: { id: 'calamity_ultimate', name: '[궁극기] 종말의 메테오', description: '전장에 거대 천체 유성을 낙하시켜 적 전체에게 253% 파멸 마법 피해를 입히고 3턴간 화상(지속 피해 및 방어 50% 분쇄)을 부여합니다.', manaCost: 117, cooldown: 5, targetType: 'all_enemies', power: 2.53, effectType: 'damage', statusDuration: 3, icon: '☄️', isSpecial: true },
    passiveDesc: '무한의 마도: 모든 마법 스킬의 마나 소모량이 30% 감소합니다.',
    promptKey: 'hero_calamity_mage',
    themeColor: 0x7c4dff
  },

  // ================================================================
  // 4. 견습 사제 (Acolyte) 계열 - 치유 / 신성 서포트
  // ================================================================
  'acolyte': {
    id: 'acolyte',
    name: '견습 사제',
    tier: 0,
    promotions: ['bishop', 'war_priest'],
    role: 'healer',
    baseStats: { hp: 170, mp: 51, atk: 6, def: 9, spd: 9, luck: 16 },
    skills: [
      { id: 'acolyte_heal', name: '치유의 기도', description: '최저 HP 아군의 체력을 150% 회복.', manaCost: 15, cooldown: 1, targetType: 'single_ally', power: 1.5, effectType: 'heal', icon: '💖' },
      { id: 'acolyte_smite', name: '신성 광휘', description: '적 1체에 115% 신성 피해 및 2턴간 실명 부여.', manaCost: 10, cooldown: 2, targetType: 'single_enemy', power: 1.15, effectType: 'damage', statusDuration: 2, icon: '🌟' }
    ],
    specialSkill: { id: 'acolyte_revive', name: '[궁극기] 소생의 기도', description: '사망 임박(사경) 상태인 아군 1명을 부활시켜 체력 1로 소생시킵니다. (사망/사경 아군 없을 시 최저 체력 아군 115% 치유)', manaCost: 25, cooldown: 3, targetType: 'single_ally', power: 1.15, effectType: 'heal', icon: '🕊️', isSpecial: true },
    passiveDesc: '자애로운 마음: 치료 대상 아군에게 1턴간 방어력 +15% 버프.',
    promptKey: 'hero_acolyte',
    themeColor: 0x42a5f5
  },
  // 2차 전직 A-1: 성령의 구원자 (High Saintess)
  'high_saintess': {
    id: 'high_saintess',
    name: '성령의 구원자',
    tier: 2,
    parentClassId: 'bishop',
    promotions: ['seraphic_inquisitor'],
    role: 'healer',
    baseStats: { hp: 660, mp: 192, atk: 27, def: 32, spd: 18, luck: 42 },
    skills: [
      { id: 'saint_blessing', name: '대성녀의 축복', description: '아군 전체 공격력/방어력을 3턴간 46% 증폭', manaCost: 35, cooldown: 3, targetType: 'all_allies', power: 0.46, effectType: 'buff', icon: '🌈' },
      { id: 'saint_purify', name: '구원의 빛', description: '아군 전체 체력을 288% 회복시키고 모든 해로운 상태이상을 즉시 정화하며 2턴간 디버프 면역을 부여합니다.', manaCost: 45, cooldown: 3, targetType: 'all_allies', power: 2.88, effectType: 'heal', statusDuration: 2, icon: '💖' }
    ],
    specialSkill: { id: 'saint_ultimate', name: '[궁극기] 부활의 성가', description: '사망한 모든 아군을 HP 58%로 부활시키고 생존 아군의 체력을 288% 완전 회복합니다.', manaCost: 80, cooldown: 6, targetType: 'all_allies', power: 2.88, effectType: 'heal', icon: '🕊️', isSpecial: true },
    passiveDesc: '생명의 샘: 아군이 턴을 소모할 때마다 자동으로 대상의 체력 10% 회복.',
    promptKey: 'hero_high_saintess',
    themeColor: 0x29b6f6
  },

  // ================================================================
  // 5. [NEW] 용병 검사 (Vanguard) 계열 - 근접 딜탱 / 광전사
  // ================================================================
  'vanguard': {
    id: 'vanguard',
    name: '용병 검사',
    tier: 0,
    promotions: ['berserker', 'warlord'],
    role: 'berserker',
    baseStats: { hp: 250, mp: 25, atk: 20, def: 10, spd: 11, luck: 14 },
    skills: [
      { id: 'van_cleave', name: '대검 베어가르기', description: '[전열 특화] 적 전열에 130%의 강력한 물리 참격을 가합니다.', manaCost: 8, cooldown: 1, targetType: 'single_enemy', power: 1.3, effectType: 'damage', positionBonus: 'front', icon: '🗡️' },
      { id: 'van_warcry', name: '전사의 함성', description: '자신의 공격력을 2턴간 25% 상승시키고 마나를 10 회복', manaCost: 0, cooldown: 3, targetType: 'self', power: 0.25, effectType: 'buff', positionBonus: 'front', icon: '🗣️' }
    ],
    specialSkill: { id: 'van_frenzy_strike', name: '분노의 일격', description: '[전열 특화] 자신의 현재 체력 10%를 바쳐 적에게 220%의 폭발적인 대미지를 입힙니다.', manaCost: 10, cooldown: 2, targetType: 'single_enemy', power: 2.2, effectType: 'damage', positionBonus: 'front', icon: '🔥', isSpecial: true },
    passiveDesc: '전투 본능: 체력이 50% 이하일 때 공격력 25% 증가.',
    promptKey: 'hero_vanguard',
    themeColor: 0xe65100
  },
  // 1차 전직 분기 A: 광전사 (Berserker)
  'berserker': {
    id: 'berserker',
    name: '광전사',
    tier: 1,
    parentClassId: 'vanguard',
    promotions: ['valhalla_blade'],
    role: 'berserker',
    baseStats: { hp: 500, mp: 50, atk: 44, def: 18, spd: 15, luck: 26 },
    skills: [
      { id: 'ber_blood_rend', name: '혈풍참', description: '[전열 특화] 적 1체에 150% 물리 피해 + 대상에게 3턴간 깊은 출혈(누적 지속 피해)', manaCost: 30, cooldown: 1, targetType: 'single_enemy', power: 1.5, effectType: 'bleed', positionBonus: 'front', icon: '🩸' },
      { id: 'ber_rampage', name: '피의 폭주', description: '2턴간 공격력 45% 증가 및 모든 공격에 흡혈 25% 부여', manaCost: 40, cooldown: 3, targetType: 'self', power: 0.45, effectType: 'buff', positionBonus: 'front', icon: '😈' }
    ],
    specialSkill: { id: 'ber_berserk_crush', name: '광란의 대지분쇄', description: '적 전체에 180% 피해를 입히고 100% 확률로 1턴 기절시킵니다.', manaCost: 65, cooldown: 3, targetType: 'all_enemies', power: 1.8, effectType: 'damage', icon: '🌋', isSpecial: true },
    passiveDesc: '피의 갈증: 적을 처치할 때마다 즉시 공격력 +10% 중첩 (최대 5회).',
    promptKey: 'hero_berserker',
    themeColor: 0xd84315
  },
  // 2차 전직 A-1: 발할라 블레이드 (Valhalla Blade)
  'valhalla_blade': {
    id: 'valhalla_blade',
    name: '발할라 블레이드',
    tier: 2,
    parentClassId: 'berserker',
    promotions: ['valhalla_warlord'],
    role: 'berserker',
    baseStats: { hp: 980, mp: 100, atk: 92, def: 30, spd: 22, luck: 44 },
    skills: [
      { id: 'val_ragnarok_slash', name: '라그나로크 슬래시', description: '[전열 특화] 적 1체에게 방어력을 완전 무시하는 320% 파괴 일격', manaCost: 35, cooldown: 2, targetType: 'single_enemy', power: 3.2, effectType: 'damage', positionBonus: 'front', icon: '⚔️' },
      { id: 'val_immortal_roar', name: '불멸의 포효', description: '3턴간 사망에 이르는 피해를 받아도 체력 1로 생존 및 공격력 100% 강화', manaCost: 40, cooldown: 5, targetType: 'self', power: 1.0, effectType: 'buff', positionBonus: 'front', icon: '👑' }
    ],
    specialSkill: { id: 'val_ultimate', name: '[궁극기] 불멸의 결전분노', description: '자신의 잃은 체력에 비례하여 최대 450%의 행성 파괴급 일격을 적 전체에 퍼붓습니다.', manaCost: 80, cooldown: 5, targetType: 'all_enemies', power: 4.5, effectType: 'damage', icon: '💥', isSpecial: true },
    passiveDesc: '전장의 화신: 치명타 적중 시 파티 전원의 공격력 15% 1턴간 강화.',
    promptKey: 'hero_valhalla_blade',
    themeColor: 0xff3d00
  },

  // 1차 전직 분기 B: 전술 지휘관 (Iron Warlord)
  'warlord': {
    id: 'warlord',
    name: '전술 지휘관',
    tier: 1,
    parentClassId: 'vanguard',
    promotions: ['iron_marshal'],
    role: 'berserker',
    baseStats: { hp: 580, mp: 55, atk: 36, def: 28, spd: 13, luck: 18 },
    skills: [
      { id: 'warlord_rallying_cry', name: '진격의 지휘 함성', description: '아군 전체의 공격력과 치명타율을 3턴간 25% 증폭하고 행동속도를 +3 가속', manaCost: 40, cooldown: 3, targetType: 'all_allies', power: 0.25, effectType: 'buff', icon: '🗣️' },
      { id: 'warlord_shield_crush', name: '파성추 강타', description: '[전열 특화] 적 1체에게 130% 묵직한 타격 + 2턴간 방어력 70% 파쇄 및 도발', manaCost: 36, cooldown: 2, targetType: 'single_enemy', power: 1.3, effectType: 'damage', positionBonus: 'front', icon: '🛡️' }
    ],
    specialSkill: { id: 'warlord_overwhelm', name: '전열 압도', description: '적 전체에 120% 대검 충격파를 가해 2턴간 공격력을 30% 약화시키고 모든 아군에게 최대 HP 25% 보호막을 부여합니다.', manaCost: 65, cooldown: 4, targetType: 'all_enemies', power: 1.2, effectType: 'damage', positionBonus: 'front', icon: '🚩', isSpecial: true },
    passiveDesc: '불패의 통솔: 전열에 배치 시 파티 전체가 받는 모든 피해 12% 상시 경감.',
    promptKey: 'hero_vanguard',
    themeColor: 0xbf360c
  },

  // ================================================================
  // 6. [NEW] 마총 수련생 (Gunner) 계열 - 원거리 관통 / 전술 저격
  // ================================================================
  'gunner': {
    id: 'gunner',
    name: '마총 수련생',
    tier: 0,
    promotions: ['tactical_gunner', 'sharpshooter'],
    role: 'gunner',
    baseStats: { hp: 170, mp: 50, atk: 19, def: 8, spd: 13, luck: 20 },
    skills: [
      { id: 'gun_rapid_fire', name: '에테르 2점사', description: '[후열 저격] 적 1체에 마도 탄환 2연사 (총 140% 관통 대미지)', manaCost: 8, cooldown: 1, targetType: 'single_enemy', power: 1.4, effectType: 'damage', positionBonus: 'back', icon: '🔫' },
      { id: 'gun_flashbang', name: '섬광탄 사격', description: '적 전체에 50% 피해 및 2턴간 적 공격력 30% 감소', manaCost: 25, cooldown: 3, targetType: 'all_enemies', power: 0.5, effectType: 'debuff', icon: '✨' }
    ],
    specialSkill: { id: 'gun_aimed_snipe', name: '정밀 조준사격', description: '[후열 저격] 적의 후열 핵심 적에게 방어력 30%를 관통하고 220%의 약점 저격을 가합니다.', manaCost: 20, cooldown: 2, targetType: 'single_enemy', power: 2.2, effectType: 'damage', positionBonus: 'back', piercePct: 30, icon: '🎯', isSpecial: true },
    passiveDesc: '탄도 계산: 후방 배치 시 원거리 치명타율 +15%.',
    promptKey: 'hero_gunner',
    themeColor: 0x00bcd4
  },
  // 1차 전직 분기 A: 전술 포수 (Tactical Gunner)
  'tactical_gunner': {
    id: 'tactical_gunner',
    name: '전술 포수',
    tier: 1,
    parentClassId: 'gunner',
    promotions: ['aether_gun_meister'],
    role: 'gunner',
    baseStats: { hp: 330, mp: 100, atk: 42, def: 15, spd: 18, luck: 34 },
    skills: [
      { id: 'tac_penetration_shot', name: '레일건 관통포', description: '[후열 관통] 적 일렬을 25% 방어 관통하여 70% 물리 피해', manaCost: 45, cooldown: 3, targetType: 'all_enemies', power: 0.7, effectType: 'damage', positionBonus: 'back', piercePct: 25, icon: '⚡' },
      { id: 'tac_drone_strike', name: '전술 드론 호출', description: '드론이 적 전체에 55% 자동 포격을 가하고 2턴간 화상을 부여합니다.', manaCost: 56, cooldown: 4, targetType: 'all_enemies', power: 0.55, effectType: 'damage', icon: '🛰️' }
    ],
    specialSkill: { id: 'tac_orbital_flare', name: '궤도 조명 폭격', description: '적 전체에 140% 폭발 대미지 및 2턴간 받는 피해 60% 증폭 디버프 부여.', manaCost: 70, cooldown: 4, targetType: 'all_enemies', power: 1.4, effectType: 'debuff', icon: '🚀', isSpecial: true },
    passiveDesc: '약점 분석: 공격 시 40% 확률로 적에게 영구 방어력 -15% 디버프 중첩.',
    promptKey: 'hero_tactical_gunner',
    themeColor: 0x0097a7
  },
  // 1차 전직 분기 B: 심연의 저격수 (Abyssal Sharpshooter)
  'sharpshooter': {
    id: 'sharpshooter',
    name: '심연의 저격수',
    tier: 1,
    parentClassId: 'gunner',
    promotions: ['ghost_sniper'],
    role: 'gunner',
    baseStats: { hp: 290, mp: 90, atk: 52, def: 11, spd: 20, luck: 45 },
    skills: [
      { id: 'sharp_headshot', name: '치명적 헤드샷', description: '[후열 저격] 적 1체의 방어력을 50% 관통하는 180% 단일 저격 (치명타율 +60%)', manaCost: 44, cooldown: 1, targetType: 'single_enemy', power: 1.8, effectType: 'damage', positionBonus: 'back', piercePct: 50, icon: '🎯' },
      { id: 'sharp_camouflage', name: '그림자 위장술', description: '자신에게 2턴간 [은신] 및 다음 턴 공격 대미지 70% 증폭 버프', manaCost: 36, cooldown: 3, targetType: 'self', power: 0.7, effectType: 'buff', positionBonus: 'back', icon: '👤' }
    ],
    specialSkill: { id: 'sharp_abyssal_bullet', name: '심연 관통탄', description: '[후열 저격] 방어막과 적 방어력 50%를 관통하여 단일 적에게 240%의 파멸적인 초극딜을 퍼붓습니다.', manaCost: 80, cooldown: 3, targetType: 'single_enemy', power: 2.4, effectType: 'damage', positionBonus: 'back', piercePct: 50, icon: '💥', isSpecial: true },
    passiveDesc: '스나이퍼 포커스: 체력이 100%일 때 치명타 피해량이 60% 추가 증폭.',
    promptKey: 'hero_gunner',
    themeColor: 0x00838f
  },
  // 2차 최종 전직: 하이퍼 레인저 (Aether Gun Meister)
  'aether_gun_meister': {
    id: 'aether_gun_meister',
    name: '하이퍼 레인저',
    tier: 2,
    parentClassId: 'tactical_gunner',
    promotions: ['omega_deadeye'],
    role: 'gunner',
    baseStats: { hp: 760, mp: 170, atk: 90, def: 28, spd: 28, luck: 52 },
    skills: [
      { id: 'gun_hyper_cannon', name: '하이퍼 펄스 버스터', description: '[후열 관통] 적 전체에 180%의 고압 플라즈마 관통 사격 및 방어력 18% 파쇄', manaCost: 55, cooldown: 3, targetType: 'all_enemies', power: 1.8, effectType: 'damage', positionBonus: 'back', piercePct: 18, icon: '⚡' },
      { id: 'gun_tactical_reload', name: '오버클럭 리로드', description: '자신의 치명타율을 3턴간 50% 증폭하고 아군 전체의 모든 스킬 쿨다운 1턴 단축', manaCost: 25, cooldown: 3, targetType: 'self', power: 0.5, effectType: 'buff', positionBonus: 'back', icon: '🔋' }
    ],
    specialSkill: { id: 'gun_orbital_strike', name: '[궁극기] 궤도 에테르 버스터', description: '방주 인공위성에서 에테르 융합 빔을 유도 폭격하여 적 전체의 방어력을 50% 관통하고 240% 위력으로 타격합니다.', manaCost: 85, cooldown: 5, targetType: 'all_enemies', power: 2.4, effectType: 'damage', piercePct: 50, icon: '🛰️', isSpecial: true },
    passiveDesc: '마도 탄도학 마스터: 치명타 공격 적중 시 방어력을 50% 관통하고 마나 15 자동 충전.',
    promptKey: 'hero_aether_meister',
    themeColor: 0x00e5ff
  },

  // 1차 전직 분기 B: 비전 학자 (Arcane Scholar)
  'arcane_scholar': {
    id: 'arcane_scholar',
    name: '비전 학자',
    tier: 1,
    parentClassId: 'apprentice',
    promotions: ['chronomancer'],
    role: 'dealer_mag',
    baseStats: { hp: 280, mp: 126, atk: 35, def: 14, spd: 12, luck: 20 },
    skills: [
      { id: 'scholar_gravity', name: '중력장 소환', description: '적 전체에 104% 중력 마법 피해 및 2턴간 공격력 30% 감소', manaCost: 78, cooldown: 3, targetType: 'all_enemies', power: 1.04, effectType: 'debuff', icon: '🌀' },
      { id: 'scholar_time_warp', name: '시공 왜곡', description: '아군 전체 쿨다운 1턴 단축, 마나 28 회복 및 공격력 35% 증폭', manaCost: 52, cooldown: 4, targetType: 'all_allies', power: 0.35, effectType: 'buff', icon: '⏳' }
    ],
    specialSkill: { id: 'scholar_arcane_overload', name: '아케인 오버로드', description: '마도 에너지를 폭발시켜 적 전체에 173% 비전 피해 및 모든 버프 해제.', manaCost: 104, cooldown: 4, targetType: 'all_enemies', power: 1.73, effectType: 'damage', icon: '📚', isSpecial: true },
    passiveDesc: '지식의 힘: 마법 시전 시 15% 확률로 마나 소모 없이 시전.',
    promptKey: 'hero_arcane_scholar',
    themeColor: 0x7e57c2
  },

  // ================================================================
  // Acolyte 계열 1차 전직 A: 주교 (Bishop)
  // ================================================================
  'bishop': {
    id: 'bishop',
    name: '주교',
    tier: 1,
    parentClassId: 'acolyte',
    promotions: ['high_saintess'],
    role: 'healer',
    baseStats: { hp: 360, mp: 108, atk: 15, def: 18, spd: 12, luck: 25 },
    skills: [
      { id: 'bishop_holy_wave', name: '성스러운 파동', description: '아군 전체 체력을 184% 회복하고 모든 해로운 상태이상을 즉시 정화하며 1턴간 디버프 면역을 부여합니다.', manaCost: 60, cooldown: 2, targetType: 'all_allies', power: 1.84, effectType: 'heal', statusDuration: 1, icon: '🌊' },
      { id: 'bishop_radiance', name: '성역의 광채', description: '아군 전체 방어력을 3턴간 40% 강화', manaCost: 50, cooldown: 3, targetType: 'all_allies', power: 0.40, effectType: 'buff', icon: '☀️' }
    ],
    specialSkill: { id: 'bishop_holy_assembly', name: '신성 집결', description: '전체 아군을 즉시 HP 46% 회복하고 2턴간 모든 피해를 20% 경감합니다.', manaCost: 90, cooldown: 4, targetType: 'all_allies', power: 0.46, effectType: 'heal', icon: '✝️', isSpecial: true },
    passiveDesc: '축복의 오라: 아군이 스킬 사용 후 체력 5% 자동 회복.',
    promptKey: 'hero_bishop',
    themeColor: 0xfff176
  },

  // Acolyte 계열 1차 전직 B: 전투 사제 (War Priest)
  'war_priest': {
    id: 'war_priest',
    name: '전투 사제',
    tier: 1,
    parentClassId: 'acolyte',
    promotions: ['crusader_lord'],
    role: 'healer',
    baseStats: { hp: 440, mp: 84, atk: 22, def: 22, spd: 13, luck: 22 },
    skills: [
      { id: 'warpriest_smite_crusade', name: '성전 강타', description: '[전열 특화] 적 1체에 161% 신성 물리 복합 피해 및 자신 체력 23% 회복', manaCost: 40, cooldown: 1, targetType: 'single_enemy', power: 1.61, effectType: 'damage', positionBonus: 'front', icon: '⚔️' },
      { id: 'warpriest_sacred_ground', name: '성지 정화 결계', description: '아군 전체의 모든 디버프를 즉시 정화하고 3턴간 매 턴 체력 9% 회복 및 디버프 면역 결계를 전개합니다.', manaCost: 56, cooldown: 4, targetType: 'all_allies', power: 0.09, effectType: 'heal', statusDuration: 3, icon: '🏛️' }
    ],
    specialSkill: { id: 'warpriest_holy_proclamation', name: '성전 선포', description: '2턴간 아군 전체 공격력 46% 상승 및 치명타율 20% 증가. 선포 후 자신은 HP 20% 희생.', manaCost: 70, cooldown: 3, targetType: 'all_allies', power: 0.46, effectType: 'buff', icon: '📜', isSpecial: true },
    passiveDesc: '전투의 신앙: 피해를 받을 때마다 마나 5 회복, 공격 시 5% 확률로 즉시 치유.',
    promptKey: 'hero_war_priest',
    themeColor: 0xff8a65
  },

  // ================================================================
  // 7. [신규 2차 전직] 포트리스 (Fortress) - 중장 보병 2차 전직
  // ================================================================
  'fortress': {
    id: 'fortress',
    name: '포트리스',
    tier: 2,
    parentClassId: 'guardian',
    promotions: ['aegis_bastion'],
    role: 'tank',
    baseStats: { hp: 1250, mp: 80, atk: 40, def: 75, spd: 10, luck: 18 },
    skills: [
      { id: 'fortress_bastion', name: '성벽 전개', description: '자신에게 최대 체력 50%의 난공불락 방벽을 전개하고 2턴간 적들의 모든 공격을 도발', manaCost: 35, cooldown: 3, targetType: 'self', power: 0.5, effectType: 'shield', positionBonus: 'front', icon: '🏰' },
      { id: 'fortress_earthshaker', name: '지진 분쇄타', description: '[전열 특화] 자신의 방어력에 비례하는 280% 물리 충격파로 적 전열을 강타하고 1턴간 기절', manaCost: 40, cooldown: 2, targetType: 'single_enemy', power: 2.8, effectType: 'stun', positionBonus: 'front', icon: '🛡️' }
    ],
    specialSkill: { id: 'fortress_ultimate', name: '[궁극기] 절대 요새의 성역', description: '아군 전체에게 1턴간 피해를 무효화하는 절대 결계를 전개하고, 2턴간 파티 전체가 받는 피해를 50% 경감합니다.', manaCost: 70, cooldown: 5, targetType: 'all_allies', power: 0.5, effectType: 'shield', icon: '🧱', isSpecial: true },
    passiveDesc: '절대 철옹성: 전열 배치 시 받는 모든 물리/마법 피해 30% 상시 경감 및 아군 피격 대미지의 20%를 대신 흡수.',
    promptKey: 'hero_guardian',
    themeColor: 0x78909c
  },

  // ================================================================
  // 8. [신규 2차 전직] 환영의 검성 (Blade Dancer) - 그림자 결투사 2차 전직
  // ================================================================
  'blade_dancer': {
    id: 'blade_dancer',
    name: '환영의 검성',
    tier: 2,
    parentClassId: 'duelist',
    promotions: ['void_strider'],
    role: 'dealer_phy',
    baseStats: { hp: 760, mp: 100, atk: 82, def: 28, spd: 36, luck: 50 },
    skills: [
      { id: 'dancer_thousand_cuts', name: '천영 질풍참', description: '[전열 특화] 적 1체에게 6연속 초고속 환영 참격 (총 320% 피해, 치명타율 +50%)', manaCost: 38, cooldown: 1, targetType: 'single_enemy', power: 3.2, effectType: 'damage', positionBonus: 'front', icon: '⚔️' },
      { id: 'dancer_mirage_dance', name: '신기루 검무', description: '3턴간 회피율 50% 증폭 및 회피 성공 시마다 공격자에게 즉시 140% 환영 반격', manaCost: 35, cooldown: 3, targetType: 'self', power: 1.4, effectType: 'buff', positionBonus: 'front', icon: '💃' }
    ],
    specialSkill: { id: 'dancer_ultimate', name: '[궁극기] 만화경 환영검무', description: '수십 개의 환영 분신으로 적 전체를 180% 연속 난무하고 2턴간 모든 적의 공격력을 40% 약화시킵니다.', manaCost: 75, cooldown: 4, targetType: 'all_enemies', power: 1.8, effectType: 'damage', icon: '⚡', isSpecial: true },
    passiveDesc: '검무의 극의: 회피 성공 시 다음 턴 공격력 40% 즉시 증폭 및 치명타 피해 +50% 상시 적용.',
    promptKey: 'hero_rogue',
    themeColor: 0x26a69a
  },

  // ================================================================
  // 9. [신규 2차 전직] 시공의 조율사 (Chronomancer) - 비전 학자 2차 전직
  // ================================================================
  'chronomancer': {
    id: 'chronomancer',
    name: '시공의 조율사',
    tier: 2,
    parentClassId: 'arcane_scholar',
    promotions: ['chrono_archon'],
    role: 'dealer_mag',
    baseStats: { hp: 560, mp: 260, atk: 86, def: 24, spd: 26, luck: 35 },
    skills: [
      { id: 'chrono_time_stop', name: '시공 정지', description: '적 전체의 시간을 왜곡하여 207% 비전 피해를 입히고 1턴간 완전 행동 불가(시간 정지)', manaCost: 90, cooldown: 4, targetType: 'all_enemies', power: 2.07, effectType: 'stun', icon: '⏳' },
      { id: 'chrono_gravity_collapse', name: '중력 붕괴장', description: '적 전체에 184% 비전 마법 피해를 입히고 3턴간 적 전체의 속도를 -15 감소 및 받는 피해 30% 증폭', manaCost: 80, cooldown: 3, targetType: 'all_enemies', power: 1.84, effectType: 'debuff', icon: '🌀' }
    ],
    specialSkill: { id: 'chrono_ultimate', name: '[궁극기] 시공 역류', description: '시간의 흐름을 되돌려 모든 아군의 체력과 마나를 58% 회복하고 파티 전원의 모든 스킬 쿨다운을 완전 초기화합니다.', manaCost: 30, cooldown: 6, targetType: 'all_allies', power: 0.58, effectType: 'heal', icon: '⌛', isSpecial: true },
    passiveDesc: '차원 조율: 파티 전원의 스킬 쿨다운이 상시 1턴 단축되며, 매 턴 시작 시 마나 15 자동 회복.',
    promptKey: 'hero_arcane_scholar',
    themeColor: 0x9c27b0
  },

  // ================================================================
  // 10. [신규 2차 전직] 성전의 심판관 (Crusader Lord) - 전투 사제 2차 전직
  // ================================================================
  'crusader_lord': {
    id: 'crusader_lord',
    name: '성전의 심판관',
    tier: 2,
    parentClassId: 'war_priest',
    promotions: ['seraphic_inquisitor'],
    role: 'healer',
    baseStats: { hp: 880, mp: 160, atk: 48, def: 42, spd: 18, luck: 34 },
    skills: [
      { id: 'crusader_judgment_hammer', name: '신벌의 심판추', description: '[전열 특화] 적 1체에게 230% 신성 물리 복합 피해를 가하고 입힌 피해의 50%만큼 파티 전체 체력 회복', manaCost: 45, cooldown: 2, targetType: 'single_enemy', power: 2.3, effectType: 'damage', positionBonus: 'front', icon: '🔨' },
      { id: 'crusader_holy_sanctuary_field', name: '성전 결계 전개', description: '아군 전체 체력을 92% 회복시키고 3턴간 공격력/방어력 35% 증폭 및 디버프 면역 부여', manaCost: 55, cooldown: 3, targetType: 'all_allies', power: 0.92, effectType: 'heal', statusDuration: 3, icon: '🏛️' }
    ],
    specialSkill: { id: 'crusader_ultimate', name: '[궁극기] 최후의 성전 선포', description: '거대한 신성 십자가를 강림시켜 적 전체에 207% 신성 피해를 퍼붓고, 사망한 아군을 HP 46%로 부활시킵니다.', manaCost: 85, cooldown: 5, targetType: 'all_enemies', power: 2.07, effectType: 'damage', icon: '⚖️', isSpecial: true },
    passiveDesc: '심판자의 은총: 전열에 배치 시 자신의 공격력과 치유량이 30% 동시 증폭되며, 피격 시 파티 전체 체력 8% 즉시 회복.',
    promptKey: 'hero_war_priest',
    themeColor: 0xffb74d
  },

  // ================================================================
  // 11. [신규 2차 전직] 철혈의 패황 (Iron Marshal) - 전술 지휘관 2차 전직
  // ================================================================
  'iron_marshal': {
    id: 'iron_marshal',
    name: '철혈의 패황',
    tier: 2,
    parentClassId: 'warlord',
    promotions: ['valhalla_warlord'],
    role: 'berserker',
    baseStats: { hp: 1100, mp: 110, atk: 80, def: 52, spd: 18, luck: 32 },
    skills: [
      { id: 'marshal_annihilation_order', name: '총공격 진격령', description: '아군 전체 공격력을 3턴간 45% 증폭하고 파티 전원의 치명타율 +30% 및 행동속도 +5 가속', manaCost: 45, cooldown: 3, targetType: 'all_allies', power: 0.45, effectType: 'buff', icon: '🚩' },
      { id: 'marshal_phalanx_crush', name: '철갑 방진 돌파', description: '[전열 특화] 적 전열에 260% 대검 충격파를 가해 2턴간 방어력 60% 분쇄 및 도발', manaCost: 40, cooldown: 2, targetType: 'single_enemy', power: 2.6, effectType: 'damage', positionBonus: 'front', icon: '🛡️' }
    ],
    specialSkill: { id: 'marshal_ultimate', name: '[궁극기] 군단 총진격', description: '무적의 군세를 지휘하여 적 전체를 260% 위력으로 짓밟고 모든 아군에게 최대 HP 40% 보호막을 부여합니다.', manaCost: 85, cooldown: 5, targetType: 'all_enemies', power: 2.6, effectType: 'damage', icon: '💥', isSpecial: true },
    passiveDesc: '불패의 통솔력: 파티 전체가 받는 모든 피해가 상시 15% 경감되고, 물리 공격력이 20% 추가 증폭.',
    promptKey: 'hero_vanguard',
    themeColor: 0xd84315
  },

  // ================================================================
  // 12. [신규 2차 전직] 사신 저격수 (Ghost Sniper) - 심연의 저격수 2차 전직
  // ================================================================
  'ghost_sniper': {
    id: 'ghost_sniper',
    name: '사신 저격수',
    tier: 2,
    parentClassId: 'sharpshooter',
    promotions: ['omega_deadeye'],
    role: 'gunner',
    baseStats: { hp: 640, mp: 180, atk: 108, def: 22, spd: 32, luck: 65 },
    skills: [
      { id: 'sniper_death_sentence', name: '사형 선고 조준', description: '[후열 저격] 대상의 방어력과 보호막을 100% 무시하고 180% 암흑 관통 피해 (치명타율 +70%)', manaCost: 55, cooldown: 2, targetType: 'single_enemy', power: 1.8, effectType: 'damage', positionBonus: 'back', piercePct: 100, icon: '🎯' },
      { id: 'sniper_shadow_meld', name: '심연 은신술', description: '자신에게 2턴간 [은신] 부여 및 다음 공격 대미지 100% 폭풍 증폭', manaCost: 40, cooldown: 3, targetType: 'self', power: 1.0, effectType: 'buff', positionBonus: 'back', icon: '👤' }
    ],
    specialSkill: { id: 'sniper_ultimate', name: '[궁극기] 종말의 탄환 (갓 킬러)', description: '[후열 저격] 시공간을 가르는 파멸 탄환을 발사하여 방어력을 100% 관통하고 280% 위력으로 공격합니다. (체력 40% 이하 대상 처형)', manaCost: 95, cooldown: 4, targetType: 'single_enemy', power: 2.8, effectType: 'damage', positionBonus: 'back', piercePct: 100, icon: '💥', isSpecial: true },
    passiveDesc: '사신의 조준경: 후열 배치 시 치명타율 +25%, 치명타 대미지가 기본 200%에서 250%로 증폭.',
    promptKey: 'hero_gunner',
    themeColor: 0x00bcd4
  },

  // ================================================================
  // 13. [최종 3차 전직] 이지스 바스티온 (Aegis Bastion) - 수호/방벽 융합
  //     (발키리 + 포트리스의 통합 궁극 형태)
  // ================================================================
  'aegis_bastion': {
    id: 'aegis_bastion',
    name: '이지스 바스티온',
    tier: 3,
    parentClassId: 'aegis_valkyrie',
    role: 'tank',
    baseStats: { hp: 1800, mp: 180, atk: 65, def: 95, spd: 14, luck: 25 },
    skills: [
      { id: 'bastion_divine_providence', name: '신성 수호진', description: '[전열 특화] 아군 전체에 2턴간 방어력 50% 증폭 및 자신에게 최대 체력 35% 보호막 생성', manaCost: 45, cooldown: 3, targetType: 'all_allies', power: 0.35, effectType: 'buff', positionBonus: 'front', icon: '🛡️' },
      { id: 'bastion_sanctuary_smite', name: '성벽 강타', description: '[전열 특화] 전열 적 1체에게 자신의 방어력의 380%에 달하는 신성 물리 충격파를 가하고 1턴간 기절시킵니다.', manaCost: 50, cooldown: 2, targetType: 'single_enemy', power: 3.8, effectType: 'stun', positionBonus: 'front', icon: '🔨' }
    ],
    specialSkill: { id: 'bastion_avalon', name: '[초월오의] 아발론', description: '아군 전체에게 영웅 최대 HP 50%의 보호막을 3턴간 전개하고, 2턴간 모든 피격에 130% 상시 반격 태세에 돌입합니다.', manaCost: 120, cooldown: 5, targetType: 'all_allies', power: 0.5, statusDuration: 3, effectType: 'shield', icon: '👑', isSpecial: true },
    passiveDesc: '만마도서 & 영원의 방벽: 전 마도서 페널티 0% 해금. 피격 및 엄호 시 받은 피해의 50%를 공격자에게 신성 대미지로 반사, 파티 전체가 받는 피해 20% 상시 감쇄(본인은 추가 35% 감쇄), 중열/후열 아군 피격 시 50% 피해를 대신 분담하는 수호 엄호 개입.',
    promptKey: 'hero_valkyrie',
    themeColor: 0xffd700
  },

  // ================================================================
  // 14. [최종 3차 전직] 보이드 스트라이더 (Void Strider) - 암영/환영 융합
  //     (그림자 망령 + 환영의 검성의 통합 궁극 형태)
  // ================================================================
  'void_strider': {
    id: 'void_strider',
    name: '보이드 스트라이더',
    tier: 3,
    parentClassId: 'shadow_phantom',
    role: 'dealer_phy',
    baseStats: { hp: 1100, mp: 180, atk: 125, def: 40, spd: 44, luck: 75 },
    skills: [
      { id: 'void_phantom_flicker', name: '공허 섬광보', description: '[전열/후열 대응] 적 1체에게 350% 치명타 일격을 가하고 2턴간 회피율 40% 증가 및 은신 상태로 진입합니다.', manaCost: 40, cooldown: 2, targetType: 'single_enemy', power: 3.5, effectType: 'damage', positionBonus: 'any', icon: '⚡' },
      { id: 'void_abyssal_dance', name: '심연 환영검무', description: '적 전체를 가로지르며 6연속 환영 난무를 펼쳐 180% 광역 물리 피해를 입히고 적들의 공격력을 30% 감소시킵니다.', manaCost: 55, cooldown: 3, targetType: 'all_enemies', power: 1.8, effectType: 'damage', icon: '👤' }
    ],
    specialSkill: { id: 'void_dimension_slash', name: '[초월오의] 차원참', description: '[전열] 적 전체를 가로지르며 적의 방어력을 100% 무시하는 200% 위력의 차원 베기 + 3턴간 출혈을 부여합니다.', manaCost: 100, cooldown: 5, targetType: 'all_enemies', power: 2.0, effectType: 'damage', positionBonus: 'front', statusDuration: 3, icon: '🌌', isSpecial: true },
    passiveDesc: '만마도서 & 공허의 잔영: 전 마도서 페널티 0% 해금. 적의 공격을 회피할 때마다 다음 공격 턴까지 회피율과 명중률 10% 증폭, 공격력 +20%, MP 15 회복.',
    promptKey: 'hero_shadow_phantom',
    themeColor: 0x00e676
  },

  // ================================================================
  // 15. [최종 3차 전직] 크로노 아콘 (Chrono Archon) - 원소/시공 융합
  //     (아크 메이지 + 시공의 조율사의 통합 궁극 형태)
  // ================================================================
  'chrono_archon': {
    id: 'chrono_archon',
    name: '크로노 아콘',
    tier: 3,
    parentClassId: 'calamity_mage',
    role: 'dealer_mag',
    baseStats: { hp: 950, mp: 380, atk: 135, def: 35, spd: 30, luck: 50 },
    skills: [
      { id: 'chrono_event_horizon', name: '사상의 지평선', description: '공간을 압축하여 적 전체에 220% 비전 마법 피해를 가하고 1턴간 시공 정지(행동 불가)를 부여합니다.', manaCost: 95, cooldown: 3, targetType: 'all_enemies', power: 2.2, effectType: 'stun', icon: '🌀' },
      { id: 'chrono_temporal_flux', name: '시간 가속 왜곡', description: '파티 전원의 모든 스킬 쿨다운을 2턴 단축하고 마나를 40 회복하며 행동속도를 +8 가속시킵니다.', manaCost: 70, cooldown: 4, targetType: 'all_allies', power: 0.4, effectType: 'buff', icon: '⏳' }
    ],
    specialSkill: { id: 'chrono_bigbang', name: '[초월오의] 빅뱅 크로노스', description: '적 전체에 300% 위력의 시공 폭발을 일으키고, 2턴간 화상(지속 피해) 및 2턴 완전 기절(행동 불가)을 부여합니다.', manaCost: 140, cooldown: 5, targetType: 'all_enemies', power: 3.0, effectType: 'damage', statusDuration: 2, icon: '💥', isSpecial: true },
    passiveDesc: '만마도서 & 특이점 가속: 전 마도서 페널티 0% 해금. 모든 스킬 시전 시 50% 확률로 마나 소모 없이 동일 스킬을 즉시 1회 연속 재시전 (더블 캐스트).',
    promptKey: 'hero_calamity_mage',
    themeColor: 0xba68c8
  },

  // ================================================================
  // 16. [최종 3차 전직] 세라픽 인퀴지터 (Seraphic Inquisitor) - 치유/심판 융합
  //     (성령의 구원자 + 성전의 심판관의 통합 궁극 형태)
  // ================================================================
  'seraphic_inquisitor': {
    id: 'seraphic_inquisitor',
    name: '세라픽 인퀴지터',
    tier: 3,
    parentClassId: 'high_saintess',
    role: 'healer',
    baseStats: { hp: 1300, mp: 280, atk: 70, def: 60, spd: 24, luck: 48 },
    skills: [
      { id: 'seraph_divine_wrath', name: '성스러운 단죄', description: '[전열 특화] 적 1체에게 260% 신성 물리/마법 복합 피해를 입히고 가한 피해의 100%만큼 최저 HP 아군을 치유합니다.', manaCost: 45, cooldown: 2, targetType: 'single_enemy', power: 2.6, effectType: 'damage', positionBonus: 'front', icon: '⚖️' },
      { id: 'seraph_grace_sanctuary', name: '세라핌의 가호', description: '아군 전체 체력을 220% 회복시키고 모든 해로운 상태이상을 즉시 정화하며 2턴간 디버프 면역 및 방어력 40% 버프를 부여합니다.', manaCost: 60, cooldown: 3, targetType: 'all_allies', power: 2.2, effectType: 'heal', statusDuration: 2, icon: '🕊️' }
    ],
    specialSkill: { id: 'seraph_grand_judgment', name: '[초월오의] 창공의 대심판', description: '적 전체에 200% 신성 강타를 가하고, 가한 피해량만큼 파티 전원 체력을 회복하며, 사망/사경 상태의 아군을 체력 1로 즉시 부활시킵니다.', manaCost: 130, cooldown: 5, targetType: 'all_enemies', power: 2.0, effectType: 'damage', icon: '☀️', isSpecial: true },
    passiveDesc: '만마도서 & 빛과 징벌의 조화: 전 마도서 페널티 0% 해금. 공격 스킬 적중 시 가한 대미지의 50%만큼 파티 전체 체력 즉시 치유, 아군 치유 스킬 시전 시 회복량의 50%만큼 무작위 적에게 즉시 신성 강타.',
    promptKey: 'hero_high_saintess',
    themeColor: 0xffea00
  },

  // ================================================================
  // 17. [최종 3차 전직] 발할라 워로드 (Valhalla Warlord) - 광전/통솔 융합
  //     (발할라 블레이드 + 철혈의 패황의 통합 궁극 형태)
  // ================================================================
  'valhalla_warlord': {
    id: 'valhalla_warlord',
    name: '발할라 워로드',
    tier: 3,
    parentClassId: 'valhalla_blade',
    role: 'berserker',
    baseStats: { hp: 1650, mp: 170, atk: 128, def: 65, spd: 26, luck: 46 },
    skills: [
      { id: 'warlord_blood_cleave', name: '혈겁의 대검풍', description: '[전열 특화] 전열 적에게 280% 물리 참격을 가하고 2턴간 적의 공격력을 35% 감소시키며 가한 피해의 30%를 흡혈합니다.', manaCost: 40, cooldown: 2, targetType: 'single_enemy', power: 2.8, effectType: 'damage', positionBonus: 'front', icon: '🪓' },
      { id: 'warlord_immortal_vanguard', name: '불멸의 진격', description: '파티 전원의 공격력과 치명타율을 3턴간 50% 증폭하고 자신의 체력이 낮을수록 최대 100%까지 공격력이 추가 증폭됩니다.', manaCost: 50, cooldown: 3, targetType: 'all_allies', power: 0.5, effectType: 'buff', icon: '🚩' }
    ],
    specialSkill: { id: 'warlord_blood_tactics', name: '[초월오의] 피의 전술', description: '적 전체 방어력을 40% 분쇄 (3턴 지속)하고, 2턴간 파티 전원에게 15% 흡혈 버프를 부여합니다.', manaCost: 110, cooldown: 5, targetType: 'all_enemies', power: 2.2, effectType: 'damage', statusDuration: 3, icon: '🩸', isSpecial: true },
    passiveDesc: '만마도서 & 불멸의 발할라: 전 마도서 페널티 0% 해금. 모든 공격 시 가한 피해의 10% 상시 체력 흡혈, 체력이 0이 되어 사경(Death Door)에 빠져도 쓰러지지 않고 행동 가능.',
    promptKey: 'hero_valhalla_blade',
    themeColor: 0xff1744
  },

  // ================================================================
  // 18. [최종 3차 전직] 오메가 데드아이 (Omega Deadeye) - 포격/저격 융합
  //     (하이퍼 레인저 + 사신 저격수의 통합 궁극 형태)
  // ================================================================
  'omega_deadeye': {
    id: 'omega_deadeye',
    name: '오메가 데드아이',
    tier: 3,
    parentClassId: 'ghost_sniper',
    role: 'gunner',
    baseStats: { hp: 1050, mp: 250, atk: 145, def: 38, spd: 38, luck: 80 },
    skills: [
      { id: 'omega_railgun_burst', name: '오메가 펄스포', description: '[후열 관통] 적 전체를 60% 방어 관통하여 200% 고압 플라즈마 피해를 입히고 2턴간 받는 피해 30% 증폭 디버프를 부여합니다.', manaCost: 55, cooldown: 2, targetType: 'all_enemies', power: 2.0, effectType: 'damage', positionBonus: 'back', piercePct: 60, icon: '⚡' },
      { id: 'omega_overclock_stealth', name: '영점 사격 은신', description: '자신에게 2턴간 [은신]을 부여하고 다음 공격 치명타율 100% 확정 및 치명타 피해 80% 추가 증폭 버프를 획득합니다.', manaCost: 40, cooldown: 3, targetType: 'self', power: 0.8, effectType: 'buff', positionBonus: 'back', icon: '👤' }
    ],
    specialSkill: { id: 'omega_orbital_annihilation', name: '[초월오의] 궤도 섬멸', description: '[후열] 단일 적 대상 300% 방어력 100% 무시 정밀 저격 + 적 전체 100% 광역 궤도 폭격을 가합니다.', manaCost: 150, cooldown: 5, targetType: 'single_enemy', power: 3.0, effectType: 'damage', positionBonus: 'back', piercePct: 100, icon: '🛰️', isSpecial: true },
    passiveDesc: '만마도서 & 연쇄 탄도학: 전 마도서 페널티 0% 해금. 상시 방어 관통 +50% 보유, 단일 공격 적중 시 50% 확률로 주변 적 전체에게 50% 위력의 연쇄 궤도 충격파 발생.',
    promptKey: 'hero_aether_meister',
    themeColor: 0x00e5ff
  }
};

// 동의어 및 레거시 클래스 별칭(Alias) 등록
CHARACTER_CLASSES['sniper'] = CHARACTER_CLASSES['sharpshooter'];
CHARACTER_CLASSES['archmage'] = CHARACTER_CLASSES['calamity_mage'];
CHARACTER_CLASSES['archer'] = CHARACTER_CLASSES['sharpshooter'];

// ================================================================
// 클래스별 대표 이모지 매핑 & 헬퍼 함수
// ================================================================
export const CLASS_EMOJI_MAP: Record<string, string> = {
  sniper: '🏹',
  archmage: '☄️',
  archer: '🏹',
  // 기사/수호 계열 (탱커)
  squire: '🛡️',
  paladin: '🔨',
  guardian: '🛡️',
  aegis_valkyrie: '🔱',
  fortress: '🏰',
  crusader_lord: '⚜️',
  aegis_bastion: '🛡️',

  // 도적/암살/결투 계열 (물리 딜러)
  rogue: '🗡️',
  assassin: '🥷',
  shadow_phantom: '👤',
  duelist: '🤺',
  blade_dancer: '💃',
  void_strider: '🗡️',

  // 마법사 계열 (마법 딜러)
  apprentice: '🔮',
  elementalist: '🔥',
  calamity_mage: '☄️',
  arcane_scholar: '📜',
  chronomancer: '⏳',
  chrono_archon: '🌌',

  // 사제/지원 계열 (힐러)
  acolyte: '✨',
  high_saintess: '🕊️',
  bishop: '⛪',
  war_priest: '✝️',
  seraphic_inquisitor: '☀️',

  // 전사/버서커 계열
  vanguard: '🪓',
  berserker: '🩸',
  valhalla_blade: '⚔️',
  warlord: '👑',
  iron_marshal: '🎖️',
  valhalla_warlord: '🩸',

  // 거너/사수 계열 (원거리 딜러)
  gunner: '🔫',
  tactical_gunner: '🎯',
  sharpshooter: '🏹',
  aether_gun_meister: '⚙️',
  ghost_sniper: '👁️',
  omega_deadeye: '🛰️',
};

export function getClassEmoji(classId?: string): string {
  if (!classId) return '⚔️';
  if (CLASS_EMOJI_MAP[classId]) return CLASS_EMOJI_MAP[classId];
  const cls = CHARACTER_CLASSES[classId];
  return cls?.skills[0]?.icon || '⚔️';
}

