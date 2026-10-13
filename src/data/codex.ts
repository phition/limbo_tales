import { CodexCollectionItem } from '../types/game';

export const CODEX_COLLECTIONS: CodexCollectionItem[] = [
  // ═══════════════════════════════════════════════════════════════════════
  // ── 1. 영지 및 기초 자원 컬렉션 ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'codex_foundation',
    name: '방주의 주춧돌',
    icon: '🏛️',
    category: 'resource',
    desc: '방주 성채의 성벽과 기반을 보강하여 시설 유지 부담을 영구 경감합니다.',
    requirements: [
      { type: 'resource', key: 'wood', name: '목재', icon: '🪵', amount: 500 },
      { type: 'resource', key: 'stone', name: '석재', icon: '🪨', amount: 500 },
    ],
    bonus: {
      label: '영지 시설 유지비 -5% 감면',
      upkeepDiscountPct: 5,
    },
  },
  {
    id: 'codex_iron_line',
    name: '철혈의 보급선',
    icon: '⚙️',
    category: 'resource',
    desc: '고순도 철광석과 가공된 석탄으로 방어구를 단련합니다.',
    requirements: [
      { type: 'resource', key: 'iron', name: '철광석', icon: '⚙️', amount: 400 },
      { type: 'resource', key: 'coal', name: '석탄', icon: '⬛', amount: 200 },
    ],
    bonus: {
      label: '파티 방어력 +10 영구 증가',
      def: 10,
    },
  },
  {
    id: 'codex_rations',
    name: '심연의 비축식량',
    icon: '🍖',
    category: 'resource',
    desc: '염장 식량과 가죽 배낭으로 원정대의 기초 생명력을 강화합니다.',
    requirements: [
      { type: 'resource', key: 'food', name: '식량', icon: '🍖', amount: 600 },
      { type: 'resource', key: 'leather', name: '가죽', icon: '🥋', amount: 150 },
    ],
    bonus: {
      label: '파티 최대 HP +60 영구 증가',
      hp: 60,
    },
  },
  {
    id: 'codex_ether_resonance',
    name: '에테르 마도 공명',
    icon: '✨',
    category: 'resource',
    desc: '고밀도 에테르와 마력수정의 파동을 동기화하여 지혜의 마력을 각성합니다.',
    requirements: [
      { type: 'resource', key: 'ether', name: '에테르', icon: '✨', amount: 500 },
      { type: 'resource', key: 'crystal', name: '마력수정', icon: '💎', amount: 100 },
    ],
    bonus: {
      label: '파티 마법 공격력 +12 & 최대 MP +30',
      atk: 12,
      mp: 30,
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── 2. 던전 탐험 보급품 컬렉션 ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'codex_explorer_gear',
    name: '개척자의 완비 장구',
    icon: '🎒',
    category: 'supply',
    desc: '지하 탐색에 필수적인 장비들을 완비하여 흑무의 공포를 늦춥니다.',
    requirements: [
      { type: 'supply', key: 'torch', name: '횃불', icon: '🔥', amount: 10 },
      { type: 'supply', key: 'bandage', name: '치유 붕대', icon: '🩹', amount: 5 },
      { type: 'supply', key: 'pickaxe', name: '채굴 곡괭이', icon: '⛏️', amount: 5 },
    ],
    bonus: {
      label: '파티 피해 감소 3% & 행동속도 +3',
      dmgReduction: 3,
      spd: 3,
    },
  },
  {
    id: 'codex_consecration',
    name: '성역의 퇴마 구비품',
    icon: '💧',
    category: 'supply',
    desc: '축성된 성수와 굳건한 열쇠로 악령의 저주를 원천 차단합니다.',
    requirements: [
      { type: 'supply', key: 'holy_water', name: '정화의 성수', icon: '💧', amount: 5 },
      { type: 'supply', key: 'key', name: '던전 열쇠', icon: '🗝️', amount: 5 },
      { type: 'supply', key: 'rift_anchor', name: '균열의 닻', icon: '⚓', amount: 2 },
    ],
    bonus: {
      label: '파티 방어력 +8 & 행운 +5',
      def: 8,
      luck: 5,
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── 3. 심연 전리품 및 마도 재료 컬렉션 ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'codex_beast_hunter',
    name: '심연의 포식자 추적록',
    icon: '🦴',
    category: 'material',
    desc: '심연 짐승들의 골격과 억센 모피를 분석하여 치명적인 급소를 노립니다.',
    requirements: [
      { type: 'resource', key: 'bone', name: '짐승 뼈', icon: '🦴', amount: 150 },
      { type: 'resource', key: 'leather', name: '가죽', icon: '🥋', amount: 120 },
    ],
    bonus: {
      label: '치명타 확률 +3% 영구 증가',
      critRate: 3,
    },
  },
  {
    id: 'codex_dark_essence',
    name: '공허의 융합 정수',
    icon: '🌑',
    category: 'material',
    desc: '공허의 파편과 암흑 정수를 제련하여 무기에 깃든 파멸의 위력을 끌어올립니다.',
    requirements: [
      { type: 'resource', key: 'void_shard', name: '공허 파편', icon: '🔮', amount: 60 },
      { type: 'resource', key: 'dark_essence', name: '암흑 정수', icon: '🌑', amount: 20 },
    ],
    bonus: {
      label: '모든 피해 +4% & 공격력 +10',
      allDmgPct: 4,
      atk: 10,
    },
  },
  {
    id: 'codex_enchant_echo',
    name: '마도 각인의 잔향',
    icon: '⭐',
    category: 'material',
    desc: '접두석과 접미석의 양극 마력을 조화시켜 궁극의 일격을 구현합니다.',
    requirements: [
      { type: 'resource', key: 'prefix_stone', name: '일반 접두석', icon: '⭐', amount: 15 },
      { type: 'resource', key: 'suffix_stone', name: '일반 접미석', icon: '🔮', amount: 15 },
    ],
    bonus: {
      label: '파티 공격력 +15 영구 증가',
      atk: 15,
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── 4. 병기창(Forge) 레벨별 단조 무구 컬렉션 (1~10티어) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'codex_armory_t1',
    name: '수습 대장장이의 입문 장구',
    icon: '🗡️',
    category: 'armory',
    desc: '병기창 1단계에서 단조된 기초 철검과 경량 가죽 갑옷, 은빛 반지의 표준 입문 구성.',
    requirements: [
      { type: 'equipment', key: 'equip_t1_sword', name: '수습 대장장이의 철검', icon: '⚔️', amount: 1 },
      { type: 'equipment', key: 'equip_t1_armor', name: '수습 가죽 갑옷', icon: '🧥', amount: 1 },
      { type: 'equipment', key: 'equip_t1_ring', name: '은빛 반지', icon: '💍', amount: 1 },
    ],
    bonus: {
      label: '파티 공격력 +8 & 방어력 +5',
      atk: 8,
      def: 5,
    },
  },
  {
    id: 'codex_armory_t2',
    name: '단련된 강철 중보병 세트',
    icon: '🔱',
    category: 'armory',
    desc: '병기창 2단계의 석탄 열기로 단련한 기병창과 두터운 판금갑, 결계 목걸이의 견고한 중보병 장구.',
    requirements: [
      { type: 'equipment', key: 'equip_t2_spear', name: '강철 기병창', icon: '🔱', amount: 1 },
      { type: 'equipment', key: 'equip_t2_armor', name: '정련 강철 판금갑', icon: '🛡️', amount: 1 },
      { type: 'equipment', key: 'equip_t2_necklace', name: '수호 결계 목걸이', icon: '📿', amount: 1 },
    ],
    bonus: {
      label: '파티 최대 HP +80 & 방어력 +8',
      hp: 80,
      def: 8,
    },
  },
  {
    id: 'codex_armory_t3',
    name: '마도 룬 각인 원소 학도 세트',
    icon: '🪄',
    category: 'armory',
    desc: '병기창 3단계에서 마력 수정을 주입해 룬을 새긴 마도 지팡이와 공명 로브, 영혼 부적.',
    requirements: [
      { type: 'equipment', key: 'equip_t3_staff', name: '원소 마도 지팡이', icon: '🪄', amount: 1 },
      { type: 'equipment', key: 'equip_t3_robe', name: '원소 공명 로브', icon: '🔮', amount: 1 },
      { type: 'equipment', key: 'equip_t3_amulet', name: '영혼 공명 부적', icon: '🧿', amount: 1 },
    ],
    bonus: {
      label: '파티 공격력 +12 & 최대 MP +40',
      atk: 12,
      mp: 40,
    },
  },
  {
    id: 'codex_armory_t4',
    name: '흑요석 그림자 암살 장구',
    icon: '🗡️',
    category: 'armory',
    desc: '병기창 4단계의 흑요석과 에테르를 결속한 기습 단검과 정예 가죽 경갑, 에테르 심장 반지. [희귀 등급 이상]',
    requirements: [
      { type: 'equipment', key: 'equip_t4_dagger', name: '환영 흑요석 단검', icon: '🗡️', amount: 1, minRarity: 'rare', floor: 4 },
      { type: 'equipment', key: 'equip_t4_leather', name: '흑요석 정예 경갑', icon: '🧥', amount: 1, minRarity: 'rare', floor: 4 },
      { type: 'equipment', key: 'equip_t4_ring', name: '에테르 심장 반지', icon: '💍', amount: 1, minRarity: 'rare', floor: 4 },
    ],
    bonus: {
      label: '파티 방어력 +15 & 피해 감소 +3%',
      def: 15,
      dmgReduction: 3,
    },
  },
  {
    id: 'codex_armory_t5',
    name: '심연 공허의 중포격 무구',
    icon: '🔫',
    category: 'armory',
    desc: '병기창 5단계의 공허 파편을 제련해 결전 화력을 부여한 파멸포와 수호 판금갑, 왜곡 부적. [희귀 등급 이상]',
    requirements: [
      { type: 'equipment', key: 'equip_t5_gun', name: '모노리스 파멸포', icon: '🔫', amount: 1, minRarity: 'rare', floor: 5 },
      { type: 'equipment', key: 'equip_t5_plate', name: '공허 지배 수호갑', icon: '🛡️', amount: 1, minRarity: 'rare', floor: 5 },
      { type: 'equipment', key: 'equip_t5_amulet', name: '차원 왜곡 부적', icon: '🧿', amount: 1, minRarity: 'rare', floor: 5 },
    ],
    bonus: {
      label: '모든 피해 +5% & 공격력 +15',
      allDmgPct: 5,
      atk: 15,
    },
  },
  {
    id: 'codex_armory_t6',
    name: '진홍 혈염의 결전 사격 무구',
    icon: '🏹',
    category: 'armory',
    desc: '병기창 6단계의 진홍빛 혈염 권능을 머금은 환영궁과 선혈 로브, 불멸 목걸이. [희귀 등급 이상]',
    requirements: [
      { type: 'equipment', key: 'equip_t6_bow', name: '혈염 환영궁', icon: '🏹', amount: 1, minRarity: 'rare', floor: 6 },
      { type: 'equipment', key: 'equip_t6_robe', name: '진홍 선혈 로브', icon: '🔮', amount: 1, minRarity: 'rare', floor: 6 },
      { type: 'equipment', key: 'equip_t6_necklace', name: '불멸 선혈 목걸이', icon: '📿', amount: 1, minRarity: 'rare', floor: 6 },
    ],
    bonus: {
      label: '치명타율 +4% & 공격력 +18',
      critRate: 4,
      atk: 18,
    },
  },
  {
    id: 'codex_armory_t7',
    name: '망각 사신의 영혼 파열 장구',
    icon: '🔱',
    category: 'armory',
    desc: '병기창 7단계의 망각 묘역 원혼 에너지를 벼려낸 사령 극창과 철벽 사령갑, 속박 반지. [희귀 등급 이상]',
    requirements: [
      { type: 'equipment', key: 'equip_t7_spear', name: '사령 절단 극창', icon: '🔱', amount: 1, minRarity: 'rare', floor: 7 },
      { type: 'equipment', key: 'equip_t7_plate', name: '망각 철벽 사령갑', icon: '🛡️', amount: 1, minRarity: 'rare', floor: 7 },
      { type: 'equipment', key: 'equip_t7_ring', name: '사령 속박 반지', icon: '💍', amount: 1, minRarity: 'rare', floor: 7 },
    ],
    bonus: {
      label: '파티 행동속도 +4 & 모든 피해 +6%',
      spd: 4,
      allDmgPct: 6,
    },
  },
  {
    id: 'codex_armory_t8',
    name: '단죄 성역의 심판 대주교 무구',
    icon: '🪄',
    category: 'armory',
    desc: '병기창 8단계의 단죄 요새 결계 강철로 축성된 대지팡이와 단죄 성의, 심판 부적. [에픽 등급 이상]',
    requirements: [
      { type: 'equipment', key: 'equip_t8_staff', name: '단죄 성역 대지팡이', icon: '🪄', amount: 1, minRarity: 'epic', floor: 8 },
      { type: 'equipment', key: 'equip_t8_robe', name: '칠흑 단죄 성의', icon: '🔮', amount: 1, minRarity: 'epic', floor: 8 },
      { type: 'equipment', key: 'equip_t8_amulet', name: '단죄 심판 부적', icon: '🧿', amount: 1, minRarity: 'epic', floor: 8 },
    ],
    bonus: {
      label: '파티 방어력 +20 & 피해 감소 +4%',
      def: 20,
      dmgReduction: 4,
    },
  },
  {
    id: 'codex_armory_t9',
    name: '만화경 환영의 차원 저격 장구',
    icon: '🔫',
    category: 'armory',
    desc: '병기창 9단계의 거울 차원 굴절 마력을 담은 환영 마총과 굴절 경갑, 진실 목걸이. [에픽 등급 이상]',
    requirements: [
      { type: 'equipment', key: 'equip_t9_gun', name: '환영 굴절 마총', icon: '🔫', amount: 1, minRarity: 'epic', floor: 9 },
      { type: 'equipment', key: 'equip_t9_leather', name: '만화경 환영 경갑', icon: '🧥', amount: 1, minRarity: 'epic', floor: 9 },
      { type: 'equipment', key: 'equip_t9_necklace', name: '미궁 진실 목걸이', icon: '📿', amount: 1, minRarity: 'epic', floor: 9 },
    ],
    bonus: {
      label: '파티 행운 +8 & 치명타율 +5%',
      luck: 8,
      critRate: 5,
    },
  },
  {
    id: 'codex_armory_t10',
    name: '절대 종말의 심연 신화 무구',
    icon: '👑',
    category: 'armory',
    desc: '병기창 10단계, 심연의 정점에 도달한 마도 공학의 궁극 초월 장비 3종 세트. [에픽 등급 이상]',
    requirements: [
      { type: 'equipment', key: 'equip_t10_sword', name: '절대 종말의 심연검', icon: '⚔️', amount: 1, minRarity: 'epic', floor: 10 },
      { type: 'equipment', key: 'equip_t10_armor', name: '아스모데우스 절대갑', icon: '🛡️', amount: 1, minRarity: 'epic', floor: 10 },
      { type: 'equipment', key: 'equip_t10_ring', name: '절대 종말 반지', icon: '💍', amount: 1, minRarity: 'epic', floor: 10 },
    ],
    bonus: {
      label: '모든 피해 +10% & 공격력/방어력 +25 & HP +150',
      allDmgPct: 10,
      atk: 25,
      def: 25,
      hp: 150,
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── 5. 1F~10F 보스 고유 유니크 장비 세트 컬렉션 ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'codex_boss_set_1',
    name: '1F 침묵의 감시자 보스 세트',
    icon: '👁️',
    category: 'boss_equip',
    desc: '1층 지배자 [침묵의 감시자]를 처치하고 회수한 전설의 고유 3종 무구 세트.',
    requirements: [
      { type: 'equipment', key: 'boss_uniq_1_wpn', name: '감시자의 심안 대검', icon: '🗡️', amount: 1, floor: 1 },
      { type: 'equipment', key: 'boss_uniq_1_arm', name: '망자의 감시 흉갑', icon: '🛡️', amount: 1, floor: 1 },
      { type: 'equipment', key: 'boss_uniq_1_acc', name: '침묵의 시선 반지', icon: '💍', amount: 1, floor: 1 },
    ],
    bonus: {
      label: '파티 공격력 +10 & 방어력 +8',
      atk: 10,
      def: 8,
    },
  },
  {
    id: 'codex_boss_set_2',
    name: '2F 망령의 군주 보스 세트',
    icon: '💀',
    category: 'boss_equip',
    desc: '2층 지배자 [망령의 군주]가 수많은 원혼을 수확하던 사신의 무구 세트.',
    requirements: [
      { type: 'equipment', key: 'boss_uniq_2_wpn', name: '영혼 수확자의 사신 낫', icon: '⚔️', amount: 1, floor: 2 },
      { type: 'equipment', key: 'boss_uniq_2_arm', name: '망령 군주의 유령 로브', icon: '🥻', amount: 1, floor: 2 },
      { type: 'equipment', key: 'boss_uniq_2_acc', name: '원한의 영혼석 목걸이', icon: '📿', amount: 1, floor: 2 },
    ],
    bonus: {
      label: '파티 최대 MP +50 & 공격력 +14',
      mp: 50,
      atk: 14,
    },
  },
  {
    id: 'codex_boss_set_3',
    name: '3F 원초의 골렘 보스 세트',
    icon: '🗿',
    category: 'boss_equip',
    desc: '3층 광맥의 수호자 [원초의 골렘]의 거암을 깎아 만든 중장갑 세트.',
    requirements: [
      { type: 'equipment', key: 'boss_uniq_3_wpn', name: '광맥 파쇄 대형 해머', icon: '🔨', amount: 1, floor: 3 },
      { type: 'equipment', key: 'boss_uniq_3_arm', name: '태고 광맥의 거인 갑주', icon: '🛡️', amount: 1, floor: 3 },
      { type: 'equipment', key: 'boss_uniq_3_acc', name: '대지의 심장 수호 인장', icon: '🎖️', amount: 1, floor: 3 },
    ],
    bonus: {
      label: '파티 최대 HP +100 & 방어력 +12',
      hp: 100,
      def: 12,
    },
  },
  {
    id: 'codex_boss_set_4',
    name: '4F 심연의 시공 왜곡자 보스 세트',
    icon: '🌀',
    category: 'boss_equip',
    desc: '4층 차원 균열을 지배하던 [심연의 시공 왜곡자]의 잔해로 완성된 시공간 장구. [희귀 등급 이상]',
    requirements: [
      { type: 'equipment', key: 'boss_uniq_4_wpn', name: '시공 왜곡의 비전 지팡이', icon: '🪄', amount: 1, minRarity: 'rare', floor: 4 },
      { type: 'equipment', key: 'boss_uniq_4_arm', name: '시공 왜곡자의 성운 로브', icon: '🥻', amount: 1, minRarity: 'rare', floor: 4 },
      { type: 'equipment', key: 'boss_uniq_4_acc', name: '차원 앵커의 비전 마도구', icon: '🧿', amount: 1, minRarity: 'rare', floor: 4 },
    ],
    bonus: {
      label: '파티 행동속도 +5 & 치명타율 +3%',
      spd: 5,
      critRate: 3,
    },
  },
  {
    id: 'codex_boss_set_5',
    name: '5F 공허의 지배자 보스 세트',
    icon: '🌌',
    category: 'boss_equip',
    desc: '5층 나락의 심연에서 군림하던 [공허의 지배자]의 모노리스 파멸 세트. [희귀 등급 이상]',
    requirements: [
      { type: 'equipment', key: 'boss_uniq_5_wpn', name: '모노리스 공허 분쇄포', icon: '🔫', amount: 1, minRarity: 'rare', floor: 5 },
      { type: 'equipment', key: 'boss_uniq_5_arm', name: '공허 지배자의 멸망 중갑', icon: '🥋', amount: 1, minRarity: 'rare', floor: 5 },
      { type: 'equipment', key: 'boss_uniq_5_acc', name: '모노리스의 파멸 핵 성물', icon: '👑', amount: 1, minRarity: 'rare', floor: 5 },
    ],
    bonus: {
      label: '모든 피해 +6% & 파티 공격력 +16',
      allDmgPct: 6,
      atk: 16,
    },
  },
  {
    id: 'codex_boss_set_6',
    name: '6F 핏빛 성역의 지배자 보스 세트',
    icon: '🍷',
    category: 'boss_equip',
    desc: '6층 핏빛 성역의 지배자 [핏빛 대공]의 선혈 예복과 흡혈 마검. [희귀 등급 이상]',
    requirements: [
      { type: 'equipment', key: 'boss_uniq_6_wpn', name: '진홍 군주의 흡혈 마검', icon: '🗡️', amount: 1, minRarity: 'rare', floor: 6 },
      { type: 'equipment', key: 'boss_uniq_6_arm', name: '핏빛 대공의 선혈 예복', icon: '🧥', amount: 1, minRarity: 'rare', floor: 6 },
      { type: 'equipment', key: 'boss_uniq_6_acc', name: '진홍 마안의 흡혈 루비', icon: '💎', amount: 1, minRarity: 'rare', floor: 6 },
    ],
    bonus: {
      label: '파티 공격력 +18 & 치명타율 +4%',
      atk: 18,
      critRate: 4,
    },
  },
  {
    id: 'codex_boss_set_7',
    name: '7F 망각의 묘지기 보스 세트',
    icon: '⛏️',
    category: 'boss_equip',
    desc: '7층 망각 묘역에서 시신을 파헤치고 영혼을 참살하던 [망각의 묘지기]의 사령 장구. [희귀 등급 이상]',
    requirements: [
      { type: 'equipment', key: 'boss_uniq_7_wpn', name: '망각 묘지기의 영혼 참살낫', icon: '⚔️', amount: 1, minRarity: 'rare', floor: 7 },
      { type: 'equipment', key: 'boss_uniq_7_arm', name: '망각 사신의 칠흑 사령의', icon: '🥻', amount: 1, minRarity: 'rare', floor: 7 },
      { type: 'equipment', key: 'boss_uniq_7_acc', name: '영혼 속박의 사슬 인장', icon: '⛓️', amount: 1, minRarity: 'rare', floor: 7 },
    ],
    bonus: {
      label: '골드 획득 +10% & 행운 +6',
      goldBonusPct: 10,
      luck: 6,
    },
  },
  {
    id: 'codex_boss_set_8',
    name: '8F 타락한 성기사단장 보스 세트',
    icon: '⚔️',
    category: 'boss_equip',
    desc: '8층 단죄의 성채를 방어하던 [타락한 성기사단장]의 단죄 성검과 불패 판금갑. [에픽 등급 이상]',
    requirements: [
      { type: 'equipment', key: 'boss_uniq_8_wpn', name: '타락 기사단장의 단죄 성검', icon: '⚔️', amount: 1, minRarity: 'epic', floor: 8 },
      { type: 'equipment', key: 'boss_uniq_8_arm', name: '칠흑 성역의 불패 판금갑', icon: '🛡️', amount: 1, minRarity: 'epic', floor: 8 },
      { type: 'equipment', key: 'boss_uniq_8_acc', name: '단죄 수호자의 칠흑 성배', icon: '🏆', amount: 1, minRarity: 'epic', floor: 8 },
    ],
    bonus: {
      label: '파티 피해 감소 +5% & 방어력 +18',
      dmgReduction: 5,
      def: 18,
    },
  },
  {
    id: 'codex_boss_set_9',
    name: '9F 거울 미궁의 지배자 보스 세트',
    icon: '🪞',
    category: 'boss_equip',
    desc: '9층 환영의 미궁을 뒤흔들던 [거울 미궁의 지배자]의 차원 마도봉과 거울 외투. [에픽 등급 이상]',
    requirements: [
      { type: 'equipment', key: 'boss_uniq_9_wpn', name: '만화경 환영의 차원 마도봉', icon: '🪄', amount: 1, minRarity: 'epic', floor: 9 },
      { type: 'equipment', key: 'boss_uniq_9_arm', name: '환영 차원의 거울 외투', icon: '🧥', amount: 1, minRarity: 'epic', floor: 9 },
      { type: 'equipment', key: 'boss_uniq_9_acc', name: '진실의 거울 마도 파편', icon: '🪞', amount: 1, minRarity: 'epic', floor: 9 },
    ],
    bonus: {
      label: '파티 행동속도 +6 & 치명타율 +5%',
      spd: 6,
      critRate: 5,
    },
  },
  {
    id: 'codex_boss_set_10',
    name: '10F 심연의 군주 아스모데우스 보스 세트',
    icon: '👿',
    category: 'boss_equip',
    desc: '10층 심연의 심장부 정점에 군림하던 [심연의 군주 아스모데우스]의 파멸검과 종말 왕관. [에픽 등급 이상]',
    requirements: [
      { type: 'equipment', key: 'boss_uniq_10_wpn', name: '종말의 심연 파멸검', icon: '🪐', amount: 1, minRarity: 'epic', floor: 10 },
      { type: 'equipment', key: 'boss_uniq_10_arm', name: '아스모데우스의 종말 성의', icon: '🥋', amount: 1, minRarity: 'epic', floor: 10 },
      { type: 'equipment', key: 'boss_uniq_10_acc', name: '심연 지배자의 종말 왕관', icon: '👑', amount: 1, minRarity: 'epic', floor: 10 },
    ],
    bonus: {
      label: '모든 피해 +10% & 최대 HP +120 & 공격력 +20',
      allDmgPct: 10,
      hp: 120,
      atk: 20,
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── 6. 비전 마도서(Skill Books) 컬렉션 ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'codex_book_tactics',
    name: '기초 전술 무예 마도서군',
    icon: '📘',
    category: 'skillbook',
    desc: '물리 전사들이 전선에서 가장 애용하는 기초 전술 마도서 3종을 영구 서고에 보존합니다.',
    requirements: [
      { type: 'skillbook', key: 'book_heavy_strike', name: '비전서: 강타', icon: '⚔️', amount: 1 },
      { type: 'skillbook', key: 'book_quick_slash', name: '비전서: 쾌속 베기', icon: '🗡️', amount: 1 },
      { type: 'skillbook', key: 'book_shield_bash', name: '비전서: 방패 가격', icon: '🛡️', amount: 1 },
    ],
    bonus: {
      label: '파티 물리 공격력 +10 & 방어력 +6',
      atk: 10,
      def: 6,
    },
  },
  {
    id: 'codex_book_elemental',
    name: '비전 삼원소 마도서군',
    icon: '📙',
    category: 'skillbook',
    desc: '화염, 냉기, 뇌전의 근원 원소를 다루는 비전 마법서 3종을 등록합니다.',
    requirements: [
      { type: 'skillbook', key: 'book_fireball', name: '비전서: 화염구', icon: '🔥', amount: 1 },
      { type: 'skillbook', key: 'book_frost_nova', name: '비전서: 서리 발산', icon: '❄️', amount: 1 },
      { type: 'skillbook', key: 'book_chain_lightning', name: '비전서: 연쇄 번개', icon: '⚡', amount: 1 },
    ],
    bonus: {
      label: '파티 마법 공격력 +15 & 최대 MP +40',
      atk: 15,
      mp: 40,
    },
  },
  {
    id: 'codex_book_holy',
    name: '신성 성역 마도서군',
    icon: '📗',
    category: 'skillbook',
    desc: '아군을 회복시키고 결계로 보호하는 신성 사제 계열의 치유 마도서 3종.',
    requirements: [
      { type: 'skillbook', key: 'book_holy_light', name: '비전서: 신성 치유', icon: '✨', amount: 1 },
      { type: 'skillbook', key: 'book_blessing', name: '비전서: 빛의 축복', icon: '🌟', amount: 1 },
      { type: 'skillbook', key: 'book_sanctuary', name: '비전서: 성역 결계', icon: '🛡️', amount: 1 },
    ],
    bonus: {
      label: '파티 최대 HP +100 & 피해 감소 +3%',
      hp: 100,
      dmgReduction: 3,
    },
  },
  {
    id: 'codex_book_shadow',
    name: '암습 저격 마도서군',
    icon: '📕',
    category: 'skillbook',
    desc: '그림자 속에서 적의 급소를 찌르고 맹독과 정밀 저격을 가하는 암살 교본 3종.',
    requirements: [
      { type: 'skillbook', key: 'book_shadow_step', name: '비전서: 그림자 보법', icon: '👥', amount: 1 },
      { type: 'skillbook', key: 'book_poison_dart', name: '비전서: 맹독 다트', icon: '🎯', amount: 1 },
      { type: 'skillbook', key: 'book_snipe', name: '비전서: 정밀 저격', icon: '🏹', amount: 1 },
    ],
    bonus: {
      label: '파티 행동속도 +4 & 치명타율 +4%',
      spd: 4,
      critRate: 4,
    },
  },
  {
    id: 'codex_book_boss_low',
    name: '지배자의 비전서: 1~5층편',
    icon: '👑',
    category: 'skillbook',
    desc: '1F~5F 보스들의 특수 비기가 담긴 고유 마도서 5종을 모두 수집한 위업.',
    requirements: [
      { type: 'skillbook', key: 'book_boss_colossus_core', name: '비전서: 흑핵의 영구동결 [1F 보스]', icon: '❄️', amount: 1 },
      { type: 'skillbook', key: 'book_boss_deathknight_reap', name: '비전서: 사령의 영혼 수확 [2F 보스]', icon: '💀', amount: 1 },
      { type: 'skillbook', key: 'book_boss_behemoth_eruption', name: '비전서: 광맥의 마도 분출 [3F 보스]', icon: '🌋', amount: 1 },
      { type: 'skillbook', key: 'book_boss_chrono_warp', name: '비전서: 시공간 차원 붕괴 [4F 보스]', icon: '⏳', amount: 1 },
      { type: 'skillbook', key: 'book_boss_void_cataclysm', name: '비전서: 원초의 공허 묵시록 [5F 보스]', icon: '🔮', amount: 1 },
    ],
    bonus: {
      label: '모든 피해 +7% & 공격력 +15',
      allDmgPct: 7,
      atk: 15,
    },
  },
  {
    id: 'codex_book_boss_high',
    name: '군주의 비전서: 6~10층편',
    icon: '📖',
    category: 'skillbook',
    desc: '6F~10F 심연 최심부 군주들의 궁극 절기가 봉인된 고유 마도서 5종.',
    requirements: [
      { type: 'skillbook', key: 'book_boss_blood_monarch', name: '비전서: 진홍의 피의 지배 [6F 보스]', icon: '🍷', amount: 1 },
      { type: 'skillbook', key: 'book_boss_oblivion_scythe', name: '비전서: 망각의 사신 낫 [7F 보스]', icon: '⛓️', amount: 1 },
      { type: 'skillbook', key: 'book_boss_judgment_sanctum', name: '비전서: 단죄의 칠흑 성역 [8F 보스]', icon: '🏰', amount: 1 },
      { type: 'skillbook', key: 'book_boss_mirror_kaleidoscope', name: '비전서: 만화경 환영 폭풍 [9F 보스]', icon: '🪞', amount: 1 },
      { type: 'skillbook', key: 'book_boss_asmodeus_armageddon', name: '비전서: 종말의 심연 아마게돈 [10F 보스]', icon: '🪐', amount: 1 },
    ],
    bonus: {
      label: '모든 피해 +10% & 올스탯 +10 영구 증가',
      allDmgPct: 10,
      atk: 10,
      def: 10,
      spd: 10,
      luck: 10,
    },
  },

  // ── 각 층(1F~10F) 대표 마물 드랍 비기 마도서 컬렉션 ──
  {
    id: 'codex_grimoire_floor_1',
    name: '1F 비기 마도서: 흑핵의 영구동결',
    icon: '❄️',
    category: 'skillbook',
    desc: '심연 1층의 거대한 지배자 [침묵의 흑핵 거신]을 처치하고 추출한 절대 영도의 빙결 비전 마도서.',
    requirements: [
      { type: 'skillbook', key: 'book_boss_colossus_core', name: '비전서: 흑핵의 영구동결 [1F 보스]', icon: '❄️', amount: 1 },
    ],
    bonus: {
      label: '파티 방어력 +8 & 최대 HP +50',
      def: 8,
      hp: 50,
    },
  },
  {
    id: 'codex_grimoire_floor_2',
    name: '2F 비기 마도서: 사령의 영혼 수확',
    icon: '💀',
    category: 'skillbook',
    desc: '심연 2층 납골당의 군주 [망령 군주 데스나이트]의 영혼 수확 절기가 담긴 암흑 흡혈 마도서.',
    requirements: [
      { type: 'skillbook', key: 'book_boss_deathknight_reap', name: '비전서: 사령의 영혼 수확 [2F 보스]', icon: '💀', amount: 1 },
    ],
    bonus: {
      label: '파티 공격력 +10 & 최대 MP +30',
      atk: 10,
      mp: 30,
    },
  },
  {
    id: 'codex_grimoire_floor_3',
    name: '3F 비기 마도서: 광맥의 마도 분출',
    icon: '🌋',
    category: 'skillbook',
    desc: '심연 3층 에테르 광맥의 태고 괴수 [태고의 광맥 베히모스]의 폭발적 화산 마력이 깃든 마도서.',
    requirements: [
      { type: 'skillbook', key: 'book_boss_behemoth_eruption', name: '비전서: 광맥의 마도 분출 [3F 보스]', icon: '🌋', amount: 1 },
    ],
    bonus: {
      label: '파티 공격력 +12 & 최대 HP +80',
      atk: 12,
      hp: 80,
    },
  },
  {
    id: 'codex_grimoire_floor_4',
    name: '4F 비기 마도서: 시공간 차원 붕괴',
    icon: '⏳',
    category: 'skillbook',
    desc: '심연 4층 균열의 지배자 [심연의 시공 왜곡자]의 시공간 왜곡 파동이 봉인된 치명 저격 마도서.',
    requirements: [
      { type: 'skillbook', key: 'book_boss_chrono_warp', name: '비전서: 시공간 차원 붕괴 [4F 보스]', icon: '⏳', amount: 1 },
    ],
    bonus: {
      label: '파티 속도 +4 & 방어력 +10',
      spd: 4,
      def: 10,
    },
  },
  {
    id: 'codex_grimoire_floor_5',
    name: '5F 비기 마도서: 원초의 공허 묵시록',
    icon: '🔮',
    category: 'skillbook',
    desc: '심연 5층 공허의 심장을 잠식한 [공허의 침식자]의 파멸적 공허 마법과 무적 결계 비전서.',
    requirements: [
      { type: 'skillbook', key: 'book_boss_void_cataclysm', name: '비전서: 원초의 공허 묵시록 [5F 보스]', icon: '🔮', amount: 1 },
    ],
    bonus: {
      label: '모든 피해 +5% & 공격력 +15',
      allDmgPct: 5,
      atk: 15,
    },
  },
  {
    id: 'codex_grimoire_floor_6',
    name: '6F 비기 마도서: 진홍의 피의 지배',
    icon: '🍷',
    category: 'skillbook',
    desc: '심연 6층 진홍빛 혈계의 지배자 [핏빛 대공]의 선혈 흡혈과 치명 출혈 파동이 담긴 마도서.',
    requirements: [
      { type: 'skillbook', key: 'book_boss_blood_monarch', name: '비전서: 진홍의 피의 지배 [6F 보스]', icon: '🍷', amount: 1 },
    ],
    bonus: {
      label: '파티 공격력 +16 & 최대 HP +100',
      atk: 16,
      hp: 100,
    },
  },
  {
    id: 'codex_grimoire_floor_7',
    name: '7F 비기 마도서: 망각의 사신 낫',
    icon: '⛓️',
    category: 'skillbook',
    desc: '심연 7층 망각의 묘역을 지키는 [망각의 묘지기]의 거대한 사신 낫 초극딜 참격과 침묵/기절 마도서.',
    requirements: [
      { type: 'skillbook', key: 'book_boss_oblivion_scythe', name: '비전서: 망각의 사신 낫 [7F 보스]', icon: '⛓️', amount: 1 },
    ],
    bonus: {
      label: '파티 방어력 +18 & 피해 감소 +3%',
      def: 18,
      dmgReduction: 3,
    },
  },
  {
    id: 'codex_grimoire_floor_8',
    name: '8F 비기 마도서: 단죄의 칠흑 성역',
    icon: '🏰',
    category: 'skillbook',
    desc: '심연 8층 단죄의 요새를 통솔하는 [타락한 기사단장]의 집행 심판 보호막과 공격력 40% 증폭 비전서.',
    requirements: [
      { type: 'skillbook', key: 'book_boss_judgment_sanctum', name: '비전서: 단죄의 칠흑 성역 [8F 보스]', icon: '🏰', amount: 1 },
    ],
    bonus: {
      label: '파티 공격력 +20 & 방어력 +15',
      atk: 20,
      def: 15,
    },
  },
  {
    id: 'codex_grimoire_floor_9',
    name: '9F 비기 마도서: 만화경 환영 폭풍',
    icon: '🪞',
    category: 'skillbook',
    desc: '심연 9층 거울의 미궁 환영을 엮어내는 [미궁의 지배자]의 마법 관통 파편 폭풍과 회피율 50% 버프 마도서.',
    requirements: [
      { type: 'skillbook', key: 'book_boss_mirror_kaleidoscope', name: '비전서: 만화경 환영 폭풍 [9F 보스]', icon: '🪞', amount: 1 },
    ],
    bonus: {
      label: '파티 행운 +10 & 치명타율 +5%',
      luck: 10,
      critRate: 5,
    },
  },
  {
    id: 'codex_grimoire_floor_10',
    name: '10F 비기 마도서: 종말의 심연 아마게돈',
    icon: '🪐',
    category: 'skillbook',
    desc: '심연 10층 나락의 정점, [심연의 군주 아스모데우스]의 종말 파멸과 5턴 공허 침식 궁극 마도서.',
    requirements: [
      { type: 'skillbook', key: 'book_boss_asmodeus_armageddon', name: '비전서: 종말의 심연 아마게돈 [10F 보스]', icon: '🪐', amount: 1 },
    ],
    bonus: {
      label: '모든 피해 +8% & 올스탯 +12',
      allDmgPct: 8,
      atk: 12,
      def: 12,
      spd: 12,
      luck: 12,
    },
  },
  {
    id: 'codex_grimoire_grand_master',
    name: '심연 10대 군주 대마도 전서',
    icon: '📜',
    category: 'skillbook',
    desc: '심연 1층부터 10층까지 모든 군주 마물의 비기 마도서 10종을 방주 대서고에 집대성한 궁극의 대마도 전서.',
    requirements: [
      { type: 'skillbook', key: 'book_boss_colossus_core', name: '비전서: 흑핵의 영구동결 [1F 보스]', icon: '❄️', amount: 1 },
      { type: 'skillbook', key: 'book_boss_deathknight_reap', name: '비전서: 사령의 영혼 수확 [2F 보스]', icon: '💀', amount: 1 },
      { type: 'skillbook', key: 'book_boss_behemoth_eruption', name: '비전서: 광맥의 마도 분출 [3F 보스]', icon: '🌋', amount: 1 },
      { type: 'skillbook', key: 'book_boss_chrono_warp', name: '비전서: 시공간 차원 붕괴 [4F 보스]', icon: '⏳', amount: 1 },
      { type: 'skillbook', key: 'book_boss_void_cataclysm', name: '비전서: 원초의 공허 묵시록 [5F 보스]', icon: '🔮', amount: 1 },
      { type: 'skillbook', key: 'book_boss_blood_monarch', name: '비전서: 진홍의 피의 지배 [6F 보스]', icon: '🍷', amount: 1 },
      { type: 'skillbook', key: 'book_boss_oblivion_scythe', name: '비전서: 망각의 사신 낫 [7F 보스]', icon: '⛓️', amount: 1 },
      { type: 'skillbook', key: 'book_boss_judgment_sanctum', name: '비전서: 단죄의 칠흑 성역 [8F 보스]', icon: '🏰', amount: 1 },
      { type: 'skillbook', key: 'book_boss_mirror_kaleidoscope', name: '비전서: 만화경 환영 폭풍 [9F 보스]', icon: '🪞', amount: 1 },
      { type: 'skillbook', key: 'book_boss_asmodeus_armageddon', name: '비전서: 종말의 심연 아마게돈 [10F 보스]', icon: '🪐', amount: 1 },
    ],
    bonus: {
      label: '파티 모든 피해 +15% & 올스탯 +15 & 피해 감소 +5%',
      allDmgPct: 15,
      atk: 15,
      def: 15,
      spd: 15,
      luck: 15,
      dmgReduction: 5,
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── 7. 1F~10F 서사 회고록 (Memoirs) — 각 층 쪽지 모아 등록 시 열람 ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'codex_memoir_1',
    name: '1F 회고록: 침묵의 회랑과 부서진 성문',
    icon: '📜',
    category: 'lore',
    desc: '1층 침묵의 회랑 바닥에 흩뿌려진 쪽지들을 모아 복원한 최초의 참상 기록.',
    story: '하늘이 무너져 내리던 날, 지상의 대도시는 순식간에 지하 심연의 입구로 변해버렸다. 피난민들은 성벽 안으로 몰려들었으나 성문은 안쪽에서 굳게 잠겨 있었다. 침묵의 감시자들이 성벽 위에서 내려다보았을 때, 사람들은 비로소 깨달았다. 우리를 지켜주던 자들이 가장 먼저 심연의 어둠에 굴복했음을...',
    requirements: [
      { type: 'memoir_note', key: 'memoir_note_1', name: '1층 회고록 쪽지', icon: '📜', amount: 3 },
    ],
    bonus: {
      label: '파티 피해 감소 +3% & 최대 HP +50',
      dmgReduction: 3,
      hp: 50,
    },
  },
  {
    id: 'codex_memoir_2',
    name: '2F 회고록: 망령의 납골당과 잠들지 못하는 자들',
    icon: '📜',
    category: 'lore',
    desc: '2층 납골당의 무덤 틈새에서 수습한 3장의 쪽지로 완성한 비가.',
    story: '죽은 자들을 위한 안식처였던 납골당은, 심연의 안개가 스며들자 살아남은 자들을 집어삼키는 감옥이 되었다. 원혼들은 차가운 돌벽을 긁어대며 자신들의 이름을 기억해달라고 절규한다. "우리는 죽은 것이 아니라, 영원히 잊혀진 것이다." 그들의 한 맺힌 울부짖음이 지금도 회랑을 울린다.',
    requirements: [
      { type: 'memoir_note', key: 'memoir_note_2', name: '2층 회고록 쪽지', icon: '📜', amount: 3 },
    ],
    bonus: {
      label: '파티 방어력 +12 & 최대 MP +30',
      def: 12,
      mp: 30,
    },
  },
  {
    id: 'codex_memoir_3',
    name: '3F 회고록: 에테르 광맥의 탐욕과 붕괴',
    icon: '📜',
    category: 'lore',
    desc: '3층 광산 카트와 광부들의 유골 사이에서 찾아낸 3장의 채굴 일지 쪽지.',
    story: '더 깊은 곳에서 푸른빛의 에테르 광맥이 터져 나왔을 때, 지도자들은 이것이 인류를 구원할 기적이라 선언했다. 하지만 기적은 독이었다. 광맥을 캐내면 캘수록 대지는 힘을 잃고 균열은 더 넓어졌다. 광맥 깊은 곳에서 태어난 거대한 돌의 골렘이 인간들을 짓밟기 시작했을 때, 이미 돌아갈 길은 무너져 있었다.',
    requirements: [
      { type: 'memoir_note', key: 'memoir_note_3', name: '3층 회고록 쪽지', icon: '📜', amount: 3 },
    ],
    bonus: {
      label: '자원 생산력 +8% & 방어력 +10',
      productionBonusPct: 8,
      def: 10,
    },
  },
  {
    id: 'codex_memoir_4',
    name: '4F 회고록: 심연의 균열, 차원 너머의 시선',
    icon: '📜',
    category: 'lore',
    desc: '4층 시공의 뒤틀림 속에서 흩어진 4장의 쪽지를 엮어 복원한 관측 보고서.',
    story: '공간이 유리창처럼 금이 가더니, 그 틈으로 우리 세계의 것이 아닌 눈동자들이 쏟아져 들어왔다. 물리학도, 마법의 공식도 통하지 않았다. 어제 떠났던 정찰대가 오늘 늙어 죽은 채로 문밖에서 발견되거나, 아직 태어나지 않은 아이의 목소리가 균열 너머에서 들려왔다. 차원의 닻을 내리지 않는다면 우리 모두 시공의 파편이 되리라.',
    requirements: [
      { type: 'memoir_note', key: 'memoir_note_4', name: '4층 회고록 쪽지', icon: '📜', amount: 4 },
    ],
    bonus: {
      label: '파티 행동속도 +4 & 회피/행운 +5',
      spd: 4,
      luck: 5,
    },
  },
  {
    id: 'codex_memoir_5',
    name: '5F 회고록: 원초의 제단, 신을 죽인 의식',
    icon: '📜',
    category: 'lore',
    desc: '5층 피 묻은 제단 모서리에서 발견된 4장의 금기된 제사 수기 쪽지.',
    story: '더 이상 하늘의 신들은 응답하지 않았다. 궁지에 몰린 대사제들은 마지막 방책으로 심연의 모노리스에 신의 심장을 바치는 역(逆)의식을 거행했다. 신이 흘린 피는 대지를 검게 물들였고, 강림한 것은 자비로운 구원자가 아닌 모든 것을 무(無)로 되돌리는 공허의 거수였다. 그날 이후 이 층엔 태양빛이 영원히 사라졌다.',
    requirements: [
      { type: 'memoir_note', key: 'memoir_note_5', name: '5층 회고록 쪽지', icon: '📜', amount: 4 },
    ],
    bonus: {
      label: '모든 피해 +5% & 파티 공격력 +14',
      allDmgPct: 5,
      atk: 14,
    },
  },
  {
    id: 'codex_memoir_6',
    name: '6F 회고록: 핏빛 성역, 광기의 연회',
    icon: '📜',
    category: 'lore',
    desc: '6층 귀족들의 연회장 카펫 밑에 숨겨져 있던 4장의 일기장 쪽지.',
    story: '세상이 불타는 동안에도 이곳의 귀족들은 붉은 포도주를 마시며 음악에 맞춰 춤을 추었다. 포도주가 바닥나자 그들은 종복들의 피를 잔에 채웠고, 결국엔 서로의 목덜미를 물어뜯었다. 영생을 누릴 수만 있다면 괴물이 되어도 상관없다며 미소 짓던 대공의 얼굴... 그것은 인간성이 완전히 파멸한 지옥의 풍경이었다.',
    requirements: [
      { type: 'memoir_note', key: 'memoir_note_6', name: '6층 회고록 쪽지', icon: '📜', amount: 4 },
    ],
    bonus: {
      label: '치명타율 +4% & 공격력 +15',
      critRate: 4,
      atk: 15,
    },
  },
  {
    id: 'codex_memoir_7',
    name: '7F 회고록: 망각의 묘지, 잃어버린 이름들',
    icon: '📜',
    category: 'lore',
    desc: '7층 무명용사들의 묘비명 조각 4장을 모아 맞춘 최후의 유서록.',
    story: '수천 명의 전사들이 이곳에서 칼을 들고 방주의 퇴로를 지켰다. 한 명씩 쓰러질 때마다 땅에 묻혔으나, 무덤이 너무 많아 비석조차 세우지 못했다. 도굴꾼들은 그들의 갑옷을 벗겨 팔아넘겼고, 망령들은 자신들이 왜 싸웠는지조차 잊어버린 채 허공을 헤맨다. 부디 우리를 기억해다오. 우리가 지키려 했던 작은 등불을 꺼뜨리지 말아다오.',
    requirements: [
      { type: 'memoir_note', key: 'memoir_note_7', name: '7층 회고록 쪽지', icon: '📜', amount: 4 },
    ],
    bonus: {
      label: '골드 획득 +8% & 경험치 +8%',
      goldBonusPct: 8,
      expBonusPct: 8,
    },
  },
  {
    id: 'codex_memoir_8',
    name: '8F 회고록: 단죄의 성채, 배반자의 요새',
    icon: '📜',
    category: 'lore',
    desc: '8층 철통같던 성채 사령실의 책상 서랍에서 찾아낸 5장의 군사 기밀 쪽지.',
    story: '철통 요새라 불리던 단죄의 성채는 외부의 적으로 무너진 것이 아니었다. 사령관은 심연의 군주로부터 성채 내 모든 주민의 안전을 약속받고 새벽에 빗장을 풀었다. 그러나 악마와의 계약에 자비란 없었다. 성채는 하룻밤 만에 거대한 도살장이 되었고, 사령관은 단죄의 검을 쥔 채 영원한 광기의 꼭두각시로 전락했다.',
    requirements: [
      { type: 'memoir_note', key: 'memoir_note_8', name: '8층 회고록 쪽지', icon: '📜', amount: 5 },
    ],
    bonus: {
      label: '파티 방어력 +18 & 피해 감소 +4%',
      def: 18,
      dmgReduction: 4,
    },
  },
  {
    id: 'codex_memoir_9',
    name: '9F 회고록: 환영의 미궁, 진실의 거울',
    icon: '📜',
    category: 'lore',
    desc: '9층 거울 파편에 비친 문구들을 기록한 5장의 유리 석판 쪽지.',
    story: '이 미궁에 들어선 자는 누구나 자신이 가장 갈망하는 환상을 보게 된다. 죽었던 가족이 웃으며 달려오고, 폐허가 되었던 고향 마을이 눈부시게 번영해 있다. 수많은 원정대가 그 달콤한 환영에 취해 스스로 눈을 감고 칼을 내려놓았다. 그러나 거울의 뒷면에는 살점을 발라먹는 차가운 미궁의 악귀들이 웃고 있을 뿐이다.',
    requirements: [
      { type: 'memoir_note', key: 'memoir_note_9', name: '9층 회고록 쪽지', icon: '📜', amount: 5 },
    ],
    bonus: {
      label: '파티 행운 +10 & 행동속도 +5',
      luck: 10,
      spd: 5,
    },
  },
  {
    id: 'codex_memoir_10',
    name: '10F 회고록: 심연의 심장부, 종말의 독백',
    icon: '📜',
    category: 'lore',
    desc: '10층 최심부, 종말의 군주 아스모데우스의 옥좌 밑에서 수습한 5장의 고대 쪽지.',
    story: '심연은 자연의 재앙이 아니었다. 그것은 인류 스스로가 끝없는 번영과 영생을 갈망하며 차원의 밑바닥까지 파고 내려간 끝에 깨워버린 행성의 자정 작용이었다. "너희가 쌓아 올린 찬란한 탑이 결국 너희 자신의 무덤이 되었도다." 옥좌에 새겨진 이 문장은, 방주 성채를 이끄는 모든 지휘관들에게 던져진 마지막 경고문이다.',
    requirements: [
      { type: 'memoir_note', key: 'memoir_note_10', name: '10층 회고록 쪽지', icon: '📜', amount: 5 },
    ],
    bonus: {
      label: '모든 피해 +10% & 최대 HP +150 & 공격력 +20',
      allDmgPct: 10,
      hp: 150,
      atk: 20,
    },
  },
  {
    id: 'codex_cemetery_epitaph',
    name: '성채 묘비명: 영원한 불꽃의 결사대',
    icon: '🪦',
    category: 'lore',
    desc: '성채 묘지에 잠든 결사대원들의 숭고한 넋을 기리고 비문을 수습하여 기록한 서사록. (최초로 영웅이 전사하여 묘비명이 새겨져야 등록 가능)',
    story: '심연의 차가운 흑무가 방주를 뒤덮을 때, 물러서지 않고 사선을 지켜낸 영웅들이 있었다. 그들의 유품 무구는 성채의 후대 용병들에게 전해지고, 그들의 영령은 공물과 기도를 통해 다음 원정대의 칼날과 방패가 되어 함께 심연의 밑바닥으로 강하한다. "우리의 육신은 묘비 아래 잠들었으나, 우리의 투지는 방주의 성화와 함께 영원히 타오르리라."',
    requirements: [
      { type: 'cemetery_epitaph', key: 'cemetery', name: '성채 묘비명', icon: '🪦', amount: 1 },
      { type: 'resource', key: 'wood', name: '목재', icon: '🪵', amount: 100 },
      { type: 'resource', key: 'ether', name: '에테르', icon: '🧪', amount: 50 },
    ],
    bonus: {
      label: '파티 전능력치 +2 & 피해 감소 +3%',
      allStatsBonus: 2,
      dmgReduction: 3,
    },
  },

  // ═══════════════════════════════════════════════════════════════════════
  // ── 8. 1F~10F 멸망 이전 세계(구세계)의 고대 오파츠 세트 (층당 1페어, 총 10세트) ──
  // ═══════════════════════════════════════════════════════════════════════
  {
    id: 'codex_ooparts_floor_1',
    name: '1F 오파츠: 도시의 아침 (스마트폰 & 텀블러)',
    icon: '📱',
    category: 'artifact',
    desc: '1F 침묵의 회랑 발굴품 페어. 손바닥 안의 검은 유리판(스마트폰)과 온기를 보존하던 금속 용기(텀블러). 매일 아침 만원 열차에 몸을 싣던 구세계 시민들의 평온한 출근길 일상.',
    story: '이 두 개의 유물은 멸망 이전 인류가 가장 흔하게 지니고 다녔던 쌍둥이 같은 물건이었다. 한 손에는 밤새 충전된 네모난 판(스마트폰)을 들고 손가락을 분주히 움직이며, 다른 한 손에는 얼음이나 뜨거운 커피를 반나절 넘게 지켜주던 텀블러를 쥐었다. 그들은 만원 열차에 몸을 싣고 매일 아침 \'직장\'이라는 곳으로 향했다. 매일 반복되는 피로 속에서도 그들은 불평을 늘어놓을 뿐, 이 거대한 회색 도시와 따뜻한 커피가 영원히 사라질 것이라곤 꿈에도 상상하지 못했다.',
    requirements: [
      { type: 'ooparts', key: 'ooparts_1_1', name: '금이 간 스마트폰 액정', icon: '📱', amount: 1 },
      { type: 'ooparts', key: 'ooparts_1_2', name: '녹슨 스테인리스 텀블러', icon: '🥤', amount: 1 },
    ],
    bonus: {
      label: '파티 최대 HP +40 & 최대 MP +25',
      hp: 40,
      mp: 25,
    },
  },
  {
    id: 'codex_ooparts_floor_2',
    name: '2F 오파츠: 소비와 멜로디 (신용카드 & 카세트)',
    icon: '💳',
    category: 'artifact',
    desc: '2F 망령의 납골당 발굴품 페어. 실물 화폐 대신 신용이라는 숫자로 물건을 사고, 자성 띠에 녹음된 사랑의 유행가에 울고 웃던 대중문화의 황금기.',
    story: '이 작은 얇은 플라스틱 조각 하나만 긁으면 산더미 같은 옷과 음식이 손에 들어왔다. 인류는 물물교환의 시대를 아득히 넘어 보이지 않는 \'신용\'이라는 숫자의 신기루 위에서 끝없는 번영을 누렸다. 카세트 플레이어에서는 그 여름 젊은이들의 심장을 뛰게 했던 사랑의 노랫소리가 흘러나왔다. 하지만 흑무가 하늘을 가린 그 날, 은행의 서버가 꺼지고 신용은 단 1초 만에 휴짓조각이 되었으며, 카세트 테이프엔 영원히 끝나지 않는 정적과 잡음만이 봉인되었다.',
    requirements: [
      { type: 'ooparts', key: 'ooparts_2_1', name: '빛바랜 플라스틱 신용카드', icon: '💳', amount: 1 },
      { type: 'ooparts', key: 'ooparts_2_2', name: '먼지 쌓인 카세트 테이프', icon: '📼', amount: 1 },
    ],
    bonus: {
      label: '골드 획득 +5% & 파티 행운 +3',
      goldBonusPct: 5,
      luck: 3,
    },
  },
  {
    id: 'codex_ooparts_floor_3',
    name: '3F 오파츠: 철야의 연구실 (리튬 배터리 & 머그잔)',
    icon: '🔋',
    category: 'artifact',
    desc: '3F 에테르 광맥 발굴품 페어. 고갈되는 자원을 대체할 무한 에너지를 찾기 위해 연구실에서 커피를 들이켜며 밤을 지새우던 과학자들의 흔적.',
    story: '연구소의 차가운 금속 테이블 위에는 늘 식어버린 커피가 담긴 머그잔과 방전된 고밀도 배터리 셀들이 굴러다녔다. 화석 연료가 바닥나고 세계가 에너지 전쟁의 벼랑 끝으로 몰리자, 그들은 손가락만 한 배터리에 벼락 수백 번 분량의 힘을 압축하거나 차원 너머의 에테르 기류를 끌어오려는 위험한 실험을 감행했다. "새로운 지평이 열릴 것이다"라고 머그잔을 쥐며 웃던 연구원들의 마지막 일지 뒤편에는, 통제를 벗어난 차원 균열의 비명만이 기록되어 있다.',
    requirements: [
      { type: 'ooparts', key: 'ooparts_3_1', name: '방전된 리튬 배터리', icon: '🔋', amount: 1 },
      { type: 'ooparts', key: 'ooparts_3_2', name: '금이 간 세라믹 머그잔', icon: '☕', amount: 1 },
    ],
    bonus: {
      label: '파티 공격력 +8 & 시설 유지비 -3% 감면',
      atk: 8,
      upkeepDiscountPct: 3,
    },
  },
  {
    id: 'codex_ooparts_floor_4',
    name: '4F 오파츠: 11시 47분의 대피령 (지하철 노선도 & 쿼츠 시계)',
    icon: '⌚',
    category: 'artifact',
    desc: '4F 심연의 균열 발굴품 페어. 거대 도시의 지하 신경망 노선도와 공습 사이렌 속에서 11시 47분에 멈춰버린 정밀 바늘 시계의 비극.',
    story: '이 손목시계의 초침은 11시 47분 23초에 정확히 얼어붙어 있다. 광화문과 강남을 잇는 거대한 지하철 노선도가 피와 진흙에 젖어 구겨진 것은 바로 그 시각이었다. 하늘에서 정체불명의 보랏빛 흑무가 쏟아져 내리자 수십만 명의 시민들이 지하 대피소로 지정된 지하철 승강장으로 밀려들었다. 열차의 전기가 끊기고 비상등이 깜빡이며 문이 닫히지 않던 그 찰나의 공포. 초침은 멈췄지만, 그들이 필사적으로 도망치려 했던 발걸음의 흔적은 지하 4층의 암반 속에 깊이 각인되었다.',
    requirements: [
      { type: 'ooparts', key: 'ooparts_4_1', name: '찢겨진 지하철 노선도', icon: '🗺️', amount: 1 },
      { type: 'ooparts', key: 'ooparts_4_2', name: '멈춰버린 쿼츠 손목시계', icon: '⌚', amount: 1 },
    ],
    bonus: {
      label: '파티 행동속도 +3 & 치명타율 +2%',
      spd: 3,
      critRate: 2,
    },
  },
  {
    id: 'codex_ooparts_floor_5',
    name: '5F 오파츠: 마지막 등굣길 (부서진 헤드폰 & 학생증)',
    icon: '🪪',
    category: 'artifact',
    desc: '5F 원초의 제단 발굴품 페어. 소음을 차단하고 음악에 몰입하던 귀마개와 책가방을 메고 학교로 향하던 어느 소년의 앳된 사진.',
    story: '학생증 속 소년은 둥근 안경 너머로 쑥스러운 미소를 짓고 있다. 목에 걸린 커다란 헤드폰은 세상의 모든 소음을 지우고 오직 좋아하는 음악만이 귓가에 울리게 해주던 물건이었다. \'3학년 2반 민우\'. 소년은 시험 걱정을 하며 교문을 나섰을 것이다. 하굣길 노을빛이 보랏빛 심연으로 물들었을 때, 소년은 헤드폰을 벗고 도대체 무슨 소리를 들었던 것일까? 돌아오지 못한 책가방과 학생증만이 방주의 깊은 회랑에서 발견되었다.',
    requirements: [
      { type: 'ooparts', key: 'ooparts_5_1', name: '부서진 헤드폰', icon: '🎧', amount: 1 },
      { type: 'ooparts', key: 'ooparts_5_2', name: '비닐 코팅된 학생증', icon: '🪪', amount: 1 },
    ],
    bonus: {
      label: '경험치 획득 +5% & 파티 피해 감소 +2%',
      expBonusPct: 5,
      dmgReduction: 2,
    },
  },
  {
    id: 'codex_ooparts_floor_6',
    name: '6F 오파츠: 멸망 전야의 낭만 (와인 오프너 & 립스틱)',
    icon: '🍷',
    category: 'artifact',
    desc: '6F 핏빛 성역 발굴품 페어. 종말이 문턱까지 다가왔음을 잊으려 화려하게 꾸미고 붉은 포도주 축배를 들었던 연인들의 마지막 잔해.',
    story: '거울 앞에 앉아 입술을 붉게 물들이던 여인의 손길과, 코르크 마개를 경쾌하게 뽑아내며 붉은 포도주를 따르던 남자의 웃음소리. 사람들은 국경선 너머에서 흑무가 모든 도시를 집어삼키고 있다는 뉴스를 애써 외면했다. "오늘 밤만큼은 우리만을 위해 마시자." 화려한 스카이라인을 배경으로 와인잔이 부딪치던 멸망 전야의 만찬. 남겨진 립스틱 케이스 밑면에는 희미하게 지워진 필체로 \'나를 잊지 말아줘\'라는 글귀가 새겨져 있다.',
    requirements: [
      { type: 'ooparts', key: 'ooparts_6_1', name: '녹슨 와인 오프너', icon: '🍷', amount: 1 },
      { type: 'ooparts', key: 'ooparts_6_2', name: '말라붙은 립스틱 케이스', icon: '💄', amount: 1 },
    ],
    bonus: {
      label: '파티 공격력 +10 & 파티 행운 +4',
      atk: 10,
      luck: 4,
    },
  },
  {
    id: 'codex_ooparts_floor_7',
    name: '7F 오파츠: 빛바랜 바다의 맹세 (폴라로이드 & 3색 볼펜)',
    icon: '📷',
    category: 'artifact',
    desc: '7F 망각의 묘지 발굴품 페어. 눈부신 모래사장과 에메랄드빛 파도, 그리고 사진 뒤편에 꾹꾹 눌러쓴 영원의 약속.',
    story: '방주 성채에 태어난 아이들은 \'바다\'라는 것을 본 적이 없다. 하지만 이 한 장의 사진 속에는 끝없이 펼쳐진 푸른 물결과 부서지는 백파, 밀짚모자를 쓰고 브이(V) 자를 그리며 활짝 웃는 어린 딸과 부모가 담겨 있다. 굳어버린 3색 볼펜으로 사진 뒷면에 눌러쓴 삐뚤빼뚤한 글씨: "202X년 8월, 우리 가족 첫 동해 여행. 다음 여름엔 제주도 가자!" 그 다음 여름은 영원히 오지 않았지만, 한 가족이 누렸던 가장 찬란했던 여름 한낮의 햇살은 차가운 심연에서도 따스하게 숨쉬고 있다.',
    requirements: [
      { type: 'ooparts', key: 'ooparts_7_1', name: '빛바랜 폴라로이드 사진', icon: '📷', amount: 1 },
      { type: 'ooparts', key: 'ooparts_7_2', name: '굳어버린 3색 볼펜', icon: '🖊️', amount: 1 },
    ],
    bonus: {
      label: '파티 방어력 +10 & HP +50 & 자원 생산 +5%',
      def: 10,
      hp: 50,
      productionBonusPct: 5,
    },
  },
  {
    id: 'codex_ooparts_floor_8',
    name: '8F 오파츠: 최후 방어선의 SOS (무전기 트랜시버 & 안경테)',
    icon: '📻',
    category: 'artifact',
    desc: '8F 단죄의 성채 발굴품 페어. 핏빛으로 물든 안경 너머로 쏟아지는 괴수들을 보며 마지막 조난 신호를 타전했던 방위군의 유품.',
    story: '군용 티타늄 안경테는 한쪽 렌즈가 깨져 있고 테가 심하게 일그러져 있다. 무전기의 송신 버튼은 누른 채로 굳어 있었다. "...지휘부 응답하라. 제8방어선 방벽이 무너졌다. 총알이 통하지 않는다. 괴물들이... 안개 속에서 기어나온다. 민간인 수송기는 이륙했는가? ...응답할 필요 없다. 우리는 끝까지 남아서 진입로를 폭파하겠다. 신이시여 인류를 굽어살피소서." 마지막 찰칵 소리와 함께 끊어진 신호. 그들이 목숨을 바쳐 벌어준 30분 덕분에, 인류의 씨앗을 실은 초기 방주가 지하 격납고를 빠져나올 수 있었다.',
    requirements: [
      { type: 'ooparts', key: 'ooparts_8_1', name: '부서진 무전기 트랜시버', icon: '📻', amount: 1 },
      { type: 'ooparts', key: 'ooparts_8_2', name: '찌그러진 티타늄 안경테', icon: '👓', amount: 1 },
    ],
    bonus: {
      label: '파티 방어력 +14 & 치명타율 +3%',
      def: 14,
      critRate: 3,
    },
  },
  {
    id: 'codex_ooparts_floor_9',
    name: '9F 오파츠: 빛의 기록관 (홀로그램 큐브 & 카메라 렌즈)',
    icon: '🧊',
    category: 'artifact',
    desc: '9F 환영의 미궁 발굴품 페어. 허공에 광자로 도시를 세우던 기술과, 멸망의 순간마저 렌즈에 담아 후대에 전하려 했던 기록자.',
    story: '큐브에 미세한 마력을 주입하면, 지지직거리는 노이즈 속에서 구세계의 마천루와 하늘을 가르는 비행체들의 입체 잔상이 유령처럼 허공에 떠오른다. 그리고 그 옆에는 고열에 조리개가 녹아붙은 고배율 카메라 렌즈가 놓여 있다. 그 기록자는 도망치는 대신 무너져 내리는 문명의 중심탑 꼭대기로 올라가 셔터를 눌렀다. "후대에 이 기록을 발견할 누군가에게. 우리는 교만하여 별을 손에 쥐려 했고, 그 대가로 대지를 잃었다. 그러나 우리의 실패가 너희의 길잡이가 되기를 바란다."',
    requirements: [
      { type: 'ooparts', key: 'ooparts_9_1', name: '홀로그램 디스플레이 큐브', icon: '🧊', amount: 1 },
      { type: 'ooparts', key: 'ooparts_9_2', name: '녹아내린 카메라 렌즈', icon: '🔍', amount: 1 },
    ],
    bonus: {
      label: '모든 피해 +4% & 속도 +3 & 파티 행운 +6',
      allDmgPct: 4,
      spd: 3,
      luck: 6,
    },
  },
  {
    id: 'codex_ooparts_floor_10',
    name: '10F 오파츠: 타임캡슐 특이점 (양자 코어 & 황동 열쇠)',
    icon: '🗝️',
    category: 'artifact',
    desc: '10F 심연의 심장부 발굴품 페어. 인공지능이 스스로 사유하던 특이점의 칩셋과 최후의 방공호 타임캡슐을 열 황동 마스터 키.',
    story: '나노미터 단위의 실리콘 회로 속에 인류의 모든 철학과 예술, 유전체 정보가 암호화되어 잠들어 있는 초소형 양자 코어. 그리고 지극히 아날로그적인 무거운 황동 열쇠 하나. 최첨단 AI와 투박한 열쇠의 조합은 구세계 인류가 남긴 가장 깊은 역설이다. 모든 전자 네트워크가 붕괴할 것을 예견한 그들은 가장 깊은 지하 화강암반 속에 타임캡슐 벙커를 짓고 물리적인 열쇠로 걸어 잠갔다. "우리는 실패했으나 문명은 죽지 않았다. 이 열쇠를 쥔 자여, 심연의 바닥에서 인류의 두 번째 새벽을 열어라."',
    requirements: [
      { type: 'ooparts', key: 'ooparts_10_1', name: '양자 코어 칩셋', icon: '💾', amount: 1 },
      { type: 'ooparts', key: 'ooparts_10_2', name: '타임캡슐 황동 열쇠', icon: '🗝️', amount: 1 },
    ],
    bonus: {
      label: '모든 피해 +6% & 공격력 +15 & 최대 MP +50 & 골드 +10% & 자원 생산 +10% & 방어력 +15',
      allDmgPct: 6,
      atk: 15,
      mp: 50,
      goldBonusPct: 10,
      productionBonusPct: 10,
      def: 15,
    },
  },
];
