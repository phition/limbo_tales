// ─── 게임 아이콘 통합 매핑 테이블 (이미지 에셋 경로 + Fallback 이모지) ─────────────
import { FORGE_TIER_NAMES, BOSS_UNIQUE_DEFINITIONS } from '../data/equipment';
import { MONSTERS } from '../data/monsters';

export interface IconMeta {
  src: string;
  fallback: string;
  label?: string;
}

export const ICON_MAP: Record<string, IconMeta> = {
  // 🪵 6대 기본 자원
  wood: { src: '/assets/icons/resources/wood.png', fallback: '🪵', label: '목재' },
  stone: { src: '/assets/icons/resources/stone.png', fallback: '🪨', label: '석재' },
  iron: { src: '/assets/icons/resources/iron.png', fallback: '⚙️', label: '철광석' },
  food: { src: '/assets/icons/resources/food.png', fallback: '🍖', label: '식량' },
  gold: { src: '/assets/icons/resources/gold.png', fallback: '🪙', label: '골드' },
  ether: { src: '/assets/icons/resources/ether.png', fallback: '✨', label: '에테르' },

  // 🌿 던전 파밍 재료 (5종)
  herb: { src: '/assets/icons/resources/herb.png', fallback: '🌿', label: '약초' },
  leather: { src: '/assets/icons/resources/leather.png', fallback: '🥋', label: '가죽' },
  silk: { src: '/assets/icons/resources/silk.png', fallback: '🧵', label: '실크' },
  coal: { src: '/assets/icons/resources/coal.png', fallback: '⬛', label: '석탄' },
  bone: { src: '/assets/icons/resources/bone.png', fallback: '🦴', label: '짐승 뼈' },

  // 🔮 심연 희귀 유물 (2종)
  crystal: { src: '/assets/icons/resources/crystal.png', fallback: '💎', label: '마력 수정' },
  void_shard: { src: '/assets/icons/resources/void_shard.png', fallback: '🌌', label: '공허의 파편' },

  // ✨ 인챈트 마도석 (4종)
  prefix_stone: { src: '/assets/icons/resources/prefix_stone.png', fallback: '💎', label: '접두석' },
  suffix_stone: { src: '/assets/icons/resources/suffix_stone.png', fallback: '💠', label: '접미석' },
  pure_prefix_stone: { src: '/assets/icons/resources/pure_prefix_stone.png', fallback: '✨💎', label: '순수 접두석' },
  pure_suffix_stone: { src: '/assets/icons/resources/pure_suffix_stone.png', fallback: '🌟💠', label: '순수 접미석' },

  // 👑 10대 보스 신화 유물
  relic_floor_1: { src: '/assets/icons/resources/relic_floor_1.png', fallback: '🖤', label: '침묵의 흑핵' },
  relic_floor_2: { src: '/assets/icons/resources/relic_floor_2.png', fallback: '👻', label: '망령의 영혼수정' },
  relic_floor_3: { src: '/assets/icons/resources/relic_floor_3.png', fallback: '🫀', label: '원초의 광맥 심장' },
  relic_floor_4: { src: '/assets/icons/resources/relic_floor_4.png', fallback: '⚓', label: '심연의 시공 닻' },
  relic_floor_5: { src: '/assets/icons/resources/relic_floor_5.png', fallback: '👁️', label: '공허 지배자의 핵' },
  relic_floor_6: { src: '/assets/icons/resources/relic_floor_6.png', fallback: '🍷', label: '진홍 성배' },
  relic_floor_7: { src: '/assets/icons/resources/relic_floor_7.png', fallback: '🧭', label: '영혼 나침반' },
  relic_floor_8: { src: '/assets/icons/resources/relic_floor_8.png', fallback: '🛡️', label: '기사단장 휘장' },
  relic_floor_9: { src: '/assets/icons/resources/relic_floor_9.png', fallback: '🪞', label: '거울 파편' },
  relic_floor_10: { src: '/assets/icons/resources/relic_floor_10.png', fallback: '👑', label: '심연 군주의 마핵' },

  // 📜 심연 회고록 쪽지 (10종)
  memoir_note_1: { src: '/assets/icons/resources/memoir_note.png', fallback: '📜', label: '1층 회고록 쪽지' },
  memoir_note_2: { src: '/assets/icons/resources/memoir_note.png', fallback: '📜', label: '2층 회고록 쪽지' },
  memoir_note_3: { src: '/assets/icons/resources/memoir_note.png', fallback: '📜', label: '3층 회고록 쪽지' },
  memoir_note_4: { src: '/assets/icons/resources/memoir_note.png', fallback: '📜', label: '4층 회고록 쪽지' },
  memoir_note_5: { src: '/assets/icons/resources/memoir_note.png', fallback: '📜', label: '5층 회고록 쪽지' },
  memoir_note_6: { src: '/assets/icons/resources/memoir_note.png', fallback: '📜', label: '6층 회고록 쪽지' },
  memoir_note_7: { src: '/assets/icons/resources/memoir_note.png', fallback: '📜', label: '7층 회고록 쪽지' },
  memoir_note_8: { src: '/assets/icons/resources/memoir_note.png', fallback: '📜', label: '8층 회고록 쪽지' },
  memoir_note_9: { src: '/assets/icons/resources/memoir_note.png', fallback: '📜', label: '9층 회고록 쪽지' },
  memoir_note_10: { src: '/assets/icons/resources/memoir_note.png', fallback: '📜', label: '10층 회고록 쪽지' },

  // 🏛️ 구세계 오파츠 (20종)
  ooparts_1_1: { src: '/assets/icons/resources/ooparts_1_1.png', fallback: '📱', label: '금이 간 스마트폰 액정' },
  ooparts_1_2: { src: '/assets/icons/resources/ooparts_1_2.png', fallback: '🥤', label: '녹슨 스테인리스 텀블러' },
  ooparts_2_1: { src: '/assets/icons/resources/ooparts_2_1.png', fallback: '💳', label: '빛바랜 플라스틱 신용카드' },
  ooparts_2_2: { src: '/assets/icons/resources/ooparts_2_2.png', fallback: '📼', label: '먼지 쌓인 카세트 테이프' },
  ooparts_3_1: { src: '/assets/icons/resources/ooparts_3_1.png', fallback: '🔋', label: '방전된 리튬 배터리' },
  ooparts_3_2: { src: '/assets/icons/resources/ooparts_3_2.png', fallback: '☕', label: '금이 간 세라믹 머그잔' },
  ooparts_4_1: { src: '/assets/icons/resources/ooparts_4_1.png', fallback: '🗺️', label: '찢겨진 지하철 노선도' },
  ooparts_4_2: { src: '/assets/icons/resources/ooparts_4_2.png', fallback: '⌚', label: '멈춰버린 쿼츠 손목시계' },
  ooparts_5_1: { src: '/assets/icons/resources/ooparts_5_1.png', fallback: '🎧', label: '부서진 헤드폰' },
  ooparts_5_2: { src: '/assets/icons/resources/ooparts_5_2.png', fallback: '🪪', label: '비닐 코팅된 학생증' },
  ooparts_6_1: { src: '/assets/icons/resources/ooparts_6_1.png', fallback: '🍷', label: '녹슨 와인 오프너' },
  ooparts_6_2: { src: '/assets/icons/resources/ooparts_6_2.png', fallback: '💄', label: '말라붙은 립스틱 케이스' },
  ooparts_7_1: { src: '/assets/icons/resources/ooparts_7_1.png', fallback: '📷', label: '빛바랜 폴라로이드 사진' },
  ooparts_7_2: { src: '/assets/icons/resources/ooparts_7_2.png', fallback: '🖊️', label: '굳어버린 3색 볼펜' },
  ooparts_8_1: { src: '/assets/icons/resources/ooparts_8_1.png', fallback: '📻', label: '부서진 무전기 트랜시버' },
  ooparts_8_2: { src: '/assets/icons/resources/ooparts_8_2.png', fallback: '👓', label: '찌그러진 티타늄 안경테' },
  ooparts_9_1: { src: '/assets/icons/resources/ooparts_9_1.png', fallback: '🧊', label: '홀로그램 디스플레이 큐브' },
  ooparts_9_2: { src: '/assets/icons/resources/ooparts_9_2.png', fallback: '🔍', label: '녹아내린 카메라 렌즈' },
  ooparts_10_1: { src: '/assets/icons/resources/ooparts_10_1.png', fallback: '💾', label: '양자 코어 칩셋' },
  ooparts_10_2: { src: '/assets/icons/resources/ooparts_10_2.png', fallback: '🗝️', label: '타임캡슐 황동 열쇠' },

  // 🔥 8대 보급품 및 강화 보급품
  torch: { src: '/assets/icons/supplies/torch.png', fallback: '🔥', label: '탐험 횃불' },
  pickaxe: { src: '/assets/icons/supplies/pickaxe.png', fallback: '⛏️', label: '단단한 곡괭이' },
  bandage: { src: '/assets/icons/supplies/bandage.png', fallback: '🩹', label: '치유 붕대' },
  holy_water: { src: '/assets/icons/supplies/holy_water.png', fallback: '💧', label: '정화 성수' },
  key: { src: '/assets/icons/supplies/key.png', fallback: '🗝️', label: '만능 열쇠' },
  golden_toad: { src: '/assets/icons/supplies/golden_toad.png', fallback: '🐸', label: '황금 두꺼비' },
  skeleton_key: { src: '/assets/icons/supplies/key.png', fallback: '🔑', label: '해골 열쇠' },
  rift_anchor: { src: '/assets/icons/supplies/rift_anchor.png', fallback: '⚓', label: '차원의 닻' },
  compass: { src: '/assets/icons/supplies/compass.png', fallback: '🧭', label: '심연 나침반' },
  blood_contract: { src: '/assets/icons/supplies/blood_contract.png', fallback: '📜', label: '피의 서약서' },
  dimensional_whistle: { src: '/assets/icons/supplies/dimensional_whistle.png', fallback: '📯', label: '차원의 호각' },
  // ✨ 강화 보급품 7종
  enhanced_torch: { src: '/assets/icons/supplies/enhanced_torch.png', fallback: '✨🔥', label: '에테르 횃불 (강화)' },
  enhanced_food: { src: '/assets/icons/supplies/enhanced_food.png', fallback: '🍱✨', label: '던전 도시락 (강화)' },
  enhanced_pickaxe: { src: '/assets/icons/supplies/enhanced_pickaxe.png', fallback: '⛏️✨', label: '심연 곡괭이 (강화)' },
  enhanced_bandage: { src: '/assets/icons/supplies/enhanced_bandage.png', fallback: '🩹✨', label: '성유 붕대 (강화)' },
  enhanced_holy_water: { src: '/assets/icons/supplies/enhanced_holy_water.png', fallback: '💧✨', label: '여신의 성수 (강화)' },
  enhanced_key: { src: '/assets/icons/supplies/enhanced_key.png', fallback: '🗝️✨', label: '황금 열쇠 (강화)' },
  enhanced_rift_anchor: { src: '/assets/icons/supplies/enhanced_rift_anchor.png', fallback: '⚓✨', label: '심연의 닻 (강화)' },

  // 🩸 상태이상 (14종)
  bleed: { src: '/assets/icons/status/bleed.png', fallback: '🩸', label: '출혈' },
  poison: { src: '/assets/icons/status/poison.png', fallback: '☠️', label: '중독' },
  burn: { src: '/assets/icons/status/burn.png', fallback: '🔥', label: '화상' },
  freeze: { src: '/assets/icons/status/freeze.png', fallback: '❄️', label: '냉각' },
  stun: { src: '/assets/icons/status/stun.png', fallback: '💫', label: '기절' },
  shield: { src: '/assets/icons/status/shield.png', fallback: '🛡️', label: '보호막' },
  debuff_atk: { src: '/assets/icons/status/debuff_atk.png', fallback: '🔻', label: '공격력 약화' },
  debuff_def: { src: '/assets/icons/status/debuff_def.png', fallback: '💔', label: '방어력 약화' },
  buff_atk: { src: '/assets/icons/status/buff_atk.png', fallback: '🔺', label: '공격력 강화' },
  buff_def: { src: '/assets/icons/status/buff_def.png', fallback: '🔰', label: '방어력 강화' },
  regen: { src: '/assets/icons/status/regen.png', fallback: '💚', label: '재생' },
  blind: { src: '/assets/icons/status/blind.png', fallback: '👁️', label: '실명' },
  riposte: { src: '/assets/icons/status/riposte.png', fallback: '⚡', label: '환영반격' },
  immunity: { src: '/assets/icons/status/immunity.png', fallback: '🌟', label: '디버프 면역' },
  aether_barrier: { src: '/assets/icons/status/aether_barrier.png', fallback: '🛡️', label: '에테르 방벽' },
  groggy: { src: '/assets/icons/status/groggy.png', fallback: '💫', label: '그로기 (행동불능)' },
  overcharge: { src: '/assets/icons/status/overcharge.png', fallback: '⚡', label: '심연 오버차지' },
  warmth: { src: '/assets/icons/status/warmth.png', fallback: '🔥', label: '성화의 온기' },
  stealth: { src: '/assets/icons/status/stealth.png', fallback: '👤', label: '은신' },
  vampiric: { src: '/assets/icons/status/vampiric.png', fallback: '🩸', label: '흡혈' },
  true_damage: { src: '/assets/icons/status/true_damage.png', fallback: '✨', label: '순수 피해' },

  // ⚔️ 장비 슬롯 / 타입 / 레시피
  weapon_sword: { src: '/assets/icons/equipment/weapon_sword.png', fallback: '⚔️', label: '검' },
  weapon_spear: { src: '/assets/icons/equipment/weapon_sword.png', fallback: '🔱', label: '창' },
  weapon_axe: { src: '/assets/icons/equipment/weapon_axe.png', fallback: '🪓', label: '도끼' },
  weapon_bow: { src: '/assets/icons/equipment/weapon_bow.png', fallback: '🏹', label: '활' },
  weapon_staff: { src: '/assets/icons/equipment/weapon_staff.png', fallback: '🪄', label: '지팡이' },
  weapon_dagger: { src: '/assets/icons/equipment/weapon_dagger.png', fallback: '🔪', label: '단검' },
  weapon_gun: { src: '/assets/icons/equipment/weapon_gun.png', fallback: '🔫', label: '총기' },
  armor_heavy: { src: '/assets/icons/equipment/armor_heavy.png', fallback: '🛡️', label: '중갑' },
  armor_leather: { src: '/assets/icons/equipment/armor_leather.png', fallback: '🥋', label: '경갑' },
  armor_robe: { src: '/assets/icons/equipment/armor_robe.png', fallback: '🧙', label: '로브' },
  equip_shield: { src: '/assets/icons/equipment/shield.png', fallback: '🛡️', label: '방패' },
  ring: { src: '/assets/icons/equipment/ring.png', fallback: '💍', label: '반지' },
  necklace: { src: '/assets/icons/equipment/necklace.png', fallback: '📿', label: '목걸이' },
  amulet: { src: '/assets/icons/equipment/amulet.png', fallback: '🧿', label: '부적' },
  relic: { src: '/assets/icons/equipment/relic.png', fallback: '🏺', label: '유물' },

  // 🗡️ 레시피 ID 별칭
  rec_sword: { src: '/assets/icons/equipment/weapon_sword.png', fallback: '⚔️', label: '검' },
  rec_spear: { src: '/assets/icons/equipment/weapon_sword.png', fallback: '🔱', label: '창' },
  rec_gun: { src: '/assets/icons/equipment/weapon_gun.png', fallback: '🔫', label: '마총' },
  rec_bow: { src: '/assets/icons/equipment/weapon_bow.png', fallback: '🏹', label: '활' },
  rec_staff: { src: '/assets/icons/equipment/weapon_staff.png', fallback: '🪄', label: '지팡이' },
  rec_dagger: { src: '/assets/icons/equipment/weapon_dagger.png', fallback: '🔪', label: '단검' },
  rec_axe: { src: '/assets/icons/equipment/weapon_axe.png', fallback: '🪓', label: '도끼' },
  rec_shield: { src: '/assets/icons/equipment/shield.png', fallback: '🛡️', label: '방패' },
  rec_armor_heavy: { src: '/assets/icons/equipment/armor_heavy.png', fallback: '🛡️', label: '중갑' },
  rec_armor_leather: { src: '/assets/icons/equipment/armor_leather.png', fallback: '🥋', label: '경갑' },
  rec_armor_robe: { src: '/assets/icons/equipment/armor_robe.png', fallback: '🧙', label: '로브' },
  rec_ring: { src: '/assets/icons/equipment/ring.png', fallback: '💍', label: '반지' },
  rec_necklace: { src: '/assets/icons/equipment/necklace.png', fallback: '📿', label: '목걸이' },
  rec_amulet: { src: '/assets/icons/equipment/amulet.png', fallback: '🧿', label: '단조: 부적' },
  rec_relic: { src: '/assets/icons/equipment/relic.png', fallback: '🏺', label: '유물' },

  // ⚒️ 단조 / 제작 / 차징 핵심 아이콘 (Forge, Craft, Charge)
  forge: { src: '/assets/icons/buildings/blacksmith.png', fallback: '⚒️', label: '장비 단조 공정' },
  anvil: { src: '/assets/icons/buildings/blacksmith.png', fallback: '🔨', label: '단조 모루 타격' },
  enhance_equipment: { src: '/assets/icons/skills/squire_resolute.png', fallback: '⚡', label: '마도 장비 강화' },
  craft_grimoire: { src: '/assets/icons/buildings/alchemy.png', fallback: '🧪', label: '에테르 연금 집필' },
  enhance_skill: { src: '/assets/icons/skills/chrono_warp.png', fallback: '🌌', label: '스킬 비전 강화' },
  charge: { src: '/assets/icons/status/overcharge.png', fallback: '⚡', label: '에테르 마력 차징' },

  // 🧭 던전 탐험 이벤트 오브젝트 (10종)
  event_chest: { src: '/assets/icons/events/event_chest.png', fallback: '🎁', label: '보물 상자' },
  event_sarcophagus: { src: '/assets/icons/events/event_sarcophagus.png', fallback: '⚰️', label: '고대 석관' },
  event_altar: { src: '/assets/icons/events/event_altar.png', fallback: '🏛️', label: '여신의 제단' },
  event_ore_vein: { src: '/assets/icons/events/event_ore_vein.png', fallback: '⛏️', label: '에테르 광맥' },
  event_branching: { src: '/assets/icons/events/event_branching.png', fallback: '🧭', label: '갈림길 & 샛길' },
  event_merchant: { src: '/assets/icons/events/event_merchant.png', fallback: '🧳', label: '방랑 상인' },
  event_trap: { src: '/assets/icons/events/event_trap.png', fallback: '⚠️', label: '심연 함정' },
  event_buff: { src: '/assets/icons/events/event_buff.png', fallback: '✨', label: '에테르 기류' },
  event_portal: { src: '/assets/icons/events/event_portal.png', fallback: '🌀', label: '차원 포탈' },
  event_boss_encounter: { src: '/assets/icons/events/event_boss_encounter.png', fallback: '💀', label: '보스 조우' },

  // ⚠️ 던전 세부 함정 오브젝트 (5종)
  trap_spike: { src: '/assets/icons/events/trap_spike.png', fallback: '🩸', label: '함정: 흑철 가시 덫' },
  trap_poison: { src: '/assets/icons/events/trap_poison.png', fallback: '☠️', label: '함정: 부식성 맹독 분출구' },
  trap_flame: { src: '/assets/icons/events/trap_flame.png', fallback: '🔥', label: '함정: 화염 폭발 룬' },
  trap_frost: { src: '/assets/icons/events/trap_frost.png', fallback: '❄️', label: '함정: 극저온 서리 룬' },
  trap_stun: { src: '/assets/icons/events/trap_stun.png', fallback: '💫', label: '함정: 낙석 충격 트랩' },

  // 🏛️ 영지 건물 (13종)
  bonfire: { src: '/assets/icons/buildings/bonfire.png', fallback: '🔥', label: '방주의 모닥불' },
  cabin: { src: '/assets/icons/buildings/cabin.png', fallback: '🛖', label: '피난민 오두막' },
  lumberCamp: { src: '/assets/icons/buildings/lumberCamp.png', fallback: '🪓', label: '성채 벌목소' },
  quarry: { src: '/assets/icons/buildings/quarry.png', fallback: '⛏️', label: '마도 채석장' },
  tavern: { src: '/assets/icons/buildings/tavern.png', fallback: '🍺', label: '황혼의 주점' },
  blacksmith: { src: '/assets/icons/buildings/blacksmith.png', fallback: '⚒️', label: '고대 대장간' },
  sanctuary: { src: '/assets/icons/buildings/sanctuary.png', fallback: '⛪', label: '영혼의 성소' },
  alchemy: { src: '/assets/icons/buildings/alchemy.png', fallback: '🧪', label: '연금술 공방' },
  arenaGate: { src: '/assets/icons/buildings/arenaGate.png', fallback: '⚔️', label: '차원 아레나' },
  infirmary: { src: '/assets/icons/buildings/infirmary.png', fallback: '🏥', label: '야전 의무대' },
  market: { src: '/assets/icons/buildings/market.png', fallback: '⚖️', label: '황혼의 교역소' },
  storage: { src: '/assets/icons/buildings/storage.png', fallback: '📦', label: '중앙 보관고' },
  butchery: { src: '/assets/icons/buildings/butchery.png', fallback: '🥩', label: '원정 도축장' },

  // 🪄 직업 고유 스킬 (Class Skills)
  squire_strike: { src: '/assets/icons/skills/squire_strike.png', fallback: '⚔️', label: '단련된 일격' },
  squire_guard: { src: '/assets/icons/skills/squire_guard.png', fallback: '🛡️', label: '방패 올리기' },
  squire_resolute: { src: '/assets/icons/skills/squire_resolute.png', fallback: '🌟', label: '불굴의 결의' },
  paladin_judgment: { src: '/assets/icons/skills/paladin_judgment.png', fallback: '🔨', label: '단죄의 일격' },
  paladin_aegis: { src: '/assets/icons/skills/paladin_aegis.png', fallback: '🛡️', label: '신성 방벽' },
  paladin_sanctuary: { src: '/assets/icons/skills/paladin_sanctuary.png', fallback: '✨', label: '홀리 오라' },
  guard_shield_slam: { src: '/assets/icons/skills/guard_shield_slam.png', fallback: '🛡️', label: '방패 강타' },
  guard_fortress: { src: '/assets/icons/skills/guard_fortress.png', fallback: '🏰', label: '철벽의 태세' },
  guard_unbreakable: { src: '/assets/icons/skills/guard_unbreakable.png', fallback: '⛓️', label: '절대 방진' },
  valk_spear: { src: '/assets/icons/skills/valk_spear.png', fallback: '✨', label: '심판의 빛창' },
  valk_divine_shield: { src: '/assets/icons/skills/valk_divine_shield.png', fallback: '🛡️', label: '신의 가호' },
  valk_ultimate: { src: '/assets/icons/skills/valk_ultimate.png', fallback: '👑', label: '영원의 성역' },
  rogue_slash: { src: '/assets/icons/skills/rogue_slash.png', fallback: '🗡️', label: '급소 찌르기' },
  rogue_smoke: { src: '/assets/icons/skills/rogue_smoke.png', fallback: '💨', label: '연막탄' },
  rogue_shadow_dance: { src: '/assets/icons/skills/rogue_shadow_dance.png', fallback: '⚡', label: '암영 난무' },
  assassin_strike: { src: '/assets/icons/skills/assassin_strike.png', fallback: '🗡️', label: '암영 연격' },
  assassin_poison: { src: '/assets/icons/skills/assassin_poison.png', fallback: '☠️', label: '독무 연격' },
  assassin_execution: { src: '/assets/icons/skills/assassin_execution.png', fallback: '🩸', label: '심장 꿰뚫기' },
  phantom_teleport: { src: '/assets/icons/skills/phantom_teleport.png', fallback: '👤', label: '심연의 도약' },
  phantom_clone: { src: '/assets/icons/skills/phantom_clone.png', fallback: '👥', label: '분신 난무' },
  phantom_ultimate: { src: '/assets/icons/skills/phantom_ultimate.png', fallback: '⚡', label: '무간암영참' },
  duel_riposte: { src: '/assets/icons/skills/duel_riposte.png', fallback: '⚔️', label: '환영의 반격' },
  duel_flurry: { src: '/assets/icons/skills/duel_flurry.png', fallback: '🗡️', label: '질풍 4연참' },
  duel_blade_waltz: { src: '/assets/icons/skills/duel_blade_waltz.png', fallback: '⚡', label: '환영 난무 왈츠' },
  apprentice_bolt: { src: '/assets/icons/skills/apprentice_bolt.png', fallback: '✨', label: '에테르 볼트' },
  apprentice_flame: { src: '/assets/icons/skills/apprentice_flame.png', fallback: '🔥', label: '원소 폭발' },
  apprentice_mana_burst: { src: '/assets/icons/skills/apprentice_mana_burst.png', fallback: '🔮', label: '에테르 과충전' },
  elem_chain_lightning: { src: '/assets/icons/skills/elem_chain_lightning.png', fallback: '⚡', label: '연쇄 번개' },
  elem_blizzard: { src: '/assets/icons/skills/elem_blizzard.png', fallback: '❄️', label: '혹한의 눈보라' },
  elem_supernova: { src: '/assets/icons/skills/elem_supernova.png', fallback: '💥', label: '원소 초신성' },
  calamity_singularity: { src: '/assets/icons/skills/calamity_singularity.png', fallback: '🌌', label: '공허의 특이점' },
  calamity_arcane_storm: { src: '/assets/icons/skills/calamity_arcane_storm.png', fallback: '⚡', label: '비전 폭풍' },
  calamity_ultimate: { src: '/assets/icons/skills/calamity_ultimate.png', fallback: '☄️', label: '종말의 메테오' },
  acolyte_heal: { src: '/assets/icons/skills/acolyte_heal.png', fallback: '💖', label: '치유의 기도' },
  acolyte_smite: { src: '/assets/icons/skills/acolyte_smite.png', fallback: '🌟', label: '신성 광휘' },
  acolyte_blessing: { src: '/assets/icons/skills/acolyte_blessing.png', fallback: '🌈', label: '성자의 정화 가호' },
  saint_blessing: { src: '/assets/icons/skills/saint_blessing.png', fallback: '🌈', label: '대성녀의 축복' },
  saint_purify: { src: '/assets/icons/skills/saint_purify.png', fallback: '💖', label: '구원의 빛' },
  saint_ultimate: { src: '/assets/icons/skills/saint_ultimate.png', fallback: '🕊️', label: '부활의 성가' },
  van_cleave: { src: '/assets/icons/skills/van_cleave.png', fallback: '🗡️', label: '대검 베어가르기' },
  van_warcry: { src: '/assets/icons/skills/van_warcry.png', fallback: '🗣️', label: '전사의 함성' },
  van_frenzy_strike: { src: '/assets/icons/skills/van_frenzy_strike.png', fallback: '🔥', label: '분노의 일격' },
  ber_blood_rend: { src: '/assets/icons/skills/ber_blood_rend.png', fallback: '🩸', label: '혈풍참' },
  ber_rampage: { src: '/assets/icons/skills/ber_rampage.png', fallback: '😈', label: '피의 폭주' },
  ber_berserk_crush: { src: '/assets/icons/skills/ber_berserk_crush.png', fallback: '🌋', label: '광란의 대지분쇄' },
  val_ragnarok_slash: { src: '/assets/icons/skills/val_ragnarok_slash.png', fallback: '⚔️', label: '라그나로크 슬래시' },
  val_immortal_roar: { src: '/assets/icons/skills/val_immortal_roar.png', fallback: '👑', label: '불멸의 포효' },
  val_ultimate: { src: '/assets/icons/skills/val_ultimate.png', fallback: '💥', label: '불멸의 결전분노' },
  warlord_rallying_cry: { src: '/assets/icons/skills/warlord_rallying_cry.png', fallback: '🗣️', label: '진격의 지휘 함성' },
  warlord_shield_crush: { src: '/assets/icons/skills/warlord_shield_crush.png', fallback: '🛡️', label: '파성추 강타' },
  warlord_overwhelm: { src: '/assets/icons/skills/warlord_overwhelm.png', fallback: '🚩', label: '전열 압도' },
  gun_rapid_fire: { src: '/assets/icons/skills/gun_rapid_fire.png', fallback: '🔫', label: '에테르 2점사' },
  gun_flashbang: { src: '/assets/icons/skills/gun_flashbang.png', fallback: '✨', label: '섬광탄 사격' },
  gun_aimed_snipe: { src: '/assets/icons/skills/gun_aimed_snipe.png', fallback: '🎯', label: '정밀 조준사격' },
  tac_penetration_shot: { src: '/assets/icons/skills/tac_penetration_shot.png', fallback: '⚡', label: '레일건 관통포' },
  tac_drone_strike: { src: '/assets/icons/skills/tac_drone_strike.png', fallback: '🛰️', label: '전술 드론 호출' },
  tac_orbital_flare: { src: '/assets/icons/skills/tac_orbital_flare.png', fallback: '🚀', label: '궤도 조명 폭격' },
  sharp_headshot: { src: '/assets/icons/skills/sharp_headshot.png', fallback: '🎯', label: '치명적 헤드샷' },
  sharp_camouflage: { src: '/assets/icons/skills/sharp_camouflage.png', fallback: '👤', label: '그림자 위장술' },
  sharp_abyssal_bullet: { src: '/assets/icons/skills/sharp_abyssal_bullet.png', fallback: '💥', label: '심연 관통탄' },
  gun_hyper_cannon: { src: '/assets/icons/skills/gun_hyper_cannon.png', fallback: '⚡', label: '하이퍼 펄스 버스터' },
  gun_tactical_reload: { src: '/assets/icons/skills/gun_tactical_reload.png', fallback: '🔋', label: '오버클럭 리로드' },
  gun_orbital_strike: { src: '/assets/icons/skills/gun_orbital_strike.png', fallback: '🛰️', label: '궤도 에테르 버스터' },
  scholar_gravity: { src: '/assets/icons/skills/scholar_gravity.png', fallback: '🌀', label: '중력장 소환' },
  scholar_time_warp: { src: '/assets/icons/skills/scholar_time_warp.png', fallback: '⏳', label: '시공 왜곡' },
  scholar_arcane_overload: { src: '/assets/icons/skills/scholar_arcane_overload.png', fallback: '📚', label: '아케인 오버로드' },
  bishop_holy_wave: { src: '/assets/icons/skills/bishop_holy_wave.png', fallback: '🌊', label: '성스러운 파동' },
  bishop_radiance: { src: '/assets/icons/skills/bishop_radiance.png', fallback: '☀️', label: '성역의 광채' },
  bishop_holy_assembly: { src: '/assets/icons/skills/bishop_holy_assembly.png', fallback: '✝️', label: '신성 집결' },
  warpriest_smite_crusade: { src: '/assets/icons/skills/warpriest_smite_crusade.png', fallback: '⚔️', label: '성전 강타' },
  warpriest_sacred_ground: { src: '/assets/icons/skills/warpriest_sacred_ground.png', fallback: '🏛️', label: '성지 정화 결계' },
  warpriest_holy_proclamation: { src: '/assets/icons/skills/warpriest_holy_proclamation.png', fallback: '📜', label: '성전 선포' },

  // 📖 마도 비전서 (Skill Books) & 스킬 ID 매핑 (마도서 아이콘 = 스킬 아이콘 일체화)
  book_heavy_strike: { src: '/assets/icons/books/book_heavy_strike.png', fallback: '⚔️', label: '비전서: 강타' },
  skill_heavy_strike: { src: '/assets/icons/books/book_heavy_strike.png', fallback: '⚔️', label: '강타' },
  book_shield_guard: { src: '/assets/icons/books/book_shield_guard.png', fallback: '🛡️', label: '비전서: 방패 방어' },
  skill_shield_guard: { src: '/assets/icons/books/book_shield_guard.png', fallback: '🛡️', label: '방패 방어' },
  book_first_aid: { src: '/assets/icons/books/book_first_aid.png', fallback: '🩹', label: '비전서: 응급 처치' },
  skill_first_aid: { src: '/assets/icons/books/book_first_aid.png', fallback: '🩹', label: '응급 처치' },
  book_puncture: { src: '/assets/icons/books/book_puncture.png', fallback: '🗡️', label: '비전서: 약점 찌르기' },
  skill_puncture: { src: '/assets/icons/books/book_puncture.png', fallback: '🗡️', label: '약점 찌르기' },
  book_flame_dart: { src: '/assets/icons/books/book_flame_dart.png', fallback: '✨', label: '비전서: 에테르 화살' },
  skill_flame_dart: { src: '/assets/icons/books/book_flame_dart.png', fallback: '✨', label: '에테르 화살' },
  book_flame_cleave: { src: '/assets/icons/books/book_flame_cleave.png', fallback: '🔥', label: '비전서: 화염 강타' },
  skill_flame_cleave: { src: '/assets/icons/books/book_flame_cleave.png', fallback: '🔥', label: '화염 강타' },
  book_phalanx_wall: { src: '/assets/icons/books/book_phalanx_wall.png', fallback: '🏰', label: '비전서: 철벽의 방진' },
  skill_phalanx_wall: { src: '/assets/icons/books/book_phalanx_wall.png', fallback: '🏰', label: '철벽의 방진' },
  book_war_cry: { src: '/assets/icons/books/book_war_cry.png', fallback: '📢', label: '비전서: 전장의 포효' },
  skill_war_cry: { src: '/assets/icons/books/book_war_cry.png', fallback: '📢', label: '전장의 포효' },
  book_holy_blessing: { src: '/assets/icons/books/book_holy_blessing.png', fallback: '🌟', label: '비전서: 신성한 축복' },
  skill_holy_blessing: { src: '/assets/icons/books/book_holy_blessing.png', fallback: '🌟', label: '신성한 축복' },
  book_shadow_ambush: { src: '/assets/icons/books/book_shadow_ambush.png', fallback: '🥷', label: '비전서: 그림자 습격' },
  skill_shadow_ambush: { src: '/assets/icons/books/book_shadow_ambush.png', fallback: '🥷', label: '그림자 습격' },
  book_sacred_veil: { src: '/assets/icons/books/book_sacred_veil.png', fallback: '🕊️', label: '비전서: 축복의 베일' },
  skill_sacred_veil: { src: '/assets/icons/books/book_sacred_veil.png', fallback: '🕊️', label: '축복의 베일' },
  book_thunderbolt: { src: '/assets/icons/books/book_thunderbolt.png', fallback: '⚡', label: '비전서: 천둥의 벼락' },
  skill_thunderbolt: { src: '/assets/icons/books/book_thunderbolt.png', fallback: '⚡', label: '천둥의 벼락' },
  book_abyssal_hex: { src: '/assets/icons/books/book_abyssal_hex.png', fallback: '🔮', label: '비전서: 심연의 저주' },
  skill_abyssal_hex: { src: '/assets/icons/books/book_abyssal_hex.png', fallback: '🔮', label: '심연의 저주' },
  book_sanctuary_barrier: { src: '/assets/icons/books/book_sanctuary_barrier.png', fallback: '🛡️', label: '비전서: 성역의 결계' },
  skill_sanctuary_barrier: { src: '/assets/icons/books/book_sanctuary_barrier.png', fallback: '🛡️', label: '성역의 결계' },
  book_blade_dance: { src: '/assets/icons/books/book_blade_dance.png', fallback: '🌪️', label: '비전서: 광기의 난무' },
  skill_blade_dance: { src: '/assets/icons/books/book_blade_dance.png', fallback: '🌪️', label: '광기의 난무' },
  book_purifying_light: { src: '/assets/icons/books/book_purifying_light.png', fallback: '✨', label: '비전서: 정화의 빛' },
  skill_purifying_light: { src: '/assets/icons/books/book_purifying_light.png', fallback: '✨', label: '정화의 빛' },
  book_epic_aegis_judgment: { src: '/assets/icons/books/book_epic_aegis_judgment.png', fallback: '🛡️', label: '비전서: 성전의 수호 방진' },
  skill_epic_aegis_judgment: { src: '/assets/icons/books/book_epic_aegis_judgment.png', fallback: '🛡️', label: '성전의 수호 방진' },
  book_epic_shadow_execution: { src: '/assets/icons/books/book_epic_shadow_execution.png', fallback: '🗡️', label: '비전서: 그림자 처형' },
  skill_epic_shadow_execution: { src: '/assets/icons/books/book_epic_shadow_execution.png', fallback: '🗡️', label: '그림자 처형' },
  book_epic_arcane_supernova: { src: '/assets/icons/books/book_epic_arcane_supernova.png', fallback: '🔮', label: '비전서: 초신성 폭발' },
  skill_epic_arcane_supernova: { src: '/assets/icons/books/book_epic_arcane_supernova.png', fallback: '🔮', label: '초신성 폭발' },
  book_epic_divine_grace: { src: '/assets/icons/books/book_epic_divine_grace.png', fallback: '🕊️', label: '비전서: 성령의 기적' },
  skill_epic_divine_grace: { src: '/assets/icons/books/book_epic_divine_grace.png', fallback: '🕊️', label: '성령의 기적' },
  book_epic_arrow_storm: { src: '/assets/icons/books/book_epic_arrow_storm.png', fallback: '🏹', label: '비전서: 폭풍의 화살비' },
  skill_epic_arrow_storm: { src: '/assets/icons/books/book_epic_arrow_storm.png', fallback: '🏹', label: '폭풍의 화살비' },
  book_epic_plasma_annihilation: { src: '/assets/icons/books/book_epic_plasma_annihilation.png', fallback: '⚡', label: '비전서: 플라즈마 파쇄포' },
  skill_epic_plasma_annihilation: { src: '/assets/icons/books/book_epic_plasma_annihilation.png', fallback: '⚡', label: '플라즈마 파쇄포' },
  book_epic_blood_rampage: { src: '/assets/icons/books/book_epic_blood_rampage.png', fallback: '🪓', label: '비전서: 피의 광란참' },
  skill_epic_blood_rampage: { src: '/assets/icons/books/book_epic_blood_rampage.png', fallback: '🪓', label: '피의 광란참' },
  book_armageddon: { src: '/assets/icons/books/book_armageddon.png', fallback: '🌌', label: '고대 마도서: 아마겟돈' },
  skill_armageddon: { src: '/assets/icons/books/book_armageddon.png', fallback: '🌌', label: '아마겟돈' },
  book_valhalla_aegis: { src: '/assets/icons/books/book_valhalla_aegis.png', fallback: '👑', label: '신성 성전: 발할라의 불멸' },
  skill_valhalla_aegis: { src: '/assets/icons/books/book_valhalla_aegis.png', fallback: '👑', label: '발할라의 불멸' },
  book_genesis_halo: { src: '/assets/icons/books/book_genesis_halo.png', fallback: '🕊️', label: '태초의 성전: 창세의 성령' },
  skill_genesis_halo: { src: '/assets/icons/books/book_genesis_halo.png', fallback: '🕊️', label: '창세의 성령' },
  book_boss_colossus_core: { src: '/assets/icons/books/book_boss_colossus_core.png', fallback: '❄️', label: '비전서: 흑핵의 영구동결 [1F]' },
  skill_boss_colossus_core: { src: '/assets/icons/books/book_boss_colossus_core.png', fallback: '❄️', label: '흑핵의 영구동결' },
  book_boss_deathknight_reap: { src: '/assets/icons/books/book_boss_deathknight_reap.png', fallback: '💀', label: '비전서: 사령의 영혼 수확 [2F]' },
  skill_boss_deathknight_reap: { src: '/assets/icons/books/book_boss_deathknight_reap.png', fallback: '💀', label: '사령의 영혼 수확' },
  book_boss_behemoth_eruption: { src: '/assets/icons/books/book_boss_behemoth_eruption.png', fallback: '🌋', label: '비전서: 광맥의 마도 분출 [3F]' },
  skill_boss_behemoth_eruption: { src: '/assets/icons/books/book_boss_behemoth_eruption.png', fallback: '🌋', label: '광맥의 마도 분출' },
  book_boss_chrono_warp: { src: '/assets/icons/books/book_boss_chrono_warp.png', fallback: '⏳', label: '비전서: 시공간 차원 붕괴 [4F]' },
  skill_boss_chrono_warp: { src: '/assets/icons/books/book_boss_chrono_warp.png', fallback: '⏳', label: '시공간 차원 붕괴' },
  book_boss_void_cataclysm: { src: '/assets/icons/books/book_boss_void_cataclysm.png', fallback: '🔮', label: '비전서: 원초의 공허 묵시록 [5F]' },
  skill_boss_void_cataclysm: { src: '/assets/icons/books/book_boss_void_cataclysm.png', fallback: '🔮', label: '원초의 공허 묵시록' },
  book_boss_blood_monarch: { src: '/assets/icons/books/book_boss_blood_monarch.png', fallback: '🍷', label: '비전서: 진홍의 피의 지배 [6F]' },
  skill_boss_blood_monarch: { src: '/assets/icons/books/book_boss_blood_monarch.png', fallback: '🍷', label: '진홍의 피의 지배' },
  book_boss_oblivion_scythe: { src: '/assets/icons/books/book_boss_oblivion_scythe.png', fallback: '⛓️', label: '비전서: 망각의 사신 낫 [7F]' },
  skill_boss_oblivion_scythe: { src: '/assets/icons/books/book_boss_oblivion_scythe.png', fallback: '⛓️', label: '망각의 사신 낫' },
  book_boss_judgment_sanctum: { src: '/assets/icons/books/book_boss_judgment_sanctum.png', fallback: '🏰', label: '비전서: 단죄의 칠흑 성역 [8F]' },
  skill_boss_judgment_sanctum: { src: '/assets/icons/books/book_boss_judgment_sanctum.png', fallback: '🏰', label: '단죄의 칠흑 성역' },
  book_boss_mirror_kaleidoscope: { src: '/assets/icons/books/book_boss_mirror_kaleidoscope.png', fallback: '🪞', label: '비전서: 거울 만화경 환영 [9F]' },
  skill_boss_mirror_kaleidoscope: { src: '/assets/icons/books/book_boss_mirror_kaleidoscope.png', fallback: '🪞', label: '거울 만화경 환영' },
  book_boss_asmodeus_armageddon: { src: '/assets/icons/books/book_boss_asmodeus_armageddon.png', fallback: '👑', label: '비전서: 아스모데우스 아마겟돈 [10F]' },
  skill_boss_asmodeus_armageddon: { src: '/assets/icons/books/book_boss_asmodeus_armageddon.png', fallback: '👑', label: '아스모데우스 아마겟돈' },

  // 🌟 2차 전직 특화 스킬 (18종)
  // 요새 (Fortress)
  fortress_bastion: { src: '/assets/icons/skills/fortress_bastion.png', fallback: '🏰', label: '요새 결계' },
  fortress_earthshaker: { src: '/assets/icons/skills/fortress_earthshaker.png', fallback: '🌋', label: '대지 분쇄타' },
  fortress_ultimate: { src: '/assets/icons/skills/fortress_ultimate.png', fallback: '🛡️', label: '[궁극기] 절대 불락의 성채' },
  // 칼날 무희 (Blade Dancer)
  dancer_thousand_cuts: { src: '/assets/icons/skills/dancer_thousand_cuts.png', fallback: '🗡️', label: '천공의 칼바람' },
  dancer_mirage_dance: { src: '/assets/icons/skills/dancer_mirage_dance.png', fallback: '💃', label: '신기루 칼춤' },
  dancer_ultimate: { src: '/assets/icons/skills/dancer_ultimate.png', fallback: '✨', label: '[궁극기] 만화경 환영난무' },
  // 크로노맨서 (Chronomancer)
  chrono_time_stop: { src: '/assets/icons/skills/chrono_time_stop.png', fallback: '⏱️', label: '시간 정지' },
  chrono_gravity_collapse: { src: '/assets/icons/skills/chrono_gravity_collapse.png', fallback: '🌀', label: '중력 붕괴' },
  chrono_ultimate: { src: '/assets/icons/skills/chrono_ultimate.png', fallback: '⏳', label: '[궁극기] 시간 역행' },
  // 성전사 군주 (Crusader Lord)
  crusader_judgment_hammer: { src: '/assets/icons/skills/crusader_judgment_hammer.png', fallback: '🔨', label: '심판의 망치' },
  crusader_holy_sanctuary_field: { src: '/assets/icons/skills/crusader_holy_sanctuary_field.png', fallback: '⛪', label: '거룩한 성역 결계' },
  crusader_ultimate: { src: '/assets/icons/skills/crusader_ultimate.png', fallback: '⚡', label: '[궁극기] 성전의 천벌' },
  // 강철 원수 (Iron Marshal)
  marshal_annihilation_order: { src: '/assets/icons/skills/marshal_annihilation_order.png', fallback: '🚩', label: '총공격 섬멸령' },
  marshal_phalanx_crush: { src: '/assets/icons/skills/marshal_phalanx_crush.png', fallback: '🛡️', label: '철벽 팔랑크스 분쇄' },
  marshal_ultimate: { src: '/assets/icons/skills/marshal_ultimate.png', fallback: '🚀', label: '[궁극기] 방주 결전포' },
  // 유령 저격수 (Ghost Sniper)
  sniper_death_sentence: { src: '/assets/icons/skills/sniper_death_sentence.png', fallback: '🎯', label: '사형 선고' },
  sniper_shadow_meld: { src: '/assets/icons/skills/sniper_shadow_meld.png', fallback: '👤', label: '암영 잠행' },
  sniper_ultimate: { src: '/assets/icons/skills/sniper_ultimate.png', fallback: '💀', label: '[궁극기] 유령 탄환 (사신 스나이프)' },

  // 🎖️ 전투 전술 모멘텀 뱃지 (7종) & FEVER 게이지 & 시너지 아이콘
  badge_assist: { src: '/assets/icons/badges/badge_assist.png', fallback: '🎯', label: '모멘텀 뱃지: ASSIST (원호 추격)' },
  badge_extra: { src: '/assets/icons/badges/badge_extra.png', fallback: '⚡', label: '모멘텀 뱃지: EXTRA (스킬 연계)' },
  badge_crit: { src: '/assets/icons/badges/badge_crit.png', fallback: '💥', label: '모멘텀 뱃지: CRIT (치명 일격)' },
  badge_guard: { src: '/assets/icons/badges/badge_guard.png', fallback: '🛡️', label: '모멘텀 뱃지: GUARD (수호 개입)' },
  badge_heal: { src: '/assets/icons/badges/badge_heal.png', fallback: '💖', label: '모멘텀 뱃지: HEAL (신성 치유)' },
  badge_counter: { src: '/assets/icons/badges/badge_counter.png', fallback: '⚔️', label: '모멘텀 뱃지: COUNTER (환영 반격)' },
  badge_break: { src: '/assets/icons/badges/badge_break.png', fallback: '💫', label: '모멘텀 뱃지: BREAK (차징 붕괴)' },
  badge_detonation: { src: '/assets/icons/badges/badge_detonation.png', fallback: '💥', label: '전투 연계: DETONATION (연계 폭발)' },
  fever_gauge: { src: '/assets/icons/badges/fever_gauge.png', fallback: '🔥', label: 'FEVER 게이지: 전술 모멘텀 완충' },
  fever_burst: { src: '/assets/icons/badges/fever_burst.png', fallback: '⚡', label: 'FEVER 폭발: 궁극기 시너지 방출' },
  fever_miracle_resurrection: { src: '/assets/icons/badges/fever_miracle_resurrection.png', fallback: '🕊️', label: 'FEVER 시너지: 기적의 소생' },
  fever_divine_sanctuary: { src: '/assets/icons/badges/fever_divine_sanctuary.png', fallback: '💖', label: 'FEVER 시너지: 신성 성역' },
  fever_flurry_overdrive: { src: '/assets/icons/badges/fever_flurry_overdrive.png', fallback: '⚡', label: 'FEVER 시너지: 질풍노도' },
  fever_total_assault: { src: '/assets/icons/badges/fever_total_assault.png', fallback: '🎯', label: 'FEVER 시너지: 총력 섬멸' },
  fever_immortal_bastion: { src: '/assets/icons/badges/fever_immortal_bastion.png', fallback: '🛡️', label: 'FEVER 시너지: 불멸의 요새' },
  fever_vampiric_requiem: { src: '/assets/icons/badges/fever_vampiric_requiem.png', fallback: '🍷', label: 'FEVER 시너지: 흡혈 진혼곡' },
  fever_grand_maestro: { src: '/assets/icons/badges/fever_grand_maestro.png', fallback: '🌐', label: 'FEVER 시너지: 전술의 극의' },
  fever_tactical_burst: { src: '/assets/icons/badges/fever_tactical_burst.png', fallback: '🌟', label: 'FEVER 시너지: 전술 파동' },

  // 👑 전투 승리 엠블럼 / 이모지 커스텀
  battle_victory: { src: '/assets/icons/badges/battle_victory.png', fallback: '👑', label: '전투 승리 엠블럼/이모지' },
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
  sword:         '/assets/icons/equipment/weapon_sword.png',
  spear:         '/assets/icons/equipment/weapon_sword.png',
  gun:           '/assets/icons/equipment/weapon_gun.png',
  bow:           '/assets/icons/equipment/weapon_bow.png',
  staff:         '/assets/icons/equipment/weapon_staff.png',
  dagger:        '/assets/icons/equipment/weapon_dagger.png',
  leather_armor: '/assets/icons/equipment/armor_leather.png',
  plate_armor:   '/assets/icons/equipment/armor_heavy.png',
  robe:          '/assets/icons/equipment/armor_robe.png',
  ring:          '/assets/icons/equipment/ring.png',
  necklace:      '/assets/icons/equipment/necklace.png',
  amulet:        '/assets/icons/equipment/necklace.png',  // amulet.png 없음 → necklace 대체
};

// 1. 🏭 병기창 1~10티어 장비 (120종)
Object.entries(FORGE_TIER_NAMES).forEach(([tierStr, items]) => {
  const tier = parseInt(tierStr, 10);
  Object.entries(items).forEach(([key, name]) => {
    if (key === 'descPrefix') return;
    const equipKey = `forge_t${tier}_${key}`;
    ICON_MAP[equipKey] = {
      src: EQUIP_TYPE_SRC[key] || '/assets/icons/equipment/weapon_sword.png',
      fallback: FALLBACK_EQUIP_EMOJIS[key] || '⚔️',
      label: `[${tier}T 병기창] ${name}`,
    };
  });
});

// 보스 고유 세트 슬롯 → 아이콘 파일 매핑
const BOSS_SLOT_SRC: Record<string, string> = {
  wpn: '/assets/icons/equipment/weapon_sword.png',
  arm: '/assets/icons/equipment/armor_heavy.png',
  acc: '/assets/icons/equipment/relic.png',
};

// 2. 👑 1F~10F 보스 고유 세트 무구 (30종)
Object.values(BOSS_UNIQUE_DEFINITIONS).forEach(defList => {
  defList.forEach(item => {
    const slotKey = item.id.split('_').pop() || 'wpn';
    ICON_MAP[item.id] = {
      src: BOSS_SLOT_SRC[slotKey] || '/assets/icons/equipment/relic.png',
      fallback: item.icon || '👑',
      label: `[${item.floor}F 보스세트] ${item.baseName}`,
    };
  });
});

// 3. 👾 마물 마도서 (Monster Skill Books) 및 마물 고유 스킬 (74종+) 동적 등록
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
    src: `/assets/icons/books/${bookKey}.png`,
    fallback: sigFallback,
    label: `[마물 마도서] ${cleanMonName} - ${sigSkillName}`,
  };
  ICON_MAP[skillKey] = {
    src: `/assets/icons/books/${bookKey}.png`,
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
        src: `/assets/icons/skills/${indSkillKey}.png`,
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

export function getIconMeta(keyOrEmoji?: string): IconMeta | undefined {
  if (!keyOrEmoji) return undefined;
  if (ICON_MAP[keyOrEmoji]) {
    return ICON_MAP[keyOrEmoji];
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
