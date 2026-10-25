// ─── 게임 아이콘 통합 매핑 테이블 (이미지 에셋 경로 + Fallback 이모지) ─────────────
import { FORGE_TIER_NAMES, BOSS_UNIQUE_DEFINITIONS, CLASS_HONOR_SHOP_DEFINITIONS } from '../data/equipment';
import { MONSTERS } from '../data/monsters';

export interface IconMeta {
  src: string;
  fallback: string;
  label?: string;
}

export const ICON_MAP: Record<string, IconMeta> = {
  // 🪵 6대 기본 자원
  wood: { src: '/assets/custom_uploaded/icons/wood.png', fallback: '🪵', label: '목재' },
  stone: { src: '/assets/custom_uploaded/icons/stone.png', fallback: '🪨', label: '석재' },
  iron: { src: '/assets/custom_uploaded/icons/iron.png', fallback: '⚙️', label: '철광석' },
  food: { src: '/assets/custom_uploaded/icons/food.png', fallback: '🍖', label: '식량' },
  gold: { src: '/assets/custom_uploaded/icons/gold.png', fallback: '🪙', label: '골드' },
  ether: { src: '/assets/custom_uploaded/icons/ether.png', fallback: '✨', label: '에테르' },

  // 🌿 던전 파밍 재료 (5종)
  herb: { src: '/assets/custom_uploaded/icons/herb.png', fallback: '🌿', label: '약초' },
  leather: { src: '/assets/custom_uploaded/icons/leather.png', fallback: '🥋', label: '가죽' },
  silk: { src: '/assets/custom_uploaded/icons/silk.png', fallback: '🧵', label: '실크' },
  coal: { src: '/assets/custom_uploaded/icons/coal.png', fallback: '⬛', label: '석탄' },
  bone: { src: '/assets/custom_uploaded/icons/bone.png', fallback: '🦴', label: '짐승 뼈' },

  // 🔮 심연 희귀 유물 (3종)
  crystal: { src: '/assets/custom_uploaded/icons/crystal.png', fallback: '💎', label: '마력 수정' },
  void_shard: { src: '/assets/custom_uploaded/icons/void_shard.png', fallback: '🌌', label: '공허의 파편' },
  dark_essence: { src: '/assets/custom_uploaded/icons/void_shard.png', fallback: '🌑', label: '암흑 정수' },

  // ✨ 인챈트 마도석 (5종)
  prefix_stone: { src: '/assets/custom_uploaded/icons/prefix_stone.png', fallback: '✨', label: '일반 접두석' },
  suffix_stone: { src: '/assets/custom_uploaded/icons/suffix_stone.png', fallback: '🔮', label: '일반 접미석' },
  pure_prefix_stone: { src: '/assets/custom_uploaded/icons/pure_prefix_stone.png', fallback: '⭐', label: '순수 접두석' },
  pure_suffix_stone: { src: '/assets/custom_uploaded/icons/pure_suffix_stone.png', fallback: '🌌', label: '순수 접미석' },
  pure_mana_stone: { src: '/assets/custom_uploaded/icons/pure_mana_stone.png', fallback: '💠', label: '순수 마도석' },

  // 👑 10대 보스 신화 유물
  relic_floor_1: { src: '/assets/custom_uploaded/icons/relic_floor_1.png', fallback: '🖤', label: '침묵의 흑핵' },
  relic_floor_2: { src: '/assets/custom_uploaded/icons/relic_floor_2.png', fallback: '👻', label: '망령의 영혼수정' },
  relic_floor_3: { src: '/assets/custom_uploaded/icons/relic_floor_3.png', fallback: '🫀', label: '원초의 광맥 심장' },
  relic_floor_4: { src: '/assets/custom_uploaded/icons/relic_floor_4.png', fallback: '⚓', label: '심연의 시공 닻' },
  relic_floor_5: { src: '/assets/custom_uploaded/icons/relic_floor_5.png', fallback: '👁️', label: '공허 지배자의 핵' },
  relic_floor_6: { src: '/assets/custom_uploaded/icons/relic_floor_6.png', fallback: '🍷', label: '진홍 성배' },
  relic_floor_7: { src: '/assets/custom_uploaded/icons/relic_floor_7.png', fallback: '🧭', label: '영혼 나침반' },
  relic_floor_8: { src: '/assets/custom_uploaded/icons/relic_floor_8.png', fallback: '🛡️', label: '기사단장 휘장' },
  relic_floor_9: { src: '/assets/custom_uploaded/icons/relic_floor_9.png', fallback: '🪞', label: '거울 파편' },
  relic_floor_10: { src: '/assets/custom_uploaded/icons/relic_floor_10.png', fallback: '👑', label: '심연 군주의 마핵' },

  // 📜 심연 회고록 쪽지 (10종)
  memoir_note_1: { src: '/assets/custom_uploaded/icons/memoir_note.png', fallback: '📜', label: '1층 회고록 쪽지' },
  memoir_note_2: { src: '/assets/custom_uploaded/icons/memoir_note.png', fallback: '📜', label: '2층 회고록 쪽지' },
  memoir_note_3: { src: '/assets/custom_uploaded/icons/memoir_note.png', fallback: '📜', label: '3층 회고록 쪽지' },
  memoir_note_4: { src: '/assets/custom_uploaded/icons/memoir_note.png', fallback: '📜', label: '4층 회고록 쪽지' },
  memoir_note_5: { src: '/assets/custom_uploaded/icons/memoir_note.png', fallback: '📜', label: '5층 회고록 쪽지' },
  memoir_note_6: { src: '/assets/custom_uploaded/icons/memoir_note.png', fallback: '📜', label: '6층 회고록 쪽지' },
  memoir_note_7: { src: '/assets/custom_uploaded/icons/memoir_note.png', fallback: '📜', label: '7층 회고록 쪽지' },
  memoir_note_8: { src: '/assets/custom_uploaded/icons/memoir_note.png', fallback: '📜', label: '8층 회고록 쪽지' },
  memoir_note_9: { src: '/assets/custom_uploaded/icons/memoir_note.png', fallback: '📜', label: '9층 회고록 쪽지' },
  memoir_note_10: { src: '/assets/custom_uploaded/icons/memoir_note.png', fallback: '📜', label: '10층 회고록 쪽지' },

  // 🏛️ 구세계 오파츠 (20종)
  ooparts_1_1: { src: '/assets/custom_uploaded/icons/ooparts_1_1.png', fallback: '📱', label: '금이 간 스마트폰 액정' },
  ooparts_1_2: { src: '/assets/custom_uploaded/icons/ooparts_1_2.png', fallback: '🥤', label: '녹슨 스테인리스 텀블러' },
  ooparts_2_1: { src: '/assets/custom_uploaded/icons/ooparts_2_1.png', fallback: '💳', label: '빛바랜 플라스틱 신용카드' },
  ooparts_2_2: { src: '/assets/custom_uploaded/icons/ooparts_2_2.png', fallback: '📼', label: '먼지 쌓인 카세트 테이프' },
  ooparts_3_1: { src: '/assets/custom_uploaded/icons/ooparts_3_1.png', fallback: '🔋', label: '방전된 리튬 배터리' },
  ooparts_3_2: { src: '/assets/custom_uploaded/icons/ooparts_3_2.png', fallback: '☕', label: '금이 간 세라믹 머그잔' },
  ooparts_4_1: { src: '/assets/custom_uploaded/icons/ooparts_4_1.png', fallback: '🗺️', label: '찢겨진 지하철 노선도' },
  ooparts_4_2: { src: '/assets/custom_uploaded/icons/ooparts_4_2.png', fallback: '⌚', label: '멈춰버린 쿼츠 손목시계' },
  ooparts_5_1: { src: '/assets/custom_uploaded/icons/ooparts_5_1.png', fallback: '🎧', label: '부서진 헤드폰' },
  ooparts_5_2: { src: '/assets/custom_uploaded/icons/ooparts_5_2.png', fallback: '🪪', label: '비닐 코팅된 학생증' },
  ooparts_6_1: { src: '/assets/custom_uploaded/icons/ooparts_6_1.png', fallback: '🍷', label: '녹슨 와인 오프너' },
  ooparts_6_2: { src: '/assets/custom_uploaded/icons/ooparts_6_2.png', fallback: '💄', label: '말라붙은 립스틱 케이스' },
  ooparts_7_1: { src: '/assets/custom_uploaded/icons/ooparts_7_1.png', fallback: '📷', label: '빛바랜 폴라로이드 사진' },
  ooparts_7_2: { src: '/assets/custom_uploaded/icons/ooparts_7_2.png', fallback: '🖊️', label: '굳어버린 3색 볼펜' },
  ooparts_8_1: { src: '/assets/custom_uploaded/icons/ooparts_8_1.png', fallback: '📻', label: '부서진 무전기 트랜시버' },
  ooparts_8_2: { src: '/assets/custom_uploaded/icons/ooparts_8_2.png', fallback: '👓', label: '찌그러진 티타늄 안경테' },
  ooparts_9_1: { src: '/assets/custom_uploaded/icons/ooparts_9_1.png', fallback: '🧊', label: '홀로그램 디스플레이 큐브' },
  ooparts_9_2: { src: '/assets/custom_uploaded/icons/ooparts_9_2.png', fallback: '🔍', label: '녹아내린 카메라 렌즈' },
  ooparts_10_1: { src: '/assets/custom_uploaded/icons/ooparts_10_1.png', fallback: '💾', label: '양자 코어 칩셋' },
  ooparts_10_2: { src: '/assets/custom_uploaded/icons/ooparts_10_2.png', fallback: '🗝️', label: '타임캡슐 황동 열쇠' },

  // 🔥 8대 보급품 및 강화 보급품
  torch: { src: '/assets/custom_uploaded/icons/torch.png', fallback: '🔥', label: '탐험 횃불' },
  pickaxe: { src: '/assets/custom_uploaded/icons/pickaxe.png', fallback: '⛏️', label: '단단한 곡괭이' },
  bandage: { src: '/assets/custom_uploaded/icons/bandage.png', fallback: '🩹', label: '치유 붕대' },
  holy_water: { src: '/assets/custom_uploaded/icons/holy_water.png', fallback: '💧', label: '정화 성수' },
  key: { src: '/assets/custom_uploaded/icons/key.png', fallback: '🗝️', label: '만능 열쇠' },
  golden_toad: { src: '/assets/custom_uploaded/icons/golden_toad.png', fallback: '🐸', label: '황금 두꺼비' },
  skeleton_key: { src: '/assets/custom_uploaded/icons/key.png', fallback: '🔑', label: '해골 열쇠' },
  rift_anchor: { src: '/assets/custom_uploaded/icons/rift_anchor.png', fallback: '⚓', label: '차원의 닻' },
  compass: { src: '/assets/custom_uploaded/icons/compass.png', fallback: '🧭', label: '심연 나침반' },
  blood_contract: { src: '/assets/custom_uploaded/icons/blood_contract.png', fallback: '📜', label: '피의 서약서' },
  dimensional_whistle: { src: '/assets/custom_uploaded/icons/dimensional_whistle.png', fallback: '📯', label: '차원의 호각' },
  // ✨ 강화 보급품 7종
  enhanced_torch: { src: '/assets/custom_uploaded/icons/enhanced_torch.png', fallback: '✨🔥', label: '에테르 횃불 (강화)' },
  enhanced_food: { src: '/assets/custom_uploaded/icons/enhanced_food.png', fallback: '🍱✨', label: '던전 도시락 (강화)' },
  enhanced_pickaxe: { src: '/assets/custom_uploaded/icons/enhanced_pickaxe.png', fallback: '⛏️✨', label: '심연 곡괭이 (강화)' },
  enhanced_bandage: { src: '/assets/custom_uploaded/icons/enhanced_bandage.png', fallback: '🩹✨', label: '성유 붕대 (강화)' },
  enhanced_holy_water: { src: '/assets/custom_uploaded/icons/enhanced_holy_water.png', fallback: '💧✨', label: '여신의 성수 (강화)' },
  enhanced_key: { src: '/assets/custom_uploaded/icons/enhanced_key.png', fallback: '🗝️✨', label: '황금 열쇠 (강화)' },
  enhanced_rift_anchor: { src: '/assets/custom_uploaded/icons/enhanced_rift_anchor.png', fallback: '⚓✨', label: '심연의 닻 (강화)' },

  // ── 🎁 촉매 마도석 & 보급품 묶음 팩 (커스텀 아이콘 연동) ──
  prefix_stone_pack_10: { src: '/assets/custom_uploaded/icons/prefix_stone.png', fallback: '✨', label: '일반 접두석 묶음' },
  suffix_stone_pack_10: { src: '/assets/custom_uploaded/icons/suffix_stone.png', fallback: '🔮', label: '일반 접미석 묶음' },
  pure_prefix_pack_10: { src: '/assets/custom_uploaded/icons/pure_prefix_stone.png', fallback: '⭐', label: '순수 접두석 묶음' },
  pure_suffix_pack_10: { src: '/assets/custom_uploaded/icons/pure_suffix_stone.png', fallback: '🌙', label: '순수 접미석 묶음' },
  pure_mana_stone_pack_5: { src: '/assets/custom_uploaded/icons/pure_mana_stone.png', fallback: '💠', label: '순수 마도석 세트' },
  void_shard_pack_5: { src: '/assets/custom_uploaded/icons/void_shard.png', fallback: '🌌', label: '공허 파편 세트' },
  food_pack: { src: '/assets/custom_uploaded/icons/food.png', fallback: '🍖', label: '특제 원정 보급 식량 세트' },
  torch_pack: { src: '/assets/custom_uploaded/icons/torch.png', fallback: '🔥', label: '에테르 횃불 세트' },
  enhanced_torch_pack_5: { src: '/assets/custom_uploaded/icons/enhanced_torch.png', fallback: '✨🔥', label: '에테르 횃불 세트 (5개)' },
  enhanced_torch_pack_10: { src: '/assets/custom_uploaded/icons/enhanced_torch.png', fallback: '✨🔥', label: '에테르 횃불 대형 세트 (10개)' },
  enhanced_food_pack_5: { src: '/assets/custom_uploaded/icons/enhanced_food.png', fallback: '🍱✨', label: '던전 도시락 세트 (5개)' },
  enhanced_food_pack_10: { src: '/assets/custom_uploaded/icons/enhanced_food.png', fallback: '🍱✨', label: '던전 도시락 대형 세트 (10개)' },
  enhanced_pickaxe_pack_5: { src: '/assets/custom_uploaded/icons/enhanced_pickaxe.png', fallback: '⛏️✨', label: '심연 곡괭이 세트 (5개)' },
  enhanced_pickaxe_pack_10: { src: '/assets/custom_uploaded/icons/enhanced_pickaxe.png', fallback: '⛏️✨', label: '심연 곡괭이 대형 세트 (10개)' },
  enhanced_bandage_pack_5: { src: '/assets/custom_uploaded/icons/enhanced_bandage.png', fallback: '🩹✨', label: '성유 붕대 세트 (5개)' },
  enhanced_bandage_pack_10: { src: '/assets/custom_uploaded/icons/enhanced_bandage.png', fallback: '🩹✨', label: '성유 붕대 대형 세트 (10개)' },
  enhanced_holy_water_pack_5: { src: '/assets/custom_uploaded/icons/enhanced_holy_water.png', fallback: '💧✨', label: '여신의 성수 세트 (5개)' },
  enhanced_holy_water_pack_10: { src: '/assets/custom_uploaded/icons/enhanced_holy_water.png', fallback: '💧✨', label: '여신의 성수 대형 세트 (10개)' },
  enhanced_key_pack_5: { src: '/assets/custom_uploaded/icons/enhanced_key.png', fallback: '🗝️✨', label: '황금 열쇠 세트 (5개)' },
  enhanced_key_pack_10: { src: '/assets/custom_uploaded/icons/enhanced_key.png', fallback: '🗝️✨', label: '황금 열쇠 대형 세트 (10개)' },
  enhanced_rift_anchor_pack_5: { src: '/assets/custom_uploaded/icons/enhanced_rift_anchor.png', fallback: '⚓✨', label: '심연의 닻 세트 (5개)' },
  enhanced_rift_anchor_pack_10: { src: '/assets/custom_uploaded/icons/enhanced_rift_anchor.png', fallback: '⚓✨', label: '심연의 닻 대형 세트 (10개)' },

  // 🌌 네메시스 마일스톤 정벌 장비 세트 3종 (커스텀 에셋)
  equip_nemesis_pendant: { src: '/assets/custom_uploaded/icons/equip_nemesis_pendant.png', fallback: '📿', label: '시공의 왜곡 펜던트 (네메시스)' },
  equip_nemesis_core: { src: '/assets/custom_uploaded/icons/equip_nemesis_core.png', fallback: '👑', label: '네메시스 종말 성핵' },
  equip_nemesis_crown: { src: '/assets/custom_uploaded/icons/equip_nemesis_crown.png', fallback: '🌌', label: '패왕 네메시스 파멸 관' },
  nemesis_pendant: { src: '/assets/custom_uploaded/icons/equip_nemesis_pendant.png', fallback: '📿', label: '시공의 왜곡 펜던트 (네메시스)' },
  nemesis_core: { src: '/assets/custom_uploaded/icons/equip_nemesis_core.png', fallback: '👑', label: '네메시스 종말 성핵' },
  nemesis_crown: { src: '/assets/custom_uploaded/icons/equip_nemesis_crown.png', fallback: '🌌', label: '패왕 네메시스 파멸 관' },

  // 🩸 상태이상 (14종)
  bleed: { src: '/assets/custom_uploaded/icons/bleed.png', fallback: '🩸', label: '출혈' },
  poison: { src: '/assets/custom_uploaded/icons/poison.png', fallback: '☠️', label: '중독' },
  burn: { src: '/assets/custom_uploaded/icons/burn.png', fallback: '🔥', label: '화상' },
  freeze: { src: '/assets/custom_uploaded/icons/freeze.png', fallback: '❄️', label: '냉각' },
  stun: { src: '/assets/custom_uploaded/icons/stun.png', fallback: '💫', label: '기절' },
  shield: { src: '/assets/custom_uploaded/icons/shield.png', fallback: '🛡️', label: '보호막' },
  debuff_atk: { src: '/assets/custom_uploaded/icons/debuff_atk.png', fallback: '🔻', label: '공격력 약화' },
  debuff_def: { src: '/assets/custom_uploaded/icons/debuff_def.png', fallback: '💔', label: '방어력 약화' },
  buff_atk: { src: '/assets/custom_uploaded/icons/buff_atk.png', fallback: '🔺', label: '공격력 강화' },
  buff_def: { src: '/assets/custom_uploaded/icons/buff_def.png', fallback: '🔰', label: '방어력 강화' },
  regen: { src: '/assets/custom_uploaded/icons/regen.png', fallback: '💚', label: '재생' },
  blind: { src: '/assets/custom_uploaded/icons/blind.png', fallback: '👁️', label: '실명' },
  riposte: { src: '/assets/custom_uploaded/icons/riposte.png', fallback: '⚡', label: '환영반격' },
  immunity: { src: '/assets/custom_uploaded/icons/immunity.png', fallback: '🌟', label: '디버프 면역' },
  aether_barrier: { src: '/assets/custom_uploaded/icons/aether_barrier.png', fallback: '🛡️', label: '에테르 방벽' },
  groggy: { src: '/assets/custom_uploaded/icons/groggy.png', fallback: '💫', label: '그로기 (행동불능)' },
  overcharge: { src: '/assets/custom_uploaded/icons/overcharge.png', fallback: '⚡', label: '심연 오버차지' },
  warmth: { src: '/assets/custom_uploaded/icons/warmth.png', fallback: '🔥', label: '성화의 온기' },
  stealth: { src: '/assets/custom_uploaded/icons/stealth.png', fallback: '👤', label: '은신' },
  vampiric: { src: '/assets/custom_uploaded/icons/vampiric.png', fallback: '🩸', label: '흡혈' },
  true_damage: { src: '/assets/custom_uploaded/icons/true_damage.png', fallback: '✨', label: '순수 피해' },

  // ⚔️ 장비 슬롯 / 타입 / 레시피
  weapon_sword: { src: '/assets/custom_uploaded/icons/weapon_sword.png', fallback: '⚔️', label: '검' },
  weapon_spear: { src: '/assets/custom_uploaded/icons/weapon_sword.png', fallback: '🔱', label: '창' },
  weapon_axe: { src: '/assets/custom_uploaded/icons/weapon_axe.png', fallback: '🪓', label: '도끼' },
  weapon_bow: { src: '/assets/custom_uploaded/icons/weapon_bow.png', fallback: '🏹', label: '활' },
  weapon_staff: { src: '/assets/custom_uploaded/icons/weapon_staff.png', fallback: '🪄', label: '지팡이' },
  weapon_dagger: { src: '/assets/custom_uploaded/icons/weapon_dagger.png', fallback: '🔪', label: '단검' },
  weapon_gun: { src: '/assets/custom_uploaded/icons/weapon_gun.png', fallback: '🔫', label: '총기' },
  armor_heavy: { src: '/assets/custom_uploaded/icons/armor_heavy.png', fallback: '🛡️', label: '중갑' },
  armor_leather: { src: '/assets/custom_uploaded/icons/armor_leather.png', fallback: '🥋', label: '경갑' },
  armor_robe: { src: '/assets/custom_uploaded/icons/armor_robe.png', fallback: '🧙', label: '로브' },
  equip_shield: { src: '/assets/custom_uploaded/icons/shield.png', fallback: '🛡️', label: '방패' },
  ring: { src: '/assets/custom_uploaded/icons/ring.png', fallback: '💍', label: '반지' },
  necklace: { src: '/assets/custom_uploaded/icons/necklace.png', fallback: '📿', label: '목걸이' },
  amulet: { src: '/assets/custom_uploaded/icons/amulet.png', fallback: '🧿', label: '부적' },
  relic: { src: '/assets/custom_uploaded/icons/relic.png', fallback: '🏺', label: '유물' },

  // 🗡️ 레시피 ID 별칭
  rec_sword: { src: '/assets/custom_uploaded/icons/weapon_sword.png', fallback: '⚔️', label: '검' },
  rec_spear: { src: '/assets/custom_uploaded/icons/weapon_sword.png', fallback: '🔱', label: '창' },
  rec_gun: { src: '/assets/custom_uploaded/icons/weapon_gun.png', fallback: '🔫', label: '마총' },
  rec_bow: { src: '/assets/custom_uploaded/icons/weapon_bow.png', fallback: '🏹', label: '활' },
  rec_staff: { src: '/assets/custom_uploaded/icons/weapon_staff.png', fallback: '🪄', label: '지팡이' },
  rec_dagger: { src: '/assets/custom_uploaded/icons/weapon_dagger.png', fallback: '🔪', label: '단검' },
  rec_axe: { src: '/assets/custom_uploaded/icons/weapon_axe.png', fallback: '🪓', label: '도끼' },
  rec_shield: { src: '/assets/custom_uploaded/icons/shield.png', fallback: '🛡️', label: '방패' },
  rec_armor_heavy: { src: '/assets/custom_uploaded/icons/armor_heavy.png', fallback: '🛡️', label: '중갑' },
  rec_armor_leather: { src: '/assets/custom_uploaded/icons/armor_leather.png', fallback: '🥋', label: '경갑' },
  rec_armor_robe: { src: '/assets/custom_uploaded/icons/armor_robe.png', fallback: '🧙', label: '로브' },
  rec_ring: { src: '/assets/custom_uploaded/icons/ring.png', fallback: '💍', label: '반지' },
  rec_necklace: { src: '/assets/custom_uploaded/icons/necklace.png', fallback: '📿', label: '목걸이' },
  rec_amulet: { src: '/assets/custom_uploaded/icons/amulet.png', fallback: '🧿', label: '단조: 부적' },
  rec_relic: { src: '/assets/custom_uploaded/icons/relic.png', fallback: '🏺', label: '유물' },

  // ⚒️ 단조 / 제작 / 차징 핵심 아이콘 (Forge, Craft, Charge)
  forge_process: { src: '/assets/custom_uploaded/icons/blacksmith.png', fallback: '⚒️', label: '장비 단조 공정' },
  anvil: { src: '/assets/custom_uploaded/icons/blacksmith.png', fallback: '🔨', label: '단조 모루 타격' },
  enhance_equipment: { src: '/assets/custom_uploaded/icons/squire_resolute.png', fallback: '⚡', label: '마도 장비 강화' },
  craft_grimoire: { src: '/assets/custom_uploaded/icons/alchemy.png', fallback: '🧪', label: '에테르 연금 집필' },
  enhance_skill: { src: '/assets/custom_uploaded/icons/chrono_warp.png', fallback: '🌌', label: '스킬 비전 강화' },
  charge: { src: '/assets/custom_uploaded/icons/overcharge.png', fallback: '⚡', label: '에테르 마력 차징' },

  // 🧭 던전 탐험 이벤트 오브젝트 (10종)
  event_chest: { src: '/assets/custom_uploaded/icons/event_chest.png', fallback: '🎁', label: '보물 상자' },
  event_sarcophagus: { src: '/assets/custom_uploaded/icons/event_sarcophagus.png', fallback: '⚰️', label: '고대 석관' },
  event_altar: { src: '/assets/custom_uploaded/icons/event_altar.png', fallback: '🏛️', label: '여신의 제단' },
  event_ore_vein: { src: '/assets/custom_uploaded/icons/event_ore_vein.png', fallback: '⛏️', label: '에테르 광맥' },
  event_branching: { src: '/assets/custom_uploaded/icons/event_branching.png', fallback: '🧭', label: '갈림길 & 샛길' },
  event_merchant: { src: '/assets/custom_uploaded/icons/event_merchant.png', fallback: '🧳', label: '방랑 상인' },
  event_trap: { src: '/assets/custom_uploaded/icons/event_trap.png', fallback: '⚠️', label: '심연 함정' },
  event_buff: { src: '/assets/custom_uploaded/icons/event_buff.png', fallback: '✨', label: '에테르 기류' },
  event_portal: { src: '/assets/custom_uploaded/icons/event_portal.png', fallback: '🌀', label: '차원 포탈' },
  event_boss_encounter: { src: '/assets/custom_uploaded/icons/event_boss_encounter.png', fallback: '💀', label: '보스 조우' },

  // ⚠️ 던전 세부 함정 오브젝트 (5종)
  trap_spike: { src: '/assets/custom_uploaded/icons/trap_spike.png', fallback: '🩸', label: '함정: 흑철 가시 덫' },
  trap_poison: { src: '/assets/custom_uploaded/icons/trap_poison.png', fallback: '☠️', label: '함정: 부식성 맹독 분출구' },
  trap_flame: { src: '/assets/custom_uploaded/icons/trap_flame.png', fallback: '🔥', label: '함정: 화염 폭발 룬' },
  trap_frost: { src: '/assets/custom_uploaded/icons/trap_frost.png', fallback: '❄️', label: '함정: 극저온 서리 룬' },
  trap_stun: { src: '/assets/custom_uploaded/icons/trap_stun.png', fallback: '💫', label: '함정: 낙석 충격 트랩' },

  // 🏛️ 영지 건물 및 성채 시설 (21종)
  bonfire: { src: '/assets/custom_uploaded/icons/bonfire.png', fallback: '🔥', label: '방주의 성화' },
  cabin: { src: '/assets/custom_uploaded/icons/cabin.png', fallback: '🛖', label: '생존자 안식처' },
  lumberCamp: { src: '/assets/custom_uploaded/icons/lumberCamp.png', fallback: '🌲', label: '영목 벌채소' },
  quarry: { src: '/assets/custom_uploaded/icons/quarry.png', fallback: '⛏️', label: '에테르 광맥 시추소' },
  tavern: { src: '/assets/custom_uploaded/icons/tavern.png', fallback: '🍺', label: '방랑자의 라운지' },
  blacksmith: { src: '/assets/custom_uploaded/icons/blacksmith.png', fallback: '⚒️', label: '심연의 병기창' },
  forge: { src: '/assets/custom_uploaded/icons/forge.png', fallback: '⚒️', label: '병기창 대장간' },
  sanctuary: { src: '/assets/custom_uploaded/icons/sanctuary.png', fallback: '✨', label: '영혼의 제단' },
  alchemy: { src: '/assets/custom_uploaded/icons/alchemy.png', fallback: '🧪', label: '에테르 연금 공방' },
  arenaGate: { src: '/assets/custom_uploaded/icons/arenaGate.png', fallback: '🌀', label: '차원 앵커 게이트' },
  arena: { src: '/assets/custom_uploaded/icons/arenaGate.png', fallback: '🏆', label: '차원 게이트' },
  infirmary: { src: '/assets/custom_uploaded/icons/infirmary.png', fallback: '🏥', label: '생체 복원 병동' },
  market: { src: '/assets/custom_uploaded/icons/market.png', fallback: '⚖️', label: '황혼의 블랙 마켓' },
  storage: { src: '/assets/custom_uploaded/icons/storage.png', fallback: '🏛️', label: '방주 중앙 병참고' },
  butchery: { src: '/assets/custom_uploaded/icons/butchery.png', fallback: '⚗️', label: '심연 생체 정제소' },
  quests: { src: '/assets/custom_uploaded/icons/quests.png', fallback: '📜', label: '방주 의뢰소' },
  codex: { src: '/assets/custom_uploaded/icons/codex.png', fallback: '📜', label: '심연의 백과' },
  citadel: { src: '/assets/custom_uploaded/icons/bonfire.png', fallback: '🏰', label: '방주 영지' },
  barracks: { src: '/assets/custom_uploaded/icons/forge_t1_sword.png', fallback: '⚔️', label: '원정단 편성' },
  cemetery: { src: '/assets/custom_uploaded/icons/sanctuary.png', fallback: '🪦', label: '성채 묘지' },
  explore: { src: '/assets/custom_uploaded/icons/event_portal.png', fallback: '🌌', label: '심연 탐험' },

  // 🪄 직업 고유 스킬 (Class Skills)
  squire_strike: { src: '/assets/custom_uploaded/icons/squire_strike.png', fallback: '⚔️', label: '단련된 일격' },
  squire_guard: { src: '/assets/custom_uploaded/icons/squire_guard.png', fallback: '🛡️', label: '방패 올리기' },
  squire_resolute: { src: '/assets/custom_uploaded/icons/squire_resolute.png', fallback: '🌟', label: '불굴의 결의' },
  paladin_judgment: { src: '/assets/custom_uploaded/icons/paladin_judgment.png', fallback: '🔨', label: '단죄의 일격' },
  paladin_aegis: { src: '/assets/custom_uploaded/icons/paladin_aegis.png', fallback: '🛡️', label: '신성 방벽' },
  paladin_sanctuary: { src: '/assets/custom_uploaded/icons/paladin_sanctuary.png', fallback: '✨', label: '홀리 오라' },
  guard_shield_slam: { src: '/assets/custom_uploaded/icons/guard_shield_slam.png', fallback: '🛡️', label: '방패 강타' },
  guard_fortress: { src: '/assets/custom_uploaded/icons/guard_fortress.png', fallback: '🏰', label: '철벽의 태세' },
  guard_unbreakable: { src: '/assets/custom_uploaded/icons/guard_unbreakable.png', fallback: '⛓️', label: '절대 방진' },
  valk_spear: { src: '/assets/custom_uploaded/icons/valk_spear.png', fallback: '✨', label: '심판의 빛창' },
  valk_divine_shield: { src: '/assets/custom_uploaded/icons/valk_divine_shield.png', fallback: '🛡️', label: '신의 가호' },
  valk_ultimate: { src: '/assets/custom_uploaded/icons/valk_ultimate.png', fallback: '👑', label: '영원의 성역' },
  rogue_slash: { src: '/assets/custom_uploaded/icons/rogue_slash.png', fallback: '🗡️', label: '급소 찌르기' },
  rogue_smoke: { src: '/assets/custom_uploaded/icons/rogue_smoke.png', fallback: '💨', label: '연막탄' },
  rogue_shadow_dance: { src: '/assets/custom_uploaded/icons/rogue_shadow_dance.png', fallback: '⚡', label: '암영 난무' },
  assassin_strike: { src: '/assets/custom_uploaded/icons/assassin_strike.png', fallback: '🗡️', label: '암영 연격' },
  assassin_poison: { src: '/assets/custom_uploaded/icons/assassin_poison.png', fallback: '☠️', label: '독무 연격' },
  assassin_execution: { src: '/assets/custom_uploaded/icons/assassin_execution.png', fallback: '🩸', label: '심장 꿰뚫기' },
  phantom_teleport: { src: '/assets/custom_uploaded/icons/phantom_teleport.png', fallback: '👤', label: '심연의 도약' },
  phantom_clone: { src: '/assets/custom_uploaded/icons/phantom_clone.png', fallback: '👥', label: '분신 난무' },
  phantom_ultimate: { src: '/assets/custom_uploaded/icons/phantom_ultimate.png', fallback: '⚡', label: '무간암영참' },
  duel_riposte: { src: '/assets/custom_uploaded/icons/duel_riposte.png', fallback: '⚔️', label: '환영의 반격' },
  duel_flurry: { src: '/assets/custom_uploaded/icons/duel_flurry.png', fallback: '🗡️', label: '질풍 4연참' },
  duel_blade_waltz: { src: '/assets/custom_uploaded/icons/duel_blade_waltz.png', fallback: '⚡', label: '환영 난무 왈츠' },
  apprentice_bolt: { src: '/assets/custom_uploaded/icons/apprentice_bolt.png', fallback: '✨', label: '에테르 볼트' },
  apprentice_flame: { src: '/assets/custom_uploaded/icons/apprentice_flame.png', fallback: '🔥', label: '원소 폭발' },
  apprentice_mana_burst: { src: '/assets/custom_uploaded/icons/apprentice_mana_burst.png', fallback: '🔮', label: '에테르 과충전' },
  elem_chain_lightning: { src: '/assets/custom_uploaded/icons/elem_chain_lightning.png', fallback: '⚡', label: '연쇄 번개' },
  elem_blizzard: { src: '/assets/custom_uploaded/icons/elem_blizzard.png', fallback: '❄️', label: '혹한의 눈보라' },
  elem_supernova: { src: '/assets/custom_uploaded/icons/elem_supernova.png', fallback: '💥', label: '원소 초신성' },
  calamity_singularity: { src: '/assets/custom_uploaded/icons/calamity_singularity.png', fallback: '🌌', label: '공허의 특이점' },
  calamity_arcane_storm: { src: '/assets/custom_uploaded/icons/calamity_arcane_storm.png', fallback: '⚡', label: '비전 폭풍' },
  calamity_ultimate: { src: '/assets/custom_uploaded/icons/calamity_ultimate.png', fallback: '☄️', label: '종말의 메테오' },
  acolyte_heal: { src: '/assets/custom_uploaded/icons/acolyte_heal.png', fallback: '💖', label: '치유의 기도' },
  acolyte_smite: { src: '/assets/custom_uploaded/icons/acolyte_smite.png', fallback: '🌟', label: '신성 광휘' },
  acolyte_blessing: { src: '/assets/custom_uploaded/icons/acolyte_blessing.png', fallback: '🌈', label: '성자의 정화 가호' },
  saint_blessing: { src: '/assets/custom_uploaded/icons/saint_blessing.png', fallback: '🌈', label: '대성녀의 축복' },
  saint_purify: { src: '/assets/custom_uploaded/icons/saint_purify.png', fallback: '💖', label: '구원의 빛' },
  saint_ultimate: { src: '/assets/custom_uploaded/icons/saint_ultimate.png', fallback: '🕊️', label: '부활의 성가' },
  van_cleave: { src: '/assets/custom_uploaded/icons/van_cleave.png', fallback: '🗡️', label: '대검 베어가르기' },
  van_warcry: { src: '/assets/custom_uploaded/icons/van_warcry.png', fallback: '🗣️', label: '전사의 함성' },
  van_frenzy_strike: { src: '/assets/custom_uploaded/icons/van_frenzy_strike.png', fallback: '🔥', label: '분노의 일격' },
  ber_blood_rend: { src: '/assets/custom_uploaded/icons/ber_blood_rend.png', fallback: '🩸', label: '혈풍참' },
  ber_rampage: { src: '/assets/custom_uploaded/icons/ber_rampage.png', fallback: '😈', label: '피의 폭주' },
  ber_berserk_crush: { src: '/assets/custom_uploaded/icons/ber_berserk_crush.png', fallback: '🌋', label: '광란의 대지분쇄' },
  val_ragnarok_slash: { src: '/assets/custom_uploaded/icons/val_ragnarok_slash.png', fallback: '⚔️', label: '라그나로크 슬래시' },
  val_immortal_roar: { src: '/assets/custom_uploaded/icons/val_immortal_roar.png', fallback: '👑', label: '불멸의 포효' },
  val_ultimate: { src: '/assets/custom_uploaded/icons/val_ultimate.png', fallback: '💥', label: '불멸의 결전분노' },
  warlord_rallying_cry: { src: '/assets/custom_uploaded/icons/warlord_rallying_cry.png', fallback: '🗣️', label: '진격의 지휘 함성' },
  warlord_shield_crush: { src: '/assets/custom_uploaded/icons/warlord_shield_crush.png', fallback: '🛡️', label: '파성추 강타' },
  warlord_overwhelm: { src: '/assets/custom_uploaded/icons/warlord_overwhelm.png', fallback: '🚩', label: '전열 압도' },
  gun_rapid_fire: { src: '/assets/custom_uploaded/icons/gun_rapid_fire.png', fallback: '🔫', label: '에테르 2점사' },
  gun_flashbang: { src: '/assets/custom_uploaded/icons/gun_flashbang.png', fallback: '✨', label: '섬광탄 사격' },
  gun_aimed_snipe: { src: '/assets/custom_uploaded/icons/gun_aimed_snipe.png', fallback: '🎯', label: '정밀 조준사격' },
  tac_penetration_shot: { src: '/assets/custom_uploaded/icons/tac_penetration_shot.png', fallback: '⚡', label: '레일건 관통포' },
  tac_drone_strike: { src: '/assets/custom_uploaded/icons/tac_drone_strike.png', fallback: '🛰️', label: '전술 드론 호출' },
  tac_orbital_flare: { src: '/assets/custom_uploaded/icons/tac_orbital_flare.png', fallback: '🚀', label: '궤도 조명 폭격' },
  sharp_headshot: { src: '/assets/custom_uploaded/icons/sharp_headshot.png', fallback: '🎯', label: '치명적 헤드샷' },
  sharp_camouflage: { src: '/assets/custom_uploaded/icons/sharp_camouflage.png', fallback: '👤', label: '그림자 위장술' },
  sharp_abyssal_bullet: { src: '/assets/custom_uploaded/icons/sharp_abyssal_bullet.png', fallback: '💥', label: '심연 관통탄' },
  gun_hyper_cannon: { src: '/assets/custom_uploaded/icons/gun_hyper_cannon.png', fallback: '⚡', label: '하이퍼 펄스 버스터' },
  gun_tactical_reload: { src: '/assets/custom_uploaded/icons/gun_tactical_reload.png', fallback: '🔋', label: '오버클럭 리로드' },
  gun_orbital_strike: { src: '/assets/custom_uploaded/icons/gun_orbital_strike.png', fallback: '🛰️', label: '궤도 에테르 버스터' },
  scholar_gravity: { src: '/assets/custom_uploaded/icons/scholar_gravity.png', fallback: '🌀', label: '중력장 소환' },
  scholar_time_warp: { src: '/assets/custom_uploaded/icons/scholar_time_warp.png', fallback: '⏳', label: '시공 왜곡' },
  scholar_arcane_overload: { src: '/assets/custom_uploaded/icons/scholar_arcane_overload.png', fallback: '📚', label: '아케인 오버로드' },
  bishop_holy_wave: { src: '/assets/custom_uploaded/icons/bishop_holy_wave.png', fallback: '🌊', label: '성스러운 파동' },
  bishop_radiance: { src: '/assets/custom_uploaded/icons/bishop_radiance.png', fallback: '☀️', label: '성역의 광채' },
  bishop_holy_assembly: { src: '/assets/custom_uploaded/icons/bishop_holy_assembly.png', fallback: '✝️', label: '신성 집결' },
  warpriest_smite_crusade: { src: '/assets/custom_uploaded/icons/warpriest_smite_crusade.png', fallback: '⚔️', label: '성전 강타' },
  warpriest_sacred_ground: { src: '/assets/custom_uploaded/icons/warpriest_sacred_ground.png', fallback: '🏛️', label: '성지 정화 결계' },
  warpriest_holy_proclamation: { src: '/assets/custom_uploaded/icons/warpriest_holy_proclamation.png', fallback: '📜', label: '성전 선포' },

  // 📖 마도 비전서 (Skill Books) & 스킬 ID 매핑 (마도서 아이콘 = 스킬 아이콘 일체화)
  book_heavy_strike: { src: '/assets/custom_uploaded/icons/book_heavy_strike.png', fallback: '⚔️', label: '비전서: 강타' },
  skill_heavy_strike: { src: '/assets/custom_uploaded/icons/book_heavy_strike.png', fallback: '⚔️', label: '강타' },
  book_shield_guard: { src: '/assets/custom_uploaded/icons/book_shield_guard.png', fallback: '🛡️', label: '비전서: 방패 방어' },
  skill_shield_guard: { src: '/assets/custom_uploaded/icons/book_shield_guard.png', fallback: '🛡️', label: '방패 방어' },
  book_first_aid: { src: '/assets/custom_uploaded/icons/book_first_aid.png', fallback: '🩹', label: '비전서: 응급 처치' },
  skill_first_aid: { src: '/assets/custom_uploaded/icons/book_first_aid.png', fallback: '🩹', label: '응급 처치' },
  book_puncture: { src: '/assets/custom_uploaded/icons/book_puncture.png', fallback: '🗡️', label: '비전서: 약점 찌르기' },
  skill_puncture: { src: '/assets/custom_uploaded/icons/book_puncture.png', fallback: '🗡️', label: '약점 찌르기' },
  book_flame_dart: { src: '/assets/custom_uploaded/icons/book_flame_dart.png', fallback: '✨', label: '비전서: 에테르 화살' },
  skill_flame_dart: { src: '/assets/custom_uploaded/icons/book_flame_dart.png', fallback: '✨', label: '에테르 화살' },
  book_flame_cleave: { src: '/assets/custom_uploaded/icons/book_flame_cleave.png', fallback: '🔥', label: '비전서: 화염 강타' },
  skill_flame_cleave: { src: '/assets/custom_uploaded/icons/book_flame_cleave.png', fallback: '🔥', label: '화염 강타' },
  book_phalanx_wall: { src: '/assets/custom_uploaded/icons/book_phalanx_wall.png', fallback: '🏰', label: '비전서: 철벽의 방진' },
  skill_phalanx_wall: { src: '/assets/custom_uploaded/icons/book_phalanx_wall.png', fallback: '🏰', label: '철벽의 방진' },
  book_war_cry: { src: '/assets/custom_uploaded/icons/book_war_cry.png', fallback: '📢', label: '비전서: 전장의 포효' },
  skill_war_cry: { src: '/assets/custom_uploaded/icons/book_war_cry.png', fallback: '📢', label: '전장의 포효' },
  book_holy_blessing: { src: '/assets/custom_uploaded/icons/book_holy_blessing.png', fallback: '🌟', label: '비전서: 신성한 축복' },
  skill_holy_blessing: { src: '/assets/custom_uploaded/icons/book_holy_blessing.png', fallback: '🌟', label: '신성한 축복' },
  book_shadow_ambush: { src: '/assets/custom_uploaded/icons/book_shadow_ambush.png', fallback: '🥷', label: '비전서: 그림자 습격' },
  skill_shadow_ambush: { src: '/assets/custom_uploaded/icons/book_shadow_ambush.png', fallback: '🥷', label: '그림자 습격' },
  book_sacred_veil: { src: '/assets/custom_uploaded/icons/book_sacred_veil.png', fallback: '🕊️', label: '비전서: 축복의 베일' },
  skill_sacred_veil: { src: '/assets/custom_uploaded/icons/book_sacred_veil.png', fallback: '🕊️', label: '축복의 베일' },
  book_thunderbolt: { src: '/assets/custom_uploaded/icons/book_thunderbolt.png', fallback: '⚡', label: '비전서: 천둥의 벼락' },
  skill_thunderbolt: { src: '/assets/custom_uploaded/icons/book_thunderbolt.png', fallback: '⚡', label: '천둥의 벼락' },
  book_abyssal_hex: { src: '/assets/custom_uploaded/icons/book_abyssal_hex.png', fallback: '🔮', label: '비전서: 심연의 저주' },
  skill_abyssal_hex: { src: '/assets/custom_uploaded/icons/book_abyssal_hex.png', fallback: '🔮', label: '심연의 저주' },
  book_sanctuary_barrier: { src: '/assets/custom_uploaded/icons/book_sanctuary_barrier.png', fallback: '🛡️', label: '비전서: 성역의 결계' },
  skill_sanctuary_barrier: { src: '/assets/custom_uploaded/icons/book_sanctuary_barrier.png', fallback: '🛡️', label: '성역의 결계' },
  book_blade_dance: { src: '/assets/custom_uploaded/icons/book_blade_dance.png', fallback: '🌪️', label: '비전서: 광기의 난무' },
  skill_blade_dance: { src: '/assets/custom_uploaded/icons/book_blade_dance.png', fallback: '🌪️', label: '광기의 난무' },
  book_purifying_light: { src: '/assets/custom_uploaded/icons/book_purifying_light.png', fallback: '✨', label: '비전서: 정화의 빛' },
  skill_purifying_light: { src: '/assets/custom_uploaded/icons/book_purifying_light.png', fallback: '✨', label: '정화의 빛' },
  book_epic_aegis_judgment: { src: '/assets/custom_uploaded/icons/book_epic_aegis_judgment.png', fallback: '🛡️', label: '비전서: 성전의 수호 방진' },
  skill_epic_aegis_judgment: { src: '/assets/custom_uploaded/icons/book_epic_aegis_judgment.png', fallback: '🛡️', label: '성전의 수호 방진' },
  book_epic_shadow_execution: { src: '/assets/custom_uploaded/icons/book_epic_shadow_execution.png', fallback: '🗡️', label: '비전서: 그림자 처형' },
  skill_epic_shadow_execution: { src: '/assets/custom_uploaded/icons/book_epic_shadow_execution.png', fallback: '🗡️', label: '그림자 처형' },
  book_epic_arcane_supernova: { src: '/assets/custom_uploaded/icons/book_epic_arcane_supernova.png', fallback: '🔮', label: '비전서: 초신성 폭발' },
  skill_epic_arcane_supernova: { src: '/assets/custom_uploaded/icons/book_epic_arcane_supernova.png', fallback: '🔮', label: '초신성 폭발' },
  book_epic_divine_grace: { src: '/assets/custom_uploaded/icons/book_epic_divine_grace.png', fallback: '🕊️', label: '비전서: 성령의 기적' },
  skill_epic_divine_grace: { src: '/assets/custom_uploaded/icons/book_epic_divine_grace.png', fallback: '🕊️', label: '성령의 기적' },
  book_epic_arrow_storm: { src: '/assets/custom_uploaded/icons/book_epic_arrow_storm.png', fallback: '🏹', label: '비전서: 폭풍의 화살비' },
  skill_epic_arrow_storm: { src: '/assets/custom_uploaded/icons/book_epic_arrow_storm.png', fallback: '🏹', label: '폭풍의 화살비' },
  book_epic_plasma_annihilation: { src: '/assets/custom_uploaded/icons/book_epic_plasma_annihilation.png', fallback: '⚡', label: '비전서: 플라즈마 파쇄포' },
  skill_epic_plasma_annihilation: { src: '/assets/custom_uploaded/icons/book_epic_plasma_annihilation.png', fallback: '⚡', label: '플라즈마 파쇄포' },
  book_epic_blood_rampage: { src: '/assets/custom_uploaded/icons/book_epic_blood_rampage.png', fallback: '🪓', label: '비전서: 피의 광란참' },
  skill_epic_blood_rampage: { src: '/assets/custom_uploaded/icons/book_epic_blood_rampage.png', fallback: '🪓', label: '피의 광란참' },
  book_armageddon: { src: '/assets/custom_uploaded/icons/book_armageddon.png', fallback: '🌌', label: '고대 마도서: 아마겟돈' },
  skill_armageddon: { src: '/assets/custom_uploaded/icons/book_armageddon.png', fallback: '🌌', label: '아마겟돈' },
  book_valhalla_aegis: { src: '/assets/custom_uploaded/icons/book_valhalla_aegis.png', fallback: '👑', label: '신성 성전: 발할라의 불멸' },
  skill_valhalla_aegis: { src: '/assets/custom_uploaded/icons/book_valhalla_aegis.png', fallback: '👑', label: '발할라의 불멸' },
  book_genesis_halo: { src: '/assets/custom_uploaded/icons/book_genesis_halo.png', fallback: '🕊️', label: '태초의 성전: 창세의 성령' },
  skill_genesis_halo: { src: '/assets/custom_uploaded/icons/book_genesis_halo.png', fallback: '🕊️', label: '창세의 성령' },
  book_boss_colossus_core: { src: '/assets/custom_uploaded/icons/book_boss_colossus_core.png', fallback: '❄️', label: '비전서: 흑핵의 영구동결 [1F]' },
  skill_boss_colossus_core: { src: '/assets/custom_uploaded/icons/book_boss_colossus_core.png', fallback: '❄️', label: '흑핵의 영구동결' },
  book_boss_deathknight_reap: { src: '/assets/custom_uploaded/icons/book_boss_deathknight_reap.png', fallback: '💀', label: '비전서: 사령의 영혼 수확 [2F]' },
  skill_boss_deathknight_reap: { src: '/assets/custom_uploaded/icons/book_boss_deathknight_reap.png', fallback: '💀', label: '사령의 영혼 수확' },
  book_boss_behemoth_eruption: { src: '/assets/custom_uploaded/icons/book_boss_behemoth_eruption.png', fallback: '🌋', label: '비전서: 광맥의 마도 분출 [3F]' },
  skill_boss_behemoth_eruption: { src: '/assets/custom_uploaded/icons/book_boss_behemoth_eruption.png', fallback: '🌋', label: '광맥의 마도 분출' },
  book_boss_chrono_warp: { src: '/assets/custom_uploaded/icons/book_boss_chrono_warp.png', fallback: '⏳', label: '비전서: 시공간 차원 붕괴 [4F]' },
  skill_boss_chrono_warp: { src: '/assets/custom_uploaded/icons/book_boss_chrono_warp.png', fallback: '⏳', label: '시공간 차원 붕괴' },
  book_boss_void_cataclysm: { src: '/assets/custom_uploaded/icons/book_boss_void_cataclysm.png', fallback: '🔮', label: '비전서: 원초의 공허 묵시록 [5F]' },
  skill_boss_void_cataclysm: { src: '/assets/custom_uploaded/icons/book_boss_void_cataclysm.png', fallback: '🔮', label: '원초의 공허 묵시록' },
  book_boss_blood_monarch: { src: '/assets/custom_uploaded/icons/book_boss_blood_monarch.png', fallback: '🍷', label: '비전서: 진홍의 피의 지배 [6F]' },
  skill_boss_blood_monarch: { src: '/assets/custom_uploaded/icons/book_boss_blood_monarch.png', fallback: '🍷', label: '진홍의 피의 지배' },
  book_boss_oblivion_scythe: { src: '/assets/custom_uploaded/icons/book_boss_oblivion_scythe.png', fallback: '⛓️', label: '비전서: 망각의 사신 낫 [7F]' },
  skill_boss_oblivion_scythe: { src: '/assets/custom_uploaded/icons/book_boss_oblivion_scythe.png', fallback: '⛓️', label: '망각의 사신 낫' },
  book_boss_judgment_sanctum: { src: '/assets/custom_uploaded/icons/book_boss_judgment_sanctum.png', fallback: '🏰', label: '비전서: 단죄의 칠흑 성역 [8F]' },
  skill_boss_judgment_sanctum: { src: '/assets/custom_uploaded/icons/book_boss_judgment_sanctum.png', fallback: '🏰', label: '단죄의 칠흑 성역' },
  book_boss_mirror_kaleidoscope: { src: '/assets/custom_uploaded/icons/book_boss_mirror_kaleidoscope.png', fallback: '🪞', label: '비전서: 거울 만화경 환영 [9F]' },
  skill_boss_mirror_kaleidoscope: { src: '/assets/custom_uploaded/icons/book_boss_mirror_kaleidoscope.png', fallback: '🪞', label: '거울 만화경 환영' },
  book_boss_asmodeus_armageddon: { src: '/assets/custom_uploaded/icons/book_boss_asmodeus_armageddon.png', fallback: '👑', label: '비전서: 아스모데우스 아마겟돈 [10F]' },
  skill_boss_asmodeus_armageddon: { src: '/assets/custom_uploaded/icons/book_boss_asmodeus_armageddon.png', fallback: '👑', label: '아스모데우스 아마겟돈' },

  // ⚗️ 연금술 공방 제작 마도서 & 스킬 매핑
  craft_barrier: { src: '/assets/custom_uploaded/icons/skill_sanctuary_barrier.png', fallback: '🛡️', label: '마도서: 수호의 방패' },
  skill_craft_barrier: { src: '/assets/custom_uploaded/icons/skill_sanctuary_barrier.png', fallback: '🛡️', label: '수호의 방패' },
  rec_craft_barrier: { src: '/assets/custom_uploaded/icons/skill_sanctuary_barrier.png', fallback: '🛡️', label: '마도서: 수호의 방패' },

  craft_first_aid: { src: '/assets/custom_uploaded/icons/skill_first_aid.png', fallback: '🩹', label: '마도서: 응급 회복' },
  skill_craft_first_aid: { src: '/assets/custom_uploaded/icons/skill_first_aid.png', fallback: '🩹', label: '응급 회복' },
  rec_craft_first_aid: { src: '/assets/custom_uploaded/icons/skill_first_aid.png', fallback: '🩹', label: '마도서: 응급 회복' },

  craft_vampiric_edge: { src: '/assets/custom_uploaded/icons/vampiric.png', fallback: '🩸', label: '마도서: 흡혈의 흉인' },
  skill_craft_vampiric_edge: { src: '/assets/custom_uploaded/icons/vampiric.png', fallback: '🩸', label: '흡혈의 흉인' },
  rec_craft_vampiric_edge: { src: '/assets/custom_uploaded/icons/vampiric.png', fallback: '🩸', label: '마도서: 흡혈의 흉인' },

  craft_apocalypse: { src: '/assets/custom_uploaded/icons/skill_armageddon.png', fallback: '🌌', label: '마도서: 아마겟돈' },
  skill_craft_apocalypse: { src: '/assets/custom_uploaded/icons/skill_armageddon.png', fallback: '🌌', label: '아마겟돈' },
  rec_craft_apocalypse: { src: '/assets/custom_uploaded/icons/skill_armageddon.png', fallback: '🌌', label: '마도서: 아마겟돈' },

  craft_aegis_eternity: { src: '/assets/custom_uploaded/icons/skill_epic_aegis_judgment.png', fallback: '🔮', label: '마도서: 영겁의 수호 결계' },
  skill_craft_aegis_eternity: { src: '/assets/custom_uploaded/icons/skill_epic_aegis_judgment.png', fallback: '🔮', label: '영겁의 수호 결계' },
  rec_craft_aegis_eternity: { src: '/assets/custom_uploaded/icons/skill_epic_aegis_judgment.png', fallback: '🔮', label: '마도서: 영겁의 수호 결계' },

  craft_ragnarok: { src: '/assets/custom_uploaded/icons/val_ragnarok_slash.png', fallback: '☄️', label: '마도서: 라그나로크' },
  skill_craft_ragnarok: { src: '/assets/custom_uploaded/icons/val_ragnarok_slash.png', fallback: '☄️', label: '라그나로크' },
  rec_craft_ragnarok: { src: '/assets/custom_uploaded/icons/val_ragnarok_slash.png', fallback: '☄️', label: '마도서: 라그나로크' },

  craft_divine_grace: { src: '/assets/custom_uploaded/icons/skill_epic_divine_grace.png', fallback: '🕊️', label: '마도서: 신의 은총' },
  skill_craft_divine_grace: { src: '/assets/custom_uploaded/icons/skill_epic_divine_grace.png', fallback: '🕊️', label: '신의 은총' },
  rec_craft_divine_grace: { src: '/assets/custom_uploaded/icons/skill_epic_divine_grace.png', fallback: '🕊️', label: '마도서: 신의 은총' },

  craft_dimensional_rift: { src: '/assets/custom_uploaded/icons/skill_m_monster_rift_stalker.png', fallback: '🕳️', label: '마도서: 차원 붕괴' },
  skill_craft_dimensional_rift: { src: '/assets/custom_uploaded/icons/skill_m_monster_rift_stalker.png', fallback: '🕳️', label: '차원 붕괴' },
  rec_craft_dimensional_rift: { src: '/assets/custom_uploaded/icons/skill_m_monster_rift_stalker.png', fallback: '🕳️', label: '마도서: 차원 붕괴' },

  craft_genesis_light: { src: '/assets/custom_uploaded/icons/skill_genesis_halo.png', fallback: '☀️', label: '마도서: 창세의 여명' },
  rec_craft_genesis_light: { src: '/assets/custom_uploaded/icons/skill_genesis_halo.png', fallback: '☀️', label: '마도서: 창세의 여명' },

  craft_void_cataclysm: { src: '/assets/custom_uploaded/icons/skill_boss_void_cataclysm.png', fallback: '🪐', label: '마도서: 공허의 종말' },
  rec_craft_void_cataclysm: { src: '/assets/custom_uploaded/icons/skill_boss_void_cataclysm.png', fallback: '🪐', label: '마도서: 공허의 종말' },

  // 📖 기본/전직 클래스 비전 마도서 스킬 매핑
  squire_shield_slam: { src: '/assets/custom_uploaded/icons/guard_shield_slam.png', fallback: '🛡️', label: '방패 강타' },
  squire_strike: { src: '/assets/custom_uploaded/icons/squire_strike.png', fallback: '⚔️', label: '단련된 일격' },
  rogue_shadow_strike: { src: '/assets/custom_uploaded/icons/book_shadow_ambush.png', fallback: '🗡️', label: '그림자 베기' },
  van_charge: { src: '/assets/custom_uploaded/icons/charge.png', fallback: '💥', label: '돌파 돌격' },
  gun_quickshot: { src: '/assets/custom_uploaded/icons/book_epic_arrow_storm.png', fallback: '🔫', label: '속사' },
  gun_buckshot: { src: '/assets/custom_uploaded/icons/gun_hyper_cannon.png', fallback: '💥', label: '산탄 사격' },
  paladin_shield: { src: '/assets/custom_uploaded/icons/paladin_aegis.png', fallback: '🛡️', label: '신성 방벽' },
  guard_iron_wall: { src: '/assets/custom_uploaded/icons/book_phalanx_wall.png', fallback: '🏰', label: '철벽 방어' },
  guard_shield_bash: { src: '/assets/custom_uploaded/icons/guard_shield_slam.png', fallback: '🔨', label: '철퇴 강타' },
  assassin_shadow_step: { src: '/assets/custom_uploaded/icons/assassin_strike.png', fallback: '👤', label: '그림자 걸음' },
  assassin_vital_strike: { src: '/assets/custom_uploaded/icons/assassin_execution.png', fallback: '🗡️', label: '급소 찌르기' },
  berserk_blood_slash: { src: '/assets/custom_uploaded/icons/ber_blood_rend.png', fallback: '🩸', label: '혈풍참' },
  sniper_headshot: { src: '/assets/custom_uploaded/icons/sharp_headshot.png', fallback: '🎯', label: '정밀 헤드샷' },
  bishop_holy_sanctuary: { src: '/assets/custom_uploaded/icons/bishop_holy_assembly.png', fallback: '✨', label: '성역 전개' },
  valk_invincible: { src: '/assets/custom_uploaded/icons/valk_divine_shield.png', fallback: '👑', label: '불멸의 성역' },
  valhalla_strike: { src: '/assets/custom_uploaded/icons/val_ragnarok_slash.png', fallback: '⚔️', label: '발할라 참격' },
  hyper_orbital_cannon: { src: '/assets/custom_uploaded/icons/gun_hyper_cannon.png', fallback: '🛰️', label: '위성 궤도포' },
  calamity_meteor: { src: '/assets/custom_uploaded/icons/calamity_ultimate.png', fallback: '☄️', label: '종말의 메테오' },

  // 🌟 2차 전직 특화 스킬 (18종)
  // 요새 (Fortress)
  fortress_bastion: { src: '/assets/custom_uploaded/icons/fortress_bastion.png', fallback: '🏰', label: '요새 결계' },
  fortress_earthshaker: { src: '/assets/custom_uploaded/icons/fortress_earthshaker.png', fallback: '🌋', label: '대지 분쇄타' },
  fortress_ultimate: { src: '/assets/custom_uploaded/icons/fortress_ultimate.png', fallback: '🛡️', label: '[궁극기] 절대 불락의 성채' },
  // 칼날 무희 (Blade Dancer)
  dancer_thousand_cuts: { src: '/assets/custom_uploaded/icons/dancer_thousand_cuts.png', fallback: '🗡️', label: '천공의 칼바람' },
  dancer_mirage_dance: { src: '/assets/custom_uploaded/icons/dancer_mirage_dance.png', fallback: '💃', label: '신기루 칼춤' },
  dancer_ultimate: { src: '/assets/custom_uploaded/icons/dancer_ultimate.png', fallback: '✨', label: '[궁극기] 만화경 환영난무' },
  // 크로노맨서 (Chronomancer)
  chrono_time_stop: { src: '/assets/custom_uploaded/icons/chrono_time_stop.png', fallback: '⏱️', label: '시간 정지' },
  chrono_gravity_collapse: { src: '/assets/custom_uploaded/icons/chrono_gravity_collapse.png', fallback: '🌀', label: '중력 붕괴' },
  chrono_ultimate: { src: '/assets/custom_uploaded/icons/chrono_ultimate.png', fallback: '⏳', label: '[궁극기] 시간 역행' },
  // 성전사 군주 (Crusader Lord)
  crusader_judgment_hammer: { src: '/assets/custom_uploaded/icons/crusader_judgment_hammer.png', fallback: '🔨', label: '심판의 망치' },
  crusader_holy_sanctuary_field: { src: '/assets/custom_uploaded/icons/crusader_holy_sanctuary_field.png', fallback: '⛪', label: '거룩한 성역 결계' },
  crusader_ultimate: { src: '/assets/custom_uploaded/icons/crusader_ultimate.png', fallback: '⚡', label: '[궁극기] 성전의 천벌' },
  // 강철 원수 (Iron Marshal)
  marshal_annihilation_order: { src: '/assets/custom_uploaded/icons/marshal_annihilation_order.png', fallback: '🚩', label: '총공격 섬멸령' },
  marshal_phalanx_crush: { src: '/assets/custom_uploaded/icons/marshal_phalanx_crush.png', fallback: '🛡️', label: '철벽 팔랑크스 분쇄' },
  marshal_ultimate: { src: '/assets/custom_uploaded/icons/marshal_ultimate.png', fallback: '🚀', label: '[궁극기] 방주 결전포' },
  // 유령 저격수 (Ghost Sniper)
  sniper_death_sentence: { src: '/assets/custom_uploaded/icons/sniper_death_sentence.png', fallback: '🎯', label: '사형 선고' },
  sniper_shadow_meld: { src: '/assets/custom_uploaded/icons/sniper_shadow_meld.png', fallback: '👤', label: '암영 잠행' },
  sniper_ultimate: { src: '/assets/custom_uploaded/icons/sniper_ultimate.png', fallback: '💀', label: '[궁극기] 유령 탄환 (사신 스나이프)' },

  // 🌟 3차 전직 특화 스킬 및 초월기 (18종)
  // 이지스 바스티온 (Aegis Bastion)
  bastion_divine_providence: { src: '/assets/custom_uploaded/icons/bastion_divine_providence.png', fallback: '🛡️', label: '신성 수호진' },
  bastion_sanctuary_smite: { src: '/assets/custom_uploaded/icons/bastion_sanctuary_smite.png', fallback: '🔨', label: '성벽 강타' },
  bastion_avalon: { src: '/assets/custom_uploaded/icons/bastion_avalon.png', fallback: '👑', label: '[초월기] 아발론' },
  // 보이드 스트라이더 (Void Strider)
  void_phantom_flicker: { src: '/assets/custom_uploaded/icons/void_phantom_flicker.png', fallback: '⚡', label: '공허 섬광보' },
  void_abyssal_dance: { src: '/assets/custom_uploaded/icons/void_abyssal_dance.png', fallback: '👤', label: '심연 환영검무' },
  void_dimension_slash: { src: '/assets/custom_uploaded/icons/void_dimension_slash.png', fallback: '🌌', label: '[초월기] 차원참' },
  // 크로노 아콘 (Chrono Archon)
  chrono_event_horizon: { src: '/assets/custom_uploaded/icons/chrono_event_horizon.png', fallback: '🌀', label: '사상의 지평선' },
  chrono_temporal_flux: { src: '/assets/custom_uploaded/icons/chrono_temporal_flux.png', fallback: '⏳', label: '시간 가속 왜곡' },
  chrono_bigbang: { src: '/assets/custom_uploaded/icons/chrono_bigbang.png', fallback: '💥', label: '[초월기] 빅뱅 크로노스' },
  // 세라픽 인퀴지터 (Seraphic Inquisitor)
  seraph_divine_wrath: { src: '/assets/custom_uploaded/icons/seraph_divine_wrath.png', fallback: '⚖️', label: '성스러운 단죄' },
  seraph_grace_sanctuary: { src: '/assets/custom_uploaded/icons/seraph_grace_sanctuary.png', fallback: '🕊️', label: '세라핌의 가호' },
  seraph_grand_judgment: { src: '/assets/custom_uploaded/icons/seraph_grand_judgment.png', fallback: '☀️', label: '[초월기] 창공의 대심판' },
  // 발할라 워로드 (Valhalla Warlord)
  warlord_blood_cleave: { src: '/assets/custom_uploaded/icons/warlord_blood_cleave.png', fallback: '🪓', label: '혈겁의 대검풍' },
  warlord_immortal_vanguard: { src: '/assets/custom_uploaded/icons/warlord_immortal_vanguard.png', fallback: '🚩', label: '불멸의 진격' },
  warlord_blood_tactics: { src: '/assets/custom_uploaded/icons/warlord_blood_tactics.png', fallback: '🩸', label: '[초월기] 피의 전술' },
  // 오메가 데드아이 (Omega Deadeye)
  omega_railgun_burst: { src: '/assets/custom_uploaded/icons/omega_railgun_burst.png', fallback: '⚡', label: '오메가 펄스포' },
  omega_overclock_stealth: { src: '/assets/custom_uploaded/icons/omega_overclock_stealth.png', fallback: '👤', label: '영점 사격 은신' },
  omega_orbital_annihilation: { src: '/assets/custom_uploaded/icons/omega_orbital_annihilation.png', fallback: '🛰️', label: '[초월기] 궤도 섬멸' },

  // 🎖️ 전투 전술 모멘텀 뱃지 (7종) & FEVER 게이지 & 시너지 아이콘
  badge_assist: { src: '/assets/custom_uploaded/icons/badge_assist.png', fallback: '🎯', label: '모멘텀 뱃지: ASSIST (원호 추격)' },
  badge_extra: { src: '/assets/custom_uploaded/icons/badge_extra.png', fallback: '⚡', label: '모멘텀 뱃지: EXTRA (스킬 연계)' },
  badge_crit: { src: '/assets/custom_uploaded/icons/badge_crit.png', fallback: '💥', label: '모멘텀 뱃지: CRIT (치명 일격)' },
  badge_guard: { src: '/assets/custom_uploaded/icons/badge_guard.png', fallback: '🛡️', label: '모멘텀 뱃지: GUARD (수호 개입)' },
  badge_heal: { src: '/assets/custom_uploaded/icons/badge_heal.png', fallback: '💖', label: '모멘텀 뱃지: HEAL (신성 치유)' },
  badge_counter: { src: '/assets/custom_uploaded/icons/badge_counter.png', fallback: '⚔️', label: '모멘텀 뱃지: COUNTER (환영 반격)' },
  badge_break: { src: '/assets/custom_uploaded/icons/badge_break.png', fallback: '💫', label: '모멘텀 뱃지: BREAK (차징 붕괴)' },
  badge_detonation: { src: '/assets/custom_uploaded/icons/badge_detonation.png', fallback: '💥', label: '전투 연계: DETONATION (연계 폭발)' },
  fever_gauge: { src: '/assets/custom_uploaded/icons/fever_gauge.png', fallback: '🔥', label: 'FEVER 게이지: 전술 모멘텀 완충' },
  fever_burst: { src: '/assets/custom_uploaded/icons/fever_burst.png', fallback: '⚡', label: 'FEVER 폭발: 궁극기 시너지 방출' },
  fever_miracle_resurrection: { src: '/assets/custom_uploaded/icons/fever_miracle_resurrection.png', fallback: '🕊️', label: 'FEVER 시너지: 기적의 소생' },
  fever_divine_sanctuary: { src: '/assets/custom_uploaded/icons/fever_divine_sanctuary.png', fallback: '💖', label: 'FEVER 시너지: 신성 성역' },
  fever_flurry_overdrive: { src: '/assets/custom_uploaded/icons/fever_flurry_overdrive.png', fallback: '⚡', label: 'FEVER 시너지: 질풍노도' },
  fever_total_assault: { src: '/assets/custom_uploaded/icons/fever_total_assault.png', fallback: '🎯', label: 'FEVER 시너지: 총력 섬멸' },
  fever_immortal_bastion: { src: '/assets/custom_uploaded/icons/fever_immortal_bastion.png', fallback: '🛡️', label: 'FEVER 시너지: 불멸의 요새' },
  fever_vampiric_requiem: { src: '/assets/custom_uploaded/icons/fever_vampiric_requiem.png', fallback: '🍷', label: 'FEVER 시너지: 흡혈 진혼곡' },
  fever_grand_maestro: { src: '/assets/custom_uploaded/icons/fever_grand_maestro.png', fallback: '🌐', label: 'FEVER 시너지: 전술의 극의' },
  fever_tactical_burst: { src: '/assets/custom_uploaded/icons/fever_tactical_burst.png', fallback: '🌟', label: 'FEVER 시너지: 전술 파동' },

  // 👑 전투 승리 엠블럼 / 이모지 커스텀
  battle_victory: { src: '/assets/custom_uploaded/icons/battle_victory.png', fallback: '👑', label: '전투 승리 엠블럼/이모지' },

  // 🏆 차원 아레나 랭크 아이콘 (7단계)
  rank_bronze: { src: '/assets/custom_uploaded/icons/rank_bronze.png', fallback: '🥉', label: '랭크 아이콘: 브론즈 (Bronze)' },
  rank_silver: { src: '/assets/custom_uploaded/icons/rank_silver.png', fallback: '🛡️', label: '랭크 아이콘: 실버 (Silver)' },
  rank_gold: { src: '/assets/custom_uploaded/icons/rank_gold.png', fallback: '🏆', label: '랭크 아이콘: 골드 (Gold)' },
  rank_platinum: { src: '/assets/custom_uploaded/icons/rank_platinum.png', fallback: '⚔️', label: '랭크 아이콘: 플래티넘 (Platinum)' },
  rank_diamond: { src: '/assets/custom_uploaded/icons/rank_diamond.png', fallback: '💠', label: '랭크 아이콘: 다이아몬드 (Diamond)' },
  rank_master: { src: '/assets/custom_uploaded/icons/rank_master.png', fallback: '💎', label: '랭크 아이콘: 마스터 (Master)' },
  rank_grandmaster: { src: '/assets/custom_uploaded/icons/rank_grandmaster.png', fallback: '👑', label: '랭크 아이콘: 그랜드마스터 (Grand Master)' },

  // 🌟 심연 정화 (Abyss Purification)
  abyss_purify: { src: '/assets/custom_uploaded/icons/saint_purify.png', fallback: '✨', label: '심연 정화' },
  dungeon_purify: { src: '/assets/custom_uploaded/icons/saint_purify.png', fallback: '✨', label: '심연 정화' },

  // 👑 퀘스트 고유 지급 장비 (11종)
  equip_quest_ring: { src: '/assets/custom_uploaded/icons/ring.png', fallback: '💍', label: '수호자의 은빛 반지' },
  equip_rare_expedition_dawn_blade: { src: '/assets/custom_uploaded/icons/weapon_sword.png', fallback: '🗡️', label: '심연 결사대의 여명검' },
  equip_epic_colossus_blade: { src: '/assets/custom_uploaded/icons/weapon_sword.png', fallback: '🗡️', label: '흑핵의 고대 파쇄검' },
  equip_epic_behemoth_plate: { src: '/assets/custom_uploaded/icons/armor_heavy.png', fallback: '🛡️', label: '시공 굴절의 광맥 갑주' },
  equip_legend_monolith_ring: { src: '/assets/custom_uploaded/icons/ring.png', fallback: '💍', label: '모노리스의 행성 성휘' },
  equip_legend_blood_chalice_ring: { src: '/assets/custom_uploaded/icons/ring.png', fallback: '💍', label: '진홍 성배의 불멸 성휘' },
  equip_legend_paladin_mirror_plate: { src: '/assets/custom_uploaded/icons/armor_heavy.png', fallback: '🛡️', label: '단죄 성역의 거울 판금갑' },
  equip_legend_asmodeus_crown: { src: '/assets/custom_uploaded/icons/relic.png', fallback: '👑', label: '심연 군주의 칠흑 옥관' },
  equip_mythic_genesis_blade: { src: '/assets/custom_uploaded/icons/weapon_sword.png', fallback: '🗡️', label: '태초의 창세 성검' },
  equip_scenario_paladin_sword: { src: '/assets/custom_uploaded/icons/weapon_sword.png', fallback: '🗡️', label: '단죄의 서약 검' },
  equip_scenario_blood_sword: { src: '/assets/custom_uploaded/icons/weapon_sword.png', fallback: '🗡️', label: '진홍 화염의 섬멸 대검' },
};

// ─── 🏭 병기창 1~10티어 장비 (120종) 및 👑 보스 고유 세트 무구 (30종) 동적 등록 ─────
const FALLBACK_EQUIP_EMOJIS: Record<string, string> = {
  sword: '🗡️',
  spear: '🔱',
  gun: '🔫',
  bow: '🏹',
  staff: '🪄',
  dagger: '🗡️',
  leather_armor: '🥋',
  plate_armor: '🛡️',
  robe: '🥻',
  ring: '💍',
  necklace: '📿',
  amulet: '🧿',
};

// 장비 타입 키 → 실제 존재하는 equipment 아이콘 파일 매핑
const EQUIP_TYPE_SRC: Record<string, string> = {
  sword:         '/assets/custom_uploaded/icons/weapon_sword.png',
  spear:         '/assets/custom_uploaded/icons/weapon_sword.png',
  gun:           '/assets/custom_uploaded/icons/weapon_gun.png',
  bow:           '/assets/custom_uploaded/icons/weapon_bow.png',
  staff:         '/assets/custom_uploaded/icons/weapon_staff.png',
  dagger:        '/assets/custom_uploaded/icons/weapon_dagger.png',
  leather_armor: '/assets/custom_uploaded/icons/armor_leather.png',
  plate_armor:   '/assets/custom_uploaded/icons/armor_heavy.png',
  robe:          '/assets/custom_uploaded/icons/armor_robe.png',
  ring:          '/assets/custom_uploaded/icons/ring.png',
  necklace:      '/assets/custom_uploaded/icons/necklace.png',
  amulet:        '/assets/custom_uploaded/icons/necklace.png',  // amulet.png 없음 → necklace 대체
};

// 1. 🏭 병기창 1~10티어 장비 (120종)
Object.entries(FORGE_TIER_NAMES).forEach(([tierStr, items]) => {
  const tier = parseInt(tierStr, 10);
  Object.entries(items).forEach(([key, name]) => {
    if (key === 'descPrefix') return;
    const equipKey = `forge_t${tier}_${key}`;
    ICON_MAP[equipKey] = {
      src: EQUIP_TYPE_SRC[key] || '/assets/custom_uploaded/icons/weapon_sword.png',
      fallback: FALLBACK_EQUIP_EMOJIS[key] || '⚔️',
      label: `[${tier}T 병기창] ${name}`,
    };
  });
});

// 보스 고유 세트 슬롯 → 아이콘 파일 매핑
const BOSS_SLOT_SRC: Record<string, string> = {
  wpn: '/assets/custom_uploaded/icons/weapon_sword.png',
  arm: '/assets/custom_uploaded/icons/armor_heavy.png',
  acc: '/assets/custom_uploaded/icons/relic.png',
};

// 2. 👑 1F~10F 보스 고유 세트 무구 (30종)
Object.values(BOSS_UNIQUE_DEFINITIONS).forEach(defList => {
  defList.forEach(item => {
    const slotKey = item.id.split('_').pop() || 'wpn';
    ICON_MAP[item.id] = {
      src: BOSS_SLOT_SRC[slotKey] || '/assets/custom_uploaded/icons/relic.png',
      fallback: item.icon || '👑',
      label: `[${item.floor}F 보스세트] ${item.baseName}`,
    };
  });
});

// 3. 🎖️ PVP 아레나 명예 암시장 장비 & 보급함 (20종+)
Object.values(CLASS_HONOR_SHOP_DEFINITIONS).forEach(def => {
  let fallbackSrc = '/assets/custom_uploaded/icons/weapon_sword.png';
  if (def.slot === 'armor') {
    fallbackSrc = def.key.includes('priest') ? '/assets/custom_uploaded/icons/armor_robe.png' : '/assets/custom_uploaded/icons/armor_heavy.png';
  } else if (def.key.includes('gun')) {
    fallbackSrc = '/assets/custom_uploaded/icons/weapon_gun.png';
  } else if (def.key.includes('rogue')) {
    fallbackSrc = '/assets/custom_uploaded/icons/weapon_dagger.png';
  } else if (def.key.includes('mage')) {
    fallbackSrc = '/assets/custom_uploaded/icons/weapon_staff.png';
  } else if (def.key.includes('priest')) {
    fallbackSrc = '/assets/custom_uploaded/icons/book_holy_blessing.png';
  } else if (def.key.includes('vanguard')) {
    fallbackSrc = def.key.includes('rare') ? '/assets/custom_uploaded/icons/weapon_axe.png' : '/assets/custom_uploaded/icons/weapon_sword.png';
  }

  ICON_MAP[def.key] = {
    src: fallbackSrc,
    fallback: def.icon || '🎖️',
    label: `[명예암시장] ${def.name}`,
  };
});

// 명예 암시장 장신구 / 아티팩트
ICON_MAP.glory_amulet = {
  src: '/assets/custom_uploaded/icons/necklace.png',
  fallback: '📿',
  label: '[명예암시장] 투사의 용맹 목걸이',
};
ICON_MAP.glory_ring = {
  src: '/assets/custom_uploaded/icons/ring.png',
  fallback: '💍',
  label: '[명예암시장] 투사의 영광 반지',
};
ICON_MAP.overlord_crown = {
  src: '/assets/custom_uploaded/icons/relic.png',
  fallback: '👑',
  label: '[명예암시장] 차원 패왕의 주권 관',
};

// 명예 암시장 티어별 보급 상자 5종
ICON_MAP.glory_chest_silver = {
  src: '/assets/custom_uploaded/icons/key.png',
  fallback: '📦',
  label: '[명예암시장] 실버 장비 보급함',
};
ICON_MAP.glory_chest_gold = {
  src: '/assets/custom_uploaded/icons/key.png',
  fallback: '🎁',
  label: '[명예암시장] 골드 결전 무구함',
};
ICON_MAP.glory_chest_platinum = {
  src: '/assets/custom_uploaded/icons/key.png',
  fallback: '💎',
  label: '[명예암시장] 플래티넘 아티팩트 상자',
};
ICON_MAP.glory_chest_diamond = {
  src: '/assets/custom_uploaded/icons/key.png',
  fallback: '👑',
  label: '[명예암시장] 다이아몬드 지휘관 성유물함',
};
ICON_MAP.glory_chest_master = {
  src: '/assets/custom_uploaded/icons/key.png',
  fallback: '🌌',
  label: '[명예암시장] 마스터 패왕의 신화 무기고',
};

// 레거시 호환 명예 무구 3종
ICON_MAP.glory_sword = {
  src: '/assets/custom_uploaded/icons/weapon_sword.png',
  fallback: '🗡️',
  label: '[명예암시장] 투사의 처형검',
};
ICON_MAP.glory_gun = {
  src: '/assets/custom_uploaded/icons/weapon_gun.png',
  fallback: '🔫',
  label: '[명예암시장] 투사의 결전 마총',
};
ICON_MAP.glory_plate = {
  src: '/assets/custom_uploaded/icons/armor_heavy.png',
  fallback: '🛡️',
  label: '[명예암시장] 투사의 불패 판금갑',
};

// 🏆 차원 아레나 제식 투사 무구 시리즈
ICON_MAP.equip_arena_sword = ICON_MAP.glory_sword;
ICON_MAP.equip_arena_gun = ICON_MAP.glory_gun;
ICON_MAP.equip_arena_plate = ICON_MAP.glory_plate;
ICON_MAP.equip_arena_amulet = ICON_MAP.glory_amulet;
ICON_MAP.equip_arena_ring = ICON_MAP.glory_ring;
ICON_MAP.equip_arena_spear = {
  src: '/assets/custom_uploaded/icons/weapon_spear.png',
  fallback: '🔱',
  label: '[명예암시장] 투사의 파쇄창',
};
ICON_MAP.equip_arena_bow = {
  src: '/assets/custom_uploaded/icons/weapon_bow.png',
  fallback: '🏹',
  label: '[명예암시장] 투사의 저격궁',
};
ICON_MAP.equip_arena_staff = {
  src: '/assets/custom_uploaded/icons/weapon_staff.png',
  fallback: '🪄',
  label: '[명예암시장] 투사의 원소 마도봉',
};
ICON_MAP.equip_arena_dagger = {
  src: '/assets/custom_uploaded/icons/weapon_dagger.png',
  fallback: '🗡️',
  label: '[명예암시장] 투사의 암살 비수',
};
ICON_MAP.equip_arena_leather = {
  src: '/assets/custom_uploaded/icons/armor_leather.png',
  fallback: '🥋',
  label: '[명예암시장] 투사의 신속 경갑주',
};
ICON_MAP.equip_arena_robe = {
  src: '/assets/custom_uploaded/icons/armor_robe.png',
  fallback: '🥻',
  label: '[명예암시장] 투사의 마나 성의',
};
ICON_MAP.equip_arena_necklace = {
  src: '/assets/custom_uploaded/icons/necklace.png',
  fallback: '📿',
  label: '[명예암시장] 투사의 결전 목걸이',
};

// 4. 👾 마물 마도서 (Monster Skill Books) 및 마물 고유 스킬 (74종+) 동적 등록
function getMonsterSkillFallbackIcon(skillName: string, effectType?: string): string {
  const name = skillName.toLowerCase();
  if (effectType === 'bleed' || name.includes('출혈') || name.includes('혈') || name.includes('피')) return '🩸';
  if (effectType === 'poison' || name.includes('독') || name.includes('부패')) return '☠️';
  if (effectType === 'shield' || name.includes('방패') || name.includes('방벽') || name.includes('결계') || name.includes('성벽')) return '🛡️';
  if (effectType === 'heal' || name.includes('치유') || name.includes('회복') || name.includes('섭취')) return '💖';
  if (effectType === 'debuff' || name.includes('약화') || name.includes('감소') || name.includes('저주')) return '🔻';
  if (name.includes('화염') || name.includes('불') || name.includes('화형') || name.includes('흑염')) return '🔥';
  if (name.includes('빙결') || name.includes('냉기') || name.includes('동결') || name.includes('서린')) return '❄️';
  if (name.includes('번개') || name.includes('전격') || name.includes('뇌') || name.includes('벼락')) return '⚡';
  if (name.includes('초음파') || name.includes('울음') || name.includes('울부짖음') || name.includes('사자후') || name.includes('포효')) return '🔊';
  if (name.includes('발톱') || name.includes('할퀴기') || name.includes('손톱')) return '🐾';
  if (name.includes('박쥐')) return '🦇';
  if (name.includes('거울') || name.includes('환영') || name.includes('일루전')) return '🪞';
  if (name.includes('시공') || name.includes('차원') || name.includes('왜곡') || name.includes('역행')) return '⏳';
  if (name.includes('영혼') || name.includes('사신') || name.includes('유령') || name.includes('망령')) return '👻';
  if (name.includes('낫') || name.includes('수확')) return '⛓️';
  if (name.includes('공허') || name.includes('침식') || name.includes('암흑') || name.includes('그림자') || name.includes('심연')) return '🔮';
  if (name.includes('수정') || name.includes('에테르') || name.includes('마나') || name.includes('비전')) return '✨';
  if (name.includes('대지') || name.includes('골렘') || name.includes('지각') || name.includes('광맥')) return '🌋';
  if (name.includes('검') || name.includes('참') || name.includes('강타') || name.includes('일격') || name.includes('절단')) return '⚔️';
  return '📖';
}

Object.values(MONSTERS).forEach(m => {
  if (!m.skills || m.skills.length === 0) return;
  const cleanMonName = m.name.replace(/^\[(광폭화|호위|정예|무간의 광폭 보스)\]\s*/g, '').replace(/\s+[A-Z]$/g, '').replace(/\s+\([A-Z0-9]+\)$/g, '').trim();
  const cleanMonId = (m.id || 'monster').replace(/_[A-Z]$/, '').replace(/_mon_\d+.*$/, '');

  // 1) 대표 스킬 마도서 & 스킬 (드랍 대표 마도서)
  const sigIdx = (m.signatureSkillIndex !== undefined && m.signatureSkillIndex >= 0 && m.signatureSkillIndex < m.skills.length)
    ? m.signatureSkillIndex
    : 0;
  const sigSkill = m.skills[sigIdx] || m.skills[0];
  const sigSkillName = (sigSkill.name || '비기').trim();
  const bookKey = `book_m_${cleanMonId}`;
  const skillKey = `skill_m_${cleanMonId}`;
  const sigFallback = getMonsterSkillFallbackIcon(sigSkillName, sigSkill.effectType);

  ICON_MAP[bookKey] = {
    src: `/assets/custom_uploaded/icons/${bookKey}.png`,
    fallback: sigFallback,
    label: `[마물 마도서] ${cleanMonName} - ${sigSkillName}`,
  };
  ICON_MAP[skillKey] = {
    src: `/assets/custom_uploaded/icons/${bookKey}.png`,
    fallback: sigFallback,
    label: `[마물 스킬] ${sigSkillName} (${cleanMonName})`,
  };

  // 2) 마물의 모든 개별 스킬 등록
  m.skills.forEach((sk, idx) => {
    const sName = (sk.name || `기술 ${idx + 1}`).trim();
    const indSkillKey = `skill_m_${cleanMonId}_${idx}`;
    const fb = getMonsterSkillFallbackIcon(sName, sk.effectType);
    if (!ICON_MAP[indSkillKey]) {
      ICON_MAP[indSkillKey] = {
        src: `/assets/custom_uploaded/icons/${indSkillKey}.png`,
        fallback: fb,
        label: `[마물 스킬] ${cleanMonName} - ${sName}`,
      };
    }
  });
});

// 이모지 역방향 매핑 테이블
const EMOJI_TO_META: Record<string, IconMeta> = {};
Object.values(ICON_MAP).forEach(meta => {
  if (meta.fallback && !EMOJI_TO_META[meta.fallback]) {
    EMOJI_TO_META[meta.fallback] = meta;
  }
});
// 추가 이모지 별칭
EMOJI_TO_META['🗡️'] = ICON_MAP.weapon_sword;
EMOJI_TO_META['⬇️'] = ICON_MAP.debuff_atk;
EMOJI_TO_META['⬆️'] = ICON_MAP.buff_atk;
EMOJI_TO_META['👁️‍🗨️'] = ICON_MAP.blind;
// ✨ 강화 보급품 이모지 매핑
EMOJI_TO_META['✨🔥'] = ICON_MAP.enhanced_torch;
EMOJI_TO_META['🍱'] = ICON_MAP.enhanced_food;
EMOJI_TO_META['🍱✨'] = ICON_MAP.enhanced_food;
EMOJI_TO_META['⛏️✨'] = ICON_MAP.enhanced_pickaxe;
EMOJI_TO_META['🩹✨'] = ICON_MAP.enhanced_bandage;
EMOJI_TO_META['💧✨'] = ICON_MAP.enhanced_holy_water;
EMOJI_TO_META['🗝️✨'] = ICON_MAP.enhanced_key;
EMOJI_TO_META['⚓✨'] = ICON_MAP.enhanced_rift_anchor;
EMOJI_TO_META['🌑'] = ICON_MAP.dark_essence;
EMOJI_TO_META['🌾'] = ICON_MAP.food;
EMOJI_TO_META['🕸️'] = ICON_MAP.silk;
EMOJI_TO_META['🕸'] = ICON_MAP.silk;
EMOJI_TO_META['🧱'] = ICON_MAP.leather;
EMOJI_TO_META['⚫'] = ICON_MAP.coal;
EMOJI_TO_META['✨'] = ICON_MAP.prefix_stone;
EMOJI_TO_META['⭐'] = ICON_MAP.pure_prefix_stone;
EMOJI_TO_META['🌟'] = ICON_MAP.pure_prefix_stone;
EMOJI_TO_META['✨💎'] = ICON_MAP.pure_prefix_stone;
EMOJI_TO_META['🔮'] = ICON_MAP.suffix_stone;
EMOJI_TO_META['🌌'] = ICON_MAP.pure_suffix_stone;
EMOJI_TO_META['🪐'] = ICON_MAP.pure_suffix_stone;
EMOJI_TO_META['🌟💠'] = ICON_MAP.pure_suffix_stone;
EMOJI_TO_META['💠'] = ICON_MAP.pure_mana_stone;

export function getIconMeta(keyOrEmoji?: string): IconMeta | undefined {
  if (!keyOrEmoji) return undefined;
  if (ICON_MAP[keyOrEmoji]) {
    return ICON_MAP[keyOrEmoji];
  }
  // 🌟 보급품 / 촉매 세트 묶음 팩 키 동의어 자동 매핑
  const packBase = keyOrEmoji.replace(/_pack(?:_\d+)?$/, '');
  if (packBase !== keyOrEmoji) {
    if (ICON_MAP[packBase]) return ICON_MAP[packBase];
    if (packBase === 'pure_prefix' && ICON_MAP.pure_prefix_stone) return ICON_MAP.pure_prefix_stone;
    if (packBase === 'pure_suffix' && ICON_MAP.pure_suffix_stone) return ICON_MAP.pure_suffix_stone;
  }
  if (keyOrEmoji === 'pure_prefix' && ICON_MAP.pure_prefix_stone) return ICON_MAP.pure_prefix_stone;
  if (keyOrEmoji === 'pure_suffix' && ICON_MAP.pure_suffix_stone) return ICON_MAP.pure_suffix_stone;
  // 🌟 의뢰소(quest / quests) 동의어 키 자동 매핑
  if (keyOrEmoji === 'quest') {
    return ICON_MAP.quests;
  }
  // 🌟 심연 정화 동의어 매핑
  if (keyOrEmoji === 'abyss_purify' || keyOrEmoji === 'purify') {
    return ICON_MAP.abyss_purify;
  }
  // 🌟 equip_ 장비 ID 동적 슬롯 매핑
  if (keyOrEmoji.startsWith('equip_')) {
    if (ICON_MAP[keyOrEmoji]) return ICON_MAP[keyOrEmoji];
    // 1) 명예 암시장 고유 키 매칭 우선 확인
    for (const gloryKey of Object.keys(CLASS_HONOR_SHOP_DEFINITIONS)) {
      if (keyOrEmoji.includes(gloryKey) && ICON_MAP[gloryKey]) {
        return ICON_MAP[gloryKey];
      }
    }
    if (keyOrEmoji.includes('glory_amulet') && ICON_MAP.glory_amulet) return ICON_MAP.glory_amulet;
    if (keyOrEmoji.includes('glory_ring') && ICON_MAP.glory_ring) return ICON_MAP.glory_ring;
    if (keyOrEmoji.includes('overlord_crown') && ICON_MAP.overlord_crown) return ICON_MAP.overlord_crown;
    if (keyOrEmoji.includes('glory_sword') && ICON_MAP.glory_sword) return ICON_MAP.glory_sword;
    if (keyOrEmoji.includes('glory_gun') && ICON_MAP.glory_gun) return ICON_MAP.glory_gun;
    if (keyOrEmoji.includes('glory_plate') && ICON_MAP.glory_plate) return ICON_MAP.glory_plate;
    if (keyOrEmoji.includes('nemesis_pendant') && ICON_MAP.equip_nemesis_pendant) return ICON_MAP.equip_nemesis_pendant;
    if (keyOrEmoji.includes('nemesis_core') && ICON_MAP.equip_nemesis_core) return ICON_MAP.equip_nemesis_core;
    if (keyOrEmoji.includes('nemesis_crown') && ICON_MAP.equip_nemesis_crown) return ICON_MAP.equip_nemesis_crown;

    if (keyOrEmoji.includes('sword') || keyOrEmoji.includes('blade')) return ICON_MAP.weapon_sword;
    if (keyOrEmoji.includes('plate') || keyOrEmoji.includes('armor') || keyOrEmoji.includes('heavy')) return ICON_MAP.armor_heavy;
    if (keyOrEmoji.includes('robe')) return ICON_MAP.armor_robe;
    if (keyOrEmoji.includes('leather')) return ICON_MAP.armor_leather;
    if (keyOrEmoji.includes('ring')) return ICON_MAP.ring;
    if (keyOrEmoji.includes('necklace')) return ICON_MAP.necklace;
    if (keyOrEmoji.includes('amulet')) return ICON_MAP.rec_amulet || ICON_MAP.necklace;
    if (keyOrEmoji.includes('shield')) return ICON_MAP.equip_shield;
    if (keyOrEmoji.includes('crown') || keyOrEmoji.includes('relic') || keyOrEmoji.includes('chalice')) return ICON_MAP.relic;
    if (keyOrEmoji.includes('bow')) return ICON_MAP.weapon_bow;
    if (keyOrEmoji.includes('staff')) return ICON_MAP.weapon_staff;
    if (keyOrEmoji.includes('gun')) return ICON_MAP.weapon_gun;
    if (keyOrEmoji.includes('dagger')) return ICON_MAP.weapon_dagger;
    if (keyOrEmoji.includes('axe')) return ICON_MAP.weapon_axe;
    if (keyOrEmoji.includes('spear')) return ICON_MAP.weapon_spear;
    return ICON_MAP.weapon_sword;
  }
  // 🌟 skill_craft_ / craft_ 스킬 및 레시피 자동 동의어 연계
  if (keyOrEmoji.startsWith('skill_craft_')) {
    const recKey = keyOrEmoji.replace(/^skill_craft_/, 'craft_');
    if (ICON_MAP[recKey]) return ICON_MAP[recKey];
    const bookKey = keyOrEmoji.replace(/^skill_craft_/, 'book_');
    if (ICON_MAP[bookKey]) return ICON_MAP[bookKey];
  }
  if (keyOrEmoji.startsWith('rec_craft_')) {
    const craftKey = keyOrEmoji.replace(/^rec_/, '');
    if (ICON_MAP[craftKey]) return ICON_MAP[craftKey];
    const skillKey = keyOrEmoji.replace(/^rec_craft_/, 'skill_craft_');
    if (ICON_MAP[skillKey]) return ICON_MAP[skillKey];
  }
  // 🌟 skill_ 스킬 조회 시 대응하는 마도서(book_) 메타로 자동 동기화 (skill_m_, skill_boss_ 등)
  if (keyOrEmoji.startsWith('skill_')) {
    const bookKey = keyOrEmoji.replace(/^skill_/, 'book_');
    if (ICON_MAP[bookKey]) {
      return ICON_MAP[bookKey];
    }
  }
  // 🌟 book_ 마도서 조회 시 대응하는 스킬(skill_) 메타로 자동 동기화
  if (keyOrEmoji.startsWith('book_')) {
    const skillKey = keyOrEmoji.replace(/^book_/, 'skill_');
    if (ICON_MAP[skillKey]) {
      return ICON_MAP[skillKey];
    }
  }
  if (EMOJI_TO_META[keyOrEmoji]) {
    return EMOJI_TO_META[keyOrEmoji];
  }
  // Search by fallback emoji
  const found = Object.values(ICON_MAP).find(m => m.fallback === keyOrEmoji);
  return found;
}
