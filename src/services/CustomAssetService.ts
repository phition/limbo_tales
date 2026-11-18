/**
 * ═════════════════════════════════════════════════════════════════════════
 *  🎨 CustomAssetService: 외부 에셋(아이콘, BGM, SFX, 이펙트, 던전/몬스터/용병 미디어) 로더 및 모드 전환 서비스
 * ═════════════════════════════════════════════════════════════════════════
 *  - 원클릭 순수 이모지(Pure Emoji) 모드 <-> 커스텀 64x64 에셋 모드 전환
 *  - 개별 아이콘(자원, 장비, 상태이상, 건물, 보급품, 스킬, 마도서) URL/DataURI 오버라이드
 *  - BGM(성채, 던전, 전투, 보스) 및 SFX(29종) 커스텀 오디오 URL 오버라이드
 *  - 스킬 이펙트 (VFX) 스프라이트 / GIF / WebP 애니메이션 오버라이드
 *  - 던전 1~10층 배경 이미지 / GIF / 비디오 오버라이드
 *  - 몬스터 / 보스 스탠딩 이미지, GIF 및 보스 컷신 영상(MP4/WebM) 오버라이드
 *  - 용병 클래스 / 영웅별 초상화 및 일러스트 오버라이드
 *  - JSON 프리셋 내보내기/가져오기 및 IndexedDB 영속화
 */

import { NPC_NAME_TO_ID, NPC_ID_TO_NAME } from '../data/npcs';
import { BOSS_BOOK_ALIAS_MAP } from '../utils/iconMap';

/** 🚀 이미지 에셋(PNG/JPG/JPEG) 요청 시 초경량 WebP 포맷으로 자동 우선 치환하는 스마트 리졸버 */
export function toWebp(path?: string): string | undefined {
  if (!path || typeof path !== 'string') return path;
  if (path.startsWith('data:') || path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  // 🛡️ VFX 스프라이트 에셋은 렌더링 성능과 호환성을 위해 무조건 원본 PNG 포맷 보존
  if (path.includes('/vfx/') || path.includes('custom_uploaded/vfx')) {
    return path;
  }
  if (/\.(png|jpg|jpeg)$/i.test(path)) {
    return path.replace(/\.(png|jpg|jpeg)$/i, '.webp');
  }
  return path;
}

export const CLASS_GENDER_PORTRAITS: Record<string, { male: string; female: string }> = {
  squire: {
    male: 'assets/portraits/portrait_squire_male.webp',
    female: 'assets/portraits/portrait_squire_female.webp',
  },
  paladin: {
    male: 'assets/portraits/portrait_paladin_male.webp',
    female: 'assets/portraits/portrait_paladin_female.webp',
  },
  guardian: {
    male: 'assets/portraits/portrait_t1_guardian.webp',
    female: 'assets/portraits/portrait_paladin_female.webp',
  },
  aegis_valkyrie: {
    male: 'assets/portraits/portrait_t2_valkyrie_male.webp',
    female: 'assets/portraits/portrait_t2_valkyrie.webp',
  },
  aegis_bastion: {
    male: 'assets/portraits/portrait_t3_bastion.webp',
    female: 'assets/portraits/portrait_t3_bastion_female.webp',
  },
  fortress: {
    male: 'assets/portraits/portrait_t3_bastion.webp',
    female: 'assets/portraits/portrait_t3_bastion_female.webp',
  },
  crusader_lord: {
    male: 'assets/portraits/portrait_t3_seraphic_inquisitor.webp',
    female: 'assets/portraits/portrait_t3_seraphic_inquisitor_female.webp',
  },
  rogue: {
    male: 'assets/portraits/portrait_rogue_male.webp',
    female: 'assets/portraits/portrait_rogue_female.webp',
  },
  duelist: {
    male: 'assets/portraits/portrait_t1_duelist.webp',
    female: 'assets/portraits/portrait_rogue_female.webp',
  },
  blade_dancer: {
    male: 'assets/portraits/portrait_t1_duelist.webp',
    female: 'assets/portraits/portrait_t2_shadow_phantom.webp',
  },
  assassin: {
    male: 'assets/portraits/portrait_t2_shadow_phantom_male.webp',
    female: 'assets/portraits/portrait_t2_shadow_phantom.webp',
  },
  shadow_phantom: {
    male: 'assets/portraits/portrait_t2_shadow_phantom_male.webp',
    female: 'assets/portraits/portrait_t2_shadow_phantom.webp',
  },
  void_strider: {
    male: 'assets/portraits/portrait_t3_void_strider.webp',
    female: 'assets/portraits/portrait_t3_void_strider_female.webp',
  },
  apprentice: {
    male: 'assets/portraits/portrait_apprentice_male.webp',
    female: 'assets/portraits/portrait_apprentice_female.webp',
  },
  apprentice_mage: {
    male: 'assets/portraits/portrait_apprentice_male.webp',
    female: 'assets/portraits/portrait_apprentice_female.webp',
  },
  mage: {
    male: 'assets/portraits/portrait_mage_male.webp',
    female: 'assets/portraits/portrait_mage_female.webp',
  },
  elementalist: {
    male: 'assets/portraits/portrait_mage_male.webp',
    female: 'assets/portraits/portrait_mage_female.webp',
  },
  arcane_scholar: {
    male: 'assets/portraits/portrait_t1_scholar.webp',
    female: 'assets/portraits/portrait_mage_female.webp',
  },
  scholar: {
    male: 'assets/portraits/portrait_t1_scholar.webp',
    female: 'assets/portraits/portrait_mage_female.webp',
  },
  calamity_mage: {
    male: 'assets/portraits/portrait_t2_calamity_mage_male.webp',
    female: 'assets/portraits/portrait_t2_calamity_mage.webp',
  },
  chronomancer: {
    male: 'assets/portraits/portrait_t3_chrono_archon.webp',
    female: 'assets/portraits/portrait_t3_chrono_archon_female.webp',
  },
  chrono_archon: {
    male: 'assets/portraits/portrait_t3_chrono_archon.webp',
    female: 'assets/portraits/portrait_t3_chrono_archon_female.webp',
  },
  acolyte: {
    male: 'assets/portraits/portrait_acolyte_male.webp',
    female: 'assets/portraits/portrait_acolyte_female.webp',
  },
  novice_cleric: {
    male: 'assets/portraits/portrait_acolyte_male.webp',
    female: 'assets/portraits/portrait_acolyte_female.webp',
  },
  cleric: {
    male: 'assets/portraits/portrait_cleric_male.webp',
    female: 'assets/portraits/portrait_cleric_female.webp',
  },
  war_priest: {
    male: 'assets/portraits/portrait_t1_war_priest.webp',
    female: 'assets/portraits/portrait_cleric_female.webp',
  },
  bishop: {
    male: 'assets/portraits/portrait_t2_high_saintess_male.webp',
    female: 'assets/portraits/portrait_t2_high_saintess.webp',
  },
  high_saintess: {
    male: 'assets/portraits/portrait_t2_high_saintess_male.webp',
    female: 'assets/portraits/portrait_t2_high_saintess.webp',
  },
  seraphic_inquisitor: {
    male: 'assets/portraits/portrait_t3_seraphic_inquisitor.webp',
    female: 'assets/portraits/portrait_t3_seraphic_inquisitor_female.webp',
  },
  vanguard: {
    male: 'assets/portraits/portrait_vanguard_male.webp',
    female: 'assets/portraits/portrait_vanguard_female.webp',
  },
  warrior: {
    male: 'assets/portraits/portrait_berserker_male.webp',
    female: 'assets/portraits/portrait_berserker_female.webp',
  },
  berserker: {
    male: 'assets/portraits/portrait_berserker_male.webp',
    female: 'assets/portraits/portrait_berserker_female.webp',
  },
  warlord: {
    male: 'assets/portraits/portrait_t1_warlord.webp',
    female: 'assets/portraits/portrait_berserker_female.webp',
  },
  valhalla_blade: {
    male: 'assets/portraits/portrait_t2_valhalla_blade_male.webp',
    female: 'assets/portraits/portrait_t2_valhalla_blade.webp',
  },
  iron_marshal: {
    male: 'assets/portraits/portrait_t3_valhalla_warlord.webp',
    female: 'assets/portraits/portrait_t3_valhalla_warlord_female.webp',
  },
  valhalla_warlord: {
    male: 'assets/portraits/portrait_t3_valhalla_warlord.webp',
    female: 'assets/portraits/portrait_t3_valhalla_warlord_female.webp',
  },
  gunner: {
    male: 'assets/portraits/portrait_gunner_male.webp',
    female: 'assets/portraits/portrait_gunner_female.webp',
  },
  archer: {
    male: 'assets/portraits/portrait_gunner_male.webp',
    female: 'assets/portraits/portrait_gunner_female.webp',
  },
  tactical_gunner: {
    male: 'assets/portraits/portrait_gunner_male.webp',
    female: 'assets/portraits/portrait_gunner_female.webp',
  },
  sharpshooter: {
    male: 'assets/portraits/portrait_gunner_male.webp',
    female: 'assets/portraits/portrait_t1_sharpshooter.webp',
  },
  aether_gun_meister: {
    male: 'assets/portraits/portrait_t2_gun_meister_male.webp',
    female: 'assets/portraits/portrait_t2_gun_meister.webp',
  },
  gun_meister: {
    male: 'assets/portraits/portrait_t2_gun_meister_male.webp',
    female: 'assets/portraits/portrait_t2_gun_meister.webp',
  },
  ghost_sniper: {
    male: 'assets/portraits/portrait_t3_omega_deadeye.webp',
    female: 'assets/portraits/portrait_t3_omega_deadeye_female.webp',
  },
  omega_deadeye: {
    male: 'assets/portraits/portrait_t3_omega_deadeye.webp',
    female: 'assets/portraits/portrait_t3_omega_deadeye_female.webp',
  },
};

/** 🎨 클래스별 남녀 포트레이트 베리에이션 풀 (신규 2번 포트레이트 포함) */
export const CLASS_PORTRAIT_VARIANTS: Record<string, { male: string[]; female: string[] }> = {
  squire: {
    male: ['assets/portraits/portrait_squire_male.webp', 'assets/portraits/portrait_squire_male_02.webp', 'assets/portraits/portrait_squire_male_03.webp'],
    female: ['assets/portraits/portrait_squire_female.webp', 'assets/portraits/portrait_squire_female_02.webp', 'assets/portraits/portrait_squire_female_03.webp'],
  },
  paladin: {
    male: ['assets/portraits/portrait_paladin_male.webp', 'assets/portraits/portrait_squire_male_02.webp', 'assets/portraits/portrait_squire_male_03.webp'],
    female: ['assets/portraits/portrait_paladin_female.webp', 'assets/portraits/portrait_squire_female_02.webp', 'assets/portraits/portrait_squire_female_03.webp'],
  },
  guardian: {
    male: ['assets/portraits/portrait_t1_guardian.webp', 'assets/portraits/portrait_squire_male_02.webp', 'assets/portraits/portrait_squire_male_03.webp'],
    female: ['assets/portraits/portrait_paladin_female.webp', 'assets/portraits/portrait_squire_female_02.webp', 'assets/portraits/portrait_squire_female_03.webp'],
  },
  rogue: {
    male: ['assets/portraits/portrait_rogue_male.webp', 'assets/portraits/portrait_rogue_male_02.webp', 'assets/portraits/portrait_rogue_male_03.webp'],
    female: ['assets/portraits/portrait_rogue_female.webp', 'assets/portraits/portrait_rogue_female_02.webp', 'assets/portraits/portrait_rogue_female_03.webp'],
  },
  duelist: {
    male: ['assets/portraits/portrait_t1_duelist.webp', 'assets/portraits/portrait_rogue_male_02.webp', 'assets/portraits/portrait_rogue_male_03.webp'],
    female: ['assets/portraits/portrait_rogue_female.webp', 'assets/portraits/portrait_rogue_female_02.webp', 'assets/portraits/portrait_rogue_female_03.webp'],
  },
  assassin: {
    male: ['assets/portraits/portrait_t2_shadow_phantom_male.webp', 'assets/portraits/portrait_rogue_male_02.webp', 'assets/portraits/portrait_rogue_male_03.webp'],
    female: ['assets/portraits/portrait_t2_shadow_phantom.webp', 'assets/portraits/portrait_rogue_female_02.webp', 'assets/portraits/portrait_rogue_female_03.webp'],
  },
  apprentice: {
    male: ['assets/portraits/portrait_apprentice_male.webp', 'assets/portraits/portrait_mage_male_02.webp', 'assets/portraits/portrait_mage_male_03.webp'],
    female: ['assets/portraits/portrait_apprentice_female.webp', 'assets/portraits/portrait_mage_female_02.webp', 'assets/portraits/portrait_mage_female_03.webp'],
  },
  apprentice_mage: {
    male: ['assets/portraits/portrait_apprentice_male.webp', 'assets/portraits/portrait_mage_male_02.webp', 'assets/portraits/portrait_mage_male_03.webp'],
    female: ['assets/portraits/portrait_apprentice_female.webp', 'assets/portraits/portrait_mage_female_02.webp', 'assets/portraits/portrait_mage_female_03.webp'],
  },
  mage: {
    male: ['assets/portraits/portrait_mage_male.webp', 'assets/portraits/portrait_mage_male_02.webp', 'assets/portraits/portrait_mage_male_03.webp'],
    female: ['assets/portraits/portrait_mage_female.webp', 'assets/portraits/portrait_mage_female_02.webp', 'assets/portraits/portrait_mage_female_03.webp'],
  },
  elementalist: {
    male: ['assets/portraits/portrait_mage_male.webp', 'assets/portraits/portrait_mage_male_02.webp', 'assets/portraits/portrait_mage_male_03.webp'],
    female: ['assets/portraits/portrait_mage_female.webp', 'assets/portraits/portrait_mage_female_02.webp', 'assets/portraits/portrait_mage_female_03.webp'],
  },
  acolyte: {
    male: ['assets/portraits/portrait_acolyte_male.webp', 'assets/portraits/portrait_cleric_male_02.webp', 'assets/portraits/portrait_cleric_male_03.webp'],
    female: ['assets/portraits/portrait_acolyte_female.webp', 'assets/portraits/portrait_cleric_female_02.webp', 'assets/portraits/portrait_cleric_female_03.webp'],
  },
  novice_cleric: {
    male: ['assets/portraits/portrait_acolyte_male.webp', 'assets/portraits/portrait_cleric_male_02.webp', 'assets/portraits/portrait_cleric_male_03.webp'],
    female: ['assets/portraits/portrait_acolyte_female.webp', 'assets/portraits/portrait_cleric_female_02.webp', 'assets/portraits/portrait_cleric_female_03.webp'],
  },
  cleric: {
    male: ['assets/portraits/portrait_cleric_male.webp', 'assets/portraits/portrait_cleric_male_02.webp', 'assets/portraits/portrait_cleric_male_03.webp'],
    female: ['assets/portraits/portrait_cleric_female.webp', 'assets/portraits/portrait_cleric_female_02.webp', 'assets/portraits/portrait_cleric_female_03.webp'],
  },
  war_priest: {
    male: ['assets/portraits/portrait_t1_war_priest.webp', 'assets/portraits/portrait_cleric_male_02.webp', 'assets/portraits/portrait_cleric_male_03.webp'],
    female: ['assets/portraits/portrait_cleric_female.webp', 'assets/portraits/portrait_cleric_female_02.webp', 'assets/portraits/portrait_cleric_female_03.webp'],
  },
  vanguard: {
    male: ['assets/portraits/portrait_vanguard_male.webp', 'assets/portraits/portrait_berserker_male_02.webp', 'assets/portraits/portrait_berserker_male_03.webp'],
    female: ['assets/portraits/portrait_vanguard_female.webp', 'assets/portraits/portrait_berserker_female_02.webp', 'assets/portraits/portrait_berserker_female_03.webp'],
  },
  warrior: {
    male: ['assets/portraits/portrait_berserker_male.webp', 'assets/portraits/portrait_berserker_male_02.webp', 'assets/portraits/portrait_berserker_male_03.webp'],
    female: ['assets/portraits/portrait_berserker_female.webp', 'assets/portraits/portrait_berserker_female_02.webp', 'assets/portraits/portrait_berserker_female_03.webp'],
  },
  berserker: {
    male: ['assets/portraits/portrait_berserker_male.webp', 'assets/portraits/portrait_berserker_male_02.webp', 'assets/portraits/portrait_berserker_male_03.webp'],
    female: ['assets/portraits/portrait_berserker_female.webp', 'assets/portraits/portrait_berserker_female_02.webp', 'assets/portraits/portrait_berserker_female_03.webp'],
  },
  warlord: {
    male: ['assets/portraits/portrait_t1_warlord.webp', 'assets/portraits/portrait_berserker_male_02.webp', 'assets/portraits/portrait_berserker_male_03.webp'],
    female: ['assets/portraits/portrait_berserker_female.webp', 'assets/portraits/portrait_berserker_female_02.webp', 'assets/portraits/portrait_berserker_female_03.webp'],
  },
  gunner: {
    male: ['assets/portraits/portrait_gunner_male.webp', 'assets/portraits/portrait_gunner_male_02.webp', 'assets/portraits/portrait_gunner_male_03.webp'],
    female: ['assets/portraits/portrait_gunner_female.webp', 'assets/portraits/portrait_gunner_female_02.webp', 'assets/portraits/portrait_gunner_female_03.webp'],
  },
  archer: {
    male: ['assets/portraits/portrait_gunner_male.webp', 'assets/portraits/portrait_gunner_male_02.webp', 'assets/portraits/portrait_gunner_male_03.webp'],
    female: ['assets/portraits/portrait_gunner_female.webp', 'assets/portraits/portrait_gunner_female_02.webp', 'assets/portraits/portrait_gunner_female_03.webp'],
  },
  tactical_gunner: {
    male: ['assets/portraits/portrait_gunner_male.webp', 'assets/portraits/portrait_gunner_male_02.webp', 'assets/portraits/portrait_gunner_male_03.webp'],
    female: ['assets/portraits/portrait_gunner_female.webp', 'assets/portraits/portrait_gunner_female_02.webp', 'assets/portraits/portrait_gunner_female_03.webp'],
  },
  sharpshooter: {
    male: ['assets/portraits/portrait_gunner_male.webp', 'assets/portraits/portrait_gunner_male_02.webp', 'assets/portraits/portrait_gunner_male_03.webp'],
    female: ['assets/portraits/portrait_t1_sharpshooter.webp', 'assets/portraits/portrait_gunner_female_02.webp', 'assets/portraits/portrait_gunner_female_03.webp'],
  },
  // ── 2차 전직 클래스 (Tier 2) 베리에이션 ──
  aegis_valkyrie: {
    male: ['assets/portraits/portrait_t2_valkyrie_male.webp', 'assets/portraits/portrait_t2_valkyrie_male_02.webp', 'assets/portraits/portrait_t2_valkyrie_male_03.webp'],
    female: ['assets/portraits/portrait_t2_valkyrie.webp', 'assets/portraits/portrait_t2_valkyrie_female.webp', 'assets/portraits/portrait_t2_valkyrie_female_02.webp', 'assets/portraits/portrait_t2_valkyrie_female_03.webp'],
  },
  valkyrie: {
    male: ['assets/portraits/portrait_t2_valkyrie_male.webp', 'assets/portraits/portrait_t2_valkyrie_male_02.webp', 'assets/portraits/portrait_t2_valkyrie_male_03.webp'],
    female: ['assets/portraits/portrait_t2_valkyrie.webp', 'assets/portraits/portrait_t2_valkyrie_female.webp', 'assets/portraits/portrait_t2_valkyrie_female_02.webp', 'assets/portraits/portrait_t2_valkyrie_female_03.webp'],
  },
  shadow_phantom: {
    male: ['assets/portraits/portrait_t2_shadow_phantom_male.webp', 'assets/portraits/portrait_t2_shadow_phantom_male_02.webp', 'assets/portraits/portrait_t2_shadow_phantom_male_03.webp'],
    female: ['assets/portraits/portrait_t2_shadow_phantom.webp', 'assets/portraits/portrait_t2_shadow_phantom_female.webp', 'assets/portraits/portrait_t2_shadow_phantom_female_02.webp', 'assets/portraits/portrait_t2_shadow_phantom_female_03.webp'],
  },
  calamity_mage: {
    male: ['assets/portraits/portrait_t2_calamity_mage_male.webp', 'assets/portraits/portrait_t2_calamity_mage_male_02.webp'],
    female: ['assets/portraits/portrait_t2_calamity_mage.webp', 'assets/portraits/portrait_t2_calamity_mage_female.webp', 'assets/portraits/portrait_t2_calamity_mage_female_02.webp'],
  },
  high_saintess: {
    male: ['assets/portraits/portrait_t2_high_saintess_male.webp', 'assets/portraits/portrait_t2_high_saintess_male_02.webp'],
    female: ['assets/portraits/portrait_t2_high_saintess.webp', 'assets/portraits/portrait_t2_high_saintess_female.webp', 'assets/portraits/portrait_t2_high_saintess_female_02.webp'],
  },
  bishop: {
    male: ['assets/portraits/portrait_t2_high_saintess_male.webp', 'assets/portraits/portrait_t2_high_saintess_male_02.webp'],
    female: ['assets/portraits/portrait_t2_high_saintess.webp', 'assets/portraits/portrait_t2_high_saintess_female.webp', 'assets/portraits/portrait_t2_high_saintess_female_02.webp'],
  },
  valhalla_blade: {
    male: ['assets/portraits/portrait_t2_valhalla_blade_male.webp', 'assets/portraits/portrait_t2_valhalla_blade_male_02.webp', 'assets/portraits/portrait_t2_valhalla_blade_male_03.webp'],
    female: ['assets/portraits/portrait_t2_valhalla_blade.webp', 'assets/portraits/portrait_t2_valhalla_blade_female.webp', 'assets/portraits/portrait_t2_valhalla_blade_female_02.webp'],
  },
  gun_meister: {
    male: ['assets/portraits/portrait_t2_gun_meister_male.webp', 'assets/portraits/portrait_t2_gun_meister_male_02.webp'],
    female: ['assets/portraits/portrait_t2_gun_meister.webp', 'assets/portraits/portrait_t2_gun_meister_female.webp', 'assets/portraits/portrait_t2_gun_meister_female_02.webp'],
  },
  aether_gun_meister: {
    male: ['assets/portraits/portrait_t2_gun_meister_male.webp', 'assets/portraits/portrait_t2_gun_meister_male_02.webp'],
    female: ['assets/portraits/portrait_t2_gun_meister.webp', 'assets/portraits/portrait_t2_gun_meister_female.webp', 'assets/portraits/portrait_t2_gun_meister_female_02.webp'],
  },
  // ── 3차 전직 클래스 (Tier 3) 베리에이션 ──
  aegis_bastion: {
    male: ['assets/portraits/portrait_t3_bastion_male.webp', 'assets/portraits/portrait_t3_bastion_male_02.webp'],
    female: ['assets/portraits/portrait_t3_bastion_female.webp', 'assets/portraits/portrait_t3_bastion_female_02.webp'],
  },
  bastion: {
    male: ['assets/portraits/portrait_t3_bastion_male.webp', 'assets/portraits/portrait_t3_bastion_male_02.webp'],
    female: ['assets/portraits/portrait_t3_bastion_female.webp', 'assets/portraits/portrait_t3_bastion_female_02.webp'],
  },
  fortress: {
    male: ['assets/portraits/portrait_t3_bastion_male.webp', 'assets/portraits/portrait_t3_bastion_male_02.webp'],
    female: ['assets/portraits/portrait_t3_bastion_female.webp', 'assets/portraits/portrait_t3_bastion_female_02.webp'],
  },
  void_strider: {
    male: ['assets/portraits/portrait_t3_void_strider_male.webp', 'assets/portraits/portrait_t3_void_strider_male_02.webp'],
    female: ['assets/portraits/portrait_t3_void_strider_female.webp', 'assets/portraits/portrait_t3_void_strider_female_02.webp'],
  },
  chrono_archon: {
    male: ['assets/portraits/portrait_t3_chrono_archon_male.webp', 'assets/portraits/portrait_t3_chrono_archon_male_02.webp'],
    female: ['assets/portraits/portrait_t3_chrono_archon_female.webp', 'assets/portraits/portrait_t3_chrono_archon_female_02.webp'],
  },
  chronomancer: {
    male: ['assets/portraits/portrait_t3_chrono_archon_male.webp', 'assets/portraits/portrait_t3_chrono_archon_male_02.webp'],
    female: ['assets/portraits/portrait_t3_chrono_archon_female.webp', 'assets/portraits/portrait_t3_chrono_archon_female_02.webp'],
  },
  seraphic_inquisitor: {
    male: ['assets/portraits/portrait_t3_seraphic_inquisitor_male.webp', 'assets/portraits/portrait_t3_seraphic_inquisitor_male_02.webp'],
    female: ['assets/portraits/portrait_t3_seraphic_inquisitor_female.webp', 'assets/portraits/portrait_t3_seraphic_inquisitor_female_02.webp'],
  },
  crusader_lord: {
    male: ['assets/portraits/portrait_t3_seraphic_inquisitor_male.webp', 'assets/portraits/portrait_t3_seraphic_inquisitor_male_02.webp'],
    female: ['assets/portraits/portrait_t3_seraphic_inquisitor_female.webp', 'assets/portraits/portrait_t3_seraphic_inquisitor_female_02.webp'],
  },
  valhalla_warlord: {
    male: ['assets/portraits/portrait_t3_valhalla_warlord_male.webp', 'assets/portraits/portrait_t3_valhalla_warlord_male_02.webp'],
    female: ['assets/portraits/portrait_t3_valhalla_warlord_female.webp', 'assets/portraits/portrait_t3_valhalla_warlord_female_02.webp'],
  },
  iron_marshal: {
    male: ['assets/portraits/portrait_t3_valhalla_warlord_male.webp', 'assets/portraits/portrait_t3_valhalla_warlord_male_02.webp'],
    female: ['assets/portraits/portrait_t3_valhalla_warlord_female.webp', 'assets/portraits/portrait_t3_valhalla_warlord_female_02.webp'],
  },
  omega_deadeye: {
    male: ['assets/portraits/portrait_t3_omega_deadeye_male.webp', 'assets/portraits/portrait_t3_omega_deadeye_male_02.webp'],
    female: ['assets/portraits/portrait_t3_omega_deadeye_female.webp', 'assets/portraits/portrait_t3_omega_deadeye_female_02.webp'],
  },
  ghost_sniper: {
    male: ['assets/portraits/portrait_t3_omega_deadeye_male.webp', 'assets/portraits/portrait_t3_omega_deadeye_male_02.webp'],
    female: ['assets/portraits/portrait_t3_omega_deadeye_female.webp', 'assets/portraits/portrait_t3_omega_deadeye_female_02.webp'],
  },
};

export interface SpriteSheetConfig {
  cols: number;
  rows: number;
  totalFrames?: number;
  duration?: number; // ms
}

export interface AssetConfigData {
  pureEmojiMode: boolean;
  syntheticAudioOnly: boolean;
  iconOverrides: Record<string, string>;
  bgmOverrides: Record<string, string>;
  sfxOverrides: Record<string, string>;
  vfxOverrides: Record<string, string>;
  vfxConfigs?: Record<string, SpriteSheetConfig>;
  dungeonFloorOverrides: Record<string, string>;
  monsterOverrides: Record<string, string>;
  monsterVideoOverrides: Record<string, string>;
  mercenaryOverrides: Record<string, string>;
  npcOverrides?: Record<string, string>;
  version: number;
}

type EventListener = (data?: unknown) => void;

const LEGACY_STORAGE_KEY = 'limbo_custom_assets_config_v1';
const IDB_DB_NAME = 'limbo_custom_assets_idb';
const IDB_STORE_NAME = 'assets_store';
const IDB_KEY = 'custom_assets_config';

export class CustomAssetService {
  private static instance: CustomAssetService | null = null;
  private listeners: Map<string, Set<EventListener>> = new Map();
  private isInitialized = false;

  private config: AssetConfigData = {
    pureEmojiMode: false,
    syntheticAudioOnly: false,
    iconOverrides: {},
    bgmOverrides: {},
    sfxOverrides: {},
    vfxOverrides: {},
    vfxConfigs: {},
    dungeonFloorOverrides: {},
    monsterOverrides: {},
    monsterVideoOverrides: {},
    mercenaryOverrides: {},
    npcOverrides: {},
    version: 1,
  };

  private constructor() {
    this.initStorage();
  }

  public static getInstance(): CustomAssetService {
    if (!CustomAssetService.instance) {
      CustomAssetService.instance = new CustomAssetService();
    }
    return CustomAssetService.instance;
  }

  public static getIconOverride(key: string): string | undefined {
    return CustomAssetService.getInstance().getIconOverride(key);
  }

  public static getBgmOverride(scene: string): string | undefined {
    return CustomAssetService.getInstance().getBgmOverride(scene);
  }

  public static getSfxOverride(key: string): string | undefined {
    return CustomAssetService.getInstance().getSfxOverride(key);
  }

  public static getVfxOverride(type: string): string | undefined {
    return CustomAssetService.getInstance().getVfxOverride(type);
  }

  public static getVfxConfig(type: string): SpriteSheetConfig | undefined {
    return CustomAssetService.getInstance().getVfxConfig(type);
  }

  public static getMonsterOverride(id: string): string | undefined {
    return CustomAssetService.getInstance().getMonsterOverride(id);
  }

  public static getMercenaryOverride(idOrClass: string): string | undefined {
    return CustomAssetService.getInstance().getMercenaryOverride(idOrClass);
  }

  public static getGenderPortrait(classId: string, gender: 'male' | 'female' = 'male'): string {
    return CustomAssetService.getInstance().getGenderPortrait(classId, gender);
  }

  public static getRandomGenderPortrait(classId: string, gender: 'male' | 'female' = 'male'): string {
    return CustomAssetService.getInstance().getRandomGenderPortrait(classId, gender);
  }

  public static getHeroPortrait(hero?: {
    id?: string;
    name?: string;
    classId?: string;
    gender?: 'male' | 'female';
    portraitUrl?: string;
    portraitPromptKey?: string;
  }): string {
    return CustomAssetService.getInstance().getHeroPortrait(hero);
  }

  public static getNpcOverride(nameOrId: string): string | undefined {
    return CustomAssetService.getInstance().getNpcOverride(nameOrId);
  }

  public static getElainePortrait(emotion: 'normal' | 'serious' | 'smile' | 'worry' = 'normal'): string {
    return CustomAssetService.getInstance().getElainePortrait(emotion);
  }

  // ── 🚀 초고속 대용량 인메모리 이미지 디코딩 캐시 (최대 1,000개 보관) ──
  private static imageMemoryCache = new Map<string, HTMLImageElement>();

  /**
   * ⚡ 단일 이미지 백그라운드 비동기 디코딩 및 RAM 영구 캐싱
   */
  public static preloadImage(src?: string): Promise<boolean> {
    if (!src || src.startsWith('data:') || src === 'emoji') return Promise.resolve(false);
    const resolved = toWebp(src) || src;
    if (this.imageMemoryCache.has(resolved)) return Promise.resolve(true);

    return new Promise((resolve) => {
      const img = new Image();
      img.decoding = 'async';
      const onDone = () => {
        this.imageMemoryCache.set(resolved, img);
        if (this.imageMemoryCache.size > 1000) {
          const firstKey = this.imageMemoryCache.keys().next().value;
          if (firstKey) this.imageMemoryCache.delete(firstKey);
        }
        if (typeof img.decode === 'function') {
          img.decode().catch(() => {}).then(() => resolve(true));
        } else {
          resolve(true);
        }
      };
      img.onload = onDone;
      img.onerror = () => resolve(false);
      img.src = resolved;
      if (img.complete && img.naturalWidth > 0) {
        onDone();
      }
    });
  }

  /**
   * ⚡ 여러 이미지 일괄 비동기 사전 로딩
   */
  public static preloadImages(urls: (string | undefined)[]): Promise<void> {
    const valid = urls.filter((u): u is string => Boolean(u));
    const unique = [...new Set(valid)];
    return Promise.all(unique.map(u => this.preloadImage(u))).then(() => {});
  }

  // ── 이벤트 리스너 ──────────────────────────────────────────────────────────
  public on(event: string, fn: EventListener): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(fn);
  }

  public off(event: string, fn: EventListener): void {
    this.listeners.get(event)?.delete(fn);
  }

  /** React useSyncExternalStore 구독 인터페이스 */
  public subscribe(callback: () => void): () => void {
    this.on('changed', callback);
    return () => this.off('changed', callback);
  }

  private emit(event: string, data?: unknown): void {
    this.listeners.get(event)?.forEach(fn => {
      try {
        fn(data);
      } catch (err) {
        console.error(`[CustomAssetService] Error in listener for ${event}:`, err);
      }
    });
  }

  // ── IndexedDB 헬퍼 ────────────────────────────────────────────────────────
  private openDb(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !window.indexedDB) {
        return reject(new Error('IndexedDB not supported'));
      }
      const req = window.indexedDB.open(IDB_DB_NAME, 2);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(IDB_STORE_NAME)) {
          db.createObjectStore(IDB_STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  private async getFromIdb(): Promise<AssetConfigData | null> {
    try {
      const db = await this.openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE_NAME, 'readonly');
        const store = tx.objectStore(IDB_STORE_NAME);
        const req = store.get(IDB_KEY);
        req.onsuccess = () => resolve(req.result || null);
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.warn('[CustomAssetService] IndexedDB read error:', e);
      return null;
    }
  }

  private async saveToIdb(data: AssetConfigData): Promise<void> {
    try {
      const db = await this.openDb();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(IDB_STORE_NAME, 'readwrite');
        const store = tx.objectStore(IDB_STORE_NAME);
        const req = store.put(data, IDB_KEY);
        req.onsuccess = () => resolve();
        req.onerror = () => reject(req.error);
      });
    } catch (e) {
      console.error('[CustomAssetService] IndexedDB write error:', e);
    }
  }

  // ── 초기화 및 마이그레이션 ─────────────────────────────────────────────────
  private async initStorage(): Promise<void> {
    if (typeof window === 'undefined') return;

    try {
      // 1. 레거시 localStorage 에셋 데이터 확인 (이전 버전 호환 및 마이그레이션)
      const legacyRaw = localStorage.getItem(LEGACY_STORAGE_KEY);
      let legacyData: AssetConfigData | null = null;
      if (legacyRaw) {
        try {
          legacyData = JSON.parse(legacyRaw);
          localStorage.removeItem(LEGACY_STORAGE_KEY);
          console.info('✨ [CustomAssetService] 레거시 localStorage 에셋을 IndexedDB로 마이그레이션 완료.');
        } catch (_) {}
      }

      // 2. IndexedDB에서 사용자 기기 로컬 에셋 데이터 로드
      let saved = await this.getFromIdb();
      if (!saved && legacyData) {
        saved = legacyData;
        await this.saveToIdb(saved);
      }

      // 3. 배포용 정적 프리셋(assets/custom_assets_preset.json) 항상 탐색 (모바일/Capacitor/웹 서브경로 호환)
      let staticPreset: Partial<AssetConfigData> = {};
      const basePrefix = (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.BASE_URL)
        ? import.meta.env.BASE_URL.replace(/\/$/, '') + '/'
        : '';
      const candidateUrls = [
        `${basePrefix}assets/custom_assets_preset.json`,
        'assets/custom_assets_preset.json',
        './assets/custom_assets_preset.json',
        '/assets/custom_assets_preset.json'
      ];

      const cacheBustQuery = `?v=${Date.now()}`;
      for (const url of candidateUrls) {
        try {
          let res: Response | null = null;
          try {
            res = await fetch(url + cacheBustQuery, { cache: 'no-cache' });
          } catch (_) {
            // 폴백: 쿼리스트링 미지원 환경(일부 로컬 파일 스킴 등)
          }

          // 🛡️ 모바일 WebView 등에서 쿼리스트링이 404를 반환하거나 실패할 경우 순수 URL로 재시도
          if (!res || !res.ok) {
            try {
              res = await fetch(url);
            } catch (_) {}
          }

          if (res && res.ok) {
            const data = await res.json();
            if (data && typeof data === 'object') {
              staticPreset = data;
              break;
            }
          }
        } catch (_) {}
      }

      // 4. Two-Tier Merge: 배포 정적 프리셋(기본) + 기기 로컬 IndexedDB 사용자 오버라이드
      // 🌟 배포 프리셋 버전이 로컬 저장소보다 높으면 배포 버전의 최신 에셋이 최우선 적용되도록 보장
      const isNewPresetVersion = (staticPreset.version || 0) > (saved?.version || 0);

      const mergeAssetMap = (
        staticMap: Record<string, string> = {},
        savedMap: Record<string, string> = {},
        preferStatic: boolean = false
      ): Record<string, string> => {
        const result: Record<string, string> = preferStatic
          ? { ...savedMap, ...staticMap }
          : { ...staticMap, ...savedMap };

        // 🛡️ 레거시 base64('data:...')만 실제 파일 경로('assets/...')로 보정
        // ⚠️ 단, 최신 배포 버전이 우선(preferStatic: true)일 때만 정적 파일이 base64를 대체하도록 제한!
        // 📱 모바일 기기에서 사용자가 직접 등록한 커스텀 에셋(base64)은 절대 기본 정적 경로로 강제 덮어쓰지 않고 온전히 보존합니다.
        if (preferStatic) {
          for (const [key, staticVal] of Object.entries(staticMap)) {
            if (staticVal && staticVal.startsWith('assets/') && (!result[key] || result[key].startsWith('data:'))) {
              result[key] = staticVal;
            }
          }
        }

        // 로컬 저장 데이터(savedMap)의 유효한 파일 경로 및 커스텀 base64 에셋 보장
        for (const [key, savedVal] of Object.entries(savedMap)) {
          if (savedVal && !result[key]) {
            result[key] = savedVal;
          }
        }
        return result;
      };

      const mergedOverrides = mergeAssetMap(staticPreset.iconOverrides, saved?.iconOverrides, isNewPresetVersion);
      const mergedVfxOverrides = mergeAssetMap(staticPreset.vfxOverrides, saved?.vfxOverrides, isNewPresetVersion);

      // 🛡️ 레거시 고정 저해상도 base64 및 webp 정리 (배포 정적 스프라이트 에셋 우선 적용)
      for (const [k, v] of Object.entries(staticPreset.vfxOverrides || {})) {
        if (v && v.endsWith('.png')) {
          mergedVfxOverrides[k] = v;
        } else if (v && !v.startsWith('data:') && (!mergedVfxOverrides[k] || mergedVfxOverrides[k].startsWith('data:image/png;base64,iVBORw0KGgoAAA') || mergedVfxOverrides[k].startsWith('data:image/png;base64,iVBORw0KGgoAAAEYAAABgCAYAAADimHc4'))) {
          mergedVfxOverrides[k] = v;
        }
      }
      // 🛡️ 저장소에 남아있을 수 있는 모든 VFX webp 경로를 png로 강제 정화
      for (const [k, v] of Object.entries(mergedVfxOverrides)) {
        if (typeof v === 'string' && v.includes('/vfx/') && v.endsWith('.webp')) {
          mergedVfxOverrides[k] = v.replace(/\.webp$/i, '.png');
        }
      }

      const mergedMonsterOverrides = mergeAssetMap(staticPreset.monsterOverrides, saved?.monsterOverrides, isNewPresetVersion);
      // 보스 결전기 및 VFX 키가 실수로 monsterOverrides에 잔류하지 않도록 제거
      const bossVfxKeys = ['boss_apocalypse', 'boss_cataclysm', 'boss_dragon_breath', 'boss_abyss_vortex'];
      for (const bvk of bossVfxKeys) {
        delete mergedMonsterOverrides[bvk];
      }
      for (const vk of Object.keys(mergedVfxOverrides)) {
        delete mergedMonsterOverrides[vk];
      }

      const mergedNpcOverrides: Record<string, string> = mergeAssetMap(staticPreset.npcOverrides, saved?.npcOverrides, isNewPresetVersion);
      // 🛡️ 언더스코어(_) 키 및 겹친 파일 경로 자동 정화
      for (const k of Object.keys(mergedNpcOverrides)) {
        if (/^_+$/.test(k)) {
          delete mergedNpcOverrides[k];
        }
      }
      for (const [k, v] of Object.entries(mergedNpcOverrides)) {
        if (typeof v === 'string' && (v.includes('________') || v.includes('___'))) {
          if (k === 'npc_lloyd' || k === '선봉대장 로이드') {
            mergedNpcOverrides[k] = 'assets/custom_uploaded/npcs/npc_lloyd.webp';
          } else if (k === 'npc_chief_advisor' || k === '방주 총괄 참모') {
            mergedNpcOverrides[k] = 'assets/custom_uploaded/npcs/npc_chief_advisor.webp';
          } else {
            const mappedId = NPC_NAME_TO_ID[k] || k;
            if (staticPreset.npcOverrides?.[mappedId]) {
              mergedNpcOverrides[k] = staticPreset.npcOverrides[mappedId];
            } else {
              delete mergedNpcOverrides[k];
            }
          }
        }
      }
      // 선봉대장 로이드 & 방주 총괄 참모 독립 경로 보장
      if (mergedNpcOverrides['npc_lloyd']) mergedNpcOverrides['선봉대장 로이드'] = mergedNpcOverrides['npc_lloyd'];
      if (mergedNpcOverrides['npc_chief_advisor']) mergedNpcOverrides['방주 총괄 참모'] = mergedNpcOverrides['npc_chief_advisor'];

      this.config = {
        pureEmojiMode: isNewPresetVersion ? (staticPreset.pureEmojiMode ?? false) : (saved?.pureEmojiMode ?? staticPreset.pureEmojiMode ?? false),
        syntheticAudioOnly: saved?.syntheticAudioOnly ?? staticPreset.syntheticAudioOnly ?? false,
        iconOverrides: mergedOverrides,
        bgmOverrides: mergeAssetMap(staticPreset.bgmOverrides, saved?.bgmOverrides, isNewPresetVersion),
        sfxOverrides: mergeAssetMap(staticPreset.sfxOverrides, saved?.sfxOverrides, isNewPresetVersion),
        vfxOverrides: mergedVfxOverrides,
        vfxConfigs: { ...(staticPreset.vfxConfigs || {}), ...(saved?.vfxConfigs || {}) },
        dungeonFloorOverrides: mergeAssetMap(staticPreset.dungeonFloorOverrides, saved?.dungeonFloorOverrides, isNewPresetVersion),
        monsterOverrides: mergedMonsterOverrides,
        monsterVideoOverrides: mergeAssetMap(staticPreset.monsterVideoOverrides, saved?.monsterVideoOverrides, isNewPresetVersion),
        mercenaryOverrides: mergeAssetMap(staticPreset.mercenaryOverrides, saved?.mercenaryOverrides, isNewPresetVersion),
        npcOverrides: mergedNpcOverrides,
        version: Math.max(saved?.version || 1, staticPreset.version || 1),
      };

      // 🌟 새로운 배포 프리셋이 로드되었거나 로컬 저장소가 없었던 경우 최신 상태를 IndexedDB에 즉시 보관
      if (isNewPresetVersion || !saved) {
        await this.saveToIdb(this.config);
      }
    } catch (err) {
      console.warn('[CustomAssetService] Failed to init custom asset storage:', err);
    } finally {
      this.isInitialized = true;
      this.emit('changed', this.config);
      this.prewarmCriticalAssets();
    }
  }

  public saveToStorage(): void {
    if (typeof window === 'undefined') return;
    this.config.version = (this.config.version || 0) + 1;
    this.saveToIdb(this.config);
    this.emit('changed', this.config);

    // 🌟 로컬 개발 서버 또는 배포 API 서버로 백그라운드 자동 동기화 (public/assets/custom_assets_preset.json 영구 반영)
    this.syncToServer().catch(() => {});
  }

  /**
   * 🌟 스튜디오에서 편집한 전체 config(아이콘, BGM, SFX 등)를 일괄 적용하고 파일시스템 및 IndexedDB에 영구 저장
   */
  public async saveAllConfig(newConfig: AssetConfigData): Promise<{ success: boolean; message?: string }> {
    if (typeof window === 'undefined') return { success: false, message: 'Window not available' };
    this.config = JSON.parse(JSON.stringify(newConfig));
    this.config.version = (this.config.version || 0) + 1;
    await this.saveToIdb(this.config);
    this.emit('changed', this.config);
    const syncRes = await this.syncToServer();
    return syncRes;
  }

  /**
   * 🌟 서버 파일시스템(public/assets/custom_assets_preset.json 및 custom_uploaded/)으로 즉시 저장
   * Vite dev server 실행 중인 경우 자동으로 물리 파일로 기록되어 git commit, npm run build, npx cap sync android에 포함됩니다.
   */
  public async syncToServer(): Promise<{ success: boolean; message?: string }> {
    if (typeof window === 'undefined') return { success: false, message: 'Window not available' };
    try {
      const res = await fetch('/api/custom-assets/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(this.config),
      });

      if (res.ok) {
        const result = await res.json();
        if (result.success && result.savedPreset) {
          // 서버에서 base64 -> 상대 파일 경로로 정규화된 프리셋으로 갱신
          this.config = { ...this.config, ...result.savedPreset };
          await this.saveToIdb(this.config);
          this.emit('changed', this.config);
          this.emit('synced', { success: true, timestamp: Date.now() });
          return { success: true, message: '로컬 파일시스템(custom_assets_preset.json)에 영구 저장 완료!' };
        }
      }
      return { success: false, message: '서버 응답 오류' };
    } catch (e: any) {
      // 모바일 환경이나 오프라인 환경 등 서버 API가 없을 때는 로컬 IndexedDB로 안전하게 동작
      return { success: false, message: e?.message || '동기화 서버 미연결' };
    }
  }

  /**
   * 서버 자동 동기화 가용 여부 확인
   */
  public async checkServerSyncStatus(): Promise<boolean> {
    if (typeof window === 'undefined') return false;
    try {
      const res = await fetch('/api/custom-assets/status');
      if (res.ok) {
        const data = await res.json();
        return !!data.serverSyncActive;
      }
    } catch (_) {}
    return false;
  }

  // ── Getters & Checkers (인메모리 0ms 동기 조회) ──────────────────────────
  public getVersion(): number {
    return this.config.version || 1;
  }

  public isPureEmojiMode(): boolean {
    return this.config.pureEmojiMode;
  }

  public isSyntheticAudioOnly(): boolean {
    return this.config.syntheticAudioOnly;
  }

  public getIconOverride(key: string): string | undefined {
    return toWebp(this.getRawIconOverride(key));
  }

  private getRawIconOverride(key: string): string | undefined {
    if (!key) return undefined;
    // 1. 직접 키 일치
    if (this.config.iconOverrides[key]) return this.config.iconOverrides[key];

    // 1-0. 보스 마도서/스킬 별칭 매핑 (e.g. book_boss_colossus_core <-> book_m_boss_floor_1)
    if (BOSS_BOOK_ALIAS_MAP[key] && this.config.iconOverrides[BOSS_BOOK_ALIAS_MAP[key]]) {
      return this.config.iconOverrides[BOSS_BOOK_ALIAS_MAP[key]];
    }

    // 1-0-1. 촉매/보급품 묶음 팩 키 자동 호환 (e.g. 'enhanced_torch_pack_10' -> 'enhanced_torch', 'prefix_stone_pack_10' -> 'prefix_stone')
    const packBaseKey = key.replace(/_pack(?:_\d+)?$/, '');
    if (packBaseKey !== key) {
      if (this.config.iconOverrides[packBaseKey]) return this.config.iconOverrides[packBaseKey];
      if (packBaseKey === 'pure_prefix' && this.config.iconOverrides['pure_prefix_stone']) return this.config.iconOverrides['pure_prefix_stone'];
      if (packBaseKey === 'pure_suffix' && this.config.iconOverrides['pure_suffix_stone']) return this.config.iconOverrides['pure_suffix_stone'];
    }
    if (key === 'pure_prefix' && this.config.iconOverrides['pure_prefix_stone']) return this.config.iconOverrides['pure_prefix_stone'];
    if (key === 'pure_suffix' && this.config.iconOverrides['pure_suffix_stone']) return this.config.iconOverrides['pure_suffix_stone'];

    // 1-1. 영지 건물 및 성채 네비게이션 휠 키 상호 호환 참조
    if (key === 'forge' && this.config.iconOverrides['blacksmith']) return this.config.iconOverrides['blacksmith'];
    if (key === 'blacksmith' && this.config.iconOverrides['forge']) return this.config.iconOverrides['forge'];
    if (key === 'arena' && this.config.iconOverrides['arenaGate']) return this.config.iconOverrides['arenaGate'];
    if (key === 'arenaGate' && this.config.iconOverrides['arena']) return this.config.iconOverrides['arena'];
    if (key === 'citadel' && this.config.iconOverrides['bonfire']) return this.config.iconOverrides['bonfire'];
    if (key === 'bonfire' && this.config.iconOverrides['citadel']) return this.config.iconOverrides['citadel'];

    // 2. 마도서(book_) <-> 스킬(skill_) 일체화 상호 참조
    if (key.startsWith('skill_')) {
      const bookKey = key.replace(/^skill_/, 'book_');
      if (this.config.iconOverrides[bookKey]) return this.config.iconOverrides[bookKey];
      if (BOSS_BOOK_ALIAS_MAP[bookKey] && this.config.iconOverrides[BOSS_BOOK_ALIAS_MAP[bookKey]]) {
        return this.config.iconOverrides[BOSS_BOOK_ALIAS_MAP[bookKey]];
      }
      const bareKey = key.replace(/^skill_/, '');
      if (this.config.iconOverrides[bareKey]) return this.config.iconOverrides[bareKey];
    } else if (key.startsWith('book_')) {
      const skillKey = key.replace(/^book_/, 'skill_');
      if (this.config.iconOverrides[skillKey]) return this.config.iconOverrides[skillKey];
      if (BOSS_BOOK_ALIAS_MAP[skillKey] && this.config.iconOverrides[BOSS_BOOK_ALIAS_MAP[skillKey]]) {
        return this.config.iconOverrides[BOSS_BOOK_ALIAS_MAP[skillKey]];
      }
      const bareKey = key.replace(/^book_/, '');
      if (this.config.iconOverrides[bareKey]) return this.config.iconOverrides[bareKey];
    } else {
      // 접두사 없는 스킬 ID (e.g. 'squire_strike') -> 'skill_' / 'book_' 매핑도 탐색
      if (this.config.iconOverrides[`skill_${key}`]) return this.config.iconOverrides[`skill_${key}`];
      if (this.config.iconOverrides[`book_${key}`]) return this.config.iconOverrides[`book_${key}`];
      const bossSkillKey = `skill_${key}`;
      if (BOSS_BOOK_ALIAS_MAP[bossSkillKey] && this.config.iconOverrides[BOSS_BOOK_ALIAS_MAP[bossSkillKey]]) {
        return this.config.iconOverrides[BOSS_BOOK_ALIAS_MAP[bossSkillKey]];
      }
      const bossBookKey = `book_${key}`;
      if (BOSS_BOOK_ALIAS_MAP[bossBookKey] && this.config.iconOverrides[BOSS_BOOK_ALIAS_MAP[bossBookKey]]) {
        return this.config.iconOverrides[BOSS_BOOK_ALIAS_MAP[bossBookKey]];
      }
    }

    // 3. 프리픽스 제거 키 일치 (e.g. 'weapon_sword' -> 'sword')
    // forge_t* / boss_uniq_* 키는 일반 장비 슬롯 오버라이드를 상속받지 않음
    if (!key.startsWith('forge_t') && !key.startsWith('boss_uniq_')) {
      const stripped = key.replace(/^(weapon_|armor_|equip_|rec_|book_|skill_)/, '');
      if (this.config.iconOverrides[stripped]) return this.config.iconOverrides[stripped];
    }

    return undefined;
  }

  public getBgmOverride(track: string): string | undefined {
    if (this.config.syntheticAudioOnly) return undefined;
    return this.config.bgmOverrides[track];
  }

  public getSfxOverride(type: string): string | undefined {
    if (this.config.syntheticAudioOnly) return undefined;
    return this.config.sfxOverrides[type];
  }

  public getVfxOverride(type: string): string | undefined {
    const raw = this.getRawVfxOverride(type);
    if (!raw) return undefined;
    // 🛡️ 레거시 webp 잔류 경로가 있다면 png로 강제 복구
    if (typeof raw === 'string' && raw.includes('/vfx/') && raw.endsWith('.webp')) {
      return raw.replace(/\.webp$/i, '.png');
    }
    return raw;
  }

  public getVfxOverrides(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [k, v] of Object.entries(this.config.vfxOverrides || {})) {
      if (typeof v === 'string' && v.includes('/vfx/') && v.endsWith('.webp')) {
        result[k] = v.replace(/\.webp$/i, '.png');
      } else {
        result[k] = v;
      }
    }
    return result;
  }

  /**
   * 🌟 게임 기동 시 유휴 시간(Idle)을 활용한 핵심 이펙트, 영웅 초상화, UI 아이콘 백그라운드 사전 디코딩
   */
  public prewarmCriticalAssets(): void {
    if (typeof window === 'undefined') return;

    // 1. 등록된 VFX 스프라이트 시트 사전 디코딩 (전투 중 0ms 즉시 재생)
    const vfxUrls = Object.values(this.config.vfxOverrides || {}).filter(Boolean);
    // 2. 클래스별 대표 초상화 사전 디코딩
    const portraitUrls = Object.values(CLASS_GENDER_PORTRAITS)
      .flatMap(p => [p.male, p.female])
      .filter(Boolean);

    const allUrls = [...new Set([...vfxUrls, ...portraitUrls])];
    const pump = () => {
      if (allUrls.length === 0) return;
      const url = allUrls.shift();
      if (url) {
        CustomAssetService.preloadImage(url).finally(() => {
          if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            (window as any).requestIdleCallback(pump, { timeout: 100 });
          } else {
            setTimeout(pump, 25);
          }
        });
      }
    };

    // 4개 파이프라인 가동
    for (let i = 0; i < 4; i++) pump();
  }

  private getRawVfxOverride(type: string): string | undefined {
    if (!type) return undefined;
    if (this.config.vfxOverrides[type]) return this.config.vfxOverrides[type];
    // 광역기(_aoe) 커스텀이 없을 경우 기본 단일기 커스텀으로 유연한 fallback
    if (type.endsWith('_aoe')) {
      const baseType = type.replace(/_aoe$/, '');
      if (this.config.vfxOverrides[baseType]) return this.config.vfxOverrides[baseType];
    }
    return undefined;
  }

  public getVfxConfig(type: string): SpriteSheetConfig | undefined {
    if (!type) return undefined;
    if (this.config.vfxConfigs?.[type]) return this.config.vfxConfigs[type];
    if (type.endsWith('_aoe')) {
      const baseType = type.replace(/_aoe$/, '');
      if (this.config.vfxConfigs?.[baseType]) return this.config.vfxConfigs[baseType];
    }
    return undefined;
  }

  public getDungeonFloorOverride(floor: number | string): string | undefined {
    const key = String(floor).replace(/^dungeon_/, '');
    const val = this.config.dungeonFloorOverrides[`dungeon_${key}`] || this.config.dungeonFloorOverrides[key];
    return toWebp(val);
  }

  public getMonsterOverride(monsterIdOrKey: string): string | undefined {
    if (!monsterIdOrKey) return undefined;
    return toWebp(this.config.monsterOverrides[monsterIdOrKey]);
  }

  public getMonsterVideoOverride(bossIdOrKey: string): string | undefined {
    if (!bossIdOrKey) return undefined;
    return this.config.monsterVideoOverrides[bossIdOrKey];
  }

  public getMercenaryOverride(classIdOrKey: string): string | undefined {
    if (!classIdOrKey) return undefined;
    return toWebp(this.config.mercenaryOverrides[classIdOrKey]);
  }

  public getGenderPortrait(classId: string, gender: 'male' | 'female' = 'male'): string {
    if (!classId) return gender === 'female' ? 'assets/portraits/portrait_paladin_female.webp' : 'assets/portraits/portrait_paladin_male.webp';
    const norm = classId.toLowerCase().replace(/^hero_/, '');
    const gKey = gender === 'female' ? 'female' : 'male';

    // 1. 개별 커스텀 오버라이드 확인 (예: 'squire_female', 'squire_male', 'paladin_female' 등)
    const specificOverride = this.config.mercenaryOverrides[`${norm}_${gKey}`] 
      || this.config.mercenaryOverrides[`hero_${norm}_${gKey}`];
    if (specificOverride) return specificOverride;

    // 2. 클래스 성별 매핑 테이블 조회
    const mapping = CLASS_GENDER_PORTRAITS[norm];
    if (mapping && mapping[gKey]) {
      return toWebp(mapping[gKey])!;
    }

    // 3. 일반 클래스 오버라이드 조회
    const generalOverride = this.config.mercenaryOverrides[norm] || this.config.mercenaryOverrides[`hero_${norm}`];
    if (generalOverride) return generalOverride;

    // 4. 기본 폴백
    return gKey === 'female' ? 'assets/portraits/portrait_paladin_female.webp' : 'assets/portraits/portrait_paladin_male.webp';
  }

  public getRandomGenderPortrait(classId: string, gender: 'male' | 'female' = 'male'): string {
    if (!classId) return this.getGenderPortrait(classId, gender);
    const norm = classId.toLowerCase().replace(/^hero_/, '');
    const gKey = gender === 'female' ? 'female' : 'male';

    // 1. 개별 커스텀 오버라이드 확인
    const specificOverride = this.config.mercenaryOverrides[`${norm}_${gKey}`] 
      || this.config.mercenaryOverrides[`hero_${norm}_${gKey}`];
    if (specificOverride) return specificOverride;

    // 2. 포트레이트 베리에이션 풀에서 랜덤 선택
    const variants = CLASS_PORTRAIT_VARIANTS[norm];
    if (variants && variants[gKey] && variants[gKey].length > 0) {
      const list = variants[gKey];
      return toWebp(list[Math.floor(Math.random() * list.length)])!;
    }

    return this.getGenderPortrait(classId, gender);
  }

  public getHeroPortrait(hero?: {
    id?: string;
    name?: string;
    classId?: string;
    gender?: 'male' | 'female';
    portraitUrl?: string;
    portraitPromptKey?: string;
  }): string {
    if (!hero) return 'assets/portraits/portrait_paladin_male.webp';

    // 1. 영웅 ID 또는 이름 기준 직접 커스텀 오버라이드 확인
    if (hero.id && this.config.mercenaryOverrides[hero.id]) {
      return toWebp(this.config.mercenaryOverrides[hero.id])!;
    }
    if (hero.name && this.config.mercenaryOverrides[hero.name]) {
      return toWebp(this.config.mercenaryOverrides[hero.name])!;
    }

    // 2. hero.portraitUrl 명시되어 있는 경우 (단, 유효한 경로인 경우)
    if (hero.portraitUrl && typeof hero.portraitUrl === 'string' && hero.portraitUrl.trim().length > 0) {
      return toWebp(hero.portraitUrl)!;
    }

    // 3. 성별 및 클래스 기반 초상화 조회
    const classId = hero.classId || (hero.portraitPromptKey ? hero.portraitPromptKey.replace(/^hero_/, '') : 'squire');
    const gender = hero.gender || (hero.name === '아이리스' ? 'female' : hero.name === '시안' ? 'male' : 'male');
    return this.getGenderPortrait(classId, gender);
  }

  public getNpcOverride(nameOrId: string): string | undefined {
    if (!nameOrId) return undefined;
    const overrides = this.config.npcOverrides;
    if (!overrides) return undefined;

    const sanitize = (val?: string): string | undefined => {
      if (!val) return undefined;
      if (typeof val === 'string' && (val.includes('________') || val.includes('___'))) {
        if (nameOrId === 'npc_lloyd' || nameOrId === '선봉대장 로이드') return 'assets/custom_uploaded/npcs/npc_lloyd.webp';
        if (nameOrId === 'npc_chief_advisor' || nameOrId === '방주 총괄 참모') return 'assets/custom_uploaded/npcs/npc_chief_advisor.webp';
        return undefined;
      }
      return toWebp(val);
    };

    // 1. 직접 키 일치 (e.g. 'npc_lloyd' or '선봉대장 로이드')
    if (overrides[nameOrId]) {
      const s = sanitize(overrides[nameOrId]);
      if (s) return s;
    }

    // 2. 한국어 NPC 이름 -> 영문 id 변환 조회
    const mappedId = NPC_NAME_TO_ID[nameOrId];
    if (mappedId && overrides[mappedId]) {
      const s = sanitize(overrides[mappedId]);
      if (s) return s;
    }

    // 3. 영문 id -> 한국어 NPC 이름 변환 조회
    const mappedName = NPC_ID_TO_NAME[nameOrId];
    if (mappedName && overrides[mappedName]) {
      const s = sanitize(overrides[mappedName]);
      if (s) return s;
    }

    // 4. 'npc_' 접두사 유무 상호 호환 조회
    if (nameOrId.startsWith('npc_')) {
      const stripped = nameOrId.replace(/^npc_/, '');
      if (overrides[stripped]) {
        const s = sanitize(overrides[stripped]);
        if (s) return s;
      }
    } else {
      const prefixed = `npc_${nameOrId}`;
      if (overrides[prefixed]) {
        const s = sanitize(overrides[prefixed]);
        if (s) return s;
      }
    }

    // 특별 폴백: 선봉대장 로이드 & 방주 총괄 참모 기본 에셋 경로
    if (nameOrId === 'npc_lloyd' || nameOrId === '선봉대장 로이드') return 'assets/custom_uploaded/npcs/npc_lloyd.webp';
    if (nameOrId === 'npc_chief_advisor' || nameOrId === '방주 총괄 참모') return 'assets/custom_uploaded/npcs/npc_chief_advisor.webp';

    return undefined;
  }

  public getElainePortrait(emotion: 'normal' | 'serious' | 'smile' | 'worry' = 'normal'): string {
    const emotionKey = `npc_elaine_${emotion}`;
    const specific = this.getNpcOverride(emotionKey);
    if (specific) return specific;
    const base = this.getNpcOverride('npc_elaine') || this.getNpcOverride('수석 오퍼레이터 일레인');
    if (base) return base;
    return 'assets/portraits/portrait_t1_scholar.webp';
  }

  public getAllConfig(): AssetConfigData {
    return JSON.parse(JSON.stringify(this.config));
  }

  // ── Setters ─────────────────────────────────────────────────────────────
  public setPureEmojiMode(enabled: boolean): void {
    this.config.pureEmojiMode = enabled;
    this.saveToStorage();
  }

  public setSyntheticAudioOnly(enabled: boolean): void {
    this.config.syntheticAudioOnly = enabled;
    this.saveToStorage();
  }

  public setIconOverride(key: string, urlOrDataUri: string | null): void {
    const val = urlOrDataUri ? urlOrDataUri.trim() : null;
    const applyVal = (k: string, v: string | null) => {
      if (!v) {
        delete this.config.iconOverrides[k];
      } else {
        this.config.iconOverrides[k] = v;
      }
    };

    applyVal(key, val);

    // 마도서(book_) 설정 시 대응하는 스킬(skill_) 아이콘도 100% 동일하게 일체화
    if (key.startsWith('book_')) {
      applyVal(key.replace(/^book_/, 'skill_'), val);
    } else if (key.startsWith('skill_')) {
      applyVal(key.replace(/^skill_/, 'book_'), val);
    }

    // 영지 시설 / 휠 버튼 상호 일원화 동기화
    if (key === 'blacksmith') applyVal('forge', val);
    else if (key === 'forge') applyVal('blacksmith', val);
    else if (key === 'arenaGate') applyVal('arena', val);
    else if (key === 'arena') applyVal('arenaGate', val);

    this.saveToStorage();
  }

  public setBgmOverride(track: string, url: string | null): void {
    if (!url) {
      delete this.config.bgmOverrides[track];
    } else {
      this.config.bgmOverrides[track] = url.trim();
    }
    this.saveToStorage();
  }

  public setSfxOverride(type: string, url: string | null): void {
    if (!url) {
      delete this.config.sfxOverrides[type];
    } else {
      this.config.sfxOverrides[type] = url.trim();
    }
    this.saveToStorage();
  }

  public setVfxOverride(type: string, urlOrDataUri: string | null): void {
    if (!urlOrDataUri) {
      delete this.config.vfxOverrides[type];
    } else {
      this.config.vfxOverrides[type] = urlOrDataUri.trim();
    }
    this.saveToStorage();
  }

  public setVfxConfig(type: string, cfg: SpriteSheetConfig | null): void {
    if (!this.config.vfxConfigs) {
      this.config.vfxConfigs = {};
    }
    if (!cfg) {
      delete this.config.vfxConfigs[type];
    } else {
      this.config.vfxConfigs[type] = { ...cfg };
    }
    this.saveToStorage();
  }

  public setDungeonFloorOverride(floor: number | string, urlOrDataUri: string | null): void {
    const key = `dungeon_${String(floor).replace(/^dungeon_/, '')}`;
    if (!urlOrDataUri) {
      delete this.config.dungeonFloorOverrides[key];
      delete this.config.dungeonFloorOverrides[String(floor)];
    } else {
      this.config.dungeonFloorOverrides[key] = urlOrDataUri.trim();
    }
    this.saveToStorage();
  }

  public setMonsterOverride(monsterIdOrKey: string, urlOrDataUri: string | null): void {
    if (!urlOrDataUri) {
      delete this.config.monsterOverrides[monsterIdOrKey];
    } else {
      this.config.monsterOverrides[monsterIdOrKey] = urlOrDataUri.trim();
    }
    this.saveToStorage();
  }

  public setMonsterVideoOverride(bossIdOrKey: string, urlOrDataUri: string | null): void {
    if (!urlOrDataUri) {
      delete this.config.monsterVideoOverrides[bossIdOrKey];
    } else {
      this.config.monsterVideoOverrides[bossIdOrKey] = urlOrDataUri.trim();
    }
    this.saveToStorage();
  }

  public setMercenaryOverride(classIdOrKey: string, urlOrDataUri: string | null): void {
    if (!classIdOrKey) return;
    if (!urlOrDataUri) {
      delete this.config.mercenaryOverrides[classIdOrKey];
    } else {
      this.config.mercenaryOverrides[classIdOrKey] = urlOrDataUri.trim();
    }
    this.saveToStorage();
  }

  public setNpcOverride(nameOrId: string, urlOrDataUri: string | null): void {
    if (!nameOrId) return;
    if (!this.config.npcOverrides) {
      this.config.npcOverrides = {};
    }

    const mappedId = NPC_NAME_TO_ID[nameOrId];
    const mappedName = NPC_ID_TO_NAME[nameOrId];

    if (!urlOrDataUri) {
      delete this.config.npcOverrides[nameOrId];
      if (mappedId) delete this.config.npcOverrides[mappedId];
      if (mappedName) delete this.config.npcOverrides[mappedName];
    } else {
      const val = urlOrDataUri.trim();
      this.config.npcOverrides[nameOrId] = val;
      // name과 id 둘 다 동기화 저장하여 조회 시 0ms 즉시 보장
      if (mappedId) this.config.npcOverrides[mappedId] = val;
      if (mappedName) this.config.npcOverrides[mappedName] = val;
    }
    this.saveToStorage();
  }

  public resetToDefaults(): void {
    this.config = {
      pureEmojiMode: false,
      syntheticAudioOnly: false,
      iconOverrides: {},
      bgmOverrides: {},
      sfxOverrides: {},
      vfxOverrides: {},
      vfxConfigs: {},
      dungeonFloorOverrides: {},
      monsterOverrides: {},
      monsterVideoOverrides: {},
      mercenaryOverrides: {},
      npcOverrides: {},
      version: 1,
    };
    this.saveToStorage();
  }

  // ── JSON 파일 내보내기 및 가져오기 (배포/Deploy용) ────────────────────────
  public exportToJsonString(): string {
    return JSON.stringify(this.config, null, 2);
  }

  public importFromJsonString(jsonStr: string): boolean {
    try {
      const parsed = JSON.parse(jsonStr);
      if (typeof parsed !== 'object' || !parsed) return false;
      this.config = {
        pureEmojiMode: !!parsed.pureEmojiMode,
        syntheticAudioOnly: !!parsed.syntheticAudioOnly,
        iconOverrides: parsed.iconOverrides || {},
        bgmOverrides: parsed.bgmOverrides || {},
        sfxOverrides: parsed.sfxOverrides || {},
        vfxOverrides: parsed.vfxOverrides || {},
        vfxConfigs: parsed.vfxConfigs || {},
        dungeonFloorOverrides: parsed.dungeonFloorOverrides || {},
        monsterOverrides: parsed.monsterOverrides || {},
        monsterVideoOverrides: parsed.monsterVideoOverrides || {},
        mercenaryOverrides: parsed.mercenaryOverrides || {},
        npcOverrides: parsed.npcOverrides || {},
        version: (this.config.version || 1) + 1,
      };
      this.saveToStorage();
      return true;
    } catch (err) {
      console.error('[CustomAssetService] Failed to import JSON config:', err);
      return false;
    }
  }
}
