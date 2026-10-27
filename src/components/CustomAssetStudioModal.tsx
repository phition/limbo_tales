import React, { useState, useEffect, useRef } from 'react';
import { CustomAssetService, AssetConfigData, SpriteSheetConfig } from '../services/CustomAssetService';
import { ICON_MAP } from '../utils/iconMap';
import { GameIcon } from './GameIcon';
import { SoundManager, SoundEffectType, BgmTrack } from '../managers/SoundManager';
import { BattleVFXOverlay, VFXEvent, VFXType, detectSpriteSheetDimensions } from './BattleVFXOverlay';
import { CHARACTER_CLASSES } from '../data/classes';
import { MONSTERS } from '../data/monsters';
import { EPIC_STORY_NPCS, NPC_ID_TO_NAME, NpcDefinition } from '../data/npcs';
import { getVfxAssociatedSfx } from '../utils/skillComboUtils';

interface Props {
  open: boolean;
  onClose: () => void;
}

type StudioTab = 'overview' | 'icons' | 'vfx' | 'dungeon' | 'monsters' | 'mercenaries' | 'npc' | 'bgm' | 'sfx';
type IconCategory = 'all' | 'skills' | 'monster_skills' | 'resources' | 'status' | 'forge' | 'boss_equip' | 'honor_equip' | 'nemesis_equip' | 'rank' | 'buildings' | 'supplies' | 'events' | 'badges';

// 👑 직업 궁극기 및 마도서 미보유 고유 특수기 목록
export const ULTIMATE_SKILL_KEYS = new Set<string>([
  'squire_resolute', 'paladin_sanctuary', 'guard_unbreakable', 'valk_ultimate',
  'rogue_shadow_dance', 'assassin_execution', 'phantom_ultimate', 'duel_blade_waltz',
  'apprentice_mana_burst', 'elem_supernova', 'calamity_ultimate', 'acolyte_revive',
  'saint_ultimate', 'van_frenzy_strike', 'ber_berserk_crush', 'val_ultimate',
  'warlord_overwhelm', 'gun_aimed_snipe', 'tac_orbital_flare', 'sharp_abyssal_bullet',
  'gun_orbital_strike', 'scholar_arcane_overload', 'bishop_holy_assembly',
  'warpriest_holy_proclamation', 'fortress_ultimate', 'dancer_ultimate',
  'chrono_ultimate', 'crusader_ultimate', 'marshal_ultimate', 'sniper_ultimate',
  'bastion_avalon', 'void_dimension_slash', 'chrono_bigbang', 'seraph_grand_judgment',
  'warlord_blood_tactics', 'omega_orbital_annihilation'
]);

export type VfxCategoryFilter = 'all' | 'single' | 'aoe' | 'support' | 'craft' | 'boss' | 'monster' | 'status';

export interface VfxItemDef {
  type: VFXType;
  label: string;
  desc: string;
  icon: string;
  category: 'single' | 'aoe' | 'support' | 'craft' | 'boss' | 'monster' | 'status';
  categoryLabel: string;
  isAoe?: boolean;
}

const VFX_LIST: VfxItemDef[] = [
  // ── 1. ⚔️ 단일 공격 스킬 (Single Target) ──
  { type: 'slash', label: '기본 검격 (Slash)', desc: '쾌속의 푸른빛 단일 검격 궤적', icon: '⚔️', category: 'single', categoryLabel: '단일 공격', isAoe: false },
  { type: 'heavy_slash', label: '대검 강타 (Heavy Slash)', desc: '주황빛의 묵직한 수직 분쇄 단일 강타', icon: '🗡️', category: 'single', categoryLabel: '단일 공격', isAoe: false },
  { type: 'crit_slash', label: '치명타 교차참 (Crit Slash)', desc: '황금빛과 진홍빛의 교차 폭발 단일 슬래시', icon: '💥', category: 'single', categoryLabel: '단일 공격', isAoe: false },
  { type: 'bullet', label: '마도 탄환 (Bullet)', desc: '고속 관통 레이저 탄환 & 마법탄 단일 격발', icon: '🔫', category: 'single', categoryLabel: '단일 공격', isAoe: false },
  { type: 'claw', label: '맹수 할퀴기 (Claw)', desc: '날카로운 단일 발톱 할퀴기 열상', icon: '🐾', category: 'single', categoryLabel: '단일 공격', isAoe: false },
  { type: 'blood_bleed', label: '혈흔 절개 (Bleed Slash)', desc: '깊은 상처를 가르는 선혈 절개 참격', icon: '🩸', category: 'single', categoryLabel: '단일 공격', isAoe: false },
  { type: 'sonic', label: '음파 충격 (Sonic)', desc: '전방 고주파 파동 단일 타격', icon: '🔊', category: 'single', categoryLabel: '단일 공격', isAoe: false },
  { type: 'fire', label: '화염구 폭발 (Fire)', desc: '타겟 집중 단일 지옥불 폭발', icon: '🔥', category: 'single', categoryLabel: '단일 공격', isAoe: false },
  { type: 'ice', label: '빙결 파쇄 (Ice)', desc: '단일 절대영도 얼음 파편 파쇄', icon: '❄️', category: 'single', categoryLabel: '단일 공격', isAoe: false },
  { type: 'lightning', label: '낙뢰 전격 (Lightning)', desc: '하늘에서 내리꽂히는 번개 뇌광 단일 타격', icon: '⚡', category: 'single', categoryLabel: '단일 공격', isAoe: false },
  { type: 'dark_curse', label: '심연의 저주 (Dark Curse)', desc: '단일 암흑 촉수와 영혼 침식', icon: '🔮', category: 'single', categoryLabel: '단일 공격', isAoe: false },
  { type: 'divine_smite', label: '신성 심판 (Divine Smite)', desc: '황금 성광 빛기둥 & 십자 룬 단일 타격', icon: '✨', category: 'single', categoryLabel: '단일 공격', isAoe: false },

  // ── 2. 💥 광역 공격 스킬 (AOE / Multi-Target) ──
  { type: 'slash_aoe', label: '회전 폭풍참 (Slash AOE)', desc: '적 전체를 휩쓰는 광역 회전 참격 검풍', icon: '🌀', category: 'aoe', categoryLabel: '광역 공격', isAoe: true },
  { type: 'heavy_slash_aoe', label: '대지 분쇄타 (Heavy AOE)', desc: '지면을 강타하여 파편이 튀는 광역 분쇄 충격파', icon: '🌋', category: 'aoe', categoryLabel: '광역 공격', isAoe: true },
  { type: 'bullet_aoe', label: '탄막 난사 (Bullet Rain)', desc: '전장을 뒤덮는 전방위 무차별 탄막 세례', icon: '🎯', category: 'aoe', categoryLabel: '광역 공격', isAoe: true },
  { type: 'fire_aoe', label: '화염 폭풍 (Fire AOE)', desc: '전장을 불바다로 뒤덮는 광역 폭열 업화', icon: '🔥', category: 'aoe', categoryLabel: '광역 공격', isAoe: true },
  { type: 'ice_aoe', label: '절대영도 빙폭 (Ice AOE)', desc: '전장에 몰아치는 광역 혹한 얼음 폭풍', icon: '❄️', category: 'aoe', categoryLabel: '광역 공격', isAoe: true },
  { type: 'lightning_aoe', label: '연쇄 뇌전 (Lightning AOE)', desc: '적 전체로 번져나가는 연쇄 번개 방전 폭풍', icon: '⚡', category: 'aoe', categoryLabel: '광역 공격', isAoe: true },
  { type: 'dark_curse_aoe', label: '심연의 역병 (Curse AOE)', desc: '적 전체를 뒤덮는 암흑 안개와 영혼 잠식', icon: '🔮', category: 'aoe', categoryLabel: '광역 공격', isAoe: true },
  { type: 'divine_smite_aoe', label: '성전의 강림 (Holy AOE)', desc: '전장에 내리는 성스러운 빛의 소나기 심판', icon: '✨', category: 'aoe', categoryLabel: '광역 공격', isAoe: true },
  { type: 'claw_aoe', label: '야수 난무 (Claw AOE)', desc: '적 전체를 무차별 난타하는 맹수 광역 발톱', icon: '🐾', category: 'aoe', categoryLabel: '광역 공격', isAoe: true },
  { type: 'toxic_eruption_aoe', label: '독안개 분출 (Poison AOE)', desc: '전장을 가득 채우는 치명적 맹독 가스 분출', icon: '☠️', category: 'aoe', categoryLabel: '광역 공격', isAoe: true },
  { type: 'blood_bleed_aoe', label: '선혈 폭풍 (Blood Storm)', desc: '전장에 흩뿌려지는 광역 피바람 칼날', icon: '🩸', category: 'aoe', categoryLabel: '광역 공격', isAoe: true },
  { type: 'meteor_strike', label: '유성 낙하 (Meteor Strike)', desc: '불타는 거대 운석 낙하 & 광역 업화 충격파', icon: '☄️', category: 'aoe', categoryLabel: '광역 공격', isAoe: true },
  { type: 'blizzard_storm', label: '눈보라 폭풍 (Blizzard Storm)', desc: '절대영도 빙결 회오리 & 광역 결정 폭풍', icon: '❄️', category: 'aoe', categoryLabel: '광역 공격', isAoe: true },
  { type: 'phantom_slash', label: '환영 다단참 (Phantom Slash)', desc: '적진을 누비는 다방향 초고속 그림자 참격', icon: '🗡️', category: 'aoe', categoryLabel: '광역 공격', isAoe: true },
  { type: 'arcane_nova', label: '비전 폭발 (Arcane Nova)', desc: '초고압 비전 마법진 광역 팽창 폭발', icon: '🔮', category: 'aoe', categoryLabel: '광역 공격', isAoe: true },

  // ── 3. ✨ 지원 & 회복 (Support & Defense) ──
  { type: 'holy_heal', label: '신성 치유 (Holy Heal)', desc: '단일 아군 치유의 성스러운 오라와 온기', icon: '💚', category: 'support', categoryLabel: '지원/회복', isAoe: false },
  { type: 'holy_heal_aoe', label: '성스러운 축복 (Blessing AOE)', desc: '전 파티원 광역 치유 성광 파동', icon: '✨', category: 'support', categoryLabel: '지원/회복', isAoe: true },
  { type: 'shield', label: '수호 방벽 (Shield)', desc: '단단한 에테르 육각 수호 방벽 전개', icon: '🛡️', category: 'support', categoryLabel: '지원/회복', isAoe: false },

  // ── 4. 👑 보스 화면 장악 대규모 결전기 (Boss Ultimates) ──
  { type: 'boss_apocalypse', label: '종말의 대재앙 (Boss Apocalypse)', desc: '화면 전체를 뒤덮는 심연 옥좌 마법진 노바', icon: '👑', category: 'boss', categoryLabel: '보스 결전기', isAoe: true },
  { type: 'boss_abyss_vortex', label: '공허의 블랙홀 (Boss Vortex)', desc: '전체 화면을 왜곡시키는 암흑 중력 특이점', icon: '👁️', category: 'boss', categoryLabel: '보스 결전기', isAoe: true },
  { type: 'boss_dragon_breath', label: '드래곤 브레스 (Dragon Breath)', desc: '화면을 휩쓰는 원초의 화염 폭풍', icon: '🐲', category: 'boss', categoryLabel: '보스 결전기', isAoe: true },
  { type: 'boss_cataclysm', label: '천지 분쇄 (Boss Cataclysm)', desc: '대지를 가르는 지각 파괴 충격파', icon: '🌋', category: 'boss', categoryLabel: '보스 결전기', isAoe: true },

  // ── 5. 👾 몬스터 / 심연 마물 전용 (Monster Skills) ──
  { type: 'abyssal_claw', label: '심연 발톱 (Abyssal Claw)', desc: '선혈이 튀는 진홍 3연 발톱 열상', icon: '🐾', category: 'monster', categoryLabel: '마물 전용', isAoe: false },
  { type: 'toxic_eruption', label: '맹독 분출 (Toxic Eruption)', desc: '솟구치는 녹색 부식 독기 거품', icon: '☠️', category: 'monster', categoryLabel: '마물 전용', isAoe: false },
  { type: 'necrotic_drain', label: '사령 착취 (Necrotic Drain)', desc: '생명력을 강탈하는 암흑 촉수', icon: '🩸', category: 'monster', categoryLabel: '마물 전용', isAoe: false },
  { type: 'shadow_strike', label: '암흑 기습 (Shadow Strike)', desc: '공허의 암흑 폭풍과 기습', icon: '🌑', category: 'monster', categoryLabel: '마물 전용', isAoe: false },

  // ── 6. 🩸 상태이상 전용 디테일 시각 효과 (Status Effects) ──
  { type: 'status_bleed', label: '출혈 파티클 (Bleed)', desc: '떨어지는 핏방울과 선혈 파편', icon: '🩸', category: 'status', categoryLabel: '상태이상', isAoe: false },
  { type: 'status_poison', label: '중독 기포 (Poison)', desc: '터지는 맹독 기포와 해골 연기', icon: '🧪', category: 'status', categoryLabel: '상태이상', isAoe: false },
  { type: 'status_burn', label: '화상 불씨 (Burn)', desc: '소용돌이치는 지옥불 불씨', icon: '🔥', category: 'status', categoryLabel: '상태이상', isAoe: false },
  { type: 'status_freeze', label: '동결 결정 (Freeze)', desc: '산산조각 나는 서리 프랙탈', icon: '🧊', category: 'status', categoryLabel: '상태이상', isAoe: false },
  { type: 'status_stun', label: '기절 별무리 (Stun)', desc: '머리 위를 궤도 회전하는 항성', icon: '💫', category: 'status', categoryLabel: '상태이상', isAoe: false },

  // ── 7. ⚡ 차징 & 제작/단조 연출 (Charge & Crafting) ──
  { type: 'charge', label: '마력 차징 (Charge)', desc: '에테르 에너지 집중 및 기 모으기/주문 영창 차징 연출', icon: '⚡', category: 'craft', categoryLabel: '차징/제작', isAoe: false },
  { type: 'forge_spark', label: '단조 모루 타격 (Forge Spark)', desc: '모루 타격 시 사방으로 튀는 불꽃 파편과 충격파', icon: '🔨', category: 'craft', categoryLabel: '차징/제작', isAoe: false },
  { type: 'craft_magic', label: '마도 제작 연성 (Craft Magic)', desc: '마도서/스킬 비전 강화 시 피어오르는 에테르 마법진', icon: '✨', category: 'craft', categoryLabel: '차징/제작', isAoe: false },
];

const DUNGEON_FLOORS = [
  { floor: 1, name: '침묵의 회랑', defaultSrc: 'assets/dungeon_1.jpg', desc: '심연의 입구. 차가운 석재 회랑과 핏빛 이끼' },
  { floor: 2, name: '망령의 납골당', defaultSrc: 'assets/dungeon_2.jpg', desc: '원혼들이 떠도는 납골 묘지' },
  { floor: 3, name: '에테르 광맥', defaultSrc: 'assets/dungeon_3.jpg', desc: '푸른빛 마나 수정이 자라나는 지하 광산' },
  { floor: 4, name: '심연의 균열', defaultSrc: 'assets/dungeon_4.jpg', desc: '시공간이 일그러진 차원 틈새' },
  { floor: 5, name: '원초의 제단', defaultSrc: 'assets/dungeon_5.jpg', desc: '고대 공허 거신이 잠든 결전의 제단' },
  { floor: 6, name: '핏빛 성역', defaultSrc: 'assets/dungeon_6.jpg', desc: '진홍의 피가 흐르는 고딕 대성당' },
  { floor: 7, name: '망각의 묘지', defaultSrc: 'assets/dungeon_7.jpg', desc: '사신이 지배하는 영혼의 나락' },
  { floor: 8, name: '단죄의 성채', defaultSrc: 'assets/dungeon_8.jpg', desc: '타락한 기사단장의 흑철 요새' },
  { floor: 9, name: '환영의 미궁', defaultSrc: 'assets/dungeon_9.jpg', desc: '거울 파편이 떠다니는 만화경 미로' },
  { floor: 10, name: '심연의 심장부', defaultSrc: 'assets/dungeon_10.jpg', desc: '종말의 공허 군주가 자리한 옥좌' },
  { floor: 11, name: '무간도 (Avici)', defaultSrc: 'assets/dungeon_10.jpg', desc: '끝없는 심연의 무한 연옥' },
];

const BGM_TRACKS: { key: BgmTrack; label: string; desc: string; defaultPath: string }[] = [
  { key: 'citadel', label: '🏰 방주 성채 BGM', desc: '고딕 대성당 오르간 & 하프 펜타토닉 테마', defaultPath: 'assets/bgm/bgm_citadel.mp3' },
  { key: 'dungeon', label: '🌀 심연 던전 BGM', desc: '초저음 럼블 드론 & 어둠의 불협화 종소리', defaultPath: 'assets/bgm/bgm_dungeon.mp3' },
  { key: 'battle', label: '⚔️ 일반 전투 BGM', desc: '전쟁 북(War Drum) & 서브 베이스 심포닉 테마', defaultPath: 'assets/bgm/bgm_battle.mp3' },
  { key: 'boss', label: '👑 보스 결전 BGM', desc: '긴박한 하이템포 144 BPM 오케스트라 테마', defaultPath: 'assets/bgm/bgm_boss.mp3' },
];

const SFX_LIST: { type: SoundEffectType; label: string; group: string; icon: string; desc?: string }[] = [
  // ── 1. ⚔️ 물리 스킬 & 기본 타격 ──
  { type: 'slash', label: '검격 베기', group: '물리 스킬', icon: '⚔️', desc: '날카로운 도검 궤적 베기' },
  { type: 'crush', label: '둔기/해머 분쇄', group: '물리 스킬', icon: '🔨', desc: '묵직한 서브 베이스 파쇄 강타' },
  { type: 'pierce', label: '창/자창 관통', group: '물리 스킬', icon: '🗡️', desc: '고속 금속성 관통 및 찌르기' },
  { type: 'bow_shot', label: '활/석궁 사격', group: '물리 스킬', icon: '🏹', desc: '시위 튕김 및 화살 풍절음' },
  { type: 'gunshot', label: '마도총/포격 굉음', group: '물리 스킬', icon: '🔫', desc: '화약 폭발 충격 및 포구 럼블' },
  { type: 'heavy_hit', label: '묵직한 타격', group: '물리 스킬', icon: '💥', desc: '둔탁한 육중한 충격음' },
  { type: 'crit', label: '치명타 폭발', group: '물리 스킬', icon: '⚡', desc: '서브 드롭 쇼크웨이브 & 크리스탈 공명' },

  // ── 2. 🪄 마법 및 원소 스킬 ──
  { type: 'spell', label: '비전 마법 기본', group: '마법 스킬', icon: '🪄', desc: '비전 마법 에너지 방출' },
  { type: 'arcane_magic', label: '순수 비전/에테르 탄환', group: '마법 스킬', icon: '🔮', desc: '신비로운 크리스탈 아르페지오 챠임' },
  { type: 'holy_spell', label: '성스러운 빛/신성 심판', group: '마법 스킬', icon: '☀️', desc: '솔페지오 528Hz 화음 및 성광 챠임' },
  { type: 'dark_magic', label: '암흑/심연 저주', group: '마법 스킬', icon: '🌑', desc: '증4도 트라이톤 불협화음 저역 스위프' },
  { type: 'fire', label: '화염 폭발/작열', group: '마법 스킬', icon: '🔥', desc: '지옥불 폭열 및 화염 충격파' },
  { type: 'ice', label: '빙결 파쇄/서리', group: '마법 스킬', icon: '❄️', desc: '절대영도 얼음 파편 파쇄음' },
  { type: 'lightning', label: '낙뢰/전격 뇌광', group: '마법 스킬', icon: '⚡', desc: '고압 방전 폭음 및 뇌전 방출' },
  { type: 'wind_storm', label: '질풍/폭풍 회오리', group: '마법 스킬', icon: '🌪️', desc: '휘몰아치는 바람 노이즈 공명 스위프' },
  { type: 'poison', label: '맹독 분무/산성 부식', group: '마법 스킬', icon: '🧪', desc: 'FM 지글거리는 산성 기포 부식음' },

  // ── 3. 🛡️ 지원 및 상태이상 ──
  { type: 'shield_break', label: '방패/갑각 파쇄', group: '상태/특수', icon: '🛡️💥', desc: '방패 충격 및 유리/금속 파편 파쇄' },
  { type: 'heal', label: '성스러운 치유', group: '상태/특수', icon: '✨', desc: '생명력 회복 온기 파동' },
  { type: 'shield', label: '보호막/방벽 전개', group: '상태/특수', icon: '🛡️', desc: '에테르 육각 수호 방벽 전개' },
  { type: 'debuff', label: '심연의 약화 저주', group: '상태/특수', icon: '🔻', desc: '스탯 감소 및 약화 파동' },
  { type: 'stun', label: '기절/뇌진탕 충격', group: '상태/특수', icon: '💫', desc: '머리를 울리는 뇌진탕 충격' },
  { type: 'drain', label: '에테르/생명 착취', group: '상태/특수', icon: '🩸', desc: '생명력 흡혈 및 에테르 드레인' },
  { type: 'bleed', label: '출혈/열상 참격', group: '상태/특수', icon: '🩸', desc: '피가 튀는 예리한 열상' },
  { type: 'charge', label: '마력 차징/기 모으기', group: '상태/특수', icon: '⚡', desc: '주문 영창 및 기력 집중' },
  { type: 'fever_burst', label: 'FEVER 폭발/시너지', group: '상태/특수', icon: '🔥', desc: 'FEVER 게이지 완충 및 궁극기 전술 폭발' },
  { type: 'fever_badge', label: '모멘텀 뱃지 획득', group: '상태/특수', icon: '🎖️', desc: '전술 모멘텀 뱃지 적립 및 슬롯 장전' },

  // ── 4. 👾 피격 및 전투 흐름 ──
  { type: 'evade', label: '회피/빗나감 풍절음', group: '전투 흐름', icon: '💨', desc: '바람을 가르는 날렵한 회피 및 빗나감 스위프' },
  { type: 'monster_hit', label: '몬스터 피격', group: '전투 흐름', icon: '👾', desc: '마물 갑각 피격음' },
  { type: 'hero_hurt', label: '아군 피격', group: '전투 흐름', icon: '💔', desc: '아군 대원 피격 충격' },
  { type: 'monster_death', label: '몬스터 소멸/처치', group: '전투 흐름', icon: '💀', desc: '공허 붕괴 및 마물 소멸' },
  { type: 'victory', label: '전투 승리 팡파르', group: '전투 흐름', icon: '🏆', desc: '웅장한 금관 오케스트라 팡파르' },
  { type: 'defeat', label: '전투 패배 징', group: '전투 흐름', icon: '☠️', desc: '파멸의 징 및 비장한 패배음' },

  // ── 5. 🏰 영지 및 시스템 ──
  { type: 'click', label: 'UI 버튼 클릭', group: '영지/시스템', icon: '👆', desc: 'UI 탭 터치 피드백' },
  { type: 'equip', label: '장비 장착 체결', group: '영지/시스템', icon: '🛡️', desc: '금속 버클 체결 및 장착음' },
  { type: 'anvil', label: '대장간 모루 단조', group: '영지/시스템', icon: '⚒️', desc: '달궈진 철 모루 해머 타격' },
  { type: 'forge_success', label: '단조 대성공', group: '영지/시스템', icon: '🌟', desc: '강화/제작 대성공 팡파르' },
  { type: 'forge_fail', label: '단조 실패 파편', group: '영지/시스템', icon: '💥', desc: '강화 파손 및 실패 파편' },
  { type: 'craft', label: '마도/연금 제작', group: '영지/시스템', icon: '🧪', desc: '신비로운 아르페지오 연성' },
  { type: 'enhance', label: '장비/스킬 강화 공명', group: '영지/시스템', icon: '✨', desc: '마도석 결정 공명음' },
  { type: 'coin', label: '골드/보물 획득', group: '영지/시스템', icon: '💰', desc: '금화 짤랑거림' },
  { type: 'level_up', label: '레벨업 심포니', group: '영지/시스템', icon: '🆙', desc: '성장 하모니 화음' },
  { type: 'camp_fire', label: '모닥불 휴식', group: '영지/시스템', icon: '🏕️', desc: '타닥타닥 모닥불 앰비언트' },
  { type: 'torch_light', label: '횃불 점등', group: '영지/시스템', icon: '🔥', desc: '치익 횃불 불꽃 점화' },
  { type: 'loot_open', label: '상자 개방', group: '영지/시스템', icon: '📦', desc: '고대 보물함 삐걱 열림' },
  { type: 'quest_complete', label: '퀘스트 완료', group: '영지/시스템', icon: '📜', desc: '의뢰 완수 보상 팡파르' },
];

export const CustomAssetStudioModal: React.FC<Props> = ({ open, onClose }) => {
  const [activeTab, setActiveTab] = useState<StudioTab>('overview');
  const [iconCategory, setIconCategory] = useState<IconCategory>('all');
  const [vfxFilter, setVfxFilter] = useState<VfxCategoryFilter>('all');
  const [sfxGroupFilter, setSfxGroupFilter] = useState<string>('all');
  const [sfxSearchQuery, setSfxSearchQuery] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [monsterFilter, setMonsterFilter] = useState<'all' | 'boss' | 'normal'>('all');
  const [mercenaryFilter, setMercenaryFilter] = useState<'all' | '0' | '1' | '2'>('all');
  const [npcCategoryFilter, setNpcCategoryFilter] = useState<'all' | 'citadel' | 'scenario' | 'abyss'>('all');
  const [config, setConfig] = useState<AssetConfigData>(() => CustomAssetService.getInstance().getAllConfig());
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [pendingChangeCount, setPendingChangeCount] = useState(0);
  const [playingBgm, setPlayingBgm] = useState<BgmTrack | null>(null);
  const [importJsonText, setImportJsonText] = useState('');
  const [showJsonModal, setShowJsonModal] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [testVfxList, setTestVfxList] = useState<VFXEvent[]>([]);
  const [isServerSyncReady, setIsServerSyncReady] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [targetUploadKey, setTargetUploadKey] = useState<{
    type: 'icon' | 'vfx' | 'dungeon' | 'monster' | 'monster_video' | 'mercenary' | 'npc' | 'bgm' | 'sfx';
    key: string;
  } | null>(null);

  // 🌟 스프라이트 시트 규격 상세 편집 상태
  const [editingVfxConfig, setEditingVfxConfig] = useState<{
    type: VFXType;
    label: string;
    src: string;
    cols: number;
    rows: number;
    totalFrames: number;
    duration: number;
    naturalWidth: number;
    naturalHeight: number;
  } | null>(null);
  const [spritePreviewFrame, setSpritePreviewFrame] = useState(0);
  const [isPlayingPreview, setIsPlayingPreview] = useState(true);
  const [showGridGuide, setShowGridGuide] = useState(true);

  // 스프라이트 규격 조정 모달 열기
  const openSpriteConfigModal = (type: VFXType, label: string, src?: string) => {
    if (!src) {
      showToast(`⚠️ [${label}] 먼저 스프라이트 이미지를 업로드해주세요.`);
      return;
    }
    const img = new Image();
    img.src = src;
    const proceed = () => {
      const nw = img.naturalWidth || 256;
      const nh = img.naturalHeight || 256;
      const existing = config.vfxConfigs?.[type] || CustomAssetService.getInstance().getVfxConfig(type);
      if (existing) {
        setEditingVfxConfig({
          type,
          label,
          src,
          cols: existing.cols || 1,
          rows: existing.rows || 1,
          totalFrames: existing.totalFrames || (existing.cols * existing.rows),
          duration: existing.duration || 650,
          naturalWidth: nw,
          naturalHeight: nh,
        });
      } else {
        const detected = detectSpriteSheetDimensions(nw, nh);
        setEditingVfxConfig({
          type,
          label,
          src,
          cols: detected.cols,
          rows: detected.rows,
          totalFrames: detected.totalFrames,
          duration: 650,
          naturalWidth: nw,
          naturalHeight: nh,
        });
      }
      setSpritePreviewFrame(0);
      setIsPlayingPreview(true);
    };

    if (img.complete && img.naturalWidth > 0) {
      proceed();
    } else {
      img.onload = proceed;
      img.onerror = () => {
        showToast('⚠️ 이미지 규격을 읽어올 수 없습니다.');
      };
    }
  };

  // 모달 내부 실시간 애니메이션 타이머
  useEffect(() => {
    if (!editingVfxConfig || !isPlayingPreview) return;
    const tf = editingVfxConfig.totalFrames || (editingVfxConfig.cols * editingVfxConfig.rows);
    if (tf <= 1) return;
    const intervalMs = Math.max(20, Math.floor(editingVfxConfig.duration / tf));
    const timer = setInterval(() => {
      setSpritePreviewFrame(prev => (prev + 1) % tf);
    }, intervalMs);
    return () => clearInterval(timer);
  }, [editingVfxConfig, isPlayingPreview]);

  const handleSaveSpriteConfig = () => {
    if (!editingVfxConfig) return;
    const { type, label, cols, rows, totalFrames, duration } = editingVfxConfig;
    setConfig(prev => {
      const nextConfigs = { ...(prev.vfxConfigs || {}) };
      nextConfigs[type] = {
        cols,
        rows,
        totalFrames: totalFrames || (cols * rows),
        duration,
      };
      return { ...prev, vfxConfigs: nextConfigs };
    });
    setHasUnsavedChanges(true);
    setPendingChangeCount(c => c + 1);
    showToast(`✅ [${label}] 스프라이트 규격(${cols}×${rows}, ${totalFrames}F) 설정 완료! [프리셋 즉시 저장] 시 적용됩니다.`);
    setEditingVfxConfig(null);
  };

  const handleResetSpriteConfig = () => {
    if (!editingVfxConfig) return;
    const { type, label } = editingVfxConfig;
    setConfig(prev => {
      const nextConfigs = { ...(prev.vfxConfigs || {}) };
      delete nextConfigs[type];
      return { ...prev, vfxConfigs: nextConfigs };
    });
    setHasUnsavedChanges(true);
    setPendingChangeCount(c => c + 1);
    showToast(`🔄 [${label}] 스프라이트 규격이 자동 감지로 초기화되었습니다.`);
    setEditingVfxConfig(null);
  };

  type UploadType = 'icon' | 'vfx' | 'dungeon' | 'monster' | 'monster_video' | 'mercenary' | 'npc' | 'bgm' | 'sfx';

  const openFilePicker = (type: UploadType, key: string, accept: string) => {
    if (fileInputRef.current) {
      fileInputRef.current.accept = accept;
      setTargetUploadKey({ type, key });
      fileInputRef.current.click();
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  useEffect(() => {
    const service = CustomAssetService.getInstance();
    const handleChanged = () => {
      // 변경 대기 중인 로컬 수정사항이 없을 때만 외부 변경사항 동기화
      if (!hasUnsavedChanges) {
        setConfig(service.getAllConfig());
      }
    };
    service.on('changed', handleChanged);
    service.checkServerSyncStatus().then(ready => setIsServerSyncReady(ready));
    return () => service.off('changed', handleChanged);
  }, [hasUnsavedChanges]);

  // 모달이 새로 열릴 때 최신 서비스 설정으로 동기화 및 대기 상태 초기화
  useEffect(() => {
    if (open) {
      setConfig(CustomAssetService.getInstance().getAllConfig());
      setHasUnsavedChanges(false);
      setPendingChangeCount(0);
    }
  }, [open]);

  const triggerVfxTest = (type: VFXType) => {
    const isAoe = type.endsWith('_aoe') || type.includes('nova') || type.includes('storm') || type.includes('strike') || type.startsWith('boss_');
    const newVfx: VFXEvent = {
      id: 'test_' + Date.now(),
      type,
      x: 50,
      y: 50,
      damage: 1250,
      isCrit: type === 'crit_slash',
      duration: isAoe ? 950 : 750,
      scale: isAoe ? 1.45 : 1.1,
    };
    setTestVfxList(prev => [...prev, newVfx]);
    const soundKey = getVfxAssociatedSfx(type);
    SoundManager.getInstance().play(soundKey);
  };

  if (!open) return null;

  const service = CustomAssetService.getInstance();

  // 파일 업로드 핸들러 (즉시 적용하지 않고 스튜디오 드래프트에만 저장)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !targetUploadKey) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (!dataUrl) return;

      if (targetUploadKey.type === 'icon') {
        setConfig(prev => {
          const next = { ...prev.iconOverrides, [targetUploadKey.key]: dataUrl };
          if (targetUploadKey.key.startsWith('book_')) {
            next[targetUploadKey.key.replace(/^book_/, 'skill_')] = dataUrl;
          } else if (targetUploadKey.key.startsWith('skill_')) {
            next[targetUploadKey.key.replace(/^skill_/, 'book_')] = dataUrl;
          } else if (targetUploadKey.key === 'blacksmith') {
            next['forge'] = dataUrl;
          } else if (targetUploadKey.key === 'forge') {
            next['blacksmith'] = dataUrl;
          } else if (targetUploadKey.key === 'arenaGate') {
            next['arena'] = dataUrl;
          } else if (targetUploadKey.key === 'arena') {
            next['arenaGate'] = dataUrl;
          } else if (targetUploadKey.key === 'bonfire' && !next['citadel']) {
            next['citadel'] = dataUrl;
          }
          return { ...prev, iconOverrides: next };
        });
        setHasUnsavedChanges(true);
        setPendingChangeCount(c => c + 1);
        const isGrimoire = targetUploadKey.key.startsWith('book_') || targetUploadKey.key.startsWith('skill_');
        showToast(
          isGrimoire
            ? `📖 [${targetUploadKey.key}] 마도서/스킬 아이콘 대기 중! [프리셋 즉시 저장]을 누르면 적용됩니다.`
            : `🖼️ [${targetUploadKey.key}] 아이콘 대기 중! [프리셋 즉시 저장]을 누르면 적용됩니다.`
        );
      } else if (targetUploadKey.type === 'vfx') {
        setConfig(prev => ({
          ...prev,
          vfxOverrides: { ...prev.vfxOverrides, [targetUploadKey.key]: dataUrl }
        }));
        setHasUnsavedChanges(true);
        setPendingChangeCount(c => c + 1);
        showToast(`✨ [${targetUploadKey.key}] 스킬 이펙트 대기 중! [프리셋 즉시 저장]을 누르면 적용됩니다.`);
      } else if (targetUploadKey.type === 'dungeon') {
        setConfig(prev => ({
          ...prev,
          dungeonFloorOverrides: { ...prev.dungeonFloorOverrides, [`dungeon_${targetUploadKey.key}`]: dataUrl }
        }));
        setHasUnsavedChanges(true);
        setPendingChangeCount(c => c + 1);
        showToast(`🌀 [${targetUploadKey.key}F] 던전 배경 대기 중! [프리셋 즉시 저장]을 누르면 적용됩니다.`);
      } else if (targetUploadKey.type === 'monster') {
        setConfig(prev => ({
          ...prev,
          monsterOverrides: { ...prev.monsterOverrides, [targetUploadKey.key]: dataUrl }
        }));
        setHasUnsavedChanges(true);
        setPendingChangeCount(c => c + 1);
        showToast(`👾 [${targetUploadKey.key}] 몬스터 이미지 대기 중! [프리셋 즉시 저장]을 누르면 적용됩니다.`);
      } else if (targetUploadKey.type === 'monster_video') {
        setConfig(prev => ({
          ...prev,
          monsterVideoOverrides: { ...prev.monsterVideoOverrides, [targetUploadKey.key]: dataUrl }
        }));
        setHasUnsavedChanges(true);
        setPendingChangeCount(c => c + 1);
        showToast(`🎬 [${targetUploadKey.key}] 보스 컷신 영상 대기 중! [프리셋 즉시 저장]을 누르면 적용됩니다.`);
      } else if (targetUploadKey.type === 'mercenary') {
        setConfig(prev => ({
          ...prev,
          mercenaryOverrides: { ...prev.mercenaryOverrides, [targetUploadKey.key]: dataUrl }
        }));
        setHasUnsavedChanges(true);
        setPendingChangeCount(c => c + 1);
        showToast(`⚔️ [${targetUploadKey.key}] 용병 일러스트 대기 중! [프리셋 즉시 저장]을 누르면 적용됩니다.`);
      } else if (targetUploadKey.type === 'npc') {
        const mappedName = NPC_ID_TO_NAME[targetUploadKey.key] || targetUploadKey.key;
        setConfig(prev => {
          const next = { ...(prev.npcOverrides || {}) };
          Object.keys(next).forEach(k => {
            if (/^_+$/.test(k)) delete next[k];
          });
          next[targetUploadKey.key] = dataUrl;
          if (mappedName) next[mappedName] = dataUrl;
          return { ...prev, npcOverrides: next };
        });
        setHasUnsavedChanges(true);
        setPendingChangeCount(c => c + 1);
        showToast(`👑 [${mappedName}] 서사 NPC 포트레이트 대기 중! [프리셋 즉시 저장]을 누르면 적용됩니다.`);
      } else if (targetUploadKey.type === 'bgm') {
        setConfig(prev => ({
          ...prev,
          bgmOverrides: { ...prev.bgmOverrides, [targetUploadKey.key]: dataUrl }
        }));
        setHasUnsavedChanges(true);
        setPendingChangeCount(c => c + 1);
        showToast(`🎵 [${targetUploadKey.key}] BGM 오디오 대기 중! [프리셋 즉시 저장]을 누르면 적용됩니다.`);
      } else if (targetUploadKey.type === 'sfx') {
        setConfig(prev => ({
          ...prev,
          sfxOverrides: { ...prev.sfxOverrides, [targetUploadKey.key]: dataUrl }
        }));
        setHasUnsavedChanges(true);
        setPendingChangeCount(c => c + 1);
        showToast(`🔊 [${targetUploadKey.key}] SFX 효과음 대기 중! [프리셋 즉시 저장]을 누르면 적용됩니다.`);
      }
      setTargetUploadKey(null);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // 1. JSON 파일 다운로드
  const handleExportJson = () => {
    const jsonStr = JSON.stringify(config, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `limbo_custom_assets_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('📥 에셋 설정 JSON 파일이 다운로드되었습니다.');
  };

  // 1-2. JSON 클립보드 복사 (모바일/타 기기 간 즉시 공유)
  const handleCopyJsonToClipboard = async () => {
    try {
      const jsonStr = JSON.stringify(config, null, 2);
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(jsonStr);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = jsonStr;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      showToast('📋 에셋 JSON이 클립보드에 복사되었습니다! 타 기기에서 [붙여넣기] 하세요.');
    } catch {
      showToast('⚠️ 클립보드 복사에 실패했습니다. JSON 다운로드를 이용해주세요.');
    }
  };

  // 1-3. 🚀 프리셋 즉시 저장 및 게임 화면 일괄 적용 (custom_assets_preset.json 영구 반영)
  const handleSaveAndSync = async () => {
    showToast('⏳ 프리셋 저장 및 배포 파일시스템 반영 중...');
    const res = await service.saveAllConfig(config);
    setHasUnsavedChanges(false);
    setPendingChangeCount(0);
    if (res.success) {
      showToast('🚀 배포용 프리셋(custom_assets_preset.json) 및 게임 화면에 즉시 적용 완료!');
    } else {
      showToast(`🚀 프리셋이 저장되어 게임 화면에 적용되었습니다. (${res.message || 'IndexedDB 보관'})`);
    }
  };

  // 모달 닫기 핸들러 (저장 대기 변경사항 확인)
  const handleCloseModal = () => {
    if (hasUnsavedChanges) {
      const ok = window.confirm('저장하지 않은 변경사항이 있습니다. 적용하지 않고 스튜디오를 닫으시겠습니까?');
      if (!ok) return;
    }
    onClose();
  };

  // 2. JSON 불러오기 (드래프트 로드)
  const handleImportJson = () => {
    if (!importJsonText.trim()) return;
    try {
      const parsed = JSON.parse(importJsonText);
      setConfig(parsed);
      setHasUnsavedChanges(true);
      setPendingChangeCount(c => c + 1);
      showToast('📤 에셋 설정이 로드되었습니다. [프리셋 즉시 저장]을 누르면 게임에 적용됩니다.');
      setShowJsonModal(false);
      setImportJsonText('');
    } catch {
      alert('올바르지 않은 JSON 형식입니다.');
    }
  };

  // 3. 전체 초기화 (드래프트 초기화)
  const handleResetAll = () => {
    if (window.confirm('모든 커스텀 에셋 설정과 오버라이드를 초기화하시겠습니까?\n모든 아이콘이 기존 유니코드 이모지로 복원됩니다.\n[프리셋 즉시 저장]을 눌러야 게임 화면과 파일에 최종 적용됩니다.')) {
      const allEmojiOverrides: Record<string, string> = {};
      Object.keys(ICON_MAP).forEach(k => {
        allEmojiOverrides[k] = 'emoji';
      });

      setConfig({
        pureEmojiMode: false,
        syntheticAudioOnly: false,
        iconOverrides: allEmojiOverrides,
        bgmOverrides: {},
        sfxOverrides: {},
        vfxOverrides: {},
        dungeonFloorOverrides: {},
        monsterOverrides: {},
        monsterVideoOverrides: {},
        mercenaryOverrides: {},
        npcOverrides: {},
        version: (config.version || 1) + 1,
      });
      setHasUnsavedChanges(true);
      setPendingChangeCount(c => c + 1);
      showToast('🔄 모든 아이콘이 기본 이모지로 복원/초기화되었습니다. [프리셋 즉시 저장]을 누르면 적용됩니다.');
    }
  };

  // 아이콘 필터링 (마도서 아이콘 = 스킬 아이콘 일체화 통합)
  const filteredIconEntries = Object.entries(ICON_MAP).filter(([key, meta]) => {
    // 📖 마도서가 있는 skill_ 항목은 book_ 항목과 중복이므로 book_으로 일원화 통합
    if (key.startsWith('skill_')) {
      const correspondingBookKey = key.replace(/^skill_/, 'book_');
      if (ICON_MAP[correspondingBookKey] || key.startsWith('skill_m_') || key.startsWith('skill_boss_')) {
        return false; // book_ 항목으로 통합 렌더링 (마물 및 보스 스킬 포함)
      }
    }

    if (iconCategory === 'skills') {
      const isClassSkill = key.startsWith('squire_') || key.startsWith('paladin_') || key.startsWith('guard_') || key.startsWith('valk_') || key.startsWith('rogue_') || key.startsWith('assassin_') || key.startsWith('phantom_') || key.startsWith('duel_') || key.startsWith('apprentice_') || key.startsWith('elem_') || key.startsWith('calamity_') || key.startsWith('acolyte_') || key.startsWith('saint_') || key.startsWith('van_') || key.startsWith('ber_') || key.startsWith('val_') || key.startsWith('warlord_') || key.startsWith('gun_') || key.startsWith('tac_') || key.startsWith('sharp_') || key.startsWith('scholar_') || key.startsWith('bishop_') || key.startsWith('warpriest_') || key.startsWith('fortress_') || key.startsWith('dancer_') || key.startsWith('chrono_') || key.startsWith('crusader_') || key.startsWith('marshal_') || key.startsWith('sniper_') || key.startsWith('bastion_') || key.startsWith('void_') || key.startsWith('seraph_') || key.startsWith('omega_');
      const isGrimoireBookOrSkill = key.startsWith('book_') || key.startsWith('skill_');
      const isSpecialSkill = key === 'charge' || key === 'enhance_skill';
      if (!isClassSkill && !isGrimoireBookOrSkill && !isSpecialSkill) return false;
      // 🌟 보스 드랍 비전서(book_boss_) 및 마물 드랍 마도서(book_m_)는 'monster_skills' 전용 탭에서 일원화 관리
      if (key.startsWith('book_boss_') || key.startsWith('skill_boss_')) return false;
      if (key.startsWith('book_m_') || key.startsWith('skill_m_')) return false;
    }
    if (iconCategory === 'monster_skills') {
      // 🌟 던전에서 드랍되는 모든 마물/보스 마도서(일반 마물 book_m_ + 1~10F 보스 book_boss_) 일원화 표출
      const isDroppableMonsterOrBossBook = key.startsWith('book_m_') || key.startsWith('book_boss_');
      if (!isDroppableMonsterOrBossBook) return false;
    }
    if (iconCategory === 'resources' && 
      !key.startsWith('wood') && 
      !key.startsWith('stone') && 
      !key.startsWith('iron') && 
      !key.startsWith('food') && 
      !key.startsWith('gold') && 
      !key.startsWith('ether') && 
      !key.startsWith('herb') && 
      !key.startsWith('leather') && 
      !key.startsWith('silk') && 
      !key.startsWith('coal') && 
      !key.startsWith('bone') && 
      !key.startsWith('crystal') && 
      !key.startsWith('void_shard') && 
      !key.startsWith('dark_essence') && 
      !key.startsWith('prefix_stone') && 
      !key.startsWith('suffix_stone') && 
      !key.startsWith('pure_prefix_stone') && 
      !key.startsWith('pure_suffix_stone') && 
      !key.startsWith('pure_mana_stone') && 
      !key.startsWith('pure_') && 
      !key.startsWith('relic_floor_')
    ) return false;
    if (iconCategory === 'status' && !['bleed', 'poison', 'burn', 'freeze', 'stun', 'shield', 'debuff_atk', 'debuff_def', 'buff_atk', 'buff_def', 'regen', 'blind', 'riposte', 'immunity', 'aether_barrier', 'groggy', 'overcharge', 'warmth', 'stealth', 'vampiric', 'true_damage'].includes(key)) return false;

    if (iconCategory === 'forge' && !key.startsWith('forge_t') && !key.startsWith('rec_') && !['forge', 'anvil', 'enhance_equipment', 'craft_grimoire', 'enhance_skill', 'charge', 'prefix_stone', 'suffix_stone', 'pure_prefix_stone', 'pure_suffix_stone', 'pure_mana_stone'].includes(key)) return false;
    if (iconCategory === 'boss_equip' && !key.startsWith('boss_uniq_')) return false;
    if (iconCategory === 'honor_equip' && !key.startsWith('glory_') && !key.startsWith('equip_arena_') && key !== 'overlord_crown') return false;
    if (iconCategory === 'nemesis_equip' && !key.includes('nemesis')) return false;
    if (iconCategory === 'buildings' && !['bonfire', 'cabin', 'lumberCamp', 'quarry', 'tavern', 'blacksmith', 'forge', 'sanctuary', 'alchemy', 'arenaGate', 'arena', 'infirmary', 'market', 'storage', 'butchery', 'quests', 'codex', 'citadel', 'barracks', 'cemetery', 'explore'].includes(key)) return false;
    if (iconCategory === 'supplies' && !['torch', 'dungeon_food', 'food', 'pickaxe', 'bandage', 'holy_water', 'key', 'skeleton_key', 'rift_anchor', 'compass', 'golden_toad', 'blood_contract', 'dimensional_whistle', 'enhanced_torch', 'enhanced_food', 'enhanced_pickaxe', 'enhanced_bandage', 'enhanced_holy_water', 'enhanced_key', 'enhanced_rift_anchor'].includes(key)) return false;
    if (iconCategory === 'events' && !key.startsWith('event_') && !key.startsWith('trap_')) return false;
    if (iconCategory === 'badges' && !key.startsWith('badge_') && !key.startsWith('fever_') && !key.startsWith('rank_') && key !== 'battle_victory') return false;
    if (iconCategory === 'rank' && !key.startsWith('rank_')) return false;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match = key.toLowerCase().includes(q) || (meta.label && meta.label.toLowerCase().includes(q)) || meta.fallback.includes(q);
      if (!match) return false;
    }
    return true;
  });

  // 몬스터 목록 필터링
  const monsterList = Object.values(MONSTERS).filter(m => {
    if (monsterFilter === 'boss' && m.type !== 'boss') return false;
    if (monsterFilter === 'normal' && m.type === 'boss') return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return m.name.toLowerCase().includes(q) || m.id.toLowerCase().includes(q);
    }
    return true;
  });

  // 용병 목록 필터링
  const mercenaryList = Object.values(CHARACTER_CLASSES).filter(cls => {
    if (mercenaryFilter !== 'all' && String(cls.tier) !== mercenaryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return cls.name.toLowerCase().includes(q) || cls.id.toLowerCase().includes(q) || (cls.role && cls.role.toLowerCase().includes(q));
    }
    return true;
  });

  // 서사 NPC 목록 필터링
  const filteredNpcList = EPIC_STORY_NPCS.filter(npc => {
    if (npcCategoryFilter !== 'all' && npc.category !== npcCategoryFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        npc.name.toLowerCase().includes(q) ||
        npc.id.toLowerCase().includes(q) ||
        npc.role.toLowerCase().includes(q) ||
        (npc.description && npc.description.toLowerCase().includes(q)) ||
        (npc.questSource && npc.questSource.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
      {/* 백드롭 */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={handleCloseModal} />

      {/* 숨겨진 파일 인풋 */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept={
          targetUploadKey?.type === 'bgm' || targetUploadKey?.type === 'sfx'
            ? 'audio/*'
            : targetUploadKey?.type === 'monster_video'
            ? 'video/*,image/*'
            : 'image/*,video/*'
        }
        onChange={handleFileChange}
      />

      {/* 토스트 알림 */}
      {toastMessage && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-60 bg-[#c8aa6e] text-black font-bold text-xs px-4 py-2 rounded-full shadow-2xl animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* 모달 창 본체 */}
      <div className="relative w-full max-w-5xl max-h-[92vh] bg-[#0c101d] border border-[#1f2d48] rounded-2xl shadow-[0_10px_40px_rgba(0,0,0,0.85)] flex flex-col overflow-hidden text-[#cfd8e8] z-10">
        
        {/* 모달 헤더 */}
        <div className="px-4 py-3 bg-[#111728] border-b border-[#1f2d48] flex items-center justify-between shrink-0 gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl p-1.5 rounded-xl bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e44] shrink-0">
              🎨
            </span>
            <div className="min-w-0">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2 flex-wrap">
                <span>커스텀 에셋 & 미디어 스튜디오</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d44]">
                  Master Studio v2.5
                </span>
                {hasUnsavedChanges && (
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#ff980025] text-[#ffb74d] border border-[#ff980055] animate-pulse">
                    ⚠️ {pendingChangeCount}건 미저장 대기 중
                  </span>
                )}
              </h2>
              <p className="text-[11px] text-[#8b9bb4] truncate">
                아이콘, 스킬 VFX 스프라이트, 던전 배경, 몬스터/보스 미디어, 용병 일러스트, BGM 및 SFX 효과음을 커스텀합니다.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              className={`btn text-xs px-3.5 py-1.5 font-bold flex items-center gap-1.5 transition-all shadow-md ${
                hasUnsavedChanges
                  ? 'bg-gradient-to-r from-[#10b981] to-[#059669] text-white animate-pulse shadow-[#10b98155] hover:brightness-110'
                  : 'bg-[#1b263b] text-[#8b9bb4] hover:text-white border border-[#273650]'
              }`}
              onClick={handleSaveAndSync}
              title="현재 설정을 게임 화면에 일괄 적용하고 배포 파일(custom_assets_preset.json)에 영구 저장합니다."
            >
              <span>🚀</span>
              <span className="hidden sm:inline">프리셋 즉시 저장</span>
              <span className="sm:hidden">저장</span>
              {hasUnsavedChanges && (
                <span className="bg-white text-black text-[10px] px-1.5 py-0.2 rounded-full font-black">
                  {pendingChangeCount}
                </span>
              )}
            </button>
            <button
              className="btn btn-ghost text-xs px-2.5 py-1 hover:bg-[#c560601f] font-bold rounded-lg"
              style={{ borderColor: '#c56060', borderWidth: '1.5px', borderStyle: 'solid', color: '#c56060' }}
              onClick={handleCloseModal}
            >
              <span className="font-extrabold text-sm" style={{ color: '#c56060' }}>✕</span>
            </button>
          </div>
        </div>

        {/* 상단 탭 네비게이션 */}
        <div className="flex items-center gap-1 px-4 pt-2 pb-2 bg-[#0a0b10] border-b border-[#1a2336] shrink-0 overflow-x-auto">
          {[
            { key: 'overview', icon: '⚡', label: '모드 & 자동 동기화' },
            { key: 'icons', icon: '🖼️', label: `아이콘 (${Object.keys(config.iconOverrides).length > 0 ? `커스텀 ${Object.keys(config.iconOverrides).length}` : '기본'})` },
            { key: 'vfx', icon: '✨', label: `VFX 스프라이트 (${Object.keys(config.vfxOverrides || {}).length > 0 ? `커스텀 ${Object.keys(config.vfxOverrides || {}).length}` : '기본'})` },
            { key: 'dungeon', icon: '🌀', label: `던전 배경 (${Object.keys(config.dungeonFloorOverrides || {}).length > 0 ? `커스텀 ${Object.keys(config.dungeonFloorOverrides || {}).length}` : '기본'})` },
            { key: 'monsters', icon: '👾', label: `몬스터/보스 미디어 (${Object.keys(config.monsterOverrides || {}).length + Object.keys(config.monsterVideoOverrides || {}).length > 0 ? `커스텀` : '기본'})` },
            { key: 'mercenaries', icon: '⚔️', label: `용병 일러스트 (${Object.keys(config.mercenaryOverrides || {}).length > 0 ? `커스텀 ${Object.keys(config.mercenaryOverrides || {}).length}` : '기본'})` },
            { key: 'npc', icon: '👑', label: `서사 NPC (${Object.keys(config.npcOverrides || {}).length > 0 ? `커스텀 ${Object.keys(config.npcOverrides || {}).length}` : '기본'})` },
            { key: 'bgm', icon: '🎵', label: `BGM 음악` },
            { key: 'sfx', icon: '🔊', label: `SFX 효과음` },
          ].map(tab => (
            <button
              key={tab.key}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === tab.key
                  ? 'bg-[#c8aa6e] text-black shadow-md'
                  : 'bg-[#121929] text-[#8b9bb4] hover:text-white hover:bg-[#1b263d]'
              }`}
              onClick={() => setActiveTab(tab.key as StudioTab)}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* 탭 콘텐츠 영역 */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">

          {/* ════ 1. ⚡ 원클릭 모드 전환 & 백업 ════ */}
          {activeTab === 'overview' && (
            <div className="flex flex-col gap-4 animate-fade-in">
              {/* 원클릭 모드 스위처 카드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* 1) 아이콘 모드 전환 */}
                <div className="p-4 rounded-xl bg-[#11192e] border border-[#22324f] flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                        <span>🖼️</span>
                        <span>아이콘 렌더링 모드</span>
                      </div>
                      <p className="text-[11px] text-[#8b9bb4] mt-1 leading-relaxed">
                        고해상도 64x64 PNG 이미지 및 커스텀 에셋을 사용할지, 클래식한 유니코드 이모지만 사용할지 선택합니다.
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${config.pureEmojiMode ? 'bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44]' : 'bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d44]'}`}>
                      {config.pureEmojiMode ? '🔤 순수 이모지 모드' : '🖼️ PNG 에셋 모드'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-[#0b101c] p-2.5 rounded-lg border border-[#1b263b]">
                    <div className="flex items-center gap-3">
                      <div className="text-center">
                        <div className="text-[10px] text-[#8b9bb4]">현재 모습</div>
                        <div className="text-xl flex items-center justify-center h-8">
                          <GameIcon name="bleed" size={24} />
                        </div>
                      </div>
                      <div className="text-[11px] text-[#cfd8e8]">
                        {config.pureEmojiMode ? '🩸 유니코드 이모지로 렌더링 중' : '🎨 64x64 PNG / 커스텀 에셋으로 렌더링 중'}
                      </div>
                    </div>
                    <button
                      className={`btn text-xs px-3 py-1.5 font-bold ${config.pureEmojiMode ? 'btn-primary' : 'btn-ghost text-[#ffd54f] border border-[#ffd54f55]'}`}
                      onClick={() => {
                        setConfig(prev => ({ ...prev, pureEmojiMode: !prev.pureEmojiMode }));
                        setHasUnsavedChanges(true);
                        setPendingChangeCount(c => c + 1);
                        showToast(config.pureEmojiMode ? '🖼️ PNG 에셋 모드로 선택됨. [프리셋 즉시 저장] 시 적용됩니다.' : '🔤 순수 이모지 모드로 선택됨. [프리셋 즉시 저장] 시 적용됩니다.');
                      }}
                    >
                      {config.pureEmojiMode ? '🖼️ PNG 모드로 켜기' : '🔤 이모지 모드로 전환'}
                    </button>
                  </div>
                </div>

                {/* 2) 오디오 모드 전환 */}
                <div className="p-4 rounded-xl bg-[#11192e] border border-[#22324f] flex flex-col justify-between gap-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-sm text-white">
                        <span>🎵</span>
                        <span>오디오 엔진 모드</span>
                      </div>
                      <p className="text-[11px] text-[#8b9bb4] mt-1 leading-relaxed">
                        외부 MP3 오디오 스트리밍을 사용할지, 순수 Web Audio 신디사이저 합성음만 사용할지 선택합니다.
                      </p>
                    </div>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${config.syntheticAudioOnly ? 'bg-[#ce93d822] text-[#ce93d8] border border-[#ce93d844]' : 'bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e44]'}`}>
                      {config.syntheticAudioOnly ? '🎹 순수 신디사이저 모드' : '🎧 하이브리드 오디오'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between bg-[#0b101c] p-2.5 rounded-lg border border-[#1b263b]">
                    <div className="text-[11px] text-[#cfd8e8]">
                      {config.syntheticAudioOnly ? '🎹 무용량 절차적 합성음만 재생' : '🎧 고음질 MP3 및 효과음 스트리밍'}
                    </div>
                    <button
                      className={`btn text-xs px-3 py-1.5 font-bold ${config.syntheticAudioOnly ? 'btn-primary' : 'btn-ghost text-[#ce93d8] border border-[#ce93d855]'}`}
                      onClick={() => {
                        setConfig(prev => ({ ...prev, syntheticAudioOnly: !prev.syntheticAudioOnly }));
                        setHasUnsavedChanges(true);
                        setPendingChangeCount(c => c + 1);
                        showToast(config.syntheticAudioOnly ? '🎧 하이브리드 오디오로 선택됨. [프리셋 즉시 저장] 시 적용됩니다.' : '🎹 순수 신디사이저로 선택됨. [프리셋 즉시 저장] 시 적용됩니다.');
                      }}
                    >
                      {config.syntheticAudioOnly ? '🎧 하이브리드로 켜기' : '🎹 신디사이저로 전환'}
                    </button>
                  </div>
                </div>
              </div>

              {/* 📂 외부 에셋 폴더 자동 동기화 & 빌드 연동 안내 */}
              <div className="p-4 rounded-xl bg-[#111c30] border border-[#203a60] flex flex-col gap-3">
                <div className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>📂</span>
                  <span>외부 에셋 폴더 자동 복사 & 빌드 연동 시스템</span>
                </div>
                <div className="text-xs text-[#cfd8e8] leading-relaxed flex flex-col gap-2">
                  <p>
                    프로젝트 루트의 <code className="text-[#c8aa6e] font-mono bg-[#0e1117] px-1.5 py-0.5 rounded">custom_assets/</code> 폴더에 이미지, 음악, 영상 파일을 넣으면 <code className="text-[#38ef7d] font-mono bg-[#0e1117] px-1.5 py-0.5 rounded">npm run build</code> 또는 <code className="text-[#38ef7d] font-mono bg-[#0e1117] px-1.5 py-0.5 rounded">npm run dev</code> 실행 시 <strong>자동으로 게임 에셋 디렉토리로 복사되고 프리셋에 색인</strong>됩니다!
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-[11px] font-mono text-[#8b9bb4] pt-1">
                    <div className="bg-[#080d16] p-2 rounded border border-[#1b283d]">
                      <span className="text-[#c8aa6e] block font-bold">🖼️ custom_assets/icons/</span>
                      아이콘 파일 (예: wood.png, torch.png)
                    </div>
                    <div className="bg-[#080d16] p-2 rounded border border-[#1b283d]">
                      <span className="text-[#38ef7d] block font-bold">🌀 custom_assets/dungeons/</span>
                      던전 배경 (예: dungeon_1.jpg)
                    </div>
                    <div className="bg-[#080d16] p-2 rounded border border-[#1b283d]">
                      <span className="text-[#ffd54f] block font-bold">👾 custom_assets/monsters/</span>
                      몬스터 이미지/비디오 (예: monster_stalker.jpg)
                    </div>
                    <div className="bg-[#080d16] p-2 rounded border border-[#1b283d]">
                      <span className="text-[#ce93d8] block font-bold">⚔️ custom_assets/mercenaries/</span>
                      용병 일러스트 (예: hero_squire.png)
                    </div>
                    <div className="bg-[#080d16] p-2 rounded border border-[#1b283d]">
                      <span className="text-[#ff7043] block font-bold">✨ custom_assets/vfx/</span>
                      스킬 이펙트 스프라이트/GIF
                    </div>
                    <div className="bg-[#080d16] p-2 rounded border border-[#1b283d]">
                      <span className="text-[#42a5f5] block font-bold">🎵 custom_assets/bgm/ & sfx/</span>
                      MP3 오디오 파일
                    </div>
                  </div>
                </div>
              </div>

              {/* 프리셋 백업 및 내보내기 / 불러오기 */}
              <div className="p-4 rounded-xl bg-[#0f1525] border border-[#1e2a40] flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-sm text-white flex items-center gap-1.5">
                    <span>💾</span>
                    <span>에셋 독립 저장소 & 배포용 JSON 프리셋</span>
                  </div>
                  <button className="btn btn-danger text-xs px-2.5 py-1" onClick={handleResetAll}>
                    🔄 전체 기본값으로 초기화
                  </button>
                </div>
                <div className="text-[11px] text-[#38ef7d] bg-[#0c1a14] p-2.5 rounded-lg border border-[#38ef7d33] leading-relaxed">
                  🛡️ <strong>저장소 독립 격리 완료:</strong> 모든 커스텀 에셋은 게임 세이브(localStorage 5MB)와 완전히 분리된 <strong>IndexedDB</strong>에 안전하게 독립 보관되어 게임 진행 및 클라우드 동기화에 전혀 부담을 주지 않습니다.
                </div>
                <div className="text-[11px] text-[#c8aa6e] bg-[#0e1015] p-2.5 rounded-lg border border-[#c8aa6e33] leading-relaxed flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white">🚀 배포 프리셋 및 자동 동기화 시스템:</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-mono font-bold ${isServerSyncReady ? 'bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d44]' : 'bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44]'}`}>
                      {isServerSyncReady ? '🟢 배포 파일시스템 자동 동기화 활성' : '💾 기기 독립 보관 모드'}
                    </span>
                  </div>
                  <div>
                    • <strong>배포 시 포함:</strong> 에셋을 수정/업로드할 때마다 <code className="text-[#38ef7d] font-mono bg-[#111f30] px-1 rounded">public/assets/custom_assets_preset.json</code>에 즉시 기록되며, 업로드된 파일은 물리 에셋으로 저장되어 <code className="text-[#c8aa6e] font-mono bg-[#111f30] px-1 rounded">npm run build</code> 및 <code className="text-[#c8aa6e] font-mono bg-[#111f30] px-1 rounded">npx cap sync android</code> 시 100% 자동 포함됩니다.<br />
                    • <strong>즉시 동기화:</strong> 아래 <strong>[🚀 배포용 프리셋 즉시 저장]</strong>을 누르면 언제든 현재 설정을 파일시스템에 영구 반영합니다.
                  </div>
                </div>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <button className="btn text-xs px-4 py-2 bg-gradient-to-r from-[#10b981] to-[#059669] text-white hover:brightness-110 flex items-center gap-1.5 font-bold shadow-lg shadow-[#10b98133]" onClick={handleSaveAndSync}>
                    <span>🚀</span>
                    <span>배포용 프리셋 즉시 저장 (custom_assets_preset.json)</span>
                  </button>
                  <button className="btn btn-primary text-xs px-4 py-2 flex items-center gap-1.5" onClick={handleExportJson}>
                    <span>📥</span>
                    <span>JSON 파일 다운로드</span>
                  </button>
                  <button className="btn btn-ghost text-xs px-4 py-2 border border-[#c8aa6e88] text-[#c8aa6e] hover:bg-[#c8aa6e1f] flex items-center gap-1.5 font-bold" onClick={handleCopyJsonToClipboard}>
                    <span>📋</span>
                    <span>클립보드 복사 (타 기기 공유)</span>
                  </button>
                  <button className="btn btn-ghost text-xs px-4 py-2 border border-[#2d3e5e] text-white hover:bg-[#15171e] flex items-center gap-1.5" onClick={() => setShowJsonModal(true)}>
                    <span>📤</span>
                    <span>JSON 붙여넣기 / 가져오기</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ════ 2. 🖼️ 아이콘 커스텀 탭 ════ */}
          {activeTab === 'icons' && (
            <div className="flex flex-col gap-3 animate-fade-in">
              {/* 저장 대기 안내 배너 */}
              {hasUnsavedChanges && (
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#10b98118] border border-[#10b98155] text-xs text-[#a7f3d0] animate-fade-in">
                  <div className="flex items-center gap-2">
                    <span className="text-base">💡</span>
                    <span>
                      아이콘 변경사항 <strong>{pendingChangeCount}건</strong>이 대기 중입니다. 상단의 <strong>[🚀 프리셋 즉시 저장]</strong>을 눌러야 게임 화면에 적용됩니다.
                    </span>
                  </div>
                  <button
                    className="btn text-xs px-3.5 py-1 bg-gradient-to-r from-[#10b981] to-[#059669] text-white font-bold rounded-lg hover:brightness-110 shrink-0 shadow-md"
                    onClick={handleSaveAndSync}
                  >
                    🚀 프리셋 즉시 저장
                  </button>
                </div>
              )}

              {/* 상단 서브 필터 & 검색 */}
              <div className="flex flex-col sm:flex-row gap-2 items-center justify-between bg-[#0b101c] p-2.5 rounded-xl border border-[#1b263b]">
                <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
                  {[
                    { key: 'all', label: '전체' },
                    { key: 'skills', label: '📖 클래스 스킬 & 표준 비전서' },
                    { key: 'monster_skills', label: '👾 마물·보스 마도서 (드랍)' },
                    { key: 'resources', label: '자원 & 재료' },
                    { key: 'status', label: '상태이상' },

                    { key: 'forge', label: '⚔️ 병기창 & 제작/단조' },
                    { key: 'boss_equip', label: '👑 보스 세트 (1~10F)' },
                    { key: 'honor_equip', label: '🎖️ 명예 암시장 무구' },
                    { key: 'nemesis_equip', label: '🌌 네메시스 정벌 무구' },
                    { key: 'rank', label: '🏆 아레나 랭크 아이콘' },
                    { key: 'buildings', label: '영지 건물' },
                    { key: 'supplies', label: '보급품' },
                    { key: 'events', label: '🧭 던전 조우 이벤트' },
                    { key: 'badges', label: '🎖️ 전술 뱃지 & FEVER' },
                  ].map(cat => (
                    <button
                      key={cat.key}
                      className={`px-2.5 py-1 rounded text-xs font-bold shrink-0 transition-all ${
                        iconCategory === cat.key ? 'bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e55]' : 'text-[#8b9bb4] hover:text-white'
                      }`}
                      onClick={() => setIconCategory(cat.key as IconCategory)}
                    >
                      {cat.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="스킬/마도서/아이콘 검색 (이름/키/이모지)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#14161c] border border-[#273650] text-xs px-3 py-1.5 rounded-lg text-white placeholder-[#546e7a] w-full sm:w-56 focus:outline-none focus:border-[#c8aa6e]"
                />
              </div>

              {/* 아이콘 리스트 그리드 (마도서 아이콘 = 스킬 아이콘 일체화 & 궁극기 뱃지) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[55vh] overflow-y-auto pr-1">
                {filteredIconEntries.map(([key, meta]) => {
                  const overrideUrl = config.iconOverrides[key];
                  const savedOverride = service.getIconOverride(key);
                  const effectiveOverride = overrideUrl !== undefined ? overrideUrl : savedOverride;
                  const isImageLike = !!effectiveOverride && effectiveOverride !== 'emoji' && (
                    effectiveOverride.startsWith('/') ||
                    effectiveOverride.startsWith('assets/') ||
                    effectiveOverride.startsWith('http') ||
                    effectiveOverride.startsWith('data:') ||
                    effectiveOverride.includes('.png') ||
                    effectiveOverride.includes('.jpg') ||
                    effectiveOverride.includes('.svg') ||
                    effectiveOverride.includes('.webp')
                  );
                  const isCustomImage = isImageLike;
                  const isCustomEmoji = !!effectiveOverride && effectiveOverride !== 'emoji' && !isImageLike;
                  const isEmojiRestored = effectiveOverride === 'emoji';
                  const isUltimate = ULTIMATE_SKILL_KEYS.has(key) || (meta.label && (meta.label.includes('[궁극기]') || meta.label.includes('[초월기]')));
                  const isGrimoireUnified = key.startsWith('book_');
                  const displayLabel = isGrimoireUnified
                    ? (meta.label || key).replace(/^(비전서|고대 마도서|신성 성전|태초의 성전):\s*/, '')
                    : (meta.label || key);

                  return (
                    <div key={key} className={`p-2.5 rounded-xl bg-[#111828] border ${effectiveOverride ? 'border-[#c8aa6e66] bg-[#101e30]' : 'border-[#1f2d48]'} flex items-center justify-between gap-2 text-xs`}>
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-9 h-9 rounded-lg bg-[#070b14] border border-[#23314d] flex items-center justify-center shrink-0">
                          <GameIcon name={key} overrideUrl={effectiveOverride} size={22} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white flex items-center gap-1.5 flex-wrap">
                            <span className="truncate">{displayLabel}</span>
                            <span className="text-[10px] font-mono text-[#8b9bb4]">({key})</span>
                            {/* 👑 전투 승리 엠블럼 뱃지 */}
                            {key === 'battle_victory' && (
                              <span 
                                className="text-[9px] px-1.5 py-0.2 rounded font-black bg-[#ffd54f25] text-[#ffd54f] border border-[#ffd54f55] shrink-0"
                                title="전투 승리 모달 상단에 노출되는 승리 이모지/엠블럼"
                              >
                                전투 승리 엠블럼
                              </span>
                            )}
                            {/* ✨ 순수/인챈트 마도석 뱃지 */}
                            {(key === 'pure_prefix_stone' || key === 'pure_suffix_stone' || key === 'pure_mana_stone' || key === 'prefix_stone' || key === 'suffix_stone') && (
                              <span 
                                className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#ce93d822] text-[#ce93d8] border border-[#ce93d844] shrink-0" 
                                title="장비 인챈트 및 각성에 사용되는 핵심 마도석"
                              >
                                {key.startsWith('pure_') ? '순수 마도석' : '인챈트석'}
                              </span>
                            )}
                            {/* 👑 궁극기 / 마도서 없음 뱃지 */}
                            {isUltimate && (
                              <span 
                                className="text-[9px] px-1.5 py-0.2 rounded font-black bg-[#ef535025] text-[#ff7043] border border-[#ef535055] shrink-0 shadow-xs" 
                                title="직업 고유 궁극기 / 비전 마도서 미보유"
                              >
                                마도서 없음
                              </span>
                            )}
                            {/* 📖 마도서 일체형 뱃지 */}
                            {isGrimoireUnified && (
                              <span 
                                className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#c8aa6e18] text-[#c8aa6e] border border-[#c8aa6e44] shrink-0" 
                                title="마도서와 스킬 아이콘이 100% 동일하게 일체화된 에셋"
                              >
                                마도서 연동
                              </span>
                            )}
                            {isCustomImage && (
                              <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-[#00e67622] text-[#00e676] border border-[#00e67644] shrink-0">
                                커스텀 이미지
                              </span>
                            )}
                            {isCustomEmoji && (
                              <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44] shrink-0">
                                커스텀 이모지: {effectiveOverride}
                              </span>
                            )}
                            {isEmojiRestored && (
                              <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44] shrink-0">
                                이모지 복원됨
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#546e7a] truncate font-mono mt-0.5">
                            {isCustomEmoji ? `커스텀 유니코드 이모지 (${effectiveOverride})` : isEmojiRestored ? '기본 유니코드 이모지 (복원)' : (isCustomImage ? effectiveOverride.slice(0, 45) + '...' : `기본 이모지 (${meta.fallback})`)}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {/* ✏️ 이모지 직접 변경 버튼 */}
                        <button
                          className="btn btn-ghost text-[10px] px-2 py-1 border border-[#ffd54f55] text-[#ffd54f] hover:bg-[#ffd54f1f]"
                          title="유니코드 이모지 직접 입력/변경 (예: 👑, 🏆, 🎉, ⚔️, 🌟)"
                          onClick={() => {
                            const cur = isCustomEmoji ? effectiveOverride : meta.fallback;
                            const input = window.prompt(`[${displayLabel}]에 사용할 이모지를 입력하세요:`, cur);
                            if (input !== null) {
                              const trimmed = input.trim();
                              if (!trimmed) {
                                setConfig(prev => {
                                  const next = { ...prev.iconOverrides };
                                  delete next[key];
                                  if (key.startsWith('book_')) delete next[key.replace(/^book_/, 'skill_')];
                                  else if (key.startsWith('skill_')) delete next[key.replace(/^skill_/, 'book_')];
                                  return { ...prev, iconOverrides: next };
                                });
                                setHasUnsavedChanges(true);
                                setPendingChangeCount(c => c + 1);
                                showToast(`🔄 [${key}] 기본값으로 복원되었습니다.`);
                              } else {
                                setConfig(prev => {
                                  const next = { ...prev.iconOverrides, [key]: trimmed };
                                  if (key.startsWith('book_')) next[key.replace(/^book_/, 'skill_')] = trimmed;
                                  else if (key.startsWith('skill_')) next[key.replace(/^skill_/, 'book_')] = trimmed;
                                  if (key === 'blacksmith') next['forge'] = trimmed;
                                  else if (key === 'forge') next['blacksmith'] = trimmed;
                                  else if (key === 'arenaGate') next['arena'] = trimmed;
                                  else if (key === 'arena') next['arenaGate'] = trimmed;
                                  else if (key === 'bonfire') next['citadel'] = trimmed;
                                  else if (key === 'citadel') next['bonfire'] = trimmed;
                                  return { ...prev, iconOverrides: next };
                                });
                                setHasUnsavedChanges(true);
                                setPendingChangeCount(c => c + 1);
                                showToast(`✨ [${key}] 이모지가 "${trimmed}"(으)로 설정되었습니다. [프리셋 즉시 저장]을 누르면 영구 적용됩니다.`);
                              }
                            }
                          }}
                        >
                          ✏️ 이모지
                        </button>

                        {/* 📁 이미지 파일 업로드 버튼 */}
                        <button
                          className="btn btn-ghost text-[10px] px-2 py-1 border border-[#273859] text-[#c8aa6e] hover:bg-[#162238]"
                          title="로컬 이미지 파일(PNG/GIF/JPG/WebP/SVG) 업로드"
                          onClick={() => {
                            openFilePicker('icon', key, 'image/png,image/jpeg,image/webp,image/gif,image/svg+xml');
                          }}
                        >
                          📁 파일
                        </button>

                        {(isCustomImage || isCustomEmoji || (!effectiveOverride && !!meta.src)) && (
                          <button
                            className="btn btn-danger text-[10px] px-2 py-1"
                            title="기존 유니코드 이모지 아이콘으로 복원/초기화하기"
                            onClick={() => {
                              setConfig(prev => {
                                const next = { ...prev.iconOverrides };
                                next[key] = 'emoji';
                                if (key.startsWith('book_')) next[key.replace(/^book_/, 'skill_')] = 'emoji';
                                else if (key.startsWith('skill_')) next[key.replace(/^skill_/, 'book_')] = 'emoji';
                                if (key === 'blacksmith') next['forge'] = 'emoji';
                                else if (key === 'forge') next['blacksmith'] = 'emoji';
                                else if (key === 'arenaGate') next['arena'] = 'emoji';
                                else if (key === 'arena') next['arenaGate'] = 'emoji';
                                else if (key === 'bonfire') next['citadel'] = 'emoji';
                                else if (key === 'citadel') next['bonfire'] = 'emoji';
                                return { ...prev, iconOverrides: next };
                              });
                              setHasUnsavedChanges(true);
                              setPendingChangeCount(c => c + 1);
                              showToast(`🔄 [${key}] 기본 이모지로 복원되었습니다. [프리셋 즉시 저장]을 누르면 영구 적용됩니다.`);
                            }}
                          >
                            ✕ 초기화
                          </button>
                        )}
                        {isEmojiRestored && (
                          <button
                            className="btn btn-ghost text-[10px] px-2 py-1 border border-[#2b3952] text-[#8b9bb4] hover:text-white"
                            title="프리셋 커스텀 PNG 이미지로 다시 복구"
                            onClick={() => {
                              setConfig(prev => {
                                const next = { ...prev.iconOverrides };
                                delete next[key];
                                if (key.startsWith('book_')) delete next[key.replace(/^book_/, 'skill_')];
                                else if (key.startsWith('skill_')) delete next[key.replace(/^skill_/, 'book_')];
                                if (key === 'blacksmith') delete next['forge'];
                                else if (key === 'forge') delete next['blacksmith'];
                                else if (key === 'arenaGate') delete next['arena'];
                                else if (key === 'arena') delete next['arenaGate'];
                                else if (key === 'bonfire') delete next['citadel'];
                                else if (key === 'citadel') delete next['bonfire'];
                                return { ...prev, iconOverrides: next };
                              });
                              setHasUnsavedChanges(true);
                              setPendingChangeCount(c => c + 1);
                              showToast(`🔄 [${key}] 프리셋 커스텀 이미지로 복구되었습니다.`);
                            }}
                          >
                            PNG 복구
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ 3. ✨ 스킬 이펙트 (VFX) 커스텀 & 스프라이트 가이드 ════ */}
          {activeTab === 'vfx' && (
            <div className="flex flex-col gap-3 animate-fade-in">
              {/* 🌟 VFX 스트라이프/스프라이트 포맷 & 규격 공식 가이드 */}
              <div className="p-3.5 rounded-xl bg-[#111b2e] border border-[#1e3252] flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-[#c8aa6e] flex items-center gap-1.5">
                    <span>📋</span>
                    <span>VFX 스트라이프 & 애니메이션 스프라이트 포맷 규격</span>
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-[#38ef7d22] text-[#38ef7d] font-bold">
                    Alpha Channel Required
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 text-[11px] text-[#cfd8e8]">
                  <div className="bg-[#080d16] p-2 rounded border border-[#1f2d48]">
                    <strong className="text-[#ffd54f] block">1. 지원 파일 포맷</strong>
                    GIF, WebP(움짤), APNG, 단일 투명 PNG, 가로 스프라이트 시트
                  </div>
                  <div className="bg-[#080d16] p-2 rounded border border-[#1f2d48]">
                    <strong className="text-[#38ef7d] block">2. 권장 해상도</strong>
                    128×128 또는 256×256 px (1:1 정사각형, 투명 배경 필수)
                  </div>
                  <div className="bg-[#080d16] p-2 rounded border border-[#1f2d48]">
                    <strong className="text-[#c8aa6e] block">3. 스트라이프 시트 규격</strong>
                    가로 1줄 배열 (예: 64×64 4프레임 = 256×64 px)
                  </div>
                  <div className="bg-[#080d16] p-2 rounded border border-[#1f2d48]">
                    <strong className="text-[#ce93d8] block">4. 재생 속도 & 피벗</strong>
                    0.3~0.8초 1회 재생, 중심점(Center 50%, 50%)
                  </div>
                </div>
              </div>

              {/* 상단 안내 & 라이브 프리뷰 박스 */}
              <div className="relative h-28 bg-[#080c16] rounded-xl border border-[#1f2d48] flex items-center justify-center overflow-hidden">
                <div className="text-[11px] text-[#546e7a] select-none text-center">
                  ✨ [▶ 테스트] 버튼을 클릭하면 이 프리뷰 창과 실제 전투 화면에서 시각 효과가 즉시 렌더링됩니다.
                </div>
                <BattleVFXOverlay
                  vfxList={testVfxList}
                  overrideMap={config.vfxOverrides}
                  vfxConfigs={config.vfxConfigs}
                  onFinish={(id) => setTestVfxList(prev => prev.filter(v => v.id !== id))}
                />
              </div>

              {/* VFX 카테고리 세부 필터 (단일기 / 광역기 / 지원 / 보스 / 마물 / 상태이상) */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs select-none">
                {[
                  { key: 'all', label: '전체', icon: '🌟' },
                  { key: 'single', label: '단일기', icon: '⚔️' },
                  { key: 'aoe', label: '광역기', icon: '💥' },
                  { key: 'support', label: '지원/회복', icon: '✨' },
                  { key: 'craft', label: '차징/제작/단조', icon: '⚡' },
                  { key: 'boss', label: '보스 결전기', icon: '👑' },
                  { key: 'monster', label: '마물 전용', icon: '👾' },
                  { key: 'status', label: '상태이상', icon: '🩸' },
                ].map(cat => {
                  const count = cat.key === 'all'
                    ? VFX_LIST.length
                    : VFX_LIST.filter(v => v.category === cat.key).length;
                  const isActive = vfxFilter === cat.key;
                  return (
                    <button
                      key={cat.key}
                      onClick={() => setVfxFilter(cat.key as VfxCategoryFilter)}
                      className={`btn px-2.5 py-1 text-xs rounded-lg shrink-0 flex items-center gap-1 font-bold ${
                        isActive
                          ? 'btn-primary shadow-sm'
                          : 'btn-ghost border border-[#1f2d48] text-[#8b9bb4] hover:text-white'
                      }`}
                    >
                      <span>{cat.icon}</span>
                      <span>{cat.label}</span>
                      <span className={`text-[10px] ml-0.5 px-1.5 py-0.2 rounded-full font-mono ${isActive ? 'bg-black/30 text-white' : 'bg-[#0f172a] text-[#8b9bb4]'}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* VFX 목록 그리드 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[40vh] overflow-y-auto pr-1">
                {VFX_LIST
                  .filter(v => {
                    if (vfxFilter !== 'all' && v.category !== vfxFilter) return false;
                    if (searchQuery.trim()) {
                      const q = searchQuery.toLowerCase();
                      return (
                        v.label.toLowerCase().includes(q) ||
                        v.type.toLowerCase().includes(q) ||
                        v.desc.toLowerCase().includes(q)
                      );
                    }
                    return true;
                  })
                  .map(v => {
                    const overrideUrl = config.vfxOverrides?.[v.type];
                    const savedOverride = service.getVfxOverride(v.type);
                    const effectiveOverride = overrideUrl !== undefined ? overrideUrl : savedOverride;
                    const customCfg = config.vfxConfigs?.[v.type] || service.getVfxConfig(v.type);

                    return (
                      <div key={v.type} className={`p-2.5 rounded-xl bg-[#111828] border ${effectiveOverride ? 'border-[#c8aa6e66] bg-[#101e30]' : 'border-[#1f2d48]'} flex items-center justify-between gap-2 text-xs`}>
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-lg bg-[#070b14] border border-[#23314d] flex items-center justify-center shrink-0 overflow-hidden text-xl shadow-inner">
                            {effectiveOverride ? (
                              <img src={effectiveOverride} alt={v.label} className="w-full h-full object-contain" />
                            ) : (
                              v.icon
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="font-bold text-white flex items-center gap-1.5 truncate flex-wrap">
                              <span>{v.label}</span>
                              <span className="text-[10px] font-mono text-[#8b9bb4]">({v.type})</span>
                              {/* 스킬 유형 뱃지 (단일기 / 광역기 / 지원 등) */}
                              {v.category === 'aoe' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#ff3d0022] text-[#ff7043] border border-[#ff3d0044]">
                                  💥 광역기
                                </span>
                              )}
                              {v.category === 'single' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e44]">
                                  ⚔️ 단일기
                                </span>
                              )}
                              {v.category === 'support' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#00e67622] text-[#69f0ae] border border-[#00e67644]">
                                  ✨ 지원
                                </span>
                              )}
                              {v.category === 'boss' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#aa00ff22] text-[#ea80fc] border border-[#aa00ff44]">
                                  👑 보스
                                </span>
                              )}
                              {v.category === 'monster' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44]">
                                  👾 마물
                                </span>
                              )}
                              {v.category === 'status' && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#ff174422] text-[#ff5252] border border-[#ff174444]">
                                  🩸 상태
                                </span>
                              )}
                              {effectiveOverride && (
                                <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e44]">
                                  스프라이트
                                </span>
                              )}
                              {customCfg && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#ffd54f22] text-[#ffd54f] border border-[#ffd54f44]">
                                  {customCfg.cols}×{customCfg.rows}{customCfg.totalFrames ? ` (${customCfg.totalFrames}F)` : ''}
                                </span>
                              )}
                              <span className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold bg-[#7c4dff22] text-[#b388ff] border border-[#7c4dff44]" title={`전투/테스트 연계 사운드: ${getVfxAssociatedSfx(v.type)}`}>
                                🔊 {getVfxAssociatedSfx(v.type)}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#8b9bb4] truncate mt-0.5 font-mono">
                              {effectiveOverride ? effectiveOverride.slice(0, 45) + '...' : v.desc}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            className="btn btn-primary text-xs px-2.5 py-1 font-bold"
                            title="이펙트 재생 테스트"
                            onClick={() => triggerVfxTest(v.type)}
                          >
                            ▶ 테스트
                          </button>
                          <button
                            className="btn btn-ghost text-[10px] px-2 py-1 border border-[#273859] text-[#c8aa6e] hover:bg-[#162238]"
                            title="커스텀 스프라이트시트/GIF/WebP 이미지 업로드"
                            onClick={() => {
                              openFilePicker('vfx', v.type, 'image/png,image/gif,image/webp,image/apng');
                            }}
                          >
                            📁 스프라이트
                          </button>
                          <button
                            className={`btn text-[10px] px-2 py-1 border ${
                              customCfg
                                ? 'border-[#ffd54f66] bg-[#ffd54f1a] text-[#ffd54f] hover:bg-[#ffd54f33]'
                                : 'border-[#273859] text-[#ffd54f] hover:bg-[#162238]'
                            }`}
                            title="스프라이트 시트 가로/세로 규격, 프레임 수, 재생 속도 상세 조정"
                            onClick={() => {
                              openSpriteConfigModal(v.type, v.label, effectiveOverride);
                            }}
                          >
                            ⚙️ 규격
                          </button>
                          {effectiveOverride && (
                            <button
                              className="btn btn-danger text-[10px] px-2 py-1"
                              title="기본 절차적 이펙트로 복원"
                              onClick={() => {
                                setConfig(prev => {
                                  const next = { ...prev.vfxOverrides };
                                  delete next[v.type];
                                  return { ...prev, vfxOverrides: next };
                                });
                                setHasUnsavedChanges(true);
                                setPendingChangeCount(c => c + 1);
                                showToast(`🔄 [${v.type}] 이펙트 복원 대기 중. [프리셋 즉시 저장] 시 적용됩니다.`);
                              }}
                            >
                              ✕
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* ════ 4. 🌀 던전 층 배경 커스텀 탭 ════ */}
          {activeTab === 'dungeon' && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <div className="text-xs text-[#8b9bb4] bg-[#0b101c] p-3 rounded-xl border border-[#1b263b]">
                심연 1층부터 11층 무간도까지 각 층의 배경 일러스트, 움직이는 움짤(GIF), 또는 고화질 배경을 커스텀할 수 있습니다.
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                {DUNGEON_FLOORS.map(df => {
                  const overrideUrl = config.dungeonFloorOverrides?.[`dungeon_${df.floor}`] || config.dungeonFloorOverrides?.[String(df.floor)];
                  const currentSrc = overrideUrl || df.defaultSrc;
                  return (
                    <div key={df.floor} className={`p-3 rounded-xl bg-[#111828] border ${overrideUrl ? 'border-[#c8aa6e66] bg-[#101e30]' : 'border-[#1f2d48]'} flex flex-col gap-2`}>
                      <div className="relative h-28 rounded-lg overflow-hidden bg-black/40 border border-[#22324f]">
                        <img src={currentSrc} alt={df.name} className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 flex justify-between items-end">
                          <span className="font-bold text-xs text-white">{df.floor}F {df.name}</span>
                          {overrideUrl && <span className="text-[9px] px-1 py-0.2 rounded bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e44]">커스텀</span>}
                        </div>
                      </div>
                      <div className="text-[10px] text-[#8b9bb4] line-clamp-1">{df.desc}</div>
                      <div className="flex items-center gap-1 pt-1">
                        <button
                          className="btn btn-ghost text-xs px-2.5 py-1 border border-[#273859] text-[#c8aa6e] flex-1"
                          onClick={() => {
                            openFilePicker('dungeon', String(df.floor), 'image/png,image/jpeg,image/webp,image/gif');
                          }}
                        >
                          📁 이미지/GIF 교체
                        </button>
                        {overrideUrl && (
                          <button
                            className="btn btn-danger text-xs px-2 py-1"
                            onClick={() => {
                              setConfig(prev => {
                                const next = { ...prev.dungeonFloorOverrides };
                                delete next[`dungeon_${df.floor}`];
                                delete next[String(df.floor)];
                                return { ...prev, dungeonFloorOverrides: next };
                              });
                              setHasUnsavedChanges(true);
                              setPendingChangeCount(c => c + 1);
                              showToast(`🔄 [${df.floor}F] 배경 복원 대기 중. [프리셋 즉시 저장] 시 적용됩니다.`);
                            }}
                          >
                            ✕ 복원
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ 5. 👾 몬스터 & 보스 미디어 커스텀 탭 ════ */}
          {activeTab === 'monsters' && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <div className="flex flex-col sm:flex-row gap-2 items-center justify-between bg-[#0b101c] p-2.5 rounded-xl border border-[#1b263b]">
                <div className="flex items-center gap-1">
                  {[
                    { key: 'all', label: '전체 마물' },
                    { key: 'boss', label: '👑 10대 보스' },
                    { key: 'normal', label: '👾 일반/엘리트 마물' },
                  ].map(f => (
                    <button
                      key={f.key}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                        monsterFilter === f.key ? 'bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e55]' : 'text-[#8b9bb4] hover:text-white'
                      }`}
                      onClick={() => setMonsterFilter(f.key as any)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="몬스터 이름/ID 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#14161c] border border-[#273650] text-xs px-3 py-1.5 rounded-lg text-white placeholder-[#546e7a] w-full sm:w-48 focus:outline-none focus:border-[#c8aa6e]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                {monsterList.map(m => {
                  const overrideImg = config.monsterOverrides?.[m.id] || (m.promptKey ? config.monsterOverrides?.[m.promptKey] : undefined);
                  const overrideVideo = config.monsterVideoOverrides?.[m.id] || (m.promptKey ? config.monsterVideoOverrides?.[m.promptKey] : undefined);
                  const imgSrc = overrideImg || m.imagePath || `assets/${m.promptKey || m.id}.jpg`;
                  const isBoss = m.type === 'boss';

                  return (
                    <div key={m.id} className={`p-3 rounded-xl bg-[#111828] border ${overrideImg || overrideVideo ? 'border-[#c8aa6e66] bg-[#101e30]' : 'border-[#1f2d48]'} flex flex-col gap-2`}>
                      <div className="relative h-28 rounded-lg overflow-hidden bg-black/40 border border-[#22324f]">
                        {overrideImg ? (
                          <img src={overrideImg} alt={m.name} className="w-full h-full object-cover object-top" style={{ objectPosition: 'top' }} />
                        ) : m.imagePrompt ? (
                          <div className="w-full h-full p-2 bg-gradient-to-br from-[#0e1626] via-[#1a142c] to-[#0c101a] flex flex-col justify-between text-left">
                            <div className="flex items-center justify-between gap-1 z-10">
                              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[#ab47bc33] text-[#ce93d8] border border-[#ab47bc55] flex items-center gap-0.5">
                                <span>✨</span> AI 프롬프트 대기
                              </span>
                              <button
                                type="button"
                                className="text-[9px] px-1.5 py-0.5 rounded bg-[#c8aa6e22] text-[#c8aa6e] hover:bg-[#c8aa6e44] border border-[#c8aa6e44] font-bold transition-all flex items-center gap-0.5"
                                title="프롬프트 복사"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigator.clipboard.writeText(m.imagePrompt!);
                                  showToast(`📋 [${m.name}] 프롬프트가 복사되었습니다!`);
                                }}
                              >
                                <span>📋</span> 복사
                              </button>
                            </div>
                            <div className="text-[10px] text-[#90caf9] font-mono line-clamp-3 leading-tight opacity-90 italic px-0.5 select-all">
                              "{m.imagePrompt}"
                            </div>
                            <div className="text-[8px] text-[#546e7a] truncate">
                              💡 아래 [🖼️ 이미지/GIF] 버튼으로 커스텀 가능
                            </div>
                          </div>
                        ) : (
                          <img src={imgSrc} alt={m.name} className="w-full h-full object-cover object-top" style={{ objectPosition: 'top' }} />
                        )}
                        <div className="absolute top-1 right-1 flex gap-1 z-10">
                          {isBoss && <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#ff416c] text-white">BOSS</span>}
                          {overrideImg && <span className="text-[9px] px-1 py-0.2 rounded bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e44]">이미지 커스텀</span>}
                          {overrideVideo && <span className="text-[9px] px-1 py-0.2 rounded bg-[#38ef7d22] text-[#38ef7d] border border-[#38ef7d44]">영상 커스텀</span>}
                        </div>
                        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/80 to-transparent p-1.5 pointer-events-none z-10">
                          <span className="font-bold text-xs text-white truncate block">{m.name}</span>
                        </div>
                      </div>
                      <div className="text-[10px] text-[#8b9bb4] line-clamp-1">{m.description || `Lv.${m.level} ${m.id}`}</div>

                      <div className="flex items-center gap-1 pt-1 flex-wrap">
                        <button
                          className="btn btn-ghost text-[10px] px-2 py-1 border border-[#273859] text-[#c8aa6e] flex-1"
                          title="이미지/움짤(GIF) 교체"
                          onClick={() => {
                            openFilePicker('monster', m.id, 'image/png,image/jpeg,image/webp,image/gif');
                          }}
                        >
                          🖼️ 이미지/GIF
                        </button>
                        {m.imagePrompt && (
                          <button
                            type="button"
                            className="btn btn-ghost text-[10px] px-2 py-1 border border-[#ab47bc55] text-[#ce93d8]"
                            title="AI 이미지 생성 프롬프트 복사"
                            onClick={() => {
                              navigator.clipboard.writeText(m.imagePrompt!);
                              showToast(`📋 [${m.name}] 프롬프트가 복사되었습니다!`);
                            }}
                          >
                            📋 프롬프트
                          </button>
                        )}
                        {isBoss && (
                          <button
                            className="btn btn-ghost text-[10px] px-2 py-1 border border-[#38ef7d55] text-[#38ef7d] flex-1"
                            title="보스 컷신 영상(MP4/WebM) 교체"
                            onClick={() => {
                              openFilePicker('monster_video', m.id, 'video/mp4,video/webm');
                            }}
                          >
                            🎬 영상(MP4)
                          </button>
                        )}
                        {(overrideImg || overrideVideo) && (
                          <button
                            className="btn btn-danger text-[10px] px-1.5 py-1"
                            title="기본값 복원"
                            onClick={() => {
                              setConfig(prev => {
                                const nextM = { ...prev.monsterOverrides };
                                delete nextM[m.id];
                                const nextV = { ...prev.monsterVideoOverrides };
                                delete nextV[m.id];
                                return { ...prev, monsterOverrides: nextM, monsterVideoOverrides: nextV };
                              });
                              setHasUnsavedChanges(true);
                              setPendingChangeCount(c => c + 1);
                              showToast(`🔄 [${m.name}] 미디어 복원 대기 중. [프리셋 즉시 저장] 시 적용됩니다.`);
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ 6. ⚔️ 용병 일러스트 / 초상화 커스텀 탭 ════ */}
          {activeTab === 'mercenaries' && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <div className="flex flex-col sm:flex-row gap-2 items-center justify-between bg-[#0b101c] p-2.5 rounded-xl border border-[#1b263b]">
                <div className="flex items-center gap-1 flex-wrap">
                  {[
                    { key: 'all', label: '전체 클래스' },
                    { key: '0', label: '⚔️ 기본 직업' },
                    { key: '1', label: '🛡️ 1차 승격' },
                    { key: '2', label: '👑 2차 각성' },
                    { key: '3', label: '🌌 3차 초월' },
                  ].map(f => (
                    <button
                      key={f.key}
                      className={`px-2.5 py-1 rounded text-xs font-bold transition-all ${
                        mercenaryFilter === f.key ? 'bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e55]' : 'text-[#8b9bb4] hover:text-white'
                      }`}
                      onClick={() => setMercenaryFilter(f.key as any)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="용병 직업/이름 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#14161c] border border-[#273650] text-xs px-3 py-1.5 rounded-lg text-white placeholder-[#546e7a] w-full sm:w-48 focus:outline-none focus:border-[#c8aa6e]"
                />
              </div>

              <div className="text-xs text-[#8b9bb4] bg-[#0b101c] px-3 py-2 rounded-xl border border-[#1b263b] flex items-center justify-between">
                <span>💡 용병의 클래스별 초상화, 카드 일러스트 이미지를 커스텀할 수 있습니다. (권장: 256x256 정사각형 PNG/JPG/WebP/GIF)</span>
                <span className="text-[11px] text-[#c8aa6e] font-mono shrink-0 ml-2">검색 결과: {mercenaryList.length}명</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                {mercenaryList.map(cls => {
                  const maleOverride = config.mercenaryOverrides?.[`${cls.id}_male`];
                  const femaleOverride = config.mercenaryOverrides?.[`${cls.id}_female`];
                  const genericOverride = config.mercenaryOverrides?.[cls.id] || (cls.promptKey ? config.mercenaryOverrides?.[cls.promptKey] : undefined);
                  const hasCustom = !!(maleOverride || femaleOverride || genericOverride);

                  const maleImg = maleOverride || genericOverride || CustomAssetService.getGenderPortrait(cls.id, 'male');
                  const femaleImg = femaleOverride || genericOverride || CustomAssetService.getGenderPortrait(cls.id, 'female');
                  const icon = cls.skills?.[0]?.icon || '⚔️';

                  return (
                    <div key={cls.id} className={`p-3 rounded-xl bg-[#111828] border ${hasCustom ? 'border-[#c8aa6e66] bg-[#101e30]' : 'border-[#1f2d48]'} flex flex-col gap-2.5 text-xs`}>
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white flex items-center gap-1.5 truncate">
                            <span>{cls.name}</span>
                            {hasCustom && (
                              <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e44]">
                                커스텀
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#8b9bb4] truncate mt-0.5">
                            <span className={cls.tier === 0 ? 'text-[#8b9bb4]' : cls.tier === 1 ? 'text-[#c8aa6e]' : cls.tier === 2 ? 'text-[#ffd54f]' : 'text-[#ce93d8]'}>
                              {cls.tier === 0 ? '기본 직업' : cls.tier === 1 ? '1차 승격' : cls.tier === 2 ? '2차 각성' : '3차 초월'}
                            </span> • {cls.role}
                          </div>
                        </div>

                        {hasCustom && (
                          <button
                            className="btn btn-danger text-[9px] px-1.5 py-0.5 shrink-0"
                            title="커스텀 초기화"
                            onClick={() => {
                              setConfig(prev => {
                                const next = { ...prev.mercenaryOverrides };
                                delete next[cls.id];
                                delete next[`${cls.id}_male`];
                                delete next[`${cls.id}_female`];
                                if (cls.promptKey) delete next[cls.promptKey];
                                return { ...prev, mercenaryOverrides: next };
                              });
                              setHasUnsavedChanges(true);
                              setPendingChangeCount(c => c + 1);
                              showToast(`🔄 [${cls.name}] 포트레이트 복원 대기 중. [프리셋 즉시 저장] 시 적용됩니다.`);
                            }}
                          >
                            초기화
                          </button>
                        )}
                      </div>

                      {/* 남 / 여 포트레이트 듀얼 뷰 */}
                      <div className="grid grid-cols-2 gap-2 pt-1 border-t border-[#1b263b]">
                        {/* 남성 포트레이트 */}
                        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#0b101c] border border-[#1e293b]">
                          <div
                            className="w-10 h-10 rounded-lg bg-[#070b14] border border-[#3b82f655] flex items-center justify-center shrink-0 overflow-hidden shadow-inner cursor-pointer hover:border-[#3b82f6] relative group"
                            onClick={() => openFilePicker('mercenary', `${cls.id}_male`, 'image/png,image/jpeg,image/webp,image/gif')}
                            title="남성 포트레이트 교체"
                          >
                            {maleImg ? (
                              <img src={maleImg} alt={`${cls.name} 남성`} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">{icon}</span>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white font-bold transition-opacity">
                              변경
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-[#60a5fa] block">♂ 남성</span>
                            <button
                              className="text-[9px] text-[#8b9bb4] hover:text-[#ffd54f] underline truncate block mt-0.5"
                              onClick={() => openFilePicker('mercenary', `${cls.id}_male`, 'image/png,image/jpeg,image/webp,image/gif')}
                            >
                              📁 파일 선택
                            </button>
                          </div>
                        </div>

                        {/* 여성 포트레이트 */}
                        <div className="flex items-center gap-2 p-1.5 rounded-lg bg-[#0b101c] border border-[#1e293b]">
                          <div
                            className="w-10 h-10 rounded-lg bg-[#070b14] border border-[#ec489955] flex items-center justify-center shrink-0 overflow-hidden shadow-inner cursor-pointer hover:border-[#ec4899] relative group"
                            onClick={() => openFilePicker('mercenary', `${cls.id}_female`, 'image/png,image/jpeg,image/webp,image/gif')}
                            title="여성 포트레이트 교체"
                          >
                            {femaleImg ? (
                              <img src={femaleImg} alt={`${cls.name} 여성`} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">{icon}</span>
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[9px] text-white font-bold transition-opacity">
                              변경
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <span className="text-[10px] font-bold text-[#f472b6] block">♀ 여성</span>
                            <button
                              className="text-[9px] text-[#8b9bb4] hover:text-[#ffd54f] underline truncate block mt-0.5"
                              onClick={() => openFilePicker('mercenary', `${cls.id}_female`, 'image/png,image/jpeg,image/webp,image/gif')}
                            >
                              📁 파일 선택
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ 7. 👑 서사 NPC (에픽 스토리) 커스텀 탭 ════ */}
          {activeTab === 'npc' && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                <div className="flex items-center gap-1.5 flex-wrap">
                  {[
                    { key: 'all', label: `전체 (${EPIC_STORY_NPCS.length})` },
                    { key: 'citadel', label: '🏰 방주 성채' },
                    { key: 'scenario', label: '⚔️ 시나리오 인물' },
                    { key: 'abyss', label: '🌌 심연/초월' },
                  ].map(f => (
                    <button
                      key={f.key}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        npcCategoryFilter === f.key
                          ? 'bg-[#e040fb] text-black shadow-md'
                          : 'bg-[#14161c] text-[#8b9bb4] hover:text-white hover:bg-[#1f2b42]'
                      }`}
                      onClick={() => setNpcCategoryFilter(f.key as any)}
                    >
                      {f.label}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="NPC 이름/직책/서사 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-[#14161c] border border-[#273650] text-xs px-3 py-1.5 rounded-lg text-white placeholder-[#546e7a] w-full sm:w-48 focus:outline-none focus:border-[#e040fb]"
                />
              </div>

              <div className="text-xs text-[#8b9bb4] bg-[#0b101c] px-3 py-2 rounded-xl border border-[#1b263b] flex items-center justify-between">
                <span>💡 에픽 퀘스트 완료 시 대화 서사창에 등장하는 NPC 초상화/아바타를 커스텀할 수 있습니다. (권장: 256x256 정사각형 PNG/JPG/WebP/GIF 또는 이모지)</span>
                <span className="text-[11px] text-[#e040fb] font-mono shrink-0 ml-2">검색 결과: {filteredNpcList.length}명</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                {filteredNpcList.map(npc => {
                  const rawAvatar = config.npcOverrides?.[npc.id] || config.npcOverrides?.[npc.name];
                  const overrideAvatar = (rawAvatar && rawAvatar.includes('___')) 
                    ? (npc.id === 'npc_lloyd' ? 'assets/custom_uploaded/npcs/npc_lloyd.png' : npc.id === 'npc_chief_advisor' ? 'assets/custom_uploaded/npcs/npc_chief_advisor.png' : rawAvatar)
                    : rawAvatar;
                  const isImage = overrideAvatar && (
                    overrideAvatar.startsWith('data:') ||
                    overrideAvatar.startsWith('http://') ||
                    overrideAvatar.startsWith('https://') ||
                    overrideAvatar.startsWith('/') ||
                    overrideAvatar.startsWith('assets/') ||
                    overrideAvatar.includes('.png') ||
                    overrideAvatar.includes('.jpg') ||
                    overrideAvatar.includes('.jpeg') ||
                    overrideAvatar.includes('.webp') ||
                    overrideAvatar.includes('.gif')
                  );

                  return (
                    <div
                      key={npc.id}
                      className={`p-3 rounded-xl bg-[#111828] border ${
                        overrideAvatar ? 'border-[#e040fb66] bg-[#1a1226]' : 'border-[#1f2d48]'
                      } flex items-center justify-between gap-3 text-xs`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-xl bg-[#070b14] border border-[#23314d] flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
                          {isImage ? (
                            <img src={overrideAvatar} alt={npc.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-2xl">{overrideAvatar || npc.defaultAvatar}</span>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white flex items-center gap-1.5 truncate">
                            <span>{npc.name}</span>
                            {overrideAvatar && (
                              <span className="text-[9px] px-1 py-0.2 rounded font-bold bg-[#e040fb22] text-[#e040fb] border border-[#e040fb44]">
                                {isImage ? '이미지' : '이모지'}
                              </span>
                            )}
                          </div>
                          <div className="text-[10px] text-[#8b9bb4] truncate mt-0.5">
                            <span className="text-[#c8aa6e] font-mono font-bold">{npc.role}</span>
                            <span className="text-[#546e7a]"> • {npc.categoryLabel}</span>
                          </div>
                          <div className="text-[9px] text-[#718096] truncate mt-0.5" title={npc.description}>
                            {npc.description}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          className="btn btn-ghost text-[10px] px-2 py-1.5 border border-[#4a245e] text-[#e040fb] hover:bg-[#e040fb1a]"
                          title="NPC 포트레이트 이미지 파일 업로드"
                          onClick={() => {
                            openFilePicker('npc', npc.id, 'image/png,image/jpeg,image/webp,image/gif');
                          }}
                        >
                          📁 사진
                        </button>
                        <button
                          className="btn btn-ghost text-[10px] px-2 py-1.5 border border-[#ffd54f55] text-[#ffd54f] hover:bg-[#ffd54f1f]"
                          title="이모지 또는 외부 이미지 URL 직접 입력"
                          onClick={() => {
                            const cur = overrideAvatar || npc.defaultAvatar;
                            const input = window.prompt(
                              `[${npc.name}] 포트레이트로 사용할 이모지 또는 이미지 URL을 입력하세요:\n(예: 👑, 🛡️, https://.../portrait.png)`,
                              cur
                            );
                            if (input !== null) {
                              const trimmed = input.trim();
                              if (!trimmed) {
                                setConfig(prev => {
                                  const next = { ...(prev.npcOverrides || {}) };
                                  delete next[npc.id];
                                  delete next[npc.name];
                                  return { ...prev, npcOverrides: next };
                                });
                                setHasUnsavedChanges(true);
                                setPendingChangeCount(c => c + 1);
                                showToast(`🔄 [${npc.name}] 기본 아바타로 복원되었습니다.`);
                              } else {
                                setConfig(prev => ({
                                  ...prev,
                                  npcOverrides: {
                                    ...(prev.npcOverrides || {}),
                                    [npc.id]: trimmed,
                                    [npc.name]: trimmed,
                                  }
                                }));
                                setHasUnsavedChanges(true);
                                setPendingChangeCount(c => c + 1);
                                showToast(`👑 [${npc.name}] 커스텀 포트레이트 대기 중! [프리셋 즉시 저장]을 누르면 적용됩니다.`);
                              }
                            }
                          }}
                        >
                          ✏️ 입력
                        </button>
                        {overrideAvatar && (
                          <button
                            className="btn btn-danger text-[10px] px-2 py-1.5"
                            title="기본값으로 복원"
                            onClick={() => {
                              setConfig(prev => {
                                const next = { ...(prev.npcOverrides || {}) };
                                delete next[npc.id];
                                delete next[npc.name];
                                return { ...prev, npcOverrides: next };
                              });
                              setHasUnsavedChanges(true);
                              setPendingChangeCount(c => c + 1);
                              showToast(`🔄 [${npc.name}] 포트레이트 복원 대기 중. [프리셋 즉시 저장] 시 적용됩니다.`);
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ 8. 🎵 BGM 배경음악 커스텀 탭 ════ */}
          {activeTab === 'bgm' && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <div className="text-xs text-[#8b9bb4] bg-[#0b101c] p-3 rounded-xl border border-[#1b263b] leading-relaxed">
                각 상황별 배경음악을 커스텀 MP3 파일이나 스트리밍 URL로 교체할 수 있습니다.
              </div>

              <div className="flex flex-col gap-2.5">
                {BGM_TRACKS.map(t => {
                  const overrideUrl = config.bgmOverrides[t.key];
                  const isPlayingThis = playingBgm === t.key;
                  return (
                    <div key={t.key} className={`p-3.5 rounded-xl bg-[#111828] border ${overrideUrl ? 'border-[#c8aa6e66] bg-[#101e30]' : 'border-[#1f2d48]'} flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs`}>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          <span>{t.label}</span>
                          {overrideUrl && (
                            <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-[#c8aa6e22] text-[#c8aa6e] border border-[#c8aa6e44]">
                              커스텀 URL 적용 중
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8b9bb4] mt-0.5">{t.desc}</div>
                        <div className="text-[10px] font-mono text-[#546e7a] truncate mt-1">
                          경로: {overrideUrl || t.defaultPath}
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          className={`btn text-xs px-3 py-1.5 font-bold flex items-center gap-1 ${isPlayingThis ? 'btn-danger' : 'btn-primary'}`}
                          onClick={() => {
                            const sm = SoundManager.getInstance();
                            if (isPlayingThis) {
                              sm.stopBgm();
                              setPlayingBgm(null);
                            } else {
                              sm.playBgm(t.key);
                              setPlayingBgm(t.key);
                            }
                          }}
                        >
                          <span>{isPlayingThis ? '⏹ 정지' : '▶ 테스트'}</span>
                        </button>
                        <button
                          className="btn btn-ghost text-xs px-2.5 py-1.5 border border-[#273859] text-[#c8aa6e]"
                          onClick={() => {
                            openFilePicker('bgm', t.key, 'audio/mpeg,audio/ogg,audio/wav,audio/mp3');
                          }}
                        >
                          📁 MP3 로드
                        </button>
                        {overrideUrl && (
                          <button
                            className="btn btn-danger text-xs px-2.5 py-1.5"
                            onClick={() => {
                              setConfig(prev => {
                                const next = { ...prev.bgmOverrides };
                                delete next[t.key];
                                return { ...prev, bgmOverrides: next };
                              });
                              setHasUnsavedChanges(true);
                              setPendingChangeCount(c => c + 1);
                              showToast(`🔄 [${t.key}] BGM 복원 대기 중. [프리셋 즉시 저장] 시 적용됩니다.`);
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ════ 8. 🔊 SFX 효과음 커스텀 탭 ════ */}
          {activeTab === 'sfx' && (
            <div className="flex flex-col gap-3 animate-fade-in">
              <div className="text-xs text-[#8b9bb4] bg-[#0b101c] p-3 rounded-xl border border-[#1b263b] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <span>⚔️ 물리 스킬(검격, 분쇄, 관통, 사격 등), 🪄 마법 스킬(비전, 성광, 암흑, 원소 등) 및 상태이상 등 총 38종의 디테일 SFX를 청음하고 커스텀할 수 있습니다.</span>
                <span className="text-[11px] text-[#c8aa6e] shrink-0 font-mono">
                  {SFX_LIST.filter(s => {
                    const matchGroup = sfxGroupFilter === 'all' || s.group === sfxGroupFilter || (sfxGroupFilter === '영지/시스템' && s.group.startsWith('영지'));
                    const q = sfxSearchQuery.trim().toLowerCase();
                    const matchQuery = !q || s.label.toLowerCase().includes(q) || s.type.toLowerCase().includes(q) || (s.desc && s.desc.toLowerCase().includes(q));
                    return matchGroup && matchQuery;
                  }).length} / {SFX_LIST.length}종
                </span>
              </div>

              {/* 🏷️ 필터 탭 & 검색바 */}
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full text-xs">
                  {[
                    { id: 'all', label: '전체 (All)', icon: '🎧' },
                    { id: '물리 스킬', label: '물리 스킬', icon: '⚔️' },
                    { id: '마법 스킬', label: '마법 스킬', icon: '🪄' },
                    { id: '상태/특수', label: '상태/특수', icon: '🛡️' },
                    { id: '전투 흐름', label: '전투 흐름', icon: '👾' },
                    { id: '영지/시스템', label: '영지/시스템', icon: '🏰' },
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => setSfxGroupFilter(tab.id)}
                      className={`btn px-2.5 py-1 text-xs shrink-0 flex items-center gap-1 ${
                        sfxGroupFilter === tab.id
                          ? 'btn-primary'
                          : 'btn-ghost text-[#8b9bb4] hover:text-white'
                      }`}
                    >
                      <span>{tab.icon}</span>
                      <span>{tab.label}</span>
                    </button>
                  ))}
                </div>

                <div className="relative shrink-0">
                  <input
                    type="text"
                    value={sfxSearchQuery}
                    onChange={e => setSfxSearchQuery(e.target.value)}
                    placeholder="SFX 검색 (이름/키/설명)..."
                    className="bg-[#0f172a] border border-[#1f2d48] rounded-lg px-2.5 py-1 text-xs text-white placeholder-[#546e7a] focus:outline-none focus:border-[#c8aa6e] w-48"
                  />
                  {sfxSearchQuery && (
                    <button
                      onClick={() => setSfxSearchQuery('')}
                      className="absolute right-2 top-1/2 -translate-y-1/2 text-[#546e7a] hover:text-white text-xs"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 max-h-[55vh] overflow-y-auto pr-1">
                {SFX_LIST.filter(s => {
                  const matchGroup = sfxGroupFilter === 'all' || s.group === sfxGroupFilter || (sfxGroupFilter === '영지/시스템' && s.group.startsWith('영지'));
                  const q = sfxSearchQuery.trim().toLowerCase();
                  const matchQuery = !q || s.label.toLowerCase().includes(q) || s.type.toLowerCase().includes(q) || (s.desc && s.desc.toLowerCase().includes(q));
                  return matchGroup && matchQuery;
                }).map(s => {
                  const overrideUrl = config.sfxOverrides[s.type];
                  return (
                    <div key={s.type} className={`p-2.5 rounded-xl bg-[#111828] border ${overrideUrl ? 'border-[#c8aa6e66] bg-[#101e30]' : 'border-[#1f2d48]'} flex items-center justify-between gap-1.5 text-xs`}>
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <span className="text-base shrink-0">{s.icon}</span>
                        <div className="min-w-0 flex-1">
                          <div className="font-bold text-white truncate flex items-center gap-1">
                            <span>{s.label}</span>
                            {overrideUrl && <span className="text-[9px] text-[#c8aa6e]">★</span>}
                          </div>
                          <div className="text-[9px] text-[#546e7a] font-mono truncate">{s.type} · {s.desc || s.group}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          className="btn btn-ghost text-xs px-2 py-1 bg-[#141d30] text-[#c8aa6e] hover:bg-[#1e2c48]"
                          title="효과음 재생 테스트"
                          onClick={() => {
                            SoundManager.getInstance().play(s.type);
                          }}
                        >
                          ▶
                        </button>
                        <button
                          className="btn btn-ghost text-[10px] px-1.5 py-1 text-[#8b9bb4] hover:text-white"
                          title="로컬 오디오 파일로 교체"
                          onClick={() => {
                            openFilePicker('sfx', s.type, 'audio/mpeg,audio/ogg,audio/wav,audio/mp3');
                          }}
                        >
                          📁
                        </button>
                        {overrideUrl && (
                          <button
                            className="btn btn-danger text-[10px] px-1.5 py-1"
                            title="기본값 복원"
                            onClick={() => {
                              setConfig(prev => {
                                const next = { ...prev.sfxOverrides };
                                delete next[s.type];
                                return { ...prev, sfxOverrides: next };
                              });
                              setHasUnsavedChanges(true);
                              setPendingChangeCount(c => c + 1);
                              showToast(`🔄 [${s.type}] SFX 복원 대기 중. [프리셋 즉시 저장] 시 적용됩니다.`);
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>

        {/* ── ⚙️ 스프라이트 시트 규격 조정 & 슬라이스 인스펙터 모달 ── */}
        {editingVfxConfig && (() => {
          const totalCells = editingVfxConfig.cols * editingVfxConfig.rows;
          const effectiveTotal = Math.min(totalCells, Math.max(1, editingVfxConfig.totalFrames || totalCells));
          const curCol = spritePreviewFrame % editingVfxConfig.cols;
          const curRow = Math.floor(spritePreviewFrame / editingVfxConfig.cols);
          const previewPosX = editingVfxConfig.cols > 1 ? (curCol / (editingVfxConfig.cols - 1)) * 100 : 0;
          const previewPosY = editingVfxConfig.rows > 1 ? (curRow / (editingVfxConfig.rows - 1)) * 100 : 0;
          const cellW = Math.round(editingVfxConfig.naturalWidth / editingVfxConfig.cols);
          const cellH = Math.round(editingVfxConfig.naturalHeight / editingVfxConfig.rows);

          return (
            <div className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-3 backdrop-blur-sm animate-fade-in">
              <div className="bg-[#0e1626] border border-[#233858] rounded-2xl p-4 flex flex-col gap-3.5 max-w-2xl mx-auto w-full shadow-2xl max-h-[92vh] overflow-y-auto">
                {/* 헤더 */}
                <div className="flex items-center justify-between border-b border-[#1f2d48] pb-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">⚙️</span>
                    <div>
                      <div className="font-bold text-sm text-white flex items-center gap-2">
                        <span>[{editingVfxConfig.label}] 스프라이트 규격 조정</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#c8aa6e22] text-[#c8aa6e] font-bold">
                          {editingVfxConfig.type}
                        </span>
                      </div>
                      <div className="text-[10px] text-[#8b9bb4] font-mono mt-0.5">
                        원본 해상도: {editingVfxConfig.naturalWidth}×{editingVfxConfig.naturalHeight}px · 셀 크기: {cellW}×{cellH}px ({editingVfxConfig.cols}열 × {editingVfxConfig.rows}행)
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn btn-ghost text-xs px-2.5 py-1 text-[#8b9bb4] hover:text-white"
                    onClick={() => setEditingVfxConfig(null)}
                  >
                    ✕
                  </button>
                </div>

                {/* 프리뷰 영역 (2분할: 슬라이스 그리드 가이드 + 단일 프레임 플레이어) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 bg-[#080d16] p-3 rounded-xl border border-[#1b273d]">
                  {/* 좌측: 전체 스프라이트 시트 슬라이스 가이드 */}
                  <div className="flex flex-col gap-1.5 min-w-0">
                    <div className="flex items-center justify-between text-[11px] text-[#cfd8e8]">
                      <span className="font-bold text-[#c8aa6e] flex items-center gap-1">
                        <span>▦</span> 전체 시트 분할 가이드
                      </span>
                      <button
                        onClick={() => setShowGridGuide(prev => !prev)}
                        className={`text-[10px] px-2 py-0.5 rounded border font-bold ${
                          showGridGuide
                            ? 'bg-[#c8aa6e22] text-[#c8aa6e] border-[#c8aa6e55]'
                            : 'bg-[#152033] text-[#8b9bb4] border-[#223350]'
                        }`}
                      >
                        격자선 {showGridGuide ? 'ON' : 'OFF'}
                      </button>
                    </div>

                    <div className="relative border border-[#233554] rounded-lg overflow-hidden bg-[#05080f] flex items-center justify-center p-2 min-h-[140px]">
                      <div className="relative inline-block max-w-full">
                        <img
                          src={editingVfxConfig.src}
                          alt="Sheet Preview"
                          className="max-h-36 max-w-full block object-contain select-none"
                          style={{ imageRendering: 'pixelated' }}
                        />
                        {showGridGuide && (
                          <div
                            className="absolute inset-0 grid pointer-events-none"
                            style={{
                              gridTemplateColumns: `repeat(${editingVfxConfig.cols}, 1fr)`,
                              gridTemplateRows: `repeat(${editingVfxConfig.rows}, 1fr)`,
                            }}
                          >
                            {Array.from({ length: totalCells }).map((_, idx) => {
                              const isCurrent = idx === spritePreviewFrame;
                              const isExcluded = idx >= effectiveTotal;
                              return (
                                <div
                                  key={idx}
                                  className={`border border-[#c8aa6e44] relative flex items-center justify-center transition-colors ${
                                    isCurrent
                                      ? 'bg-[#c8aa6e44] border-2 border-[#c8aa6e] shadow-[0_0_8px_#c8aa6e]'
                                      : isExcluded
                                      ? 'bg-red-950/50 border-red-500/30'
                                      : ''
                                  }`}
                                >
                                  <span className={`text-[7px] font-mono select-none px-0.5 rounded ${
                                    isCurrent
                                      ? 'bg-[#c8aa6e] text-black font-bold'
                                      : isExcluded
                                      ? 'text-red-400'
                                      : 'text-white/70'
                                  }`}>
                                    {idx + 1}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-[10px] text-[#546e7a] text-center">
                      총 {totalCells}칸 중 {effectiveTotal}개 활성 프레임 재생
                    </div>
                  </div>

                  {/* 우측: 실시간 단일 프레임 애니메이션 플레이어 */}
                  <div className="flex flex-col gap-1.5 items-center justify-between min-w-0">
                    <div className="w-full flex items-center justify-between text-[11px] text-[#cfd8e8]">
                      <span className="font-bold text-[#38ef7d] flex items-center gap-1">
                        <span>▶</span> 실시간 단일 프레임
                      </span>
                      <span className="text-[10px] font-mono text-[#ffd54f]">
                        프레임: {spritePreviewFrame + 1} / {effectiveTotal}
                      </span>
                    </div>

                    <div className="w-28 h-28 border border-[#233554] rounded-xl overflow-hidden bg-[#05080f] flex items-center justify-center shadow-inner relative">
                      <div
                        className="w-full h-full"
                        style={{
                          backgroundImage: `url(${editingVfxConfig.src})`,
                          backgroundRepeat: 'no-repeat',
                          backgroundSize: `${editingVfxConfig.cols * 100}% ${editingVfxConfig.rows * 100}%`,
                          backgroundPosition: `${previewPosX}% ${previewPosY}%`,
                          imageRendering: 'pixelated',
                        }}
                      />
                    </div>

                    {/* 플레이어 조작 버튼 */}
                    <div className="flex items-center gap-1.5">
                      <button
                        className="btn btn-ghost text-xs px-2 py-1 bg-[#141d30] text-[#cfd8e8] border border-[#223350]"
                        onClick={() => {
                          setIsPlayingPreview(false);
                          setSpritePreviewFrame(prev => (prev - 1 + effectiveTotal) % effectiveTotal);
                        }}
                        title="이전 프레임"
                      >
                        ◀
                      </button>
                      <button
                        className={`btn text-xs px-3 py-1 font-bold ${
                          isPlayingPreview ? 'btn-primary' : 'btn-ghost bg-[#141d30] text-[#c8aa6e] border border-[#c8aa6e55]'
                        }`}
                        onClick={() => setIsPlayingPreview(prev => !prev)}
                      >
                        {isPlayingPreview ? '⏸ 정지' : '▶ 재생'}
                      </button>
                      <button
                        className="btn btn-ghost text-xs px-2 py-1 bg-[#141d30] text-[#cfd8e8] border border-[#223350]"
                        onClick={() => {
                          setIsPlayingPreview(false);
                          setSpritePreviewFrame(prev => (prev + 1) % effectiveTotal);
                        }}
                        title="다음 프레임"
                      >
                        ▶
                      </button>
                    </div>
                  </div>
                </div>

                {/* 퀵 프리셋 버튼 */}
                <div className="flex flex-col gap-1.5">
                  <div className="text-[11px] font-bold text-[#8b9bb4] flex items-center gap-1">
                    <span>⚡</span> 규격 퀵 프리셋
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      {
                        label: '🧠 자동 감지',
                        onClick: () => {
                          const detected = detectSpriteSheetDimensions(
                            editingVfxConfig.naturalWidth,
                            editingVfxConfig.naturalHeight
                          );
                          setEditingVfxConfig(prev => prev ? ({
                            ...prev,
                            cols: detected.cols,
                            rows: detected.rows,
                            totalFrames: detected.totalFrames,
                          }) : null);
                          setSpritePreviewFrame(0);
                        },
                      },
                      {
                        label: '가로 1줄 (1×N)',
                        onClick: () => {
                          const cols = Math.max(1, Math.round(editingVfxConfig.naturalWidth / editingVfxConfig.naturalHeight));
                          setEditingVfxConfig(prev => prev ? ({
                            ...prev,
                            cols,
                            rows: 1,
                            totalFrames: cols,
                          }) : null);
                          setSpritePreviewFrame(0);
                        },
                      },
                      {
                        label: 'RPG 5×4 (20F)',
                        onClick: () => {
                          setEditingVfxConfig(prev => prev ? ({ ...prev, cols: 5, rows: 4, totalFrames: 20 }) : null);
                          setSpritePreviewFrame(0);
                        },
                      },
                      {
                        label: 'RPG 5×5 (25F)',
                        onClick: () => {
                          setEditingVfxConfig(prev => prev ? ({ ...prev, cols: 5, rows: 5, totalFrames: 25 }) : null);
                          setSpritePreviewFrame(0);
                        },
                      },
                      {
                        label: '정사각 4×4 (16F)',
                        onClick: () => {
                          setEditingVfxConfig(prev => prev ? ({ ...prev, cols: 4, rows: 4, totalFrames: 16 }) : null);
                          setSpritePreviewFrame(0);
                        },
                      },
                      {
                        label: '직사각 6×4 (24F)',
                        onClick: () => {
                          setEditingVfxConfig(prev => prev ? ({ ...prev, cols: 6, rows: 4, totalFrames: 24 }) : null);
                          setSpritePreviewFrame(0);
                        },
                      },
                      {
                        label: '직사각 8×4 (32F)',
                        onClick: () => {
                          setEditingVfxConfig(prev => prev ? ({ ...prev, cols: 8, rows: 4, totalFrames: 32 }) : null);
                          setSpritePreviewFrame(0);
                        },
                      },
                      {
                        label: '정사각 8×8 (64F)',
                        onClick: () => {
                          setEditingVfxConfig(prev => prev ? ({ ...prev, cols: 8, rows: 8, totalFrames: 64 }) : null);
                          setSpritePreviewFrame(0);
                        },
                      },
                    ].map((preset, i) => (
                      <button
                        key={i}
                        className="btn btn-ghost text-[10px] px-2.5 py-1 rounded bg-[#12141a] border border-[#21324d] text-[#cfd8e8] hover:text-[#c8aa6e] hover:border-[#c8aa6e]"
                        onClick={preset.onClick}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 정밀 규격 파라미터 스테퍼 */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 bg-[#090e1a] p-3 rounded-xl border border-[#1b273d]">
                  {/* 가로 열 (Cols) */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#8b9bb4]">가로 열 (Cols)</span>
                    <div className="flex items-center gap-1">
                      <button
                        className="btn btn-ghost text-xs px-2 py-1 bg-[#141d30] border border-[#223350]"
                        onClick={() => setEditingVfxConfig(prev => prev ? ({
                          ...prev,
                          cols: Math.max(1, prev.cols - 1),
                          totalFrames: Math.min(prev.totalFrames || 999, Math.max(1, prev.cols - 1) * prev.rows),
                        }) : null)}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={64}
                        value={editingVfxConfig.cols}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(64, parseInt(e.target.value) || 1));
                          setEditingVfxConfig(prev => prev ? ({
                            ...prev,
                            cols: val,
                            totalFrames: Math.min(prev.totalFrames || 999, val * prev.rows),
                          }) : null);
                        }}
                        className="w-full text-center bg-[#05080f] border border-[#21324d] text-xs font-mono py-1 rounded text-white"
                      />
                      <button
                        className="btn btn-ghost text-xs px-2 py-1 bg-[#141d30] border border-[#223350]"
                        onClick={() => setEditingVfxConfig(prev => prev ? ({
                          ...prev,
                          cols: Math.min(64, prev.cols + 1),
                        }) : null)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* 세로 행 (Rows) */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#8b9bb4]">세로 행 (Rows)</span>
                    <div className="flex items-center gap-1">
                      <button
                        className="btn btn-ghost text-xs px-2 py-1 bg-[#141d30] border border-[#223350]"
                        onClick={() => setEditingVfxConfig(prev => prev ? ({
                          ...prev,
                          rows: Math.max(1, prev.rows - 1),
                          totalFrames: Math.min(prev.totalFrames || 999, prev.cols * Math.max(1, prev.rows - 1)),
                        }) : null)}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={64}
                        value={editingVfxConfig.rows}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(64, parseInt(e.target.value) || 1));
                          setEditingVfxConfig(prev => prev ? ({
                            ...prev,
                            rows: val,
                            totalFrames: Math.min(prev.totalFrames || 999, prev.cols * val),
                          }) : null);
                        }}
                        className="w-full text-center bg-[#05080f] border border-[#21324d] text-xs font-mono py-1 rounded text-white"
                      />
                      <button
                        className="btn btn-ghost text-xs px-2 py-1 bg-[#141d30] border border-[#223350]"
                        onClick={() => setEditingVfxConfig(prev => prev ? ({
                          ...prev,
                          rows: Math.min(64, prev.rows + 1),
                        }) : null)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* 유효 프레임 수 (Total Frames) */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#8b9bb4]">유효 프레임 수</span>
                    <div className="flex items-center gap-1">
                      <button
                        className="btn btn-ghost text-xs px-2 py-1 bg-[#141d30] border border-[#223350]"
                        onClick={() => setEditingVfxConfig(prev => prev ? ({
                          ...prev,
                          totalFrames: Math.max(1, (prev.totalFrames || totalCells) - 1),
                        }) : null)}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={totalCells}
                        value={editingVfxConfig.totalFrames || totalCells}
                        onChange={(e) => {
                          const val = Math.max(1, Math.min(totalCells, parseInt(e.target.value) || 1));
                          setEditingVfxConfig(prev => prev ? ({ ...prev, totalFrames: val }) : null);
                        }}
                        className="w-full text-center bg-[#05080f] border border-[#21324d] text-xs font-mono py-1 rounded text-white"
                      />
                      <button
                        className="btn btn-ghost text-xs px-2 py-1 bg-[#141d30] border border-[#223350]"
                        onClick={() => setEditingVfxConfig(prev => prev ? ({
                          ...prev,
                          totalFrames: Math.min(totalCells, (prev.totalFrames || totalCells) + 1),
                        }) : null)}
                      >
                        +
                      </button>
                    </div>
                  </div>

                  {/* 재생 속도 (Duration ms) */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-bold text-[#8b9bb4]">재생 시간 (ms)</span>
                    <div className="flex items-center gap-1">
                      <button
                        className="btn btn-ghost text-xs px-2 py-1 bg-[#141d30] border border-[#223350]"
                        onClick={() => setEditingVfxConfig(prev => prev ? ({
                          ...prev,
                          duration: Math.max(150, prev.duration - 50),
                        }) : null)}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={150}
                        max={3000}
                        step={50}
                        value={editingVfxConfig.duration}
                        onChange={(e) => {
                          const val = Math.max(150, Math.min(3000, parseInt(e.target.value) || 650));
                          setEditingVfxConfig(prev => prev ? ({ ...prev, duration: val }) : null);
                        }}
                        className="w-full text-center bg-[#05080f] border border-[#21324d] text-xs font-mono py-1 rounded text-white"
                      />
                      <button
                        className="btn btn-ghost text-xs px-2 py-1 bg-[#141d30] border border-[#223350]"
                        onClick={() => setEditingVfxConfig(prev => prev ? ({
                          ...prev,
                          duration: Math.min(3000, prev.duration + 50),
                        }) : null)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>

                {/* 하단 저장 및 취소 버튼 */}
                <div className="flex items-center justify-between border-t border-[#1f2d48] pt-2.5">
                  <button
                    className="btn btn-ghost text-xs text-[#ff5252] border border-[#ff525244] hover:bg-[#ff525211]"
                    onClick={handleResetSpriteConfig}
                  >
                    🔄 자동 감지로 초기화
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      className="btn btn-ghost text-xs px-3 py-1.5"
                      onClick={() => setEditingVfxConfig(null)}
                    >
                      취소
                    </button>
                    <button
                      className="btn btn-primary text-xs px-4 py-1.5 font-bold shadow-lg"
                      onClick={handleSaveSpriteConfig}
                    >
                      💾 규격 저장
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── JSON 붙여넣기 모달 ── */}
        {showJsonModal && (
          <div className="absolute inset-0 z-30 bg-black/90 p-4 flex flex-col justify-center animate-scale-up">
            <div className="bg-[#12141a] border border-[#243552] rounded-xl p-4 flex flex-col gap-3 max-w-lg mx-auto w-full shadow-2xl">
              <div className="flex items-center justify-between border-b border-[#243552] pb-2">
                <span className="font-bold text-sm text-white flex items-center gap-1.5">
                  <span>📤</span>
                  <span>에셋 설정 JSON 붙여넣기</span>
                </span>
                <button className="text-xs text-[#8b9bb4]" onClick={() => setShowJsonModal(false)}>✕</button>
              </div>
              <textarea
                rows={8}
                value={importJsonText}
                onChange={(e) => setImportJsonText(e.target.value)}
                placeholder='{"pureEmojiMode": false, "iconOverrides": {...}, ...}'
                className="w-full bg-[#080d16] border border-[#212e45] text-xs font-mono p-2.5 rounded-lg text-[#cfd8e8] focus:outline-none focus:border-[#c8aa6e]"
              />
              <div className="flex justify-end gap-2">
                <button className="btn btn-ghost text-xs px-3 py-1.5" onClick={() => setShowJsonModal(false)}>취소</button>
                <button className="btn btn-primary text-xs px-4 py-1.5 font-bold" onClick={handleImportJson}>
                  적용하기
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

