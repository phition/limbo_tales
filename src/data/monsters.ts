import { MonsterData } from '../types/game';

export const MONSTERS: Record<string, MonsterData> = {

  // ══════════════════════════════════════════════════════
  //  1층 (1F) — 침묵의 회랑 [가죽 / 짐승 뼈 / 약초 / 일반 접두석]
  // ══════════════════════════════════════════════════════

  // 1-A. 공허의 잠복자
  'monster_stalker': {
    id: 'monster_stalker',
    name: '공허의 잠복자',
    type: 'normal',
    faction: 'beast',
    level: 2,
    maxHp: 59,
    atk: 34,
    def: 8,
    spd: 14,
    luck: 8,
    skills: [
      { name: '그림자 기습',   description: '전열 영웅에게 130% 물리 피해',           power: 1.3, effectType: 'damage' },
      { name: '출혈 발톱',     description: '적 1체에 110% 피해 + 2턴 출혈(ATK 15%)', power: 1.1, effectType: 'bleed',  statusDuration: 2 }
    ],
    rewards: { gold: 40, ether: 2, exp: 30, resources: { leather: 2 } },
    promptKey: 'monster_stalker',
    imagePath: 'assets/monster_stalker.jpg',
    themeColor: 0xef5350,
    description: '공허의 흑무에서 태어난 변이 맹수. 어둠 속에서 불시에 기습합니다.'
  },

  // 1-B. 동굴 흑익박쥐
  'monster_cave_bat': {
    id: 'monster_cave_bat',
    name: '동굴 흑익박쥐',
    type: 'normal',
    faction: 'beast',
    level: 1,
    maxHp: 36,
    atk: 27,
    def: 4,
    spd: 20,
    luck: 7,
    skills: [
      { name: '초음파 강타',   description: '랜덤 대상에 90% 피해 × 2회 연타',        power: 0.9, effectType: 'damage' },
      { name: '혼란의 울음',   description: '대상 파티 전체 공격력 1턴 약화',              power: 0.2, effectType: 'debuff', statusDuration: 1 }
    ],
    rewards: { gold: 25, ether: 1, exp: 20, resources: { wood: 3 } },
    promptKey: 'monster_cave_bat',
    imagePath: 'assets/monster_cave_bat.jpg',
    themeColor: 0x78909c,
    description: '고속으로 날며 음파 충격을 가하는 동굴 군집 몬스터. 속도가 가장 빠르다.'
  },

  // 1-C. 부패 점액체
  'monster_rot_slime': {
    id: 'monster_rot_slime',
    name: '부패 점액체',
    type: 'normal',
    faction: 'beast',
    level: 2,
    maxHp: 85,
    atk: 23,
    def: 13,
    spd: 5,
    luck: 5,
    skills: [
      { name: '독성 분사',     description: '전체 적에게 80% 피해 + 2턴 출혈',       power: 0.8, effectType: 'bleed',  statusDuration: 2 },
      { name: '점성 포획',     description: '단일 대상 1턴 기절',                    power: 0.5, effectType: 'stun',   statusDuration: 1 }
    ],
    rewards: { gold: 35, ether: 2, exp: 27, resources: { herb: 3 } },
    promptKey: 'monster_rot_slime',
    imagePath: 'assets/monster_rot_slime.jpg',
    themeColor: 0x8bc34a,
    description: '부패한 에테르에서 태어난 녹색 점액 괴물. 느리지만 체력이 높고 광역 독을 뿌린다.'
  },

  // 1-D. 저주받은 망자
  'monster_cursed_revenant': {
    id: 'monster_cursed_revenant',
    name: '저주받은 망자',
    type: 'normal',
    faction: 'undead',
    level: 2,
    maxHp: 69,
    atk: 38,
    def: 10,
    spd: 10,
    luck: 7,
    skills: [
      { name: '영혼 흡수',     description: '단일 대상 120% 피해 + 자신 HP 흡수',    power: 1.2, effectType: 'drain' },
      { name: '저주의 포옹',   description: '단일 대상 방어력 2턴 25% 감소',         power: 0.25, effectType: 'debuff', statusDuration: 2 }
    ],
    rewards: { gold: 45, ether: 3, exp: 32, resources: { leather: 2, wood: 2 } },
    promptKey: 'monster_cursed_revenant',
    imagePath: 'assets/monster_cursed_revenant.jpg',
    themeColor: 0xce93d8,
    description: '방주 성채에서 쓰러진 병사의 혼이 공허에 흡수된 언데드. 자신의 HP를 흡수하며 싸운다.'
  },

  // 1-E. 폐허 철제 골렘
  'monster_iron_golem': {
    id: 'monster_iron_golem',
    name: '폐허 철제 골렘',
    type: 'normal',
    faction: 'construct',
    level: 3,
    maxHp: 103,
    atk: 47,
    def: 29,
    spd: 4,
    luck: 6,
    shieldBreakMult: 1.5,
    skills: [
      { name: '철권 강타',     description: '전열 대상에게 180% 물리 피해 (넉백)',          power: 1.8, effectType: 'damage', disruptPosition: 'knockback' },
      { name: '중력 압쇄',     description: '전체 적에게 120% 피해 + 방어력↓ 2턴',   power: 1.2, effectType: 'debuff', statusDuration: 2 }
    ],
    rewards: { gold: 55, ether: 2, exp: 42, resources: { wood: 4, leather: 2 } },
    promptKey: 'monster_iron_golem',
    imagePath: 'assets/monster_iron_golem.jpg',
    themeColor: 0x90a4ae,
    description: '고대 연금술로 만들어진 철제 자동 병기의 잔해. 방어력이 매우 높고 둔중한 강타로 전열을 부순다.'
  },

  // 1-F. 그림자 악귀
  'monster_shadow_imp': {
    id: 'monster_shadow_imp',
    name: '그림자 악귀',
    type: 'normal',
    faction: 'corrupted',
    level: 2,
    maxHp: 49,
    atk: 30,
    def: 6,
    spd: 16,
    luck: 8,
    skills: [
      { name: '암흑 할퀴기',   description: '단일 대상 100% 피해 + 1턴 기절',        power: 1.0, effectType: 'stun',   statusDuration: 1 },
      { name: '군집 난무',     description: '랜덤 2대상에 각 90% 피해',              power: 0.9, effectType: 'damage' }
    ],
    rewards: { gold: 32, ether: 2, exp: 25, resources: { herb: 2 } },
    promptKey: 'monster_shadow_imp',
    imagePath: 'assets/monster_shadow_imp.jpg',
    themeColor: 0x5c6bc0,
    description: '공허에서 분열한 소형 악령. 기절 효과로 아군의 턴을 빼앗는다.'
  },

  // ══════════════════════════════════════════════════════
  //  2층 (2F) — 망령의 납골당 [실크 / 석탄 / 철광석 / 일반 접미석]
  // ══════════════════════════════════════════════════════

  // 2-A. 납골당 묘지 밴시
  'monster_tomb_banshee': {
    id: 'monster_tomb_banshee',
    name: '납골당 묘지 밴시',
    type: 'normal',
    faction: 'undead',
    level: 4,
    maxHp: 88,
    atk: 44,
    def: 16,
    spd: 14,
    luck: 10,
    drainPct: 0.20,
    skills: [
      { name: '비탄의 절규',   description: '대상 파티 전체에 110% 마법 피해 + MP 15 흡수 [차징]', power: 1.1, effectType: 'drain', drainPct: 0.35, isCharge: true, breakGauge: 120 },
      { name: '영혼 침식',     description: '단일 대상 140% 피해 + 속도 25% 감속 2턴', power: 1.4, effectType: 'debuff', statusDuration: 2 }
    ],
    rewards: { gold: 75, ether: 5, exp: 65, resources: { silk: 3 } },
    promptKey: 'monster_tomb_banshee',
    imagePath: 'assets/monster_tomb_banshee.jpg',
    themeColor: 0x80deea,
    description: '납골당의 묘비를 떠도는 원혼. 차가운 비탄의 절규로 대상 파티의 마나를 메마르게 한다.'
  },

  // 2-B. 살점을 뜯는 구울
  'monster_crypt_ghoul': {
    id: 'monster_crypt_ghoul',
    name: '살점을 뜯는 구울',
    type: 'normal',
    faction: 'undead',
    level: 4,
    maxHp: 116,
    atk: 47,
    def: 21,
    spd: 11,
    luck: 8,
    drainPct: 0.25,
    skills: [
      { name: '썩은 송곳니',   description: '단일 대상 150% 피해 + 2턴 출혈', power: 1.5, effectType: 'bleed', statusDuration: 2, drainPct: 0.30 },
      { name: '시체 섭취',     description: '자신의 체력을 30% 즉시 재생', power: 0.3, effectType: 'heal' }
    ],
    rewards: { gold: 80, ether: 4, exp: 70, resources: { coal: 3, iron: 2 } },
    promptKey: 'monster_crypt_ghoul',
    imagePath: 'assets/monster_crypt_ghoul.jpg',
    themeColor: 0x8d6e63,
    description: '어둠 속에서 시체를 파먹고 자란 흉폭한 구울. 강력한 턱과 출혈 공격을 가한다.'
  },

  // ══════════════════════════════════════════════════════
  //  3층 (3F) — 에테르 광맥 [마력 수정 / 석재 / 철광석 / 순수 접두석]
  // ══════════════════════════════════════════════════════

  // 3-A. 마도 수정 전갈
  'monster_crystal_scorpion': {
    id: 'monster_crystal_scorpion',
    name: '마도 수정 전갈',
    type: 'normal',
    faction: 'beast',
    level: 6,
    maxHp: 254, // 🌟 [+30% 상향]
    atk: 68,    // 🌟 [+30% 상향]
    def: 44,    // 🌟 [+30% 상향]
    spd: 10,
    luck: 10,
    skills: [
      { name: '비전 침 찌르기', description: '단일 대상 160% 마법 관통 피해 + 1턴 기절', power: 1.6, effectType: 'stun', statusDuration: 1 },
      { name: '수정 외골격',   description: '자신의 방어력을 2턴간 40% 강화', power: 0.4, effectType: 'buff', statusDuration: 2 }
    ],
    rewards: { gold: 120, ether: 8, exp: 110, resources: { crystal: 3, stone: 8 } },
    promptKey: 'monster_crystal_scorpion',
    imagePath: 'assets/monster_crystal_scorpion.jpg',
    themeColor: 0x26c6da,
    description: '광맥의 고농도 에테르가 응축된 푸른 수정 외피를 지닌 전갈. 강력한 독침으로 적을 마비시킨다.'
  },

  // 3-B. 마력 침식 가고일
  'monster_mana_gargoyle': {
    id: 'monster_mana_gargoyle',
    name: '마력 침식 가고일',
    type: 'normal',
    faction: 'construct',
    level: 6,
    maxHp: 228, // 🌟 [+30% 상향]
    atk: 74,    // 🌟 [+30% 상향]
    def: 34,    // 🌟 [+30% 상향]
    spd: 16,
    luck: 12,
    skills: [
      { name: '에테르 파동포', description: '전열 전체 150% 마법 피해', power: 1.5, effectType: 'damage' },
      { name: '비전 급강하',   description: '후열 단일 대상 190% 치명 기습', power: 1.9, effectType: 'damage' }
    ],
    rewards: { gold: 130, ether: 9, exp: 120, resources: { crystal: 2, iron: 6 } },
    promptKey: 'monster_mana_gargoyle',
    imagePath: 'assets/monster_mana_gargoyle.jpg',
    themeColor: 0x4dd0e1,
    description: '석재 조각상에 에테르 마력이 스며들어 깨어난 비행 가고일. 고속으로 급강하하여 후열을 노린다.'
  },

  // ══════════════════════════════════════════════════════
  //  4층 (4F) — 심연의 균열 [공허 파편 / 마력 수정 / 암흑 정수 / 순수 접미석]
  // ══════════════════════════════════════════════════════

  // 4-A. 균열의 차원 추적자
  'monster_rift_stalker': {
    id: 'monster_rift_stalker',
    name: '균열의 차원 추적자',
    type: 'normal',
    faction: 'beast',
    level: 8,
    maxHp: 227, // 🌟 [-30% 밸런스 조정]
    atk: 64,    // 🌟 [-30% 밸런스 조정]
    def: 22,    // 🌟 [-30% 밸런스 조정]
    spd: 38,
    luck: 14,
    skills: [
      { name: '차원 도약 습격', description: '적 1체에 방어력 30% 무시 220% 암습', power: 2.2, effectType: 'damage' },
      { name: '공간 왜곡',     description: '자신에게 2턴간 30% 회피율 및 치명타율 버프', power: 0.3, effectType: 'buff', statusDuration: 2 }
    ],
    rewards: { gold: 180, ether: 14, exp: 170, resources: { void_shard: 4, crystal: 2 } },
    promptKey: 'monster_rift_stalker',
    imagePath: 'assets/monster_rift_stalker.jpg',
    themeColor: 0xba68c8,
    description: '시공간의 틈새를 자유자재로 넘나드는 차원 포식자. 방어력을 관통하는 기습 일격을 가한다.'
  },

  // 4-B. 공허의 하수인 촉수괴수
  'monster_void_beast': {
    id: 'monster_void_beast',
    name: '공허의 하수인 촉수괴수',
    type: 'normal',
    faction: 'beast',
    level: 8,
    maxHp: 302, // 🌟 [-30% 밸런스 조정]
    atk: 59,    // 🌟 [-30% 밸런스 조정]
    def: 29,    // 🌟 [-30% 밸런스 조정]
    spd: 18,
    luck: 12,
    skills: [
      { name: '심연의 촉수 난타', description: '전체 적에게 130% 물리 피해 + 2턴 출혈', power: 1.3, effectType: 'bleed', statusDuration: 2 },
      { name: '흑무 흡수',       description: '자신의 체력을 25% 회복하고 방어력 20% 증가', power: 0.25, effectType: 'heal' }
    ],
    rewards: { gold: 200, ether: 16, exp: 185, resources: { void_shard: 5, silk: 3 } },
    promptKey: 'monster_void_beast',
    imagePath: 'assets/monster_void_beast.jpg',
    themeColor: 0x7e57c2,
    description: '심연의 어둠 속에서 꿈틀거리는 다수의 촉수를 지닌 거대 마물. 광역 출혈과 자가 재생을 구사한다.'
  },

  // ══════════════════════════════════════════════════════
  //  5층 (5F) — 원초의 제단 [공허 파편 / 마력 수정 / 순수 접두석 / 순수 접미석]
  // ══════════════════════════════════════════════════════

  // 5-A. 종언의 제단 광신도
  'monster_altar_cultist': {
    id: 'monster_altar_cultist',
    name: '종언의 제단 광신도',
    type: 'normal',
    faction: 'corrupted',
    level: 10,
    maxHp: 326, // 🌟 [-30% 밸런스 조정]
    atk: 79,    // 🌟 [-30% 밸런스 조정]
    def: 31,    // 🌟 [-30% 밸런스 조정]
    spd: 45,
    luck: 48,
    skills: [
      { name: '묵시록의 흑염', description: '전체 적에게 180% 강력한 흑마법 피해', power: 1.8, effectType: 'damage' },
      { name: '암흑 제물 공양', description: '적 단일 MP 30 강탈 + 자신 공격력 30% 증폭 2턴', power: 1.3, effectType: 'drain' }
    ],
    rewards: { gold: 250, ether: 22, exp: 240, resources: { crystal: 4, void_shard: 4 } },
    promptKey: 'monster_altar_cultist',
    imagePath: 'assets/monster_altar_cultist.jpg',
    themeColor: 0xe91e63,
    description: '공허의 침식자를 숭배하며 제단을 수호하는 타락한 사제. 파괴적인 흑염 마법을 퍼붓는다.'
  },

  // 5-B. 모노리스의 파멸 수호자
  'monster_monolith_guardian': {
    id: 'monster_monolith_guardian',
    name: '모노리스의 파멸 수호자',
    type: 'normal',
    faction: 'construct',
    level: 11,
    maxHp: 462, // 🌟 [-30% 밸런스 조정]
    atk: 82,    // 🌟 [-30% 밸런스 조정]
    def: 44,    // 🌟 [-30% 밸런스 조정]
    spd: 24,
    luck: 21,
    skills: [
      { name: '파멸의 모노리스 강타', description: '전열 대상에게 240% 피해 + 1턴 기절', power: 2.4, effectType: 'stun', statusDuration: 1 },
      { name: '절대 성벽 방진',       description: '자신에게 최대 체력의 35% 보호막 전개 2턴', power: 0.35, effectType: 'shield', statusDuration: 2 }
    ],
    rewards: { gold: 300, ether: 25, exp: 280, resources: { void_shard: 6, crystal: 5 } },
    promptKey: 'monster_monolith_guardian',
    imagePath: 'assets/monster_monolith_guardian.jpg',
    themeColor: 0xff7043,
    description: '고대 모노리스의 파편으로 기동하는 거대한 골렘. 철벽의 방패와 무거운 석퇴로 침입자를 짓밟는다.'
  },

  // ══════════════════════════════════════════════════════
  //  중간 정예 (Elite)
  // ══════════════════════════════════════════════════════
  'monster_dread_knight': {
    id: 'monster_dread_knight',
    name: '심연의 망령 기사',
    type: 'elite',
    faction: 'undead',
    level: 5,
    maxHp: 204,
    atk: 55,
    def: 26,
    spd: 9,
    luck: 30,
    skills: [
      { name: '암흑의 일도양단', description: '전열·중앙 동시 관통 160% 피해',       power: 1.6, effectType: 'damage' },
      { name: '망령의 방벽',    description: '2턴간 자신 피해 40% 감소 보호막',       power: 0.4, effectType: 'shield', statusDuration: 2 },
      { name: '공포의 사자후',  description: '대상 파티 전체 공격력 2턴 20% 감소',         power: 0.2, effectType: 'debuff', statusDuration: 2 }
    ],
    rewards: { gold: 280, ether: 15, exp: 200, resources: { iron: 8, crystal: 3, pure_prefix_stone: 1, pure_suffix_stone: 1 } },
    promptKey: 'monster_dread_knight',
    imagePath: 'assets/monster_dread_knight.jpg',
    themeColor: 0xab47bc,
    description: '과거 방주를 수호하다 타락한 영겁의 기사. 단단한 방벽과 저주받은 대검을 휘두른다.'
  },

  // ══════════════════════════════════════════════════════
  //  👑 1F ~ 5F 각 층별 고유 보스 (Unique Floor Bosses)
  // ══════════════════════════════════════════════════════

  // 1F 고유 보스: 침묵의 흑핵 거신
  'boss_floor_1': {
    id: 'boss_floor_1',
    name: '침묵의 흑핵 거신',
    type: 'boss',
    faction: 'construct',
    level: 4,
    maxHp: 320,
    atk: 49,
    def: 29,
    spd: 8,
    luck: 25,
    skills: [
      { name: '침묵의 대지 분쇄', description: '전체 140% 물리 피해 + 공격력 20% 감소 2턴', power: 1.4, effectType: 'debuff', statusDuration: 2 },
      { name: '동결의 흑핵 방출', description: '단일 대상 180% 서리 대미지 + 1턴 기절',     power: 1.8, effectType: 'stun',   statusDuration: 1 },
      { name: '고대 석벽 결계',   description: '자신에게 2턴간 받는 피해 35% 감소 방벽',     power: 0.35, effectType: 'shield', statusDuration: 2 }
    ],
    rewards: {
      gold: 350, ether: 20, exp: 250,
      resources: { leather: 8, wood: 10, herb: 8, prefix_stone: 3 },
      dropSkillBookId: 'book_boss_colossus_core'
    },
    promptKey: 'boss_floor_1',
    imagePath: 'assets/boss_floor_1.jpg',
    themeColor: 0x5c6bc0,
    description: '침묵의 회랑 심부에 잠들어 있던 고대 석조 거신. 가슴의 흑핵에서 뿜어져 나오는 한기로 침입자를 얼어붙게 한다.'
  },

  // 2F 고유 보스: 망령 군주 데스나이트
  'boss_floor_2': {
    id: 'boss_floor_2',
    name: '망령 군주 데스나이트',
    type: 'boss',
    faction: 'undead',
    level: 6,
    maxHp: 368,
    atk: 60,
    def: 32,
    spd: 12,
    luck: 30,
    skills: [
      { name: '망령의 영혼 처형', description: '단일 대상 220% 암흑 참격 + 피해량 20% 흡혈', power: 2.2, effectType: 'drain' },
      { name: '원혼의 파멸 오라', description: '전체 적에게 150% 마법 피해 + 2턴 출혈',      power: 1.5, effectType: 'bleed', statusDuration: 2 },
      { name: '영겁의 불굴 방벽', description: '2턴간 모든 피해 40% 흡수 보호막 전개',       power: 0.4, effectType: 'shield', statusDuration: 2 }
    ],
    rewards: {
      gold: 550, ether: 30, exp: 400,
      resources: { silk: 8, coal: 6, iron: 8, suffix_stone: 3 },
      dropSkillBookId: 'book_boss_deathknight_reap'
    },
    promptKey: 'boss_floor_2',
    imagePath: 'assets/boss_floor_2.jpg',
    themeColor: 0x78909c,
    description: '납골당의 무수한 원혼을 통솔하는 망령들의 군주. 영혼을 베어넘기는 저주받은 대검을 휘두른다.'
  },

  // 3F 고유 보스: 태고의 광맥 베히모스
  'boss_floor_3': {
    id: 'boss_floor_3',
    name: '태고의 광맥 베히모스',
    type: 'boss',
    faction: 'beast',
    level: 8,
    maxHp: 806, // 🌟 [+30% 상향]
    atk: 91,    // 🌟 [+30% 상향]
    def: 47,    // 🌟 [+30% 상향]
    spd: 11,
    luck: 36,
    skills: [
      { name: '광맥의 에테르 폭발', description: '전체 180% 고열 화염 마법 피해', power: 1.8, effectType: 'damage' },
      { name: '마도 결정 쇄도',     description: '적 전열·중앙에 200% 관통 피해', power: 2.0, effectType: 'damage' },
      { name: '대지의 고동',       description: '체력 25% 즉시 회복 및 방어력 30% 증폭', power: 0.25, effectType: 'heal' }
    ],
    rewards: {
      gold: 800, ether: 45, exp: 580,
      resources: { crystal: 8, stone: 15, iron: 12, pure_prefix_stone: 2 },
      dropSkillBookId: 'book_boss_behemoth_eruption'
    },
    promptKey: 'boss_floor_3',
    imagePath: 'assets/boss_floor_3.jpg',
    themeColor: 0x00bcd4,
    description: '에테르 광맥 깊은 곳에서 결정을 먹고 자란 태고의 마도 생명체. 폭발적인 광맥 에너지를 방출한다.'
  },

  // 4F 고유 보스: 심연의 시공 왜곡자
  'boss_floor_4': {
    id: 'boss_floor_4',
    name: '심연의 시공 왜곡자',
    type: 'boss',
    faction: 'corrupted',
    level: 10,
    maxHp: 709, // 🌟 [-30% 밸런스 조정]
    atk: 74,    // 🌟 [-30% 밸런스 조정]
    def: 34,    // 🌟 [-30% 밸런스 조정]
    spd: 17,
    luck: 42,
    skills: [
      { name: '시공간 균열 붕괴', description: '전체 210% 비전 마법 피해 + 아군 속도 30% 감속 2턴', power: 2.1, effectType: 'debuff', statusDuration: 2 },
      { name: '차원 닻 강타',     description: '단일 대상 방어 무시 280% 치명타 일격',               power: 2.8, effectType: 'damage' },
      { name: '시공 역행 결계',   description: '2턴간 받는 피해 50% 반사 및 체력 회복',              power: 0.5, effectType: 'shield', statusDuration: 2 }
    ],
    rewards: {
      gold: 1100, ether: 60, exp: 750,
      resources: { void_shard: 10, crystal: 6, silk: 8, pure_suffix_stone: 2 },
      dropSkillBookId: 'book_boss_chrono_warp'
    },
    promptKey: 'boss_floor_4',
    imagePath: 'assets/boss_floor_4.jpg',
    themeColor: 0xab47bc,
    description: '심연의 균열을 조작하여 시공간을 뒤틀어버리는 고대 차원 마도사. 시간의 흐름을 왜곡하여 공격을 무력화한다.'
  },

  // 5F 고유 보스: 공허의 침식자
  'boss_floor_5': {
    id: 'boss_floor_5',
    name: '공허의 침식자',
    type: 'boss',
    faction: 'corrupted',
    level: 12,
    maxHp: 932, // 🌟 [-30% 밸런스 조정]
    atk: 88,    // 🌟 [-30% 밸런스 조정]
    def: 41,    // 🌟 [-30% 밸런스 조정]
    spd: 28,
    luck: 48,
    skills: [
      { name: '파멸의 공허 폭풍',  description: '전체 240% 마법 피해',                power: 2.4, effectType: 'damage' },
      { name: '시공간 붕괴격',     description: '단일 대상 방어 무시 280% 치명 일격',  power: 2.8, effectType: 'damage' },
      { name: '흑무의 잠식',       description: '전체 MP 25 흡수 + 자신 HP 대량 회복', power: 1.2, effectType: 'drain'  },
      { name: '심연의 저주',       description: '전체 출혈 3턴 부여',                 power: 0.8, effectType: 'bleed',  statusDuration: 3 }
    ],
    rewards: {
      gold: 1500, ether: 80, exp: 1000,
      resources: { crystal: 8, void_shard: 12, pure_prefix_stone: 2, pure_suffix_stone: 2 },
      dropSkillBookId: 'book_boss_void_cataclysm',
      dropEquipment: {
        id: 'equip_legendary_ring',
        baseName: '반지',
        name: '반지',
        slot: 'accessory',
        level: 7,
        rarity: 'legendary',
        stats: { mp: 68, spd: 13, atk: 12, luck: 10 },
        description: '공허의 침식자를 쓰러뜨리고 회수한 고대 보물.',
        icon: '💍'
      }
    },
    promptKey: 'monster_void_overlord',
    imagePath: 'assets/void_overlord.jpg',
    themeColor: 0xff416c,
    description: 'Chapter 1 심연의 근원. HP 40% 이하 시 광폭화, 출혈·흡수 등 복합 상태이상을 동시에 부여한다.'
  },

  // 하위 호환용 alias
  'monster_void_overlord': {
    id: 'monster_void_overlord',
    name: '공허의 침식자',
    type: 'boss',
    faction: 'corrupted',
    level: 12,
    maxHp: 932, // 🌟 [-30% 밸런스 조정]
    atk: 88,    // 🌟 [-30% 밸런스 조정]
    def: 41,    // 🌟 [-30% 밸런스 조정]
    spd: 28,
    luck: 48,
    skills: [
      { name: '파멸의 공허 폭풍',  description: '전체 240% 마법 피해',                power: 2.4, effectType: 'damage' },
      { name: '시공간 붕괴격',     description: '단일 대상 방어 무시 280% 치명 일격',  power: 2.8, effectType: 'damage' },
      { name: '흑무의 잠식',       description: '전체 MP 25 흡수 + 자신 HP 대량 회복', power: 1.2, effectType: 'drain'  },
      { name: '심연의 저주',       description: '전체 출혈 3턴 부여',                 power: 0.8, effectType: 'bleed',  statusDuration: 3 }
    ],
    rewards: {
      gold: 1500, ether: 80, exp: 1000,
      resources: { crystal: 8, void_shard: 12, pure_prefix_stone: 2, pure_suffix_stone: 2 },
      dropSkillBookId: 'book_boss_void_cataclysm',
      dropEquipment: {
        id: 'equip_legendary_ring',
        baseName: '반지',
        name: '반지',
        slot: 'accessory',
        level: 7,
        rarity: 'legendary',
        stats: { mp: 68, spd: 13, atk: 12, luck: 10 },
        description: '공허의 침식자를 쓰러뜨리고 회수한 고대 보물.',
        icon: '💍'
      }
    },
    promptKey: 'monster_void_overlord',
    imagePath: 'assets/void_overlord.jpg',
    themeColor: 0xff416c,
    description: 'Chapter 1 심연의 근원. HP 40% 이하 시 광폭화, 출혈·흡수 등 복합 상태이상을 동시에 부여한다.'
  },

  // ─── Chapter 2: 태초의 공허, 그리고 균열의 심장 (6F ~ 10F) ───
  'monster_blood_wolf': {
    id: 'monster_blood_wolf',
    name: '핏빛 늑대',
    type: 'normal',
    faction: 'beast',
    level: 13,
    maxHp: 450,
    atk: 105,
    def: 40,
    spd: 66,
    luck: 54,
    drainPct: 0.30,
    skills: [
      { name: '물어뜯기', description: '단일 120% 피해 (흡혈 30%)', power: 1.2, effectType: 'drain', drainPct: 0.30 },
      { name: '광기의 울부짖음', description: '전체 공격력 증가', power: 0.3, effectType: 'buff_atk', statusDuration: 2 }
    ],
    themeColor: 0xef5350,
    description: '핏빛 성역을 배회하는 흉포한 마수. 피 냄새를 맡으면 무리를 이끌고 광포화합니다.',
    promptKey: 'monster_blood_wolf',
    imagePath: 'assets/monster_blood_wolf_v2.jpg',
    rewards: { exp: 60, gold: 80, ether: 6 }
  },
  'monster_fallen_priest': {
    id: 'monster_fallen_priest',
    name: '타락한 사제',
    type: 'normal',
    faction: 'corrupted',
    level: 14,
    maxHp: 380,
    atk: 115,
    def: 35,
    spd: 48,
    luck: 51,
    piercePct: 0.25,
    skills: [
      { name: '검은 권능', description: '전체 80% 피해 (방어 관통 25%)', power: 0.8, effectType: 'damage', piercePct: 0.25 },
      { name: '피의 의식', description: '가장 체력이 낮은 아군 치유 (최대 체력의 28% 회복)', power: 0.28, effectType: 'heal' }
    ],
    themeColor: 0x7e57c2,
    description: '심연의 어둠에 영혼을 바친 타락한 성직자. 어둠의 권능과 사악한 치유 의식을 행합니다.',
    promptKey: 'monster_fallen_priest',
    imagePath: 'assets/monster_fallen_priest_v2.jpg',
    rewards: { exp: 70, gold: 90, ether: 8 }
  },
  'boss_floor_6': {
    id: 'boss_floor_6',
    name: '핏빛 대공 (6F 보스)',
    type: 'boss',
    faction: 'corrupted',
    level: 16,
    maxHp: 2000,
    atk: 140,
    def: 65,
    spd: 50,
    luck: 52,
    piercePct: 0.30,
    drainPct: 0.40,
    skills: [
      { name: '핏빛 파동', description: '전체 150% 피해 + 출혈 [집중 차징]', power: 1.5, effectType: 'bleed', statusDuration: 2, isCharge: true, breakGauge: 500, drainPct: 0.40 },
      { name: '흡혈의 일격', description: '단일 200% 피해 및 40% 흡혈 (방어 관통 35%)', power: 2.0, effectType: 'drain', drainPct: 0.40, piercePct: 0.35 }
    ],
    themeColor: 0xd32f2f,
    promptKey: 'boss_floor_6',
    imagePath: 'assets/boss_floor_6.jpg',
    description: '핏빛 성역의 지배자. 거대한 박쥐 날개와 피의 마법으로 침입자의 생명력을 흡수합니다.',
    rewards: { exp: 350, gold: 450, ether: 30, dropSkillBookId: 'book_boss_blood_monarch' }
  },

  'monster_oblivion_ghost': {
    id: 'monster_oblivion_ghost',
    name: '망각의 유령',
    type: 'normal',
    faction: 'undead',
    level: 16,
    maxHp: 520,
    atk: 125,
    def: 45,
    spd: 60,
    luck: 60,
    skills: [
      { name: '한기 서린 손아귀', description: '단일 100% 피해 + 빙결(스턴)', power: 1.0, effectType: 'stun', statusDuration: 1 }
    ],
    themeColor: 0x90caf9,
    description: '망각의 묘지에 갇힌 영혼들의 원념이 뭉쳐진 언데드 유체. 영혼을 얼어붙게 하는 한기를 내뿜습니다.',
    promptKey: 'monster_oblivion_ghost',
    imagePath: 'assets/monster_oblivion_ghost_v2.jpg',
    rewards: { exp: 80, gold: 100, ether: 10 }
  },
  'monster_bone_golem': {
    id: 'monster_bone_golem',
    name: '뼈 골렘',
    type: 'normal',
    faction: 'construct',
    level: 17,
    maxHp: 750,
    atk: 110,
    def: 75,
    spd: 36,
    luck: 54,
    shieldBreakMult: 2.2,
    skills: [
      { name: '뼈 분쇄', description: '단일 140% 피해 (보호막 분쇄 & 넉백)', power: 1.4, effectType: 'damage', disruptPosition: 'knockback' }
    ],
    themeColor: 0xbcaaa4,
    description: '수천의 유골과 마수의 뼈가 결합되어 탄생한 거대한 뼈의 골렘. 막강한 방어력과 분쇄력을 지닙니다.',
    promptKey: 'monster_bone_golem',
    imagePath: 'assets/monster_bone_golem_v2.jpg',
    rewards: { exp: 90, gold: 110, ether: 10, resources: { bone: 3 } }
  },
  'boss_floor_7': {
    id: 'boss_floor_7',
    name: '망각의 묘지기 (7F 보스)',
    type: 'boss',
    faction: 'undead',
    level: 18,
    maxHp: 2800,
    atk: 160,
    def: 80,
    spd: 36,
    luck: 56,
    piercePct: 0.40,
    drainPct: 0.30,
    skills: [
      { name: '영혼 수확', description: '전체 180% 마법 피해 + 생명 강탈 [집중 차징]', power: 1.8, effectType: 'drain', drainPct: 0.35, isCharge: true, breakGauge: 650 },
      { name: '사신의 낫', description: '단일 250% 방어 관통 65% 치명타', power: 2.5, effectType: 'damage', piercePct: 0.65 }
    ],
    themeColor: 0x5c6bc0,
    promptKey: 'boss_floor_7',
    imagePath: 'assets/boss_floor_7.jpg',
    description: '망각의 묘역을 수호하는 죽음의 묘지기. 거대한 영혼의 낫으로 산 자의 생명을 수확합니다.',
    rewards: { exp: 450, gold: 600, ether: 40, dropSkillBookId: 'book_boss_oblivion_scythe' }
  },
  'monster_fallen_paladin': {
    id: 'monster_fallen_paladin',
    name: '타락한 기사',
    type: 'normal',
    faction: 'corrupted',
    level: 19,
    maxHp: 650,
    atk: 140,
    def: 85,
    spd: 45,
    luck: 63,
    skills: [
      { name: '칠흑의 검', description: '단일 130% 피해', power: 1.3, effectType: 'damage' }
    ],
    themeColor: 0x455a64,
    description: '심연의 저주에 굴복한 고대 성기사. 칠흑의 검과 저주받은 방패로 전열을 압박합니다.',
    promptKey: 'monster_fallen_paladin',
    imagePath: 'assets/monster_fallen_paladin_v2.jpg',
    rewards: { exp: 100, gold: 130, ether: 12 }
  },
  'monster_inquisitor': {
    id: 'monster_inquisitor',
    name: '이단 심문관',
    type: 'normal',
    faction: 'corrupted',
    level: 20,
    maxHp: 580,
    atk: 150,
    def: 60,
    spd: 57,
    luck: 69,
    piercePct: 0.35,
    skills: [
      { name: '화형 선고', description: '단일 110% 관통 화형 (방어 관통 40%)', power: 1.1, effectType: 'bleed', statusDuration: 3, piercePct: 0.40 }
    ],
    themeColor: 0xd84315,
    description: '단죄의 성채에서 이단을 심문하던 광기의 집행관. 불타는 사슬과 화형의 불길로 적을 태웁니다.',
    promptKey: 'monster_inquisitor',
    imagePath: 'assets/monster_inquisitor_v2.jpg',
    rewards: { exp: 110, gold: 140, ether: 14 }
  },
  'boss_floor_8': {
    id: 'boss_floor_8',
    name: '타락한 기사단장 (8F 보스)',
    type: 'boss',
    faction: 'corrupted',
    level: 21,
    maxHp: 3800,
    atk: 190,
    def: 100,
    spd: 44,
    luck: 60,
    piercePct: 0.45,
    shieldBreakMult: 2.0,
    skills: [
      { name: '집행자의 심판', description: '전체 200% 방어 관통 심판 [집중 차징 & 넉백]', power: 2.0, effectType: 'damage', isCharge: true, breakGauge: 850, piercePct: 0.50, disruptPosition: 'knockback' },
      { name: '타락한 성역', description: '자신에게 300% 보호막', power: 3.0, effectType: 'shield' }
    ],
    themeColor: 0x37474f,
    promptKey: 'boss_floor_8',
    imagePath: 'assets/boss_floor_8.jpg',
    description: '단죄의 요새를 통솔하던 전설적인 기사단장. 타락한 성역 결계와 무자비한 심판의 검을 휘두릅니다.',
    rewards: { exp: 600, gold: 800, ether: 50, dropSkillBookId: 'book_boss_judgment_sanctum' }
  },
  'monster_mirror_phantom': {
    id: 'monster_mirror_phantom',
    name: '거울의 환영',
    type: 'normal',
    faction: 'construct',
    level: 22,
    maxHp: 680,
    atk: 165,
    def: 55,
    spd: 84,
    luck: 75,
    piercePct: 0.40,
    skills: [
      { name: '일루전 스트라이크', description: '단일 150% 피해 (그랩 / 진형 당기기)', power: 1.5, effectType: 'damage', piercePct: 0.40, disruptPosition: 'pull' }
    ],
    themeColor: 0x29b6f6,
    description: '환영의 미궁에 반사된 다중 차원의 그림자 분신. 실체 없는 공격으로 적의 급소를 유린합니다.',
    promptKey: 'monster_mirror_phantom',
    imagePath: 'assets/monster_mirror_phantom_v2.jpg',
    rewards: { exp: 130, gold: 160, ether: 16 }
  },
  'boss_floor_9': {
    id: 'boss_floor_9',
    name: '미궁의 지배자 (9F 보스)',
    type: 'boss',
    faction: 'construct',
    level: 24,
    maxHp: 5000,
    atk: 220,
    def: 110,
    spd: 60,
    luck: 64,
    piercePct: 0.50,
    skills: [
      { name: '파편의 폭풍', description: '전체 220% 거울 폭풍 [집중 차징 & 진형 셔플]', power: 2.2, effectType: 'damage', isCharge: true, breakGauge: 1100, piercePct: 0.50, disruptPosition: 'shuffle' },
      { name: '현혹의 거울', description: '전체 공격력 감소 디버프', power: 0.5, effectType: 'debuff_atk', statusDuration: 3 }
    ],
    themeColor: 0x0288d1,
    promptKey: 'boss_floor_9',
    imagePath: 'assets/boss_floor_9.jpg',
    description: '환영의 미궁 중심에서 차원 공간을 뒤틀어놓는 환각의 대마도사. 수많은 거울 파편으로 전장을 유린합니다.',
    rewards: { exp: 800, gold: 1000, ether: 60, dropSkillBookId: 'book_boss_mirror_kaleidoscope' }
  },

  'monster_abyssal_fiend': {
    id: 'monster_abyssal_fiend',
    name: '심연의 악마',
    type: 'normal',
    faction: 'corrupted',
    level: 25,
    maxHp: 900,
    atk: 190,
    def: 90,
    spd: 63,
    luck: 75,
    piercePct: 0.45,
    drainPct: 0.35,
    skills: [
      { name: '악마의 손톱', description: '단일 160% 피해 + 출혈 (흡혈 35% & 방어 관통 45%)', power: 1.6, effectType: 'bleed', statusDuration: 2, drainPct: 0.35, piercePct: 0.45 }
    ],
    themeColor: 0xc62828,
    description: '심연의 가장 깊은 틈새에서 소환된 고위 악마. 치명적인 독과 저주받은 손톱으로 살을 찢습니다.',
    promptKey: 'monster_abyssal_fiend',
    imagePath: 'assets/monster_abyssal_fiend_v2.jpg',
    rewards: { exp: 150, gold: 180, ether: 20 }
  },
  'monster_void_stalker': {
    id: 'monster_void_stalker',
    name: '공허의 추적자',
    type: 'normal',
    faction: 'beast',
    level: 26,
    maxHp: 1000,
    atk: 210,
    def: 95,
    spd: 84,
    luck: 84,
    piercePct: 0.60,
    skills: [
      { name: '공허의 일격', description: '단일 180% 피해 + 방어력 감소 (방어 관통 70% & 그랩)', power: 1.8, effectType: 'debuff_def', statusDuration: 2, piercePct: 0.70, disruptPosition: 'pull' }
    ],
    themeColor: 0x4a148c,
    description: '어둠 속에서 먹잇감을 노리는 공허의 암살자. 기척을 숨기고 다가와 치명적인 일격을 가합니다.',
    promptKey: 'monster_void_stalker',
    imagePath: 'assets/monster_void_stalker_v2.jpg',
    rewards: { exp: 170, gold: 200, ether: 25 }
  },
  'monster_abyssal_behemoth': {
    id: 'monster_abyssal_behemoth',
    name: '심연의 베헤모스',
    type: 'elite',
    faction: 'beast',
    level: 27,
    maxHp: 1400,
    atk: 230,
    def: 120,
    spd: 45,
    luck: 126,
    shieldBreakMult: 2.5,
    skills: [
      { name: '지각 변동', description: '전체 150% 대지진 [집중 차징 & 넉백]', power: 1.5, effectType: 'stun', statusDuration: 1, isCharge: true, breakGauge: 1200, disruptPosition: 'knockback' },
      { name: '심연의 포효', description: '전체 공격력 감소', power: 0, effectType: 'debuff_atk', statusDuration: 3 }
    ],
    themeColor: 0x3e2723,
    description: '심연의 밑바닥을 배회하는 거대한 마수. 그 발걸음만으로도 던전 전체가 진동합니다.',
    promptKey: 'monster_abyssal_behemoth',
    imagePath: 'assets/monster_abyssal_behemoth_v2.jpg',
    rewards: { exp: 250, gold: 300, ether: 35 }
  },
  'boss_floor_10': {
    id: 'boss_floor_10',
    name: '심연의 군주 아스모데우스 (10F 보스)',
    type: 'boss',
    faction: 'corrupted',
    level: 28,
    maxHp: 8000,
    atk: 280,
    def: 150,
    spd: 70,
    luck: 70,
    piercePct: 0.60,
    drainPct: 0.35,
    shieldBreakMult: 2.0,
    skills: [
      { name: '종말의 숨결', description: '전체 300% 종말 마법 피해 [집중 차징]', power: 3.0, effectType: 'damage', isCharge: true, breakGauge: 1600, piercePct: 0.65 },
      { name: '절망의 장막', description: '전체 기절', power: 1.0, effectType: 'stun', statusDuration: 1 },
      { name: '파멸의 일격', description: '단일 400% 멸망 강타 (방어 관통 80% & 넉백)', power: 4.0, effectType: 'damage', piercePct: 0.80, disruptPosition: 'knockback' }
    ],
    themeColor: 0xb71c1c,
    promptKey: 'boss_floor_10',
    imagePath: 'assets/boss_floor_10.jpg',
    description: '심연의 심장부에 군림하는 궁극의 공허 군주. 차원 전체를 멸망시킬 종말의 숨결을 내뿜습니다.',
    rewards: { exp: 1500, gold: 2000, ether: 100, dropSkillBookId: 'book_boss_asmodeus_armageddon' }
  },
  'boss_avici_final': {
    id: 'boss_avici_final',
    name: '무간의 지배자 아르케오스 (진 최종 보스)',
    type: 'boss',
    faction: 'corrupted',
    level: 520,
    maxHp: 45000,
    atk: 1250,
    def: 680,
    spd: 176,
    luck: 150,
    piercePct: 0.70,
    drainPct: 0.40,
    shieldBreakMult: 2.5,
    skills: [
      { name: '무간의 태초 파동', description: '적 전체에 350% 마법 관통 파동 [집중 차징 & 진형 셔플]', power: 3.5, effectType: 'damage', isCharge: true, breakGauge: 3000, piercePct: 0.80, disruptPosition: 'shuffle' },
      { name: '공허의 절대 침식', description: '대상 파티 전체 방어력 50% 감소 및 2턴 기절', power: 1.5, effectType: 'stun', statusDuration: 2 },
      { name: '멸망의 창조 일격', description: '단일 대상 500% 치명 관통 강타 (방어 관통 90%)', power: 5.0, effectType: 'damage', piercePct: 0.90 }
    ],
    themeColor: 0x9c27b0,
    promptKey: 'boss_avici_final',
    imagePath: 'assets/void_overlord.jpg',
    description: '무간도의 가장 깊은 심연에 도사린 태초의 공허 창조주. 존재 자체로 시공간을 소멸시키는 절대자입니다.',
    rewards: { exp: 8000, gold: 50000, ether: 5000 }
  },


  // ══════════════════════════════════════════════════════
  //  차원 네메시스 레이드 (Void Nemesis Raid)
  // ══════════════════════════════════════════════════════
  'nemesis_boss': {
    id: 'nemesis_boss',
    name: '차원 네메시스 (본체)',
    type: 'boss',
    faction: 'corrupted',
    level: 99,
    maxHp: 12500000,
    atk: 1400,
    def: 350,
    spd: 120,
    luck: 50,
    skills: [
      { name: '차원 붕괴선', description: '파티 전원에게 치명적인 공허 광역 피해', power: 2.0, effectType: 'damage' }
    ],
    rewards: { gold: 10000, ether: 500, exp: 5000 },
    promptKey: 'nemesis_boss',
    imagePath: 'assets/void_overlord.jpg',
    themeColor: 0x9c27b0,
    description: '시공간 균열을 찢고 방주 영지를 침공하는 태초의 공허 지배자.'
  },

  'nemesis_head': {
    id: 'nemesis_head',
    name: '네메시스 머리',
    type: 'boss',
    faction: 'corrupted',
    level: 99,
    maxHp: 4000000,
    atk: 1550,
    def: 380,
    spd: 135,
    luck: 45,
    skills: [
      { name: '공간 붕괴 파동', description: '물리 분쇄 광역 절멸 강타', power: 2.2, effectType: 'damage' }
    ],
    rewards: { gold: 3000, ether: 150, exp: 1500 },
    promptKey: 'nemesis_head',
    imagePath: 'assets/nemesis_head.jpg',
    themeColor: 0xef5350,
    description: '공허 군주의 대검을 휘두르며 전열에서 아군을 분쇄하는 워로드 부위.'
  },

  'nemesis_body': {
    id: 'nemesis_body',
    name: '네메시스 몸통',
    type: 'boss',
    faction: 'corrupted',
    level: 99,
    maxHp: 5000000,
    atk: 1250,
    def: 450,
    spd: 105,
    luck: 60,
    skills: [
      { name: '차원 시간 정지장', description: '광역 정지 및 엔트로피 흡수', power: 1.8, effectType: 'debuff' }
    ],
    rewards: { gold: 4000, ether: 200, exp: 2000 },
    promptKey: 'nemesis_body',
    imagePath: 'assets/nemesis_body.jpg',
    themeColor: 0xce93d8,
    description: '시간 정지장과 마나 엔트로피를 흡수하는 중열 크로노 아콘 부위.'
  },

  'nemesis_tail': {
    id: 'nemesis_tail',
    name: '네메시스 꼬리',
    type: 'boss',
    faction: 'corrupted',
    level: 99,
    maxHp: 3500000,
    atk: 1700,
    def: 300,
    spd: 150,
    luck: 70,
    skills: [
      { name: '보이드 테일 스윕', description: '초고속 관통 광역 휩쓸기', power: 2.0, effectType: 'damage' }
    ],
    rewards: { gold: 3000, ether: 150, exp: 1500 },
    promptKey: 'nemesis_tail',
    imagePath: 'assets/nemesis_tail.jpg',
    themeColor: 0x00d2ff,
    description: '치명적인 관통 침과 꼬리 휩쓸기로 후방을 기습하는 레인저 부위.'
  },
};

// ─── 층별 조우 몬스터 테이블 (2~10층 및 11층 무간도 반영) ───────────────────────────
export const FLOOR_MONSTER_POOL: Record<number, string[]> = {
  1: ['monster_stalker', 'monster_cave_bat', 'monster_rot_slime', 'monster_cursed_revenant', 'monster_iron_golem', 'monster_shadow_imp'],
  2: ['monster_stalker', 'monster_cursed_revenant', 'monster_tomb_banshee', 'monster_crypt_ghoul', 'monster_dread_knight'],
  3: ['monster_crystal_scorpion', 'monster_mana_gargoyle', 'monster_iron_golem', 'monster_dread_knight'],
  4: ['monster_rift_stalker', 'monster_void_beast', 'monster_dread_knight', 'monster_mana_gargoyle'],
  5: ['monster_altar_cultist', 'monster_monolith_guardian', 'monster_rift_stalker', 'monster_void_beast'],
  6: ['monster_blood_wolf', 'monster_fallen_priest', 'monster_altar_cultist'],
  7: ['monster_oblivion_ghost', 'monster_bone_golem', 'monster_blood_wolf'],
  8: ['monster_fallen_paladin', 'monster_inquisitor', 'monster_oblivion_ghost'],
  9: ['monster_mirror_phantom', 'monster_abyssal_fiend', 'monster_fallen_paladin'],
  10: ['monster_void_stalker', 'monster_abyssal_behemoth', 'monster_mirror_phantom'],
  11: [
    'monster_stalker', 'monster_cave_bat', 'monster_rot_slime', 'monster_cursed_revenant', 'monster_iron_golem', 'monster_shadow_imp',
    'monster_tomb_banshee', 'monster_crypt_ghoul', 'monster_dread_knight', 'monster_crystal_scorpion', 'monster_mana_gargoyle',
    'monster_rift_stalker', 'monster_void_beast', 'monster_altar_cultist', 'monster_monolith_guardian', 'monster_blood_wolf',
    'monster_fallen_priest', 'monster_oblivion_ghost', 'monster_bone_golem', 'monster_fallen_paladin', 'monster_inquisitor',
    'monster_mirror_phantom', 'monster_abyssal_fiend', 'monster_void_stalker', 'monster_abyssal_behemoth'
  ]
};

// ─── 층별 고유 보스 매핑 테이블 (1F ~ 11F) ──────────────────────────────────────
export const FLOOR_BOSS_MAP: Record<number, string> = {
  1: 'boss_floor_1',
  2: 'boss_floor_2',
  3: 'boss_floor_3',
  4: 'boss_floor_4',
  5: 'boss_floor_5',
  6: 'boss_floor_6',
  7: 'boss_floor_7',
  8: 'boss_floor_8',
  9: 'boss_floor_9',
  10: 'boss_floor_10',
  11: 'boss_avici_final'
};

import { GameDataService } from '../services/GameDataService';

export function getMonsterData(id: string): MonsterData {
  try {
    const custom = GameDataService.getInstance().getMonster(id);
    if (custom) return JSON.parse(JSON.stringify(custom));
  } catch (_) {}
  return JSON.parse(JSON.stringify(MONSTERS[id] || MONSTERS['monster_stalker']));
}